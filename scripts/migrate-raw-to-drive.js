/**
 * migrate-raw-to-drive.js
 *
 * docs/raw/conversations 폴더의 md 파일을 RAW Process API로 전송 후 삭제
 *
 * 사용법: node scripts/migrate-raw-to-drive.js [--dry-run] [--limit=N]
 *
 * @version 1.0
 * @date 2026-01-20
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ═══════════════════════════════════════════════════════════════════════════
// 설정
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  RAW_DIR: path.join(__dirname, '..', 'docs', 'raw', 'conversations'),
  API_URL: 'https://daily-miracles-app.onrender.com/api/raw/process',
  DELAY_MS: 2000,  // API 호출 간 딜레이 (레이트 리밋 방지)
  DRY_RUN: process.argv.includes('--dry-run'),
  LIMIT: parseInt((process.argv.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity
};

// ═══════════════════════════════════════════════════════════════════════════
// 유틸리티
// ═══════════════════════════════════════════════════════════════════════════

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractCategoryFromPath(filePath) {
  // docs/raw/conversations/2026-01/루미/xxx.md → 루미
  // docs/raw/conversations/2025-12/xxx.md → 기타
  const parts = filePath.split(path.sep);
  const convIndex = parts.indexOf('conversations');

  if (convIndex >= 0 && parts.length > convIndex + 2) {
    const possibleCategory = parts[convIndex + 2];
    // 카테고리 폴더인지 확인 (날짜 패턴이 아니면 카테고리)
    if (!/^\d{4}-\d{2}/.test(possibleCategory) && !possibleCategory.endsWith('.md')) {
      return possibleCategory;
    }
  }
  return '기타';
}

function extractTitleFromFilename(filename) {
  // 2026-01-12_코드작업지시md파일.md → 코드작업지시md파일
  // Aurora5 complete setup guide.md → Aurora5 complete setup guide
  let title = path.basename(filename, '.md');

  // 날짜 prefix 제거 (2026-01-12_ 형식)
  title = title.replace(/^\d{4}-\d{2}-\d{2}_/, '');

  return title || '무제';
}

// ═══════════════════════════════════════════════════════════════════════════
// 파일 수집
// ═══════════════════════════════════════════════════════════════════════════

function collectMarkdownFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      collectMarkdownFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

// ═══════════════════════════════════════════════════════════════════════════
// API 호출
// ═══════════════════════════════════════════════════════════════════════════

function callRawProcessAPI(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);

    const url = new URL(CONFIG.API_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          reject(new Error(`JSON parse error: ${body.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 처리
// ═══════════════════════════════════════════════════════════════════════════

async function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const title = extractTitleFromFilename(filePath);
  const category = extractCategoryFromPath(filePath);

  const payload = {
    drive_url: `file://${filePath}`,  // 로컬 경로 (Drive URL은 Apps Script에서 생성)
    title: title,
    category: category,
    content: content,
    created_at: new Date().toISOString(),
    source: 'GitMigration'
  };

  console.log(`\n📄 처리 중: ${title}`);
  console.log(`   카테고리: ${category}`);
  console.log(`   크기: ${content.length} chars`);

  if (CONFIG.DRY_RUN) {
    console.log(`   [DRY-RUN] API 호출 스킵`);
    return { success: true, dry_run: true };
  }

  const result = await callRawProcessAPI(payload);

  if (result.success) {
    console.log(`   ✅ 성공: ${result.summary?.slice(0, 50)}...`);
    console.log(`   Slack: ${result.slack_ts || 'N/A'}`);
  } else {
    console.log(`   ❌ 실패: ${result.error}`);
  }

  return result;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  RAW → Drive 마이그레이션 스크립트');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  소스: ${CONFIG.RAW_DIR}`);
  console.log(`  API: ${CONFIG.API_URL}`);
  console.log(`  Dry Run: ${CONFIG.DRY_RUN}`);
  console.log(`  Limit: ${CONFIG.LIMIT === Infinity ? '없음' : CONFIG.LIMIT}`);
  console.log('═══════════════════════════════════════════════════════════');

  // 파일 수집
  const files = collectMarkdownFiles(CONFIG.RAW_DIR);
  console.log(`\n📁 발견된 파일: ${files.length}개`);

  if (files.length === 0) {
    console.log('처리할 파일이 없습니다.');
    return;
  }

  // 처리할 파일 수 제한
  const filesToProcess = files.slice(0, CONFIG.LIMIT);
  console.log(`📋 처리 예정: ${filesToProcess.length}개`);

  // 처리
  let successCount = 0;
  let failCount = 0;
  const deletedFiles = [];

  for (let i = 0; i < filesToProcess.length; i++) {
    const filePath = filesToProcess[i];
    console.log(`\n[${i + 1}/${filesToProcess.length}]`);

    try {
      const result = await processFile(filePath);

      if (result.success) {
        successCount++;

        // 파일 삭제
        if (!CONFIG.DRY_RUN) {
          fs.unlinkSync(filePath);
          deletedFiles.push(filePath);
          console.log(`   🗑️ 파일 삭제됨`);
        } else {
          console.log(`   [DRY-RUN] 삭제 스킵`);
        }
      } else {
        failCount++;
      }

      // 딜레이 (마지막 파일 제외)
      if (i < filesToProcess.length - 1) {
        await sleep(CONFIG.DELAY_MS);
      }

    } catch (error) {
      console.log(`   ❌ 에러: ${error.message}`);
      failCount++;
    }
  }

  // 빈 폴더 정리
  if (!CONFIG.DRY_RUN && deletedFiles.length > 0) {
    console.log('\n🧹 빈 폴더 정리 중...');
    cleanEmptyDirs(CONFIG.RAW_DIR);
  }

  // 결과
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  마이그레이션 완료');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  성공: ${successCount}개`);
  console.log(`  실패: ${failCount}개`);
  console.log(`  삭제: ${deletedFiles.length}개`);
  console.log('═══════════════════════════════════════════════════════════');
}

function cleanEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dir, entry.name);
      cleanEmptyDirs(fullPath);

      // 빈 폴더면 삭제
      const remaining = fs.readdirSync(fullPath);
      if (remaining.length === 0) {
        fs.rmdirSync(fullPath);
        console.log(`   🗑️ 빈 폴더 삭제: ${entry.name}`);
      }
    }
  }
}

// 실행
main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
