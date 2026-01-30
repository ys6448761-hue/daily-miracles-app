/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Team Memory → Google Drive 백업 스크립트 (v2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 실행: npm run backup-memory
 *
 * 백업 대상 (v2 구조):
 *   - .claude/team-memory/context.md
 *   - .claude/team-memory/decisions/ (폴더 전체)
 *   - .claude/team-memory/learnings/ (폴더 전체)
 *   - .claude/team-memory/conversations/ (폴더 전체)
 *
 * 백업 위치:
 *   Google Drive/하루하루의기적/team-memory/
 *
 * 파일명 규칙:
 *   - 날짜별: 2025-01-30_context.md
 *   - 최신본: context_latest.md (항상 덮어쓰기)
 *   - 폴더: decisions/, learnings/, conversations/ (전체 복사)
 *
 * @version 2.0
 * @date 2025-01-30
 * ═══════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// 설정
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // 백업 대상 파일 (플랫 파일)
  sourceFiles: [
    'context.md'
  ],

  // 백업 대상 폴더 (v2 구조)
  sourceFolders: [
    'decisions',
    'learnings',
    'conversations',
    'playbooks'
  ],

  // 소스 폴더 (프로젝트 루트 기준)
  sourceDir: '.claude/team-memory',

  // Google Drive 내 백업 폴더
  driveSubFolder: '하루하루의기적/team-memory'
};

// ═══════════════════════════════════════════════════════════════════════════
// Google Drive 경로 탐지
// ═══════════════════════════════════════════════════════════════════════════

