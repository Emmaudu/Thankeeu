# MCP integration for Thankeeu

**Status:** proposal / not started
**Author:** drafted 2026-09-04
**Target spec:** MCP `2026-07-28`
**Owner:** Emmanuel

---

## 1. Verdict

Yes, it is possible, and the backend is in decent shape for it. But "add MCP to
Thankeeu" is three different products wearing one name, and they are not equally
worth building.

| Surface | Who uses it | Value | Effort | Verdict |
|---|---|---|---|---|
| **A. Internal ops** | Emmanuel, in Claude Code | High — you run 5 products alone | ~1–2 days | **Build first** |
| **B. Teams / HR** | HR admins on Thankeeu for Teams | High — this is the paid tier | ~8–12 days | **Build second** |
| **C. Consumer** | Individual card senders | Low | ~5–8 days | **Do not build yet** |

The reason C is last is worth stating plainly: a greeting card is a *visual,
emotional artifact*. The web UI is the product. Nobody wants to pick a cover
design through a text tool call, and the flow ends in a payment, which must never
be a tool call (§7.1). MCP adds little there.

B is where the money is. HR admins already live in a spreadsheet-and-calendar
world, the occasion data is already synced from their HRIS, and "who has a work
anniversary in the next 14 days, and set up cards for them" is a genuinely good
agent task. That is the differentiating build.

A is where the *leverage* is, this month, for one developer maintaining 74 tables
and 34 route groups.

---

## 2. What MCP actually is, in one paragraph

MCP is a JSON-RPC protocol that lets an LLM client (Claude, ChatGPT, Cursor,
an agent you write) call your functions and read your data through a uniform
interface. You expose **tools** (functions the model may call), **resources**
(read-only documents addressed by URI), and **prompts** (canned workflows). It is
not a new API technology — it is a *description* layer over the API you already
have, plus an auth story, so that a model can discover and use it without you
writing a bespoke integration per client.

**What it is not:** it is not a way to make your API public, it is not a
replacement for your REST endpoints, and it does not make anything safe by
itself. Every authorisation decision you skip becomes an agent's decision.

---

## 3. Facts about this codebase that constrain the design

Verified against the repo on 2026-09-04, not assumed.

| Fact | Where | Consequence |
|---|---|---|
| CommonJS, no `"type": "module"` | `backend/package.json` | SDK v2 is ESM. See §5.1 |
| Prod runs Node 20 | `backend/Dockerfile:3` (`node:20-alpine`) | Node 20 **cannot** `require()` an ESM package. See §5.1 |
| Express 4.21, 34 route groups | `backend/server.js` | Mount MCP as one more router |
| Auth is a single JWT, `HS256`, shared `JWT_SECRET` | `backend/middleware/auth.js` | Cannot be reused as an MCP token. See §6.2 |
| Token read from cookie `tk_user` **or** `Authorization: Bearer` | same | An MCP bearer token would be silently accepted by every existing route. **This is the single most important security consequence in this document.** See §6.2 |
| No refresh tokens; 7-day expiry | `controllers/authController.js:57` | Needs shorter, audience-scoped tokens for MCP |
| Nine distinct token `type`s already exist | `auth.js` `anyAuth`/`optionalAuth` | The pattern for a tenth (`mcp`) already exists |
| **CORS allowlist is dead code** | `server.js:75` — `return callback(null, true)` runs unconditionally | Must be fixed before exposing anything new. See §7.4 |
| `generalLimiter` = 500 req / 15 min | `server.js:118` | An agent loop will exhaust this. Needs its own bucket |
| No OpenAPI spec, no public API, no API keys | repo-wide | MCP would be the **first** non-first-party consumer. There is no prior art here to lean on |
| Supabase JS, service-role key, no RLS in app path | `backend/utils/supabase.js` | Every query is fully privileged. Tenant scoping is *application* logic — an MCP tool that forgets a `.eq('company_id', …)` leaks across tenants |

That last row is the real risk of this project. It is not MCP-specific, but MCP
multiplies it, because a model will happily call a tool with arguments you did
not anticipate.

---

## 4. Architecture

