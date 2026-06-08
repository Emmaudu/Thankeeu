import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth }               from './context/AuthContext';
import { CompanyAuthProvider, useCompanyAuth } from './context/CompanyAuthContext';
import { MemberAuthProvider, useMemberAuth }   from './context/MemberAuthContext';

// Individual user pages
import Home             from './pages/Home';
import HowItWorks       from './pages/HowItWorks';
import FAQ              from './pages/FAQ';
import Login            from './pages/Login';
import Signup           from './pages/Signup';
import ForgotPassword   from './pages/ForgotPassword';
import ResetPassword    from './pages/ResetPassword';
import DashboardHome      from './pages/dashboard/DashboardHome';
import DashboardCards     from './pages/dashboard/DashboardCards';
import DashboardDelivered from './pages/dashboard/DashboardDelivered';
import DashboardReceived  from './pages/dashboard/DashboardReceived';
import DashboardPending   from './pages/dashboard/DashboardPending';
import DashboardFinances  from './pages/dashboard/DashboardFinances';
import DashboardReminders from './pages/dashboard/DashboardReminders';
import DashboardSettings  from './pages/dashboard/DashboardSettings';
import CreateCard       from './pages/CreateCard';
import CardView         from './pages/CardView';
import SignCard         from './pages/SignCard';
import Pricing          from './pages/Pricing';
import Policy           from './pages/Policy';
import Admin            from './pages/Admin';
import AdminLogin       from './pages/AdminLogin';
import GiftCheckout     from './pages/GiftCheckout';
import NotFound         from './pages/NotFound';
import VerifyEmail      from './pages/VerifyEmail';

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
import Blog                   from './pages/Blog';
import BlogPost               from './pages/BlogPost';

// Team member / leader pages
import JoinCompanySignup      from './pages/member/JoinCompanySignup';
import JoinCompanyLogin       from './pages/member/JoinCompanyLogin';
import { JoinForgotPassword, JoinResetPassword } from './pages/member/JoinPasswordPages';
import MemberDashboard        from './pages/member/MemberDashboard';
import MemberOccasionsPage    from './pages/member/MemberOccasionsPage';
import MemberApprovalsPage    from './pages/member/MemberApprovalsPage';
import MemberDeductionsPage   from './pages/member/MemberDeductionsPage';
import MemberSettingsPage     from './pages/member/MemberSettingsPage';
import MemberSupportPage      from './pages/member/MemberSupportPage';
import MemberCardsPage       from './pages/member/MemberCardsPage';
import MemberReceivedPage    from './pages/member/MemberReceivedPage';
import MemberPendingPage     from './pages/member/MemberPendingPage';
import MemberFinancesPage    from './pages/member/MemberFinancesPage';
import MemberRemindersPage   from './pages/member/MemberRemindersPage';

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
            <Route path="/how-it-works"  element={<HowItWorks />} />
            <Route path="/faq"           element={<FAQ />} />
            <Route path="/card/:slug"    element={<CardView />} />
            <Route path="/sign/:slug"    element={<SignCard />} />
            <Route path="/gift/:slug"    element={<GiftCheckout />} />

            {/* ── Individual auth ─────────────────────────── */}
            <Route path="/login"             element={<Login />} />
            <Route path="/signup"            element={<Signup />} />
            <Route path="/forgot-password"   element={<ForgotPassword />} />
            <Route path="/reset-password"    element={<ResetPassword />} />
            <Route path="/admin/login"       element={<AdminLogin />} />

            {/* ── Individual protected ────────────────────── */}
            <Route path="/dashboard"            element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
            <Route path="/dashboard/cards"       element={<ProtectedRoute><DashboardCards /></ProtectedRoute>} />
            <Route path="/dashboard/delivered"   element={<ProtectedRoute><DashboardDelivered /></ProtectedRoute>} />
            <Route path="/dashboard/received"    element={<ProtectedRoute><DashboardReceived /></ProtectedRoute>} />
            <Route path="/dashboard/pending"     element={<ProtectedRoute><DashboardPending /></ProtectedRoute>} />
            <Route path="/dashboard/finances"    element={<ProtectedRoute><DashboardFinances /></ProtectedRoute>} />
            <Route path="/dashboard/reminders"   element={<ProtectedRoute><DashboardReminders /></ProtectedRoute>} />
            <Route path="/dashboard/settings"    element={<ProtectedRoute><DashboardSettings /></ProtectedRoute>} />
            <Route path="/create-card" element={<ProtectedRoute><CreateCard /></ProtectedRoute>} />
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
          <Route path="/blog"          element={<Blog />} />
          <Route path="/blog/:slug"    element={<BlogPost />} />
          <Route path="/company/hris"        element={<CompanyProtectedRoute><HRISPage /></CompanyProtectedRoute>} />

            {/* ── Team member / leader auth ────────────────── */}
            <Route path="/member/signup"          element={<JoinCompanySignup />} />
            <Route path="/member/login"           element={<JoinCompanyLogin />} />
            <Route path="/member/forgot-password" element={<JoinForgotPassword />} />
            <Route path="/member/reset-password"  element={<JoinResetPassword />} />

            {/* ── Team member / leader protected ───────────── */}
            <Route path="/member/dashboard"   element={<MemberProtectedRoute><MemberDashboard /></MemberProtectedRoute>} />
            <Route path="/member/occasions"   element={<MemberProtectedRoute><MemberOccasionsPage /></MemberProtectedRoute>} />
            <Route path="/member/approvals"   element={<MemberProtectedRoute leaderOnly><MemberApprovalsPage /></MemberProtectedRoute>} />
            <Route path="/member/deductions"  element={<MemberProtectedRoute leaderOnly><MemberDeductionsPage /></MemberProtectedRoute>} />
            <Route path="/member/settings"    element={<MemberProtectedRoute><MemberSettingsPage /></MemberProtectedRoute>} />
            <Route path="/member/support"     element={<MemberProtectedRoute><MemberSupportPage /></MemberProtectedRoute>} />
            <Route path="/member/cards"       element={<MemberProtectedRoute><MemberCardsPage /></MemberProtectedRoute>} />
            <Route path="/member/received"    element={<MemberProtectedRoute><MemberReceivedPage /></MemberProtectedRoute>} />
            <Route path="/member/pending"     element={<MemberProtectedRoute><MemberPendingPage /></MemberProtectedRoute>} />
            <Route path="/member/finances"    element={<MemberProtectedRoute><MemberFinancesPage /></MemberProtectedRoute>} />
            <Route path="/member/reminders"   element={<MemberProtectedRoute><MemberRemindersPage /></MemberProtectedRoute>} />

            {/* ── 404 ─────────────────────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </MemberAuthProvider>
    </CompanyAuthProvider>
  </AuthProvider>
);

export default App;
