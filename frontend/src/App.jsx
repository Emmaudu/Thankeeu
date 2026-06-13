import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import DashboardCredits  from './pages/dashboard/DashboardCredits';
import DashboardGiftCards from './pages/dashboard/DashboardGiftCards';
import MemberGiftCardsPage from './pages/member/MemberGiftCardsPage';
import CompanyGiftCardsPage from './pages/company/CompanyGiftCardsPage';
import CreateCard       from './pages/CreateCard';
import CardView         from './pages/CardView';
import SignCard         from './pages/SignCard';
import Pricing          from './pages/Pricing';
import Policy           from './pages/Policy';
import Admin            from './pages/Admin';
import AdminLogin       from './pages/AdminLogin';
import GiftCheckout     from './pages/GiftCheckout';
import VendorDashboard         from './pages/vendor/VendorDashboard';
import VendorProducts          from './pages/vendor/VendorProducts';
import VendorOrders            from './pages/vendor/VendorOrders';
import VendorAnalytics         from './pages/vendor/VendorAnalytics';
import VendorSettings          from './pages/vendor/VendorSettings';
import VendorSupport           from './pages/vendor/VendorSupport';
import VendorStorefront        from './pages/vendor/VendorStorefront';
import VendorBank              from './pages/vendor/VendorBank';
import VendorCustomers         from './pages/vendor/VendorCustomers';
import VendorStorefrontPublic  from './pages/vendor/VendorStorefrontPublic';
import PalLanding      from './pages/PalLanding';
import VendorLanding   from './pages/VendorLanding';
import PalSignup       from './pages/pals/PalSignup';
import PalLogin        from './pages/pals/PalLogin';
import PalVerifyEmail  from './pages/pals/PalVerifyEmail';
import PalJoin         from './pages/pals/PalJoin';
import PalDashboard    from './pages/pals/PalDashboard';
import PalMembers      from './pages/pals/PalMembers';
import PalInvite       from './pages/pals/PalInvite';
import PalMemberProfile from './pages/pals/PalMemberProfile';
import PalSettings     from './pages/pals/PalSettings';
import PalSupport      from './pages/pals/PalSupport';
import PalMyCards      from './pages/pals/PalMyCards';
import VendorLogin            from './pages/vendor/VendorLogin';
import VendorSignup           from './pages/vendor/VendorSignup';
import VendorVerifyEmail      from './pages/vendor/VendorVerifyEmail';
import VendorOrderSuccess     from './pages/vendor/VendorOrderSuccess';
import BlogConfirmSubscription from './pages/BlogConfirmSubscription';
import BlogUnsubscribe          from './pages/BlogUnsubscribe';
import PaymentCallback from './pages/PaymentCallback';
import CardFeeVerify  from './pages/CardFeeVerify';
import NotFound         from './pages/NotFound';
import BirthdayPage    from './pages/occasions/Birthday';
import FarewellPage    from './pages/occasions/Farewell';
import AnniversaryPage from './pages/occasions/Anniversary';
import PromotionPage   from './pages/occasions/Promotion';
import WeddingPage     from './pages/occasions/Wedding';
import GraduationPage  from './pages/occasions/Graduation';
import NewBabyPage     from './pages/occasions/NewBaby';
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
import OccasionsPage          from './pages/company/OccasionsPage';
import TeamMembersPage        from './pages/company/TeamMembersPage';
import CoreTeamPage           from './pages/company/CoreTeamPage';
import OccasionPage           from './pages/OccasionPage';
import DeductionRequestsPage  from './pages/company/DeductionRequestsPage';
import CompanyMyCardsPage     from './pages/company/CompanyMyCardsPage';
import ActivityLogPage        from './pages/company/ActivityLogPage';
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

