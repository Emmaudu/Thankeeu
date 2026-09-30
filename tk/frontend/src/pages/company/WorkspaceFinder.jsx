import { useState } from 'react';
import { companyAPI } from '../../utils/api';
import { useSEO } from '../../hooks/useSEO';
import toast from 'react-hot-toast';

const normalizeDomainInput = (value) => (
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0]
);

const WorkspaceFinder = () => {
  useSEO({
    title: 'Find Your Company Workspace - Thankeeu',
    description: 'Enter your company domain to open your Thankeeu workspace.',
    noIndex: true,
  });

  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanDomain = normalizeDomainInput(domain);
    if (!cleanDomain || !cleanDomain.includes('.')) {
      toast.error('Enter your company domain, for example flutterwave.com');
      return;
    }

    setLoading(true);
    try {
      const res = await companyAPI.lookupWorkspace(cleanDomain);
      window.location.href = `${res.data.workspace_url}/login`;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Workspace not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#151127] text-white flex items-center justify-center px-4 py-12">
      <section className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/android-chrome-192x192.png"
            alt="Thankeeu"
            className="w-14 h-14 rounded-2xl mx-auto mb-4"
          />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-200">Company workspace</p>
          <h1 className="mt-3 text-3xl font-bold">Find your sign in page</h1>
          <p className="mt-3 text-sm text-slate-300">
            Enter your company domain without www. We will take you to the right Thankeeu workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 text-warm-900 shadow-2xl border border-purple-100">
          <label className="block text-sm font-semibold mb-2">Company domain</label>
          <input
            className="input"
            placeholder="flutterwave.com"
            autoCapitalize="none"
            autoCorrect="off"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-5">
            {loading ? 'Finding workspace...' : 'Continue'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Example: flutterwave.com opens flutterwave.thankeeu.com.
        </p>
      </section>
    </main>
  );
};

export default WorkspaceFinder;
