// ── Robust FRONTEND_URL parser ─────────────────────────────────────────────
// Handles all Railway env var corruption patterns:
//   "FRONTEND_URLS=https://thankeeu.com"
//   "FRONTEND_URL=https://thankeeu.com"
//   " https://thankeeu.com " (whitespace)
//   "https://thankeeu.com/" (trailing slash)
const FRONTEND_URL = (() => {
  // Try all possible env var names (Railway sometimes appends S)
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  // Strip KEY=value wrapper (handles FRONTEND_URL=https://... or FRONTEND_URLS=https://...)
  if (!s.startsWith('http') && s.includes('=')) {
    s = s.slice(s.lastIndexOf('=') + 1).trim();
  }
  // Strip any URL-encoded = signs
  s = s.replace(/%3D/gi, '=');
  if (!s.startsWith('http') && s.includes('=')) {
    s = s.slice(s.lastIndexOf('=') + 1).trim();
  }
  // Strip quotes and trailing slash
  s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
  // Final validation
  if (!s.startsWith('https://') && !s.startsWith('http://')) {
    console.warn('[email.js] FRONTEND_URL could not be parsed from env, using fallback. Raw value:', JSON.stringify(raw));
    return 'https://thankeeu.com';
  }
  return s;
})();
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Currency helper: all stored and displayed amounts are Nigerian naira.
const fmtNGN = (ngnAmount) => {
  if (!ngnAmount) return '₦0';
  return `₦${Number(ngnAmount).toLocaleString('en-NG')}`;
};

const BASE = (content) => `
<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;">
  <div style="padding:20px 32px 0;border-bottom:2px solid #f3f0ff;">
    <span style="font-size:16px;font-weight:800;color:#6C5CE7;letter-spacing:-0.5px;">Thank<span style="color:#1a1a1a;">eeu</span> <span style="font-size:13px;font-weight:400;color:#aaa;">💜</span></span>
  </div>
  <div style="padding:28px 32px;">${content}</div>
  <div style="padding:14px 32px 22px;border-top:1px solid #f3f0ff;">
    <p style="color:#ccc;font-size:11px;margin:0;line-height:1.6;">
      Thankeeu &middot; <a href="${FRONTEND_URL}" style="color:#ccc;text-decoration:none;">thankeeu.com</a>
    </p>
  </div>
</div>`;

// Alias — many templates use wrap() instead of BASE()
const wrap = BASE;

