# Map V0.1 Design Decision Sheet

**Date**: 2026-10-26  
**Status**: DECISION_PENDING — Founder 응답 대기  
**Guardian 권고**: 아래 각 항목에 명시 (권고는 Founder 결정을 대체하지 않음)

---

## §1 장소 카운트 정정

### 불일치 원인

| 항목 | Inventory 보고 | 정정값 |
|------|--------------|-------|
| 전체 후보 합계 | 34개 (오류) | **35개** |
| 🟡 검증 필요 | 13개 (오류) | **14개** |
| summary 가시 합계 | 33개 (⛔ 누락) | 35개 |

**오류 원인**: Section B에서 신규 검증 필요를 13개로 잘못 집계 (돌산갓장터마을 누락).  
summary 표에서 ⛔ TG 추천 제외(중앙시장) 행을 별도 기재하지 않아 가시 합계 33.

### 정정된 상태별 합계 (총 35개)

| 상태 | 수 | 장소 목록 |
|------|----|----------|
| ✅ 항로 추천 가능 | 12 | 이순신광장·낭만포차·하멜등대·오동도·케이블카·종포해양공원·엑스포공원·스카이타워·자산공원·돌산대교·돌산공원·향일암 |
| ⛔ TG 추천 전면 제외 | 1 | 중앙시장 |
| 🔵 탐색 가능 | 5 | 고소동벽화골목·수산시장·무슬목·아쿠아플라넷·유월드루지 |
| 🟡 검증 필요 | 14 | 돌산갓장터마을·장도·소호요트장·소호동동다리·이순신마리나·북한반잠수정전시관·가사리생태공원·여자만갯벌/해넘이·섬달천·화양드라이브·서틀러다육식물원·장척갯벌체험·봉황산자연휴양림·예술랜드리조트 |
| 🔴 배편 필수 | 3 | 사도·하화도·화정도서 |
| **합계** | **35** | |

---

## §2 기존 SOUL 13개 장소 — 상태 명시

| place_code | name_ko | SOUL Phase | TG 추천 | zone | lat | lng |
|-----------|---------|-----------|---------|------|-----|-----|
| `hyangiram` | 향일암 | ✅ Phase 1 완료 | ✅ 가능 | S-1 | 34.5914 | 127.8038 |
| `dolsan_daegyo` | 돌산대교 | ✅ Phase 1 완료 | ✅ 가능 | S-2 | 34.7395 | 127.7456 |
| `dolsan_nightscape` | 돌산공원(야경) | ✅ Phase 1 완료 | ✅ 가능 | S-3 | 34.7289 | 127.7472 |
| `lee_soon_shin_plaza` | 이순신광장 | ✅ Phase 2 완료 | ✅ 가능 | W-1 | 34.7463 | 127.7356 |
| `romantic_pojangmacha` | 낭만포차거리 | — | ✅ 가능 | W-2 | 34.7421 | 127.7398 |
| `jungang_market` | 중앙시장 | — | ⛔ 전면 제외 | W-3 | 34.7450 | 127.7370 |
| `yeosu_expo_park` | 엑스포공원 | — | ✅ 가능 | N-1 | 34.7520 | 127.7450 |
| `sky_tower` | 스카이타워 | — | ✅ 가능 | N-2 | 34.7512 | 127.7468 |
| `marine_park` | 종포해양공원 | — | ✅ 가능 | N-3 | 34.7488 | 127.7475 |
| `odongdo` | 오동도 | ✅ Phase 1 완료 | ✅ 가능 | E-1 | 34.7602 | 127.7655 |
| `cablecar` | 케이블카 | ✅ Phase 1 완료 | ✅ 가능 | E-2 | 34.7428 | 127.7562 |
| `jaisan_park` | 자산공원 | — | ✅ 가능 | E-3 | 34.7480 | 127.7540 |
| `hamel_lighthouse` | 하멜등대 | ✅ Phase 1 완료 | ✅ 가능 | — | 34.7364 | 127.7471 |

---

## §3 미결 항목 OI-MAP-1~5 — Founder Decision Sheet

### OI-MAP-1: 중앙시장 지도 표시 여부

**현황**: TG 추천 전면 제외 상태 (travelGuideService에서 필터링됨).  
지도에 마커를 표시해도 SOUL 코스 추천에는 등장하지 않음.

