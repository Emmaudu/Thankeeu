import { useSEO } from '../hooks/useSEO';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import { cardsAPI, paymentsAPI, creditsAPI, messagesAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import DashboardLayout from '../components/DashboardLayout';
import CompanyLayout from '../components/company/CompanyLayout';
import MemberLayout from '../components/member/MemberLayout';
import Icon from '../components/ui/Icon';
import QRButton from '../components/QRButton';
import toast from 'react-hot-toast';
import { formatNGN, CURRENCIES, formatCurrency } from '../utils/currency';
import { CARD_DESIGNS, FONT_STYLES, cardArtClass, getFontStyle } from '../utils/cardDesigns';
import { getOccasionLabel } from '../utils/occasionCardDesigns';
import CoverTextStudio from '../components/CoverTextStudio';
import CardCoverPreview from '../components/CardCoverPreview';
import { ALBUM_THEMES } from '../utils/albumThemes';
import { LEAVING_CARD_DESIGNS } from '../utils/leavingCardDesigns';

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
 { id: 'other',           icon: 'Sparkles',     label: 'Other' },
];

const AMOUNTS_NGN = [2500, 5000, 10000, 20000, 50000];
const STEPS = ['Occasion', 'Design', 'Details', 'Gift & Pay'];

const StepIndicator = ({ current }) => (
 <div className="flex items-center mb-8">
 {STEPS.map((s, i) => (
 <div key={s} className="flex items-center flex-1 last:flex-none">
 <div className="flex items-center gap-1.5">
 <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
 i < current ? 'bg-primary-500 text-white' :
 i === current? 'bg-primary-500 text-white ring-4 ring-primary-100' :
 'bg-purple-50 text-warm-400'}`}>
 {i < current
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                : i + 1}
 </div>
 <span className={`text-xs font-medium hidden sm:block ${i <= current ? 'text-warm-900' : 'text-warm-400'}`}>{s}</span>
 </div>
 {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 transition-all ${i < current ? 'bg-primary-400' : 'bg-gray-200'}`}/>}
 </div>
 ))}
 </div>
);

