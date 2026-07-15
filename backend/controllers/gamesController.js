const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const supabase = require('../utils/supabase');
const emailUtil = require('../utils/email');
const sendEmail = emailUtil.sendEmail || emailUtil;

const GAMES_URL = (process.env.GAMES_URL || 'https://games.thankeeu.com').replace(/\/$/, '');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const BLOCKED_DOMAINS = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com', 'aol.com', 'proton.me', 'protonmail.com']);

const DEFAULT_DEPARTMENTS = [
  ['accountant', 'Accountant', 'Finance', 'Ledger accuracy, controls, reconciliations and business finance decisions.'],
  ['network-engineer', 'Network Engineer', 'Engineering', 'Routing, switching, firewall, latency and incident response challenges.'],
  ['data-scientist', 'Data Scientist', 'Data', 'Statistics, modelling, experiments, feature quality and business interpretation.'],
  ['frontend-engineer', 'Frontend Engineer', 'Engineering', 'UI performance, accessibility, React patterns and customer-facing product thinking.'],
  ['backend-engineer', 'Backend Engineer', 'Engineering', 'APIs, databases, queues, reliability, security and scaling tradeoffs.'],
  ['cloud-engineer', 'Cloud Engineer', 'Engineering', 'Cloud architecture, cost, resilience, networking and deployment operations.'],
  ['product-manager', 'Product Manager', 'Product', 'Prioritisation, discovery, metrics, roadmaps and customer outcomes.'],
  ['product-designer', 'Product Designer', 'Design', 'UX strategy, interaction patterns, research and visual hierarchy.'],
  ['sales-executive', 'Sales Executive', 'Revenue', 'Pipeline, discovery, negotiation, objection handling and revenue quality.'],
  ['customer-success-manager', 'Customer Success Manager', 'Customer', 'Adoption, churn prevention, onboarding and account health.'],
  ['human-resources', 'Human Resources', 'People', 'Policy, employee relations, culture, compliance and workforce planning.'],
  ['legal-counsel', 'Legal Counsel', 'Legal', 'Contracts, risk, data privacy, employment law and governance.'],
  ['compliance-officer', 'Compliance Officer', 'Risk', 'Controls, audits, regulatory obligations and evidence quality.'],
  ['cybersecurity-analyst', 'Cybersecurity Analyst', 'Security', 'Threat detection, response, access control and security culture.'],
  ['devops-engineer', 'DevOps Engineer', 'Engineering', 'CI/CD, observability, automation, release safety and incident recovery.'],
  ['qa-engineer', 'QA Engineer', 'Engineering', 'Test strategy, automation, edge cases and release confidence.'],
  ['data-engineer', 'Data Engineer', 'Data', 'Pipelines, warehouses, data contracts, freshness and reliability.'],
  ['business-analyst', 'Business Analyst', 'Operations', 'Requirements, process mapping, stakeholder alignment and reporting.'],
  ['project-manager', 'Project Manager', 'Operations', 'Delivery planning, risk tracking, dependencies and team coordination.'],
  ['operations-manager', 'Operations Manager', 'Operations', 'Process excellence, capacity, quality and operational rhythm.'],
  ['marketing-manager', 'Marketing Manager', 'Marketing', 'Positioning, channels, campaigns, attribution and brand growth.'],
  ['growth-marketer', 'Growth Marketer', 'Marketing', 'Funnels, experiments, activation, retention and measurement.'],
  ['content-strategist', 'Content Strategist', 'Marketing', 'Editorial planning, SEO, narratives and audience trust.'],
  ['social-media-manager', 'Social Media Manager', 'Marketing', 'Community, creative formats, publishing cadence and analytics.'],
  ['brand-manager', 'Brand Manager', 'Marketing', 'Brand consistency, campaigns, voice, positioning and market perception.'],
  ['finance-manager', 'Finance Manager', 'Finance', 'Forecasting, budgets, controls, cashflow and strategic reporting.'],
  ['internal-auditor', 'Internal Auditor', 'Risk', 'Audit planning, evidence, controls testing and remediation tracking.'],
  ['procurement-specialist', 'Procurement Specialist', 'Operations', 'Vendor selection, negotiation, purchase controls and value management.'],
  ['supply-chain-manager', 'Supply Chain Manager', 'Operations', 'Demand planning, logistics, inventory and supplier resilience.'],
  ['logistics-coordinator', 'Logistics Coordinator', 'Operations', 'Dispatch, tracking, exceptions, cost and delivery experience.'],
  ['warehouse-manager', 'Warehouse Manager', 'Operations', 'Inventory accuracy, safety, picking, storage and throughput.'],
  ['business-development', 'Business Development', 'Revenue', 'Partnerships, market entry, pipeline creation and strategic deals.'],
  ['account-manager', 'Account Manager', 'Revenue', 'Relationship depth, renewals, expansion and customer value.'],
  ['support-specialist', 'Support Specialist', 'Customer', 'Troubleshooting, empathy, escalation and knowledge quality.'],
  ['technical-support-engineer', 'Technical Support Engineer', 'Customer', 'Debugging, logs, APIs, customer communication and resolution.'],
  ['solutions-architect', 'Solutions Architect', 'Engineering', 'Customer architecture, integrations, feasibility and technical trust.'],
  ['machine-learning-engineer', 'Machine Learning Engineer', 'Data', 'Model serving, evaluation, features, drift and production ML.'],
  ['database-administrator', 'Database Administrator', 'Engineering', 'Indexes, backups, replication, query tuning and access control.'],
  ['mobile-engineer', 'Mobile Engineer', 'Engineering', 'Native performance, app lifecycle, offline states and release quality.'],
  ['ui-ux-researcher', 'UX Researcher', 'Design', 'Research plans, interviews, synthesis, usability and insight quality.'],
  ['scrum-master', 'Scrum Master', 'Operations', 'Agile ceremonies, blockers, flow metrics and team health.'],
  ['office-administrator', 'Office Administrator', 'Operations', 'Facilities, coordination, records, vendors and employee support.'],
  ['executive-assistant', 'Executive Assistant', 'Operations', 'Scheduling, prioritisation, discretion and executive leverage.'],
  ['talent-acquisition', 'Talent Acquisition', 'People', 'Sourcing, interviewing, candidate experience and hiring quality.'],
  ['learning-development', 'Learning and Development', 'People', 'Training needs, learning design, adoption and capability growth.'],
  ['employee-engagement', 'Employee Engagement', 'People', 'Culture, recognition, listening, morale and workplace rituals.'],
  ['public-relations', 'Public Relations', 'Marketing', 'Media relations, crisis response, messaging and reputation.'],
  ['community-manager', 'Community Manager', 'Marketing', 'Community health, engagement loops, moderation and advocacy.'],
  ['risk-manager', 'Risk Manager', 'Risk', 'Risk registers, mitigation, incident learning and board reporting.'],
  ['treasury-analyst', 'Treasury Analyst', 'Finance', 'Liquidity, FX, cash forecasting and banking operations.'],
  ['payroll-specialist', 'Payroll Specialist', 'Finance', 'Payroll accuracy, statutory deductions, confidentiality and deadlines.'],
  ['tax-specialist', 'Tax Specialist', 'Finance', 'Tax compliance, filings, planning and documentation.'],
  ['health-safety-officer', 'Health and Safety Officer', 'Operations', 'Safety controls, incidents, training and workplace risk.'],
  ['facilities-manager', 'Facilities Manager', 'Operations', 'Workspace reliability, vendors, maintenance and cost control.'],
  ['medical-officer', 'Medical Officer', 'Healthcare', 'Clinical judgement, patient safety, triage and documentation.'],
  ['nurse', 'Nurse', 'Healthcare', 'Care coordination, patient monitoring, safety and communication.']
];

