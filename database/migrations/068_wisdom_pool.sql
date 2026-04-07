-- 068_wisdom_pool.sql
-- K-지혜 풀 (growth_logs 클러스터링 → 검수 → 저장)

CREATE TABLE IF NOT EXISTS wisdom_pool (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wisdom_code  VARCHAR(20) UNIQUE NOT NULL,       -- W001, W002 ...
  theme        VARCHAR(20) NOT NULL               -- challenge | growth | relationship | healing
    CHECK (theme IN ('challenge', 'growth', 'relationship', 'healing')),
  message      TEXT        NOT NULL,
  source_count INTEGER     NOT NULL DEFAULT 0,    -- 기여 로그 수
  active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wisdom_pool_theme ON wisdom_pool(theme);

-- seed: 테마별 1건 (여의보주 검수 완료)
INSERT INTO wisdom_pool (wisdom_code, theme, message, source_count) VALUES
  ('W001', 'challenge',    '용기는 준비가 아니라, 시작하면서 생깁니다',           0),
  ('W002', 'growth',       '정리되는 느낌이 올 때, 이미 조금은 달라진 것입니다',  0),
  ('W003', 'relationship', '연결은 거창하지 않아도 됩니다, 함께 있는 것으로 충분합니다', 0),
  ('W004', 'healing',      '버티고 있는 시간도 회복의 일부입니다',               0)
ON CONFLICT (wisdom_code) DO NOTHING;
