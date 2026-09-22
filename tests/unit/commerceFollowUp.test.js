'use strict';
/**
 * Commerce Follow-up V0.1 — Unit tests
 *
 * T1: _isCommerceFollowUpIntent patterns
 * T2: _isCommerceFollowUpIntent — false negatives (non-price messages)
 * T3: _mergeJourneyQuoteCtx — stored journey used when message has no overrides
 * T4: _mergeJourneyQuoteCtx — message guest_count overrides stored guest_count
 * T5: _mergeJourneyQuoteCtx — message hotel_code overrides stored hotel_code
 * T6: _buildClarificationPayload structure
 * T7: sessionService.updateJourneyContext interface (unit-level)
 */

const assert = require('assert');
const { runInNewContext } = require('vm');

// ─── Extract private functions via VM ─────────────────────────────────────────
const svcSrc = require('fs').readFileSync(
  require('path').join(__dirname, '../../services/soyeowoolService.js'), 'utf8'
);

// Regex-extract each pure function we need to test
function extractFn(src, name) {
  // Match "function NAME(..." through balanced braces (simple heuristic: grab until next top-level "function")
  const start = src.indexOf(`function ${name}(`);
  if (start === -1) throw new Error(`Function ${name} not found`);
  // Find the closing brace by counting depth
  let depth = 0, i = start;
  while (i < src.length) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
    i++;
  }
  return src.slice(start, i + 1);
}

const sandbox = {};
try {
  runInNewContext(`
    ${extractFn(svcSrc, '_isCommerceFollowUpIntent')}
    ${extractFn(svcSrc, '_mergeJourneyQuoteCtx')}
    ${extractFn(svcSrc, '_buildClarificationPayload')}
    isCommerce = _isCommerceFollowUpIntent;
    mergeCtx   = _mergeJourneyQuoteCtx;
    buildClar  = _buildClarificationPayload;
  `, sandbox);
} catch (e) {
  console.error('VM extraction failed:', e.message);
  process.exit(1);
}

const { isCommerce, mergeCtx, buildClar } = sandbox;

// ─── T1: Commerce intent detection ───────────────────────────────────────────

assert.strictEqual(isCommerce('이 정도면 얼마야?'),  true,  'T1a: 이 정도면 얼마야 → true');
assert.strictEqual(isCommerce('이 일정 얼마야?'),    true,  'T1b: 이 일정 얼마야 → true');
assert.strictEqual(isCommerce('얼마 들어?'),         true,  'T1c: 얼마 들어 → true');
assert.strictEqual(isCommerce('견적 보여줘'),        true,  'T1d: 견적 보여줘 → true');
assert.strictEqual(isCommerce('가격 알려줘'),        true,  'T1e: 가격 알려줘 → true');
assert.strictEqual(isCommerce('얼마에요?'),          true,  'T1f: 얼마에요 → true');
assert.strictEqual(isCommerce('얼마나 들어요?'),     true,  'T1g: 얼마나 들어요 → true');
console.log('✅ T1 PASS — commerce intent patterns detected');

// ─── T2: False negatives (should NOT match) ───────────────────────────────────

assert.strictEqual(isCommerce('야경 좋은 곳 추천해줘'),  false, 'T2a: place query → false');
assert.strictEqual(isCommerce('1박2일 일정 짜줘'),        false, 'T2b: journey planning → false');
assert.strictEqual(isCommerce('이순신광장 어때?'),        false, 'T2c: place lookup → false');
assert.strictEqual(isCommerce(null),                      false, 'T2d: null → false');
assert.strictEqual(isCommerce(''),                        false, 'T2e: empty → false');
console.log('✅ T2 PASS — non-commerce messages → false');

// ─── T3: Merge — stored journey used when message has no overrides ─────────────

const stored3 = { hotel_code: 'ramada', leisure_code: 'cable', guest_count: 2, travel_date: '2026-10-17' };
const msg3 = { hotel_code: null, leisure: null, guest_count: null, travel_date: null };
const merged3 = mergeCtx(stored3, msg3);
assert.strictEqual(merged3.hotel_code,  'ramada',      'T3: hotel from stored');
assert.strictEqual(merged3.leisure,     'cable',       'T3: leisure from stored.leisure_code');
assert.strictEqual(merged3.guest_count, 2,             'T3: guest_count from stored');
assert.strictEqual(merged3.travel_date, '2026-10-17',  'T3: travel_date from stored');
console.log('✅ T3 PASS — stored journey context used when message has no overrides');

// ─── T4: Merge — message guest_count overrides stored ─────────────────────────

const stored4 = { hotel_code: 'kenny', leisure_code: null, guest_count: 2, travel_date: null };
const msg4 = { hotel_code: null, leisure: null, guest_count: 3, travel_date: null };
const merged4 = mergeCtx(stored4, msg4);
assert.strictEqual(merged4.guest_count, 3, 'T4: message guest_count=3 wins over stored=2');
assert.strictEqual(merged4.hotel_code, 'kenny', 'T4: hotel still from stored');
console.log('✅ T4 PASS — explicit message guest_count overrides stored');

// ─── T5: Merge — message hotel_code overrides stored hotel_code ───────────────

const stored5 = { hotel_code: 'ramada', leisure_code: null, guest_count: 2, travel_date: '2026-11-01' };
const msg5 = { hotel_code: 'kenny', leisure: null, guest_count: null, travel_date: null };
const merged5 = mergeCtx(stored5, msg5);
assert.strictEqual(merged5.hotel_code,  'kenny',       'T5: message hotel_code wins');
assert.strictEqual(merged5.travel_date, '2026-11-01',  'T5: travel_date from stored');
console.log('✅ T5 PASS — explicit message hotel_code overrides stored');

// ─── T6: _buildClarificationPayload structure ─────────────────────────────────

const clar = buildClar('session-abc', '테스트 메시지입니다.');
assert.strictEqual(clar.session_id,        'session-abc',         'T6: session_id');
assert.strictEqual(clar.presentation_mode, 'CLARIFICATION',       'T6: presentation_mode');
assert.strictEqual(clar.message_ko,        '테스트 메시지입니다.', 'T6: message_ko');
assert.strictEqual(clar.places.length,     0,                     'T6: places empty');
assert.strictEqual(clar.quote,             null,                  'T6: quote null');
assert.strictEqual(clar.route,             null,                  'T6: route null');
console.log('✅ T6 PASS — CLARIFICATION payload structure correct');

// ─── T7: sessionService.updateJourneyContext interface ───────────────────────
// Verifies the method exists and returns gracefully (no DB needed for this test)

const sessionService = require('../../services/sessionService');
assert.strictEqual(typeof sessionService.updateJourneyContext, 'function',
  'T7: sessionService.updateJourneyContext is a function');

// Passing null sessionId → returns { updated: false }
sessionService.updateJourneyContext(null, { hotel_code: 'ramada' })
  .then(result => {
    assert.strictEqual(result.updated, false, 'T7b: null sessionId → updated=false');
    console.log('✅ T7 PASS — updateJourneyContext interface correct');
    console.log('\n✅ ALL COMMERCE FOLLOW-UP TESTS PASSED (T1-T7)');
  })
  .catch(err => {
    console.error('T7 FAIL:', err.message);
    process.exit(1);
  });