const btn = (text, url, color = '#6C5CE7') => {
  // Guard: ensure URL is absolute and clean
  let safeUrl = url || '';
  if (safeUrl.includes('=') && !safeUrl.startsWith('http')) {
    safeUrl = safeUrl.slice(safeUrl.indexOf('=') + 1).trim();
  }
  safeUrl = safeUrl.replace(/['"]/g, '').trim();
  if (!safeUrl.startsWith('http')) safeUrl = 'https://thankeeu.com' + safeUrl;

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 4px;">
    <tr><td style="border-radius:6px;background:${color};">
      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer"
         style="display:inline-block;background:${color};color:#ffffff !important;padding:12px 24px;border-radius:6px;text-decoration:none !important;font-weight:600;font-size:14px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${text}</a>
    </td></tr>
  </table>
  <p style="color:#ccc;font-size:11px;margin:4px 0 0;word-break:break-all;">
    Or copy: <a href="${safeUrl}" style="color:#6C5CE7;text-decoration:none;">${safeUrl}</a>
  </p>`;
};

const emailTemplates = {

  welcome: (data) => ({
    subject: `Welcome to Thankeeu, ${data.name}`,
    html: BASE(`
      <p style="color:#333;font-size:15px;line-height:1.8;">Hi ${data.name},</p>
      <p style="color:#333;font-size:15px;line-height:1.8;margin:12px 0 20px;">Your Thankeeu account is ready. You can now create group cards, collect messages and gifts, and celebrate the people around you.</p>
      ${btn('Go to your dashboard →', `${FRONTEND_URL}/dashboard`)}
    `)
  }),

  cardInvite: (data) => ({
    subject: `${data.creatorName} is asking you to sign ${data.recipientName}'s ${data.occasion} card`,
    html: BASE(`
      <p style="color:#333;font-size:15px;line-height:1.8;margin:0 0 16px;">
        <strong>${data.creatorName}</strong> is putting together a group card for <strong>${data.recipientName}</strong>'s ${data.occasion} and would like you to add a message.
      </p>
      ${data.giftEnabled ? `<p style="color:#555;font-size:13px;line-height:1.7;margin:0 0 16px;">A gift pot is also open — you can chip in any amount alongside your message.</p>` : ''}
      ${btn(`Sign ${data.recipientName}'s card →`, `${FRONTEND_URL}/sign/${data.cardSlug}`, '#6C5CE7')}
      <p style="color:#999;font-size:12px;margin-top:16px;">Signing closes on ${data.deadline}. No account needed.</p>
    `)
  }),

  cardDelivery: (data) => {
    // Use custom_occasion if provided (occasion='other'), otherwise capitalise the occasion name.
    // Guard against raw "other" appearing in the email if the migration hasn't been run yet.
    const rawOccasion = data.occasion || '';
    const occasionDisplay = (rawOccasion === 'other' || rawOccasion === 'Other')
      ? (data.custom_occasion || data.occasionLabel || 'special day')
      : (rawOccasion.charAt(0).toUpperCase() + rawOccasion.slice(1).replace(/_/g, ' '));
    const firstSender = data.senderCount > 1 ? `${data.senderCount} people` : 'someone';
    return {
    subject: data.senderCount > 1
      ? `${firstSender} have a ${occasionDisplay} card for you, ${data.recipientName}`
      : `You have a ${occasionDisplay} card waiting, ${data.recipientName}`,
    html: BASE(`
      <p style="color:#333;font-size:15px;margin:0 0 6px;">Hi ${data.recipientName},</p>

      <p style="color:#333;line-height:1.8;font-size:15px;margin:16px 0;">
        ${data.senderCount > 0 ? `<strong>${data.senderCount} ${data.senderCount === 1 ? 'person' : 'people'}</strong> have come together to create a group card for your ${occasionDisplay}.` : `Someone created a group card for your ${occasionDisplay}.`}
        ${data.giftAmount ? ` They also pooled a gift of <strong style="color:#166534;">${fmtNGN(data.giftAmount)}</strong> for you.` : ''}
      </p>

      ${btn(`Open your ${occasionDisplay} card →`, `${FRONTEND_URL}/card/${data.cardSlug}?token=${data.accessToken}`, '#6C5CE7')}

      ${data.giftAmount ? `<p style="color:#555;font-size:13px;line-height:1.7;margin-top:20px;">To claim your gift, open the card and click <strong>Claim gift</strong>. You may need to create a free account using this email address to withdraw.</p>` : ''}

      <p style="color:#999;font-size:12px;line-height:1.7;margin-top:24px;border-top:1px solid #f0ecff;padding-top:16px;">
        The button above opens your card directly — no login required to view it.
        If you want to save it to your account, sign in or sign up at
        <a href="${FRONTEND_URL}" style="color:#6C5CE7;">thankeeu.com</a> using <strong>${data.recipientEmail || 'this email address'}</strong>.
      </p>
    `)
  };
  },

  // Sent by an admin's "re-deliver" action — for a card that was already
  // delivered once, but has picked up new signatures and/or new gift money since then.
  cardRedelivery: (data) => ({
    subject: `Your ${data.occasion} card has ${data.newMessageCount ? `${data.newMessageCount} new message${data.newMessageCount === 1 ? '' : 's'}` : 'been updated'}, ${data.recipientName}`,
    html: BASE(`
      <p style="color:#333;font-size:15px;line-height:1.8;">Hi ${data.recipientName},</p>
      <p style="color:#333;font-size:15px;line-height:1.8;margin:12px 0 20px;">
        ${data.newMessageCount ? `<strong>${data.newMessageCount} more ${data.newMessageCount === 1 ? 'person' : 'people'}</strong> have added messages to your ${data.occasion} card since it was first sent.` : `Your ${data.occasion} card has been updated with new messages.`}
        ${data.giftAmount ? ` The gift pot now stands at <strong style="color:#166534;">${fmtNGN(data.giftAmount)}</strong>.` : ''}
      </p>
      ${btn('Open your updated card →', `${FRONTEND_URL}/card/${data.cardSlug}?token=${data.accessToken}`, '#6C5CE7')}
      <p style="color:#999;font-size:12px;margin-top:20px;">
        To save your card or claim your gift, sign in at
        <a href="${FRONTEND_URL}" style="color:#6C5CE7;">thankeeu.com</a> using ${data.recipientEmail || 'this email address'}.
      </p>
    `)
  }),

  // Sent by FLW transfer webhook when a bank withdrawal fails
  giftWithdrawalFailed: (data) => ({
    subject: `Action needed: Your gift withdrawal for "${data.cardTitle}" failed`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Your withdrawal could not be completed ⚠️</h2>
      <p style="color:#555;line-height:1.7;">Hi ${data.recipientName},</p>
      <p style="color:#555;line-height:1.7;">Unfortunately, your ₦${Number(data.amount||0).toLocaleString('en-NG')} gift withdrawal for <strong>${data.cardTitle}</strong> could not be completed.</p>
      <div style="background:#FEF3F2;border-radius:10px;padding:14px 16px;margin:16px 0;border:1px solid #FECDCA;">
        <p style="color:#B42318;margin:0;font-size:13px;font-weight:600;">Reason: ${data.reason || 'Transfer failed'}</p>
      </div>
      <p style="color:#555;line-height:1.7;">The good news: your gift pot has been fully restored and you can try withdrawing again. Please check your bank account details are correct before retrying.</p>
      ${btn('Retry withdrawal →', data.retryUrl || '#', '#E84393')}
      <p style="color:#aaa;font-size:12px;margin-top:16px;">If this keeps failing, please contact us at support@thankeeu.com</p>
    `)
  }),

  cardReminder: (data) => ({
    subject: `${data.recipientName}'s card closes in ${data.hoursLeft} hours — sign it now`,
    html: BASE(`
      <p style="color:#333;font-size:15px;line-height:1.8;margin:0 0 16px;">
        <strong>${data.recipientName}</strong>'s group card is closing in ${data.hoursLeft} hours. If you haven't added your message yet, now is the time.
      </p>
      ${btn(`Sign ${data.recipientName}'s card →`, `${FRONTEND_URL}/sign/${data.cardSlug}`, '#6C5CE7')}
    `)
  }),

  passwordReset: (data) => ({
    subject: 'Reset your Thankeeu password',
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Reset your password</h2>
      <p style="color:#555;line-height:1.7;">Click below to reset your password. This link expires in 1 hour.</p>
      ${btn('Reset password', `${FRONTEND_URL}/reset-password?token=${data.token}`)}
      <p style="color:#aaa;font-size:12px;margin-top:20px;">If you did not request this, ignore this email.</p>
    `)
  }),

  companyWelcome: (data) => ({
    subject: `Welcome to Thankeeu for Teams, ${data.companyName}!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Welcome, ${data.contactPerson}!</h2>
      <p style="color:#555;line-height:1.7;">Your company account for <strong>${data.companyName}</strong> is ready. Import your team, set up birthday automations, and celebrate your employees like never before.</p>
      <div style="background:#EEEDFE;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="color:#534AB7;font-weight:600;margin:0 0 8px;font-size:14px;">Get started in 3 steps:</p>
        <ol style="color:#534AB7;font-size:13px;margin:0;padding-left:18px;line-height:2.2;">
          <li>Download the team data template</li>
          <li>Fill in your employees details and upload</li>
          <li>Subscribe to activate birthday automations</li>
        </ol>
      </div>
      ${btn('Go to Company Dashboard', `${FRONTEND_URL}/company/dashboard`)}
    `)
  }),

  companyPasswordReset: (data) => ({
    subject: `Reset your Thankeeu company password`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Reset your company password</h2>
      <p style="color:#555;line-height:1.7;">We received a reset request for <strong>${data.companyName}</strong>. Link expires in 1 hour.</p>
      ${btn('Reset password', `${FRONTEND_URL}/company/reset-password?token=${data.token}`)}
    `)
  }),

  birthdayDeptNotice: (data) => ({
    subject: `${data.celebrantName}'s birthday is on ${data.birthdayDate} — sign their card`,
    html: BASE(`
      <p style="color:#333;font-size:15px;line-height:1.8;margin:0 0 16px;">
        <strong>${data.celebrantName}</strong> from the <strong>${data.department}</strong> team has a birthday coming up on <strong>${data.birthdayDate}</strong>.
        ${data.companyName} is putting together a group card — add your message before it closes.
      </p>
      ${data.giftEnabled ? `<p style="color:#555;font-size:13px;margin:0 0 16px;">A gift pot is also open. You can contribute any amount alongside your message.</p>` : ''}
      ${btn(`Sign ${data.celebrantFirstName}'s birthday card →`, `${FRONTEND_URL}/sign/${data.cardSlug}`, '#6C5CE7')}
      <p style="color:#999;font-size:12px;margin-top:16px;">Please keep this a surprise 🤫 &nbsp; Signing closes ${data.deadline}.</p>
    `)
  }),

  birthdayCelebrant: (data) => ({
    subject: `Happy Birthday, ${data.firstName} 🎂 — your team has a card for you`,
    html: BASE(`
      <p style="color:#333;font-size:15px;line-height:1.8;">Hi ${data.firstName},</p>
      <p style="color:#333;font-size:15px;line-height:1.8;margin:12px 0 20px;">
        Happy Birthday! Your colleagues at <strong>${data.companyName}</strong> put together a group card for you.
        <strong>${data.signerCount} ${data.signerCount === 1 ? 'person' : 'people'}</strong> signed it and left you messages.
        ${data.giftAmount ? ` They also pooled a gift of <strong style="color:#166534;">${fmtNGN(data.giftAmount)}</strong>.` : ''}
      </p>
      ${btn('Open your birthday card →', `${FRONTEND_URL}/card/${data.cardSlug}?token=${data.accessToken}`, '#6C5CE7')}
      <p style="color:#555;font-size:13px;margin-top:20px;">From everyone at ${data.companyName} — enjoy your day! 🎂</p>
    `)
  }),

  supportTicket: (data) => ({
    subject: `[Support #${data.ticketId.slice(0,8).toUpperCase()}] ${data.subject}`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:18px;margin:0 0 16px;">New Support Ticket</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
        ${[['Ticket ID','#'+data.ticketId.slice(0,8).toUpperCase()],['From',data.senderName],['Email',data.senderEmail],['Type',data.senderType],['Subject',data.subject]].map(([k,v])=>
          `<tr><td style="padding:8px 12px;background:#f9f9f9;font-weight:600;color:#555;border:1px solid #eee;width:110px;">${k}</td><td style="padding:8px 12px;border:1px solid #eee;color:#333;">${v}</td></tr>`).join('')}
      </table>
      <div style="background:#f5f5f5;border-radius:8px;padding:16px;border-left:4px solid #6C5CE7;">
        <p style="color:#333;font-size:13px;line-height:1.8;margin:0;white-space:pre-line;">${data.message}</p>
      </div>
      ${btn('Reply in Admin Panel', `${FRONTEND_URL}/admin`)}
    `)
  }),

  supportConfirm: (data) => ({
    subject: `We received your message — Ticket #${data.ticketId.slice(0,8).toUpperCase()}`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">We got your message!</h2>
      <p style="color:#555;line-height:1.7;">Hi <strong>${data.name}</strong>, we received your request about <strong>"${data.subject}"</strong>.</p>
      <div style="background:#EAF3DE;border-radius:8px;padding:14px 16px;margin:16px 0;">
        <p style="color:#3B6D11;margin:0;font-size:13px;">Ticket: <strong>#${data.ticketId.slice(0,8).toUpperCase()}</strong> &nbsp;·&nbsp; We reply within <strong>24 hours</strong></p>
      </div>
    `)
  }),

  supportReply: (data) => ({
    subject: `Re: ${data.subject} — Thankeeu Support`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Reply from Thankeeu Support</h2>
      <p style="color:#555;line-height:1.7;">Hi <strong>${data.name}</strong>, here is our response to ticket <strong>#${data.ticketId.slice(0,8).toUpperCase()}</strong> — "${data.subject}":</p>
      <div style="background:#f5f5f5;border-radius:8px;padding:16px;border-left:4px solid #6C5CE7;margin:16px 0;">
        <p style="color:#333;font-size:13px;line-height:1.8;margin:0;white-space:pre-line;">${data.reply}</p>
      </div>
      <p style="color:#aaa;font-size:12px;margin-top:16px;">Need more help? Reply to this email or open another ticket in your dashboard.</p>
    `)
  }),
};

