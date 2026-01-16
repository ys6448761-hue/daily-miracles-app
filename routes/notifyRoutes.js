/**
 * 메시지 발송 진단/테스트 API
 * P0 긴급 점검용
 *
 * @version 2.0 - 2026.01.16 (SENS 전환, Solapi 제거)
 *
 * 엔드포인트:
 * - GET  /api/notify/status - 설정/환경변수/최근 발송 상태
 * - POST /api/notify/test   - 테스트 메시지 발송
 */

const express = require('express');
const router = express.Router();

// messageProvider (SENS 알림톡/SMS)
let messageProvider = null;
try {
    messageProvider = require('../services/messageProvider');
} catch (e) {
    console.warn('[Notify] messageProvider 로드 실패:', e.message);
}

// OutboundMessage 저장소 연동
let messageStore = null;
try {
    messageStore = require('../services/outboundMessageStore');
} catch (e) {
    console.warn('[Notify] outboundMessageStore 로드 실패:', e.message);
}

/**
 * GET /api/notify/status
 * 메시지 발송 설정 상태 확인
 */
router.get('/status', async (req, res) => {
    try {
        // 환경변수 존재 여부 (값 노출 X)
        const envStatus = {
            // SENS 기본
            SENS_ACCESS_KEY: !!process.env.SENS_ACCESS_KEY,
            SENS_SECRET_KEY: !!process.env.SENS_SECRET_KEY,
            SENS_SERVICE_ID: !!process.env.SENS_SERVICE_ID,
            SENS_SMS_SERVICE_ID: !!process.env.SENS_SMS_SERVICE_ID,
            SENS_CHANNEL_ID: process.env.SENS_CHANNEL_ID || '_xfxhcWn',
            // 발신번호
            SENDER_PHONE: process.env.SENDER_PHONE ? `${process.env.SENDER_PHONE.substring(0, 4)}****` : false,
            // 템플릿
            SENS_TEMPLATE_CODE: !!process.env.SENS_TEMPLATE_CODE,
            SENS_QUOTE_TEMPLATE_CODE: !!process.env.SENS_QUOTE_TEMPLATE_CODE,
            // 알림 수신자
            CRO_PHONE: !!process.env.CRO_PHONE,
            COO_PHONE: !!process.env.COO_PHONE,
            CEO_PHONE: !!process.env.CEO_PHONE,
        };

        // 필수 설정 체크
        const requiredEnvs = ['SENS_ACCESS_KEY', 'SENS_SECRET_KEY', 'SENS_SERVICE_ID'];
        const missingEnvs = requiredEnvs.filter(key => !process.env[key]);

        // 서비스 로딩 상태
        const serviceStatus = {
            messageProvider: !!messageProvider,
            isEnabled: messageProvider?.isEnabled?.() || false,
            config: messageProvider?.getConfig?.() || null
        };

        // 결과 정리
        const status = {
            timestamp: new Date().toISOString(),
            env: envStatus,
            missingEnvs,
            service: serviceStatus,
            diagnosis: {
                canSendAlimtalk: envStatus.SENS_ACCESS_KEY && envStatus.SENS_SECRET_KEY && envStatus.SENS_SERVICE_ID,
                canSendSMS: envStatus.SENS_ACCESS_KEY && envStatus.SENS_SECRET_KEY && envStatus.SENS_SMS_SERVICE_ID,
                canSendRedAlert: envStatus.CRO_PHONE || envStatus.COO_PHONE,
            },
            recommendations: []
        };

        // 권장사항 추가
        if (missingEnvs.length > 0) {
            status.recommendations.push(`❌ 필수 환경변수 누락: ${missingEnvs.join(', ')}`);
        }
        if (!envStatus.SENS_SMS_SERVICE_ID) {
            status.recommendations.push('⚠️ SENS_SMS_SERVICE_ID 미설정 - SMS fallback 불가');
        }
        if (!envStatus.SENS_TEMPLATE_CODE) {
            status.recommendations.push('ℹ️ SENS_TEMPLATE_CODE 미설정 - SMS로만 발송됨');
        }

        // 최근 발송 내역 (OutboundMessage)
        let recentMessages = [];
        let messageStats = null;
        if (messageStore) {
            recentMessages = messageStore.getRecent(10);
            messageStats = messageStore.getStats();
        }

        console.log('[Notify] Status check:', JSON.stringify({
            missingEnvs,
            diagnosis: status.diagnosis,
            messageStats
        }));

        res.json({
            success: true,
            status,
            messageStats,
            recentMessages
        });

    } catch (error) {
        console.error('[Notify] Status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/notify/test
 * 테스트 SMS 발송 (관리자용)
 *
 * Body:
 * - to: 수신자 전화번호
 * - message: 테스트 메시지
 */
router.post('/test', async (req, res) => {
    try {
        const { to, message = '[테스트] 하루하루의 기적 메시지 테스트입니다.' } = req.body;

        if (!to) {
            return res.status(400).json({
                success: false,
                error: '수신자 전화번호(to)가 필요합니다'
            });
        }

        // 전화번호 정규화
        const normalizedTo = to.replace(/[^0-9]/g, '');

        console.log(`[Notify] Test send: { to: "${normalizedTo.substring(0, 3)}****${normalizedTo.slice(-4)}" }`);

        if (!messageProvider) {
            return res.status(500).json({
                success: false,
                error: 'messageProvider 로드 실패'
            });
        }

        // SMS 테스트 발송
        const result = await messageProvider.sendSensSMS(normalizedTo, message);

        res.json({
            success: result.success,
            result,
            summary: result.success
                ? '✅ SMS 테스트 발송 성공'
                : `❌ 발송 실패: ${result.error || '알 수 없는 오류'}`
        });

    } catch (error) {
        console.error('[Notify] Test error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/notify/red-alert-test
 * RED 긴급 알림 테스트
 */
router.post('/red-alert-test', async (req, res) => {
    try {
        if (!messageProvider?.sendRedAlertMessage) {
            return res.status(500).json({
                success: false,
                error: 'sendRedAlertMessage 함수 없음'
            });
        }

        const mockWishData = {
            name: '테스트',
            phone: '010-0000-0000',
            wish: '[테스트] RED 알림 테스트입니다.',
            traffic_light: {
                level: 'RED',
                reason: '테스트용 RED 트리거'
            }
        };

        console.log('[Notify] RED Alert test triggered');
        const result = await messageProvider.sendRedAlertMessage(mockWishData);

        res.json({
            success: result.success,
            result,
            admin_phone: process.env.ADMIN_PHONE ? `${process.env.ADMIN_PHONE.substring(0, 3)}****` : '미설정'
        });

    } catch (error) {
        console.error('[Notify] RED Alert test error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
