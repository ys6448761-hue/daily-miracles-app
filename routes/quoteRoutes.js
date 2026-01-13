/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 여수 소원항해 견적 시스템 v2.0 - API Routes
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 핵심 원칙:
 *   1. 지역 확장 대비 (yeosu → 전국)
 *   2. 개인/단체 동일 엔진 처리
 *   3. 운영비 기반 마진 자동 계산
 *   4. 혜택은 display용 (가격 차감 X)
 *
 * 엔드포인트:
 *   POST /api/v2/quote/calculate      - 견적 계산
 *   POST /api/v2/quote/request        - 예약 요청 (고객 정보 입력)
 *   GET  /api/v2/quote/:quoteId       - 견적 조회
 *   POST /api/v2/quote/:quoteId/group-info  - 단체 추가 정보
 *   GET  /api/v2/admin/quotes         - 관리자 목록
 *   GET  /api/v2/admin/quotes/hot     - HOT 리드 목록
 *   POST /api/v2/admin/migrate        - DB 마이그레이션
 *   GET  /api/v2/quote/health         - 헬스체크
 *
 * 작성일: 2026-01-04
 * 설계: 루미 / 코미
 * 승인: 푸르미르 CEO
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();

// 견적 엔진 (필수)
const quoteEngine = require('../services/quoteEngine');

// 결제 서비스 (선택적 로딩)
let tossPayments = null;
try {
  tossPayments = require('../services/tossPaymentsService');
  console.log('[Quote] 토스페이먼츠 서비스 로드 완료');
} catch (error) {
  console.warn('[Quote] 토스페이먼츠 서비스 로드 실패 - 결제 기능 비활성화');
}

// DB 모듈 (선택적 로딩)
let db = null;
try {
  db = require('../database/db');
} catch (error) {
  console.warn('[Quote] DB 모듈 로드 실패 - 메모리 모드로 동작');
}

// 노션 Ops 서비스 (선택적 로딩)
let notionOps = null;
try {
  notionOps = require('../services/notionOpsService');
  console.log('[Quote] 노션 Ops 서비스 로드 완료');
} catch (error) {
  console.warn('[Quote] 노션 Ops 서비스 로드 실패 - 노션 연동 비활성화');
}

// ═══════════════════════════════════════════════════════════════════════════
// 상수 정의
// ═══════════════════════════════════════════════════════════════════════════

const QUOTE_STATUS = {
  CALCULATED: 'calculated',   // 견적 계산됨
  REQUESTED: 'requested',     // 예약 요청됨
  CONFIRMED: 'confirmed',     // 확정
  CANCELLED: 'cancelled',     // 취소
  EXPIRED: 'expired'          // 만료
};

// 인메모리 저장소 (DB 없을 때 폴백)
const memoryStore = {
  quotes: new Map(),
  events: [],
  groupInquiries: new Map()
};

// ═══════════════════════════════════════════════════════════════════════════
// 유틸리티 함수
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 이벤트 로깅
 */
async function logEvent(eventType, quoteId, payload, source = 'api') {
  const event = {
    event_type: eventType,
    quote_id: quoteId,
    payload,
    source,
    created_at: new Date().toISOString()
  };

  // DB 저장 시도
  if (db) {
    try {
      await db.query(
        `INSERT INTO quote_events (event_type, quote_id, payload, source)
         VALUES ($1, $2, $3, $4)`,
        [eventType, quoteId, JSON.stringify(payload), source]
      );
    } catch (error) {
      console.error('[Quote] 이벤트 로깅 실패:', error.message);
    }
  }

  // 메모리에도 저장
  memoryStore.events.push(event);
  if (memoryStore.events.length > 1000) {
    memoryStore.events = memoryStore.events.slice(-500);
  }

  return event;
}

/**
 * 견적 저장
 */
