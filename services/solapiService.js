/**
 * Solapi 메시지 발송 서비스
 * - 카카오 알림톡 (ATA) 우선
 * - SMS/LMS fallback (알림톡 실패 시)
 *
 * @version 2.1 - 2025.12.31
 * @channel @dailymiracles (http://pf.kakao.com/_xfxhcWn)
 *
 * 발신번호 규칙:
 * - 알림톡(ATA): SENDER_PHONE (1899-6117 등 인증된 번호) - ATA 전용
 * - SMS/LMS: SOLAPI_SMS_FROM (등록된 010 번호 필수) ⚠️ 유일한 SMS 발신번호
 * - SENDER_PHONE은 SMS에서 절대 사용 금지 (deprecated for SMS)
 *
 * 승인된 템플릿:
 * - MIRACLE_RESULT: 기적 분석 결과 알림 (KA01TP251221072752085AP4LH3QgNHv)
 */

const { SolapiMessageService } = require('solapi');

// 메트릭스 서비스 연동
let metrics = null;
try {
    metrics = require('./metricsService');
} catch (e) {
    console.warn('[Solapi] metricsService 로드 실패 - 메트릭스 기록 비활성화');
}

// OutboundMessage 저장소 연동
let messageStore = null;
try {
    messageStore = require('./outboundMessageStore');
} catch (e) {
    console.warn('[Solapi] outboundMessageStore 로드 실패 - 발송 기록 비활성화');
}

// 환경변수에서 API 키 로드
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;
const SOLAPI_PFID = process.env.SOLAPI_PFID; // 카카오 채널 ID
const SENDER_PHONE = process.env.SENDER_PHONE || '18996117'; // ⚠️ ATA 전용 (SMS 사용 금지)
const SMS_FROM = process.env.SOLAPI_SMS_FROM; // ✅ SMS 유일한 발신번호 (등록된 010 번호 필수)

/**
 * 전화번호 정규화 (하이픈 제거, 숫자만)
 * 010-1234-5678 → 01012345678
 */
function normalizePhone(phone) {
    if (!phone) return phone;
    return phone.replace(/[^0-9]/g, '');
}

/**
 * 전화번호 마스킹 (개인정보 보호)
 * 01012345678 → 010****5678
 */
function maskPhone(phone) {
    if (!phone || phone.length < 8) return '****';
    return `${phone.substring(0, 3)}****${phone.slice(-4)}`;
}

/**
 * correlationId 생성 (발송 추적용)
 */
function generateCorrelationId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
}

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
 * 주의: 알림톡 실패 시 SMS fallback은 호출자가 직접 처리
 *
 * @param {string} to - 수신자 전화번호
 * @param {string} templateId - 알림톡 템플릿 ID
 * @param {Object} variables - 템플릿 변수
 * @returns {Promise<Object>} 발송 결과
 */
