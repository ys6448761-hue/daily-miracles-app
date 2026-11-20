'use strict';
/**
 * PHX-MUYEOJEONG-FOOD §79 — 머먹지 식당 시간 판단 (순수 함수, DB·네트워크 없음).
 *
 * 규칙 (Founder §78·§79):
 *  - 요일별 영업시간 (opening_hours_json) 으로 방문 시각 영업 여부 판단
 *  - 정기휴무 (closed_day, 요일 스케줄 closed) 제외
 *  - 브레이크타임 중 추천 제외
 *  - 추천 마감 = 라스트오더 − 30분. 확인된 이동시간이 30분 이상이면 그 이동시간만큼 추가 앞당김
 *  - 자정 이후 영업 및 전날 영업 (전날 스케줄이 자정을 넘김) 처리
 *  - 영업시간·라스트오더가 확인되지 않으면 시간 기준 추천에서 제외 (확정 안내 금지)
 *  - 같은 group_code 는 추천 결과에 1건만 (중복 추천 방지)
 *
 * visit 형식: { time: 'HH:MM', day: 'mon'|'tue'|...|'sun', travel_min?: number }
 *   travel_min 이 없으면 이동시간 미확인 → 조정하지 않는다 (확정하지 않음).
 */

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const KO_DAY_CHAR = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일' };
const LO_BUFFER_MIN = 30;
const DAY_MIN = 24 * 60;

const REASON = {
  INVALID_TIME: 'INVALID_TIME',
  CLOSED_DAY: 'CLOSED_DAY',
  HOURS_UNKNOWN: 'HOURS_UNKNOWN',
  OUT_OF_HOURS: 'OUT_OF_HOURS',
  BREAK_TIME: 'BREAK_TIME',
  LAST_ORDER_UNKNOWN: 'LAST_ORDER_UNKNOWN',
  AFTER_LAST_ORDER_CUTOFF: 'AFTER_LAST_ORDER_CUTOFF',
};

