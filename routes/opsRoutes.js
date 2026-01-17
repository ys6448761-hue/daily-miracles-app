/**
 * opsRoutes.js
 *
 * 운영 시스템 라우터
 * - 헬스체크 엔드포인트
 * - 시스템 상태 모니터링
 *
 * @version 1.0 - 2026-01-10
 */

const express = require('express');
const router = express.Router();

// 서비스 로드
let notionOps = null;
let emergencyAlert = null;
let opsReportService = null;

try {
    notionOps = require('../services/notionOpsService');
} catch (e) {
    console.warn('[Ops] 노션 서비스 로드 실패');
}

try {
    emergencyAlert = require('../services/emergencyAlertService');
} catch (e) {
    console.warn('[Ops] 비상 알림 서비스 로드 실패');
}

try {
    opsReportService = require('../services/opsReportService');
    console.log('✅ Ops Report 서비스 로드 성공');
} catch (e) {
    console.warn('[Ops] Ops Report 서비스 로드 실패:', e.message);
}

let chiefOfStaffService = null;
try {
    chiefOfStaffService = require('../services/chiefOfStaffService');
    console.log('✅ ChiefOfStaff 서비스 로드 성공');
} catch (e) {
    console.warn('[Ops] ChiefOfStaff 서비스 로드 실패:', e.message);
}

/**
 * GET /ops/health
 *
 * 시스템 헬스체크 엔드포인트
 * - 외부 서비스 연결 상태 확인
 * - 자동화 시스템 동작 여부 체크
 */
router.get('/health', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {}
    };

    // 1. 노션 연결 상태
    if (notionOps) {
        try {
            const notionStatus = await notionOps.checkConnection();
            health.services.notion = {
                status: notionStatus.connected ? 'connected' : 'disconnected',
                reason: notionStatus.reason || null
            };
        } catch (e) {
            health.services.notion = { status: 'error', reason: e.message };
        }
    } else {
        health.services.notion = { status: 'not_loaded' };
    }

    // 2. 토스페이먼츠 상태
    health.services.toss = {
        status: process.env.TOSS_SECRET_KEY ? 'configured' : 'not_configured',
        testMode: !process.env.TOSS_SECRET_KEY || process.env.TOSS_SECRET_KEY.startsWith('test_')
    };

    // 3. SENS 알림톡 상태
    health.services.sens = {
        status: process.env.SENS_ACCESS_KEY && process.env.SENS_SERVICE_ID ? 'configured' : 'not_configured',
        channelId: process.env.SENS_CHANNEL_ID || null,
        templateCode: process.env.SENS_TEMPLATE_CODE ? 'configured' : 'not_configured'
    };

    // 4. 긴급 알림 상태
    health.services.emergency = {
        status: process.env.EMERGENCY_ALERT_PHONE ? 'configured' : 'not_configured',
        phone: process.env.EMERGENCY_ALERT_PHONE ?
            process.env.EMERGENCY_ALERT_PHONE.substring(0, 3) + '****' : null
    };

    // 6. Plan B 계좌이체 상태
    health.services.planB = {
        status: process.env.PLAN_B_ACCOUNT ? 'configured' : 'not_configured',
        bank: process.env.PLAN_B_BANK || null
    };

    // 7. 데이터베이스 상태 (간단 체크)
    health.services.database = {
        status: process.env.DATABASE_URL ? 'configured' : 'not_configured'
    };

    // 전체 상태 판단
    const criticalServices = ['notion', 'database'];
    const hasIssue = criticalServices.some(s =>
        health.services[s]?.status === 'error' ||
        health.services[s]?.status === 'disconnected'
    );

    if (hasIssue) {
        health.status = 'degraded';
    }

    // 응답
    res.json(health);
});

/**
 * GET /ops/status
 *
 * 상세 운영 상태 (인증 필요하면 추후 추가)
 */
