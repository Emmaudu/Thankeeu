# Thankeeu Round 6 - Live Wall creator and signer repair batch

## Creator experience

- Selecting `Live Memory Wall Only` or `Group Card + Live Memory Wall` now makes the large LIVE PREVIEW show the editable Live Wall instead of the album or board.
- The creator preview uses a fixed two-column grid with six cards per page (two columns by three rows).
- Every wall card can be edited directly: sender name, message, caption, and up to five photo, GIF, video, or audio items.
- Each card previews its media as a carousel with previous/next controls and slide indicators.
- Added first/previous/page-select/next/last pagination beneath the third row.
- Added `Add another row (2 cards)` beneath pagination. Rows are unlimited and automatically continue onto later pages.
- Creator-authored wall cards are persisted before card activation/payment redirects so uploaded media is not lost.

## Signer and recipient experience

- Wall-only signing links now open the Live Wall automatically rather than leaving the message tab selected.
- The card recipient/owner view also opens the Live Wall automatically for wall-only cards and `?tab=wall` links.
- Signers always see a name field plus separate message and caption fields.
- Signers have distinct Photo/GIF and Video upload controls, plus voice recording.
- A signer can attach up to five items to one carousel card.
- The published wall displays two columns, six cards per page, carousel navigation, compact jump-to-page pagination, and the colorful wall scrollbar.

## Backend and data

- Wall list pagination defaults to six posts per page.
- Added a reusable frontend Wall API client for creator-side uploads.
- Preserved the legacy-schema fallback while supporting `message`, `media_gallery`, GIF, and voice-note media types.

## Additional repair

- Moved the occasion/design synchronization effect below form and design initialization. Its former position could access `form` before initialization and crash the card creation page.
- Blob previews are released when a creator removes an entire wall card.

## Deployment requirement

Run `database/RUN_THIS_IN_SUPABASE.sql` in Supabase. It contains both the Live Wall carousel columns/index and the anonymous draft recovery columns required by the current creation flow.

## Validation performed

- Static delimiter checks passed for the modified large JSX and JavaScript files.
- Confirmed the creator preview is two columns, six cards per page, with the add-row action below pagination.
- Confirmed signer name/message/caption/photo-GIF/video/voice controls and five-item payload wiring.
- Confirmed creator wall drafts are saved across free, credit, active-card, payment-redirect, and anonymous-draft paths.

The workspace does not contain project `node_modules`, and Windows Defender blocks the available Node and Git executables, so a full Vite build and Git diff could not be run in this environment.
