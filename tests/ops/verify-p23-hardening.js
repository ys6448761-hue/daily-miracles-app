#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// P2.3 Ops Hardening — 실전 검증 시나리오 6개
// Run: node tests/ops/verify-p23-hardening.js
//
// 단위 테스트가 아닌 "통합 시뮬레이션" 스크립트.
// stabilityService + alertCooldown을 직접 구동하여
// 6개 시나리오의 기대 결과를 검증합니다.
// ═══════════════════════════════════════════════════════════

const assert = require('assert');
const { StabilityService, THRESHOLDS } = require('../../services/stabilityService');
const { AlertCooldown, COOLDOWN_MS } = require('../../middleware/alertCooldown');

let passed = 0;
let failed = 0;
const results = [];

function scenario(name, fn) {
  try {
    fn();
    passed++;
    results.push({ name, status: '✅' });
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    results.push({ name, status: '❌', reason: e.message });
    console.log(`  ❌ ${name}`);
    console.log(`     → ${e.message}`);
  }
}

// ═══════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 P2.3 Ops Hardening — 실전 검증 시나리오');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ═══════════════════════════════════════════════════════════
// 🧪 1️⃣ 강제 5xx 에러 폭주 테스트
// ═══════════════════════════════════════════════════════════
console.log('🧪 1️⃣  강제 5xx 에러 폭주 테스트');

scenario('100회 5xx 에러 후 score 하락', () => {
  const svc = new StabilityService();
  // 100 요청 중 100 에러
  for (let i = 0; i < 100; i++) {
    svc._totalRequests.increment();
    svc._errorRequests.increment();
  }
  const h = svc.getHealthz();
  assert.ok(h.signals.error_rate === 1, `error_rate should be 1.0, got ${h.signals.error_rate}`);
  assert.ok(h.score < 80, `score ${h.score} should be < 80 with 100% error rate`);
  assert.ok(h.status === 'degraded' || h.status === 'critical', `status should be degraded/critical, got ${h.status}`);
  svc.destroy();
});

scenario('Cooldown: 동일 key 100회 → Slack 1회만', () => {
  const cd = new AlertCooldown();
  let allowedCount = 0;
  const key = 'DB|POST /api/test|500';

  for (let i = 0; i < 100; i++) {
    const { allowed } = cd.check(key, null);
    if (allowed) allowedCount++;
  }
  assert.strictEqual(allowedCount, 1, `should allow exactly 1, got ${allowedCount}`);
  cd.destroy();
});

scenario('Cooldown: suppressed 로그에 count 기록', () => {
  const cd = new AlertCooldown();
  const key = 'Unknown|GET /api/boom|500';
  cd.check(key, null); // allowed
  const r2 = cd.check(key, null); // suppressed
  const r3 = cd.check(key, null); // suppressed

  assert.strictEqual(r2.cooldown_suppressed, true);
  assert.strictEqual(r2.suppressedCount, 1);
  assert.strictEqual(r3.suppressedCount, 2);
  cd.destroy();
});

// ═══════════════════════════════════════════════════════════
// 🧪 2️⃣ Circuit Fallback 강제 테스트
// ═══════════════════════════════════════════════════════════
console.log('\n🧪 2️⃣  Circuit Fallback 강제 테스트');

scenario('20 fallback → score 감소, 서비스 중단 없음', () => {
  const svc = new StabilityService();
  // 100 정상 요청 + 20 fallback
  for (let i = 0; i < 100; i++) svc._totalRequests.increment();
  for (let i = 0; i < 20; i++) svc.recordFallback();

  const h = svc.getHealthz();
  assert.strictEqual(h.signals.fallback_count, 20);
  // 20 fallback * 1 = -20 → score should drop by 20 from base
  const baseScore = 100 - (h.signals.memory_usage_pct * 0.3);
  const expectedScore = Math.round((baseScore - 20) * 10) / 10;
  assert.strictEqual(h.score, Math.max(0, expectedScore));
  // 서비스 중단 아님 (getHealthz 자체가 동작함)
  assert.ok(typeof h.status === 'string');
  svc.destroy();
});

scenario('Slack 폭주 없음: fallback 알림도 cooldown 적용', () => {
  const cd = new AlertCooldown();
  let allowedCount = 0;

  for (let i = 0; i < 20; i++) {
    const { allowed } = cd.check('proactive|stability|degraded', 'degraded');
    if (allowed) allowedCount++;
  }
  // degraded cooldown = 10min → 20회 호출해도 1회만
  assert.strictEqual(allowedCount, 1);
  cd.destroy();
});

