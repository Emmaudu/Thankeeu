import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';

export default function WeddingGuestPhotoCollection() {
  useSEO({
    title: 'Wedding Guest Photo Collection — Gather Every Shot in One Place | Thankeeu',
    description: 'Collect every wedding guest\'s photos automatically. Display a QR code at the venue — guests scan and upload without downloading anything. Full quality photos, permanently saved.',
    keywords: 'wedding guest photo collection, collect guest photos wedding, wedding guest photos one place, gather wedding photos guests, wedding photo collection tool',
    canonical: '/wedding-guest-photo-collection',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('Wedding Guest Photo Collection', 'Collect every wedding guest\'s photos automatically.', '/wedding-guest-photo-collection'), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'Wedding Guest Photo Collection',url:'/wedding-guest-photo-collection'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>Gather Every Guest's Photos<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Without Asking Each Person Individually</span></>}
      subheadline="Stop chasing guests for photos after the wedding. One QR code at the venue — guests scan and upload their best shots directly into your shared collection, automatically."
      tagline="The photos guests take on their phones are often the most real and most treasured. Thankeeu makes collecting them effortless — before, during and after the event."
      tableCompetitorLabel="Collection Tools"
      relatedLinks={[
        {to:'/collect-wedding-guest-photos', label:'Collect Wedding Guest Photos'},
        {to:'/qr-code-for-wedding-photos', label:'QR Code for Wedding Photos'},
        {to:'/wedding-photo-sharing-app', label:'Wedding Photo Sharing App'},
      ]}
    />
  );
}
