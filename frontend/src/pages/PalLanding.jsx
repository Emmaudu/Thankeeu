import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import { useSEO } from '../hooks/useSEO';

const FEATURES = [
  { icon: 'Users',   title: 'Up to 15 members, one account', desc: 'Your closest circle — friends, family, or a small team — shares a single group dashboard with individual logins.' },
  { icon: 'Calendar', title: 'Automatic celebration cards',   desc: 'Add birthdays, graduations, promotions, or farewells once. Thankeeu creates the card and reminds everyone — you never have to remember.' },
  { icon: 'Gift',     title: 'Pooled gifts, sent automatically', desc: 'Everyone chips in to a shared gift pot. By evening on the big day, the money is sent straight to the celebrant\'s bank account.' },
  { icon: 'Lock',     title: 'Private contribution amounts', desc: 'Only the celebrant sees how much was raised — no comparisons, no awkwardness, just a nice surprise.' },
  { icon: 'UserPlus', title: 'Simple invites',               desc: 'Invite friends by email or bulk-upload a list. Each person sets their own password to join the shared dashboard.' },
  { icon: 'Percent',  title: 'Free to join',                 desc: 'Creating a Pals group costs nothing. Thankeeu takes a small 3.5% fee only from gift pots when they\'re paid out.' },
];

const STEPS = [
  { num: '01', icon: 'Edit',     title: 'Apply for a group', desc: 'Pick a group name and username, add your members\' details, and submit your application.' },
  { num: '02', icon: 'Check',    title: 'Get approved',      desc: 'Our team reviews and approves your group, then emails you a verification link.' },
  { num: '03', icon: 'UserPlus', title: 'Invite your circle', desc: 'Add up to 15 people. Each gets an email invite to set their own password and join.' },
  { num: '04', icon: 'Party',    title: 'Celebrate together', desc: 'Birthdays and milestones automatically get cards, reminders, and a shared gift pot.' },
];

export default function PalLanding() {
  useSEO({
    title: 'Thankeeu Pals — Group Cards for Friends & Family | Thankeeu',
    description: 'Create a free Pals group for up to 15 friends or family. Automatically celebrate birthdays and milestones together with a group card and pooled gift. No hassle.',
    keywords: 'group card for friends, family group card Nigeria, birthday reminder group, Thankeeu Pals', canonical: '/pals',
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAFA' }}>
      <Navbar />

      {/* Hero */}
      <section className="px-4 pt-14 pb-12 sm:pt-20 sm:pb-16 section-dots" style={{ background: 'linear-gradient(160deg,#F5F0FF,#FFF1F3)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-purple-100 text-xs font-semibold text-primary-600 mb-5">
            <Icon name="Users" size={14} /> Thankeeu Pals
          </span>
          <h1 className="font-bold text-warm-900 mb-4" style={{ fontSize: 'clamp(2rem,6vw,3.25rem)' }}>
            Your circle, celebrating<br/>each other automatically
          </h1>
          <p className="text-warm-500 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            A free shared account for up to 15 friends, family members, or teammates. Set everyone's special dates once — Thankeeu handles the cards, reminders, and group gift from there.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/pals/signup" className="btn-primary px-6 py-3.5 text-sm sm:text-base inline-flex items-center justify-center gap-2">
              <Icon name="Rocket" size={16} /> Start a free group
            </Link>
            <Link to="/pals/login" className="btn-secondary px-6 py-3.5 text-sm sm:text-base inline-flex items-center justify-center gap-2">
              <Icon name="ArrowRight" size={16} /> I already have a group
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-14 sm:py-20 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="font-bold text-warm-900 mb-3" style={{ fontSize: 'clamp(1.5rem,4vw,2.25rem)' }}>Everything your group needs</h2>
          <p className="text-warm-500 max-w-xl mx-auto">No admin work, no chasing contributions, no awkward "how much did everyone give" questions.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-2xl border border-purple-100 p-6">
              <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <Icon name={f.icon} size={20} className="text-primary-600" />
              </div>
              <h3 className="font-semibold text-warm-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-warm-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-14 sm:py-20" style={{ background: '#F8F7FF' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-bold text-warm-900 mb-3" style={{ fontSize: 'clamp(1.5rem,4vw,2.25rem)' }}>How it works</h2>
            <p className="text-warm-500">Four steps and you're set up for the year.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map(s => (
              <div key={s.num} className="bg-white rounded-2xl border border-purple-100 p-6 relative">
                <span className="text-xs font-bold text-primary-300 mb-3 block">{s.num}</span>
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mb-3">
                  <Icon name={s.icon} size={18} className="text-primary-600" />
                </div>
                <h3 className="font-semibold text-warm-900 mb-1.5 text-sm">{s.title}</h3>
                <p className="text-xs text-warm-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:py-24 text-center" style={{ background: 'linear-gradient(135deg,#7C3AED,#EC4899)' }}>
        <div className="max-w-xl mx-auto">
          <Icon name="Heart" size={36} className="text-white mx-auto mb-5" />
          <h2 className="font-bold text-white mb-4" style={{ fontSize: 'clamp(1.5rem,4vw,2.25rem)' }}>
            Ready to set up your group?
          </h2>
          <p className="text-white/80 mb-8">It takes about two minutes. Approval usually happens within 24 hours.</p>
          <Link to="/pals/signup" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-primary-700 font-bold text-sm sm:text-base hover:bg-purple-50 transition-colors">
            <Icon name="Rocket" size={16} /> Create your Pals group
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
