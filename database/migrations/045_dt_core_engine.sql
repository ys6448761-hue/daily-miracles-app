-- ═══════════════════════════════════════════════════════════
-- DEC-2026-0331-001 / 045_dt_core_engine.sql
-- DreamTown Core Engine — 6개 테이블
-- Wish → Star → DreamLog → Wisdom → Choice → Growth → Narrative → Artifact
-- ═══════════════════════════════════════════════════════════

-- ── ENUM 타입 ───────────────────────────────────────────────

-- 이미 존재할 수 있으니 IF NOT EXISTS 패턴 사용
DO $$ BEGIN
  CREATE TYPE dt_log_type AS ENUM (
    'origin',     -- 별 탄생
    'wisdom',     -- 지혜 생성
    'choice',     -- 사용자 선택
    'emotion',    -- 감정 기록
    'voyage',     -- 여정 이벤트
    'resonance',  -- 공명
    'growth',     -- 성장 리포트
    'artifact'    -- 아티팩트 생성 요청
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dt_wisdom_phase AS ENUM ('day', 'week', 'quarter', 'year');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dt_growth_period AS ENUM ('week', 'month', 'quarter', 'year');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dt_artifact_type AS ENUM ('image', 'pdf', 'webtoon', 'video');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dt_artifact_status AS ENUM ('pending', 'processing', 'done', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 1. dt_dream_logs (중앙 이벤트 원장) ────────────────────
-- Rule 2: 모든 이벤트는 여기에도 기록된다
CREATE TABLE IF NOT EXISTS dt_dream_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id     UUID NOT NULL REFERENCES dt_stars(id) ON DELETE CASCADE,
  log_type    dt_log_type NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dt_dream_logs_star_id   ON dt_dream_logs(star_id);
CREATE INDEX IF NOT EXISTS idx_dt_dream_logs_type      ON dt_dream_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_dt_dream_logs_created   ON dt_dream_logs(created_at);

COMMENT ON TABLE dt_dream_logs IS 'DreamTown 중앙 이벤트 원장 — 모든 흐름이 star_id 기준으로 누적됨';

-- ── 2. dt_wisdom_logs (Aurora5 지혜) ────────────────────────
CREATE TABLE IF NOT EXISTS dt_wisdom_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id       UUID NOT NULL REFERENCES dt_stars(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  phase         dt_wisdom_phase NOT NULL DEFAULT 'day',
  aurora5_prompt TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dt_wisdom_logs_star_id ON dt_wisdom_logs(star_id);

COMMENT ON TABLE dt_wisdom_logs IS 'Aurora5가 생성한 지혜 메시지 — phase별 방향 제시';

-- ── 3. dt_choice_logs (사용자 선택 기록) ────────────────────
CREATE TABLE IF NOT EXISTS dt_choice_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id      UUID NOT NULL REFERENCES dt_stars(id) ON DELETE CASCADE,
  wisdom_id    UUID REFERENCES dt_wisdom_logs(id) ON DELETE SET NULL,
  choice_type  TEXT NOT NULL,      -- 예: 'direction', 'reflection', 'action'
  choice_value TEXT NOT NULL,
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dt_choice_logs_star_id   ON dt_choice_logs(star_id);
CREATE INDEX IF NOT EXISTS idx_dt_choice_logs_wisdom_id ON dt_choice_logs(wisdom_id);

COMMENT ON TABLE dt_choice_logs IS '사용자의 선택 이력 — 지혜를 받고 무엇을 선택했는지';

-- ── 4. dt_growth_reports (성장 분석 리포트) ─────────────────
CREATE TABLE IF NOT EXISTS dt_growth_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id      UUID NOT NULL REFERENCES dt_stars(id) ON DELETE CASCADE,
  period       dt_growth_period NOT NULL,
  summary      TEXT NOT NULL,
  pattern      TEXT,
  change_point TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dt_growth_reports_star_id ON dt_growth_reports(star_id);
CREATE INDEX IF NOT EXISTS idx_dt_growth_reports_period  ON dt_growth_reports(period);

COMMENT ON TABLE dt_growth_reports IS '주/월/분기/연간 성장 분석 리포트 — Growth Engine 출력';

-- ── 5. dt_narrative_logs (Aurora5 서사 재구성) ──────────────
CREATE TABLE IF NOT EXISTS dt_narrative_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id    UUID NOT NULL REFERENCES dt_stars(id) ON DELETE CASCADE,
  chapter    INT NOT NULL DEFAULT 1,
  title      TEXT,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dt_narrative_logs_star_id ON dt_narrative_logs(star_id);

COMMENT ON TABLE dt_narrative_logs IS 'Aurora5 서사 재구성 챕터 — 책 생성의 원천 데이터';

-- ── 6. dt_artifact_jobs (비동기 생성 큐) ────────────────────
-- Rule 3: 이미지/PDF/영상은 반드시 여기서 처리
-- Rule 4: 웹 요청에서 무거운 작업 실행 금지
CREATE TABLE IF NOT EXISTS dt_artifact_jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id     UUID NOT NULL REFERENCES dt_stars(id) ON DELETE CASCADE,
  type        dt_artifact_type NOT NULL,
  status      dt_artifact_status NOT NULL DEFAULT 'pending',
  prompt      TEXT,
  result_url  TEXT,
  error_msg   TEXT,
  attempts    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dt_artifact_jobs_star_id ON dt_artifact_jobs(star_id);
CREATE INDEX IF NOT EXISTS idx_dt_artifact_jobs_pending ON dt_artifact_jobs(status, created_at)
  WHERE status = 'pending';

COMMENT ON TABLE dt_artifact_jobs IS 'Artifact 비동기 생성 큐 — image/pdf/webtoon/video. worker가 polling 처리';
