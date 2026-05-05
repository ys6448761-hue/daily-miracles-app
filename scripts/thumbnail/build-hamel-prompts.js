'use strict';
// [deprecated] → node scripts/thumbnail/build-thumbnail.js --location hamel
console.warn('⚠️  [deprecated] use: node scripts/thumbnail/build-thumbnail.js --location hamel');

const fs   = require('fs');
const path = require('path');
const { EMOTION_ORDER, promptFilename, normalizeCopy, reclassifyPrompts } = require('./utils');

const ROOT     = path.join(__dirname, '..', '..');
const LOCATION = 'hamel';
const LIMIT    = 5; // DoD 검수 후 제거하고 전체 생성

const ssot    = require(path.join(ROOT, 'config', 'thumbnail', `${LOCATION}.json`));
const copies  = require(path.join(ROOT, 'config', 'thumbnail', `${LOCATION}-copy.json`));
const OUT_DIR = path.join(ROOT, 'outputs', 'prompts', 'thumbnail', LOCATION);

fs.mkdirSync(OUT_DIR, { recursive: true });
reclassifyPrompts(OUT_DIR, LOCATION, EMOTION_ORDER);

copies.slice(0, LIMIT).forEach((rawCopy, i) => {
  const copy    = normalizeCopy(rawCopy, EMOTION_ORDER[i]);
  const emotion = copy.emotion || EMOTION_ORDER[i];
  const lines   = copy.lines;
  const num     = String(i + 1).padStart(2, '0');

  const prompt =
`DreamTown Hamel Lighthouse thumbnail illustration.

Scene:
${ssot.scene.description}

Must include:
${ssot.scene.must_include.join(', ')}

Style:
${ssot.style.required.join(', ')}

Do NOT:
${ssot.style.forbidden.join(', ')}

Color:
Sky: ${ssot.color.sky}
Sea: ${ssot.color.sea}
City: ${ssot.color.city}

Star:
${ssot.star.position}, brightness ${ssot.star.brightness}

Composition:
${ssot.composition.flow}

Emotion:
${emotion}

Character:
Sowoni standing alone facing the sea, quiet and open.
Sowoni is the emotional center. No mascot character.

Text:
"${lines[0]}"
"${lines[1]}"

"${ssot.text.bottom}"`.trim();

  const filename = promptFilename(num, emotion, LOCATION);
  fs.writeFileSync(path.join(OUT_DIR, filename), prompt, 'utf-8');
  console.log('created:', filename);
});

console.log(`\nDONE — ${Math.min(copies.length, LIMIT)}개 프롬프트 → ${OUT_DIR}`);
console.log('※ DoD 검수 후 LIMIT 제거하고 전체 실행');
