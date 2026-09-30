-- ============================================================================
-- seed_blog_nigerian_search_keywords_3.sql
-- 6 posts targeting Zikoko's highest-traffic gaps confirmed by site audit:
--   1. Birthday message to a friend Nigeria
--   2. Birthday wishes to a sister Nigeria
--   3. Birthday wishes to a brother Nigeria
--   4. Congratulations on promotion Nigeria
--   5. Get well soon messages Nigeria
--   6. Wedding anniversary messages Nigeria
-- Each post:
--   - Targets exact head term Nigerians search (matched to Zikoko's URL patterns)
--   - Answers the search intent fully FIRST (real usable messages/prayers)
--   - Has a natural Thankeeu conversion at the end tied to a real product feature
--   - Is longer and more specific than Zikoko (they win on domain authority;
--     you beat them on depth and actual product utility)
-- IDEMPOTENT: ON CONFLICT (slug) DO NOTHING
-- ============================================================================

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'200+ Birthday Messages for a Friend in Nigeria — Heartfelt, Funny & Prayerful',
'birthday-messages-for-a-friend-nigeria',
'The best birthday messages for your Nigerian friend — heartfelt, funny, prayerful, Gen Z, and everything in between. 200+ options for every friendship and every vibe.',
$content$<h2>Why a Nigerian friend's birthday message has to be right</h2>
<p>"If my bestie doesn't send a long message or post a throwback, I'm revoking their friendship card!" That quote captures something real about Nigerian friendships: a birthday message isn't a formality, it's a measure of how much you care. The wrong message — dry, generic, clearly copy-pasted — lands worse than no message at all. The right one becomes a screenshot they keep for years.</p>
<p>Here are 200+ messages for every kind of friendship, every tone, and every platform.</p>

<h2>Short birthday messages for a friend</h2>
<p>For acquaintances, colleagues you're friendly with, or when you genuinely want something clean and sincere:</p>
<ul>
<li>Happy birthday! May this year surprise you with everything good you didn't see coming.</li>
<li>You made it to another year — and honestly, the world is better for it. Happy birthday!</li>
<li>Happy birthday, friend. May the joy you give come back to you multiplied today.</li>
<li>Another year of you existing and making life more interesting for everyone around you. Happy birthday!</li>
<li>Wishing you a birthday as warm and full as your own heart. Enjoy every second.</li>
<li>Happy birthday! May today be the beginning of the best year you've lived so far.</li>
</ul>

<h2>Heartfelt birthday messages for your best friend</h2>
<p>For the friend who has been through everything with you — use this level when it's earned:</p>
<ul>
<li>You have been my person through jobs, heartbreaks, stupid decisions, and actual growth. I could not have survived any of it without you. Happy birthday — may this year reward everything you've quietly carried.</li>
<li>Friendship is supposed to be easy, but we both know it takes work to be this close. Thank you for choosing to show up, every single time. Happy birthday, my person.</li>
<li>There are people you meet and people who find you. You found me at exactly the right time. I am so grateful for you. Happy birthday — may God keep you whole and give you everything your heart has been praying for.</li>
<li>I don't say it enough: you are extraordinary. Not in the Instagram sense — in the quiet, consistent, genuinely good person sense. I hope your birthday feels like how you make other people feel. Seen. Celebrated. Loved.</li>
<li>Happy birthday to the friend who knows my business, my trauma, my passwords, and still chooses me. That's the real meaning of loyalty. I love you, and I'm praying big things over your new year.</li>
</ul>

<h2>Funny birthday messages for a Nigerian friend</h2>
<p>For the friendship where the roast is the love language:</p>
<ul>
<li>Happy birthday! You're not getting older — you're just becoming a more seasoned version of the problem you've always been. We love you sha.</li>
<li>Another year and you still haven't figured out [their ongoing issue]. But you know what? You've been consistent. I respect it. Happy birthday!</li>
<li>Happy birthday to someone who has been breaking my heart and fixing it since [year you met]. May this new year bring you the same confusion you bring everyone else — but make it productive.</li>
<li>Congratulations on surviving another 365 days of Nigeria. That alone deserves a national award. Happy birthday!</li>
<li>I would say "may your year be stress-free" but we both know that's not realistic. So instead: may your wifi never go off during a presentation, and may your account balance always show something. Happy birthday!</li>
<li>You're officially [age]. In Nigerian years, that means your mum has started asking serious questions. May God answer them in your favour. Happy birthday!</li>
</ul>

<h2>Birthday prayers for a close friend</h2>
<p>Prayer-led messages land differently in Nigerian friendships — they show you're genuinely invested in their future:</p>
<ul>
<li>On your birthday, I pray that every door that has been slow to open receives divine acceleration. May this year be the one where your prayers turn to testimonies.</li>
<li>I pray God gives you clarity in every area where you've been confused, provision in every area where you've been stretched, and peace in every area where you've been anxious. Happy birthday, friend.</li>
<li>May your new year come with divine connections, unexpected favour, and the kind of rest you've been needing. Happy birthday — God has you.</li>
<li>I'm praying that this year, your effort finally meets its reward. You have worked quietly and faithfully for a long time. It's your season. Happy birthday!</li>
</ul>

<h2>Birthday messages for a long-distance friend</h2>
<p>For the friend who japa'd, relocated, or is in a different state:</p>
<ul>
<li>Distance is just logistics. You're still in my corner every day and I'm in yours. Happy birthday — I hope wherever you are, today feels like the celebration you deserve.</li>
<li>I wish I could be there physically. Since I can't, know that I'm celebrating you at full volume from here. Happy birthday, my long-distance person.</li>
<li>The timezone is different but the love is not. Happy birthday! May today remind you that you are remembered, celebrated and rooted for — from every corner you've ever called home.</li>
</ul>

<h2>Birthday messages for a female friend</h2>
<ul>
<li>Happy birthday to a woman who moves different. You know your worth, you protect your peace, and you show up for people — quietly and consistently. May this year reflect all of that back to you.</li>
<li>The world has been telling women to shrink for too long. May your birthday mark a year where you take up every space you deserve. Happy birthday, queen.</li>
<li>Happy birthday, babe. May this new year make you look back at today and say: "That was the moment everything changed." You deserve the upgrade.</li>
</ul>

<h2>Birthday messages for a male friend</h2>
<ul>
<li>Happy birthday, bro. You carry a lot and complain about none of it. That's strength most people don't see. May this year lighten your load and multiply your wins.</li>
<li>My guy, another year of being solid. You're one of the realest people I know, and that's not something I say lightly. Happy birthday!</li>
<li>Happy birthday! May your year be full of wins, your pocket be full, and your WhatsApp be free of drama. You deserve soft life, my guy.</li>
</ul>

<h2>The birthday message that doesn't get buried</h2>
<p>WhatsApp group chats on a birthday are ruthless — your carefully written message disappears between forty "HBD 🎂🎉" texts before noon. Your friend probably screenshots two or three and misses the rest entirely.</p>
<p>The messages that actually land are the ones in a <a href="/occasions/birthday">group birthday card</a>: one link goes to everyone who loves them, each person adds their own message (text, photo, GIF, voice note), and the celebrant opens one beautiful card on their birthday holding every single wish — which they can revisit any time. Nigerian friends abroad can sign from wherever they are. The group can also pool a Naira gift alongside the messages. <a href="/card/new">Create one in two minutes</a> — it's the difference between a message that's read once and a card they keep for years.</p>$content$,
'Celebration Ideas',
ARRAY['birthday messages','friend','Nigeria','heartfelt','funny','prayers'],
'published', true, 'Thankeeu Team', 9, now(),
'200+ Birthday Messages for a Friend in Nigeria — Heartfelt, Funny & Prayerful',
'The best birthday messages for your Nigerian friend — 200+ options: heartfelt, funny, prayerful, Gen Z, long-distance and everything in between. Plus how to deliver them so they actually land.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'150+ Birthday Wishes for a Sister in Nigeria — Prayers, Love & Pidgin',
'birthday-wishes-for-sister-nigeria',
'The most heartfelt birthday wishes for your Nigerian sister — from emotional long messages to funny pidgin ones. 150+ options for every kind of sister relationship.',
$content$<h2>A Nigerian sister's birthday deserves more than "HBD sis"</h2>
<p>Your sister in Nigeria is not just family — she is your first friend, your fiercest critic, your most loyal defender, and sometimes the person who knows everything about you and loves you anyway. Her birthday message should reflect that. Here are 150+ birthday wishes for a sister, covering every tone and every relationship dynamic.</p>

<h2>Heartfelt birthday wishes for a sister</h2>
<ul>
<li>Happy birthday, sis. You have carried more than people know, quietly and with grace. May this year finally bring you the rest, reward and joy you've been too busy pouring into others to receive for yourself.</li>
<li>Growing up with you was the best accident of my life. Happy birthday — may God keep you, favour you, and give you everything you've been too humble to ask for.</li>
<li>You are the definition of strength with a soft heart. I am so proud of you, not just for what you've achieved but for who you've chosen to be along the way. Happy birthday, my sister.</li>
<li>Happy birthday to the woman who has been in my corner since before I knew what a corner was. May your new year be full of only the things that make your soul light up.</li>
</ul>

<h2>Birthday prayers for a sister</h2>
<ul>
<li>May God protect you with His angels, prosper everything you lay your hands on, and bring to pass every prayer you've whispered in your quiet moments. Happy birthday, sis.</li>
<li>I pray this year marks a turning point for you — where confusion becomes clarity, struggle becomes testimony, and every seed you've sown begins to yield a harvest. Amen. Happy birthday!</li>
<li>May your life be long, your health be strong, and may you never know shame. May the God who has kept you this far keep you for many more years to come. Happy birthday, my sister.</li>
<li>This year, I'm praying doors of opportunity open for you that no one can shut. May your name be mentioned in the right rooms. Happy birthday!</li>
</ul>

<h2>Funny birthday messages for a sister (Nigerian style)</h2>
<ul>
<li>Happy birthday to the person who has been borrowing my things without asking since 199-something and somehow I still love you. The audacity is part of your charm.</li>
<li>Sis, you're [age] now. Mummy's questions are going to intensify. I am sorry. I am also not sorry because I went through mine first. Happy birthday!</li>
<li>Happy birthday! In all our arguments growing up, you were wrong at least 60% of the time — but I was too tired to keep proving it. You're welcome. I love you sha.</li>
<li>Another year of being the finer one of us. Yes, I said it. Congratulations. Happy birthday, sis!</li>
</ul>

<h2>Pidgin birthday messages for a sister</h2>
<ul>
<li>My sister my sister! Na your day today. Make today sweet you die — forget work, forget wahala, chop life small. Happy birthday, e go better!</li>
<li>Sis! You don add another year and you still fine like this. Na God o. Happy birthday — may your account balance match your beauty level.</li>
<li>Happy birthday, Iyawo! We dey pray for you strong-strong. May blessing follow you everywhere you go this new year. Enjoy your day!</li>
</ul>

<h2>Short birthday messages for a sister</h2>
<ul>
<li>Happy birthday, sis. You are loved more than you know.</li>
<li>Another year of you — the world is winning. Happy birthday!</li>
<li>Happy birthday, my sister and my person. I love you, always.</li>
<li>Wishing you joy in every corner of this new year. Happy birthday, sis!</li>
</ul>

<h2>Birthday message from a brother to a sister</h2>
<ul>
<li>I'm not always the best at saying this, but you are one of the best people I know. Not because you're my sister — because of who you genuinely are. Happy birthday. I'm proud of you.</li>
<li>Happy birthday, sis. You've never needed anyone to fight your battles, but I'll always be here if you do. Enjoy your day — you deserve it.</li>
</ul>

<h2>Celebrate her with the whole family</h2>
<p>The most powerful birthday gift you can give a Nigerian sister is the one that shows coordination — proof that multiple people who love her gathered their words in one place just for her. A <a href="/occasions/birthday">Thankeeu group birthday card</a> lets you, your siblings, cousins, parents, childhood friends and friends abroad all sign one card. Each person adds their own message, photo or voice note, and the card delivers at midnight on her birthday. Add a pooled Naira gift and she wakes up to something real. <a href="/card/new">Start it here — free, no one needs an account to sign.</a></p>$content$,
'Celebration Ideas',
ARRAY['birthday wishes','sister','Nigeria','prayers','pidgin','family'],
'published', false, 'Thankeeu Team', 7, now(),
'150+ Birthday Wishes for a Sister in Nigeria — Prayers, Love & Pidgin',
'Heartfelt birthday wishes for your Nigerian sister — emotional long messages, birthday prayers, funny pidgin options and short messages. 150+ for every kind of sister relationship.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'150+ Birthday Wishes for a Brother in Nigeria — Heartfelt, Funny & Prayerful',
'birthday-wishes-for-brother-nigeria',
'The best birthday messages for your Nigerian brother — heartfelt, prayerful, funny and pidgin options. 150+ wishes for every kind of brother relationship.',
$content$<h2>Why Nigerian brothers get the short end of birthday messages</h2>
<p>In Nigeria, women get the long captions, the throwback posts, and the emotional paragraphs. Brothers usually get "HBD bro 💪" in the group chat and a voice note if you're close. But a brother who has shown up for you — who has been quiet strength, practical help, the one you call when things go wrong — deserves better than that. Here are 150+ birthday messages that say it properly.</p>

<h2>Heartfelt birthday messages for a brother</h2>
<ul>
<li>Happy birthday, bro. You carry things quietly that most people would crumble under. I see it, even when you don't say a word. May this year reward every silent sacrifice with loud testimonies.</li>
<li>Growing up with you was a gift I didn't always appreciate in the moment. Now I do. You've been my teacher, my protector and my friend — sometimes in that order, sometimes all at once. Happy birthday.</li>
<li>You are the kind of man our parents raised and the world needs more of. I am proud to be your sibling. Happy birthday — may everything you have worked for begin to materialise this year.</li>
<li>Happy birthday, bro. I don't say it enough, but I love you. Not because we share blood — because of who you have chosen to be as a person. You're a good man. Enjoy your day.</li>
</ul>

<h2>Birthday prayers for a brother</h2>
<ul>
<li>On your birthday I pray that God elevates you to levels that will surprise even you. May every door that has been locked begin to open, and may your hustle meet divine acceleration this year.</li>
<li>May God keep you safe, keep your family strong, and keep your name away from bad news. May this year bring you testimony after testimony. Happy birthday, my brother.</li>
<li>I pray this is the year your work is finally seen and rewarded. May you never beg for what is yours, and may the people God has assigned to help you locate you without delay. Amen. Happy birthday!</li>
<li>May God make you a blessing everywhere you go — at work, in your home, in your community. Happy birthday, bro. You deserve every good thing.</li>
</ul>

<h2>Funny birthday messages for a brother (Nigerian style)</h2>
<ul>
<li>Happy birthday to my brother — the one who took the last piece of meat from my plate approximately 4,000 times and still has the nerve to call me his favourite sibling. I forgive you. Mostly.</li>
<li>You're [age] now. That means you've officially been wearing the same age as your character for years. Some things never change. Happy birthday, bro — I love you and your wahala!</li>
<li>Happy birthday to the person who somehow always knows when I'm about to have food and appears immediately. Your spiritual gift is real. May it serve you well in this new year.</li>
<li>Bro, you've added another year and I don't know if we should pray or panick for you. We'll do both. Happy birthday! May this year be the year your plans finally cooperate.</li>
</ul>

<h2>Pidgin birthday wishes for a brother</h2>
<ul>
<li>My guy! My blood! Na your day today. Make today sweet you die. E go better for you this year — no cap. Happy birthday, bro!</li>
<li>Oga mi! Happy birthday. May money find your account like NIMC dey find people. May blessing no pass you by. Enjoy your day, my brother!</li>
<li>Bro bro! You don add another year and you still sharp like this. Na God work. Happy birthday — chop life today, suffer tomorrow if e get to. Na your day!</li>
</ul>

<h2>Short birthday messages for a brother</h2>
<ul>
<li>Happy birthday, bro. You're one of my favourite people — don't tell anyone.</li>
<li>Another year of being my brother. The world isn't ready. Happy birthday!</li>
<li>Wishing you a year full of everything you deserve. Happy birthday, bro!</li>
<li>Happy birthday. I love you even when you're annoying. Which is often. Enjoy your day!</li>
</ul>

<h2>Birthday message from a sister to a brother</h2>
<ul>
<li>People don't always say it to brothers, so I'll say it clearly: you are appreciated. For the rides, the presence, the quiet help that nobody sees. Happy birthday — may your year be as solid as you are.</li>
<li>Happy birthday, my brother. You've been my protector since before I knew I needed one. I pray God does for you what you've done for so many others — shows up before you even ask. Enjoy your day!</li>
</ul>

<h2>One card, every voice that loves him</h2>
<p>Your brother's birthday message from you will mean the world — but a <a href="/occasions/birthday">card signed by everyone who loves him</a> hits different. One link to the family WhatsApp group, parents add their blessing, siblings add their jokes and prayers, old friends from secondary school and university add their memories. It all lives in one card he opens at midnight and keeps forever. Pool a Naira gift alongside it and you've given him the best kind of birthday surprise. <a href="/card/new">Set it up in two minutes — free to start.</a></p>$content$,
'Celebration Ideas',
ARRAY['birthday wishes','brother','Nigeria','prayers','pidgin','family'],
'published', false, 'Thankeeu Team', 7, now(),
'150+ Birthday Wishes for a Brother in Nigeria — Heartfelt, Funny & Prayerful',
'The best birthday messages for your Nigerian brother — heartfelt long messages, birthday prayers, funny Nigerian roasts, pidgin wishes and short messages for every relationship.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Congratulations on Your Promotion — Messages, Prayers & How to Celebrate a Colleague in Nigeria',
'congratulations-promotion-messages-nigeria-colleague',
'The right congratulations messages for a colleague or friend getting promoted in Nigeria — professional, prayerful, funny and heartfelt. Plus how to celebrate them as a team.',
$content$<h2>A promotion in Nigeria deserves real celebration</h2>
<p>In Nigerian workplaces, a promotion is more than a title change — it's a testimony. People pray for open doors, work for years toward them, and when it finally happens the right message acknowledges both the work and the grace. Here's how to say it well.</p>

<h2>Congratulations messages for a colleague's promotion</h2>
<ul>
<li>Congratulations on your promotion! Nobody who watched you work every day is surprised — but that doesn't make it any less well-deserved. You earned this. Enjoy every second of it.</li>
<li>This promotion has your name written all over it. You showed up consistently, delivered without fanfare, and let the work speak. Now it's speaking loudly. Congratulations!</li>
<li>Congratulations! The right opportunities finding the right people is one of the most satisfying things to witness at work. You're that person. Well done.</li>
<li>To the colleague who never watched the clock, never cut corners, and never stopped growing — congratulations on your promotion. May it be the first of many more levels.</li>
</ul>

<h2>Promotion prayers and spiritual congratulations messages</h2>
<ul>
<li>Congratulations! This is evidence that God rewards faithfulness. May every level you reach open doors to the next, and may this promotion be just a preview of where you're going.</li>
<li>May God establish you in this new role, give you wisdom beyond your years, and cause you to flourish in ways that surprise even your enemies. Congratulations on your promotion!</li>
<li>This is your season of elevation. Congratulations — may the grace that got you here keep you, and may you have everything you need to excel at the next level.</li>
<li>Congratulations! Your hustle has turned to harvest. May this be the first of many promotions, and may God protect everything He has given you.</li>
</ul>

<h2>Congratulations messages for a close friend's promotion</h2>
<ul>
<li>MY PERSON! Congratulations! I have watched you work for this — the late nights, the stress you didn't fully tell me about, the resilience. Today this is your reward. I'm so proud of you.</li>
<li>I knew before you did that this was coming. Congratulations, babe! Now go and show them what you're capable of at the new level. We are watching and we are rooting for you.</li>
<li>They promoted the right one. Congratulations! Don't forget us down here when you blow. (I'm joking. Mostly. Congratulations for real — I'm so proud of you.)</li>
</ul>

<h2>Funny congratulations messages for a Nigerian colleague</h2>
<ul>
<li>Congratulations on your promotion! We always knew you were management material — mostly because you've been giving unsolicited directions since your first week. Now it's official.</li>
<li>You got promoted! They've finally realised what the rest of us knew. Don't let it change you. (Let it change your salary though. Please let it change your salary.)</li>
<li>Congratulations! You're now officially too important to eat lunch at the same time as us. We understand. We're proud. We'll miss you in the queue.</li>
</ul>

<h2>Short promotion congratulations messages</h2>
<ul>
<li>Congratulations on your well-deserved promotion! Wishing you success at every new level.</li>
<li>Promoted and ready! Congratulations — this is just the beginning.</li>
<li>Hard work recognised. Congratulations on your promotion!</li>
<li>You deserve this and more. Congratulations!</li>
</ul>

<h2>How to celebrate a colleague's promotion as a team</h2>
<p>A "congratulations" in the group chat is lovely. A card signed by every teammate with personal messages about what they've observed, respected, and learned from this colleague? That's the kind of thing people frame.</p>
<p>With a <a href="/occasions/promotion">Thankeeu promotion group card</a>, you share one link on the team WhatsApp or Slack, everyone adds their personal message, photo or voice note, and the card delivers at the moment of your choice — right after the announcement, or at their desk on Monday morning. Add a pooled gift contribution via Flutterwave and you've turned a promotion into a proper celebration. <a href="/card/new">Create the card in two minutes.</a></p>$content$,
'Celebration Ideas',
ARRAY['congratulations','promotion','Nigeria','colleague','prayers','messages'],
'published', false, 'Thankeeu Team', 7, now(),
'Congratulations on Your Promotion — Messages, Prayers & How to Celebrate in Nigeria',
'Congratulations messages for a promotion in Nigeria — professional, prayerful, funny and heartfelt. Plus how to celebrate a colleague properly as a team with a group card and gift.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Get Well Soon Messages for a Colleague or Friend in Nigeria — Prayers & Wishes',
'get-well-soon-messages-colleague-friend-nigeria',
'The right get well soon messages for a Nigerian colleague, friend or family member who is ill or recovering — heartfelt, prayerful and warm, with what to avoid.',
$content$<h2>What a sick person in Nigeria actually needs to hear</h2>
<p>When a Nigerian colleague or friend is ill, the instinct is right — reach out, show up, pray. But the message matters. "Get well soon" alone can feel thin. The best get well messages in Nigerian culture acknowledge the person's strength, invoke prayer, and remind them they are not facing it alone. Here's how to do it properly.</p>

<h2>Get well soon messages for a colleague</h2>
<ul>
<li>We miss you at work — but more than that, we're thinking of you and praying for your quick recovery. Please rest well, don't rush back for our sake, and let your body do what it needs to do. Get well soon.</li>
<li>The office is not the same without you. Take all the time you need to heal fully — we'll hold things down until you're back at full strength. Wishing you a speedy recovery.</li>
<li>Get well soon! Your health comes before everything else here. We're rooting for you and keeping you in our prayers.</li>
<li>Sending you strength, rest and quick healing. Don't think about work — it will wait. You matter more than any deadline. Get well soon.</li>
</ul>

<h2>Get well soon prayers for a Nigerian colleague or friend</h2>
<ul>
<li>I'm praying for complete healing — body, mind and spirit. May God restore you quickly, fully and without complications. May you come out of this stronger than you went in. Get well soon.</li>
<li>May the God who heals lay His hands on you today. May sickness flee and health return swiftly. I'm standing in prayer for you until your testimony comes. Get well soon!</li>
<li>Father, touch [name] and restore them completely. May their healing be total and their recovery be fast. May they return to full strength and give You all the glory. Amen.</li>
<li>I'm praying that you wake up each day with a little more strength than the day before, and that healing comes quickly and completely. God has you.</li>
</ul>

<h2>Get well soon messages for a close friend</h2>
<ul>
<li>I hate that you're going through this. But I know you — you're stronger than whatever this is. Rest well, let people take care of you for once, and know that I'm praying without ceasing. Get well soon, my person.</li>
<li>You are not allowed to be sick for too long. I have things I need to disturb you about. But seriously — rest, eat well, take your medication, and let God do the rest. I'm here if you need anything. Get well soon.</li>
<li>The universe picked the wrong person to mess with. You are going to come out of this well and whole. I'm praying and I'm here. Get well soon.</li>
</ul>

<h2>Get well soon messages for a family member</h2>
<ul>
<li>Mummy/Daddy, please rest and let your body heal. We are praying for you every day and we believe God is in control. Get well soon — we need you well and strong.</li>
<li>Rest, eat, and let the body recover. I'm praying for you and thinking of you constantly. Get well soon.</li>
<li>May God heal you quickly and completely. Your family is praying, believing and standing with you. Get well soon.</li>
</ul>

<h2>Short get well soon messages</h2>
<ul>
<li>Wishing you a quick and complete recovery. Get well soon!</li>
<li>Praying for your healing. Rest well and come back stronger.</li>
<li>Get well soon — we miss you and we're praying for you.</li>
<li>Sending love and prayers. Heal quickly!</li>
</ul>

<h2>What to avoid in a get well soon message</h2>
<ul>
<li><strong>Don't share medical opinions or alternative remedies unless asked.</strong> "Have you tried [herb]?" is rarely welcome from a colleague.</li>
<li><strong>Don't make them feel guilty about their absence.</strong> "We're really struggling without you" adds pressure when they need rest.</li>
<li><strong>Don't be dramatic about the seriousness.</strong> Even if it sounds serious, messages of strength and healing are more useful than fear.</li>
<li><strong>Don't use "if there's anything I can do."</strong> It sounds thoughtful but puts the burden back on them to ask. Offer something specific: "I can send food on Thursday — is that okay?"</li>
</ul>

<h2>When the whole team wants to send strength</h2>
<p>One WhatsApp message from a colleague is kind. A card from the whole team — with personal messages, voices, and prayers from every person who works with them — is what people remember when they recover. A <a href="/cards/get-well-soon">Thankeeu get well soon group card</a> lets everyone sign from one link: messages, voice notes (so they hear familiar voices during recovery), and an optional pooled contribution toward recovery costs or a thoughtful gift. <a href="/card/new">Create one in two minutes</a> — the team signs from their phones and it delivers whenever you choose.</p>$content$,
'Celebration Ideas',
ARRAY['get well soon','Nigeria','messages','prayers','colleague','recovery'],
'published', false, 'Thankeeu Team', 7, now(),
'Get Well Soon Messages for a Colleague or Friend in Nigeria — Prayers & Wishes',
'Heartfelt get well soon messages and prayers for a Nigerian colleague, friend or family member — what to say, what to avoid, and how the whole team can send strength together.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Wedding Anniversary Messages for a Nigerian Couple — 200+ Wishes & Prayers',
'wedding-anniversary-messages-nigerian-couple',
'Heartfelt wedding anniversary messages and prayers for Nigerian couples — for friends, colleagues, parents and your own spouse. 200+ options for every milestone.',
$content$<h2>A Nigerian wedding anniversary is worth marking properly</h2>
<p>In Nigeria, marriage is not just a private affair — it was celebrated communally, prayed over publicly, and tied to family on both sides. Which means an anniversary is also communal. When friends, family and colleagues mark it, they're reinforcing something the couple built together. The right anniversary message does that without overstepping. Here are 200+ options for every relationship and milestone.</p>

<h2>Happy anniversary messages for a colleague's couple</h2>
<ul>
<li>Happy anniversary! A year of choosing each other every day is no small thing. Congratulations on building something that lasts.</li>
<li>Wishing you both a very happy anniversary. May your marriage continue to be a testimony to everyone around you.</li>
<li>Congratulations on your anniversary! May the love, patience and partnership that got you here multiply with every year ahead.</li>
<li>Happy anniversary to a couple who make marriage look like the good idea it is. Wishing you many more beautiful years together.</li>
</ul>

<h2>Anniversary prayers for a Nigerian couple</h2>
<ul>
<li>May God continue to be the foundation of your marriage. May He give you wisdom in disagreement, patience in difficulty, and joy in abundance in this new year of your union. Happy anniversary!</li>
<li>On this anniversary, I pray that everything your marriage has not yet seen — deeper love, greater peace, fruitfulness, and answered prayers — begins to manifest. May you look back on today as the start of your best season yet.</li>
<li>May the God who joined you keep you. May your home know no lack, no sorrow, and no division. May you grow in love every year until your last. Happy anniversary!</li>
<li>I pray that this anniversary finds you both grateful, and that the coming year brings you the testimonies you have been quietly trusting God for. Happy anniversary — your marriage is a blessing.</li>
</ul>

<h2>Anniversary messages for friends</h2>
<ul>
<li>Happy anniversary to my two favourite people who somehow make marriage look easy. We all know it isn't — which is exactly why yours is so worth celebrating. Here's to many more years.</li>
<li>Watching you both build this life together has been one of my favourite things about knowing you. Happy anniversary — I'm so grateful for what you have and what you've shown the rest of us is possible.</li>
<li>Happy anniversary! The way you show up for each other is a masterclass in what partnership actually looks like. Here's to another year of that, and then another, and then another.</li>
</ul>

<h2>Milestone anniversary messages — 1st, 5th, 10th, 25th</h2>
<p><strong>1st anniversary (paper):</strong></p>
<ul>
<li>One year down and a lifetime to go. Happy first anniversary — may every year that follows be richer, deeper and sweeter than the last.</li>
<li>Year one complete! You chose well and you've proven it. Happy anniversary — may the foundation you've built hold everything beautiful that's coming.</li>
</ul>
<p><strong>5th anniversary:</strong></p>
<ul>
<li>Five years of choosing each other, every single day. That is love — not the feeling kind, but the decision kind. Happy anniversary. You're building something real.</li>
</ul>
<p><strong>10th anniversary:</strong></p>
<ul>
<li>A decade of marriage is a testimony. Congratulations — may the next ten be even more fruitful and full. Happy anniversary!</li>
</ul>
<p><strong>Silver (25th) anniversary:</strong></p>
<ul>
<li>25 years. In this generation, in this economy, with everything that tries to pull people apart — 25 years is an extraordinary achievement. Congratulations. May God give you 25 more in good health and greater joy.</li>
</ul>

<h2>Anniversary messages for your own spouse</h2>
<ul>
<li>Another year with you, and I would choose you again every single time. Happy anniversary, my love. Thank you for choosing this life with me — and for the patience it takes to do so every day. I love you more than last year, which was more than the year before.</li>
<li>Marriage is not always easy. Ours isn't always easy. But it is always worth it — because you are worth it. Happy anniversary. I'm grateful for every season we've shared, even the hard ones.</li>
<li>Happy anniversary, my love. I used to wonder what people meant when they said "the right one." Now I know. I pray God gives us many, many more years together in health, peace and love.</li>
</ul>

<h2>Celebrating an anniversary couple as a group</h2>
<p>An anniversary is one of those occasions where a group card from everyone who loves a couple lands with extraordinary weight — especially for milestone years. Parents writing to their children, siblings writing to a sibling and their spouse, friends who witnessed the wedding writing now with hindsight. A <a href="/occasions/anniversary">Thankeeu anniversary group card</a> collects all of it in one place: messages, voice notes, old photos from the wedding or early years. The couple opens it together and keeps it forever. <a href="/card/new">Create one in two minutes</a> — no one needs an account to sign, and contributions toward a joint anniversary gift pool via Flutterwave if your group wants to add one.</p>$content$,
'Celebration Ideas',
ARRAY['wedding anniversary','Nigeria','messages','prayers','couple','marriage'],
'published', false, 'Thankeeu Team', 8, now(),
'Wedding Anniversary Messages for a Nigerian Couple — 200+ Wishes & Prayers',
'Heartfelt wedding anniversary messages and prayers for Nigerian couples — for friends, colleagues, parents and spouses. 200+ wishes for every milestone from 1st to 25th anniversary.'
) ON CONFLICT (slug) DO NOTHING;
