const express = require('express');
const router  = express.Router();
const { anyAuth, optionalAuth } = require('../middleware/auth');
const {
  initCardFee,
  verifyCardFee,
  initContribution,
  verifyContribution,
  verifyPayment,
} = require('../controllers/paymentController');
const { validateDiscountCode, applyDiscountToFeeNGN, getActiveBanner } = require('../controllers/discountCodeController');

// Public — the currently active site-wide promo banner, if any.
router.get('/active-banner', getActiveBanner);

// Public — lets checkout show the discounted price before redirecting to FLW.
// Does NOT record a redemption; that only happens once payment is verified.
router.post('/discount-preview', async (req, res) => {
  try {
    const { code } = req.body;
    const result = await validateDiscountCode(code);
    if (!result.valid) return res.status(400).json({ error: result.error });
    const { discountedNGN, discountAmountNGN } = applyDiscountToFeeNGN(5000, result.discount);
    res.json({
      ok: true,
      code: result.discount.code,
      percent_off: result.discount.percent_off,
      max_discount_ngn: result.discount.max_discount_ngn || null,
      discounted_ngn: discountedNGN,
      discount_amount_ngn: discountAmountNGN,
    });
  } catch (err) {
    console.error('discount-preview error:', err.message);
    res.status(500).json({ error: 'Could not check discount code' });
  }
});

// Card creation fee — optionalAuth so the user's email from the request body is
// used as fallback when their JWT has expired during the session. The controller
// checks req.body.email || req.user?.email || req.member?.email || req.company?.email.
router.post('/initialize/purchase',    optionalAuth, initCardFee);
router.post('/initialize/card-fee',    optionalAuth, initCardFee);

// optionalAuth (not anyAuth) — FLW redirect lands here after a full-page reload.
// The user's JWT may have expired during checkout; requiring auth would silently
// leave the card as 'draft' even though the payment succeeded. verifyCardFee
// does not use req.user — it only needs the tx_ref to confirm with FLW.
router.get('/verify-card-fee',         optionalAuth, verifyCardFee);

// Gift contributions (public)
router.post('/initialize/contribution', initContribution);
router.post('/verify-contribution',     verifyContribution);
router.get('/verify-contribution',      verifyContribution); // ?tx_ref=

// Which payment methods the checkout may offer, and Lemon Squeezy status
// polling for the return pages (the signed webhook is what marks it paid).
const { getProviders, getStatus: getLemonStatus } = require('../controllers/lemonSqueezyController');
router.get('/providers', getProviders);

// Daily USD exchange rates for showing local prices (display only).
router.get('/fx-rates', async (_req, res) => {
  const d = await require('../utils/fxRates').getUsdRates();
  if (!d) return res.status(503).json({ error: 'Rates unavailable' });
  res.set('Cache-Control', 'public, max-age=3600');
  return res.json({ base: 'USD', rates: d.rates, updated_at: d.updatedAt });
});
router.get('/lemonsqueezy/status/:ref', getLemonStatus);

// Generic verify — PaymentCallback fallback for any payment type
router.get('/verify/:txRef', verifyPayment);
router.get('/verify',        verifyPayment); // ?tx_ref=

module.exports = router;
