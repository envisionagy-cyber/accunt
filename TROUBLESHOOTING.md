# ENVISION Ledger — Fix the current deployment error

## What the latest run showed
The JavaScript/billing check passed. The publish step failed at `actions/configure-pages` with `Resource not accessible by integration` because GitHub Pages has not yet been enabled for this repository. The GitHub App connection can commit source code but cannot turn on the repository's Pages setting via this workflow. This is a repository setting, not a JavaScript syntax error.

## One-time fix (repository owner)
1. Open https://github.com/envisionagy-cyber/accunt/settings/pages
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Save, if prompted.
4. Open https://github.com/envisionagy-cyber/accunt/actions
5. Open **Deploy ENVISION Ledger to GitHub Pages** and select **Run workflow** (or open the newest commit's run and use **Re-run jobs**).
6. Wait for all steps to succeed. The expected URL is https://envisionagy-cyber.github.io/accunt/ only after a successful deployment.

## Checks rerun before publishing
- `node --check` on the frontend JavaScript: passed.
- Contract billing test suite: 6/6 passed.
- Static frontend DOM reference check: 139 distinct static id references, 0 missing IDs.
- Supabase schema table presence check: all 9 declared tables found.

## Supabase connection is a separate step
After the site is live, create a Supabase project and run `supabase/schema.sql` in its SQL Editor. Create your own Auth user, promote only your account to admin as documented in README, and connect the Project URL + publishable/anon key in the app. Do not paste secret/service-role keys into the browser or GitHub.

## WhatsApp connection is a separate step
The reminder Edge Function needs your Meta WhatsApp Cloud API Phone Number ID, access token, API version and an approved template. Put these only into Supabase Edge Function Secrets. The code cannot send real WhatsApp messages until your own Meta setup and consent records exist.
