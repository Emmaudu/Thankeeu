/**
 * Vendor Marketplace Controller
 * Handles vendor registration, storefronts, products, orders, analytics
 */
'use strict';
const supabase    = require('../utils/supabase');
const argon2      = require('argon2');
const crypto      = require('crypto');
const { sendEmail } = require('../utils/email');
const axios      = require('axios');
const {
  validateEmail, validatePassword, sanitizeName, sanitizePhone,
  sanitizeText, sanitizeSlug, isSanitizeError,
} = require('../utils/sanitize');
const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
  return (s.startsWith('http') ? s : 'https://thankeeu.com');
})();

// ── Vendor signup / onboarding ───────────────────────────────────────────────
const vendorSignup = async (req, res) => {
  try {
    const raw = req.body;

    // ── Sanitize & validate ───────────────────────────────────────────────
    const cleanEmail    = validateEmail(raw.email);
    const cleanPassword = validatePassword(raw.password);
    const cleanName     = sanitizeName(raw.business_name, 'Business name', { maxLen: 120 });
    const cleanPhone    = sanitizePhone(raw.phone);
    const cleanCategory = sanitizeText(raw.category, 'Category', { maxLen: 60 });
    const cleanDesc     = sanitizeText(raw.description, 'Description', { maxLen: 1000 });
    const cleanSlug     = sanitizeSlug(raw.slug || raw.business_name, 'Store URL', { maxLen: 80 });
    // ─────────────────────────────────────────────────────────────────────

    // Check slug + email unique
    const { data: existing } = await supabase.from('vendors').select('id')
      .or(`email.eq.${cleanEmail},slug.eq.${cleanSlug}`).maybeSingle();
    if (existing) return res.status(409).json({ error: 'Email or store URL already taken' });

    const password_hash = await argon2.hash(cleanPassword, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
    const verifyToken   = crypto.randomBytes(32).toString('hex');

    const { data: vendor, error } = await supabase.from('vendors').insert({
      business_name: cleanName, email: cleanEmail, password_hash,
      phone: cleanPhone, category: cleanCategory || 'general',
      description: cleanDesc, slug: cleanSlug,
      status: 'pending',
      verify_token: verifyToken, is_verified: false,
    }).select().maybeSingle();
    if (error) throw error;

    await sendEmail({ to: cleanEmail, template: 'vendorWelcome', data: {
      name: cleanName, slug: cleanSlug, appUrl: FRONTEND_URL,
      verifyUrl: `${FRONTEND_URL}/vendor/verify-email?token=${verifyToken}`,
    }}).catch(() => {});

    res.json({ message: 'Vendor account created! Check your email to verify, then await admin approval.', vendor_id: vendor.id, slug: cleanSlug });
  } catch (err) {
    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
    res.status(500).json({ error: 'Vendor operation failed' });
  }
};

const vendorLogin = async (req, res) => {
  try {
    const cleanEmail    = validateEmail(req.body.email);
    const cleanPassword = validatePassword(req.body.password);

    const { data: vendor } = await supabase.from('vendors').select('*').eq('email', cleanEmail).maybeSingle();
    if (!vendor) return res.status(401).json({ error: 'Invalid email or password' });
    if (!vendor.is_verified) return res.status(403).json({ error: 'Please verify your email first' });
    if (vendor.status !== 'approved') return res.status(403).json({ error: `Your store is ${vendor.status}. Contact support.` });

    const valid = vendor.password_hash?.startsWith('$argon2')
      ? await argon2.verify(vendor.password_hash, cleanPassword)
      : await require('bcryptjs').compare(cleanPassword, vendor.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    // Re-hash legacy bcrypt
    if (!vendor.password_hash?.startsWith('$argon2')) {
      const newHash = await argon2.hash(cleanPassword, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
      await supabase.from('vendors').update({ password_hash: newHash }).eq('id', vendor.id);
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ vendorId: vendor.id, type: 'vendor', slug: vendor.slug }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const safe  = { id: vendor.id, business_name: vendor.business_name, email: vendor.email, slug: vendor.slug, category: vendor.category, logo_url: vendor.logo_url, status: vendor.status };

    res.cookie('tk_vendor', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'none', maxAge: 7*86400000, path: '/' });
    res.json({ token, vendor: safe });
  } catch (err) {
    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
    res.status(500).json({ error: 'Vendor operation failed' });
  }
};

// ── Store / products ─────────────────────────────────────────────────────────
const getMyStore = async (req, res) => {
  try {
    const { data } = await supabase.from('vendors').select('*, vendor_products(count)').eq('id', req.vendor.id).maybeSingle();
    res.json(data);
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};

const updateStore = async (req, res) => {
  try {
    const allowed = ['business_name','description','phone','address','country','state','logo_url','banner_url','social_links','delivery_info','return_policy'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const { data, error } = await supabase.from('vendors').update({ ...updates, updated_at: new Date() }).eq('id', req.vendor.id).select().maybeSingle();
    if (error) throw error;
    res.json(data);
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};

const getProducts = async (req, res) => {
  try {
    const { data } = await supabase.from('vendor_products').select('*').eq('vendor_id', req.vendor.id).order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};

const createProduct = async (req, res) => {
  try {
    const { sanitizeName, sanitizeText, isSanitizeError } = require('../utils/sanitize');
    const raw = req.body;
    const cleanName  = sanitizeName(raw.name, 'Product name', { required: true, maxLen: 150 });
    const cleanDesc  = sanitizeText(raw.description, 'Description', { required: false, maxLen: 2000 });
    const cleanCat   = raw.category ? sanitizeText(raw.category, 'Category', { maxLen: 60 }) : null;
    const price      = parseFloat(raw.price);
    const stock      = raw.stock != null ? parseInt(raw.stock) : null;
    if (!cleanName || !isFinite(price) || price <= 0)
      return res.status(400).json({ error: 'name and a valid price are required' });
    if (price > 10_000_000) return res.status(400).json({ error: 'Price too high' });
    if (stock !== null && (!Number.isInteger(stock) || stock < 0))
      return res.status(400).json({ error: 'Stock must be a non-negative integer' });
    const is_available = raw.is_available !== false;
    const { data, error } = await supabase.from('vendor_products').insert({
      vendor_id: req.vendor.id, name: cleanName, description: cleanDesc, price,
      category: cleanCat || req.vendor.category, images: Array.isArray(raw.images) ? raw.images : [],
      stock, is_available,
    }).select().maybeSingle();
    if (error) throw error;
    res.json(data);
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { sanitizeName, sanitizeText } = require('../utils/sanitize');
    const raw = req.body;
    const updates = { updated_at: new Date() };
    if (raw.name        !== undefined) updates.name        = sanitizeName(raw.name, 'Name', { required: true, maxLen: 150 });
    if (raw.description !== undefined) updates.description = sanitizeText(raw.description, 'Description', { maxLen: 2000 });
    if (raw.category    !== undefined) updates.category    = sanitizeText(raw.category, 'Category', { maxLen: 60 });
    if (raw.price       !== undefined) {
      const p = parseFloat(raw.price);
      if (!isFinite(p) || p <= 0 || p > 10_000_000) return res.status(400).json({ error: 'Invalid price' });
      updates.price = p;
    }
    if (raw.stock !== undefined) {
      const s = raw.stock === null ? null : parseInt(raw.stock);
      if (s !== null && (!Number.isInteger(s) || s < 0)) return res.status(400).json({ error: 'Invalid stock value' });
      updates.stock = s;
    }
    if (raw.is_available !== undefined) updates.is_available = !!raw.is_available;
    if (raw.featured     !== undefined) updates.featured     = !!raw.featured;
    if (raw.images       !== undefined) updates.images       = Array.isArray(raw.images) ? raw.images : [];
    const { data, error } = await supabase.from('vendor_products').update(updates)
      .eq('id', id).eq('vendor_id', req.vendor.id).select().maybeSingle();
    if (error || !data) return res.status(404).json({ error: 'Product not found' });
    res.json(data);
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};

const deleteProduct = async (req, res) => {
  try {
    await supabase.from('vendor_products').delete().eq('id', req.params.id).eq('vendor_id', req.vendor.id);
    res.json({ message: 'Product deleted' });
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};

// ── Orders ───────────────────────────────────────────────────────────────────
const getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let q = supabase.from('vendor_orders').select('*, vendor_order_items(*, vendor_products(name, price, images))').eq('vendor_id', req.vendor.id).order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data } = await q;
    res.json(data || []);
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_number, notes } = req.body;
    const VALID = ['confirmed','processing','shipped','delivered','cancelled'];
    if (!VALID.includes(status)) return res.status(400).json({ error: `status must be one of: ${VALID.join(', ')}` });

    const { data, error } = await supabase.from('vendor_orders')
      .update({ status, tracking_number, notes, updated_at: new Date() })
      .eq('id', id).eq('vendor_id', req.vendor.id).select('*, customer_email, customer_name').maybeSingle();
    if (error || !data) return res.status(404).json({ error: 'Order not found' });

    // Notify customer on key status changes
    if (['shipped','delivered'].includes(status) && data.customer_email) {
      await sendEmail({ to: data.customer_email, template: 'orderStatusUpdate', data: {
        name:        data.customer_name || 'Customer',
        orderId:     id.slice(0, 8).toUpperCase(),
        status,
        tracking:    tracking_number || '',
        storeUrl:    `${FRONTEND_URL}/c/${req.vendor.slug}`,
      }}).catch(() => {});
    }
    res.json(data);
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};

// ── Analytics ────────────────────────────────────────────────────────────────
const getAnalytics = async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const [orders, products, views] = await Promise.all([
      supabase.from('vendor_orders').select('total_amount, status, created_at').eq('vendor_id', vendorId),
      supabase.from('vendor_products').select('id, name, is_available').eq('vendor_id', vendorId),
      supabase.from('vendor_store_views').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId),
    ]);
    const allOrders  = orders.data || [];
    // Revenue = all PAID orders (anything past 'pending'/'cancelled'), not just
    // 'delivered' — otherwise the dashboard shows ₦0 until every order is
    // manually marked delivered, even though payment has been received.
    const PAID_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered'];
    const revenue    = allOrders.filter(o => PAID_STATUSES.includes(o.status)).reduce((s, o) => s + (o.total_amount || 0), 0);
    const pending    = allOrders.filter(o => ['confirmed','processing','shipped'].includes(o.status)).length;
    const totalProds = (products.data || []).length;
    const activeProds= (products.data || []).filter(p => p.is_available).length;

    res.json({
      revenue_total:   revenue,
      orders_total:    allOrders.length,
      orders_pending:  pending,
      store_views:     views.count || 0,
      products_total:  totalProds,
      products_active: activeProds,
      orders_by_status: ['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => ({
        status: s, count: allOrders.filter(o => o.status === s).length,
      })),
    });
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};

// ── Public storefront (no auth) ──────────────────────────────────────────────
const getPublicStore = async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: vendor } = await supabase.from('vendors')
      .select('id, business_name, slug, description, logo_url, banner_url, category, address, country, state, phone, social_links, delivery_info, return_policy, status')
      .eq('slug', slug).eq('status', 'approved').maybeSingle();
    if (!vendor) return res.status(404).json({ error: 'Store not found or not yet active' });

    const { data: products } = await supabase.from('vendor_products')
      .select('id, name, description, price, category, images, stock, featured')
      .eq('vendor_id', vendor.id).eq('is_available', true).order('featured', { ascending: false });

    // Log store view (fire-and-forget)
    (async () => { try { await supabase.from('vendor_store_views').insert({ vendor_id: vendor.id, path: `/c/${slug}` }); } catch (_) {} })();

    res.json({ vendor, products: products || [] });
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};

