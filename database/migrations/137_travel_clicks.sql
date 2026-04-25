-- Migration 137: travel_clicks — 여행 전환 의도 로그
CREATE TABLE IF NOT EXISTS travel_clicks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id      UUID,                            -- nullable (익명 진입 허용)
  access_key   VARCHAR(12),
  theme        VARCHAR(20),                     -- 'rest' | 'thrill' | 'settle'
  hotel_name   VARCHAR(100),
  action_type  VARCHAR(20) NOT NULL
    CHECK (action_type IN ('reserve', 'call')),
  ref_source   VARCHAR(30) DEFAULT 'direct',    -- 'reminder' | 'qr' | 'direct'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_travel_clicks_star_id    ON travel_clicks (star_id);
CREATE INDEX IF NOT EXISTS idx_travel_clicks_created_at ON travel_clicks (created_at);
CREATE INDEX IF NOT EXISTS idx_travel_clicks_theme      ON travel_clicks (theme);
