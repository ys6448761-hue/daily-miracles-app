/**
 * Miracle Score Engine v2.0 Unified
 *
 * 기적지수 통합 계산 엔진
 * - 3경로(소원/문제/12질문) 단일 엔진 사용
 * - 결정론적 base_score (동일 입력 → 동일 점수)
 * - 아이템포턴시: 24시간 내 동일 입력 재사용
 * - Confidence 기반 정밀도 표시
 * - 에너지 스무딩 (최근 3회 다수결)
 *
 * @version 2.0_unified
 * @since 2026-01-08
 */

const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════
// 상수 정의
// ═══════════════════════════════════════════════════════════

const VERSION = 'v2.0_unified';

// 에너지 타입 정의
const ENERGY_TYPES = {
    ruby: { name: '루비', meaning: '열정과 용기', keywords: ['열정', '용기', '도전', '행동', '적극', '시작', '변화'] },
    sapphire: { name: '사파이어', meaning: '안정과 지혜', keywords: ['안정', '지혜', '평화', '신뢰', '차분', '계획', '신중'] },
    emerald: { name: '에메랄드', meaning: '성장과 치유', keywords: ['성장', '치유', '회복', '건강', '관계', '개선', '발전'] },
    diamond: { name: '다이아몬드', meaning: '명확한 결단', keywords: ['결단', '명확', '목표', '성공', '성취', '승진', '합격'] },
    citrine: { name: '시트린', meaning: '긍정과 소통', keywords: ['긍정', '소통', '대화', '이해', '화해', '친밀', '연결'] }
};

// 키워드 가중치
const KEYWORD_WEIGHTS = {
    // 긍정 키워드 (+점수)
    positive: {
        strong: ['희망', '감사', '행복', '사랑', '꿈', '성공', '좋아', '기쁨'],
        medium: ['원해', '바라', '노력', '시도', '개선', '발전', '성장'],
        light: ['함께', '도움', '지원', '응원', '시작']
    },
    // 부정 키워드 (-점수, 하지만 개선 의지는 가산)
    negative: {
        severe: ['자살', '죽고싶', '포기', '끝내고싶'],
        heavy: ['힘들', '어려', '우울', '불안', '걱정', '두려'],
        medium: ['싸움', '갈등', '문제', '고민']
    },
    // 긴급 키워드 (타이밍 가산)
    urgent: ['지금', '빨리', '급해', '당장', '시급', '곧']
};

// 캐시 저장소 (인메모리, 24시간 TTL)
const scoreCache = new Map();
const energyHistory = new Map(); // 에너지 스무딩용

// ═══════════════════════════════════════════════════════════
// 메인 함수: calculateUnifiedScore
// ═══════════════════════════════════════════════════════════

/**
 * 통합 기적지수 계산
 *
 * @param {Object} input - 입력 데이터
 * @param {string} input.content - 소원/문제 텍스트 (필수)
 * @param {string} input.name - 사용자 이름 (캐시 키용)
 * @param {string} input.phone - 전화번호 (캐시 키용, 선택)
 * @param {Object} input.responses - 12질문 응답 (선택)
 * @param {string} input.mode - 'wish' | 'problem' | 'deep' (선택)
 * @param {boolean} input.includeDailyDelta - 일일 변동 포함 여부 (기본: false)
 * @returns {Object} 점수 결과
 */
