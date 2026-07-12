import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';

export default function WeddingPhotoSharingApp() {
  useSEO({
    title: 'Wedding Photo Sharing App — Collect Guest Photos with QR Code | Thankeeu',
    description: 'The best wedding photo sharing app for 2025. Guests scan a QR code and upload photos instantly — no app download, no account needed. Plus messages, voice notes and a gift pot. Try Thankeeu free.',
    keywords: 'wedding photo sharing app, best wedding photo sharing app 2025, collect wedding photos guests, wedding photo app no download, share wedding photos guests QR code',
    canonical: '/wedding-photo-sharing-app',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('Wedding Photo Sharing App', 'The best wedding photo sharing app. Guests scan a QR code and upload photos instantly.', '/wedding-photo-sharing-app'), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'Wedding Photo Sharing App',url:'/wedding-photo-sharing-app'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>The Wedding Photo Sharing App<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Guests Actually Use</span></>}
      subheadline="One QR code at the venue — guests scan, upload, and every photo appears in your shared wedding gallery instantly. No app download. No account. Works on every phone."
      tagline="Unlike standalone photo apps — Thankeeu combines guest photos with heartfelt messages, voice notes, and a gift pot. Everything delivered to the couple in one beautiful card."
      tableCompetitorLabel="Photo-Only Apps"
      relatedLinks={[
        {to:'/digital-wedding-guest-book', label:'Digital Wedding Guest Book'},
        {to:'/qr-code-for-wedding-photos', label:'QR Code for Wedding Photos'},
        {to:'/collect-wedding-guest-photos', label:'Collect Wedding Guest Photos'},
        {to:'/wedding-memory-wall', label:'Wedding Memory Wall'},
        {to:'/best-wedding-photo-sharing-app', label:'Best Wedding Photo Sharing App'},
        {to:'/guestpix-alternative', label:'GuestPix Alternative'},
        {to:'/weduploader-alternative', label:'WedUploader Alternative'},
      ]}
    />
  );
}
