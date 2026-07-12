import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';

export default function WeddingMemoryBook() {
  useSEO({
    title: 'Wedding Memory Book — Collect Every Message, Photo & Video | Thankeeu',
    description: 'Create a digital wedding memory book with messages, photos, voice notes, and videos from every guest. Automatically assembled into a Memory Movie after the wedding. Free to start.',
    keywords: 'wedding memory book, digital wedding memory book, wedding memories from guests, wedding keepsake book digital, online wedding memory book',
    canonical: '/wedding-memory-book',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('Wedding Memory Book', 'Create a digital wedding memory book with messages, photos, voice notes, and videos.', '/wedding-memory-book'), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'Wedding Memory Book',url:'/wedding-memory-book'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>A Wedding Memory Book<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Built by Everyone Who Was There</span></>}
      subheadline="Every guest adds a message, photo, voice note or video. Thankeeu collects everything and delivers it as one beautiful keepsake — plus a cinematic Memory Movie assembled from every contribution."
      tagline="Unlike a printed memory book, this one has voice. It has video. It has photos from every angle. And it lives forever."
      tableCompetitorLabel="Printed Memory Books"
      relatedLinks={[
        {to:'/digital-wedding-guest-book', label:'Digital Wedding Guest Book'},
        {to:'/wedding-photo-album-online', label:'Wedding Photo Album Online'},
        {to:'/wedding-video-message-book', label:'Wedding Video Message Book'},
        {to:'/wedding-memory-wall', label:'Wedding Memory Wall'},
      ]}
    />
  );
}
