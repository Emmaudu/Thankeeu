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

  window.FlutterwaveCheckout({
    ...flwConfig,
    callback: (response) => {
      // FLW calls this when payment is attempted (success or failed)
      // response.status: 'successful' | 'cancelled' | 'failed'
      if (response.status === 'successful' || response.status === 'completed') {
        onSuccess(response.tx_ref || flwConfig.tx_ref);
      } else {
        // Payment failed or cancelled inside modal
        onClose && onClose();
      }
    },
    onclose: () => {
      // User closed the modal without completing
      onClose && onClose();
    },
  });
}
