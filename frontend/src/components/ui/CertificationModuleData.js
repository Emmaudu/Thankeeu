// ================================================================
// TASKEEU ENTERPRISE CERTIFICATION — MODULE CONTENT
// Full rich content for all 5 modules with diagrams, illustrations,
// checklists, step-by-step guides, and visual learning aids.
// ================================================================

export const MODULES_CONTENT = [
  {
    id: 'mod-1',
    module_number: 1,
    title: 'Verification Tasks',
    subtitle: 'KYC, Merchant, Address & Business Verification',
    emoji: '',
    color: 'from-blue-600 to-blue-500',
    bgLight: 'bg-blue-50',
    estimated_minutes: 15,
    sections: [
      {
        id: 's1-1',
        heading: 'What Are Verification Tasks?',
        content: [
          {
            type: 'paragraph',
            text: 'Verification tasks are the most common enterprise assignments on Taskeeu for Teams. When a bank wants to confirm a new merchant actually exists, when an insurance company needs to verify a claimant\'s address, or when a fintech company needs to physically confirm a customer\'s identity — they deploy verified field agents like you.',
          },
          {
            type: 'paragraph',
            text: 'You are the human layer of trust. No algorithm, satellite image, or phone call can replace a trained human standing in front of a location, examining documents, photographing evidence, and making a professional assessment. That is exactly what you do.',
          },
          {
            type: 'diagram',
            title: 'Who Hires for Verification Tasks?',
            items: [
              { icon: '', label: 'Banks & Fintechs', desc: 'KYC, merchant onboarding, account verification' },
              { icon: '', label: 'Telecoms', desc: 'Subscriber identity, SIM registration' },
              { icon: '', label: 'Insurance Companies', desc: 'Claims verification, address confirmation' },
              { icon: '', label: 'Businesses', desc: 'Supplier & partner due diligence' },
              { icon: '', label: 'NGOs & Government', desc: 'Beneficiary verification, field surveys' },
              { icon: '', label: 'E-commerce', desc: 'Merchant legitimacy, warehouse confirmation' },
            ],
          },
          {
            type: 'callout',
            variant: 'info',
            title: 'Why This Matters',
            text: 'Nigerian financial regulators (CBN, SEC) require banks and fintechs to conduct physical KYC verification for accounts above certain thresholds. Every time you carry out a KYC visit, you are part of a regulated compliance process. Your professionalism directly affects whether a company remains compliant.',
          },
        ],
      },
      {
        id: 's1-2',
        heading: 'The 4 Types of Verification',
        content: [
          {
            type: 'step_cards',
            steps: [
              {
                number: '01',
                icon: '🪪',
                title: 'KYC Verification',
                color: 'border-blue-400',
                points: [
                  'Physically meet the person face-to-face',
                  'Compare their face with their ID photo',
                  'Verify NIN, BVN, or passport details match company records',
                  'Confirm they are alive (liveness check) — not a photo or impostor',
                  'Photograph: ID card (front + back), selfie with ID, full face photo',
                  'Note any discrepancies and report via Taskeeu chat',
                ],
              },
              {
                number: '02',
                icon: '',
                title: 'Merchant Verification',
                color: 'border-green-400',
                points: [
                  'Confirm the business location physically exists',
                  'Check the business name matches the signage',
                  'Verify the business is operational (open, staff present)',
                  'Photograph: storefront, interior, signage, owner/manager',
                  'Confirm business category matches the application (e.g. pharmacy, not fashion)',
                  'Check CAC registration certificate if required by brief',
                ],
              },
              {
                number: '03',
                icon: '',
                title: 'Address Verification',
                color: 'border-orange-400',
                points: [
                  'Visit the stated residential or business address',
                  'Confirm the person or business is present at this address',
                  'Photograph house number/street sign, building exterior, and surroundings',
                  'Speak with neighbours if the subject is unavailable (optional, per brief)',
                  'Check utility bill or documents visible at the address if requested',
                  'Note any evidence that address is wrong (e.g. different tenant)',
                ],
              },
              {
                number: '04',
                icon: '',
                title: 'Business Verification',
                color: 'border-purple-400',
                points: [
                  'Verify the company structure, employees, and operations',
                  'Check for CAC Certificate of Incorporation',
                  'Count visible staff and confirm operational activity',
                  'Photograph: main entrance, reception, office floor, meeting rooms',
                  'Verify company size (staff count) matches what was stated',
                  'Check for any signs of shell company activity (empty office, no staff)',
                ],
              },
            ],
          },
        ],
      },
      {
        id: 's1-3',
        heading: 'Step-by-Step: Conducting a Verification Visit',
        content: [
          {
            type: 'numbered_steps',
            title: 'The 7-Step Verification Process',
            steps: [
              { step: 1, icon: '', title: 'Read the Brief Thoroughly', desc: 'Before leaving your location, read every word of the task description. Know the subject\'s name, address, what documents to check, and exactly what photos are required. Surprises in the field are avoidable.' },
              { step: 2, icon: '', title: 'Prepare Your Authorization Letter', desc: 'Download or screenshot your Taskeeu authorization letter. This letter proves you are a legitimate field agent on behalf of the client company. You may be asked for it at the door.' },
              { step: 3, icon: '', title: 'Plan Your Route', desc: 'Use Google Maps to confirm the address exists and plan your journey. Arrive with buffer time — SLA counts from task acceptance, not from when you leave home.' },
              { step: 4, icon: '', title: 'Professional Introduction', desc: 'At the location, introduce yourself calmly: "Good morning, my name is [Name]. I\'m a field verification agent from Taskeeu Technologies, working on behalf of [Company Name]. I have been assigned to carry out a routine verification. May I speak with [Subject Name]?" Always show your auth letter.' },
              { step: 5, icon: '', title: 'Collect Evidence Systematically', desc: 'Follow the evidence checklist in your task brief. Take photos in sequence: exterior of building → signage → interior → subject/documents → your GPS selfie at the location. Every photo must have GPS + timestamp from your app.' },
              { step: 6, icon: '', title: 'Verify & Cross-check', desc: 'Compare what you see against what the task brief states. If the address is wrong, the business doesn\'t exist, or the person\'s details don\'t match — document this carefully and report it honestly. Do NOT falsify results.' },
              { step: 7, icon: '', title: 'Upload Proofs Immediately', desc: 'Upload all photos and your findings to Taskeeu within 30 minutes of completing the visit. The requester is waiting. Delays affect your rating and the company\'s operations.' },
            ],
          },
        ],
      },
      {
        id: 's1-4',
        heading: 'Evidence Photography Standards',
        content: [
          {
            type: 'paragraph',
            text: 'Poor photos get rejected. Rejected proof means no payment. Here is the exact standard every verification photo must meet:',
          },
          {
            type: 'photo_guide',
            categories: [
              {
                icon: '',
                title: 'GPS Selfie',
                color: 'bg-blue-50 border-blue-200',
                required: true,
                rules: [
                  'Your face clearly visible — no sunglasses, no hat pulled down',
                  'Location landmark visible behind you (building number, signage, or street sign)',
                  'GPS coordinates and timestamp showing on photo',
                  'Taken at the exact location — not from your car or the road',
                ],
                bad_example: 'A blurry selfie taken 50m away from the address with no visible landmark',
                good_example: 'Clear face shot standing directly in front of the building\'s entrance, GPS overlay visible showing correct coordinates',
              },
              {
                icon: '',
                title: 'Building/Location Exterior',
                color: 'bg-green-50 border-green-200',
                required: true,
                rules: [
                  'Full building facade visible — include street number if visible',
                  'Take from the road/pavement showing the full structure',
                  'Include any signage (business name, street name)',
                  'Photograph the immediate environment to confirm neighbourhood',
                ],
                bad_example: 'A photo of just the door or only part of the building',
                good_example: 'Wide-angle shot showing the full building, street, and visible house/shop number',
              },
              {
                icon: '',
                title: 'Document Photos',
                color: 'bg-amber-50 border-amber-200',
                required: true,
                rules: [
                  'Document must fill at least 70% of the frame',
                  'All text must be clearly legible — no blur, no glare',
                  'Photograph both sides of ID cards',
                  'Photograph under good natural light — avoid flash glare on laminated surfaces',
                ],
                bad_example: 'An ID card photographed at an angle, half the text unreadable due to glare',
                good_example: 'NIN card laid flat on a neutral surface, photographed directly from above, all text crisp and readable',
              },
            ],
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Never Falsify Evidence',
            text: 'Submitting fake photos, visiting the wrong address and pretending it is correct, or fabricating verification results is FRAUD. It leads to immediate platform ban, legal action, and permanent blacklisting. Companies rely on your reports to make financial and legal decisions. One falsified report can cost a company millions of naira in bad loans or failed compliance audits.',
          },
        ],
      },
      {
        id: 's1-5',
        heading: 'Red Flags & What to Do When Things Go Wrong',
        content: [
          {
            type: 'paragraph',
            text: 'Not every verification will go smoothly. Here is how to handle common situations professionally:',
          },
          {
            type: 'scenarios',
            items: [
              { situation: 'Subject is not at the address', action: 'Photograph the location thoroughly. Note the time of visit. Attempt to contact the subject via the requester. Try again if within SLA window. Report accurately — "Subject not found at stated address during visit at [time]."' },
              { situation: 'Address does not exist', action: 'Photograph the nearest matching street/number. Report immediately via Taskeeu chat. Do NOT guess or fill in a nearby address. This may be a fraud indicator — the requester needs to know.' },
              { situation: 'Subject refuses to cooperate', action: 'Stay calm. Do not force entry or become confrontational. Photograph what you can from outside. Report: "Subject declined verification. Evidence collected from exterior."' },
              { situation: 'Business is closed', action: 'Photograph the closed shutters/door with signage visible. Check with neighbouring businesses how long it has been closed. Report accurately.' },
              { situation: 'Documents look tampered or fake', action: 'Do not accuse anyone. Simply photograph carefully and report your observation to the requester privately via chat. Write: "Documents collected as instructed. Please note [specific observation]."' },
              { situation: 'You feel unsafe', action: 'Leave immediately. Your safety is more important than any task fee. Contact the requester to explain. Your rating will not be affected for legitimate safety concerns.' },
            ],
          },
        ],
      },
    ],
    requirements: [
      'I will carry my Taskeeu authorization letter to every verification visit',
      'I will photograph ID documents clearly and legibly, never blurry or at an angle',
      'I will use a GPS Timestamp Camera app on all evidence photos',
      'I will never falsify verification results or visit a wrong address knowingly',
      'I will upload all proof photos within 30 minutes of completing the visit',
      'I will report honestly even when the result is negative for the subject',
    ],
  },

  // ── MODULE 2 ────────────────────────────────────────────────────
  {
    id: 'mod-2',
    module_number: 2,
    title: 'Telecom & Infrastructure Tasks',
    subtitle: 'Tower Inspection, Fiber, ATM, POS & Utility Sites',
    emoji: '',
    color: 'from-indigo-600 to-indigo-500',
    bgLight: 'bg-indigo-50',
    estimated_minutes: 18,
    sections: [
      {
        id: 's2-1',
        heading: 'Overview: Why Telecoms Need Field Agents',
        content: [
          {
            type: 'paragraph',
            text: 'Nigeria has over 220 million mobile subscribers and one of the fastest-growing telecom networks on the continent. MTN, Airtel, Glo, and 9Mobile collectively manage thousands of base transceiver stations (BTS), fiber routes, and retail points across every state. Maintaining, auditing, and verifying all of this infrastructure requires human presence on the ground — that\'s you.',
          },
          {
            type: 'stats_row',
            stats: [
              { value: '40,000+', label: 'BTS Towers in Nigeria', icon: '' },
              { value: '80,000km', label: 'Fiber optic network', icon: '' },
              { value: '20,000+', label: 'Bank ATMs nationwide', icon: '' },
              { value: '12M+', label: 'POS terminals deployed', icon: '' },
            ],
          },
          {
            type: 'paragraph',
            text: 'For every one of these assets, companies need periodic inspections — checking for damage, theft, operational status, and compliance. Field agents like you are the most cost-effective and accurate way to gather this intelligence.',
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Safety First — Always',
            text: 'Telecom infrastructure tasks carry real physical risks. High-voltage electricity, heights, moving vehicles, and restricted security zones are common at these sites. This module covers all safety protocols. READ THEM CAREFULLY before your first telecom assignment.',
          },
        ],
      },
      {
        id: 's2-2',
        heading: 'Tower Inspection: What You Must Know',
        content: [
          {
            type: 'paragraph',
            text: 'A Base Transceiver Station (BTS) or cell tower site typically has several components you need to inspect and photograph. You do NOT need to be a telecom engineer — your role is visual inspection and documentation.',
          },
          {
            type: 'diagram_list',
            title: 'Tower Site Components to Inspect',
            icon: '',
            color: 'blue',
            items: [
              { label: 'Tower Structure', detail: 'Overall condition — visible rust, bent poles, loose cables, missing bolts, bird nests. Photograph from all 4 sides.' },
              { label: 'Equipment Cabinets', detail: 'Are they locked? Any signs of forced entry, water damage, or vandalism? Are ventilation grilles clean?' },
              { label: 'Power Source (Generator/Solar)', detail: 'Diesel level if generator present. Fuel gauge photo. Solar panel condition if applicable. Battery backup cabinet.' },
              { label: 'Security Fence', detail: 'Is the perimeter fence intact? Any gaps? Is the gate locked? Any signs of unauthorized entry?' },
              { label: 'Earthing Rod', detail: 'Copper earthing rod at the base of the tower — ensure it is firmly embedded and connected.' },
              { label: 'Feeder Cables', detail: 'Cables running from base to antennas — check for cuts, rodent damage, or weather deterioration.' },
              { label: 'Antenna Alignment', detail: 'Antennas mounted at the top — do they appear straight/correctly aligned? Any visibly damaged panels?' },
              { label: 'Environment', detail: 'Overall cleanliness. Any overgrown vegetation touching the structure? Any construction encroaching on the site?' },
            ],
          },
          {
            type: 'callout',
            variant: 'danger',
            title: 'NEVER CLIMB THE TOWER',
            text: 'You are NOT a tower rigger. Climbing a telecom tower without certification, specialist equipment, and written authorisation is illegal, extremely dangerous, and will result in immediate ban from Taskeeu. Your job is ground-level inspection and photography only. If an inspection requires climbing, the task brief will state this explicitly and provide a certified rigger team.',
          },
          {
            type: 'numbered_steps',
            title: 'Tower Site Inspection Sequence',
            steps: [
              { step: 1, icon: '', title: 'Check In With Site Security', desc: 'Present your authorization letter to the site security officer. Do NOT enter a restricted site without authorization. Record the security officer\'s name if possible.' },
              { step: 2, icon: '', title: 'Put On Your PPE', desc: 'Hard hat and high-visibility vest BEFORE you enter the site. Non-negotiable. If you don\'t have them, you cannot proceed.' },
              { step: 3, icon: '', title: 'Walk the Site Perimeter', desc: 'Start with the fence — walk the full perimeter noting any breaches. Check the gate and lock status.' },
              { step: 4, icon: '', title: 'Systematic Photography', desc: 'North face → South face → East face → West face of tower. Then power sources, cabinets, earthing, cables.' },
              { step: 5, icon: '', title: 'Complete Inspection Notes', desc: 'For each item in your checklist: OK / Minor Issue / Major Issue / Not Accessible. Add notes for anything unusual.' },
              { step: 6, icon: '', title: 'GPS Selfie at Site', desc: 'Take your GPS selfie with the tower clearly visible behind you. This proves your presence at the specific site.' },
              { step: 7, icon: '', title: 'Upload & Report', desc: 'Upload all photos and your findings immediately. If there are major issues (theft, structural damage), call the requester via the chat phone button — don\'t just upload and leave.' },
            ],
          },
        ],
      },
      {
        id: 's2-3',
        heading: 'ATM & POS Terminal Verification',
        content: [
          {
            type: 'paragraph',
            text: 'Nigerian banks deploy hundreds of ATMs monthly and POS terminals into millions of merchant locations. Each deployment needs verification to confirm the machine is installed, operational, and compliant with bank branding standards.',
          },
          {
            type: 'two_column',
            columns: [
              {
                title: 'ATM Inspection Checklist',
                color: 'border-green-400 bg-green-50',
                items: [
                  'Machine is powered on and screen active',
                  'Bank branding/logo is correctly displayed',
                  'Receipt printer appears functional (paper loaded)',
                  'Card insertion slot is clean and undamaged',
                  'No skimming devices attached (check card slot carefully)',
                  'Surrounding area is safe and well-lit',
                  'Accessibility compliance (ramp/step if required)',
                  'Emergency contact sticker present on machine',
                  'Photograph: machine full-front, card slot close-up, screen, location view',
                ],
              },
              {
                title: 'POS Terminal Verification Checklist',
                color: 'border-blue-400 bg-blue-50',
                items: [
                  'Terminal is present at the merchant location',
                  'Terminal is plugged in and powered on',
                  'Bank name / network logo visible on terminal',
                  'Terminal serial number matches task brief',
                  'Merchant is aware of and using the terminal',
                  'No damage to the keypad or card reader',
                  'Photograph: terminal full view, serial number, merchant using/holding it, shop front',
                  'Confirm merchant name and location match task brief',
                ],
              },
            ],
          },
          {
            type: 'callout',
            variant: 'info',
            title: 'Skimming Device Alert',
            text: 'Fraudsters sometimes attach skimming devices to ATM card slots to steal customer card data. As part of your ATM inspection, gently check the card insertion slot — it should be firmly attached to the machine body. Any loose overlay or foreign attachment should be photographed and immediately reported as a critical finding via Taskeeu chat. Do NOT remove the device yourself — leave it for the bank\'s security team.',
          },
        ],
      },
      {
        id: 's2-4',
        heading: 'Fiber Network & Utility Inspections',
        content: [
          {
            type: 'paragraph',
            text: 'Fiber optic cable inspection tasks require you to survey a specified route or infrastructure point — checking cable runs, junction boxes, and street cabinets for integrity and compliance.',
          },
          {
            type: 'diagram_list',
            title: 'Key Fiber Infrastructure Elements',
            icon: '',
            color: 'purple',
            items: [
              { label: 'Optical Distribution Box (ODB)', detail: 'Gray or green boxes on walls or poles. Check for: intact lid, no exposed cables, no water ingress, correct labelling.' },
              { label: 'Cable Routing', detail: 'Follow the cable run specified in your brief. Check for: cuts, crushing damage, rodent chews, UV degradation in outdoor sections.' },
              { label: 'Street Cabinets', detail: 'Larger roadside cabinets. Check: cabinet door locked, no vandalism, cable entries properly sealed, any water pooling at base.' },
              { label: 'Pole Attachments', detail: 'Cables attached to utility poles. Check: cables properly fastened with cleats, no sagging loops, no interference from tree branches.' },
              { label: 'Splice Points', detail: 'Joint enclosures where cables are connected. Check: enclosure sealed, not exposed, no moisture entry, correctly mounted.' },
            ],
          },
          {
            type: 'callout',
            variant: 'info',
            title: 'GPS Waypoints Are Critical for Fiber Tasks',
            text: 'Fiber inspection tasks often cover long routes. At each inspection point, your GPS photo MUST be taken at that exact location, not at the start or end of the route. Companies use your GPS data to map fault locations precisely. If you photograph 10 points along a fiber route, each photo must have the GPS coordinates of that specific point.',
          },
        ],
      },
      {
        id: 's2-5',
        heading: 'Personal Protective Equipment (PPE) for Telecom Sites',
        content: [
          {
            type: 'ppe_grid',
            items: [
              { emoji: '', name: 'Hard Hat', required: true, when: 'All tower sites, construction zones, any site with overhead work', note: 'Must be ANSI/ISEA Z89.1 compliant. Check for cracks before each use.' },
              { emoji: '', name: 'High-Vis Vest', required: true, when: 'All tower sites, road-side fiber inspection, any outdoor infrastructure work', note: 'Class 2 minimum — must be visible from 100+ metres.' },
              { emoji: '', name: 'Safety Boots', required: true, when: 'Construction sites, warehouses, any heavy equipment environment', note: 'Closed-toe minimum. Steel-toed recommended for construction sites.' },
              { emoji: '', name: 'Work Gloves', required: false, when: 'Handling cables, working near sharp metal edges', note: 'Cut-resistant gloves when inspecting fiber cables.' },
              { emoji: '', name: 'Dust/Fume Mask', required: false, when: 'Sites with dust, chemical odors, or diesel exhaust', note: 'N95 minimum for dusty construction environments.' },
              { emoji: '', name: 'Safety Glasses', required: false, when: 'Any site where debris could be present', note: 'Protects against dust, fiber shards, and debris.' },
            ],
          },
          {
            type: 'callout',
            variant: 'success',
            title: 'Pro Tip: Always Carry Your Own PPE',
            text: 'Do not rely on the site to provide PPE. Invest in a basic set: one hard hat (₦2,000-5,000), one high-vis vest (₦1,500-3,000), one pair of safety boots (₦5,000-15,000). These are tools of your trade — they pay for themselves after your first telecom inspection task at ₦22,000.',
          },
        ],
      },
    ],
    requirements: [
      'I will NEVER climb a telecom tower without specific written authorisation and certification',
      'I will wear a hard hat and high-visibility vest at all tower and infrastructure sites',
      'I will check in with site security and present my authorization letter before entering',
      'I will check ATM card slots for skimming devices and report findings immediately',
      'I will take GPS-stamped photos at each specific inspection point along a fiber route',
      'I will invest in my own basic PPE (hard hat and high-vis vest at minimum)',
    ],
  },

  // ── MODULE 3 ────────────────────────────────────────────────────
  {
    id: 'mod-3',
    module_number: 3,
    title: 'Inspection & Audit Tasks',
    subtitle: 'Property, Construction, Vehicle, Retail & Compliance Audits',
    emoji: '',
    color: 'from-amber-600 to-amber-500',
    bgLight: 'bg-amber-50',
    estimated_minutes: 15,
    sections: [
      {
        id: 's3-1',
        heading: 'What Are Inspection & Audit Tasks?',
        content: [
          {
            type: 'paragraph',
            text: 'Inspection tasks require you to visit a location and produce a comprehensive visual record and factual assessment of what you observe. Unlike verification tasks — where you check one specific thing — inspection tasks require a systematic, thorough documentation of an entire property, vehicle, warehouse, or compliance state.',
          },
          {
            type: 'paragraph',
            text: 'The person who assigned the task cannot be there. YOU are their eyes. Your photos and notes are used to make major financial and legal decisions: approving insurance claims, approving mortgages, confirming delivery, awarding contracts. The quality of your work directly impacts real money.',
          },
          {
            type: 'diagram_list',
            title: 'Who Uses Inspection Tasks and Why',
            icon: '',
            color: 'amber',
            items: [
              { label: 'Insurance Companies', detail: 'Inspect claimed damage before approving payouts. Verify property before issuing coverage.' },
              { label: 'Real Estate Firms', detail: 'Property condition reports for buyers, landlords, and mortgage lenders.' },
              { label: 'Banks & Mortgage Lenders', detail: 'Verify collateral property before approving loans.' },
              { label: 'Logistics & FMCG Companies', detail: 'Warehouse audits, inventory checks, vehicle condition assessments.' },
              { label: 'Government & NGOs', detail: 'Construction progress inspections, compliance audits, environmental checks.' },
              { label: 'Retail & FMCG Brands', detail: 'Shelf audits, brand compliance checks, competitor monitoring.' },
            ],
          },
        ],
      },
      {
        id: 's3-2',
        heading: 'Property & Real Estate Inspections',
        content: [
          {
            type: 'paragraph',
            text: 'When you are assigned a property inspection, your job is to document every relevant aspect of the property\'s current condition — as if you were describing it to someone who has never seen it.',
          },
          {
            type: 'numbered_steps',
            title: 'The Full Property Inspection Sequence',
            steps: [
              { step: 1, icon: '', title: 'Exterior & Environment', desc: 'Photograph: full building from the street, each side (N/S/E/W), gate/entrance, boundary fence/wall, any visible structural damage, roof condition from ground, drainage, surrounding neighbourhood.' },
              { step: 2, icon: '', title: 'Entrance & Common Areas', desc: 'Photograph: main entrance door condition, lobby/reception, staircases, corridors, lifts if present, security features (CCTV, guard post). Note cleanliness and state of repair.' },
              { step: 3, icon: '', title: 'Interior Rooms', desc: 'Each room: take a wide-angle corner photo showing all walls. Note floor condition, ceiling condition, wall quality, windows, doors. Photograph any defects (cracks, water stains, broken fixtures) with a close-up.' },
              { step: 4, icon: '', title: 'Utilities & Services', desc: 'Check: electrical panel (open and photograph), water meter, plumbing (taps, drains), visible wiring. Note functional vs. non-functional items. Is there running water? Does electricity work?' },
              { step: 5, icon: '', title: 'Kitchen & Bathrooms', desc: 'These get extra attention. Photograph: tiles, fixtures, taps, shower/bath condition, sink, toilet (lid closed for photos), signs of damp or mold.' },
              { step: 6, icon: '', title: 'Occupancy Status', desc: 'Is the property occupied? If yes — by whom and how many? Any unauthorised subletting? Furniture present? Signs of recent habitation? For tenant checks, photograph the occupants\' belongings (general overview, not personal items).' },
            ],
          },
          {
            type: 'callout',
            variant: 'info',
            title: 'The "Every Room, 4 Walls" Rule',
            text: 'For every room in a property inspection, take at least one photo from each corner of the room pointing toward the opposite corner. This gives a complete 360° view of the room and leaves no blind spots. 4 rooms × 4 corners = minimum 16 interior photos. For larger properties, more is always better.',
          },
        ],
      },
      {
        id: 's3-3',
        heading: 'Construction Site Inspections',
        content: [
          {
            type: 'paragraph',
            text: 'Construction site inspections are higher-risk assignments that carry higher pay (₦20,000). They require strict PPE compliance and systematic documentation of construction progress.',
          },
          {
            type: 'callout',
            variant: 'danger',
            title: 'MANDATORY PPE — No Exceptions',
            text: 'Hard hat + safety boots are REQUIRED before stepping onto any active construction site. You will be asked to leave without them. Bring your own. Do not rely on the site to provide them.',
          },
          {
            type: 'step_cards',
            steps: [
              {
                number: '01',
                icon: '',
                title: 'Construction Progress',
                color: 'border-amber-400',
                points: [
                  'What stage of construction? (Foundation / Frame / Walls / Roofing / Finishing)',
                  'Percentage of completion (estimate based on visible work)',
                  'Is work actively in progress? Are workers present?',
                  'Materials on site — photograph stockpiled materials',
                  'Heavy equipment present and operational?',
                ],
              },
              {
                number: '02',
                icon: '',
                title: 'Structural Quality',
                color: 'border-red-400',
                points: [
                  'Any visible structural cracks or misaligned columns',
                  'Rebar exposure — is concrete cover adequate?',
                  'Foundation drainage — any water pooling at foundation',
                  'Scaffolding properly erected and secured',
                  'Note anything that looks structurally concerning',
                ],
              },
              {
                number: '03',
                icon: '',
                title: 'Site Safety Compliance',
                color: 'border-green-400',
                points: [
                  'Workers wearing hard hats and safety boots?',
                  'Safety netting / fall protection in place at height?',
                  'Danger/warning signs posted at site entrance?',
                  'First aid kit visible on site?',
                  'Fire extinguisher present?',
                ],
              },
            ],
          },
        ],
      },
      {
        id: 's3-4',
        heading: 'Retail Shelf Audits & Brand Compliance',
        content: [
          {
            type: 'paragraph',
            text: 'Retail audit tasks are some of the most common enterprise assignments for FMCG (Fast-Moving Consumer Goods) companies. Every major brand — Unilever, Dangote, PZ Cussons, Nestle — needs to know their products are properly displayed and priced in thousands of retail outlets across Nigeria.',
          },
          {
            type: 'two_column',
            columns: [
              {
                title: 'Retail Shelf Audit',
                color: 'border-orange-400 bg-orange-50',
                items: [
                  'Are the specified products stocked? (Yes / No / Out of stock)',
                  'How many facings does the product have? (number of product faces visible)',
                  'Is the product at eye level, top shelf, or bottom shelf?',
                  'Price tag present and legible?',
                  'What is the actual shelf price? (photograph the price tag)',
                  'Is the product within expiry date?',
                  'Any competitor products on the same shelf? How many facings?',
                  'Is shelf clean and products well-arranged?',
                ],
              },
              {
                title: 'Brand Compliance Check',
                color: 'border-purple-400 bg-purple-50',
                items: [
                  'Is the brand display / POSM (point of sale material) present?',
                  'Is the brand signage correctly positioned per the brand guide?',
                  'Are brand colors, logos, and messaging accurate and undamaged?',
                  'Is the freezer/refrigerator branded correctly (for cold beverages)?',
                  'Any unauthorised modifications or competitor branding?',
                  'Photograph: overall shelf section, brand display, price tags, close-up of product labels',
                ],
              },
            ],
          },
          {
            type: 'callout',
            variant: 'info',
            title: 'Mystery Shopping',
            text: 'Mystery shopping tasks require you to visit a store posing as a regular customer and evaluate the service experience. You will assess: greeting by staff, product knowledge, cleanliness, service time, upselling attempts, and checkout experience. Only reveal you are a mystery shopper AFTER you have completed your assessment and left the store — unless the brief instructs otherwise. Keep your notes discreet.',
          },
        ],
      },
      {
        id: 's3-5',
        heading: 'Vehicle Inspection Tasks',
        content: [
          {
            type: 'paragraph',
            text: 'Vehicle inspection tasks require you to document the complete condition of a vehicle — commonly for insurance purposes, fleet management, or loan collateral verification.',
          },
          {
            type: 'diagram_list',
            title: 'Standard Vehicle Inspection — Photo Sequence',
            icon: '',
            color: 'blue',
            items: [
              { label: '1. Front View', detail: 'Full front of vehicle, number plate clearly visible. Note any bonnet damage, headlight condition, bumper.' },
              { label: '2. Rear View', detail: 'Full rear, number plate visible. Note boot condition, tail lights, tow hitch, exhaust.' },
              { label: '3. Driver Side', detail: 'Full side profile. Note door panels, side mirror, wheel condition.' },
              { label: '4. Passenger Side', detail: 'Full opposite side. Note the same items.' },
              { label: '5. Interior', detail: 'Dashboard overview, seats, steering wheel, gear lever, odometer reading (close-up, readable).' },
              { label: '6. Engine Bay', detail: 'Open bonnet, photograph engine. Note any leaks, corrosion, missing components.' },
              { label: '7. Tyre Tread', detail: 'Close-up of each tyre sidewall and tread. Note any balding, cracks, or damage.' },
              { label: '8. Chassis/Undercarriage', detail: 'If accessible, photograph underside. Note rust, damage, modifications.' },
              { label: '9. Chassis Number', detail: 'VIN plate — must be legible in the photo. Usually on dashboard (visible through windscreen) or door jamb.' },
            ],
          },
        ],
      },
    ],
    requirements: [
      'I will wear a hard hat and safety boots on ALL construction and warehouse site inspections',
      'I will photograph every room from each corner for property inspections (minimum 4 photos per room)',
      'I will not move or interfere with any goods, machinery, or documents at inspection sites',
      'I will complete the full photo sequence for vehicle inspections (all 9 angles minimum)',
      'I will honestly report all defects, discrepancies, and non-compliances — not just positive findings',
      'I will identify myself as a field agent before conducting any inspection (never misrepresent)',
    ],
  },

  // ── MODULE 4 ────────────────────────────────────────────────────
  {
    id: 'mod-4',
    module_number: 4,
    title: 'Field Operations & Logistics',
    subtitle: 'Pickup, Delivery, Procurement, Surveys & Emergency Dispatch',
    emoji: '',
    color: 'from-green-600 to-green-500',
    bgLight: 'bg-green-50',
    estimated_minutes: 14,
    sections: [
      {
        id: 's4-1',
        heading: 'Field Operations Overview',
        content: [
          {
            type: 'paragraph',
            text: 'Field operations tasks are the most varied category on Taskeeu for Teams. You may be collecting documents from a government office, purchasing an industrial component from Alaba Market, verifying aid distribution at an NGO camp, or making an emergency delivery across Lagos in 2 hours.',
          },
          {
            type: 'paragraph',
            text: 'What all field ops tasks share: they require you to MOVE, COMMUNICATE well, and EXECUTE reliably within a time window. Requesters for field ops tasks are often operating businesses in real-time — your delay or failure can cost them real money.',
          },
          {
            type: 'stats_row',
            stats: [
              { value: '₦10k', label: 'Starting pay', icon: '' },
              { value: '₦25k', label: 'Emergency dispatch', icon: '' },
              { value: '4hrs', label: 'Typical SLA', icon: '⏱️' },
              { value: '1hr', label: 'Emergency SLA', icon: '' },
            ],
          },
        ],
      },
      {
        id: 's4-2',
        heading: 'Pickup & Delivery Tasks — Full Protocol',
        content: [
          {
            type: 'paragraph',
            text: 'Pickup and delivery tasks require you to collect an item from one location and deliver it safely to another. These sound simple but account for the majority of disputes on field operations platforms when done poorly.',
          },
          {
            type: 'numbered_steps',
            title: 'The Perfect Pickup & Delivery Flow',
            steps: [
              { step: 1, icon: '', title: 'Confirm Item Description Before Leaving', desc: 'Read the task brief carefully. Know exactly what you are picking up: item name, approximate size/weight, packaging. If the brief is vague, message the requester for clarification before you leave home.' },
              { step: 2, icon: '', title: 'GPS Photo at Pickup Location', desc: 'When you arrive at the pickup point, take your GPS selfie immediately. This timestamps your arrival and proves you went to the correct location.' },
              { step: 3, icon: '', title: 'Inspect Item Before Accepting', desc: 'Before the handover, inspect the item. Is it what was described? Is it damaged? If damaged or wrong item — photograph it, message the requester immediately. Do NOT take a damaged item without documenting it.' },
              { step: 4, icon: '', title: 'Photograph at Pickup', desc: 'Photo of the item clearly. Photo of the person handing it to you (with their permission or simply their hands handing over). Photo of your GPS position.' },
              { step: 5, icon: '', title: 'Update Requester In Transit', desc: 'Send a chat message: "Picked up your item at [time]. En route. ETA [time]." For longer deliveries, send updates every 30-60 minutes. Do not go silent.' },
              { step: 6, icon: '', title: 'Delivery Confirmation', desc: 'At destination, photograph the item being handed over — recipient\'s hands or person visible. Take your GPS selfie at the delivery location. Send: "Delivered at [time]. Recipient confirmed receipt."' },
              { step: 7, icon: '', title: 'Upload and Close', desc: 'Upload all photos. Mark task as complete only when the recipient has physically received the item.' },
            ],
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Never Open Sealed Packages',
            text: 'If you are handed a sealed package, do not open it. If you suspect contents are illegal or dangerous, photograph the package and contact the requester via Taskeeu chat immediately. Do NOT transport packages you believe contain illegal items — you could be committing a criminal offence. Report via Taskeeu and decline the task if necessary.',
          },
        ],
      },
      {
        id: 's4-3',
        heading: 'Local Procurement Tasks',
        content: [
          {
            type: 'paragraph',
            text: 'Procurement tasks require you to purchase a specific item on behalf of a company and either deliver it or arrange shipping. These tasks carry the highest escrow payment amounts and require strict evidence protocol.',
          },
          {
            type: 'step_cards',
            steps: [
              {
                number: '01',
                icon: '',
                title: 'Locate the Item',
                color: 'border-blue-400',
                points: [
                  'Visit the specific market or supplier stated in the brief',
                  'Find the item that matches the description exactly',
                  'If you find the item at multiple prices, record the lowest and highest options',
                  'If the item is not available, report immediately — do NOT substitute',
                ],
              },
              {
                number: '02',
                icon: '',
                title: 'Upload Proof Before Buying',
                color: 'border-amber-400',
                points: [
                  'STOP before paying — upload photos first',
                  'Photo of the item clearly showing make, model, and specification',
                  'Photo of the price tag or written price',
                  'Photo of the store/market environment showing you are at the right place',
                  'Wait for requester approval before proceeding',
                ],
              },
              {
                number: '03',
                icon: '',
                title: 'Purchase and Document',
                color: 'border-green-400',
                points: [
                  'Only purchase after requester confirms via Taskeeu chat or OK button',
                  'Collect a receipt (insist on one — it protects you)',
                  'Photograph the receipt clearly and upload immediately',
                  'Photograph you with the purchased item',
                ],
              },
              {
                number: '04',
                icon: '',
                title: 'Arrange Shipping if Required',
                color: 'border-purple-400',
                points: [
                  'Visit the specified logistics/shipping office',
                  'Photograph the item packaged for shipping',
                  'Photograph the waybill/tracking document',
                  'Photograph the cost of shipping (receipt)',
                  'Upload all, share tracking number with requester',
                ],
              },
            ],
          },
          {
            type: 'callout',
            variant: 'danger',
            title: 'Critical Rule: Never Buy Before Requester Approval',
            text: 'The Taskeeu escrow system holds the equipment funds until YOU upload proof photos and the requester clicks OK. This protects everyone. If you purchase the item before uploading proof and getting approval, and the requester disputes the purchase — you will have no recourse. Always upload proof first. Always wait for approval. This is non-negotiable.',
          },
        ],
      },
      {
        id: 's4-4',
        heading: 'NGO Field Surveys & Aid Distribution Verification',
        content: [
          {
            type: 'paragraph',
            text: 'NGOs, government agencies, and international organizations use field agents to verify that aid programmes are actually reaching their intended beneficiaries. This is sensitive, important work that requires both professionalism and compassion.',
          },
          {
            type: 'two_column',
            columns: [
              {
                title: 'Survey Best Practices',
                color: 'border-green-400 bg-green-50',
                items: [
                  'Read the questionnaire fully before starting',
                  'Record responses accurately — never lead respondents',
                  'Ask questions in simple, clear language',
                  'Never assume — record what was actually said',
                  'If a respondent declines, note "Declined to participate" — do not fabricate',
                  'For sensitive topics (income, health), assure confidentiality before asking',
                  'Photograph the survey environment (not necessarily respondents)',
                  'Count completed surveys and cross-check with GPS photos',
                ],
              },
              {
                title: 'Aid Distribution Verification',
                color: 'border-blue-400 bg-blue-50',
                items: [
                  'Confirm you are at the correct distribution site',
                  'Count beneficiaries present (count, don\'t guess)',
                  'Photograph the distribution in progress (items being handed out)',
                  'Verify that items being distributed match the manifest',
                  'Note any irregularities (items being withheld, favouritism, items being resold)',
                  'Talk to 2-3 beneficiaries — are they receiving the correct allocation?',
                  'Upload: GPS selfie, overview of distribution area, close-up of items, any registers/lists being used',
                ],
              },
            ],
          },
        ],
      },
      {
        id: 's4-5',
        heading: 'Emergency Dispatch Tasks',
        content: [
          {
            type: 'paragraph',
            text: 'Emergency dispatch tasks are the highest-paying assignments on Taskeeu (up to ₦25,000) and carry the shortest SLA — often 1-4 hours. They require full attention, no delays, and constant communication.',
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Only Accept Emergency Tasks You CAN Complete',
            text: 'Emergency tasks count toward your rating significantly. If you accept an emergency task and fail to complete it — or complete it late — it will affect your rating more than a standard task. Only accept emergency tasks when you are physically close to the pickup location and certain you can meet the SLA.',
          },
          {
            type: 'numbered_steps',
            title: 'Emergency Dispatch Protocol',
            steps: [
              { step: 1, icon: '', title: 'Respond Immediately', desc: 'When you accept an emergency task, send a chat message within 5 minutes confirming you are on the way. Any silence will alarm the requester.' },
              { step: 2, icon: '', title: 'Go Directly to the Location', desc: 'No stops. No detours. Navigate directly to the pickup point. Use the most reliable route, not necessarily the fastest — Lagos traffic is unpredictable.' },
              { step: 3, icon: '', title: 'Communicate Every 30 Minutes', desc: 'Send updates: "At pickup location." "Item collected, en route." "10 minutes away." "Delivered." Requesters paying emergency rates expect live updates.' },
              { step: 4, icon: '', title: 'Document Everything in Real Time', desc: 'Upload GPS photos as events happen. Don\'t batch at the end. Real-time uploads protect you if there are any disputes.' },
              { step: 5, icon: '', title: 'Close Immediately After Delivery', desc: 'Mark the task complete and upload final photos the moment delivery is confirmed. Do not delay.' },
            ],
          },
        ],
      },
    ],
    requirements: [
      'I will photograph the item at pickup and delivery — both handover points documented',
      'I will never open sealed packages and will report any suspicious contents immediately',
      'I will upload equipment procurement proof photos BEFORE purchasing and wait for requester approval',
      'I will communicate with the requester at every stage of pickup and delivery tasks',
      'I will only accept emergency dispatch tasks I can reliably complete within SLA',
      'I will collect a receipt for every procurement task and upload it as proof',
    ],
  },

  // ── MODULE 5 ────────────────────────────────────────────────────
  {
    id: 'mod-5',
    module_number: 5,
    title: 'Safety, Health & Professional Standards',
    subtitle: 'PPE Requirements, GPS Camera Setup, Code of Conduct & Emergency Procedures',
    emoji: '',
    color: 'from-red-600 to-rose-500',
    bgLight: 'bg-red-50',
    estimated_minutes: 20,
    sections: [
      {
        id: 's5-1',
        heading: 'Why Safety is Your Personal Responsibility',
        content: [
          {
            type: 'paragraph',
            text: 'As a Taskeeu field agent, you visit real worksites, construction zones, telecom towers, industrial warehouses, and customer premises on behalf of major companies. Unlike an office worker, your work environment changes every day — and with it, the risks.',
          },
          {
            type: 'paragraph',
            text: 'Taskeeu and the client companies provide safety guidelines and compensation, but they cannot put a hard hat on your head or make you leave a dangerous site. Your safety is ultimately YOUR responsibility. This module gives you everything you need to stay safe, healthy, and professional.',
          },
          {
            type: 'callout',
            variant: 'info',
            title: 'Legal Note',
            text: 'As an independent contractor, you are responsible for your own safety equipment and health. Taskeeu recommends all field agents obtain basic personal accident insurance. Some companies offering enterprise tasks may also provide additional site-specific safety briefings before complex assignments.',
          },
        ],
      },
      {
        id: 's5-2',
        heading: 'PPE by Site Type — The Complete Reference Guide',
        content: [
          {
            type: 'paragraph',
            text: 'Memorise this table. Before you leave for any enterprise task, check which PPE is required for your site type and make sure you have it:',
          },
          {
            type: 'ppe_table',
            headers: ['Site Type', 'Hard Hat', 'Safety Boots', 'High-Vis Vest', 'Gloves', 'Mask/Respirator', 'Eye Protection'],
            rows: [
              { site: 'Active Construction Site', hardhat: 'Mandatory', boots: 'Mandatory', vest: 'Mandatory', gloves: 'Recommended', mask: 'If dusty', eyes: 'Recommended' },
              { site: 'Telecom Tower Site', hardhat: 'Mandatory', boots: 'Mandatory', vest: 'Mandatory', gloves: 'Optional', mask: 'Optional', eyes: 'Optional' },
              { site: 'Warehouse / Industrial', hardhat: 'Mandatory', boots: 'Mandatory', vest: 'Mandatory', gloves: 'Recommended', mask: 'If dusty', eyes: 'Optional' },
              { site: 'Road / Roadside Fiber', hardhat: 'Optional', boots: 'Mandatory', vest: 'Mandatory', gloves: 'Optional', mask: 'Optional', eyes: 'Optional' },
              { site: 'Residential Property', hardhat: 'Not needed', boots: 'Optional', vest: 'Not needed', gloves: 'Optional', mask: 'Optional', eyes: 'Optional' },
              { site: 'Retail Store / Office', hardhat: 'Not needed', boots: 'Not needed', vest: 'Not needed', gloves: 'Optional', mask: 'Optional', eyes: 'Optional' },
              { site: 'Farm / Rural Site', hardhat: 'Not needed', boots: 'Mandatory', vest: 'Recommended', gloves: 'Recommended', mask: 'Optional', eyes: 'Optional' },
            ],
          },
          {
            type: 'callout',
            variant: 'success',
            title: 'Build Your Field Agent Kit',
            text: 'Invest in your professional kit. Estimated costs: Hard hat ₦2,000-5,000 | High-vis vest ₦1,500-3,000 | Safety boots ₦5,000-15,000 | Work gloves ₦1,000-2,000 | Dust mask ₦500-1,500. Total: approximately ₦10,000-25,000. A single telecom tower task (₦22,000) more than covers your full kit.',
          },
        ],
      },
      {
        id: 's5-3',
        heading: 'GPS Timestamp Camera — Full Setup Guide',
        content: [
          {
            type: 'paragraph',
            text: 'A GPS timestamp camera app is MANDATORY for enterprise tasks. It automatically overlays your exact GPS coordinates, full address, date, and time onto every photo — making your evidence legally verifiable and tamper-evident.',
          },
          {
            type: 'numbered_steps',
            title: '6-Step GPS Camera App Setup',
            steps: [
              { step: 1, icon: '', title: 'Download the App', desc: 'Android: Search "Timestamp Camera" on Google Play Store. Download "Timestamp Camera — Time Stamp" or "GPS Map Camera." iOS: Search "Timestamp Camera" on App Store. Download "Timestamp Camera Basic" or "MapSnapshot."' },
              { step: 2, icon: '', title: 'Grant All Permissions', desc: 'When the app first opens, it will ask for Camera and Location permissions. Grant BOTH. Select "Always Allow" for location — not "Only While Using" — so GPS data is captured even briefly.' },
              { step: 3, icon: '', title: 'Configure What Shows on Photos', desc: 'In app settings, enable ALL of the following overlays: GPS Coordinates (latitude & longitude) | Full Address | Date | Time (with seconds) | Device Name (optional but useful). Set format to 24-hour clock and DD/MM/YYYY date.' },
              { step: 4, icon: '', title: 'Enable High-Accuracy Location', desc: 'Go to your phone\'s Settings → Location → Mode → Select "High Accuracy" (uses GPS + Wi-Fi + mobile networks). This gives the most precise coordinates. Do NOT use battery-saving location mode for field work.' },
              { step: 5, icon: '', title: 'Take a Test Photo', desc: 'Before your first enterprise task, take a test photo from your home or office. Check that all 4 data points show clearly: coordinates, address, date, and time. If any is missing, recheck your settings.' },
              { step: 6, icon: '', title: 'Check Storage & Upload', desc: 'Ensure your phone has at least 2GB free storage before a long field assignment. After each site visit, upload photos to Taskeeu immediately — don\'t rely on cellular data if Wi-Fi is available for large batches.' },
            ],
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'What If There Is No Network at the Site?',
            text: 'GPS works WITHOUT internet — it uses satellites. Even with no network signal, your GPS camera app will still record accurate coordinates and embed them in your photos. The coordinates are captured at the time of taking the photo, not at upload time. You can upload the photos later when you have network access. Your GPS data will still be accurate.',
          },
          {
            type: 'photo_guide',
            categories: [
              {
                icon: '',
                title: 'GOOD GPS Photo Example',
                color: 'bg-green-50 border-green-200',
                required: true,
                rules: [
                  'Coordinates clearly visible: e.g. 6.5244°N, 3.3792°E',
                  'Full address shown: "14 Marina Street, Lagos Island, Lagos"',
                  'Date and time stamped: "14/03/2025 10:45:23"',
                  'Subject/location clearly visible (not blurry)',
                  'Photo taken at the ACTUAL location — GPS matches where you are',
                ],
                good_example: 'A sharp photo of a merchant\'s storefront with "6.4550°N, 3.3841°E | 12 Broad Street, Lagos Island | 14/03/2025 14:32:11" clearly stamped in the corner',
                bad_example: '',
              },
              {
                icon: '',
                title: 'REJECTED GPS Photo Examples',
                color: 'bg-red-50 border-red-200',
                required: false,
                rules: [
                  'Photo taken from your car 50 metres away — coordinates will be wrong',
                  'GPS overlay missing or turned off in settings',
                  'Photo taken at a different time/location and submitted for this task',
                  'Blurry or dark photo where overlay text is unreadable',
                  'Screenshot of someone else\'s photo with fake timestamp',
                ],
                good_example: '',
                bad_example: 'Any of the above result in proof rejection and delayed payment',
              },
            ],
          },
        ],
      },
      {
        id: 's5-4',
        heading: 'Professional Code of Conduct',
        content: [
          {
            type: 'paragraph',
            text: 'When you carry out enterprise tasks, you represent both Taskeeu Technologies and the client company. How you behave in the field directly affects both organisations\' reputations — and your income.',
          },
          {
            type: 'two_column',
            columns: [
              {
                title: 'Always Do',
                color: 'border-green-400 bg-green-50',
                items: [
                  'Dress professionally and appropriately for the site',
                  'Present your authorization letter without being asked',
                  'Address people respectfully (Sir/Ma\'am, formal titles)',
                  'Be punctual — arrive within the SLA window',
                  'Keep all task information confidential',
                  'Update the requester at every stage',
                  'Report findings honestly, even if negative',
                  'Ask for permission before photographing people',
                  'Use polite language in all Taskeeu chats',
                ],
              },
              {
                title: 'Never Do',
                color: 'border-red-400 bg-red-50',
                items: [
                  'Demand bribes or request favours from subjects',
                  'Accept gifts that could compromise your impartiality',
                  'Share company data or task details with third parties',
                  'Discuss one company\'s assignments with another company\'s subjects',
                  'Pressure, threaten, or intimidate anyone',
                  'Force entry to any premises',
                  'Claim expenses beyond what Taskeeu authorises',
                  'Solicit additional work outside the Taskeeu platform',
                  'Photograph children without guardian permission',
                ],
              },
            ],
          },
          {
            type: 'callout',
            variant: 'danger',
            title: 'Zero Tolerance Violations — Immediate Ban',
            text: 'The following actions result in immediate and permanent removal from Taskeeu, with potential legal action: (1) Falsifying GPS photos or proof documents. (2) Bribery or extortion of any subject. (3) Sharing confidential company data obtained during tasks. (4) Visiting a wrong location and claiming it is correct. (5) Any form of harassment or assault.',
          },
        ],
      },
      {
        id: 's5-5',
        heading: 'Health Precautions & Emergency Procedures',
        content: [
          {
            type: 'paragraph',
            text: 'Nigeria\'s varied field environments come with real health risks. Being prepared is part of being professional.',
          },
          {
            type: 'diagram_list',
            title: 'Environment-Specific Health Precautions',
            icon: '',
            color: 'red',
            items: [
              { label: 'Hot/Outdoor Environments', detail: 'Carry 1.5L water minimum. Wear a hat in direct sun. Take breaks in shade every 45-60 minutes on outdoor assignments exceeding 2 hours. Recognise heat exhaustion signs: dizziness, excessive sweating, nausea.' },
              { label: 'Rural/Agricultural Sites', detail: 'Wear boots — protect against snakes, thorns, and soil-borne pathogens. Use insect repellent (DEET-based) for farm and bush environments. Inform someone of your specific location before going to remote sites.' },
              { label: 'Construction/Dust Environments', detail: 'Wear N95 dust mask in active construction zones. Wash hands before touching your face after being in dusty environments. Avoid eating or drinking at dusty sites.' },
              { label: 'Chemical/Industrial Sites', detail: 'If you smell strong chemicals, leave immediately. Report to the requester. Never enter sites with visible chemical spills. Check with the site manager about any chemical hazards before entering.' },
              { label: 'Wet/Flooded Areas', detail: 'Never wade through flooded areas — leptospirosis (Weil\'s disease) is present in floodwater in Nigeria. Avoid flood surveys after heavy rain unless specifically equipped.' },
            ],
          },
          {
            type: 'numbered_steps',
            title: 'What To Do in an Emergency',
            steps: [
              { step: 1, icon: '', title: 'Personal Injury', desc: 'For minor injuries: apply basic first aid and photograph the injury (for records). For serious injury: call 112 (emergency) or go to nearest hospital immediately. Inform Taskeeu support and the task requester via chat.' },
              { step: 2, icon: '', title: 'Electrical Hazard', desc: 'If you see exposed wires, sparking equipment, or someone has received an electric shock: DO NOT TOUCH the person or equipment. Call 112. Move away from the area. Report to site management and Taskeeu immediately.' },
              { step: 3, icon: '', title: 'Fire at Site', desc: 'Leave the site immediately following the nearest safe exit. Do not attempt to fight fires unless you are trained and have appropriate equipment. Call the fire service (112). Ensure all other persons are aware and evacuating.' },
              { step: 4, icon: '', title: 'Threat or Assault', desc: 'If you feel threatened: leave the site immediately. Move to a public area. Call the police if necessary (112). Report to Taskeeu via chat with full details. Your rating will be protected for genuine security incidents.' },
              { step: 5, icon: '', title: 'Heat Stroke / Medical Emergency', desc: 'Heat stroke (not sweating, confused, hot skin) is a medical emergency. Call 112. Move the person to shade. Apply cool water to skin. Do not give water to an unconscious person.' },
            ],
          },
          {
            type: 'callout',
            variant: 'success',
            title: 'Save These Numbers',
            text: 'Emergency services: 112 (national emergency) | 199 (fire service) | 767 or 112 (police). LASEMA (Lagos): 767 | Abuja Emergency: 08032003553. Keep your next of kin informed of your field location for complex or remote assignments.',
          },
        ],
      },
    ],
    requirements: [
      'I have downloaded and configured a GPS Timestamp Camera app with coordinates, address, date and time enabled',
      'I will wear appropriate PPE for each site type before entering (refer to the PPE table in this module)',
      'I will always carry my authorization letter to every enterprise site visit',
      'I understand that falsifying GPS photos or evidence leads to immediate permanent ban',
      'I will leave any site where I feel unsafe and report to Taskeeu — my rating will be protected',
      'I have saved the emergency number 112 in my phone contacts',
      'I commit to the professional code of conduct in every field assignment',
    ],
  },
];

export const TOTAL_MODULES = MODULES_CONTENT.length;
