/**
 * postcardService.test.js
 * API-less 테스트 — sharp 로컬 처리만, OPENAI_API_KEY 불필요
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { generatePostcard } = require('../../services/postcardService');

const TEST_DIR = path.join(__dirname, '..', 'fixtures', 'postcard');
const TEST_IMAGE = path.join(TEST_DIR, 'test-source.png');
const POSTCARD_DIR = path.join(__dirname, '..', '..', 'public', 'images', 'postcards');

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log('  \u2705 ' + name);
    passed++;
  } else {
    console.error('  \u274C ' + name);
    failed++;
  }
}

async function setup() {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
  await sharp({
    create: { width: 200, height: 200, channels: 3, background: { r: 0, g: 100, b: 255 } }
  }).png().toFile(TEST_IMAGE);
}

function cleanup(filenames) {
  for (const f of filenames) {
    const p = path.join(POSTCARD_DIR, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  if (fs.existsSync(TEST_IMAGE)) fs.unlinkSync(TEST_IMAGE);
  if (fs.existsSync(TEST_DIR)) {
    try { fs.rmdirSync(TEST_DIR); } catch (_) {}
  }
}

(async () => {
  console.log('\n=== postcardService test ===\n');

  await setup();
  const generatedFiles = [];

  // 1. Normal generation (1024x1024)
  console.log('1. Normal generation (1024x1024)');
  {
    const result = await generatePostcard({
      imagePath: TEST_IMAGE,
      date: '2026-02-09',
      postcardId: 'PC-0209-0001',
      caption: 'quiet day accumulating'
    });

    generatedFiles.push(result.filename);

    const outputPath = path.join(POSTCARD_DIR, result.filename);
    const meta = await sharp(outputPath).metadata();
    assert(meta.width === 1024, 'width === 1024 (got ' + meta.width + ')');
    assert(meta.height === 1024, 'height === 1024 (got ' + meta.height + ')');
    assert(meta.format === 'png', 'format === png');
  }

  // 2. Return value structure
  console.log('\n2. Return value structure');
  {
    const result = await generatePostcard({
      imagePath: TEST_IMAGE,
      date: '2026-02-09',
      postcardId: 'PC-0209-0002',
      caption: 'test caption'
    });

    generatedFiles.push(result.filename);

    assert(typeof result.postcardPath === 'string', 'postcardPath is string');
    assert(result.postcardPath.startsWith('/images/postcards/'), 'postcardPath starts with /images/postcards/');
    assert(typeof result.filename === 'string', 'filename is string');
    assert(result.filename.startsWith('pc_'), 'filename starts with pc_');
    assert(result.filename.endsWith('.png'), 'filename ends with .png');
    assert(result.metadata != null, 'metadata exists');
    assert(result.metadata.aspectRatio === '1:1', 'aspectRatio === 1:1');
    assert(result.metadata.width === 1024, 'metadata.width === 1024');
    assert(result.metadata.height === 1024, 'metadata.height === 1024');
    assert(result.metadata.date === '2026-02-09', 'date matches');
    assert(result.metadata.postcardId === 'PC-0209-0002', 'postcardId matches');
    assert(result.metadata.caption === 'test caption', 'caption matches');
  }

  // 3. Non-existent image -> throw
  console.log('\n3. Non-existent image throws');
  {
    let threw = false;
    try {
      await generatePostcard({
        imagePath: '/nonexistent/path.png',
        date: '2026-02-09',
        postcardId: 'PC-ERR',
        caption: 'error test'
      });
    } catch (err) {
      threw = true;
      assert(err.message.includes('not found'), 'error message includes "not found"');
    }
    assert(threw, 'throw occurred');
  }

  // 4. XSS safety
  console.log('\n4. XSS safety');
  {
    const result = await generatePostcard({
      imagePath: TEST_IMAGE,
      date: '2026-02-09',
      postcardId: 'PC-XSS',
      caption: '<script>alert("xss")</script>'
    });

    generatedFiles.push(result.filename);

    const outputPath = path.join(POSTCARD_DIR, result.filename);
    assert(fs.existsSync(outputPath), 'file generated (no crash with XSS caption)');
    const meta = await sharp(outputPath).metadata();
    assert(meta.width === 1024, 'XSS caption still outputs 1024x1024');
  }

  // 5. Output files exist
  console.log('\n5. Output files exist');
  {
    for (const f of generatedFiles) {
      const p = path.join(POSTCARD_DIR, f);
      assert(fs.existsSync(p), f + ' exists');
    }
  }

  // Cleanup + results
  cleanup(generatedFiles);

  console.log('\n=== Result: ' + passed + '/' + (passed + failed) + ' passed ===');
  if (failed > 0) {
    console.error('\n' + failed + ' failed!');
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
  }
})();
