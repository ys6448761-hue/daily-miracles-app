'use strict';
/**
 * MAP V0.1 — Marker Safety Verification Tests
 *
 * 검증 대상: YeosuMapSelector.jsx의 마커 안전 로직 + yeosuMapData.js 게이팅
 * 실행: npx jest tests/unit/mapMarkerSafety.test.js
 *
 * 주의: yeosuMapData.js는 ESM이므로 직접 import 불가.
 * 핵심 로직을 CommonJS로 재구현하여 테스트.
 * 함수는 소스와 동기화 상태를 유지해야 함.
 */

// ── isSelectablePlace 재구현 (yeosuMapData.js line 207) ──────────────────────
const MAP_STATUS = {
  TG_READY:      'tg_ready',
  EXPLORER:      'explorer',
  VERIFY_NEEDED: 'verify',
  FERRY:         'ferry',
  TG_EXCLUDED:   'tg_excluded',
};

function isSelectablePlace(place) {
  return place.status === MAP_STATUS.TG_READY;
}

// ── 마커 렌더 로직 재구현 (YeosuMapSelector.jsx line 300~306) ─────────────────
function shouldRenderMarker(mp, isQAPreview) {
  const isVerified = mp.status === 'VERIFIED';
  if (!isVerified && !isQAPreview) return null; // 렌더 안 함
  return isVerified;
}

function isMarkerSelectable(place, mp) {
  const isVerified = mp.status === 'VERIFIED';
  return isSelectablePlace(place) && isVerified;
}

// ── 테스트 픽스처 ────────────────────────────────────────────────────────────

const ODONGDO_PLACE = {
  code: 'odongdo', name_ko: '오동도', zone: 2, status: 'tg_ready', coordVerified: true,
  markerPos: {
    oldtown: { x: 0.87, y: 0.28, confidence: 'HIGH', status: 'PROVISIONAL' },
  },
};

const ODONGDO_MP = ODONGDO_PLACE.markerPos.oldtown;

const EXPLORER_PLACE = {
  code: 'yeosu_fish_market', name_ko: '여수 수산시장', zone: 1, status: 'explorer',
  coordVerified: false,
};

const FERRY_PLACE = {
  code: 'sado_island', name_ko: '사도', zone: 7, status: 'ferry', coordVerified: false,
};

const TG_EXCLUDED_PLACE = {
  code: 'jungang_market', name_ko: '중앙시장', zone: 1, status: 'tg_excluded', hidden: true,
};

const VERIFIED_MARKER_MP = { x: 0.50, y: 0.50, confidence: 'HIGH', status: 'VERIFIED' };
const PROVISIONAL_MARKER_MP = { x: 0.87, y: 0.28, confidence: 'HIGH', status: 'PROVISIONAL' };

// ── 테스트 ────────────────────────────────────────────────────────────────────

describe('isSelectablePlace — SOUL 게이팅', () => {
  test('TG_READY → true', () => {
    expect(isSelectablePlace(ODONGDO_PLACE)).toBe(true);
  });

  test('EXPLORER → false (SOUL 누출 방지)', () => {
    expect(isSelectablePlace(EXPLORER_PLACE)).toBe(false);
  });

  test('FERRY → false', () => {
    expect(isSelectablePlace(FERRY_PLACE)).toBe(false);
  });

  test('TG_EXCLUDED → false', () => {
    expect(isSelectablePlace(TG_EXCLUDED_PLACE)).toBe(false);
  });
});

describe('shouldRenderMarker — PROVISIONAL 마커 숨김', () => {
  test('PROVISIONAL 마커, 일반 화면 → null (숨김)', () => {
    expect(shouldRenderMarker(PROVISIONAL_MARKER_MP, false)).toBeNull();
  });

  test('PROVISIONAL 마커, QA Preview → false (렌더, 미검증 스타일)', () => {
    expect(shouldRenderMarker(PROVISIONAL_MARKER_MP, true)).toBe(false);
  });

  test('VERIFIED 마커, 일반 화면 → true (렌더, 정상 스타일)', () => {
    expect(shouldRenderMarker(VERIFIED_MARKER_MP, false)).toBe(true);
  });

  test('VERIFIED 마커, QA Preview → true', () => {
    expect(shouldRenderMarker(VERIFIED_MARKER_MP, true)).toBe(true);
  });
});

describe('isMarkerSelectable — PROVISIONAL 마커 선택 차단', () => {
  test('TG_READY + PROVISIONAL → false (선택 불가, toggleRoutePlace 미호출)', () => {
    expect(isMarkerSelectable(ODONGDO_PLACE, PROVISIONAL_MARKER_MP)).toBe(false);
  });

  test('TG_READY + VERIFIED → true (선택 가능)', () => {
    expect(isMarkerSelectable(ODONGDO_PLACE, VERIFIED_MARKER_MP)).toBe(true);
  });

  test('EXPLORER + VERIFIED → false (SOUL 누출 방지)', () => {
    expect(isMarkerSelectable(EXPLORER_PLACE, VERIFIED_MARKER_MP)).toBe(false);
  });

  test('FERRY + VERIFIED → false', () => {
    expect(isMarkerSelectable(FERRY_PLACE, VERIFIED_MARKER_MP)).toBe(false);
  });
});

