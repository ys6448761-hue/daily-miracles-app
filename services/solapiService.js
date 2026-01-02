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

// 템플릿 환경변수 (Render에 동일 키로 설정 필요)
const TEMPLATE_MIRACLE_RESULT = process.env.SOLAPI_TEMPLATE_MIRACLE_RESULT;
const TEMPLATE_WISH_ACK = process.env.SOLAPI_TEMPLATE_WISH_ACK;

// 🔍 서비스 로드 시 환경변수 검증 로깅
console.log('[Solapi] 환경변수 검증:', {
    SOLAPI_API_KEY: SOLAPI_API_KEY ? '✅ 설정됨' : '❌ 미설정',
    SOLAPI_API_SECRET: SOLAPI_API_SECRET ? '✅ 설정됨' : '❌ 미설정',
    SOLAPI_PFID: SOLAPI_PFID || '❌ 미설정 (알림톡 불가)',
    SOLAPI_SMS_FROM: SMS_FROM ? `✅ ${SMS_FROM.substring(0, 3)}****` : '❌ 미설정 (SMS 불가)',
    SENDER_PHONE: SENDER_PHONE ? `${SENDER_PHONE.substring(0, 4)}**** (ATA 전용)` : '❌ 미설정',
    // 템플릿 ID (Render 환경변수에 동일 키로 설정)
    SOLAPI_TEMPLATE_MIRACLE_RESULT: TEMPLATE_MIRACLE_RESULT || '❌ 미설정 → Render에 추가 필요!',
    SOLAPI_TEMPLATE_WISH_ACK: TEMPLATE_WISH_ACK || 'ℹ️ 미설정 (선택)'
});

// 필수 환경변수 누락 경고
const missingEnvs = [];
if (!SOLAPI_API_KEY) missingEnvs.push('SOLAPI_API_KEY');
if (!SOLAPI_API_SECRET) missingEnvs.push('SOLAPI_API_SECRET');
if (!SOLAPI_PFID) missingEnvs.push('SOLAPI_PFID');
if (!SMS_FROM) missingEnvs.push('SOLAPI_SMS_FROM');
if (!TEMPLATE_MIRACLE_RESULT) missingEnvs.push('SOLAPI_TEMPLATE_MIRACLE_RESULT');

