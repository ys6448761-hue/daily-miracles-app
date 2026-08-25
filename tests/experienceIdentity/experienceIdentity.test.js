/**
 * Experience Identity P0 테스트
 * - Experience 모델 정의 검증
 * - Scene Resolver 로직 검증
 * - Validator 로직 검증
 */

const {
  ExperienceType,
  ExperienceSource,
  ExperiencePriority,
  ExperienceToScene,
  SKUToDefaultExperience
} = require('../../config/experienceIdentity');

const { resolveScene, sceneToPromptBuilder } = require('../../services/sceneResolver');
const { validateExperienceSchema, getDefaultExperiences } = require('../../services/experienceValidator');

console.log('\n' + '═'.repeat(70));
console.log('EXPERIENCE IDENTITY P0 — TEST SUITE');
console.log('═'.repeat(70) + '\n');

// Test 1: Experience Type 정의 확인
console.log('TEST 1: Experience Type 정의');
console.log('─'.repeat(70));
const expectedTypes = [
  'STARLIGHT_ROUTE',
  'AQUA_ADDON',
  'CABLECAR_TICKET',
  'CRUISE_TICKET',
  'CABLECAR_PHOTO_EXPERIENCE'
];

let pass = 0;
let fail = 0;

expectedTypes.forEach(type => {
  if (ExperienceType[type] === type) {
    console.log(`✓ ${type}`);
    pass++;
  } else {
    console.log(`✗ ${type} missing`);
    fail++;
  }
});

// Test 2: Experience Source 정의 확인
console.log('\nTEST 2: Experience Source 정의');
console.log('─'.repeat(70));
const expectedSources = ['PURCHASE', 'GIFT', 'PARTNERSHIP', 'SYSTEM_DEFAULT'];
expectedSources.forEach(source => {
  if (ExperienceSource[source] === source) {
    console.log(`✓ ${source}`);
    pass++;
  } else {
    console.log(`✗ ${source} missing`);
    fail++;
  }
});

// Test 3: Scene Resolver — Empty Input
console.log('\nTEST 3: Scene Resolver — Empty Input');
console.log('─'.repeat(70));
const emptyResult = resolveScene([], 'test-rid');
if (emptyResult.scene === 'YEOSU_ORIGIN' && emptyResult.reason === 'empty_experiences') {
  console.log(`✓ Empty array → YEOSU_ORIGIN (reason: ${emptyResult.reason})`);
  pass++;
} else {
  console.log(`✗ Expected YEOSU_ORIGIN, got ${emptyResult.scene}`);
  fail++;
}

// Test 4: Scene Resolver — Single Experience
console.log('\nTEST 4: Scene Resolver — Single Experience');
console.log('─'.repeat(70));
const aquaExp = [{ type: ExperienceType.AQUA_ADDON, source: ExperienceSource.SYSTEM_DEFAULT }];
const aquaResult = resolveScene(aquaExp, 'test-rid');
if (aquaResult.scene === 'AQUA_SCENE' && aquaResult.appliedExperience.type === ExperienceType.AQUA_ADDON) {
  console.log(`✓ AQUA_ADDON → AQUA_SCENE`);
  pass++;
} else {
  console.log(`✗ Expected AQUA_SCENE, got ${aquaResult.scene}`);
  fail++;
}

// Test 5: Scene Resolver — Priority (CABLECAR > AQUA)
console.log('\nTEST 5: Scene Resolver — Priority Order');
console.log('─'.repeat(70));
const mixedExp = [
  { type: ExperienceType.AQUA_ADDON, source: ExperienceSource.SYSTEM_DEFAULT },
  { type: ExperienceType.CABLECAR_TICKET, source: ExperienceSource.SYSTEM_DEFAULT }
];
const priorityResult = resolveScene(mixedExp, 'test-rid');
if (priorityResult.scene === 'CABLECAR_SCENE' && priorityResult.appliedExperience.type === ExperienceType.CABLECAR_TICKET) {
  console.log(`✓ [AQUA, CABLECAR] → CABLECAR_SCENE (priority wins)`);
  pass++;
} else {
  console.log(`✗ Expected CABLECAR_SCENE, got ${priorityResult.scene}`);
  fail++;
}

