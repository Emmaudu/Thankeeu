import ServiceLanding from '../../components/ui/ServiceLanding';

const brief = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;
const activity = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const shield = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const users = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const bar = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const search = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const zap = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;

export default function BusinessSupport() {
  return (
    <ServiceLanding
      seo={{
        slug: '/business-support',
        title: 'Business Support Services in Nigeria | Field Operations & Admin Help',
        description: 'Outsource business operations to verified Taskeeu field agents in Nigeria. Field research, competitor analysis, customer surveys, office support, document runs, and operational field tasks. Post on Taskeeu.',
        keywords: 'business support Nigeria, outsource field operations Lagos, business process outsourcing Nigeria, field research Nigeria, market survey Nigeria, operational support Lagos, outsource admin Nigeria, business task outsourcing, field operations management Nigeria, enterprise support Nigeria',
      }}
      hero={{
        badge: 'Business Support: Scalable Operations Across Nigeria',
        headline: 'Outsource Your Business Field Operations Across Nigeria',
        subheadline: 'From field research and competitor analysis to customer surveys and operational support. Taskeeu gives your business a scalable force of verified field agents without the overhead.',
        tasksHeading: 'Business Support Tasks',
        tasksSubheading: 'Nigerian businesses and international companies operating in Nigeria use Taskeeu for field operations.',
      }}
      tasks={[
        { icon: search, title: 'Market & Competitor Research', desc: 'Deploy field agents to gather pricing data, competitor intelligence, and market insights.' },
        { icon: users, title: 'Customer Surveys & Interviews', desc: 'Conduct face-to-face surveys, questionnaires, and structured interviews at target locations.' },
        { icon: map, title: 'Branch & Outlet Site Visits', desc: 'Visit business locations, franchises, and partner outlets for compliance and operational checks.' },
        { icon: brief, title: 'Business Registration Runs', desc: 'Handle CAC filings, SCUML registration, NAFDAC, SON, or other regulatory agency submissions.' },
        { icon: activity, title: 'Vendor & Supplier Verification', desc: 'On-site visit to verify a new vendor, supplier, or business partner\'s premises and operations.' },
        { icon: bar, title: 'Sales & Distribution Tracking', desc: 'Field reporting on product availability, stock-out situations, and distributor performance.' },
        { icon: shield, title: 'KYC & Address Verification', desc: 'Physical address verification for onboarding new customers, agents, or business partners.' },
        { icon: zap, title: 'Event & Roadshow Support', desc: 'Deploy ground-level support staff for business roadshows, brand activations, and corporate events.' },
      ]}
      useCases={[
        { icon: search, title: 'Fintech & Banking', desc: 'Financial institutions deploying KYC field agents to verify customer addresses, business premises, and collateral across multiple Nigerian states.' },
        { icon: users, title: 'Research & Consulting Firms', desc: 'Management consultancies and research agencies deploying field interviewers for primary data collection across urban and semi-urban communities.' },
        { icon: map, title: 'International Companies Entering Nigeria', desc: 'Foreign companies expanding into Nigeria who need a trusted local operations partner for market entry research, vendor vetting, and office support.' },
        { icon: activity, title: 'NGOs & Development Agencies', desc: 'Non-profits and development organizations deploying community-level data collectors, monitors, and field coordinators for programs across Nigeria.' },
        { icon: brief, title: 'E-commerce Platforms', desc: 'Online marketplaces conducting seller verification visits, delivery partner checks, and warehouse audits across Lagos, Abuja, and Port Harcourt.' },
        { icon: bar, title: 'Logistics & Supply Chain Firms', desc: 'Supply chain companies monitoring depot operations, conducting stock reconciliations, and managing field-level distribution compliance.' },
      ]}
      faqs={[
        { q: 'How is Taskeeu different from a traditional BPO or outsourcing firm?', a: 'Taskeeu is faster, more flexible, and lower cost. Post a task today and have a verified field agent working on it within hours. No long-term contracts, no onboarding delays, no HR overhead.' },
        { q: 'Can Taskeeu deploy field agents across all Nigerian states?', a: 'Taskeeu has active Taskers in Lagos, Abuja, Port Harcourt, Kano, Ibadan, Enugu, Benin, Kaduna, Ilorin, and 30+ additional cities and states nationwide.' },
        { q: 'How do I ensure consistent quality across multiple agents working at once?', a: 'Taskeeu for Teams provides a management dashboard where you set task briefs, review submissions, and track agent performance across all active assignments.' },
        { q: 'Can I use Taskeeu for KYC address verification at scale?', a: 'Yes. Many fintech, insurance, and financial service companies use Taskeeu field agents for physical KYC verification. For volume deployments, use Taskeeu for Teams.' },
        { q: 'Is there an NDA or confidentiality option for sensitive business tasks?', a: 'For enterprise clients, confidentiality agreements can be included in task terms. Contact support@taskeeu.com to discuss enterprise-level data handling agreements.' },
        { q: 'What reporting do I get from business support tasks?', a: 'Field agents submit photo evidence, completion notes, and structured reports directly in the platform. For custom reporting formats, specify your requirements in the task brief.' },
      ]}
      relatedLinks={[
        { label: 'Field Engineers', href: '/field-engineers' },
        { label: 'Asset Verification', href: '/asset-verification' },
        { label: 'Merchandising', href: '/merchandising' },
        { label: 'Office Support', href: '/office-support' },
      ]}
    />
  );
}
