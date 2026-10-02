import ServiceLanding from '../../components/ui/ServiceLanding';

const file = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const truck = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const shield = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const clock = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const building = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18"/><path d="M3 9h6"/><path d="M3 15h6"/><path d="M15 9h3"/><path d="M15 15h3"/><path d="M15 12h3"/></svg>;
const check = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;
const activity = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;

export default function DocumentPickup() {
  return (
    <ServiceLanding
      seo={{
        slug: '/document-pickup',
        title: 'Document Pickup & Delivery Service in Nigeria | Taskeeu',
        description: 'Hire a trusted Taskeeu runner to collect and deliver documents in Lagos, Abuja, Port Harcourt. Legal documents, bank instruments, passports, certificates, and business papers, same day pickup.',
        keywords: 'document pickup Lagos, document delivery Nigeria, legal document courier Lagos, passport collection Nigeria, document runner Lagos, courier documents Abuja, collect document on my behalf Nigeria, document dispatch rider Lagos, collect cheque Nigeria, official document delivery',
      }}
      hero={{
        badge: 'Document Pickup & Delivery: Same Day',
        headline: 'Fast & Trusted Document Pickup and Delivery in Nigeria',
        subheadline: 'Send a verified Taskeeu runner to collect or deliver any document: legal papers, bank instruments, certificates, passports, and official letters, across any Nigerian city.',
        tasksHeading: 'Document Tasks We Handle',
        tasksSubheading: 'Law firms, banks, businesses, and individuals across Nigeria use Taskeeu for document runs daily.',
      }}
      tasks={[
        { icon: file, title: 'Legal Document Pickup', desc: 'Collect contracts, affidavits, court papers, and legal instruments from law offices.' },
        { icon: building, title: 'Bank Document Collection', desc: 'Collect cheques, bank drafts, reference letters, and account statements from banks.' },
        { icon: clock, title: 'Express Urgent Document Run', desc: 'Same-hour urgent document pickup and delivery when time is critical.' },
        { icon: shield, title: 'Government Office Document Runs', desc: 'Collect certificates, certificates of incorporation, tax clearance, and NHIS documents.' },
        { icon: map, title: 'Multi-Stop Document Delivery', desc: 'Deliver documents to multiple locations across town in a single trip.' },
        { icon: truck, title: 'Courier Pickup for Shipping', desc: 'Drop off documents at DHL, FedEx, UPS, or Nigerian courier offices for dispatch.' },
        { icon: check, title: 'Passport & Certificate Collection', desc: 'Pick up your passport, WAEC certificate, or degree certificate from issuing offices.' },
        { icon: activity, title: 'Business Mail & Correspondence', desc: 'Handle outgoing and incoming business mail, letters, and official correspondence.' },
      ]}
      useCases={[
        { icon: file, title: 'Law Firms & Solicitors', desc: 'Legal practices sending runners to court registries, client offices, and government agencies with urgent court filings and legal papers.' },
        { icon: building, title: 'Corporate Finance Teams', desc: 'Finance departments collecting payment documents, approved invoices, and bank instruments from multiple vendors across Lagos or Abuja.' },
        { icon: clock, title: 'Visa & Immigration Agencies', desc: 'Travel agencies collecting passports, visas, and documentation from embassies and immigration offices on behalf of clients.' },
        { icon: shield, title: 'HR & Recruitment Firms', desc: 'HR teams collecting signed offer letters, employment contracts, and certificates from new hires across multiple locations.' },
        { icon: map, title: 'Logistics & Supply Chain Companies', desc: 'Freight companies handling waybills, customs documentation, and shipping papers between offices, ports, and depots.' },
        { icon: activity, title: 'Medical & Healthcare Facilities', desc: 'Hospitals and labs sending test results, referral letters, and prescription orders to other healthcare facilities.' },
      ]}
      faqs={[
        { q: 'How do I know my document is safe with a Taskeeu runner?', a: 'All Taskeeu Taskers are identity-verified. You can view the Tasker\'s profile, previous ratings, and track their progress in real time. For highly sensitive documents, request a Tasker with KYC verification.' },
        { q: 'Can I get a same-hour document pickup in Lagos?', a: 'Yes. Post as an urgent task. Most urgent document runs in Lagos, Abuja, and Port Harcourt are matched within 15 to 45 minutes.' },
        { q: 'How do I confirm the document was delivered?', a: 'Request that the Tasker photograph and upload proof of delivery. Payment is held in escrow until you confirm the delivery was completed successfully.' },
        { q: 'Can I hire a document runner for multi-stop deliveries?', a: 'Yes. Describe all collection and delivery points in your task posting. Taskers will bid based on the total route, and you pay one consolidated amount.' },
        { q: 'What if the Tasker loses or damages the document?', a: 'This is handled through our dispute resolution process. We recommend noting the value and sensitivity of documents in your task description so both parties are aware.' },
        { q: 'Can I set up recurring document runs for my business?', a: 'Yes. Post recurring tasks or explore Taskeeu for Teams for structured, enterprise-level document logistics management.' },
      ]}
      relatedLinks={[
        { label: 'Delivery Service', href: '/delivery' },
        { label: 'Errands', href: '/errands' },
        { label: 'Office Support', href: '/office-support' },
        { label: 'Business Support', href: '/business-support' },
      ]}
    />
  );
}
