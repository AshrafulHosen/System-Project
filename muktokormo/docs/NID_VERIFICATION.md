# Manual NID Verification

Clients and freelancers upload the front and back of their Bangladesh National ID. A Muktokormo administrator looks at the images and approves or rejects them.

> **This is a manual visual review.** It is not an authentication against the Bangladesh Election Commission NID database, and the product must not describe it as one. The UI calls the result **Identity Verified** and explains how the review works.

## Where it lives

| Who | Where |
| --- | --- |
| Client | Dashboard → **Profile Settings** tab (`/dashboard/client#settings`) |
| Freelancer | Dashboard → **My Profile** tab (`/dashboard/freelancer#profile`) |
| Admin | Dashboard → **NID Verification** tab (`/dashboard/admin?tab=nid-verifications`) |

The onboarding-checklist link `#verify-nid` opens the right tab. Clients and freelancers share one component, `src/components/verification/NIDVerification.tsx`.

## Flow

1. The browser calls `POST /api/nid/upload-url`. The server checks the session, role, type and declared size, and that no submission is pending or approved. It then mints two one-time **signed upload URLs** under `<user-id>/<random-submission-id>/nid-<side>.<ext>`.
2. The browser `PUT`s each image straight to Storage and shows upload progress. Images never pass through the Next server, so platform body-size limits don't apply.
3. The browser calls `POST /api/nid/submit`. The server checks that both paths belong to the caller and this submission, that both objects exist, that each is ≤ 5 MB, and that the **magic bytes** match the extension. Invalid uploads are deleted. Finally the `nid_submit` RPC creates the pending row atomically.
4. The admin opens a submission. `GET /api/nid/admin/documents/[id]` returns signed URLs that expire after 120 seconds and writes a `documents_viewed` audit event.
5. The admin approves or rejects (with a reason) through `POST /api/nid/admin/review`, which calls the `nid_review` RPC. That RPC:
   - only moves a submission out of `pending`, and once;
   - blocks self-review;
   - records the reviewer and timestamp;
   - sets the profile flag on approval;
   - sends a notification.

## API

| Route | Who | Purpose |
| --- | --- | --- |
| `POST /api/nid/upload-url` | client/freelancer | Mint signed upload URLs |
| `POST /api/nid/submit` | client/freelancer | Validate uploads, create pending submission |
| `GET /api/nid/status` | signed-in user | `not_verified` / `pending` / `approved` / `rejected`, dates, rejection reason (never paths) |
| `GET /api/nid/admin/requests` | admin | `?status=&role=&q=&page=&pageSize=` with per-status counts |
| `GET /api/nid/admin/documents/[id]` | admin | Account info, signed image URLs, previous reviews |
| `POST /api/nid/admin/review` | admin | `{ verificationId, decision, rejectionReason? }` |
| `POST /api/nid/admin/retention` | admin | Run the retention cleanup |

## Database (`supabase/migrations/20261118000000_nid_verification.sql`)

- **`nid_verifications`**: one row per submission, with history kept.
  - A partial unique index allows one `pending` and one `approved` row per user.
  - A check constraint keeps status, review date and reason consistent.
- **`nid_verification_events`**: audit log of submitted / documents_viewed / approved / rejected / documents_deleted.
- **RLS**: users may `SELECT` their own rows and admins may `SELECT` all.
  - No insert, update or delete policies or grants exist for `authenticated` or `anon`. Every write goes through `SECURITY DEFINER` RPCs that only `service_role` can execute.
- **Profile flags are reused; no new profile table.** `freelancers.is_nid_verified` and `clients.is_verified` are the public "Identity Verified" flags.
  - Guard triggers stop browser sessions from changing them.
  - The migration resets any value that has no approved submission behind it.

## Storage

The `nid-documents` bucket is created by the migration:

- `public = false`
- `file_size_limit = 5 MB`
- `allowed_mime_types = image/jpeg, image/png, image/webp`

The bucket has **no `storage.objects` policies**, so browser sessions can't list, read, write or sign anything in it. All access goes through server-minted signed URLs:

- upload tokens only for the caller's own folder;
- view URLs only for admins.

Owners can't view their own images after submitting.

## Retention and deletion policy

| Documents | Deleted |
| --- | --- |
| Rejected submission | When the user resubmits, or 30 days after rejection |
| Approved submission | 90 days after approval |
| Uploads never attached to a submission | After 24 hours |
| Account deleted | Rows cascade; files become orphans and go in the next cleanup |

Deleting images keeps the review record: status, dates, reviewer and reason. An approval and its badge stay after the images are gone. Run the cleanup from the admin tab (**Run retention cleanup**) or call `POST /api/nid/admin/retention` from a scheduled job running as an admin. Change the periods in `src/app/api/nid/admin/retention/route.ts`, and update the privacy text in `NIDVerification.tsx` to match.

The system stores no NID numbers, OCR text or extra personal data. Server logs never contain images or paths with personal data.

## Setup

1. Apply the migration to the hosted project. It needs `20261117000000_phone_verification.sql` and the earlier migrations; it redefines `is_trusted_phone_context()` defensively.
2. Confirm in Supabase → Storage that `nid-documents` exists and shows **Private**.
3. Make sure at least one account is in `public.admins`.
4. No new environment variables. It uses the existing `SUPABASE_SERVICE_ROLE_KEY` (server-only).

## Tests

```bash
npx supabase start            # Storage must be enabled
npx supabase migration up
# run a Next server against the LOCAL stack on :3200, then:
node --env-file=.env.local tests/integration/nid-verification-api.mjs
```

The suite has 40 checks covering all 18 required scenarios, plus concurrency, magic-byte checks, self-review, audit logging and retention. It refuses to run against a non-local Supabase.

## Known limitations

- The upload-URL throttle (10 per user per hour) is in-memory, per server instance. Storage limits and the orphan cleanup are the hard backstops.
- Retention runs on demand, not on a timer. Schedule it with your host's cron if you need it automatic.
- Admins can't re-open an approved verification. Revoking one needs a manual database change today.
- There's no public client profile page yet. A client's badge shows on job pages, the job feed and contract pages.
