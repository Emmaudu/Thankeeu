import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';

export default function WeddingVideoMessageBook() {
  useSEO({
    title: 'Wedding Video Message Book — Collect Video Wishes from Every Guest | Thankeeu',
    description: 'Collect video messages and wishes from every wedding guest. Guests record or upload a short video clip directly from their phone — no app needed. All videos assembled into a Memory Movie.',
    keywords: 'wedding video message book, wedding video wishes, collect video messages wedding, wedding video guestbook, video wishes from wedding guests',
    canonical: '/wedding-video-message-book',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('Wedding Video Message Book', 'Collect video messages and wishes from every wedding guest.', '/wedding-video-message-book'), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'Wedding Video Message Book',url:'/wedding-video-message-book'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>Collect Video Messages<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">From Every Guest at Your Wedding</span></>}
      subheadline="Guests record a short video message from their phone — no app, no account. Every video arrives in your wedding card alongside written messages, photos, voice notes, and the gift pot."
      tagline="Imagine watching a video from every person at your wedding — your gran's blessing, your best friend's speech, your child's excitement. Thankeeu makes it possible."
      tableCompetitorLabel="Video Message Tools"
      relatedLinks={[
        {to:'/digital-wedding-guest-book', label:'Digital Wedding Guest Book'},
        {to:'/wedding-voice-note-guest-book', label:'Wedding Voice Note Guest Book'},
        {to:'/online-wedding-guestbook', label:'Online Wedding Guestbook'},
        {to:'/wedding-memory-book', label:'Wedding Memory Book'},
      ]}
    />
  );
}
