# Thankeeu — Round 2: draft fix, album editing, free flipbook, 3D flip + sound

Priority cluster delivered: **draft-save bug + album editing**, plus the contained
carousel-removal item. Remaining clusters (landing-page hero rework, more design-system
polish) are noted at the end as still-to-do.

## ✅ Draft "Could not save your draft" — FIXED
Root cause: the create-card insert fallback that strips columns your live DB may not
have yet (e.g. `cover_layout`, `card_experience`) matched the missing column by a loose
substring scan, which could fail and throw. Rewrote it to parse the exact column name
out of the Postgres error (`column "x" does not exist`) and retry cleanly, longest-name
first. Drafts now save even before you run the new migration.
- `backend/controllers/cardController.js` (create + update paths hardened)

## ✅ Flipbook — flip freely to ANY page
- Prev/next only disabled at the true ends; **dots** for ≤12 pages, and a **"Go to
  page" dropdown + Cover / Sign shortcuts** when there are many signers (so 31 pages is
  one tap, not 31 dots).
- **Keyboard ← →** and **swipe** now flip pages (ignored while typing/editing).
- `frontend/src/pages/AlbumSign.jsx`

## ✅ Realistic 3D page-flip + flip sound
- New 3D curl keyframes (perspective rotateY past 90°, shadow + brightness sweep, a
  sheen that sweeps across the turning leaf).
- **Page-flip sound** generated live via Web Audio (filtered noise "swish" — no asset
  needed), with an on-screen **mute toggle**. First user interaction resumes audio.

## ✅ Cover text font size > 56 and increments now reflect
- Size cap raised 56 → **120** (model + studio slider).
- Font sizing switched to **container-query units (`cqw`)** so increasing the size
  visibly scales the text on the cover — including the **album flipbook cover** (which
  previously ignored size). Applies in the live preview, CardView and the sign page.
- `coverLayout.js`, `CoverTextStudio.jsx`, `CardCoverPreview.jsx`, `AlbumSign.jsx`

## ✅ LIVE ALBUM PREVIEW is now interactive
Rewrote `AlbumStudioPreview`:
- **Cover**: drag / recolour / show-hide texts directly on it (shares the cover editor).
  Hidden fields disappear from the preview immediately.
- **Message spread**: tap the **Photo / GIF**, **Video**, **Voice** placeholders to
  upload right there; uploaded media fills the tile and opens a **larger lightbox**
  preview on click. Placeholders enlarged; "More love" tile reduced.
- **Gift**: when a gift pot is on, the "More love" tile becomes a **💸 money** (or **🎁
  gift**) emoji tile.
- **Photo / GIF chooser**: tapping the photo tile offers **Upload Photo** or **Upload
  GIF**.

## ✅ Message-board option → board-style live preview
When "Message board" is selected, the live preview switches to the **Card-View board
style** (hero + message tiles) instead of the album, and lets you **upload the
recipient's photo** (stored to Cloudinary via the existing recipient-photo endpoint).

## ✅ Upload your own design → renders as the cover (Cloudinary)
- New endpoint `POST /cards/upload-cover` (Cloudinary, reuses the image pipeline).
- CardStart + CreateCard upload the chosen image and use the returned URL as the cover;
  it renders as a real image cover in the picker, live preview, CardView and the album
  sign cover (with auto light text for contrast).

## ✅ Old plain templates retired from the pickers
The gallery, CardStart and CreateCard now show **only the SVG artwork covers** for each
occasion (+ your upload option). The old flat-gradient templates remain in code as safe
fallbacks but no longer clutter the chooser. Default design is now `birthday-art-1`, and
changing occasion auto-selects that occasion's first artwork cover.

## ✅ Dashboard create flow aligned
`CreateCard` now uses `CardCoverPreview` for artwork covers, the occasion-filtered
artwork list, the Cloudinary custom-upload, and the shared cover-text studio + icons.

## ✅ Removed the "Colleague leaving tomorrow?" showcase section
Removed the shared `HeroShowcase` carousel from LeavingCardPage and every
OccasionHeroTemplate page (Birthday, Baby Shower, etc.). Each page keeps its own hero
slideshow above it. The homepage keeps its showcase.

## Deploy notes
- Run `database/migration_cover_text_layout.sql` (from round 1) when convenient — drafts
  now work with or without it.
- For persistent uploads, Cloudinary env vars must be set (same ones the app already
  uses for message media / music). Without them, uploads fall back to local `/uploads`.

## Still to do (next passes, per your priority order)
- Landing pages (Retirement/Leaving/Birthday + Birthday occasion) conversion rework with
  stronger hero imagery and copy.
- Inline media editing on already-signed pages (currently text-inline + full media on
  the blank compose page and in the live preview).
