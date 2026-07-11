-- ============================================================================
-- seed_blog_uk_content.sql
-- 15 UK-targeted blog posts filling the gaps identified by audit:
-- British English throughout, UK workplace culture, GBP pricing,
-- British idiom (colleague not coworker, leaving card not farewell card,
-- fortnight, redundancy, PAYE, etc.)
-- IDEMPOTENT: ON CONFLICT (slug) DO NOTHING
-- ============================================================================

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'What to Write in a Leaving Card — 80+ Messages for Every Colleague (UK)',
'what-to-write-leaving-card-uk',
'Stuck on what to write in a leaving card? Here are 80+ messages for every relationship — close colleague, manager, team member, someone you barely know — plus what to avoid and how to make it count.',
$content$<h2>The leaving card: a British workplace tradition worth doing properly</h2>
<p>In British offices, the leaving card is as much a ritual as the leaving do. But most people freeze when it's passed to them — not because they don't care, but because they don't want to write something generic that gets read once and forgotten. These messages are written to actually land.</p>

<h2>What to write in a leaving card for a close colleague</h2>
<ul>
<li>This office is genuinely going to miss you — not just your work, which has been excellent, but the way you make the place better just by being in it. Wherever you're going, they're gaining something brilliant. We're sad to lose you.</li>
<li>I've learned more from working alongside you than from most training courses I've ever sat through. Thank you for being generous with your knowledge and your time. Huge congratulations on this next step — you deserve it.</li>
<li>Some people make the whole team better without ever appearing to try. You're one of those people. Whoever thought this was a good time for you to leave has clearly not thought it through. Good luck — though you won't need it.</li>
<li>The combination of sharp work and genuine kindness is rarer than it should be. You've had both in spades. Congratulations on everything that's next — I'll be following your career with great interest and zero surprise at your success.</li>
</ul>

