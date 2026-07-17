# Round 4 changes - 2026-07-17

## Smart album pagination

- Albums with up to 9 pages use one non-wrapping row of dots.
- Larger albums use Previous/Next, First/Last, and a compact jump-to-page select.
- Added accessible labels and disabled-state behaviour.

## Live Memory Wall

- Live Wall now replaces album/board content in the large studio preview whenever the wall experience is enabled.
- Two-column carousel-card preview with photo, video, voice-note, message, caption, and sender placeholders.
- Delivered wall now supports up to 5 media items per person's card, including voice notes.
- Added separate message and media caption fields, card carousels, two-column unlimited feed, 8-card server pagination, first/last controls, page select, and colorful scrollbar.
- Added paginated API responses and a backward-compatible database fallback.
- Run `database/migration_wall_carousel_voice.sql` in Supabase before deploying the new wall, or run the updated `database/RUN_THIS_IN_SUPABASE.sql`.
- Restored self camera/microphone permissions in the production Vercel policy.

## SEO recovery

- Normalized production canonicals and sitemap/prerender URLs to `https://www.thankeeu.com`.
- Fixed the hreflang DOM bug that collapsed `en` and `x-default` into one tag.
- Removed the retired and misleading sitelinks-search action.
- Added crawlable first-response homepage and marketing-page content.
- Added a stable Cards navigation hierarchy linking Birthday, Leaving, Retirement, and Live Wall pages on desktop and mobile.
- Removed the unrelated games sitemap declaration and refreshed homepage sitemap last-modified date.

## Validation note

The source was statically checked in this workspace. Windows Defender blocked every available Node executable as a potential unwanted application, and the extracted archive contains no `node_modules`, so a local Vite compile could not be completed here.
