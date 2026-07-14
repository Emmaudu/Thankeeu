import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSEO } from '../../hooks/useSEO';
import { useCompanyAuth } from '../../context/CompanyAuthContext';
import { useMemberAuth } from '../../context/MemberAuthContext';
import { companyAPI } from '../../utils/api';
import { getWorkspaceSlug } from '../../utils/workspace';

const WorkspacePortal = () => {
  const slug = getWorkspaceSlug();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login: companyLogin } = useCompanyAuth();
  const { login: memberLogin } = useMemberAuth();
  const [workspace, setWorkspace] = useState(null);
  const [mode, setMode] = useState(searchParams.get('role') === 'member' ? 'member' : 'hr');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  useSEO({
    title: `${workspace?.name || 'Company'} Workspace - Thankeeu`,
    description: 'Sign in to your company workspace on Thankeeu.',
    noIndex: true,
  });

  useEffect(() => {
    companyAPI.getWorkspace()
      .then((res) => setWorkspace(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMode(searchParams.get('role') === 'member' ? 'member' : 'hr');
  }, [searchParams]);

  const workspaceHost = useMemo(() => {
    if (typeof window === 'undefined') return slug ? `${slug}.thankeeu.com` : '';
    return window.location.host;
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    localStorage.removeItem('thankeeu_token');
    localStorage.removeItem('thankeeu_user');
    if (mode === 'hr') {
      localStorage.removeItem('thankeeu_member_token');
      localStorage.removeItem('thankeeu_member');
    } else {
      localStorage.removeItem('thankeeu_company_token');
      localStorage.removeItem('thankeeu_company');
    }

    try {
      if (mode === 'hr') {
        await companyLogin(form.email, form.password);
        toast.success('Welcome back');
        navigate('/dashboard');
      } else {
        const res = await memberLogin(form.email, form.password);
        toast.success(`Welcome back, ${res.member.first_name}`);
        navigate('/member/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#151127] text-white flex items-center justify-center px-4 py-12">
      <section className="w-full max-w-5xl grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-center">
        <div>
          <img
            src={workspace?.logo_url || '/android-chrome-192x192.png'}
            alt={workspace?.name || 'Thankeeu'}
            className="w-16 h-16 rounded-2xl object-cover mb-6"
          />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-200">{workspaceHost}</p>
          <h1 className="mt-4 text-4xl font-bold">{workspace?.name || 'Company'} workspace</h1>
          <p className="mt-4 text-slate-300 max-w-md">
            Sign in as HR to manage your team, or sign in as a member to join celebrations and manage your cards.
          </p>
        </div>

        <div className="rounded-2xl bg-white text-warm-900 shadow-2xl border border-purple-100 p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-primary-50 p-1 mb-6">
            {[
              { id: 'hr', label: 'HR sign in' },
              { id: 'member', label: 'Member sign in' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                  mode === item.id ? 'bg-white text-primary-600 shadow-sm' : 'text-warm-600 hover:text-primary-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {searchParams.get('reason') === 'session_expired' && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium bg-amber-50 border border-amber-200 text-amber-800">
                Your session expired due to inactivity. Please sign in again.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Company email</label>
              <input
                type="email"
                className="input"
                placeholder={mode === 'hr' ? 'hr@company.com' : 'you@company.com'}
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-medium text-warm-700">Password</label>
                <Link
                  to={mode === 'hr' ? '/forgot-password' : '/member/forgot-password'}
                  className="text-xs text-primary-400 hover:text-primary-600"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Your password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-700 text-xs"
                >
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? 'Signing in...' : mode === 'hr' ? 'Sign in as HR' : 'Sign in as member'}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-primary-50 p-4 text-sm text-warm-700">
            <p className="font-semibold text-warm-900">New team member?</p>
            <p className="mt-1 text-xs">Create a member account for this workspace and wait for HR approval.</p>
            <Link to="/signup" className="btn-secondary w-full mt-3 py-3 text-center block">
              Sign up as member
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default WorkspacePortal;
