-- 124_simple_star_system.sql
-- 단순 별 시스템 (소원 + 여행 로그)
-- PRE-ON → ON 상태 전환, day1~day30 메시지 엔진용

CREATE TABLE IF NOT EXISTS stars (
  id           UUID        PRIMARY KEY,
  user_id      VARCHAR(200) NOT NULL,
  wish_text    TEXT        NOT NULL,
  gem_type     VARCHAR(50) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'PRE-ON',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_stars_user_id   ON stars (user_id);
CREATE INDEX IF NOT EXISTS idx_stars_status    ON stars (status);

CREATE TABLE IF NOT EXISTS star_logs (
  id         UUID        PRIMARY KEY,
  star_id    UUID        NOT NULL REFERENCES stars(id) ON DELETE CASCADE,
  emotion    VARCHAR(100),
  tag        VARCHAR(100),
  auto_text  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_star_logs_star_id ON star_logs (star_id);
