import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';

export default function CollectWeddingGuestPhotos() {
  useSEO({
    title: 'Collect Wedding Guest Photos — One Link, Every Memory | Thankeeu',
    description: 'Collect every wedding guest\'s photos in one place. Share a single link or QR code. Guests upload full-quality photos with no app needed. Plus messages, voice notes, and a gift pot. Free to start.',
    keywords: 'collect wedding guest photos, collect photos from wedding guests, gather wedding guest photos, wedding guest photo collection, how to collect photos from wedding guests',
    canonical: '/collect-wedding-guest-photos',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('Collect Wedding Guest Photos', 'Collect every wedding guest\'s photos in one place.', '/collect-wedding-guest-photos'), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'Collect Wedding Guest Photos',url:'/collect-wedding-guest-photos'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>Collect Every Guest's Photos<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">From One Shared Link</span></>}
      subheadline="One link. Every guest. Thousands of photos. Share your Thankeeu link before, during, and after the wedding — guests upload their best shots and the whole collection grows in real time."
      tagline="Your photographer captures the highlights. Your guests capture the real story — the speeches, the dance floor, the aunties. Thankeeu collects it all automatically."
      tableCompetitorLabel="Collection Tools"
      relatedLinks={[
        {to:'/qr-code-for-wedding-photos', label:'QR Code for Wedding Photos'},
        {to:'/wedding-photo-sharing-app', label:'Wedding Photo Sharing App'},
        {to:'/digital-wedding-guest-book', label:'Digital Wedding Guest Book'},
        {to:'/wedding-memory-wall', label:'Wedding Memory Wall'},
      ]}
    />
  );
}
