const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'dpg-d3t9gpa4d50c73d2i3gg-a.singapore-postgres.render.com',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'yeosu_miracle_travel',
    user: process.env.DB_USER || 'yeosu_user',
    password: process.env.DB_PASSWORD || 'XEVFpHtXr7CsYZSYYmDhogjbXzo32hCR',
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
    console.log('✅ PostgreSQL 연결 성공');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL 연결 오류:', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
