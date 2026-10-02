-- ============================================================
-- TASKEEU FOR TEAMS — Schema Update v2
-- Run AFTER teams-schema.sql
-- ============================================================

-- ── 1. ADD BRANCH TO COMPANIES ───────────────────────────────────
ALTER TABLE companies ADD COLUMN IF NOT EXISTS branch_name VARCHAR(150);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS branch_address TEXT;
-- compound unique: same company can have multiple branches
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_company_domain_key;
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_domain_branch_unique;
ALTER TABLE companies ADD CONSTRAINT companies_domain_branch_unique UNIQUE (company_domain, branch_name);

-- ── 2. UPDATE COMPANY_MEMBERS ────────────────────────────────────
-- Add team-leader pending right status (separate from membership)
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS leader_right_status VARCHAR(20) DEFAULT 'none'
  CHECK (leader_right_status IN ('none','pending','approved','rejected'));
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS leader_right_approved_at TIMESTAMPTZ;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS leader_right_approved_by UUID REFERENCES users(id);

-- ── 3. ENTERPRISE CERTIFICATION MODULES ──────────────────────────
CREATE TABLE IF NOT EXISTS enterprise_cert_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_number INTEGER UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(200),
  emoji VARCHAR(10),
  content JSONB NOT NULL, -- array of {heading, body, tips}
  requirements TEXT[],    -- checklist items
  estimated_minutes INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. TASKER MODULE COMPLETIONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS tasker_module_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tasker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES enterprise_cert_modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  time_spent_seconds INTEGER DEFAULT 0,
  UNIQUE(tasker_id, module_id)
);

-- ── 5. TASKER ENTERPRISE CERTIFICATIONS ──────────────────────────
CREATE TABLE IF NOT EXISTS tasker_enterprise_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tasker_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  is_valid BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT
);

-- Add enterprise badge to tasker_profiles
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS enterprise_certified BOOLEAN DEFAULT false;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS enterprise_certified_at TIMESTAMPTZ;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS enterprise_certificate_id UUID REFERENCES tasker_enterprise_certifications(id);

-- ── 6. ENTERPRISE PROOF FILES (enhanced) ─────────────────────────
-- Add more fields to enterprise_task_proofs for better auditing
ALTER TABLE enterprise_task_proofs ADD COLUMN IF NOT EXISTS proof_category VARCHAR(30)
  DEFAULT 'evidence' CHECK (proof_category IN ('evidence','gps_selfie','site_photo','before','during','after','receipt','other'));
ALTER TABLE enterprise_task_proofs ADD COLUMN IF NOT EXISTS device_info VARCHAR(200);
ALTER TABLE enterprise_task_proofs ADD COLUMN IF NOT EXISTS file_size_kb INTEGER;
ALTER TABLE enterprise_task_proofs ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);

-- ── 7. FILE HISTORY VIEW (for audit) ─────────────────────────────
-- Drop legacy TABLE or existing VIEW before recreating
DROP VIEW IF EXISTS company_task_file_history CASCADE;
DROP TABLE IF EXISTS company_task_file_history CASCADE;
CREATE OR REPLACE VIEW company_task_file_history AS
SELECT
  p.id AS proof_id,
  p.enterprise_task_id,
  p.bid_id,
  p.tasker_id,
  p.proof_type,
  p.proof_category,
  p.file_url,
  p.gps_lat,
  p.gps_lng,
  p.gps_address,
  p.taken_at,
  p.caption,
  p.is_approved,
  p.created_at AS uploaded_at,
  p.device_info,
  -- Task info
  t.title AS task_title,
  t.company_id,
  t.department_id,
  t.status AS task_status,
  t.member_department,
  t.completed_at AS task_completed_at,
  t.custom_task_type,
  -- Tasker info
  u.full_name AS tasker_name,
  u.email AS tasker_email,
  tp.task_city AS tasker_city,
  -- Task type
  tt.name AS task_type_name,
  tt.category AS task_type_category
