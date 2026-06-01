import { Link } from 'react-router-dom';
import ThankeeuLogo from './ThankeeuLogo';

const Footer = () => (
  <footer className="bg-gray-950 text-gray-400">
    <div className="section-container py-12 md:py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 md:mb-12">

        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <ThankeeuLogo size={32} textSize="text-lg" className="[&_span]:text-white mb-3" />
          <p className="text-sm leading-relaxed mb-4 text-gray-500">
            Nigeria's home for group cards and gifts. Celebrate every milestone, together.
          </p>
          <p className="text-xs text-gray-600">Made with 💜 for Nigeria 🇳🇬</p>
        </div>

        {/* Product */}
        <div>
          <p className="text-sm font-semibold text-white mb-4">Product</p>
          <ul className="space-y-3 text-sm">
            <li><Link to="/signup"  className="hover:text-white transition-colors">Create a card</Link></li>
            <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            <li><a href="#occasions" className="hover:text-white transition-colors">Occasions</a></li>
            <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
            <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
          </ul>
        </div>

        {/* For Teams */}
        <div>
          <p className="text-sm font-semibold text-white mb-4">For Teams</p>
          <ul className="space-y-3 text-sm">
            <li><Link to="/company/signup" className="hover:text-white transition-colors">Company signup</Link></li>
            <li><Link to="/company/login"  className="hover:text-white transition-colors">Company login</Link></li>
            <li><Link to="/pricing"        className="hover:text-white transition-colors">Team pricing</Link></li>
            <li><a href="#book-demo"       className="hover:text-white transition-colors">Book a demo</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <p className="text-sm font-semibold text-white mb-4">Company</p>
          <ul className="space-y-3 text-sm">
            <li><Link to="/policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link to="/policy" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><a href="mailto:support@thankeeu.ng" className="hover:text-white transition-colors">Contact us</a></li>
            <li><a href="mailto:support@thankeeu.ng" className="hover:text-white transition-colors">Support</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-900 pt-6 md:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
        <p>© {new Date().getFullYear()} Thankeeu. All rights reserved.</p>
        <p className="flex items-center gap-2">
          Payments by <strong className="text-gray-500">Paystack</strong> ·
          Emails by <strong className="text-gray-500">Resend</strong> ·
          Storage by <strong className="text-gray-500">Supabase</strong>
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
