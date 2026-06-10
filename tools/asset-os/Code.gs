/**
 * DreamTown Asset OS — Google Apps Script  v4
 * 시트: Customer_Master / Product_Master / Location_Master /
 *       Asset_Master / Video_Master / SSOT / Partner
 *
 * 핵심 원칙: 사람이 코드를 직접 입력하지 않는다.
 *            Asset OS가 생성한 코드를 파일명으로 사용한다.
 *
 * Asset Code 규칙:
 *   DT-{CustomerCode}-{ProductCode}-{LocationCode}-{AssetType}-{Version}
 *   예) DT-FAM-26-000001-WISHART-HAMEL-IMG-V01
 *
 * 파일명 규칙 (v3 신규, 하위호환):
 *   v4: DT-{CustomerCode}-{Product}-{Location}-{Type}-{Version}.{ext}
 *   v3: DT-{Country}-{Route}-{EP}-{Location}-{Type}-{SubType}-{Version}.{ext}
 */

// ── 고객 유형 ─────────────────────────────────────────────────
const CUSTOMER_TYPES    = { IND: '개인', FAM: '가족', GRP: '단체' };
const CUSTOMER_TYPE_KEYS = Object.keys(CUSTOMER_TYPES);

// ── Asset Type 기본값 ────────────────────────────────────────
const ASSET_TYPES = ['IMG', 'KLING', 'DAVINCI', 'FINAL', 'PPT', 'SSOT'];

// ── Location_Master 기본값 ────────────────────────────────────
const DEFAULT_LOCATIONS = [
  ['HAMEL',   '하멜등대',       'Active'],
  ['JONGPO',  '종포해양공원',   'Active'],
  ['ODONGDO', '오동도',         'Active'],
  ['CABLE',   '해상케이블카',   'Active'],
  ['EXPO',    '여수엑스포역',   'Active'],
  ['HOTEL',   '유탑마리나호텔', 'Active'],
];

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

// ── 컬럼 헤더 ─────────────────────────────────────────────────
const HEADERS = {
  Customer_Master:  ['Customer Code','Customer Name','Customer Type','Country','Partner Code','Travel Date','Product Code','Status','Created Date','Note'],
  Product_Master:   ['Product Code','Product Name','Category','Status'],
  Location_Master:  ['Location Code','Location Name','Status'],
  Asset_Master:     ['Asset Code','Customer Code','Country','Route','EP','Location','Type','Version','Drive Link','Status','Created Date'],
  Video_Master:     ['Video Code','Customer Code','Source Asset','Tool','Duration','Drive Link','Final Link','Status'],
  SSOT:             ['SSOT Code','Category','Title','Version','Status','Link','Updated Date'],
  Partner:          ['Partner Code','Type','Company','Country','Contact','Status','Materials Sent','Next Action','Note'],
};

// ── 헤더 색상 ─────────────────────────────────────────────────
const COLORS = {
  Customer_Master:  '#8B0000',
  Product_Master:   '#2C4A2E',
  Location_Master:  '#1A3A5C',
  Asset_Master:     '#1B4B8A',
  Video_Master:     '#5B2C8A',
  SSOT:             '#1A5C3A',
  Partner:          '#7A4A00',
};

// ═══════════════════════════════════════════════════════════════
// 메뉴
// ═══════════════════════════════════════════════════════════════

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🌟 Asset OS v4')
    // ── 핵심 기능
    .addItem('📋 Asset Code 생성 (자동)', 'generateAssetCode')
    .addItem('👤 고객 등록 (자동 코드)', 'addCustomer')
    .addItem('🔍 고객 검색 (Customer Code)', 'searchByCustomer')
    .addSeparator()
    // ── 동기화
    .addItem('🔄 전체 동기화 (Drive → Sheet)', 'syncAll')
    .addSeparator()
    // ── 초기화
    .addItem('시트 전체 초기화 (헤더)', 'setupSheets')
    .addItem('상품 마스터 초기화', 'setupProducts')
    .addItem('장소 마스터 초기화', 'setupLocations')
    .addItem('Drive 폴더 ID 설정', 'setFolderId')
    .addItem('현재 폴더 ID 확인', 'showFolderId')
    .addSeparator()
    // ── 데이터 초기화
    .addItem('Asset_Master 데이터 초기화', 'clearAsset')
    .addItem('Video_Master 데이터 초기화', 'clearVideo')
    .addItem('SSOT 데이터 초기화', 'clearSSOT')
    .addToUi();
}

