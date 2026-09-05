/**
 * cardIntent.js — turn one typed sentence into card-wizard fields.
 *
 * "birthday card for my sister Ada, sending Friday, we're collecting for a gift"
 *   → { occasion:'birthday', recipient_name:'Ada', relationship:'sister',
 *       send_date:'2026-09-11', is_gift_enabled:true, confidence:0.9 }
 *
 * This runs ENTIRELY in the browser. No network call, no API key, no cost.
 * It is deliberately conservative: a field it is not reasonably sure about is
 * left unset so the wizard shows its own default, rather than confidently
 * filling in something wrong. A half-filled form is a good outcome; a wrong
 * one that the customer does not notice is not.
 *
 * The occasion ids here MUST stay in step with the OCCASIONS list in
 * CardStart.jsx and CreateCard.jsx — utils/tests/card-intent.test.js asserts
 * that every id produced here exists in the wizard.
 */

/* Shorthand and common misspellings, matched as whole words BEFORE the main
 * table. These are the things a keyword list never catches: "hbd", a half-typed
 * "birthd", a doubled letter, a missing vowel. Each entry is an exact word the
 * customer might type, so there is no fuzzy guessing at this stage. */
const OCCASION_SHORTHAND = [
  ['birthday', ['hbd', 'hbday', 'bday', 'bdy', 'b-day', 'bday', 'birthd', 'birthdy', 'birtday',
                'birhday', 'brithday', 'birthdate', 'bithday', 'birthaday', 'bda', 'borthday',
                'birtjday', 'happybirthday', 'birth', 'bd']],
  ['leaving',  ['farwell', 'farewel', 'fairwell', 'leavin', 'leving', 'sendoff', 'send-off',
                'send off', 'sendforth', 'gudbye', 'goodby', 'bye']],
  ['wedding',  ['weding', 'weddin', 'wedd', 'marraige', 'marrige', 'nikah', 'wed']],
  ['retirement', ['retirment', 'retiremnt', 'retiring', 'retiree']],
  ['graduation', ['graduaton', 'gradution', 'grad', 'graduatn', 'convocaton']],
  ['anniversary', ['aniversary', 'anniversry', 'anniv', 'annivarsary']],
  ['congratulations', ['congrat', 'congratz', 'congrats', 'congratulation', 'gratz', 'kudos']],
  ['baby_shower', ['babyshower', 'babby shower', 'naming', 'christning']],
  ['valentine', ['val', 'valentin', 'valentines', 'vals']],
  ['christmas', ['chrismas', 'christmass', 'xmas', 'crismas', 'chrismass']],
  ['get_well',  ['getwell', 'get-well', 'recover', 'sick']],
  ['sympathy',  ['condolence', 'condolance', 'sympaty', 'symapthy', 'rip']],
  ['thank_you', ['thanks', 'thankyou', 'thnx', 'ty']],
  ['promotion', ['promo', 'promoton', 'promotin']],
  ['new_year',  ['newyear', 'nye', 'happynewyear']],
  ['good_luck', ['goodluck', 'gl', 'best wishes']],
];

/* ── Occasion keywords ─────────────────────────────────────────────────────
 * Ordered most-specific first: "baby shower" must beat "shower", and
 * "leaving" must be checked before generic congratulation words, since
 * "congrats on the new job, we'll miss you" is a leaving card.
 * Nigerian usage is first-class here, not an afterthought — "send-forth" and
 * "owambe" are what customers actually type.                               */
