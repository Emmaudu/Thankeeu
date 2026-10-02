import { CheckCircle, Briefcase, MessageSquare, Lock, Star, List, MapPin, Key, DollarSign, ShoppingCart, Shield, Camera, Landmark } from 'lucide-react';
import { useState } from 'react';
import SEO, { makeFAQSchema } from '../components/seo/SEO';
import { Link } from 'react-router-dom';

const REQUESTER_STEPS = [
  { n:'01', emoji:'', title:'Post Your Task', desc:'Describe what you need done: pickup & delivery, on-location errand, equipment purchase & shipping, or a general errand. Set your city, deadline, and optional budget.' },
  { n:'02', icon:'brief', title:'Review Bids', desc:'Verified taskers in your area see your task and place bids with their workmanship price. Review each tasker\'s rating, completed task count, and bid message.' },
  { n:'03', icon:'check', title:'Accept a Tasker', desc:'Accept the bid that fits your budget and trust level. A real-time chat room opens immediately for both of you to communicate.' },
  { n:'04', icon:'chat', title:'Chat & Finalize Payment', desc:'Chat in real-time, share files, and agree on final details. You can also call your tasker directly from the chat. Set up the payment window with equipment, shipment, and workmanship costs.' },
  { n:'05', icon:'lock', title:'Generate Your Completion Code', desc:'Once you are satisfied the task is done (you have received your item or the errand is complete), generate a 6-digit code from your dashboard. It is emailed to you too.' },
  { n:'06', icon:'star', title:'Share Code & Rate', desc:'Give the code to your tasker. They enter it to close the task and trigger their workmanship payment. Then rate and review the tasker.' },
];

const TASKER_STEPS = [
  { n:'01', icon:'list', title:'3-Step Signup', desc:'Create your account, upload a profile photo, then submit your ID documents, address, social media, and bank details for admin verification.' },
  { n:'02', emoji:'', title:'Admin Review', desc:'Our team reviews your KYC documents within 24 to 48 hours. You will get an email notification once approved. This keeps both taskers and requesters safe.' },
  { n:'03', icon:'pin', title:'Set Your Task City', desc:'Once approved, set your active task city. You will receive notifications for tasks posted in or near your city. You can update this anytime, which is useful when travelling.' },
  { n:'04', icon:'brief', title:'Browse & Bid', desc:'Browse tasks in your dashboard or explore all tasks. Place bids with your workmanship price and a short introduction message. Or get hired directly by a requester.' },
  { n:'05', icon:'chat', title:'Chat, Agree & Execute', desc:'Once your bid is accepted, chat and finalize all details. The requester sets up the payment window. Workmanship, equipment, and shipping costs are handled separately.' },
  { n:'06', icon:'key', title:'Get the Code & Get Paid', desc:'Complete the task, then get the 6-digit code from the requester. Enter it in your dashboard to close the task. Workmanship payment is released to your bank account instantly.' },
];

const PAYMENT_FLOWS = [
  {
    type: 'Simple Workmanship',
    icon: 'money',
    desc: 'For standard errands with no equipment purchase.',
    steps: [
      'Requester sets workmanship amount in payment window',
      'Requester pays via Flutterwave, and funds enter Taskeeu escrow',
      'Tasker completes task and gets 6-digit code from requester',
      'Code entered → workmanship payment instantly released to tasker bank account',
    ],
  },
  {
    type: 'Equipment Purchase + Workmanship',
    icon: 'cart',
    desc: 'For tasks requiring buying and shipping an item.',
    steps: [
      'Requester sets equipment + shipment + workmanship costs in payment window',
      'Equipment and shipment costs paid into Taskeeu escrow via Flutterwave',
      'Tasker uploads photo proof (item, price tag, store environment)',
      'Requester reviews proof photos and clicks OK to release equipment funds',
      'Equipment + shipment funds transferred to tasker account immediately',
      'Tasker purchases item and arranges shipping',
      'Once item received, requester generates 6-digit completion code',
      'Tasker enters code → workmanship payment released instantly',
    ],
  },
];

