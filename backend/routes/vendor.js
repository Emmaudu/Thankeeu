const express = require('express');
const router  = express.Router();
const { vendorAuth } = require('../middleware/vendorAuth');
const { upload } = require('../utils/cloudinary');
const v = require('../controllers/vendorController');
const { adminAuth } = require('../middleware/auth');

// Public
router.post('/signup',         v.vendorSignup);
router.get('/public',          v.listPublicVendors);   // for product gift picker in SignCard
router.post('/login',          v.vendorLogin);
router.get('/store/:slug',     v.getPublicStore);
router.post('/store/:slug/order', v.placeOrder);

// Vendor dashboard (auth required)
router.get('/me',              vendorAuth, v.getMyStore);
router.put('/me',              vendorAuth, v.updateStore);
router.get('/products',        vendorAuth, v.getProducts);
router.post('/products/upload-image', vendorAuth, upload.single('image'), v.uploadProductImage);
router.post('/products',       vendorAuth, v.createProduct);
router.put('/products/:id',    vendorAuth, v.updateProduct);
router.delete('/products/:id', vendorAuth, v.deleteProduct);
router.get('/orders',          vendorAuth, v.getOrders);
router.put('/orders/:id',      vendorAuth, v.updateOrderStatus);
router.get('/analytics',       vendorAuth, v.getAnalytics);
router.get('/support',         vendorAuth, v.getVendorTickets);
router.post('/support',        vendorAuth, v.createVendorTicket);
router.put('/me/password',     vendorAuth, v.changeVendorPassword);

// Public: vendor clicks verify link from email
router.get('/verify-email', v.vendorVerifyEmail);

// Admin
router.get('/admin/vendors',                       adminAuth, v.adminListVendors);
router.put('/admin/vendors/:id/status',            adminAuth, v.adminUpdateVendorStatus);
router.get('/admin/orders',                        adminAuth, v.adminListOrders);
router.post('/admin/vendors/:id/resend-verify',    adminAuth, v.adminResendVerification);
router.post('/admin/vendors/:id/verify-activate',  adminAuth, v.adminVerifyActivate);

// Checkout flow
router.post('/store/:slug/checkout',    v.checkoutOrder);     // initiate FLW payment
router.get('/order-verify',             v.verifyVendorOrder); // verify after FLW redirect

// Banner upload (vendor auth)
router.post('/me/upload-banner', vendorAuth, upload.single('image'), v.uploadBannerImage);

module.exports = router;
