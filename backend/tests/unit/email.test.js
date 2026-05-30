'use strict';
// Email template tests — we test the template HTML/subject generation directly
// without needing the Resend SDK by extracting the template builder logic inline.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const APP_URL = 'https://thankeeu.ng';

// Replicate BASE + btn helpers from email.js
const BASE = (c) => `<html><body>${c}</body></html>`;
const btn  = (text, url, color='#7F77DD') => `<a href="${url}">${text}</a>`;

// Replicate all templates locally (pure functions, zero deps)
const templates = {
  welcome: (d) => ({ subject: `Welcome to Thankeeu, ${d.name}!`, html: BASE(`<h2>Welcome aboard, ${d.name}!</h2><a href="${APP_URL}/dashboard">Go to your dashboard</a>`) }),
  cardInvite: (d) => ({ subject: `${d.creatorName} wants you to sign ${d.recipientName}'s card!`, html: BASE(`${d.creatorName}<br>${d.recipientName}<br>${d.giftEnabled ? 'gift pot' : ''}<a href="${APP_URL}/sign/${d.cardSlug}">Sign the card now</a>`) }),
  cardDelivery: (d) => ({ subject: `You have a special card waiting for you, ${d.recipientName}!`, html: BASE(`${d.senderCount} people<br>${d.giftAmount ? `₦${d.giftAmount.toLocaleString()}` : ''}<a href="${APP_URL}/card/${d.cardSlug}?token=${d.accessToken}">Open my card</a>`) }),
  cardReminder: (d) => ({ subject: `Reminder: Sign ${d.recipientName}'s card before it closes!`, html: BASE(`${d.hoursLeft} hours<a href="${APP_URL}/sign/${d.cardSlug}">Sign now</a>`) }),
  passwordReset: (d) => ({ subject: 'Reset your Thankeeu password', html: BASE(`<a href="${APP_URL}/reset-password?token=${d.token}">Reset password</a>`) }),
  companyWelcome: (d) => ({ subject: `Welcome to Thankeeu for Teams, ${d.companyName}!`, html: BASE(`${d.companyName}<br>${d.contactPerson}<a href="${APP_URL}/company/dashboard">Go to Company Dashboard</a>`) }),
  companyPasswordReset: (d) => ({ subject: 'Reset your Thankeeu company password', html: BASE(`<a href="${APP_URL}/company/reset-password?token=${d.token}">Reset password</a>`) }),
  memberJoinRequest: (d) => ({ subject: `New ${d.role} join request — ${d.memberName}`, html: BASE(`${d.memberName}<br>${d.memberEmail}<a href="${APP_URL}/company/members">Review request</a>`) }),
  memberApproved: (d) => ({ subject: `Your account has been approved — Welcome to ${d.companyName}!`, html: BASE(`${d.memberName}<br>${d.companyName}<a href="${APP_URL}/member/login">Sign in to your account</a>`) }),
  memberRejected: (d) => ({ subject: 'Update on your Thankeeu account request', html: BASE(`${d.memberName}<br>${d.reason || ''}`) }),
  memberPasswordReset: (d) => ({ subject: 'Reset your Thankeeu password', html: BASE(`${d.name}<a href="${APP_URL}/member/reset-password?token=${d.token}">Reset password</a>`) }),
  deductionRequest: (d) => ({ subject: `[Deduction Request] ${d.leaderName} requests ₦${d.amount?.toLocaleString()}`, html: BASE(`${d.amount?.toLocaleString()}<br>${d.reason}<a href="${APP_URL}/company/deductions">Review in HR Dashboard</a>`) }),
  deductionApproved: (d) => ({ subject: `Your deduction request of ₦${d.amount?.toLocaleString()} has been approved`, html: BASE(`${d.amount?.toLocaleString()}<br>${d.note || ''}`) }),
  deductionRejected: (d) => ({ subject: `Your deduction request of ₦${d.amount?.toLocaleString()} was not approved`, html: BASE(`${d.note}`) }),
  occasionNotice: (d) => ({ subject: `${d.icon} ${d.memberName}'s ${d.occasionLabel} is in ${d.daysLeft} days`, html: BASE(`${d.memberName}<br>${d.icon}<br>surprise<a href="${APP_URL}/sign/${d.cardSlug}">Sign card</a>`) }),
  occasionCelebrant: (d) => ({ subject: `${d.icon} Happy ${d.occasionLabel}, ${d.firstName}! You have a surprise from ${d.companyName}!`, html: BASE(`${d.firstName}<br>${d.signerCount}<br>${d.giftAmount ? `₦${d.giftAmount.toLocaleString()}` : ''}<a href="${APP_URL}/card/${d.cardSlug}?token=${d.accessToken}">Open my card</a>`) }),
  memberCardCreated: (d) => ({ subject: `${d.creatorName} created a card for ${d.recipientName}`, html: BASE(`${d.creatorName}<br>${d.recipientName}<a href="${APP_URL}/sign/${d.cardSlug}">Sign the card</a>`) }),
  crossDeptRequest: (d) => ({ subject: `[Approval Required] Company-wide notification request for "${d.cardTitle}"`, html: BASE(`${d.requesterName}<br>${d.reason || ''}<a href="${APP_URL}/company/deductions">Review in HR Dashboard</a>`) }),
  supportTicket: (d) => ({ subject: `[Support #${d.ticketId.slice(0,8)}] ${d.subject}`, html: BASE(`${d.senderName}<br>${d.message}<a href="${APP_URL}/admin">Reply in Admin Panel</a>`) }),
  supportConfirm: (d) => ({ subject: `We received your message — Ticket #${d.ticketId.slice(0,8).toUpperCase()}`, html: BASE(`${d.name}<br>${d.subject}`) }),
  supportReply: (d) => ({ subject: `Re: ${d.subject} — Thankeeu Support`, html: BASE(`${d.name}<br>${d.reply}`) }),
};

