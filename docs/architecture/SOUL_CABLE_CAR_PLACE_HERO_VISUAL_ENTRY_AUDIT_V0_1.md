# SOUL_CABLE_CAR_PLACE_HERO_VISUAL_ENTRY_AUDIT_V0_1

**Status:** ENTRY_AUDIT_COMPLETE / FOUNDER_DECISION_REQUIRED — CORRECTION ISSUED  
**Date:** 2026-10-04  
**Authoritative Checkpoint:** main @ `bd20e8f`  
**Scope:** Knowledge-first visual audit. No UI modification. No image generation.

---

## ⚠️ CORRECTION (2026-10-04 — Founder-provided source)

**Founder confirmed existing SOUL Asset location:**  
`C:\DREAM TOWN\Assets\SOUL\`

This source was NOT inspected in the initial audit. Inspection completed immediately upon notification.

**Corrected primary finding:**

| 항목 | 초기 Audit | 수정 후 |
|---|---|---|
| Primary Hero candidate | `cablecar-star-intro.png` (B EXISTS_NOT_CONNECTED) | `SOUL_YEOSU_CABLECAR_PLACE_HERO_V01.png` (C SOURCE_EXISTS_NOT_STRUCTURED) |
| Gap classification | B CONNECTION_GAP | C SOURCE_EXISTS_NOT_STRUCTURED → B (after import) |
| Asset purpose | App launch general brand image | **Purpose-built SOUL Place Hero** |
| Format | 1080×1920 (9:16 portrait) | **1672×941 (~16:9 landscape) — Hero 최적** |
| Quality tier | Approved brand asset | **Founder-designated SOUL Hero** |

**See Section 13 (CORRECTION — Founder-Provided Source) for full findings.**

---

## 1. EXISTING CABLE CAR VISUAL KNOWLEDGE

All entries sourced from existing repository. No external research performed.

### 1.1 Place Identity (Verified Sources)

**Source: `services/soyeowoolService.js:128`**
> `cablecar: '여수 바다 위를 가로지르는 해상 케이블카예요. 케이블카 안에서 바다와 섬·항구를 내려다볼 수 있어요.'`

**Source: `config/thumbnail/cablecar.json`**
- Location: `yeosu_cablecar`  
- Scene: Interior of red cable car cabin, moving over Yeosu sea at night  
- Cable structure: cable lines, at least two cabins, night ocean below, city lights reflection, bridge in distance  
- Color: warm red interior / deep blue night sea / warm yellow city glow  
- DreamTown style: 2D illustration, watercolor texture, soft grain, Ghibli-inspired

**Source: `SoulCableCarPage.jsx` — Quick Basic 6 FactRows (V1)**
- 자산(해야) ↔ 돌산(놀아) — 도심↔섬 양방향 탑승
- 편도 약 13분 전후
- 일반(8인) / 크리스탈(6인)
- 일반 대인 왕복 17,000원~
- 09:30~21:30 운영 (기상·강풍·정비 시 변경)
- 자산·돌산 양쪽 접근 가능

**Source: `docs/knowledge/YEOSU_2026_VERIFICATION_BATCH_02.md`**
- 돌산공원 주소: 여수시 돌산읍 우두리 산 1 — 돌산대교·이순신광장·장군도 조망 가능한 야경 명소

**Source: `public/images/canonical/source/MANIFEST.md`**
- cablecar 카테고리: `composition: interior stillness with distant longing`
- 추정 subject: "海가 보이는 창 → 별" (내부→창→바다→별 구도)

**Source: `public/outputs/prompts/cablecar/01_confusion_cablecar_prompt.txt`**
- "A red cable car moving over the sea in Yeosu at night"
- "cable lines, at least two cable car cabins, night ocean below, city lights reflection, bridge in distance"

### 1.2 Place Physical Structure (지리적 사실)

| 항목 | 지식 | 소스 |
|---|---|---|
| 위치 | 여수 바다 위 (해상) | soyeowoolService |
| 구간 | 자산(해야) ↔ 돌산(놀아) | SoulCableCarPage V1 Quick Basic |
| 성격 | 도심(자산) ↔ 섬(돌산) 연결 | SoulCableCarPage V1 |
| 야경 관련성 | 돌산공원이 야경 명소 — 케이블카와 연결 | YEOSU batch 02 |
| 교량 | 돌산대교 — 케이블카 근처, 야경 상징 | cablecar 프롬프트 "bridge in distance" |
| 운행 시간 | 09:30~21:30 — 야간 운행 포함 | SoulCableCarPage V1 |

---

## 2. SURVIVING VISUAL ASSET INVENTORY

### Asset Group A: `public/assets/brand/core/cablecar-star-intro.png`

| 항목 | 값 |
|---|---|
| 경로 | `public/assets/brand/core/cablecar-star-intro.png` |
| 파일 수 | 1 |
| 포맷 | PNG |
| 크기 | 4,638,717 bytes (~4.4MB) |
| 해상도 | 1080 × 1920 (9:16 portrait — 모바일 풀스크린 비율) |
| 내용 | **외부 관점** — 야간 케이블카 시스템. 여러 캐빈이 케이블 위에 위치. 어두운 바다 위를 가로지름. 돌산대교 보임. 도시/섬 야경. 하늘에 별 + 빛줄기. 황금빛 캐빈 반사. DreamTown 수채화/일러스트 스타일. |
| 스타일 | 2D 일러스트 / 수채화 / Ghibli 분위기 — photorealistic 아님 |
| Provenance | UNRECORDED — MANIFEST에 등재 없음 |
| 현재 참조 | **`AppLaunch.jsx:108`** (video fallback full-screen) + `AppLaunch.jsx:152` (저투명도 배경) + `StarBirth.jsx:206` (비디오 — mp4 버전) |
| SOUL Hero 참조 | **없음** — `PLACE_HERO_MAP`에 미등재 |
| **적합성 판단** | **B. HERO_CANDIDATE (EXISTS_NOT_CONNECTED)** |

**주요 근거:** 외부 관점, 여수 바다 위 케이블카 구조, 돌산대교 포함, DreamTown 스타일 일치, 현재 production AppLaunch에서 사용 중인 승인된 자산.

---

### Asset Group B: `public/images/canonical/source/cablecar/` (25 PNG)

| 항목 | 값 |
|---|---|
| 경로 | `public/images/canonical/source/cablecar/` |
| 파일 수 | 25 |
| 포맷 | PNG |
| 해상도 | 1024 × 1536 (2:3) |
| 내용 | **내부 관점** — 소원이(소우니)가 캐빈 내부 창가에 앉아 창 너머 별을 바라봄. 감정별(confusion/pause/calm/curiosity/fragile_hope) × 보석(citrine/sapphire/emerald/ruby/diamond) 5×5 조합. |
| Provenance | MANIFEST 등재 — Category A, selected_v0 |
| 현재 참조 | WishArt 썸네일 파이프라인 / star-cache |
| **적합성 판단** | **C. KNOWLEDGE_REFERENCE_ONLY** — Hero 부적합 |

**부적합 이유:** 내부 관점은 Place 신뢰 신호가 아님. 소원이 캐릭터 포함 → WishArt 별 경험 맥락, SOUL Hero 맥락과 다름. 2:3 비율은 Hero 가로 레이아웃 부적합.

---

### Asset Group C: `public/images/fallback/star-yeosu-cablecar.svg`

| 항목 | 값 |
|---|---|
| 경로 | `public/images/fallback/star-yeosu-cablecar.svg` |
| 포맷 | SVG (벡터) |
| 해상도 | 1024 × 1024 (1:1 정사각형) |
| 내용 | 추상적 야경 — 케이블카 캐빈 외곽선 + 별 + 도시 불빛 점 + 바다 반사. 추상 수준. |
| 현재 참조 | star fallback 아이콘 용도 |
| **적합성 판단** | **D. NOT_SUITABLE** — Hero로 사용하기에 추상도가 너무 높음 |

---

### Asset Group D: `public/images/og/cablecar.jpg` — DELETED

| 항목 | 값 |
|---|---|
| 상태 | **삭제됨** — Founder 결정 2026-10-04 (`c7d1e38`) |
| 폴더 | `public/images/og/` 폴더 자체 없음 (확인됨) |
| **분류** | **PROHIBITED** — git에서 복원 금지 |

---

## 3. CURRENT HERO CONNECTION TRACE

```
SoulCableCarPage.jsx:54
  const PLACE_HERO_MAP = {};
    ↓
