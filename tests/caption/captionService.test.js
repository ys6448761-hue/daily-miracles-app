/**
 * captionService.test.js
 * API-less 테스트 — OPENAI_API_KEY 없이 실행 가능
 */

// API 키 강제 제거 (테스트 격리)
delete process.env.OPENAI_API_KEY;

const { validateCaption, generateCaption, FALLBACKS } = require('../../services/captionService');

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.error(`  ❌ ${name}`);
    failed++;
  }
}

console.log('\n═══ captionService 테스트 ═══\n');

// ─── 1. validateCaption 정상 통과 ─────────────────
console.log('1. 정상 캡션 (15자)');
{
  const { valid, safety_flags } = validateCaption('오늘도 한 걸음 나아가는 하루');
  const charCount = '오늘도 한 걸음 나아가는 하루'.replace(/\s/g, '').length; // 13
  assert(valid === true, `valid === true (${charCount}자)`);
  assert(safety_flags.has_forbidden === false, 'has_forbidden === false');
}

// ─── 2. validateCaption 길이 초과 (>22자) ─────────
console.log('\n2. 길이 초과 (>22자)');
{
  // 25자 (공백 제외)
  const longCaption = '아주아주아주아주아주아주긴캡션을만들어봅시다길게요';
  const charCount = longCaption.replace(/\s/g, '').length;
  const { valid, safety_flags } = validateCaption(longCaption);
  assert(valid === false, `valid === false (${charCount}자)`);
  assert(safety_flags.reason && safety_flags.reason.includes('Length'), 'reason에 Length 포함');
}

// ─── 3. validateCaption 보장어 차단 ────────────────
console.log('\n3. 보장어 차단');
{
  const guaranteeWords = ['확실히', '반드시', '이루어집니다', '100%', '보장', '무조건'];
  for (const word of guaranteeWords) {
    const caption = `${word} 좋은 하루가 될거예요`;
    const { valid, safety_flags } = validateCaption(caption);
    assert(valid === false, `"${word}" 포함 → rejected`);
    assert(safety_flags.has_forbidden === true || safety_flags.reason?.includes('guarantee'),
      `${word}: forbidden 또는 guarantee 사유`);
  }
}

// ─── 4. validateCaption 금지어 차단 ────────────────
console.log('\n4. 금지어(forbidden-words.json) 차단');
{
  const { valid, safety_flags } = validateCaption('사주팔자로 운명을 보세요');
  assert(valid === false, '"사주" 포함 → rejected');
  assert(safety_flags.has_forbidden === true, 'has_forbidden === true');
}

// ─── 5. validateCaption 이모지 2개 ────────────────
console.log('\n5. 이모지 2개 초과');
{
  const { valid, safety_flags } = validateCaption('좋은 하루 🌟✨ 되세요');
  assert(valid === false, '이모지 2개 → rejected');
  assert(safety_flags.reason && safety_flags.reason.includes('emoji'), 'reason에 emoji 포함');
}

// ─── 6. validateCaption 줄바꿈 금지 ───────────────
console.log('\n6. 줄바꿈 포함');
{
  const { valid, safety_flags } = validateCaption('첫줄\n둘째줄');
  assert(valid === false, '줄바꿈 → rejected');
  assert(safety_flags.reason && safety_flags.reason.includes('line break'), 'reason에 line break 포함');
}

// ─── 7. FALLBACKS 검증 ───────────────────────────
console.log('\n7. FALLBACKS 검증');
{
  const tones = ['CALM', 'HOPEFUL', 'RESTART'];
  for (const tone of tones) {
    assert(typeof FALLBACKS[tone] === 'string', `FALLBACKS.${tone} 존재`);
    const charCount = FALLBACKS[tone].replace(/\s/g, '').replace(/\./g, '').length;
    assert(charCount <= 22, `FALLBACKS.${tone} ≤22자 (${charCount}자)`);
  }
}

// ─── 8. generateCaption API키 없을 때 폴백 ─────────
console.log('\n8. generateCaption — API키 없으면 폴백');
(async () => {
  const result = await generateCaption({ tone: 'CALM' });
  assert(result.caption === FALLBACKS.CALM, `CALM 폴백: "${result.caption}"`);
  assert(result.safety_flags.reason === 'No API key', 'reason: No API key');

  const hopeful = await generateCaption({ tone: 'HOPEFUL' });
  assert(hopeful.caption === FALLBACKS.HOPEFUL, `HOPEFUL 폴백: "${hopeful.caption}"`);

  const restart = await generateCaption({ tone: 'RESTART' });
  assert(restart.caption === FALLBACKS.RESTART, `RESTART 폴백: "${restart.caption}"`);

  // 잘못된 톤 → CALM 폴백
  const invalid = await generateCaption({ tone: 'INVALID' });
  assert(invalid.caption === FALLBACKS.CALM, `INVALID tone → CALM 폴백: "${invalid.caption}"`);

  // ─── 결과 ──────────────────────────────────────
  console.log(`\n═══ 결과: ${passed}/${passed + failed} 통과 ═══`);
  if (failed > 0) {
    console.error(`\n❌ ${failed}개 실패!`);
    process.exit(1);
  } else {
    console.log('\n✅ 모든 테스트 통과!');
  }
})();
