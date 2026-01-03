-- ═══════════════════════════════════════════════════════════════════════════
-- Storybook E2E Commerce Schema (Phase 1)
-- 권장안: 유실 0 / 중복 0 / 관측 가능
-- ═══════════════════════════════════════════════════════════════════════════
-- 작성일: 2026-01-03
-- 설계: 루미 (Agentic Workflow Architect)
-- 승인: 푸르미르 CEO
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) orders — 주문의 진실 원본 (Source of Truth)
-- ─────────────────────────────────────────────────────────────────────────────
-- 핵심 원칙:
--   - order_id / payment_id 둘 다 유니크 → 웹훅 중복 0
--   - status는 반드시 DONE 또는 FAIL_*로 종결
--   - 24시간 이상 중간 상태 금지

CREATE TABLE IF NOT EXISTS storybook_orders (
  id BIGSERIAL PRIMARY KEY,

  -- 주문 식별자 (둘 다 유니크 = 중복 방지의 핵심)
  order_id VARCHAR(64) NOT NULL,
  payment_id VARCHAR(64) NOT NULL,

  -- 고객 정보
  user_id VARCHAR(64),
  customer_email VARCHAR(128) NOT NULL,
  customer_phone VARCHAR(20),
  wish_id VARCHAR(64),

  -- 상품 정보
  tier VARCHAR(16) NOT NULL CHECK (tier IN ('STARTER', 'PLUS', 'PREMIUM')),
  amount INTEGER NOT NULL,

  -- 상태 머신
  -- CREATED → PAID → QUEUED → GENERATING → GATED → STORING → DELIVERING → DONE
  -- 실패: FAIL_PAYMENT_VERIFY, FAIL_GENERATION, FAIL_GATE, FAIL_STORAGE, FAIL_DELIVERY, FAIL_BUDGET
  status VARCHAR(32) NOT NULL DEFAULT 'CREATED',
  fail_reason VARCHAR(64),
  last_error TEXT,

  -- Ethics Gate 결과
  ethics_score INTEGER,
  gate_result VARCHAR(16), -- PASS | WARN | FAIL

  -- 생성 메타
  workflow_version VARCHAR(20),
  generation_time_sec INTEGER,

  -- 크레딧 (Plus/Premium)
  credits_remaining JSONB DEFAULT '{}',
  -- { "regen_images": 3, "edit_text": 1, "rewrite_doc": 0 }

  -- 타임스탬프
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMP,
  delivered_at TIMESTAMP
);

