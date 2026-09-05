import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSEO } from '../../hooks/useSEO';
import { gamesAPI } from '../../utils/api';
import { isGamesHost } from '../../utils/workspace';
import { openFlwCheckout } from '../../utils/flwInline';
import Icon from '../../components/ui/Icon';
import { asArray } from '../../utils/asArray';

const themes = {
  indigo: 'from-indigo-600 to-violet-700',
  emerald: 'from-emerald-600 to-teal-700',
  amber: 'from-amber-500 to-orange-700',
  rose: 'from-rose-500 to-fuchsia-700',
  cyan: 'from-cyan-600 to-blue-700',
};

const lightPageClass = 'min-h-screen bg-[#f8f6ff] text-[#201a33] flex flex-col';
const darkPageClass = 'min-h-screen bg-[#120b24] text-white flex flex-col';
const mainClass = 'flex-1';
const inputContrastClass = 'text-[#201a33] placeholder:text-[#7a718f]';

const fieldIconRules = [
  [/account|finance|payroll|audit|tax|bank|treasury|bookkeep/i, 'PieChart'],
  [/data|analyst|analytics|scientist|business intelligence|bi/i, 'BarChart'],
  [/network|telecom|infrastructure|system admin|it support|support/i, 'Radio'],
  [/cloud|devops|platform|site reliability|sre/i, 'Rocket'],
  [/frontend|designer|design|creative|product design|ui|ux/i, 'Layout'],
  [/backend|software|developer|engineer|programmer|technical/i, 'Monitor'],
  [/security|cyber|risk|compliance|privacy/i, 'ShieldCheck'],
  [/hr|people|talent|recruit|culture|employee/i, 'Users'],
  [/sales|growth|business development|revenue|commercial/i, 'TrendingUp'],
  [/marketing|brand|content|social media|communications|pr/i, 'Presentation'],
  [/legal|law|governance|policy/i, 'Shield'],
  [/health|medical|clinical|nurse|doctor|wellness/i, 'HeartPulse'],
  [/teacher|education|training|learning|school/i, 'GraduationCap'],
  [/logistics|supply|warehouse|transport|fleet|operations/i, 'Package'],
  [/manufacturing|production|quality|maintenance|factory/i, 'Settings'],
  [/project|program|scrum|agile|delivery/i, 'Flag'],
  [/customer|success|service|experience|care/i, 'Message'],
  [/procurement|purchase|vendor|store|retail/i, 'Cart'],
  [/admin|office|executive|assistant|facility/i, 'Briefcase'],
];

const getGameIcon = (game) => {
  const text = `${game?.name || ''} ${game?.category || ''} ${game?.description || ''}`;
  const match = fieldIconRules.find(([rule]) => rule.test(text));
  return match ? match[1] : 'Award';
};

const GameCharacter = ({ side = 'left' }) => (
  <div className="relative h-16 w-12 shrink-0" aria-hidden="true">
    <span className={`absolute top-6 h-1.5 w-8 rounded-full bg-white/80 ${side === 'left' ? '-left-3 -rotate-45' : '-right-3 rotate-45'}`} />
    <span className={`absolute top-7 h-1.5 w-8 rounded-full bg-white/80 ${side === 'left' ? 'right-0 rotate-45' : 'left-0 -rotate-45'}`} />
    <span className="absolute left-2 top-0 h-8 w-8 rounded-full bg-white shadow-lg">
      <span className="absolute left-2 top-3 h-1.5 w-1.5 rounded-full bg-[#120b24]" />
      <span className="absolute right-2 top-3 h-1.5 w-1.5 rounded-full bg-[#120b24]" />
      <span className="absolute bottom-2 left-1/2 h-1 w-3 -translate-x-1/2 rounded-full bg-[#7C6EFF]" />
    </span>
    <span className="absolute bottom-0 left-1 h-10 w-10 rounded-t-2xl bg-white/25 ring-1 ring-white/30" />
    <span className="absolute bottom-2 left-4 h-5 w-4 rounded-t-xl bg-white/80" />
  </div>
);

