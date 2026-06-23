import { useSEO } from '../hooks/useSEO';
import AlbumSign from './AlbumSign';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import { cardsAPI, messagesAPI, paymentsAPI, dashboardAPI, authAPI, visitorsAPI, vendorAPI } from '../utils/api';
import { FONT_STYLES, cardArtClass, getCardDesign, getFontStyle } from '../utils/cardDesigns';
import VoiceRecorder from '../components/VoiceRecorder';
import EmojiPicker from '../components/EmojiPicker';
import GifPicker from '../components/GifPicker';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { openFlwCheckout } from '../utils/flwInline';
import { formatNGN, CURRENCIES, formatCurrency, getFLWPaymentParams } from '../utils/currency';

const AMOUNTS_NGN = [2500, 5000, 10000, 20000, 50000, 100000];

const SignCard = () => {
  const { slug }       = useParams();
  const { user, loginWithToken } = useAuth();
  const { member }     = useMemberAuth();
  const { company }    = useCompanyAuth();
  // isSignedIn: normal user, team member/leader, or HR company
  const isSignedIn     = !!(user || member || company);
  const [searchParams] = useSearchParams();

  const [card,        setCard]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  // 'idle' | 'sending' | 'paying' | 'verifying' | 'done'
  const [stage,       setStage]       = useState('idle');
  const [giftCurrency,setGiftCurrency] = useState('NGN');
  const [submitted,   setSubmitted]   = useState(false);
  // track whether the signee created an account during this signing flow
  const [, setCreatedAccount] = useState(false);
  const [accountJustCreated, setAccountJustCreated] = useState(false);
  const [showCreateAccountPrompt, setShowCreateAccountPrompt] = useState(false);

  // Media files (up to 5, carousel)
  const [mediaFiles,   setMediaFiles]   = useState([]);
  const [carouselIdx,  setCarouselIdx]  = useState(0);
  const fileRef = useRef();
  const textareaRef = useRef();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker,   setShowGifPicker]   = useState(false);

  const [selectedAmount, setSelectedAmount] = useState(null);
  const [giftMode, setGiftMode] = useState('money'); // 'money' | 'product'
  const [showVendorPicker, setShowVendorPicker] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [vendorFilter, setVendorFilter] = useState({ country: '', category: '' });
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productImgIdx, setProductImgIdx] = useState(0);
  const [customAmount,   setCustomAmount]   = useState('');

  // Auto-fill name and email from whoever is signed in
  const signedInName  = user?.full_name ||
    (member ? `${member.first_name} ${member.last_name}`.trim() : null) ||
    company?.contact_person || company?.name || '';
  const signedInEmail = user?.email || member?.email || company?.email || '';

  const [form, setForm] = useState({
    author_name:  signedInName,
    author_email: signedInEmail,
    content:      '',
    is_private:   false,
    font_style:   'handwritten',
  });

  // 'guest' | 'signup' — radio selection shown after gift box
  const [submitMode, setSubmitMode] = useState('guest');

  // Sign-up form fields
  const [signupForm, setSignupForm] = useState({
    full_name: '', username: '', email: '', password: '', confirm_password: '', date_of_birth: '',
  });

  useSEO({
    title: card ? `Sign ${card.recipient_name}'s card on Thankeeu` : 'Sign a Card — Thankeeu',
    description: card ? `Add a beautiful message and gift for ${card.recipient_name}.` : 'Sign a group card on Thankeeu.',
  });

  useEffect(() => {
    const run = async () => {
      // FLW redirects browser back here with ?tx_ref=...&status=... after payment
      const shareMode = searchParams.get('mode') || readShareMode();
      const isSharePage = searchParams.get('share') === '1';
      const productTxRef = searchParams.get('product_tx_ref');
      const returnTxRef = searchParams.get('tx_ref') || searchParams.get('reference');
      const returnStatus = (searchParams.get('status') || '').toLowerCase();

      if (isSharePage) {
        applyShareMode(shareMode);
        await fetchCard();
        setSubmitted(true);
        setStage('idle');
        clearShareMode();
        return;
      }

      if (productTxRef) {
        if (returnStatus === 'cancelled' || returnStatus === 'canceled') {
          window.history.replaceState({}, '', `/sign/${slug}`);
          toast.error('Payment was cancelled. Your message is still here — you can try again or choose a different option.');
          await fetchCard();
          setStage('idle');
          return;
        }

        setStage('verifying');
        try {
          await vendorAPI.verifyOrder(productTxRef);
          window.history.replaceState({}, '', `/sign/${slug}?share=1&mode=${shareMode}`);
          toast.success('Your gift order is confirmed! 🎉');
          applyShareMode(shareMode);
          await fetchCard();
          setSubmitted(true);
          setStage('idle');
          clearShareMode();
        } catch (e) {
          const msg = e?.response?.data?.error || e?.message || '';
          if (msg.toLowerCase().includes('not completed') || msg.toLowerCase().includes('cancelled')) {
            window.history.replaceState({}, '', `/sign/${slug}`);
            toast.error('Payment was not completed. Your message is still here — please try again.');
            await fetchCard();
            setStage('idle');
          } else {
            window.history.replaceState({}, '', `/sign/${slug}?share=1&mode=${shareMode}`);
            console.error('verifyVendorOrder server error:', msg);
            toast.success('Gift order received! 🎉');
            applyShareMode(shareMode);
            await fetchCard();
            setSubmitted(true);
            setStage('idle');
            clearShareMode();
          }
        }
        return;
      }

      // tx_ref in URL is no longer used for contributions — payments now go through
      // FLW Inline JS (no redirect). This block is kept as a safety fallback only.
      if (returnTxRef) {
        window.history.replaceState({}, '', `/sign/${slug}`);
        await fetchCard();
        setStage('idle');
        return;
      }
      await fetchCard();
    };
    run();
  }, [slug]);

  const fetchCard = async () => {
    try {
      const res = await cardsAPI.getPublic(slug);
      setCard(res.data);
      setSelectedAmount(res.data.suggested_amount || 2500);
      dashboardAPI.trackCardOpened(slug).catch(() => {});
    } catch {
      toast.error('Card not found or no longer active');
    } finally {
      setLoading(false);
    }
  };

  const shareStateKey = () => `thankeeu_sign_share_${slug}`;
  const accountCreatedKey = () => `thankeeu_sign_account_created_${slug}`;
  const currentShareMode = () => (!isSignedIn && submitMode === 'guest' ? 'guest' : 'account');
  const readShareMode = () => {
    try { return JSON.parse(localStorage.getItem(shareStateKey()) || '{}').mode || 'guest'; }
    catch { return 'guest'; }
  };
  const rememberShareMode = (mode) => {
    try { localStorage.setItem(shareStateKey(), JSON.stringify({ mode, ts: Date.now() })); }
    catch {}
  };
  const clearShareMode = () => {
    try {
      localStorage.removeItem(shareStateKey());
      localStorage.removeItem(accountCreatedKey());
    } catch {}
  };
  const applyShareMode = (mode) => {
    setShowCreateAccountPrompt(!isSignedIn && mode === 'guest');
    setCreatedAccount(mode !== 'guest');
    try {
      if (localStorage.getItem(accountCreatedKey()) === '1') setAccountJustCreated(true);
    } catch {}
  };
  const goToSharePage = (mode) => {
    rememberShareMode(mode);
    window.location.assign(`/sign/${slug}?share=1&mode=${mode}`);
  };



  const validateSignupFields = () => {
    const { full_name, username, email, password, confirm_password } = signupForm;
    const resolvedName  = full_name  || form.author_name;
    const resolvedEmail = email      || form.author_email;
    if (!resolvedName.trim())       { toast.error('Please enter your full name'); return false; }
    if (!username.trim())           { toast.error('Please choose a username'); return false; }
    if (username.trim().length < 3) { toast.error('Username must be at least 3 characters'); return false; }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) { toast.error('Username can only contain letters, numbers and underscores'); return false; }
    if (!resolvedEmail.trim())      { toast.error('Please enter your email'); return false; }
    if (!password)                  { toast.error('Please choose a password'); return false; }
    if (password.length < 8)        { toast.error('Password must be at least 8 characters'); return false; }
    if (password !== confirm_password) { toast.error('Passwords do not match'); return false; }
    return true;
  };

  const createSignerAccount = async () => {
    const resolvedName  = signupForm.full_name  || form.author_name;
    const resolvedEmail = signupForm.email      || form.author_email;
    const res = await authAPI.signup({
      full_name:     resolvedName,
      username:      signupForm.username.trim().toLowerCase(),
      email:         resolvedEmail,
      password:      signupForm.password,
      date_of_birth: signupForm.date_of_birth || null,
    });
    // Log the signer into THIS browser immediately — backend already returns
    // a valid session token + verified-pending user record at signup time.
    if (res?.data?.token && res?.data?.user) {
      loginWithToken(res.data.token, res.data.user);
    }
    setCreatedAccount(true);
    setAccountJustCreated(true);
    // Survive the full-page redirect to Flutterwave and back
    try { localStorage.setItem(accountCreatedKey(), '1'); } catch {}
    toast.success('Account created! Check your email to verify.');
  };

  // Insert an emoji at the current cursor position in the message textarea
  // (falls back to appending at the end if the textarea ref isn't available).
  const insertEmoji = useCallback((emoji) => {
    const el = textareaRef.current;
    if (el && typeof el.selectionStart === 'number') {
      const start = el.selectionStart;
      const end   = el.selectionEnd;
      setForm(p => {
        const next = p.content.slice(0, start) + emoji + p.content.slice(end);
        return { ...p, content: next };
      });
      // Restore focus + move cursor after the inserted emoji
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + emoji.length;
        el.setSelectionRange(pos, pos);
      });
    } else {
      setForm(p => ({ ...p, content: p.content + emoji }));
    }
  }, []);

  const addMediaFiles = useCallback((files) => {
    const items = [];
    for (const f of Array.from(files)) {
      if (f.size > 50 * 1024 * 1024) { toast.error(`${f.name} too large (max 50 MB)`); continue; }
      const mime = f.type;
      const type = mime.startsWith('video/') ? 'video'
                 : mime.startsWith('audio/') ? 'voice'
                 : mime === 'image/gif'       ? 'gif'
                 : 'image';
      items.push({ file: f, preview: URL.createObjectURL(f), type, name: f.name });
    }
    setMediaFiles(prev => [...prev, ...items].slice(0, 5));
  }, []);

  const removeMedia = useCallback((idx) => {
    setMediaFiles(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      setCarouselIdx(i => Math.min(i, Math.max(0, next.length - 1)));
      return next;
    });
  }, []);

  // No ref or verify needed — payment uses redirect flow (no inline popup)

  const handleSubmit = async () => {
    if (!form.author_name.trim()) return toast.error('Please add your name');
    if (!form.content.trim())     return toast.error('Please write a message');

    const amountNGN = Number(customAmount || selectedAmount || 0);
    const wantsGift = card.is_gift_enabled && amountNGN >= 2500;

    // Email always required — needed for gift payments and to send them a copy of their message
    if (!form.author_email.trim())
      return toast.error('Please enter your email address');

    // Validate signup fields if chosen
    if (!isSignedIn && submitMode === 'signup') {
      if (!validateSignupFields()) return;
    }

    setSubmitting(true);
    setStage('sending');

    try {
      // ── STEP 1: Upload message (no gift yet, message saved to DB) ──────────
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      mediaFiles.forEach((m, i) => fd.append(i === 0 ? 'media' : `media_gallery_${i}`, m.file));
      if (!isSignedIn && submitMode === 'guest') fd.append('is_guest', 'true');

      const msgRes = await messagesAPI.add(slug, fd);
      const messageId = msgRes.data?.id;

      // ── STEP 2: Create account if chosen (non-blocking on failure) ─────────
      if (!isSignedIn && submitMode === 'signup') {
        try {
          await createSignerAccount();
        } catch (err) {
          toast(err.response?.data?.error || 'Could not create account — your message was still saved!');
        }
      }

      // ── STEP 3: Payment (only if gift selected) ────────────────────────────
      const shareMode = currentShareMode();
      // Track guest visitor for nudge emails — regardless of gift contribution
      if (!isSignedIn && submitMode === 'guest' && form.author_email) {
        visitorsAPI.track({
          email:     form.author_email,
          full_name: form.author_name,
          card_slug: slug,
        }).catch(() => {});
      }

      if (!wantsGift) {
        setSubmitting(false);
        setStage('idle');
        goToSharePage(shareMode);
        return;
      }

      // ── STEP 3: Get inline checkout config from backend ──────────────
      setStage('paying');
      const { amount: flwAmount, currency: flwCurrency } = getFLWPaymentParams(amountNGN, giftCurrency);
      const payRes = await paymentsAPI.initContribution({
        card_slug:         slug,
        contributor_name:  form.author_name,
        contributor_email: form.author_email,
        amount:            amountNGN,
        display_currency:  giftCurrency,
        flw_amount:        flwAmount,
        flw_currency:      flwCurrency,
        message_id:        messageId,
      });
      const { tx_ref, flw_config } = payRes.data;
      if (!tx_ref || !flw_config) throw new Error('Invalid payment config from server');

      // ── STEP 4: Open FLW inline checkout (no redirect, no expiring link) ──
      setStage('redirecting');
      rememberShareMode(shareMode);
      setSubmitting(false); // re-enable UI while modal is open

      await new Promise((resolve) => {
        openFlwCheckout({
          flwConfig: flw_config,
          // Modal is auto-closed by modal.close() before onSuccess is called.
          // So by the time this runs the modal is gone and the page is visible.
          onSuccess: async (returnedTxRef) => {
            setStage('verifying');
            try {
              await paymentsAPI.verifyContribution(returnedTxRef || tx_ref);
              const sm = currentShareMode();
              window.history.replaceState({}, '', `/sign/${slug}?share=1&mode=${sm}`);
              toast.success('Your message and gift are on the card! 🎉');
              applyShareMode(sm);
              await fetchCard();
              setSubmitted(true);
              setStage('idle');
              clearShareMode();
            } catch (e) {
              const status = e?.response?.status;
              const msg = e?.response?.data?.error || e?.message || '';
              if (status === 400 || msg.toLowerCase().includes('not completed')) {
                toast.error('Payment was not completed. Please try again.');
                setStage('idle');
              } else {
                const sm = currentShareMode();
                window.history.replaceState({}, '', `/sign/${slug}?share=1&mode=${sm}`);
                toast.success('Gift received! 🎉');
                applyShareMode(sm);
                await fetchCard();
                setSubmitted(true);
                setStage('idle');
                clearShareMode();
              }
            }
            resolve();
          },
          onClose: () => {
            // User cancelled — modal closed without payment
            toast('Payment cancelled. Your message is still on the card!', { icon: 'ℹ️' });
            setStage('idle');
            resolve();
          },
        });
      });

    } catch (err) {
      console.error('[SignCard handleSubmit]', err?.response?.status, err?.response?.data, err?.message);
      const serverMsg = err?.response?.data?.error;
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
      const isNetwork = !err?.response;
      const displayMsg = serverMsg
        || (isTimeout ? 'Request timed out — please check your connection and try again.' : null)
        || (isNetwork ? 'Could not reach the server — please check your connection.' : null)
        || 'Could not sign card. Please try again.';
      toast.error(displayMsg);
      setSubmitting(false);
      setStage('idle');
    }
  };

  // ── Loading / not-found states ─────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen grid place-items-center section-dots" style={{ background:'#F5F3FF' }}>
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-warm-500 text-lg">Opening the celebration...</p>
      </div>
    </div>
  );

  if (!card) return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">💌</div>
        <h2 className="text-2xl font-bold text-warm-900 mb-3">Card not found</h2>
        <p className="text-warm-500">This card may have expired or the link is incorrect.</p>
      </div>
    </div>
  );

  // Branch to album layout
  if (card.card_layout === 'album') {
    return <AlbumSign card={card} slug={slug} />;
  }

  const design   = getCardDesign(card.design_theme);
  const cardFont = getFontStyle(card.font_style);
  const msgFont  = getFontStyle(form.font_style);
  const deadline = card.deadline ? new Date(card.deadline) : null;
  const hoursLeft = deadline ? Math.max(0, Math.round((deadline - new Date()) / 3600000)) : null;

  // ── Success / congrats screen ──────────────────────────────────────────────
  if (submitted) return (
    <div className="min-h-screen flex flex-col" style={{ background: design.background }}>
      <Navbar />
      <main className="flex-1 grid place-items-center px-4 py-12">
        <div className={`card-art ${cardArtClass(design)} celebration-shell glass-panel max-w-lg w-full rounded-[2.25rem] p-8 text-center`}>
          <div className="w-20 h-20 bg-emerald-100 rounded-full grid place-items-center text-4xl mx-auto mb-5 animate-pop">✓</div>
          <p className="text-xs font-extrabold tracking-[.2em] uppercase mb-2" style={{ color: design.accent }}>Message delivered!</p>
          <h2 className="text-3xl font-bold text-warm-900 mb-3">You are on {card.recipient_name}'s card! 🎉</h2>
          <p className="text-warm-600 mb-7">Your heartfelt note is now part of their special celebration.</p>

          {/* Only show "create account" promo if they signed as guest. */}
          {showCreateAccountPrompt && (
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-primary-700 mb-2">💡 Create a free account to:</p>
              <ul className="text-xs text-primary-600 space-y-1">
                <li>✓ Keep all your signed cards in one place</li>
                <li>✓ Receive group cards on your birthday</li>
                <li>✓ Create cards for others easily</li>
              </ul>
              <Link to="/signup" className="mt-3 block w-full text-center py-2.5 rounded-xl text-sm font-bold bg-primary-600 text-white">
                Create free account →
              </Link>
            </div>
          )}

          {/* Shown when the signer chose "Create account & sign card" */}
          {accountJustCreated && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-emerald-700 mb-1">🎉 Your Thankeeu account is ready!</p>
              <p className="text-xs text-emerald-600 mb-3">
                We've sent a welcome email and a verification link to <strong>{form.author_email || signupForm.email}</strong>.
                Click the link to verify — you're already signed in on this device.
              </p>
              <Link to="/dashboard" className="block w-full text-center py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white">
                Go to my dashboard →
              </Link>
            </div>
          )}

          <button
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Sign ${card.recipient_name}'s special card: ${window.location.origin}/sign/${slug}`)}`, '_blank')}
            className="w-full py-4 rounded-2xl font-bold text-white" style={{ background:'#25D366' }}>
            📣 Invite others on WhatsApp
          </button>
        </div>
      </main>
    </div>
  );

  const amountNGN = Number(customAmount || selectedAmount || 0);
  const wantsGift = card.is_gift_enabled && amountNGN >= 2500;

  // Load approved vendors for product gifting
  const loadVendors = async (country = '', category = '') => {
    try {
      const base = import.meta.env.VITE_API_URL || '/api';
      const params = new URLSearchParams();
      if (country)  params.set('country', country);
      if (category) params.set('category', category);
      const res = await fetch(`${base}/vendor/public?${params}`);
      const d   = await res.json();
      setVendors(d || []);
    } catch { toast.error('Could not load gift vendors'); }
  };

  const handleProductGift = async () => {
    if (!selectedProduct) return toast.error('Please select a product');
    if (!selectedVendor) return toast.error('Please select a vendor');
    if (!form.author_name.trim()) return toast.error('Please enter your name');
    if (!form.author_email.trim()) return toast.error('Email is needed so the vendor can contact you');
    if (!form.content.trim()) return toast.error('Please write a message');
    if (!isSignedIn && submitMode === 'signup' && !validateSignupFields()) return;

    const messageContent = form.content.trim();
    const shareMode = currentShareMode();

    setProductSubmitting(true);
    try {
      // 1. Post the card message first
      const fd = new FormData();
      fd.append('author_name', form.author_name.trim());
      fd.append('author_email', form.author_email.trim());
      fd.append('content', messageContent);
      fd.append('is_private', form.is_private);
      fd.append('font_style', form.font_style);
      fd.append('gift_type', 'product');
      fd.append('product_vendor_id', selectedVendor.id);
      fd.append('product_vendor_name', selectedVendor.business_name);
      fd.append('product_id', selectedProduct.id);
      fd.append('product_name', selectedProduct.name);
      fd.append('product_price', selectedProduct.price);
      if (!isSignedIn && submitMode === 'guest') fd.append('is_guest', 'true');
      mediaFiles.forEach((mf, i) => fd.append(i === 0 ? 'media' : `media_gallery_${i}`, mf.file));
      await messagesAPI.sign(slug, fd);

      if (!isSignedIn && submitMode === 'signup') {
        try {
          await createSignerAccount();
        } catch (err) {
          toast(err.response?.data?.error || 'Could not create account — your message was still saved!');
        }
      }

      // 2. Place order + initiate Flutterwave payment
      const orderRes = await vendorAPI.checkout(selectedVendor.slug, {
        items: [{ product_id: selectedProduct.id, quantity: 1 }],
        customer_name:  form.author_name.trim(),
        customer_email: form.author_email.trim(),
        card_slug:      slug,
      });
      const { payment_link } = orderRes.data;

      if (payment_link) {
        toast.success('Redirecting to pay for your gift...');
        rememberShareMode(shareMode);
        window.location.href = payment_link;
      } else {
        toast.success('Gift order placed! The vendor will contact you to arrange delivery.');
        goToSharePage(shareMode);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send product gift');
    } finally { setProductSubmitting(false); }
  };

  const stageLabel = {
    sending:     'Saving your message...',
    paying:      'Preparing payment...',
    redirecting: 'Redirecting to payment...',
    verifying:   'Confirming payment...',
  }[stage];

  // ── Main signing form ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: design.soft || "#F5F0FF", overflowX: 'hidden' }}>
      <Navbar />
      <main className="flex-1">

        {/* Delivered-but-still-open banner */}
        {card.status === 'sent' && (
          <div style={{ background:'linear-gradient(135deg,#EDE9FE,#F5F0FF)', borderBottom:'1.5px solid #C4B5FD', padding:'12px 20px', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:20 }}>🎁</span>
            <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, color:'#5B21B6', margin:0 }}>
              This card was already delivered to {card.recipient_name} — but you can still add your message and contribute a gift!
            </p>
          </div>
        )}

        {/* Hero banner */}
        <section className={`card-art ${cardArtClass(design)} px-4 py-10 sm:py-14`} style={{ background: design.background, color: design.ink }}>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            {hoursLeft !== null && hoursLeft < 48 && card.status !== 'sent' && (
              <span className="inline-flex bg-white/80 text-amber-800 rounded-full px-4 py-2 text-sm font-extrabold mb-5 shadow-sm">
                ⏰ Signing closes in {hoursLeft < 24 ? `${hoursLeft}h` : `${Math.round(hoursLeft/24)}d`}
              </span>
            )}
            <div className="text-5xl mb-4">{design.icon}</div>
            <p className="text-xs font-extrabold tracking-[.24em] uppercase mb-3" style={{ color: design.accent }}>You're invited to celebrate</p>
            <h1 className="max-w-3xl mx-auto mb-4 text-3xl sm:text-4xl font-bold" style={{ color: design.ink, fontFamily: cardFont.family }}>
              {card.title || `A special card for ${card.recipient_name}`}
            </h1>
            <p className="text-lg opacity-80 mb-6">Add your words, a memory, a voice note, and an optional gift. ✨</p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="bg-white/80 text-warm-800 rounded-full px-4 py-2 text-sm font-bold shadow-sm">{card.signed_count || 0} people signed</span>
              {card.is_gift_enabled && card.total_collected > 0 && !card.hide_amounts && (
                <span className="bg-emerald-600 text-white rounded-full px-4 py-2 text-sm font-bold shadow-sm">🎁 {formatNGN(card.total_collected)} gift pot</span>
              )}
            </div>
          </div>
        </section>

        {/* Form — two-column on large screens */}
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 grid lg:grid-cols-[1fr_.82fr] gap-7 items-start">

          {/* ── Left: message form ── */}
          <section className="rounded-[2rem] p-5 sm:p-8" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(245,240,255,0.95) 100%)", border: `2px solid ${design.accent}25`, boxShadow: `0 8px 40px ${design.accent}18` }}>
            <div className="mb-7">
              <span className="text-sm font-extrabold tracking-[.2em] uppercase text-primary-600">Your signature</span>
              <h2 className="text-2xl sm:text-3xl text-warm-900 mt-2 font-bold">Make it personal 💜</h2>
              <p className="text-base text-warm-500 mt-2">Every word becomes part of the keepsake.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-bold text-warm-700 mb-2">Your name *</label>
                <input className="input text-base" placeholder="e.g. Kemi Adeyemi"
                  value={form.author_name} onChange={e => setForm(p=>({...p, author_name: e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-bold text-warm-700 mb-2">
                  Your email <span className="text-rose-500">*</span>
                </label>
                <input type="email" className="input text-base" placeholder="kemi@email.com" required
                  value={form.author_email} onChange={e => setForm(p=>({...p, author_email: e.target.value}))} />
              </div>
            </div>

            {/* Font style */}
            <label className="block text-sm font-bold text-warm-700 mb-2">Writing style</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
              {FONT_STYLES.map(font => (
                <button type="button" key={font.id} onClick={() => setForm(p=>({...p, font_style: font.id}))}
                  className={`rounded-xl border-2 px-2 py-3 text-center text-sm transition-all ${form.font_style === font.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-purple-100 bg-white text-warm-600 hover:border-primary-200'}`}
                  style={{ fontFamily: font.family }}>
                  {font.id === 'calligraphy' ? 'With love' : font.name}
                </button>
              ))}
            </div>

            {/* Message */}
            <label className="block text-sm font-bold text-warm-700 mb-2">Your message to {card.recipient_name} *</label>
            <div className="relative">
              <textarea ref={textareaRef} className="input text-base h-44 resize-none"
                style={{ fontFamily: msgFont.family, fontSize: form.font_style === 'calligraphy' ? '1.55rem' : '1rem' }}
                placeholder={`Write something unforgettable for ${card.recipient_name}...`}
                maxLength={1200} value={form.content}
                onChange={e => setForm(p=>({...p, content: e.target.value}))} />
              <button type="button" onClick={() => { setShowEmojiPicker(s => !s); setShowGifPicker(false); }}
                title="Add emoji"
                className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white border border-purple-100 shadow-sm flex items-center justify-center text-lg hover:bg-purple-50 transition-colors">
                😊
              </button>
              {showEmojiPicker && (
                <EmojiPicker
                  onSelect={(emoji) => insertEmoji(emoji)}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </div>
            <div className="flex justify-end mt-1 mb-5">
              <span className="text-sm text-warm-400">{form.content.length}/1200</span>
            </div>

            {/* Media upload */}
            <div className="relative flex flex-wrap gap-2 mb-4">
              <button type="button" onClick={() => fileRef.current.click()} className="voice-record-button">
                <span>📷</span>
                <span>Add photos/video {mediaFiles.length > 0 ? `(${mediaFiles.length}/5)` : '(up to 5)'}</span>
              </button>
              <button type="button" onClick={() => { setShowGifPicker(s => !s); setShowEmojiPicker(false); }}
                disabled={mediaFiles.length >= 5}
                className="voice-record-button disabled:opacity-50">
                <span>🎞️</span>
                <span>Add GIF</span>
              </button>
              <VoiceRecorder onRecorded={f => addMediaFiles([f])} disabled={submitting} />
              <input ref={fileRef} type="file" accept="image/*,video/*,audio/*,.m4a,.ogg,.webm"
                multiple className="hidden" onChange={e => addMediaFiles(e.target.files)} />
              {showGifPicker && (
                <GifPicker
                  onSelect={(file) => addMediaFiles([file])}
                  onClose={() => setShowGifPicker(false)}
                />
              )}
            </div>

            {/* Carousel preview */}
            {mediaFiles.length > 0 && (
              <div className="mb-5 rounded-2xl overflow-hidden border-2 border-purple-100 bg-white">
                <div className="relative" style={{ aspectRatio:'16/9', background:'#1A1035' }}>
                  {mediaFiles[carouselIdx].type === 'video' ? (
                    <video src={mediaFiles[carouselIdx].preview} className="w-full h-full object-contain" controls />
                  ) : mediaFiles[carouselIdx].type === 'voice' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                      <span className="text-5xl">🎙️</span>
                      <audio src={mediaFiles[carouselIdx].preview} controls className="w-4/5" />
                    </div>
                  ) : (
                    <img src={mediaFiles[carouselIdx].preview} alt="" className="w-full h-full object-contain" />
                  )}
                  <button type="button" onClick={() => removeMedia(carouselIdx)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-red-500 transition-colors">✕</button>
                  {mediaFiles.length > 1 && (
                    <>
                      <button type="button" onClick={() => setCarouselIdx(i => (i - 1 + mediaFiles.length) % mediaFiles.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-lg hover:bg-black/70">‹</button>
                      <button type="button" onClick={() => setCarouselIdx(i => (i + 1) % mediaFiles.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-lg hover:bg-black/70">›</button>
                    </>
                  )}
                </div>
                {mediaFiles.length > 1 && (
                  <div className="flex gap-2 p-2 overflow-x-auto" style={{ scrollbarWidth:'none' }}>
                    {mediaFiles.map((m, i) => (
                      <button key={i} type="button" onClick={() => setCarouselIdx(i)}
                        className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === carouselIdx ? 'border-primary-500' : 'border-transparent opacity-60 hover:opacity-90'}`}>
                        {m.type === 'voice' ? (
                          <div className="w-full h-full flex items-center justify-center bg-purple-50 text-xl">🎙️</div>
                        ) : m.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-xl">▶️</div>
                        ) : (
                          <img src={m.preview} alt="" className="w-full h-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-center text-xs text-warm-400 py-2">
                  {carouselIdx + 1} of {mediaFiles.length} — Add up to {5 - mediaFiles.length} more
                </p>
              </div>
            )}

            {/* Private message toggle */}
            {card.allow_private_messages && (
              <label className="flex items-center justify-between gap-4 border-t border-purple-100 pt-4">
                <span>
                  <span className="block text-base font-bold text-warm-800">Private message</span>
                  <span className="block text-sm text-warm-400">Only the celebrant and card creator can read it</span>
                </span>
                <input type="checkbox" checked={form.is_private}
                  onChange={e => setForm(p=>({...p, is_private: e.target.checked}))}
                  className="w-5 h-5 accent-violet-600" />
              </label>
            )}
          </section>

          {/* ── Right: preview + gift + mode chooser + submit ── */}
          <aside className="space-y-5 lg:sticky lg:top-24">

            {/* Live preview — image first, text below, overflow-contained */}
            <div
              className={`card-art ${cardArtClass(design)} celebration-shell rounded-[2rem] overflow-hidden flex flex-col`}
              style={{ background: design.background, color: design.ink, minWidth: 0, width: '100%' }}
            >
              {/* Header badge */}
              <div className="flex justify-between items-center px-5 pt-5 pb-3 flex-shrink-0">
                <span className="text-2xl">{design.icon}</span>
                <span className="text-xs font-extrabold tracking-[.18em] uppercase opacity-60" style={{ color: design.ink }}>Live preview</span>
              </div>

              {/* Media FIRST — shown above text */}
              {mediaFiles.length > 0 && (
                <div className="flex-shrink-0 px-4 pb-3">
                  {mediaFiles[0].type === 'image' || mediaFiles[0].type === 'gif' ? (
                    <img src={mediaFiles[0].preview} alt="" className="w-full rounded-2xl object-cover max-h-52" />
                  ) : mediaFiles[0].type === 'video' ? (
                    <video src={mediaFiles[0].preview} className="w-full rounded-2xl max-h-52 object-cover" />
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-2xl text-sm font-medium" style={{background:'rgba(255,255,255,0.3)', color: design.ink}}>🎙️ Voice note attached</div>
                  )}
                  {mediaFiles.length > 1 && (
                    <p className="text-xs opacity-60 mt-1 text-center" style={{ color: design.ink }}>+{mediaFiles.length-1} more photo{mediaFiles.length > 2 ? 's' : ''}</p>
                  )}
                </div>
              )}

              {/* Text below media */}
              <div className="flex-1 min-w-0 px-5 pb-3">
                <p
                  className="whitespace-pre-wrap break-words w-full"
                  style={{
                    color: design.ink,
                    fontFamily: msgFont.family,
                    fontSize: form.font_style === 'calligraphy' ? '1.4rem' : form.font_style === 'handwritten' ? '1.1rem' : '0.95rem',
                    lineHeight: 1.55,
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  {form.content || `Your beautiful message for ${card.recipient_name} will appear here...`}
                </p>
              </div>

              {/* Author signature */}
              <div className="border-t mx-5 mt-1 mb-4 pt-3 flex-shrink-0" style={{ borderColor: `${design.accent}35` }}>
                <p className="font-bold text-sm" style={{ color: design.ink }}>{form.author_name || 'Your name'}</p>
              </div>
            </div>

            {/* Gift section */}
            {card.is_gift_enabled && (
              <div className="rounded-[2rem] p-5 sm:p-6" style={{ background: `linear-gradient(135deg, ${design.background.includes("gradient") ? "rgba(255,255,255,0.96)" : design.background}, rgba(255,255,255,0.96))`, border: `2px solid ${design.accent}30`, boxShadow: `0 4px 24px ${design.accent}15` }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: design.accent }}>Add a gift 🎁</h3>
                    <p className="text-sm text-warm-500 mt-1">Optional · Secure via Flutterwave</p>
                  </div>
                </div>
                {card.total_collected > 0 && !card.hide_amounts && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 mb-4 flex justify-between">
                    <span className="text-sm font-bold text-emerald-700">Gift pot so far</span>
                    <span className="font-bold text-emerald-800">{formatNGN(card.total_collected)}</span>
                  </div>
                )}
                <button type="button" onClick={() => { setSelectedAmount(null); setCustomAmount(''); }}
                  className={`w-full mb-3 py-2.5 rounded-xl text-sm font-bold border-2 ${selectedAmount === null && !customAmount ? 'bg-warm-900 text-white border-warm-900' : 'bg-white border-purple-100 text-warm-700 hover:border-purple-200'}`}>
                  Sign without a gift
                </button>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {AMOUNTS_NGN.map(amount => (
                    <button type="button" key={amount}
                      onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                      className={`py-2.5 rounded-xl text-sm font-bold border-2 ${selectedAmount === amount && !customAmount ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-purple-100 text-warm-700 hover:border-primary-200'}`}>
                      {formatNGN(amount)}
                    </button>
                  ))}
                </div>
                <input type="number" min="2500" className="input text-base" placeholder="Or enter custom amount"
                  value={customAmount} onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }} />
              </div>
            )}

            {/* ── Continue mode — radio toggles shown for unauthenticated users ── */}
            {!isSignedIn && (
              <div className="rounded-[2rem] p-5 space-y-3" style={{ background: "rgba(255,255,255,0.95)", border: `2px solid ${design.accent}25`, boxShadow: `0 4px 20px ${design.accent}12` }}>
                <p className="text-sm font-extrabold uppercase tracking-widest" style={{ color: design.accent }}>How to continue</p>

                {/* Guest radio */}
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${submitMode === 'guest' ? 'border-primary-400 bg-primary-50' : 'border-purple-100 bg-white hover:border-purple-200'}`}>
                  <input type="radio" name="submitMode" value="guest"
                    checked={submitMode === 'guest'} onChange={() => setSubmitMode('guest')}
                    className="accent-violet-600 w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-warm-900 text-sm">Continue as Guest</p>
                    <p className="text-xs text-warm-500">Just sign the card. No account needed.</p>
                  </div>
                </label>

                {/* Create account radio */}
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${submitMode === 'signup' ? 'border-primary-400 bg-primary-50' : 'border-purple-100 bg-white hover:border-purple-200'}`}>
                  <input type="radio" name="submitMode" value="signup"
                    checked={submitMode === 'signup'} onChange={() => setSubmitMode('signup')}
                    className="accent-violet-600 w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-warm-900 text-sm">Create account &amp; sign card</p>
                    <p className="text-xs text-warm-500">Get your own group cards &amp; gift pots!</p>
                  </div>
                </label>

                {/* Signup form — shown when radio = signup */}
                {submitMode === 'signup' && (
                  <div className="rounded-2xl border-2 border-primary-200 bg-primary-50 p-4 space-y-3">
                    <input className="input text-base" placeholder="Full name *"
                      value={signupForm.full_name || form.author_name}
                      onChange={e => setSignupForm(p=>({...p, full_name: e.target.value}))} />
                    <input className="input text-base" placeholder="Username * (letters, numbers, _)"
                      value={signupForm.username}
                      onChange={e => setSignupForm(p=>({...p, username: e.target.value.replace(/[^a-zA-Z0-9_]/g,'')}))} />
                    <input type="email" className="input text-base" placeholder="Email address *"
                      value={signupForm.email || form.author_email}
                      onChange={e => setSignupForm(p=>({...p, email: e.target.value}))} />
                    <input type="password" className="input text-base" placeholder="Create a password * (min 8 chars)"
                      value={signupForm.password}
                      onChange={e => setSignupForm(p=>({...p, password: e.target.value}))} />
                    <input type="password" className="input text-base" placeholder="Confirm password *"
                      value={signupForm.confirm_password}
                      onChange={e => setSignupForm(p=>({...p, confirm_password: e.target.value}))} />
                    <div>
                      <label className="block text-xs text-warm-600 mb-1">🎂 Your birthday (optional — so we celebrate you!)</label>
                      <input type="date" className="input text-base"
                        value={signupForm.date_of_birth}
                        onChange={e => setSignupForm(p=>({...p, date_of_birth: e.target.value}))} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Gift mode toggle (only when gift is enabled) ── */}
            {card.is_gift_enabled && (
              <div className="flex gap-2 mb-3">
                <button type="button"
                  onClick={() => setGiftMode('money')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${giftMode==='money' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-purple-100 bg-white text-warm-600'}`}>
                  💳 Money Gift
                </button>
                <button type="button"
                  onClick={() => { setGiftMode('product'); if (!vendors.length) loadVendors(); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${giftMode==='product' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-purple-100 bg-white text-warm-600'}`}>
                  🎁 Send a Gift
                </button>
              </div>
            )}

            {/* ── Product vendor picker ── */}
            {giftMode === 'product' && card.is_gift_enabled && (
              <div className="rounded-2xl border-2 border-pink-100 bg-pink-50/50 p-4 mb-3">
                <p className="text-sm font-semibold text-warm-700 mb-3">Choose a gift from a vendor near the recipient</p>

                {/* Filters */}
                <div className="flex gap-2 mb-3">
                  <select value={vendorFilter.country}
                    onChange={e => { setVendorFilter(p=>({...p,country:e.target.value})); loadVendors(e.target.value, vendorFilter.category); }}
                    className="flex-1 input text-xs py-2">
                    <option value="">All countries</option>
                    {['Nigeria','Ghana','Kenya','South Africa','UK','USA','Canada'].map(c=><option key={c}>{c}</option>)}
                  </select>
                  <select value={vendorFilter.category}
                    onChange={e => { setVendorFilter(p=>({...p,category:e.target.value})); loadVendors(vendorFilter.country, e.target.value); }}
                    className="flex-1 input text-xs py-2">
                    <option value="">All types</option>
                    {['cakes','flowers','chocolates','jewellery','hampers','balloons'].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Vendor list */}
                {vendors.length === 0
                  ? <p className="text-xs text-warm-400 text-center py-2">No vendors found. Try a different filter.</p>
                  : <div className="space-y-2 max-h-48 overflow-y-auto">
                      {vendors.map(v => (
                        <button key={v.id} type="button"
                          onClick={() => { setSelectedVendor(v); setVendorProducts([]); setSelectedProduct(null);
                            fetch(`${import.meta.env.VITE_API_URL||'/api'}/vendor/store/${v.slug}`)
                              .then(r=>r.json()).then(d=>setVendorProducts(d.products||[])); }}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all ${selectedVendor?.id===v.id ? 'border-pink-400 bg-white' : 'border-transparent bg-white hover:border-pink-200'}`}>
                          <div className="flex items-center gap-3">
                            {v.logo_url
                              ? <img src={v.logo_url} className="w-8 h-8 rounded-lg object-cover"/>
                              : <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-sm">🎁</div>}
                            <div>
                              <p className="text-sm font-semibold text-warm-900">{v.business_name}</p>
                              <p className="text-xs text-warm-400 capitalize">{v.category} · {v.country||'International'}{v.state ? `, ${v.state}` : ''}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                }

                {/* Products from selected vendor */}
                {selectedVendor && vendorProducts.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto border-t border-pink-100 pt-3">
                    <p className="text-xs font-semibold text-warm-600 mb-2">Products from {selectedVendor.business_name}</p>
                    {vendorProducts.map(p => (
                      <button key={p.id} type="button"
                        onClick={() => { setSelectedProduct(p); setProductImgIdx(0); }}
                        className={`w-full text-left p-2.5 rounded-xl border-2 transition-all flex items-center gap-3 ${selectedProduct?.id===p.id ? 'border-pink-400 bg-pink-50' : 'border-transparent bg-white hover:border-pink-200'}`}>
                        {p.images?.[0] && <img src={p.images[0]} className="w-10 h-10 rounded-lg object-cover"/>}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-warm-900">{p.name}</p>
                          <p className="text-xs text-pink-600 font-bold">{formatNGN(p.price)}</p>
                        </div>
                        {selectedProduct?.id===p.id && <span className="text-pink-500">✓</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected product image carousel preview */}
                {selectedProduct?.images?.length > 0 && (
                  <div className="mt-3 border-t border-pink-100 pt-3">
                    <div className="relative rounded-xl overflow-hidden aspect-square bg-white max-w-[200px] mx-auto">
                      <img src={selectedProduct.images[productImgIdx % selectedProduct.images.length]}
                        className="w-full h-full object-cover" alt={selectedProduct.name}/>
                      {selectedProduct.images.length > 1 && (
                        <>
                          <button type="button"
                            onClick={() => setProductImgIdx(i => (i - 1 + selectedProduct.images.length) % selectedProduct.images.length)}
                            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center text-sm">‹</button>
                          <button type="button"
                            onClick={() => setProductImgIdx(i => (i + 1) % selectedProduct.images.length)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center text-sm">›</button>
                          <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
                            {selectedProduct.images.map((_,i) => (
                              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i===(productImgIdx%selectedProduct.images.length) ? 'bg-white' : 'bg-white/40'}`}/>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Submit buttons ── */}
            {giftMode === 'product' && card.is_gift_enabled
              ? <button onClick={handleProductGift} disabled={productSubmitting || !selectedProduct}
                  className="w-full py-4 text-base rounded-2xl font-extrabold disabled:opacity-60 transition-all"
                  style={{ background:'linear-gradient(135deg,#ec4899,#db2777)', color:'#fff', boxShadow:'0 4px 20px #ec489966', border:'none' }}>
                  {productSubmitting
                    ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Processing...</span>
                    : selectedProduct ? `🎁 Sign + send ${selectedProduct.name} (${formatNGN(selectedProduct.price)})` : '🎁 Sign + Send Gift'}
                </button>
              : <button onClick={handleSubmit} disabled={submitting}
                  className="w-full py-4 text-base rounded-2xl font-extrabold disabled:opacity-60 transition-all"
                  style={{ background:`linear-gradient(135deg,${design.accent},${design.accent}cc)`, color:'#fff', boxShadow:`0 4px 20px ${design.accent}55`, border:'none' }}>
                  {submitting
                    ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>{stageLabel||'Processing...'}</span>
                    : wantsGift ? `✍️ Sign card + pay ${formatNGN(amountNGN)} gift` : `✍️ Sign this card`}
                </button>
            }

            <p className="text-center text-sm text-warm-400">Secured by Flutterwave · Your message is private until delivery</p>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default SignCard;
