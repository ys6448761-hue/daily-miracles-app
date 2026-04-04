// ═══════════════════════════════════════════════════════════
// Daily Miracles MVP - FINAL (for Render)
// Robust routing + tolerant parsing + deep logging + diag
// ═══════════════════════════════════════════════════════════
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const compression = require("compression");  // PR-3: gzip 압축
const path = require("path");
const analysisEngine = require("./services/analysisEngine");

// ═══════════════════════════════════════════════════════════
// 환경변수 검증 (서버 시작 전 필수 체크)
// ═══════════════════════════════════════════════════════════
let envValidator = null;
let exportPipelineStatus = null;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_SERVERLESS = !!(process.env.VERCEL || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME);
try {
  envValidator = require("./utils/envValidator");
  const validationResult = envValidator.validateEnv({ failFast: IS_PRODUCTION });

  // 오류가 있으면 가이드 출력
  if (!validationResult.isValid) {
    envValidator.printEnvGuide();
  }

  // Export Pipeline 설정 상태 출력
  exportPipelineStatus = envValidator.printExportStatus();
} catch (error) {
  console.warn("⚠️ 환경변수 검증기 로드 실패:", error.message);
}

// ═══════════════════════════════════════════════════════════
// Slack 운영 알림 게이트 (프로덕션 필수)
// OPS_SLACK_WEBHOOK 없이 프로덕션 배포 시 서버 부팅 차단
// ═══════════════════════════════════════════════════════════
const OPS_SLACK_WEBHOOK = process.env.OPS_SLACK_WEBHOOK || process.env.SLACK_WEBHOOK_URL;
if (!OPS_SLACK_WEBHOOK) {
  // Serverless(Vercel)에서는 process.exit(1) 금지 — 함수 즉시 크래시 유발
  if (IS_PRODUCTION && !IS_SERVERLESS) {
    console.error('');
    console.error('╔══════════════════════════════════════════════════════════════╗');
    console.error('║  💀 FATAL: OPS_SLACK_WEBHOOK 미설정                          ║');
    console.error('║                                                              ║');
    console.error('║  Slack 운영 알림 없이 프로덕션 운영 불가                      ║');
    console.error('║  Render Dashboard → Environment에서 설정 후 재배포하세요      ║');
    console.error('║                                                              ║');
    console.error('║  OPS_SLACK_WEBHOOK=https://hooks.slack.com/services/T.../... ║');
    console.error('╚══════════════════════════════════════════════════════════════╝');
    console.error('');
    process.exit(1);
  } else {
    console.warn('⚠️  OPS_SLACK_WEBHOOK 미설정 - Slack 운영 알림 비활성화');
    if (IS_SERVERLESS) console.warn('   [Serverless] process.exit 스킵 — degraded 모드로 계속 실행');
  }
}

const app = express();

// ═══════════════════════════════════════════════════════════
// Open Gate — 릴리즈 차단 게이트 (APP_DISABLED)
// ═══════════════════════════════════════════════════════════
app.use(require('./middleware/gateMiddleware'));

// 메트릭스 서비스 로딩
let metricsService = null;
try {
  metricsService = require("./services/metricsService");
  console.log("✅ 메트릭스 서비스 로드 성공");
} catch (error) {
  console.warn("⚠️ 메트릭스 서비스 로드 실패:", error.message);
}

// Ops Agent 서비스 로딩
let opsAgentService = null;
try {
  opsAgentService = require("./services/opsAgentService");
  console.log("✅ Ops Agent 서비스 로드 성공");
} catch (error) {
  console.warn("⚠️ Ops Agent 서비스 로드 실패:", error.message);
}

// Admin 인증 미들웨어 로딩
let verifyAdmin = null;
try {
  const authMiddleware = require("./aurora5/middleware/auth");
  verifyAdmin = authMiddleware.verifyAdmin;
  console.log("✅ Admin 인증 미들웨어 로드 성공");
} catch (error) {
  console.warn("⚠️ Admin 인증 미들웨어 로드 실패:", error.message);
  // Fallback: 기본 검증 함수
  verifyAdmin = (req, res, next) => {
    const adminKey = req.headers['x-admin-key'] || req.query.key;
    const expectedKey = process.env.ADMIN_API_KEY;

    if (expectedKey && adminKey !== expectedKey) {
      return res.status(401).json({ success: false, error: 'Admin authentication required' });
    }
    next();
  };
}

// Airtable 서비스 로딩
let airtableService = null;
try {
  airtableService = require("./services/airtableService");
  console.log("✅ Airtable 서비스 로드 성공");
} catch (error) {
  console.warn("⚠️ Airtable 서비스 로드 실패:", error.message);
}

// Slack Bot 서비스 로딩
let slackBotService = null;
try {
  slackBotService = require("./services/slackBotService");
  console.log("✅ Slack Bot 서비스 로드 성공");
} catch (error) {
  console.warn("⚠️ Slack Bot 서비스 로드 실패:", error.message);
}

// Slack Heartbeat 서비스 로딩 (운영 헬스 모니터링)
let slackHeartbeatService = null;
try {
  slackHeartbeatService = require("./services/slackHeartbeatService");
  console.log("✅ Slack Heartbeat 서비스 로드 성공");
} catch (error) {
  console.warn("⚠️ Slack Heartbeat 서비스 로드 실패:", error.message);
}

// Stability Score service (P2.3 — /healthz, rolling counters)
let stabilityService = null;
try {
  stabilityService = require("./services/stabilityService");
  console.log("✅ Stability Score 서비스 로드 성공");
} catch (error) {
  console.warn("⚠️ Stability Score 서비스 로드 실패:", error.message);
}

// Error handler middleware (classification + Slack alerts for 500s)
const { globalErrorHandler, notFoundHandler, initSlackSender } = require('./middleware/errorHandler');
if (slackHeartbeatService) {
  initSlackSender((msg) => slackHeartbeatService.sendSlackMessage(msg));
}

// 8-Mode SSOT Registry (P1-SSOT — modes.registry.json)
let modesLoader = null;
try {
  modesLoader = require("./config/modesLoader");
  const { modes, errors } = modesLoader.loadRegistry({ failFast: IS_PRODUCTION });
  if (errors.length > 0) {
    console.warn("⚠️ Mode Registry 검증 경고:", errors.join('; '));
  }
  console.log(`✅ Mode Registry 로드 성공 (${modes.length}개 모드)`);
} catch (error) {
  console.error("❌ Mode Registry 로드 실패:", error.message);
  if (IS_PRODUCTION) process.exit(1);
}

// 빌드 정보 (디버깅용)
const BUILD_INFO = {
  commit: process.env.GIT_SHA || process.env.RENDER_GIT_COMMIT || 'unknown',
  deployedAt: new Date().toISOString(),
  env: process.env.NODE_ENV || 'development',
  version: 'v3.1-metrics'
};

// 인증 라우터 로딩
let authRoutes = null;
try {
  authRoutes = require("./routes/authRoutes");
  console.log("✅ 인증 라우터 로드 성공");
} catch (error) {
  console.error("❌ 인증 라우터 로드 실패:", error.message);
}

// 여수 라우터 로딩 (에러 처리)
let yeosuRoutes = null;
try {
  yeosuRoutes = require("./routes/yeosuRoutes");
  console.log("✅ 여수 라우터 로드 성공");
} catch (error) {
  console.error("❌ 여수 라우터 로드 실패:", error.message);
}
// 소원항해 라우터 로딩
let wishVoyageRoutes = null;
try {
  wishVoyageRoutes = require("./routes/wishVoyageRoutes");
  console.log("✅ 소원항해 라우터 로드 성공");
} catch (error) {
  console.error("❌ 소원항해 라우터 로드 실패:", error.message);
}
// 문제 해결 라우터 로딩
let problemRoutes = null;
try {
  problemRoutes = require("./routes/problemRoutes");
  console.log("✅ 문제 해결 라우터 로드 성공");
} catch (error) {
  console.error("❌ 문제 해결 라우터 로드 실패:", error.message);
}

// MVP 1차 폼 (간편 접수) 라우터 로딩
let inquiryRoutes = null;
try {
  inquiryRoutes = require("./routes/inquiryRoutes");
  console.log("✅ 간편 접수 라우터 로드 성공");
} catch (error) {
  console.error("❌ 간편 접수 라우터 로드 실패:", error.message);
}

// 소원실현 폼 라우터 로딩
let wishRoutes = null;
try {
  wishRoutes = require("./routes/wishRoutes");
  console.log("✅ 소원실현 라우터 로드 성공");
} catch (error) {
  console.error("❌ 소원실현 라우터 로드 실패:", error.message);
  console.error("❌ 스택 트레이스:", error.stack);
}

// Wish Intake 7문항 라우터 로딩 (P0-02)
let wishIntakeRoutes = null;
try {
  wishIntakeRoutes = require("./routes/wishIntakeRoutes");
  console.log("✅ Wish Intake 라우터 로드 성공");
} catch (error) {
  console.error("❌ Wish Intake 라우터 로드 실패:", error.message);
}

// 소원그림 생성 라우터 로딩
let wishImageRoutes = null;
try {
  wishImageRoutes = require("./routes/wishImageRoutes");
  console.log("✅ 소원그림 라우터 로드 성공");
} catch (error) {
  console.error("❌ 소원그림 라우터 로드 실패:", error.message);
}

// 성장필름 챌린지 라우터 로딩 (AIL-105-P0)
let challengeRoutes = null;
try {
  challengeRoutes = require('./routes/challengeRoutes');
  console.log('✅ 성장필름 챌린지 라우터 로드 성공');
} catch (error) {
  console.error('❌ 성장필름 챌린지 라우터 로드 실패:', error.message);
}

// 입항 증명서 라우터 로딩
let certificateRoutes = null;
try {
  certificateRoutes = require("./routes/certificateRoutes");
  console.log("✅ 입항 증명서 라우터 로드 성공");
} catch (error) {
  console.error("❌ 입항 증명서 라우터 로드 실패:", error.message);
}

// 메시지 발송 진단 라우터 로딩
let notifyRoutes = null;
try {
  notifyRoutes = require("./routes/notifyRoutes");
  console.log("✅ 메시지 진단 라우터 로드 성공");
} catch (error) {
  console.error("❌ 메시지 진단 라우터 로드 실패:", error.message);
}

// Aurora5 자동화 엔진 라우터 로딩
let aurora5Routes = null;
try {
  aurora5Routes = require("./aurora5/routes/aurora5Routes");
  console.log("✅ Aurora5 라우터 로드 성공");
} catch (error) {
  console.error("❌ Aurora5 라우터 로드 실패:", error.message);
}

// 토론 자동화 라우터 로딩
let debateRoutes = null;
try {
  debateRoutes = require("./routes/debateRoutes");
  console.log("✅ 토론 자동화 라우터 로드 성공");
} catch (error) {
  console.error("❌ 토론 자동화 라우터 로드 실패:", error.message);
}

// 웹훅 라우터 로딩
let webhookRoutes = null;
try {
  webhookRoutes = require("./routes/webhookRoutes");
  console.log("✅ 웹훅 라우터 로드 성공");
} catch (error) {
  console.error("❌ 웹훅 라우터 로드 실패:", error.message);
}

// 여정 파이프라인 라우터 로딩
let journeyRoutes = null;
try {
  journeyRoutes = require("./routes/journeyRoutes");
  console.log("✅ 여정 파이프라인 라우터 로드 성공");
} catch (error) {
  console.error("❌ 여정 파이프라인 라우터 로드 실패:", error.message);
}

// Aurora 5 에이전트 라우터 로딩
let agentRoutes = null;
try {
  agentRoutes = require("./routes/agentRoutes");
  console.log("✅ Aurora 5 에이전트 라우터 로드 성공");
} catch (error) {
  console.error("❌ Aurora 5 에이전트 라우터 로드 실패:", error.message);
}

// 배치 처리 라우터 로딩
let batchRoutes = null;
try {
  batchRoutes = require("./routes/batchRoutes");
  console.log("✅ 배치 처리 라우터 로드 성공");
} catch (error) {
  console.error("❌ 배치 처리 라우터 로드 실패:", error.message);
}

// Shorts 자동 생성 라우터 로딩
let shortsRoutes = null;
try {
  shortsRoutes = require("./routes/shortsRoutes");
  console.log("✅ Shorts 라우터 로드 성공");
} catch (error) {
  console.error("❌ Shorts 라우터 로드 실패:", error.message);
}

