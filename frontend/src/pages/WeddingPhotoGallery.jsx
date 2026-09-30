import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';

export default function WeddingPhotoGallery() {
  useSEO({
    title: 'Wedding Photo Gallery — Share & Collect Guest Photos Online | Thankeeu',
    description: 'Create a shared online wedding photo gallery. Guests upload their photos via QR code — no app needed. The gallery fills in real time during the reception. Plus messages, voice notes and a gift pot.',
    keywords: 'wedding photo gallery, shared wedding photo gallery, online wedding photo gallery, wedding guest photo gallery, create wedding photo gallery',
    canonical: '/wedding-photo-gallery',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('Wedding Photo Gallery', 'Create a shared online wedding photo gallery.', '/wedding-photo-gallery'), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'Wedding Photo Gallery',url:'/wedding-photo-gallery'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>A Shared Wedding Photo Gallery<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">That Fills Itself During the Reception</span></>}
      subheadline="Display your QR code at the venue — every guest who scans it adds their photos to your shared gallery in real time. Watch it grow from the first dance to the last song."
      tagline="Not just a gallery — a complete wedding memory. Every photo, message, voice note, and gift contribution lives in one place."
      tableCompetitorLabel="Gallery Apps"
      relatedLinks={[
        {to:'/wedding-photo-album-online', label:'Wedding Photo Album Online'},
        {to:'/collect-wedding-guest-photos', label:'Collect Wedding Guest Photos'},
        {to:'/wedding-photo-sharing-app', label:'Wedding Photo Sharing App'},
        {to:'/wedding-memory-wall', label:'Wedding Memory Wall'},
      ]}
    />
  );
}
