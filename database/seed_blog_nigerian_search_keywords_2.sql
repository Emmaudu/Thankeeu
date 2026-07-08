-- ============================================================================
-- seed_blog_nigerian_search_keywords_2.sql
-- 6 posts targeting the next batch of Nigerian search clusters:
--   1. "what to write in farewell card Nigeria"
--   2. "how to organise send forth Nigeria"
--   3. "office contribution Nigeria / how to collect money for colleague"
--   4. "what to write in birthday card for boss Nigeria"
--   5. "new baby congratulations messages Nigeria"
--   6. "work anniversary messages Nigeria colleague"
-- All posts fully answer the search intent first, then introduce Thankeeu.
-- IDEMPOTENT: ON CONFLICT (slug) DO NOTHING — safe to re-run.
-- ============================================================================

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'What to Write in a Farewell Card for a Colleague Leaving Nigeria (50+ Messages)',
'what-to-write-farewell-card-colleague-nigeria',
'Stuck on what to write in a farewell card for a colleague? Here are 50+ messages for different relationships — bosses, friends, corps members, people japa-ing — plus how to organise the card without stress.',
$content$<h2>Why farewell card messages matter in Nigeria</h2>
<p>A farewell card is often the last professional thing a colleague takes from a workplace. In Nigeria, where relationships run deep and send-forths are real events, the words in that card carry weight. "I still have the card from my first job," says Amaka, 34, an HR manager in Lagos. "I read it whenever I doubt myself."</p>
<p>So what do you actually write? Here are messages for every relationship and situation.</p>

<h2>What to write in a farewell card for a colleague (general)</h2>
<ul>
<li>It has been a privilege working with you. You raised the bar every day and made the rest of us better for it. Go and conquer your next chapter — this office will feel your absence.</li>
<li>Thank you for every deadline saved, every idea shared, and every time you covered for us without being asked. You are one of the good ones. We wish you nothing but the best.</li>
<li>Working with you has been one of the highlights of my career here. Wherever you go, take the knowledge that you are genuinely valued — and that we will be watching your next chapter with pride.</li>
<li>This isn't goodbye — it's see you at the top. You were always too good to stay in one place for long. Go and shine, and don't forget us when you blow.</li>
</ul>

<h2>What to write in a farewell card for a boss</h2>
<ul>
<li>Thank you for leading with patience, integrity and genuine investment in the people under you. You didn't just manage us — you developed us. That is rare, and we are better for it.</li>
<li>The best thing about a great boss is that they leave an impression that outlasts their time. You are that boss. We will carry everything you taught us into every role we go into next.</li>
<li>On behalf of the team: thank you. For every hard conversation you had for our benefit, every opportunity you created, and every time you went to bat for us. May your next chapter reward you as much as you gave here.</li>
</ul>

<h2>What to write for a close work friend</h2>
<ul>
<li>I refuse to say goodbye because I know this isn't the end — it's just a change of address. But I will say: working with you has been one of the best parts of this job. Don't be a stranger.</li>
<li>You are the reason I survived this place. The lunch gists, the WhatsApp venting, the "cover me, I'm coming late" favours — all of it. I'm so happy for where you're going. Now go, before I get emotional on company time.</li>
</ul>

<h2>What to write for a corper finishing NYSC service year</h2>
<ul>
<li>You came as a corps member and you're leaving as part of this family. Your fresh energy, ideas and "but why do we do it this way?" questions made us better. As you pass out, may every door open wide for you.</li>
<li>NYSC done! You gave this organisation a year of your life and made it count. Go out there and apply everything you've learned — greater things are waiting for you.</li>
</ul>

<h2>What to write for someone relocating abroad (japa)</h2>
<ul>
<li>As you cross to the other side, go with our full blessing. You've earned this. Represent us well, build well, and don't ever feel guilty for choosing better. We are proud of you.</li>
<li>The distance will be real but the relationship doesn't have to be. Go well — and keep your data on, because we will still be disturbing you on WhatsApp at Nigerian hours.</li>
</ul>

