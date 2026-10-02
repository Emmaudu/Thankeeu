const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

const FLW_BASE = 'https://api.flutterwave.com/v3';

// ── Static-IP egress via Fixie (or any HTTPS proxy) ───────────────
// Flutterwave requires transfers/payouts to originate from a whitelisted
// static IP. Railway has no fixed outbound IP, so we route Flutterwave
// requests through Fixie, whose static IPs you whitelist in the
// Flutterwave dashboard (Settings → API → IP Whitelisting).
//
// Set FIXIE_URL to the proxy URL Fixie gives you, e.g.
//   http://fixie:PASSWORD@olympic.usefixie.com:80
// (HTTPS_PROXY / HTTP_PROXY are also honoured as fallbacks.) When none is
// set, calls go out directly (fine for local dev and for payment
// collection, which is not IP-restricted).
const PROXY_URL = (process.env.FIXIE_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '').trim();
let proxyAgent = null;
if (PROXY_URL) {
  try {
    proxyAgent = new HttpsProxyAgent(PROXY_URL);
  } catch (e) {
    console.error('[flutterwave] Invalid proxy URL in FIXIE_URL/HTTPS_PROXY — ignoring:', e.message);
  }
}
let loggedProxyOnce = false;
const logProxyOnce = () => {
  if (loggedProxyOnce) return;
  loggedProxyOnce = true;
  if (proxyAgent) {
    // Never log credentials — just the host so you can confirm it's active.
    let host = 'configured';
    try { host = new URL(PROXY_URL).host; } catch (_) {}
    console.log(`[flutterwave] Routing API calls through static-IP proxy (${host}) for Flutterwave IP whitelisting.`);
  } else {
    console.log('[flutterwave] No static-IP proxy set (FIXIE_URL). Transfers will use the dynamic Railway IP — set FIXIE_URL and whitelist it in Flutterwave to enable reliable payouts.');
  }
};

// Defensive: strip accidental wrapping quotes and whitespace that commonly get
// pasted into Railway's env var UI (e.g. "FLWSECK-xxx" with literal quotes,
// or a trailing newline) — these cause Flutterwave to reject the key with 401.
const SECRET = () => {
  const raw = process.env.FLUTTERWAVE_SECRET_KEY || '';
  return raw.trim().replace(/^['"]|['"]$/g, '');
};

let loggedKeyShape = false;
const logKeyShapeOnce = () => {
  if (loggedKeyShape) return;
  loggedKeyShape = true;
  const raw = process.env.FLUTTERWAVE_SECRET_KEY || '';
  const cleaned = SECRET();
  if (raw !== cleaned) {
    console.warn('[flutterwave] FLUTTERWAVE_SECRET_KEY had surrounding quotes/whitespace — stripped automatically.');
  }
  if (cleaned) {
    const mode = cleaned.startsWith('FLWSECK_TEST') ? 'TEST' : cleaned.startsWith('FLWSECK') ? 'LIVE' : 'UNKNOWN-FORMAT';
    console.log(`[flutterwave] Using secret key in ${mode} mode (prefix: ${cleaned.slice(0, 12)}..., length: ${cleaned.length}).`);
  } else {
    console.warn('[flutterwave] FLUTTERWAVE_SECRET_KEY is empty.');
  }
};

class BankProviderUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BankProviderUnavailableError';
    this.code = 'BANK_PROVIDER_UNAVAILABLE';
    this.status = 503;
  }
}

const hasUsableSecret = () => {
  const secret = SECRET();
  return Boolean(secret && !/^(undefined|null|your_|test_key|sk_test_xxx)$/i.test(secret));
};

const flwAxios = () => {
  logKeyShapeOnce();
  logProxyOnce();
  return axios.create({
    baseURL: FLW_BASE,
    headers: {
      Authorization: `Bearer ${SECRET()}`,
      'Content-Type': 'application/json',
    },
    // Route through the static-IP proxy when configured. httpsAgent handles
    // the TLS connection to Flutterwave; proxy:false stops axios from also
    // trying to apply its own proxy handling on top of the agent.
    ...(proxyAgent ? { httpsAgent: proxyAgent, proxy: false } : {}),
  });
};

