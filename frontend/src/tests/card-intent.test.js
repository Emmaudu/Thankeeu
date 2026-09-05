/**
 * The homepage type-to-create parser.
 *
 * These are written against sentences a real customer would type, including
 * Nigerian phrasing, rather than tidy synthetic input. The parser is allowed to
 * return *nothing* for a field — what it is not allowed to do is return
 * something wrong, because a wrong value that the customer does not notice ends
 * up on a card that gets sent.
 */
import { describe, it, expect } from 'vitest';
import parseCardIntent, {
  parseDate, parseAmount, parseRecipient, parseTimeOfDay, OCCASION_LABELS,
} from '../utils/cardIntent';

// A fixed Thursday, so weekday maths is deterministic.
const THU = new Date(2026, 8, 3);   // Thu 3 Sep 2026

// The wizard's real occasion ids (CardStart.jsx OCCASIONS).
const WIZARD_OCCASIONS = [
  'birthday', 'valentine', 'leaving', 'anniversary', 'wedding', 'baby_shower',
  'retirement', 'congratulations', 'graduation', 'promotion', 'christmas',
  'get_well', 'new_year', 'thank_you', 'sympathy', 'good_luck', 'other',
];

describe('occasion detection', () => {
  const cases = [
    ['birthday card for Ada',                          'birthday'],
    ['bday card for my mum',                           'birthday'],
    ['leaving card for my boss',                       'leaving'],
    ['send-forth card for Tunde',                      'leaving'],
    ["farewell card, it's his last day",               'leaving'],
    ['retirement card for Mr Okafor',                  'retirement'],
    ['wedding card for Ada and Tunde',                 'wedding'],
    ['owambe card for my cousin',                      'wedding'],
    ['baby shower card for my sister',                 'baby_shower'],
    ['naming ceremony card',                           'baby_shower'],
    ['graduation card for my nephew',                  'graduation'],
    ['nysc passing out card for Chidi',                'graduation'],
    ['promotion card for my colleague',                'promotion'],
    ['christmas card for the team',                    'christmas'],
    ['get well card for my aunt',                      'get_well'],
    ['condolence card for Emeka',                      'sympathy'],
    ['thank you card for my teacher',                  'thank_you'],
    ['good luck card before her exam',                 'good_luck'],
    ['valentine card for my wife',                     'valentine'],
    ['work anniversary card for Bola',                 'anniversary'],
  ];
  cases.forEach(([text, expected]) => {
    it(`${text} → ${expected}`, () => {
      expect(parseCardIntent(text, THU).occasion).toBe(expected);
    });
  });

  it('every occasion it can produce exists in the wizard', () => {
    const produced = new Set();
    cases.forEach(([t]) => { const o = parseCardIntent(t, THU).occasion; if (o) produced.add(o); });
    produced.forEach(o => expect(WIZARD_OCCASIONS).toContain(o));
    Object.keys(OCCASION_LABELS).forEach(o => expect(WIZARD_OCCASIONS).toContain(o));
  });

  it('prefers the more specific occasion when two could match', () => {
    // "congrats on the new job, we'll miss you" is a leaving card, not a congrats card
    expect(parseCardIntent("congrats on the new job, we'll miss you", THU).occasion).toBe('leaving');
    // "baby shower" must not be read as a generic congratulation
    expect(parseCardIntent('congratulations on the baby shower', THU).occasion).toBe('baby_shower');
  });

  // Regression: "ada@example.com" contains "exam", which matched the good_luck
  // pattern and turned a birthday card into a good-luck card.
  it('an email address in the sentence cannot change the occasion', () => {
    const r = parseCardIntent('birthday card for my sister Ada, from Emmanuel, ada@example.com', THU);
    expect(r.occasion).toBe('birthday');
    expect(r.recipient_email).toBe('ada@example.com');
  });

  it('matches whole words only, at both ends', () => {
    expect(parseCardIntent('card for Ada, examples@test.com', THU).occasion).not.toBe('good_luck');
    expect(parseCardIntent('interviewing Ada for a card', THU).occasion).not.toBe('good_luck');
  });

  it('does not match occasion words inside other words', () => {
    expect(parseCardIntent('maybe a card for Ada', THU).occasion).not.toBe('may');
    expect(parseCardIntent('the value of a card', THU).occasion).not.toBe('valentine');
  });
});

