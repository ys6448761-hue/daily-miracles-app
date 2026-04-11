/**
 * messageProvider.js
 *
 * 메시지 발송 추상화 계층
 * - SENS (네이버 클라우드) 알림톡/SMS
 *
 * @version 1.1 - 2026.01.16 (Solapi 제거)
 */

const crypto = require('crypto');

// ============ Feature Flags ============
const USE_SENS = process.env.MSG_USE_SENS !== 'false';      // 기본 ON

// ============ SENS 설정 ============
const SENS_ACCESS_KEY = process.env.SENS_ACCESS_KEY;
const SENS_SECRET_KEY = process.env.SENS_SECRET_KEY;
const SENS_SERVICE_ID = process.env.SENS_SERVICE_ID;        // 알림톡 서비스 ID
const SENS_SMS_SERVICE_ID = process.env.SENS_SMS_SERVICE_ID; // SMS 서비스 ID (failover)
const SENS_CHANNEL_ID = process.env.SENS_CHANNEL_ID || '_xfxhcWn'; // 카카오 채널 ID
const SENS_TEMPLATE_CODE = process.env.SENS_TEMPLATE_CODE;   // 알림톡 템플릿 코드 (기적 결과)
const SENS_QUOTE_TEMPLATE_CODE = process.env.SENS_QUOTE_TEMPLATE_CODE; // 견적 접수 알림톡 템플릿
const SENS_ACK_TEMPLATE_CODE = process.env.SENS_ACK_TEMPLATE_CODE || 'betawelcome'; // 소원 접수 ACK 알림톡 템플릿

// 앱 도메인 (링크 생성용)
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://app.dailymiracles.kr';

// 발신번호
const SENDER_PHONE = process.env.SENDER_PHONE || '18996117';

// ============ 로깅 ============
console.log('[MessageProvider] 설정:', {
    USE_SENS: USE_SENS ? '✅ ON' : '❌ OFF',
    SENS_ACCESS_KEY: SENS_ACCESS_KEY ? '✅ 설정됨' : '❌ 미설정',
    SENS_SERVICE_ID: SENS_SERVICE_ID || '❌ 미설정',
    SENS_CHANNEL_ID: SENS_CHANNEL_ID,
    SENS_TEMPLATE_CODE: SENS_TEMPLATE_CODE || '❌ 미설정',
    SENS_ACK_TEMPLATE_CODE: SENS_ACK_TEMPLATE_CODE || '❌ 미설정',
    SENS_QUOTE_TEMPLATE_CODE: SENS_QUOTE_TEMPLATE_CODE || '❌ 미설정',
    APP_BASE_URL
});

// ============ 발송 상태 ============
const MESSAGE_STATUS = {
    PENDING: 'pending',
    SENT: 'sent',
    FAILED: 'failed',
    SKIPPED: 'skipped'
};

// ============ 메시지 로그 저장소 ============
let db = null;
try {
    db = require('../database/db');
} catch (e) {
    console.warn('[MessageProvider] DB 모듈 로드 실패 - 로그 비활성화');
}

/**
 * 발송 로그 저장
 */
async function logMessageSend(messageId, type, recipient, status, details = {}) {
    const logEntry = {
        message_id: messageId,
        type,  // 'alimtalk', 'sms'
        recipient: maskPhone(recipient),
        status,
        details,
        created_at: new Date().toISOString()
    };

    console.log(`[MessageProvider] 발송로그:`, logEntry);

    // DB에 저장 (marketing_events 테이블 활용)
    if (db) {
        try {
            await db.query(`
                INSERT INTO marketing_events (event_type, event_date, payload, source)
                VALUES ($1, CURRENT_DATE, $2, $3)
            `, [
                'message_send',
                JSON.stringify({
                    ...logEntry,
                    env: process.env.NODE_ENV === 'production' ? 'prod' : 'test'
                }),
                'messageProvider'
            ]);
        } catch (err) {
            console.error('[MessageProvider] 로그 저장 실패:', err.message);
        }
    }

    return logEntry;
}

/**
 * 전화번호 정규화
 */
function normalizePhone(phone) {
    if (!phone) return phone;
    return phone.replace(/[^0-9]/g, '');
}

/**
 * 전화번호 마스킹
 */
