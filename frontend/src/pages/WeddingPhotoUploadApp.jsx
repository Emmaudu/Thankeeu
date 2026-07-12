import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';

export default function WeddingPhotoUploadApp() {
  useSEO({
    title: 'Wedding Photo Upload App — Let Guests Upload Directly from Their Phones | Thankeeu',
    description: 'Let wedding guests upload photos directly from their phones. No app download needed. Guests scan a QR code and photos go straight into your wedding gallery. Plus messages, voice notes and a gift pot.',
    keywords: 'wedding photo upload app, wedding guest photo upload, let guests upload wedding photos, wedding photos from guests phones, upload wedding photos QR code',
    canonical: '/wedding-photo-upload-app',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('Wedding Photo Upload App', 'Let guests upload photos directly from their phones.', '/wedding-photo-upload-app'), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'Wedding Photo Upload App',url:'/wedding-photo-upload-app'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>Let Every Guest Upload Photos<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Straight from Their Phone</span></>}
      subheadline="No app to download, no account to create. Guests tap your QR code link and photos go directly into your shared wedding gallery — full resolution, permanently saved."
      tagline="The photos on your guests' phones are the real story of your day. Thankeeu collects every one of them, plus messages, voice notes, and gift contributions."
      tableCompetitorLabel="Photo Upload Apps"
      relatedLinks={[
        {to:'/wedding-photo-sharing-app', label:'Wedding Photo Sharing App'},
        {to:'/qr-code-for-wedding-photos', label:'QR Code for Wedding Photos'},
        {to:'/collect-wedding-guest-photos', label:'Collect Wedding Guest Photos'},
        {to:'/wedding-memory-wall', label:'Wedding Memory Wall'},
      ]}
    />
  );
}
