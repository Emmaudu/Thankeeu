const axios = require('axios');
const crypto = require('crypto');

const PAYSTACK_BASE = 'https://api.paystack.co';
const SECRET = process.env.PAYSTACK_SECRET_KEY;

const paystackAxios = axios.create({
  baseURL: PAYSTACK_BASE,
  headers: {
    Authorization: `Bearer ${SECRET}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Initialize a Paystack payment transaction
 */
const initializePayment = async ({ email, amount, reference, metadata = {}, callbackUrl }) => {
  const { data } = await paystackAxios.post('/transaction/initialize', {
    email,
    amount: Math.round(amount * 100), // Convert to kobo
    reference,
    metadata,
    callback_url: callbackUrl || `${process.env.FRONTEND_URL}/payment/callback`,
  });
  return data.data; // { authorization_url, access_code, reference }
};

/**
 * Verify a Paystack transaction
 */
const verifyPayment = async (reference) => {
  const { data } = await paystackAxios.get(`/transaction/verify/${reference}`);
  return data.data; // full transaction object
};

/**
 * Transfer funds to a tasker's bank account (Paystack Transfer API)
 */
const createTransferRecipient = async ({ accountNumber, bankCode, name }) => {
  const { data } = await paystackAxios.post('/transferrecipient', {
    type: 'nuban',
    name,
    account_number: accountNumber,
    bank_code: bankCode,
    currency: 'NGN',
  });
  return data.data; // { recipient_code, ... }
};

const initiateTransfer = async ({ amount, recipientCode, reason, reference }) => {
  const { data } = await paystackAxios.post('/transfer', {
    source: 'balance',
    amount: Math.round(amount * 100),
    recipient: recipientCode,
    reason,
    reference,
  });
  return data.data;
};

/**
 * Get list of Nigerian banks from Paystack
 */
const listBanks = async () => {
  const { data } = await paystackAxios.get('/bank?country=nigeria&perPage=100');
  return data.data;
};

/**
 * Resolve bank account number
 */
const resolveAccountNumber = async (accountNumber, bankCode) => {
  const { data } = await paystackAxios.get(
    `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
  );
  return data.data; // { account_name, account_number }
};

/**
 * Verify Paystack webhook signature
 */
const verifyWebhookSignature = (payload, signature) => {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  return hash === signature;
};

/**
 * Generate a unique payment reference
 */
const generateReference = (prefix = 'SLB') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
};

module.exports = {
  initializePayment,
  verifyPayment,
  createTransferRecipient,
  initiateTransfer,
  listBanks,
  resolveAccountNumber,
  verifyWebhookSignature,
  generateReference,
};