SoulCableCarPage.jsx:431
  const heroSrc = PLACE_HERO_MAP['cablecar'] ?? null;
    ↓
  heroSrc = null
    ↓
SoulCableCarPage.jsx:622-630
  {heroSrc && <img src={heroSrc} ... />}
    → img block 렌더링 안 됨
    ↓
SoulCableCarPage.jsx:630-
  <div style={{ minHeight: '200px' }}>
    → gradient background (dark DreamTown dark fallback)
```

**판정: CONNECTION_GAP** — 이미지가 없어서 그라디언트가 나오는 것이 아님. 연결이 끊어진 것임.

근거: `cablecar-star-intro.png`이 `public/assets/brand/core/`에 존재하며 AppLaunch에서 현재 사용 중이나, `PLACE_HERO_MAP`에 `cablecar` 키가 등록되지 않았음.

**"이미지가 없다" ≠ "이미지가 존재하지 않는다"**

---

## 4. PLACE IDENTITY DEFINITION

지식 기반(기존 소스만) 여수해상케이블카 Hero가 전달해야 할 내용:

### 2초 안에 여행자가 읽어야 할 것

1. **Where am I?** → 바다 위 — 해상(海上). 육지가 아니라 바다를 가로지름
2. **What is distinctive?** → 케이블카가 섬과 도심을 연결함. 아래에 실제 바다가 있음
3. **What kind of experience?** → 이동하는 전망대. 바다와 항구·섬·교량을 위에서 내려다봄
4. **Why Yeosu?** → 돌산대교가 시야에 들어옴. 여수 특유의 바다+섬+야경 구조

### PRIMARY PLACE IDENTITY
`여수 바다 위를 가로지르는 케이블카`  
해상(海上) + 자산↔돌산 도심-섬 연결 구조

### SECONDARY EXPERIENCE SIGNAL
야간 전망 — 바다 반사, 도시 불빛, 섬 능선, 돌산대교

### YEOSU SIGNAL
돌산대교 (Dolsan Bridge) — 여수 대표 랜드마크이자 케이블카 루트 가시권  
여수 특유의 도서(島嶼) 연결 지형

### AVOID SIGNALS
- 산악/스키장 케이블카 이미지 (이 장소는 해상)
- 내부 캐빈 시점만 (바다 위 사실 전달 어려움)
- 낮에만 보이는 이미지 (야간 운행 있음, 야경 특성 있음)
- 소원이 캐릭터 포함 (WishArt 컨텍스트 — SOUL Hero와 혼동)
- 포토리얼리스틱 (DreamTown 브랜드 스타일과 불일치)

---

## 5. HERO ROLE IN V1 CONTEXT

V1 페이지 순서:
```
[HERO] ← 지금 여기
 ↓
