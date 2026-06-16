/**
 * reloadlyController.js — Reloadly Gift Card API integration
 *
 * Reloadly supports Nigeria (Airtime, data, local brands), UK, and US (Amazon,
 * iTunes, Netflix, Spotify, Google Play, etc.).
 *
 * Docs: https://developers.reloadly.com/
 * Auth: OAuth2 client_credentials → access token (cached, refreshed when expired)
 * Base URLs:
 *   Sandbox:    https://giftcards-sandbox.reloadly.com
 *   Production: https://giftcards.reloadly.com
 *   Auth:       https://auth.reloadly.com (same for both)
 */

const axios   = require('axios');
const supabase = require('../utils/supabase');
const { sendEmail } = require('../utils/email');

const IS_PROD     = process.env.NODE_ENV === 'production' && process.env.RELOADLY_LIVE === 'true';
const RL_BASE     = IS_PROD
  ? 'https://giftcards.reloadly.com'
  : 'https://giftcards-sandbox.reloadly.com';
const RL_AUTH     = 'https://auth.reloadly.com';
const RL_AUDIENCE = IS_PROD
  ? 'https://giftcards.reloadly.com'
  : 'https://giftcards-sandbox.reloadly.com';

// In-memory token cache
let _token = null;
let _tokenExpiry = 0;

const getAccessToken = async () => {
  if (_token && Date.now() < _tokenExpiry - 60000) return _token;

  const r = await axios.post(`${RL_AUTH}/oauth/token`, {
    client_id:     process.env.RELOADLY_CLIENT_ID,
    client_secret: process.env.RELOADLY_CLIENT_SECRET,
    grant_type:    'client_credentials',
    audience:      RL_AUDIENCE,
  });

  _token       = r.data.access_token;
  _tokenExpiry = Date.now() + (r.data.expires_in * 1000);
  return _token;
};

const rlHeaders = async () => {
  const token = await getAccessToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/com.reloadly.giftcards-v1+json',
  };
};

// ── Curated product list for each market ─────────────────────────────────────
// These are real Reloadly product IDs — sandbox uses same IDs as production
// They are grouped by currency so the frontend knows what to show per country
const FEATURED_PRODUCTS = [
  // Nigeria (NGN)
  { id: 'NG_AIRTIME_MTN',      name: 'MTN Airtime',        currency:'NGN', country:'NG', category:'airtime',   icon:'📱', note:'Top up any MTN number in Nigeria' },
  { id: 'NG_AIRTIME_AIRTEL',   name: 'Airtel Airtime',     currency:'NGN', country:'NG', category:'airtime',   icon:'📱', note:'Top up any Airtel number in Nigeria' },
  { id: 'NG_AIRTIME_GLO',      name: 'Glo Airtime',        currency:'NGN', country:'NG', category:'airtime',   icon:'📱', note:'Top up any Glo number in Nigeria' },
  { id: 'NG_AIRTIME_9MOBILE',  name: '9Mobile Airtime',    currency:'NGN', country:'NG', category:'airtime',   icon:'📱', note:'Top up any 9Mobile number in Nigeria' },
  { id: 'NG_JUMIA',            name: 'Jumia Gift Card',    currency:'NGN', country:'NG', category:'shopping',  icon:'🛍️', note:'Shop anything on Jumia Nigeria' },
  // UK (GBP)
  { id: 'UK_AMAZON',           name: 'Amazon UK',          currency:'GBP', country:'GB', category:'shopping',  icon:'📦', note:'Shop on Amazon.co.uk' },
  { id: 'UK_ITUNES',           name: 'iTunes UK',          currency:'GBP', country:'GB', category:'media',     icon:'🎵', note:'Apps, music, movies on Apple UK' },
  { id: 'UK_GOOGLE_PLAY',      name: 'Google Play UK',     currency:'GBP', country:'GB', category:'media',     icon:'▶️', note:'Apps, games, media' },
  { id: 'UK_NETFLIX',          name: 'Netflix UK',         currency:'GBP', country:'GB', category:'streaming', icon:'🎬', note:'Stream movies and shows' },
  { id: 'UK_SPOTIFY',          name: 'Spotify UK',         currency:'GBP', country:'GB', category:'streaming', icon:'🎧', note:'Premium music streaming' },
  { id: 'UK_ASOS',             name: 'ASOS',               currency:'GBP', country:'GB', category:'fashion',   icon:'👗', note:'Fashion and lifestyle' },
  // US (USD)
  { id: 'US_AMAZON',           name: 'Amazon US',          currency:'USD', country:'US', category:'shopping',  icon:'📦', note:'Shop on Amazon.com' },
  { id: 'US_ITUNES',           name: 'iTunes US',          currency:'USD', country:'US', category:'media',     icon:'🎵', note:'Apps, music, movies on Apple US' },
  { id: 'US_GOOGLE_PLAY',      name: 'Google Play US',     currency:'USD', country:'US', category:'media',     icon:'▶️', note:'Apps, games, media' },
  { id: 'US_NETFLIX',          name: 'Netflix US',         currency:'USD', country:'US', category:'streaming', icon:'🎬', note:'Stream movies and shows' },
  { id: 'US_SPOTIFY',          name: 'Spotify US',         currency:'USD', country:'US', category:'streaming', icon:'🎧', note:'Premium music streaming' },
  { id: 'US_XBOX',             name: 'Xbox Gift Card',     currency:'USD', country:'US', category:'gaming',    icon:'🎮', note:'Games and entertainment' },
  { id: 'US_PLAYSTATION',      name: 'PlayStation Store',  currency:'USD', country:'US', category:'gaming',    icon:'🎮', note:'PS5/PS4 games and content' },
  { id: 'US_WALMART',          name: 'Walmart',            currency:'USD', country:'US', category:'shopping',  icon:'🛒', note:'Everyday items and groceries' },
];

