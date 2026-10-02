import {
  BadgeCheck,
  Banknote,
  Bike,
  Building2,
  CalendarCheck2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  Gift,
  HeartHandshake,
  Home,
  Contact,
  Landmark,
  MapPin,
  PackageCheck,
  Pill,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import { makeLocalBusinessSchema } from '../seo/SEO';
import ServiceLanding from './ServiceLanding';

const icon = (Icon) => <Icon size={22} strokeWidth={1.8} aria-hidden="true" />;

const pages = {
  personalShopperLagos: {
    seo: {
      slug: '/personal-shopper-lagos',
      title: 'Personal Shopper in Lagos | Market, Grocery & Gift Shopping Service',
      description:
        'Hire a verified personal shopper in Lagos for market runs, groceries, gifts, fashion sourcing and store pickups. Get receipts, photo updates and escrow-protected delivery across Lagos.',
      keywords:
        'personal shopper Lagos, personal shopping service Lagos, hire personal shopper Lagos, ' +
        'market shopper Lagos, grocery personal shopper Lagos, shopping and delivery Lagos, ' +
        'personal shopper Lekki, personal shopper Ikeja, personal shopper near me Lagos, ' +
        'Mile 12 market shopper, Balogun market personal shopper, gift shopping service Lagos',
      structuredData: makeLocalBusinessSchema({
        city: 'Lagos',
        serviceType: 'Personal Shopping Service',
        url: 'https://taskeeu.com/personal-shopper-lagos',
      }),
    },
    hero: {
      badge: 'Personal Shopping Across Lagos',
      headline: 'Hire a Verified Personal Shopper in Lagos',
      subheadline:
        'Send your list, preferred brands, sizes and budget. A local Taskeeu shopper sources the items, shares price and receipt evidence, and delivers across Lagos while your payment stays protected in escrow.',
      tasksHeading: 'What a Taskeeu Personal Shopper Can Handle',
      tasksSubheading:
        'From open markets to specialist stores, choose a verified local shopper for the exact job.',
    },
    tasks: [
      { icon: icon(Store), title: 'Market & Supermarket Runs', desc: 'Shop at Mile 12, Oyingbo, Balogun, Tejuosho, Shoprite, SPAR, Ebeano or another store you specify.' },
      { icon: icon(ShoppingBag), title: 'Fashion & Size Sourcing', desc: 'Find clothing, shoes, fabrics and accessories to your brief, with photos before purchase where available.' },
      { icon: icon(Gift), title: 'Gift & Event Shopping', desc: 'Source birthday gifts, hampers, asoebi, souvenirs and event supplies, then deliver them on your chosen date.' },
      { icon: icon(Receipt), title: 'Receipts & Price Evidence', desc: 'Request itemised receipts, price photos and purchase updates so the spending is clear and accountable.' },
      { icon: icon(PackageCheck), title: 'Store Pickup & Delivery', desc: 'Have a paid order collected from a vendor and delivered to your home, office or recipient in Lagos.' },
      { icon: icon(Clock3), title: 'Urgent Same-Day Shopping', desc: 'Post a time-sensitive shopping task and compare bids from Taskers who are available near the pickup area.' },
      { icon: icon(MapPin), title: 'Island & Mainland Coverage', desc: 'Request shopping in Lekki, VI, Ikoyi, Ajah, Ikeja, Yaba, Surulere, Festac and other Lagos areas.' },
      { icon: icon(ShieldCheck), title: 'Escrow-Protected Payment', desc: 'The Tasker is paid after you review completion evidence and confirm that the agreed task is complete.' },
    ],
    useCases: [
      { icon: icon(Building2), title: 'Busy Lagos Professionals', desc: 'Outsource weekly shopping instead of losing productive hours to traffic, parking and long queues.' },
      { icon: icon(Home), title: 'Households & New Parents', desc: 'Arrange groceries, baby supplies and household essentials without leaving home.' },
      { icon: icon(Users), title: 'Nigerians Abroad', desc: 'Buy and deliver items to relatives in Lagos with a visible task trail, receipts and delivery proof.' },
      { icon: icon(Store), title: 'Small Businesses', desc: 'Source supplies, packaging, samples and restock items from markets or local distributors.' },
      { icon: icon(Gift), title: 'Celebrations & Surprises', desc: 'Coordinate gifts and purchases when you cannot visit the store or recipient yourself.' },
      { icon: icon(ShoppingBag), title: 'Hard-to-Find Items', desc: 'Send a clear sourcing brief and let Taskers who know Lagos markets bid on finding the item.' },
    ],
    faqs: [
      { q: 'How do I hire a personal shopper in Lagos?', a: 'Post your shopping list, pickup area, delivery address, budget and deadline on Taskeeu. Verified Taskers bid, and you choose based on their offer, profile and task history.' },
      { q: 'Can a shopper send photos before buying?', a: 'Yes. Add photo approval to your task instructions. For suitable items, the Tasker can share available options and prices in the task chat before purchasing.' },
      { q: 'How are the cost of items and the service fee handled?', a: 'State the estimated item budget and shopping fee clearly in the task. Agree the scope before work starts, keep payment in escrow, and require receipts for purchased items.' },
      { q: 'Which Lagos markets and areas are covered?', a: 'You can post tasks for markets and stores across Lagos, including Island and Mainland locations. Availability depends on Taskers active near the location and deadline.' },
      { q: 'Can someone abroad hire a Lagos personal shopper?', a: 'Yes. Nigerians abroad can post, fund and monitor a shopping task online, receive updates, and approve completion after delivery proof is provided.' },
    ],
    relatedLinks: [
      { label: 'Grocery Shopping Nigeria', href: '/grocery-shopping' },
      { label: 'Same-Day Errands Lagos', href: '/same-day-errand-service-lagos' },
      { label: 'Errand Service Lagos', href: '/errands/lagos' },
      { label: 'For Nigerians Abroad', href: '/diaspora' },
      { label: 'Delivery Service', href: '/delivery' },
    ],
  },
  sameDayErrandsLagos: {
    seo: {
      slug: '/same-day-errand-service-lagos',
      title: 'Same-Day Errand Service in Lagos | Hire a Verified Runner',
      description:
        'Need an errand handled today in Lagos? Post shopping, pickup, delivery, queue or office errands and compare bids from verified local runners. Track progress and pay through escrow.',
      keywords:
        'same day errand service Lagos, urgent errand service Lagos, errand runner Lagos today, ' +
        'on demand errand service Lagos, fast errand delivery Lagos, hire errand runner Lagos, ' +
        'errand boy Lagos, errand service Lekki, errand runner Ikeja, local runner near me Lagos',
      structuredData: makeLocalBusinessSchema({
        city: 'Lagos',
        serviceType: 'Same-Day Errand Service',
        url: 'https://taskeeu.com/same-day-errand-service-lagos',
      }),
    },
    hero: {
      badge: 'Urgent & Same-Day Lagos Errands',
      headline: 'Get a Same-Day Errand Runner in Lagos',
      subheadline:
        'Post what must be done today, add the exact pickup area and deadline, and compare bids from verified local Taskers. Chat, follow progress and release escrow payment only after completion.',
      tasksHeading: 'Same-Day Errands You Can Post',
      tasksSubheading: 'Clear instructions and realistic travel time help nearby Taskers respond quickly.',
    },
    tasks: [
      { icon: icon(Bike), title: 'Urgent Pickup & Drop-off', desc: 'Collect and deliver documents, parcels, forgotten items or store orders within Lagos.' },
      { icon: icon(ShoppingBag), title: 'Last-Minute Shopping', desc: 'Send a shopper for groceries, event items, gifts, office supplies or household essentials.' },
      { icon: icon(FileText), title: 'Document Runs', desc: 'Move signed documents, applications, records or other permitted paperwork between locations.' },
      { icon: icon(Landmark), title: 'Bank & Office Errands', desc: 'Handle permitted deposits, submissions, collections and in-person follow-ups that do not require your identity.' },
      { icon: icon(Clock3), title: 'Queue & Wait Tasks', desc: 'Hire someone to hold a place or wait where the organisation permits representatives.' },
      { icon: icon(Pill), title: 'Pharmacy Pickup', desc: 'Collect a prepared order from the licensed pharmacy you name and deliver it to the recipient.' },
      { icon: icon(PackageCheck), title: 'Vendor Collection', desc: 'Pick up a paid item from a Lagos vendor and provide collection and delivery evidence.' },
      { icon: icon(Zap), title: 'Multi-Stop Errands', desc: 'Combine related stops in one clearly planned route and agree the full scope before assignment.' },
    ],
    useCases: [
      { icon: icon(Building2), title: 'Offices With a Deadline', desc: 'Send time-sensitive documents or supplies without pulling staff away from core work.' },
      { icon: icon(Home), title: 'Busy Households', desc: 'Solve an urgent pickup or purchase when traffic or another commitment makes it impossible.' },
      { icon: icon(Store), title: 'Online Vendors', desc: 'Arrange same-day customer delivery or stock collection from a supplier.' },
      { icon: icon(Users), title: 'People Outside Lagos', desc: 'Coordinate an urgent Lagos task remotely and review updates in one task thread.' },
      { icon: icon(CalendarCheck2), title: 'Event Teams', desc: 'Recover forgotten materials, collect print jobs or deliver supplies before an event starts.' },
      { icon: icon(HeartHandshake), title: 'Family Support', desc: 'Send essentials to a relative when you cannot reach them in person that day.' },
    ],
    faqs: [
      { q: 'Can I get an errand runner in Lagos today?', a: 'You can post an urgent task with the area and deadline. Response and completion depend on Tasker availability, distance, traffic, business opening hours and the task requirements.' },
      { q: 'How quickly will Taskers bid?', a: 'Nearby Taskers can bid after the task is published. Add a precise area, realistic deadline, clear instructions and an appropriate budget to improve matching.' },
      { q: 'What parts of Lagos are covered?', a: 'Tasks can be posted across Lagos, including Lekki, Ajah, VI, Ikoyi, Ikeja, Yaba, Surulere, Festac and other areas where Taskers are available.' },
      { q: 'Can I track a same-day errand?', a: 'You can use the Taskeeu task chat for progress updates and request appropriate pickup, receipt and delivery evidence in the task brief.' },
      { q: 'When is the Tasker paid?', a: 'Payment is held in escrow and released after the agreed task is completed and approved, subject to Taskeeu terms and any dispute process.' },
    ],
    relatedLinks: [
      { label: 'Errand Service Lagos', href: '/errands/lagos' },
      { label: 'Personal Shopper Lagos', href: '/personal-shopper-lagos' },
      { label: 'Pharmacy Pickup Lagos', href: '/pharmacy-delivery-lagos' },
      { label: 'Delivery Service Nigeria', href: '/delivery' },
      { label: 'Errand Runner Near Me', href: '/errand-runner-near-me' },
    ],
  },
  pharmacyDeliveryLagos: {
    seo: {
      slug: '/pharmacy-delivery-lagos',
      title: 'Pharmacy Pickup & Medicine Delivery in Lagos',
      description:
        'Arrange pharmacy pickup and medicine delivery in Lagos from a licensed pharmacy you choose. A verified Taskeeu runner collects the prepared order and delivers with tracked task updates.',
      keywords:
        'pharmacy delivery Lagos, medicine delivery Lagos, medication pickup Lagos, ' +
        'prescription pickup Lagos, pharmacy errand service Lagos, drug delivery Lagos, ' +
        'same day pharmacy delivery Lagos, pharmacy pickup near me Lagos, send medicine to parents Lagos',
      structuredData: makeLocalBusinessSchema({
        city: 'Lagos',
        serviceType: 'Pharmacy Pickup and Delivery Service',
        url: 'https://taskeeu.com/pharmacy-delivery-lagos',
      }),
    },
    hero: {
      badge: 'Pickup From Your Chosen Licensed Pharmacy',
      headline: 'Arrange Pharmacy Pickup & Medicine Delivery in Lagos',
      subheadline:
        'Confirm the medicine and any prescription directly with a licensed pharmacy, then hire a verified Taskeeu Tasker to collect the prepared order and deliver it. Taskeeu runners provide logistics, not medical advice or dispensing.',
      tasksHeading: 'Pharmacy & Health-Supply Errands',
      tasksSubheading: 'Use a licensed pharmacy and keep prescription decisions between the patient, prescriber and pharmacist.',
    },
    tasks: [
      { icon: icon(Pill), title: 'Prepared Prescription Pickup', desc: 'Collect a prescription order after the licensed pharmacy confirms it is ready and authorised for release.' },
      { icon: icon(Bike), title: 'Same-Day Pharmacy Delivery', desc: 'Arrange prompt local delivery, subject to pharmacy readiness, distance, traffic and Tasker availability.' },
      { icon: icon(HeartHandshake), title: 'Delivery to Parents & Relatives', desc: 'Send a prepared pharmacy order or approved health supplies to a loved one in Lagos.' },
      { icon: icon(Receipt), title: 'Receipt & Handover Evidence', desc: 'Request purchase receipts and appropriate collection or delivery confirmation in the task brief.' },
      { icon: icon(Store), title: 'Named-Pharmacy Collection', desc: 'Specify the registered pharmacy, branch address, order reference and authorised recipient details.' },
      { icon: icon(ClipboardCheck), title: 'Over-the-Counter Supply Pickup', desc: 'Collect non-prescription health supplies selected and approved by you or the pharmacist.' },
      { icon: icon(CalendarCheck2), title: 'Scheduled Refill Collection', desc: 'Post a new task for a confirmed refill date and reuse a trusted Tasker when available.' },
      { icon: icon(ShieldCheck), title: 'Protected Task Payment', desc: 'Keep the Tasker service payment in escrow until the agreed collection and delivery are complete.' },
    ],
    useCases: [
      { icon: icon(Home), title: 'People Recovering at Home', desc: 'Avoid a pharmacy trip when a confirmed order can be collected by a runner.' },
      { icon: icon(Users), title: 'Diaspora Families', desc: 'Coordinate delivery of approved medication or supplies to relatives in Lagos from abroad.' },
      { icon: icon(Building2), title: 'Busy Professionals', desc: 'Collect a ready pharmacy order while you remain at work or attend to other commitments.' },
      { icon: icon(HeartHandshake), title: 'Caregivers', desc: 'Arrange practical pharmacy logistics for someone you support, using clear authorised pickup details.' },
      { icon: icon(CalendarCheck2), title: 'Routine Collection', desc: 'Schedule repeat collection tasks after each refill is approved by the pharmacy or prescriber.' },
      { icon: icon(MapPin), title: 'Cross-Lagos Pickup', desc: 'Collect from the branch with stock and deliver to another Lagos area when practical.' },
    ],
    faqs: [
      { q: 'Does Taskeeu sell or prescribe medicine?', a: 'No. Taskeeu is a task marketplace. A Tasker can collect and deliver an order from the licensed pharmacy you choose, but does not prescribe, recommend, substitute or dispense medicine.' },
      { q: 'Can a Tasker collect prescription medicine?', a: 'Only when the licensed pharmacy confirms the prescription and authorises collection. Provide the pharmacy order reference and any required pickup authorisation without exposing unnecessary medical information.' },
      { q: 'How do I reduce the risk of counterfeit medicine?', a: 'Choose a pharmacy registered with the Pharmacy Council of Nigeria and confirm the order directly with its pharmacist. Do not ask a runner to source prescription medicine from an unknown seller.' },
      { q: 'Can medicine be delivered the same day in Lagos?', a: 'Often, if the pharmacy has confirmed the order and a Tasker is available nearby. Timing depends on stock, authorisation, distance, traffic, opening hours and handling requirements.' },
      { q: 'Can Taskers transport temperature-controlled medicine?', a: 'Do not assume standard delivery is suitable. Confirm storage and transport requirements with the pharmacist first, state them explicitly, and only proceed with a Tasker and equipment appropriate for those requirements.' },
    ],
    relatedLinks: [
      { label: 'Same-Day Errands Lagos', href: '/same-day-errand-service-lagos' },
      { label: 'Family Welfare Checks', href: '/family-welfare-check-nigeria' },
      { label: 'Grocery Shopping', href: '/grocery-shopping' },
      { label: 'Errand Service Lagos', href: '/errands/lagos' },
      { label: 'For Nigerians Abroad', href: '/diaspora' },
    ],
  },
  familyWelfareCheckNigeria: {
    seo: {
      slug: '/family-welfare-check-nigeria',
      title: 'Family Welfare Checks in Nigeria for Nigerians Abroad',
      description:
        'Arrange a non-medical welfare visit for parents or relatives in Nigeria. Hire an identity-verified local Tasker for an agreed check-in, grocery drop or practical update with photo or video proof.',
      keywords:
        'family welfare check Nigeria, check on parents in Nigeria from abroad, ' +
        'elderly parent check in Nigeria, welfare visit Nigeria diaspora, person on ground Nigeria, ' +
        'check on family in Nigeria, diaspora concierge Nigeria, trusted person in Nigeria, ' +
        'send groceries to parents Nigeria, help elderly parents Nigeria from abroad',
      structuredData: makeLocalBusinessSchema({
        city: 'Nigeria',
        serviceType: 'Family Welfare Check Service',
        url: 'https://taskeeu.com/family-welfare-check-nigeria',
      }),
    },
    hero: {
      badge: 'Practical, Non-Medical Check-Ins Nationwide',
      headline: 'Arrange a Trusted Family Welfare Check in Nigeria',
      subheadline:
        'When you cannot visit in person, hire an identity-verified local Tasker for an agreed check-in, essential delivery or practical update. Define consent and boundaries clearly, follow progress, and receive appropriate completion evidence.',
      tasksHeading: 'Practical Family Support Tasks',
      tasksSubheading: 'Taskeeu handles everyday assistance and observation, not clinical assessment or emergency response.',
    },
    tasks: [
      { icon: icon(HeartHandshake), title: 'Scheduled Welfare Visit', desc: 'Arrange a consensual visit to confirm a relative is reachable and share a practical, non-medical update.' },
      { icon: icon(ShoppingBag), title: 'Groceries & Essentials Drop', desc: 'Combine a check-in with delivery of food, toiletries or other household items you specify.' },
      { icon: icon(Pill), title: 'Prepared Pharmacy Pickup', desc: 'Collect an approved order from a licensed pharmacy and deliver it as a separate, clearly authorised errand.' },
      { icon: icon(Video), title: 'Photo or Video Update', desc: 'Request appropriate evidence with the family member’s consent and respect for privacy.' },
      { icon: icon(CalendarCheck2), title: 'Recurring Practical Check-Ins', desc: 'Post scheduled visits and rehire a trusted Tasker when available for continuity.' },
      { icon: icon(Home), title: 'Home-Supply Observation', desc: 'Ask the Tasker to report visible practical issues such as low food, water or household supplies.' },
      { icon: icon(FileCheck2), title: 'Written Task Summary', desc: 'Receive a concise summary of agreed observations and completed actions in the task thread.' },
      { icon: icon(HeartHandshake), title: 'Appointment Accompaniment', desc: 'Hire a Tasker for practical accompaniment where the relative, provider and Tasker agree to the scope.' },
    ],
    useCases: [
      { icon: icon(Users), title: 'Nigerians in the UK, USA & Canada', desc: 'Create an accountable local task without repeatedly relying on relatives or informal middlemen.' },
      { icon: icon(HeartHandshake), title: 'Adult Children Living Far Away', desc: 'Arrange a simple visit and delivery when work, distance or travel makes a personal visit impossible.' },
      { icon: icon(Home), title: 'Relatives Living Alone', desc: 'Add a practical human check-in alongside normal family calls and existing care arrangements.' },
      { icon: icon(CalendarCheck2), title: 'Regular Family Support', desc: 'Schedule groceries or household help and keep each visit documented as a separate task.' },
      { icon: icon(MapPin), title: 'Families in Different States', desc: 'Match with Taskers near the family member instead of coordinating someone across the country.' },
      { icon: icon(ShieldCheck), title: 'People Needing Accountability', desc: 'Use verified identities, task history, escrow and evidence instead of an untracked cash arrangement.' },
    ],
    faqs: [
      { q: 'Is a Taskeeu welfare check a medical or safeguarding service?', a: 'No. It is a practical, non-medical task by an independent Tasker. It does not replace a doctor, licensed caregiver, social worker, emergency service or police welfare check.' },
      { q: 'What happens if the Tasker sees an emergency?', a: 'The Tasker should contact the requester and local emergency services as appropriate. Do not use the platform for an active emergency; contact the relevant local emergency authority immediately.' },
      { q: 'Does my relative need to consent to the visit and photos?', a: 'Yes. Arrange the visit with the family member where possible, respect their privacy, and request only evidence they understand and consent to.' },
      { q: 'Can I add groceries or pharmacy pickup to the visit?', a: 'Yes, if each item and action is clearly described, lawful and agreed. Prescription pickup must be authorised by the licensed pharmacy, and the Tasker does not provide medical advice.' },
      { q: 'Can I arrange recurring checks?', a: 'You can post recurring or repeated tasks and rehire a Tasker you trust when available. Keep emergency contacts and any professional care plan separate and up to date.' },
    ],
    relatedLinks: [
      { label: 'For Nigerians Abroad', href: '/diaspora' },
      { label: 'Diaspora UK', href: '/diaspora/uk' },
      { label: 'Diaspora USA', href: '/diaspora/usa' },
      { label: 'Diaspora Canada', href: '/diaspora/canada' },
      { label: 'Pharmacy Pickup Lagos', href: '/pharmacy-delivery-lagos' },
      { label: 'Grocery Shopping', href: '/grocery-shopping' },
    ],
  },
  governmentOfficeErrandsNigeria: {
    seo: {
      slug: '/government-office-errands-nigeria',
      title: 'Government Office Errands & Queue Service in Nigeria',
      description:
        'Hire a verified local Tasker for permitted government-office follow-ups, document submission or collection, queue and registry errands in Nigeria. Clear scope, task updates and escrow payment.',
      keywords:
        'government office errand service Nigeria, queue service Lagos, queue service Abuja, ' +
        'NIMC errand Nigeria, passport office errand Nigeria, CAC document collection, ' +
        'court registry document pickup Nigeria, government office runner Lagos, ' +
        'stand in line service Lagos, official errand service Nigeria, document processing runner Nigeria',
      structuredData: makeLocalBusinessSchema({
        city: 'Nigeria',
        serviceType: 'Government Office Errand Service',
        url: 'https://taskeeu.com/government-office-errands-nigeria',
      }),
    },
    hero: {
      badge: 'Permitted In-Person Follow-Ups & Collections',
      headline: 'Hire a Runner for Government Office Errands in Nigeria',
      subheadline:
        'For tasks an agency allows a representative to handle, post the office, purpose, authorisation, deadline and expected evidence. Compare verified Taskers and keep payment protected until the agreed errand is complete.',
      tasksHeading: 'Official Errands Taskers Can Help With',
      tasksSubheading: 'Always confirm the agency’s current rules. A Tasker cannot impersonate you or complete biometric or personal-attendance steps.',
    },
    tasks: [
      { icon: icon(Landmark), title: 'Office Follow-Up Visit', desc: 'Check an application status or obtain process information where the agency permits a representative.' },
      { icon: icon(FileCheck2), title: 'Authorised Document Collection', desc: 'Collect a ready document using the required letter, reference and valid authorisation.' },
      { icon: icon(FileText), title: 'Permitted Submission', desc: 'Submit prepared paperwork when the office accepts delivery by a representative.' },
      { icon: icon(Clock3), title: 'Queue & Waiting Task', desc: 'Wait in line or secure service information where local rules allow someone else to do so.' },
      { icon: icon(Contact), title: 'NIMC & Identity-Office Follow-Up', desc: 'Handle non-biometric enquiries or permitted collection steps; the applicant must attend any required capture.' },
      { icon: icon(BadgeCheck), title: 'Passport Office Follow-Up', desc: 'Check permitted status or collection requirements without claiming to bypass appointments or official procedures.' },
      { icon: icon(Building2), title: 'CAC & Registry Errands', desc: 'Deliver or collect authorised records and obtain acknowledgement where accepted.' },
      { icon: icon(Receipt), title: 'Acknowledgement & Receipt Proof', desc: 'Request official receipts, stamped copies or appropriate visit evidence as part of the task brief.' },
    ],
    useCases: [
      { icon: icon(Users), title: 'Nigerians Abroad', desc: 'Arrange a permitted local follow-up without relying on an unverified agent or sharing cash informally.' },
      { icon: icon(Building2), title: 'Businesses & Law Firms', desc: 'Outsource routine submissions, collections and registry visits with a visible task record.' },
      { icon: icon(CalendarCheck2), title: 'Applicants With Work Conflicts', desc: 'Use a representative only for steps the agency does not require you to attend personally.' },
      { icon: icon(FileText), title: 'Document Owners in Another State', desc: 'Hire locally near the office instead of travelling solely for an authorised collection.' },
      { icon: icon(Clock3), title: 'Time-Consuming Follow-Ups', desc: 'Pay for waiting time transparently and agree exactly what information or proof is expected.' },
      { icon: icon(ShieldCheck), title: 'People Avoiding Informal Agents', desc: 'Choose a verified profile, keep instructions on-platform and release payment after completion.' },
    ],
    faqs: [
      { q: 'Can a Tasker complete NIN or passport biometrics for me?', a: 'No. A Tasker cannot impersonate you or complete any biometric, interview, signature or personal-attendance requirement. Confirm the official process directly with the responsible agency.' },
      { q: 'Can a Tasker collect a government document for me?', a: 'Only if the issuing office permits an authorised representative and you provide its required authorisation, references and identification. Rules vary by agency and can change.' },
      { q: 'Does Taskeeu guarantee an approval or faster government processing?', a: 'No. Taskeeu provides access to independent Taskers for lawful errands. No Tasker can guarantee approval, skip official procedures or control an agency’s processing time.' },
      { q: 'What should I include in the task?', a: 'Include the exact office and branch, official reference, permitted action, authorisation requirements, opening hours, deadline, expected evidence and a realistic budget for travel and waiting time.' },
      { q: 'How do I avoid scams or unofficial fees?', a: 'Verify requirements on the agency’s official website, ask for official receipts, do not pay for promised shortcuts, keep communication on-platform, and report any request for an unlawful payment.' },
    ],
    relatedLinks: [
      { label: 'Document Pickup', href: '/document-pickup' },
      { label: 'All Nigeria Errands', href: '/errands' },
      { label: 'Office Support', href: '/office-support' },
      { label: 'For Nigerians Abroad', href: '/diaspora' },
      { label: 'Errand Runner Near Me', href: '/errand-runner-near-me' },
    ],
  },
};

export default function HighIntentServiceLanding({ page }) {
  return <ServiceLanding {...pages[page]} />;
}
