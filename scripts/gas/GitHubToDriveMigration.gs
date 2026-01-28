/**
 * GitHub → Drive 마이그레이션 스크립트
 *
 * 【설정 방법】
 * 1. Script Properties에 다음 값 설정:
 *    - GITHUB_TOKEN: GitHub Personal Access Token
 *    - GITHUB_OWNER: repo 소유자 (예: username)
 *    - GITHUB_REPO: repo 이름 (예: daily-miracles-mvp)
 *    - DRIVE_FOLDER_ID: 대상 Drive 폴더 ID
 *
 * 2. 스프레드시트 이름: RAW_MIGRATION_20260121
 * 3. 탭 이름: QUEUE
 */

// ============================================
// 설정 상수
// ============================================
const CONFIG = {
  SHEET_NAME: 'RAW_MIGRATION_20260121',
  TAB_NAME: 'QUEUE',
  RAW_PATH: 'docs/raw',  // GitHub repo 내 raw 폴더 경로
  ALLOWED_EXTENSIONS: ['.md', '.txt'],
  BATCH_SIZE: 10,
  COLUMNS: {
    REPO_PATH: 1,
    FILENAME: 2,
    STATUS: 3,
    DRIVE_FILE_URL: 4,
    ERROR_LOG: 5,
    CREATED_AT: 6,
    UPDATED_AT: 7
  },
  STATUS: {
    PENDING: 'PENDING',
    IMPORTED: 'IMPORTED',
    ERROR: 'ERROR',
    SKIP: 'SKIP'
  }
};

// ============================================
// 메뉴 등록
// ============================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔄 GitHub Migration')
    .addItem('1️⃣ QUEUE 탭 초기화', 'initializeQueueTab')
    .addItem('2️⃣ GitHub에서 파일 목록 스캔', 'scanGitHubFiles')
    .addSeparator()
    .addItem('3️⃣ PENDING 파일 처리 (10개)', 'processPendingFiles')
    .addItem('4️⃣ 모든 PENDING 처리', 'processAllPending')
    .addSeparator()
    .addItem('📊 상태 요약 보기', 'showStatusSummary')
    .addItem('🔄 ERROR 항목 재시도', 'retryErrorItems')
    .addToUi();
}

// ============================================
// 1. QUEUE 탭 초기화
// ============================================
function initializeQueueTab() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.TAB_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.TAB_NAME);
  }

  // 헤더 설정
  const headers = [
    ['repo_path', 'filename', 'status', 'drive_file_url', 'error_log', 'created_at', 'updated_at']
  ];

  sheet.getRange(1, 1, 1, 7).setValues(headers);
  sheet.getRange(1, 1, 1, 7)
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // 컬럼 너비 조정
  sheet.setColumnWidth(1, 300);  // repo_path
  sheet.setColumnWidth(2, 200);  // filename
  sheet.setColumnWidth(3, 100);  // status
  sheet.setColumnWidth(4, 300);  // drive_file_url
  sheet.setColumnWidth(5, 250);  // error_log
  sheet.setColumnWidth(6, 150);  // created_at
  sheet.setColumnWidth(7, 150);  // updated_at

  // 첫 행 고정
  sheet.setFrozenRows(1);

  SpreadsheetApp.getUi().alert('✅ QUEUE 탭 초기화 완료!');
}

