-- ============================================================================
-- seed_blog_pet_loss.sql
-- 3 pet-loss posts that feed the /cards/pet-loss-card funnel and capture the
-- long-tail searches around pet bereavement:
--   1. what to write in a pet sympathy card
--   2. the Rainbow Bridge poem — meaning, full text note, and how to use it
--   3. how to memorialise a pet — lasting ways to remember them
-- Every post links to /cards/pet-loss-card. Tags include pet/dog/cat/rainbow
-- bridge so the BlogPost CTA auto-routes readers to the pet memorial card page.
-- IDEMPOTENT: ON CONFLICT (slug) DO NOTHING
-- ============================================================================

-- ── 1. What to write in a pet sympathy card ─────────────────────────────────
INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'What to Write in a Pet Sympathy Card — 45 Heartfelt Messages',
'what-to-write-pet-sympathy-card',
'Losing a pet is real grief. Here are 45 genuine things to write in a pet sympathy card for the loss of a dog, cat, bird or any beloved companion — plus what to avoid.',
$content$<h2>Pet loss deserves real words</h2>
<p>When someone loses a pet, they lose a member of the family — the wag at the door, the purr on the lap, the little companion who was always there. Yet pet grief is so often met with an awkward silence or a dismissive "it was just a dog". A thoughtful message tells the grieving owner that their loss is real and that their companion mattered. Below are 45 genuine messages you can write, adapt, or use as a starting point for your own.</p>

<h2>Short pet sympathy messages</h2>
<ul>
<li>So sorry for the loss of {pet}. They were so loved.</li>
<li>Thinking of you as you grieve your sweet {pet}.</li>
<li>{pet} was lucky to have you, and you were lucky to have them.</li>
<li>No more pain, just peace. Run free, {pet}.</li>
<li>Sending love while you miss your best friend.</li>
<li>Their pawprints will stay on your heart forever.</li>
</ul>

<h2>Heartfelt messages for the loss of a dog</h2>
<ul>
<li>{pet} greeted every day — and every one of us — with pure joy. What a gift that was.</li>
<li>A loyal friend like {pet} is never really gone. They stay in every happy memory.</li>
<li>The house feels quiet without those paws on the floor. I'm so sorry.</li>
<li>{pet} loved you completely, exactly as you were. That love doesn't end.</li>
</ul>

<h2>Heartfelt messages for the loss of a cat</h2>
<ul>
<li>{pet} chose you, and that's the highest compliment a cat can pay. So sorry for your loss.</li>
<li>The sunny windowsill will miss them too. Thinking of you.</li>
<li>Years of quiet company and warm purrs — {pet} gave you so much.</li>
</ul>

<h2>Rainbow Bridge messages</h2>
<ul>
<li>Run free, sweet {pet} — until you meet again at the Rainbow Bridge.</li>
<li>They're waiting for you, warm and whole again, on the other side of the bridge.</li>
<li>Until the day you're together again, may the memories keep you company.</li>
</ul>

<h2>What to avoid</h2>
<p>Skip anything that minimises the loss — "at least it was quick", "you can always get another", or "it was just a pet". Avoid telling them how to feel or how long to grieve. And unless you know they want it, hold back on "everything happens for a reason". Simple and sincere always wins.</p>

<h2>Let everyone sign one card</h2>
<p>One of the kindest things you can do is gather everyone who loved the pet into a single message. A <a href="/cards/pet-loss-card">group pet memorial card</a> lets family, friends and fellow pet lovers each add their own message, a favourite photo, or a voice note — from one link, no account needed. Every memory is kept together forever, and it becomes a keepsake the owner can return to on hard days.</p>

<p><a href="/cards/pet-loss-card">Create a pet memorial card everyone can sign →</a></p>
$content$,
'Celebration Ideas',
ARRAY['pet loss','pet sympathy','dog','cat','rainbow bridge','condolence','what to write'],
'published', false, 'Thankeeu Team', 6, now(),
'What to Write in a Pet Sympathy Card — 45 Heartfelt Messages | Thankeeu',
'45 genuine things to write in a pet sympathy card for the loss of a dog, cat, bird or beloved pet — short, heartfelt and Rainbow Bridge messages, plus what to avoid.'
) ON CONFLICT (slug) DO NOTHING;

-- ── 2. The Rainbow Bridge poem — meaning & how to use it ─────────────────────
INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'The Rainbow Bridge Poem — Meaning, Origin & How to Use It for a Pet',
'rainbow-bridge-poem-meaning',
'What the Rainbow Bridge poem means, where it came from, and gentle ways to use its message when a beloved pet passes — including in a group pet memorial card.',
$content$<h2>What is the Rainbow Bridge?</h2>
<p>The Rainbow Bridge is a comforting idea from a prose poem written in the 1980s, describing a beautiful meadow just this side of heaven where pets who have died run and play, healthy and happy again. The poem says that when their owner finally passes, the pet who loved them races across the meadow to be reunited, and together they cross the bridge. For millions of grieving pet owners, it has become the single most comforting image of loss.</p>