// ═══════════════════════════════════════════════════════════════
// Asset Code 자동 생성 (v4 핵심 기능)
// ═══════════════════════════════════════════════════════════════

function generateAssetCode() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── Step 1. Customer Code 선택 ───────────────────────────────
  const customers = _getActiveValues('Customer_Master', 1, 2); // Code + Name
  const custPrompt = customers.length > 0
    ? '등록된 고객:\n' + customers.map(r => r[0] + '  ' + (r[1] || '')).join('\n')
    : '(등록된 고객 없음 — 먼저 고객 등록)';
  const custRes = ui.prompt(
    'Step 1 / 5 — Customer Code',
    custPrompt + '\n\n코드 입력 (예: FAM-26-000001):',
    ui.ButtonSet.OK_CANCEL
  );
  if (custRes.getSelectedButton() !== ui.Button.OK) return;
  const customerCode = custRes.getResponseText().trim().toUpperCase();
  if (!customerCode) { ui.alert('❌ Customer Code를 입력하세요.'); return; }

  // ── Step 2. Product Code 선택 ────────────────────────────────
  const products = _getActiveValues('Product_Master', 1, 2);
  const prodPrompt = products.length > 0
    ? '상품 목록:\n' + products.map(r => r[0] + '  ' + (r[1] || '')).join('\n')
    : '(등록된 상품 없음 — 상품 마스터 초기화 먼저)';
  const prodRes = ui.prompt(
    'Step 2 / 5 — Product Code',
    prodPrompt + '\n\n상품코드 입력 (예: WISHART):',
    ui.ButtonSet.OK_CANCEL
  );
  if (prodRes.getSelectedButton() !== ui.Button.OK) return;
  const productCode = prodRes.getResponseText().trim().toUpperCase();
  if (!productCode) { ui.alert('❌ Product Code를 입력하세요.'); return; }

  // ── Step 3. Location Code 선택 ──────────────────────────────
  const locations = _getActiveValues('Location_Master', 1, 2);
  const locPrompt = locations.length > 0
    ? '장소 목록:\n' + locations.map(r => r[0] + '  ' + (r[1] || '')).join('\n')
    : '(등록된 장소 없음 — 장소 마스터 초기화 먼저)';
  const locRes = ui.prompt(
    'Step 3 / 5 — Location Code',
    locPrompt + '\n\n장소코드 입력 (예: HAMEL):',
    ui.ButtonSet.OK_CANCEL
  );
  if (locRes.getSelectedButton() !== ui.Button.OK) return;
  const locationCode = locRes.getResponseText().trim().toUpperCase();
  if (!locationCode) { ui.alert('❌ Location Code를 입력하세요.'); return; }

  // ── Step 4. Asset Type 선택 ──────────────────────────────────
  const typeRes = ui.prompt(
    'Step 4 / 5 — Asset Type',
    '에셋 타입:\n' + ASSET_TYPES.join('\n') + '\n\n타입 입력 (예: IMG):',
    ui.ButtonSet.OK_CANCEL
  );
  if (typeRes.getSelectedButton() !== ui.Button.OK) return;
  const assetType = typeRes.getResponseText().trim().toUpperCase();
  if (!assetType) { ui.alert('❌ Asset Type을 입력하세요.'); return; }

  // ── Step 5. Version 선택 ────────────────────────────────────
  const verRes = ui.prompt(
    'Step 5 / 5 — Version',
    '버전 예시: V01  V02  V03\n(최초 생성 시 V01 권장)\n\n버전 입력:',
    ui.ButtonSet.OK_CANCEL
  );
  if (verRes.getSelectedButton() !== ui.Button.OK) return;
  const version = verRes.getResponseText().trim().toUpperCase() || 'V01';

  // ── 조합 ────────────────────────────────────────────────────
  const assetCode = [
    'DT',
    customerCode,
    productCode,
    locationCode,
    assetType,
    version,
  ].join('-');

  // ── 복사 다이얼로그 표시 ─────────────────────────────────────
  _showCopyDialog(assetCode);
}

