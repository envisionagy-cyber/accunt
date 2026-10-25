# ENVISION Accounting Cloud

A web-based agency accounting app with Supabase Auth, PostgreSQL + Row Level Security, monthly contract invoicing, client profitability, expenses, payments and WhatsApp payment reminders.

## Status

Supabase-backed source scaffold. To activate production data, create a Supabase project, run `supabase/schema.sql`, create an Auth user, promote that user's UUID to the `admin` role, then configure the public project URL and publishable/anon key for the web app. WhatsApp automatic delivery requires Meta WhatsApp Cloud API credentials and an approved template stored as Supabase Edge Function secrets.

Never commit Supabase `service_role`/secret keys or WhatsApp access tokens.
