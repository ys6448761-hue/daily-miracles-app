-- 075_connection_events.sql
-- Connection(연결) 이벤트 — signal 기반 매칭 결과 저장
-- connection_exposures(기존)와 함께 사용: 1회 보장 + 매칭 데이터 보존

CREATE TABLE IF NOT EXISTS connection_events (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id           UUID        NOT NULL,
  connected_journey_id UUID,                   -- 매칭된 상대 journey_id (익명)
  source_text_id       UUID,                   -- 매칭된 문장 id
  similarity_score     FLOAT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- journey_id당 1회만 — 생애 1회 보장
CREATE UNIQUE INDEX IF NOT EXISTS idx_connection_events_unique
  ON connection_events(journey_id);
