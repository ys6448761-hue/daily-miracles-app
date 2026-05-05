-- migration 166: storybook_items — 스토리북 슬라이드 개별 행
CREATE TABLE IF NOT EXISTS storybook_items (
  id           BIGSERIAL PRIMARY KEY,
  storybook_id UUID      NOT NULL,
  slide_order  INT       NOT NULL,
  type         TEXT      NOT NULL CHECK (type IN ('image','text')),
  role         TEXT,
  location     TEXT,
  emotion      TEXT,
  image_url    TEXT,
  content      TEXT
);

CREATE INDEX IF NOT EXISTS idx_storybook_items_storybook_id ON storybook_items (storybook_id);
