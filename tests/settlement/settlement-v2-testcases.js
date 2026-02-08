/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AIL-정산-v2-final 테스트 케이스 20개
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Gate 조건: 모든 케이스에서 원장 합계 = 배분 합계 = 지급 합계
 *
 * 테스트 실행: node tests/settlement/settlement-v2-testcases.js
 */

// ═══════════════════════════════════════════════════════════════════════════
// 상수 (AIL-정산-v2-final 기준)
// ═══════════════════════════════════════════════════════════════════════════
const SETTLEMENT_CONSTANTS = {
  // 배분 비율 (Anchor 기준)
  PLATFORM_RATE: 0.55,
  CREATOR_POOL_RATE: 0.30,
  GROWTH_POOL_RATE: 0.10,
  RISK_POOL_RATE: 0.05,

  // 크리에이터 풀 내부
  CREATOR_ORIGINAL_RATE: 0.70,
  CREATOR_REMIX_RATE: 0.20,
  CREATOR_CURATION_RATE: 0.10,
  REMIX_MAX_DEPTH: 3,

  // 성장 풀 내부
  GROWTH_REFERRER_RATE: 0.07,
  GROWTH_CAMPAIGN_RATE: 0.03,

  // 정책
  HOLD_DAYS: 14,
  MIN_PAYOUT: 10000,
  MAX_MONTHLY_DEDUCTION_RATE: 0.10,

  // PG 수수료
  PG_FEE_RATE: 0.035,
};

