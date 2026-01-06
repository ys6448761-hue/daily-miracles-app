/**
 * quoteRequestRoutes.js
 *
 * Wix 자유여행 견적 요청 API
 * POST /api/quote/request - Wix 폼 → 견적 생성
 *
 * @version 1.0 - 2026.01.06
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// DB 연결
let db = null;
try {
    db = require('../database/db');
    console.log('[QuoteRequest] DB 연결 성공');
} catch (e) {
    console.error('[QuoteRequest] DB 연결 실패:', e.message);
}

// 이벤트 로거
let eventLogger = null;
try {
    eventLogger = require('../services/eventLogger');
} catch (e) {
    console.warn('[QuoteRequest] eventLogger 로드 실패');
}

// 메시지 프로바이더 (SENS 알림톡)
let messageProvider = null;
try {
    messageProvider = require('../services/messageProvider');
    console.log('[QuoteRequest] messageProvider 로드 성공');
} catch (e) {
    console.warn('[QuoteRequest] messageProvider 로드 실패:', e.message);
}

// Webhook 시크릿 (환경변수)
const WEBHOOK_SECRET = process.env.WIX_WEBHOOK_SECRET || process.env.QUOTE_WEBHOOK_SECRET;

/**
 * Quote ID 생성
 * 형식: QR-YYYYMMDD-XXXX (랜덤 4자리)
 */
function generateQuoteId() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `QR-${dateStr}-${random}`;
}

/**
 * 전화번호 정규화
 */
function normalizePhone(phone) {
    if (!phone) return null;
    return phone.replace(/[^0-9]/g, '');
}

/**
 * 환경 감지 (prod/test)
 */
function detectEnv(payload) {
    // 명시적 env 필드
    if (payload.env) return payload.env;

    // 테스트 시그널 감지
    const testSignals = ['test', '테스트', 'TEST', 'dev', 'staging'];
    const checkFields = [payload.name, payload.email, payload.notes];

    for (const field of checkFields) {
        if (field && testSignals.some(sig => String(field).toLowerCase().includes(sig))) {
            return 'test';
        }
    }

    // 전화번호 테스트 패턴
    if (payload.phone) {
        const phone = normalizePhone(payload.phone);
        if (phone === '01000000000' || phone === '01012345678' || phone.startsWith('0100000')) {
            return 'test';
        }
    }

    return 'prod';
}

/**
 * Webhook 시크릿 검증 미들웨어
 */
function verifyWebhookSecret(req, res, next) {
    // 시크릿 미설정 시 경고만 하고 통과 (개발 편의)
    if (!WEBHOOK_SECRET) {
        console.warn('[QuoteRequest] WEBHOOK_SECRET 미설정 - 검증 건너뜀');
        return next();
    }

    const providedSecret = req.headers['x-webhook-secret'] ||
                           req.headers['x-quote-secret'] ||
                           req.query.secret;

    if (providedSecret !== WEBHOOK_SECRET) {
        console.error('[QuoteRequest] 401 - 잘못된 Webhook Secret');
        return res.status(401).json({
            success: false,
            error: 'unauthorized',
            message: 'Invalid webhook secret'
        });
    }

    next();
}

/**
 * POST /api/quote/request
 * Wix 폼 제출 → 견적 생성
 */
