import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';

const FAQS = [
  { q: 'What is an online wedding guestbook?', a: 'An online wedding guestbook is a digital space where guests leave their wishes, photos, and memories for the couple. Unlike a paper book, it accepts photos, voice notes, and videos — and never gets lost or damaged.' },
  { q: 'How do guests sign an online guestbook?', a: 'You share a link or QR code with your guests. They open it on their phone, write a message, add a photo or voice note, and tap submit. Takes less than a minute — no account needed.' },
  { q: 'Can I use Thankeeu as a guestbook at the reception?', a: 'Yes. Display your QR code at a signing station, on each table, or at the entrance. Guests sign on their own phones as they arrive, during cocktail hour, or at their tables.' },
  { q: 'Can I add the online guestbook to my wedding website?', a: 'You can share the Thankeeu link on your wedding website, in your invitations, and in your WhatsApp groups. Guests access it from any device.' },
  { q: 'Is an online guestbook cheaper than a paper one?', a: 'Yes. Thankeeu is free to start — you pay only when sending the final card. No printing costs, no personalised books to order, no risk of running out of space.' },
];

export default function OnlineWeddingGuestbook() {
  useSEO({
    title: 'Online Wedding Guestbook — Messages, Photos & Voice Notes | Thankeeu',
    description: 'Replace the paper guestbook with something that captures more. Guests write messages, upload photos, record voice notes, and contribute gifts — all from their phone. No app needed.',
    keywords: 'online wedding guestbook, digital wedding guestbook, virtual wedding guestbook, online guestbook for wedding, replace paper wedding guestbook',
    canonical: '/online-wedding-guestbook',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('Online Wedding Guestbook', 'Replace the paper guestbook with something that captures more.', '/online-wedding-guestbook'), SCHEMAS.faqPage(FAQS), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'Online Wedding Guestbook',url:'/online-wedding-guestbook'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>Replace the Paper Guestbook<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">With One That Captures Everything</span></>}
      subheadline="A paper guestbook collects signatures and a few sentences. Thankeeu collects messages, photos, voice notes, and video wishes — from every guest, at the venue and beyond."
      tagline="No more illegible handwriting, torn pages, or books left behind at the venue. Your online guestbook arrives neatly in your inbox after the wedding."
      tableCompetitorLabel="Paper Guestbooks"
      faqs={FAQS}
      relatedLinks={[
        {to:'/digital-wedding-guest-book', label:'Digital Wedding Guest Book'},
        {to:'/wedding-voice-note-guest-book', label:'Wedding Voice Note Guest Book'},
        {to:'/wedding-video-message-book', label:'Wedding Video Message Book'},
        {to:'/wedding-group-card', label:'Wedding Group Card'},
      ]}
    />
  );
}
