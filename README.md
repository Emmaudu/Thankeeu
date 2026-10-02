# ⚡ Taskeeu — Nigerian Task Outsourcing Platform

> Nigeria's premier platform for outsourcing physical tasks across any city. Verified taskers, escrow payments, real-time chat, and full KYC protection.

---

## 📁 Project Structure

```
taskeeu/
├── database/
│   └── schema.sql          # Full PostgreSQL schema (run in Supabase)
├── backend/                # Node.js + Express API
│   ├── server.js           # Main server + Socket.io
│   ├── .env.example        # Copy to .env and fill in
│   ├── routes/
│   │   ├── auth.js         # Registration, login, JWT
│   │   ├── tasks.js        # Task CRUD, bidding, completion
│   │   ├── taskers.js      # Tasker profiles, availability, direct apply
│   │   ├── payments.js     # Paystack, escrow, refunds, custom payments
│   │   ├── chat.js         # Chat rooms, messages, notifications
│   │   └── admin.js        # KYC approvals, user management
│   ├── middleware/
│   │   └── auth.js         # JWT verify, role guard
│   ├── utils/
│   │   ├── supabase.js     # Supabase client
│   │   ├── cloudinary.js   # File upload configs
│   │   ├── email.js        # Resend email templates
│   │   └── paystack.js     # Paystack API helpers
│   └── socket/
│       └── chatSocket.js   # Socket.io real-time chat
└── frontend/               # React + Tailwind
    ├── src/
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Tasks.jsx           # Task listings with filters
    │   │   ├── TaskDetail.jsx      # Task detail + bidding
    │   │   ├── Taskers.jsx         # Tasker directory
    │   │   ├── TaskerProfile.jsx   # Public tasker profile
    │   │   ├── PostTask.jsx        # Multi-step task creation
    │   │   ├── Auth.jsx            # Login + multi-step signup
    │   │   ├── RequesterDashboard.jsx
    │   │   ├── TaskerDashboard.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   ├── HowItWorks.jsx
    │   │   ├── Policy.jsx
    │   │   └── PaymentCallback.jsx
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Navbar.jsx      # Full responsive navbar
    │   │   │   └── Footer.jsx
    │   │   └── ui/
    │   │       ├── TaskCard.jsx
    │   │       ├── TaskerCard.jsx
    │   │       └── ChatWindow.jsx  # Full real-time chat with reactions
    │   ├── context/
    │   │   ├── AuthContext.jsx     # Global auth state
    │   │   └── SocketContext.jsx   # Socket.io state
    │   └── utils/
    │       └── api.js              # Axios client + all API helpers
    └── tailwind.config.js
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- A [Supabase](https://supabase.com) project
- A [Cloudinary](https://cloudinary.com) account
- A [Paystack](https://paystack.com) account (Nigerian business)
- A [Resend](https://resend.com) account for emails

---

### 1. Database Setup (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste the entire contents of `database/schema.sql`
3. Run it — this creates all tables, indexes, and triggers
4. Copy your **Project URL** and **Service Role Key** from Settings → API

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in all values in .env
npm install
npm run dev
```

**Required `.env` values:**

| Variable | Where to get it |
|---|---|
| `SUPABASE_URL` | Supabase → Settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → service_role key |
| `JWT_SECRET` | Any random 32+ character string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary Dashboard |
| `PAYSTACK_SECRET_KEY` | Paystack Dashboard → Settings → API |
| `PAYSTACK_PUBLIC_KEY` | Paystack Dashboard → Settings → API |
| `RESEND_API_KEY` | Resend Dashboard |
| `FRONTEND_URL` | `http://localhost:5173` in dev, your Vercel URL in production |

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`

---

### 4. Create Admin Account

After running the database schema, update the seeded admin password:

```sql
-- In Supabase SQL Editor
UPDATE users
SET password_hash = '$2b$12$YOUR_BCRYPT_HASH_HERE'
WHERE email = 'admin@taskeeu.com';
```

Generate a bcrypt hash using:
```bash
node -e "const b=require('bcryptjs'); b.hash('YourPassword123',12).then(console.log)"
```

---

## 🌍 Deployment

### Backend → Railway

1. Create a new Railway project at [railway.app](https://railway.app)
2. Connect your GitHub repo, select the `backend/` folder as root
3. Add all environment variables from `.env`
4. Set **Start Command**: `node server.js`
5. Railway auto-deploys on push

### Frontend → Vercel

1. Import project at [vercel.com](https://vercel.com)
2. Set **Root Directory**: `frontend`
3. Set **Build Command**: `npm run build`
4. Add environment variables:
   - `VITE_API_URL` = your Railway backend URL + `/api`
   - `VITE_SOCKET_URL` = your Railway backend URL

### Paystack Webhook

In your Paystack Dashboard → Settings → Webhooks:
- Add URL: `https://your-railway-url.railway.app/api/payments/webhook`
- Events: `charge.success`, `transfer.success`, `transfer.failed`

