-- ============================================================================
-- seed_blog_nigerian_search_keywords.sql
-- 6 posts targeting what Nigerians actually search for around birthdays,
-- send-forths, and group contributions — the discovery front-door for people
-- who don't know group-card products exist. Each post fully answers the
-- search intent (real usable messages/prayers), then introduces Thankeeu.
-- Run in Supabase SQL editor. Uses same format as seed_blog_hr_seo_articles.sql.
-- published_at is set to now() (not future) so posts are live immediately —
-- the API now gates on published_at <= now().
-- ============================================================================

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'100+ Birthday Wishes for a Colleague in Nigeria (Prayers, Pidgin & Professional)',
'birthday-wishes-for-colleague-nigeria-prayers-pidgin',
'The perfect birthday wish for a Nigerian colleague — warm, prayerful, sometimes funny. Here are 100+ messages that work for coworkers, plus how to deliver them so they actually land.',
$content$<h2>What makes a Nigerian birthday wish different</h2>
<p>A birthday message to a Nigerian colleague is rarely just "Happy birthday." It carries a prayer, a blessing, sometimes gentle banter — because in Nigeria, marking someone's new year of life is a communal act, not a formality. Whether your colleague is in Lagos, Abuja, Port Harcourt or working remotely, the right message says: <em>I see you, and I wish you well.</em></p>

<h2>Professional birthday wishes for a colleague</h2>
<ul>
<li>Happy birthday! Working with you makes even Monday mornings bearable. Wishing you a year of growth, favour and every good thing.</li>
<li>Celebrating you today! Your dedication lifts this whole team. May this new year of your life bring you everything you have worked and prayed for.</li>
<li>Happy birthday to a colleague who makes excellence look easy. More wins, more grace, more of everything good.</li>
<li>A new year, new levels. Happy birthday — may doors open for you that no one can shut.</li>
<li>Happy birthday! May your career keep rising and your joy keep multiplying.</li>
</ul>

<h2>Birthday prayers for a colleague</h2>
<p>Prayer is the heart of a Nigerian birthday wish. These work for colleagues of any faith background when kept warm and sincere:</p>
<ul>
<li>As you add another year, may God add to you on every side — health, peace, wisdom and prosperity. Amen.</li>
<li>May this new age come with new grace. Everything you lay your hands on shall prosper.</li>
<li>I pray that the coming year brings you divine favour, open doors and testimonies that will surprise even you.</li>
<li>May you never lack, may you never be stranded, and may help always locate you. Happy birthday!</li>
<li>Long life and prosperity in good health. May you celebrate many more years in joy.</li>
</ul>

<h2>Pidgin birthday messages (for colleagues you're close with)</h2>
<p>Keep pidgin for colleagues you have genuine rapport with — it lands as warmth, not unprofessionalism, in the right relationship:</p>
<ul>
<li>My person! Another year don land. May money no do you strong thing this new age. Enjoy your day!</li>
<li>Happy birthday o! May your account balance dey always make you smile, and may traffic no hold you today.</li>
<li>Baba/Madam de office! Na your day today. Chop life small — work go dey tomorrow.</li>
<li>You don add one year again — may this one sweet pass the last one. More wins!</li>
</ul>

<h2>Short and safe (for a colleague you barely know)</h2>
<ul>
<li>Happy birthday! Wishing you a wonderful year ahead.</li>
<li>Many happy returns! Enjoy your special day.</li>
<li>Happy birthday — may this year be your best yet.</li>
</ul>

<h2>How to deliver it so it actually lands</h2>
<p>Here's the thing about the office birthday WhatsApp chain: your beautiful message gets buried between forty "HBD 🎂" texts and disappears by noon. The celebrant scrolls past most of them.</p>
<p>Nigerian teams are increasingly switching to a <strong>group birthday card</strong> instead: one link goes round on WhatsApp, everyone adds their message (text, photo, even a voice note), and the celebrant receives one beautiful card holding every single wish — which they keep forever. With <a href="/occasions/birthday">Thankeeu's online birthday group cards</a>, the team can also pool a Naira gift alongside the messages, paid securely via Flutterwave, withdrawable to any Nigerian bank.</p>
<p>Your prayer for your colleague deserves better than getting buried in a group chat. <a href="/card/new">Create a group birthday card</a> — it takes two minutes, and nobody needs to download anything to sign.</p>$content$,
'Celebration Ideas',
ARRAY['birthday wishes','Nigeria','colleagues','prayers','pidgin'],
'published', false, 'Thankeeu Team', 7, now(),
'100+ Birthday Wishes for a Colleague in Nigeria — Prayers, Pidgin & Professional',
'Birthday wishes for a Nigerian colleague: professional messages, heartfelt prayers, and pidgin options — plus the best way to deliver them so they are never buried in a WhatsApp chain.'
);

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Powerful Birthday Prayers for a Friend, Sister, Brother or Boss (Nigeria)',
'birthday-prayers-for-friend-family-boss-nigeria',
'Heartfelt birthday prayers Nigerians actually send — for friends, siblings, parents, bosses and mentors. Copy, personalise, and learn how to make your prayer the one they never forget.',
$content$<h2>Why Nigerians pray on birthdays</h2>
<p>In Nigeria, a birthday without prayer feels incomplete. Seeing a new year is understood as grace — so the most treasured birthday messages are the ones that bless the celebrant's coming year. As one Lagos grandmother puts it: "If you love someone, you pray for them so God can keep them till another birthday."</p>