async function saveQuote(quoteData) {
  const quoteId = quoteData.quote_id;

  if (db) {
    try {
      const result = await db.query(
        `INSERT INTO quotes (
          quote_id, region_code, guest_count, day_type, travel_date,
          hotel_code, hotel_name, room_type,
          leisure_code, leisure_name,
          has_wish_voyage, wish_voyage_type, wish_voyage_version,
          is_group,
          hotel_cost, hotel_sell, hotel_list,
          leisure_cost, leisure_sell, leisure_list,
          wish_voyage_cost, wish_voyage_sell, wish_voyage_list,
          operation_fee_per_person, operation_fee_total, operation_fee_negotiable, operation_fee_note,
          voucher_mode, voucher_food, voucher_experience, voucher_local_goods, voucher_flex, voucher_total,
          total_cost, total_sell, total_list, total_margin, per_person_sell,
          benefits_display, benefits_total_value,
          lead_score, lead_grade, tags,
          valid_until, status
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8,
          $9, $10,
          $11, $12, $13,
          $14,
          $15, $16, $17,
          $18, $19, $20,
          $21, $22, $23,
          $24, $25, $26, $27,
          $28, $29, $30, $31, $32, $33,
          $34, $35, $36, $37, $38,
          $39, $40,
          $41, $42, $43,
          $44, $45
        )
        ON CONFLICT (quote_id) DO UPDATE SET
          status = EXCLUDED.status,
          customer_name = EXCLUDED.customer_name,
          customer_phone = EXCLUDED.customer_phone,
          customer_email = EXCLUDED.customer_email,
          memo = EXCLUDED.memo,
          updated_at = NOW()
        RETURNING *`,
        [
          quoteId, quoteData.region_code, quoteData.guest_count, quoteData.day_type, quoteData.travel_date,
          quoteData.hotel_code, quoteData.hotel_name, quoteData.room_type,
          quoteData.leisure_code, quoteData.leisure_name,
          quoteData.has_wish_voyage, quoteData.wish_voyage_type, quoteData.wish_voyage_version,
          quoteData.is_group,
          quoteData.hotel_cost, quoteData.hotel_sell, quoteData.hotel_list,
          quoteData.leisure_cost, quoteData.leisure_sell, quoteData.leisure_list,
          quoteData.wish_voyage_cost, quoteData.wish_voyage_sell, quoteData.wish_voyage_list,
          quoteData.operation_fee_per_person, quoteData.operation_fee_total, quoteData.operation_fee_negotiable, quoteData.operation_fee_note,
          quoteData.voucher_mode, quoteData.voucher_food, quoteData.voucher_experience, quoteData.voucher_local_goods, quoteData.voucher_flex, quoteData.voucher_total,
          quoteData.total_cost, quoteData.total_sell, quoteData.total_list, quoteData.total_margin, quoteData.per_person_sell,
          JSON.stringify(quoteData.benefits_display), quoteData.benefits_total_value,
          quoteData.lead_score, quoteData.lead_grade, quoteData.tags,
          quoteData.valid_until, quoteData.status
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('[Quote] DB 저장 실패:', error.message);
      // 폴백: 메모리 저장
    }
  }

  // 메모리 저장
  memoryStore.quotes.set(quoteId, { ...quoteData, created_at: new Date().toISOString() });
  return quoteData;
}

/**
 * 견적 조회
 */
async function getQuote(quoteId) {
  if (db) {
    try {
      const result = await db.query(
        'SELECT * FROM quotes WHERE quote_id = $1',
        [quoteId]
      );
      if (result.rows.length > 0) {
        return result.rows[0];
      }
    } catch (error) {
      console.error('[Quote] DB 조회 실패:', error.message);
    }
  }

  return memoryStore.quotes.get(quoteId);
}

/**
 * 견적 업데이트
 */
async function updateQuote(quoteId, updates) {
  if (db) {
    try {
      const setClauses = [];
      const values = [quoteId];
      let paramIndex = 2;

      for (const [key, value] of Object.entries(updates)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      setClauses.push('updated_at = NOW()');

      const result = await db.query(
        `UPDATE quotes SET ${setClauses.join(', ')} WHERE quote_id = $1 RETURNING *`,
        values
      );
      return result.rows[0];
    } catch (error) {
      console.error('[Quote] DB 업데이트 실패:', error.message);
    }
  }

  const existing = memoryStore.quotes.get(quoteId);
  if (existing) {
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    memoryStore.quotes.set(quoteId, updated);
    return updated;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// API 엔드포인트
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/v2/quote/calculate
 * 견적 계산
 */
router.post('/calculate', async (req, res) => {
  try {
    const options = req.body;

    // 필수 필드 검증
    if (!options.guestCount || !options.hotel) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'guestCount와 hotel은 필수입니다'
      });
    }

    // 날짜 처리 (date → travelDate 매핑)
    if (!options.date) {
      options.date = new Date().toISOString().split('T')[0];
    }
    options.travelDate = options.date;  // 엔진은 travelDate 사용

    // 견적 계산
    const result = quoteEngine.calculateQuote(options);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // CRM 점수 계산
    const leadInfo = quoteEngine.calculateLeadScore(result);
    const tags = quoteEngine.generateAutoTags(result);

    // breakdown 배열에서 각 항목 추출
    const hotelItem = result.breakdown.find(b => b.category === 'hotel');
    const leisureItem = result.breakdown.find(b => b.category === 'leisure');
    const wishVoyageItem = result.breakdown.find(b => b.category === 'wishVoyage');
    const operationItem = result.breakdown.find(b => b.category === 'operation');

    // 저장용 데이터 구성
    const quoteData = {
      quote_id: result.quoteId,
      region_code: options.region || 'yeosu',
      guest_count: options.guestCount,
      day_type: result.dayType,
      travel_date: options.date,

      hotel_code: options.hotel,
      hotel_name: hotelItem?.name || null,
      room_type: hotelItem?.roomType || null,

      leisure_code: options.leisure || null,
      leisure_name: leisureItem?.name || null,

      has_wish_voyage: options.hasWishVoyage || false,
      wish_voyage_type: options.wishVoyageType || null,
      wish_voyage_version: null,  // 추후 지원

      is_group: result.isGroup,

      hotel_cost: hotelItem?.cost || 0,
      hotel_sell: hotelItem?.sell || 0,
      hotel_list: hotelItem?.list || 0,

      leisure_cost: leisureItem?.cost || 0,
      leisure_sell: leisureItem?.sell || 0,
      leisure_list: leisureItem?.list || 0,

      wish_voyage_cost: wishVoyageItem?.cost || 0,
      wish_voyage_sell: wishVoyageItem?.sell || 0,
      wish_voyage_list: wishVoyageItem?.list || 0,

      operation_fee_per_person: operationItem?.perPerson || 0,
      operation_fee_total: operationItem?.sell || 0,
      operation_fee_negotiable: result.negotiable || false,
      operation_fee_note: operationItem?.note || null,

      voucher_mode: result.voucher.mode,
      voucher_food: result.voucher.split.food,
      voucher_experience: result.voucher.split.experience,
      voucher_local_goods: result.voucher.split.localGoods,
      voucher_flex: result.voucher.flex || 0,
      voucher_total: result.voucher.totalSplitValue || 0,

      total_cost: result.pricing.totalCost,
      total_sell: result.pricing.totalSell,
      total_list: result.pricing.totalList,
      total_margin: result.pricing.totalMargin,
      per_person_sell: Math.round(result.pricing.totalSell / options.guestCount),

      benefits_display: result.freeBenefits,
      benefits_total_value: result.freeBenefits.reduce((sum, b) => sum + b.value, 0),

      lead_score: leadInfo.score,
      lead_grade: leadInfo.grade,
      tags: tags,

      valid_until: result.validUntil,
      status: QUOTE_STATUS.CALCULATED
    };

    // 저장
    await saveQuote(quoteData);

    // 이벤트 로깅
    await logEvent('QuoteCalculated', result.quoteId, {
      options,
      pricing: result.pricing,
      isGroup: result.isGroup,
      leadGrade: leadInfo.grade
    });

    // 응답
    res.json({
      success: true,
      quoteId: result.quoteId,
      validUntil: result.validUntil,
      isGroup: result.isGroup,
      pricing: result.pricing,
      breakdown: result.breakdown,
      voucher: result.voucher,
      freeBenefits: result.freeBenefits,
      lead: leadInfo,
      tags
    });

  } catch (error) {
    console.error('[Quote] 계산 오류:', error);
    res.status(500).json({
      success: false,
      error: 'CALCULATION_ERROR',
      message: error.message
    });
  }
});

/**
 * POST /api/v2/quote/request
 * 예약 요청 (고객 정보 입력)
 */
router.post('/request', async (req, res) => {
  try {
    const { quoteId, customerName, customerPhone, customerEmail, memo } = req.body;

    if (!quoteId || !customerName || !customerPhone) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'quoteId, customerName, customerPhone은 필수입니다'
      });
    }

    // 견적 조회
    const quote = await getQuote(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'QUOTE_NOT_FOUND',
        message: '견적을 찾을 수 없습니다'
      });
    }

    // 만료 확인
    if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'QUOTE_EXPIRED',
        message: '견적이 만료되었습니다. 다시 계산해주세요.'
      });
    }

    // 업데이트
    const updated = await updateQuote(quoteId, {
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || null,
      memo: memo || null,
      status: QUOTE_STATUS.REQUESTED
    });

    // 이벤트 로깅
    await logEvent('QuoteRequested', quoteId, {
      customerName,
      customerPhone: customerPhone.slice(0, -4) + '****', // 마스킹
      isGroup: quote.is_group
    });

    // TODO: 알림 발송 (Phase 2)
    // - HOT 리드면 즉시 알림
    // - 단체면 영업팀 알림

    res.json({
      success: true,
      quoteId,
      status: QUOTE_STATUS.REQUESTED,
      message: quote.is_group
        ? '단체 문의가 접수되었습니다. 담당자가 곧 연락드리겠습니다.'
        : '예약 요청이 접수되었습니다. 확인 후 연락드리겠습니다.',
      nextStep: quote.is_group ? 'GROUP_INFO' : 'WAIT_CONFIRMATION'
    });

  } catch (error) {
    console.error('[Quote] 요청 오류:', error);
    res.status(500).json({
      success: false,
      error: 'REQUEST_ERROR',
      message: error.message
    });
  }
});

/**
 * POST /api/v2/quote/wix
 * Wix 폼 웹훅 - 새 리드(견적 요청) 생성
 *
 * Wix 폼 필드 매핑:
 *   - name / 이름 → customer_name
 *   - phone / 전화번호 → customer_phone
 *   - email / 이메일 → customer_email
 *   - travel_date / 여행일 → trip_start
 *   - pax / party_size / 인원 → guest_count
 *   - notes / special_request → notes
 */