// ── GET /api/giftcards/products?country=NG&currency=NGN ────────────────────
// Returns Reloadly product catalogue filtered by country/currency
const getProducts = async (req, res) => {
  try {
    const { country, currency } = req.query;

    // Return our curated list instantly without hitting Reloadly API
    // (avoids rate limiting and speeds up the UI)
    let products = FEATURED_PRODUCTS;
    if (country)  products = products.filter(p => p.country  === country.toUpperCase());
    if (currency) products = products.filter(p => p.currency === currency.toUpperCase());

    return res.json({ products });
  } catch (err) {
    console.error('getProducts error:', err.message);
    return res.status(500).json({ error: 'Failed to load gift card products' });
  }
};

// ── GET /api/giftcards/product/:productId — get denominations for a product ─
const getProductDenominations = async (req, res) => {
  try {
    const { productId } = req.params;

    // Map our friendly IDs to real Reloadly product IDs
    // In sandbox these are the correct test product IDs
    const RELOADLY_IDS = {
      'NG_JUMIA':           10,   // Jumia Nigeria
      'UK_AMAZON':          3,    // Amazon UK
      'UK_ITUNES':          22,   // iTunes UK
      'UK_GOOGLE_PLAY':     5,    // Google Play UK
      'UK_NETFLIX':         47,   // Netflix UK
      'UK_SPOTIFY':         26,   // Spotify UK
      'UK_ASOS':            182,  // ASOS UK
      'US_AMAZON':          1,    // Amazon US
      'US_ITUNES':          4,    // iTunes US
      'US_GOOGLE_PLAY':     6,    // Google Play US
      'US_NETFLIX':         48,   // Netflix US
      'US_SPOTIFY':         27,   // Spotify US
      'US_XBOX':            12,   // Xbox
      'US_PLAYSTATION':     13,   // PlayStation
      'US_WALMART':         11,   // Walmart
    };

    const rlId = RELOADLY_IDS[productId];

    // Airtime is handled differently (not a gift card product)
    if (!rlId || productId.includes('AIRTIME')) {
      return res.json({
        denominations: [100, 200, 500, 1000, 2000, 5000],
        currency: productId.includes('NG') ? 'NGN' : productId.includes('UK') ? 'GBP' : 'USD',
        isFixed: false,
      });
    }

    const hdrs = await rlHeaders();
    const r = await axios.get(`${RL_BASE}/products/${rlId}`, { headers: hdrs });
    const product = r.data;

    return res.json({
      reloadlyId:   rlId,
      name:         product.productName,
      denominations: product.fixedRecipientDenominations?.length
        ? product.fixedRecipientDenominations
        : null,
      minAmount:    product.minRecipientDenomination,
      maxAmount:    product.maxRecipientDenomination,
      isFixed:      (product.fixedRecipientDenominations?.length || 0) > 0,
      currency:     product.recipientCurrencyCode,
      senderCurrency: product.senderCurrencyCode,
      senderFxRate: product.senderToRecipientDenominationsRates,
    });
  } catch (err) {
    console.error('getProductDenominations error:', err.message);
    return res.status(500).json({ error: 'Failed to load product details' });
  }
};

