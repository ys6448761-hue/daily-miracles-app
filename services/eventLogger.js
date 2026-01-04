/**
 * eventLogger.js
 *
 * 마케팅 이벤트 로깅 유틸리티
 * - NDJSON 형식으로 artifacts/events.ndjson에 기록
 * - 지원 이벤트: trial_start, day3_inactive, checkout_abandon
 *
 * Usage:
 *   const { logEvent, EVENT_TYPES } = require('./eventLogger');
 *   await logEvent(EVENT_TYPES.TRIAL_START, { user_id: '...', phone: '...' });
 */

const fs = require('fs');
const path = require('path');

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
 * 이벤트 로깅
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

  // 디렉토리 확인
  ensureDirectory();

  // 이벤트 객체 생성
  const event = {
    event: eventType,
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    ...payload,
    _meta: {
      version: '1.0',
      source: options.source || 'system'
    }
  };

  // NDJSON 형식으로 추가
  const line = JSON.stringify(event) + '\n';

  try {
    fs.appendFileSync(EVENTS_FILE, line, 'utf-8');
    console.log(`📝 이벤트 기록: ${eventType}`);
    return event;
  } catch (err) {
    console.error(`❌ 이벤트 기록 실패: ${err.message}`);
    throw err;
  }
}

/**
 * 이벤트 읽기 (스트림 방식)
 * @param {Object} filter - 필터 조건 { event, date, dateFrom, dateTo }
 * @returns {Array} - 이벤트 배열
 */
function readEvents(filter = {}) {
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
 * 일별 이벤트 카운트 집계
 * @param {string} date - 날짜 (YYYY-MM-DD)
 * @returns {Object} - { date, counts: { trial_start: N, ... }, total }
 */
function getDailyStats(date) {
  const events = readEvents({ date });

  const counts = {};
  for (const type of VALID_EVENT_TYPES) {
    counts[type] = events.filter(e => e.event === type).length;
  }

  return {
    date,
    counts,
    total: events.length
  };
}

/**
 * 기간별 이벤트 집계
 * @param {string} dateFrom - 시작일 (YYYY-MM-DD)
 * @param {string} dateTo - 종료일 (YYYY-MM-DD)
 * @returns {Object} - { dateFrom, dateTo, byDate: { ... }, totals: { ... } }
 */
function getRangeStats(dateFrom, dateTo) {
  const events = readEvents({ dateFrom, dateTo });

  // 날짜별 집계
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

  return {
    dateFrom,
    dateTo,
    byDate,
    totals,
    totalEvents: events.length
  };
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
