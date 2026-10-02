import ServiceLanding from '../../components/ui/ServiceLanding';
import { makeLocalBusinessSchema } from '../../components/seo/SEO';

const shop = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>;
const clock = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const file = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const users = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const home = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const heart = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
const card = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;

export default function Diaspora() {
  return (
    <ServiceLanding
      seo={{
        slug: '/diaspora',
        title: 'Errand Service for Nigerians Abroad | Run Errands in Nigeria From Anywhere',
        description:
          "Living abroad? Taskeeu runs your errands in Nigeria while you're in the US, UK, Canada or anywhere. Send groceries to family, check on elderly parents, collect transcripts, pay bills, inspect property, done by identity-verified locals with photo proof and escrow protection.",
        keywords:
          'errand service for Nigerians abroad, run errands in Nigeria from abroad, ' +
          'send groceries to family in Nigeria, buy food for parents in Nigeria, ' +
          'check on elderly parents in Nigeria, someone to check on family in Nigeria, ' +
          'transcript collection Nigeria, collect transcript from Nigerian university, ' +
          'pay bills for family in Nigeria, property check Nigeria diaspora, ' +
          'diaspora errand service Nigeria, helpmewaka alternative, ' +
          'errand service Nigeria from USA, errand service Nigeria from UK, ' +
          'trusted person to run errands in Nigeria, verify property in Nigeria from abroad',
        structuredData: makeLocalBusinessSchema({
          city: 'Nigeria',
          serviceType: 'Diaspora Errand Service',
          url: 'https://taskeeu.com/diaspora',
        }),
      }}
      hero={{
        badge: 'For Nigerians in the USA · UK · Canada · Europe · Everywhere',
        headline: 'Your Trusted Hands and Feet in Nigeria, While You Live Abroad',
        subheadline:
          'Stop begging busy relatives or risking money with strangers. Post any errand from anywhere in the world and an identity-verified Tasker in Nigeria handles it, with photo/video proof at every step and your money held in escrow until you confirm it was done right.',
        tasksHeading: 'Errands Nigerians Abroad Post Every Day',
        tasksSubheading:
          'From grocery drops for Mum in Surulere to transcript collection at UNILAG, verified locals handle it while you watch progress in real time.',
      }}
      tasks={[
        {
          icon: shop,
          title: 'Send Groceries & Food to Family in Nigeria',
          desc: 'A Tasker shops your exact list at Shoprite, Mile 12, or the local market and delivers to your parents\' door, with receipts and delivery photos sent to you abroad.',
        },
        {
          icon: users,
          title: 'Check on Elderly Parents & Loved Ones',
          desc: 'Welfare visits, pharmacy pickups, hospital accompaniment, and prescription refills for elderly parents, with a full photo/video report after every visit.',
        },
        {
          icon: file,
          title: 'Transcript & Document Collection',
          desc: 'Collect academic transcripts from UNILAG, OAU, UI, ABU or any Nigerian institution, WAEC/NECO certificates, NYSC documents. Then courier or scan them to you abroad.',
        },
        {
          icon: card,
          title: 'Bill Payments & Bank Errands',
          desc: 'Pay NEPA/electricity, school fees, rent, and DSTV for family back home. Handle physical bank visits, account reactivation follow-ups, and BVN/NIN errands.',
        },
        {
          icon: home,
          title: 'Property Checks & Building Project Monitoring',
          desc: 'Is your building project real or a family story? Get independent site visits with timestamped photos and video, before you send the next tranche of money.',
        },
        {
          icon: heart,
          title: 'Gifts, Birthdays & Surprise Deliveries',
          desc: 'Cakes, flowers, gift hampers, and asoebi purchases delivered to loved ones in Lagos, Abuja, Port Harcourt and beyond, on the exact date that matters.',
        },
        {
          icon: clock,
          title: 'Government Office Queuing on Your Behalf',
          desc: 'NIMC, NIS passport office, FRSC, CAC, court registries: a Tasker queues in person, submits or collects your documents, and reports back with proof.',
        },
        {
          icon: map,
          title: 'Land & Market Price Verification',
          desc: 'Before you buy land or goods remotely, send a Tasker to physically verify the seller, location, and true market price, protecting you from long-distance scams.',
        },
      ]}
      useCases={[
        {
          icon: users,
          title: 'Nigerians in the USA, UK & Canada',
          desc: 'Professionals and students abroad who need reliable, accountable help back home, without straining family relationships by asking for favours repeatedly.',
        },
        {
          icon: heart,
          title: 'Children of Elderly Parents in Nigeria',
          desc: 'Sons and daughters abroad who want regular groceries, medications, and welfare checks delivered to ageing parents, with proof after every single visit.',
        },
        {
          icon: file,
          title: 'Students Needing Nigerian Documents',
          desc: 'Graduate school applicants abroad who need transcripts, attestation letters, or certificates collected from Nigerian universities and couriered internationally.',
        },
        {
          icon: home,
          title: 'Diaspora Property Owners & Builders',
          desc: 'Anyone funding a building project or managing property in Nigeria from abroad who needs honest, independent eyes on the ground before sending money.',
        },
        {
          icon: card,
          title: 'People Burned by Unreliable Middlemen',
          desc: 'If a relative or "trusted person" has ever mismanaged your money, Taskeeu\'s escrow means funds are only released after you see proof the job was done.',
        },
        {
          icon: shop,
          title: 'Diaspora Business Owners',
          desc: 'Owners restocking a family shop, paying suppliers, or coordinating deliveries in Nigeria while running their lives overseas.',
        },
      ]}
      faqs={[
        {
          q: 'How do I pay for errands in Nigeria from abroad?',
          a: 'You fund your task in Naira through our secure payment gateway using an international or Nigerian card. Your money sits in escrow. The Tasker is only paid after you confirm the errand was completed correctly, with proof.',
        },
        {
          q: 'How do I know the errand was actually done?',
          a: 'Taskers send photo and video proof at every stage, receipts for purchases, delivery photos, timestamped site visits, and document scans. You track everything in real time from your dashboard, no matter your time zone.',
        },
        {
          q: 'Can someone check on my elderly parents regularly?',
          a: 'Yes. Many diaspora clients post weekly or monthly recurring tasks: grocery drops, pharmacy refills, and welfare visits. Once you find a Tasker you trust, you can rehire them directly for consistency your parents will appreciate.',
        },
        {
          q: 'Can a Tasker collect my transcript from a Nigerian university?',
          a: 'Yes, transcript and certificate collection is one of the most common diaspora errands on Taskeeu. Describe the institution, department, and any reference numbers. The Tasker attends in person, follows up as needed, and can courier or scan documents to you abroad.',
        },
        {
          q: 'Is Taskeeu safer than sending money to a relative or agent?',
          a: 'With relatives and informal agents, you have no recourse if money is misused. On Taskeeu every Tasker is identity-verified with NIN or BVN, has a public rating history, and your payment is escrow-protected, released only when you approve the completed work.',
        },
        {
          q: 'Which Nigerian cities can you run errands in?',
          a: 'Lagos, Abuja, Port Harcourt, Ibadan, Kano, Enugu, Benin City and 30+ other cities. Post your errand with the exact location and verified Taskers in that area will bid within minutes.',
        },
      ]}
      relatedLinks={[
        { label: 'For Nigerians in the UK', href: '/diaspora/uk' },
        { label: 'For Nigerians in the USA', href: '/diaspora/usa' },
        { label: 'For Nigerians in Canada', href: '/diaspora/canada' },
        { label: 'All Nigeria Errands', href: '/errands' },
        { label: 'Grocery Shopping Service', href: '/grocery-shopping' },
        { label: 'Property Inspection', href: '/property-inspection' },
        { label: 'Document Pickup', href: '/document-pickup' },
        { label: 'Errand Service Lagos', href: '/errands/lagos' },
      ]}
    />
  );
}
