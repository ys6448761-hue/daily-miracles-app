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
  res.json({
    success: true,
    service: 'yeosu-ops-center',
    version: 'v0.1.0',
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════
// Demo Reset (데모 초기화)
// ═══════════════════════════════════════════════════════════

/**
 * 데모 초기화 API
 * - 특정 행사의 SSOT 항목, 승인 요청, 감사 로그를 초기화
 * - 행사 자체는 유지됨
 * - 데모/시연용 (운영 환경에서는 주의해서 사용)
 */
router.post('/demo/reset/:eventId', async (req, res) => {
  try {
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

module.exports = router;