// HTML 모달 — 클릭으로 복사
function _showCopyDialog(code) {
  const html = HtmlService.createHtmlOutput(
    '<style>' +
    '  body { font-family: "Google Sans", Arial, sans-serif; padding: 20px; margin: 0; }' +
    '  .label { font-size: 12px; color: #666; margin-bottom: 6px; }' +
    '  .code-box { width: 100%; box-sizing: border-box; padding: 12px; ' +
    '    font-family: monospace; font-size: 14px; font-weight: bold; ' +
    '    border: 2px solid #1B4B8A; border-radius: 6px; background: #f0f4ff; ' +
    '    color: #1B4B8A; letter-spacing: 0.5px; }' +
    '  .btn { display: block; width: 100%; margin-top: 12px; padding: 12px; ' +
    '    font-size: 14px; font-weight: bold; color: white; background: #1B4B8A; ' +
    '    border: none; border-radius: 6px; cursor: pointer; }' +
    '  .btn:hover { background: #2563b0; }' +
    '  .hint { font-size: 11px; color: #888; margin-top: 8px; text-align: center; }' +
    '</style>' +
    '<div class="label">생성된 Asset Code — 이 코드를 파일명으로 사용하세요</div>' +
    '<textarea id="code" class="code-box" rows="2" readonly>' + code + '</textarea>' +
    '<button class="btn" onclick="copyCode()">📋 복사하기</button>' +
    '<div class="hint" id="hint">버튼을 클릭하거나 텍스트를 직접 선택하세요.</div>' +
    '<script>' +
    '  document.getElementById("code").select();' +
    '  function copyCode() {' +
    '    var el = document.getElementById("code");' +
    '    el.select();' +
    '    el.setSelectionRange(0, 99999);' +
    '    try { document.execCommand("copy"); document.getElementById("hint").innerText = "✅ 클립보드에 복사되었습니다!"; }' +
    '    catch(e) { document.getElementById("hint").innerText = "텍스트를 직접 선택 후 Ctrl+C 로 복사하세요."; }' +
    '  }' +
    '</script>'
  ).setWidth(520).setHeight(200);

  SpreadsheetApp.getUi().showModalDialog(html, '✅ Asset Code 생성 완료');
}

// 시트에서 활성 값 조회 (중복 제거)
function _getActiveValues(sheetName, codeCol, nameCol) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const colCount = nameCol || codeCol;
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, colCount).getValues();

  // Status 컬럼이 있으면 Active 필터
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusIdx = headers.indexOf('Status');

  return data.filter(row => {
    if (statusIdx >= 0) return String(row[statusIdx] || '').toLowerCase() !== 'inactive';
    return true;
  }).map(row => row.slice(0, colCount));
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
    '✅ 시트 초기화 완료\n\n' +
    '다음 단계:\n' +
    '1. 상품 마스터 초기화\n' +
    '2. 장소 마스터 초기화\n' +
    '3. 고객 등록\n' +
    '4. Asset Code 생성'
  );
}

function setupProducts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Product_Master');
  if (!sheet) sheet = ss.insertSheet('Product_Master');
  _setHeader(sheet, HEADERS.Product_Master, COLORS.Product_Master);
  sheet.getRange(2, 1, DEFAULT_PRODUCTS.length, 4).setValues(DEFAULT_PRODUCTS);
  SpreadsheetApp.getUi().alert('✅ Product_Master 초기화 완료 (' + DEFAULT_PRODUCTS.length + '개 상품)');
}

