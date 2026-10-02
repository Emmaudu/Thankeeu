const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../utils/supabase');
const { authenticate } = require('../middleware/auth');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
const FROM = `Taskeeu <${process.env.EMAIL_FROM || 'noreply@taskeeu.com'}>`;

// ── GET /certifications/modules ───────────────────────────────────
router.get('/modules', authenticate, async (req, res) => {
  try {
    const { data: modules, error } = await supabase
      .from('enterprise_cert_modules')
      .select('*')
      .eq('is_active', true)
      .order('module_number');
    if (error) throw error;

    // Get user's completions
    const { data: completions } = await supabase
      .from('tasker_module_completions')
      .select('module_id, completed_at, time_spent_seconds')
      .eq('tasker_id', req.user.id);

    const completedIds = new Set(completions?.map(c => c.module_id) || []);

    const enriched = modules.map(m => ({
      ...m,
      completed: completedIds.has(m.id),
      completed_at: completions?.find(c => c.module_id === m.id)?.completed_at || null,
    }));

    // Check certification
    const { data: cert } = await supabase
      .from('tasker_enterprise_certifications')
      .select('*')
      .eq('tasker_id', req.user.id)
      .maybeSingle();

    res.json({
      success: true,
      modules: enriched,
      total: modules.length,
      completed_count: completedIds.size,
      is_certified: !!cert,
      certification: cert || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load modules' });
  }
});

// ── POST /certifications/modules/:moduleId/complete ───────────────
// :moduleId may be a UUID OR a module_number (1-5). We resolve to UUID.
router.post('/modules/:moduleId/complete', authenticate, async (req, res) => {
  try {
    const { time_spent_seconds } = req.body;

    // Resolve module: if param looks like a small integer, look up by module_number
    let moduleId = req.params.moduleId;
    const isNumber = /^\d+$/.test(moduleId) && parseInt(moduleId) <= 100;
    if (isNumber) {
      const { data: mod, error: modErr } = await supabase
        .from('enterprise_cert_modules')
        .select('id')
        .eq('module_number', parseInt(moduleId))
        .maybeSingle();
      if (modErr || !mod) {
        return res.status(404).json({ success: false, message: `Module ${moduleId} not found. Ensure certification tables are seeded.` });
      }
      moduleId = mod.id;
    }

    // Upsert completion
    const { error } = await supabase
      .from('tasker_module_completions')
      .upsert({
        tasker_id: req.user.id,
        module_id: moduleId,
        completed_at: new Date().toISOString(),
        time_spent_seconds: time_spent_seconds || 0,
      }, { onConflict: 'tasker_id,module_id' });

    if (error) throw error;

    // Check if all modules done
    const { data: allModules, error: modulesErr } = await supabase
      .from('enterprise_cert_modules')
      .select('id')
      .eq('is_active', true);
    if (modulesErr) throw modulesErr;

    const { data: completions, error: completionsErr } = await supabase
      .from('tasker_module_completions')
      .select('module_id')
      .eq('tasker_id', req.user.id);
    if (completionsErr) throw completionsErr;

    const completedIds = new Set(completions?.map(c => c.module_id) || []);
    const allDone = (allModules?.length || 0) > 0 && allModules.every(m => completedIds.has(m.id));

    let cert = null;
    if (allDone) {
      // Check if already certified
      const { data: existing } = await supabase
        .from('tasker_enterprise_certifications')
        .select('*')
        .eq('tasker_id', req.user.id)
        .maybeSingle();

      if (!existing) {
        // Issue certification
        const certNumber = `TKU-ENT-${Date.now().toString(36).toUpperCase()}-${req.user.id.substring(0, 6).toUpperCase()}`;
        const { data: newCert, error: certErr } = await supabase
          .from('tasker_enterprise_certifications')
          .insert({
            tasker_id: req.user.id,
            certificate_number: certNumber,
          })
          .select()
          .single();
        if (certErr) throw certErr;

        // Update tasker profile
        const { error: profileErr } = await supabase
          .from('tasker_profiles')
          .update({
            enterprise_certified: true,
            enterprise_certified_at: new Date().toISOString(),
            enterprise_certificate_id: newCert?.id,
          })
          .eq('user_id', req.user.id);
        if (profileErr) {
          console.warn('Enterprise badge profile update failed:', profileErr.message);
        }

        cert = newCert;

        // Send congratulations email
        await resend.emails.send({
          from: FROM,
          to: req.user.email,
          subject: '🏆 You are now a Taskeeu Certified Enterprise Tasker!',
          html: certEmail(req.user.full_name, certNumber),
        }).catch(err => console.error(`❌ Certification email failed:`, err?.message));

        // In-app notification
        try {
          const { error: notificationErr } = await supabase.from('notifications').insert({
            user_id: req.user.id,
            type: 'enterprise_certified',
            title: 'Enterprise Certification Complete!',
            message: 'You are now a Certified Enterprise Field Agent. Your badge is now visible on your profile.',
            action_url: '/tasker/dashboard?tab=certifications',
          });
          if (notificationErr) console.warn('Enterprise certification notification failed:', notificationErr.message);
        } catch (notificationErr) {
          console.warn('Enterprise certification notification failed:', notificationErr?.message);
        }
      } else {
        cert = existing;

        try {
          const { error: badgeSyncErr } = await supabase
            .from('tasker_profiles')
            .update({
              enterprise_certified: true,
              enterprise_certified_at: existing.issued_at || new Date().toISOString(),
              enterprise_certificate_id: existing.id,
            })
            .eq('user_id', req.user.id);
          if (badgeSyncErr) console.warn('Enterprise badge sync failed:', badgeSyncErr.message);
        } catch (badgeSyncErr) {
          console.warn('Enterprise badge sync failed:', badgeSyncErr?.message);
        }
      }
    }

    res.json({
      success: true,
      message: 'Module marked as complete!',
      all_modules_done: allDone,
      certification: cert,
      newly_certified: allDone && !!cert,
    });
  } catch (err) {
    console.error('Complete module error:', err);
    res.status(500).json({ success: false, message: 'Failed to mark complete' });
  }
});

// ── GET /certifications/my ─────────────────────────────────────────
router.get('/my', authenticate, async (req, res) => {
  try {
    const { data: cert } = await supabase
      .from('tasker_enterprise_certifications')
      .select('*')
      .eq('tasker_id', req.user.id)
      .eq('is_valid', true)
      .maybeSingle();

    const { data: profile } = await supabase
      .from('tasker_profiles')
      .select('enterprise_certified, enterprise_certified_at')
      .eq('user_id', req.user.id)
      .maybeSingle();

    res.json({ success: true, certification: cert || null, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch certification' });
  }
});

// ── GET /certifications/:certNumber/verify — public verify ─────────
router.get('/:certNumber/verify', async (req, res) => {
  try {
    const { data: cert } = await supabase
      .from('tasker_enterprise_certifications')
      .select('*, tasker:users!tasker_id(full_name, avatar_url)')
      .eq('certificate_number', req.params.certNumber)
      .maybeSingle();

    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
    res.json({ success: true, valid: cert.is_valid, certification: cert });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// ── GET /certifications/:userId/certificate — render certificate ───
router.get('/:userId/certificate', async (req, res) => {
  try {
    const { data: cert } = await supabase
      .from('tasker_enterprise_certifications')
      .select('*')
      .eq('tasker_id', req.params.userId)
      .eq('is_valid', true)
      .maybeSingle();

    if (!cert) return res.status(404).send('Certificate not found');

    const { data: user } = await supabase
      .from('users')
      .select('full_name, created_at')
      .eq('id', req.params.userId)
      .maybeSingle();

    const { data: completions } = await supabase
      .from('tasker_module_completions')
      .select('completed_at')
      .eq('tasker_id', req.params.userId)
      .order('completed_at', { ascending: false })
      .limit(1);

    const completedDate = completions?.[0]?.completed_at
      ? new Date(completions[0].completed_at).toLocaleDateString('en-NG', { day:'numeric', month:'long', year:'numeric' })
      : new Date(cert.issued_at).toLocaleDateString('en-NG', { day:'numeric', month:'long', year:'numeric' });

    const html = generateCertificateHTML(user?.full_name, cert.certificate_number, completedDate);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="taskeeu-enterprise-certificate-${cert.certificate_number}.html"`);
    res.send(html);
  } catch (err) {
    res.status(500).send('Failed to generate certificate');
  }
});

// ── Certificate HTML Generator ─────────────────────────────────────
function generateCertificateHTML(name, certNumber, dateStr) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Taskeeu Enterprise Certificate — ${name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f0f0e8; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; font-family: 'Lato', sans-serif; }
  .cert {
    background: #fff;
    width: 100%;
    max-width: 900px;
    padding: 0;
    position: relative;
    box-shadow: 0 20px 80px rgba(0,0,0,0.15);
    border-radius: 4px;
    overflow: hidden;
  }
  /* Gold border frame */
  .frame {
    position: absolute;
    inset: 12px;
    border: 2px solid #C8A951;
    pointer-events: none;
    z-index: 10;
  }
  .frame::before {
    content: '';
    position: absolute;
    inset: 4px;
    border: 1px solid rgba(200,169,81,0.4);
  }
  /* Corner ornaments */
  .corner {
    position: absolute;
    width: 40px;
    height: 40px;
    border-color: #C8A951;
    border-style: solid;
  }
  .corner.tl { top: 6px; left: 6px; border-width: 3px 0 0 3px; }
  .corner.tr { top: 6px; right: 6px; border-width: 3px 3px 0 0; }
  .corner.bl { bottom: 6px; left: 6px; border-width: 0 0 3px 3px; }
  .corner.br { bottom: 6px; right: 6px; border-width: 0 3px 3px 0; }
  /* Header band */
  .header {
    background: linear-gradient(135deg, #0D1117 0%, #1a2e1a 50%, #0D1117 100%);
    padding: 32px 60px 28px;
    text-align: center;
    position: relative;
  }
  .header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, #C8A951, #00C37E, #C8A951, transparent);
  }
  .brand { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 4px; }
  .brand-icon {
    width: 36px; height: 36px;
    background: #00C37E;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    font-weight: 900;
    font-size: 20px;
  }
  .brand-name { color: #00C37E; font-size: 26px; font-weight: 900; letter-spacing: 3px; font-family: 'Playfair Display', serif; }
  .brand-sub { color: rgba(255,255,255,0.5); font-size: 11px; letter-spacing: 4px; text-transform: uppercase; margin-top: 2px; }
  /* Body */
  .body { padding: 40px 80px 36px; text-align: center; background: #fff; }
  .cert-label {
    font-size: 11px; letter-spacing: 5px; text-transform: uppercase;
    color: #C8A951; font-weight: 700; margin-bottom: 16px;
  }
  .cert-title {
    font-family: 'Playfair Display', serif;
    font-size: 42px; font-weight: 900;
    color: #1a1a2e; line-height: 1.1;
    margin-bottom: 20px;
  }
  .presented-to { font-size: 14px; color: #6b7280; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
  .recipient-name {
    font-family: 'Playfair Display', serif;
    font-size: 38px; font-weight: 700;
    color: #00C37E;
    border-bottom: 2px solid #C8A951;
    display: inline-block;
    padding-bottom: 8px;
    margin-bottom: 24px;
  }
  .body-text {
    font-size: 14px; color: #4b5563; line-height: 1.8; max-width: 580px;
    margin: 0 auto 28px;
  }
  /* Modules strip */
  .modules {
    display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
    margin-bottom: 32px;
  }
  .module-badge {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    padding: 4px 14px;
    font-size: 12px; font-weight: 600; color: #374151;
    display: flex; align-items: center; gap: 5px;
  }
  .module-badge .dot { width: 7px; height: 7px; border-radius: 50%; background: #00C37E; }
  /* Seal + signatures */
  .footer-row { display: flex; align-items: flex-end; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 28px; gap: 20px; }
  .seal {
    width: 100px; height: 100px;
    border: 3px solid #C8A951;
    border-radius: 50%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center;
    position: relative;
    flex-shrink: 0;
  }
  .seal::before {
    content: '';
    position: absolute;
    inset: 4px;
    border: 1px dashed #C8A951;
    border-radius: 50%;
  }
  .seal-icon { font-size: 28px; line-height: 1; }
  .seal-text { font-size: 7px; letter-spacing: 1px; font-weight: 700; color: #C8A951; text-transform: uppercase; margin-top: 2px; }
  .sig-block { text-align: center; flex: 1; }
  .sig-line { border-bottom: 1px solid #374151; margin-bottom: 6px; height: 36px; }
  .sig-name { font-size: 12px; font-weight: 700; color: #1a1a2e; }
  .sig-title { font-size: 11px; color: #6b7280; }
  .cert-details { text-align: right; flex-shrink: 0; }
  .cert-detail-row { font-size: 11px; color: #6b7280; margin-bottom: 3px; }
  .cert-detail-row strong { color: #374151; }
  /* Bottom band */
  .footer-band {
    background: linear-gradient(135deg, #0D1117, #1a2e1a);
    padding: 12px 60px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .verify-text { color: rgba(255,255,255,0.5); font-size: 10px; }
  .verify-url { color: #00C37E; font-size: 11px; font-weight: 600; }
  @media print {
    body { background: #fff; padding: 0; }
    .cert { box-shadow: none; max-width: 100%; }
    .print-btn { display: none !important; }
  }
  .print-btn {
    position: fixed; bottom: 24px; right: 24px;
    background: #00C37E; color: #fff;
    padding: 12px 24px; border-radius: 12px;
    border: none; cursor: pointer;
    font-size: 14px; font-weight: 700;
    box-shadow: 0 4px 20px rgba(0,195,126,0.4);
    display: flex; align-items: center; gap-8px: gap: 8px;
  }
</style>
</head>
<body>
<div class="cert">
  <div class="frame"></div>
  <div class="corner tl"></div><div class="corner tr"></div>
  <div class="corner bl"></div><div class="corner br"></div>

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="brand-icon">⚡</div>
      <div class="brand-name">TASKEEU</div>
    </div>
    <div class="brand-sub">Africa's Field Operations Platform</div>
  </div>

  <!-- Body -->
  <div class="body">
    <div class="cert-label">Certificate of Achievement</div>
    <div class="cert-title">Enterprise Field Agent<br/>Certification</div>
    <div class="presented-to">This is to certify that</div>
    <div class="recipient-name">${name || 'Field Agent'}</div>
    <p class="body-text">
      has successfully completed all five modules of the <strong>Taskeeu Enterprise Tasker Certification Programme</strong>
      and has demonstrated the professional knowledge, safety standards, and operational competency required
      to carry out enterprise field operations across Nigeria on behalf of corporate clients.
    </p>

    <!-- Completed modules -->
    <div class="modules">
      <div class="module-badge"><span class="dot"></span> Verification Tasks</div>
      <div class="module-badge"><span class="dot"></span> Telecom & Infrastructure</div>
      <div class="module-badge"><span class="dot"></span> Inspection & Audit Tasks</div>
      <div class="module-badge"><span class="dot"></span> Field Operations & Logistics</div>
      <div class="module-badge"><span class="dot"></span> Safety, Health & Standards</div>
    </div>

    <!-- Footer row -->
    <div class="footer-row">
      <div class="cert-details">
        <div class="cert-detail-row">Date: <strong>${dateStr}</strong></div>
        <div class="cert-detail-row">Certificate No: <strong>${certNumber}</strong></div>
        <div class="cert-detail-row">Status: <strong style="color:#00C37E">✓ Valid & Active</strong></div>
      </div>

      <div class="seal">
        <div class="seal-icon">🏆</div>
        <div class="seal-text">Taskeeu<br/>Certified</div>
      </div>

      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">Taskeeu Technologies Ltd</div>
        <div class="sig-title">Chief Executive Officer</div>
      </div>
    </div>
  </div>

  <!-- Footer band -->
  <div class="footer-band">
    <div class="verify-text">Verify this certificate at</div>
    <div class="verify-url">taskeeu.com/verify/${certNumber}</div>
    <div class="verify-text">© ${new Date().getFullYear()} Taskeeu Technologies Ltd · Lagos, Nigeria</div>
  </div>
</div>

<button class="print-btn" onclick="window.print()">🖨️ Save as PDF</button>
</body>
</html>`;
}

// ── Cert email template ─────────────────────────────────────────────
function certEmail(name, certNumber) {
  return `<!DOCTYPE html><html><head><style>
body{font-family:'Segoe UI',sans-serif;background:#f5f7f5;margin:0}
.wrap{max-width:580px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden}
.head{background:linear-gradient(135deg,#0D1117,#0a2e1a);padding:32px;text-align:center}
.head h1{color:#00C37E;margin:0;font-size:22px;font-weight:900;letter-spacing:2px}
.head p{color:rgba(255,255,255,0.5);margin:6px 0 0;font-size:12px}
.body{padding:32px}.body p{color:#374151;line-height:1.6;font-size:14px}
.badge{text-align:center;margin:24px 0;padding:24px;background:linear-gradient(135deg,#f0fff8,#e6fdf2);border:2px solid #00C37E;border-radius:16px}
.badge-icon{font-size:56px;display:block;margin-bottom:8px}
.badge-title{font-size:20px;font-weight:900;color:#0a2e1a}
.badge-sub{font-size:13px;color:#6b7280;margin-top:4px}
.cert-no{display:inline-block;background:#0D1117;color:#00C37E;padding:8px 20px;border-radius:8px;font-family:monospace;font-size:14px;font-weight:700;letter-spacing:2px;margin:12px 0}
.btn{display:inline-block;background:#00C37E;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin:16px 0}
.modules{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}
.mod{background:#f9fafb;border:1px solid #e5e7eb;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:600;color:#374151}
.foot{background:#f9fafb;padding:16px 32px;text-align:center;color:#9ca3af;font-size:11px;border-top:1px solid #e5e7eb}
</style></head><body>
<div class="wrap">
<div class="head"><h1>⚡ TASKEEU</h1><p>Africa's Field Operations Platform</p></div>
<div class="body">
  <p>Dear <strong>${name}</strong>,</p>
  <p>Congratulations! You have successfully completed the <strong>Taskeeu Enterprise Tasker Certification Programme</strong> and are now officially a <strong>Certified Enterprise Field Agent</strong>.</p>
  <div class="badge">
    <span class="badge-icon">🏆</span>
    <div class="badge-title">Enterprise Certified Tasker</div>
    <div class="badge-sub">Taskeeu Technologies Ltd</div>
  </div>
  <p style="text-align:center">Your Certificate Number:</p>
  <div style="text-align:center"><span class="cert-no">${certNumber}</span></div>
  <p>You have completed all 5 certification modules:</p>
  <div class="modules">
    <span class="mod">✅ Verification Tasks</span>
    <span class="mod">✅ Telecom & Infrastructure</span>
    <span class="mod">✅ Inspection & Audit Tasks</span>
    <span class="mod">✅ Field Operations & Logistics</span>
    <span class="mod">✅ Safety, Health & Standards</span>
  </div>
  <p>Your <strong>🏆 Enterprise Badge</strong> is now visible on your public profile and will appear on your bids when applying for company enterprise tasks. This badge significantly increases your chances of being selected for high-value assignments.</p>
  <p style="text-align:center">
    <a href="${process.env.FRONTEND_URL || ''}/tasker/dashboard?tab=certifications" class="btn">View & Download Certificate →</a>
  </p>
  <p style="font-size:12px;color:#6b7280;text-align:center">Verify at: taskeeu.com/verify/${certNumber}</p>
</div>
<div class="foot">© ${new Date().getFullYear()} Taskeeu Technologies Ltd · Lagos, Nigeria</div>
</div></body></html>`;
}

module.exports = router;
