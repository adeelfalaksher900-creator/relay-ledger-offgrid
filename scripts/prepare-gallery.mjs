import fs from "node:fs/promises";
import path from "node:path";
import { harness } from "./browser-harness.mjs";
const specs = [
  [
    "01-board",
    "A board that stays with you",
    "A clearly labelled fictional repair-day board. Review a real causal conflict, or start your own workspace.",
  ],
  [
    "02-task-details",
    "Context for the next person",
    "Each task records a title, owner, status and handoff notes. This is the actual editable task form.",
  ],
  [
    "03-new-task",
    "Create useful handoff notes",
    "Add a task with an owner and practical notes. The form validates before saving on this device.",
  ],
  [
    "04-new-board",
    "Start your own workspace",
    "The new Book drive handoff board contains a locally saved task, created through the real app.",
  ],
  [
    "05-encrypted-snapshot",
    "Prepare an encrypted snapshot",
    "The full board history is encrypted locally. Export a file or prepare numbered QR packets.",
  ],
  [
    "06-qr-stream",
    "A repeating optical handoff",
    "Genuine encrypted QR packets repeat on screen. Share the passphrase separately; file exchange remains available.",
  ],
  [
    "07-qr-collection",
    "Missing packets stay visible",
    "The receiver decoded real QR image pixels. Reordered packets and a duplicate leave an incomplete package unimported.",
  ],
  [
    "08-wrong-passphrase",
    "Fail safely, keep the board",
    "An incorrect passphrase is rejected. Nothing imports, and the current workspace is preserved.",
  ],
  [
    "09-incoming-preview",
    "Review before merging",
    "A decrypted task preview and new-update count appear before the user explicitly accepts the handoff.",
  ],
  [
    "10-concurrent-decision",
    "Two updates. One human decision.",
    "Independent status edits from isolated browser contexts survive the merge and appear together for review.",
  ],
  [
    "11-resolution",
    "A decision with its context",
    "Choosing a status records a new update that observes both earlier versions. Previous history is retained.",
  ],
  [
    "12-history",
    "Follow the update history",
    "Inspect authors, field changes and causal parent counts. Labels and timestamps are informational, not verified identity.",
  ],
  [
    "13-offline",
    "The connection can stop",
    "The installed app reopens with browser networking disabled. Initial installation still requires a complete online load.",
  ],
  [
    "14-guide",
    "Clear product boundaries",
    "The in-app guide explains handoffs, plaintext local storage, prototype limits and camera-testing boundaries.",
  ],
  [
    "15-mobile",
    "A smaller screen, the same work",
    "A real 390px responsive viewport, presented without stretching. Physical device camera performance remains untested.",
  ],
];
await fs.mkdir("deliverables/devpost-gallery", { recursive: true });
const h = await harness();
try {
  const p = await h.browser.newPage({
    viewport: { width: 1920, height: 1280 },
  });
  await p.goto(h.url);
  const font = await fs.readFile(
    "node_modules/@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff2",
  );
  const css = `@font-face{font-family:Source;src:url(data:font/woff2;base64,${font.toString("base64")})}*{box-sizing:border-box}body{margin:0;background:#F5F1E8;color:#23332E;width:1920px;height:1280px;font-family:Source,sans-serif}.top{height:100px;display:flex;align-items:center;justify-content:space-between;padding:0 50px;border-bottom:1px solid #D5D4C8}.top strong{font-family:Georgia,serif;font-size:28px}.top span{font-size:23px;color:#315D4E}.capture{height:1080px;display:flex;align-items:center;justify-content:center}.capture img{max-width:1920px;max-height:1080px;object-fit:contain}.bottom{height:100px;display:flex;align-items:center;padding:0 50px;gap:24px;border-top:1px solid #D5D4C8}.bottom small{font-size:20px;color:#5E6861}.bottom b{font-size:28px;font-weight:400}`;
  for (let i = 0; i < specs.length; i++) {
    const [name, title, caption] = specs[i],
      pic = await fs.readFile(`deliverables/gallery/${name}.png`);
    await p.setContent(
      `<html><head><style>${css}</style></head><body><div class="top"><strong>Relay Ledger</strong><span>ACTUAL APPLICATION · HACK47: OFFGRID</span></div><div class="capture"><img src="data:image/png;base64,${pic.toString("base64")}"></div><div class="bottom"><small>${String(i + 1).padStart(2, "0")} / 15</small><b>${title}</b></div></body></html>`,
    );
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `deliverables/devpost-gallery/${name}.png` });
  }
  const pic = await fs.readFile("deliverables/gallery/01-board.png");
  await p.setContent(
    `<html><head><style>${css} .thumb{padding:88px;display:flex;flex-direction:column;height:1280px;gap:40px}.kicker{font-size:26px;letter-spacing:4px;color:#315D4E}.title{font-family:Georgia,serif;font-size:124px;line-height:1.05;margin:0}.tagline{font-size:42px;margin:0;color:#5E6861}.preview{width:1510px;height:662px;align-self:flex-end;overflow:hidden;border:1px solid #D5D4C8;border-radius:8px;margin-top:8px}.preview img{width:1510px;height:auto}.foot{display:flex;justify-content:space-between;font-size:28px;color:#315D4E}</style></head><body><div class="thumb"><div class="kicker">LOCAL-FIRST TEAM HANDOFFS</div><h1 class="title">Relay Ledger</h1><p class="tagline">Keep the work moving. Even when the connection stops.</p><div class="preview"><img src="data:image/png;base64,${pic.toString("base64")}"></div><div class="foot"><span>Encrypted handoffs · Deliberate decisions</span><span>HACK47: OFFGRID</span></div></div></body></html>`,
  );
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: "deliverables/Relay-Ledger-Thumbnail.png" });
  await fs.writeFile(
    "deliverables/gallery-captions.json",
    JSON.stringify(
      specs.map(([name, title, caption]) => ({
        file: `${name}.png`,
        title,
        caption,
      })),
      null,
      2,
    ),
  );
  console.log("15 gallery images at 1920×1280; thumbnail 1920×1280");
} finally {
  await h.close();
}