---

## 🎯 Key Platform Features

### For Task Requesters
- ✅ Post any type of task (pickup/delivery, on-location, purchase+ship, general)
- ✅ City/state-based tasker matching
- ✅ Bid review system — see ratings, price, and intro message
- ✅ Real-time chat with accepted tasker
- ✅ Custom payment window (equipment + shipment + workmanship)
- ✅ Photo evidence review before releasing equipment funds
- ✅ 6-digit completion code system for workmanship payment release
- ✅ Direct hire a tasker from the tasker directory
- ✅ Instant refund request system

### For Taskers
- ✅ 3-step signup: basic info → profile photo → full KYC documents
- ✅ Admin approval before going live
- ✅ City-based task notifications (email + in-app)
- ✅ Updateable task city without re-uploading documents
- ✅ Real-time chat with requesters
- ✅ Bank account details for instant payment disbursements
- ✅ Task completion code entry for payment release
- ✅ Refund request handling
- ✅ Availability toggle

### For Admins
- ✅ Full KYC review panel (approve / reject / ignore with reasons)
- ✅ User management (activate/deactivate)
- ✅ Task oversight and force-cancel
- ✅ Payment volume dashboard
- ✅ Refund dispute management
- ✅ Full audit log of all admin actions
- ✅ Email notifications sent on approval/rejection

### Security & Trust
- ✅ Bcrypt password hashing (cost factor 12)
- ✅ JWT authentication with 7-day expiry
- ✅ Rate limiting on all routes (30 req/15min on auth)
- ✅ Helmet.js security headers
- ✅ Paystack webhook signature verification
- ✅ Role-based access control on every endpoint
- ✅ Escrow payment system (funds held until conditions met)

---

## 💳 Payment Flow

```
Requester pays Paystack
       ↓
Taskeeu escrow (Paystack balance)
       ↓ (split)
Equipment funds ──► Released after requester reviews photo evidence + clicks OK
Workmanship    ──► Released after tasker enters 6-digit completion code
```

**Platform fee**: 10% deducted from workmanship payment before tasker payout.

---

## 🔌 Real-Time Features (Socket.io)

| Event | Description |
|---|---|
| `join_room` | Join a chat room |
| `new_message` | Receive new chat message |
| `user_typing` | Typing indicator |
| `user_online/offline` | Online presence |
| `reaction_update` | Emoji reactions on messages |
| `message_deleted` | Message deletion sync |
| `message_seen` | Read receipts |
| `partner_status` | Is the other person in this room? |

---

## 📧 Email Notifications (Resend)

Triggered emails include:
- Welcome email (requester + tasker signup)
- Tasker application received
- Tasker approved / rejected by admin
- New bid received (requester)
- Bid accepted / rejected (tasker)
- New chat message (when recipient is offline >3 mins)
- Equipment proof uploaded (requester)
- Payment sent / refund processed
- Task completion code (requester)
- Refund request received (tasker)
- Direct task application (tasker)

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Tailwind CSS 3 |
| Backend | Node.js 18+, Express 4 |
| Database | PostgreSQL via Supabase |
| Real-time | Socket.io 4 |
| Payments | Paystack (Nigerian market) |
| File Storage | Cloudinary |
| Email | Resend |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Hosting | Vercel (frontend) + Railway (backend) |

---

## 🇳🇬 Nigerian Market Specifics

- All prices in ₦ (Nigerian Naira)
- Nigerian state/city database pre-loaded (37 states, major cities)
- Paystack payment gateway (most trusted in Nigeria)
- Bank transfer disbursements via Paystack Transfer API
- KYC built around Nigerian ID documents (NIN, Driver's License, Passport)
- Content and copy tailored for Nigerian users

---

## 📞 Support

- Email: support@taskeeu.com
- Admin: admin@taskeeu.com
- Security: safety@taskeeu.com

---

*Built with ❤️ for Nigeria 🇳🇬*
