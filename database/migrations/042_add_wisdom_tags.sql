-- Migration 042: wisdom_tag 시스템 + voyage_logs 확장 + aurora5_messages
-- dt_voyage_logs: 신규 필드 추가 (테이블은 037에서 생성됨)
-- dt_wishes: wish_category 추가
-- aurora5_messages: 신규 테이블 생성

-- ── 1. dt_voyage_logs 컬럼 추가 ─────────────────────────────────────

ALTER TABLE dt_voyage_logs
  ADD COLUMN IF NOT EXISTS situation_text          TEXT,
  ADD COLUMN IF NOT EXISTS action_text             TEXT,
  ADD COLUMN IF NOT EXISTS result_text             TEXT,
  ADD COLUMN IF NOT EXISTS emotion_before          TEXT,
  ADD COLUMN IF NOT EXISTS emotion_after           TEXT,
  ADD COLUMN IF NOT EXISTS wisdom_tag              TEXT
    CHECK (wisdom_tag IN ('자기다스림','버팀','관계','때','실천','의미','나눔','리더십')),
  ADD COLUMN IF NOT EXISTS action_type             TEXT
    CHECK (action_type IN ('실천','선택','멈춤','연결','깨달음')),
  ADD COLUMN IF NOT EXISTS resonance_source_star_id UUID REFERENCES dt_stars(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at              TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN dt_voyage_logs.situation_text           IS '오늘 상황 (자유 기술)';
COMMENT ON COLUMN dt_voyage_logs.action_text              IS '선택/행동 기술';
COMMENT ON COLUMN dt_voyage_logs.result_text              IS '결과/변화 기술';
COMMENT ON COLUMN dt_voyage_logs.emotion_before           IS '행동 전 감정';
COMMENT ON COLUMN dt_voyage_logs.emotion_after            IS '행동 후 감정';
COMMENT ON COLUMN dt_voyage_logs.wisdom_tag               IS '지혜 태그 (자기다스림/버팀/관계/때/실천/의미/나눔/리더십)';
COMMENT ON COLUMN dt_voyage_logs.action_type              IS '행동 유형 (실천/선택/멈춤/연결/깨달음)';
COMMENT ON COLUMN dt_voyage_logs.resonance_source_star_id IS '공명으로 파생된 경우 원본 별 ID';

-- ── 2. dt_wishes wish_category 추가 ────────────────────────────────

ALTER TABLE dt_wishes
  ADD COLUMN IF NOT EXISTS wish_category TEXT
    CHECK (wish_category IN ('카페','건강','가족','커리어','학업','관계','기타'));

COMMENT ON COLUMN dt_wishes.wish_category IS '소원 카테고리 (카페/건강/가족/커리어/학업/관계/기타)';

-- ── 3. aurora5_messages 테이블 신규 생성 ────────────────────────────

CREATE TABLE IF NOT EXISTS aurora5_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id     UUID        REFERENCES dt_stars(id) ON DELETE CASCADE,
  user_id     UUID,
  message     TEXT        NOT NULL,
  wisdom_tag  TEXT
    CHECK (wisdom_tag IN ('자기다스림','버팀','관계','때','실천','의미','나눔','리더십')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aurora5_messages_star_id ON aurora5_messages(star_id);
CREATE INDEX IF NOT EXISTS idx_aurora5_messages_wisdom_tag ON aurora5_messages(wisdom_tag);

COMMENT ON TABLE  aurora5_messages              IS 'Aurora5 시스템 메시지 (wisdom_tag 분류)';
COMMENT ON COLUMN aurora5_messages.wisdom_tag   IS '지혜 태그 (자기다스림/버팀/관계/때/실천/의미/나눔/리더십)';
