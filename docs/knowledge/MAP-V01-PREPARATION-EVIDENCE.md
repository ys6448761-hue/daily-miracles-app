# Map V0.1 Preparation Evidence

**Date**: 2026-10-26  
**Status**: MAP_V01_PREPARATION_READY  
**Verdict**: 구현 착수 가능 — 지도 배경 이미지 수령 즉시 마운트

---

## §1 Founder Decision 반영 요약

| 항목 | Founder 결정 | 구현 영향 |
|------|------------|---------|
| OI-MAP-1 중앙시장 | 지도 표시 **제외** | jungang_market 마커 미생성 |
| OI-MAP-2 신규 장소 | 고소동·수산시장 **우선**, SOUL 미승격 | 두 장소 탐색 가능 마커만 |
| OI-MAP-3 권역 | 7개 전체 지도 표현, **원도심 우선 상세** | 상세 bounding box 1개 (원도심) |
| OI-MAP-4 좌표 | 신뢰 출처 조사, 불확실 시 미검증 유지 | 고소동 VERIFIED, 수산시장 UV-2 |
| OI-MAP-5 배편 | 배편 배지 + SOUL 추천 제외 | 섬 3곳 별도 마커 타입 |

---

## §2 좌표 검증 결과

### 고소동 천사벽화골목 ✅ VERIFIED

| 항목 | 값 |
|------|---|
| lat | 34.7389997 |
| lng | 127.7411688 |
| 주소 | 전남 여수시 고소동 268 |
| 출처 | mom-mom.net 페이지 NAVER 정적 지도 마커 (pos 파라미터 기준) |
| 확인일 | 2026-10-26 |
| 비고 | "고소동 벽화마을"로 표기. "천사벽화골목"과 동일 장소로 판단 (지역 동일, 1004m 구간 골목) |

### 여수 수산시장 🟡 UV-2 유지

| 항목 | 값 |
|------|---|
| lat | — (미확인) |
| lng | — (미확인) |
| 주소 | 전남 여수시 여객선터미널길 24 (교동) / 우편번호 59735 |
| 연락처 | 061-662-7268 |
| 출처 | ktriptips.com/kor/shopping/2783118 (한국관광공사 contentId 2783118) |
| 확인일 | 2026-10-26 |
| 조사 현황 | mom-mom.net·nominatim·koreacharts 등 다수 출처 시도. 좌표 포함 페이지 미발견. |
| 조치 | 구현 시 미검증 placeholder 마커로 처리. Founder NAVER 측정 또는 Kakao Geocoding API 활용 권고. |

---

## §3 이미지 자산 현황

### 현재 존재하는 파일 (VERIFIED)

| 경로 | 파일명 | 용도 |
|------|-------|------|
| `dreamtown-frontend/public/images/muyojeong/` | `muyojeong-mobile-home-hero-v1.png` | 무여정 홈 Hero |
| `dreamtown-frontend/public/images/soul/place-hero/` | `cablecar.png` | 케이블카 |
| `dreamtown-frontend/public/images/soul/place-hero/` | `hyangiram.png` | 향일암 |
| `dreamtown-frontend/public/images/soul/place-hero/` | `odongdo.png` | 오동도 |
| `dreamtown-frontend/public/images/soul/place-hero/` | `yisunsin.png` | 이순신광장 |
| `dreamtown-frontend/public/images/soul/place-hero/` | `dolsan-nightscape.png` | 돌산공원 |

**Vite 경로 주의**: 브라우저 URL `/images/soul/place-hero/cablecar.png` → `dreamtown-frontend/public/images/soul/place-hero/cablecar.png`

### 지도 배경 이미지 — ASSET_MISSING

| 파일 | 상태 | 비고 |
|------|------|------|
| `dreamtown-frontend/public/images/muyojeong/map/` 디렉토리 | **미존재** | |
| `yeosu-overview-v1.png` (전체 권역 지도) | **미존재** | Founder 제공 필요 |
| `zone-wondomsim-v1.png` (원도심 확대) | **미존재** | Founder 제공 필요 |

---

## §4 이미지 사양 요구서 (Founder 제공용)

### 4-1. 여수 전체 지도 (`yeosu-overview-v1.png`)

