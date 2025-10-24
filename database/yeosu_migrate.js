const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const client = new Client({
        host: 'dpg-d3t9gpa4d50c73d2i3gg-a.singapore-postgres.render.com',
        port: 5432,
        database: 'yeosu_miracle_travel',
        user: 'yeosu_user',
        password: 'XEVFpHtXr7CsYZSYYmDhogjbXzo32hCR',
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔌 여수 기적여행 DB 연결 중...');
        await client.connect();
        console.log('✅ 연결 성공');

        // Read migration SQL file
        const sqlPath = path.join(__dirname, 'yeosu_migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('\n📝 마이그레이션 실행 중...');
        await client.query(sql);
        console.log('✅ 마이그레이션 완료!');

        // Verify tables
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 테이블 검증');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const tablesResult = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        console.log(`\n✓ 테이블 생성: ${tablesResult.rows.length}개`);
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        // Verify initial data
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📦 초기 데이터 검증');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const adminCount = await client.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['admin']);
        console.log(`\n✓ 관리자: ${adminCount.rows[0].count}명`);

        const adminData = await client.query('SELECT name, email, phone FROM users WHERE role = $1', ['admin']);
        if (adminData.rows.length > 0) {
            adminData.rows.forEach(admin => {
                console.log(`  - ${admin.name} (${admin.email}, ${admin.phone})`);
            });
        }

        const accomCount = await client.query('SELECT COUNT(*) as count FROM accommodations');
        console.log(`\n✓ 숙소: ${accomCount.rows[0].count}개`);

        const accomData = await client.query('SELECT name, type, price_per_night FROM accommodations ORDER BY price_per_night');
        if (accomData.rows.length > 0) {
            accomData.rows.forEach(acc => {
                console.log(`  - ${acc.name} (${acc.type}) - ${acc.price_per_night.toLocaleString()}원/박`);
            });
        }

        const actCount = await client.query('SELECT COUNT(*) as count FROM activities');
        console.log(`\n✓ 활동: ${actCount.rows[0].count}개`);

        const actData = await client.query('SELECT name, category, price FROM activities ORDER BY price');
        if (actData.rows.length > 0) {
            actData.rows.forEach(act => {
                console.log(`  - ${act.name} (${act.category}) - ${act.price.toLocaleString()}원`);
            });
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ 마이그레이션 검증 완료!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ 마이그레이션 실패');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('에러:', error.message);
        if (error.stack) {
            console.error('\n상세:', error.stack);
        }
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 DB 연결 종료');
    }
}

runMigration();
