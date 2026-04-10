-- 087_ai_call_tracking.sql
-- AI 호출 추적 + 응답 캐시
-- aiGateway.js 에서 사용

-- ── AI 호출 로그 ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_ai_calls (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID,                          -- NULL 허용 (비로그인 퍼널)
  star_id       UUID,
  service_name  VARCHAR(60) NOT NULL,          -- 'wisdomGenerator', 'careAgent', ...
  step          VARCHAR(60),                   -- 'day1_origin', 'wisdom_day', ...
  model         VARCHAR(50),                   -- 'gpt-4.1-mini', 'gpt-4o', ...
  prompt_hash   VARCHAR(64),                   -- SHA256(prompt) — 캐시 키 매핑
  tokens_in     INTEGER DEFAULT 0,
  tokens_out    INTEGER DEFAULT 0,
  cost_krw      NUMERIC(10,2) DEFAULT 0,       -- 추정 비용 (원)
  cache_hit     BOOLEAN NOT NULL DEFAULT false,
  fallback_used BOOLEAN NOT NULL DEFAULT false,
  latency_ms    INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_calls_user   ON dt_ai_calls(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_calls_star   ON dt_ai_calls(star_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_calls_date   ON dt_ai_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_calls_cache  ON dt_ai_calls(cache_hit, created_at DESC);

-- ── AI 응답 캐시 ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_ai_cache (
  cache_key   VARCHAR(200) PRIMARY KEY,        -- 'service:userId:step:promptHash'
  response    TEXT         NOT NULL,           -- 생성된 텍스트 응답
  service     VARCHAR(60)  NOT NULL,
  step        VARCHAR(60),
  hit_count   INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ  NOT NULL            -- TTL 기반 만료
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_service ON dt_ai_cache(service, expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expire  ON dt_ai_cache(expires_at);

-- ── 만료 캐시 자동 정리 (VACUUM 보조) ────────────────────────────────
-- 운영 환경에서는 pg_cron 또는 별도 스케줄러로 주기적 실행 권장:
-- DELETE FROM dt_ai_cache WHERE expires_at < NOW();
