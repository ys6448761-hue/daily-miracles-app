'use strict';
/**
 * PHX-MUYEOJEONG-FOOD §81 — 머먹지 고객 질문 의도·시각 파싱 (결정적, LLM 미사용, 판단 로직 없음).
 * 판단(영업·휴무·브레이크·마감)은 munmeokjiTimeGate 가 한다. 여기서는 질문을 구조화만 한다.
 */

const SEOUL = 'Asia/Seoul';
const DAY_OF_WEEK_KO = { 월: 'mon', 화: 'tue', 수: 'wed', 목: 'thu', 금: 'fri', 토: 'sat', 일: 'sun' };
const DAY_LABEL_KO = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일' };
const JS_DAY_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
// §81 Q81-1: 시각이 없을 때 식사 시점의 기본 시각 (가정. 응답에 기본 시각 기준임을 표시)
const SLOT_DEFAULT_TIME = { breakfast: '08:00', lunch: '12:00', late_lunch: '15:00', dinner: '18:00', late_night: '23:00' };

/** Asia/Seoul 기준 요일·시각 (DST 없음, Intl 로 계산). */
function seoulParts(now) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: SEOUL, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const p = Object.fromEntries(fmt.formatToParts(now).map((x) => [x.type, x.value]));
  const dayMap = { Sun: 'sun', Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat' };
  return { day: dayMap[p.weekday], hhmm: `${p.hour}:${p.minute}` };
}

function addDays(now, n) {
  return new Date(now.getTime() + n * 86400000);
}

/** 오늘(0)부터 가장 가까운 해당 요일까지의 일수. */
function offsetToWeekday(now, dayKey) {
  for (let k = 0; k < 7; k++) {
    if (seoulParts(addDays(now, k)).day === dayKey) return k;
  }
  return 0;
}

function pad2(n) { return String(n).padStart(2, '0'); }

/** 명시 시각 파싱. 'HH:MM', 또는 (오전|오후|밤|낮|새벽|아침)? N시 (M분|반)?. 없으면 null. */
function parseExplicitTime(message) {
  const m = String(message || '');
  const colon = m.match(/(\d{1,2}):(\d{2})/);
  if (colon) {
    const h = Number(colon[1]), mm = Number(colon[2]);
    if (h <= 23 && mm <= 59) return `${pad2(h)}:${pad2(mm)}`;
    return null;
  }
  const kor = m.match(/(오전|오후|밤|낮|새벽|아침)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분|\s*(반))?/);
  if (!kor) return null;
  const prefix = kor[1] || '';
  let h = Number(kor[2]);
  const mm = kor[4] ? 30 : (kor[3] ? Number(kor[3]) : 0);
  if (h > 24 || mm > 59) return null;
  if (prefix === '오후' && h < 12) h += 12;
  if (prefix === '낮' && h < 12) h += 12;
  if (prefix === '오전' && h === 12) h = 0;
  if (prefix === '밤' && h >= 6 && h <= 11) h += 12;
  if (prefix === '밤' && h === 12) h = 0;
  if (h === 24) h = 0;
  return `${pad2(h)}:${pad2(mm)}`;
}

/** 식사 시점 단어 → slot. 없으면 null. */
function parseMealSlotWord(message) {
  const m = String(message || '');
  if (/늦은\s*점심/.test(m)) return 'late_lunch';
  if (/심야|야식|밤마실/.test(m)) return 'late_night';
  if (/아침/.test(m)) return 'breakfast';
  if (/점심/.test(m)) return 'lunch';
  if (/저녁/.test(m)) return 'dinner';
  return null;
}

/** 명시 시각으로 식사 시점 추정 (시각 단어가 없을 때만 사용). */
function slotFromTime(hhmm) {
  const [h, mm] = hhmm.split(':').map(Number);
  const t = h * 60 + mm;
  if (t >= 21 * 60 || t < 5 * 60) return 'late_night';
  if (t < 10 * 60 + 30) return 'breakfast';
  if (t < 14 * 60) return 'lunch';
  if (t < 17 * 60) return 'late_lunch';
  return 'dinner';
}

/**
 * 방문 해석.
 * @returns {{day: string, dayLabel: string, time: string, source: 'NOW'|'EXPLICIT'|'SLOT_DEFAULT',
 *            slot: string|null, slotSource: 'WORD'|'INFERRED_FROM_TIME'|'NONE', daySource: 'NOW'|'WORD'}}
 */
