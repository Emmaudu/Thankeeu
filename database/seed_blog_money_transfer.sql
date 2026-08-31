-- seed_blog_money_transfer.sql
-- 5 SEO/GEO blog posts around sending money inside a greeting card.
-- Format matches seed_blog_geo_comparison.sql: dollar-quoted HTML content,
-- direct-answer opening H2 for GEO (AI answer engines), tables, FAQs.
-- Run in Supabase SQL editor. Safe to re-run: ON CONFLICT (slug) DO NOTHING.

INSERT INTO blog_posts (title,slug,excerpt,content,category,tags,status,is_featured,author_name,read_time,published_at,meta_title,meta_description)
VALUES

-- ─────────────────────────────────────────────────────────────────────────────
-- POST 1 — cornerstone / money in a greeting card
(
'How to Send Money in a Greeting Card Online (2026 Guide)',
'send-money-in-a-greeting-card',
'You can now send real money tucked inside a personalised online greeting card. The recipient opens a 3D card, reads your message, then withdraws the money to their bank or as a gift card. Here is how it works.',
$content$<h2>Can you send money inside a greeting card online?</h2>
<p>Yes. With <strong>Thankeeu</strong>, you can send real money tucked inside a personalised digital greeting card. You choose a design, write your message, add any amount of money through Flutterwave, and send the card to your recipient by email. They open a 3D flip card, read your message, then withdraw the money — either straight to their bank account or as a gift card.</p>

<p>It turns an ordinary money transfer into something the person actually opens and remembers, rather than a cold line in their bank statement.</p>

<h2>How sending money in a greeting card works, step by step</h2>
<ol>
<li><strong>Pick a card design.</strong> Choose a cover that suits the occasion — birthday, thank you, congratulations, or just because.</li>
<li><strong>Add the details.</strong> Enter who it is for and the email address where the card should land.</li>
<li><strong>Write your message.</strong> Say what you actually mean. Add photos if you want to.</li>
<li><strong>Add the money.</strong> Tuck any amount into the card securely through Flutterwave during creation.</li>
<li><strong>Send it.</strong> Your recipient gets an email, flips through the card, reads your message, and withdraws the money.</li>
</ol>

<h2>How does the recipient get the money?</h2>
<p>The recipient opens the card from the email you sent it to. To withdraw, they sign up using that <strong>same email address</strong> — this keeps the money secure, because only the person who received the card can claim it. They then choose how to receive it:</p>
<ul>
<li><strong>Bank transfer</strong> — the money lands directly in their bank account, powered by Flutterwave.</li>
<li><strong>Gift card</strong> — they can instead claim a gift card across shopping, food and flowers, available in Nigeria, the UK and the US.</li>
</ul>

<h2>Why send money in a card instead of a plain transfer?</h2>
<table>
<tr><th>A normal bank transfer</th><th>Money inside a Thankeeu card</th></tr>
<tr><td>A reference line nobody reads</td><td>A written message they keep</td></tr>
<tr><td>Feels like a transaction</td><td>Feels like a gift</td></tr>
<tr><td>Money only</td><td>Message, photos, 3D card and money together</td></tr>
<tr><td>Recipient needs your app</td><td>Recipient just opens an email</td></tr>
</table>

<h2>What does it cost to send money in a greeting card?</h2>
<p>Creating and personalising the card is free. A small one-time fee applies only when you send, and the money you add travels to your recipient. There is no subscription.</p>

<h2>Frequently asked questions</h2>
<h3>Is it safe to send money in a greeting card?</h3>
<p>Yes. Money is collected securely through Flutterwave, and withdrawal is locked to the recipient email you addressed the card to. Only that person can claim the funds.</p>
<h3>Can the recipient choose cash or a gift card?</h3>
<p>Yes. When withdrawing, they choose a bank transfer or a gift card across several categories.</p>
<h3>Which countries does it work in?</h3>
<p>Senders and recipients are supported across Nigeria, the UK and the US, with bank withdrawal and gift-card options depending on the recipient's country.</p>

<p><a href="/send-money-greeting-card">Send money in a greeting card now →</a></p>$content$,
'Money Cards',
ARRAY['send money in a greeting card','money greeting card','send money online','digital money card'],
'published', TRUE, 'Thankeeu Team', 6, NOW(),
'How to Send Money in a Greeting Card Online (2026) | Thankeeu',
'Send real money inside a personalised online greeting card. Recipients open a 3D card, read your message, and withdraw to bank or gift card. Step-by-step guide.'
),

