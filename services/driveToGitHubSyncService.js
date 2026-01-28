/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Drive → GitHub Sync Service
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * P0: READY 폴더 → GitHub docs/decisions/ 동기화
 * - PRIVATE 2중 차단
 * - 원장(Registry) 중복 체크
 * - 3회 재시도 + Slack 알림
 *
 * @version 1.0
 * @date 2026-01-22
 * ═══════════════════════════════════════════════════════════════════════════
 */

const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════
// 환경변수
// ═══════════════════════════════════════════════════════════════════════════

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'your-username';
const GITHUB_REPO = process.env.GITHUB_REPO || 'daily-miracles-mvp';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

const GOOGLE_SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const READY_FOLDER_ID = process.env.DECISION_EXPORT_READY_FOLDER_ID;

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const REGISTRY_TABLE = process.env.EXPORT_REGISTRY_TABLE || 'EXPORT_REGISTRY';

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL_ALERTS = process.env.SLACK_CHANNEL_ALERTS || 'C08XXXXXXXX'; // #aurora5-alerts
const SLACK_CHANNEL_DIGEST = process.env.SLACK_CHANNEL_RAW_DIGEST || 'C0A9DS4T0D8'; // #raw-digest

// ═══════════════════════════════════════════════════════════════════════════
// 상수
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAYS: [1000, 2000, 4000], // 지수 백오프
  GITHUB_PATH_PREFIX: 'docs/decisions',
  BLOCKED_SUBFOLDER: '_BLOCKED'
};

// PRIVATE/CONFIDENTIAL 감지 패턴
const PRIVATE_PATTERNS = [
  /sensitivity:\s*PRIVATE/i,
  /sensitivity:\s*CONFIDENTIAL/i,
  /#개인/,
  /#가족/,
  /#사적/,
  /#기밀/,
  /#대외비/,
  /\[PRIVATE\]/,
  /\[CONFIDENTIAL\]/,
  /CONFIDENTIAL\s*-\s*DO\s*NOT\s*SHARE/i
];

// ═══════════════════════════════════════════════════════════════════════════
// Google Drive API (Service Account)
// ═══════════════════════════════════════════════════════════════════════════

let googleAuth = null;

async function getGoogleAccessToken() {
  if (!GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 환경변수 미설정');
  }

  const sa = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now() / 1000);

  // JWT 생성
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };

  const base64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signInput = `${base64url(header)}.${base64url(payload)}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signInput);
  const signature = sign.sign(sa.private_key, 'base64url');

  const jwt = `${signInput}.${signature}`;

  // Access Token 요청
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  const data = await response.json();
  if (!data.access_token) {
    throw new Error(`Google OAuth 실패: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

async function listFilesInReadyFolder() {
  if (!READY_FOLDER_ID) {
    throw new Error('DECISION_EXPORT_READY_FOLDER_ID 환경변수 미설정');
  }

  const token = await getGoogleAccessToken();

  const query = `'${READY_FOLDER_ID}' in parents and mimeType='text/markdown' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,description)`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`Drive API 오류: ${data.error.message}`);
  }

  return data.files || [];
}

async function getFileContent(fileId) {
  const token = await getGoogleAccessToken();

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new Error(`파일 다운로드 실패: ${response.status}`);
  }

  return await response.text();
}

async function moveToBlocked(fileId, fileName) {
  const token = await getGoogleAccessToken();

  // _BLOCKED 폴더 찾기 또는 생성
  const query = `name='${CONFIG.BLOCKED_SUBFOLDER}' and '${READY_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`;

  let blockedFolderId;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    blockedFolderId = searchData.files[0].id;
  } else {
    // 폴더 생성
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: CONFIG.BLOCKED_SUBFOLDER,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [READY_FOLDER_ID]
      })
    });
    const createData = await createRes.json();
    blockedFolderId = createData.id;
  }

  // 파일 이동
  const moveRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${blockedFolderId}&removeParents=${READY_FOLDER_ID}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  return moveRes.ok;
}

// ═══════════════════════════════════════════════════════════════════════════
// GitHub API
// ═══════════════════════════════════════════════════════════════════════════