router.post('/wix', async (req, res) => {
  const startTime = Date.now();

  try {
    const payload = req.body;

    // Quote ID 생성
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const quoteId = `WIX-${dateStr}-${random}`;

    console.log(`[Quote/Wix] 웹훅 수신: ${quoteId}`);

    // 필수 필드 검증
    const name = payload.name || payload['이름'];
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_NAME',
        message: '이름은 필수입니다'
      });
    }

    // 전화번호 정규화
    const rawPhone = payload.phone || payload['전화번호'] || '';
    const phone = rawPhone.replace(/[^0-9]/g, '') || null;

    // 환경 감지 (테스트 시그널)
    const testSignals = ['test', '테스트', 'TEST', 'dev'];
    const isTest = [name, payload.email, payload.notes].some(
      field => field && testSignals.some(sig => String(field).toLowerCase().includes(sig))
    ) || phone === '01000000000' || phone === '01012345678';
    const env = isTest ? 'test' : 'prod';

    // 데이터 정규화
    // source 필드: itinerary_builder에서 전달하면 사용, 아니면 'wix_form' 기본값
    const sourceValue = payload.source || 'wix_form';

    // must_go, avoid 필드가 있으면 notes에 병합
    let combinedNotes = payload.notes || payload.special_request || payload['요청사항'] || '';
    if (payload.must_go && Array.isArray(payload.must_go) && payload.must_go.length > 0) {
      combinedNotes += `\n[필수방문] ${payload.must_go.join(', ')}`;
    }
    if (payload.avoid && Array.isArray(payload.avoid) && payload.avoid.length > 0) {
      combinedNotes += `\n[회피] ${payload.avoid.join(', ')}`;
    }
    // 추가 정보 (빌더에서 전달)
    if (payload.party_type) combinedNotes += `\n[구성] ${payload.party_type}`;
    if (payload.transport) combinedNotes += `\n[이동] ${payload.transport}`;
    if (payload.tempo) combinedNotes += `\n[템포] ${payload.tempo}`;
    if (payload.nights !== undefined) combinedNotes += `\n[숙박] ${payload.nights}박`;

    const quoteData = {
      quote_id: quoteId,
      status: 'lead',
      customer_name: name.trim(),
      customer_phone: phone,
      customer_email: (payload.email || payload['이메일'] || '').trim() || null,
      trip_start: payload.travel_date || payload['여행일'] || payload.trip_start || null,
      trip_end: payload.trip_end || null,
      guest_count: parseInt(payload.pax || payload.party_size || payload['인원'] || 2, 10),
      notes: combinedNotes.trim() || null,
      source: sourceValue,
      env: env,
      region_code: payload.region || 'yeosu'
    };

    console.log(`[Quote/Wix] 리드 생성:`, {
      quote_id: quoteId,
      name: quoteData.customer_name,
      phone: phone ? phone.slice(0, 3) + '****' : null,
      pax: quoteData.guest_count,
      source: sourceValue,
      date: quoteData.trip_start,
      env
    });

    // DB 저장 (day_type, hotel_code는 NOT NULL이므로 기본값 설정)
    if (db) {
      try {
        await db.query(`
          INSERT INTO quotes (
            quote_id, status, customer_name, customer_phone, customer_email,
            travel_date, guest_count, memo, notes, region_code,
            source, env,
            day_type, hotel_code,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12,
            $13, $14,
            NOW(), NOW()
          )
        `, [
          quoteData.quote_id, quoteData.status,
          quoteData.customer_name, quoteData.customer_phone, quoteData.customer_email,
          quoteData.trip_start, quoteData.guest_count,
          quoteData.notes, quoteData.notes, quoteData.region_code,  // memo와 notes 모두 저장
          sourceValue, env,
          'pending', 'pending'  // Wix 리드용 기본값
        ]);
        console.log(`[Quote/Wix] DB 저장 완료: ${quoteId} (source=${sourceValue})`);
      } catch (dbErr) {
        console.error(`[Quote/Wix] DB 저장 실패:`, dbErr.message);
      }
    }

    // 메모리에도 저장
    memoryStore.quotes.set(quoteId, quoteData);

    // 이벤트 로깅
    await logEvent('WixLeadCreated', quoteId, {
      customer_name: quoteData.customer_name,
      guest_count: quoteData.guest_count,
      source: sourceValue,
      trip_start: quoteData.trip_start,
      env
    }, sourceValue === 'itinerary_builder' ? 'itinerary_builder' : 'wix_webhook');

    // 노션 Offline Ops Log 기록 (비동기, 실패해도 API 응답에 영향 없음)
    if (notionOps) {
      setImmediate(async () => {
        try {
          const notionResult = await notionOps.createOpsLog({
            quote_id: quoteId,
            customer_name: quoteData.customer_name,
            customer_phone: quoteData.customer_phone,
            source: sourceValue,
            type: 'quote',
            notes: quoteData.notes,
            trip_start: quoteData.trip_start,
            guest_count: quoteData.guest_count
          });
          if (notionResult.success) {
            console.log(`[Quote/Wix] 노션 기록 완료: ${quoteId}`);
          }
        } catch (notionErr) {
          console.warn(`[Quote/Wix] 노션 기록 실패:`, notionErr.message);
        }
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[Quote/Wix] 완료: ${quoteId} (${duration}ms)`);

    res.json({
      success: true,
      quote_id: quoteId,
      status: 'lead',
      source: sourceValue,
      pax: quoteData.guest_count,
      date: quoteData.trip_start,
      env,
      message: '견적 요청이 접수되었습니다'
    });

  } catch (error) {
    console.error('[Quote/Wix] 오류:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: '견적 요청 처리 중 오류가 발생했습니다'
    });
  }
});

/**
 * GET /api/v2/quote/health
 * 헬스체크 (/:quoteId 보다 먼저 정의해야 함)
 */
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    components: {
      engine: 'ok',
      database: db ? 'connected' : 'memory_mode',
      memoryQuotes: memoryStore.quotes.size,
      memoryEvents: memoryStore.events.length
    }
  };

  // DB 연결 테스트
  if (db) {
    try {
      await db.query('SELECT 1');
      health.components.database = 'connected';
    } catch (error) {
      health.components.database = 'error';
      health.status = 'degraded';
    }
  }

  res.json(health);
});

/**
 * GET /api/v2/quote/:quoteId
 * 견적 조회
 */
router.get('/:quoteId', async (req, res) => {
  try {
    const { quoteId } = req.params;

    const quote = await getQuote(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'QUOTE_NOT_FOUND',
        message: '견적을 찾을 수 없습니다'
      });
    }

    // 민감 정보 마스킹 (비관리자)
    const isAdmin = req.query.admin === 'true'; // 실제로는 인증 필요
    if (!isAdmin && quote.customer_phone) {
      quote.customer_phone = quote.customer_phone.slice(0, -4) + '****';
    }

    res.json({
      success: true,
      quote
    });

  } catch (error) {
    console.error('[Quote] 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'FETCH_ERROR',
      message: error.message
    });
  }
});

/**
 * POST /api/v2/quote/:quoteId/group-info
 * 단체 추가 정보 입력
 */
router.post('/:quoteId/group-info', async (req, res) => {
  try {
    const { quoteId } = req.params;
    const groupInfo = req.body;

    // 견적 조회
    const quote = await getQuote(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'QUOTE_NOT_FOUND',
        message: '견적을 찾을 수 없습니다'
      });
    }

    if (!quote.is_group) {
      return res.status(400).json({
        success: false,
        error: 'NOT_GROUP_QUOTE',
        message: '단체 견적이 아닙니다'
      });
    }

    // DB 저장
    if (db) {
      try {
        await db.query(
          `INSERT INTO group_inquiries (
            quote_id, group_name, group_type, contact_person,
            room_preference, meal_preference,
            departure_location, bus_required, arrival_time,
            budget_range, budget_per_person,
            special_requests, dietary_restrictions
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (quote_id) DO UPDATE SET
            group_name = EXCLUDED.group_name,
            group_type = EXCLUDED.group_type,
            contact_person = EXCLUDED.contact_person,
            room_preference = EXCLUDED.room_preference,
            meal_preference = EXCLUDED.meal_preference,
            departure_location = EXCLUDED.departure_location,
            bus_required = EXCLUDED.bus_required,
            arrival_time = EXCLUDED.arrival_time,
            budget_range = EXCLUDED.budget_range,
            budget_per_person = EXCLUDED.budget_per_person,
            special_requests = EXCLUDED.special_requests,
            dietary_restrictions = EXCLUDED.dietary_restrictions,
            updated_at = NOW()`,
          [
            quoteId,
            groupInfo.groupName,
            groupInfo.groupType,
            groupInfo.contactPerson,
            groupInfo.roomPreference,
            groupInfo.mealPreference,
            groupInfo.departureLocation,
            groupInfo.busRequired,
            groupInfo.arrivalTime,
            groupInfo.budgetRange,
            groupInfo.budgetPerPerson,
            groupInfo.specialRequests,
            groupInfo.dietaryRestrictions
          ]
        );
      } catch (error) {
        console.error('[Quote] 단체 정보 저장 실패:', error.message);
      }
    } else {
      memoryStore.groupInquiries.set(quoteId, {
        ...groupInfo,
        created_at: new Date().toISOString()
      });
    }

    // 이벤트 로깅
    await logEvent('GroupInfoSubmitted', quoteId, {
      groupName: groupInfo.groupName,
      groupType: groupInfo.groupType,
      guestCount: quote.guest_count
    });

    res.json({
      success: true,
      quoteId,
      message: '단체 정보가 저장되었습니다. 맞춤 견적을 준비하여 연락드리겠습니다.'
    });

  } catch (error) {
    console.error('[Quote] 단체 정보 오류:', error);
    res.status(500).json({
      success: false,
      error: 'GROUP_INFO_ERROR',
      message: error.message
    });
  }
});

/**
 * GET /api/v2/admin/quotes
 * 관리자: 견적 목록
 */
router.get('/admin/quotes', async (req, res) => {
  try {
    const { status, grade, limit = 50 } = req.query;

    let quotes = [];

    if (db) {
      try {
        let query = 'SELECT * FROM quotes';
        const conditions = [];
        const values = [];
        let paramIndex = 1;

        if (status) {
          conditions.push(`status = $${paramIndex}`);
          values.push(status);
          paramIndex++;
        }

        if (grade) {
          conditions.push(`lead_grade = $${paramIndex}`);
          values.push(grade);
          paramIndex++;
        }

        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
        values.push(parseInt(limit));

        const result = await db.query(query, values);
        quotes = result.rows;
      } catch (error) {
        console.error('[Quote] 목록 조회 실패:', error.message);
      }
    } else {
      quotes = Array.from(memoryStore.quotes.values())
        .filter(q => (!status || q.status === status) && (!grade || q.lead_grade === grade))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      count: quotes.length,
      quotes
    });

  } catch (error) {
    console.error('[Quote] 목록 오류:', error);
    res.status(500).json({
      success: false,
      error: 'LIST_ERROR',
      message: error.message
    });
  }
});

/**
 * GET /api/v2/admin/quotes/hot
 * 관리자: HOT 리드 목록
 */
router.get('/admin/quotes/hot', async (req, res) => {
  try {
    let quotes = [];

    if (db) {
      try {
        const result = await db.query('SELECT * FROM v_quotes_hot_leads LIMIT 20');
        quotes = result.rows;
      } catch (error) {
        // 뷰가 없을 수 있음
        const fallback = await db.query(
          `SELECT * FROM quotes
           WHERE lead_grade = 'hot'
             AND status IN ('calculated', 'requested')
           ORDER BY lead_score DESC, created_at DESC
           LIMIT 20`
        );
        quotes = fallback.rows;
      }
    } else {
      quotes = Array.from(memoryStore.quotes.values())
        .filter(q => q.lead_grade === 'hot' && ['calculated', 'requested'].includes(q.status))
        .sort((a, b) => b.lead_score - a.lead_score)
        .slice(0, 20);
    }

    res.json({
      success: true,
      count: quotes.length,
      quotes,
      message: quotes.length > 0 ? 'HOT 리드는 즉시 연락 필요!' : '현재 HOT 리드 없음'
    });

  } catch (error) {
    console.error('[Quote] HOT 리드 오류:', error);
    res.status(500).json({
      success: false,
      error: 'HOT_LEADS_ERROR',
      message: error.message
    });
  }
});

/**
 * POST /api/v2/admin/migrate
 * DB 마이그레이션 실행
 * Body: { migration: 'settlement' } - 특정 마이그레이션 실행
 */
router.post('/admin/migrate', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'NO_DATABASE',
        message: 'DB 연결이 없습니다'
      });
    }

    const fs = require('fs');
    const path = require('path');
    const { migration } = req.body;

    // 마이그레이션 파일 매핑
    const migrationFiles = {
      'default': '../database/quote_schema.sql',
      'deal-structuring': '../database/migrations/add_deal_structuring_fields.sql',
      'settlement': '../database/migrations/add_settlement_pdf_fields.sql',
      'payment': '../database/migrations/add_payment_fields.sql',
      'wix': '../database/migrations/add_wix_quote_fields.sql',
      'itinerary': '../database/migrations/add_itinerary_tables.sql'
    };

    const migrationKey = migration || 'default';
    const relativePath = migrationFiles[migrationKey];

    if (!relativePath) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_MIGRATION',
        message: `유효하지 않은 마이그레이션: ${migrationKey}`,
        available: Object.keys(migrationFiles)
      });
    }

    const schemaPath = path.join(__dirname, relativePath);
    if (!fs.existsSync(schemaPath)) {
      return res.status(404).json({
        success: false,
        error: 'SCHEMA_NOT_FOUND',
        message: `마이그레이션 파일을 찾을 수 없습니다: ${migrationKey}`
      });
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await db.query(schemaSql);

    // 컬럼 확인 (settlement 마이그레이션일 경우)
    let addedColumns = [];
    if (migrationKey === 'settlement') {
      const colCheck = await db.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'quotes'
          AND column_name IN ('settlement_pdf_generated', 'settlement_pdf_url', 'commission_rate', 'settlement_amount', 'agency_name')
      `);
      addedColumns = colCheck.rows;
    }

    // 테이블 확인
    const tableCheck = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND (table_name LIKE 'quotes' OR table_name LIKE 'quote_%' OR table_name LIKE 'group_%' OR table_name LIKE 'v_%')
      ORDER BY table_name
    `);

    res.json({
      success: true,
      message: `마이그레이션 완료: ${migrationKey}`,
      migration: migrationKey,
      tables: tableCheck.rows.map(r => r.table_name),
      addedColumns: addedColumns.length > 0 ? addedColumns : undefined
    });

  } catch (error) {
    console.error('[Quote] 마이그레이션 오류:', error);
    res.status(500).json({
      success: false,
      error: 'MIGRATION_ERROR',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 결제 관련 API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/v2/quote/:quoteId/payment-link
 * 결제 링크 생성
 */
router.post('/:quoteId/payment-link', async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { paymentType = 'deposit' } = req.body;  // deposit | full

    // 토스페이먼츠 서비스 체크
    if (!tossPayments) {
      return res.status(503).json({
        success: false,
        error: 'PAYMENT_SERVICE_UNAVAILABLE',
        message: '결제 서비스를 사용할 수 없습니다'
      });
    }

    // 견적 조회
    const quote = await getQuote(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'QUOTE_NOT_FOUND',
        message: '견적을 찾을 수 없습니다'
      });
    }

    // 만료 확인
    if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'QUOTE_EXPIRED',
        message: '견적이 만료되었습니다. 다시 계산해주세요.'
      });
    }

    // P2-3: 승인 전 결제 링크 생성 차단
    const allowedApprovalStatuses = ['approved', 'auto_approved'];
    if (quote.requires_approval && !allowedApprovalStatuses.includes(quote.approval_status)) {
      return res.status(400).json({
        success: false,
        error: 'APPROVAL_REQUIRED',
        message: `결제 링크 생성 전 승인이 필요합니다. 현재 상태: ${quote.approval_status || 'pending'}`,
        approval_status: quote.approval_status,
        next_step: quote.approval_status === 'ceo_approval' ? 'CEO 승인 대기 중' : '담당자 검토 대기 중'
      });
    }

    // 결제 금액 계산
    const totalAmount = quote.total_sell || 0;
    let paymentAmount = totalAmount;
    let orderNameSuffix = '';

    if (paymentType === 'deposit') {
      const depositInfo = tossPayments.calculateDeposit(totalAmount);
      paymentAmount = depositInfo.deposit;
      orderNameSuffix = ' (예약금)';
    }

    // 주문명 생성
    const hotelName = quote.hotel_name || '여수 여행';
    const guestCount = quote.guest_count || 2;
    const orderName = `${hotelName} ${guestCount}인${orderNameSuffix}`;

    // 결제 링크 생성
    const linkResult = await tossPayments.createPaymentLink({
      quoteId,
      amount: paymentAmount,
      orderName,
      customerName: quote.customer_name,
      customerPhone: quote.customer_phone,
      customerEmail: quote.customer_email,
      paymentType
    });

    if (!linkResult.success) {
      return res.status(400).json(linkResult);
    }

    // DB 업데이트
    if (db) {
      try {
        await db.query(
          `UPDATE quotes SET
            payment_link = $1,
            payment_link_id = $2,
            payment_order_id = $3,
            payment_amount = $4,
            payment_type = $5,
            payment_link_expires = $6,
            updated_at = NOW()
          WHERE quote_id = $7`,
          [
            linkResult.paymentLink,
            linkResult.paymentLinkId,
            linkResult.orderId,
            paymentAmount,
            paymentType,
            linkResult.expiredAt,
            quoteId
          ]
        );
      } catch (dbErr) {
        console.error('[Quote] 결제 링크 DB 저장 실패:', dbErr.message);
      }
    }

    // 이벤트 로깅
    await logEvent('PaymentLinkCreated', quoteId, {
      paymentLinkId: linkResult.paymentLinkId,
      amount: paymentAmount,
      paymentType,
      testMode: linkResult.testMode
    });

    res.json({
      success: true,
      quoteId,
      paymentLink: linkResult.paymentLink,
      paymentLinkId: linkResult.paymentLinkId,
      orderId: linkResult.orderId,
      amount: paymentAmount,
      totalAmount,
      paymentType,
      expiredAt: linkResult.expiredAt,
      testMode: linkResult.testMode || false,
      message: paymentType === 'deposit'
        ? `예약금 ${paymentAmount.toLocaleString()}원 결제 링크가 생성되었습니다`
        : `전액 ${paymentAmount.toLocaleString()}원 결제 링크가 생성되었습니다`
    });

  } catch (error) {
    console.error('[Quote] 결제 링크 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: 'PAYMENT_LINK_ERROR',
      message: error.message
    });
  }
});

/**
 * POST /api/v2/quote/webhook/payment
 * 토스페이먼츠 결제 완료 웹훅
 */
router.post('/webhook/payment', async (req, res) => {
  const startTime = Date.now();
  console.log('[Quote] 결제 웹훅 수신');

  try {
    const { paymentKey, orderId, amount, status } = req.body;

    // 필수값 검증
    if (!paymentKey || !orderId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    console.log(`[Quote] 결제 웹훅: orderId=${orderId}, status=${status}, amount=${amount}`);

    // orderId에서 quoteId 추출 시도 (PAY-YYYYMMDD-XXXX 형식)
    // 또는 DB에서 payment_order_id로 조회
    let quote = null;
    if (db) {
      try {
        const result = await db.query(
          'SELECT * FROM quotes WHERE payment_order_id = $1',
          [orderId]
        );
        if (result.rows.length > 0) {
          quote = result.rows[0];
        }
      } catch (dbErr) {
        console.error('[Quote] 웹훅 DB 조회 실패:', dbErr.message);
      }
    }

    // 결제 상태에 따른 처리
    if (status === 'DONE' || status === 'COMPLETED' || !status) {
      // 결제 승인 확인 (선택적)
      if (tossPayments && paymentKey) {
        const confirmResult = await tossPayments.confirmPayment({
          paymentKey,
          orderId,
          amount
        });

        if (!confirmResult.success) {
          console.error('[Quote] 결제 승인 실패:', confirmResult);
          // 승인 실패해도 웹훅은 200 반환 (재시도 방지)
        }
      }

      // DB 업데이트
      if (db && quote) {
        try {
          const newStatus = quote.payment_type === 'deposit' ? 'deposit_paid' : 'confirmed';
          await db.query(
            `UPDATE quotes SET
              status = $1,
              payment_key = $2,
              payment_status = 'paid',
              payment_approved_at = NOW(),
              updated_at = NOW()
            WHERE quote_id = $3`,
            [newStatus, paymentKey, quote.quote_id]
          );
        } catch (dbErr) {
          console.error('[Quote] 결제 상태 업데이트 실패:', dbErr.message);
        }
      }

      // 이벤트 로깅
      if (quote) {
        await logEvent('PaymentCompleted', quote.quote_id, {
          paymentKey,
          orderId,
          amount,
          status
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Quote] 결제 웹훅 처리 완료 (${duration}ms)`);

    res.json({
      success: true,
      message: '웹훅 처리 완료'
    });

  } catch (error) {
    console.error('[Quote] 결제 웹훅 오류:', error);
    // 웹훅은 항상 200 반환 (재시도 방지)
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/quote/payment/success
 * 결제 성공 콜백 페이지
 */
router.get('/payment/success', async (req, res) => {
  const { quoteId, paymentKey, orderId, amount, paymentType } = req.query;

  console.log(`[Quote] 결제 성공 콜백: quoteId=${quoteId}`);

  try {
    // 결제 승인
    if (tossPayments && paymentKey && orderId && amount) {
      const confirmResult = await tossPayments.confirmPayment({
        paymentKey,
        orderId,
        amount: parseInt(amount, 10)
      });

      if (confirmResult.success) {
        // DB 업데이트
        if (db) {
          try {
            const newStatus = paymentType === 'deposit' ? 'deposit_paid' : 'confirmed';
            await db.query(
              `UPDATE quotes SET
                status = $1,
                payment_key = $2,
                payment_status = 'paid',
                payment_approved_at = NOW(),
                updated_at = NOW()
              WHERE quote_id = $3`,
              [newStatus, paymentKey, quoteId]
            );
          } catch (dbErr) {
            console.error('[Quote] 결제 성공 DB 업데이트 실패:', dbErr.message);
          }
        }

        // 이벤트 로깅
        await logEvent('PaymentSuccess', quoteId, {
          paymentKey,
          orderId,
          amount,
          paymentType
        });
      }
    }

    // 성공 페이지로 리다이렉트 또는 JSON 응답
    if (req.accepts('html')) {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>결제 완료</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; }
            .success { color: #28a745; font-size: 48px; }
            h1 { color: #333; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="success">✓</div>
          <h1>결제가 완료되었습니다</h1>
          <p>견적번호: ${quoteId}</p>
          <p>결제금액: ${parseInt(amount || 0).toLocaleString()}원</p>
          <p>담당자가 곧 연락드리겠습니다.</p>
        </body>
        </html>
      `);
    } else {
      res.json({
        success: true,
        quoteId,
        paymentKey,
        amount: parseInt(amount, 10),
        message: '결제가 완료되었습니다'
      });
    }

  } catch (error) {
    console.error('[Quote] 결제 성공 콜백 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/quote/payment/fail
 * 결제 실패 콜백 페이지
 */
router.get('/payment/fail', async (req, res) => {
  const { quoteId, code, message } = req.query;

  console.log(`[Quote] 결제 실패 콜백: quoteId=${quoteId}, code=${code}`);

  // 이벤트 로깅
  if (quoteId) {
    await logEvent('PaymentFailed', quoteId, { code, message });
  }

  if (req.accepts('html')) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>결제 실패</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px; }
          .fail { color: #dc3545; font-size: 48px; }
          h1 { color: #333; }
          p { color: #666; }
          a { color: #007bff; }
        </style>
      </head>
      <body>
        <div class="fail">✗</div>
        <h1>결제가 실패했습니다</h1>
        <p>오류 코드: ${code || 'UNKNOWN'}</p>
        <p>${message || '다시 시도해주세요.'}</p>
        <p><a href="javascript:history.back()">뒤로 가기</a></p>
      </body>
      </html>
    `);
  } else {
    res.json({
      success: false,
      quoteId,
      error: code,
      message: message || '결제가 실패했습니다'
    });
  }
});

/**
 * GET /api/v2/quote/:quoteId/payment-status
 * 결제 상태 조회
 */
router.get('/:quoteId/payment-status', async (req, res) => {
  try {
    const { quoteId } = req.params;

    const quote = await getQuote(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'QUOTE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      quoteId,
      status: quote.status,
      paymentStatus: quote.payment_status || 'pending',
      paymentType: quote.payment_type,
      paymentAmount: quote.payment_amount,
      paymentLink: quote.payment_link,
      paymentLinkExpires: quote.payment_link_expires,
      paymentApprovedAt: quote.payment_approved_at
    });

  } catch (error) {
    console.error('[Quote] 결제 상태 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Deal Structuring API (P0)
// ═══════════════════════════════════════════════════════════════════════════

// Deal Structuring 서비스 로드
let dealStructuring = null;
try {
  dealStructuring = require('../services/dealStructuringService');
  console.log('[Quote] Deal Structuring 서비스 로드 완료');
} catch (error) {
  console.warn('[Quote] Deal Structuring 서비스 로드 실패:', error.message);
}

// PDF 생성 서비스 로드 (P2-1)
let quotePdfService = null;
try {
  quotePdfService = require('../services/quotePdfService');
  console.log('[Quote] PDF 서비스 로드 완료');
} catch (error) {
  console.warn('[Quote] PDF 서비스 로드 실패:', error.message);
}

/**
 * POST /api/v2/quote/:quoteId/deal-structuring
 * Deal Structuring 처리 (운영모드 결정 + 승인 워크플로우)
 */
router.post('/:quoteId/deal-structuring', async (req, res) => {
  try {
    const { quoteId } = req.params;
    const options = req.body;

    if (!dealStructuring) {
      return res.status(503).json({
        success: false,
        error: 'DEAL_STRUCTURING_UNAVAILABLE',
        message: 'Deal Structuring 서비스를 사용할 수 없습니다'
      });
    }

    // 견적 조회
    const quote = await getQuote(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'QUOTE_NOT_FOUND'
      });
    }

    // Deal Structuring 처리
    const result = dealStructuring.processDealStructuring({
      ...quote,
      ...options,  // 추가 옵션 (manual_mode, incentive_required 등)
      guest_count: options.guest_count ?? quote.guest_count,  // options 우선
      total_sell: options.total_sell ?? quote.total_sell       // options 우선
    });

    // DB 업데이트
    if (db) {
      try {
        await db.query(`
          UPDATE quotes SET
            operation_mode = $1,
            settlement_method = $2,
            tax_invoice_issuer = $3,
            payment_receiver = $4,
            contract_party = $5,
            refund_liability = $6,
            requires_approval = $7,
            approval_reasons = $8,
            approval_status = $9,
            incentive_required = $10,
            is_mice = $11,
            updated_at = NOW()
          WHERE quote_id = $12
        `, [
          result.operation_mode,
          result.settlement_method,
          result.tax_invoice_issuer,
          result.payment_receiver,
          result.contract_party,
          result.refund_liability,
          result.requires_approval,
          JSON.stringify(result.approval_reasons),
          result.approval_status,
          options.incentive_required || false,
          options.is_mice || false,
          quoteId
        ]);
      } catch (dbErr) {
        console.error('[Quote] Deal Structuring DB 업데이트 실패:', dbErr.message);
      }
    }

    // 이벤트 로깅
    await logEvent('DealStructuringProcessed', quoteId, {
      operation_mode: result.operation_mode,
      approval_status: result.approval_status,
      requires_approval: result.requires_approval
    });

    res.json({
      success: true,
      quoteId,
      ...result
    });

  } catch (error) {
    console.error('[Quote] Deal Structuring 오류:', error);
    res.status(500).json({
      success: false,
      error: 'DEAL_STRUCTURING_ERROR',
      message: error.message
    });
  }
});

/**
 * POST /api/v2/quote/:quoteId/approve
 * 견적 승인 처리
 */
router.post('/:quoteId/approve', async (req, res) => {
  try {
    const { quoteId } = req.params;
    const {
      approved_by,
      approval_note,    // 레거시 호환
      decision_note     // 루미 스펙 v1
    } = req.body;

    if (!approved_by) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_APPROVER',
        message: '승인자 정보가 필요합니다'
      });
    }

    // decision_note 우선, 없으면 approval_note 사용
    const note = decision_note || approval_note || null;

    // 견적 조회
    const quote = await getQuote(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'QUOTE_NOT_FOUND'
      });
    }

    // 승인 가능 상태 확인
    const approvableStatuses = ['pending', 'deal_review', 'ceo_approval'];
    if (!approvableStatuses.includes(quote.approval_status)) {
      return res.status(400).json({
        success: false,
        error: 'NOT_APPROVABLE',
        message: `현재 상태(${quote.approval_status})에서는 승인할 수 없습니다`
      });
    }

    // DB 업데이트
    if (db) {
      try {
        await db.query(`
          UPDATE quotes SET
            approval_status = 'approved',
            approved_by = $1,
            approved_at = NOW(),
            approval_note = $2,
            updated_at = NOW()
          WHERE quote_id = $3
        `, [approved_by, note, quoteId]);
      } catch (dbErr) {
        console.error('[Quote] 승인 DB 업데이트 실패:', dbErr.message);
      }
    }

    // 이벤트 로깅
    await logEvent('QuoteApproved', quoteId, {
      approved_by,
      decision: 'approve',
      decision_note: note,
      previous_status: quote.approval_status
    });

    res.json({
      success: true,
      quoteId,
      approval_status: 'approved',
      decision: 'approve',
      decision_note: note,
      approved_by,
      approved_at: new Date().toISOString(),
      message: '견적이 승인되었습니다. 이제 확정할 수 있습니다.'
    });

  } catch (error) {
    console.error('[Quote] 승인 오류:', error);
    res.status(500).json({
      success: false,
      error: 'APPROVAL_ERROR',
      message: error.message
    });
  }
});

