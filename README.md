# Thankeeu 💜
### Nigeria's Group Card & Gift Platform — including Thankeeu for Teams

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Tailwind CSS + Vite |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Payments | Paystack |
| File Storage | Cloudinary |
| Emails | Resend |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |

---

## 📁 Project Structure

```
thankeeu/
├── database/
│   ├── schema.sql              # Run first — main tables
│   └── schema_teams.sql        # Run second — Teams feature tables
├── backend/
│   ├── server.js
│   ├── .env.example
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── cardController.js
│   │   ├── companyController.js    # Company auth
│   │   ├── dashboardController.js
│   │   ├── messageController.js
│   │   ├── paymentController.js
│   │   ├── subscriptionController.js  # Company subscriptions
│   │   ├── supportController.js       # Support tickets
│   │   ├── teamsController.js         # Excel import, birthday logic
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js             # JWT for individual users
│   │   └── companyAuth.js      # JWT for company accounts
│   ├── routes/
│   │   ├── auth.js
│   │   ├── cards.js
│   │   ├── company.js          # Company auth routes
│   │   ├── dashboard.js
│   │   ├── messages.js
│   │   ├── payments.js
│   │   ├── subscription.js     # Company subscription routes
│   │   ├── support.js          # Support ticket routes
│   │   ├── teams.js            # Teams import/manage routes
│   │   └── admin.js
│   └── utils/
│       ├── supabase.js
│       ├── email.js            # All email templates incl. birthday
│       └── cloudinary.js
└── frontend/
    └── src/
        ├── App.jsx             # All routes incl. company routes
        ├── context/
        │   ├── AuthContext.jsx
        │   └── CompanyAuthContext.jsx  # Company session
        ├── utils/
        │   └── api.js          # All API calls incl. company APIs
        ├── components/
        │   ├── Navbar.jsx      # With Teams dropdown
        │   ├── Footer.jsx
        │   └── company/
        │       └── CompanyLayout.jsx   # Sidebar layout
        └── pages/
            ├── Home.jsx        # With Teams section + dual CTA
            ├── Pricing.jsx     # Individual + Company tabs
            ├── Admin.jsx       # With support ticket management
            └── company/
                ├── CompanySignup.jsx
                ├── CompanyLogin.jsx
                ├── CompanyForgotPassword.jsx
                ├── CompanyDashboard.jsx    # HR overview
                ├── TeamsPage.jsx           # Import + table
                ├── SubscriptionPage.jsx    # Plans + billing
                ├── SettingsPage.jsx        # Profile, bank, theme
                └── SupportPage.jsx         # Contact + history
```

---

## 🚀 Setup — Step by Step

### 1. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `database/schema.sql`
3. Then paste and run `database/schema_teams.sql`
4. Copy your **Project URL** and **Service Role Key** from Settings → API

For an existing database, run these migrations before deploying the updated code:

1. `database/migration_card_payment_verification.sql`
2. `database/migration_recipient_gift_claims.sql`

