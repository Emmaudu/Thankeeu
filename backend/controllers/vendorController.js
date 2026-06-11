/**
 * Vendor Marketplace Controller
 * Handles vendor registration, storefronts, products, orders, analytics
 */
'use strict';
const supabase    = require('../utils/supabase');
const argon2      = require('argon2');
const crypto      = require('crypto');
const { sendEmail } = require('../utils/email');
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://thankeeu.com').replace(/\/$/, '');

// ── Vendor signup / onboarding ───────────────────────────────────────────────
const vendorSignup = async (req, res) => {
  try {
    const { business_name, email, password, phone, category, description, slug: rawSlug } = req.body;
    if (!business_name || !email || !password) return res.status(400).json({ error: 'business_name, email and password are required' });

    const slug = (rawSlug || business_name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check slug + email unique
    const { data: existing } = await supabase.from('vendors').select('id').or(`email.eq.${email},slug.eq.${slug}`).maybeSingle();
    if (existing) return res.status(409).json({ error: 'Email or store URL already taken' });

    const password_hash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
    const verifyToken   = crypto.randomBytes(32).toString('hex');

    const { data: vendor, error } = await supabase.from('vendors').insert({
      business_name, email: email.toLowerCase().trim(), password_hash,
      phone, category: category || 'general', description, slug,
      status: 'pending',      // pending → approved by admin
      verify_token: verifyToken, is_verified: false,
    }).select().single();
    if (error) throw error;

    await sendEmail({ to: email, template: 'vendorWelcome', data: {
      name: business_name, slug, appUrl: FRONTEND_URL,
      verifyUrl: `${FRONTEND_URL}/vendor/verify-email?token=${verifyToken}`,
    }}).catch(() => {});

    res.json({ message: 'Vendor account created! Check your email to verify, then await admin approval.', vendor_id: vendor.id, slug });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const vendorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: vendor } = await supabase.from('vendors').select('*').eq('email', email.toLowerCase()).single();
    if (!vendor) return res.status(401).json({ error: 'Invalid email or password' });
    if (!vendor.is_verified) return res.status(403).json({ error: 'Please verify your email first' });
    if (vendor.status !== 'approved') return res.status(403).json({ error: `Your store is ${vendor.status}. Contact support.` });

    const valid = vendor.password_hash?.startsWith('$argon2')
      ? await argon2.verify(vendor.password_hash, password)
      : await require('bcryptjs').compare(password, vendor.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    // Re-hash legacy bcrypt
    if (!vendor.password_hash?.startsWith('$argon2')) {
      const newHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
      await supabase.from('vendors').update({ password_hash: newHash }).eq('id', vendor.id);
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ vendorId: vendor.id, type: 'vendor', slug: vendor.slug }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const safe  = { id: vendor.id, business_name: vendor.business_name, email: vendor.email, slug: vendor.slug, category: vendor.category, logo_url: vendor.logo_url, status: vendor.status };

    res.cookie('tk_vendor', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'none', maxAge: 7*86400000, path: '/' });
    res.json({ token, vendor: safe });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Store / products ─────────────────────────────────────────────────────────
const getMyStore = async (req, res) => {
  try {
    const { data } = await supabase.from('vendors').select('*, vendor_products(count)').eq('id', req.vendor.id).single();
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateStore = async (req, res) => {
  try {
    const allowed = ['business_name','description','phone','address','logo_url','banner_url','social_links','delivery_info','return_policy'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const { data, error } = await supabase.from('vendors').update({ ...updates, updated_at: new Date() }).eq('id', req.vendor.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getProducts = async (req, res) => {
  try {
    const { data } = await supabase.from('vendor_products').select('*').eq('vendor_id', req.vendor.id).order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, images, stock, is_available = true } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'name and price are required' });
    const { data, error } = await supabase.from('vendor_products').insert({
      vendor_id: req.vendor.id, name, description, price: Number(price),
      category: category || req.vendor.category, images: images || [],
      stock: stock ?? null, is_available,
    }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['name','description','price','category','images','stock','is_available','featured'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const { data, error } = await supabase.from('vendor_products').update({ ...updates, updated_at: new Date() })
      .eq('id', id).eq('vendor_id', req.vendor.id).select().single();
    if (error || !data) return res.status(404).json({ error: 'Product not found' });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteProduct = async (req, res) => {
  try {
    await supabase.from('vendor_products').delete().eq('id', req.params.id).eq('vendor_id', req.vendor.id);
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Orders ───────────────────────────────────────────────────────────────────
const getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let q = supabase.from('vendor_orders').select('*, vendor_order_items(*, vendor_products(name, price, images))').eq('vendor_id', req.vendor.id).order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data } = await q;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_number, notes } = req.body;
    const VALID = ['confirmed','processing','shipped','delivered','cancelled'];
    if (!VALID.includes(status)) return res.status(400).json({ error: `status must be one of: ${VALID.join(', ')}` });

    const { data, error } = await supabase.from('vendor_orders')
      .update({ status, tracking_number, notes, updated_at: new Date() })
      .eq('id', id).eq('vendor_id', req.vendor.id).select('*, customer_email, customer_name').single();
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
  } catch (err) { res.status(500).json({ error: err.message }); }
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
    const revenue    = allOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total_amount || 0), 0);
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
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Public storefront (no auth) ──────────────────────────────────────────────
const getPublicStore = async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: vendor } = await supabase.from('vendors')
      .select('id, business_name, slug, description, logo_url, banner_url, category, address, social_links, delivery_info, return_policy, status')
      .eq('slug', slug).eq('status', 'approved').single();
    if (!vendor) return res.status(404).json({ error: 'Store not found' });

    const { data: products } = await supabase.from('vendor_products')
      .select('id, name, description, price, category, images, stock, featured')
      .eq('vendor_id', vendor.id).eq('is_available', true).order('featured', { ascending: false });

    // Log store view (fire-and-forget)
    supabase.from('vendor_store_views').insert({ vendor_id: vendor.id, path: `/c/${slug}` }).then(() => {}).catch(() => {});

    res.json({ vendor, products: products || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Order placement (public, tied to card) ───────────────────────────────────
const placeOrder = async (req, res) => {
  try {
    const { slug } = req.params;
    const { items, customer_name, customer_email, customer_phone, delivery_address, card_slug, note } = req.body;

    if (!items?.length || !customer_email) return res.status(400).json({ error: 'items and customer_email are required' });

    const { data: vendor } = await supabase.from('vendors').select('id, business_name').eq('slug', slug).eq('status', 'approved').single();
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
      platform_fee: 5000,
      vendor_payout: Math.max(0, total - 5000),  // Thankeeu keeps ₦5000
      status: 'pending',
    }).select().single();
    if (error) throw error;

    await supabase.from('vendor_order_items').insert(lineItems.map(li => ({ ...li, order_id: order.id })));

    await sendEmail({ to: customer_email, template: 'orderConfirm', data: {
      name: customer_name || 'Customer', orderId: order.id.slice(0,8).toUpperCase(),
      storeName: vendor.business_name, total: `₦${total.toLocaleString()}`,
      items: lineItems, storeUrl: `${FRONTEND_URL}/c/${slug}`,
    }}).catch(() => {});

    res.json({ order_id: order.id, total, message: 'Order placed! You will receive a confirmation email.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Admin: vendor management ─────────────────────────────────────────────────
const adminListVendors = async (req, res) => {
  try {
    const { status } = req.query;
    let q = supabase.from('vendors').select('id, business_name, email, slug, category, status, created_at').order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data } = await q;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const adminUpdateVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending','approved','suspended','rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const { data: vendor } = await supabase.from('vendors').update({ status }).eq('id', id).select('email, business_name').single();
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    if (status === 'approved') {
      await sendEmail({ to: vendor.email, template: 'vendorApproved', data: { name: vendor.business_name, dashUrl: `${FRONTEND_URL}/vendor/dashboard` }}).catch(() => {});
    }
    res.json({ message: `Vendor ${status}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
  } catch (err) { res.status(500).json({ error: err.message }); }
};


// Vendor support tickets
const getVendorTickets = async (req, res) => {
  try {
    const { data } = await supabase.from('vendor_support_tickets')
      .select('*').eq('vendor_id', req.vendor.id).order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const createVendorTicket = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message required' });
    const { data, error } = await supabase.from('vendor_support_tickets').insert({
      vendor_id: req.vendor.id, vendor_name: req.vendor.business_name,
      subject, message, status: 'open',
    }).select().single();
    if (error) throw error;
    // Notify admins via email
    await sendEmail({ to: process.env.ADMIN_EMAIL || 'admin@thankeeu.com',
      template: 'supportTicket',
      data: { name: req.vendor.business_name, subject, message, type: 'Vendor', ticketId: data.id }
    }).catch(() => {});
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Password change
const changeVendorPassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const { data: vendor } = await supabase.from('vendors').select('password_hash').eq('id', req.vendor.id).single();
    const valid = vendor?.password_hash?.startsWith('$argon2')
      ? await require('argon2').verify(vendor.password_hash, current_password)
      : await require('bcryptjs').compare(current_password, vendor.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const newHash = await require('argon2').hash(new_password, { type: require('argon2').argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
    await supabase.from('vendors').update({ password_hash: newHash }).eq('id', req.vendor.id);
    res.json({ message: 'Password changed successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = {
  listPublicVendors, vendorSignup, vendorLogin, getMyStore, updateStore,
  getProducts, createProduct, updateProduct, deleteProduct,
  getOrders, updateOrderStatus, getAnalytics,
  getPublicStore, placeOrder,
  adminListVendors, adminUpdateVendorStatus, adminListOrders,
  getVendorTickets, createVendorTicket, changeVendorPassword,
};
