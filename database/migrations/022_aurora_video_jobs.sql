-- Migration 022: aurora_video_jobs — Aurora Engine 전용 상태머신
-- AIL-2026-0301-VIDJOB-001
-- SSOT: NEW → RENDERING → ASSEMBLING → DONE
-- 기존 video_jobs(Hero8/adCreative 8단계)와 별도 테이블로 분리

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS aurora_video_jobs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 입력 스펙
  spec_json        JSONB NOT NULL,

  -- 상태머신
  status           TEXT NOT NULL DEFAULT 'NEW'
                   CHECK (status IN ('NEW','RENDERING','ASSEMBLING','DONE','FAILED','CANCELLED')),

  -- 재시도 정책
  attempt          INTEGER NOT NULL DEFAULT 0,
  max_attempts     INTEGER NOT NULL DEFAULT 3,
  retryable        BOOLEAN NOT NULL DEFAULT TRUE,   -- Gate 실패 시 FALSE

  -- 워커 스케줄
  next_run_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 분산 락 (SELECT FOR UPDATE SKIP LOCKED 보조)
  locked_at        TIMESTAMPTZ,
  locked_by        TEXT,           -- '{hostname}-{pid}'

  -- 타임스탬프
  started_at       TIMESTAMPTZ,
  finished_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 에러 추적
  last_error       TEXT,
  last_error_stage TEXT,           -- RENDERING | ASSEMBLING | GATE

  -- 산출물 경로
  artifacts        JSONB           -- { u1:"...", rough:"...", final:"..." }
);

-- ── 인덱스 ─────────────────────────────────────────────────────────────────
-- 워커 폴링: 처리 가능한 Job 빠른 조회
CREATE INDEX IF NOT EXISTS idx_aurora_vjobs_poll
  ON aurora_video_jobs (status, next_run_at)
  WHERE locked_at IS NULL;

-- 스턱 Job 감지: locked_at 오래된 것 조회
CREATE INDEX IF NOT EXISTS idx_aurora_vjobs_locked
  ON aurora_video_jobs (locked_at)
  WHERE locked_at IS NOT NULL;

-- 운영 조회: 최신순
CREATE INDEX IF NOT EXISTS idx_aurora_vjobs_created
  ON aurora_video_jobs (created_at DESC);

-- ── updated_at 자동 갱신 트리거 ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_aurora_vjobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_aurora_vjobs_updated_at ON aurora_video_jobs;
CREATE TRIGGER trg_aurora_vjobs_updated_at
  BEFORE UPDATE ON aurora_video_jobs
  FOR EACH ROW EXECUTE FUNCTION update_aurora_vjobs_updated_at();
