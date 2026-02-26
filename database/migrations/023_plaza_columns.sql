-- 023_plaza_columns.sql
-- 광장(plaza) 기능 선반영 — wish_entries에 공개/추천/숨김 컬럼 추가
-- 실행: 수동 (Render DB Console 또는 psql)
-- Prisma migrate 실행 금지

ALTER TABLE wish_entries
  ADD COLUMN IF NOT EXISTS is_public   BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_at   TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_wish_public
  ON wish_entries (is_public, hidden_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wish_featured
  ON wish_entries (is_featured, hidden_at, created_at DESC);
