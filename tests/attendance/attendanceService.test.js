/**
 * attendanceService.test.js
 * DB-less 유닛 테스트 — DB mock으로 실행 가능
 *
 * Done 조건:
 *   [1] 같은 날 10번 새로고침 → duplicate:true
 *   [2] 다음날 접속 → streak+1
 *   [3] 서버 재시작 → streak 유지 (DB SSOT)
 *   [4] pay_success → temperature만 증가
 *   [5] streak 3/7/14 보너스 체온 적용
 *   [6] 이틀+ 공백 → streak 리셋
 *   [7] userId 없으면 에러
 */

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.error(`  ❌ ${name}`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────
// DB Mock
// ─────────────────────────────────────────────────────
const mockRows = new Map(); // temperature_state
const mockEvents = [];      // attendance_events
const openIndex = new Set(); // uniq_daily_open 시뮬레이션

const mockDb = {
  query: async (text, params) => {
    // INSERT attendance_events
    if (text.includes('INSERT INTO attendance_events')) {
      const [userId, eventType, eventDate, page] = params;
      const key = `${userId}:${eventDate}`;

      if (eventType === 'open' && openIndex.has(key)) {
        const err = new Error('duplicate key');
        err.code = '23505';
        throw err;
      }

      if (eventType === 'open') {
        openIndex.add(key);
      }

      mockEvents.push({ userId, eventType, eventDate, page });
      return { rowCount: 1 };
    }

    // SELECT temperature_state
    if (text.includes('SELECT') && text.includes('temperature_state')) {
      const userId = params[0];
      const row = mockRows.get(userId);
      if (row) {
        return { rowCount: 1, rows: [{ ...row }] };
      }
      return { rowCount: 0, rows: [] };
    }

    // INSERT ... ON CONFLICT temperature_state (open용)
    if (text.includes('INSERT INTO temperature_state') && text.includes('last_open_date')) {
      const [userId, temperature, streak, lastOpenDate] = params;
      mockRows.set(userId, {
        temperature: Number(temperature),
        streak,
        last_open_date: lastOpenDate ? new Date(lastOpenDate) : null,
      });
      return { rowCount: 1 };
    }

    // INSERT ... ON CONFLICT temperature_state (pay_success용)
    if (text.includes('INSERT INTO temperature_state') && text.includes('temperature_state.temperature')) {
      const [userId, defaultTemp, bonus] = params;
      const existing = mockRows.get(userId);
      if (existing) {
        existing.temperature = Number(existing.temperature) + Number(bonus);
        mockRows.set(userId, existing);
      } else {
        mockRows.set(userId, {
          temperature: Number(defaultTemp),
          streak: 0,
          last_open_date: null,
        });
      }
      return { rowCount: 1 };
    }

    return { rowCount: 0, rows: [] };
  }
};

// DB mock 주입: require.cache에 실제 resolved path로 등록
const path = require('path');
const dbPath = path.resolve(__dirname, '../../database/db.js');
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: mockDb,
};

const attendanceService = require('../../services/attendanceService');

// ─────────────────────────────────────────────────────
// 헬퍼: 날짜 mock
// ─────────────────────────────────────────────────────
let mockNow = null;
const _origDateNow = Date.now;
const _OrigDate = Date;

function setMockDate(isoDate) {
  mockNow = new Date(isoDate + 'T09:00:00Z').getTime();
  // Date.now() override
  Date.now = () => mockNow;
  // new Date() override
  global.Date = class extends _OrigDate {
    constructor(...args) {
      if (args.length === 0) {
        super(mockNow);
      } else {
        super(...args);
      }
    }
    static now() { return mockNow; }
  };
  // toISOString 유지
  global.Date.prototype = _OrigDate.prototype;
}

function resetDate() {
  Date.now = _origDateNow;
  global.Date = _OrigDate;
  mockNow = null;
}

function resetMockState() {
  mockRows.clear();
  mockEvents.length = 0;
  openIndex.clear();
}

// ═══════════════════════════════════════════════════════════
console.log('\n═══ attendanceService 테스트 ═══\n');

// ─── 1. 첫 출석 → streak=1, temperature=36.55 ─────
console.log('1. 첫 출석 (open)');
(async () => {
  resetMockState();
  setMockDate('2026-02-14');

  const res = await attendanceService.ping('user-A', 'open', 'home');
  assert(res.ok === true, 'ok === true');
  assert(res.streak === 1, `streak === 1 (got ${res.streak})`);
  // 첫 방문: 기본 36.5 (base +0.05 없음 — CEO 원안 참조)
  assert(res.temperature === 36.5, `temperature === 36.5 (got ${res.temperature})`);

  resetDate();
})()

// ─── 2. 같은 날 중복 → duplicate:true ─────
.then(async () => {
  console.log('\n2. 같은 날 중복 출석');
  setMockDate('2026-02-14');

  const res = await attendanceService.ping('user-A', 'open', 'home');
  assert(res.ok === true, 'ok === true');
  assert(res.duplicate === true, `duplicate === true`);

  resetDate();
})

