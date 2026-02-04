-- ═══════════════════════════════════════════════════════════
-- 010_yeosu_ops_center.sql
-- 여수여행센터 운영 컨트롤타워 OS v0 스키마
-- Created: 2026-02-05
-- 목표: SSOT 기반 운영 관리 시스템 (행사/축제 운영)
-- 비개입 영역: 개인정보(민감정보), 결제/정산
-- ═══════════════════════════════════════════════════════════

-- UUID 생성용
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ═══════════════════════════════════════════════════════════
-- ENUM TYPES
-- ═══════════════════════════════════════════════════════════

-- 행사 상태
DO $$ BEGIN
  CREATE TYPE ops_event_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 멤버 역할
DO $$ BEGIN
  CREATE TYPE ops_member_role AS ENUM ('admin', 'operator', 'approver', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 승인 레벨 (v0: L1만 지원)
DO $$ BEGIN
  CREATE TYPE ops_approval_level AS ENUM ('L1', 'L2', 'L3', 'L4');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- SSOT 항목 상태
DO $$ BEGIN
  CREATE TYPE ops_ssot_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 승인 요청 상태
DO $$ BEGIN
  CREATE TYPE ops_approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 트리거 유형
DO $$ BEGIN
  CREATE TYPE ops_trigger_type AS ENUM (
    'schedule_change',      -- 일정 변경 시
    'operation_update',     -- 운영안 수정 시
    'notice_urgent',        -- 긴급 공지 등록 시
    'approval_request',     -- 승인 요청 생성 시
    'issue_registered'      -- 이슈 발생 등록 시
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 트리거 액션 유형
DO $$ BEGIN
  CREATE TYPE ops_action_type AS ENUM ('slack', 'email', 'sms', 'webhook');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════
-- 1. ops_events (행사/축제)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ops_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  location VARCHAR(300),
  status ops_event_status DEFAULT 'DRAFT',
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ops_events IS '행사/축제 마스터';
COMMENT ON COLUMN ops_events.status IS 'DRAFT=준비중, ACTIVE=진행중, COMPLETED=완료, CANCELLED=취소';

-- ═══════════════════════════════════════════════════════════
-- 2. ops_members (멤버/권한)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ops_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES ops_events(id) ON DELETE CASCADE,
  user_name VARCHAR(100) NOT NULL,
  user_email VARCHAR(200),
  user_phone VARCHAR(20),
  role ops_member_role DEFAULT 'viewer',
  approval_level ops_approval_level,
  slack_user_id VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ops_members IS '행사별 멤버 및 권한';
COMMENT ON COLUMN ops_members.approval_level IS '승인권한 레벨 (v0: L1만 지원)';

-- ═══════════════════════════════════════════════════════════
-- 3. ops_ssot_items (SSOT 항목 - 핵심)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ops_ssot_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES ops_events(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  item_key VARCHAR(100) NOT NULL,
  label VARCHAR(200) NOT NULL,
  value_current TEXT,
  value_type VARCHAR(30) DEFAULT 'text',
  requires_approval BOOLEAN DEFAULT false,
  required_approval_level ops_approval_level DEFAULT 'L1',
  status ops_ssot_status DEFAULT 'DRAFT',
  version INTEGER DEFAULT 1,
  last_approved_value TEXT,
  last_approved_at TIMESTAMPTZ,
  last_approved_by UUID,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(event_id, category, item_key)
);

COMMENT ON TABLE ops_ssot_items IS 'SSOT 항목 (Single Source of Truth)';
COMMENT ON COLUMN ops_ssot_items.category IS '분류: schedule, operation, notice, contact, issue 등';
COMMENT ON COLUMN ops_ssot_items.item_key IS '항목 키 (예: main_schedule, emergency_contact)';
COMMENT ON COLUMN ops_ssot_items.value_type IS 'text, number, date, datetime, json, file_url';
COMMENT ON COLUMN ops_ssot_items.status IS 'DRAFT=작성중, PENDING_APPROVAL=승인대기, APPROVED=승인됨, REJECTED=반려, ARCHIVED=보관';

-- ═══════════════════════════════════════════════════════════
-- 4. ops_ssot_history (SSOT 변경이력)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ops_ssot_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES ops_ssot_items(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  value_before TEXT,
  value_after TEXT,
  change_reason TEXT,
  changed_by UUID,
  changed_by_name VARCHAR(100),
  status_before ops_ssot_status,
  status_after ops_ssot_status,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ops_ssot_history IS 'SSOT 항목 변경 이력 (100% 추적)';

-- ═══════════════════════════════════════════════════════════
-- 5. ops_approvals (승인 요청)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ops_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES ops_events(id) ON DELETE CASCADE,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  requested_level ops_approval_level DEFAULT 'L1',
  status ops_approval_status DEFAULT 'PENDING',
  requested_by UUID,
  requested_by_name VARCHAR(100),
  request_reason TEXT,
  decided_by UUID,
  decided_by_name VARCHAR(100),
  decision_reason TEXT,
  decided_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ops_approvals IS '승인 요청';
COMMENT ON COLUMN ops_approvals.target_type IS 'ssot_item, notice, schedule 등';

-- ═══════════════════════════════════════════════════════════
-- 6. ops_triggers (트리거 설정)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ops_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES ops_events(id) ON DELETE CASCADE,
  trigger_type ops_trigger_type NOT NULL,
  trigger_condition JSONB DEFAULT '{}',
  action_type ops_action_type DEFAULT 'slack',
  action_channel VARCHAR(200),
  action_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ops_triggers IS '트리거 설정 (이벤트 기반 알림)';
COMMENT ON COLUMN ops_triggers.action_channel IS 'Slack webhook URL, 이메일 주소, 전화번호 등';

-- ═══════════════════════════════════════════════════════════
-- 7. ops_trigger_logs (트리거 실행 로그)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ops_trigger_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID REFERENCES ops_triggers(id) ON DELETE SET NULL,
  event_id UUID REFERENCES ops_events(id) ON DELETE CASCADE,
  trigger_type ops_trigger_type,
  payload JSONB DEFAULT '{}',
  result VARCHAR(50),
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ops_trigger_logs IS '트리거 실행 로그';

-- ═══════════════════════════════════════════════════════════
-- 8. ops_audit_log (감사로그 - 핵심)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ops_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES ops_events(id) ON DELETE CASCADE,
  actor_id UUID,
  actor_name VARCHAR(100),
  actor_role ops_member_role,
  action VARCHAR(50) NOT NULL,
  object_type VARCHAR(50) NOT NULL,
  object_id UUID,
  object_label VARCHAR(200),
  before_value JSONB,
  after_value JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ops_audit_log IS '감사 로그 (모든 변경 추적)';
COMMENT ON COLUMN ops_audit_log.action IS 'CREATE, UPDATE, DELETE, APPROVE, REJECT, VIEW 등';

-- ═══════════════════════════════════════════════════════════
-- 9. ops_partners (협력업체)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ops_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES ops_events(id) ON DELETE CASCADE,
  partner_name VARCHAR(200) NOT NULL,
  partner_role VARCHAR(100),
  contact_name VARCHAR(100),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(200),
  sla_terms TEXT,
  contract_start DATE,
  contract_end DATE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ops_partners IS '협력업체';

-- ═══════════════════════════════════════════════════════════
-- 10. ops_kpi_snapshots (KPI 스냅샷)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ops_kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES ops_events(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  kpi_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(event_id, snapshot_date)
);

COMMENT ON TABLE ops_kpi_snapshots IS 'KPI 일일 스냅샷';
COMMENT ON COLUMN ops_kpi_snapshots.kpi_data IS '{ssot_items_count, approved_count, pending_count, avg_approval_leadtime_hours, change_count, ...}';

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════

-- ops_events
CREATE INDEX IF NOT EXISTS idx_ops_events_status ON ops_events(status);
CREATE INDEX IF NOT EXISTS idx_ops_events_period ON ops_events(period_start, period_end);

-- ops_members
CREATE INDEX IF NOT EXISTS idx_ops_members_event ON ops_members(event_id);
CREATE INDEX IF NOT EXISTS idx_ops_members_email ON ops_members(user_email);
CREATE INDEX IF NOT EXISTS idx_ops_members_role ON ops_members(event_id, role);

-- ops_ssot_items
CREATE INDEX IF NOT EXISTS idx_ops_ssot_event ON ops_ssot_items(event_id);
CREATE INDEX IF NOT EXISTS idx_ops_ssot_category ON ops_ssot_items(event_id, category);
CREATE INDEX IF NOT EXISTS idx_ops_ssot_status ON ops_ssot_items(event_id, status);
CREATE INDEX IF NOT EXISTS idx_ops_ssot_approval ON ops_ssot_items(requires_approval, status);

-- ops_ssot_history
CREATE INDEX IF NOT EXISTS idx_ops_history_item ON ops_ssot_history(item_id);
CREATE INDEX IF NOT EXISTS idx_ops_history_created ON ops_ssot_history(created_at DESC);

-- ops_approvals
CREATE INDEX IF NOT EXISTS idx_ops_approvals_event ON ops_approvals(event_id);
CREATE INDEX IF NOT EXISTS idx_ops_approvals_status ON ops_approvals(status);
CREATE INDEX IF NOT EXISTS idx_ops_approvals_pending ON ops_approvals(event_id, status) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_ops_approvals_target ON ops_approvals(target_type, target_id);

-- ops_triggers
CREATE INDEX IF NOT EXISTS idx_ops_triggers_event ON ops_triggers(event_id);
CREATE INDEX IF NOT EXISTS idx_ops_triggers_type ON ops_triggers(event_id, trigger_type);
CREATE INDEX IF NOT EXISTS idx_ops_triggers_active ON ops_triggers(event_id, is_active);

-- ops_trigger_logs
CREATE INDEX IF NOT EXISTS idx_ops_trigger_logs_event ON ops_trigger_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_ops_trigger_logs_trigger ON ops_trigger_logs(trigger_id);
CREATE INDEX IF NOT EXISTS idx_ops_trigger_logs_executed ON ops_trigger_logs(executed_at DESC);

-- ops_audit_log
CREATE INDEX IF NOT EXISTS idx_ops_audit_event ON ops_audit_log(event_id);
CREATE INDEX IF NOT EXISTS idx_ops_audit_actor ON ops_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_ops_audit_object ON ops_audit_log(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_ops_audit_created ON ops_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_audit_action ON ops_audit_log(event_id, action);

-- ops_partners
CREATE INDEX IF NOT EXISTS idx_ops_partners_event ON ops_partners(event_id);
CREATE INDEX IF NOT EXISTS idx_ops_partners_active ON ops_partners(event_id, is_active);

-- ops_kpi_snapshots
CREATE INDEX IF NOT EXISTS idx_ops_kpi_event ON ops_kpi_snapshots(event_id);
CREATE INDEX IF NOT EXISTS idx_ops_kpi_date ON ops_kpi_snapshots(snapshot_date DESC);

-- ═══════════════════════════════════════════════════════════
-- 트리거: updated_at 자동 갱신
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION ops_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ops_events_updated ON ops_events;
CREATE TRIGGER trg_ops_events_updated
  BEFORE UPDATE ON ops_events
  FOR EACH ROW EXECUTE FUNCTION ops_update_timestamp();

DROP TRIGGER IF EXISTS trg_ops_members_updated ON ops_members;
CREATE TRIGGER trg_ops_members_updated
  BEFORE UPDATE ON ops_members
  FOR EACH ROW EXECUTE FUNCTION ops_update_timestamp();

DROP TRIGGER IF EXISTS trg_ops_ssot_updated ON ops_ssot_items;
CREATE TRIGGER trg_ops_ssot_updated
  BEFORE UPDATE ON ops_ssot_items
  FOR EACH ROW EXECUTE FUNCTION ops_update_timestamp();

DROP TRIGGER IF EXISTS trg_ops_triggers_updated ON ops_triggers;
CREATE TRIGGER trg_ops_triggers_updated
  BEFORE UPDATE ON ops_triggers
  FOR EACH ROW EXECUTE FUNCTION ops_update_timestamp();

DROP TRIGGER IF EXISTS trg_ops_partners_updated ON ops_partners;
CREATE TRIGGER trg_ops_partners_updated
  BEFORE UPDATE ON ops_partners
  FOR EACH ROW EXECUTE FUNCTION ops_update_timestamp();
