# ENVISION Ledger — Supabase Online Accounting

This repository hosts the online agency accounting app frontend on GitHub Pages. Supabase Auth and PostgreSQL are the system of record. It includes client/project management, contract value calculations, monthly invoice generation, invoice/payment/expense records, client-wise profitability, branding/print settings and payment reminder workflows.

## 1. GitHub Pages
In repository Settings → Pages, select **GitHub Actions** as the deployment source. The workflow in `.github/workflows/pages.yml` deploys on each push to `main`. Open the URL shown in Actions. If Pages has not been enabled in repository settings, enable it there first.

## 2. Supabase setup
1. Create a Supabase project at https://supabase.com/dashboard.
2. Run `supabase/schema.sql` in SQL Editor.
3. In Authentication → Users create your admin email/password.
4. Promote your user in SQL Editor: `update public.profiles set role='admin' where email='YOUR_ADMIN_EMAIL';`
5. Copy the project URL and publishable key (or legacy anon key) from Project Settings → API. On the app sign-in page choose Connect database and paste these public values. Never use a `service_role` or `sb_secret_...` key in a browser.
6. Add the GitHub Pages site URL in Authentication → URL Configuration. The UI requires the signed-in user's profile role to be admin. RLS protects all financial tables.

The public URL/key are saved in that browser's local storage. To use another device, enter the same URL/key on that device too, or hardcode only those public values into the static config. Admin email/password remains in Supabase Auth.

## 3. Edge Functions
Install the Supabase CLI and run:
```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy generate-invoices
supabase functions deploy send-reminders
```
Function server environment includes the Supabase URL and secret key. Configure these additional secrets only in Supabase Dashboard → Edge Functions → Secrets:
```sh
supabase secrets set CRON_SECRET="LONG_RANDOM_SECRET"
supabase secrets set WHATSAPP_PHONE_NUMBER_ID="META_PHONE_NUMBER_ID"
supabase secrets set WHATSAPP_ACCESS_TOKEN="META_CLOUD_API_TOKEN"
supabase secrets set WHATSAPP_API_VERSION="CURRENT_GRAPH_API_VERSION"
supabase secrets set WHATSAPP_TEMPLATE_NAME="invoice_payment_reminder"
supabase secrets set WHATSAPP_TEMPLATE_LANGUAGE="en"
```
Never commit real tokens to GitHub. In Meta WhatsApp Manager create/approve a utility template named `invoice_payment_reminder` with four body variables in this order: client name, invoice number, due date, outstanding amount. Set the Graph API version to the version enabled for your Meta app. Only contacts with `whatsapp_opt_in=true` are sent automatic reminders. Meta Business/phone setup, policies, template approval and any provider charges must be handled in your Meta account.

## 4. Automated monthly invoices and reminders
Enable `pg_cron`, `pg_net` and Vault extensions when available. Save the project URL and a long random cron secret in Supabase Vault using the commented commands in `supabase/cron_setup.sql`, then run that file. The included schedules are 08:45 IST for invoice generation and 09:30 IST for payment reminders. Adjust if needed.

Invoice generation counts calendar months inclusively. A contract from 1 Oct to 30 Dec at ₹3,000/month has 3 periods and ₹9,000 pre-tax total. Only periods whose monthly billing date has arrived generate invoices; future periods are planned contract value, not overdue bills. Unique project+period keys prevent duplicate bills. Outstanding = invoice total minus all recorded payments.

## Data and security
Tables: profiles, company_settings, clients, projects, invoices, payments, expenses, reminder_logs, audit_events. All company data tables have admin-only RLS. The app provides a JSON convenience export; rely on Supabase database backups/exports for authoritative disaster recovery. The profit display is a management estimate (billed revenue less linked recorded expense) and should not be treated as a reconciled ledger or GST filing.