function setupLocations() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Location_Master');
  if (!sheet) sheet = ss.insertSheet('Location_Master');
  _setHeader(sheet, HEADERS.Location_Master, COLORS.Location_Master);
  sheet.getRange(2, 1, DEFAULT_LOCATIONS.length, 3).setValues(DEFAULT_LOCATIONS);
  SpreadsheetApp.getUi().alert('✅ Location_Master 초기화 완료 (' + DEFAULT_LOCATIONS.length + '개 장소)');
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
  sheet.setColumnWidth(1, 280);
  ['Customer Code','Drive Link','Final Link','Link'].forEach(col => {
    const idx = headers.indexOf(col) + 1;
    if (idx > 0) sheet.setColumnWidth(idx, 220);
  });
  ['Note','Next Action','Contact','Customer Name','Location Name'].forEach(col => {
    const idx = headers.indexOf(col) + 1;
    if (idx > 0) sheet.setColumnWidth(idx, 180);
  });
}

// ── 개별 데이터 초기화 ─────────────────────────────────────────
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
// 고객 등록
// ═══════════════════════════════════════════════════════════════

function addCustomer() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const typeRes = ui.prompt(
    '고객 유형 선택',
    'IND (개인) / FAM (가족) / GRP (단체)',
    ui.ButtonSet.OK_CANCEL
  );
  if (typeRes.getSelectedButton() !== ui.Button.OK) return;
  const type = typeRes.getResponseText().trim().toUpperCase();
  if (!CUSTOMER_TYPE_KEYS.includes(type)) { ui.alert('❌ 유효하지 않은 유형: ' + type); return; }

  const nameRes = ui.prompt('고객명', '', ui.ButtonSet.OK_CANCEL);
  if (nameRes.getSelectedButton() !== ui.Button.OK) return;
  const name = nameRes.getResponseText().trim();
  if (!name) { ui.alert('❌ 고객명을 입력하세요.'); return; }

  const countryRes = ui.prompt('국가 코드', 'KR / CN / JP / 기타', ui.ButtonSet.OK_CANCEL);
  if (countryRes.getSelectedButton() !== ui.Button.OK) return;
  const country = countryRes.getResponseText().trim().toUpperCase();

  const dateRes = ui.prompt('여행일', 'YYYY-MM-DD 형식', ui.ButtonSet.OK_CANCEL);
  if (dateRes.getSelectedButton() !== ui.Button.OK) return;
  const travelDate = dateRes.getResponseText().trim();

  const products = _getActiveValues('Product_Master', 1, 2);
  const prodHint = products.map(r => r[0]).join(' / ');
  const productRes = ui.prompt(
    '상품코드',
    (prodHint || 'STARROUTE / WISHART / MIRACLE / GMIRACLE') + '\n\n상품코드 입력:',
    ui.ButtonSet.OK_CANCEL
  );
  if (productRes.getSelectedButton() !== ui.Button.OK) return;
  const productCode = productRes.getResponseText().trim().toUpperCase();

  const partnerRes = ui.prompt('파트너코드 (없으면 빈칸)', 'PT-CN-001 형식', ui.ButtonSet.OK_CANCEL);
  if (partnerRes.getSelectedButton() !== ui.Button.OK) return;
  const partnerCode = partnerRes.getResponseText().trim();

  const year = String(new Date().getFullYear()).slice(-2);
  const customerCode = _generateCustomerCode(type, year, ss);
  const today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');

  const sheet = ss.getSheetByName('Customer_Master');
  if (!sheet) { ui.alert('❌ Customer_Master 없음 — setupSheets() 먼저 실행'); return; }
  sheet.appendRow([customerCode, name, type, country, partnerCode, travelDate, productCode, 'Active', today, '']);

  ui.alert(
    '✅ 고객 등록 완료\n\n' +
    '고객코드: ' + customerCode + '\n' +
    '이름: ' + name + '\n' +
    '유형: ' + CUSTOMER_TYPES[type] + '\n' +
    '상품: ' + productCode + '\n\n' +
    '다음: Asset Code 생성 → 이 코드를 파일명 접두어로 사용'
  );
}