/**
 * POST /api/v2/quote/:quoteId/reject
 * 견적 반려 처리 (루미 스펙 v1: decision_note + requested_changes)
 */
router.post('/:quoteId/reject', async (req, res) => {
  try {
    const { quoteId } = req.params;
    const {
      rejected_by,
      rejection_reason,    // 레거시 호환
      decision_note,       // 루미 스펙 v1
      requested_changes    // 루미 스펙 v1: 수정요청 항목 배열
    } = req.body;

    // decision_note 우선, 없으면 rejection_reason 사용
    const note = decision_note || rejection_reason;

    if (!rejected_by || !note) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: '반려자와 반려 사유(decision_note)가 필요합니다'
      });
    }

    // 견적 조회
    const quote = await getQuote(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'QUOTE_NOT_FOUND'
      });
    }

    // decision 타입 결정: 수정요청이 있으면 request_changes, 없으면 reject
    const decision = requested_changes && requested_changes.length > 0
      ? 'request_changes'
      : 'reject';

    // DB 업데이트
    if (db) {
      try {
        await db.query(`
          UPDATE quotes SET
            approval_status = 'rejected',
            approved_by = $1,
            approved_at = NOW(),
            approval_note = $2,
            updated_at = NOW()
          WHERE quote_id = $3
        `, [rejected_by, note, quoteId]);
      } catch (dbErr) {
        console.error('[Quote] 반려 DB 업데이트 실패:', dbErr.message);
      }
    }

    // 이벤트 로깅
    await logEvent('QuoteRejected', quoteId, {
      rejected_by,
      decision,
      decision_note: note,
      requested_changes: requested_changes || null
    });

    res.json({
      success: true,
      quoteId,
      approval_status: 'rejected',
      decision,
      decision_note: note,
      requested_changes: requested_changes || null,
      rejected_by,
      message: decision === 'request_changes'
        ? '수정 요청이 전달되었습니다.'
        : '견적이 반려되었습니다.'
    });

  } catch (error) {
    console.error('[Quote] 반려 오류:', error);
    res.status(500).json({
      success: false,
      error: 'REJECTION_ERROR',
      message: error.message
    });
  }
});

