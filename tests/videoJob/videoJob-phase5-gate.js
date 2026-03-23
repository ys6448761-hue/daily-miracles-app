#!/usr/bin/env node
/**
 * VideoJob Phase 5 Gate Test — Packager ASS + _doSubtitle Chain
 *
 * 실행: npm run test:videoJob:p5
 * Gate: G24-G28 (24 TC)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const { STATES, ERROR_CODES } = require('../../services/videoJob/constants');
const VideoJobOrchestrator = require('../../services/videoJob/VideoJobOrchestrator');
const VideoJobStore = require('../../services/videoJob/VideoJobStore');
const SubtitleConverter = require('../../services/videoJob/SubtitleConverter');
const FontManager = require('../../services/videoJob/FontManager');
const KoreanIntegrityGate = require('../../services/videoJob/KoreanIntegrityGate');
const Packager = require('../../services/hero8/Packager');
const AdmZip = require('adm-zip');

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
console.log('  VideoJob Phase 5 Gate Test (G24-G28)');
console.log('═══════════════════════════════════════════════════════\n');

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

const SAMPLE_ASS = SubtitleConverter.srtToAss(SAMPLE_SRT);

(async () => {

  // ─── G24: Packager ASS 저장 + meta.json (6 TC) ─────────────
  console.log('--- G24: Packager ASS Save + Meta ---\n');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'g24-'));
  const packager = new Packager();
  // 수동으로 outputDir 구조 생성
  fs.mkdirSync(path.join(tmpDir, 'subtitles'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'keyframes'), { recursive: true });

  // G24-01: saveSubtitles에 ASS 포함
  const subtitles = {
    txt: '괜찮은 척, 오늘도 했죠?',
    srt: SAMPLE_SRT,
    json: [{ id: 1, text: '괜찮은 척' }],
    ass: SAMPLE_ASS,
  };
  await packager.saveSubtitles(subtitles, tmpDir);
  const assExists = fs.existsSync(path.join(tmpDir, 'subtitles', 'subtitles.ass'));
  assert(assExists, 'G24-01', `subtitles.ass 파일 생성됨`);

  // G24-02: ASS 파일 UTF-8 내용 보존
  if (assExists) {
    const savedAss = fs.readFileSync(path.join(tmpDir, 'subtitles', 'subtitles.ass'), 'utf-8');
    assert(savedAss === SAMPLE_ASS, 'G24-02', 'ASS 파일 UTF-8 내용 일치');
  } else {
    assert(false, 'G24-02', 'ASS 파일 없음');
  }

  // G24-03: SRT 파일도 동시 저장됨
  assert(
    fs.existsSync(path.join(tmpDir, 'subtitles', 'subtitles.srt')),
    'G24-03', 'subtitles.srt 동시 저장'
  );

  // G24-04: meta.json에 ass 포함
  const meta = await packager.generateMeta({
    requestId: 'g24-test',
    storyCard: { topic: '테스트', heroId: 'HERO1', location: 'Yeosu', locationKo: '여수', time: 'sunset', mood: 'calm', totalDuration: 8, timing: [] },
    keyframes: [],
    video: { duration: 8 },
    hasAss: true,
    createdAt: new Date().toISOString(),
  }, tmpDir);
  assert(meta.subtitles.ass === 'subtitles/subtitles.ass', 'G24-04', 'meta.json에 ass 경로 포함');

  // G24-05: hasAss=false일 때 meta에 ass 없음
  const metaNoAss = await packager.generateMeta({
    requestId: 'g24-test-noass',
    storyCard: { topic: '테스트', heroId: 'HERO1', location: 'Yeosu', locationKo: '여수', time: 'sunset', mood: 'calm', totalDuration: 8, timing: [] },
    keyframes: [],
    video: { duration: 8 },
    hasAss: false,
    createdAt: new Date().toISOString(),
  }, tmpDir);
  assert(metaNoAss.subtitles.ass === undefined, 'G24-05', 'hasAss=false → meta.subtitles.ass 없음');

  // G24-06: saveSubtitles without ass (backward compat)
  const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'g24b-'));
  fs.mkdirSync(path.join(tmpDir2, 'subtitles'), { recursive: true });
  await packager.saveSubtitles({ txt: 'hello', srt: 'hi', json: [] }, tmpDir2);
  assert(
    !fs.existsSync(path.join(tmpDir2, 'subtitles', 'subtitles.ass')),
    'G24-06', 'ass 없으면 파일 미생성 (하위 호환)'
  );
  try { fs.rmSync(tmpDir2, { recursive: true }); } catch (_) {}

  console.log('');

  // ─── G25: ZIP UTF-8 무결성 검증 (6 TC) ─────────────────────
  console.log('--- G25: ZIP UTF-8 Integrity ---\n');

  // ZIP 생성을 위해 더미 파일 준비
  fs.writeFileSync(path.join(tmpDir, 'final.mp4'), 'dummy-video', 'utf-8');
  fs.writeFileSync(path.join(tmpDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');

  const zipPath = await packager.createZip(tmpDir);

  // G25-01: ZIP에 subtitles.ass 포함
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries().map(e => e.entryName);
  assert(entries.some(e => e.includes('subtitles.ass')), 'G25-01', `ZIP에 subtitles.ass 포함 (entries: ${entries.length})`);

  // G25-02: ZIP에 subtitles.srt 포함
  assert(entries.some(e => e.includes('subtitles.srt')), 'G25-02', 'ZIP에 subtitles.srt 포함');

  // G25-03: ZIP에 meta.json 포함
  assert(entries.some(e => e === 'meta.json'), 'G25-03', 'ZIP에 meta.json 포함');

  // G25-04: verifyZipUtf8 — 정상 케이스 통과
  {
    let verifyPassed = false;
    try {
      await packager.verifyZipUtf8(zipPath, {
        'subtitles/subtitles.srt': SAMPLE_SRT,
        'subtitles/subtitles.ass': SAMPLE_ASS,
        'meta.json': JSON.stringify(meta, null, 2),
      });
      verifyPassed = true;
    } catch (e) {
      verifyPassed = false;
    }
    assert(verifyPassed, 'G25-04', 'verifyZipUtf8 정상 케이스 통과');
  }

  // G25-05: verifyZipUtf8 — 변조된 내용 → 에러
  {
    let corruptionDetected = false;
    try {
      await packager.verifyZipUtf8(zipPath, {
        'subtitles/subtitles.srt': SAMPLE_SRT + '\n변조된 내용',
      });
    } catch (e) {
      corruptionDetected = e.errorCode === 'ZIP_UTF8_CORRUPTION';
    }
    assert(corruptionDetected, 'G25-05', 'verifyZipUtf8 변조 감지 → ZIP_UTF8_CORRUPTION');
  }

  // G25-06: ZIP ASS 한글 바이트 비교 (Buffer.compare)
  {
    const assEntry = zip.getEntries().find(e => e.entryName.includes('subtitles.ass'));
    if (assEntry) {
      const extractedBuf = assEntry.getData();
      const originalBuf = Buffer.from(SAMPLE_ASS, 'utf-8');
      assert(Buffer.compare(extractedBuf, originalBuf) === 0, 'G25-06', 'ZIP ASS 바이트 일치');
    } else {
      assert(false, 'G25-06', 'ZIP에서 ASS 엔트리 미발견');
    }
  }

  try { fs.rmSync(tmpDir, { recursive: true }); } catch (_) {}

  console.log('');

  // ─── G26: _doSubtitle Chain — adCreative (4 TC) ────────────
  console.log('--- G26: _doSubtitle adCreative Path ---\n');

  // G26-01: adCreative → json format (기존 동작 유지)
  {
    const orchestrator = new VideoJobOrchestrator();
    const result = await orchestrator.execute({
      request_id: 'p5-ad-001',
      job_type: 'adCreative',
      config_id: 'healing-high',
      topic: '',
    });
    assert(result.status === STATES.DONE, 'G26-01', `adCreative → DONE (got ${result.status})`);
  }

  // G26-02: adCreative 4종 전부 DONE (회귀)
  {
    const configs = ['healing-high', 'growth-high', 'healing-mid', 'growth-mid'];
    let allDone = true;
    for (const cfg of configs) {
      const orc = new VideoJobOrchestrator();
      const r = await orc.execute({
        request_id: `p5-ad-${cfg}`,
        job_type: 'adCreative',
        config_id: cfg,
        topic: '',
      });
      if (r.status !== STATES.DONE) allDone = false;
    }
    assert(allDone, 'G26-02', 'adCreative 4종 전부 DONE');
  }

  // G26-03: 잘못된 config → FAILED (회귀)
  {
    const orc = new VideoJobOrchestrator();
    const r = await orc.execute({
      request_id: 'p5-ad-bad',
      job_type: 'adCreative',
      config_id: 'nonexistent',
      topic: '',
    });
    assert(r.status === STATES.FAILED, 'G26-03', `잘못된 config → FAILED (got ${r.status})`);
  }

  // G26-04: hero8 without SRT → SUBTITLE_FAILED 또는 BUILD_FAILED
  {
    const orc = new VideoJobOrchestrator();
    const r = await orc.execute({
      request_id: 'p5-hero8-nosrt',
      job_type: 'hero8',
      hero_id: 'HERO1',
      topic: '여수 테스트',
      mood: 'calm',
    });
    assert(r.status === STATES.FAILED, 'G26-04', `hero8 without deps → FAILED (got ${r.status})`);
  }

  console.log('');

  // ─── G27: SubtitleConverter + KOR Gate 통합 (4 TC) ─────────
  console.log('--- G27: Subtitle + KOR Integration ---\n');

  // G27-01: SRT NFC + LF 정규화 → ASS 변환 → KOR-04 통과
  {
    const srt = SAMPLE_SRT.normalize('NFC').replace(/\r\n/g, '\n');
    const ass = SubtitleConverter.srtToAss(srt);
    const kor04 = KoreanIntegrityGate.verifyAssParse(ass);
    assert(kor04.pass, 'G27-01', `NFC+LF → ASS → KOR-04: ${kor04.detail}`);
  }

  // G27-02: CRLF 입력도 LF 변환 후 정상
  {
    const crlfSrt = SAMPLE_SRT.replace(/\n/g, '\r\n');
    const normalized = crlfSrt.normalize('NFC').replace(/\r\n/g, '\n');
    const ass = SubtitleConverter.srtToAss(normalized);
    assert(ass.includes('괜찮은 척'), 'G27-02', 'CRLF → LF 변환 후 한글 보존');
  }

  // G27-03: FontManager.resolve() — 에러 코드 FONT_NOT_FOUND (또는 성공)
  {
    let fontOk = false;
    try {
      const fp = FontManager.resolve();
      fontOk = typeof fp === 'string' && fp.length > 0;
    } catch (e) {
      fontOk = e.errorCode === 'FONT_NOT_FOUND';
    }
    assert(fontOk, 'G27-03', 'FontManager resolve: 성공 또는 FONT_NOT_FOUND');
  }

  // G27-04: KOR Gate runAll — assContent만으로 실행 가능
  {
    const result = await KoreanIntegrityGate.runAll({ assContent: SAMPLE_ASS });
    assert(result.total >= 1 && result.passed >= 1, 'G27-04', `runAll(assContent only): ${result.passed}/${result.total}`);
  }

  console.log('');

  // ─── G28: ZIP_UTF8_CORRUPTION + ERROR_CODES (4 TC) ─────────
  console.log('--- G28: ZIP_UTF8_CORRUPTION ---\n');

  // G28-01: ERROR_CODES에 ZIP_UTF8_CORRUPTION 존재
  assert(
    ERROR_CODES.ZIP_UTF8_CORRUPTION === 'ZIP_UTF8_CORRUPTION',
    'G28-01', 'ZIP_UTF8_CORRUPTION 에러 코드 정의됨'
  );

  // G28-02: Store에 ZIP_UTF8_CORRUPTION으로 failJob 가능
  {
    const store = new VideoJobStore();
    await store.createJob({ request_id: 'p5-fail-zip', topic: 'test' });
    const failedJob = await store.failJob('p5-fail-zip', ERROR_CODES.ZIP_UTF8_CORRUPTION, 'UTF-8 corruption');
    assert(failedJob.error_code === 'ZIP_UTF8_CORRUPTION', 'G28-02', 'failJob ZIP_UTF8_CORRUPTION');
  }

  // G28-03: Packager verifyZipUtf8 메서드 존재
  {
    const p = new Packager();
    assert(typeof p.verifyZipUtf8 === 'function', 'G28-03', 'verifyZipUtf8 메서드 존재');
  }

  // G28-04: 정상 ZIP 검증 → 에러 없음
  {
    const tmpDir3 = fs.mkdtempSync(path.join(os.tmpdir(), 'g28-'));
    fs.mkdirSync(path.join(tmpDir3, 'subtitles'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir3, 'subtitles', 'subtitles.srt'), SAMPLE_SRT, 'utf-8');
    fs.writeFileSync(path.join(tmpDir3, 'meta.json'), '{"test":true}', 'utf-8');

    const z = new AdmZip();
    z.addFile('subtitles/subtitles.srt', Buffer.from(SAMPLE_SRT, 'utf-8'));
    z.addFile('meta.json', Buffer.from('{"test":true}', 'utf-8'));
    const zp = path.join(tmpDir3, 'verify.zip');
    z.writeZip(zp);

    let ok = false;
    try {
      const p = new Packager();
      await p.verifyZipUtf8(zp, {
        'subtitles/subtitles.srt': SAMPLE_SRT,
        'meta.json': '{"test":true}',
      });
      ok = true;
    } catch (_) {}
    assert(ok, 'G28-04', '정상 ZIP 검증 통과');
    try { fs.rmSync(tmpDir3, { recursive: true }); } catch (_) {}
  }

  console.log('');

  // ─── 최종 결과 ─────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Phase 5 결과: ${passed} PASS / ${failed} FAIL (총 ${passed + failed})`);
  console.log('═══════════════════════════════════════════════════════');

  if (failures.length > 0) {
    console.log('\n  실패 항목:');
    failures.forEach(f => console.log(`    - ${f}`));
  }

  console.log(`\n  상태: ${failed === 0 ? '✅ ALL PASS' : '❌ SOME FAILED'}\n`);
  process.exit(failed === 0 ? 0 : 1);
})();
