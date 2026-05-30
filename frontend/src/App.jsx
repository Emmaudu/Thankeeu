import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth }               from './context/AuthContext';
import { CompanyAuthProvider, useCompanyAuth } from './context/CompanyAuthContext';
import { MemberAuthProvider, useMemberAuth }   from './context/MemberAuthContext';

// Individual user pages
import Home             from './pages/Home';
import Login            from './pages/Login';
import Signup           from './pages/Signup';
import ForgotPassword   from './pages/ForgotPassword';
import ResetPassword    from './pages/ResetPassword';
import Dashboard        from './pages/Dashboard';
import CreateCard       from './pages/CreateCard';
import CardView         from './pages/CardView';
import SignCard         from './pages/SignCard';
import Pricing          from './pages/Pricing';
import Policy           from './pages/Policy';
import Admin            from './pages/Admin';
import GiftCheckout     from './pages/GiftCheckout';
import NotFound         from './pages/NotFound';

// Company (HR) pages
import CompanySignup          from './pages/company/CompanySignup';
import CompanyLogin           from './pages/company/CompanyLogin';
import CompanyForgotPassword  from './pages/company/CompanyForgotPassword';
import CompanyResetPassword   from './pages/company/CompanyResetPassword';
import CompanyDashboard       from './pages/company/CompanyDashboard';
import TeamsPage              from './pages/company/TeamsPage';
import SubscriptionPage       from './pages/company/SubscriptionPage';
import SettingsPage           from './pages/company/SettingsPage';
import SupportPage            from './pages/company/SupportPage';
import MembersApprovalPage    from './pages/company/MembersApprovalPage';
import DeductionRequestsPage  from './pages/company/DeductionRequestsPage';
import HRISPage               from './pages/company/HRISPage';

// Team member / leader pages
import JoinCompanySignup      from './pages/member/JoinCompanySignup';
import JoinCompanyLogin       from './pages/member/JoinCompanyLogin';
import { JoinForgotPassword, JoinResetPassword } from './pages/member/JoinPasswordPages';
import MemberDashboard        from './pages/member/MemberDashboard';
import MemberOccasionsPage    from './pages/member/MemberOccasionsPage';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const CompanyProtectedRoute = ({ children }) => {
  const { company, loading } = useCompanyAuth();
  if (loading) return <Spinner />;
  if (!company) return <Navigate to="/company/login" replace />;
  return children;
};

const MemberProtectedRoute = ({ children, leaderOnly = false }) => {
  const { member, loading } = useMemberAuth();
  if (loading) return <Spinner />;
  if (!member) return <Navigate to="/member/login" replace />;
  if (leaderOnly && member.role !== 'team_leader') return <Navigate to="/member/dashboard" replace />;
  return children;
};

const App = () => (
  <AuthProvider>
    <CompanyAuthProvider>
      <MemberAuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-center"
            toastOptions={{
              className: 'font-sans text-sm',
              success: { iconTheme: { primary: '#7F77DD', secondary: '#fff' } },
              duration: 4000,
            }}
          />
          <Routes>
            {/* ── Public ─────────────────────────────────── */}
            <Route path="/"              element={<Home />} />
            <Route path="/pricing"       element={<Pricing />} />
            <Route path="/policy"        element={<Policy />} />
            <Route path="/card/:slug"    element={<CardView />} />
            <Route path="/sign/:slug"    element={<SignCard />} />
            <Route path="/gift/:slug"    element={<GiftCheckout />} />

            {/* ── Individual auth ─────────────────────────── */}
            <Route path="/login"             element={<Login />} />
            <Route path="/signup"            element={<Signup />} />
            <Route path="/forgot-password"   element={<ForgotPassword />} />
            <Route path="/reset-password"    element={<ResetPassword />} />

            {/* ── Individual protected ────────────────────── */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/create"    element={<ProtectedRoute><CreateCard /></ProtectedRoute>} />
            <Route path="/admin"     element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />

            {/* ── Company (HR) auth ────────────────────────── */}
            <Route path="/company/signup"           element={<CompanySignup />} />
            <Route path="/company/login"            element={<CompanyLogin />} />
            <Route path="/company/forgot-password"  element={<CompanyForgotPassword />} />
            <Route path="/company/reset-password"   element={<CompanyResetPassword />} />

            {/* ── Company (HR) protected ───────────────────── */}
            <Route path="/company/dashboard"   element={<CompanyProtectedRoute><CompanyDashboard /></CompanyProtectedRoute>} />
            <Route path="/company/teams"       element={<CompanyProtectedRoute><TeamsPage /></CompanyProtectedRoute>} />
            <Route path="/company/members"     element={<CompanyProtectedRoute><MembersApprovalPage /></CompanyProtectedRoute>} />
            <Route path="/company/deductions"  element={<CompanyProtectedRoute><DeductionRequestsPage /></CompanyProtectedRoute>} />
            <Route path="/company/subscription" element={<CompanyProtectedRoute><SubscriptionPage /></CompanyProtectedRoute>} />
            <Route path="/company/settings"    element={<CompanyProtectedRoute><SettingsPage /></CompanyProtectedRoute>} />
            <Route path="/company/support"     element={<CompanyProtectedRoute><SupportPage /></CompanyProtectedRoute>} />
          <Route path="/company/hris"        element={<CompanyProtectedRoute><HRISPage /></CompanyProtectedRoute>} />

            {/* ── Team member / leader auth ────────────────── */}
            <Route path="/member/signup"          element={<JoinCompanySignup />} />
            <Route path="/member/login"           element={<JoinCompanyLogin />} />
            <Route path="/member/forgot-password" element={<JoinForgotPassword />} />
            <Route path="/member/reset-password"  element={<JoinResetPassword />} />

            {/* ── Team member / leader protected ───────────── */}
            <Route path="/member/dashboard"  element={<MemberProtectedRoute><MemberDashboard /></MemberProtectedRoute>} />
            <Route path="/member/occasions"  element={<MemberProtectedRoute><MemberOccasionsPage /></MemberProtectedRoute>} />

            {/* ── 404 ─────────────────────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </MemberAuthProvider>
    </CompanyAuthProvider>
  </AuthProvider>
);

export default App;