const SAFETY_FEATURES = [
  { icon:'id', title:'Full KYC Verification', desc:'Every tasker submits national ID, proof of address, social media profiles, and bank details. All reviewed by a human admin before activation.' },
  { icon:'camera', title:'Equipment Photo Evidence', desc:'For purchase tasks, taskers must upload photos of the item with its price tag and store environment before funds move. No photo = no money.' },
  { icon:'lock', title:'Completion Code System', desc:'Workmanship payment only releases when the requester shares a private 6-digit code, ensuring the task is confirmed complete before final payment.' },
  { icon:'bank', title:'Escrow Protection', desc:'All task payments go to Taskeeu escrow first. Funds only move to the tasker under the exact conditions agreed upon, not before.' },
  { emoji:'', title:'Instant Refund System', desc:'If something goes wrong, requesters can open a refund request. Taskers approve and send money back through the platform. No external bank transfers needed.' },
  { icon:'star', title:'Public Ratings', desc:'Every completed task gets rated. Ratings are public and permanent. High-rated taskers earn more. Consistently poor taskers can be removed.' },
  { emoji:'', title:'Direct Phone Call', desc:'Taskers phone numbers are visible in the chat. Requesters can call directly: real phone calls, not in-app VOIP that can drop.' },
  { emoji:'', title:'No External Transfers', desc:'All payments go through Flutterwave within Taskeeu. We strongly advise against any cash or external transfers that cannot be protected by our escrow.' },
];

