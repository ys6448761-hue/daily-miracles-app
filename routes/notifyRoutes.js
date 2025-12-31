/**
 * 메시지 발송 진단/테스트 API
 * P0 긴급 점검용
 *
 * @version 1.0 - 2025.12.31
 *
 * 엔드포인트:
 * - GET  /api/notify/status - 설정/환경변수/최근 발송 상태
 * - POST /api/notify/test   - 테스트 메시지 발송
 */

const express = require('express');
const router = express.Router();

// Solapi 서비스 연동
let solapiService = null;
try {
    solapiService = require('../services/solapiService');
} catch (e) {
    console.warn('[Notify] solapiService 로드 실패:', e.message);
}

/**
 * GET /api/notify/status
 * 메시지 발송 설정 상태 확인
 */
router.get('/status', async (req, res) => {
    try {
        // 환경변수 존재 여부 (값 노출 X)
        const envStatus = {
            // Solapi 기본
            SOLAPI_API_KEY: !!process.env.SOLAPI_API_KEY,
            SOLAPI_API_SECRET: !!process.env.SOLAPI_API_SECRET,
            SOLAPI_PFID: !!process.env.SOLAPI_PFID,
            // 발신번호 (⚠️ SENDER_PHONE은 deprecated - ATA 전용)
            SENDER_PHONE: process.env.SENDER_PHONE ? `${process.env.SENDER_PHONE.substring(0, 4)}**** (ATA only, deprecated)` : false,
            SOLAPI_SMS_FROM: process.env.SOLAPI_SMS_FROM ? `${process.env.SOLAPI_SMS_FROM.substring(0, 3)}****${process.env.SOLAPI_SMS_FROM.slice(-4)}` : false,
            // 템플릿
            SOLAPI_TEMPLATE_MIRACLE_RESULT: !!process.env.SOLAPI_TEMPLATE_MIRACLE_RESULT,
            SOLAPI_TEMPLATE_WISH_ACK: !!process.env.SOLAPI_TEMPLATE_WISH_ACK,
            // 알림 수신자
            CRO_PHONE: !!process.env.CRO_PHONE,
            COO_PHONE: !!process.env.COO_PHONE,
            CEO_PHONE: !!process.env.CEO_PHONE,
            // 이메일 (선택)
            SENDGRID_API_KEY: !!process.env.SENDGRID_API_KEY,
        };

        // 필수 설정 체크
        const requiredEnvs = ['SOLAPI_API_KEY', 'SOLAPI_API_SECRET', 'SOLAPI_PFID', 'SOLAPI_SMS_FROM'];
        const missingEnvs = requiredEnvs.filter(key => !process.env[key]);

        // 서비스 로딩 상태
        const serviceStatus = {
            solapiService: !!solapiService,
            isEnabled: solapiService?.isEnabled?.() || false,
        };

        // 잔액 조회 (가능한 경우)
        let balance = null;
        if (solapiService?.getBalance) {
            try {
                balance = await solapiService.getBalance();
            } catch (e) {
                balance = { error: e.message };
            }
        }

        // 결과 정리
        const status = {
            timestamp: new Date().toISOString(),
            env: envStatus,
            missingEnvs,
            service: serviceStatus,
            balance,
            // 현재 실제 사용 중인 SMS 발신번호 (마스킹)
            activeSmsFrom: process.env.SOLAPI_SMS_FROM
                ? `${process.env.SOLAPI_SMS_FROM.substring(0, 3)}****${process.env.SOLAPI_SMS_FROM.slice(-4)}`
                : '⚠️ 미설정 (SMS 발송 불가)',
            diagnosis: {
                canSendATA: envStatus.SOLAPI_API_KEY && envStatus.SOLAPI_API_SECRET && envStatus.SOLAPI_PFID,
                canSendSMS: envStatus.SOLAPI_API_KEY && envStatus.SOLAPI_API_SECRET && !!process.env.SOLAPI_SMS_FROM,
                canSendRedAlert: envStatus.CRO_PHONE || envStatus.COO_PHONE,
                smsFromSource: process.env.SOLAPI_SMS_FROM ? 'SOLAPI_SMS_FROM' : 'NONE',
            },
            recommendations: []
        };

        // 권장사항 추가
        if (missingEnvs.length > 0) {
            status.recommendations.push(`❌ 필수 환경변수 누락: ${missingEnvs.join(', ')}`);
        }
        if (!envStatus.SOLAPI_SMS_FROM) {
            status.recommendations.push('⚠️ SOLAPI_SMS_FROM 미설정 - SMS fallback 불가');
        }
        if (!envStatus.SOLAPI_PFID) {
            status.recommendations.push('⚠️ SOLAPI_PFID 미설정 - 알림톡 발송 불가');
        }
        if (!envStatus.SOLAPI_TEMPLATE_MIRACLE_RESULT && !envStatus.SOLAPI_TEMPLATE_WISH_ACK) {
            status.recommendations.push('ℹ️ 알림톡 템플릿 미설정 - SMS로만 발송됨');
        }

        console.log('[Notify] Status check:', JSON.stringify({
            missingEnvs,
            diagnosis: status.diagnosis
        }));

        res.json({
            success: true,
            status
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
 * 테스트 메시지 발송 (관리자용)
 *
 * Body:
 * - to: 수신자 전화번호
 * - type: 'ata' | 'sms' | 'both'
 * - message: 테스트 메시지 (SMS용)
 */
router.post('/test', async (req, res) => {
    try {
        const { to, type = 'sms', message = '[테스트] 하루하루의 기적 메시지 테스트입니다.' } = req.body;

        if (!to) {
            return res.status(400).json({
                success: false,
                error: '수신자 전화번호(to)가 필요합니다'
            });
        }

        // 전화번호 정규화
        const normalizedTo = to.replace(/[^0-9]/g, '');

        console.log(`[Notify] Test send: { type: "${type}", to: "${normalizedTo.substring(0, 3)}****${normalizedTo.slice(-4)}" }`);

        const results = {
            timestamp: new Date().toISOString(),
            to: `${normalizedTo.substring(0, 3)}****${normalizedTo.slice(-4)}`,
            type,
            ata: null,
            sms: null
        };

        // 알림톡 테스트
        if ((type === 'ata' || type === 'both') && solapiService?.sendKakaoAlimtalk) {
            const templateId = process.env.SOLAPI_TEMPLATE_WISH_ACK || process.env.SOLAPI_TEMPLATE_MIRACLE_RESULT;
            if (templateId) {
                try {
                    results.ata = await solapiService.sendKakaoAlimtalk(normalizedTo, templateId, {
                        name: '테스트',
                        miracleScore: '88',
                        message: message
                    });
                    console.log('[Notify] ATA test result:', results.ata.success ? '성공' : '실패');
                } catch (e) {
                    results.ata = { success: false, error: e.message };
                    console.error('[Notify] ATA test error:', e.message);
                }
            } else {
                results.ata = { success: false, error: '알림톡 템플릿 미설정' };
            }
        }

        // SMS 테스트
        if ((type === 'sms' || type === 'both') && solapiService?.sendSMS) {
            try {
                results.sms = await solapiService.sendSMS(normalizedTo, message);
                console.log('[Notify] SMS test result:', results.sms.success ? '성공' : '실패');
            } catch (e) {
                results.sms = { success: false, error: e.message };
                console.error('[Notify] SMS test error:', e.message);
            }
        }

        // 종합 결과
        const anySuccess = results.ata?.success || results.sms?.success;

        res.json({
            success: anySuccess,
            results,
            summary: anySuccess
                ? `✅ ${type === 'both' ? '최소 1건' : type.toUpperCase()} 발송 성공`
                : `❌ 발송 실패 - 로그 확인 필요`
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
        if (!solapiService?.sendRedAlert) {
            return res.status(500).json({
                success: false,
                error: 'sendRedAlert 함수 없음'
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
        const result = await solapiService.sendRedAlert(mockWishData);

        res.json({
            success: result.success,
            result,
            cro_phone: process.env.CRO_PHONE ? `${process.env.CRO_PHONE.substring(0, 3)}****` : '미설정'
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
