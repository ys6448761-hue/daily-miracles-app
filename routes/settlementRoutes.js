/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 정산 API 라우터
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 엔드포인트:
 * - POST   /api/settlement/events           - 정산 이벤트 생성
 * - GET    /api/settlement/events/:id       - 이벤트 조회
 * - GET    /api/settlement/creators/:id     - 크리에이터 정산 요약
 * - GET    /api/settlement/creators/:id/history - 크리에이터 정산 내역
 * - POST   /api/settlement/batches          - 지급 배치 생성
 * - POST   /api/settlement/batches/:id/confirm - 배치 확정
 * - GET    /api/settlement/batches/:id      - 배치 조회
 * - GET    /api/settlement/stats            - 정산 통계
 * - GET    /api/settlement/constants        - 상수 조회
 */

const express = require('express');
const router = express.Router();

// 서비스 인스턴스 (server.js에서 주입)
let settlement = null;

// 유효 이벤트 타입
const VALID_EVENT_TYPES = ['PAYMENT', 'REFUND', 'CHARGEBACK', 'FEE_ADJUSTED'];

// 피처 토글 (점진적 ON: ingest → allocations → payout)
function getToggles() {
  return {
    ingest: process.env.SETTLEMENT_INGEST !== 'false',     // 이벤트 수신
    allocations: process.env.SETTLEMENT_ALLOC !== 'false',  // 풀 배분 저장
    payout: process.env.SETTLEMENT_PAYOUT !== 'false'       // 지급 배치
  };
}

// 합계불변성 알람 로깅
function checkInvariant(calculation, eventType, eventId) {
  const { balance_check, balance_diff } = calculation.validation;
  if (!balance_check) {
    console.error(`[SETTLEMENT-ALARM] balance_invariant_failed | event_id=${eventId} type=${eventType} diff=${balance_diff}`);
    return false;
  }
  return true;
}

/**
 * 서비스 초기화 (server.js에서 호출)
 */
router.init = function(services) {
  settlement = services.settlement;
  const toggles = getToggles();
  console.log(`[Settlement] 라우터 초기화 완료 (ingest=${toggles.ingest}, alloc=${toggles.allocations}, payout=${toggles.payout})`);
};

// ═══════════════════════════════════════════════════════════════════════════
// 정산 이벤트
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/settlement/events
 * 정산 이벤트 생성 (결제/환불/차지백)
 */
router.post('/events', async (req, res) => {
  try {
    if (!settlement) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    // 피처 토글: ingest OFF → 이벤트 수신 거부
    const toggles = getToggles();
    if (!toggles.ingest) {
      return res.status(503).json({ success: false, error: 'settlement_ingest_disabled' });
    }

    const {
      event_type,
      gross_amount,
      coupon_amount,
      template_id,
      artifact_id,
      creator_root_id,
      remix_chain,
      referrer_id,
      buyer_user_id,
      original_event_id,
      occurred_at
    } = req.body;

    if (!gross_amount) {
      return res.status(400).json({ success: false, error: 'gross_amount required' });
    }

    // 이벤트 타입 검증
    const validatedType = event_type || 'PAYMENT';
    if (!VALID_EVENT_TYPES.includes(validatedType)) {
      return res.status(400).json({
        success: false,
        error: 'invalid_event_type',
        valid_types: VALID_EVENT_TYPES
      });
    }

    // 역분개 이벤트는 original_event_id 필수
    if (['REFUND', 'CHARGEBACK', 'FEE_ADJUSTED'].includes(validatedType) && !original_event_id) {
      return res.status(400).json({
        success: false,
        error: 'original_event_id required for reversal events'
      });
    }

    // 계산
    const calculation = settlement.calculation.calculate({
      gross_amount,
      coupon_amount: coupon_amount || 0,
      remix_chain: remix_chain || [],
      referrer_id
    });

    // 검증 + 알람
    if (!checkInvariant(calculation, validatedType, 'pre-save')) {
      return res.status(500).json({
        success: false,
        error: 'balance_check_failed',
        validation: calculation.validation
      });
    }

    // 저장
    const result = await settlement.calculation.saveEvent({
      event_type: validatedType,
      template_id,
      artifact_id,
      creator_root_id,
      buyer_user_id,
      original_event_id,
      occurred_at
    }, calculation);

    // 풀 배분 저장 (allocations 토글)
    if (toggles.allocations) {
      // 크리에이터 몫 저장
      if (creator_root_id) {
        await settlement.distribution.saveCreatorShares(
          result.event_id,
          calculation,
          creator_root_id
        );
      }

      // 성장 풀 저장
      await settlement.distribution.saveGrowthShares(result.event_id, calculation);
    }

    // 리스크 풀 입금
    if (toggles.allocations && calculation.pools.risk > 0) {
      await settlement.distribution.depositToRiskPool(
        result.event_id,
        calculation.pools.risk,
        `${event_type || 'PAYMENT'} 리스크 풀 적립`
      );
    }

    res.status(201).json({
      success: true,
      event_id: result.event_id,
      calculation: {
        gross: calculation.input.gross_amount,
        paid: calculation.paid_amount,
        net_cash: calculation.net_cash,
        pools: calculation.pools,
        validation: calculation.validation
      }
    });

  } catch (error) {
    console.error('[Settlement] 이벤트 생성 실패:', error);
    res.status(500).json({ success: false, error: 'server_error', message: error.message });
  }
});

