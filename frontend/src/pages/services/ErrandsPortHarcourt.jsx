import ServiceLanding from '../../components/ui/ServiceLanding';
import { makeLocalBusinessSchema } from '../../components/seo/SEO';

const shop = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>;
const clock = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const file = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const users = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const briefcase = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>;

export default function ErrandsPortHarcourt() {
  return (
    <ServiceLanding
      seo={{
        slug: '/errands/port-harcourt',
        title: 'Errand Service in Port Harcourt | Hire a Verified Errand Runner in PH',
        description:
          "Port Harcourt errand service on Taskeeu. Hire a trusted, verified errand runner in GRA, Trans-Amadi, D-Line, Rumuokoro, Eliozu & all PH areas. Market runs at Mile 1 & Oil Mill, government queuing, deliveries & more, escrow-protected.",
        keywords:
          'errand service Port Harcourt, errand runner Port Harcourt, errand boy PH, ' +
          'hire errand runner Port Harcourt, errand runner GRA Port Harcourt, errand Trans-Amadi, ' +
          'Mile 1 market runs, Oil Mill market shopper, grocery run Port Harcourt, ' +
          'queue NIMC Port Harcourt, personal assistant Port Harcourt, delivery Port Harcourt, ' +
          'task outsourcing Port Harcourt, errand service Rivers State',
        structuredData: makeLocalBusinessSchema({
          city: 'Port Harcourt',
          serviceType: 'Errand Service',
          url: 'https://taskeeu.com/errands/port-harcourt',
        }),
      }}
      hero={{
        badge: 'Port Harcourt Errand Service: GRA · Trans-Amadi · D-Line · Rumuokoro & More',
        headline: 'Hire a Trusted Errand Runner in Port Harcourt: Any Task, Any Area',
        subheadline:
          'Taskeeu connects you with identity-verified errand runners across Port Harcourt, from GRA and Trans-Amadi to D-Line, Rumuokoro, Eliozu and Woji. Post any errand and get bids in minutes.',
        tasksHeading: 'Port Harcourt Errand Tasks We Handle',
        tasksSubheading:
          'Every PH errand covered, from Mile 1 Market runs to NIMC queuing. Escrow-protected, real-time tracking.',
      }}
      tasks={[
        { icon: shop, title: 'PH Market & Grocery Runs', desc: 'Mile 1, Mile 3, Oil Mill, Creek Road Market, Spar, Market Square, Everyday Supermarket. Your Tasker shops your list and delivers with receipts.' },
        { icon: clock, title: 'Queue at NIMC, FRSC & Passport Office PH', desc: 'Skip the queues. Send a Tasker to NIMC Rivers, FRSC, the NIS passport office, JAMB office or any government agency in Port Harcourt.' },
        { icon: file, title: 'Document Pickup & Courier Across PH', desc: 'Same-day document delivery across Port Harcourt, GRA to Choba, Trans-Amadi to Eleme. Certificates, contracts, NIN slips, legal documents.' },
        { icon: map, title: 'PHED Payments & Utility Bills', desc: 'Physical payment of PHED electricity, water, cable TV, rent, and school fees at any office or agent across Port Harcourt.' },
        { icon: users, title: 'Personal Shopping & Gift Delivery (PH)', desc: 'Buy and deliver gifts, cakes, flowers, or specific items from any Port Harcourt store or mall to any address in the city.' },
        { icon: briefcase, title: 'Corporate & Oil-Sector Support Errands', desc: 'Banking runs, filings, supplier collections, and field errands for businesses in Trans-Amadi, GRA, and the industrial areas.' },
      ]}
      useCases={[
        { icon: briefcase, title: 'Oil & Gas Professionals', desc: 'Busy professionals in Trans-Amadi and GRA who cannot leave work for personal errands during PH business hours.' },
        { icon: clock, title: 'Anyone Tired of Government Queues', desc: 'Send a Tasker to NIMC, FRSC, NIS, or any Rivers State or federal office on your behalf, with photo proof of progress.' },
        { icon: users, title: 'Families of Elderly PH Residents', desc: 'Arrange prescriptions, bill payments, and welfare visits for elderly parents in Diobu, Rumuokoro, or Old GRA, locally or from abroad.' },
        { icon: shop, title: 'SME Owners & Traders', desc: 'Business owners in Mile 1, Oil Mill, and Creek Road needing daily banking, supplier pickups, and inter-office deliveries.' },
        { icon: map, title: 'New Arrivals & Students', desc: 'UNIPORT/RSU students, corpers, and newly relocated professionals who need a trusted local to navigate PH markets and offices.' },
        { icon: file, title: 'Nigerians Abroad With Family in PH', desc: 'Diaspora clients sending groceries, paying bills, and checking property in Port Harcourt from the US, UK, or anywhere.' },
      ]}
      faqs={[
        { q: 'Which areas of Port Harcourt does Taskeeu cover?', a: 'Taskeeu has verified Taskers across Port Harcourt including GRA (Old & New), Trans-Amadi, D-Line, Diobu, Mile 1 to 4, Rumuokoro, Rumuodara, Eliozu, Woji, Elelenwo, Choba, Alakahia, Eleme Junction and more. Post your task and local Taskers will bid.' },
        { q: 'How much does an errand runner cost in Port Harcourt?', a: 'You set your budget. A simple grocery run typically costs ₦2,000 to ₦4,000. Government office queuing ranges ₦3,000 to ₦8,000 depending on waiting time. Taskers bid competitively, and you never pay more than you approve.' },
        { q: 'Can a Tasker shop at Mile 1 or Oil Mill Market for me?', a: 'Yes, market runs are among the most popular Port Harcourt errands. Your Tasker buys at true local prices, sends photos before purchase if you want, and delivers with itemised receipts.' },
        { q: 'How do I know a PH Tasker is trustworthy?', a: 'Every Tasker is identity-verified with NIN or BVN before accepting tasks. You can view verified badges, ratings, and completed task history. Payment is held in escrow until you confirm completion.' },
        { q: 'Can I hire a PH errand runner for recurring tasks?', a: 'Yes. Post recurring tasks or rehire a trusted Tasker directly. Businesses needing structured recurring errands across Port Harcourt can explore Taskeeu for Teams.' },
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