const OCCASION_PATTERNS = [
  ['baby_shower',     ['baby shower', 'babyshower', 'new baby', 'newborn', 'naming ceremony', 'christening', 'baby dedication', 'expecting', 'push present']],
  ['leaving',         ['leaving', 'farewell', 'send-forth', 'send forth', 'sendforth', 'going away', 'last day', 'resigning', 'resignation', 'new job', 'moving on', "we'll miss", 'we will miss', 'goodbye', 'bye bye', 'transfer', 'redeployment']],
  ['retirement',      ['retirement', 'retiring', 'retires', 'retired', 'years of service', 'end of service']],
  ['wedding',         ['wedding', 'getting married', 'marriage', 'nikkah', 'nikah', 'traditional marriage', 'owambe', 'introduction ceremony', 'bride', 'groom', 'engagement']],
  ['anniversary',     ['anniversary', 'anniversaries', 'work anniversary', 'years together']],
  ['graduation',      ['graduation', 'graduating', 'graduate', 'convocation', 'nysc', 'passing out', 'called to bar', 'first class']],
  ['promotion',       ['promotion', 'promoted', 'new role', 'stepping up', 'elevation', 'moving up']],
  ['valentine',       ['valentine', "valentine's", 'val day']],
  ['christmas',       ['christmas', 'xmas', 'yuletide', 'festive season', 'detty december']],
  ['new_year',        ['new year', 'happy new year', 'january 1']],
  ['get_well',        ['get well', 'feel better', 'recovery', 'speedy recovery', 'in hospital', 'unwell', 'surgery']],
  ['sympathy',        ['sympathy', 'condolence', 'condolences', 'bereavement', 'passed away', 'rest in peace', 'sorry for your loss', 'lost her', 'lost his']],
  ['thank_you',       ['thank you', 'thankyou', 'thanks to', 'appreciation', 'appreciate', 'grateful']],
  ['good_luck',       ['good luck', 'best of luck', 'all the best', 'exam', 'interview']],
  ['birthday',        ['birthday', 'bday', 'b-day', 'turning', 'born day', 'happy birthday']],
  ['congratulations', ['congratulations', 'congrats', 'well done', 'kudos', 'celebrate', 'achievement']],
];

/* Relationship words. Used for tone, and — importantly — to find the name that
 * follows them ("my sister Ada"). Longest first so "mother in law" beats
 * "mother".                                                                */
const RELATIONSHIPS = [
  'mother in law', 'father in law', 'sister in law', 'brother in law',
  'best friend', 'team lead', 'line manager', 'co worker', 'co-worker',
  'colleague', 'classmate', 'roommate', 'neighbour', 'neighbor',
  'girlfriend', 'boyfriend', 'husband', 'wife', 'fiance', 'fiancee',
  'daughter', 'son', 'sister', 'brother', 'mother', 'father', 'mum', 'mom',
  'mummy', 'mommy', 'dad', 'daddy', 'papa', 'mama', 'aunt', 'auntie', 'uncle',
  'cousin', 'nephew', 'niece', 'grandma', 'grandpa', 'granny',
  'boss', 'oga', 'madam', 'manager', 'supervisor', 'mentor', 'coach',
  'teacher', 'lecturer', 'pastor', 'friend', 'partner', 'team', 'staff',
  'employee', 'intern', 'assistant', 'director', 'principal',
];

/* Words that are never a person's name, even in a name position. Without this
 * "birthday card for the team" yields a recipient called "The".            */
const NOT_NAMES = new Set([
  'a', 'an', 'the', 'my', 'our', 'his', 'her', 'their', 'your', 'this', 'that',
  'someone', 'somebody', 'everyone', 'everybody', 'them', 'him', 'us', 'me',
  'card', 'cards', 'gift', 'gifts', 'money', 'group', 'team', 'staff', 'work',
  'office', 'company', 'colleague', 'colleagues', 'people', 'friends', 'family',
  'birthday', 'wedding', 'leaving', 'farewell', 'retirement', 'graduation',
  'anniversary', 'promotion', 'christmas', 'sympathy', 'valentine',
  'tomorrow', 'today', 'friday', 'monday', 'tuesday', 'wednesday', 'thursday',
  'saturday', 'sunday', 'next', 'week', 'month', 'and', 'with', 'for', 'to',
  'please', 'want', 'need', 'create', 'make', 'send', 'sending',
]);

const RELATIONSHIP_SET = new Set(RELATIONSHIPS);

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
  'august', 'september', 'october', 'november', 'december'];

const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const MONTH_ALIASES = {
  jan:0, january:0, feb:1, february:1, mar:2, march:2, apr:3, april:3, may:4,
  jun:5, june:5, jul:6, july:6, aug:7, august:7, sep:8, sept:8, september:8,
  oct:9, october:9, nov:10, november:10, dec:11, december:11,
};
const MONTH_RE = Object.keys(MONTH_ALIASES).sort((a, b) => b.length - a.length).join('|');

