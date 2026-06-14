import { Link } from 'react-router-dom';
import Icon from './ui/Icon';

const scrollTop = () => window.scrollTo({ top: 0, behavior: 'instant' });

const SOCIALS = [
  { icon: 'Twitter', href: '#' },
  { icon: 'Linkedin', href: '#' },
  { icon: 'Instagram', href: '#' },
];

const OCCASION_LINKS = [
  { to:'/occasions/birthday',    label:'Birthday',    icon:'Cake' },
  { to:'/occasions/farewell',    label:'Farewell',    icon:'Briefcase' },
  { to:'/occasions/graduation',  label:'Graduation',  icon:'GraduationCap' },
  { to:'/occasions/anniversary', label:'Anniversary', icon:'Heart' },
  { to:'/occasions/promotion',   label:'Promotion',   icon:'TrendingUp' },
  { to:'/occasions/new-baby',    label:'Baby Shower', icon:'Baby' },
];

const Footer = () => (
  <footer style={{ background:'linear-gradient(180deg,#F5F0FF,#EDE5FF)' }} className="border-t border-purple-100 mt-auto">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
        {/* Brand */}
        <div className="col-span-2 sm:col-span-1">
          <Link to="/" onClick={scrollTop} className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:'linear-gradient(135deg,#A855F7,#7C3AED)' }}>
              <Icon name="Gift" size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-warm-900">
              Thank<span className="text-primary-500">eeu</span>
            </span>
          </Link>
          <p className="text-sm text-warm-600 leading-relaxed mb-4">
            The world's favourite group card &amp; gift platform. Celebrate every milestone, together.
          </p>
          <div className="flex gap-2">
            {SOCIALS.map(({ icon, href }) => (
              <a key={icon} href={href}
                className="w-9 h-9 bg-white rounded-xl flex items-center justify-center border-2 border-purple-100 hover:border-primary-300 hover:bg-primary-50 transition-all text-warm-500 hover:text-primary-600">
                <Icon name={icon} size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Product */}
        <div>
          <p className="font-bold text-warm-900 text-sm mb-4 flex items-center gap-2"><Icon name="Gift" size={15} className="text-primary-500"/> Product</p>
          <ul className="space-y-2.5">
            {[
              { to:'/create-card', label:'Create a card' },
              { to:'/sample',      label:'See a sample card 🎂' },
              { to:'/pricing',     label:'Pricing' },
              { to:'/company/signup', label:'For Teams' },
              { to:'/blog',        label:'Blog' },
            ].map(({ to, label }) => (
              <li key={to}><Link to={to} onClick={scrollTop} className="text-sm text-warm-600 hover:text-primary-600 font-medium transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Occasions */}
        <div>
          <p className="font-bold text-warm-900 text-sm mb-4 flex items-center gap-2"><Icon name="Party" size={15} className="text-primary-500"/> Occasions</p>
          <ul className="space-y-2.5">
            {OCCASION_LINKS.map(({ to, label, icon }) => (
              <li key={to}>
                <Link to={to} onClick={scrollTop} className="text-sm text-warm-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-2">
                  <Icon name={icon} size={14} className="text-warm-400" /> {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <p className="font-bold text-warm-900 text-sm mb-4 flex items-center gap-2"><Icon name="Building" size={15} className="text-primary-500"/> Company</p>
          <ul className="space-y-2.5">
            {[
              { to:'/how-it-works', label:'How it works' },
              { to:'/faq',          label:'FAQ' },
              { to:'/policy',       label:'Privacy & Terms' },
            ].map(({ to, label }) => (
              <li key={to}><Link to={to} onClick={scrollTop} className="text-sm text-warm-600 hover:text-primary-600 font-medium transition-colors">{label}</Link></li>
            ))}
            <li>
              <a href="mailto:support@thankeeu.com" className="text-sm text-warm-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-2">
                <Icon name="Mail" size={14} className="text-warm-400" /> support@thankeeu.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-purple-100 pt-5 pb-5 flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2">
        <Link to="/pals" onClick={scrollTop} className="text-xs text-warm-400 hover:text-primary-600 transition-colors flex items-center gap-1.5">
          <Icon name="Users" size={13} /> Start a Thankeeu Pals group — free
        </Link>
        <Link to="/vendors" onClick={scrollTop} className="text-xs text-warm-400 hover:text-primary-600 transition-colors flex items-center gap-1.5">
          <Icon name="Store" size={13} /> Become a gift vendor
        </Link>
      </div>

      <div className="border-t border-purple-200 pt-7 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-warm-500 text-center sm:text-left flex items-center gap-1.5">
          © {new Date().getFullYear()} Thankeeu. Made with <Icon name="Heart" size={12} className="text-primary-400" /> worldwide
        </p>
        <span className="text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5"
          style={{ background:'#F5F0FF', color:'#7C3AED', border:'1.5px solid #DDD6FE' }}>
          <Icon name="Lock" size={12} /> Secure Naira payments via Flutterwave
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