/**
 * POST /api/v2/quote/:quoteId/confirm
 * 견적 확정 처리
 */
router.post('/:quoteId/confirm', async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { confirmed_by } = req.body;

    if (!confirmed_by) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_CONFIRMER',
        message: '확정자 정보가 필요합니다'
      });
    }

    // 견적 조회
    const quote = await getQuote(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'QUOTE_NOT_FOUND'
      });
    }

    // 확정 가능 상태 확인
    const confirmableStatuses = ['approved', 'auto_approved'];
    if (quote.requires_approval && !confirmableStatuses.includes(quote.approval_status)) {
      return res.status(400).json({
        success: false,
        error: 'NOT_CONFIRMABLE',
        message: `승인이 필요합니다. 현재 상태: ${quote.approval_status}`
      });
    }

    // P2-1: 확정 견적 PDF 자동 생성
    let pdfResult = { success: false, pdfUrl: null };
    if (quotePdfService) {
      try {
        console.log(`[Quote/PDF] 확정 견적 PDF 생성 시작: ${quoteId}`);
        pdfResult = await quotePdfService.generateAndSaveConfirmedPdf(quote);
        if (pdfResult.success) {
          console.log(`[Quote/PDF] PDF 생성 완료: ${pdfResult.pdfUrl}`);
        }
      } catch (pdfErr) {
        console.error('[Quote/PDF] PDF 생성 실패:', pdfErr.message);
      }
    }

    // P2-2: 정산서 PDF 자동 생성 (commission 모드일 때만)
    let settlementPdfResult = { success: false, pdfUrl: null };
    if (quotePdfService && quote.operation_mode === 'commission') {
      try {
        console.log(`[Quote/PDF] 정산서 PDF 생성 시작: ${quoteId} (commission 모드)`);
        settlementPdfResult = await quotePdfService.generateAndSaveSettlementPdf(quote);
        if (settlementPdfResult.success) {
          console.log(`[Quote/PDF] 정산서 생성 완료: ${settlementPdfResult.pdfUrl}, 수수료: ${settlementPdfResult.settlementAmount?.toLocaleString()}원`);
        }
      } catch (settlementErr) {
        console.error('[Quote/PDF] 정산서 생성 실패:', settlementErr.message);
      }
    }

    // DB 업데이트 (PDF URL 포함 + P2-2 정산서)
    if (db) {
      try {
        await db.query(`
          UPDATE quotes SET
            status = 'confirmed',
            quote_type = 'confirmed',
            confirmed_at = NOW(),
            confirmed_by = $1,
            pdf_generated = $3,
            pdf_url = $4,
            pdf_generated_at = $5,
            settlement_pdf_generated = $6,
            settlement_pdf_url = $7,
            settlement_amount = $8,
            updated_at = NOW()
          WHERE quote_id = $2
        `, [
          confirmed_by,
          quoteId,
          pdfResult.success,
          pdfResult.pdfUrl,
          pdfResult.success ? new Date() : null,
          settlementPdfResult.success,
          settlementPdfResult.pdfUrl,
          settlementPdfResult.settlementAmount || null
        ]);
      } catch (dbErr) {
        console.error('[Quote] 확정 DB 업데이트 실패:', dbErr.message);
      }
    }

    // 이벤트 로깅
    await logEvent('QuoteConfirmed', quoteId, {
      confirmed_by,
      operation_mode: quote.operation_mode,
      total_sell: quote.total_sell,
      pdf_generated: pdfResult.success,
      pdf_url: pdfResult.pdfUrl,
      // P2-2: 정산서 정보
      settlement_pdf_generated: settlementPdfResult.success,
      settlement_pdf_url: settlementPdfResult.pdfUrl,
      settlement_amount: settlementPdfResult.settlementAmount,
      commission_rate: settlementPdfResult.commissionRate
    });

    // 담당자 알림 카드 생성
    const summaryCard = dealStructuring?.generateSummaryCard({
      operation_mode: quote.operation_mode,
      settlement_method: quote.settlement_method,
      tax_invoice_issuer: quote.tax_invoice_issuer,
      payment_receiver: quote.payment_receiver,
      contract_party: quote.contract_party,
      refund_liability: quote.refund_liability,
      guest_count: quote.guest_count,
      total_sell: quote.total_sell,
      approval_status: 'confirmed'
    });

    // 메시지 생성
    let confirmMessage = '견적이 확정되었습니다.';
    if (pdfResult.success && settlementPdfResult.success) {
      confirmMessage = '견적이 확정되었습니다. 확정 견적서 + 정산서가 생성되었습니다.';
    } else if (pdfResult.success) {
      confirmMessage = '견적이 확정되었습니다. PDF가 생성되었습니다.';
    }

    res.json({
      success: true,
      quoteId,
      status: 'confirmed',
      quote_type: 'confirmed',
      confirmed_by,
      confirmed_at: new Date().toISOString(),
      // P2-1: 확정 견적서 PDF 정보
      pdf_generated: pdfResult.success,
      pdf_url: pdfResult.pdfUrl,
      pdf_generated_at: pdfResult.pdfGeneratedAt,
      // P2-2: 정산서 PDF 정보 (commission 모드)
      settlement_pdf_generated: settlementPdfResult.success,
      settlement_pdf_url: settlementPdfResult.pdfUrl,
      settlement_amount: settlementPdfResult.settlementAmount,
      commission_rate: settlementPdfResult.commissionRate,
      summary_card: summaryCard,
      message: confirmMessage,
      next_steps: [
        pdfResult.success ? `확정 견적서를 고객에게 발송하세요: ${pdfResult.pdfUrl}` : '고객에게 확정 견적서를 발송하세요.',
        '결제 링크를 생성하세요.',
        settlementPdfResult.success ? `파트너사에 정산서를 발송하세요: ${settlementPdfResult.pdfUrl}` : null,
        quote.operation_mode !== 'direct' && !settlementPdfResult.success ? '여행사 정산을 준비하세요.' : null
      ].filter(Boolean)
    });

  } catch (error) {
    console.error('[Quote] 확정 오류:', error);
    res.status(500).json({
      success: false,
      error: 'CONFIRMATION_ERROR',
      message: error.message
    });
  }
});