<h2>Birthday prayers for a friend</h2>
<ul>
<li>On your birthday, I pray that everything you have silently hoped for begins to unfold. May this year carry you further than the last five combined.</li>
<li>May God keep you, favour you and surround you with people who genuinely love you. Happy birthday, my friend.</li>
<li>I pray your hustle turns to harvest this year. No more delay, no more almost — only breakthrough.</li>
<li>May joy locate you in every season, and may you never carry any burden alone. Amen.</li>
</ul>

<h2>Birthday prayers for a sister or brother</h2>
<ul>
<li>My sibling, my first friend — may God honour you in ways that make our parents' prayers visible. Happy birthday.</li>
<li>As you begin this new year of life, may every good thing that has been slow come running. Amen.</li>
<li>May you grow in wisdom, walk in health, and never know shame. Happy birthday!</li>
</ul>

<h2>Birthday prayers for a boss or mentor</h2>
<ul>
<li>Happy birthday, sir/ma. May the same grace with which you lift others continue to lift you higher.</li>
<li>I pray this new year rewards your integrity and multiplies everything you have sown into people like me.</li>
<li>May wisdom never depart from your table, and may your influence keep opening doors — for you and for all of us who learn from you.</li>
</ul>

<h2>Birthday prayers for parents</h2>
<ul>
<li>Mummy/Daddy, may you eat the fruits of your labour in good health and long life. We love you.</li>
<li>May God preserve you to see everything you prayed for us come to pass. Happy birthday!</li>
</ul>

<h2>Turn scattered prayers into one keepsake</h2>
<p>The most moving birthday gift a Nigerian can receive might be this: every prayer from family, friends, church members and colleagues — gathered in one place they can reread for years.</p>
<p>That's exactly what a <a href="/occasions/birthday">group birthday card</a> does. Share one link on the family or office WhatsApp group; everyone adds their prayer, message, photo or voice note; the celebrant receives one beautiful card at midnight on their birthday. Aunties abroad can sign it too, and anyone can add to a pooled Naira gift while they're at it. <a href="/card/new">Create one free</a> — the prayers people type into it are the kind that get screenshot and kept forever.</p>$content$,
'Celebration Ideas',
ARRAY['birthday prayers','Nigeria','family','boss','friends'],
'published', false, 'Thankeeu Team', 6, now(),
'Powerful Birthday Prayers for a Friend, Sister, Brother or Boss — Nigeria',
'Heartfelt Nigerian birthday prayers for friends, siblings, parents, bosses and mentors — plus how to gather every prayer into one group card the celebrant keeps forever.'
);

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Send-Forth Messages for a Colleague in Nigeria: What to Write (With Examples)',
'send-forth-messages-colleague-nigeria-examples',
'A proper Nigerian send-forth needs the right words. Here are send-forth messages for colleagues, bosses and corps members — plus how to organise the card and contribution without stress.',
$content$<h2>The Nigerian send-forth, done properly</h2>
<p>When a colleague is leaving — new job, relocation, japa, end of NYSC service year — Nigerians don't just say goodbye. We do a <strong>send-forth</strong>: a proper celebration of the person's time with us, with words that honour what they contributed and prayers for where they're going.</p>

