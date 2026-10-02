import ServiceLanding from '../../components/ui/ServiceLanding';

const shop = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>;
const clock = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const file = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const users = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const activity = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const bag = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>;
const star = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const pill = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.5 20H4a2 2 0 01-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H20a2 2 0 012 2v2"/><circle cx="17" cy="17" r="5"/><path d="M14 17h6"/></svg>;
const naira = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><path d="M6 18V6l12 12V6"/></svg>;

export default function Errands() {
  return (
    <ServiceLanding
      seo={{
        slug: '/errands',
        title: 'Errand Service in Nigeria | Hire a Trusted Errand Runner in Lagos, Abuja & PH',
        description:
          "Nigeria's #1 errand service platform. Hire a verified errand runner in Lagos, Abuja, Port Harcourt, Ibadan & across Nigeria. Grocery runs, queuing at NIMC/FRSC, bill payments, pharmacy pickups, market shopping & more, with escrow payment protection. Post your errand on Taskeeu.",
        keywords:
          'errand service Nigeria, errand runner Lagos, errand boy Lagos, hire errand runner Nigeria, errand service Lagos, ' +
          'errand runner Abuja, errand service Abuja, errand boy Abuja, hire tasker Abuja, ' +
          'errand runner Port Harcourt, errand service Ibadan, errand runner Kano, errand service Enugu, ' +
          'queue for me Nigeria, queue at NIMC Nigeria, queue FRSC Lagos, passport queue Lagos, ' +
          'grocery run Lagos, market run Lagos, Balogun market run, Oyingbo market errand, ' +
          'bill payment errand Nigeria, NEPA payment errand Lagos, DSTV payment Lagos, ' +
          'pharmacy pickup Lagos, pharmacy run Abuja, drug pickup Nigeria, ' +
          'personal assistant Lagos, personal assistant Nigeria, virtual errand service, ' +
          'errand service for Nigerians abroad, Nigeria errand diaspora, ' +
          'post task Nigeria, outsource task Nigeria, task outsourcing Lagos, hire tasker Lagos, ' +
          'errand marketplace Nigeria, task platform Nigeria',
      }}
      hero={{
        badge: 'Trusted Errand Service: Lagos · Abuja · PH · Ibadan & All 36 States',
        headline: "Nigeria's Most Trusted Errand Service: Get Anything Done Today",
        subheadline:
          'Post your errand, pick a verified Tasker, and track it in real time. All with escrow payment protection. From NIMC queuing to grocery runs, Taskeeu handles it all across Lagos, Abuja, Port Harcourt and every Nigerian city.',
        tasksHeading: 'What Taskeeu Errand Runners Handle',
        tasksSubheading:
          'Every errand is covered. Post any task in under 2 minutes and get bids from verified local runners near you.',
      }}
      tasks={[
        {
          icon: shop,
          title: 'Grocery & Market Runs (Lagos, Abuja & More)',
          desc: 'Send a Tasker to Shoprite, Balogun Market, Oyingbo, Mile 12, Wuse Market, or any supermarket with your shopping list. Fully itemised delivery with receipts.',
        },
        {
          icon: clock,
          title: 'Queuing at NIMC, FRSC, NIS & Government Offices',
          desc: 'Hold your place in long queues at NIMC, FRSC, NIN enrolment centres, passport offices, JAMB, embassy lines, CAC, court registry, and LMIS, so you never waste a day.',
        },
        {
          icon: naira,
          title: 'Bill Payments | NEPA, DSTV, Rent & School Fees',
          desc: 'Pay electricity (NEPA/EKEDC/IBEDC), cable TV, school fees, rent, water bills, or any physical payment across any city in Nigeria. Receive photo proof of payment.',
        },
        {
          icon: pill,
          title: 'Pharmacy & Hospital Runs',
          desc: 'Pick up prescriptions, medical supplies, or hospital registration documents from any pharmacy or hospital. Ideal for elderly clients, nursing mothers, and busy professionals.',
        },
        {
          icon: file,
          title: 'Document Pickup, Drop-off & Courier',
          desc: 'Secure same-day document delivery: contracts, NIN slips, court papers, certificates, and office documents, anywhere in Lagos, Abuja, or Port Harcourt.',
        },
        {
          icon: users,
          title: 'School Pickup & Child Drop-off',
          desc: 'Trusted, verified Taskers collect children from school, lessons, or activities and deliver them home safely. ID-verified taskers with task photo confirmation.',
        },
        {
          icon: activity,
          title: 'CAC, Tax Office & Corporate Agency Runs',
          desc: 'Submit CAC forms, pay LIRS/FIRS taxes, handle company secretarial filings, and run all government agency errands in Lagos, Abuja, or any state capital.',
        },
        {
          icon: bag,
          title: 'Gift Purchase & Delivery',
          desc: 'Buy, wrap, and deliver flowers, gifts, cakes, or care packages to loved ones anywhere in Nigeria. Perfect for birthdays, anniversaries, and special occasions.',
        },
        {
          icon: star,
          title: 'Personal Shopping | Clothes, Gadgets & More',
          desc: 'Send a Tasker to any store to buy specific items: clothing, shoes, electronics, or household goods, with photo confirmation before purchase.',
        },
        {
          icon: map,
          title: 'Corporate & Business Office Errands',
          desc: 'Recurring office errands for SMEs and corporate teams: banking, supplies, documentation, and inter-office deliveries. Upgrade to Taskeeu for Teams for enterprise management.',
        },
      ]}
      useCases={[
        {
          icon: shop,
          title: 'Busy Lagos Professionals (VI, Ikoyi, Lekki, Ajah)',
          desc: 'Corporate workers in Victoria Island, Ikoyi, Lekki Phase 1, Ajah, or Maryland who cannot leave the office during work hours for personal or household errands.',
        },
        {
          icon: clock,
          title: 'Anyone Dreading Government Office Queues',
          desc: 'People who need a trusted Tasker to queue at NIMC, FRSC, NIN offices, passport offices, JAMB CBT centres, or FIRS in Lagos or Abuja, without taking a day off work.',
        },
        {
          icon: file,
          title: 'SMEs & Small Business Owners',
          desc: 'Business owners in Trade Fair, Alaba, Computer Village, or Otigba who need someone to run banking, collect documents, pay bills, and handle supplier errands while they focus on operations.',
        },
        {
          icon: map,
          title: 'New Residents in Lagos or Abuja',
          desc: 'Expats, corpers, and relocated professionals who do not yet know their way around and need a trusted local Tasker to navigate markets, offices, and city errands.',
        },
        {
          icon: users,
          title: 'Elderly Clients & Their Families',
          desc: 'Adult children arranging errand support for elderly parents who need medications collected, bills paid, or government office visits handled, safely and reliably.',
        },
        {
          icon: activity,
          title: 'Nigerians in the Diaspora',
          desc: 'UK, US, or Canada-based Nigerians who need someone on the ground to run errands, manage property issues, handle family tasks, or send care packages to loved ones back home.',
        },
      ]}
      faqs={[
        {
          q: "How does Taskeeu's errand service work?",
          a: "Post your errand on Taskeeu in under 2 minutes: describe the task, set your location (Lagos, Abuja, PH, or anywhere in Nigeria), and your budget. Verified Taskers near you send competitive bids. You review profiles, ratings, and past reviews, then choose your Tasker. Track progress in real time, and only release payment from escrow when you are satisfied.",
        },
        {
          q: "Is Taskeeu's errand service available in Abuja, Port Harcourt & other cities?",
          a: "Yes. Taskeeu has active verified Taskers across Lagos, Abuja (Maitama, Wuse 2, Garki, Gwarinpa), Port Harcourt, Ibadan, Kano, Enugu, Benin City, Kaduna, and 30+ other cities and states. Post your task and Taskers in your specific area will respond.",
        },
        {
          q: "Can a Tasker queue at NIMC, FRSC, NIS, or the passport office for me?",
          a: "Yes, government office queuing is one of the most popular errand requests on Taskeeu. Specify the office, state, and what you need done in your task description. A local Tasker will go in person, hold your place, and provide photo/video proof of completion.",
        },
        {
          q: "How much does hiring an errand runner in Lagos cost?",
          a: "You set your budget when posting. Taskers bid competitively based on distance, complexity, and time required. A simple grocery run in Lagos typically costs ₦2,000 to ₦5,000. A government office queue visit ranges from ₦3,000 to ₦10,000 depending on the office and wait time. You are never charged more than you approve.",
        },
        {
          q: "How is Taskeeu different from ErrandBoy Nigeria, errands.ng, or Helpmewaka?",
          a: "Taskeeu is a competitive marketplace where multiple verified Taskers bid on your job, so you get the best price and choose who you trust based on ratings and reviews. All payments are held in escrow until you confirm the task is done correctly. You also get real-time task tracking and direct chat with your Tasker throughout.",
        },
        {
          q: "Can I trust Taskeeu errand runners with my personal errands?",
          a: "Every Tasker on Taskeeu completes identity verification (NIN or BVN) before accepting any task. You can view their verified badge, full profile, star rating, and completed task history before you choose them. Payments are held in escrow. You never pay until you confirm satisfactory completion.",
        },
        {
          q: "Can I hire a Tasker for recurring weekly errands?",
          a: "Yes. You can post repeat tasks any time or discuss recurring arrangements directly with a Tasker you trust. For businesses needing structured daily or weekly field errands across multiple staff, explore Taskeeu for Teams, Nigeria's enterprise task outsourcing platform.",
        },
        {
          q: "I live abroad, can I hire a Tasker to run errands for family in Nigeria?",
          a: "Absolutely. Taskeeu supports diaspora clients who need on-the-ground help for family or property in Nigeria. Post your task in Naira, choose a verified local Tasker, and receive real-time photo/chat updates on every step, from any country in the world.",
        },
      ]}
      relatedLinks={[
        { label: 'Find an Errand Runner Near Me', href: '/errand-runner-near-me' },
        { label: 'Errand Service Lagos', href: '/errands/lagos' },
        { label: 'Errand Service Abuja', href: '/errands/abuja' },
        { label: 'Errand Service Port Harcourt', href: '/errands/port-harcourt' },
        { label: 'Errand Service Ibadan', href: '/errands/ibadan' },
        { label: 'Errand Service Kano', href: '/errands/kano' },
        { label: 'Errand Service Onitsha', href: '/errands/onitsha' },
        { label: 'Errand Service Benin City', href: '/errands/benin-city' },
        { label: 'For Nigerians Abroad', href: '/diaspora' },
        { label: 'Taskeeu vs Jiji', href: '/vs/jiji' },
        { label: 'Grocery Shopping Service', href: '/grocery-shopping' },
        { label: 'Delivery Service', href: '/delivery' },
        { label: 'Document Pickup', href: '/document-pickup' },
        { label: 'Office Support', href: '/office-support' },
        { label: 'Business Support', href: '/business-support' },
        { label: 'Property Inspection', href: '/property-inspection' },
        { label: 'Taskeeu for Teams', href: '/teams' },
      ]}
    />
  );
}
