import test from "node:test";
import assert from "node:assert/strict";
import {
  createBoard,
  addTask,
  writeField,
  mergeBoards,
  materialize,
  validateBoard,
  seal,
  unseal,
  packetize,
  Collector,
} from "../src/ledger.js";
const initial = () =>
  addTask(createBoard("Repair day"), "Welcome table", "Mariam", "Adeel");
test("parallel updates survive either merge order and explicit resolution", () => {
  const base = initial(),
    id = materialize(base)[0].id;
  const a = writeField(base, id, "status", "done", "Mariam"),
    b = writeField(base, id, "status", "active", "Adeel");
  const ab = mergeBoards(a, b),
    ba = mergeBoards(b, a);
  assert.deepEqual(materialize(ab), materialize(ba));
  assert.equal(materialize(ab)[0].conflicts.status.length, 2);
  const resolved = writeField(ab, id, "status", "active", "Coordinator");
  assert.equal(materialize(resolved)[0].conflicts.status, undefined);
  assert.equal(
    materialize(mergeBoards(resolved, a))[0].values.status,
    "active",
  );
});
test("different fields merge without a conflict; repeated import is idempotent", () => {
  const base = initial(),
    id = materialize(base)[0].id;
  const a = writeField(base, id, "notes", "Bring spare pens.", "Adeel"),
    b = writeField(base, id, "status", "done", "Mariam");
  const merged = mergeBoards(a, b);
  assert.deepEqual(materialize(merged)[0].conflicts, {});
  assert.equal(mergeBoards(merged, a).events.length, merged.events.length);
});
test("malformed causality and conflicting event identities are rejected", () => {
  const base = initial();
  const bad = structuredClone(base);
  bad.events[0].parents = ["not-a-real-event"];
  assert.throws(() => validateBoard(bad));
  const collision = structuredClone(base);
  collision.events[0].value = "Different title";
  assert.throws(() => mergeBoards(base, collision));
  assert.throws(() => mergeBoards(base, createBoard("Other board")));
});
test("encrypted transfer authenticates data, rejects wrong key and alteration", async () => {
  const base = initial(),
    text = await seal(base, "four words make a phrase");
  assert.deepEqual(
    await unseal(text, "four words make a phrase"),
    validateBoard(base),
  );
  await assert.rejects(() => unseal(text, "another wrong passphrase"));
  const env = JSON.parse(text);
  env.data = env.data.slice(0, -4) + "AAAA";
  await assert.rejects(() =>
    unseal(JSON.stringify(env), "four words make a phrase"),
  );
});
test("packet collection accepts shuffled duplicates, exposes missing frames and rejects corruption", async () => {
  const text = await seal(initial(), "four words make a phrase");
  const frames = await packetize(text, 100);
  const c = new Collector();
  await c.add(frames[2]);
  await c.add(frames[2]);
  assert.equal(c.count, 1);
  assert.ok(c.missing.length > 0);
  for (const frame of [...frames].reverse()) await c.add(frame);
  assert.equal(await c.finish(), text);
  const d = new Collector();
  const other = await packetize(text + " ");
  await d.add(frames[0]);
  await assert.rejects(() => d.add(other[0]));
});
test("prototype property names cannot become task fields", () => {
  const base = initial(),
    id = materialize(base)[0].id;
  assert.throws(() => writeField(base, id, "constructor", "bad", "Adeel"));
});
test("board creation works in an HTTP preview without randomUUID", () => {
  const previous = crypto.randomUUID;
  crypto.randomUUID = undefined;
  try {
    assert.match(createBoard("Preview board").id, /^[a-f0-9]{32}$/);
  } finally {
    crypto.randomUUID = previous;
  }
});
test("a stale task form preserves an unseen concurrent edit", async () => {
  const { editTask } = await import("../src/ledger.js");
  const base = initial(),
    id = materialize(base)[0].id;
  const current = writeField(base, id, "notes", "Use the green box.", "Mariam");
  const saved = editTask(
    current,
    base,
    id,
    { notes: "Use the blue box." },
    "Adeel",
  );
  assert.equal(materialize(saved)[0].conflicts.notes.length, 2);
});
test("a 65-way accepted conflict can be explicitly resolved", () => {
  const base = initial(),
    id = materialize(base)[0].id;
  let merged = base;
  for (let i = 0; i < 65; i++)
    merged = mergeBoards(
      merged,
      writeField(base, id, "owner", `Volunteer ${i}`, "Coordinator"),
    );
  assert.equal(materialize(merged)[0].conflicts.owner.length, 65);
  const resolved = writeField(
    merged,
    id,
    "owner",
    "Chosen volunteer",
    "Coordinator",
  );
  assert.equal(materialize(resolved)[0].conflicts.owner, undefined);
});