// 스토리북 E2E Commerce 라우터 로딩
let storybookRoutes = null;
try {
  storybookRoutes = require("./routes/storybookRoutes");
  console.log("✅ 스토리북 라우터 로드 성공");
} catch (error) {
  console.error("❌ 스토리북 라우터 로드 실패:", error.message);
}

// 여수 소원항해 견적 시스템 v2.0 라우터 로딩
let quoteRoutes = null;
try {
  quoteRoutes = require("./routes/quoteRoutes");
  console.log("✅ 견적 시스템 라우터 로드 성공");
} catch (error) {
  console.error("❌ 견적 시스템 라우터 로드 실패:", error.message);
}

// 4인 이하 자동 일정 생성 라우터 로딩
let itineraryRoutes = null;
try {
  itineraryRoutes = require("./routes/itineraryRoutes");
  console.log("✅ 일정 생성 라우터 로드 성공");
} catch (error) {
  console.error("❌ 일정 생성 라우터 로드 실패:", error.message);
}

// Wix 자유여행 견적 요청 라우터 로딩
let quoteRequestRoutes = null;
try {
  quoteRequestRoutes = require("./routes/quoteRequestRoutes");
  console.log("✅ Wix 견적 요청 라우터 로드 성공");
} catch (error) {
  console.error("❌ Wix 견적 요청 라우터 로드 실패:", error.message);
}

// 단축 링크 라우터 로딩 (/r/{token})
let shortLinkRoutes = null;
try {
  shortLinkRoutes = require("./routes/shortLinkRoutes");
  console.log("✅ 단축 링크 라우터 로드 성공");
} catch (error) {
  console.error("❌ 단축 링크 라우터 로드 실패:", error.message);
}

// 운영 시스템 라우터 로딩 (헬스체크, 비상알림)
let opsRoutes = null;
try {
  opsRoutes = require("./routes/opsRoutes");
  console.log("✅ 운영 시스템 라우터 로드 성공");
} catch (error) {
  console.error("❌ 운영 시스템 라우터 로드 실패:", error.message);
}

// Entitlement 미들웨어 로딩 (Trial 권한 검증)
let entitlementMiddleware = null;
try {
  entitlementMiddleware = require("./middleware/entitlement");
  console.log("✅ Entitlement 미들웨어 로드 성공");
} catch (error) {
  console.error("❌ Entitlement 미들웨어 로드 실패:", error.message);
}

// 30일 프로그램 결제 라우터 로딩
let programRoutes = null;
try {
  programRoutes = require("./routes/programRoutes");
  console.log("✅ 30일 프로그램 라우터 로드 성공");
} catch (error) {
  console.error("❌ 30일 프로그램 라우터 로드 실패:", error.message);
}

// 여수 소원빌기 체험 라우터 로딩
let yeosuWishRoutes = null;
try {
  yeosuWishRoutes = require("./routes/yeosuWishRoutes");
  console.log("✅ 여수 소원빌기 라우터 로드 성공");
} catch (error) {
  console.error("❌ 여수 소원빌기 라우터 로드 실패:", error.message);
}

// RepoPulse 라우터 로딩
let repoPulseRoutes = null;
try {
  repoPulseRoutes = require("./routes/repoPulseRoutes");
  console.log("✅ RepoPulse 라우터 로드 성공");
} catch (error) {
  console.error("❌ RepoPulse 라우터 로드 실패:", error.message);
}

// Chat Log 라우터 로딩
let chatLogRoutes = null;
try {
  chatLogRoutes = require("./routes/chatLogRoutes");
  console.log("✅ Chat Log 라우터 로드 성공");
} catch (error) {
  console.error("❌ Chat Log 라우터 로드 실패:", error.message);
}

// RAW Process 라우터 로딩
let rawProcessRoutes = null;
try {
  rawProcessRoutes = require("./routes/rawProcessRoutes");
  console.log("✅ RAW Process 라우터 로드 성공");
} catch (error) {
  console.error("❌ RAW Process 라우터 로드 실패:", error.message);
}

// Drive→GitHub Sync 라우터 로딩
let driveGitHubSyncRoutes = null;
try {
  driveGitHubSyncRoutes = require("./routes/driveGitHubSyncRoutes");
  console.log("✅ Drive→GitHub Sync 라우터 로드 성공");
} catch (error) {
  console.error("❌ Drive→GitHub Sync 라우터 로드 실패:", error.message);
}

// Storyboard 배치 라우터 로딩
let storyboardRoutes = null;
try {
  storyboardRoutes = require("./routes/storyboardRoutes");
  console.log("✅ Storyboard 배치 라우터 로드 성공");
} catch (error) {
  console.error("❌ Storyboard 배치 라우터 로드 실패:", error.message);
}

// Hero8 8초 영상 생성 라우터 로딩
let hero8Routes = null;
try {
  hero8Routes = require("./routes/hero8Routes");
  console.log("✅ Hero8 영상 라우터 로드 성공");
} catch (error) {
  console.error("❌ Hero8 영상 라우터 로드 실패:", error.message);
}

// VideoJob 오케스트레이터 라우터 로딩 (AIL-2026-0219-VID-003)
let videoJobRoutes = null;
try {
  videoJobRoutes = require("./routes/videoJobRoutes");
  console.log("✅ VideoJob 라우터 로드 성공");
} catch (error) {
  console.error("❌ VideoJob 라우터 로드 실패:", error.message);
}

// Aurora Video Job 라우터 로딩 (AIL-2026-0301-VIDJOB-001)
let auroraJobRoutes = null;
let auroraWorkerInstance = null;
try {
  auroraJobRoutes = require("./routes/auroraJobRoutes");
  console.log("✅ Aurora Job 라우터 로드 성공");
} catch (error) {
  console.error("❌ Aurora Job 라우터 로드 실패:", error.message);
}

// 기적 금고 (Finance) 라우터 로딩
let financeRoutes = null;
try {
  financeRoutes = require("./routes/financeRoutes");
  console.log("✅ 기적 금고(Finance) 라우터 로드 성공");
} catch (error) {
  console.error("❌ 기적 금고(Finance) 라우터 로드 실패:", error.message);
}

// 포인트 시스템 라우터 로딩 (Aurora5 v2.6)
let pointRoutes = null;
try {
  pointRoutes = require("./routes/pointRoutes");
  console.log("✅ 포인트 시스템 라우터 로드 성공");
} catch (error) {
  console.error("❌ 포인트 시스템 라우터 로드 실패:", error.message);
}

// 리워드(예고편 교환) 라우터 로딩 (Aurora5 v2.6)
let rewardRoutes = null;
try {
  rewardRoutes = require("./routes/rewardRoutes");
  console.log("✅ 리워드(예고편) 라우터 로드 성공");
} catch (error) {
  console.error("❌ 리워드(예고편) 라우터 로드 실패:", error.message);
}

// 추천 시스템 라우터 로딩 (Aurora5 v2.6)
let referralRoutes = null;
try {
  referralRoutes = require("./routes/referralRoutes");
  console.log("✅ 추천 시스템 라우터 로드 성공");
} catch (error) {
  console.error("❌ 추천 시스템 라우터 로드 실패:", error.message);
}

// 어드민 포인트/추천 관리 라우터 로딩 (Aurora5 v2.6)
let adminPointRoutes = null;
try {
  adminPointRoutes = require("./routes/adminPointRoutes");
  console.log("✅ 어드민 포인트 라우터 로드 성공");
} catch (error) {
  console.error("❌ 어드민 포인트 라우터 로드 실패:", error.message);
}

// 일일 체크 (출석/실행/기록) 라우터 로딩 (Aurora5 v2.6 Gap)
let dailyCheckRoutes = null;
try {
  dailyCheckRoutes = require("./routes/dailyCheckRoutes");
  console.log("✅ 일일 체크 라우터 로드 성공");
} catch (error) {
  console.error("❌ 일일 체크 라우터 로드 실패:", error.message);
}

// 몰트봇 (고객응대 Draft 생성기)
let maltbotRoutes = null;
try {
  maltbotRoutes = require("./routes/maltbotRoutes");
  console.log("✅ 몰트봇 라우터 로드 성공");
} catch (error) {
  console.error("❌ 몰트봇 라우터 로드 실패:", error.message);
}

// 나이스페이 결제 라우터 로딩
let nicepayRoutes = null;
try {
  nicepayRoutes = require("./routes/nicepayRoutes");
  console.log("✅ 나이스페이 라우터 로드 성공");
} catch (error) {
  console.error("❌ 나이스페이 라우터 로드 실패:", error.message);
}

// 소원 추적 시스템 라우터 로딩 (바이럴 루프 #2)
let wishTrackingRoutes = null;
let wishTrackingMessageProvider = null;
try {
  wishTrackingRoutes = require("./routes/wishTrackingRoutes");
  console.log("✅ 소원 추적 라우터 로드 성공");
} catch (error) {
  console.error("❌ 소원 추적 라우터 로드 실패:", error.message);
}
try {
  wishTrackingMessageProvider = require("./services/messageProvider");
} catch (error) {
  console.warn("⚠️ messageProvider 로드 실패 (추적 발송 비활성):", error.message);
}

// 실시간 카운터 라우터 로딩 (바이럴 루프 #4: 네트워크 효과)
let liveCounterRoutes = null;
try {
  liveCounterRoutes = require("./routes/liveCounterRoutes");
  console.log("✅ 실시간 카운터 라우터 로드 성공");
} catch (error) {
  console.error("❌ 실시간 카운터 라우터 로드 실패:", error.message);
}

// 소원항해단 v3.1-MVP 라우터 로딩
let harborRoutes = null;
try {
  harborRoutes = require("./routes/harborRoutes");
  console.log("✅ 소원항해단(Harbor) 라우터 로드 성공");
} catch (error) {
  console.error("❌ 소원항해단(Harbor) 라우터 로드 실패:", error.message);
}

// 여수여행센터 운영 컨트롤타워 OS v0 라우터 로딩
let yeosuOpsRoutes = null;
try {
  yeosuOpsRoutes = require("./routes/yeosuOpsRoutes");
  console.log("✅ 여수 운영 컨트롤타워(Ops Center) 라우터 로드 성공");
} catch (error) {
  console.error("❌ 여수 운영 컨트롤타워(Ops Center) 라우터 로드 실패:", error.message);
}

// 소원놀이터 (Playground Engine) 라우터 로딩
let playgroundRoutes = null;
let playgroundEngine = null;
try {
  playgroundRoutes = require("./routes/playgroundRoutes");
  playgroundEngine = require("./services/playground");
  console.log("✅ 소원놀이터(Playground) 라우터 로드 성공");
} catch (error) {
  console.error("❌ 소원놀이터(Playground) 라우터 로드 실패:", error.message);
}

// Settlement 라우터/서비스 로딩
let settlementRoutes = null;
let settlementEngine = null;
try {
  settlementRoutes = require("./routes/settlementRoutes");
  settlementEngine = require("./services/settlement");
  console.log("✅ Settlement 엔진/라우터 로드 성공");
} catch (error) {
  console.warn("⚠️ Settlement 엔진/라우터 로드 실패:", error.message);
}

// WU (Aurora5 통합 엔진) 라우터 로딩
let wuRoutes = null;
try {
  wuRoutes = require("./routes/wuRoutes");
  console.log("✅ WU API 라우터 로드 성공");
} catch (error) {
  console.error("❌ WU API 라우터 로드 실패:", error.message);
}

// Attendance (Living Wisdom 출석/체온) 라우터 로딩
let attendanceRoutes = null;
try {
  attendanceRoutes = require("./routes/attendanceRoutes");
  console.log("✅ Attendance 라우터 로드 성공");
} catch (error) {
  console.warn("⚠️ Attendance 라우터 로드 실패:", error.message);
}

// Experiment Event 라우터 로딩
let experimentEventRoutes = null;
try {
  experimentEventRoutes = require("./routes/experimentEventRoutes");
  console.log("✅ Experiment Event 라우터 로드 성공");
} catch (error) {
  console.warn("⚠️ Experiment Event 라우터 로드 실패:", error.message);
}

// DB 모듈 (선택적 로딩)
let db = null;
try {
  db = require("./database/db");
} catch (error) {
  console.error("⚠️ DB 모듈 로드 실패:", error.message);
}

