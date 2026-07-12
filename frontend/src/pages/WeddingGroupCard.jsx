import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';

const FAQS = [
  { q: 'What is a wedding group card?', a: 'A wedding group card is a digital card that the entire wedding party and all guests sign together. Everyone leaves a personal message, photo, or voice note, and the couple receives it as one beautiful combined gift.' },
  { q: 'How many people can sign a wedding group card?', a: 'Unlimited. There is no cap on signers. A 500-guest wedding can all contribute to the same card.' },
  { q: 'Can I add a gift collection to the wedding group card?', a: 'Yes. Thankeeu\'s wedding card combines messages, photos, voice notes, and a pooled cash gift — all in one link. Guests can contribute any or all of these.' },
  { q: 'Can the wedding group card include photos?', a: 'Yes. Every guest can attach a photo or video to their message. The card collects everything together — and after the wedding, Thankeeu assembles it all into a Memory Movie.' },
  { q: 'Is the wedding group card free?', a: 'Creating and collecting signatures is free. You pay only when delivering the final card to the couple.' },
];

export default function WeddingGroupCard() {
  useSEO({
    title: 'Wedding Group Card — Everyone Signs, Messages, Photos & Gifts | Thankeeu',
    description: 'Create a wedding group card that everyone signs. Guests leave messages, photos, voice notes, and gift contributions — all in one card. Free to create. Delivered as a beautiful keepsake.',
    keywords: 'wedding group card, group card for wedding, everyone sign wedding card, digital wedding group card, online wedding card all guests sign, group e-card wedding',
    canonical: '/wedding-group-card',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('Wedding Group Card', 'Create a wedding group card that everyone signs.', '/wedding-group-card'), SCHEMAS.faqPage(FAQS), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'Wedding Group Card',url:'/wedding-group-card'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>A Wedding Group Card<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Signed by Everyone Who Loves Them</span></>}
      subheadline="One card. Every guest. Heartfelt messages, photos, voice notes, and a gift pool — all delivered to the couple together as their wedding keepsake."
      tagline="Better than a physical card that gets passed around and lost. Better than an email. A Thankeeu wedding group card is something the couple will open and reopen for years."
      tableCompetitorLabel="Physical Group Cards"
      faqs={FAQS}
      relatedLinks={[
        {to:'/digital-wedding-guest-book', label:'Digital Wedding Guest Book'},
        {to:'/wedding-cash-gift-platform', label:'Wedding Cash Gift Platform'},
        {to:'/online-wedding-guestbook', label:'Online Wedding Guestbook'},
        {to:'/occasions/wedding', label:'Wedding Occasion Cards'},
      ]}
    />
  );
}
