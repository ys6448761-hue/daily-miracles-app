/**
 * Aurora Subtitle Pipeline — SSOT 표준 자막 처리
 * VID-003~004
 *
 * 고정 순서 (변경 금지):
 *   SRT (UTF-8 + NFC + LF) → ASS (폰트 명시) → FFmpeg burn-in → KOR Gate
 *
 * 규칙:
 *   - 파일 인코딩: UTF-8 (BOM 금지)
 *   - 개행: LF만 허용
 *   - 정규화: NFC
 *   - 폰트: assets/fonts/NotoSansKR-Regular.ttf 고정 (fallback 금지)
 *   - 폰트 미존재 시 hard fail
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// 기존 VideoJob 서비스 재사용
let SubtitleConverter   = null;
let SubtitleBurnIn      = null;
let FontManager         = null;

try { SubtitleConverter  = require('../videoJob/SubtitleConverter');  } catch (e) {
  console.warn('[subtitlePipeline] SubtitleConverter 로드 실패:', e.message);
}
try { SubtitleBurnIn     = require('../videoJob/SubtitleBurnIn');     } catch (e) {
  console.warn('[subtitlePipeline] SubtitleBurnIn 로드 실패:', e.message);
}
try { FontManager        = require('../videoJob/FontManager');        } catch (e) {
  console.warn('[subtitlePipeline] FontManager 로드 실패:', e.message);
}

const { runKorGate } = require('./KorGate');

// ── SRT 정규화 ─────────────────────────────────────────────────────────────
/**
 * SRT 텍스트를 SSOT 표준으로 정규화
 *
 * 1. BOM 제거 (U+FEFF)
 * 2. CRLF/CR → LF 변환
 * 3. NFC 유니코드 정규화
 * 4. 앞뒤 공백 제거
 *
 * @param {string} raw  원본 SRT 텍스트
 * @returns {string}    정규화된 SRT 텍스트
 */
function normalizeSrt(raw) {
  let text = raw;

  // 1. BOM 제거
  if (text.startsWith('\uFEFF')) {
    text = text.slice(1);
  }

  // 2. CRLF/CR → LF
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 3. NFC 정규화
  text = text.normalize('NFC');

  // 4. 앞뒤 공백 정리
  return text.trim();
}

/**
 * SRT 구조 최소 검증 (순번 + 타임코드 + 텍스트 최소 1개)
 *
 * @param {string} srtContent  정규화된 SRT
 * @throws {Error} 구조 오류 시
 */
function validateSrtStructure(srtContent) {
  // SRT 기본 패턴: 숫자\n00:00:00,000 --> 00:00:00,000\n텍스트
  const SRT_BLOCK = /^\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/m;

  if (!SRT_BLOCK.test(srtContent)) {
    throw new Error('SRT 구조 오류: 유효한 자막 블록이 없음 (순번 + 타임코드 필수)');
  }
}

// ── 폰트 검사 (hard fail) ──────────────────────────────────────────────────
/**
 * 번들 폰트 존재 여부 확인
 * FontManager 없으면 직접 경로 체크
 *
 * @returns {string} 폰트 절대 경로
 * @throws {Error}  폰트 미존재 시
 */
function resolveFont() {
  if (FontManager) {
    return FontManager.resolve(); // 없으면 내부에서 throw
  }

  // FontManager 없을 때 직접 검사 (fallback)
  const bundledPath = path.resolve('assets/fonts/NotoSansKR-Regular.ttf');
  if (!fs.existsSync(bundledPath)) {
    throw new Error(
      `[FONT_NOT_FOUND] ${bundledPath}\n` +
      '해결 방법:\n' +
      '  1. assets/fonts/NotoSansKR-Regular.ttf 파일 배치\n' +
      '  2. Render 배포 시 assets/fonts/ 디렉토리 포함 확인'
    );
  }
  return bundledPath;
}

// ── ASS 변환 ───────────────────────────────────────────────────────────────
/**
 * SRT → ASS 변환 (폰트 고정)
 *
 * @param {string} srtContent  정규화된 SRT
 * @param {string} fontPath    폰트 절대 경로
 * @returns {string}           ASS 내용
 */
function convertToAss(srtContent, fontPath) {
  if (!SubtitleConverter) {
    // SubtitleConverter 없을 때 직접 최소 ASS 생성
    return _buildMinimalAss(srtContent);
  }

  return SubtitleConverter.srtToAss(srtContent, {
    fontName: 'Noto Sans KR',
    fontSize: 48,
    primaryColour: '&H00FFFFFF',   // 흰색
    outlineColour: '&H00000000',   // 검은 테두리
    backColour:    '&H80000000',   // 반투명 배경
    outline:       3,
    shadow:        1,
    marginV:       80,
  });
}

/**
 * SubtitleConverter 없을 때 최소 ASS 생성 (폴백)
 */
