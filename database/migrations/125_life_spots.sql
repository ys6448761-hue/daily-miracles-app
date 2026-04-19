-- 125_life_spots.sql
-- Life Spot 시스템: 일상 공간 → 감정 해석 → 성장 로그

-- A. 사용자 일상 공간 마스터
CREATE TABLE IF NOT EXISTS life_spots (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL,
  spot_name         VARCHAR(100) NOT NULL,
  spot_type         VARCHAR(30)  NOT NULL, -- home / work / cafe / outdoor / transit / other
  is_favorite       BOOLEAN      DEFAULT false,
  emotion_pattern   JSONB        DEFAULT '[]'::jsonb,
  visit_count       INT          DEFAULT 0,
  last_visited_at   TIMESTAMP    NULL,
  created_at        TIMESTAMP    DEFAULT NOW(),
  updated_at        TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_life_spots_user_id ON life_spots(user_id);
CREATE INDEX IF NOT EXISTS idx_life_spots_type    ON life_spots(spot_type);

-- B. 방문/기록 로그 (append-only 원장)
CREATE TABLE IF NOT EXISTS life_spot_logs (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID         NOT NULL,
  spot_id          UUID         NOT NULL REFERENCES life_spots(id) ON DELETE CASCADE,
  state            VARCHAR(30)  NOT NULL,
  scene            TEXT         NOT NULL,
  action           TEXT         NOT NULL,
  direction        TEXT         NOT NULL,
  emotion_signal   VARCHAR(50)  NOT NULL,
  help_tag         VARCHAR(30)  NOT NULL,
  growth_sentence  VARCHAR(100) NOT NULL,
  question_type    VARCHAR(30)  NULL,
  question_answer  VARCHAR(100) NULL,
  source_type      VARCHAR(20)  NOT NULL DEFAULT 'daily', -- daily / travel
  created_at       TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_life_spot_logs_user    ON life_spot_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_life_spot_logs_spot    ON life_spot_logs(spot_id);
CREATE INDEX IF NOT EXISTS idx_life_spot_logs_created ON life_spot_logs(created_at DESC);

-- C. 사용자 반응 성향 프로필
CREATE TABLE IF NOT EXISTS user_preference_profiles (
  user_id                UUID        PRIMARY KEY,
  question_preference    VARCHAR(20) DEFAULT 'auto', -- low / medium / high / auto
  question_response_rate NUMERIC(5,2) DEFAULT 0,
  action_response_rate   NUMERIC(5,2) DEFAULT 0,
  dominant_spot_type     VARCHAR(30)  NULL,
  updated_at             TIMESTAMP    DEFAULT NOW()
);
