-- 217_travel_restaurants_menu_json_rollback.sql
-- 217 롤백. 메뉴 데이터 컬럼 제거. 적용 전 확인: 운영 DB 에 menu_json 데이터가 있으면 먼저 백업.
ALTER TABLE travel_restaurants
  DROP COLUMN IF EXISTS menu_json;
