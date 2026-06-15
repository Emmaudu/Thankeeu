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

// ── Real Unsplash people photos ───────────────────────────────────────────────
const AVATARS = [
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&h=120&fit=crop&crop=face',
];

const GIFS = [
  'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
  'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif',
  'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif',
  'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',
  'https://media.giphy.com/media/RrVzUOXldFe8M/giphy.gif',
];

// ── 50 signers data ───────────────────────────────────────────────────────────
const SIGNERS = [
  // gift types: 'money' | 'flowers' | 'cake' | 'none'
  // media types: 'gif' | 'voice' | 'photo' | 'none'
  { name:'Adaeze Okonkwo', role:'Head of Marketing', font:'font-dancing',
    gift:'money', amount:5000, media:'gif', gifIndex:0, avatar:0,
    msg:`Chisom, darling! I still remember the day you walked into that boardroom with your slides and completely owned the room. Not a single person could take their eyes off your presentation. That day I turned to Emeka and whispered "this one is special." Three years later and every single thing you do still has that same magic — that spark, that precision, that warmth that makes everyone around you feel capable. Working with you is genuinely one of the privileges of my career. On your birthday I just want you to know: you are not just talented, you are the kind of human being that makes a workplace feel like a family. Have the most spectacular day, my dear. You deserve every bit of celebration coming your way! 🎂✨` },

  { name:'Kelechi Adeyemi', role:'Senior Developer', font:'font-vibes',
    gift:'flowers', media:'photo', photoUrl:'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80', avatar:1,
    msg:`Happy birthday to the person who has single-handedly saved my sanity more times than I can count. Remember that production incident at 2am last December? The entire team was panicking, Slack was on fire, and there you were — calm as a cucumber, methodically walking through the logs while the rest of us were stress-eating biscuits. You fixed it in 47 minutes. 47 minutes! I timed it. That composure under pressure, that brilliant mind, that unshakeable belief that every problem has a solution — those are the things that define you. But beyond the work, you're just a genuinely good person. The kind that remembers everyone's coffee order. The kind that says "how are you actually doing?" and means it. Happy birthday, Chisom. May this year bring you everything your generous heart deserves.` },

  { name:'Dr. Nkechi Eze', role:'Chief Medical Officer', font:'font-pacifico',
    gift:'money', amount:10000, media:'gif', gifIndex:1, avatar:2,
    msg:`To our shining star on her birthday — I have watched you grow from a brilliant newcomer who asked the most incisive questions in every meeting, to a leader who now shapes the direction of this entire organisation. What strikes me most about you, Chisom, is not just your intellect (though that is formidable), but your emotional intelligence. The way you read a room. The way you adapt your communication to meet people exactly where they are. The way you advocate quietly and powerfully for what is right. You have made this company better, more thoughtful, more human. And on a personal note — your laugh is genuinely contagious and has brightened more of my difficult days than you will ever know. Wishing you a birthday as brilliant and warm as you are. 🌟` },

  { name:'Emeka Nwosu', role:'Product Manager', font:'font-satisfy',
    gift:'none', media:'none', avatar:3,
    msg:`Chisom! My road-to-work podcast partner, my "did you watch that documentary" buddy, my "should I send this email or is it too aggressive" advisor. Working beside you is one of those rare gifts in a career that you do not fully appreciate until you imagine what it would be like without it — and then you feel actual dread. You bring something to every conversation that I can only describe as clarity. When things are muddy and complicated and everybody is talking over each other, you cut through with one sentence and suddenly everyone can see. That is a superpower. On your birthday I want you to know that you are valued far beyond what any Slack message or performance review could ever capture. Go enjoy today fully — you have earned every moment of it!` },

  { name:'Fatima Al-Hassan', role:'Finance Director', font:'font-kaushan',
    gift:'cake', media:'none', avatar:4,
    msg:`Chisom my dear! There are people you work with, and then there are people who become part of your story. You fell into the second category almost immediately — I think it was during that interminable budget meeting in February where you passed me a note that said "I have calculated that we have collectively lost 4 hours of our lives to this discussion and gained zero insight" and I had to physically suppress laughter for 20 minutes. That is the thing about you — you find the human in every situation. You find the funny, the warm, the real. But you also find the solution, the strategy, the path forward. You are the complete package, Chisom, and on this birthday I am celebrating all of it. Happy birthday to someone who makes finance meetings survivable and Monday mornings actually pleasant! 🎂` },

  { name:'Tunde Bakare', role:'Operations Lead', font:'font-alex',
    gift:'money', amount:7500, media:'photo', photoUrl:'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&q=80', avatar:5,
    msg:`Happy birthday Chisom! I want to tell you something I should have said ages ago: you are the reason the ops team runs as smoothly as it does. Not because of any single decision or project, but because of the culture you model. The thoroughness. The follow-through. The fact that when you say you will handle something, it is handled. Completely. Without chasing. In a world full of half-done things and forgotten promises, you are refreshingly whole. I have learned from watching you operate. I have grown from being around your discipline and your heart. On your birthday, I hope you feel the love and appreciation that you pour out so freely every single day. It comes back to you today, multiplied. Have a fantastic celebration! 🙌` },

  { name:'Blessing Okafor', role:'HR Business Partner', font:'font-sacramento',
    gift:'flowers', media:'gif', gifIndex:2, avatar:6,
    msg:`Chisom, from one HR soul to the brightest light in this building — HAPPY BIRTHDAY! Do you know what my favourite thing about you is? Not the reports (though they are flawless). Not the presentations (though they are stunning). It is the way you treat the people on the ground. The cleaners, the security team, the new interns — every single person gets that same warm, genuine Chisom smile and that "how are you doing?" that feels completely real because IT IS completely real. That is rare. That is character. That is who you are at your core. And it makes everything else you do — every achievement, every milestone, every brilliant idea — shine even brighter. Today we celebrate you, and we mean every word of it. Happy birthday, sweetheart! 🌸💐` },

  { name:'Victor Obi', role:'Legal Counsel', font:'font-dancing',
    gift:'money', amount:15000, media:'none', avatar:7,
    msg:`Happy birthday to the most diplomatically skilled human I have ever encountered. Chisom, I have watched you navigate situations that would make seasoned diplomats break into a cold sweat — with grace, precision and an almost supernatural ability to leave every party in a room feeling heard and respected. The contract negotiations last year. The restructuring communications. That town hall in March where you stood up with two minutes of preparation and delivered something that should have taken a speechwriter two weeks. I am in awe of you. Not in the way that creates distance — in the way that makes you want to work harder, be better, think bigger. Thank you for raising the standard every single day. Happy birthday Chisom. This year is going to be extraordinary.` },

  { name:'Ifeoma Chukwu', role:'Brand Manager', font:'font-vibes',
    gift:'cake', media:'photo', photoUrl:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', avatar:8,
    msg:`HAPPY BIRTHDAY CHISOM!! 🎉🎂🎊 Okay I need everyone reading this to know — this woman is ICONIC. I am not throwing that word around. I mean it in the truest sense. The way she walks into a room and the energy shifts. The way she says your name when she's greeting you and it somehow sounds like the most important thing she's said all day. The way she takes your half-baked idea and transforms it into something so refined you almost don't recognise it (but in the best possible way). I have been in this industry long enough to spot real talent, and real character, and real warmth — and Chisom, you have all three in abundance. On your birthday I am not just celebrating the years — I am celebrating who you ARE. The world is genuinely lucky to have you. Have the most magical day! 🌟✨🎂` },

  { name:'Samuel Adebola', role:'Sales Director', font:'font-satisfy',
    gift:'money', amount:20000, media:'gif', gifIndex:3, avatar:9,
    msg:`Chisom! The person who taught me that "no" is the beginning of a conversation, not the end of one. I have closed deals because of things I learned from watching you handle difficult clients. I have kept relationships because of communication styles I absorbed from sitting in meetings with you. In this industry we talk a lot about mentorship and role models — usually pointing upward to senior figures. But some of the most formative professional influence in my career has come from sideways — from you. From watching how you think, how you problem-solve, how you lead without needing a title to do it. That is the rarest kind of impact. Happy birthday to someone who makes everyone around them better simply by being who they are. Wishing you a year that matches your energy — which means absolutely spectacular! 🚀` },

  { name:'Amara Osei', role:'Data Analyst', font:'font-pinyon',
    gift:'flowers', media:'none', avatar:10,
    msg:`Dear Chisom, I joined this company as a very nervous new analyst who was certain she would be swallowed alive by the complexity of it all. You were the first senior person to stop, sit down with me, and just — talk. Not give me a checklist. Not point me to a document. Just talk. Ask questions. Share your own learning curve. That conversation gave me more confidence than any training programme could have. You invest in people. Quietly, generously, without expecting anything back. I have grown so much in this role and a significant part of that is because you made me feel like I belonged here from day one. On your birthday I want to say thank you — truly — for the gift of your time, your kindness, and your belief in people like me. Happy birthday Chisom! 🌸` },

  { name:'Olu Adewale', role:'IT Manager', font:'font-allura',
    gift:'money', amount:8000, media:'photo', photoUrl:'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80', avatar:11,
    msg:`Happy birthday to the person who actually reads the IT security memos I send out and — miracle of miracles — also remembers what is in them. Chisom, you have no idea how much that means to a man who spends his life watching people click on suspicious email links. But seriously — today I am not writing as the IT guy. I am writing as someone who has watched you demonstrate what it looks like to be truly excellent at something while remaining completely and utterly human. You have no ego about your accomplishments. You share credit freely. You ask for help when you need it. You admit when you are wrong. These things seem simple but they are extraordinarily rare in high-performing people. You are the exception. Happy birthday — may today be everything you deserve and more.` },

  { name:'Ngozi Uchenna', role:'Executive Assistant', font:'font-courgette',
    gift:'cake', media:'gif', gifIndex:4, avatar:12,
    msg:`Chisom! I schedule your meetings, I manage your calendar, I know your coffee order, I have seen the state of your inbox at its worst — and I can tell you with absolute certainty: you are the kindest, most decent, most genuinely good-hearted person I have ever worked for. Not because you say please and thank you (though you always do). But because you MEAN it. Because you ask about my mother's health and actually remember the update from three months ago. Because you said "you handle things in a way that makes my job easier" to me once in a team meeting and I nearly cried because no one had said anything like that to me before. You see people, Chisom. You really see them. Happy birthday to someone who makes the world genuinely brighter just by being in it. 🎂💜` },

  { name:'Chidi Onyekwere', role:'Strategy Consultant', font:'font-dancing',
    gift:'money', amount:25000, media:'none', avatar:13,
    msg:`Chisom! From one overthinker to the world's most elegant overthinker — happy birthday. I say that with deep affection because the quality of your thinking is visible in everything you produce. There is no half-measure in your work. No approximation. No "good enough." Everything that comes from you has been considered, reconsidered, refined and then reconsidered again — and it shows. The quality is unmistakable. But here is what I love even more: you do not apply that same exacting standard to people. With people you are endlessly patient, endlessly generous, endlessly willing to give the benefit of the doubt. You hold work to a high standard and people to a human one. That balance is genuinely rare and genuinely beautiful. Happy birthday. This year is yours.` },

  { name:'Remi Fashola', role:'Communications Manager', font:'font-vibes',
    gift:'flowers', media:'photo', photoUrl:'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80', avatar:14,
    msg:`Chisom my love! You know I am a words person — it is literally my job — and yet I find myself struggling to find words big enough for what you mean to this team and to me personally. You have been a sounding board, a co-conspirator, a voice of reason and occasionally a voice of delightful unreason when we all needed permission to dream bigger. I remember when you said "why are we limiting the scope of this?" in that planning meeting and the entire room went quiet for a moment and then everyone started talking at once with this energy that had not been in the room a minute before. You do that. You expand the possible. You shift what people think they can do. On your birthday I want to celebrate that gift — and the extraordinary human being it comes wrapped in. Happy birthday, beautiful! 🌹` },

  { name:'Mike Adetokunbo', role:'Software Engineer', font:'font-satisfy',
    gift:'money', amount:5000, media:'gif', gifIndex:5, avatar:0,
    msg:`Chisom! Happy birthday from someone who will always remember the time you helped me debug that absolutely cursed piece of legacy code at 6pm on a Friday when you had every right to have already been halfway home. You sat there for 45 minutes, asked better questions than I was asking, spotted the issue (it was a timezone problem, obviously it was a timezone problem), and then high-fived me like I had done the work. That is just who you are. You make people feel capable. You share the credit. You show up. Happy birthday — I hope this year brings you the kind of joy you give everyone around you, which is to say: enormous, genuine, and thoroughly deserved.` },

  { name:'Zainab Musa', role:'Project Coordinator', font:'font-kaushan',
    gift:'none', media:'none', avatar:1,
    msg:`Happy birthday Chisom! I know we do not always get to work directly together but I want you to know that your reputation travels far and wide in this organisation. People talk about you — in the best possible way. "Chisom would know how to handle this." "Let me ask Chisom." "Chisom said something in a meeting last week that I keep thinking about." You have built something remarkable: a reputation that precedes you not because of politics or self-promotion, but purely because of the quality of your character and your work. That is the kind of reputation that lasts. The kind that follows you everywhere. Happy birthday to someone who has genuinely earned every wonderful thing being said about her.` },

  { name:'Chukwuemeka Obiora', role:'Finance Analyst', font:'font-alex',
    gift:'money', amount:12000, media:'photo', photoUrl:'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&q=80', avatar:2,
    msg:`Chisom! For your birthday I would like to present you with some financial analysis of your impact on this organisation. Your net positive contribution to team morale: incalculable. Your return on investment in terms of institutional knowledge: stratospheric. The cost to this organisation if we were to try and replace you with someone of equivalent talent, skill, emotional intelligence and warmth: impossible to calculate because the combination is genuinely irreplaceable. In summary: you are priceless. Not in the vague motivational poster sense. In the actual, literal, measurable sense that what you bring cannot be bought or replicated. Happy birthday to my favourite colleague and one of my favourite humans. May this year be your most abundant yet! 📊💜` },

  { name:'Adunola Adeleke', role:'Training Manager', font:'font-sacramento',
    gift:'cake', media:'none', avatar:3,
    msg:`Chisom! As someone who literally teaches people skills for a living, let me tell you something: the things that make you exceptional cannot be taught in a classroom. They cannot be memorised from a book or practised in a workshop. They come from somewhere deeper — from genuine curiosity, from real empathy, from an authentic desire to be excellent and to lift others into excellence alongside you. I have designed countless leadership programmes and I keep coming back to this truth: the best leaders are the ones whose people would follow them anywhere not because they have to but because they genuinely want to. You are that kind of leader. Happy birthday to someone who teaches by living. 🎂✨` },

  { name:'Taiwo Adelowo', role:'Research Lead', font:'font-dancing',
    gift:'flowers', media:'gif', gifIndex:0, avatar:4,
    msg:`Happy birthday to my favourite "have you considered this angle?" person. Chisom, every time I think I have fully thought through a piece of research, you ask one question that opens a completely new dimension. It is both humbling and thrilling. The quality of your intellectual curiosity is matched only by the generosity with which you share it — you do not ask those questions to show off, you ask them because you genuinely want the work to be better. You care about getting things right more than you care about being seen to be right. That distinction matters enormously and it is rarer than it should be. Thank you for making all our work deeper and truer. Happy birthday! 🌸` },

  { name:'Obiageli Nwofor', role:'Legal Associate', font:'font-vibes',
    gift:'money', amount:6000, media:'none', avatar:5,
    msg:`Chisom darling! Happy birthday to the person I call when I need to think through something complicated — not because you have all the answers, but because talking to you makes me find my own. That is such a gift. The Socratic approach, my law professor would call it. But you do it naturally, without pretension, just through genuine interest and thoughtful questions. You are one of those rare people who makes others smarter just by engaging with them. I hope your birthday is filled with the kind of joy that is equal parts warm and exhilarating — like you. And I hope the year ahead brings you opportunities as boundless as your talent. Which means: very boundless indeed. Much love! 💜` },

  { name:'Ifeanyi Okeke', role:'Marketing Executive', font:'font-pacifico',
    gift:'none', media:'photo', photoUrl:'https://images.unsplash.com/photo-1483389127117-b6a2102724ae?w=600&q=80', avatar:6,
    msg:`CHISOM! Happy birthday! I want to tell you about the moment I realised you were genuinely exceptional. It was during the Q3 pitch to the board. You were halfway through your presentation when someone interrupted with what was clearly a hostile question designed to derail the whole thing. And you just — paused. Smiled. Said "that is actually a really important question and I want to make sure I answer it properly." And then you did. Perfectly. Calmly. Without losing your thread or your composure. I was sitting there thinking: I want to be that. That collected, that confident, that gracious under pressure. You have elevated how I think about professionalism. Happy birthday — go have the spectacular celebration you deserve! 🎉` },

  { name:'Chiamaka Eze', role:'Customer Success', font:'font-satisfy',
    gift:'money', amount:9000, media:'gif', gifIndex:1, avatar:7,
    msg:`Happy birthday to the person who personally called me when I was going through a difficult time at work and said "I just want to check in, you do not have to talk about anything specific" — and then stayed on the phone for an hour listening to me figure out what I was feeling. You did not have to do that. You had a million other things on your plate. But that is you, Chisom. You make time. You make space. You make people feel like they matter — because to you, they genuinely do. I have never forgotten that call and I never will. Thank you for being one of the truly good ones. Happy birthday, from someone who is so grateful you exist. 🌸` },

  { name:'Babatunde Olanrewaju', role:'Operations Manager', font:'font-kaushan',
    gift:'cake', media:'none', avatar:8,
    msg:`Chisom! Happy birthday! I will keep this short because knowing you, you will find a way to redirect the attention back to someone or something else and I want you to actually receive this: you are extraordinary. The patience you showed during the system migration last year — when everything was broken and everyone was frustrated and some of us were not our best selves — you held the team together with this quiet, steady energy that said "we will get through this and we will be better for it." And we did. And we were. That is leadership. That is you. Happy birthday. Receive the praise today — you have earned it a hundred times over.` },

  { name:'Olumide Fashanu', role:'Creative Director', font:'font-allura',
    gift:'money', amount:18000, media:'photo', photoUrl:'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&q=80', avatar:9,
    msg:`Chisom! From a creative perspective, you are simply one of the most aesthetically intelligent people I have encountered outside of a purely creative field. The way you think about communication — the visual logic, the emotional arc, the audience psychology — you think like a designer even when you are not designing. That cross-disciplinary brilliance is what separates good professionals from great ones. But I also want to celebrate something that has nothing to do with work: your style. Your presence. The way you put yourself together. The confidence you carry your identity with. In a world that asks a lot of professional women in terms of how they present themselves, you have figured out exactly who you are and you wear it beautifully. Happy birthday, Chisom. Today is yours. 🎨✨` },

  { name:'Esther Nnamdi', role:'Account Manager', font:'font-dancing',
    gift:'flowers', media:'none', avatar:10,
    msg:`Dear Chisom, happy birthday! I want to share a small story. Last month I made a significant error on the Meridian account. I was mortified. I had a whole apology speech prepared. When I came to tell you, you listened, asked what had happened, helped me think through the correction — and then you said "these things happen, the important thing is how we fix it and what we learn." No lecture. No disappointed sighs. No making me feel small. Just immediate forward motion. I walked out of that conversation feeling competent instead of crushed. You have no idea how rare that is in a manager. You build people up even when they fall down. Happy birthday to someone who deserves all the flowers — metaphorically and literally!` },

  { name:'Damilola Afolabi', role:'Business Analyst', font:'font-vibes',
    gift:'money', amount:7000, media:'gif', gifIndex:2, avatar:11,
    msg:`Chisom!! Happy birthday! Okay I need to tell everyone who reads this card that this woman once covered for me in a meeting I had completely forgotten about — walked in, picked up my brief from memory alone, ran the whole thing, and then texted me afterwards saying "all good, I told them you were on another call." I still owe her approximately 47 favours and am not even close to paying them back. But beyond the legendary teamwork moments, you are just a spectacular person. Thoughtful. Sharp. Hilarious when you let yourself be (and I wish you let yourself be more often because your timing is impeccable). Happy birthday to my favourite colleague and accomplice. May this year be everything you want it to be! 🎉` },

  { name:'Perpetua Okafor', role:'Supply Chain Lead', font:'font-sacramento',
    gift:'none', media:'none', avatar:12,
    msg:`Chisom, happy birthday to one of the steadiest people I know. In supply chain we deal with chaos as a baseline. Disruptions. Shortages. Delays. The whole world conspiring to make the simple complicated. And what I have learned from watching you is that the antidote to external chaos is internal calm. You do not just have a plan B — you have a whole alphabet of contingencies and you hold them lightly, not rigidly, ready to adapt in real time. That is operational wisdom of the highest order. But more than the professional admiration: you have been a friend. A real one. One who shows up. Happy birthday Chisom — I am so glad we ended up on the same team, in every sense of the word.` },

  { name:'Uzoma Nwankwo', role:'Investment Analyst', font:'font-alex',
    gift:'money', amount:30000, media:'photo', photoUrl:'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80', avatar:13,
    msg:`Happy birthday Chisom! In investment we talk a lot about compounding. How small, consistent actions over time produce exponential results. I have watched you compound for three years now — every day showing up fully, every day giving generously, every day doing excellent work quietly and without fanfare — and the result is this person who is so deeply established, so trusted, so valued, that you have become load-bearing in the structure of this organisation. Quietly essential. Indispensably present. That kind of reputation is not built overnight and it cannot be faked. It is earned, one honest interaction at a time. You have earned it. Completely. Happy birthday — may your returns be equally compounding! 📈💜` },

  { name:'Halima Salihu', role:'Content Strategist', font:'font-courgette',
    gift:'flowers', media:'gif', gifIndex:3, avatar:14,
    msg:`Chisom! As someone who works with words every day, I want to tell you something about the way you communicate. There is a quality to it that I have been trying to identify for months and I think I finally have it: intentionality. You never say things casually that should be said carefully. You never rush through something important. You choose your words the way a careful writer does — not for effect, but for accuracy. Not to impress, but to connect. In a world of noise you are signal. In a world of performance you are presence. On your birthday I am celebrating that — and celebrating you. Have a truly wonderful day, Chisom. You bring so much beauty to the world. 🌸✨` },

  { name:'Obinna Nzekwe', role:'Tech Lead', font:'font-pinyon',
    gift:'money', amount:10000, media:'none', avatar:0,
    msg:`Happy birthday Chisom! I am going to be real with you — I was a bit skeptical when you first joined the tech side of things. Not of you personally, but of the cross-functional collaboration in general. We have had mixed results with that kind of arrangement. Then the first meeting happened and you asked a question so incisive it stopped the whole technical conversation in its tracks and made us rethink a fundamental assumption we had been operating on for months. I went home that evening and thought: okay. This is different. This is going to be good. And it was. And it is. Happy birthday to someone who made me eat a healthy portion of humble pie and I am genuinely grateful for it.` },

  { name:'Adaora Ugwu', role:'PR Manager', font:'font-dancing',
    gift:'cake', media:'photo', photoUrl:'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=600&q=80', avatar:1,
    msg:`Chisom!! Happy birthday my absolute favourite! Do you know what makes you one of the best communicators I have ever encountered? It is not the polish — though you have that. It is not the vocabulary — though it is impeccable. It is the listening. You listen with your whole body. People feel heard when they are talking to you in a way that is genuinely unusual. Full attention, no phone, no half-thought elsewhere. Just you, present, engaged, genuinely interested in what the other person is saying. In communications we teach listening but almost no one actually does it. You just... do. Naturally. That gift makes everything else you say land so much harder because people trust that you have really heard them first. Happy birthday to the best listener I know! 💜🎉` },

  { name:'Seun Adesanya', role:'UX Designer', font:'font-vibes',
    gift:'money', amount:8500, media:'gif', gifIndex:4, avatar:2,
    msg:`Happy birthday Chisom! As a UX person I think about experience design constantly — how does this feel, what is the emotional journey, where is the friction, where is the delight. Working with you is phenomenal UX. Zero unnecessary friction. Clear communication at every touchpoint. Generous feedback that actually makes things better. And genuine delight — the meetings where you say something that makes everyone laugh, the moments where you push back on something in a way that is both firm and kind, the times where you just GET what we are trying to do before we have fully articulated it. You are designed well, Chisom. Have a beautiful birthday. May it be as well-designed as you are. 🎨✨` },

  { name:'Funmilayo Akinwande', role:'Compliance Officer', font:'font-satisfy',
    gift:'none', media:'none', avatar:3,
    msg:`Chisom! Happy birthday! In compliance, we spend a lot of time on rules and frameworks and what people cannot do. So it is always refreshing to be around someone who makes me think about what people CAN do — what they are capable of when they are trusted and supported and genuinely valued. You operate from that place. You see the best possibility in situations and in people and you move toward it with conviction. That is the opposite of the compliance mindset and I love you for it. You balance me out. You remind me that structure exists to enable, not to constrain. Happy birthday — you are a gift to this organisation and to everyone lucky enough to know you.` },

  { name:'Emeka Chukwudi', role:'Procurement Head', font:'font-kaushan',
    gift:'money', amount:14000, media:'photo', photoUrl:'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&q=80', avatar:4,
    msg:`Chisom! In procurement we are trained to assess value. What does this actually cost? What does it actually deliver? What is the true return? By every measure of value I know how to apply, you are an exceptional investment. The return this organisation gets from having you — in work quality, in team health, in institutional knowledge, in the way clients feel when they interact with someone from this company — it is immeasurable. Genuinely. I have tried to quantify it and the model breaks because some things exceed calculation. You are one of those things. Happy birthday to a person of immeasurable and irreplaceable value. 🙌💜` },

  { name:'Nneka Obi', role:'Brand Strategist', font:'font-allura',
    gift:'flowers', media:'none', avatar:5,
    msg:`Happy birthday to my favourite brainstorming partner, my "what if we tried this completely different approach" co-conspirator, my "no that first idea was actually better, let us go back" sounding board. Chisom, the creative energy you bring to strategic sessions is genuinely electric. You hold loosely — you are not attached to your own ideas to the point where you cannot let them evolve — and that looseness creates this incredible space where the best idea can win, regardless of whose it was. That collaborative spirit is a gift to everyone who gets to think alongside you. Happy birthday! I hope today is as bright and creative and full of life as you are. 🌸🎉` },

  { name:'Akin Salami', role:'Risk Manager', font:'font-dancing',
    gift:'money', amount:11000, media:'gif', gifIndex:5, avatar:6,
    msg:`Chisom! From a risk management perspective: knowing you are on the team significantly reduces my anxiety levels across multiple categories simultaneously. Which in this job is saying something remarkable. But seriously — happy birthday to someone whose judgment I trust completely. Not because you are always right (though you are right an unusually high percentage of the time), but because the quality of your reasoning is always sound. When you are wrong you say so and learn and adjust. When you are uncertain you say so and seek input. When you are confident you say so and you back it up. That consistency of epistemic integrity is everything in a high-stakes environment. Thank you for being you. Happy birthday! 🎂` },

  { name:'Uju Okonkwo', role:'Learning & Development', font:'font-vibes',
    gift:'none', media:'photo', photoUrl:'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80', avatar:7,
    msg:`Chisom! I work in learning and development, which means I spend my days thinking about how people grow. And I want to tell you what I observe in you: you are a genuinely self-directed learner. You seek out things that challenge you. You are curious about domains far outside your own. You read widely and think about how ideas from unexpected places apply to your work. That kind of intellectual restlessness — kept in check by your extraordinary discipline — is the engine of real growth. You are not finished becoming yourself and that is one of the most exciting things about you. Happy birthday to a work in progress who is already magnificent. 📚✨` },

  { name:'Chinedu Okafor', role:'Customer Relations', font:'font-sacramento',
    gift:'money', amount:5500, media:'none', avatar:8,
    msg:`Chisom, happy birthday! I want to tell you about something that happened six months ago that I never got around to mentioning. A difficult customer called in absolutely furious about a situation that was honestly not our fault at all. My supervisor asked me to loop in someone from your team. You joined the call, listened for about two minutes, acknowledged the customer's frustration (without admitting fault — you were surgical about that), and then calmly described the exact steps we were going to take, with timelines, with names attached to each action. The customer's tone changed completely by the end of the call. Turned out they became one of our strongest referrals that quarter. You saved that relationship. Happy birthday — you make things better everywhere you touch. 🌟` },

  { name:'Tolu Adeyemi', role:'Head of Growth', font:'font-alex',
    gift:'flowers', media:'gif', gifIndex:0, avatar:9,
    msg:`Happy birthday Chisom! Growth is my world — metrics, funnels, conversion rates, acquisition channels. But the most important growth I have witnessed in this company over the past three years has not shown up in any dashboard. It is the growth in how we treat each other. How we communicate. How we resolve conflict. How we celebrate wins and handle setbacks. And so much of that culture shift has been quietly, consistently, deliberately shaped by you. Not through grand initiatives or company-wide announcements. Through how you show up every day. Through the example you set. Through the kind of environment you create around yourself wherever you go. That is culture leadership at its finest. Happy birthday. 🌸🎉` },

  { name:'Ebuka Eze', role:'Technical Writer', font:'font-courgette',
    gift:'money', amount:7800, media:'none', avatar:10,
    msg:`Happy birthday Chisom! As someone who writes for a living I am very attuned to how people use language — and the way you write is something I genuinely admire. Your emails are clear without being terse. Your reports are thorough without being bloated. Your feedback is specific without being harsh. There is such craft in how you put words together and I notice it every single time. But what I appreciate even more is that you make space for people who communicate differently — who are more verbose, or less polished, or who need to circle around to their point. You never make anyone feel inadequate for communicating differently than you do. That grace is beautiful. Happy birthday! 💜` },

  { name:'Grace Adichie', role:'Chief People Officer', font:'font-pinyon',
    gift:'cake', media:'photo', photoUrl:'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&q=80', avatar:11,
    msg:`Chisom. As the head of people, I want to say this clearly so it is on the record: you are what we hire for. When we write job descriptions, when we conduct interviews, when we design our culture — we are trying to find and build more people like you. The combination of excellence and humanity. The ability to be rigorous without being unkind. The capacity to drive results while lifting people. The wisdom to know when to push and when to hold. These are not things we can put in a competency framework because they live in character, not in skills. You have them. Fully. Naturally. Generously. Happy birthday, Chisom. We are all so deeply grateful you are here. 🌟💜` },

  { name:'Rotimi Adeleke', role:'CFO', font:'font-dancing',
    gift:'money', amount:50000, media:'none', avatar:12,
    msg:`Chisom — from the finance team's perspective: happy birthday to someone who makes the numbers look good by making the humans feel good. There is a direct correlation and I have the data to prove it. But what I really want to say today is more personal. You have, on more than one occasion, brought something to my attention in the way only a trusted colleague can — directly, privately, with care. You were right each time. And each time I was glad that someone I trust enough to actually listen to was the one who said it. You are brave in the quiet ways that matter. Not recklessly brave — wisely brave. That is a quality I respect enormously. Happy birthday. Have a wonderful, celebrated, thoroughly deserved day. 🎂` },

  { name:'Adaeze Nnoli', role:'Internal Auditor', font:'font-vibes',
    gift:'flowers', media:'gif', gifIndex:1, avatar:13,
    msg:`Chisom! Happy birthday! I spend my days finding what is wrong, what is missing, what does not add up. Occupational hazard. Which makes it particularly meaningful when I tell you: in three years of working alongside you, I have found nothing but good things. Genuine integrity. Real care. Actual follow-through. Honest acknowledgment when things go wrong. No performance, no politics, no gap between who you are in a meeting and who you are in the corridor. What you see is what you get, and what you get is excellent. That consistency is the most important quality I know how to assess and you have it in full. Happy birthday to someone who would pass any audit. 🌸` },

  { name:'Dele Ogundimu', role:'Business Development', font:'font-satisfy',
    gift:'money', amount:16000, media:'photo', photoUrl:'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80', avatar:14,
    msg:`Chisom! Happy birthday! In business development we are always thinking about competitive advantage — what is the thing that makes us different, better, chosen over the alternative. You are a competitive advantage. Not because you are aggressive or ruthless or relentlessly self-promoting (you are none of those things). But because when clients interact with you they feel something that is increasingly rare: they feel respected and valued as people, not just as accounts. That feeling keeps clients. That feeling generates referrals. That feeling builds the kind of relationships that sustain a business through difficult times. You are, quite literally, one of our best business development assets — and you do not even work in BD. Happy birthday! 🚀` },

  { name:'Yetunde Akinsanya', role:'Sustainability Lead', font:'font-kaushan',
    gift:'none', media:'none', avatar:0,
    msg:`Chisom! Happy birthday! I work in sustainability, which means I think constantly about long-term impact. What actions taken today will matter in ten, twenty, fifty years? Most things we do are ephemeral — they matter in the moment and fade. But the people you develop, the culture you shape, the standards you model — those have a half-life of decades. The junior analyst you mentored two years ago is leading a team. The processes you improved are still running. The way you treated people in your first year here set a standard that others calibrated against. Your impact is compounding even as we celebrate your birthday. You are, in every sense, sustainable. Happy birthday to someone who is building something that will last. 🌱💜` },

  { name:'Ike Osuji', role:'Head of Research', font:'font-allura',
    gift:'money', amount:22000, media:'gif', gifIndex:2, avatar:1,
    msg:`Chisom! As a researcher I am trained to interrogate everything — to be skeptical, to demand evidence, to resist the seductive pull of a good narrative in the absence of data. So when I tell you that the evidence for your excellence is overwhelming, you know I mean it. I have observed you across contexts. I have seen you under pressure and when things are going smoothly. I have seen you receive praise and criticism. I have seen you deal with difficult people and easy ones. The data is consistent across all conditions: you are remarkable. Happy birthday to the most thoroughly evidenced excellent person I know. 📊✨` },

  { name:'Bisola Coker', role:'Social Media Manager', font:'font-dancing',
    gift:'flowers', media:'photo', photoUrl:'https://images.unsplash.com/photo-1543269664-647163b38060?w=600&q=80', avatar:2,
    msg:`CHISOM! Happy birthday!! I spend all day making content about wonderful things and wonderful people and I want you to know — you would be the easiest person in the world to create content about. The stories practically write themselves. The Q3 turnaround. The onboarding programme redesign. The way you handled the client emergency in March. The mentorship sessions that people still talk about. Any one of those could anchor a case study. But the thing that would really go viral? A video of you just being you — warm, brilliant, impossibly competent and somehow not intimidating about any of it. That combination is content gold. Happy birthday to someone whose story I would tell forever! 🎉🌸` },

  { name:'Nnamdi Obi', role:'CTO', font:'font-vibes',
    gift:'money', amount:40000, media:'none', avatar:3,
    msg:`Chisom — I do not usually write long birthday messages. You know that. But today I am making an exception because you deserve one. In the years I have been CTO of this company I have worked with hundreds of talented people. A small number of them have the rarer quality of being both talented and genuinely good — the kind of person whose presence makes the organisation not just more effective but more worthy. You are in that small number. You make this a place worth working. Not through grand gestures or transformative projects alone — though you have delivered those too — but through the accumulation of a thousand daily choices to be honest, to be kind, to be excellent, to be human. That is your legacy, already. Happy birthday. 💜` },

  { name:'Adanna Obiechina', role:'Health & Safety', font:'font-courgette',
    gift:'cake', media:'gif', gifIndex:3, avatar:4,
    msg:`Chisom! Happy birthday! I work in health and safety, which means I spend a lot of time thinking about environments — what makes a space safe, what makes it hazardous, what creates conditions where people can do their best work without harm. Working around you creates an exceptionally safe environment. Psychologically safe. People say what they think. People admit mistakes. People ask questions without fear. You model that safety through how you receive information — without defensiveness, without punishing honesty, without making people regret being open. That psychological safety is the foundation of everything good this team produces. Thank you for creating it, consistently, every single day. Happy birthday! 🎂✨` },

  { name:'Tosin Balogun', role:'Global Partnerships', font:'font-alex',
    gift:'money', amount:13500, media:'photo', photoUrl:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80', avatar:5,
    msg:`Chisom! In partnerships we talk endlessly about alignment — shared values, shared vision, complementary strengths. The best partnerships, I have found, are not between people who are the same, but between people who are both excellent in ways that combine powerfully. Working with you has been the best professional partnership of my career precisely for this reason. You are strong exactly where I need support. You see things I miss. You slow down where I rush. You push where I hold back. We make each other better. That is the definition of a true partnership. Happy birthday to my favourite collaborator and one of my most valued relationships — professional or otherwise. 🤝💜` },

  { name:'Stella Okonkwo', role:'Executive Vice President', font:'font-pinyon',
    gift:'money', amount:60000, media:'none', avatar:6,
    msg:`Chisom. I have been at this company for eleven years. I have seen a great many people come through here — some who dazzled and burned, some who plodded and persisted, some who were good but never found their full expression here. Every so often — rarely — someone arrives who is simply in their right place. Who fits not because they accommodate themselves to the culture but because the culture expands to meet them. You are that person. You arrived fully formed in who you are and what you stand for, and this organisation has been better for bending itself toward you rather than the other way around. On your birthday I want you to know: you are exactly where you are supposed to be, doing exactly what you are supposed to do, and we would be diminished without you. Happy birthday. With deep admiration and great affection. 🌟💜` },
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
        <img src={AVATARS[signer.avatar]} alt={signer.name}
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
        <p className="text-sm text-warm-700 leading-relaxed">
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
