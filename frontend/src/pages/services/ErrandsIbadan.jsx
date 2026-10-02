import ServiceLanding from '../../components/ui/ServiceLanding';
import { makeLocalBusinessSchema } from '../../components/seo/SEO';

const shop = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>;
const clock = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const file = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const users = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const book = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;

export default function ErrandsIbadan() {
  return (
    <ServiceLanding
      seo={{
        slug: '/errands/ibadan',
        title: 'Errand Service in Ibadan | Hire a Verified Errand Runner in Ibadan',
        description:
          "Ibadan errand service on Taskeeu. Hire a trusted, verified errand runner in Bodija, Ring Road, Dugbe, Mokola, Akobo, Challenge & all Ibadan areas. Bodija Market runs, government queuing, UI/Poly document errands, deliveries & more, escrow-protected.",
        keywords:
          'errand service Ibadan, errand runner Ibadan, errand boy Ibadan, hire errand runner Ibadan, ' +
          'Bodija market runs, Dugbe market shopper, grocery run Ibadan, errand runner Bodija, ' +
          'errand runner Ring Road Ibadan, queue NIMC Ibadan, transcript UI Ibadan, ' +
          'personal assistant Ibadan, delivery Ibadan, task outsourcing Ibadan, errand service Oyo State',
        structuredData: makeLocalBusinessSchema({
          city: 'Ibadan',
          serviceType: 'Errand Service',
          url: 'https://taskeeu.com/errands/ibadan',
        }),
      }}
      hero={{
        badge: 'Ibadan Errand Service: Bodija · Dugbe · Ring Road · Akobo · Challenge & More',
        headline: 'Hire a Trusted Errand Runner in Ibadan: Any Task, Any Area',
        subheadline:
          'Taskeeu connects you with identity-verified errand runners across Ibadan, from Bodija and Mokola to Ring Road, Challenge, Akobo, and Ojoo. Post any errand and get bids in minutes.',
        tasksHeading: 'Ibadan Errand Tasks We Handle',
        tasksSubheading:
          'Every Ibadan errand covered, from Bodija Market runs to UI transcript collection. Escrow-protected, real-time tracking.',
      }}
      tasks={[
        { icon: shop, title: 'Bodija & Dugbe Market Runs', desc: 'Bodija Market, Dugbe, Oja Oba, Aleshinloye, Shoprite Ring Road, Ventura Mall. Your Tasker shops your list at true local prices and delivers with receipts.' },
        { icon: book, title: 'UI, Poly Ibadan & UCH Document Errands', desc: 'Transcript collection at the University of Ibadan, Poly Ibadan document runs, UCH registrations and pickups, handled in person with proof.' },
        { icon: clock, title: 'Queue at NIMC, FRSC & Government Offices', desc: 'Skip the queues. Send a Tasker to NIMC Oyo, FRSC, the passport office at Agodi, JAMB, or the Oyo State Secretariat on your behalf.' },
        { icon: file, title: 'Document Pickup & Courier Across Ibadan', desc: 'Same-day document delivery from Ojoo to Challenge, Akobo to Apata. Certificates, contracts, NIN slips, legal documents.' },
        { icon: map, title: 'IBEDC Payments & Utility Bills', desc: 'Physical payment of IBEDC electricity, water, cable TV, rent, and school fees at any office or agent across Ibadan.' },
        { icon: users, title: 'Personal Shopping & Gift Delivery (Ibadan)', desc: 'Buy and deliver gifts, cakes, amala spots pickup, or specific items from any Ibadan store to any address in the city.' },
      ]}
      useCases={[
        { icon: book, title: 'UI & Poly Ibadan Alumni Anywhere', desc: 'Graduates in Lagos, Abuja, or abroad who need transcripts and certificates collected from Ibadan institutions without travelling.' },
        { icon: clock, title: 'Busy Professionals & Remote Workers', desc: 'Workers who cannot leave the office for personal errands, or Lagos-based people with errands in Ibadan.' },
        { icon: users, title: 'Families of Elderly Ibadan Residents', desc: 'Arrange prescriptions, foodstuff, and welfare visits for elderly parents in Ibadan, locally or from abroad, with photo proof.' },
        { icon: shop, title: 'Traders & Food Businesses', desc: 'Vendors who need daily Bodija supplies bought at wholesale prices while they run their business.' },
        { icon: map, title: 'New Arrivals & Students', desc: 'Students, corpers, and newcomers who need a trusted local to navigate Ibadan markets, offices, and neighbourhoods.' },
        { icon: file, title: 'Nigerians Abroad With Family in Ibadan', desc: 'Diaspora clients sending groceries, paying bills, and checking property in Ibadan from anywhere in the world.' },
      ]}
      faqs={[
        { q: 'Which areas of Ibadan does Taskeeu cover?', a: 'Taskeeu has verified Taskers across Ibadan including Bodija, Mokola, Dugbe, Ring Road, Challenge, Akobo, Ojoo, Sango, Apata, Oluyole, Jericho, Agodi, Iwo Road, Egbeda and more. Post your task and local Taskers will bid.' },
        { q: 'How much does an errand runner cost in Ibadan?', a: 'You set your budget. A grocery or market run typically costs ₦1,500 to ₦3,500. Government queuing ranges ₦2,500 to ₦7,000 depending on waiting time. Taskers bid competitively. You never pay more than you approve.' },
        { q: 'Can a Tasker collect my transcript from the University of Ibadan?', a: 'Yes, UI and Poly Ibadan document errands are among the most requested tasks in Ibadan. Describe the department and reference details, and a Tasker follows up in person until your documents are collected, then couriers or scans them to you.' },
        { q: 'How do I know an Ibadan Tasker is trustworthy?', a: 'Every Tasker is identity-verified with NIN or BVN before accepting tasks. You see verified badges, ratings, and completed history. Payment sits in escrow until you confirm the job is done.' },
        { q: 'Can I hire an Ibadan errand runner for recurring tasks?', a: 'Yes. Post recurring tasks or rehire a trusted Tasker directly for weekly market runs, regular bill payments, or ongoing family support.' },
      ]}
      relatedLinks={[
        { label: 'All Nigeria Errands', href: '/errands' },
        { label: 'Errand Service Lagos', href: '/errands/lagos' },
        { label: 'Errand Service Port Harcourt', href: '/errands/port-harcourt' },
        { label: 'Grocery Shopping Service', href: '/grocery-shopping' },
        { label: 'For Nigerians Abroad', href: '/diaspora' },
      ]}
    />
  );
}
