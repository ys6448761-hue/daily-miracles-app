-- Migration 146: journeys + moments — Journey/Moment API (SSOT)
-- Journey = 스토리북 / Moment = 페이지 (append-only, 수정/삭제 없음)
-- 주의: journeys 테이블이 이미 다른 스키마로 존재할 수 있음 → ADD COLUMN IF NOT EXISTS 방어

CREATE TABLE IF NOT EXISTS journeys (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id      UUID        REFERENCES stars(id) ON DELETE CASCADE,
  journey_type VARCHAR(30) NOT NULL DEFAULT 'travel',
  title        VARCHAR(200),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 기존 journeys 테이블에 star_id 컬럼이 없는 경우 추가 (이미 있으면 no-op)
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS star_id      UUID        REFERENCES stars(id) ON DELETE CASCADE;
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS journey_type VARCHAR(30) DEFAULT 'travel';
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS title        VARCHAR(200);

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
