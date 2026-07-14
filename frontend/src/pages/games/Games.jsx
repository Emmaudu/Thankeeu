import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSEO } from '../../hooks/useSEO';
import { gamesAPI } from '../../utils/api';
import { isGamesHost } from '../../utils/workspace';
import Icon from '../../components/ui/Icon';

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
      <span className="absolute left-5 top-5 h-2 w-2 rounded-full bg-white/80" />
      <span className="absolute left-20 top-9 h-2 w-7 rotate-12 rounded-full bg-amber-200/90" />
      <span className="absolute right-24 top-6 h-2 w-2 rounded-full bg-fuchsia-200/90" />
      <span className="absolute right-8 top-12 h-2 w-8 -rotate-12 rounded-full bg-cyan-200/90" />
      <div className="relative z-10 flex h-full justify-between gap-3">
        <div className="min-w-0 max-w-[62%]">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/90">{game.category}</p>
          <p className="mt-3 line-clamp-3 text-lg font-black leading-tight text-white drop-shadow-sm">{game.name}</p>
        </div>
        <div className="relative flex min-w-[110px] items-end justify-end">
          <div className="absolute right-8 top-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white shadow-lg ring-1 ring-white/25 backdrop-blur-sm">
            <Icon name={icon} size={30} strokeWidth={2.25} />
          </div>
          <div className="absolute bottom-0 right-0 flex items-end gap-1">
            <GameCharacter side="left" />
            <GameCharacter side="right" />
          </div>
          <div className="absolute bottom-2 right-16 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-[#120b24] shadow-md">
            Hurray
          </div>
        </div>
      </div>
    </div>
  );
};

const getPlayer = () => {
  try { return JSON.parse(localStorage.getItem('thankeeu_games_player') || 'null'); }
  catch { return null; }
};

const setSession = ({ token, player }) => {
  localStorage.setItem('thankeeu_games_token', token);
  localStorage.setItem('thankeeu_games_player', JSON.stringify(player));
};

const gamesPath = (path = '') => {
  const clean = path ? `/${String(path).replace(/^\/+/, '')}` : '';
  return isGamesHost() ? clean || '/' : `/games${clean}`;
};

