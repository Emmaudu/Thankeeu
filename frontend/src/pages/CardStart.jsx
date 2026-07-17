/**
 * CardStart.jsx — /card/new
 *
 * The public card-creation wizard for guests (and logged-in users from the homepage).
 * Full 5-step flow matching the dashboard CreateCard experience:
 *
 * Step 0 Occasion — pick the type of card
 * Step 1 Design — pick template + font + layout
 * Step 2 Details — recipient, dates, title, toggles
 * Step 3 Your Message — write message, attach media, invite emails
 * Step 4 Gift & Pay — gift pot config → save draft → auth wall
 * (authenticated users go straight to payment)
 *
 * Guest flow:
 * Steps 0-3 are pure UI (no backend calls).
 * Step 4 "Save draft & continue" creates one anonymous draft via createDraft(),
 * then shows the auth wall with the full summary.
 * After login/signup the draft is claimed and they land on the payment step.
 *
 * Authenticated flow:
 * Steps 0-3 still pure UI.
 * Step 2 → 3 button calls handleCreateDraft() to persist to backend.
 * Step 4 shows normal payment panel.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { useAuth } from '../context/AuthContext';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import Navbar from '../components/Navbar';
import Icon from '../components/ui/Icon';
import QRButton from '../components/QRButton';
import VoiceRecorder from '../components/VoiceRecorder';
import EmojiPicker from '../components/EmojiPicker';
import GifPicker from '../components/GifPicker';
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

const STEPS = ['Occasion', 'Design', 'Details', 'Message', 'Finalise'];
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

 // ── Wizard state ────────────────────────────────────────────────────────
 const [step, setStep] = useState(0);
 // Step 1 has two sub-pages: 'design' then 'experience' (Group Card vs Live Wall).
 // This avoids renumbering all steps while giving Experience its own screen.
 const [designSubStep, setDesignSubStep] = useState('design'); // 'design' | 'experience'
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

 // ── Message form ─────────────────────────────────────────────────────────
 const [msgForm, setMsgForm] = useState({ content: '', font_style: 'handwritten', is_private: false });
 const [mediaFiles, setMediaFiles] = useState([]);
 const [wallDrafts, setWallDrafts] = useState(() => [makeWallPreviewCard(creatorName, 0)]);
 const [recipientPhoto, setRecipientPhoto] = useState(null); // board-style recipient image {file,preview}
 const [carouselIdx, setCarouselIdx] = useState(0);
 const [showEmoji, setShowEmoji] = useState(false);
 const [showGif, setShowGif] = useState(false);
 const setMsg = (k, v) => setMsgForm(p => ({ ...p, [k]: v }));

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

 const fileRef = useRef();
 const textareaRef = useRef();

 const [customCoverUrl, setCustomCoverUrl] = useState(null); // Cloudinary URL for uploaded cover
 const [uploadingCover, setUploadingCover] = useState(false);
 const selectedDesign = form.design_theme === 'custom_upload'
   ? {
       id: 'custom_upload', occasion: form.occasion, name: 'Your design',
       image: customCoverUrl || (form.background_color?.startsWith('blob:') || form.background_color?.startsWith('http') ? form.background_color : null),
       background: '#1a1035', ink: '#ffffff', accent: '#7c3aed', dark: true,
       coverTitle: form.title, icon: 'Image',
     }
   : CARD_DESIGNS.find(d => d.id === form.design_theme);
  // Show only real image/artwork covers; retire the old plain gradient templates.
  const availableDesigns = (() => {
    const realCovers = CARD_DESIGNS.filter(d => (d.artwork || d.image) && d.occasion === form.occasion);
    return realCovers.length ? realCovers : CARD_DESIGNS.filter(d => d.artwork || d.image).slice(0, 10);
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
 setStep(4); // go straight to payment
 } else if (saved.formSnapshot) {
 toast.success('Welcome back! Pick up where you left off.');
 setStep(saved.localOnly ? 4 : 2);
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
    card_layout: searchParams.get('layout') === 'album' ? 'album' : previous.card_layout,
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

 // ── Media helpers ────────────────────────────────────────────────────────
 const addMedia = useCallback((files) => {
 const items = [];
 for (const f of Array.from(files)) {
 const isGifOrImage = f.type === 'image/gif' || f.type.startsWith('image/');
 const maxSize = isGifOrImage ? 9 * 1024 * 1024 : 50 * 1024 * 1024;
 if (f.size > maxSize) {
 toast.error(`${f.name} is too large. ${isGifOrImage ? 'Images and GIFs must be under 9MB.' : 'Videos must be under 50MB.'}`);
 continue;
 }
 const mime = f.type;
 const type = mime.startsWith('video/') ? 'video' : mime.startsWith('audio/') ? 'voice' : mime === 'image/gif' ? 'gif' : 'image';
 items.push({ file: f, preview: URL.createObjectURL(f), type, name: f.name });
 }
 setMediaFiles(prev => [...prev, ...items].slice(0, 5));
 }, []);

 const removeMedia = useCallback((idx) => {
 setMediaFiles(prev => {
 const n = [...prev];
 URL.revokeObjectURL(n[idx].preview);
 n.splice(idx, 1);
 setCarouselIdx(i =>Math.min(i, Math.max(0, n.length - 1)));
 return n;
 });
 }, []);

 const insertEmoji = useCallback((emoji) => {
 const el = textareaRef.current;
 if (el && typeof el.selectionStart === 'number') {
 const s = el.selectionStart, e = el.selectionEnd;
 setMsg('content', msgForm.content.slice(0, s) + emoji + msgForm.content.slice(e));
 requestAnimationFrame(() => { el.focus(); const p = s + emoji.length; el.setSelectionRange(p, p); });
 } else setMsg('content', msgForm.content + emoji);
 setShowEmoji(false);
 }, [msgForm.content]);

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
 const payRes = await paymentsAPI.initCardFee(slug, selectedCurrency, userEmail);
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
 setMediaFiles([]); setInviteEmails('');
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

 // ── Live screen (authenticated users after payment) ──────────────────────
 if (liveSlug) return (
 <div className="min-h-screen section-dots" style={{ background: 'linear-gradient(160deg,#F5F0FF,#FFF0F5)' }}>
 <Navbar/>
 <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-16 text-center">
 <div className="w-24 h-24 rounded-xl flex items-center justify-center text-5xl mb-6"
 style={{ background: 'linear-gradient(135deg,#7C3AED,#EC4899)' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>
 <h1 className="text-3xl font-extrabold text-warm-900 mb-3">Your card is live!</h1>
 <p className="text-warm-500 text-lg mb-8">Share the link so people can sign it.</p>
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
 {['card_and_wall','wall_only'].includes(form.card_experience) && (
   <QRButton url={`${window.location.origin}/sign/${liveSlug}?tab=wall`} label="Scan to add photos to the Live Photo Wall" variant="secondary" className="px-6 py-3">QR Code — Photo Wall</QRButton>
 )}
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

 {/* ══ STEP 1: Design + Experience ════════════════════════════════════ */}
 {step === 1 && (
 <div className="bg-white rounded-lg border border-purple-100 p-5 sm:p-6 animate-fade-in">
 {designSubStep === 'experience' ? (
  <>
   <button onClick={() => setDesignSubStep('design')} className="mb-4 text-xs font-bold text-primary-500 flex items-center gap-1"><Icon name="ChevronLeft" size={14}/> Back to design</button>
   <h2 className="text-xl font-bold text-warm-900 mb-1">Card experience</h2>
   <p className="text-warm-500 text-sm mb-5">How do you want contributors to participate?</p>
   <div className="space-y-3 mb-6">
    {[
     { id: 'card_only', icon: 'Mail', title: 'Group Card', badge: null,
       desc: 'Everyone signs one beautiful card — messages, photos, GIFs, voice notes and a group gift. A Memory Movie™ is auto-generated.' },
     { id: 'wall_only', icon: 'Camera', title: 'Live Memory Wall™',
       desc: 'Guests upload photos and videos to a shared live wall throughout the event. Perfect for weddings, owambes and parties.', badge: null },
    ].map(opt => (
     <button key={opt.id} type="button" onClick={() => set('card_experience', opt.id)}
      className={`w-full text-left rounded-2xl p-5 border-2 transition-all ${form.card_experience === opt.id || (opt.id === 'card_only' && form.card_experience === 'card_and_wall') ? 'border-primary-400 bg-primary-50 shadow-sm' : 'border-purple-100 hover:border-purple-200'}`}>
      <div className="flex items-start gap-4">
       <span className={`mt-0.5 flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl ${form.card_experience === opt.id || (opt.id === 'card_only' && form.card_experience === 'card_and_wall') ? 'bg-primary-500 text-white' : 'bg-purple-50 text-primary-500'}`}>
        <Icon name={opt.icon} size={20} />
       </span>
       <div className="flex-1">
        <p className="font-extrabold text-warm-900">{opt.title}</p>
        <p className="text-xs text-warm-500 mt-1 leading-relaxed">{opt.desc}</p>
       </div>
       <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${form.card_experience === opt.id || (opt.id === 'card_only' && form.card_experience === 'card_and_wall') ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}>
        {(form.card_experience === opt.id || (opt.id === 'card_only' && form.card_experience === 'card_and_wall')) && <span className="w-2 h-2 rounded-full bg-white block"/>}
       </div>
      </div>
     </button>
    ))}
   </div>
  </>
 ) : (
  <>
   <h2 className="text-xl font-bold text-warm-900 mb-1">Pick a design</h2>
   <p className="text-warm-500 text-sm mb-5">Choose from our templates</p>

 <style>{`
 .ccg { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-bottom:20px; max-height:none; }
 @media(max-width:640px){.ccg{grid-template-columns:repeat(3,1fr);}}
 .ccg-wrap { overflow:hidden; max-height:calc(2 * (56vw/5 * 297/210) + 10px); }
 .ccg-wrap.expanded { max-height:none; }
 @media(max-width:640px){.ccg-wrap{max-height:calc(2 * (33vw * 297/210) + 10px);}}
 @media(max-width:640px){.ccg-wrap.expanded{max-height:none;}}
 @media(max-width:380px){.ccg{grid-template-columns:repeat(2,1fr);}}
 .ccg-item{position:relative;border-radius:14px;overflow:hidden;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;aspect-ratio:210/297;background:#fff;}
 .ccg-item:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.14);}
 .ccg-item.sel{outline:3px solid #7C3AED;outline-offset:2px;}
 .ccg-badge{position:absolute;top:7px;left:7px;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:800;z-index:2;}
 .ccg-new{background:#FCD34D;color:#92400E;}
 .ccg-more{background:#F43F5E;color:#fff;}
 .ccg-upload{background:#60A5FA;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;}
 .ccg-upload p{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:14px;color:#fff;margin:0;text-align:center;line-height:1.2;}
 `}</style>

 {(() => {
   const [designsExpanded, setDesignsExpanded] = React.useState(false);
   return (
   <>
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
 {availableDesigns.length > 10 && (
   <button type="button" onClick={() => setDesignsExpanded(e => !e)}
     className="w-full mt-1 mb-4 text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-primary-50 transition-colors">
     <Icon name={designsExpanded ? 'ChevronUp' : 'ChevronDown'} size={14}/>
     {designsExpanded ? 'Show fewer designs' : `Show all ${availableDesigns.length} designs`}
   </button>
 )}
 </>
 );
 })()}

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

 <div className="mb-5 border-t border-purple-100 pt-5">
  <p className="text-sm font-bold text-warm-700">Album background</p>
  <p className="mt-0.5 text-xs text-warm-500">Choose the setting around the flipbook pages.</p>
  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
   {ALBUM_THEMES.map(theme => (
    <button key={theme.id} type="button" onClick={() => set('album_background_theme', theme.id)} className={`rounded-lg border-2 p-2.5 text-left ${form.album_background_theme === theme.id ? 'border-primary-500 bg-primary-50' : 'border-purple-100 bg-white hover:border-primary-200'}`}>
     <span className="block h-10 rounded-md border border-black/5" style={{ background: theme.stage }} />
     <span className="mt-2 block text-xs font-bold text-warm-800">{theme.name}</span>
     <span className="mt-0.5 block text-[10px] text-warm-500">{theme.description}</span>
    </button>
   ))}
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
 )}

 <div className="flex justify-between">
 <button onClick={() => { if (designSubStep === 'experience') { setDesignSubStep('design'); } else { setStep(0); } }} className="btn-secondary">← Back</button>
 <button onClick={() => {
  if (designSubStep === 'design') { setDesignSubStep('experience'); return; }
  saveSnapshot();
  setStep(2);
  setDesignSubStep('design');
 }} className="btn-primary">{designSubStep === 'design' ? 'Choose experience →' : 'Add details →'}</button>
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
 <Link to={`/login?returnTo=${encodeURIComponent('/card/customize?resumed=1')}`}
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
 : 'Add your message →'}
 </button>
 </div>
 </div>
 )}

 {/* ══ STEP 3: Your Message ════════════════════════════════════════════ */}
 {step === 3 && (
 <div className="bg-white rounded-lg border border-purple-100 p-5 sm:p-6 animate-fade-in">
 <h2 className="text-xl font-bold text-warm-900 mb-1">Add your message </h2>
 <p className="text-warm-500 text-sm mb-4">
 You're the card creator — add your own message first. Others will sign once you share the link.
 </p>

 {/* Sign-in nudge for guests */}
 {!user && !isCompanyUser && (
 <div style={{ background:'linear-gradient(135deg,#EDE9FE,#F5F0FF)', border:'1.5px solid #C4B5FD', borderRadius:16, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:20, flexWrap:'wrap' }}>
 <div style={{ display:'flex', alignItems:'center', gap:10 }}>
 <span style={{ fontSize:22 }}></span>
 <div>
 <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, color:'#1A1035', margin:0, lineHeight:1.3 }}>Already have an account?</p>
 <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12, color:'#7A6CA8', margin:0 }}>Sign in to save your card.</p>
 </div>
 </div>
 <Link to={`/login?returnTo=${encodeURIComponent('/card/customize?resumed=1')}`}
 onClick={() => saveSnapshot()}
 style={{ background:'#7C3AED', color:'#fff', borderRadius:12, padding:'8px 18px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:13, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0, display:'inline-flex', alignItems:'center', gap:6 }}>
 <Icon name="LogIn" size={14}/>Sign in
 </Link>
 </div>
 )}

 {/* Writing style */}
 <label className="block text-sm font-bold text-warm-700 mb-2">Writing style</label>
 <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
 {FONT_STYLES.map(font => (
 <button key={font.id} type="button" onClick={() => setMsg('font_style', font.id)}
 className={`rounded-xl border-2 px-2 py-2.5 text-sm transition-all ${msgForm.font_style === font.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-purple-100 text-warm-600'}`}
 style={{ fontFamily: font.family }}>
 {font.id === 'calligraphy' ? 'With love' : font.name}
 </button>
 ))}
 </div>

 {/* Message textarea */}
 <label className="block text-sm font-bold text-warm-700 mb-2">Your message to {form.recipient_name || 'them'}</label>
 <div className="relative mb-1">
 <textarea ref={textareaRef} className="input h-36 resize-none"
 style={{ fontFamily: getFontStyle(msgForm.font_style).family, fontSize: msgForm.font_style === 'calligraphy' ? '1.5rem' : '1rem' }}
 placeholder={`Write something heartfelt for ${form.recipient_name || 'them'}…`}
 maxLength={1200} value={msgForm.content} onChange={e => setMsg('content', e.target.value)}/>
 <button type="button" onClick={() => { setShowEmoji(s => !s); setShowGif(false); }}
 className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white border border-purple-100 shadow-sm flex items-center justify-center text-lg hover:bg-purple-50 transition-colors">
 
 </button>
 {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)}/>}
 </div>
 <div className="flex justify-end mb-4">
 <span className="text-xs text-warm-400">{msgForm.content.length}/1200</span>
 </div>

 {/* Media buttons */}
 <div className="relative flex flex-wrap gap-2 mb-4">
 <button type="button" onClick={() => fileRef.current?.click()} className="voice-record-button">
 <span></span><span>Photos/video {mediaFiles.length > 0 ? `(${mediaFiles.length}/5)` : ''}</span>
 </button>
 <button type="button" onClick={() => { setShowGif(s => !s); setShowEmoji(false); }} disabled={mediaFiles.length >= 5}
 className="voice-record-button disabled:opacity-50"><span></span><span>Add GIF</span></button>
 <VoiceRecorder onRecorded={f => addMedia([f])} disabled={loading}/>
 <input ref={fileRef} type="file" accept="image/*,video/*,audio/*,.m4a,.ogg,.webm" multiple className="hidden"
 onChange={e => addMedia(e.target.files)}/>
 {showGif && <GifPicker onSelect={f => { addMedia([f]); setShowGif(false); }} onClose={() => setShowGif(false)}/>}
 </div>

 {/* Media carousel */}
 {mediaFiles.length > 0 && (
 <div className="mb-4 rounded-2xl overflow-hidden border-2 border-purple-100 bg-white">
 <div className="relative" style={{ aspectRatio: '16/9', background: '#1A1035' }}>
 {mediaFiles[carouselIdx].type === 'video'
 ? <video src={mediaFiles[carouselIdx].preview} className="w-full h-full object-contain" controls/>
 : mediaFiles[carouselIdx].type === 'voice'
 ? <div className="w-full h-full flex flex-col items-center justify-center gap-3"><span className="inline-flex w-12 h-12 rounded-xl bg-primary-100 items-center justify-center"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></span><audio src={mediaFiles[carouselIdx].preview} controls className="w-4/5"/></div>
 : <img src={mediaFiles[carouselIdx].preview} alt="" className="w-full h-full object-contain"/>}
 <button type="button" onClick={() => removeMedia(carouselIdx)}
 className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-red-500 transition-colors"></button>
 {mediaFiles.length > 1 && (<>
 <button type="button" onClick={() => setCarouselIdx(i => (i - 1 + mediaFiles.length) % mediaFiles.length)}
 className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-lg">‹</button>
 <button type="button" onClick={() => setCarouselIdx(i => (i + 1) % mediaFiles.length)}
 className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-lg">›</button>
 </>)}
 </div>
 <p className="text-center text-xs text-warm-400 py-2">{carouselIdx + 1} of {mediaFiles.length} — Add up to {5 - mediaFiles.length} more</p>
 </div>
 )}

 {/* Private toggle */}
 {form.allow_private_messages && (
 <label className="flex items-center justify-between gap-4 border-t border-purple-100 pt-4 mb-4 cursor-pointer">
 <span>
 <span className="block text-sm font-bold text-warm-800">Private message</span>
 <span className="block text-xs text-warm-400">Only the recipient and card creator can read it</span>
 </span>
 <input type="checkbox" checked={msgForm.is_private} onChange={e => setMsg('is_private', e.target.checked)} className="w-5 h-5 accent-violet-600"/>
 </label>
 )}

 {/* Invite emails */}
 <div className="mb-5">
 <label className="block text-sm font-bold text-warm-700 mb-1.5">
 Invite people to sign <span className="text-warm-400 font-normal text-xs">(optional)</span>
 </label>
 <textarea className="input h-20 resize-none" placeholder="kemi@email.com, emeka@email.com"
 value={inviteEmails} onChange={e => setInviteEmails(e.target.value)}/>
 <p className="text-xs text-warm-400 mt-1">You can also share a link after creating the card</p>
 </div>

 <div className="flex justify-between">
 <button onClick={() => setStep(2)} className="btn-secondary">← Back</button>
 <button
 onClick={() => {
 saveSnapshot();
 setGuestSaved(false);
 setStep(4);
 }}
 className="btn-primary inline-flex items-center gap-2">
 {msgForm.content.trim() ? 'Save message & pay →' : 'Skip & continue →'}
 </button>
 </div>
 </div>
 )}

 {/* ══ STEP 4: Gift & Pay ══════════════════════════════════════════════ */}
 {step === 4 && (
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
 ['Your message', msgForm.content?.trim() ? `Written — ${msgForm.content.length} chars` : 'None added'],
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
 <button onClick={() => setStep(3)} className="btn-secondary px-4">← Back</button>
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
 resumeStep: 4, timestamp: Date.now(),
 }));
 await saveCreatorWallCards(slug);
 setGuestSaved(true);
 } catch (err) {
 // If the server/database is temporarily unavailable, preserve the complete
 // draft on this device so the guest is never forced to start over.
 const existing = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}');
 localStorage.setItem(PENDING_KEY, JSON.stringify({
 ...existing, localOnly: true, formSnapshot: form, msgSnapshot: msgForm,
 resumeStep: 4, timestamp: Date.now(),
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
 {!user && !isCompanyUser && guestSaved && (<>
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
 ['Your message', msgForm.content?.trim() ? `Written — ${msgForm.content.length} chars` : 'None added'],
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

 <div className="flex flex-col gap-3 mb-4">
 <Link
  to={`/login?returnTo=${encodeURIComponent('/card/customize?resumed=1')}`}
 onClick={() => saveSnapshot({ resumeStep: 4 })}
 className="btn-primary w-full py-3.5 text-base font-bold text-center block">
 Sign in &amp; complete payment
 </Link>
 <Link
  to={`/signup?returnTo=${encodeURIComponent('/card/customize?resumed=1')}`}
 onClick={() => saveSnapshot({ resumeStep: 4 })}
 className="btn-secondary w-full py-3.5 text-base font-bold text-center block">
 Create free account &amp; continue
 </Link>
 </div>

 <p className="text-center text-xs text-warm-400 mb-5">
 Draft is safe. After signing in you land straight on the payment step.
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

 <div className="rounded-2xl bg-warm-100 border border-purple-100 divide-y divide-gray-100 mb-5">
 {[
 ['Occasion', form.occasion === 'other' && form.custom_occasion ? form.custom_occasion : (OCCASIONS.find(o => o.id === form.occasion)?.label || form.occasion)],
 ['Recipient', form.recipient_name || '—'],
 ['Gift', form.is_gift_enabled ? `Yes — ${formatNGN(form.suggested_amount)} suggested` : 'No'],
 ...(isCompanyUser
 ? [['Card fee', 'Free (company)']]
 : payMode === 'credit' && creditBalance > 0
 ? [['Card fee', `1 credit (${creditBalance} remaining)`]]
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
 </div>
 )}

 <div className="flex gap-3">
 <button onClick={() => setStep(3)} className="btn-secondary px-4">← Back</button>
 <button onClick={handlePayAndLaunch} disabled={loading} className="btn-primary flex-1">
 {loading
 ? <span className="flex items-center justify-center gap-2">
 <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
 {paymentStage === 'sending' ? 'Saving…' : paymentStage === 'verifying' ? 'Using credit…' : paymentStage === 'redirecting' ? 'Opening payment…' : 'Creating card…'}
 </span>
 : isCompanyUser ? 'Create Card (Free)'
 : payMode === 'credit' ? 'Use 1 Credit & Launch'
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
  <AlbumStudioPreview
   design={selectedDesign}
   form={form}
   message={msgForm}
   occasionLabel={occasionLabel}
   activeStep={step}
   creatorName={creatorName}
   layout={form.cover_layout}
   onLayoutChange={(next) => set('cover_layout', next)}
   onCardLayoutChange={(layout) => set('card_layout', layout)}
   selectedField={selectedCoverField}
   onSelectField={setSelectedCoverField}
   media={mediaFiles}
   onAddMedia={addMedia}
   onRemoveMedia={removeMedia}
   onMessageChange={(content) => setMsg('content', content)}
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
