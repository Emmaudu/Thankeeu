-- High-intent SEO blog post: "what to write in a leaving card" is one of
-- the most searched pre-purchase queries for this category. Thankbox's
-- equivalent post is one of their top-traffic pages. This captures the
-- same intent and funnels to card creation.
--
-- Run once against the production Supabase database.

INSERT INTO blog_posts (
  slug, title, excerpt, content, category, tags,
  cover_image, cover_alt, read_time, featured,
  meta_title, meta_description, status, published_at
) VALUES (
  'what-to-write-in-a-leaving-card',
  '50 Leaving Card Messages for Colleagues, Bosses & Friends',
  'Stuck on what to write in a leaving card? Here are 50 genuine, ready-to-use farewell messages for any colleague — whether they''re moving to a new job, retiring, or heading off on an adventure.',
  '<article>
<h1>50 Leaving Card Messages for Colleagues, Bosses &amp; Friends</h1>

<p>Someone''s leaving. Friday is their last day. You''ve got a group card link open in your browser and a blinking cursor in an empty message box. Sound familiar?</p>

<p>The good news: a leaving card message doesn''t have to be long. It just has to feel genuine. Here are 50 messages you can use, adapt, or treat as a starting point — organised by tone and relationship so you can find the right one fast.</p>

<hr/>

<h2>Warm &amp; Sincere (colleagues you''ll genuinely miss)</h2>

<p>These work for anyone you''ve worked closely with and want to send off properly.</p>

<ol>
<li>"Working alongside you has been one of the highlights of this job. Wishing you everything you deserve at the next place — which is a lot."</li>
<li>"You made this office a better place to be. That''s not nothing. Good luck with everything that''s coming."</li>
<li>"I''ve learned more from watching how you work than from most training I''ve done. Thank you for that, and good luck."</li>
<li>"It''s going to be strange here without you. In the best possible way — because you made such a mark. All the best."</li>
<li>"You''ve always shown up fully, for the team and for the work. Whoever gets you next is very lucky."</li>
<li>"Thank you for being the kind of colleague who made Monday mornings easier. You''ll be genuinely missed."</li>
<li>"Watching you grow here has been a privilege. I can''t wait to see what you do next."</li>
<li>"You gave this place more than it probably deserved. Now go somewhere that deserves you."</li>
</ol>

<h2>For a Boss or Manager</h2>

<p>Leaving messages for managers can feel tricky. These keep it genuine without being sycophantic.</p>

<ol start="9">
<li>"You''ve been the kind of manager people talk about years later. Thank you for everything you invested in this team."</li>
<li>"Working for you taught me what good leadership actually looks like. That''s a gift I''ll carry forward."</li>
<li>"You created a team where people felt safe to try things and safe to fail. That''s rare. Thank you."</li>
<li>"You always made time when it mattered. That doesn''t go unnoticed. Wishing you the very best."</li>
<li>"Thank you for believing in me before I believed in myself. I won''t forget it."</li>
<li>"You made this team better, and you made the people in it better. That''s a legacy worth having."</li>
</ol>

<h2>Short &amp; Simple (when you don''t know them well)</h2>

<p>Not every leaver needs an essay. These are honest and warm without overstating the relationship.</p>

<ol start="15">
<li>"Wishing you all the best in your next chapter. It''s been great working with you."</li>
<li>"Good luck with the new role — they''re getting someone brilliant."</li>
<li>"Congratulations on the next step. Hope it''s everything you''re looking for."</li>
<li>"It''s been a pleasure. Wishing you every success."</li>
<li>"Best of luck in whatever comes next. You''ve earned it."</li>
<li>"Safe travels on the next adventure. Hope it''s a good one."</li>
</ol>

<h2>Funny &amp; Light (for close colleagues)</h2>

<p>Only use these if you actually have that kind of relationship. Forced humour in a leaving card lands badly.</p>

<ol start="21">
<li>"We''re not saying we''re replacing you with someone less brilliant, but the bar has been set extremely high. No pressure to the next person."</li>
<li>"Finally free from the 9am stand-ups. We''re jealous, honestly."</li>
<li>"You''re the only person who made our team meetings worth attending. This is a disaster."</li>
<li>"I''m not crying, you''re crying. (We''re both crying.)"</li>
<li>"Contractually required to say we''ll miss you. But also we actually will miss you, which is worse."</li>
<li>"Leaving without taking me with you? Bold move."</li>
<li>"The plants are already drooping. I think they know."</li>
<li>"Please take the printer with you. It only behaved for you anyway."</li>
</ol>

<h2>For Retirement</h2>

<p>Retirement messages need a slightly different tone — celebratory, honouring the full career, not just the recent job.</p>

<ol start="29">
<li>"After everything you''ve given over the years, it''s finally your turn. Enjoy every second of it."</li>
<li>"A career spent doing good work and being a good person. Now go and have the rest you''ve more than earned."</li>
<li>"Retirement isn''t the end — it''s the first day of everything else. Enjoy it."</li>
<li>"Thank you for decades of showing up. This team is better for it. Now relax."</li>
<li>"You''ve left a mark on this place that won''t fade. Wishing you a retirement as good as the career that earned it."</li>
<li>"Here''s to long mornings, slow coffees, and not a single meeting. You''ve earned every bit of it."</li>
</ol>

<h2>For Someone Moving Abroad or to a New City</h2>

<ol start="35">
<li>"Going somewhere new takes courage. You''ve always had that. Go show them what you''re made of."</li>
<li>"New city, new chapter, same brilliant person. Lucky them."</li>
<li>"The distance is annoying but the opportunity is worth it. Rooting for you from here."</li>
<li>"Adventure suits you. Go find the best version of it."</li>
</ol>

<h2>When Someone''s Leaving for a Dream Job</h2>

<ol start="39">
<li>"This is exactly what you''ve been working toward. Go get it."</li>
<li>"Nobody deserves this more. Congratulations and goodbye — in the best possible way."</li>
<li>"The right door opened and you walked through it. That takes guts. Well done."</li>
<li>"We''re losing a great colleague but a great career is gaining momentum. Proud of you."</li>
</ol>

<h2>Adding a Personal Touch</h2>

<p>The messages above are starting points. What makes a leaving card message genuinely memorable is one specific detail — something only you would know:</p>

<ul>
<li>A specific moment you shared ("I still think about the time you stayed late to help me finish that report before the board meeting.")</li>
<li>Something they always did that the team noticed ("You were always the first to celebrate other people''s wins.")</li>
<li>An honest observation about how they made things better ("The team dynamic changed when you joined. In the best way.")</li>
</ul>

<p>A sentence like that, added to any of the messages above, turns a good leaving card message into one the recipient will actually remember.</p>

<hr/>

<h2>Create the Group Card</h2>

<p>The best leaving card messages end up in a card everyone contributes to — not a solo WhatsApp message. With Thankeeu, you share one link and the whole team adds their message, a photo, or even a voice note. Optional leaving gift collection built in.</p>

<p>Takes about 2 minutes to set up. Free to create.</p>

</article>',
  'Leaving Cards',
  ARRAY['leaving card', 'farewell card', 'what to write in a leaving card', 'leaving card messages', 'group card', 'colleague goodbye'],
  'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1200&q=80',
  'Colleagues gathering around a laptop to sign an online leaving card',
  7,
  false,
  '50 Leaving Card Messages for Colleagues, Bosses & Friends | Thankeeu',
  'Stuck on what to write in a leaving card? 50 genuine, ready-to-use farewell messages for colleagues, bosses and friends — organised by tone and relationship.',
  'published',
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title       = EXCLUDED.title,
  excerpt     = EXCLUDED.excerpt,
  content     = EXCLUDED.content,
  status      = EXCLUDED.status,
  meta_title  = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  updated_at  = NOW();
