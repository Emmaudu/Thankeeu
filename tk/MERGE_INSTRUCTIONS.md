# Thankeeu Mentorship — merge into your LIVE repo

Your repo already has the discount / banner / OTP work committed.
**Do NOT paste a whole codebase over it** — that would wipe those changes.

Instead:
1. Copy the **new files** (below) straight into your repo — none of them exist yet, so nothing is overwritten.
2. Hand-merge the **4 shared files** using the exact snippets in Part B.

---

## PART A — New files (copy in as-is, safe)

Copy these from this package into the same paths in your repo:

```
frontend/src/pages/mentorship/          (whole folder — 13 files)
frontend/public/mentorship/             (2 founder images)
backend/controllers/mentorshipController.js
backend/routes/mentorship.js
database/migration_mentorship_2026_08_10.sql
```

None of these paths exist in your repo yet, so copying them in cannot break anything.

---

## PART B — 4 shared files: add these snippets by hand

These files already exist in your repo (with your discount/OTP work).
**Only ADD the lines below. Do not replace the whole file.**

### 1. `frontend/src/utils/workspace.js`

**1a.** In the `RESERVED_SUBDOMAINS` set, add `'mentorship',` alongside the others:

```js
  'mail',
  'mentorship',   // <-- ADD THIS LINE
  'support',
  'www',
```

**1b.** Add this function (put it right after the existing `isAdminHost` export):

```js
export const isMentorshipHost = (hostname = window.location.hostname) => {
  const host = cleanHost(hostname);
  return host === `mentorship.${APP_DOMAIN}` || host === 'mentorship.localhost';
};
```

### 2. `frontend/src/utils/api.js`

Append this block at the very end of the file:

```js
// ─── Thankeeu Mentorship (subdomain app) ─────────────────────────────────────
export const mentorshipAPI = {
  // Public
  apply:        (data) => publicAxios.post('/mentorship/apply', data),
  contact:      (data) => publicAxios.post('/mentorship/contact', data),
  subscribe:    (data) => publicAxios.post('/mentorship/subscribe', data),
  verifySub:    (txRef) => publicAxios.get(`/mentorship/subscribe/verify?tx_ref=${encodeURIComponent(txRef)}`),
  // Admin (uses thankeeu_token via `api` instance)
  adminApplications: (status) => api.get(`/mentorship/admin/applications${status && status !== 'all' ? `?status=${status}` : ''}`),
  adminUpdateApplication: (id, data) => api.put(`/mentorship/admin/applications/${id}`, data),
  adminContacts:     () => api.get('/mentorship/admin/contacts'),
  adminSubscriptions:() => api.get('/mentorship/admin/subscriptions'),
};
```

> NOTE: this relies on `publicAxios` and `api` — both already exist in your api.js.
> If your api.js names them differently, match your names.

### 3. `backend/server.js`

Find the line where the demo route is mounted:

```js
app.use('/api/demo', require('./routes/demo'));
```

Add this line right after it:

```js
app.use('/api/mentorship', require('./routes/mentorship'));
```

### 4. `frontend/src/App.jsx`  (two small additions)

**4a.** Near the other imports at the top, add `isMentorshipHost` to the
existing `workspace` import and import the MentorshipApp:

```js
// find your existing line importing from './utils/workspace' and add isMentorshipHost:
import { /* ...your existing names..., */ isMentorshipHost } from './utils/workspace';

// add this new import:
import MentorshipApp from './pages/mentorship/MentorshipApp';
```

**4b.** Add a short-circuit so the mentorship subdomain renders its own app.
Just ABOVE your existing `const App = () => (` (or `= () => {`), add this
component, then add the early-return as the first line inside `App`.

Add this block just before `const App`:

```jsx
const MentorshipRoot = () => (
  <AuthProvider>
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'font-sans text-sm',
          success: { iconTheme: { primary: '#7F77DD', secondary: '#fff' } },
          duration: 4000,
        }}
      />
      <ScrollToTop />
      <MentorshipApp />
    </BrowserRouter>
  </AuthProvider>
);
```

Then make `App` return `<MentorshipRoot />` first when on the subdomain.

If your `App` currently looks like:
```jsx
const App = () => (
  <AuthProvider> ... </AuthProvider>
);
```
change it to:
```jsx
const App = () => {
  if (isMentorshipHost()) return <MentorshipRoot />;
  return (
  <AuthProvider> ... </AuthProvider>
  );
};
```
(i.e. convert the arrow body from `( ... )` to `{ if (...) return ...; return ( ... ); }`)

> `AuthProvider`, `BrowserRouter`, `Toaster`, `ScrollToTop` are all already
> imported in your App.jsx — no new imports needed for those.

---

## PART C — After merging

1. Run the SQL: `database/migration_mentorship_2026_08_10.sql` in Supabase.
2. In Vercel, add `mentorship.thankeeu.com` as a domain on the same frontend project.
3. In Railway (backend env), set `MENTORSHIP_URL=https://mentorship.thankeeu.com`.
   (FLW keys are already shared, so payments hit the same account automatically.)
4. Build locally once to confirm no import errors: `cd frontend && npm run build`.

That's it. Your discount/banner/OTP work stays untouched; mentorship is added alongside it.
