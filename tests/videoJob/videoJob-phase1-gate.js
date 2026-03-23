#!/usr/bin/env node
/**
 * VideoJob Phase 1 Gate Test — 상태머신 + 재시도 + Store + Feature Flags
 *
 * 실행: npm run test:videoJob:p1
 * Gate: G1-G5 (36 TC)
 */

const path = require('path');

// 서비스 로드
const { STATES, TRANSITIONS, RETRY_POLICIES, RETRYABLE_ERROR_CODES, ERROR_CODES } = require('../../services/videoJob/constants');
const RetryManager = require('../../services/videoJob/RetryManager');
const VideoJobStore = require('../../services/videoJob/VideoJobStore');
const VideoJobOrchestrator = require('../../services/videoJob/VideoJobOrchestrator');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testId, detail) {
  if (condition) {
    passed++;
  } else {
    failed++;
    const msg = `${testId}: ${detail}`;
    failures.push(msg);
    console.log(`  ❌ ${msg}`);
  }
}

console.log('═══════════════════════════════════════════════════════');
console.log('  VideoJob Phase 1 Gate Test (G1-G5)');
console.log('═══════════════════════════════════════════════════════\n');

// ─── G1: 상태머신 전이 (12 TC) ─────────────────────────────
console.log('--- G1: State Machine Transitions ---\n');

const orchestrator = new VideoJobOrchestrator();

// G1-01~G1-07: 합법 전이 (happy path)
const happyPath = [
  [STATES.QUEUED, STATES.BUILD],
  [STATES.BUILD, STATES.VALIDATE],
  [STATES.VALIDATE, STATES.RENDER],
  [STATES.RENDER, STATES.SUBTITLE],
  [STATES.SUBTITLE, STATES.PACKAGE],
  [STATES.PACKAGE, STATES.DELIVER],
  [STATES.DELIVER, STATES.DONE],
];

happyPath.forEach(([from, to], i) => {
  try {
    orchestrator.validateTransition(from, to);
    assert(true, `G1-${String(i + 1).padStart(2, '0')}`, `${from} → ${to} 허용`);
  } catch (e) {
    assert(false, `G1-${String(i + 1).padStart(2, '0')}`, `${from} → ${to} 허용이어야 함: ${e.message}`);
  }
});

// G1-08: VALIDATE → BUILD (롤백)
try {
  orchestrator.validateTransition(STATES.VALIDATE, STATES.BUILD);
  assert(true, 'G1-08', 'VALIDATE → BUILD 롤백 허용');
} catch (e) {
  assert(false, 'G1-08', `VALIDATE → BUILD 롤백 허용이어야 함: ${e.message}`);
}

// G1-09: 어느 단계에서든 FAILED로 전이 가능
const failableStates = [STATES.QUEUED, STATES.BUILD, STATES.VALIDATE, STATES.RENDER, STATES.SUBTITLE, STATES.PACKAGE, STATES.DELIVER];
let allCanFail = true;
failableStates.forEach(state => {
  try {
    orchestrator.validateTransition(state, STATES.FAILED);
  } catch (_) {
    allCanFail = false;
  }
});
assert(allCanFail, 'G1-09', '모든 활성 상태 → FAILED 전이 가능');

// G1-10: DONE은 전이 불가 (terminal)
try {
  orchestrator.validateTransition(STATES.DONE, STATES.BUILD);
  assert(false, 'G1-10', 'DONE → BUILD 불법이어야 함');
} catch (_) {
  assert(true, 'G1-10', 'DONE은 terminal state');
}

// G1-11: FAILED는 전이 불가 (terminal)
try {
  orchestrator.validateTransition(STATES.FAILED, STATES.QUEUED);
  assert(false, 'G1-11', 'FAILED → QUEUED 불법이어야 함');
} catch (_) {
  assert(true, 'G1-11', 'FAILED는 terminal state');
}

// G1-12: 역방향 전이 불가 (BUILD → QUEUED)
try {
  orchestrator.validateTransition(STATES.BUILD, STATES.QUEUED);
  assert(false, 'G1-12', 'BUILD → QUEUED 불법이어야 함');
} catch (_) {
  assert(true, 'G1-12', '역방향 전이 차단');
}

