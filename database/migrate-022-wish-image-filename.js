#!/usr/bin/env node
/**
 * Migration 022: wish_entries.image_filename 컬럼 추가
 *
 * 실행: node database/migrate-022-wish-image-filename.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

async function migrate() {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        console.error('❌ DATABASE_URL 환경변수가 설정되지 않았습니다.');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    try {
        console.log('🔄 Migration 022: wish_entries.image_filename 시작...\n');

        const sqlPath = path.join(__dirname, 'migrations', '022_wish_image_filename.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);

        // 컬럼 확인
        const check = await pool.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'wish_entries'
              AND column_name = 'image_filename'
        `);

        if (check.rows.length > 0) {
            console.log('✅ Migration 022 완료!');
            console.log(`   - wish_entries.image_filename: ${check.rows[0].data_type}(${check.rows[0].character_maximum_length})`);
        } else {
            console.error('❌ 컬럼 추가 실패');
        }

    } catch (err) {
        console.error('❌ Migration 022 실패:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