// ── Order placement (public, tied to card) ───────────────────────────────────
const placeOrder = async (req, res) => {
  try {
    const { slug } = req.params;
    const { validateEmail, sanitizeName, sanitizePhone, sanitizeText } = require('../utils/sanitize');
    const raw = req.body;
    const customer_email = raw.customer_email ? validateEmail(raw.customer_email) : null;
    const customer_name  = raw.customer_name ? sanitizeName(raw.customer_name, 'Customer name', { required: false, maxLen: 100 }) : null;
    const customer_phone = raw.customer_phone ? sanitizePhone(raw.customer_phone) : null;
    const delivery_address = raw.delivery_address ? sanitizeText(raw.delivery_address, 'Delivery address', { maxLen: 300 }) : null;
    const note = raw.note ? sanitizeText(raw.note, 'Note', { maxLen: 500 }) : null;
    const card_slug = raw.card_slug || null;
    const items = raw.items;

    if (!items?.length || !customer_email) return res.status(400).json({ error: 'items and customer_email are required' });

    const { data: vendor } = await supabase.from('vendors').select('id, business_name, email').eq('slug', slug).eq('status', 'approved').maybeSingle();
    if (!vendor) return res.status(404).json({ error: 'Store not found' });

    const productIds = items.map(i => i.product_id);
    const { data: prods } = await supabase.from('vendor_products').select('id, name, price, stock').in('id', productIds).eq('vendor_id', vendor.id).eq('is_available', true);
    const prodMap = Object.fromEntries((prods || []).map(p => [p.id, p]));

    let total = 0;
    const lineItems = items.map(item => {
      const prod = prodMap[item.product_id];
      if (!prod) throw new Error(`Product ${item.product_id} not found`);
      const qty = Math.max(1, Number(item.quantity) || 1);
      total += prod.price * qty;
      return { product_id: prod.id, product_name: prod.name, quantity: qty, unit_price: prod.price, subtotal: prod.price * qty };
    });

    const { data: order, error } = await supabase.from('vendor_orders').insert({
      vendor_id: vendor.id, customer_name, customer_email, customer_phone,
      delivery_address, card_slug, note,
      total_amount: total,
      status: 'pending',
    }).select().maybeSingle();
    if (error) throw error;

    await supabase.from('vendor_order_items').insert(lineItems.map(li => ({ ...li, order_id: order.id })));

    await sendEmail({ to: customer_email, template: 'orderConfirm', data: {
      name: customer_name || 'Customer', orderId: order.id.slice(0,8).toUpperCase(),
      storeName: vendor.business_name, total: `₦${total.toLocaleString()}`,
      items: lineItems, storeUrl: `${FRONTEND_URL}/c/${slug}`,
    }}).catch(() => {});

    // ── Notify vendor: new order to fulfil, with delivery deadline ──────────
    // Deadline = the celebrant's celebration date (card.send_date), falling
    // back to card.deadline, then 5 days from now if neither is set.
    if (vendor.email) {
      let deadlineDate = null;
      let recipientName = null;
      let occasionLabel = null;
      if (card_slug) {
        try {
          const { data: cardRow } = await supabase.from('cards')
            .select('send_date, deadline, recipient_name, occasion')
            .eq('slug', card_slug).maybeSingle();
          if (cardRow) {
            deadlineDate  = cardRow.send_date || cardRow.deadline || null;
            recipientName = cardRow.recipient_name || null;
            occasionLabel = cardRow.occasion ? String(cardRow.occasion).replace(/_/g, ' ') : null;
          }
        } catch (_) { /* card lookup is best-effort */ }
      }
      const deadline = deadlineDate ? new Date(deadlineDate) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const deadlineLabel = deadline.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

      await sendEmail({ to: vendor.email, template: 'vendorOrderNotification', data: {
        vendorName:    vendor.business_name,
        orderId:       order.id.slice(0,8).toUpperCase(),
        customerName:  customer_name || 'A Thankeeu customer',
        customerEmail: customer_email,
        customerPhone: customer_phone || '',
        deliveryAddress: delivery_address || 'Not provided — contact the customer',
        items: lineItems,
        total: `₦${total.toLocaleString()}`,
        vendorPayout: `₦${Math.max(0, total - 5000).toLocaleString()}`,
        deadlineLabel,
        recipientName,
        occasionLabel,
        ordersUrl: `${FRONTEND_URL}/vendor/orders`,
      }}).catch(() => {});
    }

    res.json({ order_id: order.id, total, message: 'Order placed! You will receive a confirmation email.' });
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};


// ── POST /api/vendor/store/:slug/checkout ────────────────────────────────────
// Creates a Flutterwave payment for a full cart. Returns { payment_link, tx_ref, order_id }
const checkoutOrder = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      items, customer_name, customer_email, customer_phone,
      delivery_address, card_slug, note, currency: reqCurrency,
    } = req.body;

    if (!items?.length)         return res.status(400).json({ error: 'Cart is empty' });
    if (!customer_email?.trim()) return res.status(400).json({ error: 'Email is required for checkout' });
    if (!customer_name?.trim())  return res.status(400).json({ error: 'Name is required for checkout' });

    const signerName  = customer_name.trim();
    const signerEmail = customer_email.trim();

    const { data: vendor } = await supabase.from('vendors')
      .select('id, business_name, email, slug')
      .eq('slug', slug).eq('status', 'approved').maybeSingle();
    if (!vendor) return res.status(404).json({ error: 'Store not found or not active' });

    // Validate products
    const productIds = items.map(i => i.product_id);
    const { data: prods } = await supabase.from('vendor_products')
      .select('id, name, price, stock, is_available')
      .in('id', productIds).eq('vendor_id', vendor.id);
    const prodMap = Object.fromEntries((prods||[]).map(p => [p.id, p]));

    let total = 0;
    const lineItems = items.map(item => {
      const prod = prodMap[item.product_id];
      if (!prod)               throw new Error(`Product not found in this store`);
      if (!prod.is_available)  throw new Error(`"${prod.name}" is no longer available`);
      const qty = Math.max(1, Number(item.quantity) || 1);
      total += prod.price * qty;
      return { product_id: prod.id, product_name: prod.name, quantity: qty, unit_price: prod.price, subtotal: prod.price * qty };
    });

    let cardDetails = null;
    if (card_slug) {
      const { data: cardRow, error: cardErr } = await supabase.from('cards')
        .select('recipient_name, recipient_email, send_date, deadline, occasion, status')
        .eq('slug', card_slug)
        .maybeSingle();
      if (cardErr) throw cardErr;
      if (!cardRow) return res.status(404).json({ error: 'Card not found for this gift order' });
      if (cardRow.status === 'sent')
        return res.status(400).json({ error: 'This card has already been delivered — gift orders are closed.' });
      cardDetails = cardRow;
    }

    // Create pending order FIRST (so we have an order_id for the tx_ref)
    const orderPayload = {
      vendor_id: vendor.id,
      customer_name: signerName,
      customer_email: signerEmail,
      customer_phone,
      signer_name: signerName,
      signer_email: signerEmail,
      recipient_name: cardDetails?.recipient_name || null,
      recipient_email: cardDetails?.recipient_email || null,
      delivery_address,
      card_slug,
      note: card_slug ? null : note,
      total_amount: total,
      status: 'pending',
    };
    let { data: order, error: orderErr } = await supabase.from('vendor_orders').insert(orderPayload).select().maybeSingle();

    // If the signer/recipient columns don't exist yet (migration not run),
    // retry without them rather than failing the whole gift order.
    if (orderErr && /column .* does not exist/i.test(orderErr.message || '')) {
      const { signer_name, signer_email, recipient_name, recipient_email, ...fallbackPayload } = orderPayload;
      ({ data: order, error: orderErr } = await supabase.from('vendor_orders').insert(fallbackPayload).select().maybeSingle());
    }
    if (orderErr) throw orderErr;

    await supabase.from('vendor_order_items')
      .insert(lineItems.map(li => ({ ...li, order_id: order.id })));

    // Build FLW payment
    const FLW_BASE = 'https://api.flutterwave.com/v3';
    const txRef    = `TK-VND-${order.id.slice(0,8).toUpperCase()}-${Date.now()}`;
    const currency = ['NGN','GHS','KES','USD','GBP','EUR','ZAR'].includes(reqCurrency) ? reqCurrency : 'NGN';

    // Store tx_ref on order for webhook/verify
    await supabase.from('vendor_orders').update({ flw_reference: txRef }).eq('id', order.id);

    const payload = {
      tx_ref:       txRef,
      amount:       total,
      currency,
      redirect_url: card_slug
        ? `${FRONTEND_URL}/sign/${card_slug}?product_tx_ref=${txRef}`
        : `${FRONTEND_URL}/vendor/order-success?tx_ref=${txRef}`,
      customer:     { email: signerEmail, name: signerName, phonenumber: customer_phone || '' },
      customizations: {
        title:       `${vendor.business_name} — Thankeeu`,
        description: `${lineItems.length} item${lineItems.length !== 1 ? 's' : ''}`,
        logo:        `${FRONTEND_URL}/favicon.svg`,
      },
      meta: {
        type:       'vendor_order',
        order_id:   order.id,
        vendor_id:  vendor.id,
        vendor_slug: slug,
      },
    };

    const flwRes = await axios.post(`${FLW_BASE}/payments`, payload, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    if (flwRes.data.status !== 'success') {
      throw new Error(flwRes.data.message || 'Payment gateway error');
    }

    res.json({
      payment_link: flwRes.data.data.link,
      tx_ref:       txRef,
      order_id:     order.id,
      total,
    });
  } catch (err) {
    console.error('checkoutOrder error:', err?.code || 'unknown');
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

    res.status(500).json({ error: 'Vendor operation failed' });
  }
};

