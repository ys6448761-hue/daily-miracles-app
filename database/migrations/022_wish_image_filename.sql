-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 022: wish_entries에 image_filename 컬럼 추가
-- PR-2C: overlay 이미지 → 카카오 알림톡 발송 연결
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE wish_entries
ADD COLUMN IF NOT EXISTS image_filename VARCHAR(255);

COMMENT ON COLUMN wish_entries.image_filename IS 'DALL-E 생성 이미지 파일명 (예: wish_1766988714918_sapphire.png)';

-- 확인
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 022 완료: wish_entries.image_filename 컬럼 추가';
END $$;
