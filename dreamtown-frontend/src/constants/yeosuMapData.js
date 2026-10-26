/**
 * 여수 전역 지도 V0.1 — 장소 및 권역 데이터
 *
 * 근거: docs/knowledge/MAP-V01-PREPARATION-EVIDENCE.md
 * Founder 승인: OI-MAP-1~5 (2026-10-26)
 *
 * 상태 규칙:
 *   TG_READY      — SOUL TG 추천 가능. 장소 칩과 동일 상태.
 *   EXPLORER      — 탐색 가능. SOUL 추천 자동 승격 금지.
 *   VERIFY_NEEDED — 정보 미확인. V0.2 이후 추가.
 *   FERRY         — 배편 필수. SOUL 추천 제외.
 *   TG_EXCLUDED   — TG 전면 제외. 지도 미표시 (OI-MAP-1).
 *
 * 좌표 정책:
 *   coordVerified=true  — 공식 출처 확인된 좌표.
 *   coordVerified=false — 미검증. lat/lng=null 유지.
 *   UV-2: 여수 수산시장 좌표 미검증 (주소만 확인: 여객선터미널길 24 교동).
 */

export const MAP_STATUS = {
  TG_READY:      'tg_ready',
  EXPLORER:      'explorer',
  VERIFY_NEEDED: 'verify',
  FERRY:         'ferry',
  TG_EXCLUDED:   'tg_excluded',
};

