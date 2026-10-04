# SOUL_CABLE_CAR_PLACE_HERO_VISUAL_TRUST_LAYER_V1_EVIDENCE

**Status:** IMPLEMENTED / VERIFIED / CLOSED  
**Date:** 2026-10-04  
**Authoritative Checkpoint:** main @ `1ecffcf` (pre-commit)  
**Founder Approval:** OPTION A APPROVED

---

## 1. FOUNDER SOURCE PATHS

| 장소 | 소스 경로 |
|---|---|
| Cable Car | `C:\DREAM TOWN\Assets\SOUL\Yeosu_Cable_Car\Place_Hero\SOUL_YEOSU_CABLECAR_PLACE_HERO_V01.png` |
| Hyangiram | `C:\DREAM TOWN\Assets\SOUL\Hyangiram\Place_Hero\SOUL_HYANGIRAM_PLACE_HERO_V01.png` |
| Odongdo | `C:\DREAM TOWN\Assets\SOUL\Odongdo\Place_Hero\SOUL_ODONGDO_PLACE_HERO_V01.png` |

---

## 2. IMPORT — SOURCE → DESTINATION PROVENANCE

| 소스 파일 | 대상 경로 | 원본 bytes | 복사 bytes | 상태 |
|---|---|---|---|---|
| `SOUL_YEOSU_CABLECAR_PLACE_HERO_V01.png` | `dreamtown-frontend/public/images/soul/place-hero/cablecar.png` | 3,083,553 | 3,083,553 | ✓ EXACT |
| `SOUL_HYANGIRAM_PLACE_HERO_V01.png` | `dreamtown-frontend/public/images/soul/place-hero/hyangiram.png` | 3,195,094 | 3,195,094 | ✓ EXACT |
| `SOUL_ODONGDO_PLACE_HERO_V01.png` | `dreamtown-frontend/public/images/soul/place-hero/odongdo.png` | 2,882,218 | 2,882,218 | ✓ EXACT |

**이미지 수정 없음** — regenerate / crop / upscale / recolor 없음. 원본 바이트 보존.

---

## 3. CABLE CAR UI CONNECTION

**파일:** `dreamtown-frontend/src/pages/SoulCableCarPage.jsx:51-55`

```js
// Source: C:\DREAM TOWN\Assets\SOUL\{Place}\Place_Hero\ (Founder-designated SOUL assets)
// Hyangiram / Odongdo imported but not wired — connected when their pages ship.
const PLACE_HERO_MAP = {
  cablecar: '/images/soul/place-hero/cablecar.png',
};
```

**이전 상태:**
```js
const PLACE_HERO_MAP = {};
```

**Hyangiram / Odongdo:** import 완료 (URL-served). UI 미연결 — 해당 Living Detail Page 개발 시 연결.

---

## 4. VISUAL IDENTITY RULE CORRECTION

이전 Audit에서 `"소원이 캐릭터 금지"` 표현 기록됨. Founder 수정:

**정확한 규칙:**
> Place Hero는 캐릭터 중심 구도를 피하고 장소 정체성을 우선한다.  
> 인물이 존재할 수 있으나 장소보다 우세해서는 안 된다.

**근거:** Founder 승인 Cable Car Hero(`SOUL_YEOSU_CABLECAR_PLACE_HERO_V01.png`)에  
뒷모습 여성 실루엣이 포함되어 있으나 도시+바다+섬+교량 파노라마가 시각적으로 우세함.

---

## 5. BUILD VERIFICATION

| 항목 | 결과 |
|---|---|
| 빌드 모듈 수 | 690 |
| 빌드 오류 | 0 |
| 새 bundle | `index-MD45mjvA.js` (1,241.05 kB) |
| PLACE_HERO_MAP URL in bundle | `/images/soul/place-hero/cablecar.png` — 1회 확인 ✓ |

---

## 6. BROWSER / ASSET VERIFICATION

**Dev server:** Vite soul-preview (port 3002)

| 자산 URL | HTTP Status | Bytes |
|---|---|---|
| `/images/soul/place-hero/cablecar.png` | **200 OK** | 3,083,553 ✓ |
| `/images/soul/place-hero/hyangiram.png` | **200 OK** | 3,195,094 ✓ |
| `/images/soul/place-hero/odongdo.png` | **200 OK** | 2,882,218 ✓ |

**V1 Content Markers (regression check):**

| 마커 | bundle 내 존재 |
|---|---|
| `SOUL이 보는 내 여행` | ✓ |
| `나에게 중요한 것` | ✓ |
| `더 알고 싶을 때` | ✓ |
| `크리스탈 캐빈은 뭐가 달라요` | ✓ |
| `케이블카와 함께 어디를 둘러볼까요` | ✓ |
| `17,000원` | ✓ |
| `061-664-7301` | ✓ |
| `/images/soul/place-hero/cablecar.png` | ✓ |

**Evidence Safety — 금지 표현 7종:**  
`예약 불필요 / 오전 일찍 / 도보 약 5분 / 3~4시간 / 도보 불가 / 자산정류장 주차장에 차` — **0건**

---

## 7. HERO BEHAVIOR VERIFICATION

| 항목 | 결과 |
|---|---|
| heroSrc 로직 | `PLACE_HERO_MAP['cablecar'] = '/images/soul/place-hero/cablecar.png'` → heroSrc ≠ null |
| img 렌더링 | `{heroSrc && <img src={heroSrc} ... />}` → 렌더링 발동 |
| 그라디언트 fallback | heroSrc 있을 시 img 위에 표시. `onError` 시 img 숨김 → 그라디언트 자동 표시 |
| 비율 | 1672×941 (16:9) → Hero `minHeight: 200px` + `objectFit: cover` 적용 |
| Yeosu 인식 | 도시+바다+섬+교량 파노라마 → 즉시 인식 가능 |
| Cable Car 인식 | 전경 빨간 캐빈 클로즈업 → 즉시 인식 가능 |

---

## 8. NOT IMPLEMENTED / NOT CHANGED

| 항목 | 상태 |
|---|---|
| 이미지 생성 | 없음 |
| Legacy Yeosu Origin 복원 | 없음 |
| Hero copy | 변경 없음 |
| 페이지 hierarchy | 변경 없음 |
| Basic Information | 변경 없음 |
| Judgment / Journey / Question Discovery | 변경 없음 |
| Backend / routes / schema | 변경 없음 |
| Hyangiram UI 연결 | 없음 (import만) |
| Odongdo UI 연결 | 없음 (import만) |

---

## 9. CURRENT NEXT ACTION

`SOUL_PLACE_HERO_VISUAL_SYSTEM_FOUNDER_REVIEW`

목적: Founder가 실제 Cable Car 페이지에서 승인된 Hero를 확인하고  
이 Visual System이 향후 SOUL 장소 패턴으로 확정되는지 결정.
