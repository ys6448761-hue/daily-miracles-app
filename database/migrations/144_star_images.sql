-- Migration 144: star_images — SSOT 이미지 생성 시스템
-- 별 생성 후 자동 생성된 감정 이미지 저장

CREATE TABLE IF NOT EXISTS star_images (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id         UUID         REFERENCES stars(id) ON DELETE CASCADE,
  image_url       TEXT         NOT NULL,
  emotion_text    VARCHAR(100),
  location        VARCHAR(50),
  prompt_used     TEXT,
  validation_pass BOOLEAN      DEFAULT NULL,
  share_count     INT          NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_star_images_star_id    ON star_images (star_id);
CREATE INDEX IF NOT EXISTS idx_star_images_location   ON star_images (location);
CREATE INDEX IF NOT EXISTS idx_star_images_created_at ON star_images (created_at DESC);