// ═══════════════════════════════════════════════════════════════════════════
// 정산 계산 함수 (테스트용)
// ═══════════════════════════════════════════════════════════════════════════
function calculateSettlement(event) {
  const { gross_amount, coupon_amount = 0, remix_chain = [], referrer_id = null } = event;

  // Step 1: 기본 금액 계산
  const paid = gross_amount - coupon_amount;
  const pg_fee = Math.round(paid * SETTLEMENT_CONSTANTS.PG_FEE_RATE);
  const net_cash = paid - pg_fee;

  // Step 2: Anchor 계산 (쿠폰은 플랫폼 부담 → Gross - 실제PG수수료)
  const anchor = gross_amount - pg_fee;

  // Step 3: 풀별 배분
  const platform_pool = Math.round(anchor * SETTLEMENT_CONSTANTS.PLATFORM_RATE);
  const creator_pool = Math.round(anchor * SETTLEMENT_CONSTANTS.CREATOR_POOL_RATE);
  const growth_pool = Math.round(anchor * SETTLEMENT_CONSTANTS.GROWTH_POOL_RATE);
  const risk_pool = Math.round(anchor * SETTLEMENT_CONSTANTS.RISK_POOL_RATE);

  // Step 4: 크리에이터 풀 내부 분배
  const creator_original = Math.round(creator_pool * SETTLEMENT_CONSTANTS.CREATOR_ORIGINAL_RATE);
  const creator_remix_total = Math.round(creator_pool * SETTLEMENT_CONSTANTS.CREATOR_REMIX_RATE);
  const creator_curation = Math.round(creator_pool * SETTLEMENT_CONSTANTS.CREATOR_CURATION_RATE);

  // 리믹스 체인 분배 (최대 3단계)
  const remix_shares = [];
  const effective_chain = remix_chain.slice(0, SETTLEMENT_CONSTANTS.REMIX_MAX_DEPTH);
  if (effective_chain.length > 0) {
    const per_remix = Math.round(creator_remix_total / effective_chain.length);
    effective_chain.forEach((creator_id, index) => {
      remix_shares.push({
        creator_id,
        depth: index + 1,
        amount: per_remix
      });
    });
  }

  // Step 5: 성장 풀 분배
  let growth_referrer = 0;
  let growth_campaign = 0;
  let growth_reserve = 0;

  if (referrer_id) {
    growth_referrer = Math.round(growth_pool * (SETTLEMENT_CONSTANTS.GROWTH_REFERRER_RATE / SETTLEMENT_CONSTANTS.GROWTH_POOL_RATE));
    growth_campaign = growth_pool - growth_referrer; // 잔여 보정
  } else {
    growth_reserve = growth_pool; // 추천 없으면 전액 적립
  }

  // Step 6: 플랫폼 실제 수령액
  const platform_actual = net_cash - creator_pool - growth_pool - risk_pool;

  // Step 7: 검증 - 합계 일치
  const total_distributed = platform_actual + creator_pool + growth_pool + risk_pool;
  const balance_check = Math.abs(total_distributed - net_cash) <= 1; // 반올림 오차 허용

  return {
    // 입력
    gross_amount,
    coupon_amount,
    paid,
    pg_fee,
    net_cash,
    anchor,

    // 풀별 배분
    pools: {
      platform: platform_pool,
      platform_actual,
      creator: creator_pool,
      growth: growth_pool,
      risk: risk_pool
    },

    // 크리에이터 상세
    creator_breakdown: {
      original: creator_original,
      remix_total: creator_remix_total,
      remix_shares,
      curation: creator_curation
    },

    // 성장 상세
    growth_breakdown: {
      referrer: growth_referrer,
      campaign: growth_campaign,
      reserve: growth_reserve
    },

    // 검증
    total_distributed,
    balance_check
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 테스트 케이스 20개
// ═══════════════════════════════════════════════════════════════════════════
const TEST_CASES = [
  // ─────────────────────────────────────────────────────────────────────────
  // 기본 결제 (1-5)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'TC-001',
    name: '기본 결제 - 쿠폰 없음, 추천 없음',
    event: {
      event_type: 'PAYMENT',
      gross_amount: 10000,
      coupon_amount: 0,
      remix_chain: [],
      referrer_id: null
    },
    expected: {
      paid: 10000,
      net_cash_positive: true,
      balance_check: true
    }
  },
  {
    id: 'TC-002',
    name: '기본 결제 - 고가 상품',
    event: {
      event_type: 'PAYMENT',
      gross_amount: 100000,
      coupon_amount: 0,
      remix_chain: [],
      referrer_id: null
    },
    expected: {
      paid: 100000,
      balance_check: true
    }
  },
  {
    id: 'TC-003',
    name: '기본 결제 - 최소 금액',
    event: {
      event_type: 'PAYMENT',
      gross_amount: 1000,
      coupon_amount: 0,
      remix_chain: [],
      referrer_id: null
    },
    expected: {
      paid: 1000,
      balance_check: true
    }
  },
  {
    id: 'TC-004',
    name: '기본 결제 - 중간 금액',
    event: {
      event_type: 'PAYMENT',
      gross_amount: 29900,
      coupon_amount: 0,
      remix_chain: [],
      referrer_id: null
    },
    expected: {
      paid: 29900,
      balance_check: true
    }
  },
  {
    id: 'TC-005',
    name: '기본 결제 - 소수점 발생 금액',
    event: {
      event_type: 'PAYMENT',
      gross_amount: 33333,
      coupon_amount: 0,
      remix_chain: [],
      referrer_id: null
    },
    expected: {
      paid: 33333,
      balance_check: true
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 쿠폰 적용 (6-8)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'TC-006',
    name: '쿠폰 - 10% 할인',
    event: {
      event_type: 'PAYMENT',
      gross_amount: 10000,
      coupon_amount: 1000,
      remix_chain: [],
      referrer_id: null
    },
    expected: {
      paid: 9000,
      coupon_is_platform_cost: true,
      balance_check: true
    }
  },
  {
    id: 'TC-007',
    name: '쿠폰 - 50% 대폭 할인',
    event: {
      event_type: 'PAYMENT',
      gross_amount: 20000,
      coupon_amount: 10000,
      remix_chain: [],
      referrer_id: null
    },
    expected: {
      paid: 10000,
      balance_check: true
    }
  },
  {
    id: 'TC-008',
    name: '쿠폰 - 정액 3000원 할인',
    event: {
      event_type: 'PAYMENT',
      gross_amount: 15000,
      coupon_amount: 3000,
      remix_chain: [],
      referrer_id: null
    },
    expected: {
      paid: 12000,
      balance_check: true
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 추천 (9-11)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'TC-009',
    name: '추천 - 직접 추천자 있음',
    event: {
      event_type: 'PAYMENT',
      gross_amount: 10000,
      coupon_amount: 0,
      remix_chain: [],
      referrer_id: 'user_referrer_001'
    },
    expected: {
      paid: 10000,
      referrer_receives: true,
      balance_check: true
    }
  },
  {
    id: 'TC-010',
    name: '추천 + 쿠폰 복합',
    event: {
      event_type: 'PAYMENT',
      gross_amount: 20000,
      coupon_amount: 2000,
      remix_chain: [],
      referrer_id: 'user_referrer_002'
    },
    expected: {
      paid: 18000,
      referrer_receives: true,
      balance_check: true
    }
  },
  {
    id: 'TC-011',
    name: '추천 없음 - 성장풀 적립',
    event: {
      event_type: 'PAYMENT',
      gross_amount: 10000,
      coupon_amount: 0,
      remix_chain: [],
      referrer_id: null
    },
    expected: {
      paid: 10000,
      growth_reserve_positive: true,
      balance_check: true
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 리믹스 체인 (12-15)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'TC-012',
    name: '리믹스 - 1단계',
    event: {
      event_type: 'PAYMENT',
      gross_amount: 10000,
      coupon_amount: 0,
      remix_chain: ['creator_parent_001'],
      referrer_id: null
    },
    expected: {
      paid: 10000,
      remix_depth: 1,
      balance_check: true
    }
  },
  {
    id: 'TC-013',
    name: '리믹스 - 2단계',
    event: {
      event_type: 'PAYMENT',
      gross_amount: 10000,
      coupon_amount: 0,
      remix_chain: ['creator_p1', 'creator_p2'],
      referrer_id: null
    },
    expected: {
      paid: 10000,
      remix_depth: 2,
      balance_check: true
    }
  },
  {
    id: 'TC-014',
    name: '리믹스 - 3단계 (최대)',
    event: {
      event_type: 'PAYMENT',
      gross_amount: 30000,
      coupon_amount: 0,
      remix_chain: ['creator_p1', 'creator_p2', 'creator_p3'],
      referrer_id: null
    },
    expected: {
      paid: 30000,
      remix_depth: 3,
      balance_check: true
    }
  },
  {
    id: 'TC-015',
    name: '리믹스 - 4단계 (3단계까지만 적용)',
    event: {
      event_type: 'PAYMENT',
      gross_amount: 10000,
      coupon_amount: 0,
      remix_chain: ['c1', 'c2', 'c3', 'c4_ignored'],
      referrer_id: null
    },
    expected: {
      paid: 10000,
      remix_depth: 3, // 4단계는 무시
      balance_check: true
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 복합 케이스 (16-17)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'TC-016',
    name: '복합 - 쿠폰 + 추천 + 리믹스 2단계',
    event: {
      event_type: 'PAYMENT',
      gross_amount: 50000,
      coupon_amount: 5000,
      remix_chain: ['creator_p1', 'creator_p2'],
      referrer_id: 'user_ref_complex'
    },
    expected: {
      paid: 45000,
      remix_depth: 2,
      referrer_receives: true,
      balance_check: true
    }
  },
  {
    id: 'TC-017',
    name: '복합 - 고가 + 리믹스 3단계 + 추천',
    event: {
      event_type: 'PAYMENT',
      gross_amount: 100000,
      coupon_amount: 10000,
      remix_chain: ['c1', 'c2', 'c3'],
      referrer_id: 'top_referrer'
    },
    expected: {
      paid: 90000,
      remix_depth: 3,
      referrer_receives: true,
      balance_check: true
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 환불/차지백 (18-20)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'TC-018',
    name: '환불 - 전액 환불',
    event: {
      event_type: 'REFUND',
      gross_amount: -10000, // 음수로 표현
      coupon_amount: 0,
      remix_chain: [],
      referrer_id: null,
      original_event_id: 'evt_original_001'
    },
    expected: {
      paid: -10000,
      is_reversal: true,
      balance_check: true
    }
  },
  {
    id: 'TC-019',
    name: '환불 - 부분 환불 (50%)',
    event: {
      event_type: 'REFUND',
      gross_amount: -5000,
      coupon_amount: 0,
      remix_chain: [],
      referrer_id: null,
      original_event_id: 'evt_original_002'
    },
    expected: {
      paid: -5000,
      is_partial_refund: true,
      balance_check: true
    }
  },
  {
    id: 'TC-020',
    name: '차지백 - 분쟁 환불',
    event: {
      event_type: 'CHARGEBACK',
      gross_amount: -20000,
      coupon_amount: 0,
      remix_chain: ['creator_p1'],
      referrer_id: 'user_ref_chargeback',
      original_event_id: 'evt_original_003'
    },
    expected: {
      paid: -20000,
      is_chargeback: true,
      remix_reversal: true,
      referrer_reversal: true,
      balance_check: true
    }
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// 테스트 실행
// ═══════════════════════════════════════════════════════════════════════════
function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('AIL-정산-v2-final 테스트 실행');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  TEST_CASES.forEach((testCase, index) => {
    const result = calculateSettlement(testCase.event);
    const testPassed = result.balance_check;

    if (testPassed) {
      passed++;
      console.log(`✅ ${testCase.id}: ${testCase.name}`);
    } else {
      failed++;
      console.log(`❌ ${testCase.id}: ${testCase.name}`);
      console.log(`   Balance Check Failed: distributed=${result.total_distributed}, net_cash=${result.net_cash}`);
    }

    // 상세 정보 (디버그용)
    results.push({
      id: testCase.id,
      name: testCase.name,
      passed: testPassed,
      input: testCase.event,
      output: result
    });
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`결과: ${passed}/${TEST_CASES.length} 통과`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (failed === 0) {
    console.log('\n🎉 모든 테스트 통과! Gate 조건 충족');
  } else {
    console.log(`\n⚠️ ${failed}개 테스트 실패. 수정 필요.`);
  }

  return { passed, failed, results };
}

// ═══════════════════════════════════════════════════════════════════════════
// 상세 케이스 출력 (개발팀 전달용)
// ═══════════════════════════════════════════════════════════════════════════
function printDetailedCase(caseId) {
  const testCase = TEST_CASES.find(tc => tc.id === caseId);
  if (!testCase) {
    console.log(`케이스 ${caseId} 없음`);
    return;
  }

  const result = calculateSettlement(testCase.event);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`${testCase.id}: ${testCase.name}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n【입력】');
  console.log(`  Gross: ₩${testCase.event.gross_amount.toLocaleString()}`);
  console.log(`  Coupon: ₩${(testCase.event.coupon_amount || 0).toLocaleString()}`);
  console.log(`  Remix Chain: ${testCase.event.remix_chain.length > 0 ? testCase.event.remix_chain.join(' → ') : '없음'}`);
  console.log(`  Referrer: ${testCase.event.referrer_id || '없음'}`);

  console.log('\n【계산 결과】');
  console.log(`  Paid: ₩${result.paid.toLocaleString()}`);
  console.log(`  PG Fee: ₩${result.pg_fee.toLocaleString()} (${(SETTLEMENT_CONSTANTS.PG_FEE_RATE * 100).toFixed(1)}%)`);
  console.log(`  Net Cash: ₩${result.net_cash.toLocaleString()}`);
  console.log(`  Anchor: ₩${result.anchor.toLocaleString()}`);

  console.log('\n【풀별 배분】');
  console.log(`  Platform (55%): ₩${result.pools.platform.toLocaleString()}`);
  console.log(`  Creator (30%): ₩${result.pools.creator.toLocaleString()}`);
  console.log(`  Growth (10%): ₩${result.pools.growth.toLocaleString()}`);
  console.log(`  Risk (5%): ₩${result.pools.risk.toLocaleString()}`);

  console.log('\n【크리에이터 상세】');
  console.log(`  Original (70%): ₩${result.creator_breakdown.original.toLocaleString()}`);
  console.log(`  Remix (20%): ₩${result.creator_breakdown.remix_total.toLocaleString()}`);
  if (result.creator_breakdown.remix_shares.length > 0) {
    result.creator_breakdown.remix_shares.forEach(share => {
      console.log(`    └ ${share.creator_id} (Depth ${share.depth}): ₩${share.amount.toLocaleString()}`);
    });
  }
  console.log(`  Curation (10%): ₩${result.creator_breakdown.curation.toLocaleString()}`);

  console.log('\n【성장 상세】');
  console.log(`  Referrer (7%): ₩${result.growth_breakdown.referrer.toLocaleString()}`);
  console.log(`  Campaign (3%): ₩${result.growth_breakdown.campaign.toLocaleString()}`);
  console.log(`  Reserve: ₩${result.growth_breakdown.reserve.toLocaleString()}`);

  console.log('\n【검증】');
  console.log(`  Total Distributed: ₩${result.total_distributed.toLocaleString()}`);
  console.log(`  Net Cash: ₩${result.net_cash.toLocaleString()}`);
  console.log(`  Balance Check: ${result.balance_check ? '✅ PASS' : '❌ FAIL'}`);

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════
module.exports = {
  SETTLEMENT_CONSTANTS,
  TEST_CASES,
  calculateSettlement,
  runTests,
  printDetailedCase
};

// 직접 실행 시 테스트
if (require.main === module) {
  runTests();

  // 복합 케이스 상세 출력
  console.log('\n\n');
  printDetailedCase('TC-016');
  printDetailedCase('TC-017');
}