async function githubRequest(path, method = 'GET', body = null, retryCount = 0) {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN 환경변수 미설정');
  }

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/${path}`;
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Drive-GitHub-Sync'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
    options.headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      // Rate limit 체크
      if (response.status === 403 && data.message?.includes('rate limit')) {
        throw new Error('RATE_LIMIT');
      }
      throw new Error(data.message || `GitHub API 오류: ${response.status}`);
    }

    return data;
  } catch (error) {
    // 재시도 로직
    if (retryCount < CONFIG.MAX_RETRIES && error.message !== 'RATE_LIMIT') {
      console.log(`[Sync] GitHub 요청 재시도 ${retryCount + 1}/${CONFIG.MAX_RETRIES}`);
      await sleep(CONFIG.RETRY_DELAYS[retryCount] || 4000);
      return githubRequest(path, method, body, retryCount + 1);
    }
    throw error;
  }
}

async function uploadToGitHub(filePath, content, commitMessage) {
  // Base64 인코딩
  const contentBase64 = Buffer.from(content, 'utf-8').toString('base64');

  // 기존 파일 존재 확인 (SHA 필요)
  let sha = null;
  try {
    const existing = await githubRequest(`contents/${filePath}`);
    sha = existing.sha;
  } catch (e) {
    // 파일 없음 - 정상
  }

  const body = {
    message: commitMessage,
    content: contentBase64,
    branch: GITHUB_BRANCH
  };

  if (sha) {
    body.sha = sha;
  }

  const result = await githubRequest(`contents/${filePath}`, 'PUT', body);
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// Registry (Airtable)
// ═══════════════════════════════════════════════════════════════════════════

async function registryRequest(method = 'GET', body = null, recordId = null, queryParams = '') {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn('[Registry] Airtable 미설정 - 시뮬레이션 모드');
    return { success: false, simulated: true };
  }

  let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(REGISTRY_TABLE)}`;
  if (recordId) url += `/${recordId}`;
  if (queryParams) url += `?${queryParams}`;

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Registry 오류: ${data.error?.message || response.status}`);
  }

  return { success: true, data };
}

async function checkDuplicateInRegistry(canonicalId, sourceRef, contentHash) {
  // 3종 중복 체크 (A: canonical_id, B: source_ref, C: content_hash)
  const checks = [
    { field: 'canonical_id', value: canonicalId },
    { field: 'source_ref', value: sourceRef },
    { field: 'content_hash', value: contentHash }
  ];

  for (const check of checks) {
    if (!check.value) continue;

    const formula = `{${check.field}}="${check.value}"`;
    const result = await registryRequest('GET', null, null, `filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`);

    if (result.simulated) continue;

    if (result.data?.records?.length > 0) {
      return { isDuplicate: true, reason: check.field, existingRecord: result.data.records[0] };
    }
  }

  return { isDuplicate: false };
}

async function addToRegistry(record) {
  const fields = {
    canonical_id: record.canonicalId,
    doc_type: record.docType || 'DEC',
    source_ref: record.sourceRef,
    sensitivity: record.sensitivity,
    content_hash: record.contentHash,
    drive_file_url: record.driveFileUrl,
    github_path: record.githubPath,
    github_url: record.githubUrl,
    status: record.status,
    synced_at: new Date().toISOString(),
    error_msg: record.errorMsg || ''
  };

  return await registryRequest('POST', { fields });
}

async function getNextCanonicalId(docType = 'DEC') {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `${docType}-${today.slice(0, 4)}-${today.slice(4, 8)}-`;

  // 오늘 날짜의 마지막 번호 조회
  const formula = `FIND("${prefix}", {canonical_id})`;
  const result = await registryRequest('GET', null, null,
    `filterByFormula=${encodeURIComponent(formula)}&sort[0][field]=canonical_id&sort[0][direction]=desc&maxRecords=1`
  );

  let nextNum = 1;
  if (result.data?.records?.length > 0) {
    const lastId = result.data.records[0].fields.canonical_id;
    const lastNum = parseInt(lastId.split('-').pop(), 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIVATE 2중 차단
// ═══════════════════════════════════════════════════════════════════════════

/**
 * PRIVATE/CONFIDENTIAL 감지 (2중 체크)
 * @returns {{ isPrivate: boolean, reason: string, sensitivity: string }}
 */
function checkPrivate(fileMetadata, fileContent) {
  // 1차: 메타데이터 체크 (파일 description에 sensitivity 있는 경우)
  const description = fileMetadata.description || '';
  if (/sensitivity:\s*PRIVATE/i.test(description)) {
    return { isPrivate: true, reason: 'META_PRIVATE', sensitivity: 'PRIVATE' };
  }
  if (/sensitivity:\s*CONFIDENTIAL/i.test(description)) {
    return { isPrivate: true, reason: 'META_CONFIDENTIAL', sensitivity: 'CONFIDENTIAL' };
  }

  // 2차: 내용 체크
  for (const pattern of PRIVATE_PATTERNS) {
    if (pattern.test(fileContent)) {
      // CONFIDENTIAL vs PRIVATE 구분
      const patternStr = pattern.toString();
      const sensitivity = patternStr.toLowerCase().includes('confidential') ||
                          patternStr.includes('기밀') ||
                          patternStr.includes('대외비')
                          ? 'CONFIDENTIAL' : 'PRIVATE';
      return { isPrivate: true, reason: `CONTENT_MATCH: ${patternStr}`, sensitivity };
    }
  }

  return { isPrivate: false, reason: null, sensitivity: null };
}

/**
 * 파일 내용에서 메타데이터 추출
 */
function extractMetadata(content) {
  const meta = {
    sensitivity: 'INTERNAL',
    docType: 'DEC',
    sourceRef: null,
    title: ''
  };

  // YAML frontmatter 파싱
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const yaml = frontmatterMatch[1];

    const sensitivityMatch = yaml.match(/sensitivity:\s*(\w+)/i);
    if (sensitivityMatch) meta.sensitivity = sensitivityMatch[1].toUpperCase();

    const docTypeMatch = yaml.match(/doc_type:\s*(\w+)/i);
    if (docTypeMatch) meta.docType = docTypeMatch[1].toUpperCase();

    const sourceRefMatch = yaml.match(/source_ref:\s*(.+)/i);
    if (sourceRefMatch) meta.sourceRef = sourceRefMatch[1].trim();

    const titleMatch = yaml.match(/title:\s*(.+)/i);
    if (titleMatch) meta.title = titleMatch[1].trim();
  }

  // 제목 fallback
  if (!meta.title) {
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) meta.title = h1Match[1].trim();
  }

  return meta;
}

/**
 * 컨텐츠 해시 생성 (SHA256 앞 8자리)
 */
function generateContentHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 8);
}

// ═══════════════════════════════════════════════════════════════════════════
// Slack 알림
// ═══════════════════════════════════════════════════════════════════════════

async function postSlackAlert(channel, message, isError = false) {
  if (!SLACK_BOT_TOKEN) {
    console.warn('[Slack] 토큰 미설정 - 알림 스킵');
    return { success: false };
  }

  const emoji = isError ? ':rotating_light:' : ':white_check_mark:';
  const text = `${emoji} ${message}`;

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      channel,
      text,
      unfurl_links: false
    })
  });

  const data = await response.json();
  return { success: data.ok, ts: data.ts };
}

async function alertSyncFailed(fileName, errorMsg, retryCount) {
  const message = [
    `*GitHub Sync 실패*`,
    `• 파일: \`${fileName}\``,
    `• 사유: ${errorMsg}`,
    `• 재시도: ${retryCount}/${CONFIG.MAX_RETRIES} 실패`,
    `• 조치 필요: 수동 확인`
  ].join('\n');

  return await postSlackAlert(SLACK_CHANNEL_ALERTS, message, true);
}