export const YEOSU_PLACES = [
  // ── 권역 1: 원도심 해안권 ─────────────────────────────────────────────────
  // 기존 TG_READY
  { code: 'lee_soon_shin_plaza',  name_ko: '이순신광장',   zone: 1, lat: 34.7463,    lng: 127.7356,    status: 'tg_ready',   coordVerified: true },
  { code: 'romantic_pojangmacha', name_ko: '낭만포차거리', zone: 1, lat: 34.7421,    lng: 127.7398,    status: 'tg_ready',   coordVerified: true },
  { code: 'hamel_lighthouse',     name_ko: '하멜등대',     zone: 1, lat: 34.7364,    lng: 127.7471,    status: 'tg_ready',   coordVerified: true },
  // 중앙시장: OI-MAP-1 — 지도 미표시, TG 전면 제외 유지
  { code: 'jungang_market',       name_ko: '중앙시장',     zone: 1, lat: 34.7450,    lng: 127.7370,    status: 'tg_excluded', hidden: true, coordVerified: true },
  // 신규 탐색 가능 (OI-MAP-2)
  { code: 'gosodong_mural',       name_ko: '고소동 천사벽화골목', zone: 1, lat: 34.7389997, lng: 127.7411688, status: 'explorer', coordVerified: true, coordNote: 'NAVER 마커 기준 (mom-mom.net, 2026-10-26)' },
  // UV-2: 좌표 미검증 — lat/lng null 유지
  { code: 'yeosu_fish_market',    name_ko: '여수 수산시장', zone: 1, lat: null,       lng: null,        status: 'explorer',   coordVerified: false, coordNote: 'UV-2: 주소=여객선터미널길 24 교동 확인, 좌표 미검증' },

  // ── 권역 2: 오동도·엑스포권 ──────────────────────────────────────────────
  {
    code: 'odongdo', name_ko: '오동도', zone: 2, lat: 34.7602, lng: 127.7655,
    status: 'tg_ready', coordVerified: true,
    // Phase A 마커 — 시각 검증 기준, PROVISIONAL (Founder 위치 확인 대기)
    // 출처: MAP-V01-MARKER-PLAN.md §2-1 (HIGH confidence — 등대+방파제 명확 식별)
    markerPos: {
      oldtown: { x: 0.87, y: 0.28, confidence: 'HIGH', status: 'PROVISIONAL' },
    },
  },
  { code: 'cablecar',             name_ko: '케이블카',     zone: 2, lat: 34.7428,    lng: 127.7562,    status: 'tg_ready',   coordVerified: true },
  { code: 'marine_park',          name_ko: '종포해양공원', zone: 2, lat: 34.7488,    lng: 127.7475,    status: 'tg_ready',   coordVerified: true },
  { code: 'yeosu_expo_park',      name_ko: '엑스포공원',   zone: 2, lat: 34.7520,    lng: 127.7450,    status: 'tg_ready',   coordVerified: true },
  { code: 'sky_tower',            name_ko: '스카이타워',   zone: 2, lat: 34.7512,    lng: 127.7468,    status: 'tg_ready',   coordVerified: true },
  { code: 'jaisan_park',          name_ko: '자산공원',     zone: 2, lat: 34.7480,    lng: 127.7540,    status: 'tg_ready',   coordVerified: true },
  { code: 'aquaplanet',           name_ko: '아쿠아플라넷', zone: 2, lat: null,       lng: null,        status: 'explorer',   coordVerified: false },
  { code: 'yworld_luge',          name_ko: '유월드루지',   zone: 2, lat: null,       lng: null,        status: 'explorer',   coordVerified: false },

  // ── 권역 3: 돌산권 ──────────────────────────────────────────────────────
  { code: 'dolsan_daegyo',        name_ko: '돌산대교',     zone: 3, lat: 34.7395,    lng: 127.7456,    status: 'tg_ready',   coordVerified: true },
  { code: 'dolsan_nightscape',    name_ko: '돌산공원',     zone: 3, lat: 34.7289,    lng: 127.7472,    status: 'tg_ready',   coordVerified: true },
  { code: 'museukmok',            name_ko: '무슬목',       zone: 3, lat: null,       lng: null,        status: 'explorer',   coordVerified: false },
  { code: 'dolsan_got_market',    name_ko: '돌산갓장터마을', zone: 3, lat: null,     lng: null,        status: 'verify',     coordVerified: false },

  // ── 권역 4: 향일암권 ──────────────────────────────────────────────────
  { code: 'hyangiram',            name_ko: '향일암',       zone: 4, lat: 34.5914162, lng: 127.8037534, status: 'tg_ready',   coordVerified: true },

  // ── 권역 5: 소호·장도권 ──────────────────────────────────────────────
  { code: 'jangdo',               name_ko: '장도',         zone: 5, lat: null,       lng: null,        status: 'verify',     coordVerified: false },
  { code: 'soho_yacht',           name_ko: '소호요트장',   zone: 5, lat: null,       lng: null,        status: 'verify',     coordVerified: false },
  { code: 'soho_bridge',          name_ko: '소호동동다리', zone: 5, lat: null,       lng: null,        status: 'verify',     coordVerified: false },
  { code: 'lee_soon_shin_marina', name_ko: '이순신마리나', zone: 5, lat: null,       lng: null,        status: 'verify',     coordVerified: false },
  { code: 'nk_submarine',         name_ko: '북한반잠수정전시관', zone: 5, lat: null, lng: null,        status: 'verify',     coordVerified: false },

  // ── 권역 6: 화양·여자만권 ────────────────────────────────────────────
  { code: 'gasari_ecology',       name_ko: '가사리생태공원',     zone: 6, lat: null, lng: null, status: 'verify', coordVerified: false },
  { code: 'yeojaman_sunset',      name_ko: '여자만갯벌/해넘이', zone: 6, lat: null, lng: null, status: 'verify', coordVerified: false },
  { code: 'seomdalcheon',         name_ko: '섬달천',             zone: 6, lat: null, lng: null, status: 'verify', coordVerified: false },
  { code: 'hwanyang_drive',       name_ko: '화양드라이브',       zone: 6, lat: null, lng: null, status: 'verify', coordVerified: false },
  { code: 'settler_cactus',       name_ko: '서틀러다육식물원',   zone: 6, lat: null, lng: null, status: 'verify', coordVerified: false },
  { code: 'jangcheok_tideland',   name_ko: '장척갯벌체험',       zone: 6, lat: null, lng: null, status: 'verify', coordVerified: false },
  { code: 'bonghwangsan',         name_ko: '봉황산자연휴양림',   zone: 6, lat: null, lng: null, status: 'verify', coordVerified: false },
  { code: 'artland_resort',       name_ko: '예술랜드리조트',     zone: 6, lat: null, lng: null, status: 'verify', coordVerified: false },

  // ── 권역 7: 섬섬길 (배편 필수) ───────────────────────────────────────
  // OI-MAP-5: SOUL 추천 제외, 배편 배지 표시
  { code: 'sado_island',          name_ko: '사도',         zone: 7, lat: null,       lng: null,        status: 'ferry',      coordVerified: false },
  { code: 'hahwado_island',       name_ko: '하화도',       zone: 7, lat: null,       lng: null,        status: 'ferry',      coordVerified: false },
  { code: 'hwajung_island',       name_ko: '화정도서',     zone: 7, lat: null,       lng: null,        status: 'ferry',      coordVerified: false },
];

