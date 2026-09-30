import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';

const FAQS = [
  { q: 'What is a digital wedding guest book?', a: 'A digital wedding guest book is an online version of the traditional paper book where guests leave messages and memories. With Thankeeu, guests write messages, record voice notes, upload photos and videos, and contribute to the gift pot — all in one card.' },
  { q: 'How does a digital guest book work?', a: 'You create your wedding card on Thankeeu and share the link or QR code with guests. They open it on any device, leave their message or upload photos, and the couple receives everything together when the card is delivered.' },
  { q: 'Can I print my digital wedding guest book?', a: 'Thankeeu is digital-first, but you can download all messages, photos and videos as individual files. The Memory Movie™ also gives you a cinematic video version of every guest\'s contribution.' },
  { q: 'Is a digital guest book better than a paper one?', a: 'For most couples, yes. A digital guest book captures photos and videos (not just text), never gets damaged or lost, can be shared with family anywhere in the world, and arrives neatly in one place after the wedding.' },
  { q: 'Can guests who couldn\'t attend sign the digital guest book?', a: 'Yes. Anyone with the link can contribute — remote guests, family overseas, or friends who sent their wishes from afar.' },
];

export default function DigitalWeddingGuestBook() {
  useSEO({
    title: 'Digital Wedding Guest Book — Messages, Photos & Voice Notes | Thankeeu',
    description: 'Create a digital wedding guest book that captures messages, voice notes, photos, and videos from every guest. Guests sign from any device — no app needed. Better than paper: it lasts forever.',
    keywords: 'digital wedding guest book, online wedding guest book, virtual wedding guest book, wedding guest book digital, replace paper wedding guest book, digital guest book wedding',
    canonical: '/digital-wedding-guest-book',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('Digital Wedding Guest Book', 'Create a digital wedding guest book that captures messages, voice notes, photos, and videos.', '/digital-wedding-guest-book'), SCHEMAS.faqPage(FAQS), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'Digital Wedding Guest Book',url:'/digital-wedding-guest-book'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>A Digital Wedding Guest Book<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">That Captures More Than Words</span></>}
      subheadline="Every guest leaves a message. Some add a photo. Others record a voice note or contribute to the gift. Everything arrives in one beautiful card — no paper, no handwriting you can't read, no lost pages."
      tagline="A paper guest book captures names and a few words. Thankeeu captures messages, voice notes, photos, videos, and gifts from every person who loves you."
      tableCompetitorLabel="Paper Guest Books"
      faqs={FAQS}
      relatedLinks={[
        {to:'/online-wedding-guestbook', label:'Online Wedding Guestbook'},
        {to:'/wedding-video-message-book', label:'Wedding Video Message Book'},
        {to:'/wedding-voice-note-guest-book', label:'Wedding Voice Note Guest Book'},
        {to:'/wedding-photo-sharing-app', label:'Wedding Photo Sharing App'},
        {to:'/wedding-group-card', label:'Wedding Group Card'},
      ]}
    />
  );
}
