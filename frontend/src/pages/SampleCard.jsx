import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

// ── Calligraphic font styles injected in-page ────────────────────────────────
const FONT_INJECT = `
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Pinyon+Script&family=Sacramento&family=Kaushan+Script&family=Alex+Brush&family=Allura&family=Courgette&display=swap');
.font-dancing   { font-family:'Dancing Script', cursive; }
.font-vibes     { font-family:'Great Vibes', cursive; }
.font-pacifico  { font-family:'Pacifico', cursive; }
.font-satisfy   { font-family:'Satisfy', cursive; }
.font-pinyon    { font-family:'Pinyon Script', cursive; }
.font-sacramento{ font-family:'Sacramento', cursive; }
.font-kaushan   { font-family:'Kaushan Script', cursive; }
.font-alex      { font-family:'Alex Brush', cursive; }
.font-allura    { font-family:'Allura', cursive; }
.font-courgette { font-family:'Courgette', cursive; }
`;

const CALLI_FONTS = [
  'font-dancing','font-vibes','font-pacifico','font-satisfy',
  'font-pinyon','font-sacramento','font-kaushan','font-alex',
  'font-allura','font-courgette',
];

// Ornate scripts need more size + line-height to stay readable in a full
// paragraph; rounder/simpler scripts work fine closer to body size.
const MSG_FONT_STYLE = {
  'font-dancing':   { fontSize:'1.15rem', lineHeight:'1.8' },
  'font-vibes':     { fontSize:'1.35rem', lineHeight:'1.9' },
  'font-pacifico':  { fontSize:'1.05rem', lineHeight:'1.85' },
  'font-satisfy':   { fontSize:'1.1rem',  lineHeight:'1.8' },
  'font-pinyon':    { fontSize:'1.4rem',  lineHeight:'1.9' },
  'font-sacramento':{ fontSize:'1.3rem',  lineHeight:'1.9' },
  'font-kaushan':   { fontSize:'1.05rem', lineHeight:'1.85' },
  'font-alex':      { fontSize:'1.35rem', lineHeight:'1.9' },
  'font-allura':    { fontSize:'1.35rem', lineHeight:'1.9' },
  'font-courgette': { fontSize:'1.05rem', lineHeight:'1.8' },
};

// ── Avatar pools: Nigerian-presenting and American-presenting photos ─────────
// Nigerian-presenting (warm darker tones, West African features)
// Nigerian/African-presenting photos — verified dark-skin professional headshots
const NGA = [
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&h=120&fit=crop&crop=face',  // 0 woman, dark skin
  'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=120&h=120&fit=crop&crop=face',  // 1 man, dark skin
  'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=120&h=120&fit=crop&crop=face',  // 2 woman, dark skin
  'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=120&h=120&fit=crop&crop=face',  // 3 man, dark skin
  'https://images.unsplash.com/photo-1595956553066-fe24a8c33395?w=120&h=120&fit=crop&crop=face',  // 4 woman, dark skin
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&h=120&fit=crop&crop=face',  // 5 woman, dark skin
  'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=120&h=120&fit=crop&crop=face',  // 6 man, dark skin
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&h=120&fit=crop&crop=face',  // 7 woman, dark skin
  'https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?w=120&h=120&fit=crop&crop=face',  // 8 man, dark skin
  'https://images.unsplash.com/photo-1623366302587-b38b1ddaefd9?w=120&h=120&fit=crop&crop=face',  // 9 woman, dark skin
];

// American/Western-presenting photos — diverse lighter-skin professional headshots
const USA = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',  // 0 woman, light skin
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=face',  // 1 man, light skin
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face',  // 2 man, light skin
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop&crop=face',  // 3 woman, medium
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=face',  // 4 woman, light skin
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face',  // 5 man, light skin
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=120&h=120&fit=crop&crop=face',  // 6 man, medium
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=120&h=120&fit=crop&crop=face',  // 7 woman, light skin
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=face',  // 8 man, light skin
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face',  // 9 woman, medium
];

// Legacy AVATARS kept for hero strip
const AVATARS = [...NGA, ...USA];

const GIFS = [
  'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
  'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif',
  'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif',
  'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',
  'https://media.giphy.com/media/RrVzUOXldFe8M/giphy.gif',
];

