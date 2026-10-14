# Reproduce the actual-app demonstration

The app shown in the demo is the same source deployed on Vercel. Demo volunteers and tasks are fictional. The recording uses actual UI actions, not injected board state or a slideshow.

1. Follow the root README setup and run `npm run build`.
2. Install Playwright's recording helper with `npx playwright install ffmpeg`.
3. Run `node scripts/record-demo.mjs`. The browser harness uses the official `@sparticuz/chromium` package; alternatively set `RELAY_CHROMIUM_PATH` to an installed compatible Chromium executable. The script stores a native 1920×1080 continuous capture, real encrypted demo files and captured gallery screenshots locally.
4. Provide the stock narration file at `video/composition/assets/narration.mp3` and the trimmed, 30fps actual capture at `video/composition/assets/walkthrough.mp4`. Binary media is excluded from source control. The supplied script and subtitles describe the released demo.
5. In `video/composition`, run `npm ci`, copy `node_modules/gsap/dist/gsap.min.js` into `assets/gsap.min.js`, and supply the self-hosted Source Sans 3 font declared in the HTML. `node build.mjs` rebuilds the composition from the reviewed SRT.
6. With `HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1`, run `npm run check` and `npm run render -- --fps 30 --quality delivery --workers 4 --video-frame-format png --output final.mp4`. Set `HYPERFRAMES_BROWSER_PATH` only when needed to select your Chromium.

CLI pinned to HyperFrames 0.8.151. Public video hosting and final Devpost submission remain separate actions.

Narration: Liam stock synthetic voice, ElevenLabs via vidIQ, 127.242449 seconds, generated using 28 existing free credits. This is not a voice clone or a recording of a team member. Local workspace data in the app is plaintext; encrypted handoffs are a separate boundary. Physical camera performance is not represented by automated QR bitmap decoding.
