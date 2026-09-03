#!/usr/bin/env node
'use strict';
/**
 * generate-hamel-star-cache.js
 * Hamel Lighthouse Star Cache — Stage 3
 *
 * 최종 구조:
 *   public/images/star-cache/yeosu_hamel/
 *     01_confusion_citrine_yeosu_hamel_stage3.png   ← 신규 생성 (20장)
 *     ...
 *     hamel_base_02_left.png                        ← 원본 anchor (수정 금지)
 *     hamel_base_03_right.png
 *     hamel_base_04_low.png
 *     hamel_base_05_wide.png
 *     hamel_pause_sapphire_01.png
 *     failed/
 *
 * 앵커 슬롯 (생성 제외):
 *   06_confusion_sapphire  → hamel_base_02_left.png
 *   07_pause_sapphire      → hamel_pause_sapphire_01.png
 *   13_calm_emerald        → hamel_base_05_wide.png
 *   19_curiosity_ruby      → hamel_base_04_low.png
 *   25_fragile_hope_diamond → hamel_base_03_right.png
 *
 * 사용법:
 *   node scripts/generate-hamel-star-cache.js --status
 *   node scripts/generate-hamel-star-cache.js --step=1              앵커 확인
 *   node scripts/generate-hamel-star-cache.js --step=2 [--dry-run]  confusion 4장
 *   node scripts/generate-hamel-star-cache.js --step=3 [--dry-run]  pause 4장
 *   node scripts/generate-hamel-star-cache.js --step=4 [--dry-run]  calm 4장
 *   node scripts/generate-hamel-star-cache.js --step=5 [--dry-run]  curiosity 4장
 *   node scripts/generate-hamel-star-cache.js --step=6 [--dry-run]  fragile_hope 4장
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');

// ── CLI ──────────────────────────────────────────────────────────
const argv    = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const STATUS  = argv.includes('--status');
const stepArg = argv.find(a => a.startsWith('--step='));
const STEP    = stepArg ? parseInt(stepArg.replace('--step=', ''), 10) : null;

// ── 경로 ─────────────────────────────────────────────────────────
const ROOT    = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'star-cache', 'yeosu_hamel');

// ── API 설정 ──────────────────────────────────────────────────────
const MODEL      = process.env.DREAMTOWN_IMAGE_MODEL || 'gpt-image-1';
const IMAGE_SIZE = '1024x1024';
const COST_PER   = 0.04;

// ── 앵커 슬롯 (생성 제외) ─────────────────────────────────────────
// 원본 anchor 파일은 이미 OUT_DIR에 존재. 번호 복사 없음.
const ANCHOR_NUMS = new Set([6, 7, 13, 19, 25]);

const ANCHOR_FILES = [
  { num: 6,  emotion: 'confusion',    gemstone: 'sapphire', file: 'hamel_base_02_left.png'      },
  { num: 7,  emotion: 'pause',        gemstone: 'sapphire', file: 'hamel_pause_sapphire_01.png' },
  { num: 13, emotion: 'calm',         gemstone: 'emerald',  file: 'hamel_base_05_wide.png'      },
  { num: 19, emotion: 'curiosity',    gemstone: 'ruby',     file: 'hamel_base_04_low.png'       },
  { num: 25, emotion: 'fragile_hope', gemstone: 'diamond',  file: 'hamel_base_03_right.png'     },
];

// ── 25슬롯 정의 (보석군 × 감정) ───────────────────────────────────
const SLOT_ORDER = [
  { num:  1, emotion: 'confusion',    gemstone: 'citrine'  },
  { num:  2, emotion: 'pause',        gemstone: 'citrine'  },
  { num:  3, emotion: 'calm',         gemstone: 'citrine'  },
  { num:  4, emotion: 'curiosity',    gemstone: 'citrine'  },
  { num:  5, emotion: 'fragile_hope', gemstone: 'citrine'  },
  { num:  6, emotion: 'confusion',    gemstone: 'sapphire' },  // ANCHOR
  { num:  7, emotion: 'pause',        gemstone: 'sapphire' },  // ANCHOR
  { num:  8, emotion: 'calm',         gemstone: 'sapphire' },
  { num:  9, emotion: 'curiosity',    gemstone: 'sapphire' },
  { num: 10, emotion: 'fragile_hope', gemstone: 'sapphire' },
  { num: 11, emotion: 'confusion',    gemstone: 'emerald'  },
  { num: 12, emotion: 'pause',        gemstone: 'emerald'  },
  { num: 13, emotion: 'calm',         gemstone: 'emerald'  },  // ANCHOR
  { num: 14, emotion: 'curiosity',    gemstone: 'emerald'  },
  { num: 15, emotion: 'fragile_hope', gemstone: 'emerald'  },
  { num: 16, emotion: 'confusion',    gemstone: 'ruby'     },
  { num: 17, emotion: 'pause',        gemstone: 'ruby'     },
  { num: 18, emotion: 'calm',         gemstone: 'ruby'     },
  { num: 19, emotion: 'curiosity',    gemstone: 'ruby'     },  // ANCHOR
  { num: 20, emotion: 'fragile_hope', gemstone: 'ruby'     },
  { num: 21, emotion: 'confusion',    gemstone: 'diamond'  },
  { num: 22, emotion: 'pause',        gemstone: 'diamond'  },
  { num: 23, emotion: 'calm',         gemstone: 'diamond'  },
  { num: 24, emotion: 'curiosity',    gemstone: 'diamond'  },
  { num: 25, emotion: 'fragile_hope', gemstone: 'diamond'  },  // ANCHOR
];

const STEP_EMOTION = { 2: 'confusion', 3: 'pause', 4: 'calm', 5: 'curiosity', 6: 'fragile_hope' };

function destFilename(num, emotion, gemstone) {
  return `${String(num).padStart(2, '0')}_${emotion}_${gemstone}_yeosu_hamel_stage3.png`;
}

// ── 보석별 별 색 ──────────────────────────────────────────────────
const STAR_SPEC = {
  citrine:  'a small warm citrine-golden star in the upper sky — amber-gold shimmer, dim and unobtrusive',
  sapphire: 'a small sapphire-blue star — deep clear blue point of light, still and steady',
  emerald:  'a small emerald-teal star — soft cool-green shimmer, quiet',
  ruby:     'a small deep ruby-red star — contained, not neon, a quiet red point only',
  diamond:  'a small diamond-white star — barely visible, transparent radiance, tender',
};

// ── SSOT 씬 베이스 ────────────────────────────────────────────────
// 앵커 5장 비주얼 기준: 야경 방파제, 빨간 등대, 하멜등대 흰색 텍스트, 여수 밤바다
const SCENE_BASE =
`2D watercolor illustration. Soft Ghibli-inspired Korean emotional animation style.
Korean indie animation background art — painterly, layered, emotionally quiet.
NOT photorealistic. NOT 3D render. NOT tourism advertisement. NOT movie poster.

[PLACE — 하멜등대 (Hamel Lighthouse), Yeosu, Korea — nighttime]
Scene: A long stone breakwater pier extends straight into Yeosu harbor at night.
At the far end of the pier stands a tall cylindrical RED lighthouse.

LIGHTHOUSE (critical, must match exactly):
  • Color: deep red / crimson — NOT brown, NOT orange, NOT any other color
  • Shape: tall cylindrical tower with lantern room at top
  • Text: "하멜등대" painted vertically on the lighthouse body
    - Text color: pure WHITE (#FFFFFF) — NOT red, NOT yellow, NOT orange, NOT black
    - Text orientation: vertical (top-to-bottom Korean text)
    - Text style: clean, simple Korean gothic — NOT decorative, NOT brush stroke
    - Text position: center of lighthouse body, clearly visible
    - Text weight: medium — NOT too thin, NOT too thick

PIER:
  • Long stone/concrete breakwater pier extending from foreground to lighthouse
  • Iron railings along both sides — warm red-toned iron railings
  • Stone surface, slightly textured

CHARACTER:
  • A young Korean woman seen entirely from behind
  • Long dark hair (shoulder length or longer)
  • Cream or white top, blue-gray skirt
  • Standing or walking slowly on the pier
  • NEVER showing face, NEVER facing camera

BACKGROUND:
  • Yeosu city lights glowing warmly on both sides of the harbor (distant)
  • Deep blue Yeosu night sea on both sides of the pier
  • Night sky with stars
  • Mountains or city silhouette faintly visible in far background

STYLE RULES:
  • 2D watercolor + Ghibli emotional animation quality
  • Korean indie animation aesthetic
  • Soft grain texture, layered paint feel
  • Square format (1:1)

ABSOLUTE DO NOT:
  • Recolor lighthouse (must stay deep red/crimson)
  • Change "하멜등대" text to English, numbers, or any other language
  • Make "하멜등대" text any color other than WHITE
  • Delete or hide the "하멜등대" text
  • Use decorative or brush-stroke font for the text
  • Tourism poster aesthetic
  • Travel advertisement framing
  • Photorealistic, 3D render, CGI
  • Multiple people
  • Person facing camera or showing face
  • Neon colors, cyberpunk, SF elements
  • Purple fantasy sky, magical atmosphere, cosmic glow
  • Dramatic cinematic lens flare
  • Over-saturated sky
  • Glossy AI texture
  • Movie poster lighting`;

// ── 감정별 프롬프트 ────────────────────────────────────────────────
const EMOTION_SPECS = {

  confusion: {
    star: `Star visibility: very faint or absent — the night is heavy and uncertain.
If a star appears, it is barely there: a dim, uncertain point in the upper corner of the sky.
The star does NOT dominate. It may be almost invisible.`,
    emotion:
`[EMOTION — confusion: 방향이 없는 공기]
The atmosphere is heavy. A faint haze softens the scene.
Direction is unclear — the lighthouse stands there but does not guide yet.
The person on the pier has not decided to walk forward. The weight of not knowing.
City lights are distant and blurred. The sea absorbs everything quietly.
The air is still and directionless — heavy quiet, like standing in the middle of a thought.
No warmth. No resolution. Only the weight of now.`,
    negative: `clarity, hopeful direction, warm resolution, confident walking, lighthouse as guide, cheerful atmosphere, tourism feel, bright colors, magical glow`,
  },

  pause: {
    star: `Star visibility: very faint — a single dim point of light in the upper sky.
Barely there, not calling out, not glowing dramatically.
The star exists but does not announce itself.`,
    emotion:
`[EMOTION — pause: 조용히 멈춘 순간]
The person stands completely still on the pier. Not waiting urgently — simply stopped.
The sea has calmed. The lighthouse pulses with its quiet, mechanical rhythm.
A held breath. Nothing is about to happen. The world is not asking anything.
The pier extends ahead but there is no momentum. Only the steady pulse of night air.
City lights reflect softly on the water. No drama. No expectation.`,
    negative: `urgent waiting, rushing, momentum, walking toward destination, warm glow overflow, tourism night panorama, picturesque harbor scene, romance lighting`,
  },

  calm: {
    star: `Star visibility: gently present — a soft, quiet point of light in the night sky.
Not dramatic, not centered. It is simply there, unhurried.
The star exists like a slow exhale.`,
    emotion:
`[EMOTION — calm: 이 순간이 충분하다]
The night is open and stable. The sea surface reflects the lighthouse and city lights gently.
The person is settled on the pier — not searching, not waiting urgently.
This moment is enough. The water is undisturbed. The lighthouse stands as it always has.
A sense of simply being — no need for anything else.
The air is clear and still, like after a long exhale.`,
    negative: `hope rising, warmth flooding, arrival feeling, comfort wrapping, resolution, healing warmth, inspiration, nostalgic coziness`,
  },

  curiosity: {
    star: `Star visibility: a soft, uncertain glow in the distance — not a formed star yet.
Something approaching, not arrived. A gentle suggestion at the horizon or upper sky.
The star-glow is subtle and cool — NOT warm, NOT golden, NOT dramatic.`,
    emotion:
`[EMOTION — curiosity: 저 너머에 무언가 있을 것 같은]
The frame opens wider — more sky and sea visible. The horizon is present.
The lighthouse stands ahead or to the side. Beyond it, the horizon stretches.
Far out at sea or in the upper sky: a faint approaching glow — distant, not arrived, not formed.
The pier extends toward the open horizon. The air has slightly lightened.
A quiet question. Not an answer. Not wonder. Not magical.
The feeling of looking toward something you cannot name yet.`,
    negative: `fantasy sky, magical purple atmosphere, cosmic glow, neon star, cyberpunk lighting, spiritual wonder, dramatic revelation, golden magic hour, fantasy wonder, mystical atmosphere, enchanted night, heavenly glow, over-purple sky, galaxy effect, aurora effect, supernatural light`,
  },

  fragile_hope: {
    star: `Star visibility: almost formed — a star shape barely becoming visible in the upper sky.
Still fragile, still in process of forming. Not yet complete. Not yet arrived.
Tender and quiet — the star exists as a whisper, not a statement.`,
    emotion:
`[EMOTION — fragile_hope: 작은 빛이 꺼지지 않고 있다]
The scene is closer — the lighthouse is nearer in the frame.
In the upper sky: something that looks like a star is almost complete.
Almost there. But still fragile. Still becoming. Not yet certain.
The lighthouse beam makes a soft, persistent path on the water — continuing, not stopping.
The person watches this quiet persistence. The light has not gone out.
Everything is still. The hope is real but tender — it might yet fail, and yet it continues.`,
    negative: `star arriving or completing, sunrise, warmth flooding, certainty, lighthouse saved me, hope fulfilled, triumphant atmosphere, resolved feeling`,
  },
};

// ── 구도 variation (앵커 제외 4슬롯 × 감정) ──────────────────────
// 순서: 각 감정의 생성 슬롯 (앵커 제외, 보석군 순서)
const COMPOSITIONS = {
  // confusion 생성 슬롯: citrine(01), emerald(11), ruby(16), diamond(21)
  confusion: [
    `Wide shot. The long stone pier extends from the near foreground straight to the lighthouse in the distance. The person stands near the beginning of the pier — small, not yet committed to walking forward. The pier symmetry creates a path that has no answer yet. Open heavy sky above.`,
    `Medium shot. The person stands at a railing section of the pier, positioned slightly off-center. The lighthouse is visible further ahead to one side. The sea is visible on the other side. The composition feels slightly unbalanced — no clear direction.`,
    `Long shot. Full pier length visible from behind. The person is in the lower-middle, small. The red lighthouse is far ahead at pier's end. The symmetry of the pier and railings creates a corridor leading to an uncertain destination.`,
    `Medium-close. The person stands at the first railing section, near the beginning of the pier. The lighthouse is visible in the distance. Not yet walking. The city lights blur behind. The beginning of not knowing where to go.`,
  ],

  // pause 생성 슬롯: citrine(02), emerald(12), ruby(17), diamond(22)
  pause: [
    `Centered composition. The person stands midway on the pier — equidistant between shore and lighthouse. Completely still. The pier extends equally in both directions. No momentum. The night simply continues around the stillness.`,
    `Slightly wide. The pier railings extend in both directions from the person's position. The person stands at a railing, arms at sides, unmoving. The water reflects city lights in two long quiet lines on either side.`,
    `Medium. Person slightly left-of-center. The lighthouse occupies the right portion at a comfortable distance. The sea between them is calm. A quiet separation — not approaching, just stopped in the middle of the night.`,
    `Wide shot. The person is small, centered in the middle of the long pier. The sky fills the upper 55% of the frame. The pier and sea divide the lower portion. The person is a still comma inside the quiet world.`,
  ],

  // calm 생성 슬롯: citrine(03), sapphire(08), ruby(18), diamond(23)
  calm: [
    `Wide symmetric. The pier leads centered to the lighthouse. City lights equal on both sides. Person at lower-center, small and settled. The night is expansive. No urgency anywhere in the frame.`,
    `Medium. Person slightly left of center. The right side of the pier shows gentle water reflection from city lights. The lighthouse stands steadily ahead. The reflections are soft bands of color. This moment is complete.`,
    `Medium with water emphasis. The pier edge is visible, and the sea beside it shows calm mirror-like city light reflections. The person stands quietly. The lighthouse is in the frame but not commanding it. Stillness.`,
    `Very wide. Person small in lower-left. Lighthouse in right-center of frame. Night sea spreads across the middle. City lights glow warmly on both distant horizons. The world is large and unhurried.`,
  ],

  // curiosity 생성 슬롯: citrine(04), sapphire(09), emerald(14), diamond(24)
  curiosity: [
    `Medium-wide. The person is further along the pier — closer to the lighthouse now. The sky opens wide in the upper portion of the frame. A very faint, uncertain distant glow is barely visible far ahead or high in the sky. A quiet question.`,
    `Wide with horizon emphasis. The pier extends ahead, person small in lower portion. The sea horizon is visible beyond the lighthouse. Far at the horizon: a faint approaching glow — very distant, not arrived. Cool and uncertain.`,
    `Side-angle medium. Person at pier railing, turned slightly toward the open sea — looking outward beyond the lighthouse, not directly at it. The open sea and faint horizon take the right portion of frame. The lighthouse partially visible at left.`,
    `Wide, sky-dominant. The sky fills the upper 60% of the frame. A faint soft glow is visible somewhere in the upper sky — not a formed star, a gentle brightening. Cool in tone. The person is small below, the pier and lighthouse in the lower frame.`,
  ],

  // fragile_hope 생성 슬롯: citrine(05), sapphire(10), emerald(15), ruby(20)
  fragile_hope: [
    `Medium-close. The lighthouse is near — the person has walked most of the pier. The "하멜등대" text on the lighthouse is clearly visible. An almost-formed star shape is faintly visible in the upper sky — not yet complete, still fragile. The lighthouse light is soft.`,
    `Medium. Lighthouse at comfortable close distance. At the sea horizon: the faintest suggestion of pre-dawn lightening — barely distinguishable from deep night. A star is almost formed somewhere above. The person watches this fragile persistence. Everything still.`,
    `Wide. Full pier and lighthouse both visible. In the upper night sky: a star form that is almost — but not yet — complete. The lighthouse beam traces softly across the water. The person is small but the scene holds quiet persistence.`,
    `Intimate medium. Person stands close to the lighthouse base area. The "하멜등대" text on the lighthouse body is large and present. Above: a tender, barely-formed star — fragile, not gone. The lighthouse glow and the star glow persist together.`,
  ],
};

// ── 유틸 ─────────────────────────────────────────────────────────
function ts() {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }).replace(',', '');
}
function log(lv, msg) { console.log(`[${ts()}] [${lv}] ${msg}`); }

function buildPrompt(slot, compositionHint) {
  const spec = EMOTION_SPECS[slot.emotion];
  const star = STAR_SPEC[slot.gemstone];
  return `${SCENE_BASE}

[COMPOSITION]
${compositionHint}

[STAR — ${slot.gemstone.toUpperCase()}]
${spec.star}
Star gemstone color when visible: ${star}

${spec.emotion}

[PRESENCE RULE]
The world breathes. The person remains like a memory.
Sea, sky, lighthouse breathe. The person does NOT act.
No gesture, no emotional expression, no performance.
Only the night air passes through.

NEGATIVE: ${spec.negative}, photorealistic, 3D render, movie poster, dramatic cinematic lighting, lens flare, purple fantasy, neon, cyberpunk, over-saturated, text other than hamel text, watermark, logo, multiple people, person facing camera, glossy AI texture, tourism poster, travel advertisement, fantasy sky, magical atmosphere, cosmic glow`;
}

// ── STEP 1: 앵커 확인 ─────────────────────────────────────────────
function runStep1() {
  log('STEP1', '원본 anchor 5장 확인');
  let allPresent = true;
  for (const a of ANCHOR_FILES) {
    const p = path.join(OUT_DIR, a.file);
    if (fs.existsSync(p)) {
      log('OK', `앵커 존재: ${a.file} (슬롯 ${a.num}: ${a.emotion} × ${a.gemstone})`);
    } else {
      log('MISSING', `앵커 없음: ${a.file}`);
      allPresent = false;
    }
  }
  if (allPresent) {
    log('STEP1', '앵커 5장 모두 확인. STEP 2부터 생성 진행 가능.');
  } else {
    log('ERROR', '앵커 파일 누락. star-cache/yeosu_hamel/ 폴더에 앵커를 먼저 배치할 것.');
    process.exit(1);
  }
  console.log('');
  printStatus();
}

// ── STEP 2-6: 감정별 생성 ─────────────────────────────────────────
async function runGenerateStep(stepNum) {
  const emotion = STEP_EMOTION[stepNum];
  if (!emotion) { log('ERROR', `알 수 없는 step: ${stepNum}`); process.exit(1); }

  const slotsForEmotion = SLOT_ORDER.filter(s => s.emotion === emotion && !ANCHOR_NUMS.has(s.num));
  log(`STEP${stepNum}`, `감정: ${emotion} — 생성 대상 ${slotsForEmotion.length}장 (앵커 슬롯 제외)`);

  const compositions = COMPOSITIONS[emotion] || [];
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, 'failed'), { recursive: true });

  if (!DRY_RUN && !process.env.OPENAI_API_KEY) {
    log('ERROR', 'OPENAI_API_KEY 없음. .env 설정 필요.');
    process.exit(1);
  }

  let totalCost = 0;
  let compIdx   = 0;

  for (const slot of slotsForEmotion) {
    const filename = destFilename(slot.num, slot.emotion, slot.gemstone);
    const outPath  = path.join(OUT_DIR, filename);

    if (fs.existsSync(outPath)) {
      log('SKIP', `이미 존재: ${filename}`);
      compIdx++;
      continue;
    }

    const comp   = compositions[compIdx] || compositions[0] || 'Centered composition. Person lower third facing lighthouse.';
    const prompt = buildPrompt(slot, comp);

    if (DRY_RUN) {
      log('DRY-RUN', `예정: ${filename} | 감정: ${slot.emotion} | 보석: ${slot.gemstone}`);
      log('DRY-RUN', 'PROMPT ↓\n' + prompt.substring(0, 600) + '…\n');
      compIdx++;
      continue;
    }

    log('GEN', `${filename}`);
    const t0 = Date.now();

    try {
      const { OpenAI } = require('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const resp = await client.images.generate({ model: MODEL, prompt, size: IMAGE_SIZE });
      const item = resp.data[0];
      let buf;
      if (item.b64_json) {
        buf = Buffer.from(item.b64_json, 'base64');
      } else if (item.url) {
        buf = await downloadUrl(item.url);
      } else {
        throw new Error('b64_json / url 없음');
      }
      fs.writeFileSync(outPath, buf);
      totalCost += COST_PER;
      log('OK', `${filename} (${((Date.now()-t0)/1000).toFixed(1)}s) — 누적 $${totalCost.toFixed(2)}`);
    } catch (err) {
      log('ERR', `${filename} 실패: ${err.message}`);
    }

    compIdx++;
  }

  if (!DRY_RUN) {
    log(`STEP${stepNum}`, `완료 — $${totalCost.toFixed(2)}`);
    console.log('');
    printStatus();
    console.log('');
    console.log('━━━ 인간 검수 체크리스트 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Q1. 같은 하멜 세계로 보이는가?');
    console.log('  Q2. 빨간 등대가 유지되는가?');
    console.log('  Q3. 하멜등대 텍스트가 흰색 세로형인가?');
    console.log('  Q4. 별빛이 과하지 않은가?');
    console.log(`  Q5. "${emotion}" 감정이 느껴지는가?`);
    console.log('  Q6. 관광 홍보처럼 보이지 않는가?');
    console.log('  Q7. DreamTown 여백과 공기가 남는가?');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (stepNum < 6) {
      console.log(`\n검수 완료 후: node scripts/generate-hamel-star-cache.js --step=${stepNum + 1}`);
    } else {
      console.log('\n검수 완료 후: --status 로 최종 25장 확인');
    }
  }
}

function downloadUrl(url) {
  const https = require('https');
  const http  = require('http');
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end',  () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ── 상태 출력 ─────────────────────────────────────────────────────
function printStatus() {
  console.log('\n── yeosu_hamel Star-Cache 현황 ─────────────────────────────');
  const existing = new Set(
    fs.existsSync(OUT_DIR) ? fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png')) : []
  );

  // 앵커 확인
  console.log('\n[ANCHOR — 원본 5장]');
  for (const a of ANCHOR_FILES) {
    const ok = existing.has(a.file);
    console.log(`  ${ok ? '✅' : '❌'} ${a.file}  (슬롯 ${a.num}: ${a.emotion} × ${a.gemstone})`);
  }

  // 생성 슬롯 확인
  console.log('\n[GENERATED — 신규 20장]');
  const genSlots = SLOT_ORDER.filter(s => !ANCHOR_NUMS.has(s.num));
  let done = 0;
  for (const s of genSlots) {
    const fname = destFilename(s.num, s.emotion, s.gemstone);
    const ok    = existing.has(fname);
    if (ok) done++;
    console.log(`  ${ok ? '✅' : '⏳'} ${fname}`);
  }

  const anchorOk = ANCHOR_FILES.every(a => existing.has(a.file));
  console.log(`\n앵커: ${anchorOk ? '5/5 ✅' : '누락 ❌'} | 생성: ${done}/20`);
  if (anchorOk && done === 20) {
    console.log('🎉 25장 완성! FREEZE 준비 완료.');
  } else if (!anchorOk) {
    console.log('⚠️  앵커 파일 확인 필요 → --step=1');
  } else {
    const nextStep = Object.entries(STEP_EMOTION).find(([, em]) =>
      SLOT_ORDER.filter(s => s.emotion === em && !ANCHOR_NUMS.has(s.num))
               .some(s => !existing.has(destFilename(s.num, s.emotion, s.gemstone)))
    );
    if (nextStep) console.log(`\n다음: node scripts/generate-hamel-star-cache.js --step=${nextStep[0]}`);
  }
  console.log('');
}

// ── 진입점 ────────────────────────────────────────────────────────
async function main() {
  if (STATUS || STEP === null) {
    printStatus();
    if (STEP === null && !STATUS) {
      console.log('사용법:');
      console.log('  --step=1              앵커 5장 확인');
      console.log('  --step=2 [--dry-run]  confusion 4장');
      console.log('  --step=3 [--dry-run]  pause 4장');
      console.log('  --step=4 [--dry-run]  calm 4장');
      console.log('  --step=5 [--dry-run]  curiosity 4장');
      console.log('  --step=6 [--dry-run]  fragile_hope 4장');
      console.log('  --status              현황 확인');
    }
    return;
  }
  if (STEP === 1) { runStep1(); return; }
  if (STEP >= 2 && STEP <= 6) {
    const anchorOk = ANCHOR_FILES.every(a => fs.existsSync(path.join(OUT_DIR, a.file)));
    if (!anchorOk) { log('ERROR', '앵커 미확인 → --step=1 먼저 실행'); process.exit(1); }
    await runGenerateStep(STEP);
    return;
  }
  log('ERROR', `알 수 없는 step: ${STEP}`);
  process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
