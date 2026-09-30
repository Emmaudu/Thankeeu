-- Repair Search Console "Crawled - currently not indexed" blog metadata.
-- These posts already exist in the seed data; this migration refreshes their
-- quality signals without changing slugs or URLs.

update blog_posts
set
  excerpt = 'The perfect birthday wish for a Nigerian colleague: warm, prayerful, sometimes funny. Use these professional messages, prayers and pidgin ideas, then deliver them in one group birthday card.',
  meta_title = '100+ Birthday Wishes for a Colleague in Nigeria: Prayers, Pidgin and Professional',
  meta_description = 'Birthday wishes for a Nigerian colleague: professional messages, heartfelt prayers and pidgin options, plus the best way to deliver them in a group card.',
  updated_at = now()
where slug = 'birthday-wishes-for-colleague-nigeria-prayers-pidgin';

update blog_posts
set
  excerpt = 'Losing a pet is real grief. These condolence messages help you comfort someone who lost a dog, cat or beloved animal without sounding dismissive.',
  meta_title = 'Condolence Messages for the Loss of a Pet: 40 Genuine Messages',
  meta_description = '40 genuine condolence messages for someone who lost a pet. Thoughtful words for the loss of a dog, cat or beloved animal.',
  updated_at = now()
where slug = 'condolence-messages-loss-of-pet';