router.post('/request', verifyWebhookSecret, async (req, res) => {
    const startTime = Date.now();
    const quoteId = generateQuoteId();

    console.log(`[QuoteRequest] 요청 수신: ${quoteId}`);

    try {
        const payload = req.body;

        // 필수 필드 검증
        if (!payload.name) {
            console.warn(`[QuoteRequest] 필수 필드 누락: name`);
            return res.status(400).json({
                success: false,
                error: 'missing_field',
                message: '이름은 필수 입력입니다'
            });
        }

        // 환경 감지
        const env = detectEnv(payload);

        // 데이터 정규화
        const quoteData = {
            quote_id: quoteId,
            status: 'lead',

            // 고객 정보
            customer_name: payload.name?.trim(),
            customer_phone: normalizePhone(payload.phone),
            customer_email: payload.email?.trim() || null,

            // 여행 정보
            trip_start: payload.trip_start || payload.travel_date || null,
            trip_end: payload.trip_end || null,
            guest_count: parseInt(payload.pax || payload.party_size || 2, 10),
            departure_city: payload.departure_city || null,
            budget_range: payload.budget_range || null,
            style_tags: Array.isArray(payload.style_tags)
                ? payload.style_tags
                : payload.trip_style
                    ? [payload.trip_style]
                    : null,

            // 추가 정보
            accommodation_grade: payload.accommodation || null,
            must_visit: payload.must_visit || null,
            notes: payload.notes || payload.special_request || null,

            // 메타
            source: payload.source || 'wix_form',
            referral_source: payload.referral_source || null,
            env: env,
            region_code: payload.region || 'yeosu'
        };

        console.log(`[QuoteRequest] 견적 생성:`, {
            quote_id: quoteId,
            name: quoteData.customer_name,
            phone: quoteData.customer_phone ? `${quoteData.customer_phone.substring(0, 3)}****` : null,
            pax: quoteData.guest_count,
            env: env
        });

        // DB 저장
        if (db) {
            try {
                await db.query(`
                    INSERT INTO quotes (
                        quote_id, status,
                        customer_name, customer_phone, customer_email,
                        trip_start, trip_end, guest_count, departure_city,
                        budget_range, style_tags, accommodation_grade,
                        must_visit, notes, source, referral_source, env, region_code,
                        created_at, updated_at
                    ) VALUES (
                        $1, $2,
                        $3, $4, $5,
                        $6, $7, $8, $9,
                        $10, $11, $12,
                        $13, $14, $15, $16, $17, $18,
                        NOW(), NOW()
                    )
                `, [
                    quoteData.quote_id, quoteData.status,
                    quoteData.customer_name, quoteData.customer_phone, quoteData.customer_email,
                    quoteData.trip_start, quoteData.trip_end, quoteData.guest_count, quoteData.departure_city,
                    quoteData.budget_range, quoteData.style_tags, quoteData.accommodation_grade,
                    quoteData.must_visit, quoteData.notes, quoteData.source, quoteData.referral_source,
                    quoteData.env, quoteData.region_code
                ]);

                console.log(`[QuoteRequest] DB 저장 완료: ${quoteId}`);
            } catch (dbErr) {
                console.error(`[QuoteRequest] DB 저장 실패:`, dbErr.message);
                // DB 저장 실패해도 일단 성공 응답 (유실 방지)
            }
        }

        // 이벤트 로깅 (marketing_events)
        if (eventLogger) {
            try {
                await eventLogger.logEvent('QUOTE_REQUESTED', {
                    quote_id: quoteId,
                    customer_name: quoteData.customer_name,
                    source: quoteData.source,
                    pax: quoteData.guest_count,
                    env: env
                }, {
                    source: 'quoteRequestRoutes',
                    env: env
                });
            } catch (logErr) {
                console.warn(`[QuoteRequest] 이벤트 로깅 실패:`, logErr.message);
            }
        }

        // quote_events 테이블에도 기록
        if (db) {
            try {
                await db.query(`
                    INSERT INTO quote_events (event_type, quote_id, payload, source, created_at)
                    VALUES ($1, $2, $3, $4, NOW())
                `, [
                    'QuoteRequested',
                    quoteId,
                    JSON.stringify({ ...quoteData, raw_payload: payload }),
                    'wix_webhook'
                ]);
            } catch (evErr) {
                console.warn(`[QuoteRequest] quote_events 기록 실패:`, evErr.message);
            }
        }

        const duration = Date.now() - startTime;
        console.log(`[QuoteRequest] 완료: ${quoteId} (${duration}ms)`);

        // 비동기 알림톡 발송 (fire-and-forget)
        // API 응답은 발송 성공 여부와 무관하게 즉시 반환
        if (messageProvider && quoteData.customer_phone) {
            // setImmediate로 비동기 처리 (응답 블로킹 방지)
            setImmediate(async () => {
                try {
                    console.log(`[QuoteRequest] 견적 접수 알림톡 발송 시작: ${quoteId}`);
                    const sendResult = await messageProvider.sendQuoteAckMessage(
                        quoteData.customer_phone,
                        {
                            quote_id: quoteId,
                            customer_name: quoteData.customer_name,
                            guest_count: quoteData.guest_count,
                            trip_start: quoteData.trip_start,
                            trip_end: quoteData.trip_end,
                            env: quoteData.env
                        }
                    );
                    console.log(`[QuoteRequest] 알림톡 발송 결과:`, {
                        quote_id: quoteId,
                        success: sendResult.success,
                        status: sendResult.status,
                        channel: sendResult.channel,
                        env: sendResult.env
                    });
                } catch (msgErr) {
                    console.error(`[QuoteRequest] 알림톡 발송 에러:`, msgErr.message);
                }
            });
        } else if (!quoteData.customer_phone) {
            console.log(`[QuoteRequest] 알림톡 스킵: 전화번호 없음 (${quoteId})`);
        }

        res.json({
            success: true,
            quote_id: quoteId,
            status: 'lead',
            env: env,
            message: '견적 요청이 접수되었습니다'
        });

    } catch (error) {
        console.error(`[QuoteRequest] 오류:`, error);

        res.status(500).json({
            success: false,
            error: 'server_error',
            message: '견적 요청 처리 중 오류가 발생했습니다'
        });
    }
});