const sendEmail = async ({ to, template, data, subject, html }) => {
  try {
    let emailSubject = subject;
    let emailHtml    = html;

    // If a named template is supplied, resolve it
    if (template) {
      // Guard: warn if cardSlug is undefined so we can trace the caller
      if (data && 'cardSlug' in data && (data.cardSlug === undefined || data.cardSlug === null)) {
        console.error(`[sendEmail] WARNING: cardSlug is ${data.cardSlug} for template "${template}" to ${to}. Stack:`, new Error().stack.split('\n').slice(1,4).join(' | '));
        // Replace undefined with empty string so template doesn't render "/sign/undefined"
        data = { ...data, cardSlug: data.cardSlug || '' };
      }
      const tmpl = emailTemplates[template]?.(data);
      if (!tmpl) throw new Error(`Template "${template}" not found`);
      emailSubject = tmpl.subject;
      emailHtml    = tmpl.html;
    }

    if (!emailSubject || !emailHtml) throw new Error('Email requires either a template or both subject and html');

    const result = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME || 'Thankeeu'} <${process.env.EMAIL_FROM || 'hello@thankeeu.com'}>`,
      to,
      subject: emailSubject,
      html:    emailHtml,
    });
    return { success: true, id: result.id };
  } catch (error) {
    console.error('Email error:', error?.message || error);
    return { success: false, error };
  }
};

module.exports = { sendEmail };

// ── TEAMS MEMBER & OCCASIONS TEMPLATES (appended) ──────────────────────────

const teamsTemplates = {

  memberJoinRequest: (data) => ({
    subject: `New ${data.role === 'team_leader' ? 'Team Leader' : 'Team Member'} join request — ${data.memberName}`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">New account request 🔔</h2>
      <p style="color:#555;line-height:1.8;"><strong>${data.memberName}</strong> (${data.memberEmail}) has requested to join <strong>${data.companyName}</strong> as a <strong>${data.role === 'team_leader' ? 'Team Leader' : 'Team Member'}</strong> in the <strong>${data.department}</strong> department.</p>
      <div style="background:#EEEDFE;border-radius:8px;padding:14px 16px;margin:16px 0;">
        <p style="color:#534AB7;font-size:13px;margin:0;">
          ${data.isLeader ? 'As their department leader, you can approve or reject this request from your dashboard.' : 'Review and approve or reject this request from your HR dashboard.'}
        </p>
      </div>
      ${btn('Review request', `${FRONTEND_URL}/company/members`)}
    `)
  }),

  memberApproved: (data) => ({
    subject: `Your account has been approved — Welcome to ${data.companyName}!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">You are approved! 🎉</h2>
      <p style="color:#555;line-height:1.8;">Hi <strong>${data.memberName}</strong>, your account has been approved for <strong>${data.companyName}</strong> as a <strong>${data.role === 'team_leader' ? 'Team Leader' : 'Team Member'}</strong> in the <strong>${data.department}</strong> department.</p>
      <p style="color:#555;font-size:13px;">You can now sign in and start celebrating your colleagues!</p>
      ${btn('Sign in to your account', `${FRONTEND_URL}/member/login`)}
    `)
  }),

  memberRejected: (data) => ({
    subject: 'Update on your Thankeeu account request',
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Account request update</h2>
      <p style="color:#555;line-height:1.8;">Hi <strong>${data.memberName}</strong>, unfortunately your account request was not approved at this time.</p>
      ${data.reason ? `<div style="background:#FEF2F2;border-radius:8px;padding:14px 16px;margin:16px 0;border-left:4px solid #FCA5A5;"><p style="color:#991B1B;font-size:13px;margin:0;">${data.reason}</p></div>` : ''}
      <p style="color:#aaa;font-size:12px;margin-top:16px;">Please contact your HR department for more information.</p>
    `)
  }),

  memberPasswordReset: (data) => ({
    subject: 'Reset your Thankeeu password',
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Reset your password</h2>
      <p style="color:#555;line-height:1.7;">Hi <strong>${data.name}</strong>, click below to reset your password. This link expires in 1 hour.</p>
      ${btn('Reset password', `${FRONTEND_URL}/member/reset-password?token=${data.token}`)}
      <p style="color:#aaa;font-size:12px;margin-top:20px;">If you did not request this, ignore this email.</p>
    `)
  }),

  deductionRequest: (data) => ({
    subject: `[Deduction Request] ${data.leaderName} requests ${fmtNGN(data.amount)} from ${data.recipientName}'s celebration`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:18px;margin:0 0 12px;">Deduction request for review 💰</h2>
      <p style="color:#555;line-height:1.8;"><strong>${data.leaderName}</strong> (Team Leader) has requested a deduction from the gift pot collected for <strong>${data.recipientName}</strong>'s celebration.</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0;">
        ${[['Card',data.cardTitle],['Amount Requested',`${fmtNGN(data.amount)}`],['Reason',data.reason]].map(([k,v])=>
          `<tr><td style="padding:8px 12px;background:#f9f9f9;font-weight:600;color:#555;border:1px solid #eee;width:130px;">${k}</td><td style="padding:8px 12px;border:1px solid #eee;color:#333;">${v}</td></tr>`).join('')}
      </table>
      <p style="color:#555;font-size:13px;line-height:1.7;">Note: A 3.5% platform fee has already been deducted from the gross total before this request.</p>
      ${btn('Review in HR Dashboard', `${FRONTEND_URL}/company/deductions`)}
    `)
  }),

  deductionApproved: (data) => ({
    subject: data.transferred
      ? `💸 ₦${(data.amount||0).toLocaleString('en-NG')} sent to your bank — deduction approved!`
      : `✅ Deduction approved — add your bank account to receive ₦${(data.amount||0).toLocaleString('en-NG')}`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Deduction approved ✅</h2>
      <p style="color:#555;line-height:1.8;">Hi <strong>${data.leaderName}</strong>, HR approved your deduction request of <strong>${fmtNGN(data.amount)}</strong>.</p>
      ${data.note ? `<div style="background:#EAF3DE;border-radius:8px;padding:14px;margin:16px 0;"><p style="color:#3B6D11;font-size:13px;margin:0;"><strong>HR note:</strong> ${data.note}</p></div>` : ''}
      ${data.transferred
        ? `<div style="background:#EAF3DE;border-radius:12px;padding:16px 20px;margin:20px 0;">
             <p style="color:#166534;font-weight:700;margin:0 0 4px;">💸 Transfer initiated!</p>
             <p style="color:#166534;font-size:13px;margin:0;">₦${(data.amount||0).toLocaleString('en-NG')} has been sent to your registered bank account. It typically arrives within minutes to a few hours.</p>
           </div>`
        : `<div style="background:#FEF3C7;border-radius:12px;padding:16px 20px;margin:20px 0;border-left:4px solid #F59E0B;">
             <p style="color:#92400E;font-weight:700;margin:0 0 6px;">⚠️ Action required: Add your bank account</p>
             <p style="color:#92400E;font-size:13px;margin:0 0 12px;">We couldn't find a verified bank account for your profile. To receive your ₦${(data.amount||0).toLocaleString('en-NG')}, please log in and add your bank details.</p>
             ${btn('Add bank account now', (data.appUrl||'https://thankeeu.com') + '/member/dashboard?tab=settings', '#F59E0B')}
             <p style="color:#92400E;font-size:12px;margin-top:12px;">Once added, use the "Withdraw" button on your approved deduction card.</p>
           </div>`
      }
    `)
  }),

  deductionRejected: (data) => ({
    subject: `Your deduction request of ${fmtNGN(data.amount)} was not approved`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Deduction request rejected</h2>
      <p style="color:#555;line-height:1.8;">Hi <strong>${data.leaderName}</strong>, your deduction request of <strong>${fmtNGN(data.amount)}</strong> was not approved at this time.</p>
      ${data.note ? `<div style="background:#FEF2F2;border-radius:8px;padding:14px;margin:16px 0;border-left:4px solid #FCA5A5;"><p style="color:#991B1B;font-size:13px;margin:0;"><strong>HR note:</strong> ${data.note}</p></div>` : ''}
    `)
  }),

  crossDeptRequest: (data) => ({
    subject: `[Approval Required] Company-wide notification request for "${data.cardTitle}"`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:18px;margin:0 0 12px;">Cross-department notification request 🔔</h2>
      <p style="color:#555;line-height:1.8;"><strong>${data.requesterName}</strong> has requested company-wide notification for the card <strong>"${data.cardTitle}"</strong>.</p>
      ${data.reason ? `<div style="background:#EEEDFE;border-radius:8px;padding:14px;margin:16px 0;"><p style="color:#534AB7;font-size:13px;margin:0;"><strong>Reason:</strong> ${data.reason}</p></div>` : ''}
      <p style="color:#555;font-size:13px;">By approving, notifications will be sent to all departments company-wide.</p>
      ${btn('Review in HR Dashboard', `${FRONTEND_URL}/company/deductions`)}
    `)
  }),

  occasionNotice: (data) => ({
    subject: `${data.memberName}'s ${data.occasionLabel} is on ${data.occasionDate} — sign their card`,
    html: BASE(`
      <p style="color:#333;font-size:15px;line-height:1.8;margin:0 0 16px;">
        <strong>${data.memberName}</strong> from the <strong>${data.department}</strong> team has a ${data.occasionLabel} coming up on <strong>${data.occasionDate}</strong>.
        ${data.companyName} is putting together a group card — add your message before it closes.
      </p>
      ${data.giftEnabled ? `<p style="color:#555;font-size:13px;margin:0 0 16px;">A gift pot is open. You can also contribute any amount alongside your message.</p>` : ''}
      ${btn(`Sign ${data.memberFirstName}'s card →`, `${FRONTEND_URL}/sign/${data.cardSlug}`, '#6C5CE7')}
      <p style="color:#999;font-size:12px;margin-top:16px;">Keep this a surprise 🤫 &nbsp; Signing closes ${data.deadline}. No account needed.</p>
    `)
  }),

  // Mid-period nudge — sent to colleagues who have NOT yet signed
  occasionReminder: (data) => ({
    subject: `Reminder: ${data.memberName}'s ${data.occasionLabel} is in ${data.daysLeft} day${data.daysLeft === 1 ? '' : 's'} — you haven't signed yet`,
    html: BASE(`
      <p style="color:#333;font-size:15px;line-height:1.8;margin:0 0 16px;">
        Just a quick reminder — <strong>${data.memberName}</strong>'s ${data.occasionLabel} is on <strong>${data.occasionDate}</strong> (in ${data.daysLeft} day${data.daysLeft === 1 ? '' : 's'}) and you haven't signed their card yet.
      </p>
      ${btn(`Sign ${data.memberFirstName}'s card →`, `${FRONTEND_URL}/sign/${data.cardSlug}`, '#6C5CE7')}
      <p style="color:#999;font-size:12px;margin-top:16px;">Keep this a surprise 🤫 &nbsp; Signing closes ${data.deadline}. It only takes a minute.</p>
    `)
  }),


  occasionCelebrant: (data) => ({
    subject: `Happy ${data.occasionLabel}, ${data.firstName} ${data.icon} — your team has a card for you`,
    html: BASE(`
      <p style="color:#333;font-size:15px;line-height:1.8;">Hi ${data.firstName},</p>
      <p style="color:#333;font-size:15px;line-height:1.8;margin:12px 0 20px;">
        Happy ${data.occasionLabel}! Your colleagues at <strong>${data.companyName}</strong> created a group card for you.
        <strong>${data.signerCount} ${data.signerCount === 1 ? 'person' : 'people'}</strong> left you messages.
        ${data.giftAmount ? ` They also pooled a gift of <strong style="color:#166534;">${fmtNGN(data.giftAmount)}</strong>.` : ''}
      </p>
      ${btn(`Open your ${data.occasionLabel} card →`, `${FRONTEND_URL}/card/${data.cardSlug}?token=${data.accessToken}`, '#6C5CE7')}
      ${data.giftAmount ? `<p style="color:#555;font-size:13px;margin-top:16px;">To claim your gift, open the card and click <strong>Claim gift</strong>.</p>` : ''}
    `)
  }),

  memberCardCreated: (data) => ({
    subject: `${data.creatorName} created a ${data.occasion} card for ${data.recipientName} — add your message`,
    html: BASE(`
      <p style="color:#333;font-size:15px;line-height:1.8;margin:0 0 16px;">
        <strong>${data.creatorName}</strong> created a group card for <strong>${data.recipientName}</strong>'s ${data.occasion}.
        ${data.giftEnabled ? ' A gift pot is also open — you can contribute alongside your message.' : ''}
      </p>
      ${btn(`Sign ${data.recipientName}'s card →`, `${FRONTEND_URL}/sign/${data.cardSlug}`, '#6C5CE7')}
      <p style="color:#999;font-size:12px;margin-top:12px;">No account needed to sign.</p>
    `)
  }),
};

// Merge into existing emailTemplates object
Object.assign(emailTemplates, teamsTemplates);

// ── NEW HIRE + LEAVING ADDITIONAL TEMPLATES (appended) ─────────────────────
const additionalTeamsTemplates = {

  // Sent to department members when a new employee is joining
  newHireDeptNotice: (data) => ({
    subject: `${data.newHireName} is joining the ${data.department} team on ${data.startDate} — sign their welcome card`,
    html: BASE(`
      <p style="color:#333;font-size:15px;line-height:1.8;margin:0 0 16px;">
        <strong>${data.newHireName}</strong> is joining the <strong>${data.department}</strong> team at <strong>${data.companyName}</strong>
        on <strong>${data.startDate}</strong>${data.jobTitle ? ` as ${data.jobTitle}` : ''}.
        Sign their welcome card to give them a great first impression of the team.
      </p>
      ${btn(`Sign ${data.newHireFirstName}'s welcome card →`, `${FRONTEND_URL}/sign/${data.cardSlug}`, '#6C5CE7')}
      <p style="color:#999;font-size:12px;margin-top:16px;">Signing closes ${data.deadline}. No account needed.</p>
    `)
  }),

  // Sent to the new hire on or after their start date
  newHireWelcome: (data) => ({
    subject: `Welcome to ${data.companyName}, ${data.firstName} — your team has a card for you`,
    html: BASE(`
      <p style="color:#333;font-size:15px;line-height:1.8;">Hi ${data.firstName},</p>
      <p style="color:#333;font-size:15px;line-height:1.8;margin:12px 0 20px;">
        Welcome to <strong>${data.companyName}</strong>! Your colleagues in the <strong>${data.department}</strong> team
        put together a welcome card for you. <strong>${data.signerCount} ${data.signerCount === 1 ? 'person' : 'people'}</strong> left you messages.
        ${data.giftAmount ? ` They also pooled a welcome gift of <strong style="color:#166534;">${fmtNGN(data.giftAmount)}</strong>.` : ''}
      </p>
      ${btn('Open your welcome card →', `${FRONTEND_URL}/card/${data.cardSlug}?token=${data.accessToken}`, '#6C5CE7')}
      <p style="color:#555;font-size:13px;margin-top:20px;">From everyone at ${data.companyName} — welcome aboard 🙌</p>
    `)
  }),

  // Sent to department members when a colleague is leaving
  farewellDeptNotice: (data) => ({
    subject: `${data.leavingName} is leaving on ${data.lastDay} — sign their farewell card`,
    html: BASE(`
      <p style="color:#333;font-size:15px;line-height:1.8;margin:0 0 16px;">
        <strong>${data.leavingName}</strong> from the <strong>${data.department}</strong> team will be leaving <strong>${data.companyName}</strong> on <strong>${data.lastDay}</strong>.
        Sign their farewell card and leave a message they'll keep.
        ${data.giftEnabled ? ' A farewell gift pot is also open.' : ''}
      </p>
      ${btn(`Sign ${data.leavingFirstName}'s farewell card →`, `${FRONTEND_URL}/sign/${data.cardSlug}`, '#6C5CE7')}
      <p style="color:#999;font-size:12px;margin-top:16px;">Keep this a surprise 🤫 &nbsp; Signing closes ${data.deadline}. No account needed.</p>
    `)
  }),

  // Sent to the leaving employee on their last day
  farewellCelebrant: (data) => ({
    subject: `${data.companyName} has a farewell card for you, ${data.firstName}`,
    html: BASE(`
      <p style="color:#333;font-size:15px;line-height:1.8;">Hi ${data.firstName},</p>
      <p style="color:#333;font-size:15px;line-height:1.8;margin:12px 0 20px;">
        Your colleagues at <strong>${data.companyName}</strong> put together a farewell card for you.
        <strong>${data.signerCount} ${data.signerCount === 1 ? 'person' : 'people'}</strong> left you messages.
        ${data.giftAmount ? ` They also pooled a farewell gift of <strong style="color:#166534;">${fmtNGN(data.giftAmount)}</strong>.` : ''}
      </p>
      ${btn('Open your farewell card →', `${FRONTEND_URL}/card/${data.cardSlug}?token=${data.accessToken}`, '#6C5CE7')}
      <p style="color:#555;font-size:13px;margin-top:20px;">From everyone at ${data.companyName} — thank you for everything. Good luck 🙏</p>
    `)
  }),
};

Object.assign(emailTemplates, additionalTeamsTemplates);

// ── DEMO REQUEST TEMPLATES ────────────────────────────────────────────────────
const demoTemplates = {
  demoRequest: (data) => ({
    subject: `🏢 New Demo Request — ${data.company_name}`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:18px;margin:0 0 16px;">New Thankeeu for Teams Demo Request</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
        ${[
          ['Company', data.company_name],
          ['Contact', data.contact_name],
          ['Email',   data.email],
          ['Phone',   data.phone || 'Not provided'],
          ['Team Size', data.team_size || 'Not specified'],
        ].map(([k,v]) => `<tr><td style="padding:8px 12px;background:#f9f9f9;font-weight:600;color:#555;border:1px solid #eee;width:110px;">${k}</td><td style="padding:8px 12px;border:1px solid #eee;color:#333;">${v}</td></tr>`).join('')}
      </table>
      ${data.message ? `<div style="background:#f5f5f5;border-radius:8px;padding:16px;border-left:4px solid #6C5CE7;margin-bottom:20px;"><p style="color:#333;font-size:13px;margin:0;line-height:1.7;">${data.message}</p></div>` : ''}
      ${btn('View in Admin Dashboard', `${FRONTEND_URL}/admin`)}
    `)
  }),

  demoConfirm: (data) => ({
    subject: `We received your demo request — Thankeeu for Teams`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Thank you, ${data.contact_name}! 🎉</h2>
      <p style="color:#555;line-height:1.8;">We've received your demo request for <strong>${data.company_name}</strong> and we're excited to show you Thankeeu for Teams!</p>
      <div style="background:#EEEDFE;border-radius:12px;padding:20px;margin:20px 0;">
        <p style="color:#534AB7;font-weight:600;margin:0 0 10px;font-size:15px;">What to expect:</p>
        <ul style="color:#534AB7;font-size:13px;margin:0;padding-left:18px;line-height:2.2;">
          <li>Our team will reach out within <strong>24 hours</strong></li>
          <li>30-minute personalised demo of the platform</li>
          <li>Custom setup walkthrough for your team size</li>
          <li>Free trial period to test with your data</li>
        </ul>
      </div>
      <p style="color:#555;font-size:13px;line-height:1.7;">In the meantime, feel free to explore the platform at <a href="${FRONTEND_URL}" style="color:#6C5CE7;">${FRONTEND_URL}</a>.</p>
      <p style="color:#aaa;font-size:12px;margin-top:16px;">Questions? Reply to this email or contact us at <a href="mailto:support@thankeeu.com" style="color:#6C5CE7;">support@thankeeu.com</a></p>
    `)
  }),
};
Object.assign(emailTemplates, demoTemplates);

// ── NEW FEATURE TEMPLATES ──────────────────────────────────────────────────
const newFeatureTemplates = {

  reminder: ({ userName, recipientName, occasion, occasionDate, daysUntil, createLink }) => ({
    subject: `${recipientName}'s ${occasion} is in ${daysUntil} days`,
    html: wrap(`
      <p style="color:#333;font-size:15px;line-height:1.8;">Hi ${userName},</p>
      <p style="color:#333;font-size:15px;line-height:1.8;margin:12px 0 20px;"><strong>${recipientName}'s ${occasion}</strong> is on <strong>${occasionDate}</strong> — ${daysUntil} day${daysUntil === 1 ? '' : 's'} away. You can create a group card and start collecting messages now.</p>
      ${btn('Create a card →', createLink)}
      <p style="color:#999;font-size:11px;margin-top:16px;">You set this reminder on Thankeeu. <a href="${FRONTEND_URL}/dashboard" style="color:#6C5CE7;">Manage reminders</a></p>
    `)
  }),

  cardOpened: ({ name, cardTitle, cardSlug, appUrl }) => ({
    subject: `${name}, your card "${cardTitle}" was just opened`,
    html: wrap(`
      <p style="color:#333;font-size:15px;line-height:1.8;">Hi ${name},</p>
      <p style="color:#333;font-size:15px;line-height:1.8;margin:12px 0 20px;">The recipient just opened your card <strong>"${cardTitle}"</strong>.</p>
      ${btn('View card →', `${appUrl}/card/${cardSlug}`)}
    `)
  }),

  cardScheduled: ({ name, cardTitle, sendDate, cardSlug, appUrl }) => ({
    subject: `Your card "${cardTitle}" is scheduled for ${sendDate}`,
    html: wrap(`
      <p style="color:#333;font-size:15px;line-height:1.8;">Hi ${name},</p>
      <p style="color:#333;font-size:15px;line-height:1.8;margin:12px 0 20px;">Your card <strong>"${cardTitle}"</strong> is scheduled for delivery on <strong>${sendDate}</strong>. Share the link to collect more messages before then.</p>
      ${btn('View & share →', `${appUrl}/card/${cardSlug}`)}
    `)
  }),

  cardSent: ({ name, cardTitle, recipientName, cardSlug, appUrl }) => ({
    subject: `Your card for ${recipientName} has been delivered`,
    html: wrap(`
      <p style="color:#333;font-size:15px;line-height:1.8;">Hi ${name},</p>
      <p style="color:#333;font-size:15px;line-height:1.8;margin:12px 0 20px;">Your card <strong>"${cardTitle}"</strong> has been delivered to <strong>${recipientName}</strong>. You'll be notified when they open it.</p>
      ${btn('View card →', `${appUrl}/card/${cardSlug}`)}
    `)
  }),

  pendingToSign: ({ signerName, creatorName, recipientName, occasion, cardSlug, appUrl }) => ({
    subject: `${creatorName} invited you to sign ${recipientName}'s ${occasion} card`,
    html: wrap(`
      <p style="color:#333;font-size:15px;line-height:1.8;">Hi ${signerName},</p>
      <p style="color:#333;font-size:15px;line-height:1.8;margin:12px 0 20px;"><strong>${creatorName}</strong> invited you to leave a message on <strong>${recipientName}'s ${occasion} card</strong>.</p>
      ${btn('Sign the card →', `${appUrl}/sign/${cardSlug}`)}
    `)
  }),

};
Object.assign(emailTemplates, newFeatureTemplates);