| 항목 | 사양 |
|------|------|
| 파일명 | `yeosu-overview-v1.png` |
| 저장 경로 | `dreamtown-frontend/public/images/muyojeong/map/` |
| 권장 크기 | 750×950px (1배율) / 1500×1900px (2배율 @2x 권장) |
| 포맷 | PNG 또는 WebP |
| 배경 | 투명 또는 단색 (마커 오버레이 고려) |
| 포함 요소 | 7개 권역 경계 + 주요 지형·지물: |
| | • 이순신대교 (여수↔광양 연결) |
| | • 돌산대교 (본섬↔돌산도) |
| | • 소호동동다리 (소호항 연결) |
| | • 장도 (예술의 섬, 소호 인근) |
| | • 돌산도 윤곽 (향일암·돌산공원 포함) |
| | • 사도·하화도 (배편 필수 섬) |
| | • 여자만 (서쪽 만 윤곽) |
| | • 화양반도 |
| 마커 미포함 | 일러스트에 장소 마커를 그리지 않음. 마커는 코드에서 오버레이. |
| 좌표 기준점 | 전체 지도 4모서리 좌표를 Founder가 제공 (bounding box 확정용) |

**bounding box 추정값** (픽셀→좌표 변환 기준, Founder 확인 필요):  
`lat: 34.58~34.82, lng: 127.65~127.90`

---

### 4-2. 원도심 확대 지도 (`zone-wondomsim-v1.png`)

| 항목 | 사양 |
|------|------|
| 파일명 | `zone-wondomsim-v1.png` |
| 저장 경로 | `dreamtown-frontend/public/images/muyojeong/map/` |
| 권장 크기 | 750×750px (1배율) / 1500×1500px (2배율) |
| 권역 bounding box | lat 34.730~34.765, lng 127.725~127.760 (추정, Founder 확인 필요) |
| 포함 장소 표시 기준점 | 이순신광장·하멜등대·낭만포차·오동도·케이블카·자산공원·해양공원·엑스포공원·스카이타워 |
| 마커 미포함 | 배경 일러스트만, 마커는 코드 오버레이 |

---

## §5 구현 준비 상태

### 즉시 착수 가능 (이미지 없어도)

| 파일 | 내용 | 비고 |
|------|------|------|
| `services/yeosuMapData.js` | 35개 장소 좌표·상태·권역 데이터 상수 | 고소동 VERIFIED / 수산시장 placeholder |
| `dreamtown-frontend/src/components/YeosuMapSelector.jsx` | 권역 카드 + 마커 렌더 (fallback div 모드) | 이미지 없이 색상 구역으로 fallback |
| `dreamtown-frontend/src/pages/MuyojeongHomePage.jsx` EXTEND | mapMode 토글 + YeosuMapSelector 마운트 | 기존 칩 로직 무변경 |

### 이미지 수령 후 추가 작업

| 작업 | 선행 조건 |
|------|----------|
| 배경 이미지 바인딩 (`img src` 적용) | Founder 이미지 제공 |
| Pixel→좌표 변환 공식 캘리브레이션 | bounding box 확정 |
| 7개 권역 클릭 영역 정의 | 전체 지도 이미지 확정 |

### 구현 금지

- 지도 배경 이미지 없이 완성된 서비스로 배포 금지
- SOUL 항로 로직 변경 금지 (신규 장소 SOUL 미승격)
- CAR GOVERNANCE_HOLD 유지
- Production 배포 / DB·Schema 변경 금지

---

## §6 미검증 항목 (업데이트)

| ID | 항목 | 상태 | 조치 |
|----|------|------|------|
| UV-1 | 고소동 천사벽화골목 lat/lng | **RESOLVED** ✅ | 34.7389997, 127.7411688 (NAVER 마커) |
| UV-2 | 여수 수산시장 lat/lng | 🟡 유지 | placeholder 처리 + Founder Kakao Geocoding 권고 |
| UV-3 | 권역 bounding box 경계값 | 추정값 사용 | 이미지 제공 후 Founder 육안 확인 |
| UV-4 | 배경 일러스트 ↔ 마커 정합성 | ASSET_MISSING | 이미지 제공 후 확인 |
| UV-5 | 검증 필요 14개 장소 운영·예약 | V0.2 이후 | |
| UV-6 | 배편 현행 시간표 | V0.2 이후 | |

---

## §7 판정

```
MAP_V01_PREPARATION_READY
```

- 코드 구조 (yeosuMapData.js + YeosuMapSelector.jsx + MuyojeongHomePage EXTEND) 즉시 착수 가능
- 지도 배경 이미지 ASSET_MISSING → 완성된 서비스 배포 불가 (이미지 수령 후 마운트)
- 여수 수산시장 UV-2 유지 → placeholder 마커로 구현, 좌표 확정 후 교체
- Production 배포 / DB 변경 금지 유지
