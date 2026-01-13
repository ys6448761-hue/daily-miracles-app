/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Itinerary Routes - 4인 이하 자동 일정 생성 API
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 루미 분석 기반 P0 Flow:
 *   /quote → 결제 → /success → /itinerary-builder → /itinerary-result (+PDF)
 *
 * 이벤트 로깅:
 *   - Itinerary_Start
 *   - Itinerary_Form_Submit
 *   - PDF_Download
 *   - Edit_Request_Click
 *
 * 작성일: 2026-01-13
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();

// 서비스 로드
let itineraryService = null;
try {
  itineraryService = require('../services/itineraryService');
  console.log('[Itinerary] 서비스 로드 완료');
} catch (error) {
  console.warn('[Itinerary] 서비스 로드 실패:', error.message);
}

// DB 연결
let db = null;
try {
  const { Pool } = require('pg');
  if (process.env.DATABASE_URL) {
    db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
} catch (err) {
  console.warn('[Itinerary] DB 연결 실패:', err.message);
}

// 메모리 저장소
const itineraryStore = new Map();

// ═══════════════════════════════════════════════════════════════════════════
// 이벤트 로깅
// ═══════════════════════════════════════════════════════════════════════════

async function logEvent(eventName, itineraryId, data = {}) {
  console.log(`[Event] ${eventName}:`, itineraryId, JSON.stringify(data).slice(0, 200));

  if (db) {
    try {
      await db.query(`
        INSERT INTO itinerary_events (itinerary_id, event_name, event_data, created_at)
        VALUES ($1, $2, $3, NOW())
      `, [itineraryId, eventName, JSON.stringify(data)]);
    } catch (err) {
      // 테이블이 없으면 무시
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// API 엔드포인트
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v2/itinerary/options
 * 일정 빌더 옵션 조회 (드롭다운/슬라이더 데이터)
 */
router.get('/options', (req, res) => {
  if (!itineraryService) {
    return res.status(503).json({
      success: false,
      error: 'SERVICE_UNAVAILABLE'
    });
  }

  res.json({
    success: true,
    options: {
      travel_styles: itineraryService.TRAVEL_STYLES,
      transport_modes: itineraryService.TRANSPORT_MODES,
      stay_types: itineraryService.STAY_TYPES,
      tempo_levels: itineraryService.TEMPO_LEVELS,
      yeosu_spots: itineraryService.YEOSU_SPOTS
    }
  });
});

/**
 * POST /api/v2/itinerary/generate
 * 일정 생성 (AI + PDF)
 *
 * Body:
 *   - startDate: 여행 시작일 (required)
 *   - endDate: 여행 종료일
 *   - pax: 인원 (1-4)
 *   - partyType: adults | family | couple | friends
 *   - transport: car | public | rental
 *   - stayType: day | 1n2d | 2n3d | 3n4d
 *   - stylePreferences: { healing, foodie, activity, photo, budget } (합계 100)
 *   - mustVisit: ["장소1", "장소2"]
 *   - avoid: ["걷기많음", "언덕", ...]
 *   - tempo: relaxed | normal | packed
 *   - quoteId: 연결할 견적 ID (optional)
 */
router.post('/generate', async (req, res) => {
  try {
    if (!itineraryService) {
      return res.status(503).json({
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: '일정 생성 서비스를 사용할 수 없습니다.'
      });
    }

    const options = req.body;

    // 인원 제한 (4인 이하만)
    const pax = parseInt(options.pax) || 2;
    if (pax > 4) {
      return res.status(400).json({
        success: false,
        error: 'PAX_LIMIT_EXCEEDED',
        message: '5인 이상은 단체 상담이 필요합니다.',
        next_step: 'GROUP_CONSULTATION',
        kakao_link: 'https://pf.kakao.com/_dailymiracles'
      });
    }

    // 필수 필드 검증
    if (!options.startDate) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_START_DATE',
        message: '여행 시작일을 선택해주세요.'
      });
    }

    // 이벤트: 생성 시작
    const tempId = `TEMP-${Date.now()}`;
    await logEvent('Itinerary_Form_Submit', tempId, {
      pax,
      stay_type: options.stayType,
      transport: options.transport,
      style_preferences: options.stylePreferences
    });

    // 일정 생성
    const result = await itineraryService.generateAndSaveItinerary({
      ...options,
      pax,
      region: options.region || 'yeosu'
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'GENERATION_FAILED',
        message: result.error
      });
    }

    // 메모리에 저장
    itineraryStore.set(result.itinerary.id, result.itinerary);

    // DB에 저장
    if (db) {
      try {
        await db.query(`
          INSERT INTO itineraries (
            itinerary_id, quote_id, region, pax, stay_type, transport,
            style_preferences, must_visit, avoid, tempo,
            daily_plans, recommendations, pdf_url,
            status, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()
          )
        `, [
          result.itinerary.id,
          result.itinerary.quote_id,
          result.itinerary.region,
          result.itinerary.trip_info.pax,
          result.itinerary.trip_info.days > 1 ? `${result.itinerary.trip_info.nights}n${result.itinerary.trip_info.days}d` : 'day',
          result.itinerary.trip_info.transport,
          JSON.stringify(result.itinerary.style_preferences),
          JSON.stringify(result.itinerary.must_visit),
          JSON.stringify(result.itinerary.avoid),
          result.itinerary.trip_info.tempo,
          JSON.stringify(result.itinerary.daily_plans),
          JSON.stringify(result.itinerary.recommendations),
          result.pdfUrl,
          'generated'
        ]);
      } catch (dbErr) {
        console.warn('[Itinerary] DB 저장 실패:', dbErr.message);
      }
    }

    // 이벤트: 생성 완료
    await logEvent('Itinerary_Generated', result.itinerary.id, {
      pax,
      days: result.itinerary.trip_info.days,
      pdf_url: result.pdfUrl
    });

    res.json({
      success: true,
      itinerary_id: result.itinerary.id,
      pdf_url: result.pdfUrl,
      trip_summary: {
        region: result.itinerary.region,
        days: result.itinerary.trip_info.days,
        nights: result.itinerary.trip_info.nights,
        pax: result.itinerary.trip_info.pax
      },
      daily_plans: result.itinerary.daily_plans,
      recommendations: result.itinerary.recommendations,
      message: '여행 일정이 완성되었습니다! PDF를 다운로드하세요.',
      actions: [
        { type: 'pdf_download', label: 'PDF 다운로드', url: result.pdfUrl },
        { type: 'edit', label: '간단 수정 (무료 1회)', endpoint: `/api/v2/itinerary/${result.itinerary.id}/edit` }
      ]
    });

  } catch (error) {
    console.error('[Itinerary] 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: 'GENERATION_ERROR',
      message: error.message
    });
  }
});