-- ─────────────────────────────────────────────────────────────────────────────
-- POST 2 — best way to send money to a loved one
(
'The Best Way to Send Money to a Loved One That Feels Personal',
'best-way-to-send-money-to-a-loved-one',
'Sending money to family or a friend does not have to feel cold. Here is how to send money in a way that carries a message, a memory and a moment — not just a bank reference.',
$content$<h2>What is the most personal way to send money to a loved one?</h2>
<p>The most personal way to send money to a loved one is inside a <strong>digital greeting card</strong>. Instead of a plain bank transfer, you send a designed card with your written message, photos and the money tucked inside. Your loved one opens it, reads your words, and then withdraws the money to their bank or as a gift card. It carries the emotion a transfer cannot.</p>

<h2>Why a normal transfer feels cold</h2>
<p>A bank transfer does one thing: it moves money. There is no message, no design, nothing to open. For a birthday, a thank you, a "thinking of you" moment, or supporting family from abroad, that emptiness is a missed opportunity. The money arrives, but the meaning does not travel with it.</p>

<h2>How to send money that actually feels like a gift</h2>
<ol>
<li>Choose a greeting card design for the occasion.</li>
<li>Write your message — the part that makes it personal.</li>
<li>Add the money securely during creation.</li>
<li>Send it to their email.</li>
<li>They open the card, read it, and withdraw the money.</li>
</ol>

<h2>Perfect moments to send money in a card</h2>
<ul>
<li><strong>Birthdays</strong> — when you cannot be there in person.</li>
<li><strong>Supporting family abroad</strong> — send love with the money, not just the money.</li>
<li><strong>Congratulations</strong> — a new job, graduation, new baby.</li>
<li><strong>Thank you</strong> — for someone who helped you.</li>
<li><strong>Just because</strong> — a small amount and a kind word can change a day.</li>
</ul>

<h2>Does the recipient need an account?</h2>
<p>They only sign up when they want to withdraw, using the same email the card was sent to. That keeps the money secure and means the person you sent it to is the only one who can claim it. They can then take it to their bank or as a gift card.</p>

<h2>How much does it cost?</h2>
<p>Making the card is free. A small one-time sending fee applies, and the money you add goes to your loved one. No subscription, no monthly fees.</p>

<p><a href="/send-money-greeting-card">Send money to someone you love →</a></p>$content$,
'Money Cards',
ARRAY['send money to a loved one','best way to send money','personal money gift','send money to family'],
'published', FALSE, 'Thankeeu Team', 5, NOW(),
'The Best Way to Send Money to a Loved One | Thankeeu',
'The most personal way to send money to family or a friend is inside a greeting card. Send a message, photos and money together. Here is how.'
),

