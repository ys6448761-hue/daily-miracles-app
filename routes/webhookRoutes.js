/**
 * Webhook Routes - 소원 인입 채널 통합
 *
 * 엔드포인트:
 * - POST /webhooks/wish-form   - 소원 폼 (웹사이트)
 * - POST /webhooks/kakao       - 카카오톡 채널
 * - POST /webhooks/web         - 웹사이트 일반
 * - GET  /webhooks/status      - 웹훅 상태 확인
 *
 * @version 1.0 - 2026.01.03
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// ========== 서비스 로딩 ==========
let airtableService = null;
try {
    airtableService = require('../services/airtableService');
    console.log('✅ [Webhook] Airtable 서비스 로드 성공');
} catch (error) {
    console.warn('⚠️ [Webhook] Airtable 서비스 로드 실패:', error.message);
}

let metricsService = null;
try {
    metricsService = require('../services/metricsService');
} catch (error) {
    console.warn('⚠️ [Webhook] Metrics 서비스 로드 실패');
}

// ========== 상수 ==========
const CHANNELS = {
    FORM: 'form',
    KAKAO: 'kakao',
    WEB: 'web',
    API: 'api'
};

const STATUS = {
    NEW: 'NEW',
    ACK: 'ACK',
    IN_PROGRESS: 'IN_PROGRESS',
    APPROVED: 'APPROVED',
    STARTED: 'STARTED',
    DONE: 'DONE',
    ESCALATED: 'ESCALATED'
};

const PRIORITY = {
    P0: 'P0',  // 긴급 (RED)
    P1: 'P1',  // 높음
    P2: 'P2',  // 보통
    P3: 'P3'   // 낮음
};

// ========== 유틸리티 ==========

/**
 * 고유 wish_id 생성
 */
function generateWishId() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `WISH-${dateStr}-${random}`;
}

/**
 * 소원 타입 자동 분류
 */
function classifyWishType(content) {
    const lowerContent = content.toLowerCase();

    const typeKeywords = {
        career: ['취업', '이직', '승진', '사업', '창업', '직장', '회사', '일자리', '면접'],
        relationship: ['연애', '결혼', '이별', '사랑', '가족', '친구', '관계', '화해'],
        health: ['건강', '병원', '치료', '수술', '다이어트', '운동', '질병', '회복'],
        finance: ['돈', '재정', '투자', '저축', '대출', '월급', '부자', '경제'],
        education: ['시험', '공부', '합격', '대학', '자격증', '학교', '성적'],
        travel: ['여행', '여수', '관광', '휴가', '해외'],
        spiritual: ['마음', '평화', '행복', '성장', '치유', '명상']
    };

    for (const [type, keywords] of Object.entries(typeKeywords)) {
        if (keywords.some(kw => lowerContent.includes(kw))) {
            return type;
        }
    }

    return 'general';
}

/**
 * 감정 분석 (간단 버전)
 */
function analyzeSentiment(content) {
    const lowerContent = content.toLowerCase();

    const urgentKeywords = ['급해', '빨리', '지금', '당장', '긴급', '절박', '제발'];
    const anxiousKeywords = ['걱정', '불안', '두려', '힘들', '어려', '고민', '막막'];
    const hopefulKeywords = ['희망', '꿈', '소원', '바라', '원해', '되고 싶', '하고 싶'];

    if (urgentKeywords.some(kw => lowerContent.includes(kw))) {
        return 'urgent';
    }
    if (anxiousKeywords.some(kw => lowerContent.includes(kw))) {
        return 'anxious';
    }
    if (hopefulKeywords.some(kw => lowerContent.includes(kw))) {
        return 'hopeful';
    }

    return 'neutral';
}

/**
 * 신호등 판정
 */
function determineSignal(content, sentiment) {
    const lowerContent = content.toLowerCase();

    // RED 키워드 (즉시 대응)
    const redKeywords = ['자살', '죽고 싶', '자해', '극단적', '포기', '끝내고'];
    if (redKeywords.some(kw => lowerContent.includes(kw))) {
        return 'red';
    }

    // YELLOW 키워드 (주의 필요)
    const yellowKeywords = ['힘들어', '우울', '외로', '고통', '괴로'];
    if (yellowKeywords.some(kw => lowerContent.includes(kw)) || sentiment === 'urgent' || sentiment === 'anxious') {
        return 'yellow';
    }

    return 'green';
}

/**
 * 우선순위 결정
 */
function determinePriority(signal, sentiment) {
    if (signal === 'red') return PRIORITY.P0;
    if (signal === 'yellow' || sentiment === 'urgent') return PRIORITY.P1;
    if (sentiment === 'anxious') return PRIORITY.P2;
    return PRIORITY.P3;
}

/**
 * 민감 여부 판단
 */
function checkSensitive(content) {
    const sensitiveKeywords = ['자살', '자해', '죽', '폭력', '학대', '성폭력', '우울증'];
    return sensitiveKeywords.some(kw => content.includes(kw));
}

/**
 * 인간 개입 필요 여부
 */
function requiresHumanIntervention(signal, isSensitive) {
    return signal === 'red' || isSensitive;
}

/**
 * 내용 요약 생성 (앞 50자)
 */
function generateSummary(content) {
    const cleaned = content.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= 50) return cleaned;
    return cleaned.substring(0, 47) + '...';
}

/**
 * 담당자 자동 배정
 */
