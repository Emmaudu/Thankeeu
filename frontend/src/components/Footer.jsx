import { Link } from 'react-router-dom';

const scrollTop = () => window.scrollTo({ top: 0, behavior: 'instant' });

const OCCASION_LINKS = [
  { to:'/occasions/birthday',    label:'Birthday' },
  { to:'/occasions/farewell',    label:'Farewell' },
  { to:'/occasions/graduation',  label:'Graduation' },
  { to:'/occasions/anniversary', label:'Anniversary' },
  { to:'/occasions/promotion',   label:'Promotion' },
  { to:'/occasions/new-baby',    label:'Baby Shower' },
];

const Footer = () => (
  <footer style={{ background:'linear-gradient(180deg,#F5F0FF,#EDE5FF)' }} className="border-t border-purple-100 mt-auto">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
        {/* Brand */}
        <div className="col-span-2 sm:col-span-1">
          <Link to="/" onClick={scrollTop} className="flex items-center gap-2.5 mb-4">
            <img src="/android-chrome-192x192.png" alt="Thankeeu"
              className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
            <span className="font-display font-bold text-xl text-warm-900">
              Thank<span className="text-primary-500">eeu</span>
            </span>
          </Link>
          <p className="text-sm text-warm-600 leading-relaxed">
            The world's favourite group card &amp; gift platform. Celebrate every milestone, together.
          </p>
        </div>

        {/* Product */}
        <div>
          <p className="font-bold text-warm-900 text-sm mb-4">Product</p>
          <ul className="space-y-2.5">
            {[
              { to:'/create-card',    label:'Create a card' },
              { to:'/sample',         label:'See a sample card 🎂' },
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
        <span className="text-xs px-3 py-1.5 rounded-full font-bold"
          style={{ background:'#F5F0FF', color:'#7C3AED', border:'1.5px solid #DDD6FE' }}>
          Secure Naira payments via Flutterwave
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
