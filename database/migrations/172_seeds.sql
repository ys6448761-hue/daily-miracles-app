-- 172_seeds.sql
-- DreamTown Seed Library — 공유 진입점 SSOT
--
-- Seed = "이 별로부터 시작된 공식 시작점"
--   - 별 commit 시 자동 발행 금지 — "Seed 만들기" 명시 클릭 시에만 INSERT
--   - 비로그인 외부 사용자가 /seed/:id 로 접근 가능
--   - ref_code 8자 nanoid (base36) — 공유 친화 + star_id 직접 노출 방지
--
-- 운영 원칙:
--   - location: canonical 1종만 허용 (cablecar | hamel)
--   - status='active'만 외부 노출
--   - view_count / click_count 는 /seed/:id 진입과 "나도 만들기" 클릭으로만 증가

CREATE TABLE IF NOT EXISTS seeds (
  id              TEXT PRIMARY KEY,                          -- uuid v4
  location        TEXT NOT NULL,                             -- cablecar | hamel
  title           TEXT,                                      -- 공유 카드 상단 한 줄
  image_url       TEXT NOT NULL,                             -- /images/postcards/seed_xxx.png
  share_url       TEXT NOT NULL,                             -- /seed/{id}?ref={ref_code} (절대 URL은 SSR에서 합성)
  ref_code        TEXT NOT NULL UNIQUE,                      -- 8자 nanoid
  parent_star_id  TEXT NULL,                                 -- 어떤 별이 만든 seed인지
  status          TEXT NOT NULL DEFAULT 'active',            -- active | disabled
  view_count      INTEGER NOT NULL DEFAULT 0,
  click_count     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seeds_ref_code  ON seeds(ref_code);
CREATE INDEX IF NOT EXISTS idx_seeds_location  ON seeds(location);
CREATE INDEX IF NOT EXISTS idx_seeds_status    ON seeds(status);
CREATE INDEX IF NOT EXISTS idx_seeds_parent    ON seeds(parent_star_id);

-- 이벤트 로그 — append-only
CREATE TABLE IF NOT EXISTS seed_events (
  id           BIGSERIAL PRIMARY KEY,
  seed_id      TEXT NOT NULL,
  ref_code     TEXT,                                         -- 진입 시점 ref_code (URL 파라미터)
  type         TEXT NOT NULL,                                -- view | click | wish_started
  user_agent   TEXT,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seed_events_seed     ON seed_events(seed_id);
CREATE INDEX IF NOT EXISTS idx_seed_events_ref      ON seed_events(ref_code);
CREATE INDEX IF NOT EXISTS idx_seed_events_type     ON seed_events(type);
CREATE INDEX IF NOT EXISTS idx_seed_events_occurred ON seed_events(occurred_at DESC);
