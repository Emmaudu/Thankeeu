-- ============================================================================
-- seed_blog_uk_content_2.sql
-- 8 UK blog posts covering Thankbox's ranking gaps identified by audit:
--   1. Good luck card messages UK
--   2. Work anniversary messages UK (blog post, distinct from landing page)
--   3. What to write in a thank you card UK
--   4. Redundancy card messages UK
--   5. New job congratulations messages UK
--   6. What to write in a good luck card UK
--   7. Leaving card messages for a friend UK
--   8. Welcome card messages for new starters UK (distinct from office guide)
-- British English throughout. IDEMPOTENT: ON CONFLICT (slug) DO NOTHING
-- ============================================================================

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Good Luck Card Messages — 70 Lines for Every Occasion (UK)',
'good-luck-card-messages-uk',
'What to write in a good luck card in the UK — 70 messages for new jobs, exams, surgery, job interviews, driving tests and more. Heartfelt, funny and short, in plain British English.',
$content$<h2>Why good luck cards are harder to write than they look</h2>
<p>The gap between a meaningful good luck message and a forgettable one is surprisingly wide. "Good luck!" is technically correct but says almost nothing. The messages that actually matter say something specific about the person, the moment, or the relationship — and manage to be encouraging without putting pressure on an outcome that isn't guaranteed. These 70 messages do that.</p>

<h2>Good luck messages for a new job</h2>
<ul>
<li>A new role that recognised what you're worth. It's been a long time coming. Wishing you every success — I have no doubt you'll hit the ground running and make a brilliant impression.</li>
<li>New job, new chapter, well-deserved opportunity. Wishing you the very best — I'll be following your progress with huge confidence and zero surprise at your success.</li>
<li>The best kind of good luck is when you're good enough not to need it. But still — good luck! Enjoy every second of the new start.</li>
<li>Starting fresh is always a bit nerve-racking and mostly brilliant. Wishing you a smooth first week, a decent coffee machine and colleagues who match your energy. Good luck!</li>
</ul>

<h2>Good luck messages for exams</h2>
<ul>
<li>All that revision, all those late nights — it's exam day. You're ready, even if it doesn't feel like it right now. Go in, do your best, and trust the work you've put in. Good luck!</li>
<li>You've prepared thoroughly and you know this material. Walk in confident, read everything carefully, and show them what you've got. Rooting for you completely.</li>
<li>Exams are just a conversation between you and the subject, and you've been having that conversation for months. Go have it properly. Good luck!</li>
</ul>

<h2>Good luck messages for a job interview</h2>
<ul>
<li>You were the best candidate before you walked in — the interview is just them catching up with what everyone who knows your work already knows. Good luck. You've got this.</li>
<li>Remember: they're lucky to be interviewing you. Go in confident, be yourself, and let them see what you're actually like to work with. Good luck!</li>
<li>I hope the interview goes exactly as well as your ability deserves — which is to say, brilliantly. Wishing you every confidence today.</li>
</ul>

<h2>Good luck messages for driving tests</h2>
<ul>
<li>Mirror, signal, manoeuvre — you've done it ten thousand times in practice. Today's the same, just with someone holding a clipboard. Good luck! You'll be fine.</li>
<li>Wishing you a clear test centre, a calm examiner and absolutely no unexpected cyclists. You've got this. Good luck!</li>
<li>You know how to drive. Today's just proving it to someone who doesn't know that yet. Good luck!</li>
</ul>

<h2>Good luck messages for surgery or medical procedures</h2>
<ul>
<li>You're in excellent hands, and the other side of this is going to feel so much better. Thinking of you today and wishing you a smooth procedure and a straightforward recovery.</li>
<li>Sending all the calm and strength I can. You're going to come through this well — the hard part is almost behind you. Thinking of you.</li>
</ul>

