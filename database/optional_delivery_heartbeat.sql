-- OPTIONAL second clock: Supabase pings the backend's delivery sweep every
-- minute, so cards still go out on time even if the backend's own timer ever
-- stalls. Needs the pg_cron and pg_net extensions (Database → Extensions).
-- Replace YOUR_ADMIN_SECRET with the backend's ADMIN_SECRET value first.
SELECT cron.schedule(
  'thankeeu-delivery-heartbeat', '* * * * *',
  $$ SELECT net.http_post(
       url     := 'https://api.thankeeu.com/api/internal/run-auto-send',
       headers := jsonb_build_object('Content-Type','application/json','x-admin-secret','YOUR_ADMIN_SECRET'),
       body    := '{}'::jsonb) $$
);
-- Remove: SELECT cron.unschedule('thankeeu-delivery-heartbeat');