FROM enterprise_task_proofs p
JOIN enterprise_tasks t ON t.id = p.enterprise_task_id
JOIN users u ON u.id = p.tasker_id
LEFT JOIN tasker_profiles tp ON tp.user_id = p.tasker_id
LEFT JOIN enterprise_task_types tt ON tt.id = t.task_type_id;

-- ── 8. SEED CERTIFICATION MODULES ────────────────────────────────
INSERT INTO enterprise_cert_modules (module_number, title, subtitle, emoji, estimated_minutes, requirements, content) VALUES

(1, 'Verification Tasks', 'KYC, Merchant, Address & Business Verification', '🔍', 12,
 ARRAY[
   'Carry a valid government-issued ID at all times',
   'Download and set up the Taskeeu Tasker App',
   'Ensure your phone camera is functional before deployment',
   'Review the task brief thoroughly before going to the field',
   'Never share company documents with unauthorised persons'
 ],
 '[
   {"heading":"What Are Verification Tasks?","body":"Verification tasks are among the most common enterprise assignments on Taskeeu for Teams. Companies — especially banks, fintechs, and telecoms — use verification tasks to confirm the identity, address, and legitimacy of merchants, customers, or businesses at physical locations. As an enterprise-certified tasker, you are the boots on the ground for these critical operations."},
   {"heading":"Types of Verification You May Perform","body":"KYC (Know Your Customer) Verification requires you to physically visit a customer and confirm their identity documents match company records. Merchant Verification involves visiting a business location to confirm it exists, is operational, and matches the details on file. Address Verification means confirming that a person actually lives at or operates from a stated address. Business Verification involves checking registration certificates, signage, staff presence, and general legitimacy of a business."},
   {"heading":"How to Conduct a Verification Visit","body":"Step 1: Read the full task brief before leaving. Know what you are looking for. Step 2: Arrive at the location within the SLA window. Step 3: Introduce yourself professionally, state the company that sent you, and present your Taskeeu authorization letter. Step 4: Collect the required evidence — photos of the premises, signage, documents presented, and the person if permitted. Step 5: Use your GPS Timestamp Camera app for all photos to automatically embed coordinates and time. Step 6: Upload all proofs immediately after the visit."},
   {"heading":"Professional Conduct","body":"Always be respectful and professional. You represent the company that hired Taskeeu, and your conduct reflects on them. Do not pressure or intimidate subjects. If you encounter resistance, document it and report to the requester via the Taskeeu chat. Never falsify records or claim to have visited a location you did not visit — this is fraud and leads to immediate platform ban and potential legal action."},
   {"heading":"What Good Proof Looks Like","body":"A good verification proof set includes: a GPS selfie showing you at the location with visible address/signage; a wide shot of the premises exterior; a photo of key evidence (ID, business certificate, meter, etc.); a timestamp confirming the date and time of your visit. The requester must be able to look at your photos and independently confirm the visit was genuine."}
 ]'::jsonb
),

