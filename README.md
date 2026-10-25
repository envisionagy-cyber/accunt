# ENVISION Ledger — Supabase Online Accounting

This repository contains the online agency accounting app frontend plus Supabase schema and Edge Functions. The frontend uses Supabase Auth and Postgres as the source of truth and supports clients, contract projects, monthly invoices, invoices, payments, expenses, client profitability, editable branding/print settings, reports, JSON export, and payment reminders.

## Current status
- Source code is committed in this repo.
- The GitHub Pages workflow runs billing math tests first. Pages is not yet enabled in repository settings, so publishing currently stops at `configure-pages`. Open Settings → Pages and set the source to **GitHub Actions**, then rerun the latest workflow in Actions.
- Supabase and WhatsApp are not connected until you create a project and add your own credentials/secrets. No credentials are committed to this repository.

## 1. GitHub Pages
In repository Settings → Pages, select **GitHub Actions** as the deployment source. See [GitHub's official setup guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site). The workflow deploys on pushes to `main`. The expected app address is `https://envisionagy-cyber.github.io/accunt/` after the workflow succeeds.

## 2. Supabase setup
1. Create a Supabase project at https://supabase.com/dashboard.
2. Run `supabase/schema.sql` in SQL Editor.
3. In Authentication → Users, create your admin email/password.
4. Promote that user in SQL Editor: `update public.profiles set role='admin' where email='YOUR_ADMIN_EMAIL';`
5. Copy the Project URL and **publishable key** (or legacy anon key) from the Project's Connect/API settings. On the app sign-in screen, open **Connect database** and paste those public values.
6. In Authentication → URL Configuration, add your GitHub Pages URL to Site URL and Redirect URLs.

Use the publishable/anon key in the browser with RLS enabled; never put a secret/service-role key in browser code or GitHub. See [Supabase API key guidance](https://supabase.com/docs/guides/getting-started/api-keys). The app checks the signed-in user's profile role and RLS restricts financial tables to admins. The URL and publishable key are stored in that browser's local storage; repeat connection on other devices.

## 3. Deploy Edge Functions
Install Supabase CLI and run from this repository root:
```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy generate-invoices
supabase functions deploy send-reminders
```
`supabase/config.toml` disables the gateway JWT check only for those two functions because they verify either an authenticated admin JWT or a matching `CRON_SECRET` themselves.

Set backend-only function secrets in Supabase Dashboard → Edge Functions → Secrets:
```sh
supabase secrets set CRON_SECRET="choose-a-long-random-secret"
supabase secrets set WHATSAPP_PHONE_NUMBER_ID="your-meta-phone-number-id"
supabase secrets set WHATSAPP_ACCESS_TOKEN="your-meta-cloud-api-token"
supabase secrets set WHATSAPP_API_VERSION="your-current-graph-api-version"
supabase secrets set WHATSAPP_TEMPLATE_NAME="invoice_payment_reminder"
supabase secrets set WHATSAPP_TEMPLATE_LANGUAGE="en"
```
Supabase automatically supplies project URL and a default server secret to Edge Functions. Never commit real tokens, database passwords, service role or secret keys.

## 4. WhatsApp reminders
In Meta WhatsApp Manager, configure the WhatsApp Business Cloud API phone number and create/approve a utility template named `invoice_payment_reminder` with four body variables in this order: client name, invoice number, due date, outstanding amount. Set the correct Graph API version and token in Supabase Function Secrets. Only clients with `whatsapp_opt_in=true` are eligible for automatic reminders; ensure the consent is documented and customer preferences are honored. This is not active until your Meta account/number/template/secrets are configured. SMS is not included yet and would need an SMS provider integration.

## 5. Monthly invoice generation and scheduling
Enable `pg_cron`, `pg_net` and Vault extensions in Supabase if available. Save three secrets in Vault (replace placeholders):
```sql
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co','envision_project_url');
select vault.create_secret('LONG_RANDOM_CRON_SECRET','envision_cron_secret');
select vault.create_secret('sb_publishable_xxx','envision_publishable_key');
```
Then run `supabase/cron_setup.sql` in SQL Editor. It schedules invoice generation at 08:45 IST and reminders at 09:30 IST. See [Supabase's scheduled Edge Functions guide](https://supabase.com/docs/guides/functions/schedule-functions). Verify that the jobs appear and run without errors in Supabase Cron.

Invoice generation counts contract months inclusively. 1 Oct–30 Dec at ₹3,000/month equals three periods and ₹9,000 before tax. Only reached billing dates generate invoices; future months are planned value, not overdue bills. A unique `(project_id, billing_period)` key prevents duplicates. Outstanding = invoice total minus recorded payments.

## Data and security
Tables: profiles, company_settings, clients, projects, invoices, payments, expenses, reminder_logs, audit_events. Financial table access is protected with RLS. JSON export is for convenience; use Supabase database backups/exports as authoritative disaster recovery. Client profit is an estimate (billed revenue less direct linked expenses), not a fully reconciled accounting ledger or GST filing.