function _buildMinimalAss(srtContent) {
  const header = [
    '[Script Info]',
    'Title: Aurora Subtitle',
    'ScriptType: v4.00+',
    'PlayResX: 1080',
    'PlayResY: 1920',
    'WrapStyle: 0',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    'Style: Default,Noto Sans KR,48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,1,2,40,40,80,1',
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ].join('\n');

  // SRT 타임 변환
  function srtTimeToAss(t) {
    const [hms, ms] = t.split(',');
    const [h, m, s] = hms.split(':');
    const cs = Math.round(parseInt(ms, 10) / 10).toString().padStart(2, '0');
    return `${parseInt(h, 10)}:${m}:${s}.${cs}`;
  }

  const blocks = srtContent.split(/\n\n+/).filter(Boolean);
  const events = blocks.map(block => {
    const lines = block.split('\n');
    const timeLine = lines.find(l => l.includes('-->')) || '';
    const [startRaw, endRaw] = timeLine.split('-->').map(s => s.trim());
    const text = lines.slice(2).join('\\N');
    return `Dialogue: 0,${srtTimeToAss(startRaw)},${srtTimeToAss(endRaw)},Default,,0,0,0,,${text}`;
  }).join('\n');

  return header + '\n' + events + '\n';
}

// ── Burn-in ────────────────────────────────────────────────────────────────
/**
 * ASS 자막을 영상에 합성
 *
 * @param {string} videoPath   소스 영상 경로
 * @param {string} assContent  ASS 내용
 * @param {string} outputPath  출력 영상 경로
 * @param {string} fontPath    폰트 절대 경로
 * @param {string} tmpDir      임시 작업 디렉토리
 * @returns {{ outputPath: string, ffmpegStderr: string }}
 */
function burnIn(videoPath, assContent, outputPath, fontPath, tmpDir) {
  fs.mkdirSync(tmpDir, { recursive: true });

  const assPath = path.join(tmpDir, 'subtitles.ass');
  fs.writeFileSync(assPath, assContent, 'utf-8');

  if (!SubtitleBurnIn) {
    throw new Error('SubtitleBurnIn 모듈 없음 — services/videoJob/SubtitleBurnIn.js 확인');
  }

  const result = SubtitleBurnIn.burnIn(videoPath, assPath, outputPath);
  return result;
}

// ── 메인 파이프라인 ─────────────────────────────────────────────────────────
/**
 * 전체 자막 파이프라인 실행
 *
 * @param {object} options
 * @param {string}   options.srtRaw      원본 SRT 텍스트 (UTF-8 string)
 * @param {string}   [options.videoPath] 소스 영상 경로 (burn-in 포함 시 필수)
 * @param {string}   [options.outputPath] burn-in 결과 경로
 * @param {string}   [options.tmpDir]   임시 디렉토리 (burn-in 시 필수)
 * @param {boolean}  [options.burnInEnabled=true] false이면 burn-in 스킵 (Gate만 실행)
 * @returns {Promise<{
 *   srtContent:  string,
 *   assContent:  string,
 *   fontPath:    string,
 *   korGate:     { allPassed, passed, total, results },
 *   outputPath:  string|null,
 * }>}
 * @throws {Error} 폰트 미존재, SRT 구조 오류, KOR Gate 실패
 */
async function run(options = {}) {
  const {
    srtRaw,
    videoPath   = null,
    outputPath  = null,
    tmpDir      = null,
    burnInEnabled = true,
  } = options;

  if (!srtRaw) throw new Error('subtitlePipeline.run: srtRaw is required');

  // ── Step 1: SRT 정규화 ────────────────────────────────────────────────────
  const srtContent = normalizeSrt(srtRaw);
  validateSrtStructure(srtContent);

  // ── Step 2: 폰트 확인 (hard fail) ─────────────────────────────────────────
  const fontPath = resolveFont();

  // ── Step 3: SRT → ASS ─────────────────────────────────────────────────────
  const assContent = convertToAss(srtContent, fontPath);

  // ── Step 4: KOR Gate ──────────────────────────────────────────────────────
  const korGate = runKorGate(srtContent, assContent);

  if (!korGate.allPassed) {
    const failures = korGate.results.filter(r => !r.pass);
    throw new Error(
      `[KOR GATE] ${failures.length}개 항목 실패 — 릴리즈 금지:\n` +
      failures.map(f => `  • ${f.id} ${f.name}: ${f.detail}`).join('\n')
    );
  }

  // ── Step 5: FFmpeg Burn-in (선택) ─────────────────────────────────────────
  let finalOutput = null;

  if (burnInEnabled && videoPath && outputPath && tmpDir) {
    const result = burnIn(videoPath, assContent, outputPath, fontPath, tmpDir);
    finalOutput  = result.outputPath || outputPath;
  }

  return {
    srtContent,
    assContent,
    fontPath,
    korGate,
    outputPath: finalOutput,
  };
}

module.exports = {
  run,
  normalizeSrt,
  validateSrtStructure,
  resolveFont,
  convertToAss,
  burnIn,
};
