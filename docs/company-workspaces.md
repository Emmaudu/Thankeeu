# Company Workspace Subdomains

Thankeeu now supports organization workspaces through wildcard subdomains.

Examples:

- `flutterwave.thankeeu.com`
- `mtn.thankeeu.com`
- `access-bank.thankeeu.com`

The public marketing site remains on `thankeeu.com` / `www.thankeeu.com`. Workspace dashboards are private and resolved from the company slug.

## Database Migration

Run this Supabase migration before deploying the code:

`database/migration_company_workspace_slugs.sql`

It adds `companies.slug`, backfills existing companies with URL-safe slugs, adds a format check, and creates a unique index.

## Namecheap / Vercel DNS

For wildcard workspaces on Vercel, use Vercel DNS nameservers. This keeps the domain registered at Namecheap, but lets Vercel manage DNS for `thankeeu.com` and `*.thankeeu.com`.

In Namecheap:

1. Open Domain List.
2. Click Manage beside `thankeeu.com`.
3. In Nameservers, choose Custom DNS.
4. Add:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
5. Save.

Before switching nameservers, copy any existing DNS records you still need, such as email `MX`, SPF/DKIM/DMARC `TXT`, Google Search Console verification, or other third-party records. Recreate those records in Vercel DNS after the nameserver change.

DNS propagation can take a few minutes to 48 hours. After propagation, click Refresh in Vercel.

If you do not want to move DNS to Vercel, do not use `*.thankeeu.com` in Vercel. Instead, add each company subdomain individually in Vercel and create matching DNS records in Namecheap, but that is not scalable for automatic company workspaces.

## Vercel

Add both domains to the Vercel project:

- `thankeeu.com`
- `*.thankeeu.com`

The existing SPA rewrite to `/index.html` supports arbitrary workspace paths such as `/dashboard`, `/members`, `/employees`, `/cards`, `/settings`, and `/hris`.

Frontend environment variables:

- `VITE_APP_DOMAIN=thankeeu.com`
- `VITE_APP_URL=https://www.thankeeu.com`
- `VITE_WORKSPACE_BASE_URL=https://thankeeu.com`
- `VITE_API_URL=/api` when using Vercel rewrites, or your API URL when calling Railway directly

## Backend / Railway

Backend environment variables:

- `APP_DOMAIN=thankeeu.com`
- `WORKSPACE_BASE_URL=https://thankeeu.com`
- `FRONTEND_URL=https://thankeeu.com`

The frontend sends `X-Workspace-Slug` for API calls from a workspace. The backend can also resolve the workspace from `Host`, `Origin`, or `Referer`.

## Local Development

Run the normal frontend and backend servers, then open:

- `http://demo.localhost:5173`
- `http://mtn.localhost:5173`

Modern browsers resolve `*.localhost` to your local machine. Vite is configured with `host: '0.0.0.0'` so those hostnames work.

## Security Model

Company and member JWTs still carry the company id. When a request comes from a workspace subdomain, backend auth middleware verifies the token company matches the resolved workspace company. A user logged into `flutterwave.thankeeu.com` cannot access `mtn.thankeeu.com` unless their token belongs to MTN.