// 7개 권역 정의 (OI-MAP-3 Founder 승인)
// boundingBox: 마커 픽셀 변환용 추정값 — Founder 이미지 제공 후 캘리브레이션 필요 (UV-3)
export const YEOSU_ZONES = [
  {
    id: 1, name_ko: '원도심 해안권', color: '#6EB8FF',
    hasDetailMap: true, // 원도심: V0.1 상세 지도 우선 (OI-MAP-3)
    boundingBox: { minLat: 34.730, maxLat: 34.765, minLng: 127.725, maxLng: 127.760 },
    note: '이순신대교·여객선터미널·하멜등대 포함',
  },
  {
    id: 2, name_ko: '오동도·엑스포권', color: '#B8F4FF',
    hasDetailMap: false,
    boundingBox: { minLat: 34.740, maxLat: 34.775, minLng: 127.745, maxLng: 127.780 },
  },
  {
    id: 3, name_ko: '돌산권', color: '#FFD67A',
    hasDetailMap: false,
    boundingBox: { minLat: 34.720, maxLat: 34.750, minLng: 127.740, maxLng: 127.760 },
    note: '돌산대교 도보 접근 가능',
  },
  {
    id: 4, name_ko: '향일암권', color: '#FF9BAF',
    hasDetailMap: false,
    boundingBox: { minLat: 34.580, maxLat: 34.610, minLng: 127.790, maxLng: 127.820 },
    note: '일출 명소. 이른 아침 방문 권장',
  },
  {
    id: 5, name_ko: '소호·장도권', color: '#A8E6CF',
    hasDetailMap: false,
    boundingBox: null, // 미검증
    note: '소호동동다리·장도(예술의 섬) 포함',
  },
  {
    id: 6, name_ko: '화양·여자만권', color: '#D4A8FF',
    hasDetailMap: false,
    boundingBox: null, // 미검증
    note: '일몰·갯벌 명소. 차량 이동 권장',
  },
  {
    id: 7, name_ko: '섬섬길 (배편 필수)', color: '#888899',
    hasDetailMap: false,
    boundingBox: null, // 미검증
    note: '백야선착장 출발. 운항 일정·물때 확인 필수',
  },
];

// 권역별 장소 목록 (hidden 제외)
export function getPlacesByZone(zoneId) {
  return YEOSU_PLACES.filter(p => p.zone === zoneId && !p.hidden);
}

// 특정 이미지 키에 마커 위치가 정의된 장소 목록
// Phase A: HIGH confidence만 반환 (MEDIUM 이상은 Founder 확인 후 추가)
export function getMarkersForImage(imageKey) {
  return YEOSU_PLACES.filter(
    p => !p.hidden && p.markerPos && p.markerPos[imageKey] && p.markerPos[imageKey].confidence === 'HIGH'
  );
}

// 지도에서 선택 가능한 장소 여부
// TG_READY만 선택 가능 — 탐색 가능 장소는 SOUL 추천 자동 승격 금지 (OI-MAP-2)
export function isSelectablePlace(place) {
  return place.status === MAP_STATUS.TG_READY;
}

// 권역별 TG_READY 장소 수
export function countTgReadyByZone(zoneId) {
  return YEOSU_PLACES.filter(p => p.zone === zoneId && p.status === MAP_STATUS.TG_READY).length;
}
