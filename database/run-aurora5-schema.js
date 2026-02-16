const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const { getConnectionConfig } = require('./dbConfig');
const pool = new Pool(getConnectionConfig());

async function runSchema() {
    const client = await pool.connect();
    try {
        console.log('🔌 DB 연결 성공');

        const schemaPath = path.join(__dirname, 'aurora5_schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('📄 스키마 파일 로드 완료');
        console.log('⏳ 스키마 적용 중...\n');

        await client.query(sql);

        console.log('✅ Aurora5 스키마 적용 완료!\n');

        // 테이블 확인
        const tables = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('mvp_inbox', 'mvp_results', 'trials', 'send_log')
            ORDER BY table_name
        `);

        console.log('📋 생성된 테이블:');
        tables.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });

    } catch (err) {
        console.error('❌ 스키마 적용 실패:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runSchema();
