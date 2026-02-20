// ═══════════════════════════════════════════════════════════
// P2.3 Stability Score + Alert Cooldown + Proactive Alert Tests
// Run: node tests/middleware/stabilityService.test.js
// ═══════════════════════════════════════════════════════════

const assert = require('assert');
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
  }
}

// ── Fresh instances for each test group (no singleton leaks) ──

function freshStabilityService() {
  const { StabilityService } = require('../../services/stabilityService');
  return new StabilityService();
}

function freshCooldown() {
  const { AlertCooldown } = require('../../middleware/alertCooldown');
  return new AlertCooldown();
}

// ═══════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 P2.3 Ops Hardening Tests');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ── GROUP 1: RollingCounter ──────────────────────────────
console.log('📊 RollingCounter');

test('increment and sum', () => {
  const { RollingCounter } = require('../../services/stabilityService');
  const counter = new RollingCounter(60000, 1000);
  counter.increment();
  counter.increment();
  counter.increment(3);
  assert.strictEqual(counter.sum(), 5);
});

test('expired buckets excluded from sum', () => {
  const { RollingCounter } = require('../../services/stabilityService');
  const counter = new RollingCounter(1000, 100); // 1s window
  // Manually insert an old bucket
  const oldTs = Date.now() - 5000;
  counter.buckets.set(oldTs, 10);
  counter.increment(2);
  assert.strictEqual(counter.sum(), 2, 'old bucket should be excluded');
});

test('cleanup removes old buckets', () => {
  const { RollingCounter } = require('../../services/stabilityService');
  const counter = new RollingCounter(1000, 100);
  const oldTs = Date.now() - 5000;
  counter.buckets.set(oldTs, 10);
  counter.increment(1);
  counter.cleanup();
  assert.strictEqual(counter.buckets.size, 1, 'should have 1 bucket after cleanup');
});

// ── GROUP 2: Score Calculation ──────────────────────────
console.log('\n📐 Score Calculation');

test('perfect score with zero signals', () => {
  const svc = freshStabilityService();
  const signals = {
    restart_count: 0,
    error_rate: 0,
    memory_usage_pct: 0,
    p95_latency_ms: null,
    fallback_count: 0,
  };
  const score = svc.calculateScore(signals);
  assert.strictEqual(score, 100);
  svc.destroy();
});

test('memory 50% reduces score by 15', () => {
  const svc = freshStabilityService();
  const score = svc.calculateScore({
    restart_count: 0, error_rate: 0, memory_usage_pct: 50,
    p95_latency_ms: null, fallback_count: 0,
  });
  assert.strictEqual(score, 85);
  svc.destroy();
});

test('1 restart reduces score by 5', () => {
  const svc = freshStabilityService();
  const score = svc.calculateScore({
    restart_count: 1, error_rate: 0, memory_usage_pct: 0,
    p95_latency_ms: null, fallback_count: 0,
  });
  assert.strictEqual(score, 95);
  svc.destroy();
});

test('10% error rate reduces score by 5', () => {
  const svc = freshStabilityService();
  const score = svc.calculateScore({
    restart_count: 0, error_rate: 0.1, memory_usage_pct: 0,
    p95_latency_ms: null, fallback_count: 0,
  });
  assert.strictEqual(score, 95);
  svc.destroy();
});

test('5 fallbacks reduce score by 5', () => {
  const svc = freshStabilityService();
  const score = svc.calculateScore({
    restart_count: 0, error_rate: 0, memory_usage_pct: 0,
    p95_latency_ms: null, fallback_count: 5,
  });
  assert.strictEqual(score, 95);
  svc.destroy();
});

test('combined signals produce correct score', () => {
  const svc = freshStabilityService();
  // 1 restart(-5) + 5% err(-2.5) + 60% mem(-18) + 3 fallback(-3) = 71.5
  const score = svc.calculateScore({
    restart_count: 1, error_rate: 0.05, memory_usage_pct: 60,
    p95_latency_ms: null, fallback_count: 3,
  });
  assert.strictEqual(score, 71.5);
  svc.destroy();
});

test('score never goes below 0', () => {
  const svc = freshStabilityService();
  const score = svc.calculateScore({
    restart_count: 20, error_rate: 1, memory_usage_pct: 100,
    p95_latency_ms: 5000, fallback_count: 50,
  });
  assert.strictEqual(score, 0);
  svc.destroy();
});

