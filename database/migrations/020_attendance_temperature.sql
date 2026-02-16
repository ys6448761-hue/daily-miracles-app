-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 020: Living Wisdom 출석 + 체온 시스템
--
-- Tables:
--   attendance_events  — 출석 이벤트 원장 (SSOT)
--   temperature_state  — 유저별 현재 체온/스트릭 캐시
--
-- Key constraints:
--   uniq_daily_open — user_id + event_date + open 이벤트 하루 1회 강제
--
-- @since 2026-02-14
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────
-- A. attendance_events (원장 / SSOT)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('open', 'pay_success')),
  event_date DATE NOT NULL,
  page       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- open 이벤트 하루 1회 강제 (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_daily_open
ON attendance_events (user_id, event_date)
WHERE event_type = 'open';

-- 조회 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_attendance_user_date
ON attendance_events (user_id, event_date DESC);

-- ─────────────────────────────────────────────────────
-- B. temperature_state (현재 상태 캐시)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS temperature_state (
  user_id        TEXT PRIMARY KEY,
  temperature    NUMERIC DEFAULT 36.5,
  streak         INTEGER DEFAULT 0,
  last_open_date DATE,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 020 완료: attendance_events + temperature_state';
    RAISE NOTICE '   [1] attendance_events — open 하루 1회 unique constraint';
    RAISE NOTICE '   [2] temperature_state — streak + temperature 캐시';
END $$;
