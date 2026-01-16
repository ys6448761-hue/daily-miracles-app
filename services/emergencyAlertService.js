/**
 * emergencyAlertService.js
 *
 * 비상 알림 시스템
 * - 시스템 장애 시 담당자에게 SMS 발송
 * - 결제 실패, API 오류 등 긴급 상황 알림
 *
 * @version 1.0 - 2026-01-10
 */

// 환경변수
const EMERGENCY_PHONE = process.env.EMERGENCY_ALERT_PHONE;
const APP_NAME = 'Daily Miracles';

// messageProvider (SENS 알림톡/SMS)
let messageProvider = null;
try {
    messageProvider = require('./messageProvider');
} catch (e) {
    console.warn('[Emergency] messageProvider 로드 실패 - SMS 발송 불가');
}

/**
 * 알림 유형별 메시지 템플릿
 */
const ALERT_TEMPLATES = {
    payment_failed: {
        title: '결제 실패',
        template: (data) => `[${APP_NAME}] 결제 실패 알림\n\n고객: ${data.customer_name}\n금액: ${data.amount?.toLocaleString()}원\n사유: ${data.reason || '알 수 없음'}\n시간: ${new Date().toLocaleString('ko-KR')}`
    },
    api_error: {
        title: 'API 오류',
        template: (data) => `[${APP_NAME}] API 오류 알림\n\n엔드포인트: ${data.endpoint}\n오류: ${data.error}\n시간: ${new Date().toLocaleString('ko-KR')}`
    },
    lead_high_priority: {
        title: '긴급 리드',
        template: (data) => `[${APP_NAME}] 긴급 리드 접수\n\n고객: ${data.customer_name}\n연락처: ${data.phone}\n긴급도: ${data.urgency}\n내용: ${data.summary || '문의'}\n\nSLA: ${data.sla || '3시간'}`
    },
    system_down: {
        title: '시스템 장애',
        template: (data) => `[${APP_NAME}] 시스템 장애 감지\n\n서비스: ${data.service}\n상태: ${data.status}\n시간: ${new Date().toLocaleString('ko-KR')}\n\n즉시 확인 필요!`
    },
    quota_exceeded: {
        title: '할당량 초과',
        template: (data) => `[${APP_NAME}] 할당량 초과 경고\n\n서비스: ${data.service}\n사용량: ${data.usage}/${data.limit}\n시간: ${new Date().toLocaleString('ko-KR')}`
    },
    test: {
        title: '테스트',
        template: () => `[${APP_NAME}] 비상 알림 테스트\n\n이 메시지가 보인다면 알림 시스템이 정상 작동합니다.\n시간: ${new Date().toLocaleString('ko-KR')}`
    }
};

/**
 * 비상 알림 발송
 *
 * @param {string} alertType - 알림 유형 (payment_failed, api_error 등)
 * @param {Object} data - 알림 데이터
 * @returns {Object} 발송 결과
 */
async function sendAlert(alertType, data = {}) {
    if (!EMERGENCY_PHONE) {
        console.warn('[Emergency] EMERGENCY_ALERT_PHONE 미설정 - 알림 발송 불가');
        return { success: false, reason: 'phone_not_configured' };
    }

    const template = ALERT_TEMPLATES[alertType];
    if (!template) {
        console.warn(`[Emergency] 알 수 없는 알림 유형: ${alertType}`);
        return { success: false, reason: 'unknown_alert_type' };
    }

    const message = template.template(data);

    console.log(`[Emergency] 알림 발송 시도: ${template.title}`);
    console.log(`[Emergency] 수신자: ${EMERGENCY_PHONE.substring(0, 3)}****`);
    console.log(`[Emergency] 메시지:\n${message}`);

    // 실제 SMS 발송 시도
    if (messageProvider && typeof messageProvider.sendSensSMS === 'function') {
        try {
            const result = await messageProvider.sendSensSMS(EMERGENCY_PHONE, message);
            console.log('[Emergency] SMS 발송 성공');
            return { success: true, method: 'sms', result };
        } catch (error) {
            console.error('[Emergency] SMS 발송 실패:', error.message);
            return { success: false, method: 'sms', error: error.message };
        }
    }

    // SMS 서비스 없으면 로그만
    console.log('[Emergency] SMS 서비스 미사용 - 로그만 기록');
    return {
        success: true,
        method: 'log_only',
        message: '알림이 로그에 기록되었습니다 (SMS 비활성)'
    };
}

/**
 * 테스트 알림 발송
 */
async function sendTestAlert() {
    return sendAlert('test', {});
}

/**
 * 결제 실패 알림
 */
async function alertPaymentFailed(data) {
    return sendAlert('payment_failed', data);
}

/**
 * API 오류 알림
 */
async function alertApiError(data) {
    return sendAlert('api_error', data);
}

/**
 * 긴급 리드 알림
 */
async function alertHighPriorityLead(data) {
    return sendAlert('lead_high_priority', data);
}

/**
 * 시스템 장애 알림
 */
async function alertSystemDown(data) {
    return sendAlert('system_down', data);
}

module.exports = {
    sendAlert,
    sendTestAlert,
    alertPaymentFailed,
    alertApiError,
    alertHighPriorityLead,
    alertSystemDown
};
