-- 158_star_share_events.sql
-- 공유 링크 생성 이벤트 추적
CREATE TABLE IF NOT EXISTS star_share_events (
  id         BIGSERIAL PRIMARY KEY,
  access_key TEXT      NOT NULL,
  channel    TEXT      DEFAULT 'link',   -- 'native', 'clipboard', 'kakao'
  shared_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_star_share_events_key ON star_share_events (access_key);
