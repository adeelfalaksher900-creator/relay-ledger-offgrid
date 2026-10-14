import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
const root = "dist/client";
function list(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? list(path.join(dir, e.name)) : [path.join(dir, e.name)],
  );
}
const files = list(root)
  .filter((f) => !f.endsWith("sw.js") && !f.endsWith("offline-assets.json"))
  .sort();
const version = createHash("sha256")
  .update(
    files
      .map((f) => readFileSync(f))
      .reduce((a, b) => Buffer.concat([a, b]), Buffer.alloc(0)),
  )
  .digest("hex")
  .slice(0, 12);
const cacheName = "relay-ledger-" + version;
const assets = [
  "/",
  ...files.map((f) => "/" + path.relative(root, f).replaceAll("\\", "/")),
  "/offline-assets.json",
];
writeFileSync(
  root + "/offline-assets.json",
  JSON.stringify({ cacheName, assets }),
);
writeFileSync(
  root + "/sw.js",
  `const CACHE=${JSON.stringify(cacheName)},ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('relay-ledger-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;e.respondWith(caches.open(CACHE).then(async c=>(await c.match(e.request))||fetch(e.request)));});`,
);
console.log(
  "Prepared verified offline shell:",
  cacheName,
  assets.length,
  "assets",
);
