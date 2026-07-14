import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth }               from './context/AuthContext';
import { CompanyAuthProvider, useCompanyAuth } from './context/CompanyAuthContext';
import { MemberAuthProvider, useMemberAuth }   from './context/MemberAuthContext';

// Individual user pages
import Home             from './pages/Home';
import MemoryMoviePage       from './pages/MemoryMovie';
import LiveMemoryWallPage    from './pages/LiveMemoryWallPage';
import WeddingMemoryWall     from './pages/WeddingMemoryWall';
import BirthdayMemoryWall    from './pages/BirthdayMemoryWall';
import ChurchMemoryWall      from './pages/ChurchMemoryWall';
import EmployeeMemoryWall    from './pages/EmployeeMemoryWall';
import VsWedtrove            from './pages/VsWedtrove';
import WedUploaderAlt        from './pages/WedUploaderAlternative';
import GuestPixAlt           from './pages/GuestPixAlternative';
import KululuAlt             from './pages/KululuAlternative';
import POVAlt                from './pages/POVAlternative';
import GuestCamAlt           from './pages/GuestCamAlternative';
import VsThankbox            from './pages/VsThankbox';
import VsKudoboard           from './pages/VsKudoboard';
import VsThankboxKudoboard   from './pages/VsThankboxKudoboard';
import WeddingPhotoSharingApp      from './pages/WeddingPhotoSharingApp';
import WeddingPhotoUploadApp       from './pages/WeddingPhotoUploadApp';
import QRCodeForWeddingPhotos      from './pages/QRCodeForWeddingPhotos';
import CollectWeddingGuestPhotos   from './pages/CollectWeddingGuestPhotos';
import DigitalWeddingGuestBook     from './pages/DigitalWeddingGuestBook';
import WeddingMemoryBook           from './pages/WeddingMemoryBook';
import WeddingPhotoGallery         from './pages/WeddingPhotoGallery';
import WeddingPhotoAlbumOnline     from './pages/WeddingPhotoAlbumOnline';
import BestWeddingPhotoSharingApp  from './pages/BestWeddingPhotoSharingApp';
import WeddingGuestPhotoCollection from './pages/WeddingGuestPhotoCollection';
import OnlineWeddingGuestbook      from './pages/OnlineWeddingGuestbook';
import WeddingVideoMessageBook     from './pages/WeddingVideoMessageBook';
import WeddingVoiceNoteGuestBook   from './pages/WeddingVoiceNoteGuestBook';
import WeddingCashGiftPlatform     from './pages/WeddingCashGiftPlatform';
import WeddingGroupCard            from './pages/WeddingGroupCard';
import UKWeddingPhotoSharing       from './pages/UKWeddingPhotoSharing';
import USAWeddingPhotoSharing      from './pages/USAWeddingPhotoSharing';
import OnlineGroupCard             from './pages/OnlineGroupCard';
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
import CardStart        from './pages/CardStart';
import CardView              from './pages/CardView';
import RecipientClaimGate   from './pages/RecipientClaimGate';
import SignCard         from './pages/SignCard';
import Pricing          from './pages/Pricing';
import Policy           from './pages/Policy';
import CultureEngagements from './pages/CultureEngagements';
import Admin            from './pages/Admin';
import AdminLogin       from './pages/AdminLogin';
import AdminGames       from './pages/AdminGames';
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
import SampleCard from './pages/SampleCard';
import NotFound         from './pages/NotFound';
import BirthdayPage    from './pages/occasions/BirthdayPage';
import { GroupCardsUK, GroupCardsUS, GroupCardsCanada, GroupCardsNigeria } from './pages/occasions/CountryLandingPage';
import LeavingCardPage from './pages/LeavingCardPage';
import BabyShowerPage from './pages/BabyShowerPage';
import { RetirementPage, GetWellSoonPage, ThankYouCardPage, MaternityLeavePage, ChristmasCardPage, SympathyCardPage, WelcomeCardPage, GoodLuckCardPage, TeacherThankYouPage, EngagementCardPage, NewHomeCardPage, AdminProfessionalsDayPage, BossDayPage, TeacherAppreciationPage, ThanksgivingCardPage, MothersDayCardPage, FathersDayCardPage, OnlineBirthdayNigeriaPage, LeavingCardUKPage, BirthdayCardUKPage, RetirementCardUKPage, GetWellSoonUKPage } from './pages/occasions/ExtraOccasionPage';
import FarewellPage    from './pages/occasions/Farewell';
import AnniversaryPage from './pages/occasions/Anniversary';
import PromotionPage   from './pages/occasions/Promotion';
import WeddingPage     from './pages/occasions/Wedding';
import GraduationPage  from './pages/occasions/Graduation';
import NewBabyPage           from './pages/occasions/NewBaby';
import StaffAppreciationPage from './pages/occasions/StaffAppreciation';
import VerifyEmail      from './pages/VerifyEmail';
import { GamesAuth, GamesDashboard, GamesHome, GamesLeaderboard, GamesPlay, GamesProfile } from './pages/games/Games';

