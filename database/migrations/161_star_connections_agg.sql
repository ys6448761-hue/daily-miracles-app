-- 161_star_connections_agg.sql
-- ref별 방문 집계 테이블 (first/last/revisit)
CREATE TABLE IF NOT EXISTS star_connections_agg (
  ref_access_key  TEXT      PRIMARY KEY,
  first_seen_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  revisit_count   INT       NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_star_connections_agg_last ON star_connections_agg (last_seen_at DESC);
