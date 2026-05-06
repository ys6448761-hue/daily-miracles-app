-- 153_constellation_stars.sql
-- 별자리 ↔ 별 연결 테이블
-- star_id는 dt_stars.id (DreamTown 메인 흐름) — FK 없이 UUID 저장

CREATE TABLE IF NOT EXISTS constellation_stars (
  constellation_id VARCHAR(100) REFERENCES constellations(id),
  star_id          UUID         NOT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (constellation_id, star_id)
);

CREATE INDEX IF NOT EXISTS idx_constellation_stars_star_id ON constellation_stars (star_id);
