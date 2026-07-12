import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';

const FAQS = [
  { q: 'How do guests contribute cash gifts on Thankeeu?', a: 'Guests open the wedding card link, scroll to the gift section, choose an amount, and pay via card or bank transfer. Payments are pooled into one pot for the couple. Available in NGN, GBP, USD, and more.' },
  { q: 'Is it safe to collect cash gifts online through Thankeeu?', a: 'Yes. Payments are processed by Flutterwave (Nigeria/Africa) and Stripe (UK/US) — both are regulated, PCI-compliant payment processors used by millions of businesses.' },
  { q: 'Can I collect cash gifts in Nigerian Naira?', a: 'Yes. Thankeeu is one of the few platforms supporting NGN gift collection alongside GBP and USD. Ideal for Nigerian weddings and diaspora couples.' },
  { q: 'When does the couple receive the gift funds?', a: 'The couple requests a withdrawal after the wedding card is delivered. Funds are transferred to their registered bank account within 1-3 business days.' },
  { q: 'Can guests contribute both a message and a cash gift?', a: 'Yes — that\'s the Thankeeu difference. Guests write a message, add photos or a voice note, and contribute to the gift all in one flow. The couple receives everything together.' },
];

export default function WeddingCashGiftPlatform() {
  useSEO({
    title: 'Wedding Cash Gift Platform — Pool Gifts in NGN, GBP & USD | Thankeeu',
    description: 'Collect pooled cash gifts from wedding guests alongside heartfelt messages and photos. Supports NGN, GBP, USD. Guests contribute in seconds — no account needed. The complete wedding card + gift platform.',
    keywords: 'wedding cash gift platform, online wedding cash gift, pool wedding gifts online, collect cash gifts wedding, wedding gift pot, NGN wedding gift, wedding cash gift Nigeria',
    canonical: '/wedding-cash-gift-platform',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('Wedding Cash Gift Platform', 'Collect pooled cash gifts from wedding guests alongside heartfelt messages.', '/wedding-cash-gift-platform'), SCHEMAS.faqPage(FAQS), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'Wedding Cash Gift Platform',url:'/wedding-cash-gift-platform'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>A Wedding Gift Pot Guests Actually Use<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">NGN · GBP · USD · and More</span></>}
      subheadline="Guests open your wedding card, write a message, and contribute to the gift pool — all in one tap. No separate PayPal link. No awkward bank transfer requests. Just one card that does everything."
      tagline="Especially designed for Nigerian couples and the diaspora — with full Naira support, Flutterwave payments, and a card that understands owambe culture."
      tableCompetitorLabel="Gift Registry Platforms"
      faqs={FAQS}
      relatedLinks={[
        {to:'/wedding-group-card', label:'Wedding Group Card'},
        {to:'/digital-wedding-guest-book', label:'Digital Wedding Guest Book'},
        {to:'/wedding-photo-sharing-app', label:'Wedding Photo Sharing App'},
        {to:'/online-wedding-guestbook', label:'Online Wedding Guestbook'},
      ]}
    />
  );
}
