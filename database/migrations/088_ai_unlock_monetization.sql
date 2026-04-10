-- 088_ai_unlock_monetization.sql
-- AI Unlock 모델: 무료(5회) → 유료(Boost/Deep/Premium)

-- ── dt_users: AI 한도 필드 추가 ──────────────────────────────────────
ALTER TABLE dt_users
  ADD COLUMN IF NOT EXISTS ai_calls_used      INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_calls_limit     INTEGER     NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS is_premium         BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_boost_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_tier            VARCHAR(20) NOT NULL DEFAULT 'free'
    CHECK (ai_tier IN ('free','boost','deep','premium'));

CREATE INDEX IF NOT EXISTS idx_users_premium ON dt_users(is_premium);
CREATE INDEX IF NOT EXISTS idx_users_tier    ON dt_users(ai_tier);

-- ── AI 구매 이벤트 ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_ai_purchases (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES dt_users(id),
  product_type    VARCHAR(20) NOT NULL
                  CHECK (product_type IN ('boost','deep','premium')),
  price_krw       INTEGER     NOT NULL,
  calls_granted   INTEGER     NOT NULL DEFAULT 0,   -- boost: +10, deep: +1, premium: 9999
  pg_order_id     VARCHAR(100),                     -- 나이스페이 주문번호
  pg_tid          VARCHAR(100),                     -- 나이스페이 TID
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','completed','cancelled','refunded')),
  applied_at      TIMESTAMPTZ,                      -- 실제 한도 반영 시각
  expires_at      TIMESTAMPTZ,                      -- boost: 30일 만료
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_purchases_user   ON dt_ai_purchases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_purchases_order  ON dt_ai_purchases(pg_order_id);

-- ── AI 관련 UX 이벤트 ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_ai_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES dt_users(id),
  star_id     UUID,
  event_name  VARCHAR(50) NOT NULL
              CHECK (event_name IN (
                'ai_limit_reached',
                'upgrade_prompt_shown',
                'upgrade_clicked',
                'purchase_completed',
                'ai_boost_applied',
                'premium_activated'
              )),
  product_type VARCHAR(20),
  context     JSONB,                                -- { step, service, day, current_usage }
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_events_user  ON dt_ai_events(user_id, event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_event ON dt_ai_events(event_name, created_at DESC);

-- ── 상품 정의 (참조 테이블) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_ai_products (
  product_type  VARCHAR(20) PRIMARY KEY,
  name          VARCHAR(60) NOT NULL,
  price_krw     INTEGER     NOT NULL,
  calls_granted INTEGER     NOT NULL,               -- 9999 = 무제한
  description   TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT true
);

INSERT INTO dt_ai_products (product_type, name, price_krw, calls_granted, description) VALUES
  ('boost',   'AI Boost Pack',     3900,  10,   '추가 AI 분석 +10회, 즉시 적용, 30일 유효'),
  ('deep',    'Deep Insight Pack', 5900,   1,   '고품질 AI 분석 1회 + 7일 개인화 메시지'),
  ('premium', 'Premium Journey',   9900, 9999,  'AI 호출 제한 해제 + 전체 메시지 AI 개인화')
ON CONFLICT (product_type) DO NOTHING;