// ═══════════════════════════════════════════════════════════
// 🧪 3️⃣ Memory 사용량 상승 테스트
// ═══════════════════════════════════════════════════════════
console.log('\n🧪 3️⃣  Memory 사용량 상승 테스트');

scenario('memory_usage_pct가 signals에 반영', () => {
  const svc = new StabilityService();
  const h = svc.getHealthz();
  assert.ok(typeof h.signals.memory_usage_pct === 'number');
  assert.ok(h.signals.memory_usage_pct >= 0 && h.signals.memory_usage_pct <= 100,
    `memory_usage_pct ${h.signals.memory_usage_pct} should be 0-100`);
  svc.destroy();
});

scenario('높은 memory → score 감소', () => {
  const svc = new StabilityService();
  // 직접 score 계산으로 검증 (memory 90%)
  const score = svc.calculateScore({
    restart_count: 0, error_rate: 0, memory_usage_pct: 90,
    p95_latency_ms: null, fallback_count: 0,
  });
  // 100 - (90 * 0.3) = 73
  assert.strictEqual(score, 73);
  assert.strictEqual(svc.getStatusLabel(score), 'degraded');
  svc.destroy();
});

// ═══════════════════════════════════════════════════════════
// 🧪 4️⃣ Restart 테스트
// ═══════════════════════════════════════════════════════════
console.log('\n🧪 4️⃣  Restart 테스트');

scenario('restart 2회 → signals 반영 + score 감소', () => {
  const svc = new StabilityService();
  svc.recordRestart();
  svc.recordRestart();

  const h = svc.getHealthz();
  assert.strictEqual(h.signals.restart_count, 2);
  // 2 restart * 5 = -10 from base
  const baseScore = 100 - (h.signals.memory_usage_pct * 0.3);
  const expectedScore = Math.round((baseScore - 10) * 10) / 10;
  assert.strictEqual(h.score, Math.max(0, expectedScore));
  svc.destroy();
});

// ═══════════════════════════════════════════════════════════
// 🧪 5️⃣ 임계값 크로싱 테스트
// ═══════════════════════════════════════════════════════════
console.log('\n🧪 5️⃣  임계값 크로싱 테스트');

scenario('score 85→75→65 단계별 상태 전환', () => {
  const svc = new StabilityService();
  assert.strictEqual(svc.getStatusLabel(85), 'stable');
  assert.strictEqual(svc.getStatusLabel(75), 'degraded');
  assert.strictEqual(svc.getStatusLabel(65), 'critical');
  svc.destroy();
});

scenario('degraded → 🟡 알림, critical → 🔴 알림 (메시지 구분)', () => {
  const svc = new StabilityService();
  const alerts = [];
  svc._slackSender = (msg) => { alerts.push(msg); return Promise.resolve(); };
  svc._lastAlertedStatus = 'healthy';

  // Force degraded (score ~75)
  svc.getHealthz = () => ({
    status: 'degraded', score: 75, window: '24h', uptime_seconds: 300,
    signals: { restart_count: 0, error_rate: 0.05, memory_usage_pct: 70, p95_latency_ms: null, fallback_count: 5 },
  });
  svc._evaluateAndAlert();

  assert.ok(alerts.length === 1, 'should have 1 degraded alert');
  assert.ok(alerts[0].text.includes('DEGRADED'), `should contain DEGRADED, got: ${alerts[0].text}`);

  // Force critical (score ~60) — need new cooldown key
  svc._lastAlertedStatus = 'degraded';
  svc.getHealthz = () => ({
    status: 'critical', score: 60, window: '24h', uptime_seconds: 600,
    signals: { restart_count: 2, error_rate: 0.2, memory_usage_pct: 80, p95_latency_ms: null, fallback_count: 10 },
  });
  svc._evaluateAndAlert();

  assert.ok(alerts.length === 2, `should have 2 alerts, got ${alerts.length}`);
  assert.ok(alerts[1].text.includes('CRITICAL'), `should contain CRITICAL, got: ${alerts[1].text}`);
  svc.destroy();
});

scenario('알림 메시지에 score + signals 포함', () => {
  // Reset shared cooldown singleton to avoid cross-test interference
  require('../../middleware/alertCooldown').reset();

  const svc = new StabilityService();
  let sentMsg = null;
  svc._slackSender = (msg) => { sentMsg = msg; return Promise.resolve(); };
  svc._lastAlertedStatus = 'healthy';

  svc.getHealthz = () => ({
    status: 'critical', score: 55, window: '24h', uptime_seconds: 100,
    signals: { restart_count: 3, error_rate: 0.15, memory_usage_pct: 85, p95_latency_ms: null, fallback_count: 12 },
  });
  svc._evaluateAndAlert();

  assert.ok(sentMsg, 'should have sent alert');
  const blockText = JSON.stringify(sentMsg.blocks);
  assert.ok(blockText.includes('55'), 'should contain score 55');
  assert.ok(blockText.includes('error_rate'), 'should contain error_rate signal');
  assert.ok(blockText.includes('memory'), 'should contain memory signal');
  assert.ok(blockText.includes('fallbacks'), 'should contain fallback signal');
  svc.destroy();
});

