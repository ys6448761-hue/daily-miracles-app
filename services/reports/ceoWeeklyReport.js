/**
 * ceoWeeklyReport.js v1.0
 *
 * CEO 주간 리포트 자동 생성 서비스
 *
 * 기능:
 * - 매주 월요일 09:00 (KST) 자동 실행
 * - 지난 7일 데이터 집계
 * - 핵심 6지표 + 경고TOP3 + 성과TOP3
 * - JSON + Markdown 저장
 * - CEO/코미 알림
 *
 * @version 1.0.0
 * @date 2026-01-03
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

// ===== 이벤트 버스 =====
const reportEvents = new EventEmitter();

// ===== 설정 =====
const CONFIG = {
  dbDir: path.join(__dirname, '..', '..', 'data', 'debates'),
  reportsDir: path.join(__dirname, '..', '..', 'docs', 'reports'),
  dataReportsDir: path.join(__dirname, '..', '..', 'data', 'reports'),
  timezone: 'Asia/Seoul',  // KST
  scheduleDay: 1,  // 월요일 (0=일, 1=월, ...)
  scheduleHour: 9,  // 09:00
  scheduleMinute: 0
};

// 디렉토리 생성 (서버리스 환경에서는 skip)
if (!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)) {
  [CONFIG.reportsDir, CONFIG.dataReportsDir].forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      console.warn(`[ceoWeeklyReport] 디렉토리 생성 실패: ${dir}`, err.message);
    }
  });
}

// ===== 유틸리티 함수 =====

/**
 * KST 기준 현재 시간 반환
 */
function getNowKST() {
  const now = new Date();
  // KST = UTC + 9
  return new Date(now.getTime() + (9 * 60 * 60 * 1000));
}

/**
 * A안: 직전 주간(월~일) 기간 계산 (KST)
 * @returns {{ start: Date, end: Date, weekNumber: number }}
 */
function computeWeekPeriod(referenceDate = null) {
  const now = referenceDate || getNowKST();

  // 이번 주 월요일 00:00 (KST)
  const thisMonday = new Date(now);
  const dayOfWeek = thisMonday.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  thisMonday.setDate(thisMonday.getDate() - daysToMonday);
  thisMonday.setHours(0, 0, 0, 0);

  // 지난 주 월요일 00:00 (KST)
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);

  // 지난 주 일요일 23:59:59 (KST)
  const lastSunday = new Date(thisMonday);
  lastSunday.setMilliseconds(-1);

  // 주차 계산 (ISO 8601)
  const startOfYear = new Date(lastMonday.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((lastMonday - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);

  return {
    start: lastMonday,
    end: lastSunday,
    weekNumber,
    year: lastMonday.getFullYear(),
    periodLabel: `${lastMonday.toISOString().split('T')[0]} ~ ${lastSunday.toISOString().split('T')[0]}`
  };
}

/**
 * JSON DB 로드
 */
function loadJsonDB(tableName) {
  const filePath = path.join(CONFIG.dbDir, `${tableName}.json`);
  if (!fs.existsSync(filePath)) return [];

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`[Report] ${tableName}.json 로드 실패:`, e.message);
    return [];
  }
}

/**
 * 기간 내 레코드 필터링
 */
function filterByPeriod(records, period, dateField = 'created_at') {
  return records.filter(r => {
    if (!r[dateField]) return false;
    const recordDate = new Date(r[dateField]);
    return recordDate >= period.start && recordDate <= period.end;
  });
}

// ===== 집계 함수 =====

/**
 * 핵심 6지표 집계
 */
