import { Link } from 'react-router-dom';

const scrollTop = () => window.scrollTo({ top: 0, behavior: 'instant' });

// ── Use Cases split into 4 sub-columns ────────────────────────────────────────
const USE_CASE_COL1 = [
  { to:'/occasions/birthday',    label:'Free Group Birthday Cards' },
  { to:'/occasions/anniversary', label:'Free Anniversary Group Cards' },
  { to:'/cards/christmas',       label:'Free Christmas Group Cards' },
  { to:'/occasions/graduation',  label:'Free Congratulations Cards' },
  { to:'/cards/get-well-soon',   label:'Free Get Well Soon Cards' },
  { to:'/cards/sympathy',        label:'Free Sympathy Group Cards' },
  { to:'/cards/thank-you',       label:'Free Thank You Group Cards' },
  { to:'/occasions/birthday',    label:'Free Group Electronic Cards' },
  { to:'/cards/pet-loss-card',        label:'Pet Loss Group Card' },
  { to:'/cards/teacher-appreciation', label:'Teacher Appreciation Card' },
  { to:'/occasions/staff-appreciation', label:'Staff Appreciation Cards' },
  { to:'/virtual-birthday-card',      label:'Virtual Birthday Card' },
  { to:'/virtual-farewell-card',      label:'Virtual Farewell Card' },
];
const USE_CASE_COL2 = [
  { to:'/memory-movie',          label:'Thankeeu Memory Movie™' },
  { to:'/live-memory-wall',      label:'Live Memory Wall™' },
  { to:'/wedding-memory-wall',   label:'Wedding Memory Wall' },
  { to:'/birthday-memory-wall',  label:'Birthday Memory Wall' },
  { to:'/church-memory-wall',    label:'Church Memory Wall' },
  { to:'/employee-memory-wall',  label:'Employee Memory Wall' },
  { to:'/wedding-photo-sharing-app',     label:'Wedding Photo Sharing App' },
  { to:'/digital-wedding-guest-book',    label:'Digital Wedding Guest Book' },
];
const USE_CASE_COL3 = [
  { to:'/leaving-cards-uk',              label:'Online Leaving Cards UK' },
  { to:'/birthday-cards-uk',             label:'Online Birthday Cards UK' },
  { to:'/retirement-cards-uk',           label:'Retirement Cards UK' },
  { to:'/get-well-soon-cards-uk',        label:'Get Well Soon Cards UK' },
  { to:'/online-birthday-cards-nigeria', label:'Birthday Cards Nigeria' },
  { to:'/online-group-cards-uk',         label:'Free Kudoboard Alternative UK' },
  { to:'/qr-code-for-wedding-photos',    label:'QR Code for Wedding Photos' },
  { to:'/collect-wedding-guest-photos',  label:'Collect Wedding Guest Photos' },
  { to:'/ecards',                        label:'eCards' },
  { to:'/virtual-cards',                 label:'Virtual Cards' },
  { to:'/digital-greeting-cards',        label:'Digital Greeting Cards' },
  { to:'/ecard-for-coworker',            label:'eCard for a Coworker' },
  { to:'/group-ecard',                   label:'Group eCard' },
  { to:'/free-ecards-for-friends-and-family', label:'Free eCards for Friends & Family' },
];
const USE_CASE_COL4 = [
  { to:'/wedding-group-card',            label:'Wedding Group Card' },
  { to:'/wedding-cash-gift-platform',    label:'Wedding Cash Gift Platform' },
  { to:'/online-wedding-guestbook',      label:'Online Wedding Guestbook' },
  { to:'/wedding-memory-book',           label:'Wedding Memory Book' },
  { to:'/wedding-video-message-book',    label:'Wedding Video Messages' },
  { to:'/wedding-photo-upload-app',      label:'Wedding Photo Upload App' },
  { to:'/wedding-photo-gallery',         label:'Wedding Photo Gallery' },
  { to:'/uk-wedding-photo-sharing',      label:'UK Wedding Photo Sharing' },
  { to:'/usa-wedding-photo-sharing',     label:'USA Wedding Photo Sharing' },
  { to:'/online-group-card',             label:'Online Group Card' },
];

