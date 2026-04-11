-- Migration 111: 글로벌 확장 대비 씨앗 컬럼 6개
-- 프론트 노출 없음. 운영 내부 데이터 전용.
-- 여수 → 순천만 → 전국 → 전 세계 확장 시 코드 수정 제로 목표.

-- ① partner_accounts: 등급 + 지역 + 랜드마크 구분 + 영문명
ALTER TABLE partner_accounts
  ADD COLUMN IF NOT EXISTS partner_tier VARCHAR(20)
    DEFAULT 'branch'
    CHECK (partner_tier IN (
      'micro',       -- 소규모 (게스트하우스·소형카페)
      'branch',      -- 일반 지점 (현재 16개 기본값)
      'flagship',    -- 대형 (호텔200실↑·케이블카급)
      'landmark'     -- 국가급 (순천만·에버랜드·디즈니급)
    )),
  ADD COLUMN IF NOT EXISTS region_code VARCHAR(30)
    DEFAULT 'KR_YEOSU'
    CHECK (region_code IN (
      'KR_YEOSU',     -- 여수 (현재)
      'KR_SUNCHEON',  -- 순천만 국가정원 (준비)
      'KR_JEJU',      -- 제주 (준비)
      'KR_SEOUL',     -- 서울 (준비)
      'KR_OTHER',     -- 국내 기타
      'GLOBAL'        -- 해외 전체
    )),
  ADD COLUMN IF NOT EXISTS partner_name_en VARCHAR(100),
  ADD COLUMN IF NOT EXISTS landmark_capacity_daily INT DEFAULT NULL;
  -- 일 평균 방문객 수 (Flagship·Landmark만 입력)

-- ② dt_stars: 별 희소성 + 유입 출처
ALTER TABLE dt_stars
  ADD COLUMN IF NOT EXISTS star_rarity VARCHAR(20)
    DEFAULT 'standard'
    CHECK (star_rarity IN (
      'standard',   -- 일반 별
      'limited',    -- 한정 별 (섬박람회 등 이벤트)
      'landmark',   -- 랜드마크 별 (순천만·에버랜드급)
      'legendary'   -- 전설 별 (특수 이벤트)
    )),
  ADD COLUMN IF NOT EXISTS source_event VARCHAR(50) DEFAULT 'standard';
  -- 예: 'standard' / 'island_expo_2026' / 'suncheonman' / 'everland'

-- ③ dt_galaxies: 다국어 이름 준비
ALTER TABLE dt_galaxies
  ADD COLUMN IF NOT EXISTS name_en VARCHAR(100),
  ADD COLUMN IF NOT EXISTS name_ja VARCHAR(100),
  ADD COLUMN IF NOT EXISTS name_zh VARCHAR(100);

-- ④ partner_accounts: galaxy_type (파트너 은하 분류)
ALTER TABLE partner_accounts
  ADD COLUMN IF NOT EXISTS galaxy_type VARCHAR(20)
    DEFAULT NULL
    CHECK (galaxy_type IN (
      'healing',       -- 치유 은하 (카페·힐링)
      'relationship',  -- 관계 은하 (맛집·다이닝)
      'challenge',     -- 도전 은하 (체험·액티비티)
      'growth',        -- 성장 은하 (기록·추억)
      'miracle'        -- 기적 은하 (여수 Origin·랜드마크)
    ));

-- ⑤ 기존 파트너 기본값 세팅
UPDATE partner_accounts
  SET partner_tier = 'branch',
      region_code  = 'KR_YEOSU'
  WHERE partner_tier IS NULL
     OR region_code  IS NULL;

-- ⑥ 기존 별 기본값 세팅
UPDATE dt_stars
  SET star_rarity  = 'standard',
      source_event = 'standard'
  WHERE star_rarity IS NULL;

-- ⑦ 은하 영문명 기본값
UPDATE dt_galaxies SET name_en = 'Healing Galaxy'      WHERE code = 'healing';
UPDATE dt_galaxies SET name_en = 'Relationship Galaxy' WHERE code = 'relationship';
UPDATE dt_galaxies SET name_en = 'Challenge Galaxy'    WHERE code = 'challenge';
UPDATE dt_galaxies SET name_en = 'Growth Galaxy'       WHERE code = 'growth';
UPDATE dt_galaxies SET name_en = 'Miracle Galaxy'      WHERE code = 'miracle';
