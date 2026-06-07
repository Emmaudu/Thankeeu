'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const { FIXTURES } = require('../mocks');

// ─── Pure payment logic ───────────────────────────────────────────────────────
const PLAN_AMOUNTS = {
  single: { kobo: 500000,    naira: 5000    },
  pack5:  { kobo: 2000000,   naira: 20000   },
  monthly:{ kobo: 20000000,  naira: 200000  },
  yearly: { kobo: 240000000, naira: 2400000 },
};

const PLAN_CREDITS = { single: 1, pack5: 5, business: 999 };

function initializePayment(plan, email) {
  const planData = PLAN_AMOUNTS[plan];
  if (!planData) return { error: `Invalid plan type: ${plan}` };
  return {
    email,
    amount: planData.kobo,
    metadata: { plan_type: plan, type: 'card_purchase' },
  };
}

function verifyWebhookSignature(body, signature, secret) {
  const hash = crypto.createHmac('sha512', secret)
    .update(typeof body === 'string' ? body : JSON.stringify(body))
    .digest('hex');
  return hash === signature;
}

function processChargeSuccess(metadata) {
  const { type, plan_type, contribution_id, user_id, card_id, card_slug } = metadata;
  if (type === 'card_purchase') {
    if (card_slug) return { action: 'activate_card', userId: user_id, cardSlug: card_slug };
    const credits = PLAN_CREDITS[plan_type] || 1;
    return { action: 'add_credits', userId: user_id, credits };
  }
  if (type === 'gift_contribution') {
    return { action: 'verify_contribution', contributionId: contribution_id, cardId: card_id };
  }
  if (type === 'company_subscription') {
    return { action: 'activate_subscription', companyId: metadata.company_id, plan: plan_type };
  }
  return { action: 'unknown' };
}

