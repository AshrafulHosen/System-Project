# Milestones, reviews and AI features: setup and testing

## 1. Apply the migrations (in order)

| File | What it does |
|---|---|
| `20261113000000_platform_fee_7_percent.sql` | Default platform fee 7% for new contracts and payments |
| `20261114000000_milestone_contracts.sql` | Milestone tables, per-milestone escrow, disputes, audit log, milestone RPCs |
| `20261114010000_reviews_two_sided.sql` | Two-sided reviews, reports, moderation, protected profile ratings |
| `20261114020000_ai_generation_log.sql` | AI usage log used for rate limiting (metadata only) |

Run `supabase db push`, or paste each file into the Supabase SQL editor in this order.
Every migration applies in a single transaction and has been tested on a fresh database.

Existing contracts keep `billing_mode = 'SINGLE'` and the original payment flow.
Two things change for existing data when the reviews migration runs:

- **Ratings are recalculated.** `freelancers.rating`, `clients.rating` and `reviews_count`
  are rebuilt from real reviews. Any values that were set by hand are replaced.
- **Ratings are locked.** Users can no longer edit their own rating from the browser.

## 2. Enable AI (optional)

Add `OPENAI_API_KEY` to `.env.local`. The optional settings are listed in `.env.example`.
Without a key the AI buttons show a "not configured" state. Prompts and generated text are
never stored. The `ai_generations` table records only usage metadata, and each user is
limited to 15 requests per hour and 60 per day for each feature.

## 3. Tests

Run these against a local database only. Never point them at production.

```bash
npx supabase start                       # local stack in Docker (applies all migrations)

# Database-level tests (each runs in a transaction that is rolled back)
docker exec -i supabase_db_muktokormo psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - < supabase/tests/milestone_escrow.test.sql
docker exec -i supabase_db_muktokormo psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - < supabase/tests/reviews.test.sql

# API tests: start the app against the LOCAL stack, then:
node --env-file=.env.local --import ./tests/loader-alias.mjs tests/integration/milestones-api.mjs
node --env-file=.env.local tests/integration/reviews-api.mjs
node --env-file=.env.local tests/integration/ai-api.mjs     # app must run with OPENAI_BASE_URL=http://127.0.0.1:4010/v1 OPENAI_API_KEY=test-key
```

For the API tests, override `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` with the local values printed by `supabase start`. The tests stop
immediately if the Supabase URL is not local. The AI test uses a mock provider, so it checks
security and behaviour but not the quality of the generated text.

## 4. Known limits

- **Payouts are not real.** Releasing a milestone records a credit in the internal escrow
  ledger, just like the existing single-payment flow. No money is transferred to the
  freelancer's bank or mobile wallet.
- **Disputed milestones use the dispute queue.** Their refunds are decided in
  Admin → Disputes. The old refund-request form is blocked for milestone contracts.
- **Reviews are final.** They can't be edited after submission. A moderator can hide,
  remove or restore a review, and every moderation action is recorded.
