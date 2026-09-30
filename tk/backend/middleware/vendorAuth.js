const jwt      = require('jsonwebtoken');
const supabase = require('../utils/supabase');

const vendorAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.tk_vendor || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'vendor') return res.status(403).json({ error: 'Vendor token required' });
    const { data: vendor } = await supabase.from('vendors')
      .select('id, business_name, email, slug, category, status, logo_url')
      .eq('id', decoded.vendorId).maybeSingle();
    if (!vendor || vendor.status !== 'approved') return res.status(403).json({ error: 'Vendor account not approved' });
    req.vendor = vendor;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { vendorAuth };
