-- 154_galaxies.sql
-- 은하 테이블 + 시드 데이터
-- 방향: challenge=북, growth=동, relationship=서, healing=남

CREATE TABLE IF NOT EXISTS galaxies (
  id          VARCHAR(50)  PRIMARY KEY,
  name        VARCHAR(100),
  description TEXT,
  direction   VARCHAR(10)   -- north | east | west | south
);

INSERT INTO galaxies (id, name, description, direction) VALUES
  ('challenge',    '도전 은하', '시작과 용기의 방향',   'north'),
  ('growth',       '성장 은하', '배움과 확장의 방향',   'east'),
  ('relationship', '관계 은하', '연결과 공감의 방향',   'west'),
  ('healing',      '치유 은하', '쉼과 회복의 방향',     'south')
ON CONFLICT (id) DO NOTHING;
