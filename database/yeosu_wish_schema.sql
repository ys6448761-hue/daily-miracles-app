-- ═══════════════════════════════════════════════════════════
-- 여수 소원빌기 체험 MVP - Schema
-- Created: 2026-01-13
-- ═══════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────────────
-- Table: yeosu_wishes (소원빌기 체험 접수)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yeosu_wishes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wish_id VARCHAR(20) NOT NULL UNIQUE,  -- YW-YYYYMMDD-XXXX

    -- 고객 정보
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),

    -- 소원 정보
    wish_text VARCHAR(100) NOT NULL,      -- 소원 텍스트 (50자 권장, 100자 제한)
    photo_url TEXT,                       -- 업로드된 사진 URL (S3/Cloudinary)

    -- 상품 정보
    sku VARCHAR(30) NOT NULL,             -- FREE / YW_BASIC_7 / YW_PREMIUM_30
    amount INTEGER NOT NULL DEFAULT 0,    -- 결제 금액

    -- 단체 정보
    is_group BOOLEAN DEFAULT FALSE,
    group_size INTEGER DEFAULT 1,
    group_name VARCHAR(200),              -- 단체명 (선택)

    -- 상태
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- PENDING: 접수 완료 (무료 또는 결제 대기)
    -- PAID: 결제 완료
    -- GENERATING: 이미지 생성 중
    -- COMPLETED: 완료 (결과물 전달됨)
    -- FAILED: 생성 실패
    -- CANCELED: 취소됨

    -- 결제 정보 (유료 상품인 경우)
    pg_provider VARCHAR(20),
    pg_payment_key VARCHAR(255),
    pg_transaction_id VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,

    -- 결과물
    result_image_url TEXT,                -- DALL-E 생성 이미지 URL
    result_message TEXT,                  -- 소원 메시지 (응원 문구)

    -- 다운로드 토큰 (30일 유효)
    download_token VARCHAR(64) NOT NULL,
    download_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    download_count INTEGER DEFAULT 0,

    -- 메타데이터
    source VARCHAR(30) DEFAULT 'WEB',     -- WEB / KIOSK / ADMIN
    admin_notes TEXT,

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_yeosu_wishes_wish_id ON yeosu_wishes(wish_id);
CREATE INDEX IF NOT EXISTS idx_yeosu_wishes_phone ON yeosu_wishes(customer_phone);
CREATE INDEX IF NOT EXISTS idx_yeosu_wishes_status ON yeosu_wishes(status);
CREATE INDEX IF NOT EXISTS idx_yeosu_wishes_sku ON yeosu_wishes(sku);
CREATE INDEX IF NOT EXISTS idx_yeosu_wishes_download_token ON yeosu_wishes(download_token);
CREATE INDEX IF NOT EXISTS idx_yeosu_wishes_created_at ON yeosu_wishes(created_at DESC);

-- ───────────────────────────────────────────────────────────
-- Table: yeosu_wish_messages (7일/30일 응원 메시지)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yeosu_wish_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wish_id VARCHAR(20) REFERENCES yeosu_wishes(wish_id) ON DELETE CASCADE,

    -- 메시지 정보
    day_number INTEGER NOT NULL,          -- 1~7 또는 1~30
    message_type VARCHAR(20) NOT NULL,    -- MORNING / EVENING
    message_content TEXT NOT NULL,

    -- 발송 상태
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING / SENT / FAILED

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_yeosu_wish_messages_wish_id ON yeosu_wish_messages(wish_id);
CREATE INDEX IF NOT EXISTS idx_yeosu_wish_messages_scheduled ON yeosu_wish_messages(scheduled_at) WHERE status = 'PENDING';

-- ───────────────────────────────────────────────────────────
-- Trigger: updated_at 자동 업데이트
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_yeosu_wishes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_yeosu_wishes_updated_at ON yeosu_wishes;
CREATE TRIGGER trigger_yeosu_wishes_updated_at
    BEFORE UPDATE ON yeosu_wishes
    FOR EACH ROW
    EXECUTE FUNCTION update_yeosu_wishes_updated_at();

-- ═══════════════════════════════════════════════════════════
-- Migration Complete
-- ═══════════════════════════════════════════════════════════
DO $$
BEGIN
    RAISE NOTICE '✅ 여수 소원빌기 체험 MVP Schema Migration Completed!';
    RAISE NOTICE '   - Table: yeosu_wishes (소원빌기 접수)';
    RAISE NOTICE '   - Table: yeosu_wish_messages (7일/30일 응원 메시지)';
    RAISE NOTICE '   - Indexes and triggers created';
END $$;