// ═══════════════════════════════════════════════════════════
// 🧪 6️⃣ Recovery 테스트
// ═══════════════════════════════════════════════════════════
console.log('\n🧪 6️⃣  Recovery 테스트');

scenario('critical → healthy 복귀 시 Recovery 알림', () => {
  const svc = new StabilityService();
  let sentMsg = null;
  svc._slackSender = (msg) => { sentMsg = msg; return Promise.resolve(); };
  svc._lastAlertedStatus = 'critical'; // 이전 상태: critical

  // 현재 healthy
  svc.getHealthz = () => ({
    status: 'healthy', score: 95, window: '24h', uptime_seconds: 3600,
    signals: { restart_count: 0, error_rate: 0, memory_usage_pct: 30, p95_latency_ms: null, fallback_count: 0 },
  });
  svc._evaluateAndAlert();

  assert.ok(sentMsg, 'should have sent recovery alert');
  assert.ok(sentMsg.text.includes('RECOVERED'), `should contain RECOVERED, got: ${sentMsg.text}`);
  svc.destroy();
});

scenario('degraded → healthy 복귀 시도 Recovery 알림', () => {
  // Reset shared cooldown singleton
  require('../../middleware/alertCooldown').reset();

  const svc = new StabilityService();
  let sentMsg = null;
  svc._slackSender = (msg) => { sentMsg = msg; return Promise.resolve(); };
  svc._lastAlertedStatus = 'degraded';

  svc.getHealthz = () => ({
    status: 'stable', score: 88, window: '24h', uptime_seconds: 1800,
    signals: { restart_count: 0, error_rate: 0.005, memory_usage_pct: 40, p95_latency_ms: null, fallback_count: 0 },
  });
  svc._evaluateAndAlert();

  assert.ok(sentMsg, 'should have sent recovery alert from degraded');
  assert.ok(sentMsg.text.includes('RECOVERED'));
  svc.destroy();
});

scenario('healthy 유지 시 Recovery 알림 미발송', () => {
  const svc = new StabilityService();
  let sentMsg = null;
  svc._slackSender = (msg) => { sentMsg = msg; return Promise.resolve(); };
  svc._lastAlertedStatus = 'healthy';

  svc.getHealthz = () => ({
    status: 'healthy', score: 96, window: '24h', uptime_seconds: 7200,
    signals: { restart_count: 0, error_rate: 0, memory_usage_pct: 25, p95_latency_ms: null, fallback_count: 0 },
  });
  svc._evaluateAndAlert();

  assert.strictEqual(sentMsg, null, 'should not send recovery when already healthy');
  svc.destroy();
});

// ═══════════════════════════════════════════════════════════
// 📋 최종 Ops 완료 체크 출력
// ═══════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 최종 Ops 완료 체크');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const checks = {
  'score 계산 정상': results.filter(r => r.name.includes('score')).every(r => r.status === '✅'),
  '상태 매핑 정상': results.filter(r => r.name.includes('상태') || r.name.includes('status')).every(r => r.status === '✅'),
  'Slack cooldown 정상': results.filter(r => r.name.includes('Cooldown') || r.name.includes('cooldown')).every(r => r.status === '✅'),
  'fallback 반영': results.filter(r => r.name.includes('fallback') || r.name.includes('Fallback')).every(r => r.status === '✅'),
  'restart 반영': results.filter(r => r.name.includes('restart') || r.name.includes('Restart')).every(r => r.status === '✅'),
  'recovery 확인': results.filter(r => r.name.includes('Recovery') || r.name.includes('recovery')).every(r => r.status === '✅'),
};

for (const [item, pass] of Object.entries(checks)) {
  console.log(`  ${pass ? '✅' : '❌'} ${item}`);
}

console.log(`\n🧪 Results: ${passed} passed, ${failed} failed (total ${passed + failed})`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (failed === 0) {
  console.log('🎯 광고 진입 게이트 조건:');
  console.log('  • Stability Score ≥ 90 (3일 유지)');
  console.log('  • error_rate < 1%');
  console.log('  • fallback_count < 10/day');
  console.log('  • Slack cooldown 정상 작동');
  console.log('\n✅ 모든 시나리오 통과 — Ops Hardening 검증 완료!\n');
}

process.exit(failed > 0 ? 1 : 0);
