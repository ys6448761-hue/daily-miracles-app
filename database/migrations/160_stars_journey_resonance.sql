-- 160_stars_journey_resonance.sql
-- stars 테이블에 journey_id + resonance_score 추가
ALTER TABLE stars ADD COLUMN IF NOT EXISTS journey_id      UUID;
ALTER TABLE stars ADD COLUMN IF NOT EXISTS resonance_score INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_stars_journey_id      ON stars (journey_id)      WHERE journey_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stars_resonance_score ON stars (resonance_score) WHERE resonance_score > 0;
