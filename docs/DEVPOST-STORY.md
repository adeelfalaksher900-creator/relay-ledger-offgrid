## Inspiration

Volunteer work often continues when the connection stops. A student club, community repair crew or shift team can still assign tasks locally, but reconciling different copies later is awkward: a newer timestamp can hide another person's decision. We wanted a small tool that treats disagreement as something to review.

**Relay Ledger** is an offline-first task handoff board for small volunteer crews and student groups who can exchange a file or meet in person. This is a product hypothesis, not a claim that we interviewed users or proved adoption.

## What it does

Create a board, add tasks, and record an owner, status and handoff notes. Changes are saved on this device. After the first complete installation, the app can reopen without a network.

In **Exchange**, prepare an encrypted snapshot of the full update history. Save a `.relay` file or show a repeating stream of numbered QR packets. Share the passphrase separately. The receiver collects unique packets in any order, ignores duplicates and shows missing progress. No partial package is imported.

A decrypted preview appears before import. A different workspace requires an explicit replacement confirmation. For the same board, independent field edits merge. Different concurrent values for the same field remain visible in the decision rail. A person chooses a value; that decision acknowledges the known competing versions. Importing an older snapshot cannot silently erase it.

The first board is a clearly labelled fictional community repair example, including a real causal conflict visitors can resolve immediately.

## How we built it

The frontend uses **React, Vite, Radix Dialog, Phosphor icons and self-hosted Source Sans 3**, with the selected warm Field Paper visual system. Native controls, modal focus management, a skip link, semantic headings, live feedback and responsive layouts support accessible use.

We wrote an original bounded causal event model in JavaScript. Every field update references the earlier versions it observed. Merge is a validated union of events, not a last-write-wins timestamp comparison. Explicit resolution adds a new event referencing every known competing head. Concurrent changes to different fields combine without a decision.

Web Crypto encrypts handoffs with **AES-256-GCM**, a fresh 96-bit IV, 128-bit salt and **PBKDF2-SHA-256 with 600,000 iterations**. A format marker is authenticated. The optical protocol uses numbered encrypted chunks and a SHA-256 envelope digest. `qrcode` encodes genuine QR images; **jsQR decodes actual image pixels**. This is a repeating chunk protocol, not a fountain code or a novel transport breakthrough.

A content-versioned service worker caches the complete static app. The Offline ready badge checks every expected asset. The public demo is deployed on Vercel's free Hobby plan, with security headers configured in source and no application backend or API key.

## Challenges and what we learned

Our engineering question was: **can two independently edited copies combine without hiding a disagreement?** We tested isolated browser contexts and a bounded field-history model. The experiment demonstrated a visible conflict, an explicit resolution, and an older encrypted handoff that preserved the decision.

Independent code review caught three edge cases: a stale task form could acknowledge unseen changes, a delayed camera permission could outlive navigation, and a parent-count limit could reject a valid large conflict. We fixed them and added regressions. A focused re-review confirmed those findings resolved. A further stale-camera callback cancellation case was scoped to the current request.

Optical transfer already exists. Our contribution is the deliberate handoff and decision workflow, its small causal model, and understandable boundaries.

## What we verified

- **16 automated tests pass**, including malformed histories, event identity reuse, authenticated encryption failures, missing/shuffled/duplicate packets, a Unicode board reconstructed from real QR PNG decoding, stale editors, delayed camera cleanup and a 65-way conflict resolution.
- The production build UI was exercised in **two isolated Chromium sessions**: encrypted export/import, workspace confirmation, wrong-passphrase rejection, concurrent status review, resolution and older-file replay.
- Offline reload was tested with browser networking disabled after complete installation.
- Automated axe reported **zero violations on the tested board state**; the 390px mobile layout had no horizontal overflow.
- The structural premium UI audit reported zero findings. These checks do not amount to security certification or universal accessibility conformance.

## Security and current limits

Local browser workspace storage is **plaintext**. Handoff encryption is a separate boundary. A passphrase holder can read and modify the board. Author names are labels, not verified identities. There is no signing, revocation or per-role authorization.

The prototype supports 60 tasks, 500 events and 128 KiB of validated board JSON. Encrypted files are capped at 192 KiB, and QR streams at 256 frames. File exchange is the fallback for larger histories or unsupported cameras. Initial installation needs connectivity; browser storage/cache eviction remains possible. Physical screen-to-camera performance and human usability still need real-device testing.

## Built during OFFGRID

Built from scratch on **14 October 2026**: the causal model, validation, encrypted handoff format, packet collector, real QR integration, review UI, offline installation checks, security configuration, regression tests and documentation. Existing libraries and the Product Design starter are disclosed in the repository's third-party notices. The starter's optional Sites packaging is not a server or sync backend.

OpenAI Codex assisted research, implementation, testing, independent review, documentation and media production. Generated concepts guided the selected design; captured gallery images show the actual implementation. The 2:10 actual-app demonstration was rendered locally in HyperFrames at 1920×1080 and 30fps, with reviewed subtitles. The demonstration's stock synthetic **Liam narration was generated through ElevenLabs via vidIQ using existing free credits**. It does not impersonate a team member. The application itself does not use an AI model, and OFFGRID does not require one.

## What's next

Test paired-device handoffs with small volunteer teams, measure camera recovery under lost packets, move local persistence to IndexedDB, explore signed device identities and add safe history compaction. The aim is an open-source tool worth continuing after OFFGRID.

**Keep the work moving. Even when the connection stops.**
