/**
 * PHX-SOUL-QA-001 Phase 1 — 미확인 혜택·브랜드 문구 노출 차단 회귀 테스트
 * 실제 travelGuideService를 사용하고 DB 호출만 mock한다.
 */

jest.mock('../../database/db', () => ({ query: jest.fn() }));

const fs = require('fs');
const path = require('path');
const db = require('../../database/db');
const travelGuideService = require('../../services/travelGuideService');

describe('미확인 파트너 혜택 노출 차단 (모이핀)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('코스 카페 블록용 혜택 조회에서 모이핀 혜택(display_copy 포함)을 제외한다', async () => {
    db.query.mockResolvedValue({
      rows: [
        { partner_id: 1, partner_name: '모이핀', title: '아메리카노 1인 무료', display_copy: 'DreamTown 별빛항로의 첫 번째 쉼.', is_active: true },
        { partner_id: 2, partner_name: '카페하루', title: '커피 할인', display_copy: '오늘 하루를 위한 쉼.', is_active: true },
      ],
    });
    const rows = await travelGuideService._getBenefitsForCafes('KR', 'YEOSU');
    // REPAIR-03 (Founder 승인): 확인된 파트너 허용 목록이 비어 있어 모든 파트너 혜택을 제외한다.
    // Phase 1 기대값 ['카페하루']는 "모이핀만 제외" 정책에 해당했으므로 정책 변경에 맞춰 갱신했다.
    expect(rows).toEqual([]);
    expect(JSON.stringify(rows)).not.toMatch(/별빛항로/);
  });

  test('일반 혜택 조회에서도 모이핀 무료 혜택을 제외한다', async () => {
    db.query.mockResolvedValue({
      rows: [
        { partner_id: 1, partner_name: '모이핀', benefit_type: 'free', title: '아메리카노 1인 무료', description: '' },
        { partner_id: 2, partner_name: '카페하루', benefit_type: 'discount', title: '커피 할인', description: '' },
      ],
    });
    const rows = await travelGuideService._getBenefits('KR', 'YEOSU');
    // REPAIR-03 (Founder 승인): 확인된 파트너 허용 목록이 비어 있어 모든 파트너 혜택을 제외한다.
    expect(rows).toEqual([]);
  });
});

describe('브랜드 문구 노출 차단 (Kenny 페이지 정적 문구)', () => {
  test('KennyHotelPage 2일차 설명에 미확인 파트너 브랜드명을 노출하지 않는다', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../../dreamtown-frontend/src/pages/KennyHotelPage.jsx'),
      'utf8'
    );
    expect(src).not.toMatch(/모이핀/);
  });
});
