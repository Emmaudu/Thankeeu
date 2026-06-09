import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Section = ({
 id, title, children }) => (
  <section id={id} className="mb-12">
    <h2 className="font-display text-2xl font-semibold text-warm-900 mb-4 pb-3 border-b border-purple-100">{title}</h2>
    <div className="prose prose-sm text-warm-600 space-y-4">{children}</div>
  </section>
);

const Policy = () => {
  useSEO({
    title:       'Privacy Policy & Terms of Service',
    description: 'Read the Thankeeu Privacy Policy and Terms of Service. We protect your personal data and never sell it to third parties.',
    canonical:   '/policy',
    jsonLd:      [
      SCHEMAS.organization,
      SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Privacy Policy', url: '/policy' }]),
    ],
  });

  const { hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [hash]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-2xl sm:text-4xl font-semibold text-warm-900 mb-3">Legal & Policies</h1>
          <p className="text-warm-500">Last updated: January 2025 · Thankeeu</p>
        </div>

        {/* Quick links */}
        <div className="bg-warm-100 rounded-3xl p-5 mb-12">
          <p className="text-sm font-semibold text-warm-700 mb-3">Jump to section:</p>
          <div className="flex flex-wrap gap-2">
            {[['#privacy','Privacy Policy'],['#terms','Terms of Use'],['#cookies','Cookie Policy'],['#refund','Refund Policy']].map(([href, label]) => (
              <a key={href} href={href} className="text-sm text-primary-400 hover:text-primary-600 bg-white border border-purple-100 px-4 py-2 rounded-xl transition-colors">{label}</a>
            ))}
          </div>
        </div>

        <Section id="privacy" title="Privacy Policy">
          <p>Thankeeu ("we", "our", "us") is committed to protecting your privacy. This policy explains how we collect, use, and protect your personal information when you use our platform at thankeeu.com.</p>
          <h3 className="font-semibold text-warm-800 text-base">Information we collect</h3>
          <p>We collect information you provide directly: your name, email address, and password when you create an account. We also collect information about the cards you create, including recipient details and messages. When processing payments, we use Flutterwave — we do not store your card details on our servers.</p>
          <h3 className="font-semibold text-warm-800 text-base">How we use your information</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>To create and manage your account and cards</li>
            <li>To send transactional emails (card invites, delivery notifications)</li>
            <li>To process payments securely via Flutterwave</li>
            <li>To improve our platform and user experience</li>
            <li>To send you service updates (you can opt out anytime)</li>
          </ul>
          <h3 className="font-semibold text-warm-800 text-base">Data sharing</h3>
          <p>We do not sell your personal data. We share limited data with: Flutterwave (for payment processing), Cloudinary (for media file storage), Resend (for email delivery), and Supabase (for database hosting). All partners are GDPR-compliant.</p>
          <h3 className="font-semibold text-warm-800 text-base">Your rights</h3>
          <p>You may request access to, correction of, or deletion of your personal data by emailing privacy@thankeeu.com. We will respond within 30 days.</p>
          <h3 className="font-semibold text-warm-800 text-base">Data retention</h3>
          <p>We retain your account data for as long as your account is active. Card data is retained for 2 years after the card is sent. You can delete your account and all associated data at any time from your settings.</p>
        </Section>

        <Section id="terms" title="Terms of Use">
          <p>By creating an account or using Thankeeu, you agree to these Terms of Use. Please read them carefully.</p>
          <h3 className="font-semibold text-warm-800 text-base">Eligibility</h3>
          <p>You must be at least 13 years old to use Thankeeu. By using the platform, you confirm that you meet this requirement.</p>
          <h3 className="font-semibold text-warm-800 text-base">Acceptable use</h3>
          <p>You agree not to use Thankeeu to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Post offensive, abusive, or illegal content</li>
            <li>Harass, bully, or threaten any individual</li>
            <li>Collect money under false pretences</li>
            <li>Impersonate another person or organisation</li>
            <li>Attempt to circumvent our payment systems</li>
            <li>Use automated bots or scrapers on our platform</li>
          </ul>
          <h3 className="font-semibold text-warm-800 text-base">Content ownership</h3>
          <p>You retain ownership of all content (messages, photos, videos) you submit to Thankeeu. By submitting content, you grant us a limited licence to display and deliver that content to the intended card recipients.</p>
          <h3 className="font-semibold text-warm-800 text-base">Card fees</h3>
          <p>The card creation fee (₦5,000 per card or ₦10,000 for a pack of 5) is charged to activate and send a card. This fee is non-refundable once the card has been activated and the share link has been generated.</p>
          <h3 className="font-semibold text-warm-800 text-base">Limitation of liability</h3>
          <p>Thankeeu is provided "as is". We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our liability is limited to the amount you paid for the relevant card or service.</p>
          <h3 className="font-semibold text-warm-800 text-base">Termination</h3>
          <p>We reserve the right to suspend or terminate accounts that violate these terms, with or without notice.</p>
          <h3 className="font-semibold text-warm-800 text-base">Governing law</h3>
          <p>These terms are governed by the laws of the applicable laws in your jurisdiction.</p>
        </Section>

        <Section id="cookies" title="Cookie Policy">
          <p>Thankeeu uses cookies and similar technologies to improve your experience on our platform.</p>
          <h3 className="font-semibold text-warm-800 text-base">What are cookies?</h3>
          <p>Cookies are small text files stored on your device when you visit a website. They help us remember your preferences and understand how you use our platform.</p>
          <h3 className="font-semibold text-warm-800 text-base">Types of cookies we use</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-warm-800">Essential cookies:</strong> Required for the platform to function. These include authentication tokens that keep you logged in.</li>
            <li><strong className="text-warm-800">Analytics cookies:</strong> Help us understand how visitors use Thankeeu, so we can improve the product. We use privacy-respecting analytics only.</li>
            <li><strong className="text-warm-800">Preference cookies:</strong> Remember your settings and preferences across sessions.</li>
          </ul>
          <h3 className="font-semibold text-warm-800 text-base">Managing cookies</h3>
          <p>You can control cookies through your browser settings. Disabling essential cookies may affect the functionality of the platform. We do not use cookies for advertising or tracking across third-party sites.</p>
        </Section>

        <Section id="refund" title="Refund Policy">
          <h3 className="font-semibold text-warm-800 text-base">Card fees</h3>
          <p>Card fees (₦5,000 per card, ₦20,000 for a pack of 5) are non-refundable once a card has been activated — that is, once the shareable signing link has been generated and the card is open for contributions.</p>
          <p>If you experience a technical error during payment and your card was not activated, please contact us at support@thankeeu.com within 48 hours with your Flutterwave transaction reference and we will issue a full refund.</p>
          <h3 className="font-semibold text-warm-800 text-base">Gift contributions</h3>
          <p>Gift contributions made by card signers can be refunded within 24 hours of payment, provided the card has not yet been delivered to the recipient. After delivery, contributions are non-refundable.</p>
          <p>To request a contribution refund, email refunds@thankeeu.com with your Flutterwave reference number and the card link.</p>
          <h3 className="font-semibold text-warm-800 text-base">Business plans</h3>
          <p>Monthly business plan fees are non-refundable. However, if you are dissatisfied with the service, contact us within 7 days of your first payment and we will work to resolve the issue or offer a credit.</p>
          <h3 className="font-semibold text-warm-800 text-base">Contact us</h3>
          <p>For all refund requests and enquiries: <a href="mailto:support@thankeeu.com" className="text-primary-400 hover:underline">support@thankeeu.com</a></p>
        </Section>

        <div className="bg-primary-50 rounded-3xl p-6 text-center">
          <p className="text-sm text-warm-600">Questions about our policies?</p>
          <a href="mailto:legal@thankeeu.com" className="text-primary-400 font-medium hover:text-primary-600 text-sm">legal@thankeeu.com</a>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Policy;
