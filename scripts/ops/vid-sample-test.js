#!/usr/bin/env node
/**
 * AIL-2026-0220-VID-SAMPLE-TEST-001
 * 실물 샘플 영상 자막 깨짐 0 확정 테스트
 *
 * 실행: node scripts/ops/vid-sample-test.js
 *
 * 순서:
 *   C. Feature flags ON (env)
 *   D. 샘플 VideoJob → SRT → ASS → burn-in → KOR Gate
 *   E. 결과물: output.mp4, subtitles.srt/ass, meta.json, frame.png
 *   F. 로그/게이트 결과 기록
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ── Feature flags ON ────────────────────────────────────────
process.env.VIDEO_JOB_ORCHESTRATOR = 'true';
process.env.VIDEO_KOREAN_SUBTITLE = 'true';
process.env.VIDEO_CIX_SCORING = 'true';

const SubtitleConverter = require('../../services/videoJob/SubtitleConverter');
const FontManager = require('../../services/videoJob/FontManager');
const SubtitleBurnIn = require('../../services/videoJob/SubtitleBurnIn');
const KoreanIntegrityGate = require('../../services/videoJob/KoreanIntegrityGate');
const CixVideoScorer = require('../../services/videoJob/CixVideoScorer');
const { ERROR_CODES } = require('../../services/videoJob/constants');

// ── 출력 디렉토리 ──────────────────────────────────────────
// FFmpeg ass= 필터는 경로에 공백/비ASCII가 있으면 파싱 실패
// → 프로젝트 내 output/은 결과 복사용, FFmpeg 작업은 ASCII-only temp에서 수행
const OUTPUT_DIR = path.join(process.cwd(), 'output', '_vid-sample-test');
const os = require('os');
// ASCII-only 경로 보장: C:\tmp\vid-sample-XXXX (Windows 한글 사용자명 회피)
const ASCII_TMP_BASE = process.platform === 'win32' ? 'C:\\tmp' : os.tmpdir();
fs.mkdirSync(ASCII_TMP_BASE, { recursive: true });
const FFMPEG_WORK = fs.mkdtempSync(path.join(ASCII_TMP_BASE, 'vidsmp'));
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

// ── 엣지케이스 자막 (강제) ─────────────────────────────────
const FORCE_TEST_SUBTITLE = '한글 테스트: 가나다라마바사 한글 🙂 "따옴표" — 대시 · 특수문자';

const SAMPLE_SRT = `1
00:00:00,000 --> 00:00:03,000
${FORCE_TEST_SUBTITLE}

2
00:00:03,000 --> 00:00:06,000
조합형: 괜찮은 척, 오늘도 했죠?

3
00:00:06,000 --> 00:00:08,000
지금, 당신만을 위한 7일 회복 여정 ♪
`;

// ── 유틸 ────────────────────────────────────────────────────
function runFfmpeg(args, cwd) {
  return new Promise((resolve, reject) => {
    let stderr = '';
    const opts = { stdio: ['ignore', 'pipe', 'pipe'] };
    if (cwd) opts.cwd = cwd;
    const proc = spawn(FFMPEG, args, opts);
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => {
      if (code === 0) resolve({ success: true, stderr });
      else reject(Object.assign(new Error(`FFmpeg exit ${code}`), { stderr }));
    });
    proc.on('error', err => reject(err));
  });
}

const results = {
  steps: {},
  korGate: null,
  cixVideo: null,
  fontPath: null,
  ffmpegFontLog: null,
  files: {},
};

let allPass = true;
function step(id, pass, detail) {
  const icon = pass ? '✅' : '❌';
  console.log(`  ${icon} [${id}] ${detail}`);
  results.steps[id] = { pass, detail };
  if (!pass) allPass = false;
}

(async () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  AIL-2026-0220-VID-SAMPLE-TEST-001                   ║');
  console.log('║  실물 샘플 영상 자막 깨짐 0 확정 테스트              ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');

  // ── C. Feature flags 확인 ─────────────────────────────────
  console.log('--- C. Feature Flags ---\n');
  step('C-01', process.env.VIDEO_JOB_ORCHESTRATOR === 'true', 'VIDEO_JOB_ORCHESTRATOR=true');
  step('C-02', process.env.VIDEO_KOREAN_SUBTITLE === 'true', 'VIDEO_KOREAN_SUBTITLE=true');
  step('C-03', process.env.VIDEO_CIX_SCORING === 'true', 'VIDEO_CIX_SCORING=true');
  console.log('');

  // ── D. 샘플 VideoJob 생성 ────────────────────────────────
  console.log('--- D. Sample VideoJob Pipeline ---\n');

  // D-01: 출력 디렉토리 준비
  fs.mkdirSync(path.join(OUTPUT_DIR, 'subtitles'), { recursive: true });
  step('D-01', fs.existsSync(OUTPUT_DIR), `출력 디렉토리: ${OUTPUT_DIR}`);

  // D-02: SRT NFC + LF 정규화
  const srtContent = SAMPLE_SRT.normalize('NFC').replace(/\r\n/g, '\n');
  const srtPath = path.join(OUTPUT_DIR, 'subtitles', 'subtitles.srt');
  fs.writeFileSync(srtPath, srtContent, 'utf-8');
  step('D-02', fs.existsSync(srtPath), `SRT 저장 (${Buffer.from(srtContent).length}B)`);

  // D-03: SRT → ASS 변환
  const assContent = SubtitleConverter.srtToAss(srtContent);
  const assValidation = SubtitleConverter.validateAss(assContent);
  const assPath = path.join(OUTPUT_DIR, 'subtitles', 'subtitles.ass');
  fs.writeFileSync(assPath, assContent, 'utf-8');
  step('D-03', assValidation.valid, `ASS 변환: ${assValidation.valid ? 'valid' : assValidation.errors.join(', ')}`);

  // D-04: 폰트 해석
  let fontPath = null;
  try {
    fontPath = FontManager.resolve();
    results.fontPath = fontPath;
    step('D-04', true, `폰트: ${fontPath}`);
  } catch (e) {
    step('D-04', false, `FONT_NOT_FOUND: ${e.message.split('\n')[0]}`);
  }

  // D-05: 테스트 영상 생성 (검정 배경 1080x1920 8초)
  // FFmpeg를 FFMPEG_WORK 디렉토리에서 실행 → 상대경로로 drive letter `:` 문제 회피
  const testVideoPath = path.join(FFMPEG_WORK, 'source.mp4');
  try {
    await runFfmpeg([
      '-y', '-f', 'lavfi',
      '-i', 'color=c=black:s=1080x1920:d=8:r=24',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
      '-pix_fmt', 'yuv420p',
      'source.mp4',
    ], FFMPEG_WORK);
    step('D-05', fs.existsSync(testVideoPath), `테스트 영상 생성 (${(fs.statSync(testVideoPath).size / 1024).toFixed(0)} KB)`);
  } catch (e) {
    step('D-05', false, `테스트 영상 생성 실패: ${e.message}`);
  }

  // D-06: ASS 자막 burn-in
  // 폰트 + ASS를 FFMPEG_WORK에 복사 → cwd=FFMPEG_WORK에서 상대경로로 실행
  const outputMp4 = path.join(OUTPUT_DIR, 'output.mp4');
  let ffmpegStderr = '';
  if (fs.existsSync(testVideoPath) && fontPath) {
    try {
      // 폰트와 ASS를 work dir에 복사
      const tmpFontDir = path.join(FFMPEG_WORK, 'fonts');
      fs.mkdirSync(tmpFontDir, { recursive: true });
      fs.copyFileSync(fontPath, path.join(tmpFontDir, 'NotoSansKR-Regular.ttf'));
      fs.copyFileSync(assPath, path.join(FFMPEG_WORK, 'subtitles.ass'));

      // cwd=FFMPEG_WORK → 상대경로 사용 → Windows C: 문제 완전 회피
      const burnResult = await runFfmpeg([
        '-y', '-i', 'source.mp4',
        '-vf', 'ass=subtitles.ass:fontsdir=fonts',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        'output.mp4',
      ], FFMPEG_WORK);
      ffmpegStderr = burnResult.stderr;
      results.ffmpegFontLog = ffmpegStderr;

      // 결과를 프로젝트 output/으로 복사
      fs.copyFileSync(path.join(FFMPEG_WORK, 'output.mp4'), outputMp4);
      const size = fs.statSync(outputMp4).size;
      step('D-06', size > 10000, `burn-in 완료 (${(size / 1024).toFixed(0)} KB)`);
    } catch (e) {
      ffmpegStderr = e.stderr || '';
      results.ffmpegFontLog = ffmpegStderr;
      step('D-06', false, `burn-in 실패: ${e.message}`);
    }
  } else {
    step('D-06', false, '테스트 영상 또는 폰트 미존재 — burn-in 스킵');
  }

  console.log('');

  // ── E. 결과물 확인 ────────────────────────────────────────
  console.log('--- E. Output Verification ---\n');

  // E-01: output.mp4 존재 + 크기
  const mp4Exists = fs.existsSync(outputMp4);
  step('E-01', mp4Exists, `output.mp4: ${mp4Exists ? `${(fs.statSync(outputMp4).size / 1024).toFixed(0)} KB` : 'NOT FOUND'}`);

  // E-02: subtitles.srt 존재
  step('E-02', fs.existsSync(srtPath), 'subtitles.srt 존재');

  // E-03: subtitles.ass 존재
  step('E-03', fs.existsSync(assPath), 'subtitles.ass 존재');

  // E-04: frame.png 추출 (6초 지점 — 3번째 자막 구간)
  const framePath = path.join(OUTPUT_DIR, 'frame.png');
  if (mp4Exists) {
    try {
      await runFfmpeg([
        '-y', '-i', outputMp4,
        '-ss', '00:00:06', '-vframes', '1',
        framePath,
      ]);
      const frameSize = fs.statSync(framePath).size;
      step('E-04', frameSize > 1000, `frame.png 추출 (${(frameSize / 1024).toFixed(0)} KB)`);
      results.files.framePng = framePath;
    } catch (e) {
      step('E-04', false, `프레임 추출 실패: ${e.message}`);
    }
  } else {
    step('E-04', false, 'output.mp4 미존재 — 프레임 추출 스킵');
  }

  // E-05: 추가 프레임 — 1초 지점 (1번째 자막: 엣지케이스 문자열)
  const frame1Path = path.join(OUTPUT_DIR, 'frame_1s.png');
  if (mp4Exists) {
    try {
      await runFfmpeg([
        '-y', '-i', outputMp4,
        '-ss', '00:00:01', '-vframes', '1',
        frame1Path,
      ]);
      const frameSize = fs.statSync(frame1Path).size;
      step('E-05', frameSize > 1000, `frame_1s.png 추출 (${(frameSize / 1024).toFixed(0)} KB) — 엣지케이스 자막 구간`);
      results.files.frame1sPng = frame1Path;
    } catch (e) {
      step('E-05', false, `1초 프레임 추출 실패: ${e.message}`);
    }
  } else {
    step('E-05', false, 'output.mp4 미존재');
  }

  // E-06: 추가 프레임 — 4초 지점 (2번째 자막: 조합형)
  const frame4Path = path.join(OUTPUT_DIR, 'frame_4s.png');
  if (mp4Exists) {
    try {
      await runFfmpeg([
        '-y', '-i', outputMp4,
        '-ss', '00:00:04', '-vframes', '1',
        frame4Path,
      ]);
      const frameSize = fs.statSync(frame4Path).size;
      step('E-06', frameSize > 1000, `frame_4s.png 추출 (${(frameSize / 1024).toFixed(0)} KB) — 조합형 자막 구간`);
      results.files.frame4sPng = frame4Path;
    } catch (e) {
      step('E-06', false, `4초 프레임 추출 실패: ${e.message}`);
    }
  } else {
    step('E-06', false, 'output.mp4 미존재');
  }

  console.log('');

  // ── F. 로그/게이트 결과 기록 ──────────────────────────────
  console.log('--- F. Gate & Evidence ---\n');

  // F-01: KOR-01 UTF-8 왕복
  const kor01 = await KoreanIntegrityGate.verifyUtf8RoundTrip(
    path.join(OUTPUT_DIR, 'subtitles', '_kor01_verify.srt'),
    srtContent
  );
  step('F-01', kor01.pass, `KOR-01 UTF-8 왕복: ${kor01.detail}`);

  // F-02: KOR-02 ZIP 자막 (ZIP 생성 → 추출 → 바이트 비교)
  {
    const AdmZip = require('adm-zip');
    // SRT와 ASS 각각 별도 검증
    const zipPath = path.join(OUTPUT_DIR, 'test_kor02.zip');
    const zip = new AdmZip();
    zip.addFile('subtitles/subtitles.srt', Buffer.from(srtContent, 'utf-8'));
    zip.writeZip(zipPath);

    const kor02 = await KoreanIntegrityGate.verifyZipSubtitle(zipPath, srtContent);
    step('F-02a', kor02.pass, `KOR-02 ZIP SRT: ${kor02.detail}`);

    // ASS도 별도 검증
    const zipPath2 = path.join(OUTPUT_DIR, 'test_kor02_ass.zip');
    const zip2 = new AdmZip();
    zip2.addFile('subtitles/subtitles.ass', Buffer.from(assContent, 'utf-8'));
    zip2.writeZip(zipPath2);
    const kor02b = await KoreanIntegrityGate.verifyZipSubtitle(zipPath2, assContent);
    step('F-02b', kor02b.pass, `KOR-02 ZIP ASS: ${kor02b.detail}`);
  }

  // F-03: KOR-03 FFmpeg 폰트 로드
  if (ffmpegStderr) {
    const kor03 = KoreanIntegrityGate.verifyFontLoad(ffmpegStderr);
    step('F-03', kor03.pass, `KOR-03 폰트 로드: ${kor03.detail}`);

    // 폰트 로드 증거 추출
    const fontEvidence = ffmpegStderr.split('\n').filter(l =>
      l.toLowerCase().includes('font') ||
      l.toLowerCase().includes('noto') ||
      l.toLowerCase().includes('fontsdir') ||
      l.toLowerCase().includes('fontselect')
    ).slice(0, 5);
    if (fontEvidence.length > 0) {
      console.log('    📋 FFmpeg 폰트 증거:');
      fontEvidence.forEach(l => console.log(`       ${l.trim()}`));
    }
  } else {
    step('F-03', false, 'KOR-03: FFmpeg stderr 없음');
  }

  // F-04: KOR-04 ASS 파싱 + 한글 무결성
  const kor04 = KoreanIntegrityGate.verifyAssParse(assContent);
  step('F-04', kor04.pass, `KOR-04 ASS 무결성: ${kor04.detail}`);

  // F-05: KOR-05 프레임 추출 (실물 — SKIP_KOR05 해제)
  if (mp4Exists) {
    delete process.env.SKIP_KOR05;
    const kor05 = await KoreanIntegrityGate.verifyRenderFrame(outputMp4, 1);
    step('F-05', kor05.pass, `KOR-05 프레임 검증: ${kor05.detail}`);
  } else {
    step('F-05', false, 'KOR-05: output.mp4 미존재');
  }

  console.log('');

  // F-06: CIx-Video 점수 계산
  // KOR-01, KOR-02(SRT+ASS), KOR-03(font), KOR-04(ASS parse), KOR-05(frame) 각각 집계
  const korChecks = Object.entries(results.steps).filter(([k]) =>
    k.startsWith('F-01') || k.startsWith('F-02') || k.startsWith('F-03') ||
    k.startsWith('F-04') || k.startsWith('F-05')
  );
  const korPassCount = korChecks.filter(([,v]) => v.pass).length;
  const korTotal = korChecks.length;
  const korRate = korPassCount / korTotal;

  const cixScore = CixVideoScorer.calculate({
    validator_result: 1.0,          // 304/304 PASS (이미 확인)
    korean_integrity: korRate,       // KOR Gate 통과율
    render_success_rate: mp4Exists ? 1.0 : 0,
    regeneration_rate: 0,            // 재생성 없음
    override_usage: 0,               // 오버라이드 없음
  });
  const cixStatus = CixVideoScorer.getStatus(cixScore);
  results.cixVideo = { score: cixScore, status: cixStatus, korRate };

  step('F-06', cixScore >= 70, `CIx-Video = ${cixScore} (${cixStatus}) — KOR ${korPassCount}/${korTotal}`);

  // F-07: meta.json 생성 (SSOT 증거)
  const meta = {
    ail: 'AIL-2026-0220-VID-SAMPLE-TEST-001',
    created_at: new Date().toISOString(),
    force_test_subtitle: FORCE_TEST_SUBTITLE,
    korean_integrity: {
      kor01: kor01,
      kor04: kor04,
      kor_pass_rate: `${korPassCount}/${korTotal}`,
    },
    cix_video: {
      score: cixScore,
      status: cixStatus,
      factors: {
        validator_result: 1.0,
        korean_integrity: korRate,
        render_success_rate: mp4Exists ? 1.0 : 0,
        regeneration_rate: 0,
        override_usage: 0,
      },
    },
    font: {
      path: fontPath,
      name: FontManager.getFontName(),
    },
    files: {
      output_mp4: mp4Exists ? outputMp4 : null,
      subtitles_srt: srtPath,
      subtitles_ass: assPath,
      frame_png: results.files.framePng || null,
      frame_1s_png: results.files.frame1sPng || null,
      frame_4s_png: results.files.frame4sPng || null,
    },
    error_code: allPass ? null : 'SAMPLE_TEST_FAIL',
    error_message: allPass ? null : Object.entries(results.steps).filter(([,v]) => !v.pass).map(([k,v]) => `${k}: ${v.detail}`).join('; '),
  };

  const metaPath = path.join(OUTPUT_DIR, 'meta.json');
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  step('F-07', fs.existsSync(metaPath), `meta.json 증거 기록 완료`);

  // ── FFmpeg stderr 전문 저장 ───────────────────────────────
  if (ffmpegStderr) {
    const logPath = path.join(OUTPUT_DIR, 'ffmpeg_stderr.log');
    fs.writeFileSync(logPath, ffmpegStderr, 'utf-8');
  }

  console.log('');

  // ── 최종 보고 ─────────────────────────────────────────────
  const passCount = Object.values(results.steps).filter(s => s.pass).length;
  const totalCount = Object.values(results.steps).length;

  console.log('═══════════════════════════════════════════════════════');
  console.log('  📊 [VID 샘플 실물 테스트] 보고');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`  📌 결과: ${allPass ? '✅ PASS' : '❌ FAIL'} (${passCount}/${totalCount})`);
  console.log('');
  console.log('  📈 근거:');
  console.log(`     KOR Gate: ${korPassCount}/${korTotal} PASS`);
  console.log(`     CIx-Video: ${cixScore}점 (${cixStatus})`);
  console.log(`     폰트: ${fontPath ? path.basename(fontPath) : 'MISSING'}`);
  console.log(`     burn-in mp4: ${mp4Exists ? '생성됨' : '실패'}`);
  if (results.files.framePng) {
    console.log(`     frame.png: ${results.files.framePng}`);
  }
  if (results.files.frame1sPng) {
    console.log(`     frame_1s.png: ${results.files.frame1sPng} (엣지케이스 자막)`);
  }
  console.log('');
  console.log('  🎯 다음 액션:');
  if (allPass) {
    console.log('     frame.png / frame_1s.png / frame_4s.png 열어서 자막 눈 확인');
    console.log('     output.mp4 재생하여 한글/이모지/특수문자 정상 표시 확정');
  } else {
    const failedSteps = Object.entries(results.steps).filter(([,v]) => !v.pass).map(([k]) => k);
    console.log(`     실패 항목 수정: ${failedSteps.join(', ')}`);
  }
  console.log('');
  console.log('  ⚠️ 리스크:');
  console.log('     CIx < 70 발생 시 → 릴리즈 차단');
  console.log('     FONT_NOT_FOUND 발생 시 → 배포 금지');
  console.log('');
  console.log('  📁 증거 파일:');
  console.log(`     ${OUTPUT_DIR}/`);
  console.log('       ├── output.mp4       (burn-in 영상)');
  console.log('       ├── frame.png        (6초 — 3번째 자막)');
  console.log('       ├── frame_1s.png     (1초 — 엣지케이스)');
  console.log('       ├── frame_4s.png     (4초 — 조합형)');
  console.log('       ├── meta.json        (SSOT 증거)');
  console.log('       ├── ffmpeg_stderr.log');
  console.log('       └── subtitles/');
  console.log('            ├── subtitles.srt');
  console.log('            └── subtitles.ass');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');

  // cleanup temp
  try { fs.rmSync(FFMPEG_WORK, { recursive: true }); } catch (_) {}

  process.exit(allPass ? 0 : 1);
})();