const slugify = (value) => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const companyNameFromDomain = (domain) => domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const weekKeyFromDate = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};
const fridayAtTwo = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (5 - day + 7) % 7;
  d.setDate(d.getDate() + diff);
  d.setHours(14, 0, 0, 0);
  return d;
};
const signPlayer = (player) => jwt.sign({ type: 'game_player', playerId: player.id }, JWT_SECRET, { expiresIn: '30d' });

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const emailDomain = (email) => normalizeEmail(email).split('@')[1] || '';
const validateCompanyEmail = (email) => {
  const clean = normalizeEmail(email);
  const domain = emailDomain(clean);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return 'Enter a valid company email address';
  if (BLOCKED_DOMAINS.has(domain)) return 'Use your company email. Personal email providers like gmail.com are not allowed.';
  return null;
};

const gameAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No games token provided' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'game_player') return res.status(401).json({ error: 'Invalid games token' });
    const { data: player, error } = await supabase.from('games_players').select('*').eq('id', decoded.playerId).maybeSingle();
    if (error || !player) return res.status(401).json({ error: 'Invalid games token' });
    req.gamePlayer = player;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired games token' });
  }
};

async function seedDepartments() {
  const { count } = await supabase.from('games_departments').select('id', { count: 'exact', head: true });
  if (count && count >= 50) return;
  const rows = DEFAULT_DEPARTMENTS.map(([slug, name, category, description], index) => ({
    slug, name, category, description,
    image_theme: ['indigo', 'emerald', 'amber', 'rose', 'cyan'][index % 5],
    is_active: true
  }));
  await supabase.from('games_departments').upsert(rows, { onConflict: 'slug' });
}