function calculateUnifiedScore(input) {
    const startTime = Date.now();

    // 입력 정규화
    const content = (input.content || input.wish || input.problem || '').trim();
    const name = (input.name || '').trim();
    const phone = (input.phone || '').replace(/[^0-9]/g, '');
    const responses = input.responses || {};
    const mode = input.mode || detectMode(content, responses);
    const includeDailyDelta = input.includeDailyDelta || false;

    // 입력 시그니처 생성 (캐시 키)
    const signature = generateSignature(name, content, phone);

    // 캐시 확인 (24시간 이내 동일 입력)
    const cached = checkCache(signature);
    if (cached) {
        console.log('[ScoreEngine] Cache hit:', signature.substring(0, 8));
        return {
            ...cached,
            cached: true,
            cache_message: '오늘 이미 생성된 결과입니다'
        };
    }

    // 일일 생성 횟수 체크
    const dailyCount = getDailyCount(name, phone);
    if (dailyCount >= 3) {
        console.log('[ScoreEngine] Daily limit reached:', dailyCount);
        return {
            success: false,
            error: 'daily_limit',
            message: '오늘의 결과는 이미 생성되었어요. 더 정밀하게 보려면 12가지 질문으로 업그레이드하세요.',
            daily_count: dailyCount
        };
    }

    // ─────────────────────────────────────────
    // 1. base_score 계산 (결정론적)
    // ─────────────────────────────────────────
    const scoreFactors = [];
    let baseScore = 50; // 기본값

    // 1-1. 현재 상황 분석 (0-20점)
    const situationScore = analyzeSituation(content);
    baseScore += situationScore.score;
    scoreFactors.push({ factor: '현재 상황', score: situationScore.score, reason: situationScore.reason });

    // 1-2. 개선 의지 분석 (0-20점)
    const willScore = analyzeWill(content);
    baseScore += willScore.score;
    scoreFactors.push({ factor: '개선 의지', score: willScore.score, reason: willScore.reason });

    // 1-3. 환경/지원 분석 (0-15점)
    const supportScore = analyzeSupport(content, responses);
    baseScore += supportScore.score;
    scoreFactors.push({ factor: '환경/지원', score: supportScore.score, reason: supportScore.reason });

    // 1-4. 실행 가능성 분석 (0-15점)
    const actionScore = analyzeActionability(content, responses);
    baseScore += actionScore.score;
    scoreFactors.push({ factor: '실행 가능성', score: actionScore.score, reason: actionScore.reason });

    // 1-5. 구체성 보너스 (0-5점, 상한 고정)
    const specificityBonus = Math.min(5, Math.floor(content.length / 40));
    if (specificityBonus > 0) {
        baseScore += specificityBonus;
        scoreFactors.push({ factor: '구체성', score: specificityBonus, reason: `${content.length}자 입력` });
    }

    // 12질문 응답 반영 (Deep 모드)
    if (Object.keys(responses).length >= 5) {
        const deepBonus = analyzeDeepResponses(responses);
        baseScore += deepBonus.score;
        scoreFactors.push({ factor: '심층 분석', score: deepBonus.score, reason: deepBonus.reason });
    }

    // 50-100 범위로 보정
    baseScore = Math.max(50, Math.min(100, Math.round(baseScore)));

    // ─────────────────────────────────────────
    // 2. daily_delta 계산 (선택적, ±3)
    // ─────────────────────────────────────────
    let dailyDelta = 0;
    if (includeDailyDelta) {
        dailyDelta = calculateDailyDelta();
    }

    const finalScore = Math.max(50, Math.min(100, baseScore + dailyDelta));

    // ─────────────────────────────────────────
    // 3. Confidence 계산
    // ─────────────────────────────────────────
    const confidence = calculateConfidence(content, responses, mode);

    // ─────────────────────────────────────────
    // 4. 에너지 타입 결정 (스무딩 적용)
    // ─────────────────────────────────────────
    const rawEnergy = determineEnergyType(content, responses);
    const energyType = applyEnergySmoothing(name, phone, rawEnergy);

    // ─────────────────────────────────────────
    // 5. 결과 구성 및 캐싱
    // ─────────────────────────────────────────
    const result = {
        success: true,
        base_score: baseScore,
        daily_delta: dailyDelta,
        final_score: finalScore,
        confidence: confidence.level,
        confidence_detail: confidence.detail,
        energy_type: energyType.type,
        energy_name: ENERGY_TYPES[energyType.type].name,
        energy_meaning: ENERGY_TYPES[energyType.type].meaning,
        energy_changed: energyType.changed,
        energy_reason: energyType.reason,
        score_factors: scoreFactors,
        analysis_version: VERSION,
        mode: mode,
        input_length: content.length,
        response_count: Object.keys(responses).length,
        processing_time: Date.now() - startTime,
        created_at: new Date().toISOString()
    };

    // 캐시 저장
    saveToCache(signature, result, name, phone);

    console.log('[ScoreEngine] Calculated:', {
        base: baseScore,
        delta: dailyDelta,
        final: finalScore,
        confidence: confidence.level,
        energy: energyType.type,
        mode: mode,
        time: result.processing_time + 'ms'
    });

    return result;
}