// CardViewGate: requires any authentication, preserves ?token= for recipient links
const CardViewGate = () => {
  const { user, loading: uLoading }     = useAuth();
  const { company, loading: cLoading }  = useCompanyAuth();
  const { member, loading: mLoading }   = useMemberAuth();
  const location = useLocation();

  if (uLoading || cLoading || mLoading) return <Spinner />;
  if (!user && !company && !member) {
    // Preserve the full path including ?token= so after login they come back here
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return <CardView />;
};

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

// Allows any logged-in user: regular user, HR company, or team member
const AnyAuthRoute = ({ children }) => {
  const { user, loading: uL }    = useAuth();
  const { company, loading: cL } = useCompanyAuth();
  const { member, loading: mL }  = useMemberAuth();
  const location = useLocation();
  if (uL || cL || mL) return <Spinner />;
  if (!user && !company && !member)
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
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
            {/* ── Public (no auth required) ─────────────────── */}
            <Route path="/"              element={<Home />} />
            <Route path="/pricing"       element={<Pricing />} />
            <Route path="/policy"        element={<Policy />} />
            <Route path="/how-it-works"  element={<HowItWorks />} />
            <Route path="/occasions/birthday"    element={<BirthdayPage />} />
            <Route path="/occasions/farewell"    element={<FarewellPage />} />
            <Route path="/occasions/anniversary" element={<AnniversaryPage />} />
            <Route path="/occasions/promotion"   element={<PromotionPage />} />
            <Route path="/occasions/wedding"     element={<WeddingPage />} />
            <Route path="/occasions/graduation"  element={<GraduationPage />} />
            <Route path="/occasions/new-baby"    element={<NewBabyPage />} />
            <Route path="/vendor/login"             element={<VendorLogin />} />
            <Route path="/vendors"                  element={<VendorLanding />} />
            <Route path="/vendor/signup"            element={<VendorSignup />} />
            <Route path="/vendor/verify-email"      element={<VendorVerifyEmail />} />
            <Route path="/vendor/order-success"     element={<VendorOrderSuccess />} />
            <Route path="/vendor/dashboard"   element={<VendorDashboard />} />
            <Route path="/vendor/products"    element={<VendorProducts />} />
            <Route path="/vendor/orders"      element={<VendorOrders />} />
            <Route path="/vendor/analytics"   element={<VendorAnalytics />} />
            <Route path="/vendor/settings"    element={<VendorSettings />} />
            <Route path="/vendor/support"     element={<VendorSupport />} />
            <Route path="/vendor/storefront"  element={<VendorStorefront />} />
            <Route path="/vendor/bank"        element={<VendorBank />} />
            <Route path="/vendor/customers"    element={<VendorCustomers />} />
            <Route path="/c/:slug"             element={<VendorStorefrontPublic />} />
            <Route path="/pals"                    element={<PalLanding />} />
            <Route path="/pals/signup"             element={<PalSignup />} />
            <Route path="/pals/login"              element={<PalLogin />} />
            <Route path="/pals/verify-email"       element={<PalVerifyEmail />} />
            <Route path="/pals/join"               element={<PalJoin />} />
            <Route path="/pals/dashboard"          element={<PalDashboard />} />
            <Route path="/pals/dashboard/members"  element={<PalMembers />} />
            <Route path="/pals/dashboard/members/:id" element={<PalMemberProfile />} />
            <Route path="/pals/dashboard/invite"   element={<PalInvite />} />
            <Route path="/pals/dashboard/settings" element={<PalSettings />} />
            <Route path="/pals/dashboard/support"  element={<PalSupport />} />
            <Route path="/pals/dashboard/cards"    element={<PalMyCards />} />
            <Route path="/blog/confirm-subscription" element={<BlogConfirmSubscription />} />
            <Route path="/blog/unsubscribe"            element={<BlogUnsubscribe />} />
            <Route path="/payment/callback"   element={<PaymentCallback />} />
            <Route path="/create-card/verify" element={<CardFeeVerify />} />
            <Route path="/faq"            element={<FAQ />} />
            <Route path="/occasions/:occasion" element={<OccasionPage />} />
            <Route path="/sign/:slug"    element={<SignCard />} />
            <Route path="/gift/:slug"    element={<GiftCheckout />} />
            {/* Email verification — public, no auth needed */}
            <Route path="/verify-email"  element={<VerifyEmail />} />

            {/* ── Card view — requires auth, preserves token for recipient links ── */}
            <Route path="/card/:slug"    element={<CardViewGate />} />

            {/* ── Individual auth ─────────────────────────── */}
            <Route path="/login"             element={<Login />} />
            <Route path="/signup"            element={<Signup />} />
            <Route path="/forgot-password"   element={<ForgotPassword />} />
            <Route path="/reset-password"    element={<ResetPassword />} />
            <Route path="/admin/login"       element={<AdminLogin />} />

            {/* ── Individual protected ────────────────────── */}
            <Route path="/dashboard"            element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
            <Route path="/dashboard/credits"     element={<ProtectedRoute><DashboardCredits /></ProtectedRoute>} />
            <Route path="/dashboard/gift-cards"  element={<ProtectedRoute><DashboardGiftCards /></ProtectedRoute>} />
            <Route path="/dashboard/cards"       element={<ProtectedRoute><DashboardCards /></ProtectedRoute>} />
            <Route path="/dashboard/delivered"   element={<ProtectedRoute><DashboardDelivered /></ProtectedRoute>} />
            <Route path="/dashboard/received"    element={<ProtectedRoute><DashboardReceived /></ProtectedRoute>} />
            <Route path="/dashboard/pending"     element={<ProtectedRoute><DashboardPending /></ProtectedRoute>} />
            <Route path="/dashboard/finances"    element={<ProtectedRoute><DashboardFinances /></ProtectedRoute>} />
            <Route path="/dashboard/reminders"   element={<ProtectedRoute><DashboardReminders /></ProtectedRoute>} />
            <Route path="/dashboard/settings"    element={<ProtectedRoute><DashboardSettings /></ProtectedRoute>} />
            <Route path="/create-card" element={<AnyAuthRoute><CreateCard /></AnyAuthRoute>} />
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
            <Route path="/company/my-cards"  element={<CompanyProtectedRoute><CompanyMyCardsPage /></CompanyProtectedRoute>} />
            <Route path="/company/activity"  element={<CompanyProtectedRoute><ActivityLogPage /></CompanyProtectedRoute>} />
            <Route path="/company/settings"    element={<CompanyProtectedRoute><SettingsPage /></CompanyProtectedRoute>} />
            <Route path="/company/support"     element={<CompanyProtectedRoute><SupportPage /></CompanyProtectedRoute>} />
          <Route path="/blog"          element={<Blog />} />
          <Route path="/blog/:slug"    element={<BlogPost />} />
          <Route path="/company/gift-cards"  element={<CompanyProtectedRoute><CompanyGiftCardsPage /></CompanyProtectedRoute>} />
          <Route path="/company/hris"        element={<CompanyProtectedRoute><HRISPage /></CompanyProtectedRoute>} />
          <Route path="/company/occasions"   element={<CompanyProtectedRoute><OccasionsPage /></CompanyProtectedRoute>} />
          <Route path="/company/team-members" element={<CompanyProtectedRoute><TeamMembersPage /></CompanyProtectedRoute>} />
          <Route path="/company/core-team"    element={<CompanyProtectedRoute><CoreTeamPage /></CompanyProtectedRoute>} />

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
            <Route path="/member/gift-cards"  element={<MemberProtectedRoute><MemberGiftCardsPage /></MemberProtectedRoute>} />
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
