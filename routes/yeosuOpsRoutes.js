/**
 * yeosuOpsRoutes.js
 * 여수여행센터 운영 컨트롤타워 OS v0 API 라우터
 *
 * Base path: /api/ops-center
 */

const express = require('express');
const router = express.Router();

// DB 로딩 (Reset API용)
let db = null;
try {
  db = require('../database/db');
} catch (error) {
  console.error('❌ DB 로드 실패 (Reset API 사용 불가):', error.message);
}

// 서비스 로딩
let services = null;
try {
  services = require('../services/yeosu-ops-center');
  console.log('✅ Yeosu Ops Center 서비스 로드 성공');
} catch (error) {
  console.error('❌ Yeosu Ops Center 서비스 로드 실패:', error.message);
}

// 룰 로더 (스키마 검증 + 캐시)
let rulesLoader = null;
try {
  rulesLoader = require('../services/yeosu-ops-center/rulesLoader');
  console.log('✅ Rules Loader 로드 성공');
} catch (error) {
  console.error('⚠️ Rules Loader 로드 실패 (룰 API 미사용):', error.message);
}

// ─────────────────────────────────────────────────────────────
// Rate Limiter (메모리 기반, 의존성 없음)
// ─────────────────────────────────────────────────────────────
const rateLimitBucket = new Map(); // key: ip, value: { count, resetAt }

/**
 * 간단한 Rate Limiter 미들웨어
 * - 1분당 5회 제한 (단일 인스턴스 기준)
 * - 토큰 유출 시 폭주 방지용 최소 방어선
 */
function simpleRateLimit(limit = 5, windowMs = 60 * 1000) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();

    const cur = rateLimitBucket.get(ip);
    if (!cur || now > cur.resetAt) {
      rateLimitBucket.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (cur.count >= limit) {
      console.warn(`⚠️ Rate limit exceeded: ${ip} (${cur.count}/${limit})`);
      return res.status(429).json({
        success: false,
        error: 'rate_limited',
        message: `요청 한도 초과 (${limit}회/분). 잠시 후 다시 시도해주세요.`,
        retry_after_ms: cur.resetAt - now
      });
    }

    cur.count += 1;
    return next();
  };
}

// 서비스 가용성 체크 미들웨어
function requireServices(req, res, next) {
  if (!services) {
    return res.status(503).json({
      success: false,
      error: 'service_unavailable',
      message: 'Ops Center 서비스가 로드되지 않았습니다'
    });
  }
  next();
}

router.use(requireServices);

// ═══════════════════════════════════════════════════════════
// Health Check
// ═══════════════════════════════════════════════════════════