async function ensureWeek(date = new Date()) {
  const playAt = fridayAtTwo(date);
  const week_key = weekKeyFromDate(playAt);
  const startsOn = new Date(playAt);
  startsOn.setDate(playAt.getDate() - ((playAt.getDay() + 6) % 7));
  startsOn.setHours(0, 0, 0, 0);
  const row = {
    week_key,
    starts_on: startsOn.toISOString().slice(0, 10),
    play_at: playAt.toISOString(),
    registration_closes_at: new Date(playAt.getTime() - 60 * 60 * 1000).toISOString(),
    status: new Date() > playAt ? 'played' : 'open'
  };
  const { data, error } = await supabase.from('games_weeks').upsert(row, { onConflict: 'week_key' }).select().maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

function makeQuestion(dept, weekKey, n) {
  const focus = ['risk', 'speed', 'quality', 'customer impact', 'compliance', 'cost', 'team communication', 'automation', 'measurement', 'incident response'][n - 1];
  const correct = (weekKey.length + dept.slug.length + n) % 4;
  const options = [
    `Escalate with context, evidence and a recommended next step`,
    `Wait until Friday and see whether the issue resolves itself`,
    `Optimise only for speed even if quality drops`,
    `Ignore the data and rely only on instinct`
  ];
  const rotated = [...options.slice(correct), ...options.slice(0, correct)];
  return {
    department_id: dept.id,
    week_key: weekKey,
    question_no: n,
    prompt: `${dept.name} challenge ${n}: which response best protects ${focus} while keeping the business outcome clear?`,
    options: rotated,
    correct_option: 0,
    explanation: `Strong ${dept.name} work balances ${focus}, evidence, communication and action.`
  };
}

async function ensureQuestions(department, weekKey) {
  const { count } = await supabase
    .from('games_questions')
    .select('id', { count: 'exact', head: true })
    .eq('department_id', department.id)
    .eq('week_key', weekKey);
  if (count === 10) return;
  const rows = Array.from({ length: 10 }, (_, i) => makeQuestion(department, weekKey, i + 1));
  await supabase.from('games_questions').upsert(rows, { onConflict: 'department_id,week_key,question_no' });
}

async function sendGameMail(to, subject, html) {
  try {
    await sendEmail({ to, subject, html, text: html.replace(/<[^>]+>/g, ' ') });
  } catch (err) {
    console.warn('[games email]', err.message);
  }
}

const getSignatureMedia = (body = {}) => ({
  gif_url: String(body.gif_url || '').trim() || null,
  photo_url: String(body.photo_url || '').trim() || null,
  video_url: String(body.video_url || '').trim() || null,
  voice_note_url: String(body.voice_note_url || '').trim() || null,
});

const mediaHtml = (sig) => {
  const items = [
    sig.gif_url ? `<p><a href="${sig.gif_url}">View GIF</a></p>` : '',
    sig.photo_url ? `<p><a href="${sig.photo_url}">View photo</a></p>` : '',
    sig.video_url ? `<p><a href="${sig.video_url}">Watch video</a></p>` : '',
    sig.voice_note_url ? `<p><a href="${sig.voice_note_url}">Listen to voice note</a></p>` : '',
  ].filter(Boolean).join('');
  return items ? `<div style="margin-top:8px">${items}</div>` : '';
};

const nextWeekdayAtTen = (fromDate, targetDay) => {
  const d = new Date(fromDate);
  const diff = (targetDay - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(10, 0, 0, 0);
  return d;
};

const congratulationsCardUrl = (cardId) => `${GAMES_URL}/dashboard?tab=pending-to-sign&card=${cardId}`;

async function createOrUpdateCongratulationCard(department, week) {
  const { data: topAttempt } = await supabase
    .from('games_attempts')
    .select('*')
    .eq('department_id', department.id)
    .eq('week_key', week.week_key)
    .order('score', { ascending: false })
    .order('duration_seconds', { ascending: true })
    .order('completed_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!topAttempt) return null;

  const { data: winner } = await supabase
    .from('games_players')
    .select('*')
    .eq('id', topAttempt.player_id)
    .maybeSingle();
  if (!winner) return null;

  const sendAt = nextWeekdayAtTen(week.play_at, 2);
  const cardPayload = {
    week_key: week.week_key,
    department_id: department.id,
    winner_player_id: winner.id,
    winner_registration_id: topAttempt.registration_id,
    winner_attempt_id: topAttempt.id,
    title: `Congratulations ${winner.full_name}, ${department.name} champion`,
    message: `${winner.full_name} won the ${department.name} inter-company league for ${week.week_key} with ${topAttempt.score}/${topAttempt.total}.`,
    status: 'active',
    send_at: sendAt.toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: card, error } = await supabase
    .from('games_congrats_cards')
    .upsert(cardPayload, { onConflict: 'week_key,department_id' })
    .select()
    .maybeSingle();
  if (error || !card) return null;
  await supabase
    .from('games_congrats_signatures')
    .delete()
    .eq('card_id', card.id)
    .eq('signer_email', winner.email);

  const { data: registrations } = await supabase
    .from('games_registrations')
    .select('player_id')
    .eq('department_id', department.id)
    .eq('week_key', week.week_key);
  const signerIds = [...new Set((registrations || []).map(r => r.player_id).filter(id => id && id !== winner.id))];
  if (!signerIds.length) return card;

  const { data: players } = await supabase
    .from('games_players')
    .select('id, email, full_name, company_name')
    .in('id', signerIds);

  const signatureRows = (players || []).map(player => ({
    card_id: card.id,
    signer_player_id: player.id,
    signer_email: player.email,
    signer_name: player.full_name,
    signer_company: player.company_name,
    signer_type: 'player',
    status: 'pending',
    updated_at: new Date().toISOString()
  }));
  await supabase.from('games_congrats_signatures').upsert(signatureRows, { onConflict: 'card_id,signer_email' });

  const url = congratulationsCardUrl(card.id);
  await Promise.all((players || []).map(player => sendGameMail(
    player.email,
    `Sign ${winner.full_name}'s ${department.name} congratulations card`,
    `<p>Hi ${player.full_name},</p><p>${winner.full_name} from ${winner.company_name} won this week's ${department.name} Games.</p><p>Please sign the congratulations card now. It will be sent to ${winner.full_name} on Tuesday at 10:00 AM.</p><p><a href="${url}">Sign the congratulations card</a></p>`
  )));
  await supabase
    .from('games_congrats_signatures')
    .update({ first_reminder_sent_at: new Date().toISOString() })
    .eq('card_id', card.id)
    .in('signer_email', (players || []).map(p => p.email));

  return card;
}

async function sendDueCongratulationWork() {
  const nowIso = new Date().toISOString();
  const { data: mondayCards } = await supabase
    .from('games_congrats_cards')
    .select('*, games_departments(name)')
    .eq('status', 'active');
  let mondayReminders = 0;
  let deliveredCards = 0;

  for (const card of mondayCards || []) {
    const mondayAt = nextWeekdayAtTen(new Date(card.send_at).getTime() - 4 * 86400000, 1);
    if (new Date() >= mondayAt) {
      const { data: pending } = await supabase
        .from('games_congrats_signatures')
        .select('*')
        .eq('card_id', card.id)
        .eq('status', 'pending')
        .is('monday_reminder_sent_at', null);
      await Promise.all((pending || []).map(sig => sendGameMail(
        sig.signer_email,
        `Reminder: sign ${card.title}`,
        `<p>Hi ${sig.signer_name || 'there'},</p><p>This is your Monday 10:00 AM reminder to sign the congratulations card.</p><p><a href="${congratulationsCardUrl(card.id)}">Sign now</a></p>`
      )));
      if (pending?.length) {
        await supabase
          .from('games_congrats_signatures')
          .update({ monday_reminder_sent_at: nowIso })
          .eq('card_id', card.id)
          .is('monday_reminder_sent_at', null);
        mondayReminders += pending.length;
      }
    }

    if (new Date() >= new Date(card.send_at) && card.status === 'active') {
      const [{ data: winner }, { data: signatures }] = await Promise.all([
        supabase.from('games_players').select('*').eq('id', card.winner_player_id).maybeSingle(),
        supabase.from('games_congrats_signatures').select('*').eq('card_id', card.id).eq('status', 'signed').order('signed_at')
      ]);
      if (winner) {
        const notes = (signatures || []).map(sig => `<li><strong>${sig.signer_name || sig.signer_email}</strong>: ${sig.message || 'Congratulations!'}${mediaHtml(sig)}</li>`).join('');
        await sendGameMail(
          winner.email,
          card.title,
          `<h2>${card.title}</h2><p>${card.message || ''}</p><p>Your colleagues and competitors signed this card for you:</p><ul>${notes || '<li>Congratulations from the Thankeeu Games community.</li>'}</ul><p>This card is active in your Thankeeu Games dashboard.</p>`
        );
        await supabase.from('games_congrats_cards').update({ status: 'sent', delivered_at: nowIso, updated_at: nowIso }).eq('id', card.id);
        deliveredCards += 1;
      }
    }
  }

  return { mondayReminders, deliveredCards };
}

const listDepartments = async (req, res) => {
  await seedDepartments();
  const week = await ensureWeek();
  const q = String(req.query.q || '')
    .trim()
    .slice(0, 80)
    .replace(/[,%]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  let query = supabase.from('games_departments').select('*').eq('is_active', true).order('name');
  if (q) {
    const pattern = `%${q}%`;
    query = query.or(`name.ilike.${pattern},category.ilike.${pattern},description.ilike.${pattern},slug.ilike.${pattern}`);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ departments: data || [], week });
};

const getDepartmentGame = async (req, res) => {
  await seedDepartments();
  const week = await ensureWeek();
  const { data: department, error } = await supabase.from('games_departments').select('*').eq('slug', req.params.slug).eq('is_active', true).maybeSingle();
  if (error || !department) return res.status(404).json({ error: 'Game not found' });
  await ensureQuestions(department, week.week_key);
  const { data: registrations } = await supabase
    .from('games_registrations')
    .select('id, registered_at, company_domain, games_players(full_name, company_name, avatar_url)')
    .eq('department_id', department.id)
    .eq('week_key', week.week_key);
  res.json({ department, week, registrations: registrations || [] });
};

const signup = async (req, res) => {
  const { email, password, full_name, job_title, avatar_url } = req.body;
  const cleanEmail = normalizeEmail(email);
  const validation = validateCompanyEmail(cleanEmail);
  if (validation) return res.status(400).json({ error: validation });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (!full_name?.trim()) return res.status(400).json({ error: 'Full name is required' });
  if (!avatar_url?.trim()) return res.status(400).json({ error: 'Profile photo is required for leaderboard and result posters' });
  const domain = emailDomain(cleanEmail);
  const password_hash = await argon2.hash(password);
  const payload = {
    email: cleanEmail,
    password_hash,
    full_name: full_name.trim(),
    job_title: job_title || null,
    avatar_url: avatar_url.trim(),
    company_domain: domain,
    company_name: companyNameFromDomain(domain),
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from('games_players').insert(payload).select().maybeSingle();
  if (error) return res.status(error.code === '23505' ? 409 : 500).json({ error: error.code === '23505' ? 'A games account already exists for this email' : error.message });
  res.status(201).json({ token: signPlayer(data), player: data });
};

const login = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { data: player } = await supabase.from('games_players').select('*').eq('email', email).maybeSingle();
  if (!player || !(await argon2.verify(player.password_hash, req.body.password || ''))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ token: signPlayer(player), player });
};

const me = async (req, res) => {
  const { password_hash, ...safe } = req.gamePlayer;
  res.json(safe);
};

const updateProfile = async (req, res) => {
  const updates = {};
  ['full_name', 'job_title', 'avatar_url'].forEach(k => {
    if (req.body[k] !== undefined) updates[k] = String(req.body[k] || '').trim();
  });
  if (updates.avatar_url === '') return res.status(400).json({ error: 'Profile photo is required' });
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabase.from('games_players').update(updates).eq('id', req.gamePlayer.id).select().maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const registerForGame = async (req, res) => {
  const week = await ensureWeek();
  const { data: department } = await supabase.from('games_departments').select('*').eq('slug', req.params.slug).eq('is_active', true).maybeSingle();
  if (!department) return res.status(404).json({ error: 'Game not found' });
  await ensureQuestions(department, week.week_key);
  const { count } = await supabase
    .from('games_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('department_id', department.id)
    .eq('week_key', week.week_key)
    .eq('company_domain', req.gamePlayer.company_domain);
  if (count >= 2) return res.status(409).json({ error: 'Only 2 players per company can join this department game each week' });
  const row = {
    week_key: week.week_key,
    department_id: department.id,
    player_id: req.gamePlayer.id,
    company_domain: req.gamePlayer.company_domain
  };
  const { data, error } = await supabase.from('games_registrations').insert(row).select().maybeSingle();
  if (error) return res.status(error.code === '23505' ? 409 : 500).json({ error: error.code === '23505' ? 'You already registered for this game this week' : error.message });
  await sendGameMail(req.gamePlayer.email, `You are registered for ${department.name} Games`, `<p>Hi ${req.gamePlayer.full_name},</p><p>You are registered for the ${department.name} inter-company league on Friday at 2:00 PM.</p><p>Open your dashboard: <a href="${GAMES_URL}/dashboard">${GAMES_URL}/dashboard</a></p>`);
  res.status(201).json({ registration: data, week });
};

const dashboard = async (req, res) => {
  const week = await ensureWeek();
  const { data: registrations } = await supabase
    .from('games_registrations')
    .select('*, games_departments(*), games_attempts(*)')
    .eq('player_id', req.gamePlayer.id)
    .order('registered_at', { ascending: false });
  const { data: competitors } = await supabase
    .from('games_registrations')
    .select('week_key, company_domain, games_departments(name, slug), games_players(full_name, company_name, avatar_url)')
    .eq('week_key', week.week_key);
  res.json({ player: req.gamePlayer, registrations: registrations || [], competitors: competitors || [], week });
};

const playGame = async (req, res) => {
  const week = await ensureWeek();
  const { data: department } = await supabase.from('games_departments').select('*').eq('slug', req.params.slug).maybeSingle();
  if (!department) return res.status(404).json({ error: 'Game not found' });
  const { data: registration } = await supabase
    .from('games_registrations')
    .select('*')
    .eq('player_id', req.gamePlayer.id)
    .eq('week_key', week.week_key)
    .eq('department_id', department.id)
    .maybeSingle();
  if (!registration) return res.status(404).json({ error: 'Register for this game before playing' });
  const { data: questions } = await supabase
    .from('games_questions')
    .select('id, question_no, prompt, options')
    .eq('department_id', registration.department_id)
    .eq('week_key', week.week_key)
    .order('question_no');
  res.json({ registration, week, questions: questions || [], timer_seconds: 600 });
};

const submitGame = async (req, res) => {
  const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
  const duration_seconds = Math.max(0, Math.min(3600, Number(req.body.duration_seconds || 0)));
  const week = await ensureWeek();
  const { data: department } = await supabase.from('games_departments').select('*').eq('slug', req.params.slug).maybeSingle();
  if (!department) return res.status(404).json({ error: 'Game not found' });
  const { data: registration } = await supabase
    .from('games_registrations')
    .select('*')
    .eq('player_id', req.gamePlayer.id)
    .eq('department_id', department.id)
    .eq('week_key', week.week_key)
    .maybeSingle();
  if (!registration) return res.status(404).json({ error: 'Register for this game before submitting' });
  const { data: questions } = await supabase
    .from('games_questions')
    .select('id, question_no, correct_option')
    .eq('department_id', department.id)
    .eq('week_key', week.week_key);
  const byNo = new Map((questions || []).map(q => [q.question_no, q]));
  let score = 0;
  for (const answer of answers) {
    const q = byNo.get(Number(answer.question_no));
    if (q && Number(answer.option) === q.correct_option) score++;
  }
  const attemptRow = {
    registration_id: registration.id,
    player_id: req.gamePlayer.id,
    department_id: department.id,
    week_key: week.week_key,
    answers,
    score,
    total: 10,
    duration_seconds
  };
  const { data, error } = await supabase.from('games_attempts').insert(attemptRow).select().maybeSingle();
  if (error) return res.status(error.code === '23505' ? 409 : 500).json({ error: error.code === '23505' ? 'You already submitted this game' : error.message });
  const congratulationsCard = await createOrUpdateCongratulationCard(department, week);
  await sendGameMail(req.gamePlayer.email, `Your ${department.name} Games result poster`, `<div style="font-family:Arial;padding:24px;border-radius:18px;background:#160b2f;color:white"><h1>${department.name} League Result</h1><p>${req.gamePlayer.full_name} - ${req.gamePlayer.company_name}</p><p style="font-size:42px;font-weight:bold">${score}/10</p><p>Share your score from ${GAMES_URL}/dashboard</p></div>`);
  res.json({ attempt: data, congratulations_card: congratulationsCard, poster: { title: `${department.name} League Result`, score, total: 10, player: req.gamePlayer.full_name, company: req.gamePlayer.company_name } });
};

const myCongratulationCards = async (req, res) => {
  const { data, error } = await supabase
    .from('games_congrats_cards')
    .select('*, games_departments(name, slug), games_congrats_signatures(*)')
    .eq('winner_player_id', req.gamePlayer.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ cards: data || [] });
};

const pendingCongratulationCards = async (req, res) => {
  const { data, error } = await supabase
    .from('games_congrats_signatures')
    .select('*, games_congrats_cards(*, games_departments(name, slug))')
    .eq('signer_email', req.gamePlayer.email)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ signatures: data || [] });
};

const signCongratulationCard = async (req, res) => {
  const message = String(req.body.message || '').trim();
  if (!message) return res.status(400).json({ error: 'Add a congratulations message before signing' });
  const media = getSignatureMedia(req.body);
  const { data, error } = await supabase
    .from('games_congrats_signatures')
    .update({
      status: 'signed',
      message,
      ...media,
      signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', req.params.signatureId)
    .eq('signer_email', req.gamePlayer.email)
    .select()
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Pending card not found' });
  res.json({ signature: data });
};

const visitorSignCongratulationCard = async (req, res) => {
  const cardId = req.params.cardId;
  const name = String(req.body.name || '').trim();
  const email = normalizeEmail(req.body.email || '');
  const company = String(req.body.company || '').trim();
  const message = String(req.body.message || '').trim();
  const media = getSignatureMedia(req.body);
  if (!name) return res.status(400).json({ error: 'Your name is required' });
  if (!message) return res.status(400).json({ error: 'Add a congratulations message before signing' });
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email or leave it blank' });

  const { data: card } = await supabase
    .from('games_congrats_cards')
    .select('id, status, title')
    .eq('id', cardId)
    .in('status', ['active', 'sent'])
    .maybeSingle();
  if (!card) return res.status(404).json({ error: 'Congratulations card not found' });

  const row = {
    card_id: cardId,
    signer_player_id: null,
    signer_email: email || null,
    signer_name: name,
    signer_company: company || 'Games visitor',
    signer_type: 'visitor',
    status: 'signed',
    message,
    ...media,
    signed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  let data;
  let error;
  if (email) {
    const { data: existing } = await supabase
      .from('games_congrats_signatures')
      .select('id')
      .eq('card_id', cardId)
      .eq('signer_email', email)
      .maybeSingle();
    if (existing) {
      ({ data, error } = await supabase
        .from('games_congrats_signatures')
        .update({
          signer_name: name,
          signer_company: company || 'Games visitor',
          status: 'signed',
          message,
          ...media,
          signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .maybeSingle());
    } else {
      ({ data, error } = await supabase.from('games_congrats_signatures').insert(row).select().maybeSingle());
    }
  } else {
    ({ data, error } = await supabase.from('games_congrats_signatures').insert(row).select().maybeSingle());
  }
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ signature: data, card: { id: card.id, title: card.title } });
};

const leaderboard = async (req, res) => {
  const week_key = req.query.week || weekKeyFromDate();
  let query = supabase.from('games_public_leaderboard').select('*').eq('week_key', week_key).order('score', { ascending: false }).order('duration_seconds', { ascending: true });
  if (req.query.department) query = query.eq('department_slug', req.query.department);
  const { data, error } = await query.limit(500);
  if (error) return res.status(500).json({ error: error.message });
  const rows = data || [];
  const departmentIds = [...new Set(rows.map(row => row.department_id).filter(Boolean))];
  let cardsByWinner = new Map();
  if (departmentIds.length) {
    const { data: cards } = await supabase
      .from('games_congrats_cards')
      .select('id, title, message, status, send_at, week_key, department_id, winner_player_id')
      .eq('week_key', week_key)
      .in('department_id', departmentIds)
      .in('status', ['active', 'sent']);
    cardsByWinner = new Map((cards || []).map(card => [`${card.department_id}:${card.winner_player_id}`, card]));
  }
  res.json({
    week_key,
    rows: rows.map(row => ({
      ...row,
      congratulations_card: cardsByWinner.get(`${row.department_id}:${row.player_id}`) || null
    }))
  });
};

const adminOverview = async (req, res) => {
  await seedDepartments();
  const week = await ensureWeek();
  const [{ data: departments }, { data: registrations }, { data: leaderboardRows }] = await Promise.all([
    supabase.from('games_departments').select('*').order('name'),
    supabase.from('games_registrations').select('*, games_departments(name, slug), games_players(full_name, email, company_name)').eq('week_key', week.week_key),
    supabase.from('games_public_leaderboard').select('*').eq('week_key', week.week_key).order('score', { ascending: false }).limit(100)
  ]);
  res.json({ week, departments: departments || [], registrations: registrations || [], leaderboard: leaderboardRows || [] });
};

const adminCreateDepartment = async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Department name is required' });
  const row = {
    name,
    slug: slugify(req.body.slug || name),
    category: req.body.category || 'Business',
    description: req.body.description || `${name} department championship.`,
    image_theme: req.body.image_theme || 'indigo',
    is_active: true
  };
  const { data, error } = await supabase.from('games_departments').insert(row).select().maybeSingle();
  if (error) return res.status(error.code === '23505' ? 409 : 500).json({ error: error.code === '23505' ? 'Department already exists' : error.message });
  res.status(201).json(data);
};

const adminDeleteDepartment = async (req, res) => {
  const { error } = await supabase.from('games_departments').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
};

const adminRegenerateWeek = async (req, res) => {
  await seedDepartments();
  const week = await ensureWeek();
  const { data: departments } = await supabase.from('games_departments').select('*').eq('is_active', true);
  await supabase.from('games_questions').delete().eq('week_key', week.week_key);
  for (const dept of departments || []) await ensureQuestions(dept, week.week_key);
  const { data: players } = await supabase.from('games_players').select('email, full_name').limit(1000);
  await Promise.all((players || []).map(player => sendGameMail(
    player.email,
    `New Thankeeu Games are open for ${week.week_key}`,
    `<p>Hi ${player.full_name},</p><p>This week's Thankeeu Games questions are ready. Pick your department game and get set for Friday at 2:00 PM.</p><p><a href="${GAMES_URL}">Browse this week's games</a></p>`
  )));
  res.json({ ok: true, week_key: week.week_key, departments: departments?.length || 0, notified_players: players?.length || 0 });
};

const adminSendReminders = async (req, res) => {
  const week = await ensureWeek();
  const { data: registrations, error } = await supabase
    .from('games_registrations')
    .select('week_key, games_departments(name, slug), games_players(email, full_name, company_name)')
    .eq('week_key', week.week_key);
  if (error) return res.status(500).json({ error: error.message });
  await Promise.all((registrations || []).map(row => sendGameMail(
    row.games_players?.email,
    `Reminder: ${row.games_departments?.name} Games play Friday at 2:00 PM`,
    `<p>Hi ${row.games_players?.full_name},</p><p>Your ${row.games_departments?.name} inter-company game starts Friday at 2:00 PM.</p><p>Company: ${row.games_players?.company_name}</p><p><a href="${GAMES_URL}/${row.games_departments?.slug}/play">Open game room</a></p>`
  )));
  res.json({ ok: true, week_key: week.week_key, reminders_sent: registrations?.length || 0 });
};

const adminProcessCongratulationCards = async (req, res) => {
  const result = await sendDueCongratulationWork();
  res.json({ ok: true, ...result });
};

module.exports = {
  gameAuth,
  listDepartments,
  getDepartmentGame,
  signup,
  login,
  me,
  updateProfile,
  registerForGame,
  dashboard,
  playGame,
  submitGame,
  leaderboard,
  adminOverview,
  adminCreateDepartment,
  adminDeleteDepartment,
  adminRegenerateWeek,
  adminSendReminders,
  adminProcessCongratulationCards,
  myCongratulationCards,
  pendingCongratulationCards,
  signCongratulationCard,
  visitorSignCongratulationCard
};
