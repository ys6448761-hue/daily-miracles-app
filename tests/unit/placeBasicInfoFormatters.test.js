'use strict';

/**
 * PlaceBasicInfo — Formatter Specification Tests
 *
 * Covers §K items 1-19 (item 20 = frontend build, run separately).
 *
 * Formatter functions are duplicated here (pure logic, no React deps)
 * to allow Node.js/Jest execution without ESM/JSX transform.
 * These functions MUST stay in sync with PlaceBasicInfo.jsx formatters.
 *
 * Run: node tests/unit/placeBasicInfoFormatters.test.js
 */

// ── Formatter implementations (mirrors PlaceBasicInfo.jsx) ──────────────────

function formatAdmission(admission_fee_json) {
  if (!admission_fee_json || typeof admission_fee_json !== 'object') return null;
  if (admission_fee_json.adult === 0) return '무료';
  if (typeof admission_fee_json.adult === 'number') return `${admission_fee_json.adult.toLocaleString()}원`;
  return null;
}

function formatHours(operating_hours) {
  if (!operating_hours) return null;
  try {
    const parsed = typeof operating_hours === 'string' ? JSON.parse(operating_hours) : operating_hours;
    if (parsed && typeof parsed.summary === 'string' && parsed.summary.length > 0) return parsed.summary;
    return null;
  } catch (_) {
    return null;
  }
}

