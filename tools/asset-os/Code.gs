/**
 * DreamTown Asset OS — Google Apps Script  v4.1
 *
 * 핵심 원칙:
 *   고객코드는 사람이 만들지 않는다.
 *   Asset Code도 사람이 만들지 않는다.
 *   Asset OS가 자동 생성한다.
 *   사람은 생성된 코드를 복사해서 파일명으로 저장한다.
 *
 * Asset Code 규칙:
 *   DT-{CustomerCode}-{ProductCode}-{LocationCode}-{AssetType}-{Version}
 *   예) DT-FAM-26-000001-WISHART-HAMEL-IMG-V01
 *
 * 로컬 저장 루트: C:\DEV\dreamtown-assets
 */

// ═══════════════════════════════════════════════════════════════
// 상수
// ═══════════════════════════════════════════════════════════════

const CUSTOMER_TYPES     = { IND: '개인', FAM: '가족', GRP: '단체' };
const CUSTOMER_TYPE_KEYS = Object.keys(CUSTOMER_TYPES);

const ASSET_TYPES = ['IMG', 'KLING', 'DAVINCI', 'FINAL', 'PPT', 'SSOT'];

const ASSET_STATUS_VALUES = ['생성중', '검수중', '완료', '폐기'];
const USED_FOR_VALUES     = ['소원그림', '기적영상', '단체기적영상', '숏츠', 'PPT', '제안서', '보관'];

// 로컬 폴더 맵핑
const LOCAL_ROOT = 'C:\\DEV\\dreamtown-assets';
const LOCAL_FOLDER_MAP = {
  IMG:       '02_IMAGE',
  WISHART:   '02_IMAGE\\WISHART',
  WISHSNAP:  '02_IMAGE\\WISHART',
  STARROUTE: '02_IMAGE\\STARROUTE',
  POSTER:    '02_IMAGE\\POSTER',
  KLING:     '03_KLING',
  DAVINCI:   '04_DAVINCI',
  FINAL:     '05_FINAL',
  MIRACLE:   '05_FINAL',
  GMIRACLE:  '05_FINAL',
  PPT:       '06_PPT',
  SSOT:      '07_SSOT',
};

// ── 기본 데이터 ──────────────────────────────────────────────
const DEFAULT_PRODUCTS = [
  ['STARROUTE', '별빛항로',     'Route',   'Active', ''],
  ['STARSEED',  '별씨앗',      'Goods',    'Active', ''],
  ['WISHART',   '소원그림',     'Digital',  'Active', ''],
  ['WISHSNAP',  '소원스냅',     'Digital',  'Active', ''],
  ['MIRACLE',   '기적영상',     'Digital',  'Active', ''],
  ['GMIRACLE',  '단체기적영상', 'Group',    'Active', ''],
  ['WISHPOST',  '소원엽서',     'Option',   'Active', ''],
];

const DEFAULT_LOCATIONS = [
  ['HAMEL',    '하멜등대',         '소원',  'Active', ''],
  ['JONGPO',   '종포해양공원',     '쉼',    'Active', ''],
  ['ODONGDO',  '오동도',           '회복',  'Active', ''],
  ['CABLE',    '여수해상케이블카', '상승',  'Active', ''],
  ['CRUISE',   '유람선크루즈',     '기억',  'Active', ''],
  ['EXPO',     '여수엑스포역',     '도착',  'Active', ''],
  ['EXPOWALK', '엑스포 바닷길',   '호흡',  'Active', ''],
  ['YISUNSIN', '이순신광장',       '연결',  'Active', ''],
  ['HOTEL',    '유탑마리나호텔',   '안식',  'Active', ''],
];

