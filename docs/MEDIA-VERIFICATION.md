# Final media verification · 14 October 2026

The delivered demo is 130 seconds, 1920×1080, 30fps, 3900 video frames, H.264 with AAC audio. It was rendered locally using HyperFrames 0.8.151 from a continuous native 1080p capture of the actual app. Synthetic Liam narration was generated through ElevenLabs via vidIQ using 28 existing free credits. A reviewed English SRT is included.

HyperFrames check passed with zero runtime, layout and contrast findings. Static lint's nested caption/track-density suggestions were reviewed as structural suggestions for a deliberate single-file timeline. Early, QR, failure, preview, conflict, resolution, History, offline, Guide and ending frames were inspected in the final encoded contact sheet. Audio was measured and mastered toward -16 LUFS with a -1.5 dBTP target; video frames were copied without re-encoding in this mastering pass.

Optional HyperFrames telemetry was disabled through its documented config and HYPERFRAMES_NO_TELEMETRY=1 / DO_NOT_TRACK=1 before the final render. No paid video generator, cloud renderer or additional voice purchase was used.

Fifteen actual-app gallery images and the code-composed thumbnail are native 1920×1280, 3:2 PNGs below Devpost's 5MB limit. Gallery presentation adds a consistent heading/footer around the real screenshot; no UI controls or data were fabricated. Every uploaded original PNG matched its source's decoded RGB pixels. The verified mapping to Devpost order and matching captions is in gallery-upload-verification.json.

The product source was not changed after the demonstrated capture. Current production asset manifest matches the local build. Camera interaction is optional and untested on physical devices. Public YouTube/Vimeo hosting and final Devpost rules acceptance remain separate, pending user action/approval.