// ═══════════════════════════════════════════════════════════
// 분석 함수들
// ═══════════════════════════════════════════════════════════

/**
 * 현재 상황 분석 (0-20점)
 */
function analyzeSituation(content) {
    let score = 10; // 중립 시작
    let reasons = [];

    const text = content.toLowerCase();

    // 긍정 키워드
    const strongPositive = KEYWORD_WEIGHTS.positive.strong.filter(k => text.includes(k));
    const mediumPositive = KEYWORD_WEIGHTS.positive.medium.filter(k => text.includes(k));

    if (strongPositive.length > 0) {
        score += 5;
        reasons.push(`긍정적 표현 (${strongPositive[0]})`);
    }
    if (mediumPositive.length > 0) {
        score += 3;
    }

    // 부정 키워드 (있어도 개선 의지면 감점 최소화)
    const severeNegative = KEYWORD_WEIGHTS.negative.severe.filter(k => text.includes(k));
    const heavyNegative = KEYWORD_WEIGHTS.negative.heavy.filter(k => text.includes(k));

    if (severeNegative.length > 0) {
        score -= 8;
        reasons.push('어려운 상황');
    } else if (heavyNegative.length >= 2) {
        score -= 4;
        reasons.push('힘든 상황');
    } else if (heavyNegative.length === 1) {
        score -= 2;
    }

    score = Math.max(0, Math.min(20, score));

    return {
        score,
        reason: reasons.length > 0 ? reasons.join(', ') : '보통 상황'
    };
}

/**
 * 개선 의지 분석 (0-20점)
 */
function analyzeWill(content) {
    let score = 10;
    let reasons = [];

    const text = content.toLowerCase();

    // 개선/변화 키워드
    const willKeywords = ['원해', '바라', '되고싶', '하고싶', '개선', '발전', '변화', '성장', '시작'];
    const effortKeywords = ['노력', '시도', '해보', '도전', '결심'];

    const willMatches = willKeywords.filter(k => text.includes(k));
    const effortMatches = effortKeywords.filter(k => text.includes(k));

    if (willMatches.length > 0) {
        score += 5;
        reasons.push('개선 의지');
    }
    if (effortMatches.length > 0) {
        score += 5;
        reasons.push('실천 의지');
    }

    score = Math.max(0, Math.min(20, score));

    return {
        score,
        reason: reasons.length > 0 ? reasons.join(', ') : '의지 확인 필요'
    };
}

/**
 * 환경/지원 분석 (0-15점)
 */
function analyzeSupport(content, responses) {
    let score = 8;
    let reasons = [];

    const text = content.toLowerCase();

    // 지원 키워드
    const supportKeywords = ['함께', '도움', '지원', '응원', '가족', '친구'];
    const matches = supportKeywords.filter(k => text.includes(k));

    if (matches.length > 0) {
        score += 4;
        reasons.push('지원 환경');
    }

    // 12질문 support 필드
    if (responses.support === '많음') {
        score += 3;
        reasons.push('든든한 지원');
    } else if (responses.support === '조금') {
        score += 1;
    }

    score = Math.max(0, Math.min(15, score));

    return {
        score,
        reason: reasons.length > 0 ? reasons.join(', ') : '환경 분석'
    };
}

/**
 * 실행 가능성 분석 (0-15점)
 */
function analyzeActionability(content, responses) {
    let score = 8;
    let reasons = [];

    const text = content.toLowerCase();

    // 긴급 키워드 (골든타임)
    const urgentMatches = KEYWORD_WEIGHTS.urgent.filter(k => text.includes(k));
    if (urgentMatches.length > 0) {
        score += 3;
        reasons.push('적절한 타이밍');
    }

    // 구체적 목표
    const goalKeywords = ['취업', '이직', '합격', '결혼', '창업', '졸업'];
    const goalMatches = goalKeywords.filter(k => text.includes(k));
    if (goalMatches.length > 0) {
        score += 4;
        reasons.push('명확한 목표');
    }

    // 12질문 readiness
    if (responses.readiness) {
        const readiness = parseInt(responses.readiness) || 50;
        if (readiness >= 70) {
            score += 3;
            reasons.push('높은 준비도');
        } else if (readiness >= 50) {
            score += 1;
        }
    }

    score = Math.max(0, Math.min(15, score));

    return {
        score,
        reason: reasons.length > 0 ? reasons.join(', ') : '실행 가능성'
    };
}

