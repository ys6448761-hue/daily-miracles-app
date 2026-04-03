-- ═══════════════════════════════════════════════════════════
-- 046_dt_narrative_jobs.sql
-- Narrative Engine 상태 관리 큐
-- artifact_jobs 패턴 동일 적용
-- ═══════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE dt_narrative_status AS ENUM ('pending', 'processing', 'done', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS dt_narrative_jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id     UUID NOT NULL REFERENCES dt_stars(id) ON DELETE CASCADE,
  status      dt_narrative_status NOT NULL DEFAULT 'pending',
  chapters    TEXT[] NOT NULL DEFAULT '{}',   -- 완료된 챕터 키 목록
  error_msg   TEXT,
  attempts    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dt_narrative_jobs_star_id ON dt_narrative_jobs(star_id);
CREATE INDEX IF NOT EXISTS idx_dt_narrative_jobs_pending ON dt_narrative_jobs(status, created_at)
  WHERE status = 'pending';

COMMENT ON TABLE dt_narrative_jobs IS 'Narrative Engine 비동기 생성 큐 — artifact_jobs 패턴 동일';
