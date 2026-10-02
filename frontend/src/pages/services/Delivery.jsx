import ServiceLanding from '../../components/ui/ServiceLanding';

const pkg = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const truck = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const clock = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const shield = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const repeat = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>;
const shop = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>;
const building = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18"/><path d="M3 9h6"/><path d="M3 15h6"/><path d="M15 9h3"/><path d="M15 15h3"/><path d="M15 12h3"/></svg>;
const brief = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;

export default function Delivery() {
  return (
    <ServiceLanding
      seo={{
        slug: '/delivery',
        title: 'Same-Day Delivery Service in Lagos, Abuja & Nigeria',
        description: 'Hire a verified delivery Tasker in Lagos, Abuja, Port Harcourt, Ibadan and 36 states. Same-day package delivery, courier runs, and last-mile logistics. Post your task now on Taskeeu.',
        keywords: 'delivery service Lagos, courier service Nigeria, same day delivery Lagos, dispatch rider Lagos, package delivery Abuja, send parcel Nigeria, last mile delivery, errand delivery Lagos, okada delivery Lagos, bike courier Nigeria',
      }}
      hero={{
        badge: 'Delivery Service: Available Nationwide',
        headline: 'Reliable Delivery & Courier Service Across Nigeria',
        subheadline: 'Need to send a package, document, or item across Lagos or any Nigerian city? Hire a verified Taskeeu delivery Tasker, fast, tracked, and secure.',
        tasksHeading: 'Delivery Tasks We Handle',
        tasksSubheading: 'Thousands of Nigerians trust Taskeeu for these delivery jobs daily.',
      }}
      tasks={[
        { icon: pkg, title: 'Same-Day Package Delivery', desc: 'Send parcels within your city on the same day, fully tracked.' },
        { icon: truck, title: 'Inter-State Delivery', desc: 'Move items between cities, Lagos to Abuja, PH to Warri, and more.' },
        { icon: shop, title: 'Market & Shop Pickup', desc: 'Buy items from Balogun, Computer Village, or any market and deliver.' },
        { icon: clock, title: 'Express Urgent Delivery', desc: 'Need it there in 2 hours? Post as urgent for priority matching.' },
        { icon: map, title: 'Last-Mile Logistics', desc: 'Final-leg delivery from your depot or store to your customer.' },
        { icon: repeat, title: 'Recurring Delivery Schedule', desc: 'Set up weekly or daily delivery routes for your business.' },
        { icon: brief, title: 'Corporate Courier Runs', desc: 'Office-to-office, bank-to-office, or multi-stop business deliveries.' },
        { icon: building, title: 'Estate & Apartment Drop-off', desc: 'Deliveries to gated estates, Lekki Phase 1, VI, Maitama, and beyond.' },
      ]}
      useCases={[
        { icon: shield, title: 'E-commerce Fulfillment', desc: 'Online sellers on Instagram, Jumia, or Jiji who need reliable last-mile delivery to customers across Lagos and Abuja.' },
        { icon: pkg, title: 'Document Dispatch', desc: 'Law firms, banks, and agencies sending contracts, cheques, or legal papers across town urgently.' },
        { icon: shop, title: 'Grocery & Food Supplies', desc: 'Restaurants restocking ingredients from Mile 12 or Oyingbo market without leaving the kitchen.' },
        { icon: map, title: 'Return & Exchange Logistics', desc: 'Customers returning defective products to vendors or swapping items without the stress.' },
        { icon: clock, title: 'Pharmaceutical Supply Runs', desc: 'Pharmacies and hospitals needing urgent medication or supply pickups from distributors.' },
        { icon: building, title: 'Event Material Delivery', desc: 'Delivering brochures, decor items, or equipment to event venues across the city.' },
      ]}
      faqs={[
        { q: 'How quickly can I get a delivery Tasker in Lagos?', a: 'Most delivery tasks in Lagos, Abuja, and Port Harcourt receive their first bid within 15 to 30 minutes of posting. You choose from multiple verified Taskers.' },
        { q: 'What items can Taskeeu Taskers deliver?', a: 'Documents, packages, clothing, electronics, food items, market goods, and more. For fragile or oversized items, specify this clearly in your task description.' },
        { q: 'Is my package insured during delivery?', a: 'We recommend describing item value in your task. Our escrow payment system protects you financially: funds are released only when you confirm successful delivery.' },
        { q: 'Can I track my delivery in real time?', a: 'Yes. You can message your Tasker directly inside the Taskeeu app and request live updates at any point during the delivery.' },
        { q: 'How much does a delivery cost on Taskeeu?', a: 'Taskers submit their own competitive bids based on distance and item details. You set your budget and pick the offer that suits you best.' },
        { q: 'Can Taskeeu handle bulk or recurring deliveries for my business?', a: 'Yes. For businesses needing regular delivery runs, post recurring tasks or explore Taskeeu for Teams for enterprise-level logistics management.' },
      ]}
      relatedLinks={[
        { label: 'Document Pickup', href: '/document-pickup' },
        { label: 'Errands', href: '/errands' },
        { label: 'Field Engineers', href: '/field-engineers' },
        { label: 'Business Support', href: '/business-support' },
      ]}
    />
  );
}