(2, 'Telecom & Infrastructure Tasks', 'Tower Inspection, Fiber Networks, ATM & POS Verification', '📡', 15,
 ARRAY[
   'Never climb towers or enter restricted areas without written authorisation',
   'Wear engineering vest/reflector jacket at all telecom sites',
   'Inform site security of your purpose before starting work',
   'Do not touch or disturb any equipment unless specifically instructed',
   'Take photos from a safe distance; never approach high-voltage equipment'
 ],
 '[
   {"heading":"Telecom & Infrastructure Overview","body":"Telecom infrastructure tasks are high-value enterprise assignments that require both professionalism and safety awareness. These tasks involve visiting mobile network towers, fiber optic installations, ATM machines, POS terminals, and utility infrastructure to carry out inspection, documentation, and verification work for network operators, banks, and utilities companies."},
   {"heading":"Telecom Tower Inspection","body":"Telecom tower inspections involve visiting a base transceiver station (BTS) or cell tower site to document its condition, verify equipment presence, check power sources (diesel generator, solar), and report any damage or anomalies. You will photograph the tower structure, equipment cabinets, power systems, security fencing, and surrounding environment. You MUST wear a high-visibility vest and helmet at tower sites. Never climb the tower unless you are a certified rigger with specific written authorisation."},
   {"heading":"Fiber Network Inspection","body":"Fiber network inspections require you to trace or verify fiber optic cable runs, junction boxes, or street cabinets. You will document cable routing, conduit conditions, splice boxes, and any physical damage. Mark your GPS position at each inspection point. These assignments often cover multiple locations on a route — plan your journey efficiently and upload proofs at each checkpoint."},
   {"heading":"ATM & POS Verification","body":"ATM inspections involve visiting bank ATM locations to verify operational status, physical condition, branding compliance, and surrounding environment safety. POS terminal verification involves visiting merchants to confirm a POS device is present, installed correctly, and the merchant is actively using it. For both, photograph the machine, the surrounding area, any compliance stickers, and take a selfie with the equipment in frame to prove your presence."},
   {"heading":"Safety First at Infrastructure Sites","body":"Infrastructure sites can be hazardous. Before entering any site: confirm you have the authorization letter. Check in with the site manager or security officer. Wear all required PPE (helmet at construction/tower sites, high-vis vest at road sites). Never enter enclosed equipment rooms unless specifically authorised. Keep a safe distance from electrical panels, transformers, and moving equipment. If you feel unsafe at any point, leave the site and contact the requester immediately."}
 ]'::jsonb
),

(3, 'Inspection & Audit Tasks', 'Property, Warehouse, Construction, Vehicle & Compliance Inspections', '🏗️', 14,
 ARRAY[
   'Wear a hard hat (helmet) at all construction and warehouse sites',
   'Wear safety boots — no open-toed shoes at industrial sites',
   'Do not move or interfere with any goods, machinery, or documents',
   'Use a systematic photo sequence: exterior, interior, key details, GPS selfie',
   'Report any safety hazards observed to the requester immediately'
 ],
 '[
   {"heading":"What Are Inspection Tasks?","body":"Inspection tasks require you to visit a physical location and produce a comprehensive visual and written record of what you observe. These are used by insurance companies for claims assessment, real estate firms for property condition reports, logistics companies for warehouse audits, and employers for workplace safety compliance. The quality of your inspection determines whether the company can make important decisions."},
   {"heading":"Property & Real Estate Inspections","body":"For property inspections, you will document the current condition of a building — its exterior, interior rooms, infrastructure (electrical, plumbing), and surrounding area. For tenant occupancy checks, confirm whether a property is occupied, by whom, and in what condition. For real estate walkthroughs, provide a complete visual tour — photograph every room, every angle, the building entrance, the neighborhood, and any defects. Your job is to be the eyes of someone who cannot be there."},
   {"heading":"Warehouse & Construction Site Inspections","body":"Warehouse inspections require you to document storage conditions, stock levels (if visible), safety signage, fire equipment, exits, and general organisation. Construction site inspections document the stage of construction, presence of workers, materials on site, equipment, and compliance with safety standards. At construction sites you MUST wear a helmet and safety boots — no exceptions. If PPE is not provided and you do not have your own, do not enter the site."},
   {"heading":"Vehicle Inspections","body":"Vehicle inspections require you to photograph all angles of a vehicle (front, rear, both sides, interior, dashboard, engine bay if accessible, undercarriage if required). Note the number plate, VIN if visible, odometer reading, and any damage. For truck inspections at logistics depots, additionally document cargo loading status, tyre condition, and roadworthiness indicators."},
   {"heading":"Retail Shelf Audits & Brand Compliance","body":"Retail audits involve visiting stores to verify that products are on shelves, properly displayed, correctly priced, and compliant with brand guidelines. Mystery shopping tasks require you to pose as a regular customer and evaluate the store experience. For competitor price monitoring, you visit stores and photograph price tags of specified products. For brand compliance audits, compare current in-store displays against the reference images provided in the task brief."}
 ]'::jsonb
),

