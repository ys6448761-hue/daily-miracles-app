/**
 * DreamTown Asset OS — Google Apps Script
 * 시트: Asset_Master / Video_Master / SSOT / Partner
 *
 * 설치 방법:
 *   1. Google Sheet(DreamTown Asset OS) 열기
 *   2. 확장 프로그램 > Apps Script
 *   3. 이 파일 전체 붙여넣기 → 저장(Ctrl+S)
 *   4. 함수 선택: setupSheets → 실행 (최초 1회)
 *   5. 시트에서 메뉴 새로고침 → "🌟 Asset OS" 메뉴 확인
 *   6. Asset OS > 폴더 ID 설정 → Drive 폴더 ID 입력
 *   7. Asset OS > 전체 동기화
 *
 * 파일명 규칙:
 *   DT-{Country}-{Route}-{EP}-{Location}-{Type}-{SubType}-{Version}.{ext}
 *   예) DT-KR-SR-EP01-HAMEL-IMG-MASTER-V01.png
 */

// ── 컬럼 헤더 정의 ─────────────────────────────────────────────
const HEADERS = {
  Asset_Master: ['File Name','Country','Route','EP','Location','Type','Sub-Type','Version','Extension','Drive Link','Created Date','Last Synced','Status'],
  Video_Master: ['File Name','Country','Route','EP','Location','Type','Sub-Type','Version','Extension','Drive Link','Created Date','Last Synced','Status'],
  SSOT:         ['File Name','Country','Route','EP','Location','Type','Version','Extension','Drive Link','Created Date','Last Synced','Status'],
  Partner:      ['Partner Code','Partner Name','Category','Region','Address','Phone','Benefit','Route','Drive Link','Status','Notes'],
};

// ── 헤더 색상 ──────────────────────────────────────────────────
const COLORS = {
  Asset_Master: '#1B4B8A',
  Video_Master: '#5B2C8A',
  SSOT:         '#1A5C3A',
  Partner:      '#7A4A00',
};

// ── 메뉴 ──────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🌟 Asset OS')
    .addItem('전체 동기화 (Drive → Sheet)', 'syncAll')
    .addSeparator()
    .addItem('시트 초기화 (헤더 설정)', 'setupSheets')
    .addItem('Drive 폴더 ID 설정', 'setFolderId')
    .addItem('현재 폴더 ID 확인', 'showFolderId')
    .addSeparator()
    .addItem('Asset_Master 초기화', 'clearAsset')
    .addItem('Video_Master 초기화', 'clearVideo')
    .addItem('SSOT 초기화', 'clearSSOT')
    .addToUi();
}

// ── 폴더 ID 설정 ──────────────────────────────────────────────
function setFolderId() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt(
    'DreamTown Drive 폴더 ID',
    'Google Drive에서 폴더 열기 → URL의 폴더 ID를 복사하세요.\n예) https://drive.google.com/drive/folders/[이 부분이 ID]',
    ui.ButtonSet.OK_CANCEL
  );
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const id = res.getResponseText().trim();
  PropertiesService.getScriptProperties().setProperty('DRIVE_FOLDER_ID', id);
  ui.alert('✅ 폴더 ID 저장 완료\n' + id);
}

function showFolderId() {
  const id = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID') || '(미설정)';
  SpreadsheetApp.getUi().alert('현재 폴더 ID: ' + id);
}

// ── 시트 초기화 ──────────────────────────────────────────────
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.entries(HEADERS).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    _setHeader(sheet, headers, COLORS[name]);
  });
  SpreadsheetApp.getUi().alert('✅ 시트 초기화 완료\nAsset_Master / Video_Master / SSOT / Partner 헤더 설정됨');
}

function _setHeader(sheet, headers, color) {
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers])
       .setBackground(color)
       .setFontColor('#FFFFFF')
       .setFontWeight('bold')
       .setFontSize(11);
  sheet.setFrozenRows(1);
  // 파일명 컬럼 넓게
  sheet.setColumnWidth(1, 340);
  // Drive Link 컬럼
  const linkCol = headers.indexOf('Drive Link') + 1;
  if (linkCol > 0) sheet.setColumnWidth(linkCol, 280);
}

// ── 개별 시트 초기화 ──────────────────────────────────────────
function clearAsset() { _clearSheet('Asset_Master'); }
function clearVideo()  { _clearSheet('Video_Master'); }
function clearSSOT()   { _clearSheet('SSOT'); }

function _clearSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) return;
  if (sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);
  SpreadsheetApp.getUi().alert(name + ' 데이터가 초기화되었습니다.');
}

