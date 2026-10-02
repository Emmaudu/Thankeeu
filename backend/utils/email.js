const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder_not_set');

// ── Sender: use a real person name, never "noreply" ───────────────
// Gmail trusts person-name senders far more than system names.
// Set EMAIL_FROM to a real address like hello@taskeeu.com
const FROM      = `${process.env.EMAIL_FROM_NAME || 'Taskeeu'} <${process.env.EMAIL_FROM || 'hello@taskeeu.com'}>`;
const FRONTEND  = process.env.FRONTEND_URL || 'https://taskeeu.com';
const SITE_NAME = 'Taskeeu';
const SUPPORT   = process.env.EMAIL_SUPPORT || 'hello@taskeeu.com';

// ── Inbox-first design rules ──────────────────────────────────────
// 1. Plain white background — no gradients, no decorative headers
// 2. System font stack — looks like a real person wrote it
// 3. No emoji in subjects — Gmail ML penalises them for promotions
// 4. Single, low-key CTA — not a big coloured button block
// 5. Transactional copy tone — factual, not marketing
// 6. Text-heavy content ratio — images/decoration → promotions
// 7. Short subject lines — under 50 chars where possible

const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";

const base = (content, previewText = '') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="light dark"/>
  <meta name="supported-color-schemes" content="light dark"/>
  <title>${SITE_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:${FONT};">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e2e2;">
          <!-- Logo row -->
          <tr>
            <td style="padding:28px 36px 20px;border-bottom:1px solid #e8e8e8;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#1a1a1a;font-family:${FONT};">${SITE_NAME}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#888;font-family:${FONT};">Nigeria's Task Outsourcing Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;font-family:${FONT};font-size:15px;line-height:1.7;color:#1a1a1a;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px 28px;border-top:1px solid #e8e8e8;font-family:${FONT};font-size:12px;color:#888;line-height:1.6;">
              <p style="margin:0 0 6px;">You received this email because you have an account on <a href="${FRONTEND}" style="color:#666;text-decoration:underline;">${SITE_NAME}</a>.</p>
              <p style="margin:0;">Need help? Email us at <a href="mailto:${SUPPORT}" style="color:#666;text-decoration:underline;">${SUPPORT}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ── Reusable inline elements ──────────────────────────────────────
const link  = (href, text) => `<a href="${href}" style="color:#c41445;text-decoration:underline;font-weight:600;font-family:${FONT};">${text}</a>`;
const cta   = (href, text) => `<p style="margin:24px 0;font-family:${FONT};"><a href="${href}" style="display:inline-block;background:#c41445;color:#ffffff;padding:12px 28px;text-decoration:none;font-weight:600;font-size:15px;font-family:${FONT};">${text}</a></p>`;
const note  = (text) => `<p style="margin:20px 0 0;padding:14px 16px;background:#f9f9f9;border-left:3px solid #c41445;font-size:13px;color:#555;font-family:${FONT};line-height:1.6;">${text}</p>`;
const p     = (text) => `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.7;color:#1a1a1a;">${text}</p>`;
const h     = (text) => `<h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#1a1a1a;font-family:${FONT};">${text}</h2>`;
const codeBlock = (code) => `<p style="margin:24px 0;text-align:center;font-family:${FONT};"><span style="display:inline-block;background:#f4f4f5;border:1px solid #e2e2e2;padding:16px 32px;font-size:32px;font-weight:700;letter-spacing:12px;color:#1a1a1a;font-family:monospace;">${code}</span></p>`;
const divider = () => `<hr style="border:none;border-top:1px solid #e8e8e8;margin:24px 0;"/>`;

// ── Send ──────────────────────────────────────────────────────────
// "NGN 12,500" for Naira (unchanged format), "USD 12.50" for other currencies.
const amt = (n, currency = 'NGN') => {
  const v = Number(n || 0);
  const cur = String(currency || 'NGN').toUpperCase();
  if (cur === 'NGN') return `NGN ${v.toLocaleString()}`;
  return `${cur} ${v.toLocaleString('en-US', { minimumFractionDigits: Math.round(v * 100) % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
};

const send = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'placeholder_not_set') {
      console.error(`❌ EMAIL NOT SENT — RESEND_API_KEY is not set. Subject: [${subject}] To: ${to}`);
      return null;
    }
    const payload = { from: FROM, to, subject, html };
    if (text) payload.text = text; // plain-text fallback improves deliverability
    console.log(`📧 Sending email to ${to} [${subject}] from ${FROM}`);
    const { data, error } = await resend.emails.send(payload);
    if (error) {
      console.error(`❌ Resend API error to ${to} [${subject}]:`, JSON.stringify(error));
      throw new Error(`Resend error: ${JSON.stringify(error)}`);
    }
    console.log(`✅ Email sent to ${to} [${subject}] id=${data?.id}`);
    return data;
  } catch (err) {
    console.error(`❌ Email exception to ${to} [${subject}]:`, err?.message);
    throw err; // re-throw so callers can catch and respond accordingly
  }
};

// ═══════════════════════════════════════════════════════════════════
// EMAIL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

const sendRequesterVerificationEmail = (to, name, token) => {
  const verifyUrl = `${FRONTEND}/auth/verify-email?token=${token}&role=requester`;
  return send({
    to,
    subject: `Verify your email address — ${SITE_NAME}`,
    text: `Hi ${name},\n\nPlease verify your email to activate your ${SITE_NAME} account:\n\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you did not sign up, ignore this email.\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`Verify your email, ${name}`)}
      ${p(`You created a requester account on ${SITE_NAME}. Please verify your email address to activate your account.`)}
      ${cta(verifyUrl, 'Verify Email Address')}
      ${p(`Or paste this link into your browser:`)}
      <p style="margin:0 0 20px;font-family:monospace;font-size:12px;color:#555;word-break:break-all;">${verifyUrl}</p>
      ${note(`This link expires in 24 hours. If you did not create an account, you can safely ignore this email.`)}
    `, `Verify your email to activate your ${SITE_NAME} account.`),
  });
};

const sendWelcomeEmail = (to, name) =>
  send({
    to,
    subject: `Your ${SITE_NAME} account is active`,
    text: `Hi ${name},\n\nYour email is verified and your ${SITE_NAME} account is ready.\n\nLog in to post your first task: ${FRONTEND}/requester\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`Welcome to ${SITE_NAME}, ${name}`)}
      ${p(`Your email address has been verified and your account is now active.`)}
      ${p(`You can now post tasks, hire verified taskers across Nigeria, and track everything from your dashboard.`)}
      ${cta(`${FRONTEND}/requester`, 'Go to Your Dashboard')}
      ${note(`Complete your profile and add your bank details so refunds can be processed quickly.`)}
    `, `Your ${SITE_NAME} account is ready. Start posting tasks.`),
  });

const sendTaskerWelcomeEmail = (to, name) =>
  send({
    to,
    subject: `Application received — ${SITE_NAME}`,
    text: `Hi ${name},\n\nThank you for applying to become a verified ${SITE_NAME} tasker. Our team will review your documents within 24–48 hours.\n\nYou will receive an email once a decision is made.\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`Application received, ${name}`)}
      ${p(`Thank you for submitting your tasker application on ${SITE_NAME}.`)}
      ${p(`Our verification team will review your documents within <strong>24–48 hours</strong>. You will receive an email once a decision has been made.`)}
      ${divider()}
      ${p(`<strong>What happens next:</strong><br/>Our team verifies your identity documents and proof of address to ensure the safety of everyone on the platform. This process is standard and confidential.`)}
    `, `Your tasker application is under review. Expect a response within 24–48 hours.`),
  });

const sendTaskerApprovedEmail = (to, name, loginToken) => {
  const dashUrl = `${FRONTEND}/auth/tasker-approved?token=${loginToken}`;
  return send({
    to,
    subject: `Your tasker application has been approved`,
    text: `Hi ${name},\n\nYour ${SITE_NAME} tasker application has been approved.\n\nYou can now browse and bid on tasks near you. Log in here:\n${dashUrl}\n\nNext step: Complete your KYC verification in your dashboard (upload ID and proof of address) to unlock enterprise tasks and maximum earning potential.\n\nThis link expires in 7 days. After that, log in at ${FRONTEND}/tasker/login\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`Your application was approved, ${name}`)}
      ${p(`Your tasker application on ${SITE_NAME} has been approved. Your account is now active.`)}
      ${p(`You can now:<br/>
        &bull; Browse and bid on tasks in your area<br/>
        &bull; Receive task notifications for your city<br/>
        &bull; Earn and withdraw payments directly to your bank account`)}
      ${cta(dashUrl, 'Log In to Your Dashboard')}
      ${note(`<strong>Next step — complete your KYC:</strong> Upload your ID document and proof of address in your dashboard to unlock enterprise tasks and maximum earning potential. Go to <strong>Dashboard &rarr; KYC Verification</strong>.`)}
      <p style="margin:16px 0 0;font-size:12px;color:#888;font-family:${FONT};">This link expires in 7 days. After that, log in at <a href="${FRONTEND}/tasker/login" style="color:#888;">${FRONTEND}/tasker/login</a></p>
    `, `Your ${SITE_NAME} tasker application has been approved. Log in to get started.`),
  });
};

const sendTaskerRejectedEmail = (to, name, reason) =>
  send({
    to,
    subject: `Update on your tasker application`,
    text: `Hi ${name},\n\nWe reviewed your ${SITE_NAME} tasker application and unfortunately could not approve it at this time.\n\n${reason ? `Reason: ${reason}\n\n` : ''}You may re-apply after correcting any issues. If you have questions, contact us at ${SUPPORT}.\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`Application update`)}
      ${p(`Hi ${name}, we have reviewed your tasker application and unfortunately were unable to approve it at this time.`)}
      ${reason ? note(`<strong>Reason:</strong> ${reason}`) : ''}
      ${p(`You may re-apply after addressing any issues. If you have questions or believe this is an error, please ${link(`mailto:${SUPPORT}`, 'contact our support team')}.`)}
    `, `An update on your ${SITE_NAME} tasker application.`),
  });

const sendNewBidEmail = (to, requesterName, taskerName, taskTitle, workmanshipPrice, currency = 'NGN') =>
  send({
    to,
    subject: `New bid on "${taskTitle}"`,
    text: `Hi ${requesterName},\n\n${taskerName} has placed a bid on your task "${taskTitle}".\n\nBid amount: ${amt(workmanshipPrice, currency)}\n\nReview it here: ${FRONTEND}/requester\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`New bid on your task`)}
      ${p(`Hi ${requesterName},`)}
      ${p(`<strong>${taskerName}</strong> has placed a bid on your task <strong>"${taskTitle}"</strong>.`)}
      <table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;width:100%;border:1px solid #e2e2e2;">
        <tr>
          <td style="padding:12px 16px;background:#f9f9f9;font-size:13px;color:#555;font-family:${FONT};width:40%;">Bid Amount</td>
          <td style="padding:12px 16px;font-size:15px;font-weight:700;color:#1a1a1a;font-family:${FONT};">${amt(workmanshipPrice, currency)}</td>
        </tr>
      </table>
      ${cta(`${FRONTEND}/requester`, 'Review Bid')}
    `, `${taskerName} placed a bid on "${taskTitle}"`),
  });

const sendBidAcceptedEmail = (to, taskerName, taskTitle) =>
  send({
    to,
    subject: `Your bid on "${taskTitle}" was accepted`,
    text: `Hi ${taskerName},\n\nYour bid for "${taskTitle}" has been accepted.\n\nYou can now message the requester to confirm task details and payment.\n\nLog in: ${FRONTEND}/tasker\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`Your bid was accepted`)}
      ${p(`Hi ${taskerName},`)}
      ${p(`Your bid for <strong>"${taskTitle}"</strong> has been accepted by the requester.`)}
      ${p(`Log in to your dashboard to message the requester and confirm the task details before you begin.`)}
      ${cta(`${FRONTEND}/tasker`, 'View Task')}
    `, `Your bid for "${taskTitle}" was accepted.`),
  });

const sendBidRejectedEmail = (to, taskerName, taskTitle) =>
  send({
    to,
    subject: `Bid update for "${taskTitle}"`,
    text: `Hi ${taskerName},\n\nYour bid on "${taskTitle}" was not selected this time.\n\nBrowse more tasks: ${FRONTEND}/tasks\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`Bid not selected`)}
      ${p(`Hi ${taskerName},`)}
      ${p(`Your bid on <strong>"${taskTitle}"</strong> was not selected by the requester this time.`)}
      ${p(`There are always new tasks being posted. Browse open tasks to find your next opportunity.`)}
      ${cta(`${FRONTEND}/tasks`, 'Browse Available Tasks')}
    `, `Your bid on "${taskTitle}" was not selected.`),
  });

// Sent to the OTHER bidders when a requester chooses a tasker. Encouraging:
// the choice isn't final until the task is paid for, so they may still be picked.
// Task titles / names come from users, so they are HTML-escaped here.
const escHtml = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
// Stored text was HTML-escaped once by the request sanitizer — decode it back first,
// then escape exactly once for HTML (plain-text parts show it as typed).
const decodeOnce = (v) => String(v ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
const oneLine = (v) => decodeOnce(v).replace(/[\r\n]+/g, ' ').trim();
const sendBidNotSelectedEmail = (to, taskerName, taskTitle) => {
  const first = oneLine(taskerName).split(' ')[0] || 'there';
  const title = oneLine(taskTitle);
  return send({
    to,
    subject: `Update on your bid for "${title.slice(0, 80)}"`,
    text: [
      `Hi ${first},`,
      '',
      `Sorry — the requester has chosen another tasker for "${title}".`,
      '',
      'Please stay tuned: sometimes the requester and the chosen tasker do not agree on the details, and the requester picks another tasker. Your bid stays open, so there is still hope for you on this task.',
      '',
      'Tips to win your next task:',
      '• Pitch well: say exactly how you will do the task, when you can start, and why you are a good fit.',
      '• Offer a fair, clear price.',
      '• Update your profile picture: a clear, friendly photo of your face builds trust.',
      '• Keep your bio and skills up to date.',
      '',
      `Update your profile: ${FRONTEND}/tasker?tab=profile`,
      `Find more tasks: ${FRONTEND}/tasks`,
      '',
      `— ${SITE_NAME} Team`,
    ].join('\n'),
    html: base(`
      ${h('Another tasker was chosen — but stay tuned')}
      ${p(`Hi ${escHtml(first)},`)}
      ${p(`Sorry — the requester has chosen another tasker for <strong>"${escHtml(title)}"</strong>.`)}
      ${p(`Please stay tuned. Sometimes the requester and the chosen tasker don't agree on the details, and the requester decides to go with someone else. <strong>Your bid stays open</strong>, so there is still hope for you on this task.`)}
      ${divider()}
      ${p('<strong>Tips to win your next task</strong>')}
      ${p('• <strong>Pitch well:</strong> say exactly how you will do the task, when you can start, and why you are the right person.<br/>• <strong>Price clearly and fairly.</strong><br/>• <strong>Update your profile picture:</strong> a clear, friendly photo of your face builds trust with requesters.<br/>• <strong>Complete your bio and skills</strong> so requesters can see your experience.')}
      ${cta(`${FRONTEND}/tasker?tab=profile`, 'Update My Profile')}
      ${note(`Looking for more work? ${link(`${FRONTEND}/tasks`, 'Browse open tasks')} — new ones are posted every day.`)}
    `, `Another tasker was chosen for "${escHtml(title)}" — your bid stays open.`),
  });
};

// Sent to every tasker who bid when the requester cancels the task.
const sendTaskCancelledToBidderEmail = (to, taskerName, taskTitle, by = 'requester') => {
  const first = oneLine(taskerName).split(' ')[0] || 'there';
  const title = oneLine(taskTitle);
  const who = by === 'admin' ? 'Taskeeu' : 'The requester';
  return send({
    to,
    subject: `Task cancelled: "${title.slice(0, 80)}"`,
    text: [
      `Hi ${first},`,
      '',
      `${who} has cancelled the task "${title}" that you bid on, so it is no longer available.`,
      'You don\'t need to do anything. New tasks are posted every day.',
      '',
      `Find more tasks: ${FRONTEND}/tasks`,
      '',
      `— ${SITE_NAME} Team`,
    ].join('\n'),
    html: base(`
      ${h('A task you bid on was cancelled')}
      ${p(`Hi ${escHtml(first)},`)}
      ${p(`${who} has cancelled <strong>"${escHtml(title)}"</strong>, so it is no longer available.`)}
      ${p("You don't need to do anything. New tasks are posted every day — keep bidding!")}
      ${cta(`${FRONTEND}/tasks`, 'Browse Open Tasks')}
    `, `"${escHtml(title)}" was cancelled by ${by === 'admin' ? 'Taskeeu' : 'the requester'}.`),
  });
};

const sendNewMessageEmail = (to, recipientName, senderName, preview) =>
  send({
    to,
    subject: `${senderName} sent you a message`,
    text: `Hi ${recipientName},\n\n${senderName} sent you a message on ${SITE_NAME}:\n\n"${preview.substring(0, 200)}${preview.length > 200 ? '…' : ''}"\n\nReply here: ${FRONTEND}/tasker\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`New message from ${senderName}`)}
      ${p(`Hi ${recipientName},`)}
      ${p(`<strong>${senderName}</strong> sent you a message on ${SITE_NAME}:`)}
      <blockquote style="margin:20px 0;padding:14px 16px;border-left:3px solid #e2e2e2;color:#555;font-style:italic;font-family:${FONT};font-size:14px;line-height:1.6;">"${preview.substring(0, 200)}${preview.length > 200 ? '…' : ''}"</blockquote>
      ${cta(`${FRONTEND}/tasker`, 'Reply to Message')}
    `, `${senderName} sent you a message on ${SITE_NAME}.`),
  });

const sendProofUploadedEmail = (to, requesterName, taskTitle) =>
  send({
    to,
    subject: `Proof uploaded for "${taskTitle}" — action needed`,
    text: `Hi ${requesterName},\n\nYour tasker has uploaded proof of equipment and shipment costs for "${taskTitle}".\n\nPlease review and confirm to release payment: ${FRONTEND}/requester\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`Action required: proof uploaded`)}
      ${p(`Hi ${requesterName},`)}
      ${p(`Your tasker has uploaded proof of equipment and shipment costs for <strong>"${taskTitle}"</strong>.`)}
      ${p(`Please log in to review the uploaded photos and confirm the costs to release payment.`)}
      ${cta(`${FRONTEND}/requester`, 'Review and Confirm')}
      ${note(`Only confirm after carefully reviewing all proof images. Payment is released immediately upon confirmation.`)}
    `, `Your tasker uploaded proof for "${taskTitle}". Review and confirm.`),
  });

const sendPaymentSentEmail = (to, recipientName, amount, paymentType, currency = 'NGN') =>
  send({
    to,
    subject: paymentType === 'refund'
      ? `Refund of ${amt(amount, currency)} processed`
      : `Payment of ${amt(amount, currency)} sent`,
    text: `Hi ${recipientName},\n\n${amt(amount, currency)} has been ${paymentType === 'refund' ? 'refunded to your account' : 'sent to your bank account'}.\n\nTransfers usually arrive within 1–3 minutes for verified accounts.\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(paymentType === 'refund' ? 'Refund processed' : 'Payment sent')}
      ${p(`Hi ${recipientName},`)}
      ${p(`<strong>${amt(amount, currency)}</strong> has been ${paymentType === 'refund' ? 'refunded to your account' : 'sent to your bank account'}.`)}
      <table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;width:100%;border:1px solid #e2e2e2;">
        <tr>
          <td style="padding:12px 16px;background:#f9f9f9;font-size:13px;color:#555;font-family:${FONT};width:40%;">Amount</td>
          <td style="padding:12px 16px;font-size:15px;font-weight:700;color:#1a1a1a;font-family:${FONT};">${amt(amount, currency)}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;background:#f9f9f9;font-size:13px;color:#555;font-family:${FONT};border-top:1px solid #e2e2e2;">Type</td>
          <td style="padding:12px 16px;font-size:14px;color:#1a1a1a;font-family:${FONT};border-top:1px solid #e2e2e2;">${paymentType}</td>
        </tr>
      </table>
      ${note(`Transfers typically arrive within 1–3 minutes for verified bank accounts.`)}
    `, `${amt(amount, currency)} has been ${paymentType === 'refund' ? 'refunded' : 'sent'} to your account.`),
  });

const sendTaskCompletionCodeEmail = (to, requesterName, code, taskTitle) =>
  send({
    to,
    subject: `Completion code for "${taskTitle}"`,
    text: `Hi ${requesterName},\n\nYour task "${taskTitle}" is ready to be completed.\n\nYour completion code is: ${code}\n\nShare this code with your tasker only after you are satisfied with the work. Entering the code releases their payment immediately.\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`Task completion code`)}
      ${p(`Hi ${requesterName},`)}
      ${p(`Your task <strong>"${taskTitle}"</strong> is ready for completion. Share the code below with your tasker once you are satisfied with the work.`)}
      ${codeBlock(code)}
      ${note(`Only share this code after you have confirmed the task is complete to your satisfaction. Sharing it releases the tasker's payment immediately and cannot be reversed.`)}
    `, `Your completion code for "${taskTitle}" is: ${code}`),
  });

const sendRefundRequestEmail = (to, taskerName, requesterName, amount, reason, currency = 'NGN') =>
  send({
    to,
    subject: `Refund request from ${requesterName}`,
    text: `Hi ${taskerName},\n\n${requesterName} has requested a refund of ${amt(amount, currency)}.\n\nReason: ${reason}\n\nPlease respond within 48 hours: ${FRONTEND}/tasker\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`Refund request received`)}
      ${p(`Hi ${taskerName},`)}
      ${p(`<strong>${requesterName}</strong> has submitted a refund request for <strong>${amt(amount, currency)}</strong>.`)}
      ${note(`<strong>Reason given:</strong> ${reason}`)}
      ${p(`Please log in to your dashboard to review and respond to this request. You have <strong>48 hours</strong> to respond before it is escalated.`)}
      ${cta(`${FRONTEND}/tasker`, 'Respond to Request')}
    `, `${requesterName} requested a refund of ${amt(amount, currency)}.`),
  });

const sendTaskPaidEmail = (to, taskerName, taskTitle, amount, deadline, currency = 'NGN') =>
  send({
    to,
    subject: `Payment confirmed — start \"${taskTitle}\" now`,
    text: `Hi ${taskerName},\n\nGreat news! The requester has paid ${amt(amount, currency)} for the task \"${taskTitle}\".\n\nYour payment is held securely and will be released to your bank account when you complete the task.${deadline ? `\n\nDeadline: ${new Date(deadline).toDateString()}` : ''}\n\nLog in to view task details: ${FRONTEND}/tasker\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`Payment confirmed — your task is funded`)}
      ${p(`Hi ${taskerName},`)}
      ${p(`The requester has paid <strong>${amt(amount, currency)}</strong> for <strong>"${taskTitle}"</strong>. Your payment is held securely in escrow.`)}
      <table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;width:100%;border:1px solid #e2e2e2;">
        <tr>
          <td style="padding:12px 16px;background:#f9f9f9;font-size:13px;color:#555;font-family:${FONT};width:40%;">Amount</td>
          <td style="padding:12px 16px;font-size:15px;font-weight:700;color:#1a1a1a;font-family:${FONT};">${amt(amount, currency)}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;background:#f9f9f9;font-size:13px;color:#555;font-family:${FONT};border-top:1px solid #e2e2e2;">Task</td>
          <td style="padding:12px 16px;font-size:14px;color:#1a1a1a;font-family:${FONT};border-top:1px solid #e2e2e2;">${taskTitle}</td>
        </tr>
        ${deadline ? `<tr><td style="padding:12px 16px;background:#f9f9f9;font-size:13px;color:#555;font-family:${FONT};border-top:1px solid #e2e2e2;">Deadline</td><td style="padding:12px 16px;font-size:14px;font-weight:700;color:#e53e3e;font-family:${FONT};border-top:1px solid #e2e2e2;">${new Date(deadline).toDateString()}</td></tr>` : ''}
      </table>
      ${p(`Complete the task before the deadline, then ask the requester for their 6-digit completion code to release your payment instantly.`)}
      ${cta(`${FRONTEND}/tasker`, 'View Task')}
      ${note(`Payment is held securely until you enter the requester's completion code. Do not start unless you are confident you can complete by the deadline.`)}
    `, `Payment confirmed for "${taskTitle}". Start work now.`),
  });

const sendCancelRequestEmail = (to, taskerName, requesterName, taskTitle, reason) =>
  send({
    to,
    subject: `Task cancellation request — "${taskTitle}"`,
    text: `Hi ${taskerName},\n\n${requesterName} has requested to cancel the task "${taskTitle}".\n\nReason: ${reason}\n\nYou must approve or deny this request within 48 hours. If you approve, any held payment will be refunded to the requester.\n\nLog in to respond: ${FRONTEND}/tasker\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`Cancellation request for your task`)}
      ${p(`Hi ${taskerName},`)}
      ${p(`<strong>${requesterName}</strong> has requested to cancel the task <strong>"${taskTitle}"</strong>.`)}
      ${note(`<strong>Reason:</strong> ${reason}`)}
      ${p(`You have <strong>48 hours</strong> to approve or deny this cancellation. If you approve, any held payment will be refunded to the requester automatically.`)}
      ${cta(`${FRONTEND}/tasker`, 'Respond to Cancellation')}
    `, `${requesterName} requested to cancel "${taskTitle}". Your response needed.`),
  });

const sendNewTaskNearbyEmail = (to, taskerName, taskTitle, taskCity, taskState, budget_min, budget_max, deadline, taskId, currency = 'NGN', taskPath = null) => {
  const budgetStr = budget_min && budget_max
    ? `${amt(budget_min, currency)} – ${amt(budget_max, currency)}`
    : budget_max
      ? `Up to ${amt(budget_max, currency)}`
      : 'Open budget';
  const deadlineStr = deadline
    ? new Date(deadline).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : 'Flexible';
  const taskUrl = `${FRONTEND}${taskPath || `/tasks/${taskId}`}`;
  return send({
    to,
    subject: `New task in ${taskCity}: "${taskTitle}"`,
    text: `Hi ${taskerName},\n\nA new task has been posted in ${taskCity}, ${taskState}.\n\nTask: ${taskTitle}\nBudget: ${budgetStr}\nDeadline: ${deadlineStr}\n\nView and bid: ${taskUrl}\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`New task posted in ${taskCity}`)}
      ${p(`Hi ${taskerName},`)}
      ${p(`A new task has been posted in <strong>${taskCity}, ${taskState}</strong> that matches your service area.`)}
      <table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;width:100%;border:1px solid #e2e2e2;">
        <tr>
          <td style="padding:12px 16px;background:#f9f9f9;font-size:13px;color:#555;font-family:${FONT};width:30%;">Task</td>
          <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#1a1a1a;font-family:${FONT};">${taskTitle}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;background:#f9f9f9;font-size:13px;color:#555;font-family:${FONT};border-top:1px solid #e2e2e2;">Location</td>
          <td style="padding:12px 16px;font-size:14px;color:#1a1a1a;font-family:${FONT};border-top:1px solid #e2e2e2;">${taskCity}, ${taskState}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;background:#f9f9f9;font-size:13px;color:#555;font-family:${FONT};border-top:1px solid #e2e2e2;">Budget</td>
          <td style="padding:12px 16px;font-size:14px;color:#1a1a1a;font-family:${FONT};border-top:1px solid #e2e2e2;">${budgetStr}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;background:#f9f9f9;font-size:13px;color:#555;font-family:${FONT};border-top:1px solid #e2e2e2;">Deadline</td>
          <td style="padding:12px 16px;font-size:14px;color:#1a1a1a;font-family:${FONT};border-top:1px solid #e2e2e2;">${deadlineStr}</td>
        </tr>
      </table>
      ${cta(taskUrl, 'View Task and Bid')}
      <p style="margin:16px 0 0;font-size:12px;color:#888;font-family:${FONT};">You received this because your task city is set to ${taskCity}. Update it in your <a href="${FRONTEND}/tasker" style="color:#888;">dashboard settings</a>.</p>
    `, `New task in ${taskCity}: "${taskTitle}" — ${budgetStr}`),
  });
};

const sendKYCApprovedEmail = (to, name) =>
  send({
    to,
    subject: `KYC verified — enterprise tasks unlocked`,
    text: `Hi ${name},\n\nGreat news! Your KYC documents have been reviewed and verified by our team.\n\nYou now have full access to enterprise tasks on ${SITE_NAME}. Log in to your dashboard to start bidding on enterprise tasks.\n\nLog in: ${FRONTEND}/tasker\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`KYC Verified, ${name}`)}
      ${p(`Your KYC documents have been reviewed and approved by our team.`)}
      ${p(`You now have full access to <strong>enterprise tasks</strong> on ${SITE_NAME}. Head to your dashboard to browse and bid on available enterprise tasks.`)}
      ${cta(`${FRONTEND}/tasker`, 'Go to Dashboard')}
      ${note(`Enterprise tasks come from verified companies and organisations on the platform. Keep your profile up to date to increase your chances of selection.`)}
    `, `Your KYC is verified — enterprise tasks are now unlocked.`),
  });

const sendKYCRejectedEmail = (to, name, reason) =>
  send({
    to,
    subject: `Update on your KYC submission`,
    text: `Hi ${name},\n\nWe reviewed your KYC documents and were unable to verify them at this time.\n\n${reason ? `Reason: ${reason}\n\n` : ''}Please re-upload valid documents from your dashboard under KYC Verification and resubmit.\n\nLog in: ${FRONTEND}/tasker\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`KYC Submission Update`)}
      ${p(`Hi ${name}, we have reviewed your KYC documents and were unable to verify them at this time.`)}
      ${reason ? note(`<strong>Reason:</strong> ${reason}`) : ''}
      ${p(`Please log in to your dashboard, go to <strong>KYC Verification</strong>, and re-upload valid documents then resubmit.`)}
      ${cta(`${FRONTEND}/tasker`, 'Re-upload Documents')}
      ${p(`Accepted documents: National ID, Driver's License, or Passport plus a Proof of Address (utility bill or bank statement).`)}
    `, `Your KYC submission needs attention — please re-upload.`),
  });

const sendDirectApplicationEmail = (to, taskerName, requesterName, description) =>
  send({
    to,
    subject: `Task request from ${requesterName}`,
    text: `Hi ${taskerName},\n\n${requesterName} wants to hire you directly on ${SITE_NAME}.\n\n"${description.substring(0, 300)}${description.length > 300 ? '…' : ''}"\n\nView the request: ${FRONTEND}/tasker\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`Direct task request`)}
      ${p(`Hi ${taskerName},`)}
      ${p(`<strong>${requesterName}</strong> has sent you a direct task request on ${SITE_NAME}.`)}
      <blockquote style="margin:20px 0;padding:14px 16px;border-left:3px solid #e2e2e2;color:#555;font-family:${FONT};font-size:14px;line-height:1.6;">"${description.substring(0, 300)}${description.length > 300 ? '…' : ''}"</blockquote>
      ${cta(`${FRONTEND}/tasker`, 'View Request')}
    `, `${requesterName} sent you a direct task request.`),
  });

async function sendFeatureAnnouncementEmail(email, firstName, role) {
  const roleWord = role === 'tasker' ? 'tasker' : 'requester';
  const dashLink = role === 'tasker' ? `${FRONTEND}/tasker` : `${FRONTEND}/requester`;

  const features = [
    {
      title: 'Install Taskeeu on your phone as an app',
      desc: 'Taskeeu is now a Progressive Web App. Open the site on your phone, tap Share, then Add to Home Screen. It installs like a real app with no App Store needed — full-screen, fast, and works on Android and iPhone.',
    },
    {
      title: 'Marketing poster',
      desc: role === 'tasker'
        ? 'In your dashboard, go to the Marketing tab. Upload your photo, choose a circular or square frame, set your city, and download a professional poster to share on WhatsApp status, Instagram, and Twitter to attract clients.'
        : 'In your dashboard, go to the Marketing tab. Create a branded ambassador poster with your unique 4-pin code on it. Share it on social media — when people sign up using your code, you earn 10% commission on their completed tasks.',
    },
    {
      title: role === 'tasker' ? 'Your searchable profile link' : 'Your referral link',
      desc: role === 'tasker'
        ? 'You now have a profile link at taskeeu.com/tasker/yourusername. Share it on your WhatsApp bio, Instagram, and LinkedIn. Clients who tap it go straight to your profile and can hire you directly.'
        : 'Your referral link is in the Marketing tab. Share it anywhere — WhatsApp groups, Instagram bio, LinkedIn. Every person who signs up through your link and completes a paid task earns you commission.',
    },
    {
      title: 'Update your LinkedIn to Professional Tasker at Taskeeu',
      desc: role === 'tasker'
        ? 'Add Taskeeu to your LinkedIn profile under Experience — title: Independent Tasker. It signals to your network that you handle professional errands and logistics in your city. Paste your Taskeeu profile link as the company URL.'
        : 'Add Taskeeu Ambassador to your LinkedIn profile under Experience. It tells your network you are part of Nigeria\'s leading task outsourcing platform. Paste your referral link as the company URL.',
    },
    {
      title: 'Real-time chat with photo and voice notes',
      desc: 'Every task has a built-in chat between requester and tasker. You can send text, photos as evidence, and voice notes for quick instructions. No need to move to WhatsApp — everything stays on the platform and is protected.',
    },
    {
      title: 'Escrow-protected payments',
      desc: 'All task payments are held in escrow and only released when the requester confirms the job is done. Taskers get paid reliably. Requesters never lose money on uncompleted tasks. No cash handovers, no risk.',
    },
    {
      title: 'Refer and earn',
      desc: 'Invite others to join Taskeeu using your referral link or poster code. When someone you referred completes a paid task, you earn 10% commission deposited directly to your Refer Wallet — withdrawable to your Nigerian bank account.',
    },
  ];

  const featureRows = features.map(f =>
    `<div style="margin-bottom:22px;padding-bottom:22px;border-bottom:1px solid #f0f0f0;">
      <p style="margin:0 0 5px;font-weight:700;color:#1a1a1a;font-size:15px;">${f.title}</p>
      <p style="margin:0;color:#555;font-size:14px;line-height:1.65;">${f.desc}</p>
    </div>`
  ).join('');

  const content = `
    <p style="margin:0 0 6px;font-size:14px;color:#888;">Hi ${firstName},</p>
    <p style="margin:0 0 24px;font-weight:700;font-size:18px;color:#1a1a1a;line-height:1.3;">Here is what is new on Taskeeu — features built for you.</p>
    ${featureRows}
    <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.65;">All of these are live right now in your dashboard. Log in to try them.</p>
    <a href="${dashLink}" style="display:inline-block;background:#ff2d62;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:10px;">Open my dashboard</a>
    <p style="margin:24px 0 0;color:#888;font-size:13px;">The Taskeeu Team</p>
  `;

  return send({
    to: email,
    subject: `New on Taskeeu: install the app, create your poster, and start earning`,
    html: base(content, 'New features on Taskeeu you should know about'),
  });
}

// buildEmail(name, bodyHtml) — used by routes that build custom one-off emails
// Takes recipient first name and inner HTML; wraps in the standard transactional template.
const buildEmail = (name, bodyHtml) => base(
  `<p style="margin:0 0 16px;font-size:16px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a1a;">Hi ${name},</p>${bodyHtml}`,
  ''
);

const sendPasswordResetEmail = (to, name, token, role) => {
  const resetUrl = `${FRONTEND}/auth/reset-password?token=${encodeURIComponent(token)}&role=${role}`;
  return send({
    to,
    subject: `Reset your password — ${SITE_NAME}`,
    text: `Hi ${name},\n\nWe received a request to reset your ${SITE_NAME} password.\n\nClick the link below to set a new password:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.\n\n— ${SITE_NAME} Team`,
    html: base(`
      ${h(`Reset your password, ${name}`)}
      ${p(`We received a request to reset the password for your ${SITE_NAME} account (${to}).`)}
      ${cta(resetUrl, 'Reset My Password')}
      ${note(`This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will not change.`)}
      ${divider()}
      <p style="margin:0;font-size:13px;color:#888;font-family:${FONT};">If the button above does not work, copy and paste this link into your browser:<br/><span style="color:#555;">${resetUrl}</span></p>
    `, 'Reset your Taskeeu password'),
  });
};

module.exports = {
  sendEmail: send,
  sendBidNotSelectedEmail,
  sendTaskCancelledToBidderEmail,
  buildEmail,
  sendWelcomeEmail,
  sendRequesterVerificationEmail,
  sendTaskerWelcomeEmail,
  sendTaskerApprovedEmail,
  sendTaskerRejectedEmail,
  sendNewBidEmail,
  sendBidAcceptedEmail,
  sendBidRejectedEmail,
  sendNewMessageEmail,
  sendProofUploadedEmail,
  sendPaymentSentEmail,
  sendTaskCompletionCodeEmail,
  sendRefundRequestEmail,
  sendTaskPaidEmail,
  sendCancelRequestEmail,
  sendDirectApplicationEmail,
  sendNewTaskNearbyEmail,
  sendKYCApprovedEmail,
  sendKYCRejectedEmail,
  sendFeatureAnnouncementEmail,
  sendPasswordResetEmail,
};
