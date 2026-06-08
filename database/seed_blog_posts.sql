-- Thankeeu Blog Posts Seed — safe SQL with dollar quoting
-- Run in Supabase SQL Editor

-- Clear existing posts first (comment out if you want to keep existing)
-- DELETE FROM blog_posts;

-- Post 1: Why Group Cards Beat Individual Cards Every Single
INSERT INTO blog_posts (
  title, slug, excerpt, content, category, tags, status,
  is_featured, author_name, read_time, published_at, meta_title, meta_description
) VALUES (
  'Why Group Cards Beat Individual Cards Every Single Time',
  'why-group-cards-beat-individual-cards',
  'One card with 40 heartfelt messages hits harder than 40 separate cards. The psychology behind why group gifts create stronger emotional memories.',
  $content$<h2>The science of collective celebration</h2><p>Psychologists call it the <em>social proof of affection</em>. When 30 people sign a single birthday card, the recipient feels the weight of a community. Research on social bonding shows that collective acts of appreciation create stronger, longer-lasting emotional memories than individual gestures.</p><h2>What makes a group card so powerful</h2><p>It is the combination effect. When your colleague opens a Thankeeu card and reads 30 messages from teammates — some funny, some deeply personal, some with a photo from the team lunch three years ago — something clicks. They feel <strong>seen</strong>.</p><h2>The coordination problem Thankeeu solves</h2><p>Thankeeu turns a week of logistics into 2 minutes. Create a card, share a WhatsApp link, and every signee adds their own message, photo, or voice note directly. No carrying a card to every desk. No waiting for people to sign.</p>$content$,
  'Group Cards',
  ARRAY['group cards','birthday','office celebration','team appreciation'],
  'published',
  true,
  'Thankeeu Team',
  5,
  NOW() - INTERVAL '30 days',
  'Why Group Cards Are Better Than Individual Cards | Thankeeu',
  'One group card with 40 messages creates stronger emotional memories than 40 separate gifts. Discover the psychology and how to create a group card in 2 minutes.'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at;

-- Post 2: The Ultimate Guide to Office Birthday Celebrations
INSERT INTO blog_posts (
  title, slug, excerpt, content, category, tags, status,
  is_featured, author_name, read_time, published_at, meta_title, meta_description
) VALUES (
  'The Ultimate Guide to Office Birthday Celebrations',
  'ultimate-guide-office-birthday-celebrations',
  'Awkward office birthday sing-alongs are a thing of the past. This guide shows HR teams exactly how to celebrate birthdays employees actually remember.',
  $content$<h2>Why birthday recognition matters</h2><p>Gallup research consistently shows that employees who feel recognised are 3.7x more likely to be engaged at work. A birthday, handled well, is one of the most natural moments to deliver that recognition.</p><h2>The Thankeeu approach to office birthdays</h2><p>With Thankeeu for Teams, you upload your employee list once. The system reads each birthday from your HRIS and two days before each birthday automatically creates a group card and emails the entire department to sign it.</p><h2>What to say on a birthday card</h2><p>Be specific. Reference a shared memory, a running joke, or a project you worked on together. Generic messages feel generic. A specific memory says everything.</p><h2>The gift pot question</h2><p>Pooled birthday gifts remove the awkwardness of individual contributions. With Thankeeu, contributors chip in whatever they are comfortable with via Paystack and no one knows who gave what.</p>$content$,
  'Workplace Culture',
  ARRAY['office birthday','employee recognition','HR tips','company culture'],
  'published',
  false,
  'Thankeeu Team',
  5,
  NOW() - INTERVAL '27 days',
  'How to Celebrate Office Birthdays Properly | HR Guide | Thankeeu',
  'HR guide to meaningful employee birthday celebrations. Automate office birthdays and make them genuinely memorable.'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at;

-- Post 3: 7 Farewell Card Ideas That Will Make Your Colleagu
INSERT INTO blog_posts (
  title, slug, excerpt, content, category, tags, status,
  is_featured, author_name, read_time, published_at, meta_title, meta_description
) VALUES (
  '7 Farewell Card Ideas That Will Make Your Colleague Cry (the Good Kind)',
  'farewell-card-ideas-for-colleagues',
  'Sending off a beloved colleague deserves more than a rushed card. These 7 farewell card ideas create a memory they will still be talking about years later.',
  $content$<h2>1. The memory wall card</h2><p>Ask every signee to share their favourite memory with the person leaving. Specific memories are irreplaceable.</p><h2>2. The voice note card</h2><p>Thankeeu allows contributors to attach voice notes. There is nothing quite like opening a card and hearing your colleagues voices saying goodbye.</p><h2>3. The photo story card</h2><p>Ask team members to contribute their best photo with the person leaving. Team lunches, conference trips, desk selfies.</p><h2>4. The wisdom card</h2><p>Ask each person to write one piece of advice they want the person to carry into their next chapter.</p><h2>5. The prediction card</h2><p>Lighthearted predictions are always a hit. Funny, warm, and strangely touching.</p><h2>6. The gift pot card</h2><p>Enable the gift pot and let the whole team chip in. A farewell gift pot is one of the most practical gifts you can give.</p><h2>7. The department legacy card</h2><p>Ask each person to describe what this colleague will be missed for most.</p>$content$,
  'Group Cards',
  ARRAY['farewell card','leaving job','colleague goodbye','office farewell'],
  'published',
  false,
  'Thankeeu Team',
  5,
  NOW() - INTERVAL '24 days',
  '7 Farewell Card Ideas for Colleagues | Thankeeu',
  'Unique farewell card ideas for colleagues. Voice notes, memory walls, prediction messages and pooled Naira gifts that create real memories.'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at;

-- Post 4: Group Gifting in Nigeria: Why Paystack Makes It Fi
INSERT INTO blog_posts (
  title, slug, excerpt, content, category, tags, status,
  is_featured, author_name, read_time, published_at, meta_title, meta_description
) VALUES (
  'Group Gifting in Nigeria: Why Paystack Makes It Finally Work',
  'group-gifting-nigeria-paystack',
  'Collecting money from a group for a shared gift has historically been painful. Paystack changed that. Here is how Thankeeu makes group gifting frictionless.',
  $content$<h2>The Nigerian group gifting problem</h2><p>Every Nigerian has a story. Someone birthday comes up. A WhatsApp group is created. Bank account details are posted. And then the waiting begins. Seven days later, 30% of the group has transferred. The organiser is chasing people individually.</p><h2>Why Paystack changed everything</h2><p>Paystack solved Nigerian payments. Any Nigerian with a debit card, mobile money, or USSD can pay instantly. The infrastructure is solid, the fraud protection is real.</p><h2>How Thankeeu gift pots work</h2><p>When you create a Thankeeu group card, you enable the gift pot. Each person who signs the card contributes via Paystack instantly. The contributions pool automatically. You never chase anyone.</p>$content$,
  'Payments',
  ARRAY['paystack','group gifting','nigeria','gift pot','online payment'],
  'published',
  false,
  'Thankeeu Team',
  5,
  NOW() - INTERVAL '21 days',
  'How Group Gifting Works with Paystack in Nigeria | Thankeeu',
  'How Thankeeu and Paystack make group gifting in Nigeria completely frictionless. No bank details, no chasing, no shortfalls.'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at;

-- Post 5: How to Automate Employee Birthday Cards for Your E
INSERT INTO blog_posts (
  title, slug, excerpt, content, category, tags, status,
  is_featured, author_name, read_time, published_at, meta_title, meta_description
) VALUES (
  'How to Automate Employee Birthday Cards for Your Entire Company',
  'automate-employee-birthday-cards-company',
  'The companies with highest employee engagement do not remember birthdays because they have good memories. They automate them. Here is exactly how.',
  $content$<h2>The birthday problem at scale</h2><p>When your company has 200 employees, remembering birthdays becomes a full-time job. Most companies solve this with a spreadsheet nobody checks. The result: some employees get multiple messages. Others get nothing.</p><h2>Step 1: Set up your company account</h2><p>Create your Thankeeu for Teams account. Add your HR email and company name. Takes 3 minutes.</p><h2>Step 2: Import your team</h2><p>Upload a CSV with names, emails and birthdays, or connect via HRIS integration with SeamlessHR, BambooHR, or Zoho People.</p><h2>Step 3: Switch on automation</h2><p>Once active, Thankeeu automatically creates a birthday card two days before each birthday, emails every department member to sign it, and delivers the card on the birthday morning.</p>$content$,
  'Workplace Culture',
  ARRAY['employee birthday automation','HR automation','HRIS integration','company culture'],
  'published',
  false,
  'Thankeeu Team',
  5,
  NOW() - INTERVAL '18 days',
  'How to Automate Employee Birthday Cards | Thankeeu for Teams',
  'Step-by-step guide to automating employee birthday cards for your entire company using Thankeeu for Teams and HRIS integration.'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at;

-- Post 6: What to Write on a Birthday Card for a Colleague (
INSERT INTO blog_posts (
  title, slug, excerpt, content, category, tags, status,
  is_featured, author_name, read_time, published_at, meta_title, meta_description
) VALUES (
  'What to Write on a Birthday Card for a Colleague (50 Real Examples)',
  'what-to-write-birthday-card-colleague',
  'Staring at a blank message box? We have 50 real birthday message examples for every type of colleague — from your closest work friend to your manager.',
  $content$<h2>The golden rule for birthday messages</h2><p>Say something only YOU could say. Generic wishes are forgotten. A specific reference to a shared memory or quality you admire is remembered forever.</p><h2>For your closest work friends</h2><p>Another year older, no wiser, still convinced your route is better than mine. Happy birthday!</p><p>You have made this job bearable on so many days. Happy birthday.</p><h2>For colleagues you work with regularly</h2><p>Working with you has been a genuine highlight of this year. Wishing you everything good.</p><p>You bring an energy to this team that is genuinely irreplaceable. Hope your day matches it.</p><h2>For someone you do not know as well</h2><p>Happy birthday! Hope you have an amazing day. You bring such good energy to the team.</p><h2>For your manager</h2><p>Happy birthday! Your leadership has genuinely made me better at what I do. Wishing you a day as good as the standards you set.</p>$content$,
  'Group Cards',
  ARRAY['birthday messages','what to write birthday card','colleague birthday','birthday wishes'],
  'published',
  false,
  'Thankeeu Team',
  5,
  NOW() - INTERVAL '15 days',
  '50 Birthday Messages for Colleagues | What to Write | Thankeeu',
  '50 real birthday card message examples for colleagues. Heartfelt, funny, and specific messages that actually mean something.'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at;

-- Post 7: Thankeeu for Teams vs Google Forms: There Is No Co
INSERT INTO blog_posts (
  title, slug, excerpt, content, category, tags, status,
  is_featured, author_name, read_time, published_at, meta_title, meta_description
) VALUES (
  'Thankeeu for Teams vs Google Forms: There Is No Comparison',
  'thankeeu-for-teams-vs-google-forms',
  'Every company has that one person who creates a Google Form for birthday collections. It works. But there is a better way. A direct comparison.',
  $content$<h2>How the Google Form approach works</h2><p>Someone creates a Google Form. It collects names and payment amounts but not actual payments, so the organiser still has to post their bank details and chase people individually.</p><h2>The real cost</h2><p>A birthday coordination that takes 4-6 hours using the Google Form method takes 4-6 minutes with Thankeeu.</p><h2>The experience difference</h2><p>A Thankeeu card with 25 personalised messages, voice notes, photos, and a gift pot is a completely different emotional experience.</p><h2>Security and transparency</h2><p>Google Forms do not handle money. Your personal bank account does. Thankeeu processes all payments through Paystack. Contributors pay directly. The organiser never touches the money.</p>$content$,
  'Workplace Culture',
  ARRAY['HR tools','google forms alternative','birthday collection','team management'],
  'published',
  false,
  'Thankeeu Team',
  5,
  NOW() - INTERVAL '12 days',
  'Thankeeu vs Google Forms for Office Birthday Collections | Thankeeu',
  'Why Thankeeu beats Google Forms for office birthday collections. Automated Paystack gift pots vs manual bank transfers.'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at;

-- Post 8: The Best Birthday Gift Ideas for Nigerian Colleagu
INSERT INTO blog_posts (
  title, slug, excerpt, content, category, tags, status,
  is_featured, author_name, read_time, published_at, meta_title, meta_description
) VALUES (
  'The Best Birthday Gift Ideas for Nigerian Colleagues in 2025',
  'best-birthday-gift-ideas-nigerian-colleagues-2025',
  'Gift vouchers for stores they have never visited. We can do better. A ranked list of birthday gift ideas Nigerian colleagues actually want.',
  $content$<h2>1. Cash done with dignity</h2><p>50,000 to 200,000 Naira pooled from 20-40 colleagues via a Thankeeu gift pot is the gift that always fits. It lets the recipient spend on exactly what they need most right now.</p><h2>2. The experience voucher</h2><p>A spa treatment, cooking class, photography session, or weekend staycation. Use the gift pot to purchase and email the voucher directly.</p><h2>3. Professional development</h2><p>For career-focused colleagues, contributing toward a course or certification is enormously meaningful. It shows you see them as someone with ambition worth investing in.</p><h2>4. The food celebration</h2><p>If your team is in the same city, a contribution toward a birthday dinner out creates a shared experience worth more than any physical gift.</p>$content$,
  'Group Cards',
  ARRAY['birthday gifts','gift ideas','nigeria','office gift','gift pot'],
  'published',
  false,
  'Thankeeu Team',
  5,
  NOW() - INTERVAL '10 days',
  'Best Birthday Gift Ideas for Nigerian Colleagues 2025 | Thankeeu',
  'Ranked birthday gift ideas for Nigerian colleagues in 2025. Cash gift pots via Paystack, experience vouchers, and professional development gifts.'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at;

-- Post 9: How to Set Up HRIS Integration with Thankeeu
INSERT INTO blog_posts (
  title, slug, excerpt, content, category, tags, status,
  is_featured, author_name, read_time, published_at, meta_title, meta_description
) VALUES (
  'How to Set Up HRIS Integration with Thankeeu',
  'hris-integration-thankeeu-seamlesshr-bamboohr-zoho',
  'The 20-minute setup that eliminates manual birthday tracking forever. Step-by-step for SeamlessHR, BambooHR, Zoho People and WorkPay.',
  $content$<h2>Why HRIS integration matters</h2><p>Every HR platform stores your employees birthdays and work anniversaries. But none of them send a beautiful group card automatically, collect a gift from the team, and deliver it on the exact right day. Thankeeu does.</p><h2>Supported platforms</h2><p>Thankeeu supports SeamlessHR, BambooHR, Zoho People, WorkPay, ADP, Sage HR, and any platform that exports a standard CSV.</p><h2>Option 1: CSV Import</h2><p>Export your employee list as a CSV. Required fields: first_name, last_name, email, department, date_of_birth. Upload in your Thankeeu HRIS settings.</p><h2>Option 2: Live API connection</h2><p>Select your provider in Thankeeu HRIS settings and enter your API credentials. Once connected, Thankeeu syncs your employee data every 24 hours automatically.</p>$content$,
  'Workplace Culture',
  ARRAY['HRIS integration','SeamlessHR','BambooHR','Zoho People','HR software','birthday automation'],
  'published',
  false,
  'Thankeeu Team',
  5,
  NOW() - INTERVAL '8 days',
  'HRIS Integration Guide: SeamlessHR, BambooHR, Zoho to Thankeeu',
  'Step-by-step guide to connecting SeamlessHR, BambooHR, Zoho People and WorkPay to Thankeeu for Teams. Automate birthday cards in 20 minutes.'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at;

-- Post 10: Employee Appreciation vs Employee Recognition: Why
INSERT INTO blog_posts (
  title, slug, excerpt, content, category, tags, status,
  is_featured, author_name, read_time, published_at, meta_title, meta_description
) VALUES (
  'Employee Appreciation vs Employee Recognition: Why the Difference Matters',
  'employee-appreciation-vs-recognition',
  'Most HR teams use appreciation and recognition interchangeably. They are not the same thing, and treating them as identical is costing companies engagement and retention.',
  $content$<h2>The definitions</h2><p><strong>Recognition</strong> is about performance. You recognise someone for what they did. Closing the deal, shipping the feature. It is specific and earned.</p><p><strong>Appreciation</strong> is about existence. You appreciate someone for who they are. Their personality, energy, reliability. It is unconditional.</p><h2>Where birthdays fit in</h2><p>Birthdays are a pure appreciation moment. They have nothing to do with performance. They are a chance to say: we see you as a human being, not just a contributor.</p><h2>Getting appreciation right</h2><p>The power of a Thankeeu group birthday card is that it forces 30 people to articulate their appreciation individually. The recipient receives 30 individual proofs of appreciation.</p>$content$,
  'Workplace Culture',
  ARRAY['employee appreciation','employee recognition','HR culture','engagement','retention'],
  'published',
  false,
  'Thankeeu Team',
  5,
  NOW() - INTERVAL '6 days',
  'Employee Appreciation vs Recognition: The Difference | Thankeeu',
  'Why employee appreciation and recognition are not the same and why conflating them damages culture.'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at;

-- Post 11: Why Your Company Should Never Miss an Employee Bir
INSERT INTO blog_posts (
  title, slug, excerpt, content, category, tags, status,
  is_featured, author_name, read_time, published_at, meta_title, meta_description
) VALUES (
  'Why Your Company Should Never Miss an Employee Birthday Again',
  'never-miss-employee-birthday-company',
  'Missed birthdays in the workplace send a message you cannot take back. A single forgotten birthday costs more in trust and morale than most companies realise.',
  $content$<h2>The cost of a missed birthday</h2><p>Research by Workhuman found that employees who feel their birthday was ignored at work are 2.4x more likely to describe their employer as one that does not care about people.</p><h2>The inconsistency problem</h2><p>The most damaging scenario is not missing all birthdays equally. It is missing some while celebrating others. When one department consistently has better organised celebrations than another, the disparity becomes a visible signal of which teams are valued.</p><h2>Automation eliminates inconsistency</h2><p>Thankeeu for Teams creates birthday cards automatically, two days before each birthday, without anyone having to trigger the process. Every department gets the same quality celebration.</p>$content$,
  'Workplace Culture',
  ARRAY['employee birthday','HR management','company culture','employee retention'],
  'published',
  false,
  'Thankeeu Team',
  5,
  NOW() - INTERVAL '4 days',
  'Why Companies Should Never Miss Employee Birthdays | Thankeeu',
  'The hidden cost of missed employee birthdays and why automation is the only reliable solution for growing companies.'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at;

-- Post 12: Voice Notes on Birthday Cards: The Unexpected Feat
INSERT INTO blog_posts (
  title, slug, excerpt, content, category, tags, status,
  is_featured, author_name, read_time, published_at, meta_title, meta_description
) VALUES (
  'Voice Notes on Birthday Cards: The Unexpected Feature Your Team Will Love',
  'voice-notes-on-birthday-cards',
  'Adding a voice note to a group card sounds like a small feature. It is not. Voice notes are consistently the most emotionally impactful element of any Thankeeu card.',
  $content$<h2>What happens when you hear a familiar voice</h2><p>Humans process voice differently from text. When you hear someone say words with their specific cadence and warmth, you feel it. Voice carries emotion in ways that text cannot replicate.</p><h2>Real-world impact</h2><p>Cards with at least one voice note have significantly higher emotional ratings from recipients. Recipients describe them as feeling more real and something they will keep forever.</p><h2>How to encourage voice notes in your team</h2><p>Lower the barrier by making it explicitly optional. Once one or two people add voice notes, others typically follow. Social proof works in celebration contexts too.</p>$content$,
  'Group Cards',
  ARRAY['voice notes','birthday cards','group card features','remote teams'],
  'published',
  false,
  'Thankeeu Team',
  5,
  NOW() - INTERVAL '2 days',
  'Voice Notes on Birthday Cards Why It Matters | Thankeeu',
  'Why voice notes are the most emotionally impactful feature on a group birthday card.'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at;

-- Post 13: How Remote Teams Celebrate Birthdays When Everyone
INSERT INTO blog_posts (
  title, slug, excerpt, content, category, tags, status,
  is_featured, author_name, read_time, published_at, meta_title, meta_description
) VALUES (
  'How Remote Teams Celebrate Birthdays When Everyone Is in a Different City',
  'remote-team-birthday-celebrations',
  'Remote work solved a lot of problems. Office birthday celebrations was not one of them, until now. A guide for distributed teams.',
  $content$<h2>The remote birthday problem</h2><p>When your team is spread across Lagos, Abuja, London, and Toronto, the traditional birthday cake approach is not possible. But that does not mean the moment has to go uncelebrated.</p><h2>The Thankeeu approach for remote teams</h2><p>A digital group card is the most effective birthday tool for remote teams. It is the one format where geography is completely irrelevant. A team member in Toronto contributes their message at 7am their time. A colleague in Lagos adds theirs at lunch. The card accumulates everything and delivers a unified result.</p><h2>Adding a meaningful gift across borders</h2><p>Paystack handles international card payments. Team members outside Nigeria can contribute with Visa or Mastercard. The Nigerian recipient withdraws to their local bank account.</p>$content$,
  'Workplace Culture',
  ARRAY['remote work','remote team celebrations','distributed team','virtual birthday'],
  'published',
  false,
  'Thankeeu Team',
  5,
  NOW() - INTERVAL '1 days',
  'How Remote Teams Celebrate Birthdays Properly | Thankeeu',
  'Birthday celebration guide for distributed and remote teams across multiple cities and time zones.'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at;

-- Post 14: Nigerian HR Trends 2025: What Leading Companies Ar
INSERT INTO blog_posts (
  title, slug, excerpt, content, category, tags, status,
  is_featured, author_name, read_time, published_at, meta_title, meta_description
) VALUES (
  'Nigerian HR Trends 2025: What Leading Companies Are Doing Differently',
  'nigerian-hr-trends-2025',
  'The best Nigerian companies in 2025 are not winning talent wars with bigger salaries alone. They are winning with culture, and how they celebrate their people.',
  $content$<h2>The culture gap is the retention gap</h2><p>In every Nigerian industry, the companies with the lowest voluntary attrition share a common characteristic: people actually feel they belong there.</p><h2>The trend: automating appreciation</h2><p>Leading Nigerian HR teams in 2025 are no longer debating whether to invest in employee experience technology. The question has shifted from whether this is worth doing to how to do it at scale without adding to HR workload.</p><h2>What employees actually want</h2><p>The most recent employee sentiment data from Nigerian workplaces consistently shows that employees rank feeling seen and valued above many benefits that cost significantly more money to deliver. A well-executed birthday card costs the company 5,000 Naira to send. Its impact on how that employee feels about their employer is disproportionately large.</p>$content$,
  'Workplace Culture',
  ARRAY['Nigerian HR','HR trends 2025','employee experience','company culture Nigeria','retention'],
  'published',
  false,
  'Thankeeu Team',
  5,
  NOW() - INTERVAL '0 days',
  'Nigerian HR Trends 2025: Employee Appreciation Strategies | Thankeeu',
  'How leading Nigerian companies in 2025 are automating employee milestone celebrations to drive retention and culture.'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at;

-- Post 15: The Complete Guide to Work Anniversary Cards
INSERT INTO blog_posts (
  title, slug, excerpt, content, category, tags, status,
  is_featured, author_name, read_time, published_at, meta_title, meta_description
) VALUES (
  'The Complete Guide to Work Anniversary Cards',
  'work-anniversary-cards-guide',
  'One year, five years, ten years. Work anniversaries are career milestones that deserve proper recognition. What to say and how to make it special.',
  $content$<h2>Why work anniversaries deserve as much attention as birthdays</h2><p>A work anniversary is a specific kind of achievement: the decision, renewed every year, to keep showing up. For long-serving employees, a significant anniversary represents a meaningful portion of their working life spent with you.</p><h2>What to write for a 1-year anniversary</h2><p>One year in and you are already one of the best decisions this team made. Here is to many more.</p><h2>What to write for a 5-year anniversary</h2><p>Five years. That is how long you have been showing up, delivering, and making this place better. We do not take that for granted.</p><h2>What to write for a 10-year anniversary</h2><p>A decade of you. This company is measurably better because of the specific ways you have shaped it. That is not something that can be replaced.</p><h2>Automating anniversary recognition</h2><p>Thankeeu for Teams automatically creates work anniversary cards based on your employee start dates imported from your HRIS. No HR admin required.</p>$content$,
  'Workplace Culture',
  ARRAY['work anniversary','anniversary card','employee recognition','what to write anniversary card'],
  'published',
  false,
  'Thankeeu Team',
  5,
  NOW() + INTERVAL '1 days',
  'Work Anniversary Cards: What to Write + How to Organise | Thankeeu',
  'Complete guide to work anniversary cards. What to say for 1, 5, and 10-year milestones, how to pool a Naira gift, and how to automate anniversary recognition.'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at;

SELECT COUNT(*) AS blog_posts_total FROM blog_posts;