(4, 'Field Operations & Logistics Tasks', 'Pickup, Delivery, Surveys, Procurement & Emergency Dispatch', '🚚', 12,
 ARRAY[
   'Confirm receipt of items with sender before leaving pickup location',
   'Never open sealed packages unless explicitly required by the task brief',
   'Take a handover photo when delivering — recipient must be in frame',
   'For procurement tasks, photograph the item AND the price tag before purchase',
   'For surveys, record responses accurately — never fabricate data'
 ],
 '[
   {"heading":"Field Operations Overview","body":"Field operations tasks are the most varied category on Taskeeu for Teams. They include pickup and delivery runs, market surveys, local procurement, NGO distribution verification, and emergency dispatch. These tasks require efficiency, reliability, and excellent communication with the requester throughout the assignment."},
   {"heading":"Pickup & Delivery Tasks","body":"Pickup and delivery tasks require you to collect an item from one location and deliver it to another. Before picking up: confirm the item description matches what you are handed, photograph it, and take a GPS selfie at the pickup location. During transit: handle items carefully and keep the requester informed of your progress. At delivery: photograph the item being handed over, with the recipient visible, and record the time. Never leave items unattended or pass them to unauthorised persons."},
   {"heading":"Local Procurement Tasks","body":"Procurement tasks require you to purchase a specific item on behalf of the company and either deliver it or arrange shipping. Before purchasing: upload photos of the item and its price tag to the proof system for requester confirmation. Wait for approval before purchasing. After purchasing: photograph the receipt, the item in its packaging, and take a selfie at the store. For shipping: photograph the packaged item at the logistics office, the waybill, and the estimated delivery timeline."},
   {"heading":"NGO Field Surveys & Aid Distribution","body":"Survey tasks require you to collect data from respondents according to a questionnaire provided in the task brief. Interview respondents respectfully and record their responses accurately. Photograph the respondent (with permission), the location, and your completed forms. Aid distribution verification requires you to visit distribution sites and confirm that aid is being delivered to the right recipients. Document the process with GPS-tagged photos of distributions in progress."},
   {"heading":"Emergency Dispatch Tasks","body":"Emergency dispatch tasks have the shortest SLA (often 4 hours or less) and command the highest rates on the platform. These may include urgent document delivery, emergency procurement, or immediate site inspection after an incident. When you accept an emergency dispatch task: respond immediately, go directly to the location, maintain constant communication with the requester via chat, and upload proofs in real time as the task progresses. Emergency tasks require full focus and maximum reliability."}
 ]'::jsonb
),

