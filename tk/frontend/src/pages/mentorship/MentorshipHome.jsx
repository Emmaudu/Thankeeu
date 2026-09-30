import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { useSEO } from '../../hooks/useSEO';

const STEPS = [
  { icon: 'Users', title: 'We match your child with a mentor', body: 'A real professional working in the exact career your child dreams about — vetted, experienced, and ready to guide.' },
  { icon: 'Video', title: 'Two live sessions every week', body: 'Face-to-face on Google Meet, 30–45 minutes each. Eight focused coaching sessions every month.' },
  { icon: 'Target', title: 'Your child gains purpose', body: 'They see the path clearly, take class seriously, and build the confidence that changes everything.' },
];

const OUTCOMES = [
  { icon: 'Sparkles', title: 'Confidence', body: 'Speaking to someone who made it makes the dream feel real — and reachable.' },
  { icon: 'Target', title: 'Purpose', body: 'A clear reason to study hard, because now they know exactly what it leads to.' },
  { icon: 'GraduationCap', title: 'Focus in class', body: 'Students who see the destination take the journey seriously.' },
  { icon: 'Heart', title: 'A role model', body: 'Someone in their corner who believes in them and shows them what is possible.' },
];

export default function MentorshipHome() {
  useSEO({
    title: 'Thankeeu Mentorship — Connect your child with a real career mentor',
    description: 'Pair your child with a professional in the career they dream of. Two live Google Meet coaching sessions a week. Build confidence, focus, and purpose.',
    canonical: 'https://mentorship.thankeeu.com/',
  });

  return (
    <div className="bg-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50 via-white to-white" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary-100/50 blur-3xl" />
        <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-rose-100/40 blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold mb-6">
            <Icon name="Sparkles" size={14} /> Mentorship that gives kids a reason to aim higher
          </span>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-warm-900 leading-[1.08] mb-5">
            Give your child a mentor who<br className="hidden sm:block" /> already lives their dream.
          </h1>
          <p className="text-lg sm:text-xl text-warm-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            We connect students with real professionals in the careers they aspire to — engineers, doctors, bankers, and more — for live weekly coaching that builds confidence, focus, and purpose.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/apply" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary-500 text-white font-bold text-base hover:bg-primary-600 shadow-purple transition-all inline-flex items-center justify-center gap-2">
              Enroll your child <Icon name="ArrowRight" size={18} />
            </Link>
            <Link to="/how-it-works" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border-2 border-primary-200 text-primary-700 font-bold text-base hover:bg-primary-50 transition-all">
              See how it works
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-warm-500">
            <span className="inline-flex items-center gap-1.5"><Icon name="Video" size={16} className="text-primary-500" /> Live on Google Meet</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="Clock" size={16} className="text-primary-500" /> 8 sessions / month</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="Shield" size={16} className="text-primary-500" /> Vetted professionals</span>
          </div>
        </div>
      </section>

      {/* ── Social proof stats ── */}
      <section className="border-y border-primary-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { n: '500+', l: 'Coaching sessions delivered' },
            { n: '250+', l: 'Professional mentors' },
            { n: '2×', l: 'Live sessions every week' },
            { n: '8', l: 'Sessions every month' },
          ].map(s => (
            <div key={s.l}>
              <p className="font-display font-extrabold text-3xl sm:text-4xl text-primary-600">{s.n}</p>
              <p className="text-warm-500 text-sm mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The problem / promise ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-warm-900 mb-4">
          Most kids study without knowing why.
        </h2>
        <p className="text-lg text-warm-600 leading-relaxed">
          When a child can picture the engineer, doctor, or entrepreneur they want to become — and talk to someone who actually got there — everything changes. School stops being a chore and starts being a path. Thankeeu Mentorship makes that connection real.
        </p>
      </section>

      {/* ── How it works ── */}
      <section className="bg-warm-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-warm-900 mb-3">How it works</h2>
            <p className="text-warm-500 text-lg">Three simple steps to a mentor who changes everything.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative bg-white rounded-3xl p-7 shadow-card">
                <span className="absolute -top-3 left-7 flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white text-sm font-extrabold">{i + 1}</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 mb-4 mt-2">
                  <Icon name={s.icon} size={24} />
                </span>
                <h3 className="font-bold text-lg text-warm-900 mb-2">{s.title}</h3>
                <p className="text-warm-500 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Outcomes ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-warm-900 mb-3">What your child gains</h2>
          <p className="text-warm-500 text-lg">More than tutoring — a transformation in how they see their future.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {OUTCOMES.map(o => (
            <div key={o.title} className="rounded-3xl border border-primary-100 p-6 hover:shadow-card-hover transition-shadow">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white mb-4">
                <Icon name={o.icon} size={22} />
              </span>
              <h3 className="font-bold text-warm-900 mb-1.5">{o.title}</h3>
              <p className="text-warm-500 text-sm leading-relaxed">{o.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Founder credibility ── */}
      <section className="bg-warm-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 items-center">
          <div className="grid grid-cols-2 gap-4">
            <img src="/mentorship/founder-studio.jpg" alt="Emmanuel Uduebholo, founder of Thankeeu Mentorship"
              className="col-span-2 w-full rounded-3xl object-cover shadow-card" loading="lazy" />
            <img src="/mentorship/founder-portrait.jpg" alt="Emmanuel Uduebholo"
              className="w-full rounded-2xl object-cover aspect-square shadow-card" loading="lazy" />
            <div className="rounded-2xl bg-white border border-primary-100 p-5 flex flex-col justify-center">
              <p className="font-display font-extrabold text-lg text-warm-900 leading-tight">Emmanuel Uduebholo</p>
              <p className="text-warm-500 text-sm">Founder, Thankeeu Mentorship</p>
            </div>
          </div>
          <div>
            <span className="inline-block text-xs font-bold text-primary-600 bg-primary-100 px-3 py-1.5 rounded-full mb-4">A REAL PERSON, A REAL MISSION</span>
            <h2 className="font-display font-extrabold text-3xl text-warm-900 mb-4">Built by someone who's done this before</h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              I'm Emmanuel — founder of Thankeeu. While studying at Covenant University, I built Mentorships.ng to connect students with mentors across industries. Thankeeu Mentorship is that same mission, done properly: matching your child with a real professional who will show up, week after week, and help them believe in what's possible.
            </p>
            <Link to="/about" className="inline-flex items-center gap-2 text-primary-600 font-bold hover:underline">
              Read my full story <Icon name="ArrowRight" size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── The offer ── */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl mb-6">What's included every month</h2>
          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto mb-10 text-left">
            {[
              '8 live coaching sessions (2 per week)',
              '30–45 minutes each, on Google Meet',
              'A mentor matched to your child\'s dream career',
              'Guidance, confidence-building & clear learning pathways',
            ].map(item => (
              <div key={item} className="flex items-start gap-3 bg-white/10 rounded-2xl px-4 py-3.5">
                <Icon name="Check" size={20} className="text-teal-300 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-semibold">{item}</span>
              </div>
            ))}
          </div>
          <Link to="/pricing" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-primary-700 font-bold text-base hover:bg-primary-50 transition-all">
            See pricing & enroll <Icon name="ArrowRight" size={18} />
          </Link>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-warm-900 mb-4">
          The right mentor at the right age changes a life.
        </h2>
        <p className="text-lg text-warm-600 mb-8">
          Give your child the guidance you wish you had. It starts with one form.
        </p>
        <Link to="/apply" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary-500 text-white font-bold text-base hover:bg-primary-600 shadow-purple transition-all">
          Enroll your child today <Icon name="ArrowRight" size={18} />
        </Link>
      </section>
    </div>
  );
}