function toMin(hhmm) {
  if (typeof hhmm !== 'string' || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

function normalizeVisit(visit) {
  if (!visit || typeof visit !== 'object') return null;
  const t = toMin(visit.time);
  if (t === null || !DAY_KEYS.includes(visit.day)) return null;
  const travel = Number.isFinite(visit.travel_min) && visit.travel_min >= 0 ? visit.travel_min : null;
  return { t, day: visit.day, travel };
}

function prevDayKey(day) {
  const i = DAY_KEYS.indexOf(day);
  return DAY_KEYS[(i + DAY_KEYS.length - 1) % DAY_KEYS.length];
}

function isClosedDay(rec, day) {
  const cd = typeof rec.closed_day === 'string' ? rec.closed_day : '';
  return cd.length > 0 && cd.includes(KO_DAY_CHAR[day]);
}

function scheduleFor(rec, day) {
  const hours = rec.opening_hours_json;
  if (!hours || typeof hours !== 'object') return null;
  const s = hours[day];
  return s && typeof s === 'object' ? s : null;
}

/**
 * 방문 시각의 영업 상태를 판단한다.
 * @returns {{ok: boolean, reason?: string, governing?: 'today'|'prev', note?: string[]}}
 */
function statusAt(rec, visitInput) {
  const v = normalizeVisit(visitInput);
  if (!v) return { ok: false, reason: REASON.INVALID_TIME };
  if (isClosedDay(rec, v.day)) return { ok: false, reason: REASON.CLOSED_DAY };

  const today = scheduleFor(rec, v.day);
  if (today && today.closed === true) return { ok: false, reason: REASON.CLOSED_DAY };

  // 전날 영업이 자정을 넘겨 지금 열려 있는지 먼저 확인
  const prevKey = prevDayKey(v.day);
  const prev = scheduleFor(rec, prevKey);
  const prevOpen = toMin(prev && prev.open), prevClose = toMin(prev && prev.close);
  const prevCrosses = prevOpen !== null && prevClose !== null && prevClose <= prevOpen;
  if (prevCrosses && v.t < prevClose && !isClosedDay(rec, prevKey)) {
    return finalizeWithSchedule(prev, v, 'prev', v.t, v.t + DAY_MIN, prevOpen);
  }

  if (!today) return { ok: false, reason: REASON.HOURS_UNKNOWN };
  const open = toMin(today.open), close = toMin(today.close);
  if (open === null || close === null) return { ok: false, reason: REASON.HOURS_UNKNOWN };

  const crosses = close <= open;
  const isOpenNow = crosses ? v.t >= open : (v.t >= open && v.t < close);
  if (!isOpenNow) return { ok: false, reason: REASON.OUT_OF_HOURS };
  return finalizeWithSchedule(today, v, 'today', v.t, v.t, open);
}

// tRaw: 방문 시각 (해당 요일 시계 기준, 브레이크 비교용). tAbs: 영업 시작 기준 연속 시각 (마감 비교용).
function finalizeWithSchedule(sched, v, governing, tRaw, tAbs, openAbs) {
  // 브레이크타임 (해당 스케줄 요일의 시계 기준)
  if (Array.isArray(sched.break) && sched.break.length === 2) {
    const bs = toMin(sched.break[0]), be = toMin(sched.break[1]);
    if (bs !== null && be !== null && tRaw >= bs && tRaw < be) {
      return { ok: false, reason: REASON.BREAK_TIME };
    }
  }

  const lo = toMin(sched.last_order);
  if (lo === null) return { ok: false, reason: REASON.LAST_ORDER_UNKNOWN };

  // 라스트오더가 자정 이후면 영업 시작 기준으로 날짜를 이어 붙인다
  const loAbs = lo < openAbs ? lo + DAY_MIN : lo;
  const travelAdj = v.travel !== null && v.travel >= LO_BUFFER_MIN ? v.travel : 0;
  const cutoff = loAbs - LO_BUFFER_MIN - travelAdj;
  const notes = [];
  if (v.travel === null) notes.push('TRAVEL_UNKNOWN');
  if (tAbs >= cutoff) return { ok: false, reason: REASON.AFTER_LAST_ORDER_CUTOFF, governing, note: notes };
  return { ok: true, governing, note: notes };
}

/**
 * 행 목록에 시간 게이트를 적용한다. visit 이 없으면 입력을 그대로 돌려준다 (기존 동작 보존).
 * @returns {{kept: object[], excluded: {code: string, reason: string}[]}}
 */
function applyRestaurantTimeGate(rows, visit) {
  const list = Array.isArray(rows) ? rows : [];
  if (!visit) return { kept: list, excluded: [] };
  const kept = [];
  const excluded = [];
  for (const rec of list) {
    const s = statusAt(rec, visit);
    if (s.ok) kept.push(rec);
    else excluded.push({ code: rec.code, reason: s.reason });
  }
  return { kept: dedupeByGroup(kept), excluded };
}

/** 같은 group_code (없으면 code) 는 첫 번째 행만 남긴다. 입력 순서 유지. */
function dedupeByGroup(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const key = r.group_code || r.code;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

/**
 * 네이버 장소 상세 URL 에서 Place ID 를 얻는다. 검색 URL 과 다른 형식은 null.
 * @returns {{placeId: string, url: string} | null}
 */
function naverDetailFromUrl(url) {
  if (typeof url !== 'string') return null;
  const m = url.match(/^https:\/\/map\.naver\.com\/p\/entry\/place\/(\d{5,})(?:[/?#].*)?$/);
  if (!m) return null;
  return { placeId: m[1], url: `https://map.naver.com/p/entry/place/${m[1]}` };
}

/**
 * 혜택을 고객에게 보여도 되는지. 허용 목록 등재 + 고객 공개 승인 + HOLD 아님 모두 충족해야 한다.
 * (허용 목록은 travelGuideService.CONFIRMED_BENEFIT_PARTNERS 와 같은 의미의 입력으로 받는다.)
 */
function benefitVisibleToCustomer(rec, benefit, allowlist) {
  if (!benefit || !Array.isArray(allowlist)) return false;
  if (benefit.hold === true) return false;
  if (benefit.customer_public !== true) return false;
  return allowlist.includes(rec.name);
}

/**
 * 메뉴 중 일행 수에 맞는 본 메뉴만 돌려준다 (추가 메뉴 제외).
 * min_party 가 있는 메뉴는 일행 수를 모르면 제외 (확정하지 않음). 한정 메뉴는 limited_stock 표시.
 */
function menuForParty(menu, partySize) {
  if (!Array.isArray(menu)) return [];
  const n = Number.isInteger(partySize) && partySize > 0 ? partySize : null;
  return menu
    .filter((m) => !m.addon)
    .filter((m) => m.min_party == null || (n !== null && n >= m.min_party))
    .map((m) => ({ ...m, limited_stock: m.limited === true }));
}

/** 어린이 메뉴 목록 (어린이 동반 추천 근거). */
function kidsMenu(menu) {
  return Array.isArray(menu) ? menu.filter((m) => m.kids === true) : [];
}

module.exports = {
  REASON,
  LO_BUFFER_MIN,
  statusAt,
  applyRestaurantTimeGate,
  dedupeByGroup,
  naverDetailFromUrl,
  benefitVisibleToCustomer,
  menuForParty,
  kidsMenu,
};