-- ─────────────────────────────────────────────────────────────────────────────
-- POST 3 — money gift card vs bank transfer comparison (GEO magnet)
(
'Sending Money in a Card vs a Bank Transfer: Which Is Better?',
'money-card-vs-bank-transfer',
'A bank transfer moves money. A greeting card with money inside moves the person. Here is an honest comparison of both, and when each one makes sense.',
$content$<h2>Is it better to send money in a card or by bank transfer?</h2>
<p>For anything meant to feel like a gift — a birthday, a thank you, supporting a loved one — sending money inside a <strong>greeting card</strong> is better, because it carries a message, a design and a moment alongside the money. For a purely practical, same-day payment where emotion does not matter, a plain <strong>bank transfer</strong> is fine. The difference is whether you want the money to mean something or just arrive.</p>

<h2>Side-by-side comparison</h2>
<table>
<tr><th>Feature</th><th>Bank transfer</th><th>Money in a Thankeeu card</th></tr>
<tr><td>Moves real money</td><td>Yes</td><td>Yes</td></tr>
<tr><td>Carries a written message</td><td>No</td><td>Yes</td></tr>
<tr><td>Designed card the recipient opens</td><td>No</td><td>Yes — a 3D flip card</td></tr>
<tr><td>Photos included</td><td>No</td><td>Yes</td></tr>
<tr><td>Recipient chooses bank or gift card</td><td>Bank only</td><td>Bank or gift card</td></tr>
<tr><td>Feels like a gift</td><td>No</td><td>Yes</td></tr>
<tr><td>Best for</td><td>Practical payments</td><td>Meaningful moments</td></tr>
</table>

<h2>When a bank transfer is the right choice</h2>
<ul>
<li>Paying back a friend for lunch.</li>
<li>Settling a bill or an invoice.</li>
<li>Any moment where speed matters more than sentiment.</li>
</ul>

<h2>When money in a card is the right choice</h2>
<ul>
<li>Birthdays and celebrations.</li>
<li>Sending love and support to family, especially from abroad.</li>
<li>Saying thank you in a way the person remembers.</li>
<li>Congratulations for a milestone.</li>
</ul>

<h2>Can you do both — send money that feels personal but still lands in a bank?</h2>
<p>Yes, and that is the point of a money card. You get the warmth of a greeting card and the recipient still gets real money they can withdraw straight to their bank account. It is not either-or. The card is the wrapping; the bank withdrawal is the money actually arriving.</p>

<p><a href="/send-money-greeting-card">Try sending money in a card →</a></p>$content$,
'Money Cards',
ARRAY['money card vs bank transfer','send money online','gift money','money transfer alternative'],
'published', FALSE, 'Thankeeu Team', 5, NOW(),
'Money in a Card vs Bank Transfer: Which Is Better? | Thankeeu',
'An honest comparison of sending money inside a greeting card versus a plain bank transfer — and when each one makes sense.'
),

-- ─────────────────────────────────────────────────────────────────────────────
-- POST 4 — how to withdraw money from a greeting card (recipient intent)
(
'How to Withdraw Money From a Digital Greeting Card',
'how-to-withdraw-money-from-a-greeting-card',
'Received a greeting card with money inside? Here is exactly how to open it and withdraw the money to your bank account or claim it as a gift card.',
$content$<h2>How do you withdraw money from a greeting card you received?</h2>
<p>To withdraw money from a Thankeeu greeting card, open the card from the email it was sent to, then sign up using that <strong>same email address</strong>. Once signed in, choose to withdraw the money to your <strong>bank account</strong> or claim it as a <strong>gift card</strong>. The email match is a security step that ensures only you — the intended recipient — can claim the money.</p>

<h2>Step by step for recipients</h2>
<ol>
<li><strong>Open the email.</strong> You will receive an email letting you know someone sent you a card.</li>
<li><strong>Flip through the card.</strong> Read the message and enjoy the photos before anything else.</li>
<li><strong>Sign up with the same email.</strong> Use the exact email address the card was sent to — this proves the card is yours.</li>
<li><strong>Choose how to receive the money.</strong> Bank transfer, or a gift card across shopping, food and flowers.</li>
<li><strong>Confirm.</strong> For a bank withdrawal, enter your account details and the money is sent to you.</li>
</ol>

<h2>Why do I have to sign up to withdraw?</h2>
<p>Signing up with the same email the card was addressed to is a security measure. It guarantees that only the person the money was meant for can withdraw it — not anyone who might come across the link. It takes less than a minute.</p>

<h2>Can I take the money as a gift card instead of cash?</h2>
<p>Yes. When you withdraw, you can choose a gift card instead of a bank transfer. Gift-card options span categories like shopping, food and flowers, and are available in Nigeria, the UK and the US.</p>

<h2>What if the amount shows as already claimed?</h2>
<p>Each card's money can be withdrawn once. If it shows as claimed, it has already been withdrawn — either to a bank or as a gift card. If you believe this is a mistake, contact the sender or Thankeeu support.</p>

<h2>Is there a fee to withdraw?</h2>
<p>The money the sender added is what you receive. Any sending fee was already handled by the sender when they created the card.</p>

<p><a href="/send-money-greeting-card">Learn more about money cards →</a></p>$content$,
'Money Cards',
ARRAY['withdraw money from greeting card','claim money gift','how to withdraw gift money','greeting card money'],
'published', FALSE, 'Thankeeu Team', 4, NOW(),
'How to Withdraw Money From a Digital Greeting Card | Thankeeu',
'Received a card with money inside? Here is how to open it and withdraw the money to your bank account or claim it as a gift card.'
),

