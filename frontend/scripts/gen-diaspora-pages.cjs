const fs = require('fs');
const path = require('path');

const ICONS = `const shop = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>;
const clock = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const file = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const users = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const home = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const heart = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
const card = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;`;

const COUNTRIES = [
  {
    slug: 'uk', file: 'DiasporaUK', name: 'the UK', adjective: 'UK-Based',
    cities: 'London, Manchester, Birmingham, Leeds and across the UK',
    timeNote: 'The UK is almost the same time as Nigeria (GMT vs WAT, at most 1 hour apart), so you can message your Tasker and get replies during your normal working day \u2014 no waiting overnight for updates.',
    remittanceNote: 'Nigerians in the UK sent over \u00a33 billion home in remittances in recent years \u2014 Taskeeu gives that same generosity a safer outlet for errands, not just cash transfers.',
    currencyNote: 'pay in Naira directly from your UK card',
    keywords: 'errand service for Nigerians in the UK, errand service Nigeria from UK, Nigerians in London send errands home, run errands in Nigeria from London, help my parents in Nigeria from UK, diaspora errand service UK, send groceries to Nigeria from UK, UK Nigerian diaspora errand app',
  },
  {
    slug: 'usa', file: 'DiasporaUSA', name: 'the USA', adjective: 'US-Based',
    cities: 'Houston, Atlanta, New York, Dallas, Maryland and across the United States',
    timeNote: 'With a 5\u20136 hour time difference, evenings in the US are already night in Nigeria \u2014 post your errand before you sleep and wake up to photo proof it\u2019s done, no need to stay up coordinating.',
    remittanceNote: 'The US is one of the largest sources of Nigerian diaspora remittances \u2014 Taskeeu channels that same care into errands your family actually needs done, not just money that gets absorbed into daily costs.',
    currencyNote: 'pay in Naira directly from your US card or bank',
    keywords: 'errand service for Nigerians in the USA, errand service Nigeria from USA, Nigerians in America send errands home, run errands in Nigeria from the US, help my parents in Nigeria from America, diaspora errand service USA, send groceries to Nigeria from USA, US Nigerian diaspora errand app',
  },
  {
    slug: 'canada', file: 'DiasporaCanada', name: 'Canada', adjective: 'Canada-Based',
    cities: 'Toronto, Calgary, Edmonton, Ottawa and across Canada',
    timeNote: 'Canada runs several hours behind Nigeria \u2014 post your errand before bed and your Tasker in Nigeria is often already handling it while you sleep, with proof waiting when you wake up.',
    remittanceNote: 'Canada has one of the fastest-growing Nigerian diaspora communities \u2014 Taskeeu gives that community a direct, accountable way to look after family and property back home.',
    currencyNote: 'pay in Naira directly from your Canadian card or bank',
    keywords: 'errand service for Nigerians in Canada, errand service Nigeria from Canada, Nigerians in Toronto send errands home, run errands in Nigeria from Canada, help my parents in Nigeria from Canada, diaspora errand service Canada, send groceries to Nigeria from Canada, Canada Nigerian diaspora errand app',
  },
];