// ── EMAIL VERIFICATION TEMPLATES ──────────────────────────────────────────
const verificationTemplates = {
  emailVerification: ({ name, verifyLink }) => ({
    subject: '✉️ Verify your Thankeeu account',
    html: wrap(`
      <h2 style="color:#5B4BDF;font-size:22px;margin-bottom:8px;">Verify your email ✉️</h2>
      <p>Hey ${name},</p>
      <p>Thanks for joining Thankeeu! Click the button below to verify your email address and unlock full access.</p>
      <p style="margin-top:8px;color:#aaa;font-size:13px;">This link expires in 24 hours.</p>
      ${btn('Verify my email →', verifyLink)}
      <p style="color:#aaa;font-size:12px;margin-top:16px;">If you didn't create a Thankeeu account, you can safely ignore this email.</p>
    `)
  }),
  emailVerified: ({ name }) => ({
    subject: '🎉 Email verified — welcome to Thankeeu!',
    html: wrap(`
      <h2 style="color:#5B4BDF;font-size:22px;margin-bottom:8px;">You're all verified! 🎉</h2>
      <p>Hey ${name}, your email is confirmed and your Thankeeu account is fully active.</p>
      ${btn('Go to your dashboard', `${FRONTEND_URL}/dashboard`)}
    `)
  }),
};
Object.assign(emailTemplates, verificationTemplates);