describe('typos, shorthand and half-typed words', () => {
  const cases = [
    ['hbd card for Ada',                'birthday'],
    ['HBD Ada',                         'birthday'],
    ['bday card for my sister',         'birthday'],
    ['birthd card for Ada',             'birthday'],
    ['birhday card for Ada',            'birthday'],
    ['brithday card for Ada',           'birthday'],
    ['bithday card for Ada',            'birthday'],
    ['birth card for Ada',              'birthday'],
    ['weding card for Ada & Tunde',     'wedding'],
    ['farwell card for Emeka',          'leaving'],
    ['retirment card for Mr Okafor',    'retirement'],
    ['graduaton card for Chidi',        'graduation'],
    ['aniversary card for my wife',     'anniversary'],
    ['chrismas card for the team',      'christmas'],
    ['congratz card for Ada',           'congratulations'],
    ['sendoff card for Emeka',          'leaving'],
  ];
  cases.forEach(([text, expected]) => {
    it(`${text} → ${expected}`, () => {
      expect(parseCardIntent(text, THU).occasion).toBe(expected);
    });
  });

  it('still prefers the specific phrase over shorthand', () => {
    // "congrats" is birthday-adjacent shorthand, but the phrase wins.
    expect(parseCardIntent("congrats on the new job, we'll miss you", THU).occasion).toBe('leaving');
  });

  it('does not fuzzy-match short or unrelated words into an occasion', () => {
    expect(parseCardIntent('card for Ada', THU).occasion).toBeUndefined();
    expect(parseCardIntent('please make something nice', THU).occasion).toBeUndefined();
    expect(parseCardIntent('order for the office', THU).occasion).toBeUndefined();
  });
});

describe("the recipient's email", () => {
  it('is read from the sentence', () => {
    const r = parseCardIntent('birthday card for Ada, ada@gmail.com, sending Friday', THU);
    expect(r.recipient_email).toBe('ada@gmail.com');
    expect(r.occasion).toBe('birthday');
    expect(r.recipient_name).toBe('Ada');
  });

  it('is never exposed as a login email', () => {
    // Regression guard: prefilling sign-in with this would have customers
    // creating accounts under their recipient's address.
    const r = parseCardIntent('birthday card for Ada, ada@gmail.com', THU);
    expect(r.email).toBeUndefined();
  });

  it('tolerates trailing punctuation and case', () => {
    expect(parseCardIntent('card for Ada, Ada@Gmail.Com.', THU).recipient_email).toBe('ada@gmail.com');
  });

  it('is absent when no email was typed', () => {
    expect(parseCardIntent('birthday card for Ada', THU).recipient_email).toBeUndefined();
  });
});

describe('recipient extraction', () => {
  it('reads a name after a relationship word', () => {
    const r = parseCardIntent('birthday card for my sister Ada', THU);
    expect(r.recipient_name).toBe('Ada');
    expect(r.relationship).toBe('sister');
  });

  it('reads a bare name after "for"', () => {
    expect(parseCardIntent('birthday card for Tunde', THU).recipient_name).toBe('Tunde');
  });

  it('handles Nigerian workplace terms', () => {
    const r = parseCardIntent('send-forth card for my oga Emeka', THU);
    expect(r.recipient_name).toBe('Emeka');
    expect(r.relationship).toBe('oga');
  });

  it('reads a couple for weddings', () => {
    expect(parseCardIntent('wedding card for Ada and Tunde', THU).recipient_name).toBe('Ada & Tunde');
  });

  it('title-cases a lowercase name', () => {
    expect(parseCardIntent('birthday card for ada', THU).recipient_name).toBe('Ada');
  });

  it('keeps the relationship even with no name', () => {
    const r = parseCardIntent('birthday card for my mum', THU);
    expect(r.relationship).toBe('mum');
    expect(r.recipient_name).toBeUndefined();
  });

  // The important negatives — these must NOT invent a recipient.
  const noName = [
    'birthday card for the team',
    'leaving card for my colleague',
    'christmas card for everyone',
    'card for the office',
    'birthday card',
  ];
  noName.forEach(t => {
    it(`invents no name for: ${t}`, () => {
      expect(parseCardIntent(t, THU).recipient_name).toBeUndefined();
    });
  });

  // Regression: "my oga Emeka" produced a recipient called "Oga Emeka",
  // which then became the card title too.
  it('never keeps the relationship word as part of the name', () => {
    expect(parseCardIntent('leaving card for my oga Emeka next week', THU).recipient_name).toBe('Emeka');
    expect(parseCardIntent('birthday card for my boss Tunde', THU).recipient_name).toBe('Tunde');
    expect(parseCardIntent('card for my best friend Chidi', THU).recipient_name).toBe('Chidi');
  });

  it('keeps a name even when a stopword follows it', () => {
    expect(parseCardIntent('birthday card for Ada tomorrow', THU).recipient_name).toBe('Ada');
    expect(parseCardIntent('leaving card for Emeka next week', THU).recipient_name).toBe('Emeka');
  });

  it('stops at a clause boundary rather than swallowing the sentence', () => {
    expect(parseCardIntent('birthday card for Ada, sending Friday', THU).recipient_name).toBe('Ada');
    expect(parseCardIntent('birthday card for Ada who is turning 30', THU).recipient_name).toBe('Ada');
  });
});

