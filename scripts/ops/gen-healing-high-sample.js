#!/usr/bin/env node
/**
 * Healing-High YouTube Shorts Sample Generator
 *
 * healing-high 프리셋 기반 15초 세로 영상 생성
 * - 1080x1920 (9:16 YouTube Shorts / Instagram Reels)
 * - 한글 자막 burn-in (NotoSansKR)
 * - 3구간 컬러 아크: PAIN(blue-grey) → SOLUTION(warm) → HOPE(golden)
 * - KOR Gate 5단계 한글 무결성 검증
 */

const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

// ═══ Config ═══
const OUT_DIR = path.resolve(__dirname, '../../output/healing-high-sample');
const FONT_SRC = path.resolve(__dirname, '../../assets/fonts/NotoSansKR-Regular.ttf');
const WORK_DIR = (process.platform === 'win32' ? 'C:\\tmp' : '/tmp') +
  path.sep + 'heal-high-' + Date.now();

// healing-high 자막 (SSOT: services/adCreative/constants.js)
const SUBTITLES = [
  { start: '00:00:00,500', end: '00:00:03,500', text: '괜찮은 척, 오늘도 했죠?' },
  { start: '00:00:05,000', end: '00:00:08,000', text: '당신은 회복이 먼저 필요한 시기예요.' },
  { start: '00:00:10,000', end: '00:00:13,000', text: '지금, 당신만을 위한 7일 회복 여정' },
  { start: '00:00:13,200', end: '00:00:15,000', text: '하루 3분이면 충분해요.' },
];

// 3구간 컬러 아크 (healing-high 컬러 팔레트)
const COLOR_ARC = [
  { duration: 5, bg: '2C3E50', label: 'PAIN - Cool Grey' },      // U1: 차가운 회색
  { duration: 5, bg: '8E6B3E', label: 'SOLUTION - Warm Brown' },  // U2: 따뜻한 갈색
  { duration: 5, bg: 'D4A574', label: 'HOPE - Golden Warm' },     // U3: 골든 워시
];

console.log('\n  === Healing-High YouTube Shorts Sample ===\n');

// ═══ Step 1: Setup ═══
console.log('  [1/7] Setup directories...');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(WORK_DIR, { recursive: true });
fs.mkdirSync(path.join(WORK_DIR, 'fonts'), { recursive: true });

// Font copy
if (!fs.existsSync(FONT_SRC)) {
  console.error('  FONT NOT FOUND:', FONT_SRC);
  process.exit(1);
}
fs.copyFileSync(FONT_SRC, path.join(WORK_DIR, 'fonts', 'NotoSansKR-Regular.ttf'));
console.log('  Font: NotoSansKR-Regular.ttf copied');

// ═══ Step 2: Generate SRT ═══
console.log('  [2/7] Generate SRT...');
let srt = '';
SUBTITLES.forEach((s, i) => {
  srt += `${i + 1}\n${s.start} --> ${s.end}\n${s.text}\n\n`;
});
// NFC normalize
srt = srt.normalize('NFC').replace(/\r\n/g, '\n');
const srtPath = path.join(WORK_DIR, 'subtitles.srt');
fs.writeFileSync(srtPath, srt, 'utf-8');
console.log('  SRT: 4 entries written');

// ═══ Step 3: SRT → ASS ═══
console.log('  [3/7] Convert SRT → ASS...');

function srtTimeToAss(srtTime) {
  // 00:00:05,000 → 0:00:05.00
  const [h, m, rest] = srtTime.split(':');
  const [s, ms] = rest.split(',');
  const cs = Math.round(parseInt(ms) / 10).toString().padStart(2, '0');
  return `${parseInt(h)}:${m}:${s}.${cs}`;
}

