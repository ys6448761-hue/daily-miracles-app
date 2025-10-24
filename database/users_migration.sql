-- ═══════════════════════════════════════════════════════════
-- Daily Miracles MVP - Users Table Migration
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- Table: users (사용자 인증 정보)
-- ───────────────────────────────────────────────────────────
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 기본 정보
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,

    -- 계정 상태
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,

    -- 소셜 로그인 (향후 확장용)
    kakao_id VARCHAR(255),
    google_id VARCHAR(255),

    -- 비밀번호 재설정
    reset_token VARCHAR(255),
    reset_token_expires_at TIMESTAMP WITH TIME ZONE,

    -- 추가 정보
    phone VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(10),

    -- 메타 정보
    user_agent TEXT,
    last_ip_address INET,

    -- Constraints
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_kakao_id_unique UNIQUE (kakao_id),
    CONSTRAINT users_google_id_unique UNIQUE (google_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_kakao_id ON users(kakao_id);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- users updated_at 트리거
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════
-- Migration Complete
-- ═══════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '✅ Users table migration completed!';
    RAISE NOTICE '   - Table created: users';
    RAISE NOTICE '   - Indexes created for email, social IDs, reset token';
    RAISE NOTICE '   - Auto-update trigger added';
END $$;