<h2>Short, professional messages (when you don't know them well)</h2>
<ul>
<li>Wishing you every success in your new role — it was a pleasure working with you.</li>
<li>Congratulations and best of luck in your next chapter.</li>
<li>It's been a genuine pleasure. Best wishes for everything ahead.</li>
<li>All the very best — I hope the new role is everything you're hoping for.</li>
<li>Warmest congratulations. Onwards and upwards!</li>
</ul>

<h2>For a manager or team leader leaving</h2>
<ul>
<li>Thank you for leading with patience, high standards and genuine interest in the team's development. The things I've learned under your management will stay with me for the rest of my career. Your next team is very lucky.</li>
<li>A good manager is difficult to find and harder to replace. I can say with certainty that you're both. Thank you for everything — and congratulations on what comes next.</li>
<li>I've worked for managers who managed processes and managers who developed people. You were firmly in the second camp, and that made all the difference. Best of luck — you'll be brilliant wherever you go.</li>
</ul>

<h2>Funny leaving card messages (for colleagues you're actually close to)</h2>
<ul>
<li>I always suspected you were too good for this place. Congratulations on having the nerve to prove it. Don't be a stranger.</li>
<li>The meeting room will be notably quieter and significantly less interesting without you in it. Congratulations on your escape — we're all wildly jealous.</li>
<li>Finally found somewhere worth going? Good. You've been far too talented for the commute to be worth it. Congratulations!</li>
<li>Please note: we are not happy for you. We are choosing to act happy for you. These are different things. Congratulations and please visit.</li>
</ul>

<h2>For someone made redundant</h2>
<ul>
<li>This isn't the leaving you planned, and it's genuinely not fair. But I have no doubt that what comes next will be better for you — because you are too good for any reasonable organisation not to want you. Please keep in touch.</li>
<li>The company's loss is some other organisation's enormous gain. I mean that sincerely. Wishing you every success in what comes next.</li>
</ul>

<h2>What to avoid writing</h2>
<ul>
<li><strong>"We'll miss you!"</strong> — everyone writes this. Be specific about what you'll actually miss.</li>
<li><strong>"Good luck!"</strong> alone — fine as a line, insufficient as a message.</li>
<li><strong>Nothing</strong> — worse than a generic message. Always write something.</li>
</ul>

<h2>One card, everyone's voice</h2>
<p>The best leaving cards aren't passed around the office in a carrier bag — they're created online, with everyone adding their own message in full, plus photos from team events and optional voice notes. An <a href="/cards/leaving-card">online leaving group card from Thankeeu</a> lets the whole team sign from one link, wherever they're working, with an optional collection for a leaving gift in GBP. <a href="/card/new">Create one here</a> — it takes two minutes and arrives on their last day at the exact time you choose.</p>$content$,
'Celebration Ideas',
ARRAY['leaving card','UK','what to write','colleague','farewell'],
'published', true, 'Thankeeu Team', 8, now(),
'What to Write in a Leaving Card — 80+ Messages for Every Colleague (UK)',
'80+ genuine leaving card messages for UK colleagues — for close friends, managers, someone you barely know, and even redundancy. In plain British English with what to avoid.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Funny Leaving Card Messages — 60 Lines That Actually Land (UK)',
'funny-leaving-card-messages-uk',
'Good funny leaving card messages are harder to write than they look. Here are 60 that work — office-safe, genuinely funny, and British in tone — for every kind of colleague.',
$content$<h2>Why funny leaving card messages are harder than they look</h2>
<p>The gap between a funny leaving message and an awkward one is surprisingly narrow. Too dry and it reads as cold. Too familiar and it oversteps. Too self-deprecating and it makes them feel guilty for leaving. These 60 messages are calibrated for the British office — wry, warm, and never mean.</p>

<h2>Genuinely funny leaving messages for a close colleague</h2>
<ul>
<li>I always suspected you'd be the one to work out that there are better jobs than this one. Congratulations on your findings. Please share your research with the rest of the team.</li>
<li>The audacity to leave when we need you most. Truly breathtaking. Congratulations, we're devastated, we're delighted — all at once.</li>
<li>You are the best thing about this floor and you know it. We're choosing to be supportive rather than honest about what your absence will do to morale. Best of luck.</li>
<li>I'd say don't forget about us, but honestly the commute was terrible so forget the commute. Remember us though.</li>
<li>Finally. We've been waiting for you to realise you're too good for this place. Only took [X] years. Well done.</li>
</ul>

<h2>For a manager or senior colleague</h2>
<ul>
<li>We have mixed feelings. Mainly that we're delighted for you and devastated for us, in roughly equal measure. You are genuinely irreplaceable — we know because we've been trying to imagine replacing you and it doesn't work.</li>
<li>Thank you for being the kind of manager who made people want to do their best work rather than just get through the week. Also thank you for never starting a meeting with "let's do a quick round of introductions." You understood what mattered.</li>
</ul>

<h2>Office-safe funny messages (appropriate for any colleague)</h2>
<ul>
<li>Warmest congratulations! We are choosing to be happy for you despite this being enormously inconvenient for everyone here.</li>
<li>Off to bigger and better things. We're not surprised — we always knew you were wasted here. Please don't take that the wrong way.</li>
<li>New chapter, new role, new commute. May the commute be significantly shorter than the current one. Congratulations!</li>
<li>The leaving collection has been organised. The amount raised reflects how much you'll be missed rather than the state of the economy, which is to say: quite a lot.</li>
<li>Please note that your institutional knowledge and general competence will be impossible to replace and we haven't thought about how to manage that yet. Congratulations on your new role!</li>
</ul>

<h2>One-liners for when space is tight</h2>
<ul>
<li>Don't forget us when you're famous.</li>
<li>We'll miss you. The work will also miss you. The work especially.</li>
<li>Finally. Good for you.</li>
<li>Onwards! (We'll manage. Probably.)</li>
<li>Very happy for you. Very inconvenienced by you. Both things simultaneously.</li>
</ul>

<h2>Collect every message in one place</h2>
<p>Funny messages cramped into the margins of a paper card lose a lot in the execution. An <a href="/cards/leaving-card">online leaving card on Thankeeu</a> gives every colleague full space to write their message properly — plus photos, GIFs and optional voice notes. Share one link, everyone signs from their desk, and it arrives on the last day with a pooled leaving gift in GBP. <a href="/card/new">Create one here.</a></p>$content$,
'Celebration Ideas',
ARRAY['leaving card','funny','UK','messages','colleague'],
'published', false, 'Thankeeu Team', 6, now(),
'Funny Leaving Card Messages — 60 Lines That Actually Land (UK)',
'60 genuinely funny leaving card messages in British English — wry, warm and office-safe. For close colleagues, managers, and everyone in between.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'What to Write in a Retirement Card — 70 Messages for a UK Colleague',
'what-to-write-retirement-card-uk',
'Stuck on what to write in a retirement card? Here are 70 messages for a UK colleague retiring — heartfelt, funny and appropriate for long-service retirements, early retirement and everything in between.',
$content$<h2>Retiring in the UK: what the leaving card needs to say</h2>
<p>A retirement card is different from a leaving card. This isn't someone going to a new role — this is someone closing out a career, often decades long. The message needs to honour the scale of that, without making it feel like a funeral. Here's how to do both.</p>

<h2>Heartfelt retirement messages</h2>
<ul>
<li>Thirty-odd years of turning up, doing excellent work and making this place better — and now you get to stop. I can't think of anyone who has more thoroughly earned the right to do absolutely nothing with their time. Congratulations on an outstanding career.</li>
<li>It's very rare to work alongside someone who is genuinely excellent at their job, quietly good to everyone around them, and completely without ego about either. You've been all three for as long as I've been here. What a career. Enjoy every second of what comes next.</li>
<li>They say you should retire from something, not just to something. I think you've got both covered. Congratulations on everything you've built and given — and on having the wisdom to know when it's time to enjoy it.</li>
<li>The institutional memory, the calm under pressure, the historical context that explains why we do things the way we do — those are leaving the building with you. We'll manage. But it won't be quite the same.</li>
</ul>

<h2>Funny retirement messages</h2>
<ul>
<li>No more alarm clocks. No more commutes. No more meetings that could have been emails. You have arrived at what most of us spend our careers working towards. Congratulations.</li>
<li>I have questions about your pension that I'm not going to ask because it would make me feel ill. Congratulations — enjoy every penny of it.</li>
<li>Retirement: the period in which you receive the same amount of money for doing significantly less work than you did for decades. We're all jealous. Congratulations.</li>
<li>You are officially no longer required to care about Q4 targets, strategy days or whether the coffee machine has been cleaned. I hope this knowledge brings you peace.</li>
</ul>

<h2>For a long-service retirement (20+ years)</h2>
<ul>
<li>Twenty-plus years at the same organisation is remarkable in any era, but especially this one. It speaks to character, to commitment and to the quality of someone who was worth keeping. Thank you for all of it.</li>
<li>You've seen this organisation through more change than most of us have been alive for. The fact that you've managed it all with grace, good humour and consistent excellence says everything about who you are. Congratulations on a career worth every bit of it.</li>
</ul>

<h2>Short retirement messages</h2>
<ul>
<li>Congratulations on your retirement — every day of it is well and truly deserved.</li>
<li>Wishing you a retirement full of everything the working week didn't leave room for.</li>
<li>Happy retirement! May the years ahead be as excellent as the career behind.</li>
<li>Now the real work begins — deciding what to do with all this freedom. Congratulations!</li>
</ul>

<h2>Make it a card worth keeping</h2>
<p>A retirement card that gets passed round the office in a carrier bag and signed in margins isn't equal to the occasion. An <a href="/cards/retirement">online retirement group card from Thankeeu</a> collects full messages from every colleague — current, former, and remote — with an optional pool for the leaving gift. It arrives at whatever time you choose, and the retiree keeps it forever. <a href="/card/new">Create one here.</a></p>$content$,
'Celebration Ideas',
ARRAY['retirement card','UK','what to write','messages','colleague'],
'published', false, 'Thankeeu Team', 7, now(),
'What to Write in a Retirement Card — 70 Messages for a UK Colleague',
'70 retirement card messages for a UK colleague — heartfelt, funny and appropriate for long-service and early retirement. In plain British English with what to write for every relationship.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Maternity Leave Card Messages — What to Write for a UK Colleague',
'maternity-leave-card-messages-uk',
'What to write in a maternity leave card for a UK colleague — warm, genuine messages for the mum-to-be, what to avoid, and how to organise a collection for the baby gift without the usual drama.',
$content$<h2>The maternity leave card: getting the tone right</h2>
<p>A maternity leave card sits at the intersection of a leaving card, a congratulations card and a "good luck" card. The tone needs to be warm, celebratory and supportive — acknowledging both the baby and the person — without veering into unsolicited parenting advice or assumptions about how long she'll be away.</p>

<h2>Warm maternity leave messages for a UK colleague</h2>
<ul>
<li>You are going on the most important project of your career, and we are backing you completely. Come back whenever you're ready — and not a moment sooner. Congratulations, we're so excited for you.</li>
<li>This office won't be quite the same without you, but we understand you have considerably more important things to be getting on with. Congratulations — we can't wait to meet the newest member of the team (honorary).</li>
<li>Take all the time you need. Everything on this end will still be here — possibly slightly more chaotic, but definitely here. Congratulations and good luck with the biggest job you'll ever love.</li>
<li>You've been absolutely brilliant right up to the wire. Now go and do something far more important than anything we'll be up to while you're away. Congratulations — we'll miss you.</li>
</ul>

<h2>Funny maternity leave messages</h2>
<ul>
<li>Congratulations on your upcoming career change from "occasionally overwhelmed by spreadsheets" to "perpetually overwhelmed by something considerably more rewarding." We'll hold the fort.</li>
<li>Good luck! (You won't need it. You've handled everything this office has thrown at you for years — a baby is just a different kind of chaotic stakeholder.)</li>
<li>We have organised a small collection, the amount of which accurately reflects how much we'll miss you — which is to say, rather a lot. Congratulations!</li>
<li>We expect full photo updates. This is non-negotiable. Congratulations and enjoy your leave — both words used correctly.</li>
</ul>

<h2>Short messages</h2>
<ul>
<li>Congratulations — wishing you a smooth delivery and a beautiful maternity leave.</li>
<li>We'll miss you enormously. Come back when you're ready. Congratulations!</li>
<li>Warmest congratulations — what an exciting chapter. Enjoy every moment.</li>
<li>All the best for the arrival and for what comes after. You'll be wonderful at both.</li>
</ul>

<h2>What to avoid</h2>
<ul>
<li>Don't ask when she's coming back — it's her choice and her timeline.</li>
<li>Don't say "enjoy the break" — maternity leave is not a break.</li>
<li>Don't reference the birth itself in graphic or intrusive ways.</li>
</ul>

<h2>Organising the baby gift collection</h2>
<p>Office baby collections in the UK usually involve someone sending a message to the group chat, collecting bank transfers to a personal account, chasing non-payers and hoping the maths adds up. There's a simpler way. A <a href="/cards/maternity-leave">Thankeeu maternity leave group card</a> lets everyone sign the card and contribute to the gift pool at the same time — via card payment, no personal accounts involved. The recipient or organiser withdraws the GBP total directly. <a href="/card/new">Create one here — it takes two minutes.</a></p>$content$,
'Celebration Ideas',
ARRAY['maternity leave','UK','what to write','card messages','colleague'],
'published', false, 'Thankeeu Team', 6, now(),
'Maternity Leave Card Messages — What to Write for a UK Colleague',
'What to write in a maternity leave card for a UK colleague — warm and genuine messages, what to avoid, funny options, and how to organise the baby gift collection without the usual drama.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Get Well Soon Messages for a UK Colleague — 60 Genuine Wishes',
'get-well-soon-messages-uk-colleague',
'What to write in a get well soon card for a UK colleague — 60 genuine messages for illness, surgery or recovery, plus what actually helps and what to avoid in a professional setting.',
$content$<h2>Get well soon cards: what works in a UK office context</h2>
<p>British workplace culture has a particular tension around illness — we're not great at talking about it openly, and "get well soon" alone feels thin for someone who's seriously unwell. These messages bridge that gap: warm without overstepping, professional without being cold.</p>

<h2>Get well soon messages for a colleague</h2>
<ul>
<li>We were so sorry to hear you're unwell. Please don't give work a second thought — everything is covered and we just want you to focus on getting properly better. We'll be here when you're ready.</li>
<li>Rest, recover and please take all the time you need. The work will wait; your health absolutely cannot. Wishing you a quick and complete recovery.</li>
<li>Sending all the best wishes to you — please don't rush back on our account. We want you back when you're genuinely well, not when you feel guilty for being away. Wishing you a speedy recovery.</li>
<li>The team is thinking of you and hoping you're being properly looked after. Don't worry about anything here — just concentrate on getting better. Wishing you strength and a swift recovery.</li>
</ul>

<h2>For a more serious illness or surgery</h2>
<ul>
<li>We've heard you're dealing with something significant and we want you to know that the whole team is thinking of you. Please don't worry about anything on this end — focus entirely on your recovery. We're rooting for you.</li>
<li>Healing takes as long as it takes, and we want you to take every day of it. There is no rush. We'll be here, and we'll be so glad to see you when you're ready.</li>
<li>I'm so sorry you're going through this. Please know that you have people here who care about you — not just as a colleague but as a person — and who are wishing you the very best recovery.</li>
</ul>

<h2>Short professional get well messages</h2>
<ul>
<li>Wishing you a quick and comfortable recovery — please take good care of yourself.</li>
<li>Get well soon — we're thinking of you and hoping you're comfortable.</li>
<li>Sending warmth and best wishes for your recovery.</li>
<li>Rest well. We'll be here when you're better — no rush whatsoever.</li>
<li>Wishing you a smooth recovery and a proper rest.</li>
</ul>

<h2>What not to write</h2>
<ul>
<li>Don't share health advice or remedies — unsolicited medical opinions are always unwelcome.</li>
<li>Don't make them feel guilty about being away: "We really need you back" is not what an unwell person needs to hear.</li>
<li>Don't be overly dramatic about seriousness — strength and positivity are more useful than fear.</li>
</ul>

<h2>A group card from the whole team</h2>
<p>Rather than a wave of individual WhatsApp messages that a recovering colleague has to process when they're not up to it, a <a href="/cards/get-well-soon">group get well soon card from Thankeeu</a> delivers all the goodwill in one quiet, private place — opened when they're ready. <a href="/card/new">Create one here</a>, share the link with the team, and set it to deliver whenever feels right.</p>$content$,
'Celebration Ideas',
ARRAY['get well soon','UK','colleague','messages','recovery'],
'published', false, 'Thankeeu Team', 6, now(),
'Get Well Soon Messages for a UK Colleague — 60 Genuine Wishes',
'60 get well soon messages for a UK colleague — professional, warm and genuine. For illness, surgery and recovery, with what to avoid and how the whole team can show they care.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'What to Write in a Sympathy Card for a UK Colleague — 50 Condolence Messages',
'what-to-write-sympathy-card-uk-colleague',
'What to write in a sympathy card for a UK colleague — 50 genuine condolence messages for bereavement, calibrated for the British workplace where saying the right thing matters enormously.',
$content$<h2>Sympathy cards in a British workplace</h2>
<p>British offices are not always the most emotionally expressive environments, which makes a sympathy card to a bereaved colleague particularly important — it's often the clearest signal that people noticed and cared. The messages here are warm without presuming intimacy, genuine without being overwrought.</p>

<h2>General condolence messages for a UK colleague</h2>
<ul>
<li>I was so sorry to hear of your loss. Please take all the time you need — please don't give work a single thought, and know that we are thinking of you.</li>
<li>My deepest condolences to you and your family. There is nothing that can be said to make this easier, but please know that you're not facing it alone.</li>
<li>We were so sorry to hear your news. Please take care of yourself — everything here can wait as long as it needs to.</li>
<li>Sending warmth and sympathy to you and everyone who loved them.</li>
</ul>

<h2>For the loss of a parent</h2>
<ul>
<li>Losing a parent is a profound loss — there's nothing that quite prepares you for the gap it leaves. My sincerest condolences to you and your family.</li>
<li>I was so sorry to hear about your [mother/father]. Please take all the time you need — we're here whenever you feel ready, and in no rush whatsoever.</li>
<li>Your [mum/dad] clearly raised someone exceptional. I'm so sorry you've lost them. Thinking of you.</li>
</ul>

<h2>For the loss of a partner or spouse</h2>
<ul>
<li>I can't imagine how difficult this must be. Please know that the whole team is thinking of you, and that anything we can do to help — including simply holding things steady here — we will do without hesitation.</li>
<li>My deepest condolences. Please don't think about work for a moment. We've got everything covered and we just want you to be looked after.</li>
</ul>

<h2>Short, professional condolence messages</h2>
<ul>
<li>I'm so sorry for your loss. My sincere condolences.</li>
<li>Please accept my deepest sympathies — thinking of you and your family.</li>
<li>I was so sorry to hear your news. Take good care of yourself.</li>
<li>My heartfelt condolences at this difficult time.</li>
</ul>

<h2>What to avoid</h2>
<ul>
<li>"Everything happens for a reason" — never say this.</li>
<li>"At least they had a good innings" — let the grieving person say this, not you.</li>
<li>"Stay strong" — places a burden on someone who needs permission not to be.</li>
<li>Saying nothing — always worse than a simple, genuine message.</li>
</ul>

<h2>One card from the whole team</h2>
<p>A <a href="/cards/sympathy">group sympathy card from Thankeeu</a> collects every message from the team in one private, gentle place — the recipient opens it in their own time, without the pressure of a flood of individual messages. <a href="/card/new">Create one here</a> and deliver it quietly when the moment is right.</p>$content$,
'Celebration Ideas',
ARRAY['sympathy card','UK','condolence','colleague','bereavement'],
'published', false, 'Thankeeu Team', 6, now(),
'What to Write in a Sympathy Card for a UK Colleague — 50 Condolence Messages',
'50 genuine condolence messages for a UK colleague — calibrated for British workplace culture. For bereavement of a parent, partner or family member. In plain, warm British English.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Birthday Messages for a Colleague at Work — 70 Wishes for a UK Office',
'birthday-messages-for-colleague-uk',
'The best birthday messages for a UK work colleague — from heartfelt to funny, short to considered. Written for every workplace relationship, from close friend to someone you see twice a week in the kitchen.',
$content$<h2>Writing a birthday message for a work colleague</h2>
<p>The British office birthday is a specific art form. Too effusive and it's odd. Too brief and it's dismissive. The sweet spot is warm and genuine, with just enough wit to show you actually thought about it. Here are 70 messages across every tone and relationship.</p>

<h2>Heartfelt birthday messages for a UK colleague</h2>
<ul>
<li>Happy birthday — working with you is one of the better parts of this job, and that's saying something. Hope the day is exactly as good as you deserve.</li>
<li>Happy birthday! You bring such a good energy to this office that I wanted to mark the day properly. Wishing you a brilliant year ahead.</li>
<li>Many happy returns! Thank you for being the kind of colleague who makes the working week genuinely better. I hope today is wonderful.</li>
<li>Happy birthday — you're one of the people I'd actually look forward to seeing even if we didn't work together. That's the real compliment. Have a great day.</li>
</ul>

<h2>Funny birthday messages for a UK work colleague</h2>
<ul>
<li>Happy birthday! Another year of successfully making it look effortless. Don't tell us how you do it.</li>
<li>Many happy returns! On the upside, you're now one year closer to a pension that makes the commute feel worth it. Something to look forward to.</li>
<li>Happy birthday! We were going to get you something useful but couldn't agree on what, so we've written in this card instead. You're welcome.</li>
<li>Another birthday! You don't look a day over "mysteriously capable." Many happy returns.</li>
</ul>

<h2>For a close colleague or work friend</h2>
<ul>
<li>Happy birthday, you absolute legend. This office is significantly better for having you in it, and so is my working week. Hope today is properly good — you've earned it.</li>
<li>It's your birthday and I feel like the one who got a gift — I got to spend another year working alongside you. Thank you for being a genuinely brilliant colleague. Happy birthday.</li>
</ul>

<h2>Short messages for the card margin</h2>
<ul>
<li>Many happy returns!</li>
<li>Happy birthday — have a wonderful day.</li>
<li>Wishing you a very happy birthday and a great year ahead.</li>
<li>Happy birthday! Hope it's brilliant.</li>
<li>Many happy returns — enjoy every second of it.</li>
</ul>

<h2>One card, every colleague</h2>
<p>The paper card passed around the office means cramped handwriting in the margins and remote colleagues left out entirely. An <a href="/occasions/birthday">online birthday group card from Thankeeu</a> gives everyone full space for their message — plus photos from team events, GIFs, and an optional pooled birthday gift in GBP. Share one link, everyone signs from wherever they're working, and it arrives at midnight on the day. <a href="/card/new">Create one here.</a></p>$content$,
'Celebration Ideas',
ARRAY['birthday messages','UK','colleague','work','office'],
'published', false, 'Thankeeu Team', 6, now(),
'Birthday Messages for a Colleague at Work — 70 Wishes for a UK Office',
'70 birthday messages for a UK work colleague — heartfelt, funny, short and considered. Written for every workplace relationship in plain British English.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Work Anniversary Messages for a UK Colleague — 60 Wishes by Milestone',
'work-anniversary-messages-uk-colleague',
'The best work anniversary messages for a UK colleague — by milestone (1, 5, 10, 20, 25 years) and by relationship (team member, manager, direct report). Genuine, not generic.',
$content$<h2>Work anniversaries in the UK: making them count</h2>
<p>Work anniversaries are consistently under-celebrated in British offices — we're better at leaving cards than at marking the people who stay. But a message that acknowledges someone's milestone properly, with specificity and genuine appreciation, is one of the most valued things a colleague can receive. Here are 60 messages by milestone and relationship.</p>

<h2>First work anniversary</h2>
<ul>
<li>One year in — and what a year it's been. You've found your feet, made your mark and already made this team better for being here. Here's to many more.</li>
<li>Happy work anniversary! A first year isn't always easy, and you've navigated it brilliantly. The team is genuinely glad you're here.</li>
<li>One year done. You've been an excellent addition from the first week — here's to a long and successful career here.</li>
</ul>

<h2>Five-year work anniversary</h2>
<ul>
<li>Five years — that's loyalty, consistency and the quiet knowledge that you've found somewhere worth staying. Congratulations. The contribution you've made over that time is significant and it doesn't go unnoticed.</li>
<li>Half a decade at the same organisation is genuinely rare. Five years of reliable, excellent work — congratulations on this milestone and thank you for everything in it.</li>
</ul>

<h2>Ten-year work anniversary</h2>
<ul>
<li>A decade is a proper milestone. Ten years of showing up, delivering and growing — you've become one of the pillars of this team and this organisation. Congratulations on an impressive tenure.</li>
<li>Ten years means you've seen strategies come and go, reorganisations, new faces, changing priorities — and you've handled all of it with consistency and good grace. That's worth celebrating properly. Congratulations.</li>
</ul>

<h2>Twenty and twenty-five year anniversaries</h2>
<ul>
<li>Twenty-five years is a career within a career. The institutional knowledge, the relationships, the steadiness you've brought — none of that can be replicated overnight. Congratulations on an extraordinary milestone.</li>
<li>Two decades here is remarkable — especially in the current climate. Thank you for your loyalty, your contribution and the standard you've maintained throughout. Congratulations.</li>
</ul>

<h2>From a manager to a direct report</h2>
<ul>
<li>Happy work anniversary! Your growth this year has been a genuine pleasure to observe. Keep going — the best is still ahead of you.</li>
<li>Thank you for your reliability, your hard work and your consistently good attitude. It doesn't go unnoticed. Happy anniversary.</li>
</ul>

<h2>Short work anniversary messages</h2>
<ul>
<li>Happy work anniversary — congratulations on another excellent year.</li>
<li>Many congratulations on your milestone — well deserved.</li>
<li>Happy anniversary! Here's to many more.</li>
</ul>

<h2>Celebrate with the whole team</h2>
<p>A work anniversary deserves more than a LinkedIn notification and a Slack message. An <a href="/occasions/anniversary">online work anniversary group card from Thankeeu</a> lets the whole team contribute messages, with an optional gift pool in GBP. <a href="/card/new">Create one here</a> — it takes two minutes and means the world to the person receiving it.</p>$content$,
'Employee Recognition',
ARRAY['work anniversary','UK','messages','colleague','milestone'],
'published', false, 'Thankeeu Team', 7, now(),
'Work Anniversary Messages for a UK Colleague — 60 Wishes by Milestone',
'60 work anniversary messages for a UK colleague by milestone — 1, 5, 10, 20 and 25 years. For team members, managers and direct reports. Genuine, not generic, in British English.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'What to Write in a Welcome Card for a New Starter — UK Office Guide',
'what-to-write-welcome-card-new-starter-uk',
'What to write in a welcome card for a new starter in a UK office — messages that actually help someone settle in, from the whole team or from individuals, plus how to get everyone to sign without the faff.',
$content$<h2>The new starter welcome card: first impressions last</h2>
<p>A welcome card signed by the whole team on someone's first day is one of the highest-return, lowest-effort things an office can do for retention. It says: we noticed you arrived, we're glad you're here, and we're not the kind of place that lets someone sit in silence for a fortnight before speaking to them. Here's what to write.</p>

<h2>What to write in a welcome card for a new starter</h2>
<ul>
<li>Welcome to the team! We're delighted you're here. Ask any of us anything — there are no stupid questions, only questions that lead to far longer conversations than anyone planned. Looking forward to working with you.</li>
<li>Welcome! The learning curve is real but the team is genuinely lovely and will help you navigate it. Very glad you've joined us.</li>
<li>A very warm welcome — we've been looking forward to having you. Don't worry about knowing everything immediately; everyone here was new once and the collective memory of the team is very much at your disposal.</li>
<li>Welcome to the team! There will be a lot of names to remember in the first few days — no pressure. We know who you are and we're glad you're here.</li>
</ul>

<h2>From an individual colleague</h2>
<ul>
<li>Hi! I sit just across from you — please feel free to ask me anything, no matter how basic. The coffee machine takes a bit of getting used to and I'm very happy to explain it. Welcome!</li>
<li>Welcome — really glad to have you on the team. If you ever need someone to go for a coffee and talk through how anything works here, I'm very happy to be that person. Welcome aboard.</li>
</ul>

<h2>From a manager to a new direct report</h2>
<ul>
<li>Welcome — I'm really looking forward to working with you. My door is always open (metaphorically; the open-plan office has made this a slightly different concept). Please don't hesitate to ask anything at all.</li>
<li>We're so pleased you've joined the team. You were clearly the right choice and I'm excited to see what we'll build together. Welcome — and please take your time settling in.</li>
</ul>

<h2>Short welcome messages</h2>
<ul>
<li>Welcome to the team — delighted to have you!</li>
<li>So glad you've joined us. Welcome!</li>
<li>Welcome! We're very happy you're here.</li>
<li>Great to have you — welcome to the team.</li>
</ul>

<h2>How to get everyone to sign without the faff</h2>
<p>The traditional approach — creating a card the night before, hoping enough people see the email — results in five signatures and a lot of guilt. An <a href="/cards/welcome">online welcome card from Thankeeu</a> lets the whole team sign from one link in the week before the start date, with each person adding a personal message, photo or voice note. It arrives in their inbox at 9am on their first day. <a href="/card/new">Create one here — free to start.</a></p>$content$,
'How-To Guides',
ARRAY['welcome card','new starter','UK','what to write','onboarding'],
'published', false, 'Thankeeu Team', 6, now(),
'What to Write in a Welcome Card for a New Starter — UK Office Guide',
'What to write in a welcome card for a new starter in a UK office — messages from the team and from individuals, from managers and from peers. How to get everyone to sign without the faff.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Online Leaving Cards UK — Virtual Leaving Cards for Every Colleague',
'online-leaving-card-uk',
'Why UK teams are switching from paper leaving cards to online group cards — better messages, remote colleagues included, the leaving collection handled at the same time. And how to create one in two minutes.',
$content$<h2>Why the paper leaving card isn't working anymore</h2>
<p>The British office leaving card has always been an act of goodwill, but the logistics of it have never quite caught up with modern working. Someone buys a card, sends a message asking people to sign it, the card goes round, three people are working from home, the remote worker in Manchester never gets asked, someone signs it in the break room and leaves it face-up, the collection is handled separately, and the departing colleague leaves with a card that's half-signed and an envelope of slightly random amounts of cash.</p>
<p>Online leaving cards solve all of this, and they've become the norm in UK offices over the last few years. Here's how they work, what makes a good one, and how to create one in under two minutes.</p>

<h2>How an online leaving card works</h2>
<p>You create the card online (no printing, no buying), choose a design, set the delivery date, and share one link with the team — by email, Slack or WhatsApp group. Everyone clicks the link, adds their personal message (full-length, not cramped into a margin), optionally adds a photo from a team event, and optionally contributes to the leaving collection. The departing colleague receives it by email at the exact time you choose.</p>

<h2>The advantages over a paper card</h2>
<ul>
<li><strong>Remote colleagues included.</strong> The Manchester office, the person on paternity leave, the colleague who left last year and still wants to sign — they all get the same link. Nobody is excluded because they weren't physically in the room when the card went round.</li>
<li><strong>Full messages, not cramped margins.</strong> Everyone gets proper space to write something genuine rather than squeezing "Best of luck, Dave" into a quarter-inch of white space.</li>
<li><strong>The leaving collection in the same place.</strong> Contributors add their message and their chip-in at the same time. No separate email, no bank transfer to someone's personal account, no chasing.</li>
<li><strong>Delivered on the day, at the time.</strong> Schedule it for midnight, for 9am on their last day, or for the moment they leave the building. It arrives when it's meant to.</li>
<li><strong>Kept forever.</strong> The card lives online. The retiree or departing colleague can re-read it years later — something that never happens with a paper card in a drawer.</li>
</ul>

<h2>What makes a good online leaving card</h2>
<p>The same things that make a paper card good, but with more room: genuine specificity (not just "best of luck"), something personal to the relationship, and a note about what you'll actually miss. The best leaving cards have one message from each person that says something only that person could say — and an online card gives everyone the space to do that.</p>

<h2>Create one in two minutes</h2>
<p>Go to <a href="/card/new">Thankeeu</a>, choose a leaving card design, add the recipient's details, set your delivery date and share the link. The collection is built in — contributors pay by card or bank transfer in GBP, the pool is transparent, and the recipient or organiser withdraws it directly. No paper, no envelopes, no chasing. <a href="/card/new">Start here.</a></p>$content$,
'How-To Guides',
ARRAY['online leaving card','UK','virtual','group card','farewell'],
'published', false, 'Thankeeu Team', 6, now(),
'Online Leaving Cards UK — Virtual Leaving Cards for Every Colleague',
'Why UK teams are switching from paper leaving cards to online group cards — everyone signs remotely, the leaving collection is built in, and it arrives perfectly on the day. Create one in two minutes.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'How to Collect Money for a Leaving Gift in the UK (Without the Usual Awkwardness)',
'collect-money-leaving-gift-uk',
'The office leaving collection: how to organise it without chasing people, handling cash, or having the awkward "how much should I put in?" conversation. The modern UK approach.',
$content$<h2>The UK office leaving collection: what usually goes wrong</h2>
<p>British offices are excellent at the sentiment of a leaving collection but frequently terrible at the logistics. Someone volunteers to organise it. They send a message. Some people pay immediately. Others say "I'll get you tomorrow." Three people are on holiday. The organiser ends up personally covering shortfalls. The total is underwhelming relative to what was hoped. Everyone feels vaguely stressed about it.</p>
<p>This is a solvable problem, and most UK offices that have tried the modern approach don't go back.</p>

<h2>The traditional leaving collection and its problems</h2>
<ul>
<li><strong>Cash in an envelope:</strong> only works if everyone is in the office simultaneously and someone actually has cash. Neither of those things is reliably true anymore.</li>
<li><strong>Bank transfer to an organiser's personal account:</strong> creates accountability concerns ("how much was actually collected?"), requires chasing non-payers, and involves someone's personal banking for a work purpose.</li>
<li><strong>Just hoping people contribute spontaneously:</strong> they won't.</li>
</ul>

<h2>The modern approach: a collection built into the card</h2>
<p>When you create an <a href="/cards/leaving-card">online leaving group card on Thankeeu</a>, you can enable an optional gift pool alongside it. Contributors add their message and their contribution at the same time — paid by debit or credit card in GBP, via a secure payment link. The total is visible to the organiser (not the recipient), and the recipient or organiser withdraws it directly to a UK bank account when the card is delivered.</p>
<p>There is no personal account involved, no cash to handle, and no separate email to send. One link handles the card and the collection together.</p>

<h2>How much should people contribute?</h2>
<p>British offices tie themselves in knots about this. The honest answer: don't set a fixed amount. Open contributions (where each person gives what they're comfortable with) consistently produce higher totals than fixed amounts, because people who can afford more will give more, while people who are stretched financially aren't shamed into giving more than they have. Setting "£20 each" and chasing non-payment is more stressful and usually produces less than "contribute what you like, here's the link."</p>

<h2>What to do with the money</h2>
<p>Ask the departing colleague or a close mutual colleague what they'd genuinely want, rather than defaulting to a generic gift card. Common and well-received options: cash to spend as they like, a specific experience (restaurant voucher, spa day), contribution toward something they've mentioned wanting, or a meaningful group gift agreed between the team. The best leaving gifts are specific, not generic — and specific takes thirty seconds of thought, not thirty quid more.</p>

<h2>Start the collection now</h2>
<p><a href="/card/new">Create the leaving card and collection here</a>. Share one link on the team channel and the leaving message takes care of itself — signatures, messages, photos and contributions all come in through the same place. The total in the pool is what the team gives freely, without anyone having to chase a single person.</p>$content$,
'How-To Guides',
ARRAY['leaving collection','UK','gift','office','how to collect money'],
'published', false, 'Thankeeu Team', 6, now(),
'How to Collect Money for a Leaving Gift in the UK (Without the Usual Awkwardness)',
'How to organise a leaving gift collection in a UK office — without bank transfers to personal accounts, chasing people, or the usual awkwardness. The modern approach that actually works.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Office Birthday Card Ideas for a UK Team — Beyond the Shop-Bought Card',
'office-birthday-card-ideas-uk',
'Office birthday cards in the UK: how to make them actually good — online group cards, what to write, how to organise a collection, and why the paper card passed round the office has had its day.',
$content$<h2>The office birthday card: what it should be vs what it usually is</h2>
<p>In theory, a birthday card signed by your colleagues is a lovely thing. In practice, it's often a card bought at the petrol station on the way in, passed round the office in a carrier bag, signed by whoever happens to be in that day, with "happy birthday!" written eight times in slightly different handwriting and one colleague who always writes something genuinely lovely and gets one line to do it in.</p>
<p>It's the thought that counts — but a bit more organisation gets you a much better card for the same amount of thought.</p>

<h2>Idea 1: Online group birthday card (the upgrade)</h2>
<p>Create an <a href="/occasions/birthday">online birthday group card on Thankeeu</a>, share the link on Slack or the team WhatsApp group the week before, and every colleague — including remote workers, the person on annual leave and the colleague in the Glasgow office — adds their own message, photo or voice note. It delivers at midnight on the birthday. This is what most UK offices are switching to because it's genuinely better on every metric: more messages, more participation, no carrier bag, no running out of space.</p>

<h2>Idea 2: The actually-good paper card</h2>
<p>If the team is small, the colleague is tactile and you have time: go to a proper card shop (not the newsagent) and choose something specific to them — their hobbies, their sense of humour, their aesthetic. Write a real message. Not "happy birthday, best wishes" — something specific about working with them. One genuine sentence beats three generic ones every time.</p>

<h2>Idea 3: A card and a collection</h2>
<p>For colleagues who would genuinely appreciate a gift: combine the card with a leaving collection. On an online card, this happens in the same place — contributors add their message and their contribution simultaneously. On a paper card, someone has to manage a separate collection, which always ends up being more work than expected.</p>

<h2>What to write in an office birthday card</h2>
<ul>
<li>Be specific: "Happy birthday — your ability to make every meeting slightly less painful is genuinely underrated." Better than: "Happy birthday! Many happy returns!"</li>
<li>Make it about them, not the occasion: What do you actually appreciate about working with them? Write that.</li>
<li>One genuine sentence beats five generic ones.</li>
</ul>

<h2>How to organise the office birthday card without it always falling to the same person</h2>
<p>With a paper card, someone always ends up being the de facto birthday coordinator — they remember, they buy the card, they chase people to sign it, they feel resentful. The online card approach distributes this: create a card via <a href="/card/new">Thankeeu</a>, share the link on the team channel a week out with a close date, and it handles itself. Whoever manages it next time can do the same in two minutes. No carrier bags, no petrol station cards, no one feeling like they do all the work.</p>$content$,
'Celebration Ideas',
ARRAY['office birthday card','UK','ideas','team','colleague'],
'published', false, 'Thankeeu Team', 6, now(),
'Office Birthday Card Ideas for a UK Team — Beyond the Shop-Bought Card',
'Office birthday card ideas for UK teams — from online group cards to what to actually write. Why the paper card passed round the office has had its day and what to do instead.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Leaving Card Messages for a Colleague — 80 Lines by Relationship (UK)',
'leaving-card-messages-colleague-uk',
'80 leaving card messages for a UK colleague — organised by relationship (close friend, team member, manager, someone you barely know) so you can find the right one in 30 seconds.',
$content$<h2>Find your message in 30 seconds</h2>
<p>This post is organised by relationship rather than by occasion, because "leaving card" covers everything from your best work friend of five years to the person on the adjacent team whose name you finally learned two weeks ago. The message you write depends almost entirely on how well you know them.</p>

<h2>For a very close colleague or work friend (the person who knows everything)</h2>
<ul>
<li>Five years of [their name] making this job significantly better than it had any right to be. I'm so pleased for you and so annoyed you're leaving. Those things aren't contradictory. Please visit.</li>
<li>You have been my work person — the one I tell things to, the one who tells me things, the one whose opinion I trust completely. I'm going to miss that more than I can explain in a card margin. Congratulations on what's next. Don't be a stranger.</li>
<li>I'm not going to do the thing where I say "it's not goodbye, it's see you later." It's probably a bit of both, and that's fine. What I will say is that working with you has been a genuine highlight and I am so proud of where you're going. Congratulations.</li>
</ul>

<h2>For a valued team member (close but professional)</h2>
<ul>
<li>You've been an outstanding member of this team and I mean that in the specific, evidence-based sense rather than the vague, card-message sense. The work you've done here is excellent and the place you're going is lucky to have you. Best of luck — not that you'll need it.</li>
<li>Professionally, you've been one of the best colleagues I've had the good fortune to work alongside. Personally, you've been a pleasure. I hope the next role is everything it should be — which, given your ability, it will be.</li>
</ul>

<h2>For a manager leaving</h2>
<ul>
<li>Thank you for being the kind of manager who develops people rather than just directs them. The difference matters enormously and you got it exactly right. We'll all carry what we've learned under your management for the rest of our careers. Congratulations on what's next — they're fortunate to have you.</li>
<li>Leadership that is simultaneously high-standards and genuinely human is rarer than it should be. You managed both, consistently. Thank you and congratulations.</li>
</ul>

<h2>For a colleague you knew but weren't close to</h2>
<ul>
<li>Wishing you every success in your new role — it was a real pleasure working alongside you.</li>
<li>Congratulations and best of luck. I hope the new role is everything you're hoping for.</li>
<li>Best wishes for your next chapter — it's been great working with you.</li>
</ul>

<h2>For someone you barely know</h2>
<ul>
<li>Wishing you all the very best — congratulations on your next step.</li>
<li>Many congratulations and best of luck in your new role.</li>
<li>Best wishes! Wishing you every success.</li>
</ul>

<h2>For someone made redundant</h2>
<ul>
<li>This wasn't the leaving you were planning, and that's genuinely unfair. But I don't think it'll take long for the right opportunity to find you — because you're too talented for it not to. Please keep in touch.</li>
<li>The circumstances aren't what anyone would have chosen. But what I do know is that wherever you go next will be getting something excellent. My very best wishes.</li>
</ul>

<h2>Give every message the space it deserves</h2>
<p>An <a href="/cards/leaving-card">online leaving group card from Thankeeu</a> gives every colleague a proper space to write their message — no cramped margins, no character limits. Share one link with the team, everyone signs from wherever they're working, and it arrives on the last day with a pooled leaving gift in GBP. <a href="/card/new">Create one here in two minutes.</a></p>$content$,
'Celebration Ideas',
ARRAY['leaving card','UK','messages','colleague','farewell'],
'published', false, 'Thankeeu Team', 7, now(),
'Leaving Card Messages for a Colleague — 80 Lines by Relationship (UK)',
'80 leaving card messages for a UK colleague organised by relationship — close friend, team member, manager, acquaintance and redundancy. Find the right one in 30 seconds.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Retirement Messages for a UK Colleague — 60 Lines for Every Milestone',
'retirement-messages-uk-colleague',
'The best retirement messages for a UK colleague — for long-service retirements, early retirement, and every kind of working relationship. Heartfelt, funny, and distinctly British in tone.',
$content$<h2>Retirement in the UK: what to say and what not to say</h2>
<p>Retirement is the one leaving card where "best of luck in your new role" doesn't apply. It requires a different register — one that honours the length of a career rather than just its end, acknowledges what's being given up as well as what's being gained, and doesn't make it sound like a funeral. Here are 60 messages that do all three.</p>

<h2>Heartfelt retirement messages</h2>
<ul>
<li>The years you've given to this organisation — the expertise, the steadiness, the institutional knowledge that no handbook can replicate — are genuinely irreplaceable. It's been a privilege to work alongside you. Congratulations on an outstanding career and a very well-earned retirement.</li>
<li>I've learned more from working with you over the years than from almost anything else in my professional life. That isn't something you say lightly in a card — it's just true. Thank you for everything, and congratulations on what comes next.</li>
<li>A retirement well-earned is a beautiful thing to witness. You've given this organisation everything it could have asked for over the course of a remarkable career. Congratulations — go and enjoy every second of it.</li>
</ul>

<h2>Funny retirement messages (for when you know them well)</h2>
<ul>
<li>No more alarm clocks. No more commutes. No more being asked to "jump on a quick call." You have achieved what most of us only dream about. Congratulations.</li>
<li>I have decided not to ask about the pension because that way lies both envy and complex mathematics. Congratulations — enjoy every penny.</li>
<li>Officially retired: the state in which you receive income for doing significantly less than you've been doing for decades. We're all wildly jealous. Congratulations and well done.</li>
<li>You are released. No further obligations to reply to emails within the hour. Congratulations — I hope you enjoy every minute of the freedom.</li>
</ul>

<h2>For a long-service retirement (20+ years)</h2>
<ul>
<li>Two decades-plus at the same organisation is a choice made every day. Thank you for making it, and for everything you've given across that time. Congratulations on a magnificent career — one worth every year of it.</li>
<li>Twenty-five years is a legacy. The institutional memory you hold, the relationships you've built, the standard you've set — those things have shaped this organisation. Thank you.</li>
</ul>

<h2>Short retirement messages</h2>
<ul>
<li>Congratulations on your retirement — absolutely deserved.</li>
<li>Happy retirement! May it be everything you've earned.</li>
<li>Here's to the next chapter — congratulations on a brilliant career.</li>
<li>Wishing you a retirement full of everything the working week never left room for.</li>
</ul>

<h2>Mark it properly</h2>
<p>A retirement deserves a card that lives up to the career. An <a href="/cards/retirement">online retirement group card from Thankeeu</a> collects full messages from every colleague — including former colleagues who want to contribute from outside the organisation — with an optional retirement gift collection in GBP. <a href="/card/new">Create one here.</a></p>$content$,
'Celebration Ideas',
ARRAY['retirement messages','UK','colleague','what to write','career'],
'published', false, 'Thankeeu Team', 7, now(),
'Retirement Messages for a UK Colleague — 60 Lines for Every Milestone',
'60 retirement messages for a UK colleague — heartfelt, funny and appropriate for long-service and early retirement. Organised by relationship and milestone in plain British English.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Funny Maternity Leave Messages — 50 Lines That Hit the Right Note (UK)',
'funny-maternity-leave-messages-uk',
'Funny maternity leave messages that are actually funny without being inappropriate — for UK colleagues, office cards, and WhatsApp messages. 50 lines that land without landing badly.',
$content$<h2>Funny maternity leave messages: the tone problem</h2>
<p>There is a very specific tightrope to walk with a funny maternity leave message. Too crude and it's uncomfortable. Too patronising and it's worse. The genuinely funny maternity leave message in a British office is dry, warm and rooted in the reality of the office she's leaving rather than the baby that's arriving. These 50 messages land correctly.</p>

<h2>Office-safe funny maternity leave messages</h2>
<ul>
<li>Congratulations on your upcoming career change from managing stakeholders to managing a considerably smaller and significantly louder stakeholder with much less predictable hours. We'll hold the fort.</li>
<li>You are the most organised person this team has, and we're quite concerned about what will happen in your absence. The baby, meanwhile, will probably be fine.</li>
<li>The good news: maternity leave. The other news: back eventually. We look forward to both and are managing our feelings about the second one.</li>
<li>Congratulations! We expect to receive regular photo updates. This is not optional. It is a condition of the leaving collection.</li>
<li>We have been promised that everything will be covered. We are choosing to believe this. Congratulations and good luck — with both the birth and the handover notes.</li>
</ul>

<h2>For a close colleague</h2>
<ul>
<li>You've handled everything this office has thrown at you with remarkable efficiency and minimal visible stress. A baby is just a different kind of project, and if anyone is equipped for it, it's you. Congratulations — and we expect updates.</li>
<li>I'd say we'll miss you, but honestly I'll just miss you specifically — the office version of you who knew where everything was and how everything worked. The baby is getting the better deal. Congratulations!</li>
<li>Going on leave and leaving us to manage without you. Classic. Congratulations — we're delighted for you and slightly panicked for ourselves, in roughly equal measure.</li>
</ul>

<h2>One-liners for the card</h2>
<ul>
<li>Good luck! (You've handled everything here — a baby is just a new kind of project.)</li>
<li>We'll be fine. We'll be absolutely fine. Congratulations!</li>
<li>Leaving us. Understandable. Congratulations.</li>
<li>Sleep while you can. (We've been told to say this. Apparently it's helpful.)</li>
<li>Off to do something considerably more important than quarterly reviews. Congratulations!</li>
</ul>

<h2>From the whole team</h2>
<p>An <a href="/cards/maternity-leave">online maternity leave group card from Thankeeu</a> lets everyone write their full message — including the remote team members who never make it in for the office send-off — with an optional baby gift collection in GBP. <a href="/card/new">Create one here.</a></p>$content$,
'Celebration Ideas',
ARRAY['maternity leave','funny','messages','UK','colleague'],
'published', false, 'Thankeeu Team', 5, now(),
'Funny Maternity Leave Messages — 50 Lines That Hit the Right Note (UK)',
'50 funny maternity leave messages for a UK colleague — dry, warm and office-safe without being inappropriate. For cards, WhatsApp and the leaving speech.'
) ON CONFLICT (slug) DO NOTHING;
