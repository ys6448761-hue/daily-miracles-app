-- migration 171: impacts — 스토리북 완독 후 감정/행동 임팩트 기록
CREATE TABLE IF NOT EXISTS impacts (
  id           BIGSERIAL PRIMARY KEY,
  journey_id   UUID,
  storybook_id UUID,
  access_key   TEXT,
  emotion_result TEXT,
  action_type    TEXT,
  impact_level   INT CHECK (impact_level BETWEEN 1 AND 5),
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_impacts_journey_id   ON impacts (journey_id)   WHERE journey_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_impacts_storybook_id ON impacts (storybook_id) WHERE storybook_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_impacts_created_at   ON impacts (created_at DESC);
