import test from "node:test";
import assert from "node:assert/strict";
import { CameraLease } from "../src/media.js";
test("a camera permission response arriving after navigation stops all tracks", async () => {
  let resolve,
    stopped = 0;
  const lease = new CameraLease();
  const pending = lease.acquire(() => new Promise((r) => (resolve = r)));
  lease.close();
  resolve({ getTracks: () => [{ stop: () => stopped++ }] });
  assert.equal(await pending, null);
  assert.equal(stopped, 1);
});
test("a superseded camera request cannot steal the active lease", async () => {
  let resolve,
    stopped = 0;
  const lease = new CameraLease();
  const old = lease.acquire(() => new Promise((r) => (resolve = r)));
  const stream = { getTracks: () => [{ stop: () => stopped++ }] };
  assert.equal(await lease.acquire(async () => stream), stream);
  resolve({ getTracks: () => [{ stop: () => stopped++ }] });
  assert.equal(await old, null);
  assert.equal(stopped, 1);
  lease.stop();
  assert.equal(stopped, 2);
});