const WEEKDAY_ALIASES = {
  sunday:0, sun:0, monday:1, mon:1, tuesday:2, tues:2, tue:2,
  wednesday:3, weds:3, wed:3, thursday:4, thurs:4, thur:4, thu:4,
  friday:5, fri:5, saturday:6, sat:6,
};
const WEEKDAY_RE = Object.keys(WEEKDAY_ALIASES).sort((a, b) => b.length - a.length).join('|');

// Fixed-date holidays people name instead of a date.
const HOLIDAYS = [
  [/\b(christmas|xmas)\s*(day)?\b/, 11, 25],
  [/\bboxing day\b/,                11, 26],
  [/\bnew year'?s? eve\b/,          11, 31],
  [/\bnew year'?s?( day)?\b/,        0,  1],
  [/\b(valentine'?s?( day)?|val day)\b/, 1, 14],
];

/**
 * Natural-language dates — written the way people actually write them.
 *
 * Handles: today / tomorrow / day after tomorrow; "in 3 days", "in 2 weeks",
 * "in 3 months"; "a week today"; this / next / coming / following weekday and
 * "week after next", in full or abbreviated (fri, weds, thurs); this and next
 * weekend; start / mid / end of this or next month; next month; next year;
 * "25 December", "Dec 25", "the 20th"; numeric 25/12, 25-12-2026 and ISO
 * 2026-12-25; and the holidays above.
 *
 * Always resolves FORWARD — a card is never scheduled into the past — and
 * returns null when it is not reasonably sure, so the wizard's own default
 * stands rather than a guess.
 *
 * Numeric dates are read day-first (25/12 = 25 December), which is the
 * convention in Nigeria and the UK. A first number above 12 is unambiguous
 * either way.
 */
export const parseDate = (text, now = new Date()) => {
  const t = String(text || '').toLowerCase();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };
  const monthEnd = (offset) => new Date(today.getFullYear(), today.getMonth() + offset + 1, 0);
  const monthDay = (offset, day) => new Date(today.getFullYear(), today.getMonth() + offset, day);
  const forward = (d) => (d < today ? null : toISO(d));

  /* ── "a week today" / "a week tomorrow" ───────────────────────────────────
   * Checked before the plain relatives below, which would otherwise see the
   * "today" inside "a week today" and return today. */
  if (/\ba week today\b/.test(t))    return toISO(addDays(7));
  if (/\ba week tomorrow\b/.test(t)) return toISO(addDays(8));

  /* ── Plain relatives ──────────────────────────────────────────────────── */
  if (/\bday after tomorrow\b/.test(t)) return toISO(addDays(2));
  if (/\btoday\b|\btonight\b|\bthis evening\b/.test(t)) return toISO(today);
  if (/\btomorrow\b/.test(t)) return toISO(addDays(1));

  /* ── "in N days / weeks / months" ─────────────────────────────────────── */
  const inN = t.match(/\bin\s+(a|an|one|two|three|four|five|six|\d{1,3})\s+(day|week|month)s?\b/);
  if (inN) {
    const words = { a:1, an:1, one:1, two:2, three:3, four:4, five:5, six:6 };
    const n = words[inN[1]] ?? parseInt(inN[1], 10);
    if (Number.isFinite(n) && n > 0 && n <= 365) {
      if (inN[2] === 'day')  return toISO(addDays(n));
      if (inN[2] === 'week') return toISO(addDays(n * 7));
      const d = new Date(today); d.setMonth(d.getMonth() + n); return toISO(d);
    }
  }

  /* ── Weekends ─────────────────────────────────────────────────────────── */
  if (/\bweekend\b/.test(t)) {
    const toSat = (6 - today.getDay() + 7) % 7 || 7;
    return toISO(addDays(/\bnext weekend\b/.test(t) ? toSat + 7 : toSat));
  }

  /* ── Month edges ──────────────────────────────────────────────────────── */
  const nextMonth = /\bnext month\b/.test(t);
  if (/\bend of (the |this |next )?month\b/.test(t)) return toISO(monthEnd(nextMonth ? 1 : 0));
  if (/\b(start|beginning) of (the |this |next )?month\b/.test(t)) {
    return forward(monthDay(nextMonth ? 1 : 0, 1)) || toISO(monthDay(1, 1));
  }
  if (/\bmid[- ]?(month|next month)\b/.test(t)) {
    return forward(monthDay(nextMonth ? 1 : 0, 15)) || toISO(monthDay(1, 15));
  }

  /* ── Holidays ─────────────────────────────────────────────────────────── */
  for (const [re, m, d] of HOLIDAYS) {
    if (re.test(t)) {
      let date = new Date(today.getFullYear(), m, d);
      if (date < today) date = new Date(today.getFullYear() + 1, m, d);
      return toISO(date);
    }
  }

  /* ── ISO and numeric dates ────────────────────────────────────────────── */
  const iso = t.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) {
    const d = new Date(+iso[1], +iso[2] - 1, +iso[3]);
    if (d.getMonth() === +iso[2] - 1 && d.getDate() === +iso[3]) return toISO(d);
  }
  const numeric = t.match(/\b(\d{1,2})[/.\-](\d{1,2})(?:[/.\-](\d{2,4}))?\b/);
  if (numeric) {
    const day = +numeric[1], mon = +numeric[2] - 1;
    let year = numeric[3] ? +numeric[3] : today.getFullYear();
    if (year < 100) year += 2000;
    if (day >= 1 && day <= 31 && mon >= 0 && mon <= 11) {
      let d = new Date(year, mon, day);
      if (!numeric[3] && d < today) d = new Date(year + 1, mon, day);
      if (d.getMonth() === mon && d.getDate() === day) return toISO(d);
    }
  }

  /* ── Named months, either order, full or abbreviated ──────────────────── */
  const dm = t.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_RE})\\b`));
  const md = t.match(new RegExp(`\\b(${MONTH_RE})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`));
  if (dm || md) {
    const day   = parseInt(dm ? dm[1] : md[2], 10);
    const month = MONTH_ALIASES[dm ? dm[2] : md[1]];
    if (day >= 1 && day <= 31 && month != null) {
      let d = new Date(today.getFullYear(), month, day);
      if (d < today) d = new Date(today.getFullYear() + 1, month, day);
      if (d.getMonth() === month) return toISO(d);      // rejects 31 February
    }
  }

  /* ── "the 20th" — this month, or next if it has gone ──────────────────── */
  const bare = t.match(/\b(?:on\s+)?the\s+(\d{1,2})(?:st|nd|rd|th)\b/);
  if (bare) {
    const day = parseInt(bare[1], 10);
    if (day >= 1 && day <= 31) {
      let d = monthDay(nextMonth ? 1 : 0, day);
      if (d < today) d = monthDay(1, day);
      if (d.getDate() === day) return toISO(d);
    }
  }

  /* ── Weekdays, qualified ──────────────────────────────────────────────── */
  const wd = t.match(new RegExp(`\\b(${WEEKDAY_RE})\\b`));
  if (wd) {
    const target = WEEKDAY_ALIASES[wd[1]];
    const before = t.slice(0, wd.index);
    // "week after next" is checked first: it ENDS in "next", so the trailing
    // qualifier test below would otherwise claim it and lose a week.
    const qualifier = /\bweek after next\b/.test(t) ? 'weekafter'
      : (/\b(this|next|coming|following)\s+$/.exec(before)?.[1]
        || (/\bnext week\b/.test(t) ? 'next'
        : /\bthis week\b/.test(t) ? 'this' : null));

    let delta = (target - today.getDay() + 7) % 7;      // 0 = today
    if (qualifier === 'next' || qualifier === 'following') {
      // "next Friday" is the Friday of NEXT week. Said on a Friday that is
      // seven days away, not fourteen.
      delta = delta === 0 ? 7 : delta + 7;
    } else if (qualifier === 'weekafter') {
      delta = delta === 0 ? 14 : delta + 14;
    } else if (delta === 0) {
      delta = 7;                                        // never schedule today
    }
    return toISO(addDays(delta));
  }

  /* ── Bare periods, last so a named day always wins ────────────────────── */
  if (/\bnext week\b/.test(t)) return toISO(addDays(7));
  if (nextMonth) { const d = new Date(today); d.setMonth(d.getMonth() + 1); return toISO(d); }
  if (/\bnext year\b/.test(t)) { const d = new Date(today); d.setFullYear(d.getFullYear() + 1); return toISO(d); }

  return null;
};

/* ── Time of day ───────────────────────────────────────────────────────────
 * A card that lands at 6am reads as an afterthought; one that lands over
 * lunch gets opened. Returns "HH:MM" or null so the wizard default stands. */
const NAMED_TIMES = [
  [/\b(first thing|early morning|dawn)\b/,           '07:00'],
  [/\bmorning\b/,                                    '09:00'],
  [/\b(noon|midday|mid[- ]?day|lunch ?time|lunch)\b/, '12:00'],
  [/\bafternoon\b/,                                  '14:00'],
  [/\b(evening|after work|close of business|cob)\b/,  '18:00'],
  [/\b(night|tonight)\b/,                            '20:00'],
  [/\bmidnight\b/,                                   '00:00'],
];

export const parseTimeOfDay = (text) => {
  const t = String(text || '').toLowerCase();

  // An explicit clock time wins: "9am", "3:30pm", "at 14:00".
  // "9am", "9 a.m.", "3:30pm", "at 14:00", "8 o'clock"
  const t2 = t.replace(/([ap])\.m\./g, '$1m');
  const clock = t2.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/)
    || t2.match(/\bat\s+(\d{1,2}):(\d{2})\b/)
    || t2.match(/\b(\d{1,2})\s*o'?clock\b/);
  if (clock) {
    let h = parseInt(clock[1], 10);
    const m = clock[2] ? parseInt(clock[2], 10) : 0;
    const ampm = clock[3];
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return `${pad(h)}:${pad(m)}`;
  }

  for (const [re, val] of NAMED_TIMES) if (re.test(t)) return val;
  return null;
};

/** "50k" → 50000, "₦5,000" → 5000, "N2500" → 2500, "5000 naira" → 5000. */
export const parseAmount = (text) => {
  const t = text.toLowerCase().replace(/,/g, '');
  const k = t.match(/(?:₦|n|ngn)?\s*(\d{1,4})\s*k\b/);
  if (k) {
    const v = parseInt(k[1], 10) * 1000;
    if (v >= 500 && v <= 10_000_000) return v;
  }
  // "₦5,000" / "ngn 5000" / "5000 naira" / "N2500". The bare-N form requires the
  // digits to follow immediately, so "in 2500" and "turning 30" cannot match.
  const plain = t.match(/(?:₦|ngn|naira)\s*(\d{3,8})\b/)
    || t.match(/\bn(\d{3,8})\b/)
    || t.match(/\b(\d{3,8})\s*(?:naira|ngn)\b/);
  if (plain) {
    const v = parseInt(plain[1], 10);
    if (v >= 500 && v <= 10_000_000) return v;
  }
  return null;
};

const titleCase = (s) => s.split(/\s+/)
  .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  .join(' ');

const cleanName = (raw) => {
  if (!raw) return null;
  // Trim trailing filler: "Ada, sending Friday" → "Ada"
  let n = raw.trim()
    .replace(/[.,!?;:]+$/, '')
    .replace(/\s+(who|which|that|is|was|will|and|because|since|so)\b.*$/i, '')
    .trim();
  const words = n.split(/\s+/).filter(Boolean);
  if (!words.length || words.length > 3) return null;              // a name, not a sentence
  if (words.some(w => NOT_NAMES.has(w.toLowerCase()))) return null;
  if (words.some(w => !/^[a-z'’\-]{2,}$/i.test(w))) return null;   // letters only
  // A relationship word is never the name. "for my mum" must leave the
  // recipient blank rather than addressing the card to "Mum".
  if (RELATIONSHIP_SET.has(words.join(' ').toLowerCase())) return null;
  return titleCase(words.join(' '));
};

/**
 * Take the longest leading run of words that reads as a name.
 * "Emeka next" → "Emeka";  "oga Emeka" → "Emeka";  "the team" → null.
 * Without this, one trailing stopword ("Ada tomorrow") threw away a name we
 * had correctly found.
 */
const firstGoodName = (candidate) => {
  if (!candidate) return null;
  let words = candidate.trim().split(/\s+/).filter(Boolean);
  // Drop any leading relationship word — "my oga Emeka" must not become
  // a recipient called "Oga Emeka".
  while (words.length > 1 && RELATIONSHIP_SET.has(words[0].toLowerCase())) words = words.slice(1);
  for (let take = Math.min(words.length, 3); take >= 1; take--) {
    const got = cleanName(words.slice(0, take).join(' '));
    if (got) return got;
  }
  return null;
};

/** Pull a recipient name out of the sentence. Returns null when unsure. */
export const parseRecipient = (text) => {
  const rel = RELATIONSHIPS.slice().sort((a, b) => b.length - a.length)
    .find(r => new RegExp(`\\b${r.replace(/[-]/g, '[- ]')}\\b`, 'i').test(text));

  // "my sister Ada" / "our oga Tunde" — the name right after a relationship word
  if (rel) {
    const after = text.match(new RegExp(`\\b${rel.replace(/[-]/g, '[- ]')}\\b[,\\s]+([a-z'’\\-]+(?:\\s+[a-z'’\\-]+)?)`, 'i'));
    const named = firstGoodName(after?.[1]);
    if (named) return { recipient_name: named, relationship: rel };
  }

  // "for Ada and Tunde" — couples, common for weddings
  const pair = text.match(/\b(?:for|to)\s+([a-z'’\-]{2,})\s*(?:&|and)\s*([a-z'’\-]{2,})\b/i);
  if (pair) {
    const a = cleanName(pair[1]); const b = cleanName(pair[2]);
    if (a && b) return { recipient_name: `${a} & ${b}`, relationship: rel || null };
  }

  // "card for Ada" / "to Ada"
  const forName = text.match(/\b(?:for|to)\s+(?:my|our|the)?\s*([a-z'’\-]+(?:\s+[a-z'’\-]+){0,2})/i);
  const named = firstGoodName(forName?.[1]);
  if (named) return { recipient_name: named, relationship: rel || null };

  return { recipient_name: null, relationship: rel || null };
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* Word-boundary matching, not substring: a bare `includes` would let "may"
 * match inside "maybe" and "val" inside "value". Trailing \w* allows the
 * natural inflections ("retiring", "graduating", "congrats!"). */
/* ── Deadline ──────────────────────────────────────────────────────────────
 * The signing deadline and the delivery date are different things and often
 * appear in the same sentence ("sending Friday, deadline Wednesday"), so the
 * deadline clause is found first and then CUT OUT before the send date is
 * read. Without that, whichever date came first would win both fields. */
const DEADLINE_RE = /\b(?:deadline|sign by|signing (?:by|closes|ends)|closes?|cut[- ]?off|last day to sign|everyone signs by)\b[:\s]*(?:is\s*)?([^,.;]{0,32})/i;

export const splitDeadline = (text, now = new Date()) => {
  const m = text.match(DEADLINE_RE);
  if (!m) return { deadline: null, rest: text };
  const deadline = parseDate(m[1] || '', now);
  return { deadline, rest: deadline ? text.replace(m[0], ' ') : text };
};

/** "from Emmanuel", "from me, Emmanuel", "from the whole team". */
const GROUP_SENDERS = { team: 'The Team', office: 'The Office', everyone: 'Everyone',
  'the team': 'The Team', 'whole team': 'The Whole Team', staff: 'The Staff', us: null };

export const parseSender = (text) => {
  const m = text.match(/\bfrom\s+(?:me,?\s*)?(?:the\s+)?([a-z'’\-]+(?:\s+[a-z'’\-]+){0,2})/i);
  if (!m) return null;
  const raw = m[1].trim().toLowerCase();
  for (const key of Object.keys(GROUP_SENDERS)) {
    if (raw === key || raw.startsWith(`${key} `)) return GROUP_SENDERS[key];
  }
  return firstGoodName(m[1]);
};

/**
 * An email typed into the sentence is the RECIPIENT's — it is who the card gets
 * delivered to. It must never be used to pre-fill the sign-in field: doing that
 * would have people creating Thankeeu accounts under their recipient's address.
 */
export const parseEmail = (text) => {
  const m = String(text || '').match(/[\w.+-]+@[\w-]+\.[\w.-]{2,}/);
  return m ? m[0].toLowerCase().replace(/[.,;]$/, '') : null;
};

/* Whole-word matching at BOTH ends. A leading boundary alone is not enough:
 * "exam" then matches inside "ada@example.com" and turns a birthday card into
 * a good-luck card. Inflected forms ("retiring", "graduating") are listed
 * explicitly in the table above rather than caught by a trailing wildcard.
 * The email is stripped first — an address is a handle, not a description of
 * the occasion, and its domain words are a rich source of false matches. */
/**
 * Levenshtein distance, capped — we only ever care whether it is 1 or 2, so
 * the full matrix is never worth building for long strings.
 */
const editDistance = (a, b) => {
  if (Math.abs(a.length - b.length) > 2) return 9;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
};

/* The single words worth fuzzy-matching against, longest first. Only the
 * distinctive head word of each occasion — matching "card" or "the" loosely
 * would fire on everything. */
const FUZZY_TARGETS = [
  ['birthday', 'birthday'], ['anniversary', 'anniversary'], ['retirement', 'retirement'],
  ['graduation', 'graduation'], ['congratulations', 'congratulations'], ['wedding', 'wedding'],
  ['leaving', 'farewell'], ['leaving', 'leaving'], ['christmas', 'christmas'],
  ['valentine', 'valentine'], ['promotion', 'promotion'], ['sympathy', 'sympathy'],
  ['baby_shower', 'shower'], ['good_luck', 'goodluck'], ['new_year', 'newyear'],
];

/**
 * Whole-word matching at BOTH ends, in three passes of decreasing certainty:
 *
 *   1. the shorthand table  — "hbd", "bday", "birthd"
 *   2. the keyword table    — "birthday", "send-forth", "owambe"
 *   3. a fuzzy pass         — anything within one or two edits of a head word,
 *                             so "birhday", "weding" and "retirment" land
 *
 * A leading word boundary alone is not enough — "exam" then matches inside
 * "ada@example.com" — so emails are stripped first and both ends are anchored.
 */
const detectOccasion = (text) => {
  const t = text.toLowerCase().replace(/[\w.+-]+@[\w-]+\.[\w.-]{2,}/g, ' ');

  // Keyword table FIRST: it holds the multi-word, high-specificity phrases, and
  // specificity has to win. Shorthand ahead of it would read "congrats on the
  // new job, we'll miss you" as a congratulations card rather than a leaving one.
  for (const [id, words] of OCCASION_PATTERNS) {
    if (words.some(w => new RegExp(`\\b${escapeRe(w)}\\b`, 'i').test(t))) return id;
  }
  for (const [id, words] of OCCASION_SHORTHAND) {
    if (words.some(w => new RegExp(`\\b${escapeRe(w)}\\b`, 'i').test(t))) return id;
  }

  // Fuzzy, last and most cautious. Words shorter than five letters are skipped:
  // at that length two edits reaches half the dictionary.
  const words = t.split(/[^a-z]+/).filter(w => w.length >= 5);
  for (const w of words) {
    for (const [id, target] of FUZZY_TARGETS) {
      const budget = target.length >= 9 ? 2 : 1;
      if (editDistance(w, target) <= budget) return id;
    }
  }
  return null;
};

/**
 * Main entry point.
 * @returns {{ ok, occasion, recipient_name, relationship, send_date,
 *             is_gift_enabled, suggested_amount, title, confidence, matched }}
 */
export const parseCardIntent = (input, now = new Date()) => {
  const text = String(input || '').trim().slice(0, 300);
  if (text.length < 2) return { ok: false, confidence: 0, matched: [] };

  const occasion = detectOccasion(text);
  const { recipient_name, relationship } = parseRecipient(text);
  // Deadline first, then the send date from what is left, so two dates in one
  // sentence land in the right two fields.
  const { deadline, rest } = splitDeadline(text, now);
  const send_date = parseDate(rest, now);
  const sender_name = parseSender(text);
  // The delivery clause carries the send time; the deadline clause its own.
  const send_time = parseTimeOfDay(rest);
  const deadline_time = deadline ? parseTimeOfDay(text.slice(text.toLowerCase().search(DEADLINE_RE))) : null;
  const email = parseEmail(text);
  const amount = parseAmount(text);

  // Gift intent: an explicit amount counts, as do the collecting words. An
  // explicit "no gift" wins over both.
  const wantsGift =
    /\b(no gift|without (a )?gift|no money|no contribution|card only|just (a )?card)\b/i.test(text) ? false
    : (amount != null || /\b(gift|contribut|collect|chip in|donat|pot|money|cash|whip round|whipround|dash)\w*/i.test(text) ? true : null);

  const matched = [];
  if (occasion) matched.push('occasion');
  if (sender_name) matched.push('sender');
  if (deadline) matched.push('deadline');
  if (recipient_name) matched.push('recipient');
  if (send_date) matched.push('date');
  if (wantsGift !== null) matched.push('gift');
  if (amount) matched.push('amount');

  // Confidence: the occasion is what the whole wizard hangs off, so it carries
  // the most weight. Anything below 0.35 is treated as "not understood" by the
  // caller and the customer is sent to the normal wizard untouched.
  let confidence = 0;
  if (occasion)        confidence += 0.55;
  if (recipient_name)  confidence += 0.25;
  if (send_date)       confidence += 0.10;
  if (wantsGift !== null) confidence += 0.10;
  confidence = Math.min(1, Math.round(confidence * 100) / 100);

  const intent = { ok: confidence >= 0.35, confidence, matched };
  if (occasion)       intent.occasion = occasion;
  if (recipient_name) intent.recipient_name = recipient_name;
  if (relationship)   intent.relationship = relationship;
  if (send_date)      intent.send_date = send_date;
  if (wantsGift !== null) intent.is_gift_enabled = wantsGift;
  if (amount)         intent.suggested_amount = amount;
  if (sender_name)    intent.sender_name = sender_name;
  if (deadline)       intent.deadline = deadline;
  if (send_time)      intent.send_time = send_time;
  if (deadline_time)  intent.deadline_time = deadline_time;
  if (email)          intent.recipient_email = email;
  if (recipient_name && occasion) intent.title = `${recipient_name}'s ${OCCASION_LABELS[occasion] || 'Special'} Card`;

  return intent;
};

