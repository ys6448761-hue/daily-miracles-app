#!/usr/bin/env node
/**
 * Render Services Hygiene Check
 *
 * Render 대시보드에 있는 서비스를 코드베이스 기준으로 분류합니다.
 * Render API 키가 있으면 자동 검증, 없으면 수동 체크리스트 출력.
 *
 * 실행:
 *   node scripts/ops/render-hygiene-check.js
 *   RENDER_API_KEY=rnd_xxx node scripts/ops/render-hygiene-check.js
 *
 * @owner LUMI
 * @date 2026-02-09
 */

const RENDER_API_KEY = process.env.RENDER_API_KEY || null;

// ═══════════════════════════════════════════════════════════════
// 코드베이스 기준: 유지해야 할 서비스 정의
// ═══════════════════════════════════════════════════════════════
const EXPECTED_SERVICES = {
  // ─── KEEP_PROD ───────────────────────────────────────────
  'daily-miracles-mvp': {
    classification: 'KEEP_PROD',
    type: 'web',
    description: '메인 모노리스 (Express API + 정적 파일)',
    domains: ['app.dailymiracles.kr', 'dailymiracles.kr', 'www.dailymiracles.kr', 'pay.dailymiracles.kr'],
    render_url: 'daily-miracles-app.onrender.com',
    health_check: '/api/health',
    critical_env: ['NODE_ENV', 'DATABASE_URL', 'OPENAI_API_KEY', 'OPS_SLACK_WEBHOOK'],
    notes: 'render.yaml에 정의된 유일한 웹 서비스'
  },

  // ─── KEEP_DB ─────────────────────────────────────────────
  'daily-miracles-db': {
    classification: 'KEEP_DB',
    type: 'database',
    description: 'PostgreSQL (daily_miracles)',
    render_id_prefix: 'dpg-d3t9gpa4d50c73d2i3gg',
    region: 'singapore',
    notes: '모든 마이그레이션 스크립트가 이 DB 참조. 삭제 절대 금지.'
  }
};

// ─── DELETE 후보 (코드에서 더 이상 참조하지 않는 서비스명) ───
const DELETE_CANDIDATES = [
  {
    name_pattern: 'daily-miracles-api',
    reason: 'WIX_INTEGRATION.md에만 레거시 참조 (daily-miracles-api.onrender.com). 실제 코드 미사용.',
    verify_before_delete: [
      'Wix 웹훅이 이 URL로 설정되어 있는지 확인',
      'NicePay 콜백 URL이 이 서비스를 가리키는지 확인'
    ]
  },
  {
    name_pattern: 'daily-miracles',
    reason: 'AURORA_STATUS.md에서 "잘못된 URL"로 명시 (daily-miracles.onrender.com)',
    verify_before_delete: [
      '커스텀 도메인 연결 없는지 확인',
      '최근 30일 트래픽 0인지 확인'
    ]
  }
];

// ─── 네이밍 규칙 ───────────────────────────────────────────
const NAMING_CONVENTION = {
  prod_web: 'dm-prod',
  staging_web: 'dm-staging',
  prod_db: 'dm-prod-db',
  staging_db: 'dm-staging-db',
  pattern: 'dm-{env}-{role}',
  examples: {
    'dm-prod': '프로덕션 웹 서비스',
    'dm-staging': '스테이징 웹 서비스',
    'dm-prod-db': '프로덕션 PostgreSQL',
    'dm-staging-db': '스테이징 PostgreSQL (있다면)'
  }
};

