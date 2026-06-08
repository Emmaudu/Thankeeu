import { Link } from 'react-router-dom';

const Footer = () => (
  <footer style={{ background:'linear-gradient(180deg,#F5F0FF,#EDE5FF)' }} className="border-t border-purple-100 mt-auto">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
        {/* Brand */}
        <div className="col-span-2 sm:col-span-1">
          <Link to="/" className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:'linear-gradient(135deg,#A855F7,#7C3AED)' }}>
              <span className="text-xl">💌</span>
            </div>
            <span className="font-display font-bold text-xl text-warm-900">
              Thank<span className="text-primary-500">eeu</span>
            </span>
          </Link>
          <p className="text-sm text-warm-600 leading-relaxed mb-4">
            The world's favourite group card & gift platform. Celebrate every milestone, together 🌍
          </p>
          <div className="flex gap-2">
            {['🐦','💼','📸'].map((icon,i) => (
              <a key={i} href="#"
                className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-base border-2 border-purple-100 hover:border-primary-300 hover:bg-primary-50 transition-all">
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* Product */}
        <div>
          <p className="font-bold text-warm-900 text-sm mb-4">🎁 Product</p>
          <ul className="space-y-2.5">
            {[
              { to:'/create-card', label:'Create a card' },
              { to:'/pricing',     label:'Pricing' },
              { to:'/company/signup', label:'For Teams' },
              { to:'/blog',        label:'Blog' },
            ].map(({ to, label }) => (
              <li key={to}><Link to={to} className="text-sm text-warm-600 hover:text-primary-600 font-medium transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Occasions */}
        <div>
          <p className="font-bold text-warm-900 text-sm mb-4">🎉 Occasions</p>
          <ul className="space-y-2.5">
            {['🎂 Birthday','💼 Farewell','🎓 Graduation','💍 Anniversary','🌟 Promotion','👶 Baby shower'].map(l => (
              <li key={l}><span className="text-sm text-warm-600 font-medium">{l}</span></li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <p className="font-bold text-warm-900 text-sm mb-4">🏢 Company</p>
          <ul className="space-y-2.5">
            {[
              { to:'/how-it-works', label:'How it works' },
              { to:'/faq',          label:'FAQ' },
              { to:'/policy',       label:'Privacy & Terms' },
            ].map(({ to, label }) => (
              <li key={to}><Link to={to} className="text-sm text-warm-600 hover:text-primary-600 font-medium transition-colors">{label}</Link></li>
            ))}
            <li><a href="mailto:support@thankeeu.com" className="text-sm text-warm-600 hover:text-primary-600 font-medium transition-colors">📧 support@thankeeu.com</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-purple-200 pt-7 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-warm-500 text-center sm:text-left">
          © {new Date().getFullYear()} Thankeeu. Made with 💜 worldwide 🌍
        </p>
        <span className="text-xs px-3 py-1.5 rounded-full font-bold"
          style={{ background:'#F5F0FF', color:'#7C3AED', border:'1.5px solid #DDD6FE' }}>
          🔒 Secure Naira payments via Paystack
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
