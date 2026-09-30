-- SEO query-gap fix, based on real Google Search Console "Performance on Search"
-- data exported 2026-07-27. These three posts already rank (positions 14-95)
-- and already receive impressions for the target queries below, but the
-- on-page phrasing doesn't closely match what people are actually typing.
-- This migration APPENDS new sections (FAQ-style, no landing pages, no
-- pop-ups/pills) that use the exact query phrasing verbatim, so existing
-- copy, slugs and URLs are untouched.
--
-- Target queries addressed (from Queries.csv, all currently 0 clicks):
--   things to write in a sympathy card        (9 impr, pos 14.33)
--   what to write on sympathy card             (3 impr, pos 78)
--   what can i say on a sympathy card          (2 impr, pos 39.5)
--   what to say in sympathy card               (2 impr, pos 83)
--   sympathy messages for loss of husband      (4 impr, pos 73.75)
--   words of sympathy for loss of husband      (3 impr, pos 74)
--   condolences for/loss of husband            (2 impr each, pos 65.5-89)
--   words of sympathy for loss of husband and father (2 impr, pos 83.5)
--   pet sympathy message / sympathy card messages for pets /
--   pet condolence message(s) / loss of pet message   (2 impr each, pos 81-95)

-- ── 1. what-to-write-sympathy-card-messages ──────────────────────────────────
-- Adds an FAQ block using the exact phrasing Google shows impressions for
-- but the page doesn't yet contain verbatim.
update blog_posts
set
  content = content || $extra$

<h2>Frequently asked questions</h2>

<h3>What are some things to write in a sympathy card?</h3>
<p>Keep it simple and sincere: acknowledge the loss by name if you can, say something true about the person who died or about the relationship, and offer a specific form of support rather than a vague one. "I am so sorry for the loss of [name]. I will call you Thursday" says more than a generic line ever will. See the message sets above for ready-to-use examples across different relationships.</p>

<h3>What do you write on a sympathy card if you don't know what to say?</h3>
<p>You don't need to say something profound. A short, honest line is enough: "I don't have the right words, but I am thinking of you" or "I am so sorry for your loss. Please know you are not alone." The short messages section above has several more options for exactly this situation.</p>

<h3>What can I say on a sympathy card for a coworker?</h3>
<p>Keep it warm but appropriately professional — acknowledge the loss, offer support, and avoid assuming a level of closeness you don't have. "I was so sorry to hear about your loss. Thinking of you and here if you need anything" works well for a colleague you're not deeply close to.</p>
$extra$,
  updated_at = now()
where slug = 'what-to-write-sympathy-card-messages';

-- ── 2. condolence-messages-loss-of-pet ────────────────────────────────────────
-- The existing post uses "condolence" throughout; adds a "sympathy"-phrased
-- FAQ section since several real queries specifically use that word.
update blog_posts
set
  content = content || $extra$

<h2>Frequently asked questions</h2>

<h3>What is a good pet sympathy message?</h3>
<p>A good pet sympathy message names the animal if you know its name, avoids minimising the loss ("it was just a pet"), and says something true about what that pet meant. "I am so sorry about [name]. They were loved and that mattered" is short, genuine, and works for almost any pet.</p>

<h3>What do you write in a sympathy card for the loss of a pet?</h3>
<p>Treat it with the same seriousness you would any other loss. Acknowledge the grief directly, avoid comparing it to a "smaller" loss, and if appropriate, mention a specific memory or quality of the animal. See the dog, cat and general messages above for examples you can use directly or adapt.</p>

<h3>What is a short pet condolence message?</h3>
<p>"I am so sorry for your loss. They were loved and they knew it" or "Sending love — the house will feel different for a while, and that's the measure of how much they mattered" both work well when you want something brief but genuine.</p>
$extra$,
  updated_at = now()
where slug = 'condolence-messages-loss-of-pet';

-- ── 3. condolence-messages-loss-of-spouse ────────────────────────────────────
-- Adds a husband-specific section: 5+ distinct real queries are specifically
-- about losing a husband, but the existing content is gender-neutral
-- "spouse/partner" throughout, which matches those queries weakly.
update blog_posts
set
  content = content || $extra$

<h2>Sympathy messages for the loss of a husband</h2>
<p>These queries come up often enough that they deserve their own space: losing a husband is its own specific grief, and messages that name that directly tend to land better than gender-neutral ones.</p>
<ul>
<li>I am so deeply sorry for the loss of your husband. He was a wonderful man, and the love between you was plain to see. Sending you strength and comfort.</li>
<li>Words of sympathy feel small next to a loss like this, but please know I am thinking of you and your family constantly. Your husband's memory will live on in the life you built together.</li>
<li>There are no words adequate for losing your husband. I am so sorry. Please lean on the people who love you — you don't have to carry this alone.</li>
<li>My deepest condolences on the loss of your husband and the father of your children. May you find comfort in the memories and the love that remains.</li>
<li>I am so sorry for your loss. Your husband spoke of you with such love, and it was clear how much you meant to each other. Thinking of you and your family in this difficult time.</li>
</ul>

<h2>Frequently asked questions</h2>

<h3>What are some words of sympathy for the loss of a husband?</h3>
<p>Focus on acknowledging the specific relationship rather than using generic "spouse" language, offer genuine comfort rather than explanation, and where appropriate, a note about ongoing support. See the messages above for ready examples.</p>

<h3>What do you say for condolences for the loss of a husband and father?</h3>
<p>Acknowledge both roles if the person had children — "the loss of your husband and the father of your children" — since that recognises the full scope of what the family has lost, not just the marital loss.</p>
$extra$,
  updated_at = now()
where slug = 'condolence-messages-loss-of-spouse';
