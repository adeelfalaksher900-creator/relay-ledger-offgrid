# Relay Ledger: Field Paper

## Product
An offline volunteer handoff workbench. The user selected the first generated Field Paper concept on 14 October 2026. Its calm paper register, three task columns and explicit decision panel are the source visual. No unrelated project code or data is reused.

## Colors
- Canvas: #F5F1E8, like an operational notebook.
- Surface: #FBF9F4, warm readable cards.
- Ink: #23332E, primary text.
- Muted: #5E6861, secondary text with sufficient contrast.
- Forest: #315D4E, primary action and completion.
- Ochre: #8C541B, attention and conflict decisions.
- Rule: #D5D4C8, separation rather than decorative shadows.

## Typography
Georgia for restrained headings. Self-hosted Source Sans 3 for controls and body. System monospace for packet counts and verification codes. Use 56px desktop headline, 34px mobile, 16px body, 13px metadata.

## Layout and shapes
At 1536x1024: 40px outer gutter, 76px navigation, 24px region gaps; flexible three-column board plus a 320px review rail. Task columns encode actual statuses. Conflict tasks remain in an explicit Review panel and never count as completed. Cards use 8px corners, 1px rules and no ornamental shadows. At narrow width, columns stack and the review panel precedes them.

## Icons and assets
Phosphor regular icons match the thin rounded operational marks in the concept. Initials are textual author labels, not images of people. Real generated QR matrices are data artifacts; never use a mock QR in the shipped product. No decorative raster assets in the app. The leaf brand mark uses the icon library.

## Motion
Short 160ms button/state feedback. No animated backgrounds. QR playback is explicitly started and stopped and respects reduced-motion preference on entry. Never auto-scroll a user's board.

## What not to do
No purple, glass, gradients, fake statistics, fabricated users, decorative dashboards or claims of verified identity. No hidden cloud sync. Demo data is visibly labeled. No silent conflict winner in product UI.

## Runtime mapping
src/styles.css implements these tokens as --paper, --surface, --ink, --muted, --forest, --ochre and --rule. One stylesheet owns responsive behavior, forms, buttons and focus styling.