function _generateCustomerCode(type, year, ss) {
  const sheet = ss.getSheetByName('Customer_Master');
  if (!sheet || sheet.getLastRow() <= 1) return type + '-' + year + '-000001';
  const prefix = type + '-' + year + '-';
  const existing = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1)
    .getValues().map(r => String(r[0])).filter(c => c.startsWith(prefix));
  if (!existing.length) return prefix + '000001';
  const maxSeq = Math.max(...existing.map(c => parseInt(c.split('-')[2], 10) || 0));
  return prefix + String(maxSeq + 1).padStart(6, '0');
}

// ═══════════════════════════════════════════════════════════════
// 고객 검색
// ═══════════════════════════════════════════════════════════════

function searchByCustomer() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt('고객코드 검색', '예) FAM-26-000001', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const code = res.getResponseText().trim();
  if (!code) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lines = ['🔍 검색: ' + code + '\n'];

  const custSheet = ss.getSheetByName('Customer_Master');
  if (custSheet && custSheet.getLastRow() > 1) {
    const rows = custSheet.getDataRange().getValues().slice(1).filter(r => r[0] === code);
    if (rows.length > 0) {
      const r = rows[0];
      lines.push('👤 고객: ' + r[1] + ' (' + (CUSTOMER_TYPES[r[2]] || r[2]) + ')');
      lines.push('   국가: ' + r[3] + ' | 파트너: ' + (r[4] || '-') + ' | 여행: ' + r[5] + ' | 상품: ' + r[6]);
    } else {
      lines.push('👤 고객: 미등록');
    }
  }

  const assetSheet = ss.getSheetByName('Asset_Master');
  if (assetSheet && assetSheet.getLastRow() > 1) {
    const rows = assetSheet.getDataRange().getValues().slice(1).filter(r => r[1] === code);
    lines.push('\n📷 에셋: ' + rows.length + '건');
    rows.forEach(r => lines.push('   ' + r[0] + ' [' + r[7] + '] ' + r[9]));
  }

  const videoSheet = ss.getSheetByName('Video_Master');
  if (videoSheet && videoSheet.getLastRow() > 1) {
    const rows = videoSheet.getDataRange().getValues().slice(1).filter(r => r[1] === code);
    lines.push('\n🎬 영상: ' + rows.length + '건');
    rows.forEach(r => lines.push('   ' + r[0] + ' [' + r[3] + '] ' + r[7]));
  }

  ui.alert(lines.join('\n'));
}

// ═══════════════════════════════════════════════════════════════
// 폴더 ID 설정
// ═══════════════════════════════════════════════════════════════

function setFolderId() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt(
    'Drive 폴더 ID',
    'Drive URL의 folders/ 뒤 ID를 입력:\nhttps://drive.google.com/drive/folders/[여기]',
    ui.ButtonSet.OK_CANCEL
  );
  if (res.getSelectedButton() !== ui.Button.OK) return;
  PropertiesService.getScriptProperties().setProperty('DRIVE_FOLDER_ID', res.getResponseText().trim());
  SpreadsheetApp.getUi().alert('✅ 폴더 ID 저장 완료');
}

function showFolderId() {
  const id = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID') || '(미설정)';
  SpreadsheetApp.getUi().alert('현재 폴더 ID: ' + id);
}

// ═══════════════════════════════════════════════════════════════
// Drive 동기화
// ═══════════════════════════════════════════════════════════════