function aggregateWeeklyMetrics(period) {
  const debates = loadJsonDB('debates');
  const decisions = loadJsonDB('decisions');
  const actions = loadJsonDB('actions');
  const reviewQueue = loadJsonDB('review_queue');

  // 기간 내 데이터
  const periodDebates = filterByPeriod(debates, period);
  const periodDecisions = filterByPeriod(decisions, period);
  const periodActions = filterByPeriod(actions, period);
  const periodReviews = filterByPeriod(reviewQueue, period);

  // 1. 토론 수
  const totalDebates = periodDebates.length;

  // 2. 승인/보류/반려
  const approvedDecisions = periodDecisions.filter(d =>
    d.status === 'approved' || d.decision === 'Go' || d.decision === 'Conditional Go'
  ).length;
  const pendingDecisions = periodDecisions.filter(d =>
    d.status === 'pending_approval' || d.status === 'pending'
  ).length;
  const rejectedDecisions = periodDecisions.filter(d =>
    d.status === 'rejected' || d.decision === 'No Go'
  ).length;

  // 3. RED/YELLOW 건수
  const redCount = periodDebates.filter(d => d.safety_label === 'RED').length;
  const yellowCount = periodDebates.filter(d => d.safety_label === 'YELLOW').length;

  // 4. P0 액션 완료율
  const p0Actions = periodActions.filter(a => a.priority === 'P0');
  const p0Done = p0Actions.filter(a => a.status === 'DONE').length;
  const p0CompletionRate = p0Actions.length > 0
    ? Math.round((p0Done / p0Actions.length) * 100)
    : 0;

  // 5. 지연 액션 수 (기한 초과)
  const now = new Date();
  const overdueActions = actions.filter(a => {
    if (a.status === 'DONE') return false;
    if (!a.deadline) return false;
    return new Date(a.deadline) < now;
  });

  // 6. Review 대기 건수
  const pendingReviews = reviewQueue.filter(r => r.status === 'PENDING').length;

  return {
    period: period.periodLabel,
    totalDebates,
    decisions: {
      approved: approvedDecisions,
      pending: pendingDecisions,
      rejected: rejectedDecisions
    },
    safety: {
      red: redCount,
      yellow: yellowCount,
      green: totalDebates - redCount - yellowCount
    },
    actions: {
      p0Total: p0Actions.length,
      p0Done,
      p0CompletionRate: `${p0CompletionRate}%`,
      overdueCount: overdueActions.length
    },
    reviewPending: pendingReviews
  };
}

/**
 * 경고등 TOP3 선정
 */
function selectWarningTop3() {
  const actions = loadJsonDB('actions');
  const reviewQueue = loadJsonDB('review_queue');
  const now = new Date();
  const warnings = [];

  // 1. P0 + overdue
  actions.forEach(a => {
    if (a.priority === 'P0' && a.status !== 'DONE' && a.deadline) {
      const deadline = new Date(a.deadline);
      if (deadline < now) {
        const delayHours = Math.round((now - deadline) / (1000 * 60 * 60));
        warnings.push({
          type: 'P0_OVERDUE',
          severity: 'CRITICAL',
          title: `P0 지연: ${a.task}`,
          impact: `${delayHours}시간 초과`,
          cause: a.blocked_reason || '원인 미지정',
          action: `${a.assignee} 즉시 완료 또는 에스컬레이션`,
          link: `/api/debate/actions/${a.id}`,
          score: 100 + delayHours  // 점수 높을수록 심각
        });
      }
    }
  });

  // 2. BLOCKED 48h 이상
  actions.forEach(a => {
    if (a.status === 'BLOCKED' && a.updated_at) {
      const blockedSince = new Date(a.updated_at);
      const blockedHours = Math.round((now - blockedSince) / (1000 * 60 * 60));
      if (blockedHours >= 48) {
        warnings.push({
          type: 'BLOCKED_48H',
          severity: 'HIGH',
          title: `48h+ 차단: ${a.task}`,
          impact: `${blockedHours}시간 차단 지속`,
          cause: a.blocked_reason || '원인 미지정',
          action: '구조적 병목 해소 필요',
          link: `/api/debate/actions/${a.id}`,
          score: 80 + blockedHours
        });
      }
    }
  });

  // 3. RED Review PENDING
  reviewQueue.forEach(r => {
    if (r.status === 'PENDING') {
      const createdAt = new Date(r.created_at);
      const waitingHours = Math.round((now - createdAt) / (1000 * 60 * 60));
      warnings.push({
        type: 'REVIEW_PENDING',
        severity: 'HIGH',
        title: `RED 검토 대기: ${r.topic}`,
        impact: `${waitingHours}시간 대기 중`,
        cause: r.reason,
        action: '코미/여의보주 즉시 검토',
        link: r.review_link,
        score: 70 + waitingHours
      });
    }
  });

  // 점수순 정렬 후 TOP 3
  return warnings.sort((a, b) => b.score - a.score).slice(0, 3);
}

