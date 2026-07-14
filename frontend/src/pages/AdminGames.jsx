import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSEO } from '../hooks/useSEO';
import { gamesAPI } from '../utils/api';

export default function AdminGames() {
  useSEO({ title: 'Admin Games - Thankeeu', noIndex: true });
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', description: '' });

  const load = () => gamesAPI.adminOverview().then(res => setData(res.data)).catch(err => toast.error(err.response?.data?.error || 'Could not load games admin'));
  useEffect(() => { load(); }, []);

  const createDepartment = async (e) => {
    e.preventDefault();
    try {
      await gamesAPI.adminCreateDepartment(form);
      setForm({ name: '', category: '', description: '' });
      toast.success('Department game added');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Could not add department'); }
  };

  const remove = async (id) => {
    if (!confirm('Remove this department game?')) return;
    await gamesAPI.adminDeleteDepartment(id);
    toast.success('Department removed');
    load();
  };

  const regenerate = async () => {
    const res = await gamesAPI.adminRegenerateWeek();
    toast.success(`Week regenerated. Notified ${res.data?.notified_players || 0} players.`);
    load();
  };

  const sendReminders = async () => {
    const res = await gamesAPI.adminSendReminders();
    toast.success(`Sent ${res.data?.reminders_sent || 0} Friday reminders.`);
  };

  const processCongratulations = async () => {
    const res = await gamesAPI.adminProcessCongratulations();
    toast.success(`Processed ${res.data?.mondayReminders || 0} card reminders and ${res.data?.deliveredCards || 0} deliveries.`);
  };

  if (!data) return <main className="min-h-screen bg-[#f8f6ff] p-8">Loading games admin...</main>;

  return (
    <main className="min-h-screen bg-[#f8f6ff] p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Link to="/admin" className="text-sm font-semibold text-primary-600">Back to Thankeeu admin</Link>
            <h1 className="mt-2 text-3xl font-black text-warm-900">Thankeeu Games Admin</h1>
            <p className="text-warm-500">Control games.thankeeu.com from the normal Thankeeu admin account. Current week: {data.week.week_key}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={sendReminders} className="btn-secondary px-5 py-3">Send Friday reminders</button>
            <button onClick={processCongratulations} className="btn-secondary px-5 py-3">Process congratulations cards</button>
            <button onClick={regenerate} className="btn-primary px-5 py-3">Regenerate week questions</button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="font-black text-warm-900">Add department game</h2>
            <form onSubmit={createDepartment} className="mt-4 space-y-3">
              <input className="input" placeholder="Department name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <input className="input" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              <textarea className="input min-h-[110px]" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <button className="btn-primary w-full py-3">Add department</button>
            </form>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="font-black text-warm-900">Department games</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {data.departments.map(dept => (
                <div key={dept.id} className="rounded-2xl border border-purple-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-warm-900">{dept.name}</p>
                      <p className="text-xs text-warm-500">{dept.category} - /games/{dept.slug}</p>
                    </div>
                    <button onClick={() => remove(dept.id)} className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-600">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-black text-warm-900">Weekly participants</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-warm-500"><th className="p-3">Employee</th><th className="p-3">Email</th><th className="p-3">Company</th><th className="p-3">Game</th></tr></thead>
              <tbody>
                {data.registrations.map(r => (
                  <tr key={r.id} className="border-t border-purple-50">
                    <td className="p-3 font-semibold">{r.games_players?.full_name}</td>
                    <td className="p-3">{r.games_players?.email}</td>
                    <td className="p-3">{r.games_players?.company_name}</td>
                    <td className="p-3">{r.games_departments?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-black text-warm-900">Leaderboard</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.leaderboard.map((row, index) => (
              <div key={row.id} className="flex items-center justify-between rounded-2xl bg-primary-50 p-4">
                <div>
                  <p className="font-bold text-warm-900">#{index + 1} {row.full_name}</p>
                  <p className="text-xs text-warm-500">{row.company_name} - {row.department_name}</p>
                </div>
                <p className="text-xl font-black text-primary-700">{row.score}/{row.total}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
