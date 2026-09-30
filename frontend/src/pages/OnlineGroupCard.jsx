import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';

const FAQS = [
  { q: 'What is an online group card?', a: 'An online group card is a digital card that multiple people sign together for one recipient. Everyone adds their own personal message, photo, or voice note, and the recipient receives it as one beautiful combined card.' },
  { q: 'Is an online group card free?', a: 'Yes — creating your card and inviting people to sign is completely free on Thankeeu. You pay only when sending the final card.' },
  { q: 'How do I invite people to sign an online group card?', a: 'Share the link via WhatsApp, email, Slack, or any messaging app. Anyone with the link can sign from their phone or laptop — no account needed.' },
  { q: 'What occasions work for online group cards?', a: 'Any occasion where a group wants to celebrate someone together: birthdays, farewells, retirements, weddings, anniversaries, new baby, graduation, promotions, and more.' },
  { q: 'Can I add a gift to an online group card?', a: 'Yes. Thankeeu lets you combine a group card with a pooled gift collection — guests sign and contribute to the gift in one flow.' },
];

export default function OnlineGroupCard() {
  useSEO({
    title: 'Online Group Card — Everyone Signs Together | Thankeeu',
    description: 'Create a free online group card that everyone signs. Perfect for birthdays, farewells, retirements, weddings, and more. Share the link — anyone with it can sign from any device. No account needed.',
    keywords: 'online group card, free online group card, digital group card, group card everyone signs, virtual group card, create group card online',
    canonical: '/online-group-card',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('Online Group Card', 'Create a free online group card that everyone signs.', '/online-group-card'), SCHEMAS.faqPage(FAQS), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'Online Group Card',url:'/online-group-card'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>One Card.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Everyone Signs. Any Occasion.</span></>}
      subheadline="Create a free group card in 2 minutes. Share the link with the whole team, family, or friend group. Everyone adds their message, photo, or voice note — and the recipient gets one beautiful card."
      tagline="Works for birthdays, farewells, retirements, anniversaries, weddings, new babies, graduations, promotions, and any occasion worth celebrating together."
      tableCompetitorLabel="Other Group Card Tools"
      faqs={FAQS}
      relatedLinks={[
        {to:'/occasions/birthday', label:'Birthday Group Cards'},
        {to:'/occasions/farewell', label:'Farewell Group Cards'},
        {to:'/cards/retirement', label:'Retirement Group Cards'},
        {to:'/occasions/wedding', label:'Wedding Group Cards'},
        {to:'/thankeeu-vs-thankbox', label:'Thankeeu vs Thankbox'},
        {to:'/thankeeu-vs-kudoboard', label:'Thankeeu vs Kudoboard'},
      ]}
    />
  );
}
