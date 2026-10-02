import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import usePageTracking from './hooks/usePageTracking';
import TawkController from './components/TawkController';
import InstallPrompt from './components/InstallPrompt';
import PushOptIn from './components/PushOptIn';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CountryFooter from './components/layout/CountryFooter';
import GeoSuggest from './components/layout/GeoSuggest';
import { MARKETS, getMarket, marketFromPath, prefixOf } from './utils/market';

const Home               = lazy(() => import('./pages/Home'));
const Tasks              = lazy(() => import('./pages/Tasks'));
const TaskDetail         = lazy(() => import('./pages/TaskDetail'));
const Taskers            = lazy(() => import('./pages/Taskers'));
const TaskerProfile      = lazy(() => import('./pages/TaskerProfile'));
const PostTask           = lazy(() => import('./pages/PostTask'));
const Auth               = lazy(() => import('./pages/Auth'));
const RequesterAuth      = lazy(() => import('./pages/RequesterAuth'));
const TaskerAuth         = lazy(() => import('./pages/TaskerAuth'));
const TaskerApproved     = lazy(() => import('./pages/TaskerApproved'));
const RequesterDashboard = lazy(() => import('./pages/RequesterDashboard'));
const TaskerDashboard    = lazy(() => import('./pages/TaskerDashboard'));
const AdminDashboard     = lazy(() => import('./pages/AdminDashboard'));
const AdminLogin         = lazy(() => import('./pages/AdminLogin'));
const Policy             = lazy(() => import('./pages/Policy'));
const Blog               = lazy(() => import('./pages/Blog'));
const BlogPost           = lazy(() => import('./pages/BlogPost'));
const HowItWorks         = lazy(() => import('./pages/HowItWorks'));
const Pricing            = lazy(() => import('./pages/Pricing'));
const PaymentCallback    = lazy(() => import('./pages/PaymentCallback'));
const VerifiedLanding    = lazy(() => import('./pages/VerifiedLanding'));
const VerifyEmail        = lazy(() => import('./pages/VerifyEmail'));
const ResetPassword      = lazy(() => import('./pages/ResetPassword'));
const Demo               = lazy(() => import('./pages/Demo'));
const About              = lazy(() => import('./pages/About'));
const Careers            = lazy(() => import('./pages/Careers'));
const FAQ                = lazy(() => import('./pages/FAQ'));
const Contact            = lazy(() => import('./pages/Contact'));
const Terms              = lazy(() => import('./pages/Terms'));
const TeamsLanding          = lazy(() => import('./pages/teams/TeamsLanding'));
const TeamsAuth             = lazy(() => import('./pages/teams/TeamsAuth'));
const VooomLanding          = lazy(() => import('./pages/vooom/VooomLanding'));
const VooomBrowse           = lazy(() => import('./pages/vooom/VooomBrowse'));
const VooomDetail           = lazy(() => import('./pages/vooom/VooomDetail'));
const VooomPost             = lazy(() => import('./pages/vooom/VooomPost'));
const VooomVsUber           = lazy(() => import('./pages/vooom/VooomVsUber'));
const VooomDiaspora         = lazy(() => import('./pages/vooom/VooomDiaspora'));
const VooomUKNigeria        = lazy(() => import('./pages/vooom/VooomUKNigeria'));
const VooomUSNigeria        = lazy(() => import('./pages/vooom/VooomUSNigeria'));
const VooomLocalDelivery    = lazy(() => import('./pages/vooom/VooomLocalDelivery'));
const HRDashboard           = lazy(() => import('./pages/teams/HRDashboard'));
const MemberDashboard       = lazy(() => import('./pages/teams/MemberDashboard'));
const PostEnterpriseTask    = lazy(() => import('./pages/teams/PostEnterpriseTask'));
const TeamsPaymentCallback  = lazy(() => import('./pages/teams/TeamsPaymentCallback'));

