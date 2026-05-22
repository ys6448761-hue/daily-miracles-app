'use strict';

/**
 * build-hamel-wish-image.js — 하멜 Sowoni 중심 "소원그림" 프롬프트 빌더
 *
 *   - thumbnail 파이프라인과 분리 (text overlay 금지, "thumbnail" 단어 미사용)
 *   - SSOT: config/wish-image/hamel.json (+ hamel-copy.json) — thumbnail SSOT 재사용 안 함
 *   - 결과: outputs/prompts/wish-image/hamel/{NN}_{emotion}_hamel_prompt.txt
 *
 * DoD: 5장 검수 후 LIMIT 제거하고 25장 확장. 검수 전 LIMIT 변경 금지.
 *
 * 사용:
 *   node scripts/wish-image/build-hamel-wish-image.js
 */

const fs   = require('fs');
const path = require('path');
const { EMOTION_ORDER, promptFilename, normalizeCopy, reclassifyPrompts, getGemstone, getStarColor } = require('../thumbnail/utils');

const ROOT     = path.join(__dirname, '..', '..');
const LOCATION = 'hamel';
const LIMIT    = 5;

const ssot    = require(path.join(ROOT, 'config', 'wish-image', `${LOCATION}.json`));
const copies  = require(path.join(ROOT, 'config', 'wish-image', `${LOCATION}-copy.json`));
const OUT_DIR = path.join(ROOT, 'outputs', 'prompts', 'wish-image', LOCATION);

fs.mkdirSync(OUT_DIR, { recursive: true });
reclassifyPrompts(OUT_DIR, LOCATION, EMOTION_ORDER);

copies.slice(0, LIMIT).forEach((rawCopy, i) => {
  const copy    = normalizeCopy(rawCopy, EMOTION_ORDER[i]);
  const emotion = copy.emotion || EMOTION_ORDER[i];
  const num     = String(i + 1).padStart(2, '0');

  // Emotion-anchored starlight (Visual_Style §8-1 보석 감정색 SSOT)
  // wish-image 전용 override가 있으면 우선, 없으면 thumbnail utils로 fallback
  const override   = (ssot.emotion_overrides || {})[emotion];
  const gem        = override?.gem || getGemstone(emotion);
  const starColor  = getStarColor(emotion) || {};
  const starlight  = override?.starlight || starColor.prompt_desc || starColor.label || 'gentle warm glow';

  const prompt =
`DreamTown Hamel Wish Image illustration. Sowoni-centered, no text overlay.

Aspect ratio: ${ssot.composition.aspect_ratio || '9:16 vertical portrait'}. Tall composition. NEVER square, NEVER landscape.

Scene:
${ssot.scene.description}

Must include:
${ssot.scene.must_include.join(', ')}

Reference SSOT (must follow strictly — Visual_Style §8-1):
- Lighthouse color: solid vivid red — saturated, bold, beacon-like (never faded, never orange-red)
- Lighthouse position: right-of-center as the emotional anchor, prominent but not overwhelming
- Breakwater: straight or natural perspective, with railings on BOTH sides as emotional flow lines
- Camera: low eye-level at breakwater entrance, looking toward the red lighthouse
- Sowoni: in left-foreground on the breakwater path, back view, quietly present (never running, never seeking destination)

Style:
${ssot.style.required.join(', ')}

Do NOT:
${ssot.style.forbidden.join(', ')}

Text policy (CRITICAL):
- Do NOT generate any Korean text, hangul characters, or letters anywhere in the image.
- The lighthouse name plate "하멜등대" will be added as a separate post-processing overlay.
- The lighthouse body must remain clean of any text or markings.

Color:
Sky: ${ssot.color.sky}
Sea: ${ssot.color.sea}
City: ${ssot.color.city}

Star (emotion-anchored — Visual_Style §8-1 별빛 = 보석 감정색):
position: ${ssot.star.position}, brightness ${ssot.star.brightness}, ${ssot.star.glow}.
emotion: ${emotion}  →  gemstone: ${gem}  →  starlight: ${starlight}.
The starlight is the emotional color of this scene — not just a light source.

Composition:
${ssot.composition.flow}.
${ssot.composition.core}.
${ssot.composition.viewpoint || ''}
${(ssot.composition.mood || []).join('\n')}

Emotion:
${emotion}.

Character:
${ssot.character.description}
${ssot.character.rule}

Output rules:
No text overlay. No Korean characters. No caption. No subtitle. No logo. No watermark. No UI element.
2D watercolor illustration only — no 3D, no photorealism.
Vertical 9:16 portrait orientation — tall composition, never square.`.trim();

  const filename = promptFilename(num, emotion, LOCATION);
  fs.writeFileSync(path.join(OUT_DIR, filename), prompt, 'utf-8');
  console.log('created:', filename);
});

console.log(`\nDONE — ${Math.min(copies.length, LIMIT)}개 wish-image 프롬프트 → ${OUT_DIR}`);
console.log('※ DoD: 5장 검수 후 LIMIT 제거하고 25장 확장. 검수 전 LIMIT 변경 금지.');
