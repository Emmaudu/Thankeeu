const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Currency helper: all stored and displayed amounts are Nigerian naira.
const fmtNGN = (ngnAmount) => {
  if (!ngnAmount) return '₦0';
  return `₦${Number(ngnAmount).toLocaleString('en-NG')}`;
};

const BASE = (content) => `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
  <div style="background:linear-gradient(135deg,#6C5CE7,#9F77DD);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:600;">Thankeeu 💜</h1>
    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Group cards & gifts for every occasion</p>
  </div>
  <div style="padding:32px 36px;">${content}</div>
  <div style="background:#f9f9f9;padding:20px 36px;text-align:center;border-top:1px solid #f0f0f0;">
    <p style="color:#aaa;font-size:12px;margin:0;">Sent with 💜 by <strong style="color:#6C5CE7;">Thankeeu</strong> · Worldwide 🌍</p>
  </div>
</div>`;

// Alias — many templates use wrap() instead of BASE()
const wrap = BASE;

const btn = (text, url, color = '#6C5CE7') =>
  `<a href="${url}" style="display:inline-block;background:${color};color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:20px;">${text}</a>`;

const emailTemplates = {

  welcome: (data) => ({
    subject: `Welcome to Thankeeu, ${data.name}!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Welcome aboard, ${data.name}!</h2>
      <p style="color:#555;line-height:1.7;">You are now part of a community that celebrates the people who matter most. Create beautiful group cards, collect heartfelt messages, and send meaningful gifts.</p>
      ${btn('Go to your dashboard', `${FRONTEND_URL}/dashboard`)}
    `)
  }),

  cardInvite: (data) => ({
    subject: `${data.creatorName} wants you to sign ${data.recipientName}'s card!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">You have been invited to sign a card!</h2>
      <p style="color:#555;line-height:1.7;"><strong>${data.creatorName}</strong> is putting together a special group card for <strong>${data.recipientName}</strong>'s ${data.occasion}.</p>
      ${data.giftEnabled ? `<div style="background:#EAF3DE;border-radius:8px;padding:14px 16px;margin:16px 0;"><p style="color:#3B6D11;margin:0;font-size:13px;">🎁 A gift pot is open — chip in from ₦2,500</p></div>` : ''}
      <p style="color:#555;font-size:13px;">Closes on ${data.deadline}</p>
      ${btn('Sign the card now', `${FRONTEND_URL}/sign/${data.cardSlug}`, '#E84393')}
    `)
  }),

  cardDelivery: (data) => ({
    subject: `🎉 Happy ${data.occasion}, ${data.recipientName}! ${data.senderCount} people made something special for you`,
    html: BASE(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:48px;margin-bottom:8px;">${data.occasionEmoji || '🎉'}</div>
        <h1 style="color:#1a1a1a;font-size:26px;margin:0 0 6px;font-weight:700;">Happy ${data.occasion}, ${data.recipientName}!</h1>
        <p style="color:#7C6EFF;font-size:15px;font-weight:600;margin:0;">You have something very special waiting for you</p>
      </div>

      <p style="color:#555;line-height:1.8;font-size:15px;"><strong>${data.senderCount} people</strong> who care about you came together to create a beautiful group card just for you. They've left you heartfelt messages, warm wishes, and memories you'll want to keep forever.</p>

      ${data.giftAmount ? `
      <div style="background:linear-gradient(135deg,#e8f5e9,#f1f8e9);border:2px solid #4CAF50;border-radius:12px;padding:18px 20px;margin:20px 0;text-align:center;">
        <div style="font-size:32px;margin-bottom:8px;">🎁</div>
        <p style="color:#2E7D32;font-weight:700;font-size:18px;margin:0 0 4px;">Gift pot: <span style="color:#1B5E20;">${fmtNGN(data.giftAmount)}</span></p>
        <p style="color:#388E3C;font-size:13px;margin:0;">Your friends and colleagues pooled this gift for you!</p>
      </div>` : ''}

      ${btn('🎉 Open my card now', `${FRONTEND_URL}/card/${data.cardSlug}?token=${data.accessToken}`, '#7C6EFF')}

      <div style="background:#FFF8E1;border:1px solid #FFD54F;border-radius:12px;padding:18px 20px;margin:24px 0;">
        <p style="color:#F57F17;font-weight:700;font-size:14px;margin:0 0 10px;">📋 How to access your card & gift:</p>
        <ol style="color:#555;line-height:2;margin:0;padding-left:20px;font-size:14px;">
          <li><strong>Sign up or sign in</strong> at <a href="${FRONTEND_URL}/signup" style="color:#7C6EFF;">thankeeu.com</a> using <strong>this exact email address</strong> (${data.recipientEmail || 'the email you received this on'})</li>
          <li><strong>Set your username</strong> in your dashboard settings — your friends can transfer cards to you by username</li>
          <li>Your card will appear in your <strong>Received tab</strong> in your dashboard automatically</li>
          ${data.giftAmount ? '<li>Add your <strong>bank account</strong> in settings to withdraw your gift pot 💰</li>' : ''}
        </ol>
      </div>

      <p style="color:#888;font-size:13px;line-height:1.7;"><strong>⚠️ Important:</strong> Please sign up with <strong>${data.recipientEmail || 'this email address'}</strong> to automatically access your card and gift pot. If you use a different email, ask the card creator to transfer the card to your username.</p>

      <p style="color:#555;line-height:1.7;margin-top:16px;">If you already have a Thankeeu account, simply <a href="${FRONTEND_URL}/login" style="color:#7C6EFF;">sign in here</a> and check your Received tab.</p>
    `)
  }),

  cardReminder: (data) => ({
    subject: `Reminder: Sign ${data.recipientName}'s card before it closes!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Card closing in ${data.hoursLeft} hours!</h2>
      <p style="color:#555;line-height:1.7;">Do not miss your chance to add a message to <strong>${data.recipientName}</strong>'s card.</p>
      ${btn('Sign now', `${FRONTEND_URL}/sign/${data.cardSlug}`, '#E84393')}
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
    subject: `${data.celebrantName}'s birthday is in 2 days — sign their card!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Your colleague's birthday is almost here!</h2>
      <p style="color:#555;line-height:1.8;"><strong>${data.celebrantName}</strong> from the <strong>${data.department}</strong> team celebrates their birthday on <strong>${data.birthdayDate}</strong>. ${data.companyName} is putting together a group card — add your message!</p>
      ${data.giftEnabled ? `<div style="background:#EAF3DE;border-radius:8px;padding:14px 16px;margin:16px 0;"><p style="color:#3B6D11;margin:0;font-size:13px;">🎁 A gift pot is open — contribute any amount via Flutterwave</p></div>` : ''}
      <div style="background:#fff8e1;border-radius:8px;padding:14px 16px;margin:16px 0;border-left:4px solid #f0c040;">
        <p style="color:#7a5f00;font-size:13px;margin:0;">Please keep this a surprise — do not mention the card to ${data.celebrantFirstName} before their birthday!</p>
      </div>
      ${btn(`Sign ${data.celebrantFirstName}'s card`, `${FRONTEND_URL}/sign/${data.cardSlug}`, '#E84393')}
      <p style="color:#aaa;font-size:12px;margin-top:16px;">Signing closes on ${data.deadline}</p>
    `)
  }),

  birthdayCelebrant: (data) => ({
    subject: `Happy Birthday ${data.firstName}! You have a surprise from ${data.companyName}!`,
    html: BASE(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:56px;line-height:1;margin-bottom:12px;">🎂🎉🎊</div>
        <h2 style="color:#6C5CE7;font-size:26px;margin:0 0 8px;font-weight:700;">Happy Birthday, ${data.firstName}!</h2>
      </div>
      <p style="color:#555;line-height:1.8;font-size:14px;">Your colleagues at <strong>${data.companyName}</strong> came together to create something special. <strong>${data.signerCount} people</strong> signed your card and left you heartfelt messages!${data.giftAmount ? ` They also pooled a gift of <strong style="color:#3B6D11;">${fmtNGN(data.giftAmount)}</strong> just for you!` : ''}</p>
      <div style="background:linear-gradient(135deg,#FBEAF0,#EEEDFE);border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
        <p style="color:#534AB7;font-weight:600;margin:0 0 6px;font-size:15px;">Your birthday card is waiting!</p>
        <p style="color:#6C5CE7;font-size:13px;margin:0;">Click to see all the lovely messages from your team</p>
      </div>
      ${btn('Open my birthday card', `${FRONTEND_URL}/card/${data.cardSlug}?token=${data.accessToken}`, '#E84393')}
      <p style="color:#555;font-size:13px;margin-top:20px;line-height:1.7;">From everyone at <strong>${data.companyName}</strong> — we hope today is as amazing as you are!</p>
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
    subject: `${data.icon} ${data.memberName}'s ${data.occasionLabel} is in ${data.daysLeft} days — sign their card!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">${data.icon} Celebrate ${data.memberName}!</h2>
      <p style="color:#555;line-height:1.8;"><strong>${data.memberName}</strong> from <strong>${data.department}</strong> has an upcoming <strong>${data.occasionLabel}</strong> on <strong>${data.occasionDate}</strong>. ${data.companyName} is putting together a special group card!</p>
      ${data.giftEnabled ? `<div style="background:#EAF3DE;border-radius:8px;padding:14px;margin:16px 0;"><p style="color:#3B6D11;font-size:13px;margin:0;">🎁 A gift pot is open — contribute any amount via Flutterwave</p></div>` : ''}
      <div style="background:#fff8e1;border-radius:8px;padding:14px;margin:16px 0;border-left:4px solid #f0c040;">
        <p style="color:#7a5f00;font-size:13px;margin:0;">Keep this a surprise — please do not mention the card to ${data.memberFirstName}!</p>
      </div>
      ${btn(`Sign ${data.memberFirstName}'s card`, `${FRONTEND_URL}/sign/${data.cardSlug}`, '#E84393')}
      <p style="color:#aaa;font-size:12px;margin-top:16px;">Signing closes on ${data.deadline}. You do not need an account to sign.</p>
    `)
  }),

  occasionCelebrant: (data) => ({
    subject: `${data.icon} Happy ${data.occasionLabel}, ${data.firstName}! You have a surprise from ${data.companyName}!`,
    html: BASE(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:56px;line-height:1;margin-bottom:12px;">${data.icon}🎉🎊</div>
        <h2 style="color:#6C5CE7;font-size:26px;margin:0 0 8px;font-weight:700;">Happy ${data.occasionLabel}, ${data.firstName}!</h2>
      </div>
      <p style="color:#555;line-height:1.8;font-size:14px;">Your colleagues at <strong>${data.companyName}</strong> came together to create something special. <strong>${data.signerCount} people</strong> signed your card and left you heartfelt messages!${data.giftAmount ? ` They also pooled a gift of <strong style="color:#3B6D11;">${fmtNGN(data.giftAmount)}</strong> for you!` : ''}</p>
      <div style="background:linear-gradient(135deg,#FBEAF0,#EEEDFE);border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
        <p style="color:#534AB7;font-weight:600;margin:0 0 6px;font-size:15px;">Your card is waiting!</p>
        <p style="color:#6C5CE7;font-size:13px;margin:0;">Click to see all the lovely messages from your team</p>
      </div>
      ${btn(`Open my ${data.occasionLabel} card`, `${FRONTEND_URL}/card/${data.cardSlug}?token=${data.accessToken}`, '#E84393')}
      ${data.giftAmount ? `<p style="color:#555;font-size:13px;margin-top:16px;">To claim your gift of <strong>${fmtNGN(data.giftAmount)}</strong>, open the card and click "Claim gift".</p>` : ''}
    `)
  }),

  memberCardCreated: (data) => ({
    subject: `${data.creatorName} created a card for ${data.recipientName} — sign it!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">A card was created for ${data.recipientName}!</h2>
      <p style="color:#555;line-height:1.8;"><strong>${data.creatorName}</strong> created a group card for <strong>${data.recipientName}</strong> (${data.occasion}). Add your message and help make it special!</p>
      ${data.giftEnabled ? `<div style="background:#EAF3DE;border-radius:8px;padding:14px;margin:16px 0;"><p style="color:#3B6D11;font-size:13px;margin:0;">🎁 Gift pot is open — you can contribute too</p></div>` : ''}
      ${btn('Sign the card', `${FRONTEND_URL}/sign/${data.cardSlug}`, '#E84393')}
      <p style="color:#aaa;font-size:12px;margin-top:12px;">You do not need an account to sign. Creating a card requires a company account.</p>
    `)
  }),
};

