/**
 * Solapi 메시지 발송 서비스
 * - 카카오 알림톡
 * - SMS 발송 (fallback)
 *
 * @version 2.0 - 2025.12.30
 * @channel @dailymiracles (http://pf.kakao.com/_xfxhcWn)
 *
 * 승인된 템플릿:
 * - MIRACLE_RESULT: 기적 분석 결과 알림 (KA01TP251221072752085AP4LH3QgNHv)
 */

const { SolapiMessageService } = require('solapi');

// 환경변수에서 API 키 로드
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;
const SOLAPI_PFID = process.env.SOLAPI_PFID; // 카카오 채널 ID
const SENDER_PHONE = process.env.SENDER_PHONE || '18996117'; // 발신번호

// Solapi 클라이언트 초기화
let messageService = null;

function initSolapi() {
    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
        console.warn('[Solapi] API 키가 설정되지 않았습니다. 메시지 발송이 비활성화됩니다.');
        return null;
    }

    if (!messageService) {
        messageService = new SolapiMessageService(SOLAPI_API_KEY, SOLAPI_API_SECRET);
        console.log('[Solapi] 서비스 초기화 완료');
    }
    return messageService;
}

/**
 * 카카오 알림톡 발송
 * @param {string} to - 수신자 전화번호
 * @param {string} templateId - 알림톡 템플릿 ID
 * @param {Object} variables - 템플릿 변수
 * @returns {Promise<Object>} 발송 결과
 */
async function sendKakaoAlimtalk(to, templateId, variables = {}) {
    const service = initSolapi();
    if (!service) {
        console.log('[Solapi] 비활성화 상태 - 알림톡 발송 스킵');
        return { success: false, reason: 'API 키 미설정' };
    }

    try {
        const result = await service.send({
            to,
            from: SENDER_PHONE,
            kakaoOptions: {
                pfId: SOLAPI_PFID,
                templateId,
                variables
            }
        });

        console.log(`[Solapi] 알림톡 발송 성공: ${to}`);
        return { success: true, result };
    } catch (error) {
        console.error('[Solapi] 알림톡 발송 실패:', error.message);
        // SMS fallback
        return sendSMS(to, variables.message || '메시지 발송에 실패했습니다.');
    }
}

/**
 * SMS 발송 (알림톡 실패 시 fallback)
 * @param {string} to - 수신자 전화번호
 * @param {string} text - 메시지 내용
 * @returns {Promise<Object>} 발송 결과
 */
