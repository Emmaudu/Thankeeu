-- Album-studio visual settings selected during card creation.
alter table public.cards
  add column if not exists cover_text_color varchar(16) default 'auto',
  add column if not exists album_background_theme varchar(32) default 'cover_blur';