const NIGERIAN_BANK_FALLBACK = [
  ['Abbey Mortgage Bank', '801'],
  ['Access Bank', '044'],
  ['Access Bank (Diamond)', '063'],
  ['ALAT by Wema', '035A'],
  ['ASO Savings and Loans', '401'],
  ['Citibank Nigeria', '023'],
  ['Coronation Merchant Bank', '559'],
  ['Ecobank Nigeria', '050'],
  ['Fidelity Bank', '070'],
  ['First Bank of Nigeria', '011'],
  ['First City Monument Bank', '214'],
  ['Globus Bank', '00103'],
  ['Guaranty Trust Bank', '058'],
  ['Heritage Bank', '030'],
  ['Jaiz Bank', '301'],
  ['Keystone Bank', '082'],
  ['Kuda Microfinance Bank', '090267'],
  ['Lotus Bank', '303'],
  ['Moniepoint MFB', '090405'],
  ['Opay Digital Services', '100004'],
  ['Optimus Bank', '107'],
  ['PalmPay', '100033'],
  ['Parallex Bank', '104'],
  ['Polaris Bank', '076'],
  ['PremiumTrust Bank', '105'],
  ['Providus Bank', '101'],
  ['Rand Merchant Bank', '502'],
  ['Stanbic IBTC Bank', '221'],
  ['Standard Chartered Bank', '068'],
  ['Sterling Bank', '232'],
  ['SunTrust Bank', '100'],
  ['Titan Trust Bank', '102'],
  ['Union Bank of Nigeria', '032'],
  ['United Bank for Africa', '033'],
  ['Unity Bank', '215'],
  ['VFD Microfinance Bank', '090110'],
  ['Wema Bank', '035'],
  ['Zenith Bank', '057'],
].map(([name, code], id) => ({ name, code, id: `fallback-${id}` }))
  .sort((a, b) => a.name.localeCompare(b.name));

