-- Migration: 025_wish_challenges.sql
-- Purpose: 소원그림 7일 챌린지 테이블 생성 (AIL-105-P0)

-- wish_challenges: 챌린지 마스터 (소원 1개당 1개)
CREATE TABLE IF NOT EXISTS wish_challenges (
    id              SERIAL PRIMARY KEY,
    wish_id         INTEGER NOT NULL REFERENCES wish_entries(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'ONGOING',
    CONSTRAINT valid_challenge_status CHECK (status IN ('ONGOING', 'PAUSED', 'COMPLETED')),
    base_image_url  TEXT NOT NULL,
    checkin_count   INTEGER NOT NULL DEFAULT 0,
    action_points   INTEGER NOT NULL DEFAULT 0,
    cheer_count     INTEGER NOT NULL DEFAULT 0,
    cheer_points    INTEGER NOT NULL DEFAULT 0,
    total_points    INTEGER NOT NULL DEFAULT 0,
    overlay_pack_id VARCHAR(50) NOT NULL DEFAULT 'hope_v1',
    completed_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_wish_challenge UNIQUE (wish_id)
);

-- wish_challenge_days: 일별 체크인 기록
CREATE TABLE IF NOT EXISTS wish_challenge_days (
    id              SERIAL PRIMARY KEY,
    challenge_id    INTEGER NOT NULL REFERENCES wish_challenges(id) ON DELETE CASCADE,
    day_number      INTEGER NOT NULL,
    CONSTRAINT valid_day_number CHECK (day_number BETWEEN 1 AND 7),
    action_line     TEXT,
    checked_in_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    points_earned   INTEGER NOT NULL DEFAULT 10,
    CONSTRAINT unique_challenge_day UNIQUE (challenge_id, day_number)
);

-- wish_challenge_cheers: 응원 기록 (중복 방지)
CREATE TABLE IF NOT EXISTS wish_challenge_cheers (
    id              SERIAL PRIMARY KEY,
    challenge_id    INTEGER NOT NULL REFERENCES wish_challenges(id) ON DELETE CASCADE,
    cheerer_id      TEXT NOT NULL,
    cheered_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_challenge_cheerer UNIQUE (challenge_id, cheerer_id)
);

-- updated_at 자동갱신 트리거
CREATE OR REPLACE FUNCTION update_wish_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wish_challenges_updated_at ON wish_challenges;
CREATE TRIGGER trg_wish_challenges_updated_at
    BEFORE UPDATE ON wish_challenges
    FOR EACH ROW EXECUTE FUNCTION update_wish_challenges_updated_at();

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_wish_challenges_wish_id ON wish_challenges(wish_id);
CREATE INDEX IF NOT EXISTS idx_wish_challenges_status ON wish_challenges(status);
CREATE INDEX IF NOT EXISTS idx_wish_challenge_days_challenge_id ON wish_challenge_days(challenge_id);
CREATE INDEX IF NOT EXISTS idx_wish_challenge_cheers_challenge_id ON wish_challenge_cheers(challenge_id);
