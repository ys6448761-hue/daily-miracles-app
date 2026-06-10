/**
 * DreamTown Asset OS — Google Apps Script  v3
 * 시트: Customer_Master / Product_Master / Asset_Master / Video_Master / SSOT / Partner
 *
 * 핵심 원칙: 모든 에셋·영상은 Customer Code를 기준으로 관리된다.
 *
 * 파일명 규칙 (v3 신규):
 *   DT-{CustomerCode}-{Product}-{Location}-{Type}-{Version}.{ext}
 *   예) DT-FAM-26-000001-WISHART-HAMEL-IMG-V01.png
 *
 * 파일명 규칙 (v2 레거시, 하위 호환):
 *   DT-{Country}-{Route}-{EP}-{Location}-{Type}-{SubType}-{Version}.{ext}
 *
 * 설치:
 *   1. Google Sheet 열기 → 확장 프로그램 > Apps Script
 *   2. 이 파일 전체 붙여넣기 → 저장
 *   3. setupSheets() 실행 (최초 1회)
 *   4. setupProducts() 실행 (상품 마스터 기본값 입력)
 */

// ── 고객 유형 코드 ─────────────────────────────────────────────
const CUSTOMER_TYPES = { IND: '개인', FAM: '가족', GRP: '단체' };
const CUSTOMER_TYPE_KEYS = Object.keys(CUSTOMER_TYPES);

// ── 컬럼 헤더 정의 ─────────────────────────────────────────────
const HEADERS = {
  Customer_Master: ['Customer Code','Customer Name','Customer Type','Country','Partner Code','Travel Date','Product Code','Status','Created Date','Note'],
  Product_Master:  ['Product Code','Product Name','Category','Status'],
  Asset_Master:    ['Asset Code','Customer Code','Country','Route','EP','Location','Type','Version','Drive Link','Status','Created Date'],
  Video_Master:    ['Video Code','Customer Code','Source Asset','Tool','Duration','Drive Link','Final Link','Status'],
  SSOT:            ['SSOT Code','Category','Title','Version','Status','Link','Updated Date'],
  Partner:         ['Partner Code','Type','Company','Country','Contact','Status','Materials Sent','Next Action','Note'],
};

// ── 상품 마스터 기본값 ────────────────────────────────────────
const DEFAULT_PRODUCTS = [
  ['STARROUTE', '별빛항로',     'Route',   'Active'],
  ['STARSEED',  '별씨앗',      'Benefit',  'Active'],
  ['WISHART',   '소원그림',     'Digital',  'Active'],
  ['WISHSNAP',  '소원스냅',     'Digital',  'Active'],
  ['MIRACLE',   '기적영상',     'Digital',  'Active'],
  ['GMIRACLE',  '단체기적영상', 'Group',    'Active'],
  ['WISHPOST',  '소원엽서',     'Option',   'Active'],
];

// ── 헤더 색상 ──────────────────────────────────────────────────
const COLORS = {
  Customer_Master: '#8B0000',
  Product_Master:  '#2C4A2E',
  Asset_Master:    '#1B4B8A',
  Video_Master:    '#5B2C8A',
  SSOT:            '#1A5C3A',
  Partner:         '#7A4A00',
};

// ═══════════════════════════════════════════════════════════════
// 메뉴
// ═══════════════════════════════════════════════════════════════

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🌟 Asset OS v3')
    .addItem('전체 동기화 (Drive → Sheet)', 'syncAll')
    .addSeparator()
    .addItem('고객 등록 (자동 코드 생성)', 'addCustomer')
    .addItem('고객 검색 (Customer Code)', 'searchByCustomer')
    .addSeparator()
    .addItem('시트 전체 초기화 (헤더 설정)', 'setupSheets')
    .addItem('상품 마스터 초기화', 'setupProducts')
    .addItem('Drive 폴더 ID 설정', 'setFolderId')
    .addItem('현재 폴더 ID 확인', 'showFolderId')
    .addSeparator()
    .addItem('Asset_Master 데이터 초기화', 'clearAsset')
    .addItem('Video_Master 데이터 초기화', 'clearVideo')
    .addItem('SSOT 데이터 초기화', 'clearSSOT')
    .addToUi();
}

