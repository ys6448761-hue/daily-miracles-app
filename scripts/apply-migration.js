#!/usr/bin/env node
'use strict';

/**
 * apply-migration.js — 단일 마이그레이션 파일 적용 스크립트
 *
 * 사용법:
 *   DATABASE_URL=<prod_url> node scripts/apply-migration.js database/migrations/172_seeds.sql
 *
 * 동작:
 *   1) 파일 읽기 → SQL 출력 (사용자가 한번 더 시각 검토)
 *   2) 5초 대기 (Ctrl-C 가능)
 *   3) BEGIN; ... COMMIT; 단일 트랜잭션으로 실행
 *   4) 실패 시 ROLLBACK
 *
 * 안전 장치:
 *   - DATABASE_URL 미설정 시 즉시 종료
 *   - localhost 가 아닌 경우 추가 확인 5초 대기
 *   - 마이그레이션 파일은 IF NOT EXISTS 패턴 권장 (idempotent)
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

const filePath = process.argv[2];
if (!filePath) {
  console.error('❌ 사용법: node scripts/apply-migration.js <path/to/migration.sql>');
  process.exit(1);
}

const absPath = path.resolve(filePath);
if (!fs.existsSync(absPath)) {
  console.error(`❌ 파일 없음: ${absPath}`);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL 환경변수 미설정. 운영 DB URL을 직접 전달:');
  console.error('   DATABASE_URL="postgres://..." node scripts/apply-migration.js <file>');
  process.exit(1);
}

const sql      = fs.readFileSync(absPath, 'utf-8');
const isLocal  = /(@|\/)(localhost|127\.0\.0\.1)/.test(process.env.DATABASE_URL);
const dbHost   = (process.env.DATABASE_URL.match(/@([^/:]+)/) || [])[1] || 'unknown';

console.log('═'.repeat(60));
console.log(`📄 파일: ${path.basename(absPath)}`);
console.log(`🌐 DB:  ${dbHost} ${isLocal ? '(local)' : '(REMOTE — 운영 가능성)'}`);
console.log(`📏 SQL: ${sql.length} bytes / ${sql.split('\n').length} lines`);
console.log('═'.repeat(60));
console.log(sql);
console.log('═'.repeat(60));

const wait = isLocal ? 2 : 5;
console.log(`⏳ ${wait}초 후 실행. Ctrl-C 로 중단 가능.`);

setTimeout(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 8000,
  });

  const client = await pool.connect();
  try {
    console.log('▶️  BEGIN');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ COMMIT — 마이그레이션 적용 완료');
  } catch (e) {
    console.error('❌ 실행 실패 — ROLLBACK:', e.message);
    try { await client.query('ROLLBACK'); } catch (_) {}
    process.exit(2);
  } finally {
    client.release();
    await pool.end();
  }
}, wait * 1000);
