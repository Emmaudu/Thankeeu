import ServiceLanding from '../../components/ui/ServiceLanding';
import { makeLocalBusinessSchema } from '../../components/seo/SEO';

const shop = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>;
const clock = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const file = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const users = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const activity = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const bag = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>;
const star = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

export default function ErrandsLagos() {
  return (
    <ServiceLanding
      seo={{
        slug: '/errands/lagos',
        title: 'Errand Service in Lagos | Hire a Verified Errand Runner in Lagos Today',
        description:
          "Lagos errand service on Taskeeu. Hire a trusted, identity-verified errand runner in Lagos Island, Lekki, Victoria Island, Ikoyi, Ajah, Surulere, Yaba, Ikeja & all Lagos areas. Grocery runs, NIMC queuing, bill payments, pharmacy pickups & more, with escrow protection.",
        keywords:
          'errand service Lagos, errand runner Lagos, errand boy Lagos, hire errand runner Lagos, ' +
          'errand Lagos Island, errand runner Lekki, errand runner Victoria Island, errand runner Ikoyi, ' +
          'errand runner Ikeja, errand runner Surulere, errand runner Yaba, errand runner Ajah, ' +
          'grocery run Lagos, market run Lagos, Balogun market errand, Oyingbo market run, ' +
          'queue NIMC Lagos, queue FRSC Lagos, passport office queue Lagos, ' +
          'personal assistant Lagos, errand marketplace Lagos, task outsourcing Lagos',
        structuredData: makeLocalBusinessSchema({
          city: 'Lagos',
          serviceType: 'Errand Service',
          url: 'https://taskeeu.com/errands/lagos',
        }),
      }}
      hero={{
        badge: 'Lagos Errand Service: VI · Lekki · Ikeja · Island · Mainland & More',
        headline: 'Hire a Trusted Errand Runner in Lagos: Any Task, Any Area',
        subheadline:
          'Taskeeu connects you with identity-verified errand runners across every Lagos neighbourhood, from Lekki and Victoria Island to Ikeja, Surulere, Yaba, Ajah, and beyond. Post any errand and get bids in minutes.',
        tasksHeading: 'Lagos Errand Tasks We Handle',
        tasksSubheading:
          'Every Lagos errand covered, from Balogun Market runs to NIMC queuing at Alausa. Escrow-protected, real-time tracking.',
      }}
      tasks={[
        {
          icon: shop,
          title: 'Lagos Market & Grocery Runs',
          desc: 'Balogun Market, Oyingbo, Mile 12, Ikeja Mall, Shoprite Lekki, Game, Hubmart. Your Tasker shops your list and delivers with receipts.',
        },
        {
          icon: clock,
          title: 'Queue at NIMC Alausa, FRSC Lagos & Passport Office',
          desc: 'Skip the Lagos government office queues. Send a Tasker to NIMC Alausa, FRSC Command, NIS Ikoyi passport office, JAMB, or any state agency.',
        },
        {
          icon: activity,
          title: 'LIRS, CAC & Lagos State Agency Runs',
          desc: 'Pay LIRS taxes, file at CAC Alausa, handle LMIS, LASWA, LASG, or LASG MDAs, any government errand in Lagos covered.',
        },
        {
          icon: file,
          title: 'Document Pickup & Courier (Lagos)',
          desc: 'Same-day document delivery across Lagos, from Victoria Island to Ikorodu. Certificates, contracts, NIN slips, legal documents.',
        },
        {
          icon: map,
          title: 'NEPA / EKEDC Payments & Utility Bills',
          desc: 'Physical payment of EKEDC, water board, cable TV, rent, and school fees at any office or agent across Lagos.',
        },
        {
          icon: users,
          title: 'Personal Shopping & Gift Delivery (Lagos)',
          desc: 'Buy and deliver gifts, flowers, cakes, or specific items from any Lagos store. Ikeja Computer Village, Eko Hotel, Alaba, any location.',
        },
        {
          icon: bag,
          title: 'Pharmacy Pickups Across Lagos',
          desc: 'Collect prescriptions from Roche Pharma, HealthPlus, MedPlus, or any local pharmacy, especially useful for elderly clients and nursing mothers.',
        },
        {
          icon: star,
          title: 'Corporate Office Errands (Lagos Island & VI)',
          desc: 'Regular banking, supplies, inter-office runs, and field errands for businesses on Victoria Island, Ikoyi, Marina, and Lagos Island.',
        },
      ]}
      useCases={[
        {
          icon: shop,
          title: 'Corporate Workers on Victoria Island & Ikoyi',
          desc: 'Professionals in VI, Ikoyi, Marina, or Onikan who cannot leave the office for personal errands during Lagos business hours.',
        },
        {
          icon: clock,
          title: 'Anyone Tired of Lagos Government Office Queues',
          desc: 'Send a Tasker to NIMC Alausa, FRSC Command Ojota, NIS Ikoyi, LIRS Ikeja, or any Lagos state or federal government office on your behalf.',
        },
        {
          icon: file,
          title: 'Lekki & Ajah Residents',
          desc: 'Island residents who need errands run on the mainland, or mainland dwellers who need someone on the island, without crossing Lagos traffic.',
        },
        {
          icon: map,
          title: 'New Arrivals in Lagos',
          desc: 'Corpers, expats, and newly relocated professionals who need a trusted local guide to navigate Lagos markets, offices, and neighbourhoods.',
        },
        {
          icon: users,
          title: 'Elderly Lagos Residents',
          desc: 'Families helping elderly parents in Surulere, Mushin, Shomolu, or Lagos Island get prescriptions, pay bills, and handle agency visits safely.',
        },
        {
          icon: activity,
          title: 'SME Owners in Alaba, Trade Fair & Computer Village',
          desc: 'Business owners needing daily banking, supplier collections, agency filings, and inter-office deliveries across multiple Lagos locations simultaneously.',
        },
      ]}
      faqs={[
        {
          q: "Which areas of Lagos does Taskeeu cover for errand services?",
          a: "Taskeeu has active, verified Taskers across all Lagos areas including Victoria Island, Ikoyi, Lekki Phase 1, Lekki Phase 2, Ajah, Ikeja, Surulere, Yaba, Maryland, Ojodu, Berger, Ketu, Ikorodu, Lagos Island, Apapa, Festac, Isolo, Oshodi, Mushin, Agege, Shomolu, Gbagada, and more. Post your task and local Taskers near you will bid.",
        },
        {
          q: "How much does a Lagos errand runner cost?",
          a: "You set your budget when posting. Taskers bid competitively based on distance and task complexity. A simple grocery run in Lekki or VI typically costs ₦2,000 to ₦5,000. Government office queuing (NIMC Alausa, FRSC) ranges from ₦3,000 to ₦10,000 depending on waiting time. You are never charged more than you approve.",
        },
        {
          q: "Can a Tasker queue at NIMC Alausa or FRSC Lagos for me?",
          a: "Yes. This is one of the most-requested errand services on Taskeeu Lagos. Clearly describe the specific office, what documents or forms you need, and any relevant details. A local Lagos Tasker will attend in person and send you photo/video proof of progress and completion.",
        },
        {
          q: "How do I know a Lagos Tasker is trustworthy?",
          a: "Every Lagos Tasker on Taskeeu is identity-verified using NIN or BVN before they can accept any task. You can view their verified badge, full profile, star rating, and completed task history before choosing. Your payment is held in escrow and only released when you confirm the task is done correctly.",
        },
        {
          q: "Can I hire a Lagos errand runner for daily or weekly recurring tasks?",
          a: "Yes. Post recurring tasks anytime, or work out a standing arrangement directly with a trusted Tasker you've rated. For businesses needing structured recurring field errands across Lagos, explore Taskeeu for Teams.",
        },
      ]}
      relatedLinks={[
        { label: 'All Nigeria Errands', href: '/errands' },
        { label: 'Errand Service Abuja', href: '/errands/abuja' },
        { label: 'Delivery Service Lagos', href: '/delivery' },
        { label: 'Document Pickup', href: '/document-pickup' },
        { label: 'Taskeeu for Teams', href: '/teams' },
      ]}
    />
  );
}
