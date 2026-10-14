import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Leaf,
  ArrowsLeftRight,
  ClockCounterClockwise,
  BookOpen,
  WifiSlash,
  CheckCircle,
  Plus,
  WarningCircle,
  ArrowRight,
  DownloadSimple,
  UploadSimple,
  LockKey,
  QrCode,
  Camera,
  Stop,
  Play,
  Pause,
  X,
  Eye,
  EyeSlash,
  ClipboardText,
} from "@phosphor-icons/react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import {
  createBoard,
  addTask,
  editTask,
  writeField,
  mergeBoards,
  materialize,
  validateBoard,
  demoBoard,
  seal,
  unseal,
  packetize,
  Collector,
  limits,
} from "./ledger.js";
import { CameraLease } from "./media.js";
const storageKey = "relay-ledger-board-v1";
const statusNames = { ready: "Ready", active: "In progress", done: "Done" };
const fieldNames = {
  title: "Task title",
  status: "Status",
  owner: "Owner",
  notes: "Notes",
};
function readInitial() {
  try {
    const raw = localStorage.getItem(storageKey);
    return {
      board: raw ? validateBoard(JSON.parse(raw)) : demoBoard(),
      error: "",
    };
  } catch {
    return {
      board: demoBoard(),
      error:
        "The saved workspace could not be read. Your existing data has not been overwritten. Export its stored copy before starting again.",
    };
  }
}
function download(text, name, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Secret({
  value,
  onChange,
  label = "Handoff passphrase",
  disabled = false,
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="field">
      {label}
      <div className="secret">
        <input
          type={show ? "text" : "password"}
          aria-label={label}
          autoComplete="off"
          value={value}
          maxLength={200}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          aria-label={show ? "Hide passphrase" : "Show passphrase"}
          onClick={() => setShow(!show)}
        >
          {show ? <EyeSlash /> : <Eye />}
        </button>
      </div>
      <small>
        At least 12 characters. Share it separately with someone you trust.
      </small>
    </label>
  );
}
function Modal({ open, onOpenChange, title, description, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="modal">
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
          {children}
          <Dialog.Close className="icon close" aria-label="Close dialog">
            <X />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function TaskForm({ task, save }) {
  const [title, setTitle] = useState(task?.values.title || ""),
    [owner, setOwner] = useState(task?.values.owner || ""),
    [notes, setNotes] = useState(task?.values.notes || ""),
    [status, setStatus] = useState(task?.values.status || "ready"),
    [error, setError] = useState("");
  const ref = useRef();
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) {
          setError("Enter a task title.");
          ref.current.focus();
          return;
        }
        try {
          save({ title: title.trim(), owner: owner.trim(), notes, status });
        } catch (e) {
          setError(e.message);
        }
      }}
    >
      <label className="field">
        Task title
        <input
          ref={ref}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          aria-invalid={!!error}
          aria-describedby={error ? "task-error" : undefined}
        />
      </label>
      <div className="form-grid">
        <label className="field">
          Owner
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            maxLength={40}
          />
        </label>
        <label className="field">
          Status
          <select
            aria-label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {Object.entries(statusNames).map(([v, n]) => (
              <option key={v} value={v}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        Notes
        <textarea
          className="resize-none"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={800}
          rows={4}
        />
      </label>
      {error && (
        <p id="task-error" role="alert" className="error">
          {error}
        </p>
      )}
      <button className="primary" type="submit">
        {task ? "Save task update" : "Add task"}
      </button>
    </form>
  );
}
function Guide() {
  return (
    <section className="guide">
      <p className="eyebrow">SMALL HANDOFFS. BIG CONTINUITY.</p>
      <h1>
        The network is optional.
        <br />
        The work is not.
      </h1>
      <p className="lede">
        For community crews, student clubs and volunteer shifts. Keep a shared
        checklist moving when connectivity does not.
      </p>
      <div className="guide-grid">
        <article>
          <h2>Start together</h2>
          <p>
            Create a board, add tasks and give the other device an encrypted
            handoff. Open the app once while connected and wait for “Offline
            ready” on each device.
          </p>
        </article>
        <article>
          <h2>Work independently</h2>
          <p>
            Update tasks on each device. Local changes stay here until you
            explicitly exchange them. There is no hidden cloud sync.
          </p>
        </article>
        <article>
          <h2>Meet and exchange</h2>
          <p>
            Import an encrypted file, scan the repeating QR stream, or load QR
            images. Missing frames can arrive later. Review the incoming board
            before merging.
          </p>
        </article>
        <article>
          <h2>Decide together</h2>
          <p>
            Different tasks and fields combine automatically. Two differing
            updates to the same field stay visible until you choose a
            resolution. Old imports cannot erase that decision.
          </p>
        </article>
      </div>
      <section className="boundary">
        <h2>A clear boundary</h2>
        <p>
          Local workspace data is stored as plaintext in this browser. Handoff
          files use AES-256-GCM with a passphrase-derived key. A passphrase
          holder can edit the board and author names are self-reported labels.
          This is a collaboration prototype, not a verified audit system or
          emergency dispatch tool.
        </p>
        <p>
          First installation needs connectivity. Browser storage can be cleared
          or evicted: keep an encrypted file backup. Camera scanning depends on
          device, light and focus; file exchange remains the fallback. Boards
          support 60 tasks, 500 updates and 128 KiB of data. Large boards may
          exceed the QR limit.
        </p>
        <p>
          No account, database, telemetry, external fonts or data upload
          endpoint. Hosting sees ordinary app requests. Nothing is sent merely
          because the browser reconnects.
        </p>
      </section>
    </section>
  );
}
function Exchange({ board, commit, message }) {
  const [mode, setMode] = useState("send"),
    [pass, setPass] = useState(""),
    [prepared, setPrepared] = useState(null),
    [frames, setFrames] = useState([]),
    [frame, setFrame] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState("1200"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [incoming, setIncoming] = useState(null),
    [raw, setRaw] = useState(""),
    [progress, setProgress] = useState({ count: 0, total: 0 }),
    [camera, setCamera] = useState(false);
  const collector = useRef(new Collector()),
    video = useRef(),
    cameraLease = useRef(new CameraLease()),
    cameraRequest = useRef(0),
    scanning = useRef(false),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    if (cameraLease.current.closed) cameraLease.current = new CameraLease();
    return () => {
      alive.current = false;
      scanning.current = false;
      cameraLease.current.close();
    };
  }, []);
  useEffect(() => {
    if (!playing || !frames.length) return;
    const id = setInterval(
      () => setFrame((x) => (x + 1) % frames.length),
      Number(speed),
    );
    return () => clearInterval(id);
  }, [playing, frames, speed]);
  const [qr, setQR] = useState("");
  useEffect(() => {
    let current = true;
    if (frames[frame])
      QRCode.toDataURL(frames[frame], {
        width: 600,
        margin: 4,
        errorCorrectionLevel: "M",
        color: { dark: "#172A24", light: "#FFFFFF" },
      }).then((data) => {
        if (current) setQR(data);
      });
    return () => {
      current = false;
    };
  }, [frames, frame]);
  function stopCamera() {
    cameraRequest.current++;
    scanning.current = false;
    cameraLease.current.stop();
    setCamera(false);
  }
  function changeMode(v) {
    stopCamera();
    setMode(v);
    setPass("");
    setError("");
    setPlaying(false);
  }
  async function prepare() {
    setBusy(true);
    setError("");
    try {
      const data = await seal(board, pass);
      setPrepared({ data, count: board.events.length });
      try {
        const p = await packetize(data);
        setFrames(p);
        setFrame(0);
        setPlaying(false);
      } catch (e) {
        setFrames([]);
        setError(e.message);
      }
      message("Encrypted snapshot prepared locally.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function receive(text) {
    setRaw(text);
    setIncoming(null);
    setBusy(true);
    setError("");
    try {
      const b = await unseal(text, pass);
      setIncoming(b);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function addFrame(text) {
    await collector.current.add(text);
    setProgress({
      count: collector.current.count,
      total: collector.current.total,
    });
    if (collector.current.count === collector.current.total) {
      stopCamera();
      await receive(await collector.current.finish());
    }
  }
  async function images(files) {
    setError("");
    setBusy(true);
    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024)
          throw Error("Use QR images below 10 MB.");
        const bitmap = await createImageBitmap(file);
        if (bitmap.width * bitmap.height > 8000000) {
          bitmap.close();
          throw Error("Use QR images below 8 megapixels.");
        }
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(pixels.data, pixels.width, pixels.height, {
          inversionAttempts: "attemptBoth",
        });
        if (!result)
          throw Error(
            "No readable QR was found in " +
              file.name +
              ". Keep the full code and white border visible.",
          );
        await addFrame(result.data);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function startCamera() {
    setError("");
    if (pass.length < 12) {
      setError("Enter the handoff passphrase before starting the camera.");
      return;
    }
    const request = ++cameraRequest.current;
    try {
      const lease = cameraLease.current;
      const acquired = await lease.acquire(() =>
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        }),
      );
      if (!acquired || !alive.current) return;
      setCamera(true);
      scanning.current = true;
      setTimeout(async () => {
        if (lease.stream !== acquired) return;
        if (!video.current || !alive.current) {
          lease.stop();
          return;
        }
        video.current.srcObject = acquired;
        try {
          await video.current.play();
        } catch {
          if (alive.current) stopCamera();
          else lease.stop();
          return;
        }
        const canvas = document.createElement("canvas"),
          ctx = canvas.getContext("2d", { willReadFrequently: true });
        async function scan() {
          if (!scanning.current || !alive.current) return;
          if (video.current?.readyState >= 2) {
            const width = Math.min(video.current.videoWidth, 1000),
              height = Math.round(
                (video.current.videoHeight * width) / video.current.videoWidth,
              );
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(video.current, 0, 0, width, height);
            const pixels = ctx.getImageData(0, 0, width, height);
            const result = jsQR(pixels.data, width, height);
            if (result) {
              try {
                await addFrame(result.data);
              } catch (e) {
                setError(e.message);
                stopCamera();
              }
            }
          }
          if (scanning.current) setTimeout(scan, 300);
        }
        scan();
      }, 0);
    } catch {
      if (!alive.current || request !== cameraRequest.current) return;
      stopCamera();
      setError(
        "Camera access is unavailable. Use QR images or the encrypted handoff file.",
      );
    }
  }
  return (
    <section>
      <p className="eyebrow">A HANDOFF, NOT A CLOUD UPLOAD</p>
      <div className="page-heading">
        <div>
          <h1>Take the board with you.</h1>
          <p className="lede">
            Two devices. One shared context. No server in between.
          </p>
        </div>
      </div>
      <div className="segmented" role="group" aria-label="Exchange direction">
        <button
          aria-pressed={mode === "send"}
          onClick={() => changeMode("send")}
        >
          <ArrowsLeftRight />
          Send a handoff
        </button>
        <button
          aria-pressed={mode === "receive"}
          onClick={() => changeMode("receive")}
        >
          <UploadSimple />
          Receive a handoff
        </button>
      </div>
      <div className="exchange-grid">
        <section className="panel">
          <h2>
            {mode === "send"
              ? "Prepare an encrypted snapshot"
              : "Collect and review updates"}
          </h2>
          <p>
            {mode === "send"
              ? "The snapshot includes this board’s full update history. Keep the passphrase separate from the file and screen."
              : "Enter the sender’s passphrase. Nothing changes until you review and confirm the incoming board."}
          </p>
          <Secret value={pass} onChange={setPass} disabled={busy} />
          {mode === "send" ? (
            <>
              <button className="primary" onClick={prepare} disabled={busy}>
                {busy ? "Encrypting…" : "Prepare handoff"}
                <LockKey />
              </button>
              {prepared && (
                <div className="prepared">
                  <CheckCircle />
                  <div>
                    <strong>{prepared.count} updates in this snapshot</strong>
                    <p>
                      {prepared.count !== board.events.length
                        ? "The board changed since preparation. Prepare a new handoff to include the latest updates."
                        : "Ready to save or show on this screen."}
                    </p>
                    <button
                      onClick={() =>
                        download(prepared.data, "relay-ledger-handoff.relay")
                      }
                    >
                      <DownloadSimple />
                      Save encrypted file
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <label className="file-button">
                <UploadSimple />
                Choose encrypted file
                <input
                  type="file"
                  accept=".relay,application/json"
                  disabled={busy}
                  onChange={async (e) => {
                    const f = e.target.files[0];
                    e.target.value = "";
                    if (!f) return;
                    if (f.size > limits.fileBytes) {
                      setError("The handoff file is too large.");
                      return;
                    }
                    await receive(await f.text());
                  }}
                />
              </label>
              <label className="file-button">
                <QrCode />
                Load QR images
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  disabled={busy}
                  onChange={(e) => {
                    const fs = [...e.target.files];
                    e.target.value = "";
                    images(fs);
                  }}
                />
              </label>
              <button
                onClick={camera ? stopCamera : startCamera}
                disabled={busy}
              >
                {camera ? <Stop /> : <Camera />}
                {camera ? "Stop camera" : "Start camera"}
              </button>
              {camera && (
                <video className="camera" ref={video} muted playsInline />
              )}
              {progress.total > 0 && (
                <div className="progress">
                  <strong>
                    {progress.count} of {progress.total} QR packets collected
                  </strong>
                  <progress value={progress.count} max={progress.total} />
                  <p>
                    {progress.count === progress.total
                      ? "All packets collected. Checking the encrypted snapshot."
                      : `${progress.total - progress.count} still missing. Keep scanning or load more images.`}
                  </p>
                  <button
                    onClick={() => {
                      stopCamera();
                      collector.current = new Collector();
                      setProgress({ count: 0, total: 0 });
                      setIncoming(null);
                      setRaw("");
                    }}
                  >
                    Reset QR receiver
                  </button>
                </div>
              )}
              {raw && !incoming && (
                <button onClick={() => receive(raw)} disabled={busy}>
                  Try this handoff again
                </button>
              )}
              {busy && <p role="status">Checking locally…</p>}
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>
        <section className="panel preview-panel">
          {mode === "send" ? (
            frames.length ? (
              <>
                <div className="qr-heading">
                  <h2>Screen-to-camera handoff</h2>
                  <span>
                    {frame + 1} / {frames.length}
                  </span>
                </div>
                <img
                  className="qr"
                  src={qr}
                  alt={`Encrypted QR packet ${frame + 1} of ${frames.length}`}
                />
                <div className="qr-controls">
                  <button onClick={() => setPlaying(!playing)}>
                    {playing ? <Pause /> : <Play />}
                    {playing ? "Pause QR stream" : "Play QR stream"}
                  </button>
                  <label>
                    Frame timing
                    <select
                      value={speed}
                      onChange={(e) => setSpeed(e.target.value)}
                    >
                      <option value="1200">1.2 seconds</option>
                      <option value="2000">2 seconds</option>
                      <option value="3000">3 seconds</option>
                    </select>
                  </label>
                </div>
                <div className="qr-controls">
                  <button
                    onClick={() =>
                      setFrame((x) => (x - 1 + frames.length) % frames.length)
                    }
                  >
                    Previous packet
                  </button>
                  <button
                    onClick={() => setFrame((x) => (x + 1) % frames.length)}
                  >
                    Next packet
                  </button>
                  <button
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = qr;
                      a.download = `relay-packet-${frame + 1}.png`;
                      a.click();
                    }}
                  >
                    Save this QR image
                  </button>
                </div>
                <p className="note">
                  The stream repeats. The receiver accepts missing packets later
                  and ignores duplicates. QR scanning is device dependent; use
                  file exchange if it is slow.
                </p>
              </>
            ) : (
              <div className="empty">
                <QrCode size={64} />
                <h2>
                  A small package.
                  <br />A complete history.
                </h2>
                <p>
                  Prepare a handoff to show its QR packets. No passphrase is
                  stored or included in the code.
                </p>
              </div>
            )
          ) : incoming ? (
            <>
              <p className="eyebrow">REVIEW BEFORE IMPORTING</p>
              <h2>{incoming.title}</h2>
              <p>
                {materialize(incoming).length} tasks · {incoming.events.length}{" "}
                updates
              </p>
              <ul className="incoming-list">
                {materialize(incoming)
                  .slice(0, 8)
                  .map((t) => (
                    <li key={t.id}>
                      {t.values.title}
                      <span>
                        {Object.keys(t.conflicts).length
                          ? "Needs review"
                          : statusNames[t.values.status]}
                      </span>
                    </li>
                  ))}
              </ul>
              <p className="note">
                {board.id === incoming.id
                  ? `${incoming.events.filter((e) => !board.events.some((a) => a.id === e.id)).length} new updates for the current board. Conflicting fields will stay visible.`
                  : "This is a different board. Opening it replaces the current workspace on this device. Save your current board first."}
              </p>
              <button
                className="primary"
                onClick={() => {
                  try {
                    commit(
                      board.id === incoming.id
                        ? mergeBoards(board, incoming)
                        : incoming,
                      board.id !== incoming.id,
                    );
                    setIncoming(null);
                    setRaw("");
                    setPass("");
                    message(
                      "Handoff applied. Review any differing updates on the board.",
                    );
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                {board.id === incoming.id
                  ? "Merge reviewed updates"
                  : "Open this board"}
                <ArrowRight />
              </button>
            </>
          ) : (
            <div className="empty">
              <ClipboardText size={64} />
              <h2>See what is arriving.</h2>
              <p>
                A decrypted preview appears here. The board is never changed by
                scanning alone.
              </p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
export function App() {
  const initial = useRef(null);
  if (!initial.current) initial.current = readInitial();
  const [board, setBoard] = useState(initial.current.board),
    [tab, setTab] = useState("board"),
    [actor, setActor] = useState(
      () => localStorage.getItem("relay-ledger-actor") || "Adeel",
    ),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(initial.current.error),
    [offlineReady, setOfflineReady] = useState(false),
    [connected, setConnected] = useState(navigator.onLine),
    [editor, setEditor] = useState(null),
    [newBoard, setNewBoard] = useState(false),
    [boardTitle, setBoardTitle] = useState(""),
    [replace, setReplace] = useState(null);
  const current = useRef(board);
  current.current = board;
  useEffect(() => {
    const signal = () => setConnected(navigator.onLine);
    window.addEventListener("online", signal);
    window.addEventListener("offline", signal);
    let alive = true;
    if ("serviceWorker" in navigator && import.meta.env.PROD)
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => navigator.serviceWorker.ready)
        .then(async () => {
          const offline = await fetch("/offline-assets.json").then((r) =>
            r.json(),
          );
          const cache = await caches.open(offline.cacheName);
          const checks = await Promise.all(
            offline.assets.map((u) => cache.match(u)),
          );
          if (alive) setOfflineReady(checks.every(Boolean));
        })
        .catch(() => {});
    const storage = (e) => {
      if (e.key !== storageKey || !e.newValue) return;
      try {
        const b = validateBoard(JSON.parse(e.newValue));
        if (b.id === current.current.id) {
          const merged = mergeBoards(current.current, b);
          if (JSON.stringify(merged) !== e.newValue)
            localStorage.setItem(storageKey, JSON.stringify(merged));
          setBoard(merged);
          setNotice("Updates from another local tab combined.");
        } else {
          setNotice(
            "Another tab opened a different board. Your current board remains open; export before switching.",
          );
        }
      } catch {
        setError(
          "Another tab supplied invalid workspace data. Nothing was merged.",
        );
      }
    };
    window.addEventListener("storage", storage);
    return () => {
      alive = false;
      window.removeEventListener("online", signal);
      window.removeEventListener("offline", signal);
      window.removeEventListener("storage", storage);
    };
  }, []);
  function commit(next, force = false) {
    const valid = validateBoard(next);
    if (error && initial.current.error && !force)
      throw Error(
        "Export the unreadable stored workspace before replacing it.",
      );
    let final = valid;
    const raw = localStorage.getItem(storageKey);
    if (raw && !force) {
      const stored = validateBoard(JSON.parse(raw));
      if (stored.id === valid.id) final = mergeBoards(stored, valid);
      else
        throw Error(
          "Another tab changed the workspace. Export your current board before replacing it.",
        );
    }
    localStorage.setItem(storageKey, JSON.stringify(final));
    setBoard(final);
    setError("");
    initial.current.error = "";
    setNotice("Saved on this device.");
  }
  const tasks = materialize(board),
    conflicts = tasks.flatMap((t) =>
      Object.entries(t.conflicts).map(([field, versions]) => ({
        task: t,
        field,
        versions,
      })),
    ),
    hasConflict = (t) => Object.keys(t.conflicts).length > 0;
  function saveTask(values) {
    let next = board;
    if (editor === "new") {
      next = addTask(next, values.title, values.owner, actor);
      const id = materialize(next).find(
        (t) => !tasks.some((a) => a.id === t.id),
      ).id;
      if (values.notes)
        next = writeField(next, id, "notes", values.notes, actor);
      if (values.status !== "ready")
        next = writeField(next, id, "status", values.status, actor);
    } else {
      next = editTask(next, editor.snapshot, editor.id, values, actor);
    }
    commit(next);
    setEditor(null);
  }
  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header>
        <a className="brand" href="/" aria-label="Relay Ledger home">
          <Leaf size={32} />
          Relay Ledger
        </a>
        <nav aria-label="Main navigation">
          {[
            ["board", "Board", ClipboardText],
            ["exchange", "Exchange", ArrowsLeftRight],
            ["history", "History", ClockCounterClockwise],
            ["guide", "Guide", BookOpen],
          ].map(([v, n, I]) => (
            <button
              key={v}
              onClick={() => {
                setTab(v);
                setEditor(null);
              }}
              aria-current={tab === v ? "page" : undefined}
            >
              <I />
              {n}
            </button>
          ))}
        </nav>
        <div className="offline-badge">
          <WifiSlash />
          <span>
            {offlineReady
              ? "Offline ready"
              : import.meta.env.DEV
                ? "Local development"
                : "Preparing offline copy"}
            <small>
              {connected ? "Network available" : "Network disconnected"}
            </small>
          </span>
        </div>
        <label className="actor">
          Device label
          <input
            aria-label="Device author label"
            value={actor}
            maxLength={60}
            onChange={(e) => {
              setActor(e.target.value);
              localStorage.setItem("relay-ledger-actor", e.target.value);
            }}
          />
        </label>
      </header>
      <main id="content">
        <div className="live-message" role="status">
          {notice}
        </div>
        {error && (
          <section className="error" role="alert">
            {error}
            {initial.current.error && (
              <button
                onClick={() =>
                  download(
                    localStorage.getItem(storageKey) || "",
                    "relay-ledger-unreadable-backup.txt",
                    "text/plain",
                  )
                }
              >
                Export stored copy
              </button>
            )}
          </section>
        )}
        {tab === "board" ? (
          <>
            <div className="hero">
              <div>
                <p className="eyebrow">LOCAL-FIRST TEAM HANDOFFS</p>
                <h1>Keep the work moving.</h1>
                <p className="lede">
                  Share updates. Keep context. Even when the connection stops.
                </p>
              </div>
              <button onClick={() => setNewBoard(true)}>
                <Plus />
                New board
              </button>
            </div>
            <div className="board-layout">
              <section>
                <div className="board-heading">
                  <div>
                    <h2>{board.title}</h2>
                    <p>
                      {tasks.length} tasks · {board.events.length} recorded
                      updates · saved locally after changes
                    </p>
                  </div>
                  <button onClick={() => setEditor("new")}>
                    <Plus />
                    Add task
                  </button>
                </div>
                <div className="columns">
                  {Object.entries(statusNames).map(([status, label]) => (
                    <section className={"column " + status} key={status}>
                      <div className="column-heading">
                        <h3>{label}</h3>
                        <span>
                          {
                            tasks.filter(
                              (t) =>
                                t.values.status === status && !hasConflict(t),
                            ).length
                          }
                        </span>
                      </div>
                      <p className="column-description">
                        {status === "ready"
                          ? "Next up"
                          : status === "active"
                            ? "Being worked on"
                            : "Completed"}
                      </p>
                      {tasks
                        .filter(
                          (t) => t.values.status === status && !hasConflict(t),
                        )
                        .map((t) => (
                          <button
                            className="task"
                            key={t.id}
                            onClick={() => setEditor({ ...t, snapshot: board })}
                          >
                            <h4>{t.values.title}</h4>
                            <p>
                              {t.values.notes ||
                                "Add context for the next person."}
                            </p>
                            <div className="task-meta">
                              <span className="avatar" aria-hidden="true">
                                {(t.values.owner || "?")
                                  .split(" ")
                                  .map((s) => s[0])
                                  .join("")
                                  .slice(0, 2)}
                              </span>
                              <span>{t.values.owner || "Unassigned"}</span>
                              <small>{t.count} updates</small>
                            </div>
                          </button>
                        ))}
                      {!tasks.some(
                        (t) => t.values.status === status && !hasConflict(t),
                      ) && <p className="empty-column">No tasks here yet.</p>}
                    </section>
                  ))}
                </div>
                <p className="demo-note">
                  {board.title === "Community repair day"
                    ? "Guided example with fictional volunteers. Try resolving the differing update, then create your own board."
                    : "This workspace stays on this device until you explicitly exchange a handoff."}
                </p>
              </section>
              <aside
                className={
                  "review " + (conflicts.length ? "attention" : "clear")
                }
              >
                <div className="review-heading">
                  {conflicts.length ? <WarningCircle /> : <CheckCircle />}
                  <h2>
                    {conflicts.length
                      ? `${conflicts.length} update${conflicts.length === 1 ? "" : "s"} need${conflicts.length === 1 ? "s" : ""} a decision`
                      : "No decisions waiting"}
                  </h2>
                </div>
                <p>
                  {conflicts.length
                    ? "Both versions are preserved. Confirm the field value after checking with your team."
                    : "Your known updates agree. Another device may have changes you have not received yet."}
                </p>
                {conflicts.map(({ task, field, versions }) => (
                  <section className="conflict" key={task.id + field}>
                    <h3>{task.values.title}</h3>
                    <span className="eyebrow">{fieldNames[field]}</span>
                    {versions.map((e) => (
                      <div className="version" key={e.id}>
                        <div>
                          <span className="avatar">{e.author.slice(0, 2)}</span>
                          <strong>{e.author}</strong>
                        </div>
                        <p>
                          {field === "status"
                            ? statusNames[e.value]
                            : e.value || "(Empty)"}
                        </p>
                        <button
                          onClick={() => {
                            try {
                              commit(
                                writeField(
                                  board,
                                  task.id,
                                  field,
                                  e.value,
                                  actor,
                                ),
                              );
                              setNotice(
                                "Decision recorded. Both earlier updates remain in History.",
                              );
                            } catch (e) {
                              setError(e.message);
                            }
                          }}
                        >
                          Use this {field === "status" ? "status" : "value"}
                          <ArrowRight />
                        </button>
                      </div>
                    ))}
                  </section>
                ))}
              </aside>
            </div>
            <section className="handoff-strip">
              <ArrowsLeftRight size={40} />
              <div>
                <h2>Take the board with you.</h2>
                <p>
                  Encrypted file or repeating QR. Review first. Merge
                  deliberately.
                </p>
              </div>
              <button className="primary" onClick={() => setTab("exchange")}>
                Prepare a handoff
                <ArrowRight />
              </button>
              <button onClick={() => setTab("guide")}>
                <BookOpen />
                How it works
              </button>
            </section>
          </>
        ) : tab === "exchange" ? (
          <Exchange
            board={board}
            commit={(b, force) => {
              if (force) setReplace(b);
              else commit(b);
            }}
            message={setNotice}
          />
        ) : tab === "guide" ? (
          <Guide />
        ) : (
          <section>
            <p className="eyebrow">EVERY KNOWN UPDATE, KEPT IN CONTEXT</p>
            <div className="page-heading">
              <div>
                <h1>A history that travels.</h1>
                <p className="lede">
                  Device timestamps are labels. Causal parents determine which
                  updates build on which.
                </p>
              </div>
              <button
                onClick={() =>
                  download(
                    JSON.stringify(board, null, 2),
                    "relay-ledger-plaintext-history.json",
                  )
                }
              >
                <DownloadSimple />
                Export plain history
              </button>
            </div>
            <p className="note">
              This export is not encrypted. Author labels do not prove identity.
              Use Exchange for a protected handoff.
            </p>
            <ol className="timeline">
              {[...board.events]
                .sort((a, b) => b.time - a.time || a.id.localeCompare(b.id))
                .map((e) => (
                  <li key={e.id}>
                    <span className="avatar">{e.author.slice(0, 2)}</span>
                    <div>
                      <strong>{e.author}</strong> updated{" "}
                      <strong>
                        {tasks.find((t) => t.id === e.task)?.values.title}
                      </strong>
                      <p>
                        {fieldNames[e.field]}:{" "}
                        {e.field === "status"
                          ? statusNames[e.value]
                          : e.value || "(Empty)"}
                      </p>
                      <small>
                        {new Date(e.time).toLocaleString()} ·{" "}
                        {e.parents.length
                          ? `Builds on ${e.parents.length} earlier update${e.parents.length === 1 ? "" : "s"}`
                          : "First value for this field"}
                      </small>
                    </div>
                  </li>
                ))}
            </ol>
          </section>
        )}
      </main>
      <footer>
        <span>Relay Ledger · Built for continuity.</span>
        <span>
          HACK47: OFFGRID · Open source · AI-assisted development disclosed.
        </span>
      </footer>
      <Modal
        open={!!editor}
        onOpenChange={(v) => {
          if (!v) setEditor(null);
        }}
        title={editor === "new" ? "Add a task" : "Update this task"}
        description="Changes become new local updates. Earlier versions stay in History."
      >
        {editor && (
          <TaskForm
            key={editor === "new" ? "new" : editor.id}
            task={editor === "new" ? null : editor}
            save={saveTask}
          />
        )}
      </Modal>
      <Modal
        open={newBoard}
        onOpenChange={setNewBoard}
        title="Start a new board"
        description="Save an encrypted handoff of the current workspace first. Starting a new board replaces this device’s current workspace."
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const b = createBoard(boardTitle);
              commit(b, true);
              setNewBoard(false);
              setBoardTitle("");
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          <label className="field">
            Board name
            <input
              value={boardTitle}
              maxLength={100}
              onChange={(e) => setBoardTitle(e.target.value)}
            />
          </label>
          <button className="primary" type="submit">
            Start new workspace
          </button>
        </form>
      </Modal>
      <Modal
        open={!!replace}
        onOpenChange={(v) => {
          if (!v) setReplace(null);
        }}
        title="Open a different board?"
        description="This replaces the current workspace on this device. Your current board will not be kept unless you exported it."
      >
        <button onClick={() => setReplace(null)}>Keep current board</button>
        <button
          className="primary"
          onClick={() => {
            try {
              commit(replace, true);
              setReplace(null);
              setTab("board");
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          Open incoming board
        </button>
      </Modal>
    </>
  );
}
