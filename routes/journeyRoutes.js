/**
 * Wish Journey Pipeline API
 * 소원 여정 파이프라인 실행 및 상태 관리
 *
 * @version 1.0 - 2026.01.03
 */

const express = require('express');
const router = express.Router();

// ========== 서비스 로딩 ==========
let airtableService = null;
try {
    airtableService = require('../services/airtableService');
} catch (error) {
    console.warn('[Journey] Airtable 서비스 로드 실패');
}

let metricsService = null;
try {
    metricsService = require('../services/metricsService');
} catch (error) {
    console.warn('[Journey] Metrics 서비스 로드 실패');
}

// ========== 상수 ==========
const JOURNEY_STATUS = {
    PENDING: 'PENDING',           // 대기
    INTAKE_DONE: 'INTAKE_DONE',   // 접수 완료
    SIGNAL_CHECKED: 'SIGNAL_CHECKED', // 신호등 판정 완료
    ANALYZING: 'ANALYZING',       // 분석 중
    ANALYSIS_DONE: 'ANALYSIS_DONE', // 분석 완료
    IMAGE_GENERATING: 'IMAGE_GENERATING', // 이미지 생성 중
    IMAGE_DONE: 'IMAGE_DONE',     // 이미지 생성 완료
    SENDING: 'SENDING',           // 발송 중
    SENT: 'SENT',                 // 발송 완료
    SCHEDULING: 'SCHEDULING',     // 7일 메시지 예약 중
    COMPLETED: 'COMPLETED',       // 완료
    ON_HOLD: 'ON_HOLD',           // 보류 (RED 신호)
    FAILED: 'FAILED'              // 실패
};

const SIGNAL = {
    RED: 'red',
    YELLOW: 'yellow',
    GREEN: 'green'
};

// ========== 인메모리 저장소 (프로덕션에서는 DB 사용) ==========
const journeys = new Map();

// ========== 유틸리티 ==========

/**
 * 여정 ID 생성
 */
function generateJourneyId() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `JRN-${dateStr}-${random}`;
}

/**
 * 여정 생성
 */
function createJourney(wishId, wishData) {
    const journeyId = generateJourneyId();
    const journey = {
        journey_id: journeyId,
        wish_id: wishId,
        status: JOURNEY_STATUS.PENDING,
        signal: null,
        steps: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        wish_data: wishData,
        results: {}
    };
    journeys.set(journeyId, journey);
    return journey;
}

/**
 * 여정 단계 추가
 */
function addStep(journeyId, stepName, status, data = {}) {
    const journey = journeys.get(journeyId);
    if (!journey) return null;

    const step = {
        step: stepName,
        status,
        timestamp: new Date().toISOString(),
        ...data
    };

    journey.steps.push(step);
    journey.updated_at = new Date().toISOString();
    return step;
}

/**
 * 여정 상태 업데이트
 */
function updateJourneyStatus(journeyId, status, data = {}) {
    const journey = journeys.get(journeyId);
    if (!journey) return null;

    journey.status = status;
    journey.updated_at = new Date().toISOString();
    Object.assign(journey, data);

    return journey;
}

// ========== 파이프라인 단계 함수 ==========

/**
 * Step 1.5: 신호등 판정
 */
async function checkSignal(journey) {
    const content = journey.wish_data.wish_content || journey.wish_data.wish || '';
    const lowerContent = content.toLowerCase();

    // RED 키워드 (위험)
    const redKeywords = ['자살', '죽고 싶', '자해', '극단적', '포기', '끝내고'];
    for (const kw of redKeywords) {
        if (lowerContent.includes(kw)) {
            return {
                signal: SIGNAL.RED,
                reason: `위험 키워드 감지: "${kw}"`,
                action: 'CRO 즉시 개입 필요'
            };
        }
    }

    // YELLOW 키워드 (주의)
    const yellowKeywords = ['힘들어', '우울', '외로', '고통', '괴로', '걱정', '불안', '급해', '빨리', '당장'];
    for (const kw of yellowKeywords) {
        if (lowerContent.includes(kw)) {
            return {
                signal: SIGNAL.YELLOW,
                reason: `주의 키워드 감지: "${kw}"`,
                action: '24시간 내 CRO 검토'
            };
        }
    }

    // GREEN (정상)
    return {
        signal: SIGNAL.GREEN,
        reason: '정상 소원',
        action: '자동 처리 진행'
    };
}

/**
 * Step 2: 기적 분석 (시뮬레이션)
 */
async function analyzeMiracle(journey) {
    // 기적지수 계산 (50-100)
    const miracleIndex = 50 + Math.floor(Math.random() * 51);

    // 5대 운세 (시뮬레이션)
    const fiveDestinies = {
        love: Math.floor(Math.random() * 100),
        career: Math.floor(Math.random() * 100),
        health: Math.floor(Math.random() * 100),
        wealth: Math.floor(Math.random() * 100),
        luck: Math.floor(Math.random() * 100)
    };

    return {
        miracle_index: miracleIndex,
        five_destinies: fiveDestinies,
        analyzed_at: new Date().toISOString()
    };
}