if (missingEnvs.length > 0) {
    console.warn(`[Solapi] ⚠️ 필수 환경변수 누락: ${missingEnvs.join(', ')}`);
    console.warn('[Solapi] 📋 Render Dashboard → Environment → 아래 값 추가:');
    if (!SOLAPI_PFID) console.warn('   SOLAPI_PFID=KA01PF251221071807323H0v42nQPJso');
    if (!TEMPLATE_MIRACLE_RESULT) console.warn('   SOLAPI_TEMPLATE_MIRACLE_RESULT=KA01TP251221072752085AP4LH3QgNHv');
}

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
        // ③ Solapi 응답 로그 (실패) - 상세 에러 정보
        const statusCode = error.statusCode || error.response?.status || error.code || 'unknown';
        const errorMessage = error.message?.substring(0, 200) || 'unknown';
        const responseData = error.response?.data || error.data || null;

        console.error(`[Notify] response type=ata status=FAIL errorCode=${statusCode} errorMessage="${errorMessage}" correlationId=${correlationId}`);
        console.error(`[Notify] error details:`, {
            correlationId,
            statusCode,
            errorMessage,
            responseData: responseData ? JSON.stringify(responseData).substring(0, 500) : 'N/A',
            errorName: error.name,
            errorStack: error.stack?.split('\n')[0]
        });

        // OutboundMessage 실패 업데이트
        if (messageStore) messageStore.markFailed(correlationId, statusCode, errorMessage);

        // SMS fallback은 호출자가 처리 (sendWishAck, sendMiracleResult 등)
        return { success: false, reason: 'alimtalk_failed', error: error.message, statusCode, responseData, correlationId };
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

    // ⚠️ from 값 검증: SMS_FROM만 사용, SENDER_PHONE 혼용 방지
    const smsFromValue = SMS_FROM; // 명시적으로 SMS_FROM만 사용
    const isFromValid = smsFromValue && smsFromValue !== SENDER_PHONE && !smsFromValue.includes('1899');

    // ① 함수 진입 로그 (from 검증 포함)
    console.log(`[Notify] start type=sms correlationId=${correlationId}`, {
        to: maskPhone(normalizedTo),
        from: smsFromValue ? maskPhone(smsFromValue) : 'NULL',
        fromRaw: smsFromValue, // 디버깅용 원본값
        isFromValid,
        senderPhoneCheck: smsFromValue === SENDER_PHONE ? '⚠️ SENDER_PHONE과 동일!' : '✅ 분리됨',
        has1899: smsFromValue?.includes('1899') ? '⚠️ 1899 포함!' : '✅ 없음'
    });

    // OutboundMessage 레코드 생성 (queued)
    if (messageStore) {
        messageStore.createRecord(correlationId, 'sms', normalizedTo, smsFromValue);
    }

    const service = initSolapi();
    if (!service) {
        console.log(`[Notify] skip type=sms reason=API_KEY_MISSING correlationId=${correlationId}`);
        if (messageStore) messageStore.markFailed(correlationId, 'SKIP', 'API 키 미설정');
        return { success: false, reason: 'API 키 미설정', simulated: true, correlationId };
    }

    // SMS 발신번호 확인 (등록된 010 번호 필수)
    if (!smsFromValue) {
        console.error(`[Notify] skip type=sms reason=SMS_FROM_MISSING correlationId=${correlationId}`);
        if (messageStore) messageStore.markFailed(correlationId, 'CONFIG', 'SMS_FROM 미설정');
        if (metrics) metrics.recordError('SMS_FROM_MISSING', 'SOLAPI_SMS_FROM 환경변수 미설정');
        return { success: false, reason: 'SMS 발신번호 미설정', correlationId };
    }

    // 페이로드 구성
    const payload = {
        to: normalizedTo,
        from: smsFromValue, // 등록된 010 발신번호 사용 (⚠️ 절대 1899 사용 금지)
        text,
        autoTypeDetect: true // SMS/LMS 자동 감지
    };

    // ② Solapi 요청 직전 로그 (페이로드 상세)
    console.log(`[Notify] request type=sms correlationId=${correlationId}`, {
        payload: {
            to: maskPhone(payload.to),
            from: payload.from, // 마스킹 없이 원본 (디버깅용)
            textLength: payload.text.length,
            autoTypeDetect: payload.autoTypeDetect
        },
        envCheck: {
            SOLAPI_SMS_FROM: smsFromValue,
            SENDER_PHONE: SENDER_PHONE,
            areEqual: smsFromValue === SENDER_PHONE
        }
    });

    try {
        // 90바이트 초과 시 LMS로 자동 전환
        const result = await service.send(payload);

        // ③ Solapi 응답 로그 (성공)
        const groupId = result?.groupId || result?.messageId || 'unknown';
        console.log(`[Notify] response type=sms status=SUCCESS groupId=${groupId} correlationId=${correlationId}`, {
            result: JSON.stringify(result).substring(0, 300)
        });

        // OutboundMessage 성공 업데이트
        if (messageStore) messageStore.markSent(correlationId, groupId);

        return { success: true, result, channel: 'SMS', from: smsFromValue, correlationId, groupId };
    } catch (error) {
        // ③ Solapi 응답 로그 (실패) - 원본 에러 전체 출력
        console.error(`[Notify] response type=sms status=FAIL correlationId=${correlationId}`);
        console.error(`[Notify] RAW ERROR:`, {
            correlationId,
            // 네트워크 에러 코드
            'error.code': error.code || 'N/A',
            // HTTP 상태
            'error.response?.status': error.response?.status || 'N/A',
            // 응답 데이터
            'error.response?.data': error.response?.data || 'N/A',
            // 에러 메시지
            'error.message': error.message || 'N/A',
            // 스택 트레이스
            'error.stack': error.stack || 'N/A',
            // 추가 속성들
            'error.statusCode': error.statusCode || 'N/A',
            'error.data': error.data || 'N/A',
            'error.name': error.name || 'N/A',
            // 전체 에러 객체 (JSON 직렬화 시도)
            'errorFull': (() => {
                try {
                    return JSON.stringify(error, Object.getOwnPropertyNames(error));
                } catch (e) {
                    return 'JSON 직렬화 실패';
                }
            })()
        });

        const statusCode = error.statusCode || error.response?.status || error.code || 'unknown';
        const errorMessage = error.message?.substring(0, 200) || 'unknown';
        const responseData = error.response?.data || error.data || null;

        // OutboundMessage 실패 업데이트
        if (messageStore) messageStore.markFailed(correlationId, statusCode, errorMessage);

        // statusCode 1062: 발신번호 미등록
        if (statusCode === 1062 || statusCode === '1062' || error.message?.includes('1062') || error.message?.includes('발신번호')) {
            console.error(`[Notify] alert type=sms issue=SENDER_UNREGISTERED from=${smsFromValue} correlationId=${correlationId}`);
            if (metrics) {
                metrics.recordError('SMS_SENDER_UNREGISTERED', `발신번호 ${maskPhone(smsFromValue)} 미등록 (statusCode: ${statusCode})`);
            }
            return { success: false, reason: 'sms_sender_unregistered', error: error.message, statusCode, responseData, from: smsFromValue, correlationId };
        }

        if (metrics) metrics.recordError('SMS_FAIL', error.message);
        return { success: false, error: error.message, statusCode, responseData, from: smsFromValue, correlationId };
    }
}

