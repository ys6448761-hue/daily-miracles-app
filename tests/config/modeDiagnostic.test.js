// ═══════════════════════════════════════════════════════════
// P1-SSOT — Mode Diagnostic + Marketing Segment Tests
// Run: node tests/config/modeDiagnostic.test.js
// ═══════════════════════════════════════════════════════════

const assert = require('assert');
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
  }
}

const { determineMode, buildDiagnosticResult, diagnose } = require('../../services/modeDiagnosticService');
const { getModeById } = require('../../config/modesLoader');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 P1-SSOT — Mode Diagnostic Tests');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ── GROUP 1: determineMode ──
console.log('🔮 Mode Determination');

test('burnout 키워드 → burnout 모드', () => {
  const { mode_id } = determineMode({
    answers: { q1: '아무것도 하기 싫어요. 무기력하고 지쳐서 에너지가 고갈됐어요.' },
  });
  assert.strictEqual(mode_id, 'burnout');
});

test('anxiety 키워드 → anxiety 모드', () => {
  const { mode_id } = determineMode({
    answers: { q1: '불안해요. 걱정이 멈추지 않고 최악만 떠올라요. 잠이 안 와요.' },
  });
  assert.strictEqual(mode_id, 'anxiety');
});

test('comparison 키워드 → comparison 모드', () => {
  const { mode_id } = determineMode({
    answers: { q1: 'SNS 보면 우울하고 남들만 잘 되는 것 같아요. 자존감이 바닥이에요.' },
  });
  assert.strictEqual(mode_id, 'comparison');
});

test('avoidance 키워드 → avoidance 모드', () => {
  const { mode_id } = determineMode({
    answers: { q1: '미루기만 해요. 시작이 너무 어렵고 자꾸 딴짓만 하게 돼요.' },
  });
  assert.strictEqual(mode_id, 'avoidance');
});

test('overload 키워드 → overload 모드', () => {
  const { mode_id } = determineMode({
    answers: { q1: '할 일 폭발이에요. 머리가 터질 것 같고 우선순위가 안 잡혀요.' },
  });
  assert.strictEqual(mode_id, 'overload');
});

test('빈 답변 → stuck (fallback)', () => {
  const { mode_id } = determineMode({
    answers: { q1: '' },
  });
  assert.strictEqual(mode_id, 'stuck');
});

test('confidence 0~1 범위', () => {
  const { confidence } = determineMode({
    answers: { q1: '무기력하고 에너지가 없어요' },
  });
  assert.ok(confidence >= 0 && confidence <= 1, `confidence ${confidence} out of range`);
});

test('기적지수 낮은 영역 가중', () => {
  // 회복탄력성 낮음 → burnout(회복탄력성 연결) 가중
  const { mode_id } = determineMode({
    answers: { q1: '좀 지치긴 해요' },
    miracleScores: { '회복탄력성': 30 },
  });
  // 회복탄력성 연결 모드: overload, burnout, anxiety 중 하나
  const linked = getModeById(mode_id);
  assert.ok(linked, `mode ${mode_id} should exist`);
});

// ── GROUP 2: buildDiagnosticResult ──
console.log('\n📋 Build Diagnostic Result');

test('유효한 mode_id → 전체 결과 반환', () => {
  const result = buildDiagnosticResult('burnout');
  assert.ok(result);
  assert.strictEqual(result.mode_id, 'burnout');
  assert.strictEqual(result.mode_label, '방전 모드');
  assert.ok(result.tagline.length > 0);
  assert.ok(result.recommended_action.length > 0);
  assert.ok(result.all_action_templates.length >= 2);
  assert.ok(result.ad_hook_keywords.length >= 1);
  assert.strictEqual(result.linked_miracle_index, '회복탄력성');
});

test('없는 mode_id → null', () => {
  const result = buildDiagnosticResult('nonexistent');
  assert.strictEqual(result, null);
});

test('actionIndex 지정 → 해당 액션 반환', () => {
  const result0 = buildDiagnosticResult('overload', { actionIndex: 0 });
  const result1 = buildDiagnosticResult('overload', { actionIndex: 1 });
  assert.ok(result0.recommended_action !== result1.recommended_action,
    'different index should return different action');
});

test('결과는 SSOT에서 조회 (registry 변경 시 자동 반영)', () => {
  // mode_label은 registry의 label_kr와 동일해야 함
  const mode = getModeById('anxiety');
  const result = buildDiagnosticResult('anxiety');
  assert.strictEqual(result.mode_label, mode.label_kr);
  assert.strictEqual(result.tagline, mode.tagline);
});

// ── GROUP 3: Full diagnose pipeline ──
console.log('\n🔄 Full Diagnose Pipeline');

test('diagnose returns mode_id + confidence + result', () => {
  const output = diagnose({
    answers: { q1: '집중 안 됨. 핸드폰 중독. 시간만 간다.' },
  });
  assert.ok(output.mode_id);
  assert.ok(typeof output.confidence === 'number');
  assert.ok(output.result);
  assert.ok(output.result.mode_label);
  assert.ok(output.result.recommended_action);
});

test('diagnose with miracleScores', () => {
  const output = diagnose({
    answers: { q1: '방향을 모르겠어요' },
    miracleScores: { '목표': 25, '감사': 80 },
  });
  assert.ok(output.mode_id);
  assert.ok(output.result);
});

// ── GROUP 4: Marketing Segment (ISSUE 3) ──
console.log('\n📊 Marketing Segment');

test('8개 모드 모두 ad_hook_keywords 보유', () => {
  const { getAllModes } = require('../../config/modesLoader');
  for (const mode of getAllModes()) {
    assert.ok(
      mode.ad_hook_keywords.length >= 3,
      `${mode.mode_id}: keywords ${mode.ad_hook_keywords.length} < 3`
    );
  }
});

test('진단 결과에서 ad_hook_keywords 접근 가능', () => {
  const output = diagnose({
    answers: { q1: '불안해요 걱정이 멈추지 않아' },
  });
  assert.ok(output.result.ad_hook_keywords.length > 0);
});

test('buildDiagnosticResult에 마케팅 필드 포함', () => {
  const result = buildDiagnosticResult('comparison');
  assert.ok('ad_hook_keywords' in result);
  assert.ok('marketing_archetypes' in result);
  assert.ok('mode_id' in result);
  assert.ok('mode_label' in result);
  // Meta/CRM 연동 시 필요한 필드 존재 확인
  assert.ok(typeof result.mode_id === 'string');
  assert.ok(Array.isArray(result.ad_hook_keywords));
  assert.ok(Array.isArray(result.marketing_archetypes));
  assert.strictEqual(result.marketing_archetypes.length, 3);
});

// ── Summary ──
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🧪 Results: ${passed} passed, ${failed} failed (total ${passed + failed})`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

process.exit(failed > 0 ? 1 : 0);
