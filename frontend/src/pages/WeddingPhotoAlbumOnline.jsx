import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';

export default function WeddingPhotoAlbumOnline() {
  useSEO({
    title: 'Online Wedding Photo Album — Shared by Every Guest | Thankeeu',
    description: 'Create an online wedding photo album that every guest contributes to. Guests upload photos via QR code — no app download. Full quality. Permanently saved. Plus messages and a gift pot.',
    keywords: 'online wedding photo album, wedding photo album online, shared wedding photo album, digital wedding photo album, wedding photo book online',
    canonical: '/wedding-photo-album-online',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('Online Wedding Photo Album', 'Create an online wedding photo album that every guest contributes to.', '/wedding-photo-album-online'), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'Online Wedding Photo Album',url:'/wedding-photo-album-online'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>An Online Wedding Photo Album<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Curated by 200 Different Guests</span></>}
      subheadline="A single photographer sees one perspective. Your 200 guests see 200. Thankeeu collects them all into one shared album — full quality, permanently saved, accessible forever."
      tagline="Unlike Google Photos albums or Dropbox folders — Thankeeu combines your photo album with messages, voice notes, and a gift pot in one beautiful card."
      tableCompetitorLabel="Cloud Albums"
      relatedLinks={[
        {to:'/wedding-photo-gallery', label:'Wedding Photo Gallery'},
        {to:'/collect-wedding-guest-photos', label:'Collect Wedding Guest Photos'},
        {to:'/digital-wedding-guest-book', label:'Digital Wedding Guest Book'},
      ]}
    />
  );
}