describe('dates', () => {
  it('today / tomorrow', () => {
    expect(parseDate('send it today', THU)).toBe('2026-09-03');
    expect(parseDate('send it tomorrow', THU)).toBe('2026-09-04');
  });

  it('a weekday resolves forward', () => {
    expect(parseDate('sending friday', THU)).toBe('2026-09-04');       // tomorrow
    expect(parseDate('sending monday', THU)).toBe('2026-09-07');
  });

  it('the same weekday means next week, never today', () => {
    expect(parseDate('sending thursday', THU)).toBe('2026-09-10');
  });

  it('next week / in N days', () => {
    expect(parseDate('next week', THU)).toBe('2026-09-10');
    expect(parseDate('in 3 days', THU)).toBe('2026-09-06');
  });

  it('day and month, both orders', () => {
    expect(parseDate('on the 20th of September', THU)).toBe('2026-09-20');
    expect(parseDate('December 25', THU)).toBe('2026-12-25');
    expect(parseDate('25th december', THU)).toBe('2026-12-25');
  });

  it('a date already past rolls to next year', () => {
    expect(parseDate('on the 1st of January', THU)).toBe('2027-01-01');
  });

  it('rejects impossible dates instead of guessing', () => {
    expect(parseDate('31st February', THU)).toBeNull();
  });

  it('returns null when there is no date', () => {
    expect(parseDate('birthday card for Ada', THU)).toBeNull();
  });
});

describe('which Friday, and what time', () => {
  // THU = Thu 3 Sep 2026. Coming Friday = 4 Sep. Next week's Friday = 11 Sep.
  it('distinguishes this Friday from next Friday', () => {
    expect(parseDate('sending this friday', THU)).toBe('2026-09-04');
    expect(parseDate('sending next friday', THU)).toBe('2026-09-11');
  });

  it('a bare weekday means the coming one', () => {
    expect(parseDate('sending friday', THU)).toBe('2026-09-04');
  });

  it('"coming" and "following" work too', () => {
    expect(parseDate('coming friday', THU)).toBe('2026-09-04');
    expect(parseDate('following friday', THU)).toBe('2026-09-11');
  });

  it('"next week Friday" keeps the Friday', () => {
    expect(parseDate('sending next week friday', THU)).toBe('2026-09-11');
  });

  it('"this week Wednesday" resolves inside this week', () => {
    expect(parseDate('this week wednesday', THU)).toBe('2026-09-09');
  });

  it('week after next', () => {
    expect(parseDate('week after next on friday', THU)).toBe('2026-09-18');
  });

  it('the same weekday still never resolves to today', () => {
    expect(parseDate('this thursday', THU)).toBe('2026-09-10');
  });

  // Regression: said ON a Friday, "next Friday" was landing 14 days out.
  it('"next <weekday>" is 7 days away when today is that weekday', () => {
    const FRI = new Date(2026, 8, 4);           // Fri 4 Sep 2026
    expect(parseDate('next friday', FRI)).toBe('2026-09-11');
    expect(parseDate('this friday', FRI)).toBe('2026-09-11');
    expect(parseDate('friday', FRI)).toBe('2026-09-11');
    expect(parseDate('week after next friday', FRI)).toBe('2026-09-18');
  });

  it('reads a time of day', () => {
    expect(parseTimeOfDay('sending friday morning')).toBe('09:00');
    expect(parseTimeOfDay('friday afternoon')).toBe('14:00');
    expect(parseTimeOfDay('friday evening')).toBe('18:00');
    expect(parseTimeOfDay('at lunchtime')).toBe('12:00');
    expect(parseTimeOfDay('first thing friday')).toBe('07:00');
  });

  it('an explicit clock time wins over a vague one', () => {
    expect(parseTimeOfDay('friday morning at 11am')).toBe('11:00');
    expect(parseTimeOfDay('3pm')).toBe('15:00');
    expect(parseTimeOfDay('3:30pm')).toBe('15:30');
    expect(parseTimeOfDay('12am')).toBe('00:00');
    expect(parseTimeOfDay('12pm')).toBe('12:00');
  });

  it('no time mentioned leaves it unset', () => {
    expect(parseTimeOfDay('sending friday')).toBeNull();
  });

  it('carries date and time together on the intent', () => {
    const r = parseCardIntent('birthday card for Ada, sending next friday afternoon', THU);
    expect(r.send_date).toBe('2026-09-11');
    expect(r.send_time).toBe('14:00');
  });

  it('keeps the send time and the deadline time apart', () => {
    const r = parseCardIntent('leaving card for Emeka, sending next friday morning, deadline this wednesday evening', THU);
    expect(r.send_date).toBe('2026-09-11');
    expect(r.send_time).toBe('09:00');
    expect(r.deadline).toBe('2026-09-09');
    expect(r.deadline_time).toBe('18:00');
  });
});