const CreateCard = () => {
 useSEO({ title: 'Create a Card', description: 'Create a new group card.', noIndex: true });

 const { user } = useAuth();
 const { member } = useMemberAuth();
 const { company } = useCompanyAuth();
 const isCompanyUser = !!(member || company);
 const isTeamLeader = member?.role === 'team_leader';
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();
 const creatorName = user?.full_name || company?.contact_person || company?.name || member?.first_name || 'Someone';

 const [step, setStep] = useState(0);
 // Design gallery starts collapsed to two rows, as on the public flow.
 const [designsExpanded, setDesignsExpanded] = useState(false);
 // Scroll to top whenever the user advances or goes back a step
 useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);
 const [loading, setLoading] = useState(false);
 const [paymentStage, setPaymentStage] = useState('idle');
 const [selectedCurrency,setSelectedCurrency] = useState('NGN');
 const [creditBalance, setCreditBalance] = useState(null);
 const [payMode, setPayMode] = useState('direct');
 const [inviteEmails, setInviteEmails] = useState('');
 const [liveSlug, setLiveSlug] = useState(null); // set when card is live
 const [draftSlug, setDraftSlug] = useState(null); // slug of the draft currently being created/edited
 const [loadingDraft, setLoadingDraft] = useState(false);
 const [isActiveEdit, setIsActiveEdit] = useState(false); // true when editing an already-active card
 const [guestPhase, setGuestPhase] = useState('configure'); // 'configure' | 'auth' — guest step 4 sub-phase
 const [signingDeadline, setSigningDeadline]= useState('');
 const [deliveryDate, setDeliveryDate] = useState('');

 // Card form
 const [form, setForm] = useState({
 occasion: 'birthday', design_theme: 'birthday-featured-01', background_color: '#FBEAF0',
 font_style: 'elegant', card_layout: 'album',
 title: `${creatorName.split(' ')[0]}'s Birthday Card`,
 recipient_name: '', recipient_email: '', send_date: '',
 send_time: '09:00', deadline: '', deadline_time: '23:59',
 is_gift_enabled: true, gift_type: 'pot', suggested_amount: 2500,
 allow_private_messages: true, send_reminders: true, hide_amounts: false,
 notification_scope: 'department',
 custom_occasion: '',
 cover_sender: creatorName === 'You' ? '' : creatorName,
 cover_text_color: 'auto',
 album_background_theme: 'cover_blur',
 cover_layout: null,
 card_experience: 'card_only', // the wizard creates group cards; Live Wall is not part of this flow
 });
 const [selectedCoverField, setSelectedCoverField] = useState('recipient');

 // Creator's own message is no longer written during setup — they add it after
 // the card is live, on the /sign page, alongside everyone they invite. These
 // stay so an older saved draft (which may carry a msgSnapshot) still restores,
 // and so an existing draft's own message is preserved when it is re-opened.
 const [msgForm, setMsgForm] = useState({ content: '', font_style: 'handwritten', is_private: false });
 const [mediaFiles] = useState([]);
 // True when msgForm was restored from a message that is already saved on the
 // card (re-opening an existing draft or a live card via ?edit=).
 const [creatorMessageAlreadyPosted, setCreatorMessageAlreadyPosted] = useState(false);
 const [giftAmount, setGiftAmount] = useState(null);
 const [customGift, setCustomGift] = useState('');
 // Recipient photo — optional cover photo uploaded in Step 2
 const [recipientPhoto, setRecipientPhoto] = useState({ file: null, preview: null });
 const photoInputRef = useRef();

 useEffect(() => {
 const reset = () => { setLoading(false); setPaymentStage('idle'); };
 window.addEventListener('pageshow', reset);
 return () => window.removeEventListener('pageshow', reset);
 }, []);

 useEffect(() => {
 if (!isCompanyUser && user)
 creditsAPI.getBalance().then(r => setCreditBalance(r.data?.credits ?? 0)).catch(() => {});
 }, [user]);

 // ── Resume pending card after login redirect ──────────────────────
 // When a guest clicks "Sign in to continue", we save their form state
 // and slug (if draft already created) to localStorage, then redirect
 // to /login?returnTo=/card/new?resumed=1. On return, this effect
 // restores everything and jumps to the right step.
 useEffect(() => {
 const isResumed = searchParams.get('resumed') === '1';
 if (!isResumed) return;
 try {
 const raw = localStorage.getItem('thankeeu_pending_card');
 if (!raw) return;
 const saved = JSON.parse(raw);
 // Restore form state if it was saved
 if (saved.formSnapshot) setForm(saved.formSnapshot);
 if (saved.msgSnapshot) setMsgForm(saved.msgSnapshot);
 if (saved.slug) {
 setDraftSlug(saved.slug);
 // Claim anonymous draft if we have a draft_edit_token
 if (saved.draft_edit_token && user) {
 cardsAPI.claimDraft(saved.slug, saved.draft_edit_token).catch(() => {});
 }
 // If they were at the payment step when they went to log in, return there
 const targetStep = saved.resumeStep >= 3 ? 3 : 2;
 toast.success('Welcome back! Continuing your card…');
 setStep(targetStep);
 } else if (saved.formSnapshot) {
 // Form filled but draft not created yet — go to details step
 toast.success('Welcome back! Pick up where you left off.');
 setStep(saved.localOnly ? 3 : 2);
 }
 } catch {}
 // Clean the ?resumed=1 param from the URL without a page reload
 const url = new URL(window.location.href);
 url.searchParams.delete('resumed');
 window.history.replaceState({}, '', url.toString());
 }, [searchParams]);

 useEffect(() => {
 const editSlug = searchParams.get('edit');
 const isResumed = searchParams.get('resumed') === '1';
 if (editSlug || isResumed) return;

 const occasionParam = searchParams.get('occasion');
 const designParam = searchParams.get('design');
 const layoutParam = searchParams.get('layout');
 const sourceParam = searchParams.get('source');
 if (!occasionParam && !designParam && !layoutParam) return;

 const normalizedOccasion = occasionParam === 'farewell' ? 'leaving' : occasionParam;
 const matchedOccasion = OCCASIONS.find(o => o.id === normalizedOccasion);
 const matchedLeavingDesign = LEAVING_CARD_DESIGNS.find(d => d.id === designParam);
 const matchedCardDesign = CARD_DESIGNS.find(d => d.id === designParam);

 setForm(prev => ({
 ...prev,
 occasion: matchedOccasion?.id || prev.occasion,
 title: matchedOccasion?.id === 'leaving' ? `${creatorName.split(' ')[0]}'s Leaving Card` : prev.title,
 design_theme: matchedCardDesign || matchedLeavingDesign ? designParam : prev.design_theme,
 background_color: matchedCardDesign?.background || matchedLeavingDesign?.image || prev.background_color,
 card_layout: 'album',
 }));

 if (matchedOccasion?.id === 'leaving' && sourceParam === 'leaving-gallery') {
 toast.success('Design selected. Album flipbook layout is ready.');
 setStep(2);
 } else if (matchedOccasion) {
 setStep(designParam ? 2 : 1);
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [searchParams]);

 // ── Resume editing an existing draft ──────────────────────────────
 // "Edit" links from the dashboards point here with ?edit=<slug>.
 // Fetch the draft's saved data and repopulate the wizard instead of
 // starting blank, then track its slug in real state (draftSlug) so
 // every later step updates this same card instead of creating a new one.
 useEffect(() => {
 const editSlug = searchParams.get('edit');
 if (!editSlug) return;

 (async () => {
 setLoadingDraft(true);
 try {
 let res;
 if (company) res = await cardsAPI.getOneAsCompany(editSlug);
 else if (member) { const { memberCardsAPI } = await import('../utils/api'); res = await memberCardsAPI.getOne(editSlug); }
 else res = await cardsAPI.getOne(editSlug);

 const card = res.data;
 if (!card || card.error) throw new Error('Draft not found');
 // Both draft and active cards can be edited
 // (active cards keep their status — we don't downgrade them back to draft)

 // ── UTC → local conversion for date/time inputs ──────────────────
 // send_date and send_time are stored as UTC (the frontend converts to UTC on save).
 // The <input type="date"> and <input type="time"> fields expect LOCAL values.
 // We reconstruct the full UTC datetime and convert back to local so the user
 // sees exactly what they set (e.g. 10:24 PM WAT, not 9:24 PM UTC).
 const utcToLocalDate = (dateStr, timeStr) => {
 if (!dateStr) return { localDate: '', localTime: '' };
 const d = String(dateStr).slice(0, 10);
 const t = timeStr ? String(timeStr).slice(0, 8) : '00:00:00';
 const utcDt = new Date(`${d}T${t}Z`);
 if (isNaN(utcDt.getTime())) return { localDate: d, localTime: t.slice(0, 5) };
 // Format local date as YYYY-MM-DD for <input type="date">
 const localDate = [
 utcDt.getFullYear(),
 String(utcDt.getMonth() + 1).padStart(2, '0'),
 String(utcDt.getDate()).padStart(2, '0'),
 ].join('-');
 // Format local time as HH:MM for <input type="time">
 const localTime = [
 String(utcDt.getHours()).padStart(2, '0'),
 String(utcDt.getMinutes()).padStart(2, '0'),
 ].join(':');
 return { localDate, localTime };
 };

 const { localDate: sendDateLocal, localTime: sendTimeLocal } =
 utcToLocalDate(card.send_date, card.send_time);
 const { localDate: deadlineLocal, localTime: deadlineTimeLocal } =
 utcToLocalDate(card.deadline, card.deadline_time);

 setDraftSlug(editSlug);
 setForm(prev => ({
 ...prev,
 occasion: card.occasion || prev.occasion,
 design_theme: card.design_theme || prev.design_theme,
 background_color: card.background_color || prev.background_color,
 font_style: card.font_style || prev.font_style,
 card_layout: 'album',
 // Editing an existing card must show the album background it was saved with.
 album_background_theme: card.album_background_theme || prev.album_background_theme,
 title: card.title || prev.title,
 recipient_name: card.recipient_name || '',
 recipient_email: card.recipient_email || '',
 // Use local date/time (converted from UTC) so inputs show what the user set
 send_date: sendDateLocal,
 send_time: sendTimeLocal || prev.send_time,
 deadline: deadlineLocal,
 deadline_time: deadlineTimeLocal || prev.deadline_time,
 is_gift_enabled: card.is_gift_enabled ?? prev.is_gift_enabled,
 gift_type: card.gift_type || prev.gift_type,
 suggested_amount: card.suggested_amount ?? prev.suggested_amount,
 allow_private_messages: card.allow_private_messages ?? prev.allow_private_messages,
 send_reminders: card.send_reminders ?? prev.send_reminders,
 hide_amounts: card.hide_amounts ?? prev.hide_amounts,
 notification_scope: card.notification_scope || prev.notification_scope,
 }));

 // Restore recipient photo preview — show the existing photo so the user
 // knows it's saved. file stays null so we don't re-upload unless they change it.
 if (card.recipient_photo_url) {
 setRecipientPhoto({ file: null, preview: card.recipient_photo_url });
 }

 // If the creator already wrote their own message on a previous visit, prefill it too
 const myEmail = (user?.email || member?.email || company?.email || '').toLowerCase();
 const myMsg = (card.messages || []).find(m => myEmail && m.author_email?.toLowerCase() === myEmail);
 if (myMsg) {
 setMsgForm({ content: myMsg.content || '', font_style: myMsg.font_style || 'handwritten', is_private: !!myMsg.is_private });
 // It is already on the card — re-posting it on the next activate would
 // duplicate the creator's page.
 setCreatorMessageAlreadyPosted(true);
 }

 const wasActive = card.status === 'active';
 setIsActiveEdit(wasActive);
 toast.success(wasActive ? 'Editing your live card — changes save immediately.' : 'Continuing your draft — your progress is right where you left it.');
 setStep(2);
 } catch (err) {
 toast.error(err.response?.data?.error || 'Could not load this draft. Starting fresh instead.');
 } finally {
 setLoadingDraft(false);
 }
 })();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [searchParams]);


 const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

 // Convert local date+time to UTC before sending to backend.
 // The backend and cron run in UTC, so we must store UTC times to deliver
 // at the exact local time the user expects.
 // Uses the browser's own timezone (works for Nigeria WAT, UK GMT/BST, etc.)
 const toUTCSendTime = (dateStr, timeStr) => {
 if (!dateStr) return { send_date: dateStr, send_time: timeStr };
 const fullTime = (timeStr || '09:00').replace(/^(\d{2}:\d{2})$/, '$1:00');
 const localDatetime = new Date(`${dateStr}T${fullTime}`);
 if (isNaN(localDatetime.getTime())) return { send_date: dateStr, send_time: timeStr };
 const utcDate = localDatetime.toISOString().slice(0, 10);
 const utcTime = localDatetime.toISOString().slice(11, 19);
 return { send_date: utcDate, send_time: utcTime };
 };


 const selectedDesign = form.design_theme === 'custom_upload'
   ? { id:'custom_upload', occasion:form.occasion, name:'Your design',
       image: (form.background_color?.startsWith('blob:')||form.background_color?.startsWith('http')) ? form.background_color : null,
       background:'#1a1035', ink:'#ffffff', accent:'#7c3aed', dark:true, coverTitle:form.title, icon:'Image' }
   : CARD_DESIGNS.find(d => d.id === form.design_theme);
  // Only real image/artwork covers for this occasion (retire old plain templates).
  const ccAvailableDesigns = (() => {
    const realCovers = CARD_DESIGNS.filter(d => (d.artwork || d.image) && d.occasion === form.occasion);
    return realCovers.length ? realCovers : CARD_DESIGNS.filter(d => d.artwork || d.image).slice(0, 10);
 })();

 const handleOccasionSelect = (occ) => {
 set('occasion', occ.id);
 set('custom_occasion', ''); // reset custom when switching occasion
 if (!form.title || form.title.endsWith('Card')) {
 const label = occ.id === 'other' ? 'Special' : occ.label;
 set('title', `${creatorName.split(' ')[0]}'s ${label} Card`);
 }
 };
 const handleDesignSelect = (d) => { set('design_theme', d.id); set('background_color', d.background || d.bg || '#F5F0FF'); };

 // Step 3: create card draft (no payment yet) then allow creator to add first message
 const handleCreateDraft = async () => {
 if (!form.recipient_name) return toast.error('Recipient name is required');
 setLoading(true);
 setPaymentStage('creating');
 try {
 // Strip status from updates so we never downgrade an active card back to draft
 const { status: _s, ...safeForm } = form;
 const { send_date: utcSendDate, send_time: utcSendTime } = toUTCSendTime(safeForm.send_date, safeForm.send_time);
 const cardData = { ...safeForm, title: safeForm.title.trim() || `${safeForm.recipient_name}'s Card`, send_date: utcSendDate, send_time: utcSendTime };
 let slug;
 if (draftSlug) {
 // Updating an existing card (draft or active) — never change its status
 if (company) await cardsAPI.updateAsCompany(draftSlug, cardData);
 else if (member) { const { memberCardsAPI } = await import('../utils/api'); await memberCardsAPI.update(draftSlug, cardData); }
 else await cardsAPI.update(draftSlug, cardData);
 slug = draftSlug;
 } else if (company) slug = (await cardsAPI.createAsCompany(cardData)).data.slug;
 else if (member) { const { memberCardsAPI } = await import('../utils/api'); slug = (await memberCardsAPI.create(cardData)).data.slug; }
 else slug = (await cardsAPI.create(cardData)).data.slug;
 setDraftSlug(slug);
 // Upload recipient photo if one was chosen
 if (recipientPhoto.file) {
 try {
 const fd = new FormData();
 fd.append('photo', recipientPhoto.file);
 await cardsAPI.uploadRecipientPhoto(slug, fd, null);
 } catch (photoErr) {
 console.warn('[recipient-photo] upload failed:', photoErr?.message);
 // Non-fatal — card still proceeds
 }
 }
 localStorage.setItem('thankeeu_pending_card', JSON.stringify({
 cardData, slug, timestamp: Date.now(),
 formSnapshot: form,
 msgSnapshot: msgForm,
 }));
 setPaymentStage('idle');
 setStep(3);
 } catch (err) {
 toast.error(err.response?.data?.error || 'Could not save your card. Please try again.');
 } finally { setLoading(false); }
 };

 // Step 3: pay / activate
 const handlePayAndLaunch = async () => {
 setLoading(true);
 setPaymentStage('sending');
 try {
 const pending = JSON.parse(localStorage.getItem('thankeeu_pending_card') || '{}');
 const slug = draftSlug || pending?.slug;
 if (!slug) { toast.error('Card draft not found. Please go back and try again.'); setLoading(false); setPaymentStage('idle'); return; }

 // ── Active card edit: just save changes & redirect back to card ──────
 if (isActiveEdit) {
 localStorage.removeItem('thankeeu_pending_card');
 toast.success('Card updated! ');
 navigate(`/card/${slug}`);
 setLoading(false); setPaymentStage('idle');
 return;
 }

 // Persist gift toggle + scheduling fields BEFORE payment.
 // This is critical — if this fails, warn loudly so the user can retry.
 try {
 const { send_date: utcSD, send_time: utcST } = toUTCSendTime(form.send_date, form.send_time);
 const { send_date: utcDL, send_time: utcDLT } = toUTCSendTime(form.deadline, form.deadline_time);
 const fullUpdate = {
 is_gift_enabled: form.is_gift_enabled,
 card_experience: form.card_experience || 'card_only',
 suggested_amount: form.suggested_amount,
 gift_type: form.gift_type,
 send_date: utcSD || null,
 send_time: utcST || null,
 deadline: utcDL || null,
 deadline_time: utcDLT || null,
 };
 if (member) {
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
 // Non-fatal — payment continues, but warn the user their schedule may not be set
 toast('Could not save delivery schedule. Card will activate but may need re-scheduling.', { duration: 5000 });
 }


 // Save creator's message AFTER activation (addMessage blocks on draft cards)
 const saveCreatorMessage = async (activeSlug) => {
 if (!msgForm.content.trim() || creatorMessageAlreadyPosted) return;
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

 // Company/member: activate free
 if (isCompanyUser) {
 await cardsAPI.activate(slug, { inviteEmails: inviteEmails.split(/[,\n]/).map(e=>e.trim()).filter(Boolean), signing_deadline: signingDeadline || null, delivery_scheduled: deliveryDate || null });
 await saveCreatorMessage(slug);
 localStorage.removeItem('thankeeu_pending_card');
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
 // Send invite emails after activation
 const emailList = inviteEmails.split(/[,\n]/).map(e => e.trim()).filter(Boolean);
 if (emailList.length) {
 await cardsAPI.activate(slug, { inviteEmails: emailList }).catch(() => {});
 }
 await saveCreatorMessage(slug);
 localStorage.removeItem('thankeeu_pending_card');
 setCreditBalance(res.data.credits_remaining);
 toast.success('Card is live! ');
 setLiveSlug(slug);
 setLoading(false); setPaymentStage('idle');
 return;
 }
 }

 // Flutterwave direct
 setPaymentStage('redirecting');
 const userEmail = user?.email || member?.email || company?.email || '';
 const payRes = await paymentsAPI.initCardFee(slug, selectedCurrency, userEmail);
 const { payment_link, already_active, card_slug: activatedSlug } = payRes.data;

 // Card was already activated by a previous payment (e.g. user's JWT expired during
 // FLW checkout so CardFeeVerify couldn't verify, but the payment actually went through).
 // Skip charging again — just navigate to the live card.
 if (already_active) {
 await saveCreatorMessage(activatedSlug || slug);
 localStorage.removeItem('thankeeu_pending_card');
 toast.success('Your card is already live! ');
 setLiveSlug(activatedSlug || slug);
 setLoading(false); setPaymentStage('idle');
 return;
 }

 if (!payment_link) throw new Error('No payment link returned');
 // Persist creator message snapshot before FLW redirect
 if (msgForm.content.trim()) {
 try {
 const existing = JSON.parse(localStorage.getItem('thankeeu_pending_card') || '{}');
 existing.msgSnapshot = msgForm;
 existing.creatorName = user?.full_name || member ? `${member?.first_name || ''} ${member?.last_name || ''}`.trim() : company?.contact_person || company?.name || creatorName || '';
 existing.creatorEmail = user?.email || member?.email || company?.email || '';
 localStorage.setItem('thankeeu_pending_card', JSON.stringify(existing));
 } catch {}
 }
 window.location.assign(payment_link);

 } catch (err) {
 toast.error(err.response?.data?.error || 'Could not activate card. Please try again.');
 setLoading(false); setPaymentStage('idle');
 }
 };

 const handleReset = () => {
 localStorage.removeItem('thankeeu_pending_card');
 setStep(0); setLiveSlug(null); setDraftSlug(null); setIsActiveEdit(false); setGuestPhase('configure');
 setLoading(false); setPaymentStage('idle');
 setMsgForm({ content: '', font_style: 'handwritten', is_private: false }); setCreatorMessageAlreadyPosted(false);
 setGiftAmount(null); setCustomGift(''); setInviteEmails('');
 setRecipientPhoto({ file: null, preview: null });
 setForm({ occasion:'birthday', design_theme:'birthday-art-1', background_color:'#FBEAF0', font_style:'elegant', card_layout:'album',
 title:`${creatorName.split(' ')[0]}'s Birthday Card`, recipient_name:'', recipient_email:'', send_date:'',
 send_time:'09:00', deadline:'', deadline_time:'23:59', is_gift_enabled:true, gift_type:'pot', suggested_amount:2500,
 allow_private_messages:true, send_reminders:true, hide_amounts:false, notification_scope:'department',
 cover_sender: creatorName === 'You' ? '' : creatorName, cover_text_color:'auto', cover_layout:null, card_experience:'card_only', album_background_theme:'cover_blur' });
 };

 // ── LIVE screen ──────────────────────────────────────────────────────────
 if (liveSlug) {
 const liveContent = (
 <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-16 text-center">
 <div className="w-24 h-24 rounded-xl flex items-center justify-center text-5xl mb-6 animate-pop" style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899)' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>
 <h1 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:'clamp(1.75rem,5vw,2.75rem)', color:'#1A1035', marginBottom:12 }}>
 Your card is live!
 </h1>
 <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', color:'#7A6CA8', fontSize:18, marginBottom:24 }}>
 Sign it first, then share the link so everyone else can too.
 </p>

 {/* The creator writes their message here, not during setup — this is the
     one place anyone signs, so it has to be the first thing offered. */}
 <Link to={`/sign/${liveSlug}`}
  className="btn-primary mb-8 inline-flex items-center gap-2 px-8 py-3.5 text-base">
  <Icon name="PenLine" size={17}/>Write your message on the card
 </Link>
 <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full max-w-lg">
 <input readOnly value={`${window.location.origin}/sign/${liveSlug}`}
 className="input flex-1 text-sm" style={{ background:'#fff' }}/>
 <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sign/${liveSlug}`); toast.success('Link copied!'); }}
 className="btn-primary px-6 whitespace-nowrap">
 Copy link
 </button>
 </div>
 <div className="flex flex-wrap gap-3 justify-center">
 <Link to={`/card/${liveSlug}`} className="btn-primary px-8 py-3 inline-flex items-center gap-2">
 <Icon name="Eye" size={16}/>View card
 </Link>
 <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(`Sign this card: ${window.location.origin}/sign/${liveSlug}`)}`, '_blank')}
 className="px-8 py-3 rounded-2xl font-bold text-white inline-flex items-center gap-2" style={{ background:'#25D366' }}>
 Share on WhatsApp
 </button>
 <QRButton url={`${window.location.origin}/sign/${liveSlug}`} label="Scan to sign the group card" variant="secondary" className="px-8 py-3">QR Code — Group Card</QRButton>
 <Link to={`/create-card?edit=${liveSlug}`}
 className="btn-secondary px-8 py-3 inline-flex items-center gap-2">
 Edit card
 </Link>
 <button onClick={handleReset}
 className="px-8 py-3 rounded-2xl font-bold border-2 border-red-200 text-red-500 hover:bg-red-50 inline-flex items-center gap-2 transition-colors">
 Create another card
 </button>
 </div>
 </div>
 );
 if (company) return <CompanyLayout title="Card Live ">{liveContent}</CompanyLayout>;
 if (member) return <MemberLayout title="Card Live ">{liveContent}</MemberLayout>;
 if (user) return <DashboardLayout title="Card Live ">{liveContent}</DashboardLayout>;
 return (
 <div className="min-h-screen section-dots" style={{ background:'linear-gradient(160deg,#F5F0FF,#FFF0F5)' }}>
 <Navbar/>
 {liveContent}
 </div>
 );
 }

 if (loadingDraft) {
 const loadingScreen = (
 <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
 <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin mb-4"/>
 <p className="text-warm-500 text-sm">Loading your draft…</p>
 </div>
 );
 if (company) return <CompanyLayout title="Create a Card" subtitle="Takes less than 3 minutes">{loadingScreen}</CompanyLayout>;
 if (member) return <MemberLayout title="Create a Card" subtitle="Takes less than 3 minutes">{loadingScreen}</MemberLayout>;
 if (user) return <DashboardLayout title="Create a Card" subtitle="Takes less than 3 minutes">{loadingScreen}</DashboardLayout>;
 return <div className="min-h-screen"><Navbar/>{loadingScreen}</div>;
 }

 const inner = (
 <div className={`max-w-2xl mx-auto px-4 sm:px-6 ${(user || company || member) ? 'pt-2 pb-10' : 'py-10'}`}>
 {!company && !member && !user && (
 <div className="mb-8">
 <h1 className="text-3xl font-bold text-warm-900 mb-1">Create a Thankeeu card</h1>
 <p className="text-warm-500 text-sm">Takes less than 3 minutes to set up</p>
 </div>
 )}

 <StepIndicator current={step} />

 {/* ── Step 0: Occasion ── */}
 {step === 0 && (
 <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 animate-fade-in">
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

 {/* ── Step 1: Design ── */}
 {step === 1 && (
 <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 animate-fade-in">
 <h2 className="text-xl font-bold text-warm-900 mb-1">Pick a design</h2>
 <p className="text-warm-500 text-sm mb-5">Choose from our templates</p>

 <style>{`
 /* Kept in step with the public flow (CardStart): the collapsed height and
    the column count are both derived from the GRID's own width, never the
    viewport, because this panel is a column inside the page. */
 .ccg-box { container-type: inline-size; }
 .ccg { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-bottom:20px; }
 .ccg-wrap { --cols:5; --gap:10px; position:relative; overflow:hidden;
   --tile: calc((100cqw - (var(--cols) - 1) * var(--gap)) / var(--cols));
   --row: calc(var(--tile) * 297 / 210);
   max-height: calc(2 * var(--row) + var(--gap)); }
 .ccg-wrap.expanded { max-height:none; }
 @container (max-width: 620px) { .ccg { grid-template-columns:repeat(4,1fr); } .ccg-wrap { --cols:4; } }
 @container (max-width: 430px) { .ccg { grid-template-columns:repeat(3,1fr); } .ccg-wrap { --cols:3; } }
 @container (max-width: 290px) { .ccg { grid-template-columns:repeat(2,1fr); } .ccg-wrap { --cols:2; } }
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

 <div className="ccg-box">
 <div className={`ccg-wrap ${designsExpanded ? 'expanded' : ''}`}>
 <div className="ccg">
 <button type="button" className="ccg-item ccg-upload" onClick={() => document.getElementById('cc-bg-upload')?.click()}>
 <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
 </svg>
 <p>Upload<br/>your own</p>
 <input id="cc-bg-upload" type="file" accept="image/*" className="hidden"
 onChange={async e => {
   const f=e.target.files?.[0]; if(!f) return;
   const local = URL.createObjectURL(f);
   set('background_color', local); set('design_theme','custom_upload');
   try { const fd=new FormData(); fd.append('photo',f); const res=await cardsAPI.uploadCover(fd); if(res.data?.url) set('background_color',res.data.url); }
   catch { toast.error('Could not upload your design.'); }
   finally { e.target.value=''; }
 }}/>
 </button>
 {ccAvailableDesigns.map((d, idx) => (
 <button key={d.id} type="button" className={`ccg-item ${form.design_theme===d.id?'sel':''}`} onClick={() => handleDesignSelect(d)}>
 <CardCoverPreview design={d} occasionLabel={getOccasionLabel(form.occasion)} recipientName={form.recipient_name} title={form.title} senderName={form.cover_sender || creatorName} compact/>
 {idx < 3 && <span className="ccg-badge ccg-new">New</span>}
 {idx >= 3 && idx < 7 && <span className="ccg-badge ccg-more">More</span>}
 </button>
 ))}
 </div>
 </div>
 </div>
 {ccAvailableDesigns.length > 10 && (
   <button type="button" onClick={() => setDesignsExpanded(e => !e)}
     className="w-full mt-1 mb-4 text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-primary-50 transition-colors">
     <Icon name={designsExpanded ? 'ChevronUp' : 'ChevronDown'} size={14}/>
     {designsExpanded ? 'Show fewer designs' : `Show all ${ccAvailableDesigns.length} designs`}
   </button>
 )}

 {/* Album background — same single swatch row as the public flow. Every card
     is an album flipbook now, so this belongs here too. */}
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
 className={`rounded-xl border-2 px-2 py-2.5 text-sm transition-all ${form.font_style===font.id?'border-primary-500 bg-primary-50 text-primary-700':'border-purple-100 text-warm-600'}`}
 style={{ fontFamily:font.family }}>
 {font.id === 'calligraphy' ? 'With love' : font.name}
 </button>
 ))}
 </div>

 {selectedDesign && (
 <CoverTextStudio
  design={selectedDesign}
  occasionLabel={form.occasion === 'other' && form.custom_occasion ? form.custom_occasion : getOccasionLabel(form.occasion)}
  recipientName={form.recipient_name}
  title={form.title}
  senderName={form.cover_sender || creatorName}
  coverColor={form.background_color}
  textColor={form.cover_text_color === 'auto' ? undefined : form.cover_text_color}
  fontFamily={getFontStyle(form.font_style).family}
  layout={form.cover_layout}
  onChange={(next) => set('cover_layout', next)}
  selected={selectedCoverField}
  onSelect={setSelectedCoverField}
 />
 )}

 {/* The message-board layout was retired — every group card is an album
     flipbook now, so there is no layout choice to make here. */}
 <div className="flex justify-between">
 <button onClick={() => setStep(0)} className="btn-secondary">← Back</button>
 <button onClick={() => {
 // Save form snapshot so login-redirect can restore it
 const existing = JSON.parse(localStorage.getItem('thankeeu_pending_card') || '{}');
 localStorage.setItem('thankeeu_pending_card', JSON.stringify({ ...existing, formSnapshot: form, timestamp: Date.now() }));
 setStep(2);
 }} className="btn-primary">Add details →</button>
 </div>
 </div>
 )}

 {/* ── Step 2: Details ── */}
 {step === 2 && (
 <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 animate-fade-in">
 <h2 className="text-xl font-bold text-warm-900 mb-1">Card details</h2>
 <p className="text-warm-500 text-sm mb-5">Tell us who this is for</p>

 {/* ── Sign-in banner — shown to guests who may already have an account ── */}
 {!user && !isCompanyUser && (
 <div style={{
 background: 'linear-gradient(135deg,#EDE9FE,#F5F0FF)',
 border: '1.5px solid #C4B5FD',
 borderRadius: 16,
 padding: '12px 16px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: 12,
 marginBottom: 20,
 flexWrap: 'wrap',
 }}>
 <div style={{ display:'flex', alignItems:'center', gap:10 }}>
 <span style={{ fontSize:22 }}></span>
 <div>
 <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, color:'#1A1035', margin:0, lineHeight:1.3 }}>
 Already have an account?
 </p>
 <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12, color:'#7A6CA8', margin:0 }}>
 Sign in to save this card to your dashboard — your progress won't be lost.
 </p>
 </div>
 </div>
 <Link
 to={`/login?returnTo=${encodeURIComponent('/card/new?resumed=1')}`}
 onClick={() => {
 const existing = JSON.parse(localStorage.getItem('thankeeu_pending_card') || '{}');
 localStorage.setItem('thankeeu_pending_card', JSON.stringify({
 ...existing,
 formSnapshot: form,
 msgSnapshot: msgForm,
 timestamp: Date.now(),
 }));
 }}
 style={{
 background: '#7C3AED',
 color: '#fff',
 borderRadius: 12,
 padding: '8px 18px',
 fontFamily: 'Plus Jakarta Sans,sans-serif',
 fontWeight: 700,
 fontSize: 13,
 textDecoration: 'none',
 whiteSpace: 'nowrap',
 flexShrink: 0,
 display: 'inline-flex',
 alignItems: 'center',
 gap: 6,
 }}>
 <Icon name="LogIn" size={14}/>Sign in
 </Link>
 </div>
 )}
 <div className="space-y-4 mb-6">
 <div>
 <label className="block text-sm font-semibold text-warm-700 mb-1.5">Card title</label>
 <input className="input" placeholder="e.g. Amaka's Birthday Card " value={form.title} onChange={e => set('title', e.target.value)}/>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-semibold text-warm-700 mb-1.5">Recipient's name *</label>
 <input className="input" placeholder="e.g. Amaka" value={form.recipient_name} onChange={e => set('recipient_name', e.target.value)} required/>
 </div>
 <div>
 <label className="block text-sm font-semibold text-warm-700 mb-1.5">Recipient's email</label>
 <input type="email" className="input" placeholder="amaka@email.com" value={form.recipient_email} onChange={e => set('recipient_email', e.target.value)}/>
 </div>
 </div>

 {/* ── Optional recipient photo — appears as faded hero background on card view ── */}
 <div>
 <label className="block text-sm font-semibold text-warm-700 mb-1">
 Recipient's photo <span className="text-warm-400 font-normal text-xs">(optional)</span>
 </label>
 <p className="text-xs text-warm-400 mb-2">
 Appears softly in the background of the card view page — beautiful for birthdays and special occasions.
 </p>
 <input
 ref={photoInputRef}
 type="file"
 accept="image/jpeg,image/png,image/webp"
 style={{ display: 'none' }}
 onChange={e => {
 const f = e.target.files?.[0];
 if (!f) return;
 if (f.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5 MB'); return; }
 if (recipientPhoto.preview) URL.revokeObjectURL(recipientPhoto.preview);
 setRecipientPhoto({ file: f, preview: URL.createObjectURL(f) });
 }}
 />
 {recipientPhoto.preview ? (
 <div style={{ position: 'relative', width: '100%', height: 120, borderRadius: 16, overflow: 'hidden', border: '2px solid #C4B5FD' }}>
 <img
 src={recipientPhoto.preview}
 alt="Recipient preview"
 style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.55 }}
 />
 <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(124,58,237,0.06), rgba(124,58,237,0.20))', pointerEvents: 'none' }} />
 <span style={{ position: 'absolute', bottom: 8, left: 12, fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.45)', borderRadius: 8, padding: '2px 8px' }}>
 Preview — will appear faded behind card content
 </span>
 <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
 <button
 type="button"
 onClick={() => photoInputRef.current?.click()}
 style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(124,58,237,0.75)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}
 title="Change photo">
 
 </button>
 <button
 type="button"
 onClick={() => { URL.revokeObjectURL(recipientPhoto.preview); setRecipientPhoto({ file: null, preview: null }); if (photoInputRef.current) photoInputRef.current.value = ''; }}
 style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}
 title="Remove photo">
 
 </button>
 </div>
 </div>
 ) : (
 <button
 type="button"
 onClick={() => photoInputRef.current?.click()}
 style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 16px', borderRadius: 16, border: '2px dashed #C4B5FD', background: '#F9F5FF', cursor: 'pointer', textAlign: 'left', transition: 'border-color .2s, background .2s' }}
 onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.background = '#EDE9FE'; }}
 onMouseLeave={e => { e.currentTarget.style.borderColor = '#C4B5FD'; e.currentTarget.style.background = '#F9F5FF'; }}>
 <span style={{ fontSize: 26, flexShrink: 0 }}></span>
 <div>
 <p style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 700, fontSize: 13, color: '#1A1035', margin: 0 }}>
 Upload a photo of {form.recipient_name || 'the recipient'}
 </p>
 <p style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontSize: 11, color: '#7A6CA8', margin: '3px 0 0' }}>
 JPG, PNG or WebP · max 5 MB
 </p>
 </div>
 </button>
 )}
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-semibold text-warm-700 mb-1.5">Delivery date</label>
 <input type="date" className="input" value={form.send_date} min={new Date().toISOString().split('T')[0]} onChange={e => set('send_date', e.target.value)}/>
 </div>
 <div>
 <label className="block text-sm font-semibold text-warm-700 mb-1.5">Delivery time</label>
 <input type="time" className="input" value={form.send_time||'09:00'} onChange={e => set('send_time', e.target.value)}/>
 </div>
 <div>
 <label className="block text-sm font-semibold text-warm-700 mb-1.5">Signing deadline</label>
 <input type="date" className="input" value={form.deadline} min={new Date().toISOString().split('T')[0]} onChange={e => set('deadline', e.target.value)}/>
 </div>
 <div>
 <label className="block text-sm font-semibold text-warm-700 mb-1.5">Deadline time</label>
 <input type="time" className="input" value={form.deadline_time||'23:59'} onChange={e => set('deadline_time', e.target.value)}/>
 </div>
 </div>
 {(company || member) && (
 <div>
 <label className="block text-sm font-semibold text-warm-700 mb-2">Who should sign?</label>
 <div className="grid grid-cols-2 gap-3">
 {[{value:'department',label:'My Department'},{value:'company_wide',label:'Entire Company'}].map(opt => (
 <button key={opt.value} type="button" onClick={() => set('notification_scope', opt.value)}
 className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.notification_scope===opt.value?'border-primary-500 bg-primary-50 text-primary-700':'border-purple-100 text-warm-600'}`}>
 {opt.label}
 </button>
 ))}
 </div>
 </div>
 )}
 <div className="rounded-2xl border border-purple-100 divide-y divide-gray-100">
 {[
 { key:'allow_private_messages', label:'Allow private messages', desc:'Contributors can mark messages visible only to recipient' },
 { key:'send_reminders', label:'Auto-send reminders', desc:"Nudge people who haven't signed 2 days before deadline" },
 { key:'hide_amounts', label:'Hide gift amounts', desc:"Contributors won't see how much others gave" },
 ].map(({ key, label, desc }) => (
 <div key={key} className="flex items-center justify-between p-4">
 <div><p className="text-sm font-semibold text-warm-800">{label}</p><p className="text-xs text-warm-500 mt-0.5">{desc}</p></div>
 <button onClick={() => set(key, !form[key])}
 className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${form[key]?'bg-primary-400':'bg-gray-200'}`}>
 <span className={`absolute w-5 h-5 bg-white rounded-full shadow transition-transform ${form[key]?'translate-x-5':'translate-x-0.5'}`}/>
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
 // Guest: just save to localStorage and advance — no API call yet
 // The draft is created at Step 3 when they click "Save draft & continue"
 const existing = JSON.parse(localStorage.getItem('thankeeu_pending_card') || '{}');
 localStorage.setItem('thankeeu_pending_card', JSON.stringify({
 ...existing, formSnapshot: form, msgSnapshot: msgForm, timestamp: Date.now(),
 }));
 setStep(3);
 return;
 }
 // Authenticated users: create/update draft in backend as before
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


 {/* ── Step 3: Gift & Pay — GUEST ── */}
 {step === 3 && !user && !isCompanyUser && (

 /* ── Phase 1: Configure gift pot ── */
 guestPhase === 'configure' ? (
 <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 animate-fade-in">
 <h2 className="text-xl font-bold text-warm-900 mb-1">Gift & Pay </h2>
 <p className="text-warm-500 text-sm mb-5">
 Choose whether to include a gift pot, then we'll save your card as a draft.
 </p>

 {/* Gift toggle */}
 <div className="grid grid-cols-2 gap-3 mb-4">
 {[
 {id:true, icon:'Gift', title:'Enable gift pot', desc:'Everyone chips in, recipient redeems'},
 {id:false,icon:'Mail', title:'Card only', desc:'Messages only, no gift'},
 ].map(o => (
 <button key={String(o.id)} onClick={() => set('is_gift_enabled', o.id)}
 className={`rounded-2xl p-4 text-left border-2 transition-all ${form.is_gift_enabled===o.id?'border-primary-400 bg-primary-50':'border-purple-100 hover:border-purple-200'}`}>
 {o.icon && <div className="mb-2 text-primary-500"><Icon name={o.icon} size={22}/></div>}
 <div className="text-sm font-bold text-warm-800">{o.title}</div>
 <div className="text-xs text-warm-500 mt-0.5">{o.desc}</div>
 </button>
 ))}
 </div>

 {/* Suggested contribution amounts */}
 {form.is_gift_enabled && (
 <div className="mb-5">
 <p className="text-sm font-semibold text-warm-700 mb-2">Suggested contribution per person</p>
 <div className="flex flex-wrap gap-2">
 {[2500,5000,10000,25000,50000].map(amt => (
 <button key={amt} onClick={() => set('suggested_amount', amt)}
 className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${form.suggested_amount===amt?'bg-primary-400 text-white border-primary-400':'border-purple-100 text-warm-700 hover:border-primary-300'}`}>
 {formatNGN(amt)}
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Full card summary */}
 {/* Invite emails */}
 <div className="mb-5">
 <label className="block text-sm font-bold text-warm-700 mb-1.5">Invite people to sign <span className="text-warm-400 font-normal text-xs">(optional)</span></label>
 <textarea className="input h-20 resize-none" placeholder="kemi@email.com, emeka@email.com"
 value={inviteEmails} onChange={e => setInviteEmails(e.target.value)}/>
 <p className="text-xs text-warm-400 mt-1">Optional — you can also just share the link once the card is live.</p>
 </div>

 <div className="rounded-2xl bg-warm-100 border border-purple-100 divide-y divide-gray-100 mb-5">
 {[
 ['Occasion', form.occasion === 'other' && form.custom_occasion ? form.custom_occasion : (OCCASIONS.find(o=>o.id===form.occasion)?.label || form.occasion)],
 ['Design', form.design_theme?.replace(/_/g,' ')],
 ['Card title', form.title || '—'],
 ['Recipient', form.recipient_name || '—'],
 ['Recipient email', form.recipient_email || 'Not set'],
 ['Delivery date', form.send_date ? `${form.send_date} at ${form.send_time||'09:00'}` : 'Not set'],
 ['Signing deadline', form.deadline ? `${form.deadline} at ${form.deadline_time||'23:59'}` : 'Not set'],
 ['Gift pot', form.is_gift_enabled ? `Yes — ${formatNGN(form.suggested_amount||2500)} suggested` : 'No'],
 ['Card fee', `${formatCurrency(5000,'NGN')} one-time`],
 ].map(([k,v]) => (
 <div key={k} className="flex justify-between items-start px-4 py-2.5 gap-2">
 <span className="text-sm text-warm-500 shrink-0">{k}</span>
 <span className="text-sm font-semibold text-warm-800 text-right min-w-0 flex-1 break-words">{v}</span>
 </div>
 ))}
 </div>

 {/* Actions */}
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
 // Convert local time to UTC — same as authenticated path — so the
 // cron fires at the user's intended local time, not 1 hour off.
 const { send_date: utcSendDate, send_time: utcSendTime } = toUTCSendTime(safeForm.send_date, safeForm.send_time);
 const cardData = {
 ...safeForm,
 title: safeForm.title.trim() || `${safeForm.recipient_name}'s Card`,
 send_date: utcSendDate,
 send_time: utcSendTime,
 };
 const existing = JSON.parse(localStorage.getItem('thankeeu_pending_card') || '{}');
 let slug = draftSlug || existing.slug;
 let editToken = existing.draft_edit_token;
 if (slug && editToken) {
 // Update existing anonymous draft with latest form data
 await cardsAPI.updateDraft(slug, cardData, editToken);
 } else {
 // First time: create an anonymous draft
 const res = await cardsAPI.createDraft(cardData);
 slug = res.data.slug;
 editToken = res.data.draft_edit_token;
 setDraftSlug(slug);
 }
 localStorage.setItem('thankeeu_pending_card', JSON.stringify({
 slug,
 draft_edit_token: editToken,
 formSnapshot: form,
 msgSnapshot: msgForm,
 resumeStep: 3,
 timestamp: Date.now(),
 }));
 // Upload recipient photo if one was chosen (non-fatal)
 if (recipientPhoto.file) {
 try {
 const fd = new FormData();
 fd.append('photo', recipientPhoto.file);
 await cardsAPI.uploadRecipientPhoto(slug, fd, editToken);
 } catch (photoErr) {
 console.warn('[recipient-photo] upload failed:', photoErr?.message);
 }
 }
 setGuestPhase('auth');
 } catch (err) {
 const existing = JSON.parse(localStorage.getItem('thankeeu_pending_card') || '{}');
 localStorage.setItem('thankeeu_pending_card', JSON.stringify({
 ...existing, localOnly: true, formSnapshot: form, msgSnapshot: msgForm,
 resumeStep: 3, timestamp: Date.now(),
 }));
 setGuestPhase('auth');
 toast.success('Draft saved on this device. Sign in to sync it to your account.');
 } finally {
 setLoading(false);
 }
 }}
 disabled={loading}
 className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
 {loading
 ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving your draft…</>
 : 'Save draft & continue →'}
 </button>
 </div>

 <p className="text-xs text-center text-warm-400 mt-3">
 Your card is saved as a draft. You'll need to sign in to pay and make it live.
 </p>

 <div className="border-t border-purple-100 mt-4 pt-4 flex gap-2">
 <button
 onClick={() => { setGuestPhase('configure'); setStep(0); }}
 className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border-2 border-purple-200 text-warm-700 text-xs font-semibold hover:bg-purple-50 transition-colors">
 Edit from start
 </button>
 <button
 onClick={handleReset}
 className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border-2 border-red-100 text-red-500 text-xs font-semibold hover:bg-red-50 transition-colors">
 Start over
 </button>
 </div>
 </div>

 /* ── Phase 2: Draft saved — auth wall ── */
 ) : (
 <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 animate-fade-in">

 {/* Header */}
 <div className="text-center mb-6">
 <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4"
 style={{ background:'linear-gradient(135deg,#EDE9FE,#F5F0FF)' }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></div>
 <h2 className="text-2xl font-bold text-warm-900 mb-2">Card saved as draft!</h2>
 <p className="text-warm-500 text-sm leading-relaxed max-w-sm mx-auto">
 Sign in or create a free account to pay the one-time card fee, make it live, and get your sharing link.
 </p>
 </div>

 {/* Full draft summary */}
 <div className="rounded-2xl bg-warm-100 border border-purple-100 divide-y divide-gray-100 mb-5">
 {[
 ['Occasion', form.occasion === 'other' && form.custom_occasion ? form.custom_occasion : (OCCASIONS.find(o=>o.id===form.occasion)?.label || form.occasion)],
 ['Design', form.design_theme?.replace(/_/g,' ')],
 ['Card title', form.title || '—'],
 ['Recipient', form.recipient_name || '—'],
 ['Recipient email', form.recipient_email || 'Not set'],
 ['Delivery date', form.send_date ? `${form.send_date} at ${form.send_time||'09:00'}` : 'Not set'],
 ['Signing deadline', form.deadline ? `${form.deadline} at ${form.deadline_time||'23:59'}` : 'Not set'],
 ['Gift pot', form.is_gift_enabled ? `Yes — ${formatNGN(form.suggested_amount||2500)} suggested` : 'No'],
 ['Card fee', `${formatCurrency(5000,'NGN')} one-time`],
 ['Status', 'Draft — sign in to pay & launch'],
 ].map(([k,v]) => (
 <div key={k} className="flex justify-between items-start px-4 py-2.5 gap-2">
 <span className="text-sm text-warm-500 shrink-0">{k}</span>
 <span className="text-sm font-semibold text-warm-800 text-right min-w-0 flex-1 break-words">{v}</span>
 </div>
 ))}
 </div>

 {/* Primary CTAs */}
 <div className="flex flex-col gap-3 mb-4">
 <Link
 to={`/login?returnTo=${encodeURIComponent('/card/new?resumed=1')}`}
 onClick={() => {
 const existing = JSON.parse(localStorage.getItem('thankeeu_pending_card') || '{}');
 localStorage.setItem('thankeeu_pending_card', JSON.stringify({
 ...existing, formSnapshot: form, msgSnapshot: msgForm,
 resumeStep: 3, timestamp: Date.now(),
 }));
 }}
 className="btn-primary w-full py-3.5 text-base font-bold text-center block">
 Sign in & complete payment
 </Link>
 <Link
 to={`/signup?returnTo=${encodeURIComponent('/card/new?resumed=1')}`}
 onClick={() => {
 const existing = JSON.parse(localStorage.getItem('thankeeu_pending_card') || '{}');
 localStorage.setItem('thankeeu_pending_card', JSON.stringify({
 ...existing, formSnapshot: form, msgSnapshot: msgForm,
 resumeStep: 3, timestamp: Date.now(),
 }));
 }}
 className="btn-secondary w-full py-3.5 text-base font-bold text-center block">
 Create free account & continue
 </Link>
 </div>

 <p className="text-center text-xs text-warm-400 mb-5">
 Draft is saved. After signing in you'll land straight on the payment step — no re-entry needed.
 </p>

 {/* Edit or Reset */}
 <div className="border-t border-purple-100 pt-4 flex flex-col sm:flex-row gap-2">
 <button
 onClick={() => { setGuestPhase('configure'); setStep(0); }}
 className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-purple-200 text-warm-700 text-sm font-semibold hover:bg-purple-50 transition-colors">
 Edit card
 </button>
 <button
 onClick={handleReset}
 className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-red-100 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors">
 Start over
 </button>
 </div>

 <p className="text-center text-xs text-warm-400 mt-3">
 "Edit card" takes you back to step 1 to change anything. "Start over" wipes everything.
 </p>
 </div>
 )
 )}

 {step === 3 && (user || isCompanyUser) && (
 <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 animate-fade-in">
 <h2 className="text-xl font-bold text-warm-900 mb-1">{isActiveEdit ? 'Save your changes' : 'Gift & activate'}</h2>
 <p className="text-warm-500 text-sm mb-5">{isActiveEdit ? 'Your card is already live — updates apply immediately' : 'Enable a gift collection and launch your card'}</p>

 {/* Gift toggle */}
 <div className="grid grid-cols-2 gap-3 mb-4">
 {[{id:true,icon:'Gift',title:'Enable gift pot',desc:'Everyone chips in, recipient redeems'},{id:false,icon:'Mail',title:'Card only',desc:'Messages only, no gift'}].map(o => (
 <button key={String(o.id)} onClick={() => set('is_gift_enabled', o.id)}
 className={`rounded-2xl p-4 text-left border-2 transition-all ${form.is_gift_enabled===o.id?'border-primary-400 bg-primary-50':'border-purple-100 hover:border-purple-200'}`}>
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
 {[2500,5000,10000,25000,50000].map(amt => (
 <button key={amt} onClick={() => set('suggested_amount', amt)}
 className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${form.suggested_amount===amt?'bg-primary-400 text-white border-primary-400':'border-purple-100 text-warm-700 hover:border-primary-300'}`}>
 {formatNGN(amt)}
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Summary */}
 {/* Invite emails */}
 <div className="mb-5">
 <label className="block text-sm font-bold text-warm-700 mb-1.5">Invite people to sign <span className="text-warm-400 font-normal text-xs">(optional)</span></label>
 <textarea className="input h-20 resize-none" placeholder="kemi@email.com, emeka@email.com"
 value={inviteEmails} onChange={e => setInviteEmails(e.target.value)}/>
 <p className="text-xs text-warm-400 mt-1">Optional — you can also just share the link once the card is live.</p>
 </div>

 <div className="rounded-2xl bg-warm-100 border border-purple-100 divide-y divide-gray-100 mb-5">
 {[
 ['Occasion', form.occasion === 'other' && form.custom_occasion ? form.custom_occasion : (OCCASIONS.find(o=>o.id===form.occasion)?.label||form.occasion)],
 ['Recipient', form.recipient_name],
 ['Gift', form.is_gift_enabled?`Yes — ${formatNGN(form.suggested_amount)} suggested`:'No'],
 ...(isCompanyUser?[['Card fee','Free (company)']]:
 payMode==='credit'&&creditBalance>0?[['Card fee',`1 credit (${creditBalance} remaining)`]]:
 [['Card fee',`${formatCurrency(5000,selectedCurrency)} one-time`]]),
 ].map(([k,v]) => (
 <div key={k} className="flex justify-between items-start px-4 py-3 gap-2">
 <span className="text-sm text-warm-500 shrink-0">{k}</span>
 <span className="text-sm font-semibold text-warm-900 text-right min-w-0 flex-1 break-words">{v}</span>
 </div>
 ))}
 </div>

 {/* Payment mode for individuals */}
 {!isCompanyUser && (
 <div className="mb-4">
 {creditBalance > 0 && (
 <div className="grid grid-cols-2 gap-2 mb-3">
 <button type="button" onClick={() => setPayMode('credit')}
 className={`p-3 rounded-xl border-2 text-left text-xs transition-all ${payMode==='credit'?'border-primary-400 bg-primary-50':'border-purple-100'}`}>
 <p className="font-bold text-warm-900">Use credit</p>
 <p className="text-primary-600 font-semibold">{creditBalance} left</p>
 <p className="text-green-600 font-bold">Instant</p>
 </button>
 <button type="button" onClick={() => setPayMode('direct')}
 className={`p-3 rounded-xl border-2 text-left text-xs transition-all ${payMode==='direct'?'border-primary-400 bg-primary-50':'border-purple-100'}`}>
 <p className="font-bold text-warm-900">Pay now</p>
 <p className="text-warm-500">Visa / Mastercard / Bank</p>
 </button>
 </div>
 )}
 {payMode==='direct' && (
 <div className="mb-3">
 <p className="text-xs font-semibold text-warm-500 mb-1.5">Pay in:</p>
 <div className="flex flex-wrap gap-1.5">
 {CURRENCIES.map(c => (
 <button key={c.code} type="button" onClick={() => setSelectedCurrency(c.code)}
 className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${selectedCurrency===c.code?'bg-primary-500 text-white':'bg-primary-50 text-primary-600 border border-primary-200'}`}>
 {c.flag} {c.code}
 </button>
 ))}
 </div>
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
 {paymentStage==='sending'?'Saving…':paymentStage==='verifying'?'Using credit…':paymentStage==='redirecting'?'Opening payment…':'Creating card…'}
 </span>
 : isActiveEdit ? 'Save changes'
 : isCompanyUser ? 'Create Card (Free)'
 : payMode==='credit' ? 'Use 1 Credit & Launch'
 : `Pay ${formatCurrency(5000, selectedCurrency)} & Launch Card`}
 </button>
 </div>
 <p className="text-xs text-center text-warm-400 mt-3">
 {isActiveEdit ? 'Changes apply to your live card immediately' : isCompanyUser ? 'Company account · Card creation is free' : 'Secured by Flutterwave · Card link will be ready immediately'}
 </p>
 </div>
 )}
 </div>
 );

 if (company) return <CompanyLayout title="Create a Card" subtitle="Takes less than 3 minutes">{inner}</CompanyLayout>;
 if (member) return <MemberLayout title="Create a Card" subtitle="Takes less than 3 minutes">{inner}</MemberLayout>;
 if (user) return <DashboardLayout title="Create a Card" subtitle="Takes less than 3 minutes">{inner}</DashboardLayout>;
 return <div className="min-h-screen"><Navbar/>{inner}</div>;
};

export default CreateCard;
