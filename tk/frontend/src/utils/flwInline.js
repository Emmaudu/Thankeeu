/**
 * flwInline.js — Flutterwave Inline JS checkout utility
 *
 * Uses the FLW hosted v3.js script (loaded on demand) instead of the
 * redirect-based /v3/payments API. This avoids flwlnk- payment links
 * which expire after 30 minutes.
 *
 * Usage:
 *   import { openFlwCheckout } from '../utils/flwInline';
 *
 *   openFlwCheckout({
 *     flwConfig,          // object returned by backend initContribution
 *     onSuccess: (txRef) => { ... },   // payment confirmed by FLW
 *     onClose:   ()      => { ... },   // user closed modal without paying
 *   });
 */

const FLW_SCRIPT_URL = 'https://checkout.flutterwave.com/v3.js';
const FLW_SCRIPT_ID  = 'flw-inline-script';

// Load the FLW script once and cache the promise
let _scriptPromise = null;

function loadFlwScript() {
  if (_scriptPromise) return _scriptPromise;
  _scriptPromise = new Promise((resolve, reject) => {
    if (document.getElementById(FLW_SCRIPT_ID)) {
      // Already loaded
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id    = FLW_SCRIPT_ID;
    script.src   = FLW_SCRIPT_URL;
    script.async = true;
    script.onload  = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Flutterwave checkout script'));
    document.head.appendChild(script);
  });
  return _scriptPromise;
}

/**
 * Open the FLW inline checkout modal.
 *
 * @param {object} options
 * @param {object} options.flwConfig  - Config returned by backend initContribution { public_key, tx_ref, amount, currency, customer, customizations, meta }
 * @param {function} options.onSuccess - Called with tx_ref when FLW reports successful payment
 * @param {function} options.onClose   - Called when user closes the modal without completing payment
 */
export async function openFlwCheckout({ flwConfig, onSuccess, onClose }) {
  await loadFlwScript();

  if (typeof window.FlutterwaveCheckout !== 'function') {
    throw new Error('FlutterwaveCheckout is not available. Please refresh and try again.');
  }

  // FlutterwaveCheckout() returns an object with a .close() method (per FLW docs).
  // We call modal.close() immediately in the callback so the modal disappears
  // automatically after payment — the user never has to close it manually.
  // After close, we call onSuccess() which verifies and shows the success screen.
  // Flutterwave fires `callback` ONLY when a payment attempt completes. If the
  // user dismisses the modal without paying, `onclose` is the only thing that
  // fires. This used to be an empty stub, so a cancelled payment never told the
  // caller anything — every caller's `finally` never ran and their button sat
  // on "Opening payment…" forever. Track whether we already settled, so exactly
  // one of onSuccess/onClose runs, whichever path the user took.
  let settled = false;
  const settle = (fn, arg) => {
    if (settled) return;
    settled = true;
    try { fn && fn(arg); } catch (e) { console.error('[flwInline] handler threw:', e); }
  };

  const modal = window.FlutterwaveCheckout({
    ...flwConfig,
    callback: async (response) => {
      // Close the modal immediately — it disappears, user sees the page again.
      try { modal.close(); } catch (_) { /* already gone */ }
      if (response && (response.status === 'successful' || response.status === 'completed')) {
        settle(onSuccess, response.tx_ref || flwConfig.tx_ref);
      } else {
        // A failed or abandoned attempt is a cancel from the caller's point of view.
        settle(onClose);
      }
    },
    onclose: () => {
      // Reached when the user closes the modal. If the callback already settled
      // this (a completed payment), `settle` is a no-op; otherwise this is a
      // genuine cancellation and the caller must be released.
      settle(onClose);
    },
  });

  return modal;
}
