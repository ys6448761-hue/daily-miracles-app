'use strict';

/**
 * assemble-storybook-test.js — DreamTown 5페이지 스토리북 조립 테스트
 *
 * SSOT: config/storybook/asset-registry.json
 *
 * 목적: 소원 입력(wish, emotion, gem, journey_type)을 받아
 *       registry에서 5페이지 스토리북 후보를 조립.
 *       실제 이미지 생성 없음 — 조립 결과 JSON 출력.
 *
 * 사용:
 *   node scripts/storybook/assemble-storybook-test.js
 *   node scripts/storybook/assemble-storybook-test.js --input='{"wish":"쉬고 싶어요","emotion":"pause","gem":"sapphire"}'
 *   node scripts/storybook/assemble-storybook-test.js --gem=emerald --emotion=calm
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT          = path.join(__dirname, '..', '..');
const REGISTRY_FILE = path.join(ROOT, 'config', 'storybook', 'asset-registry.json');

if (!fs.existsSync(REGISTRY_FILE)) {
  console.error('❌ asset-registry.json 없음. 먼저 실행하세요:');
  console.error('   node scripts/storybook/build-asset-registry.js');
  process.exit(1);
}

const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
const ASSETS   = registry.assets;

// ─── Emotion / gem vocabulary ────────────────────────────────────────────────
const KNOWN_EMOTIONS  = ['confusion', 'pause', 'calm', 'curiosity', 'fragile_hope'];
const KNOWN_GEMS      = ['moonstone', 'sapphire', 'emerald', 'topaz', 'diamond', 'citrine', 'ruby'];

// Emotion aliases — map free-text emotion to known 5-stage
const EMOTION_ALIASES = {
  tired:            'pause',
  tired_but_holding:'pause',
  exhausted:        'confusion',
  lost:             'confusion',
  uncertain:        'confusion',
  restless:         'confusion',
  settled:          'calm',
  peaceful:         'calm',
  resting:          'calm',
  wondering:        'curiosity',
  anticipating:     'curiosity',
  hoping:           'fragile_hope',
  wishing:          'fragile_hope',
  tentative:        'fragile_hope',
};

// Gem aliases
const GEM_ALIASES = {
  blue:   'sapphire',
  green:  'emerald',
  yellow: 'citrine',
  white:  'diamond',
  grey:   'moonstone',
  gray:   'moonstone',
  red:    'ruby',
  amber:  'topaz',
};

// Page05 type → best page05_type for continuation (by emotion)
const EMOTION_TO_P05_TYPE = {
  confusion:    'emotional_afterflow',
  pause:        'reality_reconnection',
  calm:         'wish_signal_continuation',
  curiosity:    'widened_continuation',
  fragile_hope: 'wish_signal_continuation',
};

// Storybook page structure (fixed)
const STORYBOOK_PAGES = [
  { page: 1, role: 'emotional_pause',    location: 'cafe',     label: '카페 — 멈춤과 내면 고요' },
  { page: 2, role: 'widened_perspective', location: 'cablecar', label: '케이블카 — 넓어진 시야' },
  { page: 3, role: 'wish_signal',        location: 'hamel',    label: '하멜 — 소원 신호' },
  { page: 4, role: 'quiet_reset',        location: 'hotel',    label: '호텔 — 조용한 리셋' },
  { page: 5, role: 'continuity_connector', location: null,     label: '5페이지 — 이어짐' },
];

// ─── Input parsing ───────────────────────────────────────────────────────────
function parseArgs() {
  const args  = process.argv.slice(2);

  // --input='{...}' form
  const inputArg = args.find(a => a.startsWith('--input='));
  if (inputArg) {
    try { return JSON.parse(inputArg.slice(8)); } catch { /* fall through */ }
  }

  // --key=value form
  const get = (key) => {
    const a = args.find(a => a.startsWith(`--${key}=`));
    return a ? a.split('=')[1] : null;
  };

  return {
    wish:         get('wish') || '조금 쉬고 싶어요',
    emotion:      get('emotion') || 'tired_but_holding',
    gem:          get('gem') || 'sapphire',
    journey_type: get('journey_type') || 'wish_journey',
  };
}

function normalizeEmotion(raw) {
  if (!raw) return 'calm';
  const lower = raw.toLowerCase().replace(/-/g, '_');
  if (KNOWN_EMOTIONS.includes(lower)) return lower;
  return EMOTION_ALIASES[lower] || 'calm';
}

function normalizeGem(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (KNOWN_GEMS.includes(lower)) return lower;
  return GEM_ALIASES[lower] || null;
}

