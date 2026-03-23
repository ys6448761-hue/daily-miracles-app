/**
 * Aurora Assembler
 * u1.mp4 ~ u6.mp4 → final_rough_concat.mp4 → final_30s.mp4
 *
 * B안 고정 전환 정책:
 *   u1→u2: HOLD_THEN_DISSOLVE
 *   u2→u3: DISSOLVE_300
 *   u3→u4: DISSOLVE_300
 *   u4→u5: DISSOLVE_300
 *   u5→u6: HOLD_THEN_DISSOLVE
 */

const fs   = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// B안 고정 전환 (인덱스 = transition i)
const DEFAULT_TRANSITIONS = [
  'HOLD_THEN_DISSOLVE', // u1→u2  (i=0)
  'DISSOLVE_300',       // u2→u3  (i=1)
  'DISSOLVE_300',       // u3→u4  (i=2)
  'DISSOLVE_300',       // u4→u5  (i=3)
  'HOLD_THEN_DISSOLVE', // u5→u6  (i=4)
];

const XFADE_DURATION = 0.3;

/**
 * Continuity filter_complex 문자열 생성
 *
 * offset 계산 공식 (spec B안):
 *   DISSOLVE_300:      offset = (i+1)*5 - 0.25
 *   HOLD_THEN_DISSOLVE: offset = (i+1)*5
 *
 * 최종 output duration = offset_last + 5 ≈ 30s
 *
 * @param {number}   unitCount    유닛 수 (6)
 * @param {string[]} transitions  전환 모드 배열 (length = unitCount - 1)
 * @returns {string}              filter_complex 문자열
 */
function buildAssembleFilter(unitCount, transitions) {
  if (transitions.length !== unitCount - 1) {
    throw new Error(
      `transitions.length(${transitions.length}) must equal unitCount-1(${unitCount - 1})`
    );
  }

  let filter    = '';
  let prevLabel = '[0:v]';

  for (let i = 0; i < transitions.length; i++) {
    const mode = transitions[i];

    let offset;
    if (mode === 'DISSOLVE_300') {
      offset = (i + 1) * 5 - 0.25;
    } else if (mode === 'HOLD_THEN_DISSOLVE') {
      offset = (i + 1) * 5;
    } else {
      // NONE / unknown → hard-cut (offset past A.duration = no transition)
      offset = (i + 1) * 5 + 100;
    }

    const nextLabel = `[${i + 1}:v]`;
    const isLast    = i === transitions.length - 1;
    const outLabel  = isLast ? '[xfinal]' : `[x${i}]`;

    filter +=
      `${prevLabel}${nextLabel}` +
      `xfade=transition=dissolve:duration=${XFADE_DURATION}:offset=${offset}` +
      `${outLabel};`;

    prevLabel = outLabel;
  }

  // 마지막: format=yuv420p[v]
  filter += `${prevLabel}format=yuv420p[v]`;

  return filter;
}

/**
 * Rough concat — 전환 없이 u1~uN 이어붙이기
 *
 * @param {string[]} unitPaths  각 유닛 mp4 경로 배열 (순서대로)
 * @param {string}   outPath   출력 mp4 경로
 */
function roughConcat(unitPaths, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  // concat list 파일 (ffmpeg -f concat 용)
  const listPath = outPath.replace(/\.mp4$/, '_list.txt');
  const listLines = unitPaths.map(p => `file '${p.replace(/\\/g, '/')}'`);
  fs.writeFileSync(listPath, listLines.join('\n'), 'utf-8');

  const args = [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', listPath,
    '-c', 'copy',
    outPath,
  ];

  try {
    execFileSync('ffmpeg', args, { stdio: 'pipe' });
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString().slice(-3000) : err.message;
    throw new Error(`roughConcat FFmpeg error:\n${stderr}`);
  } finally {
    try { fs.unlinkSync(listPath); } catch { /* ignore */ }
  }
}

/**
 * Continuity assemble — xfade 전환 적용
 *
 * @param {string[]} unitPaths    각 유닛 mp4 경로 배열
 * @param {string[]} transitions  전환 모드 배열 (DEFAULT_TRANSITIONS 사용 가능)
 * @param {string}   outPath      출력 mp4 경로
 */
function continuityAssemble(unitPaths, transitions, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const filterComplex = buildAssembleFilter(unitPaths.length, transitions);
  const inputArgs     = unitPaths.flatMap(p => ['-i', p]);

  const args = [
    '-y',
    ...inputArgs,
    '-filter_complex', filterComplex,
    '-map', '[v]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'medium',
    '-movflags', '+faststart',
    outPath,
  ];

  try {
    execFileSync('ffmpeg', args, { stdio: 'pipe' });
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString().slice(-3000) : err.message;
    throw new Error(`continuityAssemble FFmpeg error:\n${stderr}`);
  }
}

module.exports = {
  roughConcat,
  continuityAssemble,
  buildAssembleFilter,
  DEFAULT_TRANSITIONS,
};