// ============================================
// 2. GitHub 파일 스캔
// ============================================
function scanGitHubFiles() {
  const ui = SpreadsheetApp.getUi();

  try {
    const props = PropertiesService.getScriptProperties();
    const token = props.getProperty('GITHUB_TOKEN');
    const owner = props.getProperty('GITHUB_OWNER');
    const repo = props.getProperty('GITHUB_REPO');

    if (!token || !owner || !repo) {
      ui.alert('❌ 오류', 'Script Properties에 GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO를 설정하세요.', ui.ButtonSet.OK);
      return;
    }

    // raw 폴더만 스캔 (docs/ 폴더 스캔 금지 규칙 준수)
    const files = getGitHubFilesRecursive(token, owner, repo, CONFIG.RAW_PATH);

    if (files.length === 0) {
      ui.alert('ℹ️ 알림', 'raw/ 폴더에 .md, .txt 파일이 없습니다.', ui.ButtonSet.OK);
      return;
    }

    // 기존 경로 목록 가져오기 (중복 방지)
    const existingPaths = getExistingPaths();

    // 새 파일만 필터링
    const newFiles = files.filter(f => !existingPaths.includes(f.path));

    if (newFiles.length === 0) {
      ui.alert('ℹ️ 알림', '새로 추가할 파일이 없습니다. (모두 중복)', ui.ButtonSet.OK);
      return;
    }

    // QUEUE에 추가
    addFilesToQueue(newFiles);

    ui.alert('✅ 스캔 완료',
      `총 ${files.length}개 파일 발견\n` +
      `- 신규 추가: ${newFiles.length}개\n` +
      `- 중복 SKIP: ${files.length - newFiles.length}개`,
      ui.ButtonSet.OK);

  } catch (error) {
    ui.alert('❌ 스캔 오류', error.message, ui.ButtonSet.OK);
    Logger.log('scanGitHubFiles error: ' + error.message);
  }
}

/**
 * GitHub API로 재귀적 파일 목록 조회
 */
function getGitHubFilesRecursive(token, owner, repo, path) {
  const files = [];
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Google-Apps-Script'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();

  if (code !== 200) {
    throw new Error(`GitHub API 오류 (${code}): ${response.getContentText()}`);
  }

  const items = JSON.parse(response.getContentText());

  for (const item of items) {
    if (item.type === 'dir') {
      // 하위 폴더 재귀 탐색
      const subFiles = getGitHubFilesRecursive(token, owner, repo, item.path);
      files.push(...subFiles);
    } else if (item.type === 'file') {
      // 허용된 확장자만 필터링
      const ext = item.name.substring(item.name.lastIndexOf('.')).toLowerCase();
      if (CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
        files.push({
          path: item.path,
          name: item.name,
          download_url: item.download_url,
          sha: item.sha
        });
      }
    }
  }

  return files;
}

/**
 * 기존 등록된 경로 목록 조회
 */
function getExistingPaths() {
  const sheet = getQueueSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) return [];

  const paths = sheet.getRange(2, CONFIG.COLUMNS.REPO_PATH, lastRow - 1, 1).getValues();
  return paths.flat().filter(p => p);
}

/**
 * QUEUE 탭에 파일 추가
 */
function addFilesToQueue(files) {
  const sheet = getQueueSheet();
  const now = new Date();

  const rows = files.map(f => [
    f.path,                    // repo_path
    f.name,                    // filename
    CONFIG.STATUS.PENDING,     // status
    '',                        // drive_file_url
    '',                        // error_log
    now,                       // created_at
    now                        // updated_at
  ]);

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, rows.length, 7).setValues(rows);
}

// ============================================
// 3. PENDING 파일 처리
// ============================================
function processPendingFiles() {
  const ui = SpreadsheetApp.getUi();

  try {
    const result = processFilesWithStatus(CONFIG.STATUS.PENDING, CONFIG.BATCH_SIZE);

    ui.alert('✅ 처리 완료',
      `처리: ${result.processed}개\n` +
      `- 성공: ${result.success}개\n` +
      `- 실패: ${result.failed}개\n` +
      `남은 PENDING: ${result.remaining}개`,
      ui.ButtonSet.OK);

  } catch (error) {
    ui.alert('❌ 처리 오류', error.message, ui.ButtonSet.OK);
    Logger.log('processPendingFiles error: ' + error.message);
  }
}

/**
 * 모든 PENDING 처리
 */
