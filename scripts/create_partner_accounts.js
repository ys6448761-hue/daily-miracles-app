#!/usr/bin/env node
/**
 * create_partner_accounts.js
 *
 * 기존 dt_partners 전체를 대상으로:
 * ① partner_accounts 계정 생성 (이미 있으면 skip)
 *    email: [city_code]_[id앞8자]@partner.dailymiracles.kr
 *    임시PW: DT + 랜덤 6자리 숫자
 * ② hometown_qr_code 없는 업체 자동 발급
 * ③ 결과를 콘솔 출력 + partner_list_2026.txt 저장
 *
 * 실행: node scripts/create_partner_accounts.js
 */

'use strict';

require('dotenv').config();
const path   = require('path');
const fs     = require('fs');
const bcrypt = require('bcryptjs');
const db     = require('../database/db');

const APP_BASE_URL    = process.env.APP_BASE_URL || 'https://app.dailymiracles.kr';
const OUTPUT_FILE     = path.join(__dirname, '..', 'partner_list_2026.txt');
const BCRYPT_ROUNDS   = 10;

// ── QR 코드 생성 헬퍼 ────────────────────────────────────────────────────
function makeQrCode(partnerId) {
  const prefix = partnerId.replace(/-/g, '').slice(0, 8).toUpperCase();
  const rand   = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HT_${prefix}_${rand}`;
}

// ── 이메일 슬러그 생성: city_code + id앞8자 ─────────────────────────────
function makeEmail(partner) {
  const slug = `${partner.city_code}_${partner.id.replace(/-/g, '').slice(0, 8)}`.toLowerCase();
  return `${slug}@partner.dailymiracles.kr`;
}

// ── 임시 비밀번호: DT + 6자리 숫자 ──────────────────────────────────────
function makeTempPassword() {
  const digits = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
  return `DT${digits}`;
}

// ── 테이블 정렬 출력 헬퍼 ────────────────────────────────────────────────
function padEnd(str, len) {
  const s = String(str ?? '');
  return s.length >= len ? s.slice(0, len) : s + ' '.repeat(len - s.length);
}

// ─────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log('  별들의 고향 파트너 계정 일괄 생성');
  console.log(`  시작: ${new Date().toISOString()}`);
  console.log('══════════════════════════════════════════════════════');
  console.log('');

  // ① dt_partners 전체 조회
  const { rows: partners } = await db.query(
    `SELECT id, name, city_code, hometown_qr_code, is_active
       FROM dt_partners
      ORDER BY city_code, name`
  );

  if (partners.length === 0) {
    console.log('⚠️  dt_partners에 업체가 없습니다.');
    process.exit(0);
  }

  console.log(`📋 조회된 업체 수: ${partners.length}개\n`);

  const results = [];  // { name, email, tempPw, qrUrl, status }

  for (const p of partners) {
    const email   = makeEmail(p);
    const tempPw  = makeTempPassword();
    const pwHash  = await bcrypt.hash(tempPw, BCRYPT_ROUNDS);

    let accountStatus = '';
    let qrUrl = '';
    let qrCode = p.hometown_qr_code;

    // ② QR 코드 없으면 자동 발급
    if (!qrCode) {
      qrCode = makeQrCode(p.id);
      try {
        await db.query(
          `UPDATE dt_partners
              SET hometown_qr_code = $1, hometown_qr_generated_at = NOW()
            WHERE id = $2`,
          [qrCode, p.id]
        );
        console.log(`  🔑 QR 발급: ${p.name} → ${qrCode}`);
      } catch (err) {
        console.warn(`  ⚠️  QR 발급 실패 (${p.name}): ${err.message}`);
        qrCode = null;
      }
    }

    qrUrl = qrCode ? `${APP_BASE_URL}/hometown?partner=${qrCode}` : '—';

    // ③ partner_accounts 생성 (이미 있으면 skip)
    try {
      const existing = await db.query(
        `SELECT id FROM partner_accounts WHERE partner_id = $1 LIMIT 1`,
        [p.id]
      );

      if (existing.rows.length > 0) {
        accountStatus = 'SKIP (계정 이미 존재)';
        results.push({ name: p.name, email, tempPw: '(기존 계정)', qrUrl, status: accountStatus });
        continue;
      }

      await db.query(
        `INSERT INTO partner_accounts (partner_id, email, password_hash, is_active)
         VALUES ($1, $2, $3, true)`,
        [p.id, email, pwHash]
      );
      accountStatus = 'OK';
    } catch (err) {
      // email unique 충돌 등
      if (err.code === '23505') {
        accountStatus = 'SKIP (이메일 중복)';
      } else {
        accountStatus = `ERROR: ${err.message}`;
      }
    }

    results.push({ name: p.name, email, tempPw, qrUrl, status: accountStatus });
  }

  // ── 결과 출력 ───────────────────────────────────────────────────────────
  const header = [
    padEnd('업체명', 20),
    padEnd('이메일', 46),
    padEnd('임시PW', 10),
    padEnd('QR URL', 65),
    '상태',
  ].join(' | ');
  const divider = '─'.repeat(header.length);

  const lines = [
    '════════════════════════════════════════════════════════════════════════════════',
    '  별들의 고향 파트너 계정 목록',
    `  생성일: ${new Date().toISOString().slice(0, 10)}`,
    '  ⚠️  이 파일에는 임시 비밀번호가 포함되어 있습니다. 안전하게 보관하세요.',
    '════════════════════════════════════════════════════════════════════════════════',
    '',
    header,
    divider,
    ...results.map(r => [
      padEnd(r.name,   20),
      padEnd(r.email,  46),
      padEnd(r.tempPw, 10),
      padEnd(r.qrUrl,  65),
      r.status,
    ].join(' | ')),
    divider,
    '',
    `총 ${results.length}개 업체 / 신규 생성: ${results.filter(r => r.status === 'OK').length}개 / 스킵: ${results.filter(r => r.status.startsWith('SKIP')).length}개`,
    '',
  ];

  const output = lines.join('\n');
  console.log('\n' + output);

  // ── 파일 저장 ───────────────────────────────────────────────────────────
  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
  console.log(`\n✅ 결과 저장 완료: ${OUTPUT_FILE}`);
  console.log('');

  await db.pool.end();
}

main().catch(err => {
  console.error('\n❌ 스크립트 오류:', err.message);
  process.exit(1);
});
