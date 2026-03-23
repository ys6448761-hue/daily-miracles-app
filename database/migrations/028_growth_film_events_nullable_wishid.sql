-- Aurora5: growth_film_events.wish_id nullable
-- plaza_view 등 wish_id 없는 일반 이벤트 지원
ALTER TABLE growth_film_events ALTER COLUMN wish_id DROP NOT NULL;
