-- Migration 032: star_resonance_summary 테이블
-- 공명 기반 유사 별 추천을 위한 집계 테이블
-- POST /api/resonance 시 upsert로 유지

CREATE TABLE IF NOT EXISTS star_resonance_summary (
  star_id       TEXT    PRIMARY KEY,
  relief_count  INTEGER NOT NULL DEFAULT 0,
  belief_count  INTEGER NOT NULL DEFAULT 0,
  clarity_count INTEGER NOT NULL DEFAULT 0,
  courage_count INTEGER NOT NULL DEFAULT 0,
  total_count   INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
