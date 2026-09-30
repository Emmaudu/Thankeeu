# Thankeeu — Cover editor, flipbook revamp, celebration icons & A4 artwork covers

This pass implements five requirements without disturbing existing Codex sol 5.6 work.
Everything is additive and gracefully degrades if the new DB column isn't present.

## 1. Movable / resizable / recolourable cover texts + show/hide toggles
The three cover texts — **card title, recipient name, sender line** — can now be
dragged anywhere on the cover, resized, recoloured (per field, incl. custom colour
picker), and individually shown/hidden.

- **New** `frontend/src/utils/coverLayout.js` — the layout data model (positions in
  %, size, colour, show flag) + normalisation/validation helpers.
- **New** `frontend/src/components/CoverTextStudio.jsx` — the editor panel: a live
  editable preview (drag the text right on the cover) plus per-field size slider,
  colour swatches + custom colour, nudge pad, and **Show/Hide** toggles.
- **Rewrote** `frontend/src/components/CardCoverPreview.jsx` — one component now
  renders both the static preview and the interactive editor. Texts are absolutely
  positioned from the layout (%-based → fully responsive). Also renders the new SVG
  artwork (see #5).
- **Wired into** `CardStart.jsx` and `CreateCard.jsx` (both creation flows). The
  whole `form` is already spread into the API payload, so the new `cover_layout`
  field is sent automatically.
- **Backend** `cardController.js` — `cover_layout` added to the create whitelist
  (sanitised: clamped numbers, hex/`auto` colours, boolean show) and to the update
  guard + column-fallback lists.
- **DB** `database/migration_cover_text_layout.sql` — adds `cards.cover_layout jsonb`.
  Until it's run, the code falls back gracefully (column-missing retry).
- **Recipient view** `CardView.jsx` honours the show/hide flags and per-field colours.

## 2. Show / hide on cover
Delivered as part of #1 — each field has an eye toggle ("Show"/"Hide") right next to
it, so a busy artwork cover can drop the sender line (or any field) entirely.

## 3. Celebration Experience — real SVG icons
The "Celebration Experience" options rendered the literal **text** "Mail" / "Camera" /
"Sparkles" (and were blank in the dashboard). Now they render the proper Lucide icons
via the shared `<Icon>` component, in a tinted rounded badge.
- Fixed in `CardStart.jsx` and `CreateCard.jsx`.

## 4. Album flipbook revamp + direct inline editing
The signer flipbook (`AlbumSign.jsx`) is rebuilt to feel like a real notebook and to
allow typing **directly on the page** (no modal required for text):
- Ruled notebook paper, red margin rule, spiral-binding graphic, spine shadow, page
  curl, and a smoother 3-D page-flip animation.
- **Blank leaf**: "tap to write your message right here" turns the page into an inline
  textarea + signature line + Sign button (media/GIF/voice/gift still available).
- **Existing pages**: an "Edit" chip lets the **author edit their own note** and the
  **card creator edit any page** inline (per your choice: *both*).
- **Backend**: the existing `PATCH /messages/position/:id` handler is extended into a
  general message editor (content / font style / privacy) with the same ownership
  model — author via email match, creator via JWT (now also members/company). The
  public card endpoint gained `optionalAuth` so the creator is recognised on the sign
  page (anonymous signing is unaffected).
- **API**: `messagesAPI.updateMessage` added (same endpoint).
- Fully responsive: page becomes full-width with a 5:6 aspect ratio under 560px.

## 5. Ten "wow" A4 artwork covers per occasion (original, non-infringing SVG)
- **New** `frontend/src/utils/coverArtwork.jsx` — a hand-built SVG artwork engine with
  12 layered scenes (botanical arch, celestial, confetti burst, ribbon frame,
  balloons, art-deco fan, watercolour, terrazzo, sunrise, hearts drift, foliage
  corner, bokeh) and 10 curated colourways. `buildOccasionArtCovers()` produces **10
  covers per occasion**, thematically ordered.
- Wired into `occasionCardDesigns.js` → **150 new artwork covers** (10 × 15 occasions,
  + 10 for "leaving"), all with unique IDs, surfaced first in `CardStart`, the
  `CardDesignGallery`, `CardGallery`, and rendered on `CardView` and the album cover.
- Crisp at any size (pure vector), tiny payload, fully responsive.

## Files
New:      coverArtwork.jsx, coverLayout.js, CoverTextStudio.jsx, migration_cover_text_layout.sql
Modified: CardCoverPreview.jsx, occasionCardDesigns.js, CardStart.jsx, CreateCard.jsx,
          CardView.jsx, AlbumSign.jsx, CardDesignGallery.jsx, cardController.js,
          messageController.js, routes/cards.js, api.js

## Deploy note
Run `database/migration_cover_text_layout.sql` in Supabase before/after deploy. The
code works either way, but the cover layout only persists once the column exists.
(This is separate from the still-pending `migration_movie_prerender.sql`.)