// ── POST /api/giftcards/order — purchase a gift card ─────────────────────────
// Called by the claim flow when recipient chooses "Gift Card"
const orderGiftCard = async (req, res) => {
  try {
    const callerId   = req.user?.id || req.member?.id;
    const callerType = req.user ? 'user' : 'member';
    if (!callerId) return res.status(401).json({ error: 'Not authenticated' });

    const { card_slug, product_id, recipient_email, access_token } = req.body;

    if (!card_slug)  return res.status(400).json({ error: 'card_slug is required' });
    if (!product_id) return res.status(400).json({ error: 'product_id is required' });
    const amount = parseFloat(req.body.amount);
    if (!isFinite(amount) || amount < 100) return res.status(400).json({ error: 'Minimum amount is ₦100' });
    if (amount > 500_000) return res.status(400).json({ error: 'Amount exceeds maximum gift redemption limit' });

    // Load the Thankeeu card
    const { data: card } = await supabase.from('cards')
      .select('id, slug, title, recipient_name, recipient_email, total_collected, gift_withdrawn, is_gift_enabled')
      .eq('slug', card_slug).maybeSingle();

    if (!card)                return res.status(404).json({ error: 'Card not found' });
    if (!card.is_gift_enabled) return res.status(400).json({ error: 'Gift not enabled on this card' });
    if (card.gift_withdrawn)  return res.status(400).json({ error: 'Gift already claimed' });
    if ((card.total_collected || 0) < amount)
      return res.status(400).json({ error: `Insufficient gift pot. Available: ₦${(card.total_collected||0).toLocaleString()}` });

    // Verify recipient identity
    let callerEmail = null;
    if (req.user?.id) {
      const { data: u } = await supabase.from('users').select('email').eq('id', req.user.id).maybeSingle();
      callerEmail = u?.email;
    } else if (req.member?.id) {
      const { data: m } = await supabase.from('company_members').select('email').eq('id', req.member.id).maybeSingle();
      callerEmail = m?.email;
    }

    const emailMatch = card.recipient_email &&
      callerEmail?.toLowerCase() === card.recipient_email.toLowerCase();
    const { data: received } = await supabase.from('received_cards')
      .select('id').eq('card_id', card.id).eq('recipient_user_id', callerId).maybeSingle();

    // Also check member-to-member transfers (a separate table —
    // member_received_cards.recipient_member_id — used by transferCardToMember)
    let receivedAsMember = null;
    if (!received && req.member?.id) {
      const { data: mrc } = await supabase.from('member_received_cards')
        .select('id').eq('card_id', card.id)
        .eq('recipient_member_id', req.member.id).maybeSingle();
      receivedAsMember = mrc;
    }

    if (!emailMatch && !received && !receivedAsMember) {
      return res.status(403).json({ error: 'Only the gift recipient can claim this gift pot.' });
    }

    // Platform fee: 3.5%
    const fee = Math.round(amount * 0.035);
    const net = amount - fee;

    // Atomically claim the gift pot BEFORE calling Reloadly/Airtime — only
    // one concurrent request can flip gift_withdrawn from false to true.
    // Without this, a double-click (or retried request) could both pass the
    // earlier check (both read gift_withdrawn=false), both place an order
    // with Reloadly, and result in two gift cards issued for one gift pot.
    const claimRefForLock = `TK-GC-${Date.now()}-${card.id.slice(0,8).toUpperCase()}`;
    const { data: lockClaimed, error: lockErr } = await supabase.from('cards')
      .update({
        gift_withdrawn: true, gift_withdrawn_at: new Date(),
        gift_payout_reference: claimRefForLock, gift_payout_amount: net,
      })
      .eq('id', card.id).eq('gift_withdrawn', false)
      .select('id').maybeSingle();

    if (lockErr || !lockClaimed) {
      return res.status(400).json({ error: 'Gift already claimed' });
    }

    // Helper to release the claim if the order ultimately fails, so the
    // recipient can retry. Uses try/catch rather than .catch() chaining —
    // Supabase query builders implement PromiseLike via .then() but don't
    // reliably expose .catch() directly on the builder chain.
    const releaseClaim = async () => {
      try {
        await supabase.from('cards').update({
          gift_withdrawn: false, gift_withdrawn_at: null,
          gift_payout_reference: null, gift_payout_amount: null,
        }).eq('id', card.id);
      } catch (_) { /* best-effort */ }
    };

    // Map product_id to Reloadly numeric ID
    const RELOADLY_IDS = {
      'NG_JUMIA':10,'UK_AMAZON':3,'UK_ITUNES':22,'UK_GOOGLE_PLAY':5,
      'UK_NETFLIX':47,'UK_SPOTIFY':26,'UK_ASOS':182,
      'US_AMAZON':1,'US_ITUNES':4,'US_GOOGLE_PLAY':6,
      'US_NETFLIX':48,'US_SPOTIFY':27,'US_XBOX':12,'US_PLAYSTATION':13,'US_WALMART':11,
    };

    // Where the recipient can redeem each gift card
    const REDEEM_URLS = {
      'NG_JUMIA':'https://www.jumia.com.ng/','UK_AMAZON':'https://www.amazon.co.uk/gc/redeem','UK_ITUNES':'https://redeem.apple.com/',
      'UK_GOOGLE_PLAY':'https://play.google.com/store/account/subscriptions','UK_NETFLIX':'https://www.netflix.com/redeem','UK_SPOTIFY':'https://www.spotify.com/redeem','UK_ASOS':'https://www.asos.com/',
      'US_AMAZON':'https://www.amazon.com/gc/redeem','US_ITUNES':'https://redeem.apple.com/','US_GOOGLE_PLAY':'https://play.google.com/store/account/subscriptions',
      'US_NETFLIX':'https://www.netflix.com/redeem','US_SPOTIFY':'https://www.spotify.com/redeem','US_XBOX':'https://redeem.microsoft.com/','US_PLAYSTATION':'https://www.playstation.com/redeem-codes/','US_WALMART':'https://www.walmart.com/',
    };

    const targetEmail = recipient_email || callerEmail || card.recipient_email;

    // Record the claim attempt
    const claimRef = `TK-GC-${Date.now()}-${card.id.slice(0,8).toUpperCase()}`;
    let claim = null;
    try {
      const { data: claimData } = await supabase.from('gift_claims').insert({
        card_id:         card.id,
        recipient_name:  card.recipient_name,
        recipient_email: targetEmail,
        claim_type:      'giftcard',
        amount:          net,
        status:          'processing',
        product_id,
        reloadly_ref:    claimRef,
      }).select().maybeSingle();
      claim = claimData;
    } catch (_) {}

    // Handle airtime (Reloadly Airtime API — different endpoint)
    if (product_id.includes('AIRTIME')) {
      const OPERATOR_IDS = {
        'NG_AIRTIME_MTN':    236,
        'NG_AIRTIME_AIRTEL': 237,
        'NG_AIRTIME_GLO':    238,
        'NG_AIRTIME_9MOBILE':5,
      };
      const operatorId = OPERATOR_IDS[product_id];
      if (!operatorId) { await releaseClaim(); return res.status(400).json({ error: 'Unknown airtime operator' }); }

      const AT_BASE = IS_PROD
        ? 'https://topups.reloadly.com'
        : 'https://topups-sandbox.reloadly.com';
      const hdrs = await rlHeaders();

      const airtimeR = await axios.post(`${AT_BASE}/topups`, {
        operatorId,
        amount:              net,
        useLocalAmount:      true,
        customIdentifier:    claimRef,
        recipientPhone:      { countryCode: 'NG', number: req.body.phone_number || targetEmail },
        senderPhone:         { countryCode: 'NG', number: '2348000000000' },
      }, { headers: hdrs });

      if (airtimeR.data.status === 'SUCCESSFUL' || airtimeR.data.transactionId) {
        await Promise.all([
          supabase.from('cards').update({
            gift_withdrawn: true, gift_withdrawn_at: new Date(),
            gift_payout_reference: claimRef, gift_payout_amount: net,
          }).eq('id', card.id),
          claim?.id && supabase.from('gift_claims').update({ status: 'paid', processed_at: new Date() }).eq('id', claim.id),
        ]);

        return res.json({
          success: true,
          type: 'airtime',
          message: `₦${net.toLocaleString()} airtime sent successfully!`,
          amount: net, fee, gross: amount,
        });
      }
      console.error('[reloadly] airtime failed:', JSON.stringify(airtimeR.data));
      throw new Error('Airtime top-up failed. Please try again.');
    }

    // Gift card order via Reloadly
    const rlId = RELOADLY_IDS[product_id];
    if (!rlId) { await releaseClaim(); return res.status(400).json({ error: 'Unknown gift card product' }); }

    const hdrs = await rlHeaders();

    // Get current FX rates to calculate correct sender amount
    const productR = await axios.get(`${RL_BASE}/products/${rlId}`, { headers: hdrs });
    const product   = productR.data;
    const recipientCurrency = product.recipientCurrencyCode; // GBP, USD, etc.

    // Convert NGN net amount to recipient currency
    // Reloadly provides senderCurrencyCode (usually USD) — we send in USD
    // FX: NGN → USD → recipient currency via Reloadly rates
    const FX_NGN_TO_USD = product.senderToRecipientDenominationsRates
      ? Object.keys(product.senderToRecipientDenominationsRates)[0]
      : null;

    // Use Reloadly's fx endpoint for accurate conversion
    const fxR = await axios.get(
      `${RL_BASE}/fx-rate?senderCurrencyCode=USD&recipientCurrencyCode=${recipientCurrency}`,
      { headers: hdrs }
    ).catch(() => ({ data: { senderAmount: 1, recipientAmount: 1 } }));

    // USD amount = NGN net / 1500 (approximate — Reloadly adjusts based on live rate)
    const NGN_TO_USD = Number(process.env.NGN_TO_USD_RATE || 1600);
    const senderAmountUSD = parseFloat((net / NGN_TO_USD).toFixed(2));

    // Minimum $1 check
    if (senderAmountUSD < 1) {
      await releaseClaim();
      return res.status(400).json({ error: `Amount too low for gift card after conversion. Minimum is ₦${Math.ceil(NGN_TO_USD).toLocaleString()}` });
    }

    const orderPayload = {
      productId:        rlId,
      quantity:         1,
      unitPrice:        senderAmountUSD,
      customIdentifier: claimRef,
      senderName:       'Thankeeu',
      recipientEmail:   targetEmail,
    };

    console.log('Reloadly gift card order:', JSON.stringify(orderPayload));
    const orderR = await axios.post(`${RL_BASE}/orders`, orderPayload, { headers: hdrs });

    if (orderR.data.status === 'SUCCESSFUL' || orderR.data.transactionId) {
      let redeemCode = orderR.data.redemptionCode || orderR.data.pin || null;

      // Some Reloadly gift card products don't return the code in the initial
      // order response — fetch the transaction's cards as a best-effort follow-up.
      if (!redeemCode && orderR.data.transactionId) {
        try {
          const cardsR = await axios.get(`${RL_BASE}/orders/transactions/${orderR.data.transactionId}/cards`, { headers: hdrs });
          const firstCard = Array.isArray(cardsR.data) ? cardsR.data[0] : cardsR.data?.cards?.[0];
          redeemCode = firstCard?.pinCode || firstCard?.cardNumber || firstCard?.redemptionCode || null;
        } catch (_) { /* best-effort — code may only arrive via Reloadly's own email */ }
      }

      await Promise.all([
        supabase.from('cards').update({
          gift_withdrawn: true, gift_withdrawn_at: new Date(),
          gift_payout_reference: claimRef, gift_payout_amount: net,
        }).eq('id', card.id),
        claim?.id && supabase.from('gift_claims').update({
          status: 'paid', processed_at: new Date(),
          redemption_code: redeemCode || null,
        }).eq('id', claim.id),
      ]);

      // Always send Thankeeu's own confirmation email with the code — don't
      // rely solely on Reloadly's delivery email (which sandbox mode never sends).
      sendEmail({ to: targetEmail, template: 'giftCardDelivered', data: {
        name: card.recipient_name,
        productName: product.productName,
        amountLabel: `₦${net.toLocaleString()}`,
        redemptionCode: redeemCode || 'Check your email from Reloadly for your code, or contact support@thankeeu.com with the order reference below.',
        redeemUrl: REDEEM_URLS[product_id] || null,
        orderRef: claimRef,
      }}).catch(e => console.error('giftCardDelivered email failed:', e.message));

      return res.json({
        success: true,
        type:    'giftcard',
        message: redeemCode
          ? `Your ${product.productName} gift card code has been sent to ${targetEmail}.`
          : `Your ${product.productName} gift card order was placed. The code will arrive at ${targetEmail} from Reloadly shortly.`,
        amount: net, fee, gross: amount,
        redemption_code: redeemCode,
        redeem_url: REDEEM_URLS[product_id] || null,
        product_name: product.productName,
      });
    }

    throw new Error('Order failed: ' + JSON.stringify(orderR.data));

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('orderGiftCard error:', msg, err.response?.data);

    // Update claim status to failed, and release the gift_withdrawn lock
    // (if it was claimed) so the recipient can retry.
    if (req.body?.card_slug) {
      const { data: card } = await supabase.from('cards')
        .select('id, gift_withdrawn, gift_payout_reference').eq('slug', req.body.card_slug).maybeSingle();
      if (card?.id) {
        await supabase.from('gift_claims')
          .update({ status: 'rejected' })
          .eq('card_id', card.id).eq('status', 'processing');

        // Only release if this card was claimed via the TK-GC- lock pattern
        // and no payout was actually delivered (status update above failed
        // to find a 'paid' claim — if it had succeeded we'd have returned
        // already).
        if (card.gift_withdrawn && String(card.gift_payout_reference || '').startsWith('TK-GC-')) {
          await supabase.from('cards').update({
            gift_withdrawn: false, gift_withdrawn_at: null,
            gift_payout_reference: null, gift_payout_amount: null,
          }).eq('id', card.id);
        }
      }
    }

    return res.status(500).json({ error: msg || 'Gift card order failed. Please try again or choose bank transfer.' });
  }
};

module.exports = { getProducts, getProductDenominations, orderGiftCard };
