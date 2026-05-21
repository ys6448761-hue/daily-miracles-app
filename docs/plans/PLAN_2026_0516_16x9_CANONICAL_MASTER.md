# ~~16:9~~ → 3:4 Canonical Master 변환 계획표

**작성**: 2026-05-16  
**수정**: 2026-05-16 — CANONICAL RATIO 오류 수정  
**상태**: PLAN ONLY — 즉시 변환 금지. 원본 덮어쓰기 금지.

> **⚠️ CANONICAL RATIO 수정 (2026-05-16)**  
> 이 계획표는 16:9를 canonical master로 가정했으나 오류였다.  
> `DreamTown_Canonical_Foundation_v1.md §8`에 따라:  
> - **Canonical master = 3:4 portrait (1536×2048 이상)**  
> - **16:9 = YouTube 파생 크롭 (원본 아님)**  
> Section 6 "16:9 Canonical Master 변환 계획표"는 "3:4 Canonical Master 확정 및 파생 경로 정의"로 재작성 필요.  
> 현재 이 문서의 SECTION 1~5 (관계/중복 기록)는 유효. SECTION 6만 재작성 대상.  
**감사 기준일**: 2026-05-16  

```yaml
why_this_exists:
  현재 이미지 자산은 비율 명세 없이 만들어졌다.
  16:9를 canonical master로 확정하기 전에
  현재 상태, 중복 관계, 예외 케이스를 기록한다.
  이 문서 없이 변환 작업을 시작하지 않는다.
```

---

## ⛔ 변환 전 절대 원칙

```
1. 원본 덮어쓰기 금지
   - star-cache/, thumbnails/base/ 파일 직접 수정 금지
   - 변환 출력은 반드시 신규 경로에 저장

2. 즉시 변환 금지
   - 이 계획표 CEO 검토 후 착수
   - 착수 전 신규 디렉토리 구조 확정 필요

3. 9:16 자산 별도 보존
   - hamel 9:16 시스템은 독립 운영
   - 16:9 변환 대상에서 제외

4. 원본 경로 유지
   - 변환본은 canonical/ 신규 경로에 저장
   - 원본 경로 파일은 그대로 보존
```

---

## SECTION 1 — 현재 비율 맵

### 1.1 비율별 자산 현황

| 자산 경로 | 비율 | 명시 여부 | 추정 근거 |
|----------|------|----------|----------|
| `public/images/star-cache/yeosu_cablecar/` | 16:9 추정 | ❌ 비명시 | 파일 크기 ~3MB (소형 landscape) |
| `public/images/star-cache/yeosu_cafe/` | 16:9 추정 | ❌ 비명시 | 파일 크기 ~3MB |
| `public/images/star-cache/yeosu_hotel/` | 16:9 추정 | ❌ 비명시 | 파일 크기 ~3MB |
| `public/images/thumbnails/cablecar/base/` | 16:9 추정 | ❌ 비명시 | 파일 크기 2-3.5MB |
| `public/images/thumbnails/cablecar/generated/full/` | 16:9 추정 | ❌ 비명시 | 파일 크기 8-10MB (고해상도) |
| `public/images/thumbnails/cafe/generated/full/` | 16:9 추정 | ❌ 비명시 | 파일 크기 ~8MB |
| `public/images/thumbnails/hotel/generated/full/` | 16:9 추정 | ❌ 비명시 | 파일 크기 ~8MB |
| `public/images/thumbnails/hamel/base/` | **9:16 확정** | ✅ config 명시 | `hamel.json` 및 `wish-image/hamel.json` |
| `public/images/thumbnails/hamel/generated/full/` | **9:16 확정** | ✅ 파일 크기 증거 | 파일 크기 8.7-9.3MB (portrait) |
| `outputs/wish-image/hamel/` | **9:16 확정** | ✅ config 명시 | `config/wish-image/hamel.json` |

**핵심**: 비율이 명시된 것은 **hamel 전용 9:16뿐**. 나머지는 추정.

---

## SECTION 2 — 9:16 자산 인벤토리 (변환 제외 대상)

### 2.1 하멜 9:16 시스템 전체

```
[보존 경로]
public/images/thumbnails/hamel/
  ├── base/
  │   ├── hamel_base_02_left.png        7,831 KB — 구도: 좌측 프레임
  │   ├── hamel_base_03_right.png       7,415 KB — 구도: 우측 프레임
  │   ├── hamel_base_04_low.png         7,731 KB — 구도: 로우앵글
  │   ├── hamel_base_05_wide.png        7,805 KB — 구도: 와이드
  │   └── hamel_pause_sapphire_01.png   7,699 KB — 감정 베이스
  ├── generated/full/ (25장)
  │   └── hamel_{emotion}_{gem}_base{NN}.png
  ├── generated/sample/ (실험 v2, 5장)
  ├── generated/sample_v2/ (최종 v2 + DEBUG 3장)
  └── 실험_archive/

outputs/wish-image/hamel/
  └── _archive/
      ├── v1_20260507-140509/ (5장 + contact sheet)
      └── v2_trial_20260507-161532/ (미완성 1장)
```

