# SOUL_CABLE_CAR_PLACE_HERO_VISUAL_ENTRY_AUDIT_V0_1

**Status:** ENTRY_AUDIT_COMPLETE / FOUNDER_DECISION_REQUIRED  
**Date:** 2026-10-04  
**Authoritative Checkpoint:** main @ `bd20e8f`  
**Scope:** Knowledge-first visual audit. No UI modification. No image generation.

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

| 갭 종류 | 내용 | 분류 |
|---|---|---|
| Knowledge gap — 기본 장소 정체 | 없음 | A EXISTS_AND_KNOWN |
| Visual asset — 외부 관점 Hero | cablecar-star-intro.png 존재 | B EXISTS_NOT_CONNECTED |
| Visual asset — 삭제 OG | og/cablecar.jpg 삭제됨 (Founder 결정) | — PROHIBITED |
| Provenance — cablecar-star-intro.png | MANIFEST 미등재 | D VERIFICATION_REQUIRED |
| Connection — PLACE_HERO_MAP | cablecar 키 없음 → null | B EXISTS_NOT_CONNECTED |
| Presentation — 현재 화면 | 그라디언트 fallback | F PRESENTATION_GAP |

**핵심:** Knowledge gap 없음. Visual asset gap 없음 (B 존재). True 문제 = CONNECTION_GAP.

---

## 7. DECISION OPTIONS

### OPTION A — 기존 `cablecar-star-intro.png` 연결 (CONNECTION)

`PLACE_HERO_MAP['cablecar'] = '/assets/brand/core/cablecar-star-intro.png'`

**장점:**
- 즉시 연결 가능. 신규 자산 불필요
- AppLaunch에서 현재 사용 중인 Approved 브랜드 자산 재사용
- DreamTown 스타일 일치 (수채화, 야경, 케이블카 외부 뷰)
- 1080×1920 (9:16) — 모바일 세로 화면에 최적. `objectFit: cover`로 Hero 영역에 맞춤 (AppLaunch에서 이미 검증됨)
- 케이블카 외부 관점 → "바다 위" 사실 즉시 전달
- 돌산대교 포함 → Yeosu 신호

**위험:**
- Provenance UNRECORDED — 제작 시점·방법 불명 (AppLaunch에서는 문제 없이 사용 중)
- 9:16 세로 이미지를 Hero 가로 영역에 `objectFit: cover`하면 상하가 크롭됨 → 중앙 구도 검토 필요

**Provenance 상태:** UNRECORDED (but production-used)  
**Founder 승인 필요:** YES — 기존 AppLaunch 전용 자산을 SOUL Hero 컨텍스트로 확장  
**이미지 생성 필요:** 없음  
**구현 변경 범위:** `SoulCableCarPage.jsx:54` 한 줄 (`PLACE_HERO_MAP = { cablecar: '...' }`)

---

### OPTION B — 새 Hero 이미지 생성 (Hero-purpose 전용)

기존 Knowledge + `cablecar-star-intro.png` 외부 관점을 참조해 Hero 전용 이미지 AI 생성.  
목표 비율: 가로형 (16:9 또는 3:2)으로 Hero 영역에 최적화.

**장점:**
- Hero 전용 구도 (가로형) — 크롭 문제 없음
- 새 Provenance 기록 가능 (MANIFEST 신규 등재)

**위험:**
- AI 생성 사이클 필요 (prompt → review → approve → Evidence)
- 스타일 일관성 확보 위해 `cablecar.json` + `cablecar-star-intro.png` 모두 참조 필요
- 검증 라운드 추가 필요

**Provenance 상태:** NEW (생성 후 MANIFEST 등재 필요)  
**Founder 승인 필요:** YES (prompt 방향 + 결과물 검토)  
**이미지 생성 필요:** 있음  
**구현 범위:** 이미지 생성 → 검증 → public/ 배치 → PLACE_HERO_MAP 연결

---

### OPTION C — 기존 MANIFEST canonical 이미지 전용 Hero 발굴

`canonical/source/cablecar/` 25장 중 `calm` 계열(memory_anchor)을 Hero로 사용.  
예: `13_calm_emerald_yeosu_cablecar_stage1.png`

**장점:**
- Category A, MANIFEST 등재됨, provenance 명확

**위험:**
- **내부 관점** — 소원이 캐빈 내부 앉아서 창 바라봄. Place 신뢰 신호 전달 실패
- 소원이 캐릭터 포함 → WishArt 별 경험 컨텍스트 혼동
- 2:3 세로 비율 — Hero 레이아웃 부적합
- **NOT_SUITABLE로 판단**

**최종 결론: OPTION C 제외**

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

## 10. OPEN QUESTIONS FOR FOUNDER

**Q1.** `cablecar-star-intro.png`을 SOUL Cable Car Hero 이미지로 재사용하는 데 동의하십니까?  
(현재 AppLaunch 전용 → SOUL Hero 컨텍스트 확장)

**Q2.** 9:16 세로 이미지를 Hero 영역에 `objectFit: cover` + center crop으로 사용하는 것이 수용 가능합니까?  
(케이블카 중앙부가 잘려나오지 않도록 `object-position` 조정 필요 여부)

**Q3.** 만약 OPTION B(새 생성)를 선택하신다면, 외부(가로형) 관점이 필요합니까, 아니면 내부 관점도 고려합니까?

---

## 11. IMPLEMENTATION STATUS

`CABLE_CAR_PLACE_HERO_VISUAL_TRUST_LAYER_V1 = ENTRY_AUDIT_COMPLETE / FOUNDER_DECISION_REQUIRED`

구현 BLOCKED — Founder Q1/Q2 결정 후 진행.

---

## 12. CURRENT NEXT ACTION

`CABLE_CAR_PLACE_HERO_VISUAL_DIRECTION_FOUNDER_DECISION`