console.log('');

// ─── G2: RetryManager (8 TC) ────────────────────────────────
console.log('--- G2: RetryManager ---\n');

// G2-01: exponential 지연 계산
assert(
  RetryManager.calculateDelay(0, RETRY_POLICIES.OPENAI_RUNWAY_NETWORK) === 1000,
  'G2-01', 'exponential attempt 0 = 1000ms'
);

// G2-02: exponential 지연 계산 (attempt 2)
assert(
  RetryManager.calculateDelay(2, RETRY_POLICIES.OPENAI_RUNWAY_NETWORK) === 4000,
  'G2-02', 'exponential attempt 2 = 4000ms'
);

// G2-03: exponential 지연 계산 (attempt 4 = 16s)
assert(
  RetryManager.calculateDelay(4, RETRY_POLICIES.OPENAI_RUNWAY_NETWORK) === 16000,
  'G2-03', 'exponential attempt 4 = 16000ms'
);

// G2-04: linear 지연 계산
assert(
  RetryManager.calculateDelay(0, RETRY_POLICIES.FFMPEG_RENDER) === 1000,
  'G2-04', 'linear attempt 0 = 1000ms'
);

// G2-05: linear 지연 계산 (attempt 1)
assert(
  RetryManager.calculateDelay(1, RETRY_POLICIES.FFMPEG_RENDER) === 2000,
  'G2-05', 'linear attempt 1 = 2000ms'
);

// G2-06: 재시도 가능 에러 판별
assert(
  RetryManager.isRetryable({ message: 'ETIMEDOUT', code: 'ETIMEDOUT' }),
  'G2-06', 'ETIMEDOUT은 retryable'
);

// G2-07: 비재시도 에러 판별
assert(
  !RetryManager.isRetryable({ message: 'Invalid input' }),
  'G2-07', 'Invalid input은 non-retryable'
);

// G2-08: Validator 정책 — maxRetries 0 + rollbackTo BUILD
assert(
  RETRY_POLICIES.VALIDATOR_FAIL.maxRetries === 0 &&
  RETRY_POLICIES.VALIDATOR_FAIL.rollbackTo === STATES.BUILD,
  'G2-08', 'Validator: maxRetries=0, rollbackTo=BUILD'
);

// G2-08b: withRetry — 성공 케이스
(async () => {
  const result = await RetryManager.withRetry(
    async () => 'ok',
    RETRY_POLICIES.OPENAI_RUNWAY_NETWORK,
    { label: 'test-success' }
  );
  assert(result.success && result.result === 'ok' && result.attempts === 1, 'G2-08b', 'withRetry 성공 시 attempts=1');
})();

// G2-08c: withRetry — 즉시 실패 (no-retry 정책)
(async () => {
  const result = await RetryManager.withRetry(
    async () => { throw new Error('fail'); },
    RETRY_POLICIES.VALIDATOR_FAIL,
    { label: 'test-noretry' }
  );
  assert(!result.success && result.attempts === 1 && result.rollbackTo === STATES.BUILD, 'G2-08c', 'no-retry 정책 rollbackTo=BUILD');
})();

console.log('');

// ─── G3: Constants 완전성 (4 TC) ────────────────────────────
console.log('--- G3: Constants Integrity ---\n');

// G3-01: STATES enum 9개
assert(Object.keys(STATES).length === 9, 'G3-01', `STATES 9개 (got ${Object.keys(STATES).length})`);

// G3-02: TRANSITIONS의 모든 key가 STATES에 존재
const allTransKeysInStates = Object.keys(TRANSITIONS).every(k => Object.values(STATES).includes(k));
assert(allTransKeysInStates, 'G3-02', 'TRANSITIONS key ⊆ STATES');

// G3-03: TRANSITIONS의 모든 value가 STATES에 존재
const allTransValsInStates = Object.values(TRANSITIONS).flat().every(v => Object.values(STATES).includes(v));
assert(allTransValsInStates, 'G3-03', 'TRANSITIONS value ⊆ STATES');

// G3-04: ERROR_CODES 정의 10개+
assert(Object.keys(ERROR_CODES).length >= 10, 'G3-04', `ERROR_CODES ${Object.keys(ERROR_CODES).length}개`);

