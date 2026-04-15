-- Migration 118: 여수 미션 + 일일 로그 + 포인트 시스템
-- Created: 2026-04-13

-- ── 1. 미션 마스터 테이블 ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_yeosu_missions (
  id          VARCHAR(50)   PRIMARY KEY,
  title       VARCHAR(100)  NOT NULL,
  description VARCHAR(200),
  icon        VARCHAR(10),
  points      INT           NOT NULL DEFAULT 100,
  emotions    JSONB         NOT NULL DEFAULT '[]',
  sort_order  INT           NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── 2. 미션 완료 기록 ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_mission_completions (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  star_id         UUID        NOT NULL,
  user_id         VARCHAR(100) NOT NULL,
  mission_id      VARCHAR(50) NOT NULL REFERENCES dt_yeosu_missions(id),
  emotion         VARCHAR(30),
  points_awarded  INT         NOT NULL DEFAULT 100,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(star_id, mission_id)
);

CREATE INDEX IF NOT EXISTS idx_mission_completions_star ON dt_mission_completions(star_id);

-- ── 3. 일일 여수 감정 로그 ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_daily_logs (
  id             UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  star_id        UUID         NOT NULL,
  user_id        VARCHAR(100) NOT NULL,
  log_date       DATE         NOT NULL DEFAULT CURRENT_DATE,
  emotion        VARCHAR(30),
  memo           VARCHAR(300),
  points_awarded INT          NOT NULL DEFAULT 50,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(star_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_star ON dt_daily_logs(star_id);

-- ── 4. 미션 씨드 데이터 ─────────────────────────────────────────
INSERT INTO dt_yeosu_missions (id, title, description, icon, points, emotions, sort_order) VALUES
  ('yeosu_cablecar',   '케이블카 탑승',    '해상 케이블카를 타며 여수 바다를 바라봐요',   '🚡', 100, '["설레임","감동","행복","평온","기대"]', 1),
  ('yeosu_dolsan',     '돌산공원 야경',    '돌산공원에서 여수의 빛나는 야경을 감상해요', '🌃', 100, '["감동","황홀","평온","그리움","설레임"]', 2),
  ('yeosu_odoong',     '오동도 산책',      '꽃이 피는 오동도를 천천히 걸어봐요',         '🌸', 100, '["평온","행복","치유","그리움","감동"]', 3),
  ('yeosu_seafood',    '여수 해산물 먹기', '싱싱한 여수 해산물로 특별한 한 끼를 해요',   '🦞', 100, '["행복","만족","설레임","감사","기대"]', 4),
  ('yeosu_sunrise',    '향일암 일출',      '향일암에서 떠오르는 태양을 맞이해요',         '🌅', 100, '["감동","경이","행복","새로움","희망"]', 5)
ON CONFLICT (id) DO NOTHING;
