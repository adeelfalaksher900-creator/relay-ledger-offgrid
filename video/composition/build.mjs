import fs from "node:fs";
const blocks = fs
  .readFileSync("../transcript.srt", "utf8")
  .trim()
  .split(/\n\s*\n/);
const time = (s) => {
  const [h, m, v] = s.replace(",", ".").split(":").map(Number);
  return h * 3600 + m * 60 + v;
};
const caps = blocks.map((b) => {
  const l = b.split("\n");
  const [s, e] = l[1].split(" --> ").map(time);
  return { start: s, end: e, text: l.slice(2).join(" ").trim() };
});
const esc = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const chapters = [
  { start: 0, end: 24.6, text: "01 / A board that stays with you" },
  { start: 24.6, end: 36.2, text: "02 / Independent edits, preserved" },
  { start: 36.2, end: 53.72, text: "03 / An encrypted handoff" },
  { start: 53.72, end: 68.36, text: "04 / Real QR decoding" },
  { start: 68.36, end: 91.68, text: "05 / Preview. Merge. Decide." },
  { start: 91.68, end: 108.4, text: "06 / Offline, with clear boundaries" },
  { start: 108.4, end: 130, text: "Relay Ledger · HACK47: OFFGRID" },
];
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=1920,height=1080"><script src="assets/gsap.min.js"></script><style>
@font-face{font-family:'Source Sans 3';src:url('assets/source-sans-3.woff2') format('woff2');font-weight:400;font-display:block}*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:#F5F1E8;color:#23332E;font-family:'Source Sans 3',sans-serif}#root{width:100%;height:100%;position:relative;overflow:hidden}.clip{position:absolute;inset:0}#walkthrough{width:1920px;height:1080px;object-fit:contain}.caption-band{position:absolute;bottom:0;left:0;right:0;height:102px;background:#F5F1E8;border-top:1px solid #D5D4C8;z-index:4}.caption{top:auto;bottom:26px;height:60px;left:110px;right:110px;display:flex;align-items:center;justify-content:center;text-align:center;z-index:5;font-size:32px;line-height:1.2}.caption p{margin:0;max-width:1660px}.chapter{inset:auto 40px 108px auto;height:44px;display:flex;align-items:center;background:#FBF9F4;border:1px solid #D5D4C8;border-radius:6px;padding:0 16px;z-index:3;font-size:21px;color:#315D4E}.disclosure{inset:auto auto 112px 40px;font-size:18px;color:#5E6861;height:32px;z-index:3;background:#F5F1E8;padding:4px 10px;border-radius:4px}.ending{display:flex;align-items:center;justify-content:center;color:#315D4E;font-size:32px}
</style></head><body><div id="root" data-composition-id="relay-demo" data-start="0" data-duration="130" data-width="1920" data-height="1080">
<video id="walkthrough" class="clip" src="assets/walkthrough.mp4" muted playsinline data-start="0" data-duration="130" data-track-index="0"></video>
<audio id="narration" src="assets/narration.mp3" data-start="0" data-duration="127.242449" data-track-index="1" data-volume="1"></audio>
<div class="caption-band" data-layout-ignore></div>
${caps.map((c, i) => `<div id="caption-${i}" class="clip caption" data-start="${c.start}" data-duration="${(c.end - c.start).toFixed(3)}" data-track-index="2"><p id="caption-text-${i}">${esc(c.text)}</p></div>`).join("\n")}
${chapters.map((c, i) => `<div id="chapter-${i}" class="clip chapter" data-start="${c.start}" data-duration="${(c.end - c.start).toFixed(3)}" data-track-index="3"><span id="chapter-text-${i}">${esc(c.text)}</span></div>`).join("\n")}
<div id="disclosure" class="clip disclosure" data-start="0" data-duration="130" data-track-index="4">Actual app · Stock synthetic narration</div>
<div id="ending" class="clip caption ending" data-start="127.25" data-duration="2.75" data-track-index="2"><p>relay-ledger-offgrid.vercel.app</p></div>
</div><script>const tl=gsap.timeline({paused:true});${caps.map((c, i) => `tl.fromTo('#caption-text-${i}',{opacity:0,y:3},{opacity:1,y:0,duration:.10,ease:'power2.out'},${c.start});`).join("\n")}${chapters.map((c, i) => `tl.fromTo('#chapter-text-${i}',{opacity:0},{opacity:1,duration:.16,ease:'power1.out'},${c.start});`).join("\n")}window.__timelines['relay-demo']=tl;tl.seek(0);</script></body></html>`;
fs.writeFileSync("index.html", html);
fs.writeFileSync("captions.json", JSON.stringify(caps, null, 2));
