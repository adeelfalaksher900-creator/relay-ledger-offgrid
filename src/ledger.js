const encoder = new TextEncoder(),
  decoder = new TextDecoder("utf-8", { fatal: true });
export const limits = {
  events: 500,
  tasks: 60,
  plainBytes: 131072,
  fileBytes: 196608,
  frames: 256,
};
const fields = { title: 100, owner: 40, notes: 800, status: 12 };
const statuses = new Set(["ready", "active", "done"]);
const idPattern = /^[a-zA-Z0-9_-]{8,80}$/;
const validId = (x) => typeof x === "string" && idPattern.test(x);
const uuid = () =>
  crypto.randomUUID?.() ||
  [...crypto.getRandomValues(new Uint8Array(16))]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
const requireValue = (field, value) => {
  if (
    !Object.hasOwn(fields, field) ||
    typeof value !== "string" ||
    value.length > fields[field]
  )
    throw Error("An update contains an unsupported field or too much text.");
  if (field === "title" && !value.trim())
    throw Error("A task title is required.");
  if (field === "status" && !statuses.has(value))
    throw Error("An update contains an invalid task status.");
};
export function createBoard(title) {
  if (typeof title !== "string" || !title.trim() || title.length > 100)
    throw Error("Use a board name between 1 and 100 characters.");
  return {
    v: 1,
    id: uuid(),
    title: title.trim(),
    created: Date.now(),
    events: [],
  };
}
export function validateBoard(input) {
  if (
    !input ||
    input.v !== 1 ||
    !validId(input.id) ||
    typeof input.title !== "string" ||
    !input.title.trim() ||
    input.title.length > 100 ||
    !Number.isSafeInteger(input.created) ||
    input.created < 0 ||
    input.created > 1e13 ||
    !Array.isArray(input.events) ||
    input.events.length > limits.events
  )
    throw Error("This is not a supported Relay Ledger board.");
  if (encoder.encode(JSON.stringify(input)).length > limits.plainBytes)
    throw Error(
      "This board is too large. The prototype supports 128 KiB of board data.",
    );
  const ids = new Map(),
    tasks = new Set();
  const events = input.events.map((e) => {
    if (
      !e ||
      !validId(e.id) ||
      !validId(e.task) ||
      typeof e.author !== "string" ||
      !e.author.trim() ||
      e.author.length > 60 ||
      !Number.isSafeInteger(e.time) ||
      e.time < 0 ||
      e.time > 1e13 ||
      !Array.isArray(e.parents) ||
      e.parents.length > limits.events ||
      e.parents.some((p) => !validId(p)) ||
      new Set(e.parents).size !== e.parents.length
    )
      throw Error("An update has invalid identity, authorship or parent data.");
    requireValue(e.field, e.value);
    if (ids.has(e.id)) throw Error("Duplicate update identity.");
    const event = {
      id: e.id,
      task: e.task,
      field: e.field,
      value: e.value,
      parents: [...e.parents].sort(),
      author: e.author,
      time: e.time,
    };
    ids.set(e.id, event);
    tasks.add(e.task);
    return event;
  });
  if (tasks.size > limits.tasks)
    throw Error("This prototype supports up to 60 tasks per board.");
  const visited = new Set(),
    visiting = new Set();
  function visit(e) {
    if (visited.has(e.id)) return;
    if (visiting.has(e.id)) throw Error("An update contains a causal cycle.");
    visiting.add(e.id);
    for (const p of e.parents) {
      const parent = ids.get(p);
      if (!parent || parent.task !== e.task || parent.field !== e.field)
        throw Error("An update is missing a valid parent in the same field.");
      visit(parent);
    }
    visiting.delete(e.id);
    visited.add(e.id);
  }
  for (const e of events) visit(e);
  for (const t of tasks)
    if (!events.some((e) => e.task === t && e.field === "title"))
      throw Error("A task is missing its title.");
  return {
    v: 1,
    id: input.id,
    title: input.title,
    created: input.created,
    events: events.sort((a, b) => a.id.localeCompare(b.id)),
  };
}
export function heads(board, task, field) {
  const events = board.events.filter(
      (e) => e.task === task && e.field === field,
    ),
    parents = new Set(events.flatMap((e) => e.parents));
  return events
    .filter((e) => !parents.has(e.id))
    .sort((a, b) => a.id.localeCompare(b.id));
}
export function writeField(board, task, field, value, author) {
  requireValue(field, value);
  const event = {
    id: uuid(),
    task,
    field,
    value,
    parents: heads(board, task, field).map((e) => e.id),
    author: author.trim() || "Unnamed device",
    time: Date.now(),
  };
  return validateBoard({ ...board, events: [...board.events, event] });
}
export function addTask(board, title, owner, author) {
  const task = uuid();
  let next = board;
  for (const [field, value] of Object.entries({
    title: title.trim(),
    owner: owner.trim(),
    status: "ready",
    notes: "",
  }))
    next = writeField(next, task, field, value, author);
  return next;
}
export function editTask(current, opened, task, changes, author) {
  const snapshot = validateBoard(opened);
  const original = materialize(snapshot).find((t) => t.id === task);
  if (!original) throw Error("This task is no longer available.");
  let edited = snapshot;
  for (const [field, value] of Object.entries(changes)) {
    requireValue(field, value);
    if (value !== original.values[field])
      edited = writeField(edited, task, field, value, author);
  }
  return mergeBoards(current, edited);
}
export function materialize(board) {
  return [...new Set(board.events.map((e) => e.task))].sort().map((id) => {
    const values = {},
      conflicts = {};
    for (const field of Object.keys(fields)) {
      const h = heads(board, id, field);
      values[field] = h[0]?.value ?? (field === "status" ? "ready" : "");
      if (new Set(h.map((e) => e.value)).size > 1) conflicts[field] = h;
    }
    const count = board.events.filter((e) => e.task === id).length;
    return { id, values, conflicts, count };
  });
}
export function mergeBoards(local, incoming) {
  const a = validateBoard(local),
    b = validateBoard(incoming);
  if (a.id !== b.id || a.title !== b.title || a.created !== b.created)
    throw Error(
      "These are different boards. Open the incoming board as a separate workspace.",
    );
  const map = new Map(a.events.map((e) => [e.id, e]));
  for (const e of b.events) {
    const prior = map.get(e.id);
    if (prior && JSON.stringify(prior) !== JSON.stringify(e))
      throw Error(
        "An update identity was reused with different contents. Nothing was merged.",
      );
    map.set(e.id, e);
  }
  return validateBoard({ ...a, events: [...map.values()] });
}
function b64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 8192)
    s += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(s);
}
function unb64(s, max = limits.fileBytes) {
  if (
    typeof s !== "string" ||
    s.length > Math.ceil(max / 3) * 4 ||
    s.length % 4 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(s)
  )
    throw Error("Invalid encoded transfer data.");
  const raw = atob(s);
  if (raw.length > max) throw Error("Transfer data exceeds the size limit.");
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
async function keyFor(pass, salt) {
  if (!crypto.subtle)
    throw Error(
      "Encrypted handoffs need HTTPS or a localhost installation. Open the hosted app to use Exchange.",
    );
  if (typeof pass !== "string" || pass.length < 12 || pass.length > 200)
    throw Error(
      "Use a passphrase of 12–200 characters. Four unrelated words are a good start.",
    );
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pass),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
const aad = encoder.encode("RelayLedger/1");
export async function seal(board, pass) {
  const plain = encoder.encode(JSON.stringify(validateBoard(board))),
    salt = crypto.getRandomValues(new Uint8Array(16)),
    iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFor(pass, salt);
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad, tagLength: 128 },
    key,
    plain,
  );
  return JSON.stringify({
    format: "relay-ledger",
    v: 1,
    salt: b64(salt),
    iv: b64(iv),
    data: b64(new Uint8Array(data)),
  });
}
export async function unseal(text, pass) {
  if (
    typeof text !== "string" ||
    encoder.encode(text).length > limits.fileBytes
  )
    throw Error("The handoff file is too large.");
  let env;
  try {
    env = JSON.parse(text);
  } catch {
    throw Error("Choose a Relay Ledger handoff file.");
  }
  if (env.format !== "relay-ledger" || env.v !== 1)
    throw Error("Unsupported handoff format.");
  const salt = unb64(env.salt, 16),
    iv = unb64(env.iv, 12),
    data = unb64(env.data, limits.plainBytes + 16);
  if (salt.length !== 16 || iv.length !== 12)
    throw Error("Invalid encryption metadata.");
  const key = await keyFor(pass, salt);
  let plain;
  try {
    plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: aad, tagLength: 128 },
      key,
      data,
    );
  } catch {
    throw Error(
      "The passphrase does not match, or this handoff was altered. Nothing was imported.",
    );
  }
  return validateBoard(JSON.parse(decoder.decode(plain)));
}
export async function digest(text) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", encoder.encode(text)),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export async function packetize(text, size = 600) {
  if (!Number.isInteger(size) || size < 100 || size > 600)
    throw Error("Invalid packet size.");
  const data = b64(encoder.encode(text)),
    total = Math.ceil(data.length / size);
  if (total > limits.frames)
    throw Error(
      "This board is too large for QR. Use the encrypted file instead.",
    );
  const hash = await digest(text);
  return Array.from(
    { length: total },
    (_, i) =>
      `RL1|${hash}|${i}|${total}|${data.slice(i * size, (i + 1) * size)}`,
  );
}
export class Collector {
  constructor() {
    this.hash = null;
    this.total = 0;
    this.parts = new Map();
  }
  get count() {
    return this.parts.size;
  }
  get missing() {
    return Array.from({ length: this.total }, (_, i) => i).filter(
      (i) => !this.parts.has(i),
    );
  }
  async add(frame) {
    if (typeof frame !== "string" || frame.length > 720)
      throw Error("Invalid QR packet.");
    const [magic, hash, indexText, totalText, data, ...extra] =
        frame.split("|"),
      index = Number(indexText),
      total = Number(totalText);
    if (
      extra.length ||
      magic !== "RL1" ||
      !/^[0-9a-f]{64}$/.test(hash) ||
      !/^\d{1,3}$/.test(indexText) ||
      !/^\d{1,3}$/.test(totalText) ||
      !Number.isInteger(index) ||
      !Number.isInteger(total) ||
      total < 1 ||
      total > limits.frames ||
      index < 0 ||
      index >= total ||
      !data ||
      data.length > 600 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(data)
    )
      throw Error("This image is not a supported Relay Ledger QR packet.");
    if (this.hash && (this.hash !== hash || this.total !== total))
      throw Error(
        "This packet belongs to another handoff. Finish or reset the receiver first.",
      );
    if (this.parts.has(index) && this.parts.get(index) !== data)
      throw Error("A QR packet was altered.");
    this.hash = hash;
    this.total = total;
    this.parts.set(index, data);
  }
  async finish() {
    if (this.missing.length || !this.total)
      throw Error("Some QR packets are still missing.");
    const text = decoder.decode(
      unb64(
        Array.from({ length: this.total }, (_, i) => this.parts.get(i)).join(
          "",
        ),
      ),
    );
    if ((await digest(text)) !== this.hash)
      throw Error("The collected QR data failed its integrity check.");
    return text;
  }
}
export function demoBoard() {
  let b = createBoard("Community repair day");
  for (const [title, owner, notes, status] of [
    [
      "Sort donated tools",
      "Jamie",
      "Group useful tools and label the boxes.",
      "ready",
    ],
    [
      "Set up the welcome table",
      "Mariam",
      "Sign-in sheets, name labels and event information.",
      "ready",
    ],
    [
      "Put up directional signs",
      "Adeel",
      "At the gate, workshop and toilets.",
      "ready",
    ],
    [
      "Check extension leads",
      "Adeel",
      "Four checked. Two set aside for repair.",
      "active",
    ],
    [
      "Prepare paint station",
      "Sam",
      "Lay out brushes, rollers and dust sheets.",
      "active",
    ],
    [
      "Clear the workshop",
      "Jamie",
      "Sweep the floor and set out the bins.",
      "done",
    ],
  ]) {
    b = addTask(b, title, owner, "Coordinator");
    const t = materialize(b).find((t) => t.values.title === title);
    b = writeField(b, t.id, "notes", notes, "Coordinator");
    if (status !== "ready")
      b = writeField(b, t.id, "status", status, "Coordinator");
  }
  const t = materialize(b).find(
    (t) => t.values.title === "Set up the welcome table",
  );
  const a = writeField(b, t.id, "status", "done", "Mariam"),
    c = writeField(b, t.id, "status", "active", "Adeel");
  return mergeBoards(a, c);
}
