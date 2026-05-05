'use strict';

/**
 * @deprecated — recolor 방식으로 전환됨 (lib/recolorStar.js 사용)
 * 이 파일은 삭제하지 않음. 기존 add-star 로직 보존용.
 * 신규 코드에서 호출 금지.
 */

const fs   = require('fs');
const path = require('path');

const CONFIG = path.join(__dirname, '..', '..', '..', 'config', 'thumbnail');

let _colorMap     = null;
let _intensityMap = null;

function _loadMaps() {
  if (!_colorMap) {
    _colorMap     = JSON.parse(fs.readFileSync(path.join(CONFIG, 'star-color-map.json'), 'utf-8'));
    _intensityMap = JSON.parse(fs.readFileSync(path.join(CONFIG, 'star-intensity-map.json'), 'utf-8'));
  }
}

// 5-pointed star SVG path (cx/cy: center, R: outer radius)
function _starPath(cx, cy, R) {
  const r   = R * 0.38;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI / 5) - Math.PI / 2;
    const rad   = i % 2 === 0 ? R : r;
    pts.push(`${(cx + rad * Math.cos(angle)).toFixed(2)},${(cy + rad * Math.sin(angle)).toFixed(2)}`);
  }
  return 'M ' + pts.join(' L ') + ' Z';
}

/**
 * drawStar(imageBuffer, x, y, emotion) → Buffer
 *
 * Composites a gemstone-colored star (2 layers: outer halo + inner body)
 * onto imageBuffer. Reads color and intensity from config maps.
 *
 * Throws if emotion is RESERVED (passion/ruby).
 */
async function drawStar(imageBuffer, x, y, emotion) {
  const sharp = require('sharp');
  _loadMaps();

  const color     = _colorMap[emotion];
  const intensity = _intensityMap[emotion];

  if (!color || !intensity) {
    throw new Error(`Unknown emotion: "${emotion}"`);
  }
  if (color._reserved || intensity._reserved) {
    throw new Error(`Emotion "${emotion}" is RESERVED — excluded from MVP samples.`);
  }

  const { width: W, height: H } = await sharp(imageBuffer).metadata();
  const { radius, blur, opacity } = intensity;
  const d = _starPath(x, y, radius);

  // Layer 1: wide outer halo (glow color, high blur, low opacity)
  // Layer 2: inner star body (hex color, standard glow, full opacity)
  const haloBlur  = (blur * 1.8).toFixed(1);
  const haloAlpha = (opacity * 0.32).toFixed(2);

  const svg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="halo" x="-90%" y="-90%" width="280%" height="280%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${haloBlur}"/>
    </filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <path d="${d}" fill="${color.glow}" filter="url(#halo)" opacity="${haloAlpha}"/>
  <path d="${d}" fill="${color.hex}"  filter="url(#glow)" opacity="${opacity}"/>
</svg>`
  );

  return sharp(imageBuffer)
    .composite([{ input: svg, blend: 'over' }])
    .png()
    .toBuffer();
}

module.exports = { drawStar };