<h2>Short farewell messages (when you don't know them well)</h2>
<ul>
<li>Wishing you all the very best in your next role. It was a pleasure working with you.</li>
<li>Congratulations on your next chapter. May it bring everything you've worked for.</li>
<li>Best of luck going forward — you'll be missed.</li>
</ul>

<h2>How to get everyone's message into one card without chasing people</h2>
<p>Here's the reality of most Nigerian office farewell cards: someone buys a card, passes it around, half the remote staff never sign, contributions are collected via bank transfer to a personal account, and the departing colleague still leaves without knowing what was collected or by whom.</p>
<p>There's now a cleaner way. With a <a href="/occasions/farewell">Thankeeu farewell group card</a>, you create the card online, share one link on the office WhatsApp, and everyone signs from their phone — messages, photos, voice notes — and adds their contribution via Flutterwave at the same time. The colleague receives the card and withdraws their gift to any Nigerian bank. No chasing, no personal accounts, no missed signatures. <a href="/card/new">Create one in two minutes.</a></p>$content$,
'Celebration Ideas',
ARRAY['farewell card','Nigeria','what to write','colleague','send forth'],
'published', false, 'Thankeeu Team', 7, now(),
'What to Write in a Farewell Card for a Colleague in Nigeria — 50+ Messages',
'50+ farewell card messages for Nigerian colleagues — for bosses, close friends, corps members and people relocating abroad. Plus how to get everyone to sign without chasing anyone.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'How to Organise a Send-Forth for a Colleague in Nigeria (Step-by-Step)',
'how-to-organise-send-forth-colleague-nigeria',
'A proper Nigerian send-forth doesn''t plan itself. Here''s how to organise one well — venue, programme, card, contribution and gifts — without it becoming a one-person burden.',
$content$<h2>What makes a Nigerian send-forth different from a leaving party</h2>
<p>In Nigeria, a send-forth is more than a leaving party. It's a formal-ish ceremony that says: we saw what you contributed here, and we're marking it. It often has a programme, speeches, a card presented in front of people, and contributions pooled for a gift. Getting it right takes coordination — but it doesn't have to fall on one exhausted person.</p>

<h2>Step 1 — Decide who's in charge (and share the load)</h2>
<p>Pick a small planning committee of 2-3 people. One handles logistics (venue, food, time), one handles the card and contributions, one handles the programme/speeches. A send-forth that's planned by one person always shows — and the planner always resents it.</p>

<h2>Step 2 — Set a realistic budget per person</h2>
<p>Be honest about what the team can contribute. ₦2,000–₦5,000 per person is typical for a mid-sized Lagos office. Calculate based on realistic participation (not everyone who says they'll pay will). It's better to plan for 60% participation and be pleasantly surprised than to over-promise the departing colleague a gift you can't deliver.</p>

<h2>Step 3 — Start the card and contribution early</h2>
<p>The biggest send-forth mistake is starting the card collection two days before. Messages rushed under time pressure are bland. Start at least a week out — share the link, remind people twice, and close it the day before so you have time to review.</p>
<p>Using a <a href="/occasions/farewell">Thankeeu farewell group card</a> here removes the coordination nightmare entirely: one link on WhatsApp, everyone signs and contributes without bank transfers to a personal account. The departing colleague withdraws the gift directly to their Nigerian bank.</p>

<h2>Step 4 — Plan a simple programme (30–45 minutes is enough)</h2>
<p>A good send-forth programme follows this structure:</p>
<ol>
<li><strong>Opening/welcome</strong> — 2 minutes. Someone sets the tone.</li>
<li><strong>Tributes from colleagues</strong> — 3-4 people, 2 minutes each. Assign these in advance; don't call on people spontaneously.</li>
<li><strong>Response from the departing colleague</strong> — 5 minutes. Give them time to speak properly.</li>
<li><strong>Card and gift presentation</strong> — present the group card on a screen or phone, then present the physical gift if applicable.</li>
<li><strong>Prayer</strong> — almost always expected in Nigerian offices.</li>
<li><strong>Food and socialising</strong> — the part everyone actually came for.</li>
</ol>

<h2>Step 5 — Food and logistics</h2>
<p>Small chops and drinks is the Nigerian office standard and almost always right. For senior staff, a full caterer might be appropriate. Confirm dietary needs if you know the team well. Confirm the venue (boardroom, cafeteria, or off-site) at least three days out.</p>

<h2>Step 6 — Brief the speakers in advance</h2>
<p>Nothing kills a send-forth like a long, wandering speech from someone who wasn't prepared. Tell each speaker their topic and time limit the day before. "Speak to their work style" or "speak to the funniest moment you had together" gives them direction and produces better tributes.</p>

<h2>The card is what they keep forever</h2>
<p>The food is eaten, the speeches are forgotten — but the card stays. Make sure theirs is worth keeping. An online group card with messages from 20+ colleagues, photos, and voice notes is far more meaningful than a physical card signed at the last minute. <a href="/card/new">Start the farewell card here</a> — it takes two minutes, and the whole team can sign from their phones before the day arrives.</p>$content$,
'How-To Guides',
ARRAY['send forth','Nigeria','organise','farewell','office'],
'published', false, 'Thankeeu Team', 7, now(),
'How to Organise a Send-Forth for a Colleague in Nigeria — Step-by-Step',
'How to plan a proper Nigerian send-forth: budget, programme, speeches, card, contributions and gifts — without it becoming a one-person burden.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'How to Collect Money for an Office Gift in Nigeria Without Chasing Transfers (2025)',
'how-to-collect-office-contribution-gift-nigeria-2025',
'Collecting office contributions in Nigeria means chasing transfers, reconciling screenshots and hoping the money adds up. Here''s how teams now do it in one link — transparently, in Naira.',
$content$<h2>The office contribution problem every Nigerian knows</h2>
<p>It starts with a message on the group chat: <em>"We're doing ₦3,000 each for Blessing's send-forth gift, please send to my account."</em> Then begins the real work: tracking who has sent, sending individual reminders, explaining your account number for the fourth time, covering for people who forget, and reconciling fifteen different bank alerts at midnight. By the time the gift is bought, the organiser is exhausted and low-key resentful.</p>
<p>This isn't a character flaw — it's a process problem. And it has a solution.</p>

<h2>Why collecting into a personal account causes problems</h2>
<ul>
<li><strong>Accountability questions</strong> — even trusted colleagues sometimes get side-eyes about how much was collected vs. how much was spent. Money and friendships are a delicate combination.</li>
<li><strong>It excludes remote staff</strong> — the person in the Abuja branch or working from home often doesn't bother because the friction is too high.</li>
<li><strong>It always falls on one person</strong> — the most conscientious team member ends up doing all the chasing every single time.</li>
<li><strong>No transparency</strong> — contributors rarely know the total collected or how it was spent unless they ask.</li>
</ul>

<h2>How Nigerian office teams now collect contributions</h2>
<p>The modern approach is a shared contribution link that goes out with the group card. Here's exactly how it works:</p>
<ol>
<li><strong>Create a group card</strong> for the occasion — birthday, send-forth, wedding, new baby — at <a href="/card/new">Thankeeu</a>. Add an optional gift collection to it.</li>
<li><strong>Share one link</strong> on the office WhatsApp group. One link covers both the card signing <em>and</em> the contribution.</li>
<li><strong>Colleagues contribute via Flutterwave</strong> — card payment, bank transfer or USSD. No personal account involved. Contributions are transparent on the card.</li>
<li><strong>The recipient or organiser withdraws</strong> the pooled gift directly to any Nigerian bank account.</li>
</ol>
<p>The organiser's only job is sharing a link and setting a closing date.</p>

<h2>How much should you ask people to contribute?</h2>
<p>The most successful office collections in Nigeria don't set a fixed amount — they let people contribute what they're comfortable with. Fixed amounts ("₦2,000 each, mandatory") get more resistance and more non-payment than open contributions, because people's financial situations vary and nobody wants to be shamed for paying less. An open contribution also tends to produce a higher total, because people who can afford more will give more when they're not capped.</p>

<h2>When to start collecting</h2>
<p>For a birthday: at least 5 days before. For a send-forth: as soon as the leaving date is confirmed — ideally 2 weeks out. For a wedding or baby shower: the moment you know the date. The later you start, the lower the total and the more chasing required.</p>

<h2>What to buy with the pooled gift</h2>
<p>Nigerian offices typically go for: cash gift (always appreciated, never wrong), a specific item the person has mentioned wanting, a gift card, or a combination contribution toward something larger (kitchen appliance, travel bag for someone japa-ing, etc.). If in doubt, cash. It travels, it converts, and it doesn't break.</p>

<p>Ready to collect without the stress? <a href="/card/new">Create a group card with a built-in gift pool</a> — one link for messages and contributions, no personal account needed, withdrawable to any Nigerian bank.</p>$content$,
'How-To Guides',
ARRAY['office contribution','Nigeria','collect money','gift','colleague'],
'published', false, 'Thankeeu Team', 6, now(),
'How to Collect Money for an Office Gift in Nigeria Without Chasing Transfers',
'How Nigerian office teams now collect contributions for colleague gifts without chasing bank transfers — one link, transparent pooling via Flutterwave, withdrawable to any Nigerian bank.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'What to Write in a Birthday Card for Your Boss in Nigeria (With Examples)',
'what-to-write-birthday-card-boss-nigeria',
'Writing a birthday message for your boss in Nigeria requires the right balance — warm, respectful, genuine. Here are messages that hit that balance, plus prayers and what to avoid.',
$content$<h2>Why getting the boss's birthday message right matters</h2>
<p>A birthday card for your boss is one of the few moments in a Nigerian workplace where the power dynamic briefly reverses — you are marking them, not the other way around. Done well, it deepens mutual respect. Done poorly (too sycophantic, too casual, too generic) it reads immediately as insincere. Here is how to get it right.</p>

<h2>The tone to aim for</h2>
<p>Warm and genuine, not flattering. Specific if you can (referencing something real about how they lead or what they've done for the team), brief enough to read in one sitting. Think: "this is what I actually think of you" rather than "this is what I think you want to hear."</p>

<h2>Birthday messages for your boss — professional and warm</h2>
<ul>
<li>Happy birthday, sir/ma. Thank you for leading with clarity and genuine care for the people on your team. That's not as common as it should be, and we don't take it for granted.</li>
<li>Working under your leadership has taught me more than I could have learned anywhere else. Today, we celebrate you — and everything you've poured into this team. Happy birthday.</li>
<li>Happy birthday! May this new year return to you everything you've invested in the people around you — multiplied.</li>
<li>A birthday is a good time to say what the daily rush doesn't allow: thank you. For the patience, the high standards, and the doors you open. Happy birthday, boss.</li>
<li>You make excellence look like the obvious standard. It's not — it's the standard you set. Happy birthday, and may this year reward your dedication.</li>
</ul>

<h2>Birthday prayers for your boss</h2>
<ul>
<li>May God preserve you in good health and multiply your wisdom. May every good thing you have built continue to grow, and may this year bring you joy both in your career and at home.</li>
<li>Happy birthday, sir/ma. I pray this new year brings you favour in every room you enter, peace in every decision you make, and blessings that surprise even you.</li>
<li>As you add another year, may God keep your family, strengthen your health, and prosper the work of your hands. Amen.</li>
</ul>

<h2>Short messages (if you don't know them well)</h2>
<ul>
<li>Happy birthday! Wishing you a wonderful year ahead.</li>
<li>Many happy returns, sir/ma. May this year be your best yet.</li>
<li>Happy birthday — thank you for your leadership. Wishing you all the best today and in the year ahead.</li>
</ul>

<h2>What to avoid</h2>
<ul>
<li><strong>Excessive flattery</strong> — "You are the greatest boss in the world" reads as insincere to most Nigerians over 30.</li>
<li><strong>Generic filler</strong> — "HBD boss 🎂🎉" is fine on WhatsApp, not in a card meant to mark someone properly.</li>
<li><strong>Crossing personal lines</strong> — unless you have a close personal relationship, keep it professional. No comments on appearance, relationships or religion unless you are certain they're welcome.</li>
</ul>

<h2>When the whole team wants to sign</h2>
<p>The best gift you can give a boss is a card with genuine messages from every person they've led — not one typed message on behalf of everyone. A <a href="/occasions/birthday">Thankeeu group birthday card</a> lets each team member add their own personal message, photo or voice note from one link, with an optional pooled Naira gift. The boss receives one card holding every voice on their team. <a href="/card/new">Create it here</a> — takes two minutes, and the team signs from their phones before the day.</p>$content$,
'Celebration Ideas',
ARRAY['birthday card','boss','Nigeria','what to write','workplace'],
'published', false, 'Thankeeu Team', 6, now(),
'What to Write in a Birthday Card for Your Boss in Nigeria — With Examples',
'Birthday messages and prayers for your boss in Nigeria — warm, respectful and genuine. What to write, what to avoid, and how to get the whole team to sign one card.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Congratulations Messages for a New Baby in Nigeria — Prayers, Wishes & What to Write',
'new-baby-congratulations-messages-nigeria-prayers',
'The right words for a new baby in Nigeria — congratulations messages, prayers for the child, and what to write when a colleague or friend has just had a baby.',
$content$<h2>A new baby in Nigeria — why the messages matter</h2>
<p>In Nigeria, the arrival of a new baby is a community celebration. Whether it's a colleague in your department, a close friend or a family member, the news travels fast and the messages flood in. But there's a difference between a message that lands and a message that disappears in a group chat. Here's how to write one that stays.</p>

<h2>Congratulations messages for a new baby — colleagues and friends</h2>
<ul>
<li>Congratulations on your new arrival! May this child grow in wisdom, health and favour. You are going to be an amazing parent — we can already tell.</li>
<li>A baby has arrived and our hearts are full. Congratulations! May the joy of this new life fill your home every single day.</li>
<li>Welcome to parenthood! May your baby bring you more joy than you ever imagined, and may you sleep more than people say you will. Congratulations!</li>
<li>Congratulations! A new life, a new beginning — and a new reason to thank God. Wishing your family every blessing in this beautiful season.</li>
</ul>

<h2>Prayers for a new baby in Nigeria</h2>
<ul>
<li>May this child grow in the fear of God, in wisdom beyond their years, and in favour with man. May they fulfil every purpose they were created for. Amen.</li>
<li>May God protect this baby with His angels, keep them in perfect health, and make them a source of joy and pride to this family and to this nation.</li>
<li>Welcome, little one. May your life be long, your path be straight, and your parents' prayers over you come to pass one by one.</li>
<li>May this child never know sorrow, never know lack, and may every blessing the parents have prayed for be visited upon them generously. Amen.</li>
</ul>

<h2>Messages for a colleague returning from maternity/paternity leave</h2>
<ul>
<li>Welcome back! We've missed you — and we cannot wait to hear everything. How is the baby? How are you? The office is better with you in it.</li>
<li>Back to business — but different now. Congratulations again, and welcome back. The team is glad to have you.</li>
</ul>

<h2>Short messages (for group chats)</h2>
<ul>
<li>Congratulations! Baby is here and we are rejoicing with you. God bless your home.</li>
<li>A new blessing has arrived! Congratulations to the whole family.</li>
<li>Congrats! May the baby bring double portions of joy to your house. 🙏</li>
</ul>

<h2>Celebrating a colleague's new baby as a team</h2>
<p>When a colleague has a baby, the office group chat often explodes with individual "Congratulations!" messages — and the new parent misses half of them between feeds and nappy changes. A <a href="/cards/maternity-leave">group new baby card</a> gathers every message, prayer, photo and voice note from the whole team into one beautiful card the parent can read and revisit at their own pace — plus an optional pooled baby gift in Naira, withdrawable to any Nigerian bank. <a href="/card/new">Create one here.</a></p>$content$,
'Celebration Ideas',
ARRAY['new baby','congratulations','Nigeria','prayers','colleague'],
'published', false, 'Thankeeu Team', 6, now(),
'Congratulations Messages for a New Baby in Nigeria — Prayers, Wishes & What to Write',
'New baby congratulations messages and prayers for Nigerian colleagues and friends — heartfelt wishes, blessings for the child, and how to celebrate as a team.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Work Anniversary Messages for a Colleague or Employee in Nigeria (1, 5, 10 Years)',
'work-anniversary-messages-colleague-employee-nigeria',
'The right words for a work anniversary in Nigeria — messages for 1 year, 5 years, 10 years and beyond. For colleagues, direct reports and bosses.',
$content$<h2>Why work anniversaries deserve more than a WhatsApp notification</h2>
<p>In Nigerian companies, birthdays get the attention — but work anniversaries are quietly the more professionally meaningful milestone. One year in is survival. Five years is commitment. Ten years is legacy. Marking it properly takes thirty seconds with the right words — here they are.</p>

<h2>Work anniversary messages for a colleague — 1 year</h2>
<ul>
<li>One year done! You came, you stayed, and you made this place better for it. Happy work anniversary — here's to many more.</li>
<li>Happy first work anniversary! The first year is never the easiest, but you made it look effortless. Well done — and welcome to the family properly.</li>
<li>One year already? Time flies when someone's doing good work. Congratulations — and thank you for every contribution you've made this year.</li>
</ul>

<h2>Work anniversary messages — 5 years</h2>
<ul>
<li>Five years of showing up, delivering and growing. That consistency is not as common as it looks — and it does not go unnoticed. Happy work anniversary.</li>
<li>Half a decade! You've become one of the pillars of this team. Here's to five more years of the same excellence — and hopefully a few more wins along the way.</li>
<li>Happy 5th work anniversary. Thank you for your loyalty, your hard work and for being the kind of colleague that makes everything easier. You are valued.</li>
</ul>

<h2>Work anniversary messages — 10 years and above</h2>
<ul>
<li>Ten years is a career within a career. You have watched this organisation grow, contributed to its growth, and held the culture in ways that don't show up in any metric. Happy work anniversary — and thank you, sincerely.</li>
<li>A decade of dedication. May the next ten be even more rewarding, and may you always know that what you've built here matters.</li>
<li>Ten years in one place is a choice, made every day. Thank you for choosing this team, this organisation and these colleagues, repeatedly. Happy work anniversary.</li>
</ul>

<h2>Work anniversary messages from a manager to a direct report</h2>
<ul>
<li>Happy work anniversary! Your growth this year has been a pleasure to watch. Keep pushing — the best is still ahead of you.</li>
<li>Thank you for your hard work, your reliability and your good attitude. Managers notice these things even when they don't say so every day. You are genuinely appreciated.</li>
</ul>

<h2>Short work anniversary messages (for group chats)</h2>
<ul>
<li>Happy work anniversary! Congratulations on another year.</li>
<li>One more year of excellence. Well done!</li>
<li>Happy anniversary at work! May the coming year be even better.</li>
</ul>

<h2>Making the message land — as a team</h2>
<p>The difference between a work anniversary that's forgotten by lunchtime and one the employee talks about years later is usually scale: knowing that 15 colleagues noticed, not just one manager who got a HRIS reminder. A <a href="/occasions/anniversary">Thankeeu work anniversary group card</a> gathers messages from the whole team into one card delivered at the right moment — with an optional contribution for a gift. HR teams at Nigerian companies set these to run automatically so no anniversary slips through. <a href="/card/new">Create one manually here</a>, or <a href="/pricing">see the automation plans</a> for your team.</p>$content$,
'Employee Recognition',
ARRAY['work anniversary','Nigeria','messages','colleague','employee recognition'],
'published', false, 'Thankeeu Team', 6, now(),
'Work Anniversary Messages for a Colleague or Employee in Nigeria — 1, 5, 10 Years',
'Work anniversary messages for Nigerian colleagues and employees — for 1 year, 5 years, 10 years and beyond. From colleagues, managers and teams.'
) ON CONFLICT (slug) DO NOTHING;
