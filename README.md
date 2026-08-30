# Hustle Through — Project Repo (v1 scaffold)

Single-player story/career-progression game with server-authoritative rank, economy,
and IAP. Targets Windows, macOS, Android, and iOS from one Unity client talking to a
hosted backend. See `/docs` for the full design bible, level design, and architecture
docs this scaffold implements.

## What's actually in here

- **`/backend`** — real, runnable Node.js/TypeScript API: auth, progression, job rack,
  economy (dual-currency), and IAP receipt validation. This is the part you can run
  and test today.
- **`/client-unity/Assets/Scripts`** — C# scripts to drop into a Unity project (2D/2.5D
  template). Implements the client side of every backend service: API client, auth
  flow, progression display, job rack UI logic, currency display, and IAP purchase flow
  via Unity IAP.
- **`/.github/workflows`** — CI/CD: backend container build+deploy, and a multi-platform
  Unity build pipeline (Windows/macOS/Android/iOS) that runs once you plug in your own
  Unity licence and signing credentials as GitHub Secrets.
- **`/docs`** — the four design documents this scaffold is built from.

## What you still need to supply

1. **A Unity project.** Create a new 2D (or 2.5D URP) Unity project, then copy
   `client-unity/Assets/Scripts` into your project's `Assets/Scripts` folder. Unity
   will generate its own `.meta` files and project settings — those can't be faked
   from outside the Editor.
2. **Unity IAP package** installed via Package Manager (`com.unity.purchasing`) —
   the `IAPManager.cs` script assumes it's present.
3. **Apple Developer + Google Play Console accounts**, and their respective
   in-app-purchase product IDs configured to match `IAPCatalog.cs`.
4. **Signing credentials** (Apple certs/provisioning profiles, Android keystore) added
   as GitHub Actions secrets — the CI workflow references them but obviously can't
   contain them.
5. **A Postgres + Redis instance** — `docker-compose.yml` gives you both locally;
   for production, point the `.env` at a managed instance (e.g. Fly.io Postgres,
   Supabase, RDS).

## Quick start (backend only, runs today)

```bash
cd backend
cp .env.example .env
docker compose -f ../docker-compose.yml up -d     # starts postgres + redis
npm install
npm run migrate                                    # applies db/schema.sql
npm run dev                                         # starts API on :4000
```

Then hit `POST /auth/register`, `GET /jobs/rack`, etc. — see `backend/src/routes` for
the full endpoint list.

## Build order (matches the architecture doc)

1. Backend: auth + progression + Postgres schema ✅ (this scaffold)
2. Job rack service wired to seed data ✅ (Rookie tier seeded as the pattern — extend
   `backend/src/config/jobData.ts` with the rest of the 70 levels from
   `docs/Hustle_Through_Level_Design.md`)
3. Economy service (cash only) ✅
4. Billing/IAP service + receipt validation ✅ (stubbed verification calls — see
   `services/receiptValidation.ts` for where to drop in real Apple/Google endpoints)
5. Leaderboard + push notifications — not yet built, next increment
6. Unity client wiring — scripts provided, need to be dropped into an actual Unity
   project and wired to scene UI, which has to happen in the Editor