// ---------- CORS (관용 + 화이트리스트 + 프리플라이트) ----------
const baseAllowedOrigins = [
  'https://dailymiracles.kr',
  'https://www.dailymiracles.kr',
  'https://pay.dailymiracles.kr',
  'https://app.dailymiracles.kr'
];
const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...baseAllowedOrigins, ...envOrigins])];

app.use(
  cors({
    origin(origin, cb) {
      // curl/postman/서버사이드 호출
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        if (process.env.REQUEST_LOG) console.log(`✅ CORS allowed: ${origin}`);
        return cb(null, true);
      }
      // 디버깅 단계에선 허용(프로덕션시 false로 바꿔도 됨)
      console.warn(`⚠️  CORS not in whitelist: ${origin} (TEMP allowing)`);
      return cb(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Type"]
  })
);

// 모든 프리플라이트를 즉시 OK
app.options("*", (req, res) => res.sendStatus(204));

// ═══════════════════════════════════════════════════════════════════════════
// /healthz — 절대 500 반환 금지, 어떤 의존성도 호출하지 않음
// ═══════════════════════════════════════════════════════════════════════════
app.get('/healthz', (req, res) => {
  try {
    return res.status(200).json({
      status: 'ok',
      serverless: IS_SERVERLESS,
      node: process.version,
      uptimeSec: Math.floor(process.uptime()),
      ts: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_SHA || 'unknown'
    });
  } catch (e) {
    return res.status(200).json({ status: 'degraded', message: String(e && e.message || e) });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// onrender.com → app.dailymiracles.kr 리다이렉트 (HTML 페이지만)
// API 요청은 하위 호환성을 위해 리다이렉트하지 않음
// ═══════════════════════════════════════════════════════════════════════════
const NEW_DOMAIN = 'https://app.dailymiracles.kr';
const OLD_DOMAINS = ['daily-miracles-app.onrender.com', 'daily-miracles-mvp.onrender.com'];

app.use((req, res, next) => {
  const host = req.get('host') || '';

  // 구 도메인에서 접근한 경우
  if (OLD_DOMAINS.some(old => host.includes(old))) {
    // API 요청은 리다이렉트하지 않음 (하위 호환성)
    if (req.path.startsWith('/api/') || req.path.startsWith('/webhooks/')) {
      return next();
    }

    // HTML 페이지 요청은 새 도메인으로 리다이렉트
    const newUrl = `${NEW_DOMAIN}${req.originalUrl}`;
    console.log(`🔄 Redirect: ${host}${req.originalUrl} → ${newUrl}`);
    return res.redirect(301, newUrl);
  }

  next();
});

// PR-3: gzip 압축 미들웨어 (JSON 응답 60-70% 크기 감소)
app.use(compression({
  level: 6,  // 압축 레벨 (1-9, 6이 균형점)
  threshold: 1024,  // 1KB 이상만 압축
  filter: (req, res) => {
    // 기본 필터 사용 (text/*, application/json 등 압축)
    if (req.headers['x-no-compression']) {
      return false;  // 클라이언트가 압축 거부 시
    }
    return compression.filter(req, res);
  }
}));

// ---------- Body Parsing (관용) ----------
// Slack 서명 검증용 rawBody 저장 (verify 콜백)
app.use(express.json({
  limit: "2mb",
  type: ["application/json", "text/json", "application/*+json"],
  verify: (req, _res, buf) => {
    // /api/slack/events 경로에서만 rawBody 저장 (서명 검증용)
    if (req.originalUrl === '/api/slack/events' || req.url === '/api/slack/events') {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
// 일부 환경에서 content-type이 틀리면 문자열로 들어오므로 보정
app.use((req, _res, next) => {
  if (typeof req.body === "string") {
    try { req.body = JSON.parse(req.body); } catch (_) { /* 무시 */ }
  }
  next();
});

// ---------- Request ID ----------
const requestIdMiddleware = require('./middleware/requestId');
app.use(requestIdMiddleware);

// ---------- Stability Score Tracking (P2.3) ----------
if (stabilityService) {
  app.use(stabilityService.middleware());
}

// ---------- Plaza Gate ----------
app.get('/plaza', (req, res) => {
  if (process.env.PLAZA_ENABLED !== 'true') {
    return res.send('소원꿈터 광장 Coming Soon');
  }
  res.sendFile(path.join(__dirname, 'public', 'plaza.html'));
});

// ---------- Growth Film ----------
app.get('/growth-film', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'growth-film.html'));
});

// favicon.ico — 파일 없을 때 500 방지
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ---------- Soft Launch 최소 응답 라우트 (fail-open) ----------
// AIL-2026-PLAZA-STUB: TODO — DB 연동 후 각 라우트 파일로 이전

// GET /api/event
app.get('/api/event', (req, res) => {
  try {
    res.json({ success: true, items: [] });
  } catch (err) {
    console.error('[/api/event]', err);
    res.status(500).json({ success: false, error: 'internal' });
  }
});

// GET /api/plaza/showcase
app.get('/api/plaza/showcase', (req, res) => {
  try {
    res.json({ success: true, items: [] });
  } catch (err) {
    console.error('[/api/plaza/showcase]', err);
    res.status(500).json({ success: false, error: 'internal' });
  }
});

// GET /api/plaza/curation/today
app.get('/api/plaza/curation/today', (req, res) => {
  try {
    res.json({ success: true, miracle: null, wisdom: null });
  } catch (err) {
    console.error('[/api/plaza/curation/today]', err);
    res.status(500).json({ success: false, error: 'internal' });
  }
});

// POST /api/plaza/event
app.post('/api/plaza/event', (req, res) => {
  try {
    res.status(204).send();
  } catch (err) {
    console.error('[POST /api/plaza/event]', err);
    res.status(500).json({ success: false, error: 'internal' });
  }
});

// ---------- Static ----------
// PR-5: Cache-Control 헤더 추가 (브라우저 캐싱 활성화)
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: '1d',           // 정적 파일 1일 캐싱
  etag: true,             // ETag 활성화 (조건부 요청)
  lastModified: true,     // Last-Modified 헤더
  setHeaders: (res, filePath) => {
    // 파일 타입별 캐시 전략
    if (filePath.endsWith('.html')) {
      // HTML은 캐싱 비활성화 — 배포 직후 항상 최신 파일 보장
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
    } else if (filePath.match(/\.(js|css)$/)) {
      // JS/CSS는 1일 캐싱
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    } else if (filePath.match(/\.(png|jpg|jpeg|gif|ico|svg|webp)$/)) {
      // 이미지는 7일 캐싱
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    } else if (filePath.match(/\.(woff|woff2|ttf|eot)$/)) {
      // 폰트는 30일 캐싱
      res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    }
  }
}));

// ---------- Clean URL Routes (확장자 없이 접근) ----------
app.get("/quote", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "quote.html"));
});
// ===== 출석 API =====
app.post("/api/attendance/ping", express.json(), (req, res) => {
  const apiKey = req.headers["x-api-key"];

  if (apiKey !== process.env.LW_API_KEY) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const { eventType, page } = req.body || {};

  return res.status(200).json({
    ok: true,
    eventType,
    page,
    timestamp: new Date().toISOString()
  });
});

app.get("/program", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "program.html"));
});

app.get("/program/success", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "program-success.html"));
});

app.get("/program/fail", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "program-fail.html"));
});

app.get("/program/messages", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "program-messages.html"));
});

// ---------- Playground Pages (소원놀이터) ----------
// AIL-512: Clean URL 라우트 추가
app.get("/playground", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "playground", "index.html"));
});

app.get("/playground/create", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "playground", "create.html"));
});

app.get("/playground/result", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "playground", "result.html"));
});

app.get("/playground/remix", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "playground", "remix.html"));
});

app.get("/playground/share", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "playground", "share.html"));
});

// ---------- WU Pages (Aurora5 통합 엔진) ----------
app.get("/wu", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "wu", "index.html"));
});

// ---------- Result Page (기적 결과 페이지) ----------
// /result/:id 형태의 URL을 result.html로 라우팅 (ID는 프론트에서 처리)
app.get("/result/:id", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "result.html"));
});

// ---------- Points Page (포인트 대시보드) ----------
// 접근: /points?token=xxx (토큰 기반 인증)
app.get("/points", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "points.html"));
});