// ═══════════════════════════════════════════════════════════════
// 시트 초기화
// ═══════════════════════════════════════════════════════════════

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.entries(HEADERS).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    _setHeader(sheet, headers, COLORS[name]);
  });
  SpreadsheetApp.getUi().alert(
    '✅ 시트 초기화 완료\n' +
    'Customer_Master / Product_Master / Asset_Master /\nVideo_Master / SSOT / Partner\n\n' +
    '다음: 상품 마스터 초기화 → Asset OS v3 > 상품 마스터 초기화'
  );
}

function setupProducts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Product_Master');
  if (!sheet) sheet = ss.insertSheet('Product_Master');
  _setHeader(sheet, HEADERS.Product_Master, COLORS.Product_Master);
  sheet.getRange(2, 1, DEFAULT_PRODUCTS.length, 4).setValues(DEFAULT_PRODUCTS);
  SpreadsheetApp.getUi().alert('✅ Product_Master 초기화 완료\n' + DEFAULT_PRODUCTS.length + '개 상품 등록됨');
}

function _setHeader(sheet, headers, color) {
  if (sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);
  sheet.getRange(1, 1, 1, headers.length)
       .setValues([headers])
       .setBackground(color)
       .setFontColor('#FFFFFF')
       .setFontWeight('bold')
       .setFontSize(11);
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 280); // Code 컬럼
  ['Customer Code','Drive Link','Final Link','Link'].forEach(col => {
    const idx = headers.indexOf(col) + 1;
    if (idx > 0) sheet.setColumnWidth(idx, 220);
  });
  ['Note','Next Action','Contact','Customer Name'].forEach(col => {
    const idx = headers.indexOf(col) + 1;
    if (idx > 0) sheet.setColumnWidth(idx, 180);
  });
}

// ═══════════════════════════════════════════════════════════════
// 고객 등록 — 자동 코드 생성
// ═══════════════════════════════════════════════════════════════

function addCustomer() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 고객 유형
  const typeRes = ui.prompt(
    '고객 유형 선택',
    'IND (개인) / FAM (가족) / GRP (단체)',
    ui.ButtonSet.OK_CANCEL
  );
  if (typeRes.getSelectedButton() !== ui.Button.OK) return;
  const type = typeRes.getResponseText().trim().toUpperCase();
  if (!CUSTOMER_TYPE_KEYS.includes(type)) {
    ui.alert('❌ 유효하지 않은 유형: ' + type + '\nIND / FAM / GRP 중 입력하세요.');
    return;
  }

  // 고객명
  const nameRes = ui.prompt('고객명', '', ui.ButtonSet.OK_CANCEL);
  if (nameRes.getSelectedButton() !== ui.Button.OK) return;
  const name = nameRes.getResponseText().trim();
  if (!name) { ui.alert('❌ 고객명을 입력하세요.'); return; }

  // 국가
  const countryRes = ui.prompt('국가 코드', 'KR / CN / JP / 기타', ui.ButtonSet.OK_CANCEL);
  if (countryRes.getSelectedButton() !== ui.Button.OK) return;
  const country = countryRes.getResponseText().trim().toUpperCase();

  // 여행일
  const dateRes = ui.prompt('여행일', 'YYYY-MM-DD 형식', ui.ButtonSet.OK_CANCEL);
  if (dateRes.getSelectedButton() !== ui.Button.OK) return;
  const travelDate = dateRes.getResponseText().trim();

  // 상품코드
  const productRes = ui.prompt(
    '상품코드',
    'STARROUTE / WISHART / MIRACLE / GMIRACLE / STARSEED / WISHPOST',
    ui.ButtonSet.OK_CANCEL
  );
  if (productRes.getSelectedButton() !== ui.Button.OK) return;
  const productCode = productRes.getResponseText().trim().toUpperCase();

  // 파트너코드 (선택)
  const partnerRes = ui.prompt('파트너코드 (없으면 빈칸)', 'PT-CN-001 형식', ui.ButtonSet.OK_CANCEL);
  if (partnerRes.getSelectedButton() !== ui.Button.OK) return;
  const partnerCode = partnerRes.getResponseText().trim();

  // 고객코드 자동 생성
  const year = String(new Date().getFullYear()).slice(-2);
  const customerCode = _generateCustomerCode(type, year, ss);
  const today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');

  const sheet = ss.getSheetByName('Customer_Master');
  if (!sheet) { ui.alert('❌ Customer_Master 시트가 없습니다. setupSheets()를 먼저 실행하세요.'); return; }

  sheet.appendRow([customerCode, name, type, country, partnerCode, travelDate, productCode, 'Active', today, '']);

  ui.alert(
    '✅ 고객 등록 완료\n\n' +
    '고객코드: ' + customerCode + '\n' +
    '이름: ' + name + '\n' +
    '유형: ' + CUSTOMER_TYPES[type] + '\n' +
    '상품: ' + productCode + '\n\n' +
    '파일명 접두어: DT-' + customerCode.replace(/-/g, '-')
  );
}