describe('dates written however people write them', () => {
  const THU = new Date(2026, 8, 3);          // Thu 3 Sep 2026
  const on = (txt) => parseDate(txt, THU);

  it('relatives', () => {
    expect(on('today')).toBe('2026-09-03');
    expect(on('tomorrow')).toBe('2026-09-04');
    expect(on('day after tomorrow')).toBe('2026-09-05');
    expect(on('tonight')).toBe('2026-09-03');
  });

  it('in N days, weeks, months — digits or words', () => {
    expect(on('in 3 days')).toBe('2026-09-06');
    expect(on('in 2 weeks')).toBe('2026-09-17');
    expect(on('in two weeks')).toBe('2026-09-17');
    expect(on('in a week')).toBe('2026-09-10');
    expect(on('in 3 months')).toBe('2026-12-03');
    expect(on('a week today')).toBe('2026-09-10');
    expect(on('a week tomorrow')).toBe('2026-09-11');
  });

  it('abbreviated weekdays', () => {
    expect(on('sending fri')).toBe('2026-09-04');
    expect(on('sending next fri')).toBe('2026-09-11');
    expect(on('weds')).toBe('2026-09-09');
    expect(on('thurs')).toBe('2026-09-10');
    expect(on('mon')).toBe('2026-09-07');
  });

  it('weekends', () => {
    expect(on('this weekend')).toBe('2026-09-05');
    expect(on('next weekend')).toBe('2026-09-12');
  });

  it('month edges', () => {
    expect(on('end of the month')).toBe('2026-09-30');
    expect(on('end of next month')).toBe('2026-10-31');
    expect(on('beginning of next month')).toBe('2026-10-01');
    expect(on('mid next month')).toBe('2026-10-15');
  });

  it('abbreviated months, either order', () => {
    expect(on('25 dec')).toBe('2026-12-25');
    expect(on('dec 25')).toBe('2026-12-25');
    expect(on('sept 20')).toBe('2026-09-20');
    expect(on('20th sep')).toBe('2026-09-20');
    expect(on('1 jan')).toBe('2027-01-01');     // already gone → next year
  });

  it('numeric and ISO dates, day-first', () => {
    expect(on('25/12')).toBe('2026-12-25');
    expect(on('25/12/2026')).toBe('2026-12-25');
    expect(on('25-12-2026')).toBe('2026-12-25');
    expect(on('2026-12-25')).toBe('2026-12-25');
  });

  it('holidays by name', () => {
    expect(on('christmas')).toBe('2026-12-25');
    expect(on('xmas day')).toBe('2026-12-25');
    expect(on('boxing day')).toBe('2026-12-26');
    expect(on("new year's day")).toBe('2027-01-01');
    expect(on("valentine's day")).toBe('2027-02-14');
  });

  it('next month and next year on their own', () => {
    expect(on('next month')).toBe('2026-10-03');
    expect(on('next year')).toBe('2027-09-03');
  });

  it('a named day always beats a bare period', () => {
    expect(on('next week friday')).toBe('2026-09-11');
    expect(on('next month on the 5th')).toBe('2026-10-05');
  });

  it('rejects impossible dates instead of guessing', () => {
    expect(on('31 feb')).toBeNull();
    expect(on('45/13')).toBeNull();
  });

  it('returns null when there is no date at all', () => {
    expect(on('birthday card for Ada')).toBeNull();
    expect(on('')).toBeNull();
  });

  it('never throws', () => {
    [null, undefined, 42, {}, 'x'.repeat(3000)].forEach(j =>
      expect(() => parseDate(j, THU)).not.toThrow());
  });
});