function maskPhone(phone) {
    if (!phone || phone.length < 8) return '****';
    return `${phone.substring(0, 3)}****${phone.slice(-4)}`;
}

/**
 * 고유 메시지 ID 생성
 */
function generateMessageId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `msg-${timestamp}-${random}`;
}

/**
 * SENS API 시그니처 생성
 */
function makeSensSignature(method, url, timestamp) {
    const space = ' ';
    const newLine = '\n';
    const hmac = crypto.createHmac('sha256', SENS_SECRET_KEY);

    hmac.update(method);
    hmac.update(space);
    hmac.update(url);
    hmac.update(newLine);
    hmac.update(timestamp);
    hmac.update(newLine);
    hmac.update(SENS_ACCESS_KEY);

    return hmac.digest('base64');
}

/**
 * SENS 알림톡 발송
 */
async function sendSensAlimtalk(phone, templateVars = {}) {
    // Outbound Gate — 실발송 차단
    if (process.env.OUTBOUND_ENABLED !== 'true') {
        console.log('[SAFE MODE] outbound blocked — sendSensAlimtalk skipped');
        return { success: false, skipped: true, reason: 'OUTBOUND_ENABLED=false' };
    }
    const messageId = generateMessageId();
    const normalizedPhone = normalizePhone(phone);

    // templateCode/content/buttons 오버라이드 지원
    const effectiveTemplateCode = templateVars.templateCode || SENS_TEMPLATE_CODE;

    console.log(`[SENS] 알림톡 발송 시작:`, {
        messageId,
        to: maskPhone(normalizedPhone),
        templateCode: effectiveTemplateCode,
        channelId: SENS_CHANNEL_ID
    });

    // 필수 설정 검증
    if (!SENS_ACCESS_KEY || !SENS_SECRET_KEY || !SENS_SERVICE_ID) {
        console.warn(`[SENS] API 키 미설정 - 발송 스킵`);
        await logMessageSend(messageId, 'alimtalk', normalizedPhone, MESSAGE_STATUS.SKIPPED, {
            reason: 'SENS API 키 미설정'
        });
        return { success: false, reason: 'SENS API 키 미설정', messageId, status: MESSAGE_STATUS.SKIPPED };
    }

    if (!effectiveTemplateCode) {
        console.warn(`[SENS] 템플릿 코드 미설정 - 발송 스킵`);
        await logMessageSend(messageId, 'alimtalk', normalizedPhone, MESSAGE_STATUS.SKIPPED, {
            reason: '템플릿 코드 미설정'
        });
        return { success: false, reason: '템플릿 코드 미설정', messageId, status: MESSAGE_STATUS.SKIPPED };
    }

    // pending 로그
    await logMessageSend(messageId, 'alimtalk', normalizedPhone, MESSAGE_STATUS.PENDING, {
        templateCode: effectiveTemplateCode,
        vars: templateVars
    });

    const timestamp = Date.now().toString();
    const url = `/alimtalk/v2/services/${SENS_SERVICE_ID}/messages`;
    const signature = makeSensSignature('POST', url, timestamp);

    const messagePayload = {
        to: normalizedPhone,
        content: templateVars.content || buildAlimtalkContent(templateVars),
        buttons: templateVars.buttons || (templateVars.token ? [{
            type: 'WL',
            name: '결과 확인하기',
            linkMobile: `${APP_BASE_URL}/r/${templateVars.token}`,
            linkPc: `${APP_BASE_URL}/r/${templateVars.token}`
        }] : undefined),
        ...(templateVars.image_url ? {
            image: {
                imageUrl: templateVars.image_url,
                imageLink: templateVars.token
                    ? `${APP_BASE_URL}/r/${templateVars.token}`
                    : APP_BASE_URL
            }
        } : {})
    };

    const requestBody = {
        plusFriendId: SENS_CHANNEL_ID,
        templateCode: effectiveTemplateCode,
        messages: [messagePayload]
    };

    try {
        const response = await fetch(`https://sens.apigw.ntruss.com${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'x-ncp-apigw-timestamp': timestamp,
                'x-ncp-iam-access-key': SENS_ACCESS_KEY,
                'x-ncp-apigw-signature-v2': signature
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (response.ok && result.statusCode === '202') {
            console.log(`[SENS] 알림톡 발송 성공:`, {
                messageId,
                requestId: result.requestId
            });
            await logMessageSend(messageId, 'alimtalk', normalizedPhone, MESSAGE_STATUS.SENT, {
                requestId: result.requestId,
                statusCode: result.statusCode
            });
            return {
                success: true,
                messageId,
                requestId: result.requestId,
                status: MESSAGE_STATUS.SENT,
                channel: 'SENS_ALIMTALK'
            };
        } else {
            console.error(`[SENS] 알림톡 발송 실패:`, {
                messageId,
                statusCode: result.statusCode,
                statusName: result.statusName,
                error: result.error
            });
            await logMessageSend(messageId, 'alimtalk', normalizedPhone, MESSAGE_STATUS.FAILED, {
                statusCode: result.statusCode,
                statusName: result.statusName,
                error: result.error
            });
            return {
                success: false,
                messageId,
                error: result.statusName || result.error,
                status: MESSAGE_STATUS.FAILED
            };
        }
    } catch (error) {
        console.error(`[SENS] 알림톡 발송 에러:`, {
            messageId,
            error: error.message
        });
        await logMessageSend(messageId, 'alimtalk', normalizedPhone, MESSAGE_STATUS.FAILED, {
            error: error.message
        });
        return {
            success: false,
            messageId,
            error: error.message,
            status: MESSAGE_STATUS.FAILED
        };
    }
}

/**
 * 알림톡 컨텐츠 빌드 (템플릿 변수 치환)
 */
function buildAlimtalkContent(vars) {
    // 템플릿 예시:
    // {name}님, 기적 분석 결과가 도착했어요!
    // 기적지수: {score}점
    // 나만의 30일 로드맵 준비 완료!
    // 지금 바로 확인하세요

    const { name, score, token } = vars;
    return `${name}님, 기적 분석 결과가 도착했어요! ✨

🌟 기적지수: ${score}점
📋 나만의 30일 로드맵 준비 완료!

지금 바로 확인하세요 👇
${APP_BASE_URL}/r/${token}

- 하루하루의 기적`;
}

/**
 * SENS SMS 발송 (failover)
 */
async function sendSensSMS(phone, text) {
    // Outbound Gate — 실발송 차단
    if (process.env.OUTBOUND_ENABLED !== 'true') {
        console.log('[SAFE MODE] outbound blocked — sendSensSMS skipped');
        return { success: false, skipped: true, reason: 'OUTBOUND_ENABLED=false' };
    }
    const messageId = generateMessageId();
    const normalizedPhone = normalizePhone(phone);

    console.log(`[SENS] SMS 발송 시작:`, {
        messageId,
        to: maskPhone(normalizedPhone),
        textLength: text.length
    });

    if (!SENS_ACCESS_KEY || !SENS_SECRET_KEY || !SENS_SMS_SERVICE_ID) {
        console.warn(`[SENS] SMS API 키 미설정`);
        await logMessageSend(messageId, 'sms', normalizedPhone, MESSAGE_STATUS.SKIPPED, {
            reason: 'SENS SMS API 키 미설정'
        });
        return { success: false, reason: 'SMS API 키 미설정', messageId, status: MESSAGE_STATUS.SKIPPED };
    }

    await logMessageSend(messageId, 'sms', normalizedPhone, MESSAGE_STATUS.PENDING, {
        textLength: text.length
    });

    const timestamp = Date.now().toString();
    const url = `/sms/v2/services/${SENS_SMS_SERVICE_ID}/messages`;
    const signature = makeSensSignature('POST', url, timestamp);

    const requestBody = {
        type: text.length > 80 ? 'LMS' : 'SMS',
        from: SENDER_PHONE,
        content: text,
        messages: [{
            to: normalizedPhone
        }]
    };

    try {
        const response = await fetch(`https://sens.apigw.ntruss.com${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'x-ncp-apigw-timestamp': timestamp,
                'x-ncp-iam-access-key': SENS_ACCESS_KEY,
                'x-ncp-apigw-signature-v2': signature
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (response.ok && result.statusCode === '202') {
            console.log(`[SENS] SMS 발송 성공:`, { messageId, requestId: result.requestId });
            await logMessageSend(messageId, 'sms', normalizedPhone, MESSAGE_STATUS.SENT, {
                requestId: result.requestId
            });
            return {
                success: true,
                messageId,
                requestId: result.requestId,
                status: MESSAGE_STATUS.SENT,
                channel: 'SENS_SMS'
            };
        } else {
            console.error(`[SENS] SMS 발송 실패:`, result);
            await logMessageSend(messageId, 'sms', normalizedPhone, MESSAGE_STATUS.FAILED, {
                error: result.statusName || result.error
            });
            return {
                success: false,
                messageId,
                error: result.statusName,
                status: MESSAGE_STATUS.FAILED
            };
        }
    } catch (error) {
        console.error(`[SENS] SMS 발송 에러:`, error.message);
        await logMessageSend(messageId, 'sms', normalizedPhone, MESSAGE_STATUS.FAILED, {
            error: error.message
        });
        return {
            success: false,
            messageId,
            error: error.message,
            status: MESSAGE_STATUS.FAILED
        };
    }
}

/**
 * 기적 분석 결과 메시지 발송 (통합)
 *
 * @param {string} phone - 수신자 전화번호
 * @param {string} name - 소원이 이름
 * @param {number} score - 기적지수
 * @param {string} token - 결과 페이지 토큰 (result_id)
 */
async function sendResultMessage(phone, name, score, token) {
    const messageId = generateMessageId();

    console.log(`[MessageProvider] 결과 메시지 발송:`, {
        messageId,
        to: maskPhone(phone),
        name,
        score,
        token,
        useSens: USE_SENS
    });

    // 1. SENS 알림톡 시도
    if (USE_SENS) {
        const sensResult = await sendSensAlimtalk(phone, { name, score, token });

        if (sensResult.success) {
            return sensResult;
        }

        // SENS 실패 시 SMS failover
        console.log(`[MessageProvider] SENS 알림톡 실패 → SMS failover`);
        const smsText = `[하루하루의기적] ${name}님 기적지수 ${score}점! 30일 로드맵 확인: ${APP_BASE_URL}/r/${token}`;
        const smsResult = await sendSensSMS(phone, smsText);

        if (smsResult.success) {
            return { ...smsResult, fallback: true };
        }
    }

    // 모든 채널 실패
    console.error(`[MessageProvider] 모든 발송 채널 실패`);
    return {
        success: false,
        messageId,
        reason: '모든 발송 채널 실패',
        status: MESSAGE_STATUS.FAILED
    };
}

/**
 * 소원 접수 ACK 발송 (알림톡 우선, SMS failover)
 */
async function sendWishAckMessage(phone, wishData) {
    const { name, gem_meaning, miracleScore } = wishData;
    const messageId = generateMessageId();
    const normalizedPhone = normalizePhone(phone);

    console.log(`[MessageProvider] ACK 발송:`, {
        messageId,
        to: maskPhone(normalizedPhone),
        name,
        score: miracleScore,
        templateCode: SENS_ACK_TEMPLATE_CODE
    });

    if (!USE_SENS) {
        return { success: false, reason: '발송 채널 비활성화' };
    }

    // 1. 알림톡 발송 시도 (betawelcome 템플릿)
    if (SENS_ACCESS_KEY && SENS_SECRET_KEY && SENS_SERVICE_ID && SENS_ACK_TEMPLATE_CODE) {
        try {
            await logMessageSend(messageId, 'ack_alimtalk', normalizedPhone, MESSAGE_STATUS.PENDING, {
                templateCode: SENS_ACK_TEMPLATE_CODE,
                name,
                score: miracleScore
            });

            const timestamp = Date.now().toString();
            const url = `/alimtalk/v2/services/${SENS_SERVICE_ID}/messages`;
            const signature = makeSensSignature('POST', url, timestamp);

            // betawelcome 템플릿 내용 및 버튼 구성
            const content = buildAckAlimtalkContent({ name });
            const buttons = buildAckAlimtalkButtons();

            const requestBody = {
                plusFriendId: SENS_CHANNEL_ID,
                templateCode: SENS_ACK_TEMPLATE_CODE,
                messages: [{
                    to: normalizedPhone,
                    content: content,
                    buttons: buttons
                }]
            };

            // 🔍 디버깅: SENS API payload 전체 로그
            console.log(`[MessageProvider] ACK 알림톡 SENS API Payload:`, JSON.stringify(requestBody, null, 2));
            console.log(`[MessageProvider] ACK 알림톡 본문 내용:\n${content}`);
            console.log(`[MessageProvider] ACK 알림톡 버튼:`, JSON.stringify(buttons, null, 2));

            const response = await fetch(`https://sens.apigw.ntruss.com${url}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'x-ncp-apigw-timestamp': timestamp,
                    'x-ncp-iam-access-key': SENS_ACCESS_KEY,
                    'x-ncp-apigw-signature-v2': signature
                },
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();

            if (response.ok && result.statusCode === '202') {
                console.log(`[MessageProvider] ACK 알림톡 발송 성공:`, {
                    messageId,
                    requestId: result.requestId
                });
                await logMessageSend(messageId, 'ack_alimtalk', normalizedPhone, MESSAGE_STATUS.SENT, {
                    requestId: result.requestId
                });
                return {
                    success: true,
                    messageId,
                    requestId: result.requestId,
                    status: MESSAGE_STATUS.SENT,
                    channel: 'SENS_ALIMTALK'
                };
            } else {
                console.warn(`[MessageProvider] ACK 알림톡 발송 실패, SMS fallback:`, result);
                await logMessageSend(messageId, 'ack_alimtalk', normalizedPhone, MESSAGE_STATUS.FAILED, {
                    error: result.statusName || result.error
                });
                // SMS fallback으로 진행
            }
        } catch (error) {
            console.error(`[MessageProvider] ACK 알림톡 에러, SMS fallback:`, error.message);
            await logMessageSend(messageId, 'ack_alimtalk', normalizedPhone, MESSAGE_STATUS.FAILED, {
                error: error.message
            });
            // SMS fallback으로 진행
        }
    }

    // 2. SMS Failover
    console.log(`[MessageProvider] ACK SMS fallback 발송`);
    const smsText = `[하루하루의기적] ${name}님 소원접수완료! 기적지수 ${miracleScore}점. 7일간 응원메시지 발송예정. 문의 1899-6117`;
    const smsResult = await sendSensSMS(normalizedPhone, smsText);

    if (smsResult.success) {
        return { ...smsResult, fallback: true };
    }

    return { success: false, reason: '모든 채널 발송 실패', messageId };
}

/**
 * ACK 알림톡 컨텐츠 빌드 (betawelcome 템플릿)
 *
 * 템플릿 형식:
 * #{이름}님, 환영합니다! 🎉
 * 하루하루의 기적 베타 테스터가 되어주셔서 감사합니다.
 * 7일간 매일 아침(8시), 저녁(8시)에 맞춤 응원 메시지를 보내드려요.
 * 내일 아침부터 시작됩니다! ✨
 * 궁금한 점이 있으시면 언제든 문의해주세요 👇
 */
function buildAckAlimtalkContent(vars) {
    const { name } = vars;

    // ⚠️ 템플릿 원문과 정확히 일치해야 함 (줄바꿈, 공백, 이모지 포함)
    return `${name}님, 환영합니다! 🎉

하루하루의 기적 베타 테스터가 되어주셔서 감사합니다.

7일간 매일 아침(8시), 저녁(8시)에 맞춤 응원 메시지를 보내드려요.

내일 아침부터 시작됩니다! ✨

궁금한 점이 있으시면 언제든 문의해주세요 😊

- 하루하루의 기적 드림`;
}

/**
 * ACK 알림톡 버튼 구성 (betawelcome 템플릿)
 */
function buildAckAlimtalkButtons() {
    return [
        {
            type: 'WL',
            name: '나의 기적 보기',
            linkMobile: 'https://dailymiracles.kr/mypage',
            linkPc: 'https://dailymiracles.kr/mypage'
        },
        {
            type: 'WL',
            name: '고객센터',
            linkMobile: 'https://dailymiracles.kr/support',
            linkPc: 'https://dailymiracles.kr/support'
        }
    ];
}

/**
 * RED 알림 발송 (관리자/재미 CRO에게)
 */
async function sendRedAlertMessage(wishData) {
    const { name, wish, traffic_light } = wishData;
    const adminPhone = process.env.ADMIN_PHONE || process.env.SENDER_PHONE || '18996117';

    console.log(`[MessageProvider] 🔴 RED 알림 발송:`, {
        to: maskPhone(adminPhone),
        userName: name,
        reason: traffic_light?.reason
    });

    const alertText = `[긴급] RED 신호 감지!
소원이: ${name}
사유: ${traffic_light?.reason || '위험 키워드'}
조치: ${traffic_light?.action || '즉시 확인 필요'}
문의 1899-6117`;

    // SENS SMS로 발송
    if (USE_SENS) {
        return await sendSensSMS(adminPhone, alertText);
    }

    return { success: false, reason: '발송 채널 비활성화' };
}

// ── 이용권 REDEEMED 알림톡 템플릿 ─────────────────────────────────────
// 은하군별 본문 + 버튼 구성 (SENS 사전 등록 필요)
const BENEFIT_ALIMTALK_TEMPLATE = {
    challenge: {
        templateCode: process.env.SENS_BENEFIT_TEMPLATE_CHALLENGE || 'benefit_redeemed_challenge',
        content: (benefitName) =>
`[하루하루의 기적]
오늘의 도전 항로 이용이 확인되었어요.
소원이의 한 걸음이 별의 기록으로 남았어요.

이용: ${benefitName}`,
        buttons: [
            { type: 'WL', name: '내 별 보러가기',  linkMobile: `${APP_BASE_URL}/my-star` },
            { type: 'WL', name: '다음 도전 보기',   linkMobile: `${APP_BASE_URL}/dreamtown` },
        ],
    },
    growth: {
        templateCode: process.env.SENS_BENEFIT_TEMPLATE_GROWTH || 'benefit_redeemed_growth',
        content: (benefitName) =>
`[하루하루의 기적]
오늘의 경험이 성장의 기록으로 남았어요.
조금 더 또렷해진 순간이 쌓이고 있어요.

이용: ${benefitName}`,
        buttons: [
            { type: 'WL', name: '성장 기록 보기',   linkMobile: `${APP_BASE_URL}/my-star` },
            { type: 'WL', name: '다음 항로 추천',   linkMobile: `${APP_BASE_URL}/dreamtown` },
        ],
    },
    relation: {
        templateCode: process.env.SENS_BENEFIT_TEMPLATE_RELATION || 'benefit_redeemed_relation',
        content: (benefitName) =>
`[하루하루의 기적]
오늘의 연결이 별에 기록되었어요.
함께한 시간이 의미로 남았어요.

이용: ${benefitName}`,
        buttons: [
            { type: 'WL', name: '내 별 보러가기',  linkMobile: `${APP_BASE_URL}/my-star` },
            { type: 'WL', name: '소감 남기기',      linkMobile: `${APP_BASE_URL}/dreamtown` },
        ],
    },
    healing: {
        templateCode: process.env.SENS_BENEFIT_TEMPLATE_HEALING || 'benefit_redeemed_healing',
        content: (benefitName) =>
`[하루하루의 기적]
오늘의 체험이 회복의 기록으로 남았어요.
지금의 속도도 충분히 괜찮아요.

이용: ${benefitName}`,
        buttons: [
            { type: 'WL', name: '내 상태 보기',    linkMobile: `${APP_BASE_URL}/my-star` },
            { type: 'WL', name: '다음 추천 보기',  linkMobile: `${APP_BASE_URL}/dreamtown` },
        ],
    },
    miracle: {
        templateCode: process.env.SENS_BENEFIT_TEMPLATE_MIRACLE || 'benefit_redeemed_miracle',
        content: (benefitName) =>
`[하루하루의 기적]
오늘의 선택이 하나의 항로가 되었어요.
방향 없이 흐른 순간도 충분히 의미 있어요.

이용: ${benefitName}`,
        buttons: [
            { type: 'WL', name: '내 별 보러가기',   linkMobile: `${APP_BASE_URL}/my-star` },
            { type: 'WL', name: '새로운 항로 보기', linkMobile: `${APP_BASE_URL}/dreamtown` },
        ],
    },
};

/**
 * 이용권 사용 완료 알림톡 발송
 * @param {string} phone - 수신자 전화번호
 * @param {{ galaxy_code, benefit_name, credential_code }} data
 */
async function sendBenefitRedeemedMessage(phone, data) {
    const { galaxy_code, benefit_name } = data;
    const tmpl = BENEFIT_ALIMTALK_TEMPLATE[galaxy_code] ?? BENEFIT_ALIMTALK_TEMPLATE.miracle;

    return sendSensAlimtalk(phone, {
        templateCode: tmpl.templateCode,
        content:      tmpl.content(benefit_name),
        buttons:      tmpl.buttons,
    });
}

/**
 * 견적 접수 알림톡 발송 (비동기)
 *
 * @param {string} phone - 수신자 전화번호
 * @param {object} quoteData - 견적 데이터
 * @param {string} quoteData.quote_id - 견적 ID
 * @param {string} quoteData.customer_name - 고객명
 * @param {number} quoteData.guest_count - 인원수
 * @param {string} quoteData.trip_start - 여행 시작일
 * @param {string} quoteData.env - 환경 (prod/test)
 */
async function sendQuoteAckMessage(phone, quoteData) {
    const messageId = generateMessageId();
    const normalizedPhone = normalizePhone(phone);
    const env = quoteData.env || 'prod';

    console.log(`[MessageProvider] 견적 접수 알림톡 발송:`, {
        messageId,
        to: maskPhone(normalizedPhone),
        quote_id: quoteData.quote_id,
        name: quoteData.customer_name,
        env
    });

    // 전화번호 없으면 스킵
    if (!normalizedPhone) {
        console.warn(`[MessageProvider] 견적 알림톡 스킵: 전화번호 없음`);
        await logMessageSend(messageId, 'quote_ack', '', MESSAGE_STATUS.SKIPPED, {
            reason: '전화번호 없음',
            quote_id: quoteData.quote_id,
            env
        });
        return { success: false, reason: '전화번호 없음', status: MESSAGE_STATUS.SKIPPED };
    }

    // test 환경에서는 실제 발송 스킵 (로그만)
    if (env === 'test') {
        console.log(`[MessageProvider] 견적 알림톡 스킵: test 환경`);
        await logMessageSend(messageId, 'quote_ack', normalizedPhone, MESSAGE_STATUS.SKIPPED, {
            reason: 'test 환경',
            quote_id: quoteData.quote_id,
            env
        });
        return { success: true, reason: 'test 환경 - 발송 스킵', status: MESSAGE_STATUS.SKIPPED, env };
    }

    // SENS 알림톡 시도
    if (USE_SENS && SENS_QUOTE_TEMPLATE_CODE) {
        try {
            // pending 로그
            await logMessageSend(messageId, 'quote_ack_alimtalk', normalizedPhone, MESSAGE_STATUS.PENDING, {
                templateCode: SENS_QUOTE_TEMPLATE_CODE,
                quote_id: quoteData.quote_id,
                env
            });

            const timestamp = Date.now().toString();
            const url = `/alimtalk/v2/services/${SENS_SERVICE_ID}/messages`;
            const signature = makeSensSignature('POST', url, timestamp);

            const content = buildQuoteAckContent(quoteData);

            const requestBody = {
                plusFriendId: SENS_CHANNEL_ID,
                templateCode: SENS_QUOTE_TEMPLATE_CODE,
                messages: [{
                    to: normalizedPhone,
                    content: content
                }]
            };

            const response = await fetch(`https://sens.apigw.ntruss.com${url}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'x-ncp-apigw-timestamp': timestamp,
                    'x-ncp-iam-access-key': SENS_ACCESS_KEY,
                    'x-ncp-apigw-signature-v2': signature
                },
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();

            if (response.ok && result.statusCode === '202') {
                console.log(`[MessageProvider] 견적 알림톡 발송 성공:`, {
                    messageId,
                    requestId: result.requestId,
                    quote_id: quoteData.quote_id
                });
                await logMessageSend(messageId, 'quote_ack_alimtalk', normalizedPhone, MESSAGE_STATUS.SENT, {
                    requestId: result.requestId,
                    quote_id: quoteData.quote_id,
                    env
                });
                return {
                    success: true,
                    messageId,
                    requestId: result.requestId,
                    status: MESSAGE_STATUS.SENT,
                    channel: 'SENS_ALIMTALK',
                    env
                };
            } else {
                console.error(`[MessageProvider] 견적 알림톡 발송 실패:`, result);
                await logMessageSend(messageId, 'quote_ack_alimtalk', normalizedPhone, MESSAGE_STATUS.FAILED, {
                    error: result.statusName || result.error,
                    quote_id: quoteData.quote_id,
                    env
                });
                // SMS failover
            }
        } catch (err) {
            console.error(`[MessageProvider] 견적 알림톡 에러:`, err.message);
            await logMessageSend(messageId, 'quote_ack_alimtalk', normalizedPhone, MESSAGE_STATUS.FAILED, {
                error: err.message,
                quote_id: quoteData.quote_id,
                env
            });
        }
    }

    // SMS Failover
    if (USE_SENS) {
        const smsText = buildQuoteAckSMS(quoteData);
        const smsResult = await sendSensSMS(normalizedPhone, smsText);

        if (smsResult.success) {
            // SMS 로그에 env 추가
            await logMessageSend(messageId + '-sms', 'quote_ack_sms', normalizedPhone, MESSAGE_STATUS.SENT, {
                quote_id: quoteData.quote_id,
                env,
                fallback: true
            });
            return { ...smsResult, env, fallback: true };
        }
    }

    // 모든 채널 실패
    console.error(`[MessageProvider] 견적 알림톡 모든 채널 실패`);
    await logMessageSend(messageId, 'quote_ack', normalizedPhone, MESSAGE_STATUS.FAILED, {
        reason: '모든 채널 실패',
        quote_id: quoteData.quote_id,
        env
    });
    return { success: false, reason: '모든 채널 실패', status: MESSAGE_STATUS.FAILED, env };
}

/**
 * 견적 접수 알림톡 컨텐츠 빌드
 */
function buildQuoteAckContent(quoteData) {
    const { customer_name, quote_id, guest_count, trip_start, trip_end } = quoteData;
    const tripPeriod = trip_start && trip_end
        ? `${trip_start} ~ ${trip_end}`
        : trip_start || '미정';

    return `${customer_name}님, 견적 요청이 접수되었습니다!

📋 견적번호: ${quote_id}
👥 인원: ${guest_count || 2}명
📅 여행일정: ${tripPeriod}

24시간 내 맞춤 견적서를 보내드리겠습니다.
궁금한 점은 언제든 문의해주세요!

☎ 1899-6117
- 여수 소원항해`;
}

/**
 * 견적 접수 SMS 컨텐츠 빌드
 */
function buildQuoteAckSMS(quoteData) {
    const { customer_name, quote_id } = quoteData;
    return `[여수소원항해] ${customer_name}님 견적요청 접수완료(${quote_id}). 24시간 내 견적서 발송예정. 문의 1899-6117`;
}

/**
 * 발송 가능 상태 확인
 */
function isEnabled() {
    return USE_SENS;
}

/**
 * SENS 알림톡 발송 결과 조회 (requestId 기반)
 */
async function querySensResult(requestId) {
    if (!SENS_ACCESS_KEY || !SENS_SECRET_KEY || !SENS_SERVICE_ID) {
        return { success: false, reason: 'SENS API 키 미설정' };
    }

    const timestamp = Date.now().toString();
    const url = `/alimtalk/v2/services/${SENS_SERVICE_ID}/messages?requestId=${requestId}`;
    const signature = makeSensSignature('GET', url, timestamp);

    const response = await fetch(`https://sens.apigw.ntruss.com${url}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'x-ncp-apigw-timestamp': timestamp,
            'x-ncp-iam-access-key': SENS_ACCESS_KEY,
            'x-ncp-apigw-signature-v2': signature
        }
    });

    const data = await response.json();
    return { success: response.ok, statusCode: response.status, data };
}

/**
 * 현재 설정 정보 반환
 */
function getConfig() {
    return {
        useSens: USE_SENS,
        sensConfigured: !!(SENS_ACCESS_KEY && SENS_SECRET_KEY && SENS_SERVICE_ID),
        sensTemplateCode: SENS_TEMPLATE_CODE || null,
        channelId: SENS_CHANNEL_ID,
        appBaseUrl: APP_BASE_URL
    };
}

module.exports = {
    sendResultMessage,
    sendWishAckMessage,
    sendRedAlertMessage,
    sendQuoteAckMessage,
    sendBenefitRedeemedMessage,
    sendSensAlimtalk,
    sendSensSMS,
    querySensResult,
    isEnabled,
    getConfig,
    MESSAGE_STATUS,
    APP_BASE_URL
};
