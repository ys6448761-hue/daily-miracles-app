/**
 * driveGitHubSyncRoutes.js
 *
 * Drive → GitHub 동기화 API 라우터
 *
 * POST /api/sync/run      - 수동 동기화 실행
 * GET  /api/sync/health   - 헬스체크
 * GET  /api/sync/status   - 최근 동기화 상태
 *
 * @version 1.0
 * @date 2026-01-22
 */

const express = require('express');
const router = express.Router();

// 서비스 로드
let driveGitHubSyncService = null;
try {
  driveGitHubSyncService = require('../services/driveToGitHubSyncService');
  console.log('✅ Drive→GitHub Sync 서비스 로드 성공');
} catch (error) {
  console.error('❌ Drive→GitHub Sync 서비스 로드 실패:', error.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// 환경변수
// ═══════════════════════════════════════════════════════════════════════════

const SYNC_API_SECRET = process.env.DRIVE_GITHUB_SYNC_API_SECRET;

// ═══════════════════════════════════════════════════════════════════════════
// 인증 미들웨어
// ═══════════════════════════════════════════════════════════════════════════

function verifySecret(req, res, next) {
  const secret = req.headers['x-sync-secret'];

  // 시크릿 미설정 시 경고만 (개발 편의)
  if (!SYNC_API_SECRET) {
    console.warn('[DriveGitHubSync] DRIVE_GITHUB_SYNC_API_SECRET 미설정 - 인증 스킵');
    return next();
  }

  if (!secret || secret !== SYNC_API_SECRET) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid x-sync-secret header'
    });
  }

  next();
}

// ═══════════════════════════════════════════════════════════════════════════
// 최근 동기화 결과 저장 (메모리)
// ═══════════════════════════════════════════════════════════════════════════

let lastSyncResult = null;
let lastSyncTime = null;
let isSyncing = false;

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/sync/health - 헬스체크
// ═══════════════════════════════════════════════════════════════════════════

