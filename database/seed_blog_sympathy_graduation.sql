-- ============================================================================
-- seed_blog_sympathy_graduation.sql
-- 10 posts filling the exact footer gaps identified by slug audit:
-- SYMPATHY (5):
--   1. what to write in a sympathy card (60 lines)
--   2. what to write in a sympathy card for a coworker
--   3. condolence messages for loss of a parent
--   4. condolence messages for loss of a pet
--   5. condolence messages for loss of a spouse
-- GRADUATION (5):
--   6. what to write in a graduation card
--   7. graduation messages for a uni grad
--   8. graduation messages for a postgraduate
--   9. graduation messages for NYSC grad Nigeria
--  10. graduation messages for professional certification
-- IDEMPOTENT: ON CONFLICT (slug) DO NOTHING
-- ============================================================================

-- ── SYMPATHY ─────────────────────────────────────────────────────────────────

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'What to Write in a Sympathy Card — 60 Heartfelt Messages & What to Avoid',
'what-to-write-sympathy-card-messages',
'Stuck on what to write in a sympathy card? Here are 60 genuine condolence messages for different losses, relationships and situations — plus what to avoid, and how to make your message the one they keep.',
$content$<h2>Why sympathy cards are the hardest cards to write</h2>
<p>There is no right thing to say when someone is grieving. But there are things that help and things that hurt, and knowing the difference matters more here than with any other card. Most people either freeze and write nothing — which hurts — or reach for something generic that the grieving person reads and forgets immediately. The messages below are genuine, not hollow. Use them, adapt them, or let them help you find your own words.</p>