// ── 컬럼 헤더 ─────────────────────────────────────────────────
const HEADERS = {
  Customer_Master:  [
    'Customer Code','Customer Name','Customer Type','Country',
    'Partner Code','Travel Date','Product Code','Status','Created Date','Note'
  ],
  Product_Master:   ['Product Code','Product Name','Category','Status','Note'],
  Location_Master:  ['Location Code','Location Name','Route Role','Status','Note'],
  Asset_Master:     [
    'Asset Code','Customer Code','Product Code','Location Code',
    'Asset Type','Version','Status','File Name','Local Folder',
    'Drive Link','Used For','Created Date','Note'
  ],
  Video_Master:     [
    'Video Code','Customer Code','Source Asset Code','Product Code',
    'Tool','Duration','Status','Raw Link','Davinci Link','Final Link',
    'Created Date','Note'
  ],
  SSOT:             ['SSOT Code','Category','Title','Version','Status','Link','Updated Date'],
  Partner:          ['Partner Code','Type','Company','Country','Contact','Status','Materials Sent','Next Action','Note'],
};

// ── 헤더 색상 ─────────────────────────────────────────────────
const COLORS = {
  Customer_Master:  '#6B1A1A',
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
    .addItem('📋 Asset Code 생성 (자동)',        'generateAssetCode')
    .addItem('👤 고객 등록 (자동 코드)',          'addCustomer')
    .addItem('🔍 고객 검색',                     'searchByCustomer')
    .addSeparator()
    .addItem('🔄 전체 동기화 (Drive → Sheet)',    'syncAll')
    .addSeparator()
    .addItem('시트 전체 초기화 (헤더)',            'setupSheets')
    .addItem('상품 마스터 초기화',                'setupProducts')
    .addItem('장소 마스터 초기화',                'setupLocations')
    .addItem('Drive 폴더 ID 설정',               'setFolderId')
    .addItem('현재 폴더 ID 확인',                'showFolderId')
    .addSeparator()
    .addItem('Asset_Master 데이터 초기화',        'clearAsset')
    .addItem('Video_Master 데이터 초기화',        'clearVideo')
    .addItem('SSOT 데이터 초기화',               'clearSSOT')
    .addToUi();
}

// ═══════════════════════════════════════════════════════════════
// Asset Code 자동 생성 (핵심 기능)
// ═══════════════════════════════════════════════════════════════