// ═══════════════════════════════════════════════════════════════
// Render API 호출 (선택적)
// ═══════════════════════════════════════════════════════════════
async function fetchRenderServices() {
  if (!RENDER_API_KEY) return null;

  try {
    const res = await fetch('https://api.render.com/v1/services?limit=50', {
      headers: { Authorization: `Bearer ${RENDER_API_KEY}` }
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`  Render API 호출 실패: ${err.message}`);
    return null;
  }
}

async function fetchRenderDatabases() {
  if (!RENDER_API_KEY) return null;

  try {
    const res = await fetch('https://api.render.com/v1/postgres?limit=50', {
      headers: { Authorization: `Bearer ${RENDER_API_KEY}` }
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`  Render API 호출 실패: ${err.message}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// 메인 검증
// ═══════════════════════════════════════════════════════════════
async function run() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Render Services Hygiene Check');
  console.log('  Owner: LUMI | Date: 2026-02-09');
  console.log('═══════════════════════════════════════════════════════');

  // ─── 1. 코드베이스 기준 KEEP 목록 ───
  console.log('\n--- 1. KEEP (코드베이스에서 참조하는 서비스) ---\n');

  for (const [name, svc] of Object.entries(EXPECTED_SERVICES)) {
    const icon = svc.classification === 'KEEP_PROD' ? '🟢' : '🗄️';
    console.log(`  ${icon} ${name}`);
    console.log(`     분류: ${svc.classification}`);
    console.log(`     타입: ${svc.type}`);
    console.log(`     설명: ${svc.description}`);
    if (svc.domains) console.log(`     도메인: ${svc.domains.join(', ')}`);
    if (svc.render_url) console.log(`     Render URL: ${svc.render_url}`);
    if (svc.critical_env) console.log(`     필수 환경변수: ${svc.critical_env.join(', ')}`);
    console.log(`     비고: ${svc.notes}`);
    console.log('');
  }

  // ─── 2. DELETE 후보 ───
  console.log('--- 2. DELETE 후보 (코드 미참조/레거시) ---\n');

  for (const candidate of DELETE_CANDIDATES) {
    console.log(`  🔴 이름 패턴: *${candidate.name_pattern}*`);
    console.log(`     사유: ${candidate.reason}`);
    console.log('     삭제 전 확인:');
    candidate.verify_before_delete.forEach(v => console.log(`       - ${v}`));
    console.log('');
  }

  // ─── 3. Render API 검증 (키 있으면) ───
  if (RENDER_API_KEY) {
    console.log('--- 3. Render API 자동 검증 ---\n');

    const services = await fetchRenderServices();
    const databases = await fetchRenderDatabases();

    if (services) {
      console.log(`  발견된 웹 서비스: ${services.length}개`);
      const expectedNames = Object.keys(EXPECTED_SERVICES).filter(k => EXPECTED_SERVICES[k].type === 'web');

      for (const svc of services) {
        const s = svc.service || svc;
        const name = s.name || 'unknown';
        const status = s.suspended === 'suspended' ? 'SUSPENDED' : 'ACTIVE';
        const isExpected = expectedNames.some(n => name.includes(n));
        const icon = isExpected ? '✅' : '❓';
        const deployStatus = s.serviceDetails?.lastDeployStatus || 'unknown';

        console.log(`  ${icon} ${name} [${status}] deploy=${deployStatus}`);

        if (!isExpected) {
          console.log(`     ⚠️  코드베이스 미참조 → DELETE 검토`);
          if (s.serviceDetails?.url) console.log(`     URL: ${s.serviceDetails.url}`);
        }
      }
    }

    if (databases) {
      console.log(`\n  발견된 DB: ${databases.length}개`);
      for (const db of databases) {
        const d = db.database || db;
        const name = d.name || 'unknown';
        const status = d.status || 'unknown';
        console.log(`  🗄️  ${name} [${status}]`);
      }
    }
  } else {
    console.log('--- 3. 수동 체크리스트 (RENDER_API_KEY 미설정) ---\n');
    console.log('  Render 대시보드 (https://dashboard.render.com) 에서 직접 확인:\n');
    console.log('  [ ] 전체 서비스 목록 → 이 스크립트의 KEEP 목록과 대조');
    console.log('  [ ] 상태 "Deploy failed" 인 서비스 → 삭제 대상');
    console.log('  [ ] 최근 30일 요청 0건 + KEEP 아닌 서비스 → 삭제 대상');
    console.log('  [ ] 커스텀 도메인 연결된 서비스는 삭제 전 도메인 해제');
    console.log('  [ ] 환경변수에 시크릿 백업 (삭제 전)');
    console.log('  [ ] DB는 반드시 pg_dump 백업 후 삭제');
    console.log('');
  }

  // ─── 4. 네이밍 규칙 제안 ───
  console.log('--- 4. 네이밍 규칙 제안 ---\n');
  console.log(`  패턴: ${NAMING_CONVENTION.pattern}\n`);
  for (const [name, desc] of Object.entries(NAMING_CONVENTION.examples)) {
    console.log(`  ${name.padEnd(20)} → ${desc}`);
  }

  // ─── 5. Done 기준 ───
  console.log('\n--- 5. Done 기준 ---\n');
  console.log('  [ ] prod + DB만 남음 (staging은 선택)');
  console.log('  [ ] Deploy failed 서비스 = 0개');
  console.log('  [ ] 서비스명이 역할을 반영 (dm-prod, dm-prod-db)');
  console.log('  [ ] 모든 서비스에 description 설정');
  console.log('  [ ] 레거시 .onrender.com URL 코드에서 정리 (app.dailymiracles.kr로 통일)');

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Hygiene check complete.');
  console.log('═══════════════════════════════════════════════════════\n');
}

run().catch(err => {
  console.error('Hygiene check failed:', err.message);
  process.exit(1);
});