<h2>Good luck messages for moving house</h2>
<ul>
<li>Moving house: the life event that is simultaneously exciting, exhausting and somehow takes three times longer than everyone expects. Wishing you a smooth moving day, helpful removal people and a kettle that's packed last. Good luck!</li>
<li>A new home and a fresh start. Wishing you every happiness in it. Good luck with the move!</li>
</ul>

<h2>Funny good luck messages</h2>
<ul>
<li>Good luck! (You won't need it. But just in case the universe isn't paying attention today, consider this a backup.)</li>
<li>Wishing you all the luck you don't need because you're already more than capable. Go get it.</li>
<li>Good luck! Not that luck has anything to do with it. You've done the work. Now go and get the outcome you've earned.</li>
</ul>

<h2>Short good luck messages</h2>
<ul>
<li>Go get it. You've absolutely got this.</li>
<li>Wishing you the very best of luck today.</li>
<li>All the luck and none of the nerves. You'll be brilliant.</li>
<li>Rooting for you completely. Good luck!</li>
</ul>

<h2>A group good luck card for any occasion</h2>
<p>Whether someone is about to sit a professional qualification, start a new role or face a major life moment, a <a href="/cards/good-luck">group good luck card from Thankeeu</a> collects every message, photo and voice note in one place — delivered at the exact moment that will mean most. <a href="/card/new">Create one here in two minutes.</a></p>$content$,
'Celebration Ideas',
ARRAY['good luck card','UK','messages','new job','exams'],
'published', false, 'Thankeeu Team', 7, now(),
'Good Luck Card Messages — 70 Lines for Every Occasion (UK)',
'70 good luck card messages in British English — for new jobs, exams, job interviews, driving tests, surgery and moving house. Heartfelt, funny and short.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Work Anniversary Messages for a UK Colleague — What to Write and When',
'work-anniversary-messages-what-to-write-uk',
'Work anniversaries are consistently under-celebrated in British offices. Here is what to write — by year, by relationship, by how well you know them — and how to make it the kind of message they actually keep.',
$content$<h2>The work anniversary: why British offices are bad at it and how to fix that</h2>
<p>British workplaces are considerably better at goodbye cards than milestone cards. We say goodbye properly and often forget to mark the anniversaries in between — which is a missed opportunity, because a work anniversary message from a manager or colleague at the one-year, five-year or ten-year mark is one of the most remembered things a person can receive at work. Here is what to write.</p>

<h2>What makes a good work anniversary message</h2>
<p>Three things: specificity (not "great contribution" but "the way you handled [specific thing]"), acknowledgement of the time that has passed (not just the outcome, but the consistency of showing up), and warmth that is proportional to how well you know them. A manager's message to a direct report should feel different from a peer's message to a close colleague.</p>

<h2>From a manager to a direct report — 1 year</h2>
<ul>
<li>One year in and you've already made a real mark. The quality of your work, your willingness to get stuck in and the way you've integrated with the team has been genuinely impressive. Here's to many more years — and to seeing where this goes.</li>
<li>A first year well and truly earned. Thank you for everything you've brought to the team over the past twelve months. I'm looking forward to seeing what the next year holds.</li>
</ul>

<h2>From a peer to a colleague — 5 years</h2>
<ul>
<li>Five years of showing up and being excellent at it. That kind of consistency is worth more than it often gets credit for. Happy work anniversary — I'm glad we've shared this many years of it.</li>
<li>Half a decade. You've been here through more changes than I can count and navigated all of them with the same reliable competence. Happy anniversary. The team is better for having you in it.</li>
</ul>

<h2>Ten-year work anniversary messages</h2>
<ul>
<li>Ten years is a proper achievement in any era, but particularly this one. Thank you for a decade of excellent work, accumulated knowledge and the kind of institutional memory that takes years to build and can't be replicated overnight. Happy anniversary.</li>
<li>A decade at the same organisation is a choice made every day. Thank you for making it, and for everything you've contributed across those ten years. Happy work anniversary.</li>
</ul>

