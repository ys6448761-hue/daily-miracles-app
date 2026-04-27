-- Migration 146: journeys + moments — Journey/Moment API (SSOT)
-- Journey = 스토리북 / Moment = 페이지 (append-only, 수정/삭제 없음)

CREATE TABLE IF NOT EXISTS journeys (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id      UUID        REFERENCES stars(id) ON DELETE CASCADE,
  journey_type VARCHAR(30) NOT NULL DEFAULT 'travel',
  title        VARCHAR(200),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journeys_star_id    ON journeys (star_id);
CREATE INDEX IF NOT EXISTS idx_journeys_created_at ON journeys (created_at DESC);

CREATE TABLE IF NOT EXISTS moments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id   UUID        NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  emotion      TEXT        NOT NULL,
  context_type VARCHAR(50),
  image_url    TEXT,
  is_fallback  BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moments_journey_id  ON moments (journey_id, created_at ASC);
