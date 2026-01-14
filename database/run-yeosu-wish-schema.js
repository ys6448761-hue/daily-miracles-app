/**
 * 여수 소원빌기 체험 MVP - 스키마 마이그레이션
 *
 * 실행 방법:
 *   node database/run-yeosu-wish-schema.js
 *
 * 환경변수:
 *   DATABASE_URL - PostgreSQL 연결 문자열
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runSchema() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  여수 소원빌기 체험 MVP - 스키마 마이그레이션');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // 데이터베이스 연결
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ DATABASE_URL 환경변수가 설정되지 않았습니다.');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    try {
        console.log('🔌 DB 연결 성공');

        const schemaPath = path.join(__dirname, 'yeosu_wish_schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('📄 스키마 파일 로드 완료');
        console.log('⏳ 여수 소원빌기 스키마 적용 중...\n');

        await client.query(sql);

        console.log('✅ 여수 소원빌기 스키마 적용 완료!\n');

        // 테이블 확인
        const tables = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('yeosu_wishes', 'yeosu_wish_messages')
            ORDER BY table_name
        `);

        console.log('📋 생성된 테이블:');
        tables.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });

        // 컬럼 확인
        const columns = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'yeosu_wishes'
            ORDER BY ordinal_position
        `);

        console.log('\n📋 yeosu_wishes 테이블 컬럼:');
        columns.rows.forEach(row => {
            console.log(`   - ${row.column_name}: ${row.data_type}`);
        });

        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('  마이그레이션 완료!');
        console.log('═══════════════════════════════════════════════════════════');

    } catch (err) {
        console.error('❌ 스키마 적용 실패:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runSchema();