const FAQS = [
  { q:'What if my tasker does not show up?', a:'You can cancel and request a full refund if no work has started. If partial work was done, open a refund for the unused portion. Our team reviews disputes within 24 hours.' },
  { q:'What if the item purchased is wrong?', a:'The equipment proof photo system requires the tasker to show you the exact item before purchasing. You approve with an OK click. If they buy the wrong item, open a dispute immediately.' },
  { q:'Can I contact a tasker before hiring?', a:'Yes! You can message taskers directly from their profile page without an active task. Simply apply to a tasker with a description of what you need.' },
  { q:'How fast are payouts to taskers?', a:'Equipment funds: released immediately after requester OK. Workmanship: released instantly after the completion code is entered. Bank transfers via Flutterwave typically arrive within 1 to 3 minutes.' },
  { q:"What is Taskeeu's fee?", a:'Taskeeu charges a 10% platform fee on workmanship payments. Equipment and shipment costs have no additional fee.' },
  { q:'Can a tasker operate in multiple cities?', a:'Taskers have a single active Task City at any time but can update it anytime, which is great for taskers who travel frequently.' },
  { q:'Is my bank account information safe?', a:'Bank details are encrypted and only used for payment disbursements via Flutterwave. Staff can never access or move your funds without a triggered payment event.' },
  { q:'What happens if a requester never gives the code?', a:'After task completion, if the requester does not generate a code within 72 hours, you can raise a dispute. Admin reviews and can release payment if the task is evidently complete.' },
];

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <>
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
        <span className="font-semibold text-gray-800 text-sm pr-4">{question}</span>
        <span className={`text-rose-500 transition-transform flex-shrink-0 text-lg ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-muted leading-relaxed border-t border-gray-100 pt-4">{answer}</div>
      )}
    </div>
  
    </>);
}


function getIcon(icon) {
  const cls = "text-rose-500";
  const sz = 24;
  const map = {
    brief: <Briefcase size={sz} className={cls} />,
    check: <CheckCircle size={sz} className={cls} />,
    chat: <MessageSquare size={sz} className={cls} />,
    lock: <Lock size={sz} className={cls} />,
    star: <Star size={sz} className={cls} />,
    list: <List size={sz} className={cls} />,
    pin: <MapPin size={sz} className={cls} />,
    key: <Key size={sz} className={cls} />,
    money: <DollarSign size={sz} className={cls} />,
    cart: <ShoppingCart size={sz} className={cls} />,
    id: <Shield size={sz} className={cls} />,
    camera: <Camera size={sz} className={cls} />,
    bank: <Landmark size={sz} className={cls} />,
  };
  return map[icon] || <CheckCircle size={sz} className={cls} />;
}

export default function HowItWorks() {
  return (
    <>
      <SEO
        title="How Taskeeu Works | Post Tasks, Get Things Done" description="Learn how Taskeeu connects you with verified taskers across Africa. Post a task in minutes, review bids, pay securely via escrow." canonical="https://taskeeu.com/how-it-works" keywords="how Taskeeu works, task outsourcing Africa, hire verified tasker steps" breadcrumbs={[{name:'Home',url:'https://taskeeu.com'},{name:'How It Works',url:'https://taskeeu.com/how-it-works'}]}
      />
    <div className="pt-20 page-enter">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100 py-16 md:py-24">
        <div className="container-xl text-center">
          <span className="badge-green mb-4 inline-flex">Platform Guide</span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-dark mb-5">How Taskeeu Works</h1>
          <p className="text-muted text-lg max-w-2xl mx-auto leading-relaxed">A complete guide to getting things done across Africa, safely, quickly, and fairly for both requesters and taskers.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link to="/post-task" className="btn-primary">Post a Task Now</Link>
            <Link to="/tasker/signup" className="btn-outline">Become a Tasker</Link>
          </div>
        </div>
      </section>

      {/* For Requesters */}
      <section className="py-20 bg-surface">
        <div className="container-xl">
          <div className="text-center mb-14">
            <span className="badge-blue mb-3 inline-flex">For Task Requesters</span>
            <h2 className="font-heading text-3xl font-bold text-dark">How to get your tasks done</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REQUESTER_STEPS.map((step) => (
              <div key={step.n} className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500 flex items-center justify-center text-white font-heading font-bold text-sm">{step.n}</div>
                  <span className="text-3xl">{getIcon(step?.icon)}</span>
                </div>
                <h3 className="font-heading font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Taskers */}
      <section className="py-20 bg-white">
        <div className="container-xl">
          <div className="text-center mb-14">
            <span className="badge-green mb-3 inline-flex">For Taskers</span>
            <h2 className="font-heading text-3xl font-bold text-dark">How to earn on Taskeeu</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TASKER_STEPS.map((step) => (
              <div key={step.n} className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-dark flex items-center justify-center text-white font-heading font-bold text-sm">{step.n}</div>
                  <span className="text-3xl">{getIcon(step?.icon)}</span>
                </div>
                <h3 className="font-heading font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Flows */}
      <section className="py-20 bg-surface">
        <div className="container-xl">
          <div className="text-center mb-14">
            <span className="badge-yellow mb-3 inline-flex">Payment System</span>
            <h2 className="font-heading text-3xl font-bold text-dark">How payments work</h2>
            <p className="text-muted mt-3 max-w-xl mx-auto">Every payment is protected by escrow. Here is exactly how money flows on Taskeeu.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {PAYMENT_FLOWS.map((flow) => (
              <div key={flow.type} className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{getIcon(flow.icon)}</span>
                  <div>
                    <h3 className="font-heading font-bold text-gray-900">{flow.type}</h3>
                    <p className="text-sm text-muted">{flow.desc}</p>
                  </div>
                </div>
                <ol className="space-y-2.5">
                  {flow.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</div>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Features */}
      <section className="py-20 bg-white">
        <div className="container-xl">
          <div className="text-center mb-14">
            <span className="badge-green mb-3 inline-flex">Trust & Safety</span>
            <h2 className="font-heading text-3xl font-bold text-dark">How we keep everyone safe</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SAFETY_FEATURES.map((f) => (
              <div key={f.title} className="card p-5">
                <div className="text-3xl mb-3">{getIcon(f?.icon)}</div>
                <h3 className="font-heading font-semibold text-gray-900 text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-surface">
        <div className="container-xl max-w-3xl">
          <div className="text-center mb-12">
            <span className="badge-blue mb-3 inline-flex">FAQs</span>
            <h2 className="font-heading text-3xl font-bold text-dark">Common Questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, i) => <FAQItem key={i} question={faq.q} answer={faq.a} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 hero-gradient hero-mesh">
        <div className="container-xl text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-5">Ready to try Taskeeu? </h2>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">Post your first task in under 2 minutes, or sign up as a verified tasker today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/post-task" className="btn-primary btn-lg">Post a Task</Link>
            <Link to="/tasker/signup" className="bg-white/10 border border-white/25 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/20 transition-colors text-lg">Become a Tasker</Link>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
