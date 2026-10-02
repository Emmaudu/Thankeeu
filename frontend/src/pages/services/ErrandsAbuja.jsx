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

export default function ErrandsAbuja() {
  return (
    <ServiceLanding
      seo={{
        slug: '/errands/abuja',
        title: 'Errand Service in Abuja | Hire a Verified Errand Runner in Abuja FCT',
        description:
          "Abuja errand service on Taskeeu. Hire trusted, identity-verified errand runners in Maitama, Wuse 2, Garki, Gwarinpa, Asokoro, Jabi, Utako & all Abuja FCT areas. NIMC queuing, FIRS, CAC filings, grocery runs & more, with escrow payment protection.",
        keywords:
          'errand service Abuja, errand runner Abuja, errand boy Abuja, hire errand runner Abuja FCT, ' +
          'errand Maitama, errand runner Wuse 2, errand runner Garki, errand runner Gwarinpa, ' +
          'errand runner Asokoro, errand runner Jabi, errand runner Utako, errand runner Kubwa, ' +
          'queue NIMC Abuja, queue NIS Abuja passport, FIRS Abuja errand, CAC Abuja filing, ' +
          'grocery run Abuja, Wuse market errand, personal assistant Abuja, task outsourcing Abuja',
        structuredData: makeLocalBusinessSchema({
          city: 'Abuja',
          serviceType: 'Errand Service',
          url: 'https://taskeeu.com/errands/abuja',
        }),
      }}
      hero={{
        badge: 'Abuja Errand Service: Maitama · Wuse 2 · Garki · Gwarinpa & FCT',
        headline: 'Trusted Errand Runners in Abuja: Any Task, Any FCT District',
        subheadline:
          'Taskeeu connects you with identity-verified errand runners across all Abuja FCT districts, Maitama, Wuse 2, Asokoro, Garki, Gwarinpa, Jabi, Utako, Kubwa, and more. Post any errand and receive bids within minutes.',
        tasksHeading: 'Abuja Errand Tasks We Handle',
        tasksSubheading:
          'From NIS passport queuing to Wuse Market grocery runs. Every Abuja errand handled by verified local Taskers.',
      }}
      tasks={[
        {
          icon: shop,
          title: 'Abuja Market & Grocery Runs',
          desc: 'Wuse Market, Garki Market, Jabi Lake Mall, Transcorp Hilton area errands, Next Supermarket. Your Tasker shops your list and delivers with receipts.',
        },
        {
          icon: clock,
          title: 'Queue at NIS Passport Office, NIMC & FRSC Abuja',
          desc: 'Skip long Abuja government queues. Send a Tasker to NIS Zone 3 passport office, NIMC Abuja, FRSC FCT Command, JAMB Abuja, or any federal agency.',
        },
        {
          icon: activity,
          title: 'FIRS, CAC, FCTA & Federal Agency Runs',
          desc: 'Pay FIRS taxes, file at CAC headquarters, handle FCTA, NITDA, or any Abuja ministry/agency errand, without spending your workday in waiting rooms.',
        },
        {
          icon: file,
          title: 'Document Pickup & Courier (Abuja FCT)',
          desc: 'Same-day document delivery across Abuja FCT, Maitama to Kubwa. Certificates, contracts, NIN slips, court papers handled securely.',
        },
        {
          icon: map,
          title: 'AEDC Payments & Utility Bills Abuja',
          desc: 'Physical payment of AEDC electricity bills, water board, cable TV, rent, school fees at any agent across Abuja.',
        },
        {
          icon: users,
          title: 'Personal Shopping in Abuja',
          desc: 'Buy and deliver gifts, clothing, electronics, or groceries from Jabi Lake Mall, Ceddi Plaza, Silverbird Galleria, or any Abuja store.',
        },
        {
          icon: bag,
          title: 'Pharmacy Pickups Across Abuja',
          desc: 'Collect prescriptions from HealthPlus, MedPlus, or neighbourhood pharmacies across Wuse 2, Maitama, Gwarinpa, and all FCT districts.',
        },
        {
          icon: star,
          title: 'Corporate Office Errands (Maitama & Wuse 2)',
          desc: 'Regular banking, inter-office deliveries, and field errands for businesses in Maitama, Wuse 2, Asokoro, and other Abuja corporate districts.',
        },
      ]}
      useCases={[
        {
          icon: shop,
          title: 'Civil Servants & Embassy Staff in Abuja',
          desc: 'Federal government workers, embassy staff, and NGO professionals who cannot leave Maitama, Wuse, or Asokoro offices for personal errands during the day.',
        },
        {
          icon: clock,
          title: 'Avoiding Abuja Government Office Queues',
          desc: 'Send a Tasker to NIS Zone 3 passport office, NIMC Abuja headquarters, FRSC FCT Command, FIRS Abuja, or CAC, and get photo proof of every step.',
        },
        {
          icon: file,
          title: 'Gwarinpa & Kubwa Residents',
          desc: 'Satellite town residents who need errands run in central Abuja, or vice versa, without navigating long distances across FCT.',
        },
        {
          icon: map,
          title: 'New Abuja Arrivals | Corpers & Transfers',
          desc: 'Corpers on NYSC in Abuja, newly posted civil servants, or relocated families who need a trusted local Tasker to navigate FCT government systems.',
        },
        {
          icon: users,
          title: 'Elderly Residents in Abuja',
          desc: 'Family members arranging errand support for elderly parents in Garki, Wuse, or Gwarinpa: prescriptions, bills, agency visits handled with care.',
        },
        {
          icon: activity,
          title: 'Diaspora Nigerians with Abuja Property or Family',
          desc: "Nigerians abroad who need a reliable on-the-ground Tasker to manage property checks, family errands, or government filings in Abuja FCT.",
        },
      ]}
      faqs={[
        {
          q: "Which Abuja areas does Taskeeu cover for errand services?",
          a: "Taskeeu has active Taskers across all FCT districts: Maitama, Wuse 2, Wuse 1, Garki Area 1-11, Gwarinpa, Asokoro, Jabi, Utako, Lugbe, Kubwa, Karu, Nyanya, Galadimawa, and surrounding satellite towns. Post your task and local Abuja Taskers near you will bid.",
        },
        {
          q: "Can a Tasker queue at the NIS passport office or NIMC Abuja for me?",
          a: "Yes. Government office queuing is one of the top errand requests in Abuja. Your Tasker attends the specific office (NIS Zone 3, NIMC Garki, FRSC FCT Command, etc.) in person and provides photo/video updates throughout. Describe the exact office, what you need, and any forms or documents required.",
        },
        {
          q: "How much does an Abuja errand runner cost?",
          a: "You set your budget when posting. Taskers bid competitively. A grocery run in Wuse or Maitama typically costs ₦2,000 to ₦5,000. Government office queuing in Abuja ranges from ₦3,500 to ₦10,000 depending on the office and expected wait time. You always approve the price before anything is charged.",
        },
        {
          q: "How are Abuja Taskers verified?",
          a: "Every Tasker is identity-verified using NIN or BVN before accepting any task. You can see their verified badge, full profile, star rating, and previous task history. Your payment is secured in escrow and only released when you confirm the errand is complete to your satisfaction.",
        },
      ]}
      relatedLinks={[
        { label: 'All Nigeria Errands', href: '/errands' },
        { label: 'Errand Service Lagos', href: '/errands/lagos' },
        { label: 'Delivery Service', href: '/delivery' },
        { label: 'Document Pickup', href: '/document-pickup' },
        { label: 'Taskeeu for Teams', href: '/teams' },
      ]}
    />
  );
}