// Visitor nurture (guests who signed a card without an account)
Object.assign(emailTemplates, {
  visitorNudge: (d) => ({
    subject: `${d.name}, you signed ${d.creatorName}'s ${d.occasion} card on Thankeeu`,
    html: BASE(`
      <p style="color:#333;font-size:15px;line-height:1.8;">Hi ${d.name},</p>
      <p style="color:#333;font-size:15px;line-height:1.8;margin:12px 0 20px;">
        You recently signed ${d.creatorName}'s ${d.occasion} card on Thankeeu.
        If you create a free account, you'll receive your own group cards — with messages, photos, voice notes and cash gifts — all saved in one place when your colleagues celebrate you.
      </p>
      ${btn('Create a free account →', d.signupLink, '#6C5CE7')}
      ${d.cardLink ? `<p style="color:#999;font-size:12px;margin-top:12px;"><a href="${d.cardLink}" style="color:#6C5CE7;">View the card you signed</a></p>` : ''}
      <p style="color:#ccc;font-size:11px;margin-top:20px;">You received this because you signed a card on Thankeeu. This is a one-time message.</p>
    `)
  }),
});

Object.assign(emailTemplates, {
  teamMemberInvite: (d) => ({
    subject: `You've been added to ${d.companyName} on Thankeeu — set up your account`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Welcome, ${d.name}! 🎉</h2>
      <p style="color:#555;line-height:1.8;">Your HR team at <strong>${d.companyName}</strong> has added you to Thankeeu — the platform where your team celebrates milestones together!</p>
      <p style="color:#555;line-height:1.8;">With Thankeeu, your colleagues can create beautiful group cards, pool gifts, and celebrate every birthday, promotion, and anniversary.</p>
      <div style="background:#EEEDFE;border-radius:12px;padding:16px 20px;margin:20px 0;">
        <p style="color:#534AB7;font-weight:700;margin:0 0 6px;">Getting started:</p>
        <ol style="color:#534AB7;font-size:13px;margin:0;padding-left:18px;line-height:2;">
          <li>Click the button below to set up your account</li>
          <li>Use company code: <strong>${d.companyCode}</strong></li>
          <li>Set your password and complete your profile</li>
        </ol>
      </div>
      ${btn('Set up my account →', d.inviteLink, '#E84393')}
      <p style="color:#aaa;font-size:12px;margin-top:16px;">Or visit: <a href="${d.appUrl}/member/signup?company=${d.companyCode}" style="color:#6C5CE7;">${d.appUrl}/member/signup</a></p>
    `)
  }),
  coreTeamInvite: (d) => ({
    subject: `You've been invited to manage ${d.companyName}'s Thankeeu account`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Welcome to the core team, ${d.name}! 👥</h2>
      <p style="color:#555;line-height:1.8;">${d.hrName} has invited you as <strong>${d.roleLabel}</strong> with <strong>${d.privilege} access</strong> to help manage ${d.companyName}'s celebration platform.</p>
      <div style="background:#EEEDFE;border-radius:12px;padding:16px 20px;margin:20px 0;">
        <p style="color:#534AB7;font-weight:600;margin:0 0 6px;">Access level: ${d.privilege.toUpperCase()}</p>
        <p style="color:#534AB7;font-size:13px;margin:0;">${
          d.privilege==='full' ? 'Full access — manage all settings, billing, members, occasions.' :
          d.privilege==='medium' ? 'Medium access — manage occasions and team members.' :
          'Limited access — view-only access to occasions and events.'
        }</p>
      </div>
      ${btn('Accept invitation & set up account', d.inviteLink, '#6C5CE7')}
      <p style="color:#aaa;font-size:12px;margin-top:16px;">Sent by ${d.hrName} at ${d.companyName}.</p>
    `)
  }),
});