// ── GET /api/vendor/order-verify?tx_ref=... ──────────────────────────────────
// Called after FLW redirect for vendor store orders. SignCard also calls this
// when a product gift payment returns to /sign/:slug?product_tx_ref=...
const verifyVendorOrder = async (req, res) => {
  try {
    const { tx_ref } = req.query;
    if (!tx_ref) return res.status(400).json({ error: 'tx_ref required' });

    // Find order by flw_reference
    const { data: order, error: orderLookupErr } = await supabase.from('vendor_orders')
      .select('*, vendors:vendor_id(business_name, email, slug)')
      .eq('flw_reference', tx_ref).maybeSingle();

    if (orderLookupErr) {
      console.error('verifyVendorOrder lookup error for ref:', txRef);
      return res.status(500).json({ error: 'Could not look up order. Please contact support.' });
    }

    if (!order) return res.status(404).json({ error: 'Order not found' });
    // If already confirmed/processed, return success without re-processing
    if (['confirmed','processing','shipped','delivered'].includes(order.status)) {
      return res.json({ ok: true, order_id: order.id, status: order.status, already_verified: true });
    }

    // Verify with FLW
    const FLW_BASE = 'https://api.flutterwave.com/v3';
    const verifyRes = await axios.get(`${FLW_BASE}/transactions/verify_by_reference?tx_ref=${tx_ref}`, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
      timeout: 15000,
    });

    const txData     = verifyRes.data?.data;
    const paid       = verifyRes.data?.status === 'success' && txData?.status === 'successful';
    const amountPaid = Number(txData?.amount || 0);
    const amountDue  = Number(order.total_amount || 0);

    if (!paid) {
      await supabase.from('vendor_orders').update({ status: 'cancelled' }).eq('id', order.id);
      return res.status(400).json({ error: 'Payment was not completed', order_id: order.id });
    }

    // Verify amount paid matches order total (within 1 unit tolerance for rounding)
    if (amountDue > 0 && amountPaid < amountDue - 1) {
      console.warn(`verifyVendorOrder: underpayment for order ${order.id}. Due: ${amountDue}, Paid: ${amountPaid}`);
      await supabase.from('vendor_orders').update({ status: 'cancelled' }).eq('id', order.id);
      return res.status(400).json({ error: `Underpayment detected. Paid: ${amountPaid}, Required: ${amountDue}`, order_id: order.id });
    }

    // Atomically claim the confirmation — only one concurrent call can flip
    // status from 'pending' to 'confirmed'. Without this, two near-
    // simultaneous calls (e.g. the frontend retrying after FLW redirect)
    // would both pass the earlier "already confirmed" check, both pass FLW
    // verification (which is itself idempotent), and both send duplicate
    // confirmation emails to the customer and vendor.
    const { data: claimed, error: claimErr } = await supabase.from('vendor_orders')
      .update({ status: 'confirmed', updated_at: new Date() })
      .eq('id', order.id).eq('status', order.status)
      .select('id').maybeSingle();

    if (claimErr || !claimed) {
      // Someone else already confirmed it between our read and write
      return res.json({ ok: true, order_id: order.id, status: 'confirmed', already_verified: true });
    }

    // Get line items for notifications
    const { data: lineItems } = await supabase.from('vendor_order_items')
      .select('product_name, quantity, unit_price, subtotal').eq('order_id', order.id);

    // Send customer confirmation
    await sendEmail({ to: order.customer_email, template: 'orderConfirm', data: {
      name: order.customer_name || 'Customer',
      orderId: order.id.slice(0,8).toUpperCase(),
      storeName: order.vendors?.business_name || 'the store',
      total: `₦${Number(order.total_amount).toLocaleString('en-NG')}`,
      items: lineItems || [],
      storeUrl: `${FRONTEND_URL}/c/${order.vendors?.slug || ''}`,
    }}).catch(() => {});

    // Notify vendor with deadline
    if (order.vendors?.email) {
      let deadlineLabel = 'As soon as possible';
      let recipientName = order.recipient_name || null;
      let recipientEmail = order.recipient_email || null;
      let occasionLabel = null;
      if (order.card_slug) {
        try {
          const { data: card } = await supabase.from('cards')
            .select('send_date, deadline, recipient_name, recipient_email, occasion').eq('slug', order.card_slug).maybeSingle();
          if (card) {
            const d = card.send_date || card.deadline;
            if (d) deadlineLabel = new Date(d).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
            recipientName = recipientName || card.recipient_name;
            recipientEmail = recipientEmail || card.recipient_email;
            occasionLabel = card.occasion ? String(card.occasion).replace(/_/g, ' ') : null;
          }
        } catch(_) {}
      }

      await sendEmail({ to: order.vendors.email, template: 'vendorOrderNotification', data: {
        vendorName:      order.vendors.business_name,
        orderId:         order.id.slice(0,8).toUpperCase(),
        signerName:      order.signer_name || order.customer_name || 'A customer',
        signerEmail:     order.signer_email || order.customer_email,
        customerName:    order.signer_name || order.customer_name || 'A customer',
        customerEmail:   order.signer_email || order.customer_email,
        customerPhone:   order.customer_phone || '',
        deliveryAddress: order.delivery_address || 'Contact customer for address',
        items:           lineItems || [],
        total:           `₦${Number(order.total_amount).toLocaleString('en-NG')}`,
        vendorPayout:    `₦${Math.max(0, Number(order.total_amount) - 5000).toLocaleString('en-NG')}`,
        deadlineLabel,
        recipientName,
        recipientEmail,
        occasionLabel,
        ordersUrl:       `${FRONTEND_URL}/vendor/orders`,
      }}).catch(() => {});
    }

    res.json({ ok: true, order_id: order.id, status: 'confirmed', vendor_slug: order.vendors?.slug });
  } catch (err) {
    console.error('verifyVendorOrder error:', err?.code || err?.response?.status || 'unknown');
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

    res.status(500).json({ error: 'Vendor operation failed' });
  }
};

