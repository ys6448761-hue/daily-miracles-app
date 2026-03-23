-- AIL-113: 성장필름 이벤트 로그 테이블
-- 이벤트 종류: growth_film_view, growth_film_generate_my, growth_film_save_click,
--             return_to_plaza_click, growth_film_generate_share, growth_film_share_click,
--             growth_film_share_success, share_landing_visit, share_blocked_409, checkin_from_409_click

CREATE TABLE IF NOT EXISTS growth_film_events (
    id          SERIAL PRIMARY KEY,
    wish_id     INTEGER NOT NULL,
    event_type  VARCHAR(60) NOT NULL,
    variant     VARCHAR(10),       -- 'my' | 'share' | NULL
    session_id  TEXT,              -- 익명 세션 ID (localStorage anon_id)
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gfe_wish_id    ON growth_film_events(wish_id);
CREATE INDEX IF NOT EXISTS idx_gfe_event_type ON growth_film_events(event_type);
CREATE INDEX IF NOT EXISTS idx_gfe_created_at ON growth_film_events(created_at);
