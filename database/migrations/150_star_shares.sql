-- 150_star_shares.sql
-- 공개용 데이터 — 여기만 외부 노출. 소원 원문 없음.

CREATE TABLE IF NOT EXISTS star_shares (
  id             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id        UUID      REFERENCES stars(id),
  public_message TEXT,      -- 공유용 한 줄 (소원 원문 아님)
  shared_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_star_shares_star_id ON star_shares (star_id);
