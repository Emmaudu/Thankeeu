Thankeeu — update package
==========================
Extract this zip at the root of your repo (the paths below already match
your project structure, so files will drop straight into place — no manual
moving needed). Overwrites 4 files, adds nothing new.

frontend/src/components/HeroAlbumStack.jsx
  - Homepage hero card stack. Sarah + Jackson now both birthday-themed
    (real photo covers from priority/birthday), full-color/no-fade back
    cards, wider peek offset, "click to view" pill and caption removed.

frontend/src/components/admin/AdminCardDetails.jsx
  - Admin → card stats screen. Added a Delete button per row in the
    Signers table, wired to the same delete-message endpoint used
    elsewhere, with a confirm prompt and live stat/list update.

frontend/src/pages/CardView.jsx
  - Public card view. Added a small red "X" in the top-right corner of
    each signature card, visible only to the card's own logged-in
    creator (card.isCreatorPersonal), to delete a mistaken signature.

backend/controllers/messageController.js
  - deleteMessage now emails the signer whenever someone OTHER than
    themselves removes their signature (creator, recipient, or admin) —
    tells them who removed it and links back to the card. No change to
    who's authorized to delete; that logic already existed.

Nothing else in the repo was touched.
