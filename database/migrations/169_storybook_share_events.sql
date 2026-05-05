-- migration 169: storybook_share_events — 스토리북 내 공유 버튼 클릭 추적
CREATE TABLE IF NOT EXISTS storybook_share_events (
  id           BIGSERIAL PRIMARY KEY,
  storybook_id UUID      NOT NULL,
  share_key    TEXT,
  channel      TEXT      NOT NULL DEFAULT 'link',
  shared_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sb_share_events_storybook_id ON storybook_share_events (storybook_id);