async function sendKakaoAlimtalk(to, templateId, variables = {}) {
    const correlationId = generateCorrelationId();
    const normalizedTo = normalizePhone(to);

    // ① 함수 진입 로그
    console.log(`[Notify] start type=ata to=${maskPhone(normalizedTo)} from=${maskPhone(SENDER_PHONE)} correlationId=${correlationId}`);

    // OutboundMessage 레코드 생성 (queued)
    if (messageStore) {
        messageStore.createRecord(correlationId, 'ata', normalizedTo, SENDER_PHONE);
    }

    const service = initSolapi();
    if (!service) {
        console.log(`[Notify] skip type=ata reason=API_KEY_MISSING correlationId=${correlationId}`);
        if (messageStore) messageStore.markFailed(correlationId, 'SKIP', 'API 키 미설정');
        return { success: false, reason: 'API 키 미설정', correlationId };
    }

    // ② Solapi 요청 직전 로그
    console.log(`[Notify] request type=ata to=${maskPhone(normalizedTo)} from=${maskPhone(SENDER_PHONE)} templateId=${templateId} hasVariables=${Object.keys(variables).length > 0} correlationId=${correlationId}`);

    try {
        const result = await service.send({
            to: normalizedTo,
            from: SENDER_PHONE, // 알림톡은 1899-6117 사용 가능
            kakaoOptions: {
                pfId: SOLAPI_PFID,
                templateId,
                variables
            }
        });

        // ③ Solapi 응답 로그 (성공)
        const groupId = result?.groupId || result?.messageId || 'unknown';
        console.log(`[Notify] response type=ata status=SUCCESS groupId=${groupId} correlationId=${correlationId}`);

        // OutboundMessage 성공 업데이트
        if (messageStore) messageStore.markSent(correlationId, groupId);

        return { success: true, result, channel: 'ATA', correlationId, groupId };
    } catch (error) {
        // ③ Solapi 응답 로그 (실패)
        const statusCode = error.statusCode || error.code || 'unknown';
        const errorMessage = error.message?.substring(0, 100) || 'unknown';
        console.error(`[Notify] response type=ata status=FAIL errorCode=${statusCode} errorMessage="${errorMessage}" correlationId=${correlationId}`);

        // OutboundMessage 실패 업데이트
        if (messageStore) messageStore.markFailed(correlationId, statusCode, errorMessage);

        // SMS fallback은 호출자가 처리 (sendWishAck, sendMiracleResult 등)
        return { success: false, reason: 'alimtalk_failed', error: error.message, statusCode, correlationId };
    }
}

/**
 * SMS 발송 (알림톡 실패 시 fallback)
 * 주의: SMS 발신번호는 Solapi에 등록된 번호만 사용 가능
 * 1899-6117은 문자 발신번호 등록 전까지 사용 금지
 *
 * @param {string} to - 수신자 전화번호
 * @param {string} text - 메시지 내용
 * @returns {Promise<Object>} 발송 결과
 */
async function sendSMS(to, text) {
    const correlationId = generateCorrelationId();
    const normalizedTo = normalizePhone(to);

    // ① 함수 진입 로그
    console.log(`[Notify] start type=sms to=${maskPhone(normalizedTo)} from=${maskPhone(SMS_FROM)} correlationId=${correlationId}`);

    // OutboundMessage 레코드 생성 (queued)
    if (messageStore) {
        messageStore.createRecord(correlationId, 'sms', normalizedTo, SMS_FROM);
    }

    const service = initSolapi();
    if (!service) {
        console.log(`[Notify] skip type=sms reason=API_KEY_MISSING correlationId=${correlationId}`);
        if (messageStore) messageStore.markFailed(correlationId, 'SKIP', 'API 키 미설정');
        return { success: false, reason: 'API 키 미설정', simulated: true, correlationId };
    }

    // SMS 발신번호 확인 (등록된 010 번호 필수)
    if (!SMS_FROM) {
        console.error(`[Notify] skip type=sms reason=SMS_FROM_MISSING correlationId=${correlationId}`);
        if (messageStore) messageStore.markFailed(correlationId, 'CONFIG', 'SMS_FROM 미설정');
        if (metrics) metrics.recordError('SMS_FROM_MISSING', 'SOLAPI_SMS_FROM 환경변수 미설정');
        return { success: false, reason: 'SMS 발신번호 미설정', correlationId };
    }

    // ② Solapi 요청 직전 로그
    console.log(`[Notify] request type=sms to=${maskPhone(normalizedTo)} from=${maskPhone(SMS_FROM)} contentLength=${text.length} templateId=N/A correlationId=${correlationId}`);

    try {
        // 90바이트 초과 시 LMS로 자동 전환
        const result = await service.send({
            to: normalizedTo,
            from: SMS_FROM, // 등록된 010 발신번호 사용 (⚠️ 절대 1899 사용 금지)
            text,
            autoTypeDetect: true // SMS/LMS 자동 감지
        });

        // ③ Solapi 응답 로그 (성공)
        const groupId = result?.groupId || result?.messageId || 'unknown';
        console.log(`[Notify] response type=sms status=SUCCESS groupId=${groupId} correlationId=${correlationId}`);

        // OutboundMessage 성공 업데이트
        if (messageStore) messageStore.markSent(correlationId, groupId);

        return { success: true, result, channel: 'SMS', from: SMS_FROM, correlationId, groupId };
    } catch (error) {
        // ③ Solapi 응답 로그 (실패)
        const statusCode = error.statusCode || error.code || 'unknown';
        const errorMessage = error.message?.substring(0, 100) || 'unknown';
        console.error(`[Notify] response type=sms status=FAIL errorCode=${statusCode} errorMessage="${errorMessage}" correlationId=${correlationId}`);

        // OutboundMessage 실패 업데이트
        if (messageStore) messageStore.markFailed(correlationId, statusCode, errorMessage);

        // statusCode 1062: 발신번호 미등록
        if (statusCode === 1062 || statusCode === '1062' || error.message?.includes('1062') || error.message?.includes('발신번호')) {
            console.error(`[Notify] alert type=sms issue=SENDER_UNREGISTERED from=${maskPhone(SMS_FROM)} correlationId=${correlationId}`);
            if (metrics) {
                metrics.recordError('SMS_SENDER_UNREGISTERED', `발신번호 ${maskPhone(SMS_FROM)} 미등록 (statusCode: ${statusCode})`);
            }
            return { success: false, reason: 'sms_sender_unregistered', error: error.message, from: SMS_FROM, correlationId };
        }

        if (metrics) metrics.recordError('SMS_FAIL', error.message);
        return { success: false, error: error.message, from: SMS_FROM, correlationId };
    }
}

