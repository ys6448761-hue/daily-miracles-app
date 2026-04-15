-- Migration 119: 여수 미션 질문/답변 + 전체완료 보너스 테이블
-- Created: 2026-04-15

-- 미션별 고유 질문 + 선택형 답변
ALTER TABLE dt_yeosu_missions ADD COLUMN IF NOT EXISTS question VARCHAR(100);
ALTER TABLE dt_yeosu_missions ADD COLUMN IF NOT EXISTS answers  JSONB DEFAULT '[]';

-- 전체 완료 보너스 추적
CREATE TABLE IF NOT EXISTS dt_star_bonuses (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  star_id        UUID        NOT NULL,
  bonus_type     VARCHAR(50) NOT NULL,
  points_awarded INT         NOT NULL DEFAULT 0,
  awarded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(star_id, bonus_type)
);

-- 미션 데이터 업데이트 (스펙 확정 장소)
UPDATE dt_yeosu_missions SET
  title='케이블카', description='탄생의 장소에서', icon='🚡',
  question='지금 어떤 마음이에요?',
  answers='["설레임","평온","기대","벅차오름","기쁨"]'
WHERE id='yeosu_cablecar';

UPDATE dt_yeosu_missions SET
  title='돌산대교', description='연결의 장소에서', icon='🌉',
  question='누가 떠올랐나요?',
  answers='["가족","연인","친구","나 자신","아무도"]'
WHERE id='yeosu_dolsan';

UPDATE dt_yeosu_missions SET
  title='진남관', description='내면의 장소에서', icon='🏯',
  question='어떤 감정이 드나요?',
  answers='["감동","경이","차분함","그리움","호기심"]'
WHERE id='yeosu_odoong';

UPDATE dt_yeosu_missions SET
  title='해양공원', description='여운의 장소에서', icon='🌊',
  question='지금 남기고 싶은 건?',
  answers='["이 순간","이 기분","이 장소","이 사람","이 생각"]'
WHERE id='yeosu_seafood';

UPDATE dt_yeosu_missions SET
  title='카페', description='기억의 장소에서', icon='☕',
  question='오늘의 순간은?',
  answers='["특별해","평범하지만 좋아","이미 그리워","기억하고 싶어","새로워"]'
WHERE id='yeosu_sunrise';