async function alertPrivateBlocked(fileName, reason) {
  const message = [
    `*PRIVATE 문서 차단*`,
    `• 파일: \`${fileName}\``,
    `• 사유: ${reason}`,
    `• 조치: _BLOCKED 폴더로 이동됨`
  ].join('\n');

  return await postSlackAlert(SLACK_CHANNEL_ALERTS, message, true);
}

async function notifySyncSuccess(fileName, canonicalId, githubUrl) {
  const message = [
    `*GitHub Sync 완료*`,
    `• 파일: \`${fileName}\``,
    `• ID: \`${canonicalId}\``,
    `• URL: ${githubUrl}`
  ].join('\n');

  return await postSlackAlert(SLACK_CHANNEL_DIGEST, message, false);
}

// ═══════════════════════════════════════════════════════════════════════════
// 유틸리티
// ═══════════════════════════════════════════════════════════════════════════

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 Sync 로직
// ═══════════════════════════════════════════════════════════════════════════

async function syncSingleFile(file) {
  const result = {
    fileName: file.name,
    fileId: file.id,
    status: 'PENDING',
    canonicalId: null,
    githubUrl: null,
    errorMsg: null
  };

  try {
    console.log(`[Sync] 처리 시작: ${file.name}`);

    // 1. 파일 내용 다운로드
    const content = await getFileContent(file.id);
    const contentHash = generateContentHash(content);

    // 2. PRIVATE 2중 차단 (⚠️ 최우선!)
    const privateCheck = checkPrivate(file, content);
    if (privateCheck.isPrivate) {
      const sensitivityLevel = privateCheck.sensitivity || 'PRIVATE';
      console.warn(`[Sync] ${sensitivityLevel} 차단: ${file.name} (${privateCheck.reason})`);

      // _BLOCKED로 이동
      await moveToBlocked(file.id, file.name);

      // 원장에 기록 (status = BLOCKED)
      await addToRegistry({
        canonicalId: `BLOCKED-${Date.now()}`,
        docType: 'BLOCKED',
        sourceRef: file.id,
        sensitivity: sensitivityLevel,
        contentHash,
        driveFileUrl: `https://drive.google.com/file/d/${file.id}`,
        githubPath: null,
        githubUrl: null,
        status: 'BLOCKED',  // SKIPPED → BLOCKED로 명확화
        errorMsg: `${sensitivityLevel}_BLOCKED: ${privateCheck.reason}`
      });

      // Slack 알림
      await alertPrivateBlocked(file.name, `${sensitivityLevel}: ${privateCheck.reason}`);

      result.status = 'BLOCKED';
      result.errorMsg = `${sensitivityLevel}_BLOCKED: ${privateCheck.reason}`;
      return result;
    }

    // 3. 메타데이터 추출
    const meta = extractMetadata(content);

    // 4. 중복 체크 (canonical_id는 아직 생성 전이므로 source_ref, content_hash만)
    const dupCheck = await checkDuplicateInRegistry(null, file.id, contentHash);
    if (dupCheck.isDuplicate) {
      console.log(`[Sync] 중복 스킵: ${file.name} (${dupCheck.reason})`);

      result.status = 'SKIPPED';
      result.errorMsg = `DUPLICATE: ${dupCheck.reason}`;
      return result;
    }

    // 5. Canonical ID 생성
    const canonicalId = await getNextCanonicalId(meta.docType);
    result.canonicalId = canonicalId;

    // 6. GitHub 업로드
    const githubPath = `${CONFIG.GITHUB_PATH_PREFIX}/${canonicalId}.md`;
    const commitMessage = `docs: Add ${canonicalId} - ${meta.title || file.name}`;

    const uploadResult = await uploadToGitHub(githubPath, content, commitMessage);
    const githubUrl = uploadResult.content?.html_url || `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/${githubPath}`;

    result.githubUrl = githubUrl;

    // 7. 원장에 기록
    await addToRegistry({
      canonicalId,
      docType: meta.docType,
      sourceRef: file.id,
      sensitivity: meta.sensitivity,
      contentHash,
      driveFileUrl: `https://drive.google.com/file/d/${file.id}`,
      githubPath,
      githubUrl,
      status: 'SYNCED',
      errorMsg: null
    });

    // 8. 성공 알림
    await notifySyncSuccess(file.name, canonicalId, githubUrl);

    result.status = 'SYNCED';
    console.log(`[Sync] 완료: ${file.name} → ${canonicalId}`);

  } catch (error) {
    console.error(`[Sync] 실패: ${file.name}`, error.message);

    result.status = 'FAILED';
    result.errorMsg = error.message;

    // 실패 알림
    await alertSyncFailed(file.name, error.message, CONFIG.MAX_RETRIES);

    // 원장에 실패 기록
    await addToRegistry({
      canonicalId: `FAILED-${Date.now()}`,
      docType: 'UNKNOWN',
      sourceRef: file.id,
      sensitivity: 'UNKNOWN',
      contentHash: null,
      driveFileUrl: `https://drive.google.com/file/d/${file.id}`,
      githubPath: null,
      githubUrl: null,
      status: 'FAILED',
      errorMsg: error.message
    });
  }

  return result;
}