/**
 * 심층 응답 분석 (12질문용)
 */
function analyzeDeepResponses(responses) {
    let score = 0;
    let reasons = [];

    const responseCount = Object.keys(responses).length;

    // 응답 수 보너스
    if (responseCount >= 10) {
        score += 5;
        reasons.push('상세 응답');
    } else if (responseCount >= 5) {
        score += 3;
        reasons.push('충분한 응답');
    }

    // 감정 분석
    if (Array.isArray(responses.emotions)) {
        const positiveEmotions = ['hopeful', 'peaceful', 'excited'];
        const positiveCount = responses.emotions.filter(e => positiveEmotions.includes(e)).length;
        if (positiveCount > 0) {
            score += 2;
        }
    }

    // 강점 분석
    if (Array.isArray(responses.strengths) && responses.strengths.length >= 2) {
        score += 2;
        reasons.push('강점 인식');
    }

    return {
        score: Math.min(10, score),
        reason: reasons.length > 0 ? reasons.join(', ') : '심층 분석 완료'
    };
}

// ═══════════════════════════════════════════════════════════
// Confidence 계산
// ═══════════════════════════════════════════════════════════

function calculateConfidence(content, responses, mode) {
    const contentLength = content.length;
    const responseCount = Object.keys(responses).length;

    // Deep 모드 (12질문)
    if (mode === 'deep' || responseCount >= 10) {
        return {
            level: 'high',
            detail: '12질문 심층 분석 (정밀도 높음)'
        };
    }

    // Quick 모드 (4-5질문)
    if (responseCount >= 4 || contentLength >= 50) {
        return {
            level: 'medium',
            detail: '간편 분석 (정밀도 보통)'
        };
    }

    // 소원 한 줄
    return {
        level: 'low',
        detail: '빠른 분석 (정밀도 낮음, 업그레이드 권장)'
    };
}

// ═══════════════════════════════════════════════════════════
// 에너지 타입 결정 + 스무딩
// ═══════════════════════════════════════════════════════════

function determineEnergyType(content, responses) {
    // 텍스트 정규화: 유니코드 NFC 정규화 + 공백 정리
    const rawText = content + ' ' + JSON.stringify(responses);
    const text = rawText.normalize('NFC').toLowerCase();

    // 디버그 로그
    console.log('[EnergyType] Input text sample:', text.substring(0, 100));

    const scores = {};
    const matchedKeywords = {};

    for (const [type, data] of Object.entries(ENERGY_TYPES)) {
        const matches = data.keywords.filter(keyword => {
            // 유니코드 정규화된 키워드로 비교
            const normalizedKeyword = keyword.normalize('NFC');
            return text.includes(normalizedKeyword);
        });
        scores[type] = matches.length;
        if (matches.length > 0) {
            matchedKeywords[type] = matches;
        }
    }

    // 디버그 로그
    console.log('[EnergyType] Matched keywords:', matchedKeywords);
    console.log('[EnergyType] Scores:', scores);

    // 최고 점수 타입 찾기
    let maxType = 'citrine'; // 기본값
    let maxScore = 0;

    for (const [type, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            maxType = type;
        }
    }

    console.log('[EnergyType] Selected:', maxType, 'with score:', maxScore);

    return maxType;
}