function calculateContributionFeeGross(amountNaira) {
  // Platform takes 4% cut from gift contributions
  return Math.round(amountNaira * 0.04);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Payment Controller', () => {

  describe('Plan amounts (Paystack uses kobo)', () => {
    it('single card = ₦5,000 = 500,000 kobo', () => {
      assert.equal(PLAN_AMOUNTS.single.kobo,  500000);
      assert.equal(PLAN_AMOUNTS.single.naira, 5000);
      assert.equal(PLAN_AMOUNTS.single.kobo / 100, PLAN_AMOUNTS.single.naira);
    });

    it('pack of 5 = ₦20,000 = 2,000,000 kobo', () => {
      assert.equal(PLAN_AMOUNTS.pack5.kobo,  2000000);
      assert.equal(PLAN_AMOUNTS.pack5.naira, 20000);
    });

    it('monthly subscription = ₦200,000 = 20,000,000 kobo', () => {
      assert.equal(PLAN_AMOUNTS.monthly.kobo,  20000000);
      assert.equal(PLAN_AMOUNTS.monthly.naira, 200000);
    });

    it('yearly subscription = ₦2,400,000 = 240,000,000 kobo', () => {
      assert.equal(PLAN_AMOUNTS.yearly.kobo,  240000000);
      assert.equal(PLAN_AMOUNTS.yearly.naira, 2400000);
    });

    it('pack5 is ₦4,000/card (₦20,000 / 5)', () => {
      assert.equal(PLAN_AMOUNTS.pack5.naira / 5, 4000);
    });

    it('pack5 saves ₦5,000 vs 5 single cards', () => {
      const savings = (PLAN_AMOUNTS.single.naira * 5) - PLAN_AMOUNTS.pack5.naira;
      assert.equal(savings, 5000);
    });
  });

  describe('Plan credits', () => {
    it('single plan gives 1 credit', () => {
      assert.equal(PLAN_CREDITS.single, 1);
    });

    it('pack5 gives 5 credits', () => {
      assert.equal(PLAN_CREDITS.pack5, 5);
    });

    it('business gives 999 credits (unlimited)', () => {
      assert.equal(PLAN_CREDITS.business, 999);
    });
  });

  describe('initializePayment()', () => {
    it('returns correct amount in kobo for single plan', () => {
      const result = initializePayment('single', 'user@test.com');
      assert.equal(result.amount, 500000);
      assert.equal(result.email,  'user@test.com');
    });

    it('rejects invalid plan type', () => {
      const result = initializePayment('premium', 'user@test.com');
      assert.ok(result.error);
    });

    it('metadata contains plan_type', () => {
      const result = initializePayment('pack5', 'user@test.com');
      assert.equal(result.metadata.plan_type, 'pack5');
    });

    it('metadata type is card_purchase for individual plans', () => {
      const result = initializePayment('single', 'user@test.com');
      assert.equal(result.metadata.type, 'card_purchase');
    });
  });

  describe('Webhook signature verification', () => {
    const secret  = 'test-webhook-secret';
    const payload = { event: 'charge.success', data: { reference: 'ref-123' } };

    it('valid signature passes verification', () => {
      const bodyStr = JSON.stringify(payload);
      const sig     = crypto.createHmac('sha512', secret).update(bodyStr).digest('hex');
      assert.equal(verifyWebhookSignature(bodyStr, sig, secret), true);
    });

    it('wrong signature fails verification', () => {
      const sig = 'wrong-signature-value';
      assert.equal(verifyWebhookSignature(payload, sig, secret), false);
    });

    it('signature from different secret fails', () => {
      const bodyStr = JSON.stringify(payload);
      const sig     = crypto.createHmac('sha512', 'different-secret').update(bodyStr).digest('hex');
      assert.equal(verifyWebhookSignature(bodyStr, sig, secret), false);
    });

    it('tampered body fails verification', () => {
      const bodyStr  = JSON.stringify(payload);
      const sig      = crypto.createHmac('sha512', secret).update(bodyStr).digest('hex');
      const tampered = JSON.stringify({ ...payload, evil: true });
      assert.equal(verifyWebhookSignature(tampered, sig, secret), false);
    });
  });

  describe('processChargeSuccess() webhook handling', () => {
    it('card purchase with a slug activates that card', () => {
      const result = processChargeSuccess({
        type: 'card_purchase',
        plan_type: 'single',
        user_id: 'uid-001',
        card_slug: 'ada-birthday-123'
      });
      assert.equal(result.action, 'activate_card');
      assert.equal(result.cardSlug, 'ada-birthday-123');
    });

    it('card_purchase → adds credits to user', () => {
      const meta   = { type: 'card_purchase', plan_type: 'single', user_id: 'uid-001' };
      const result = processChargeSuccess(meta);
      assert.equal(result.action,  'add_credits');
      assert.equal(result.userId,  'uid-001');
      assert.equal(result.credits, 1);
    });

    it('card_purchase pack5 → adds 5 credits', () => {
      const meta   = { type: 'card_purchase', plan_type: 'pack5', user_id: 'uid-001' };
      const result = processChargeSuccess(meta);
      assert.equal(result.credits, 5);
    });

    it('gift_contribution → verifies contribution', () => {
      const meta   = { type: 'gift_contribution', contribution_id: 'contrib-001', card_id: 'card-001' };
      const result = processChargeSuccess(meta);
      assert.equal(result.action,         'verify_contribution');
      assert.equal(result.contributionId, 'contrib-001');
    });

    it('company_subscription → activates subscription', () => {
      const meta   = { type: 'company_subscription', company_id: 'co-001', plan_type: 'monthly' };
      const result = processChargeSuccess(meta);
      assert.equal(result.action,    'activate_subscription');
      assert.equal(result.companyId, 'co-001');
      assert.equal(result.plan,      'monthly');
    });

    it('unknown type → unknown action (no crash)', () => {
      const meta   = { type: 'some_future_type' };
      const result = processChargeSuccess(meta);
      assert.equal(result.action, 'unknown');
    });
  });

  describe('Gift contribution platform cut (4%)', () => {
    it('4% cut on ₦5,000 contribution = ₦200', () => {
      assert.equal(calculateContributionFeeGross(5000), 200);
    });

    it('4% cut on ₦10,000 = ₦400', () => {
      assert.equal(calculateContributionFeeGross(10000), 400);
    });

    it('4% cut on ₦2,500 = ₦100', () => {
      assert.equal(calculateContributionFeeGross(2500), 100);
    });

    it('cut rounds to nearest whole number', () => {
      const cut = calculateContributionFeeGross(333);
      assert.equal(cut, Math.round(333 * 0.04));
    });
  });

  describe('Subscription period calculation', () => {
    function getExpiryDate(plan) {
      const now = new Date();
      if (plan === 'yearly') {
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      }
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }

    it('monthly subscription expires ~30 days from now', () => {
      const expiry = getExpiryDate('monthly');
      const diff   = expiry - new Date();
      const days   = diff / (1000 * 60 * 60 * 24);
      assert.ok(days >= 28 && days <= 31);
    });

    it('yearly subscription expires ~365 days from now', () => {
      const expiry = getExpiryDate('yearly');
      const diff   = expiry - new Date();
      const days   = diff / (1000 * 60 * 60 * 24);
      assert.ok(days >= 364 && days <= 367);
    });

    it('yearly expires later than monthly', () => {
      const monthly = getExpiryDate('monthly');
      const yearly  = getExpiryDate('yearly');
      assert.ok(yearly > monthly);
    });
  });
});