function generateAssetCode() {
  const ui = SpreadsheetApp.getUi();

  // Step 1. Customer Code
  const customers = _getActiveValues('Customer_Master', 1, 2);
  const custList = customers.length > 0
    ? customers.map(r => '  ' + r[0] + '  ' + (r[1] || '')).join('\n')
    : '  (등록된 고객 없음 — 먼저 고객 등록)';
  const custRes = ui.prompt(
    'Step 1 / 5 — Customer Code',
    '등록된 고객:\n' + custList + '\n\n코드 입력 (예: FAM-26-000001):',
    ui.ButtonSet.OK_CANCEL
  );
  if (custRes.getSelectedButton() !== ui.Button.OK) return;
  const customerCode = custRes.getResponseText().trim().toUpperCase();
  if (!customerCode) { ui.alert('❌ Customer Code를 입력하세요.'); return; }

  // Step 2. Product Code
  const products = _getActiveValues('Product_Master', 1, 2);
  const prodList = products.map(r => '  ' + r[0] + '  ' + (r[1] || '')).join('\n')
    || '  (상품 마스터 초기화 필요)';
  const prodRes = ui.prompt(
    'Step 2 / 5 — Product Code',
    '상품 목록:\n' + prodList + '\n\n상품코드 입력 (예: WISHART):',
    ui.ButtonSet.OK_CANCEL
  );
  if (prodRes.getSelectedButton() !== ui.Button.OK) return;
  const productCode = prodRes.getResponseText().trim().toUpperCase();
  if (!productCode) { ui.alert('❌ Product Code를 입력하세요.'); return; }

  // Step 3. Location Code
  const locations = _getActiveValues('Location_Master', 1, 3);
  const locList = locations.map(r => '  ' + r[0] + '  ' + (r[1] || '') + '  (' + (r[2] || '') + ')').join('\n')
    || '  (장소 마스터 초기화 필요)';
  const locRes = ui.prompt(
    'Step 3 / 5 — Location Code',
    '장소 목록:\n' + locList + '\n\n장소코드 입력 (예: HAMEL):',
    ui.ButtonSet.OK_CANCEL
  );
  if (locRes.getSelectedButton() !== ui.Button.OK) return;
  const locationCode = locRes.getResponseText().trim().toUpperCase();
  if (!locationCode) { ui.alert('❌ Location Code를 입력하세요.'); return; }

  // Step 4. Asset Type
  const typeRes = ui.prompt(
    'Step 4 / 5 — Asset Type',
    '에셋 타입:\n' + ASSET_TYPES.map(t => '  ' + t).join('\n') + '\n\n타입 입력 (예: IMG):',
    ui.ButtonSet.OK_CANCEL
  );
  if (typeRes.getSelectedButton() !== ui.Button.OK) return;
  const assetType = typeRes.getResponseText().trim().toUpperCase();
  if (!assetType) { ui.alert('❌ Asset Type을 입력하세요.'); return; }

  // Step 5. Version
  const verRes = ui.prompt(
    'Step 5 / 5 — Version',
    '버전 (최초 생성: V01, 수정본: V02 ...)\n\n버전 입력:',
    ui.ButtonSet.OK_CANCEL
  );
  if (verRes.getSelectedButton() !== ui.Button.OK) return;
  const version = (verRes.getResponseText().trim().toUpperCase() || 'V01');

  // Asset Code 조합
  const assetCode = ['DT', customerCode, productCode, locationCode, assetType, version].join('-');

  // 로컬 폴더 경로 결정
  const localFolder = LOCAL_FOLDER_MAP[assetType]
    || LOCAL_FOLDER_MAP[productCode]
    || '99_ARCHIVE';
  const localPath = LOCAL_ROOT + '\\' + localFolder;

  // 확장자 힌트
  const extHint = ['KLING','DAVINCI','FINAL','MIRACLE','GMIRACLE'].includes(assetType)
    ? '.mp4' : ['PPT'].includes(assetType) ? '.pptx' : ['SSOT'].includes(assetType) ? '.md' : '.png';

  _showCopyDialog(assetCode, extHint, localPath);
}

// HTML 복사 다이얼로그
function _showCopyDialog(code, extHint, localPath) {
  const fileName = code + extHint;
  const html = HtmlService.createHtmlOutput(
    '<style>' +
    'body{font-family:"Google Sans",Arial,sans-serif;padding:18px;margin:0;font-size:13px;}' +
    '.lbl{font-size:11px;color:#666;margin:10px 0 4px;}' +
    '.code{width:100%;box-sizing:border-box;padding:10px;font-family:monospace;font-size:13px;' +
    'font-weight:bold;border:2px solid #1B4B8A;border-radius:6px;background:#f0f4ff;color:#1B4B8A;}' +
    '.path{width:100%;box-sizing:border-box;padding:8px;font-family:monospace;font-size:12px;' +
    'border:1px solid #ccc;border-radius:4px;background:#f9f9f9;color:#444;}' +
    '.btn{display:block;width:100%;margin-top:10px;padding:11px;font-size:13px;font-weight:bold;' +
    'color:white;background:#1B4B8A;border:none;border-radius:6px;cursor:pointer;}' +
    '.btn:hover{background:#2563b0;}' +
    '.ok{font-size:11px;color:#2e7d32;margin-top:6px;text-align:center;min-height:16px;}' +
    '</style>' +
    '<div class="lbl">Asset Code</div>' +
    '<textarea id="code" class="code" rows="1" readonly>' + code + '</textarea>' +
    '<div class="lbl">파일명 예시 (' + extHint.slice(1).toUpperCase() + ')</div>' +
    '<textarea id="fname" class="path" rows="1" readonly>' + fileName + '</textarea>' +
    '<div class="lbl">로컬 저장 위치</div>' +
    '<textarea id="path" class="path" rows="1" readonly>' + localPath + '</textarea>' +
    '<button class="btn" onclick="copy()">📋 Asset Code 복사</button>' +
    '<div class="ok" id="ok"></div>' +
    '<script>' +
    'document.getElementById("code").select();' +
    'function copy(){' +
    '  var el=document.getElementById("code");el.select();el.setSelectionRange(0,999);' +
    '  try{document.execCommand("copy");document.getElementById("ok").innerText="✅ 복사 완료";}' +
    '  catch(e){document.getElementById("ok").innerText="Ctrl+C 로 복사하세요.";}' +
    '}' +
    '</script>'
  ).setWidth(520).setHeight(280);

  SpreadsheetApp.getUi().showModalDialog(html, '✅ Asset Code 생성 완료');
}

