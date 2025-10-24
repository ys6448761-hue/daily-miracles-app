-- ═══════════════════════════════════════════════════════════
-- 여수 기적여행 - Render PostgreSQL Migration
-- ═══════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────────────
-- Table: users (사용자 및 관리자)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ───────────────────────────────────────────────────────────
-- Table: accommodations (숙소)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accommodations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    price_per_night INTEGER NOT NULL,
    max_guests INTEGER DEFAULT 2,
    amenities TEXT[],
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_accommodations_type ON accommodations(type);
CREATE INDEX IF NOT EXISTS idx_accommodations_is_active ON accommodations(is_active);

-- ───────────────────────────────────────────────────────────
-- Table: activities (활동)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    duration_minutes INTEGER,
    max_participants INTEGER,
    location TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_is_active ON activities(is_active);

-- ───────────────────────────────────────────────────────────
-- Table: bookings (예약)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    accommodation_id UUID REFERENCES accommodations(id) ON DELETE SET NULL,

    -- 예약 정보
    guest_name VARCHAR(100) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(20) NOT NULL,
    num_guests INTEGER NOT NULL,

    -- 일정
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,

    -- 가격
    accommodation_price INTEGER NOT NULL,
    activities_price INTEGER DEFAULT 0,
    total_price INTEGER NOT NULL,

    -- 상태
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),

    -- 메모
    special_requests TEXT,
    admin_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in_date ON bookings(check_in_date);

-- ───────────────────────────────────────────────────────────
-- Table: booking_activities (예약별 활동)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    num_participants INTEGER NOT NULL,
    price INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_booking_activities_booking_id ON booking_activities(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_activities_activity_id ON booking_activities(activity_id);

-- ───────────────────────────────────────────────────────────
-- Table: payments (결제)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,

    -- 결제 정보
    amount INTEGER NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

    -- 외부 결제 시스템
    transaction_id VARCHAR(255),
    gateway VARCHAR(50),

    -- 타임스탬프
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ───────────────────────────────────────────────────────────
-- Table: settlements (정산)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 기간
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- 금액
    total_bookings INTEGER DEFAULT 0,
    total_revenue INTEGER DEFAULT 0,
    total_activities_revenue INTEGER DEFAULT 0,

    -- 상태
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'paid')),

    -- 메타
    notes TEXT,
    finalized_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settlements_period ON settlements(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);

-- ───────────────────────────────────────────────────────────
-- Triggers: 자동 업데이트
-- ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accommodations_updated_at
    BEFORE UPDATE ON accommodations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────
-- Initial Data: 관리자, 숙소, 활동
-- ───────────────────────────────────────────────────────────

-- 관리자 1명
INSERT INTO users (name, email, phone, role) VALUES
('어수여행센터', 'admin@eosoo.com', '1899-6117', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 숙소 4개
INSERT INTO accommodations (name, type, description, price_per_night, max_guests, amenities, image_url) VALUES
('오션뷰 디럭스룸', '호텔', '여수 앞바다가 한눈에 보이는 프리미엄 객실입니다. 킹사이즈 침대와 발코니를 갖추고 있습니다.', 150000, 2, ARRAY['오션뷰', '발코니', '킹베드', 'WiFi', '조식포함'], 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'),
('패밀리 스위트', '호텔', '가족 단위 투숙객을 위한 넓은 객실. 침실 2개와 거실을 갖추고 있습니다.', 250000, 4, ARRAY['침실2개', '거실', '주방', 'WiFi', '조식포함', '주차'], 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'),
('한옥 스테이', '한옥', '전통 한옥에서 즐기는 특별한 하룻밤. 여수 바다가 보이는 한옥 게스트하우스입니다.', 180000, 3, ARRAY['전통한옥', '마당', '한옥체험', 'WiFi', '주차'], 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800'),
('게스트하우스 도미토리', '게스트하우스', '배낭여행객과 1인 여행자를 위한 경제적인 숙소. 공용 공간이 잘 갖춰져 있습니다.', 35000, 1, ARRAY['공용주방', '공용라운지', 'WiFi', '세탁기'], 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800')
ON CONFLICT DO NOTHING;

-- 활동 9개
INSERT INTO activities (name, category, description, price, duration_minutes, max_participants, location, image_url) VALUES
('케이블카 탑승', '관광', '여수 해상케이블카를 타고 돌산도와 자산공원을 잇는 공중 여행을 즐겨보세요.', 15000, 30, 50, '여수 해상케이블카', 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=800'),
('아쿠아플라넷 입장', '체험', '국내 최대 규모의 아쿠아리움. 벨루가, 바이칼물범 등 해양생물 33000여 마리를 만날 수 있습니다.', 30000, 120, 100, '아쿠아플라넷 여수', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'),
('갯벌 체험', '자연', '순천만 갯벌에서 조개와 게를 잡으며 자연을 체험하는 프로그램입니다.', 25000, 90, 20, '순천만습지', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'),
('섬 호핑 투어', '투어', '거문도, 백도 등 여수의 아름다운 섬들을 유람선으로 여행합니다.', 80000, 360, 30, '여수 연안부두', 'https://images.unsplash.com/photo-1569093780121-f0b2e7a0c39b?w=800'),
('짚라인 체험', '액티비티', '바다 위를 가로지르는 짜릿한 짚라인 체험. 여수 앞바다의 절경을 감상하세요.', 35000, 30, 15, '돌산공원', 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=800'),
('야간 경관 투어', '투어', '화려한 조명으로 물든 여수 밤바다를 유람선으로 감상하는 로맨틱 투어입니다.', 45000, 90, 50, '여수 엑스포 해양공원', 'https://images.unsplash.com/photo-1514985883095-b4b1d1b5b3e6?w=800'),
('서핑 체험', '수상스포츠', '전문 강사와 함께하는 초보자 서핑 체험. 장비 대여 포함입니다.', 60000, 120, 10, '만성리 해수욕장', 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800'),
('요트 투어', '수상스포츠', '프라이빗 요트를 타고 여수 앞바다를 항해하는 럭셔리 체험입니다.', 150000, 180, 8, '여수 마리나', 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800'),
('전통시장 투어', '문화', '여수 중앙시장과 수산시장을 둘러보며 지역 먹거리와 문화를 체험합니다.', 20000, 120, 15, '여수 중앙시장', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- Migration Complete
-- ═══════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '✅ 여수 기적여행 마이그레이션 완료!';
    RAISE NOTICE '   - 테이블 생성: users, accommodations, activities, bookings, booking_activities, payments, settlements';
    RAISE NOTICE '   - 초기 데이터: 관리자 1명, 숙소 4개, 활동 9개';
END $$;
