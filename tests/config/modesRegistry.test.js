// ═══════════════════════════════════════════════════════════
// P1-SSOT — 8-Mode Registry Tests
// Run: node tests/config/modesRegistry.test.js
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

const {
  loadRegistry, getModeById, getAllModeIds, getAllModes,
  REQUIRED_FIELDS, VALID_MIRACLE_INDICES,
} = require('../../config/modesLoader');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 P1-SSOT — 8-Mode Registry Tests');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ── GROUP 1: Registry Loading ──
console.log('📂 Registry Loading');

test('registry 로드 성공', () => {
  const { modes, errors } = loadRegistry({ failFast: false });
  assert.ok(modes.length > 0, 'should have modes');
  assert.strictEqual(errors.length, 0, `errors: ${errors.join(', ')}`);
});

test('정확히 8개 모드 로드', () => {
  const { modes } = loadRegistry({ failFast: false });
  assert.strictEqual(modes.length, 8, `expected 8, got ${modes.length}`);
});

test('failFast=true 로드 성공 (에러 없을 때)', () => {
  assert.doesNotThrow(() => loadRegistry({ failFast: true }));
});

// ── GROUP 2: Schema Validation ──
console.log('\n🔍 Schema Validation');

test('모든 모드에 필수 필드 존재', () => {
  const { modes } = loadRegistry({ failFast: false });
  for (const mode of modes) {
    for (const field of REQUIRED_FIELDS) {
      assert.ok(
        mode[field] !== undefined && mode[field] !== null,
        `${mode.mode_id}: '${field}' 누락`
      );
    }
  }
});

test('mode_id 중복 없음', () => {
  const ids = getAllModeIds();
  const unique = new Set(ids);
  assert.strictEqual(ids.length, unique.size, `중복 발견: ${ids.join(', ')}`);
});

test('mode_id 형식: 소문자+언더스코어', () => {
  for (const id of getAllModeIds()) {
    assert.ok(/^[a-z_]+$/.test(id), `'${id}' 형식 위반`);
  }
});

test('linked_miracle_index가 유효한 기적지수', () => {
  for (const mode of getAllModes()) {
    assert.ok(
      VALID_MIRACLE_INDICES.includes(mode.linked_miracle_index),
      `${mode.mode_id}: '${mode.linked_miracle_index}'는 유효하지 않음`
    );
  }
});

test('symptoms 최소 1개', () => {
  for (const mode of getAllModes()) {
    assert.ok(
      Array.isArray(mode.symptoms) && mode.symptoms.length >= 1,
      `${mode.mode_id}: symptoms 부족`
    );
  }
});

test('recommended_action_templates 최소 2개', () => {
  for (const mode of getAllModes()) {
    assert.ok(
      Array.isArray(mode.recommended_action_templates) && mode.recommended_action_templates.length >= 2,
      `${mode.mode_id}: action_templates 부족 (${mode.recommended_action_templates?.length})`
    );
  }
});

test('ad_hook_keywords 최소 1개', () => {
  for (const mode of getAllModes()) {
    assert.ok(
      Array.isArray(mode.ad_hook_keywords) && mode.ad_hook_keywords.length >= 1,
      `${mode.mode_id}: ad_hook_keywords 부족`
    );
  }
});

// ── GROUP 3: Lookup API ──
console.log('\n🔎 Lookup API');

const EXPECTED_IDS = [
  'overload', 'burnout', 'avoidance', 'distraction',
  'anxiety', 'comparison', 'hypersensitive', 'stuck',
];

test('8개 mode_id 정확히 일치', () => {
  const ids = getAllModeIds();
  for (const expected of EXPECTED_IDS) {
    assert.ok(ids.includes(expected), `'${expected}' 없음`);
  }
});

test('getModeById — 존재하는 모드 반환', () => {
  const mode = getModeById('burnout');
  assert.ok(mode, 'burnout should exist');
  assert.strictEqual(mode.label_kr, '방전 모드');
  assert.strictEqual(mode.linked_miracle_index, '회복탄력성');
});

test('getModeById — 없는 모드 → null', () => {
  const mode = getModeById('nonexistent');
  assert.strictEqual(mode, null);
});

test('각 모드 tagline 비어있지 않음', () => {
  for (const mode of getAllModes()) {
    assert.ok(
      typeof mode.tagline === 'string' && mode.tagline.length > 0,
      `${mode.mode_id}: tagline 비어있음`
    );
  }
});

// ── GROUP 4: Content Quality ──
console.log('\n📝 Content Quality');

test('모든 모드 label_kr에 "모드" 포함', () => {
  for (const mode of getAllModes()) {
    assert.ok(mode.label_kr.includes('모드'), `${mode.mode_id}: '${mode.label_kr}'에 "모드" 미포함`);
  }
});

test('action_templates에 빈 문자열 없음', () => {
  for (const mode of getAllModes()) {
    for (const tmpl of mode.recommended_action_templates) {
      assert.ok(tmpl.length > 0, `${mode.mode_id}: 빈 action template`);
    }
  }
});

test('ad_hook_keywords에 빈 문자열 없음', () => {
  for (const mode of getAllModes()) {
    for (const kw of mode.ad_hook_keywords) {
      assert.ok(kw.length > 0, `${mode.mode_id}: 빈 keyword`);
    }
  }
});

// ── GROUP 5: Marketing Archetypes ──
console.log('\n🎯 Marketing Archetypes');

test('모든 모드에 marketing_archetypes 존재', () => {
  for (const mode of getAllModes()) {
    assert.ok(
      Array.isArray(mode.marketing_archetypes),
      `${mode.mode_id}: marketing_archetypes 누락`
    );
  }
});

test('marketing_archetypes 최소 2개 (정확히 3개)', () => {
  for (const mode of getAllModes()) {
    assert.strictEqual(
      mode.marketing_archetypes.length, 3,
      `${mode.mode_id}: expected 3 archetypes, got ${mode.marketing_archetypes.length}`
    );
  }
});

test('marketing_archetypes에 빈 문자열 없음', () => {
  for (const mode of getAllModes()) {
    for (const arch of mode.marketing_archetypes) {
      assert.ok(
        typeof arch === 'string' && arch.length > 0,
        `${mode.mode_id}: 빈 archetype`
      );
    }
  }
});

test('marketing_archetypes 전체 24개 고유값', () => {
  const all = [];
  for (const mode of getAllModes()) {
    all.push(...mode.marketing_archetypes);
  }
  assert.strictEqual(all.length, 24, `expected 24, got ${all.length}`);
  const unique = new Set(all);
  assert.strictEqual(unique.size, 24, `중복 archetype 존재: ${all.length} total, ${unique.size} unique`);
});

// ── Summary ──
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🧪 Results: ${passed} passed, ${failed} failed (total ${passed + failed})`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

process.exit(failed > 0 ? 1 : 0);
