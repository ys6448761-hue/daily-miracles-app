// 사용자 테이블 마이그레이션 실행 스크립트
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const client = new Client({
        host: process.env.DB_HOST || 'dpg-d3t9gpa4d50c73d2i3gg-a.singapore-postgres.render.com',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'yeosu_miracle_travel',
        user: process.env.DB_USER || 'yeosu_user',
        password: process.env.DB_PASSWORD || 'XEVFpHtXr7CsYZSYYmDhogjbXzo32hCR',
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔌 PostgreSQL 연결 중...');
        await client.connect();
        console.log('✅ 연결 성공!');

        // 마이그레이션 SQL 읽기
        const migrationPath = path.join(__dirname, 'users_migration.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        console.log('📋 마이그레이션 실행 중...');
        await client.query(sql);

        console.log('✅ 마이그레이션 완료!');

        // 테이블 확인
        const result = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'users'
        `);

        if (result.rows.length > 0) {
            console.log('✅ users 테이블 생성 확인됨');
        } else {
            console.log('⚠️ users 테이블이 생성되지 않았습니다');
        }

    } catch (error) {
        console.error('❌ 마이그레이션 실패:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 연결 종료');
    }
}

runMigration();