/**
 * GET /api/quote/request/:quoteId
 * 견적 상태 조회
 */
router.get('/request/:quoteId', async (req, res) => {
    const { quoteId } = req.params;

    if (!db) {
        return res.status(503).json({
            success: false,
            error: 'db_unavailable'
        });
    }

    try {
        const result = await db.query(`
            SELECT quote_id, status, customer_name, guest_count, trip_start, trip_end,
                   source, env, created_at, updated_at
            FROM quotes
            WHERE quote_id = $1
        `, [quoteId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'not_found',
                message: '견적을 찾을 수 없습니다'
            });
        }

        res.json({
            success: true,
            quote: result.rows[0]
        });
    } catch (error) {
        console.error(`[QuoteRequest] 조회 오류:`, error);
        res.status(500).json({
            success: false,
            error: 'server_error'
        });
    }
});

/**
 * PATCH /api/quote/request/:quoteId/status
 * 견적 상태 변경
 */
router.patch('/request/:quoteId/status', async (req, res) => {
    const { quoteId } = req.params;
    const { status } = req.body;

    const validStatuses = ['lead', 'quoted', 'deposit_paid', 'confirmed', 'completed', 'expired', 'cancelled'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            error: 'invalid_status',
            message: `유효하지 않은 상태입니다. 허용: ${validStatuses.join(', ')}`
        });
    }

    if (!db) {
        return res.status(503).json({
            success: false,
            error: 'db_unavailable'
        });
    }

    try {
        const result = await db.query(`
            UPDATE quotes
            SET status = $1, updated_at = NOW()
            WHERE quote_id = $2
            RETURNING quote_id, status, updated_at
        `, [status, quoteId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'not_found'
            });
        }

        // 상태 변경 이벤트 기록
        if (db) {
            await db.query(`
                INSERT INTO quote_events (event_type, quote_id, payload, source, created_at)
                VALUES ($1, $2, $3, $4, NOW())
            `, [
                `QuoteStatus_${status}`,
                quoteId,
                JSON.stringify({ new_status: status }),
                'api'
            ]);
        }

        console.log(`[QuoteRequest] 상태 변경: ${quoteId} → ${status}`);

        res.json({
            success: true,
            quote_id: quoteId,
            status: status
        });
    } catch (error) {
        console.error(`[QuoteRequest] 상태 변경 오류:`, error);
        res.status(500).json({
            success: false,
            error: 'server_error'
        });
    }
});

module.exports = router;
