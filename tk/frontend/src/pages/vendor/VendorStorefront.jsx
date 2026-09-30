import { useState, useEffect } from 'react';
import VendorLayout from './VendorLayout';
import Icon from '../../components/ui/Icon';
import { vendorAxios } from '../../utils/api';
import toast from 'react-hot-toast';

export default function VendorStorefront() {
  const [vendor, setVendor] = useState(null);
  const [copying, setCopying] = useState(false);
  const BASE = window.location.origin;

  useEffect(() => {
    const v = JSON.parse(localStorage.getItem('thankeeu_vendor')||'null');
    setVendor(v);
    vendorAxios.get('/vendor/me').then(r=>setVendor(r.data)).catch(()=>{});
  }, []);

  const storeUrl = vendor ? `${BASE}/c/${vendor.slug}` : '';

  const copy = () => {
    if (!storeUrl) return;
    navigator.clipboard.writeText(storeUrl);
    setCopying(true);
    toast.success('Link copied!');
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <VendorLayout title="Storefront" subtitle="Your public shop on Thankeeu">
      <div className="max-w-2xl">
        {/* Store URL */}
        <div className="bg-white rounded-2xl border border-purple-100 p-6 mb-6">
          <h3 className="font-semibold text-warm-900 mb-4">Your store link</h3>
          <div className="flex gap-3">
            <div className="flex-1 bg-purple-50 rounded-xl px-4 py-3 text-sm font-mono text-warm-700 truncate">
              {storeUrl || 'Loading...'}
            </div>
            <button onClick={copy} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${copying ? 'bg-green-500 text-white' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>
              <Icon name={copying ? 'Check' : 'Copy'} size={16}/>
              {copying ? 'Copied!' : 'Copy'}
            </button>
            <a href={storeUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-purple-200 text-sm font-semibold text-warm-600 hover:bg-purple-50">
              <Icon name="ExternalLink" size={16}/> Visit
            </a>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-br from-primary-50 to-pink-50 rounded-2xl border border-primary-100 p-6">
          <h3 className="font-semibold text-warm-900 mb-4 flex items-center gap-2">
            <Icon name="Zap" size={18} className="text-primary-500"/> Grow your store
          </h3>
          <div className="space-y-3">
            {[
              { icon:'Share', text:'Share your store link on WhatsApp, Instagram, and Facebook' },
              { icon:'Package', text:'Add high-quality product photos — stores with photos get 3× more orders' },
              { icon:'MapPin', text:'Set your country and state so customers nearby can find you' },
              { icon:'Tag', text:'Price competitively — most gift orders on Thankeeu are ₦3,000–₦25,000' },
              { icon:'Clock', text:'Update your delivery info so customers know when to expect their order' },
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Icon name={tip.icon} size={14} className="text-primary-600"/>
                </div>
                <p className="text-sm text-warm-700 leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
