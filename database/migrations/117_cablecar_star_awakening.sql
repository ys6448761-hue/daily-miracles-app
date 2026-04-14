-- Migration 117: 케이블카 별 각성 시스템 컬럼 추가
-- 별의 상태(created/awakened/growing/unified) + 탄생/각성 지점 추적

ALTER TABLE dt_stars
  ADD COLUMN IF NOT EXISTS status           VARCHAR(20)  DEFAULT 'created',
  ADD COLUMN IF NOT EXISTS origin_type      VARCHAR(30),
  ADD COLUMN IF NOT EXISTS origin_place     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS awakened_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS awakened_place   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS awaken_count     INT          DEFAULT 0,
  ADD COLUMN IF NOT EXISTS story_unified_at TIMESTAMPTZ;

-- 기존 별은 모두 'created' 상태 (DEFAULT 적용)
-- 케이블카에서 새로 생성되는 별만 origin_type = 'cablecar' 기록됨
