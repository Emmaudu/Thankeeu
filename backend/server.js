require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { sanitizeBody, sanitizeQuery, removeSensitiveFields, checkPasswordLength } = require('./middleware/sanitize');

const app = express();
// Trust the first proxy hop (Railway, Vercel, etc.)
// This makes req.ip reflect the real client IP from X-Forwarded-For
app.set('trust proxy', 1);
app.disable('x-powered-by'); // don't advertise Express version
const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(u => u.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
  pingTimeout: 60000,
});

app.set('io', io);
require('./socket/chatSocket')(io);

// ─── Middleware ───────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.flutterwave.com", "https://api.flutterwave.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.flutterwave.com", "https://checkout.flutterwave.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(morgan('dev'));
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = (process.env.FRONTEND_URL || 'http://localhost:5173')
        .split(',').map(u => u.trim()).filter(Boolean);
      // Allow same-origin requests (no origin header) and explicitly listed origins
      if (!origin || allowed.some(a => origin === a || origin.startsWith(a))) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

// Raw body for Flutterwave webhook BEFORE json middleware
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use('/api/payments/rapyd-webhook', express.raw({ type: '*/*' }));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ─── Input Sanitization ───────────────────────────────────────────
app.use(sanitizeBody);
app.use(sanitizeQuery);
app.use(removeSensitiveFields); // never leak password_hash in any response

// ─── Rate Limiters ───────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  skip: (req) => req.path === '/health', // never limit health check
});

// Auth limiter for LOGIN — keyed by email+IP so one user can't block others
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toLowerCase().trim();
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    return email ? `${email}::${ip}` : ip;
  },
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes before trying again.' },
});

// Register limiter — much more lenient (signup is multi-step)
// Keyed by IP only since we don't have email at all steps (e.g. photo upload)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 50, // 50 signup attempts per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many registration attempts. Please try again later.' },
});

// Upload limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many uploads. Try again later.' },
});

// Support ticket limiter
const supportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many support tickets. Try again later.' },
});

