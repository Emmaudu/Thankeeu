/**
 * CardStart.jsx — /card/new
 *
 * The public card-creation wizard for guests (and logged-in users from the homepage).
 * Deliberately short — 4 steps, matching the dashboard CreateCard experience:
 *
 * Step 0 Occasion — pick the type of card
 * Step 1 Design — pick template + font + layout
 * Step 2 Details — recipient, dates, title, toggles
 * Step 3 Gift & Pay — gift pot + invites → save draft → auth wall
 * (authenticated users go straight to payment)
 *
 * Nobody writes a message here. The creator adds theirs after the card is live,
 * on the same /sign page they send to everyone else — one place to write, and
 * setting up a card stays a minute's work.
 *
 * Guest flow:
 * Steps 0-2 are pure UI (no backend calls).
 * Step 3 "Save draft & continue" creates one anonymous draft via createDraft(),
 * then shows the auth wall with the full summary.
 * After login/signup the draft is claimed and they land on the payment step.
 *
 * Authenticated flow:
 * Steps 0-1 are pure UI.
 * Step 2 → 3 button calls handleCreateDraft() to persist to backend.
 * Step 3 shows normal payment panel.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { useAuth } from '../context/AuthContext';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import Navbar from '../components/Navbar';
import Icon from '../components/ui/Icon';
import QRButton from '../components/QRButton';
import CompanyLayout from '../components/company/CompanyLayout';
import MemberLayout from '../components/member/MemberLayout';
import toast from 'react-hot-toast';
import { cardsAPI, paymentsAPI, creditsAPI, messagesAPI, wallAPI } from '../utils/api';
import { CARD_DESIGNS, FONT_STYLES, getFontStyle } from '../utils/cardDesigns';
import { getOccasionLabel } from '../utils/occasionCardDesigns';
import { ALBUM_THEMES, getContrastTextColor } from '../utils/albumThemes';
import { formatNGN, formatCurrency, CURRENCIES } from '../utils/currency';
import CardCoverPreview from '../components/CardCoverPreview';
import AlbumStudioPreview, { makeWallPreviewCard } from '../components/AlbumStudioPreview';
import CoverTextStudio from '../components/CoverTextStudio';
import InlineAuthPanel from '../components/InlineAuthPanel';
import IntentSummaryStrip from '../components/IntentSummaryStrip';
import { takeIntent } from '../utils/cardIntent';
import { applyCardIntent } from '../utils/applyCardIntent';

// ─── Constants ───────────────────────────────────────────────────────────────
const OCCASIONS = [
 { id: 'birthday',        icon: 'Cake',         label: 'Birthday' },
 { id: 'valentine',       icon: 'Heart',        label: "Valentine's" },
 { id: 'leaving',         icon: 'Briefcase',    label: 'Leaving job' },
 { id: 'anniversary',     icon: 'Gift',         label: 'Anniversary' },
 { id: 'wedding',         icon: 'Diamond',      label: 'Wedding' },
 { id: 'baby_shower',     icon: 'Baby',         label: 'Baby shower' },
 { id: 'retirement',      icon: 'Sun',          label: 'Retirement' },
 { id: 'congratulations', icon: 'PartyPopper',  label: 'Congrats' },
 { id: 'graduation',      icon: 'GraduationCap',label: 'Graduation' },
 { id: 'promotion',       icon: 'TrendingUp',   label: 'Promotion' },
 { id: 'christmas',       icon: 'Snowflake',    label: 'Christmas' },
 { id: 'get_well',        icon: 'HeartPulse',   label: 'Get well' },
 { id: 'new_year',        icon: 'Star',         label: 'New Year' },
 { id: 'thank_you',       icon: 'Heart',        label: 'Thank you' },
 { id: 'sympathy',        icon: 'Flower',       label: 'Sympathy' },
 { id: 'good_luck',       icon: 'Sparkles',     label: 'Good luck' },
 { id: 'other',           icon: 'Sparkles',     label: 'Other' },
];

const STEPS = ['Occasion', 'Design', 'Details', 'Finalise'];
const PENDING_KEY = 'thankeeu_pending_card';

// ─── Step indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ current }) => (
 <div className="flex items-center mb-8">
 {STEPS.map((s, i) => (
 <div key={s} className="flex items-center flex-1 last:flex-none">
 <div className="flex items-center gap-1.5">
 <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
 i < current ? 'bg-primary-500 text-white' :
 i === current ? 'bg-primary-500 text-white ring-4 ring-primary-100' :
 'bg-purple-50 text-warm-400'}`}>
 {i < current ? '' : i + 1}
 </div>
 <span className={`text-xs font-medium hidden sm:block ${i <= current ? 'text-warm-900' : 'text-warm-400'}`}>{s}</span>
 </div>
 {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 transition-all ${i < current ? 'bg-primary-400' : 'bg-gray-200'}`}/>}
 </div>
 ))}
 </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const CardStart = () => {
 useSEO({
 title: 'Create a Free Online Group Card | Thankeeu',
 description: 'Make a stunning group card for any occasion — birthday, farewell, promotion, and more. Add a gift pot, invite everyone via WhatsApp, schedule delivery. Free to start.',
  keywords: 'create group card online free, make birthday group card, farewell group card Nigeria, online group card with gift',
  canonical: '/card/customize',
  noIndex: false,
});

 const { user } = useAuth();
 const { member } = useMemberAuth();
 const { company } = useCompanyAuth();
 const isCompanyUser = !!(member || company);
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();
 const creatorName = user?.full_name || company?.contact_person || company?.name || member?.first_name || 'You';

 // A signed-in creator builds cards inside their dashboard, never on the public
 // wizard: /create-card is this same flow wrapped in DashboardLayout, so we hand
 // them straight over (query string intact, so ?occasion=/?design=/?resumed=1
 // from the gallery or a post-login return all still land correctly).
 // Guests stay here — that's the whole point of the public flow. Company and
 // team accounts already render inside their own layouts further down.
 // Suspended while the inline panel shows its hand-off countdown; that panel
 // navigates itself when the countdown ends or the customer skips it.
 const [handingOff, setHandingOff] = useState(false);
 const redirectToDashboardFlow = !!user && !isCompanyUser && !handingOff;
 useEffect(() => {
  if (!redirectToDashboardFlow) return;
  // When a guest signs in from the panel below, this effect fires the moment
  // `user` appears and races the panel's own navigate — and whichever wins
  // decides the URL. If a draft snapshot is waiting, resumed=1 is added here
  // so the customer lands on the review step either way, instead of being
  // dropped back at step 0 with their card seemingly gone.
  const params = new URLSearchParams(window.location.search);
  try {
    if (localStorage.getItem(PENDING_KEY)) params.set('resumed', '1');
  } catch { /* private mode — fall through with whatever params exist */ }
  const qs = params.toString();
  navigate(`/create-card${qs ? `?${qs}` : ''}`, { replace: true });
 }, [redirectToDashboardFlow, navigate]);

 // ── Wizard state ────────────────────────────────────────────────────────
 const [step, setStep] = useState(0);
 // Step 1 is now design-only — the old "experience" (Group Card vs Live Wall)
 // sub-step has moved to tabs directly above the live preview, which removed
 // a redundant wizard step (see the Group Card / Live Wall tabs near where
 // <AlbumStudioPreview> is rendered).
 const [designsExpanded, setDesignsExpanded] = useState(false);
 // The Group Card / Live Wall chooser has been removed from this flow: picking a
 // template now drops straight into the Album/Board sub-tabs (Album preselected),
 // so nothing has to be tapped before the live preview appears. Cards created
 // here are always card_only.
 // Scroll to top whenever the user advances or goes back a step
 useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

 const [loading, setLoading] = useState(false);
 const [paymentStage, setPaymentStage] = useState('idle');
 const [draftSlug, setDraftSlug] = useState(null);
 const [liveSlug, setLiveSlug] = useState(null);
 const [guestSaved, setGuestSaved] = useState(false); // true after draft created in step 4
 const [creditBalance, setCreditBalance]= useState(null);
 const [payMode, setPayMode] = useState('direct');
 const [selectedCurrency, setSelectedCurrency] = useState('NGN');
 const [discountCode, setDiscountCode] = useState('');
 const [discountStatus, setDiscountStatus] = useState(null); // null | 'applied' | 'invalid'
 const [discountMessage, setDiscountMessage] = useState('');
 const [discountedNGN, setDiscountedNGN] = useState(null);
 const [inviteEmails, setInviteEmails] = useState('');

 // ── Card form ────────────────────────────────────────────────────────────
 const [form, setForm] = useState({
 occasion: 'birthday', design_theme: 'birthday-featured-01',
 background_color: '#FBEAF0', font_style: 'elegant', card_layout: 'album',
 cover_text_color: 'auto', album_background_theme: 'cover_blur',
 title: "Someone's Birthday Card",
 cover_sender: creatorName === 'You' ? '' : creatorName,
 recipient_name: '', recipient_email: '',
 send_date: '', send_time: '09:00',
 deadline: '', deadline_time: '23:59',
 is_gift_enabled: true, gift_type: 'pot', suggested_amount: 2500,
 allow_private_messages: true, send_reminders: true, hide_amounts: false,
 notification_scope: 'department',
 card_experience: 'card_only',
 custom_occasion: '',
 cover_layout: null, // {title,recipient,sender} positions/size/colour/show — null = defaults
 });
 const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
 const [selectedCoverField, setSelectedCoverField] = useState('recipient');

 // ── Type-to-create handover ──────────────────────────────────────────────
 // The homepage box stashes a parsed sentence; ?intent=1 says to pick it up.
 // Guarded on redirectToDashboardFlow: a signed-in individual is about to be
 // forwarded to /create-card, and consuming (which clears) the intent here
 // would leave that page with nothing to apply.
 const [intentSummary, setIntentSummary] = useState([]);
 // An email typed into the homepage sentence pre-fills the sign-in field below.
 // Only the email — never a password. See InlineAuthPanel.
 const [intentEmail, setIntentEmail] = useState('');
 useEffect(() => {
  if (redirectToDashboardFlow) return;
  if (searchParams.get('intent') !== '1') return;
  const intent = takeIntent();
  if (!intent) return;
  const { patch, step: target, summary } = applyCardIntent(intent, {
    creatorName, occasionIds: OCCASIONS.map(o => o.id),
  });
  if (!Object.keys(patch).length) return;
  setForm(prev => ({ ...prev, ...patch }));
  setStep(target);
  setIntentSummary(summary);
  if (intent.email) setIntentEmail(intent.email);
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [redirectToDashboardFlow]);

 // ── Message form ─────────────────────────────────────────────────────────
 // The creator no longer writes a message during setup — they add theirs after
 // the card is live, on the same signing page as everyone they invite. This
 // state is kept only so the live preview has a shape to render and so an older
 // saved draft (which may still carry a msgSnapshot) restores without throwing.
 const [msgForm, setMsgForm] = useState({ content: '', font_style: 'handwritten', is_private: false });
 const [mediaFiles] = useState([]);
 const [wallDrafts, setWallDrafts] = useState(() => [makeWallPreviewCard(creatorName, 0)]);
 const [recipientPhoto, setRecipientPhoto] = useState(null); // board-style recipient image {file,preview}

 // Convert local date+time to UTC before sending to backend.
 // The backend and cron run in UTC, so we must store UTC times to deliver
 // at the exact local time the user expects.
 // Uses the browser's own timezone (works for Nigeria WAT, UK GMT/BST, etc.)
 const toUTCSendTime = (dateStr, timeStr) => {
 if (!dateStr) return { send_date: dateStr, send_time: timeStr };
 // Ensure time has seconds — input type="time" returns "HH:MM" without seconds
 const fullTime = (timeStr || '09:00').replace(/^(\d{2}:\d{2})$/, '$1:00');
 const localDatetime = new Date(`${dateStr}T${fullTime}`);
 if (isNaN(localDatetime.getTime())) return { send_date: dateStr, send_time: timeStr };
 const utcDate = localDatetime.toISOString().slice(0, 10); // "YYYY-MM-DD"
 const utcTime = localDatetime.toISOString().slice(11, 19); // "HH:MM:SS"
 return { send_date: utcDate, send_time: utcTime };
 };

 const [customCoverUrl, setCustomCoverUrl] = useState(null); // Cloudinary URL for uploaded cover
 const [uploadingCover, setUploadingCover] = useState(false);

 // Admin-uploaded cover designs for the current occasion (via the Cover Design
 // admin tab). Newest-first from the backend; merged ahead of the built-in
 // static designs below so a fresh upload appears first without displacing
 // older uploads — they queue behind it.
 const [adminDesigns, setAdminDesigns] = useState([]);
 useEffect(() => {
  if (!form.occasion) { setAdminDesigns([]); return; }
  let cancelled = false;
  cardsAPI.getCoverDesigns(form.occasion)
   .then(r => {
    if (cancelled) return;
    const rows = r.data?.designs || [];
    // Wrap each uploaded row into the same shape CARD_DESIGNS entries use
    // (matches the LEAVING_CARD_DESIGNS wrapper pattern in cardDesigns.js)
    // so every existing consumer (CardCoverPreview, gallery, etc.) renders
    // it with zero special-casing.
    setAdminDesigns(rows.map(row => ({
     id: `admin-${row.id}`,
     occasion: row.occasion,
     name: row.name || 'Uploaded design',
     icon: 'Image',
     image: row.image_url,
     background: '#1a1035',
     ink: '#ffffff',
     accent: '#7c3aed',
     soft: '#f5f0ff',
     art: 'confetti',
     dark: true,
     palette: ['#102a43', '#7c3aed', '#0f766e', '#be123c', '#ca8a04'],
     badge: 'New',
    })));
   })
   .catch(() => { if (!cancelled) setAdminDesigns([]); }); // never block card creation on this
  return () => { cancelled = true; };
 }, [form.occasion]);

 const selectedDesign = form.design_theme === 'custom_upload'
   ? {
       id: 'custom_upload', occasion: form.occasion, name: 'Your design',
       image: customCoverUrl || (form.background_color?.startsWith('blob:') || form.background_color?.startsWith('http') ? form.background_color : null),
       background: '#1a1035', ink: '#ffffff', accent: '#7c3aed', dark: true,
       coverTitle: form.title, icon: 'Image',
     }
   : (adminDesigns.find(d => d.id === form.design_theme) || CARD_DESIGNS.find(d => d.id === form.design_theme));
  // Show only real image/artwork covers; retire the old plain gradient templates.
  // Admin-uploaded designs go first (already newest-first from the API), the
  // static catalogue follows — this is the "queue" behaviour: a fresh upload
  // is visible immediately at the front, older uploads and static designs
  // simply shift down rather than being displaced or lost.
  const availableDesigns = (() => {
    const realCovers = CARD_DESIGNS.filter(d => (d.artwork || d.image) && d.occasion === form.occasion);
    const staticPool = realCovers.length ? realCovers : CARD_DESIGNS.filter(d => d.artwork || d.image).slice(0, 10);
    return [...adminDesigns, ...staticPool];
 })();
 const occasionLabel = form.occasion === 'other' && form.custom_occasion
  ? form.custom_occasion
  : getOccasionLabel(form.occasion);
 const autoCoverTextColor = getContrastTextColor(form.background_color, selectedDesign);

 // ── Load credits for logged-in users ────────────────────────────────────
 useEffect(() => {
 if (user && !isCompanyUser)
 creditsAPI.getBalance().then(r => setCreditBalance(r.data?.credits ?? 0)).catch(() => {});
 }, [user, isCompanyUser]);

 // ── Resume after login redirect ──────────────────────────────────────────
 useEffect(() => {
 if (searchParams.get('resumed') !== '1') return;
 try {
 const saved = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}');
 if (saved.formSnapshot) setForm(saved.formSnapshot);
 if (saved.msgSnapshot) setMsgForm(saved.msgSnapshot);
 if (saved.slug) {
 setDraftSlug(saved.slug);
 // Claim the anonymous draft now that user is logged in
 if (saved.draft_edit_token && user) {
 cardsAPI.claimDraft(saved.slug, saved.draft_edit_token).catch(() => {});
 }
 toast.success('Welcome back! Your card draft is ready.');
 setStep(3); // go straight to payment
 } else if (saved.formSnapshot) {
 toast.success('Welcome back! Pick up where you left off.');
 setStep(saved.localOnly ? 3 : 2);
 }
 } catch {}
 const url = new URL(window.location.href);
 url.searchParams.delete('resumed');
 window.history.replaceState({}, '', url.toString());
 }, [searchParams, user]);

 // Start from a catalogue selection while keeping every editor control available.
 useEffect(() => {
  if (searchParams.get('resumed') === '1') return;
  const requestedOccasion = searchParams.get('occasion');
  const requestedDesign = searchParams.get('design');
  if (!requestedOccasion && !requestedDesign) return;

  const normalizedOccasion = requestedOccasion === 'farewell' ? 'leaving' : requestedOccasion;
  const matchedOccasion = OCCASIONS.find(item => item.id === normalizedOccasion);
  const matchedDesign = CARD_DESIGNS.find(item => item.id === requestedDesign);

  setForm(previous => {
   const nextOccasion = matchedOccasion?.id || matchedDesign?.occasion || previous.occasion;
   const nextLabel = getOccasionLabel(nextOccasion);
   return {
    ...previous,
    occasion: nextOccasion,
    design_theme: matchedDesign?.id || previous.design_theme,
    background_color: matchedDesign?.background || previous.background_color,
    card_layout: 'album',
    title: previous.recipient_name
     ? `${previous.recipient_name}'s ${nextLabel} Card`
     : `A ${nextLabel} card made together`,
   };
  });
  setStep(matchedDesign ? 1 : 0);
 }, [searchParams]);

 // ── Occasion helper ──────────────────────────────────────────────────────
 const handleOccasionSelect = (occ) => {
 set('occasion', occ.id);
 set('custom_occasion', ''); // reset custom when switching occasion
 const name = form.recipient_name || 'Someone';
 const label = occ.id === 'other' ? 'Special' : occ.label;
 set('title', `${name}'s ${label} Card`);
 };

 // ── Design helper ────────────────────────────────────────────────────────
 const handleDesignSelect = (d) => {
 set('design_theme', d.id);
 set('background_color', d.background || '#F5F0FF');
 };

 // When the occasion changes, make sure a matching design is selected so the
 // preview + payload stay consistent (art covers are occasion-specific).
 // This must live after form/design initialization; placing it above the form
 // state causes a temporal-dead-zone render crash.
 useEffect(() => {
   if (form.design_theme === 'custom_upload') return;
   const matches = selectedDesign && (selectedDesign.occasion === form.occasion || !selectedDesign.occasion);
   if (!matches && availableDesigns[0]) handleDesignSelect(availableDesigns[0]);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [form.occasion]);

 // ── Save localStorage snapshot ───────────────────────────────────────────
 const saveSnapshot = (extra = {}) => {
 const existing = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}');
 localStorage.setItem(PENDING_KEY, JSON.stringify({
 ...existing, formSnapshot: form, msgSnapshot: msgForm,
 timestamp: Date.now(), ...extra,
 }));
 };

 // Creator Live Wall cards can be authored directly in the big preview.
 // Draft wall posts are supported, which lets guest media survive a login or
 // payment redirect. Successfully uploaded cards are marked to avoid duplicates.
 const saveCreatorWallCards = async (activeSlug) => {
 if (!['wall_only', 'card_and_wall'].includes(form.card_experience)) return;
 const authorEmail = user?.email || member?.email || company?.email || '';
 for (const draft of wallDrafts) {
 if (draft.uploaded || (!draft.message?.trim() && !draft.caption?.trim() && !draft.media?.length)) continue;
 try {
 const fd = new FormData();
 fd.append('author_name', draft.sender?.trim() || creatorName || 'Card Creator');
 if (authorEmail) fd.append('author_email', authorEmail);
 if (draft.message?.trim()) fd.append('message', draft.message.trim());
 if (draft.caption?.trim()) fd.append('caption', draft.caption.trim());
 (draft.media || []).forEach((item, index) => fd.append(index === 0 ? 'media' : `media_gallery_${index}`, item.file));
 await wallAPI.add(activeSlug, fd);
 setWallDrafts(current => current.map(item => item.id === draft.id ? { ...item, uploaded: true } : item));
 } catch (error) {
 console.warn('[creator-wall] card failed to save:', error?.response?.data || error?.message);
 toast('One Live Wall card could not upload yet. Your other card details are safe.', { duration: 5000 });
 }
 }
 };

 // ── Step 2 → 3: create/update draft for authenticated users ─────────────
 const handleCreateDraft = async () => {
 if (!form.recipient_name?.trim()) return toast.error('Recipient name is required');
 if (form.occasion === 'other' && !form.custom_occasion?.trim()) return toast.error('Please specify the occasion name');
 setLoading(true);
 try {
 const { status: _s, ...safeForm } = form;
 const { send_date: utcSendDate, send_time: utcSendTime } = toUTCSendTime(safeForm.send_date, safeForm.send_time);
 const cardData = { ...safeForm, title: safeForm.title.trim() || `${safeForm.recipient_name}'s Card`, send_date: utcSendDate, send_time: utcSendTime };
 let slug;

 if (draftSlug) {
 // Check if this card still has an anonymous draft_edit_token in localStorage
 // (i.e. guest who just logged in and claimDraft may not have run yet)
 const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}');
 const editToken = pending.draft_edit_token;

 if (!company && !member && editToken && pending.slug === draftSlug) {
 // Still anonymous or just claimed — use the token path which works either way
 try {
 await cardsAPI.updateDraft(draftSlug, cardData, editToken);
 } catch {
 // Token path failed (card already claimed) — fall back to JWT update
 await cardsAPI.update(draftSlug, cardData);
 }
 } else if (company) {
 await cardsAPI.updateAsCompany(draftSlug, cardData);
 } else if (member) {
 const { memberCardsAPI } = await import('../utils/api');
 await memberCardsAPI.update(draftSlug, cardData);
 } else {
 await cardsAPI.update(draftSlug, cardData);
 }
 slug = draftSlug;

 } else if (company) {
 slug = (await cardsAPI.createAsCompany(cardData)).data.slug;
 } else if (member) {
 const { memberCardsAPI } = await import('../utils/api');
 slug = (await memberCardsAPI.create(cardData)).data.slug;
 } else {
 slug = (await cardsAPI.create(cardData)).data.slug;
 }

 setDraftSlug(slug);
 saveSnapshot({ slug });
 setStep(3);
 } catch (err) {
 toast.error(err.response?.data?.error || 'Could not save your card. Please try again.');
 } finally { setLoading(false); }
 };

 // Validate a discount code before checkout, so the price updates immediately
 // rather than the user finding out only after being redirected to FLW.
 // Accepts an optional explicit code (used for auto-apply from ?discount=)
 // since React state updates aren't synchronous — reading discountCode right
 // after setDiscountCode would use the stale value.
 const handleApplyDiscount = async (explicitCode) => {
   const code = (explicitCode ?? discountCode).trim();
   if (!code) return;
   setDiscountStatus('checking');
   try {
     const res = await paymentsAPI.discountPreview(code);
     setDiscountStatus('applied');
     setDiscountedNGN(res.data.discounted_ngn);
     setDiscountMessage(`${res.data.percent_off}% off applied — you save ${formatCurrency(res.data.discount_amount_ngn, 'NGN')}`);
   } catch (err) {
     setDiscountStatus('invalid');
     setDiscountedNGN(null);
     setDiscountMessage(err.response?.data?.error || 'Invalid discount code');
   }
 };

 // Auto-apply a discount code passed in via ?discount=CODE (from the pricing
 // page / promo banner flow), so the user doesn't have to retype it.
 useEffect(() => {
   const codeFromUrl = searchParams.get('discount');
   if (!codeFromUrl) return;
   const clean = codeFromUrl.trim().toUpperCase();
   setDiscountCode(clean);
   handleApplyDiscount(clean);
   // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 // ── Step 4: pay / activate ───────────────────────────────────────────────
 const handlePayAndLaunch = async () => {
 setLoading(true);
 setPaymentStage('sending');
 try {
 const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}');
 const slug = draftSlug || pending?.slug;
 if (!slug) { toast.error('Card draft not found. Please go back and try again.'); setLoading(false); setPaymentStage('idle'); return; }

 // Save the full form state (gift settings + delivery date/time + deadline)
 // to the card BEFORE payment so nothing is lost if the user pays and
 // the page refreshes. This is the single authoritative save.
 try {
 const pending2 = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}');
 const editToken = pending2.draft_edit_token;
 const { send_date: utcSD, send_time: utcST } = toUTCSendTime(form.send_date, form.send_time);
 const { send_date: utcDL, send_time: utcDLT } = toUTCSendTime(form.deadline, form.deadline_time);
 const fullUpdate = {
 is_gift_enabled: form.is_gift_enabled,
 suggested_amount: form.suggested_amount,
 gift_type: form.gift_type,
 send_date: utcSD || null,
 send_time: utcST || null,
 deadline: utcDL || null,
 deadline_time: utcDLT || null,
 };
 if (editToken) {
 await cardsAPI.updateDraft(slug, fullUpdate, editToken);
 } else if (member) {
 const { memberCardsAPI: mAPI } = await import('../utils/api');
 await mAPI.update(slug, fullUpdate);
 } else if (company) {
 await cardsAPI.updateAsCompany(slug, fullUpdate);
 } else if (user) {
 await cardsAPI.update(slug, fullUpdate);
 }
 console.log('[pre-payment-update] Saved dates:', { send_date: utcSD, send_time: utcST, deadline: utcDL });
 } catch (updateErr) {
 console.error('[pre-payment-update] FAILED to save dates before payment:', updateErr?.response?.data || updateErr?.message);
 toast('Could not save delivery schedule. Card will activate but may need re-scheduling.', { duration: 5000 });
 }


 // Save creator's message AFTER card is active (addMessage blocks on draft cards)
 const saveCreatorMessage = async (activeSlug) => {
 if (!msgForm.content.trim()) return;
 const authorName = user?.full_name
 || (member ? `${member?.first_name || ''} ${member?.last_name || ''}`.trim() : null)
 || company?.contact_person || company?.name || creatorName || 'Card Creator';
 const authorEmail = user?.email || member?.email || company?.email || '';
 const fd = new FormData();
 fd.append('author_name', authorName);
 fd.append('author_email', authorEmail);
 fd.append('content', msgForm.content);
 fd.append('font_style', msgForm.font_style);
 fd.append('is_private', msgForm.is_private);
 mediaFiles.forEach((m, i) => fd.append(i === 0 ? 'media' : `media_gallery_${i}`, m.file));
 await messagesAPI.add(activeSlug, fd).catch(e => console.warn('[creator-msg] failed to save:', e?.message));
 };

 // Upload the board-style recipient photo (Cloudinary) once the card exists.
 const saveRecipientPhoto = async (activeSlug) => {
 if (!recipientPhoto?.file) return;
 try {
 const existing = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}');
 const token = draftSlug ? existing.draft_edit_token : undefined;
 const pfd = new FormData();
 pfd.append('photo', recipientPhoto.file);
 await cardsAPI.uploadRecipientPhoto(activeSlug, pfd, token);
 } catch (e) { console.warn('[recipient-photo] upload failed:', e?.message); }
 };

 // Company/member: free activation
 if (isCompanyUser) {
 await cardsAPI.activate(slug, {
 inviteEmails: inviteEmails.split(/[,\n]/).map(e => e.trim()).filter(Boolean),
 });
 await saveCreatorMessage(slug); await saveRecipientPhoto(slug); await saveCreatorWallCards(slug);
 localStorage.removeItem(PENDING_KEY);
 toast.success('Card is live! ');
 setLiveSlug(slug);
 setLoading(false); setPaymentStage('idle');
 return;
 }

 // Credit payment
 if (payMode === 'credit') {
 setPaymentStage('verifying');
 const res = await creditsAPI.spend(slug);
 if (res.data?.ok) {
 // Send invite emails and finalize activation
 const emailList = inviteEmails.split(/[,\n]/).map(e => e.trim()).filter(Boolean);
 if (emailList.length) {
 await cardsAPI.activate(slug, { inviteEmails: emailList }).catch(() => {});
 }
 await saveCreatorMessage(slug); await saveRecipientPhoto(slug); await saveCreatorWallCards(slug);
 localStorage.removeItem(PENDING_KEY);
 setCreditBalance(res.data.credits_remaining);
 toast.success('Card is live! ');
 setLiveSlug(slug);
 setLoading(false); setPaymentStage('idle');
 return;
 }
 }

 // Flutterwave
 setPaymentStage('redirecting');
 const userEmail = user?.email || member?.email || company?.email || '';
 let payRes;
 try {
   payRes = await paymentsAPI.initCardFee(slug, selectedCurrency, userEmail, discountCode.trim() || undefined);
 } catch (payErr) {
   toast.error(payErr.response?.data?.error || 'Failed to start payment. Please try again.');
   setLoading(false); setPaymentStage('idle');
   return;
 }
 const { payment_link, already_active, card_slug: activatedSlug } = payRes.data;
 if (already_active) {
 await saveCreatorMessage(activatedSlug || slug); await saveRecipientPhoto(activatedSlug || slug); await saveCreatorWallCards(activatedSlug || slug);
 localStorage.removeItem(PENDING_KEY);
 toast.success('Your card is already live! ');
 setLiveSlug(activatedSlug || slug);
 setLoading(false); setPaymentStage('idle');
 return;
 }
 if (!payment_link) throw new Error('No payment link returned');
 // Persist creator-authored wall carousel cards before leaving for Flutterwave.
 await saveCreatorWallCards(slug);
 // Persist creator message + invite emails before FLW redirect — CardFeeVerify
 // will read them back after payment and send the invites.
 try {
 const existing = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}');
 existing.msgSnapshot = msgForm.content.trim() ? msgForm : existing.msgSnapshot;
 existing.creatorName = user?.full_name || (member ? `${member?.first_name || ''} ${member?.last_name || ''}`.trim() : null) || company?.contact_person || company?.name || creatorName || '';
 existing.creatorEmail = user?.email || member?.email || company?.email || '';
 existing.inviteEmails = inviteEmails.split(/[,\n]/).map(e => e.trim()).filter(Boolean);
 localStorage.setItem(PENDING_KEY, JSON.stringify(existing));
 } catch {}
 window.location.assign(payment_link);
 } catch (err) {
 toast.error(err.response?.data?.error || 'Could not activate card. Please try again.');
 setLoading(false); setPaymentStage('idle');
 }
 };

 // ── Reset ────────────────────────────────────────────────────────────────
 const handleReset = () => {
 localStorage.removeItem(PENDING_KEY);
 localStorage.removeItem('thankeeu_anon_draft');
 setStep(0); setLiveSlug(null); setDraftSlug(null); setGuestSaved(false);
 setLoading(false); setPaymentStage('idle');
 setMsgForm({ content: '', font_style: 'handwritten', is_private: false });
 setInviteEmails('');
 setWallDrafts([makeWallPreviewCard(creatorName, 0)]);
 setForm({
 occasion: 'birthday', design_theme: 'birthday-art-1', background_color: '#FBEAF0',
 font_style: 'elegant', card_layout: 'album', title: "Someone's Birthday Card",
 cover_text_color: 'auto', album_background_theme: 'cover_blur',
 cover_sender: creatorName === 'You' ? '' : creatorName,
 recipient_name: '', recipient_email: '', send_date: '', send_time: '09:00',
 deadline: '', deadline_time: '23:59', is_gift_enabled: true, gift_type: 'pot',
 suggested_amount: 2500, allow_private_messages: true, send_reminders: true,
 hide_amounts: false, notification_scope: 'department', card_experience: 'card_only',
 cover_layout: null,
 });
 };

 // Redirecting to the dashboard flow — render nothing rather than flashing the
 // public wizard for a frame. Every hook above has already run, so hook order
 // stays stable.
 if (redirectToDashboardFlow) return null;

 // ── Live screen (authenticated users after payment) ──────────────────────
 if (liveSlug) return (
 <div className="min-h-screen section-dots" style={{ background: 'linear-gradient(160deg,#F5F0FF,#FFF0F5)' }}>
 <Navbar/>
 <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-16 text-center">
 <div className="w-24 h-24 rounded-xl flex items-center justify-center text-5xl mb-6"
 style={{ background: 'linear-gradient(135deg,#7C3AED,#EC4899)' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>
 <h1 className="text-3xl font-extrabold text-warm-900 mb-3">Your card is live!</h1>
 <p className="text-warm-500 text-lg mb-6">Sign it first, then share the link so everyone else can too.</p>

 {/* The creator writes their message here, not during setup — this is the
     one place anyone signs, so it has to be the first thing offered. */}
 <Link to={`/sign/${liveSlug}`}
  className="btn-primary mb-8 inline-flex items-center gap-2 px-8 py-3.5 text-base">
  <Icon name="PenLine" size={17}/>Write your message on the card
 </Link>
 <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full max-w-lg">
 <input readOnly value={`${window.location.origin}/sign/${liveSlug}`}
 className="input flex-1 text-sm" style={{ background: '#fff' }}/>
 <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sign/${liveSlug}`); toast.success('Link copied!'); }}
 className="btn-primary px-6 whitespace-nowrap">Copy link</button>
 </div>
 <div className="flex flex-wrap gap-3 justify-center">
 <Link to={`/card/${liveSlug}`} className="btn-primary px-8 py-3 inline-flex items-center gap-2">
 <Icon name="Eye" size={16}/>View card
 </Link>
 <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Sign this card: ${window.location.origin}/sign/${liveSlug}`)}`, '_blank')}
 className="px-8 py-3 rounded-2xl font-bold text-white inline-flex items-center gap-2" style={{ background: '#25D366' }}>
 Share on WhatsApp
 </button>
 <QRButton url={`${window.location.origin}/sign/${liveSlug}`} label="Scan to sign the group card" variant="secondary" className="px-6 py-3">QR Code — Group Card</QRButton>
 <button onClick={handleReset}
 className="px-8 py-3 rounded-2xl font-bold border-2 border-red-200 text-red-500 hover:bg-red-50 inline-flex items-center gap-2 transition-colors">
 Create another card
 </button>
 </div>
 </div>
 </div>
 );

 // ── Inner wizard ─────────────────────────────────────────────────────────
 const inner = (
 <div className="min-h-[calc(100vh-72px)] bg-white">
 <div className="grid min-h-[calc(100vh-72px)] grid-cols-1 lg:grid-cols-[minmax(430px,42%)_minmax(0,58%)]">
 <section className="bg-[#f3f6f9] px-4 py-7 sm:px-8 lg:px-10 lg:py-9">
 {!company && !member && (
 <div className="mb-7">
 <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary-600">Thankeeu album studio</p>
 <h1 className="mt-2 text-3xl font-bold text-warm-900 mb-1">Create a group card</h1>
 <p className="text-warm-500 text-sm">
 {user ? 'Takes less than 3 minutes' : 'No account needed until you\'re ready to pay — explore freely!'}
 </p>
 </div>
 )}

 <StepIndicator current={step} />

 <IntentSummaryStrip items={intentSummary} />

 <div className="min-w-0">

 {/* ══ STEP 0: Occasion ════════════════════════════════════════════════ */}
 {step === 0 && (
 <div className="bg-white rounded-lg border border-purple-100 p-5 sm:p-6 animate-fade-in">
 <h2 className="text-xl font-bold text-warm-900 mb-1">What's the occasion?</h2>
 <p className="text-warm-500 text-sm mb-6">Pick the type of card you're creating</p>
 <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
 {OCCASIONS.map(o => (
 <button key={o.id} onClick={() => handleOccasionSelect(o)}
 className={`rounded-2xl p-4 text-center transition-all border-2 ${form.occasion === o.id ? 'border-primary-400 bg-primary-50 shadow-sm' : 'border-transparent bg-warm-100 hover:bg-purple-50'}`}>
 {o.icon && <div className="mb-2 text-primary-500"><Icon name={o.icon} size={22}/></div>}
 <div className="text-xs font-semibold text-warm-700">{o.label}</div>
 </button>
 ))}
 </div>
 {form.occasion === 'other' && (
 <div className="mb-6">
 <label className="block text-sm font-semibold text-warm-700 mb-1">What's the occasion? <span className="text-red-500">*</span></label>
 <input
 type="text"
 className="input w-full"
 placeholder="e.g. Housewarming, Work Anniversary, Congratulations…"
 maxLength={80}
 value={form.custom_occasion || ''}
 onChange={e => set('custom_occasion', e.target.value)}
 />
 </div>
 )}
 <div className="flex justify-end">
 <button onClick={() => setStep(1)} className="btn-primary">Choose design →</button>
 </div>
 </div>
 )}

 {/* ══ STEP 1: Design ════════════════════════════════════ */}
 {step === 1 && (
 <div className="bg-white rounded-lg border border-purple-100 p-5 sm:p-6 animate-fade-in">
  <>
   <h2 className="text-xl font-bold text-warm-900 mb-1">Pick a design</h2>
   <p className="text-warm-500 text-sm mb-5">Choose from our templates</p>

 <style>{`
 /* The collapsed height used to be derived from the VIEWPORT (56vw/5), but
    this grid lives in the wizard's left column — about 42% of the viewport
    minus 128px of padding — so the guess was roughly double the real tile
    size and four rows showed instead of two. Measure the grid's own width
    with container query units instead, and derive the row height from the
    tile's 210:297 aspect ratio. */
 .ccg-box { container-type: inline-size; }
 .ccg { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-bottom:20px; max-height:none; }
 .ccg-wrap { --cols:5; --gap:10px; position:relative; overflow:hidden;
   --tile: calc((100cqw - (var(--cols) - 1) * var(--gap)) / var(--cols));
   --row: calc(var(--tile) * 297 / 210);
   max-height: calc(2 * var(--row) + var(--gap)); }
 .ccg-wrap.expanded { max-height:none; }
 /* Column count also follows the grid's own width, not the viewport: five
    columns inside the wizard's 444px column give 81px tiles whose captions
    wrap onto three lines. */
 @container (max-width: 620px) { .ccg { grid-template-columns:repeat(4,1fr); } .ccg-wrap { --cols:4; } }
 @container (max-width: 430px) { .ccg { grid-template-columns:repeat(3,1fr); } .ccg-wrap { --cols:3; } }
 @container (max-width: 290px) { .ccg { grid-template-columns:repeat(2,1fr); } .ccg-wrap { --cols:2; } }
 /* Without container-query support, fall back to showing everything rather
    than clipping at a wrong height. */
 @supports not (width: 100cqw) { .ccg-wrap { max-height:none; } }
 .ccg-item{position:relative;border-radius:14px;overflow:hidden;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;aspect-ratio:210/297;background:#fff;}
 .ccg-item:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.14);}
 .ccg-item.sel{outline:3px solid #7C3AED;outline-offset:2px;}
 .ccg-badge{position:absolute;top:7px;left:7px;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:800;z-index:2;}
 .ccg-new{background:#FCD34D;color:#92400E;}
 .ccg-more{background:#F43F5E;color:#fff;}
 .ccg-upload{background:#60A5FA;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;}
 .ccg-upload p{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:14px;color:#fff;margin:0;text-align:center;line-height:1.2;}
 `}</style>

 <>
   <div className="ccg-box">
   <div className={`ccg-wrap ${designsExpanded ? 'expanded' : ''}`}>
   <div className="ccg">
   <button type="button" className="ccg-item ccg-upload" onClick={() => document.getElementById('cs-bg-upload')?.click()}>
 <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
 </svg>
 <p>Upload<br/>your own</p>
 <input id="cs-bg-upload" type="file" accept="image/*" className="hidden"
 onChange={async e => {
   const f = e.target.files?.[0]; if (!f) return;
   const localPreview = URL.createObjectURL(f);
   setCustomCoverUrl(localPreview);
   set('design_theme', 'custom_upload');
   set('background_color', localPreview);
   setUploadingCover(true);
   try {
     const fd = new FormData(); fd.append('photo', f);
     const res = await cardsAPI.uploadCover(fd);
     const url = res.data?.url;
     if (url) { setCustomCoverUrl(url); set('background_color', url); }
   } catch (err) {
     toast.error('Could not upload your design. Please try a smaller image.');
   } finally { setUploadingCover(false); e.target.value=''; }
 }}/>
 {uploadingCover && <span className="ccg-badge ccg-new" style={{right:7,left:'auto'}}>Uploading…</span>}
 </button>
 {availableDesigns.map((d, idx) => (
 <button key={d.id} type="button" className={`ccg-item ${form.design_theme === d.id ? 'sel' : ''}`} onClick={() => handleDesignSelect(d)}>
 <CardCoverPreview
  design={d}
  occasionLabel={occasionLabel}
  recipientName={form.recipient_name}
  title={form.title}
  senderName={form.cover_sender || creatorName}
  compact
 />
 {idx < 3 && <span className="ccg-badge ccg-new">New</span>}
 {idx >= 3 && idx < 7 && <span className="ccg-badge ccg-more">More</span>}
 </button>
 ))}
 </div>
 </div>
 </div>
 {availableDesigns.length > 10 && (
   <button type="button" onClick={() => setDesignsExpanded(e => !e)}
     className="w-full mt-1 mb-4 text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-primary-50 transition-colors">
     <Icon name={designsExpanded ? 'ChevronUp' : 'ChevronDown'} size={14}/>
     {designsExpanded ? 'Show fewer designs' : `Show all ${availableDesigns.length} designs`}
   </button>
 )}
 </>

 {selectedDesign && (
  <div className="mb-5">
   <p className="text-sm font-bold text-warm-700 mb-2">Cover colour</p>
   <div className="flex flex-wrap gap-2">
    {(selectedDesign.palette || ['#102a43', '#7c3aed', '#0f766e', '#be123c', '#ca8a04']).map(color => (
     <button
      key={color}
      type="button"
      onClick={() => set('background_color', color)}
      className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-105 ${form.background_color === color ? 'ring-4 ring-primary-100 border-primary-500' : 'border-white shadow-sm'}`}
      style={{ backgroundColor: color }}
      aria-label={`Use ${color} as the cover colour`}
      title={color}
     />
    ))}
   </div>
  </div>
 )}

 {selectedDesign && (
  <CoverTextStudio
   design={selectedDesign}
   occasionLabel={occasionLabel}
   recipientName={form.recipient_name}
   title={form.title}
   senderName={form.cover_sender || creatorName}
   coverColor={form.background_color}
   textColor={form.cover_text_color === 'auto' ? autoCoverTextColor : form.cover_text_color}
   fontFamily={getFontStyle(form.font_style).family}
   layout={form.cover_layout}
   onChange={(next) => set('cover_layout', next)}
   selected={selectedCoverField}
   onSelect={setSelectedCoverField}
  />
 )}

 <div className="mb-5 border-t border-purple-100 pt-5">
  <div className="flex items-center justify-between gap-3">
   <div>
    <p className="text-sm font-bold text-warm-700">Default cover text colour</p>
    <p className="mt-0.5 text-xs text-warm-500">Applies to any cover text set to “Auto” in the studio above.</p>
   </div>
   <span className="h-6 w-6 rounded-full border border-black/10" style={{ backgroundColor: form.cover_text_color === 'auto' ? autoCoverTextColor : form.cover_text_color }} />
  </div>
  <div className="mt-3 flex flex-wrap gap-2">
   <button type="button" onClick={() => set('cover_text_color', 'auto')} className={`h-10 rounded-lg border px-3 text-xs font-extrabold ${form.cover_text_color === 'auto' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-purple-100 bg-white text-warm-600'}`}>Auto</button>
   {['#ffffff', '#172033', '#4c1d95', '#9f1239', '#14532d', '#92400e'].map(color => (
    <button key={color} type="button" onClick={() => set('cover_text_color', color)} className={`h-10 w-10 rounded-full border-2 ${form.cover_text_color === color ? 'ring-4 ring-primary-100 border-primary-500' : 'border-white shadow-sm'}`} style={{ backgroundColor: color }} aria-label={`Use ${color} for cover text`} />
   ))}
  </div>
 </div>

 {/* Album background — a single non-wrapping row of swatches. As labelled
     cards this block ran to two rows of ~110px; the selected theme's name and
     description now sit in the header, and each swatch carries both in its
     tooltip and aria-label. */}
 <div className="mb-5 border-t border-purple-100 pt-5">
  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
   <p className="text-sm font-bold text-warm-700">Album background</p>
   <p className="text-[11px] text-warm-500">
    {(() => {
      const t = ALBUM_THEMES.find(x => x.id === (form.album_background_theme || ALBUM_THEMES[0].id));
      return t ? `${t.name} · ${t.description}` : 'The setting around the flipbook pages';
    })()}
   </p>
  </div>
  {/* Swatches only, on one line that never wraps — the names live in the
      header (for the selected theme) and in each swatch's tooltip, so this
      row costs one line instead of two rows of labelled pills.
      NOTE: index.css sets `button { min-height: 44px }` for touch targets, so
      a bare `h-7 w-7` button renders as a 28x44 OVAL. The button keeps the
      44px target; the round swatch is an inner span. */}
  <div className="mt-1 flex flex-nowrap items-center gap-0.5">
   {ALBUM_THEMES.map(theme => {
    const isSel = (form.album_background_theme || ALBUM_THEMES[0].id) === theme.id;
    return (
     <button
      key={theme.id}
      type="button"
      onClick={() => set('album_background_theme', theme.id)}
      aria-pressed={isSel}
      aria-label={`${theme.name} — ${theme.description}`}
      title={`${theme.name} — ${theme.description}`}
      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105"
     >
      <span
       className={`block h-7 w-7 rounded-full border transition-all ${
         isSel ? 'border-primary-500 ring-2 ring-primary-300 ring-offset-1' : 'border-black/15'
       }`}
       style={{ background: theme.stage }}
      />
     </button>
    );
   })}
  </div>
 </div>

 <p className="text-sm font-bold text-warm-700 mb-2">Card lettering</p>
 <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
 {FONT_STYLES.map(font => (
 <button key={font.id} type="button" onClick={() => set('font_style', font.id)}
 className={`rounded-xl border-2 px-2 py-2.5 text-sm transition-all ${form.font_style === font.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-purple-100 text-warm-600'}`}
 style={{ fontFamily: font.family }}>
 {font.id === 'calligraphy' ? 'With love' : font.name}
 </button>
 ))}
 </div>


  </>

 <div className="flex justify-between">
 <button onClick={() => setStep(0)} className="btn-secondary">← Back</button>
 <button onClick={() => {
  saveSnapshot();
  setStep(2);
 }} className="btn-primary">Add details →</button>
 </div>
 </div>
 )}

 {/* ══ STEP 2: Details ═════════════════════════════════════════════════ */}
 {step === 2 && (
 <div className="bg-white rounded-lg border border-purple-100 p-5 sm:p-6 animate-fade-in">
 <h2 className="text-xl font-bold text-warm-900 mb-1">Card details</h2>
 <p className="text-warm-500 text-sm mb-5">Tell us who this is for</p>

 {/* Sign-in nudge for guests */}
 {!user && !isCompanyUser && (
 <div style={{ background:'linear-gradient(135deg,#EDE9FE,#F5F0FF)', border:'1.5px solid #C4B5FD', borderRadius:16, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:20, flexWrap:'wrap' }}>
 <div style={{ display:'flex', alignItems:'center', gap:10 }}>
 <span style={{ fontSize:22 }}></span>
 <div>
 <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, color:'#1A1035', margin:0, lineHeight:1.3 }}>Already have an account?</p>
 <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12, color:'#7A6CA8', margin:0 }}>Sign in to save this card to your dashboard.</p>
 </div>
 </div>
 <Link to={`/login?returnTo=${encodeURIComponent('/create-card?resumed=1')}`}
 onClick={() => saveSnapshot()}
 style={{ background:'#7C3AED', color:'#fff', borderRadius:12, padding:'8px 18px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:13, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0, display:'inline-flex', alignItems:'center', gap:6 }}>
 <Icon name="LogIn" size={14}/>Sign in
 </Link>
 </div>
 )}

 <div className="space-y-4 mb-6">
 <div>
 <label className="block text-sm font-semibold text-warm-700 mb-1.5">Card title</label>
 <input className="input" placeholder="e.g. Amaka's Birthday Card " value={form.title} onChange={e => set('title', e.target.value)}/>
 </div>
 <div>
  <label className="block text-sm font-semibold text-warm-700 mb-1.5">Sender name on cover</label>
  <input className="input" placeholder="e.g. Tola and the whole team" value={form.cover_sender || ''} onChange={e => set('cover_sender', e.target.value)}/>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-semibold text-warm-700 mb-1.5">Recipient's name *</label>
 <input className="input" placeholder="e.g. Amaka" value={form.recipient_name}
 onChange={e => { set('recipient_name', e.target.value); if (form.title.includes("Someone's") || form.title.endsWith('Card')) set('title', `${e.target.value}'s ${form.occasion === 'other' && form.custom_occasion ? form.custom_occasion : (OCCASIONS.find(o=>o.id===form.occasion)?.label||'Card')} Card`); }} required/>
 </div>
 <div>
 <label className="block text-sm font-semibold text-warm-700 mb-1.5">Recipient's email</label>
 <input type="email" className="input" placeholder="amaka@email.com" value={form.recipient_email} onChange={e => set('recipient_email', e.target.value)}/>
 </div>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-semibold text-warm-700 mb-1.5">Delivery date</label>
 <input type="date" className="input" value={form.send_date} min={new Date().toISOString().split('T')[0]} onChange={e => set('send_date', e.target.value)}/>
 </div>
 <div>
 <label className="block text-sm font-semibold text-warm-700 mb-1.5">Delivery time</label>
 <input type="time" className="input" value={form.send_time || '09:00'} onChange={e => set('send_time', e.target.value)}/>
 </div>
 <div>
 <label className="block text-sm font-semibold text-warm-700 mb-1.5">Signing deadline</label>
 <input type="date" className="input" value={form.deadline} min={new Date().toISOString().split('T')[0]} onChange={e => set('deadline', e.target.value)}/>
 </div>
 <div>
 <label className="block text-sm font-semibold text-warm-700 mb-1.5">Deadline time</label>
 <input type="time" className="input" value={form.deadline_time || '23:59'} onChange={e => set('deadline_time', e.target.value)}/>
 </div>
 </div>
 {(company || member) && (
 <div>
 <label className="block text-sm font-semibold text-warm-700 mb-2">Who should sign?</label>
 <div className="grid grid-cols-2 gap-3">
 {[{ value:'department', label:'My Department' }, { value:'company_wide', label:'Entire Company' }].map(opt => (
 <button key={opt.value} type="button" onClick={() => set('notification_scope', opt.value)}
 className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.notification_scope === opt.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-purple-100 text-warm-600'}`}>
 {opt.label}
 </button>
 ))}
 </div>
 </div>
 )}

 <div className="rounded-2xl border border-purple-100 divide-y divide-gray-100">
 {[
 { key: 'allow_private_messages', label: 'Allow private messages', desc: 'Contributors can mark messages visible only to recipient' },
 { key: 'send_reminders', label: 'Auto-send reminders', desc: "Nudge people who haven't signed 2 days before deadline" },
 { key: 'hide_amounts', label: 'Hide gift amounts', desc: "Contributors won't see how much others gave" },
 ].map(({ key, label, desc }) => (
 <div key={key} className="flex items-center justify-between p-4">
 <div><p className="text-sm font-semibold text-warm-800">{label}</p><p className="text-xs text-warm-500 mt-0.5">{desc}</p></div>
 <button onClick={() => set(key, !form[key])}
 className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${form[key] ? 'bg-primary-400' : 'bg-gray-200'}`}>
 <span className={`absolute w-5 h-5 bg-white rounded-full shadow transition-transform ${form[key] ? 'translate-x-5' : 'translate-x-0.5'}`}/>
 </button>
 </div>
 ))}
 </div>
 </div>

 <div className="flex justify-between">
 <button onClick={() => setStep(1)} className="btn-secondary">← Back</button>
 <button
 onClick={async () => {
 if (!form.recipient_name?.trim()) { toast.error('Recipient name is required'); return; }
 if (!user && !isCompanyUser) {
 // Guest: just save snapshot and advance — no API call yet
 saveSnapshot();
 setStep(3);
 return;
 }
 // Authenticated: persist to backend
 await handleCreateDraft();
 }}
 disabled={loading}
 className="btn-primary inline-flex items-center gap-2">
 {loading
 ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving…</span>
 : 'Gift & pay →'}
 </button>
 </div>
 </div>
 )}


 {/* ══ STEP 3: Gift & Pay ══════════════════════════════════════════════ */}
 {step === 3 && (
 <div className="bg-white rounded-lg border border-purple-100 p-5 sm:p-6 animate-fade-in">

 {/* ── GUEST: Configure gift (before draft saved) ── */}
 {!user && !isCompanyUser && !guestSaved && (<>
 <h2 className="text-xl font-bold text-warm-900 mb-1">Gift & Pay </h2>
 <p className="text-warm-500 text-sm mb-5">
 Choose your gift options, review your card, then save it as a draft.
 </p>

 {/* Gift toggle */}
 <div className="grid grid-cols-2 gap-3 mb-4">
 {[
 { id: true, icon: 'Gift', title: 'Enable gift pot', desc: 'Everyone chips in, recipient redeems' },
 { id: false, icon: 'Mail', title: 'Card only', desc: 'Messages only, no gift' },
 ].map(o => (
 <button key={String(o.id)} onClick={() => set('is_gift_enabled', o.id)}
 className={`rounded-2xl p-4 text-left border-2 transition-all ${form.is_gift_enabled === o.id ? 'border-primary-400 bg-primary-50' : 'border-purple-100 hover:border-purple-200'}`}>
 {o.icon && <div className="mb-2 text-primary-500"><Icon name={o.icon} size={22}/></div>}
 <div className="text-sm font-bold text-warm-800">{o.title}</div>
 <div className="text-xs text-warm-500 mt-0.5">{o.desc}</div>
 </button>
 ))}
 </div>

 {form.is_gift_enabled && (
 <div className="mb-5">
 <p className="text-sm font-semibold text-warm-700 mb-2">Suggested contribution per person</p>
 <div className="flex flex-wrap gap-2">
 {[2500, 5000, 10000, 25000, 50000].map(amt => (
 <button key={amt} onClick={() => set('suggested_amount', amt)}
 className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${form.suggested_amount === amt ? 'bg-primary-400 text-white border-primary-400' : 'border-purple-100 text-warm-700 hover:border-primary-300'}`}>
 {formatNGN(amt)}
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Invite emails */}
 <div className="mb-5">
 <label className="block text-sm font-bold text-warm-700 mb-1.5">
 Invite people to sign <span className="text-warm-400 font-normal text-xs">(optional)</span>
 </label>
 <textarea className="input h-20 resize-none" placeholder="kemi@email.com, emeka@email.com"
 value={inviteEmails} onChange={e => setInviteEmails(e.target.value)}/>
 <p className="text-xs text-warm-400 mt-1">Optional — you can also just share the link once the card is live.</p>
 </div>

 {/* Full summary */}
 <div className="rounded-2xl bg-warm-100 border border-purple-100 divide-y divide-gray-100 mb-5">
 {[
 ['Occasion', form.occasion === 'other' && form.custom_occasion ? form.custom_occasion : (OCCASIONS.find(o => o.id === form.occasion)?.label || form.occasion)],
 ['Design', form.design_theme?.replace(/_/g, ' ')],
 ['Card title', form.title || '—'],
 ['Recipient name', form.recipient_name || '—'],
 ['Recipient email', form.recipient_email || 'Not set'],
 ['Delivery date', form.send_date ? `${form.send_date} at ${form.send_time || '09:00'}` : 'Not set'],
 ['Signing deadline', form.deadline ? `${form.deadline} at ${form.deadline_time || '23:59'}` : 'Not set'],
 ['Gift pot', form.is_gift_enabled ? `Yes — ${formatNGN(form.suggested_amount || 2500)} suggested` : 'No'],
 ['Card fee', `${formatCurrency(5000, 'NGN')} one-time`],
 ].map(([k, v]) => (
 <div key={k} className="flex justify-between items-start px-4 py-2.5 gap-2">
 <span className="text-sm text-warm-500 shrink-0">{k}</span>
 <span className="text-sm font-semibold text-warm-800 text-right min-w-0 flex-1 break-words">{v}</span>
 </div>
 ))}
 </div>

 <div className="flex gap-3">
 <button onClick={() => setStep(2)} className="btn-secondary px-4">← Back</button>
 <button
 onClick={async () => {
 if (!form.recipient_name?.trim()) {
 toast.error('Please go back to Details and enter the recipient name.');
 return;
 }
 setLoading(true);
 try {
 const { status: _s, ...safeForm } = form;
 const { send_date: utcSendDate, send_time: utcSendTime } = toUTCSendTime(safeForm.send_date, safeForm.send_time);
 const cardData = { ...safeForm, title: safeForm.title.trim() || `${safeForm.recipient_name}'s Card`, send_date: utcSendDate, send_time: utcSendTime };
 const existing = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}');
 let slug = draftSlug || existing.slug;
 let editToken = existing.draft_edit_token;
 if (slug && editToken) {
 await cardsAPI.updateDraft(slug, cardData, editToken);
 } else {
 const res = await cardsAPI.createDraft(cardData);
 slug = res.data.slug;
 editToken = res.data.draft_edit_token;
 setDraftSlug(slug);
 }
 localStorage.setItem(PENDING_KEY, JSON.stringify({
 slug, draft_edit_token: editToken,
 formSnapshot: form, msgSnapshot: msgForm,
 resumeStep: 3, timestamp: Date.now(),
 }));
 await saveCreatorWallCards(slug);
 setGuestSaved(true);
 } catch (err) {
 // If the server/database is temporarily unavailable, preserve the complete
 // draft on this device so the guest is never forced to start over.
 const existing = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}');
 localStorage.setItem(PENDING_KEY, JSON.stringify({
 ...existing, localOnly: true, formSnapshot: form, msgSnapshot: msgForm,
 resumeStep: 3, timestamp: Date.now(),
 }));
 setGuestSaved(true);
 toast.success('Draft saved on this device. Sign in to sync it to your account.');
 } finally { setLoading(false); }
 }}
 disabled={loading}
 className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
 {loading
 ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving your draft…</>
 : 'Save draft & continue →'}
 </button>
 </div>

 <div className="border-t border-purple-100 mt-4 pt-4 flex gap-2">
 <button onClick={() => { setGuestSaved(false); setStep(0); }}
 className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl border-2 border-purple-200 text-warm-700 text-sm font-semibold hover:bg-purple-50 transition-colors">
 Edit card
 </button>
 <button onClick={handleReset}
 className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl border-2 border-red-100 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors">
 Start over
 </button>
 </div>
 </>)}

 {/* ── GUEST: Auth wall (after draft saved) ── */}
 {((!user && !isCompanyUser && guestSaved) || handingOff) && (<>
 <div className="text-center mb-5">
 <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl mx-auto mb-3"
 style={{ background: 'linear-gradient(135deg,#EDE9FE,#F5F0FF)' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></div>
 <h2 className="text-2xl font-bold text-warm-900 mb-2">Card saved as draft!</h2>
 <p className="text-warm-500 text-sm max-w-sm mx-auto">
 Sign in or create a free account to pay the card fee, make it live, and get your sharing link.
 </p>
 </div>

 {/* Full summary */}
 <div className="rounded-2xl bg-warm-100 border border-purple-100 divide-y divide-gray-100 mb-5">
 {[
 ['Occasion', form.occasion === 'other' && form.custom_occasion ? form.custom_occasion : (OCCASIONS.find(o => o.id === form.occasion)?.label || form.occasion)],
 ['Design', form.design_theme?.replace(/_/g, ' ')],
 ['Card title', form.title || '—'],
 ['Recipient', form.recipient_name || '—'],
 ['Recipient email', form.recipient_email || 'Not set'],
 ['Delivery date', form.send_date ? `${form.send_date} at ${form.send_time || '09:00'}` : 'Not set'],
 ['Signing deadline', form.deadline ? `${form.deadline} at ${form.deadline_time || '23:59'}` : 'Not set'],
 ['Gift pot', form.is_gift_enabled ? `Yes — ${formatNGN(form.suggested_amount || 2500)} suggested` : 'No'],
 ['Card fee', `${formatCurrency(5000, 'NGN')} one-time`],
 ['Status', 'Draft — sign in to pay & launch'],
 ].map(([k, v]) => (
 <div key={k} className="flex justify-between items-start px-4 py-2.5 gap-2">
 <span className="text-sm text-warm-500 shrink-0">{k}</span>
 <span className="text-sm font-semibold text-warm-800 text-right min-w-0 flex-1 break-words">{v}</span>
 </div>
 ))}
 </div>

 <InlineAuthPanel
   beforeAuth={async () => saveSnapshot({ resumeStep: 3 })}
   redirectTo="/create-card?resumed=1"
   prefillEmail={intentEmail}
   onAuthenticated={() => setHandingOff(true)}
 />

 <p className="text-center text-xs text-warm-400 mt-3 mb-5">
 Your draft is safe. No verification code needed — you go straight to the review step.
 </p>

 <div className="border-t border-purple-100 pt-4 flex gap-2">
 <button onClick={() => { setGuestSaved(false); setStep(0); }}
 className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-purple-200 text-warm-700 text-sm font-semibold hover:bg-purple-50 transition-colors">
 Edit card
 </button>
 <button onClick={handleReset}
 className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-red-100 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors">
 Start over
 </button>
 </div>
 <p className="text-center text-xs text-warm-400 mt-3">
 "Edit card" takes you back to step 1. "Start over" wipes everything.
 </p>
 </>)}

 {/* ── AUTHENTICATED: Normal Gift & Pay ── */}
 {(user || isCompanyUser) && (<>
 <h2 className="text-xl font-bold text-warm-900 mb-1">Gift & activate</h2>
 <p className="text-warm-500 text-sm mb-5">Enable a gift collection and launch your card</p>

 <div className="grid grid-cols-2 gap-3 mb-4">
 {[
 { id: true, icon: 'Gift', title: 'Enable gift pot', desc: 'Everyone chips in, recipient redeems' },
 { id: false, icon: 'Mail', title: 'Card only', desc: 'Messages only, no gift' },
 ].map(o => (
 <button key={String(o.id)} onClick={() => set('is_gift_enabled', o.id)}
 className={`rounded-2xl p-4 text-left border-2 transition-all ${form.is_gift_enabled === o.id ? 'border-primary-400 bg-primary-50' : 'border-purple-100 hover:border-purple-200'}`}>
 {o.icon && <div className="mb-2 text-primary-500"><Icon name={o.icon} size={22}/></div>}
 <div className="text-sm font-bold text-warm-800">{o.title}</div>
 <div className="text-xs text-warm-500 mt-0.5">{o.desc}</div>
 </button>
 ))}
 </div>

 {form.is_gift_enabled && (
 <div className="mb-5">
 <p className="text-sm font-semibold text-warm-700 mb-2">Suggested contribution</p>
 <div className="flex flex-wrap gap-2">
 {[2500, 5000, 10000, 25000, 50000].map(amt => (
 <button key={amt} onClick={() => set('suggested_amount', amt)}
 className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${form.suggested_amount === amt ? 'bg-primary-400 text-white border-primary-400' : 'border-purple-100 text-warm-700 hover:border-primary-300'}`}>
 {formatNGN(amt)}
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Invite emails */}
 <div className="mb-5">
 <label className="block text-sm font-bold text-warm-700 mb-1.5">
 Invite people to sign <span className="text-warm-400 font-normal text-xs">(optional)</span>
 </label>
 <textarea className="input h-20 resize-none" placeholder="kemi@email.com, emeka@email.com"
 value={inviteEmails} onChange={e => setInviteEmails(e.target.value)}/>
 <p className="text-xs text-warm-400 mt-1">Optional — you can also just share the link once the card is live.</p>
 </div>

 <div className="rounded-2xl bg-warm-100 border border-purple-100 divide-y divide-gray-100 mb-5">
 {[
 ['Occasion', form.occasion === 'other' && form.custom_occasion ? form.custom_occasion : (OCCASIONS.find(o => o.id === form.occasion)?.label || form.occasion)],
 ['Recipient', form.recipient_name || '—'],
 ['Gift', form.is_gift_enabled ? `Yes — ${formatNGN(form.suggested_amount)} suggested` : 'No'],
 ...(isCompanyUser
 ? [['Card fee', 'Free (company)']]
 : payMode === 'credit' && creditBalance > 0
 ? [['Card fee', `1 credit (${creditBalance} remaining)`]]
 : discountStatus === 'applied' && discountedNGN !== null
 ? [['Card fee', `${formatCurrency(discountedNGN, selectedCurrency)} (${discountCode} applied)`]]
 : [['Card fee', `${formatCurrency(5000, selectedCurrency)} one-time`]]),
 ].map(([k, v]) => (
 <div key={k} className="flex justify-between items-start px-4 py-3 gap-2">
 <span className="text-sm text-warm-500 shrink-0">{k}</span>
 <span className="text-sm font-semibold text-warm-900 text-right min-w-0 flex-1 break-words">{v}</span>
 </div>
 ))}
 </div>

 {!isCompanyUser && (
 <div className="mb-4">
 {creditBalance > 0 && (
 <div className="grid grid-cols-2 gap-2 mb-3">
 <button type="button" onClick={() => setPayMode('credit')}
 className={`p-3 rounded-xl border-2 text-left text-xs transition-all ${payMode === 'credit' ? 'border-primary-400 bg-primary-50' : 'border-purple-100'}`}>
 <p className="font-bold text-warm-900">Use credit</p>
 <p className="text-primary-600 font-semibold">{creditBalance} left</p>
 <p className="text-green-600 font-bold">Instant</p>
 </button>
 <button type="button" onClick={() => setPayMode('direct')}
 className={`p-3 rounded-xl border-2 text-left text-xs transition-all ${payMode === 'direct' ? 'border-primary-400 bg-primary-50' : 'border-purple-100'}`}>
 <p className="font-bold text-warm-900">Pay now</p>
 <p className="text-warm-500">via Flutterwave</p>
 </button>
 </div>
 )}
 {payMode === 'direct' && (
 <div className="mb-3">
 <p className="text-xs font-semibold text-warm-500 mb-1.5">Pay in:</p>
 <div className="flex flex-wrap gap-1.5">
 {CURRENCIES.map(c => (
 <button key={c.code} type="button" onClick={() => setSelectedCurrency(c.code)}
 className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${selectedCurrency === c.code ? 'bg-primary-500 text-white' : 'bg-primary-50 text-primary-600 border border-primary-200'}`}>
 {c.flag} {c.code}
 </button>
 ))}
 </div>
 </div>
 )}
 {payMode === 'direct' && (
 <div className="mb-3">
 <p className="text-xs font-semibold text-warm-500 mb-1.5">Discount code (optional):</p>
 <div className="flex gap-2">
 <input
   type="text"
   value={discountCode}
   onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscountStatus(null); }}
   placeholder="e.g. LAUNCH20"
   className="flex-1 input text-sm py-2"
 />
 <button type="button" onClick={handleApplyDiscount} disabled={!discountCode.trim() || discountStatus === 'checking'}
   className="px-4 py-2 rounded-xl text-xs font-bold bg-primary-100 text-primary-600 hover:bg-primary-200 disabled:opacity-50 transition-all">
   {discountStatus === 'checking' ? 'Checking…' : 'Apply'}
 </button>
 </div>
 {discountMessage && (
   <p className={`mt-1.5 text-xs font-semibold ${discountStatus === 'applied' ? 'text-green-600' : 'text-red-500'}`}>
     {discountStatus === 'applied' ? '✓ ' : ''}{discountMessage}
   </p>
 )}
 </div>
 )}
 </div>
 )}

 <div className="flex gap-3">
 <button onClick={() => setStep(2)} className="btn-secondary px-4">← Back</button>
 <button onClick={handlePayAndLaunch} disabled={loading} className="btn-primary flex-1">
 {loading
 ? <span className="flex items-center justify-center gap-2">
 <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
 {paymentStage === 'sending' ? 'Saving…' : paymentStage === 'verifying' ? 'Using credit…' : paymentStage === 'redirecting' ? 'Opening payment…' : 'Creating card…'}
 </span>
 : isCompanyUser ? 'Create Card (Free)'
 : payMode === 'credit' ? 'Use 1 Credit & Launch'
 : discountStatus === 'applied' && discountedNGN !== null
 ? `Pay ${formatCurrency(discountedNGN, selectedCurrency)} & Launch Card`
 : `Pay ${formatCurrency(5000, selectedCurrency)} & Launch Card`}
 </button>
 </div>
 <p className="text-xs text-center text-warm-400 mt-3">
 {isCompanyUser ? 'Company account · Card creation is free' : 'Secured by Flutterwave · Card link will be ready immediately'}
 </p>
 </>)}

 </div>
 )}
 </div>

 </section>

 <aside className="order-first border-b border-purple-100 bg-white px-4 py-6 sm:px-8 lg:order-none lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-l lg:px-10 lg:py-8">

  {/* No experience chooser — AlbumStudioPreview renders its own Album / Board
      sub-tabs immediately, with Album selected by default. */}
  <AlbumStudioPreview
   design={selectedDesign}
   form={form}
   message={msgForm}
   occasionLabel={occasionLabel}
   activeStep={step >= 3 ? 4 : step}
   creatorName={creatorName}
   layout={form.cover_layout}
   onLayoutChange={(next) => set('cover_layout', next)}
   onCardLayoutChange={(layout) => set('card_layout', layout)}
   selectedField={selectedCoverField}
   onSelectField={setSelectedCoverField}
   onFormChange={set}
   wallDrafts={wallDrafts}
   onWallDraftsChange={setWallDrafts}
   recipientPhoto={recipientPhoto}
   onRecipientPhoto={(f) => setRecipientPhoto({ file: f, preview: URL.createObjectURL(f) })}
  />
 </aside>
 </div>
 </div>
 );

 if (company) return <CompanyLayout title="Create a Card" subtitle="Takes less than 3 minutes">{inner}</CompanyLayout>;
 if (member) return <MemberLayout title="Create a Card" subtitle="Takes less than 3 minutes">{inner}</MemberLayout>;
 return (
 <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#F5F0FF,#FFF0F5 60%)' }}>
 <Navbar/>
 {inner}
 </div>
 );
};

export default CardStart;
