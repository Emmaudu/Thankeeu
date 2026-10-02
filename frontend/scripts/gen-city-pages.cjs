// One-off generator for new city errand landing pages.
// Run with: node scripts/gen-city-pages.js
// Follows the exact structure of the existing ErrandsIbadan.jsx template.
const fs = require('fs');
const path = require('path');

const ICONS = `const shop = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>;
const clock = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const map = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const file = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const users = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const book = <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;`;

const CITIES = [
  {
    slug: 'benin-city', name: 'Benin City', state: 'Edo State', file: 'ErrandsBeninCity',
    areas: 'Ring Road, GRA, Sapele Road, Ugbowo, New Benin & all Benin City areas',
    market1: 'New Benin Market', market1Desc: 'the busiest market in the city, along New Lagos Road and Mission Road',
    market2: 'Uselu Market', market2Desc: 'near Ugbowo, close to the University of Benin campus',
    market3: 'Oba Market', market3Desc: 'at Ring Road, right in the city centre',
    uni: 'University of Benin (UNIBEN)', uniShort: 'UNIBEN',
    uniCampuses: 'Ugbowo and Ekenwan campuses',
    hospital: 'University of Benin Teaching Hospital (UBTH)',
    govOffices: 'NIMC Edo, FRSC, the Passport Office, and the Edo State Secretariat',
    utility: 'BEDC electricity', utilityFull: 'BEDC electricity, water, cable TV, rent, and school fees',
    areasList: ['Ring Road', 'GRA', 'Sapele Road', 'Ugbowo', 'New Benin', 'Uselu', 'Ekenwan', 'Ekewan Road', 'Airport Road', 'Ikpoba Hill'],
    keywords: 'errand service Benin City, errand runner Benin City, errand boy Benin City, hire errand runner Benin City, New Benin Market runs, Uselu market shopper, grocery run Benin City, errand runner Ring Road Benin, queue NIMC Edo State, UNIBEN document errands, personal assistant Benin City, delivery Benin City, task outsourcing Benin City, errand service Edo State',
  },
  {
    slug: 'enugu', name: 'Enugu', state: 'Enugu State', file: 'ErrandsEnugu',
    areas: 'Independence Layout, GRA, New Market, Achara Layout & all Enugu areas',
    market1: 'Ogbete Main Market', market1Desc: "the largest market in Enugu State, a key commercial and cultural hub in the city",
    market2: 'New Market', market2Desc: 'in Artisan, a major alternative shopping destination',
    market3: 'Ogige Market', market3Desc: 'in Nsukka, for university-area errands',
    uni: 'University of Nigeria, Nsukka (UNN)', uniShort: 'UNN',
    uniCampuses: 'Nsukka and Enugu campuses, plus ESUT and IMT Enugu',
    hospital: 'University of Nigeria Teaching Hospital (UNTH) Ituku-Ozalla',
    govOffices: 'NIMC Enugu, FRSC, the Passport Office, and the Enugu State Secretariat',
    utility: 'EEDC electricity', utilityFull: 'EEDC electricity, water, cable TV, rent, and school fees',
    areasList: ['Independence Layout', 'GRA', 'New Haven', 'Achara Layout', 'Uwani', 'Trans-Ekulu', 'Abakpa', 'Ogui', 'Coal Camp', 'Nsukka'],
    keywords: 'errand service Enugu, errand runner Enugu, errand boy Enugu, hire errand runner Enugu, Ogbete market runs, New Market Enugu shopper, grocery run Enugu, errand runner Independence Layout, queue NIMC Enugu, UNN Nsukka document errands, personal assistant Enugu, delivery Enugu, task outsourcing Enugu, errand service coal city',
  },
  {
    slug: 'warri', name: 'Warri', state: 'Delta State', file: 'ErrandsWarri',
    areas: 'Effurun, DSC Roundabout, Warri Main Market, PTI Road & all Warri areas',
    market1: 'Warri Main Market', market1Desc: 'in the heart of Warri, for general foodstuff and household shopping',
    market2: 'Effurun Market', market2Desc: 'along the Airport Road axis, a major trading hub',
    market3: 'Enerhen Junction Market', market3Desc: 'a busy commercial stretch for daily needs',
    uni: 'Federal University of Petroleum Resources (FUPRE)', uniShort: 'FUPRE',
    uniCampuses: 'Effurun and Ekpoma-area institutions',
    hospital: 'Central Hospital Warri and Delta State University Teaching Hospital',
    govOffices: 'NIMC Delta, FRSC, the Passport Office, and the Delta State Secretariat Asaba',
    utility: 'BEDC electricity', utilityFull: 'BEDC electricity, water, cable TV, rent, and school fees',
    areasList: ['Effurun', 'DSC Roundabout', 'PTI Road', 'Enerhen', 'Ekpan', 'Airport Road', 'Okumagba Layout', 'Ubeji', 'GRA Warri', 'Uvwie'],
    keywords: 'errand service Warri, errand runner Warri, errand boy Warri, hire errand runner Warri, Warri Main Market runs, Effurun market shopper, grocery run Warri, errand runner Effurun, queue NIMC Delta State, FUPRE document errands, personal assistant Warri, delivery Warri, task outsourcing Warri, errand service Delta State',
  },
  {
    slug: 'owerri', name: 'Owerri', state: 'Imo State', file: 'ErrandsOwerri',
    areas: 'New Owerri, Ekeukwu Owerri, Relief Market, Wetheral Road & all Owerri areas',
    market1: 'Relief Market', market1Desc: 'one of the largest markets in Owerri for provisions and household goods',
    market2: 'Ekeukwu Owerri Market', market2Desc: 'a major foodstuff and general goods market in the city centre',
    market3: 'World Bank Housing Estate Market', market3Desc: 'convenient for New Owerri residents',
    uni: 'Federal University of Technology Owerri (FUTO)', uniShort: 'FUTO',
    uniCampuses: 'Ihiagwa campus and IMSU (Imo State University)',
    hospital: 'Federal Medical Centre Owerri',
    govOffices: 'NIMC Imo, FRSC, the Passport Office, and the Imo State Secretariat',
    utility: 'EEDC electricity', utilityFull: 'EEDC electricity, water, cable TV, rent, and school fees',
    areasList: ['New Owerri', 'Ekeukwu Owerri', 'Wetheral Road', 'World Bank Housing Estate', 'Aladinma', 'Ikenegbu', 'Egbu Road', 'Orji', 'Ihiagwa', 'Douglas Road'],
    keywords: 'errand service Owerri, errand runner Owerri, errand boy Owerri, hire errand runner Owerri, Relief Market runs, Ekeukwu Owerri shopper, grocery run Owerri, errand runner New Owerri, queue NIMC Imo State, FUTO document errands, personal assistant Owerri, delivery Owerri, task outsourcing Owerri, errand service Imo State',
  },
  {
    slug: 'calabar', name: 'Calabar', state: 'Cross River State', file: 'ErrandsCalabar',
    areas: 'Watt Market, Marina Resort, Calabar Municipal, State Housing & all Calabar areas',
    market1: 'Watt Market', market1Desc: 'established in 1901, the largest market in Cross River State and a major trading hub',
    market2: 'Marian Market', market2Desc: 'along Marian Road, popular for foodstuff and general goods',
    market3: '8 Miles Market', market3Desc: 'a growing commercial hub on the outskirts of the city',
    uni: 'University of Calabar (UNICAL)', uniShort: 'UNICAL',
    uniCampuses: 'main campus and CRUTECH',
    hospital: 'University of Calabar Teaching Hospital (UCTH)',
    govOffices: 'NIMC Cross River, FRSC, the Passport Office, and the Cross River State Secretariat',
    utility: 'CEDC electricity', utilityFull: 'CEDC electricity, water, cable TV, rent, and school fees',
    areasList: ['Watt Market', 'Marina Resort', 'Calabar Municipal', 'State Housing', 'Diamond Hill', 'Federal Housing Estate', '8 Miles', 'Ekorinim', 'Ika Ika', 'Anantigha'],
    keywords: 'errand service Calabar, errand runner Calabar, errand boy Calabar, hire errand runner Calabar, Watt Market runs, Marian Market shopper, grocery run Calabar, errand runner Calabar Municipal, queue NIMC Cross River, UNICAL document errands, personal assistant Calabar, delivery Calabar, task outsourcing Calabar, errand service Cross River State',
  },
  {
    slug: 'uyo', name: 'Uyo', state: 'Akwa Ibom State', file: 'ErrandsUyo',
    areas: 'Akpan Andem Market, Itam, Nwaniba Road, Shelter Afrique & all Uyo areas',
    market1: 'Akpan Andem Market', market1Desc: "one of the biggest and most popular markets in Akwa Ibom State",
    market2: 'Itam Market', market2Desc: 'a major roadside market on the Uyo-Itu axis',
    market3: 'Urua Ekpa Market', market3Desc: 'convenient for daily household shopping',
    uni: 'University of Uyo (UniUyo)', uniShort: 'UniUyo',
    uniCampuses: 'main campus and Akwa Ibom State University (AKSU) area',
    hospital: 'University of Uyo Teaching Hospital (UUTH)',
    govOffices: 'NIMC Akwa Ibom, FRSC, the Passport Office, and the Akwa Ibom State Secretariat',
    utility: 'PHED/AEDC electricity', utilityFull: 'electricity, water, cable TV, rent, and school fees',
    areasList: ['Akpan Andem', 'Itam', 'Nwaniba Road', 'Shelter Afrique', 'Housing Estate', 'Ewet Housing', 'Osongama', 'Ikot Ekpene Road', 'Aka Road', 'Idoro Road'],
    keywords: 'errand service Uyo, errand runner Uyo, errand boy Uyo, hire errand runner Uyo, Akpan Andem market runs, Itam market shopper, grocery run Uyo, errand runner Shelter Afrique, queue NIMC Akwa Ibom, UniUyo document errands, personal assistant Uyo, delivery Uyo, task outsourcing Uyo, errand service Akwa Ibom State',
  },
  {
    slug: 'ilorin', name: 'Ilorin', state: 'Kwara State', file: 'ErrandsIlorin',
    areas: 'Tanke, GRA, Fate Road, Post Office, Challenge & all Ilorin areas',
    market1: 'Ipata Market', market1Desc: 'one of the most famous food markets in the city, open all day',
    market2: 'Oja Oba Market', market2Desc: 'the traditional central market near the Emir\u2019s palace',
    market3: 'Oja Tuntun Market', market3Desc: 'a major general goods market',
    uni: 'University of Ilorin (UNILORIN)', uniShort: 'UNILORIN',
    uniCampuses: 'main campus and Kwara State University (KWASU) area',
    hospital: 'University of Ilorin Teaching Hospital (UITH)',
    govOffices: 'NIMC Kwara, FRSC, the Passport Office, and the Kwara State Secretariat',
    utility: 'Ibadan Electric (IBEDC)', utilityFull: 'electricity, water, cable TV, rent, and school fees',
    areasList: ['Tanke', 'GRA', 'Fate Road', 'Post Office', 'Challenge', 'Sango', 'Taiwo Road', 'Offa Garage', 'Adewole', 'Oja Oba'],
    keywords: 'errand service Ilorin, errand runner Ilorin, errand boy Ilorin, hire errand runner Ilorin, Ipata market runs, Oja Oba shopper, grocery run Ilorin, errand runner Tanke, queue NIMC Kwara, UNILORIN document errands, personal assistant Ilorin, delivery Ilorin, task outsourcing Ilorin, errand service Kwara State',
  },
  {
    slug: 'abeokuta', name: 'Abeokuta', state: 'Ogun State', file: 'ErrandsAbeokuta',
    areas: 'Kuto, Lafenwa, Oke-Ilewo, Olumo Rock area, Ibara GRA & all Abeokuta areas',
    market1: 'Kuto Market', market1Desc: 'one of Abeokuta\u2019s most common markets, with heavier trading every five days',
    market2: 'Lafenwa Market', market2Desc: 'a reliable spot for groceries, foodstuff and household products',
    market3: 'Itoku Adire Market', market3Desc: 'near Olumo Rock, the hub of the famous Adire tie-and-dye trade',
    uni: 'Federal University of Agriculture, Abeokuta (FUNAAB)', uniShort: 'FUNAAB',
    uniCampuses: 'FUNAAB and Bells University area',
    hospital: 'Federal Medical Centre Abeokuta',
    govOffices: 'NIMC Ogun, FRSC, the Passport Office, and the Ogun State Secretariat',
    utility: 'IBEDC electricity', utilityFull: 'IBEDC electricity, water, cable TV, rent, and school fees',
    areasList: ['Kuto', 'Lafenwa', 'Oke-Ilewo', 'Ibara GRA', 'Oke Mosan', 'Ake', 'Kemta', 'Camp', 'Sokori', 'Panseke'],
    keywords: 'errand service Abeokuta, errand runner Abeokuta, errand boy Abeokuta, hire errand runner Abeokuta, Kuto market runs, Lafenwa market shopper, grocery run Abeokuta, errand runner Ibara GRA, queue NIMC Ogun State, FUNAAB document errands, personal assistant Abeokuta, delivery Abeokuta, task outsourcing Abeokuta, errand service Ogun State',
  },
  {
    slug: 'onitsha', name: 'Onitsha', state: 'Anambra State', file: 'ErrandsOnitsha',
    areas: 'Upper Iweka, Fegge, Onitsha Main Market, Bridgehead & all Onitsha areas',
    market1: 'Onitsha Main Market', market1Desc: 'the largest market in Africa by geographical size and volume of goods \u2014 the commercial powerhouse of West Africa',
    market2: 'Ochanja Market', market2Desc: 'at Upper Iweka, the top destination for travellers passing through Onitsha',
    market3: 'Relief Market', market3Desc: 'in Ogbaru, one of the largest provisions markets in the area',
    uni: 'Nnamdi Azikiwe University (UNIZIK)', uniShort: 'UNIZIK',
    uniCampuses: 'Awka campus, close to Onitsha',
    hospital: 'Nnamdi Azikiwe University Teaching Hospital (NAUTH)',
    govOffices: 'NIMC Anambra, FRSC, the Passport Office, and the Anambra State Secretariat Awka',
    utility: 'EEDC electricity', utilityFull: 'EEDC electricity, water, cable TV, rent, and school fees',
    areasList: ['Upper Iweka', 'Fegge', 'Bridgehead', 'GRA Onitsha', 'Awada', 'Odoakpu', 'Woliwo', 'Nkpor', 'Obosi', 'Ogbaru'],
    keywords: 'errand service Onitsha, errand runner Onitsha, errand boy Onitsha, hire errand runner Onitsha, Onitsha Main Market runs, Ochanja market shopper, grocery run Onitsha, errand runner Upper Iweka, queue NIMC Anambra, UNIZIK document errands, personal assistant Onitsha, delivery Onitsha, task outsourcing Onitsha, errand service Anambra State',
  },
  {
    slug: 'jos', name: 'Jos', state: 'Plateau State', file: 'ErrandsJos',
    areas: 'Rayfield, Terminus, Bukuru, Farin Gada & all Jos areas',
    market1: 'Terminus Market', market1Desc: 'the traditional central market area in the heart of the city',
    market2: 'Bukuru Market', market2Desc: 'a major trading area on the Jos-Bukuru road axis',
    market3: 'Farin Gada Market', market3Desc: 'convenient for daily household shopping',
    uni: 'University of Jos (UNIJOS)', uniShort: 'UNIJOS',
    uniCampuses: 'Bauchi Road and Naraguta campuses, plus Plateau State University',
    hospital: 'Jos University Teaching Hospital (JUTH)',
    govOffices: 'NIMC Plateau, FRSC, the Passport Office, and the Plateau State Secretariat',
    utility: 'Jos Electricity Distribution (JED)', utilityFull: 'JED electricity, water, cable TV, rent, and school fees',
    areasList: ['Rayfield', 'Terminus', 'Bukuru', 'Farin Gada', 'GRA Jos', 'Angwan Rogo', 'Tudun Wada', 'Bauchi Road', 'Naraguta', 'Zaria Road'],
    keywords: 'errand service Jos, errand runner Jos, errand boy Jos, hire errand runner Jos, Terminus market runs, Bukuru market shopper, grocery run Jos, errand runner Rayfield, queue NIMC Plateau, UNIJOS document errands, personal assistant Jos, delivery Jos, task outsourcing Jos, errand service Plateau State',
  },
];