(5, 'Safety, Health & Professional Standards', 'PPE Requirements, Timestamp Camera Setup, Code of Conduct', '🛡️', 18,
 ARRAY[
   'Download and set up a GPS Timestamp Camera app BEFORE accepting enterprise tasks',
   'Always carry and present your Taskeeu authorization letter at enterprise sites',
   'Wear a hard hat at construction, tower, warehouse, and industrial sites',
   'Wear safety boots (closed-toe, steel-toed where required) at industrial sites',
   'Wear a high-visibility engineering vest/reflector jacket at road and telecom sites',
   'Wear a medical or dust mask at sites with dust, chemicals, or poor ventilation',
   'Never accept bribes or gifts from companies or individuals at verification sites',
   'Report any safety incidents immediately via the Taskeeu chat system'
 ],
 '[
   {"heading":"Why Safety Comes First","body":"As a Taskeeu enterprise tasker, you visit real worksites, industrial facilities, construction zones, and customer premises on behalf of major companies. Your safety is your responsibility — Taskeeu and the client companies provide guidance, but you are on the ground. This module covers the non-negotiable safety and professional standards that every enterprise-certified tasker must follow on every assignment."},
   {"heading":"Required PPE by Site Type","body":"Construction & Mining Sites: Hard hat (mandatory), safety boots, high-vis vest, gloves, dust mask. Warehouse & Industrial: Safety boots, high-vis vest, gloves, ear protection if in noisy areas. Telecom Tower Sites: Hard hat, high-vis vest, safety boots. Never climb without rigging certification. Road & Traffic Zones: High-vis reflector jacket, safety boots. Office & Retail Sites: Smart/business casual attire, closed-toe shoes. Remote/Farm Sites: Sturdy boots, sun protection, insect repellent, charged phone, emergency contact informed. Always assess the site before entering and identify emergency exits."},
   {"heading":"GPS Timestamp Camera Setup (Mandatory)","body":"Every enterprise task requires GPS-stamped, timestamped photos as proof of field presence. You MUST download and configure a GPS timestamp camera app before accepting any enterprise task. Recommended apps: (Android) Timestamp Camera Free, GPS Map Camera, or Photo Stamp Camera. (iOS) Timestamp Camera, MapSnapshot, or Exif Metadata. Setup steps: 1. Install the app. 2. Grant camera and location permissions. 3. Enable GPS coordinates, date, time, and address overlay on photos. 4. Take a test photo and verify the overlay shows correct data. 5. Keep location services ON throughout your field visit."},
   {"heading":"Professional Conduct & Ethics","body":"As an enterprise tasker, you represent Taskeeu and the hiring company. Your conduct standards: Always dress professionally and appropriately for the site type. Carry your authorization letter — present it to security or management before starting. Be truthful in all documentation. Never falsify a site visit, photo, or report. Respect privacy — do not photograph people without consent beyond what the task requires. Maintain confidentiality — company data you encounter during a task is private. Do not discuss or share it. Never solicit additional work or payments outside the Taskeeu platform. If you are uncomfortable with any aspect of a task, contact the requester through Taskeeu chat before proceeding."},
   {"heading":"Health Precautions in the Field","body":"Field work comes with health risks that must be managed proactively. Hydration: Carry water on all outdoor assignments, especially in hot conditions. Sun protection: Wear a hat and sunscreen for extended outdoor tasks. Vector protection: Use insect repellent in rural, farm, and bush environments. Chemical environments: If a site uses chemicals, do not enter without appropriate respiratory protection. First aid: Carry basic first aid supplies (plasters, antiseptic) on industrial site assignments. Emergency contacts: Always have an emergency contact informed of your location when on remote assignments. Mental health: If you feel threatened or unsafe at any point, leave immediately. Your safety is worth more than any task fee."},
   {"heading":"Your Certification & What It Means","body":"Completing all 5 modules of the Taskeeu Enterprise Tasker Certification demonstrates that you understand the professional standards, safety requirements, and operational procedures of enterprise field work. Your Taskeeu Enterprise Badge will appear on your public profile and bid cards, signalling to company clients that you are a prepared, professional, safety-conscious field agent. This certification significantly increases your chances of being selected for higher-value enterprise tasks. Maintain these standards on every assignment to protect your badge and your reputation on the platform."}
 ]'::jsonb
)
ON CONFLICT (module_number) DO NOTHING;

-- ── INDEXES ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_module_completions_tasker ON tasker_module_completions(tasker_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_certs_tasker ON tasker_enterprise_certifications(tasker_id);
CREATE INDEX IF NOT EXISTS idx_proof_company ON enterprise_task_proofs(enterprise_task_id);

-- ── DEMO REQUESTS ─────────────────────────────────────────────────
-- Table is created in schema.sql. Add extra columns if not present.
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS admin_notes TEXT;
-- Widen status to support richer values used by Teams module
-- (schema.sql uses TEXT with default 'pending'; just ensure column exists)

