-- Enable pg_cron, pg_net and Vault extensions first.
-- Store these two secrets in Supabase Vault before running:
-- select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co','envision_project_url');
-- select vault.create_secret('LONG_RANDOM_CRON_SECRET','envision_cron_secret');
select cron.schedule('envision-generate-monthly-invoices','15 3 * * *',$$select net.http_post(url:=(select decrypted_secret from vault.decrypted_secrets where name='envision_project_url')||'/functions/v1/generate-invoices',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='envision_cron_secret')),body:=jsonb_build_object('source','cron'));$$);
select cron.schedule('envision-daily-payment-reminders','0 4 * * *',$$select net.http_post(url:=(select decrypted_secret from vault.decrypted_secrets where name='envision_project_url')||'/functions/v1/send-reminders',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='envision_cron_secret')),body:=jsonb_build_object('mode','daily'));$$);
-- 03:15/04:00 UTC = 08:45/09:30 IST. Edit the cron expressions if needed.