/**
 * POST /api/v2/quote/:quoteId/settlement-pdf
 * P2-2: 정산서 PDF 수동 생성 (commission 모드가 아닌 경우에도 생성 가능)
 */
router.post('/:quoteId/settlement-pdf', async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { commission_rate, agency_name, agency_contact, bank_name, bank_account_number, bank_account_holder } = req.body;

    // 견적 조회
    const quote = await getQuote(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'QUOTE_NOT_FOUND'
      });
    }

    // PDF 서비스 확인
    if (!quotePdfService) {
      return res.status(503).json({
        success: false,
        error: 'PDF_SERVICE_UNAVAILABLE',
        message: 'PDF 서비스를 사용할 수 없습니다.'
      });
    }

    // 커스텀 옵션 병합
    const quoteWithOptions = {
      ...quote,
      commission_rate: commission_rate || quote.commission_rate || 10,
      agency_name: agency_name || quote.agency_name,
      agency_contact: agency_contact || quote.agency_contact
    };

    const pdfOptions = {};
    if (bank_name) pdfOptions.bankName = bank_name;
    if (bank_account_number) pdfOptions.bankAccountNumber = bank_account_number;
    if (bank_account_holder) pdfOptions.bankAccountHolder = bank_account_holder;

    console.log(`[Quote/PDF] 정산서 수동 생성 시작: ${quoteId}`);
    const result = await quotePdfService.generateAndSaveSettlementPdf(quoteWithOptions, pdfOptions);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'PDF_GENERATION_FAILED',
        message: result.error
      });
    }

    // DB 업데이트
    if (db) {
      try {
        await db.query(`
          UPDATE quotes SET
            settlement_pdf_generated = TRUE,
            settlement_pdf_url = $1,
            settlement_amount = $2,
            commission_rate = $3,
            updated_at = NOW()
          WHERE quote_id = $4
        `, [result.pdfUrl, result.settlementAmount, result.commissionRate, quoteId]);
      } catch (dbErr) {
        console.warn('[Quote] 정산서 PDF DB 업데이트 실패:', dbErr.message);
      }
    }

    // 이벤트 로깅
    await logEvent('SettlementPdfGenerated', quoteId, {
      settlement_amount: result.settlementAmount,
      commission_rate: result.commissionRate,
      pdf_url: result.pdfUrl
    });

    res.json({
      success: true,
      quoteId,
      settlement_pdf_url: result.pdfUrl,
      settlement_amount: result.settlementAmount,
      commission_rate: result.commissionRate,
      generated_at: result.pdfGeneratedAt,
      message: `정산서가 생성되었습니다. 수수료: ${result.settlementAmount?.toLocaleString()}원 (${result.commissionRate}%)`
    });

  } catch (error) {
    console.error('[Quote] 정산서 PDF 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: 'SETTLEMENT_PDF_ERROR',
      message: error.message
    });
  }
});