// ─── Asset selection ─────────────────────────────────────────────────────────
function selectForPage(pageSpec, emotion, gem) {
  const { location, role } = pageSpec;

  if (role === 'continuity_connector') {
    return selectPage5(emotion, gem);
  }

  // Pages 1-4: prefer canonical_core matching location + gem
  // Priority: canonical_core > base_master > page05_afterflow_candidate
  const candidates = ASSETS.filter(a =>
    a.location === location &&
    a.status === 'active' &&
    a.page_role !== 'text_overlay'
  );

  const score = (a) => {
    let s = 0;
    if (a.page_role === 'canonical_core')            s += 100;
    if (a.page_role === 'base_master')               s += 50;
    if (a.page_role === 'page05_afterflow_candidate') s += 10;
    if (a.gem     === gem)                            s += 30;
    if (a.emotion === emotion)                        s += 20;
    if (a.emotion === 'calm')                         s += 5; // good neutral fallback
    return s;
  };

  const sorted = candidates.slice().sort((a, b) => score(b) - score(a));
  if (!sorted.length) return null;

  const best = sorted[0];
  return {
    asset_id:  best.id,
    file_path: best.file_path,
    location:  best.location,
    page_role: best.page_role,
    emotion:   best.emotion,
    gem:       best.gem,
    match:     {
      gem_match:     best.gem === gem,
      emotion_match: best.emotion === emotion,
    },
  };
}

function selectPage5(emotion, gem) {
  const p05type = EMOTION_TO_P05_TYPE[emotion] || 'emotional_afterflow';

  // Try to find a page05 asset for each location matching the type
  const locationOrder = ['cafe', 'cablecar', 'hamel', 'hotel'];
  const results = [];

  for (const loc of locationOrder) {
    const match = ASSETS.find(a =>
      a.location === loc &&
      a.page_role === 'continuity_connector' &&
      a.page05_type === p05type
    );
    if (match) {
      results.push({
        asset_id:    match.id,
        file_path:   match.file_path,
        location:    match.location,
        page05_type: match.page05_type,
        page_role:   'continuity_connector',
      });
    }
  }

  return results.length > 0 ? results[0] : null;
}

// ─── Assemble ────────────────────────────────────────────────────────────────
function assemble(input) {
  const emotion = normalizeEmotion(input.emotion);
  const gem     = normalizeGem(input.gem);

  const pages = [];
  for (const spec of STORYBOOK_PAGES) {
    const selected = selectForPage(spec, emotion, gem);
    pages.push({
      page:           spec.page,
      role:           spec.role,
      label:          spec.label,
      location:       spec.location || selected?.location,
      asset:          selected,
      ...(spec.page === 5 ? { page05_type: EMOTION_TO_P05_TYPE[emotion] } : {}),
    });
  }

  return {
    input: {
      wish:         input.wish,
      emotion_raw:  input.emotion,
      emotion:      emotion,
      gem:          gem,
      journey_type: input.journey_type || 'wish_journey',
    },
    resolved: {
      emotion_normalized: emotion,
      gem_normalized:     gem,
      page5_type:         EMOTION_TO_P05_TYPE[emotion],
    },
    storybook: pages.map(p => ({
      page:        p.page,
      role:        p.role,
      label:       p.label,
      location:    p.location,
      asset_id:    p.asset?.asset_id || null,
      file_path:   p.asset?.file_path || null,
      emotion:     p.asset?.emotion || null,
      gem:         p.asset?.gem || null,
      page05_type: p.page05_type || p.asset?.page05_type || null,
      match:       p.asset?.match || null,
      usable_for:  p.asset ? ASSETS.find(a => a.id === p.asset.asset_id)?.usable_for : null,
    })),
    registry_stats: {
      total_assets:     registry.assets.length,
      canonical_core:   ASSETS.filter(a => a.page_role === 'canonical_core').length,
      continuity_connector: ASSETS.filter(a => a.page_role === 'continuity_connector').length,
      page05_candidate: ASSETS.filter(a => a.page_role === 'page05_afterflow_candidate').length,
    },
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const input  = parseArgs();
const result = assemble(input);

console.log('═══════════════════════════════════════════════════');
console.log('  DreamTown Storybook Assembler — Test Run');
console.log('═══════════════════════════════════════════════════\n');
console.log('📥 입력:');
console.log(`   wish:         "${result.input.wish}"`);
console.log(`   emotion:      "${result.input.emotion_raw}" → "${result.resolved.emotion_normalized}"`);
console.log(`   gem:          "${result.input.gem}" → "${result.resolved.gem_normalized}"`);
console.log(`   journey_type: "${result.input.journey_type}"`);
console.log(`   page5_type:   "${result.resolved.page5_type}"`);
console.log('\n📖 조립 결과:');

for (const p of result.storybook) {
  const gemMatch = p.match?.gem_match     ? '✅ gem' : '○ gem';
  const emoMatch = p.match?.emotion_match ? '✅ emo' : '○ emo';
  const matchStr = p.match ? `[${gemMatch} ${emoMatch}]` : '';
  console.log(`\n  Page ${p.page} — ${p.label}`);
  console.log(`    location:   ${p.location}`);
  console.log(`    asset_id:   ${p.asset_id || '(없음)'}`);
  if (p.page05_type) console.log(`    p05_type:   ${p.page05_type}`);
  if (p.emotion)     console.log(`    emotion:    ${p.emotion}`);
  if (p.gem)         console.log(`    gem:        ${p.gem}`);
  if (matchStr)      console.log(`    match:      ${matchStr}`);
  if (p.file_path)   console.log(`    path:       ${p.file_path}`);
}

console.log('\n📊 Registry 통계:');
Object.entries(result.registry_stats).forEach(([k, v]) => console.log(`   ${k}: ${v}`));

console.log('\n');
console.log('─── JSON 출력 ───────────────────────────────────────');
console.log(JSON.stringify(result, null, 2));
