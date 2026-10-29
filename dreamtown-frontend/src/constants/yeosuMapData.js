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
    markerPos: { oldtown: { x: 0.401, y: 0.549, confidence: 'HIGH', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29
  { code: 'romantic_pojangmacha', name_ko: '낭만포차거리', zone: 1, lat: 34.7421,    lng: 127.7398,    status: 'tg_ready',   coordVerified: true,
    markerPos: { oldtown: { x: 0.613, y: 0.640, confidence: 'HIGH', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29
  { code: 'hamel_lighthouse',     name_ko: '하멜등대',     zone: 1, lat: 34.7364,    lng: 127.7471,    status: 'tg_ready',   coordVerified: true,
    markerPos: { oldtown: { x: 0.564, y: 0.634, confidence: 'HIGH', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29
  // 중앙시장: OI-MAP-1 — 지도 미표시, TG 전면 제외 유지
  { code: 'jungang_market',       name_ko: '중앙시장',     zone: 1, lat: 34.7450,    lng: 127.7370,    status: 'tg_excluded', hidden: true, coordVerified: true },
  // 신규 탐색 가능 (OI-MAP-2)
  { code: 'gosodong_mural',       name_ko: '고소동 천사벽화골목', zone: 1, lat: 34.7389997, lng: 127.7411688, status: 'explorer', coordVerified: true, coordNote: 'NAVER 마커 기준 (mom-mom.net, 2026-10-26)' },
  // UV-2: 좌표 미검증 — lat/lng null 유지
  { code: 'yeosu_fish_market',    name_ko: '여수 수산시장', zone: 1, lat: null,       lng: null,        status: 'explorer',   coordVerified: false, coordNote: 'UV-2: 주소=여객선터미널길 24 교동 확인, 좌표 미검증' },
  // 진남관·오포대: Founder 원도심 8곳 (FC-1/2 승인, EXPLORER — 좌표 미검증, 마커 미표시)
  { code: 'jinamgwan',            name_ko: '진남관',        zone: 1, lat: null,       lng: null,        status: 'explorer',   coordVerified: false, coordNote: '국보 304호. 여수시 군자동 소재 확인. 좌표 미검증.',
    markerPos: { oldtown: { x: 0.391, y: 0.474, confidence: 'HIGH', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29
  { code: 'opodae',               name_ko: '오포대',        zone: 1, lat: null,       lng: null,        status: 'explorer',   coordVerified: false, coordNote: '고소동 언덕 소재 확인. 좌표 미검증.',
    markerPos: { oldtown: { x: 0.476, y: 0.549, confidence: 'HIGH', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29
  // 종포해양공원: Zone 2→1 (Founder 원도심 8곳 포함, FC-ZONE 승인)
  { code: 'marine_park',          name_ko: '종포해양공원', zone: 1, lat: 34.7488,    lng: 127.7475,    status: 'tg_ready',   coordVerified: true,
    markerPos: { oldtown: { x: 0.474, y: 0.601, confidence: 'HIGH', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29

  // ── 권역 2: 오동도·엑스포권 ──────────────────────────────────────────────
  {
    code: 'odongdo', name_ko: '오동도', zone: 2, lat: 34.7602, lng: 127.7655,
    status: 'tg_ready', coordVerified: true,
    // Zone 2 소속 → Zone 1 상세 지도에서 zone 필터로 제외 / Zone 2 상세 지도에서 표시됨
    markerPos: { oldtown: { x: 0.853, y: 0.392, confidence: 'HIGH', status: 'PROVISIONAL' } }, // Founder 최종 좌표 2026-10-29
  },
  // cablecar = SOUL entity (TG_READY). 좌표=자산탑승장(여수 본토). Founder "해상케이블카 자산탑승장" alias.
  { code: 'cablecar',             name_ko: '케이블카',     zone: 2, lat: 34.7428,    lng: 127.7562,    status: 'tg_ready',   coordVerified: true,
    markerPos: { oldtown: { x: 0.660, y: 0.544, confidence: 'HIGH', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29 (자산탑승장 기준)
  { code: 'yeosu_expo_park',      name_ko: '엑스포공원',   zone: 2, lat: 34.7520,    lng: 127.7450,    status: 'tg_ready',   coordVerified: true,
    markerPos: { oldtown: { x: 0.558, y: 0.211, confidence: 'HIGH', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29
  { code: 'sky_tower',            name_ko: '스카이타워',   zone: 2, lat: 34.7512,    lng: 127.7468,    status: 'tg_ready',   coordVerified: true,
    markerPos: { oldtown: { x: 0.604, y: 0.137, confidence: 'HIGH', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29
  { code: 'jaisan_park',          name_ko: '자산공원',     zone: 2, lat: 34.7480,    lng: 127.7540,    status: 'tg_ready',   coordVerified: true,
    markerPos: { oldtown: { x: 0.581, y: 0.537, confidence: 'HIGH', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29
  { code: 'aquaplanet',           name_ko: '아쿠아플라넷', zone: 2, lat: null,       lng: null,        status: 'explorer',   coordVerified: false,
    markerPos: { oldtown: { x: 0.586, y: 0.326, confidence: 'HIGH', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29
  { code: 'yworld_luge',          name_ko: '유월드루지',   zone: 5, lat: null,       lng: null,        status: 'explorer',   coordVerified: false, coordNote: 'Founder QA: Zone 2→5. 소호 관광단지 인근.',
    markerPos: { overview: { x: 0.458, y: 0.444, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29 (이전: x=0.461 y=0.460)
  // 신규 EXPLORER — Founder 오동도·엑스포 7곳 (FC-3~5 승인, 좌표 미검증, 마커 미표시)
  { code: 'yeosu_expo_station',   name_ko: '여수엑스포역', zone: 2, lat: null,       lng: null,        status: 'explorer',   coordVerified: false, coordNote: 'KTX 종착역. 엑스포 부지 북측. 좌표 미검증.' },
  { code: 'expo_ocean_trail',     name_ko: '엑스포 바닷길', zone: 2, lat: null,      lng: null,        status: 'explorer',   coordVerified: false, coordNote: '엑스포 해안 산책로. yeosu_expo_park와 별개 등록. 경계·좌표 미검증.' },
  { code: 'manseongri_beach',     name_ko: '만성리해수욕장', zone: 2, lat: null,     lng: null,        status: 'explorer',   coordVerified: false, coordNote: 'Founder Zone 2 배치. 좌표 미검증.' },
  { code: 'yeosu_ocean_cruise',   name_ko: '여수오션크루즈', zone: 2, lat: null,     lng: null,        status: 'explorer',   coordVerified: false, coordNote: '선착장 위치 UNVERIFIED. 운항 조건 별도 확인 필요.' },
  // 낭만요트·블루요트: Founder Decision 2026-10-27 — 탑승 기준 위치=유탑마리나호텔 앞(오동도로 61-15)
  // 운항 일정·예약 미확인. 마커 좌표 임의 입력 금지 — Founder 드래그 편집 후 반영.
  { code: 'nangman_yacht',        name_ko: '낭만요트',      zone: 2, lat: null,     lng: null,        status: 'explorer',   coordVerified: false, coordNote: '탑승 위치: 유탑마리나호텔 정문 오른편 선착장(여수시 오동도로 61-15). 좌표·마커 미검증.',
    markerPos: { oldtown: { x: 0.657, y: 0.430, confidence: 'HIGH', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29
  { code: 'blue_yacht',           name_ko: '블루요트',      zone: 2, lat: null,     lng: null,        status: 'explorer',   coordVerified: false, coordNote: '탑승 위치: 유탑마리나호텔 정문 왼편 전용 선착장(여수시 오동도로 61-15). 좌표·마커 미검증.',
    markerPos: { oldtown: { x: 0.627, y: 0.414, confidence: 'HIGH', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29
  // 빅오쇼: Founder Decision 2026-10-27 — 엑스포공원 내 야외 해상 공연, 독립 경험 항목으로 구분
  { code: 'big_o_show',           name_ko: '빅오쇼',        zone: 2, lat: null,     lng: null,        status: 'explorer',   coordVerified: false, coordNote: '엑스포공원 내 야외 수상 공연 시설. yeosu_expo_park와 별개 경험 항목. 운영 일정·예약 미확인. 좌표·마커 미검증.',
    markerPos: { oldtown: { x: 0.549, y: 0.285, confidence: 'HIGH', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29

  // ── 권역 3: 돌산권 ──────────────────────────────────────────────────────
  // Zone 3 Founder 초안 대조 반영 2026-10-29 — PROVISIONAL (overview 이미지 기준)
  // 백업(이전 SOURCE): dolsan_daegyo x=0.639 y=0.518 / dolsan_nightscape x=0.681 y=0.539 / museukmok x=0.701 y=0.615 / cablecar_dolsan x=0.678 y=0.531
  { code: 'dolsan_daegyo',        name_ko: '돌산대교',     zone: 3, lat: 34.7395,    lng: 127.7456,    status: 'tg_ready',   coordVerified: true,
    markerPos: { overview: { x: 0.617, y: 0.495, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } }, // Founder 초안 2026-10-29 (이전: x=0.639 y=0.518)
  { code: 'dolsan_nightscape',    name_ko: '돌산공원',     zone: 3, lat: 34.7289,    lng: 127.7472,    status: 'tg_ready',   coordVerified: true,
    markerPos: { overview: { x: 0.671, y: 0.511, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } }, // Founder 초안 2026-10-29 (이전: x=0.681 y=0.539)
  { code: 'museukmok',            name_ko: '무슬목',       zone: 3, lat: null,       lng: null,        status: 'explorer',   coordVerified: false,
    markerPos: { overview: { x: 0.696, y: 0.606, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } }, // Founder 초안 2026-10-29 (이전: x=0.701 y=0.615)
  { code: 'dolsan_got_market',    name_ko: '돌산갓장터마을', zone: 4, lat: null,     lng: null,        status: 'verify',     coordVerified: false, coordNote: 'Founder 결정 2026-10-29: Zone 3→4 (향일암권) 재배정.',
    markerPos: { overview: { x: 0.702, y: 0.660, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } }, // Founder 제공 2026-10-29
  // 해상케이블카 돌산탑승장: Zone 3 지도 탐색 전용. SOUL은 기존 cablecar(Zone 2 TG_READY) 사용.
  { code: 'cablecar_dolsan',      name_ko: '해상케이블카 돌산탑승장', zone: 3, lat: null, lng: null, status: 'explorer', coordVerified: false, coordNote: '돌산도 쪽 탑승장. 좌표 미검증. SOUL 게이팅: cablecar(TG_READY) 별도 유지.',
    markerPos: { overview: { x: 0.715, y: 0.528, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } }, // Founder 초안 2026-10-29 (이전: x=0.678 y=0.531)
  // 미남크루즈·이사부크루즈: Founder 결정 2026-10-29 — Zone 3 돌산권 탐색 대상 포함. 좌표 미확인.
  { code: 'minam_cruise',         name_ko: '미남크루즈',    zone: 3, lat: null, lng: null, status: 'explorer', coordVerified: false, coordNote: 'Founder 결정 2026-10-29: Zone 3 EXPLORER 등록. 선착장 위치·운항 조건 미검증. SOUL 추천 자동 승격 금지.' },
  { code: 'isabu_cruise',         name_ko: '이사부크루즈',  zone: 3, lat: null, lng: null, status: 'explorer', coordVerified: false, coordNote: 'Founder 결정 2026-10-29: Zone 3 EXPLORER 등록. 선착장 위치·운항 조건 미검증. SOUL 추천 자동 승격 금지.' },

  // ── 권역 4: 향일암권 ──────────────────────────────────────────────────
  { code: 'hyangiram',            name_ko: '향일암',       zone: 4, lat: 34.5914162, lng: 127.8037534, status: 'tg_ready',   coordVerified: true,
    markerPos: { overview: { x: 0.751, y: 0.804, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } }, // Founder 제공 2026-10-29

  // ── 권역 5: 소호·장도권 ──────────────────────────────────────────────
  { code: 'jangdo',               name_ko: '장도',         zone: 5, lat: null,       lng: null,        status: 'verify',     coordVerified: false,
    markerPos: { overview: { x: 0.521, y: 0.471, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29 (이전 x=0.525 y=0.503. 이전 이순신마리나 좌표 0.521/0.471이 실제 장도 위치로 확인됨)
  { code: 'soho_yacht',           name_ko: '소호요트장',   zone: 5, lat: null,       lng: null,        status: 'verify',     coordVerified: false,
    markerPos: { overview: { x: 0.476, y: 0.509, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29 (이전: x=0.478 y=0.509)
  { code: 'soho_bridge',          name_ko: '소호동동다리', zone: 5, lat: null,       lng: null,        status: 'verify',     coordVerified: false,
    markerPos: { overview: { x: 0.480, y: 0.483, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29 (이전: x=0.496 y=0.471)
  // 이순신마리나: Founder 결정 2026-10-29 — Zone 5 탐색 제외. hidden:true (물리 삭제 금지). 이전 좌표(0.547/0.504)는 잘못된 위치였음.
  { code: 'lee_soon_shin_marina', name_ko: '이순신마리나', zone: 5, lat: null,       lng: null,        status: 'tg_excluded', hidden: true, coordVerified: false, coordNote: 'Founder 결정 2026-10-29: Zone 5 탐색 제외. SOUL 의존성 없음. 이전 markerPos 참조 보존.' },
  // 웅천친수공원: Founder 결정 2026-10-29 — Zone 5 신규 등록. 좌표 미확정(PLACEMENT_PENDING). 일반 지도 마커 생성 금지.
  { code: 'ungcheon_park',        name_ko: '웅천친수공원', zone: 5, lat: null,       lng: null,        status: 'verify',     coordVerified: false, coordNote: 'Founder 결정 2026-10-29: Zone 5 신규 등록. 좌표 미확정. QA 편집 후 markerPos 추가 예정.' },
  { code: 'nk_submarine',         name_ko: '북한반잠수정전시관', zone: 4, lat: null, lng: null,        status: 'verify',     coordVerified: false, coordNote: 'Founder 결정 2026-10-29: Zone 5→3→4 (향일암권) 재배정.',
    markerPos: { overview: { x: 0.726, y: 0.772, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } }, // Founder 제공 2026-10-29

  // ── 권역 6: 화양·여자만권 ────────────────────────────────────────────
  // Zone 6 후보 좌표: Founder 제공 2026-10-29. PROVISIONAL — VERIFIED 승격 전까지 QA 초안 취급.
  { code: 'gasari_ecology',       name_ko: '가사리생태공원',     zone: 6, lat: null, lng: null, status: 'verify', coordVerified: false,
    markerPos: { overview: { x: 0.364, y: 0.404, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } },
  { code: 'yeojaman_sunset',      name_ko: '여자만갯벌/해넘이', zone: 6, lat: null, lng: null, status: 'verify', coordVerified: false,
    markerPos: { overview: { x: 0.277, y: 0.288, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } },
  { code: 'seomdalcheon',         name_ko: '섬달천',             zone: 6, lat: null, lng: null, status: 'verify', coordVerified: false,
    markerPos: { overview: { x: 0.254, y: 0.341, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } },
  { code: 'hwanyang_drive',       name_ko: '화양드라이브',       zone: 6, lat: null, lng: null, status: 'verify', coordVerified: false,
    markerPos: { overview: { x: 0.433, y: 0.506, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } },
  { code: 'settler_cactus',       name_ko: '서틀러다육식물원',   zone: 5, lat: null, lng: null, status: 'verify', coordVerified: false, coordNote: 'GEO-2: Founder 결정 Zone 6→5 (소호·장도권). 법인주소=소라면 논골안길 20-9. 실제 방문지 동일성 UNVERIFIED.',
    markerPos: { overview: { x: 0.404, y: 0.442, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } }, // Founder 최종 좌표 2026-10-29 (이전: x=0.406 y=0.459)
  // jangcheok_tideland 제거 — Founder 결정 2026-10-29: yeojaman_sunset(여자만갯벌/해넘이)와 동일 장소
  { code: 'bonghwangsan',         name_ko: '봉황산자연휴양림',   zone: 4, lat: null, lng: null, status: 'verify', coordVerified: false, coordNote: 'Founder 결정 2026-10-29: Zone 6→3→4 (향일암권) 재배정.',
    markerPos: { overview: { x: 0.678, y: 0.743, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } }, // Founder 제공 2026-10-29
  { code: 'artland_resort',       name_ko: '예술랜드리조트',     zone: 3, lat: null, lng: null, status: 'verify', coordVerified: false, coordNote: 'Founder QA 판단 유지: Zone 6→3 (돌산권). 주소 미제공, Founder 판단 기준.',
    markerPos: { overview: { x: 0.740, y: 0.580, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } },

  // ── 권역 7: 섬섬길 (배편 필수) ───────────────────────────────────────
  // OI-MAP-5: SOUL 추천 제외, 배편 배지 표시
  // 공통 안내: 배편 필수 · 섬별 출발항, 운항 일정 및 물때 확인
  // hwajung_island 제거 — Founder 결정 2026-10-29: 화정도서 탐색 제외
  { code: 'sado_island',    name_ko: '사도',   zone: 7, lat: null, lng: null, status: 'ferry', coordVerified: false,
    coordNote: '배편 필수 · 섬별 출발항, 운항 일정 및 물때 확인. Founder 최종 좌표 2026-10-29.',
    markerPos: { overview: { x: 0.311, y: 0.813, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } },
  { code: 'hahwado_island', name_ko: '하화도', zone: 7, lat: null, lng: null, status: 'ferry', coordVerified: false,
    coordNote: '배편 필수 · 섬별 출발항, 운항 일정 및 물때 확인. Founder 최종 좌표 2026-10-29.',
    markerPos: { overview: { x: 0.425, y: 0.810, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } },
  // Founder 결정 2026-10-29: 금오도·개도 지도 마커 표시. 거문도·백도 지도 범위 밖 = offMap 목록에만 표시.
  { code: 'geumo_island',    name_ko: '금오도', zone: 7, lat: null, lng: null, status: 'ferry', coordVerified: false,
    coordNote: '배편 필수 · 섬별 출발항, 운항 일정 및 물때 확인. Founder 최종 좌표 2026-10-29.',
    markerPos: { overview: { x: 0.662, y: 0.877, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } },
  { code: 'geomundo_island', name_ko: '거문도', zone: 7, lat: null, lng: null, status: 'ferry', coordVerified: false,
    offMap: true,
    coordNote: '배편 필수 · 섬별 출발항, 운항 일정 및 물때 확인. Founder 결정 2026-10-29: 수채화 지도 이미지 범위 밖 — 지도 마커 미표시, Zone 7 별도 목록에만 표시.' },
  { code: 'baekdo_island',   name_ko: '백도',   zone: 7, lat: null, lng: null, status: 'ferry', coordVerified: false,
    offMap: true,
    coordNote: '배편 필수 · 거문도와 독립 place_id 유지. Founder 결정 2026-10-29: 수채화 지도 이미지 범위 밖 — 지도 마커 미표시, Zone 7 별도 목록에만 표시.' },
  { code: 'gaedo_island',    name_ko: '개도',   zone: 7, lat: null, lng: null, status: 'ferry', coordVerified: false,
    coordNote: '배편 필수 · 섬별 출발항, 운항 일정 및 물때 확인. Founder 최종 좌표 2026-10-29.',
    markerPos: { overview: { x: 0.512, y: 0.828, confidence: 'PROVISIONAL', status: 'PROVISIONAL' } } },
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
// 공개 모드: HIGH confidence만 반환
// QA Preview (includeProvisional=true): HIGH + PROVISIONAL 반환
export function getMarkersForImage(imageKey, { includeProvisional = false } = {}) {
  return YEOSU_PLACES.filter(p => {
    if (p.hidden || !p.markerPos || !p.markerPos[imageKey]) return false;
    const conf = p.markerPos[imageKey].confidence;
    return conf === 'HIGH' || (includeProvisional && conf === 'PROVISIONAL');
  });
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
