import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import { useSEO } from '../hooks/useSEO';

const FEATURES = [
  { icon: 'Store',    title: 'Your own storefront',        desc: 'A branded page with your logo, cover photo, products, and policies — shareable with a single link.' },
  { icon: 'ShoppingCart', title: 'Built-in checkout',       desc: 'Customers pay securely with Flutterwave. No setting up your own payment gateway.' },
  { icon: 'Cake',     title: 'Show up where gifts happen',  desc: 'Your products appear right inside Thankeeu cards, so gift-givers can add a real gift to their message.' },
  { icon: 'Mail',     title: 'Order alerts with deadlines', desc: 'Get notified by email the moment an order comes in, including the celebration date you need to deliver by.' },
  { icon: 'BarChart', title: 'Orders dashboard',            desc: 'Track every order, update statuses, and see your payout for each sale.' },
  { icon: 'Percent',  title: 'Simple, flat fee',            desc: 'Thankeeu takes a flat ₦5,000 from each order. You keep the rest — no hidden percentages.' },
];

const STEPS = [
  { num: '01', icon: 'Edit',   title: 'Apply to sell',     desc: 'Tell us about your business — cakes, flowers, hampers, gifts, or anything else worth celebrating with.' },
  { num: '02', icon: 'Check',  title: 'Get verified',      desc: 'Our team reviews your application and activates your storefront.' },
  { num: '03', icon: 'Image',  title: 'Add your products', desc: 'Upload photos, set prices, write descriptions — your storefront is ready in minutes.' },
  { num: '04', icon: 'Cart',   title: 'Start receiving orders', desc: 'Customers discover and buy your products directly from Thankeeu cards and your storefront.' },
];

export default function VendorLanding() {
  useSEO({
    title: 'Sell on Thankeeu — gifts, cakes, flowers & more',
    description: 'Open a free storefront on Thankeeu. Reach customers buying gifts for birthdays, farewells, and celebrations — with built-in checkout and order alerts.',
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAFA' }}>
      <Navbar />

      {/* Hero */}
      <section className="px-4 pt-14 pb-12 sm:pt-20 sm:pb-16" style={{ background: 'linear-gradient(160deg,#F5F0FF,#FFF1F3)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-purple-100 text-xs font-semibold text-primary-600 mb-5">
            <Icon name="Store" size={14} /> Thankeeu Marketplace
          </span>
          <h1 className="font-bold text-warm-900 mb-4" style={{ fontSize: 'clamp(2rem,6vw,3.25rem)' }}>
            Sell gifts to people<br/>already in a giving mood
          </h1>
          <p className="text-warm-500 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            Open a free storefront and reach customers buying cakes, flowers, hampers, and gifts for birthdays, farewells, and milestones — right inside Thankeeu's group cards.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/vendor/signup" className="btn-primary px-6 py-3.5 text-sm sm:text-base inline-flex items-center justify-center gap-2">
              <Icon name="Rocket" size={16} /> Open your storefront
            </Link>
            <Link to="/vendor/login" className="btn-secondary px-6 py-3.5 text-sm sm:text-base inline-flex items-center justify-center gap-2">
              <Icon name="ArrowRight" size={16} /> I already sell here
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-14 sm:py-20 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="font-bold text-warm-900 mb-3" style={{ fontSize: 'clamp(1.5rem,4vw,2.25rem)' }}>Everything you need to sell</h2>
          <p className="text-warm-500 max-w-xl mx-auto">No monthly fees, no setup cost — just a storefront, checkout, and customers who are already shopping for gifts.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-2xl border border-purple-100 p-6">
              <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <Icon name={f.icon} size={20} className="text-primary-600" />
              </div>
              <h3 className="font-semibold text-warm-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-warm-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-14 sm:py-20" style={{ background: '#F8F7FF' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-bold text-warm-900 mb-3" style={{ fontSize: 'clamp(1.5rem,4vw,2.25rem)' }}>How it works</h2>
            <p className="text-warm-500">From application to your first sale.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map(s => (
              <div key={s.num} className="bg-white rounded-2xl border border-purple-100 p-6 relative">
                <span className="text-xs font-bold text-primary-300 mb-3 block">{s.num}</span>
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mb-3">
                  <Icon name={s.icon} size={18} className="text-primary-600" />
                </div>
                <h3 className="font-semibold text-warm-900 mb-1.5 text-sm">{s.title}</h3>
                <p className="text-xs text-warm-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:py-24 text-center" style={{ background: 'linear-gradient(135deg,#7C3AED,#EC4899)' }}>
        <div className="max-w-xl mx-auto">
          <Icon name="Store" size={36} className="text-white mx-auto mb-5" />
          <h2 className="font-bold text-white mb-4" style={{ fontSize: 'clamp(1.5rem,4vw,2.25rem)' }}>
            Ready to open your storefront?
          </h2>
          <p className="text-white/80 mb-8">Applications are usually reviewed within 24 hours.</p>
          <Link to="/vendor/signup" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-primary-700 font-bold text-sm sm:text-base hover:bg-purple-50 transition-colors">
            <Icon name="Rocket" size={16} /> Apply to sell on Thankeeu
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