function assignHandler(signal, type) {
    if (signal === 'red') return '재미';  // CRO - 긴급 대응
    if (type === 'relationship' || type === 'spiritual') return '여의보주';  // 품질 검수
    return 'auto';  // 자동 처리
}

// ========== 공통 처리 함수 ==========

/**
 * 소원 인입 공통 처리
 */
async function processWishIntake(payload, channel) {
    const wishId = generateWishId();
    const content = payload.wish_content || payload.content || '';

    // 자동 분류
    const type = classifyWishType(content);
    const sentiment = analyzeSentiment(content);
    const signal = determineSignal(content, sentiment);
    const priority = determinePriority(signal, sentiment);
    const isSensitive = checkSensitive(content);
    const requiresHuman = requiresHumanIntervention(signal, isSensitive);
    const summary = generateSummary(content);
    const assignedTo = assignHandler(signal, type);

    // Airtable 레코드 데이터
    const wishRecord = {
        wish_id: wishId,
        channel,
        status: STATUS.NEW,
        priority,
        type,
        sentiment,
        signal,
        content,
        content_summary: summary,
        is_sensitive: isSensitive,
        requires_human: requiresHuman,
        assigned_to: assignedTo,

        // 원본 데이터
        raw_payload: JSON.stringify(payload),
        name: payload.name || payload.nickname || '',
        phone: payload.phone || '',
        email: payload.email || '',
        gem_type: payload.gem_type || ''
    };

    console.log(`[Webhook] 소원 인입: ${wishId} | ${channel} | ${signal.toUpperCase()} | ${type}`);

    // Airtable 저장
    let airtableResult = { success: false, simulated: true };
    if (airtableService && airtableService.createWishInbox) {
        airtableResult = await airtableService.createWishInbox(wishRecord);
    }

    // 메트릭스 기록
    if (metricsService && metricsService.recordWish) {
        metricsService.recordWish(signal);
    }

    // RED 신호 시 즉시 알림
    if (signal === 'red' && airtableService && airtableService.createAlert) {
        await airtableService.createAlert('🔴', 'RED_CASE', `RED 소원 감지: ${summary}`, {
            wishId,
            channel,
            assignedTo
        });
    }

    return {
        wish_id: wishId,
        channel,
        status: STATUS.NEW,
        signal,
        priority,
        type,
        sentiment,
        assigned_to: assignedTo,
        requires_human: requiresHuman,
        airtable: airtableResult
    };
}

// ========== 엔드포인트 ==========

/**
 * POST /webhooks/wish-form
 * 소원 폼 (웹사이트) 웹훅
 */
router.post('/wish-form', async (req, res) => {
    try {
        const payload = req.body;

        if (!payload.wish_content && !payload.content) {
            return res.status(400).json({
                success: false,
                error: 'wish_content is required'
            });
        }

        const result = await processWishIntake(payload, CHANNELS.FORM);

        res.json({
            success: true,
            message: '소원이 접수되었습니다',
            ...result
        });

    } catch (error) {
        console.error('[Webhook] wish-form 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /webhooks/kakao
 * 카카오톡 채널 웹훅
 */
router.post('/kakao', async (req, res) => {
    try {
        const payload = req.body;

        // 카카오 웹훅 포맷 변환
        const normalizedPayload = {
            wish_content: payload.content || payload.message || payload.text || '',
            name: payload.user_name || payload.nickname || '',
            phone: payload.phone_number || payload.phone || '',
            kakao_user_id: payload.user_id || ''
        };

        if (!normalizedPayload.wish_content) {
            return res.status(400).json({
                success: false,
                error: 'content is required'
            });
        }

        const result = await processWishIntake(normalizedPayload, CHANNELS.KAKAO);

        res.json({
            success: true,
            message: '카카오톡 소원이 접수되었습니다',
            ...result
        });

    } catch (error) {
        console.error('[Webhook] kakao 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /webhooks/web
 * 웹사이트 일반 웹훅
 */
router.post('/web', async (req, res) => {
    try {
        const payload = req.body;

        if (!payload.wish_content && !payload.content) {
            return res.status(400).json({
                success: false,
                error: 'wish_content or content is required'
            });
        }

        const result = await processWishIntake(payload, CHANNELS.WEB);

        res.json({
            success: true,
            message: '웹 소원이 접수되었습니다',
            ...result
        });

    } catch (error) {
        console.error('[Webhook] web 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /webhooks/status
 * 웹훅 상태 확인
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        status: 'operational',
        endpoints: [
            { path: '/webhooks/wish-form', method: 'POST', description: '소원 폼' },
            { path: '/webhooks/kakao', method: 'POST', description: '카카오톡' },
            { path: '/webhooks/web', method: 'POST', description: '웹사이트' }
        ],
        airtable: airtableService ? airtableService.isEnabled() : false,
        version: '1.0'
    });
});

/**
 * POST /webhooks/test
 * 웹훅 테스트 (개발용)
 */
router.post('/test', async (req, res) => {
    try {
        const testPayload = {
            wish_content: req.body.wish_content || '테스트 소원입니다. 취업에 성공하고 싶어요!',
            name: req.body.name || '테스트 소원이',
            phone: req.body.phone || '010-0000-0000',
            gem_type: req.body.gem_type || 'ruby'
        };

        const result = await processWishIntake(testPayload, 'test');

        res.json({
            success: true,
            message: '테스트 소원 처리 완료',
            test: true,
            ...result
        });

    } catch (error) {
        console.error('[Webhook] test 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
