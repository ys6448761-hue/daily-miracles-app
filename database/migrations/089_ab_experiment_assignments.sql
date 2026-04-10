-- 089_ab_experiment_assignments.sql
-- A/B 실험 배정 테이블 — 루미 전환율 실험 P0

-- ── 실험 배정 테이블 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_experiment_assignments (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL,
  experiment_key VARCHAR(60) NOT NULL,     -- 예: 'ai_upsell_v1'
  group_name     VARCHAR(10) NOT NULL,     -- 'A' | 'B'
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, experiment_key)
);

CREATE INDEX IF NOT EXISTS idx_exp_assignments_user  ON dt_experiment_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_exp_assignments_exp   ON dt_experiment_assignments(experiment_key, group_name);

-- ── 실험 노출 로그 (funnel 분석용) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_experiment_exposures (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID,
  experiment_key VARCHAR(60) NOT NULL,
  group_name     VARCHAR(10) NOT NULL,
  stage          VARCHAR(30) NOT NULL,   -- 'day1' | 'day3' | 'limit'
  event_name     VARCHAR(50) NOT NULL,   -- 'upgrade_prompt_shown' | 'upgrade_clicked' | 'purchase_completed'
  copy_variant   VARCHAR(10),            -- 'A' | 'B' (문구 실험)
  product_type   VARCHAR(20),
  context        JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exp_exposures_exp   ON dt_experiment_exposures(experiment_key, group_name, event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exp_exposures_stage ON dt_experiment_exposures(stage, event_name);
CREATE INDEX IF NOT EXISTS idx_exp_exposures_user  ON dt_experiment_exposures(user_id);
