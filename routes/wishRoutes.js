/**
 * 소원실현 API 라우트
 * POST /api/wishes - 소원 제출
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { generateWishAckMessage, generateRedAlertMessage } = require('../config/messageTemplates');

// 통합 점수 엔진 v2.0
const { calculateUnifiedScore, ENERGY_TYPES, VERSION: SCORE_VERSION } = require('../services/miracleScoreEngine');

// 메시지 프로바이더 (SENS 우선, Solapi fallback)
let messageProvider = null;
try {
    messageProvider = require('../services/messageProvider');
    console.log('[Wish] messageProvider 로드 성공:', messageProvider.getConfig());
} catch (e) {
    console.warn('[Wish] messageProvider 로드 실패:', e.message);
}
const {
    recordWishInbox,
    recordTrafficLight,
    recordAckEligible,
    recordGem,
    recordBirthdateProvided,
    recordUpgradeClick,
    recordUpgradeComplete
} = require('../services/metricsService');
const { logEvent, EVENT_TYPES } = require('../services/eventLogger');

// 데이터 저장 경로
const DATA_DIR = path.join(__dirname, '..', 'data', 'wishes');

// 폴더 생성 확인
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
}

/**
 * POST /api/wishes
 * 소원 제출
 */
router.post('/', async (req, res) => {
    const log = req.log || console;
    try {
        const {
            name,
            birthdate,
            phone,
            gem,
            gem_recommended,     // 소원 기반 추천값 (프론트에서 전송)
            wish,
            want_message,        // 7일 메시지 수신 여부
            privacy_agreed,
            marketing_agreed,
            created_at
        } = req.body;

        // 기본 필수 검사 (이름, 소원만 필수 / 생년월일은 선택)
        if (!name || !wish) {
            return res.status(400).json({
                success: false,
                message: '이름과 소원은 필수 입력입니다'
            });
        }

        // 전화번호 정규화 (숫자만 추출)
        const rawPhone = phone || '';
        const normalizedPhone = rawPhone.replace(/[^0-9]/g, '');

        // 전화번호 검증 로깅 (PII-safe: 길이만 기록)
        if (rawPhone) {
            log.info('[Wish] phone_validated', { rawLen: rawPhone.length, normalizedLen: normalizedPhone.length });
        }

        // 7일 메시지 선택 시 추가 검사
        if (want_message) {
            if (!normalizedPhone) {
                return res.status(400).json({
                    success: false,
                    message: '7일 메시지를 받으려면 연락처를 입력해주세요'
                });
            }

            // 전화번호 검증 (정규화된 번호로, 정확히 11자리)
            if (normalizedPhone.length !== 11) {
                log.info('[Wish] phone_rejected', { reason: 'invalid_length', length: normalizedPhone.length, expected: 11 });
                return res.status(400).json({
                    success: false,
                    message: `올바른 휴대폰 번호를 입력해주세요 (11자리, 현재: ${normalizedPhone.length}자리)`
                });
            }

            // 01X로 시작하는지 확인
            if (!/^01[0-9]/.test(normalizedPhone)) {
                log.info('[Wish] phone_rejected', { reason: 'invalid_prefix' });
                return res.status(400).json({
                    success: false,
                    message: '올바른 휴대폰 번호를 입력해주세요 (01X로 시작)'
                });
            }

            if (!privacy_agreed || !marketing_agreed) {
                return res.status(400).json({
                    success: false,
                    message: '7일 메시지를 받으려면 개인정보 및 마케팅 수신에 동의해주세요'
                });
            }
        }

        // 보석 폴백 기본값 처리 (citrine)
        const validGems = ['ruby', 'sapphire', 'emerald', 'diamond', 'citrine'];
        const finalGem = validGems.includes(gem) ? gem : 'citrine';

        if (!gem || !validGems.includes(gem)) {
            log.info('[Wish] gem_fallback', { received: gem });
        }

        // 신호등 자동 판정
        const trafficLight = classifyWish(wish);

        // 통합 기적지수 계산 (v2.0)
        const scoreResult = calculateUnifiedScore({
            content: wish,
            name: name,
            phone: normalizedPhone,
            mode: 'wish'
        });

        // 일일 제한 도달 시 처리
        if (!scoreResult.success && scoreResult.error === 'daily_limit') {
            log.info('[Wish] daily_limit', { action: 'fallback_score_used' });
            // 일일 제한이어도 소원은 저장하고 기본값 사용
        }

        const miracleScore = scoreResult.success ? scoreResult.final_score : 75;
        const energyType = scoreResult.success ? scoreResult.energy_type : 'citrine';
        const confidence = scoreResult.success ? scoreResult.confidence : 'low';

        // gem 추천 로그용 필드 계산
        const gemRecommended = gem_recommended || null;  // 프론트에서 추천한 값
        const gemSelected = gem || null;                  // 사용자가 선택한 값
        const gemChanged = gemRecommended && gemSelected && gemRecommended !== gemSelected;

        // 데이터 구성
        const wishData = {
            id: Date.now().toString(),
            name,
            birthdate: birthdate || null,  // 선택 항목
            phone: normalizedPhone || null,  // 정규화된 전화번호 (숫자만)
            gem: finalGem,
            gem_meaning: getGemMeaning(finalGem),
            gem_recommended: gemRecommended,    // 추천값
            gem_selected: gemSelected,          // 사용자 선택값
            gem_changed: gemChanged,            // 추천에서 변경 여부
            wish,
            want_message: want_message || false,
            privacy_agreed: privacy_agreed || false,
            marketing_agreed: marketing_agreed || false,
            created_at: created_at || new Date().toISOString(),
            status: 'pending', // pending, analyzed, completed
            traffic_light: trafficLight,
            miracleScore,
            // v2.0 통합 점수 엔진 필드
            score_engine: {
                version: SCORE_VERSION,
                base_score: scoreResult.success ? scoreResult.base_score : null,
                daily_delta: scoreResult.success ? scoreResult.daily_delta : null,
                confidence: confidence,
                energy_type: energyType,
                cached: scoreResult.cached || false,
                score_factors: scoreResult.success ? scoreResult.score_factors : null
            }
        };

        // 파일 저장
        await ensureDataDir();
        const filename = `${wishData.id}_${name.replace(/\s/g, '_')}.json`;
        const filepath = path.join(DATA_DIR, filename);
        await fs.writeFile(filepath, JSON.stringify(wishData, null, 2), 'utf8');

        // 날짜별 집계 파일에도 추가
        const today = new Date().toISOString().split('T')[0];
        const dailyFile = path.join(DATA_DIR, `daily_${today}.json`);

        let dailyData = [];
        try {
            const existing = await fs.readFile(dailyFile, 'utf8');
            dailyData = JSON.parse(existing);
        } catch (err) {
            // 파일이 없으면 빈 배열
        }

        dailyData.push(wishData);
        await fs.writeFile(dailyFile, JSON.stringify(dailyData, null, 2), 'utf8');

        // 메트릭스 기록
        recordWishInbox('new', want_message);
        recordTrafficLight(trafficLight.level);
        recordGem(gemRecommended, gemSelected);
        recordBirthdateProvided(!!birthdate);  // 생년월일 입력 여부
        if (want_message && phone) {
            recordAckEligible();  // ACK 대상 카운트
        }

        // 마케팅 이벤트 로깅: trial_start (7일 메시지 수신 = 무료 체험 시작)
        if (want_message && normalizedPhone) {
            logEvent(EVENT_TYPES.TRIAL_START, {
                wish_id: wishData.id,
                gem: finalGem,
                traffic_light: trafficLight.level
            }, { source: 'wishRoutes' }).catch(err => {
                log.warn('[Wish] event_log_failed', { error: err.message });
            });
        }

        // wish 접수 로깅 (PII-safe)
        log.info('[Wish] wish_received', { level: trafficLight.level, gem: finalGem });

        // RED 신호 시 긴급 경고 및 알림
        if (trafficLight.level === 'RED') {
            log.warn('[Wish] red_signal', { reason: trafficLight.reason });

            // 재미(CRO) 긴급 알림 메시지 생성 및 발송
            const redAlert = generateRedAlertMessage(wishData);

            // messageProvider로 RED 알림 발송
            if (messageProvider?.isEnabled()) {
                const alertResult = await messageProvider.sendRedAlertMessage(wishData);
                log.info('[Wish] red_alert_sent', { success: alertResult.success });
            } else {
                log.info('[Wish] red_alert_skipped', { reason: 'no_message_provider' });
            }
        }

        // ACK 메시지 발송 (GREEN/YELLOW만 즉시 발송, normalizedPhone이 있을 때만)
        if (trafficLight.level !== 'RED' && normalizedPhone && want_message) {
            const ackMessages = generateWishAckMessage(wishData);
            log.info('[Wish] ack_generated', { phoneLen: normalizedPhone.length });

            // messageProvider로 ACK 발송
            if (messageProvider?.isEnabled()) {
                const ackResult = await messageProvider.sendWishAckMessage(normalizedPhone, wishData);
                log.info('[Wish] ack_sent', { success: ackResult.success });
            } else {
                log.info('[Wish] ack_skipped', { reason: 'no_message_provider' });
            }
        } else if (!want_message) {
            log.info('[Wish] ack_skipped', { reason: 'no_message_requested' });
        } else if (!normalizedPhone) {
            log.info('[Wish] ack_skipped', { reason: 'no_phone' });
        }

        res.json({
            success: true,
            message: '소원이 성공적으로 전달되었습니다',
            wishId: wishData.id,
            miracleScore: miracleScore,
            trafficLight: trafficLight.level,
            current_stage: getCurrentStage(miracleScore),
            ...getSummaryAndAction(trafficLight.level, getCurrentStage(miracleScore).code),
            // v2.0 통합 점수 엔진 응답
            score_engine: scoreResult.success ? {
                base_score: scoreResult.base_score,
                daily_delta: scoreResult.daily_delta,
                final_score: scoreResult.final_score,
                confidence: scoreResult.confidence,
                confidence_detail: scoreResult.confidence_detail,
                energy_type: scoreResult.energy_type,
                energy_name: scoreResult.energy_name,
                energy_meaning: scoreResult.energy_meaning,
                score_factors: scoreResult.score_factors,
                analysis_version: scoreResult.analysis_version,
                cached: scoreResult.cached || false
            } : null
        });

    } catch (error) {
        (req.log || console).error('[Wish] wish_submit_failed', { error: error.message });
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

/**
 * GET /api/wishes/today
 * 오늘 접수된 소원 목록 (관리자용)
 */
router.get('/today', async (req, res) => {
    const log = req.log || console;
    try {
        await ensureDataDir();
        const today = new Date().toISOString().split('T')[0];
        const dailyFile = path.join(DATA_DIR, `daily_${today}.json`);

        let dailyData = [];
        try {
            const existing = await fs.readFile(dailyFile, 'utf8');
            dailyData = JSON.parse(existing);
        } catch (err) {
            // 파일이 없으면 빈 배열
        }

        res.json({
            success: true,
            date: today,
            count: dailyData.length,
            wishes: dailyData
        });

    } catch (error) {
        log.error('[Wish] wish_list_failed', { error: error.message });
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

/**
 * POST /api/wishes/metrics/upgrade-click
 * 업그레이드 CTA 클릭 메트릭 기록
 */
router.post('/metrics/upgrade-click', async (req, res) => {
    const log = req.log || console;
    try {
        recordUpgradeClick();
        log.info('[Wish] upgrade_click', {});
        res.json({ success: true });
    } catch (error) {
        log.error('[Wish] upgrade_click_failed', { error: error.message });
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

/**
 * POST /api/wishes/upgrade-birthdate
 * 업그레이드 - 생년월일 저장
 */
router.post('/upgrade-birthdate', async (req, res) => {
    const log = req.log || console;
    try {
        const { wishId, birthdate } = req.body;

        if (!wishId || !birthdate) {
            return res.status(400).json({
                success: false,
                message: '소원 ID와 생년월일이 필요합니다'
            });
        }

        // 생년월일 형식 검증 (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
            return res.status(400).json({
                success: false,
                message: '올바른 생년월일 형식이 아닙니다 (YYYY-MM-DD)'
            });
        }

        await ensureDataDir();

        // 개별 파일 찾기 및 업데이트
        const files = await fs.readdir(DATA_DIR);
        const wishFile = files.find(f => f.startsWith(wishId + '_'));

        if (!wishFile) {
            return res.status(404).json({
                success: false,
                message: '해당 소원을 찾을 수 없습니다'
            });
        }

        const filepath = path.join(DATA_DIR, wishFile);
        const content = await fs.readFile(filepath, 'utf8');
        const wishData = JSON.parse(content);

        // 생년월일 업데이트
        wishData.birthdate = birthdate;
        wishData.birthdate_upgraded_at = new Date().toISOString();

        await fs.writeFile(filepath, JSON.stringify(wishData, null, 2), 'utf8');

        // 일별 파일도 업데이트
        const today = new Date().toISOString().split('T')[0];
        const dailyFile = path.join(DATA_DIR, `daily_${today}.json`);

        try {
            const dailyContent = await fs.readFile(dailyFile, 'utf8');
            const dailyData = JSON.parse(dailyContent);
            const idx = dailyData.findIndex(w => w.id === wishId);
            if (idx >= 0) {
                dailyData[idx].birthdate = birthdate;
                dailyData[idx].birthdate_upgraded_at = wishData.birthdate_upgraded_at;
                await fs.writeFile(dailyFile, JSON.stringify(dailyData, null, 2), 'utf8');
            }
        } catch (err) {
            // 일별 파일 업데이트 실패는 무시 (크리티컬하지 않음)
        }

        // 메트릭 기록
        recordUpgradeComplete();
        log.info('[Wish] birthdate_saved', { wishId });

        res.json({
            success: true,
            message: '생년월일이 저장되었습니다',
            wishId,
            birthdate
        });

    } catch (error) {
        log.error('[Wish] birthdate_save_failed', { error: error.message });
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

/**
 * 보석 의미 반환
 */
/**
 * traffic_light_level + current_stage.code → summary_line / today_action 룰 엔진
 */
const SUMMARY_RULES = {
    GREEN: {
        1: {
            summary_line: '지금은 마음을 차분히 정리하며 다음 걸음을 준비하기 좋은 상태예요',
            today_action: '걱정을 한 문장으로 적고, 그 감정을 그냥 바라봐보세요'
        },
        2: {
            summary_line: '지금은 방향을 하나로 좁혀 첫 움직임을 준비하기 좋은 흐름이에요',
            today_action: '오늘 가장 중요한 문제 하나를 고르고, 나머지는 내일로 미뤄보세요'
        },
        3: {
            summary_line: '지금은 아주 작은 실행을 시작하기 좋은 상태예요',
            today_action: '오늘 할 행동을 딱 하나만 골라 10분 안에 끝낼 수 있게 줄여보세요'
        },
        4: {
            summary_line: '지금은 기존 습관을 꾸준히 이어가는 것이 가장 중요한 상태예요',
            today_action: '기존 습관 중 하나를 오늘 한 번 그대로 해보세요'
        }
    },
    YELLOW: {
        1: {
            summary_line: '지금은 해결보다 마음의 무게를 먼저 알아보는 것이 중요한 상태예요',
            today_action: '걱정을 한 줄 적고, 오늘은 그것을 해결하려 하지 않아도 괜찮아요'
        },
        2: {
            summary_line: '마음은 앞서 있지만, 무엇부터 할지 기준을 정하는 것이 먼저예요',
            today_action: '오늘 바꿀 것 한 가지만 정하고, 나머지는 결정하지 않아도 돼요'
        },
        3: {
            summary_line: '실행할 힘은 있지만, 시작점을 더 작게 만드는 것이 필요한 상태예요',
            today_action: '하려던 행동을 절반으로 줄이고, 실패해도 괜찮은 버전으로 시작해보세요'
        },
        4: {
            summary_line: '지금은 더 앞으로 나가기보다, 흔들린 리듬을 다시 고르게 만드는 것이 먼저예요',
            today_action: '가장 쉬웠던 루틴 하나를 오늘 한 번만 다시 해보세요'
        }
    }
};

function getSummaryAndAction(trafficLevel, stageCode) {
    const level = (trafficLevel || 'GREEN').toUpperCase();
    const code = stageCode || 1;
    const rules = (SUMMARY_RULES[level] || SUMMARY_RULES.GREEN)[code] || SUMMARY_RULES.GREEN[1];
    return rules;
}

/**
 * 기적지수 → 현재 단계 매핑 (4단계)
 */
function getCurrentStage(score) {
    if (score < 65) return { code: 1, label: '감정 정리', desc: '마음이 먼저 지쳐 있어 생각보다 감정 정리가 먼저 필요한 상태예요.' };
    if (score < 75) return { code: 2, label: '방향 정리', desc: '중요한 것은 느끼고 있지만 무엇부터 해야 할지 정해지지 않아 에너지가 흩어지기 쉬워요.' };
    if (score < 85) return { code: 3, label: '실행 시작', desc: '방향은 잡혔고, 이제는 아주 작은 행동으로 흐름을 시작할 차례예요.' };
    return { code: 4, label: '유지 회복', desc: '이미 시작은 했지만 흔들림이 생기기 쉬워 회복 리듬이 필요한 시점이에요.' };
}

function getGemMeaning(gem) {
    const meanings = {
        ruby: '열정과 용기',
        sapphire: '안정과 지혜',
        emerald: '성장과 치유',
        diamond: '명확한 결단',
        citrine: '긍정 에너지와 소통'
    };
    return meanings[gem] || '';
}

/**
 * 신호등 자동 판정 로직
 * RED: 위험 - 즉시 대응 필요
 * YELLOW: 주의 - 검토 필요
 * GREEN: 정상 - 자동 처리 가능
 */
function classifyWish(wishText) {
    const text = wishText.toLowerCase();

    // RED 키워드 (위험 - 즉시 대응)
    const redKeywords = [
        '자살', '죽고싶', '죽고 싶', '죽을래', '죽을 래',
        '자해', '손목', '목숨', '끝내고 싶', '끝내고싶',
        '사라지고 싶', '사라지고싶', '없어지고 싶', '없어지고싶',
        '포기하고 싶', '힘들어서 못살', '살기 싫', '살기싫'
    ];

    for (const keyword of redKeywords) {
        if (text.includes(keyword)) {
            return {
                level: 'RED',
                reason: `위험 키워드 감지: "${keyword}"`,
                action: '즉시 재미(CRO) 알림 발송',
                priority: 1
            };
        }
    }

    // YELLOW 키워드 (주의 - 검토 필요)
    const yellowKeywords = [
        { keyword: '빚', category: '재정' },
        { keyword: '대출', category: '재정' },
        { keyword: '파산', category: '재정' },
        { keyword: '신용불량', category: '재정' },
        { keyword: '암', category: '건강' },
        { keyword: '수술', category: '건강' },
        { keyword: '병원', category: '건강' },
        { keyword: '치료', category: '건강' },
        { keyword: '소송', category: '법적' },
        { keyword: '고소', category: '법적' },
        { keyword: '합의금', category: '법적' },
        { keyword: '이혼', category: '가정' },
        { keyword: '별거', category: '가정' },
        { keyword: '양육권', category: '가정' },
        { keyword: '폭력', category: '위험' },
        { keyword: '학대', category: '위험' }
    ];

    for (const item of yellowKeywords) {
        if (text.includes(item.keyword)) {
            return {
                level: 'YELLOW',
                reason: `주의 키워드 감지 (${item.category}): "${item.keyword}"`,
                action: '24시간 내 재미(CRO) 검토',
                priority: 2
            };
        }
    }

    // GREEN: 일반 소원 (자동 처리 가능)
    return {
        level: 'GREEN',
        reason: '일반 소원',
        action: '자동 처리 및 응원 메시지 발송',
        priority: 3
    };
}

/**
 * 기적지수 계산 (DEPRECATED - v2.0 통합 엔진으로 대체)
 * @deprecated Use calculateUnifiedScore from miracleScoreEngine.js
 */
// function calculateMiracleScore() {
//     return 80 + Math.floor(Math.random() * 16);
// }

module.exports = router;
