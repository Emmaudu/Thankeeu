-- Run this in Supabase SQL editor. Any row returned = a column that is MISSING,
-- which is why that setting silently never saves (createCard drops unknown
-- columns rather than failing).
select 'cards.' || c.name as missing_column
from (values ('album_background_theme'),('board_background_theme'),('cover_sender'),
             ('cover_text_color'),('cover_layout'),('card_layout'),('font_style'),
             ('card_experience'),('custom_occasion')) as c(name)
where not exists (
  select 1 from information_schema.columns
  where table_schema='public' and table_name='cards' and column_name=c.name)
union all
select 'messages.' || m.name
from (values ('font_size'),('font_color'),('font_style'),('media_gallery'),
             ('gift_type'),('product_name'),('contributed_amount')) as m(name)
where not exists (
  select 1 from information_schema.columns
  where table_schema='public' and table_name='messages' and column_name=m.name);
