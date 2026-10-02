import ServiceLanding from '../../components/ui/ServiceLanding';

const tag = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const bar = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const camera = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const activity = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const grid = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const star = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const users = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;

export default function Merchandising() {
  return (
    <ServiceLanding
      seo={{
        slug: '/merchandising',
        title: 'Merchandising & Trade Marketing Field Agents Nigeria | Taskeeu',
        description: 'Deploy verified merchandising and trade marketing field agents across Nigeria for shelf management, POSM placement, retail audits, price checks, and product visibility campaigns. Use Taskeeu.',
        keywords: 'merchandising Nigeria, field merchandiser Lagos, trade marketing Nigeria, shelf management Nigeria, POSM placement Nigeria, retail audit Nigeria, price check field agent, product visibility Nigeria, market activations Nigeria, brand promoter Nigeria FMCG',
      }}
      hero={{
        badge: 'Merchandising & Trade Marketing: Deploy Nationwide',
        headline: 'On-Demand Merchandising & Field Trade Marketing Agents in Nigeria',
        subheadline: 'Deploy verified merchandising agents to any retail store, pharmacy, supermarket, or outlet across Nigeria for shelf management, POSM placement, audits, and product visibility.',
        tasksHeading: 'Merchandising & Trade Marketing Tasks',
        tasksSubheading: 'FMCG brands, distributors, and marketing agencies deploy merchandising Taskers on Taskeeu.',
      }}
      tasks={[
        { icon: grid, title: 'Shelf Stacking & Planogram', desc: 'Set up and maintain shelf planograms to ensure brand visibility and correct product placement.' },
        { icon: tag, title: 'POSM Placement & Branding', desc: 'Install shelf wobblers, hangtags, shelf strips, posters, and other point-of-sale materials.' },
        { icon: bar, title: 'Retail Price Checks', desc: 'Visit retail stores and pharmacies to record competitor and own-brand pricing across outlets.' },
        { icon: camera, title: 'Outlet Compliance Photos', desc: 'Geo-tagged photos of shelf displays, branding, and store compliance for brand teams.' },
        { icon: map, title: 'Route-to-Market Coverage', desc: 'Visit trade channels on defined routes: open markets, supermarkets, pharmacies, and wholesalers.' },
        { icon: activity, title: 'Brand Activation Support', desc: 'Assist with in-store activations, sampling events, and product launch rollouts.' },
        { icon: star, title: 'Competitor Intelligence', desc: 'Observe and report competitor promotions, pricing, and shelf presence at retail outlets.' },
        { icon: users, title: 'Promoter & Trade Support', desc: 'Deploy brand promoters and trade reps for product sampling and retailer engagement.' },
      ]}
      useCases={[
        { icon: grid, title: 'FMCG Companies', desc: 'Food, beverage, personal care, and household product companies managing shelf presence across thousands of retail outlets in Lagos, Kano, PHC, and Ibadan.' },
        { icon: tag, title: 'Pharma Manufacturers', desc: 'Pharmaceutical and consumer health brands ensuring product visibility and correct pricing in pharmacies and patent medicine stores nationwide.' },
        { icon: bar, title: 'Distributors & Wholesalers', desc: 'Distribution companies conducting weekly sell-in and sell-out tracking visits to retail partners across their assigned territories.' },
        { icon: camera, title: 'Brand & Marketing Agencies', desc: 'Agencies managing trade marketing campaigns for multiple brand clients, deploying and monitoring POSM across retail chains.' },
        { icon: map, title: 'Modern Trade Operators', desc: 'Supermarket chains and modern trade operators conducting store compliance checks to ensure product placement standards are met.' },
        { icon: activity, title: 'New Product Launch Teams', desc: 'Marketing teams rolling out new SKU launches with in-store placement support and first-week visibility tracking in target cities.' },
      ]}
      faqs={[
        { q: 'Can Taskeeu deploy merchandising agents to multiple cities simultaneously?', a: 'Yes. Taskeeu has verified field Taskers in Lagos, Abuja, Port Harcourt, Kano, Ibadan, Benin, Enugu, and 30+ other cities. Post parallel tasks across cities on the same day.' },
        { q: 'How does Taskeeu ensure merchandising agents are actually visiting the right outlets?', a: 'Taskers submit geo-tagged photos with timestamps directly from the store location. You see exactly where and when the visit happened.' },
        { q: 'Can I brief the merchandising Tasker with my brand guidelines?', a: 'Yes. Attach your brand guidelines, planogram images, or compliance checklist when posting the task. Taskers must review and agree before accepting.' },
        { q: 'What is the typical cost of a merchandising visit on Taskeeu?', a: 'Costs depend on route complexity and number of outlets. Post your task with the number of outlets and cities, and receive competitive bids from experienced trade field agents.' },
        { q: 'Can Taskeeu support ongoing weekly merchandising routes?', a: 'Yes. For recurring route coverage, use Taskeeu for Teams which provides structured deployment dashboards, task scheduling, and team performance reporting.' },
        { q: 'Do merchandising Taskers have experience with FMCG brands?', a: 'Many Taskeeu trade marketing Taskers have previous FMCG, distribution, or promotions experience. Check profiles for relevant work history before selecting.' },
      ]}
      relatedLinks={[
        { label: 'Asset Verification', href: '/asset-verification' },
        { label: 'Field Engineers', href: '/field-engineers' },
        { label: 'Business Support', href: '/business-support' },
        { label: 'Office Support', href: '/office-support' },
      ]}
    />
  );
}