// ---------- Request Logging (가시화) ----------
if (String(process.env.REQUEST_LOG || "1") === "1") {
  app.use((req, _res, next) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${req.method} ${req.originalUrl}`);
    if (req.method !== "GET") {
      try {
        console.log(`  headers: ${JSON.stringify(req.headers)}`);
        console.log(`  body   : ${JSON.stringify(req.body)}`);
      } catch { /* ignore */ }
    }
    next();
  });
}

// ---------- In-memory latest store ----------
global.latestStore = global.latestStore || { story: null };
const SERVER_STARTED_AT = new Date().toISOString();

// ---------- Stability Score (P2.3) — Safe Health Endpoint ----------
// 절대 500 반환 금지: 어떤 서비스가 실패해도 200 (ok | degraded)
app.get("/healthz", (_req, res) => {
  const startedAt = Date.now();
  try {
    const checks = {};
    let degraded = false;

    // 1) Stability Score (선택적)
    try {
      if (stabilityService) {
        const h = stabilityService.getHealthz();
        checks.stability = { status: h.status, score: h.score };
        if (h.status === 'critical') degraded = true;
      } else {
        degraded = true;
        checks.stability = { status: 'unavailable' };
      }
    } catch (e) {
      degraded = true;
      checks.stability = { status: 'error', message: e.message };
    }

    // 2) Metrics 상태 (throw 금지)
    try {
      const metricsService = require('./services/metricsService');
      const m = metricsService.getMetrics();
      checks.metrics = { date: m.date, wishes: m.wishes.total };
    } catch (e) {
      checks.metrics = { status: 'fail', error: e.message };
    }

    // 3) Slack Webhook 존재 여부만 (호출 금지)
    checks.slack = process.env.OPS_SLACK_WEBHOOK ? 'configured' : 'missing';

    // 4) 런타임 정보
    checks.runtime = {
      node: process.version,
      uptimeSec: Math.floor(process.uptime()),
      serverless: !!(process.env.VERCEL || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME)
    };

    return res.status(200).json({
      status: degraded ? 'degraded' : 'ok',
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      checks
    });
  } catch (fatal) {
    // 최후 방어: 절대 500 내지 않음
    return res.status(200).json({
      status: 'degraded',
      fatal: true,
      message: fatal.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ---------- Readiness Probe (no DB) ----------
app.get("/api/ready", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    started_at: SERVER_STARTED_AT,
    timestamp: new Date().toISOString()
  });
});

// ---------- Health (with DB) ----------
app.get("/api/health", async (req, res) => {
  let dbStatus = "DB 모듈 없음";
  let dbResponseMs = null;
  if (db) {
    const t0 = Date.now();
    try {
      await db.query('SELECT 1');
      dbStatus = "연결됨";
    } catch (error) {
      dbStatus = "연결 실패";
      console.error("DB 연결 오류:", error);
    }
    dbResponseMs = Date.now() - t0;
  }

  const rulesMeta = req.app.get('rulesSnapshot');

  // Playground DB 상태 확인 (AIL-510)
  let playgroundDbStatus = "not_configured";
  if (playgroundEngine && process.env.DATABASE_URL) {
    playgroundDbStatus = "configured";
  }

  const httpStatus = dbStatus === "연결 실패" ? 503 : 200;

  res.status(httpStatus).json({
    success: dbStatus !== "연결 실패",
    service: "daily-miracles-mvp",
    message: "여수 기적여행 API 서버가 정상 작동 중입니다",
    pid: process.pid,
    runtime_port: req.app.get('runtime_port') || null,
    env_port: process.env.PORT || null,
    started_at: SERVER_STARTED_AT,
    timestamp: new Date().toISOString(),
    database: dbStatus,
    db_response_ms: dbResponseMs,
    playground_db: playgroundDbStatus,
    version: "v3.0-debug",
    rules: rulesMeta ? {
      version: rulesMeta.versions?.mice?.version || null,
      hash: rulesMeta.hash || null,
      hash_algo: rulesMeta.hash_algo || null,
      bundle: rulesMeta.bundle || null,
      loaded_at: rulesMeta.loaded_at || null
    } : null,
    modules: {
      yeosuRoutes: yeosuRoutes !== null,
      db: db !== null,
      metrics: metricsService !== null,
      playground: playgroundEngine !== null,
      settlement: settlementEngine !== null
    }
  });
});

// ---------- Metrics API (관제탑) ----------
app.get("/api/metrics", (_req, res) => {
  if (!metricsService) {
    return res.status(503).json({
      success: false,
      error: "metrics_unavailable",
      message: "메트릭스 서비스가 로드되지 않았습니다"
    });
  }
  res.json({
    success: true,
    metrics: metricsService.getMetrics(),
    build: BUILD_INFO
  });
});

app.get("/api/metrics/report", (_req, res) => {
  if (!metricsService) {
    return res.status(503).json({
      success: false,
      error: "metrics_unavailable"
    });
  }
  res.type('text/plain').send(metricsService.generateDailyReport());
});

// ---------- Metrics Snapshot (Airtable 저장 + 이상 감지) ----------
app.post("/api/metrics/snapshot", async (_req, res) => {
  if (!metricsService) {
    return res.status(503).json({
      success: false,
      error: "metrics_unavailable"
    });
  }

  try {
    const metrics = metricsService.getMetrics();
    const report = metricsService.generateDailyReport();

    let airtableResult = { skipped: true, reason: 'service_not_loaded' };
    let alerts = [];

    if (airtableService) {
      // 1. Daily Health 스냅샷 저장
      airtableResult = await airtableService.saveDailySnapshot(metrics, report);

      // 2. 이상 감지 및 알림 발송
      alerts = await airtableService.checkAndAlert(metrics);
    }

    // 3. 메트릭스 파일 저장
    metricsService.saveMetrics();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        date: metrics.date,
        wishes_total: metrics.wishes.total,
        alimtalk_sent: metrics.alimtalk.sent,
        red: metrics.trafficLight.red
      },
      airtable: airtableResult,
      alerts: alerts.length,
      alertDetails: alerts
    });
  } catch (error) {
    console.error("💥 Snapshot 저장 실패:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ---------- Admin: ADMIN_TOKEN guard (reusable) ----------
function adminTokenGuard(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || token !== expected) {
    return res.status(403).json({ success: false, error: 'forbidden' });
  }
  next();
}

// ---------- Admin: Insert test wish entry ----------
app.post("/api/admin/test-wish-entry", adminTokenGuard, async (req, res) => {
  const { Pool } = require("pg");
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return res.status(503).json({ success: false, error: "DATABASE_URL not set" });

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes("localhost") ? false : { rejectUnauthorized: false }
  });

  try {
    const phone = req.body.phone || "01012345678";
    const name = req.body.name || "테스트소원이";
    const image_filename = req.body.image_filename || null;

    const crypto = require("crypto");
    const phoneHash = crypto.createHash("sha256").update(phone).digest("hex");

    const result = await pool.query(`
      INSERT INTO wish_entries (
        name, phone, phone_hash, wish_text, wish_category,
        miracle_index, traffic_light, energy_type, gem_type,
        want_message, privacy_agreed, marketing_agreed,
        tracking_token, image_filename, created_at
      ) VALUES (
        $1, $2, $3,
        '건강하고 행복한 하루를 보내고 싶어요', 'health',
        85, 'GREEN', 'calm', 'sapphire',
        TRUE, TRUE, TRUE,
        substr(md5(random()::text), 1, 16),
        $4,
        NOW() - INTERVAL '8 days'
      ) RETURNING id, name, phone, tracking_token, image_filename, created_at
    `, [name, phone, phoneHash, image_filename]);

    const entry = result.rows[0];
    console.log(`[Admin] Test wish entry created: ID=${entry.id}`);

    res.json({ success: true, entry });
  } catch (err) {
    console.error("[Admin] Test entry failed:", err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    await pool.end();
  }
});

// ---------- Admin: DB Migration Runner ----------
app.post("/api/admin/run-migration", adminTokenGuard, async (req, res) => {
  const { migration } = req.body; // e.g. "013", "035"
  const allowed = [
    "013", "022",
    // DreamTown migrations
    "029", "030", "031", "032", "033", "034", "035",
    "036", "037", "038", "039", "040", "042", "043",
    "044", "045", "046", "047", "048",
  ];

  if (!migration || !allowed.includes(migration)) {
    return res.status(400).json({
      success: false,
      error: `migration must be one of: ${allowed.join(", ")}`
    });
  }

  const { Pool } = require("pg");
  const fs = require("fs");
  const path = require("path");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return res.status(503).json({ success: false, error: "DATABASE_URL not set" });
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes("localhost") ? false : { rejectUnauthorized: false }
  });

  try {
    const sqlFile = path.join(__dirname, "database", "migrations", `${migration}_*.sql`);
    // resolve glob manually
    const migrationsDir = path.join(__dirname, "database", "migrations");
    const files = fs.readdirSync(migrationsDir).filter(f => f.startsWith(`${migration}_`) && f.endsWith(".sql"));

    if (files.length === 0) {
      return res.status(404).json({ success: false, error: `No SQL file found for migration ${migration}` });
    }

    const sqlPath = path.join(migrationsDir, files[0]);
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log(`[Migration] Running ${files[0]}...`);
    await pool.query(sql);
    console.log(`[Migration] ${files[0]} completed`);

    // verify
    let verification = {};
    if (migration === "013") {
      const tables = await pool.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name LIKE 'wish_%'
        ORDER BY table_name
      `);
      verification = { tables: tables.rows.map(r => r.table_name) };
    } else if (migration === "022") {
      const col = await pool.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'wish_entries' AND column_name = 'image_filename'
      `);
      verification = { column: col.rows[0] || "NOT FOUND" };
    } else if (migration === "035") {
      const col = await pool.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'dt_stars' AND column_name = 'growth_log_text'
      `);
      verification = { growth_log_text_exists: col.rowCount > 0 };
    } else if (migration === "042") {
      const tbl = await pool.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'aurora5_messages'
      `);
      verification = { aurora5_messages_exists: tbl.rowCount > 0 };
    } else if (migration === "043") {
      const tbl = await pool.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'dt_voyage_schedule'
      `);
      verification = { dt_voyage_schedule_exists: tbl.rowCount > 0 };
    } else if (migration === "045") {
      const tbls = await pool.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('dt_dream_logs','dt_artifact_jobs','dt_wisdom_logs')
        ORDER BY table_name
      `);
      verification = { tables: tbls.rows.map(r => r.table_name) };
    }

    res.json({ success: true, migration: files[0], verification });
  } catch (err) {
    console.error(`[Migration] Failed:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    await pool.end();
  }
});

