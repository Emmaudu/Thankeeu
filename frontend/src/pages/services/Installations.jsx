import ServiceLanding from '../../components/ui/ServiceLanding';

const sun = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const wifi = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>;
const tool = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>;
const zap = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const home = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const camera = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const layers = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
const activity = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;

export default function Installations() {
  return (
    <ServiceLanding
      seo={{
        slug: '/installations',
        title: 'Installation Service in Nigeria | Solar, AC, Internet, CCTV & More',
        description: 'Hire verified installation Taskers in Lagos, Abuja, Port Harcourt for solar panels, air conditioning, internet routers, CCTV cameras, inverters, and home appliances. Book on Taskeeu.',
        keywords: 'solar installation Nigeria, AC installation Lagos, CCTV installation Abuja, internet installation Lagos, inverter installation Nigeria, appliance installation Lagos, router installation Nigeria, smart TV installation Lagos, electrical installation Nigeria, hire installer Nigeria',
      }}
      hero={{
        badge: 'Installation Services: Nationwide',
        headline: 'Professional Equipment & Appliance Installation Across Nigeria',
        subheadline: 'From solar panels and AC units to internet routers and CCTV cameras. Hire a verified Taskeeu installer to set up any equipment at your home or office.',
        tasksHeading: 'Installation Tasks We Cover',
        tasksSubheading: 'Trusted by homeowners and businesses for reliable equipment installation across Nigeria.',
      }}
      tasks={[
        { icon: sun, title: 'Solar Panel & Inverter Installation', desc: 'Complete solar system installation including panels, inverter, battery, and wiring.' },
        { icon: wifi, title: 'Internet & Router Setup', desc: 'Starlink, fiber, LTE router, and home Wi-Fi network installation and configuration.' },
        { icon: camera, title: 'CCTV & Security Camera Setup', desc: 'Install and configure indoor/outdoor CCTV cameras with DVR and remote viewing.' },
        { icon: zap, title: 'Air Conditioning Installation', desc: 'Install split unit, window unit, and cassette ACs with proper piping and charging.' },
        { icon: tool, title: 'Generator Connection & Changeover', desc: 'Connect generator to house with changeover switch, safe wiring, and testing.' },
        { icon: home, title: 'Home Appliance Setup', desc: 'Install washing machines, dishwashers, water heaters, and kitchen appliances.' },
        { icon: layers, title: 'Ceiling Fan & Lighting Installation', desc: 'Mount ceiling fans, LED lighting, and smart bulbs in residential or office spaces.' },
        { icon: activity, title: 'TV Mounting & AV Setup', desc: 'Wall-mount flat-screen TVs, soundbars, projectors, and home cinema systems.' },
      ]}
      useCases={[
        { icon: sun, title: 'New Homeowners', desc: 'People who just moved into a new apartment in Lagos or Abuja and need multiple appliances and systems installed without coordinating different contractors.' },
        { icon: wifi, title: 'Remote Workers', desc: 'Professionals working from home who need reliable internet infrastructure: Starlink dish mounting, router configuration, and network optimization.' },
        { icon: camera, title: 'SME Business Owners', desc: 'Shop owners and offices needing CCTV systems installed for security without hiring a full-time security team.' },
        { icon: zap, title: 'Property Developers', desc: 'Developers finishing apartments and needing AC units, inverters, and lighting installed across multiple units quickly.' },
        { icon: tool, title: 'Landlords', desc: 'Landlords preparing rental units with generator connections, changovers, and standard appliance installations before new tenants move in.' },
        { icon: home, title: 'Corporate Offices', desc: 'Companies setting up new office spaces and needing structured cabling, AV systems, air conditioning, and security cameras installed professionally.' },
      ]}
      faqs={[
        { q: 'Do Taskeeu installation Taskers bring their own tools?', a: 'Most experienced Taskers come with basic tools. However, it is best to confirm in your task description whether you will provide materials, or if the Tasker should supply and charge separately for consumables.' },
        { q: 'Can I hire a Tasker for solar installation across multiple locations?', a: 'Yes. Post separate tasks for each location or use Taskeeu for Teams for structured multi-location deployment with the same Tasker pool.' },
        { q: 'What if the installation is done incorrectly?', a: 'Payment is held in escrow. Do not release payment until you have tested and confirmed everything works correctly. You can raise a dispute for resolution if needed.' },
        { q: 'Can I request a certified electrician for wiring work?', a: 'Specify your requirement for a certified electrician in the task description. Some Taskers hold COREN or electrical certifications. You can ask for proof before accepting a bid.' },
        { q: 'How quickly can an installer arrive in Lagos or Abuja?', a: 'Most installation tasks in Lagos, Abuja, and Port Harcourt are matched within 1 to 4 hours. Schedule for next-day or a specific time in your task description.' },
        { q: 'Can I get a warranty or follow-up from the installer?', a: 'You can negotiate warranty terms directly with the Tasker in their bid message. Include any follow-up service requirements in your original task posting.' },
      ]}
      relatedLinks={[
        { label: 'Field Engineers', href: '/field-engineers' },
        { label: 'Property Inspection', href: '/property-inspection' },
        { label: 'Office Support', href: '/office-support' },
        { label: 'Asset Verification', href: '/asset-verification' },
      ]}
    />
  );
}
