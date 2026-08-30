-- Hustle Through — core schema
-- Design rule encoded here: rank/level can ONLY change via progression_events
-- rows written by the job-completion path. There is no column or code path
-- that lets a purchase transaction touch `players.rank` or `players.level`.

CREATE TABLE IF NOT EXISTS players (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    display_name    TEXT NOT NULL,
    rank            INTEGER NOT NULL DEFAULT 1,      -- 1..14, see rank_definitions
    level           INTEGER NOT NULL DEFAULT 1,      -- 1..70
    cash_balance    BIGINT NOT NULL DEFAULT 0,       -- soft currency, earned only
    notes_balance   BIGINT NOT NULL DEFAULT 0,       -- hard currency, purchased only
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rank_definitions (
    rank            INTEGER PRIMARY KEY,
    title           TEXT NOT NULL,             -- "Rookie", "Younger", ... "Head Hustler"
    unlock_level    INTEGER NOT NULL,          -- level at which this rank begins
    tier            TEXT NOT NULL              -- "Gold" | "Platinum" | "Diamond-Enhanced"
);

CREATE TABLE IF NOT EXISTS jobs (
    id              TEXT PRIMARY KEY,          -- e.g. 'lvl-01-ask-for-granny-doreen'
    level           INTEGER NOT NULL,
    rank_required   INTEGER NOT NULL REFERENCES rank_definitions(rank),
    title           TEXT NOT NULL,
    location        TEXT NOT NULL,
    task_description TEXT NOT NULL,
    cash_reward     BIGINT NOT NULL DEFAULT 0,
    is_story_gate   BOOLEAN NOT NULL DEFAULT false,   -- rank-up mission?
    is_bonus_pool   BOOLEAN NOT NULL DEFAULT false,   -- repeatable cash-in-hand filler job
    story_flags_set JSONB DEFAULT '{}'::jsonb          -- narrative flags this job can flip
);

-- Every completed job is recorded here. Progression (rank/level advancement)
-- is derived ONLY from rows in this table — never from purchases.
CREATE TABLE IF NOT EXISTS progression_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    job_id          TEXT NOT NULL REFERENCES jobs(id),
    cash_awarded    BIGINT NOT NULL,
    rank_after      INTEGER NOT NULL,
    level_after     INTEGER NOT NULL,
    completed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Player-visible story flags (Robbie's age-up state, DeadmanXXXII/V00D00 reveal
-- progress, etc.) — set only by progression_events, never by purchases.
CREATE TABLE IF NOT EXISTS player_story_flags (
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    flag_key        TEXT NOT NULL,
    flag_value      JSONB NOT NULL,
    PRIMARY KEY (player_id, flag_key)
);

-- Cosmetic/convenience catalog — the ONLY things purchasable with Notes (hard currency).
CREATE TABLE IF NOT EXISTS store_items (
    sku             TEXT PRIMARY KEY,             -- matches Apple/Google product ID
    category        TEXT NOT NULL CHECK (category IN ('cosmetic', 'convenience', 'time_saver')),
    name            TEXT NOT NULL,
    description     TEXT NOT NULL,
    price_notes     BIGINT,                       -- price if bought with in-game hard currency
    price_real_usd_cents INTEGER,                 -- price if bought directly with real money
    active          BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS player_inventory (
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    sku             TEXT NOT NULL REFERENCES store_items(sku),
    acquired_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (player_id, sku)
);

-- Immutable transaction ledger — every purchase attempt, verified or rejected.
-- Never deleted; used for refunds, chargebacks, and fraud pattern detection.
CREATE TABLE IF NOT EXISTS transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    platform        TEXT NOT NULL CHECK (platform IN ('apple', 'google')),
    product_sku     TEXT NOT NULL,
    raw_receipt     TEXT NOT NULL,
    verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'verified', 'rejected', 'refunded')),
    notes_credited  BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_progression_player ON progression_events(player_id);
CREATE INDEX IF NOT EXISTS idx_transactions_player ON transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_jobs_rank ON jobs(rank_required);

-- Seed rank definitions (from the Level Design doc)
INSERT INTO rank_definitions (rank, title, unlock_level, tier) VALUES
    (1,  'Rookie',            1,  'Gold'),
    (2,  'Younger',           5,  'Gold'),
    (3,  'Short General',     10, 'Gold'),
    (4,  'Player',            15, 'Gold'),
    (5,  'Ganger',            20, 'Platinum'),
    (6,  'Shot Caller',       25, 'Platinum'),
    (7,  'Crew Leader',       30, 'Platinum'),
    (8,  'Playmaker',         35, 'Platinum'),
    (9,  'Trapper',           40, 'Platinum'),
    (10, 'Hustler',           45, 'Platinum'),
    (11, 'Gangster',          50, 'Diamond-Enhanced'),
    (12, 'Contender',         55, 'Diamond-Enhanced'),
    (13, 'Second in Command', 60, 'Diamond-Enhanced'),
    (14, 'Head Hustler',      70, 'Diamond-Enhanced')
ON CONFLICT (rank) DO NOTHING;
