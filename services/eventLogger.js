/**
 * eventLogger.js
 *
 * 마케팅 이벤트 로깅 유틸리티
 * - DB 우선 저장 (PostgreSQL marketing_events 테이블)
 * - DB 연결 실패 시 파일 폴백 (artifacts/events.ndjson)
 * - env 태깅으로 테스트/실사용 이벤트 분리
 *
 * 지원 이벤트:
 *   - trial_start, day3_inactive (체험)
 *   - checkout_initiate, checkout_abandon, checkout_complete (결제)
 *   - storybook_generated, story_viewed, share_created, share_opened (가치)
 *
 * env 태깅:
 *   - prod: 실서비스 이벤트 (기본값)
 *   - test: 테스트 이벤트
 *   - staging: 스테이징 환경
 *   - dev: 개발 환경
 *
 * Usage:
 *   const { logEvent, EVENT_TYPES, detectEnv } = require('./eventLogger');
 *   await logEvent(EVENT_TYPES.TRIAL_START, { user_id: '...' }, { env: 'prod' });
 *   // 또는 자동 감지
 *   const env = detectEnv(req, payload);
 *   await logEvent(EVENT_TYPES.TRIAL_START, { user_id: '...' }, { env });
 */

const fs = require('fs');
const path = require('path');

// ============ DB 모듈 (선택적 로딩) ============
let db = null;
try {
  db = require('../database/db');
} catch (error) {
  console.warn('⚠️ EventLogger: DB 모듈 로드 실패 - 파일 모드로 동작');
}

// ============ 설정 ============
const EVENTS_FILE = path.resolve(__dirname, '../artifacts/events.ndjson');

// ============ ENV 태깅 설정 ============
const VALID_ENVS = ['prod', 'staging', 'dev', 'test'];
const DEFAULT_ENV = 'prod';

// 테스트 감지 패턴
const TEST_PATTERNS = {
  // user_id가 "TEST-"로 시작
  userId: /^TEST-/i,
  // order_id/payment_id에 "TEST" 포함
  orderId: /TEST/i,
  // checkout_id에 "TEST" 포함
  checkoutId: /TEST/i
};

/**
 * 요청/페이로드에서 env 자동 감지
 * 우선순위: 헤더 > body.is_test > payload 패턴 > 기본값(prod)
 *
 * @param {Object} req - Express request 객체 (optional)
 * @param {Object} payload - 이벤트 페이로드
 * @returns {string} - 감지된 env ('prod' | 'test' | 'staging' | 'dev')
 */
function detectEnv(req, payload = {}) {
  // 1) 헤더 X-DM-ENV가 최우선
  if (req && req.headers) {
    const headerEnv = req.headers['x-dm-env'] || req.headers['X-DM-ENV'];
    if (headerEnv && VALID_ENVS.includes(headerEnv.toLowerCase())) {
      return headerEnv.toLowerCase();
    }
  }

  // 2) body/query에 is_test=true가 있으면 test
  if (req && req.body && req.body.is_test === true) {
    return 'test';
  }
  if (req && req.query && req.query.is_test === 'true') {
    return 'test';
  }
  if (payload.is_test === true) {
    return 'test';
  }

  // 3) payload의 env가 명시적으로 있으면 사용
  if (payload.env && VALID_ENVS.includes(payload.env)) {
    return payload.env;
  }

  // 4) 패턴 기반 테스트 감지
  if (payload.user_id && TEST_PATTERNS.userId.test(payload.user_id)) {
    return 'test';
  }
  if (payload.order_id && TEST_PATTERNS.orderId.test(payload.order_id)) {
    return 'test';
  }
  if (payload.payment_id && TEST_PATTERNS.orderId.test(payload.payment_id)) {
    return 'test';
  }
  if (payload.checkout_id && TEST_PATTERNS.checkoutId.test(payload.checkout_id)) {
    return 'test';
  }

  // 5) 기본값
  return DEFAULT_ENV;
}

/**
 * 페이로드에 env 메타데이터 추가
 * @param {Object} payload - 원본 페이로드
 * @param {string} env - 환경 ('prod' | 'test' | ...)
 * @param {string} testReason - 테스트 이유 (선택)
 * @returns {Object} - env가 추가된 페이로드
 */
function addEnvToPayload(payload, env, testReason = null) {
  const result = {
    ...payload,
    env: env
  };

  if (env === 'test') {
    result.is_test = true;
    if (testReason) {
      result.test_reason = testReason;
    }
  }

  return result;
}