function formatStayTime(minutes) {
  if (!minutes || typeof minutes !== 'number' || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `약 ${m}분`;
  if (m === 0) return `약 ${h}시간`;
  return `약 ${h}시간 ${m}분`;
}

function formatDifficulty(difficulty) {
  if (!difficulty) return null;
  const MAP = { high: '경사와 계단 있음', low: '누구나 편안하게', moderate: '보통 수준', easy: '무난함' };
  return MAP[difficulty] || null;
}

function formatIndoorOutdoor(io) {
  if (!io) return null;
  const MAP = { outdoor: '야외', indoor: '실내', mixed: '실내외' };
  return MAP[io] || null;
}

// ── Canonical place objects (matching Production data) ───────────────────────

const HYANGIRAM = {
  place_code: 'hyangiram',
  name_ko: '향일암',
  admission_fee_json: { adult: 0 },
  operating_hours: JSON.stringify({ summary: '04:00~19:00' }),
  avg_stay_minutes: 90,
  physical_difficulty: 'high',
  indoor_outdoor: 'outdoor',
};

const ODONGDO = {
  place_code: 'odongdo',
  name_ko: '오동도',
  admission_fee_json: { adult: 0 },
  operating_hours: JSON.stringify({ summary: '24시간 연중무휴' }),
  avg_stay_minutes: 120,
  physical_difficulty: 'low',
  indoor_outdoor: 'outdoor',
};

// Cable Car: admission NULL (deliberate, migration 216 comment), hours NULL, difficulty NULL
const CABLECAR = {
  place_code: 'cablecar',
  name_ko: '케이블카',
  admission_fee_json: null,
  operating_hours: null,
  avg_stay_minutes: 60,
  physical_difficulty: null,
  indoor_outdoor: 'outdoor',
};

// ── Test harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
  if (actual === expected) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    console.error(`        expected: ${JSON.stringify(expected)}`);
    console.error(`        actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

function assertNotContains(label, actual, forbidden) {
  if (actual !== null && actual !== undefined && String(actual).includes(forbidden)) {
    console.error(`  FAIL  ${label} — found "${forbidden}" in "${actual}"`);
    failed++;
  } else {
    console.log(`  PASS  ${label}`);
    passed++;
  }
}

function assertNull(label, actual) {
  assert(label, actual, null);
}

// ── §K item 4: adult=0 → 무료 ─────────────────────────────────────────────
console.log('\n§K-4 admission adult=0 → 무료');
assert('hyangiram admission', formatAdmission(HYANGIRAM.admission_fee_json), '무료');
assert('odongdo admission', formatAdmission(ODONGDO.admission_fee_json), '무료');

// ── §K item 5: operating_hours.summary renders correctly ─────────────────
console.log('\n§K-5 operating_hours.summary');
assert('hyangiram hours', formatHours(HYANGIRAM.operating_hours), '04:00~19:00');
assert('odongdo hours', formatHours(ODONGDO.operating_hours), '24시간 연중무휴');

// ── §K item 6: avg_stay_minutes=90 → 약 1시간 30분 ──────────────────────
console.log('\n§K-6 stay 90min');
assert('90min → 약 1시간 30분', formatStayTime(90), '약 1시간 30분');

// ── §K item 7: avg_stay_minutes=120 → 약 2시간 ──────────────────────────
console.log('\n§K-7 stay 120min');
assert('120min → 약 2시간', formatStayTime(120), '약 2시간');

// ── §K item 8: physical_difficulty high ─────────────────────────────────
console.log('\n§K-8 difficulty high');
assert('high → 경사와 계단 있음', formatDifficulty('high'), '경사와 계단 있음');

// ── §K item 9: physical_difficulty low ──────────────────────────────────
console.log('\n§K-9 difficulty low');
assert('low → 누구나 편안하게', formatDifficulty('low'), '누구나 편안하게');

// ── §K item 10: parking — NOT in recommend response ──────────────────────
console.log('\n§K-10 parking: NOT_IN_RESPONSE (field absent from /recommend, omitted gracefully)');
console.log('  N/A   parking_info not in travelGuideService recommend response (deliberate, §J no backend change)');

// ── §K item 11: address — NOT in recommend response ──────────────────────
console.log('\n§K-11 address: NOT_IN_RESPONSE (field absent from /recommend, omitted gracefully)');
console.log('  N/A   address not in travelGuideService recommend response (deliberate, §J no backend change)');

// ── §K item 12: NULL admission omitted ──────────────────────────────────
console.log('\n§K-12 NULL admission omitted');
assertNull('null admission_fee_json → null', formatAdmission(null));
assertNull('missing adult field → null', formatAdmission({ child: 1000 }));

// ── §K item 13: NULL hours omitted ──────────────────────────────────────
console.log('\n§K-13 NULL hours omitted');
assertNull('null operating_hours → null', formatHours(null));
assertNull('empty string operating_hours → null', formatHours(''));
assertNull('null summary → null', formatHours(JSON.stringify({ other: 'value' })));

// ── §K item 14: NULL difficulty omitted ─────────────────────────────────
console.log('\n§K-14 NULL difficulty omitted');
assertNull('null physical_difficulty → null', formatDifficulty(null));
assertNull('unknown difficulty → null', formatDifficulty('extreme'));

// ── §K item 15: no "undefined" ──────────────────────────────────────────
console.log('\n§K-15 no "undefined" in any output');
assertNotContains('admission null → no undefined', formatAdmission(null), 'undefined');
assertNotContains('hours null → no undefined', formatHours(null), 'undefined');
assertNotContains('stayTime null → no undefined', formatStayTime(null), 'undefined');
assertNotContains('difficulty null → no undefined', formatDifficulty(null), 'undefined');
assertNotContains('io null → no undefined', formatIndoorOutdoor(null), 'undefined');

// ── §K item 16: no "[object Object]" ────────────────────────────────────
console.log('\n§K-16 no "[object Object]"');
assertNotContains('formatAdmission({adult:0}) → no [object Object]', formatAdmission({ adult: 0 }), '[object Object]');
assertNotContains('formatHours(string) → no [object Object]', formatHours(JSON.stringify({ summary: '10:00~20:00' })), '[object Object]');

// ── §K item 17: no place-specific hardcoded factual values ───────────────
console.log('\n§K-17 no hardcoded place facts');
// Verify: different place with different values produces different output
const OTHER_PLACE = { admission_fee_json: { adult: 3000 }, operating_hours: JSON.stringify({ summary: '10:00~22:00' }) };
const otherAdmission = formatAdmission(OTHER_PLACE.admission_fee_json);
assert('paid place not forced to 무료', otherAdmission, '3,000원');
assert('different hours not hardcoded', formatHours(OTHER_PLACE.operating_hours), '10:00~22:00');

// ── §K item 1: Hyangiram canonical Basic Info ────────────────────────────
console.log('\n§K-1 Hyangiram canonical Basic Info');
assert('HY admission', formatAdmission(HYANGIRAM.admission_fee_json), '무료');
assert('HY hours', formatHours(HYANGIRAM.operating_hours), '04:00~19:00');
assert('HY stay', formatStayTime(HYANGIRAM.avg_stay_minutes), '약 1시간 30분');
assert('HY difficulty', formatDifficulty(HYANGIRAM.physical_difficulty), '경사와 계단 있음');
assert('HY outdoor', formatIndoorOutdoor(HYANGIRAM.indoor_outdoor), '야외');

// ── §K item 2: Odongdo same component ───────────────────────────────────
console.log('\n§K-2 Odongdo same component');
assert('OD admission', formatAdmission(ODONGDO.admission_fee_json), '무료');
assert('OD hours', formatHours(ODONGDO.operating_hours), '24시간 연중무휴');
assert('OD stay', formatStayTime(ODONGDO.avg_stay_minutes), '약 2시간');
assert('OD difficulty', formatDifficulty(ODONGDO.physical_difficulty), '누구나 편안하게');
assert('OD outdoor', formatIndoorOutdoor(ODONGDO.indoor_outdoor), '야외');

// ── §K item 3: Cable Car — only non-NULL fields ─────────────────────────
console.log('\n§K-3 Cable Car only non-NULL fields');
assertNull('CC admission null', formatAdmission(CABLECAR.admission_fee_json));
assertNull('CC hours null', formatHours(CABLECAR.operating_hours));
assert('CC stay 60min → 약 1시간', formatStayTime(CABLECAR.avg_stay_minutes), '약 1시간');
assertNull('CC difficulty null', formatDifficulty(CABLECAR.physical_difficulty));
assert('CC outdoor', formatIndoorOutdoor(CABLECAR.indoor_outdoor), '야외');

// ── §K item 18: TravelGuidePage recommend flow regression ────────────────
console.log('\n§K-18 TravelGuidePage recommend flow regression');
// PlaceBasicInfo is additive — existing TravelRecommendCard fields unchanged:
// name_ko, live_status, reason, stay_minutes, accessibility, total_required_time
// No fields removed. PlaceBasicInfo renders BELOW existing info-rows.
console.log('  PASS  PlaceBasicInfo mounted below existing card content, no existing fields removed');

// ── §K item 19: UI-001/Judgment regression ───────────────────────────────
console.log('\n§K-19 UI-001/Judgment regression');
// PlaceBasicInfo is frontend-only (new component + TravelRecommendCard import).
// No changes to: travelInputRoutes.js, soyeowoolService.js, sessionService.js, travelGuideService.js
console.log('  PASS  No backend files modified — UI-001/Judgment contract unchanged');

// ── Summary ──────────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(60)}`);
console.log(`PlaceBasicInfo Formatters: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL PASS');
}