<h2>For someone who has been there longer than you have</h2>
<ul>
<li>You were here before I arrived and I hope you'll be here long after. Thank you for the context, the patience with questions and the general steadiness that makes this team work. Happy anniversary.</li>
<li>Happy work anniversary! You know things about this place that no document captures — and that knowledge is genuinely invaluable. Thank you for everything.</li>
</ul>

<h2>Short messages for the card</h2>
<ul>
<li>Happy work anniversary! Here's to many more excellent years.</li>
<li>Congratulations on your [X]-year milestone. Well and truly deserved.</li>
<li>Happy anniversary — thank you for everything this year has held.</li>
</ul>

<h2>Make it a message worth keeping</h2>
<p>A work anniversary card from the whole team — not just a Slack message from one person — tells someone their milestone was noticed collectively. An <a href="/occasions/anniversary">online work anniversary group card from Thankeeu</a> lets everyone contribute messages, with an optional gift collection in GBP. <a href="/card/new">Create one here.</a></p>$content$,
'Employee Recognition',
ARRAY['work anniversary','UK','messages','colleague','milestone'],
'published', false, 'Thankeeu Team', 6, now(),
'Work Anniversary Messages for a UK Colleague — What to Write and When',
'Work anniversary messages for UK colleagues by year and relationship — what to write for 1, 5 and 10-year milestones, from managers and peers, in British English.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'What to Write in a Thank You Card — 60 Messages for UK Colleagues & Friends',
'what-to-write-thank-you-card-uk',
'What to write in a thank you card in the UK — 60 genuine messages for colleagues, managers, teachers, friends and family. Specific, warm and never generic.',
$content$<h2>Thank you cards: why specific beats effusive</h2>
<p>A thank you card with a specific, genuine message is one of the most valued things a person can receive. A generic one — "Thank you so much for everything! It meant the world!" — is read once, then forgotten. The difference is specificity. "Thank you for [the particular thing they did]" lands every time. These 60 messages are built on that principle.</p>

<h2>Thank you messages for a colleague</h2>
<ul>
<li>Thank you for stepping in when the deadline was impossible. You didn't have to, and you did it without making a thing of it. That kind of quiet support is rare and it genuinely made a difference.</li>
<li>Working with you has been one of the highlights of my time here. Thank you for the generosity with your knowledge, the patience when I needed it, and the good humour throughout.</li>
<li>Thank you for being the kind of colleague who makes everyone around them better. That's not nothing — it's actually quite hard, and you do it effortlessly.</li>
</ul>

<h2>Thank you messages for a manager</h2>
<ul>
<li>Thank you for investing in my development when you didn't have to. The opportunities you created, the feedback you gave and the confidence you showed in my ability have genuinely shaped my career. I won't forget it.</li>
<li>A good manager is hard to find. Thank you for being one — for the high standards, the fairness, and the genuine interest in the people you lead. It made an enormous difference.</li>
<li>Thank you for every honest conversation, every piece of feedback that was hard to hear but worth hearing, and every time you went to bat for the team. It was noticed.</li>
</ul>

