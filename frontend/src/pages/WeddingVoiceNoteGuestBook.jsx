import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';

export default function WeddingVoiceNoteGuestBook() {
  useSEO({
    title: 'Wedding Voice Note Guest Book — Hear Every Guest\'s Blessing | Thankeeu',
    description: 'Let wedding guests leave voice note blessings directly in your wedding card. Guests record from their phone — no app needed. Hear every blessing, prayer, and heartfelt message in their own voice.',
    keywords: 'wedding voice note guest book, voice note wedding guestbook, wedding voice messages guests, audio wedding guestbook, wedding blessing voice note',
    canonical: '/wedding-voice-note-guest-book',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('Wedding Voice Note Guest Book', 'Let wedding guests leave voice note blessings in your wedding card.', '/wedding-voice-note-guest-book'), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'Wedding Voice Note Guest Book',url:'/wedding-voice-note-guest-book'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>Hear Every Guest's Blessing<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">In Their Own Voice</span></>}
      subheadline="Guests tap the microphone, speak their blessing or prayer, and it lands in your wedding card — right alongside their written message and photos. No app, no upload friction."
      tagline="Reading a message is one thing. Hearing your grandma's voice, your mentor's prayer, your childhood friend's toast — that's something else entirely. Thankeeu preserves both."
      tableCompetitorLabel="Audio Guestbook Tools"
      relatedLinks={[
        {to:'/wedding-video-message-book', label:'Wedding Video Message Book'},
        {to:'/digital-wedding-guest-book', label:'Digital Wedding Guest Book'},
        {to:'/online-wedding-guestbook', label:'Online Wedding Guestbook'},
        {to:'/wedding-group-card', label:'Wedding Group Card'},
      ]}
    />
  );
}
