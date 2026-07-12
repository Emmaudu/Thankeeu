import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';

const FAQS = [
  { q: 'How do I create a QR code for wedding photos?', a: 'Create your wedding card on Thankeeu and enable the Live Memory Wall. Thankeeu instantly generates a print-ready QR code. Print it on table cards, welcome signs, or the order of service — guests scan and upload directly from their phone.' },
  { q: 'Where should I display the QR code at my wedding?', a: 'The most effective spots: each reception table, the welcome sign, the bar, and the photo booth. The more places guests see it, the more photos you collect.' },
  { q: 'What size should I print the QR code?', a: 'Aim for at least 2 inches (5cm) square for table cards, and 6-8 inches for standing signs. Thankeeu generates a high-resolution version suitable for large-format printing.' },
  { q: 'Do guests need to create an account to scan the QR code?', a: 'No. Guests scan, choose photos from their camera roll, and upload — no account, no app download, no delays.' },
  { q: 'What happens to the photos after the wedding?', a: 'Every photo is permanently saved in your Thankeeu wedding card. Download them all as a ZIP, share them with family, or watch Thankeeu automatically turn them into a Memory Movie.' },
];

export default function QRCodeForWeddingPhotos() {
  useSEO({
    title: 'QR Code for Wedding Photos — Let Guests Upload Instantly | Thankeeu',
    description: 'Create a QR code for your wedding so guests can instantly upload photos to a shared gallery. Print on table cards or a welcome sign. No app needed. Guests scan and upload in seconds. Try free.',
    keywords: 'QR code for wedding photos, wedding QR code photos, create QR code wedding guest photos, wedding photo QR code sign, print QR code for wedding photos',
    canonical: '/qr-code-for-wedding-photos',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('QR Code for Wedding Photos', 'Create a QR code for your wedding so guests can instantly upload photos.', '/qr-code-for-wedding-photos'), SCHEMAS.faqPage(FAQS), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'QR Code for Wedding Photos',url:'/qr-code-for-wedding-photos'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>Display a QR Code at Your Wedding.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Every Guest Uploads Their Photos.</span></>}
      subheadline="Thankeeu auto-generates a print-ready QR code with your wedding card. Print it on table cards, welcome signs, or your photo booth. Guests scan and upload in seconds — no app needed."
      tagline="Most couples only get the photographer's 300 shots. With a QR code at every table, you get thousands — every candid, every laugh, every dance floor moment."
      tableCompetitorLabel="Photo-Only QR Tools"
      faqs={FAQS}
      relatedLinks={[
        {to:'/wedding-photo-sharing-app', label:'Wedding Photo Sharing App'},
        {to:'/collect-wedding-guest-photos', label:'Collect Wedding Guest Photos'},
        {to:'/digital-wedding-guest-book', label:'Digital Wedding Guest Book'},
        {to:'/wedding-memory-wall', label:'Wedding Memory Wall'},
      ]}
    />
  );
}