/**
 * 소원 접수 ACK 발송 (통합)
 * 우선순위: 1. 알림톡(ATA) → 2. SMS fallback
 *
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

    // SMS용 짧은 메시지 (fallback용)
    const smsText = `[하루하루의기적] ${name}님 소원접수완료!
기적지수 ${miracleScore}점
7일 응원메시지 발송예정
문의 1899-6117`;

    // 알림톡 템플릿 변수 (템플릿 승인 후 사용)
    const alimtalkVars = {
        name,
        miracleScore: String(miracleScore),
        gemMeaning: gem_meaning,
        wish: wish.length > 30 ? wish.substring(0, 30) + '...' : wish,
        message: smsText // SMS fallback용
    };

    const TEMPLATE_ID = process.env.SOLAPI_TEMPLATE_WISH_ACK;

    // 발송 시작 로그
    console.log(`[Solapi] ACK 발송 시작: { want_message: true, name: "${name}", to: "${phone}" }`);

    // 1차: 알림톡 시도 (템플릿 있을 때)
    if (TEMPLATE_ID) {
        console.log(`[Solapi] 1차 시도: { channel: "ATA", templateId: "${TEMPLATE_ID}" }`);
        const ataResult = await sendKakaoAlimtalk(phone, TEMPLATE_ID, alimtalkVars);

        if (ataResult.success) {
            console.log(`[Solapi] ✅ ACK 완료: { channel: "ATA", to: "${phone}" }`);
            if (metrics) metrics.recordAlimtalk(true, false);
            return { ...ataResult, channel: 'ATA' };
        }

        // 알림톡 실패 → SMS fallback
        console.log(`[Solapi] ATA 실패, 2차 시도: { channel: "SMS", fallback: true }`);
        if (metrics) metrics.recordAlimtalk(false, true);
        const smsResult = await sendSMS(phone, smsText);
        return { ...smsResult, fallback: true };
    }

    // 템플릿 미설정 → 바로 SMS
    console.log(`[Solapi] ATA 템플릿 미설정, SMS 직접 발송: { channel: "SMS" }`);
    return sendSMS(phone, smsText);
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
        // 메트릭스 기록
        if (metrics) metrics.recordAlimtalk(true, false);
        return { success: true, result };
    } catch (error) {
        console.error('[Solapi] 알림톡 발송 실패:', error.message);
        // 메트릭스 기록 (실패)
        if (metrics) metrics.recordError('ALIMTALK_FAIL', error.message);
        // SMS fallback
        const smsText = `[하루하루의기적] ${name}님의 기적지수: ${score}점! 30일 로드맵이 준비되었어요. ${resultLink}`;
        if (metrics) metrics.recordAlimtalk(false, true); // fallback SMS
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