// 고객코드 자동 생성: 유형별 독립 카운터, 연도별 관리, 6자리 일련번호
function _generateCustomerCode(type, year, ss) {
  const sheet = ss.getSheetByName('Customer_Master');
  if (!sheet || sheet.getLastRow() <= 1) return type + '-' + year + '-000001';

  const prefix = type + '-' + year + '-';
  const existingCodes = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1)
    .getValues()
    .map(r => String(r[0]))
    .filter(c => c.startsWith(prefix));

  if (existingCodes.length === 0) return prefix + '000001';

  const maxSeq = Math.max(...existingCodes.map(c => {
    const seq = c.split('-')[2];
    return parseInt(seq, 10) || 0;
  }));
  return prefix + String(maxSeq + 1).padStart(6, '0');
}

// ═══════════════════════════════════════════════════════════════
// 고객 검색 — Customer Code 기반 전체 연결 조회
// ═══════════════════════════════════════════════════════════════

function searchByCustomer() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt('고객코드 검색', '예) FAM-26-000001', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const code = res.getResponseText().trim();
  if (!code) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lines = ['🔍 검색: ' + code + '\n'];

  // Customer_Master
  const custSheet = ss.getSheetByName('Customer_Master');
  if (custSheet && custSheet.getLastRow() > 1) {
    const rows = custSheet.getDataRange().getValues().slice(1).filter(r => r[0] === code);
    if (rows.length > 0) {
      const r = rows[0];
      lines.push('👤 고객: ' + r[1] + ' (' + CUSTOMER_TYPES[r[2]] + ')');
      lines.push('   국가: ' + r[3] + ' | 파트너: ' + (r[4] || '-') + ' | 여행: ' + r[5] + ' | 상품: ' + r[6]);
    } else {
      lines.push('👤 고객: 미등록');
    }
  }

  // Asset_Master (Customer Code = col 2, index 1)
  const assetSheet = ss.getSheetByName('Asset_Master');
  if (assetSheet && assetSheet.getLastRow() > 1) {
    const rows = assetSheet.getDataRange().getValues().slice(1).filter(r => r[1] === code);
    lines.push('\n📷 에셋: ' + rows.length + '건');
    rows.forEach(r => lines.push('   ' + r[0] + ' [' + r[7] + '] ' + r[9])); // Code, Version, Status
  }

  // Video_Master (Customer Code = col 2, index 1)
  const videoSheet = ss.getSheetByName('Video_Master');
  if (videoSheet && videoSheet.getLastRow() > 1) {
    const rows = videoSheet.getDataRange().getValues().slice(1).filter(r => r[1] === code);
    lines.push('\n🎬 영상: ' + rows.length + '건');
    rows.forEach(r => lines.push('   ' + r[0] + ' [' + r[3] + '] ' + r[7])); // Code, Tool, Status
  }

  ui.alert(lines.join('\n'));
}

// ═══════════════════════════════════════════════════════════════
// 폴더 ID 설정
// ═══════════════════════════════════════════════════════════════

function setFolderId() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt(
    'DreamTown Drive 폴더 ID',
    'Drive 폴더 URL의 마지막 부분 (folders/ 뒤)\n예) https://drive.google.com/drive/folders/[여기]',
    ui.ButtonSet.OK_CANCEL
  );
  if (res.getSelectedButton() !== ui.Button.OK) return;
  PropertiesService.getScriptProperties().setProperty('DRIVE_FOLDER_ID', res.getResponseText().trim());
  ui.alert('✅ 폴더 ID 저장 완료');
}