// ── Articles (exact categories from Recocards, unique Thankeeu content) ───────
const ARTICLE_SECTIONS = [
  {
    heading: 'Birthday',
    links: [
      { to:'/blog/birthday-messages-for-a-friend-nigeria',            label:'What to Write in a Birthday Card (200+ Lines)' },
      { to:'/blog/birthday-wishes-for-colleague-nigeria-prayers-pidgin', label:'Belated Birthday Wishes & Prayers (Nigeria)' },
      { to:'/blog/birthday-messages-for-a-friend-nigeria',            label:'Birthday Wishes for a Childhood Friend' },
      { to:'/blog/birthday-wishes-for-colleague-nigeria-prayers-pidgin', label:'Birthday Wishes for a Coworker (Not Phoned-In)' },
      { to:'/blog/birthday-messages-for-a-friend-nigeria',            label:'Birthday Wishes for a Friend (Honest, Not Generic)' },
    ],
  },
  {
    heading: 'Farewell',
    links: [
      { to:'/blog/what-to-write-farewell-card-colleague-nigeria',    label:'What to Write in a Goodbye Card' },
      { to:'/blog/what-to-write-farewell-card-colleague-nigeria',    label:'Farewell Messages for a Boss Leaving' },
      { to:'/blog/send-forth-messages-colleague-nigeria-examples',   label:'Send-Forth Messages for a Colleague' },
      { to:'/blog/farewell-card-ideas-for-colleagues',               label:'Farewell Messages for a Colleague (Real Ones)' },
      { to:'/blog/farewell-card-messages-uk-colleagues-2025',        label:'Farewell Messages for a Coworker UK' },
    ],
  },
  {
    heading: 'Retirement',
    links: [
      { to:'/blog/work-anniversary-cards-guide',                     label:'What to Write in a Retirement Card (80+ Lines)' },
      { to:'/blog/work-anniversary-cards-guide',                     label:'Funny Retirement Wishes That Land' },
      { to:'/blog/work-anniversary-messages-colleague-employee-nigeria', label:'Retirement Wishes for a Coworker Nigeria' },
      { to:'/blog/work-anniversary-cards-guide',                     label:'Retirement Wishes for a Long-Serving Employee' },
      { to:'/blog/how-to-celebrate-employee-work-anniversaries',     label:'Retirement Wishes for a Friend (Funny + Real)' },
    ],
  },
  {
    heading: 'Work Anniversary',
    links: [
      { to:'/blog/work-anniversary-messages-colleague-employee-nigeria', label:'1, 5 & 10-Year Work Anniversary Messages' },
      { to:'/blog/work-anniversary-messages-colleague-employee-nigeria', label:'Funny Work Anniversary Messages' },
      { to:'/blog/work-anniversary-cards-guide',                     label:'Happy Work Anniversary Messages' },
      { to:'/blog/work-anniversary-messages-canadian-employees',     label:'Work Anniversary Messages for a Friend' },
      { to:'/blog/what-to-write-birthday-card-boss-nigeria',         label:'Work Anniversary Messages for Your Boss' },
    ],
  },
  {
    heading: 'Get Well',
    links: [
      { to:'/blog/get-well-soon-messages-colleague-friend-nigeria',  label:'Funny Get Well Soon Messages (That Land)' },
      { to:'/blog/get-well-soon-messages-colleague-friend-nigeria',  label:'Get Well Messages After Surgery (Real Ones)' },
      { to:'/blog/get-well-soon-messages-colleague-friend-nigeria',  label:'Get Well Messages for a Family Member' },
      { to:'/blog/get-well-soon-messages-colleague-friend-nigeria',  label:'Get Well Messages for an Employee (Honest)' },
      { to:'/blog/get-well-soon-messages-colleague-friend-nigeria',  label:'Get Well Soon Messages for a Colleague' },
    ],
  },
  {
    heading: 'Sympathy',
    links: [
      { to:'/blog/what-to-write-sympathy-card-messages',  label:'What to Write in a Sympathy Card (60 Lines)' },
      { to:'/blog/what-to-write-sympathy-card-coworker',  label:'What to Write in a Sympathy Card for a Coworker' },
      { to:'/blog/condolence-messages-loss-of-parent',  label:'Condolence Messages for the Loss of a Parent' },
      { to:'/blog/condolence-messages-loss-of-pet',  label:'Condolence Messages for the Loss of a Pet' },
      { to:'/blog/condolence-messages-loss-of-spouse',  label:'Condolence Messages for the Loss of a Spouse' },
    ],
  },
  {
    heading: 'Thank You',
    links: [
      { to:'/blog/employee-appreciation-vs-recognition',             label:'What to Write in a Thank-You Card (70 Lines)' },
      { to:'/blog/baby-shower-group-card-ideas-celebrate-new-mum',   label:'Baby Shower Thank You Card Wording' },
      { to:'/blog/employee-appreciation-vs-recognition',             label:'Appreciation Quotes Worth Keeping' },
      { to:'/blog/employee-recognition-ideas-nigerian-companies',    label:'Thank-You Messages for a Coworker Nigeria' },
      { to:'/blog/creating-employee-recognition-programme-from-scratch', label:'Building a Recognition Programme from Scratch' },
    ],
  },
  {
    heading: 'Congratulations',
    links: [
      { to:'/blog/congratulations-promotion-messages-nigeria-colleague', label:'Congrats on Promotion Messages Nigeria' },
      { to:'/blog/new-baby-congratulations-messages-nigeria-prayers',    label:'Congrats on the New Baby Messages' },
      { to:'/blog/congratulations-promotion-messages-nigeria-colleague', label:'Congrats on Your Achievement Messages' },
      { to:'/blog/wedding-wishes-prayers-nigerian-couple-card',          label:'Congrats on Your Engagement Messages' },
      { to:'/blog/congratulations-promotion-messages-nigeria-colleague', label:'Congrats on Your New Job Messages' },
    ],
  },
  {
    heading: 'Graduation',
    links: [
      { to:'/blog/what-to-write-graduation-card-messages',    label:'What to Write in a Graduation Card' },
      { to:'/blog/graduation-messages-university-graduate',  label:'Graduation Messages for a Uni Grad' },
      { to:'/blog/graduation-messages-postgraduate-masters-phd', label:'Graduation Messages for a Postgraduate' },
      { to:'/blog/graduation-messages-nysc-nigeria-passing-out',  label:'Graduation Messages for a NYSC Grad Nigeria' },
      { to:'/blog/graduation-messages-professional-certification',  label:'Graduation Messages for a Professional Certification' },
    ],
  },
  {
    heading: 'Anniversary',
    links: [
      { to:'/blog/wedding-anniversary-messages-nigerian-couple',     label:'What to Write in an Anniversary Card (75 Lines)' },
      { to:'/blog/wedding-anniversary-messages-nigerian-couple',     label:'Anniversary Messages by Year (1st to 25th)' },
      { to:'/blog/wedding-anniversary-messages-nigerian-couple',     label:'Anniversary Messages for a Couple (Real Ones)' },
      { to:'/blog/wedding-anniversary-messages-nigerian-couple',     label:'Anniversary Messages for Friends' },
      { to:'/blog/wedding-anniversary-messages-nigerian-couple',     label:'Anniversary Messages for Your Parents' },
    ],
  },
  {
    heading: 'Holiday & Seasonal',
    links: [
      { to:'/cards/mothers-day',                                     label:"What to Write in a Mother's Day Card" },
      { to:'/cards/christmas',                                       label:'Christmas Group Card Messages for Anyone' },
      { to:'/blog/birthday-prayers-for-friend-family-boss-nigeria',  label:'Eid Mubarak Wishes & Messages' },
      { to:'/cards/fathers-day',                                     label:"Father's Day Messages Worth Writing" },
      { to:'/blog/birthday-prayers-for-friend-family-boss-nigeria',  label:'New Year Wishes for Colleagues Nigeria' },
    ],
  },
  {
    heading: 'More',
    links: [
      { to:'/blog/what-to-write-farewell-card-colleague-nigeria',    label:'What to Write for a Colleague Leaving' },
      { to:'/blog/group-cards-remote-teams-inclusion',               label:'What to Write for a Remote Coworker' },
      { to:'/blog/baby-shower-group-card-ideas-celebrate-new-mum',   label:'What to Write in a Baby Shower Card' },
      { to:'/blog/what-to-write-birthday-card-boss-nigeria',         label:'What to Write in a Card for Your Manager' },
      { to:'/blog/how-to-surprise-someone-birthday-nigeria-ideas',   label:'What to Write in a Card for a Special Occasion' },
    ],
  },
];