Object.assign(emailTemplates, {
  birthdayReminder7Days: (d) => ({
    subject: `🎂 ${d.name}, your birthday is in ${d.daysLeft} days — capture every wish!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Hey ${d.name}! Your birthday is almost here 🎂</h2>
      <p style="color:#555;line-height:1.8;">In just <strong>${d.daysLeft} days</strong> it's your big day! Instead of having birthday wishes scattered across DMs, WhatsApp, and Instagram — collect them all in one beautiful place.</p>
      <div style="background:#EEEDFE;border-radius:12px;padding:16px 20px;margin:20px 0;">
        <p style="color:#534AB7;font-weight:700;margin:0 0 8px;">Create your birthday card on Thankeeu and get:</p>
        <ul style="color:#534AB7;font-size:13px;margin:0;padding-left:18px;line-height:2.2;">
          <li>💌 Heartfelt messages from everyone who cares</li>
          <li>📸 Photos, voice notes, and GIFs from your people</li>
          <li>🎁 A pooled cash gift from everyone together</li>
          <li>♾️ A keepsake you'll treasure forever</li>
        </ul>
      </div>
      ${d.creditBalance > 0
        ? `<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:14px 20px;margin:16px 0;display:flex;align-items:center;gap:12px;">
            <span style="font-size:22px;">🎟️</span>
            <div>
              <p style="color:#166534;font-weight:700;margin:0 0 2px;font-size:14px;">You have ${d.creditBalance} card credit${d.creditBalance !== 1 ? 's' : ''} ready to use!</p>
              <p style="color:#16a34a;font-size:12px;margin:0;">No payment needed — just create your card and it's activated instantly.</p>
            </div>
          </div>`
        : `<div style="background:#faf5ff;border:1.5px solid #ddd6fe;border-radius:12px;padding:14px 20px;margin:16px 0;">
            <p style="color:#6d28d9;font-weight:700;margin:0 0 2px;font-size:14px;">💳 No credits yet? No problem.</p>
            <p style="color:#7c3aed;font-size:12px;margin:0;">A card credit is just ₦5,000 — activate your birthday card in seconds.</p>
          </div>`
      }
      ${btn('Create my birthday card →', d.createCardUrl, '#E84393')}
    `)
  }),
  birthdayReminder2Days: (d) => ({
    subject: `⏰ ${d.name}, ${d.daysLeft} days left — set up your birthday card now!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Don't miss your chance, ${d.name}! 🎂</h2>
      <p style="color:#555;line-height:1.8;">Your birthday is in just <strong>${d.daysLeft} days</strong>! There's still time to set up your Thankeeu birthday card so your friends, family, and colleagues can leave you messages, photos, and gifts all in one place.</p>
      <p style="color:#555;line-height:1.8;">Takes less than 2 minutes to set up.</p>
      ${d.creditBalance > 0
        ? `<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:14px 20px;margin:16px 0;">
            <p style="color:#166534;font-weight:700;margin:0 0 2px;font-size:14px;">🎟️ You have ${d.creditBalance} card credit${d.creditBalance !== 1 ? 's' : ''} ready — use it now!</p>
            <p style="color:#16a34a;font-size:12px;margin:0;">Your card will be activated instantly with no payment needed. Don't let it go to waste!</p>
          </div>`
        : `<div style="background:#faf5ff;border:1.5px solid #ddd6fe;border-radius:12px;padding:14px 20px;margin:16px 0;">
            <p style="color:#6d28d9;font-weight:700;margin:0 0 2px;font-size:14px;">💳 Activate for just ₦5,000</p>
            <p style="color:#7c3aed;font-size:12px;margin:0;">One card credit is all you need. Pay instantly and your birthday card goes live.</p>
          </div>`
      }
      ${btn('Set up my birthday card now →', d.createCardUrl, '#E84393')}
    `)
  }),
});

