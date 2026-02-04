/**
 * reportService.js
 * KPI 리포트 서비스
 *
 * 핵심 KPI:
 * - 승인 리드타임 (avg, median)
 * - SSOT 항목 상태별 수
 * - 변경 횟수
 * - 일일 활동량
 */

const db = require('../../database/db');
const ssotService = require('./ssotService');
const approvalService = require('./approvalService');
const auditService = require('./auditService');

/**
 * KPI 원페이지 리포트 생성
 */
async function generateKpiReport(eventId) {
  const [ssotStats, approvalStats, auditStats, categoryStats, recentActivity] = await Promise.all([
    ssotService.getStats(eventId),
    approvalService.getApprovalStats(eventId),
    auditService.getStats(eventId),
    ssotService.getCategoryStats(eventId),
    auditService.getRecentActivity(eventId, { limit: 5 })
  ]);

  // 이벤트 정보
  const eventResult = await db.query(
    `SELECT * FROM ops_events WHERE id = $1`,
    [eventId]
  );
  const event = eventResult.rows[0];

  // 일별 활동
  const dailyActivity = await auditService.getDailyActivity(eventId, { days: 7 });

  return {
    generatedAt: new Date().toISOString(),
    event: {
      id: event.id,
      name: event.name,
      status: event.status,
      periodStart: event.period_start,
      periodEnd: event.period_end
    },
    kpi: {
      ssot: {
        totalItems: parseInt(ssotStats.total_items, 10),
        approvedCount: parseInt(ssotStats.approved_count, 10),
        pendingCount: parseInt(ssotStats.pending_count, 10),
        rejectedCount: parseInt(ssotStats.rejected_count, 10),
        draftCount: parseInt(ssotStats.draft_count, 10),
        approvalRate: ssotStats.total_items > 0
          ? ((parseInt(ssotStats.approved_count, 10) / parseInt(ssotStats.total_items, 10)) * 100).toFixed(1)
          : '0'
      },
      approval: {
        totalRequests: approvalStats.totalRequests,
        pendingCount: approvalStats.pendingCount,
        approvedCount: approvalStats.approvedCount,
        rejectedCount: approvalStats.rejectedCount,
        avgLeadtimeHours: approvalStats.avgLeadtimeHours,
        medianLeadtimeHours: approvalStats.medianLeadtimeHours,
        approvalRate: approvalStats.totalRequests > 0
          ? ((approvalStats.approvedCount / (approvalStats.approvedCount + approvalStats.rejectedCount)) * 100).toFixed(1)
          : '0'
      },
      activity: {
        totalActions: auditStats.total,
        uniqueActors: auditStats.uniqueActors,
        byAction: auditStats.byAction,
        byObjectType: auditStats.byObjectType
      }
    },
    breakdown: {
      byCategory: categoryStats,
      dailyActivity: dailyActivity
    },
    recentActivity: recentActivity.map(a => ({
      timestamp: a.created_at,
      actor: a.actor_name,
      action: a.action,
      objectType: a.object_type,
      objectLabel: a.object_label
    }))
  };
}

/**
 * KPI 스냅샷 저장
 */
async function saveKpiSnapshot(eventId) {
  const report = await generateKpiReport(eventId);

  const kpiData = {
    ssot_items_count: report.kpi.ssot.totalItems,
    approved_count: report.kpi.ssot.approvedCount,
    pending_count: report.kpi.ssot.pendingCount,
    rejected_count: report.kpi.ssot.rejectedCount,
    avg_approval_leadtime_hours: report.kpi.approval.avgLeadtimeHours,
    median_approval_leadtime_hours: report.kpi.approval.medianLeadtimeHours,
    total_audit_actions: report.kpi.activity.totalActions,
    unique_actors: report.kpi.activity.uniqueActors,
    approval_rate: report.kpi.ssot.approvalRate
  };

  const result = await db.query(
    `INSERT INTO ops_kpi_snapshots (event_id, snapshot_date, kpi_data)
     VALUES ($1, CURRENT_DATE, $2)
     ON CONFLICT (event_id, snapshot_date)
     DO UPDATE SET kpi_data = $2
     RETURNING *`,
    [eventId, JSON.stringify(kpiData)]
  );

  return result.rows[0];
}

/**
 * KPI 스냅샷 이력 조회
 */
async function getKpiHistory(eventId, { days = 30 } = {}) {
  const result = await db.query(
    `SELECT * FROM ops_kpi_snapshots
     WHERE event_id = $1
       AND snapshot_date >= CURRENT_DATE - INTERVAL '${days} days'
     ORDER BY snapshot_date DESC`,
    [eventId]
  );

  return result.rows;
}

