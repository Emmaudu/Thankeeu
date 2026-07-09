import { Link } from 'react-router-dom';

const scrollTop = () => window.scrollTo({ top: 0, behavior: 'instant' });

// ── Use Cases (mirrors Recocards exact 22 use-case structure) ─────────────────
const USE_CASE_LINKS = [
  { to:'/occasions/anniversary',                      label:'Free Anniversary Group Cards' },
  { to:'/cards/christmas',                            label:'Free Christmas Group Cards' },
  { to:'/occasions/graduation',                       label:'Free Congratulations Group Cards' },
  { to:'/occasions/birthday',                         label:'Free Group Birthday Cards' },
  { to:'/cards/get-well-soon',                        label:'Free Get Well Soon Group Cards' },
  { to:'/cards/sympathy',                             label:'Free Sympathy Group Cards' },
  { to:'/cards/thank-you',                            label:'Free Thank You Group Cards' },
  { to:'/online-birthday-cards-nigeria',              label:'Free Online Birthday Cards Nigeria' },
  { to:'/occasions/birthday',                         label:'Free Group Card With Multiple Signatures' },
  { to:'/occasions/farewell',                         label:'Free Group Cards With Multiple Signers' },
  { to:'/occasions/birthday',                         label:'Free Group Electronic Cards' },
  { to:'/occasions/birthday',                         label:'Free Group Gift Cards' },
  { to:'/occasions/birthday',                         label:'Free GroupGreeting Cards' },
  { to:'/occasions/birthday',                         label:'Free Online Birthday Group Cards' },
  { to:'/cards/leaving-card',                         label:'Virtual Farewell Cards Online' },
  { to:'/blog/what-to-write-farewell-card-colleague-nigeria',   label:'What to Write in a Farewell Card' },
  { to:'/blog/get-well-soon-messages-colleague-friend-nigeria', label:'Get Well Soon Messages' },
  { to:'/cards/leaving-card',                         label:'Online Group Cards Together, Free' },
  { to:'/online-group-cards-uk',                      label:'Free Kudoboard Alternative UK' },
  { to:'/blog/thankbox-vs-kudoboard-vs-thankeeu-uk-2025', label:'Free Thankbox Alternative' },
  { to:'/blog/what-to-write-birthday-card-boss-nigeria',   label:'What to Write in a Birthday Card' },
  { to:'/cards/sympathy',                             label:'What to Write in a Sympathy Card' },
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

      {/* ── Top row: Brand + Use Cases + Product + Company ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-10">

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
          <div className="flex gap-2 flex-wrap">
            {[
              { href:'https://twitter.com/thankeeu',               label:'Twitter/X' },
              { href:'https://www.instagram.com/thankeeu',         label:'Instagram' },
              { href:'https://www.linkedin.com/company/thankeeu',  label:'LinkedIn' },
            ].map(({ href, label }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-purple-100 text-warm-600 hover:text-primary-600 hover:border-primary-200 transition-colors font-medium">
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="col-span-2 lg:col-span-2">
          <p className="font-bold text-warm-900 text-sm mb-4">Use Cases</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
            {USE_CASE_LINKS.map(({ to, label }, i) => (
              <li key={`uc-${i}`}>
                <Link to={to} onClick={scrollTop}
                  className="text-xs text-warm-600 hover:text-primary-600 font-medium transition-colors leading-snug">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Product */}
        <div>
          <p className="font-bold text-warm-900 text-sm mb-4">Product</p>
          <ul className="space-y-2 mb-6">
            {[
              { to:'/',               label:'Home' },
              { to:'/create-card',    label:'Create a card' },
              { to:'/pricing',        label:'Pricing' },
              { to:'/faq',            label:'FAQ' },
              { to:'/company/signup', label:'For Business' },
              { to:'/sample',         label:'Demo card' },
            ].map(({ to, label }) => (
              <li key={to}><Link to={to} onClick={scrollTop}
                className="text-xs text-warm-600 hover:text-primary-600 font-medium transition-colors">{label}</Link></li>
            ))}
          </ul>
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
              { to:'/online-group-cards-uk',      label:'Group Cards UK' },
              { to:'/online-group-cards-us',      label:'Group Cards US' },
              { to:'/online-group-cards-canada',  label:'Group Cards Canada' },
              { to:'/online-group-cards-nigeria', label:'Group Cards Nigeria' },
              { to:'/online-birthday-cards-nigeria', label:'Birthday Cards Nigeria' },
            ].map(({ to, label }) => (
              <li key={to}><Link to={to} onClick={scrollTop}
                className="text-xs text-warm-600 hover:text-primary-600 font-medium transition-colors">{label}</Link></li>
            ))}
          </ul>
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
          <span className="text-xs px-3 py-1.5 rounded-full font-bold"
            style={{ background:'#F5F0FF', color:'#7C3AED', border:'1.5px solid #DDD6FE' }}>
            🔒 Payments by Flutterwave
          </span>
          <span className="text-xs px-3 py-1.5 rounded-full font-bold"
            style={{ background:'#F0FDF4', color:'#15803D', border:'1.5px solid #BBF7D0' }}>
            🌍 30+ countries
          </span>
          <span className="text-xs px-3 py-1.5 rounded-full font-bold"
            style={{ background:'#FFF7ED', color:'#C2410C', border:'1.5px solid #FED7AA' }}>
            🌳 Zero paper. Zero waste.
          </span>
        </div>
      </div>

    </div>
  </footer>
);

export default Footer;