Object.assign(emailTemplates, {
  blogSubscribeConfirm: (d) => ({
    subject: 'Confirm your Thankeeu newsletter subscription',
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Hey ${d.name}! One more step 📬</h2>
      <p style="color:#555;line-height:1.8;">Thanks for subscribing to the Thankeeu blog — HR tips, workplace celebration ideas, and product updates, delivered weekly.</p>
      <p style="color:#555;line-height:1.8;">Click the button below to confirm your subscription:</p>
      <div style="text-align:center;margin:20px 0;">
        ${btn('✓ Confirm my subscription', d.confirmUrl, '#7C3AED')}
      </div>
      <p style="color:#aaa;font-size:12px;margin:12px 0 4px;">Button not working? Copy and paste this link into your browser:</p>
      <p style="margin:0;word-break:break-all;"><a href="${d.confirmUrl}" style="color:#7C3AED;font-size:12px;">${d.confirmUrl}</a></p>
      <p style="color:#aaa;font-size:12px;margin-top:16px;">If you didn't subscribe, ignore this email. <a href="${d.unsubscribeUrl}" style="color:#aaa;">Unsubscribe</a></p>
    `)
  }),
  newBlogPost: (d) => ({
    subject: `📖 New on Thankeeu Blog: ${d.postTitle}`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Hey ${d.name}! New article just published 📖</h2>
      ${d.coverImage ? `<img src="${d.coverImage}" alt="Cover" style="width:100%;border-radius:12px;margin:0 0 20px;max-height:280px;object-fit:cover;" />` : ''}
      <h3 style="color:#1a1a2e;font-size:18px;font-weight:700;margin:0 0 8px;">${d.postTitle}</h3>
      ${d.postExcerpt ? `<p style="color:#555;line-height:1.8;margin:0 0 20px;">${d.postExcerpt}</p>` : ''}
      ${btn('Read the full article →', d.postUrl, '#7C3AED')}
      <p style="color:#aaa;font-size:12px;margin-top:20px;">You're receiving this because you subscribed to the Thankeeu blog. <a href="${d.unsubscribeUrl}" style="color:#aaa;">Unsubscribe</a></p>
    `)
  }),
});