**Guardian 권고**: 원도심 탐색 후보로 지도에 표시 (마커 색상 회색/비활성). TG 추천 제외는 유지.  
→ 사용자가 선택해도 코스에 미등장한다는 UX 설명 필요.

**⬜ Founder Decision**:  
- [ ] A. 지도에 표시 (비활성 마커, TG 제외 유지)  
- [ ] B. 지도에서도 숨김  
- [ ] C. 기타: ___

---

### OI-MAP-2: 신규 탐색 가능 5개 — 1차 추가 우선순위

탐색 가능 5개: 고소동벽화골목 · 수산시장 · 무슬목 · 아쿠아플라넷 · 유월드루지

**Guardian 권고**: **고소동 벽화골목·수산시장 우선** (원도심 해안권에 위치, 도보 접근 가능, lat/lng 검증 가능).  
무슬목은 돌산권이나 차량 또는 버스 이동 필요 (이동수단 미검증).  
아쿠아플라넷·유월드루지는 실내/계절 시설로 SOUL knowledge 구축 추가 작업 필요.

**⬜ Founder Decision**:  
- [ ] A. 고소동 벽화골목·수산시장 우선 추가 (Guardian 권고 동의)  
- [ ] B. 무슬목 우선 추가  
- [ ] C. 5개 전부 V0.1에 포함  
- [ ] D. 신규 추가 없이 기존 12개만  
- [ ] E. 기타: ___

---

### OI-MAP-3: V0.1 지도 권역 범위

Founder 제안 7개 권역:
1. 원도심 해안권
2. 오동도·엑스포권
3. 돌산권
4. 향일암권
5. 여천·소호·장도권
6. 화양·여자만권
7. 섬섬길권 (배편 필수)

**Guardian 권고**: 7개 권역 모두 전체 지도에 표현. 단, 권역 확대 상세 지도는 우선순위 권역부터 단계적 구현.  
V0.1에서 상세 지도 구현 권역: **1·2·3·4** (기존 SOUL 장소 집중).  
5·6·7은 전체 지도에서 권역 영역만 표시, 상세 마커 V0.2에서 추가.

**⬜ Founder Decision**:  
- [ ] A. Guardian 권고 동의 (전체 권역 표시 + 상세 4개 우선)  
- [ ] B. V0.1은 1·2·3·4만 표시 (5·6·7 전체 지도에도 미표시)  
- [ ] C. 7개 권역 전부 상세 지도까지  
- [ ] D. 기타: ___

---

### OI-MAP-4: 신규 장소 lat/lng 확인

신규 탐색 가능 중 좌표 미검증:
- 고소동 천사벽화골목: 여수시 고소동 소재, NAVER 지도 검색 필요
- 여수 수산시장: 여수시 서동 소재, NAVER 지도 검색 필요

**Guardian 권고**: Founder가 NAVER 지도에서 두 장소를 검색해 좌표를 확인 후 제공. Claude Code가 좌표를 추정하지 않음.

**⬜ Founder Action Required**:  
- [ ] NAVER 지도 → 고소동 천사벽화골목 좌표 확인 후 제공  
- [ ] NAVER 지도 → 여수 수산시장 좌표 확인 후 제공  
- [ ] 당장 추가 불필요 (OI-MAP-2에서 D 또는 후순위 선택 시)

---

### OI-MAP-5: 배편 필수 권역 표시 방식

사도·하화도·화정도서는 배편 없이 접근 불가.  
SOUL이 이동시간·배편 시간표를 검증하지 않았음.

**Guardian 권고**:  
1. 전체 지도에서 섬 위치를 표시하되 "⛴ 배편 필요" 배지 부착  
2. 마커 탭 시 SOUL 코스 추천 대신 "배편 예약 후 방문 권장" 안내  
3. SOUL 맞춤 항로 생성에서 자동 제외 (이동시간 미검증)

**⬜ Founder Decision**:  
- [ ] A. Guardian 권고 동의 (배편 배지 + 추천 제한)  
- [ ] B. V0.1에서 배편 권역 완전 제외  
- [ ] C. 기타: ___

---

## §4 실제 이미지 자산 현황

### 현재 존재하는 파일

