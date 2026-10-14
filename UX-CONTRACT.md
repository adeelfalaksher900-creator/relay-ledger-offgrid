# Observable UX contract

Visual identity: DESIGN.md. English-first interface, browser-local timezone for event display, timestamps informational only.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native HTML select | Platform popup accepted for status and QR speed | product-specific | Keyboard and narrow viewport |
| Form | TaskForm and Secret components in App.jsx | Own validation, preserved input, inline errors, no native bubbles | product-specific | Create/edit/invalid input |
| Dialog | Radix Dialog | Focus trap, Escape and focus restoration | product-specific | Browser keyboard check |
| Toast | App message live region | Persistent error and polite successful local save | product-specific | Runtime and accessibility |
| CRUD | ledger.js and commit in App.jsx | Append-only events, no task deletion; explicit workspace replacement | product-specific | Causal tests and two copies |
| Offline | generated service worker | Offline ready only after asset cache verifies | product-specific | Reload with network disabled |
| Conflict | materialize and conflict review | Concurrent differing field values shown; resolution parents all heads | product-specific | Merge permutations and browser |
| Local persistence | localStorage + storage-event merge | Local data plaintext, shared device warning; merge same-board tabs before save | product-specific | Reload and concurrent tabs |
| Import | Exchange receive preview | Decrypt and validate before preview; explicit merge/adopt; no auto-commit | product-specific | Wrong password, tampering, schema tests |
| QR | Collector + jsQR | Exact unique-frame count; out-of-order and duplicates tolerated; incomplete data cannot merge | product-specific | Real bitmap decode tests |

Passphrases never stored, included in links, logs or QR data. Clear them when leaving Exchange. An encrypted handoff protects contents from a viewer without the passphrase, not from trusted peers who possess it. Author names are labels, not verified identities. Camera is opt-in and stops on navigation. No backend, rows or tenant database; Cloudflare RLS is not applicable.
