-- Migration 040: dt_stars에 parent_star_id 컬럼 추가
-- 용도: 소원 선물 수신자가 "이 별 이어가기" 클릭 시 원본 별 ID 연결 (gift chain)
-- 연결만 기록, 내용은 완전 독립 (복제 아님)
-- dt_stars.id는 UUID 타입이므로 참조 컬럼도 UUID

ALTER TABLE dt_stars
ADD COLUMN IF NOT EXISTS parent_star_id UUID REFERENCES dt_stars(id) ON DELETE SET NULL;

COMMENT ON COLUMN dt_stars.parent_star_id IS
'선물 받은 별에서 이어가기로 생성된 경우, 원본 별 ID 연결 (gift chain)';