// ============ 중복 방지 규칙 ============
// 각 이벤트 타입별 idempotent key 정의
const IDEMPOTENT_RULES = {
  // storybook_generated: story_id당 1회 (전체 기간)
  storybook_generated: {
    keyFields: ['story_id'],
    scope: 'all'  // 전체 기간
  },
  // story_viewed: story_id+user_id+date 기준 1회
  story_viewed: {
    keyFields: ['story_id', 'user_id'],
    scope: 'daily'
  },
  // share_opened: share_token+viewer_fingerprint+date 기준 1회
  share_opened: {
    keyFields: ['share_token', 'viewer_fingerprint'],
    scope: 'daily'
  }
};

// ============ 이벤트 타입 정의 ============
const EVENT_TYPES = {
  // 체험 이벤트
  TRIAL_START: 'trial_start',             // 무료 체험 시작
  DAY3_INACTIVE: 'day3_inactive',         // 3일째 비활성 사용자

  // 결제 이벤트
  CHECKOUT_INITIATE: 'checkout_initiate', // 체크아웃 시작
  CHECKOUT_ABANDON: 'checkout_abandon',   // 체크아웃 이탈
  CHECKOUT_COMPLETE: 'checkout_complete', // 체크아웃 완료 (결제 성공)

  // 가치 이벤트
  STORYBOOK_GENERATED: 'storybook_generated', // 스토리북 생성 완료
  STORY_VIEWED: 'story_viewed',               // 스토리 조회
  SHARE_CREATED: 'share_created',             // 공유 링크 생성
  SHARE_OPENED: 'share_opened'                // 공유 링크 열람
};

// 유효 이벤트 타입 목록
const VALID_EVENT_TYPES = Object.values(EVENT_TYPES);

// ============ 유틸리티 ============

/**
 * 이벤트 파일 디렉토리 확인/생성
 */
