-- 162_storybooks.sql
-- 공유 가능한 스토리북 저장
CREATE TABLE IF NOT EXISTS storybooks (
  id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  access_key  TEXT,               -- 출발 별의 access_key
  journey_id  UUID,               -- 여정 연결 ID
  slides      JSONB     NOT NULL,  -- storybook JSON 배열
  meta        JSONB,               -- first_emotion, last_emotion, flow_type 등
  created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_storybooks_access_key ON storybooks (access_key);
CREATE INDEX IF NOT EXISTS idx_storybooks_journey_id  ON storybooks (journey_id) WHERE journey_id IS NOT NULL;