describe('gift and amount', () => {
  it('detects collecting intent', () => {
    expect(parseCardIntent('birthday card for Ada, we are collecting for a gift', THU).is_gift_enabled).toBe(true);
    expect(parseCardIntent('leaving card, everyone can chip in', THU).is_gift_enabled).toBe(true);
  });

  it('an explicit refusal wins over gift words', () => {
    expect(parseCardIntent('birthday card for Ada, no gift just a card', THU).is_gift_enabled).toBe(false);
  });

  it('leaves gift unset when not mentioned, so the wizard default stands', () => {
    expect(parseCardIntent('birthday card for Ada', THU).is_gift_enabled).toBeUndefined();
  });

  it('parses amounts', () => {
    expect(parseAmount('collecting 50k')).toBe(50000);
    expect(parseAmount('₦5,000 each')).toBe(5000);
    expect(parseAmount('5000 naira')).toBe(5000);
    expect(parseAmount('N2500')).toBe(2500);
  });

  it('ignores amounts that are obviously not money', () => {
    expect(parseAmount('turning 30')).toBeNull();
    expect(parseAmount('after 22 years')).toBeNull();
  });

  it('an amount implies a gift pot', () => {
    expect(parseCardIntent('birthday card for Ada, 50k gift', THU).is_gift_enabled).toBe(true);
  });
});

describe('sender, deadline and email', () => {
  it('reads a sender name', () => {
    expect(parseCardIntent('birthday card for Ada, from Emmanuel', THU).sender_name).toBe('Emmanuel');
  });

  it('reads a group sender', () => {
    expect(parseCardIntent('leaving card for Emeka, from the whole team', THU).sender_name).toBe('The Whole Team');
  });

  it('does not mistake "from my sister" for a sender name', () => {
    expect(parseCardIntent('birthday card from my sister', THU).sender_name).toBeUndefined();
  });

  it('separates the deadline from the delivery date', () => {
    const r = parseCardIntent('birthday card for Ada, sending Friday, deadline Wednesday', THU);
    expect(r.send_date).toBe('2026-09-04');   // Fri
    expect(r.deadline).toBe('2026-09-09');    // following Wed
  });

  it('handles "sign by" phrasing', () => {
    expect(parseCardIntent('leaving card for Emeka, sign by Monday', THU).deadline).toBe('2026-09-07');
  });

  it('has no deadline when none was given', () => {
    expect(parseCardIntent('birthday card for Ada, sending Friday', THU).deadline).toBeUndefined();
  });
});

describe('confidence and the ok flag', () => {
  it('a full sentence scores high', () => {
    const r = parseCardIntent('birthday card for my sister Ada, sending Friday, collecting for a gift', THU);
    expect(r.ok).toBe(true);
    expect(r.confidence).toBeGreaterThanOrEqual(0.9);
    expect(r.matched).toContain('occasion');
    expect(r.matched).toContain('recipient');
    expect(r.matched).toContain('date');
  });

  it('occasion alone is enough to be useful', () => {
    const r = parseCardIntent('birthday card', THU);
    expect(r.ok).toBe(true);
  });

  it('nonsense is not ok, so the customer is left in the normal wizard', () => {
    expect(parseCardIntent('asdkjhasd kjhasd', THU).ok).toBe(false);
    expect(parseCardIntent('', THU).ok).toBe(false);
    expect(parseCardIntent('   ', THU).ok).toBe(false);
  });

  it('never throws, whatever it is given', () => {
    const junk = [null, undefined, 123, {}, [], '<script>alert(1)</script>', 'x'.repeat(5000), '🎂🎂🎂'];
    junk.forEach(j => expect(() => parseCardIntent(j, THU)).not.toThrow());
  });

  it('caps input length so a pasted essay cannot blow up the regexes', () => {
    const r = parseCardIntent('birthday card for Ada ' + 'x'.repeat(10000), THU);
    expect(r).toBeTruthy();
  });
});

describe('title', () => {
  it('builds a title only when it knows both name and occasion', () => {
    expect(parseCardIntent('birthday card for Ada', THU).title).toBe("Ada's Birthday Card");
    expect(parseCardIntent('birthday card for the team', THU).title).toBeUndefined();
  });
});