router.get('/health', (req, res) => {
  // P0: rulesSnapshot은 req.app.get()으로만 접근 (server.js에서 preload)
  const rulesMeta = req.app.get('rulesSnapshot');

  res.json({
    success: true,
    service: 'yeosu-ops-center',
    version: 'v0.1.0',
    pid: process.pid,
    runtime_port: req.app.get('runtime_port') || null,
    env_port: process.env.PORT || null,
    rules: rulesMeta ? {
      version: rulesMeta.versions?.mice?.version || null,
      hash: rulesMeta.hash || null,
      hash_algo: rulesMeta.hash_algo || null,
      bundle: rulesMeta.bundle || null,
      loaded_at: rulesMeta.loaded_at || null
    } : null,
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════
// Rules (룰 버전 조회)
// ═══════════════════════════════════════════════════════════

/**
 * 룰 버전 조회 API
 * GET /api/ops-center/rules/version
 */
router.get('/rules/version', (req, res) => {
  try {
    if (!rulesLoader) {
      return res.status(503).json({
        success: false,
        error: 'rules_loader_unavailable',
        message: 'Rules Loader가 로드되지 않았습니다'
      });
    }

    const version = rulesLoader.getRulesVersion();

    res.json({
      success: true,
      data: version
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'rules_load_failed',
      message: error.message
    });
  }
});

/**
 * 룰 캐시 클리어 API (관리자용)
 * POST /api/ops-center/rules/cache/clear
 */
router.post('/rules/cache/clear', (req, res) => {
  try {
    if (!rulesLoader) {
      return res.status(503).json({
        success: false,
        error: 'rules_loader_unavailable'
      });
    }

    rulesLoader.clearRulesCache();

    res.json({
      success: true,
      message: '룰 캐시가 클리어되었습니다',
      cleared_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 룰 핫 리로드 API (관리자 전용)
 * POST /api/ops-center/rules/reload
 *
 * 서버 재시작 없이 룰 파일 변경사항 반영
 * 보안: X-ADMIN-TOKEN 헤더 필수 (ADMIN_TOKEN 환경변수와 일치해야 함)
 *
 * 감사로그: 콘솔에 변경 전/후 해시, IP, 타임스탬프 기록
 * Slack 알림: SLACK_WEBHOOK_URL 설정 시 전송 (선택)
 */
router.post('/rules/reload', simpleRateLimit(5, 60 * 1000), async (req, res) => {
  try {
    // 토큰 인증 (운영: ADMIN_TOKEN만, 개발: DEMO_RESET_TOKEN 폴백)
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.DEMO_RESET_TOKEN;
    const providedToken = req.headers['x-admin-token'];

    if (!ADMIN_TOKEN) {
      return res.status(503).json({
        success: false,
        error: 'admin_not_configured',
        message: 'ADMIN_TOKEN 환경변수가 설정되지 않았습니다'
      });
    }

    if (!providedToken || providedToken !== ADMIN_TOKEN) {
      return res.status(403).json({
        success: false,
        error: 'forbidden',
        message: 'X-ADMIN-TOKEN 헤더가 필요합니다'
      });
    }

    if (!rulesLoader) {
      return res.status(503).json({
        success: false,
        error: 'rules_loader_unavailable'
      });
    }

    // 0. 이전 스냅샷 저장 (감사로그용)
    const prevSnapshot = req.app.get('rulesSnapshot');

    // 1. 캐시 클리어
    rulesLoader.clearRulesCache();

    // 2. 룰 다시 로드
    const { meta } = rulesLoader.loadRules();

    // 3. app 전역 rulesSnapshot 갱신
    req.app.set('rulesSnapshot', meta);

    // 4. 감사로그 (P0: 추적성 필수)
    const auditLog = {
      event: 'RULES_RELOAD',
      by: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      from: prevSnapshot?.hash?.substring(0, 16) || 'none',
      to: meta.hash?.substring(0, 16),
      bundle: meta.bundle,
      versions: {
        mice: meta.versions?.mice?.version,
        evidence: meta.versions?.evidence?.version,
        checklist: meta.versions?.checklist?.version
      },
      at: new Date().toISOString()
    };
    console.log('🔁 Rules reloaded:', auditLog);

    // 5. Slack 알림 (P1: 선택 - SLACK_WEBHOOK_URL 있을 때만)
    const slackWebhook = process.env.SLACK_WEBHOOK_URL || process.env.OPS_SLACK_WEBHOOK;
    if (slackWebhook) {
      try {
        const axios = require('axios');
        await axios.post(slackWebhook, {
          text: `🔁 *Rules Hot-Reload*`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Rules Hot-Reload* 완료\n• From: \`${auditLog.from}...\`\n• To: \`${auditLog.to}...\`\n• By: ${auditLog.by}\n• At: ${auditLog.at}`
              }
            }
          ]
        });
      } catch (slackErr) {
        console.warn('⚠️ Slack 알림 전송 실패 (무시):', slackErr.message);
      }
    }

    res.json({
      success: true,
      message: '룰이 성공적으로 리로드되었습니다',
      rules: {
        hash: meta.hash,
        hash_algo: meta.hash_algo,
        bundle: meta.bundle,
        loaded_at: meta.loaded_at,
        versions: meta.versions
      },
      audit: auditLog
    });
  } catch (error) {
    console.error('❌ Rules reload failed:', error);
    res.status(500).json({
      success: false,
      error: 'reload_failed',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// Demo Reset (데모 초기화)
// ═══════════════════════════════════════════════════════════

/**
 * 데모 초기화 API
 * - 특정 행사의 SSOT 항목, 승인 요청, 감사 로그를 초기화
 * - 행사 자체는 유지됨
 * - 데모/시연용 (운영 환경에서는 주의해서 사용)
 *
 * 보안: X-DEMO-RESET-TOKEN 헤더 필수
 * ENV: DEMO_RESET_TOKEN (미설정 시 기본값 사용)
 */
router.post('/demo/reset/:eventId', async (req, res) => {
  try {
    // 토큰 인증 체크
    const DEMO_RESET_TOKEN = process.env.DEMO_RESET_TOKEN || 'yeosu-ops-demo-2026';
    const providedToken = req.headers['x-demo-reset-token'];

    if (!providedToken || providedToken !== DEMO_RESET_TOKEN) {
      return res.status(401).json({
        success: false,
        error: 'unauthorized',
        message: 'X-DEMO-RESET-TOKEN 헤더가 필요합니다'
      });
    }

    const eventId = req.params.eventId;

    if (!db) {
      return res.status(503).json({ success: false, error: 'DB not available' });
    }

    // 행사 존재 확인
    const event = await services.eventService.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const results = {
      eventId,
      eventName: event.name,
      deletedAt: new Date().toISOString(),
      counts: {}
    };

    // 1. 트리거 로그 삭제
    const triggerLogResult = await db.query(`
      DELETE FROM ops_trigger_logs
      WHERE trigger_id IN (SELECT id FROM ops_triggers WHERE event_id = $1)
    `, [eventId]);
    results.counts.triggerLogs = triggerLogResult.rowCount;

    // 2. 승인 요청 삭제
    const approvalResult = await db.query(`
      DELETE FROM ops_approvals WHERE event_id = $1
    `, [eventId]);
    results.counts.approvals = approvalResult.rowCount;

    // 3. SSOT 이력 삭제
    const historyResult = await db.query(`
      DELETE FROM ops_ssot_history
      WHERE item_id IN (SELECT id FROM ops_ssot_items WHERE event_id = $1)
    `, [eventId]);
    results.counts.ssotHistory = historyResult.rowCount;

    // 4. SSOT 항목 삭제
    const ssotResult = await db.query(`
      DELETE FROM ops_ssot_items WHERE event_id = $1
    `, [eventId]);
    results.counts.ssotItems = ssotResult.rowCount;

    // 5. 감사 로그 삭제
    const auditResult = await db.query(`
      DELETE FROM ops_audit_log WHERE event_id = $1
    `, [eventId]);
    results.counts.auditLogs = auditResult.rowCount;

    // 6. KPI 스냅샷 삭제
    const kpiResult = await db.query(`
      DELETE FROM ops_kpi_snapshots WHERE event_id = $1
    `, [eventId]);
    results.counts.kpiSnapshots = kpiResult.rowCount;

    console.log(`✅ Demo reset completed for event ${eventId}:`, results.counts);

    res.json({
      success: true,
      message: `행사 "${event.name}" 초기화 완료`,
      data: results
    });
  } catch (error) {
    console.error('Demo reset failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// Events (행사/축제)
// ═══════════════════════════════════════════════════════════

// 행사 생성
router.post('/events', async (req, res) => {
  try {
    const event = await services.eventService.createEvent({
      name: req.body.name,
      description: req.body.description,
      periodStart: req.body.periodStart,
      periodEnd: req.body.periodEnd,
      location: req.body.location,
      status: req.body.status,
      metadata: req.body.metadata,
      createdBy: req.body.createdBy
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('Event creation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 행사 목록
router.get('/events', async (req, res) => {
  try {
    const events = await services.eventService.listEvents({
      status: req.query.status,
      limit: parseInt(req.query.limit, 10) || 50,
      offset: parseInt(req.query.offset, 10) || 0
    });

    res.json({ success: true, data: events, count: events.length });
  } catch (error) {
    console.error('Event list failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 행사 상세
router.get('/events/:id', async (req, res) => {
  try {
    const event = await services.eventService.getEvent(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const stats = await services.eventService.getEventStats(req.params.id);
    res.json({ success: true, data: { ...event, stats } });
  } catch (error) {
    console.error('Event detail failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 행사 수정
router.patch('/events/:id', async (req, res) => {
  try {
    const event = await services.eventService.updateEvent(req.params.id, req.body);
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Event update failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 행사 삭제
router.delete('/events/:id', async (req, res) => {
  try {
    const deleted = await services.eventService.deleteEvent(req.params.id);
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Event delete failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// Members (멤버/권한)
// ═══════════════════════════════════════════════════════════

// 멤버 추가
router.post('/events/:eventId/members', async (req, res) => {
  try {
    const member = await services.memberService.addMember({
      eventId: req.params.eventId,
      userName: req.body.userName,
      userEmail: req.body.userEmail,
      userPhone: req.body.userPhone,
      role: req.body.role,
      approvalLevel: req.body.approvalLevel,
      slackUserId: req.body.slackUserId
    });

    res.status(201).json({ success: true, data: member });
  } catch (error) {
    console.error('Member add failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 멤버 목록
router.get('/events/:eventId/members', async (req, res) => {
  try {
    const members = await services.memberService.listMembers(req.params.eventId, {
      role: req.query.role,
      isActive: req.query.isActive !== 'false'
    });

    res.json({ success: true, data: members, count: members.length });
  } catch (error) {
    console.error('Member list failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 멤버 수정
router.patch('/members/:id', async (req, res) => {
  try {
    const member = await services.memberService.updateMember(req.params.id, req.body);
    res.json({ success: true, data: member });
  } catch (error) {
    console.error('Member update failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 멤버 삭제
router.delete('/members/:id', async (req, res) => {
  try {
    const deleted = await services.memberService.deleteMember(req.params.id);
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Member delete failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// SSOT Items (핵심)
// ═══════════════════════════════════════════════════════════

// SSOT 항목 생성
router.post('/ssot-items', async (req, res) => {
  try {
    const item = await services.ssotService.createItem({
      eventId: req.body.eventId,
      category: req.body.category,
      itemKey: req.body.itemKey,
      label: req.body.label,
      valueCurrent: req.body.valueCurrent,
      valueType: req.body.valueType,
      requiresApproval: req.body.requiresApproval,
      requiredApprovalLevel: req.body.requiredApprovalLevel,
      metadata: req.body.metadata,
      createdBy: req.body.createdBy,
      createdByName: req.body.createdByName
    });

    // 감사 로그
    await services.auditService.log({
      eventId: req.body.eventId,
      actorId: req.body.createdBy,
      actorName: req.body.createdByName,
      action: 'CREATE',
      objectType: 'ssot_item',
      objectId: item.id,
      objectLabel: item.label,
      afterValue: { value: item.value_current }
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('SSOT item creation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SSOT 항목 목록
router.get('/ssot-items', async (req, res) => {
  try {
    const items = await services.ssotService.listItems(req.query.event_id, {
      category: req.query.category,
      status: req.query.status,
      requiresApproval: req.query.requires_approval === 'true' ? true :
                        req.query.requires_approval === 'false' ? false : undefined
    });

    res.json({ success: true, data: items, count: items.length });
  } catch (error) {
    console.error('SSOT item list failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SSOT 항목 상세
router.get('/ssot-items/:id', async (req, res) => {
  try {
    const item = await services.ssotService.getItem(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('SSOT item detail failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SSOT 항목 수정 (승인요청 포함)
router.patch('/ssot-items/:id', async (req, res) => {
  try {
    const existingItem = await services.ssotService.getItem(req.params.id);
    if (!existingItem) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const item = await services.ssotService.updateItem(req.params.id, {
      valueCurrent: req.body.valueCurrent,
      changeReason: req.body.changeReason,
      changedBy: req.body.changedBy,
      changedByName: req.body.changedByName,
      skipApproval: req.body.skipApproval
    });

    // 승인이 필요한 경우 승인 요청 생성
    if (item.status === 'PENDING_APPROVAL') {
      await services.approvalService.createApprovalRequest({
        eventId: existingItem.event_id,
        targetType: 'ssot_item',
        targetId: item.id,
        requestedLevel: item.required_approval_level,
        requestedBy: req.body.changedBy,
        requestedByName: req.body.changedByName,
        requestReason: req.body.changeReason
      });

      // 트리거 발동
      await services.triggerService.fireTriggers(existingItem.event_id, 'approval_request', {
        label: item.label,
        requestedBy: req.body.changedByName,
        reason: req.body.changeReason
      });
    }

    // 감사 로그
    await services.auditService.log({
      eventId: existingItem.event_id,
      actorId: req.body.changedBy,
      actorName: req.body.changedByName,
      action: 'UPDATE',
      objectType: 'ssot_item',
      objectId: item.id,
      objectLabel: item.label,
      beforeValue: { value: existingItem.value_current },
      afterValue: { value: item.value_current }
    });

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('SSOT item update failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SSOT 항목 이력
router.get('/ssot-items/:id/history', async (req, res) => {
  try {
    const history = await services.ssotService.getItemHistory(req.params.id, {
      limit: parseInt(req.query.limit, 10) || 50,
      offset: parseInt(req.query.offset, 10) || 0
    });

    res.json({ success: true, data: history, count: history.length });
  } catch (error) {
    console.error('SSOT item history failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SSOT 삭제
router.delete('/ssot-items/:id', async (req, res) => {
  try {
    const deleted = await services.ssotService.deleteItem(req.params.id);
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('SSOT item delete failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// Approvals (승인)
// ═══════════════════════════════════════════════════════════

// 승인 요청 생성
router.post('/approvals/request', async (req, res) => {
  try {
    const approval = await services.approvalService.createApprovalRequest({
      eventId: req.body.eventId,
      targetType: req.body.targetType,
      targetId: req.body.targetId,
      requestedLevel: req.body.requestedLevel,
      requestedBy: req.body.requestedBy,
      requestedByName: req.body.requestedByName,
      requestReason: req.body.requestReason,
      deadlineAt: req.body.deadlineAt
    });

    // 트리거 발동
    await services.triggerService.fireTriggers(req.body.eventId, 'approval_request', {
      label: req.body.targetLabel || 'Unknown',
      requestedBy: req.body.requestedByName,
      reason: req.body.requestReason
    });

    res.status(201).json({ success: true, data: approval });
  } catch (error) {
    console.error('Approval request failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 대기 중인 승인 목록
router.get('/approvals/pending', async (req, res) => {
  try {
    const approvals = await services.approvalService.getPendingApprovals(
      req.query.event_id,
      {
        targetType: req.query.target_type,
        level: req.query.level
      }
    );

    res.json({ success: true, data: approvals, count: approvals.length });
  } catch (error) {
    console.error('Pending approvals failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 승인 처리
router.post('/approvals/:id/approve', async (req, res) => {
  try {
    const approval = await services.approvalService.approve(req.params.id, {
      decidedBy: req.body.decidedBy,
      decidedByName: req.body.decidedByName,
      decisionReason: req.body.decisionReason
    });

    // 감사 로그
    await services.auditService.log({
      eventId: approval.event_id,
      actorId: req.body.decidedBy,
      actorName: req.body.decidedByName,
      action: 'APPROVE',
      objectType: approval.target_type,
      objectId: approval.target_id,
      afterValue: { decision: 'APPROVED', reason: req.body.decisionReason }
    });

    res.json({ success: true, data: approval });
  } catch (error) {
    console.error('Approval approve failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 반려 처리
router.post('/approvals/:id/reject', async (req, res) => {
  try {
    const approval = await services.approvalService.reject(req.params.id, {
      decidedBy: req.body.decidedBy,
      decidedByName: req.body.decidedByName,
      decisionReason: req.body.decisionReason
    });

    // 감사 로그
    await services.auditService.log({
      eventId: approval.event_id,
      actorId: req.body.decidedBy,
      actorName: req.body.decidedByName,
      action: 'REJECT',
      objectType: approval.target_type,
      objectId: approval.target_id,
      afterValue: { decision: 'REJECTED', reason: req.body.decisionReason }
    });

    res.json({ success: true, data: approval });
  } catch (error) {
    console.error('Approval reject failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 승인 이력
router.get('/approvals/history', async (req, res) => {
  try {
    const history = await services.approvalService.getApprovalHistory(
      req.query.event_id,
      {
        status: req.query.status,
        limit: parseInt(req.query.limit, 10) || 50,
        offset: parseInt(req.query.offset, 10) || 0
      }
    );

    res.json({ success: true, data: history, count: history.length });
  } catch (error) {
    console.error('Approval history failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// Reports & Audit
// ═══════════════════════════════════════════════════════════

// KPI 리포트
router.get('/reports/kpi-onepage', async (req, res) => {
  try {
    const report = await services.reportService.generateKpiReport(req.query.event_id);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('KPI report failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// KPI 스냅샷 저장
router.post('/reports/kpi-snapshot', async (req, res) => {
  try {
    const snapshot = await services.reportService.saveKpiSnapshot(req.body.eventId);
    res.json({ success: true, data: snapshot });
  } catch (error) {
    console.error('KPI snapshot failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// KPI 이력
router.get('/reports/kpi-history', async (req, res) => {
  try {
    const history = await services.reportService.getKpiHistory(req.query.event_id, {
      days: parseInt(req.query.days, 10) || 30
    });
    res.json({ success: true, data: history, count: history.length });
  } catch (error) {
    console.error('KPI history failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 감사 로그 조회
router.get('/audit', async (req, res) => {
  try {
    const logs = await services.auditService.getLogs(req.query.event_id, {
      action: req.query.action,
      objectType: req.query.object_type,
      actorId: req.query.actor_id,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
      limit: parseInt(req.query.limit, 10) || 100,
      offset: parseInt(req.query.offset, 10) || 0
    });

    res.json({ success: true, data: logs, count: logs.length });
  } catch (error) {
    console.error('Audit log failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 감사 로그 Export
router.get('/audit/export', async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const eventId = req.query.event_id;

    if (format === 'csv') {
      const csv = await services.auditService.exportToCsv(eventId, {
        startDate: req.query.start_date,
        endDate: req.query.end_date
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-log-${eventId}.csv`);
      res.send(csv);
    } else {
      const json = await services.auditService.exportToJson(eventId, {
        startDate: req.query.start_date,
        endDate: req.query.end_date
      });
      res.json(json);
    }
  } catch (error) {
    console.error('Audit export failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// Triggers (트리거)
// ═══════════════════════════════════════════════════════════

// 트리거 생성
router.post('/triggers', async (req, res) => {
  try {
    const trigger = await services.triggerService.createTrigger({
      eventId: req.body.eventId,
      triggerType: req.body.triggerType,
      triggerCondition: req.body.triggerCondition,
      actionType: req.body.actionType,
      actionChannel: req.body.actionChannel,
      actionTemplate: req.body.actionTemplate,
      isActive: req.body.isActive,
      createdBy: req.body.createdBy
    });

    res.status(201).json({ success: true, data: trigger });
  } catch (error) {
    console.error('Trigger creation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 트리거 목록
router.get('/triggers', async (req, res) => {
  try {
    const triggers = await services.triggerService.listTriggers(req.query.event_id, {
      triggerType: req.query.trigger_type,
      isActive: req.query.is_active === 'true' ? true :
                req.query.is_active === 'false' ? false : undefined
    });

    res.json({ success: true, data: triggers, count: triggers.length });
  } catch (error) {
    console.error('Trigger list failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 트리거 수정
router.patch('/triggers/:id', async (req, res) => {
  try {
    const trigger = await services.triggerService.updateTrigger(req.params.id, req.body);
    res.json({ success: true, data: trigger });
  } catch (error) {
    console.error('Trigger update failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 트리거 삭제
router.delete('/triggers/:id', async (req, res) => {
  try {
    const deleted = await services.triggerService.deleteTrigger(req.params.id);
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Trigger delete failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 트리거 수동 실행 (테스트용)
router.post('/triggers/:id/execute', async (req, res) => {
  try {
    const result = await services.triggerService.executeTrigger(req.params.id, req.body.payload || {});
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Trigger execute failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// Partners (협력업체)
// ═══════════════════════════════════════════════════════════

// 협력업체 등록
router.post('/partners', async (req, res) => {
  try {
    const partner = await services.partnerService.createPartner({
      eventId: req.body.eventId,
      partnerName: req.body.partnerName,
      partnerRole: req.body.partnerRole,
      contactName: req.body.contactName,
      contactPhone: req.body.contactPhone,
      contactEmail: req.body.contactEmail,
      slaTerms: req.body.slaTerms,
      contractStart: req.body.contractStart,
      contractEnd: req.body.contractEnd,
      metadata: req.body.metadata
    });

    res.status(201).json({ success: true, data: partner });
  } catch (error) {
    console.error('Partner creation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 협력업체 목록
router.get('/partners', async (req, res) => {
  try {
    const partners = await services.partnerService.listPartners(req.query.event_id, {
      role: req.query.role,
      isActive: req.query.is_active !== 'false'
    });

    res.json({ success: true, data: partners, count: partners.length });
  } catch (error) {
    console.error('Partner list failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 협력업체 수정
router.patch('/partners/:id', async (req, res) => {
  try {
    const partner = await services.partnerService.updatePartner(req.params.id, req.body);
    res.json({ success: true, data: partner });
  } catch (error) {
    console.error('Partner update failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 협력업체 삭제
router.delete('/partners/:id', async (req, res) => {
  try {
    const deleted = await services.partnerService.deletePartner(req.params.id);
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Partner delete failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 연락처 Export
router.get('/partners/export-contacts', async (req, res) => {
  try {
    const csv = await services.partnerService.exportContactList(req.query.event_id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=contacts-${req.query.event_id}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Contact export failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// MICE 인센티브 결과보고 (v1)
// ═══════════════════════════════════════════════════════════

// MICE 서비스 가용성 체크 미들웨어
function requireMiceServices(req, res, next) {
  if (!services.miceService || !services.miceReportService) {
    return res.status(503).json({
      success: false,
      error: 'mice_service_unavailable',
      message: 'MICE 서비스가 로드되지 않았습니다 (마이그레이션 필요)'
    });
  }
  next();
}

// ─────────────────────────────────────────────────────────────
// 참가자 등록부 (Participants)
// ─────────────────────────────────────────────────────────────

router.post('/mice/participants', requireMiceServices, async (req, res) => {
  try {
    const participant = await services.miceService.createParticipant({
      eventId: req.body.eventId,
      regType: req.body.regType,
      orgName: req.body.orgName,
      personName: req.body.personName,
      email: req.body.email,
      phone: req.body.phone,
      nationality: req.body.nationality,
      isForeign: req.body.isForeign,
      feePaidAmount: req.body.feePaidAmount,
      depositDate: req.body.depositDate,
      notes: req.body.notes
    });
    res.status(201).json({ success: true, data: participant });
  } catch (error) {
    console.error('Participant creation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/mice/participants', requireMiceServices, async (req, res) => {
  try {
    const participants = await services.miceService.listParticipants(
      req.query.event_id,
      { regType: req.query.reg_type }
    );
    res.json({ success: true, data: participants, count: participants.length });
  } catch (error) {
    console.error('Participant list failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/mice/participants/stats', requireMiceServices, async (req, res) => {
  try {
    const stats = await services.miceService.getParticipantStats(req.query.event_id);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Participant stats failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/mice/participants/bulk', requireMiceServices, async (req, res) => {
  try {
    const results = await services.miceService.bulkCreateParticipants(
      req.body.eventId,
      req.body.participants
    );
    res.status(201).json({ success: true, data: results, count: results.length });
  } catch (error) {
    console.error('Bulk participant creation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/mice/participants/:id', requireMiceServices, async (req, res) => {
  try {
    const deleted = await services.miceService.deleteParticipant(req.params.id);
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Participant delete failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 숙박확인서 (Stays)
// ─────────────────────────────────────────────────────────────

router.post('/mice/stays', requireMiceServices, async (req, res) => {
  try {
    const stay = await services.miceService.createStay({
      eventId: req.body.eventId,
      hotelName: req.body.hotelName,
      checkinDate: req.body.checkinDate,
      checkoutDate: req.body.checkoutDate,
      nights: req.body.nights,
      guestCountTotal: req.body.guestCountTotal,
      guestCountForeign: req.body.guestCountForeign,
      roomsCount: req.body.roomsCount,
      receiptAssetId: req.body.receiptAssetId,
      notes: req.body.notes
    });
    res.status(201).json({ success: true, data: stay });
  } catch (error) {
    console.error('Stay creation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/mice/stays', requireMiceServices, async (req, res) => {
  try {
    const stays = await services.miceService.listStays(req.query.event_id);
    res.json({ success: true, data: stays, count: stays.length });
  } catch (error) {
    console.error('Stay list failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/mice/stays/stats', requireMiceServices, async (req, res) => {
  try {
    const stats = await services.miceService.getStayStats(req.query.event_id);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Stay stats failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/mice/stays/:id', requireMiceServices, async (req, res) => {
  try {
    const deleted = await services.miceService.deleteStay(req.params.id);
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Stay delete failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 지출증빙 (Expenses)
// ─────────────────────────────────────────────────────────────

router.post('/mice/expenses', requireMiceServices, async (req, res) => {
  try {
    const expense = await services.miceService.createExpense({
      eventId: req.body.eventId,
      category: req.body.category,
      description: req.body.description,
      vendorName: req.body.vendorName,
      vendorIsLocal: req.body.vendorIsLocal,
      vendorBizRegNo: req.body.vendorBizRegNo,
      amount: req.body.amount,
      payMethod: req.body.payMethod,
      paidAt: req.body.paidAt,
      evidenceAssets: req.body.evidenceAssets,
      isValid: req.body.isValid,
      validationNotes: req.body.validationNotes,
      notes: req.body.notes
    });
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    console.error('Expense creation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/mice/expenses', requireMiceServices, async (req, res) => {
  try {
    const expenses = await services.miceService.listExpenses(
      req.query.event_id,
      { category: req.query.category }
    );
    res.json({ success: true, data: expenses, count: expenses.length });
  } catch (error) {
    console.error('Expense list failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/mice/expenses/stats', requireMiceServices, async (req, res) => {
  try {
    const stats = await services.miceService.getExpenseStats(req.query.event_id);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Expense stats failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/mice/expenses/:id', requireMiceServices, async (req, res) => {
  try {
    const deleted = await services.miceService.deleteExpense(req.params.id);
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Expense delete failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 사진대장 (Photos)
// ─────────────────────────────────────────────────────────────

router.post('/mice/photos', requireMiceServices, async (req, res) => {
  try {
    const photo = await services.miceService.createPhoto({
      eventId: req.body.eventId,
      photoAssetId: req.body.photoAssetId,
      tag: req.body.tag,
      description: req.body.description,
      takenAt: req.body.takenAt,
      location: req.body.location,
      sortOrder: req.body.sortOrder
    });
    res.status(201).json({ success: true, data: photo });
  } catch (error) {
    console.error('Photo creation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/mice/photos', requireMiceServices, async (req, res) => {
  try {
    const photos = await services.miceService.listPhotos(
      req.query.event_id,
      { tag: req.query.tag }
    );
    res.json({ success: true, data: photos, count: photos.length });
  } catch (error) {
    console.error('Photo list failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/mice/photos/stats', requireMiceServices, async (req, res) => {
  try {
    const stats = await services.miceService.getPhotoStats(req.query.event_id);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Photo stats failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/mice/photos/:id', requireMiceServices, async (req, res) => {
  try {
    const deleted = await services.miceService.deletePhoto(req.params.id);
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Photo delete failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 설문 (Survey)
// ─────────────────────────────────────────────────────────────

router.post('/mice/survey', requireMiceServices, async (req, res) => {
  try {
    const response = await services.miceService.createSurveyResponse({
      eventId: req.body.eventId,
      respondentType: req.body.respondentType,
      respondentName: req.body.respondentName,
      respondentOrg: req.body.respondentOrg,
      answers: req.body.answers
    });
    res.status(201).json({ success: true, data: response });
  } catch (error) {
    console.error('Survey response creation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/mice/survey', requireMiceServices, async (req, res) => {
  try {
    const responses = await services.miceService.listSurveyResponses(req.query.event_id);
    res.json({ success: true, data: responses, count: responses.length });
  } catch (error) {
    console.error('Survey list failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 에셋 업로드 (Assets)
// ─────────────────────────────────────────────────────────────

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 업로드 디렉토리 설정
const uploadDir = path.join(process.cwd(), 'output', 'mice-assets');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const eventDir = path.join(uploadDir, req.body.eventId || 'unknown');
    if (!fs.existsSync(eventDir)) {
      fs.mkdirSync(eventDir, { recursive: true });
    }
    cb(null, eventDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error('지원하지 않는 파일 형식입니다'));
  }
});

router.post('/assets/upload', requireMiceServices, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '파일이 필요합니다' });
    }

    const asset = await services.miceService.createAsset({
      eventId: req.body.eventId,
      kind: req.body.kind || 'ETC',
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      storagePath: req.file.path,
      metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {},
      uploadedBy: req.body.uploadedBy
    });

    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    console.error('Asset upload failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/assets', requireMiceServices, async (req, res) => {
  try {
    const assets = await services.miceService.listAssets(
      req.query.event_id,
      { kind: req.query.kind }
    );
    res.json({ success: true, data: assets, count: assets.length });
  } catch (error) {
    console.error('Asset list failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/assets/:id', requireMiceServices, async (req, res) => {
  try {
    const asset = await services.miceService.getAsset(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }
    res.json({ success: true, data: asset });
  } catch (error) {
    console.error('Asset get failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 결과보고 패키지 (Report)
// ─────────────────────────────────────────────────────────────

router.get('/mice/report/checklist', requireMiceServices, async (req, res) => {
  try {
    const checklist = await services.miceReportService.getChecklist(req.query.event_id);
    res.json({ success: true, data: checklist });
  } catch (error) {
    console.error('Checklist failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/mice/report/generate', requireMiceServices, async (req, res) => {
  try {
    const result = await services.miceReportService.generateReportPack(
      req.body.eventId,
      { generatedBy: req.body.generatedBy }
    );
    res.json({
      success: true,
      data: {
        packId: result.packId,
        downloadUrl: `/api/ops-center/mice/report/download/${result.packId}`,
        zipFilename: result.zipFilename,
        zipSize: result.zipSize,
        includedFiles: result.includedFiles,
        checklist: result.checklist
      }
    });
  } catch (error) {
    console.error('Report generation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/mice/report/download/:packId', requireMiceServices, async (req, res) => {
  try {
    const pack = await services.miceReportService.getReportPack(req.params.packId);
    if (!pack) {
      return res.status(404).json({ success: false, error: 'Report pack not found' });
    }

    if (pack.status !== 'READY') {
      return res.status(400).json({
        success: false,
        error: 'Report not ready',
        status: pack.status
      });
    }

    if (!fs.existsSync(pack.zip_path)) {
      return res.status(404).json({ success: false, error: 'ZIP file not found' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(pack.zip_filename)}"`);
    res.setHeader('Content-Length', pack.zip_size_bytes);

    const fileStream = fs.createReadStream(pack.zip_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Report download failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/mice/report/packs', requireMiceServices, async (req, res) => {
  try {
    const packs = await services.miceReportService.listReportPacks(req.query.event_id);
    res.json({ success: true, data: packs, count: packs.length });
  } catch (error) {
    console.error('Report packs list failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