The `2026-07-28` spec made MCP **stateless**: no `initialize` handshake, no
`Mcp-Session-Id`, no session affinity. Every request carries its own protocol
version and client identity in `_meta`. This is very good news for us — it means
the MCP endpoint is an ordinary POST route that can sit behind the existing load
balancer with no sticky sessions and no new infrastructure.

```
Claude / ChatGPT / Cursor
        │  JSON-RPC over HTTPS POST  (Streamable HTTP)
        ▼
api.thankeeu.com/mcp            ← new Express router
        │
        ├── mcpAuth middleware   ← validates an MCP-audience JWT, resolves tenant
        │
        └── tool handlers        ← call the SAME controllers/services as REST
                │
                ▼
        Supabase (service role)
```

**Non-negotiable design rule:** tool handlers must not re-implement business
logic. They call the same functions the REST controllers call. Where a
controller is written as an Express handler (`(req, res) => …`) and cannot be
called directly, extract the body into a plain service function first and have
*both* call it. Any logic duplicated between REST and MCP will drift, and the
drift will be a security bug, not a cosmetic one.

### 4.1 Protocol details that matter for implementation

From the `2026-07-28` changelog, these are the ones that change how you write code:

- **No `initialize`.** Do not write connection setup logic.
- **`server/discover` is mandatory** — the SDK implements it; do not hand-roll.
- **Headers `Mcp-Method` and `Mcp-Name` are required** on POST. Useful: you can
  rate-limit and authorise *per tool name at the edge* without parsing the body.
- **Every result needs `resultType`** (`"complete"` or `"input_required"`).
- **List results need `ttlMs` + `cacheScope`.** Set `cacheScope: "private"` on
  anything tenant-specific. Getting this wrong means a shared intermediary could
  cache one company's tool list and serve it to another.
- **MRTR replaces elicitation/sampling.** To ask the user something mid-tool,
  return `resultType: "input_required"` with `inputRequests`; the client retries
  the original call with `inputResponses`. Encode your own correlation id in
  `requestState` — the old `elicitationId` is gone.
- **Sampling, Roots and Logging are deprecated.** Do not build on them.
- **SSE resumability is gone.** A dropped stream loses the request; the client
  re-issues it. **Therefore every write tool must be idempotent** (§7.2).

### 4.2 Version pinning

Pin the protocol revision explicitly and log the client's requested version.
When `2027-xx-xx` lands you want a dashboard of which clients are on what, not a
surprise. Version mismatches must return `UnsupportedProtocolVersionError`
(`-32022`); the SDK does this for you.

---

## 5. Phase 0 — internal ops server (build this first)

**Goal:** you, in Claude Code, asking "why didn't card `abc-123` deliver?" and
getting an answer in one turn instead of six Supabase queries.

**Transport:** stdio. Runs on your machine, talks to prod Supabase with the
service-role key from your existing `.env`. **No OAuth, no public exposure, no
new attack surface.** This is why it is first: nearly all of the value, almost
none of the risk.

**Location:** `backend/mcp/internal/server.js`, run via
`node backend/mcp/internal/server.js`, registered in your local
`.mcp.json`. It is not mounted in `server.js` and never ships to prod.

### 5.1 The Node 20 / ESM problem — read this before you start

The MCP TypeScript SDK v2 (`@modelcontextprotocol/server`, `@modelcontextprotocol/node`)
is ESM-only. This backend is CommonJS and prod is pinned to `node:20-alpine`.
`require()` of an ESM package works from Node **22.12+** only — it will throw
`ERR_REQUIRE_ESM` on Node 20.

Three options, in order of preference:

1. **Dynamic `import()` inside an async bootstrap.** Works in CommonJS on Node 20
   today, zero infrastructure change. This is the recommended path.
   ```js
   // backend/mcp/bootstrap.js  (CommonJS)
   let sdk;
   const loadSdk = async () => {
     if (!sdk) {
       const [server, node] = await Promise.all([
         import('@modelcontextprotocol/server'),
         import('@modelcontextprotocol/node'),
       ]);
       sdk = { ...server, ...node };
     }
     return sdk;
   };
   module.exports = { loadSdk };
   ```
