import ServiceLanding from '../../components/ui/ServiceLanding';

const search = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const camera = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const shield = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const clipboard = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const file = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const bar = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const building = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18"/><path d="M3 9h6"/><path d="M3 15h6"/><path d="M15 9h3"/><path d="M15 15h3"/><path d="M15 12h3"/></svg>;

export default function AssetVerification() {
  return (
    <ServiceLanding
      seo={{
        slug: '/asset-verification',
        title: 'Asset Verification Service in Nigeria | On-Site Checks & Reports',
        description: 'Hire Taskeeu field agents for asset verification in Lagos, Abuja, Port Harcourt and all Nigerian states. Verify vehicles, machinery, property, inventory, and business assets with photo evidence.',
        keywords: 'asset verification Nigeria, asset check Lagos, vehicle verification Nigeria, equipment verification Lagos, inventory verification Nigeria, field agent verification Lagos, collateral verification Nigeria, on-site asset check, asset inspection Abuja, asset audit Nigeria',
      }}
      hero={{
        badge: 'Asset Verification: Nationwide Field Agents',
        headline: 'On-Site Asset Verification Across All Nigerian States',
        subheadline: 'Need to verify the existence, condition, or ownership of an asset anywhere in Nigeria? Deploy a Taskeeu field agent for a GPS-timestamped, photo-backed verification report.',
        tasksHeading: 'Asset Verification Tasks',
        tasksSubheading: 'Banks, insurers, leasing companies, and investors rely on Taskeeu for trusted asset verification.',
      }}
      tasks={[
        { icon: search, title: 'Vehicle & Fleet Verification', desc: 'Verify vehicle existence, condition, and chassis/plate numbers with photo evidence.' },
        { icon: clipboard, title: 'Collateral Asset Checks', desc: 'Bank and lender collateral verification before loan disbursement, physical and documented.' },
        { icon: camera, title: 'Equipment Condition Reports', desc: 'On-site inspection and photographic documentation of machinery and equipment.' },
        { icon: bar, title: 'Inventory & Stock Audit', desc: 'Physical count and verification of goods in warehouses, depots, or retail stores.' },
        { icon: building, title: 'Business Premises Verification', desc: 'Confirm the physical existence and operation of a registered business address.' },
        { icon: map, title: 'Agricultural Asset Verification', desc: 'Verify farmland, crop conditions, livestock, and agricultural infrastructure.' },
        { icon: file, title: 'Post-Disbursement Asset Checks', desc: 'Follow-up verification to confirm assets financed by a loan still exist and are intact.' },
        { icon: shield, title: 'Insurance Asset Survey', desc: 'Pre- or post-claim asset surveys for insurance underwriting and claims processing.' },
      ]}
      useCases={[
        { icon: clipboard, title: 'Commercial Banks & Microfinance', desc: 'Nigerian banks verifying collateral assets, vehicles, property, and equipment, before approving SME and business loans.' },
        { icon: search, title: 'Vehicle Leasing Companies', desc: 'Leasing firms conducting periodic fleet checks to confirm vehicle existence and condition for asset-backed financing.' },
        { icon: bar, title: 'FMCG Distributors', desc: 'Distribution companies auditing stock levels at depot partners and retail distributors across multiple states simultaneously.' },
        { icon: building, title: 'Insurance Companies', desc: 'Underwriters verifying insured assets, commercial property, industrial equipment, and fleets, before policy issuance or claims settlement.' },
        { icon: camera, title: 'Agri-Finance Lenders', desc: 'Agricultural lenders verifying crop size, livestock numbers, and farm infrastructure for smallholder farmer loans.' },
        { icon: map, title: 'Private Equity & Investment Firms', desc: 'Investors conducting pre-acquisition due diligence on manufacturing assets, land banks, and infrastructure across Nigerian cities.' },
      ]}
      faqs={[
        { q: 'Does Taskeeu provide GPS-stamped photo evidence for asset verification?', a: 'Yes. Field agent Taskers can upload geotagged photos directly inside the Taskeeu platform. You receive a time-stamped record of every photo taken at the site.' },
        { q: 'How quickly can Taskeeu deploy a field agent for asset verification?', a: 'Most major Nigerian cities are covered. Asset verification tasks in Lagos, Abuja, Kano, PH, and Ibadan are typically matched within 1 to 4 hours.' },
        { q: 'Can I use Taskeeu for large-scale multi-location asset audits?', a: 'Yes. For enterprise-level deployments across multiple states, Taskeeu for Teams provides structured management dashboards, task assignment, and reporting tools.' },
        { q: 'What format do verification reports come in?', a: 'Field agents submit photo evidence, written notes, and completion confirmations within the platform. For formal written reports, specify this in your task description and agree the format with the Tasker.' },
        { q: 'Can I request a KYC-verified field agent for sensitive verifications?', a: 'Yes. Filter for KYC-verified Taskers when selecting from bids. Enterprise clients using Taskeeu for Teams get access to a dedicated certified field agent pool.' },
        { q: 'Is the verification data kept confidential?', a: 'Only you and the assigned Tasker have access to the evidence submitted. Enterprise clients can request NDA agreements with field agents as part of their task terms.' },
      ]}
      relatedLinks={[
        { label: 'Property Inspection', href: '/property-inspection' },
        { label: 'Field Engineers', href: '/field-engineers' },
        { label: 'Merchandising', href: '/merchandising' },
        { label: 'Business Support', href: '/business-support' },
      ]}
    />
  );
}
