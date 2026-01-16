/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Ops Agent Service - 운영 감시 에이전트
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 6개 Watcher 모듈로 시스템 상태를 자동 점검
 *
 * Watchers:
 *   1. TokenWatcher - API 토큰 상태
 *   2. PaymentWatcher - 결제 시스템 상태
 *   3. MessagingWatcher - 메시징 시스템 상태
 *   4. DeployWatcher - 배포/서버 상태
 *   5. AnalyticsWatcher - GA4 분석 상태
 *   6. SiteWatcher - 사이트/링크 상태
 *
 * 설계: 루미 분석 기반
 * 승인: 코미 (DEC-006)
 * 작성일: 2026-01-15
 * ═══════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs').promises;
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// 상수 정의
// ═══════════════════════════════════════════════════════════════════════════

const STATUS = {
  OK: '🟢',
  WARN: '🟡',
  FAIL: '🔴'
};

const CHECK_RESULT = {
  OK: 'OK',
  WARN: 'WARN',
  FAIL: 'FAIL'
};

// ═══════════════════════════════════════════════════════════════════════════
// 1. TokenWatcher - API 토큰 상태 체크
// ═══════════════════════════════════════════════════════════════════════════

async function checkTokens() {
  const checks = {};

  // T1: OpenAI API 키 존재
  checks.T1_openai_key = {
    name: 'OpenAI API 키 존재',
    ok: !!process.env.OPENAI_API_KEY,
    reason: process.env.OPENAI_API_KEY ? null : 'OPENAI_API_KEY 환경변수 누락'
  };

  // T2: OpenAI 호출 테스트 (간단히 키 형식만 체크, 실제 호출은 비용 발생)
  if (process.env.OPENAI_API_KEY) {
    const keyFormat = process.env.OPENAI_API_KEY.startsWith('sk-');
    checks.T2_openai_format = {
      name: 'OpenAI API 키 형식',
      ok: keyFormat,
      reason: keyFormat ? null : 'API 키 형식이 올바르지 않음 (sk-로 시작해야 함)'
    };
  } else {
    checks.T2_openai_format = {
      name: 'OpenAI API 키 형식',
      ok: false,
      reason: 'API 키 없음'
    };
  }

  // T3: SENS 설정 존재
  checks.T3_sens_key = {
    name: 'SENS API 키 존재',
    ok: !!process.env.SENS_ACCESS_KEY,
    reason: process.env.SENS_ACCESS_KEY ? null : 'SENS_ACCESS_KEY 환경변수 누락 (알림톡 발송 불가)'
  };

  // 전체 상태 결정
  const allOk = Object.values(checks).every(c => c.ok);
  const anyFail = !checks.T1_openai_key.ok || !checks.T2_openai_format.ok;

  return {
    status: anyFail ? STATUS.FAIL : (allOk ? STATUS.OK : STATUS.WARN),
    checks
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. PaymentWatcher - 결제 시스템 상태 체크
// ═══════════════════════════════════════════════════════════════════════════

async function checkPayment(db) {
  const checks = {};

  // P1: 최근 24h 웹훅 수신 여부
  try {
    if (db) {
      const result = await db.query(`
        SELECT COUNT(*) as count
        FROM payment_logs
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `);
      const count = parseInt(result.rows[0]?.count || 0);
      checks.P1_webhook_24h = {
        name: '결제 웹훅 수신 (24h)',
        ok: true, // 0건이어도 경고만
        count,
        reason: count === 0 ? '최근 24시간 웹훅 수신 없음 (정상일 수 있음)' : null
      };
    } else {
      checks.P1_webhook_24h = {
        name: '결제 웹훅 수신 (24h)',
        ok: true,
        count: 'N/A',
        reason: 'DB 연결 없음 (체크 스킵)'
      };
    }
  } catch (error) {
    checks.P1_webhook_24h = {
      name: '결제 웹훅 수신 (24h)',
      ok: true,
      count: 'N/A',
      reason: `테이블 없음 또는 오류: ${error.message}`
    };
  }

  // P2: 미처리 결제 건수 (48h 초과)
  try {
    if (db) {
      const result = await db.query(`
        SELECT COUNT(*) as count
        FROM payments
        WHERE status = 'pending'
        AND created_at < NOW() - INTERVAL '48 hours'
      `);
      const count = parseInt(result.rows[0]?.count || 0);
      checks.P2_pending_48h = {
        name: '미처리 결제 (48h 초과)',
        ok: count === 0,
        count,
        reason: count > 0 ? `${count}건 미처리 결제 존재 (확인 필요)` : null
      };
    } else {
      checks.P2_pending_48h = {
        name: '미처리 결제 (48h 초과)',
        ok: true,
        count: 'N/A',
        reason: 'DB 연결 없음 (체크 스킵)'
      };
    }
  } catch (error) {
    checks.P2_pending_48h = {
      name: '미처리 결제 (48h 초과)',
      ok: true,
      count: 'N/A',
      reason: `테이블 없음 또는 오류: ${error.message}`
    };
  }

  const allOk = Object.values(checks).every(c => c.ok);
  return {
    status: allOk ? STATUS.OK : STATUS.FAIL,
    checks
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. MessagingWatcher - 메시징 시스템 상태 체크
// ═══════════════════════════════════════════════════════════════════════════

async function checkMessaging(db) {
  const checks = {};

  // M1: 알림톡 발송 성공률 (최근 24h)
  try {
    if (db) {
      const result = await db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'success') as success,
          COUNT(*) as total
        FROM message_logs
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `);
      const success = parseInt(result.rows[0]?.success || 0);
      const total = parseInt(result.rows[0]?.total || 0);
      const rate = total > 0 ? Math.round((success / total) * 100) : 100;

      checks.M1_success_rate = {
        name: '알림톡 발송 성공률',
        ok: rate >= 90,
        rate,
        total,
        success,
        reason: rate < 70 ? `성공률 ${rate}% (위험)` : (rate < 90 ? `성공률 ${rate}% (경고)` : null)
      };
    } else {
      checks.M1_success_rate = {
        name: '알림톡 발송 성공률',
        ok: true,
        rate: 'N/A',
        reason: 'DB 연결 없음 (체크 스킵)'
      };
    }
  } catch (error) {
    checks.M1_success_rate = {
      name: '알림톡 발송 성공률',
      ok: true,
      rate: 'N/A',
      reason: `테이블 없음 또는 오류: ${error.message}`
    };
  }

  // M2: 알림톡 템플릿 상태 (환경변수로 체크)
  const templateCode = process.env.SENS_TEMPLATE_CODE;
  checks.M2_template = {
    name: '알림톡 템플릿 설정',
    ok: !!templateCode,
    templateCode: templateCode ? templateCode.substring(0, 10) + '...' : null,
    reason: templateCode ? null : 'SENS_TEMPLATE_CODE 환경변수 누락'
  };

  const allOk = Object.values(checks).every(c => c.ok);
  const anyFail = Object.values(checks).some(c => !c.ok && c.rate !== undefined && c.rate < 70);

  return {
    status: anyFail ? STATUS.FAIL : (allOk ? STATUS.OK : STATUS.WARN),
    checks
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. DeployWatcher - 배포/서버 상태 체크
// ═══════════════════════════════════════════════════════════════════════════

async function checkDeploy(db) {
  const checks = {};
  const startTime = Date.now();

  // D1: 서버 응답 (자기 자신이므로 항상 OK)
  checks.D1_server = {
    name: '서버 응답',
    ok: true,
    latency_ms: Date.now() - startTime,
    reason: null
  };

  // D2: 필수 DB 테이블 존재 확인
  const requiredTables = ['quotes', 'wishes'];
  const optionalTables = ['itineraries', 'itinerary_events'];

  try {
    if (db) {
      const result = await db.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `);
      const existingTables = result.rows.map(r => r.table_name);

      const missingRequired = requiredTables.filter(t => !existingTables.includes(t));
      const missingOptional = optionalTables.filter(t => !existingTables.includes(t));

      checks.D2_tables = {
        name: '필수 DB 테이블',
        ok: missingRequired.length === 0,
        tables: existingTables.filter(t => [...requiredTables, ...optionalTables].includes(t)),
        missing_required: missingRequired,
        missing_optional: missingOptional,
        reason: missingRequired.length > 0
          ? `필수 테이블 누락: ${missingRequired.join(', ')}`
          : (missingOptional.length > 0 ? `선택 테이블 누락: ${missingOptional.join(', ')}` : null)
      };
    } else {
      checks.D2_tables = {
        name: '필수 DB 테이블',
        ok: false,
        tables: [],
        reason: 'DB 연결 없음'
      };
    }
  } catch (error) {
    checks.D2_tables = {
      name: '필수 DB 테이블',
      ok: false,
      tables: [],
      reason: `DB 조회 오류: ${error.message}`
    };
  }

  const allOk = Object.values(checks).every(c => c.ok);
  return {
    status: allOk ? STATUS.OK : STATUS.FAIL,
    checks
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. AnalyticsWatcher - GA4 분석 상태 체크
// ═══════════════════════════════════════════════════════════════════════════

async function checkAnalytics() {
  const checks = {};

  // A1: GA4 로더 삽입 여부 (index.html 파일 체크)
  try {
    const indexPath = path.join(__dirname, '../public/index.html');
    const content = await fs.readFile(indexPath, 'utf-8');
    const hasGtagLoader = content.includes('googletagmanager.com/gtag/js') ||
                          content.includes('gtag.js?id=G-');

    checks.A1_ga4_loader = {
      name: 'GA4 로더 삽입',
      ok: hasGtagLoader,
      reason: hasGtagLoader ? null : 'index.html에 GA4 로더 스크립트 없음'
    };
  } catch (error) {
    checks.A1_ga4_loader = {
      name: 'GA4 로더 삽입',
      ok: false,
      reason: `파일 읽기 오류: ${error.message}`
    };
  }

  // A2: P0 이벤트 코드 존재 확인
  const p0Events = [
    'itinerary_builder_submit',
    'itinerary_group_convert_submit',
    'itinerary_pdf_download'
  ];

  try {
    const builderPath = path.join(__dirname, '../public/itinerary-builder.html');
    const resultPath = path.join(__dirname, '../public/itinerary-result.html');

    const builderContent = await fs.readFile(builderPath, 'utf-8');
    const resultContent = await fs.readFile(resultPath, 'utf-8');
    const combinedContent = builderContent + resultContent;

    const foundEvents = p0Events.filter(e => combinedContent.includes(e));

    checks.A2_p0_events = {
      name: 'P0 이벤트 코드',
      ok: foundEvents.length === p0Events.length,
      events: foundEvents.length,
      total: p0Events.length,
      found: foundEvents,
      missing: p0Events.filter(e => !foundEvents.includes(e)),
      reason: foundEvents.length < p0Events.length
        ? `P0 이벤트 누락: ${p0Events.filter(e => !foundEvents.includes(e)).join(', ')}`
        : null
    };
  } catch (error) {
    checks.A2_p0_events = {
      name: 'P0 이벤트 코드',
      ok: false,
      events: 0,
      reason: `파일 읽기 오류: ${error.message}`
    };
  }

  // GA4 로더가 없으면 FAIL, 이벤트 누락만 있으면 WARN
  const loaderMissing = !checks.A1_ga4_loader.ok;
  const eventsMissing = !checks.A2_p0_events.ok;

  return {
    status: loaderMissing ? STATUS.FAIL : (eventsMissing ? STATUS.WARN : STATUS.OK),
    checks
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. SiteWatcher - 사이트/링크 상태 체크
// ═══════════════════════════════════════════════════════════════════════════

async function checkSite() {
  const checks = {};

  // S1: 카카오 채널 링크 체크 (실제 HTTP 요청은 비용/시간 문제로 설정값만 체크)
  const kakaoUrl = 'https://pf.kakao.com/_xfxhcWn/chat';

  // 파일에서 카카오 링크가 올바르게 설정되어 있는지 확인
  try {
    const indexPath = path.join(__dirname, '../public/index.html');
    const content = await fs.readFile(indexPath, 'utf-8');
    const hasCorrectKakaoLink = content.includes('_xfxhcWn');
    const hasOldKakaoLink = content.includes('_dailymiracles');

    checks.S1_kakao_link = {
      name: '카카오 채널 링크',
      ok: hasCorrectKakaoLink && !hasOldKakaoLink,
      url: kakaoUrl,
      reason: !hasCorrectKakaoLink
        ? '카카오 채널 링크 누락'
        : (hasOldKakaoLink ? '구 카카오 링크(_dailymiracles) 잔존' : null)
    };
  } catch (error) {
    checks.S1_kakao_link = {
      name: '카카오 채널 링크',
      ok: false,
      reason: `파일 읽기 오류: ${error.message}`
    };
  }

  const allOk = Object.values(checks).every(c => c.ok);
  return {
    status: allOk ? STATUS.OK : STATUS.FAIL,
    checks
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 함수: 전체 헬스체크 실행
// ═══════════════════════════════════════════════════════════════════════════

async function runFullHealthCheck(db = null) {
  const timestamp = new Date().toISOString();

  // 모든 Watcher 병렬 실행
  const [token, payment, messaging, deploy, analytics, site] = await Promise.all([
    checkTokens(),
    checkPayment(db),
    checkMessaging(db),
    checkDeploy(db),
    checkAnalytics(),
    checkSite()
  ]);

  const watchers = { token, payment, messaging, deploy, analytics, site };

  // 전체 상태 계산
  const statusPriority = { [STATUS.FAIL]: 3, [STATUS.WARN]: 2, [STATUS.OK]: 1 };
  const maxStatus = Object.values(watchers).reduce((max, w) => {
    return statusPriority[w.status] > statusPriority[max] ? w.status : max;
  }, STATUS.OK);

  // 요약 계산
  let ok = 0, warn = 0, fail = 0;
  const actionRequired = [];

  Object.entries(watchers).forEach(([watcherName, watcher]) => {
    Object.entries(watcher.checks).forEach(([checkId, check]) => {
      if (check.ok) {
        ok++;
      } else if (check.reason && check.reason.includes('위험')) {
        fail++;
        actionRequired.push(`${checkId}: ${check.reason}`);
      } else {
        // ok가 false이면 무조건 카운트
        if (watcher.status === STATUS.FAIL) {
          fail++;
          actionRequired.push(`${checkId}: ${check.reason || check.name}`);
        } else {
          warn++;
          if (check.reason) {
            actionRequired.push(`${checkId}: ${check.reason}`);
          }
        }
      }
    });
  });

  return {
    timestamp,
    overall: maxStatus,
    watchers,
    summary: {
      ok,
      warn,
      fail,
      total: ok + warn + fail,
      action_required: actionRequired
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Slack 보고서 생성
// ═══════════════════════════════════════════════════════════════════════════

function generateSlackReport(healthResult) {
  const { timestamp, overall, watchers, summary } = healthResult;
  const date = new Date(timestamp);
  const kstTime = date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  // 상태별 Watcher 분류
  const okWatchers = [];
  const warnWatchers = [];
  const failWatchers = [];

  Object.entries(watchers).forEach(([name, w]) => {
    const checkCount = Object.keys(w.checks).length;
    const okCount = Object.values(w.checks).filter(c => c.ok).length;
    const label = `${name.charAt(0).toUpperCase() + name.slice(1)}(${okCount}/${checkCount})`;

    if (w.status === STATUS.OK) okWatchers.push(label);
    else if (w.status === STATUS.WARN) warnWatchers.push(label);
    else failWatchers.push(label);
  });

  let report = `🤖 *Ops Agent 일일 보고* (${kstTime})\n\n`;

  if (okWatchers.length > 0) {
    report += `🟢 정상: ${okWatchers.join(' · ')}\n`;
  }
  if (warnWatchers.length > 0) {
    report += `🟡 경고: ${warnWatchers.join(' · ')}\n`;
  }
  if (failWatchers.length > 0) {
    report += `🔴 위험: ${failWatchers.join(' · ')}\n`;
  }

  if (summary.action_required.length > 0) {
    report += `\n📌 *오늘 P0 액션:*\n`;
    summary.action_required.slice(0, 5).forEach(action => {
      report += `  • ${action}\n`;
    });
  }

  report += `\n🔗 상세: /api/admin/health/full`;

  return report;
}

// ═══════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  runFullHealthCheck,
  generateSlackReport,
  // 개별 Watcher도 export (필요시)
  checkTokens,
  checkPayment,
  checkMessaging,
  checkDeploy,
  checkAnalytics,
  checkSite,
  STATUS
};