-- 중복 방지 핵심 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS ux_storybook_orders_order_id
  ON storybook_orders(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_storybook_orders_payment_id
  ON storybook_orders(payment_id);

-- 조회 성능 인덱스
CREATE INDEX IF NOT EXISTS ix_storybook_orders_status
  ON storybook_orders(status);
CREATE INDEX IF NOT EXISTS ix_storybook_orders_user_id
  ON storybook_orders(user_id);
CREATE INDEX IF NOT EXISTS ix_storybook_orders_created_at
  ON storybook_orders(created_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2) jobs — 생성 워크플로우 추적 (큐/재시도)
-- ─────────────────────────────────────────────────────────────────────────────
-- 핵심 원칙:
--   - 결제 트랜잭션과 생성 로직 완전 분리
--   - attempt로 재시도 관리 (최대 2회)

CREATE TABLE IF NOT EXISTS storybook_jobs (
  id BIGSERIAL PRIMARY KEY,

  -- 주문 연결
  order_id VARCHAR(64) NOT NULL,

  -- Job 유형
  job_type VARCHAR(32) NOT NULL,
  -- GENERATE_STARTER, GENERATE_PLUS, GENERATE_PREMIUM
  -- REVISION_IMAGE, REVISION_TEXT, REVISION_DOC

  -- 상태
  status VARCHAR(32) NOT NULL DEFAULT 'QUEUED',
  -- QUEUED → PROCESSING → DONE | FAIL

  -- 재시도 관리
  attempt INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 2,
  last_error TEXT,

  -- 비용 추적
  tokens_used INTEGER DEFAULT 0,
  images_generated INTEGER DEFAULT 0,
  cost_estimate DECIMAL(10,2),

  -- 타임스탬프
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  finished_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_storybook_jobs_order_id
  ON storybook_jobs(order_id);
CREATE INDEX IF NOT EXISTS ix_storybook_jobs_status
  ON storybook_jobs(status);
CREATE INDEX IF NOT EXISTS ix_storybook_jobs_created_at
  ON storybook_jobs(created_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3) assets — 산출물 메타 & 링크
-- ─────────────────────────────────────────────────────────────────────────────
-- 핵심 원칙:
--   - 첨부 금지 / 링크 전달 전제
--   - asset_hash로 중복 생성/전달 방지

CREATE TABLE IF NOT EXISTS storybook_assets (
  id BIGSERIAL PRIMARY KEY,

  -- 주문 연결
  order_id VARCHAR(64) NOT NULL,

  -- 자산 유형
  asset_type VARCHAR(32) NOT NULL,
  -- STORYBOOK_PDF, MOBILE_CARDS, WEBTOON_CUTS, WEBTOON_COMBINED
  -- DECISION_MAP_PDF, DECISION_MAP_JSON, ROADMAP_PDF, ROADMAP_JSON

  -- 파일 정보
  file_url TEXT NOT NULL,
  file_name VARCHAR(256),
  file_size_bytes INTEGER,

  -- 중복 방지 해시
  asset_hash VARCHAR(64) NOT NULL,

  -- 만료 관리
  expires_at TIMESTAMP,

  -- 메타데이터
  metadata JSONB DEFAULT '{}',

  -- 타임스탬프
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 같은 자산 중복 저장 방지
CREATE UNIQUE INDEX IF NOT EXISTS ux_storybook_assets_order_hash
  ON storybook_assets(order_id, asset_hash);

CREATE INDEX IF NOT EXISTS ix_storybook_assets_order_id
  ON storybook_assets(order_id);
CREATE INDEX IF NOT EXISTS ix_storybook_assets_type
  ON storybook_assets(asset_type);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4) deliveries — 전달 로그 (중복 발송 방지의 핵심!)
-- ─────────────────────────────────────────────────────────────────────────────
-- 핵심 원칙:
--   - 이메일/카톡 중복 발송 원천 차단
--   - 실패 시에도 로그는 남음 (관측 가능)

CREATE TABLE IF NOT EXISTS storybook_deliveries (
  id BIGSERIAL PRIMARY KEY,

  -- 주문 연결
  order_id VARCHAR(64) NOT NULL,

  -- 전달 채널
  channel VARCHAR(16) NOT NULL,
  -- EMAIL | KAKAO

  -- 전달 대상 자산
  asset_hash VARCHAR(64) NOT NULL,

  -- 전달 결과
  status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  -- PENDING → SENT → DELIVERED | FAIL

  -- 에러 정보
  error_code VARCHAR(64),
  error_message TEXT,

  -- 추적 정보
  message_id VARCHAR(128), -- 발송 시스템의 메시지 ID
  recipient VARCHAR(128),  -- 이메일 주소 또는 전화번호

  -- 타임스탬프
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP
);

-- 같은 주문/채널/자산은 1번만 발송 (핵심!)
CREATE UNIQUE INDEX IF NOT EXISTS ux_storybook_deliveries_unique
  ON storybook_deliveries(order_id, channel, asset_hash);

CREATE INDEX IF NOT EXISTS ix_storybook_deliveries_order_id
  ON storybook_deliveries(order_id);
CREATE INDEX IF NOT EXISTS ix_storybook_deliveries_status
  ON storybook_deliveries(status);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5) events — 관측/대시보드용 (Phase 2~3 준비)
-- ─────────────────────────────────────────────────────────────────────────────
-- 핵심 원칙:
--   - Phase 2~3 대시보드/KPI에 바로 사용 가능
--   - 지금 만들어두면 이후 작업 속도 ↑

CREATE TABLE IF NOT EXISTS storybook_events (
  id BIGSERIAL PRIMARY KEY,

  -- 연결 정보
  order_id VARCHAR(64),
  job_id BIGINT,

  -- 이벤트 정보
  event_name VARCHAR(64) NOT NULL,
  -- pay_initiated, pay_success, pay_failed
  -- job_queued, job_started, job_done, job_failed
  -- asset_generated_pdf, asset_generated_webtoon, asset_generated_premium
  -- gate_passed, gate_warned, gate_failed
  -- delivery_email_sent, delivery_kakao_sent, delivery_failed
  -- download_clicked, revision_requested, revision_completed

  -- 이벤트 데이터
  payload JSONB DEFAULT '{}',

  -- 타임스탬프
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_storybook_events_name
  ON storybook_events(event_name);
CREATE INDEX IF NOT EXISTS ix_storybook_events_order_id
  ON storybook_events(order_id);
CREATE INDEX IF NOT EXISTS ix_storybook_events_created_at
  ON storybook_events(created_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- 6) revisions — 크레딧 사용 추적 (Phase 2)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS storybook_revisions (
  id BIGSERIAL PRIMARY KEY,

  revision_id VARCHAR(64) NOT NULL,
  order_id VARCHAR(64) NOT NULL,

  -- 수정 대상
  target_doc VARCHAR(32) NOT NULL,
  -- STORYBOOK | WEBTOON | DECISION_MAP | ROADMAP

  -- 수정 유형
  revision_type VARCHAR(32) NOT NULL,
  -- REGEN_IMAGE | EDIT_TEXT | REWRITE_DOC

  -- 요청 내용
  user_request TEXT,

  -- 상태
  status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
  -- QUEUED → PROCESSING → DONE | FAIL

  -- 크레딧 차감
  credits_debited JSONB,

  -- 타임스탬프
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_storybook_revisions_id
  ON storybook_revisions(revision_id);
CREATE INDEX IF NOT EXISTS ix_storybook_revisions_order_id
  ON storybook_revisions(order_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- 운영 규칙 (스키마와 함께 반드시 지킬 것)
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. orders.status는 24시간 이상 중간 상태 금지
-- 2. deliveries 유니크 인덱스 없으면 → 중복 발송 사고 100%
-- 3. 모든 FAIL은 fail_reason에 코드로 남김
-- 4. events 테이블로 모든 주요 이벤트 기록 (관측 가능)
-- ═══════════════════════════════════════════════════════════════════════════

-- 스키마 버전 확인용
COMMENT ON TABLE storybook_orders IS 'Storybook E2E Commerce - Orders (v1.0, 2026-01-03)';
COMMENT ON TABLE storybook_jobs IS 'Storybook E2E Commerce - Jobs (v1.0, 2026-01-03)';
COMMENT ON TABLE storybook_assets IS 'Storybook E2E Commerce - Assets (v1.0, 2026-01-03)';
COMMENT ON TABLE storybook_deliveries IS 'Storybook E2E Commerce - Deliveries (v1.0, 2026-01-03)';
COMMENT ON TABLE storybook_events IS 'Storybook E2E Commerce - Events (v1.0, 2026-01-03)';
COMMENT ON TABLE storybook_revisions IS 'Storybook E2E Commerce - Revisions (v1.0, 2026-01-03)';
