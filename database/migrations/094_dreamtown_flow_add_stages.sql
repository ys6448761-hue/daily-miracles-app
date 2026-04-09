-- 094_dreamtown_flow_add_stages.sql
-- dreamtown_flow.stage CHECK 제약 확장
-- 기존: wish/star/growth/resonance/impact/connection
-- 추가: experiment, recommendation

ALTER TABLE dreamtown_flow
  DROP CONSTRAINT IF EXISTS dreamtown_flow_stage_check;

ALTER TABLE dreamtown_flow
  ADD CONSTRAINT dreamtown_flow_stage_check
  CHECK (stage IN (
    'wish', 'star', 'growth', 'resonance',
    'impact', 'connection', 'experiment', 'recommendation'
  ));