// ── Signers — mixed Nigerian and American names with matching photos ──────────
// Each signer has: nga: true (Nigerian) or nga: false (American), avatar index into NGA or USA pool
const SIGNERS = [
  // ── Nigerian ──
  { name:'Adaeze Okonkwo', nga:true, avatar:0, role:'Head of Marketing', font:'font-dancing',
    gift:'money', amount:5000, media:'gif', gifIndex:0,
    msg:`Chisom, darling! I still remember the day you walked into that boardroom with your slides and completely owned the room. Not a single person could take their eyes off your presentation. That day I turned to Emeka and whispered "this one is special." Three years later and every single thing you do still has that same magic — that spark, that precision, that warmth that makes everyone around you feel capable. Working with you is genuinely one of the privileges of my career. On your birthday I just want you to know: you are not just talented, you are the kind of human being that makes a workplace feel like a family. Have the most spectacular day, my dear. You deserve every bit of celebration coming your way! 🎂✨` },

  { name:'Jessica Morgan', nga:false, avatar:0, role:'VP of Product', font:'font-vibes',
    gift:'flowers', media:'photo', photoUrl:'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80',
    msg:`Chisom! Working across time zones with you has been one of the highlights of this role. You make 7am calls feel energising, which should be impossible. Your ability to cut through ambiguity and give the team clarity when everything feels murky is something I genuinely aspire to. I told my manager last month that you are the clearest strategic thinker on the extended team and I meant every word. Happy birthday — hope your day is as bright as the energy you bring to every single call. 🎉` },

  { name:'Kelechi Adeyemi', nga:true, avatar:1, role:'Senior Developer', font:'font-pacifico',
    gift:'money', amount:8000, media:'none',
    msg:`Happy birthday to the person who has single-handedly saved my sanity more times than I can count. Remember that production incident at 2am last December? The entire team was panicking, Slack was on fire, and there you were — calm as a cucumber, methodically walking through the logs while the rest of us were stress-eating biscuits. You fixed it in 47 minutes. That composure under pressure, that brilliant mind, that unshakeable belief that every problem has a solution — those are the things that define you. Happy birthday, Chisom!` },

  { name:'Tyler Brooks', nga:false, avatar:1, role:'Engineering Manager', font:'font-satisfy',
    gift:'money', amount:15000, media:'gif', gifIndex:1,
    msg:`Chisom! I've been in tech for fifteen years and I can count on one hand the people who make me genuinely rethink my assumptions in a single conversation. You're on that list. The questions you ask don't just probe the surface — they go straight to the assumption buried three layers down. I've left meetings with you having to unlearn things I thought were settled. That is a rare and valuable gift. Happy birthday to someone who makes everyone in the room smarter. 🚀` },

  { name:'Dr. Nkechi Eze', nga:true, avatar:2, role:'Chief Medical Officer', font:'font-kaushan',
    gift:'money', amount:10000, media:'gif', gifIndex:2,
    msg:`To our shining star on her birthday — I have watched you grow from a brilliant newcomer who asked the most incisive questions in every meeting, to a leader who now shapes the direction of this entire organisation. What strikes me most about you, Chisom, is not just your intellect, but your emotional intelligence. The way you read a room. The way you adapt your communication to meet people exactly where they are. The way you advocate quietly and powerfully for what is right. You have made this company better, more thoughtful, more human. Wishing you a birthday as brilliant and warm as you are. 🌟` },

  { name:'Sarah Chen', nga:false, avatar:2, role:'Head of Design', font:'font-dancing',
    gift:'flowers', media:'photo', photoUrl:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80',
    msg:`Chisom! You have the rarest combination — impeccable taste and genuine humility about it. You'll say "I think this could be better" and then sketch out something on a napkin that is better. Completely, obviously better. And then you give credit to the whole team. I've learned so much from watching how you hold space for great work without ego. Happy birthday! Wishing you a day as beautiful as everything you touch. 🌸` },

  { name:'Emeka Nwosu', nga:true, avatar:3, role:'Product Manager', font:'font-alex',
    gift:'none', media:'none',
    msg:`Chisom! My road-to-work podcast partner, my "did you watch that documentary" buddy, my "should I send this email or is it too aggressive" advisor. Working beside you is one of those rare gifts in a career that you do not fully appreciate until you imagine what it would be like without it. You bring clarity to every conversation. When things are muddy and complicated and everybody is talking over each other, you cut through with one sentence and suddenly everyone can see. On your birthday I want you to know that you are valued far beyond what any Slack message could ever capture. Go enjoy today fully!` },

  { name:'Marcus Williams', nga:false, avatar:3, role:'Sales Director', font:'font-sacramento',
    gift:'money', amount:20000, media:'gif', gifIndex:3,
    msg:`Chisom! I've closed deals because of things I learned from watching you handle difficult conversations. The way you stay curious when others get defensive, the way you find the shared interest underneath the stated position — that's a skill I've been studying and trying to replicate for two years. You make everyone around you sharper. Happy birthday to the most quietly influential person on this team. 🎯` },

  { name:'Fatima Al-Hassan', nga:true, avatar:4, role:'Finance Director', font:'font-courgette',
    gift:'cake', media:'none',
    msg:`Chisom my dear! There are people you work with, and then there are people who become part of your story. You fell into the second category almost immediately — I think it was during that interminable budget meeting in February where you passed me a note that said "I have calculated that we have collectively lost 4 hours of our lives to this discussion and gained zero insight" and I had to physically suppress laughter for 20 minutes. That is the thing about you — you find the human in every situation. Happy birthday to someone who makes finance meetings survivable! 🎂` },

  { name:'Amanda Foster', nga:false, avatar:4, role:'Chief People Officer', font:'font-pinyon',
    gift:'money', amount:25000, media:'photo', photoUrl:'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&q=80',
    msg:`Chisom. As the head of people I want to say this clearly: you are what we hire for. When we write job descriptions, when we design our culture — we are trying to find more people like you. The combination of excellence and humanity. The ability to be rigorous without being unkind. The capacity to drive results while lifting people. These are not things we can put in a competency framework because they live in character. You have them. Fully. Naturally. Generously. Happy birthday. 🌟💜` },

  { name:'Tunde Bakare', nga:true, avatar:5, role:'Operations Lead', font:'font-dancing',
    gift:'money', amount:7500, media:'photo', photoUrl:'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&q=80',
    msg:`Happy birthday Chisom! I want to tell you something I should have said ages ago: you are the reason the ops team runs as smoothly as it does. Not because of any single decision or project, but because of the culture you model. The thoroughness. The follow-through. The fact that when you say you will handle something, it is handled. Completely. Without chasing. In a world full of half-done things and forgotten promises, you are refreshingly whole. Have a fantastic celebration! 🙌` },

  { name:'Rachel Kim', nga:false, avatar:5, role:'Strategy Lead', font:'font-vibes',
    gift:'flowers', media:'gif', gifIndex:4,
    msg:`Chisom! Strategy is my world and I want to tell you — the strategic intuition you bring to cross-functional discussions is better than most pure strategy hires I've worked with. You see the second and third-order effects. You spot the assumption everyone else is making. And you say it without making anyone feel stupid for missing it. That combination of insight and grace is extraordinarily rare. Happy birthday! 🌸` },

  { name:'Blessing Okafor', nga:true, avatar:6, role:'HR Business Partner', font:'font-satisfy',
    gift:'flowers', media:'gif', gifIndex:5,
    msg:`Chisom, from one HR soul to the brightest light in this building — HAPPY BIRTHDAY! Do you know what my favourite thing about you is? Not the reports (though they are flawless). Not the presentations (though they are stunning). It is the way you treat the people on the ground. The cleaners, the security team, the new interns — every single person gets that same warm, genuine Chisom smile and that "how are you doing?" that feels completely real because IT IS completely real. That is rare. That is character. Happy birthday, sweetheart! 🌸💐` },

  { name:'David Patterson', nga:false, avatar:6, role:'CTO', font:'font-kaushan',
    gift:'money', amount:40000, media:'none',
    msg:`Chisom — I don't usually write long birthday messages. But today I'm making an exception. In my years as CTO I've worked with hundreds of talented people. A small number have both the talent AND the character. The kind of person whose presence makes the organisation not just more effective but more worthy. You are in that small number. You make this a place worth working. Not through grand gestures alone — but through the accumulation of a thousand daily choices to be honest, to be kind, to be excellent, to be human. Happy birthday. 💜` },

  { name:'Victor Obi', nga:true, avatar:7, role:'Legal Counsel', font:'font-pacifico',
    gift:'money', amount:15000, media:'none',
    msg:`Happy birthday to the most diplomatically skilled human I have ever encountered. Chisom, I have watched you navigate situations that would make seasoned diplomats break into a cold sweat — with grace, precision and an almost supernatural ability to leave every party in a room feeling heard and respected. The contract negotiations last year. The restructuring communications. That town hall in March where you stood up with two minutes of preparation and delivered something that should have taken a speechwriter two weeks. I am in awe of you. This year is going to be extraordinary.` },

  { name:'Emily Rodriguez', nga:false, avatar:7, role:'Marketing Director', font:'font-alex',
    gift:'flowers', media:'photo', photoUrl:'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=120&h=120&fit=crop&crop=face',
    msg:`Chisom! You understand brand in a way that goes beyond frameworks. You feel it. When we were repositioning last year you said something in a workshop that reframed the entire conversation — something about the difference between what a brand says about itself and what it makes customers feel about themselves. I wrote it down. I still reference it. Happy birthday to someone who thinks at a completely different level. 🎨✨` },

  { name:'Ifeoma Chukwu', nga:true, avatar:8, role:'Brand Manager', font:'font-allura',
    gift:'cake', media:'photo', photoUrl:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    msg:`HAPPY BIRTHDAY CHISOM!! 🎉🎂🎊 Okay I need everyone reading this to know — this woman is ICONIC. The way she walks into a room and the energy shifts. The way she says your name when she's greeting you and it somehow sounds like the most important thing she's said all day. The way she takes your half-baked idea and transforms it into something so refined you almost don't recognise it. I have been in this industry long enough to spot real talent, real character, real warmth — and Chisom, you have all three in abundance. The world is genuinely lucky to have you. 🌟✨🎂` },

  { name:'James O\'Brien', nga:false, avatar:8, role:'CFO', font:'font-courgette',
    gift:'money', amount:50000, media:'none',
    msg:`Chisom — from the finance team's perspective: happy birthday to someone who makes the numbers look good by making the humans feel good. There is a direct correlation and I have the data to prove it. What I really want to say is more personal. You have brought things to my attention in the way only a trusted colleague can — directly, privately, with care. You were right each time. You are brave in the quiet ways that matter. Not recklessly brave — wisely brave. That is a quality I respect enormously. Happy birthday. 🎂` },

  { name:'Samuel Adebola', nga:true, avatar:9, role:'Sales Director', font:'font-dancing',
    gift:'money', amount:12000, media:'gif', gifIndex:0,
    msg:`Chisom! The person who taught me that "no" is the beginning of a conversation, not the end of one. I have closed deals because of things I learned from watching you handle difficult clients. Some of the most formative professional influence in my career has come from watching how you think, how you problem-solve, how you lead without needing a title to do it. That is the rarest kind of impact. Happy birthday to someone who makes everyone around them better simply by being who they are. May this year be absolutely spectacular! 🚀` },

  { name:'Chloe Thompson', nga:false, avatar:9, role:'Head of Research', font:'font-vibes',
    gift:'flowers', media:'gif', gifIndex:1,
    msg:`Chisom! As a researcher I'm trained to interrogate everything — to demand evidence, to resist a good narrative without data. So when I tell you the evidence for your excellence is overwhelming, you know I mean it. I've observed you across contexts. Under pressure and when things go smoothly. Receiving praise and criticism. The data is consistent across all conditions: you are remarkable. Happy birthday to the most thoroughly evidenced excellent person I know. 📊✨` },

  { name:'Amara Osei', nga:true, avatar:0, role:'Data Analyst', font:'font-satisfy',
    gift:'flowers', media:'none',
    msg:`Dear Chisom, I joined this company as a very nervous new analyst who was certain she would be swallowed alive by the complexity of it all. You were the first senior person to stop, sit down with me, and just — talk. Not give me a checklist. Not point me to a document. Just talk. Ask questions. Share your own learning curve. That conversation gave me more confidence than any training programme could have. Thank you — truly — for the gift of your time, your kindness, and your belief in people like me. Happy birthday Chisom! 🌸` },

  { name:'Noah Martinez', nga:false, avatar:0, role:'Creative Director', font:'font-pinyon',
    gift:'money', amount:18000, media:'photo', photoUrl:'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&q=80',
    msg:`Chisom! From a creative perspective, you are one of the most aesthetically intelligent people I've encountered outside a purely creative field. The way you think about communication — the visual logic, the emotional arc, the audience psychology — you think like a designer even when you're not designing. That cross-disciplinary brilliance is what separates good professionals from great ones. Happy birthday to someone whose presence alone elevates the work around her. 🎨✨` },

  { name:'Olu Adewale', nga:true, avatar:1, role:'IT Manager', font:'font-kaushan',
    gift:'money', amount:8000, media:'photo', photoUrl:'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80',
    msg:`Happy birthday to the person who actually reads the IT security memos I send out. Chisom, you have no idea how much that means to a man who spends his life watching people click on suspicious email links. But seriously — I am writing as someone who has watched you demonstrate what it looks like to be truly excellent at something while remaining completely and utterly human. You have no ego about your accomplishments. You share credit freely. You ask for help when you need it. You are the exception. Happy birthday!` },

  { name:'Samantha Lee', nga:false, avatar:1, role:'UX Designer', font:'font-allura',
    gift:'flowers', media:'gif', gifIndex:2,
    msg:`Happy birthday Chisom! As a UX person I think about experience design constantly — how does this feel, where is the friction, where is the delight? Working with you is phenomenal UX. Zero unnecessary friction. Clear communication at every touchpoint. Generous feedback that actually makes things better. And genuine delight in the meetings where you say something that makes everyone laugh, or push back on something in a way that is both firm and kind. You are designed well, Chisom. 🎨✨` },

  { name:'Ngozi Uchenna', nga:true, avatar:2, role:'Executive Assistant', font:'font-dancing',
    gift:'cake', media:'gif', gifIndex:3,
    msg:`Chisom! I schedule your meetings, I manage your calendar, I know your coffee order, I have seen the state of your inbox at its worst — and I can tell you with absolute certainty: you are the kindest, most decent, most genuinely good-hearted person I have ever worked for. Because you MEAN it. Because you ask about my mother's health and actually remember the update from three months ago. Because you said "you handle things in a way that makes my job easier" to me once in a team meeting and I nearly cried. You see people, Chisom. You really see them. Happy birthday! 🎂💜` },

  { name:'Brandon Scott', nga:false, avatar:2, role:'Business Development', font:'font-satisfy',
    gift:'money', amount:16000, media:'photo', photoUrl:'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80',
    msg:`Chisom! In business development we think about competitive advantage. You are one. Not because you're aggressive or relentlessly self-promoting (you're none of those things). But because when clients interact with you, they feel something increasingly rare: they feel respected as people, not just as accounts. That feeling keeps clients. That feeling generates referrals. That feeling builds relationships that sustain a business through difficult times. You are, literally, one of our best BD assets — and you don't even work in BD. Happy birthday! 🚀` },

  { name:'Chidi Onyekwere', nga:true, avatar:3, role:'Strategy Consultant', font:'font-vibes',
    gift:'money', amount:25000, media:'none',
    msg:`Chisom! From one overthinker to the world's most elegant overthinker — happy birthday. I say that with deep affection because the quality of your thinking is visible in everything you produce. There is no half-measure in your work. No approximation. No "good enough." Everything that comes from you has been considered, reconsidered, refined — and it shows. But here is what I love even more: you do not apply that same exacting standard to people. With people you are endlessly patient, endlessly generous. You hold work to a high standard and people to a human one. Happy birthday. This year is yours.` },

  { name:'Lauren Hayes', nga:false, avatar:3, role:'Compliance Officer', font:'font-pacifico',
    gift:'none', media:'none',
    msg:`Chisom! In compliance, we spend a lot of time on what people cannot do. So it's always refreshing to be around someone who makes me think about what people CAN do — what they're capable of when they're trusted and supported. You operate from that place. You see the best possibility in situations and in people and you move toward it with conviction. You remind me that structure exists to enable, not to constrain. Happy birthday — you are a gift to this organisation. 🎉` },

  { name:'Remi Fashola', nga:true, avatar:4, role:'Communications Manager', font:'font-dancing',
    gift:'flowers', media:'photo', photoUrl:'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80',
    msg:`Chisom my love! You know I am a words person — it is literally my job — and yet I find myself struggling to find words big enough for what you mean to this team. You have been a sounding board, a co-conspirator, a voice of reason and occasionally a voice of delightful unreason when we all needed permission to dream bigger. I remember when you said "why are we limiting the scope of this?" in that planning meeting and the entire room went quiet for a moment and then everyone started talking at once with this energy. You expand the possible. Happy birthday, beautiful! 🌹` },

  { name:'Christopher Evans', nga:false, avatar:4, role:'Risk Manager', font:'font-sacramento',
    gift:'money', amount:11000, media:'gif', gifIndex:4,
    msg:`Chisom! From a risk management perspective: knowing you're on the team significantly reduces my anxiety levels across multiple categories simultaneously. Which in this job is saying something remarkable. I trust your judgment completely — not because you're always right, but because the quality of your reasoning is always sound. When you're wrong you say so and learn. When you're uncertain you say so and seek input. When you're confident you back it up. That consistency is everything in a high-stakes environment. Happy birthday! 🎂` },

  { name:'Tosin Balogun', nga:true, avatar:5, role:'Global Partnerships', font:'font-alex',
    gift:'money', amount:13500, media:'photo', photoUrl:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80',
    msg:`Chisom! In partnerships we talk about alignment — shared values, complementary strengths. The best partnerships are between people who are both excellent in ways that combine powerfully. Working with you has been the best professional partnership of my career. You are strong exactly where I need support. You see things I miss. You slow down where I rush. You push where I hold back. We make each other better. That is the definition of a true partnership. Happy birthday to my favourite collaborator! 🤝💜` },

  { name:'Ashley Johnson', nga:false, avatar:5, role:'Sustainability Lead', font:'font-vibes',
    gift:'flowers', media:'none',
    msg:`Chisom! I work in sustainability and think constantly about long-term impact. What actions taken today will matter in ten, twenty years? The people you develop, the culture you shape, the standards you model — those have a half-life of decades. The junior analyst you mentored two years ago is now leading a team. The processes you improved are still running. Your impact is compounding. You are, in every sense, sustainable. Happy birthday to someone who is building something that will last. 🌱💜` },

  { name:'Mike Adetokunbo', nga:true, avatar:6, role:'Software Engineer', font:'font-satisfy',
    gift:'money', amount:5000, media:'gif', gifIndex:5,
    msg:`Chisom! Happy birthday from someone who will always remember the time you helped me debug that absolutely cursed piece of legacy code at 6pm on a Friday when you had every right to have already been halfway home. You sat there for 45 minutes, asked better questions than I was asking, spotted the issue (it was a timezone problem, obviously it was a timezone problem), and then high-fived me like I had done the work. That is just who you are. You make people feel capable. Happy birthday!` },

  { name:'Kevin O\'Connor', nga:false, avatar:6, role:'Tech Lead', font:'font-kaushan',
    gift:'money', amount:10000, media:'none',
    msg:`Chisom! I was a bit skeptical when you first joined the tech side. Not of you personally, but of the cross-functional collaboration in general. Then the first meeting happened and you asked a question so incisive it stopped the whole technical conversation and made us rethink a fundamental assumption we'd been operating on for months. I went home that evening thinking: okay. This is different. This is going to be good. And it was. And it is. Happy birthday — I'm genuinely grateful I was wrong to be skeptical.` },

  { name:'Zainab Musa', nga:true, avatar:7, role:'Project Coordinator', font:'font-dancing',
    gift:'none', media:'none',
    msg:`Happy birthday Chisom! I know we do not always get to work directly together but I want you to know that your reputation travels far and wide in this organisation. People talk about you — in the best possible way. "Chisom would know how to handle this." "Let me ask Chisom." "Chisom said something in a meeting last week that I keep thinking about." You have built something remarkable: a reputation built purely on the quality of your character and your work. That is the kind of reputation that lasts. Happy birthday!` },

  { name:'Taylor Reed', nga:false, avatar:7, role:'Content Strategist', font:'font-alex',
    gift:'flowers', media:'gif', gifIndex:0,
    msg:`Chisom! As someone who works with words every day, I want to tell you about the way you communicate. There's a quality to it I've been trying to identify for months and I think I finally have it: intentionality. You never say things casually that should be said carefully. You choose your words the way a careful writer does — not for effect, but for accuracy. Not to impress, but to connect. In a world of noise you are signal. In a world of performance you are presence. Happy birthday! 🌸✨` },
];

