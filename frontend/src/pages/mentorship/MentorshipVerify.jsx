import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { useSEO } from '../../hooks/useSEO';
import { mentorshipAPI } from '../../utils/api';

export default function MentorshipVerify() {
  useSEO({ title: 'Confirming payment — Thankeeu Mentorship', noIndex: true });
  const [params] = useSearchParams();
  const [state, setState] = useState('checking'); // checking | success | failed

  useEffect(() => {
    const txRef = params.get('tx_ref');
    if (!txRef) { setState('failed'); return; }
    mentorshipAPI.verifySub(txRef)
      .then(res => setState(res.data?.ok ? 'success' : 'failed'))
      .catch(() => setState('failed'));
  }, [params]);

  return (
    <div className="bg-warm-50 min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-card p-8 text-center">
        {state === 'checking' && (
          <>
            <Icon name="Loader" size={40} className="animate-spin text-primary-500 mx-auto mb-4" />
            <h1 className="font-display font-extrabold text-xl text-warm-900">Confirming your payment…</h1>
            <p className="text-warm-500 text-sm mt-1">One moment, please don't close this page.</p>
          </>
        )}
        {state === 'success' && (
          <>
            <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-teal-50 text-teal-600 mb-5">
              <Icon name="Check" size={32} />
            </span>
            <h1 className="font-display font-extrabold text-2xl text-warm-900 mb-2">Payment confirmed!</h1>
            <p className="text-warm-500 leading-relaxed mb-6">
              Your mentorship is secured. Our team will be in touch to schedule your child's first session.
            </p>
            <Link to="/" className="block w-full py-3.5 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600">Back to home</Link>
          </>
        )}
        {state === 'failed' && (
          <>
            <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-5">
              <Icon name="X" size={32} />
            </span>
            <h1 className="font-display font-extrabold text-2xl text-warm-900 mb-2">We couldn't confirm payment</h1>
            <p className="text-warm-500 leading-relaxed mb-6">
              If you were charged, don't worry — reach out and we'll sort it out right away.
            </p>
            <div className="space-y-2.5">
              <Link to="/pricing" className="block w-full py-3.5 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600">Try again</Link>
              <Link to="/contact" className="block w-full py-3 rounded-xl border-2 border-primary-200 text-primary-700 font-bold hover:bg-primary-50">Contact support</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