function processAllPending() {
  const ui = SpreadsheetApp.getUi();

  const confirm = ui.alert(
    '⚠️ 확인',
    '모든 PENDING 항목을 처리합니다. 계속하시겠습니까?',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  let totalSuccess = 0;
  let totalFailed = 0;
  let iterations = 0;
  const maxIterations = 100; // 무한루프 방지

  while (iterations < maxIterations) {
    const result = processFilesWithStatus(CONFIG.STATUS.PENDING, CONFIG.BATCH_SIZE);

    if (result.processed === 0) break;

    totalSuccess += result.success;
    totalFailed += result.failed;
    iterations++;

    // API 제한 방지
    Utilities.sleep(1000);
  }

  ui.alert('✅ 전체 처리 완료',
    `총 ${totalSuccess + totalFailed}개 처리\n` +
    `- 성공: ${totalSuccess}개\n` +
    `- 실패: ${totalFailed}개`,
    ui.ButtonSet.OK);
}

/**
 * 특정 상태의 파일 처리
 */
function processFilesWithStatus(status, limit) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('GITHUB_TOKEN');
  const driveFolderId = props.getProperty('DRIVE_FOLDER_ID');

  if (!token || !driveFolderId) {
    throw new Error('Script Properties에 GITHUB_TOKEN, DRIVE_FOLDER_ID를 설정하세요.');
  }

  const sheet = getQueueSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return { processed: 0, success: 0, failed: 0, remaining: 0 };
  }

  // 전체 데이터 읽기
  const data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();

  // 대상 상태 행 찾기
  const targetRows = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i][CONFIG.COLUMNS.STATUS - 1] === status) {
      targetRows.push({ index: i + 2, data: data[i] });
      if (targetRows.length >= limit) break;
    }
  }

  let success = 0;
  let failed = 0;
  const driveFolder = DriveApp.getFolderById(driveFolderId);
  const now = new Date();

  for (const row of targetRows) {
    const repoPath = row.data[0];
    const filename = row.data[1];

    try {
      // GitHub에서 파일 다운로드
      const content = downloadFromGitHub(token, repoPath);

      // Drive에 파일 생성
      const driveFile = driveFolder.createFile(filename, content, MimeType.PLAIN_TEXT);
      const fileUrl = driveFile.getUrl();

      // 성공 업데이트
      sheet.getRange(row.index, CONFIG.COLUMNS.STATUS).setValue(CONFIG.STATUS.IMPORTED);
      sheet.getRange(row.index, CONFIG.COLUMNS.DRIVE_FILE_URL).setValue(fileUrl);
      sheet.getRange(row.index, CONFIG.COLUMNS.ERROR_LOG).setValue('');
      sheet.getRange(row.index, CONFIG.COLUMNS.UPDATED_AT).setValue(now);

      success++;

    } catch (error) {
      // 실패 업데이트
      sheet.getRange(row.index, CONFIG.COLUMNS.STATUS).setValue(CONFIG.STATUS.ERROR);
      sheet.getRange(row.index, CONFIG.COLUMNS.ERROR_LOG).setValue(error.message);
      sheet.getRange(row.index, CONFIG.COLUMNS.UPDATED_AT).setValue(now);

      failed++;
      Logger.log(`Error processing ${repoPath}: ${error.message}`);
    }

    // API 제한 방지
    Utilities.sleep(500);
  }

  // 남은 PENDING 개수 계산
  const remaining = data.filter(d => d[CONFIG.COLUMNS.STATUS - 1] === status).length - targetRows.length;

  return { processed: targetRows.length, success, failed, remaining };
}

/**
 * GitHub에서 파일 내용 다운로드
 */
function downloadFromGitHub(token, path) {
  const props = PropertiesService.getScriptProperties();
  const owner = props.getProperty('GITHUB_OWNER');
  const repo = props.getProperty('GITHUB_REPO');

  // Raw content URL 사용
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;

  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'Google-Apps-Script'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();

  if (code !== 200) {
    throw new Error(`다운로드 실패 (${code})`);
  }

  return response.getContentText();
}