<h2>Send-forth messages for a colleague</h2>
<ul>
<li>It has been an honour working beside you. Wherever you're going, they are gaining gold — and they should know it. Go and shine!</li>
<li>Your seat will be empty but your impact stays. Thank you for every deadline you saved and every laugh you brought. All the best in your next chapter.</li>
<li>We're not saying goodbye, we're saying "go and conquer." This office will not forget you.</li>
<li>May your new place value you the way we did — and pay you even better! Safe journey into your next chapter.</li>
</ul>

<h2>Send-forth messages for a boss</h2>
<ul>
<li>Thank you for leading with patience and pushing us to be better. Your legacy here is the people you built. We send you forth with gratitude and prayers.</li>
<li>A boss who taught, corrected and still celebrated us — that's rare. Wherever you go next is lucky to have you, sir/ma.</li>
</ul>

<h2>Send-forth messages for a corps member (NYSC)</h2>
<ul>
<li>Service year done! Thank you for your energy and fresh ideas. As you pass out, may every door you knock on open wide.</li>
<li>You came as a corper and you're leaving as family. Go well — greater things are waiting for you.</li>
</ul>

<h2>For someone relocating (japa send-forth)</h2>
<ul>
<li>As you cross to the other side, may the opportunities be plenty and the winters be mild! We are proud of you. Don't forget us when you blow.</li>
<li>New country, same excellence. Go and represent us well — and keep your data on, we will still be disturbing you on WhatsApp.</li>
</ul>

<h2>Organising the send-forth card and contribution — without the usual stress</h2>
<p>Every Nigerian office knows the routine: someone volunteers to buy a card, chases people desk to desk to sign it, then chases them again for the contribution money. Half the remote staff never sign. Someone's transfer "is on the way" until the person has already left.</p>
<p>There's a simpler way now. With a <a href="/occasions/farewell">Thankeeu send-forth group card</a>, you share one link on the office WhatsApp group. Everyone signs from their phone — messages, photos, even voice notes — and adds their contribution at the same time via Flutterwave (card, transfer or USSD). No cash chasing, no missing signatures, and the departing colleague withdraws the pooled gift straight to their Nigerian bank account. <a href="/card/new">Set one up in two minutes</a> and give them the send-forth they deserve.</p>$content$,
'Celebration Ideas',
ARRAY['send forth','farewell','Nigeria','colleague','NYSC'],
'published', false, 'Thankeeu Team', 6, now(),
'Send-Forth Messages for a Colleague in Nigeria — What to Write (Examples)',
'Nigerian send-forth messages for colleagues, bosses, corps members and friends relocating abroad — plus the stress-free way to organise the group card and contribution money.'
);

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'How to Collect Contribution Money for a Colleague''s Gift in Nigeria (Without Chasing Anyone)',
'collect-contribution-money-colleague-gift-nigeria',
'Collecting money for an office gift in Nigeria usually means chasing transfers for days. Here is how teams now collect contributions in one link — transparently, securely, in Naira.',
$content$<h2>The contribution wahala every Nigerian office knows</h2>
<p>A colleague's birthday, wedding or send-forth is coming up. Someone announces a contribution on the group chat: "We're doing ₦2,000 each for Chidinma's gift, send to my account." Then the real work begins — screenshots as proof of payment, "I'll send it on Friday," people who never pay but still sign the card, and one exhausted organiser reconciling transfers at midnight.</p>
<p>It's not that people don't want to give. The <em>process</em> is broken.</p>

