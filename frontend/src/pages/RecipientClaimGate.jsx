/**
 * RecipientClaimGate.jsx  —  /card/:slug?claim=TOKEN
 *
 * When a recipient clicks the "Open my card" button in their email they land here.
 * This page checks the claim token against the backend to decide which gate to show:
 *
 *   gate = 'login'        → individual user account exists → show login form
 *   gate = 'signup'       → no account → show signup / claim form
 *   gate = 'member_login' → HR team member who accepted invite → show member login
 *   gate = 'member_claim' → HR team member who never set password → show set-password form
 *
 * After authentication the access_token is stored in sessionStorage and the user
 * is redirected to /card/:slug so CardView can load the full card as recipient.
 */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const BASE = import.meta.env.VITE_API_URL || '/api';
const api  = axios.create({ baseURL: BASE, timeout: 15000 });

// ── Spinner ───────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="min-h-screen grid place-items-center" style={{ background: 'linear-gradient(160deg,#F5F0FF,#FFF0F5)' }}>
    <div className="text-center">
      <div className="w-14 h-14 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-warm-500 text-sm">Loading your card…</p>
    </div>
  </div>
);

// ── Shared card: stores access_token and redirects to CardView ─────────────
function useRedirectToCard(slug, accessToken) {
  const navigate = useNavigate();
  return () => {
    if (accessToken) sessionStorage.setItem(`card_token_${slug}`, accessToken);
    navigate(`/card/${slug}`, { replace: true });
  };
}

// ── Gate: Individual user login ────────────────────────────────────────────
function LoginGate({ gateData, slug, onMarkClaimed }) {
  const [email,    setEmail]    = useState(gateData.recipient_email || '');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const redirectToCard = useRedirectToCard(slug, gateData.access_token);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token } = res.data;
      localStorage.setItem('thankeeu_token', token);
      // Mark this card as claimed by this user
      await onMarkClaimed(token);
      toast.success(`Welcome back! Your card is ready 🎉`);
      redirectToCard();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold text-warm-900">Your card is waiting!</h2>
        <p className="text-warm-500 text-sm mt-1">Sign in to view your card from <strong>{gateData.recipient_name && gateData.recipient_name}</strong>'s friends</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-700 mb-1">Email</label>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="input w-full" required
          placeholder="your@email.com"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-700 mb-1">Password</label>
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="input w-full" required
          placeholder="Your Thankeeu password"
        />
      </div>
      <button type="submit" disabled={loading}
        className="btn-primary w-full py-3 text-base font-bold">
        {loading ? 'Signing in…' : '🎉 Sign in & open my card'}
      </button>
      <p className="text-center text-xs text-warm-400">
        Forgot your password?{' '}
        <Link to={`/forgot-password`} className="text-primary-600 font-semibold hover:underline">
          Reset it
        </Link>
      </p>
    </form>
  );
}

// ── Gate: Signup / claim account ───────────────────────────────────────────
function SignupGate({ gateData, slug, onMarkClaimed }) {
  const [fullName, setFullName] = useState(gateData.recipient_name || '');
  const [email,    setEmail]    = useState(gateData.recipient_email || '');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const redirectToCard = useRedirectToCard(slug, gateData.access_token);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 8)  { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      // Generate a unique-enough username from email prefix + random suffix
      const emailPrefix = email.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 15) || 'user';
      const username = emailPrefix + Math.random().toString(36).slice(2, 8);
      const res = await api.post('/auth/signup', {
        full_name: fullName,
        email,
        password,
        username,
      });
      const { token } = res.data;
      localStorage.setItem('thankeeu_token', token);
      // After signup cards are auto-linked in authController — just mark claimed
      await onMarkClaimed(token);
      toast.success('Account created! Your card and gift are now in your dashboard 🎉');
      redirectToCard();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🎁</div>
        <h2 className="text-2xl font-bold text-warm-900">Claim your card!</h2>
        <p className="text-warm-500 text-sm mt-1">
          Create a free account to access your card, see all the messages, and withdraw your gift.
        </p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-700 mb-1">Your name</label>
        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
          className="input w-full" required placeholder="Your full name" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-700 mb-1">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="input w-full" required placeholder="your@email.com" />
        <p className="text-xs text-amber-600 mt-1">⚠️ Use the email this card was sent to so your card is linked automatically</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-700 mb-1">Create password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="input w-full" required minLength={8} placeholder="At least 8 characters" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-700 mb-1">Confirm password</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
          className="input w-full" required placeholder="Same password again" />
      </div>
      <button type="submit" disabled={loading}
        className="btn-primary w-full py-3 text-base font-bold">
        {loading ? 'Creating account…' : '🎁 Create account & claim my card'}
      </button>
      <p className="text-center text-xs text-warm-400">
        Already have an account?{' '}
        <Link to={`/login?redirect=${encodeURIComponent(`/card/${slug}`)}`} className="text-primary-600 font-semibold hover:underline">
          Sign in instead
        </Link>
      </p>
    </form>
  );
}

