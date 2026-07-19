import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import { subscriptionAPI, creditsAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import toast from 'react-hot-toast';
import { formatCurrency, getCurrency, convertFromNGN } from '../utils/currency';

// ── Plans ─────────────────────────────────────────────────────────────────────
// Pack-of-N options with progressive per-card discount
const PACK_OPTIONS = [
 { id: 'pack5', credits: 5, priceNGN: 20000, perCardNGN: 4000, savingsNGN: 5000 },
 { id: 'pack10', credits: 10, priceNGN: 40000, perCardNGN: 4000, savingsNGN: 10000 },
 { id: 'pack25', credits: 25, priceNGN: 100000, perCardNGN: 4000, savingsNGN: 25000 },
 { id: 'pack50', credits: 50, priceNGN: 200000, perCardNGN: 4000, savingsNGN: 50000 },
 { id: 'pack70', credits: 70, priceNGN: 280000, perCardNGN: 4000, savingsNGN: 70000 },
 { id: 'pack100', credits: 100, priceNGN: 400000, perCardNGN: 4000, savingsNGN: 100000 },
];

const INDIVIDUAL_PLANS = [
 {
 id: 'single', name: 'Classic', priceNGN: 5000, credits: 1, savingsNGN: 0,
 label: 'Send one card — full experience included',
 btn: 'Create your card →', btnIcon: 'Sparkles', popular: false,
 btnStyle: 'border-2 border-purple-200 text-primary-600 hover:bg-primary-50',
 features: [
 { text: 'Send 1 group card (use any time)', ok: true },
 { text: 'Unlimited contributors — anyone can sign', ok: true },
 { text: '100+ premium card designs', ok: true },
 { text: 'Video, photo & voice messages', ok: true },
 { text: 'Scheduled delivery on any date', ok: true },
 { text: 'Gift pooling · Visa, Mastercard & bank transfer', ok: true },
 { text: 'WhatsApp & email invite links', ok: true },
 { text: 'Memory Movie™ — card auto-generates a cinematic MP4 with music', ok: true, link: '/memory-movie' },
 { text: 'Live Memory Wall™ — guests upload photos via QR code, no app needed', ok: true, link: '/live-memory-wall' },
 { text: 'Download card as PDF', ok: true },
 ],
 },
 {
 id: 'standard', name: 'Standard', priceNGN: 9000, credits: 2, savingsNGN: 1000,
 label: 'Two cards — save on the second',
 btn: 'Get 2 cards', btnIcon: 'Star', popular: true,
 btnStyle: 'bg-primary-500 text-white hover:bg-primary-600',
 features: [
 { text: 'Send 2 group cards (use any time)', ok: true },
 { text: 'All the same card features as Classic', ok: true },
 { text: 'Unlimited contributors — anyone can sign', ok: true },
 { text: '100+ premium card designs', ok: true },
 { text: 'Video, photo & voice messages', ok: true },
 { text: 'Gift pooling · Visa, Mastercard & bank transfer', ok: true },
 { text: 'WhatsApp & email invite links', ok: true },
 { text: 'Memory Movie™ — card auto-generates a cinematic MP4 with music', ok: true, link: '/memory-movie' },
 { text: 'Live Memory Wall™ — guests upload photos via QR code, no app needed', ok: true, link: '/live-memory-wall' },
 { text: 'Credits never expire', ok: true },
 ],
 },
 {
 id: 'pack5', name: 'Pack of 5', priceNGN: 20000, credits: 5,
 label: '5 card credits — lowest per-card price',
 btn: 'Buy 5 credits', btnIcon: 'Gift', popular: false,
 btnStyle: 'border-2 border-green-300 text-green-700 hover:bg-green-50',
 features: [
 { text: '5 card credits (use any time)', ok: true },
 { text: 'All the same card features as Classic', ok: true },
 { text: 'Unlimited contributors — anyone can sign', ok: true },
 { text: '100+ premium card designs', ok: true },
 { text: 'Video, photo & voice messages', ok: true },
 { text: 'Gift pooling · Visa, Mastercard & bank transfer', ok: true },
 { text: 'WhatsApp & email invite links', ok: true },
 { text: 'Memory Movie™ — card auto-generates a cinematic MP4 with music', ok: true, link: '/memory-movie' },
 { text: 'Live Memory Wall™ — guests upload photos via QR code, no app needed', ok: true, link: '/live-memory-wall' },
 { text: 'Credits never expire', ok: true },
 ],
 },
];

const COMPANY_PLANS = [
 {
 id: 'monthly', name: 'Monthly', period: '/month',
 features: ['Unlimited employees','Automated birthday emails','Birthday card delivery','Gift pooling · Visa, Mastercard & bank transfer','HR dashboard & analytics','Import & re-import team data','Memory Movie™ — included on every card','Live Memory Wall™ — guests upload via QR code on every card','Email support within 24 hours'],
 },
 {
 id: 'yearly', name: 'Yearly', period: '/year', popular: true,
 features: ['Everything in Monthly','2 months FREE vs monthly','Priority phone & email support','Custom email branding','Dedicated account manager','Advanced birthday analytics','Memory Movie™ — included on every card','Live Memory Wall™ — guests upload via QR code on every card','Team data export anytime'],
 },
];

const FAQ = [
 { q: 'Does Thankeeu work outside the US?', a: 'Yes — Thankeeu works globally. Contributors can pay in USD, GBP, EUR, CAD, AUD and 30+ currencies. The card creator pays the card fee in their preferred currency, automatically converted at checkout.' },
 { q: 'How does the gift pot work?', a: 'Contributors pay securely when signing using Visa, Mastercard, or bank transfer. Money is securely held and the recipient can withdraw to their bank account or redeem a gift card — instantly.' },
 { q: 'Does the recipient need an account?', a: 'No — recipients open and enjoy their card without any account. Only the card creator needs one.' },
 { q: 'What payment methods are accepted?', a: 'Visa, Mastercard, American Express, and bank transfers depending on your country. All processed securely by our payments partner.' },
 { q: 'What happens if I cancel my company subscription?', a: 'Automation stops after your current period ends, but all your team data is preserved.' },
];

import { CurrencyToggle, RotatingPrice } from '../utils/currencyUI';

// ── Main Pricing page ─────────────────────────────────────────────────────────
const Pricing = () => {
 useSEO({
 title: 'Pricing — Group Cards, Memory Movies & Photo Walls from $3.99 | Thankeeu',
 description: 'Send a group card from $3.99 USD / £4.99 GBP. Every plan includes the Memory Movie slideshow and Live Photo Wall for collecting guest photos via QR code. Pool a gift in USD, GBP, EUR, NGN and more. Team plans with HR automation. Free to create — pay when you send.',
 keywords: 'group card price, online group card cost, Thankeeu pricing, team card subscription, memory movie included, live photo wall price, event photo sharing cost, birthday card price',
 canonical: '/pricing',
 jsonLd: [
   SCHEMAS.organization,
   SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Pricing', url: '/pricing' }]),
   SCHEMAS.webPage('Thankeeu Pricing', 'Group card pricing — free to create, pay only when you send. Memory Movie and Live Photo Wall included on every plan.', '/pricing'),
   // Product/Offer schema for the two headline individual plans, priced in USD
   // (the site's primary marketed currency, matching the page title/description).
   // USD amounts are derived from the same NGN base + rate table the page uses
   // to display prices, so the schema can never drift from what users actually see.
   SCHEMAS.product(
     'Thankeeu Classic Group Card',
     'One group card everyone signs — messages, photos, GIFs and voice notes, a pooled gift, plus the Memory Movie and Live Photo Wall. Free to create; one-time fee to send.',
     convertFromNGN(INDIVIDUAL_PLANS[0].priceNGN, 'USD').toFixed(2),
     'USD',
   ),
   SCHEMAS.product(
     'Thankeeu Standard (2 cards)',
     'Two group card credits at a lower per-card price. Includes the Memory Movie slideshow, Live Photo Wall and gift collection on every card.',
     convertFromNGN(INDIVIDUAL_PLANS[1].priceNGN, 'USD').toFixed(2),
     'USD',
   ),
 ],
 });

 const { user } = useAuth();
 const { company } = useCompanyAuth();
 const navigate = useNavigate();

 const [tab, setTab] = useState('individual');
 const [currency, setCurrency] = useState(() => {
 // Detect user's likely currency from browser locale + timezone — no API call needed.
 // UK visitors see GBP by default; Nigerians see NGN; others default to USD.
 try {
 const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
 const lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
 if (tz.startsWith('Europe/London') || tz === 'Europe/Dublin' || lang.startsWith('en-gb')) return 'GBP';
 if (tz.startsWith('America/') && lang.startsWith('en-ca')) return 'CAD';
 if (tz.startsWith('Europe/')) return 'EUR';
 } catch (_) {}
 return 'USD'; // Always default USD — Nigerian/African users can switch manually
 });
 const [loadingPlan, setLoadingPlan] = useState(null);
 const [openFAQ, setOpenFAQ] = useState(null);
 const [showDemo, setShowDemo] = useState(false);
 const [selectedPack, setSelectedPack] = useState(PACK_OPTIONS[0]);

 const cur = getCurrency(currency);

 const fmt = (ngn) => formatCurrency(ngn, currency);

 const handleIndividualPurchase = async (planId) => {
 // Classic (single 1-credit card) — send visitor straight to card creation.
 // No account required to start; they'll be prompted to sign in at checkout.
 // Every other plan (Standard 2-credits, packs) still requires an account
 // because they involve credit purchases that need a wallet to hold credits.
 if (planId === 'single') {
   navigate('/card/new');
   return;
 }
 if (!user) {
   // Require account — store intended plan and redirect to signup
   sessionStorage.setItem('post_signup_plan', planId);
   navigate('/signup?plan=' + planId);
   return;
 }
 setLoadingPlan(planId);
 try {
 // Use creditsAPI — these are credit purchases, not direct card payments
 const res = await creditsAPI.purchase(planId, currency);
 window.location.href = res.data.payment_link;
 } catch { toast.error('Failed to start payment. Please try again.'); setLoadingPlan(null); }
 };

 const handleCompanySubscribe = async (plan) => {
 if (!company) { navigate('/company/signup'); return; }
 setLoadingPlan(plan);
 try {
 const res = await subscriptionAPI.initialize(plan, currency);
 window.location.href = res.data.payment_link || res.data.authorization_url;
 } catch { toast.error('Failed to start payment. Please try again.'); setLoadingPlan(null); }
 };

 return (
 <div className="min-h-screen gc-font">
 <Navbar />

 {/* Hero */}
 <section className="py-12 md:py-16 px-4 text-center section-dots" style={{ background: 'linear-gradient(160deg,#F5F0FF,#FDFCFF 60%,#FFF0F5)' }}>
 <div className="max-w-2xl mx-auto">
 <div className="mx-auto mb-4 inline-flex items-center gap-1.5"><Icon name="Globe" size={13}/>For everyone, everywhere</div>
 <h1 className="font-extrabold text-warm-900 mb-3" style={{ fontSize: 'clamp(2.1rem,6.5vw,3.6rem)' }}>
 Pay once. Keep the memory forever.
 </h1>
 <p className="text-warm-600 mb-2">Pay only when you send. No subscriptions for individual cards.</p>
 <p className="text-warm-500 text-sm mb-6">
 Pay in USD, GBP, EUR, NGN, CAD, GHS and 30+ currencies — priced for every market.
 </p>

 {/* Rotating price showcase */}
 <div className="inline-flex flex-col items-center bg-white rounded-2xl border-2 border-primary-100 px-6 py-4 shadow-sm mb-6">
 <p className="text-xs text-warm-400 mb-1 font-medium">One card — from</p>
 <div className="text-3xl font-extrabold text-primary-600 min-w-[120px] text-center">
 <RotatingPrice amountNGN={5000} />
 </div>
 <p className="text-xs text-warm-400 mt-1">Select your currency below · Memory Movie + Photo Wall included</p>
 </div>

 {/* Currency selector */}
 <div className="mb-2">
 <p className="text-xs font-semibold text-warm-500 mb-2">Select your currency to see prices:</p>
 <CurrencyToggle selected={currency} onChange={setCurrency} />
 </div>
 </div>
 </section>

 {/* Tab switcher */}
 <div className="bg-white border-b border-purple-100 sticky top-0 z-10 shadow-sm">
 <div className="max-w-4xl mx-auto px-4">
 <div className="flex">
 {[
 { id: 'individual', label: 'Individual', icon: 'Heart', sub: 'Personal cards & gifts' },
 { id: 'company', label: 'For Teams', icon: 'Building', sub: 'Birthday automation' },
 ].map(t => (
 <button key={t.id} onClick={() => setTab(t.id)}
 className={`flex-1 py-3 sm:py-4 text-center border-b-2 transition-all min-h-[56px] ${
 tab === t.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-warm-500'
 }`}>
 <p className="font-bold text-sm inline-flex items-center gap-1.5"><Icon name={t.icon} size={14}/> {t.label}</p>
 <p className="text-xs text-warm-400 hidden sm:block mt-0.5">{t.sub}</p>
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Individual plans */}
 {tab === 'individual' && (
 <section className="py-10 md:py-16 px-4 bg-white">
 <div className="max-w-5xl mx-auto">

 {/* Currency selector (repeated for convenience) */}
 <div className="text-center mb-8">
 <p className="text-xs font-semibold text-warm-500 mb-2">Showing prices in {cur.flag} {cur.name}</p>
 <CurrencyToggle selected={currency} onChange={setCurrency} />
 {currency !== 'NGN' && (
 <p className="text-xs text-warm-400 mt-2">
 Approximate {cur.name} equivalent · Live exchange rate applied at checkout
 </p>
 )}
 </div>

 <div className="pricing-plans-grid grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
 {/* Classic + Standard */}
 {INDIVIDUAL_PLANS.filter(p => p.id !== 'pack5').map(plan => (
 <div key={plan.id} className="gc-card relative p-6 flex flex-col"
 style={plan.popular ? { border: '2px solid #7C3AED' } : undefined}>
 {plan.popular && (
 <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1.5 rounded-xl whitespace-nowrap inline-flex items-center gap-1.5">
 <Icon name="Star" size={12}/>Most popular
 </div>
 )}
 <h3 className="text-xl font-bold text-warm-900 mb-1">{plan.name}</h3>
 <p className="text-warm-500 text-xs mb-4">{plan.label}</p>
 <div className="flex items-end gap-1 mb-1">
 <span className="text-3xl sm:text-4xl font-bold text-warm-900">{fmt(plan.priceNGN)}</span>
 <span className="text-warm-400 text-sm pb-1">· one-time</span>
 </div>
 {currency !== 'NGN' && currency !== 'GBP' && currency !== 'USD' && currency !== 'EUR' && currency !== 'CAD' && (
 <p className="text-xs text-warm-400 mb-1">≈ ₦{plan.priceNGN.toLocaleString('en-NG')} NGN</p>
 )}
 {plan.savingsNGN > 0 && (
 <p className="text-primary-600 text-xs font-bold mb-1">
 Save {fmt(plan.savingsNGN)} vs {plan.credits} classics
 </p>
 )}
 <div className="h-px bg-purple-100 my-4" />
 <ul className="space-y-2.5 mb-7 flex-1">
 {plan.features.map((f, i) => (
 <li key={i} className="flex items-start gap-2 text-sm">
 <span className={`flex-shrink-0 mt-0.5 ${f.ok ? 'text-green-500' : 'text-warm-300'}`}>
 <Icon name={f.ok ? 'Check' : 'X'} size={15}/>
 </span>
 {f.link
 ? <Link to={f.link} className="text-primary-600 hover:underline font-medium">{f.text}</Link>
 : <span className={f.ok ? 'text-warm-700' : 'text-warm-400 line-through'}>{f.text}</span>}
 </li>
 ))}
 </ul>
 <button onClick={() => handleIndividualPurchase(plan.id)} disabled={loadingPlan === plan.id}
 className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 ${plan.btnStyle}`}>
 {loadingPlan === plan.id
 ? <span className="flex items-center justify-center gap-2">
 <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
 Processing…
 </span>
 : <span className="inline-flex items-center justify-center gap-2"><Icon name={plan.btnIcon} size={15}/> {plan.btn}</span>}
 </button>
 </div>
 ))}

 {/* Credit Pack — dropdown to pick pack size */}
 <div className="gc-card relative p-6 flex flex-col" style={{ border: '2px solid #16a34a' }}>
 <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-xl whitespace-nowrap inline-flex items-center gap-1.5">
 Lowest per-card price
 </div>
 <h3 className="text-xl font-bold text-warm-900 mb-1">Credit Pack</h3>
 <p className="text-warm-500 text-xs mb-4">Choose how many cards you need</p>

 {/* Pack size dropdown — key={currency} forces remount so options show correct currency */}
 <div className="mb-3">
 <label className="block text-xs font-bold text-warm-600 mb-1.5">Pack size</label>
 <select
   key={currency}
   value={selectedPack.id}
   onChange={e => setSelectedPack(PACK_OPTIONS.find(p => p.id === e.target.value))}
   className="w-full rounded-xl border-2 border-green-200 bg-white text-warm-900 text-sm font-semibold px-3 py-2.5 focus:outline-none focus:border-green-500 cursor-pointer"
 >
   {PACK_OPTIONS.map(p => (
     <option key={p.id} value={p.id}>
       {p.credits} cards — {fmt(p.perCardNGN)}/card ({fmt(p.priceNGN)})
     </option>
   ))}
 </select>
 </div>

 <div className="flex items-end gap-1 mb-1">
 <span className="text-3xl sm:text-4xl font-bold text-warm-900">{fmt(selectedPack.priceNGN)}</span>
 <span className="text-warm-400 text-sm pb-1">· one-time</span>
 </div>
 {currency !== 'NGN' && !['GBP','USD','EUR','CAD'].includes(currency) && (
 <p className="text-xs text-warm-400 mb-1">≈ ₦{selectedPack.priceNGN.toLocaleString('en-NG')} NGN</p>
 )}
 <p className="text-green-700 text-xs font-bold mb-0.5">
 {fmt(selectedPack.perCardNGN)} per card (flat rate) · {fmt(selectedPack.priceNGN)} total
 </p>
 {selectedPack.savingsNGN > 0 && (
 <p className="text-green-600 text-xs font-bold mb-1">Save {fmt(selectedPack.savingsNGN)} vs {selectedPack.credits} singles</p>
 )}

 <div className="h-px bg-purple-100 my-4" />
 <ul className="space-y-2.5 mb-7 flex-1">
 {[
 { text: `${selectedPack.credits} card credits (never expire)`, ok: true },
 { text: 'Unlimited contributors — anyone can sign', ok: true },
 { text: '100+ premium card designs', ok: true },
 { text: 'Video, photo & voice messages', ok: true },
 { text: 'Gift pooling · Visa, Mastercard & bank transfer', ok: true },
 { text: 'Memory Movie™ — every card auto-generates a cinematic MP4', ok: true },
 { text: 'Live Memory Wall™ — guests upload photos via QR code, no app', ok: true },
 { text: 'Use credits across any cards, any time', ok: true },
 { text: 'Credits never expire', ok: true },
 ].map((f, i) => (
 <li key={i} className="flex items-start gap-2 text-sm">
 <span className="flex-shrink-0 mt-0.5 text-green-500"><Icon name="Check" size={15}/></span>
 <span className="text-warm-700">{f.text}</span>
 </li>
 ))}
 </ul>
 <button onClick={() => handleIndividualPurchase(selectedPack.id)} disabled={loadingPlan === selectedPack.id}
 className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 bg-green-600 text-white hover:bg-green-700">
 {loadingPlan === selectedPack.id
 ? <span className="flex items-center justify-center gap-2">
 <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
 Processing…
 </span>
 : <span className="inline-flex items-center justify-center gap-2">
 <Icon name="Gift" size={15}/>Buy {selectedPack.credits} credits — {fmt(selectedPack.priceNGN)}
 </span>}
 </button>
 </div>
 </div>

 {/* Gift pot fees */}
 <div className="gc-card p-5 sm:p-8 max-w-2xl mx-auto" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
 <h3 className="text-xl font-bold text-warm-900 mb-1 text-center flex items-center justify-center gap-2"><Icon name="Wallet" size={18} className="text-green-600"/>Gift pot fees</h3>
 <p className="text-warm-500 text-center text-sm mb-6">A small platform cut keeps Thankeeu running</p>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 {[
 { icon: 'Gift', title: 'Gift vouchers', sub: '3% cut' },
 { icon: 'Card', title: 'Cash withdrawal', sub: '3% platform fee' },
 { icon: 'Globe', title: 'Global payouts', sub: 'FLW live FX rate' },
 ].map(r => (
 <div key={r.title} className="text-center">
 <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm"><Icon name={r.icon} size={20} className="text-green-600"/></div>
 <p className="font-bold text-warm-900 text-xs">{r.title}</p>
 <p className="text-green-600 text-xs font-bold mt-1">{r.sub}</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 </section>
 )}

 {/* Company plans */}
 {tab === 'company' && (
 <section className="py-10 md:py-16 px-4 bg-white">
 <div className="max-w-4xl mx-auto">
 <div className="text-center mb-8">
 <div className="mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Building" size={13}/>Thankeeu for Teams</div>
 <h2 className="font-extrabold text-warm-900 mb-3" style={{ fontSize: 'clamp(1.85rem,5.5vw,2.5rem)' }}>
 Automate team celebrations
 </h2>
 <p className="text-warm-500 max-w-lg mx-auto text-sm leading-relaxed">
 Upload your employees once. Thankeeu handles everything — cards, emails, gift pots. All automatic.
 </p>
 <p className="text-primary-600 font-semibold text-sm mt-2">Price based on your team headcount — get a quote to see your rate</p>

 {/* Currency toggle for company plans */}
 <div className="mt-5">
 <p className="text-xs font-semibold text-warm-500 mb-2">Showing prices in {cur.flag} {cur.name}</p>
 <CurrencyToggle selected={currency} onChange={setCurrency} />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-8">
 <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
 <p className="font-bold text-green-800 text-sm mb-2 flex items-center gap-2"><Icon name="Check" size={15}/>Always free</p>
 <ul className="space-y-1.5">
 {['Company account','Team template download','Unlimited employee upload','View birthdays dashboard'].map(f => (
 <li key={f} className="text-xs text-green-700 flex gap-1.5"><Icon name="Check" size={13} className="flex-shrink-0 mt-0.5"/>{f}</li>
 ))}
 </ul>
 </div>
 <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4">
 <p className="font-bold text-primary-800 text-sm mb-2 flex items-center gap-2"><Icon name="Card" size={15}/>Requires subscription</p>
 <ul className="space-y-1.5">
 {['Auto birthday dept emails','Auto card creation & sending','Gift pot collection','HR analytics & tracking'].map(f => (
 <li key={f} className="text-xs text-primary-700 flex gap-1.5"><Icon name="ArrowRight" size={13} className="flex-shrink-0 mt-0.5"/>{f}</li>
 ))}
 </ul>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto mb-10">
 {COMPANY_PLANS.map(plan => (
 <div key={plan.id} className="gc-card relative p-6" style={plan.popular ? { border: '2px solid #7C3AED' } : undefined}>
 {plan.popular && (
 <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1.5 rounded-xl whitespace-nowrap inline-flex items-center gap-1.5">
 <Icon name="Star" size={12}/>Best value
 </div>
 )}
 <h3 className="text-xl font-bold text-warm-900 mb-1">{plan.name}</h3>
 <div className="mb-3">
 <p className="text-2xl font-bold text-warm-900">Get a quote</p>
 <p className="text-xs text-warm-400 mt-1">Price based on your team headcount</p>
 </div>
 <div className="h-px bg-purple-100 mb-4" />
 <ul className="space-y-2 mb-7">
 {plan.features.map((f, i) => (
 <li key={i} className="flex items-start gap-2 text-sm">
 <span className="text-green-500 mt-0.5 flex-shrink-0"><Icon name="Check" size={15}/></span>
 <span className="text-warm-700">{f}</span>
 </li>
 ))}
 </ul>
 <button onClick={() => setShowDemo(true)}
 className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${
 plan.popular ? 'bg-primary-500 text-white hover:bg-primary-600' : 'border-2 border-purple-200 text-primary-600 hover:bg-primary-50'
 }`}>
 Get a quote — it's free
 </button>
 </div>
 ))}
 </div>

 {!company && (
 <div className="text-center">
 <Link to="/company/signup" className="gc-btn-primary px-6 py-3.5 text-sm sm:text-base inline-flex items-center gap-2">
 <Icon name="Building" size={16}/>Create free company account
 </Link>
 <p className="text-xs text-warm-400 mt-3">
 Already have one? <Link to="/company/login" className="text-primary-500 font-bold">Sign in →</Link>
 </p>
 </div>
 )}
 </div>
 </section>
 )}

 {/* FAQ */}
 <section className="py-12 md:py-16 px-4 section-dots" style={{ background: '#F5F0FF' }}>
 <div className="max-w-2xl mx-auto">
 <h3 className="text-2xl sm:text-3xl font-bold text-warm-900 text-center mb-7">Frequently asked</h3>
 <div className="space-y-3">
 {FAQ.map((f, i) => (
 <div key={i} className="gc-card overflow-hidden">
 <button onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
 className="w-full flex items-center justify-between p-4 sm:p-5 text-left gap-3 min-h-[56px]">
 <span className="font-semibold text-warm-900 text-sm">{f.q}</span>
 <span className={`text-primary-400 flex-shrink-0 transition-transform text-lg ${openFAQ === i ? 'rotate-180' : ''}`}>▾</span>
 </button>
 {openFAQ === i && (
 <div className="px-4 sm:px-5 pb-4 sm:pb-5">
 <p className="text-sm text-warm-600 leading-relaxed">{f.a}</p>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* CTA */}
 <section className="py-14 px-4 text-center" style={{ background: 'linear-gradient(135deg,#F5F0FF,#FFF0F5)' }}>
 <div className="max-w-xl mx-auto">
 <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-2">Ready to get started?</h2>
 <p className="text-warm-500 mb-2">Works in the US, UK, Canada, Australia, Europe and 30+ countries.</p>
 <p className="text-warm-400 text-sm mb-7">Pay in your local currency. Celebrate anyone, anywhere.</p>
 <div className="flex flex-col sm:flex-row gap-3 justify-center">
 <Link to="/card/new" className="gc-btn-primary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto inline-flex items-center justify-center gap-2">
 <Icon name="Heart" size={16}/>Create personal card
 </Link>
 <Link to="/company/signup" className="gc-btn-secondary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto inline-flex items-center justify-center gap-2">
 <Icon name="Building" size={16}/>Set up for my team
 </Link>
 </div>
 </div>
 </section>

 {/* Get a quote modal */}
 {showDemo && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
 style={{ background:'rgba(26,16,53,0.7)', backdropFilter:'blur(8px)' }}
 onClick={() => setShowDemo(false)}>
 <div className="bg-white rounded-3xl p-7 max-w-md w-full" onClick={e => e.stopPropagation()}>
 <h3 className="text-xl font-bold text-warm-900 mb-1">Get a quote for your team</h3>
 <p className="text-sm text-warm-500 mb-5">Tell us about your company and we will send you a custom price within 24 hours.</p>
 <form onSubmit={async e => {
 e.preventDefault();
 const fd = new FormData(e.target);
 try {
 await fetch('/api/demo/request', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(Object.fromEntries(fd))
 });
 toast.success('Request sent! We will reach out within 24 hours.');
 setShowDemo(false);
 } catch { toast.error('Failed to send. Email us at hello@thankeeu.com'); }
 }} className="space-y-3">
 <input name="contact_name" required placeholder="Your name" className="input w-full" />
 <input name="email" type="email" required placeholder="Work email" className="input w-full" />
 <input name="company_name" required placeholder="Company name" className="input w-full" />
 <input name="team_size" placeholder="Team size (e.g. 50)" className="input w-full" />
 <textarea name="message" placeholder="Anything else?" rows={2} className="input w-full" />
 <div className="flex gap-3 pt-1">
 <button type="button" onClick={() => setShowDemo(false)} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
 <button type="submit" className="btn-primary flex-1 py-2.5 text-sm">Send request →</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Fade-slide animation */}
 <style>{`
 @keyframes fadeSlideIn {
 from { opacity: 0; transform: translateY(-6px); }
 to { opacity: 1; transform: translateY(0); }
 }
 `}</style>

 <Footer />
 </div>
 );
};

export default Pricing;
