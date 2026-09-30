import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import Footer from '../components/Footer';

export default function CultureEngagements() {
  useSEO({
    title: 'Culture and Engagements - Thankeeu Games',
    description: 'Build company culture with Thankeeu Games, weekly inter-company employee engagement leagues, public leaderboards and automatic congratulations group cards with messages, GIFs, photos, videos and voice notes.',
    canonical: '/culture-and-engagements',
    keywords: 'employee engagement games, workplace culture platform, inter-company games, employee recognition games, department quiz league, culture and engagement',
    jsonLd: {
      '@type': 'WebPage',
      name: 'Thankeeu Culture and Engagements',
      description: 'Thankeeu Games helps companies build culture with weekly department games, employee recognition, public leaderboards and congratulations group cards signed with messages, GIFs, photos, videos and voice notes.',
      url: 'https://www.thankeeu.com/culture-and-engagements',
      about: [
        'Employee engagement',
        'Company culture',
        'Employee recognition',
        'Inter-company games',
        'Workplace competitions'
      ]
    }
  });

  const features = [
    ['Unlimited companies', 'Any number of companies can join a weekly department game. The league stays open and competitive.'],
    ['Two players per company', 'Each company can nominate or allow up to two employees per department game per week.'],
    ['Friday 2pm play', 'Every department game happens weekly on Friday at 2pm with 10 timed questions.'],
    ['Automatic winner cards', 'Department winners receive a congratulations group card created automatically inside their Games dashboard.'],
    ['Players sign first', 'Everyone who played that department game is invited to sign the winner card with messages, GIFs, photos, videos or voice notes.'],
    ['Visitors can sign too', 'People viewing the public leaderboard can open a winner row and add a congratulations message or media without playing.'],
    ['Tuesday delivery', 'Signed congratulations cards are delivered to winners on Tuesday at 10am.']
  ];

  const departments = [
    'Accountants',
    'Network Engineers',
    'Data Scientists',
    'Frontend Engineers',
    'Backend Engineers',
    'Cloud Engineers',
    'HR Teams',
    'Product Managers',
    'Sales Teams',
    'Customer Success'
  ];

  return (
    <>
    <main className="min-h-screen bg-[#fbf9ff] text-warm-900">
      <section className="bg-[#120b24] px-4 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary-200">Culture and engagements</p>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <h1 className="text-4xl font-black leading-tight md:text-6xl">Turn employee engagement into a weekly company championship.</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white">
                Thankeeu Games is an inter-company employee engagement league where departments compete every Friday,
                employees build pride in their craft, and winners are celebrated with automatic congratulations group cards that players and visitors can sign with messages, GIFs, photos, videos and voice notes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/games" className="rounded-xl bg-primary-500 px-6 py-3 text-sm font-black text-white hover:bg-primary-600">
                  Open Thankeeu Games
                </Link>
                <Link to="/business" className="rounded-xl border border-white/20 px-6 py-3 text-sm font-black text-white hover:bg-white/10">
                  Explore company workspaces
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/8 p-6 shadow-2xl">
              <div className="grid grid-cols-2 gap-3">
                {departments.map((dept, index) => (
                  <div key={dept} className="rounded-2xl bg-white p-4 text-[#120b24]">
                    <p className="text-xs font-black text-primary-500">#{index + 1}</p>
                    <p className="mt-2 font-black">{dept}</p>
                    <p className="mt-1 text-xs text-warm-500">Friday 2pm league</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-primary-500">Employee recognition built in</p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">Games do not end at the leaderboard.</h2>
            <p className="mt-4 text-warm-500">
              Each department winner gets a congratulations group card automatically. Everyone who played that department game is invited to sign it with a message, GIF, photo, video or voice note,
              reminded immediately after the game and again on Monday at 10am. Site visitors who discover the winner from the public leaderboard can also sign the card, and the finished card is sent to the winner on Tuesday at 10am.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                <h3 className="font-black text-warm-900">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-warm-500">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-primary-500">For HR and people teams</p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">A culture ritual employees can actually join.</h2>
            <p className="mt-4 text-warm-500">
              Thankeeu Games gives remote, hybrid and office teams a recurring employee engagement moment: department-based brain games,
              co-player discovery, public leaderboards, visitor-signed multimedia congratulations cards, private dashboards, score posters and recognition cards.
            </p>
          </div>
          <div className="rounded-3xl bg-[#120b24] p-6 text-white">
            <p className="text-sm font-black text-primary-200">Weekly engagement loop</p>
            <ol className="mt-5 space-y-4">
              {['Employees register with company email', 'Two players per company join each department game', 'Players compete Friday at 2pm', 'Leaderboard ranks score and speed', 'Players and visitors sign the winner card'].map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-white text-sm font-black text-[#120b24]">{index + 1}</span>
                    <span className="pt-1 text-white/90">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </main>
    <Footer />
    </>
  );
}
