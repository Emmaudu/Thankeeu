import { Link } from 'react-router-dom';

const scrollTop = () => window.scrollTo({ top: 0, behavior: 'instant' });

const OCCASION_LINKS = [
  { to:'/occasions/birthday',           label:'Birthday' },
  { to:'/occasions/farewell',           label:'Farewell' },
  { to:'/occasions/graduation',         label:'Graduation' },
  { to:'/occasions/anniversary',        label:'Anniversary' },
  { to:'/occasions/promotion',          label:'Promotion' },
  { to:'/occasions/new-baby',           label:'New Baby' },
  { to:'/occasions/wedding',            label:'Wedding' },
  { to:'/occasions/staff-appreciation', label:'Staff Appreciation' },
  { to:'/cards/leaving-card',           label:'Leaving Cards' },
  { to:'/cards/retirement',             label:'Retirement' },
  { to:'/cards/get-well-soon',          label:'Get Well Soon' },
  { to:'/cards/thank-you',              label:'Thank You' },
];

const MORE_OCCASION_LINKS = [
  { to:'/cards/maternity-leave',        label:'Maternity Leave' },
  { to:'/cards/baby-shower',            label:'Baby Shower' },
  { to:'/cards/christmas',              label:'Christmas' },
  { to:'/cards/sympathy',               label:'Sympathy' },
  { to:'/cards/welcome',                label:'Welcome Cards' },
  { to:'/cards/good-luck',              label:'Good Luck' },
  { to:'/cards/engagement',             label:'Engagement' },
  { to:'/cards/new-home',               label:'New Home' },
  { to:'/cards/teacher-thank-you',      label:'Teacher Thank You' },
  { to:'/cards/teacher-appreciation',   label:'Teacher Appreciation' },
  { to:'/cards/boss-day',               label:"Boss's Day" },
  { to:'/cards/administrative-professionals-day', label:'Admin Pro Day' },
  { to:'/cards/thanksgiving',           label:'Thanksgiving' },
  { to:'/cards/mothers-day',            label:"Mother's Day" },
  { to:'/cards/fathers-day',            label:"Father's Day" },
  { to:'/online-group-cards-uk',        label:'Group Cards UK' },
  { to:'/online-group-cards-us',        label:'Group Cards US' },
  { to:'/online-group-cards-nigeria',   label:'Group Cards Nigeria' },
];

const Footer = () => (
  <footer style={{ background:'linear-gradient(180deg,#F5F0FF,#EDE5FF)' }} className="border-t border-purple-100 mt-auto">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-10">
        {/* Brand */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <Link to="/" onClick={scrollTop} className="flex items-center gap-2.5 mb-4">
            <img src="/android-chrome-192x192.png" alt="Thankeeu"
              className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
            <span className="font-display font-bold text-xl text-warm-900">
              thank<span className="text-primary-500">eeu</span>
            </span>
          </Link>
          <p className="text-sm text-warm-600 leading-relaxed">
            The world&apos;s favourite group card &amp; gift platform. Celebrate every milestone, together.
          </p>
        </div>

        {/* Product */}
        <div>
          <p className="font-bold text-warm-900 text-sm mb-4">Product</p>
          <ul className="space-y-2.5">
            {[
              { to:'/create-card',    label:'Create a card' },
              { to:'/sample',         label:'See a sample card' },
              { to:'/pricing',        label:'Pricing' },
              { to:'/company/signup', label:'For Teams' },
              { to:'/blog',           label:'Blog' },
            ].map(({ to, label }) => (
              <li key={to}><Link to={to} onClick={scrollTop} className="text-sm text-warm-600 hover:text-primary-600 font-medium transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Occasions */}
        <div>
          <p className="font-bold text-warm-900 text-sm mb-4">Occasions</p>
          <ul className="space-y-2.5">
            {OCCASION_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} onClick={scrollTop} className="text-sm text-warm-600 hover:text-primary-600 font-medium transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* More Occasions */}
        <div>
          <p className="font-bold text-warm-900 text-sm mb-4">More Occasions</p>
          <ul className="space-y-2.5">
            {MORE_OCCASION_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} onClick={scrollTop} className="text-sm text-warm-600 hover:text-primary-600 font-medium transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <p className="font-bold text-warm-900 text-sm mb-4">Company</p>
          <ul className="space-y-2.5">
            {[
              { to:'/how-it-works', label:'How it works' },
              { to:'/faq',          label:'FAQ' },
              { to:'/policy',       label:'Privacy & Terms' },
            ].map(({ to, label }) => (
              <li key={to}><Link to={to} onClick={scrollTop} className="text-sm text-warm-600 hover:text-primary-600 font-medium transition-colors">{label}</Link></li>
            ))}
            <li>
              <a href="mailto:support@thankeeu.com" className="text-sm text-warm-600 hover:text-primary-600 font-medium transition-colors">
                support@thankeeu.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-purple-100 pt-5 pb-5 flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2">
        <Link to="/pals" onClick={scrollTop} className="text-xs text-warm-400 hover:text-primary-600 transition-colors">
          Start a Thankeeu Pals group — free
        </Link>
        <Link to="/vendors" onClick={scrollTop} className="text-xs text-warm-400 hover:text-primary-600 transition-colors">
          Become a gift vendor
        </Link>
      </div>

      <div className="border-t border-purple-200 pt-7 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-warm-500 text-center sm:text-left">
          © {new Date().getFullYear()} Thankeeu. Made with love worldwide
        </p>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-xs px-3 py-1.5 rounded-full font-bold"
            style={{ background:'#F5F0FF', color:'#7C3AED', border:'1.5px solid #DDD6FE' }}>
            🔒 Payments secured by PCI-DSS
          </span>
          <span className="text-xs px-3 py-1.5 rounded-full font-bold"
            style={{ background:'#F0FDF4', color:'#15803D', border:'1.5px solid #BBF7D0' }}>
            🌍 Available in 30+ countries
          </span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
