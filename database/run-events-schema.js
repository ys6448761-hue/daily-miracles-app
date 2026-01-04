#!/usr/bin/env node
/**
 * 마케팅 이벤트 테이블 스키마 생성
 *
 * Usage:
 *   node database/run-events-schema.js
 */

const { pool } = require('./db');

const schema = `
-- 마케팅 이벤트 테이블
CREATE TABLE IF NOT EXISTS marketing_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 공통 필드
    user_id VARCHAR(100),
    wish_id VARCHAR(100),
    phone VARCHAR(20),

    -- 이벤트별 페이로드 (JSON)
    payload JSONB DEFAULT '{}',

    -- 메타데이터
    source VARCHAR(50) DEFAULT 'system',

    -- 인덱스용
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_marketing_events_type ON marketing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_marketing_events_date ON marketing_events(event_date);
CREATE INDEX IF NOT EXISTS idx_marketing_events_user ON marketing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_events_wish ON marketing_events(wish_id);
CREATE INDEX IF NOT EXISTS idx_marketing_events_created ON marketing_events(created_at);

-- 일별 집계 뷰
CREATE OR REPLACE VIEW marketing_events_daily AS
SELECT
    event_date,
    event_type,
    COUNT(*) as count
FROM marketing_events
GROUP BY event_date, event_type
ORDER BY event_date DESC, event_type;

-- 주간 집계 뷰
CREATE OR REPLACE VIEW marketing_events_weekly AS
SELECT
    DATE_TRUNC('week', event_date)::DATE as week_start,
    event_type,
    COUNT(*) as count
FROM marketing_events
GROUP BY DATE_TRUNC('week', event_date), event_type
ORDER BY week_start DESC, event_type;
`;

async function runMigration() {
    console.log('═'.repeat(60));
    console.log('📊 마케팅 이벤트 스키마 생성');
    console.log('═'.repeat(60));

    try {
        await pool.query(schema);
        console.log('✅ marketing_events 테이블 생성 완료');
        console.log('✅ 인덱스 생성 완료');
        console.log('✅ 집계 뷰 생성 완료');

        // 테이블 확인
        const result = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'marketing_events'
            ORDER BY ordinal_position
        `);

        console.log('\n📋 테이블 구조:');
        result.rows.forEach(row => {
            console.log(`   - ${row.column_name}: ${row.data_type}`);
        });

    } catch (error) {
        console.error('❌ 스키마 생성 실패:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

runMigration()
    .then(() => {
        console.log('\n✅ 마이그레이션 완료');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ 마이그레이션 실패:', err);
        process.exit(1);
    });