console.log('');

// ─── G4: Feature Flags (4 TC) ───────────────────────────────
console.log('--- G4: Feature Flags ---\n');

// featureFlags를 fresh하게 로드 (env 미설정 상태)
delete require.cache[require.resolve('../../config/featureFlags')];
// 환경변수 안 건드리고 로드
const ff = require('../../config/featureFlags');

// G4-01: video 섹션 존재
assert(ff.video !== undefined, 'G4-01', 'video 섹션 존재');

// G4-02: VIDEO_JOB_ORCHESTRATOR default OFF
assert(ff.video.VIDEO_JOB_ORCHESTRATOR === false, 'G4-02', 'VIDEO_JOB_ORCHESTRATOR default OFF');

// G4-03: VIDEO_KOREAN_SUBTITLE default OFF
assert(ff.video.VIDEO_KOREAN_SUBTITLE === false, 'G4-03', 'VIDEO_KOREAN_SUBTITLE default OFF');

// G4-04: isVideoEnabled helper
assert(typeof ff.isVideoEnabled === 'function', 'G4-04a', 'isVideoEnabled 함수 존재');
assert(ff.isVideoEnabled('VIDEO_JOB_ORCHESTRATOR') === false, 'G4-04b', 'isVideoEnabled(OFF) = false');

console.log('');

// ─── G5: VideoJobStore CRUD (8 TC) ──────────────────────────
console.log('--- G5: VideoJobStore CRUD ---\n');

(async () => {
  const store = new VideoJobStore();

  // G5-01: createJob
  const job = await store.createJob({
    request_id: 'test-001',
    job_type: 'hero8',
    topic: '여수 밤바다',
    hero_id: 'HERO1',
    mood: 'calm',
  });
  assert(job !== null && job.request_id === 'test-001', 'G5-01', 'createJob 성공');

  // G5-02: 초기 상태 QUEUED
  assert(job.status === STATES.QUEUED, 'G5-02', `초기 상태 QUEUED (got ${job.status})`);

  // G5-03: getJob
  const fetched = await store.getJob('test-001');
  assert(fetched !== null && fetched.request_id === 'test-001', 'G5-03', 'getJob 성공');

  // G5-04: updateState
  const updated = await store.updateState('test-001', STATES.BUILD);
  assert(updated.status === STATES.BUILD, 'G5-04', `updateState → BUILD (got ${updated.status})`);

  // G5-05: started_at 자동 설정
  assert(updated.started_at !== null, 'G5-05', 'BUILD 전이 시 started_at 설정');

  // G5-06: failJob
  const failedJob = await store.failJob('test-001', 'TEST_ERROR', '테스트 에러');
  assert(failedJob.status === STATES.FAILED && failedJob.error_code === 'TEST_ERROR', 'G5-06', 'failJob 성공');

  // G5-07: incrementRetry
  const job2 = await store.createJob({ request_id: 'test-002', topic: '테스트' });
  const retried = await store.incrementRetry('test-002');
  assert(retried.retry_count === 1, 'G5-07', `incrementRetry → 1 (got ${retried.retry_count})`);

  // G5-08: getJobsByStatus
  const failedJobs = await store.getJobsByStatus(STATES.FAILED);
  assert(failedJobs.length >= 1, 'G5-08', `getJobsByStatus(FAILED) >= 1 (got ${failedJobs.length})`);

  // G5-08b: 존재하지 않는 Job
  const notFound = await store.getJob('nonexistent');
  assert(notFound === null, 'G5-08b', 'nonexistent job → null');

  // ─── 최종 결과 ────────────────────────────────────────────
  // 비동기 테스트 완료 대기
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Phase 1 결과: ${passed} PASS / ${failed} FAIL (총 ${passed + failed})`);
  console.log('═══════════════════════════════════════════════════════');

  if (failures.length > 0) {
    console.log('\n  실패 항목:');
    failures.forEach(f => console.log(`    - ${f}`));
  }

  console.log(`\n  상태: ${failed === 0 ? '✅ ALL PASS' : '❌ SOME FAILED'}\n`);
  process.exit(failed === 0 ? 0 : 1);
})();
