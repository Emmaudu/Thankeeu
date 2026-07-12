import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';

export default function UKWeddingPhotoSharing() {
  useSEO({
    title: 'Wedding Photo Sharing UK — Collect Guest Photos at Your British Wedding | Thankeeu',
    description: 'The best wedding photo sharing tool for UK couples. Guests upload photos via QR code — no app needed. Accepts GBP gift contributions. Works alongside your photographer. Free to start.',
    keywords: 'wedding photo sharing UK, UK wedding photo sharing, British wedding photo app, wedding guest photos UK, collect wedding photos UK guests, wedding QR code UK',
    canonical: '/uk-wedding-photo-sharing',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('Wedding Photo Sharing UK', 'The best wedding photo sharing tool for UK couples.', '/uk-wedding-photo-sharing'), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'UK Wedding Photo Sharing',url:'/uk-wedding-photo-sharing'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>Wedding Photo Sharing for UK Couples<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Collect Every Guest's Shot in GBP</span></>}
      subheadline="Trusted by couples across England, Scotland, Wales, and Northern Ireland. Display a QR code at your venue — guests scan, upload, and every photo lands in your shared gallery instantly."
      tagline="Accepts GBP gift contributions alongside messages and photos. Works perfectly for English country weddings, city venues, Scottish castles, and everything in between."
      tableCompetitorLabel="UK Photo Apps"
      relatedLinks={[
        {to:'/usa-wedding-photo-sharing', label:'USA Wedding Photo Sharing'},
        {to:'/wedding-photo-sharing-app', label:'Wedding Photo Sharing App'},
        {to:'/digital-wedding-guest-book', label:'Digital Wedding Guest Book'},
        {to:'/online-group-cards-uk', label:'Group Cards UK'},
      ]}
    />
  );
}