// Service Landing Pages
const Delivery            = lazy(() => import('./pages/services/Delivery'));
const Errands             = lazy(() => import('./pages/services/Errands'));
const PropertyInspection  = lazy(() => import('./pages/services/PropertyInspection'));
const FieldEngineers      = lazy(() => import('./pages/services/FieldEngineers'));
const Installations       = lazy(() => import('./pages/services/Installations'));
const OfficeSupport       = lazy(() => import('./pages/services/OfficeSupport'));
const DocumentPickup      = lazy(() => import('./pages/services/DocumentPickup'));
const AssetVerification   = lazy(() => import('./pages/services/AssetVerification'));
const Merchandising       = lazy(() => import('./pages/services/Merchandising'));
const BusinessSupport     = lazy(() => import('./pages/services/BusinessSupport'));
const ErrandsLagos        = lazy(() => import('./pages/services/ErrandsLagos'));
const ErrandsAbuja        = lazy(() => import('./pages/services/ErrandsAbuja'));
const ErrandsPortHarcourt = lazy(() => import('./pages/services/ErrandsPortHarcourt'));
const ErrandsIbadan       = lazy(() => import('./pages/services/ErrandsIbadan'));
const ErrandsKano         = lazy(() => import('./pages/services/ErrandsKano'));
const ErrandsBeninCity    = lazy(() => import('./pages/services/ErrandsBeninCity'));
const ErrandsEnugu        = lazy(() => import('./pages/services/ErrandsEnugu'));
const ErrandsWarri        = lazy(() => import('./pages/services/ErrandsWarri'));
const ErrandsOwerri       = lazy(() => import('./pages/services/ErrandsOwerri'));
const ErrandsCalabar      = lazy(() => import('./pages/services/ErrandsCalabar'));
const ErrandsUyo          = lazy(() => import('./pages/services/ErrandsUyo'));
const ErrandsIlorin       = lazy(() => import('./pages/services/ErrandsIlorin'));
const ErrandsAbeokuta     = lazy(() => import('./pages/services/ErrandsAbeokuta'));
const ErrandsOnitsha      = lazy(() => import('./pages/services/ErrandsOnitsha'));
const ErrandsJos          = lazy(() => import('./pages/services/ErrandsJos'));
const Diaspora            = lazy(() => import('./pages/services/Diaspora'));
const DiasporaUK          = lazy(() => import('./pages/services/DiasporaUK'));
const DiasporaUSA         = lazy(() => import('./pages/services/DiasporaUSA'));
const DiasporaCanada      = lazy(() => import('./pages/services/DiasporaCanada'));
const GroceryShopping     = lazy(() => import('./pages/services/GroceryShopping'));
const TaskeeuVsJiji       = lazy(() => import('./pages/TaskeeuVsJiji'));
const ErrandRunnerNearMe  = lazy(() => import('./pages/ErrandRunnerNearMe'));
const ReferAndEarn        = lazy(() => import('./pages/ReferAndEarn'));
const ReferRedirect       = lazy(() => import('./pages/ReferRedirect'));
const HouseLandInspection = lazy(() => import('./pages/HouseLandInspection'));
// International country sites (/us, /uk, /ireland, /australia, /new-zealand, /canada, /singapore)
const CountryHome  = lazy(() => import('./components/country/CountryPages').then(m => ({ default: m.CountryHome })));
const ServicePage  = lazy(() => import('./components/country/CountryPages').then(m => ({ default: m.ServicePage })));
const CityPage     = lazy(() => import('./components/country/CountryPages').then(m => ({ default: m.CityPage })));
const ComparePage  = lazy(() => import('./components/country/CountryPages').then(m => ({ default: m.ComparePage })));
const RemotePage   = lazy(() => import('./components/country/CountryPages').then(m => ({ default: m.RemotePage })));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
        <p className="font-semibold text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  const pre = prefixOf(marketFromPath(location.pathname).code);
  if (!isAuthenticated) {
    // Send to role-specific login (on the same country site) if role is known
    if (role === 'tasker') return <Navigate to={`${pre}/tasker/login`} replace />;
    if (role === 'requester') return <Navigate to={`${pre}/requester/login`} replace />;
    if (role === 'admin') return <Navigate to="/admin/login" replace />;
    return <Navigate to={`${pre}/auth`} replace />;
  }
  if (role && user?.role !== role) return <Navigate to={pre || '/'} replace />;
  return children;
};

