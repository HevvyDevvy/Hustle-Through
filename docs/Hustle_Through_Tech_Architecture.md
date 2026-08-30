# Hustle Through — Tech & Monetization Architecture (v1 scope)

**Scope note:** this covers the story/career-progression game as designed in the Game Bible and Level Design doc — a single-player narrative game with light social/economy features (leaderboards, cosmetics, async comparison). It deliberately excludes real-time multiplayer/PvP, which is a future-phase decision, not part of this build.

---

## 1. Client

**Engine: Unity (2D/2.5D)**
- One codebase → iOS, Android, tablet. Handles the card-rack UI, job scenes, minigames (hacking node puzzle, tower-defence Dev/Defender missions) without needing separate native builds.
- Addressables for asset streaming — matters here because your tier-based visual direction (desaturated Rookie palette → neon Ganger-Hustler → cold Gangster-plus) means a lot of per-tier art that shouldn't all ship in the base install.
- Local save cache + server sync, not local-only saves — progression has to be server-authoritative (see below) so it can't be edited on-device.

---

## 2. Backend

**API layer:** Node.js (NestJS) or Go — either is fine, pick based on who's writing it. Go if you want it cheap to run at scale; Node if you want to move fast early and your dev partner already knows JS.

**Database:** PostgreSQL — player accounts, rank/level state, inventory, transaction ledger, job-completion history.

**Cache/session:** Redis — active session state, leaderboard sorted sets, rate-limiting.

**Why not a full game-backend platform (Nakama etc.) here:** those earn their keep once you have real-time multiplayer. For this scope, a plain REST/GraphQL API + Postgres + Redis is simpler to build, debug, and hire for.

**Core services:**
| Service | Responsibility |
|---|---|
| Auth | Account creation/login, session tokens |
| Progression | Rank, level, unlocked missions, story-flag state (e.g. Robbie's age-up state, DeadmanXXXII/V00D00 reveal flags) |
| Job Rack | Serves available job cards per rank/tier, marks completion, pays out |
| Economy | Soft currency (cash) and hard currency (premium) balances, all spend/earn events |
| IAP/Billing | Receipt validation, purchase fulfilment (below — this is the important one) |
| Leaderboard | Cash totals, rank standings, cosmetic flexes |

---

## 3. The Money Maker: In-App Purchases — Architecture

Your existing design rule — **"No IAP touches rank. Earned status, not bought status."** — has to be enforced at the data-model level, not just as a design promise, or it'll erode the first time someone asks "can we just add a rank-skip pack for revenue." Build it so that's structurally impossible without an engineer rewriting the economy service.

### 3.1 Two currencies, hard-separated

- **Cash (soft currency):** earned only through completing jobs. Used for: job unlock costs, non-cosmetic gameplay items available at your current rank, wagers in card-game style missions (per your naming bank — "win back a pub in a card game").
- **Notes/Chips (hard currency, purchased):** bought with real money. Can **only** be spent on a fixed allow-list of categories:
  - Cosmetics (mask skins, rack skins, car skins, gang-colour variants, the "sleek obsidian rack" as an unlockable-early cosmetic flex)
  - Convenience (energy/stamina refills if you add an energy-gate system, inventory slots, retry tokens for minigames like the hacking/tower-defence sequences)
  - Time-savers (skip a cooldown timer on job availability) — **never** skip story-gated content itself
- **Enforcement:** the Progression service has no code path that accepts hard currency as an input. Rank-up triggers only fire from the Job Rack/Progression service completing the rank-up mission (e.g. Level 20 "Trust Test," Level 70 finale). This is a schema-level guarantee, not a UI-level one — critical because it's the difference between a design intention and something that survives six months of feature requests.

### 3.2 Purchase flow (server-validated, not client-trusted)

Never let the client just say "purchase successful, give player 500 Notes" — this is the #1 way freemium games get drained by fraud/piracy.

1. Client initiates purchase via Apple App Store / Google Play Billing SDK.
2. Store returns a signed receipt to the client.
3. Client sends receipt to your **Billing service** — not to the client's own local state.
4. Billing service validates the receipt server-side against Apple's/Google's verification API.
5. Only on verified success does the Economy service credit the account.
6. Every transaction — verified or rejected — gets logged in an immutable transaction ledger table (for refund handling, chargebacks, and spotting abuse patterns).

### 3.3 What NOT to sell (guardrails worth writing down now)

- No rank-skip, no level-skip, no story-content unlock for cash.
- No pay-to-win stat boosts that trivialize PvE difficulty spikes (undermines the "Head Hustler must mean something" pillar from your own Game Bible).
- Loot boxes / randomized paid cosmetics are a legal grey area in several territories (Belgium, Netherlands, and tightening UK guidance) — if you want gacha-style cosmetics, budget time to check current regulations before building it, since this shifts by jurisdiction and changes over time.

---

## 4. Hosting

- **Containerize the API** (Docker) — this answers your "won't just build and host itself" instinct correctly. GitHub holds code; it doesn't run servers. You need:
  - A container registry (GitHub Container Registry or Docker Hub) that your CI pushes built images to.
  - A hosting platform that pulls and runs those containers: **Fly.io** or **Render** to start (cheap, simple, good enough for thousands of concurrent players), migrating to **AWS ECS/Fargate** or **GCP Cloud Run** if/when you need more control or scale.
- **No tunneling needed at this scope** — that's a peer-to-peer/real-time-multiplayer concern. Here, every client just makes normal HTTPS API calls to your hosted backend, same as any mobile app talking to a server.
- **CI/CD:** GitHub Actions (you're already using this for the Electron build per your other project) builds the Docker image, runs tests, pushes to registry, deploys to hosting platform on merge to main.
- **CDN:** for Addressables/art assets — Cloudflare R2 or AWS S3 + CloudFront, so the app binary stays small and tier-specific art streams on demand.

---

## 5. Push Notifications

Firebase Cloud Messaging (covers iOS + Android from one service) — for job-rack refreshes, "Auld Denny left a card," daily-return hooks. Ties into the Job Rack service: a scheduled job checks for players due a rack refresh and triggers FCM sends.

---

## 6. Suggested Build Order

1. Auth + Progression + Postgres schema (rank, level, story flags)
2. Job Rack service + first tier of levels wired to Unity client
3. Economy service (cash only — get the core loop feeling right before touching real money)
4. Billing/IAP service + receipt validation (Notes currency, cosmetic store)
5. Leaderboard + push notifications
6. Hosting/CI pipeline hardened for public release

---

*This doc assumes single-player-with-social-features scope. Real-time multiplayer/PvP (robbing, kidnapping, killing other players) is a distinct architecture — dedicated authoritative game servers, session-based matchmaking, anti-cheat — and should be scoped separately once this core loop is live and validated.*