// Merge into existing emailTemplates object
Object.assign(emailTemplates, teamsTemplates);

// ── NEW HIRE + LEAVING ADDITIONAL TEMPLATES (appended) ─────────────────────
const additionalTeamsTemplates = {

  // Sent to department members when a new employee is joining
  newHireDeptNotice: (data) => ({
    subject: `🌟 Welcome ${data.newHireName} to the ${data.department} team!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">A new teammate is joining! 🌟</h2>
      <p style="color:#555;line-height:1.8;">
        Please welcome <strong>${data.newHireName}</strong> who is joining the <strong>${data.department}</strong> team
        at <strong>${data.companyName}</strong> on <strong>${data.startDate}</strong> as <strong>${data.jobTitle || 'a new team member'}</strong>.
      </p>
      <p style="color:#555;line-height:1.8;">Help make their first day special — sign their welcome card and show them what an amazing team they're joining!</p>
      <div style="background:#EEEDFE;border-radius:8px;padding:14px 16px;margin:16px 0;">
        <p style="color:#534AB7;font-size:13px;margin:0;">🎁 A welcome gift pot is open — chip in to help them get settled in their new role!</p>
      </div>
      ${btn(`Sign ${data.newHireFirstName}'s welcome card`, `${FRONTEND_URL}/sign/${data.cardSlug}`, '#6C5CE7')}
      <p style="color:#aaa;font-size:12px;margin-top:16px;">Signing closes on ${data.deadline}. No account needed to sign.</p>
    `)
  }),

  // Sent to the new hire on or after their start date
  newHireWelcome: (data) => ({
    subject: `🌟 Welcome to ${data.companyName}, ${data.firstName}! Your team has a surprise for you`,
    html: BASE(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:56px;line-height:1;margin-bottom:12px;">🌟🎉✨</div>
        <h2 style="color:#6C5CE7;font-size:26px;margin:0 0 8px;font-weight:700;">Welcome to the team, ${data.firstName}!</h2>
        <p style="color:#555;font-size:15px;margin:0;">We are so excited to have you at ${data.companyName}</p>
      </div>
      <p style="color:#555;line-height:1.8;font-size:14px;">
        Your new colleagues in <strong>${data.department}</strong> wanted to make your first day extra special.
        <strong>${data.signerCount} people</strong> signed a welcome card just for you!
        ${data.giftAmount ? `They also pooled together a welcome gift of <strong style="color:#3B6D11;">${fmtNGN(data.giftAmount)}</strong> to help you settle in!` : ''}
      </p>
      <div style="background:linear-gradient(135deg,#EEEDFE,#F0F0FF);border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
        <p style="color:#534AB7;font-weight:600;margin:0 0 6px;font-size:15px;">Your welcome card is waiting!</p>
        <p style="color:#6C5CE7;font-size:13px;margin:0;">Click below to read all the lovely messages from your team</p>
      </div>
      ${btn('Open my welcome card 🌟', `${FRONTEND_URL}/card/${data.cardSlug}?token=${data.accessToken}`, '#6C5CE7')}
      <p style="color:#555;font-size:13px;margin-top:20px;line-height:1.7;">From everyone at <strong>${data.companyName}</strong> — welcome aboard. We are glad you are here! 🙌</p>
    `)
  }),

  // Sent to department members when a colleague is leaving
  farewellDeptNotice: (data) => ({
    subject: `👋 ${data.leavingName} is leaving — sign their farewell card!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Time to say a proper goodbye 👋</h2>
      <p style="color:#555;line-height:1.8;">
        <strong>${data.leavingName}</strong> from the <strong>${data.department}</strong> team will be leaving <strong>${data.companyName}</strong>
        on <strong>${data.lastDay}</strong>. Let's send them off in the best possible way — sign their farewell card and leave a message they will always remember!
      </p>
      ${data.giftEnabled ? `
      <div style="background:#EAF3DE;border-radius:8px;padding:14px 16px;margin:16px 0;">
        <p style="color:#3B6D11;font-size:13px;margin:0;">🎁 A farewell gift pot is open — contribute any amount via Flutterwave</p>
      </div>` : ''}
      <div style="background:#fff8e1;border-radius:8px;padding:14px;margin:16px 0;border-left:4px solid #f0c040;">
        <p style="color:#7a5f00;font-size:13px;margin:0;">Please keep this a surprise until we present the card on their last day! 🤫</p>
      </div>
      ${btn(`Sign ${data.leavingFirstName}'s farewell card`, `${FRONTEND_URL}/sign/${data.cardSlug}`, '#E84393')}
      <p style="color:#aaa;font-size:12px;margin-top:16px;">Signing closes on ${data.deadline}. No account needed to sign.</p>
    `)
  }),

  // Sent to the leaving employee on their last day
  farewellCelebrant: (data) => ({
    subject: `👋 Goodbye and good luck, ${data.firstName}! A farewell surprise from ${data.companyName}`,
    html: BASE(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:56px;line-height:1;margin-bottom:12px;">👋💜🌟</div>
        <h2 style="color:#E84393;font-size:26px;margin:0 0 8px;font-weight:700;">Goodbye and good luck, ${data.firstName}!</h2>
        <p style="color:#555;font-size:15px;margin:0;">Your ${data.companyName} family wishes you all the best</p>
      </div>
      <p style="color:#555;line-height:1.8;font-size:14px;">
        As you move on to your next chapter, your colleagues at <strong>${data.companyName}</strong> wanted you to know how much you meant to the team.
        <strong>${data.signerCount} people</strong> signed your farewell card and left you heartfelt messages!
        ${data.giftAmount ? `They also pooled together a farewell gift of <strong style="color:#3B6D11;">${fmtNGN(data.giftAmount)}</strong> just for you!` : ''}
      </p>
      <div style="background:linear-gradient(135deg,#FBEAF0,#EEEDFE);border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
        <p style="color:#534AB7;font-weight:600;margin:0 0 6px;font-size:15px;">Your farewell card is waiting!</p>
        <p style="color:#6C5CE7;font-size:13px;margin:0;">Click to read all the messages and memories your colleagues left for you</p>
      </div>
      ${btn('Open my farewell card 💜', `${FRONTEND_URL}/card/${data.cardSlug}?token=${data.accessToken}`, '#E84393')}
      <p style="color:#555;font-size:13px;margin-top:20px;line-height:1.7;">
        From everyone at <strong>${data.companyName}</strong> — thank you for everything. The door is always open. 🙏
      </p>
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
    subject: `⏰ Reminder: ${recipientName}'s ${occasion} is in ${daysUntil} days!`,
    html: wrap(`
      <h2 style="color:#5B4BDF;font-size:22px;margin-bottom:8px;">⏰ Don't forget!</h2>
      <p>Hey ${userName},</p>
      <p>Just a heads up — <strong>${recipientName}'s ${occasion}</strong> is coming up on <strong>${occasionDate}</strong> (in about ${daysUntil} days).</p>
      <p>Now is the perfect time to create a beautiful group card and start collecting messages and gifts!</p>
      ${btn('Create a card now 🎉', createLink)}
      <p style="color:#aaa;font-size:12px;margin-top:16px;">You're receiving this because you set a reminder on Thankeeu. <a href="${FRONTEND_URL}/dashboard" style="color:#6C5CE7;">Manage reminders →</a></p>
    `)
  }),

  cardOpened: ({ name, cardTitle, cardSlug, appUrl }) => ({
    subject: `👀 Your card "${cardTitle}" was just opened!`,
    html: wrap(`
      <h2 style="color:#5B4BDF;font-size:22px;margin-bottom:8px;">👀 They opened it!</h2>
      <p>Hey ${name},</p>
      <p>The recipient just opened your card <strong>"${cardTitle}"</strong>. They're reading all the beautiful messages right now! 💜</p>
      ${btn('View your card', `${appUrl}/card/${cardSlug}`)}
    `)
  }),

  cardScheduled: ({ name, cardTitle, sendDate, cardSlug, appUrl }) => ({
    subject: `📅 Card "${cardTitle}" is scheduled and ready!`,
    html: wrap(`
      <h2 style="color:#5B4BDF;font-size:22px;margin-bottom:8px;">📅 Your card is scheduled!</h2>
      <p>Hey ${name},</p>
      <p>Your card <strong>"${cardTitle}"</strong> is scheduled for delivery on <strong>${sendDate}</strong>.</p>
      <p>Keep sharing the invite link so more people can sign before it's delivered!</p>
      ${btn('View & share your card', `${appUrl}/card/${cardSlug}`)}
    `)
  }),

  cardSent: ({ name, cardTitle, recipientName, cardSlug, appUrl }) => ({
    subject: `🚀 Your card "${cardTitle}" was delivered to ${recipientName}!`,
    html: wrap(`
      <h2 style="color:#5B4BDF;font-size:22px;margin-bottom:8px;">🚀 Delivered!</h2>
      <p>Hey ${name},</p>
      <p>Your card <strong>"${cardTitle}"</strong> has been delivered to <strong>${recipientName}</strong>. We'll let you know when they open it 👀</p>
      ${btn('View delivered card', `${appUrl}/card/${cardSlug}`)}
    `)
  }),

  pendingToSign: ({ signerName, creatorName, recipientName, occasion, cardSlug, appUrl }) => ({
    subject: `✍️ You're invited to sign ${recipientName}'s ${occasion} card!`,
    html: wrap(`
      <h2 style="color:#5B4BDF;font-size:22px;margin-bottom:8px;">✍️ You're invited to sign!</h2>
      <p>Hey ${signerName},</p>
      <p><strong>${creatorName}</strong> invited you to sign <strong>${recipientName}'s ${occasion} card</strong> on Thankeeu.</p>
      <p>Create your free account (or log in) to sign — it only takes a minute!</p>
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
    subject: `${d.name}, capture your ${d.occasion} wishes forever 🎉`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Hey ${d.name}! 👋</h2>
      <p style="color:#555;line-height:1.8;">You recently signed ${d.creatorName}'s <strong>${d.occasion} card</strong> on Thankeeu.</p>
      <p style="color:#555;line-height:1.8;">With a <strong>free account</strong>, when <em>your</em> birthday or special occasion comes around, all your heartfelt messages, photos, voice notes, and cash gifts from friends and colleagues will be in one beautiful place — instead of scattered across DMs and social media.</p>
      <div style="background:#EEEDFE;border-radius:12px;padding:16px 20px;margin:20px 0;">
        <ul style="color:#534AB7;font-size:13px;margin:0;padding-left:18px;line-height:2.2;">
          <li>🎂 Get a group birthday card from your whole team</li>
          <li>🎁 Receive a pooled cash gift to your bank account</li>
          <li>💌 Keep all birthday wishes forever</li>
          <li>📸 Photos, voice notes, heartfelt messages in one place</li>
        </ul>
      </div>
      ${btn('Create my free account →', d.signupLink, '#E84393')}
      <p style="color:#aaa;font-size:12px;margin-top:16px;">You received this because you signed a card on Thankeeu. <a href="${d.appUrl}" style="color:#aaa;">Unsubscribe</a></p>
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
      ${btn('Create my birthday card →', d.createCardUrl, '#E84393')}
    `)
  }),
  birthdayReminder2Days: (d) => ({
    subject: `⏰ ${d.name}, ${d.daysLeft} days left — set up your birthday card now!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 10px;">Don't miss your chance, ${d.name}! 🎂</h2>
      <p style="color:#555;line-height:1.8;">Your birthday is in just <strong>${d.daysLeft} days</strong>! There's still time to set up your Thankeeu birthday card so your friends, family, and colleagues can leave you messages, photos, and gifts all in one place.</p>
      <p style="color:#555;line-height:1.8;">Takes less than 2 minutes to set up.</p>
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
      ${btn('Confirm my subscription →', d.confirmUrl, '#7C3AED')}
      <p style="color:#aaa;font-size:12px;margin-top:16px;">If you didn't subscribe, simply ignore this email. <a href="${d.unsubscribeUrl}" style="color:#aaa;">Unsubscribe</a></p>
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
