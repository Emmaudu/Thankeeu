const supabase = require('../utils/supabase');
const { safeError } = require('../utils/paramGuard');

const normalizeCode = (raw) => String(raw || '').trim().toUpperCase().replace(/\s+/g, '');

// ── GET /api/admin/discount-codes ─────────────────────────────────────────────
const listDiscountCodes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ codes: data || [] });
  } catch (err) { safeError(res, err, 'Could not load discount codes'); }
};

// ── POST /api/admin/discount-codes ────────────────────────────────────────────
// body: { code, percent_off, max_discount_ngn?, max_uses?, expires_at? }
const createDiscountCode = async (req, res) => {
  try {
    const { code, percent_off, max_discount_ngn, max_uses, expires_at, banner_enabled, banner_text } = req.body;

    const cleanCode = normalizeCode(code);
    if (!cleanCode) return res.status(400).json({ error: 'Code is required' });
    if (!/^[A-Z0-9_-]{3,32}$/.test(cleanCode)) {
      return res.status(400).json({ error: 'Code must be 3-32 characters: letters, numbers, - or _ only' });
    }

    const pct = Number(percent_off);
    if (!Number.isInteger(pct) || pct <= 0 || pct > 100) {
      return res.status(400).json({ error: 'Percent off must be a whole number between 1 and 100' });
    }

    let maxDiscount = null;
    if (max_discount_ngn !== undefined && max_discount_ngn !== null && max_discount_ngn !== '') {
      maxDiscount = Number(max_discount_ngn);
      if (!Number.isFinite(maxDiscount) || maxDiscount <= 0) {
        return res.status(400).json({ error: 'Max discount must be a positive number' });
      }
    }

    let maxUses = null;
    if (max_uses !== undefined && max_uses !== null && max_uses !== '') {
      maxUses = Number(max_uses);
      if (!Number.isInteger(maxUses) || maxUses <= 0) {
        return res.status(400).json({ error: 'Max uses must be a positive whole number' });
      }
    }

    let expiresAt = null;
    if (expires_at) {
      const d = new Date(expires_at);
      if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid expiry date' });
      expiresAt = d.toISOString();
    }

    const wantsBanner = banner_enabled === true;
    let bannerText = null;
    if (wantsBanner) {
      bannerText = String(banner_text || '').trim();
      if (!bannerText) return res.status(400).json({ error: 'Banner text is required when the banner is enabled' });
      if (bannerText.length > 140) return res.status(400).json({ error: 'Banner text must be 140 characters or fewer' });
    }

    const { data: existing } = await supabase
      .from('discount_codes').select('id').eq('code', cleanCode).maybeSingle();
    if (existing) return res.status(409).json({ error: `Code "${cleanCode}" already exists` });

    // Only one banner can be live at a time — turn off any other active banner
    // so admins don't end up stacking multiple promo strips unintentionally.
    if (wantsBanner) {
      await supabase.from('discount_codes').update({ banner_enabled: false }).eq('banner_enabled', true);
    }

    const { data, error } = await supabase
      .from('discount_codes')
      .insert({
        code: cleanCode,
        percent_off: pct,
        max_discount_ngn: maxDiscount,
        max_uses: maxUses,
        expires_at: expiresAt,
        banner_enabled: wantsBanner,
        banner_text: bannerText,
        created_by: req.user?.id || null,
      })
      .select()
      .single();
    if (error) throw error;

    console.log('discount code created:', cleanCode, 'by', req.user?.email || 'admin', wantsBanner ? '(banner enabled)' : '');
    res.json({ ok: true, code: data });
  } catch (err) { safeError(res, err, 'Could not create discount code'); }
};

// ── PUT /api/admin/discount-codes/:id ─────────────────────────────────────────
// Only supports toggling is_active — codes aren't otherwise editable once
// created, to keep redemption history/audit trail meaningful.
const toggleDiscountCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, banner_enabled } = req.body;

    if (is_active === undefined && banner_enabled === undefined) {
      return res.status(400).json({ error: 'Provide is_active and/or banner_enabled' });
    }
    if (is_active !== undefined && typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be true or false' });
    }
    if (banner_enabled !== undefined && typeof banner_enabled !== 'boolean') {
      return res.status(400).json({ error: 'banner_enabled must be true or false' });
    }

    if (banner_enabled === true) {
      const { data: target } = await supabase.from('discount_codes').select('banner_text').eq('id', id).maybeSingle();
      if (!target?.banner_text) {
        return res.status(400).json({ error: 'This code has no banner text set. Recreate it with banner text, or edit banner_text first.' });
      }
      // Only one banner live at a time
      await supabase.from('discount_codes').update({ banner_enabled: false }).eq('banner_enabled', true).neq('id', id);
    }

    const patch = { updated_at: new Date().toISOString() };
    if (is_active !== undefined) patch.is_active = is_active;
    if (banner_enabled !== undefined) patch.banner_enabled = banner_enabled;

    const { data, error } = await supabase
      .from('discount_codes')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Discount code not found' });

    res.json({ ok: true, code: data });
  } catch (err) { safeError(res, err, 'Could not update discount code'); }
};