// ---------- Admin: SENS 발송 결과 조회 ----------
app.get("/api/admin/sens-result", adminTokenGuard, async (req, res) => {
  const { requestId } = req.query;
  if (!requestId) {
    return res.status(400).json({ success: false, error: "requestId query param required" });
  }

  try {
    const mp = require("./services/messageProvider");
    const result = await mp.querySensResult(requestId);
    res.json(result);
  } catch (err) {
    console.error("[SENS Result Query] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- Ops Agent: Full Health Check (DEC-006) ----------
app.get("/api/admin/health/full", verifyAdmin, async (_req, res) => {
  if (!opsAgentService) {
    return res.status(503).json({
      success: false,
      error: "ops_agent_unavailable",
      message: "Ops Agent 서비스가 로드되지 않았습니다"
    });
  }

  try {
    const healthResult = await opsAgentService.runFullHealthCheck(db);
    res.json({
      success: true,
      ...healthResult
    });
  } catch (error) {
    console.error("💥 Ops Agent 헬스체크 실패:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ---------- Slack Heartbeat 상태 확인 ----------
app.get("/api/ops/heartbeat", (_req, res) => {
  if (!slackHeartbeatService) {
    return res.status(503).json({
      success: false,
      error: "heartbeat_unavailable",
      message: "Heartbeat 서비스가 로드되지 않았습니다"
    });
  }

  const status = slackHeartbeatService.getStatus();
  res.json({
    success: true,
    ...status
  });
});

// Heartbeat 수동 전송 (테스트/긴급용)
app.post("/api/ops/heartbeat/send", verifyAdmin, async (_req, res) => {
  if (!slackHeartbeatService) {
    return res.status(503).json({
      success: false,
      error: "heartbeat_unavailable"
    });
  }

  try {
    const result = await slackHeartbeatService.sendHeartbeat();
    res.json({
      success: result.success,
      channel: result.channel || null,
      error: result.error || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ---------- Ops Agent: Slack Report ----------
app.get("/api/admin/health/slack", verifyAdmin, async (_req, res) => {
  if (!opsAgentService) {
    return res.status(503).json({
      success: false,
      error: "ops_agent_unavailable"
    });
  }

  try {
    const healthResult = await opsAgentService.runFullHealthCheck(db);
    const slackReport = opsAgentService.generateSlackReport(healthResult);
    res.type('text/plain').send(slackReport);
  } catch (error) {
    console.error("💥 Slack 보고서 생성 실패:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ---------- Slack Events API (Aurora5 Bot) ----------
// 전역 express.json()에서 rawBody 저장됨 (verify 콜백)
app.post("/api/slack/events", async (req, res) => {
  if (!slackBotService) {
    return res.status(503).json({
      success: false,
      error: "slack_bot_unavailable"
    });
  }

  try {
    // req.body는 이미 파싱됨 (전역 express.json)
    // req.rawBody는 verify 콜백에서 저장됨 (Buffer)
    const { type, challenge, event } = req.body;

    console.log(`📥 Slack 요청 수신: type=${type}, event_type=${event?.type || 'N/A'}, rawBody=${req.rawBody ? 'OK' : 'MISSING'}`);

    // 1. URL Verification (Slack 앱 설정 시 필요) - 서명 검증 전에 처리
    if (type === 'url_verification') {
      console.log('✅ Slack URL verification (challenge 응답)');
      return res.json({ challenge });
    }

    // 2. 서명 검증 (rawBody 기반)
    if (!req.rawBody) {
      console.warn('❌ rawBody 없음 - 서명 검증 불가');
      return res.status(400).json({ error: 'Missing raw body' });
    }

    if (!slackBotService.verifySlackSignature(req.rawBody, req.headers)) {
      console.warn('❌ Slack 서명 검증 실패 - 401 반환');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('✅ Slack 서명 검증 통과');

    // 3. 이벤트 처리 (비동기로 응답 후 처리)
    res.status(200).send('OK'); // Slack은 3초 내 응답 필요

    if (type === 'event_callback' && event) {
      console.log(`🔔 이벤트 콜백 처리 시작: ${event.type}`);

      // 채널 정보 조회
      const channelInfo = await slackBotService.getChannelInfo(event.channel);
      console.log(`📍 채널 정보 조회 결과:`, channelInfo ? channelInfo.name : 'null');

      // 이벤트 처리 (headers 전달 - rate-limit/retry 체크용)
      const result = await slackBotService.handleSlackEvent(event, channelInfo, req.headers);
      console.log('🤖 Slack 이벤트 처리 결과:', JSON.stringify(result));
    } else {
      console.log(`⚠️ 처리하지 않는 이벤트: type=${type}`);
    }

  } catch (error) {
    console.error("💥 Slack 이벤트 처리 실패:", error.message, error.stack);
    // 이미 응답을 보냈으면 로깅만, 아니면 에러 응답
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal error' });
    }
  }
});

// ---------- Funnel Report API (퍼널 일일 리포트) ----------
let funnelReport = null;
try {
  funnelReport = require('./scripts/ops/funnel-daily-report');
} catch (error) {
  console.warn('⚠️ Funnel report 모듈 로드 실패:', error.message);
}

app.post("/api/ops/funnel-report", async (req, res) => {
  if (!funnelReport) {
    return res.status(503).json({
      success: false,
      error: "funnel_report_unavailable",
      message: "퍼널 리포트 모듈이 로드되지 않았습니다"
    });
  }

  try {
    const { date, range, format, env } = req.body || {};

    const options = {
      date: date || null,
      range: range || 1,
      env: env || 'prod'  // 기본값: prod (테스트 이벤트 제외)
    };

    console.log(`📊 퍼널 리포트 생성 요청: ${JSON.stringify(options)}`);
    const result = await funnelReport.generateFunnelReport(options);

    // 알람 추출
    const alerts = result.funnel
      .filter(f => f.status === 'ALERT')
      .map(f => ({
        metric: f.name,
        rate: f.rate,
        threshold: f.threshold?.floor,
        alerts: f.alerts
      }));

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      dateFrom: result.dateFrom,
      dateTo: result.dateTo,
      env: result.env,
      oneLine: result.oneLine,
      data: result.data,
      funnel: result.funnel,
      integrity: result.integrity?.overall || null,
      alerts: alerts.length,
      alertDetails: alerts,
      format: format === 'markdown' ? result.markdown : undefined
    });

    console.log(`✅ 퍼널 리포트 생성 완료 [${result.env}]: ${result.oneLine}`);
  } catch (error) {
    console.error("💥 퍼널 리포트 생성 실패:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get("/api/ops/funnel-report", async (req, res) => {
  if (!funnelReport) {
    return res.status(503).json({
      success: false,
      error: "funnel_report_unavailable"
    });
  }

  try {
    const { date, range, env } = req.query;

    const options = {
      date: date || null,
      range: parseInt(range, 10) || 1,
      env: env || 'prod'  // 기본값: prod (테스트 이벤트 제외)
    };

    const result = await funnelReport.generateFunnelReport(options);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      dateFrom: result.dateFrom,
      dateTo: result.dateTo,
      env: result.env,
      oneLine: result.oneLine,
      data: result.data,
      funnel: result.funnel,
      integrity: result.integrity?.overall || null
    });
  } catch (error) {
    console.error("💥 퍼널 리포트 조회 실패:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ---------- Diag (서버가 실제로 받은 것 그대로 보여줌) ----------
app.all("/diag/echo", (req, res) => {
  res.json({
    method: req.method,
    path: req.originalUrl,
    headers: req.headers,
    body: req.body,
    ts: new Date().toISOString()
  });
});

// ---------- Debug: 파일 시스템 확인 ----------
app.get("/diag/files", (req, res) => {
  const fs = require("fs");
  const path = require("path");

  try {
    const diagnostics = {
      cwd: process.cwd(),
      __dirname,
      yeosuRoutesLoaded: yeosuRoutes !== null,
      dbLoaded: db !== null,
      files: {
        routesDir: fs.existsSync(path.join(__dirname, "routes")),
        yeosuRoutesFile: fs.existsSync(path.join(__dirname, "routes", "yeosuRoutes.js")),
        databaseDir: fs.existsSync(path.join(__dirname, "database")),
        dbFile: fs.existsSync(path.join(__dirname, "database", "db.js"))
      }
    };

    if (fs.existsSync(path.join(__dirname, "routes"))) {
      diagnostics.routesContents = fs.readdirSync(path.join(__dirname, "routes"));
    }

    if (fs.existsSync(path.join(__dirname, "database"))) {
      diagnostics.databaseContents = fs.readdirSync(path.join(__dirname, "database"));
    }

    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// ---------- 인증 API Routes ----------
if (authRoutes) {
  app.use("/api/auth", authRoutes);
  console.log("✅ 인증 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 인증 API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 여수 기적여행 API Routes ----------
if (yeosuRoutes) {
  app.use("/api", yeosuRoutes);
  console.log("✅ 여수 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 여수 API 라우터 로드 실패 - 라우트 미등록");
}
// ---------- 소원항해 지수 API Routes ----------
if (wishVoyageRoutes) {
  app.use("/api/wish-voyage", wishVoyageRoutes);
  console.log("✅ 소원항해 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 소원항해 API 라우터 로드 실패 - 라우트 미등록");
}
// ---------- 문제 해결 API Routes ----------
if (problemRoutes) {
  app.use("/api/problem", problemRoutes);
  console.log("✅ 문제 해결 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 문제 해결 API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- MVP 1차 폼 (간편 접수) API Routes ----------
if (inquiryRoutes) {
  app.use("/api/inquiry", inquiryRoutes);
  console.log("✅ 간편 접수 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 간편 접수 API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 소원실현 폼 API Routes ----------
if (wishRoutes) {
  app.use("/api/wishes", wishRoutes);
  console.log("✅ 소원실현 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 소원실현 API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Wish Intake 7문항 API Routes (P0-02) ----------
if (wishIntakeRoutes) {
  app.use("/api/wish-intake", wishIntakeRoutes);
  console.log("✅ Wish Intake API 라우터 등록 완료");
} else {
  console.warn("⚠️ Wish Intake API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 소원그림 생성 API Routes ----------
if (wishImageRoutes) {
  app.use("/api/wish-image", wishImageRoutes);
  console.log("✅ 소원그림 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 소원그림 API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 성장필름 챌린지 Routes (/api/challenge/*) ----------
if (challengeRoutes) {
  const db = require('./database/db');
  app.use('/api/challenge', challengeRoutes.init(db));
  console.log('✅ 성장필름 챌린지 라우터 등록 완료 (/api/challenge)');
} else {
  console.warn('⚠️ 성장필름 챌린지 라우터 미등록');
}

// ---------- BE-3: GET /api/me/temperature (AIL-111) ----------
// routine_temp: temperature_state.temperature (attendanceService 루틴 온도)
// social_temp:  temperature_state.social_temperature (기적나눔 수신 누적)
app.get('/api/me/temperature', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    const dbInstance = require('./database/db');
    const result = await dbInstance.query(
      'SELECT temperature, social_temperature FROM temperature_state WHERE user_id = $1',
      [userId]
    );

    const row = result.rows[0] || {};
    const routineTemp = Number(Number(row.temperature ?? 36.5).toFixed(2));
    const socialTemp = Number(Number(row.social_temperature ?? 25.0).toFixed(1));

    // 마일스톤 체크
    let milestone = null;
    if (routineTemp >= 36.5) {
      milestone = { at_36_5: true, message: '소원이 당신의 일부가 되었어요' };
    }

    return res.json({ routine_temp: routineTemp, social_temp: socialTemp, milestone });
  } catch (err) {
    console.error('[ME/Temperature] 조회 오류:', err.message);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ---------- 입항 증명서 API Routes ----------
if (certificateRoutes) {
  app.use("/api/certificate", certificateRoutes);
  console.log("✅ 입항 증명서 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 입항 증명서 API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 메시지 발송 진단 API Routes ----------
if (notifyRoutes) {
  app.use("/api/notify", notifyRoutes);
  console.log("✅ 메시지 진단 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 메시지 진단 API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Aurora5 자동화 엔진 API Routes ----------
if (aurora5Routes) {
  app.use("/", aurora5Routes); // 루트에 마운트 (webhooks, api, jobs, admin 포함)
  console.log("✅ Aurora5 API 라우터 등록 완료");
} else {
  console.warn("⚠️ Aurora5 API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 토론 자동화 API Routes ----------
if (debateRoutes) {
  app.use("/api/debate", debateRoutes);
  console.log("✅ 토론 자동화 API 라우터 등록 완료");
} else {
  console.warn("⚠️ 토론 자동화 API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 웹훅 Routes ----------
if (webhookRoutes) {
  app.use("/webhooks", webhookRoutes);
  console.log("✅ 웹훅 라우터 등록 완료");
} else {
  console.warn("⚠️ 웹훅 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 여정 파이프라인 Routes ----------
if (journeyRoutes) {
  app.use("/api/journey", journeyRoutes);
  console.log("✅ 여정 파이프라인 라우터 등록 완료");
} else {
  console.warn("⚠️ 여정 파이프라인 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Aurora 5 에이전트 Routes ----------
if (agentRoutes) {
  app.use("/api/agents", agentRoutes);
  console.log("✅ Aurora 5 에이전트 라우터 등록 완료");
} else {
  console.warn("⚠️ Aurora 5 에이전트 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 배치 처리 Routes ----------
if (batchRoutes) {
  app.use("/api/batch", batchRoutes);
  console.log("✅ 배치 처리 라우터 등록 완료");
} else {
  console.warn("⚠️ 배치 처리 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 스토리북 E2E Commerce Routes ----------
if (storybookRoutes) {
  app.use("/api/storybook", storybookRoutes);
  console.log("✅ 스토리북 라우터 등록 완료");
} else {
  console.warn("⚠️ 스토리북 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 여수 소원항해 견적 시스템 v2.0 Routes ----------
if (quoteRoutes) {
  app.use("/api/v2/quote", quoteRoutes);
  console.log("✅ 견적 시스템 라우터 등록 완료 (/api/v2/quote)");
} else {
  console.warn("⚠️ 견적 시스템 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 4인 이하 자동 일정 생성 Routes ----------
if (itineraryRoutes) {
  app.use("/api/v2/itinerary", itineraryRoutes);
  console.log("✅ 일정 생성 라우터 등록 완료 (/api/v2/itinerary)");
} else {
  console.warn("⚠️ 일정 생성 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Wix 자유여행 견적 요청 Routes ----------
if (quoteRequestRoutes) {
  app.use("/api/quote", quoteRequestRoutes);
  console.log("✅ Wix 견적 요청 라우터 등록 완료 (/api/quote/request)");
} else {
  console.warn("⚠️ Wix 견적 요청 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 단축 링크 Routes (/r/{token}) ----------
if (shortLinkRoutes) {
  app.use("/r", shortLinkRoutes);
  console.log("✅ 단축 링크 라우터 등록 완료 (/r/:token)");
} else {
  console.warn("⚠️ 단축 링크 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 운영 시스템 Routes (/ops, /api/ops) ----------
if (opsRoutes) {
  app.use("/ops", opsRoutes);
  app.use("/api/ops", opsRoutes);  // P0: API 경로도 지원
  console.log("✅ 운영 시스템 라우터 등록 완료 (/ops/health, /api/ops/report/daily)");
} else {
  console.warn("⚠️ 운영 시스템 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 30일 프로그램 결제 Routes (/api/program) ----------
if (programRoutes) {
  app.use("/api/program", programRoutes);
  console.log("✅ 30일 프로그램 라우터 등록 완료 (/api/program)");
} else {
  console.warn("⚠️ 30일 프로그램 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 여수 소원빌기 체험 Routes (/api/yeosu/wish) ----------
if (yeosuWishRoutes) {
  app.use("/api/yeosu/wish", yeosuWishRoutes);
  console.log("✅ 여수 소원빌기 라우터 등록 완료 (/api/yeosu/wish)");
} else {
  console.warn("⚠️ 여수 소원빌기 라우터 로드 실패 - 라우트 미등록");
}

// ---------- RepoPulse Routes (/api/repopulse) ----------
if (repoPulseRoutes) {
  app.use("/api/repopulse", repoPulseRoutes);
  console.log("✅ RepoPulse 라우터 등록 완료 (/api/repopulse/github, /api/repopulse/render)");
} else {
  console.warn("⚠️ RepoPulse 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Chat Log Routes (/api/chat-log) ----------
if (chatLogRoutes) {
  app.use("/api/chat-log", chatLogRoutes);
  console.log("✅ Chat Log 라우터 등록 완료 (/api/chat-log/save)");
} else {
  console.warn("⚠️ Chat Log 라우터 로드 실패 - 라우트 미등록");
}

// ---------- RAW Process Routes (/api/raw) ----------
if (rawProcessRoutes) {
  app.use("/api/raw", rawProcessRoutes);
  console.log("✅ RAW Process 라우터 등록 완료 (/api/raw/process, /api/raw/health)");
} else {
  console.warn("⚠️ RAW Process 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Drive→GitHub Sync Routes (/api/sync) ----------
if (driveGitHubSyncRoutes) {
  app.use("/api/sync", driveGitHubSyncRoutes);
  console.log("✅ Drive→GitHub Sync 라우터 등록 완료 (/api/sync/run, /api/sync/health, /api/sync/status)");
} else {
  console.warn("⚠️ Drive→GitHub Sync 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Storyboard 배치 Routes (/api/storyboard) ----------
if (storyboardRoutes) {
  app.use("/api/storyboard", storyboardRoutes);
  console.log("✅ Storyboard 배치 라우터 등록 완료 (/api/storyboard)");
} else {
  console.warn("⚠️ Storyboard 배치 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Shorts 자동 생성 Routes (/api/shorts) ----------
if (shortsRoutes) {
  app.use("/api/shorts", shortsRoutes);
  console.log("✅ Shorts 라우터 등록 완료 (/api/shorts)");
} else {
  console.warn("⚠️ Shorts 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Hero8 8초 영상 생성 Routes (/api/video/hero8) ----------
if (hero8Routes) {
  app.use("/api/video/hero8", hero8Routes);
  // output 폴더 정적 서빙 (영상 다운로드용)
  app.use("/output", express.static(path.join(__dirname, "output"), {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
      } else if (filePath.endsWith('.zip')) {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment');
      }
    }
  }));
  console.log("✅ Hero8 영상 라우터 등록 완료 (/api/video/hero8, /output)");
} else {
  console.warn("⚠️ Hero8 영상 라우터 로드 실패 - 라우트 미등록");
}

// ---------- VideoJob 오케스트레이터 Routes (/api/video/job) ----------
if (videoJobRoutes) {
  app.use("/api/video/job", videoJobRoutes);
  console.log("✅ VideoJob 라우터 등록 완료 (/api/video/job)");
} else {
  console.warn("⚠️ VideoJob 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Aurora Video Job Routes (/api/video-jobs) ----------
if (auroraJobRoutes) {
  app.use("/", auroraJobRoutes);
  console.log("✅ Aurora Job 라우터 등록 완료 (/api/video-jobs)");
} else {
  console.warn("⚠️ Aurora Job 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 기적 금고 Finance Routes (/api/finance) ----------
if (financeRoutes) {
  app.use("/api/finance", financeRoutes);
  console.log("✅ 기적 금고(Finance) 라우터 등록 완료 (/api/finance)");
} else {
  console.warn("⚠️ 기적 금고(Finance) 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 포인트 시스템 Routes (/api/points) - Aurora5 v2.6 ----------
if (pointRoutes) {
  app.use("/api/points", pointRoutes);
  console.log("✅ 포인트 시스템 라우터 등록 완료 (/api/points)");
} else {
  console.warn("⚠️ 포인트 시스템 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 리워드(예고편 교환) Routes (/api/rewards) - Aurora5 v2.6 ----------
if (rewardRoutes) {
  app.use("/api/rewards", rewardRoutes);
  console.log("✅ 리워드(예고편) 라우터 등록 완료 (/api/rewards)");
} else {
  console.warn("⚠️ 리워드(예고편) 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 추천 시스템 Routes (/api/referral) - Aurora5 v2.6 ----------
if (referralRoutes) {
  app.use("/api/referral", referralRoutes);
  console.log("✅ 추천 시스템 라우터 등록 완료 (/api/referral)");
} else {
  console.warn("⚠️ 추천 시스템 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 어드민 포인트/추천 관리 Routes (/api/admin) - Aurora5 v2.6 ----------
if (adminPointRoutes) {
  app.use("/api/admin", adminPointRoutes);
  console.log("✅ 어드민 포인트 라우터 등록 완료 (/api/admin/points, /api/admin/referral)");
} else {
  console.warn("⚠️ 어드민 포인트 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 일일 체크 Routes (/api/daily) - Aurora5 v2.6 Gap ----------
if (dailyCheckRoutes) {
  app.use("/api/daily", dailyCheckRoutes);
  console.log("✅ 일일 체크 라우터 등록 완료 (/api/daily/checkin, /api/daily/action, /api/daily/log)");
} else {
  console.warn("⚠️ 일일 체크 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 몰트봇 Routes (/api/maltbot) ----------
if (maltbotRoutes) {
  app.use("/api/maltbot", maltbotRoutes);
  console.log("✅ 몰트봇 라우터 등록 완료 (/api/maltbot/generate, /api/maltbot/cases)");
} else {
  console.warn("⚠️ 몰트봇 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 나이스페이 결제 Routes (/pay, /nicepay/return, /api/payments/verify) ----------
if (nicepayRoutes) {
  app.use("/", nicepayRoutes);
  console.log("✅ 나이스페이 라우터 등록 완료 (/pay, /nicepay/return, /api/payments/verify)");
} else {
  console.warn("⚠️ 나이스페이 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 소원항해단 v3.1-MVP Routes (/anon/bootstrap, /harbor/*) ----------
if (harborRoutes) {
  app.use("/", harborRoutes);
  console.log("✅ 소원항해단(Harbor) 라우터 등록 완료 (/anon/bootstrap, /harbor/wishes, /harbor/lighthouse, /harbor/temperature)");
} else {
  console.warn("⚠️ 소원항해단(Harbor) 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 여수 운영 컨트롤타워 OS v0 Routes (/api/ops-center/*) ----------
if (yeosuOpsRoutes) {
  app.use("/api/ops-center", yeosuOpsRoutes);
  console.log("✅ 여수 운영 컨트롤타워(Ops Center) 라우터 등록 완료 (/api/ops-center)");
} else {
  console.warn("⚠️ 여수 운영 컨트롤타워(Ops Center) 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 소원 추적 시스템 Routes (/api/wish-tracking/*) - 바이럴 루프 #2 ----------
if (wishTrackingRoutes) {
  // 서비스 초기화 (DB 연결 시)
  if (process.env.DATABASE_URL) {
    try {
      const { Pool } = require("pg");
      const trackingPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
      });
      const WishTrackingService = require("./services/wishTrackingService");
      const trackingService = new WishTrackingService(trackingPool);
      wishTrackingRoutes.init({
        trackingService,
        messageProvider: wishTrackingMessageProvider || null
      });
      console.log("✅ 소원 추적 서비스 DB 연결 완료");
    } catch (err) {
      console.warn("⚠️ 소원 추적 서비스 DB 연결 실패:", err.message);
      wishTrackingRoutes.init({ trackingService: null, messageProvider: null });
    }
  } else {
    wishTrackingRoutes.init({ trackingService: null, messageProvider: null });
  }
  app.use("/api/wish-tracking", wishTrackingRoutes);
  console.log("✅ 소원 추적 시스템 라우터 등록 완료 (/api/wish-tracking)");
} else {
  console.warn("⚠️ 소원 추적 시스템 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 실시간 카운터 Routes (/api/live/*) - 바이럴 루프 #4: 네트워크 효과 ----------
if (liveCounterRoutes) {
  // 서비스 초기화 (DB 없어도 기본 기능 제공)
  if (process.env.DATABASE_URL) {
    try {
      const { Pool } = require("pg");
      const counterPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
      });
      const LiveCounterService = require("./services/liveCounterService");
      const counterService = new LiveCounterService(counterPool);
      liveCounterRoutes.init(counterService);
      console.log("✅ 실시간 카운터 서비스 DB 연결 완료");
    } catch (err) {
      console.warn("⚠️ 실시간 카운터 서비스 DB 연결 실패:", err.message);
      liveCounterRoutes.init(null);
    }
  } else {
    liveCounterRoutes.init(null); // DB 없이도 기본 기능 제공
  }
  app.use("/api/live", liveCounterRoutes);
  console.log("✅ 실시간 카운터 라우터 등록 완료 (/api/live)");
} else {
  console.warn("⚠️ 실시간 카운터 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 소원놀이터 Routes (/api/playground/*) ----------
// AIL-510/511: 도메인 SSOT - Playground는 app 도메인 전용
// pay.dailymiracles.kr에서 Playground API 요청 시 안내 메시지 반환
app.use('/api/playground', (req, res, next) => {
  const host = req.get('host') || '';
  if (host.includes('pay.dailymiracles.kr')) {
    return res.status(400).json({
      success: false,
      error: 'wrong_domain',
      message: 'Playground API는 app.dailymiracles.kr에서 사용하세요.',
      redirect: `https://app.dailymiracles.kr${req.originalUrl}`
    });
  }
  next();
});

if (playgroundRoutes && playgroundEngine) {
  // DB 연결 시 서비스 초기화
  if (process.env.DATABASE_URL) {
    try {
      const { Pool } = require("pg");
      const playgroundPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
      });
      playgroundEngine.init(playgroundPool);
      playgroundRoutes.init({ playground: playgroundEngine });
      console.log("✅ 소원놀이터 서비스 DB 연결 완료");
    } catch (err) {
      console.warn("⚠️ 소원놀이터 서비스 DB 연결 실패:", err.message);
      playgroundRoutes.init({ playground: null });
    }
  } else {
    playgroundRoutes.init({ playground: null });
  }

  // 상태 확인 엔드포인트
  app.get("/api/playground/status", async (req, res) => {
    try {
      let dbStatus = "not_configured";
      let tableCount = 0;

      if (process.env.DATABASE_URL) {
        const { Pool } = require("pg");
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
        });
        try {
          const result = await pool.query(`
            SELECT COUNT(*) as count FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('playground_users', 'artifacts', 'artifact_scores',
              'artifact_reactions', 'shares', 'share_views', 'rewards',
              'artifact_reports', 'user_badges', 'artifact_help_scores')
          `);
          tableCount = parseInt(result.rows[0].count);
          dbStatus = tableCount === 10 ? "ok" : "partial";
          await pool.end();
        } catch (dbErr) {
          dbStatus = "error: " + dbErr.message;
        }
      }

      res.json({
        status: "ok",
        service: "playground",
        db: dbStatus,
        migration: "014_playground_engine",
        tables: tableCount,
        expected_tables: 10,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  app.use("/api/playground", playgroundRoutes);
  console.log("✅ 소원놀이터 라우터 등록 완료 (/api/playground)");
} else {
  console.warn("⚠️ 소원놀이터 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Settlement v2 라우트 등록 ----------
if (settlementRoutes && settlementEngine) {
  // DB 연결 시 엔진 초기화
  if (db) {
    settlementEngine.init(db).catch(err => {
      console.error("❌ Settlement 엔진 초기화 실패:", err.message);
    });
  }
  settlementRoutes.init({ settlement: settlementEngine });
  app.use("/api/settlement", settlementRoutes);
  console.log("✅ Settlement 라우터 등록 완료 (/api/settlement)");
} else {
  console.warn("⚠️ Settlement 라우터 로드 실패 - 라우트 미등록");
}

// ---------- WU (Aurora5 통합 엔진) API Routes ----------
if (wuRoutes) {
  app.use("/api/wu", wuRoutes);
  console.log("✅ WU API 라우터 등록 완료 (/api/wu)");
} else {
  console.warn("⚠️ WU API 라우터 로드 실패 - 라우트 미등록");
}

// ---------- 8-Mode Diagnostic + Marketing Segment (P1-SSOT) ----------
let modeDiagnosticRoutes = null;
try {
  modeDiagnosticRoutes = require("./routes/modeDiagnosticRoutes");
  console.log("✅ Mode Diagnostic 라우터 로드 성공");
} catch (error) {
  console.warn("⚠️ Mode Diagnostic 라우터 로드 실패:", error.message);
}
if (modeDiagnosticRoutes) {
  // In-memory store for today's diagnoses (v1, DB in v2)
  global._modeDiagnosticStore = global._modeDiagnosticStore || new Map();
  app.use("/api/mode", modeDiagnosticRoutes);
  console.log("✅ Mode Diagnostic 라우터 등록 완료 (/api/mode)");
} else {
  console.warn("⚠️ Mode Diagnostic 라우터 미등록");
}

// ---------- Diagnostic API v1 (SSOT-locked, weight-matrix scoring) ----------
let diagnosticV1Routes = null;
try {
  diagnosticV1Routes = require("./routes/diagnosticV1Routes");
  console.log("✅ Diagnostic v1 라우터 로드 성공");
} catch (error) {
  console.warn("⚠️ Diagnostic v1 라우터 로드 실패:", error.message);
}
if (diagnosticV1Routes) {
  global._diagV1Store = global._diagV1Store || new Map();
  app.use("/v1/diagnostic", diagnosticV1Routes);
  app.use("/v1/marketing", diagnosticV1Routes);
  console.log("✅ Diagnostic v1 라우터 등록 완료 (/v1/diagnostic, /v1/marketing)");
} else {
  console.warn("⚠️ Diagnostic v1 라우터 미등록");
}

// ---------- Attendance (Living Wisdom 출석/체온) Routes ----------
if (attendanceRoutes) {
  app.use("/api/attendance", attendanceRoutes);
  console.log("✅ Attendance 라우터 등록 완료 (/api/attendance)");
} else {
  console.warn("⚠️ Attendance 라우터 로드 실패 - 라우트 미등록");
}

// ---------- Experiment Event Routes ----------
if (experimentEventRoutes) {
  app.use("/api/experiment", experimentEventRoutes);
  console.log("✅ Experiment Event 라우터 등록 완료 (/api/experiment)");
} else {
  console.warn("⚠️ Experiment Event 라우터 미등록");
}

// ---------- DreamTown Routes ----------
const dreamtownRoutes = require('./routes/dreamtownRoutes');
app.use('/api/dt', dreamtownRoutes);
console.log('✅ DreamTown 라우터 등록 완료 (/api/dt)');

// ---------- 실물책 제작 신청 API ----------
// POST /api/book/upgrade — 디지털북 → 실물책 전환 신청 (관심 등록)
app.post('/api/book/upgrade', async (req, res) => {
  const { star_id, user_id, phone = null } = req.body;
  if (!star_id) return res.status(400).json({ error: 'star_id는 필수입니다' });

  const requestId = `book-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  console.info(JSON.stringify({
    requestId,
    user_id:  user_id ?? null,
    star_id,
    phone:    phone ? '***' : null,
    action:   'book_upgrade_click',
    ts:       new Date().toISOString(),
  }));

  try {
    const db = require('./database/db');
    // dt_dream_logs에 book_interest 이벤트 기록 (append-only 원장 패턴)
    await db.query(
      `INSERT INTO dt_dream_logs (star_id, log_type, payload)
       VALUES ($1, 'voyage', $2)`,
      [star_id, JSON.stringify({
        event:      'book_upgrade_interest',
        user_id:    user_id ?? null,
        phone:      phone ?? null,
        request_id: requestId,
      })]
    );
  } catch (dbErr) {
    // DB 실패해도 신청 자체는 성공 응답 (로그는 남김)
    console.warn('[book/upgrade] DB 저장 실패:', dbErr.message);
  }

  return res.status(201).json({
    success:    true,
    request_id: requestId,
    message:    '실물책 제작 신청이 접수되었습니다. 담당자가 곧 연락드립니다.',
  });
});

// ---------- 작품 전환 상담 신청 API (6개월 게이트) ----------
// POST /api/book/inquiry — days >= 180 사용자 작품 전환 의사 접수
app.post('/api/book/inquiry', async (req, res) => {
  const { star_id, user_id, phone = null, days_since_start = null } = req.body;
  if (!star_id) return res.status(400).json({ error: 'star_id는 필수입니다' });

  const requestId = `inquiry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  console.info(JSON.stringify({
    requestId, user_id, star_id,
    phone:            phone ? '***' : null,
    days_since_start: days_since_start ?? null,
    action:           'book_inquiry_submit',
    ts:               new Date().toISOString(),
  }));

  try {
    const db = require('./database/db');
    await db.query(
      `INSERT INTO dt_dream_logs (star_id, log_type, payload)
       VALUES ($1, 'voyage', $2)`,
      [star_id, JSON.stringify({
        event:            'book_inquiry_submit',
        user_id:          user_id ?? null,
        phone:            phone ?? null,
        days_since_start: days_since_start ?? null,
        request_id:       requestId,
      })]
    );
  } catch (dbErr) {
    console.warn('[book/inquiry] DB 저장 실패:', dbErr.message);
  }

  return res.status(201).json({
    success:    true,
    request_id: requestId,
    message:    '상담 신청이 접수되었습니다. 담당 작가가 곧 연락드립니다.',
  });
});

// ---------- DreamTown Core Engine Routes (DEC-2026-0331-001) ----------
try {
  const dtEngineRoutes = require('./routes/dtEngineRoutes');
  app.use('/api/dt/engine', dtEngineRoutes);
  console.log('✅ DreamTown Core Engine 라우터 등록 완료 (/api/dt/engine)');
} catch (err) {
  console.warn('⚠️ DreamTown Core Engine 라우터 등록 실패:', err.message);
}

// ---------- DreamTown Artifact Worker (DB 기반 큐) ----------
try {
  const dtArtifactWorker = require('./services/dtArtifactWorker');
  dtArtifactWorker.start();
} catch (err) {
  console.warn('⚠️ dtArtifactWorker 시작 실패:', err.message);
}

// ---------- DreamTown Narrative Worker (DB 기반 큐) ----------
try {
  const dtNarrativeWorker = require('./services/dtNarrativeWorker');
  dtNarrativeWorker.start();
} catch (err) {
  console.warn('⚠️ dtNarrativeWorker 시작 실패:', err.message);
}

// ---------- Aurora5 Orchestrator Worker (이벤트 기반 자동화) ----------
try {
  const dtOrchestratorWorker = require('./services/dtOrchestratorWorker');
  dtOrchestratorWorker.start();
  console.log('✅ Aurora5 Orchestrator Worker 시작 완료');
} catch (err) {
  console.warn('⚠️ dtOrchestratorWorker 시작 실패:', err.message);
}

// ---------- Resonance & Impact Routes ----------
const resonanceRoutes = require('./routes/resonanceRoutes');
app.use('/api/resonance', resonanceRoutes);
console.log('✅ 공명 & 나눔 라우터 등록 완료 (/api/resonance)');

// ---------- KPI Dashboard Routes ----------
const kpiRoutes = require('./routes/kpiRoutes');
app.use('/api/kpi', kpiRoutes);
console.log('✅ KPI 대시보드 라우터 등록 완료 (/api/kpi)');

// ---------- Feedback Routes ----------
const feedbackRoutes = require('./routes/feedbackRoutes');
app.use('/api/feedback', feedbackRoutes);
console.log('✅ 피드백 라우터 등록 완료 (/api/feedback)');

// ---------- DreamTown Frontend (Prototype) ----------
const dtFrontendPath = path.join(__dirname, 'dreamtown-frontend', 'dist');
app.use('/dreamtown', express.static(dtFrontendPath, {
  setHeaders: (res, filePath) => {
    // index.html은 절대 캐시 안 함 — 구버전 JS/CSS 해시 참조 방지
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (filePath.includes('/images/')) {
      // 이미지는 파일명 해시 없음 → 교체 시 브라우저가 재검증하도록
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    } else {
      // 해시된 JS/CSS assets — 장기 캐시 OK (파일명에 해시 포함)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// DreamTown SPA 라우트 — /dreamtown/* 및 React Router 직접 경로
const DT_SPA_ROUTES = [
  '/dreamtown', '/dreamtown/*',
  '/galaxy', '/day', '/star', '/star-growth',
  '/postcard', '/history', '/intro',
  '/star-birth', '/my-star', '/my-star/*', '/home',
  '/star/*', '/dashboard', '/wish',
];
app.get(DT_SPA_ROUTES, (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(dtFrontendPath, 'index.html'), (err) => {
    if (err) {
      console.error('[DT] SPA sendFile 실패 — dist 미존재 가능:', err.message);
      res.status(503).send('<html><body><h2>DreamTown 준비 중입니다. 잠시 후 다시 시도해주세요.</h2></body></html>');
    }
  });
});
console.log('✅ DreamTown 프론트 등록 완료 (/dreamtown + /galaxy 등)');

// ---------- Entitlement 보호 라우트 (/api/daily-messages, /api/roadmap) ----------
// P0 요구사항: Trial 또는 Paid 권한이 있어야만 접근 가능
if (entitlementMiddleware) {
  const { requireEntitlement } = entitlementMiddleware;

  // /api/daily-messages - 응원 메시지 조회 (Trial 권한 필요)
  app.get("/api/daily-messages", requireEntitlement('trial'), async (req, res) => {
    try {
      // TODO: 실제 응원 메시지 조회 로직 구현
      res.json({
        success: true,
        user: req.user,
        messages: [
          { day: 1, morning: "오늘도 좋은 하루 되세요!", evening: "오늘 하루도 수고했어요." }
        ],
        message: "응원 메시지 API (개발 중)"
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // /api/roadmap - 30일 로드맵 조회 (Trial 권한 필요)
  app.get("/api/roadmap", requireEntitlement('trial'), async (req, res) => {
    try {
      // TODO: 실제 로드맵 조회 로직 구현
      res.json({
        success: true,
        user: req.user,
        roadmap: {
          totalDays: 30,
          currentDay: 1,
          milestones: []
        },
        message: "로드맵 API (개발 중)"
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  console.log("✅ Entitlement 보호 라우터 등록 완료 (/api/daily-messages, /api/roadmap)");
} else {
  console.warn("⚠️ Entitlement 미들웨어 로드 실패 - 보호 라우트 미등록");
}

// ---------- Tolerant extractor ----------
function extractUserInput(body) {
  const wrapper = body && typeof body === "object" ? body : {};
  const data = wrapper.userInput && typeof wrapper.userInput === "object" ? wrapper.userInput : wrapper;

  const wish =
    data.wish ??
    data.concern ??
    data.problem ??
    data.goal ??
    data.desire ??
    data.target ??
    data.message ??
    null;

  return { data, wish };
}

// ---------- Core handler (analyze/create 공용) ----------
async function coreAnalyzeHandler(req, res) {
  const startTime = Date.now();

  try {
    const { data, wish } = extractUserInput(req.body);

    if (!wish) {
      return res.status(400).json({
        error: "Missing required field: wish",
        hint:
          "본문 예시 1) { userInput: { wish: '관계를 개선하고 싶어요' } }\n" +
          "본문 예시 2) { concern: '요즘 대화가 자주 어긋나요' }",
        received: req.body
      });
    }

    console.log("🎯 analyze called via:", req.path);
    console.log("📥 wish:", wish);
    console.log("🔍 Starting analysis engine...");

    // ✅ 실제 분석 엔진 호출
    const userProfile = analysisEngine.analyzeUserProfile(data);
    console.log("✅ User profile analyzed - miracleIndex:", userProfile.miracleIndex);

    // 기적지수 → 현재 단계 매핑 (4단계)
    const _idx = userProfile.miracleIndex || 75;
    userProfile.current_stage = _idx < 65
      ? { code: 1, label: '감정 정리', desc: '마음이 먼저 지쳐 있어 감정 정리가 먼저 필요한 상태예요.' }
      : _idx < 75
        ? { code: 2, label: '방향 정리', desc: '중요한 것은 느끼고 있지만 무엇부터 해야 할지 정해지지 않아 에너지가 흩어지기 쉬워요.' }
        : _idx < 85
          ? { code: 3, label: '실행 시작', desc: '방향은 잡혔고, 이제는 아주 작은 행동으로 흐름을 시작할 차례예요.' }
          : { code: 4, label: '유지 회복', desc: '이미 시작은 했지만 흔들림이 생기기 쉬워 회복 리듬이 필요한 시점이에요.' };
    userProfile.traffic_light_level = _idx < 55 ? 'YELLOW' : 'GREEN';

    // summary_line + today_action 룰 엔진
    const _SUMMARY_RULES = {
      GREEN: {
        1: { summary_line: '지금은 마음을 차분히 정리하며 다음 걸음을 준비하기 좋은 상태예요', today_action: '걱정을 한 문장으로 적고, 그 감정을 그냥 바라봐보세요' },
        2: { summary_line: '지금은 방향을 하나로 좁혀 첫 움직임을 준비하기 좋은 흐름이에요', today_action: '오늘 가장 중요한 문제 하나를 고르고, 나머지는 내일로 미뤄보세요' },
        3: { summary_line: '지금은 아주 작은 실행을 시작하기 좋은 상태예요', today_action: '오늘 할 행동을 딱 하나만 골라 10분 안에 끝낼 수 있게 줄여보세요' },
        4: { summary_line: '지금은 기존 습관을 꾸준히 이어가는 것이 가장 중요한 상태예요', today_action: '기존 습관 중 하나를 오늘 한 번 그대로 해보세요' }
      },
      YELLOW: {
        1: { summary_line: '지금은 해결보다 마음의 무게를 먼저 알아보는 것이 중요한 상태예요', today_action: '걱정을 한 줄 적고, 오늘은 그것을 해결하려 하지 않아도 괜찮아요' },
        2: { summary_line: '마음은 앞서 있지만, 무엇부터 할지 기준을 정하는 것이 먼저예요', today_action: '오늘 바꿀 것 한 가지만 정하고, 나머지는 결정하지 않아도 돼요' },
        3: { summary_line: '실행할 힘은 있지만, 시작점을 더 작게 만드는 것이 필요한 상태예요', today_action: '하려던 행동을 절반으로 줄이고, 실패해도 괜찮은 버전으로 시작해보세요' },
        4: { summary_line: '지금은 더 앞으로 나가기보다, 흔들린 리듬을 다시 고르게 만드는 것이 먼저예요', today_action: '가장 쉬웠던 루틴 하나를 오늘 한 번만 다시 해보세요' }
      }
    };
    const _lvl = userProfile.traffic_light_level;
    const _code = userProfile.current_stage.code;
    const _rule = (_SUMMARY_RULES[_lvl] || _SUMMARY_RULES.GREEN)[_code] || _SUMMARY_RULES.GREEN[1];
    userProfile.summary_line = _rule.summary_line;
    userProfile.today_action = _rule.today_action;

    const counterpartyProfile = analysisEngine.generateCounterpartyProfile(req.body);
    console.log("✅ Counterparty profile:", counterpartyProfile ? "generated" : "skipped (no counterparty)");

    const relationshipAnalysis = counterpartyProfile
      ? analysisEngine.analyzeRelationship(userProfile, counterpartyProfile)
      : null;
    console.log("✅ Relationship analysis:", relationshipAnalysis ? "completed" : "skipped");

    const consulting8Steps = analysisEngine.generate8StepsConsulting(userProfile, relationshipAnalysis);
    console.log("✅ 8-step consulting generated");

    const actionPlan = analysisEngine.generateActionPlan(userProfile);
    console.log("✅ 4-week action plan generated");

    const warningSignals = relationshipAnalysis
      ? analysisEngine.detectWarningSignals(relationshipAnalysis)
      : [];
    console.log("✅ Warning signals detected:", warningSignals.length);

    const executionTime = Date.now() - startTime;

    const result = {
      success: true,
      redirectUrl: "/daily-miracles-result.html#latest",
      story: {
        summary: `${userProfile.name}님의 분석이 완료되었습니다`,
        input: data,
        userProfile,
        counterpartyProfile,
        relationshipAnalysis,
        consulting8Steps,
        actionPlan,
        warningSignals
      },
      images: [],
      executionTime,
      workflowId: "analysis-" + Date.now()
    };

    global.latestStore.story = result;
    console.log(`✅ Analysis completed in ${executionTime}ms`);

    return res.status(200).json(result);
  } catch (err) {
    console.error("💥 coreAnalyzeHandler error:", err);
    return res.status(500).json({ error: "internal_error", message: err.message });
  }
}

// ---------- Alias Registrar (슬래시 변형까지 일괄 등록) ----------
function registerAliases(paths, handler) {
  paths.forEach(p => {
    const variants = new Set([p, p.endsWith("/") ? p.slice(0, -1) : p + "/"]);
    variants.forEach(v => app.post(v, handler));
  });
}

// ---------- Register all analyze/create aliases ----------
registerAliases(
  [
    "/api/daily-miracles/analyze",   // ★ 프론트 기본
    "/api/relationship/analyze",
    "/api/analyze-relationship",
    "/api/create-story",
    "/api/story",
    "/api/story/generate",
    "/api/story/new",
    "/api/story/create"              // 과거 공식 라우트까지 통합 (중복 제거 요망)
  ],
  coreAnalyzeHandler
);

// ---------- Latest result for result page ----------
app.get("/api/story/latest", (_req, res) => {
  if (global.latestStore?.story) return res.json(global.latestStore.story);
  return res.status(404).json({ error: "no_latest_story" });
});

// ---------- Feedback System ----------
const fs = require("fs");
const IS_SERVERLESS_ENV = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const FEEDBACK_FILE = IS_SERVERLESS_ENV
  ? path.join('/tmp', 'feedback.json')
  : path.join(__dirname, "feedback.json");

// 피드백 저장
app.post("/api/feedback", (req, res) => {
  try {
    const feedback = {
      timestamp: new Date().toISOString(),
      satisfaction: req.body.satisfaction || null,
      helpful: req.body.helpful || [],
      improvements: req.body.improvements || "",
      accuracy: req.body.accuracy || null,
      suggestions: req.body.suggestions || "",
      recommendation: req.body.recommendation || null,
      contact: req.body.contact || "",
      userAgent: req.headers['user-agent'] || ""
    };

    console.log("📝 Feedback received:", JSON.stringify(feedback, null, 2));

    // 기존 피드백 로드 (없으면 빈 배열)
    let feedbacks = [];
    try {
      if (fs.existsSync(FEEDBACK_FILE)) {
        const content = fs.readFileSync(FEEDBACK_FILE, "utf-8");
        feedbacks = JSON.parse(content);
      }
    } catch (_) { /* 읽기 실패 시 빈 배열 유지 */ }

    // 새 피드백 추가
    feedbacks.push(feedback);

    // 파일에 저장
    try {
      fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2), "utf-8");
      console.log(`✅ Feedback saved (total: ${feedbacks.length})`);
    } catch (writeErr) {
      console.warn('[Feedback] 파일 저장 실패 (로그만 기록):', writeErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "소중한 피드백 감사합니다!",
      totalFeedbacks: feedbacks.length
    });
  } catch (err) {
    console.error("💥 Feedback save error:", err);
    return res.status(500).json({ error: "Failed to save feedback", message: err.message });
  }
});

// 피드백 조회 (관리자용)
app.get("/api/feedback", (req, res) => {
  try {
    if (!fs.existsSync(FEEDBACK_FILE)) {
      return res.json({ feedbacks: [], count: 0 });
    }

    const content = fs.readFileSync(FEEDBACK_FILE, "utf-8");
    const feedbacks = JSON.parse(content);

    // 통계 생성
    const stats = {
      count: feedbacks.length,
      avgSatisfaction: feedbacks.filter(f => f.satisfaction).length > 0
        ? (feedbacks.reduce((sum, f) => sum + (f.satisfaction || 0), 0) / feedbacks.filter(f => f.satisfaction).length).toFixed(1)
        : 0,
      avgAccuracy: feedbacks.filter(f => f.accuracy).length > 0
        ? (feedbacks.reduce((sum, f) => sum + (f.accuracy || 0), 0) / feedbacks.filter(f => f.accuracy).length).toFixed(1)
        : 0,
      avgRecommendation: feedbacks.filter(f => f.recommendation).length > 0
        ? (feedbacks.reduce((sum, f) => sum + (f.recommendation || 0), 0) / feedbacks.filter(f => f.recommendation).length).toFixed(1)
        : 0
    };

    return res.json({ feedbacks, stats });
  } catch (err) {
    console.error("💥 Feedback load error:", err);
    return res.status(500).json({ error: "Failed to load feedback", message: err.message });
  }
});

// ---------- Root ----------
app.get("/", (_req, res) => {
  res.json({
    service: "Daily Miracles MVP",
    status: "ok",
    endpoints: {
      health: "/api/health",
      diag: "/diag/echo",
      analyze: "/api/daily-miracles/analyze",
      latest: "/api/story/latest"
    }
  });
});

// ---------- 404 & Error (middleware/errorHandler.js) ----------
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ---------- Rules Preload (fail-fast) ----------
const FAIL_FAST_RULES = process.env.FAIL_FAST_RULES === 'true' || process.env.NODE_ENV === 'production';

let rulesSnapshot = null;
try {
  const rulesLoader = require('./services/yeosu-ops-center/rulesLoader');
  const { rules, meta } = rulesLoader.loadRules();
  rulesSnapshot = meta;
  app.set('rulesSnapshot', rulesSnapshot);
  console.log('✅ Rules preloaded:', {
    version: rulesSnapshot.versions?.mice?.version,
    hash: rulesSnapshot.hash?.substring(0, 16) + '...',
    algo: rulesSnapshot.hash_algo
  });
} catch (e) {
  console.error('❌ Rules preload failed:', e.message);
  if (FAIL_FAST_RULES) {
    console.error('💀 FAIL_FAST_RULES enabled - exiting');
    process.exit(1);
  }
}

// ---------- Report Scheduler Initialization ----------
try {
  if (db && process.env.DATABASE_URL) {
    const reportScheduler = require('./services/reportScheduler');
    reportScheduler.init(db);
    console.log('✅ Report Scheduler initialization called');
  } else {
    console.log('⚠️ db module not loaded, skipping Report Scheduler init');
  }
} catch (e) {
  console.error('❌ Report Scheduler init failed:', e.message);
}

// ---------- Start (with fallback port) ----------
const DEFAULT_PORT = process.env.PORT || 5000;
const FALLBACK_PORT = 5002;

function printStartupBanner(port) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🌟 Daily Miracles MVP Server (FINAL)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📡 Port: ${port}`);
  console.log(`🌍 ALLOWED_ORIGINS: ${allowedOrigins.join(", ") || "(none→allow all in dev)"}`);
  console.log(`💳 WIX_SUCCESS_URL (runtime): ${process.env.WIX_SUCCESS_URL || '(미설정→기본값 사용)'}`);
  console.log("📋 Registered Routes:");
  [
    "GET  /healthz                    (Stability Score v1)",
    "GET  /api/health",
    "ALL  /diag/echo",
    "POST /api/daily-miracles/analyze",
    "POST /api/relationship/analyze",
    "GET  /api/story/latest",
    "GET  /api/inquiry/form           (1차 폼 질문 조회)",
    "POST /api/inquiry/submit         (1차 폼 접수)",
    "GET  /api/inquiry/:inquiryId     (접수 상태 조회)",
    "GET  /api/inquiry/list/all       (전체 목록 - 관리자)",
    "GET  /api/ops-center/*           (여수 운영 컨트롤타워)",
    "GET  /api/ops/heartbeat          (Heartbeat 상태)",
    "POST /api/ops/heartbeat/send     (수동 Heartbeat)",
    "GET  /"
  ].forEach(l => console.log("  - " + l));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ── Process-level crash handlers → Slack alert ────────────────────────
function sendCrashAlert(title, detail) {
  const msg = {
    text: `:rotating_light: ${title}`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: `🚨 ${title}`, emoji: true } },
      { type: 'section', text: { type: 'mrkdwn', text: `\`\`\`${String(detail).slice(0, 2500)}\`\`\`` } },
      { type: 'context', elements: [{ type: 'mrkdwn', text: `env: ${process.env.NODE_ENV || 'dev'} | pid: ${process.pid} | ${new Date().toISOString()}` }] },
    ],
  };
  if (slackHeartbeatService) {
    return slackHeartbeatService.sendSlackMessage(msg).catch(() => { });
  }
  return Promise.resolve();
}

process.on('uncaughtException', async (err) => {
  console.error('💀 uncaughtException:', err);
  await sendCrashAlert('Uncaught Exception', err.stack || err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ unhandledRejection:', reason);
  sendCrashAlert('Unhandled Rejection', reason?.stack || String(reason));
});

const { verifySchema } = require('./services/schemaVerifier');

function startServer(port) {
  app.set('runtime_port', port); // 실제 리슨 포트 저장

  const server = app.listen(port, "0.0.0.0", async () => {
    printStartupBanner(port);

    // DB 스키마 자동 검증 (부팅 직후)
    await verifySchema();

    // Slack Heartbeat 서비스 초기화 (09:00 KST 일일 알림)
    if (slackHeartbeatService) {
      slackHeartbeatService.init();
      console.log("✅ Slack Heartbeat 스케줄러 시작");
    }

    // P2.3: Stability proactive monitor (5분마다 score 평가 → Slack 선제 경고)
    if (stabilityService && slackHeartbeatService) {
      stabilityService.startProactiveMonitor(
        (msg) => slackHeartbeatService.sendSlackMessage(msg),
      );
    }


    // Aurora Video Job Worker 시작 (AIL-2026-0301-VIDJOB-001)
    try {
      const AuroraWorker = require('./services/aurora/AuroraWorker');
      auroraWorkerInstance = new AuroraWorker();
      auroraWorkerInstance.start();
      console.log("✅ Aurora Job Worker 시작 (5초 폴링)");
    } catch (workerErr) {
      console.warn("⚠️ Aurora Job Worker 시작 실패:", workerErr.message);
    }
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && port !== FALLBACK_PORT) {
      console.warn(`⚠️ Port ${port} in use. Falling back to ${FALLBACK_PORT}...`);
      startServer(FALLBACK_PORT);
    } else {
      console.error("❌ Server error:", err);
      process.exit(1);
    }
  });
}

startServer(DEFAULT_PORT);