**규칙**: 위 모든 파일은 9:16 시스템. 16:9 변환 계획에서 완전 제외.

### 2.2 하멜 9:16 config 근거

```yaml
# config/wish-image/hamel.json
composition:
  aspect_ratio: "9:16 vertical portrait — never square, never landscape"

# config/thumbnail/hamel.json
character_pose: "standing only — never sitting, never crouching"
star_brightness: "140%"
```

---

## SECTION 3 — 1:1 케이스 (하멜 등대 별도 처리)

### 3.1 하멜 등대 1:1 케이스 정의

하멜 등대는 **강한 수직 피사체(등대)**와 **9:16 세로 시스템** 사이에서  
1:1 정방형이 의미 있는 유일한 케이스다.

**이유**:
- 등대 = 수직 중심 구조물 → 1:1 크롭 시 등대가 화면 중심을 채움
- 다른 장소(카페/케이블카/호텔)는 실내 씬 → 1:1 크롭 시 핵심 요소(소원이 + 별) 손실 위험
- 하멜 base 이미지 5가지 구도(left/right/low/wide + emotion) 중 `wide` 구도만 1:1 변환 적합

### 3.2 하멜 1:1 변환 가능 후보

| 파일 | 구도 | 1:1 적합 여부 | 이유 |
|------|------|--------------|------|
| `hamel_base_02_left.png` | 좌측 프레임 | ⚠️ 검토 필요 | 등대 오프센터 |
| `hamel_base_03_right.png` | 우측 프레임 | ⚠️ 검토 필요 | 등대 오프센터 |
| `hamel_base_04_low.png` | 로우앵글 | ❌ 부적합 | 수평선이 잘림 |
| `hamel_base_05_wide.png` | 와이드 | ✅ 우선 후보 | 등대 + 바다 + 소원이 전체 포함 |
| `hamel_pause_sapphire_01.png` | 감정 베이스 | ✅ 후보 | 완성된 감정 이미지 |

### 3.3 하멜 1:1 변환 시 규칙

```
- 원본(9:16) 삭제 금지
- 크롭 중심: 등대 수직축 기준
- 출력 경로: public/images/thumbnails/hamel/canonical_1x1/ (신규)
- 변환 조건: CEO 육안 검수 후 크롭 기준 확정
- 현재 상태: BLOCKED (크롭 기준 미확정)
```

---

## SECTION 4 — 중복(Duplicate) 관계 기록

### 4.1 star-cache vs thumbnails/generated — 해상도 이중화

**같은 구성, 다른 해상도로 2벌 존재**:

| 경로 | 해상도 추정 | 파일 크기 | 역할 |
|------|----------|----------|------|
| `public/images/star-cache/yeosu_cablecar/` | ~960×540 (저해상도) | ~3MB | 서비스 노출용 (웹 로드 최적화) |
| `public/images/thumbnails/cablecar/generated/full/` | ~1920×1080 (고해상도) | 8-10MB | 파생 제작 원천 |

```yaml
duplicate_relationship:
  type: resolution_pair
  canonical: thumbnails/generated/full/  ← 고해상도 원천
  derived: star-cache/                   ← 서비스 노출 경량버전
  action: 관계 유지, 별도 삭제 금지
  note: star-cache를 canonical master로 오해하지 말 것
```

**동일 관계가 존재하는 장소**: cablecar ✓ / cafe ✓ / hotel ✓  
**hamel**: thumbnails/generated/full 25장 있음. star-cache/yeosu_hamel에는 1장만 존재 (미완성).

### 4.2 cablecar/base 구 네이밍 vs 신 네이밍

**10장 = 구 5장 + 신 5장 (동일 구성, 다른 파일명)**:

| 구 네이밍 (삭제 후보) | 신 네이밍 (현행 기준) | 감정 |
|---------------------|---------------------|------|
| `01_confusion_citrine_yeosu_cablecar_stage1.png` | `cablecar_confusion_moonstone_01.png` | confusion |
| `02_pause_citrine_yeosu_cablecar_stage1.png` | `cablecar_pause_sapphire_02.png` | pause |
| `03_calm_citrine_yeosu_cablecar_stage1.png` | `cablecar_calm_emerald_03.png` | calm |
| `04_curiosity_citrine_yeosu_cablecar_stage1.png` | `cablecar_curiosity_topaz_04.png` | curiosity |
| `05_fragile_hope_citrine_yeosu_cablecar_stage1.png` | `cablecar_fragile_hope_diamond_05.png` | fragile_hope |

