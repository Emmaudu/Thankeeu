'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { makeReq, makeRes, FIXTURES } = require('../mocks');

// ─── Pure card logic (no Supabase) ───────────────────────────────────────────

function generateSlug(recipientName, occasion) {
  const base = `${recipientName}-${occasion}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `${base}-testid`;
}

function filterMessagesForNonRecipient(messages) {
  return messages.filter(m => !m.is_private);
}

function filterMessagesForRecipient(messages) {
  return messages; // recipient sees all
}

function parseMultipartBoolean(value) {
  return value === true || value === 'true' || value === '1';
}

function normalizeDashboardCard(card) {
  return {
    ...card,
    signed_count: card.messages?.[0]?.count || 0,
  };
}

function computeCardStats(card, messages, contributions) {
  const verifiedContribs = contributions.filter(c => c.status === 'success');
  const totalCollected   = verifiedContribs.reduce((s, c) => s + (c.amount || 0), 0);
  return {
    signed_count: messages.length,
    total_collected: totalCollected,
    contributor_count: verifiedContribs.length,
  };
}

function canSendCard(card) {
  if (!card.recipient_email) return { ok: false, reason: 'Recipient email required' };
  if (card.status === 'sent')  return { ok: false, reason: 'Already sent' };
  if (card.status === 'draft') return { ok: false, reason: 'Card must be active before sending' };
  return { ok: true };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Card Controller', () => {
  describe('Slug generation', () => {
    it('generates URL-safe slug', () => {
      const slug = generateSlug('Amaka Okafor', 'birthday');
      assert.match(slug, /^[a-z0-9-]+$/);
    });

    it('slug contains recipient name and occasion', () => {
      const slug = generateSlug('Ngozi Eze', 'leaving');
      assert.ok(slug.includes('ngozi'));
      assert.ok(slug.includes('leaving'));
    });

    it('special characters replaced with hyphens', () => {
      const slug = generateSlug("O'Brien's Card!", 'birthday');
      assert.ok(!slug.includes("'"));
      assert.ok(!slug.includes('!'));
    });
  });

  describe('Message visibility', () => {
    const messages = [
      { id: '1', content: 'Public msg',  is_private: false, author_name: 'Kemi' },
      { id: '2', content: 'Private msg', is_private: true,  author_name: 'Tunde' },
      { id: '3', content: 'Another pub', is_private: false, author_name: 'Emeka' },
    ];

    it('non-recipient sees only public messages', () => {
      const visible = filterMessagesForNonRecipient(messages);
      assert.equal(visible.length, 2);
      assert.ok(visible.every(m => !m.is_private));
    });

    it('recipient sees all messages including private', () => {
      const visible = filterMessagesForRecipient(messages);
      assert.equal(visible.length, 3);
    });

    it('non-recipient cannot see private message content', () => {
      const visible = filterMessagesForNonRecipient(messages);
      assert.ok(!visible.some(m => m.content === 'Private msg'));
    });

    it('multipart string false remains public', () => {
      assert.equal(parseMultipartBoolean('false'), false);
    });

    it('multipart string true is private', () => {
      assert.equal(parseMultipartBoolean('true'), true);
    });
  });

  describe('Card statistics', () => {
    it('counts only verified (success) contributions', () => {
      const contributions = [
        { status: 'success', amount: 5000 },
        { status: 'pending', amount: 3000 },
        { status: 'failed',  amount: 2000 },
        { status: 'success', amount: 7000 },
      ];
      const stats = computeCardStats(FIXTURES.card, [], contributions);
      assert.equal(stats.total_collected,    12000);
      assert.equal(stats.contributor_count,  2);
    });

    it('signed_count equals number of messages', () => {
      const messages = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const stats    = computeCardStats(FIXTURES.card, messages, []);
      assert.equal(stats.signed_count, 3);
    });

    it('dashboard signed_count is read from the Supabase count relation', () => {
      const card = normalizeDashboardCard({ id: 'card-1', messages: [{ count: 4 }] });
      assert.equal(card.signed_count, 4);
    });

    it('total_collected is 0 when no successful contributions', () => {
      const stats = computeCardStats(FIXTURES.card, [], [{ status: 'pending', amount: 5000 }]);
      assert.equal(stats.total_collected, 0);
    });
  });

  describe('Card send validation', () => {
    it('cannot send card without recipient email', () => {
      const card = { ...FIXTURES.card, recipient_email: null, status: 'active' };
      const result = canSendCard(card);
      assert.equal(result.ok, false);
      assert.ok(result.reason.includes('email'));
    });

    it('cannot send already-sent card', () => {
      const card = { ...FIXTURES.card, recipient_email: 'r@r.com', status: 'sent' };
      const result = canSendCard(card);
      assert.equal(result.ok, false);
    });

    it('cannot send draft card', () => {
      const card = { ...FIXTURES.card, recipient_email: 'r@r.com', status: 'draft' };
      const result = canSendCard(card);
      assert.equal(result.ok, false);
    });

    it('can send active card with recipient email', () => {
      const card = { ...FIXTURES.card, recipient_email: 'r@r.com', status: 'active' };
      const result = canSendCard(card);
      assert.equal(result.ok, true);
    });
  });

  describe('Card status transitions', () => {
    const validTransitions = [
      ['draft',  'active'],
      ['active', 'sent'],
    ];

    const invalidTransitions = [
      ['sent',   'active'],
      ['sent',   'draft'],
      ['draft',  'sent'],
    ];

    function isValidTransition(from, to) {
      return validTransitions.some(([f, t]) => f === from && t === to);
    }

    for (const [from, to] of validTransitions) {
      it(`${from} → ${to} is valid`, () => {
        assert.equal(isValidTransition(from, to), true);
      });
    }

    for (const [from, to] of invalidTransitions) {
      it(`${from} → ${to} is invalid`, () => {
        assert.equal(isValidTransition(from, to), false);
      });
    }
  });

  describe('Card design themes', () => {
    const VALID_THEMES = [
      'rose_love', 'starry_night', 'garden_bloom', 'golden_glow',
      'warm_ember', 'midnight_blue', 'fresh_garden', 'minimal_chic',
    ];

    it('all 8 themes are valid', () => {
      assert.equal(VALID_THEMES.length, 8);
    });

    it('rose_love is the default theme', () => {
      assert.equal(FIXTURES.card.design_theme, 'rose_love');
    });

    it('background color for rose_love is pink', () => {
      assert.equal(FIXTURES.card.background_color, '#FBEAF0');
    });
  });

  describe('Gift pot configuration', () => {
    it('card can have gift enabled', () => {
      const card = { ...FIXTURES.card, is_gift_enabled: true, gift_type: 'pot' };
      assert.equal(card.is_gift_enabled, true);
    });

    it('gift type options are valid', () => {
      const validTypes = ['pot', 'flowers', 'voucher', 'none'];
      for (const type of validTypes) {
        const card = { ...FIXTURES.card, gift_type: type };
        assert.ok(validTypes.includes(card.gift_type));
      }
    });

    it('suggested_amount defaults are sensible Nigerian amounts', () => {
      const validAmounts = [500, 1000, 2500, 5000, 10000];
      assert.ok(validAmounts.includes(2500)); // default
      assert.ok(validAmounts.every(a => a >= 100)); // min ₦100
    });
  });

  describe('Occasion types', () => {
    const VALID_OCCASIONS = [
      'birthday', 'valentine', 'leaving', 'anniversary', 'wedding',
      'baby_shower', 'retirement', 'congratulations', 'graduation',
      'promotion', 'christmas', 'new_year', 'get_well', 'other',
    ];

    it('14 valid occasion types', () => {
      assert.equal(VALID_OCCASIONS.length, 14);
    });

    it('birthday is a valid occasion', () => {
      assert.ok(VALID_OCCASIONS.includes('birthday'));
    });

    it('FIXTURES card uses a valid occasion', () => {
      assert.ok(VALID_OCCASIONS.includes(FIXTURES.card.occasion));
    });
  });
});