<h2>What a broken contribution process costs</h2>
<ul>
<li><strong>The organiser's peace of mind</strong> — tracking who has paid across bank alerts and chat screenshots.</li>
<li><strong>Trust</strong> — when money passes through one person's account, questions linger even among friends.</li>
<li><strong>Participation</strong> — remote staff and people in other branches simply get left out.</li>
<li><strong>The moment itself</strong> — the gift is late, or smaller than planned, because collections dragged.</li>
</ul>

<h2>The one-link method Nigerian teams now use</h2>
<p>Here's the modern version: instead of collecting into a personal account, you create a <a href="/online-group-cards-nigeria">group card with a built-in gift pool</a>. It works like this:</p>
<ol>
<li><strong>Create the card</strong> for the occasion — birthday, wedding, send-forth — in about two minutes.</li>
<li><strong>Share one link</strong> on the office WhatsApp group.</li>
<li><strong>Everyone signs and contributes at once</strong> — they add their message, then chip in whatever amount they choose by card, bank transfer or USSD via Flutterwave. No fixed amount pressure, no screenshots needed.</li>
<li><strong>Everything is visible and secure</strong> — contributions pool transparently on the card, not in someone's personal account.</li>
<li><strong>The recipient (or organiser) withdraws</strong> the pooled gift directly to any Nigerian bank account.</li>
</ol>

<h2>Why this beats "send to my account"</h2>
<p>Nobody chases anybody. The colleague in the Abuja branch and the teammate on leave participate the same way as everyone in the office. The recipient gets a beautiful card full of messages <em>and</em> a gift — instead of a rushed cash envelope. And the organiser's only job is sharing a link.</p>
<p><a href="/card/new">Create your first group card and gift pool free</a> — and never write "please those who haven't paid should pay" on a group chat again.</p>$content$,
'How-To Guides',
ARRAY['contribution','group gift','Nigeria','collect money','office'],
'published', false, 'Thankeeu Team', 5, now(),
'How to Collect Contribution Money for a Colleague''s Gift in Nigeria',
'Stop chasing transfers for office gifts. How Nigerian teams collect contribution money with one link — transparent, secure Flutterwave payments, withdrawable to any Nigerian bank.'
);

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'Wedding Wishes and Prayers for a Nigerian Couple (What to Write in Their Card)',
'wedding-wishes-prayers-nigerian-couple-card',
'The right words for a Nigerian wedding — heartfelt wishes, prayers, and messages for colleagues, friends and family tying the knot. Plus how the whole group can celebrate them in one card.',
$content$<h2>What to write when a Nigerian couple weds</h2>
<p>Nigerian weddings are community events — and so are the messages. Whether it's your colleague's traditional wedding in Enugu or a friend's white wedding in Lagos, the best messages combine joy, prayer and a wish for the home they're building.</p>

<h2>Wedding wishes for a colleague</h2>
<ul>
<li>Congratulations! May your home be filled with laughter, peace and everything money cannot buy — plus the ones it can. Happy married life!</li>
<li>Watching you plan this wedding between deadlines was inspiring. Now go and enjoy it! Wishing you a beautiful marriage.</li>
<li>Happy married life! May your love grow sweeter every year, and may your home know no lack.</li>
</ul>

<h2>Wedding prayers</h2>
<ul>
<li>May the God who joined you keep you. May your home stand strong through every season, and may joy never depart from your household. Amen.</li>
<li>May your union be fruitful in every sense — love, peace, children as God wills, and prosperity. Happy married life!</li>
<li>As you begin this journey, may you always find your way back to each other in every disagreement, and may your love outlast every storm.</li>
</ul>

<h2>Light-hearted wishes (for close friends)</h2>
<ul>
<li>Finally! We can rest from your wedding planning gist. 😄 Wishing you a lifetime of love — and may your spouse always agree that jollof is best slightly burnt.</li>
<li>Happy married life! May your Wi-Fi be strong and your love stronger.</li>
</ul>

