-- migration 168: storybook_view_events — 스토리북 공유 링크 방문 추적
CREATE TABLE IF NOT EXISTS storybook_view_events (
  id             BIGSERIAL PRIMARY KEY,
  storybook_id   UUID      NOT NULL,
  share_key      TEXT,
  ref_access_key TEXT,
  viewed_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sb_view_events_storybook_id ON storybook_view_events (storybook_id);
CREATE INDEX IF NOT EXISTS idx_sb_view_events_viewed_at    ON storybook_view_events (viewed_at DESC);