export const OCCASION_LABELS = {
  birthday: 'Birthday', valentine: "Valentine's", leaving: 'Leaving', anniversary: 'Anniversary',
  wedding: 'Wedding', baby_shower: 'Baby Shower', retirement: 'Retirement',
  congratulations: 'Congratulations', graduation: 'Graduation', promotion: 'Promotion',
  christmas: 'Christmas', get_well: 'Get Well', new_year: 'New Year',
  thank_you: 'Thank You', sympathy: 'Sympathy', good_luck: 'Good Luck', other: 'Special',
};

/* ── Handover between the homepage box and the wizard ──────────────────────
 * sessionStorage, not the URL: a sentence carries more than fits comfortably
 * in a query string, and a recipient's name should not end up in browser
 * history, server logs or a shared link. Per-tab and short-lived, which is
 * exactly the lifetime this needs.                                         */
export const INTENT_KEY = 'thankeeu_card_intent';

export const stashIntent = (intent, rawText) => {
  try {
    sessionStorage.setItem(INTENT_KEY, JSON.stringify({ ...intent, raw: rawText, at: Date.now() }));
    return true;
  } catch { return false; }
};

/** Reads and CLEARS the stashed intent. Ignores anything older than 30 min. */
export const takeIntent = () => {
  try {
    const raw = sessionStorage.getItem(INTENT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(INTENT_KEY);
    const parsed = JSON.parse(raw);
    if (!parsed || Date.now() - (parsed.at || 0) > 30 * 60 * 1000) return null;
    return parsed;
  } catch { return null; }
};

export default parseCardIntent;
