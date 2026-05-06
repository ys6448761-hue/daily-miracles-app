-- 152_constellations.sql
-- 별자리 — 감정 흐름의 시작과 끝을 가진 구조

CREATE TABLE IF NOT EXISTS constellations (
  id            VARCHAR(100) PRIMARY KEY,
  start_emotion VARCHAR(50),
  end_emotion   VARCHAR(50),
  summary       TEXT
);