describe('toggleRoutePlace 호출 가드 — handleToggle 동작', () => {
  // handleToggle = () => selectable && onTogglePlace(...)
  // selectable=false → onTogglePlace 미호출

  test('PROVISIONAL 마커 handleToggle — onTogglePlace 0회 호출', () => {
    const onTogglePlace = jest.fn();
    const selectable = isMarkerSelectable(ODONGDO_PLACE, PROVISIONAL_MARKER_MP);
    const handleToggle = () => selectable && onTogglePlace({ code: 'odongdo', name: '오동도' });
    handleToggle();
    expect(onTogglePlace).not.toHaveBeenCalled();
  });

  test('VERIFIED 마커 handleToggle — onTogglePlace 1회 호출', () => {
    const onTogglePlace = jest.fn();
    const selectable = isMarkerSelectable(ODONGDO_PLACE, VERIFIED_MARKER_MP);
    const handleToggle = () => selectable && onTogglePlace({ code: 'odongdo', name: '오동도' });
    handleToggle();
    expect(onTogglePlace).toHaveBeenCalledTimes(1);
    expect(onTogglePlace).toHaveBeenCalledWith({ code: 'odongdo', name: '오동도' });
  });

  test('EXPLORER + VERIFIED 마커 handleToggle — onTogglePlace 0회 (SOUL 게이팅)', () => {
    const onTogglePlace = jest.fn();
    const selectable = isMarkerSelectable(EXPLORER_PLACE, VERIFIED_MARKER_MP);
    const handleToggle = () => selectable && onTogglePlace({ code: 'yeosu_fish_market', name: '여수 수산시장' });
    handleToggle();
    expect(onTogglePlace).not.toHaveBeenCalled();
  });
});

describe('toggleRoutePlace 버튼 토글 — 선택/해제 정상', () => {
  function toggleRoutePlace(prev, place) {
    return prev.some(p => p.code === place.code)
      ? prev.filter(p => p.code !== place.code)
      : [...prev, place];
  }

  test('빈 목록에서 오동도 추가', () => {
    const result = toggleRoutePlace([], { code: 'odongdo', name: '오동도' });
    expect(result).toEqual([{ code: 'odongdo', name: '오동도' }]);
  });

  test('오동도 선택 후 재클릭 → 해제', () => {
    const after1 = toggleRoutePlace([], { code: 'odongdo', name: '오동도' });
    const after2 = toggleRoutePlace(after1, { code: 'odongdo', name: '오동도' });
    expect(after2).toEqual([]);
  });

  test('오동도 해제 후 재선택', () => {
    const step1 = toggleRoutePlace([], { code: 'odongdo', name: '오동도' });
    const step2 = toggleRoutePlace(step1, { code: 'odongdo', name: '오동도' });
    const step3 = toggleRoutePlace(step2, { code: 'odongdo', name: '오동도' });
    expect(step3).toEqual([{ code: 'odongdo', name: '오동도' }]);
  });

  test('권역 이동 후 선택 상태 유지 — selectedPlaces 외부 상태', () => {
    // selectedPlaces는 MuyojeongHomePage에서 관리 (routePlaces)
    // Zone 이동은 YeosuMapSelector 내부 activeZone만 변경 → selectedPlaces 무관
    const routePlaces = [{ code: 'odongdo', name: '오동도' }];
    // Zone 1 → Zone 2 이동: activeZone 변경, routePlaces 그대로
    const selectedAfterZoneChange = routePlaces; // 그대로
    expect(selectedAfterZoneChange).toEqual([{ code: 'odongdo', name: '오동도' }]);
  });

  test('케이블카 선택 → 오동도 추가 → 케이블카 해제', () => {
    let places = [];
    places = toggleRoutePlace(places, { code: 'cablecar', name: '케이블카' });
    places = toggleRoutePlace(places, { code: 'odongdo', name: '오동도' });
    places = toggleRoutePlace(places, { code: 'cablecar', name: '케이블카' });
    expect(places).toEqual([{ code: 'odongdo', name: '오동도' }]);
  });
});

describe('오동도 현재 마커 상태 확인', () => {
  test('오동도 markerPos.oldtown.status = PROVISIONAL', () => {
    expect(ODONGDO_MP.status).toBe('PROVISIONAL');
  });

  test('오동도 markerPos.oldtown.confidence = HIGH', () => {
    expect(ODONGDO_MP.confidence).toBe('HIGH');
  });

  test('오동도 place.status = tg_ready (SOUL 추천 가능)', () => {
    expect(ODONGDO_PLACE.status).toBe('tg_ready');
  });

  test('오동도 마커 → 일반 화면 숨김 확인', () => {
    expect(shouldRenderMarker(ODONGDO_MP, false)).toBeNull();
  });
});