// Company (HR) pages
import CompanySignup          from './pages/company/CompanySignup';
import CompanyLogin           from './pages/company/CompanyLogin';
import CompanyForgotPassword  from './pages/company/CompanyForgotPassword';
import WorkspaceFinder        from './pages/company/WorkspaceFinder';
import WorkspacePortal        from './pages/company/WorkspacePortal';
import BookDemo               from './pages/BookDemo';
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
import { usePageTracker } from './hooks/usePageTracker';
import ScrollToTop from './components/ScrollToTop';
import { companyAPI } from './utils/api';
import { companyPath, getWorkspaceSlug, isAdminHost, isGamesHost, isWorkspaceFinderHost, isWorkspaceHost } from './utils/workspace';

const PageTracker = () => { usePageTracker(); return null; };

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

const WorkspaceNotFound = ({ slug }) => (
  <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
    <section className="w-full max-w-lg text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-300">404 workspace</p>
      <h1 className="mt-4 text-4xl font-bold">Workspace not found</h1>
      <p className="mt-4 text-slate-300">
        {slug ? `${slug}.thankeeu.com` : 'This workspace'} is not registered on Thankeeu.
      </p>
      <a
        href="https://thankeeu.com"
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary-500 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-600"
      >
        Go to Thankeeu
      </a>
    </section>
  </main>
);

const WorkspaceUnavailable = () => (
  <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
    <section className="w-full max-w-lg text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Workspace check failed</p>
      <h1 className="mt-4 text-4xl font-bold">Unable to verify this workspace</h1>
      <p className="mt-4 text-slate-300">
        Please refresh in a moment. If this continues, the API may not be reachable from this domain.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary-500 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-600"
      >
        Retry
      </button>
    </section>
  </main>
);

