-- 095_wishes_journey_core.sql
-- Core Journey Flow: wishes + journey_contexts

-- ── wishes ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_text  TEXT        NOT NULL,
  gem_type   VARCHAR(30),              -- emerald, ruby, sapphire, etc.
  user_key   TEXT,                     -- nullable — 비로그인 지원
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wishes_user_key ON wishes(user_key) WHERE user_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wishes_created  ON wishes(created_at DESC);

-- ── journey_contexts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journey_contexts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id     UUID        NOT NULL REFERENCES wishes(id),
  city_code   VARCHAR(30) NOT NULL DEFAULT 'yeosu'
              REFERENCES dt_regions(city_code),
  date_type   VARCHAR(20) NOT NULL
              CHECK (date_type IN ('today','this_week','weekend','custom')),
  people_type VARCHAR(20) NOT NULL
              CHECK (people_type IN ('solo','couple','family','friends','group')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_jctx_wish ON journey_contexts(wish_id);
