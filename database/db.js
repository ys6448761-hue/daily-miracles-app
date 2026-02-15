const { Pool } = require('pg');

// PostgreSQL connection pool (환경변수 필수 — 하드코딩 금지)
const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
    };

if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
    console.error('❌ DB 환경변수 미설정: DATABASE_URL 또는 DB_HOST 필요');
}

const pool = new Pool({
    ...poolConfig,
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
