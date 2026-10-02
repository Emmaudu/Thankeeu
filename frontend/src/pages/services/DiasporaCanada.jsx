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

export default function DiasporaCanada() {
  return (
    <ServiceLanding
      seo={{
        slug: '/diaspora/canada',
        title: 'Errand Service for Nigerians in Canada | Run Errands in Nigeria From Anywhere',
        description:
          "Living in Canada? Taskeeu runs your errands in Nigeria while you're in Toronto, Calgary, Edmonton, Ottawa and across Canada. Send groceries to family, check on elderly parents, collect transcripts, pay bills, inspect property, done by identity-verified locals with photo proof and escrow protection.",
        keywords: 'errand service for Nigerians in Canada, errand service Nigeria from Canada, Nigerians in Toronto send errands home, run errands in Nigeria from Canada, help my parents in Nigeria from Canada, diaspora errand service Canada, send groceries to Nigeria from Canada, Canada Nigerian diaspora errand app',
        structuredData: makeLocalBusinessSchema({
          city: 'Nigeria',
          serviceType: 'Diaspora Errand Service',
          url: 'https://taskeeu.com/diaspora/canada',
        }),
      }}
      hero={{
        badge: 'For Nigerians in Canada: Canada-Based & Anywhere Else',
        headline: 'Your Trusted Hands and Feet in Nigeria, While You Live in Canada',
        subheadline:
          'Stop begging busy relatives or risking money with strangers. Post any errand from Toronto, Calgary, Edmonton, Ottawa and across Canada and an identity-verified Tasker in Nigeria handles it, with photo/video proof at every step and your money held in escrow until you confirm it was done right.',
        tasksHeading: 'Errands Nigerians in Canada Post Every Day',
        tasksSubheading:
          'From grocery drops for Mum in Surulere to transcript collection at UNILAG, verified locals handle it while you watch progress in real time from Canada.',
      }}
      tasks={[
        { icon: shop, title: 'Send Groceries & Food to Family in Nigeria', desc: 'A Tasker shops your exact list at Shoprite, Mile 12, or the local market and delivers to your parents\' door, with receipts and delivery photos sent to you in Canada.' },
        { icon: users, title: 'Check on Elderly Parents & Loved Ones', desc: 'Welfare visits, pharmacy pickups, hospital accompaniment, and prescription refills for elderly parents, with a full photo/video report after every visit.' },
        { icon: file, title: 'Transcript & Document Collection', desc: 'Collect academic transcripts from UNILAG, OAU, UI, ABU or any Nigerian institution, WAEC/NECO certificates, NYSC documents. Then courier or scan them to you in Canada.' },
        { icon: card, title: 'Bill Payments & Bank Errands', desc: 'Pay electricity, school fees, rent, and DSTV for family back home. Handle physical bank visits, account reactivation follow-ups, and BVN/NIN errands.' },
        { icon: home, title: 'Property Checks & Building Project Monitoring', desc: 'Is your building project real or a family story? Get independent site visits with timestamped photos and video, before you send the next tranche of money from Canada.' },
        { icon: heart, title: 'Gifts, Birthdays & Surprise Deliveries', desc: 'Cakes, flowers, gift hampers, and asoebi purchases delivered to loved ones in Lagos, Abuja, Port Harcourt and beyond, on the exact date that matters.' },
        { icon: clock, title: 'Government Office Queuing on Your Behalf', desc: 'NIMC, NIS passport office, FRSC, CAC, court registries: a Tasker queues in person, submits or collects your documents, and reports back with proof.' },
        { icon: map, title: 'Land & Market Price Verification', desc: 'Before you buy land or goods remotely from Canada, send a Tasker to physically verify the seller, location, and true market price, protecting you from long-distance scams.' },
      ]}
      useCases={[
        { icon: users, title: 'Nigerians Living in Toronto, Calgary, Edmonton, Ottawa and across Canada', desc: 'Professionals and students in Canada who need reliable, accountable help back home, without straining family relationships by asking for favours repeatedly.' },
        { icon: heart, title: 'Children of Elderly Parents in Nigeria', desc: 'Sons and daughters in Canada who want regular groceries, medications, and welfare checks delivered to ageing parents, with proof after every single visit.' },
        { icon: file, title: 'Students Needing Nigerian Documents', desc: 'Graduate school applicants in Canada who need transcripts, attestation letters, or certificates collected from Nigerian universities and couriered internationally.' },
        { icon: home, title: 'Diaspora Property Owners & Builders', desc: 'Anyone in Canada funding a building project or managing property in Nigeria from abroad who needs honest, independent eyes on the ground before sending money.' },
        { icon: card, title: 'People Burned by Unreliable Middlemen', desc: 'If a relative or "trusted person" has ever mismanaged your money, Taskeeu\'s escrow means funds are only released after you see proof the job was done.' },
        { icon: shop, title: 'Canada-Based Business Owners', desc: 'Owners restocking a family shop, paying suppliers, or coordinating deliveries in Nigeria while running their lives in Canada.' },
      ]}
      faqs={[
        { q: 'How do I pay for errands in Nigeria from Canada?', a: 'You pay in Naira directly from your Canadian card or bank through our secure payment gateway. Your money sits in escrow. The Tasker is only paid after you confirm the errand was completed correctly, with proof.' },
        { q: 'What about the time difference between Canada and Nigeria?', a: 'Canada runs several hours behind Nigeria. Post your errand before bed and your Tasker in Nigeria is often already handling it while you sleep, with proof waiting when you wake up.' },
        { q: 'How do I know the errand was actually done?', a: 'Taskers send photo and video proof at every stage, receipts for purchases, delivery photos, timestamped site visits, and document scans. You track everything in real time from your dashboard, no matter your time zone.' },
        { q: 'Can someone check on my elderly parents regularly?', a: 'Yes. Many diaspora clients in Canada post weekly or monthly recurring tasks: grocery drops, pharmacy refills, and welfare visits. Once you find a Tasker you trust, you can rehire them directly for consistency your parents will appreciate.' },
        { q: 'Is Taskeeu safer than sending money to a relative or agent?', a: 'With relatives and informal agents, you have no recourse if money is misused. On Taskeeu every Tasker is identity-verified with NIN or BVN, has a public rating history, and your payment is escrow-protected, released only when you approve the completed work.' },
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