// ── POST /api/vendor/me/upload-banner ────────────────────────────────────────
const uploadBannerImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { secure_url } = req.file;
    await supabase.from('vendors').update({ banner_url: secure_url, updated_at: new Date() }).eq('id', req.vendor.id);
    res.json({ url: secure_url });
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};

// ── Admin: vendor management ─────────────────────────────────────────────────
const adminListVendors = async (req, res) => {
  try {
    const { status } = req.query;
    let q = supabase.from('vendors').select('id, business_name, email, slug, category, status, is_verified, created_at').order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data } = await q;
    res.json(data || []);
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};

const adminUpdateVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending','approved','suspended','rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const { data: vendor } = await supabase.from('vendors').update({ status }).eq('id', id).select('email, business_name').maybeSingle();
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    if (status === 'approved') {
      await sendEmail({ to: vendor.email, template: 'vendorApproved', data: { name: vendor.business_name, dashUrl: `${FRONTEND_URL}/vendor/dashboard` }}).catch(() => {});
    }
    res.json({ message: `Vendor ${status}` });
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};


// GET /api/vendor/public — list approved vendors with optional filters
const listPublicVendors = async (req, res) => {
  try {
    const { country, category, search } = req.query;
    let q = supabase.from('vendors')
      .select('id, business_name, slug, category, country, state, description, logo_url, delivery_info')
      .eq('status', 'approved')
      .order('business_name', { ascending: true });
    if (country)  q = q.ilike('country', `%${country}%`);
    if (category) q = q.eq('category', category);
    if (search)   q = q.ilike('business_name', `%${search}%`);
    const { data } = await q;
    res.json(data || []);
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};


// Vendor support tickets
const getVendorTickets = async (req, res) => {
  try {
    const { data } = await supabase.from('vendor_support_tickets')
      .select('*').eq('vendor_id', req.vendor.id).order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};

const createVendorTicket = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message required' });
    const { data, error } = await supabase.from('vendor_support_tickets').insert({
      vendor_id: req.vendor.id, vendor_name: req.vendor.business_name,
      subject, message, status: 'open',
    }).select().maybeSingle();
    if (error) throw error;
    // Notify admins via email
    await sendEmail({ to: process.env.ADMIN_EMAIL || 'admin@thankeeu.com',
      template: 'supportTicket',
      data: { name: req.vendor.business_name, subject, message, type: 'Vendor', ticketId: data.id }
    }).catch(() => {});
    res.json(data);
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};

// Password change
const changeVendorPassword = async (req, res) => {
  try {
    const { current_password } = req.body;
    if (!current_password || !req.body.new_password)
      return res.status(400).json({ error: 'Both current and new passwords are required' });
    const { validatePassword, isSanitizeError } = require('../utils/sanitize');
    const new_password = validatePassword(req.body.new_password, 'New password');
    const { data: vendor } = await supabase.from('vendors').select('password_hash').eq('id', req.vendor.id).maybeSingle();
    if (!vendor) return res.status(404).json({ error: 'Account not found' });
    const valid = vendor?.password_hash?.startsWith('$argon2')
      ? await require('argon2').verify(vendor.password_hash, current_password)
      : await require('bcryptjs').compare(current_password, vendor.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const newHash = await require('argon2').hash(new_password, { type: require('argon2').argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
    await supabase.from('vendors').update({ password_hash: newHash }).eq('id', req.vendor.id);
    res.json({ message: 'Password changed successfully' });
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};


const adminListOrders = async (req, res) => {
  try {
    const { data } = await supabase
      .from('vendor_orders')
      .select('*, vendors(business_name)')
      .order('created_at', { ascending: false })
      .limit(200);
    const orders = (data || []).map(o => ({ ...o, vendor_name: o.vendors?.business_name }));
    res.json(orders);
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};


// ── GET /api/vendor/verify-email?token= — vendor clicks link from email ───────
const vendorVerifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Verification token is required' });

    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('id, email, business_name, is_verified, status')
      .eq('verify_token', token)
      .maybeSingle();

    if (error) throw error;
    if (!vendor) {
      return res.status(400).json({ error: 'Invalid or already-used verification link. Contact support or ask admin to resend.' });
    }
    if (vendor.is_verified) {
      return res.json({ ok: true, already_verified: true, message: 'Email already verified. You can log in once admin approves your store.' });
    }

    // Mark verified and set status approved so vendor can log in immediately
    const { error: updateErr } = await supabase.from('vendors').update({
      is_verified:  true,
      status:       'approved',
      verify_token: null,          // clear token so it cannot be reused
      updated_at:   new Date(),
    }).eq('id', vendor.id);

    if (updateErr) throw updateErr;

    // Send approval confirmation email
    await sendEmail({
      to:       vendor.email,
      template: 'vendorApproved',
      data:     { name: vendor.business_name, dashUrl: `${FRONTEND_URL}/vendor/dashboard` },
    }).catch(() => {});

    res.json({ ok: true, message: 'Email verified! Your store is now active. You can log in to your dashboard.', vendor_id: vendor.id });
  } catch (err) {
    console.error('vendorVerifyEmail error:', err.message);
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

    res.status(500).json({ error: 'Vendor operation failed' });
  }
};

// ── POST /api/vendor/admin/vendors/:id/resend-verification ───────────────────
// Admin resends the verification email with a fresh token
const adminResendVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: vendor } = await supabase
      .from('vendors').select('id, email, business_name, is_verified').eq('id', id).maybeSingle();
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    if (vendor.is_verified) return res.status(400).json({ error: 'Vendor is already verified' });

    // Generate a fresh token
    const verifyToken = require('crypto').randomBytes(32).toString('hex');
    const { error } = await supabase.from('vendors').update({
      verify_token: verifyToken,
      updated_at:   new Date(),
    }).eq('id', id);
    if (error) throw error;

    // Resend the verification email
    await sendEmail({
      to:       vendor.email,
      template: 'vendorWelcome',
      data: {
        name:      vendor.business_name,
        slug:      '', // slug shown in email footer only
        appUrl:    FRONTEND_URL,
        verifyUrl: `${FRONTEND_URL}/vendor/verify-email?token=${verifyToken}`,
      },
    });

    res.json({ ok: true, message: `Verification email resent to ${vendor.email}` });
  } catch (err) {
    console.error('adminResendVerification error:', err.message);
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

    res.status(500).json({ error: 'Vendor operation failed' });
  }
};

// ── POST /api/vendor/admin/vendors/:id/verify-activate ──────────────────────
// Admin manually verifies + activates vendor (bypasses email verification)
const adminVerifyActivate = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: vendor } = await supabase
      .from('vendors').select('id, email, business_name, is_verified, status').eq('id', id).maybeSingle();
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    const { error } = await supabase.from('vendors').update({
      is_verified:  true,
      status:       'approved',
      verify_token: null,
      updated_at:   new Date(),
    }).eq('id', id);
    if (error) throw error;

    // Notify vendor their store is live
    await sendEmail({
      to:       vendor.email,
      template: 'vendorApproved',
      data:     { name: vendor.business_name, dashUrl: `${FRONTEND_URL}/vendor/dashboard` },
    }).catch(() => {});

    res.json({
      ok:      true,
      message: `${vendor.business_name} is now verified and approved. They can log in immediately.`,
    });
  } catch (err) {
    console.error('adminVerifyActivate error:', err.message);
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

    res.status(500).json({ error: 'Vendor operation failed' });
  }
};

// POST /api/vendor/products/upload-image — returns a hosted URL for product image carousel
const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const url = req.file.path?.startsWith('http')
      ? req.file.path
      : `${FRONTEND_URL}/uploads/${require('path').basename(req.file.path)}`;
    res.json({ url });
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Vendor operation failed' }); }
};

module.exports = {
  listPublicVendors, vendorSignup, vendorLogin, getMyStore, updateStore,
  getProducts, createProduct, updateProduct, deleteProduct,
  getOrders, updateOrderStatus, getAnalytics,
  getPublicStore, placeOrder,
  checkoutOrder, verifyVendorOrder, uploadBannerImage,
  adminListVendors, adminUpdateVendorStatus, adminListOrders, uploadProductImage,
  vendorVerifyEmail, adminResendVerification, adminVerifyActivate,
  getVendorTickets, createVendorTicket, changeVendorPassword,
};