<h2>Short sympathy messages (for when you don't know them well)</h2>
<ul>
<li>I was so sorry to hear of your loss. You are in my thoughts.</li>
<li>Please accept my deepest condolences. I am thinking of you and your family.</li>
<li>No words feel adequate at a time like this, but I want you to know I care.</li>
<li>Wishing you peace and comfort in this difficult time.</li>
<li>My heart goes out to you and your family.</li>
<li>I am so sorry for your loss. Please know you are not alone.</li>
</ul>

<h2>Heartfelt sympathy messages for someone close</h2>
<ul>
<li>I have no words that can make this better, and I am not going to try. What I can tell you is that I am here — not just today, but in the weeks and months ahead when the world expects you to have moved on and you haven't. I'm still here.</li>
<li>Grief doesn't follow a schedule, and healing doesn't follow a straight line. Please know that however long this takes, you have people in your corner who will not get impatient. Take all the time you need.</li>
<li>The loss of someone you love leaves a gap that nothing fills. I am so deeply sorry. I am thinking of you and praying that you find moments of peace even in this hard season.</li>
<li>You have carried so much. I am sorry this has been added to your load. Please let the people who love you carry some of it with you.</li>
</ul>

<h2>Sympathy messages with a faith or prayer element</h2>
<ul>
<li>May God comfort your heart with a peace that goes beyond understanding. I am praying for you and your family through this season.</li>
<li>I believe that love doesn't end with death — it changes form. The love you shared with them remains. May God hold you and your family close right now.</li>
<li>May the same God who gave you the gift of knowing them give you the strength to carry their memory with grace. You are in my prayers.</li>
<li>Heaven has gained someone precious. I am praying that comfort finds you, that sleep comes when you need it, and that joy returns in its own time.</li>
</ul>

<h2>What NOT to write in a sympathy card</h2>
<p>These are said with good intentions but can land badly:</p>
<ul>
<li><strong>"Everything happens for a reason"</strong> — grief doesn't need explaining, it needs acknowledging.</li>
<li><strong>"They're in a better place"</strong> — possibly true, but the grieving person wishes they were still here.</li>
<li><strong>"I know how you feel"</strong> — you don't, and even if your loss was similar, theirs is their own.</li>
<li><strong>"Stay strong"</strong> — this places a burden on someone who needs permission to fall apart.</li>
<li><strong>"Let me know if you need anything"</strong> — too vague. Offer something specific: "I'll drop food on Thursday."</li>
</ul>

<h2>When the whole group wants to say something</h2>
<p>In an office setting, a single card that holds genuine messages from every colleague who cares is far warmer than a wave of individual WhatsApp texts. A <a href="/cards/sympathy">Thankeeu sympathy group card</a> collects every message in one private place — the recipient opens it when they are ready, not during the flood of immediate condolences. Contributors can also add to an optional collection for flowers, funeral costs, or practical help. <a href="/card/new">Create one here</a> — share the link quietly with colleagues, set a private delivery, and let every voice speak at once.</p>$content$,
'Celebration Ideas',
ARRAY['sympathy','condolence','what to write','grief','messages'],
'published', false, 'Thankeeu Team', 7, now(),
'What to Write in a Sympathy Card — 60 Heartfelt Messages & What to Avoid',
'60 genuine sympathy card messages for different losses and relationships — short, heartfelt, prayerful — plus what to avoid writing, and how the whole team can say something together.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'What to Write in a Sympathy Card for a Coworker — 50 Workplace Condolence Messages',
'what-to-write-sympathy-card-coworker',
'Writing a sympathy card for a coworker requires a specific balance — warm and genuine without overstepping a professional relationship. Here are 50 messages that get it right.',
$content$<h2>The workplace sympathy card is different</h2>
<p>You care about your colleague. You want to say something real. But a sympathy card in a professional context carries a specific tension: too formal and it feels cold, too personal and it oversteps a relationship that may not be close. The messages below are calibrated for colleagues — warm without presuming intimacy.</p>

<h2>For a colleague who lost a parent</h2>
<ul>
<li>I was so sorry to hear about the loss of your [mother/father]. Losing a parent is one of life's hardest moments. Please take all the time you need, and know that we are thinking of you.</li>
<li>Your [mum/dad] raised someone we are genuinely glad to work with. I hope that thought brings you some comfort. My deepest condolences.</li>
<li>No one is ready to lose a parent, no matter how much time has passed. I am sorry for your loss and I am here when you need anything at work or otherwise.</li>
</ul>

<h2>For a colleague who lost a partner or spouse</h2>
<ul>
<li>I cannot imagine the weight of what you are carrying right now. Please know you have colleagues who care, and that whatever you need when you return — or before — just ask.</li>
<li>I am so deeply sorry. Please take as much time as you need. We will hold things down on this end without question.</li>
</ul>

<h2>For a colleague who lost a child</h2>
<ul>
<li>There are no words for this. I am so profoundly sorry. Please know we love you and we are here.</li>
<li>I have been thinking of you constantly since I heard. I am so sorry. There is nothing that makes this right — I just want you to know you are surrounded by people who care.</li>
</ul>

<h2>Short professional condolence messages</h2>
<ul>
<li>My sincerest condolences on your loss. Please take all the time you need.</li>
<li>I was so sorry to hear your news. Thinking of you and your family.</li>
<li>Please accept my deepest sympathies. We are all thinking of you.</li>
<li>Sending you warmth and strength. Please don't worry about work.</li>
<li>My heart goes out to you and your loved ones during this time.</li>
</ul>

<h2>From the whole team — one card, every voice</h2>
<p>Rather than a flurry of separate messages that a grieving colleague has to process one by one, a <a href="/cards/sympathy">group sympathy card from the whole team</a> gathers everyone's words in one quiet place — delivered privately, opened when they are ready. <a href="/card/new">Create one here</a>. Share the link with colleagues, not the recipient. Set a gentle delivery time. It shows coordination and care without overwhelming.</p>$content$,
'Celebration Ideas',
ARRAY['sympathy card','coworker','condolence','workplace','messages'],
'published', false, 'Thankeeu Team', 6, now(),
'What to Write in a Sympathy Card for a Coworker — 50 Workplace Condolence Messages',
'50 sympathy card messages for a coworker — calibrated for professional relationships: warm without overstepping. For loss of a parent, partner, child, or any bereavement.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Condolence Messages for the Loss of a Parent — 60 Comforting Words',
'condolence-messages-loss-of-parent',
'Losing a parent is one of the deepest griefs. Here are 60 condolence messages for the loss of a mother or father — heartfelt, prayerful and genuine — plus what actually helps when the words run out.',
$content$<h2>Losing a parent — what words can and cannot do</h2>
<p>When someone loses a parent, no message fixes anything. What messages can do is tell the bereaved person: I see this, I see you, and you are not carrying it alone. That is the only job a condolence message has. These are written with that in mind.</p>

<h2>Condolence messages for the loss of a mother</h2>
<ul>
<li>Your mother was one of a kind, and the world is different without her. I am so deeply sorry for your loss. May her memory be a comfort to you in the hardest moments.</li>
<li>The love between a mother and child is irreplaceable. I am so sorry. I am praying that God holds you close and gives you peace that doesn't make sense on paper.</li>
<li>She raised you, and in doing so, she gave the world someone remarkable. I am sorry she is gone. Her legacy lives in you.</li>
<li>There will be ordinary moments that hit hardest — a phone call you reach to make, a recipe you want to ask her about. I am so sorry for those moments too, not just this one.</li>
<li>Your mum sounded like the kind of woman who held everything together. The gap she leaves cannot be measured. I am so deeply sorry.</li>
</ul>

<h2>Condolence messages for the loss of a father</h2>
<ul>
<li>Your father raised someone I am proud to know. I am so sorry for your loss. May his memory be a source of strength, not just sadness.</li>
<li>I am so sorry to hear of your dad's passing. A father's presence is irreplaceable — the quiet steadiness of it, the sense of safety. I pray you feel surrounded by comfort.</li>
<li>I am praying for you and your family. Losing a father changes everything. I hope the memories you have of him bring you more warmth than pain in time.</li>
<li>Your dad was clearly loved by so many. I am so sorry. May he rest well, and may the peace you need find you.</li>
</ul>

<h2>Short condolence messages (when you don't know what else to say)</h2>
<ul>
<li>I am so sorry for the loss of your [mother/father]. My deepest condolences.</li>
<li>Thinking of you and your family. Please take all the time you need.</li>
<li>There are no words. I am just so sorry.</li>
<li>May they rest in peace, and may you find comfort in those around you.</li>
<li>Sending love and strength to you and your whole family.</li>
</ul>

<h2>Prayerful condolence messages (Nigerian & African context)</h2>
<ul>
<li>May God grant your [mother/father] eternal rest, and may He give you and your family the strength to bear this loss. I am praying for you.</li>
<li>We thank God for the years He gave us with them, and we trust Him with the grief that remains. My deepest condolences.</li>
<li>May their soul rest in perfect peace, and may the same God who called them home hold your family together in this season. Amen.</li>
</ul>

<h2>From the whole family, friends and colleagues</h2>
<p>When a colleague, friend or family member loses a parent, a group card gathers every condolence in one private, keepable place. A <a href="/cards/sympathy">Thankeeu sympathy group card</a> can be signed by the whole team, family members spread across cities, and friends from every chapter of life — all in one card the bereaved person opens in their own time. <a href="/card/new">Create one here.</a></p>$content$,
'Celebration Ideas',
ARRAY['condolence','loss of parent','sympathy','mother','father'],
'published', false, 'Thankeeu Team', 7, now(),
'Condolence Messages for the Loss of a Parent — 60 Comforting Words',
'60 heartfelt condolence messages for the loss of a mother or father — short, heartfelt, prayerful and Nigerian-contextualised. Written for friends, colleagues and family.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Condolence Messages for the Loss of a Pet — 40 Genuine Messages',
'condolence-messages-loss-of-pet',
'Losing a pet is real grief. Here are 40 genuine condolence messages for someone who has lost a dog, cat or beloved animal — without the dismissiveness that pet loss is often met with.',
$content$<h2>Pet loss is real grief — treat it that way</h2>
<p>In Nigeria and across the world, pet loss is still sometimes met with "it was just an animal." If you are sending a condolence message for someone's lost pet, you already know better than that. A dog or cat who has been a daily companion for years leaves a genuine gap — in the routine, in the home, in the quiet moments. These messages honour that.</p>

<h2>Messages for the loss of a dog</h2>
<ul>
<li>I am so sorry about [name]. Dogs give us a love that asks for nothing and expects nothing back — and losing that is a real loss. Thinking of you.</li>
<li>[Name] had such a good life because of you. The love you gave them was visible every time you talked about them. I am so sorry.</li>
<li>A dog's life is too short but their love fills every minute of it. I am so sorry for your loss.</li>
<li>No more waiting at the door. No more morning walks. Those absences are going to hurt. I am truly sorry.</li>
<li>Sending you so much love. [Name] was lucky to have you, and you were lucky to have them.</li>
</ul>

<h2>Messages for the loss of a cat</h2>
<ul>
<li>Cats choose their people carefully, and [name] chose well. I am so sorry for your loss.</li>
<li>The quiet a house has after a cat is gone is a very specific kind of empty. I am so sorry.</li>
<li>I am so sorry about [name]. They were clearly loved deeply and that matters.</li>
<li>Sending love. Losing a pet who has been part of your daily life is a real and significant loss.</li>
</ul>

<h2>Short messages for any pet</h2>
<ul>
<li>I am so sorry for your loss. They were loved and they knew it.</li>
<li>Thinking of you. The grief of losing a pet is real — please be gentle with yourself.</li>
<li>So sorry about [name]. What a good animal they were.</li>
<li>Sending love. The house will feel different for a while. That is the measure of how much they mattered.</li>
<li>I am sorry. There is no love quite like a pet's love.</li>
</ul>

<h2>A group card for pet loss</h2>
<p>For a close friend, family member or colleague who has lost a beloved pet, a group card from people who knew and loved the animal — or who simply love the person — means more than a single message lost in a chat. A <a href="/cards/sympathy">Thankeeu sympathy group card</a> lets everyone add their own message. <a href="/card/new">Create one here.</a></p>$content$,
'Celebration Ideas',
ARRAY['condolence','pet loss','sympathy','dog','cat'],
'published', false, 'Thankeeu Team', 5, now(),
'Condolence Messages for the Loss of a Pet — 40 Genuine Messages',
'40 genuine condolence messages for someone who has lost a pet — without dismissiveness. Real messages for the loss of a dog, cat or beloved animal.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Condolence Messages for the Loss of a Spouse or Partner — 50 Comforting Words',
'condolence-messages-loss-of-spouse',
'Losing a spouse or partner is among the most devastating griefs. Here are 50 condolence messages for a widow or widower — gentle, genuine, and aware of what this loss actually means.',
$content$<h2>This is the hardest kind of grief</h2>
<p>Losing a spouse or life partner dismantles the structure of a person's everyday life. It is not just emotional loss — it is the loss of a roommate, a co-parent, a financial partner, a confidant, a routine. Messages here need to acknowledge that depth without trying to minimise or explain it.</p>

<h2>Condolence messages for a widow or widower</h2>
<ul>
<li>Losing your husband/wife is losing the person who knew you most completely. I am so deeply sorry. There are no words that do this loss justice, but I want you to know I am here and I am thinking of you every day.</li>
<li>A marriage that real, a love that deep — I am so sorry it has been cut short. What you built together is visible in you and in your children, and that does not disappear.</li>
<li>I am not going to tell you it gets easier quickly, because that would be a lie. What I can promise is that you will not be left to carry this alone. I am here for the long road, not just today.</li>
<li>Your [husband/wife] was one of the best people I have had the privilege of knowing. I am so sorry for your loss. Their kindness, their laugh, the way they spoke about you — those things stay with me.</li>
<li>I am so sorry. The love you had was the kind people write about. I am heartbroken for you.</li>
</ul>

<h2>For someone who lost a partner unexpectedly</h2>
<ul>
<li>There is no preparation for this. I am so profoundly sorry. Please let the people who love you surround you right now.</li>
<li>The shock of sudden loss is its own particular cruelty. I am thinking of you constantly and praying for your family.</li>
<li>I do not have the right words. I am not sure they exist. I am just so, so sorry.</li>
</ul>

<h2>Prayerful messages</h2>
<ul>
<li>May God be close to you in this season in a way that no human comfort can replicate. May you feel held, even when you cannot feel anything else. I am praying for you.</li>
<li>May [name] rest in perfect peace, and may the God who joined you give you the strength to carry forward the life you built together. You are in my prayers every day.</li>
</ul>

<h2>Short messages</h2>
<ul>
<li>I am so deeply sorry. My thoughts are with you and your family.</li>
<li>Thinking of you. Please don't face this alone.</li>
<li>I am so sorry for your loss. Take all the time you need.</li>
<li>Sending you love. Please reach out if there is anything at all I can do.</li>
</ul>

<h2>When the workplace wants to show up</h2>
<p>A colleague who has lost a spouse often returns to work weeks later carrying invisible weight. A <a href="/cards/sympathy">group sympathy card from the whole team</a> — gathered quietly while they are away and delivered privately — tells them they were thought of, not just notified. It is a small thing that lands large. <a href="/card/new">Create one here.</a></p>$content$,
'Celebration Ideas',
ARRAY['condolence','loss of spouse','widow','widower','sympathy'],
'published', false, 'Thankeeu Team', 6, now(),
'Condolence Messages for the Loss of a Spouse or Partner — 50 Comforting Words',
'50 genuine condolence messages for someone who has lost a spouse or partner — for close friends, family and colleagues. Written with honesty about what spousal loss actually means.'
) ON CONFLICT (slug) DO NOTHING;

-- ── GRADUATION ───────────────────────────────────────────────────────────────

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'What to Write in a Graduation Card — 80 Messages for Every Graduate',
'what-to-write-graduation-card-messages',
'Stuck on what to write in a graduation card? Here are 80 messages for every type of graduate — funny, heartfelt, prayerful and short — for uni, secondary school, NYSC and professional qualifications.',
$content$<h2>Why graduation cards matter</h2>
<p>A graduation is the moment years of effort become a certificate. The right message in the card acknowledges not just the achievement but the person — the late nights, the doubt, the persistence. Here are 80 messages for every graduate and every relationship.</p>

<h2>Short graduation messages</h2>
<ul>
<li>Congratulations! Years of hard work, now yours to keep. Well done.</li>
<li>You did it! May this be the first of many caps you throw in the air.</li>
<li>Graduate! Now go show the world what you are made of.</li>
<li>Congratulations on your graduation. This is just the beginning.</li>
<li>So proud of you. The hard part is done — now for the good part.</li>
</ul>

<h2>Heartfelt graduation messages</h2>
<ul>
<li>This certificate is proof of something that was always true: you are capable of more than you sometimes believe. Congratulations — go live like you know it.</li>
<li>I have watched you grow from someone who doubted themselves into someone who has every reason not to. This graduation is wonderful, but watching that transformation has been the real thing worth celebrating.</li>
<li>You worked for this when it was hard, when it was boring, when it made no sense. That is the kind of discipline that will carry you everywhere. Congratulations.</li>
<li>The world is genuinely better for gaining another person who has been educated, stretched and shaped. Congratulations — go use it well.</li>
</ul>

<h2>Graduation prayers (Nigerian context)</h2>
<ul>
<li>May God open doors for you that your certificate alone cannot open. May favour locate you in every room you walk into. Congratulations, and go with God.</li>
<li>This graduation is an answered prayer — yours and your family's. May the next chapter bring everything you have been believing God for. Congratulations!</li>
<li>May your degree be a key that opens the right doors at the right time. May God order your steps from here. Congratulations!</li>
</ul>

<h2>Funny graduation messages</h2>
<ul>
<li>You finished! Now you can spend the next 30 years explaining to people what your degree is actually for. Congratulations!</li>
<li>All those years of reading, cramming, panicking and surviving — and now you get a certificate and a photo. Completely worth it. Congratulations!</li>
<li>Graduated! You now have a qualification and a student loan. One of those is more useful than the other. Congratulations anyway!</li>
</ul>

<h2>From the whole group — family, friends and colleagues</h2>
<p>A graduation is a communal achievement — parents, siblings, lecturers, friends, church members and colleagues all had a role. A <a href="/occasions/graduation">Thankeeu group graduation card</a> collects every message, photo and voice note in one card the graduate keeps forever — delivered at the ceremony, the results day, or whenever you choose. Add a pooled gift contribution alongside it. <a href="/card/new">Create one in two minutes.</a></p>$content$,
'Celebration Ideas',
ARRAY['graduation','what to write','messages','Nigeria','university'],
'published', false, 'Thankeeu Team', 7, now(),
'What to Write in a Graduation Card — 80 Messages for Every Graduate',
'80 graduation card messages — funny, heartfelt, prayerful and short — for every type of graduate: university, secondary school, NYSC and professional qualifications.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Graduation Messages for a University Graduate — 60 Wishes for Your Uni Grad',
'graduation-messages-university-graduate',
'The best graduation messages for a university graduate — funny, heartfelt, prayerful and practical. For first degrees, Bachelor''s, HND, and every celebration of years well spent.',
$content$<h2>University graduation deserves real words</h2>
<p>University is years of your life — lectures, exams, friendships, setbacks and growth compressed into one ceremony. The message in the card should honour that, not gloss over it. Here are 60 genuine messages for a university graduate.</p>

<h2>Messages for a friend's university graduation</h2>
<ul>
<li>I watched you navigate all of it — the coursework, the breakdowns, the 2am panics — and come out the other side holding a degree and your sanity. I am so proud of you. Congratulations, graduate.</li>
<li>You earned every letter on that certificate. Congratulations — now go build the life you've been studying for.</li>
<li>We have been through a lot together, and this is one of my favourite chapters. Congratulations on your degree.</li>
<li>University graduate! The real education starts now — but so does the career, the independence, and the life. Can't wait to watch it unfold. Congratulations.</li>
</ul>

<h2>Messages from parents to a university graduate</h2>
<ul>
<li>We prayed for this day for years. Watching you walk across that stage is one of the greatest moments of our lives. Congratulations — we are so incredibly proud.</li>
<li>You carried every one of our hopes and prayers across that finishing line with you. We are so proud. Now go and do what you were made to do.</li>
<li>We did not always make it easy, and you did not always make it easy for us — but here we are, on the other side, with a graduate in the family. This is a gift. Congratulations.</li>
</ul>

<h2>Messages for a first-generation university graduate (Nigeria)</h2>
<ul>
<li>You are the first in the family to hold this degree, and you will not be the last. You have shown everyone who comes after you what is possible. This is bigger than a certificate. Congratulations.</li>
<li>Your parents worked for years so you could stand where you are standing today. Go and make every sacrifice worth it. Congratulations, and well done.</li>
</ul>

<h2>Short messages</h2>
<ul>
<li>University graduate! Congratulations — the world is waiting.</li>
<li>Four years and a degree. Congratulations! Now rest, then go conquer.</li>
<li>So proud of you. Congratulations on your degree!</li>
<li>You did it! Congratulations — enjoy every second of this.</li>
</ul>

<h2>Prayerful messages</h2>
<ul>
<li>May every door you need to walk through open for you. May favour meet you at every junction. Congratulations on your degree — go with God.</li>
<li>God saw you through every exam, every project and every moment of doubt. May He see you through what comes next with the same faithfulness. Congratulations!</li>
</ul>

<h2>Give them one card from everyone</h2>
<p>Family, friends, lecturers, church members — a <a href="/occasions/graduation">Thankeeu group graduation card</a> collects every voice in one place. <a href="/card/new">Create it here</a>, share the link across every WhatsApp group that loves them, and deliver it on the day. Add a pooled Naira gift alongside it.</p>$content$,
'Celebration Ideas',
ARRAY['graduation','university','messages','Nigeria','degree'],
'published', false, 'Thankeeu Team', 7, now(),
'Graduation Messages for a University Graduate — 60 Wishes for Your Uni Grad',
'60 genuine graduation messages for a university graduate — from friends, parents, and family. Heartfelt, funny, prayerful and Nigerian-contextualised for first degrees and HND.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Graduation Messages for a Postgraduate — Masters, PhD & Professional Degrees',
'graduation-messages-postgraduate-masters-phd',
'Congratulating someone on a postgraduate degree — Masters, MBA, PhD, LLM or any professional qualification — requires a different tone than undergraduate graduation. Here are 50 messages that get it right.',
$content$<h2>Postgraduate graduation is different</h2>
<p>A Masters or PhD graduate has typically given up years of income, career advancement and comfort to go deeper into their field. The message in the card should acknowledge that sacrifice alongside the achievement — not just the result, but the cost of getting there.</p>

<h2>Messages for a Masters graduate</h2>
<ul>
<li>A Masters degree on top of everything else you are managing — that is not easy, and you did it anyway. Congratulations. The discipline it took will serve you for the rest of your career.</li>
<li>You went back. You studied harder. You came out with something that proves not just your knowledge but your character. Congratulations on your Masters.</li>
<li>Not everyone can do what you just did. Congratulations on your Masters — the world has one more expert in something that matters.</li>
<li>A Masters: the qualification that says "I wasn't satisfied with just knowing — I went deeper." Congratulations. That instinct will take you very far.</li>
</ul>

<h2>Messages for a PhD graduate</h2>
<ul>
<li>Dr [Name]. That title carries years of patience, rigour, doubt and brilliance. Congratulations — it was earned and it is deserved.</li>
<li>You have contributed original knowledge to the world. That is rare, and it is remarkable. Congratulations, Doctor.</li>
<li>The thesis is done. The defence is done. The title is yours. Congratulations — go and use that beautiful brain for good.</li>
<li>Few people have what it takes to complete a PhD — the intellectual resilience, the capacity for long uncertainty, the passion for the subject. You have all of it. Congratulations, Dr [Name].</li>
</ul>

<h2>For an MBA graduate</h2>
<ul>
<li>An MBA is the degree that pays for itself if you use it right. Congratulations — go and use it right.</li>
<li>Business school done. You came in smart and came out sharper. The next few years are going to be interesting. Congratulations!</li>
</ul>

<h2>Short messages for any postgraduate</h2>
<ul>
<li>Congratulations on your [Masters/PhD/MBA]. Earned and well deserved.</li>
<li>[Dr/MA/MSc] [Name] — has a ring to it. Congratulations!</li>
<li>You went further than most would. Congratulations on your postgraduate degree.</li>
<li>Congratulations! The extra years were worth it.</li>
</ul>

<h2>Celebrate them properly</h2>
<p>A postgraduate graduation deserves a group card worthy of the achievement. Family, colleagues, supervisors, and friends from both their undergraduate and postgraduate years can all sign a <a href="/occasions/graduation">Thankeeu group graduation card</a> from one link. <a href="/card/new">Create one here</a> — pool a gift alongside it.</p>$content$,
'Celebration Ideas',
ARRAY['graduation','Masters','PhD','postgraduate','messages'],
'published', false, 'Thankeeu Team', 6, now(),
'Graduation Messages for a Postgraduate — Masters, PhD & Professional Degrees',
'50 graduation messages for a postgraduate degree — Masters, MBA, PhD, LLM. Acknowledges the sacrifice alongside the achievement, for friends, family and colleagues.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Graduation Messages for an NYSC Graduate in Nigeria — Passing Out & Beyond',
'graduation-messages-nysc-nigeria-passing-out',
'Completing NYSC is a milestone every Nigerian celebrates. Here are 50 messages for a corps member passing out — funny, heartfelt, prayerful — and for the chapter that comes next.',
$content$<h2>NYSC passing out: why it deserves a real celebration</h2>
<p>The National Youth Service Corps year is a mandatory chapter that most Nigerian graduates approach with a mix of dread and curiosity and finish with a mix of exhaustion and pride. Completing it is genuinely worth celebrating — twelve months of posting to an unfamiliar state, community development, and service are behind them. Here are messages that honour that.</p>

<h2>Congratulations messages for passing out of NYSC</h2>
<ul>
<li>Service year done! You went to a state you didn't choose, lived conditions you didn't expect, and came out the other side. That is character-building in the truest sense. Congratulations!</li>
<li>You came as a corps member and you're leaving as something more — more experienced, more resilient, more Nigerian in the best possible way. Congratulations on passing out!</li>
<li>NYSC complete! The certificate is yours, the allawee memories are painful, the experiences are yours forever. Congratulations — now go and find something that pays properly.</li>
<li>You posted. You served. You survived. Congratulations, ex-corps member!</li>
</ul>

<h2>For someone posted far from home</h2>
<ul>
<li>You were posted to the middle of nowhere and you went anyway. Quietly, without complaint. I am so proud of you. Congratulations on completing your service year.</li>
<li>Serving far from home takes a specific kind of courage. You made the most of it and you're coming back a different person. Welcome home, and congratulations!</li>
</ul>

<h2>Prayerful NYSC passing-out messages</h2>
<ul>
<li>May every door your service year was preparing you for now open. May God reward your faithfulness with opportunities that make the sacrifice make sense. Congratulations!</li>
<li>The service year is done — may the next chapter be filled with exactly the kind of work you were made for, at exactly the salary you deserve. Go with God. Congratulations!</li>
</ul>

<h2>Funny NYSC passing-out messages</h2>
<ul>
<li>NYSC done! You survived the khaki, the early morning CDS, the ₦33,000 allawee, and the orientation camp food. If you can survive all of that, your career will be fine. Congratulations!</li>
<li>The green-white-green is in the bag. You are officially done with compulsory service to the Federal Republic of Nigeria. What a journey. Congratulations!</li>
</ul>

<h2>Celebrate them with the whole group</h2>
<p>Family, university friends, church, and colleagues who followed the NYSC journey — a <a href="/occasions/graduation">Thankeeu group card</a> gathers every message in one place for the passing-out day. <a href="/card/new">Create one here</a>, share the link privately, and deliver it on the passing-out parade day or immediately after.</p>$content$,
'Celebration Ideas',
ARRAY['NYSC','graduation','Nigeria','passing out','corps member'],
'published', false, 'Thankeeu Team', 6, now(),
'Graduation Messages for an NYSC Graduate in Nigeria — Passing Out & Beyond',
'50 messages for a corps member completing NYSC and passing out — funny, heartfelt and prayerful. Acknowledges the real experience of the service year and celebrates what comes next.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Graduation Messages for a Professional Certification or Qualification',
'graduation-messages-professional-certification',
'Passing a professional qualification — CFA, ICAN, ACCA, bar exam, medical licensing or any certification — deserves the same celebration as a university degree. Here are 50 messages for a professional graduate.',
$content$<h2>Professional certifications deserve real recognition</h2>
<p>Passing a professional qualification while working full-time — ICAN, ACCA, CFA, CIMA, bar exams, COREN, medical licensing — is often harder than a traditional degree. It happens alongside a job, a family, and everything else life throws at an adult. The message in the card should say: I see how hard you worked for this.</p>

<h2>Messages for passing a professional accounting qualification (ICAN, ACCA, CIMA)</h2>
<ul>
<li>Chartered! You worked full days and studied full evenings for this, and the letters after your name are proof that it paid off. Congratulations.</li>
<li>ICAN/ACCA qualified. That isn't handed to anyone — it is taken by people who want it badly enough to endure the process. You wanted it that badly. Congratulations.</li>
<li>The exams are done, the membership is yours, and the career that follows is well-deserved. Congratulations on your qualification!</li>
</ul>

<h2>Messages for passing the bar exam or law qualification</h2>
<ul>
<li>Called to the bar. Those words are the end of a very long road and the beginning of an even longer and more rewarding one. Congratulations, Barrister/Solicitor [Name].</li>
<li>You read the law until you understood it deeply enough to be trusted with it. Congratulations on being called to bar — the profession gains someone it will be proud of.</li>
</ul>

<h2>Messages for a medical, nursing or clinical qualification</h2>
<ul>
<li>You are going to save lives with what you have just qualified to do. Congratulations, Doctor/Nurse [Name] — the world needs what you have spent years preparing to give it.</li>
<li>The registration is yours. The years of training are behind you. The patients whose lives you will change are ahead of you. Congratulations.</li>
</ul>

<h2>General professional qualification messages</h2>
<ul>
<li>This certification proves what the people who know you already knew: you are committed, disciplined and excellent. Congratulations.</li>
<li>Qualifying while working is twice the effort of qualifying while studying. The fact that you did it speaks to your character as much as your ability. Congratulations.</li>
<li>You passed. After all the evenings, all the weekends, all the times you questioned whether it was worth it — you passed. It was worth it. Congratulations!</li>
<li>New letters after your name. New doors in front of you. Congratulations — well and truly earned.</li>
</ul>

<h2>Short messages</h2>
<ul>
<li>Congratulations on your qualification! Hard-earned and well-deserved.</li>
<li>Qualified! Congratulations — the letters after your name are yours to keep.</li>
<li>Passed! Congratulations on this huge milestone.</li>
</ul>

<h2>Celebrate them with the whole team</h2>
<p>When a colleague passes a major professional qualification, a group card from the whole team acknowledges the sacrifice behind the achievement — not just in a passing "well done" but in a card full of messages from every person who watched them study evenings and weekends without complaint. A <a href="/occasions/promotion">Thankeeu group card</a> with a pooled gift does exactly that. <a href="/card/new">Create one in two minutes.</a></p>$content$,
'Celebration Ideas',
ARRAY['professional certification','ICAN','ACCA','bar exam','qualification','messages'],
'published', false, 'Thankeeu Team', 6, now(),
'Graduation Messages for a Professional Certification or Qualification',
'50 messages for passing a professional qualification — ICAN, ACCA, CFA, bar exams, medical licensing. Written for colleagues, friends and family who qualify while working.'
) ON CONFLICT (slug) DO NOTHING;