function template(c) {
  return `import ServiceLanding from '../../components/ui/ServiceLanding';
import { makeLocalBusinessSchema } from '../../components/seo/SEO';

${ICONS}

export default function ${c.file}() {
  return (
    <ServiceLanding
      seo={{
        slug: '/diaspora/${c.slug}',
        title: 'Errand Service for Nigerians in ${c.name} — Run Errands in Nigeria From Anywhere',
        description:
          "Living in ${c.name}? Taskeeu runs your errands in Nigeria while you're in ${c.cities}. Send groceries to family, check on elderly parents, collect transcripts, pay bills, inspect property \u2014 done by identity-verified locals with photo proof and escrow protection.",
        keywords: '${c.keywords}',
        structuredData: makeLocalBusinessSchema({
          city: 'Nigeria',
          serviceType: 'Diaspora Errand Service',
          url: 'https://taskeeu.com/diaspora/${c.slug}',
        }),
      }}
      hero={{
        badge: 'For Nigerians in ${c.name} \u2014 ${c.adjective} & Anywhere Else',
        headline: 'Your Trusted Hands and Feet in Nigeria \u2014 While You Live in ${c.name}',
        subheadline:
          'Stop begging busy relatives or risking money with strangers. Post any errand from ${c.cities} and an identity-verified Tasker in Nigeria handles it \u2014 with photo/video proof at every step and your money held in escrow until you confirm it was done right.',
        tasksHeading: 'Errands Nigerians in ${c.name} Post Every Day',
        tasksSubheading:
          'From grocery drops for Mum in Surulere to transcript collection at UNILAG \u2014 verified locals handle it while you watch progress in real time from ${c.name}.',
      }}
      tasks={[
        { icon: shop, title: 'Send Groceries & Food to Family in Nigeria', desc: 'A Tasker shops your exact list at Shoprite, Mile 12, or the local market and delivers to your parents\\' door \u2014 with receipts and delivery photos sent to you in ${c.name}.' },
        { icon: users, title: 'Check on Elderly Parents & Loved Ones', desc: 'Welfare visits, pharmacy pickups, hospital accompaniment, and prescription refills for elderly parents \u2014 with a full photo/video report after every visit.' },
        { icon: file, title: 'Transcript & Document Collection', desc: 'Collect academic transcripts from UNILAG, OAU, UI, ABU or any Nigerian institution, WAEC/NECO certificates, NYSC documents \u2014 then courier or scan them to you in ${c.name}.' },
        { icon: card, title: 'Bill Payments & Bank Errands', desc: 'Pay electricity, school fees, rent, and DSTV for family back home. Handle physical bank visits, account reactivation follow-ups, and BVN/NIN errands.' },
        { icon: home, title: 'Property Checks & Building Project Monitoring', desc: 'Is your building project real or a family story? Get independent site visits with timestamped photos and video \u2014 before you send the next tranche of money from ${c.name}.' },
        { icon: heart, title: 'Gifts, Birthdays & Surprise Deliveries', desc: 'Cakes, flowers, gift hampers, and asoebi purchases delivered to loved ones in Lagos, Abuja, Port Harcourt and beyond \u2014 on the exact date that matters.' },
        { icon: clock, title: 'Government Office Queuing on Your Behalf', desc: 'NIMC, NIS passport office, FRSC, CAC, court registries \u2014 a Tasker queues in person, submits or collects your documents, and reports back with proof.' },
        { icon: map, title: 'Land & Market Price Verification', desc: 'Before you buy land or goods remotely from ${c.name}, send a Tasker to physically verify the seller, location, and true market price \u2014 protecting you from long-distance scams.' },
      ]}
      useCases={[
        { icon: users, title: 'Nigerians Living in ${c.cities}', desc: 'Professionals and students in ${c.name} who need reliable, accountable help back home \u2014 without straining family relationships by asking for favours repeatedly.' },
        { icon: heart, title: 'Children of Elderly Parents in Nigeria', desc: 'Sons and daughters in ${c.name} who want regular groceries, medications, and welfare checks delivered to ageing parents \u2014 with proof after every single visit.' },
        { icon: file, title: 'Students Needing Nigerian Documents', desc: 'Graduate school applicants in ${c.name} who need transcripts, attestation letters, or certificates collected from Nigerian universities and couriered internationally.' },
        { icon: home, title: 'Diaspora Property Owners & Builders', desc: 'Anyone in ${c.name} funding a building project or managing property in Nigeria from abroad who needs honest, independent eyes on the ground before sending money.' },
        { icon: card, title: 'People Burned by Unreliable Middlemen', desc: 'If a relative or "trusted person" has ever mismanaged your money, Taskeeu\\'s escrow means funds are only released after you see proof the job was done.' },
        { icon: shop, title: '${c.name}-Based Business Owners', desc: 'Owners restocking a family shop, paying suppliers, or coordinating deliveries in Nigeria while running their lives in ${c.name}.' },
      ]}
      faqs={[
        { q: 'How do I pay for errands in Nigeria from ${c.name}?', a: 'You ${c.currencyNote} through our secure payment gateway. Your money sits in escrow \u2014 the Tasker is only paid after you confirm the errand was completed correctly, with proof.' },
        { q: 'What about the time difference between ${c.name} and Nigeria?', a: '${c.timeNote}' },
        { q: 'How do I know the errand was actually done?', a: 'Taskers send photo and video proof at every stage \u2014 receipts for purchases, delivery photos, timestamped site visits, and document scans. You track everything in real time from your dashboard, no matter your time zone.' },
        { q: 'Can someone check on my elderly parents regularly?', a: 'Yes. Many diaspora clients in ${c.name} post weekly or monthly recurring tasks: grocery drops, pharmacy refills, and welfare visits. Once you find a Tasker you trust, you can rehire them directly for consistency your parents will appreciate.' },
        { q: 'Is Taskeeu safer than sending money to a relative or agent?', a: 'With relatives and informal agents, you have no recourse if money is misused. On Taskeeu every Tasker is identity-verified with NIN or BVN, has a public rating history, and your payment is escrow-protected \u2014 released only when you approve the completed work.' },
        { q: 'Which Nigerian cities can you run errands in?', a: 'Lagos, Abuja, Port Harcourt, Ibadan, Kano, Enugu, Benin City, Onitsha, Calabar and 30+ other cities. Post your errand with the exact location and verified Taskers in that area will bid within minutes.' },
      ]}
      relatedLinks={[
        { label: 'For Nigerians Abroad (All Countries)', href: '/diaspora' },
        { label: 'All Nigeria Errands', href: '/errands' },
        { label: 'Grocery Shopping Service', href: '/grocery-shopping' },
        { label: 'Property Inspection', href: '/property-inspection' },
        { label: 'Document Pickup', href: '/document-pickup' },
      ]}
    />
  );
}
`;
}

const outDir = path.join(__dirname, '..', 'src', 'pages', 'services');
for (const c of COUNTRIES) {
  fs.writeFileSync(path.join(outDir, `${c.file}.jsx`), template(c));
  console.log('Wrote', c.file);
}