<h2>Why it resonates so deeply</h2>
<p>Grief for a pet is often disenfranchised — society doesn't always give it the space it deserves. The Rainbow Bridge does something simple and powerful: it says the bond didn't end, and the goodbye isn't forever. It reframes death as a pause in a relationship rather than the end of one. That's why it appears on so many pet sympathy cards, memorials and keepsakes.</p>

<h2>Gentle ways to use the Rainbow Bridge message</h2>
<ul>
<li><strong>In a sympathy message:</strong> "Run free, sweet {pet} — until you meet again at the Rainbow Bridge."</li>
<li><strong>On a memorial:</strong> pair the pet's name and dates with a short line about the bridge.</li>
<li><strong>In a keepsake:</strong> a photo of the pet with a single line of the poem underneath.</li>
<li><strong>As a shared tribute:</strong> invite everyone who loved the pet to add a memory alongside the Rainbow Bridge theme.</li>
</ul>

<h2>A note on the poem's text</h2>
<p>The Rainbow Bridge prose poem is widely shared, but its wording is still associated with its author, so we won't reproduce it in full here. You'll find the complete text easily, and it's lovely read aloud. What matters most is the feeling behind it — hope, reunion, and a love that outlasts the goodbye.</p>

<h2>Bring everyone together for the goodbye</h2>
<p>If you want to do more than send a single card, a <a href="/cards/pet-loss-card">group pet memorial card</a> lets the whole family and every friend who loved the pet contribute a message, a photo or a voice note in one place. Many of the cover designs carry that same soft, hopeful Rainbow Bridge feeling — and the finished memorial stays online forever.</p>

<p><a href="/cards/pet-loss-card">Create a Rainbow Bridge pet memorial card →</a></p>
$content$,
'Celebration Ideas',
ARRAY['rainbow bridge','pet loss','pet memorial','dog','cat','grief'],
'published', false, 'Thankeeu Team', 5, now(),
'The Rainbow Bridge Poem — Meaning, Origin & How to Use It | Thankeeu',
'What the Rainbow Bridge poem means and where it came from, plus gentle ways to use it when a beloved pet passes — including a group pet memorial card everyone can sign.'
) ON CONFLICT (slug) DO NOTHING;

-- ── 3. How to memorialise a pet ─────────────────────────────────────────────
INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES (
'How to Memorialise a Pet — 12 Lasting Ways to Remember Them',
'how-to-memorialise-a-pet',
'Twelve heartfelt, lasting ways to memorialise a beloved dog, cat or pet — from paw-print keepsakes to a shared online memorial everyone can add to.',
$content$<h2>Grief needs somewhere to go</h2>
<p>After a pet dies, one of the hardest things is the sudden emptiness — the lead by the door, the empty bowl, the quiet. Creating a memorial gives your grief somewhere to go and gives the love somewhere to live. Here are twelve lasting ways to remember a beloved companion.</p>

<h2>12 ways to remember a beloved pet</h2>
<ul>
<li><strong>A shared online memorial.</strong> Invite everyone who knew them to add a message, photo or voice note in one place — kept forever.</li>
<li><strong>A paw-print keepsake.</strong> Clay impressions or ink prints make a simple, powerful memento.</li>
<li><strong>A memory box.</strong> Their collar, tag, a favourite toy, a tuft of fur, a photo.</li>
<li><strong>A photo book.</strong> Their whole life, from first day to last, in one album.</li>
<li><strong>A tree or plant.</strong> Plant something in their memory and watch it grow each year.</li>
<li><strong>A donation in their name.</strong> To a shelter or rescue — turning loss into help for another animal.</li>
<li><strong>Custom jewellery.</strong> A pendant with their name, or even a little of their ashes.</li>
<li><strong>A framed portrait.</strong> Commission an illustration or print a favourite photo.</li>
<li><strong>A memorial stone.</strong> For the garden, marking a special spot.</li>
<li><strong>A candle ritual.</strong> Light a candle on their birthday or the anniversary.</li>
<li><strong>A Memory Movie.</strong> Turn all their photos and videos into one keepsake film.</li>
<li><strong>Their name, written down.</strong> Sometimes simply gathering everyone's memories in writing is the most healing act of all.</li>
</ul>

<h2>Let the memories come from everyone</h2>
<p>A pet is loved by more than one person — family, friends, neighbours, the dog-walker, the whole household. A <a href="/cards/pet-loss-card">group pet memorial card</a> brings all those voices into a single tribute: everyone adds their favourite memory, a photo from a walk, or a voice note, from one link with no account needed. It automatically becomes a keepsake Memory Movie, and it stays online forever — a place to return to whenever you miss them.</p>

<p><a href="/cards/pet-loss-card">Create a lasting pet memorial everyone can add to →</a></p>
$content$,
'Celebration Ideas',
ARRAY['pet memorial','pet loss','dog','cat','memorialise pet','keepsake','grief'],
'published', false, 'Thankeeu Team', 6, now(),
'How to Memorialise a Pet — 12 Lasting Ways to Remember Them | Thankeeu',
'Twelve heartfelt ways to memorialise a beloved dog, cat or pet — from paw-print keepsakes and memorial trees to a shared online pet memorial everyone can add to.'
) ON CONFLICT (slug) DO NOTHING;