### 2. Set up Paystack
1. Create account at [paystack.com](https://paystack.com)
2. Get your **Secret Key** and **Public Key** from Settings → API Keys
3. Add webhook: `https://your-backend.railway.app/api/payments/webhook`

### 3. Set up Cloudinary
1. Create account at [cloudinary.com](https://cloudinary.com)
2. Copy **Cloud Name**, **API Key**, and **API Secret**

### 4. Set up Resend
1. Create account at [resend.com](https://resend.com)
2. Verify your sending domain
3. Copy your **API Key**

### 5. Backend
```bash
cd backend
cp .env.example .env
# Fill in all values
npm install
npm run dev
# Runs on http://localhost:5000
```

### 6. Frontend
```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## ☁️ Deployment

### Backend → Railway
1. Push code to GitHub
2. New project on [railway.app](https://railway.app) → Deploy from GitHub
3. Set root to `backend`, add all env vars
4. Railway auto-deploys on every push

### Frontend → Vercel
1. New project on [vercel.com](https://vercel.com) → Import repo
2. Set root to `frontend`
3. Add env vars:
   - `VITE_API_URL` = your Railway URL + `/api`
   - `VITE_PAYSTACK_PUBLIC_KEY` = your Paystack public key
4. Deploy — Vercel handles everything

### Make yourself admin
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 🏢 Thankeeu for Teams — How it works

### Flow
```
HR creates company account → free
HR downloads Excel template → free
HR fills in employee data (unlimited) → free
HR uploads template → free
HR subscribes (₦20k/month or ₦200k/year)
          ↓
2 days before birthday:
  → System detects upcoming birthday
  → Auto-creates a Thankeeu card for the celebrant
  → Emails entire department with signing link + gift pot
          ↓
On the birthday:
  → System sends card + gift link to celebrant
  → HR dashboard updates with delivery confirmation
```

### Company Subscription Pricing
| Plan | Price | Billing |
|------|-------|---------|
| Monthly | ₦20,000 | Per month |
| Yearly | ₦200,000 | Per year (save ₦40,000) |

Data import is always free. Subscription only required to activate automated emails.

---

## 🔑 API Endpoints

### Individual Auth — `/api/auth`
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/signup` | — |
| POST | `/login` | — |
| GET | `/me` | ✅ |
| PUT | `/profile` | ✅ |
| POST | `/forgot-password` | — |
| POST | `/reset-password` | — |

### Company Auth — `/api/company`
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/signup` | — |
| POST | `/login` | — |
| GET | `/me` | 🏢 |
| PUT | `/profile` | 🏢 |
| PUT | `/password` | 🏢 |
| POST | `/forgot-password` | — |
| POST | `/reset-password` | — |

### Teams — `/api/teams`
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/template` | 🏢 |
| POST | `/import` | 🏢 |
| GET | `/` | 🏢 |
| GET | `/departments` | 🏢 |
| GET | `/dashboard` | 🏢 |
| DELETE | `/:memberId` | 🏢 |

### Subscription — `/api/subscription`
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/` | 🏢 |
| POST | `/initialize` | 🏢 |
| GET | `/verify/:reference` | 🏢 |
| POST | `/cancel` | 🏢 |

### Support — `/api/support`
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/` | ✅ or 🏢 |
| GET | `/mine` | ✅ or 🏢 |
| GET | `/all` | 🛡️ Admin |
| POST | `/:ticketId/reply` | 🛡️ Admin |

### Cards — `/api/cards`
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/` | ✅ |
| GET | `/` | ✅ |
| GET | `/public/:slug` | — |
| PUT | `/:slug` | ✅ |
| POST | `/:slug/activate` | ✅ |
| POST | `/:slug/send` | ✅ |
| DELETE | `/:slug` | ✅ |

### Payments — `/api/payments`
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/initialize/purchase` | ✅ |
| POST | `/initialize/contribution` | — |
| GET | `/verify/:reference` | — |
| POST | `/webhook` | — |

---

## 💰 Revenue Model (all built in)

| Stream | Rate | Source |
|--------|------|--------|
| Individual card fee | ₦5,000/card | Activated after successful payment |
| Card pack of 5 | ₦20,000 | ₦4,000/card effective |
| Gift pot cut | 4% | Auto-deducted from each pot |
| Flower delivery referral | 15% | Per vendor order |
| Gift voucher cut | 3–5% | Per redemption |
| Company monthly | ₦20,000/mo | HR subscription |
| Company yearly | ₦200,000/yr | HR subscription |

---

## 📧 Email Templates (all built)

| Template | Trigger |
|----------|---------|
| `welcome` | User signup |
| `cardInvite` | Card activated + invite sent |
| `cardDelivery` | Card sent to recipient |
| `cardReminder` | 2 days before deadline |
| `passwordReset` | Forgot password |
| `companyWelcome` | Company signup |
| `companyPasswordReset` | Company forgot password |
| `birthdayDeptNotice` | 2 days before employee birthday → department |
| `birthdayCelebrant` | On birthday → celebrant |
| `supportTicket` | Ticket submitted → admin email |
| `supportConfirm` | Ticket submitted → sender confirmation |
| `supportReply` | Admin replies → sender |

---

## 🎯 First Steps After Deployment

1. Run both SQL schema files in Supabase
2. Set yourself as admin: `UPDATE users SET role = 'admin' WHERE email = 'your@email.com'`
3. Test a company signup at `/company/signup`
4. Download the team template and upload a test file
5. Subscribe with a test Paystack card
6. Verify birthday cron triggers correctly (check server logs)

Built with 💜 for Nigeria 🇳🇬

---

## 🎉 Thankeeu for Teams — Advanced Features

### Multiple Occasion Tables
Run `SELECT seed_occasion_types('your-company-uuid');` in Supabase after creating a company, or it runs automatically on signup. Default tables created:

| Occasion | Notification | Notice |
|----------|-------------|--------|
| Birthday | Department | 2 days |
| Leaving Company | Department | 7 days |
| Work Anniversary | Department | 7 days |
| Promotion | Department | 7 days |
| Wedding | Department | 7 days |
| Valentine's Day | Company-wide | 7 days |
| Women's Day | Company-wide (females only) | 7 days |
| Men's Day | Company-wide (males only) | 7 days |
| Workers' Day | Company-wide | 7 days |
| Graduation | Department | 7 days |
| New Baby | Department | 7 days |
| Retirement | Company-wide | 14 days |

### Run the 3rd schema file
```sql
-- In Supabase SQL Editor, run this AFTER schema.sql and schema_teams.sql:
schema_occasions.sql
```

### Company Member Tiers
```
HR (company account)
  ↓ creates company account, gets company code
  ↓ uploads all occasion tables
  ↓ approves team leaders

Team Leaders (/member/signup with company code)
  ↓ email must match company domain (@samecompany.com)
  ↓ awaits HR approval
  ↓ once approved, can approve team members in their dept
  ↓ can view dept cards, request deductions

Team Members (/member/signup with company code)
  ↓ email must match company domain
  ↓ awaits HR or Team Leader approval
  ↓ can view dept occasions, create cards, sign cards
```

### Financial Flow (20% platform fee)
```
Contributors send ₦100,000 total to gift pot
  ↓
Platform fee: ₦20,000 (20% of gross)
  ↓
Net to distribute: ₦80,000
  ↓
Team leader requests ₦15,000 for office cake (with reason)
  ↓
HR reviews and approves/rejects deduction request
  ↓
If approved: ₦65,000 sent to celebrant via card link
```

### New API Endpoints

| Route | Description |
|-------|-------------|
| `GET /api/occasions/types` | Get all occasion types for company |
| `GET /api/occasions/template/:name` | Download Excel template |
| `POST /api/occasions/:typeId/import` | Upload Excel for occasion |
| `GET /api/occasions/:typeId/members` | View occasion members |
| `POST /api/members/signup` | Team member/leader signup |
| `POST /api/members/login` | Member login |
| `GET /api/members/me` | Current member profile |
| `GET /api/members/dashboard` | Member dashboard data |
| `GET /api/members/all` | HR: all members |
| `POST /api/members/:id/approve` | Approve member |
| `POST /api/members/:id/reject` | Reject member |
| `GET /api/deductions/wallet/:cardId` | Card wallet details |
| `POST /api/deductions/request` | Team leader deduction request |
| `GET /api/deductions/pending` | HR: pending deductions |
| `POST /api/deductions/:id/approve` | HR approves deduction |
| `POST /api/deductions/:id/reject` | HR rejects deduction |
| `POST /api/deductions/cross-dept` | Request company-wide notification |
| `GET /api/deductions/cross-dept` | HR: pending cross-dept requests |
| `POST /api/deductions/cross-dept/:id/approve` | HR approves cross-dept |

### New Frontend Routes

| Path | Page |
|------|------|
| `/company/teams` | Occasion tables (multi-tab) |
| `/company/members` | HR member approval + company code |
| `/company/deductions` | Deduction + cross-dept requests |
| `/member/signup` | Join company workspace |
| `/member/login` | Team member/leader login |
| `/member/dashboard` | Member/leader dashboard |
| `/member/occasions` | View occasions + create cards |

---

## 🧪 Test Suite

### Backend — 353 tests, 100% pass rate

Uses Node.js 22 built-in `node:test` runner — **zero external test dependencies**.

```bash
cd backend

# Run everything (recommended)
node tests/run-all.js

# Run by category
node --test tests/unit/*.test.js          # 314 unit tests
node --test tests/integration/*.test.js  # 39 integration tests

# Run a specific file
node --test tests/unit/payments.test.js
```

**Test breakdown:**

| File | Tests | What's covered |
|------|-------|----------------|
| `unit/email.test.js` | 44 | All 21 email templates — subjects, HTML, links |
| `unit/utils.test.js` | 40 | Date parsing, domain validation, wallet math, plans |
| `unit/middleware.test.js` | 26 | JWT user/company/member auth, token type isolation |
| `unit/auth.test.js` | 20 | Signup, login, token gen, password reset, hashing |
| `unit/cards.test.js` | 22 | Slug gen, message visibility, stats, send validation |
| `unit/company.test.js` | 20 | Company signup/login, member signup/approval flow |
| `unit/occasions_deductions.test.js` | 55 | 12 occasion configs, gender filter, 20% fee, wallet, deductions |
| `unit/payments.test.js` | 47 | Plan amounts in kobo, plan credits, webhook sig, Paystack processing |
| `integration/routes.test.js` | 39 | Full request→controller pipeline, auth flows, email triggers |

### Frontend — 3 test files (Vitest)

```bash
cd frontend

# Install deps first (after npm registry is available)
npm install

# Run tests
npm test            # vitest run (headless)
npm run test:watch  # vitest (watch mode)
npm run test:coverage
```

**Frontend test breakdown:**

| File | What's covered |
|------|----------------|
| `api.test.js` | Token management, price/fee calculations, occasion helpers, days-until, domain validation, card status logic, wallet display |
| `auth-contexts.test.js` | AuthContext, CompanyAuthContext, MemberAuthContext — login/logout, localStorage isolation, session handling, route protection logic |
| `components.test.js` | Form validation (signup, company, member, deduction, card), Pricing display, Navbar state, occasion labels, company code sharing, route completeness |

### What's tested (business logic coverage)

✅ **20% platform fee always on gross** (not on net-after-deduction)  
✅ **4% gift pot cut** on individual contributions  
✅ **Domain email validation** — member email must match company domain  
✅ **JWT token type isolation** — user/company/member tokens cannot cross auth boundaries  
✅ **Approval hierarchy** — team leader can only approve own dept, not other leaders  
✅ **Deduction math** — cannot exceed net, accumulates correctly  
✅ **12 occasion types** with correct notify days and gender filters  
✅ **Women's Day only notifies female employees**  
✅ **Retirement has 14-day notice** (longest), **Birthday has 2-day notice**  
✅ **All 21 email templates** generate correct HTML and subjects  
✅ **Password hashing** — never stored or returned in plain text  
✅ **Webhook signature** — HMAC-SHA512 verification  
✅ **Paystack kobo amounts** — all verified in both kobo and naira  
✅ **Subscription periods** — monthly ~30 days, yearly ~365 days  
✅ **Company code** — UUID format, used for member signup URL  
## Existing database migrations

Run the SQL migrations in `database/` against an existing Supabase project. The card redesign and voice-note release requires `migration_card_art_and_voice.sql` in addition to the payment-verification and recipient-claim migrations.
