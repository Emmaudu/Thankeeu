import ServiceLanding from '../../components/ui/ServiceLanding';
import { makeLocalBusinessSchema } from '../../components/seo/SEO';

const shop = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>;
const clock = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const cart = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>;
const users = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const heart = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
const receipt = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const truck = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;

export default function GroceryShopping() {
  return (
    <ServiceLanding
      seo={{
        slug: '/grocery-shopping',
        title: 'Grocery Shopping Service in Nigeria | Hire a Personal Market Runner Today',
        description:
          "Grocery shopping and market runs across Nigeria. Hire a verified personal shopper to buy from Mile 12, Balogun, Wuse Market, Shoprite or any store in Lagos, Abuja & 30+ cities. Receipts, real-time updates & escrow payment protection on every run.",
        keywords:
          'grocery shopping service Nigeria, grocery shopping service Lagos, market runner Lagos, ' +
          'market runs Lagos, personal shopper Lagos, personal shopper Abuja, food shopping service Nigeria, ' +
          'Mile 12 market runner, Balogun market shopper, Wuse market runs Abuja, ' +
          'grocery delivery Lagos, foodstuff shopping Nigeria, hire someone to buy groceries Lagos, ' +
          'market woman shopper Lagos, bulk foodstuff shopping Nigeria, grocery errands Nigeria',
        structuredData: makeLocalBusinessSchema({
          city: 'Nigeria',
          serviceType: 'Grocery Shopping Service',
          url: 'https://taskeeu.com/grocery-shopping',
        }),
      }}
      hero={{
        badge: 'Grocery & Market Runs: Lagos · Abuja · PH · Ibadan · Kano & More',
        headline: 'Hire a Verified Personal Shopper for Groceries & Market Runs',
        subheadline:
          'Skip the traffic, the haggling, and the market stress. Post your shopping list and a verified Tasker buys exactly what you need, from Mile 12 to Shoprite, and delivers with receipts. Pay only when you\'re satisfied.',
        tasksHeading: 'Grocery & Shopping Tasks We Handle',
        tasksSubheading:
          'From weekly foodstuff runs to bulk party shopping. Every purchase comes with receipts and escrow protection.',
      }}
      tasks={[
        {
          icon: cart,
          title: 'Weekly Grocery & Foodstuff Runs',
          desc: 'Rice, beans, garri, yam, protein, vegetables. Your Tasker shops your list at the local market or supermarket and delivers on your schedule.',
        },
        {
          icon: shop,
          title: 'Open Market Shopping (Mile 12, Balogun, Wuse & More)',
          desc: 'Taskers who know the markets buy at true market prices, not "customer from abroad" prices, at Mile 12, Oyingbo, Balogun, Wuse, Garki, Mararaba, Oja Oba and beyond.',
        },
        {
          icon: truck,
          title: 'Supermarket Pickups & Delivery',
          desc: 'Shoprite, Spar, Hubmart, Justrite, Ebeano. Order exactly what you want and get same-day delivery to your home or office.',
        },
        {
          icon: heart,
          title: 'Grocery Deliveries to Family & Elderly Parents',
          desc: 'Send monthly foodstuff to parents or loved ones anywhere in Nigeria, with delivery photos so you know it arrived, even if you live abroad.',
        },
        {
          icon: users,
          title: 'Bulk Shopping for Parties, Owambe & Events',
          desc: 'Bulk foodstuff, drinks, coolers, souvenirs, and asoebi purchases handled end-to-end for weddings, burials, and celebrations.',
        },
        {
          icon: receipt,
          title: 'Price Checks & Receipts on Every Purchase',
          desc: 'Get photos of prices before purchase and itemised receipts after, total transparency on what your money bought.',
        },
        {
          icon: clock,
          title: 'Urgent Same-Day Shopping',
          desc: 'Forgot an ingredient? Guest coming tonight? Post an urgent run and nearby Taskers bid within minutes.',
        },
        {
          icon: map,
          title: 'Pharmacy & Baby Supplies Runs',
          desc: 'Prescriptions, baby food, diapers, and toiletries picked up alongside your groceries, one Tasker, one trip.',
        },
      ]}
      useCases={[
        {
          icon: clock,
          title: 'Busy Professionals',
          desc: 'Corporate workers in Lagos and Abuja who lose entire Saturdays to market runs, reclaim your weekend for ₦2,000 to ₦5,000 per run.',
        },
        {
          icon: heart,
          title: 'New & Nursing Mothers',
          desc: 'Mums who can\'t easily leave the house get groceries, baby supplies, and pharmacy items delivered without stress.',
        },
        {
          icon: users,
          title: 'Elderly Residents & Their Families',
          desc: 'Adult children arrange regular market runs for ageing parents, locally or from abroad, with delivery proof every time.',
        },
        {
          icon: map,
          title: 'Nigerians Abroad Feeding Family Back Home',
          desc: 'Diaspora Nigerians who send monthly foodstuff to family in Nigeria instead of sending cash that may be misused.',
        },
        {
          icon: shop,
          title: 'Restaurants & Food Businesses',
          desc: 'Food vendors and small chops businesses that need daily market supplies bought at true wholesale prices while they cook.',
        },
        {
          icon: cart,
          title: 'People Who Hate Market Wahala',
          desc: 'Anyone who would rather pay a small fee than face traffic, haggling, and carrying heavy bags under the sun.',
        },
      ]}
      faqs={[
        {
          q: 'How much does a grocery shopping service cost in Nigeria?',
          a: 'You set your own budget when posting. A typical supermarket or market run in Lagos or Abuja costs ₦2,000 to ₦5,000 in service fees plus the cost of items. Taskers bid competitively, so you choose the best offer. Item costs are documented with receipts.',
        },
        {
          q: 'How do I pay for the groceries themselves?',
          a: 'Include the estimated cost of items in your task budget. The full amount is held in escrow. The Tasker shops with receipts, and money is only released when you confirm delivery. You never hand cash to a stranger.',
        },
        {
          q: 'Will the Tasker buy at real market prices?',
          a: 'Yes. Taskers are locals who know true prices at markets like Mile 12, Balogun, and Wuse. Many send you photos of prices before buying so you approve every purchase. Itemised receipts come standard.',
        },
        {
          q: 'Can I get groceries delivered to my parents in another city?',
          a: 'Absolutely. Post the task with your parents\' city and address, a verified Tasker in that city shops and delivers, then sends you delivery photos. This is one of the most popular tasks for Nigerians abroad and busy children in other states.',
        },
        {
          q: 'Can I set up recurring weekly or monthly market runs?',
          a: 'Yes. Post recurring tasks, or rehire a Tasker you trust for a standing weekly arrangement. Many households run their entire food supply through a regular Taskeeu shopper.',
        },
      ]}
      relatedLinks={[
        { label: 'All Nigeria Errands', href: '/errands' },
        { label: 'For Nigerians Abroad', href: '/diaspora' },
        { label: 'Delivery Service', href: '/delivery' },
        { label: 'Errand Service Lagos', href: '/errands/lagos' },
        { label: 'Errand Service Abuja', href: '/errands/abuja' },
      ]}
    />
  );
}