// ── Gift summary computation ──────────────────────────────────────────────────
function computeSummary(signers) {
  let totalMoney = 0, totalFlowers = 0, totalCakes = 0;
  signers.forEach(s => {
    if (s.gift === 'money')   totalMoney   += (s.amount || 0);
    if (s.gift === 'flowers') totalFlowers += 1;
    if (s.gift === 'cake')    totalCakes   += 1;
  });
  return { totalMoney, totalFlowers, totalCakes };
}

// ── Petal confetti component ──────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 6,
    duration: 4 + Math.random() * 5, size: 8 + Math.random() * 10,
    color: ['#A855F7','#EC4899','#F59E0B','#10B981','#3B82F6','#EF4444','#F97316'][i % 7],
    rotate: Math.random() * 360,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:`${p.left}%`, top:'-20px',
          width:p.size, height:p.size, background:p.color,
          borderRadius: p.id % 3 === 0 ? '50%' : p.id % 3 === 1 ? '2px' : '50% 0 50% 0',
          transform:`rotate(${p.rotate}deg)`,
          animation:`fall ${p.duration}s ${p.delay}s infinite linear`,
          opacity:0.8,
        }} />
      ))}
      <style>{`
        @keyframes fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity:1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity:0; }
        }
      `}</style>
    </div>
  );
}