```yaml
duplicate_relationship:
  type: naming_migration
  old_format: "{NN}_{emotion}_citrine_yeosu_cablecar_stage1.png"
  new_format: "cablecar_{emotion}_{correct_gemstone}_{NN}.png"
  difference:
    - 구버전: 모든 이미지가 citrine 고정 (감정별 보석 미적용)
    - 신버전: ASSET-SSOT.md 기준 감정별 보석 적용 (moonstone/sapphire/emerald/topaz/diamond)
  action: 구버전 5장 → deprecated 마킹 후 별도 아카이브 이동 (삭제 금지)
  현재_상태: BLOCKED (CEO 확인 후 처리)
```

### 4.3 hotel — _backup/kakao_lost_names 20장

```yaml
duplicate_relationship:
  type: source_backup
  path: public/images/star-cache/_backup/kakao_lost_names/yeosu_hotel/
  contents: 카카오톡 스크린샷 20장 (KakaoTalk_20260501_*.png)
  capture_date: 2026-05-01
  
  what_it_is: 카카오톡으로 수신한 호텔 썸네일 원본 레퍼런스 이미지
  
  action: 이동 금지. 삭제 금지. 원본 레퍼런스로 보존.
  연결_이미지: public/images/thumbnails/hotel/generated/full/ 25장의 기준 레퍼런스
  현황: star-cache 내 위치가 부적절 → 추후 assets/source/reference/ 로 이동 검토
```

### 4.4 hamel sample/ vs sample_v2/ 실험 중복

```yaml
duplicate_relationship:
  type: iteration_snapshots
  paths:
    - thumbnails/hamel/generated/sample/ (v2 시도 + test/ 서브폴더)
    - thumbnails/hamel/generated/sample_v2/ (최종 v2 + DEBUG 3장)
    - thumbnails/hamel/실험_archive/ (실험 스냅샷 1장)
  
  debug_files:
    - DEBUG_direct_tint.png  799 KB  ← 마스크 처리 중간 단계
    - DEBUG_final.png        799 KB  ← 최종 처리 중간 단계
    - DEBUG_masked_crop.png  799 KB  ← 크롭 마스크 단계
  
  action: 보존. sample_v2/가 최신. DEBUG 파일은 파이프라인 검증용으로 유지.
  이상값: sample/hamel_curiosity_topaz_base04_v2.png = 3.1MB (다른 이미지 8-9MB 대비 이상 소형)
  → CEO 확인 필요: 생성 오류 또는 의도적 저해상도
```

---

## SECTION 5 — 숙소(hotel) 썸네일 관계

### 5.1 hotel 전체 자산 구조

```
hotel 자산 3개 레이어:

1. 원본 레퍼런스 (카카오 수신본)
   public/images/star-cache/_backup/kakao_lost_names/yeosu_hotel/
   20장 / KakaoTalk_*.png / 캡처일: 2026-05-01

2. 생성 완성본 (파생 원천)
   public/images/thumbnails/hotel/generated/full/
   25장 / {NN}_{emotion}_{gem}_yeosu_hotel_stage4.png / ~8MB

3. 서비스 노출본 (경량)
   public/images/star-cache/yeosu_hotel/
   25장 / {NN}_{emotion}_{gem}_yeosu_hotel_stage4.png / ~3MB
```

### 5.2 hotel 중복 위험 지점

```yaml
risk:
  - star-cache/yeosu_hotel 와 thumbnails/hotel/generated/full 은 같은 이미지의 2가지 해상도
  - _backup/kakao_lost_names/yeosu_hotel 는 이들의 원본 레퍼런스 (다른 이미지일 수 있음)
  - base/ 에 .gitkeep만 있음 → hotel은 base 없이 생성됨 (직접 생성 방식)

중복_처리_원칙:
  - 3개 레이어 모두 보존
  - kakao backup → 레퍼런스 레이어 (읽기전용)
  - thumbnails/full → 파생 원천 레이어
  - star-cache → 서비스 노출 레이어
```

---

## SECTION 6 — 3:4 Source Asset Master 확정 계획

```yaml
source_asset_master: 3:4_portrait   # LOCKED 2026-05-16
근거: DreamTown_Canonical_Foundation_v1.md §8
      DEC_2026_0516_CANONICAL_RATIO_3x4.md
```

### 6.1 기존 자산 비율 실측 (최우선 선행 작업)

기존 75장은 생성 당시 비율 명세 없이 만들어짐. 실측 필요.

