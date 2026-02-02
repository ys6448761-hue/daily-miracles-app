-- ═══════════════════════════════════════════════════════════
-- 009_harbor_schema.sql
-- 소원항해단 v3.1-MVP 스키마 (FINAL)
-- Created: 2026-02-02
-- ═══════════════════════════════════════════════════════════

-- UUID 생성용
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ═══════════════════════════════════════════════════════════
-- ENUM TYPES (값 고정으로 데이터 안정성 확보)
-- ═══════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE visibility_type AS ENUM ('public', 'route_only', 'private');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE traffic_light_type AS ENUM ('GREEN', 'YELLOW', 'RED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE wish_status_type AS ENUM (
    'NEW', 'ACK', 'APPROVED', 'STARTED', 'HIDDEN'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reaction_type_enum AS ENUM ('FIRE', 'ME_TOO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE wind_type_enum AS ENUM ('AI', 'HUMAN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════
-- 1. 익명 사용자
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users_anon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(100) UNIQUE,
  nickname VARCHAR(20),
  temperature DECIMAL(4,1) DEFAULT 25.0,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users_anon IS '익명 사용자 (소원항해단)';
COMMENT ON COLUMN users_anon.temperature IS '사용자 온도 (하한 20.0, 상한 제한 없음)';

-- ═══════════════════════════════════════════════════════════
-- 2. 소원
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS harbor_wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users_anon(id) ON DELETE CASCADE,
  content VARCHAR(80) NOT NULL,
  route VARCHAR(20) NOT NULL,
  visibility visibility_type DEFAULT 'public',
  traffic_light traffic_light_type DEFAULT 'GREEN',
  status wish_status_type DEFAULT 'NEW',
  temperature DECIMAL(4,1) DEFAULT 25.0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE harbor_wishes IS '소원 (80자 제한)';
COMMENT ON COLUMN harbor_wishes.route IS '항로: love, career, health, money, family, self, other';
COMMENT ON COLUMN harbor_wishes.status IS 'NEW→ACK→APPROVED→STARTED, HIDDEN';

-- ═══════════════════════════════════════════════════════════
-- 3. 반응 (🔥 / 🤝)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS harbor_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID REFERENCES harbor_wishes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users_anon(id) ON DELETE CASCADE,
  reaction_type reaction_type_enum NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (wish_id, user_id, reaction_type)
);

COMMENT ON TABLE harbor_reactions IS '반응 (FIRE=🔥, ME_TOO=🤝)';

-- ═══════════════════════════════════════════════════════════
-- 4. 댓글 (✍️)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS harbor_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID REFERENCES harbor_wishes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users_anon(id) ON DELETE CASCADE,
  content VARCHAR(80) NOT NULL,
  is_preset BOOLEAN DEFAULT false,
  preset_id INTEGER,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  report_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE harbor_comments IS '댓글 (80자 제한, 응원 전용)';

-- ═══════════════════════════════════════════════════════════
-- 5. 알림
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS harbor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users_anon(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  title VARCHAR(100),
  body VARCHAR(200),
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE harbor_notifications IS '인앱 알림';

-- ═══════════════════════════════════════════════════════════
-- 6. 신고
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS harbor_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users_anon(id) ON DELETE SET NULL,
  target_type VARCHAR(20) NOT NULL,
  target_id UUID NOT NULL,
  reason VARCHAR(50),
  status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE harbor_reports IS '신고';

-- ═══════════════════════════════════════════════════════════
-- 7. 온도 로그
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS temperature_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users_anon(id) ON DELETE CASCADE,
  wish_id UUID REFERENCES harbor_wishes(id) ON DELETE SET NULL,
  delta DECIMAL(3,1) NOT NULL,
  reason VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE temperature_logs IS '온도 변화 로그';

-- ═══════════════════════════════════════════════════════════
-- 8. 첫 바람 로그 (idempotent)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS first_wind_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID REFERENCES harbor_wishes(id) ON DELETE CASCADE UNIQUE,
  message VARCHAR(200) NOT NULL,
  wind_type wind_type_enum DEFAULT 'AI',
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE first_wind_logs IS '첫 바람 생성 로그 (SLA p50<30s, p95<60s)';

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_users_anon_device ON users_anon(device_id);
CREATE INDEX IF NOT EXISTS idx_harbor_wishes_user ON harbor_wishes(user_id);
CREATE INDEX IF NOT EXISTS idx_harbor_wishes_route ON harbor_wishes(route);
CREATE INDEX IF NOT EXISTS idx_harbor_wishes_status ON harbor_wishes(status, traffic_light);
CREATE INDEX IF NOT EXISTS idx_harbor_wishes_created ON harbor_wishes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_harbor_reactions_wish ON harbor_reactions(wish_id);
CREATE INDEX IF NOT EXISTS idx_harbor_comments_wish ON harbor_comments(wish_id);
CREATE INDEX IF NOT EXISTS idx_harbor_notifications_user ON harbor_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_temp_logs_user ON temperature_logs(user_id);