function syncAll() {
  const folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');
  if (!folderId) {
    SpreadsheetApp.getUi().alert('❌ Drive 폴더 ID 미설정\nAsset OS v4 > Drive 폴더 ID 설정');
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
    sheets.ssot.getRange(sheets.ssot.getLastRow()+1, 1, rows.ssot.length, HEADERS.SSOT.length).setValues(rows.ssot);

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

function _scanFolder(folder, rows, existing) {
  const files = folder.getFiles();
  while (files.hasNext()) _processFile(files.next(), rows, existing);
  const subs = folder.getFolders();
  while (subs.hasNext()) _scanFolder(subs.next(), rows, existing);
}

function _processFile(file, rows, existing) {
  const name = file.getName();
  if (!name.startsWith('DT-')) return;
  const parsed   = _parseFileName(name);
  const category = _getCategory(parsed);
  if (!category) return;

  const code    = name.replace(/\.[^.]+$/, '');
  const url     = file.getUrl();
  const created = Utilities.formatDate(file.getDateCreated(), 'Asia/Seoul', 'yyyy-MM-dd');

  if (category === 'asset' && !existing.asset.has(code)) {
    rows.asset.push([code, parsed.customerCode, parsed.country, parsed.route, parsed.ep,
      parsed.location, parsed.type, parsed.version, url, 'Active', created]);
  } else if (category === 'video' && !existing.video.has(code)) {
    rows.video.push([code, parsed.customerCode, '', parsed.tool || _inferTool(parsed.ext),
      '', url, '', 'Draft']);
  } else if (category === 'ssot' && !existing.ssot.has(code)) {
    const title = parsed.isCustomerFile
      ? (parsed.customerCode + ' · ' + parsed.type)
      : _makeTitle(parsed);
    rows.ssot.push([code, parsed.type || 'DOC', title, parsed.version, 'Active', url, created]);
  }
}

// ═══════════════════════════════════════════════════════════════
// 파일명 파싱 (v4 + v3 레거시 이원 처리)
// ═══════════════════════════════════════════════════════════════

function _parseFileName(name) {
  const extMatch = name.match(/\.([^.]+)$/);
  const ext   = extMatch ? extMatch[1].toUpperCase() : '';
  const parts = name.replace(/\.[^.]+$/, '').split('-');

  if (CUSTOMER_TYPE_KEYS.includes(parts[1])) {
    // v4: DT-FAM-26-000001-PRODUCT-LOCATION-TYPE-VERSION
    return {
      isCustomerFile: true,
      customerCode: parts[1] + '-' + parts[2] + '-' + parts[3],
      country: '', route: '', ep: '',
      location: (parts[5] || '').toUpperCase(),
      type:     (parts[6] || '').toUpperCase(),
      tool:     (parts[6] || '').toUpperCase(),
      version:  (parts[7] || '').toUpperCase(),
      ext,
    };
  }
  // v3 레거시: DT-KR-SR-EP01-HAMEL-IMG-MASTER-V01
  return {
    isCustomerFile: false,
    customerCode: '',
    country:  (parts[1] || '').toUpperCase(),
    route:    (parts[2] || '').toUpperCase(),
    ep:       (parts[3] || '').toUpperCase(),
    location: (parts[4] || '').toUpperCase(),
    type:     (parts[5] || '').toUpperCase(),
    tool:     (parts[6] || '').toUpperCase(),
    version:  (parts[7] || '').toUpperCase(),
    ext,
  };
}

function _getCategory(parsed) {
  const ext  = parsed.ext.toLowerCase();
  const type = parsed.type;
  if (['mp4','mov','avi','mkv'].includes(ext))        return 'video';
  if (['drp','drt','prproj'].includes(ext))            return 'video';
  if (['VID','VIDEO','KLING','DAVINCI','MIRACLE','GMIRACLE','ANIM','FINAL'].includes(type)) return 'video';
  if (['pdf','pptx','ppt','docx','doc','md','xlsx'].includes(ext)) return 'ssot';
  if (['SSOT','DOC','PPT','SLIDE','REPORT','DECK'].includes(type)) return 'ssot';
  if (['png','jpg','jpeg','webp','gif','tiff'].includes(ext))      return 'asset';
  if (['IMG','IMAGE','POSTER','THUMB','WISHART','WISHSNAP','BANNER'].includes(type)) return 'asset';
  return null;
}

function _inferTool(ext) {
  const e = ext.toLowerCase();
  if (['drp','drt'].includes(e)) return 'DaVinci';
  if (e === 'prproj')            return 'Premiere';
  if (['mp4','mov'].includes(e)) return 'Kling';
  return '';
}

function _makeTitle(parsed) {
  return [parsed.ep, parsed.location, parsed.type].filter(p => p).join(' · ') || 'Untitled';
}
