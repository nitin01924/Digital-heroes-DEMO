# Digital Heroes — Selection Demo

Digital Heroes is a polished full-stack selection-assignment prototype for a
subscription-driven golf performance, charity preference and monthly rewards
experience. It is **not an official Digital Heroes product**. Every person,
charity, subscription, draw, payment, prize pool and payout in the browser demo
is fictional.

## What runs today

The app works immediately in a safe local-demo mode with browser-local state.
It supports sign-up, login, role-aware routes, a subscriber-only score record,
charity preferences, a draw simulation/publishing workflow, award proof state,
payout review, light/dark themes, and responsive member/admin dashboards.

Use one of the supplied fictional demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Member | `demo.user@example.com` | `DemoUser@123` |
| Administrator | `demo.admin@example.com` | `DemoAdmin@123` |

These credentials exist only in the local demo data in
[`src/constants/demoData.js`](src/constants/demoData.js). They are never used
by Supabase or Stripe.

## Stack and architecture

- React 19, Vite and React Router for the client SPA.
- Tailwind import layer plus custom responsive CSS tokens for the visual system.
- Framer Motion for restrained page, modal and section transitions.
- Lucide React for accessible iconography.
- A single `AppContext` for the explicit local demo state and user interaction
  orchestration.
- Central business services in `src/services/`:
  `scoreService`, `drawService` and `prizePoolService`.
- Supabase migration, RLS and Storage policies in `supabase/migrations/`.
- Supabase Edge Functions for Stripe Checkout and Stripe webhooks in
  `supabase/functions/`.

## Functional flows

### Scores

The member dashboard applies the following rules both in the UI and local
business service:

- Stableford score must be a whole number from 1 through 45.
- A score cannot be future-dated.
- There can be only one score for a user and score date.
- A member can edit or delete their own score.
- The list is shown reverse-chronologically.
- After an insert or edit, only the newest five scores are retained; a sixth
  score removes the oldest.

The production schema reinforces these rules with a database score range check,
`unique (user_id, score_date)`, an indexed reverse-date query and an `AFTER`
trigger that removes rows beyond the latest five.

### Membership, charities and awards

Local test subscriptions gate score and draw access without charging anything.
Members select a fictional charity and a 0–100% contribution preference. The
dashboard shows subscription state, renewal date, score average, a draw view,
awards, proof upload state and payout state. Proof file selection is explicitly
local in demo mode; production storage is private Supabase Storage.

### Draws and prizes

Administrators can create a monthly draw, select a random or frequency-weighted
mode, simulate it privately and publish it. Only active subscribers with five
scores receive an entry. A draw always has five unique numbers in the 1–45
range. Matches of 5, 4 and 3 produce winner records.

The configured tier distribution is:

- 5-match: 40%
- 4-match: 35%
- 3-match: 25%

Multiple winners in a tier split that tier equally. An unclaimed 5-match amount
is carried into the next 5-match amount only; 4-match and 3-match allocations
reset each draw. The local admin subscriptions view also exposes the suggested
monthly prize pool: **35%** of active plan value, with annual plans recognised
monthly. This is a documented prototype assumption because the PRD does not
specify an exact contribution percentage.

The algorithmic mode starts every value 1–45 with a weight of one and adds one
weight for each active score with that value. It chooses five unique values by
weighted sampling, so it is inspectable rather than opaque.

## Local development

Prerequisites: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local URL Vite reports. Other checks:

```bash
npm test
npm run lint
npm run build
npm run preview
```

## Supabase production setup

The current selection build deliberately uses local demo state in the browser,
so it can be reviewed safely with no external account. The repository includes
the Supabase client configuration, production schema/RLS/Storage policies and
Stripe Edge Functions needed for the hosted data layer. Copy `.env.example` to
`.env.local` before connecting that hosted layer and add:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

1. Create a Supabase project.
2. Run `supabase/migrations/202609210001_initial_schema.sql` in the SQL Editor
   (or use `supabase db push`).
3. Run `supabase/seed/demo-data.sql` for fictional charities.
4. In Supabase Auth, create the two demo users if desired; set the administrator
   profile role with `update public.profiles set role = 'admin' where email =
   'demo.admin@example.com';` after creation.
5. Deploy the Edge Functions:

   ```bash
   supabase functions deploy create-checkout --no-verify-jwt
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```

6. Store the non-public function secrets using `supabase secrets set`:
   `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SIGNING_SECRET`, `STRIPE_MONTHLY_PRICE_ID`,
   `STRIPE_YEARLY_PRICE_ID` and `APP_ORIGIN`.
7. Configure Stripe TEST MODE to send subscription events to
   `/functions/v1/stripe-webhook`.

Never put a service-role key, Stripe secret key, or Stripe webhook secret in a
`VITE_` variable or commit it to the repository.

## Stripe test flow

`supabase/functions/create-checkout` authenticates the caller, validates the
plan and creates a Stripe **test mode** Checkout Session using server-only
secrets. `stripe-webhook` verifies the Stripe signature and becomes the source
of truth for subscription records. No payment or payout workflow transfers
money; payout state is a controlled administrative record only.

## Deployment

The app is a static Vite SPA and can be deployed to Vercel:

1. Import the repository into Vercel.
2. Use build command `npm run build` and output directory `dist`.
3. Add the three `VITE_` public values from `.env.example` if connecting
   Supabase.
4. Add the SPA rewrite in `vercel.json` (included) so direct dashboard/admin
   URLs resolve to `index.html`.
5. Set `APP_ORIGIN` in Supabase Edge Function secrets to the deployed Vercel
   origin and update Stripe’s webhook endpoint.

## Important limitations

- The browser runs a fully functional **local demonstration mode** with
  `localStorage` when Supabase credentials are absent. It is not a secure
  production authentication or payment system.
- The supplied schema and Stripe functions are ready for a Supabase project,
  but wiring every local-state action in `AppContext` to that live project is
  the remaining production-integration task; deployment credentials and a
  hosted Supabase project are intentionally not present in this repository.
- Real email confirmation, password reset emails and Stripe Customer Portal
  require the connected Supabase/Stripe environment and its templates/URLs.
- Do not represent any local demo charity preference, proof upload, award or
  payout as a real-world transaction.

## Requirements vs assumptions

Direct PRD requirements implemented include the 1–45 score rule, rolling five
scores, duplicate date prevention, member/admin route separation, charity
directory, draw modes, 40/35/25 prize tiers, verification/payout states,
theme support and the persistent non-official demo notice.

The following are explicit prototype assumptions: £12 monthly and £120 annual
display pricing, a 20% default member charity preference, and a 35% monthly
prize pool contribution. These values are centralised in
`src/constants/config.js` for easy replacement.
