/**
 * 여수 전역 지도 V0.1 — 장소 및 권역 데이터
 *
 * 근거: docs/knowledge/MAP-V01-PREPARATION-EVIDENCE.md
 * Founder 승인: OI-MAP-1~5 (2026-10-26) / FC-1~5 (2026-10-26)
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
  // markerPos: Founder 그림판 PNG 기준 (marker-oldtown-founder.png, 2026-10-27). PROVISIONAL.
  // 이순신광장: 흰 원으로 표시됨 — 빨간 픽셀 추출 불가. 기존 좌표 유지. Founder 재확인 필요.
  // 마커 좌표: CLEAN_RESTART_V02 (2026-10-27) — 기존 PROVISIONAL 백업 후 초기화
  // 백업: docs/knowledge/MAP-V01-MARKERPOS-BACKUP.md
  { code: 'lee_soon_shin_plaza',  name_ko: '이순신광장',   zone: 1, lat: 34.7463,    lng: 127.7356,    status: 'tg_ready',   coordVerified: true,
    markerPos: { oldtown: { x: 0.391, y: 0.544, confidence: 'HIGH', status: 'PROVISIONAL' } } }, // Founder 지정 2026-10-27
  { code: 'romantic_pojangmacha', name_ko: '낭만포차거리', zone: 1, lat: 34.7421,    lng: 127.7398,    status: 'tg_ready',   coordVerified: true },
  { code: 'hamel_lighthouse',     name_ko: '하멜등대',     zone: 1, lat: 34.7364,    lng: 127.7471,    status: 'tg_ready',   coordVerified: true },
  // 중앙시장: OI-MAP-1 — 지도 미표시, TG 전면 제외 유지
  { code: 'jungang_market',       name_ko: '중앙시장',     zone: 1, lat: 34.7450,    lng: 127.7370,    status: 'tg_excluded', hidden: true, coordVerified: true },
  // 신규 탐색 가능 (OI-MAP-2)
  { code: 'gosodong_mural',       name_ko: '고소동 천사벽화골목', zone: 1, lat: 34.7389997, lng: 127.7411688, status: 'explorer', coordVerified: true, coordNote: 'NAVER 마커 기준 (mom-mom.net, 2026-10-26)' },
  // UV-2: 좌표 미검증 — lat/lng null 유지
  { code: 'yeosu_fish_market',    name_ko: '여수 수산시장', zone: 1, lat: null,       lng: null,        status: 'explorer',   coordVerified: false, coordNote: 'UV-2: 주소=여객선터미널길 24 교동 확인, 좌표 미검증' },
  // 진남관·오포대: Founder 원도심 8곳 (FC-1/2 승인, EXPLORER — 좌표 미검증, 마커 미표시)
  { code: 'jinamgwan',            name_ko: '진남관',        zone: 1, lat: null,       lng: null,        status: 'explorer',   coordVerified: false, coordNote: '국보 304호. 여수시 군자동 소재 확인. 좌표 미검증.' },
  { code: 'opodae',               name_ko: '오포대',        zone: 1, lat: null,       lng: null,        status: 'explorer',   coordVerified: false, coordNote: '고소동 언덕 소재 확인. 좌표 미검증.' },
  // 종포해양공원: Zone 2→1 (Founder 원도심 8곳 포함, FC-ZONE 승인)
  { code: 'marine_park',          name_ko: '종포해양공원', zone: 1, lat: 34.7488,    lng: 127.7475,    status: 'tg_ready',   coordVerified: true },

  // ── 권역 2: 오동도·엑스포권 ──────────────────────────────────────────────
  {
    code: 'odongdo', name_ko: '오동도', zone: 2, lat: 34.7602, lng: 127.7655,
    status: 'tg_ready', coordVerified: true,
    // Phase A 마커 — 시각 검증 기준, PROVISIONAL (Founder 위치 확인 대기)
    // 출처: MAP-V01-MARKER-PLAN.md §2-1 (HIGH confidence — 등대+방파제 명확 식별)
    // Zone 2 소속 → Zone 1 상세 지도에서 zone 필터로 제외 / Zone 2 상세 지도에서 표시됨
  },
  // cablecar = SOUL entity (TG_READY). 좌표=자산탑승장(여수 본토). Founder "해상케이블카 자산탑승장" alias.
  { code: 'cablecar',             name_ko: '케이블카',     zone: 2, lat: 34.7428,    lng: 127.7562,    status: 'tg_ready',   coordVerified: true },
  { code: 'yeosu_expo_park',      name_ko: '엑스포공원',   zone: 2, lat: 34.7520,    lng: 127.7450,    status: 'tg_ready',   coordVerified: true },
  { code: 'sky_tower',            name_ko: '스카이타워',   zone: 2, lat: 34.7512,    lng: 127.7468,    status: 'tg_ready',   coordVerified: true },
  { code: 'jaisan_park',          name_ko: '자산공원',     zone: 2, lat: 34.7480,    lng: 127.7540,    status: 'tg_ready',   coordVerified: true },
  { code: 'aquaplanet',           name_ko: '아쿠아플라넷', zone: 2, lat: null,       lng: null,        status: 'explorer',   coordVerified: false },
  { code: 'yworld_luge',          name_ko: '유월드루지',   zone: 5, lat: null,       lng: null,        status: 'explorer',   coordVerified: false, coordNote: 'Founder QA: Zone 2→5. 소호 관광단지 인근.' },
  // 신규 EXPLORER — Founder 오동도·엑스포 7곳 (FC-3~5 승인, 좌표 미검증, 마커 미표시)
  { code: 'yeosu_expo_station',   name_ko: '여수엑스포역', zone: 2, lat: null,       lng: null,        status: 'explorer',   coordVerified: false, coordNote: 'KTX 종착역. 엑스포 부지 북측. 좌표 미검증.' },
  { code: 'expo_ocean_trail',     name_ko: '엑스포 바닷길', zone: 2, lat: null,      lng: null,        status: 'explorer',   coordVerified: false, coordNote: '엑스포 해안 산책로. yeosu_expo_park와 별개 등록. 경계·좌표 미검증.' },
  { code: 'manseongri_beach',     name_ko: '만성리해수욕장', zone: 2, lat: null,     lng: null,        status: 'explorer',   coordVerified: false, coordNote: 'Founder Zone 2 배치. 좌표 미검증.' },
  { code: 'yeosu_ocean_cruise',   name_ko: '여수오션크루즈', zone: 2, lat: null,     lng: null,        status: 'explorer',   coordVerified: false, coordNote: '선착장 위치 UNVERIFIED. 운항 조건 별도 확인 필요.' },
  // 낭만요트·블루요트: Founder Decision 2026-10-27 — 탑승 기준 위치=유탑마리나호텔 앞(오동도로 61-15)
  // 운항 일정·예약 미확인. 마커 좌표 임의 입력 금지 — Founder 드래그 편집 후 반영.
  { code: 'nangman_yacht',        name_ko: '낭만요트',      zone: 2, lat: null,     lng: null,        status: 'explorer',   coordVerified: false, coordNote: '탑승 위치: 유탑마리나호텔 정문 오른편 선착장(여수시 오동도로 61-15). 좌표·마커 미검증.' },
  { code: 'blue_yacht',           name_ko: '블루요트',      zone: 2, lat: null,     lng: null,        status: 'explorer',   coordVerified: false, coordNote: '탑승 위치: 유탑마리나호텔 정문 왼편 전용 선착장(여수시 오동도로 61-15). 좌표·마커 미검증.' },
  // 빅오쇼: Founder Decision 2026-10-27 — 엑스포공원 내 야외 해상 공연, 독립 경험 항목으로 구분
  { code: 'big_o_show',           name_ko: '빅오쇼',        zone: 2, lat: null,     lng: null,        status: 'explorer',   coordVerified: false, coordNote: '엑스포공원 내 야외 수상 공연 시설. yeosu_expo_park와 별개 경험 항목. 운영 일정·예약 미확인. 좌표·마커 미검증.' },

  // ── 권역 3: 돌산권 ──────────────────────────────────────────────────────
  { code: 'dolsan_daegyo',        name_ko: '돌산대교',     zone: 3, lat: 34.7395,    lng: 127.7456,    status: 'tg_ready',   coordVerified: true },
  { code: 'dolsan_nightscape',    name_ko: '돌산공원',     zone: 3, lat: 34.7289,    lng: 127.7472,    status: 'tg_ready',   coordVerified: true },
  { code: 'museukmok',            name_ko: '무슬목',       zone: 3, lat: null,       lng: null,        status: 'explorer',   coordVerified: false },
  { code: 'dolsan_got_market',    name_ko: '돌산갓장터마을', zone: 3, lat: null,     lng: null,        status: 'verify',     coordVerified: false },
  // 해상케이블카 돌산탑승장: Zone 3 지도 탐색 전용. SOUL은 기존 cablecar(Zone 2 TG_READY) 사용.
  { code: 'cablecar_dolsan',      name_ko: '해상케이블카 돌산탑승장', zone: 3, lat: null, lng: null, status: 'explorer', coordVerified: false, coordNote: '돌산도 쪽 탑승장. 좌표 미검증. SOUL 게이팅: cablecar(TG_READY) 별도 유지.' },

  // ── 권역 4: 향일암권 ──────────────────────────────────────────────────
  { code: 'hyangiram',            name_ko: '향일암',       zone: 4, lat: 34.5914162, lng: 127.8037534, status: 'tg_ready',   coordVerified: true },

  // ── 권역 5: 소호·장도권 ──────────────────────────────────────────────
  { code: 'jangdo',               name_ko: '장도',         zone: 5, lat: null,       lng: null,        status: 'verify',     coordVerified: false },
  { code: 'soho_yacht',           name_ko: '소호요트장',   zone: 5, lat: null,       lng: null,        status: 'verify',     coordVerified: false },
  { code: 'soho_bridge',          name_ko: '소호동동다리', zone: 5, lat: null,       lng: null,        status: 'verify',     coordVerified: false },
  { code: 'lee_soon_shin_marina', name_ko: '이순신마리나', zone: 5, lat: null,       lng: null,        status: 'verify',     coordVerified: false },
  { code: 'nk_submarine',         name_ko: '북한반잠수정전시관', zone: 3, lat: null, lng: null,        status: 'verify',     coordVerified: false, coordNote: 'Founder QA 판단 유지: Zone 5→3 (돌산권). 주소 미제공, Founder 판단 기준.' },

  // ── 권역 6: 화양·여자만권 ────────────────────────────────────────────
  { code: 'gasari_ecology',       name_ko: '가사리생태공원',     zone: 6, lat: null, lng: null, status: 'verify', coordVerified: false },
  { code: 'yeojaman_sunset',      name_ko: '여자만갯벌/해넘이', zone: 6, lat: null, lng: null, status: 'verify', coordVerified: false },
  { code: 'seomdalcheon',         name_ko: '섬달천',             zone: 6, lat: null, lng: null, status: 'verify', coordVerified: false },
  { code: 'hwanyang_drive',       name_ko: '화양드라이브',       zone: 6, lat: null, lng: null, status: 'verify', coordVerified: false },
  { code: 'settler_cactus',       name_ko: '서틀러다육식물원',   zone: 5, lat: null, lng: null, status: 'verify', coordVerified: false, coordNote: 'GEO-2: Founder 결정 Zone 6→5 (소호·장도권). 법인주소=소라면 논골안길 20-9. 실제 방문지 동일성 UNVERIFIED. 좌표·마커 미표시.' },
  { code: 'jangcheok_tideland',   name_ko: '장척갯벌체험',       zone: 6, lat: null, lng: null, status: 'verify', coordVerified: false },
  { code: 'bonghwangsan',         name_ko: '봉황산자연휴양림',   zone: 3, lat: null, lng: null, status: 'verify', coordVerified: false, coordNote: 'Founder 주소 확인: 전남 여수시 돌산읍 대복길 160 → Zone 6→3 (돌산권).' },
  { code: 'artland_resort',       name_ko: '예술랜드리조트',     zone: 3, lat: null, lng: null, status: 'verify', coordVerified: false, coordNote: 'Founder QA 판단 유지: Zone 6→3 (돌산권). 주소 미제공, Founder 판단 기준.' },

  // ── 권역 7: 섬섬길 (배편 필수) ───────────────────────────────────────
  // OI-MAP-5: SOUL 추천 제외, 배편 배지 표시
  { code: 'sado_island',          name_ko: '사도',         zone: 7, lat: null,       lng: null,        status: 'ferry',      coordVerified: false },
  { code: 'hahwado_island',       name_ko: '하화도',       zone: 7, lat: null,       lng: null,        status: 'ferry',      coordVerified: false },
  { code: 'hwajung_island',       name_ko: '화정도서',     zone: 7, lat: null,       lng: null,        status: 'ferry',      coordVerified: false },
];

// 7개 권역 정의 (OI-MAP-3 Founder 승인)
// boundingBox: 마커 픽셀 변환용 추정값 — Founder 이미지 제공 후 캘리브레이션 필요 (UV-3)
// boundary: SVG 경계선 오버레이 데이터 (BOUNDARY_SCAFFOLD_READY 2026-10-26)
//   imageId  — 기준 이미지 파일명(확장자 제외)
//   points   — 이미지 상대 좌표 [{x:0~1, y:0~1}...] 반시계 or 시계 방향. Founder 검수 후 인코딩.
//   status   — UNVERIFIED | PROVISIONAL | VERIFIED. VERIFIED만 실제 렌더링.
//   source   — 좌표 작성 근거
export const YEOSU_ZONES = [
  {
    id: 1, name_ko: '원도심 해안권', color: '#6EB8FF',
    hasDetailMap: true,
    boundingBox: { minLat: 34.730, maxLat: 34.765, minLng: 127.725, maxLng: 127.760 },
    // PROVISIONAL: oldtown 기준 좌표. 오동도(0.87,0.28) 단일 역산. Founder F-1~F-7 검수 전.
    boundary: {
      imageId: 'yeosu-oldtown-v01',
      points: [
        { x: 0.10, y: 0.38 }, // NW: 이순신광장 북서 항만
        { x: 0.57, y: 0.38 }, // NE: 종포해양공원 북 (Zone 1/2 상단 경계)
        { x: 0.60, y: 0.55 }, // E:  하멜등대·종포 동쪽
        { x: 0.56, y: 0.76 }, // SE: 하멜등대 남동
        { x: 0.28, y: 0.82 }, // S:  낭만포차거리 남측
        { x: 0.10, y: 0.65 }, // SW: 이순신광장 남서 해안
      ],
      status: 'PROVISIONAL',
      source: 'oldtown-boundary-overlay-2026-10-26 (odongdo single-ref)',
    },
    note: '이순신대교·여객선터미널·하멜등대 포함',
  },
  {
    id: 2, name_ko: '오동도·엑스포권', color: '#B8F4FF',
    hasDetailMap: true, // oldtown 이미지 재사용 (FOUNDER_ZONE2_DETAIL_MAP_REUSE_APPROVED)
    boundingBox: { minLat: 34.740, maxLat: 34.775, minLng: 127.745, maxLng: 127.780 },
    // PROVISIONAL: oldtown 기준 좌표. 2026-10-26 수정 2차.
    // Founder Decision: 돌산 침범 제거, 여수엑스포역 포함.
    // 여수엑스포역: 이미지 상단 우측 역사 구조물 y≈0.02~0.10 시각 추정 → NW y=0.10 포함 확장.
    // 오동도(0.87,0.28) CONFIRMED. 나머지 시각 추정.
    boundary: {
      imageId: 'yeosu-oldtown-v01',
      points: [
        { x: 0.47, y: 0.10 }, // NW: 엑스포역 방향 북측 확장 (이미지 상단 역사 구조물 y≈0.05~0.10)
        { x: 0.90, y: 0.14 }, // NE: 오동도 북동
        { x: 0.96, y: 0.46 }, // E:  오동도 동쪽 이미지 경계
        { x: 0.74, y: 0.63 }, // SE: 케이블카 자산탑승장 남동 (돌산 제외)
        { x: 0.57, y: 0.63 }, // S:  Zone 2 남측 경계 (돌산 제외)
        { x: 0.56, y: 0.40 }, // W:  Zone 1/2 경계 하단
      ],
      status: 'PROVISIONAL',
      source: 'zone2-expo-station-extension-2026-10-26 (nw-y-0.30→0.10, expo-station-visual-est)',
    },
  },
  {
    id: 3, name_ko: '돌산권', color: '#FFD67A',
    hasDetailMap: false,
    boundingBox: { minLat: 34.720, maxLat: 34.750, minLng: 127.740, maxLng: 127.760 },
    boundary: { imageId: 'yeosu-overview-v01', points: null, status: 'UNVERIFIED', source: null },
    note: '돌산대교 도보 접근 가능',
  },
  {
    id: 4, name_ko: '향일암권', color: '#FF9BAF',
    hasDetailMap: false,
    boundingBox: { minLat: 34.580, maxLat: 34.610, minLng: 127.790, maxLng: 127.820 },
    boundary: { imageId: 'yeosu-overview-v01', points: null, status: 'UNVERIFIED', source: null },
    note: '일출 명소. 이른 아침 방문 권장',
  },
  {
    id: 5, name_ko: '소호·장도권', color: '#A8E6CF',
    hasDetailMap: false,
    boundingBox: null,
    boundary: { imageId: 'yeosu-overview-v01', points: null, status: 'UNVERIFIED', source: null },
    note: '소호동동다리·장도(예술의 섬) 포함',
  },
  {
    id: 6, name_ko: '화양·여자만권', color: '#D4A8FF',
    hasDetailMap: false,
    boundingBox: null,
    boundary: { imageId: 'yeosu-overview-v01', points: null, status: 'UNVERIFIED', source: null },
    note: '일몰·갯벌 명소. 차량 이동 권장',
  },
  {
    id: 7, name_ko: '섬섬길 (배편 필수)', color: '#888899',
    hasDetailMap: false,
    boundingBox: null,
    boundary: { imageId: 'yeosu-overview-v01', points: null, status: 'UNVERIFIED', source: null },
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

// 권역 경계 데이터 반환 — SVG 오버레이 렌더링용
// VERIFIED 상태 + points 존재 시에만 실제 표시
export function getZoneBoundary(zoneId) {
  return YEOSU_ZONES.find(z => z.id === zoneId)?.boundary ?? null;
}

// ── QA Preview 전용 위치 데이터 ──────────────────────────────────────────────
// import.meta.env.DEV + ?qa_preview=boundary 에서만 사용 (프로덕션 빌드 dead-code 제거됨)
// 오동도(0.87,0.28) 단일 역산 — 불확실도 HIGH. Founder F-1~F-7 검수 대기.
// conflict: true → 경계 서쪽에 위치하는 Zone 2 장소 (F-5 확인 필요)
// anchor: true  → 기준점
export const QA_OLDTOWN_POSITIONS = {
  // Zone 1 — Founder 손표시 이미지 기준 2026-10-27 업데이트 (PROVISIONAL)
  lee_soon_shin_plaza:  { x: 0.255, y: 0.540, confirmed: false, zone: 1 }, // 흰 원 표시 — 픽셀 추출 불가, Founder 재확인 필요
  romantic_pojangmacha: { x: 0.593, y: 0.599, confirmed: true,  zone: 1 }, // "낭만포다" 라벨 → px(928,603) 2026-10-27
  hamel_lighthouse:     { x: 0.519, y: 0.718, confirmed: true,  zone: 1 }, // "하멜등다" 라벨 → px(812,722) 2026-10-27. AMBIGUOUS 해소.
  gosodong_mural:       { x: 0.406, y: 0.633, confirmed: true,  zone: 1 },
  marine_park:          { x: 0.387, y: 0.509, confirmed: true,  zone: 1 }, // "종해양공원" 라벨 근처 → px(605,512) 2026-10-27
  // Zone 1 — null coords 추정
  yeosu_fish_market:    { x: 0.250, y: 0.500, confirmed: false, zone: 1 },
  jinamgwan:            { x: 0.280, y: 0.580, confirmed: false, zone: 1 },
  opodae:               { x: 0.380, y: 0.670, confirmed: false, zone: 1 },
  // Zone 2 — Founder 손표시 이미지 기준 2026-10-27 업데이트 (PROVISIONAL)
  odongdo:              { x: 0.853, y: 0.340, confirmed: true,  zone: 2, anchor: true }, // Founder: marker-zone2-founder.png.jpg
  cablecar:             { x: 0.692, y: 0.572, confirmed: false, zone: 2 }, // AMBIGUOUS: 레이블↔점 대응 불명확 — Founder 재확인 필요
  jaisan_park:          { x: 0.582, y: 0.495, confirmed: true,  zone: 2 }, // Founder: marker-zone2-founder.png.jpg
  yeosu_expo_park:      { x: 0.478, y: 0.418, confirmed: true,  zone: 2, conflict: true },
  sky_tower:            { x: 0.512, y: 0.432, confirmed: true,  zone: 2, conflict: true },
  // Zone 2 — null coords 추정
  aquaplanet:           { x: 0.740, y: 0.420, confirmed: false, zone: 2 },
  yeosu_expo_station:   { x: 0.570, y: 0.080, confirmed: false, zone: 2 }, // UNKNOWN — 이미지 상단 역사 구조물 시각 추정 (2026-10-26)
};