/**
 * 성과 TOP3 선정
 */
function selectAchievementTop3(period) {
  const actions = loadJsonDB('actions');
  const decisions = loadJsonDB('decisions');
  const achievements = [];

  // 1. P0 완료
  const periodActions = filterByPeriod(actions, period, 'completed_at');
  periodActions.forEach(a => {
    if (a.priority === 'P0' && a.status === 'DONE') {
      achievements.push({
        type: 'P0_COMPLETED',
        title: `P0 완료: ${a.task}`,
        assignee: a.assignee,
        completedAt: a.completed_at,
        link: `/api/debate/actions/${a.id}`,
        score: 100
      });
    }
  });

  // 2. 승인된 Decision
  const periodDecisions = filterByPeriod(decisions, period);
  periodDecisions.forEach(d => {
    if (d.decision === 'Go' || d.decision === 'Conditional Go' || d.status === 'approved') {
      achievements.push({
        type: 'DECISION_APPROVED',
        title: `결정 승인: ${d.title}`,
        summary: d.summary,
        link: `/api/debate/status/${d.debate_id}`,
        score: 80
      });
    }
  });

  return achievements.sort((a, b) => b.score - a.score).slice(0, 3);
}

/**
 * 다음 주 P0 선정
 */
function selectNextWeekP0() {
  const actions = loadJsonDB('actions');
  const now = new Date();
  const nextWeekEnd = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

  // P0 중 TODO/DOING이면서 다음 주 내 마감
  const nextP0 = actions.filter(a => {
    if (a.status === 'DONE' || a.status === 'BLOCKED') return false;
    if (a.priority !== 'P0') return false;
    if (!a.deadline) return true;  // 마감 없는 P0도 포함
    const deadline = new Date(a.deadline);
    return deadline <= nextWeekEnd;
  });

  return nextP0.slice(0, 3).map(a => ({
    id: a.id,
    task: a.task,
    assignee: a.assignee,
    deadline: a.deadline,
    link: `/api/debate/actions/${a.id}`
  }));
}

/**
 * 카테고리별 인사이트 생성
 */
function generateInsights(metrics, warnings, achievements) {
  const insights = [];

  // 토론 활동 인사이트
  if (metrics.totalDebates > 0) {
    const safetyRate = Math.round((metrics.safety.green / metrics.totalDebates) * 100);
    insights.push(`토론 ${metrics.totalDebates}건 중 ${safetyRate}%가 안전 통과 (GREEN)`);
  } else {
    insights.push('이번 주 토론 없음 - 의사결정 필요 안건 점검 권장');
  }

  // 실행력 인사이트
  if (metrics.actions.p0Total > 0) {
    if (parseInt(metrics.actions.p0CompletionRate) >= 80) {
      insights.push(`P0 완료율 ${metrics.actions.p0CompletionRate} - 실행력 우수`);
    } else {
      insights.push(`P0 완료율 ${metrics.actions.p0CompletionRate} - 실행 가속 필요`);
    }
  }

  // 병목 인사이트
  if (warnings.length > 0) {
    const criticalCount = warnings.filter(w => w.severity === 'CRITICAL').length;
    if (criticalCount > 0) {
      insights.push(`CRITICAL 병목 ${criticalCount}건 - 즉시 조치 필요`);
    }
  } else {
    insights.push('주요 병목 없음 - 운영 안정');
  }

  return insights.slice(0, 3);
}

// ===== 리포트 포맷팅 =====

/**
 * CEO 리포트 마크다운 생성
 */