/**
 * POST /api/settlement/events/reversal
 * 역분개 이벤트 생성 (환불/차지백/수수료조정)
 */
router.post('/events/reversal', async (req, res) => {
  try {
    if (!settlement) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const {
      event_type,
      original_event_id,
      reversal_amount,
      gross_amount,
      coupon_amount,
      remix_chain,
      referrer_id,
      creator_root_id,
      template_id,
      artifact_id,
      buyer_user_id,
      occurred_at
    } = req.body;

    // 필수 검증
    if (!original_event_id) {
      return res.status(400).json({ success: false, error: 'original_event_id required' });
    }
    if (!gross_amount) {
      return res.status(400).json({ success: false, error: 'gross_amount required' });
    }

    const validatedType = event_type || 'REFUND';
    if (!['REFUND', 'CHARGEBACK', 'FEE_ADJUSTED'].includes(validatedType)) {
      return res.status(400).json({
        success: false,
        error: 'invalid reversal event_type',
        valid_types: ['REFUND', 'CHARGEBACK', 'FEE_ADJUSTED']
      });
    }

    // 역분개 계산
    const originalEvent = {
      gross_amount,
      coupon_amount: coupon_amount || 0,
      remix_chain: remix_chain || [],
      referrer_id
    };
    const reversal = settlement.calculation.calculateReversal(originalEvent, reversal_amount || null);

    // 저장
    const result = await settlement.calculation.saveEvent({
      event_type: validatedType,
      template_id,
      artifact_id,
      creator_root_id,
      buyer_user_id,
      original_event_id,
      occurred_at
    }, reversal);

    // 크리에이터 역분개 몫 저장
    if (creator_root_id) {
      await settlement.distribution.saveCreatorShares(
        result.event_id,
        reversal,
        creator_root_id
      );
    }

    // 성장 풀 역분개 저장
    await settlement.distribution.saveGrowthShares(result.event_id, reversal);

    // 리스크 풀 출금 (역분개이므로 음수)
    if (reversal.pools.risk !== 0) {
      await settlement.distribution.depositToRiskPool(
        result.event_id,
        reversal.pools.risk,
        `${validatedType} 리스크 풀 차감`
      );
    }

    res.status(201).json({
      success: true,
      event_id: result.event_id,
      original_event_id,
      reversal_ratio: reversal.reversal_ratio,
      calculation: {
        paid: reversal.paid_amount,
        net_cash: reversal.net_cash,
        pools: reversal.pools
      }
    });

  } catch (error) {
    console.error('[Settlement] 역분개 생성 실패:', error);
    res.status(500).json({ success: false, error: 'server_error', message: error.message });
  }
});

/**
 * GET /api/settlement/events/:id
 * 정산 이벤트 조회
 */
