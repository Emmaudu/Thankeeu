import ServiceLanding from '../../components/ui/ServiceLanding';

const home = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const camera = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const shield = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const search = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const file = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const layers = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
const check = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;

export default function PropertyInspection() {
  return (
    <ServiceLanding
      seo={{
        slug: '/property-inspection',
        title: 'Property Inspection Service Nigeria | Verify Before You Buy or Rent',
        description: 'Hire a verified property inspector on Taskeeu to check any property in Lagos, Abuja, Port Harcourt before you buy or rent. Get photo/video reports, construction monitoring, and rental verification across Nigeria.',
        keywords: 'property inspection Nigeria, house inspection Lagos, property verification Nigeria, property inspection Abuja, rent inspection Lagos, buy property Lagos inspection, land verification Nigeria, construction monitoring Nigeria, property survey Lagos, rental inspection Abuja',
      }}
      hero={{
        badge: 'Property Inspection: All 36 States',
        headline: 'Verify Any Property in Nigeria Before You Pay',
        subheadline: 'Do not buy, rent, or pay for a property you have not seen. Hire a trusted Taskeeu inspector to visit and send you a full photo and video report, same day.',
        tasksHeading: 'Property Inspection Services',
        tasksSubheading: 'Used by home buyers, landlords, developers, and diaspora Nigerians to verify properties remotely.',
      }}
      tasks={[
        { icon: home, title: 'Pre-Purchase Inspection', desc: 'Inspect any residential or commercial property before finalizing a purchase.' },
        { icon: camera, title: 'Video Walkthrough', desc: 'Get a live or recorded video walkthrough of any property or land.' },
        { icon: layers, title: 'Construction Monitoring', desc: 'Regular site visits to verify construction progress on your building project.' },
        { icon: search, title: 'Rental Inspection', desc: 'Verify condition of a rental property before signing any agreement.' },
        { icon: map, title: 'Land Verification Visit', desc: 'Confirm the physical existence and condition of a land parcel you want to buy.' },
        { icon: file, title: 'Estate Development Checks', desc: 'Inspect estate developments, infrastructure, and road conditions before buying.' },
        { icon: shield, title: 'Diaspora Property Checks', desc: 'Nigerians abroad sending a trusted Tasker to verify their Nigeria property or investment.' },
        { icon: check, title: 'Tenant Move-In/Out Report', desc: 'Document property condition before a new tenant moves in or after they vacate.' },
      ]}
      useCases={[
        { icon: home, title: 'Diaspora Home Buyers', desc: 'Nigerians in the UK, USA, or Canada buying property back home remotely, getting a trusted Tasker to inspect before sending money.' },
        { icon: layers, title: 'Property Developers', desc: 'Developers monitoring multiple construction sites across Lagos, Ogun, and Abuja without physically visiting every site weekly.' },
        { icon: search, title: 'Prospective Tenants', desc: 'Individuals verifying a rental apartment in Lekki, Ajah, or Garki before paying rent to an agent they have not met in person.' },
        { icon: camera, title: 'Real Estate Agents', desc: 'Agents conducting initial virtual tour inspections for international or out-of-state clients before a physical visit.' },
        { icon: map, title: 'Land Investors', desc: 'Individuals verifying the size, boundaries, and neighborhood of a land property before purchase in new estates.' },
        { icon: file, title: 'Corporate Lease Verification', desc: 'Companies verifying office spaces in Abuja or Lagos before committing to a lease agreement.' },
      ]}
      faqs={[
        { q: 'What does a property inspection on Taskeeu include?', a: 'A standard inspection includes a physical visit to the property, clear photos of the interior and exterior, a written summary, and an optional video walkthrough. You can specify what you need in your task description.' },
        { q: 'Can I request a live video call during the inspection?', a: 'Yes. You can request a real-time WhatsApp video call or Zoom call with the Tasker during the inspection. Mention this requirement in your task posting.' },
        { q: 'How quickly can a Tasker visit a property in Lagos?', a: 'Most property inspection tasks in Lagos, Abuja, and Port Harcourt are matched within 1 to 4 hours. Same-day visits are often possible.' },
        { q: 'Is the Tasker qualified to do professional property inspections?', a: 'Taskeeu property inspection Taskers are local community members with knowledge of their neighborhoods. For technical structural surveys, we recommend specifying that you need a certified surveyor in your task description.' },
        { q: 'Can I use Taskeeu to monitor a building under construction?', a: 'Yes. Many clients post recurring monthly or weekly site visit tasks to track their construction projects. Taskers submit photo and progress reports after each visit.' },
        { q: 'What if the Tasker provides inaccurate inspection information?', a: 'Our escrow system protects you. Only release payment after reviewing the inspection report. You can also raise a dispute if the report does not match what was agreed.' },
      ]}
      relatedLinks={[
        { label: 'Asset Verification', href: '/asset-verification' },
        { label: 'Field Engineers', href: '/field-engineers' },
        { label: 'Installations', href: '/installations' },
        { label: 'Business Support', href: '/business-support' },
      ]}
    />
  );
}