function showFolderId() {
  const id = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID') || '(미설정)';
  SpreadsheetApp.getUi().alert('현재 폴더 ID: ' + id);
}

// ═══════════════════════════════════════════════════════════════
// 개별 시트 데이터 초기화
// ═══════════════════════════════════════════════════════════════

function clearAsset() { _clearSheet('Asset_Master'); }
function clearVideo()  { _clearSheet('Video_Master'); }
function clearSSOT()   { _clearSheet('SSOT'); }

function _clearSheet(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet || sheet.getLastRow() <= 1) return;
  sheet.deleteRows(2, sheet.getLastRow() - 1);
  SpreadsheetApp.getUi().alert(name + ' 데이터가 초기화되었습니다.');
}

// ═══════════════════════════════════════════════════════════════
// 전체 동기화 (Drive → Sheet)
// ═══════════════════════════════════════════════════════════════

function syncAll() {
  const folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');
  if (!folderId) {
    SpreadsheetApp.getUi().alert('❌ Drive 폴더 ID 미설정\nAsset OS v3 > Drive 폴더 ID 설정');
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = {
    asset: ss.getSheetByName('Asset_Master'),
    video: ss.getSheetByName('Video_Master'),
    ssot:  ss.getSheetByName('SSOT'),
  };

  const existing = {
    asset: _getExistingCodes(sheets.asset),
    video: _getExistingCodes(sheets.video),
    ssot:  _getExistingCodes(sheets.ssot),
  };

  const rows = { asset: [], video: [], ssot: [] };
  _scanFolder(DriveApp.getFolderById(folderId), rows, existing);

  if (rows.asset.length > 0)
    sheets.asset.getRange(sheets.asset.getLastRow()+1, 1, rows.asset.length, HEADERS.Asset_Master.length).setValues(rows.asset);
  if (rows.video.length > 0)
    sheets.video.getRange(sheets.video.getLastRow()+1, 1, rows.video.length, HEADERS.Video_Master.length).setValues(rows.video);
  if (rows.ssot.length > 0)
    sheets.ssot.getRange(sheets.ssot.getLastRow()+1,  1, rows.ssot.length,  HEADERS.SSOT.length).setValues(rows.ssot);

  SpreadsheetApp.getUi().alert(
    '✅ 동기화 완료\n' +
    '📷 Asset_Master: +' + rows.asset.length + '건\n' +
    '🎬 Video_Master: +' + rows.video.length + '건\n' +
    '📄 SSOT: +' + rows.ssot.length + '건'
  );
}

function _getExistingCodes(sheet) {
  if (!sheet || sheet.getLastRow() <= 1) return new Set();
  return new Set(sheet.getRange(2, 1, sheet.getLastRow()-1, 1).getValues().map(r => r[0]));
}

// ── Drive 재귀 스캔 ───────────────────────────────────────────

function _scanFolder(folder, rows, existing) {
  const files = folder.getFiles();
  while (files.hasNext()) _processFile(files.next(), rows, existing);
  const subs = folder.getFolders();
  while (subs.hasNext()) _scanFolder(subs.next(), rows, existing);
}

function _processFile(file, rows, existing) {
  const name = file.getName();
  if (!name.startsWith('DT-')) return;

  const parsed  = _parseFileName(name);
  const category = _getCategory(parsed);
  if (!category) return;

  const code    = name.replace(/\.[^.]+$/, '');
  const url     = file.getUrl();
  const created = Utilities.formatDate(file.getDateCreated(), 'Asia/Seoul', 'yyyy-MM-dd');

  // ── Asset_Master (11 cols) ────────────────────────────────
  // Asset Code | Customer Code | Country | Route | EP | Location | Type | Version | Drive Link | Status | Created Date
  if (category === 'asset' && !existing.asset.has(code)) {
    rows.asset.push([
      code,
      parsed.customerCode,
      parsed.country,
      parsed.route,
      parsed.ep,
      parsed.location,
      parsed.type,
      parsed.version,
      url,
      'Active',
      created,
    ]);
  }

  // ── Video_Master (8 cols) ─────────────────────────────────
  // Video Code | Customer Code | Source Asset | Tool | Duration | Drive Link | Final Link | Status
  else if (category === 'video' && !existing.video.has(code)) {
    rows.video.push([
      code,
      parsed.customerCode,
      '',
      parsed.tool || _inferTool(parsed.ext),
      '',
      url,
      '',
      'Draft',
    ]);
  }

  // ── SSOT (7 cols) ─────────────────────────────────────────
  // SSOT Code | Category | Title | Version | Status | Link | Updated Date
  else if (category === 'ssot' && !existing.ssot.has(code)) {
    rows.ssot.push([
      code,
      parsed.type || 'DOC',
      parsed.isCustomerFile ? (parsed.customerCode + ' · ' + parsed.type) : _makeTitle(parsed),
      parsed.version,
      'Active',
      url,
      created,
    ]);
  }
}

// ═══════════════════════════════════════════════════════════════
// 파일명 파싱
// ═══════════════════════════════════════════════════════════════

/**
 * v3 신규 형식: DT-FAM-26-000001-PRODUCT-LOCATION-TYPE-V01.ext
 *   parts: [DT, FAM, 26, 000001, PRODUCT, LOCATION, TYPE, V01]
 *   customerCode = parts[1]-parts[2]-parts[3]
 *
 * v2 레거시 형식: DT-KR-SR-EP01-HAMEL-IMG-MASTER-V01.ext
 *   parts: [DT, KR, SR, EP01, HAMEL, IMG, MASTER, V01]
 *   구분: parts[1]이 IND/FAM/GRP 이면 v3
 */
function _parseFileName(name) {
  const extMatch = name.match(/\.([^.]+)$/);
  const ext = extMatch ? extMatch[1].toUpperCase() : '';
  const parts = name.replace(/\.[^.]+$/, '').split('-');

  if (CUSTOMER_TYPE_KEYS.includes(parts[1])) {
    // v3 고객 기반 파일명
    const customerCode = parts[1] + '-' + parts[2] + '-' + parts[3];
    return {
      isCustomerFile: true,
      customerCode:   customerCode,
      country:  '',
      route:    '',
      ep:       '',
      location: (parts[5] || '').toUpperCase(),
      type:     (parts[6] || '').toUpperCase(),
      tool:     (parts[6] || '').toUpperCase(), // video tool hint
      version:  (parts[7] || '').toUpperCase(),
      ext:      ext,
    };
  } else {
    // v2 레거시 파일명
    return {
      isCustomerFile: false,
      customerCode:   '',
      country:  (parts[1] || '').toUpperCase(),
      route:    (parts[2] || '').toUpperCase(),
      ep:       (parts[3] || '').toUpperCase(),
      location: (parts[4] || '').toUpperCase(),
      type:     (parts[5] || '').toUpperCase(),
      tool:     (parts[6] || '').toUpperCase(), // subType → tool for video
      version:  (parts[7] || '').toUpperCase(),
      ext:      ext,
    };
  }
}

// ── 카테고리 분류 ─────────────────────────────────────────────

function _getCategory(parsed) {
  const ext  = parsed.ext.toLowerCase();
  const type = parsed.type;

  if (['mp4','mov','avi','mkv'].includes(ext))      return 'video';
  if (['drp','drt','prproj'].includes(ext))          return 'video';
  if (['VID','VIDEO','KLING','DAVINCI','MIRACLE','GMIRACLE','ANIM'].includes(type)) return 'video';

  if (['pdf','pptx','ppt','docx','doc','md','xlsx'].includes(ext)) return 'ssot';
  if (['SSOT','DOC','PPT','SLIDE','REPORT','DECK'].includes(type)) return 'ssot';

  if (['png','jpg','jpeg','webp','gif','tiff'].includes(ext)) return 'asset';
  if (['IMG','IMAGE','POSTER','THUMB','THUMBNAIL','WISHART','WISHSNAP','BANNER'].includes(type)) return 'asset';

  return null;
}

function _inferTool(ext) {
  const e = ext.toLowerCase();
  if (e === 'drp' || e === 'drt') return 'DaVinci';
  if (e === 'prproj')             return 'Premiere';
  if (['mp4','mov'].includes(e))  return 'Kling';
  return '';
}

function _makeTitle(parsed) {
  return [parsed.ep, parsed.location, parsed.type].filter(p => p).join(' · ') || 'Untitled';
}