function formatCeoReportMarkdown(data) {
  const { period, metrics, warnings, achievements, nextP0, insights, generatedAt } = data;

  // 총평 1문장
  const summaryLine = metrics.totalDebates > 0
    ? `지난 주 ${metrics.totalDebates}건의 토론이 진행되었으며, P0 완료율은 ${metrics.actions.p0CompletionRate}입니다.`
    : '지난 주 신규 토론이 없습니다. 안건 검토가 필요합니다.';

  return `# CEO 주간 리포트

> **기간:** ${period.periodLabel}
> **생성일:** ${generatedAt}
> **총평:** ${summaryLine}

---

## 핵심 6지표

| 지표 | 값 | 상태 |
|------|-----|------|
| 토론 수 | ${metrics.totalDebates}건 | ${metrics.totalDebates > 0 ? '✅' : '⚠️'} |
| 결정 승인/보류/반려 | ${metrics.decisions.approved}/${metrics.decisions.pending}/${metrics.decisions.rejected} | ${metrics.decisions.rejected === 0 ? '✅' : '⚠️'} |
| RED/YELLOW | ${metrics.safety.red}/${metrics.safety.yellow}건 | ${metrics.safety.red === 0 ? '✅' : '🚨'} |
| P0 완료율 | ${metrics.actions.p0CompletionRate} | ${parseInt(metrics.actions.p0CompletionRate) >= 80 ? '✅' : '⚠️'} |
| 지연 액션 | ${metrics.actions.overdueCount}건 | ${metrics.actions.overdueCount === 0 ? '✅' : '🚨'} |
| Review 대기 | ${metrics.reviewPending}건 | ${metrics.reviewPending === 0 ? '✅' : '⚠️'} |

---

## 🚨 경고등 TOP3

${warnings.length > 0 ? warnings.map((w, i) => `
### ${i + 1}. [${w.severity}] ${w.title}

- **영향:** ${w.impact}
- **원인:** ${w.cause}
- **즉시 액션:** ${w.action}
- **링크:** ${w.link}
`).join('\n') : '경고 사항 없음 ✅'}

---

## ✅ 성과 TOP3

${achievements.length > 0 ? achievements.map((a, i) => `
### ${i + 1}. ${a.title}

- **담당:** ${a.assignee || 'N/A'}
- **링크:** ${a.link}
`).join('\n') : '이번 주 주요 성과 없음'}

---

## 📌 다음 주 P0 (최대 3개)

${nextP0.length > 0 ? nextP0.map((p, i) => `
${i + 1}. **${p.task}** - ${p.assignee} (기한: ${p.deadline || '미정'})
`).join('\n') : 'P0 예정 없음'}

---

## 💡 인사이트

${insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

---

## 링크 모음

- [Actions 전체](/api/debate/actions)
- [Review Queue](/api/debate/review)
- [토론 목록](/api/debate/list)

---

**CEO 액션:** ${warnings.length > 0 ? '경고 TOP3 확인 후 에스컬레이션 여부 결정' : '특별 조치 불필요'}

---

*🤖 Aurora 5 CEO Weekly Report v1.0*
*생성: ${generatedAt}*
`;
}

// ===== 저장 및 알림 =====

/**
 * 원자적 파일 저장
 */
function atomicWrite(filePath, content) {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tempPath, content, 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (e) {
    try { fs.unlinkSync(tempPath); } catch (ignore) {}
    throw e;
  }
}

/**
 * 리포트 저장 (MD + JSON)
 */
function saveReport(data) {
  const { period } = data;
  const fileBase = `CEO-WEEKLY-${period.year}-W${String(period.weekNumber).padStart(2, '0')}`;

  // Markdown 저장
  const mdPath = path.join(CONFIG.reportsDir, `${fileBase}.md`);
  const mdContent = formatCeoReportMarkdown(data);
  atomicWrite(mdPath, '\ufeff' + mdContent);  // BOM for UTF-8

  // JSON 저장
  const jsonPath = path.join(CONFIG.dataReportsDir, `${fileBase}.json`);
  const jsonContent = JSON.stringify(data, null, 2);
  atomicWrite(jsonPath, jsonContent);

  console.log(`📊 [Report] 저장 완료: ${mdPath}`);

  return { mdPath, jsonPath, fileBase };
}