// ── Single card component ─────────────────────────────────────────────────────
function SignerCard({ signer, index }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = signer.msg.length > 280;
  const preview = isLong ? signer.msg.slice(0, 280) + '…' : signer.msg;

  const giftBadge = () => {
    if (signer.gift === 'money')   return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">💰 ₦{signer.amount?.toLocaleString()}</span>;
    if (signer.gift === 'flowers') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200">🌸 Flowers</span>;
    if (signer.gift === 'cake')    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">🎂 Cake</span>;
    return null;
  };

  const mediaBadge = () => {
    if (signer.media === 'gif')   return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-200">GIF</span>;
    if (signer.media === 'voice') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">🎙 Voice</span>;
    if (signer.media === 'photo') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">📸 Photo</span>;
    return null;
  };

  // Card accent colors cycling
  const accents = [
    'border-purple-200 bg-gradient-to-br from-purple-50 to-white',
    'border-pink-200 bg-gradient-to-br from-pink-50 to-white',
    'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
    'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
    'border-rose-200 bg-gradient-to-br from-rose-50 to-white',
    'border-blue-200 bg-gradient-to-br from-blue-50 to-white',
    'border-violet-200 bg-gradient-to-br from-violet-50 to-white',
  ];
  const accent = accents[index % accents.length];

  return (
    <div className={`rounded-3xl border-2 ${accent} p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <img src={(signer.nga ? NGA : USA)[signer.avatar % (signer.nga ? NGA.length : USA.length)]} alt={signer.name}
          className="w-12 h-12 rounded-2xl object-cover flex-shrink-0 shadow-sm" />
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-warm-900 text-base leading-tight ${signer.font}`}>{signer.name}</p>
          <p className="text-xs text-warm-400 mt-0.5">{signer.role}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {giftBadge()}
            {mediaBadge()}
          </div>
        </div>
        <div className="text-xl opacity-50 flex-shrink-0">
          {['✨','🌸','💜','🎉','🌟','💫','🎂'][index % 7]}
        </div>
      </div>

      {/* Media */}
      {signer.media === 'gif' && (
        <div className="rounded-2xl overflow-hidden max-h-44 bg-warm-100">
          <img src={GIFS[signer.gifIndex % GIFS.length]} alt="GIF reaction"
            className="w-full h-44 object-cover" loading="lazy" />
        </div>
      )}
      {signer.media === 'photo' && signer.photoUrl && (
        <div className="rounded-2xl overflow-hidden max-h-44">
          <img src={signer.photoUrl} alt="Shared photo"
            className="w-full h-44 object-cover" loading="lazy" />
        </div>
      )}
      {signer.media === 'voice' && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs">▶</span>
          </div>
          <div className="flex-1">
            <div className="flex gap-0.5 items-end h-6">
              {Array.from({length:24}, (_,i) => (
                <div key={i} className="bg-primary-400 rounded-full w-1"
                  style={{ height: `${20 + Math.sin(i*0.8)*14}px`, opacity:0.6+Math.sin(i)*0.4 }} />
              ))}
            </div>
            <p className="text-[10px] text-warm-400 mt-1">Voice message · 0:42</p>
          </div>
        </div>
      )}

      {/* Message */}
      <div className="relative">
        <p className={`text-warm-700 ${signer.font}`} style={MSG_FONT_STYLE[signer.font]}>
          {expanded ? signer.msg : preview}
        </p>
        {isLong && (
          <button onClick={() => setExpanded(!expanded)}
            className="text-xs font-bold text-primary-600 hover:text-primary-800 mt-1 transition-colors">
            {expanded ? 'Show less ↑' : 'Read more →'}
          </button>
        )}
      </div>

      {/* Decorative quote mark */}
      <div className="absolute -top-2 -left-1 text-5xl text-primary-200 leading-none pointer-events-none select-none font-serif">"</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SampleCard() {
  const { totalMoney, totalFlowers, totalCakes } = computeSummary(SIGNERS);
  const [showAll, setShowAll] = useState(false);
  const [confetti, setConfetti] = useState(true);
  const visible = showAll ? SIGNERS : SIGNERS.slice(0, 12);

  useEffect(() => {
    const t = setTimeout(() => setConfetti(false), 10000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{FONT_INJECT}</style>
      {confetti && <Confetti />}

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden"
        style={{ background:'linear-gradient(135deg,#7C3AED 0%,#A855F7 40%,#EC4899 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-10 -left-16 w-64 h-64 rounded-full opacity-10 bg-white" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5 bg-white" />

        <div className="relative max-w-3xl mx-auto px-4 py-16 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full mb-6 border border-white/30">
            🎂 Group Birthday Card · Sample
          </div>

          {/* Recipient */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=face"
                alt="Chisom" className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-base shadow-lg">🎂</div>
            </div>
          </div>

          <h1 className="font-vibes text-6xl text-white mb-2" style={{ fontFamily:"'Great Vibes', cursive" }}>
            Happy Birthday,
          </h1>
          <h2 className="font-dancing text-7xl text-yellow-300 font-bold mb-3" style={{ fontFamily:"'Dancing Script', cursive", textShadow:'0 2px 20px rgba(0,0,0,0.2)' }}>
            Chisom! 🎉
          </h2>
          <p className="text-white/80 text-lg mb-8 font-light">
            From your entire team at <strong className="text-white font-bold">Nexus Technologies</strong>
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon:'✍️', val:SIGNERS.length, label:'Signed' },
              { icon:'💰', val:`₦${totalMoney.toLocaleString()}`, label:'Gift pot' },
              { icon:'🌸', val:totalFlowers, label:'Flowers sent' },
              { icon:'🎂', val:totalCakes, label:'Cakes ordered' },
            ].map(s => (
              <div key={s.label} className="bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-3 text-center border border-white/30 min-w-24">
                <p className="text-2xl font-extrabold text-white">{s.val}</p>
                <p className="text-xs text-white/70 mt-0.5">{s.icon} {s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Gift summary bar ── */}
      <div className="bg-white border-b border-purple-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">💰</span>
              <div>
                <p className="text-xs text-warm-400 leading-none">Total Gift Pot</p>
                <p className="font-extrabold text-emerald-600 text-base">₦{totalMoney.toLocaleString()}</p>
              </div>
            </div>
            <div className="w-px bg-purple-100 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-xl">🌸</span>
              <div>
                <p className="text-xs text-warm-400 leading-none">Flower gifts</p>
                <p className="font-extrabold text-pink-600 text-base">{totalFlowers} bouquets</p>
              </div>
            </div>
            <div className="w-px bg-purple-100 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-xl">🎂</span>
              <div>
                <p className="text-xs text-warm-400 leading-none">Cake gifts</p>
                <p className="font-extrabold text-amber-600 text-base">{totalCakes} cakes</p>
              </div>
            </div>
          </div>
          <Link to="/signup"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899)' }}>
            Create your own card →
          </Link>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Section header */}
        <div className="text-center mb-10">
          <p className="font-kaushan text-3xl text-primary-700 mb-2" style={{ fontFamily:"'Kaushan Script', cursive" }}>
            Messages from your team
          </p>
          <p className="text-warm-400 text-sm">{SIGNERS.length} colleagues signed this card with love 💜</p>
          {/* Signer avatar strip */}
          <div className="flex justify-center mt-4 -space-x-2">
            {AVATARS.slice(0, 12).map((src, i) => (
              <img key={i} src={src} alt="" className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm"
                style={{ zIndex:12-i }} />
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-100 flex items-center justify-center text-[10px] font-bold text-primary-700 shadow-sm" style={{ zIndex:0 }}>
              +{SIGNERS.length - 12}
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative">
          {visible.map((s, i) => (
            <div key={i} className="relative">
              <SignerCard signer={s} index={i} />
            </div>
          ))}
        </div>

        {/* Load more */}
        {!showAll && SIGNERS.length > 12 && (
          <div className="text-center mt-8">
            <button onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg hover:opacity-90 transition-all"
              style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899)' }}>
              Show all {SIGNERS.length} messages ↓
            </button>
          </div>
        )}
        {showAll && (
          <div className="text-center mt-8">
            <button onClick={() => { setShowAll(false); window.scrollTo({top:0,behavior:'smooth'}); }}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold bg-purple-50 text-primary-700 border border-purple-200 hover:bg-purple-100 transition-all">
              ↑ Back to top
            </button>
          </div>
        )}

        {/* ── CTA section ── */}
        <div className="mt-16 rounded-3xl overflow-hidden relative"
          style={{ background:'linear-gradient(135deg,#7C3AED 0%,#A855F7 60%,#EC4899 100%)' }}>
          <div className="absolute inset-0 opacity-10">
            {Array.from({length:6}, (_,i) => (
              <div key={i} className="absolute rounded-full bg-white"
                style={{ width:80+i*40, height:80+i*40, top:`${10+i*12}%`, left:`${5+i*15}%`, opacity:0.3 }} />
            ))}
          </div>
          <div className="relative px-6 py-12 text-center">
            <h2 className="font-dancing text-4xl text-white font-bold mb-3" style={{ fontFamily:"'Dancing Script', cursive" }}>
              Create a card like this for your team
            </h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto text-sm leading-relaxed">
              Automated birthday, farewell and anniversary cards for your entire team. Gift pots, flower & cake orders, all in one beautiful card.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/company/signup"
                className="px-8 py-3.5 rounded-2xl font-bold text-primary-700 bg-white hover:bg-purple-50 transition-all shadow-lg text-sm">
                🏢 Set up for my team →
              </Link>
              <Link to="/create-card"
                className="px-8 py-3.5 rounded-2xl font-bold text-white border-2 border-white/50 hover:bg-white/10 transition-all text-sm">
                Create a card now
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
