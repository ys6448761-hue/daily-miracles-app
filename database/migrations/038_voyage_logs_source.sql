-- Migration 038: dt_voyage_logs source 컬럼 추가
-- source 값: 'voyage' (Day.jsx 항해) | 'resonance' (공명 시 자동 저장)

ALTER TABLE dt_voyage_logs
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'voyage';
