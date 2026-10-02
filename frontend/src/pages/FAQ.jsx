import SEO from '../components/seo/SEO';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'What is Taskeeu?',
    a: 'Taskeeu is a task outsourcing platform that connects you with KYC-verified taskers who can handle errands, pickups, deliveries, verifications, and more across Africa, without you needing to be there physically.',
  },
  {
    q: 'How do payments work?',
    a: 'Payments are held in escrow by Taskeeu until the task is completed. You pay upfront, but the tasker only receives the funds once you confirm completion using a 6-digit code. This protects both sides.',
  },
  {
    q: 'How are taskers verified?',
    a: 'Every tasker must submit a government-issued ID, proof of address, and a clear face photo. Our legal team reviews each application before any tasker goes live on the platform.',
  },
  {
    q: 'What if my task is not done correctly?',
    a: 'You can raise a dispute through the platform. If the task was not completed as agreed, funds can be refunded. Our support team reviews every dispute within 24 to 48 hours.',
  },
  {
    q: 'How do I post a task?',
    a: 'Create a requester account, click "Post a Task", describe what you need, set a deadline and budget, and verified taskers near you will bid. You review bids and accept the one you prefer.',
  },
  {
    q: 'How do I become a tasker?',
    a: 'Sign up as a tasker, upload your profile photo and KYC documents (ID, proof of address), and submit your application. Our legal team typically reviews within 24 to 48 hours.',
  },
  {
    q: 'What task types are supported?',
    a: 'Pickups and deliveries, errands, shopping, document collection, equipment sourcing, on-site verifications, photography, admin tasks, and many more. If it can be done by a person on the ground, Taskeeu can handle it.',
  },
  {
    q: 'Is there a fee for requesters?',
    a: 'Posting tasks is free. Taskeeu charges a service fee on completed payments. See our Pricing page for full details.',
  },
  {
    q: 'How quickly can a task be accepted?',
    a: 'Most tasks in active cities receive bids within minutes of posting, especially during business hours.',
  },
  {
    q: 'What is Taskeeu for Teams?',
    a: 'Taskeeu for Teams is our enterprise product for companies that need to deploy verified taskers at scale across multiple branches, departments, and states, with centralised billing and reporting.',
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border-light)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}
      >
        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', flex: 1 }}>{q}</span>
        <ChevronDown size={18} style={{ color: 'var(--muted)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.75, paddingBottom: 20 }}>{a}</p>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <>
      <SEO title="FAQs | Taskeeu" description="Frequently asked questions about Taskeeu: how it works, payments, tasker verification, and more." />
      <div style={{ background: 'var(--surface)', minHeight: '100vh', paddingTop: 80 }}>
        <section style={{ background: 'linear-gradient(135deg, var(--dark) 0%, #1e0a30 100%)', padding: '64px 0' }}>
          <div className="container-xl text-center">
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 16 }}>Help Center</p>
            <h1 style={{ color: 'white', fontWeight: 900, fontSize: 38, letterSpacing: '-0.03em', marginBottom: 16 }}>Frequently Asked Questions</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
              Everything you need to know about Taskeeu. Can't find an answer? Visit <a href="/contact" style={{ color: 'var(--rose)' }}>our Contact page</a>
            </p>
          </div>
        </section>
        <section style={{ padding: '64px 0' }}>
          <div className="container-xl" style={{ maxWidth: 740 }}>
            <div className="card p-8">
              {FAQS.map(item => <FAQItem key={item.q} {...item} />)}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