function template(c) {
  return `import ServiceLanding from '../../components/ui/ServiceLanding';
import { makeLocalBusinessSchema } from '../../components/seo/SEO';

${ICONS}

export default function ${c.file}() {
  return (
    <ServiceLanding
      seo={{
        slug: '/errands/${c.slug}',
        title: 'Errand Service in ${c.name} — Hire a Verified Errand Runner in ${c.name}',
        description:
          "${c.name} errand service on Taskeeu. Hire a trusted, verified errand runner in ${c.areas}. ${c.market1} runs, government queuing, ${c.uniShort} document errands, deliveries & more — escrow-protected.",
        keywords:
          '${c.keywords}',
        structuredData: makeLocalBusinessSchema({
          city: '${c.name}',
          serviceType: 'Errand Service',
          url: 'https://taskeeu.com/errands/${c.slug}',
        }),
      }}
      hero={{
        badge: '${c.name} Errand Service — ${c.areasList.slice(0, 5).join(' · ')} & More',
        headline: 'Hire a Trusted Errand Runner in ${c.name} — Any Task, Any Area',
        subheadline:
          'Taskeeu connects you with identity-verified errand runners across ${c.name} — from ${c.areasList[0]} and ${c.areasList[1]} to ${c.areasList[2]}, ${c.areasList[3]}, and ${c.areasList[4]}. Post any errand and get bids in minutes.',
        tasksHeading: '${c.name} Errand Tasks We Handle',
        tasksSubheading:
          'Every ${c.name} errand covered — from ${c.market1} runs to ${c.uniShort} document collection. Escrow-protected, real-time tracking.',
      }}
      tasks={[
        { icon: shop, title: '${c.market1} & ${c.market2} Runs', desc: '${c.market1}, ${c.market1Desc}. ${c.market2}, ${c.market2Desc}. Your Tasker shops your list at true local prices and delivers with receipts.' },
        { icon: book, title: '${c.uniShort} & Local Institution Document Errands', desc: '${c.uni} document runs \u2014 transcript collection, admission letters, and registration errands \u2014 handled in person with proof, at ${c.uniCampuses}.' },
        { icon: clock, title: 'Queue at NIMC, FRSC & Government Offices', desc: 'Skip the queues. Send a Tasker to ${c.govOffices} on your behalf.' },
        { icon: file, title: 'Document Pickup & Courier Across ${c.name}', desc: 'Same-day document delivery across ${c.name}. Certificates, contracts, NIN slips, legal documents.' },
        { icon: map, title: '${c.utility} & Utility Bill Payments', desc: 'Physical payment of ${c.utilityFull} at any office or agent across ${c.name}.' },
        { icon: users, title: 'Personal Shopping & Gift Delivery (${c.name})', desc: 'Buy and deliver gifts, cakes, or specific items from any ${c.name} store to any address in the city.' },
      ]}
      useCases={[
        { icon: book, title: '${c.uniShort} Alumni Anywhere', desc: 'Graduates in Lagos, Abuja, or abroad who need transcripts and certificates collected from ${c.name} institutions without travelling.' },
        { icon: clock, title: 'Busy Professionals & Remote Workers', desc: 'Workers who cannot leave the office for personal errands \u2014 or people based elsewhere with errands in ${c.name}.' },
        { icon: users, title: 'Families of Elderly ${c.name} Residents', desc: 'Arrange prescriptions, foodstuff, and welfare visits for elderly parents in ${c.name} \u2014 locally or from abroad \u2014 with photo proof.' },
        { icon: shop, title: 'Traders & Food Businesses', desc: 'Vendors who need daily market supplies bought at wholesale prices while they run their business.' },
        { icon: map, title: 'New Arrivals & Students', desc: 'Students, corpers, and newcomers who need a trusted local to navigate ${c.name} markets, offices, and neighbourhoods.' },
        { icon: file, title: 'Nigerians Abroad With Family in ${c.name}', desc: 'Diaspora clients sending groceries, paying bills, and checking property in ${c.name} from anywhere in the world.' },
      ]}
      faqs={[
        { q: 'Which areas of ${c.name} does Taskeeu cover?', a: 'Taskeeu has verified Taskers across ${c.name} including ${c.areasList.join(', ')} and more. Post your task and local Taskers will bid.' },
        { q: 'How much does an errand runner cost in ${c.name}?', a: 'You set your budget. A grocery or market run typically costs \u20a61,500\u2013\u20a63,500. Government queuing ranges \u20a62,500\u2013\u20a67,000 depending on waiting time. Taskers bid competitively \u2014 you never pay more than you approve.' },
        { q: 'Can a Tasker collect my documents from ${c.uniShort} or a government office in ${c.name}?', a: 'Yes \u2014 document errands are among the most requested tasks in ${c.name}. Describe the department and reference details, and a Tasker follows up in person until your documents are collected, then couriers or scans them to you.' },
        { q: 'How do I know a ${c.name} Tasker is trustworthy?', a: 'Every Tasker is identity-verified with NIN or BVN before accepting tasks. You see verified badges, ratings, and completed history. Payment sits in escrow until you confirm the job is done.' },
        { q: 'Can I hire a ${c.name} errand runner for recurring tasks?', a: 'Yes. Post recurring tasks or rehire a trusted Tasker directly for weekly market runs, regular bill payments, or ongoing family support.' },
      ]}
      relatedLinks={[
        { label: 'All Nigeria Errands', href: '/errands' },
        { label: 'Errand Service Lagos', href: '/errands/lagos' },
        { label: 'Errand Service Abuja', href: '/errands/abuja' },
        { label: 'Grocery Shopping Service', href: '/grocery-shopping' },
        { label: 'For Nigerians Abroad', href: '/diaspora' },
      ]}
    />
  );
}
`;
}

const outDir = path.join(__dirname, '..', 'src', 'pages', 'services');
for (const c of CITIES) {
  const outPath = path.join(outDir, `${c.file}.jsx`);
  fs.writeFileSync(outPath, template(c));
  console.log('Wrote', outPath);
}
console.log(`\nGenerated ${CITIES.length} city pages.`);
