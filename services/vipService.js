/**
 * VIP 태깅 서비스 (Human Touch)
 *
 * 신호등(RED/YELLOW/GREEN)과 별개 레이어로 동작
 * - RED면 VIP 금지 (긴급/차단 우선)
 * - GREEN/YELLOW에서만 VIP 가능
 * - 중복/스팸 의심시 VIP 금지
 *
 * VIP Score >= 70 이면 VIP 태깅 → 여의보주 라우팅
 *
 * @version 1.0 - 2025.12.30
 */

// ═══════════════════════════════════════════════════════════
// VIP 스코어링 키워드 사전
// ═══════════════════════════════════════════════════════════

// 간절함/감정 키워드 (최대 30점)
const URGENCY_KEYWORDS = [
    '정말', '간절', '마지막', '제발', '기도', '버티다', '버텨', '무너졌', '무너지',
    '힘들어', '힘들', '포기', '절박', '절실', '애타', '바라', '소망', '희망',
    '기적', '기다려', '기다리', '원해', '원합니다', '꿈', '염원'
];

// 회복/성장 서사 키워드 (최대 20점)
const RECOVERY_KEYWORDS = [
    '다시', '회복', '용기', '시작', '포기하지', '한 번만', '다시 시작',
    '일어나', '일어서', '극복', '이겨내', '새로운', '변화', '성장',
    '도전', '해내', '해낼', '버틸', '견딜', '견뎌'
];

// 진정성 신호 키워드 (최대 20점)
const SINCERITY_KEYWORDS = [
    '감사', '고맙', '반성', '내 탓', '내가 바뀌', '노력', '책임',
    '진심', '진정', '솔직', '깨달', '배우', '성숙', '자책',
    '미안', '죄송', '후회', '다짐', '약속', '맹세'
];

// 구체성 요소 (최대 30점)
const SPECIFICITY_PATTERNS = [
    /\d+년/, /\d+월/, /\d+일/,  // 시간 구체성
    /아버지|어머니|아빠|엄마|형|누나|오빠|언니|동생|아들|딸|할머니|할아버지|남편|아내|친구/,  // 관계
    /병원|학교|회사|집|고향/,  // 장소
    /암|수술|입원|치료|병|질환|장애/,  // 상황
    /취업|시험|합격|면접|창업|사업/,  // 목표
];

/**
 * VIP 스코어 계산
 * @param {string} wishContent - 소원 내용
 * @param {string} trafficLight - 신호등 결과 ('red' | 'yellow' | 'green')
 * @param {number} duplicateAttempts - 중복 시도 횟수
 * @returns {Object} { vip, vipScore, vipReasons, blocked, blockedReason }
 */
function evaluateVip(wishContent, trafficLight = 'green', duplicateAttempts = 0) {
    const result = {
        vip: false,
        vipScore: 0,
        vipReasons: [],
        blocked: false,
        blockedReason: null
    };

    // ═══════════════════════════════════════════════════════════
    // 게이트 체크 (VIP 적용 불가 조건)
    // ═══════════════════════════════════════════════════════════

    // 1. RED면 VIP 금지
    if (trafficLight === 'red') {
        result.blocked = true;
        result.blockedReason = 'RED_PRIORITY';
        return result;
    }

    // 2. 중복/스팸 의심 (5회 이상)
    if (duplicateAttempts >= 5) {
        result.blocked = true;
        result.blockedReason = 'SPAM_SUSPECTED';
        return result;
    }

    // 3. 내용 없음
    if (!wishContent || wishContent.trim().length === 0) {
        result.blocked = true;
        result.blockedReason = 'EMPTY_CONTENT';
        return result;
    }

    const content = wishContent.trim();
    const reasons = [];
    let score = 0;

    // ═══════════════════════════════════════════════════════════
    // 1. 서사 길이/구체성 점수 (최대 30점)
    // ═══════════════════════════════════════════════════════════

    // 글자수 점수 (50자 미만: 0, 50-100: 5, 100-200: 10, 200+: 15)
    const charCount = content.length;
    let lengthScore = 0;
    if (charCount >= 200) {
        lengthScore = 15;
        reasons.push(`상세한 서사 (${charCount}자)`);
    } else if (charCount >= 100) {
        lengthScore = 10;
    } else if (charCount >= 50) {
        lengthScore = 5;
    }

    // 구체성 패턴 점수 (각 3점, 최대 15점)
    let specificityScore = 0;
    const specificityMatches = [];
    for (const pattern of SPECIFICITY_PATTERNS) {
        const match = content.match(pattern);
        if (match) {
            specificityScore += 3;
            specificityMatches.push(match[0]);
            if (specificityScore >= 15) break;
        }
    }
    if (specificityMatches.length >= 2) {
        reasons.push(`구체적 상황 언급 (${specificityMatches.slice(0, 3).join(', ')})`);
    }

    score += Math.min(lengthScore + specificityScore, 30);

    // ═══════════════════════════════════════════════════════════
    // 2. 간절함/감정 키워드 (최대 30점)
    // ═══════════════════════════════════════════════════════════

    let urgencyScore = 0;
    const urgencyMatches = [];
    for (const keyword of URGENCY_KEYWORDS) {
        if (content.includes(keyword)) {
            urgencyScore += 6;
            urgencyMatches.push(keyword);
            if (urgencyScore >= 30) break;
        }
    }
    if (urgencyMatches.length >= 2) {
        reasons.push(`간절한 마음 표현 (${urgencyMatches.slice(0, 3).join(', ')})`);
    }
    score += Math.min(urgencyScore, 30);

    // ═══════════════════════════════════════════════════════════
    // 3. 회복/성장 서사 (최대 20점)
    // ═══════════════════════════════════════════════════════════

    let recoveryScore = 0;
    const recoveryMatches = [];
    for (const keyword of RECOVERY_KEYWORDS) {
        if (content.includes(keyword)) {
            recoveryScore += 5;
            recoveryMatches.push(keyword);
            if (recoveryScore >= 20) break;
        }
    }
    if (recoveryMatches.length >= 2) {
        reasons.push(`회복/성장 의지 (${recoveryMatches.slice(0, 3).join(', ')})`);
    }
    score += Math.min(recoveryScore, 20);

    // ═══════════════════════════════════════════════════════════
    // 4. 진정성 신호 (최대 20점)
    // ═══════════════════════════════════════════════════════════

    let sincerityScore = 0;
    const sincerityMatches = [];
    for (const keyword of SINCERITY_KEYWORDS) {
        if (content.includes(keyword)) {
            sincerityScore += 5;
            sincerityMatches.push(keyword);
            if (sincerityScore >= 20) break;
        }
    }
    if (sincerityMatches.length >= 2) {
        reasons.push(`진정성 있는 자기성찰 (${sincerityMatches.slice(0, 3).join(', ')})`);
    }
    score += Math.min(sincerityScore, 20);

    // ═══════════════════════════════════════════════════════════
    // 최종 판정
    // ═══════════════════════════════════════════════════════════

    result.vipScore = Math.min(score, 100);
    result.vipReasons = reasons.slice(0, 3);  // 상위 3개만
    result.vip = result.vipScore >= 70;

    return result;
}

/**
 * VIP 여부만 빠르게 확인
 */
function isVip(wishContent, trafficLight = 'green', duplicateAttempts = 0) {
    return evaluateVip(wishContent, trafficLight, duplicateAttempts).vip;
}

module.exports = {
    evaluateVip,
    isVip,
    // 테스트용 export
    URGENCY_KEYWORDS,
    RECOVERY_KEYWORDS,
    SINCERITY_KEYWORDS,
    SPECIFICITY_PATTERNS
};