test('score never exceeds 100', () => {
  const svc = freshStabilityService();
  // All zeros = 100 (can't exceed)
  const score = svc.calculateScore({
    restart_count: 0, error_rate: 0, memory_usage_pct: 0,
    p95_latency_ms: 0, fallback_count: 0,
  });
  assert.strictEqual(score, 100);
  svc.destroy();
});

// ── GROUP 3: Status Mapping ──────────────────────────────
console.log('\n🟢 Status Mapping');

test('score 95 → healthy', () => {
  const svc = freshStabilityService();
  assert.strictEqual(svc.getStatusLabel(95), 'healthy');
  svc.destroy();
});

test('score 90 → healthy (boundary)', () => {
  const svc = freshStabilityService();
  assert.strictEqual(svc.getStatusLabel(90), 'healthy');
  svc.destroy();
});

test('score 85 → stable', () => {
  const svc = freshStabilityService();
  assert.strictEqual(svc.getStatusLabel(85), 'stable');
  svc.destroy();
});

test('score 80 → stable (boundary)', () => {
  const svc = freshStabilityService();
  assert.strictEqual(svc.getStatusLabel(80), 'stable');
  svc.destroy();
});

test('score 75 → degraded', () => {
  const svc = freshStabilityService();
  assert.strictEqual(svc.getStatusLabel(75), 'degraded');
  svc.destroy();
});

test('score 70 → degraded (boundary)', () => {
  const svc = freshStabilityService();
  assert.strictEqual(svc.getStatusLabel(70), 'degraded');
  svc.destroy();
});

test('score 65 → critical', () => {
  const svc = freshStabilityService();
  assert.strictEqual(svc.getStatusLabel(65), 'critical');
  svc.destroy();
});

test('score 0 → critical', () => {
  const svc = freshStabilityService();
  assert.strictEqual(svc.getStatusLabel(0), 'critical');
  svc.destroy();
});

// ── GROUP 4: getHealthz Response Shape ──────────────────
console.log('\n📡 getHealthz Response');

test('response contains required fields', () => {
  const svc = freshStabilityService();
  const h = svc.getHealthz();
  assert.ok(typeof h.status === 'string');
  assert.ok(typeof h.score === 'number');
  assert.strictEqual(h.window, '24h');
  assert.ok(typeof h.uptime_seconds === 'number');
  assert.ok(h.signals);
  assert.ok('restart_count' in h.signals);
  assert.ok('error_rate' in h.signals);
  assert.ok('memory_usage_pct' in h.signals);
  assert.ok('p95_latency_ms' in h.signals);
  assert.ok('fallback_count' in h.signals);
  svc.destroy();
});

test('fresh instance is healthy', () => {
  const svc = freshStabilityService();
  const h = svc.getHealthz();
  // Fresh = no errors, low memory → should be healthy or stable
  assert.ok(h.score >= 70, `score ${h.score} should be at least 70`);
  svc.destroy();
});

// ── GROUP 5: Middleware counting ──────────────────────────
console.log('\n🔢 Middleware Counting');

test('middleware counts requests', () => {
  const svc = freshStabilityService();
  const mw = svc.middleware();

  // Mock req/res/next
  const req = {};
  const res = { statusCode: 200, end: () => {} };
  const next = () => {};

  mw(req, res, next);
  mw(req, res, next);
  res.end(); // trigger patched end
  res.end();

  const counts = svc._getRawCounts();
  assert.strictEqual(counts.totalRequests, 2);
  assert.strictEqual(counts.errorRequests, 0);
  svc.destroy();
});

test('middleware counts 5xx errors', () => {
  const svc = freshStabilityService();
  const mw = svc.middleware();

  const req = {};
  const res500 = { statusCode: 500, end: () => {} };
  const next = () => {};

  mw(req, res500, next);
  res500.end();

  const counts = svc._getRawCounts();
  assert.strictEqual(counts.totalRequests, 1);
  assert.strictEqual(counts.errorRequests, 1);
  svc.destroy();
});

test('recordFallback increments fallback counter', () => {
  const svc = freshStabilityService();
  svc.recordFallback();
  svc.recordFallback();
  svc.recordFallback();
  const counts = svc._getRawCounts();
  assert.strictEqual(counts.fallbacks, 3);
  svc.destroy();
});

// ── GROUP 6: Alert Cooldown ──────────────────────────────
console.log('\n⏱ Alert Cooldown');