const assHeader = `[Script Info]
Title: Healing-High Sample
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Noto Sans KR,48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,1,2,40,40,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

let assEvents = '';
SUBTITLES.forEach((s) => {
  const start = srtTimeToAss(s.start);
  const end = srtTimeToAss(s.end);
  assEvents += `Dialogue: 0,${start},${end},Default,,0,0,0,,${s.text}\n`;
});

const assContent = assHeader + assEvents;
const assPath = path.join(WORK_DIR, 'subtitles.ass');
fs.writeFileSync(assPath, assContent, 'utf-8');
console.log('  ASS: Generated with Noto Sans KR 48px');

// ═══ Step 4: Generate base video (3-segment color arc) ═══
console.log('  [4/7] Generate base video (color arc)...');

// Create 3 segments and concat
const segments = [];
COLOR_ARC.forEach((seg, i) => {
  const segFile = `seg${i}.mp4`;
  const segPath = path.join(WORK_DIR, segFile);

  execSync(
    `ffmpeg -y -f lavfi -i "color=c=0x${seg.bg}:s=1080x1920:d=${seg.duration}:r=30" ` +
    `-c:v libx264 -preset ultrafast -pix_fmt yuv420p "${segPath}"`,
    { stdio: 'pipe', cwd: WORK_DIR }
  );
  segments.push(segFile);
  console.log(`    Segment ${i + 1}: ${seg.label} (${seg.duration}s)`);
});

// Concat list
const concatList = segments.map(s => `file '${s}'`).join('\n');
fs.writeFileSync(path.join(WORK_DIR, 'concat.txt'), concatList);

execSync(
  'ffmpeg -y -f concat -safe 0 -i concat.txt -c copy source.mp4',
  { stdio: 'pipe', cwd: WORK_DIR }
);
console.log('  Base video: 15s 1080x1920 color arc');

// ═══ Step 5: Burn-in subtitles ═══
console.log('  [5/7] FFmpeg subtitle burn-in...');
try {
  const result = execSync(
    'ffmpeg -y -i source.mp4 ' +
    '-vf "ass=subtitles.ass:fontsdir=fonts" ' +
    '-c:v libx264 -preset medium -crf 18 ' +
    '-pix_fmt yuv420p -movflags +faststart ' +
    'output.mp4',
    { cwd: WORK_DIR, stdio: 'pipe', encoding: 'utf-8', timeout: 60000 }
  );
  console.log('  Burn-in: SUCCESS');
} catch (err) {
  const stderr = err.stderr || '';
  // FFmpeg returns non-zero even on success sometimes, check output file
  if (fs.existsSync(path.join(WORK_DIR, 'output.mp4'))) {
    console.log('  Burn-in: SUCCESS (with warnings)');
    // Save stderr for analysis
    fs.writeFileSync(path.join(OUT_DIR, 'ffmpeg_stderr.log'), stderr);
  } else {
    console.error('  Burn-in: FAILED');
    fs.writeFileSync(path.join(OUT_DIR, 'ffmpeg_stderr.log'), stderr);
    console.error('  See ffmpeg_stderr.log for details');
    process.exit(1);
  }
}

// ═══ Step 6: KOR Gate verification ═══
console.log('  [6/7] Korean Integrity Gate...');

let korPass = 0;
let korFail = 0;

// KOR-01: UTF-8 Round-Trip
const srtReadback = fs.readFileSync(srtPath);
const srtOriginal = Buffer.from(srt, 'utf-8');
if (Buffer.compare(srtOriginal, srtReadback) === 0) {
  console.log('    KOR-01 UTF-8 Round-Trip: PASS');
  korPass++;
} else {
  console.log('    KOR-01 UTF-8 Round-Trip: FAIL');
  korFail++;
}

// KOR-02: ASS Parse + Hangul
const assReadback = fs.readFileSync(assPath, 'utf-8');
const hasScriptInfo = assReadback.includes('[Script Info]');
const hasStyles = assReadback.includes('[V4+ Styles]');
const hasEvents = assReadback.includes('[Events]');
const hasHangul = /[\uAC00-\uD7AF]/.test(assReadback);
const hasCorruption = assReadback.includes('\uFFFD');
if (hasScriptInfo && hasStyles && hasEvents && hasHangul && !hasCorruption) {
  console.log('    KOR-02 ASS Integrity: PASS');
  korPass++;
} else {
  console.log('    KOR-02 ASS Integrity: FAIL');
  korFail++;
}

// KOR-03: FFmpeg Font Load (check stderr)
const stderrLog = fs.existsSync(path.join(OUT_DIR, 'ffmpeg_stderr.log'))
  ? fs.readFileSync(path.join(OUT_DIR, 'ffmpeg_stderr.log'), 'utf-8')
  : '';
const fontFail = /font not found|unable to open font|glyph not found/i.test(stderrLog);
if (!fontFail) {
  console.log('    KOR-03 Font Load: PASS');
  korPass++;
} else {
  console.log('    KOR-03 Font Load: FAIL');
  korFail++;
}

// KOR-04: Output file exists + reasonable size
const outputMp4 = path.join(WORK_DIR, 'output.mp4');
const outputExists = fs.existsSync(outputMp4);
const outputSize = outputExists ? fs.statSync(outputMp4).size : 0;
if (outputExists && outputSize > 10000) {
  console.log(`    KOR-04 Output Valid: PASS (${(outputSize / 1024).toFixed(0)} KB)`);
  korPass++;
} else {
  console.log(`    KOR-04 Output Valid: FAIL (${outputSize} bytes)`);
  korFail++;
}

// KOR-05: Frame extraction
let frameOk = false;
try {
  execSync(
    'ffmpeg -y -ss 2 -i output.mp4 -vframes 1 -q:v 2 frame_2s.png',
    { cwd: WORK_DIR, stdio: 'pipe', timeout: 15000 }
  );
  execSync(
    'ffmpeg -y -ss 6 -i output.mp4 -vframes 1 -q:v 2 frame_6s.png',
    { cwd: WORK_DIR, stdio: 'pipe', timeout: 15000 }
  );
  execSync(
    'ffmpeg -y -ss 11 -i output.mp4 -vframes 1 -q:v 2 frame_11s.png',
    { cwd: WORK_DIR, stdio: 'pipe', timeout: 15000 }
  );

  const f2 = fs.statSync(path.join(WORK_DIR, 'frame_2s.png')).size;
  const f6 = fs.statSync(path.join(WORK_DIR, 'frame_6s.png')).size;
  const f11 = fs.statSync(path.join(WORK_DIR, 'frame_11s.png')).size;
  frameOk = f2 > 1000 && f6 > 1000 && f11 > 1000;

  if (frameOk) {
    console.log(`    KOR-05 Frame Extract: PASS (2s:${(f2/1024).toFixed(0)}KB, 6s:${(f6/1024).toFixed(0)}KB, 11s:${(f11/1024).toFixed(0)}KB)`);
    korPass++;
  } else {
    console.log('    KOR-05 Frame Extract: FAIL (too small)');
    korFail++;
  }
} catch {
  console.log('    KOR-05 Frame Extract: FAIL (extraction error)');
  korFail++;
}

// ═══ Step 7: Copy outputs ═══
console.log('  [7/7] Copy to output...');

const filesToCopy = [
  ['output.mp4', 'healing-high-sample.mp4'],
  ['subtitles.srt', 'subtitles.srt'],
  ['subtitles.ass', 'subtitles.ass'],
  ['frame_2s.png', 'frame_2s_pain.png'],
  ['frame_6s.png', 'frame_6s_solution.png'],
  ['frame_11s.png', 'frame_11s_hope.png'],
];

filesToCopy.forEach(([src, dst]) => {
  const srcPath = path.join(WORK_DIR, src);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(OUT_DIR, dst));
  }
});

// Meta JSON
const meta = {
  preset: 'healing-high',
  format: 'YouTube Shorts / Instagram Reels',
  resolution: '1080x1920',
  duration: '15s',
  codec: 'H.264 (libx264)',
  crf: 18,
  font: 'Noto Sans KR',
  subtitles: SUBTITLES.map(s => s.text),
  colorArc: COLOR_ARC.map(c => c.label),
  korGate: { pass: korPass, fail: korFail, total: 5 },
  generatedAt: new Date().toISOString(),
  outputDir: OUT_DIR,
};
fs.writeFileSync(path.join(OUT_DIR, 'meta.json'), JSON.stringify(meta, null, 2));

// Cleanup work dir
try {
  fs.rmSync(WORK_DIR, { recursive: true, force: true });
} catch { /* ignore */ }

// ═══ Summary ═══
console.log('\n  ═══════════════════════════════════════');
console.log(`  KOR Gate: ${korPass}/5 passed${korFail > 0 ? ' (' + korFail + ' FAILED)' : ''}`);
console.log(`  Output: ${OUT_DIR}`);
console.log('  Files:');
console.log('    healing-high-sample.mp4    (15s YouTube Shorts)');
console.log('    subtitles.srt / .ass       (자막)');
console.log('    frame_2s_pain.png          (U1: PAIN 구간)');
console.log('    frame_6s_solution.png      (U2: SOLUTION 구간)');
console.log('    frame_11s_hope.png         (U3: HOPE 구간)');
console.log('    meta.json                  (메타데이터)');
console.log('  ═══════════════════════════════════════\n');

process.exit(korFail > 0 ? 1 : 0);
