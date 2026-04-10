-- 096_wish_journeys_stars.sql
-- Core Journey Flow: wish_journeys + wish_stars
-- wish_journeys: wishes + journey_contexts + product → 여정 인스턴스
-- wish_stars: 여정 시작 CTA 클릭 시 생성 (소원 입력 시 자동 생성 금지)

-- ── wish_journeys ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wish_journeys (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id     UUID        NOT NULL REFERENCES wishes(id),
  context_id  UUID        NOT NULL REFERENCES journey_contexts(id),
  product_id  UUID        NOT NULL REFERENCES dt_products(id),
  status      VARCHAR(20) NOT NULL DEFAULT 'recommended'
              CHECK (status IN ('recommended','started','completed','cancelled')),
  started_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wj_wish    ON wish_journeys(wish_id);
CREATE INDEX IF NOT EXISTS idx_wj_context ON wish_journeys(context_id);
CREATE INDEX IF NOT EXISTS idx_wj_status  ON wish_journeys(status, created_at DESC);
-- 중복 생성 방지: 동일 wish + product 조합의 started 여정은 1개만 허용
CREATE UNIQUE INDEX IF NOT EXISTS uniq_wj_wish_product_started
  ON wish_journeys (wish_id, product_id)
  WHERE status = 'started';

-- ── wish_stars ─────────────────────────────────────────────────────────
-- 별은 journey start CTA 클릭 시에만 생성 (SSOT)
CREATE TABLE IF NOT EXISTS wish_stars (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id      UUID        NOT NULL REFERENCES wishes(id),
  journey_id   UUID        NOT NULL REFERENCES wish_journeys(id),
  galaxy_type  VARCHAR(30),
  growth_stage VARCHAR(20) NOT NULL DEFAULT 'seed',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wstar_wish    ON wish_stars(wish_id);
CREATE INDEX IF NOT EXISTS idx_wstar_journey ON wish_stars(journey_id);