2. **Bump the base image to `node:22-alpine`.** Node 22 is LTS and you get
   `require(esm)` plus a faster runtime. Low risk, but it is a deploy-wide change
   — do it deliberately, not as a side effect of this project.
3. **Split the MCP server into its own small ESM service.** Cleanest boundary,
   but it is a second deployable, a second set of env vars, and a second thing to
   monitor. Not worth it for a solo founder yet.

Do **not** convert the backend to ESM for this. That is a multi-day refactor with
no user-visible benefit and a large regression surface across 34 route groups.

### 5.2 Phase 0 tools

Keep it small. These are the questions you actually ask when something breaks.

| Tool | Arguments | Returns |
|---|---|---|
| `ops_find_card` | `slug \| id \| recipient_email` | Card row + status, `send_date`, signature count, gift total |
| `ops_card_timeline` | `slug` | Ordered events: created → activated → signed ×N → scheduled → delivered, with timestamps |
| `ops_delivery_diagnosis` | `slug` | The scheduler's view: is it armed, `fireAtMs`, did the due-date guard pass, last email attempt |
| `ops_find_money_transfer` | `slug \| payment_ref \| recipient_email` | `money_transfers` row, claim state, payout state |
| `ops_payment_trace` | `tx_ref` | Matches `tx_ref` prefix (`TK-FEE-`/`TK-GIFT-`/`TK-SEND-`/`TK-SEND-WD-`) to its table and shows the verification trail |
| `ops_email_log` | `email \| slug`, `limit` | Which templates were sent, when, and the Resend response |
| `ops_table_counts` | `since` | Row deltas across the 12 tables that matter, for "is anything stuck?" |

Read-only. Every one of them. Phase 0 ships **no write tools** — if you want to
resend an email, the tool returns the exact command or link and you run it.

**Effort:** 1–2 days including the bootstrap and a smoke test.

---

## 6. Phase 1 — remote Teams server

**Goal:** an HR admin connects Thankeeu in Claude and asks
*"who has a work anniversary in the next 14 days?"* → *"set up leaving cards for
the three people in the Lagos branch and invite their teams."*

### 6.1 Endpoint

```
POST https://api.thankeeu.com/mcp
GET  https://api.thankeeu.com/.well-known/oauth-protected-resource
```

Mounted in `server.js` **after** `tenantResolver` and **before** the `app.use('*')`
404, with its own rate limiter (§7.5).

### 6.2 Auth — the part to get right

The MCP server is an **OAuth 2.0 Resource Server**. It does not mint tokens for
itself out of the existing login flow.

> ⚠️ The precise auth requirements below are from the stable parts of the spec
> that predate `2026-07-28` plus that release's hardening notes. I was able to
> verify the changelog and release post directly, but the authorization spec page
> itself did not load for me. **Re-read
> <https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization>
> before implementing this section** rather than trusting this summary.

What is required:

1. **Protected resource metadata** at `/.well-known/oauth-protected-resource`
   (RFC 9728), naming the authorization server and the resource identifier.
2. **`401` with `WWW-Authenticate: Bearer resource_metadata="…"`** so clients can
   discover where to authenticate.
3. **Audience validation.** The token's `aud` must be *this* resource. Reject
   anything else.
4. **No token passthrough.** The MCP server must never forward a client's token
   to a third party, and must never accept a token minted for something else.

Hardening added in `2026-07-28`: validate the `iss` parameter (RFC 9207) before
redeeming a code; Dynamic Client Registration is **deprecated** in favour of
Client ID Metadata Documents, so prefer CIMD and keep DCR only as fallback; and
client credentials must be keyed by issuer and never reused across authorization
servers.

**The trap specific to this codebase.** `middleware/auth.js` accepts a bearer
token on *every* `/api/*` route and the current JWTs carry no `aud` claim. If you
mint MCP tokens with the same `JWT_SECRET`, an MCP token becomes a **full session
token for the entire REST API** — the agent's narrow, revocable, read-only grant
silently becomes the user's whole account. This is the confused-deputy problem in
its most concrete form.

Two acceptable fixes, both required:

- Mint MCP tokens with a **separate secret** (`MCP_JWT_SECRET`) *and* an explicit
  `aud: 'https://api.thankeeu.com/mcp'`, `type: 'mcp'`, plus a `scopes` array.
