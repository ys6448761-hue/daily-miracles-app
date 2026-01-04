/**
 * eventLogger.js
 *
 * 마케팅 이벤트 로깅 유틸리티
 * - DB 우선 저장 (PostgreSQL marketing_events 테이블)
 * - DB 연결 실패 시 파일 폴백 (artifacts/events.ndjson)
 * - 지원 이벤트: trial_start, day3_inactive, checkout_abandon
 *
 * Usage:
 *   const { logEvent, EVENT_TYPES } = require('./eventLogger');
 *   await logEvent(EVENT_TYPES.TRIAL_START, { user_id: '...', phone: '...' });
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

// ============ 이벤트 타입 정의 ============
const EVENT_TYPES = {
  TRIAL_START: 'trial_start',           // 무료 체험 시작
  DAY3_INACTIVE: 'day3_inactive',       // 3일째 비활성 사용자
  CHECKOUT_ABANDON: 'checkout_abandon'  // 결제 이탈
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
 * @param {Object} options - 추가 옵션
 * @returns {Object} - 저장된 이벤트 객체
 */
async function logEvent(eventType, payload = {}, options = {}) {
  // 이벤트 타입 검증
  if (!VALID_EVENT_TYPES.includes(eventType)) {
    throw new Error(`Invalid event type: ${eventType}. Valid types: ${VALID_EVENT_TYPES.join(', ')}`);
  }

  try {
    // DB 저장 시도
    if (db) {
      const dbResult = await logEventToDB(eventType, payload, options);
      if (dbResult) {
        console.log(`📝 이벤트 기록 [DB]: ${eventType} (id: ${dbResult.id})`);
        return {
          event: eventType,
          timestamp: dbResult.timestamp,
          date: dbResult.event_date,
          ...payload,
          _meta: { source: options.source || 'system', storage: 'db', id: dbResult.id }
        };
      }
    }
  } catch (err) {
    console.warn(`⚠️ DB 저장 실패, 파일로 폴백: ${err.message}`);
  }

  // 파일 폴백
  try {
    const fileResult = logEventToFile(eventType, payload, options);
    console.log(`📝 이벤트 기록 [File]: ${eventType}`);
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
  logEvent,
  readEvents,
  getDailyStats,
  getRangeStats,
  EVENTS_FILE
};
