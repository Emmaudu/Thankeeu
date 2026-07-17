# Thankeeu Round 7 - icon, encoding, media, and quality repair batch

## SVG icon repair and visual consistency

- Audited 595 static `<Icon>` calls across the frontend.
- Added missing Lucide SVG registrations for `BarChart2`, `Building2`, `FileText`, `Images`, `Trash2`, `CreditCard`, `PartyPopper`, `ShoppingCart`, `Printer`, `Reply`, `Moon`, `Minus`, and `Square`.
- Added semantic SVG aliases used by data-driven dashboards: `Billing`, `Event`, `GL`, `Leader`, `Member`, `Sync`, and `Team`.
- Added a branded SVG fallback so an unexpected dynamic icon name can never leave a blank icon slot.
- Replaced raw glyph controls with SVG icons in shared member navigation, notifications, bank accounts, recording, Admin navigation, dashboards, cart controls, album signing, card transfer, recipient claim gates, and occasion CTAs.
- Added accessible labels to icon-only close, menu, delete, quantity, and media-removal controls.
- Preserved intentional user-facing emoji features such as the emoji picker and the album gift/money visual requested for More Love.

## UTF-8 and strange-character audit

- Verified the source files are valid UTF-8. The apparent mojibake seen in earlier Windows PowerShell output came from its legacy console decoding, not corrupted source files.
- Confirmed the frontend contains zero Unicode replacement characters and zero C1 control characters.
- Confirmed `frontend/index.html` declares UTF-8 before user-visible content.
- Confirmed zero remaining button lines use raw emoji/symbol glyphs as controls.

## Upload and Live Wall bug fixes

- Fixed a production mismatch where the UI and FAQ allowed 50 MB videos but Cloudinary middleware rejected every file above 9 MB.
- Production and local generic media middleware now consistently allow video/audio files up to 50 MB.
- Image/GIF clients retain their smaller 9 MB limit.
- Signer validation now matches the production 50 MB video/audio limit instead of allowing 100 MB files that the backend could not accept.
- Live Wall creator and signer uploaders now validate file type, size, and five-item carousel limits before uploading and show clear inline errors.
- GIF downloads are rejected above the actual 9 MB GIF limit before being attached.
- Live Wall background refreshes no longer flash a loading message over cards that are already visible.

## Additional runtime and interface fixes

- Fixed the voice recorder lifecycle so React StrictMode cleanup cannot permanently mark a remounted recorder as unmounted and discard completed recordings.
- Replaced raw notification-type emoji with consistent SVG notification icons.
- Modernized recipient claim/login/signup/error states with accessible SVG status icons and corrected awkward recipient-facing copy.
- Reworked dashboard empty states, stat cards, card actions, bank verification controls, and retirement CTAs for a cleaner and more consistent visual system.
- Removed an unused bank-account currency import.

## Validation performed

- 595 static icon calls checked; all required icon names are registered.
- Zero missing React hook imports.
- Zero files use `<Icon>` without importing the icon component.
- Zero replacement characters, C1 control characters, or raw-symbol button controls.
- Modified frontend/backend files pass brace and bracket delimiter checks.
- Backend, signer, and Live Wall media-size constants are aligned.

The workspace has no project `node_modules`, and the available Node executable is blocked by Windows Defender, so a full Vite build could not be executed. Static source acceptance checks passed.

## Existing deployment requirement

Run `database/RUN_THIS_IN_SUPABASE.sql` in Supabase if the Round 5/6 schema changes have not yet been applied. Round 7 adds no new database migration.
