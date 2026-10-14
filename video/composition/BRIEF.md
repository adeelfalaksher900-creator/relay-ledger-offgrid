# Relay Ledger OFFGRID demo

Intent: show the working application as built, not slides or invented interactions. YouTube/Devpost delivery: 1920×1080, 30fps, 130 seconds. Voice: previously generated Liam stock synthetic narration through ElevenLabs via existing vidIQ free credits. The recorded script and reviewed English SRT are provided. No further voice generation or paid service is required.

Visual identity: Field Paper from DESIGN.md. Preserve exact app pixels, no grading, motion filters or fabricated QR. The actual UI is captured continuously in a native 1920×1080 browser viewport. Chapter labels and captions sit outside important controls. Caption band intentionally covers the page footer. No decorative 3D effect makes the UI less readable.

Pipeline: scripts/record-demo.mjs drives the actual app in isolated browser contexts, including real encrypted handoff files and QR image decoding. FFmpeg trims the startup and normalizes video to 30fps; HyperFrames uses the captured footage, stock narration, seek-safe caption entrances and chapter labels to render 3900 composed frames.

Verification: check reports zero runtime, layout and contrast findings. Static lint reports structural suggestions for the compact single-file caption/chapters timeline. Those suggestions do not change output and are intentionally reviewed rather than claimed as zero findings. Review snapshots and final MP4 keyframes, stream dimensions, sound, duration and ending before delivery.

Privacy: HYPERFRAMES_NO_TELEMETRY=1 and DO_NOT_TRACK=1. Optional telemetry is disabled in config. No hosted rendering, cloud inference, paid generators or new accounts are used.
