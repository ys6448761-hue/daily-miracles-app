-- 159_star_visit_events.sql
-- ?ref= 공유 링크 방문 이벤트 추적 (전환 여부는 stars.parent_ref로 역산)
CREATE TABLE IF NOT EXISTS star_visit_events (
  id              BIGSERIAL PRIMARY KEY,
  ref_access_key  TEXT      NOT NULL,   -- 공유한 별의 access_key
  visited_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_star_visit_events_ref ON star_visit_events (ref_access_key);
