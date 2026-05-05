-- migration 170: stars.source_storybook_id — 스토리북 유입 귀속 추적
ALTER TABLE stars ADD COLUMN IF NOT EXISTS source_storybook_id UUID;
CREATE INDEX IF NOT EXISTS idx_stars_source_storybook_id ON stars (source_storybook_id)
  WHERE source_storybook_id IS NOT NULL;
