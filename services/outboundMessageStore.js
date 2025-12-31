/**
 * OutboundMessage 저장소
 * 발송 시도마다 레코드 저장 (메모리 기반, 서버 재시작 시 초기화)
 *
 * @version 1.0 - 2025.12.31
 *
 * 스키마:
 * - id: 고유 ID (correlationId)
 * - createdAt: 발송 시각 (ISO string)
 * - channel: 'sms' | 'ata'
 * - to: 수신자 (마스킹)
 * - from: 발신자 (마스킹)
 * - status: 'queued' | 'sent' | 'failed'
 * - provider: 'Solapi'
 * - providerId: groupId/messageId
 * - errorCode: 에러 코드 (실패 시)
 * - errorMessage: 에러 메시지 (실패 시)
 */

// 메모리 저장소 (최대 100건 유지)
const MAX_RECORDS = 100;
const messageStore = [];

/**
 * 전화번호 마스킹
 */
function maskPhone(phone) {
    if (!phone || phone.length < 8) return '****';
    return `${phone.substring(0, 3)}****${phone.slice(-4)}`;
}

/**
 * 발송 레코드 생성 (queued 상태)
 */
function createRecord(correlationId, channel, to, from) {
    const record = {
        id: correlationId,
        createdAt: new Date().toISOString(),
        channel,
        to: maskPhone(to),
        from: maskPhone(from),
        status: 'queued',
        provider: 'Solapi',
        providerId: null,
        errorCode: null,
        errorMessage: null
    };

    // 최대 크기 초과 시 가장 오래된 레코드 제거
    if (messageStore.length >= MAX_RECORDS) {
        messageStore.shift();
    }

    messageStore.push(record);
    return record;
}

/**
 * 발송 성공으로 업데이트
 */
function markSent(correlationId, providerId) {
    const record = messageStore.find(r => r.id === correlationId);
    if (record) {
        record.status = 'sent';
        record.providerId = providerId;
        record.updatedAt = new Date().toISOString();
    }
    return record;
}

/**
 * 발송 실패로 업데이트
 */
function markFailed(correlationId, errorCode, errorMessage) {
    const record = messageStore.find(r => r.id === correlationId);
    if (record) {
        record.status = 'failed';
        record.errorCode = String(errorCode);
        record.errorMessage = errorMessage?.substring(0, 200) || null;
        record.updatedAt = new Date().toISOString();
    }
    return record;
}

/**
 * 최근 N건 조회
 */
function getRecent(limit = 10) {
    // 최신순 정렬
    return messageStore
        .slice(-limit)
        .reverse();
}

/**
 * 통계 조회
 */
function getStats() {
    const total = messageStore.length;
    const sent = messageStore.filter(r => r.status === 'sent').length;
    const failed = messageStore.filter(r => r.status === 'failed').length;
    const queued = messageStore.filter(r => r.status === 'queued').length;

    const byChannel = {
        sms: messageStore.filter(r => r.channel === 'sms').length,
        ata: messageStore.filter(r => r.channel === 'ata').length
    };

    return {
        total,
        sent,
        failed,
        queued,
        successRate: total > 0 ? Math.round((sent / total) * 100) : 0,
        byChannel
    };
}

/**
 * 저장소 초기화 (테스트용)
 */
function clear() {
    messageStore.length = 0;
}

module.exports = {
    createRecord,
    markSent,
    markFailed,
    getRecent,
    getStats,
    clear
};