// ── 전체 동기화 ───────────────────────────────────────────────
function syncAll() {
  const folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');
  if (!folderId) {
    SpreadsheetApp.getUi().alert('❌ Drive 폴더 ID가 설정되지 않았습니다.\nAsset OS > Drive 폴더 ID 설정 메뉴를 먼저 실행하세요.');
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = {
    asset: ss.getSheetByName('Asset_Master'),
    video: ss.getSheetByName('Video_Master'),
    ssot:  ss.getSheetByName('SSOT'),
  };

  // 기존 파일명 수집 (중복 방지)
  const existing = {
    asset: _getExistingNames(sheets.asset),
    video: _getExistingNames(sheets.video),
    ssot:  _getExistingNames(sheets.ssot),
  };

  const rows = { asset: [], video: [], ssot: [] };
  const now = new Date();

  // Drive 재귀 스캔
  _scanFolder(DriveApp.getFolderById(folderId), rows, existing, now);

  // 신규 행 추가
  if (rows.asset.length > 0) {
    sheets.asset.getRange(sheets.asset.getLastRow()+1, 1, rows.asset.length, HEADERS.Asset_Master.length).setValues(rows.asset);
  }
  if (rows.video.length > 0) {
    sheets.video.getRange(sheets.video.getLastRow()+1, 1, rows.video.length, HEADERS.Video_Master.length).setValues(rows.video);
  }
  if (rows.ssot.length > 0) {
    sheets.ssot.getRange(sheets.ssot.getLastRow()+1, 1, rows.ssot.length, HEADERS.SSOT.length).setValues(rows.ssot);
  }

  const msg = `✅ 동기화 완료\n📷 Asset_Master: +${rows.asset.length}건\n🎬 Video_Master: +${rows.video.length}건\n📄 SSOT: +${rows.ssot.length}건`;
  SpreadsheetApp.getUi().alert(msg);
}

function _getExistingNames(sheet) {
  if (!sheet || sheet.getLastRow() <= 1) return new Set();
  return new Set(
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().map(r => r[0])
  );
}

// ── Drive 재귀 스캔 ───────────────────────────────────────────
function _scanFolder(folder, rows, existing, now) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    _processFile(files.next(), rows, existing, now);
  }
  const subs = folder.getFolders();
  while (subs.hasNext()) {
    _scanFolder(subs.next(), rows, existing, now);
  }
}

function _processFile(file, rows, existing, now) {
  const name = file.getName();
  if (!name.startsWith('DT-')) return; // DT- 파일만 처리

  const parsed = _parseFileName(name);
  const category = _getCategory(parsed);
  if (!category) return; // 미분류 스킵

  const url  = file.getUrl();
  const created = Utilities.formatDate(file.getDateCreated(), 'Asia/Seoul', 'yyyy-MM-dd');
  const synced  = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm');

  if (category === 'asset' && !existing.asset.has(name)) {
    rows.asset.push([
      name, parsed.country, parsed.route, parsed.ep, parsed.location,
      parsed.type, parsed.subType, parsed.version, parsed.ext,
      url, created, synced, 'Active'
    ]);
  } else if (category === 'video' && !existing.video.has(name)) {
    rows.video.push([
      name, parsed.country, parsed.route, parsed.ep, parsed.location,
      parsed.type, parsed.subType, parsed.version, parsed.ext,
      url, created, synced, 'Active'
    ]);
  } else if (category === 'ssot' && !existing.ssot.has(name)) {
    rows.ssot.push([
      name, parsed.country, parsed.route, parsed.ep, parsed.location,
      parsed.type, parsed.version, parsed.ext,
      url, created, synced, 'Active'
    ]);
  }
}

// ── 파일명 파싱 ───────────────────────────────────────────────
// DT-KR-SR-EP01-HAMEL-IMG-MASTER-V01.png
// [0]DT [1]Country [2]Route [3]EP [4]Location [5]Type [6]SubType [7]Version
function _parseFileName(name) {
  const extMatch = name.match(/\.([^.]+)$/);
  const ext = extMatch ? extMatch[1].toUpperCase() : '';
  const base = name.replace(/\.[^.]+$/, '');
  const parts = base.split('-');
  return {
    country:  (parts[1] || '').toUpperCase(),
    route:    (parts[2] || '').toUpperCase(),
    ep:       (parts[3] || '').toUpperCase(),
    location: (parts[4] || '').toUpperCase(),
    type:     (parts[5] || '').toUpperCase(),
    subType:  (parts[6] || '').toUpperCase(),
    version:  (parts[7] || '').toUpperCase(),
    ext:      ext,
  };
}

// ── 카테고리 분류 ─────────────────────────────────────────────
function _getCategory(parsed) {
  const ext  = parsed.ext.toLowerCase();
  const type = parsed.type;

  // 영상
  if (['mp4','mov','avi','mkv'].includes(ext)) return 'video';
  if (['drp','drt','prproj'].includes(ext)) return 'video'; // DaVinci/Premiere
  if (['VID','VIDEO','KLING','DAVINCI','ANIM'].includes(type)) return 'video';

  // 문서/SSOT
  if (['pdf','pptx','ppt','docx','doc','md','xlsx'].includes(ext)) return 'ssot';
  if (['SSOT','DOC','PPT','PDF','SLIDE','REPORT','DECK'].includes(type)) return 'ssot';

  // 이미지/에셋
  if (['png','jpg','jpeg','webp','gif','tiff'].includes(ext)) return 'asset';
  if (['IMG','IMAGE','POSTER','THUMB','THUMBNAIL','BANNER','VISUAL'].includes(type)) return 'asset';

  return null;
}
