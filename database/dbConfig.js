/**
 * dbConfig.js — 마이그레이션/스크립트용 DB 연결 설정 헬퍼
 *
 * 환경변수 필수 (하드코딩 금지):
 *   DATABASE_URL 또는 DB_HOST + DB_USER + DB_PASSWORD + DB_NAME
 *
 * @since 2026-02-14
 */

function getConnectionConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
    };
  }

  if (!process.env.DB_HOST || !process.env.DB_USER) {
    console.error('');
    console.error('╔══════════════════════════════════════════════════════════╗');
    console.error('║  ❌ DB 환경변수 미설정                                   ║');
    console.error('║                                                          ║');
    console.error('║  DATABASE_URL 또는 DB_HOST+DB_USER+DB_PASSWORD 필요      ║');
    console.error('║  .env 파일 또는 Render Dashboard에서 설정하세요           ║');
    console.error('╚══════════════════════════════════════════════════════════╝');
    console.error('');
    process.exit(1);
  }

  return {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  };
}

module.exports = { getConnectionConfig };
