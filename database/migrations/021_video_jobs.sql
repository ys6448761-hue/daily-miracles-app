-- Migration 021: video_jobs 상태머신 테이블
-- AIL-2026-0219-VID-003: Miracle Video System 완전 자동화
-- SSOT: QUEUED → BUILD → VALIDATE → RENDER → SUBTITLE → PACKAGE → DELIVER → DONE

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS video_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      TEXT UNIQUE NOT NULL,
  job_type        TEXT NOT NULL DEFAULT 'hero8'
                  CHECK (job_type IN ('hero8', 'adCreative')),

  -- 입력 파라미터
  hero_id         TEXT NOT NULL DEFAULT 'HERO1',
  topic           TEXT NOT NULL,
  mood            TEXT NOT NULL DEFAULT 'calm',
  tier            TEXT NOT NULL DEFAULT 'free'
                  CHECK (tier IN ('free', 'premium')),
  config_id       TEXT,                          -- adCreative용 (healing-high 등)
  user_context    JSONB DEFAULT '{}',

  -- 상태머신
  status          TEXT NOT NULL DEFAULT 'QUEUED'
                  CHECK (status IN (
                    'QUEUED', 'BUILD', 'VALIDATE', 'RENDER',
                    'SUBTITLE', 'PACKAGE', 'DELIVER', 'DONE', 'FAILED'
                  )),
  error_code      TEXT,
  error_message   TEXT,
  retry_count     INTEGER DEFAULT 0,
  max_retries     INTEGER DEFAULT 5,

  -- 산출물
  output_dir      TEXT,
  meta_json       JSONB DEFAULT '{}',
  cix_video       JSONB DEFAULT '{}',

  -- 타임스탬프
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_video_jobs_status     ON video_jobs (status);
CREATE INDEX IF NOT EXISTS idx_video_jobs_request_id ON video_jobs (request_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_created    ON video_jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_jobs_type       ON video_jobs (job_type);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_video_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_video_jobs_updated_at ON video_jobs;
CREATE TRIGGER trg_video_jobs_updated_at
  BEFORE UPDATE ON video_jobs
  FOR EACH ROW EXECUTE FUNCTION update_video_jobs_updated_at();