-- ─────────────────────────────────────────────────────────────────────────────
-- POST 5 — send money to Nigeria / diaspora angle (high-intent, competes w/ LemFi framing)
(
'Sending Money Home to Nigeria That Feels Like More Than Cash',
'send-money-home-nigeria-greeting-card',
'If you send money home to family in Nigeria, you can now send it inside a greeting card — with your message, your photos and the money together — instead of a cold transfer they forget by evening.',
$content$<h2>Can I send money to family in Nigeria inside a greeting card?</h2>
<p>Yes. If you support family in Nigeria from abroad, you can send the money inside a <strong>personalised greeting card</strong> instead of a plain transfer. You add your message, photos and the money, and your family opens a card they can actually keep. They then withdraw the money directly to their Nigerian bank account through Flutterwave, or claim it as a gift card.</p>

<h2>Why this matters for the diaspora</h2>
<p>Sending money home is an act of love, but a bank transfer strips the love out of it. Your parents, siblings or relatives see an amount land, and that is all. There is no "I am thinking of you," no photo of your kids, no words for the occasion. A money card puts the feeling back into the transfer — the money still arrives in their account, but wrapped in something personal.</p>

<h2>How it works for you and your family</h2>
<table>
<tr><th>Step</th><th>You (abroad)</th><th>Family (Nigeria)</th></tr>
<tr><td>1</td><td>Pick a card and write your message</td><td>—</td></tr>
<tr><td>2</td><td>Add the money and photos</td><td>—</td></tr>
<tr><td>3</td><td>Send to their email</td><td>Receive the card by email</td></tr>
<tr><td>4</td><td>—</td><td>Flip through, read your message</td></tr>
<tr><td>5</td><td>—</td><td>Withdraw to their bank or as a gift card</td></tr>
</table>

<h2>Occasions to send money home with a card</h2>
<ul>
<li><strong>Birthdays</strong> for parents and siblings you cannot be with.</li>
<li><strong>Festive seasons</strong> — Christmas, Eid, New Year.</li>
<li><strong>School fees or support</strong> — with an encouraging message attached.</li>
<li><strong>Just checking in</strong> — a small amount and warm words go a long way.</li>
</ul>

<h2>Does the money actually reach a Nigerian bank account?</h2>
<p>Yes. Withdrawal to Nigerian bank accounts is handled through Flutterwave, so the recipient receives real money in their account. The greeting card is the wrapping; the bank withdrawal is the money genuinely arriving.</p>

<h2>Is it secure?</h2>
<p>Yes. Only the person whose email the card was sent to can withdraw the money, after signing up with that same email. The funds are held securely until they claim them.</p>

<p><a href="/send-money-greeting-card">Send money home with a card →</a></p>$content$,
'Money Cards',
ARRAY['send money to Nigeria','send money home','diaspora money transfer','money card Nigeria'],
'published', FALSE, 'Thankeeu Team', 6, NOW(),
'Send Money Home to Nigeria Inside a Greeting Card | Thankeeu',
'Send money to family in Nigeria inside a personalised greeting card — your message, photos and money together. They withdraw to their bank or a gift card.'
)

ON CONFLICT (slug) DO NOTHING;
