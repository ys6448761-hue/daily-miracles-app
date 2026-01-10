/**
 * notionOpsService.js
 *
 * Notion Offline Ops Log 연동 서비스
 * - Wix 리드 접수 시 노션 DB에 자동 기록
 * - 운영 상태 추적
 *
 * @version 1.0 - 2026-01-10
 */

const { Client } = require('@notionhq/client');

// 환경변수
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_OPS_DB_ID = process.env.NOTION_OPS_DB_ID;  // Offline Ops Log DB ID

// 노션 클라이언트
let notion = null;

if (NOTION_API_KEY) {
    notion = new Client({ auth: NOTION_API_KEY });
    console.log('[NotionOps] 클라이언트 초기화 완료');
} else {
    console.warn('[NotionOps] NOTION_API_KEY 미설정 - 노션 연동 비활성화');
}

// 비상 알림 서비스 (선택적 로드)
let emergencyAlert = null;
try {
    emergencyAlert = require('./emergencyAlertService');
    console.log('[NotionOps] 비상 알림 서비스 연동 완료');
} catch (e) {
    console.warn('[NotionOps] 비상 알림 서비스 로드 실패');
}

/**
 * 유형 매핑 (API → 노션 Select)
 */
const TYPE_MAP = {
    'quote': '견적',
    'payment': '결제',
    'refund': '환불',
    'schedule': '일정변경',
    'tech': '기술오류',
    'crew': '입항',
    'other': '기타'
};

/**
 * 채널 매핑
 */
const CHANNEL_MAP = {
    'wix_form': 'Wix',
    'wix': 'Wix',
    'kakao': '카톡',
    'sms': '문자',
    'phone': '전화',
    'email': '이메일',
    'app': '앱'
};

/**
 * 긴급도 판단
 */
function determineUrgency(data) {
    // 결제/환불 → 상
    if (['payment', 'refund', '결제', '환불'].includes(data.type)) {
        return '상';
    }
    // 당일 여행 → 상
    if (data.trip_start) {
        const tripDate = new Date(data.trip_start);
        const today = new Date();
        const diffDays = Math.ceil((tripDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) return '상';
        if (diffDays <= 7) return '중';
    }
    return '하';
}

/**
 * SLA 계산 (긴급도에 따라)
 */
function calculateSLA(urgency) {
    const now = new Date();
    switch (urgency) {
        case '상':
            return new Date(now.getTime() + 3 * 60 * 60 * 1000);  // 3시간
        case '중':
            return new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12시간
        default:
            return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24시간
    }
}

/**
 * Offline Ops Log에 새 항목 추가
 *
 * @param {Object} data - 리드 데이터
 * @param {string} data.quote_id - 견적/리드 ID
 * @param {string} data.customer_name - 고객명
 * @param {string} data.customer_phone - 연락처
 * @param {string} data.source - 채널 (wix_form, kakao 등)
 * @param {string} data.type - 유형
 * @param {string} data.notes - 요청 내용
 * @param {string} data.trip_start - 여행일
 * @param {number} data.guest_count - 인원
 */
async function createOpsLog(data) {
    if (!notion || !NOTION_OPS_DB_ID) {
        console.warn('[NotionOps] 노션 연동 비활성화 - 로그 스킵');
        return { success: false, reason: 'notion_disabled' };
    }

    try {
        const urgency = determineUrgency(data);
        const sla = calculateSLA(urgency);
        const channel = CHANNEL_MAP[data.source] || data.source || 'Wix';
        const type = TYPE_MAP[data.type] || '견적';

        // 요청 요약 생성
        const summary = [
            data.notes,
            data.trip_start ? `여행일: ${data.trip_start}` : null,
            data.guest_count ? `${data.guest_count}명` : null
        ].filter(Boolean).join(' / ') || '문의';

        const response = await notion.pages.create({
            parent: { database_id: NOTION_OPS_DB_ID },
            properties: {
                // Title
                '요청 제목': {
                    title: [{ text: { content: `[${data.quote_id}] ${data.customer_name || '고객'}` } }]
                },
                // 접수일시
                '접수일시': {
                    date: { start: new Date().toISOString() }
                },
                // 채널
                '채널': {
                    select: { name: channel }
                },
                // 이름
                '이름': {
                    rich_text: [{ text: { content: data.customer_name || '' } }]
                },
                // 연락처
                '연락처': {
                    rich_text: [{ text: { content: data.customer_phone || '' } }]
                },
                // 유형
                '유형': {
                    select: { name: type }
                },
                // 긴급도
                '긴급도': {
                    select: { name: urgency }
                },
                // 요청 요약
                '요청 요약': {
                    rich_text: [{ text: { content: summary } }]
                },
                // 상태
                '상태': {
                    select: { name: 'new' }
                },
                // SLA
                'SLA(응답기한)': {
                    date: { start: sla.toISOString() }
                }
            }
        });

        console.log(`[NotionOps] 로그 생성 완료: ${data.quote_id}`);

        // 긴급 리드인 경우 비상 알림 발송
        if (urgency === '상' && emergencyAlert) {
            setImmediate(async () => {
                try {
                    await emergencyAlert.alertHighPriorityLead({
                        customer_name: data.customer_name || '고객',
                        phone: data.customer_phone,
                        urgency,
                        summary,
                        sla: '3시간'
                    });
                    console.log(`[NotionOps] 긴급 리드 알림 발송 완료: ${data.quote_id}`);
                } catch (alertErr) {
                    console.warn(`[NotionOps] 긴급 알림 발송 실패:`, alertErr.message);
                }
            });
        }

        return {
            success: true,
            pageId: response.id,
            pageUrl: response.url,
            urgency
        };

    } catch (error) {
        console.error('[NotionOps] 로그 생성 실패:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 상태 업데이트
 */
async function updateOpsStatus(pageId, status, memo = null) {
    if (!notion) {
        return { success: false, reason: 'notion_disabled' };
    }

    try {
        const properties = {
            '상태': { select: { name: status } }
        };

        if (status === 'replied' || status === 'closed') {
            properties['마지막 응답시간'] = {
                date: { start: new Date().toISOString() }
            };
        }

        if (memo) {
            properties['메모'] = {
                rich_text: [{ text: { content: memo } }]
            };
        }

        await notion.pages.update({
            page_id: pageId,
            properties
        });

        console.log(`[NotionOps] 상태 업데이트: ${pageId} → ${status}`);
        return { success: true };

    } catch (error) {
        console.error('[NotionOps] 상태 업데이트 실패:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 노션 연동 상태 확인
 */
async function checkConnection() {
    if (!notion) {
        return { connected: false, reason: 'api_key_missing' };
    }
    if (!NOTION_OPS_DB_ID) {
        return { connected: false, reason: 'db_id_missing' };
    }

    try {
        await notion.databases.retrieve({ database_id: NOTION_OPS_DB_ID });
        return { connected: true };
    } catch (error) {
        return { connected: false, reason: error.message };
    }
}

module.exports = {
    createOpsLog,
    updateOpsStatus,
    checkConnection
};