// ============================================
// 4. 유틸리티 함수
// ============================================

/**
 * QUEUE 시트 가져오기
 */
function getQueueSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.TAB_NAME);

  if (!sheet) {
    throw new Error(`${CONFIG.TAB_NAME} 탭이 없습니다. 먼저 초기화하세요.`);
  }

  return sheet;
}

/**
 * 상태 요약 보기
 */
function showStatusSummary() {
  const ui = SpreadsheetApp.getUi();

  try {
    const sheet = getQueueSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      ui.alert('ℹ️ 알림', '등록된 파일이 없습니다.', ui.ButtonSet.OK);
      return;
    }

    const statuses = sheet.getRange(2, CONFIG.COLUMNS.STATUS, lastRow - 1, 1).getValues().flat();

    const summary = {
      PENDING: 0,
      IMPORTED: 0,
      ERROR: 0,
      SKIP: 0
    };

    statuses.forEach(s => {
      if (summary.hasOwnProperty(s)) {
        summary[s]++;
      }
    });

    const total = statuses.length;

    ui.alert('📊 상태 요약',
      `전체: ${total}개\n\n` +
      `⏳ PENDING: ${summary.PENDING}개\n` +
      `✅ IMPORTED: ${summary.IMPORTED}개\n` +
      `❌ ERROR: ${summary.ERROR}개\n` +
      `⏭️ SKIP: ${summary.SKIP}개`,
      ui.ButtonSet.OK);

  } catch (error) {
    ui.alert('❌ 오류', error.message, ui.ButtonSet.OK);
  }
}

/**
 * ERROR 항목 재시도
 */
function retryErrorItems() {
  const ui = SpreadsheetApp.getUi();

  try {
    const sheet = getQueueSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      ui.alert('ℹ️ 알림', '등록된 파일이 없습니다.', ui.ButtonSet.OK);
      return;
    }

    const data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    let resetCount = 0;

    for (let i = 0; i < data.length; i++) {
      if (data[i][CONFIG.COLUMNS.STATUS - 1] === CONFIG.STATUS.ERROR) {
        sheet.getRange(i + 2, CONFIG.COLUMNS.STATUS).setValue(CONFIG.STATUS.PENDING);
        sheet.getRange(i + 2, CONFIG.COLUMNS.ERROR_LOG).setValue('');
        sheet.getRange(i + 2, CONFIG.COLUMNS.UPDATED_AT).setValue(new Date());
        resetCount++;
      }
    }

    if (resetCount === 0) {
      ui.alert('ℹ️ 알림', 'ERROR 상태의 항목이 없습니다.', ui.ButtonSet.OK);
    } else {
      ui.alert('✅ 재시도 준비',
        `${resetCount}개 항목을 PENDING으로 변경했습니다.\n` +
        `"PENDING 파일 처리" 메뉴를 실행하세요.`,
        ui.ButtonSet.OK);
    }

  } catch (error) {
    ui.alert('❌ 오류', error.message, ui.ButtonSet.OK);
  }
}

// ============================================
// 테스트 함수
// ============================================

/**
 * Script Properties 확인용 테스트
 */
function testScriptProperties() {
  const props = PropertiesService.getScriptProperties();
  const keys = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO', 'DRIVE_FOLDER_ID'];

  let result = '=== Script Properties 확인 ===\n';

  keys.forEach(key => {
    const value = props.getProperty(key);
    if (value) {
      // 토큰은 일부만 표시
      if (key === 'GITHUB_TOKEN') {
        result += `${key}: ${value.substring(0, 10)}...(설정됨)\n`;
      } else {
        result += `${key}: ${value}\n`;
      }
    } else {
      result += `${key}: ❌ 미설정\n`;
    }
  });

  Logger.log(result);
  SpreadsheetApp.getUi().alert('설정 확인', result, SpreadsheetApp.getUi().ButtonSet.OK);
}