// ── Missing templates added by audit ──────────────────────────────────────────
Object.assign(emailTemplates, {
  emailVerification: (d) => ({
    subject: 'Verify your Thankeeu email address',
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Hey ${d.name}, verify your email 📧</h2>
      <p style="color:#555;line-height:1.8;">Click the button below to verify your email address and activate your account.</p>
      ${btn('Verify my email →', d.verifyLink, '#7C3AED')}
      <p style="color:#aaa;font-size:12px;margin-top:16px;">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
    `)
  }),
  emailVerified: (d) => ({
    subject: '✅ Email verified — welcome to Thankeeu!',
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">You're all set, ${d.name}! 🎉</h2>
      <p style="color:#555;line-height:1.8;">Your email has been verified. You can now fully use Thankeeu to send group cards and collect gifts.</p>
      ${btn('Go to your dashboard →', `${FRONTEND_URL}/dashboard`, '#7C3AED')}
    `)
  }),
  cardApprovalRequest: (d) => ({
    subject: `Card approval needed — ${d.cardTitle}`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">A card needs your approval 👀</h2>
      <p style="color:#555;line-height:1.8;">A card titled <strong>${d.cardTitle}</strong> for <strong>${d.recipientName}</strong> has been submitted and requires HR approval before it can be shared with the team.</p>
      ${btn('Review and approve →', d.approvalLink, '#7C3AED')}
    `)
  }),
  cardOpened: (d) => ({
    subject: `${d.cardTitle} was opened by the recipient 🎉`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Your card was opened! 🎊</h2>
      <p style="color:#555;line-height:1.8;">Great news, ${d.name}! The card <strong>"${d.cardTitle}"</strong> was just opened by the recipient.</p>
      ${btn('View the card →', `${FRONTEND_URL}/card/${d.cardSlug}`, '#7C3AED')}
    `)
  }),
  systemReminder: (d) => ({
    subject: `Reminder: ${d.title}`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Reminder from Thankeeu ⏰</h2>
      <p style="color:#555;line-height:1.8;">This is a reminder for: <strong>${d.title}</strong></p>
      ${d.message ? `<p style="color:#555;line-height:1.8;">${d.message}</p>` : ''}
      ${d.link ? btn('View details →', d.link, '#7C3AED') : ''}
    `)
  }),
});

Object.assign(emailTemplates, {
  vendorWelcome: (d) => ({
    subject: `Welcome to Thankeeu Marketplace, ${d.name}!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Welcome, ${d.name}! 🎉</h2>
      <p style="color:#555;line-height:1.8;">Your Thankeeu marketplace store has been created. Please verify your email to get started, then our team will review your store within 24 hours.</p>
      ${btn('Verify email & activate store', d.verifyUrl, '#7C3AED')}
      <p style="color:#aaa;font-size:12px;margin-top:16px;">Your store URL: <a href="${d.appUrl}/c/${d.slug}">${d.appUrl}/c/${d.slug}</a></p>
    `)
  }),
  vendorApproved: (d) => ({
    subject: '🎊 Your Thankeeu store is approved and live!',
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Congratulations, ${d.name}!</h2>
      <p style="color:#555;line-height:1.8;">Your store has been approved and is now live on the Thankeeu marketplace. Start adding products and receiving orders!</p>
      ${btn('Go to your dashboard →', d.dashUrl, '#7C3AED')}
    `)
  }),
  giftCardDelivered: (d) => ({
    subject: `🎁 Your ${d.productName} gift card is ready!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Your gift card has arrived! 🎉</h2>
      <p style="color:#555;line-height:1.7;">Hi ${d.name || 'there'}, you claimed your gift pot of <strong>${d.amountLabel}</strong> as a <strong>${d.productName}</strong> gift card.</p>

      <div style="background:#F8F7FF;border:2px dashed #C4B5FD;border-radius:12px;padding:18px;margin:20px 0;text-align:center;">
        <p style="color:#888;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;">Your redemption code</p>
        <p style="color:#1a1a1a;font-size:22px;font-weight:800;letter-spacing:.05em;margin:0;font-family:monospace;">${d.redemptionCode}</p>
      </div>

      <p style="color:#555;font-size:13px;line-height:1.7;">Keep this code safe — treat it like cash. ${d.redeemInstructions || "You can redeem it on the retailer's website or app at checkout."}</p>
      ${d.redeemUrl ? btn('Redeem your gift card', d.redeemUrl, '#7C3AED') : ''}

      <p style="color:#aaa;font-size:12px;margin-top:20px;">Order reference: ${d.orderRef || 'N/A'}</p>
    `)
  }),
  orderConfirm: (d) => ({
    subject: `Order confirmed — #${d.orderId} from ${d.storeName}`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Order confirmed! 📦</h2>
      <p style="color:#555;">Hi ${d.name}, your order <strong>#${d.orderId}</strong> from <strong>${d.storeName}</strong> has been placed.</p>
      <p style="color:#555;margin:8px 0;"><strong>Total: ${d.total}</strong></p>
      ${btn('View store', d.storeUrl, '#7C3AED')}
    `)
  }),
  orderStatusUpdate: (d) => ({
    subject: `Your order is ${d.status} — #${d.orderId}`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Order update 📬</h2>
      <p style="color:#555;">Hi ${d.name}, your order <strong>#${d.orderId}</strong> is now <strong>${d.status}</strong>.</p>
      ${d.tracking ? `<p style="color:#555;">Tracking: <strong>${d.tracking}</strong></p>` : ''}
      ${btn('Track your order', d.storeUrl, '#7C3AED')}
    `)
  }),
  vendorOrderNotification: (d) => ({
    subject: `🎁 New order #${d.orderId} — deliver by ${d.deadlineLabel}`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">New order to fulfil! 🎉</h2>
      <p style="color:#555;line-height:1.8;">Hi ${d.vendorName}, you've received a new gift order via Thankeeu${d.recipientName ? ` for <strong>${d.recipientName}</strong>'s ${d.occasionLabel || 'celebration'}` : ''}.</p>

      <div style="background:#FEF3F2;border:1px solid #FECDD3;border-radius:12px;padding:14px 16px;margin:16px 0;">
        <p style="color:#9F1239;font-weight:700;font-size:14px;margin:0 0 4px;">⏰ Deliver by: ${d.deadlineLabel}</p>
        <p style="color:#9F1239;font-size:12px;margin:0;">This is the date of the recipient's celebration — please ensure delivery is arranged before then.</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:6px 0;color:#888;font-size:13px;">Order ID</td><td style="padding:6px 0;color:#1a1a1a;font-size:13px;font-weight:600;text-align:right;">#${d.orderId}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:13px;">Items</td><td style="padding:6px 0;color:#1a1a1a;font-size:13px;text-align:right;">${(d.items||[]).map(i=>`${i.quantity}× ${i.product_name}`).join('<br/>')}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:13px;">Order total</td><td style="padding:6px 0;color:#1a1a1a;font-size:13px;font-weight:600;text-align:right;">${d.total}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:13px;">Your payout (after ₦5,000 Thankeeu fee)</td><td style="padding:6px 0;color:#16A34A;font-size:13px;font-weight:700;text-align:right;">${d.vendorPayout}</td></tr>
      </table>

      <div style="background:#F8F7FF;border-radius:12px;padding:14px 16px;margin:16px 0;">
        <p style="color:#1a1a1a;font-weight:700;font-size:14px;margin:0 0 8px;">Recipient details</p>
        <p style="color:#555;font-size:13px;margin:2px 0;">Name: ${d.recipientName || 'Not provided'}</p>
        <p style="color:#555;font-size:13px;margin:2px 0;">Email: ${d.recipientEmail || 'Not provided'}</p>
      </div>

      <div style="background:#F8F7FF;border-radius:12px;padding:14px 16px;margin:16px 0;">
        <p style="color:#1a1a1a;font-weight:700;font-size:14px;margin:0 0 8px;">Signer details</p>
        <p style="color:#555;font-size:13px;margin:2px 0;">Name: ${d.signerName || d.customerName}</p>
        <p style="color:#555;font-size:13px;margin:2px 0;">Email: ${d.signerEmail || d.customerEmail}</p>
        ${d.customerPhone ? `<p style="color:#555;font-size:13px;margin:2px 0;">Phone: ${d.customerPhone}</p>` : ''}
        <p style="color:#555;font-size:13px;margin:2px 0;">Delivery address: ${d.deliveryAddress}</p>
      </div>

      ${btn('View order in dashboard →', d.ordersUrl, '#EC4899')}
    `)
  }),

  // ── Thankeeu Pals ──────────────────────────────────────────────────────
  palApplicationReceived: (d) => ({
    subject: `New Thankeeu Pals application — ${d.groupName}`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">New Pals group application 👥</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:12px 0;">
        <tr><td style="padding:6px 0;color:#888;font-size:13px;">Group name</td><td style="padding:6px 0;color:#1a1a1a;font-size:13px;font-weight:600;text-align:right;">${d.groupName}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:13px;">Username</td><td style="padding:6px 0;color:#1a1a1a;font-size:13px;font-weight:600;text-align:right;">@${d.groupUsername}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:13px;">Email</td><td style="padding:6px 0;color:#1a1a1a;font-size:13px;text-align:right;">${d.email}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:13px;">Group size</td><td style="padding:6px 0;color:#1a1a1a;font-size:13px;text-align:right;">${d.size}</td></tr>
      </table>
      ${d.description ? `<p style="color:#555;font-size:13px;">"${d.description}"</p>` : ''}
      ${btn('Review in admin dashboard →', d.adminUrl, '#7C3AED')}
    `)
  }),
  palApproved: (d) => ({
    subject: `🎉 Your Thankeeu Pals group "${d.groupName}" is approved!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Congratulations! 🎉</h2>
      <p style="color:#555;line-height:1.8;">Your Thankeeu Pals group <strong>${d.groupName}</strong> (@${d.groupUsername}) has been approved!</p>
      <p style="color:#555;line-height:1.8;">Click the button below to verify your email and unlock your group dashboard, where you can invite up to 15 friends, family, or teammates to celebrate life's moments together.</p>
      ${btn('Verify email & get started →', d.verifyUrl, '#7C3AED')}
      <p style="color:#aaa;font-size:12px;margin-top:20px;">After verifying, log in at thankeeu.com/pals/login with your group username <strong>@${d.groupUsername}</strong> and your password.</p>
    `)
  }),
  palRejected: (d) => ({
    subject: `Update on your Thankeeu Pals application`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">About your Pals application</h2>
      <p style="color:#555;line-height:1.8;">Thanks for applying to create the Thankeeu Pals group <strong>${d.groupName}</strong>. Unfortunately, we're unable to approve it at this time.</p>
      <div style="background:#FEF3F2;border:1px solid #FECDD3;border-radius:12px;padding:14px 16px;margin:16px 0;">
        <p style="color:#9F1239;font-weight:700;font-size:13px;margin:0 0 4px;">Reason:</p>
        <p style="color:#9F1239;font-size:13px;margin:0;">${d.reason}</p>
      </div>
      <p style="color:#555;font-size:13px;">You're welcome to apply again once the above is addressed.</p>
    `)
  }),
  palMemberInvite: (d) => ({
    subject: `${d.name}, you're invited to join "${d.groupName}" on Thankeeu! 🎉`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">You're invited! 🎉</h2>
      <p style="color:#555;line-height:1.8;">Hi ${d.name}, you've been added to <strong>${d.groupName}</strong> on Thankeeu Pals — a shared space for your group to celebrate birthdays, send group gift cards, and never miss a special moment together.</p>
      <div style="background:#F8F7FF;border-radius:12px;padding:14px 16px;margin:16px 0;">
        <p style="color:#1a1a1a;font-weight:700;font-size:14px;margin:0 0 8px;">How it works:</p>
        <p style="color:#555;font-size:13px;margin:4px 0;">• Click the button below to set your own password</p>
        <p style="color:#555;font-size:13px;margin:4px 0;">• You'll then access the shared "${d.groupName}" dashboard using @${d.groupUsername} + your password</p>
        <p style="color:#555;font-size:13px;margin:4px 0;">• When it's someone's birthday or special day, Thankeeu automatically creates a group card and emails everyone a link to sign it and contribute to a gift</p>
        <p style="color:#555;font-size:13px;margin:4px 0;">• Complete your profile (with bank details) so the group can celebrate YOU too — gifts are sent automatically on your special day</p>
      </div>
      ${btn('Set my password & join →', d.joinUrl, '#7C3AED')}
      <p style="color:#aaa;font-size:12px;margin-top:20px;">If you weren't expecting this, you can safely ignore this email.</p>
    `)
  }),
  palProfileReminder: (d) => ({
    subject: `${d.name}, complete your Thankeeu Pals profile`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Don't miss your celebration! 🎂</h2>
      <p style="color:#555;line-height:1.8;">Hi ${d.name}, your <strong>${d.groupName}</strong> group hasn't finished setting up your profile yet.</p>
      <p style="color:#555;line-height:1.8;">It's important to add your <strong>bank account details and photo</strong> so that when it's your special day, the group's gift can be credited to you automatically and on time.</p>
      ${btn('Complete my profile →', d.profileUrl, '#EC4899')}
      <p style="color:#aaa;font-size:12px;margin-top:20px;">This is reminder ${d.reminderNumber} of 2.</p>
    `)
  }),
  palEventReminder: (d) => ({
    subject: `${d.daysLeft === 0 ? 'Today' : `${d.daysLeft} day${d.daysLeft===1?'':'s'} left`}: Sign ${d.recipientName}'s ${d.occasionLabel} card! 🎁`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">${d.daysLeft === 0 ? "It's the big day! 🎉" : `${d.daysLeft} day${d.daysLeft===1?'':'s'} to go! ⏰`}</h2>
      <p style="color:#555;line-height:1.8;">${d.recipientName}'s ${d.occasionLabel} ${d.daysLeft === 0 ? 'is today' : `is coming up in ${d.daysLeft} day${d.daysLeft===1?'':'s'}`}! Add your message and chip in to the group gift before it's sent.</p>
      ${btn('Sign the card →', d.signUrl, '#7C3AED')}
      <p style="color:#aaa;font-size:12px;margin-top:20px;">This link works only for members of ${d.groupName}.</p>
    `)
  }),
  palSupportReply: (d) => ({
    subject: `Re: ${d.subject} — Thankeeu Pals Support`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Reply from Thankeeu support 💬</h2>
      <p style="color:#555;">Hi ${d.groupName}, regarding your message "<strong>${d.subject}</strong>":</p>
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:14px 16px;margin:16px 0;">
        <p style="color:#166534;font-size:13px;margin:0;">${d.reply}</p>
      </div>
    `)
  }),
});
