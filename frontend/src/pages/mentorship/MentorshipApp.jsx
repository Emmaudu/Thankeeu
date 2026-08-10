import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MentorshipNavbar, MentorshipFooter } from './MentorshipChrome';
import MentorshipHome from './MentorshipHome';
import MentorshipHowItWorks from './MentorshipHowItWorks';
import MentorshipPricing from './MentorshipPricing';
import MentorshipAbout from './MentorshipAbout';
import MentorshipContact from './MentorshipContact';
import MentorshipApply from './MentorshipApply';
import MentorshipApplySuccess from './MentorshipApplySuccess';
import MentorshipVerify from './MentorshipVerify';
import MentorshipAdminLogin from './MentorshipAdminLogin';
import MentorshipAdmin from './MentorshipAdmin';

// Public pages share the navbar + footer. Admin pages render bare.
export default function MentorshipApp() {
  const loc = useLocation();
  const isAdmin = loc.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin/login" element={<MentorshipAdminLogin />} />
        <Route path="/admin" element={<MentorshipAdmin />} />
        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MentorshipNavbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<MentorshipHome />} />
          <Route path="/how-it-works" element={<MentorshipHowItWorks />} />
          <Route path="/pricing" element={<MentorshipPricing />} />
          <Route path="/about" element={<MentorshipAbout />} />
          <Route path="/contact" element={<MentorshipContact />} />
          <Route path="/apply" element={<MentorshipApply />} />
          <Route path="/apply/success" element={<MentorshipApplySuccess />} />
          <Route path="/subscribe/verify" element={<MentorshipVerify />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <MentorshipFooter />
    </div>
  );
}