// ===== 메인 생성 함수 =====

/**
 * CEO 주간 리포트 생성 (메인)
 */
function generateCeoWeeklyReport(referenceDate = null) {
  console.log('📊 [Report] CEO 주간 리포트 생성 시작...');
  const startTime = Date.now();

  try {
    // 1. 기간 계산
    const period = computeWeekPeriod(referenceDate);
    console.log(`   기간: ${period.periodLabel}`);

    // 2. 데이터 집계
    const metrics = aggregateWeeklyMetrics(period);

    // 3. TOP3 선정
    const warnings = selectWarningTop3();
    const achievements = selectAchievementTop3(period);
    const nextP0 = selectNextWeekP0();

    // 4. 인사이트 생성
    const insights = generateInsights(metrics, warnings, achievements);

    // 5. 리포트 데이터 조립
    const reportData = {
      period,
      metrics,
      warnings,
      achievements,
      nextP0,
      insights,
      generatedAt: new Date().toISOString()
    };

    // 6. 저장
    const files = saveReport(reportData);

    // 7. 이벤트 발행
    reportEvents.emit('CEO_REPORT_GENERATED', {
      ...files,
      period: period.periodLabel,
      warningsCount: warnings.length,
      summary: `토론 ${metrics.totalDebates}건, P0 완료율 ${metrics.actions.p0CompletionRate}`
    });

    const duration = Date.now() - startTime;
    console.log(`📊 [Report] 생성 완료 (${duration}ms)`);

    return {
      success: true,
      ...files,
      data: reportData,
      duration_ms: duration
    };

  } catch (error) {
    console.error('📊 [Report] 생성 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ===== 스케줄러 =====

let reportSchedulerInterval = null;

/**
 * 다음 월요일 09:00 KST까지 남은 ms 계산
 */
function getNextMondayMorningMs() {
  const now = getNowKST();
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;  // 다음 월요일

  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(CONFIG.scheduleHour, CONFIG.scheduleMinute, 0, 0);

  // 이미 지났으면 다음 주 월요일
  if (nextMonday <= now) {
    nextMonday.setDate(nextMonday.getDate() + 7);
  }

  return nextMonday.getTime() - now.getTime();
}

/**
 * 스케줄러 시작
 */
function startReportScheduler() {
  if (reportSchedulerInterval) return;

  const scheduleNext = () => {
    const msUntilNextRun = getNextMondayMorningMs();
    const nextRunDate = new Date(Date.now() + msUntilNextRun);

    console.log(`📊 [Scheduler] 다음 CEO 리포트: ${nextRunDate.toISOString()}`);

    reportSchedulerInterval = setTimeout(() => {
      generateCeoWeeklyReport();
      scheduleNext();  // 다음 주 예약
    }, msUntilNextRun);
  };

  scheduleNext();
  console.log('📊 [Scheduler] CEO 주간 리포트 스케줄러 시작');
}

/**
 * 스케줄러 중지
 */
function stopReportScheduler() {
  if (reportSchedulerInterval) {
    clearTimeout(reportSchedulerInterval);
    reportSchedulerInterval = null;
    console.log('📊 [Scheduler] CEO 주간 리포트 스케줄러 중지');
  }
}

// ===== 이벤트 핸들러 =====

reportEvents.on('CEO_REPORT_GENERATED', (data) => {
  console.log(`📊 [알림] CEO 주간 리포트 생성됨`);
  console.log(`   파일: ${data.mdPath}`);
  console.log(`   기간: ${data.period}`);
  console.log(`   경고: ${data.warningsCount}건`);
  console.log(`   요약: ${data.summary}`);
  // TODO: 실제 알림 발송 (Solapi 연동)
});

// ===== Export =====

module.exports = {
  generateCeoWeeklyReport,
  computeWeekPeriod,
  aggregateWeeklyMetrics,
  selectWarningTop3,
  selectAchievementTop3,
  selectNextWeekP0,
  startReportScheduler,
  stopReportScheduler,
  reportEvents
};
