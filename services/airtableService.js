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

// PR-1: 상단에서 1회 require (성능 최적화)
let messageProvider = null;
try {
    messageProvider = require('./messageProvider');
} catch (e) {
    console.warn('[Airtable] messageProvider 로드 실패:', e.message);
}

// 테이블명 (환경변수 또는 기본값)
// Note: AIRTABLE_TABLE_NAME은 deprecated - AIRTABLE_TABLE_WISHES_INBOX 사용
const TABLES = {
    DAILY_HEALTH: process.env.AIRTABLE_TABLE_DAILY_HEALTH || 'Daily Health',
    ALERTS: process.env.AIRTABLE_TABLE_ALERTS || 'Alerts',
    WISHES_INBOX: process.env.AIRTABLE_TABLE_WISHES_INBOX || '인입함',  // 레거시 소원 인입함
    USERS: process.env.AIRTABLE_TABLE_USERS || 'Users'
    // 신규 WISH 7문항: wishIntakeService.js에서 별도 관리
    // - AIRTABLE_TABLE_SESSIONS (Wish Intake Sessions)
    // - AIRTABLE_TABLE_MESSAGES (Wish Intake Messages)
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
            'Content-Type': 'application/json; charset=utf-8'
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

    // PR-1: Alert 저장 및 카톡 발송 (N+1 → Promise.allSettled 병렬 처리)
    if (alerts.length > 0) {
        const results = await Promise.allSettled(
            alerts.map(async (alert) => {
                // Airtable 저장과 카톡 발송을 병렬로
                const [saveResult, kakaoResult] = await Promise.allSettled([
                    createAlert(alert.severity, alert.type, alert.message, alert.payload),
                    sendAlertKakao(alert)
                ]);
                return { alert, saveResult, kakaoResult };
            })
        );

        // 실패 로깅
        results.forEach((r, i) => {
            if (r.status === 'rejected') {
                console.error(`[Airtable] Alert 처리 실패 [${i}]:`, r.reason);
            }
        });
    }

    return alerts;
}

/**
 * Alert 카카오톡 발송
 */
async function sendAlertKakao(alert) {
    try {
        // PR-1: 상단에서 로드한 messageProvider 사용 (매번 require 제거)
        if (!messageProvider) {
            console.warn('[Airtable] messageProvider 미설정 - 알림 발송 스킵');
            return;
        }

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
        await messageProvider.sendSensSMS(COO_PHONE, message);

        // RED 케이스는 푸르미르/여의보주에게도 발송
        if (alert.severity === '🔴') {
            const CEO_PHONE = process.env.CEO_PHONE;
            const QUALITY_PHONE = process.env.QUALITY_PHONE;

            if (CEO_PHONE) await messageProvider.sendSensSMS(CEO_PHONE, message);
            if (QUALITY_PHONE) await messageProvider.sendSensSMS(QUALITY_PHONE, message);
        }

        console.log(`[Airtable] 알림 발송 완료: ${alert.type}`);
    } catch (error) {
        console.error('[Airtable] 알림 발송 실패:', error.message);
    }
}

/**
 * VIP 태깅 처리 및 알림
 * @param {string} wishContent - 소원 내용
 * @param {string} trafficLight - 신호등 결과
 * @param {number} duplicateAttempts - 중복 시도 횟수
 * @param {Object} options - { dryRun: boolean, wishId: string }
 * @returns {Object} VIP 평가 결과
 */
async function processVipAlert(wishContent, trafficLight, duplicateAttempts = 0, options = {}) {
    const { dryRun = false, wishId = null } = options;

    // VIP 서비스 import
    const { evaluateVip } = require('./vipService');
    const { recordVipTagged } = require('./metricsService');

    // VIP 평가
    const vipResult = evaluateVip(wishContent, trafficLight, duplicateAttempts);

    // VIP가 아니면 early return
    if (!vipResult.vip) {
        return vipResult;
    }

    console.log(`[VIP] 태깅됨! Score: ${vipResult.vipScore}, Reasons: ${vipResult.vipReasons.join(', ')}`);

    // Metrics 기록
    recordVipTagged(trafficLight, vipResult.vipScore);

    // Alerts 테이블에 이벤트 저장
    await createAlert('✨', 'VIP_TAGGED', `VIP 소원 감지 (점수: ${vipResult.vipScore})`, {
        wishId: wishId || `wish_${Date.now()}`,
        vipScore: vipResult.vipScore,
        vipReasons: vipResult.vipReasons,
        trafficLight,
        contentPreview: wishContent.substring(0, 100) + (wishContent.length > 100 ? '...' : '')
    });

    // 여의보주 SMS 발송
    if (!dryRun) {
        await sendVipNotification(vipResult, trafficLight);
    } else {
        console.log('[VIP] [드라이런] SMS 발송 스킵');
    }

    return vipResult;
}

/**
 * VIP 여의보주 알림 발송
 */
