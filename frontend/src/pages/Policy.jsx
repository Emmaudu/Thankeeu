import { useState } from 'react';
import SEO from '../components/seo/SEO';
import { clsx } from 'clsx';

const SECTIONS = [
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'terms', label: 'Terms of Service' },
  { id: 'trust', label: 'Trust & Safety' },
  { id: 'cookies', label: 'Cookie Policy' },
];

export default function Policy() {
  const [active, setActive] = useState(
    window.location.hash.replace('#', '') || 'privacy');

  return (
    <>
      <SEO
        title="Privacy Policy, Terms of Service & Legal" description="Read Taskeeu's privacy policy, terms of service, trust and safety standards, and cookie policy. We protect your data and ensure safe task outsourcing." canonical="https://taskeeu.com/policy" noindex={false}
        breadcrumbs={[{name:'Home',url:'https://taskeeu.com'},{name:'Legal & Policies',url:'https://taskeeu.com/policy'}]}
      />
    <div className="pt-20 min-h-screen bg-surface">
      <div className="bg-white border-b border-gray-100 py-10">
        <div className="container-xl text-center">
          <h1 className="font-heading text-3xl font-bold text-dark mb-2">Legal & Policies </h1>
          <p className="text-muted">Last updated: January 2025 · Taskeeu Technologies Ltd., Nigeria</p>
        </div>
      </div>

      <div className="container-xl py-10">
        <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto">
          {/* Sidebar Nav */}
          <div className="md:w-52 flex-shrink-0">
            <div className="card p-3 sticky top-24 space-y-1">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setActive(s.id); window.location.hash = s.id; }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
                    background: active === s.id ? 'var(--rose)' : 'transparent',
                    color: active === s.id ? 'white' : 'var(--text)',
                    boxShadow: active === s.id ? '0 2px 10px rgba(255,45,98,0.2)' : 'none',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 card p-8 prose prose-sm max-w-none">

            {/* ── PRIVACY POLICY ──────────────────────────────── */}
            {active === 'privacy' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-heading text-2xl font-bold text-dark">Privacy Policy</h2>
                <p className="text-muted text-sm">Effective: January 1, 2025</p>

                <Section title="1. Information We Collect">
                  <p>We collect information you provide directly when you create an account, post tasks, or complete KYC verification. This includes:</p>
                  <ul>
                    <li><strong>Account information:</strong> Full name, email address, phone number, and password (hashed).</li>
                    <li><strong>Tasker KYC data:</strong> Government-issued ID (National ID, Driver's License, or Passport), proof of home address, home and office addresses, social media profile links, and bank account details.</li>
                    <li><strong>Task data:</strong> Descriptions, locations, deadlines, and any uploaded media related to tasks.</li>
                    <li><strong>Payment data:</strong> Transaction amounts and references (we do not store full card numbers; payments are processed by Flutterwave).</li>
                    <li><strong>Communications:</strong> Chat messages, uploaded files, and notification interactions.</li>
                    <li><strong>Usage data:</strong> IP address, device type, browser, and session information for security purposes.</li>
                  </ul>
                </Section>

                <Section title="2. How We Use Your Information">
                  <ul>
                    <li>To verify tasker identities and maintain platform safety.</li>
                    <li>To match tasks with nearby verified taskers using location data.</li>
                    <li>To process payments and manage escrow transactions via Flutterwave.</li>
                    <li>To send email notifications about task activity, bids, payments, and security events.</li>
                    <li>To detect fraud, abuse, and policy violations.</li>
                    <li>To improve our platform services and user experience.</li>
                  </ul>
                </Section>

                <Section title="3. Information Sharing">
                  <p>We do not sell your personal data to third parties. We share data only in these contexts:</p>
                  <ul>
                    <li><strong>Between users:</strong> Task details visible to matching taskers. Tasker names, ratings, cities, and skills visible publicly on the tasker listing page.</li>
                    <li><strong>Payment processors:</strong> Flutterwave receives payment information needed to process transactions.</li>
                    <li><strong>Infrastructure providers:</strong> Supabase (database), Cloudinary (file storage), Resend (email), Railway (hosting). All bound by their own privacy policies and data protection agreements.</li>
                    <li><strong>Legal requirements:</strong> We may disclose information when required by Nigerian law, court order, or law enforcement.</li>
                  </ul>
                </Section>

                <Section title="4. Data Security">
                  <p>We implement industry-standard security measures including:</p>
                  <ul>
                    <li>All passwords are hashed using bcrypt with a minimum cost factor of 12.</li>
                    <li>All data in transit is encrypted via HTTPS/TLS.</li>
                    <li>KYC documents are stored in encrypted Cloudinary vaults with restricted access.</li>
                    <li>Bank account numbers in our database are not displayed in full. Only the last 4 digits shown in the UI.</li>
                    <li>JWT tokens expire after 7 days and are invalidated on logout.</li>
                  </ul>
                </Section>

                <Section title="5. Data Retention">
                  <p>Account data is retained for the lifetime of your account. After account deletion, personal data is removed within 30 days. Transaction records may be retained for up to 7 years for legal and accounting compliance. KYC documents are retained for 5 years as required by Nigerian financial regulations.</p>
                </Section>

                <Section title="6. Your Rights">
                  <p>You have the right to: access your personal data, request corrections, request deletion of your account and associated data, and opt out of marketing emails. Contact <a href="/contact" className="text-rose-600">our privacy team</a> to exercise these rights.</p>
                </Section>

                <Section title="7. Contact">
                  <p>Privacy questions: <a href="/contact" className="text-rose-600">our privacy team</a><br />
                  Taskeeu Technologies Ltd., Lagos, Nigeria</p>
                </Section>
              </div>
            )}

            {/* ── TERMS OF SERVICE ────────────────────────────── */}
            {active === 'terms' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-heading text-2xl font-bold text-dark">Terms of Service</h2>
                <p className="text-muted text-sm">Effective: January 1, 2025</p>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-800">By creating an account on Taskeeu, you agree to these Terms of Service in their entirety. Please read carefully.
                </div>

                <Section title="1. Platform Description">
                  <p>Taskeeu is a Nigerian task outsourcing marketplace connecting task requesters with verified local taskers. Taskeeu acts as an intermediary platform and escrow agent but is not a party to the task agreement between requesters and taskers.</p>
                </Section>

                <Section title="2. Eligibility">
                  <ul>
                    <li>You must be at least 18 years old to use Taskeeu.</li>
                    <li>You must be a resident of Nigeria or have a valid Nigerian bank account.</li>
                    <li>Taskers must pass full KYC verification and admin approval before taking tasks.</li>
                    <li>You may not create multiple accounts or share accounts with others.</li>
                  </ul>
                </Section>

                <Section title="3. Tasker Responsibilities">
                  <ul>
                    <li>All KYC documents submitted must be genuine and current. Submitting false documents is a criminal offence and will result in permanent ban and potential legal action.</li>
                    <li>Taskers must complete accepted tasks to the agreed standard and deadline.</li>
                    <li>Taskers must not request payments outside the Taskeeu platform.</li>
                    <li>Taskers must upload genuine photo evidence for equipment purchases before any funds are released.</li>
                    <li>Taskers are independent contractors, not employees of Taskeeu.</li>
                  </ul>
                </Section>

                <Section title="4. Requester Responsibilities">
                  <ul>
                    <li>Requesters must provide accurate task descriptions and locations.</li>
                    <li>Requesters must fund the payment window before the tasker begins equipment-related work.</li>
                    <li>Requesters must generate the completion code promptly after confirming task completion.</li>
                    <li>Requesters must not attempt to obtain task completion without releasing payment.</li>
                    <li>Requesters must not post tasks that involve illegal activities.</li>
                  </ul>
                </Section>

                <Section title="5. Prohibited Activities">
                  <p>The following are strictly prohibited on Taskeeu:</p>
                  <ul>
                    <li>Tasks involving illegal goods, substances, or activities.</li>
                    <li>Harassment, threats, or abusive behaviour toward other users.</li>
                    <li>Circumventing platform payments by arranging cash deals outside Taskeeu.</li>
                    <li>Submitting fake photo evidence for equipment purchases.</li>
                    <li>Creating fake accounts or reviews.</li>
                    <li>Attempting to defraud requesters or taskers through the platform.</li>
                  </ul>
                </Section>

                <Section title="6. Platform Fees">
                  <p>Taskeeu charges a <strong>10% platform fee</strong> on workmanship payments. This fee is deducted automatically from the workmanship amount before it is released to the tasker's bank account. Equipment and shipment costs have no additional platform fee.</p>
                </Section>

                <Section title="7. Payments & Escrow">
                  <p>All payments are processed through Flutterwave. Equipment and shipment funds are held in Taskeeu escrow until the requester confirms receipt of evidence. Workmanship payments are held until the completion code is entered. Taskeeu is not liable for Flutterwave processing delays.</p>
                </Section>

                <Section title="8. Disputes & Refunds">
                  <p>Dispute requests must be raised within 7 days of task completion or payment. Taskeeu admin reviews disputes within 24 to 48 hours. Decisions by Taskeeu admin are final. Refunds for valid disputes are processed within 3 to 5 business days to the requester's registered bank account.</p>
                </Section>

                <Section title="9. Termination">
                  <p>Taskeeu reserves the right to suspend or permanently ban any account that violates these Terms, engages in fraud, or poses a risk to platform safety, without prior notice in cases of serious violations.</p>
                </Section>

                <Section title="10. Limitation of Liability">
                  <p>Taskeeu is a marketplace platform. We are not liable for the quality, legality, or safety of tasks performed. Maximum liability to any user is limited to fees paid to Taskeeu in the 3 months preceding the claim.</p>
                </Section>
              </div>
            )}

            {/* ── TRUST & SAFETY ──────────────────────────────── */}
            {active === 'trust' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-heading text-2xl font-bold text-dark">Trust & Safety Policy</h2>

                <Section title="Our Commitment">
                  <p>Taskeeu is built specifically for the Nigerian market, where we understand the real concerns around scams, identity fraud, and payment disputes. Every safety feature is designed around these realities.</p>
                </Section>

                <Section title="Tasker Verification Process">
                  <p>Every tasker on Taskeeu goes through a rigorous 3-step verification:</p>
                  <ol>
                    <li><strong>Identity document:</strong> At least one government-issued ID (National ID Card, Driver's License, or International Passport).</li>
                    <li><strong>Proof of address:</strong> Utility bill, bank statement, or official document showing home address.</li>
                    <li><strong>Social media verification:</strong> Active social media profiles (Instagram, Facebook, Twitter, or LinkedIn) to establish digital identity.</li>
                    <li><strong>Bank account verification:</strong> Valid Nigerian bank account details for payment disbursements.</li>
                    <li><strong>Human admin review:</strong> All documents are reviewed by a Taskeeu admin before the tasker account is activated.</li>
                  </ol>
                </Section>

                <Section title="Equipment Purchase Safeguards">
                  <ul>
                    <li>Funds are held in escrow before any tasker begins purchasing.</li>
                    <li>Taskers must upload a minimum of 3 photos: the item, the price tag/receipt, and the store environment.</li>
                    <li>Requesters review all photos before clicking OK to release funds.</li>
                    <li>Any suspicious evidence can be reported before confirmation.</li>
                  </ul>
                </Section>

                <Section title="Reporting Misconduct">
                  <p>To report a fraudulent tasker, fake evidence, or threatening behaviour, <a href="/contact" className="text-rose-600">contact our safety team</a> with your task ID and a description. We respond within 24 hours.</p>
                </Section>

                <Section title="Fraud Prevention Tips">
                  <ul>
                    <li>Always pay through the Taskeeu platform, never cash or external transfers.</li>
                    <li>Review all proof photos carefully before releasing equipment funds.</li>
                    <li>Only share the completion code after you've physically received your item or confirmed the errand is done.</li>
                    <li>Never give your Taskeeu password or OTP to anyone claiming to be Taskeeu staff.</li>
                    <li>Don't continue a task with a tasker who asks for external bank transfers.</li>
                  </ul>
                </Section>
              </div>
            )}

            {/* ── COOKIES ─────────────────────────────────────── */}
            {active === 'cookies' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-heading text-2xl font-bold text-dark">Cookie Policy</h2>

                <Section title="What Are Cookies">
                  <p>Cookies are small text files stored on your device to help us provide a better experience. Taskeeu uses essential cookies only; we do not use advertising or tracking cookies.</p>
                </Section>

                <Section title="Cookies We Use">
                  <ul>
                    <li><strong>Authentication:</strong> We store your JWT session token in localStorage to keep you logged in.</li>
                    <li><strong>Preferences:</strong> UI preferences such as your last-selected dashboard tab.</li>
                    <li><strong>Security:</strong> CSRF protection tokens.</li>
                  </ul>
                </Section>

                <Section title="Third-Party Cookies">
                  <p>Flutterwave (our payment processor) may set cookies during the payment flow to prevent fraud and maintain session integrity. These are governed by Flutterwave's cookie policy.</p>
                </Section>

                <Section title="Managing Cookies">
                  <p>You can clear cookies through your browser settings. Note that clearing authentication cookies will log you out of Taskeeu. We do not support "cookie opt-out" for essential cookies as they are required for the platform to function.</p>
                </Section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  
    </>);
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="font-heading font-bold text-gray-800 text-base mb-3 border-l-4 border-rose-500 pl-3">{title}</h3>
      <div className="text-sm text-gray-700 leading-relaxed space-y-2 pl-3">{children}</div>
    </div>
  );
}
