# Country content schema

One file per country: `src/content/countries/<slug>.js`, an ES module with
`export default { ... }`. Plain JavaScript data only: no JSX, no imports,
no functions. Strings only use straight quotes inside template-free strings
(escape apostrophes with \' or use double-quoted strings).

Quality rules (strict):
- Do real research: open the competitor sites and at least 2-3 sources per
  topic with WebFetch. Do not write competitor facts from memory.
- Every city intro, localNote and FAQ must be written specifically for that
  place (real suburbs, landmarks, housing types, climate, transport). No
  sentence template reused across cities with only the name swapped.

Writing rules (strict):
- Local language and spelling (US: color, neighborhood, moving; UK/IE/AU/NZ/SG:
  colour, neighbourhood, removals; CA: Canadian spelling: colour, neighbourhood).
- Mature, plain, specific copy. No em dashes or en dashes, no emojis, no
  exclamation-heavy hype, no "#1", no invented statistics, user counts,
  ratings, awards, insurance, guarantees or prices.
- Taskeeu facts you may state (all true):
  * Posting a task is free. Taskers bid for free.
  * The requester pays the agreed task price into Taskeeu's secure payment
    hold (escrow) after choosing a tasker; the tasker is paid when the
    requester gives them a 6-digit completion code.
  * Taskeeu keeps a 20% service fee from the tasker's payout of the task
    price. Tips and extra money a requester adds go to the tasker in full.
  * Taskers can request an advance of up to 50% of the task price for
    materials or transport; the requester approves it.
  * Taskers upload photo proof of the finished work; both sides leave
    compulsory star ratings and reviews.
  * Taskers verify their identity and supply the documents listed under
    `tasker.documents` before they can bid.
  * Prices are in the local currency. Only taskers based in the country can
    take tasks posted there.
  * Payments are processed by Rapyd (card and local payment methods).
  * Tasks can be in-person or remote. Remote tasks need no address; work is
    shared in the chat and the proof upload, with the same payment hold.
  Do NOT claim: background checks for everyone, insurance cover, money-back
  guarantees, instant payouts, "trusted by thousands", years in business,
  app store ratings, or that Taskeeu is the biggest/cheapest.
- Competitor facts must be verified with web search (as of 2026). Keep them
  neutral and factual; prefer "charges a service fee on each booking" over
  exact figures unless you confirmed the figure on the competitor's own site.
  Never disparage. List the URLs you used in `sources`.

Shape:
{
  slug, name,                      // must match the file name, e.g. 'us'
  home: {
    metaTitle,                     // <= 60 chars, include country + key term
    metaDescription,               // 140-158 chars
    h1, subhead,
    intro: [p, p],                 // 2 paragraphs
    steps: [{ title, text }] x3,   // how it works locally
    popularTasks: [{ name, service }] x8-12  // service = a services[].slug or null
    whyTaskeeu: [{ title, text }] x4,
    safety: p,
    faqs: [{ q, a }] x8,
  },
  services: [ x8 {                 // the hottest task types in this country
    slug, name,                    // e.g. 'end-of-lease-cleaning', 'Cleaning'
    metaTitle, metaDescription,
    h1, intro: [p, p],
    typicalJobs: [string x6-10],
    tips: [string x3-4],           // how to write a good task post
    consider: p,                   // what to agree upfront (materials, access, timing)
    cities: [citySlug x5],         // where it is in demand (must exist in cities)
    faqs: [{ q, a }] x5,
  }],
  cities: [ x12-15 {               // the largest / most relevant metros
    slug, name, region,            // region = state/county/province name
    metaTitle, metaDescription,
    h1, intro: [p, p],             // unique, mention real local areas
    neighbourhoods: [string x8-12],// real suburbs/neighbourhoods/boroughs
    popularServices: [serviceSlug x5],
    localNote: p,                  // genuinely local: housing, seasons, transport
    faqs: [{ q, a }] x4,
  }],
  compare: [ x4 {                  // top competitors in this country
    slug, competitor,              // 'taskrabbit', 'TaskRabbit'
    metaTitle, metaDescription,
    h1, intro: [p, p],
    rows: [{ feature, taskeeu, them }] x8-10,
    chooseTaskeeu: [string x3-4], chooseThem: [string x2-3],  // be fair
    cityNote: p,                   // coverage of the competitor vs Taskeeu in this country's cities
    faqs: [{ q, a }] x5,
    checked: 'October 2026',
    sources: [url],
  }],
  remote: {                        // landing page for remote / online tasks
    metaTitle, metaDescription,      // e.g. 'Remote and Online Tasks in the US | Taskeeu'
    h1, intro: [p, p],
    typicalJobs: [string x8-12],     // tasks done online: admin, data entry, research,
                                     // graphic design, writing, proofreading, social media,
                                     // spreadsheet work, website fixes, tutoring prep, transcription...
    howItWorks: [{ title, text }] x3,// remote flow: post without an address, files shared in chat,
                                     // proof = uploaded files/screenshots, same payment hold
    tips: [string x3-4],
    faqs: [{ q, a }] x6,
  },
  tasker: {
    intro: p,                      // what taskers in this country need
    documents: [ {                 // researched: what Airtasker/TaskRabbit-like platforms ask for here
      key,                         // one of: id_document, proof_of_address, right_to_work, police_check
      label, help, required: bool
    } ],
    notes: [string],               // e.g. tax responsibilities as an independent contractor (general, non-advice)
    sources: [url],
  },
  regions: [string],               // full list of states/provinces/regions for the location dropdown
}