// ── Gate: HR team member login ─────────────────────────────────────────────
function MemberLoginGate({ gateData, slug, onMarkClaimed }) {
  const [email,    setEmail]    = useState(gateData.recipient_email || '');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const redirectToCard = useRedirectToCard(slug, gateData.access_token);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/members/login', { email, password });
      const { token } = res.data;
      localStorage.setItem('thankeeu_member_token', token);
      await onMarkClaimed(null, token); // pass member token
      toast.success('Welcome! Your card is ready 🎉');
      redirectToCard();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold text-warm-900">Your team card is waiting!</h2>
        <p className="text-warm-500 text-sm mt-1">Sign into your team dashboard to see your card and gift</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-700 mb-1">Work email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="input w-full" required />
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-700 mb-1">Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="input w-full" required placeholder="Your team account password" />
      </div>
      <button type="submit" disabled={loading}
        className="btn-primary w-full py-3 text-base font-bold">
        {loading ? 'Signing in…' : '🎉 Sign in & open my card'}
      </button>
      <p className="text-center text-xs text-warm-400">
        Forgot your password?{' '}
        <Link to={`/member/login`} className="text-primary-600 font-semibold hover:underline">
          Reset it
        </Link>
      </p>
    </form>
  );
}

// ── Gate: HR team member first-time — set password to claim ───────────────
function MemberClaimGate({ gateData, slug, onMarkClaimed }) {
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const redirectToCard = useRedirectToCard(slug, gateData.access_token);

  // We'll use the existing member reset-password endpoint with the invite_token
  // The invite_token is NOT exposed here — we call a new endpoint that accepts
  // the claim_token (from the URL) as proof of identity to set the password.
  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 8)  { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await api.post(`/cards/${slug}/claim-member-password`, {
        claim_token_value: new URLSearchParams(window.location.search).get('claim'),
        email: gateData.recipient_email,
        password,
      });
      const { token } = res.data;
      localStorage.setItem('thankeeu_member_token', token);
      await onMarkClaimed(null, token);
      toast.success('Password set! Welcome — your card and gift are ready 🎉');
      redirectToCard();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSetPassword} className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🎁</div>
        <h2 className="text-2xl font-bold text-warm-900">Set your password to claim your card!</h2>
        <p className="text-warm-500 text-sm mt-1">
          Your HR team created an account for <strong>{gateData.recipient_email}</strong>. 
          Set a password to access your team dashboard, card, and gift.
        </p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-700 mb-1">New password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="input w-full" required minLength={8} placeholder="At least 8 characters" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-700 mb-1">Confirm password</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
          className="input w-full" required placeholder="Same password again" />
      </div>
      <button type="submit" disabled={loading}
        className="btn-primary w-full py-3 text-base font-bold">
        {loading ? 'Setting password…' : '🎁 Set password & claim my card'}
      </button>
    </form>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function RecipientClaimGate() {
  const { slug }         = useParams();
  const [searchParams]   = useSearchParams();
  const claimToken       = searchParams.get('claim');
  const [gateData, setGateData]   = useState(null);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState(null);
  const navigate = useNavigate();

  // Also handle old-format ?token= links (sent before claim_token system was added)
  const legacyToken = searchParams.get('token');

  useEffect(() => {
    if (!claimToken) {
      // No claim token — check for legacy ?token= access_token format
      if (legacyToken) {
        // Old email format: store it and go straight to CardView as recipient
        sessionStorage.setItem(`card_token_${slug}`, legacyToken);
        navigate(`/card/${slug}?token=${encodeURIComponent(legacyToken)}`, { replace: true });
        return;
      }
      // Nothing at all — just open card normally
      navigate(`/card/${slug}`, { replace: true });
      return;
    }

    api.get(`/cards/${slug}/claim-gate?claim=${encodeURIComponent(claimToken)}`)
      .then(res => { setGateData(res.data); setLoading(false); })
      .catch(err => {
        const status = err.response?.status;
        const msg    = err.response?.data?.error || '';

        setLoading(false);

        // 404 = claim token not found in DB.
        // This happens when:
        //  a) An old email link where claim_token wasn't saved (pre-fix bug)
        //  b) The link was copied incorrectly (truncated/modified)
        //  c) The card was sent before the claim_token migration ran
        // Strategy: show the card publicly so recipient can still read messages,
        // AND show a soft banner prompting them to sign in to access gift/private messages.
        if (status === 404) {
          navigate(`/card/${slug}`, { replace: true });
          return;
        }

        setError(msg || 'This link is invalid or has expired.');
      });
  }, [slug, claimToken, legacyToken]);

  // After auth: call mark-claimed with the bearer token so the card is linked
  const markClaimed = async (userToken, memberToken) => {
    try {
      const authHeader = userToken || memberToken
        ? `Bearer ${userToken || memberToken}`
        : null;
      await api.post(
        `/cards/${slug}/mark-claimed`,
        { access_token: gateData.access_token },
        authHeader ? { headers: { Authorization: authHeader } } : {}
      );
    } catch (e) {
      console.warn('markClaimed failed (non-fatal):', e.message);
    }
  };

  if (loading) return <Spinner />;

  if (error) return (
    <div className="min-h-screen grid place-items-center px-4" style={{ background: 'linear-gradient(160deg,#F5F0FF,#FFF0F5)' }}>
      <div className="max-w-sm w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-red-100">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-warm-900 mb-2">Link couldn't be verified</h2>
        <p className="text-warm-500 text-sm mb-5">{error}</p>
        <a
          href={`/card/${slug}`}
          className="block w-full py-3 rounded-2xl font-bold text-white text-center mb-3"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#EC4899)' }}>
          💌 View card anyway
        </a>
        <p className="text-xs text-warm-400">
          Or sign into your{' '}
          <Link to="/dashboard" className="text-primary-600 font-semibold">dashboard</Link>
          {' '}·{' '}
          <Link to="/member/dashboard" className="text-primary-600 font-semibold">team dashboard</Link>
          {' '}to find your card in the Received tab.
        </p>
      </div>
    </div>
  );

  const gate = gateData?.gate;

  return (
    <div className="min-h-screen grid place-items-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg,#F5F0FF,#FFF0F5)' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl font-black text-primary-600" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Thankeeu
            </span>
          </a>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-primary-700 mb-2">
            💌 You have a card waiting
          </div>
        </div>

        {/* Gate card */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-purple-100">
          {gate === 'login'        && <LoginGate        gateData={gateData} slug={slug} onMarkClaimed={markClaimed} />}
          {gate === 'signup'       && <SignupGate        gateData={gateData} slug={slug} onMarkClaimed={markClaimed} />}
          {gate === 'member_login' && <MemberLoginGate   gateData={gateData} slug={slug} onMarkClaimed={markClaimed} />}
          {gate === 'member_claim' && <MemberClaimGate   gateData={gateData} slug={slug} onMarkClaimed={markClaimed} />}
        </div>

        <p className="text-center text-xs text-warm-400 mt-4">
          Thankeeu · Group Cards & Gifts
        </p>
      </div>
    </div>
  );
}