```bash
# 실측 명령 (Code Master 실행)
# ImageMagick 또는 node:sharp 사용
# 각 location 대표 1장씩 확인 후 전체 판단
identify -format "%f: %wx%h\n" \
  "public/images/thumbnails/cablecar/generated/full/01_confusion_citrine_yeosu_cablecar_stage1.png"
```

| 자산 | 실측 예정 파일 | 예상 결과 | ratio_verified |
|------|-------------|---------|---------------|
| cablecar full | `01_confusion_citrine_...` | 미측정 | false |
| cafe full | `01_confusion_citrine_...` | 미측정 | false |
| hotel full | `01_confusion_citrine_...` | 미측정 | false |
| hamel base | `hamel_base_05_wide.png` | 9:16 예상 | false |

**실측 후 분기**:
- 결과가 3:4 → `ratio_verified: true`, canonical 경로에 등록
- 결과가 16:9 → 재생성 대상으로 분류 (원본 보존 유지)
- 결과가 기타 → CEO 결정 후 처리

### 6.2 신규 생성 기준 (즉시 적용)

이 시점 이후 신규 생성되는 모든 Air Seed는 3:4 portrait로 생성.

```yaml
generation_spec:
  ratio: 3:4_portrait
  width: 1536   # minimum
  height: 2048  # minimum
  recommended_width: 2160
  recommended_height: 2880
  format: PNG
  no_text_overlay: true  # 텍스트는 post-processing

applies_to:
  - hamel 나머지 24장 (세트 완성 시)
  - 신규 장소 추가 시
  - 기존 자산 재생성 필요 시
```

### 6.3 Canonical 경로 구조 (미생성 — 승인 후 착수)

```
public/images/canonical/
  ├── source/         ← 3:4 portrait master (원본)
  │   ├── yeosu_cablecar/ (실측 후 3:4 확인된 것만)
  │   ├── yeosu_cafe/
  │   ├── yeosu_hotel/
  │   └── yeosu_hamel/ (세트 완성 후)
  │
  └── derived/        ← 크롭 파생물
      ├── 9x16/       shorts/reels
      ├── 4x5/        echo_card
      ├── 1x1/        sns_square
      ├── 4x3/        postcard
      └── 16x9/       youtube

[예외 경로 — 독립 유지]
public/images/thumbnails/hamel/    ← 9:16 원본 시스템 (변경 금지)
outputs/wish-image/hamel/          ← 9:16 원본 시스템 (변경 금지)
```

### 6.4 처리 대기 항목

| 항목 | 담당 | 상태 |
|------|------|------|
| 기존 자산 실측 (ImageMagick) | Code | BLOCKED — 실행 승인 필요 |
| cablecar 구 네이밍 5장 deprecated 처리 | CEO → Code | BLOCKED |
| hamel curiosity_topaz_base04_v2 이상 소형(3.1MB) | CEO | BLOCKED |
| hotel kakao backup 경로 이동 여부 | CEO | BLOCKED |
| hamel 1:1 크롭 기준 (wide 기준 중심 좌표) | CEO 육안 검수 | BLOCKED |
| canonical/source/ 경로 생성 및 등록 | Code | GATE 4 이후 |

---

## SECTION 7 — 감사 이상값 요약

### CEO 확인 필요 4개

```
1. [이상] hamel/generated/sample/hamel_curiosity_topaz_base04_v2.png
   파일 크기: 3.1MB (다른 hamel 이미지 8.7-9.3MB 대비 이상 소형)
   → 생성 실패 또는 의도적 저해상도?

2. [불일치] cablecar 감정-보석 매핑 이중성
   - ASSET-SSOT.md: confusion → moonstone
   - star-cache 파일명: confusion → citrine
   → 어느 쪽이 현행 기준인가?

3. [위치 이상] _backup/kakao_lost_names/yeosu_hotel/
   star-cache/ 안에 있지만 카카오 스크린샷
   → assets/source/reference/hotel/ 로 이동 검토

4. [미완성] public/images/star-cache/yeosu_hamel/
   1/25장만 존재
   → 하멜 세트 완성 계획 확인 필요
```

---

## 실행 게이트 (이 순서대로)

```
[GATE 1] CEO가 이 계획표 검토 + 이상값 4개 확인  ← 현재 위치
[GATE 2] 기존 자산 실측 — Code Master가 ImageMagick으로 비율 확인
[GATE 3] 실측 결과 기반 재생성 대상 / canonical 등록 대상 분리
[GATE 4] canonical/source/ 경로 생성 + Registry ratio_verified: true 업데이트
[GATE 5] hamel 1:1 크롭 기준 CEO 육안 확정
[GATE 6] derived/ 파생 크롭 생성 착수 (원본 보존 상태에서)
```
