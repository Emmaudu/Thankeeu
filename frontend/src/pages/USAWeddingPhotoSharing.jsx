import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';

export default function USAWeddingPhotoSharing() {
  useSEO({
    title: 'Wedding Photo Sharing USA — Collect Guest Photos at Your American Wedding | Thankeeu',
    description: 'The best wedding photo sharing platform for US couples. Guests upload photos via QR code — no app download. Accepts USD gift contributions. Works alongside your photographer. Free to start.',
    keywords: 'wedding photo sharing USA, wedding photo sharing app United States, American wedding photo sharing, wedding guest photos USA, collect wedding photos US guests',
    canonical: '/usa-wedding-photo-sharing',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('Wedding Photo Sharing USA', 'The best wedding photo sharing platform for US couples.', '/usa-wedding-photo-sharing'), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'USA Wedding Photo Sharing',url:'/usa-wedding-photo-sharing'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>Wedding Photo Sharing for US Couples<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Your Guests Have Thousands of Photos</span></>}
      subheadline="From destination weddings in California to backyard ceremonies in Texas — display a QR code and let every guest contribute their photos instantly. No app to download. No signup required."
      tagline="Accepts USD gift contributions alongside messages and photos. Works on every phone, for guests of every age — including grandma and the kids."
      tableCompetitorLabel="US Photo Apps"
      relatedLinks={[
        {to:'/uk-wedding-photo-sharing', label:'UK Wedding Photo Sharing'},
        {to:'/wedding-photo-sharing-app', label:'Wedding Photo Sharing App'},
        {to:'/digital-wedding-guest-book', label:'Digital Wedding Guest Book'},
        {to:'/online-group-cards-us', label:'Group Cards US'},
      ]}
    />
  );
}
