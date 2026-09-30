-- Adds an opaque per-message edit token so a signer's ownership of their own
-- message can be proven without relying on a client-supplied, publicly-visible
-- email address (which was trivially spoofable — see AlbumSign edit_token fix).
-- The app degrades gracefully if this hasn't been run yet (addMessage.js has
-- fallback insert attempts without this column), but run it as soon as possible
-- to close the old email-match edit vulnerability for newly created messages.

ALTER TABLE messages ADD COLUMN IF NOT EXISTS edit_token TEXT;

-- Not unique/indexed on purpose — tokens are only ever looked up by message id,
-- never searched by token value.
