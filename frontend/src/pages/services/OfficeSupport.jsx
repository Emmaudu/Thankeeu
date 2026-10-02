import ServiceLanding from '../../components/ui/ServiceLanding';

const brief = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;
const users = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const file = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const clipboard = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const star = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const activity = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const inbox = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>;

export default function OfficeSupport() {
  return (
    <ServiceLanding
      seo={{
        slug: '/office-support',
        title: 'Office Support Staff | On-Demand Admin & Office Help in Nigeria',
        description: 'Hire verified office support staff in Lagos, Abuja, Port Harcourt for administrative tasks, data entry, filing, reception cover, meeting support, and general office assistance. Post on Taskeeu.',
        keywords: 'office support Nigeria, admin assistant Lagos, temporary office staff Lagos, data entry Nigeria, office helper Abuja, reception cover Lagos, virtual assistant Nigeria, office cleaner Lagos, office assistant job Nigeria, temporary worker Lagos',
      }}
      hero={{
        badge: 'Office Support: Lagos, Abuja & All Major Cities',
        headline: 'On-Demand Office Support Staff for Your Business',
        subheadline: 'Need an extra pair of hands at the office? Hire verified Taskeeu office support staff for admin work, data entry, filing, event day support, and more. No long-term contracts.',
        tasksHeading: 'Office Support Tasks We Cover',
        tasksSubheading: 'Businesses and professionals across Nigeria use Taskeeu for flexible office help.',
      }}
      tasks={[
        { icon: clipboard, title: 'Data Entry & Filing', desc: 'Accurate data entry, document filing, and spreadsheet management.' },
        { icon: file, title: 'Document Sorting & Archiving', desc: 'Organize physical or digital records, contracts, and business files.' },
        { icon: users, title: 'Reception & Front Desk Cover', desc: 'Professional reception cover for busy periods or staff absences.' },
        { icon: brief, title: 'Meeting Room Setup', desc: 'Prepare meeting rooms, set up presentation equipment, and manage logistics.' },
        { icon: inbox, title: 'Mailroom & Courier Management', desc: 'Receive, sort, and distribute incoming mail, parcels, and deliveries.' },
        { icon: activity, title: 'Inventory & Stock Count', desc: 'Manual count and record of office supplies, stationery, or product stock.' },
        { icon: map, title: 'Event Day Support Staff', desc: 'Additional hands for conferences, corporate events, and product launches.' },
        { icon: star, title: 'Ad Hoc Office Assistance', desc: 'General office tasks: printing, scanning, photocopying, errands, and more.' },
      ]}
      useCases={[
        { icon: users, title: 'SME Offices', desc: 'Small businesses in Lagos and Abuja needing extra admin help during peak periods without the commitment of a full-time hire.' },
        { icon: brief, title: 'Law Firms & Consulting Firms', desc: 'Professional services firms needing document assistants and filing support during quarterly filings or audit periods.' },
        { icon: file, title: 'Startup Companies', desc: 'Tech and fintech startups that need a few hands for office setup, data migration, or one-off administrative projects.' },
        { icon: activity, title: 'Event Management Companies', desc: 'Event agencies deploying office support staff at conference centers, hotels, and corporate event venues on event days.' },
        { icon: clipboard, title: 'NGOs & Government Agencies', desc: 'Organizations needing data entry assistants for surveys, registration drives, or documentation projects.' },
        { icon: inbox, title: 'Real Estate Offices', desc: 'Property firms needing front-desk cover, document sorting, and filing support during developer launches or property expos.' },
      ]}
      faqs={[
        { q: 'Can I hire office support staff for just one day?', a: 'Yes. Taskeeu is designed for flexible, on-demand hiring. You can post a task for a single day, a week, or a defined project period.' },
        { q: 'Are office support Taskers vetted or background-checked?', a: 'All Taskeeu Taskers are identity-verified before they can accept tasks. For sensitive office environments, you can request additional vetting details in your task description.' },
        { q: 'How much does hiring an office support Tasker cost?', a: 'You set your budget. Taskers bid competitively. Day rates for office support typically range from ₦8,000 to ₦25,000 depending on the scope of work and location.' },
        { q: 'Can I hire the same office Tasker on a recurring basis?', a: 'Yes. If you are satisfied with a Tasker, you can post recurring tasks and request the same Tasker. For structured team-level support, explore Taskeeu for Teams.' },
        { q: 'What if the office support Tasker is not professional or does not show up?', a: 'Payment is held in escrow until you confirm satisfactory work. A no-show or unprofessional behavior can be disputed and refunded through our support team.' },
        { q: 'Can Taskeeu provide NDA-signed office support for confidential work?', a: 'You can include NDA requirements in your task description. Taskers can agree to your terms before accepting the task. For enterprise-level confidentiality agreements, contact support@taskeeu.com.' },
      ]}
      relatedLinks={[
        { label: 'Business Support', href: '/business-support' },
        { label: 'Errands', href: '/errands' },
        { label: 'Merchandising', href: '/merchandising' },
        { label: 'Document Pickup', href: '/document-pickup' },
      ]}
    />
  );
}
