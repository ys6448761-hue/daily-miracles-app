'use strict';
/**
 * Discovery Buyback & Burn V0.1 — Unit tests
 *
 * T1-T4: _isDiscoveryIntent — positive evidence (PASS)
 * T5-T11: _isDiscoveryIntent — no positive evidence (BLOCK)
 * T12-T16: _generateClarificationMessage — meaningful SOUL response per scenario
 */

const assert = require('assert');
const { runInNewContext } = require('vm');

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
  ${extractFn(svcSrc, '_isDiscoveryIntent')}
  ${extractFn(svcSrc, '_generateClarificationMessage')}
  isDiscovery = _isDiscoveryIntent;
  genClar     = _generateClarificationMessage;
`, sandbox);

const { isDiscovery, genClar } = sandbox;

// ─── T1-T4: Positive discovery intent → true ──────────────────────────────────

assert.strictEqual(isDiscovery('야경 좋은 곳 알려줘'),         true, 'T1: 알려줘 → discovery');
assert.strictEqual(isDiscovery('어디 갈까?'),                   true, 'T2: 어디 갈까 → discovery');
assert.strictEqual(isDiscovery('아이랑 갈 만한 곳'),            true, 'T3: 갈 만한 곳 → discovery');
assert.strictEqual(isDiscovery('사진 찍기 좋은 곳 추천해줘'),   true, 'T4: 추천해줘 → discovery');
assert.strictEqual(isDiscovery('갈 만한 곳 보여줘'),            true, 'T4b: 보여줘 → discovery');
assert.strictEqual(isDiscovery('근처에 어디가 좋아?'),          true, 'T4c: 어디가 좋아 → discovery');
console.log('✅ T1-T4 PASS — positive discovery patterns trigger correctly');

// ─── T5-T11: NO positive evidence → false (must NOT route to Discovery) ───────

assert.strictEqual(isDiscovery('케이블카 꼭 타고 싶어'),        false, 'T5: leisure intent → no discovery');
assert.strictEqual(isDiscovery('이 일정 괜찮아?'),              false, 'T6: journey feedback → no discovery');
assert.strictEqual(isDiscovery('그거 괜찮아?'),                 false, 'T7: ambiguous follow-up → no discovery');
assert.strictEqual(isDiscovery('여자친구가 걷는 걸 싫어해'),    false, 'T8: constraint → no discovery');
assert.strictEqual(isDiscovery('안녕'),                         false, 'T9: greeting → no discovery');
assert.strictEqual(isDiscovery('1박2일 일정 짜줘'),             false, 'T10: journey planning → no discovery (journey gate handles)');
assert.strictEqual(isDiscovery(null),                           false, 'T11a: null → false');
assert.strictEqual(isDiscovery(''),                             false, 'T11b: empty → false');
assert.strictEqual(isDiscovery('잘 모르겠어'),                  false, 'T11c: indecision → no discovery');
console.log('✅ T5-T11 PASS — non-discovery messages correctly blocked');

// ─── T12-T16: _generateClarificationMessage — meaningful SOUL responses ────────

// T12: Walking constraint
const r12 = genClar({}, '여자친구가 걷는 걸 싫어해');
assert.ok(r12 && r12.length > 10, 'T12: non-empty response');
assert.ok(r12.includes('걷'), 'T12: response references walking constraint');
console.log(`✅ T12 PASS — walking constraint: "${r12.split('\n')[0]}"`);

// T13: Cable car intent
const r13 = genClar({}, '케이블카 꼭 타고 싶어');
assert.ok(r13 && r13.length > 10, 'T13: non-empty response');
assert.ok(r13.includes('케이블카') || r13.includes('일정'), 'T13: response references cable car or journey');
console.log(`✅ T13 PASS — cable car intent: "${r13.split('\n')[0]}"`);

// T14: Journey feedback
const r14 = genClar({}, '이 일정 괜찮아?');
assert.ok(r14 && r14.length > 10, 'T14: non-empty response');
console.log(`✅ T14 PASS — journey feedback: "${r14.split('\n')[0]}"`);

// T15: Greeting
const r15 = genClar({}, '안녕');
assert.ok(r15 && r15.length > 10, 'T15: non-empty response');
assert.ok(r15.includes('여수') || r15.includes('여행'), 'T15: greeting response mentions travel');
console.log(`✅ T15 PASS — greeting: "${r15.split('\n')[0]}"`);

// T16: Generic fallback (couple companion)
const r16 = genClar({ people_type: 'couple' }, '잘 모르겠어');
assert.ok(r16 && r16.length > 10, 'T16a: non-empty');
const r16b = genClar({}, '잘 모르겠어');
assert.ok(r16b && r16b.length > 10, 'T16b: default fallback non-empty');
console.log(`✅ T16 PASS — generic fallback: "${r16b.split('\n')[0]}"`);

console.log('\n✅ ALL DISCOVERY GATE TESTS PASSED (T1-T16)');
