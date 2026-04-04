-- 050_dt_experiments.sql
-- A/B 실험 정의 테이블
-- SSOT: docs/ssot/core/DreamTown_Event_SSOT.md (Coupon Experiment v1)

CREATE TABLE IF NOT EXISTS dt_experiments (
  id          TEXT        PRIMARY KEY,            -- 'coupon_test_1'
  name        TEXT        NOT NULL,
  description TEXT,
  variants    JSONB       NOT NULL DEFAULT '["A","B"]',
  status      TEXT        NOT NULL DEFAULT 'active', -- active | paused | completed
  winner      TEXT,                               -- A | B | null
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at    TIMESTAMPTZ
);

-- 실험 1: cablecar 장면 감정 문장 A/B 테스트
INSERT INTO dt_experiments (id, name, description) VALUES (
  'coupon_test_1',
  'cablecar 감정 문장 A/B',
  'A: 기본 감정 문장 / B: 강화된 감정 문장 — emotion→action 전환율 측정'
) ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_dt_experiments_status ON dt_experiments (status);