router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'DriveGitHubSync',
    version: '1.0.0',
    status: driveGitHubSyncService ? 'ready' : 'service_not_loaded',
    isSyncing,
    config: {
      secretConfigured: !!SYNC_API_SECRET,
      googleServiceAccountConfigured: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      readyFolderConfigured: !!process.env.DECISION_EXPORT_READY_FOLDER_ID,
      githubTokenConfigured: !!process.env.GITHUB_TOKEN,
      airtableConfigured: !!(process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID),
      slackConfigured: !!process.env.SLACK_BOT_TOKEN
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/sync/status - 최근 동기화 상태
// ═══════════════════════════════════════════════════════════════════════════

router.get('/status', (req, res) => {
  res.json({
    success: true,
    isSyncing,
    lastSyncTime: lastSyncTime ? lastSyncTime.toISOString() : null,
    lastSyncResult: lastSyncResult || {
      message: '아직 동기화가 실행되지 않았습니다.'
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/sync/run - 수동 동기화 실행
// ═══════════════════════════════════════════════════════════════════════════

router.post('/run', verifySecret, async (req, res) => {
  const startTime = Date.now();

  try {
    // 서비스 체크
    if (!driveGitHubSyncService) {
      return res.status(500).json({
        success: false,
        error: 'Drive→GitHub Sync 서비스가 로드되지 않았습니다.'
      });
    }

    // 동시 실행 방지
    if (isSyncing) {
      return res.status(409).json({
        success: false,
        error: '동기화가 이미 진행 중입니다. 완료 후 다시 시도하세요.',
        lastSyncTime: lastSyncTime ? lastSyncTime.toISOString() : null
      });
    }

    // 동기화 시작
    isSyncing = true;
    console.log('[DriveGitHubSync] 동기화 시작');

    const result = await driveGitHubSyncService.runSync();

    const elapsed = Date.now() - startTime;

    // 결과 저장
    lastSyncResult = {
      total: result.total,
      synced: result.synced,
      blocked: result.blocked || 0,
      skipped: result.skipped,
      failed: result.failed,
      elapsed_ms: elapsed,
      details: result.details.map(d => ({
        fileName: d.fileName,
        status: d.status,
        canonicalId: d.canonicalId,
        errorMsg: d.errorMsg
      }))
    };
    lastSyncTime = new Date();
    isSyncing = false;

    console.log(`[DriveGitHubSync] 동기화 완료 (${elapsed}ms): 성공 ${result.synced}, 스킵 ${result.skipped}, 실패 ${result.failed}`);

    return res.json({
      success: true,
      total: result.total,
      synced: result.synced,
      blocked: result.blocked || 0,
      skipped: result.skipped,
      failed: result.failed,
      elapsed_ms: elapsed,
      details: result.details
    });

  } catch (error) {
    isSyncing = false;
    console.error('[DriveGitHubSync] 동기화 오류:', error);

    lastSyncResult = {
      error: error.message,
      elapsed_ms: Date.now() - startTime
    };
    lastSyncTime = new Date();

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/sync/health/deep - 심층 헬스체크 (실제 연결 테스트)
// ═══════════════════════════════════════════════════════════════════════════

router.get('/health/deep', verifySecret, async (req, res) => {
  const checks = {
    google_drive: { status: 'unchecked', message: null },
    github_api: { status: 'unchecked', message: null },
    airtable_registry: { status: 'unchecked', message: null },
    slack_alerts: { status: 'unchecked', message: null }
  };

  let allPassed = true;

  // 1. Google Drive 접근 테스트
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.DECISION_EXPORT_READY_FOLDER_ID) {
    try {
      // Service Account JSON 파싱 테스트
      const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      if (sa.client_email && sa.private_key) {
        checks.google_drive.status = 'ok';
        checks.google_drive.message = `Service Account: ${sa.client_email.split('@')[0]}@...`;
      } else {
        checks.google_drive.status = 'error';
        checks.google_drive.message = 'client_email 또는 private_key 누락';
        allPassed = false;
      }
    } catch (e) {
      checks.google_drive.status = 'error';
      checks.google_drive.message = `JSON 파싱 오류: ${e.message}`;
      allPassed = false;
    }
  } else {
    checks.google_drive.status = 'disabled';
    checks.google_drive.message = '환경변수 미설정';
  }

  // 2. GitHub API 테스트
  if (process.env.GITHUB_TOKEN) {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          'User-Agent': 'Drive-GitHub-Sync-HealthCheck'
        }
      });

      if (response.ok) {
        const user = await response.json();
        checks.github_api.status = 'ok';
        checks.github_api.message = `인증 성공: ${user.login}`;
      } else if (response.status === 401) {
        checks.github_api.status = 'error';
        checks.github_api.message = '토큰 인증 실패 (401)';
        allPassed = false;
      } else {
        checks.github_api.status = 'error';
        checks.github_api.message = `HTTP ${response.status}`;
        allPassed = false;
      }
    } catch (e) {
      checks.github_api.status = 'error';
      checks.github_api.message = e.message;
      allPassed = false;
    }
  } else {
    checks.github_api.status = 'disabled';
    checks.github_api.message = 'GITHUB_TOKEN 미설정';
  }

  // 3. Airtable Registry 테스트
  if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
    try {
      const tableName = process.env.EXPORT_REGISTRY_TABLE || 'EXPORT_REGISTRY';
      const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?maxRecords=1`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        checks.airtable_registry.status = 'ok';
        checks.airtable_registry.message = `테이블 접근 성공 (${data.records?.length || 0} records)`;
      } else if (response.status === 404) {
        checks.airtable_registry.status = 'warning';
        checks.airtable_registry.message = `테이블 '${tableName}' 없음 - 자동 생성됨`;
      } else {
        checks.airtable_registry.status = 'error';
        checks.airtable_registry.message = `HTTP ${response.status}`;
        allPassed = false;
      }
    } catch (e) {
      checks.airtable_registry.status = 'error';
      checks.airtable_registry.message = e.message;
      allPassed = false;
    }
  } else {
    checks.airtable_registry.status = 'disabled';
    checks.airtable_registry.message = 'Airtable 환경변수 미설정';
  }

  // 4. Slack 테스트 (auth.test)
  if (process.env.SLACK_BOT_TOKEN) {
    try {
      const response = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.ok) {
        checks.slack_alerts.status = 'ok';
        checks.slack_alerts.message = `Bot: ${data.user} @ ${data.team}`;
      } else {
        checks.slack_alerts.status = 'error';
        checks.slack_alerts.message = data.error || 'Unknown error';
        allPassed = false;
      }
    } catch (e) {
      checks.slack_alerts.status = 'error';
      checks.slack_alerts.message = e.message;
      allPassed = false;
    }
  } else {
    checks.slack_alerts.status = 'disabled';
    checks.slack_alerts.message = 'SLACK_BOT_TOKEN 미설정';
  }

  res.json({
    success: allPassed,
    service: 'DriveGitHubSync',
    checkType: 'deep',
    timestamp: new Date().toISOString(),
    checks,
    summary: {
      total: Object.keys(checks).length,
      ok: Object.values(checks).filter(c => c.status === 'ok').length,
      error: Object.values(checks).filter(c => c.status === 'error').length,
      disabled: Object.values(checks).filter(c => c.status === 'disabled').length
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/sync/test-private - PRIVATE 차단 테스트
// ═══════════════════════════════════════════════════════════════════════════

router.post('/test-private', verifySecret, (req, res) => {
  try {
    if (!driveGitHubSyncService) {
      return res.status(500).json({
        success: false,
        error: '서비스가 로드되지 않았습니다.'
      });
    }

    const { content, metadata } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'content는 필수입니다.'
      });
    }

    const fileMetadata = metadata || { description: '' };
    const result = driveGitHubSyncService.checkPrivate(fileMetadata, content);

    return res.json({
      success: true,
      isPrivate: result.isPrivate,
      reason: result.reason,
      patterns: driveGitHubSyncService.PRIVATE_PATTERNS.map(p => p.toString())
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/sync/test-hash - 콘텐츠 해시 테스트
// ═══════════════════════════════════════════════════════════════════════════

router.post('/test-hash', verifySecret, (req, res) => {
  try {
    if (!driveGitHubSyncService) {
      return res.status(500).json({
        success: false,
        error: '서비스가 로드되지 않았습니다.'
      });
    }

    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'content는 필수입니다.'
      });
    }

    const hash = driveGitHubSyncService.generateContentHash(content);
    const meta = driveGitHubSyncService.extractMetadata(content);

    return res.json({
      success: true,
      contentHash: hash,
      extractedMetadata: meta
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 모듈 내보내기
// ═══════════════════════════════════════════════════════════════════════════

module.exports = router;