/**
 * GET /api/v2/itinerary/:id
 * 일정 조회
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 메모리에서 먼저 조회
    let itinerary = itineraryStore.get(id);

    // DB에서 조회
    if (!itinerary && db) {
      try {
        const result = await db.query('SELECT * FROM itineraries WHERE itinerary_id = $1', [id]);
        if (result.rows.length > 0) {
          const row = result.rows[0];
          itinerary = {
            id: row.itinerary_id,
            quote_id: row.quote_id,
            region: row.region,
            trip_info: {
              pax: row.pax,
              transport: row.transport,
              tempo: row.tempo
            },
            style_preferences: row.style_preferences,
            must_visit: row.must_visit,
            avoid: row.avoid,
            daily_plans: row.daily_plans,
            recommendations: row.recommendations,
            pdf_url: row.pdf_url,
            status: row.status,
            created_at: row.created_at
          };
        }
      } catch (dbErr) {
        console.warn('[Itinerary] DB 조회 실패:', dbErr.message);
      }
    }

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: '일정을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      itinerary
    });

  } catch (error) {
    console.error('[Itinerary] 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/itinerary/:id/pdf
 * PDF 다운로드 (이벤트 로깅)
 */
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;

    // 일정 조회
    let itinerary = itineraryStore.get(id);
    if (!itinerary && db) {
      const result = await db.query('SELECT pdf_url FROM itineraries WHERE itinerary_id = $1', [id]);
      if (result.rows.length > 0) {
        itinerary = { pdf_url: result.rows[0].pdf_url };
      }
    }

    if (!itinerary || !itinerary.pdf_url) {
      return res.status(404).json({
        success: false,
        error: 'PDF_NOT_FOUND'
      });
    }

    // 이벤트: PDF 다운로드
    await logEvent('PDF_Download', id, { pdf_url: itinerary.pdf_url });

    // 리다이렉트
    res.redirect(itinerary.pdf_url);

  } catch (error) {
    console.error('[Itinerary] PDF 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v2/itinerary/:id/edit
 * 간단 수정 요청 (무료 1회)
 */
router.post('/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    const { changes } = req.body;

    // 일정 조회
    let itinerary = itineraryStore.get(id);
    if (!itinerary) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND'
      });
    }

    // 수정 횟수 확인
    if (itinerary.edit_count >= 1) {
      return res.status(400).json({
        success: false,
        error: 'EDIT_LIMIT_REACHED',
        message: '무료 수정은 1회까지 가능합니다. 추가 수정은 상담을 신청해주세요.',
        kakao_link: 'https://pf.kakao.com/_dailymiracles'
      });
    }

    // 이벤트: 수정 요청
    await logEvent('Edit_Request_Click', id, { changes });

    // TODO: AI로 수정된 일정 재생성
    // 현재는 수정 요청만 기록

    // 수정 횟수 증가
    itinerary.edit_count = (itinerary.edit_count || 0) + 1;
    itinerary.edit_requests = itinerary.edit_requests || [];
    itinerary.edit_requests.push({
      changes,
      requested_at: new Date().toISOString()
    });

    itineraryStore.set(id, itinerary);

    res.json({
      success: true,
      message: '수정 요청이 접수되었습니다. 잠시 후 새 일정이 생성됩니다.',
      edit_count: itinerary.edit_count,
      remaining_edits: Math.max(0, 1 - itinerary.edit_count)
    });

  } catch (error) {
    console.error('[Itinerary] 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v2/itinerary/:id/regenerate
 * 일정 재생성 (PDF 포함)
 */
router.post('/:id/regenerate', async (req, res) => {
  try {
    const { id } = req.params;

    // 기존 일정 조회
    let existingItinerary = itineraryStore.get(id);
    if (!existingItinerary) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND'
      });
    }

    if (!itineraryService) {
      return res.status(503).json({
        success: false,
        error: 'SERVICE_UNAVAILABLE'
      });
    }

    // 기존 옵션으로 재생성
    const result = await itineraryService.generateAndSaveItinerary({
      startDate: existingItinerary.trip_info?.start_date,
      pax: existingItinerary.trip_info?.pax,
      transport: existingItinerary.trip_info?.transport,
      stayType: existingItinerary.trip_info?.nights ? `${existingItinerary.trip_info.nights}n${existingItinerary.trip_info.days}d` : 'day',
      stylePreferences: existingItinerary.style_preferences,
      mustVisit: existingItinerary.must_visit,
      avoid: existingItinerary.avoid,
      tempo: existingItinerary.trip_info?.tempo,
      region: existingItinerary.region,
      quoteId: existingItinerary.quote_id
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'REGENERATION_FAILED',
        message: result.error
      });
    }

    // 버전 업
    result.itinerary.version = (existingItinerary.version || 1) + 1;
    result.itinerary.previous_id = id;

    // 저장
    itineraryStore.set(result.itinerary.id, result.itinerary);

    res.json({
      success: true,
      itinerary_id: result.itinerary.id,
      pdf_url: result.pdfUrl,
      version: result.itinerary.version,
      message: '일정이 재생성되었습니다.'
    });

  } catch (error) {
    console.error('[Itinerary] 재생성 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