/**
 * Every account belongs to one country site. A signed-in person who opens a
 * dashboard or the post-task page on another country's site (an old link, a
 * notification, a typed URL) is taken to the same page on their own site.
 */
const MarketGate = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!isAuthenticated || !user || user.role === 'admin') return children;
  const page = marketFromPath(location.pathname);
  const home = getMarket(user.market || 'NG');
  if (page.code === home.code) return children;
  const rest = page.slug ? location.pathname.slice(page.slug.length + 1) || '/' : location.pathname;
  return <Navigate to={`${prefixOf(home.code)}${rest}${location.search}`} replace />;
};

const TeamsProtectedRoute = ({ children, hrOnly = false }) => {
  const token = localStorage.getItem('taskeeu_token');
  const member = JSON.parse(localStorage.getItem('teams_member') || 'null');
  if (!token || !member) return <Navigate to="/teams/login" replace />;
  if (hrOnly && member.permission_level !== 'hr' && !member.is_hr) return <Navigate to="/teams/dashboard" replace />;
  return children;
};

// Wrapper with Navbar + Footer for public pages
const Shell = ({ children }) => (
  <>
    <Navbar />
    <main className="min-h-screen">{children}</main>
    <Footer />
  </>
);

// Public pages on a country site: country navbar + country footer.
const CountryShell = ({ market, children }) => (
  <>
    <Navbar />
    <main className="min-h-screen">{children}</main>
    <CountryFooter market={market} />
  </>
);

/** All routes of one international country site, e.g. /uk/... */
function CountryRoutes({ market }) {
  return (
    <Routes>
      <Route index element={<CountryShell market={market}><CountryHome market={market} /></CountryShell>} />
      <Route path="tasks" element={<CountryShell market={market}><Tasks /></CountryShell>} />
      <Route path="tasks/:id" element={<CountryShell market={market}><TaskDetail /></CountryShell>} />
      <Route path="taskers" element={<CountryShell market={market}><Taskers /></CountryShell>} />
      <Route path="remote" element={<CountryShell market={market}><RemotePage market={market} /></CountryShell>} />
      <Route path="services/:service" element={<CountryShell market={market}><ServicePage market={market} /></CountryShell>} />
      <Route path="compare/:slug" element={<CountryShell market={market}><ComparePage market={market} /></CountryShell>} />
      <Route path="post-task" element={<MarketGate><Navbar /><PostTask /></MarketGate>} />
      <Route path="auth" element={<Auth />} />
      <Route path="signup" element={<Navigate to={`/${market.slug}/auth`} replace />} />
      <Route path="login" element={<Navigate to={`/${market.slug}/requester/login`} replace />} />
      <Route path="requester/login" element={<RequesterAuth />} />
      <Route path="requester/signup" element={<RequesterAuth />} />
      <Route path="tasker/login" element={<TaskerAuth />} />
      <Route path="tasker/signup" element={<TaskerAuth />} />
      <Route path="become-a-tasker" element={<Navigate to={`/${market.slug}/tasker/signup`} replace />} />
      <Route path="requester/*" element={<ProtectedRoute role="requester"><MarketGate><RequesterDashboard /></MarketGate></ProtectedRoute>} />
      <Route path="tasker/*" element={<ProtectedRoute role="tasker"><MarketGate><TaskerDashboard /></MarketGate></ProtectedRoute>} />
      <Route path=":city" element={<CountryShell market={market}><CityPage market={market} /></CountryShell>} />
      <Route path="*" element={<Navigate to={`/${market.slug}`} replace />} />
    </Routes>
  );
}

// Dashboard pages are fully self-contained (include their own layout)
const TeamsShell = ({ children }) => (
  <>
    <Navbar teamsMode />
    <main className="min-h-screen">{children}</main>
  </>
);