/**
 * 전체 Sync 실행
 */
async function runSync() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Drive → GitHub Sync 시작');
  console.log('═══════════════════════════════════════════════════════════');

  const results = {
    total: 0,
    synced: 0,
    blocked: 0,
    skipped: 0,
    failed: 0,
    details: []
  };

  try {
    // 1. READY 폴더 파일 목록
    const files = await listFilesInReadyFolder();
    results.total = files.length;

    console.log(`[Sync] 발견된 파일: ${files.length}개`);

    if (files.length === 0) {
      console.log('[Sync] 처리할 파일 없음');
      return results;
    }

    // 2. 각 파일 처리
    for (const file of files) {
      const result = await syncSingleFile(file);
      results.details.push(result);

      switch (result.status) {
        case 'SYNCED': results.synced++; break;
        case 'BLOCKED': results.blocked++; break;
        case 'SKIPPED': results.skipped++; break;
        case 'FAILED': results.failed++; break;
      }

      // 파일 간 딜레이 (API 부하 방지)
      await sleep(1000);
    }

  } catch (error) {
    console.error('[Sync] 치명적 오류:', error.message);

    // 안전 중단 알림
    await postSlackAlert(SLACK_CHANNEL_ALERTS,
      `*Drive→GitHub Sync 치명적 오류*\n사유: ${error.message}\n조치: 전체 Sync 중단됨`,
      true
    );

    throw error;
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  완료: 동기화 ${results.synced} / 차단 ${results.blocked} / 스킵 ${results.skipped} / 실패 ${results.failed}`);
  console.log('═══════════════════════════════════════════════════════════');

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// 모듈 내보내기
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  runSync,
  syncSingleFile,
  checkPrivate,
  checkDuplicateInRegistry,
  generateContentHash,
  extractMetadata,
  getNextCanonicalId,
  // 테스트용
  PRIVATE_PATTERNS,
  CONFIG
};
