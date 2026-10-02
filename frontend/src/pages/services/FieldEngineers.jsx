import ServiceLanding from '../../components/ui/ServiceLanding';

const tool = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>;
const wifi = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>;
const zap = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const sun = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const activity = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const search = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const building = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18"/><path d="M3 9h6"/><path d="M3 15h6"/><path d="M15 9h3"/><path d="M15 15h3"/><path d="M15 12h3"/></svg>;

export default function FieldEngineers() {
  return (
    <ServiceLanding
      seo={{
        slug: '/field-engineers',
        title: 'Hire Field Engineers & Technicians in Nigeria | Taskeeu',
        description: 'Deploy verified field engineers and technicians across Nigeria for internet installations, solar setup, CCTV, electrical work, and equipment servicing. Post a field task on Taskeeu today.',
        keywords: 'field engineer Nigeria, hire technician Lagos, internet installation Lagos, CCTV installation Nigeria, solar installation technician, electrical engineer Lagos, IT support field visit, equipment installation Nigeria, field operations Nigeria, field agent Lagos Abuja',
      }}
      hero={{
        badge: 'Field Engineers: Verified & Deployable Nationwide',
        headline: 'On-Demand Field Engineers & Technicians Across Nigeria',
        subheadline: 'Need a skilled technician for an internet installation, solar setup, CCTV, or on-site IT support? Hire a verified Taskeeu field engineer, dispatched to your location fast.',
        tasksHeading: 'Field Engineering Tasks',
        tasksSubheading: 'Businesses and homeowners across Nigeria rely on Taskeeu for technical field tasks.',
      }}
      tasks={[
        { icon: wifi, title: 'Internet & Router Installation', desc: 'Starlink, fiber optic, LTE router, and home network setup in any Nigerian city.' },
        { icon: sun, title: 'Solar System Installation', desc: 'Full solar panel, inverter, and battery system installation and commissioning.' },
        { icon: zap, title: 'Electrical Fault Fixing', desc: 'Diagnose and repair electrical faults, wiring, and panel issues safely.' },
        { icon: tool, title: 'CCTV & Security Systems', desc: 'Install, configure, and test CCTV cameras and security alarm systems.' },
        { icon: activity, title: 'Generator Servicing & Repair', desc: 'Scheduled maintenance, fault diagnosis, and repair of diesel/petrol generators.' },
        { icon: map, title: 'Network Infrastructure Surveys', desc: 'On-site survey and mapping for ISPs, telecom companies, and enterprises.' },
        { icon: search, title: 'Equipment Commissioning', desc: 'On-site testing, setup, and commissioning of machinery or IT equipment.' },
        { icon: building, title: 'Smart Home Device Setup', desc: 'Configure smart TVs, home automation, access control, and AV systems.' },
      ]}
      useCases={[
        { icon: wifi, title: 'ISPs & Telecom Companies', desc: 'Internet service providers deploying last-mile installation technicians to residential and commercial clients across multiple Nigerian cities simultaneously.' },
        { icon: sun, title: 'Solar Energy Companies', desc: 'Solar firms sending certified installation Taskers to customer premises for system setup, without maintaining a full-time city-by-city workforce.' },
        { icon: tool, title: 'Corporate IT Teams', desc: 'Companies needing on-site IT engineers for network cabling, workstation setup, or server room work at a remote office or branch.' },
        { icon: building, title: 'Real Estate Developers', desc: 'Developers equipping new buildings with electrical, CCTV, and smart home infrastructure using verified field engineers at scale.' },
        { icon: activity, title: 'Hospital & Healthcare Facilities', desc: 'Medical facilities needing specialized technicians for equipment maintenance, generator servicing, and building systems checks.' },
        { icon: map, title: 'Fintech & POS Deployment', desc: 'Fintech companies deploying POS terminals and agents across states using Taskeeu field engineers for installation and training.' },
      ]}
      faqs={[
        { q: 'Are Taskeeu field engineers certified or trained?', a: 'Taskers select the skills they are proficient in during registration. For technical tasks, you can specify the exact qualification required in your task description. Review each Tasker\'s profile, skills list, and rating before hiring.' },
        { q: 'Can I deploy field engineers to multiple cities at once?', a: 'Yes. Taskeeu has verified Taskers in Lagos, Abuja, Port Harcourt, Ibadan, Kano, Benin, and 30+ other cities. Post tasks in multiple locations simultaneously.' },
        { q: 'How do I verify that the field engineer completed the task correctly?', a: 'Taskers can upload photo and video proof of completion within the platform. You review the evidence before releasing payment from escrow.' },
        { q: 'What if the field engineer causes damage during the task?', a: 'Include your liability requirements in the task description. Our dispute resolution team handles issues if completion evidence does not match what was agreed.' },
        { q: 'Can Taskeeu support large-scale enterprise field deployments?', a: 'Yes. Taskeeu for Teams provides structured deployment management for businesses with recurring or high-volume field engineering tasks. Visit /teams for more.' },
        { q: 'How long does it take to match a field engineering task?', a: 'Most technical tasks in major Nigerian cities are matched within 1 to 4 hours. Highly specialized tasks may take longer depending on availability in the area.' },
      ]}
      relatedLinks={[
        { label: 'Installations', href: '/installations' },
        { label: 'Property Inspection', href: '/property-inspection' },
        { label: 'Asset Verification', href: '/asset-verification' },
        { label: 'Business Support', href: '/business-support' },
      ]}
    />
  );
}
