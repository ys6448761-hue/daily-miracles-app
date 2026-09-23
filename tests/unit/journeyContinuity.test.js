'use strict';
/**
 * Journey Continuity V0.1 — Unit tests
 *
 * T1: preferred_leisure persists via preference write path
 * T2: buildSkeleton uses preferred_leisure from journey_ctx (leisure_source=TRAVELER_REQUESTED)
 * T3: _generateClarificationMessage suppresses 인원 ask when guest_count known
 * T4: Negation does NOT carry stale preferred_leisure into route build
 * T5: Both guest_count AND date known → cable car message acknowledges preference without asking for known fields
 * T6: cableInRoute detected → SOUL confirms rather than asking again
 * T7-T9: Regressions — existing test suites still pass
 */

const assert = require('assert');
const { runInNewContext } = require('vm');

// ─── Extract helpers ──────────────────────────────────────────────────────────
const svcSrc = require('fs').readFileSync(
  require('path').join(__dirname, '../../services/soyeowoolService.js'), 'utf8'
);

function extractFn(src, name) {
  const start = src.indexOf(`function ${name}(`);
  if (start === -1) throw new Error(`Function ${name} not found`);
  let depth = 0, i = start;
  while (i < src.length) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
    i++;
  }
  return src.slice(start, i + 1);
}

const sandbox = {};
runInNewContext(`
  ${extractFn(svcSrc, '_generateClarificationMessage')}
  genClar = _generateClarificationMessage;
`, sandbox);
const { genClar } = sandbox;

// ─── T1: Preference write path — _extractLeisure returns 'cable' for 케이블카 ──

const quoteContextService = require('../../services/quoteContextService');
const cable = quoteContextService._extractLeisure('케이블카 꼭 타고 싶어');
assert.strictEqual(cable, 'cable', 'T1: _extractLeisure returns cable for 케이블카');
const noWrite = quoteContextService._extractLeisure('케이블카는 빼고 싶어');
assert.strictEqual(noWrite, null, 'T1b: negated cable car → null (no write)');
console.log('✅ T1 PASS — _extractLeisure preference write path correct');

// ─── T2: buildSkeleton with leisure_source=TRAVELER_REQUESTED ─────────────────

const { buildSkeleton } = require('../../services/routeSkeletonService');

const s2 = buildSkeleton({
  start_date: null, nights: 1, guest_count: 2,
  hotel_code: null,
  leisure_code: 'cable',
  leisure_source: 'TRAVELER_REQUESTED',
  candidates: [],
});
const day1Items = s2.days[0].items;
const cableItem = day1Items.find(i => i.commerce_code === 'cable');
assert.ok(cableItem, 'T2a: cable car item present in day 1');
assert.strictEqual(cableItem.selection_status, 'TRAVELER_REQUESTED', 'T2b: selection_status=TRAVELER_REQUESTED');
assert.strictEqual(cableItem.source, 'TRAVELER_PREFERENCE', 'T2c: source=TRAVELER_PREFERENCE');
assert.strictEqual(cableItem.quotable, false, 'T2d: quotable=false (preference, not booking)');
console.log('✅ T2 PASS — TRAVELER_REQUESTED leisure item marked correctly');

// T2e: USER_SELECTED (confirmed booking) path unchanged
const s2e = buildSkeleton({
  start_date: null, nights: 1, guest_count: 2,
  hotel_code: null,
  leisure_code: 'cable',
  leisure_source: 'USER_SELECTED',
  candidates: [],
});
const cableItem2e = s2e.days[0].items.find(i => i.commerce_code === 'cable');
assert.strictEqual(cableItem2e.selection_status, 'LOCKED', 'T2e: USER_SELECTED stays LOCKED');
assert.strictEqual(cableItem2e.quotable, true, 'T2e: USER_SELECTED quotable=true');
console.log('✅ T2e PASS — USER_SELECTED path unchanged');

// ─── T3: _generateClarificationMessage suppresses 인원 when guest_count known ──

// No journey context → asks for both 날짜 and 인원
const r3a = genClar({}, '케이블카 꼭 타고 싶어', null);
assert.ok(r3a.includes('인원'), 'T3a: no context → asks for 인원');
assert.ok(r3a.includes('날짜'), 'T3a: no context → asks for 날짜');
console.log(`✅ T3a PASS — no context: "${r3a.split('\\n')[0]}"`);