function applyEnergySmoothing(name, phone, rawEnergy) {
    const key = `${name}_${phone}`;

    // 히스토리 가져오기
    let history = energyHistory.get(key) || [];

    // 새 에너지 추가
    history.push({
        type: rawEnergy,
        timestamp: Date.now()
    });

    // 최근 3개만 유지
    if (history.length > 3) {
        history = history.slice(-3);
    }
    energyHistory.set(key, history);

    // 최근 3회 다수결
    if (history.length >= 2) {
        const counts = {};
        for (const h of history) {
            counts[h.type] = (counts[h.type] || 0) + 1;
        }

        let majorityType = rawEnergy;
        let maxCount = 0;
        for (const [type, count] of Object.entries(counts)) {
            if (count > maxCount) {
                maxCount = count;
                majorityType = type;
            }
        }

        const changed = majorityType !== rawEnergy;
        return {
            type: majorityType,
            changed: changed,
            reason: changed
                ? `이전 분석과 일관성 유지 (${ENERGY_TYPES[majorityType].name})`
                : `현재 에너지 (${ENERGY_TYPES[rawEnergy].name})`
        };
    }

    return {
        type: rawEnergy,
        changed: false,
        reason: `추천 에너지 (${ENERGY_TYPES[rawEnergy].name})`
    };
}

// ═══════════════════════════════════════════════════════════
// 캐싱 시스템
// ═══════════════════════════════════════════════════════════

function generateSignature(name, content, phone) {
    // 정규화된 입력으로 해시 생성
    const normalized = `${name.toLowerCase()}_${content.toLowerCase().replace(/\s+/g, ' ').trim()}`;
    return crypto.createHash('md5').update(normalized).digest('hex');
}

function checkCache(signature) {
    const cached = scoreCache.get(signature);
    if (!cached) return null;

    // 24시간 TTL 확인
    const age = Date.now() - cached.timestamp;
    if (age > 24 * 60 * 60 * 1000) {
        scoreCache.delete(signature);
        return null;
    }

    return cached.result;
}

function saveToCache(signature, result, name, phone) {
    scoreCache.set(signature, {
        result,
        timestamp: Date.now(),
        name,
        phone
    });

    // 일일 카운트 증가
    incrementDailyCount(name, phone);
}

// 일일 생성 횟수 관리
const dailyCounts = new Map();

function getDailyCount(name, phone) {
    const today = new Date().toISOString().split('T')[0];
    const key = `${today}_${name}_${phone}`;
    return dailyCounts.get(key) || 0;
}

function incrementDailyCount(name, phone) {
    const today = new Date().toISOString().split('T')[0];
    const key = `${today}_${name}_${phone}`;
    const current = dailyCounts.get(key) || 0;
    dailyCounts.set(key, current + 1);
}

// ═══════════════════════════════════════════════════════════
// Daily Delta (오늘의 흐름)
// ═══════════════════════════════════════════════════════════

function calculateDailyDelta() {
    // 날짜 기반 시드로 결정론적 변동
    const today = new Date().toISOString().split('T')[0];
    const seed = parseInt(crypto.createHash('md5').update(today).digest('hex').substring(0, 8), 16);

    // -3 ~ +3 범위
    return ((seed % 7) - 3);
}

// ═══════════════════════════════════════════════════════════
// 모드 감지
// ═══════════════════════════════════════════════════════════

function detectMode(content, responses) {
    if (Object.keys(responses).length >= 10) return 'deep';
    if (Object.keys(responses).length >= 4) return 'quick';
    if (content.length >= 50) return 'problem';
    return 'wish';
}

// ═══════════════════════════════════════════════════════════
// 캐시 정리 (1시간마다)
// ═══════════════════════════════════════════════════════════

setInterval(() => {
    const now = Date.now();
    const TTL = 24 * 60 * 60 * 1000;

    for (const [key, value] of scoreCache.entries()) {
        if (now - value.timestamp > TTL) {
            scoreCache.delete(key);
        }
    }

    // 어제 일일 카운트 정리
    const today = new Date().toISOString().split('T')[0];
    for (const key of dailyCounts.keys()) {
        if (!key.startsWith(today)) {
            dailyCounts.delete(key);
        }
    }
}, 60 * 60 * 1000);

// ═══════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════

module.exports = {
    calculateUnifiedScore,
    ENERGY_TYPES,
    VERSION,

    // 테스트용
    _internals: {
        generateSignature,
        checkCache,
        getDailyCount,
        calculateDailyDelta,
        analyzeSituation,
        analyzeWill,
        determineEnergyType
    }
};