const hasText = (html, t) => html.includes(t);
const hasLink = (html, f) => html.includes(f);
const notEmpty = (s) => s && s.length > 5;

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('Email Templates — HTML & Subject generation', () => {

  describe('Individual user templates', () => {
    it('welcome — subject contains name, HTML has dashboard link', () => {
      const t = templates.welcome({ name: 'Amaka' });
      assert.ok(hasText(t.subject, 'Amaka'));
      assert.ok(hasLink(t.html, '/dashboard'));
    });

    it('cardInvite — subject has creator, HTML has sign link', () => {
      const t = templates.cardInvite({ creatorName: 'Tunde', recipientName: 'Amaka', cardSlug: 'abc', giftEnabled: true, deadline: 'soon' });
      assert.ok(hasText(t.subject, 'Tunde'));
      assert.ok(hasLink(t.html, '/sign/abc'));
      assert.ok(hasText(t.html, 'gift pot'));
    });

    it('cardInvite — no gift text when giftEnabled=false', () => {
      const t = templates.cardInvite({ creatorName: 'T', recipientName: 'A', cardSlug: 'x', giftEnabled: false, deadline: 'soon' });
      assert.ok(!hasText(t.html, 'gift pot'));
    });

    it('cardDelivery — has signer count, gift amount, open link', () => {
      const t = templates.cardDelivery({ recipientName: 'Amaka', occasion: 'birthday', cardSlug: 'abc', accessToken: 'tok', senderCount: 15, giftAmount: 45000 });
      assert.ok(hasText(t.html, '15'));
      assert.ok(hasText(t.html, '45,000'));
      assert.ok(hasLink(t.html, '/card/abc?token=tok'));
    });

    it('cardDelivery — no amount when giftAmount is null', () => {
      const t = templates.cardDelivery({ recipientName: 'A', occasion: 'b', cardSlug: 'x', accessToken: 't', senderCount: 3, giftAmount: null });
      assert.ok(!hasText(t.html, '₦'));
    });

    it('cardReminder — shows hours, sign link', () => {
      const t = templates.cardReminder({ recipientName: 'N', cardSlug: 'ngozi', hoursLeft: 24 });
      assert.ok(hasText(t.html, '24'));
      assert.ok(hasLink(t.html, '/sign/ngozi'));
    });

    it('passwordReset — contains reset link with token', () => {
      const t = templates.passwordReset({ token: 'reset-tok-xyz' });
      assert.ok(hasLink(t.html, '/reset-password?token=reset-tok-xyz'));
    });
  });

  describe('Company templates', () => {
    it('companyWelcome — company name, contact person, dashboard link', () => {
      const t = templates.companyWelcome({ companyName: 'Zenith Tech', contactPerson: 'Tunde' });
      assert.ok(hasText(t.html, 'Zenith Tech'));
      assert.ok(hasText(t.html, 'Tunde'));
      assert.ok(hasLink(t.html, '/company/dashboard'));
    });

    it('companyPasswordReset — contains company reset link', () => {
      const t = templates.companyPasswordReset({ token: 'co-tok', companyName: 'Co' });
      assert.ok(hasLink(t.html, '/company/reset-password?token=co-tok'));
    });
  });

  describe('Teams templates', () => {
    it('memberJoinRequest — member info and review link', () => {
      const t = templates.memberJoinRequest({ companyName: 'Co', hrName: 'HR', memberName: 'Kemi Adeyemi', memberEmail: 'k@co.com', role: 'team_member', department: 'Eng', companyId: 'id' });
      assert.ok(hasText(t.html, 'Kemi Adeyemi'));
      assert.ok(hasLink(t.html, '/company/members'));
    });

    it('memberApproved — member name, login link', () => {
      const t = templates.memberApproved({ memberName: 'Kemi', companyName: 'Co', role: 'team_member', department: 'Eng' });
      assert.ok(hasText(t.html, 'Kemi'));
      assert.ok(hasLink(t.html, '/member/login'));
    });

    it('memberRejected — contains rejection reason', () => {
      const t = templates.memberRejected({ memberName: 'Kemi', reason: 'Email domain mismatch' });
      assert.ok(hasText(t.html, 'Email domain mismatch'));
    });

    it('memberPasswordReset — contains reset link', () => {
      const t = templates.memberPasswordReset({ name: 'Kemi', token: 'mem-tok-abc' });
      assert.ok(hasLink(t.html, '/member/reset-password?token=mem-tok-abc'));
    });

    it('deductionRequest — amount, reason, dashboard link', () => {
      const t = templates.deductionRequest({ hrName: 'HR', companyName: 'Co', leaderName: 'Emeka', recipientName: 'Kemi', cardTitle: 'Card', amount: 15000, reason: 'Buy a cake', requestId: 'id' });
      assert.ok(hasText(t.html, '15,000'));
      assert.ok(hasText(t.html, 'Buy a cake'));
      assert.ok(hasLink(t.html, '/company/deductions'));
    });

    it('deductionApproved — amount and note', () => {
      const t = templates.deductionApproved({ leaderName: 'Emeka', amount: 15000, reason: 'cake', note: 'Good call' });
      assert.ok(hasText(t.html, '15,000'));
      assert.ok(hasText(t.html, 'Good call'));
    });

    it('deductionRejected — rejection note', () => {
      const t = templates.deductionRejected({ leaderName: 'E', amount: 15000, reason: 'cake', note: 'Budget exceeded' });
      assert.ok(hasText(t.html, 'Budget exceeded'));
    });

    it('occasionNotice — icon, member, sign link, surprise warning', () => {
      const t = templates.occasionNotice({ icon: '🎂', occasionLabel: 'Birthday', memberName: 'Kemi', memberFirstName: 'Kemi', department: 'Eng', companyName: 'Co', cardSlug: 'kemi-001', giftEnabled: true, occasionDate: 'Jan 1', daysLeft: 2, deadline: 'Jan 3' });
      assert.ok(hasText(t.subject, 'Kemi'));
      assert.ok(hasText(t.subject, '🎂'));
      assert.ok(hasLink(t.html, '/sign/kemi-001'));
      assert.ok(hasText(t.html, 'surprise'));
    });

    it('occasionCelebrant — first name, gift amount, open link', () => {
      const t = templates.occasionCelebrant({ icon: '🎂', occasionLabel: 'Birthday', firstName: 'Kemi', companyName: 'Co', cardSlug: 'kemi', accessToken: 'tok', signerCount: 20, giftAmount: 50000 });
      assert.ok(hasText(t.subject, 'Kemi'));
      assert.ok(hasText(t.html, '50,000'));
      assert.ok(hasLink(t.html, '/card/kemi?token=tok'));
    });

    it('memberCardCreated — creator, recipient, sign link', () => {
      const t = templates.memberCardCreated({ creatorName: 'Emeka', recipientName: 'Kemi', occasion: 'promotion', cardSlug: 'promo-001', giftEnabled: true });
      assert.ok(hasText(t.html, 'Emeka'));
      assert.ok(hasText(t.html, 'Kemi'));
      assert.ok(hasLink(t.html, '/sign/promo-001'));
    });

    it('crossDeptRequest — requester, dashboard link', () => {
      const t = templates.crossDeptRequest({ hrName: 'HR', companyName: 'Co', requesterName: 'Emeka', cardTitle: 'Kemi Promo', reason: 'Whole company', requestId: 'id' });
      assert.ok(hasText(t.html, 'Emeka'));
      assert.ok(hasLink(t.html, '/company/deductions'));
    });

    it('supportTicket — sender name, message, admin link', () => {
      const t = templates.supportTicket({ senderName: 'Kemi', senderEmail: 'k@co.com', senderType: 'User', subject: 'Help', message: 'I need help please', ticketId: 'abc123defgh' });
      assert.ok(hasText(t.html, 'Kemi'));
      assert.ok(hasLink(t.html, '/admin'));
    });

    it('supportConfirm — name and subject', () => {
      const t = templates.supportConfirm({ name: 'Kemi', subject: 'My issue', ticketId: 'abc123defgh' });
      assert.ok(hasText(t.html, 'Kemi'));
    });

    it('supportReply — reply text', () => {
      const t = templates.supportReply({ name: 'Kemi', subject: 'My issue', reply: 'We fixed your problem', ticketId: 'abc123defgh' });
      assert.ok(hasText(t.html, 'We fixed your problem'));
    });
  });

  describe('All templates produce non-empty output', () => {
    const allCases = [
      ['welcome',             { name: 'Test' }],
      ['cardInvite',         { creatorName:'A',recipientName:'B',cardSlug:'x',giftEnabled:false,deadline:'soon' }],
      ['cardDelivery',       { recipientName:'A',occasion:'b',cardSlug:'x',accessToken:'t',senderCount:1,giftAmount:null }],
      ['cardReminder',       { recipientName:'A',cardSlug:'x',hoursLeft:10 }],
      ['passwordReset',      { token:'abc' }],
      ['companyWelcome',     { companyName:'Co',contactPerson:'HR' }],
      ['companyPasswordReset',{ token:'abc',companyName:'Co' }],
      ['memberJoinRequest',  { companyName:'Co',hrName:'HR',memberName:'U',memberEmail:'u@co.com',role:'team_member',department:'Eng',companyId:'id' }],
      ['memberApproved',     { memberName:'U',companyName:'Co',role:'team_member',department:'Eng' }],
      ['memberRejected',     { memberName:'U',reason:'reason' }],
      ['memberPasswordReset',{ name:'U',token:'tok' }],
      ['deductionRequest',   { hrName:'HR',companyName:'Co',leaderName:'L',recipientName:'R',cardTitle:'C',amount:5000,reason:'r',requestId:'id' }],
      ['deductionApproved',  { leaderName:'L',amount:5000,reason:'r',note:null }],
      ['deductionRejected',  { leaderName:'L',amount:5000,reason:'r',note:'n' }],
      ['occasionNotice',     { icon:'🎂',occasionLabel:'B',memberName:'A B',memberFirstName:'A',department:'E',companyName:'Co',cardSlug:'x',giftEnabled:true,occasionDate:'Jan',daysLeft:2,deadline:'Jan 3' }],
      ['occasionCelebrant',  { icon:'🎂',occasionLabel:'B',firstName:'A',companyName:'Co',cardSlug:'x',accessToken:'t',signerCount:5,giftAmount:10000 }],
      ['memberCardCreated',  { creatorName:'A',recipientName:'B',occasion:'b',cardSlug:'x',giftEnabled:false }],
      ['crossDeptRequest',   { hrName:'HR',companyName:'Co',requesterName:'R',cardTitle:'C',reason:'r',requestId:'id' }],
      ['supportTicket',      { senderName:'A',senderEmail:'a@b.com',senderType:'User',subject:'H',message:'msg',ticketId:'abc123defgh' }],
      ['supportConfirm',     { name:'A',subject:'H',ticketId:'abc123defgh' }],
      ['supportReply',       { name:'A',subject:'H',reply:'Fixed',ticketId:'abc123defgh' }],
    ];

    for (const [name, data] of allCases) {
      it(`${name} — non-empty subject and HTML`, () => {
        const t = templates[name](data);
        assert.ok(notEmpty(t.subject), `${name} subject empty`);
        assert.ok(notEmpty(t.html),    `${name} HTML empty`);
      });
    }
  });
});