// 시트에서 활성 값 목록 반환 (Status = Active / inactive 제외)
function _getActiveValues(sheetName, codeCol, nameCol) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const totalCols = sheet.getLastColumn();
  const headers   = sheet.getRange(1, 1, 1, totalCols).getValues()[0];
  const statusIdx = headers.indexOf('Status'); // -1이면 필터 안 함
  const data      = sheet.getRange(2, 1, sheet.getLastRow() - 1, totalCols).getValues();
  const nc        = nameCol || codeCol;

  return data
    .filter(row => statusIdx < 0 || String(row[statusIdx] || '').toLowerCase() !== 'inactive')
    .map(row => {
      const result = [row[codeCol - 1]];
      if (nc > codeCol) result.push(row[nc - 1]);
      return result;
    });
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
    '다음 순서:\n' +
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
  sheet.getRange(2, 1, DEFAULT_PRODUCTS.length, DEFAULT_PRODUCTS[0].length).setValues(DEFAULT_PRODUCTS);
  SpreadsheetApp.getUi().alert('✅ Product_Master 초기화 완료 (' + DEFAULT_PRODUCTS.length + '개 상품)');
}

function setupLocations() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Location_Master');
  if (!sheet) sheet = ss.insertSheet('Location_Master');
  _setHeader(sheet, HEADERS.Location_Master, COLORS.Location_Master);
  sheet.getRange(2, 1, DEFAULT_LOCATIONS.length, DEFAULT_LOCATIONS[0].length).setValues(DEFAULT_LOCATIONS);
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
  // 코드 컬럼 (col 1)
  sheet.setColumnWidth(1, 300);
  // 링크 계열 컬럼
  ['Drive Link','Raw Link','Davinci Link','Final Link','Link'].forEach(col => {
    const idx = headers.indexOf(col) + 1;
    if (idx > 0) sheet.setColumnWidth(idx, 240);
  });
  // 텍스트 계열 컬럼
  ['Customer Code','Source Asset Code','File Name','Local Folder',
   'Note','Next Action','Contact','Customer Name','Location Name'].forEach(col => {
    const idx = headers.indexOf(col) + 1;
    if (idx > 0) sheet.setColumnWidth(idx, 190);
  });
}

// ── 개별 초기화 ──────────────────────────────────────────────
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

  const typeRes = ui.prompt('고객 유형', 'IND (개인) / FAM (가족) / GRP (단체)', ui.ButtonSet.OK_CANCEL);
  if (typeRes.getSelectedButton() !== ui.Button.OK) return;
  const type = typeRes.getResponseText().trim().toUpperCase();
  if (!CUSTOMER_TYPE_KEYS.includes(type)) { ui.alert('❌ 유효하지 않은 유형: ' + type); return; }

  const nameRes = ui.prompt('고객명', '', ui.ButtonSet.OK_CANCEL);
  if (nameRes.getSelectedButton() !== ui.Button.OK) return;
  const custName = nameRes.getResponseText().trim();
  if (!custName) { ui.alert('❌ 고객명을 입력하세요.'); return; }

  const countryRes = ui.prompt('국가 코드', 'KR / CN / JP / 기타', ui.ButtonSet.OK_CANCEL);
  if (countryRes.getSelectedButton() !== ui.Button.OK) return;
  const country = countryRes.getResponseText().trim().toUpperCase();

  const dateRes = ui.prompt('여행일', 'YYYY-MM-DD 형식', ui.ButtonSet.OK_CANCEL);
  if (dateRes.getSelectedButton() !== ui.Button.OK) return;
  const travelDate = dateRes.getResponseText().trim();

  const prods = _getActiveValues('Product_Master', 1, 2);
  const prodHint = prods.map(r => r[0]).join(' / ') || 'STARROUTE / WISHART / MIRACLE';
  const productRes = ui.prompt('상품코드', prodHint + '\n\n상품코드 입력:', ui.ButtonSet.OK_CANCEL);
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
  sheet.appendRow([customerCode, custName, type, country, partnerCode, travelDate, productCode, 'Active', today, '']);

  ui.alert(
    '✅ 고객 등록 완료\n\n' +
    '고객코드: ' + customerCode + '\n' +
    '이름: ' + custName + '\n' +
    '유형: ' + CUSTOMER_TYPES[type] + '\n' +
    '상품: ' + productCode + '\n\n' +
    '다음: 📋 Asset Code 생성 메뉴 실행'
  );
}

