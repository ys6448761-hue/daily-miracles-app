-- 079_benefit_message_tables.sql
-- DreamTown 모바일 증명 시스템 — 리뎀션 로그 / 메시지 템플릿 / 발송 로그
-- SSOT: docs/ssot/core/DreamTown_Mobile_Credential_SSOT_v1.md

-- ① 리뎀션 상세 로그 (파트너 검증 현장 기록)
CREATE TABLE IF NOT EXISTS benefit_redemptions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID        NOT NULL REFERENCES benefit_credentials(id),
  partner_id    VARCHAR(50) NOT NULL,                 -- partner_code
  verified_at   TIMESTAMPTZ,
  redeemed_at   TIMESTAMPTZ,
  verified_by   VARCHAR(100),
  location      VARCHAR(200),                         -- 현장 위치 (nullable)
  device_info   JSONB,                                -- 검증 디바이스 정보 (nullable)
  status        VARCHAR(20) NOT NULL DEFAULT 'completed'
                CHECK (status IN ('completed', 'failed', 'partial')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_redemptions_credential ON benefit_redemptions(credential_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_partner    ON benefit_redemptions(partner_id);

-- ② 메시지 템플릿 (토스트 + 알림톡, 은하군 기준)
CREATE TABLE IF NOT EXISTS message_templates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key  VARCHAR(100) UNIQUE NOT NULL,
  channel_type  VARCHAR(20) NOT NULL
                CHECK (channel_type IN ('alimtalk', 'sms', 'inapp_toast')),
  galaxy_group  VARCHAR(20) NOT NULL
                CHECK (galaxy_group IN ('challenge', 'growth', 'relation', 'healing', 'miracle', 'default')),
  event_name    VARCHAR(50) NOT NULL DEFAULT 'benefit_redeemed',
  content       TEXT        NOT NULL,
  weight        INTEGER     NOT NULL DEFAULT 1,       -- 같은 은하 내 랜덤 가중치
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_msg_tmpl_galaxy  ON message_templates(galaxy_group, channel_type, event_name);
CREATE INDEX IF NOT EXISTS idx_msg_tmpl_active  ON message_templates(is_active);

-- ③ 메시지 발송 로그
CREATE TABLE IF NOT EXISTS message_dispatch_logs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id        UUID,                             -- 수신자 journey_id (nullable)
  credential_id     UUID        REFERENCES benefit_credentials(id),
  event_name        VARCHAR(50) NOT NULL,
  channel_type      VARCHAR(20) NOT NULL,
  template_key      VARCHAR(100),
  delivery_status   VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (delivery_status IN ('pending', 'sent', 'failed', 'skipped')),
  provider_response JSONB,
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dispatch_credential ON message_dispatch_logs(credential_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_journey    ON message_dispatch_logs(journey_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_status     ON message_dispatch_logs(delivery_status);

-- ──────────────────────────────────────────────────────────────────────
-- 초기 토스트 템플릿 시드 (25개 — 은하별 5종)
-- ──────────────────────────────────────────────────────────────────────

INSERT INTO message_templates (template_key, channel_type, galaxy_group, event_name, content, weight)
VALUES
  -- 북은하 (도전)
  ('toast_challenge_1', 'inapp_toast', 'challenge', 'benefit_redeemed', '한 걸음이 기록됐어요 ✨', 1),
  ('toast_challenge_2', 'inapp_toast', 'challenge', 'benefit_redeemed', '오늘의 도전이 별에 남았어요', 1),
  ('toast_challenge_3', 'inapp_toast', 'challenge', 'benefit_redeemed', '용기 있는 선택이었어요', 1),
  ('toast_challenge_4', 'inapp_toast', 'challenge', 'benefit_redeemed', '멈추지 않은 순간이 빛나요', 1),
  ('toast_challenge_5', 'inapp_toast', 'challenge', 'benefit_redeemed', '작은 전진이 시작이었어요', 1),
  -- 동은하 (성장)
  ('toast_growth_1', 'inapp_toast', 'growth', 'benefit_redeemed', '조금 더 또렷해졌어요 🌱', 1),
  ('toast_growth_2', 'inapp_toast', 'growth', 'benefit_redeemed', '오늘의 성장이 기록되었어요', 1),
  ('toast_growth_3', 'inapp_toast', 'growth', 'benefit_redeemed', '한 겹 깊어졌어요', 1),
  ('toast_growth_4', 'inapp_toast', 'growth', 'benefit_redeemed', '새로운 시선이 열렸어요', 1),
  ('toast_growth_5', 'inapp_toast', 'growth', 'benefit_redeemed', '배움이 별로 남았어요', 1),
  -- 서은하 (관계)
  ('toast_relation_1', 'inapp_toast', 'relation', 'benefit_redeemed', '오늘의 연결이 남았어요 🤝', 1),
  ('toast_relation_2', 'inapp_toast', 'relation', 'benefit_redeemed', '함께한 순간이 기록되었어요', 1),
  ('toast_relation_3', 'inapp_toast', 'relation', 'benefit_redeemed', '마음이 닿았어요', 1),
  ('toast_relation_4', 'inapp_toast', 'relation', 'benefit_redeemed', '관계의 결이 하나 더 쌓였어요', 1),
  ('toast_relation_5', 'inapp_toast', 'relation', 'benefit_redeemed', '연결의 흔적이 남았어요', 1),
  -- 남은하 (치유)
  ('toast_healing_1', 'inapp_toast', 'healing', 'benefit_redeemed', '조용히 잘 지나왔어요 🌙', 1),
  ('toast_healing_2', 'inapp_toast', 'healing', 'benefit_redeemed', '오늘의 회복이 기록되었어요', 1),
  ('toast_healing_3', 'inapp_toast', 'healing', 'benefit_redeemed', '숨이 조금 편해졌어요', 1),
  ('toast_healing_4', 'inapp_toast', 'healing', 'benefit_redeemed', '충분히 잘 해냈어요', 1),
  ('toast_healing_5', 'inapp_toast', 'healing', 'benefit_redeemed', '마음이 조금 가벼워졌어요', 1),
  -- 기적항로 (자유)
  ('toast_miracle_1', 'inapp_toast', 'miracle', 'benefit_redeemed', '방향 없이도 충분히 의미 있었어요 ✨', 1),
  ('toast_miracle_2', 'inapp_toast', 'miracle', 'benefit_redeemed', '선택 자체가 항로였어요', 1),
  ('toast_miracle_3', 'inapp_toast', 'miracle', 'benefit_redeemed', '오늘은 흐름이 길이었어요', 1),
  ('toast_miracle_4', 'inapp_toast', 'miracle', 'benefit_redeemed', '기적은 계획 밖에서 시작됐어요', 1),
  ('toast_miracle_5', 'inapp_toast', 'miracle', 'benefit_redeemed', '그냥 좋았던 순간이 남았어요', 1)
ON CONFLICT (template_key) DO NOTHING;

-- 알림톡 템플릿 시드 (5종 — 은하별 1개, 변수: {benefit_name})
INSERT INTO message_templates (template_key, channel_type, galaxy_group, event_name, content, weight)
VALUES
  ('alimtalk_challenge', 'alimtalk', 'challenge', 'benefit_redeemed',
   '[하루하루의 기적]
오늘의 도전 항로 이용이 확인되었어요.
소원이의 한 걸음이 별의 기록으로 남았어요.

이용: {benefit_name}', 1),

  ('alimtalk_growth', 'alimtalk', 'growth', 'benefit_redeemed',
   '[하루하루의 기적]
오늘의 경험이 성장의 기록으로 남았어요.
조금 더 또렷해진 순간이 쌓이고 있어요.

이용: {benefit_name}', 1),

  ('alimtalk_relation', 'alimtalk', 'relation', 'benefit_redeemed',
   '[하루하루의 기적]
오늘의 연결이 별에 기록되었어요.
함께한 시간이 의미로 남았어요.

이용: {benefit_name}', 1),

  ('alimtalk_healing', 'alimtalk', 'healing', 'benefit_redeemed',
   '[하루하루의 기적]
오늘의 체험이 회복의 기록으로 남았어요.
지금의 속도도 충분히 괜찮아요.

이용: {benefit_name}', 1),

  ('alimtalk_miracle', 'alimtalk', 'miracle', 'benefit_redeemed',
   '[하루하루의 기적]
오늘의 선택이 하나의 항로가 되었어요.
방향 없이 흐른 순간도 충분히 의미 있어요.

이용: {benefit_name}', 1)
ON CONFLICT (template_key) DO NOTHING;
