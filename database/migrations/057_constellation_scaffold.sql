-- 057_constellation_scaffold.sql
-- Constellation 기능 선구축 (데이터 축적 단계, UI 미노출)
-- dt_stars에 constellation 확장 컬럼 추가 + star_logs 생성
-- Created: 2026-04-06

-- ① dt_stars 확장 컬럼
ALTER TABLE dt_stars
  ADD COLUMN IF NOT EXISTS constellation_type  VARCHAR(50),
  ADD COLUMN IF NOT EXISTS constellation_pose  VARCHAR(50),
  ADD COLUMN IF NOT EXISTS cluster_id          UUID,
  ADD COLUMN IF NOT EXISTS resonance_count     INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_resonated_at   TIMESTAMPTZ;

-- ② star_logs — 공명/기록 이벤트 원장 (append-only)
CREATE TABLE IF NOT EXISTS star_logs (
  id          SERIAL       PRIMARY KEY,
  star_id     UUID         NOT NULL,
  action_type VARCHAR(50)  NOT NULL CHECK (action_type IN ('resonance', 'record')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_star_logs_star_id    ON star_logs(star_id);
CREATE INDEX IF NOT EXISTS idx_star_logs_action_created ON star_logs(action_type, created_at);
