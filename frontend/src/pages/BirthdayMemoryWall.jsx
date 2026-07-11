import { Link } from 'react-router-dom';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function BirthdayMemoryWallPage() {
  useSEO({
    title: 'Birthday Memory Wall — Turn Your Birthday Into A Live Celebration Everyone Can Join | Thankeeu',
    description: 'Create a live birthday memory wall where friends and family upload photos, videos and messages throughout the day. Every moment captured. Every memory kept forever.',
    keywords: 'birthday memory wall, birthday photo wall, collect birthday photos online, birthday memory album, group birthday celebration online',
    canonical: '/birthday-memory-wall',
    locale: 'en',
    jsonLd: [
      SCHEMAS.organization,
      SCHEMAS.faqPage([
        { q: 'How does a birthday memory wall work?', a: 'Friends and family upload photos, videos and messages to one shared wall throughout the birthday — from anywhere in the world. Everything appears in real time and is kept forever.' },
        { q: 'Is it free to create a birthday memory wall?', a: 'Yes, it is free to create. You only pay when you send the group card, starting from £4.99, and the memory wall and Memory Movie are included.' },
        { q: 'Can people join without an app?', a: 'Yes. Anyone with the link can upload instantly from any phone or computer — no app download and no account needed.' },
        { q: 'Does it turn birthday photos into a video?', a: 'Yes. Thankeeu automatically combines every message, photo and video into a cinematic birthday Memory Movie the recipient keeps forever.' },
      ]),
    ],
  });
  return (
    <>
      <Navbar />
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white pt-24 pb-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-5xl mb-4 block">🎂</span>
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold leading-tight mb-6">
            Turn Your Birthday Into A Live Celebration Everyone Can Join
          </h1>
          <p className="text-lg text-white/70 mb-10">
            Friends and family upload photos, videos and birthday messages throughout the day — from wherever they are in the world. One live wall. Every memory. Kept forever.
          </p>
          <Link to="/card/new" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 font-bold text-lg shadow-xl inline-block hover:scale-105 transition-all">
            Create Birthday Memory Wall →
          </Link>
        </div>
      </section>
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-warm-900 text-center mb-8">Everything in one place — messages, photos, videos, gifts</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { emoji:'❤️', title:'Heartfelt messages', desc:'Write a birthday message with photos, voice notes, GIFs and a gift contribution.' },
              { emoji:'📸', title:'Live Memory Wall', desc:'Upload birthday photos throughout the day — the wall updates in real time.' },
              { emoji:'🎥', title:'Memory Movie™', desc:'Every message and photo becomes a cinematic birthday movie they keep forever.' },
            ].map(({emoji,title,desc}) => (
              <div key={title} className="text-center p-6 rounded-2xl bg-purple-50 border border-purple-100">
                <span className="text-3xl block mb-3">{emoji}</span>
                <h3 className="font-bold text-warm-900 mb-2 text-sm">{title}</h3>
                <p className="text-xs text-warm-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 px-4 text-center bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-extrabold mb-4">Create a birthday memory they'll watch for years.</h2>
          <Link to="/card/new" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 font-bold text-lg shadow-xl inline-block">Create Now →</Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
