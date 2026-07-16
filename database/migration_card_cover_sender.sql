-- Optional sender line displayed on the card cover.
alter table public.cards
  add column if not exists cover_sender varchar(100);