- Add an `aud` check to the existing `auth`/`anyAuth` middleware so a token with
  `type: 'mcp'` is **rejected** by the REST routes. Do this in the same PR — a
  new token type that the old middleware accepts is worse than no MCP at all.

Token lifetime: 1 hour access, with refresh. Not 7 days. An agent token that
leaks should die quickly.

Scopes — start with four, coarse and honest:

| Scope | Grants |
|---|---|
| `cards:read` | List/read cards, signatures, delivery status for the tenant |
| `people:read` | Read `company_members`, `occasion_members`, upcoming occasions |
| `cards:write` | Create draft cards, invite signers |
| `cards:send` | Activate and schedule delivery |

`cards:send` is deliberately separate. Sending is the irreversible one.

### 6.3 Phase 1 tools

Twelve, not thirty-four. Resist mapping routes 1:1 — a model chooses badly from a
long, similar list, and every tool is attack surface.

**Read (`cards:read`, `people:read`)**

| Tool | Purpose |
|---|---|
| `list_upcoming_occasions` | Birthdays/anniversaries in a window, from `occasion_members`. The headline tool |
| `list_cards` | Filter by status, occasion, branch, date range |
| `get_card` | One card: recipient, cover, signature count, gift total, delivery state |
| `list_members` | Search `company_members` by name/branch/department |
| `get_card_signing_status` | Who has and has not signed — the actual nudge question |
| `get_team_summary` | Counts for a period: cards sent, sign rate, collected |

**Write (`cards:write`)**

| Tool | Purpose |
|---|---|
| `create_card_draft` | Draft only. Never auto-sends. Returns a dashboard URL |
| `invite_signers` | Add invitees to an existing card |
| `set_card_schedule` | Set/change `send_date` |
| `nudge_unsigned` | Reminder email to non-signers (rate-limited, see §7.3) |

**Send (`cards:send`)**

| Tool | Purpose |
|---|---|
| `activate_card` | Move draft → open. Requires MRTR confirmation |
| `send_card_now` | Deliver immediately. Requires MRTR confirmation |

**Resources** (read-only, URI-addressed): `thankeeu://card/{slug}`,
`thankeeu://occasions/upcoming`, `thankeeu://company/summary`.

**Prompts:** `plan-this-months-cards`, `chase-unsigned-cards`. These are where
the product actually shines — a canned multi-step workflow beats twelve tools the
model has to sequence itself.

**Effort:** 8–12 working days. Auth is ~half of it. Budget accordingly and do not
believe the first estimate.

---

## 7. Security rules

These are not optional and not negotiable.

### 7.1 Payments are never a tool

No tool may charge a card, move money, trigger a payout, or claim a gift.
Not `initPayment`, not `claim`, not withdrawals, not Reloadly orders.

Two independent reasons:

- **Regulatory.** Send Money is money transmission. An LLM initiating a transfer
  with no human in the loop is not a position to put yourself in with the CBN, and
  it is not a position to put a *user* in either.
- **Technical.** Flutterwave's inline checkout requires a browser and a human.
  There is no headless path that is not a fraud vector.

The correct pattern: a tool returns a **URL** and the human completes it. That is
it. `create_card_draft` returns `https://www.thankeeu.com/dashboard/cards/{slug}`;
the human clicks, reviews, pays.

### 7.2 Every write tool must be idempotent

The `2026-07-28` transport dropped stream resumability — a dropped connection
means the client re-issues the request. Without idempotency, a flaky mobile
connection sends the card twice.

Take an `idempotency_key` argument on every write tool, store it in a new
`mcp_tool_calls` table with a UNIQUE constraint, and return the prior result on
replay. You already use exactly this pattern for payment refs; reuse the thinking.

### 7.3 Rate-limit the human-visible side effects

`nudge_unsigned` sends email to real colleagues. An agent in a retry loop turns
that into harassment and your Resend domain into a spam signal. Cap it per card
per day at the *database* level (a `last_nudged_at` column), not in the limiter —
limiters reset, reputations do not.

### 7.4 Fix the CORS bug before shipping any of this

