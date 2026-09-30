import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { useSEO } from '../../hooks/useSEO';

export default function MentorshipAbout() {
  useSEO({
    title: 'About — Thankeeu Mentorship',
    description: 'Thankeeu Mentorship is a subsidiary of Thankeeu, founded by Emmanuel Uduebholo. We connect students with real career professionals for live weekly coaching.',
    canonical: 'https://mentorship.thankeeu.com/about',
  });

  return (
    <div className="bg-white">
      <section className="bg-gradient-to-b from-primary-50 to-white py-16 px-4 text-center">
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-warm-900 mb-4">About Thankeeu Mentorship</h1>
        <p className="text-lg text-warm-600 max-w-2xl mx-auto">
          We believe every child deserves to meet someone who has walked the path they dream of.
        </p>
      </section>

      {/* ── Founder ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="order-2 lg:order-1">
            <span className="inline-block text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full mb-4">MEET THE FOUNDER</span>
            <h2 className="font-display font-extrabold text-3xl text-warm-900 mb-4">Emmanuel Uduebholo</h2>
            <div className="space-y-4 text-warm-600 leading-relaxed">
              <p>
                Emmanuel is the founder of Thankeeu Mentorship and the founder and CEO of <a href="https://www.thankeeu.com" className="text-primary-600 font-semibold hover:underline">Thankeeu</a>, the digital group-card and gifting company. Mentorship isn't a new direction for him — it's where he started.
              </p>
              <p>
                While still a student at <strong>Covenant University</strong>, Emmanuel launched <strong>Mentorships.ng</strong>, a platform connecting students with mentors across industries. It was his first experience building something designed around human connection at scale — and the seed of everything that came after. His time at Covenant's <strong>Hebron Startup Lab in 2017</strong> he describes as one of the most transformative periods of his life.
              </p>
              <p>
                His career began in telecom as a <strong>network engineer at Huawei</strong>, working on the integration and optimization of 2G, 3G and 4G networks — an experience that shaped how he thinks about systems that work quietly in the background while powering meaningful experiences. He went on to build <strong>Meeula</strong>, a smart business-card product, and worked on <strong>Selbolt</strong> across strategic partnerships and technology, before founding Thankeeu.
              </p>
              <p>
                Thankeeu Mentorship brings his journey full circle: connecting the next generation with the professionals who can guide them, exactly as he set out to do in university.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="https://ng.linkedin.com/in/emmanuel-uduebholo-83268111b" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-primary-200 text-primary-700 font-bold text-sm hover:bg-primary-50">
                <Icon name="Linkedin" size={16} /> Connect on LinkedIn
              </a>
            </div>
          </div>
          <div className="order-1 lg:order-2 grid grid-cols-2 gap-4">
            <img src="/mentorship/founder-studio.jpg" alt="Emmanuel Uduebholo, founder of Thankeeu Mentorship"
              className="col-span-2 w-full rounded-3xl object-cover shadow-card" loading="lazy" />
            <img src="/mentorship/founder-portrait.jpg" alt="Emmanuel Uduebholo"
              className="w-full rounded-2xl object-cover aspect-square shadow-card" loading="lazy" />
            <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white p-5 flex flex-col justify-center">
              <p className="font-display font-extrabold text-2xl leading-tight">Real founder.</p>
              <p className="font-display font-extrabold text-2xl leading-tight text-primary-100">Real mission.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 space-y-8">
        <div>
          <h2 className="font-display font-bold text-2xl text-warm-900 mb-3">Our mission</h2>
          <p className="text-warm-600 leading-relaxed">
            Thankeeu Mentorship connects students with real professionals working in the careers those students aspire to. Through consistent, live coaching, we help young people build confidence, take their studies seriously, and discover a genuine sense of purpose — long before they have to choose a path.
          </p>
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl text-warm-900 mb-3">A subsidiary of Thankeeu</h2>
          <p className="text-warm-600 leading-relaxed">
            Thankeeu Mentorship is a subsidiary of <a href="https://www.thankeeu.com" className="text-primary-600 font-semibold hover:underline">Thankeeu</a>, a global digital greeting card company that helps people celebrate and connect with the people who matter. Mentorship is a natural extension of that mission: connecting the next generation with the mentors who can shape their futures.
          </p>
        </div>
        <div className="rounded-3xl bg-primary-50 p-7">
          <h2 className="font-display font-bold text-xl text-warm-900 mb-4">What sets us apart</h2>
          <ul className="space-y-3">
            {[
              'Mentors are real, working professionals — not generic tutors',
              'Live face-to-face sessions on Google Meet, twice a week',
              'A focus on confidence, purpose, and clear learning pathways',
              "Careful matching between each child's dream and the right mentor",
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5 text-warm-600">
                <Icon name="Check" size={18} className="text-primary-500 flex-shrink-0 mt-0.5" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-center pt-4">
          <Link to="/apply" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary-500 text-white font-bold hover:bg-primary-600 shadow-purple">
            Enroll your child <Icon name="ArrowRight" size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
