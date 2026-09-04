/**
 * MoneyCardView — the recipient's page: /money/:slug?token=…
 *
 * They open the card, read the message, then take the money either to their
 * bank account or as a gift card. Both routes are the platform's existing
 * rails (Flutterwave transfers / Reloadly), reached through /api/money/:slug/claim.
 *
 * Authorisation is the private `token` in the emailed link, OR being signed in
 * with the address the card was sent to — so a recipient who signs up later
 * still gets in without the original email.
 */
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSEO } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import CardCoverPreview from '../components/CardCoverPreview';
import MediaSwiper from '../components/MediaSwiper';
import { moneyAPI, banksAPI, giftcardsAPI } from '../utils/api';
import { messageMediaItems } from '../utils/messageMedia';
import { getCardDesign, getFontStyle } from '../utils/cardDesigns';
import { getAlbumTheme, getAlbumInk, getContrastTextColor } from '../utils/albumThemes';
import { formatNGN } from '../utils/currency';

const PAYOUT_FEE_PCT = 0.03;

export default function MoneyCardView() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [card, setCard]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [opened, setOpened]   = useState(false);
  const [mode, setMode]       = useState(null);        // 'bank' | 'giftcard'
  const [claiming, setClaiming] = useState(false);

  // Bank claim
  const [banks, setBanks]   = useState([]);
  const [bank, setBank]     = useState({ bank_code: '', bank_name: '', account_number: '', account_name: '' });
  const [verifying, setVerifying] = useState(false);

  // Gift card claim
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');

  useSEO({
    title: card ? `${card.sender_name} sent you money — Thankeeu` : 'Your money card — Thankeeu',
    description: 'Open your Thankeeu card and take the money to your bank account or as a gift card.',
    noIndex: true, // private, per-recipient page
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await moneyAPI.getPublic(slug, token);
        if (!cancelled) setCard(data);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || 'This card could not be opened.');
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [slug, token]);

  useEffect(() => {
    if (mode !== 'bank' || banks.length) return;
    banksAPI.getList().then(r => setBanks(r.data || [])).catch(() => toast.error('Could not load the bank list.'));
  }, [mode, banks.length]);

  useEffect(() => {
    if (mode !== 'giftcard' || products.length) return;
    giftcardsAPI.getProducts('NG', 'NGN').then(r => setProducts(r.data || [])).catch(() => {});
  }, [mode, products.length]);

  // Resolve the account name as soon as a 10-digit NUBAN and a bank are chosen,
  // so the recipient sees whose account it is before any money moves.
  useEffect(() => {
    if (bank.account_number.length !== 10 || !bank.bank_code) return;
    let cancelled = false;
    setVerifying(true);
    banksAPI.verify({ account_number: bank.account_number, account_bank: bank.bank_code })
      .then(r => { if (!cancelled) setBank(b => ({ ...b, account_name: r.data?.account_name || '' })); })
      .catch(() => { if (!cancelled) setBank(b => ({ ...b, account_name: '' })); })
      .finally(() => { if (!cancelled) setVerifying(false); });
    return () => { cancelled = true; };
  }, [bank.account_number, bank.bank_code]);

  const claim = async () => {
    setClaiming(true);
    try {
      const body = mode === 'bank'
        ? { token, claim_type: 'bank', ...bank }
        : { token, claim_type: 'giftcard', product_id: productId,
            product_name: products.find(p => p.id === productId)?.name };
      const { data } = await moneyAPI.claim(slug, body);
      toast.success(mode === 'bank' ? 'On its way to your bank account.' : 'Your gift card is on the way.');
      setCard(c => ({ ...c, claimed: true, claim_type: mode, claim_status: data.status || 'processing',
                      claim_amount: data.amount, claim_fee: data.fee,
                      claim_redemption_code: data.redemption_code || null }));
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not complete your claim.');
    } finally { setClaiming(false); }
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#F5F0FF]">
      <p className="text-sm font-bold text-warm-500">Opening your card…</p></div>;
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F5F0FF]">
        <Navbar />
        <main className="grid flex-1 place-items-center px-4">
          <div className="max-w-md rounded-3xl border border-purple-100 bg-white p-8 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-purple-50 text-3xl">🔒</div>
            <h1 className="mb-2 text-xl font-bold text-warm-900">{error}</h1>
            <p className="mb-5 text-sm text-warm-600">
              Open the link from your email, or sign in with the address the card was sent to.
            </p>
            <Link to={`/login?returnTo=${encodeURIComponent(`/money/${slug}`)}`} className="btn-primary">Sign in</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const design     = getCardDesign(card.design_theme);
  const albumTheme = getAlbumTheme(card.album_background_theme);
  const pageInk    = getAlbumInk(albumTheme, 'page');
  const msgFont    = getFontStyle(card.message_font_style);
  // Read through the shared reader so the stored {media_url, media_type}
  // shape (and the legacy variants) all render.
  const mediaItems = messageMediaItems(card);
  const gross      = Number(card.gift_amount || 0);
  const fee        = Math.round(gross * PAYOUT_FEE_PCT);
  const net        = gross - fee;

  return (
    <div className="flex min-h-screen flex-col" style={{ background: design.soft || '#F5F0FF' }}>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">

        <div className="mb-6 text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary-600">You have money waiting</p>
          <h1 className="mt-2 text-3xl font-bold text-warm-900 sm:text-4xl">
            {card.sender_name} sent you {formatNGN(gross)}
          </h1>
        </div>

        {/* The card */}
        <div className="overflow-hidden rounded-3xl p-5 sm:p-8" style={{ background: albumTheme.stage }}>
          {!opened ? (
            <div className="mx-auto w-full max-w-[300px] text-center">
              <CardCoverPreview
                design={design}
                occasionLabel={(card.occasion || '').replace(/_/g, ' ')}
                recipientName={card.recipient_name}
                title={card.title}
                senderName={card.sender_name}
                coverColor={card.background_color?.startsWith('#') ? card.background_color : undefined}
                textColor={card.cover_text_color && card.cover_text_color !== 'auto'
                  ? card.cover_text_color
                  : getContrastTextColor(card.background_color, design)}
                fontFamily={getFontStyle(card.font_style).family}
                layout={card.cover_layout}
              />
              <button type="button" onClick={() => setOpened(true)} className="btn-primary mt-5">
                Open the card
              </button>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-[420px] rounded-2xl p-6 shadow-xl"
              style={{ background: albumTheme.page, color: pageInk }}>
              {mediaItems.length > 0 && (
                <div className="mb-4">
                  <MediaSwiper
                    items={mediaItems.map(m => ({ url: m.media_url, type: m.media_type }))}
                    height={190} accent={design.accent} rounded="rounded-xl"
                  />
                </div>
              )}
              <p className="break-words leading-relaxed"
                style={{ fontFamily: msgFont.family, fontSize: Number(card.message_font_size) || 20 }}>
                {card.message || 'They sent you something.'}
              </p>
              <div className="mt-4">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-white"
                  style={{ background: '#059669' }}>🎁 {formatNGN(gross)}</span>
              </div>
              <p className="mt-4 text-right text-sm font-bold"
                style={{ fontFamily: "'Dancing Script',cursive", fontSize: 20, color: design.accent }}>
                — {card.sender_name}
              </p>
            </div>
          )}
        </div>

        {/* Claim */}
        <section className="mt-6 rounded-3xl border border-purple-100 bg-white p-6">
          {card.claimed ? (
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl">✓</div>
              <h2 className="mb-1 text-lg font-bold text-warm-900">
                {card.claim_type === 'bank' ? 'On its way to your bank' : 'Your gift card is on the way'}
              </h2>
              <p className="text-sm text-warm-600">
                {formatNGN(card.claim_amount ?? net)} after a {formatNGN(card.claim_fee ?? fee)} payout fee.
              </p>
              {card.claim_redemption_code && (
                <p className="mt-3 inline-block rounded-xl bg-purple-50 px-4 py-2 font-mono text-sm font-bold text-primary-700">
                  {card.claim_redemption_code}
                </p>
              )}
            </div>
          ) : (
            <>
              <h2 className="mb-1 text-lg font-bold text-warm-900">How would you like it?</h2>
              <p className="mb-4 text-sm text-warm-600">
                Take it straight to your bank account, or as a gift card. Either way it is yours.
              </p>

              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                {[
                  { id: 'bank', icon: 'CreditCard', title: 'To my bank', body: `${formatNGN(net)} after a 3% payout fee` },
                  { id: 'giftcard', icon: 'Gift', title: 'As a gift card', body: 'Shopping, airtime, streaming and more' },
                ].map(o => (
                  <button key={o.id} type="button" onClick={() => setMode(o.id)}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                      mode === o.id ? 'border-primary-500 bg-primary-50' : 'border-purple-100 hover:border-primary-200'}`}>
                    <Icon name={o.icon} size={18} className="mt-0.5 flex-shrink-0 text-primary-500" />
                    <span>
                      <span className="block text-sm font-bold text-warm-900">{o.title}</span>
                      <span className="block text-xs text-warm-500">{o.body}</span>
                    </span>
                  </button>
                ))}
              </div>

              {mode === 'bank' && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-warm-600">Bank</label>
                    <select className="input w-full" value={bank.bank_code}
                      onChange={e => setBank(b => ({ ...b, bank_code: e.target.value,
                        bank_name: e.target.selectedOptions[0]?.text || '' }))}>
                      <option value="">Choose your bank</option>
                      {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-warm-600">Account number</label>
                    <input className="input w-full" inputMode="numeric" maxLength={10} value={bank.account_number}
                      onChange={e => setBank(b => ({ ...b, account_number: e.target.value.replace(/\D/g, '') }))} />
                    {verifying && <p className="mt-1 text-xs text-warm-500">Checking the account…</p>}
                    {bank.account_name && (
                      <p className="mt-1 text-xs font-bold text-emerald-600">✓ {bank.account_name}</p>
                    )}
                  </div>
                  <button type="button" onClick={claim}
                    disabled={claiming || !bank.bank_code || bank.account_number.length !== 10}
                    className="btn-primary w-full">
                    {claiming ? 'Sending…' : `Send ${formatNGN(net)} to my bank`}
                  </button>
                </div>
              )}

              {mode === 'giftcard' && (
                <div className="space-y-3">
                  <label className="mb-1.5 block text-xs font-bold text-warm-600">Choose a gift card</label>
                  <select className="input w-full" value={productId} onChange={e => setProductId(e.target.value)}>
                    <option value="">Pick one</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                  </select>
                  <button type="button" onClick={claim} disabled={claiming || !productId} className="btn-primary w-full">
                    {claiming ? 'Issuing…' : `Get a ${formatNGN(net)} gift card`}
                  </button>
                </div>
              )}

              <p className="mt-4 text-center text-[11px] text-warm-500">
                Thankeeu will never ask for your card PIN, OTP or password.
              </p>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