const GameArtwork = ({ game }) => {
  const icon = getGameIcon(game);
  return (
    <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${themes[game.image_theme] || themes.indigo} p-4 text-white`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(255,255,255,0.28),transparent_24%),radial-gradient(circle_at_82%_22%,rgba(255,255,255,0.18),transparent_22%)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
      <span className="absolute left-5 top-5 h-2 w-2 rounded-full bg-white/80" />
      <span className="absolute left-20 top-9 h-2 w-7 rotate-12 rounded-full bg-amber-200/90" />
      <span className="absolute right-24 top-6 h-2 w-2 rounded-full bg-fuchsia-200/90" />
      <span className="absolute right-8 top-12 h-2 w-8 -rotate-12 rounded-full bg-cyan-200/90" />
      <div className="absolute inset-y-0 right-0 z-0 flex w-[58%] items-end justify-end opacity-40">
        <div className="relative h-full w-full">
          <div className="absolute right-7 top-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white shadow-lg ring-1 ring-white/25 backdrop-blur-sm">
            <Icon name={icon} size={30} strokeWidth={2.25} />
          </div>
          <div className="absolute bottom-5 right-3 flex items-end gap-1">
            <GameCharacter side="left" />
            <GameCharacter side="right" />
          </div>
          <div className="absolute bottom-7 right-20 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-[#120b24] shadow-md">
            Hurray
          </div>
        </div>
      </div>
      <div className="relative z-10 flex h-full items-start">
        <div className="min-w-0 max-w-[88%] rounded-2xl bg-black/20 p-2 backdrop-blur-[1px]">
          <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-white/95">{game.category}</p>
          <p className="mt-2 line-clamp-3 text-base font-black leading-tight text-white drop-shadow-md">{game.name}</p>
        </div>
      </div>
    </div>
  );
};

const getPlayer = () => {
  try { return JSON.parse(localStorage.getItem('thankeeu_games_player') || 'null'); }
  catch { return null; }
};

const getGamesCompany = () => {
  try { return JSON.parse(localStorage.getItem('thankeeu_games_company') || 'null'); }
  catch { return null; }
};

const setSession = ({ token, player }) => {
  localStorage.setItem('thankeeu_games_token', token);
  localStorage.setItem('thankeeu_games_player', JSON.stringify(player));
};

const setCompanySession = ({ token, company }) => {
  localStorage.setItem('thankeeu_games_company_token', token);
  localStorage.setItem('thankeeu_games_company', JSON.stringify(company));
};

const gamesPath = (path = '') => {
  const clean = path ? `/${String(path).replace(/^\/+/, '')}` : '';
  return isGamesHost() ? clean || '/' : `/games${clean}`;
};

const GamesNav = () => {
  const player = getPlayer();
  const gamesCompany = getGamesCompany();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const section = (() => {
    const path = location.pathname.replace(/^\/games/, '').replace(/^\/+/, '');
    if (!path) return 'Games';
    const first = path.split('/')[0];
    if (first === 'leaderboard') return 'Leaderboard';
    if (first === 'dashboard') return 'Dashboard';
    if (first === 'company') return 'Company';
    if (first === 'login') return 'Login';
    if (first === 'signup') return 'Signup';
    return 'Game';
  })();
  const logout = () => {
    localStorage.removeItem('thankeeu_games_token');
    localStorage.removeItem('thankeeu_games_player');
    localStorage.removeItem('thankeeu_games_company_token');
    localStorage.removeItem('thankeeu_games_company');
    window.location.href = gamesPath();
  };
  const linkBase = 'rounded-xl px-3 py-2 text-sm font-bold transition-colors';
  const linkActive = 'bg-white text-[#120b24]';
  const linkIdle = 'text-white/90 hover:bg-white/10 hover:text-white';
  const navItems = [
    { label: 'Games', to: gamesPath() },
    { label: 'Leaderboard', to: gamesPath('leaderboard') },
    { label: 'Gifts', to: gamesPath('gifts') },
    { label: 'Sponsor', to: gamesPath('sponsor') },
    ...(player ? [{ label: 'Dashboard', to: gamesPath('dashboard'), primary: true }] : []),
    ...(gamesCompany ? [{ label: 'Company dashboard', to: gamesPath(`company/${gamesCompany.slug}`), primary: true }] : []),
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#120b24]/95 text-white shadow-[0_10px_32px_rgba(18,11,36,0.22)] backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link to={gamesPath()} className="flex min-w-0 items-center gap-3" onClick={() => setMobileOpen(false)}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-white/20">
            <img src="/android-chrome-192x192.png" alt="Thankeeu" className="h-full w-full rounded-lg object-cover" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black leading-none sm:text-base">thank<span className="text-primary-300">eeu</span> games</p>
            <p className="hidden truncate text-[11px] text-white/85 sm:block">Inter-company league</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map(item => (
            <Link
              key={item.label}
              to={item.to}
              className={`${linkBase} ${item.primary ? linkActive : linkIdle}`}
            >
              {item.label}
            </Link>
          ))}
          {player || gamesCompany ? (
            <button onClick={logout} className={`${linkBase} ${linkIdle}`}>Logout</button>
          ) : (
            <>
              <Link to={gamesPath('login')} className={`${linkBase} ${linkIdle}`}>Login</Link>
              <Link to={gamesPath('signup')} className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary-900/20 transition-colors hover:bg-primary-400">Signup</Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white">{section}</span>
          <button
            type="button"
            onClick={() => setMobileOpen(v => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white"
            aria-label={mobileOpen ? 'Close games menu' : 'Open games menu'}
            aria-expanded={mobileOpen}
          >
            <Icon name={mobileOpen ? 'Close' : 'Menu'} size={19} />
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#120b24] px-4 pb-4 md:hidden">
          <nav className="mx-auto grid max-w-7xl gap-2 pt-3" aria-label="Games mobile menu">
            {navItems.map(item => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`rounded-2xl px-4 py-3 text-sm font-bold ${item.primary ? 'bg-white text-[#120b24]' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {item.label}
              </Link>
            ))}
            {player || gamesCompany ? (
              <button onClick={logout} className="rounded-2xl bg-white/10 px-4 py-3 text-left text-sm font-bold text-white">Logout</button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to={gamesPath('login')} onClick={() => setMobileOpen(false)} className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-bold text-white">Login</Link>
                <Link to={gamesPath('signup')} onClick={() => setMobileOpen(false)} className="rounded-2xl bg-primary-500 px-4 py-3 text-center text-sm font-bold text-white">Signup</Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

const GamesFooter = () => (
  <footer className="mt-auto bg-[#0c0718] px-4 py-7 !text-white sm:py-8 [&_*]:!text-white" style={{ color: '#fff' }}>
    <div className="mx-auto grid max-w-7xl gap-5 text-center sm:text-left md:grid-cols-3">
      <div>
        <p className="text-sm font-black">Thankeeu Games</p>
        <p className="mt-2 text-xs leading-5 text-white sm:text-sm">Friday 2pm department games for employee engagement, recognition and friendly inter-company competition.</p>
      </div>
      <div className="text-xs leading-5 text-white sm:text-sm">
        <p className="font-bold text-white">Rules</p>
        <p className="mt-2">Unlimited companies can join each game. Only 2 employees per company can play a department game each week.</p>
      </div>
      <div className="text-xs leading-5 text-white sm:text-sm">
        <p className="font-bold text-white">Managed by Thankeeu</p>
        <p className="mt-2">Questions reset every Sunday. The normal Thankeeu admin controls games from the admin dashboard.</p>
      </div>
    </div>
  </footer>
);

const GameCard = ({ game }) => (
  <Link to={gamesPath(game.slug)} className="group overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-sm ring-1 ring-white/70 transition duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-2xl">
    <GameArtwork game={game} />
    <div className="p-4">
      <p className="line-clamp-3 min-h-[60px] text-sm leading-5 text-[#4c435f]">{game.description}</p>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-[#4f46e5]">
        <span className="rounded-full bg-primary-50 px-2.5 py-1">Friday 2pm</span>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">Open game</span>
      </div>
    </div>
  </Link>
);

const GamesHeroShowcase = () => (
  <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/10 p-4 shadow-2xl shadow-black/20 backdrop-blur">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.28),transparent_26%),radial-gradient(circle_at_90%_15%,rgba(251,191,36,0.22),transparent_24%)]" />
    <div className="relative">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/80">Live Friday Arena</p>
          <p className="mt-1 text-base font-black text-white sm:text-lg">Department League</p>
        </div>
        <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-black text-[#052e1b]">2pm</span>
      </div>
      <div className="mt-5 grid gap-3">
        {[
          ['Data Science', '92%', 'BarChart'],
          ['Cloud Engineering', '88%', 'Rocket'],
          ['People Ops', '84%', 'Users'],
        ].map(([name, score, icon], idx) => (
          <div key={name} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#120b24]">
              <Icon name={icon} size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-white">{name}</p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-200 to-emerald-200" style={{ width: score }} />
              </div>
            </div>
            <span className="text-sm font-black text-white">{idx + 1}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-end justify-between rounded-2xl bg-[#0c0718]/60 p-4 ring-1 ring-white/10">
        <div>
          <p className="text-xs font-bold text-white/80">Weekly winners get</p>
          <p className="mt-1 text-base font-black text-white">Auto congratulations cards</p>
        </div>
        <Icon name="Party" size={30} className="text-amber-200" />
      </div>
    </div>
  </div>
);

export const GamesHome = () => {
  const [departments, setDepartments] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [week, setWeek] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [loadingGames, setLoadingGames] = useState(true);
  useSEO({
    title: 'Thankeeu Games - Employee Engagement League',
    description: 'Thankeeu Games is an inter-company employee engagement league with Friday 2pm department games, public leaderboards and company teams.',
    canonical: 'https://www.thankeeu.com/games',
    keywords: 'employee engagement games, inter-company league, workplace quiz games, department games, employee recognition leaderboard',
  });

  useEffect(() => {
    let active = true;
    const t = setTimeout(() => {
      const search = q.trim();
      setLoadingGames(true);
      gamesAPI.listDepartments(search ? { q: search } : {}).then(res => {
        if (!active) return;
        setDepartments(res.data.departments || []);
        setWeek(res.data.week);
      }).catch(() => {
        if (active) {
          setDepartments([]);
          toast.error('Could not load games');
        }
      }).finally(() => {
        if (active) setLoadingGames(false);
      });
    }, 180);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q]);
  useEffect(() => {
    gamesAPI.sponsorships().then(res => setSponsors(res.data.sponsors || [])).catch(() => {});
  }, []);

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(departments.length / pageSize));
  const visible = departments.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className={lightPageClass}>
      <GamesNav />
      <section className="relative overflow-hidden bg-[#120b24] px-4 py-8 text-white sm:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_15%,rgba(124,110,255,0.34),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(236,72,153,0.22),transparent_28%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-7 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-100 sm:text-sm sm:tracking-[0.2em]">Employee engagement league</p>
            <h1 className="mt-3 max-w-3xl text-2xl font-black leading-tight text-white sm:text-3xl lg:text-4xl">Inter-company department games employees actually want to play.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">Every Friday at 2pm, teams compete in brainy department games with public leaderboards, automatic scoring, and winner celebration cards.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {['10 questions', '2 players/company', 'Public leaderboard'].map(item => (
                <div key={item} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-bold text-white sm:text-sm">{item}</div>
              ))}
            </div>
          </div>
          <GamesHeroShowcase />
        </div>
      </section>
      <main className={`${mainClass} mx-auto w-full max-w-7xl px-4 py-8 sm:py-10`}>
        {!!sponsors.length && (
          <section className="mb-8 overflow-hidden rounded-3xl bg-[#120b24] p-5 text-white shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-primary-100">This week's sponsors</p>
                <h2 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">Businesses funding winner gifts</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">Sponsors pledge weekly rewards for selected department winners and get promoted across Thankeeu Games.</p>
              </div>
              <Link to={gamesPath('sponsor')} className="inline-flex w-full justify-center rounded-xl bg-white px-4 py-3 text-sm font-black text-[#120b24] sm:w-auto">Sponsor winners</Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sponsors.slice(0, 6).map(sponsor => (
                <div key={sponsor.id} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="break-words text-base font-black text-white">{sponsor.sponsor_company}</p>
                  <p className="mt-1 text-sm font-bold text-white/85">NGN {Number(sponsor.amount || 0).toLocaleString()} for {sponsor.week_key}</p>
                  <p className="mt-2 text-xs leading-5 text-white/75">
                    {(sponsor.games_sponsorship_allocations || []).slice(0, 3).map(a => a.games_departments?.name).filter(Boolean).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black leading-tight text-[#201a33] sm:text-2xl">Choose your department game</h2>
            <p className="text-sm text-[#5f5672]">This week: {week?.week_key || 'loading'} - play day is Friday 2pm.</p>
          </div>
          <div className="relative w-full md:max-w-md">
            <Icon name="Search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b607d]" />
            <input
              value={q}
              onChange={e => {
                setQ(e.target.value);
                setPage(1);
              }}
              className={`input w-full pl-10 pr-10 ${inputContrastClass}`}
              placeholder="Search games, departments or roles..."
              aria-label="Search department games"
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ('');
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#6b607d] hover:bg-purple-50 hover:text-[#201a33]"
                aria-label="Clear games search"
              >
                <Icon name="Close" size={15} />
              </button>
            )}
          </div>
        </div>
        <div className="mb-4 flex items-center justify-between gap-3 text-sm text-[#5f5672]">
          <p>{loadingGames ? 'Searching games...' : `${departments.length} game${departments.length === 1 ? '' : 's'} found`}</p>
          {q.trim() && <p className="truncate text-right">Search: <span className="font-bold text-[#201a33]">{q.trim()}</span></p>}
        </div>
        {loadingGames ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-3xl bg-white shadow-sm" />)}
          </div>
        ) : departments.length ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {visible.map(game => <GameCard key={game.id} game={game} />)}
            </div>
            <div className="mt-8 flex items-center justify-center gap-3">
              <button className="btn-secondary px-4 py-2" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
              <span className="text-sm font-semibold text-[#4c435f]">Page {page} of {totalPages}</span>
              <button className="btn-secondary px-4 py-2" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-purple-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
              <Icon name="Search" size={22} />
            </div>
            <p className="mt-4 font-black text-[#201a33]">No department games found</p>
            <p className="mt-2 text-sm text-[#5f5672]">Try another department, role, skill, or field name.</p>
            <button type="button" onClick={() => setQ('')} className="btn-secondary mt-5 px-4 py-2">Clear search</button>
          </div>
        )}
      </main>
      <GamesFooter />
    </div>
  );
};

export const GamesAuth = ({ mode }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', username: '', email: '', password: '', job_title: '', avatar_url: '' });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const isSignup = mode === 'signup';
  useSEO({ title: `${isSignup ? 'Signup' : 'Login'} - Thankeeu Games`, noIndex: true });
  const uploadAvatar = async (file) => {
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      toast.error('Upload an image file for your profile photo');
      return;
    }
    try {
      setUploadingAvatar(true);
      const res = await gamesAPI.uploadAvatar(file);
      setForm(prev => ({ ...prev, avatar_url: res.data.url }));
      toast.success('Profile photo uploaded');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not upload profile photo');
    } finally {
      setUploadingAvatar(false);
    }
  };
  const submit = async (e) => {
    e.preventDefault();
    if (isSignup && !form.avatar_url) {
      toast.error('Upload a profile photo before joining the league');
      return;
    }
    try {
      const res = isSignup ? await gamesAPI.signup(form) : await gamesAPI.login({ email: form.email, password: form.password });
      setSession(res.data);
      toast.success(isSignup ? 'Welcome to Thankeeu Games' : 'Welcome back');
      navigate(gamesPath('dashboard'));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not continue');
    }
  };
  return (
    <div className={darkPageClass}>
      <GamesNav />
      <main className={`${mainClass} mx-auto flex w-full max-w-md items-center px-4 py-8 sm:py-12`}>
        <form onSubmit={submit} className="w-full rounded-3xl bg-white p-6 text-[#201a33] shadow-2xl sm:p-7">
          <h1 className="text-2xl font-black leading-tight">{isSignup ? 'Create games profile' : 'Login to games'}</h1>
          <p className="mt-2 text-sm text-[#5f5672]">Use your company email. Gmail and other personal emails are rejected.</p>
          <div className="mt-6 space-y-4">
            {isSignup && <input className={`input ${inputContrastClass}`} required placeholder="Full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />}
            {isSignup && <input className={`input ${inputContrastClass}`} required minLength={3} placeholder="Username for forums, e.g. ada_finance" value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9_]/g, '') })} />}
            <input type="email" className={`input ${inputContrastClass}`} required placeholder="you@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            {isSignup && <input className={`input ${inputContrastClass}`} placeholder="Job title" value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} />}
            {isSignup && (
              <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-primary-600 ring-1 ring-purple-100">
                    {form.avatar_url ? <img src={form.avatar_url} alt="" className="h-full w-full object-cover" /> : <Icon name="Camera" size="lg" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-[#201a33]">Profile photo</p>
                    <p className="mt-1 text-xs leading-5 text-[#5f5672]">Required for leaderboards and result posters.</p>
                  </div>
                </div>
                <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#4f46e5] ring-1 ring-purple-100 transition hover:bg-primary-50">
                  <Icon name="Upload" size="sm" />
                  {uploadingAvatar ? 'Uploading...' : form.avatar_url ? 'Change photo' : 'Upload photo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={uploadingAvatar}
                    onChange={e => uploadAvatar(e.target.files?.[0])}
                  />
                </label>
              </div>
            )}
            <input type="password" className={`input ${inputContrastClass}`} required minLength={8} placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn-primary mt-6 w-full py-3" disabled={uploadingAvatar}>{uploadingAvatar ? 'Uploading photo...' : isSignup ? 'Join the league' : 'Login'}</button>
          <p className="mt-4 text-center text-sm text-[#5f5672]">
            {isSignup ? 'Already registered?' : 'New to Thankeeu Games?'}{' '}
            <Link className="font-bold text-[#4f46e5]" to={isSignup ? gamesPath('login') : gamesPath('signup')}>{isSignup ? 'Login' : 'Signup'}</Link>
          </p>
        </form>
      </main>
    </div>
  );
};

const DepartmentForum = ({ slug, departmentName }) => {
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const player = getPlayer();
  const load = () => gamesAPI.forum(slug).then(res => setPosts(res.data.posts || [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, [slug]);
  const submit = async (e) => {
    e.preventDefault();
    if (!localStorage.getItem('thankeeu_games_token')) return toast.error('Login as an employee to join the discussion');
    try {
      const res = await gamesAPI.postForum(slug, { message });
      setPosts(prev => [...prev, res.data.post]);
      setMessage('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not post message');
    }
  };
  return (
    <section className="mx-auto mb-8 w-full max-w-7xl px-4">
      <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary-700">Department forum</p>
            <h2 className="mt-2 text-xl font-black text-[#201a33]">{departmentName} discussion</h2>
          </div>
          <p className="text-sm text-[#5f5672]">Use your required username to connect with competitors.</p>
        </div>
        <div className="mt-5 max-h-[380px] space-y-3 overflow-y-auto pr-1">
          {loading ? <p className="text-sm text-[#5f5672]">Loading discussion...</p> : posts.map(post => (
            <div key={post.id} className="flex gap-3 rounded-2xl border border-purple-100 p-3">
              <img src={post.games_players?.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="break-words text-sm font-black text-[#201a33]">@{post.games_players?.username || 'player'} <span className="font-semibold text-[#5f5672]">- {post.games_players?.company_name}</span></p>
                <p className="mt-1 break-words text-sm leading-6 text-[#4c435f]">{post.message}</p>
              </div>
            </div>
          ))}
          {!loading && !posts.length && <p className="rounded-2xl bg-primary-50 p-4 text-sm text-[#5f5672]">No messages yet. Start the department discussion.</p>}
        </div>
        <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input className={`input ${inputContrastClass}`} required maxLength={1000} placeholder={player?.username ? `Post as @${player.username}` : 'Login to join this department forum'} value={message} onChange={e => setMessage(e.target.value)} />
          <button className="btn-primary px-5 py-3">Post</button>
        </form>
      </div>
    </section>
  );
};

export const GamesProfile = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  useEffect(() => { gamesAPI.getDepartment(slug).then(res => setData(res.data)).catch(() => toast.error('Game not found')); }, [slug]);
  if (!data) return <div className={lightPageClass}><GamesNav /><div className={`${mainClass} p-10 text-center text-[#201a33]`}>Loading game...</div><GamesFooter /></div>;
  const { department, week, registrations } = data;
  const register = async () => {
    if (!localStorage.getItem('thankeeu_games_token')) return navigate(gamesPath('signup'));
    try {
      await gamesAPI.register(slug);
      toast.success('Registered for Friday 2pm');
      const res = await gamesAPI.getDepartment(slug);
      setData(res.data);
    } catch (err) { toast.error(err.response?.data?.error || 'Registration failed'); }
  };
  return (
    <div className={lightPageClass}>
      <GamesNav />
      <main className={`${mainClass} mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:py-10 lg:grid-cols-[1fr_360px]`}>
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className={`bg-gradient-to-br ${themes[department.image_theme] || themes.indigo} p-5 text-white sm:p-10`}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/90 sm:text-sm sm:tracking-[0.2em]">{department.category}</p>
            <h1 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">{department.name} Games</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">{department.description}</p>
          </div>
          <div className="p-5 sm:p-8">
            <h2 className="text-xl font-black text-[#201a33]">How it works</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {['10 auto-generated questions', 'Friday 2pm timer-based game', 'Only 2 players per company'].map(x => <div key={x} className="rounded-xl bg-primary-50 p-4 text-sm font-semibold text-[#4338ca]">{x}</div>)}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={register} className="btn-primary px-7 py-3">Register to play</button>
              <Link to={gamesPath(`${slug}/play`)} className="btn-secondary inline-block px-7 py-3 text-center">Play game</Link>
            </div>
          </div>
        </section>
        <aside className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-primary-500">Registered players</p>
          <p className="mt-1 text-sm text-[#5f5672]">{week.week_key} - Friday 2pm</p>
          <div className="mt-5 space-y-3">
            {registrations.map(r => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-purple-100 p-3">
                <img src={r.games_players?.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-bold text-[#201a33]">{r.games_players?.full_name}</p>
                  <p className="text-xs text-[#5f5672]">{r.games_players?.company_name}</p>
                </div>
              </div>
            ))}
            {!registrations.length && <p className="text-sm text-[#6c6378]">No players yet. Be first from your company.</p>}
          </div>
        </aside>
      </main>
      <DepartmentForum slug={slug} departmentName={department.name} />
      <GamesFooter />
    </div>
  );
};

export const GamesPlay = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [gameInfo, setGameInfo] = useState(null);
  const [payload, setPayload] = useState(null);
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(240);
  const [timerTotal, setTimerTotal] = useState(240);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem('thankeeu_games_token')) return navigate(gamesPath('login'));
    gamesAPI.getDepartment(slug).then(res => setGameInfo(res.data)).catch(err => toast.error(err.response?.data?.error || 'Could not load game'));
  }, [slug, navigate]);
  const startGame = async () => {
    try {
      const res = await gamesAPI.play(slug);
      const timer = res.data.timer_seconds || 240;
      setPayload(res.data);
      setTimerTotal(timer);
      setSeconds(timer);
      setResult(null);
      setAnswers({});
      toast.success('Game started. You have 4 minutes.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start game');
    }
  };
  const submit = async () => {
    if (submitting || result || !payload) return;
    const list = Object.entries(answers).map(([question_no, option]) => ({ question_no: Number(question_no), option }));
    try {
      setSubmitting(true);
      const res = await gamesAPI.submit(slug, { answers: list, duration_seconds: timerTotal - seconds });
      setResult(res.data);
      toast.success('Submitted. Review your corrections below.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };
  useEffect(() => {
    if (!payload || result || seconds <= 0) return undefined;
    const t = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [payload, result, seconds]);
  useEffect(() => {
    if (payload && !result && seconds === 0) submit();
  }, [payload, result, seconds]);
  if (!gameInfo) return <div className={lightPageClass}><GamesNav /><div className={`${mainClass} p-10 text-center text-[#201a33]`}>Preparing game room...</div></div>;
  const department = payload?.department || gameInfo.department;
  return (
    <div className={lightPageClass}>
      <GamesNav />
      <main className={`${mainClass} mx-auto w-full max-w-4xl px-4 py-6 sm:py-8`}>
        {!payload && (
          <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary-700">Game instructions</p>
            <h1 className="mt-3 text-2xl font-black leading-tight text-[#201a33] sm:text-3xl">{department.name} Game</h1>
            <p className="mt-3 text-sm leading-6 text-[#5f5672]">{department.description}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ['Questions', '10 department-specific questions'],
                ['Game time', '4 minutes after you start'],
                ['Start window', `Friday 2:00 PM - 3:00 PM ${gameInfo.play_window?.timezone || 'Africa/Lagos'}`],
                ['Results', 'Score, right answers, wrong answers and corrections show after submission'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-purple-100 bg-primary-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-primary-700">{label}</p>
                  <p className="mt-2 text-sm font-bold leading-5 text-[#201a33]">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              You can only start during the Friday 2:00 PM to 3:00 PM game window. Winners and congratulations cards are finalized from 3:01 PM.
            </div>
            <button onClick={startGame} className="btn-primary mt-6 w-full py-4">Start 4-minute game</button>
          </section>
        )}
        {payload && !result && (
          <>
            <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <h1 className="text-sm font-black leading-tight text-[#201a33] sm:text-base">{department?.name || 'Department'} Game</h1>
              <p className="rounded-xl bg-[#120b24] px-4 py-2 font-mono text-white">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</p>
            </div>
            <div className="space-y-4">
              {payload.questions.map(q => (
                <section key={q.id} className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="font-bold text-[#201a33]">{q.question_no}. {q.prompt}</p>
                  <div className="mt-4 grid gap-2">
                    {q.options.map((option, idx) => (
                      <button key={option} onClick={() => setAnswers({ ...answers, [q.question_no]: idx })} className={`rounded-xl border px-4 py-3 text-left text-sm ${answers[q.question_no] === idx ? 'border-primary-500 bg-primary-50 text-[#4338ca]' : 'border-purple-100 bg-white text-[#4c435f]'}`}>{option}</button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <button onClick={submit} disabled={submitting} className="btn-primary my-8 w-full py-4">{submitting ? 'Submitting...' : 'Submit game'}</button>
          </>
        )}
        {result && (
          <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary-700">Game submitted</p>
            <h2 className="mt-3 text-2xl font-black text-[#201a33]">{result.poster?.score}/10</h2>
            <p className="mt-2 text-sm leading-6 text-[#5f5672]">Your result poster has been sent by email and is available in your dashboard. Winners are finalized from 3:01 PM.</p>
            <div className="mt-6 space-y-4">
              {(result.corrections || []).map(item => (
                <div key={item.question_no} className={`rounded-2xl border p-4 ${item.is_correct ? 'border-emerald-100 bg-emerald-50' : 'border-rose-100 bg-rose-50'}`}>
                  <p className="font-black text-[#201a33]">{item.question_no}. {item.prompt}</p>
                  <p className="mt-3 text-sm font-bold text-[#201a33]">Correct answer: {item.options?.[item.correct_option]}</p>
                  {!item.is_correct && <p className="mt-1 text-sm text-[#5f5672]">Your answer: {item.selected_option === null ? 'No answer selected' : item.options?.[item.selected_option]}</p>}
                  <p className="mt-2 text-sm leading-6 text-[#4c435f]">{item.explanation}</p>
                </div>
              ))}
            </div>
            <Link to={`${gamesPath('dashboard')}?tab=results`} className="btn-primary mt-6 inline-block px-6 py-3">Open result poster</Link>
          </section>
        )}
      </main>
    </div>
  );
};

export const GamesLeaderboard = () => {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [winners, setWinners] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [playWindow, setPlayWindow] = useState(null);
  const department = params.get('department') || '';
  const week = params.get('week') || '';
  useSEO({ title: 'Public Employee Games Leaderboard - Thankeeu Games', description: 'View weekly public leaderboards for Thankeeu Games employee engagement league.', canonical: 'https://www.thankeeu.com/games/leaderboard' });
  useEffect(() => {
    const query = {};
    if (department) query.department = department;
    if (week) query.week = week;
    gamesAPI.leaderboard(query).then(res => {
      setRows(res.data.rows || []);
      setWinners(res.data.winners || []);
      setWeeks(res.data.weeks || []);
      setPlayWindow(res.data.play_window || null);
    });
  }, [department, week]);
  const updateFilter = (next) => {
    const merged = { department, week, ...next };
    const clean = Object.fromEntries(Object.entries(merged).filter(([, value]) => value));
    setParams(clean);
  };
  return (
    <div className={lightPageClass}>
      <GamesNav />
      <main className={`${mainClass} mx-auto w-full max-w-6xl px-4 py-8 sm:py-10`}>
        <h1 className="text-2xl font-black leading-tight text-[#201a33] sm:text-3xl">Public leaderboard</h1>
        <p className="mt-2 text-[#5f5672]">Filter by week or department. Winners per department appear after the Friday 3:01 PM finalization time.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
          <input className={`input ${inputContrastClass}`} placeholder="Department slug filter e.g. accountant" value={department} onChange={e => updateFilter({ department: e.target.value })} />
          <select className={`input ${inputContrastClass}`} value={week} onChange={e => updateFilter({ week: e.target.value })}>
            <option value="">Latest week</option>
            {weeks.map(item => <option key={item.week_key} value={item.week_key}>{item.week_key}</option>)}
          </select>
        </div>
        {playWindow && !playWindow.winners_finalized && (
          <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold text-amber-900">
            Winners for this week will be finalized at 3:01 PM {playWindow.timezone}.
          </div>
        )}
        <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-[#201a33]">Department winners</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {winners.map((winner, i) => (
              <div key={`${winner.department_id}-${winner.player_id}`} className="rounded-2xl border border-purple-100 p-4">
                <div className="flex items-center gap-3">
                  <img src={winner.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="break-words text-sm font-black text-[#201a33]">{winner.full_name}</p>
                    <p className="break-words text-xs text-[#5f5672]">{winner.company_name} - {winner.department_name}</p>
                  </div>
                  <p className="ml-auto shrink-0 text-lg font-black text-primary-700">{winner.score}/{winner.total}</p>
                </div>
                {winner.congratulations_card && <LeaderboardCongratsSigner row={winner} compact />}
              </div>
            ))}
            {!winners.length && <p className="text-sm text-[#5f5672]">{playWindow?.winners_finalized ? 'No winners yet for this filter.' : 'Winners are hidden until 3:01 PM.'}</p>}
          </div>
        </section>
        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          {rows.map((r, i) => (
            <div key={r.id} className="border-b border-purple-50 p-4">
              <div className="grid grid-cols-[38px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[50px_minmax(0,1fr)_120px]">
                <p className="text-lg font-black text-primary-600 sm:text-xl">#{i + 1}</p>
                <div className="flex min-w-0 items-center gap-3">
                  <img src={r.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="break-words font-bold text-[#201a33]">{r.full_name}</p>
                    <p className="break-words text-sm text-[#5f5672]">{r.company_name} - {r.department_name}</p>
                  </div>
                </div>
                <p className="col-start-2 text-left text-lg font-black text-[#201a33] sm:col-auto sm:text-right">{r.score}/{r.total}</p>
              </div>
              {r.congratulations_card && <LeaderboardCongratsSigner row={r} />}
            </div>
          ))}
          {!rows.length && <p className="p-8 text-center text-[#6c6378]">No submitted results yet.</p>}
        </div>
      </main>
      <GamesFooter />
    </div>
  );
};

export const GamesGifts = () => {
  const [data, setData] = useState({ sponsors: [], week_key: '' });
  useSEO({ title: 'Thankeeu Games Gifts - Sponsored Employee Rewards', description: 'See weekly sponsorship gifts pledged by companies for Thankeeu Games department winners.', canonical: 'https://www.thankeeu.com/games/gifts' });
  useEffect(() => {
    gamesAPI.sponsorships().then(res => setData(res.data)).catch(() => toast.error('Could not load sponsorship gifts'));
  }, []);
  return (
    <div className={lightPageClass}>
      <GamesNav />
      <main className={`${mainClass} mx-auto w-full max-w-6xl px-4 py-8 sm:py-10`}>
        <div className="rounded-3xl bg-[#120b24] p-5 text-white sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary-100">Weekly reward pool</p>
          <h1 className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl">Sponsored gifts for department winners</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90">Companies sponsor weekly prize pools, choose departments, and split rewards by percentage for the winners of Friday competitions.</p>
          <Link to={gamesPath('sponsor')} className="mt-5 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-[#120b24]">Sponsor a weekly game</Link>
        </div>
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {data.sponsors.map(sponsor => (
            <div key={sponsor.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-primary-700">{sponsor.week_key}</p>
                  <h2 className="mt-2 text-lg font-black text-[#201a33]">{sponsor.sponsor_company}</h2>
                  {sponsor.sponsor_website && <a href={sponsor.sponsor_website} target="_blank" rel="noreferrer" className="text-sm font-bold text-primary-700">Visit sponsor</a>}
                </div>
                <p className="rounded-2xl bg-emerald-50 px-4 py-2 text-lg font-black text-emerald-700">NGN {Number(sponsor.amount || 0).toLocaleString()}</p>
              </div>
              <div className="mt-4 grid gap-2">
                {(sponsor.games_sponsorship_allocations || []).map(allocation => (
                  <div key={allocation.games_departments?.id || allocation.amount} className="flex items-center justify-between gap-3 rounded-2xl border border-purple-100 p-3 text-sm">
                    <span className="font-bold text-[#201a33]">{allocation.games_departments?.name}</span>
                    <span className="font-black text-primary-700">{allocation.percentage}% - NGN {Number(allocation.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!data.sponsors.length && <p className="rounded-2xl bg-white p-6 text-[#5f5672] shadow-sm">No paid sponsorship gifts are live for this week yet.</p>}
        </section>
      </main>
      <GamesFooter />
    </div>
  );
};

export const GamesSponsor = () => {
  useSEO({ title: 'Sponsor Thankeeu Games - Employee Engagement Rewards', description: 'Sponsor weekly Thankeeu Games department winners with Flutterwave payments and brand visibility across Thankeeu.', canonical: 'https://www.thankeeu.com/games/sponsor' });
  return (
    <div className={lightPageClass}>
      <GamesNav />
      <main className={`${mainClass} mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center`}>
        <section className="rounded-3xl bg-[#120b24] p-6 text-white shadow-sm sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary-100">Sponsor weekly winners</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl">Create a company sponsor account for Thankeeu Games.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">Company sponsors fund weekly department winners, split reward pools by department, manage payouts, and get brand visibility across the employee engagement league.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to={gamesPath('company/signup')} className="inline-flex justify-center rounded-xl bg-white px-5 py-3 text-sm font-black text-[#120b24]">Sign up company sponsor</Link>
            <Link to={gamesPath('company/login')} className="inline-flex justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-black text-white">Company login</Link>
          </div>
        </section>
        <aside className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-[#201a33]">What sponsors control</h2>
          <div className="mt-5 space-y-3">
            {[
              ['Wallet-style sponsor dashboard', 'Manage company profile, bank details, and all weekly sponsorship pledges.'],
              ['Department reward splits', 'Choose departments and assign percentages before paying with Flutterwave.'],
              ['Brand awareness', 'Your sponsorship is promoted on Games surfaces and Thankeeu culture pages.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-purple-100 p-4">
                <p className="font-black text-[#201a33]">{title}</p>
                <p className="mt-1 text-sm leading-6 text-[#5f5672]">{text}</p>
              </div>
            ))}
          </div>
        </aside>
      </main>
      <GamesFooter />
    </div>
  );
};

const companyTabs = [
  { id: 'sponsor', label: 'Sponsor', icon: 'Gift' },
  { id: 'games', label: 'Games', icon: 'LayoutDashboard' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'BarChart' },
  { id: 'wallet', label: 'Wallet', icon: 'CreditCard' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
];

export const GamesCompanyAuth = ({ mode }) => {
  const navigate = useNavigate();
  const isSignup = mode === 'signup';
  const [form, setForm] = useState({ company_name: '', slug: '', contact_name: '', contact_email: '', sponsor_website: '', password: '' });
  useSEO({ title: `${isSignup ? 'Company sponsor signup' : 'Company sponsor login'} - Thankeeu Games`, noIndex: true });
  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = isSignup ? await gamesAPI.companySignup(form) : await gamesAPI.companyLogin({ email: form.contact_email, password: form.password });
      setCompanySession(res.data);
      toast.success(isSignup ? 'Company sponsor account created' : 'Welcome back');
      navigate(gamesPath(`company/${res.data.company.slug}`));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not continue');
    }
  };
  const updateCompanyName = (value) => {
    setForm(prev => ({
      ...prev,
      company_name: value,
      slug: prev.slug || value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }));
  };
  return (
    <div className={darkPageClass}>
      <GamesNav />
      <main className={`${mainClass} mx-auto flex w-full max-w-md items-center px-4 py-8 sm:py-12`}>
        <form onSubmit={submit} className="w-full rounded-3xl bg-white p-6 text-[#201a33] shadow-2xl sm:p-7">
          <h1 className="text-2xl font-black leading-tight">{isSignup ? 'Create sponsor company' : 'Company sponsor login'}</h1>
          <p className="mt-2 text-sm text-[#5f5672]">Sponsor weekly department winners from a protected company dashboard.</p>
          <div className="mt-6 space-y-4">
            {isSignup && <input className={`input ${inputContrastClass}`} required placeholder="Company name" value={form.company_name} onChange={e => updateCompanyName(e.target.value)} />}
            {isSignup && <input className={`input ${inputContrastClass}`} required placeholder="Company slug, e.g. moniepoint" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />}
            {isSignup && <input className={`input ${inputContrastClass}`} required placeholder="Contact name" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} />}
            <input type="email" className={`input ${inputContrastClass}`} required placeholder="sponsor@company.com" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} />
            {isSignup && <input className={`input ${inputContrastClass}`} placeholder="Website optional" value={form.sponsor_website} onChange={e => setForm({ ...form, sponsor_website: e.target.value })} />}
            <input type="password" className={`input ${inputContrastClass}`} required minLength={8} placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn-primary mt-6 w-full py-3">{isSignup ? 'Create company dashboard' : 'Login'}</button>
          <p className="mt-4 text-center text-sm text-[#5f5672]">
            {isSignup ? 'Already have a sponsor account?' : 'New sponsor company?'}{' '}
            <Link className="font-bold text-[#4f46e5]" to={isSignup ? gamesPath('company/login') : gamesPath('company/signup')}>{isSignup ? 'Login' : 'Signup'}</Link>
          </p>
        </form>
      </main>
    </div>
  );
};

const SponsorSplitForm = ({ departments, onPaid }) => {
  const [selected, setSelected] = useState({});
  const [form, setForm] = useState({ amount: 50000, message: '' });
  const [paying, setPaying] = useState(false);
  const toggleDepartment = (id) => {
    setSelected(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = 0;
      const ids = Object.keys(next);
      const even = ids.length ? Math.floor(100 / ids.length) : 0;
      ids.forEach((key, index) => { next[key] = index === ids.length - 1 ? 100 - even * (ids.length - 1) : even; });
      return next;
    });
  };
  const submit = async (e) => {
    e.preventDefault();
    const allocations = Object.entries(selected).map(([department_id, percentage]) => ({ department_id, percentage }));
    if (!allocations.length) return toast.error('Select at least one department');
    if (Math.round(allocations.reduce((sum, item) => sum + Number(item.percentage || 0), 0)) !== 100) return toast.error('Percentages must add up to 100%');
    try {
      setPaying(true);
      const res = await gamesAPI.initializeSponsorship({ amount: Number(form.amount), message: form.message, allocations });
      await new Promise(resolve => {
        openFlwCheckout({
          flwConfig: res.data.flw_config,
          onSuccess: async (txRef) => {
            try {
              await gamesAPI.verifySponsorship({ tx_ref: txRef || res.data.tx_ref });
              toast.success('Sponsorship confirmed');
              onPaid?.();
            } catch (err) {
              toast.error(err.response?.data?.error || 'Payment verification failed');
            } finally {
              resolve();
            }
          },
          onClose: () => { toast('Payment cancelled'); resolve(); },
        }).catch(err => { toast.error(err.message || 'Could not open Flutterwave checkout'); resolve(); });
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start sponsorship payment');
    } finally {
      setPaying(false);
    }
  };
  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <input type="number" min="5000" className={`input ${inputContrastClass}`} required placeholder="Amount NGN" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
        <input className={`input ${inputContrastClass}`} placeholder="Sponsor message optional" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
      </div>
      <h2 className="mt-6 text-base font-black text-[#201a33]">Select departments and reward split</h2>
      <div className="mt-4 grid max-h-[520px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
        {departments.map(dept => (
          <div key={dept.id} className={`rounded-2xl border p-3 ${selected[dept.id] !== undefined ? 'border-primary-300 bg-primary-50' : 'border-purple-100'}`}>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" checked={selected[dept.id] !== undefined} onChange={() => toggleDepartment(dept.id)} />
              <span className="min-w-0 flex-1">
                <span className="block font-black text-[#201a33]">{dept.name}</span>
                <span className="block text-xs text-[#5f5672]">{dept.category}</span>
              </span>
            </label>
            {selected[dept.id] !== undefined && (
              <input type="number" min="1" max="100" className={`input mt-3 ${inputContrastClass}`} value={selected[dept.id]} onChange={e => setSelected(prev => ({ ...prev, [dept.id]: Number(e.target.value || 0) }))} />
            )}
          </div>
        ))}
      </div>
      <button className="btn-primary mt-6 w-full py-4" disabled={paying}>{paying ? 'Opening Flutterwave...' : 'Pay sponsorship with Flutterwave'}</button>
    </form>
  );
};

const CompanyBankSettings = ({ company, onSaved }) => {
  const [banks, setBanks] = useState([]);
  const [form, setForm] = useState(company || {});
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { gamesAPI.companyListBanks().then(res => setBanks(asArray(res.data))).catch(() => {}); }, []);
  useEffect(() => setForm(company || {}), [company]);
  const verify = async () => {
    const bank = banks.find(item => String(item.code) === String(form.bank_code));
    try {
      setVerifying(true);
      const res = await gamesAPI.verifyCompanyBank({ account_number: form.account_number, bank_code: form.bank_code, bank_name: bank?.name || form.bank_name });
      setForm(prev => ({ ...prev, ...res.data, bank_name: bank?.name || res.data.bank_name || prev.bank_name }));
      toast.success(`Verified: ${res.data.account_name}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not verify account');
    } finally {
      setVerifying(false);
    }
  };
  const save = async () => {
    try {
      setSaving(true);
      const res = await gamesAPI.saveCompanyBank(form);
      onSaved?.(res.data.company);
      toast.success('Bank details saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save bank details');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-black text-[#201a33]">Sponsor wallet bank</h2>
      <p className="mt-1 text-sm text-[#5f5672]">Verify company bank details for sponsorship operations and future reward workflows.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <select className={`input ${inputContrastClass}`} value={form.bank_code || ''} onChange={e => {
          const bank = banks.find(item => String(item.code) === e.target.value);
          setForm({ ...form, bank_code: e.target.value, bank_name: bank?.name || '', account_name: '' });
        }}>
          <option value="">Select bank</option>
          {banks.map(bank => <option key={bank.code} value={bank.code}>{bank.name}</option>)}
        </select>
        <input className={`input ${inputContrastClass}`} maxLength={10} placeholder="Account number" value={form.account_number || ''} onChange={e => setForm({ ...form, account_number: e.target.value.replace(/\D/g, '').slice(0, 10), account_name: '' })} />
      </div>
      {form.account_name && <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm font-black text-emerald-700">{form.account_name}</p>}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={verify} className="btn-secondary px-5 py-3" disabled={verifying}>{verifying ? 'Verifying...' : 'Verify account name'}</button>
        <button type="button" onClick={save} className="btn-primary px-5 py-3" disabled={saving || !form.account_name}>{saving ? 'Saving...' : 'Save bank details'}</button>
      </div>
    </div>
  );
};

export const GamesCompanyDashboard = () => {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const tab = params.get('tab') || 'sponsor';
  const load = () => gamesAPI.companyDashboard().then(res => {
    setData(res.data);
    localStorage.setItem('thankeeu_games_company', JSON.stringify(res.data.company));
  }).catch(() => {});
  useEffect(() => {
    if (!localStorage.getItem('thankeeu_games_company_token')) return;
    load();
  }, []);
  if (!localStorage.getItem('thankeeu_games_company_token')) return <Navigate to={gamesPath('company/login')} replace />;
  if (!data) return <div className="flex min-h-screen items-center justify-center bg-[#f6f1ff] p-8 text-center text-[#201a33]">Loading company dashboard...</div>;
  if (slug && data.company.slug !== slug) return <Navigate to={gamesPath(`company/${data.company.slug}`)} replace />;
  const logout = () => {
    localStorage.removeItem('thankeeu_games_company_token');
    localStorage.removeItem('thankeeu_games_company');
    window.location.href = gamesPath();
  };
  return (
    <div className="min-h-screen bg-[#f6f1ff] text-[#201a33] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="bg-[#120b24] p-4 text-white lg:min-h-screen">
        <div className="flex items-center justify-between gap-3 lg:block">
          <Link to={gamesPath()} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1"><img src="/android-chrome-192x192.png" alt="" className="h-full w-full rounded-lg object-cover" /></span>
            <div><p className="font-black text-white">Thankeeu Games</p><p className="text-xs text-white/70">{data.company.company_name}</p></div>
          </Link>
          <button onClick={logout} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white lg:hidden">Logout</button>
        </div>
        <nav className="mt-5 grid gap-2">
          {companyTabs.map(item => (
            <button key={item.id} type="button" onClick={() => setParams({ tab: item.id })} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black ${tab === item.id ? 'bg-white text-[#120b24]' : 'text-white/85 hover:bg-white/10 hover:text-white'}`}>
              <Icon name={item.icon} size="sm" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={logout} className="mt-6 hidden w-full rounded-2xl bg-white/10 px-4 py-3 text-left text-sm font-black text-white lg:block">Logout</button>
      </aside>
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 rounded-3xl bg-[#120b24] p-5 text-white">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary-100">Company sponsor dashboard</p>
          <h1 className="mt-2 break-words text-2xl font-black text-white">{data.company.company_name}</h1>
          <p className="mt-2 text-sm text-white/85">Sponsor department game rewards, review winners, and manage your company sponsor profile.</p>
        </div>
        {tab === 'sponsor' && <SponsorSplitForm departments={data.departments} onPaid={load} />}
        {tab === 'games' && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.departments.map(game => <GameCard key={game.id} game={game} />)}</div>}
        {tab === 'leaderboard' && <div className="rounded-3xl bg-white p-5 shadow-sm"><GamesLeaderboardInner /></div>}
        {tab === 'wallet' && (
          <div className="space-y-4">
            <CompanyBankSettings company={data.company} onSaved={company => setData(prev => ({ ...prev, company }))} />
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-[#201a33]">Sponsorship history</h2>
              <div className="mt-4 grid gap-3">
                {data.sponsorships.map(item => <div key={item.id} className="rounded-2xl border border-purple-100 p-4"><p className="font-black text-[#201a33]">NGN {Number(item.amount || 0).toLocaleString()} - {item.status}</p><p className="text-sm text-[#5f5672]">{item.week_key}</p></div>)}
                {!data.sponsorships.length && <p className="text-sm text-[#5f5672]">No sponsorships yet.</p>}
              </div>
            </div>
          </div>
        )}
        {tab === 'settings' && <CompanyProfileSettings company={data.company} onSaved={company => setData(prev => ({ ...prev, company }))} />}
      </main>
    </div>
  );
};

const CompanyProfileSettings = ({ company, onSaved }) => {
  const [form, setForm] = useState({ company_name: company.company_name || '', contact_name: company.contact_name || '', sponsor_website: company.sponsor_website || '' });
  const save = async () => {
    try {
      const res = await gamesAPI.updateCompany(form);
      localStorage.setItem('thankeeu_games_company', JSON.stringify(res.data));
      onSaved?.(res.data);
      toast.success('Company profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update company profile');
    }
  };
  return (
    <div className="max-w-2xl rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-black text-[#201a33]">Company profile</h2>
      <div className="mt-5 grid gap-4">
        <input className={`input ${inputContrastClass}`} value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} />
        <input className={`input ${inputContrastClass}`} value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} />
        <input className={`input ${inputContrastClass}`} placeholder="Website optional" value={form.sponsor_website || ''} onChange={e => setForm({ ...form, sponsor_website: e.target.value })} />
        <button type="button" onClick={save} className="btn-primary px-5 py-3">Save profile</button>
      </div>
    </div>
  );
};

const LeaderboardCongratsSigner = ({ row }) => {
  const [open, setOpen] = useState(false);
  const [signed, setSigned] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '', gif_url: '', photo_url: '', video_url: '', voice_note_url: '' });
  const card = row.congratulations_card;
  const submit = async (e) => {
    e.preventDefault();
    try {
      await gamesAPI.visitorSignCongrats(card.id, form);
      setSigned(true);
      setOpen(false);
      setForm({ name: '', email: '', company: '', message: '', gif_url: '', photo_url: '', video_url: '', voice_note_url: '' });
      toast.success('Your congratulations message was added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not sign the card');
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:ml-[62px]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Winner congratulations card</p>
          <p className="mt-1 text-sm text-amber-900">
            {row.full_name}'s group congratulations card is open for players and site visitors to sign.
          </p>
        </div>
        {signed ? (
          <span className="rounded-xl bg-green-100 px-4 py-2 text-sm font-black text-green-700">Signed</span>
        ) : (
          <button onClick={() => setOpen(v => !v)} className="rounded-xl bg-[#120b24] px-4 py-2 text-sm font-black text-white">
            {open ? 'Close' : 'Sign card'}
          </button>
        )}
      </div>
      {open && (
        <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-2">
          <input className={`input ${inputContrastClass}`} required placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className={`input ${inputContrastClass}`} placeholder="Email optional" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input className={`input md:col-span-2 ${inputContrastClass}`} placeholder="Company optional" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
          <textarea className={`input min-h-[100px] md:col-span-2 ${inputContrastClass}`} required placeholder={`Write a congratulations message for ${row.full_name}`} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
          <SignatureMediaInputs form={form} setForm={setForm} />
          <button className="btn-primary md:col-span-2 py-3">Add message to congratulations card</button>
        </form>
      )}
    </div>
  );
};

const signatureMediaFields = [
  { key: 'gif_url', label: 'GIF', icon: 'Image', accept: 'image/gif,image/webp,image/*' },
  { key: 'photo_url', label: 'Photo', icon: 'Camera', accept: 'image/*' },
  { key: 'video_url', label: 'Video', icon: 'Video', accept: 'video/*' },
  { key: 'voice_note_url', label: 'Voice note', icon: 'Mic', accept: 'audio/*' },
];

const SignatureMediaInputs = ({ form, setForm }) => {
  const [uploading, setUploading] = useState({});
  const uploadMedia = async (field, file) => {
    if (!file) return;
    try {
      setUploading(prev => ({ ...prev, [field]: true }));
      const res = await gamesAPI.uploadCongratsMedia(file);
      setForm(prev => ({ ...prev, [field]: res.data.url }));
      toast.success('Media uploaded');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not upload media');
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };
  return (
    <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
      {signatureMediaFields.map(field => (
        <div key={field.key} className="rounded-2xl border border-purple-100 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <Icon name={field.icon} size="sm" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-black text-[#201a33]">{field.label}</p>
                {form[field.key] ? (
                  <a href={form[field.key]} target="_blank" rel="noreferrer" className="block truncate text-xs font-bold text-primary-700">Uploaded</a>
                ) : (
                  <p className="text-xs text-[#5f5672]">Optional file</p>
                )}
              </div>
            </div>
            <label className="shrink-0 cursor-pointer rounded-xl bg-primary-50 px-3 py-2 text-xs font-black text-primary-700 hover:bg-primary-100">
              {uploading[field.key] ? 'Uploading' : form[field.key] ? 'Change' : 'Upload'}
              <input
                type="file"
                accept={field.accept}
                className="sr-only"
                disabled={uploading[field.key]}
                onChange={e => uploadMedia(field.key, e.target.files?.[0])}
              />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
};

const SignatureMediaPreview = ({ signature }) => {
  const items = [
    signature.gif_url && ['GIF', signature.gif_url],
    signature.photo_url && ['Photo', signature.photo_url],
    signature.video_url && ['Video', signature.video_url],
    signature.voice_note_url && ['Voice note', signature.voice_note_url],
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map(([label, url]) => (
        <a key={label} href={url} target="_blank" rel="noreferrer" className="rounded-full bg-white px-3 py-1 text-xs font-black text-primary-700">
          {label}
        </a>
      ))}
    </div>
  );
};

const dashboardTabs = [
  { id: 'games', label: 'Games', icon: 'LayoutDashboard' },
  { id: 'co-players', label: 'Co-players', icon: 'Users' },
  { id: 'cards', label: 'Cards', icon: 'Card' },
  { id: 'pending-to-sign', label: 'Pending to sign', icon: 'PenLine' },
  { id: 'results', label: 'Results', icon: 'Award' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'BarChart' },
  { id: 'gifts', label: 'Gifts', icon: 'Gift' },
  { id: 'profile', label: 'Profile settings', icon: 'Settings' },
];

const GamesDashboardShell = ({ player, tab, onTabChange, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem('thankeeu_games_token');
    localStorage.removeItem('thankeeu_games_player');
    navigate(gamesPath('login'));
  };
  const navButton = (item) => (
    <button
      key={item.id}
      type="button"
      onClick={() => {
        onTabChange(item.id);
        setSidebarOpen(false);
      }}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold transition ${tab === item.id ? 'bg-white text-[#120b24] shadow-lg shadow-black/10' : 'text-white/85 hover:bg-white/10 hover:text-white'}`}
    >
      <Icon name={item.icon} size="sm" />
      <span>{item.label}</span>
    </button>
  );
  const sidebar = (
    <aside className="flex h-full w-72 flex-col bg-[#120b24] p-4 text-white shadow-2xl lg:w-64">
      <Link to={gamesPath()} className="flex items-center gap-3 rounded-2xl px-2 py-2">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1 ring-1 ring-white/20">
          <img src="/android-chrome-192x192.png" alt="Thankeeu" className="h-full w-full rounded-lg object-cover" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-black leading-none text-white">thank<span className="text-primary-300">eeu</span> games</p>
          <p className="mt-1 truncate text-[11px] text-white/75">Employee engagement league</p>
        </div>
      </Link>

      <div className="mt-6 rounded-3xl bg-white/10 p-3 ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <img src={player.avatar_url} alt="" className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white/20" />
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">{player.full_name}</p>
            <p className="truncate text-xs text-white/75">{player.company_name}</p>
          </div>
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-1" aria-label="Games dashboard">
        {dashboardTabs.map(navButton)}
      </nav>

      <div className="space-y-2 border-t border-white/10 pt-4">
        <Link to={gamesPath()} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-white/85 hover:bg-white/10 hover:text-white">
          <Icon name="Home" size="sm" />
          <span>Games home</span>
        </Link>
        <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-white/85 hover:bg-white/10 hover:text-white">
          <Icon name="LogOut" size="sm" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f6f1ff] text-[#201a33] lg:flex">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        {sidebar}
      </div>
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#120b24] text-white shadow-xl lg:hidden"
        aria-label="Open dashboard menu"
      >
        <Icon name="Menu" size="lg" />
      </button>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close dashboard menu" onClick={() => setSidebarOpen(false)} />
          <div className="relative h-full">
            {sidebar}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white"
              aria-label="Close dashboard menu"
            >
              <Icon name="Close" size="md" />
            </button>
          </div>
        </div>
      )}
      <main className="min-h-screen w-full px-4 pb-8 pt-20 sm:px-6 lg:ml-64 lg:px-8 lg:pt-8">
        <div className="mx-auto w-full max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export const GamesDashboard = () => {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [cards, setCards] = useState([]);
  const [pending, setPending] = useState([]);
  const [rewards, setRewards] = useState(null);
  const tab = params.get('tab') || 'games';
  useEffect(() => {
    if (!localStorage.getItem('thankeeu_games_token')) return;
    Promise.all([
      gamesAPI.dashboard(),
      gamesAPI.myCongratsCards(),
      gamesAPI.pendingCongrats(),
      gamesAPI.rewards()
    ]).then(([dashboardRes, cardsRes, pendingRes, rewardsRes]) => {
      setData(dashboardRes.data);
      setCards(cardsRes.data.cards || []);
      setPending(pendingRes.data.signatures || []);
      setRewards(rewardsRes.data);
    }).catch(() => {});
  }, []);
  if (!localStorage.getItem('thankeeu_games_token')) return <Navigate to={gamesPath('login')} replace />;
  if (!data) return <div className="flex min-h-screen items-center justify-center bg-[#f6f1ff] p-8 text-center text-[#201a33]">Loading dashboard...</div>;
  return (
    <GamesDashboardShell player={data.player} tab={tab} onTabChange={(nextTab) => setParams({ tab: nextTab })}>
        <div className="rounded-3xl bg-[#120b24] p-4 text-white sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
            <img src={data.player.avatar_url} alt="" className="h-14 w-14 rounded-2xl object-cover sm:h-16 sm:w-16" />
            <div className="min-w-0">
              <h1 className="break-words text-lg font-black leading-tight text-white sm:text-xl">{data.player.full_name}</h1>
              <p className="break-words text-sm text-white/90 sm:text-base">{data.player.company_name} - {data.player.job_title || 'Employee player'}</p>
            </div>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white ring-1 ring-white/10">
              {data.week?.week_key || 'Current week'} - Friday 2pm
            </div>
          </div>
        </div>
        <section className="mt-6 rounded-3xl bg-white p-4 shadow-sm sm:p-6">
          {tab === 'games' && (
            <div className="grid gap-4 md:grid-cols-2">
              {data.registrations.map(r => <div key={r.id} className="rounded-2xl border border-purple-100 p-5"><p className="font-black text-[#201a33]">{r.games_departments?.name || 'Department game'}</p><p className="text-sm text-[#5f5672]">{r.week_key} - Friday 2pm</p>{r.games_departments?.slug && <Link to={gamesPath(`${r.games_departments.slug}/play`)} className="btn-primary mt-4 inline-block px-4 py-2">Play</Link>}</div>)}
              {!data.registrations.length && <p className="text-[#5f5672]">You have not registered for any games yet.</p>}
            </div>
          )}
          {tab === 'co-players' && (
            <div className="grid gap-3 md:grid-cols-2">
              {data.competitors.map((r, i) => <div key={i} className="flex items-center gap-3 rounded-xl border border-purple-100 p-3"><img src={r.games_players?.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" /><div className="min-w-0"><p className="break-words font-bold text-[#201a33]">{r.games_players?.full_name}</p><p className="break-words text-xs text-[#5f5672]">{r.games_players?.company_name} - {r.games_departments?.name}</p></div></div>)}
            </div>
          )}
          {tab === 'cards' && <CongratsCards cards={cards} />}
          {tab === 'pending-to-sign' && <PendingCongratsCards pending={pending} onSigned={(signature) => setPending(prev => prev.map(item => item.id === signature.id ? { ...item, ...signature } : item))} />}
          {tab === 'results' && <ResultsPosters registrations={data.registrations} player={data.player} />}
          {tab === 'leaderboard' && <GamesLeaderboardInner />}
          {tab === 'gifts' && <GiftsRewardsPanel rewards={rewards} />}
          {tab === 'profile' && <ProfileEditor player={data.player} rewards={rewards} onRewardsUpdate={setRewards} onUpdate={p => setData({ ...data, player: p })} />}
        </section>
    </GamesDashboardShell>
  );
};

const CongratsCards = ({ cards }) => {
  if (!cards.length) return <p className="text-[#5f5672]">When you win a department game, your congratulations card will appear here and will be delivered on Tuesday at 10:00 AM.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map(card => (
        <div key={card.id} className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm">
          <div className="rounded-2xl bg-gradient-to-br from-primary-600 via-fuchsia-500 to-amber-400 p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-white/90 sm:tracking-[0.2em]">Congratulations card</p>
            <h3 className="mt-3 text-lg font-black leading-tight text-white sm:text-xl">{card.title}</h3>
          </div>
          <p className="mt-4 text-sm text-[#4c435f]">{card.message}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-700">{card.status}</span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">Sends Tuesday 10am</span>
            <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">{card.games_congrats_signatures?.filter(sig => sig.status === 'signed').length || 0} signatures</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const PendingCongratsCards = ({ pending, onSigned }) => {
  const [forms, setForms] = useState({});
  const getForm = (id) => forms[id] || { message: '', gif_url: '', photo_url: '', video_url: '', voice_note_url: '' };
  const updateForm = (id, next) => setForms(prev => ({ ...prev, [id]: typeof next === 'function' ? next(getForm(id)) : next }));
  const sign = async (signature) => {
    try {
      const res = await gamesAPI.signCongrats(signature.id, getForm(signature.id));
      toast.success('Card signed');
      onSigned(res.data.signature);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not sign card');
    }
  };
  if (!pending.length) return <p className="text-[#5f5672]">No congratulations cards are pending on you right now.</p>;
  return (
    <div className="space-y-4">
      {pending.map(signature => {
        const card = signature.games_congrats_cards || {};
        const signed = signature.status === 'signed';
        return (
          <div key={signature.id} className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-primary-500">Pending to sign</p>
                <h3 className="mt-1 text-xl font-black text-[#201a33]">{card.title || 'Congratulations card'}</h3>
                <p className="mt-2 text-sm text-[#5f5672]">{card.message}</p>
                <p className="mt-2 text-xs font-bold text-amber-600">This card is sent to the winner on Tuesday at 10:00 AM.</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${signed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{signed ? 'signed' : 'pending'}</span>
            </div>
            {signed ? (
              <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm text-green-800">
                <p>{signature.message}</p>
                <SignatureMediaPreview signature={signature} />
              </div>
            ) : (
              <div className="mt-4">
                <textarea
                  className={`input min-h-[110px] ${inputContrastClass}`}
                  placeholder="Write your congratulations message..."
                  value={getForm(signature.id).message}
                  onChange={e => updateForm(signature.id, current => ({ ...current, message: e.target.value }))}
                />
                <div className="mt-3">
                  <SignatureMediaInputs form={getForm(signature.id)} setForm={(next) => updateForm(signature.id, next)} />
                </div>
                <button onClick={() => sign(signature)} className="btn-primary mt-3 px-5 py-3">Sign congratulations card</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ResultsPosters = ({ registrations, player }) => {
  const attempts = registrations.flatMap((registration) => {
    const rows = Array.isArray(registration.games_attempts) ? registration.games_attempts : [];
    return rows.map(attempt => ({ attempt, registration }));
  });
  if (!attempts.length) return <p className="text-[#5f5672]">Your result posters will appear here after you submit a Friday game.</p>;
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {attempts.map(({ attempt, registration }) => (
        <div key={attempt.id} className="overflow-hidden rounded-3xl bg-[#120b24] text-white shadow-xl">
          <div className="bg-gradient-to-br from-primary-500 via-fuchsia-500 to-amber-400 p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-white/90 sm:tracking-[0.2em]">Thankeeu Games Result</p>
            <h3 className="mt-3 text-xl font-black leading-tight text-white sm:text-2xl">{registration.games_departments?.name || 'Department'} League</h3>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <img src={player.avatar_url} alt="" className="h-14 w-14 rounded-2xl border-2 border-white/20 object-cover sm:h-16 sm:w-16" />
              <div className="min-w-0">
                <p className="break-words text-base font-black text-white sm:text-lg">{player.full_name}</p>
                <p className="text-sm text-white/80">{player.company_name}</p>
              </div>
            </div>
            <div className="mt-6 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm text-white/90">{registration.week_key}</p>
                <p className="text-sm text-white/90">Friday 2pm championship</p>
              </div>
              <p className="text-3xl font-black text-white sm:text-4xl">{attempt.score}<span className="text-lg text-white/80 sm:text-xl">/{attempt.total}</span></p>
            </div>
            <button
              type="button"
              onClick={() => {
                const text = `${player.full_name} scored ${attempt.score}/${attempt.total} in ${registration.games_departments?.name || 'Thankeeu Games'} for ${player.company_name}.`;
                if (navigator.share) navigator.share({ title: 'Thankeeu Games result', text, url: window.location.href });
                else toast.success(text);
              }}
              className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-black text-[#120b24]"
            >
              Share score
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const GamesLeaderboardInner = () => {
  const [rows, setRows] = useState([]);
  useEffect(() => { gamesAPI.leaderboard().then(res => setRows(res.data.rows || [])); }, []);
  return <div className="space-y-2">{rows.slice(0, 20).map((r, i) => <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-primary-50 p-3 text-[#201a33]"><span className="min-w-0 break-words text-sm">#{i + 1} {r.full_name} - {r.company_name}</span><strong className="shrink-0">{r.score}/{r.total}</strong></div>)}</div>;
};

const GiftsRewardsPanel = ({ rewards }) => {
  if (!rewards) return <p className="text-[#5f5672]">Loading gift rewards...</p>;
  const totalWinnerRewards = rewards.rewards.filter(r => r.winner).reduce((sum, r) => sum + Number(r.amount || 0), 0);
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-[#120b24] p-5 text-white">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-primary-100">{rewards.week?.week_key || 'Current week'}</p>
        <h2 className="mt-2 text-xl font-black text-white">Your sponsored game gifts</h2>
        <p className="mt-2 text-sm text-white/85">Sponsors split prize pools by department. Winner rewards become claimable after weekly winners are finalized.</p>
        <p className="mt-4 text-2xl font-black text-white">NGN {totalWinnerRewards.toLocaleString()}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {rewards.rewards.map((reward, index) => (
          <div key={`${reward.department_id}-${index}`} className="rounded-2xl border border-purple-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-[#201a33]">{reward.department_name}</p>
                <p className="text-sm text-[#5f5672]">Sponsored by {reward.sponsor_company}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${reward.winner ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{reward.winner ? 'Winner reward' : 'Prize pool'}</span>
            </div>
            <p className="mt-4 text-xl font-black text-primary-700">NGN {Number(reward.amount || 0).toLocaleString()}</p>
            <p className="text-xs font-bold text-[#5f5672]">{reward.percentage}% of sponsor pledge</p>
          </div>
        ))}
        {!rewards.rewards.length && <p className="text-[#5f5672]">No sponsored gifts are attached to your registered games yet.</p>}
      </div>
      {!rewards.bank?.bank_verified && <p className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">Add verified bank details in Profile settings so winner rewards can be paid.</p>}
    </div>
  );
};

const GameBankSettings = ({ initialBank, onSaved }) => {
  const [banks, setBanks] = useState([]);
  const [form, setForm] = useState(initialBank || { bank_code: '', bank_name: '', account_number: '', account_name: '' });
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { gamesAPI.listBanks().then(res => setBanks(asArray(res.data))).catch(() => {}); }, []);
  useEffect(() => {
    if (initialBank) setForm(initialBank);
  }, [initialBank]);
  const verify = async () => {
    const bank = banks.find(item => String(item.code) === String(form.bank_code));
    try {
      setVerifying(true);
      const res = await gamesAPI.verifyBank({ account_number: form.account_number, bank_code: form.bank_code, bank_name: bank?.name || form.bank_name });
      setForm(prev => ({ ...prev, ...res.data, bank_name: bank?.name || res.data.bank_name || prev.bank_name }));
      toast.success(`Verified: ${res.data.account_name}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not verify account');
    } finally {
      setVerifying(false);
    }
  };
  const save = async () => {
    try {
      setSaving(true);
      await gamesAPI.saveBank(form);
      const rewards = await gamesAPI.rewards();
      onSaved?.(rewards.data);
      toast.success('Bank details saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save bank details');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="mt-8 rounded-3xl border border-purple-100 p-4 sm:p-5">
      <h3 className="text-base font-black text-[#201a33]">Reward payout bank</h3>
      <p className="mt-1 text-sm text-[#5f5672]">Verify your bank account name before saving payout details.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <select className={`input ${inputContrastClass}`} value={form.bank_code || ''} onChange={e => {
          const bank = banks.find(item => String(item.code) === e.target.value);
          setForm({ ...form, bank_code: e.target.value, bank_name: bank?.name || '', account_name: '' });
        }}>
          <option value="">Select bank</option>
          {banks.map(bank => <option key={bank.code} value={bank.code}>{bank.name}</option>)}
        </select>
        <input className={`input ${inputContrastClass}`} maxLength={10} placeholder="Account number" value={form.account_number || ''} onChange={e => setForm({ ...form, account_number: e.target.value.replace(/\D/g, '').slice(0, 10), account_name: '' })} />
      </div>
      {form.account_name && <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm font-black text-emerald-700">{form.account_name}</p>}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={verify} className="btn-secondary px-5 py-3" disabled={verifying}>{verifying ? 'Verifying...' : 'Verify account name'}</button>
        <button type="button" onClick={save} className="btn-primary px-5 py-3" disabled={saving || !form.account_name}>{saving ? 'Saving...' : 'Save bank details'}</button>
      </div>
    </div>
  );
};

const ProfileEditor = ({ player, rewards, onRewardsUpdate, onUpdate }) => {
  const [form, setForm] = useState({ full_name: player.full_name, username: player.username || '', job_title: player.job_title || '', avatar_url: player.avatar_url });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const uploadAvatar = async (file) => {
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      toast.error('Upload an image file for your profile photo');
      return;
    }
    try {
      setUploadingAvatar(true);
      const res = await gamesAPI.uploadAvatar(file);
      setForm(prev => ({ ...prev, avatar_url: res.data.url }));
      toast.success('Profile photo uploaded');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not upload profile photo');
    } finally {
      setUploadingAvatar(false);
    }
  };
  const save = async () => {
    if (!form.avatar_url) {
      toast.error('Upload a profile photo before saving');
      return;
    }
    try {
      const res = await gamesAPI.updateProfile(form);
      localStorage.setItem('thankeeu_games_player', JSON.stringify(res.data));
      onUpdate(res.data);
      toast.success('Profile updated');
    } catch (err) { toast.error(err.response?.data?.error || 'Could not update profile'); }
  };
  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-primary-600 ring-1 ring-purple-100">
            {form.avatar_url ? <img src={form.avatar_url} alt="" className="h-full w-full object-cover" /> : <Icon name="Camera" size="lg" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-[#201a33]">Profile photo</p>
            <p className="mt-1 text-xs leading-5 text-[#5f5672]">Shown on leaderboards, result posters and congratulations cards.</p>
          </div>
        </div>
        <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#4f46e5] ring-1 ring-purple-100 transition hover:bg-primary-50">
          <Icon name="Upload" size="sm" />
          {uploadingAvatar ? 'Uploading...' : form.avatar_url ? 'Change photo' : 'Upload photo'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploadingAvatar}
            onChange={e => uploadAvatar(e.target.files?.[0])}
          />
        </label>
      </div>
      <input className={`input ${inputContrastClass}`} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
      <input className={`input ${inputContrastClass}`} value={form.username} placeholder="Username" onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9_]/g, '') })} />
      <input className={`input ${inputContrastClass}`} value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} />
      <button onClick={save} className="btn-primary px-5 py-3" disabled={uploadingAvatar}>{uploadingAvatar ? 'Uploading photo...' : 'Save profile'}</button>
      <GameBankSettings initialBank={rewards?.bank} onSaved={onRewardsUpdate} />
    </div>
  );
};
