-- =============================================================================
-- Migration: 001_initial_schema
-- Description: Core schema for Mathdle puzzle game
--
-- Design notes:
--   - raw_payload (jsonb) is intentionally flexible; final puzzle JSON schema TBD
--   - All puzzle content is stored in JSONB to survive schema evolution
--   - play_sessions provides anonymous session tracking without requiring auth
--   - play_records stores each completed game with full guess history
--   - leaderboard_snapshots is a denormalized cache for fast reads
-- =============================================================================

-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- TABLE: puzzles
-- =============================================================================
CREATE TABLE IF NOT EXISTS puzzles (
  id                        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                      TEXT          UNIQUE,

  -- Puzzle identity
  type                      TEXT          NOT NULL DEFAULT 'equation',
  title                     TEXT          NOT NULL,

  -- Core puzzle content (intentionally flexible JSONB)
  -- TODO: Add structured columns once final puzzle schema is finalized
  raw_payload               JSONB         NOT NULL DEFAULT '{}',
  display_payload           JSONB,        -- hint / display info (safe for client)
  answer_payload            JSONB,        -- answer data (never sent to client)

  -- Dimensions
  token_length              INTEGER,
  difficulty                TEXT          CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert') OR difficulty IS NULL),
  category                  TEXT,
  explanation               TEXT,

  -- Validation lifecycle
  validation_status         TEXT          NOT NULL DEFAULT 'draft'
                            CHECK (validation_status IN ('draft', 'valid', 'rejected', 'published')),
  validation_errors         JSONB,

  -- Generation metadata
  generator_type            TEXT          CHECK (generator_type IN ('manual', 'ai') OR generator_type IS NULL),
  generator_model           TEXT,
  generation_prompt_version TEXT,
  quality_score             FLOAT         CHECK (quality_score >= 0 AND quality_score <= 1),

  -- Publishing
  is_daily                  BOOLEAN       NOT NULL DEFAULT FALSE,
  daily_date                DATE          UNIQUE NULLS NOT DISTINCT,  -- only one puzzle per day
  is_public                 BOOLEAN       NOT NULL DEFAULT FALSE,

  -- Audit
  created_by                TEXT,
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER puzzles_updated_at
  BEFORE UPDATE ON puzzles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================================================
-- TABLE: puzzle_generation_jobs
-- Stores every AI generation attempt for auditing and retry logic
-- =============================================================================
CREATE TABLE IF NOT EXISTS puzzle_generation_jobs (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Request parameters
  requested_type        TEXT,
  requested_category    TEXT,
  requested_difficulty  TEXT,
  requested_constraints JSONB,

  -- Execution
  status                TEXT        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'success', 'failed')),
  model                 TEXT,
  raw_prompt            TEXT,
  raw_response          TEXT,
  parsed_payload        JSONB,      -- The extracted puzzle payload before validation
  error_message         TEXT,

  -- Outcome
  created_puzzle_id     UUID        REFERENCES puzzles(id) ON DELETE SET NULL,
  requested_by          TEXT,

  -- Audit
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER puzzle_generation_jobs_updated_at
  BEFORE UPDATE ON puzzle_generation_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================================================
-- TABLE: play_sessions
-- Anonymous session per browser. No auth required.
-- =============================================================================
CREATE TABLE IF NOT EXISTS play_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key TEXT        NOT NULL UNIQUE,  -- UUID stored in localStorage
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER play_sessions_updated_at
  BEFORE UPDATE ON play_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================================================
-- TABLE: play_records
-- One row per completed (or abandoned) game
-- =============================================================================
CREATE TABLE IF NOT EXISTS play_records (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id        UUID        NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  play_session_id  UUID        NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,

  -- Game parameters
  mode             TEXT        NOT NULL DEFAULT 'daily'
                   CHECK (mode IN ('daily', 'practice', 'shared')),
  attempts_count   INTEGER     NOT NULL DEFAULT 0,
  max_attempts     INTEGER     NOT NULL DEFAULT 6,

  -- Outcome
  cleared          BOOLEAN     NOT NULL DEFAULT FALSE,
  clear_time_ms    INTEGER,    -- NULL if not cleared

  -- Timing
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,

  -- Full history (flexible JSONB, survives token schema changes)
  guess_history    JSONB       NOT NULL DEFAULT '[]',
  feedback_history JSONB       NOT NULL DEFAULT '[]',

  -- Extras
  raw_result_payload JSONB,
  share_code         TEXT      UNIQUE,  -- short code for /share/[code]

  -- Audit
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- TABLE: leaderboard_snapshots
-- Denormalized cache updated when a record is added.
-- Avoids expensive aggregation queries on every leaderboard page load.
-- =============================================================================
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id           UUID        NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  date_key            DATE        NOT NULL,
  total_players       INTEGER     NOT NULL DEFAULT 0,
  total_clears        INTEGER     NOT NULL DEFAULT 0,
  best_time_ms        INTEGER,
  best_attempts_count INTEGER,
  snapshot_payload    JSONB       NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (puzzle_id, date_key)
);