ESSENTIAL INFO (Quick Basic 6 FactRows)
 ↓
FOR ME
 ↓
SOUL JUDGMENT
 ↓
JOURNEY
```

**Hero가 해야 할 일 (중복 없이):**
- Quick Basic "자산↔돌산", "13분", "17,000원~" — 모두 텍스트에 있음
- Hero는 "바다 위"라는 **물리적 사실**을 시각적으로 한 번에 전달
- "편도 약 13분" 텍스트가 Hero로 실제 바다 너비를 암시받을 때 신뢰도 향상
- 야경 분위기 → SOUL "어디로 내려서 다음 여행" 및 "돌산공원 야경" 연결 준비

**Hero는 Knowledge를 복제하지 않는다. Hero는 Knowledge를 신뢰 가능하게 만든다.**

---

## 6. GAP CLASSIFICATION

⚠️ **CORRECTED** — Founder-provided source inspected (see Section 13).

| 갭 종류 | 내용 | 분류 (수정) |
|---|---|---|
| Knowledge gap — 기본 장소 정체 | 없음 | A EXISTS_AND_KNOWN |
| **SOUL Place Hero — Founder-provided** | `SOUL_YEOSU_CABLECAR_PLACE_HERO_V01.png` — repo 외부 존재 | **C SOURCE_EXISTS_NOT_STRUCTURED** |
| Visual asset — repo 내 관련 자산 | `cablecar-star-intro.png` 존재 (B) | B EXISTS_NOT_CONNECTED (secondary) |
| Visual asset — 삭제 OG | og/cablecar.jpg 삭제됨 (Founder 결정) | — PROHIBITED |
| Connection — PLACE_HERO_MAP | cablecar 키 없음 → null | B EXISTS_NOT_CONNECTED |
| Presentation — 현재 화면 | 그라디언트 fallback | F PRESENTATION_GAP |

**핵심 (수정):** Knowledge gap 없음. Purpose-built Founder SOUL Hero asset 존재 (외부 경로). True 문제 = SOURCE_EXISTS_NOT_STRUCTURED → 파일 import + PLACE_HERO_MAP 연결.

---

## 7. DECISION OPTIONS

⚠️ **CORRECTED** — Options revised based on Founder-provided source (see Section 13).

### OPTION A — Founder SOUL Hero 자산 Import + 연결 (RECOMMENDED)

`C:\DREAM TOWN\Assets\SOUL\Yeosu_Cable_Car\Place_Hero\SOUL_YEOSU_CABLECAR_PLACE_HERO_V01.png`  
→ `public/images/soul/place-hero/cablecar.png` (또는 동등 경로)  
→ `PLACE_HERO_MAP = { cablecar: '/images/soul/place-hero/cablecar.png' }`

**장점:**
- Founder 지정 SOUL Place Hero 전용 자산
- 1672×941 (16:9 가로형) — Hero 크롭 문제 없음
- 주간 전경 + 도시+바다+섬+교량 파노라마 — "바다 위" 즉시 전달
- DreamTown 수채화/애니메이션 일러스트 스타일 일치
- 3개 장소 동일 패턴 (SOUL Asset System) — 향후 확장성 확보

**위험:**
- 파일이 repo 외부에 있음 — public/ 복사 필요 (단순 파일 복사)
- Provenance: Founder 제공 = FOUNDER_AUTHORED

**Provenance 상태:** FOUNDER_DESIGNATED — `C:\DREAM TOWN\Assets\SOUL\` 구조로 확인됨  
**Founder 승인 필요:** YES — import 위치 + 파일명 확인  
**이미지 생성 필요:** 없음  
**구현 범위:** 파일 복사 → PLACE_HERO_MAP 한 줄 변경

---

### OPTION B — `cablecar-star-intro.png` 연결 (SECONDARY)

`PLACE_HERO_MAP['cablecar'] = '/assets/brand/core/cablecar-star-intro.png'`

**장점:** 즉시 연결 가능. 파일 이동 불필요.  
**위험:** 1080×1920 (9:16 세로) → Hero 가로 영역 크롭. AppLaunch 전용 자산을 Hero로 재사용.  
**결론:** Founder SOUL Asset 존재 확인 이후 **열등한 선택**. OPTION A 이후에만 고려.

---

### OPTION C — 새 이미지 생성

**결론:** OPTION A(Founder 제공 자산)가 존재하므로 불필요. EXCLUDED.

---

### OPTION D (기존 C) — canonical/source/cablecar 25장 사용

**결론:** 내부 관점 + WishArt 컨텍스트 → NOT_SUITABLE. EXCLUDED.

---

## 8. EXTERNAL RESEARCH STATUS

Repository 조사 결과 TRUE_KNOWLEDGE_GAP 없음.  
외부 리서치 불필요.

해상케이블카 물리적 사실(바다 위, 자산↔돌산, 교량)은 기존 소스에 충분히 기록되어 있음.  
`cablecar-star-intro.png` 존재 확인으로 visual asset gap도 없음.

---

## 9. RECOMMENDED PATH

**OPTION A** — `cablecar-star-intro.png` 연결 (recommendation only)

이유:
- 신규 자산 없이 즉시 Connection Gap 해결
- 기존 Approved 브랜드 자산 (production AppLaunch 검증 완료)
- DreamTown 스타일 일치
- 구현 단순성 최대 (단일 줄 변경)
- Provenance 기록은 MANIFEST 업데이트로 해결 가능

Founder 결정 전에는 구현하지 않습니다.

---

## 10. OPEN QUESTIONS FOR FOUNDER (REVISED)

⚠️ **Q1, Q2 철회** — Founder SOUL Asset (`SOUL_YEOSU_CABLECAR_PLACE_HERO_V01.png`) 존재 확인으로 불필요.

**Q1 (신규).** `SOUL_YEOSU_CABLECAR_PLACE_HERO_V01.png`을 repo `public/` 아래 어느 경로로 import합니까?  
예시 후보:
- `public/images/soul/place-hero/cablecar.png`
- `public/assets/soul/yeosu-cable-car/place-hero-v01.png`

**Q2 (신규).** 향일암·오동도 Place Hero도 같은 세션에서 동시 import합니까?  
(3개 장소 동일 패턴이므로 함께 처리 가능)

---

## 11. IMPLEMENTATION STATUS

`CABLE_CAR_PLACE_HERO_VISUAL_TRUST_LAYER_V1 = ENTRY_AUDIT_COMPLETE / FOUNDER_DECISION_REQUIRED`

구현 BLOCKED — Founder import 경로 결정 후 진행.

---

## 12. CURRENT NEXT ACTION

`CABLE_CAR_PLACE_HERO_VISUAL_DIRECTION_FOUNDER_DECISION`

---

## 13. CORRECTION — FOUNDER-PROVIDED SOURCE FULL INSPECTION

**Inspected:** `C:\DREAM TOWN\Assets\SOUL\`  
**Date:** 2026-10-04 (즉시 수정)

### 13.1 SOUL Asset System Structure

```
C:\DREAM TOWN\Assets\SOUL\
├── Yeosu_Cable_Car\
│   ├── Place_Hero\
│   │   └── SOUL_YEOSU_CABLECAR_PLACE_HERO_V01.png
│   ├── Context\
│   │   └── SOUL_YEOSU_CABLECAR_CONTEXT_FAMILY_SUNSET_V01.png
│   ├── Experience\
│   │   ├── SOUL_YEOSU_CABLECAR_EXPERIENCE_CABIN_VIEW_V01.png
│   │   └── SOUL_YEOSU_CABLECAR_EXPERIENCE_CITY_VIEW_V01.png
│   ├── Wish_Scene\
│   │   └── SOUL_YEOSU_CABLECAR_WISH_SCENE_SUNSET_V01.png
│   └── Journey\ (비어있음)
├── Odongdo\
│   ├── Place_Hero\
│   │   └── SOUL_ODONGDO_PLACE_HERO_V01.png
│   ├── Context\ (2개)
│   ├── Experience\ (3개)
│   ├── Wish_Scene\ (비어있음)
│   └── Journey\ (비어있음)
└── Hyangiram\
    ├── Place_Hero\
    │   └── SOUL_HYANGIRAM_PLACE_HERO_V01.png
    ├── Context\ (2개)
    ├── Experience\ (5개)
    ├── Wish_Scene\ (1개)
    └── Journey\ (비어있음)