test('first alert is always allowed', () => {
  const cd = freshCooldown();
  const result = cd.check('test|/api|500', null);
  assert.strictEqual(result.allowed, true);
  assert.strictEqual(result.cooldown_suppressed, false);
  cd.destroy();
});

test('second alert within window is suppressed', () => {
  const cd = freshCooldown();
  cd.check('test|/api|500', null); // first
  const result = cd.check('test|/api|500', null); // second
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.cooldown_suppressed, true);
  assert.strictEqual(result.suppressedCount, 1);
  cd.destroy();
});

test('different keys are independent', () => {
  const cd = freshCooldown();
  cd.check('typeA|/api/a|500', null);
  const result = cd.check('typeB|/api/b|500', null);
  assert.strictEqual(result.allowed, true);
  cd.destroy();
});

test('suppressed count increments', () => {
  const cd = freshCooldown();
  cd.check('test|/api|500', null);
  cd.check('test|/api|500', null); // suppressed 1
  cd.check('test|/api|500', null); // suppressed 2
  const result = cd.check('test|/api|500', null); // suppressed 3
  assert.strictEqual(result.suppressedCount, 3);
  cd.destroy();
});

test('buildKey produces expected format', () => {
  const { AlertCooldown } = require('../../middleware/alertCooldown');
  const key = AlertCooldown.buildKey({ errorClass: 'DB', route: 'GET /api/health', statusCode: 500 });
  assert.strictEqual(key, 'DB|GET /api/health|500');
});

test('buildKey handles missing fields', () => {
  const { AlertCooldown } = require('../../middleware/alertCooldown');
  const key = AlertCooldown.buildKey({});
  assert.strictEqual(key, 'unknown|*|500');
});

test('reset clears all entries', () => {
  const cd = freshCooldown();
  cd.check('a', null);
  cd.check('b', null);
  assert.strictEqual(cd.size, 2);
  cd.reset();
  assert.strictEqual(cd.size, 0);
  cd.destroy();
});

// ── GROUP 7: Proactive Alert Integration ─────────────────
console.log('\n🔔 Proactive Alert');

test('proactive monitor sends alert when score < 70', () => {
  const svc = freshStabilityService();
  let sentMsg = null;
  svc._slackSender = (msg) => { sentMsg = msg; return Promise.resolve(); };
  svc._lastAlertedStatus = 'healthy';

  // Force high error rate to drop score below 70
  for (let i = 0; i < 200; i++) svc._errorRequests.increment();
  for (let i = 0; i < 200; i++) svc._totalRequests.increment();

  svc._evaluateAndAlert();
  assert.ok(sentMsg, 'should have sent alert');
  assert.ok(sentMsg.text.includes('CRITICAL'), 'should be critical alert');
  svc.destroy();
});

test('proactive monitor does NOT alert when score >= 80', () => {
  const svc = freshStabilityService();
  let sentMsg = null;
  svc._slackSender = (msg) => { sentMsg = msg; return Promise.resolve(); };
  svc._lastAlertedStatus = 'healthy';

  // Override getHealthz to return a high score (avoids real memory effects)
  svc.getHealthz = () => ({
    status: 'healthy', score: 95, window: '24h', uptime_seconds: 100,
    signals: { restart_count: 0, error_rate: 0, memory_usage_pct: 30, p95_latency_ms: null, fallback_count: 0 },
  });

  svc._evaluateAndAlert();
  assert.strictEqual(sentMsg, null, 'should not alert when healthy/stable');
  svc.destroy();
});

test('proactive monitor sends recovery alert', () => {
  const svc = freshStabilityService();
  let sentMsg = null;
  svc._slackSender = (msg) => { sentMsg = msg; return Promise.resolve(); };
  svc._lastAlertedStatus = 'critical'; // was critical

  // Override to simulate recovery to healthy
  svc.getHealthz = () => ({
    status: 'healthy', score: 92, window: '24h', uptime_seconds: 600,
    signals: { restart_count: 0, error_rate: 0, memory_usage_pct: 25, p95_latency_ms: null, fallback_count: 0 },
  });

  svc._evaluateAndAlert();
  assert.ok(sentMsg, 'should have sent recovery alert');
  assert.ok(sentMsg.text.includes('RECOVERED'), 'should be recovery message');
  svc.destroy();
});

// ═══════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🧪 Results: ${passed} passed, ${failed} failed (total ${passed + failed})`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

process.exit(failed > 0 ? 1 : 0);