`server.js:75` returns `callback(null, true)` unconditionally, so the allowlist
above it never runs and **every origin is allowed** with `credentials: true`.
Combined with `sameSite: 'none'` cookies (`authController.js:18-30`), that is a
standing CSRF exposure today. It is not caused by MCP, but shipping a new
authenticated surface on top of it is not defensible.

This is a two-line fix: delete line 75 and return
`callback(new Error('Not allowed by CORS'))`. Do it in its own PR, watch the
error logs for a day, then start the MCP work.

### 7.5 Its own rate limiter

`generalLimiter` (500 / 15 min) is sized for humans clicking. Add:

```js
const mcpLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,                       // per token, not per IP
  keyGenerator: (req) => req.mcp?.tokenId || req.ip,
  standardHeaders: true,
});
app.use('/mcp', mcpLimiter);
```

Key on the token, not the IP — several employees behind one office NAT must not
share a bucket.

### 7.6 Tenant scoping is the highest-risk area

There is no RLS in the application path; every Supabase call runs as service
role. A tool handler that omits `.eq('company_id', req.mcp.companyId)` leaks
another company's employee data.

Do not rely on discipline. Write one wrapper —
`scopedQuery(req, 'cards')` — that applies the tenant filter, and lint or
grep-check that no `supabase.from(` appears directly inside `backend/mcp/`.
A test that greps the MCP directory for raw `.from(` calls is crude and it will
save you.

### 7.7 Return the minimum

Do not return raw DB rows. An LLM client may log, cache, or train on responses.
Map to explicit DTOs: no `password_hash`, no `bank_accounts` fields, no full
`recipient_email` where a name suffices, no HRIS `api_key` columns. Write the
mapper by allowlist, never by deleting keys from a spread.

---

## 8. Data model additions

```sql
-- OAuth clients registered against the MCP resource server
create table mcp_clients (
  id              uuid primary key default gen_random_uuid(),
  client_id       text unique not null,
  client_name     text not null,
  redirect_uris   jsonb not null default '[]',
  issuer          text not null,             -- credentials are bound to this
  created_at      timestamptz not null default now()
);

-- Consent grants: which company allowed which client, with what scopes
create table mcp_grants (
  id              uuid primary key default gen_random_uuid(),
  client_id       text not null references mcp_clients(client_id) on delete cascade,
  company_id      uuid references companies(id) on delete cascade,
  user_id         uuid references users(id) on delete cascade,
  scopes          text[] not null default '{}',
  revoked_at      timestamptz,
  created_at      timestamptz not null default now(),
  constraint mcp_grants_subject check (company_id is not null or user_id is not null)
);
create index mcp_grants_client_idx on mcp_grants(client_id) where revoked_at is null;

-- Idempotency + audit in one table (§7.2)
create table mcp_tool_calls (
  id              uuid primary key default gen_random_uuid(),
  grant_id        uuid references mcp_grants(id) on delete set null,
  tool_name       text not null,
  idempotency_key text,
  arguments       jsonb,
  result_summary  jsonb,
  status          text not null default 'ok',
  created_at      timestamptz not null default now(),
  unique (grant_id, tool_name, idempotency_key)
);
create index mcp_tool_calls_grant_idx on mcp_tool_calls(grant_id, created_at desc);
```

`mcp_tool_calls` doubles as the audit log. When an HR admin asks "why did
everyone get a reminder on Saturday?", this table is the answer. Surface it in
the company dashboard — visible agent activity is a trust feature, not just an
ops one.

Revocation: a "Connected apps" panel listing grants with a revoke button. Ship it
**with** Phase 1, not after. A connection a user cannot sever is one they should
never have been offered.

---

## 9. Testing

The existing discipline applies — `node --test` for the backend (423 passing),
Playwright for anything rendered. Add:

