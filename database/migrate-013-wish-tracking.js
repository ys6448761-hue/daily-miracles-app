#!/usr/bin/env node
/**
 * Migration 013: 소원 추적 시스템
 *
 * 실행: node database/migrate-013-wish-tracking.js
 *
 * 생성되는 테이블:
 * - wish_entries: 소원 등록
 * - wish_tracking_requests: 추적 질문 발송
 * - wish_tracking_responses: 응답 기록
 * - wish_success_patterns: 성공 패턴 집계
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 환경변수 로드
require('dotenv').config();

async function migrate() {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        console.error('❌ DATABASE_URL 환경변수가 설정되지 않았습니다.');
        console.log('   .env 파일에 DATABASE_URL을 추가하세요.');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    try {
        console.log('🔄 Migration 013: 소원 추적 시스템 시작...\n');

        // SQL 파일 읽기
        const sqlPath = path.join(__dirname, 'migrations', '013_wish_tracking.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // 마이그레이션 실행
        await pool.query(sql);

        console.log('✅ Migration 013 완료!\n');

        // 테이블 확인
        const tables = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name LIKE 'wish_%'
            ORDER BY table_name
        `);

        console.log('📋 생성된 테이블:');
        tables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // 뷰 확인
        const views = await pool.query(`
            SELECT table_name
            FROM information_schema.views
            WHERE table_schema = 'public'
              AND table_name LIKE 'v_wish_%' OR table_name LIKE 'v_miracle_%'
        `);

        if (views.rows.length > 0) {
            console.log('\n📊 생성된 뷰:');
            views.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
        }

        console.log('\n🎉 소원 추적 시스템 준비 완료!');

    } catch (error) {
        console.error('❌ 마이그레이션 실패:', error.message);
        console.error(error);
        process.exit(1);

    } finally {
        await pool.end();
    }
}

migrate();
