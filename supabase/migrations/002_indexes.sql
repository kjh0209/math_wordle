-- =============================================================================
-- Migration: 002_indexes
-- Description: Performance indexes for Mathdle schema
-- =============================================================================

-- puzzles: most common query patterns
CREATE INDEX IF NOT EXISTS idx_puzzles_is_daily ON puzzles (is_daily) WHERE is_daily = TRUE;
CREATE INDEX IF NOT EXISTS idx_puzzles_daily_date ON puzzles (daily_date) WHERE daily_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_puzzles_validation_status ON puzzles (validation_status);
CREATE INDEX IF NOT EXISTS idx_puzzles_is_public ON puzzles (is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_puzzles_type ON puzzles (type);
CREATE INDEX IF NOT EXISTS idx_puzzles_difficulty ON puzzles (difficulty);
CREATE INDEX IF NOT EXISTS idx_puzzles_category ON puzzles (category);
CREATE INDEX IF NOT EXISTS idx_puzzles_created_at ON puzzles (created_at DESC);

-- puzzle_generation_jobs
CREATE INDEX IF NOT EXISTS idx_gen_jobs_status ON puzzle_generation_jobs (status);
CREATE INDEX IF NOT EXISTS idx_gen_jobs_created_puzzle ON puzzle_generation_jobs (created_puzzle_id)
  WHERE created_puzzle_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gen_jobs_created_at ON puzzle_generation_jobs (created_at DESC);

-- play_sessions
CREATE INDEX IF NOT EXISTS idx_play_sessions_session_key ON play_sessions (session_key);

-- play_records: leaderboard queries
CREATE INDEX IF NOT EXISTS idx_play_records_puzzle_cleared
  ON play_records (puzzle_id, cleared, attempts_count, clear_time_ms)
  WHERE cleared = TRUE;

CREATE INDEX IF NOT EXISTS idx_play_records_puzzle_mode
  ON play_records (puzzle_id, mode);

CREATE INDEX IF NOT EXISTS idx_play_records_session
  ON play_records (play_session_id);

CREATE INDEX IF NOT EXISTS idx_play_records_share_code
  ON play_records (share_code)
  WHERE share_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_play_records_completed_at
  ON play_records (completed_at DESC)
  WHERE completed_at IS NOT NULL;

-- leaderboard_snapshots
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_puzzle_date
  ON leaderboard_snapshots (puzzle_id, date_key DESC);


-- =============================================================================
-- Row Level Security (RLS) setup
-- Uncomment when connecting via Supabase Auth
-- =============================================================================

-- ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE play_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE play_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read for published puzzles:
-- CREATE POLICY "puzzles_public_read" ON puzzles
--   FOR SELECT USING (is_public = TRUE AND validation_status = 'published');

-- Play sessions: users can only see/modify their own session:
-- CREATE POLICY "play_sessions_own" ON play_sessions
--   FOR ALL USING (session_key = current_setting('request.jwt.claims', true)::json->>'session_key');

-- Play records: users can insert their own records:
-- CREATE POLICY "play_records_insert_own" ON play_records
--   FOR INSERT WITH CHECK (
--     play_session_id IN (
--       SELECT id FROM play_sessions
--       WHERE session_key = current_setting('request.jwt.claims', true)::json->>'session_key'
--     )
--   );