app.use('/api', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/register/tasker/step2', uploadLimiter);
app.use('/api/auth/register/tasker/step3', uploadLimiter);
// Apply support ticket creation rate limit only to POST /api/support/tickets
app.post('/api/support/tickets', supportLimiter);

// ─── Routes ───────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/taskers', require('./routes/taskers'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/enterprise-tasks', require('./routes/enterprise-tasks'));
app.use('/api/certifications', require('./routes/certifications'));
app.use('/api/demo', require('./routes/demo'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/support', require('./routes/support'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/push', require('./routes/push'));
app.use('/api/track', require('./routes/track'));
app.use('/api/vooom', require('./routes/vooom'));

// ── Expiry cron — every 30 minutes ──────────────────────────────────────────
const tasksRouter = require('./routes/tasks');
if (tasksRouter.runExpiryCron) {
  tasksRouter.runExpiryCron(); // run once on boot
  setInterval(tasksRouter.runExpiryCron, 30 * 60 * 1000);
}

// ─── Health check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Taskeeu API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ─── Admin Seed ───────────────────────────────────────────────────
// POST /api/seed-admin — force-create or fix admin account
// In production: requires header x-seed-secret matching SEED_SECRET env var
app.post('/api/seed-admin', async (req, res) => {
  const seedSecret = req.headers['x-seed-secret'] || req.body?.seed_secret;
  const isAllowed = process.env.NODE_ENV !== 'production'
    || (process.env.SEED_SECRET && seedSecret === process.env.SEED_SECRET);

  if (!isAllowed) {
    return res.status(403).json({
      success: false,
      message: 'In production, set SEED_SECRET env var and pass it as x-seed-secret header.',
    });
  }

  const supabaseClient = require('./utils/supabase');
  const email = 'admin@taskeeu.com';
  const password = 'Admin@Taskeeu2025!';

  try {
    const password_hash = await bcrypt.hash(password, 12);

    // Check if admin already exists
    const { data: existing } = await supabaseClient
      .from('users').select('id').eq('email', email).eq('role', 'admin').maybeSingle();

    if (existing) {
      // Update existing admin — correct password, ensure active
      await supabaseClient.from('users').update({
        password_hash,
        email_verified: true,
        is_active: true,
      }).eq('id', existing.id);
      return res.json({ success: true, message: `Admin updated! Login: ${email} / ${password}` });
    }

    // Also check if email exists with a different role
    const { data: otherRole } = await supabaseClient
      .from('users').select('id, role').eq('email', email).maybeSingle();

    if (otherRole) {
      // Promote to admin
      await supabaseClient.from('users').update({
        role: 'admin', password_hash, email_verified: true, is_active: true,
      }).eq('id', otherRole.id);
      return res.json({ success: true, message: `Existing user promoted to admin! Login: ${email} / ${password}` });
    }

    // Fresh insert — no conflict possible since we checked above
    const { error } = await supabaseClient.from('users').insert({
      email,
      full_name: 'Taskeeu Admin',
      phone: '08012345678',
      password_hash,
      role: 'admin',
      email_verified: true,
      is_active: true,
    });
    if (error) throw error;

    res.json({ success: true, message: `Admin created! Login: ${email} / ${password}` });
  } catch (err) {
    console.error('[seed-admin]', err.message);
    res.status(500).json({ success: false, message: `Failed: ${err.message}` });
  }
});

// ─── Nigerian States & Cities (static helper) ────────────────────
app.get('/api/locations/states', (req, res) => {
  res.json({ success: true, states: NIGERIAN_STATES });
});

app.get('/api/locations/cities/:state', (req, res) => {
  const cities = NIGERIAN_CITIES[req.params.state] || [];
  res.json({ success: true, cities });
});

// ─── 404 handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// ─── Global error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  // Log full error internally only
  const errId = Date.now().toString(36);
  console.error(`[ERR ${errId}]`, err?.message, err?.stack ? '\n' + err.stack.split('\n').slice(0,3).join('\n') : '');

  // Multer file size errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body too large.' });
  }

  // JWT errors that bubble up
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }

  // Supabase/DB duplicate key
  if (err?.code === '23505') {
    return res.status(409).json({ success: false, message: 'This record already exists.' });
  }

  // Never expose stack traces or DB errors to client
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : (err.message || 'Internal server error'),
  });
});

// ─── Start server ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\nTaskeeu Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`WebSocket ready`);
  console.log(`API: http://localhost:${PORT}/api/health`);
  console.log(`\nTo seed admin: POST http://localhost:${PORT}/api/seed-admin`);
  console.log(`Default admin credentials set. Run /api/seed-admin to create.\n`);
});

// ─── Nigerian Location Data ───────────────────────────────────────
const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
];

const NIGERIAN_CITIES = {
  Lagos: ['Lagos Island','Lagos Mainland','Ikeja','Surulere','Lekki','Victoria Island',
    'Ajah','Ikorodu','Badagry','Epe','Mushin','Yaba','Gbagada','Magodo','Berger',
    'Ojodu','Agege','Alimosho','Oshodi','Apapa'],
  Abuja: ['Garki','Wuse','Maitama','Asokoro','Gwarinpa','Kubwa','Nyanya','Karu',
    'Lugbe','Gwagwalada','Dutse','Galadimawa','Utako','Jabi','Central Area'],
  Kano: ['Kano Municipal','Fagge','Dala','Gwale','Tarauni','Nassarawa','Ungogo'],
  Rivers: ['Port Harcourt','Obio/Akpor','Eleme','Oyigbo','Emohua'],
  Oyo: ['Ibadan North','Ibadan South','Egbeda','Lagelu','Akinyele','Ogbomoso'],
  Edo: ['Benin City','Oredo','Ikpoba-Okha','Egor'],
  Delta: ['Asaba','Warri','Ughelli','Sapele'],
  Anambra: ['Onitsha','Awka','Nnewi','Ekwulobia'],
  Enugu: ['Enugu','Nsukka','Agbani'],
  Kaduna: ['Kaduna','Kafanchan','Zaria'],
};