router.get('/status', async (req, res) => {
    res.json({
        app: 'Daily Miracles MVP',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /ops/alert/test
 *
 * 비상 알림 테스트 (개발용)
 */
router.post('/alert/test', async (req, res) => {
    if (!emergencyAlert) {
        return res.status(503).json({
            success: false,
            error: 'ALERT_SERVICE_NOT_LOADED',
            message: '비상 알림 서비스가 로드되지 않았습니다'
        });
    }

    try {
        const result = await emergencyAlert.sendTestAlert();
        res.json({
            success: true,
            result,
            message: '테스트 알림이 발송되었습니다'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// P0: Ops+Promo 통합 리포트 엔드포인트
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /ops/report/daily
 *
 * Daily 운영 리포트 생성
 * - Sessions 집계 (started/completed/completion_rate)
 * - 리스크 현황 (yellow/red/pending_review)
 * - UTM 성과 (top_sources/top_campaigns)
 * - Airtable 저장 + Slack 게시
 */
router.post('/report/daily', async (req, res) => {
    if (!opsReportService) {
        return res.status(503).json({
            success: false,
            error: 'service_unavailable',
            message: 'Ops Report 서비스가 로드되지 않았습니다.'
        });
    }

    try {
        const { forceRun = false } = req.body;

        console.log(`[OpsReport] POST /report/daily 요청: forceRun=${forceRun}`);

        const result = await opsReportService.generateDailyReport({ forceRun });

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: 'report_generation_failed',
                message: result.error
            });
        }

        // 이미 생성된 경우
        if (result.skipped) {
            return res.json({
                success: true,
                skipped: true,
                reason: result.reason,
                idempotencyKey: result.idempotencyKey,
                message: '오늘 Daily 리포트가 이미 생성되었습니다.'
            });
        }

        res.json({
            success: true,
            reportType: result.reportType,
            metrics: result.metrics,
            saved: result.saved,
            slackPosted: result.slackPosted,
            idempotencyKey: result.idempotencyKey,
            simulated: result.simulated || false
        });

    } catch (error) {
        console.error('[OpsReport] Daily 리포트 오류:', error);
        res.status(500).json({
            success: false,
            error: 'internal_error',
            message: error.message
        });
    }
});

/**
 * POST /ops/report/launch
 *
 * Launch 리포트 생성 (홍보 기간용 실시간 모니터링)
 * - 최근 N분 세션 집계
 * - Airtable 저장 + Slack 게시
 */
router.post('/report/launch', async (req, res) => {
    if (!opsReportService) {
        return res.status(503).json({
            success: false,
            error: 'service_unavailable',
            message: 'Ops Report 서비스가 로드되지 않았습니다.'
        });
    }

    try {
        const {
            window_minutes = 30,
            forceRun = false
        } = req.body;

        // 유효성 검증
        const windowMinutes = parseInt(window_minutes, 10);
        if (isNaN(windowMinutes) || windowMinutes < 5 || windowMinutes > 1440) {
            return res.status(400).json({
                success: false,
                error: 'invalid_window',
                message: 'window_minutes는 5~1440 사이여야 합니다.'
            });
        }

        console.log(`[OpsReport] POST /report/launch 요청: window=${windowMinutes}분, forceRun=${forceRun}`);

        const result = await opsReportService.generateLaunchReport({
            windowMinutes,
            forceRun
        });

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: 'report_generation_failed',
                message: result.error
            });
        }

        // 이미 생성된 경우
        if (result.skipped) {
            return res.json({
                success: true,
                skipped: true,
                reason: result.reason,
                idempotencyKey: result.idempotencyKey,
                message: `최근 ${windowMinutes}분 Launch 리포트가 이미 생성되었습니다.`
            });
        }

        res.json({
            success: true,
            reportType: result.reportType,
            windowMinutes: result.windowMinutes,
            metrics: result.metrics,
            saved: result.saved,
            slackPosted: result.slackPosted,
            idempotencyKey: result.idempotencyKey,
            simulated: result.simulated || false
        });

    } catch (error) {
        console.error('[OpsReport] Launch 리포트 오류:', error);
        res.status(500).json({
            success: false,
            error: 'internal_error',
            message: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// P0+: ChiefOfStaff 비서실장 오케스트레이터
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /ops/chief/run
 *
 * ChiefOfStaff 실행 - 8개 알람 룰 체크
 * - 앱 health, Airtable, 데이터 정합성
 * - 🔴/🟡 미처리 에스컬레이션
 * - Daily 리포트 미생성, 홍보 유입 0, Slack 연결
 */
router.post('/chief/run', async (req, res) => {
    if (!chiefOfStaffService) {
        return res.status(503).json({
            success: false,
            error: 'service_unavailable',
            message: 'ChiefOfStaff 서비스가 로드되지 않았습니다.'
        });
    }

    try {
        const {
            window_minutes = 30,
            forceRun = false
        } = req.body;

        console.log(`[ChiefOfStaff] POST /chief/run 요청: window=${window_minutes}분, forceRun=${forceRun}`);

        const result = await chiefOfStaffService.runChiefOfStaff({
            windowMinutes: parseInt(window_minutes, 10) || 30,
            forceRun
        });

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: 'chief_run_failed',
                message: result.error
            });
        }

        // 이미 실행된 경우
        if (result.skipped) {
            return res.json({
                success: true,
                skipped: true,
                reason: result.reason,
                idempotencyKey: result.idempotencyKey,
                message: '최근 5분 내 이미 실행되었습니다.'
            });
        }

        res.json({
            success: true,
            runAt: result.runAt,
            checksRun: result.checksRun,
            alertsTriggered: result.alertsTriggered,
            alerts: result.alerts,
            slackResults: result.slackResults,
            summary: result.summary,
            idempotencyKey: result.idempotencyKey
        });

    } catch (error) {
        console.error('[ChiefOfStaff] 실행 오류:', error);
        res.status(500).json({
            success: false,
            error: 'internal_error',
            message: error.message
        });
    }
});

module.exports = router;
