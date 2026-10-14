import test from "node:test";
import assert from "node:assert/strict";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import {
  createBoard,
  addTask,
  seal,
  unseal,
  packetize,
  Collector,
  validateBoard,
} from "../src/ledger.js";
test("real QR bitmap decoding reconstructs an encrypted Unicode board", async () => {
  const b = addTask(
    createBoard("کتابوں کی تقسیم"),
    "Sort donated books",
    "Mariam",
    "Adeel",
  );
  const encrypted = await seal(b, "river lantern paper meadow");
  const packets = await packetize(encrypted);
  const receiver = new Collector();
  for (const packet of [...packets].reverse()) {
    const png = PNG.sync.read(
      await QRCode.toBuffer(packet, {
        width: 600,
        margin: 4,
        errorCorrectionLevel: "M",
      }),
    );
    const decoded = jsQR(
      new Uint8ClampedArray(png.data),
      png.width,
      png.height,
    );
    assert.ok(decoded, "QR scanner should read the generated pixels");
    await receiver.add(decoded.data);
  }
  assert.deepEqual(
    await unseal(await receiver.finish(), "river lantern paper meadow"),
    validateBoard(b),
  );
});
