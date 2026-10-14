# OFFGRID submission package | Relay Ledger

Last prepared: 14 October 2026. This is the copy and shot list for the existing Devpost draft, **not proof of final submission**.

## Official fields

- **Hackathon:** HACK47: OFFGRID
- **Project name:** Relay Ledger
- **Tagline:** Keep the work moving. Even when the connection stops.
- **Short description:** An offline-first handoff board for small volunteer crews and student teams. Exchange encrypted snapshots by file or QR, merge independent edits, and review conflicting decisions instead of losing them to timestamps.
- **Problem:** When connectivity disappears, small teams still need to coordinate. Separate copies of a task board drift, and a simple newest-update-wins merge can erase disagreements.
- **Solution:** A locally saved task board with explicit encrypted, user-initiated handoffs and a bounded causal history. Changes to different fields merge; concurrent competing values remain visible until a user resolves them.
- **Source:** https://github.com/adeelfalaksher900-creator/relay-ledger-offgrid
- **Live project:** https://relay-ledger-offgrid.vercel.app/
- **Draft page observed in earlier session:** https://devpost.com/software/relay-ledger
- **Long story:** See [DEVPOST-STORY.md](DEVPOST-STORY.md). Paste and proofread its sections, including implementation, challenges, verification and limitations.
- **Built with / tags:** React, JavaScript, Vite, Web Crypto API, AES-GCM, PBKDF2, QR code, jsQR, service worker, Radix UI, CSS, Vercel, offline-first, accessibility.
- **AI disclosure:** Codex assisted research, design iteration, coding, tests, reviews and documentation. The demo uses clearly disclosed stock synthetic narration. The app itself does not depend on an AI model.

## Judge's fast path

1. Open the live link. The six-task repair-day board is **fictional demo data**, not a real incident.
2. Select a competing status in the right-hand decision rail. View the change in History.
3. Add a new task and save it locally.
4. Open Exchange; export an encrypted file or optical handoff. Show that QR displays encrypted packet data, not the passphrase.
5. Import on a separate browser profile/device. Demonstrate the preview and explicit acceptance.
6. Change the same status independently on each profile, merge, and resolve. Old handoff import should not silently undo the resolution.
7. Reopen the page offline **after** all assets show Offline ready.

## 15 gallery screenshot captions

All gallery images should be genuine screenshots captured from the running app, **not rendered concepts**. Match each caption to the screenshot before publishing.

| # | Screenshot to capture | Devpost caption |
|---|---|---|
| 01 | Desktop board overview | Relay Ledger's Field Paper workspace. Tasks stay readable, even when the network does not. |
| 02 | Initial fictional example | A clearly labelled sample community repair board helps judges explore immediately. |
| 03 | Three status columns | Track work across stages with owners and handoff notes. |
| 04 | Add task form | Create a task and save its changes on this device. |
| 05 | Edit task form | Update a task's status, owner and next-person notes. |
| 06 | Review rail with concurrent statuses | Two independent status updates stay visible. Neither is silently discarded. |
| 07 | Resolve one competing value | Make a human decision that observes the conflicting versions. |
| 08 | History view | Review the recorded updates and how a decision was reached. |
| 09 | Exchange landing | Hand off work deliberately; there is no automatic background sync. |
| 10 | Encrypted export form | Protect a handoff with a passphrase before export. |
| 11 | QR packet display | Encrypted snapshots travel as numbered QR packets. The passphrase is separate. |
| 12 | Receive progress view | Duplicate packets are ignored, and missing packets remain visible. |
| 13 | Decrypted preview before import | Check the incoming board before opening or merging it. |
| 14 | Offline-ready board | The installed app works offline after a complete first load. |
| 15 | Mobile board (390px) | Responsive layout keeps task review available on a small screen. |

Recommended gallery image dimensions: 1600×900 for desktop screenshots with consistent margins, and a landscape canvas with the real 390px phone capture centered for #15. Do not distort the capture. Use a separate, clearly branded 16:9 thumbnail, distinct from the gallery.

## 130-second actual-app video shot plan

The recorded narration is in [../video/narration.txt](../video/narration.txt). Earlier session generated a 127-second stock voice and a 130-second actual-app walkthrough in a different temporary workspace. **Those binary assets are not in this repository.** Do not imply the final MP4 has been uploaded until it exists and is checked.

| Approx. section | What must be seen |
|---|---|
| 00–20 seconds | Real homepage, sample board, a task edit and saved local state |
| 20–40 seconds | Two independent browser contexts making competing updates |
| 40–65 seconds | Exchange, AES-GCM passphrase form, encrypted file and repeating QR packets |
| 65–85 seconds | Receiver packet counter and full package verification; file fallback |
| 85–105 seconds | Wrong passphrase rejection, decrypted preview and explicit merge |
| 105–120 seconds | Conflict decision, History and older handoff replay |
| 120–130 seconds | Offline-ready evidence, concise limitations and open-source link |

Production demo requirements: 1920×1080; real app capture rather than presentation slides; stock narration disclosed; subtitles reviewed against the narration; no credentials, real personal data, tokens or secret passphrases visible. Review keyframes, legibility, transitions, ending and entire audio track before publishing. If Devpost requires a hosted video, use a real publicly available YouTube/Vimeo watch URL rather than pasting a local MP4 path.

## Final verification and submission gate

- [x] Source repository is public and README contains local setup and security boundaries.
- [x] Earlier-session record: 16 tests passed; browser checks included independent contexts, offline reload and mobile viewport. These are historical test reports, not checks rerun in this session.
- [x] Add a GitHub Actions workflow to rerun tests and production build on pushes.
- [ ] Confirm GitHub Actions job passes after the new commit.
- [ ] Check production URL and browser headers anonymously using a working browser.
- [ ] Recover or recreate and inspect the final 1080p video from actual app interactions.
- [ ] Publish video and paste the exact externally reachable URL.
- [ ] Recover 15 original captures or take matching real screenshots and upload each with its caption.
- [ ] Upload the branded thumbnail and check its crop.
- [ ] Fill and review every required Devpost field, technology tag and link.
- [ ] Check the hackathon's Additional info and eligibility. Follow the specific Devpost UI for signed-in acceptance.
- [ ] Have the project owner review and accept final rules, then press final Submit before the deadline.
- [ ] Reopen the public submission page and confirm it is listed as submitted.

**Deadline:** 15 October 2026, 12:00 a.m. EDT, displayed on the hackathon page. This is 15 October 2026, 9:00 a.m. PKT. Always use the Devpost deadline counter as the final source.

## Honest technical boundaries to retain

- Local workspace contents are plaintext in localStorage. Handoff files use authenticated encryption; local data at rest is not encrypted.
- Device/author labels are unverified. No role permissions, digital signatures or trusted audit guarantee.
- Full snapshots, not online sync. Browser eviction is possible.
- No physical camera field trial or human usability study is claimed.
- The optical QR protocol is a repeat-and-collect scheme, not a novel fountain code.
- The maximum board and packet limits are recorded in README and SECURITY.md.