// ── Generate unique transaction reference ─────────────────────────
const generateReference = (prefix = 'TKU') => {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${ts}_${rand}`;
};

// ── Initialize payment (returns payment link) ─────────────────────
const initializePayment = async ({ email, amount, currency = 'NGN', reference, metadata = {}, callbackUrl, customerName }) => {
  if (!hasUsableSecret()) {
    const err = new Error('Flutterwave secret key is not configured on the server (FLUTTERWAVE_SECRET_KEY missing or placeholder).');
    err.code = 'FLW_NO_SECRET';
    throw err;
  }
  const frontendUrl = (process.env.FRONTEND_URL || '').trim().replace(/\/$/, '');
  if (!frontendUrl) {
    const err = new Error('FRONTEND_URL is not set on the server — required to build the payment redirect_url.');
    err.code = 'FLW_NO_FRONTEND_URL';
    throw err;
  }

  try {
    const { data } = await flwAxios().post('/payments', {
      tx_ref: reference,
      amount,
      currency,
      redirect_url: callbackUrl || `${frontendUrl}/payment/callback`,
      customer: { email, name: customerName || email },
      meta: metadata,
      customizations: {
        title: 'Taskeeu',
        description: 'Secure payment via Taskeeu',
        logo: `${frontendUrl}/logo.svg`,
      },
    });
    if (!data.data?.link) {
      const err = new Error(data.message || 'Payment initialization failed');
      err.flwResponse = data;
      throw err;
    }
    return {
      authorization_url: data.data.link,
      tx_ref: reference,
    };
  } catch (err) {
    // Surface Flutterwave's actual error message (e.g. invalid key, currency not
    // enabled, account not activated) instead of letting axios swallow it into
    // a generic "Request failed with status code 4xx".
    if (err.flwResponse) throw err;
    const flwMessage = err?.response?.data?.message;
    const status = err?.response?.status;
    console.error('[flutterwave] raw error response:', JSON.stringify(err?.response?.data || {}), 'status:', status);
    let msg;
    if (flwMessage) {
      msg = `Flutterwave error (${status}): ${flwMessage}`;
    } else if (status === 401) {
      msg = 'Flutterwave rejected the request as unauthorized (401) with no message body — the FLUTTERWAVE_SECRET_KEY is invalid, revoked, or mismatched (e.g. test key on a live-only account). Re-copy the secret key from the Flutterwave dashboard and update it in Railway.';
    } else {
      msg = err.message || 'Payment initialization failed';
    }
    const detailed = new Error(msg);
    detailed.code = 'FLW_API_ERROR';
    detailed.status = status;
    detailed.flwResponse = err?.response?.data;
    throw detailed;
  }
};

// ── Verify payment by tx_ref ──────────────────────────────────────
const verifyPayment = async (txRef) => {
  const { data } = await flwAxios().get(`/transactions/verify_by_reference?tx_ref=${txRef}`);
  if (data.status !== 'success') throw new Error(data.message || 'Verification failed');
  return data.data; // { status, amount, currency, ... }
};

// ── Get banks for a country ───────────────────────────────────────
// country: 'NG', 'GH', 'KE', 'ZA', 'TZ', 'UG', 'RW', 'ZM', 'UK', 'US', etc.
const listBanks = async (country = 'NG') => {
  const normalizedCountry = String(country || 'NG').toUpperCase();

  if (!hasUsableSecret() && normalizedCountry === 'NG') {
    return NIGERIAN_BANK_FALLBACK;
  }

  try {
    const { data } = await flwAxios().get(`/banks/${normalizedCountry}`);
    const banks = Array.isArray(data.data) ? data.data : [];
    return banks
      .map(b => ({ name: b.name, code: b.code, id: b.id }))
      .filter(b => b.name && b.code)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    if (normalizedCountry === 'NG') return NIGERIAN_BANK_FALLBACK;
    throw err;
  }
};

// ── Resolve bank account number ───────────────────────────────────
const resolveAccountNumber = async (accountNumber, bankCode, country = 'NG') => {
  if (!hasUsableSecret()) {
    throw new BankProviderUnavailableError('Bank verification is temporarily unavailable. Your bank details can still be saved for manual review.');
  }

  try {
    const { data } = await flwAxios().post('/accounts/resolve', {
      account_number: accountNumber,
      account_bank: bankCode,
      country,
    });
    if (!data.data) throw new Error(data.message || 'Could not resolve account');
    return { account_name: data.data.account_name, account_number: data.data.account_number };
  } catch (err) {
    if ([401, 403].includes(err?.response?.status)) {
      throw new BankProviderUnavailableError('Bank verification is temporarily unavailable. Your bank details can still be saved for manual review.');
    }
    throw new Error(err?.response?.data?.message || err?.message || 'Could not resolve account');
  }
};

// ── Create transfer recipient and send funds ──────────────────────
// Errors thrown from here carry `err.ambiguous`:
//   false → Flutterwave definitely REJECTED the transfer (4xx / status!=success).
//           No money moved; the caller may safely roll back and let the user retry.
//   true  → no clear answer (timeout, network drop, 5xx). The transfer MAY have
//           gone through. Callers must NOT roll back, or a retry can pay twice.
const TRANSFER_TIMEOUT_MS = 45000;
const initiateTransfer = async ({ accountNumber, bankCode, accountName, amount, currency = 'NGN', narration, reference }) => {
  let data;
  try {
    ({ data } = await flwAxios().post('/transfers', {
      account_number: accountNumber,
      account_bank: bankCode,
      amount,
      narration: narration || 'Taskeeu payout',
      currency,
      reference,
      beneficiary_name: accountName,
      debit_currency: currency,
    }, { timeout: TRANSFER_TIMEOUT_MS }));
  } catch (e) {
    const httpStatus = e.response?.status;
    const err = new Error(e.response?.data?.message || e.message || 'Transfer failed');
    err.ambiguous = !e.response || httpStatus >= 500;
    err.httpStatus = httpStatus;
    throw err;
  }
  if (data?.status !== 'success') {
    const err = new Error(data?.message || 'Transfer failed');
    err.ambiguous = false;
    throw err;
  }
  return data.data;
};

// ── Verify webhook signature ──────────────────────────────────────
// ── Verify webhook signature ──────────────────────────────────────
// Flutterwave sends your FLUTTERWAVE_WEBHOOK_SECRET as the verif-hash header.
// Simply compare directly — no HMAC needed.
const verifyWebhookSignature = (payload, signature) => {
  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  return signature === secret;
};

// ── Supported countries for bank selection ────────────────────────
const SUPPORTED_COUNTRIES = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', flag: '🇷🇼' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW', flag: '🇿🇲' },
  { code: 'UK', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
];

module.exports = {
  generateReference,
  initializePayment,
  verifyPayment,
  listBanks,
  resolveAccountNumber,
  BankProviderUnavailableError,
  initiateTransfer,
  verifyWebhookSignature,
  SUPPORTED_COUNTRIES,
};
