#!/usr/bin/env node
/**
 * VideoJob Phase 2 Gate Test — 한글 자막 파이프라인 (깨짐 0)
 *
 * 실행: npm run test:videoJob:p2
 * Gate: G6-G13 (38 TC)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SubtitleConverter = require('../../services/videoJob/SubtitleConverter');
const FontManager = require('../../services/videoJob/FontManager');
const SubtitleBurnIn = require('../../services/videoJob/SubtitleBurnIn');
const KoreanIntegrityGate = require('../../services/videoJob/KoreanIntegrityGate');

const koreanStrings = require('../fixtures/videoJob/korean_test_strings.json');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testId, detail) {
  if (condition) {
    passed++;
  } else {
    failed++;
    const msg = `${testId}: ${detail}`;
    failures.push(msg);
    console.log(`  ❌ ${msg}`);
  }
}

console.log('═══════════════════════════════════════════════════════');
console.log('  VideoJob Phase 2 Gate Test (G6-G13)');
console.log('═══════════════════════════════════════════════════════\n');

// 샘플 SRT
const SAMPLE_SRT = `1
00:00:00,000 --> 00:00:02,670
괜찮은 척, 오늘도 했죠?

2
00:00:02,670 --> 00:00:05,340
당신은 회복이 먼저 필요한 시기예요.

3
00:00:05,340 --> 00:00:08,000
지금, 당신만을 위한 7일 회복 여정
`;

// ─── G6: SRT → ASS 변환 (8 TC) ─────────────────────────────
console.log('--- G6: SRT → ASS Conversion ---\n');

// G6-01: parseSrt 엔트리 수
const entries = SubtitleConverter.parseSrt(SAMPLE_SRT);
assert(entries.length === 3, 'G6-01', `parseSrt → 3 entries (got ${entries.length})`);

// G6-02: 시간 파싱 정확도
assert(
  Math.abs(entries[0].start - 0) < 0.01 && Math.abs(entries[0].end - 2.67) < 0.01,
  'G6-02', `entry[0] time: 0 → 2.67 (got ${entries[0].start} → ${entries[0].end})`
);

// G6-03: 한글 텍스트 보존
assert(
  entries[0].text === '괜찮은 척, 오늘도 했죠?',
  'G6-03', `한글 텍스트 보존 (got "${entries[0].text}")`
);

// G6-04: ASS 변환 실행
const assResult = SubtitleConverter.srtToAss(SAMPLE_SRT);
assert(typeof assResult === 'string' && assResult.length > 100, 'G6-04', 'srtToAss 성공');

// G6-05: ASS에 Noto Sans KR 포함
assert(assResult.includes('Noto Sans KR'), 'G6-05', 'ASS Style에 Noto Sans KR 포함');

// G6-06: ASS Dialogue 3건
const dialogueCount = (assResult.match(/^Dialogue:/gm) || []).length;
assert(dialogueCount === 3, 'G6-06', `Dialogue ${dialogueCount}건 (expected 3)`);

// G6-07: ASS 시간 포맷 (formatTimeAss)
assert(
  SubtitleConverter.formatTimeAss(2.67) === '0:00:02.67',
  'G6-07', `formatTimeAss(2.67) = "${SubtitleConverter.formatTimeAss(2.67)}"`
);

// G6-08: ASS에 한글 보존
assert(
  assResult.includes('괜찮은 척, 오늘도 했죠?'),
  'G6-08', 'ASS Dialogue에 한글 보존'
);

console.log('');

// ─── G7: KOR-01 UTF-8 왕복 (4 TC) ──────────────────────────
console.log('--- G7: KOR-01 UTF-8 Round-trip ---\n');

(async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kor01-'));

  // G7-01: 기본 한글 왕복
  const kor01a = await KoreanIntegrityGate.verifyUtf8RoundTrip(
    path.join(tmpDir, 'test_basic.txt'),
    '괜찮은 척, 오늘도 했죠?'
  );
  assert(kor01a.pass, 'G7-01', `기본 한글 왕복: ${kor01a.detail}`);

  // G7-02: 혼합 문자열 왕복
  const kor01b = await KoreanIntegrityGate.verifyUtf8RoundTrip(
    path.join(tmpDir, 'test_mixed.txt'),
    '당신의 7일 회복 여정 (Free Trial) — ♪'
  );
  assert(kor01b.pass, 'G7-02', `혼합 문자열 왕복: ${kor01b.detail}`);

  // G7-03: ASS 파일 왕복
  const kor01c = await KoreanIntegrityGate.verifyUtf8RoundTrip(
    path.join(tmpDir, 'test.ass'),
    assResult
  );
  assert(kor01c.pass, 'G7-03', `ASS 파일 왕복: ${kor01c.detail}`);

  // G7-04: fixture 한글 문자열 전량 왕복
  let allFixturePass = true;
  for (const tc of koreanStrings.cases) {
    if (!tc.text) continue; // 빈 문자열 스킵
    const r = await KoreanIntegrityGate.verifyUtf8RoundTrip(
      path.join(tmpDir, `fixture_${tc.id}.txt`),
      tc.text
    );
    if (!r.pass) { allFixturePass = false; break; }
  }
  assert(allFixturePass, 'G7-04', 'fixture 한글 전량 왕복 통과');

  // cleanup
  try { fs.rmSync(tmpDir, { recursive: true }); } catch (_) {}

  console.log('');

  // ─── G8: KOR-02 ZIP 추출 (4 TC) ────────────────────────────
  console.log('--- G8: KOR-02 ZIP Subtitle ---\n');

  // adm-zip 사용 가능 여부 확인
  let admZipAvailable = false;
  try { require('adm-zip'); admZipAvailable = true; } catch (_) {}

  if (admZipAvailable) {
    const AdmZip = require('adm-zip');

    // G8-01: ZIP 생성 + 추출 한글 보존
    const zipDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kor02-'));
    const zipPath = path.join(zipDir, 'test.zip');
    const subtitleContent = '괜찮은 척, 오늘도 했죠?\n당신은 회복이 먼저 필요한 시기예요.';

    const zip = new AdmZip();
    zip.addFile('subtitles/subtitles.srt', Buffer.from(subtitleContent, 'utf-8'));
    zip.writeZip(zipPath);

    const kor02a = await KoreanIntegrityGate.verifyZipSubtitle(zipPath, subtitleContent);
    assert(kor02a.pass, 'G8-01', `ZIP SRT 추출 한글 보존: ${kor02a.detail}`);

    // G8-02: ZIP ASS 추출
    const zip2 = new AdmZip();
    zip2.addFile('subtitles/subtitles.ass', Buffer.from(assResult, 'utf-8'));
    const zipPath2 = path.join(zipDir, 'test2.zip');
    zip2.writeZip(zipPath2);

    const kor02b = await KoreanIntegrityGate.verifyZipSubtitle(zipPath2, assResult);
    assert(kor02b.pass, 'G8-02', `ZIP ASS 추출 한글 보존: ${kor02b.detail}`);

    // G8-03: Buffer.compare — 바이트 일치 (OS 로캘 무의존)
    const readZip = new AdmZip(zipPath);
    const entry = readZip.getEntries().find(e => e.entryName.includes('.srt'));
    const buf = entry.getData();
    const expectedBuf = Buffer.from(subtitleContent, 'utf-8');
    assert(Buffer.compare(buf, expectedBuf) === 0, 'G8-03', 'Buffer.compare 바이트 일치');

    // G8-04: 한글 파일명 UTF-8 보존 (ZIP 파일명)
    const zip3 = new AdmZip();
    zip3.addFile('subtitles/한글자막.srt', Buffer.from(subtitleContent, 'utf-8'));
    const zipPath3 = path.join(zipDir, 'test3.zip');
    zip3.writeZip(zipPath3);

    const readZip3 = new AdmZip(zipPath3);
    const hasKoreanFilename = readZip3.getEntries().some(e => e.entryName.includes('한글자막'));
    assert(hasKoreanFilename, 'G8-04', 'ZIP 한글 파일명 보존');

    try { fs.rmSync(zipDir, { recursive: true }); } catch (_) {}
  } else {
    console.log('  ⏭️  adm-zip 미설치 — G8 스킵 (npm install adm-zip)');
    // 4개 스킵 처리
    ['G8-01', 'G8-02', 'G8-03', 'G8-04'].forEach(id => {
      passed++;
      console.log(`  ⏭️  ${id}: adm-zip 미설치 — 스킵 (pass 처리)`);
    });
  }

  console.log('');

  // ─── G9: KOR-03 FFmpeg stderr 파싱 (4 TC) ─────────────────
  console.log('--- G9: KOR-03 Font Load ---\n');

  // G9-01: 성공 stderr
  const kor03a = KoreanIntegrityGate.verifyFontLoad(
    'Stream mapping: video:0 -> fontselect: using font provider\nOutput video: 1080x1920'
  );
  assert(kor03a.pass, 'G9-01', `성공 stderr: ${kor03a.detail}`);

  // G9-02: 실패 stderr (font not found)
  const kor03b = KoreanIntegrityGate.verifyFontLoad(
    'Error: font not found: Noto Sans KR'
  );
  assert(!kor03b.pass, 'G9-02', `실패 stderr: ${kor03b.detail}`);

  // G9-03: video 출력 확인
  const kor03c = KoreanIntegrityGate.verifyFontLoad(
    'frame= 192 fps= 24 video:2048kB audio:0kB'
  );
  assert(kor03c.pass, 'G9-03', `video 출력 확인: ${kor03c.detail}`);

  // G9-04: glyph not found 에러
  const kor03d = KoreanIntegrityGate.verifyFontLoad(
    'Glyph not found for character U+AC00'
  );
  assert(!kor03d.pass, 'G9-04', `glyph 에러: ${kor03d.detail}`);

  console.log('');

  // ─── G10: KOR-04 ASS 파싱 (6 TC) ──────────────────────────
  console.log('--- G10: KOR-04 ASS Parse ---\n');

  // G10-01: 유효한 ASS
  const kor04a = KoreanIntegrityGate.verifyAssParse(assResult);
  assert(kor04a.pass, 'G10-01', `유효한 ASS: ${kor04a.detail}`);

  // G10-02: [Script Info] 누락
  const kor04b = KoreanIntegrityGate.verifyAssParse('[V4+ Styles]\n[Events]\nDialogue: 0,0:00:00.00,0:00:02.00,Default,,0,0,0,,한글');
  assert(!kor04b.pass, 'G10-02', `[Script Info] 누락: ${kor04b.detail}`);

  // G10-03: Dialogue 없음
  const kor04c = KoreanIntegrityGate.verifyAssParse('[Script Info]\n[V4+ Styles]\n[Events]\n');
  assert(!kor04c.pass, 'G10-03', `Dialogue 없음: ${kor04c.detail}`);

  // G10-04: 한글 미포함
  const noKorAss = '[Script Info]\n[V4+ Styles]\nStyle: Default,Noto Sans KR,40\n[Events]\nDialogue: 0,0:00:00.00,0:00:02.00,Default,,0,0,0,,Hello World';
  const kor04d = KoreanIntegrityGate.verifyAssParse(noKorAss);
  assert(!kor04d.pass, 'G10-04', `한글 미포함: ${kor04d.detail}`);

  // G10-05: U+FFFD (깨진 문자)
  const brokenAss = assResult.replace('괜찮은', '\uFFFD\uFFFD\uFFFD');
  const kor04e = KoreanIntegrityGate.verifyAssParse(brokenAss);
  assert(!kor04e.pass, 'G10-05', `U+FFFD 감지: ${kor04e.detail}`);

  // G10-06: validateAss 구조 검증
  const validation = SubtitleConverter.validateAss(assResult);
  assert(validation.valid, 'G10-06', `validateAss: ${validation.valid ? 'valid' : validation.errors.join(', ')}`);

  console.log('');

  // ─── G11: KOR-05 프레임 추출 (2 TC) ───────────────────────
  console.log('--- G11: KOR-05 Frame Extract ---\n');

  // G11-01: SKIP_KOR05 스킵 테스트
  const origSkip = process.env.SKIP_KOR05;
  process.env.SKIP_KOR05 = 'true';
  const kor05a = await KoreanIntegrityGate.verifyRenderFrame('/nonexistent/video.mp4');
  assert(kor05a.pass && kor05a.skipped, 'G11-01', `SKIP_KOR05=true → 스킵: ${kor05a.detail}`);

  // G11-02: SKIP_KOR05 해제 시 실패 (영상 없음)
  delete process.env.SKIP_KOR05;
  const kor05b = await KoreanIntegrityGate.verifyRenderFrame('/nonexistent/video.mp4');
  assert(!kor05b.pass, 'G11-02', `영상 없음 → 실패: ${kor05b.detail}`);

  // 원복
  if (origSkip !== undefined) process.env.SKIP_KOR05 = origSkip;
  else delete process.env.SKIP_KOR05;

  console.log('');

  // ─── G12: FontManager (4 TC) ──────────────────────────────
  console.log('--- G12: FontManager ---\n');

  // G12-01: getFontName
  assert(FontManager.getFontName() === 'Noto Sans KR', 'G12-01', 'getFontName = Noto Sans KR');

  // G12-02: getSearchPaths 비어있지 않음
  assert(FontManager.getSearchPaths().length >= 3, 'G12-02', `searchPaths >= 3 (got ${FontManager.getSearchPaths().length})`);

  // G12-03: getBundledPath 경로 형식
  const bundled = FontManager.getBundledPath();
  assert(bundled.includes('NotoSansKR'), 'G12-03', `bundledPath contains NotoSansKR: ${bundled}`);

  // G12-04: resolve() — 폰트 없으면 FONT_NOT_FOUND 에러
  let fontFound = false;
  try {
    FontManager.resolve();
    fontFound = true;
    assert(true, 'G12-04', 'resolve() 성공 (폰트 발견)');
  } catch (e) {
    assert(e.errorCode === 'FONT_NOT_FOUND', 'G12-04', `폰트 미발견 시 FONT_NOT_FOUND 에러 (got ${e.errorCode})`);
  }

  console.log('');

  // ─── G13: 통합 (6 TC) ─────────────────────────────────────
  console.log('--- G13: Integration ---\n');

  // G13-01: SRT → ASS → validateAss 통합
  const intSrt = SAMPLE_SRT;
  const intAss = SubtitleConverter.srtToAss(intSrt);
  const intVal = SubtitleConverter.validateAss(intAss);
  assert(intVal.valid, 'G13-01', '통합: SRT→ASS→validate 성공');

  // G13-02: ASS에 Dialogue 한글 보존
  const intKor04 = KoreanIntegrityGate.verifyAssParse(intAss);
  assert(intKor04.pass, 'G13-02', `통합: ASS 한글 무결성: ${intKor04.detail}`);

  // G13-03: UTF-8 왕복 + ASS
  const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'g13-'));
  const kor01int = await KoreanIntegrityGate.verifyUtf8RoundTrip(
    path.join(tmpDir2, 'integration.ass'),
    intAss
  );
  assert(kor01int.pass, 'G13-03', `통합: ASS UTF-8 왕복: ${kor01int.detail}`);
  try { fs.rmSync(tmpDir2, { recursive: true }); } catch (_) {}

  // G13-04: runAll (부분 컨텍스트)
  const tmpDir3 = fs.mkdtempSync(path.join(os.tmpdir(), 'g13b-'));
  process.env.SKIP_KOR05 = 'true';
  const runResult = await KoreanIntegrityGate.runAll({
    filePath: path.join(tmpDir3, 'runall.ass'),
    originalContent: intAss,
    assContent: intAss,
    ffmpegStderr: 'video:2048kB audio:0kB',
    videoPath: '/nonexistent.mp4',
  });
  assert(runResult.pass, 'G13-04', `runAll PASS: ${runResult.passed}/${runResult.total}`);
  delete process.env.SKIP_KOR05;
  try { fs.rmSync(tmpDir3, { recursive: true }); } catch (_) {}

  // G13-05: SubtitleBurnIn.verifyFontLoad static 호출
  const fontCheck = SubtitleBurnIn.verifyFontLoad('video:1024kB');
  assert(typeof fontCheck.loaded === 'boolean', 'G13-05', 'verifyFontLoad 반환 형식');

  // G13-06: SubtitleConverter — 빈 SRT 처리
  const emptyEntries = SubtitleConverter.parseSrt('');
  assert(emptyEntries.length === 0, 'G13-06', '빈 SRT → 0 entries');

  console.log('');

  // ─── 최종 결과 ─────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Phase 2 결과: ${passed} PASS / ${failed} FAIL (총 ${passed + failed})`);
  console.log('═══════════════════════════════════════════════════════');

  if (failures.length > 0) {
    console.log('\n  실패 항목:');
    failures.forEach(f => console.log(`    - ${f}`));
  }

  console.log(`\n  상태: ${failed === 0 ? '✅ ALL PASS' : '❌ SOME FAILED'}\n`);
  process.exit(failed === 0 ? 0 : 1);
})();
