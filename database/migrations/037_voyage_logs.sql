-- Migration 037: DreamTown VoyageLog 테이블 생성
-- 목적: emotion/tag/growth → problem/action/result 구조 저장
-- 설계 원칙: append-only, 하루 기록 복수 허용, star 없이도 저장 가능

CREATE TABLE IF NOT EXISTS dt_voyage_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL,
  star_id    UUID        REFERENCES dt_stars(id) ON DELETE SET NULL,
  emotion    TEXT,               -- 감정 (느낌 선택값, e.g. "용기났어요")
  tag        TEXT,               -- 도움 태그 (e.g. "실행", "위로")
  growth     TEXT,               -- 성장 문장 (e.g. "조금 용감해졌어요")
  problem    TEXT,               -- 자동 추론: 오늘의 상황/문제
  action     TEXT,               -- 자동 추론: 취한 행동
  result     TEXT,               -- 자동 추론: 결과 (= growth 직매핑)
  logged_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voyage_logs_star_id ON dt_voyage_logs(star_id);
CREATE INDEX IF NOT EXISTS idx_voyage_logs_user_id ON dt_voyage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_voyage_logs_logged_at ON dt_voyage_logs(logged_at DESC);
