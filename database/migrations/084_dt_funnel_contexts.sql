-- 084_dt_funnel_contexts.sql
-- DreamTown 퍼널 컨텍스트 (날짜/인원 선택)
-- wish → context → recommendation → star 흐름

CREATE TABLE IF NOT EXISTS dt_funnel_contexts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id     UUID,
  date_type   VARCHAR(20) CHECK (date_type IN ('today','this_week','next_week','custom')),
  people_type VARCHAR(20) CHECK (people_type IN ('solo','couple','family','friends')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_funnel_ctx_wish ON dt_funnel_contexts(wish_id);

-- 추천 로그 (A/B 대비)
CREATE TABLE IF NOT EXISTS dt_funnel_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id      UUID,
  context_id   UUID,
  event_name   VARCHAR(30) NOT NULL
               CHECK (event_name IN ('view_recommendation','click_cta','create_star')),
  route_code   VARCHAR(30),
  product_id   VARCHAR(50),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_funnel_ev_wish ON dt_funnel_events(wish_id, event_name);
