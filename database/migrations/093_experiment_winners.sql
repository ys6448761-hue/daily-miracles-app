-- 093_experiment_winners.sql
-- 실험 자동 승자 기록 테이블
-- setGlobalVariant() 가 기록 → getActiveVariant() 가 랜덤 배정 대신 반환

CREATE TABLE IF NOT EXISTS dt_experiment_winners (
  id             SERIAL PRIMARY KEY,
  experiment_key VARCHAR(60) NOT NULL,
  winner         VARCHAR(10) NOT NULL,          -- 'A' | 'B'
  rate_a         NUMERIC(5,1),
  rate_b         NUMERIC(5,1),
  sample_a       INT,
  sample_b       INT,
  promoted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (experiment_key)                       -- 실험당 최신 1행 유지
);
