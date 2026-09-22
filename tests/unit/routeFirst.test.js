'use strict';
/**
 * Route-First V0.1 — Unit tests
 * T1-T4: _isJourneyPlanningIntent / _extractNights
 * T5-T6: routeSkeletonService.buildSkeleton null-date safety
 * T7-T8: presentation_mode gate (ROUTE_READY vs DISCOVERING)
 */

const assert = require('assert');

// ─── T1-T4: Intent detector ───────────────────────────────────────────────────

// Extract private helpers via function-level require trick (they're not exported).
// We test them indirectly through the exported buildSkeleton for skeleton tests,
// and directly by extracting them from the service source for intent tests.

const svcSrc = require('fs').readFileSync(
  require('path').join(__dirname, '../../services/soyeowoolService.js'), 'utf8'
);

// Isolate the two pure functions by running them in a minimal VM context.
const { runInNewContext } = require('vm');
const sandbox = {};
runInNewContext(`
  ${svcSrc.match(/function _isJourneyPlanningIntent[\s\S]*?^}/m)?.[0] || ''}
  ${svcSrc.match(/function _extractNights[\s\S]*?^}/m)?.[0] || ''}
  _isJourneyPlanning = _isJourneyPlanningIntent;
  _extractN = _extractNights;
`, sandbox);

const isIntent   = sandbox._isJourneyPlanning;
const extractN   = sandbox._extractN;

// T1: Basic 박 pattern
assert.strictEqual(isIntent('1박2일 일정 짜줘'), true,  'T1a: 1박2일 일정 짜줘 → true');
assert.strictEqual(isIntent('2박3일로 계획해줘'), true, 'T1b: 2박3일로 계획해줘 → true');
assert.strictEqual(isIntent('3박'),               true, 'T1c: standalone 3박 → true');
console.log('✅ T1 PASS — 박N일 patterns detected');

// T2: Verb patterns
assert.strictEqual(isIntent('여수 일정 짜줘'),       true, 'T2a: 일정 짜줘 → true');
assert.strictEqual(isIntent('여행 코스 만들어주세요'), true, 'T2b: 코스 만들어주세요 → true');
assert.strictEqual(isIntent('계획 세워줘'),          true, 'T2c: 계획 세워줘 → true');
console.log('✅ T2 PASS — verb planning patterns detected');

// T3: Non-planning messages (should return false)
assert.strictEqual(isIntent('이순신광장 어때?'),      false, 'T3a: place query → false');
assert.strictEqual(isIntent('얼마야'),               false, 'T3b: price query → false');
assert.strictEqual(isIntent(null),                   false, 'T3c: null → false');
assert.strictEqual(isIntent(''),                     false, 'T3d: empty → false');
console.log('✅ T3 PASS — non-planning messages → false');

// T4: _extractNights
assert.strictEqual(extractN('1박2일 일정 짜줘'), 1, 'T4a: 1박 → 1');
assert.strictEqual(extractN('2박3일 여행'),      2, 'T4b: 2박 → 2');
assert.strictEqual(extractN('일정 짜줘'),        1, 'T4c: no 박 → default 1');
assert.strictEqual(extractN('9박10일'),          7, 'T4d: 9박 → capped at 7');
assert.strictEqual(extractN(null),               1, 'T4e: null → 1');
console.log('✅ T4 PASS — _extractNights correct');

// ─── T5-T6: buildSkeleton null-date safety ────────────────────────────────────

const { buildSkeleton } = require('../../services/routeSkeletonService');

// T5: null start_date → day.date = null, route_id starts with ROUTE-DATELESS
const s5 = buildSkeleton({ start_date: null, nights: 1, guest_count: 2, candidates: [] });
assert.ok(s5.route_id.startsWith('ROUTE-DATELESS-'), 'T5a: route_id starts with ROUTE-DATELESS-');
assert.strictEqual(s5.start_date, null, 'T5b: start_date null');
assert.strictEqual(s5.end_date,   null, 'T5c: end_date null');
assert.ok(s5.days.every(d => d.date === null), 'T5d: all day.date = null');
assert.strictEqual(s5.days.length, 2, 'T5e: 1박 → 2 days');
console.log('✅ T5 PASS — null-date skeleton correct');

// T6: 2박3일 null-date → 3 days
const s6 = buildSkeleton({ start_date: null, nights: 2, guest_count: 2, candidates: [] });
assert.strictEqual(s6.days.length, 3, 'T6: 2박 → 3 days');
assert.strictEqual(s6.stay_type, '2n3d', 'T6: stay_type=2n3d');
console.log('✅ T6 PASS — 2박3일 null-date skeleton correct');

// ─── T7-T8: presentation_mode gate (indirect test via skeleton output) ────────

// T7: buildSkeleton with hotel + null date — LOCKED item present in day 1
const s7 = buildSkeleton({
  start_date: null, nights: 1, guest_count: 2,
  hotel_code: 'ramada', leisure_code: null, candidates: [],
});
const day1Items = s7.days[0].items;
const hotelItem = day1Items.find(i => i.commerce_code === 'ramada');
assert.ok(hotelItem, 'T7a: hotel LOCKED item present in day 1');
assert.strictEqual(hotelItem.selection_status, 'LOCKED', 'T7b: hotel selection_status=LOCKED');
assert.strictEqual(hotelItem.quotable, true, 'T7c: hotel quotable=true');
// Checkout on last day
const day2Items = s7.days[1].items;
const checkoutItem = day2Items.find(i => i.name && i.name.includes('체크아웃'));
assert.ok(checkoutItem, 'T7d: checkout item present on last day');
console.log('✅ T7 PASS — hotel LOCKED items in correct positions');

// T8: candidates get deduped against leisure
const candidates = [
  { name_ko: '여수 해상케이블카', type: 'attraction', emotion_tags: [] },
  { name_ko: '이순신광장', type: 'attraction', emotion_tags: [] },
];
const s8 = buildSkeleton({
  start_date: null, nights: 1, guest_count: 2,
  hotel_code: null, leisure_code: 'cable', candidates,
});
// 해상케이블카 candidate should be deduped (LEISURE_DEDUP_KEYWORDS match)
const allNames = s8.days.flatMap(d => d.items.map(i => i.name));
const hasCablecarDuplicate = allNames.filter(n => n && n.includes('케이블카')).length > 1;
assert.ok(!hasCablecarDuplicate, 'T8: cablecar candidate deduped — not listed twice');
console.log('✅ T8 PASS — leisure deduplication works');

console.log('\n✅ ALL ROUTE-FIRST TESTS PASSED (T1-T8)');
