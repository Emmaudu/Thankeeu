import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useSEO, SCHEMAS } from '../../hooks/useSEO'; /** * Occasion landing pages targeting keywords Thankbox ranks for that Thankeeu * previously had no page for. Each occasion has unique copy — not templated * country-swaps — with FAQ schema for rich results. */
import { OCCASIONS } from './occasionsData.js';
import RetirementLanding from './RetirementLanding';

export default function ExtraOccasionPage({ occasion }) { const d = OCCASIONS[occasion]; useSEO(d ? { title: d.title, description: d.desc, keywords: d.keywords, canonical: d.path, jsonLd: [ SCHEMAS.organization, SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: d.h1, url: d.path }]), SCHEMAS.webPage(d.title, d.desc, d.path), { '@type': 'FAQPage', mainEntity: (d.faqs || []).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a }, })), }, ], } : { title: 'Card — Thankeeu', description: 'Create a group card everyone signs.', canonical: `/`, noIndex: true }); if (!d) return null; const STEPS = [ { n: '1', title: 'Create the card', body: 'Choose an occasion, pick a design, and set your delivery date. Done in under 2 minutes.' }, { n: '2', title: 'Share one link', body: 'Send the link by WhatsApp, Slack, email or text. Anyone can sign — no account needed.' }, { n: '3', title: 'Everyone signs', body: 'Contributors add personal messages, photos, GIFs and voice notes at their own pace.' }, { n: '4', title: 'Deliver perfectly', body: 'Schedule exact delivery by email. Optionally add a pooled gift — withdrawn straight to any bank.' }, ]; const FEATURES = [ { icon: 'UserCheck', title: 'No account needed to sign', body: 'Anyone with the link can add a message instantly — no registration, no app download.' }, { icon: 'Camera', title: 'Photos, GIFs & voice notes', body: 'Contributors personalise their message with photos, GIFs, or a voice recording right from their phone.' }, { icon: 'Clock', title: 'Scheduled delivery', body: 'Set the exact date and time for the card to arrive — midnight on their birthday, 9am on their first day.' }, { icon: 'Gift', title: 'Built-in gift collection', body: 'Enable an optional gift pool. Contributors add their message and chip in — paid securely via Flutterwave.' }, { icon: 'CheckCircle', title: 'Works for remote teams', body: 'The link works from anywhere in the world. Nobody gets left out because they work from home or another country.' }, { icon: 'CheckCircle', title: 'Private delivery', body: 'The recipient only sees the card when you send it — contributors sign without the recipient ever knowing.' }, ]; const STATS = [ { n: '69%', label: 'of employees say they\'d work harder if they felt better recognised — Gallup' }, { n: '40%', label: 'of people say recognition is more motivating than a pay rise — McKinsey' }, { n: '5×', label: 'higher employee engagement at companies with strong recognition cultures — Deloitte' }, { n: '2bn+', label: 'greeting cards sent globally every year — Greeting Card Association' }, ]; return ( <div className="min-h-screen bg-white flex flex-col">
<Navbar /> {/* ── Hero ── */} <section className="bg-gradient-to-b from-primary-50 to-white pt-14 pb-12 px-4 text-center">
<div className="max-w-3xl mx-auto">
<h1 className="text-4xl sm:text-5xl font-extrabold text-warm-900 mb-4 leading-tight">{d.h1}</h1>
<p className="text-lg text-warm-600 mb-8 max-w-2xl mx-auto">{d.sub}</p>
<div className="flex flex-wrap justify-center gap-3">
<Link to="/card/new" className="btn-primary px-8 py-3 text-lg">Create a card — free to start</Link>
<Link to="/sample" className="btn-secondary px-8 py-3 text-lg">See a live demo</Link>
</div>
</div>
</section> {/* ── How it works ── */} <section className="max-w-5xl mx-auto px-4 py-14">
<h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-2 text-center">How it works</h2>
<p className="text-warm-500 text-center mb-10">Set up in minutes. Your group does the rest.</p>
<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"> {STEPS.map(s => ( <div key={s.n} className="bg-primary-50 rounded-2xl p-6 text-center">
<div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-extrabold text-lg mx-auto mb-4">{s.n}</div>
<p className="font-bold text-warm-900 mb-2">{s.title}</p>
<p className="text-sm text-warm-600">{s.body}</p>
</div> ))} </div>
</section> {/* ── Perfect for (use cases) ── */} <section className="bg-gray-50 py-14 px-4">
<div className="max-w-5xl mx-auto">
<h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-2 text-center">Perfect for</h2>
<p className="text-warm-500 text-center mb-10">Every occasion where a group wants to say something that matters.</p>
<div className="grid sm:grid-cols-2 gap-6"> {(d.useCases || []).map(([title, body]) => ( <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
<p className="font-bold text-warm-900 mb-2">{title}</p>
<p className="text-sm text-warm-600 leading-relaxed">{body}</p>
</div> ))} </div>
</div>
</section> {/* ── Why digital beats paper ── */} <section className="max-w-5xl mx-auto px-4 py-14">
<div className="grid md:grid-cols-2 gap-10 items-center">
<div>
<h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-4">A digital group card beats paper, every time</h2>
<p className="text-warm-600 mb-4 leading-relaxed">A paper card gets passed around, runs out of space, and gets left out entirely for anyone who works remotely. Someone always misses it. The handwriting is cramped. The gift envelope is separate.</p>
<p className="text-warm-600 mb-4 leading-relaxed">With Thankeeu, everyone signs from their own phone from wherever they are — messages as long as they want, photos, voice notes, GIFs. The card delivers at the exact moment you choose and stays accessible forever. The recipient can go back to it on a difficult day, months or years later.</p>
<p className="text-warm-600 leading-relaxed">And there's no envelope of cash to chase — the gift pool collects automatically when people sign, and withdraws straight to a bank account.</p>
</div>
<div className="grid grid-cols-2 gap-4"> {[ ['Paper card', ['Limited space', 'Only office staff sign', 'Gift collected separately', 'Lost or thrown away', 'No scheduled delivery']], ['Thankeeu', ['Unlimited messages', 'Remote team included', 'Gift pool built-in', 'Kept forever online', 'Delivered at perfect moment']], ].map(([label, points]) => ( <div key={label} className={`rounded-2xl p-5 ${label === 'Thankeeu' ? 'bg-primary-50 border-2 border-primary-200' : 'bg-gray-50 border border-gray-200'}`}>
<p className={`font-bold text-sm mb-3 ${label === 'Thankeeu' ? 'text-primary-700' : 'text-warm-500'}`}>{label}</p>
<ul className="space-y-2"> {points.map(p => ( <li key={p} className="flex items-start gap-2 text-sm">
<span className={label === 'Thankeeu' ? 'text-green-500' : 'text-red-400'}>{label === 'Thankeeu' ? '' : ''}</span>
<span className="text-warm-700">{p}</span>
</li> ))} </ul>
</div> ))} </div>
</div>
</section> {/* ── Stats strip ── */} <section className="bg-primary-600 py-12 px-4">
<div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white"> {STATS.map(s => ( <div key={s.n}>
<p className="text-4xl font-extrabold mb-2">{s.n}</p>
<p className="text-sm text-primary-100 leading-relaxed">{s.label}</p>
</div> ))} </div>
</section> {/* ── Features grid ── */} <section className="max-w-5xl mx-auto px-4 py-14">
<h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-2 text-center">Everything a group card can do</h2>
<p className="text-warm-500 text-center mb-10">Every feature included. No hidden extras.</p>
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"> {FEATURES.map(f => ( <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
{f.icon && <span className="text-2xl mb-3 block">{f.icon}</span>}
<p className="font-bold text-warm-900 mb-2">{f.title}</p>
<p className="text-sm text-warm-600 leading-relaxed">{f.body}</p>
</div> ))} </div>
</section> {/* ── Mid-page CTA ── */} <section className="bg-gradient-to-r from-primary-600 to-primary-500 py-12 px-4 text-center text-white">
<h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to create yours?</h2>
<p className="text-primary-100 mb-7 max-w-xl mx-auto">Free to start. No account needed to sign. Takes under 2 minutes to set up.</p>
<Link to="/card/new" className="inline-block bg-white text-primary-700 font-bold px-8 py-3 rounded-xl hover:bg-primary-50 transition-colors text-lg">Create a group card now</Link>
</section> {/* ── Related guides ── */} <section className="max-w-5xl mx-auto px-4 py-14">
<h2 className="text-2xl font-bold text-warm-900 mb-8 text-center">Related guides &amp; ideas</h2>
<div className="grid sm:grid-cols-2 gap-5"> {(d.blogLinks || []).map(([href, label]) => ( <Link key={href} to={href} className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-primary-200 hover:shadow-md transition-all group">
<div className="w-10 h-10 bg-primary-50 rounded-xl flex-shrink-0 flex items-center justify-center text-primary-600 font-bold text-lg group-hover:bg-primary-100 transition-colors">→</div>
<span className="text-sm font-semibold text-warm-800 group-hover:text-primary-700 transition-colors">{label}</span>
</Link> ))} </div>
</section> {/* ── FAQ ── */} <section className="bg-gray-50 py-14 px-4">
<div className="max-w-3xl mx-auto">
<h2 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-8 text-center">Frequently asked questions</h2>
<div className="space-y-4"> {(d.faqs || []).map(([q, a]) => ( <details key={q} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
<summary className="font-semibold text-warm-900 cursor-pointer text-base leading-snug">{q}</summary>
<p className="text-sm text-warm-600 mt-4 leading-relaxed">{a}</p>
</details> ))} {/* Generic platform FAQs — same on every card page */} <details className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
<summary className="font-semibold text-warm-900 cursor-pointer text-base leading-snug">How much does an online group card cost?</summary>
<p className="text-sm text-warm-600 mt-4 leading-relaxed">Free to create and collect messages. A small fee applies when you send or activate the card, always shown upfront before you pay. Teams get unlimited cards on a subscription — see <Link to="/pricing" className="text-primary-600 hover:underline">Pricing</Link>.</p>
</details>
<details className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
<summary className="font-semibold text-warm-900 cursor-pointer text-base leading-snug">Does the recipient need an account to view their card?</summary>
<p className="text-sm text-warm-600 mt-4 leading-relaxed">No — the recipient gets a link by email. They click it and see the full card immediately, with every message, photo, GIF and voice note. No login, no app download.</p>
</details>
<details className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
<summary className="font-semibold text-warm-900 cursor-pointer text-base leading-snug">How do group gift contributions work?</summary>
<p className="text-sm text-warm-600 mt-4 leading-relaxed">Enable the optional gift pool when creating the card. Contributors add their message and chip in any amount by card, bank transfer or USSD (via Flutterwave). The organiser or recipient withdraws the total to any bank account. No personal account involved — all pooled securely on the card itself.</p>
</details>
<details className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
<summary className="font-semibold text-warm-900 cursor-pointer text-base leading-snug">Can I schedule the card to send at a specific time?</summary>
<p className="text-sm text-warm-600 mt-4 leading-relaxed">Yes — set the exact date and time and Thankeeu delivers it at that moment, in any time zone. Midnight on their birthday, 9am on their first day, 5pm on their last Friday — you choose.</p>
</details>
<details className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
<summary className="font-semibold text-warm-900 cursor-pointer text-base leading-snug">Is there a limit on how many people can sign?</summary>
<p className="text-sm text-warm-600 mt-4 leading-relaxed">No — there's no limit on contributors. Whole companies, school classes, extended families — everyone gets a space for their message.</p>
</details>
</div>
</div>
</section> {/* ── Final CTA ── */} <section className="max-w-4xl mx-auto px-4 py-16 text-center">
<h2 className="text-3xl font-extrabold text-warm-900 mb-4">Create yours in under 2 minutes</h2>
<p className="text-warm-600 mb-8 max-w-lg mx-auto">Free to start. No account needed to sign. Works for teams of any size, anywhere in the world.</p>
<div className="flex flex-wrap justify-center gap-3">
<Link to="/card/new" className="btn-primary px-8 py-3 text-lg">Start your group card</Link>
<Link to="/how-it-works" className="btn-secondary px-8 py-3 text-lg">How it works</Link>
</div>
</section>
<Footer />
</div> );
} export function LeavingCardPage() { return <ExtraOccasionPage occasion="leaving-card" />; }
export function RetirementPage() { return <RetirementLanding />; }
export function GetWellSoonPage() { return <ExtraOccasionPage occasion="get-well-soon" />; }
export function ThankYouCardPage() { return <ExtraOccasionPage occasion="thank-you" />; }
export function MaternityLeavePage(){ return <ExtraOccasionPage occasion="maternity-leave" />; }
export function ChristmasCardPage() { return <ExtraOccasionPage occasion="christmas" />; }
// UK Tier 1
export function SympathyCardPage() { return <ExtraOccasionPage occasion="sympathy" />; }
export function WelcomeCardPage() { return <ExtraOccasionPage occasion="welcome" />; }
export function GoodLuckCardPage() { return <ExtraOccasionPage occasion="good-luck" />; }
export function BabyShowerCardPage() { return <ExtraOccasionPage occasion="baby-shower" />; }
export function TeacherThankYouPage() { return <ExtraOccasionPage occasion="teacher-thank-you" />; }
export function EngagementCardPage() { return <ExtraOccasionPage occasion="engagement" />; }
export function NewHomeCardPage() { return <ExtraOccasionPage occasion="new-home" />; }
// US Tier 1
export function AdminProfessionalsDayPage() { return <ExtraOccasionPage occasion="administrative-professionals-day" />; }
export function BossDayPage() { return <ExtraOccasionPage occasion="boss-day" />; }
export function TeacherAppreciationPage() { return <ExtraOccasionPage occasion="teacher-appreciation" />; }
export function ThanksgivingCardPage() { return <ExtraOccasionPage occasion="thanksgiving" />; }
export function MothersDayCardPage() { return <ExtraOccasionPage occasion="mothers-day" />; }
export function FathersDayCardPage() { return <ExtraOccasionPage occasion="fathers-day" />; }
export function OnlineBirthdayNigeriaPage() { return <ExtraOccasionPage occasion="online-birthday-nigeria" />; }
// UK-specific occasion pages
export function LeavingCardUKPage() { return <ExtraOccasionPage occasion="leaving-card-uk" />; }
export function BirthdayCardUKPage() { return <ExtraOccasionPage occasion="birthday-uk" />; }
export function RetirementCardUKPage() { return <ExtraOccasionPage occasion="retirement-uk" />; }
export function GetWellSoonUKPage() { return <ExtraOccasionPage occasion="get-well-soon-uk" />; }