<h2>Celebrate them as a group — colleagues, friends and family together</h2>
<p>Here's what usually happens: the office does a card, the friends do a group chat, the family does their own thing — and the couple's memories end up scattered everywhere.</p>
<p>A <a href="/occasions/wedding">group wedding card</a> brings everyone into one place. Share a single link across every circle — office, friends, church, family at home and abroad — and each person adds their wish, prayer, photo or voice note. Everyone can also chip into a pooled Naira wedding gift via Flutterwave, which the couple withdraws to their bank. One card, every voice, kept forever. <a href="/card/new">Create theirs in two minutes</a>.</p>$content$,
'Celebration Ideas',
ARRAY['wedding wishes','Nigeria','prayers','couple','marriage'],
'published', false, 'Thankeeu Team', 5, now(),
'Wedding Wishes and Prayers for a Nigerian Couple — What to Write',
'Heartfelt Nigerian wedding wishes and prayers for colleagues, friends and family — plus how everyone (office, friends, family abroad) celebrates the couple in one group card.'
);

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'How to Surprise Someone on Their Birthday in Nigeria (10 Ideas That Actually Work)',
'how-to-surprise-someone-birthday-nigeria-ideas',
'Beyond cake and a WhatsApp status — 10 birthday surprise ideas for Nigeria that actually make people feel celebrated, from midnight cards to voice notes from everyone they love.',
$content$<h2>Why most birthday "surprises" fall flat</h2>
<p>A WhatsApp status post at 9am. A cake at the office at 4pm. Nice — but predictable. The surprises people remember are the ones that show <em>coordination</em>: proof that someone gathered other people, planned ahead, and made the day about them.</p>

<h2>10 birthday surprise ideas that work in Nigeria</h2>
<ol>
<li><strong>The midnight card drop.</strong> A group card from everyone they love, scheduled to land at exactly 12:00am. They wake up (or stay up) to dozens of messages, photos and prayers at once. This one consistently produces tears.</li>
<li><strong>Voice notes from everyone.</strong> Coordinate friends and family — including the ones abroad — to each record a short voice message. Hearing twenty familiar voices in a row is overwhelming in the best way.</li>
<li><strong>The surprise contribution.</strong> Quietly pool money from friends and colleagues, then present one significant gift instead of ten small ones.</li>
<li><strong>Breakfast delivery to their office or home.</strong> Small chops or their favourite meal arriving before they've even said "it's my birthday o."</li>
<li><strong>The throwback photo bomb.</strong> Get everyone to add old photos of the celebrant to one card — secondary school, NYSC, old work era. Guaranteed laughter.</li>
<li><strong>A prayer chain.</strong> For celebrants who value it deeply: a card where every message is a prayer for their new year, from family and church members.</li>
<li><strong>Decorate their workspace.</strong> Classic, cheap, effective — balloons on the desk before they arrive.</li>
<li><strong>The diaspora ambush.</strong> Rope in the siblings and friends abroad who "never remember" — a card link means distance is no excuse.</li>
<li><strong>Dinner where everyone shows up.</strong> Tell them it's just two of you. It is not just two of you.</li>
<li><strong>The year-in-review message.</strong> One long, thoughtful message recounting their wins from the past year. Costs nothing; means everything.</li>
</ol>

<h2>The tool that makes ideas 1, 2, 3, 5, 6 and 8 easy</h2>
<p>Half the ideas above need one thing: a way for many people to secretly contribute messages, photos, voice notes and money to a single surprise. That's exactly what a <a href="/occasions/birthday">Thankeeu group birthday card</a> is built for. Create it in two minutes, share one link privately with everyone <em>except</em> the celebrant, and schedule delivery for midnight on the day. Contributors can add a pooled Naira gift via Flutterwave while they sign. <a href="/card/new">Start the surprise now</a> — the midnight reaction is worth it.</p>$content$,
'Celebration Ideas',
ARRAY['birthday surprise','Nigeria','ideas','midnight','celebration'],
'published', false, 'Thankeeu Team', 6, now(),
'How to Surprise Someone on Their Birthday in Nigeria — 10 Ideas That Work',
'10 birthday surprise ideas for Nigeria that actually make people feel celebrated — midnight group cards, voice notes from everyone, surprise contributions and more.'
);