function findGoogleDrivePath() {
  // 1. 환경변수에서 먼저 확인
  if (process.env.GOOGLE_DRIVE_PATH) {
    const envPath = process.env.GOOGLE_DRIVE_PATH;
    if (fs.existsSync(envPath)) {
      return envPath;
    }
    console.log(`⚠️  GOOGLE_DRIVE_PATH 설정됨 but 경로 없음: ${envPath}`);
  }

  // 2. 일반적인 Google Drive Desktop 경로들
  const username = process.env.USERNAME || process.env.USER || '';
  const possiblePaths = [
    // Windows - Google Drive Desktop (새 버전)
    `G:\\내 드라이브`,
    `G:\\My Drive`,
    // Windows - 사용자 폴더
    `C:\\Users\\${username}\\Google Drive`,
    `C:\\Users\\${username}\\내 드라이브`,
    `C:\\Users\\${username}\\My Drive`,
    // Windows - 다른 드라이브 문자
    `H:\\내 드라이브`,
    `H:\\My Drive`,
    // macOS
    `/Users/${username}/Google Drive`,
    `/Users/${username}/Library/CloudStorage/GoogleDrive-*/My Drive`,
    // Linux
    `/home/${username}/Google Drive`
  ];

  for (const p of possiblePaths) {
    // 와일드카드 처리 (macOS Google Drive 스트림)
    if (p.includes('*')) {
      const dir = path.dirname(p);
      const pattern = path.basename(p).replace('*', '');
      if (fs.existsSync(dir)) {
        try {
          const entries = fs.readdirSync(dir);
          for (const entry of entries) {
            if (entry.includes('GoogleDrive')) {
              const fullPath = path.join(dir, entry, 'My Drive');
              if (fs.existsSync(fullPath)) {
                return fullPath;
              }
            }
          }
        } catch (e) {
          // 무시
        }
      }
    } else if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 유틸리티 함수
// ═══════════════════════════════════════════════════════════════════════════

function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
}

function copyFolderRecursive(src, dest) {
  ensureDir(dest);

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyFolderRecursive(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

function countFilesInFolder(folderPath) {
  if (!fs.existsSync(folderPath)) return 0;

  let count = 0;
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      count += countFilesInFolder(path.join(folderPath, entry.name));
    } else {
      count++;
    }
  }

  return count;
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 백업 함수
// ═══════════════════════════════════════════════════════════════════════════

async function backupMemory() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  📦 Team Memory → Google Drive 백업 (v2)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // 1. Google Drive 경로 찾기
  const drivePath = findGoogleDrivePath();

  if (!drivePath) {
    console.log('❌ Google Drive 폴더를 찾을 수 없습니다.\n');
    console.log('해결 방법:');
    console.log('');
    console.log('  1. Google Drive Desktop 설치:');
    console.log('     https://www.google.com/drive/download/');
    console.log('');
    console.log('  2. 또는 .env에 경로 직접 설정:');
    console.log('     GOOGLE_DRIVE_PATH=G:\\내 드라이브');
    console.log('');
    process.exit(1);
  }

  console.log(`📍 Google Drive 경로: ${drivePath}`);

  // 2. 백업 폴더 경로 설정
  const backupDir = path.join(drivePath, CONFIG.driveSubFolder);
  ensureDir(backupDir);
  console.log(`📁 백업 폴더: ${backupDir}`);
  console.log('');

  // 3. 프로젝트 루트 경로
  const projectRoot = path.join(__dirname, '..');
  const sourceDir = path.join(projectRoot, CONFIG.sourceDir);

  // 4. 소스 폴더 확인
  if (!fs.existsSync(sourceDir)) {
    console.log(`❌ 소스 폴더가 없습니다: ${sourceDir}`);
    process.exit(1);
  }

  // 5. 날짜 문자열
  const dateStr = getDateString();
  const backedUpFiles = [];
  const backedUpFolders = [];

  console.log('📋 백업 진행:');
  console.log('───────────────────────────────────────────────────────────');

  // 6. 플랫 파일 백업
  for (const fileName of CONFIG.sourceFiles) {
    const srcPath = path.join(sourceDir, fileName);

    if (!fs.existsSync(srcPath)) {
      console.log(`   ⚠️  ${fileName} - 파일 없음 (스킵)`);
      continue;
    }

    // 파일명에서 확장자 분리
    const baseName = path.basename(fileName, '.md');

    // 날짜별 백업
    const datedFileName = `${dateStr}_${fileName}`;
    const datedPath = path.join(backupDir, datedFileName);
    copyFile(srcPath, datedPath);

    // 최신본 백업 (덮어쓰기)
    const latestFileName = `${baseName}_latest.md`;
    const latestPath = path.join(backupDir, latestFileName);
    copyFile(srcPath, latestPath);

    console.log(`   ✅ ${fileName}`);
    console.log(`      → ${datedFileName}`);
    console.log(`      → ${latestFileName}`);

    backedUpFiles.push({
      source: fileName,
      dated: datedFileName,
      latest: latestFileName
    });
  }

  // 7. 폴더 백업 (v2 구조)
  console.log('');
  console.log('📂 폴더 백업:');
  console.log('───────────────────────────────────────────────────────────');

  for (const folderName of CONFIG.sourceFolders) {
    const srcFolderPath = path.join(sourceDir, folderName);

    if (!fs.existsSync(srcFolderPath)) {
      console.log(`   ⚠️  ${folderName}/ - 폴더 없음 (스킵)`);
      continue;
    }

    const destFolderPath = path.join(backupDir, folderName);
    const fileCount = countFilesInFolder(srcFolderPath);

    // 폴더 전체 복사
    copyFolderRecursive(srcFolderPath, destFolderPath);

    console.log(`   ✅ ${folderName}/ (${fileCount}개 파일)`);
    console.log(`      → ${destFolderPath}`);

    backedUpFolders.push({
      name: folderName,
      fileCount: fileCount
    });
  }

  console.log('───────────────────────────────────────────────────────────');
  console.log('');

  // 8. 완료 메시지
  const totalFiles = backedUpFiles.length;
  const totalFolders = backedUpFolders.length;
  const totalFolderFiles = backedUpFolders.reduce((sum, f) => sum + f.fileCount, 0);

  if (totalFiles > 0 || totalFolders > 0) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  ✅ 백업 완료!`);
    console.log(`     파일: ${totalFiles}개 | 폴더: ${totalFolders}개 (${totalFolderFiles}개 파일)`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('📁 백업 위치:');
    console.log(`   ${backupDir}`);
    console.log('');

    if (backedUpFiles.length > 0) {
      console.log('📄 백업된 파일:');
      for (const file of backedUpFiles) {
        console.log(`   • ${file.latest}`);
      }
    }

    if (backedUpFolders.length > 0) {
      console.log('');
      console.log('📂 백업된 폴더:');
      for (const folder of backedUpFolders) {
        console.log(`   • ${folder.name}/ (${folder.fileCount}개)`);
      }
    }
    console.log('');
  } else {
    console.log('⚠️  백업된 항목이 없습니다.');
  }

  return { files: backedUpFiles, folders: backedUpFolders };
}

// ═══════════════════════════════════════════════════════════════════════════
// 실행
// ═══════════════════════════════════════════════════════════════════════════

backupMemory()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ 백업 실패:', err.message);
    process.exit(1);
  });