class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('App error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f8f4fb', fontFamily: 'sans-serif' }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}></div>
            <h2 style={{ fontWeight: 900, marginBottom: 8, color: '#1a0d2e', fontSize: 22 }}>Something went wrong</h2>
            <p style={{ color: '#7b6490', marginBottom: 20, fontSize: 14 }}>{this.state.error?.message}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
              style={{ background: '#ff2d62', color: 'white', border: 'none', borderRadius: 14, padding: '12px 28px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppRoutes() {
  usePageTracking();
  return (
    <Suspense fallback={<PageLoader />}>
      <TawkController />
      <GeoSuggest />
      <Routes>
        {/* ── International country sites ───────────────── */}
        {MARKETS.filter(m => m.slug).map(m => (
          <Route key={m.code} path={`/${m.slug}/*`} element={<CountryRoutes market={m} />} />
        ))}
        {/* ── Public ─────────────────────────────────────── */}
        <Route path="/" element={<Shell><Home /></Shell>} />
        <Route path="/tasks" element={<Shell><Tasks /></Shell>} />
        <Route path="/tasks/:id" element={<Shell><TaskDetail /></Shell>} />
        <Route path="/taskers" element={<Shell><Taskers /></Shell>} />
        <Route path="/taskers/:id" element={<Shell><TaskerProfile /></Shell>} />
        <Route path="/tasker/:username" element={<Shell><TaskerProfile /></Shell>} />
        <Route path="/how-it-works" element={<Shell><HowItWorks /></Shell>} />
        <Route path="/pricing" element={<Shell><Pricing /></Shell>} />
        <Route path="/policy" element={<Shell><Policy /></Shell>} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/requester/login" element={<RequesterAuth />} />
        <Route path="/requester/signup" element={<RequesterAuth />} />
        <Route path="/tasker/login" element={<TaskerAuth />} />
        <Route path="/tasker/signup" element={<TaskerAuth />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />
        <Route path="/auth/verified" element={<VerifiedLanding />} />
        <Route path="/auth/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/tasker-approved" element={<TaskerApproved />} />
        <Route path="/demo" element={<Shell><Demo /></Shell>} />
        <Route path="/about" element={<Shell><About /></Shell>} />
        <Route path="/careers" element={<Shell><Careers /></Shell>} />
        <Route path="/faq" element={<Shell><FAQ /></Shell>} />
        <Route path="/contact" element={<Shell><Contact /></Shell>} />
        <Route path="/terms" element={<Shell><Terms /></Shell>} />
        <Route path="/blog" element={<Shell><Blog /></Shell>} />
        <Route path="/blog/:slug" element={<Shell><BlogPost /></Shell>} />

        {/* ── Protected — standalone dashboards (no wrapper) ── */}
        <Route path="/post-task" element={
          <MarketGate><Navbar /><PostTask /></MarketGate>
        } />
        <Route path="/requester/*" element={
          <ProtectedRoute role="requester"><MarketGate><RequesterDashboard /></MarketGate></ProtectedRoute>
        } />
        <Route path="/tasker/*" element={
          <ProtectedRoute role="tasker"><MarketGate><TaskerDashboard /></MarketGate></ProtectedRoute>
        } />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={
          <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
        } />

        {/* ── Teams ─────────────────────────────────────── */}
        <Route path="/teams" element={<Shell><TeamsLanding /></Shell>} />
        <Route path="/vooom" element={<Shell><VooomLanding /></Shell>} />
        <Route path="/vooom/browse" element={<Shell><VooomBrowse /></Shell>} />
        <Route path="/vooom/post" element={<Shell><VooomPost /></Shell>} />
        <Route path="/vooom/:id" element={<Shell><VooomDetail /></Shell>} />
        <Route path="/vooom/vs-uber-bolt" element={<Shell><VooomVsUber /></Shell>} />
        <Route path="/vooom/nigeria-diaspora-delivery" element={<Shell><VooomDiaspora /></Shell>} />
        <Route path="/vooom/uk-nigeria-delivery" element={<Shell><VooomUKNigeria /></Shell>} />
        <Route path="/vooom/us-nigeria-delivery" element={<Shell><VooomUSNigeria /></Shell>} />
        <Route path="/vooom/local-delivery-nigeria" element={<Shell><VooomLocalDelivery /></Shell>} />
        <Route path="/teams/login" element={<TeamsAuth />} />
        <Route path="/teams/register" element={<TeamsAuth />} />
        <Route path="/teams/dashboard" element={<TeamsProtectedRoute><TeamsShell><MemberDashboard /></TeamsShell></TeamsProtectedRoute>} />
        <Route path="/teams/hr" element={<TeamsProtectedRoute hrOnly><TeamsShell><HRDashboard /></TeamsShell></TeamsProtectedRoute>} />
        <Route path="/teams/post-task" element={<TeamsProtectedRoute hrOnly><TeamsShell><PostEnterpriseTask /></TeamsShell></TeamsProtectedRoute>} />
        <Route path="/teams/payment/callback" element={<TeamsPaymentCallback />} />

        {/* ── Service Landing Pages ─────────────────────────────── */}
        <Route path="/delivery" element={<Shell><Delivery /></Shell>} />
        <Route path="/errands" element={<Shell><Errands /></Shell>} />
        <Route path="/errands/lagos" element={<Shell><ErrandsLagos /></Shell>} />
        <Route path="/errands/abuja" element={<Shell><ErrandsAbuja /></Shell>} />
        <Route path="/errands/port-harcourt" element={<Shell><ErrandsPortHarcourt /></Shell>} />
        <Route path="/errands/ibadan" element={<Shell><ErrandsIbadan /></Shell>} />
        <Route path="/errands/kano" element={<Shell><ErrandsKano /></Shell>} />
        <Route path="/errands/benin-city" element={<Shell><ErrandsBeninCity /></Shell>} />
        <Route path="/errands/enugu" element={<Shell><ErrandsEnugu /></Shell>} />
        <Route path="/errands/warri" element={<Shell><ErrandsWarri /></Shell>} />
        <Route path="/errands/owerri" element={<Shell><ErrandsOwerri /></Shell>} />
        <Route path="/errands/calabar" element={<Shell><ErrandsCalabar /></Shell>} />
        <Route path="/errands/uyo" element={<Shell><ErrandsUyo /></Shell>} />
        <Route path="/errands/ilorin" element={<Shell><ErrandsIlorin /></Shell>} />
        <Route path="/errands/abeokuta" element={<Shell><ErrandsAbeokuta /></Shell>} />
        <Route path="/errands/onitsha" element={<Shell><ErrandsOnitsha /></Shell>} />
        <Route path="/errands/jos" element={<Shell><ErrandsJos /></Shell>} />
        <Route path="/diaspora" element={<Shell><Diaspora /></Shell>} />
        <Route path="/diaspora/uk" element={<Shell><DiasporaUK /></Shell>} />
        <Route path="/diaspora/usa" element={<Shell><DiasporaUSA /></Shell>} />
        <Route path="/diaspora/canada" element={<Shell><DiasporaCanada /></Shell>} />
        <Route path="/vs/jiji" element={<Shell><TaskeeuVsJiji /></Shell>} />
        <Route path="/errand-runner-near-me" element={<Shell><ErrandRunnerNearMe /></Shell>} />
        <Route path="/refer-and-earn" element={<Shell><ReferAndEarn /></Shell>} />
        <Route path="/refer/:slug" element={<ReferRedirect />} />
        <Route path="/house-land-inspection" element={<Shell><HouseLandInspection /></Shell>} />
        <Route path="/grocery-shopping" element={<Shell><GroceryShopping /></Shell>} />
        <Route path="/property-inspection" element={<Shell><PropertyInspection /></Shell>} />
        <Route path="/field-engineers" element={<Shell><FieldEngineers /></Shell>} />
        <Route path="/installations" element={<Shell><Installations /></Shell>} />
        <Route path="/office-support" element={<Shell><OfficeSupport /></Shell>} />
        <Route path="/document-pickup" element={<Shell><DocumentPickup /></Shell>} />
        <Route path="/asset-verification" element={<Shell><AssetVerification /></Shell>} />
        <Route path="/merchandising" element={<Shell><Merchandising /></Shell>} />
        <Route path="/business-support" element={<Shell><BusinessSupport /></Shell>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <Toaster
                position="top-center" toastOptions={{
                  style: {
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 600,
                    borderRadius: '16px',
                    padding: '12px 20px',
                    fontSize: '14px',
                  },
                  success: { iconTheme: { primary: '#00C37E', secondary: '#fff' } },
                  error:   { iconTheme: { primary: '#ff2d62', secondary: '#fff' } },
                }}
              />
              <AppRoutes />
              <InstallPrompt />
              <PushOptIn />
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