/**
 * KPI 트렌드 분석
 */
async function getKpiTrend(eventId, { metric, days = 14 } = {}) {
  const history = await getKpiHistory(eventId, { days });

  if (history.length < 2) {
    return { trend: 'INSUFFICIENT_DATA', data: history };
  }

  const values = history.map(h => {
    const data = typeof h.kpi_data === 'string' ? JSON.parse(h.kpi_data) : h.kpi_data;
    return parseFloat(data[metric] || 0);
  });

  // 최근 값과 이전 평균 비교
  const recent = values[0];
  const previousAvg = values.slice(1).reduce((a, b) => a + b, 0) / (values.length - 1);

  let trend = 'STABLE';
  const changePercent = previousAvg > 0 ? ((recent - previousAvg) / previousAvg) * 100 : 0;

  if (changePercent > 10) trend = 'UP';
  else if (changePercent < -10) trend = 'DOWN';

  return {
    trend,
    changePercent: changePercent.toFixed(1),
    recent,
    previousAvg: previousAvg.toFixed(2),
    data: history.map(h => ({
      date: h.snapshot_date,
      value: typeof h.kpi_data === 'string'
        ? JSON.parse(h.kpi_data)[metric]
        : h.kpi_data[metric]
    }))
  };
}

/**
 * 리포트 Export (JSON)
 */
async function exportReportJson(eventId) {
  const report = await generateKpiReport(eventId);
  return report;
}

/**
 * 리포트 Export (CSV)
 */
async function exportReportCsv(eventId) {
  const report = await generateKpiReport(eventId);

  const lines = [
    `"여수여행센터 운영 KPI 리포트"`,
    `"생성일시","${report.generatedAt}"`,
    `"행사명","${report.event.name}"`,
    `"행사 기간","${report.event.periodStart} ~ ${report.event.periodEnd}"`,
    `"행사 상태","${report.event.status}"`,
    `""`,
    `"=== SSOT 현황 ==="`,
    `"전체 항목 수",${report.kpi.ssot.totalItems}`,
    `"승인됨",${report.kpi.ssot.approvedCount}`,
    `"승인 대기",${report.kpi.ssot.pendingCount}`,
    `"반려됨",${report.kpi.ssot.rejectedCount}`,
    `"작성중",${report.kpi.ssot.draftCount}`,
    `"승인률",${report.kpi.ssot.approvalRate}%`,
    `""`,
    `"=== 승인 현황 ==="`,
    `"전체 요청 수",${report.kpi.approval.totalRequests}`,
    `"대기 중",${report.kpi.approval.pendingCount}`,
    `"승인됨",${report.kpi.approval.approvedCount}`,
    `"반려됨",${report.kpi.approval.rejectedCount}`,
    `"평균 승인 리드타임(시간)",${report.kpi.approval.avgLeadtimeHours || 'N/A'}`,
    `"중앙값 승인 리드타임(시간)",${report.kpi.approval.medianLeadtimeHours || 'N/A'}`,
    `""`,
    `"=== 활동 현황 ==="`,
    `"총 활동 수",${report.kpi.activity.totalActions}`,
    `"활동 사용자 수",${report.kpi.activity.uniqueActors}`
  ];

  return lines.join('\n');
}

/**
 * 요약 텍스트 생성 (Slack 알림용)
 */
async function generateSummaryText(eventId) {
  const report = await generateKpiReport(eventId);

  const text = `
📊 *${report.event.name}* 운영 현황

🗂️ *SSOT*
• 전체: ${report.kpi.ssot.totalItems}건
• 승인됨: ${report.kpi.ssot.approvedCount}건 (${report.kpi.ssot.approvalRate}%)
• 승인 대기: ${report.kpi.ssot.pendingCount}건

⏱️ *승인 리드타임*
• 평균: ${report.kpi.approval.avgLeadtimeHours || '-'}시간
• 중앙값: ${report.kpi.approval.medianLeadtimeHours || '-'}시간

📈 *활동*
• 총 ${report.kpi.activity.totalActions}건
• ${report.kpi.activity.uniqueActors}명 참여
`.trim();

  return text;
}

module.exports = {
  generateKpiReport,
  saveKpiSnapshot,
  getKpiHistory,
  getKpiTrend,
  exportReportJson,
  exportReportCsv,
  generateSummaryText
};
