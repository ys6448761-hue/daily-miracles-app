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

module.exports = router;