const WorkspaceGate = ({ children }) => {
  const slug = getWorkspaceSlug();
  const [status, setStatus] = useState(slug ? 'loading' : 'ready');

  useEffect(() => {
    if (!slug) {
      setStatus('ready');
      return undefined;
    }

    let active = true;
    setStatus('loading');

    companyAPI.getWorkspace()
      .then(() => {
        if (active) setStatus('ready');
      })
      .catch((error) => {
        if (!active) return;
        setStatus(error.response?.status === 404 ? 'not-found' : 'error');
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (status === 'loading') return <Spinner />;
  if (status === 'not-found') return <WorkspaceNotFound slug={slug} />;
  if (status === 'error') return <WorkspaceUnavailable />;
  return children;
};

// CardViewGate — everyone goes straight to CardView, no login required.
// If the URL has ?claim=TOKEN (recipient email link), CardView itself resolves
// the claim_token → real access_token via the claim-gate API before loading.
// Do NOT store the raw claim_token in sessionStorage here — it is NOT the
// access_token, and using it as one will cause "card not found" errors.
const CardViewGate = () => {
  return <CardView />;
};

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to={adminOnly ? '/admin/login' : '/login'} replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const CompanyProtectedRoute = ({ children }) => {
  const { company, loading } = useCompanyAuth();
  if (loading) return <Spinner />;
  if (!company) return <Navigate to={companyPath('/login')} replace />;
  return children;
};

const RootPage = () => (
  isGamesHost()
    ? <GamesHome />
    : isAdminHost()
    ? <Navigate to="/admin" replace />
    : isWorkspaceHost() || isWorkspaceFinderHost()
    ? <Navigate to="/login" replace />
    : <Home />
);

const WorkspaceLogin = () => {
  if (isGamesHost()) return <GamesAuth mode="login" />;
  if (isWorkspaceHost()) return <WorkspacePortal />;
  if (isWorkspaceFinderHost()) return <WorkspaceFinder />;
  return <Login />;
};

const WorkspaceSignup = () => {
  if (isGamesHost()) return <GamesAuth mode="signup" />;
  if (isWorkspaceHost()) return <JoinCompanySignup />;
  if (isWorkspaceFinderHost()) return <WorkspaceFinder />;
  return <Signup />;
};

const WorkspaceForgotPassword = () => isWorkspaceHost() ? <CompanyForgotPassword /> : <ForgotPassword />;
const WorkspaceResetPassword = () => isWorkspaceHost() ? <CompanyResetPassword /> : <ResetPassword />;
const WorkspaceDashboard = () => (
  isGamesHost()
    ? <GamesDashboard />
    : isWorkspaceHost()
    ? <CompanyProtectedRoute><CompanyDashboard /></CompanyProtectedRoute>
    : <ProtectedRoute><DashboardHome /></ProtectedRoute>
);
const GamesLeaderboardRoute = () => isGamesHost() ? <GamesLeaderboard /> : <NotFound />;
const GamesProfileRoute = () => {
  const { slug } = useParams();
  if (!isGamesHost()) return <NotFound />;
  if (['login', 'signup', 'dashboard', 'leaderboard', 'admin'].includes(slug)) return <NotFound />;
  return <GamesProfile />;
};
const CompanyLoginRoute = () => isWorkspaceHost() ? <Navigate to="/login" replace /> : <CompanyLogin />;
const CompanySignupRoute = () => isWorkspaceHost() ? <Navigate to="/login" replace /> : <CompanySignup />;
const MemberLoginRoute = () => isWorkspaceHost() ? <Navigate to="/login?role=member" replace /> : <JoinCompanyLogin />;
const MemberSignupRoute = () => isWorkspaceHost() ? <Navigate to="/signup" replace /> : <JoinCompanySignup />;

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
          <WorkspaceGate>
            <Toaster
              position="top-center"
              toastOptions={{
                className: 'font-sans text-sm',
                success: { iconTheme: { primary: '#7F77DD', secondary: '#fff' } },
                duration: 4000,
              }}
            />
            <PageTracker />
            <ScrollToTop />
            <Routes>
            {/* ── Public (no auth required) ─────────────────── */}
            <Route path="/"              element={<RootPage />} />
            <Route path="/pricing"       element={<Pricing />} />
            <Route path="/culture-and-engagements" element={<CultureEngagements />} />
            <Route path="/games"         element={<GamesHome />} />
            <Route path="/games/signup"  element={<GamesAuth mode="signup" />} />
            <Route path="/games/login"   element={<GamesAuth mode="login" />} />
            <Route path="/games/dashboard" element={<GamesDashboard />} />
            <Route path="/games/leaderboard" element={<GamesLeaderboard />} />
            <Route path="/games/:slug"   element={<GamesProfile />} />
            <Route path="/games/:slug/play" element={<GamesPlay />} />
            <Route path="/leaderboard"   element={<GamesLeaderboardRoute />} />
            <Route path="/:slug"         element={<GamesProfileRoute />} />
            <Route path="/:slug/play"    element={isGamesHost() ? <GamesPlay /> : <NotFound />} />
            <Route path="/memory-movie"         element={<MemoryMoviePage />} />
            <Route path="/live-memory-wall"          element={<LiveMemoryWallPage />} />
            <Route path="/wedding-memory-wall"        element={<WeddingMemoryWall />} />
            <Route path="/birthday-memory-wall"       element={<BirthdayMemoryWall />} />
            <Route path="/church-memory-wall"         element={<ChurchMemoryWall />} />
            <Route path="/employee-memory-wall"       element={<EmployeeMemoryWall />} />
            <Route path="/thankeeu-vs-wedtrove"       element={<VsWedtrove />} />
            {/* ── Wedding SEO landing pages ── */}
            <Route path="/wedding-photo-sharing-app"     element={<WeddingPhotoSharingApp />} />
            <Route path="/wedding-photo-upload-app"      element={<WeddingPhotoUploadApp />} />
            <Route path="/qr-code-for-wedding-photos"    element={<QRCodeForWeddingPhotos />} />
            <Route path="/collect-wedding-guest-photos"  element={<CollectWeddingGuestPhotos />} />
            <Route path="/digital-wedding-guest-book"    element={<DigitalWeddingGuestBook />} />
            <Route path="/wedding-memory-book"           element={<WeddingMemoryBook />} />
            <Route path="/wedding-photo-gallery"         element={<WeddingPhotoGallery />} />
            <Route path="/wedding-photo-album-online"    element={<WeddingPhotoAlbumOnline />} />
            <Route path="/best-wedding-photo-sharing-app" element={<BestWeddingPhotoSharingApp />} />
            <Route path="/wedding-guest-photo-collection" element={<WeddingGuestPhotoCollection />} />
            <Route path="/online-wedding-guestbook"      element={<OnlineWeddingGuestbook />} />
            <Route path="/wedding-video-message-book"    element={<WeddingVideoMessageBook />} />
            <Route path="/wedding-voice-note-guest-book" element={<WeddingVoiceNoteGuestBook />} />
            <Route path="/wedding-cash-gift-platform"    element={<WeddingCashGiftPlatform />} />
            <Route path="/wedding-group-card"            element={<WeddingGroupCard />} />
            <Route path="/uk-wedding-photo-sharing"      element={<UKWeddingPhotoSharing />} />
            <Route path="/usa-wedding-photo-sharing"     element={<USAWeddingPhotoSharing />} />
            <Route path="/online-group-card"             element={<OnlineGroupCard />} />
            <Route path="/weduploader-alternative"     element={<WedUploaderAlt />} />
            <Route path="/guestpix-alternative"        element={<GuestPixAlt />} />
            <Route path="/kululu-alternative"          element={<KululuAlt />} />
            <Route path="/pov-alternative"             element={<POVAlt />} />
            <Route path="/guestcam-alternative"        element={<GuestCamAlt />} />
            <Route path="/thankeeu-vs-thankbox"       element={<VsThankbox />} />
            <Route path="/thankeeu-vs-kudoboard"      element={<VsKudoboard />} />
            <Route path="/thankeeu-vs-thankbox-vs-kudoboard" element={<VsThankboxKudoboard />} />
            <Route path="/policy"        element={<Policy />} />
            <Route path="/how-it-works"  element={<HowItWorks />} />
            <Route path="/occasions/birthday"    element={<BirthdayPage />} />
            <Route path="/online-group-cards-uk"      element={<GroupCardsUK />} />
            <Route path="/online-group-cards-us"      element={<GroupCardsUS />} />
            <Route path="/online-group-cards-canada"  element={<GroupCardsCanada />} />
            <Route path="/online-group-cards-nigeria" element={<GroupCardsNigeria />} />
            <Route path="/cards/leaving-card"    element={<LeavingCardPage />} />
            <Route path="/cards/retirement"      element={<RetirementPage />} />
            <Route path="/cards/get-well-soon"   element={<GetWellSoonPage />} />
            <Route path="/cards/thank-you"       element={<ThankYouCardPage />} />
            <Route path="/cards/maternity-leave" element={<MaternityLeavePage />} />
            <Route path="/cards/christmas"       element={<ChristmasCardPage />} />
            {/* UK Tier 1 */}
            <Route path="/cards/sympathy"                      element={<SympathyCardPage />} />
            <Route path="/cards/welcome"                       element={<WelcomeCardPage />} />
            <Route path="/cards/good-luck"                     element={<GoodLuckCardPage />} />
            <Route path="/cards/baby-shower"                   element={<BabyShowerPage />} />
            <Route path="/cards/teacher-thank-you"             element={<TeacherThankYouPage />} />
            <Route path="/cards/engagement"                    element={<EngagementCardPage />} />
            <Route path="/cards/new-home"                      element={<NewHomeCardPage />} />
            {/* US Tier 1 */}
            <Route path="/cards/administrative-professionals-day" element={<AdminProfessionalsDayPage />} />
            <Route path="/cards/boss-day"                      element={<BossDayPage />} />
            <Route path="/cards/teacher-appreciation"          element={<TeacherAppreciationPage />} />
            <Route path="/cards/thanksgiving"                  element={<ThanksgivingCardPage />} />
            <Route path="/cards/mothers-day"                   element={<MothersDayCardPage />} />
            <Route path="/cards/fathers-day"                   element={<FathersDayCardPage />} />
            <Route path="/online-birthday-cards-nigeria"      element={<OnlineBirthdayNigeriaPage />} />
            {/* UK-specific occasion pages */}
            <Route path="/leaving-cards-uk"                   element={<LeavingCardUKPage />} />
            <Route path="/birthday-cards-uk"                  element={<BirthdayCardUKPage />} />
            <Route path="/retirement-cards-uk"                element={<RetirementCardUKPage />} />
            <Route path="/get-well-soon-cards-uk"             element={<GetWellSoonUKPage />} />
            <Route path="/occasions/farewell"    element={<FarewellPage />} />
            <Route path="/occasions/anniversary" element={<AnniversaryPage />} />
            <Route path="/occasions/promotion"   element={<PromotionPage />} />
            <Route path="/occasions/wedding"     element={<WeddingPage />} />
            <Route path="/occasions/graduation"  element={<GraduationPage />} />
            <Route path="/occasions/new-baby"           element={<NewBabyPage />} />
            <Route path="/occasions/staff-appreciation" element={<StaffAppreciationPage />} />
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
            <Route path="/sample" element={<SampleCard />} />
            <Route path="/card/:slug"    element={<CardViewGate />} />

            {/* ── Individual auth ─────────────────────────── */}
            <Route path="/login"             element={<WorkspaceLogin />} />
            <Route path="/signup"            element={<WorkspaceSignup />} />
            <Route path="/forgot-password"   element={<WorkspaceForgotPassword />} />
            <Route path="/reset-password"    element={<WorkspaceResetPassword />} />
            <Route path="/admin/login"       element={<AdminLogin />} />

            {/* ── Individual protected ────────────────────── */}
            <Route path="/dashboard"            element={<WorkspaceDashboard />} />
            <Route path="/dashboard/credits"     element={<ProtectedRoute><DashboardCredits /></ProtectedRoute>} />
            <Route path="/dashboard/gift-cards"  element={<ProtectedRoute><DashboardGiftCards /></ProtectedRoute>} />
            <Route path="/dashboard/cards"       element={<ProtectedRoute><DashboardCards /></ProtectedRoute>} />
            <Route path="/dashboard/delivered"   element={<ProtectedRoute><DashboardDelivered /></ProtectedRoute>} />
            <Route path="/dashboard/received"    element={<ProtectedRoute><DashboardReceived /></ProtectedRoute>} />
            <Route path="/dashboard/pending"     element={<ProtectedRoute><DashboardPending /></ProtectedRoute>} />
            <Route path="/dashboard/finances"    element={<ProtectedRoute><DashboardFinances /></ProtectedRoute>} />
            <Route path="/dashboard/reminders"   element={<ProtectedRoute><DashboardReminders /></ProtectedRoute>} />
            <Route path="/dashboard/settings"    element={<ProtectedRoute><DashboardSettings /></ProtectedRoute>} />
            <Route path="/card/new" element={<CardStart />} />
            <Route path="/create-card" element={<AnyAuthRoute><CreateCard /></AnyAuthRoute>} />
            <Route path="/admin"     element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
            <Route path="/admin/games" element={<ProtectedRoute adminOnly><AdminGames /></ProtectedRoute>} />

            {/* Clean company workspace aliases for *.thankeeu.com and *.localhost */}
            <Route path="/teams"        element={<CompanyProtectedRoute><TeamsPage /></CompanyProtectedRoute>} />
            <Route path="/members"      element={<CompanyProtectedRoute><MembersApprovalPage /></CompanyProtectedRoute>} />
            <Route path="/employees"    element={<CompanyProtectedRoute><TeamMembersPage /></CompanyProtectedRoute>} />
            <Route path="/deductions"   element={<CompanyProtectedRoute><DeductionRequestsPage /></CompanyProtectedRoute>} />
            <Route path="/subscription" element={<CompanyProtectedRoute><SubscriptionPage /></CompanyProtectedRoute>} />
            <Route path="/cards"        element={<CompanyProtectedRoute><CompanyMyCardsPage /></CompanyProtectedRoute>} />
            <Route path="/activity"     element={<CompanyProtectedRoute><ActivityLogPage /></CompanyProtectedRoute>} />
            <Route path="/settings"     element={<CompanyProtectedRoute><SettingsPage /></CompanyProtectedRoute>} />
            <Route path="/support"      element={<CompanyProtectedRoute><SupportPage /></CompanyProtectedRoute>} />
            <Route path="/gift-cards"   element={<CompanyProtectedRoute><CompanyGiftCardsPage /></CompanyProtectedRoute>} />
            <Route path="/hris"         element={<CompanyProtectedRoute><HRISPage /></CompanyProtectedRoute>} />
            <Route path="/occasions"    element={<CompanyProtectedRoute><OccasionsPage /></CompanyProtectedRoute>} />
            <Route path="/team-members" element={<CompanyProtectedRoute><TeamMembersPage /></CompanyProtectedRoute>} />
            <Route path="/core-team"    element={<CompanyProtectedRoute><CoreTeamPage /></CompanyProtectedRoute>} />

            {/* ── Company (HR) auth ────────────────────────── */}
            <Route path="/company/signup"           element={<CompanySignupRoute />} />
            <Route path="/business"                 element={<BookDemo />} />
            <Route path="/company/login"            element={<CompanyLoginRoute />} />
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
            <Route path="/member/signup"          element={<MemberSignupRoute />} />
            <Route path="/member/login"           element={<MemberLoginRoute />} />
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
          </WorkspaceGate>
        </BrowserRouter>
      </MemberAuthProvider>
    </CompanyAuthProvider>
  </AuthProvider>
);

export default App;