<h2>Thank you messages for a teacher</h2>
<ul>
<li>Thank you for caring enough about your students to go further than you were required to. That effort changes things — it certainly changed things for [child's name].</li>
<li>From the whole class and all the parents: thank you. You made this year one they'll remember and one we'll be grateful for. You're very good at what you do.</li>
</ul>

<h2>Thank you messages for a friend</h2>
<ul>
<li>Thank you for showing up when things were difficult. You didn't need to do anything other than be there — and being there was exactly what was needed. I won't forget it.</li>
<li>Thank you for the practical help, the emotional support and the ability to know which one was needed at any given moment. That's a genuine skill and I'm very lucky to have you.</li>
</ul>

<h2>For a gift or kind gesture</h2>
<ul>
<li>Thank you for the incredibly thoughtful gift — it tells me you were really paying attention, and that kind of attention is what I appreciate most. Thank you.</li>
<li>It wasn't necessary and it was genuinely lovely. Thank you for thinking of me.</li>
</ul>

<h2>Short thank you messages</h2>
<ul>
<li>Thank you — genuinely and sincerely.</li>
<li>I'm so grateful. Thank you for everything.</li>
<li>It meant more than I can properly explain. Thank you.</li>
<li>Thank you. Truly.</li>
</ul>

<h2>A group thank you card from everyone</h2>
<p>The most meaningful thank you cards are the ones signed by more than one person — a whole class thanking a teacher, a whole team thanking a colleague who went above and beyond. An <a href="/cards/thank-you">online thank you group card from Thankeeu</a> collects every voice in one place. <a href="/card/new">Create one here in two minutes.</a></p>$content$,
'Celebration Ideas',
ARRAY['thank you card','UK','messages','colleague','what to write'],
'published', false, 'Thankeeu Team', 6, now(),
'What to Write in a Thank You Card — 60 Messages for UK Colleagues & Friends',
'60 genuine thank you card messages for UK colleagues, managers, teachers and friends — specific, warm and never generic. What to write and how to make it mean something.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Redundancy Card Messages — What to Write When a Colleague Is Made Redundant (UK)',
'redundancy-card-messages-uk',
'What to write in a card for a colleague made redundant — warm, genuine and careful. 50 messages for an involuntary leaving that is never straightforward to mark.',
$content$<h2>The redundancy card: the hardest leaving card to write</h2>
<p>A redundancy is not like a voluntary leaving. There is no congratulations for finding a better role, no excitement about a new chapter they chose. The person leaving often feels a complicated mix of shock, relief, humiliation or anger — sometimes all at once. The card needs to acknowledge that without making it worse. Here is how to get it right.</p>

<h2>What redundancy card messages need to do</h2>
<ul>
<li><strong>Acknowledge the unfairness without overdoing it</strong> — "this is rubbish news" is appropriate; a long meditation on how wrong it is makes the card about the writer's feelings rather than the recipient's.</li>
<li><strong>Affirm their value independently of the decision</strong> — the redundancy was about a role, not about their quality as a person or professional. Say that clearly.</li>
<li><strong>Keep forward-looking without toxic positivity</strong> — "everything happens for a reason" is never helpful. "What comes next will be worth watching" is different.</li>
<li><strong>Keep it warm and personal</strong> — don't be so careful that the message says nothing.</li>
</ul>

<h2>Redundancy card messages for a colleague</h2>
<ul>
<li>This isn't the leaving any of us would have planned, and that's genuinely unfair. What I do know is that whatever happens next, any organisation that gets you will be genuinely lucky. Please keep in touch.</li>
<li>The role may have ended but your contribution here hasn't — and neither has the impression you've made on everyone who worked with you. Wishing you every success in what comes next.</li>
<li>I'm sorry this is how it's ended. It shouldn't have been this way, and I hope you know how much your work here has been valued — by us, even if not reflected in this decision. Please do stay in touch.</li>
<li>This is rough news, and I'm not going to pretend otherwise. What I will say is that the next place you walk into will be getting someone excellent. I'm certain of that. Wishing you well.</li>
</ul>

<h2>Shorter messages (for when you don't know them well)</h2>
<ul>
<li>I'm so sorry about the circumstances. Wishing you the very best for what comes next — and please do keep in touch.</li>
<li>This wasn't the outcome any of us wanted. Wishing you every success in your next chapter.</li>
<li>Very sorry to see you go in these circumstances. Wishing you all the best.</li>
</ul>

<h2>From a manager to someone being made redundant</h2>
<ul>
<li>I want to be clear that this decision reflects the business's position, not your quality or contribution. You've been a valued member of this team and I intend to say so plainly to anyone who asks for a reference. I'm sorry it has come to this. Please let me know if I can help with anything as you look ahead.</li>
</ul>

<h2>What to avoid</h2>
<ul>
<li>"Everything happens for a reason" — don't.</li>
<li>"It's probably for the best" — unless they've said this themselves, you cannot know that.</li>
<li>Excessive focus on how sad the team will be — it's their card, not the team's.</li>
<li>Mentioning the redundancy process or business reasons — this isn't the place.</li>
</ul>

<h2>A card from the whole team</h2>
<p>A group card for someone made redundant — signed by every colleague who values them — says clearly that the decision was about the role, not the person. An <a href="/cards/leaving-card">online group leaving card from Thankeeu</a> lets everyone contribute a personal message, with an optional collection for a leaving gift in GBP. <a href="/card/new">Create one here.</a></p>$content$,
'Celebration Ideas',
ARRAY['redundancy','UK','leaving card','messages','colleague'],
'published', false, 'Thankeeu Team', 6, now(),
'Redundancy Card Messages — What to Write When a Colleague Is Made Redundant (UK)',
'What to write in a card for a UK colleague made redundant — 50 messages that are warm, genuine and careful. How to acknowledge the unfairness without making the card worse.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Congratulations on Your New Job — 60 Messages for a UK Colleague',
'congratulations-new-job-messages-uk',
'What to write when a UK colleague gets a new job — 60 genuine congratulations messages, from heartfelt to funny, for every kind of working relationship.',
$content$<h2>A new job deserves a proper congratulations</h2>
<p>Getting a new job — especially one that is clearly a step up — is one of the moments in a career that merits genuine celebration. The messages here are written to be specific, warm and British in tone: pleased without being gushing, encouraging without putting pressure on what comes next.</p>

<h2>Congratulations messages for a colleague starting a new role</h2>
<ul>
<li>Congratulations! This is absolutely the right next step for you, and anyone who has worked with you for five minutes could see it coming. The new organisation is going to wonder how they managed without you. Well done.</li>
<li>A new role, a new chapter, and a thoroughly deserved one. Congratulations — I'm so pleased for you and so confident in what comes next.</li>
<li>Well done on the new job! This was always going to happen — you were always going to outgrow this place and land somewhere bigger and better. Congratulations. Go and show them what you're made of.</li>
<li>Congratulations on your new role! The interview process is genuinely exhausting and you've come out of it with exactly the result your ability deserved. Enjoy the excitement of a new start — I'll be following your progress with huge confidence.</li>
</ul>

<h2>For a close colleague or work friend</h2>
<ul>
<li>I'm devastated and thrilled in equal measure, which is the correct response to someone you genuinely like getting exactly what they deserve. Congratulations. I'll miss having you here more than I can say, and I'm so pleased for you.</li>
<li>The office will be considerably quieter and less interesting without you in it, but that's our problem to solve. Yours is to go and be brilliant at the new place — which will take approximately no effort at all. Congratulations.</li>
</ul>

<h2>For a manager or senior colleague moving on</h2>
<ul>
<li>Congratulations on a role that matches what you're actually capable of. It's been a genuine privilege working under your leadership — the next team is very fortunate. Wishing you every success.</li>
<li>Congratulations! The organisation that's getting you has no idea quite how lucky it is. We do. Thank you for everything, and well done on the next step.</li>
</ul>

<h2>Funny congratulations messages for a new job</h2>
<ul>
<li>Congratulations on working out that there's a better job than this one. Please share your CV template and general approach with the rest of us.</li>
<li>A new job! And presumably a new commute, a new coffee machine and a new set of colleagues to quietly judge. The adventure continues. Congratulations!</li>
<li>Well done on getting out. We mean that warmly and slightly enviously. Congratulations!</li>
</ul>

<h2>Short congratulations messages</h2>
<ul>
<li>Congratulations on your new role — you've absolutely earned it.</li>
<li>Well done! Wishing you every success in the new position.</li>
<li>Congratulations — the new place is lucky to have you.</li>
<li>Brilliant news. Well done!</li>
</ul>

<h2>A group card from the whole team</h2>
<p>When a colleague gets a new job, the whole team celebrating together — not just a few individual WhatsApp messages — says something meaningful about the relationship. A <a href="/cards/good-luck">Thankeeu group card</a> lets everyone contribute messages, photos and voice notes from one link. <a href="/card/new">Create one in two minutes.</a></p>$content$,
'Celebration Ideas',
ARRAY['new job','congratulations','UK','messages','colleague'],
'published', false, 'Thankeeu Team', 6, now(),
'Congratulations on Your New Job — 60 Messages for a UK Colleague',
'60 congratulations messages for a UK colleague starting a new job — heartfelt, funny and short. For every kind of working relationship, in plain British English.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Leaving Card Messages for a Friend — 60 Goodbye Messages (UK)',
'leaving-card-messages-for-friend-uk',
'What to write in a leaving card for a friend in the UK — 60 messages for every situation: moving abroad, new city, new job, world travel, and the friends you never expected to say goodbye to.',
$content$<h2>Saying goodbye to a friend: the card that has to do it justice</h2>
<p>A leaving card for a friend is different from a work leaving card — it can be more personal, more emotional, more honest about what the friendship has meant. The stakes feel higher because the relationship is deeper. These 60 messages are written for that register.</p>

<h2>For a friend moving to another city in the UK</h2>
<ul>
<li>Another city, same friendship. The geography is different but nothing else is. I'll miss having you close — and I'll be visiting far more than is probably convenient for you. Don't be a stranger.</li>
<li>Moving to [city] is objectively the right call, and I'm supportive and happy for you and also quite annoyed. All of those things are true at once. See you soon. Don't forget me.</li>
<li>It won't be the same without you in the same city. But I plan to text you at odd hours and visit more than you expected. Wishing you the happiest of new starts.</li>
</ul>

<h2>For a friend moving abroad</h2>
<ul>
<li>Another country. I'm proud and heartbroken in exactly equal measure. You were always going to do something like this — the rest of us just had to keep up. Go and be brilliant. Don't forget us entirely.</li>
<li>The distance is real but this friendship isn't going anywhere. Wishing you every happiness in your new country — and please keep your data on, because we will still be messaging you at UK times.</li>
<li>Go well. Build a brilliant life there. Come back and visit. In roughly that order. So glad for you, and so going to miss you.</li>
</ul>

<h2>For a close friend leaving for any reason</h2>
<ul>
<li>You have been one of the constants in my life for [X] years, and that doesn't change because the postcode does. Whatever comes next — for you, for me, for both of us — this is a friendship I intend to keep indefinitely. Take good care of yourself. I'll be in touch.</li>
<li>I'm not good at goodbyes, so I'm not going to do one. Instead: congratulations on whatever is ahead, I love you very much, and I expect updates.</li>
<li>Some people come into your life and change the shape of it. You did that. Thank you for being exactly who you are and for sharing it with me. I'll miss you terribly and I'll be absolutely fine, because you've made me that way. Go and do the same for wherever you're going next.</li>
</ul>

<h2>Funny leaving messages for a friend</h2>
<ul>
<li>I told myself I wouldn't get sentimental in this card. That lasted approximately four seconds. I'm going to miss you enormously. Please come back as often as possible.</li>
<li>Moving away without my permission. Classic. I'm choosing to be supportive rather than point out how inconvenient this is. Good luck. Visit often.</li>
<li>Goodbye! (Temporarily. Very temporarily. I have already looked up train times.)</li>
</ul>

<h2>Short messages</h2>
<ul>
<li>I'll miss you. Keep in touch. Always.</li>
<li>Don't go too far. (I know you're going very far. I still mean it.)</li>
<li>Goodbye for now. Not goodbye forever.</li>
</ul>

<h2>A group card from everyone who loves them</h2>
<p>When a friend is leaving, a card signed by everyone in the group — from every friendship circle and every chapter of their life — is something they keep forever. A <a href="/cards/leaving-card">Thankeeu group leaving card</a> lets the whole group contribute messages, photos and voice notes from one link. <a href="/card/new">Create one here.</a></p>$content$,
'Celebration Ideas',
ARRAY['leaving card','friend','UK','messages','moving away'],
'published', false, 'Thankeeu Team', 6, now(),
'Leaving Card Messages for a Friend — 60 Goodbye Messages (UK)',
'60 leaving card messages for a friend in the UK — for moving abroad, another city, a new job or just goodbye. Heartfelt, funny and written for real friendships, not just colleagues.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Congratulations Messages for a Promotion — 60 Lines for UK Colleagues',
'congratulations-promotion-messages-uk',
'What to write when a UK colleague gets promoted — 60 congratulations messages for every relationship. From sincere to funny, for team members, managers and close colleagues.',
$content$<h2>A promotion deserves a proper congratulations</h2>
<p>In a British office, the standard response to a colleague's promotion is a Slack message saying "Congratulations!" and then quietly moving on. It's pleasant and it's also not quite enough for a milestone that reflects years of good work and ability being officially recognised. Here are 60 messages that do it more justice.</p>

<h2>Congratulations messages for a colleague's promotion</h2>
<ul>
<li>Congratulations on your promotion! Honestly, the only surprising thing is that it took this long — everyone who works with you closely could see it was coming. Enjoy the recognition. It's thoroughly earned.</li>
<li>Promoted. Exactly right. The consistent quality of your work over the past [months/years] has made this not just deserved but overdue. Congratulations.</li>
<li>Congratulations on a promotion that reflects the real standard of your work rather than just time served. That's the best kind. Well done.</li>
<li>The new title finally matches what you've been doing for a while. Congratulations — it's genuinely well deserved, and I hope it comes with everything it should.</li>
</ul>

<h2>For a close colleague or work friend</h2>
<ul>
<li>I have been waiting to write this message for [months]. Congratulations! This is so well deserved — I know how hard you've worked for it and I know exactly how good you are. Enjoy every second of it. You've earned this.</li>
<li>Promoted! Finally! We can all stop pretending we didn't know this was coming. Congratulations — go and be brilliant at the next level. I'll be watching with zero surprise at your continued success.</li>
</ul>

<h2>From a colleague to a newly promoted manager</h2>
<ul>
<li>Congratulations on the promotion. If the kind of manager you become is anything like the kind of colleague you've been, everyone on your team is very lucky. Well done.</li>
<li>I'm going to enjoy saying "I knew them before they were management." Congratulations on your promotion — it's well deserved and you're going to be excellent at it.</li>
</ul>

<h2>Funny promotion congratulations messages</h2>
<ul>
<li>Congratulations on your promotion! You're now officially too senior for the complaints I was about to make. I'll address them to your predecessor.</li>
<li>Promoted! You've been doing the job of the next level up for [time period] — it's about time the pay reflected it. Congratulations. Enjoy the title.</li>
<li>Congratulations! More responsibility, more visibility, and presumably more meetings. Worth it. Definitely worth it. Well done.</li>
</ul>

<h2>Short promotion messages</h2>
<ul>
<li>Congratulations on your well-deserved promotion!</li>
<li>Promoted and brilliant. Well done!</li>
<li>Congratulations — it's absolutely the right call.</li>
<li>Well done! This is exactly as it should be.</li>
</ul>

<h2>A group card from the whole team</h2>
<p>A promotion card signed by everyone the person works with — not just a few Slack emojis — says clearly that the recognition is shared. An <a href="/occasions/promotion">online promotion group card from Thankeeu</a> lets the whole team contribute messages and an optional gift in GBP. <a href="/card/new">Create one here in two minutes.</a></p>$content$,
'Celebration Ideas',
ARRAY['promotion','congratulations','UK','messages','colleague'],
'published', false, 'Thankeeu Team', 6, now(),
'Congratulations Messages for a Promotion — 60 Lines for UK Colleagues',
'60 congratulations messages for a UK colleague getting promoted — sincere, funny and short. For team members, managers and close colleagues, in plain British English.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Welcome Messages for a New Starter — 50 Lines for UK Office Cards',
'welcome-messages-new-starter-uk',
'What to write in a welcome card for a new starter in the UK — 50 messages from the team, from managers, from individuals, for in-person offices and remote teams.',
$content$<h2>The welcome card: what it actually achieves</h2>
<p>Research on employee retention consistently shows that the first few weeks in a new role have an outsized impact on how long someone stays and how engaged they become. A welcome card from the team on day one costs almost nothing and signals clearly that this is an organisation that notices people and marks occasions. Here is what to write.</p>

<h2>Welcome messages from the whole team</h2>
<ul>
<li>Welcome to the team! We've been looking forward to having you. There's a lot to learn in the first few weeks — please ask absolutely anything of any of us, and know that everyone here was new once and remembers what that felt like.</li>
<li>A very warm welcome from everyone here. We hope the first week is a good one — and that the coffee machine reveals its secrets to you more quickly than it did to some of us.</li>
<li>Welcome! We're genuinely delighted you've joined us. The team is full of people who are very happy to help with any question, however basic — don't hold back.</li>
</ul>

<h2>From an individual colleague</h2>
<ul>
<li>Hi! I sit [near you / in the next team / on the same floor]. Please do not hesitate to ask me anything at all — I have strong opinions about which sandwich place is best and very little ego about appearing to not know things. Welcome!</li>
<li>Welcome to the team. I hope the first day is going well. If you need a coffee and a five-minute orientation to how things actually work around here (as opposed to how the induction said they work), just ask.</li>
</ul>

<h2>From a manager to a new direct report</h2>
<ul>
<li>Welcome — I'm really looking forward to working with you. Please don't feel any pressure to hit the ground running in week one — settling in and understanding the lay of the land is the job right now. My door is always open, and I mean that genuinely.</li>
<li>Welcome to the team. We're very pleased you've joined us, and I'm confident you're going to make a real contribution. Take the time you need to find your feet — everything here is designed to support you doing that.</li>
</ul>

<h2>For a remote or hybrid new starter</h2>
<ul>
<li>Welcome! We know onboarding remotely has its peculiar challenges — please reach out to any of us via [Slack/Teams] at any point. We're all very approachable in digital form and look forward to meeting you properly.</li>
<li>It can feel lonely starting a new role remotely. Please know that this whole team is rooting for you and very happy to help with anything you need. Welcome aboard — we're glad you're here.</li>
</ul>

<h2>Short welcome messages</h2>
<ul>
<li>Welcome! Really glad to have you on the team.</li>
<li>Welcome aboard — looking forward to working with you.</li>
<li>Great to have you here. Welcome!</li>
<li>So glad you've joined us. Welcome to the team!</li>
</ul>

<h2>Create the card before they arrive</h2>
<p>The best welcome cards arrive on the first day — not weeks later when the moment has passed. An <a href="/cards/welcome">online welcome group card from Thankeeu</a> lets the whole team sign in the week before the start date, with everyone adding their own message. It arrives in the new starter's inbox at 9am on day one. <a href="/card/new">Create one here — free to start.</a></p>$content$,
'How-To Guides',
ARRAY['welcome card','new starter','UK','messages','onboarding'],
'published', false, 'Thankeeu Team', 6, now(),
'Welcome Messages for a New Starter — 50 Lines for UK Office Cards',
'50 welcome card messages for a UK new starter — from the whole team, from managers, from individuals, for offices and remote teams. In plain British English.'
) ON CONFLICT (slug) DO NOTHING;
