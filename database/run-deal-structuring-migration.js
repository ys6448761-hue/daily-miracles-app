/**
 * Deal Structuring 마이그레이션 실행 스크립트
 *
 * 실행: node database/run-deal-structuring-migration.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: 'dpg-d3t9gpa4d50c73d2i3gg-a.singapore-postgres.render.com',
    port: 5432,
    database: 'yeosu_miracle_travel',
    user: 'yeosu_user',
    password: 'XEVFpHtXr7CsYZSYYmDhogjbXzo32hCR',
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('🔌 DB 연결 성공');

        const migrationPath = path.join(__dirname, 'migrations', 'add_deal_structuring_fields.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 마이그레이션 파일 로드 완료');
        console.log('⏳ Deal Structuring 마이그레이션 적용 중...\n');

        await client.query(sql);

        console.log('✅ 마이그레이션 적용 완료!\n');

        // 새로 추가된 컬럼 확인
        const columns = await client.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'quotes'
            AND column_name IN (
                'operation_mode', 'settlement_method', 'tax_invoice_issuer',
                'payment_receiver', 'contract_party', 'refund_liability',
                'approval_status', 'requires_approval', 'approval_reasons',
                'approved_by', 'approved_at', 'approval_note',
                'incentive_required', 'incentive_applicant', 'is_mice',
                'required_documents', 'deadline_flags',
                'quote_type', 'confirmed_at', 'confirmed_by',
                'pdf_generated', 'pdf_url', 'pdf_generated_at'
            )
            ORDER BY column_name
        `);

        console.log('📋 추가된 컬럼 목록:');
        columns.rows.forEach(row => {
            const defaultVal = row.column_default ? ` (기본값: ${row.column_default})` : '';
            console.log(`   ✓ ${row.column_name}: ${row.data_type}${defaultVal}`);
        });

        // 뷰 확인
        const views = await client.query(`
            SELECT table_name
            FROM information_schema.views
            WHERE table_schema = 'public'
            AND table_name IN ('v_quotes_pending_approval', 'v_quotes_by_operation_mode')
        `);

        console.log('\n📋 생성된 뷰:');
        views.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });

        console.log('\n🎉 Deal Structuring P0 마이그레이션 완료!');

    } catch (err) {
        console.error('❌ 마이그레이션 실패:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
