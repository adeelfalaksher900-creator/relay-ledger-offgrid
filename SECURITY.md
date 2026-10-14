# Security boundary

The app is static. All board data, cryptography, QR encoding and decoding run on the device. There is no board-upload endpoint, server database, tenant row access or cloud sync. Cloudflare RLS is not applicable; no Cloudflare account or unrelated resources were inspected.

Handoff confidentiality: AES-256-GCM, fresh random 12-byte IV and 16-byte salt, PBKDF2-SHA-256 fixed at 600,000 iterations, 128-bit authentication tag and authenticated format marker. The passphrase is held only in React component state, cleared when Exchange is left, and is never encoded in the QR envelope, URLs, logs or persisted workspace. A weak passphrase remains vulnerable to offline guessing. This has not received an independent cryptographic audit.

Workspace confidentiality: localStorage is plaintext. Anyone using the browser profile, a malicious extension or injected same-origin script can access it. Full known history travels with every snapshot, including prior values. Export only data all passphrase holders should see. Sharing a passphrase grants read/write ability; there is no per-user authorization or cryptographically verified authorship.

Untrusted input: board schema, size, event count, task count, field names, parent identity/scope, duplicate identities and causal cycles are checked before preview and before merging. Mixed QR sessions, conflicting packet indices and incomplete packets are rejected. The QR envelope digest is not a sender signature. AES-GCM authentication is the content-integrity boundary. React renders task text as text, never imported HTML. Image decoding is bounded to 10 MB and 8 megapixels per image.

Hosting: Vercel configuration includes same-origin CSP, no object/frame embedding, no-referrer, nosniff, camera permission restricted to self, and microphone/geolocation disabled. Camera access is opt-in and stops on navigation. The service worker caches an explicit content-versioned app shell; browser eviction remains possible. No promise is made against compromised devices, dependencies, hosting or extensions.

Sensitive reports: do not put recordings, real board data, passphrases or exploit details in public issues. Use GitHub private vulnerability reporting if available, otherwise request a private contact channel without disclosing the issue. Only test your own boards and deployment.