function parseVisit(message, now = new Date()) {
  const text = String(message || '');
  const today = seoulParts(now);

  // 날짜
  let dayKey = today.day;
  let daySource = 'NOW';
  if (/내일/.test(text)) { dayKey = seoulParts(addDays(now, 1)).day; daySource = 'WORD'; }
  else if (/모레/.test(text)) { dayKey = seoulParts(addDays(now, 2)).day; daySource = 'WORD'; }
  else {
    const wd = text.match(/(월|화|수|목|금|토|일)요일/);
    if (wd) { dayKey = seoulParts(addDays(now, offsetToWeekday(now, DAY_OF_WEEK_KO[wd[1]]))).day; daySource = 'WORD'; }
  }

  // 시각
  const explicit = parseExplicitTime(text);
  const slotWord = parseMealSlotWord(text);
  let time;
  let source;
  if (explicit) { time = explicit; source = 'EXPLICIT'; }
  else if (/지금|현재|바로/.test(text) || !slotWord) { time = today.hhmm; source = 'NOW'; }
  else { time = SLOT_DEFAULT_TIME[slotWord]; source = 'SLOT_DEFAULT'; }

  // 식사 시점
  let slot = slotWord;
  let slotSource = slotWord ? 'WORD' : 'NONE';
  if (!slot && explicit) { slot = slotFromTime(explicit); slotSource = 'INFERRED_FROM_TIME'; }

  return { day: dayKey, dayLabel: DAY_LABEL_KO[dayKey], time, source, slot, slotSource, daySource };
}

function parseCompanion(message) {
  const m = String(message || '');
  if (/혼자|혼밥|1인|나 혼자/.test(m)) return 'solo';
  if (/아이|아기|자녀|어린이|애기|애들|아들|딸/.test(m)) return 'kids';
  if (/부모님|어르신|할머니|할아버지|어머니|아버지/.test(m)) return 'elderly';
  return null;
}

function parseCuisine(message) {
  const m = String(message || '');
  if (/게장/.test(m)) return '게장';
  if (/꽃게탕/.test(m)) return '꽃게탕';
  if (/회(?!식)|횟집/.test(m)) return '회';
  return null;
}

const TOURISM_OR_JOURNEY_RE = /일정|코스|반나절|\d\s*박|여행\s*계획|어디부터/;
const CAFE_RE = /카페|커피/;
const FOOD_WORD_RE = /식당|맛집|먹을|먹고|먹자|먹어|밥|식사|게장|회|꽃게탕|갈치|서대|아귀|점심|저녁|아침|야식|심야|밤마실|간식|횟집|본관|1번가/;
const ASK_WORD_RE = /추천|알려|갈 수|갈까|가도|가자|갈 곳|먹을 곳|있어|있나|있을까|어디|될까|먹고 싶|먹고싶|먹을|먹고|어때|찾아|뭐 먹|갈 만/;

/** 식당 질문인지 (결정적). 장소·코스·카페·이전 턴 참조는 제외. */
function isMunmeokjiFoodQuestion(message) {
  const m = String(message || '');
  if (!FOOD_WORD_RE.test(m)) return false;
  if (!ASK_WORD_RE.test(m)) return false;
  if (CAFE_RE.test(m)) return false;
  if (TOURISM_OR_JOURNEY_RE.test(m)) return false;
  return true;
}

/** 식당 명칭 (짧은 이름 포함) 으로 행 찾기. MOCK 행은 제외. */
function findNamedRestaurant(message, rows) {
  const m = String(message || '');
  for (const r of rows || []) {
    if (!r.name || /MOCK/.test(r.name)) continue;
    const short = r.name.replace(/(식당|횟집|게장본관|본관|게장|1번가|카페)$/, '');
    if (m.includes(r.name) || (short.length >= 2 && m.includes(short))) return r;
  }
  return null;
}

/** 메뉴 항목 (본 메뉴·추가 포함) 언급 찾기. */
function findMenuItem(message, rows) {
  const m = String(message || '');
  for (const r of rows || []) {
    for (const item of Array.isArray(r.menu) ? r.menu : []) {
      if (item.name && m.includes(item.name.replace(/\s*추가$/, '').replace(/\s*\d+마리$/, ''))) {
        return { restaurant: r, item };
      }
    }
  }
  return null;
}

module.exports = {
  SLOT_DEFAULT_TIME,
  seoulParts,
  parseExplicitTime,
  parseVisit,
  parseCompanion,
  parseCuisine,
  isMunmeokjiFoodQuestion,
  findNamedRestaurant,
  findMenuItem,
  DAY_LABEL_KO,
};
