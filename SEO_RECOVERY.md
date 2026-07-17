# Thankeeu SEO recovery after deployment

Google sitelinks are selected automatically; code can improve the signals but cannot force a particular nested layout. This round repairs the site's crawlable HTML, canonicals, internal-link hierarchy, structured data, and sitemap consistency.

After deploying:

1. Confirm `https://thankeeu.com` permanently redirects to `https://www.thankeeu.com/` and that every tested page has exactly one self-referencing `www` canonical.
2. In Google Search Console, submit `https://www.thankeeu.com/sitemap.xml` again.
3. Use URL Inspection on the homepage, `/occasions/birthday`, `/cards/leaving-card`, `/cards/retirement`, `/live-memory-wall`, `/pricing`, and `/how-it-works`; run **Test live URL**, then **Request indexing**.
4. Check **Pages / Indexing** for accidental `noindex`, redirect, duplicate-canonical, soft-404, or server-error exclusions.
5. Keep the new Cards navigation and page titles stable while Google recrawls the hierarchy. Do not alternate between apex and `www` URLs in links, environment variables, or sitemap entries.
6. Validate the homepage and key pages with Google's Rich Results Test, then monitor the branded `thankeeu` query in Search Console Performance.

Sitelinks and recrawling can take time after deployment. The important immediate check is that Search Console's live test sees the heading, descriptive text, key internal links, one canonical, and an indexable 200 response.
