import ServiceLanding from '../../components/ui/ServiceLanding';
import { makeLocalBusinessSchema } from '../../components/seo/SEO';

const shop = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>;
const clock = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const file = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const users = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const book = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;

export default function ErrandsJos() {
  return (
    <ServiceLanding
      seo={{
        slug: '/errands/jos',
        title: 'Errand Service in Jos | Hire a Verified Errand Runner in Jos',
        description:
          "Jos errand service on Taskeeu. Hire a trusted, verified errand runner in Rayfield, Terminus, Bukuru, Farin Gada & all Jos areas. Terminus Market runs, government queuing, UNIJOS document errands, deliveries & more, escrow-protected.",
        keywords:
          'errand service Jos, errand runner Jos, errand boy Jos, hire errand runner Jos, Terminus market runs, Bukuru market shopper, grocery run Jos, errand runner Rayfield, queue NIMC Plateau, UNIJOS document errands, personal assistant Jos, delivery Jos, task outsourcing Jos, errand service Plateau State',
        structuredData: makeLocalBusinessSchema({
          city: 'Jos',
          serviceType: 'Errand Service',
          url: 'https://taskeeu.com/errands/jos',
        }),
      }}
      hero={{
        badge: 'Jos Errand Service: Rayfield · Terminus · Bukuru · Farin Gada · GRA Jos & More',
        headline: 'Hire a Trusted Errand Runner in Jos: Any Task, Any Area',
        subheadline:
          'Taskeeu connects you with identity-verified errand runners across Jos, from Rayfield and Terminus to Bukuru, Farin Gada, and GRA Jos. Post any errand and get bids in minutes.',
        tasksHeading: 'Jos Errand Tasks We Handle',
        tasksSubheading:
          'Every Jos errand covered, from Terminus Market runs to UNIJOS document collection. Escrow-protected, real-time tracking.',
      }}
      tasks={[
        { icon: shop, title: 'Terminus Market & Bukuru Market Runs', desc: 'Terminus Market, the traditional central market area in the heart of the city. Bukuru Market, a major trading area on the Jos-Bukuru road axis. Your Tasker shops your list at true local prices and delivers with receipts.' },
        { icon: book, title: 'UNIJOS & Local Institution Document Errands', desc: 'University of Jos (UNIJOS) document runs, transcript collection, admission letters, and registration errands, handled in person with proof, at Bauchi Road and Naraguta campuses, plus Plateau State University.' },
        { icon: clock, title: 'Queue at NIMC, FRSC & Government Offices', desc: 'Skip the queues. Send a Tasker to NIMC Plateau, FRSC, the Passport Office, and the Plateau State Secretariat on your behalf.' },
        { icon: file, title: 'Document Pickup & Courier Across Jos', desc: 'Same-day document delivery across Jos. Certificates, contracts, NIN slips, legal documents.' },
        { icon: map, title: 'Jos Electricity Distribution (JED) & Utility Bill Payments', desc: 'Physical payment of JED electricity, water, cable TV, rent, and school fees at any office or agent across Jos.' },
        { icon: users, title: 'Personal Shopping & Gift Delivery (Jos)', desc: 'Buy and deliver gifts, cakes, or specific items from any Jos store to any address in the city.' },
      ]}
      useCases={[
        { icon: book, title: 'UNIJOS Alumni Anywhere', desc: 'Graduates in Lagos, Abuja, or abroad who need transcripts and certificates collected from Jos institutions without travelling.' },
        { icon: clock, title: 'Busy Professionals & Remote Workers', desc: 'Workers who cannot leave the office for personal errands, or people based elsewhere with errands in Jos.' },
        { icon: users, title: 'Families of Elderly Jos Residents', desc: 'Arrange prescriptions, foodstuff, and welfare visits for elderly parents in Jos, locally or from abroad, with photo proof.' },
        { icon: shop, title: 'Traders & Food Businesses', desc: 'Vendors who need daily market supplies bought at wholesale prices while they run their business.' },
        { icon: map, title: 'New Arrivals & Students', desc: 'Students, corpers, and newcomers who need a trusted local to navigate Jos markets, offices, and neighbourhoods.' },
        { icon: file, title: 'Nigerians Abroad With Family in Jos', desc: 'Diaspora clients sending groceries, paying bills, and checking property in Jos from anywhere in the world.' },
      ]}
      faqs={[
        { q: 'Which areas of Jos does Taskeeu cover?', a: 'Taskeeu has verified Taskers across Jos including Rayfield, Terminus, Bukuru, Farin Gada, GRA Jos, Angwan Rogo, Tudun Wada, Bauchi Road, Naraguta, Zaria Road and more. Post your task and local Taskers will bid.' },
        { q: 'How much does an errand runner cost in Jos?', a: 'You set your budget. A grocery or market run typically costs ₦1,500 to ₦3,500. Government queuing ranges ₦2,500 to ₦7,000 depending on waiting time. Taskers bid competitively. You never pay more than you approve.' },
        { q: 'Can a Tasker collect my documents from UNIJOS or a government office in Jos?', a: 'Yes, document errands are among the most requested tasks in Jos. Describe the department and reference details, and a Tasker follows up in person until your documents are collected, then couriers or scans them to you.' },
        { q: 'How do I know a Jos Tasker is trustworthy?', a: 'Every Tasker is identity-verified with NIN or BVN before accepting tasks. You see verified badges, ratings, and completed history. Payment sits in escrow until you confirm the job is done.' },
        { q: 'Can I hire a Jos errand runner for recurring tasks?', a: 'Yes. Post recurring tasks or rehire a trusted Tasker directly for weekly market runs, regular bill payments, or ongoing family support.' },
      ]}
      relatedLinks={[
        { label: 'All Nigeria Errands', href: '/errands' },
        { label: 'Errand Service Lagos', href: '/errands/lagos' },
        { label: 'Errand Service Abuja', href: '/errands/abuja' },
        { label: 'Grocery Shopping Service', href: '/grocery-shopping' },
        { label: 'For Nigerians Abroad', href: '/diaspora' },
      ]}
    />
  );
}