// ─── 3. 다음날 연속 → streak=2 ─────
.then(async () => {
  console.log('\n3. 다음날 연속 출석 → streak+1');
  setMockDate('2026-02-15');

  const res = await attendanceService.ping('user-A', 'open', 'home');
  assert(res.ok === true, 'ok === true');
  assert(res.streak === 2, `streak === 2 (got ${res.streak})`);
  // day1=36.5 → day2=36.5+0.05=36.55
  assert(res.temperature === 36.55, `temperature === 36.55 (got ${res.temperature})`);

  resetDate();
})

// ─── 4. 3일차 연속 → streak 보너스 +0.05 ─────
.then(async () => {
  console.log('\n4. 3일차 연속 → streak 3 보너스');
  setMockDate('2026-02-16');

  const res = await attendanceService.ping('user-A', 'open', 'home');
  assert(res.ok === true, 'ok === true');
  assert(res.streak === 3, `streak === 3 (got ${res.streak})`);
  // 36.55 + 0.05(base) + 0.05(bonus) = 36.65
  assert(res.temperature === 36.65, `temperature === 36.65 (got ${res.temperature})`);

  resetDate();
})

// ─── 5. pay_success → temperature만 +0.10 ─────
.then(async () => {
  console.log('\n5. pay_success → temperature +0.10');
  setMockDate('2026-02-16');

  const before = (await attendanceService.getState('user-A')).temperature;
  const res = await attendanceService.ping('user-A', 'pay_success', null);
  assert(res.ok === true, 'ok === true');
  assert(res.temperature === +(before + 0.10).toFixed(2), `temperature += 0.10 (${before} → ${res.temperature})`);

  resetDate();
})

// ─── 6. 이틀 공백 → streak 리셋 ─────
.then(async () => {
  console.log('\n6. 이틀 공백 → streak 리셋');
  setMockDate('2026-02-19'); // 16일 이후 3일 공백

  const res = await attendanceService.ping('user-A', 'open', 'home');
  assert(res.ok === true, 'ok === true');
  assert(res.streak === 1, `streak === 1 리셋 (got ${res.streak})`);

  resetDate();
})

// ─── 7. 새 유저 pay_success (open 없이) ─────
.then(async () => {
  console.log('\n7. 새 유저 pay_success (첫 이벤트)');
  resetMockState();
  setMockDate('2026-02-14');

  const res = await attendanceService.ping('user-B', 'pay_success', null);
  assert(res.ok === true, 'ok === true');
  assert(res.temperature === 36.6, `temperature === 36.6 (got ${res.temperature})`);
  assert(res.streak === 0, `streak === 0 (got ${res.streak})`);

  resetDate();
})

// ─── 8. 7일 연속 보너스 ─────
.then(async () => {
  console.log('\n8. 7일 연속 → streak 7 보너스 +0.10');
  resetMockState();

  // 7일 연속 출석
  for (let d = 1; d <= 7; d++) {
    setMockDate(`2026-03-${String(d).padStart(2, '0')}`);
    const res = await attendanceService.ping('user-C', 'open', 'home');

    if (d === 7) {
      assert(res.streak === 7, `streak === 7 (got ${res.streak})`);
      // day1=36.5, day2~6: +0.05*5=0.25, day3 bonus=+0.05
      // day7: +0.05(base)+0.10(bonus)
      // 36.5 + 0.25 + 0.05 + 0.05 + 0.10 = 36.95
      assert(res.temperature === 36.95, `temperature === 36.95 (got ${res.temperature})`);
    }
  }

  resetDate();
})

// ─── 9. 14일 연속 보너스 ─────
.then(async () => {
  console.log('\n9. 14일 연속 → streak 14 보너스 +0.20');
  resetMockState();

  let lastRes;
  for (let d = 1; d <= 14; d++) {
    setMockDate(`2026-03-${String(d).padStart(2, '0')}`);
    lastRes = await attendanceService.ping('user-D', 'open', 'home');
  }

  assert(lastRes.streak === 14, `streak === 14 (got ${lastRes.streak})`);
  // day1=36.5(base), day2~14: +0.05*13=0.65
  // day3 bonus=+0.05, day7 bonus=+0.10, day14 bonus=+0.20
  // 36.5 + 0.65 + 0.05 + 0.10 + 0.20 = 37.50
  assert(lastRes.temperature === 37.5, `temperature === 37.50 (got ${lastRes.temperature})`);

  resetDate();
})

// ─── 10. 같은 날 10번 새로고침 → 모두 duplicate ─────
.then(async () => {
  console.log('\n10. 같은 날 10번 새로고침');
  resetMockState();
  setMockDate('2026-02-14');

  // 첫 번째는 정상
  const first = await attendanceService.ping('user-E', 'open', 'home');
  assert(first.ok === true && !first.duplicate, '첫 번째 정상');

  let allDuplicate = true;
  for (let i = 0; i < 9; i++) {
    const res = await attendanceService.ping('user-E', 'open', 'home');
    if (!res.duplicate) allDuplicate = false;
  }
  assert(allDuplicate, '나머지 9번 모두 duplicate === true');

  resetDate();
})

// ─── 결과 출력 ─────
.then(() => {
  console.log('\n═══════════════════════════════════════');
  console.log(`  총 ${passed + failed}개 | ✅ ${passed} PASS | ❌ ${failed} FAIL`);
  console.log('═══════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
})
.catch(err => {
  console.error('\n💀 테스트 실행 오류:', err);
  process.exit(1);
});
