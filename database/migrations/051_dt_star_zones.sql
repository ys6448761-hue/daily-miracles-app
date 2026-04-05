-- 051_dt_star_zones.sql
-- DreamTown 별 위치 시스템 — zone 정의 + seed 데이터
-- place_name: 한글 원어 유지 / constellation_name: 영어 전용 (SSOT v1.1)

CREATE TABLE IF NOT EXISTS star_zones (
  zone_code          VARCHAR(10)   PRIMARY KEY,
  galaxy_code        VARCHAR(20)   NOT NULL,          -- 지리 방향 (south/west/north/east)
  place_name         VARCHAR(100)  NOT NULL,           -- 한글 원어 지명 (번역 금지)
  constellation_name VARCHAR(100)  NOT NULL,           -- 영어 감정 레이어 (한글 혼용 금지)
  lat                DECIMAL(10,7) NOT NULL,
  lng                DECIMAL(10,7) NOT NULL,
  created_at         TIMESTAMP     DEFAULT NOW()
);

INSERT INTO star_zones (zone_code, galaxy_code, place_name, constellation_name, lat, lng) VALUES
-- SOUTH
('S-1', 'south', '향일암',       'Dawn Healing',       34.5933, 127.8035),
('S-2', 'south', '돌산대교',     'Restored Bond',      34.7395, 127.7456),
('S-3', 'south', '돌산 야경',    'Quiet Light',        34.7289, 127.7472),
-- WEST
('W-1', 'west',  '이순신광장',   'Open Hearts',        34.7463, 127.7356),
('W-2', 'west',  '낭만포차거리', 'Warm Connection',    34.7421, 127.7398),
('W-3', 'west',  '중앙시장',     'Everyday Ties',      34.7450, 127.7370),
-- NORTH
('N-1', 'north', '여수엑스포장', 'First Leap',         34.7520, 127.7450),
('N-2', 'north', '스카이타워',   'Rising Will',        34.7512, 127.7468),
('N-3', 'north', '해양공원',     'Wide Horizon',       34.7488, 127.7475),
-- EAST
('E-1', 'east',  '오동도',       'Living Bloom',       34.7602, 127.7655),
('E-2', 'east',  '케이블카',     'Expanded Vision',    34.7428, 127.7562),
('E-3', 'east',  '자산공원',     'Clear Insight',      34.7480, 127.7540)
ON CONFLICT (zone_code) DO NOTHING;
