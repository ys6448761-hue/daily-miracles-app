#!/usr/bin/env node
/**
 * Ad Creative 데모 — 4종 크리에이티브 자동 생성 + 가이드 검증
 *
 * 실행: node scripts/demo-ad-creative.js
 *
 * 출력:
 *  1. 4종 크리에이티브 각각의 6단계 프롬프트
 *  2. 가이드 준수 자동 검증 리포트 (30+ 항목)
 *  3. 4종 비교 요약표
 */

const AdCreativeBuilder = require('../services/adCreative/AdCreativeBuilder');
const AdCreativeValidator = require('../services/adCreative/AdCreativeValidator');

// ═══════════════════════════════════════════════════════
// 실행
// ═══════════════════════════════════════════════════════

console.log('');
console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║  Ad Creative 자동 생성 + 가이드 검증 시스템 v1.0      ║');
console.log('║  gpt-video-production.md 기반                        ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');

const configIds = ['healing-high', 'growth-high', 'healing-mid', 'growth-mid'];
const allResults = [];

for (const configId of configIds) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  🎬 빌드: ${configId}`);
  console.log(`${'─'.repeat(60)}\n`);

  // 1. 빌드
  const creative = AdCreativeBuilder.build(configId);

  // 2. Production Summary 출력
  console.log('  【1단계: PRODUCTION SUMMARY】');
  const s = creative.productionSummary;
  console.log(`    Title:      ${s.title}`);
  console.log(`    Target:     ${s.objective}`);
  console.log(`    Format:     ${s.format} / ${s.resolution}`);
  console.log(`    Duration:   ${s.duration}`);
  console.log(`    Characters: ${s.characters}`);
  console.log(`    Background: ${s.backgroundMode}`);
  console.log(`    Tone:       ${s.tone}`);
  console.log(`    CTA:        ${s.cta}`);
  console.log('');

  // 3. Scene Plan 출력
  console.log('  【2단계: SCENE PLAN】');
  creative.scenePlan.forEach(sp => {
    console.log(`    ${sp.unitId} (${sp.time}) [${sp.phase}] ${sp.emotion}`);
    console.log(`      Aurum: ${sp.aurumState}`);
  });
  console.log('');

  // 4. Keyframe Prompt 길이 확인
  console.log('  【3단계: KEYFRAME PROMPTS】');
  creative.keyframePrompts.forEach(kf => {
    const lines = kf.prompt.split('\n').length;
    const chars = kf.prompt.length;
    console.log(`    ${kf.unitId} [${kf.phase}] ${kf.emotion}`);
    console.log(`      → ${lines}줄, ${chars}자 (블록 전량 포함)`);
  });
  console.log('');

  // 5. Sora Prompt 길이 확인
  console.log('  【4단계: SORA I2V PROMPTS】');
  creative.soraPrompts.forEach(sp => {
    const lines = sp.prompt.split('\n').length;
    const chars = sp.prompt.length;
    const has3Beat = sp.prompt.includes('Beat A') && sp.prompt.includes('Beat B') && sp.prompt.includes('Beat C');
    console.log(`    ${sp.unitId} [${sp.phase}] ${sp.emotion}`);
    console.log(`      → ${lines}줄, ${chars}자, 3-Beat: ${has3Beat ? '✅' : '❌'}`);
  });
  console.log('');

  // 6. Subtitles 출력
  console.log('  【5단계: SUBTITLES + TIMECODES (후편집용)】');
  creative.subtitles.forEach(sub => {
    console.log(`    ${sub.time}: "${sub.text}" [${sub.color}]`);
  });
  console.log('');

  // 7. Sound Brief 출력
  console.log('  【6단계: LOGO SONG BRIEF】');
  const sb = creative.logoSongBrief;
  console.log(`    Instrument: ${sb.instrument}`);
  console.log(`    BPM:        ${sb.bpm}`);
  console.log(`    Reference:  ${sb.reference}`);
  console.log('');

  // 8. 가이드 검증
  const validation = AdCreativeValidator.validateAll(creative);
  console.log(AdCreativeValidator.formatReport(validation, configId));

  allResults.push({
    configId,
    creative,
    validation
  });
}

// ═══════════════════════════════════════════════════════
// 4종 종합 비교표
// ═══════════════════════════════════════════════════════

console.log('');
console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║              4종 크리에이티브 종합 비교                 ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');

console.log('  ┌─────────────────┬──────────────┬──────────┬──────────────────┬─────────────┐');
console.log('  │ Creative        │ Archetype    │ LTV      │ Costume          │ 검증 결과   │');
console.log('  ├─────────────────┼──────────────┼──────────┼──────────────────┼─────────────┤');

allResults.forEach(r => {
  const s = r.creative.productionSummary;
  const v = r.validation;
  const configPad = r.configId.padEnd(15);
  const archPad = (r.creative.productionSummary.objective.split(' × ')[0] || '').padEnd(12);
  const ltvPad = (r.creative.productionSummary.objective.split(' × ')[1] || '').padEnd(8);

  // 의상 추출
  const costumeMatch = s.characters.match(/\(([A-Z_]+)\)/);
  const costume = costumeMatch ? costumeMatch[1].padEnd(16) : '?'.padEnd(16);

  const status = v.pass ? `✅ ${v.passed}/${v.total}` : `❌ ${v.passed}/${v.total}`;

  console.log(`  │ ${configPad} │ ${archPad} │ ${ltvPad} │ ${costume} │ ${status.padEnd(11)} │`);
});

console.log('  └─────────────────┴──────────────┴──────────┴──────────────────┴─────────────┘');
console.log('');

// 전체 결과
const totalTests = allResults.reduce((sum, r) => sum + r.validation.total, 0);
const totalPassed = allResults.reduce((sum, r) => sum + r.validation.passed, 0);
const totalFailed = allResults.reduce((sum, r) => sum + r.validation.failed, 0);
const allPass = allResults.every(r => r.validation.pass);

console.log(`  종합: ${totalPassed}/${totalTests} PASS (${totalFailed} FAIL)`);
console.log(`  상태: ${allPass ? '✅ ALL 4 CREATIVES PASS' : '❌ SOME FAILED'}`);
console.log('');

// ═══════════════════════════════════════════════════════
// 샘플 프롬프트 출력 (healing-high U1 키프레임)
// ═══════════════════════════════════════════════════════

console.log('');
console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║  샘플: healing-high U1 키프레임 프롬프트 (복붙용)      ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');

const sampleCreative = allResults[0].creative;
console.log('--- KEYFRAME PROMPT START ---');
console.log(sampleCreative.keyframePrompts[0].prompt);
console.log('--- KEYFRAME PROMPT END ---');
console.log('');

console.log('--- SORA I2V PROMPT START ---');
console.log(sampleCreative.soraPrompts[0].prompt);
console.log('--- SORA I2V PROMPT END ---');
console.log('');

// 종료
if (allPass) {
  console.log('🎉 4종 크리에이티브 전량 가이드 검증 통과!');
  console.log('   → 키프레임 프롬프트를 DALL-E/Midjourney에 투입 가능');
  console.log('   → Sora I2V 프롬프트를 Sora에 투입 가능');
} else {
  console.log('⚠️ 검증 실패 항목이 있습니다. 위 리포트를 확인하세요.');
  process.exit(1);
}
