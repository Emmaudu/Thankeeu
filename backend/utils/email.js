const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Currency helper: stored amounts are NGN, display as USD (1 USD ≈ 1,600 NGN)
const fmtUSD = (ngnAmount) => {
  if (!ngnAmount) return '$0';
  const usd = Math.round(ngnAmount / 1600);
  return `$${usd.toLocaleString()}`;
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

const btn = (text, url, color = '#6C5CE7') =>
  `<a href="${url}" style="display:inline-block;background:${color};color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:20px;">${text}</a>`;

const emailTemplates = {

  welcome: (data) => ({
    subject: `Welcome to Thankeeu, ${data.name}!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Welcome aboard, ${data.name}!</h2>
      <p style="color:#555;line-height:1.7;">You are now part of a community that celebrates the people who matter most. Create beautiful group cards, collect heartfelt messages, and send meaningful gifts.</p>
      ${btn('Go to your dashboard', `${process.env.APP_URL}/dashboard`)}
    `)
  }),

  cardInvite: (data) => ({
    subject: `${data.creatorName} wants you to sign ${data.recipientName}'s card!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">You have been invited to sign a card!</h2>
      <p style="color:#555;line-height:1.7;"><strong>${data.creatorName}</strong> is putting together a special group card for <strong>${data.recipientName}</strong>'s ${data.occasion}.</p>
      ${data.giftEnabled ? `<div style="background:#EAF3DE;border-radius:8px;padding:14px 16px;margin:16px 0;"><p style="color:#3B6D11;margin:0;font-size:13px;">🎁 A gift pot is open — chip in as little as $500</p></div>` : ''}
      <p style="color:#555;font-size:13px;">Closes on ${data.deadline}</p>
      ${btn('Sign the card now', `${process.env.APP_URL}/sign/${data.cardSlug}`, '#E84393')}
    `)
  }),

  cardDelivery: (data) => ({
    subject: `You have a special card waiting for you, ${data.recipientName}!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 12px;">Happy ${data.occasion}, ${data.recipientName}!</h2>
      <p style="color:#555;line-height:1.7;"><strong>${data.senderCount} people</strong> came together to create something special for you.${data.giftAmount ? ` They also pooled a gift of <strong style="color:#3B6D11;">${fmtUSD(data.giftAmount)}</strong>!` : ''}</p>
      ${btn('Open my card', `${process.env.APP_URL}/card/${data.cardSlug}?token=${data.accessToken}`)}
    `)
  }),

  cardReminder: (data) => ({
    subject: `Reminder: Sign ${data.recipientName}'s card before it closes!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Card closing in ${data.hoursLeft} hours!</h2>
      <p style="color:#555;line-height:1.7;">Do not miss your chance to add a message to <strong>${data.recipientName}</strong>'s card.</p>
      ${btn('Sign now', `${process.env.APP_URL}/sign/${data.cardSlug}`, '#E84393')}
    `)
  }),

  passwordReset: (data) => ({
    subject: 'Reset your Thankeeu password',
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Reset your password</h2>
      <p style="color:#555;line-height:1.7;">Click below to reset your password. This link expires in 1 hour.</p>
      ${btn('Reset password', `${process.env.APP_URL}/reset-password?token=${data.token}`)}
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
      ${btn('Go to Company Dashboard', `${process.env.APP_URL}/company/dashboard`)}
    `)
  }),

  companyPasswordReset: (data) => ({
    subject: `Reset your Thankeeu company password`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Reset your company password</h2>
      <p style="color:#555;line-height:1.7;">We received a reset request for <strong>${data.companyName}</strong>. Link expires in 1 hour.</p>
      ${btn('Reset password', `${process.env.APP_URL}/company/reset-password?token=${data.token}`)}
    `)
  }),

  birthdayDeptNotice: (data) => ({
    subject: `${data.celebrantName}'s birthday is in 2 days — sign their card!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Your colleague's birthday is almost here!</h2>
      <p style="color:#555;line-height:1.8;"><strong>${data.celebrantName}</strong> from the <strong>${data.department}</strong> team celebrates their birthday on <strong>${data.birthdayDate}</strong>. ${data.companyName} is putting together a group card — add your message!</p>
      ${data.giftEnabled ? `<div style="background:#EAF3DE;border-radius:8px;padding:14px 16px;margin:16px 0;"><p style="color:#3B6D11;margin:0;font-size:13px;">🎁 A gift pot is open — contribute any amount via Paystack</p></div>` : ''}
      <div style="background:#fff8e1;border-radius:8px;padding:14px 16px;margin:16px 0;border-left:4px solid #f0c040;">
        <p style="color:#7a5f00;font-size:13px;margin:0;">Please keep this a surprise — do not mention the card to ${data.celebrantFirstName} before their birthday!</p>
      </div>
      ${btn(`Sign ${data.celebrantFirstName}'s card`, `${process.env.APP_URL}/sign/${data.cardSlug}`, '#E84393')}
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
      <p style="color:#555;line-height:1.8;font-size:14px;">Your colleagues at <strong>${data.companyName}</strong> came together to create something special. <strong>${data.signerCount} people</strong> signed your card and left you heartfelt messages!${data.giftAmount ? ` They also pooled a gift of <strong style="color:#3B6D11;">${fmtUSD(data.giftAmount)}</strong> just for you!` : ''}</p>
      <div style="background:linear-gradient(135deg,#FBEAF0,#EEEDFE);border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
        <p style="color:#534AB7;font-weight:600;margin:0 0 6px;font-size:15px;">Your birthday card is waiting!</p>
        <p style="color:#6C5CE7;font-size:13px;margin:0;">Click to see all the lovely messages from your team</p>
      </div>
      ${btn('Open my birthday card', `${process.env.APP_URL}/card/${data.cardSlug}?token=${data.accessToken}`, '#E84393')}
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
      ${btn('Reply in Admin Panel', `${process.env.APP_URL}/admin`)}
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

const sendEmail = async ({ to, template, data }) => {
  try {
    const tmpl = emailTemplates[template]?.(data);
    if (!tmpl) throw new Error(`Template "${template}" not found`);
    const result = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME || 'Thankeeu'} <${process.env.EMAIL_FROM || 'hello@thankeeu.com'}>`,
      to,
      subject: tmpl.subject,
      html: tmpl.html
    });
    return { success: true, id: result.id };
  } catch (error) {
    console.error('Email error:', error);
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
      ${btn('Review request', `${process.env.APP_URL}/company/members`)}
    `)
  }),

  memberApproved: (data) => ({
    subject: `Your account has been approved — Welcome to ${data.companyName}!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">You are approved! 🎉</h2>
      <p style="color:#555;line-height:1.8;">Hi <strong>${data.memberName}</strong>, your account has been approved for <strong>${data.companyName}</strong> as a <strong>${data.role === 'team_leader' ? 'Team Leader' : 'Team Member'}</strong> in the <strong>${data.department}</strong> department.</p>
      <p style="color:#555;font-size:13px;">You can now sign in and start celebrating your colleagues!</p>
      ${btn('Sign in to your account', `${process.env.APP_URL}/member/login`)}
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
      ${btn('Reset password', `${process.env.APP_URL}/member/reset-password?token=${data.token}`)}
      <p style="color:#aaa;font-size:12px;margin-top:20px;">If you did not request this, ignore this email.</p>
    `)
  }),

  deductionRequest: (data) => ({
    subject: `[Deduction Request] ${data.leaderName} requests ${fmtUSD(data.amount)} from ${data.recipientName}'s celebration`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:18px;margin:0 0 12px;">Deduction request for review 💰</h2>
      <p style="color:#555;line-height:1.8;"><strong>${data.leaderName}</strong> (Team Leader) has requested a deduction from the gift pot collected for <strong>${data.recipientName}</strong>'s celebration.</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0;">
        ${[['Card',data.cardTitle],['Amount Requested',`${fmtUSD(data.amount)}`],['Reason',data.reason]].map(([k,v])=>
          `<tr><td style="padding:8px 12px;background:#f9f9f9;font-weight:600;color:#555;border:1px solid #eee;width:130px;">${k}</td><td style="padding:8px 12px;border:1px solid #eee;color:#333;">${v}</td></tr>`).join('')}
      </table>
      <p style="color:#555;font-size:13px;line-height:1.7;">Note: The 20% platform fee has already been deducted from the gross total before this request.</p>
      ${btn('Review in HR Dashboard', `${process.env.APP_URL}/company/deductions`)}
    `)
  }),

  deductionApproved: (data) => ({
    subject: `Your deduction request of ${fmtUSD(data.amount)} has been approved`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Deduction approved ✅</h2>
      <p style="color:#555;line-height:1.8;">Hi <strong>${data.leaderName}</strong>, your deduction request of <strong>${fmtUSD(data.amount)}</strong> for physical celebration has been approved by HR.</p>
      ${data.note ? `<div style="background:#EAF3DE;border-radius:8px;padding:14px;margin:16px 0;"><p style="color:#3B6D11;font-size:13px;margin:0;"><strong>HR note:</strong> ${data.note}</p></div>` : ''}
      <p style="color:#555;font-size:13px;">The remaining balance will be disbursed to the celebrant.</p>
    `)
  }),

  deductionRejected: (data) => ({
    subject: `Your deduction request of ${fmtUSD(data.amount)} was not approved`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Deduction request rejected</h2>
      <p style="color:#555;line-height:1.8;">Hi <strong>${data.leaderName}</strong>, your deduction request of <strong>${fmtUSD(data.amount)}</strong> was not approved at this time.</p>
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
      ${btn('Review in HR Dashboard', `${process.env.APP_URL}/company/deductions`)}
    `)
  }),

  occasionNotice: (data) => ({
    subject: `${data.icon} ${data.memberName}'s ${data.occasionLabel} is in ${data.daysLeft} days — sign their card!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">${data.icon} Celebrate ${data.memberName}!</h2>
      <p style="color:#555;line-height:1.8;"><strong>${data.memberName}</strong> from <strong>${data.department}</strong> has an upcoming <strong>${data.occasionLabel}</strong> on <strong>${data.occasionDate}</strong>. ${data.companyName} is putting together a special group card!</p>
      ${data.giftEnabled ? `<div style="background:#EAF3DE;border-radius:8px;padding:14px;margin:16px 0;"><p style="color:#3B6D11;font-size:13px;margin:0;">🎁 A gift pot is open — contribute any amount via Paystack</p></div>` : ''}
      <div style="background:#fff8e1;border-radius:8px;padding:14px;margin:16px 0;border-left:4px solid #f0c040;">
        <p style="color:#7a5f00;font-size:13px;margin:0;">Keep this a surprise — please do not mention the card to ${data.memberFirstName}!</p>
      </div>
      ${btn(`Sign ${data.memberFirstName}'s card`, `${process.env.APP_URL}/sign/${data.cardSlug}`, '#E84393')}
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
      <p style="color:#555;line-height:1.8;font-size:14px;">Your colleagues at <strong>${data.companyName}</strong> came together to create something special. <strong>${data.signerCount} people</strong> signed your card and left you heartfelt messages!${data.giftAmount ? ` They also pooled a gift of <strong style="color:#3B6D11;">${fmtUSD(data.giftAmount)}</strong> for you!` : ''}</p>
      <div style="background:linear-gradient(135deg,#FBEAF0,#EEEDFE);border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
        <p style="color:#534AB7;font-weight:600;margin:0 0 6px;font-size:15px;">Your card is waiting!</p>
        <p style="color:#6C5CE7;font-size:13px;margin:0;">Click to see all the lovely messages from your team</p>
      </div>
      ${btn(`Open my ${data.occasionLabel} card`, `${process.env.APP_URL}/card/${data.cardSlug}?token=${data.accessToken}`, '#E84393')}
      ${data.giftAmount ? `<p style="color:#555;font-size:13px;margin-top:16px;">To claim your gift of <strong>${fmtUSD(data.giftAmount)}</strong>, open the card and click "Claim gift".</p>` : ''}
    `)
  }),

  memberCardCreated: (data) => ({
    subject: `${data.creatorName} created a card for ${data.recipientName} — sign it!`,
    html: BASE(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">A card was created for ${data.recipientName}!</h2>
      <p style="color:#555;line-height:1.8;"><strong>${data.creatorName}</strong> created a group card for <strong>${data.recipientName}</strong> (${data.occasion}). Add your message and help make it special!</p>
      ${data.giftEnabled ? `<div style="background:#EAF3DE;border-radius:8px;padding:14px;margin:16px 0;"><p style="color:#3B6D11;font-size:13px;margin:0;">🎁 Gift pot is open — you can contribute too</p></div>` : ''}
      ${btn('Sign the card', `${process.env.APP_URL}/sign/${data.cardSlug}`, '#E84393')}
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
      ${btn(`Sign ${data.newHireFirstName}'s welcome card`, `${process.env.APP_URL}/sign/${data.cardSlug}`, '#6C5CE7')}
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
        ${data.giftAmount ? `They also pooled together a welcome gift of <strong style="color:#3B6D11;">${fmtUSD(data.giftAmount)}</strong> to help you settle in!` : ''}
      </p>
      <div style="background:linear-gradient(135deg,#EEEDFE,#F0F0FF);border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
        <p style="color:#534AB7;font-weight:600;margin:0 0 6px;font-size:15px;">Your welcome card is waiting!</p>
        <p style="color:#6C5CE7;font-size:13px;margin:0;">Click below to read all the lovely messages from your team</p>
      </div>
      ${btn('Open my welcome card 🌟', `${process.env.APP_URL}/card/${data.cardSlug}?token=${data.accessToken}`, '#6C5CE7')}
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
        <p style="color:#3B6D11;font-size:13px;margin:0;">🎁 A farewell gift pot is open — contribute any amount via Paystack</p>
      </div>` : ''}
      <div style="background:#fff8e1;border-radius:8px;padding:14px;margin:16px 0;border-left:4px solid #f0c040;">
        <p style="color:#7a5f00;font-size:13px;margin:0;">Please keep this a surprise until we present the card on their last day! 🤫</p>
      </div>
      ${btn(`Sign ${data.leavingFirstName}'s farewell card`, `${process.env.APP_URL}/sign/${data.cardSlug}`, '#E84393')}
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
        ${data.giftAmount ? `They also pooled together a farewell gift of <strong style="color:#3B6D11;">${fmtUSD(data.giftAmount)}</strong> just for you!` : ''}
      </p>
      <div style="background:linear-gradient(135deg,#FBEAF0,#EEEDFE);border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
        <p style="color:#534AB7;font-weight:600;margin:0 0 6px;font-size:15px;">Your farewell card is waiting!</p>
        <p style="color:#6C5CE7;font-size:13px;margin:0;">Click to read all the messages and memories your colleagues left for you</p>
      </div>
      ${btn('Open my farewell card 💜', `${process.env.APP_URL}/card/${data.cardSlug}?token=${data.accessToken}`, '#E84393')}
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
      ${btn('View in Admin Dashboard', `${process.env.APP_URL}/admin`)}
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
      <p style="color:#555;font-size:13px;line-height:1.7;">In the meantime, feel free to explore the platform at <a href="${process.env.APP_URL}" style="color:#6C5CE7;">${process.env.APP_URL}</a>.</p>
      <p style="color:#aaa;font-size:12px;margin-top:16px;">Questions? Reply to this email or contact us at <a href="mailto:support@thankeeu.com" style="color:#6C5CE7;">support@thankeeu.com</a></p>
    `)
  }),
};
Object.assign(emailTemplates, demoTemplates);