function _generateCustomerCode(type, year, ss) {
  const sheet = ss.getSheetByName('Customer_Master');
  if (!sheet || sheet.getLastRow() <= 1) return type + '-' + year + '-000001';
  const prefix   = type + '-' + year + '-';
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
  const ui  = SpreadsheetApp.getUi();
  const res = ui.prompt('고객코드 검색', '예) FAM-26-000001', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const code = res.getResponseText().trim();
  if (!code) return;

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const lines = ['🔍 검색: ' + code + '\n'];

  // Customer_Master
  const custSheet = ss.getSheetByName('Customer_Master');
  if (custSheet && custSheet.getLastRow() > 1) {
    const rows = custSheet.getDataRange().getValues().slice(1).filter(r => r[0] === code);
    if (rows.length > 0) {
      const r = rows[0];
      lines.push('👤 ' + r[1] + ' (' + (CUSTOMER_TYPES[r[2]] || r[2]) + ') | ' + r[3] +
                 ' | 여행: ' + r[5] + ' | 상품: ' + r[6]);
    } else {
      lines.push('👤 고객: 미등록');
    }
  }

  // Asset_Master (Customer Code = col 2, idx 1)
  const assetSheet = ss.getSheetByName('Asset_Master');
  if (assetSheet && assetSheet.getLastRow() > 1) {
    const rows = assetSheet.getDataRange().getValues().slice(1).filter(r => r[1] === code);
    lines.push('\n📷 에셋: ' + rows.length + '건');
    rows.slice(0, 8).forEach(r => lines.push('   ' + r[0] + '  [' + r[6] + ']'));
    if (rows.length > 8) lines.push('   ... 외 ' + (rows.length - 8) + '건');
  }

  // Video_Master (Customer Code = col 2, idx 1)
  const videoSheet = ss.getSheetByName('Video_Master');
  if (videoSheet && videoSheet.getLastRow() > 1) {
    const rows = videoSheet.getDataRange().getValues().slice(1).filter(r => r[1] === code);
    lines.push('\n🎬 영상: ' + rows.length + '건');
    rows.slice(0, 8).forEach(r => lines.push('   ' + r[0] + '  [' + r[4] + '] ' + r[6]));
    if (rows.length > 8) lines.push('   ... 외 ' + (rows.length - 8) + '건');
  }

  ui.alert(lines.join('\n'));
}

// ═══════════════════════════════════════════════════════════════
// 폴더 ID 설정
// ═══════════════════════════════════════════════════════════════

function setFolderId() {
  const ui  = SpreadsheetApp.getUi();
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
  const localFolder = LOCAL_FOLDER_MAP[parsed.type]
    || LOCAL_FOLDER_MAP[parsed.product]
    || '99_ARCHIVE';
  const localPath = LOCAL_ROOT + '\\' + localFolder;

  // ── Asset_Master (13 cols) ────────────────────────────────
  // Asset Code | Customer Code | Product Code | Location Code | Asset Type |
  // Version | Status | File Name | Local Folder | Drive Link | Used For | Created Date | Note
  if (category === 'asset' && !existing.asset.has(code)) {
    rows.asset.push([
      code,
      parsed.customerCode,
      parsed.product,
      parsed.location,
      parsed.type,
      parsed.version,
      '생성중',
      name,
      localPath,
      url,
      '',
      created,
      '',
    ]);
  }

  // ── Video_Master (12 cols) ────────────────────────────────
  // Video Code | Customer Code | Source Asset Code | Product Code |
  // Tool | Duration | Status | Raw Link | Davinci Link | Final Link | Created Date | Note
  else if (category === 'video' && !existing.video.has(code)) {
    const isFinal = parsed.type === 'FINAL';
    rows.video.push([
      code,
      parsed.customerCode,
      '',
      parsed.product,
      parsed.tool || _inferTool(parsed.ext),
      '',
      '생성중',
      isFinal ? '' : url,
      parsed.type === 'DAVINCI' ? url : '',
      isFinal ? url : '',
      created,
      '',
    ]);
  }

  // ── SSOT (7 cols) ─────────────────────────────────────────
  else if (category === 'ssot' && !existing.ssot.has(code)) {
    const title = parsed.isCustomerFile
      ? (parsed.customerCode + ' · ' + parsed.product)
      : _makeTitle(parsed);
    rows.ssot.push([code, parsed.type || 'DOC', title, parsed.version, 'Active', url, created]);
  }
}

// ═══════════════════════════════════════════════════════════════
// 파일명 파싱 (v4 신규 + v3 레거시 이원 처리)
// ═══════════════════════════════════════════════════════════════

/**
 * v4: DT-{FAM|IND|GRP}-{YY}-{XXXXXX}-{Product}-{Location}-{Type}-{Version}
 *     DT-FAM-26-000001-WISHART-HAMEL-IMG-V01
 *
 * v3(legacy): DT-{Country}-{Route}-{EP}-{Location}-{Type}-{SubType}-{Version}
 *     DT-CN-SR-EP07-HAMEL-IMG-MASTER-V01
 */
function _parseFileName(name) {
  const extMatch = name.match(/\.([^.]+)$/);
  const ext   = extMatch ? extMatch[1].toUpperCase() : '';
  const parts = name.replace(/\.[^.]+$/, '').split('-');

  if (CUSTOMER_TYPE_KEYS.includes(parts[1])) {
    return {
      isCustomerFile: true,
      customerCode:   parts[1] + '-' + parts[2] + '-' + parts[3],
      product:        (parts[4] || '').toUpperCase(),
      location:       (parts[5] || '').toUpperCase(),
      type:           (parts[6] || '').toUpperCase(),
      tool:           (parts[6] || '').toUpperCase(),
      version:        (parts[7] || '').toUpperCase(),
      country: '', route: '', ep: '',
      ext,
    };
  }
  return {
    isCustomerFile: false,
    customerCode:   '',
    product:        '',
    country:        (parts[1] || '').toUpperCase(),
    route:          (parts[2] || '').toUpperCase(),
    ep:             (parts[3] || '').toUpperCase(),
    location:       (parts[4] || '').toUpperCase(),
    type:           (parts[5] || '').toUpperCase(),
    tool:           (parts[6] || '').toUpperCase(),
    version:        (parts[7] || '').toUpperCase(),
    ext,
  };
}

function _getCategory(parsed) {
  const ext  = parsed.ext.toLowerCase();
  const type = parsed.type;
  if (['mp4','mov','avi','mkv'].includes(ext))        return 'video';
  if (['drp','drt','prproj'].includes(ext))            return 'video';
  if (['KLING','DAVINCI','FINAL','MIRACLE','GMIRACLE','VID','VIDEO','ANIM'].includes(type)) return 'video';
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
  return [parsed.ep, parsed.location, parsed.type].filter(Boolean).join(' · ') || 'Untitled';
}