```

### 13.2 Cable Car Place Hero — Visual Inspection

**`SOUL_YEOSU_CABLECAR_PLACE_HERO_V01.png`**

| 항목 | 값 |
|---|---|
| 경로 | `C:\DREAM TOWN\Assets\SOUL\Yeosu_Cable_Car\Place_Hero\` |
| 해상도 | **1672 × 941** (~16:9 landscape) |
| 파일 크기 | 3,083,553 bytes (~3.0MB) |
| 포맷 | PNG |
| 생성일 | 2026-09-29 |
| 스타일 | 수채화/애니메이션 일러스트, DreamTown 스타일 |
| **내용** | 주간/황금시간대. 좌측 전경: 빨간 케이블카 캐빈 (클로즈업), 내부 여성 실루엣(뒷모습, 검은 머리). 배경: 여수 시내 건물군 + 항구 + 초록 섬 + 교량 + 파란 바다 + 배 + 산. 다수 케이블카 캐빈이 케이블 위에 보임. |
| Cable Car 인식 | **즉시 인식** — 빨간 캐빈이 전경에 클로즈업 |
| Yeosu 인식 | **즉시 인식** — 항구+섬+교량+산+배 구조 = 여수 전경 |
| Hero 적합성 | **HERO_CANDIDATE A+** — 목적별 제작, 16:9, 크롭 불필요 |
| Provenance | FOUNDER_DESIGNATED (SOUL Asset 전용 디렉토리에 위치) |
| repo 존재 | **없음** — import 필요 |
| **판정** | **C SOURCE_EXISTS_NOT_STRUCTURED → OPTION A로 해결** |

### 13.3 Hyangiram / Odongdo Inventory (연속성 확인)

**`SOUL_ODONGDO_PLACE_HERO_V01.png`** — 1672×941, 2.9MB, 2026-09-29
- 내용: 오동도 방파제+섬+등대+파란 바다+화물선. 주간. 전경 나무.
- 오동도 인식: 즉시 (방파제 연결 구조 = 오동도 시그니처)
- HERO_CANDIDATE: A+

**`SOUL_HYANGIRAM_PLACE_HERO_V01.png`** — 1671×941, 3.1MB, 2026-09-29
- 내용: 산봉우리 한국 전통 사찰 건물. 주변 울창한 숲. 좌측 파란 바다. 주간.
- 향일암 인식: 즉시 (산꼭대기 사찰+바다 = 향일암 시그니처)
- HERO_CANDIDATE: A+

**결론:** 3개 장소 모두 동일 포맷(1672~×941, ~16:9), 동일 명명 패턴(`SOUL_{PLACE}_PLACE_HERO_V01.png`), 동일 제작 시기(2026-09-29). 통일된 SOUL Asset System 확인.

### 13.4 Revised Connection Trace

```
C:\DREAM TOWN\Assets\SOUL\Yeosu_Cable_Car\Place_Hero\
  SOUL_YEOSU_CABLECAR_PLACE_HERO_V01.png
    ↓ [IMPORT NEEDED — 단순 파일 복사]
public/images/soul/place-hero/cablecar.png (또는 Founder 지정 경로)
    ↓ [PLACE_HERO_MAP 등재 필요]
PLACE_HERO_MAP = { cablecar: '/images/soul/place-hero/cablecar.png' }
    ↓
heroSrc = '/images/soul/place-hero/cablecar.png'
    ↓
<img src={heroSrc} ... /> 렌더링 → 그라디언트 대체
```

**갭 종류: C SOURCE_EXISTS_NOT_STRUCTURED**
(파일 존재, 구조화 미완료 = repo에 없음)

### 13.5 Previous Conclusion Correction

| 항목 | 이전 판단 | 수정 판단 |
|---|---|---|
| Primary candidate | `cablecar-star-intro.png` | `SOUL_YEOSU_CABLECAR_PLACE_HERO_V01.png` |
| Gap type | B EXISTS_NOT_CONNECTED | C SOURCE_EXISTS_NOT_STRUCTURED |
| Recommended action | AppLaunch 자산 재사용 | Founder SOUL Asset import |
| Image generation | Not needed | Not needed (여전히 불필요) |
| Crop issue | 9:16 → Hero 크롭 문제 | **없음** — 16:9 이미 최적 비율 |
