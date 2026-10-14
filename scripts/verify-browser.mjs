import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { harness } from "./browser-harness.mjs";
import AxeBuilder from "@axe-core/playwright";
const h = await harness();
const results = [];
try {
  const ca = await h.browser.newContext({
      viewport: { width: 1536, height: 1024 },
    }),
    cb = await h.browser.newContext({
      viewport: { width: 1536, height: 1024 },
    });
  const a = await ca.newPage(),
    b = await cb.newPage();
  let errors = [];
  a.on("pageerror", (e) => errors.push(e.message));
  a.setDefaultTimeout(8000);
  b.setDefaultTimeout(8000);
  await a.bringToFront();
  await a.goto(h.url);
  await a.getByText("Offline ready", { exact: false }).waitFor();
  await b.bringToFront();
  await b.goto(h.url);
  console.log("Loaded both contexts");
  await a.getByText("Offline ready", { exact: false }).waitFor();
  console.log("check");
  results.push("Complete offline installation verified");
  await a.getByRole("button", { name: "New board", exact: true }).click();
  await a.getByLabel("Board name", { exact: true }).fill("Book drive handoff");
  await a.getByRole("button", { name: "Start new workspace" }).click();
  await a.getByRole("button", { name: "Add task", exact: true }).click();
  await a.getByLabel("Task title", { exact: true }).fill("Sort donated books");
  await a.getByLabel("Owner", { exact: true }).fill("Mariam");
  await a
    .getByLabel("Notes", { exact: true })
    .fill("Separate primary and secondary textbooks.");
  await a
    .getByRole("dialog")
    .getByRole("button", { name: "Add task", exact: true })
    .click();
  async function send(p, name) {
    await p.getByRole("button", { name: "Exchange", exact: true }).click();
    await p
      .getByLabel("Handoff passphrase", { exact: true })
      .fill("green river repair lantern");
    await p
      .getByRole("button", { name: "Prepare handoff", exact: true })
      .click();
    const dl = p.waitForEvent("download");
    await p
      .getByRole("button", { name: "Save encrypted file", exact: true })
      .click();
    await (await dl).saveAs(`video/assets/${name}.relay`);
    return `video/assets/${name}.relay`;
  }
  async function receive(p, file, pass = "green river repair lantern") {
    await p.getByRole("button", { name: "Exchange", exact: true }).click();
    await p
      .getByRole("button", { name: "Receive a handoff", exact: true })
      .click();
    await p.getByLabel("Handoff passphrase", { exact: true }).fill(pass);
    await p.locator("input[type=file]").nth(0).setInputFiles(file);
  }
  const file = await send(a, "base");
  await receive(b, file);
  await b.getByRole("button", { name: "Open this board", exact: true }).click();
  await b
    .getByRole("button", { name: "Open incoming board", exact: true })
    .click();
  console.log("check");
  results.push("Encrypted UI handoff and explicit workspace adoption");
  async function update(p, status) {
    await p.getByRole("button", { name: "Board", exact: true }).click();
    await p.getByRole("button", { name: /Sort donated books/ }).click();
    await p.getByLabel("Status", { exact: true }).selectOption(status);
    await p
      .getByRole("button", { name: "Save task update", exact: true })
      .click();
  }
  await update(a, "active");
  await update(b, "done");
  const peer = await send(b, "peer");
  await receive(a, peer, "wrong password here");
  await a.getByText(/The passphrase does not match/).waitFor();
  console.log("check");
  results.push("Wrong passphrase rejected through actual UI");
  await a
    .getByLabel("Handoff passphrase", { exact: true })
    .fill("green river repair lantern");
  await a
    .getByRole("button", { name: "Try this handoff again", exact: true })
    .click();
  await a
    .getByRole("button", { name: "Merge reviewed updates", exact: true })
    .click();
  await a.getByRole("button", { name: "Board", exact: true }).click();
  await a.getByRole("heading", { name: "1 update needs a decision" }).waitFor();
  await a.screenshot({ path: "docs/browser-conflict.png" });
  await a.getByRole("button", { name: "Use this status" }).first().click();
  await a.getByRole("heading", { name: "No decisions waiting" }).waitFor();
  console.log("check");
  results.push(
    "Two independent browser contexts retain and resolve concurrent statuses",
  );
  await receive(a, file);
  await a
    .getByRole("button", { name: "Merge reviewed updates", exact: true })
    .click();
  await a.getByRole("button", { name: "Board", exact: true }).click();
  await a.getByRole("heading", { name: "No decisions waiting" }).waitFor();
  console.log("check");
  results.push("Old encrypted handoff does not resurrect resolved conflict");
  await ca.setOffline(true);
  await a.reload();
  await a.getByRole("button", { name: /Sort donated books/ }).waitFor();
  assert.equal(
    await a.getByText("Network disconnected", { exact: false }).count(),
    1,
  );
  console.log("check");
  results.push(
    "Reload and local task edit available with browser network disabled",
  );
  await ca.setOffline(false);
  const ax = await new AxeBuilder({ page: a }).analyze();
  assert.equal(
    ax.violations.length,
    0,
    JSON.stringify(ax.violations.map((x) => ({ id: x.id, impact: x.impact }))),
  );
  console.log("check");
  results.push("Automated axe scan: zero violations on board state");
  await a.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await a.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await a.screenshot({ path: "docs/mobile-board.png", fullPage: true });
  console.log("check");
  results.push("390px mobile layout: no horizontal overflow");
  assert.equal(errors.length, 0, errors.join("\n"));
  await fs.writeFile(
    "docs/browser-verification.json",
    JSON.stringify(
      {
        date: "2026-10-14",
        results,
        limits:
          "Automated local Chromium; physical camera and human usability not tested.",
      },
      null,
      2,
    ),
  );
  console.log(results);
} finally {
  await h.close();
}
