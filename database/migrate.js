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
        console.log('🔌 Connecting to PostgreSQL...');
        await client.connect();
        console.log('✅ Connected to database');

        // Read migration SQL file
        const sqlPath = path.join(__dirname, 'render_migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('\n📝 Running migration...');
        await client.query(sql);
        console.log('✅ Migration completed successfully!');

        // Verify tables
        console.log('\n🔍 Verifying tables...');
        const tablesResult = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        console.log(`\n📊 Tables created (${tablesResult.rows.length}):`);
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Verify views
        const viewsResult = await client.query(`
            SELECT table_name
            FROM information_schema.views
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log(`\n👁️  Views created (${viewsResult.rows.length}):`);
        viewsResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Verify functions
        const functionsResult = await client.query(`
            SELECT routine_name
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_type = 'FUNCTION'
            ORDER BY routine_name;
        `);

        console.log(`\n⚡ Functions created (${functionsResult.rows.length}):`);
        functionsResult.rows.forEach(row => {
            console.log(`   - ${row.routine_name}`);
        });

        console.log('\n✅ Migration verification complete!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔌 Disconnected from database');
    }
}

runMigration();
