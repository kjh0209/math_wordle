-- 0001_stage_progression.sql
-- Extension specifically for the Mathle stage-based progression system.

-- This structure relies on an existing `puzzles` table which 
-- holds the raw finalized JSON spec.

-- 1. Stages (Worlds)
CREATE TABLE stages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_number int UNIQUE NOT NULL,
    title text NOT NULL,
    theme text,
    description text,
    is_published boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_stages_number ON stages(stage_number);

-- 2. Stage Steps (Nodes in a World)
CREATE TABLE stage_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id uuid NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    step_number int NOT NULL,
    code text UNIQUE NOT NULL,
    title text NOT NULL,
    description text,
    difficulty text,
    category text,
    is_boss boolean NOT NULL DEFAULT false,
    unlock_rule jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(stage_id, step_number)
);
CREATE INDEX idx_stage_steps_code ON stage_steps(code);
CREATE INDEX idx_stage_steps_is_boss ON stage_steps(is_boss);

-- 3. Step Puzzle Pool (5 puzzles mapped to 1 step)
CREATE TABLE step_puzzle_pool (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_step_id uuid NOT NULL REFERENCES stage_steps(id) ON DELETE CASCADE,
    puzzle_id text NOT NULL, -- references old puzzles table. assuming it is text, but adjust if puzzles is uuid
    variant_order int NOT NULL,
    weight int NOT NULL DEFAULT 1,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(stage_step_id, puzzle_id),
    UNIQUE(stage_step_id, variant_order)
);
CREATE INDEX idx_step_puzzle_pool_step_id ON step_puzzle_pool(stage_step_id);

-- 4. Play Sessions (Existing or new implementation)
CREATE TABLE IF NOT EXISTS play_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now()
    -- other fields like user_id if auth is added
);

-- 5. Step Attempt Runs (Every time a step is started)
CREATE TABLE step_attempt_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    play_session_id uuid NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,
    stage_step_id uuid NOT NULL REFERENCES stage_steps(id) ON DELETE CASCADE,
    puzzle_id text NOT NULL,
    run_index int NOT NULL DEFAULT 1,
    status text NOT NULL, -- 'playing', 'cleared', 'failed', 'abandoned'
    attempts_count int NOT NULL DEFAULT 0,
    max_attempts int NOT NULL,
    clear_time_ms int,
    guess_history jsonb NOT NULL DEFAULT '[]'::jsonb,
    feedback_history jsonb NOT NULL DEFAULT '[]'::jsonb,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz
);
CREATE INDEX idx_step_attempt_runs_session ON step_attempt_runs(play_session_id);
CREATE INDEX idx_step_attempt_runs_step ON step_attempt_runs(stage_step_id);

-- 6. User Step Progress (Aggregated status per session + step)
CREATE TABLE user_step_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    play_session_id uuid NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,
    stage_step_id uuid NOT NULL REFERENCES stage_steps(id) ON DELETE CASCADE,
    unlocked boolean NOT NULL DEFAULT false,
    cleared boolean NOT NULL DEFAULT false,
    best_attempts_count int,
    best_clear_time_ms int,
    clears_count int NOT NULL DEFAULT 0,
    failures_count int NOT NULL DEFAULT 0,
    seen_puzzle_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
    first_cleared_at timestamptz,
    last_played_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(play_session_id, stage_step_id)
);
CREATE INDEX idx_user_step_progress_cleared ON user_step_progress(cleared);
CREATE INDEX idx_user_step_progress_unlocked ON user_step_progress(unlocked);

-- 7. User Stage Progress (Aggregated status per session + stage)
CREATE TABLE user_stage_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    play_session_id uuid NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,
    stage_id uuid NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    unlocked boolean NOT NULL DEFAULT false,
    cleared_steps_count int NOT NULL DEFAULT 0,
    boss_cleared boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(play_session_id, stage_id)
);