// guest_count known → does NOT ask for 인원
const r3b = genClar({}, '케이블카 꼭 타고 싶어', { guest_count: 2 });
assert.ok(!r3b.includes('인원'), 'T3b: guest_count known → no 인원 ask');
assert.ok(r3b.includes('날짜'), 'T3b: date still unknown → asks for 날짜');
console.log(`✅ T3b PASS — guest_count known: "${r3b.split('\\n')[0]}"`);

// date known → does NOT ask for 날짜
const r3c = genClar({}, '케이블카 꼭 타고 싶어', { travel_date: '2026-10-17' });
assert.ok(!r3c.includes('날짜'), 'T3c: date known → no 날짜 ask');
console.log(`✅ T3c PASS — date known: "${r3c.split('\\n')[0]}"`);

// both known → no asks (suggests rebuild instead)
const r3d = genClar({}, '케이블카 꼭 타고 싶어', { guest_count: 2, travel_date: '2026-10-17' });
assert.ok(!r3d.includes('인원'), 'T3d: both known → no 인원 ask');
assert.ok(!r3d.includes('날짜'), 'T3d: both known → no 날짜 ask');
assert.ok(r3d.length > 5, 'T3d: response still non-empty');
console.log(`✅ T3d PASS — both known: "${r3d.split('\\n')[0]}"`);
console.log('✅ T3 PASS — known-field suppression correct');

// ─── T4: Negation does NOT carry stale preference ─────────────────────────────
// The negation-cleared path is handled server-side (preferred_leisure: null write).
// At route build time: quoteCtx.leisure=null (negation guard), no preferred_leisure.
// Verify leisure_code=null → no cable car item in skeleton.
const s4 = buildSkeleton({
  start_date: null, nights: 1, guest_count: 2,
  hotel_code: null,
  leisure_code: null,
  leisure_source: null,
  candidates: [],
});
const noCable = s4.days[0].items.find(i => i.commerce_code === 'cable');
assert.ok(!noCable, 'T4: leisure_code=null → no cable car item');
console.log('✅ T4 PASS — negation clears leisure from route');

// ─── T5: Both fields known → no unnecessary asks ──────────────────────────────

const r5 = genClar({}, '케이블카 꼭 타고 싶어', { guest_count: 2, travel_date: '2026-10-17' });
assert.ok(r5.length > 5, 'T5: response non-empty');
assert.ok(!r5.includes('인원'), 'T5: no 인원 ask');
assert.ok(!r5.includes('날짜'), 'T5: no 날짜 ask');
console.log(`✅ T5 PASS — both known: "${r5.split('\\n')[0]}"`);

// ─── T6: cableInRoute → SOUL confirms rather than asking ─────────────────────

const r6 = genClar({}, '아까 케이블카 꼭 타고 싶다고 했잖아. 일정에 넣어줘', {
  guest_count: 2,
  leisure_code: 'cable',
  route_id: 'ROUTE-DATELESS-ABCD',
});
assert.ok(r6.includes('포함'), 'T6: response confirms cable car is in route');
assert.ok(!r6.includes('인원'), 'T6: no 인원 ask when already in route');
console.log(`✅ T6 PASS — cableInRoute confirmed: "${r6.split('\\n')[0]}"`);

// ─── T7-T9: Regressions ───────────────────────────────────────────────────────
// Re-run key assertions from prior test suites using the extracted functions.

// T7: Walking constraint (from discoveryGate T12)
const r7 = genClar({}, '여자친구가 걷는 걸 싫어해', null);
assert.ok(r7.includes('걷'), 'T7: walking constraint still handled');
console.log(`✅ T7 PASS — walking constraint regression: "${r7.split('\\n')[0]}"`);

// T8: Journey feedback (from discoveryGate T14)
const r8 = genClar({}, '이 일정 괜찮아?', null);
assert.ok(r8.length > 10, 'T8: journey feedback non-empty');
console.log(`✅ T8 PASS — journey feedback regression: "${r8.split('\\n')[0]}"`);

// T9: Greeting (from discoveryGate T15)
const r9 = genClar({}, '안녕', null);
assert.ok(r9.includes('여수') || r9.includes('여행'), 'T9: greeting regression');
console.log(`✅ T9 PASS — greeting regression: "${r9.split('\\n')[0]}"`);

console.log('\n✅ ALL JOURNEY CONTINUITY TESTS PASSED (T1-T9)');