/**
 * Step 3: 소원그림 생성 요청 (시뮬레이션)
 */
async function generateImage(journey) {
    // 실제로는 wish-image API 호출
    // 여기서는 시뮬레이션
    return {
        image_url: `${process.env.APP_BASE_URL || 'https://app.dailymiracles.kr'}/images/wish_${journey.wish_id}.png`,
        generated_at: new Date().toISOString()
    };
}

/**
 * Step 5: 결과 전달 (시뮬레이션)
 */
async function sendResults(journey) {
    const phone = journey.wish_data.phone;
    if (!phone) {
        return { sent: false, reason: '전화번호 없음' };
    }

    // 실제로는 Solapi 발송
    return {
        sent: true,
        method: 'kakao',
        sent_at: new Date().toISOString()
    };
}

/**
 * Step 6: 7일 메시지 예약 (시뮬레이션)
 */
async function scheduleMessages(journey) {
    const schedules = [];
    const startDate = new Date();

    for (let day = 1; day <= 7; day++) {
        const sendDate = new Date(startDate);
        sendDate.setDate(sendDate.getDate() + day);

        schedules.push({
            day,
            scheduled_at: sendDate.toISOString(),
            status: 'scheduled'
        });
    }

    return {
        scheduled_count: 7,
        schedules
    };
}

// ========== 파이프라인 실행 ==========

/**
 * 전체 파이프라인 실행
 */
async function runPipeline(journey) {
    const journeyId = journey.journey_id;

    try {
        // Step 1: 접수 완료 (이미 처리됨)
        addStep(journeyId, 'INTAKE', 'completed', { wish_id: journey.wish_id });
        updateJourneyStatus(journeyId, JOURNEY_STATUS.INTAKE_DONE);

        // Step 1.5: 신호등 판정
        const signalResult = await checkSignal(journey);
        journey.signal = signalResult.signal;
        addStep(journeyId, 'SIGNAL_CHECK', 'completed', signalResult);
        updateJourneyStatus(journeyId, JOURNEY_STATUS.SIGNAL_CHECKED, { signal: signalResult.signal });

        // Airtable 상태 업데이트
        if (airtableService && journey.wish_id) {
            await airtableService.updateWishStatus(journey.wish_id, 'IN_PROGRESS', {
                '신호등': signalResult.signal
            });
        }

        // RED 신호 시 보류
        if (signalResult.signal === SIGNAL.RED) {
            addStep(journeyId, 'HOLD', 'waiting', { reason: signalResult.reason });
            updateJourneyStatus(journeyId, JOURNEY_STATUS.ON_HOLD);

            // CRO 알림 발송 (실제 구현 필요)
            console.log(`[Journey] 🔴 RED 신호 - CRO 개입 대기: ${journeyId}`);

            return {
                success: true,
                journey_id: journeyId,
                status: JOURNEY_STATUS.ON_HOLD,
                signal: SIGNAL.RED,
                message: 'RED 신호 감지 - CRO 개입 대기 중'
            };
        }

        // Step 2: 기적 분석
        updateJourneyStatus(journeyId, JOURNEY_STATUS.ANALYZING);
        const analysisResult = await analyzeMiracle(journey);
        journey.results.analysis = analysisResult;
        addStep(journeyId, 'ANALYSIS', 'completed', analysisResult);
        updateJourneyStatus(journeyId, JOURNEY_STATUS.ANALYSIS_DONE);

        // Step 3: 소원그림 생성
        updateJourneyStatus(journeyId, JOURNEY_STATUS.IMAGE_GENERATING);
        const imageResult = await generateImage(journey);
        journey.results.image = imageResult;
        addStep(journeyId, 'IMAGE', 'completed', imageResult);
        updateJourneyStatus(journeyId, JOURNEY_STATUS.IMAGE_DONE);

        // Step 5: 결과 전달
        updateJourneyStatus(journeyId, JOURNEY_STATUS.SENDING);
        const sendResult = await sendResults(journey);
        journey.results.send = sendResult;
        addStep(journeyId, 'SEND', sendResult.sent ? 'completed' : 'skipped', sendResult);
        updateJourneyStatus(journeyId, JOURNEY_STATUS.SENT);

        // Step 6: 7일 메시지 예약
        if (journey.wish_data.want_message) {
            updateJourneyStatus(journeyId, JOURNEY_STATUS.SCHEDULING);
            const scheduleResult = await scheduleMessages(journey);
            journey.results.schedule = scheduleResult;
            addStep(journeyId, 'SCHEDULE', 'completed', scheduleResult);
        }

        // 완료
        updateJourneyStatus(journeyId, JOURNEY_STATUS.COMPLETED);
        addStep(journeyId, 'COMPLETE', 'completed');

        // Airtable 최종 상태 업데이트
        if (airtableService && journey.wish_id) {
            await airtableService.updateWishStatus(journey.wish_id, 'DONE');
        }

        console.log(`[Journey] ✅ 파이프라인 완료: ${journeyId} (${signalResult.signal.toUpperCase()})`);

        return {
            success: true,
            journey_id: journeyId,
            status: JOURNEY_STATUS.COMPLETED,
            signal: signalResult.signal,
            results: journey.results
        };

    } catch (error) {
        console.error(`[Journey] ❌ 파이프라인 오류: ${journeyId}`, error);
        addStep(journeyId, 'ERROR', 'failed', { error: error.message });
        updateJourneyStatus(journeyId, JOURNEY_STATUS.FAILED);

        return {
            success: false,
            journey_id: journeyId,
            status: JOURNEY_STATUS.FAILED,
            error: error.message
        };
    }
}

