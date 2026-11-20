-- 217_travel_restaurants_menu_json.sql
-- PHX-MUYEOJEONG-FOOD §86 (Founder Q85-2 조건부 승인, 2026-11-20)
--
-- 목적: 뭐 먹지? 식당 메뉴·가격·최소 주문 인원·혼밥·어린이·추가 메뉴·한정 판매·출처/확인일 저장.
-- 원칙:
--   - 기존 레코드는 menu_json = NULL (메뉴 미확인). 기존 컬럼·API 변경 없음.
--   - 미확인 가격은 저장하지 않는다 (값이 없으면 항목 자체를 넣지 않는다).
--   - 메뉴 배열 원소 형식:
--       { name, price, price_basis, min_party, solo, kids, addon, limited, limited_note, note }
--   - 최상위 출처 형식: { "source": "...", "checked_at": "YYYY-MM-DD", "items": [ ... ] }
--
-- 적용 상태: 파일 작성만. 운영 DB 적용 금지 (별도 승인 전). 격리 개발 환경 테스트만 허용.

ALTER TABLE travel_restaurants
  ADD COLUMN IF NOT EXISTS menu_json JSONB NULL;

COMMENT ON COLUMN travel_restaurants.menu_json IS
  '메뉴 운영 데이터 (§86). NULL = 메뉴 미확인. 형식: {source, checked_at, items:[{name, price, price_basis, min_party, solo, kids, addon, limited, limited_note, note}]}';
