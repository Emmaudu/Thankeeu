import { Link, useLocation } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { useSEO } from '../../hooks/useSEO';

export default function MentorshipApplySuccess() {
  useSEO({ title: 'Application received — Thankeeu Mentorship', noIndex: true });
  const { state } = useLocation();
  const name = state?.name?.split(' ')[0] || 'there';

  return (
    <div className="bg-warm-50 min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-card p-8 text-center">
        <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-teal-50 text-teal-600 mb-5">
          <Icon name="Check" size={32} />
        </span>
        <h1 className="font-display font-extrabold text-2xl text-warm-900 mb-2">Thank you, {name}!</h1>
        <p className="text-warm-500 leading-relaxed mb-6">
          We've received your application and sent a confirmation to your email. Our team will reach out shortly to match your child with the right mentor and walk you through the next steps.
        </p>
        <div className="space-y-2.5">
          <Link to="/pricing" className="block w-full py-3.5 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600">
            View pricing & secure a spot
          </Link>
          <Link to="/" className="block w-full py-3 rounded-xl border-2 border-primary-200 text-primary-700 font-bold hover:bg-primary-50">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
