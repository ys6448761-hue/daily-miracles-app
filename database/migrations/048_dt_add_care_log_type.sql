-- 048_dt_add_care_log_type.sql
-- dt_log_type ENUM에 'care' 추가
-- Care Agent 전용 dream_log 타입

ALTER TYPE dt_log_type ADD VALUE IF NOT EXISTS 'care';