router.get('/events/:id', async (req, res) => {
  try {
    if (!settlement) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const event = await settlement.calculation.getEvent(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, error: 'event_not_found' });
    }

    res.json({ success: true, data: event });

  } catch (error) {
    console.error('[Settlement] 이벤트 조회 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 크리에이터 정산
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/settlement/creators/:id
 * 크리에이터 정산 요약
 */
router.get('/creators/:id', async (req, res) => {
  try {
    if (!settlement) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const creatorId = parseInt(req.params.id);
    const summary = await settlement.distribution.getCreatorSummary(creatorId);

    if (!summary) {
      return res.status(404).json({ success: false, error: 'creator_not_found' });
    }

    res.json({ success: true, data: summary });

  } catch (error) {
    console.error('[Settlement] 크리에이터 요약 조회 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/**
 * GET /api/settlement/creators/:id/history
 * 크리에이터 정산 내역
 */
router.get('/creators/:id/history', async (req, res) => {
  try {
    if (!settlement) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const creatorId = parseInt(req.params.id);
    const { limit, offset, status } = req.query;

    const history = await settlement.distribution.getCreatorHistory(creatorId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      status
    });

    res.json({ success: true, data: history });

  } catch (error) {
    console.error('[Settlement] 크리에이터 내역 조회 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 지급 배치
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/settlement/batches
 * 지급 배치 생성
 */
router.post('/batches', async (req, res) => {
  try {
    if (!settlement) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    // payout 토글 체크
    if (!getToggles().payout) {
      return res.status(503).json({ success: false, error: 'settlement_payout_disabled' });
    }

    const { batch_date } = req.body;
    const batch = await settlement.payout.createPayoutBatch(batch_date);

    res.status(201).json({ success: true, data: batch });

  } catch (error) {
    console.error('[Settlement] 배치 생성 실패:', error);
    res.status(500).json({ success: false, error: 'server_error', message: error.message });
  }
});

/**
 * POST /api/settlement/batches/:id/confirm
 * 배치 확정
 */
router.post('/batches/:id/confirm', async (req, res) => {
  try {
    if (!settlement) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const batchId = parseInt(req.params.id);
    const result = await settlement.payout.confirmBatch(batchId);

    res.json({ success: true, data: result });

  } catch (error) {
    console.error('[Settlement] 배치 확정 실패:', error);
    res.status(500).json({ success: false, error: 'server_error', message: error.message });
  }
});

/**
 * GET /api/settlement/batches/:id
 * 배치 조회
 */
router.get('/batches/:id', async (req, res) => {
  try {
    if (!settlement) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const batchId = parseInt(req.params.id);
    const batch = await settlement.payout.getBatch(batchId);

    if (!batch) {
      return res.status(404).json({ success: false, error: 'batch_not_found' });
    }

    res.json({ success: true, data: batch });

  } catch (error) {
    console.error('[Settlement] 배치 조회 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/**
 * GET /api/settlement/batches
 * 배치 목록
 */
router.get('/batches', async (req, res) => {
  try {
    if (!settlement) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const { limit, offset, status } = req.query;
    const batches = await settlement.payout.listBatches({
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
      status
    });

    res.json({ success: true, data: batches });

  } catch (error) {
    console.error('[Settlement] 배치 목록 조회 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 통계/상수
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/settlement/stats
 * 정산 통계
 */
router.get('/stats', async (req, res) => {
  try {
    if (!settlement) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const payoutStats = await settlement.payout.getPayoutStats();
    const riskPoolBalance = await settlement.distribution.getRiskPoolBalance();

    res.json({
      success: true,
      data: {
        payout: payoutStats,
        risk_pool_balance: riskPoolBalance
      }
    });

  } catch (error) {
    console.error('[Settlement] 통계 조회 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/**
 * GET /api/settlement/constants
 * 정산 상수 조회
 */
router.get('/constants', async (req, res) => {
  try {
    if (!settlement) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const constants = settlement.constants.getAll();
    res.json({ success: true, data: constants });

  } catch (error) {
    console.error('[Settlement] 상수 조회 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/**
 * POST /api/settlement/calculate
 * 정산 시뮬레이션 (저장 없이 계산만)
 */
router.post('/calculate', async (req, res) => {
  try {
    if (!settlement) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const { gross_amount, coupon_amount, remix_chain, referrer_id } = req.body;

    if (!gross_amount) {
      return res.status(400).json({ success: false, error: 'gross_amount required' });
    }

    const calculation = settlement.calculation.calculate({
      gross_amount,
      coupon_amount: coupon_amount || 0,
      remix_chain: remix_chain || [],
      referrer_id
    });

    res.json({ success: true, data: calculation });

  } catch (error) {
    console.error('[Settlement] 계산 실패:', error);
    res.status(500).json({ success: false, error: 'server_error', message: error.message });
  }
});

/**
 * POST /api/settlement/release-held
 * Hold 해제 (관리자용)
 */
router.post('/release-held', async (req, res) => {
  try {
    if (!settlement) {
      return res.status(503).json({ success: false, error: 'service_unavailable' });
    }

    const result = await settlement.distribution.releaseHeldShares();
    res.json({ success: true, data: result });

  } catch (error) {
    console.error('[Settlement] Hold 해제 실패:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/**
 * GET /api/settlement/toggles
 * 피처 토글 상태 조회 (운영용)
 */
router.get('/toggles', (_req, res) => {
  res.json({
    success: true,
    data: getToggles(),
    rollback_instructions: {
      step1: 'SETTLEMENT_INGEST=false → 이벤트 수신 중단',
      step2: 'SETTLEMENT_ALLOC=false → 풀 배분 중단',
      step3: 'SETTLEMENT_PAYOUT=false → 지급 배치 중단',
      step4: '원인 PR revert 후 재배포'
    }
  });
});

module.exports = router;