const Footer = () => (
  <footer style={{ background:'linear-gradient(180deg,#F5F0FF,#EDE5FF)' }} className="border-t border-purple-100 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

      {/* ── Top row: Brand + Occasions + More Cards + Product + Company ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 mb-10">

        {/* Brand */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <Link to="/" onClick={scrollTop} className="flex items-center gap-2.5 mb-4">
            <img src="/android-chrome-192x192.png" alt="Thankeeu"
              className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
            <span className="font-display font-bold text-xl text-warm-900">
              thank<span className="text-primary-500">eeu</span>
            </span>
          </Link>
          <p className="text-sm text-warm-600 leading-relaxed mb-5">
            Get the whole crew on one card — birthday, farewell, retirement, anniversary and more. Everyone signs, gifts pool in Naira or GBP. Free to start.
          </p>
          <div className="flex gap-3 flex-wrap">
            {/* X / Twitter */}
            <a href="https://twitter.com/thankeeu" target="_blank" rel="noopener noreferrer" aria-label="Thankeeu on X (Twitter)"
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-purple-100 text-warm-500 hover:text-[#000000] hover:border-warm-300 transition-colors shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.265 5.635L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            {/* Instagram */}
            <a href="https://www.instagram.com/thankeeu" target="_blank" rel="noopener noreferrer" aria-label="Thankeeu on Instagram"
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-purple-100 text-warm-500 hover:text-[#E1306C] hover:border-pink-200 transition-colors shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            </a>
            {/* LinkedIn */}
            <a href="https://www.linkedin.com/company/thankeeu" target="_blank" rel="noopener noreferrer" aria-label="Thankeeu on LinkedIn"
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-purple-100 text-warm-500 hover:text-[#0A66C2] hover:border-blue-200 transition-colors shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            {/* TikTok */}
            <a href="https://www.tiktok.com/@thankeeu" target="_blank" rel="noopener noreferrer" aria-label="Thankeeu on TikTok"
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-purple-100 text-warm-500 hover:text-[#000000] hover:border-warm-300 transition-colors shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.26 8.26 0 0 0 4.83 1.55V6.79a4.85 4.85 0 0 1-1.06-.1z"/></svg>
            </a>
            {/* Facebook */}
            <a href="https://www.facebook.com/thankeeu" target="_blank" rel="noopener noreferrer" aria-label="Thankeeu on Facebook"
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-purple-100 text-warm-500 hover:text-[#1877F2] hover:border-blue-200 transition-colors shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
          </div>
        </div>

        {/* Occasions — first 13 */}
        <div>
          <p className="font-bold text-warm-900 text-sm mb-4">Occasions</p>
          <ul className="space-y-2">
            {[
              { to:'/occasions/birthday',    label:'Birthday' },
              { to:'/occasions/farewell',    label:'Farewell' },
              { to:'/cards/leaving-card',    label:'Leaving' },
              { to:'/cards/retirement',      label:'Retirement' },
              { to:'/occasions/anniversary', label:'Anniversary' },
              { to:'/cards/get-well-soon',   label:'Get Well Soon' },
              { to:'/cards/sympathy',        label:'Sympathy' },
              { to:'/cards/thank-you',       label:'Thank You' },
              { to:'/occasions/graduation',  label:'Graduation' },
              { to:'/occasions/promotion',   label:'Promotion' },
              { to:'/cards/christmas',       label:'Christmas' },
              { to:'/cards/welcome',         label:'Welcome' },
              { to:'/cards/good-luck',       label:'Good Luck' },
            ].map(({ to, label }) => (
              <li key={to}><Link to={to} onClick={scrollTop}
                className="text-xs text-warm-600 hover:text-primary-600 font-medium transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* More Cards — last 12 */}
        <div>
          <p className="font-bold text-warm-900 text-sm mb-4">More Cards</p>
          <ul className="space-y-2">
            {[
              { to:'/cards/baby-shower',     label:'Baby Shower' },
              { to:'/occasions/new-baby',    label:'New Baby' },
              { to:'/cards/engagement',      label:'Engagement' },
              { to:'/occasions/wedding',     label:'Wedding' },
              { to:'/cards/maternity-leave', label:'Maternity Leave' },
              { to:'/cards/new-home',        label:'New Home' },
              { to:'/cards/boss-day',        label:"Boss's Day" },
              { to:'/cards/thanksgiving',    label:'Thanksgiving' },
              { to:'/cards/mothers-day',     label:"Mother's Day" },
              { to:'/cards/fathers-day',     label:"Father's Day" },
              { to:'/cards/teacher-thank-you', label:'Teacher Thank You' },
              { to:'/cards/administrative-professionals-day', label:'Admin Pro Day' },
            ].map(({ to, label }) => (
              <li key={to}><Link to={to} onClick={scrollTop}
                className="text-xs text-warm-600 hover:text-primary-600 font-medium transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Product */}
        <div>
          <p className="font-bold text-warm-900 text-sm mb-4">Product</p>
          <ul className="space-y-2">
            {[
              { to:'/',                   label:'Home' },
              { to:'/create-card',        label:'Create a card' },
              { to:'/pricing',            label:'Pricing' },
              { to:'/culture-and-engagements', label:'Culture and Engagements' },
              { to:'https://games.thankeeu.com/gifts', label:'Games Gift Sponsors' },
              { to:'https://games.thankeeu.com/sponsor', label:'Sponsor Games' },
              { to:'/memory-movie',       label:'Memory Movie™' },
              { to:'/live-memory-wall',   label:'Live Memory Wall™' },
              { to:'/faq',               label:'FAQ' },
              { to:'/company/signup',    label:'For Business' },
              { to:'/sample',            label:'Demo card' },
            ].map(({ to, label }) => (
              <li key={to}>{to.startsWith('http') ? (
                <a href={to} className="text-xs text-warm-600 hover:text-primary-600 font-medium transition-colors">{label}</a>
              ) : (
                <Link to={to} onClick={scrollTop} className="text-xs text-warm-600 hover:text-primary-600 font-medium transition-colors">{label}</Link>
              )}</li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <p className="font-bold text-warm-900 text-sm mb-4">Company</p>
          <ul className="space-y-2 mb-6">
            {[
              { to:'/how-it-works', label:'About Thankeeu' },
              { to:'/faq',          label:'Help Centre' },
              { to:'/policy',       label:'Terms of Service' },
              { to:'/policy',       label:'Privacy Policy' },
            ].map(({ to, label }) => (
              <li key={label}><Link to={to} onClick={scrollTop}
                className="text-xs text-warm-600 hover:text-primary-600 font-medium transition-colors">{label}</Link></li>
            ))}
            <li>
              <a href="mailto:support@thankeeu.com"
                className="text-xs text-warm-600 hover:text-primary-600 font-medium transition-colors">
                support@thankeeu.com
              </a>
            </li>
          </ul>
          <p className="font-bold text-warm-900 text-sm mb-4">Markets</p>
          <ul className="space-y-2">
            {[
              { to:'/online-group-cards-uk',         label:'Group Cards UK' },
              { to:'/online-group-cards-us',         label:'Group Cards US' },
              { to:'/online-group-cards-canada',     label:'Group Cards Canada' },
              { to:'/online-group-cards-nigeria',    label:'Group Cards Nigeria' },
              { to:'/online-birthday-cards-nigeria', label:'Birthday Cards Nigeria' },
            ].map(({ to, label }) => (
              <li key={to}><Link to={to} onClick={scrollTop}
                className="text-xs text-warm-600 hover:text-primary-600 font-medium transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Use Cases — 4 columns ── */}
      <div className="border-t border-purple-100 pt-10 mb-10">
        <p className="font-bold text-warm-900 text-sm mb-6">Use Cases</p>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
          {/* Column 1 */}
          <ul className="space-y-2">
            <li className="text-xs font-bold text-warm-700 mb-1">Group Cards</li>
            {USE_CASE_COL1.map(({ to, label }, i) => (
              <li key={`uc1-${i}`}><Link to={to} onClick={scrollTop} className="text-xs text-warm-500 hover:text-primary-600 transition-colors leading-snug block">{label}</Link></li>
            ))}
          </ul>
          {/* Column 2 */}
          <ul className="space-y-2">
            <li className="text-xs font-bold text-warm-700 mb-1">Memory & Walls</li>
            {USE_CASE_COL2.map(({ to, label }, i) => (
              <li key={`uc2-${i}`}><Link to={to} onClick={scrollTop} className="text-xs text-warm-500 hover:text-primary-600 transition-colors leading-snug block">{label}</Link></li>
            ))}
          </ul>
          {/* Column 3 */}
          <ul className="space-y-2">
            <li className="text-xs font-bold text-warm-700 mb-1">By Region</li>
            {USE_CASE_COL3.map(({ to, label }, i) => (
              <li key={`uc3-${i}`}><Link to={to} onClick={scrollTop} className="text-xs text-warm-500 hover:text-primary-600 transition-colors leading-snug block">{label}</Link></li>
            ))}
          </ul>
          {/* Column 4 */}
          <ul className="space-y-2">
            <li className="text-xs font-bold text-warm-700 mb-1">Weddings</li>
            {USE_CASE_COL4.map(({ to, label }, i) => (
              <li key={`uc4-${i}`}><Link to={to} onClick={scrollTop} className="text-xs text-warm-500 hover:text-primary-600 transition-colors leading-snug block">{label}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Comparisons ── */}
      <div className="border-t border-purple-100 pt-10 mb-10">
        <p className="font-bold text-warm-900 text-sm mb-6">Comparisons</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-2">
          {[
            { to:'/thankeeu-vs-thankbox',           label:'Thankeeu vs Thankbox' },
            { to:'/thankeeu-vs-kudoboard',           label:'Thankeeu vs Kudoboard' },
            { to:'/thankeeu-vs-wedtrove',            label:'Thankeeu vs Wedtrove' },
            { to:'/guestpix-alternative',            label:'GuestPix Alternative' },
            { to:'/weduploader-alternative',         label:'WedUploader Alternative' },
            { to:'/kululu-alternative',              label:'Kululu Alternative' },
            { to:'/pov-alternative',                 label:'POV Alternative' },
            { to:'/guestcam-alternative',            label:'GuestCam Alternative' },
            { to:'/best-wedding-photo-sharing-app',  label:'Best Wedding Photo App' },
            { to:'/wedding-photo-album-online',      label:'Wedding Photo Album Online' },
            { to:'/wedding-guest-photo-collection',  label:'Wedding Guest Photo Collection' },
            { to:'/wedding-voice-note-guest-book',   label:'Wedding Voice Note Book' },
            { to:'/canva-cards-alternative',         label:'Canva Cards Alternative' },
            { to:'/groupgreeting-alternative',       label:'GroupGreeting Alternative' },
            { to:'/sendwishonline-alternative',      label:'SendWishOnline Alternative' },
            { to:'/thankeeu-vs-thankbox-vs-kudoboard', label:'Thankeeu vs Thankbox vs Kudoboard' },
          ].map(({ to, label }) => (
            <div key={to}><Link to={to} onClick={scrollTop} className="text-xs text-warm-500 hover:text-primary-600 transition-colors leading-snug block">{label}</Link></div>
          ))}
        </div>
      </div>

      {/* ── Articles — full width, all 12 categories ── */}
      <div className="border-t border-purple-100 pt-10 mb-10">
        <div className="flex items-center justify-between mb-6">
          <p className="font-bold text-warm-900 text-sm">Articles</p>
          <Link to="/blog" onClick={scrollTop}
            className="text-xs text-primary-600 hover:underline font-medium">All articles →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {ARTICLE_SECTIONS.map(section => (
            <div key={section.heading}>
              <p className="text-xs font-bold text-warm-700 mb-3">{section.heading}</p>
              <ul className="space-y-2">
                {section.links.map(({ to, label }, i) => (
                  <li key={`${section.heading}-${i}`}>
                    <Link to={to} onClick={scrollTop}
                      className="text-xs text-warm-500 hover:text-primary-600 transition-colors leading-snug block">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-purple-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-warm-500 text-center sm:text-left">
          © {new Date().getFullYear()} Thankeeu &nbsp;·&nbsp; support@thankeeu.com
        </p>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-xs px-3 py-1.5 rounded-xl font-bold"
            style={{ background:'#F5F0FF', color:'#7C3AED', border:'1.5px solid #DDD6FE' }}>
            Secure payments
          </span>
          <span className="text-xs px-3 py-1.5 rounded-xl font-bold"
            style={{ background:'#F0FDF4', color:'#15803D', border:'1.5px solid #BBF7D0' }}>
            30+ countries
          </span>
          <span className="text-xs px-3 py-1.5 rounded-xl font-bold"
            style={{ background:'#FFF7ED', color:'#C2410C', border:'1.5px solid #FED7AA' }}>
            Zero paper. Zero waste.
          </span>
        </div>
      </div>

    </div>
  </footer>
);

export default Footer;
