/**
 * certificateService.test.js
 * API-less 테스트 — sharp 로컬 처리만, OPENAI_API_KEY 불필요
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { generateCertificate } = require('../../services/certificateService');

const TEST_DIR = path.join(__dirname, '..', 'fixtures', 'certificate');
const TEST_IMAGE = path.join(TEST_DIR, 'test-source.png');
const CERT_DIR = path.join(__dirname, '..', '..', 'public', 'images', 'certificates');

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.error(`  ❌ ${name}`);
    failed++;
  }
}

/**
 * 테스트 전 소형 이미지 생성 (100x100 빨간 사각형)
 */
async function setup() {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
  await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } }
  }).png().toFile(TEST_IMAGE);
}

/**
 * 테스트 후 정리 (생성된 테스트 증명서 삭제)
 */
function cleanup(filenames) {
  for (const f of filenames) {
    const p = path.join(CERT_DIR, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  if (fs.existsSync(TEST_IMAGE)) fs.unlinkSync(TEST_IMAGE);
  if (fs.existsSync(TEST_DIR)) {
    try { fs.rmdirSync(TEST_DIR); } catch (_) { /* 다른 파일 있으면 무시 */ }
  }
}

(async () => {
  console.log('\n═══ certificateService 테스트 ═══\n');

  await setup();
  const generatedFiles = [];

  // ─── 1. 정상 생성 + 1024×1280 확인 ──────────────
  console.log('1. 정상 생성 (1024×1280)');
  {
    const result = await generateCertificate({
      imagePath: TEST_IMAGE,
      date: '2026-02-09',
      boardingId: 'YG-TEST-0001',
      caption: '조용한 하루가 쌓여가요'
    });

    generatedFiles.push(result.filename);

    const outputPath = path.join(CERT_DIR, result.filename);
    const meta = await sharp(outputPath).metadata();
    assert(meta.width === 1024, `width === 1024 (got ${meta.width})`);
    assert(meta.height === 1280, `height === 1280 (got ${meta.height})`);
    assert(meta.format === 'png', `format === png`);
  }

  // ─── 2. 반환값 구조 ─────────────────────────────
  console.log('\n2. 반환값 구조');
  {
    const result = await generateCertificate({
      imagePath: TEST_IMAGE,
      date: '2026-02-09',
      boardingId: 'YG-TEST-0002',
      caption: '테스트 캡션'
    });

    generatedFiles.push(result.filename);

    assert(typeof result.certificatePath === 'string', 'certificatePath is string');
    assert(result.certificatePath.startsWith('/images/certificates/'), 'certificatePath starts with /images/certificates/');
    assert(typeof result.filename === 'string', 'filename is string');
    assert(result.filename.endsWith('.png'), 'filename ends with .png');
    assert(result.metadata != null, 'metadata exists');
    assert(result.metadata.aspectRatio === '4:5', 'aspectRatio === 4:5');
    assert(result.metadata.date === '2026-02-09', 'date matches');
    assert(result.metadata.boardingId === 'YG-TEST-0002', 'boardingId matches');
    assert(result.metadata.caption === '테스트 캡션', 'caption matches');
  }

  // ─── 3. 존재하지 않는 이미지 → throw ────────────
  console.log('\n3. 존재하지 않는 이미지');
  {
    let threw = false;
    try {
      await generateCertificate({
        imagePath: '/nonexistent/path.png',
        date: '2026-02-09',
        boardingId: 'YG-TEST-ERR',
        caption: '에러 테스트'
      });
    } catch (err) {
      threw = true;
      assert(err.message.includes('not found'), `에러 메시지에 "not found" 포함`);
    }
    assert(threw, 'throw 발생');
  }

  // ─── 4. XSS 안전 ───────────────────────────────
  console.log('\n4. XSS 안전 (캡션에 <script> 포함)');
  {
    const result = await generateCertificate({
      imagePath: TEST_IMAGE,
      date: '2026-02-09',
      boardingId: 'YG-TEST-XSS',
      caption: '<script>alert("xss")</script>'
    });

    generatedFiles.push(result.filename);

    const outputPath = path.join(CERT_DIR, result.filename);
    assert(fs.existsSync(outputPath), '파일 정상 생성 (XSS 캡션에도 crash 없음)');
    const meta = await sharp(outputPath).metadata();
    assert(meta.width === 1024, 'XSS 캡션에도 1024×1280 출력');
  }

  // ─── 5. 출력 파일 존재 확인 ─────────────────────
  console.log('\n5. 출력 파일 존재 확인');
  {
    for (const f of generatedFiles) {
      const p = path.join(CERT_DIR, f);
      assert(fs.existsSync(p), `${f} 존재`);
    }
  }

  // ─── 정리 + 결과 ──────────────────────────────
  cleanup(generatedFiles);

  console.log(`\n═══ 결과: ${passed}/${passed + failed} 통과 ═══`);
  if (failed > 0) {
    console.error(`\n❌ ${failed}개 실패!`);
    process.exit(1);
  } else {
    console.log('\n✅ 모든 테스트 통과!');
  }
})();