const GamesNav = () => {
  const player = getPlayer();
  const location = useLocation();
  const section = (() => {
    const path = location.pathname.replace(/^\/games/, '').replace(/^\/+/, '');
    if (!path) return 'Games';
    const first = path.split('/')[0];
    if (first === 'leaderboard') return 'Leaderboard';
    if (first === 'dashboard') return 'Dashboard';
    if (first === 'login') return 'Login';
    if (first === 'signup') return 'Signup';
    return 'Game';
  })();
  const logout = () => {
    localStorage.removeItem('thankeeu_games_token');
    localStorage.removeItem('thankeeu_games_player');
    window.location.href = gamesPath();
  };
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#120b24]/95 text-white backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:py-0">
        <Link to={gamesPath()} className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-white/20">
            <img src="/android-chrome-192x192.png" alt="Thankeeu" className="h-full w-full rounded-lg object-cover" />
          </span>
          <div className="min-w-0">
            <p className="font-black leading-none">thank<span className="text-primary-300">eeu</span> games</p>
            <p className="text-[11px] text-white/90">Inter-company league championship</p>
          </div>
        </Link>
        <nav className="hidden w-full flex-wrap items-center gap-2 text-sm font-semibold md:flex md:w-auto md:justify-end">
          <Link to={gamesPath('leaderboard')} className="rounded-lg px-3 py-2 text-white/85 hover:bg-white/10 hover:text-white">Leaderboard</Link>
          {player ? (
            <>
              <Link to={gamesPath('dashboard')} className="rounded-lg bg-white px-4 py-2 text-[#1a1035]">Dashboard</Link>
              <button onClick={logout} className="rounded-lg px-3 py-2 text-white/80 hover:text-white">Logout</button>
            </>
          ) : (
            <>
              <Link to={gamesPath('login')} className="rounded-lg px-3 py-2 text-white/85 hover:bg-white/10 hover:text-white">Login</Link>
              <Link to={gamesPath('signup')} className="rounded-lg bg-primary-500 px-4 py-2 text-white">Signup</Link>
            </>
          )}
        </nav>
        <nav className="flex w-full items-center gap-2 overflow-x-auto rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white md:hidden" aria-label="Games breadcrumb menu">
          <Link to={gamesPath()} className="shrink-0 text-white">Games</Link>
          <span className="shrink-0 text-white/80">/</span>
          <span className="shrink-0 text-white/90">{section}</span>
          <span className="mx-1 h-4 w-px shrink-0 bg-white/15" />
          <Link to={gamesPath('leaderboard')} className="shrink-0 text-white/90">Leaderboard</Link>
          {player ? (
            <>
              <Link to={gamesPath('dashboard')} className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 text-[#120b24]">Dashboard</Link>
              <button onClick={logout} className="shrink-0 text-white/90">Logout</button>
            </>
          ) : (
            <>
              <Link to={gamesPath('login')} className="shrink-0 text-white/90">Login</Link>
              <Link to={gamesPath('signup')} className="shrink-0 rounded-lg bg-primary-500 px-2.5 py-1.5 text-white">Signup</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

const GamesFooter = () => (
  <footer className="mt-auto bg-[#0c0718] px-4 py-8 text-white sm:py-10">
    <div className="mx-auto grid max-w-7xl gap-6 text-center sm:text-left md:grid-cols-3">
      <div>
        <p className="font-black">Thankeeu Games</p>
        <p className="mt-2 text-sm leading-6 text-white/85">Friday 2pm department games for employee engagement, recognition and friendly inter-company competition.</p>
      </div>
      <div className="text-sm leading-6 text-white/85">
        <p className="font-semibold text-white">Rules</p>
        <p className="mt-2">Unlimited companies can join each game. Only 2 employees per company can play a department game each week.</p>
      </div>
      <div className="text-sm leading-6 text-white/85">
        <p className="font-semibold text-white">Managed by Thankeeu</p>
        <p className="mt-2">Questions reset every Sunday. The normal Thankeeu admin controls games from the admin dashboard.</p>
      </div>
    </div>
  </footer>
);

const GameCard = ({ game }) => (
  <Link to={gamesPath(game.slug)} className="group overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
    <GameArtwork game={game} />
    <div className="p-4">
      <p className="line-clamp-3 min-h-[60px] text-sm leading-5 text-[#4c435f]">{game.description}</p>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-[#4f46e5]">
        <span>Friday 2pm</span>
        <span>Open game</span>
      </div>
    </div>
  </Link>
);

export const GamesHome = () => {
  const [departments, setDepartments] = useState([]);
  const [week, setWeek] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  useSEO({
    title: 'Thankeeu Games - Employee Engagement League',
    description: 'Thankeeu Games is an inter-company employee engagement league with Friday 2pm department games, public leaderboards and company teams.',
    canonical: 'https://games.thankeeu.com/',
    keywords: 'employee engagement games, inter-company league, workplace quiz games, department games, employee recognition leaderboard',
  });

  useEffect(() => {
    const t = setTimeout(() => {
      gamesAPI.listDepartments(q ? { q } : {}).then(res => {
        setDepartments(res.data.departments || []);
        setWeek(res.data.week);
        setPage(1);
      }).catch(() => toast.error('Could not load games'));
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(departments.length / pageSize));
  const visible = departments.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className={lightPageClass}>
      <GamesNav />
      <section className="bg-[#120b24] px-4 py-10 text-white sm:py-14">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-100 sm:text-sm sm:tracking-[0.2em]">Employee engagement league</p>
          <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight sm:text-4xl md:text-6xl">Department games for companies that want smarter employee engagement.</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/90 sm:text-lg">Every Friday at 2pm, employees compete in brainy department-specific games. Teams form automatically when two players share the same company email domain.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {['10 questions per game', '2 players max per company', 'Public weekly leaderboard'].map(item => (
              <div key={item} className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white">{item}</div>
            ))}
          </div>
        </div>
      </section>
      <main className={`${mainClass} mx-auto w-full max-w-7xl px-4 py-8 sm:py-10`}>
        <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black leading-tight text-[#201a33] sm:text-2xl">Choose your department game</h2>
            <p className="text-sm text-[#5f5672]">This week: {week?.week_key || 'loading'} - play day is Friday 2pm.</p>
          </div>
          <input value={q} onChange={e => setQ(e.target.value)} className={`input max-w-md ${inputContrastClass}`} placeholder="Search games, departments or roles..." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {visible.map(game => <GameCard key={game.id} game={game} />)}
        </div>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button className="btn-secondary px-4 py-2" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span className="text-sm font-semibold text-[#4c435f]">Page {page} of {totalPages}</span>
          <button className="btn-secondary px-4 py-2" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </main>
      <GamesFooter />
    </div>
  );
};

export const GamesAuth = ({ mode }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', job_title: '', avatar_url: '' });
  const isSignup = mode === 'signup';
  useSEO({ title: `${isSignup ? 'Signup' : 'Login'} - Thankeeu Games`, noIndex: true });
  const submit = async (e) => {
    e.preventDefault();
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
            <input type="email" className={`input ${inputContrastClass}`} required placeholder="you@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            {isSignup && <input className={`input ${inputContrastClass}`} placeholder="Job title" value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} />}
            {isSignup && <input className={`input ${inputContrastClass}`} required placeholder="Profile picture URL" value={form.avatar_url} onChange={e => setForm({ ...form, avatar_url: e.target.value })} />}
            <input type="password" className={`input ${inputContrastClass}`} required minLength={8} placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn-primary mt-6 w-full py-3">{isSignup ? 'Join the league' : 'Login'}</button>
          <p className="mt-4 text-center text-sm text-[#5f5672]">
            {isSignup ? 'Already registered?' : 'New to Thankeeu Games?'}{' '}
            <Link className="font-bold text-[#4f46e5]" to={isSignup ? gamesPath('login') : gamesPath('signup')}>{isSignup ? 'Login' : 'Signup'}</Link>
          </p>
        </form>
      </main>
    </div>
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
            <h1 className="mt-3 text-2xl font-black leading-tight sm:text-4xl">{department.name} Games</h1>
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
      <GamesFooter />
    </div>
  );
};

export const GamesPlay = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(600);
  useEffect(() => {
    if (!localStorage.getItem('thankeeu_games_token')) return navigate(gamesPath('login'));
    gamesAPI.play(slug).then(res => { setPayload(res.data); setSeconds(res.data.timer_seconds || 600); }).catch(err => toast.error(err.response?.data?.error || 'Could not start game'));
  }, [slug, navigate]);
  useEffect(() => {
    if (!payload || seconds <= 0) return undefined;
    const t = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [payload, seconds]);
  const submit = async () => {
    const list = Object.entries(answers).map(([question_no, option]) => ({ question_no: Number(question_no), option }));
    try {
      await gamesAPI.submit(slug, { answers: list, duration_seconds: 600 - seconds });
      toast.success('Submitted. Your poster is in your dashboard and email.');
      navigate(`${gamesPath('dashboard')}?tab=leaderboard`);
    } catch (err) { toast.error(err.response?.data?.error || 'Submit failed'); }
  };
  if (!payload) return <div className={lightPageClass}><GamesNav /><div className={`${mainClass} p-10 text-center text-[#201a33]`}>Preparing questions...</div></div>;
  return (
    <div className={lightPageClass}>
      <GamesNav />
      <main className={`${mainClass} mx-auto w-full max-w-4xl px-4 py-6 sm:py-8`}>
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <h1 className="text-sm font-black leading-tight text-[#201a33] sm:text-base">{payload.registration.games_departments?.name || 'Department'} Game</h1>
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
        <button onClick={submit} className="btn-primary my-8 w-full py-4">Submit game</button>
      </main>
    </div>
  );
};

export const GamesLeaderboard = () => {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const department = params.get('department') || '';
  useSEO({ title: 'Public Employee Games Leaderboard - Thankeeu Games', description: 'View weekly public leaderboards for Thankeeu Games employee engagement league.', canonical: 'https://games.thankeeu.com/leaderboard' });
  useEffect(() => {
    gamesAPI.leaderboard(department ? { department } : {}).then(res => setRows(res.data.rows || []));
  }, [department]);
  return (
    <div className={lightPageClass}>
      <GamesNav />
      <main className={`${mainClass} mx-auto w-full max-w-6xl px-4 py-8 sm:py-10`}>
        <h1 className="text-2xl font-black leading-tight text-[#201a33] sm:text-3xl">Public leaderboard</h1>
        <p className="mt-2 text-[#5f5672]">Filter by week or department from the games menu. Rankings sort by score, then fastest completion.</p>
        <input className={`input mt-6 max-w-md ${inputContrastClass}`} placeholder="Department slug filter e.g. accountant" value={department} onChange={e => setParams(e.target.value ? { department: e.target.value } : {})} />
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

const SignatureMediaInputs = ({ form, setForm }) => (
  <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
    <input className={`input ${inputContrastClass}`} placeholder="GIF URL optional" value={form.gif_url || ''} onChange={e => setForm({ ...form, gif_url: e.target.value })} />
    <input className={`input ${inputContrastClass}`} placeholder="Photo URL optional" value={form.photo_url || ''} onChange={e => setForm({ ...form, photo_url: e.target.value })} />
    <input className={`input ${inputContrastClass}`} placeholder="Video URL optional" value={form.video_url || ''} onChange={e => setForm({ ...form, video_url: e.target.value })} />
    <input className={`input ${inputContrastClass}`} placeholder="Voice note URL optional" value={form.voice_note_url || ''} onChange={e => setForm({ ...form, voice_note_url: e.target.value })} />
  </div>
);

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

export const GamesDashboard = () => {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [cards, setCards] = useState([]);
  const [pending, setPending] = useState([]);
  const tab = params.get('tab') || 'games';
  useEffect(() => {
    if (!localStorage.getItem('thankeeu_games_token')) return;
    Promise.all([
      gamesAPI.dashboard(),
      gamesAPI.myCongratsCards(),
      gamesAPI.pendingCongrats()
    ]).then(([dashboardRes, cardsRes, pendingRes]) => {
      setData(dashboardRes.data);
      setCards(cardsRes.data.cards || []);
      setPending(pendingRes.data.signatures || []);
    }).catch(() => {});
  }, []);
  if (!localStorage.getItem('thankeeu_games_token')) return <Navigate to={gamesPath('login')} replace />;
  if (!data) return <div className={lightPageClass}><GamesNav /><div className={`${mainClass} p-10 text-center text-[#201a33]`}>Loading dashboard...</div><GamesFooter /></div>;
  const tabs = ['games', 'co-players', 'cards', 'pending-to-sign', 'results', 'leaderboard', 'profile'];
  return (
    <div className={lightPageClass}>
      <GamesNav />
      <main className={`${mainClass} mx-auto w-full max-w-7xl px-4 py-6 sm:py-8`}>
        <div className="rounded-3xl bg-[#120b24] p-4 text-white sm:p-6">
          <div className="flex items-center gap-4">
            <img src={data.player.avatar_url} alt="" className="h-14 w-14 rounded-2xl object-cover sm:h-16 sm:w-16" />
            <div className="min-w-0">
              <h1 className="break-words text-xl font-black leading-tight text-white sm:text-2xl">{data.player.full_name}</h1>
              <p className="break-words text-sm text-white/90 sm:text-base">{data.player.company_name} - {data.player.job_title || 'Employee player'}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 sm:mt-6 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {tabs.map(t => <button key={t} onClick={() => setParams({ tab: t })} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm ${tab === t ? 'bg-primary-600 text-white' : 'bg-white text-[#4c435f]'}`}>{t.replace('-', ' ')}</button>)}
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
          {tab === 'profile' && <ProfileEditor player={data.player} onUpdate={p => setData({ ...data, player: p })} />}
        </section>
      </main>
      <GamesFooter />
    </div>
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
              <p className="text-4xl font-black text-white sm:text-5xl">{attempt.score}<span className="text-xl text-white/80 sm:text-2xl">/{attempt.total}</span></p>
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

const ProfileEditor = ({ player, onUpdate }) => {
  const [form, setForm] = useState({ full_name: player.full_name, job_title: player.job_title || '', avatar_url: player.avatar_url });
  const save = async () => {
    try {
      const res = await gamesAPI.updateProfile(form);
      localStorage.setItem('thankeeu_games_player', JSON.stringify(res.data));
      onUpdate(res.data);
      toast.success('Profile updated');
    } catch (err) { toast.error(err.response?.data?.error || 'Could not update profile'); }
  };
  return <div className="max-w-xl space-y-4"><input className={`input ${inputContrastClass}`} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /><input className={`input ${inputContrastClass}`} value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} /><input className={`input ${inputContrastClass}`} value={form.avatar_url} onChange={e => setForm({ ...form, avatar_url: e.target.value })} /><button onClick={save} className="btn-primary px-5 py-3">Save profile</button></div>;
};