function ensureDirectory() {
  const dir = path.dirname(EVENTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * DB에서 중복 이벤트 확인
 * @param {string} eventType - 이벤트 타입
 * @param {Object} payload - 이벤트 페이로드
 * @returns {boolean} - 중복 여부 (true=중복 있음)
 */
async function checkDuplicateInDB(eventType, payload) {
  if (!db) return false;

  const rule = IDEMPOTENT_RULES[eventType];
  if (!rule) return false;  // 규칙 없으면 중복 체크 안함

  // 쿼리 조건 빌드
  let query = `SELECT id FROM marketing_events WHERE event_type = $1`;
  const values = [eventType];
  let paramIndex = 2;

  // keyFields 조건 추가
  for (const field of rule.keyFields) {
    const value = payload[field];
    if (value !== undefined && value !== null) {
      query += ` AND payload->>'${field}' = $${paramIndex++}`;
      values.push(String(value));
    }
  }

  // scope에 따른 날짜 조건
  if (rule.scope === 'daily') {
    query += ` AND event_date = CURRENT_DATE`;
  }

  query += ` LIMIT 1`;

  const result = await db.query(query, values);
  return result.rows.length > 0;
}

/**
 * DB에 이벤트 저장
 */
async function logEventToDB(eventType, payload, options) {
  if (!db) return null;

  const query = `
    INSERT INTO marketing_events (event_type, event_date, user_id, wish_id, phone, payload, source)
    VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6)
    RETURNING id, event_type, event_date, timestamp
  `;

  const values = [
    eventType,
    payload.user_id || null,
    payload.wish_id || null,
    payload.phone || null,
    JSON.stringify(payload),
    options.source || 'system'
  ];

  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * 파일에 이벤트 저장 (폴백)
 */
function logEventToFile(eventType, payload, options) {
  ensureDirectory();

  const event = {
    event: eventType,
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().slice(0, 10),
    ...payload,
    _meta: {
      version: '1.0',
      source: options.source || 'system'
    }
  };

  const line = JSON.stringify(event) + '\n';
  fs.appendFileSync(EVENTS_FILE, line, 'utf-8');
  return event;
}

/**
 * 이벤트 로깅 (DB 우선, 파일 폴백)
 * @param {string} eventType - 이벤트 타입 (EVENT_TYPES 중 하나)
 * @param {Object} payload - 이벤트 데이터
 * @param {Object} options - 추가 옵션 { source, skipDedup, env, testReason, req }
 * @returns {Object} - 저장된 이벤트 객체 또는 null (중복인 경우)
 */
async function logEvent(eventType, payload = {}, options = {}) {
  // 이벤트 타입 검증
  if (!VALID_EVENT_TYPES.includes(eventType)) {
    throw new Error(`Invalid event type: ${eventType}. Valid types: ${VALID_EVENT_TYPES.join(', ')}`);
  }

  // env 결정: options.env > detectEnv(req, payload) > DEFAULT_ENV
  let env = options.env;
  if (!env || !VALID_ENVS.includes(env)) {
    env = detectEnv(options.req || null, payload);
  }

  // payload에 env 추가
  const enrichedPayload = addEnvToPayload(payload, env, options.testReason);

  // 로그에 env 표시
  const envTag = env === 'prod' ? '' : ` [${env.toUpperCase()}]`;

  try {
    // DB 저장 시도
    if (db) {
      // 중복 체크 (skipDedup 옵션이 없으면 자동 체크)
      if (!options.skipDedup && IDEMPOTENT_RULES[eventType]) {
        const isDuplicate = await checkDuplicateInDB(eventType, enrichedPayload);
        if (isDuplicate) {
          console.log(`⏭️ 이벤트 중복 스킵 [DB]: ${eventType}${envTag}`);
          return { event: eventType, _meta: { skipped: true, reason: 'duplicate', env } };
        }
      }

      const dbResult = await logEventToDB(eventType, enrichedPayload, options);
      if (dbResult) {
        console.log(`📝 이벤트 기록 [DB]: ${eventType}${envTag} (id: ${dbResult.id})`);
        return {
          event: eventType,
          timestamp: dbResult.timestamp,
          date: dbResult.event_date,
          ...enrichedPayload,
          _meta: { source: options.source || 'system', storage: 'db', id: dbResult.id, env }
        };
      }
    }
  } catch (err) {
    console.warn(`⚠️ DB 저장 실패, 파일로 폴백: ${err.message}`);
  }

  // 파일 폴백
  try {
    const fileResult = logEventToFile(eventType, enrichedPayload, options);
    console.log(`📝 이벤트 기록 [File]: ${eventType}${envTag}`);
    return fileResult;
  } catch (err) {
    console.error(`❌ 이벤트 기록 실패: ${err.message}`);
    throw err;
  }
}

/**
 * DB에서 이벤트 읽기
 */
async function readEventsFromDB(filter = {}) {
  if (!db) return null;

  let query = 'SELECT * FROM marketing_events WHERE 1=1';
  const values = [];
  let paramIndex = 1;

  if (filter.event) {
    query += ` AND event_type = $${paramIndex++}`;
    values.push(filter.event);
  }
  if (filter.date) {
    query += ` AND event_date = $${paramIndex++}`;
    values.push(filter.date);
  }
  if (filter.dateFrom) {
    query += ` AND event_date >= $${paramIndex++}`;
    values.push(filter.dateFrom);
  }
  if (filter.dateTo) {
    query += ` AND event_date <= $${paramIndex++}`;
    values.push(filter.dateTo);
  }

  query += ' ORDER BY created_at DESC';

  const result = await db.query(query, values);
  return result.rows.map(row => ({
    event: row.event_type,
    timestamp: row.timestamp,
    date: row.event_date.toISOString().slice(0, 10),
    user_id: row.user_id,
    wish_id: row.wish_id,
    phone: row.phone,
    ...row.payload,
    _meta: { source: row.source, storage: 'db', id: row.id }
  }));
}

/**
 * 파일에서 이벤트 읽기
 */
function readEventsFromFile(filter = {}) {
  if (!fs.existsSync(EVENTS_FILE)) {
    return [];
  }

  const content = fs.readFileSync(EVENTS_FILE, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);

  let events = lines.map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);

  // 필터 적용
  if (filter.event) {
    events = events.filter(e => e.event === filter.event);
  }
  if (filter.date) {
    events = events.filter(e => e.date === filter.date);
  }
  if (filter.dateFrom) {
    events = events.filter(e => e.date >= filter.dateFrom);
  }
  if (filter.dateTo) {
    events = events.filter(e => e.date <= filter.dateTo);
  }

  return events;
}

/**
 * 이벤트 읽기 (DB 우선, 파일 폴백)
 * @param {Object} filter - 필터 조건 { event, date, dateFrom, dateTo }
 * @returns {Array} - 이벤트 배열
 */
async function readEvents(filter = {}) {
  try {
    if (db) {
      const dbEvents = await readEventsFromDB(filter);
      if (dbEvents && dbEvents.length > 0) {
        return dbEvents;
      }
    }
  } catch (err) {
    console.warn(`⚠️ DB 읽기 실패, 파일로 폴백: ${err.message}`);
  }

  return readEventsFromFile(filter);
}

/**
 * DB에서 일별 통계 조회
 */
async function getDailyStatsFromDB(date) {
  if (!db) return null;

  const query = `
    SELECT event_type, COUNT(*) as count
    FROM marketing_events
    WHERE event_date = $1
    GROUP BY event_type
  `;

  const result = await db.query(query, [date]);

  const counts = {};
  for (const type of VALID_EVENT_TYPES) {
    counts[type] = 0;
  }

  let total = 0;
  for (const row of result.rows) {
    counts[row.event_type] = parseInt(row.count, 10);
    total += parseInt(row.count, 10);
  }

  return { date, counts, total };
}

/**
 * 일별 이벤트 카운트 집계
 * @param {string} date - 날짜 (YYYY-MM-DD)
 * @returns {Object} - { date, counts: { trial_start: N, ... }, total }
 */
async function getDailyStats(date) {
  try {
    if (db) {
      const dbStats = await getDailyStatsFromDB(date);
      if (dbStats) return dbStats;
    }
  } catch (err) {
    console.warn(`⚠️ DB 통계 조회 실패: ${err.message}`);
  }

  // 파일 폴백
  const events = readEventsFromFile({ date });
  const counts = {};
  for (const type of VALID_EVENT_TYPES) {
    counts[type] = events.filter(e => e.event === type).length;
  }
  return { date, counts, total: events.length };
}

/**
 * DB에서 기간별 통계 조회
 */
async function getRangeStatsFromDB(dateFrom, dateTo) {
  if (!db) return null;

  const query = `
    SELECT event_date, event_type, COUNT(*) as count
    FROM marketing_events
    WHERE event_date >= $1 AND event_date <= $2
    GROUP BY event_date, event_type
    ORDER BY event_date DESC
  `;

  const result = await db.query(query, [dateFrom, dateTo]);

  const byDate = {};
  const totals = {};

  for (const type of VALID_EVENT_TYPES) {
    totals[type] = 0;
  }

  let totalEvents = 0;

  for (const row of result.rows) {
    const dateStr = row.event_date.toISOString().slice(0, 10);
    if (!byDate[dateStr]) {
      byDate[dateStr] = {};
      for (const type of VALID_EVENT_TYPES) {
        byDate[dateStr][type] = 0;
      }
    }
    const count = parseInt(row.count, 10);
    byDate[dateStr][row.event_type] = count;
    totals[row.event_type] += count;
    totalEvents += count;
  }

  return { dateFrom, dateTo, byDate, totals, totalEvents };
}

/**
 * 기간별 이벤트 집계
 * @param {string} dateFrom - 시작일 (YYYY-MM-DD)
 * @param {string} dateTo - 종료일 (YYYY-MM-DD)
 * @returns {Object} - { dateFrom, dateTo, byDate: { ... }, totals: { ... } }
 */
async function getRangeStats(dateFrom, dateTo) {
  try {
    if (db) {
      const dbStats = await getRangeStatsFromDB(dateFrom, dateTo);
      if (dbStats) return dbStats;
    }
  } catch (err) {
    console.warn(`⚠️ DB 기간 통계 조회 실패: ${err.message}`);
  }

  // 파일 폴백
  const events = readEventsFromFile({ dateFrom, dateTo });
  const byDate = {};
  const totals = {};

  for (const type of VALID_EVENT_TYPES) {
    totals[type] = 0;
  }

  for (const e of events) {
    if (!byDate[e.date]) {
      byDate[e.date] = {};
      for (const type of VALID_EVENT_TYPES) {
        byDate[e.date][type] = 0;
      }
    }
    byDate[e.date][e.event]++;
    totals[e.event]++;
  }

  return { dateFrom, dateTo, byDate, totals, totalEvents: events.length };
}

// ============ 모듈 내보내기 ============
module.exports = {
  EVENT_TYPES,
  VALID_EVENT_TYPES,
  VALID_ENVS,
  DEFAULT_ENV,
  logEvent,
  readEvents,
  getDailyStats,
  getRangeStats,
  detectEnv,
  addEnvToPayload,
  EVENTS_FILE
};
