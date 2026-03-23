/**
 * Aurora Motion DSL Compiler
 * DSL 문자열 → FFmpeg zoompan/fade filter string
 *
 * 출력 고정: 5초 / 30fps / 1080×1920
 */

const FRAMES = 150; // 5s × 30fps
const SIZE   = '1080x1920';

// ── Base DSL Filters ─────────────────────────────────────────────────────────
// zoompan: z=zoom expression, x/y=crop anchor, d=duration(frames), s=size, fps
const BASE_FILTERS = {
  // 서서히 줌인 (1.0 → 1.1)
  ZIN2: [
    `zoompan=z='min(zoom+0.0015,1.1)'`,
    `x='iw/2-(iw/zoom/2)'`,
    `y='ih/2-(ih/zoom/2)'`,
    `d=${FRAMES}:s=${SIZE}:fps=30`,
  ].join(':'),

  // 서서히 줌아웃 (1.1 → 1.0)
  ZOUT2: [
    `zoompan=z='if(eq(on,1),1.1,max(zoom-0.0015,1.0))'`,
    `x='iw/2-(iw/zoom/2)'`,
    `y='ih/2-(ih/zoom/2)'`,
    `d=${FRAMES}:s=${SIZE}:fps=30`,
  ].join(':'),

  // 왼쪽으로 패닝 (화면이 좌→우 스크롤 느낌)
  PANL2: [
    `zoompan=z=1.05`,
    `x='min(on*0.34,iw-iw/zoom)'`,
    `y='ih/2-(ih/zoom/2)'`,
    `d=${FRAMES}:s=${SIZE}:fps=30`,
  ].join(':'),

  // 위쪽으로 패닝 (화면이 하→상 스크롤 느낌)
  PANT2: [
    `zoompan=z=1.05`,
    `x='iw/2-(iw/zoom/2)'`,
    `y='max(ih/2-(ih/zoom/2)-on*0.31,0)'`,
    `d=${FRAMES}:s=${SIZE}:fps=30`,
  ].join(':'),

  // 호흡 줌 (사인파 파동, 미묘한 원근감)
  BRTH: [
    `zoompan=z='1.02+0.02*sin(2*PI*on/${FRAMES})'`,
    `x='iw/2-(iw/zoom/2)'`,
    `y='ih/2-(ih/zoom/2)'`,
    `d=${FRAMES}:s=${SIZE}:fps=30`,
  ].join(':'),
};

const HOLD_FADE_SUFFIX = ',fade=t=out:st=4.6:d=0.4';

const VALID_BASES = Object.keys(BASE_FILTERS);

/**
 * DSL 문자열 파싱
 * "ZIN2+HOLD_FADE" → { base: "ZIN2", holdFade: true }
 * "BRTH"           → { base: "BRTH", holdFade: false }
 *
 * @param {string} dsl
 * @returns {{ base: string, holdFade: boolean }}
 */
function parseDSL(dsl) {
  if (!dsl || typeof dsl !== 'string') throw new Error('DSL is required (string)');
  const parts    = dsl.split('+').map(p => p.trim());
  const base     = parts[0];
  const holdFade = parts.slice(1).includes('HOLD_FADE');
  return { base, holdFade };
}

/**
 * Base DSL → zoompan filter string
 * @param {string} base
 * @returns {string}
 */
function compileBaseMotion(base) {
  const filter = BASE_FILTERS[base];
  if (!filter) {
    throw new Error(`Unknown base DSL: "${base}". Valid: ${VALID_BASES.join(', ')}`);
  }
  return filter;
}

/**
 * DSL → 완성된 filter string (HOLD_FADE 포함)
 * @param {string} dsl  e.g. "ZIN2", "ZIN2+HOLD_FADE"
 * @returns {string}    FFmpeg -vf 값으로 바로 사용 가능
 */
function motionCompiler(dsl) {
  const { base, holdFade } = parseDSL(dsl);
  let filter = compileBaseMotion(base);
  if (holdFade) filter += HOLD_FADE_SUFFIX;
  return filter;
}

module.exports = { motionCompiler, compileBaseMotion, parseDSL, VALID_BASES };