// ACK 발송 모드 설정 (환경변수로 제어)
// - 'fail-fast': 템플릿 미설정 시 발송 스킵 (운영 안정)
// - 'sms-fallback': 템플릿 미설정 시 SMS로 발송 (기존 동작)
// - 'skip-log': 발송 스킵하고 로그만 남김 (테스트용)
const ACK_MODE = process.env.SOLAPI_ACK_MODE || 'fail-fast';

/**
 * 소원 접수 ACK 발송 (통합)
 * 우선순위: 1. 알림톡(ATA) → 2. SMS fallback (모드에 따라)
 *
 * @param {string} phone - 수신자 전화번호
 * @param {Object} wishData - 소원 데이터
 * @returns {Promise<Object>} 발송 결과
 */
async function sendWishAck(phone, wishData) {
    const { name, gem_meaning, miracleScore, wish } = wishData;
    const correlationId = generateCorrelationId();

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
    console.log(`[Solapi] ACK 발송 시작:`, {
        correlationId,
        name,
        to: maskPhone(phone),
        templateId: TEMPLATE_ID || 'NULL',
        ackMode: ACK_MODE,
        hasTemplate: !!TEMPLATE_ID
    });

    // 1차: 알림톡 시도 (템플릿 있을 때)
    if (TEMPLATE_ID) {
        console.log(`[Solapi] 1차 시도: { channel: "ATA", templateId: "${TEMPLATE_ID}", correlationId: "${correlationId}" }`);
        const ataResult = await sendKakaoAlimtalk(phone, TEMPLATE_ID, alimtalkVars);

        if (ataResult.success) {
            console.log(`[Solapi] ✅ ACK 완료: { channel: "ATA", correlationId: "${correlationId}" }`);
            if (metrics) metrics.recordAlimtalk(true, false);
            return { ...ataResult, channel: 'ATA', correlationId };
        }

        // 알림톡 실패 → SMS fallback
        console.log(`[Solapi] ATA 실패, 2차 시도: { channel: "SMS", fallback: true, correlationId: "${correlationId}" }`);
        if (metrics) metrics.recordAlimtalk(false, true);
        const smsResult = await sendSMS(phone, smsText);
        return { ...smsResult, fallback: true, correlationId };
    }

    // ⚠️ 템플릿 미설정 시 모드별 처리
    console.warn(`[Solapi] ⚠️ WISH_ACK 템플릿 미설정! mode=${ACK_MODE} correlationId=${correlationId}`);

    switch (ACK_MODE) {
        case 'fail-fast':
            // 운영 안정: 발송 안함, 에러 반환
            console.error(`[Solapi] ❌ ACK FAIL-FAST: 템플릿 미설정으로 발송 중단`, {
                correlationId,
                name,
                to: maskPhone(phone),
                action: 'SKIPPED',
                reason: 'SOLAPI_TEMPLATE_WISH_ACK 환경변수 필요'
            });
            if (metrics) metrics.recordError('ACK_TEMPLATE_MISSING', 'WISH_ACK 템플릿 미설정 (fail-fast)');
            return {
                success: false,
                reason: 'ACK 템플릿 미설정 (fail-fast 모드)',
                skipped: true,
                correlationId,
                hint: 'Render에 SOLAPI_TEMPLATE_WISH_ACK 환경변수 추가 필요'
            };

        case 'skip-log':
            // 테스트용: 발송 안하고 로그만
            console.log(`[Solapi] 📝 ACK SKIP-LOG: 발송 스킵 (테스트 모드)`, {
                correlationId,
                name,
                to: maskPhone(phone),
                wouldSend: smsText.substring(0, 50) + '...'
            });
            return {
                success: true,
                simulated: true,
                skipped: true,
                correlationId,
                message: '테스트 모드 - 실제 발송 안함'
            };

        case 'sms-fallback':
        default:
            // 기존 동작: SMS로 발송
            console.log(`[Solapi] ATA 템플릿 미설정, SMS 직접 발송: { channel: "SMS", correlationId: "${correlationId}" }`);
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
    const correlationId = generateCorrelationId();
    const normalizedPhone = normalizePhone(phone);
    const TEMPLATE_ID = process.env.SOLAPI_TEMPLATE_MIRACLE_RESULT;

    // 템플릿 설정 검증 로그
    console.log(`[Solapi] sendMiracleResult 시작:`, {
        correlationId,
        to: maskPhone(normalizedPhone),
        name,
        score,
        templateEnvKey: 'SOLAPI_TEMPLATE_MIRACLE_RESULT',
        templateId: TEMPLATE_ID || '❌ 미설정',
        pfid: SOLAPI_PFID || '❌ 미설정'
    });

    if (!TEMPLATE_ID) {
        console.warn(`[Solapi] MIRACLE_RESULT 템플릿 ID 미설정 - SMS fallback 사용 correlationId=${correlationId}`);
        // SMS fallback
        const smsText = `[하루하루의기적] ${name}님의 기적지수: ${score}점! 30일 로드맵이 준비되었어요. ${resultLink}`;
        return sendSMS(normalizedPhone, smsText);
    }

    // Solapi 알림톡 변수 (템플릿과 일치해야 함)
    const variables = {
        '#{이름}': name,
        '#{점수}': String(score),
        '#{링크}': resultLink
    };

    console.log(`[Solapi] 기적 분석 결과 발송: ${name}님 (${score}점) correlationId=${correlationId}`);

    const service = initSolapi();
    if (!service) {
        console.log(`[Solapi] 비활성화 상태 - 시뮬레이션 모드 correlationId=${correlationId}`);
        return { success: false, reason: 'API 키 미설정', simulated: true, correlationId };
    }

    try {
        const result = await service.send({
            to: normalizedPhone,
            from: SENDER_PHONE,
            kakaoOptions: {
                pfId: SOLAPI_PFID,
                templateId: TEMPLATE_ID,
                variables
            }
        });

        console.log(`[Solapi] 기적 분석 결과 알림톡 발송 성공: ${maskPhone(normalizedPhone)} correlationId=${correlationId}`);
        // 메트릭스 기록
        if (metrics) metrics.recordAlimtalk(true, false);
        return { success: true, result, correlationId };
    } catch (error) {
        // 상세 에러 정보 로깅
        const statusCode = error.statusCode || error.response?.status || error.code || 'unknown';
        const errorMessage = error.message?.substring(0, 200) || 'unknown';
        const responseData = error.response?.data || error.data || null;

        console.error(`[Solapi] 알림톡 발송 실패:`, {
            correlationId,
            statusCode,
            errorMessage,
            responseData: responseData ? JSON.stringify(responseData).substring(0, 500) : 'N/A',
            errorName: error.name,
            errorStack: error.stack?.split('\n')[0]
        });

        // 메트릭스 기록 (실패)
        if (metrics) metrics.recordError('ALIMTALK_FAIL', `${statusCode}: ${errorMessage}`);

        // SMS fallback
        console.log(`[Solapi] ATA 실패 → SMS fallback 시도 correlationId=${correlationId}`);
        const smsText = `[하루하루의기적] ${name}님의 기적지수: ${score}점! 30일 로드맵이 준비되었어요. ${resultLink}`;
        if (metrics) metrics.recordAlimtalk(false, true); // fallback SMS
        return sendSMS(normalizedPhone, smsText);
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

/**
 * Solapi 계정 검증 (서버 시작 시 1회 호출 권장)
 * Render에서 사용 중인 키가 어느 계정인지 확인
 * @returns {Promise<Object>} 계정 정보 또는 에러
 */
async function verifyAccount() {
    console.log('[Solapi] 계정 검증 시작...');
    console.log('[Solapi] API_KEY 앞 8자:', SOLAPI_API_KEY?.substring(0, 8) || 'NULL');

    const service = initSolapi();
    if (!service) {
        console.error('[Solapi] 계정 검증 실패: API 키 미설정');
        return { success: false, reason: 'API 키 미설정' };
    }

    try {
        // 잔액 조회로 계정 유효성 확인
        const balance = await service.getBalance();

        console.log('[Solapi] ✅ 계정 검증 성공:', {
            apiKeyPrefix: SOLAPI_API_KEY?.substring(0, 8) + '...',
            balance: balance,
            pfid: SOLAPI_PFID || 'N/A',
            smsFrom: SMS_FROM || 'N/A',
            senderPhone: SENDER_PHONE || 'N/A',
            timestamp: new Date().toISOString()
        });

        return {
            success: true,
            account: {
                apiKeyPrefix: SOLAPI_API_KEY?.substring(0, 8) + '...',
                balance,
                pfid: SOLAPI_PFID,
                smsFrom: SMS_FROM,
                senderPhone: SENDER_PHONE
            }
        };
    } catch (error) {
        console.error('[Solapi] ❌ 계정 검증 실패:', {
            apiKeyPrefix: SOLAPI_API_KEY?.substring(0, 8) + '...',
            errorCode: error.code || error.statusCode || 'unknown',
            errorMessage: error.message,
            errorResponse: error.response?.data || 'N/A',
            errorStack: error.stack?.split('\n').slice(0, 3).join(' | ')
        });

        return {
            success: false,
            error: error.message,
            errorCode: error.code || error.statusCode,
            apiKeyPrefix: SOLAPI_API_KEY?.substring(0, 8) + '...'
        };
    }
}

// 서비스 초기화 시 계정 검증 (비동기 실행)
if (SOLAPI_API_KEY && SOLAPI_API_SECRET) {
    setTimeout(() => {
        verifyAccount().then(result => {
            if (!result.success) {
                console.error('[Solapi] ⚠️ 서버 시작 시 계정 검증 실패 - API 키 확인 필요');
            }
        });
    }, 1000); // 서버 시작 1초 후 검증
}

module.exports = {
    sendKakaoAlimtalk,
    sendSMS,
    sendWishAck,
    sendMiracleResult,  // 기적 분석 결과 알림톡
    sendRedAlert,
    isEnabled,
    getBalance,
    verifyAccount,      // 계정 검증 API
    initSolapi
};