// ========== API 엔드포인트 ==========

/**
 * POST /api/journey/start
 * 새 여정 시작
 */
router.post('/start', async (req, res) => {
    try {
        const { wish_id, wish_data } = req.body;

        if (!wish_data) {
            return res.status(400).json({
                success: false,
                error: 'wish_data is required'
            });
        }

        // 여정 생성
        const journey = createJourney(wish_id || `WISH-${Date.now()}`, wish_data);
        console.log(`[Journey] 새 여정 시작: ${journey.journey_id}`);

        // 파이프라인 실행
        const result = await runPipeline(journey);

        res.json(result);

    } catch (error) {
        console.error('[Journey] start 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/journey/:id
 * 여정 상태 조회
 */
router.get('/:id', (req, res) => {
    const journey = journeys.get(req.params.id);

    if (!journey) {
        return res.status(404).json({
            success: false,
            error: 'Journey not found'
        });
    }

    res.json({
        success: true,
        journey
    });
});

/**
 * POST /api/journey/:id/resume
 * 보류 중인 여정 재개 (CRO 승인 후)
 */
router.post('/:id/resume', async (req, res) => {
    try {
        const journey = journeys.get(req.params.id);

        if (!journey) {
            return res.status(404).json({
                success: false,
                error: 'Journey not found'
            });
        }

        if (journey.status !== JOURNEY_STATUS.ON_HOLD) {
            return res.status(400).json({
                success: false,
                error: `Journey is not on hold (current: ${journey.status})`
            });
        }

        const { approved_by, notes } = req.body;

        addStep(journey.journey_id, 'CRO_APPROVED', 'completed', {
            approved_by: approved_by || 'CRO',
            notes,
            approved_at: new Date().toISOString()
        });

        // 분석부터 재개
        updateJourneyStatus(journey.journey_id, JOURNEY_STATUS.ANALYZING);

        // 나머지 파이프라인 실행 (Step 2부터)
        const analysisResult = await analyzeMiracle(journey);
        journey.results.analysis = analysisResult;
        addStep(journey.journey_id, 'ANALYSIS', 'completed', analysisResult);

        const imageResult = await generateImage(journey);
        journey.results.image = imageResult;
        addStep(journey.journey_id, 'IMAGE', 'completed', imageResult);

        const sendResult = await sendResults(journey);
        journey.results.send = sendResult;
        addStep(journey.journey_id, 'SEND', sendResult.sent ? 'completed' : 'skipped', sendResult);

        if (journey.wish_data.want_message) {
            const scheduleResult = await scheduleMessages(journey);
            journey.results.schedule = scheduleResult;
            addStep(journey.journey_id, 'SCHEDULE', 'completed', scheduleResult);
        }

        updateJourneyStatus(journey.journey_id, JOURNEY_STATUS.COMPLETED);
        addStep(journey.journey_id, 'COMPLETE', 'completed');

        console.log(`[Journey] ✅ RED 여정 재개 완료: ${journey.journey_id}`);

        res.json({
            success: true,
            journey_id: journey.journey_id,
            status: JOURNEY_STATUS.COMPLETED,
            message: 'Journey resumed and completed'
        });

    } catch (error) {
        console.error('[Journey] resume 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/journey/list/pending
 * 보류 중인 여정 목록 (RED 신호)
 */
router.get('/list/pending', (req, res) => {
    const pending = [];

    for (const [id, journey] of journeys) {
        if (journey.status === JOURNEY_STATUS.ON_HOLD) {
            pending.push({
                journey_id: id,
                wish_id: journey.wish_id,
                signal: journey.signal,
                created_at: journey.created_at,
                wish_preview: (journey.wish_data.wish_content || journey.wish_data.wish || '').substring(0, 50)
            });
        }
    }

    res.json({
        success: true,
        count: pending.length,
        pending
    });
});

/**
 * GET /api/journey/stats
 * 여정 통계
 */
router.get('/stats/summary', (req, res) => {
    const stats = {
        total: journeys.size,
        by_status: {},
        by_signal: { red: 0, yellow: 0, green: 0 }
    };

    for (const [, journey] of journeys) {
        // 상태별
        stats.by_status[journey.status] = (stats.by_status[journey.status] || 0) + 1;

        // 신호별
        if (journey.signal) {
            stats.by_signal[journey.signal]++;
        }
    }

    res.json({
        success: true,
        stats
    });
});

module.exports = router;
