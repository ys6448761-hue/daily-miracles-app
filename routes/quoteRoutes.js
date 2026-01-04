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

// DB 모듈 (선택적 로딩)
let db = null;
try {
  db = require('../database/db');
} catch (error) {
  console.warn('[Quote] DB 모듈 로드 실패 - 메모리 모드로 동작');
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

    const schemaPath = path.join(__dirname, '../database/quote_schema.sql');
    if (!fs.existsSync(schemaPath)) {
      return res.status(404).json({
        success: false,
        error: 'SCHEMA_NOT_FOUND',
        message: '스키마 파일을 찾을 수 없습니다'
      });
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await db.query(schemaSql);

    // 테이블 확인
    const tableCheck = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND (table_name LIKE 'quotes' OR table_name LIKE 'quote_%' OR table_name LIKE 'group_%')
      ORDER BY table_name
    `);

    res.json({
      success: true,
      message: '마이그레이션 완료',
      tables: tableCheck.rows.map(r => r.table_name)
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

module.exports = router;
