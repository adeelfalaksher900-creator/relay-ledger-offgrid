// Records actual UI actions. No fabricated DOM, simulated QR, or injected app state.
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { harness } from "./browser-harness.mjs";
const h = await harness();
const pass = "green river repair lantern";
await fs.mkdir("video/raw", { recursive: true });
await fs.mkdir("deliverables/gallery", { recursive: true });
const marks = [];
let start;
try {
  const bContext = await h.browser.newContext({
      viewport: { width: 1920, height: 1080 },
    }),
    b = await bContext.newPage();
  const aContext = await h.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: "video/raw", size: { width: 1920, height: 1080 } },
    }),
    a = await aContext.newPage();
  a.setDefaultTimeout(10000);
  b.setDefaultTimeout(10000);
  await b.goto(h.url);
  await a.bringToFront();
  await a.goto(h.url);
  await a.getByText("Offline ready", { exact: false }).waitFor();
  start = performance.now();
  const mark = (n) => {
    const t = (performance.now() - start) / 1000;
    marks.push({ name: n, seconds: t });
    console.log(n, t.toFixed(2));
  };
  const until = async (t) => {
    const ms = t * 1000 - (performance.now() - start);
    if (ms > 0) await new Promise((r) => setTimeout(r, ms));
  };
  const shot = async (name, p = a) => {
    await p.screenshot({ path: `deliverables/gallery/${name}.png` });
  };
  const nav = async (p, n) => {
    await p.bringToFront();
    await p.getByRole("button", { name: n, exact: true }).click();
  };
  async function send(p, name) {
    await nav(p, "Exchange");
    await p
      .getByRole("button", { name: "Send a handoff", exact: true })
      .click();
    await p.getByLabel("Handoff passphrase", { exact: true }).fill(pass);
    await p
      .getByRole("button", { name: "Prepare handoff", exact: true })
      .click();
    const dl = p.waitForEvent("download");
    await p
      .getByRole("button", { name: "Save encrypted file", exact: true })
      .click();
    const file = path.resolve(`video/assets/${name}.relay`);
    await (await dl).saveAs(file);
    return file;
  }
  async function receive(p, file, key = pass) {
    await nav(p, "Exchange");
    await p
      .getByRole("button", { name: "Receive a handoff", exact: true })
      .click();
    await p.getByLabel("Handoff passphrase", { exact: true }).fill(key);
    await p.locator("input[type=file]").nth(0).setInputFiles(file);
  }
  async function update(p, status) {
    await nav(p, "Board");
    await p.getByRole("button", { name: /Sort donated books/ }).click();
    await p.getByLabel("Status", { exact: true }).selectOption(status);
    await p
      .getByRole("button", { name: "Save task update", exact: true })
      .click();
  }
  mark("opening board");
  await shot("01-board");
  await until(10);
  await a.getByRole("button", { name: /Sort donated tools/ }).click();
  await shot("02-task-details");
  await until(15);
  await a.getByRole("button", { name: "Close dialog", exact: true }).click();
  await a.getByRole("button", { name: "New board", exact: true }).click();
  await a.getByLabel("Board name", { exact: true }).fill("Book drive handoff");
  await a.getByRole("button", { name: "Start new workspace" }).click();
  await a.getByRole("button", { name: "Add task", exact: true }).click();
  await a.getByLabel("Task title", { exact: true }).fill("Sort donated books");
  await a.getByLabel("Owner", { exact: true }).fill("Mariam");
  await a
    .getByLabel("Notes", { exact: true })
    .fill("Separate primary and secondary textbooks.");
  await shot("03-new-task");
  await until(21);
  await a
    .getByRole("dialog")
    .getByRole("button", { name: "Add task", exact: true })
    .click();
  mark("task saved");
  await shot("04-new-board");
  // Clone via the actual encrypted export/import flow in the second isolated context.
  const base = await send(a, "demo-base");
  await receive(b, base);
  await b.getByRole("button", { name: "Open this board", exact: true }).click();
  await b
    .getByRole("button", { name: "Open incoming board", exact: true })
    .click();
  await b.getByLabel("Device author label", { exact: true }).fill("Mariam");
  await update(b, "done");
  const peer = await send(b, "demo-peer");
  await update(a, "active");
  mark("independent status");
  await until(35);
  await nav(a, "Exchange");
  await a.getByLabel("Handoff passphrase", { exact: true }).fill(pass);
  await until(40);
  await a.getByRole("button", { name: "Prepare handoff", exact: true }).click();
  await shot("05-encrypted-snapshot");
  await until(45);
  await a.getByRole("button", { name: "Play QR stream", exact: true }).click();
  mark("QR stream");
  await shot("06-qr-stream");
  await until(50);
  await a.getByRole("button", { name: "Pause QR stream", exact: true }).click();
  // Real QR PNGs saved from sender UI, then decoded by receiving UI.
  const qrFiles = [];
  const dl0 = a.waitForEvent("download");
  await a
    .getByRole("button", { name: "Save this QR image", exact: true })
    .click();
  const qr0 = path.resolve("video/assets/qr-0.png");
  await (await dl0).saveAs(qr0);
  qrFiles.push(qr0);
  await a.getByRole("button", { name: "Next packet", exact: true }).click();
  const dl1 = a.waitForEvent("download");
  await a
    .getByRole("button", { name: "Save this QR image", exact: true })
    .click();
  const qr1 = path.resolve("video/assets/qr-1.png");
  await (await dl1).saveAs(qr1);
  qrFiles.push(qr1);
  await nav(a, "Exchange");
  await a
    .getByRole("button", { name: "Receive a handoff", exact: true })
    .click();
  await a.getByLabel("Handoff passphrase", { exact: true }).fill(pass);
  await a.locator("input[type=file]").nth(1).setInputFiles([qr1, qr0, qr1]);
  mark("real QR packet collection");
  await shot("07-qr-collection");
  await until(63);
  await a
    .getByRole("button", { name: "Reset QR receiver", exact: true })
    .click();
  await until(68);
  await receive(a, peer, "wrong password here");
  await a
    .getByText("The passphrase does not match", { exact: false })
    .waitFor();
  mark("wrong passphrase");
  await shot("08-wrong-passphrase");
  await until(73);
  await a.getByLabel("Handoff passphrase", { exact: true }).fill(pass);
  await a
    .getByRole("button", { name: "Try this handoff again", exact: true })
    .click();
  await a
    .getByRole("button", { name: "Merge reviewed updates", exact: true })
    .waitFor();
  await shot("09-incoming-preview");
  await until(77);
  await a
    .getByRole("button", { name: "Merge reviewed updates", exact: true })
    .click();
  await nav(a, "Board");
  await a.getByRole("heading", { name: "1 update needs a decision" }).waitFor();
  mark("concurrent review");
  await shot("10-concurrent-decision");
  await until(83);
  await a
    .getByRole("button", { name: "Use this status", exact: true })
    .last()
    .click();
  await a.getByRole("heading", { name: "No decisions waiting" }).waitFor();
  await shot("11-resolution");
  await until(87);
  await nav(a, "History");
  await shot("12-history");
  mark("history");
  await until(92);
  await aContext.setOffline(true);
  await a.reload();
  await a.getByText("Network disconnected", { exact: false }).waitFor();
  mark("offline reload");
  await shot("13-offline");
  await until(97);
  await nav(a, "Guide");
  await shot("14-guide");
  await until(108);
  await aContext.setOffline(false);
  await nav(a, "Board");
  await until(130);
  await a.setViewportSize({ width: 390, height: 844 });
  await a.screenshot({
    path: "deliverables/gallery/15-mobile.png",
    fullPage: true,
  });
  await a.setViewportSize({ width: 1920, height: 1080 });
  await until(130);
  mark("end");
  const video = await a.video().path();
  await aContext.close();
  await fs.copyFile(video, "video/assets/walkthrough.webm");
  await bContext.close();
  await fs.writeFile(
    "video/capture-marks.json",
    JSON.stringify(marks, null, 2),
  );
  console.log("Recorded", video);
} finally {
  await h.close();
}
