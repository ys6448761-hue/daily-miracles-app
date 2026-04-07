-- 063_route_options.sql
-- 항로별 선택 옵션 카탈로그 (관광지 / 레저 / 숙박)

CREATE TABLE IF NOT EXISTS route_options (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  route_code   VARCHAR(80) NOT NULL REFERENCES route_catalog(route_code),
  option_type  VARCHAR(20) NOT NULL CHECK (option_type IN ('tourist_spot', 'leisure', 'stay')),
  option_name  VARCHAR(100) NOT NULL,
  stay_nights  INTEGER,   -- option_type='stay' 일 때만 사용 (1=1박2일, 2=2박3일)
  active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_route_options_route_code   ON route_options(route_code);
CREATE INDEX IF NOT EXISTS idx_route_options_option_type  ON route_options(option_type);

-- seed: north_challenge_core 옵션
INSERT INTO route_options (route_code, option_type, option_name) VALUES
  ('north_challenge_core', 'tourist_spot', '오동도'),
  ('north_challenge_core', 'tourist_spot', '향일암'),
  ('north_challenge_core', 'leisure',      '케이블카'),
  ('north_challenge_core', 'leisure',      '요트')
ON CONFLICT DO NOTHING;

INSERT INTO route_options (route_code, option_type, option_name, stay_nights) VALUES
  ('north_challenge_core', 'stay', '1박2일', 1),
  ('north_challenge_core', 'stay', '2박3일', 2)
ON CONFLICT DO NOTHING;
