/**
 * Airtable 연동 서비스 (ACT 관제탑)
 *
 * 테이블:
 * - Daily Health: 일일 스냅샷
 * - Alerts: 이상 감지 로그
 *
 * @version 1.0 - 2025.12.30
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// 테이블 ID (Airtable에서 생성 후 입력)
const TABLES = {
    DAILY_HEALTH: process.env.AIRTABLE_TABLE_DAILY_HEALTH || 'Daily Health',
    ALERTS: process.env.AIRTABLE_TABLE_ALERTS || 'Alerts'
};

/**
 * Airtable API 호출 헬퍼
 */
async function airtableRequest(tableName, method = 'GET', body = null, recordId = null) {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
        console.warn('[Airtable] API 키 또는 Base ID 미설정 - 시뮬레이션 모드');
        return { success: false, simulated: true, reason: 'API_KEY_MISSING' };
    }

    const url = recordId
        ? `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}/${recordId}`
        : `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;

    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            console.error('[Airtable] API 오류:', data.error);
            return { success: false, error: data.error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('[Airtable] 요청 실패:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Daily Health 스냅샷 저장 (upsert by date)
 * @param {Object} metrics - metricsService.getMetrics() 결과
 * @param {string} reportText - metricsService.generateDailyReport() 결과
 */
async function saveDailySnapshot(metrics, reportText) {
    const date = metrics.date;

    // 기존 레코드 검색
    const searchResult = await airtableRequest(
        TABLES.DAILY_HEALTH,
        'GET'
    );

    if (searchResult.simulated) {
        console.log('[Airtable] [시뮬레이션] Daily Health 저장:', date);
        console.log('[Airtable] [시뮬레이션] wishes_total:', metrics.wishes.total);
        return { success: true, simulated: true };
    }

    // 필드 매핑
    const fields = {
        date,
        wishes_total: metrics.wishes.total,
        wishes_new: metrics.wishes.new,
        wishes_processed: metrics.wishes.processed,
        red: metrics.trafficLight.red,
        yellow: metrics.trafficLight.yellow,
        green: metrics.trafficLight.green,
        alimtalk_sent: metrics.alimtalk.sent,
        alimtalk_success: metrics.alimtalk.success,
        alimtalk_failed: metrics.alimtalk.failed,
        alimtalk_fallbackSms: metrics.alimtalk.fallbackSms,
        ack_sent: metrics.ack.sent,
        ack_avgTimeMs: metrics.computed?.avgAckTimeMs || 0,
        ack_duplicateAttempts: metrics.ack.duplicateAttempts,
        errors_count: metrics.errors.length,
        report_text: reportText
    };

    // 기존 레코드 찾기
    let existingRecordId = null;
    if (searchResult.success && searchResult.data.records) {
        const existing = searchResult.data.records.find(r => r.fields.date === date);
        if (existing) {
            existingRecordId = existing.id;
        }
    }

    // Upsert
    if (existingRecordId) {
        // Update
        return airtableRequest(TABLES.DAILY_HEALTH, 'PATCH', { fields }, existingRecordId);
    } else {
        // Create
        return airtableRequest(TABLES.DAILY_HEALTH, 'POST', { fields });
    }
}

/**
 * Alert 기록
 * @param {string} severity - '🟡' | '🔴'
 * @param {string} type - 'ALIMTALK_FAIL' | 'ACK_SLA' | 'RED_CASE' | 'ERROR' | 'DUPLICATE'
 * @param {string} message - 요약 메시지
 * @param {Object} payload - 추가 데이터 (옵션)
 */
async function createAlert(severity, type, message, payload = null) {
    const fields = {
        created_at: new Date().toISOString(),
        severity,
        type,
        message
    };

    if (payload) {
        fields.payload_json = JSON.stringify(payload);
    }

    console.log(`[Airtable] Alert 생성: ${severity} ${type} - ${message}`);

    const result = await airtableRequest(TABLES.ALERTS, 'POST', { fields });

    if (result.simulated) {
        console.log('[Airtable] [시뮬레이션] Alert 저장됨');
    }

    return result;
}

/**
 * 이상 감지 체크 및 알림 발송
 * @param {Object} metrics - metricsService.getMetrics() 결과
 * @returns {Array} 감지된 이상 목록
 */
async function checkAndAlert(metrics) {
    const alerts = [];
    const m = metrics;

    // 1. 알림톡 실패
    if (m.alimtalk.failed > 0) {
        alerts.push({
            severity: '🟡',
            type: 'ALIMTALK_FAIL',
            message: `알림톡 실패 ${m.alimtalk.failed}건 발생`,
            payload: { failed: m.alimtalk.failed, sent: m.alimtalk.sent }
        });
    }

    // 2. 알림톡 성공률 < 98%
    const successRate = m.alimtalk.sent > 0
        ? (m.alimtalk.success / m.alimtalk.sent)
        : 1;
    if (m.alimtalk.sent > 0 && successRate < 0.98) {
        alerts.push({
            severity: '🟡',
            type: 'ALIMTALK_FAIL',
            message: `알림톡 성공률 저하: ${(successRate * 100).toFixed(1)}%`,
            payload: { successRate: successRate * 100, sent: m.alimtalk.sent }
        });
    }

    // 3. ACK 평균 시간 > 10분 (600000ms)
    const avgAckMs = m.computed?.avgAckTimeMs || 0;
    if (avgAckMs > 600000) {
        alerts.push({
            severity: '🟡',
            type: 'ACK_SLA',
            message: `ACK 응답 지연: 평균 ${Math.round(avgAckMs / 60000)}분`,
            payload: { avgAckMs }
        });
    }

    // 4. RED 케이스 발생 (가장 심각)
    if (m.trafficLight.red > 0) {
        alerts.push({
            severity: '🔴',
            type: 'RED_CASE',
            message: `RED 신호 ${m.trafficLight.red}건 감지 - 즉시 확인 필요!`,
            payload: { red: m.trafficLight.red }
        });
    }

    // 5. 에러 발생
    if (m.errors.length > 0) {
        const topError = m.errors[0];
        alerts.push({
            severity: '🟡',
            type: 'ERROR',
            message: `에러 발생: ${topError.type} (${topError.count}건)`,
            payload: { errors: m.errors.slice(0, 3) }
        });
    }

    // 6. 중복 시도 급증 (5건 이상)
    if (m.ack.duplicateAttempts >= 5) {
        alerts.push({
            severity: '🟡',
            type: 'DUPLICATE',
            message: `중복 발송 시도 급증: ${m.ack.duplicateAttempts}건`,
            payload: { duplicateAttempts: m.ack.duplicateAttempts }
        });
    }

    // Alert 저장 및 카톡 발송
    for (const alert of alerts) {
        // Airtable에 저장
        await createAlert(alert.severity, alert.type, alert.message, alert.payload);

        // 카톡 알림 발송
        await sendAlertKakao(alert);
    }

    return alerts;
}

/**
 * Alert 카카오톡 발송
 */
async function sendAlertKakao(alert) {
    try {
        const { sendSMS } = require('./solapiService');

        // 코미(COO) 번호
        const COO_PHONE = process.env.COO_PHONE || process.env.CRO_PHONE;

        if (!COO_PHONE) {
            console.warn('[Airtable] COO_PHONE 미설정 - 알림 발송 스킵');
            return;
        }

        const message = `[하루하루의기적 관제탑]
${alert.severity} ${alert.type}

${alert.message}

시각: ${new Date().toLocaleString('ko-KR')}`;

        // 코미에게 발송
        await sendSMS(COO_PHONE, message);

        // RED 케이스는 푸르미르/여의보주에게도 발송
        if (alert.severity === '🔴') {
            const CEO_PHONE = process.env.CEO_PHONE;
            const QUALITY_PHONE = process.env.QUALITY_PHONE;

            if (CEO_PHONE) await sendSMS(CEO_PHONE, message);
            if (QUALITY_PHONE) await sendSMS(QUALITY_PHONE, message);
        }

        console.log(`[Airtable] 알림 발송 완료: ${alert.type}`);
    } catch (error) {
        console.error('[Airtable] 알림 발송 실패:', error.message);
    }
}

/**
 * 서비스 활성화 상태 확인
 */
function isEnabled() {
    return !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID);
}

module.exports = {
    saveDailySnapshot,
    createAlert,
    checkAndAlert,
    isEnabled,
    TABLES
};