// ── DELETE /api/admin/discount-codes/:id ──────────────────────────────────────
const deleteDiscountCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('discount_codes').delete().eq('id', id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) { safeError(res, err, 'Could not delete discount code'); }
};

// ── Shared validation used by paymentController at checkout time ─────────────
// Returns { valid: true, discount } or { valid: false, error }.
// This is the ONLY place discount validity is decided — never trust a
// discount amount sent from the frontend.
const validateDiscountCode = async (rawCode) => {
  const cleanCode = normalizeCode(rawCode);
  if (!cleanCode) return { valid: false, error: 'No code provided' };

  const { data: discount } = await supabase
    .from('discount_codes').select('*').eq('code', cleanCode).maybeSingle();

  if (!discount)           return { valid: false, error: 'Invalid discount code' };
  if (!discount.is_active) return { valid: false, error: 'This discount code is no longer active' };
  if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
    return { valid: false, error: 'This discount code has expired' };
  }
  if (discount.max_uses !== null && discount.used_count >= discount.max_uses) {
    return { valid: false, error: 'This discount code has reached its usage limit' };
  }

  return { valid: true, discount };
};

// Applies a validated discount to an NGN fee, respecting the optional cap.
// Returns { discountedNGN, discountAmountNGN }.
const applyDiscountToFeeNGN = (feeNGN, discount) => {
  let discountAmount = Math.round(feeNGN * (discount.percent_off / 100));
  if (discount.max_discount_ngn && discountAmount > discount.max_discount_ngn) {
    discountAmount = discount.max_discount_ngn;
  }
  discountAmount = Math.min(discountAmount, feeNGN); // never go negative
  return { discountedNGN: feeNGN - discountAmount, discountAmountNGN: discountAmount };
};

// Records a redemption and increments used_count. Called only after payment
// is confirmed (in verifyCardFee), never at initialization time — so an
// abandoned checkout doesn't burn a use.
const recordDiscountRedemption = async ({ discountId, cardSlug, txRef, email, amountBeforeNGN, amountAfterNGN }) => {
  try {
    await supabase.from('discount_code_redemptions').insert({
      discount_code_id: discountId,
      card_slug: cardSlug,
      tx_ref: txRef,
      email,
      amount_before_ngn: amountBeforeNGN,
      amount_after_ngn: amountAfterNGN,
    });
    // Increment used_count via a plain read-then-write; contention risk is
    // negligible at this volume, and worst case a fast-expiring max_uses
    // code is off by one, not a security issue.
    const { data: current } = await supabase
      .from('discount_codes').select('used_count').eq('id', discountId).maybeSingle();
    if (current) {
      await supabase.from('discount_codes')
        .update({ used_count: (current.used_count || 0) + 1 })
        .eq('id', discountId);
    }
  } catch (err) {
    console.error('recordDiscountRedemption error:', err.message);
  }
};

// ── Public: currently active promo banner (if any) ────────────────────────────
// Only returns a banner for a code that is genuinely still usable — banner_enabled
// alone isn't enough, since an admin may forget to disable a banner on a code
// that has since expired or hit its usage cap.
const getActiveBanner = async (req, res) => {
  try {
    const { data: discount } = await supabase
      .from('discount_codes').select('*').eq('banner_enabled', true).maybeSingle();

    if (!discount) return res.json({ banner: null });

    const stillValid =
      discount.is_active &&
      (!discount.expires_at || new Date(discount.expires_at) >= new Date()) &&
      (discount.max_uses === null || discount.used_count < discount.max_uses);

    if (!stillValid) return res.json({ banner: null });

    res.json({
      banner: {
        text: discount.banner_text,
        code: discount.code,
        percent_off: discount.percent_off,
      },
    });
  } catch (err) {
    console.error('getActiveBanner error:', err.message);
    res.json({ banner: null }); // fail silent — a broken banner should never block the site
  }
};

module.exports = {
  listDiscountCodes,
  createDiscountCode,
  toggleDiscountCode,
  deleteDiscountCode,
  validateDiscountCode,
  applyDiscountToFeeNGN,
  recordDiscountRedemption,
  getActiveBanner,
};
