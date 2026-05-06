-- 155_galaxy_constellations.sql
-- 은하 ↔ 별자리 연결 테이블

CREATE TABLE IF NOT EXISTS galaxy_constellations (
  galaxy_id        VARCHAR(50)  REFERENCES galaxies(id),
  constellation_id VARCHAR(100) REFERENCES constellations(id),
  PRIMARY KEY (galaxy_id, constellation_id)
);
