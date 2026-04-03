-- ═══════════════════════════════════════════════════════════
-- 047_dt_orchestrator.sql
-- Aurora5 Orchestrator 시스템 — 이벤트 기반 에이전트 자동화
-- DEC-2026-0331-001
-- ═══════════════════════════════════════════════════════════

-- ── 이벤트 타입 ────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE dt_event_type AS ENUM (
    'STAR_CREATED',
    'DAY_PASSED',
    'NO_ACTIVITY',
    'PAYMENT_COMPLETED',
    'REPORT_READY',
    'DAY_6_UPSELL_READY'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dt_event_status AS ENUM ('pending', 'processing', 'done', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dt_agent_status AS ENUM ('pending', 'running', 'done', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 1. dt_orchestrator_events ──────────────────────────────
CREATE TABLE IF NOT EXISTS dt_orchestrator_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id     UUID NOT NULL REFERENCES dt_stars(id) ON DELETE CASCADE,
  event_type  dt_event_type NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  status      dt_event_status NOT NULL DEFAULT 'pending',
  attempts    INT NOT NULL DEFAULT 0,
  error_msg   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  handled_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dt_orch_events_star    ON dt_orchestrator_events(star_id);
CREATE INDEX IF NOT EXISTS idx_dt_orch_events_pending ON dt_orchestrator_events(status, created_at)
  WHERE status = 'pending';

COMMENT ON TABLE dt_orchestrator_events IS 'Aurora5 이벤트 원장 — 모든 이벤트는 여기서 시작된다';

-- ── 2. dt_agent_runs ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_agent_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id         UUID NOT NULL REFERENCES dt_stars(id) ON DELETE CASCADE,
  agent_name      TEXT NOT NULL,
  trigger_event   UUID REFERENCES dt_orchestrator_events(id),
  status          dt_agent_status NOT NULL DEFAULT 'pending',
  input_payload   JSONB NOT NULL DEFAULT '{}',
  output_payload  JSONB NOT NULL DEFAULT '{}',
  error_message   TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dt_agent_runs_star     ON dt_agent_runs(star_id);
CREATE INDEX IF NOT EXISTS idx_dt_agent_runs_event    ON dt_agent_runs(trigger_event);
CREATE INDEX IF NOT EXISTS idx_dt_agent_runs_agent    ON dt_agent_runs(agent_name, status);

COMMENT ON TABLE dt_agent_runs IS 'Aurora5 에이전트 실행 기록 — 운영 가시성 보장';

-- ── 3. dt_orchestrator_decisions ──────────────────────────
CREATE TABLE IF NOT EXISTS dt_orchestrator_decisions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id          UUID NOT NULL REFERENCES dt_stars(id) ON DELETE CASCADE,
  event_id         UUID REFERENCES dt_orchestrator_events(id),
  decision_summary TEXT,
  selected_agents  TEXT[] NOT NULL DEFAULT '{}',
  reason           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dt_orch_decisions_star  ON dt_orchestrator_decisions(star_id);
CREATE INDEX IF NOT EXISTS idx_dt_orch_decisions_event ON dt_orchestrator_decisions(event_id);

COMMENT ON TABLE dt_orchestrator_decisions IS 'Decision Engine 판단 기록 — 왜 어떤 에이전트를 선택했는지';
