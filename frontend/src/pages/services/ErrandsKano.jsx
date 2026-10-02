import ServiceLanding from '../../components/ui/ServiceLanding';
import { makeLocalBusinessSchema } from '../../components/seo/SEO';

const shop = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>;
const clock = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const file = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const users = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const briefcase = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>;

export default function ErrandsKano() {
  return (
    <ServiceLanding
      seo={{
        slug: '/errands/kano',
        title: 'Errand Service in Kano | Hire a Verified Errand Runner in Kano',
        description:
          "Kano errand service on Taskeeu. Hire a trusted, verified errand runner in Sabon Gari, Nassarawa GRA, Kurmi Market area, Bompai & all Kano areas. Market runs, Kantin Kwari trade errands, government queuing, deliveries & more, escrow-protected.",
        keywords:
          'errand service Kano, errand runner Kano, errand boy Kano, hire errand runner Kano, ' +
          'Kurmi market runs, Kantin Kwari errands, Sabon Gari market shopper, grocery run Kano, ' +
          'queue NIMC Kano, personal assistant Kano, delivery Kano, task outsourcing Kano, ' +
          'errand service northern Nigeria, business errands Kano',
        structuredData: makeLocalBusinessSchema({
          city: 'Kano',
          serviceType: 'Errand Service',
          url: 'https://taskeeu.com/errands/kano',
        }),
      }}
      hero={{
        badge: 'Kano Errand Service: Sabon Gari · Nassarawa · Bompai · Kurmi & More',
        headline: 'Hire a Trusted Errand Runner in Kano: Any Task, Any Area',
        subheadline:
          'Taskeeu connects you with identity-verified errand runners across Kano, from Sabon Gari and Nassarawa GRA to Bompai, Kurmi, and Gwale. Post any errand and get bids in minutes.',
        tasksHeading: 'Kano Errand Tasks We Handle',
        tasksSubheading:
          'Every Kano errand covered, from Kurmi Market runs to Kantin Kwari trade errands. Escrow-protected, real-time tracking.',
      }}
      tasks={[
        { icon: shop, title: 'Kurmi, Sabon Gari & Yankura Market Runs', desc: 'Kurmi Market, Sabon Gari Market, Yankura, Singer Market, Ado Bayero Mall. Your Tasker shops your list at true local prices and delivers with receipts.' },
        { icon: briefcase, title: 'Kantin Kwari Textile & Trade Errands', desc: 'Price checks, supplier pickups, sample collection, and bulk purchase coordination at Kantin Kwari and Singer markets for traders anywhere in Nigeria.' },
        { icon: clock, title: 'Queue at NIMC, FRSC & Government Offices', desc: 'Skip the queues. Send a Tasker to NIMC Kano, FRSC, the NIS passport office, JAMB, or Kano State Secretariat on your behalf.' },
        { icon: file, title: 'Document Pickup & Courier Across Kano', desc: 'Same-day document delivery across Kano, BUK document runs, certificates, contracts, NIN slips, legal papers.' },
        { icon: map, title: 'KEDCO Payments & Utility Bills', desc: 'Physical payment of KEDCO electricity, water, cable TV, rent, and school fees at any office or agent across Kano.' },
        { icon: users, title: 'Personal Shopping & Gift Delivery (Kano)', desc: 'Buy and deliver gifts, food, or specific items from any Kano store or market to any address in the city.' },
      ]}
      useCases={[
        { icon: briefcase, title: 'Traders Buying From Kano Remotely', desc: 'Lagos, Abuja, and Onitsha traders who source textiles and goods from Kantin Kwari and Kurmi, verify, purchase, and ship without travelling.' },
        { icon: clock, title: 'Busy Professionals in Kano', desc: 'Workers in Bompai and Nassarawa who cannot leave the office for personal errands during business hours.' },
        { icon: users, title: 'Families of Elderly Kano Residents', desc: 'Arrange foodstuff, prescriptions, and welfare visits for elderly parents in Kano, locally or from abroad, with photo proof.' },
        { icon: shop, title: 'SME Owners & Shop Keepers', desc: 'Business owners needing daily banking runs, supplier collections, and deliveries across Kano metropolis.' },
        { icon: map, title: 'Students & New Arrivals', desc: 'BUK students, corpers, and newcomers who need a trusted local to navigate Kano markets and offices.' },
        { icon: file, title: 'Nigerians Abroad With Family in Kano', desc: 'Diaspora clients sending groceries, paying bills, and checking on family in Kano from anywhere in the world.' },
      ]}
      faqs={[
        { q: 'Which areas of Kano does Taskeeu cover?', a: 'Taskeeu has verified Taskers across Kano including Sabon Gari, Nassarawa GRA, Bompai, Fagge, Gwale, Tarauni, Hotoro, Zoo Road, Kurmi area, and more. Post your task and local Taskers will bid.' },
        { q: 'How much does an errand runner cost in Kano?', a: 'You set your budget. A market or grocery run typically costs ₦1,500 to ₦3,500. Government queuing ranges ₦2,500 to ₦7,000. Taskers bid competitively. You never pay more than you approve.' },
        { q: 'Can a Tasker buy textiles from Kantin Kwari for me?', a: 'Yes, trade errands are among the most valuable Kano tasks. Your Tasker can check prices, send photos of materials, negotiate, purchase, and arrange shipping to any Nigerian city. Escrow protects your money throughout.' },
        { q: 'How do I know a Kano Tasker is trustworthy?', a: 'Every Tasker is identity-verified with NIN or BVN before accepting tasks. You see verified badges, ratings, and completed history. Payment sits in escrow until you confirm the job is done correctly.' },
        { q: 'Can I hire a Kano errand runner for recurring tasks?', a: 'Yes. Post recurring tasks or rehire a trusted Tasker directly for weekly market runs, regular supplier pickups, or ongoing family support.' },
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
