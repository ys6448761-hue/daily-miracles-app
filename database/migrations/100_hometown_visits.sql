-- 100_hometown_visits.sql — 고향 방문 기록 테이블

CREATE TABLE IF NOT EXISTS hometown_visits (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id      UUID        NOT NULL REFERENCES dt_stars(id)    ON DELETE CASCADE,
  partner_id   UUID        NOT NULL REFERENCES dt_partners(id) ON DELETE CASCADE,
  visit_number INTEGER     NOT NULL DEFAULT 1,
  is_first_visit BOOLEAN   NOT NULL DEFAULT FALSE,
  visited_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hometown_visits_star    ON hometown_visits(star_id);
CREATE INDEX IF NOT EXISTS idx_hometown_visits_partner ON hometown_visits(partner_id);
CREATE INDEX IF NOT EXISTS idx_hometown_visits_date    ON hometown_visits(visited_at DESC);