| Test | Asserts |
|---|---|
| `mcp-auth.test.js` | A token with `type:'mcp'` is **rejected** by `auth`/`anyAuth`; a web token is rejected by `mcpAuth`; `aud` mismatch → 401 with correct `WWW-Authenticate` |
| `mcp-tenant.test.js` | Every read tool with company A's grant returns zero of company B's rows. Table-driven over all tools — not a spot check |
| `mcp-idempotency.test.js` | Replaying a write tool with the same key returns the prior result and does not double-write |
| `mcp-dto.test.js` | Structural: no tool output contains `password`, `api_key`, `secret`, `token`, `account_number` |
| `mcp-no-raw-query.test.js` | Greps `backend/mcp/` for `supabase.from(` outside the scoped wrapper |
| `mcp-schema.test.js` | Every tool's `inputSchema` is valid JSON Schema 2020-12 and every tool has a description |

The tenant and DTO tests are the ones that matter. Write them before the tools.

---

## 10. Sequencing

| # | Work | Days | Blocks |
|---|---|---|---|
| 0 | Fix CORS (§7.4) | 0.25 | everything |
| 1 | Extract controller bodies into callable services (cards, occasions, members) | 2 | 3, 6 |
| 2 | Phase 0 internal stdio server + 7 read tools | 1.5 | — |
| 3 | `mcp_*` tables + scoped query wrapper + DTO mappers | 1.5 | 6 |
| 4 | OAuth resource server: metadata, 401, audience validation, CIMD | 4 | 6 |
| 5 | `aud`/`type` rejection in existing middleware + tests | 1 | 6 |
| 6 | Phase 1 read tools (6) | 2 | 7 |
| 7 | Phase 1 write tools (4) + idempotency + MRTR confirmation on send (2) | 3 | 8 |
| 8 | Connected-apps / revocation UI | 1.5 | ship |
| 9 | Test suite (§9) | 2 | ship |
| | **Total to Phase 1 shipped** | **~19 days** | |

Phase 0 alone is items 0 + 2 ≈ **2 days** and is independently useful. Ship it
this week regardless of whether Phase 1 ever happens.

---

## 11. What I would cut

- **Consumer MCP (surface C).** No evidence of demand, ends in a payment, and the
  UI is the product.
- **Resources, in v1.** Tools alone cover the use cases. Add resources when a
  client asks.
- **`subscriptions/listen`.** Live push of card changes sounds appealing and buys
  nothing that a poll of `list_cards` does not. Skip until asked.
- **The MCP registry listing.** List after it works with real HR customers, not
  before. A public listing of a half-built server generates support load, not
  signups.
- **Anything touching `games_*`, `pals`, `movies`, `vendor`, `mentorship`.**
  Twelve tools, one product surface. Breadth is how MCP servers become unusable.

---

## 12. Open decisions

1. **Own authorization server, or delegate?** Building one is real work and real
   risk. Supabase Auth or WorkOS/Auth0 as the AS, with Thankeeu purely as the
   resource server, is likely faster and safer. *Recommendation: delegate.*
2. **Company tokens or member tokens?** `anyAuth` already distinguishes
   `company` from `company_member`. Member-scoped is more correct (audit shows a
   person) but more plumbing. *Recommendation: member-scoped, since the audit
   trail is a selling point.*
3. **Node 22 bump, or dynamic `import()`?** §5.1. *Recommendation: dynamic import
   now, plan the Node 22 bump separately.*
4. **Is Thankeeu for Teams' customer base large enough today to justify 19 days?**
   This is the only question that actually decides the project, and it is not a
   technical one. If the honest answer is "not yet", build Phase 0, ship it, and
   revisit Phase 1 when a customer asks for it — which is also the point at which
   you can charge for it.

---

## 13. References

- [MCP `2026-07-28` changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog) — stateless core, MRTR, `server/discover`, cacheable lists
- [The 2026-07-28 Specification (release post)](https://blog.modelcontextprotocol.io/posts/2026-07-28/) — Tier-1 SDK availability, migration notes
- [TypeScript SDK: supporting 2026-07-28](https://ts.sdk.modelcontextprotocol.io/v2/migration/support-2026-07-28) — `createMcpHandler`, `toNodeHandler`, v2 packages
- [Authorization spec](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) — **read before implementing §6.2**
- [RFC 9728 — OAuth 2.0 Protected Resource Metadata](https://datatracker.ietf.org/doc/html/rfc9728)
- [RFC 9207 — OAuth 2.0 Authorization Server Issuer Identification](https://datatracker.ietf.org/doc/html/rfc9207)