async function sendSMS(to, text) {
    const service = initSolapi();
    if (!service) {
        console.log('[Solapi] 비활성화 상태 - SMS 발송 스킵');
        console.log(`[Solapi] [시뮬레이션] SMS to ${to}: ${text.substring(0, 50)}...`);
        return { success: false, reason: 'API 키 미설정', simulated: true };
    }

    try {
        // 90바이트 초과 시 LMS로 자동 전환
        const result = await service.send({
            to,
            from: SENDER_PHONE,
            text,
            autoTypeDetect: true // SMS/LMS 자동 감지
        });

        console.log(`[Solapi] SMS 발송 성공: ${to}`);
        return { success: true, result };
    } catch (error) {
        console.error('[Solapi] SMS 발송 실패:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 소원 접수 ACK 발송 (통합)
 * @param {string} phone - 수신자 전화번호
 * @param {Object} wishData - 소원 데이터
 * @returns {Promise<Object>} 발송 결과
 */
async function sendWishAck(phone, wishData) {
    const { name, gem_meaning, miracleScore, wish } = wishData;

    // 보석 이모지
    const gemEmoji = {
        ruby: '❤️', sapphire: '💙', emerald: '💚',
        diamond: '💎', citrine: '💛'
    };
    const emoji = gemEmoji[wishData.gem] || '✨';

    // SMS용 짧은 메시지
    const smsText = `[하루하루의기적] ${name}님 소원접수완료!
기적지수 ${miracleScore}점
7일 응원메시지 발송예정
문의 1899-6117`;

    // 알림톡 템플릿 변수 (템플릿 승인 후 사용)
    const alimtalkVars = {
        name,
        miracleScore: String(miracleScore),
        gemMeaning: gem_meaning,
        wish: wish.length > 30 ? wish.substring(0, 30) + '...' : wish
    };

    // 알림톡 템플릿이 있으면 알림톡 우선, 없으면 SMS
    if (process.env.SOLAPI_TEMPLATE_WISH_ACK) {
        return sendKakaoAlimtalk(phone, process.env.SOLAPI_TEMPLATE_WISH_ACK, alimtalkVars);
    } else {
        return sendSMS(phone, smsText);
    }
}

/**
 * 기적 분석 결과 알림톡 발송
 * 템플릿: "#{이름}님께서 신청하신 '기적 분석' 결과를 안내드립니다.
 *         🌟 기적지수: #{점수}점
 *         📑 나만의 30일 로드맵이 준비되었어요.
 *         지금 바로 확인하세요!
 *         #{링크}"
 *
 * @param {string} phone - 수신자 전화번호
 * @param {string} name - 소원이 이름
 * @param {number} score - 기적지수 (50-100)
 * @param {string} resultLink - 결과 페이지 링크
 * @returns {Promise<Object>} 발송 결과
 */
async function sendMiracleResult(phone, name, score, resultLink) {
    const TEMPLATE_ID = process.env.SOLAPI_TEMPLATE_MIRACLE_RESULT;

    if (!TEMPLATE_ID) {
        console.warn('[Solapi] MIRACLE_RESULT 템플릿 ID 미설정');
        // SMS fallback
        const smsText = `[하루하루의기적] ${name}님의 기적지수: ${score}점! 30일 로드맵이 준비되었어요. ${resultLink}`;
        return sendSMS(phone, smsText);
    }

    // Solapi 알림톡 변수 (템플릿과 일치해야 함)
    const variables = {
        '#{이름}': name,
        '#{점수}': String(score),
        '#{링크}': resultLink
    };

    console.log(`[Solapi] 기적 분석 결과 발송: ${name}님 (${score}점)`);

    const service = initSolapi();
    if (!service) {
        console.log('[Solapi] 비활성화 상태 - 시뮬레이션 모드');
        console.log('[Solapi] [시뮬레이션] 알림톡 발송:');
        console.log(`  - 수신: ${phone}`);
        console.log(`  - 이름: ${name}`);
        console.log(`  - 점수: ${score}점`);
        console.log(`  - 링크: ${resultLink}`);
        return { success: false, reason: 'API 키 미설정', simulated: true };
    }

    try {
        const result = await service.send({
            to: phone,
            from: SENDER_PHONE,
            kakaoOptions: {
                pfId: SOLAPI_PFID,
                templateId: TEMPLATE_ID,
                variables
            }
        });

        console.log(`[Solapi] 기적 분석 결과 알림톡 발송 성공: ${phone}`);
        return { success: true, result };
    } catch (error) {
        console.error('[Solapi] 알림톡 발송 실패:', error.message);
        // SMS fallback
        const smsText = `[하루하루의기적] ${name}님의 기적지수: ${score}점! 30일 로드맵이 준비되었어요. ${resultLink}`;
        return sendSMS(phone, smsText);
    }
}

/**
 * RED 신호 긴급 알림 발송 (운영팀용)
 * @param {Object} wishData - 소원 데이터
 * @returns {Promise<Object>} 발송 결과
 */
async function sendRedAlert(wishData) {
    const CRO_PHONE = process.env.CRO_PHONE || '01012345678'; // 재미(CRO) 연락처

    const alertText = `🔴 [긴급] RED 신호 감지
이름: ${wishData.name}
연락처: ${wishData.phone}
사유: ${wishData.traffic_light.reason}
원문: "${wishData.wish.substring(0, 50)}..."
즉시 확인 필요!`;

    console.log('[Solapi] RED Alert 발송 대상:', CRO_PHONE);
    return sendSMS(CRO_PHONE, alertText);
}

/**
 * 발송 가능 상태 확인
 * @returns {boolean}
 */
function isEnabled() {
    return !!(SOLAPI_API_KEY && SOLAPI_API_SECRET);
}

/**
 * 잔액 조회
 * @returns {Promise<Object>}
 */
async function getBalance() {
    const service = initSolapi();
    if (!service) {
        return { success: false, reason: 'API 키 미설정' };
    }

    try {
        const balance = await service.getBalance();
        return { success: true, balance };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendKakaoAlimtalk,
    sendSMS,
    sendWishAck,
    sendMiracleResult,  // 기적 분석 결과 알림톡
    sendRedAlert,
    isEnabled,
    getBalance,
    initSolapi
};