| 경로 | 파일명 | 용도 |
|------|-------|------|
| `dreamtown-frontend/public/images/muyojeong/` | `muyojeong-mobile-home-hero-v1.png` | 무여정 홈 Hero |
| `dreamtown-frontend/public/images/soul/place-hero/` | `cablecar.png` | 케이블카 Place Hero |
| `dreamtown-frontend/public/images/soul/place-hero/` | `hyangiram.png` | 향일암 Place Hero |
| `dreamtown-frontend/public/images/soul/place-hero/` | `odongdo.png` | 오동도 Place Hero |
| `dreamtown-frontend/public/images/soul/place-hero/` | `yisunsin.png` | 이순신광장 Place Hero |
| `dreamtown-frontend/public/images/soul/place-hero/` | `dolsan-nightscape.png` | 돌산공원 Place Hero |

**중요**: Vite 프론트엔드의 `public` 기준 경로는 `dreamtown-frontend/public/` (루트 `public/`과 다름).  
브라우저 URL `/images/soul/place-hero/cablecar.png` → `dreamtown-frontend/public/images/soul/place-hero/cablecar.png`

### 지도 이미지 현황

| 항목 | 상태 |
|------|------|
| 여수 전체 지도 배경 일러스트 | **미존재** — Founder 제공 필요 |
| 권역별 지도 배경 | **미존재** — Founder 제공 필요 |
| 지도 `map/` 디렉토리 | **미존재** |

### 제안 저장 경로 (Founder 일러스트 제공 시)

```
dreamtown-frontend/public/images/muyojeong/map/
├── yeosu-overview-v1.png          ← 전체 권역 지도
├── zone-wondomsim-v1.png          ← 원도심 해안권 확대
├── zone-odongdo-expo-v1.png       ← 오동도·엑스포권 확대
├── zone-dolsan-v1.png             ← 돌산권 확대
└── zone-hyangiram-v1.png          ← 향일암권 확대
```

---

## §5 Map V0.1 최소 구현 범위 정리

### 구현 가능 (Founder 결정 후 즉시 착수)

| 항목 | 내용 | 선행 조건 |
|------|------|----------|
| `yeosuMapData.js` | 권역 정의 + VERIFIED 35개 좌표 | OI-MAP-3 권역 범위 결정 |
| `YeosuMapSelector.jsx` | 권역 카드 + 마커 + 상태 표시 | 배경 일러스트 없어도 fallback div 가능 |
| `MuyojeongHomePage.jsx` EXTEND | mapMode 토글 + YeosuMapSelector 마운트 | 위 2개 완료 후 |
| 중앙시장 마커 | 비활성 표시 여부 | OI-MAP-1 결정 |
| 배편 배지 | 섬 마커 표시 방식 | OI-MAP-5 결정 |

### 구현 보류 (Founder 결정 또는 자산 필요)

| 항목 | 보류 이유 |
|------|----------|
| 배경 일러스트 마운트 | Founder 이미지 제공 필요 (현재 미존재) |
| 고소동·수산시장 마커 | lat/lng 미검증 (OI-MAP-4) |
| 무슬목·아쿠아플라넷·유월드루지 마커 | 우선순위 결정 필요 (OI-MAP-2) |
| 검증 필요 14개 마커 | 정보 불충분 — V0.2 이후 |
| 배편 필수 3개 상세 | V0.1 포함 여부 결정 필요 (OI-MAP-5) |
| 여행 시작 시간 UI | V0.2 미구현 요구사항으로 분리 확정 |
| 신규 SOUL knowledge | 신규 장소는 SOUL knowledge 구축 별도 작업 필요 |

### 회귀 위험 (LOW)

- 기존 칩 선택 → routePlaces 상태 공유 (EXTEND only, 기존 로직 무변경)
- SOUL API 경로 무변경
- CAR GOVERNANCE_HOLD 유지

---

## §6 미검증 항목 전체 목록

| ID | 항목 | 검증 방법 |
|----|------|----------|
| UV-1 | 고소동 천사벽화골목 lat/lng | Founder NAVER 측정 |
| UV-2 | 여수 수산시장 lat/lng | Founder NAVER 측정 |
| UV-3 | 권역 bounding box 경계값 (추정값 사용) | 마커 배치 후 Founder 육안 확인 |
| UV-4 | 배경 일러스트와 마커 정합성 | 일러스트 제공 후 확인 |
| UV-5 | 검증 필요 14개 장소 운영시간·입장·예약 | 각 장소 공식 출처 확인 필요 |
| UV-6 | 사도·하화도 배편 현행 시간표 | 백야선착장 공식 운항 일정 확인 |