/**
 * GET /api/v2/admin/quotes/pending-approval
 * 승인 대기 목록 조회
 */
router.get('/admin/quotes/pending-approval', async (req, res) => {
  try {
    let quotes = [];

    if (db) {
      try {
        const result = await db.query('SELECT * FROM v_quotes_pending_approval LIMIT 50');
        quotes = result.rows;
      } catch (viewErr) {
        // 뷰가 없으면 직접 쿼리
        const fallback = await db.query(`
          SELECT * FROM quotes
          WHERE requires_approval = TRUE
            AND approval_status IN ('pending', 'deal_review', 'ceo_approval')
          ORDER BY created_at DESC
          LIMIT 50
        `);
        quotes = fallback.rows;
      }
    }

    res.json({
      success: true,
      count: quotes.length,
      quotes,
      message: quotes.length > 0
        ? `${quotes.length}건의 승인 대기 견적이 있습니다.`
        : '승인 대기 중인 견적이 없습니다.'
    });

  } catch (error) {
    console.error('[Quote] 승인 대기 목록 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/admin/quotes/by-mode
 * 운영모드별 현황 조회
 */
router.get('/admin/quotes/by-mode', async (req, res) => {
  try {
    let stats = [];

    if (db) {
      try {
        const result = await db.query('SELECT * FROM v_quotes_by_operation_mode');
        stats = result.rows;
      } catch (viewErr) {
        // 뷰가 없으면 직접 쿼리
        const fallback = await db.query(`
          SELECT
            operation_mode,
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
            SUM(total_sell) as total_revenue,
            SUM(total_margin) as total_margin
          FROM quotes
          WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY operation_mode
          ORDER BY total_count DESC
        `);
        stats = fallback.rows;
      }
    }

    res.json({
      success: true,
      stats,
      period: 'last_30_days'
    });

  } catch (error) {
    console.error('[Quote] 운영모드별 현황 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v2/quote/:quoteId/incentive-flags
 * 인센티브 플래그 생성 (P1)
 */
router.post('/:quoteId/incentive-flags', async (req, res) => {
  try {
    const { quoteId } = req.params;

    if (!dealStructuring) {
      return res.status(503).json({
        success: false,
        error: 'SERVICE_UNAVAILABLE'
      });
    }

    // 견적 조회
    const quote = await getQuote(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'QUOTE_NOT_FOUND'
      });
    }

    // 인센티브 플래그 생성
    const flags = dealStructuring.generateIncentiveFlags({
      travel_date: quote.travel_date,
      incentive_type: req.body.incentive_type || 'group_tour'
    });

    // DB 업데이트
    if (db) {
      try {
        await db.query(`
          UPDATE quotes SET
            incentive_required = TRUE,
            incentive_applicant = $1,
            required_documents = $2,
            deadline_flags = $3,
            updated_at = NOW()
          WHERE quote_id = $4
        `, [
          flags.applicant_recommendation,
          JSON.stringify(flags.documents),
          JSON.stringify(flags.deadlines),
          quoteId
        ]);
      } catch (dbErr) {
        console.error('[Quote] 인센티브 플래그 DB 업데이트 실패:', dbErr.message);
      }
    }

    res.json({
      success: true,
      quoteId,
      ...flags
    });

  } catch (error) {
    console.error('[Quote] 인센티브 플래그 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
