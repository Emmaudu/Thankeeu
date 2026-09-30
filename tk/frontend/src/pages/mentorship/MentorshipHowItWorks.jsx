import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { useSEO } from '../../hooks/useSEO';

const STEPS = [
  { icon: 'Users', title: 'Tell us your child\'s dream', body: 'Fill a short application with your details and the careers your child aspires to. Pick as many as you like.' },
  { icon: 'Heart', title: 'We match a mentor', body: 'We pair your child with a vetted professional who actually works in that field and loves guiding young people.' },
  { icon: 'Video', title: 'Live coaching begins', body: 'Two sessions a week on Google Meet, 30–45 minutes each — eight focused sessions every month.' },
  { icon: 'Target', title: 'Your child grows', body: 'Confidence rises, class becomes meaningful, and your child moves through school with real purpose.' },
];

export default function MentorshipHowItWorks() {
  useSEO({
    title: 'How it works — Thankeeu Mentorship',
    description: 'Four simple steps: apply, get matched with a mentor, start live weekly Google Meet coaching, and watch your child grow in confidence and purpose.',
    canonical: 'https://mentorship.thankeeu.com/how-it-works',
  });

  return (
    <div className="bg-white">
      <section className="bg-gradient-to-b from-primary-50 to-white py-16 px-4 text-center">
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-warm-900 mb-4">How it works</h1>
        <p className="text-lg text-warm-600 max-w-xl mx-auto">From application to your child's first mentor session — here's the journey.</p>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="space-y-6">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex gap-5 items-start bg-white rounded-3xl border border-primary-100 p-6 shadow-card">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white font-extrabold">
                {i + 1}
              </span>
              <div>
                <h3 className="font-bold text-lg text-warm-900 mb-1 flex items-center gap-2">
                  <Icon name={s.icon} size={20} className="text-primary-500" /> {s.title}
                </h3>
                <p className="text-warm-500 leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/apply" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary-500 text-white font-bold hover:bg-primary-600 shadow-purple">
            Start your child's application <Icon name="ArrowRight" size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