// Test 6: Scene Resolver — Null/Undefined Filtering
console.log('\nTEST 6: Scene Resolver — Null/Undefined Handling');
console.log('─'.repeat(70));
const messy = [
  null,
  { type: ExperienceType.AQUA_ADDON, source: ExperienceSource.SYSTEM_DEFAULT },
  undefined
];
const messyResult = resolveScene(messy, 'test-rid');
if (messyResult.scene === 'AQUA_SCENE') {
  console.log(`✓ [null, AQUA, undefined] → AQUA_SCENE (null/undefined filtered)`);
  pass++;
} else {
  console.log(`✗ Expected AQUA_SCENE, got ${messyResult.scene}`);
  fail++;
}

// Test 7: sceneToPromptBuilder Mapping
console.log('\nTEST 7: Scene → Prompt Builder Mapping');
console.log('─'.repeat(70));
const sceneMappings = {
  'YEOSU_ORIGIN': 'buildYeosuWishPrompt',
  'AQUA_SCENE': 'buildAquaWishPrompt',
  'CABLECAR_SCENE': 'buildCablecarWishPrompt',
  'CRUISE_SCENE': 'buildCruiseWishPrompt',
  'CABLECAR_PHOTO_SCENE': 'buildCablecarPhotoWishPrompt'
};

Object.entries(sceneMappings).forEach(([scene, builderName]) => {
  const mapped = sceneToPromptBuilder(scene);
  if (mapped === builderName) {
    console.log(`✓ ${scene} → ${builderName}`);
    pass++;
  } else {
    console.log(`✗ ${scene} expected ${builderName}, got ${mapped}`);
    fail++;
  }
});

// Test 8: Experience Schema Validation — Valid
console.log('\nTEST 8: Schema Validation — Valid Experience');
console.log('─'.repeat(70));
const validExp = {
  type: ExperienceType.AQUA_ADDON,
  source: ExperienceSource.PURCHASE,
  order_id: 'PAY20260825ABC123'
};
const schemaValid = validateExperienceSchema(validExp);
if (schemaValid.valid === true && schemaValid.errors.length === 0) {
  console.log(`✓ Valid experience passes validation`);
  pass++;
} else {
  console.log(`✗ Validation failed: ${schemaValid.errors.join(', ')}`);
  fail++;
}

// Test 9: Experience Schema Validation — Missing order_id
console.log('\nTEST 9: Schema Validation — Missing order_id for PURCHASE');
console.log('─'.repeat(70));
const invalidExp = {
  type: ExperienceType.AQUA_ADDON,
  source: ExperienceSource.PURCHASE
  // order_id missing
};
const schemaInvalid = validateExperienceSchema(invalidExp);
if (schemaInvalid.valid === false && schemaInvalid.errors.some(e => e.includes('order_id'))) {
  console.log(`✓ Missing order_id caught (error: ${schemaInvalid.errors[0]})`);
  pass++;
} else {
  console.log(`✗ Should have caught missing order_id`);
  fail++;
}

// Test 10: Default Experience from SKU
console.log('\nTEST 10: Default Experience from SKU');
console.log('─'.repeat(70));
const defaultExps = getDefaultExperiences('YW_BASIC_7', ExperienceSource.SYSTEM_DEFAULT);
if (Array.isArray(defaultExps) && defaultExps.length > 0 &&
    defaultExps[0].type === ExperienceType.STARLIGHT_ROUTE &&
    defaultExps[0].source === ExperienceSource.SYSTEM_DEFAULT) {
  console.log(`✓ YW_BASIC_7 → STARLIGHT_ROUTE`);
  pass++;
} else {
  console.log(`✗ Expected STARLIGHT_ROUTE from YW_BASIC_7`);
  fail++;
}

// Summary
console.log('\n' + '═'.repeat(70));
console.log(`RESULTS: ${pass} PASS, ${fail} FAIL`);
console.log('═'.repeat(70) + '\n');

if (fail === 0) {
  console.log('✅ ALL TESTS PASSED\n');
  process.exit(0);
} else {
  console.log(`❌ ${fail} TEST(S) FAILED\n`);
  process.exit(1);
}