async function sendVipNotification(vipResult, trafficLight) {
    try {
        const messageProvider = require('./messageProvider');

        // 여의보주 번호
        const QUALITY_PHONE = process.env.QUALITY_PHONE;
        const COO_PHONE = process.env.COO_PHONE || process.env.CRO_PHONE;

        if (!QUALITY_PHONE) {
            console.warn('[VIP] QUALITY_PHONE 미설정 - 알림 발송 스킵');
            return;
        }

        const message = `[하루하루의기적 VIP 알림]
✨ Human Touch 소원 감지

📊 VIP 점수: ${vipResult.vipScore}점
🚦 신호등: ${trafficLight.toUpperCase()}

💡 선정 근거:
${vipResult.vipReasons.map((r, i) => `  ${i+1}. ${r}`).join('\n')}

👉 여의보주님의 수기 답장이 필요합니다.

시각: ${new Date().toLocaleString('ko-KR')}`;

        // 여의보주에게 발송
        await messageProvider.sendSensSMS(QUALITY_PHONE, message);
        console.log('[VIP] 여의보주 알림 발송 완료');

        // COO에게 CC (옵션)
        if (COO_PHONE && COO_PHONE !== QUALITY_PHONE) {
            await messageProvider.sendSensSMS(COO_PHONE, `[VIP CC] ${message}`);
            console.log('[VIP] COO CC 발송 완료');
        }
    } catch (error) {
        console.error('[VIP] 알림 발송 실패:', error.message);
    }
}

/**
 * 서비스 활성화 상태 확인
 */
function isEnabled() {
    return !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID);
}

// ========== Wishes Inbox 관련 함수 ==========

/**
 * Wishes Inbox 레코드 생성
 * @param {Object} wishData - 소원 데이터
 */
async function createWishInbox(wishData) {
    // 한글 필드명 매핑 (Airtable 테이블 구조에 맞춤)
    const fields = {
        '소원ID': wishData.wish_id,
        '채널': wishData.channel,
        '상태': wishData.status,
        '우선순위': wishData.priority,
        '유형': wishData.type,
        '감정': wishData.sentiment,
        '신호등': wishData.signal,
        '내용': wishData.content,
        '요약': wishData.content_summary,
        '민감여부': wishData.is_sensitive,
        '인간개입필요': wishData.requires_human,
        '담당자': wishData.assigned_to,
        '이름': wishData.name || '',
        '전화번호': wishData.phone || '',
        '이메일': wishData.email || '',
        '보석타입': wishData.gem_type || '',
        '원본데이터': wishData.raw_payload || ''
    };

    console.log(`[Airtable] Wishes Inbox 저장: ${wishData.wish_id}`);

    const result = await airtableRequest(TABLES.WISHES_INBOX, 'POST', { fields });

    if (result.simulated) {
        console.log('[Airtable] [시뮬레이션] Wishes Inbox 저장됨');
        return { success: true, simulated: true, wish_id: wishData.wish_id };
    }

    return result;
}

/**
 * Wishes Inbox 상태 업데이트
 * @param {string} wishId - 소원 ID
 * @param {string} newStatus - 새 상태
 * @param {Object} additionalFields - 추가 필드 (옵션)
 */
async function updateWishStatus(wishId, newStatus, additionalFields = {}) {
    // 먼저 레코드 ID 조회
    const searchResult = await airtableRequest(TABLES.WISHES_INBOX, 'GET');

    if (searchResult.simulated) {
        console.log(`[Airtable] [시뮬레이션] 상태 업데이트: ${wishId} → ${newStatus}`);
        return { success: true, simulated: true };
    }

    if (!searchResult.success || !searchResult.data.records) {
        return { success: false, error: 'Failed to search records' };
    }

    const record = searchResult.data.records.find(r => r.fields['소원ID'] === wishId);
    if (!record) {
        return { success: false, error: `Record not found: ${wishId}` };
    }

    const fields = {
        '상태': newStatus,
        ...additionalFields
    };

    return airtableRequest(TABLES.WISHES_INBOX, 'PATCH', { fields }, record.id);
}

/**
 * Wishes Inbox 조회 (필터)
 * @param {Object} filters - 필터 조건 { status, signal, channel }
 */
async function getWishesInbox(filters = {}) {
    const result = await airtableRequest(TABLES.WISHES_INBOX, 'GET');

    if (result.simulated) {
        console.log('[Airtable] [시뮬레이션] Wishes Inbox 조회');
        return { success: true, simulated: true, records: [] };
    }

    if (!result.success) {
        return result;
    }

    let records = result.data.records || [];

    // 필터 적용 (한글 필드명 사용)
    if (filters.status) {
        records = records.filter(r => r.fields['상태'] === filters.status);
    }
    if (filters.signal) {
        records = records.filter(r => r.fields['신호등'] === filters.signal);
    }
    if (filters.channel) {
        records = records.filter(r => r.fields['채널'] === filters.channel);
    }

    return {
        success: true,
        count: records.length,
        records: records.map(r => ({
            id: r.id,
            ...r.fields,
            created_at: r.createdTime
        }))
    };
}

/**
 * 신호등별 통계
 */
async function getSignalStats() {
    const result = await getWishesInbox();

    if (!result.success || result.simulated) {
        return {
            success: result.success,
            simulated: result.simulated,
            stats: { red: 0, yellow: 0, green: 0, total: 0 }
        };
    }

    const stats = {
        red: result.records.filter(r => r['신호등'] === 'red').length,
        yellow: result.records.filter(r => r['신호등'] === 'yellow').length,
        green: result.records.filter(r => r['신호등'] === 'green').length,
        total: result.count
    };

    return { success: true, stats };
}

module.exports = {
    // Daily Health & Alerts
    saveDailySnapshot,
    createAlert,
    checkAndAlert,
    processVipAlert,
    sendVipNotification,

    // Wishes Inbox
    createWishInbox,
    updateWishStatus,
    getWishesInbox,
    getSignalStats,

    // Utils
    isEnabled,
    TABLES
};
