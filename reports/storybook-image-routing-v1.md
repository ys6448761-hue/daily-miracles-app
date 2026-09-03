# Storybook Image Routing — Route Classification v1

**작성일**: 2026-05-25
**작성자**: Claude Code (Antigravity — 읽기/분석 전용)
**작업 유형**: CURATION ONLY — 신규 이미지 생성 없음
**대상**: 현재 생성 완료된 이미지 전체

---

## 0. 큐레이션 원칙

```
1. 감정 흐름이 소원 여정과 맞는 이미지를 선별한다.
2. 장소는 감정의 배경이지, 관광지 소개가 아니다.
3. 하나의 항로 = 하나의 감정 호흡 (시작 → 이동 → 여운).
4. 항로 간 이미지 중복 사용 가능 (장소보다 감정이 우선).
5. 팀 검수 미완 이미지는 1순위 추천 보류, 2순위 대안 명시.
```

---

## 1. 전체 이미지 인벤토리

### 1-1. World Canvas Validation 이미지 (12장)

| 파일 | 장소 | 감정 | 목적 |
|------|------|------|------|
| `public/images/world-canvas/validation/cablecar/cablecar_confusion_v1.png` | cablecar | confusion | storybook |
| `public/images/world-canvas/validation/cablecar/cablecar_pause_v1.png` | cablecar | pause | storybook |
| `public/images/world-canvas/validation/cablecar/cablecar_calm_v1.png` | cablecar | calm | storybook |
| `public/images/world-canvas/validation/cablecar/cablecar_curiosity_v1.png` | cablecar | curiosity | storybook |
| `public/images/world-canvas/validation/cablecar/cablecar_fragile_hope_v1.png` | cablecar | fragile_hope | storybook |
| `public/images/world-canvas/validation/cablecar/cablecar_world_canvas_v1.png` | cablecar | — | miracle |
| `public/images/world-canvas/validation/hamel/hamel_confusion_v1.png` | hamel | confusion | storybook |
| `public/images/world-canvas/validation/hamel/hamel_pause_v1.png` | hamel | pause | storybook |
| `public/images/world-canvas/validation/hamel/hamel_calm_v1.png` | hamel | calm | storybook |
| `public/images/world-canvas/validation/hamel/hamel_curiosity_v1.png` | hamel | curiosity | storybook |
| `public/images/world-canvas/validation/hamel/hamel_fragile_hope_v1.png` | hamel | fragile_hope | storybook |
| `public/images/world-canvas/validation/hamel/hamel_world_canvas_v1.png` | hamel | — | miracle |

**특이사항**: 이 12장은 Emotion Grammar v1 직접 검수 완료. 가장 SSOT 충실도 높음.

---

### 1-2. Thumbnail Generated 이미지 (125장)

각 장소 × 감정 5종 × 보석 5종 = 25장.

| 장소 | 스테이지 | 보석 구성 |
|------|---------|-----------|
| cablecar | stage1 | citrine / sapphire / emerald / ruby / diamond |
| cafe | stage2 | citrine / sapphire / emerald / ruby / diamond |
| hotel | stage4 | citrine / sapphire / emerald / ruby / diamond |

**파일명 구조**: `{num}_{emotion}_{gemstone}_yeosu_{place}_stage{n}.png`

**보석 SSOT 매핑** (ASSET-SSOT.md 기준):

| emotion | 지정 보석 | cablecar/cafe/hotel 대응 |
|---------|-----------|--------------------------|
| confusion | moonstone | 없음 → diamond 대체 권장 |
| pause | sapphire | sapphire ✅ |
| calm | emerald | emerald ✅ |
| curiosity | topaz | 없음 → citrine 대체 권장 |
| fragile_hope | diamond | diamond ✅ |

---

### 1-3. Hamel Generated 이미지 (50장)

`hamel_{emotion}_{gemstone}_base{01-05}.png` + `..._text.png` 형태.
감정별 보석이 SSOT 매핑과 일치 (moonstone/sapphire/emerald/topaz/diamond).
base01~05: 동일 프롬프트 5회 생성 → 가장 감정 표현이 명확한 1장 선택 필요.

---

## 2. 항로 정의

```
소망 항로  — 소원의 씨앗. "어디로 가야 할지 모르는 상태"에서 시작.
주중 항로  — 일상의 회복. 멈추고, 숨 고르고, 이 순간에 머무는.
별빛 항로  — 별을 향한 여정. 무언가 올 것 같은 기운에서 작은 빛까지.
```

---

## 3. 항로별 큐레이션

---

### 3-1. 소망 항로 — 길을 모른 채 출발하는

```
감정 흐름:  confusion (시작) → pause (멈춤 / 소원 쓰기 전)
장소 성격:  아직 방향이 없는 공간 — 이동 중, 안개 속, 바다 앞
목적:       소원 입력 전 감정 연결 / 포스트카드 출발점
```

#### 추천 이미지 시퀀스

| 순서 | 파일 | 감정 | 이유 |
|------|------|------|------|
| 1 | `world-canvas/validation/cablecar/cablecar_confusion_v1.png` | confusion | 케이블카 내부, 안개 속 창문. "어디로 가야 할지" 직접 표현. |
| 2 | `world-canvas/validation/hamel/hamel_confusion_v1.png` | confusion | 등대 앞 짙은 안개. 방향 없음. cablecar confusion 대비 더 열린 공간. |
| 3 | `world-canvas/validation/cablecar/cablecar_pause_v1.png` | pause | 케이블카 멈춤. 별이 아주 조금 보이기 시작. 소원 쓰기 직전의 고요. |

#### SNS 카드용 대안 (thumbnail)

| 파일 | 용도 |
|------|------|
| `thumbnails/cablecar/generated/full/21_confusion_diamond_yeosu_cablecar_stage1.png` | confusion × diamond — moonstone 미생성 대체 |
| `thumbnails/cafe/generated/full/21_confusion_diamond_yeosu_cafe_stage2.png` | 카페 혼란 — 실내 공간, 소원 출발점 |
| `thumbnails/cablecar/generated/full/07_pause_sapphire_yeosu_cablecar_stage1.png` | pause × sapphire — SSOT 일치 |

#### 텍스트 제안

```
시퀀스 카드 문장:
  1. 오늘은 어디로 가야 할지 모르겠어요.
  2. 어디를 향할지, 아직 몰랐어요.
  3. 잠깐은 멈춰 있어도 괜찮았어요.

마무리 문장:
  소원은 보통 이 자리에서 시작돼요.
```

---

### 3-2. 주중 항로 — 이 순간에 머무는

```
감정 흐름:  pause (멈춤) → calm (고요) → fragile_hope (작은 빛)
장소 성격:  일상적 실내 공간 — 카페 창가, 숙소, 항구 근처
목적:       일상 SNS 카드 / 포스트카드 / 별 관찰 중간 게시
```

#### 추천 이미지 시퀀스

| 순서 | 파일 | 감정 | 이유 |
|------|------|------|------|
| 1 | `thumbnails/cafe/generated/full/07_pause_sapphire_yeosu_cafe_stage2.png` | pause | 카페 내부, 사파이어 톤. 멈춤의 공간감. |
| 2 | `thumbnails/cafe/generated/full/08_calm_emerald_yeosu_cafe_stage2.png` | calm | 카페 창가, 에메랄드 톤. 고요한 숨 고르기. |
| 3 | `thumbnails/hotel/generated/full/13_calm_emerald_yeosu_hotel_stage4.png` | calm | 숙소 calm — 밤의 머무름. cafe calm에서 호텔로 이어지는 자연스러운 흐름. |
| 4 | `thumbnails/cafe/generated/full/25_fragile_hope_diamond_yeosu_cafe_stage2.png` | fragile_hope | 카페 마무리. 다이아몬드 톤 — 밤이 지나며 작은 빛 시작. |

#### 단독 카드용 대안

| 파일 | 용도 |
|------|------|
| `thumbnails/cafe/generated/full/03_calm_citrine_yeosu_cafe_stage2.png` | calm × citrine — 따뜻한 시트린 톤 (팀 검수 후) |
| `thumbnails/hotel/generated/full/07_pause_sapphire_yeosu_hotel_stage4.png` | hotel pause × sapphire — 숙소 멈춤 |
| `thumbnails/hotel/generated/full/10_fragile_hope_sapphire_yeosu_hotel_stage4.png` | hotel fragile_hope × sapphire — 밤하늘 바라보며 |
| `thumbnails/hotel/generated/full/25_fragile_hope_diamond_yeosu_hotel_stage4.png` | hotel fragile_hope × diamond — SSOT 일치 대안 |

#### 텍스트 제안

```
시퀀스 카드 문장:
  1. 잠깐 멈춰 앉았어요.
  2. 조금 숨이 놓였어요.
  3. 밤이 생각보다 조용했어요.
  4. 작은 빛이 꺼지지 않고 있었어요.

마무리 문장:
  별은 보통 이런 밤에 탄생해요.
```

---

### 3-3. 별빛 항로 — 무언가가 올 것 같은

```
감정 흐름:  curiosity (탐색) → fragile_hope (연약한 희망)
장소 성격:  별과 가까운 고공·수평선 공간 — 케이블카, 등대
목적:       별 생성 SNS 공유 / YouTube 배경 / miracle world-canvas
```

#### 추천 이미지 시퀀스

| 순서 | 파일 | 감정 | 이유 |
|------|------|------|------|
| 1 | `world-canvas/validation/cablecar/cablecar_curiosity_v1.png` | curiosity | 케이블카 상단 하늘, 원형 glow 접근 중. "무언가가 올 것 같다." |
| 2 | `world-canvas/validation/hamel/hamel_curiosity_v1.png` | curiosity | 수평선 distant light. hamel이 curiosity 표현에 더 적합 (검수 결과). |
| 3 | `world-canvas/validation/cablecar/cablecar_fragile_hope_v1.png` | fragile_hope | 케이블카 창, 4각형 별 조심스럽게 등장. 아직 완성 아님. |
| 4 | `world-canvas/validation/hamel/hamel_fragile_hope_v1.png` | fragile_hope | 아치 창 클로즈업, 등대 빔 계속됨. "빛이 꺼지지 않는다." |
| 5 | `world-canvas/validation/cablecar/cablecar_world_canvas_v1.png` | — (miracle) | 외부 harbor + sky. 케이블카 선 얇은 실처럼. 세계가 숨 쉰다. |

#### 단독 카드용 대안 (thumbnail)

| 파일 | 용도 |
|------|------|
| `thumbnails/cablecar/generated/full/04_curiosity_citrine_yeosu_cablecar_stage1.png` | curiosity × citrine — topaz 미생성 대체 (가장 warm amber에 가까움) |
| `thumbnails/hamel/generated/full/hamel_curiosity_topaz_base01.png` | hamel curiosity × topaz — SSOT 일치 ✅ |
| `thumbnails/cablecar/generated/full/25_fragile_hope_diamond_yeosu_cablecar_stage1.png` | fragile_hope × diamond — SSOT 일치 ✅ |
| `thumbnails/hamel/generated/full/hamel_fragile_hope_diamond_base01.png` | hamel fragile_hope × diamond — SSOT 일치 ✅ |
| `world-canvas/validation/hamel/hamel_world_canvas_v1.png` | hamel miracle — 등대 외부, 빔, 수면 반사 |

#### Miracle World-Canvas 활용 (presence layer 포함)

```
별빛 항로 miracle:
  primary:   cablecar_world_canvas_v1.png
  secondary: hamel_world_canvas_v1.png

참조 prototype:
  http://localhost:5100/public/debug/miracle-presence-v1.html  (cablecar)
  http://localhost:5100/public/debug/hamel-miracle-v1.html     (hamel)
```

#### 텍스트 제안

```
시퀀스 카드 문장:
  1. 저 멀리에 무언가 있는 것 같았어요.
  2. 저 너머에 무언가 있는 것 같았어요.
  3. 조금은 믿어보고 싶어졌어요.
  4. 작은 빛이 꺼지지 않고 있었어요.

miracle 한 줄:
  세계는 숨 쉬고 있어요.
```

---

## 4. 항로 간 감정 연결 지도

```
소망 항로                주중 항로               별빛 항로
─────────────────────    ─────────────────────   ─────────────────────
confusion (cablecar)     pause (cafe)            curiosity (cablecar)
confusion (hamel)     ↘  calm   (cafe)           curiosity (hamel)
pause     (cablecar) ──→ calm   (hotel)       ↗  fragile_hope (cablecar)
                         fragile_hope (cafe)     fragile_hope (hamel)
                                                 → miracle world-canvas

감정 이동 가능 경로:
  소망 → 주중: pause가 연결점 (소원 쓰고 → 일상 회복)
  주중 → 별빛: fragile_hope가 연결점 (작은 빛이 → 별을 향해)
  소망 → 별빛: confusion이 출발점 (길을 모른 채 → 별빛을 발견)
```

---

## 5. 보류 / 미결 항목

### 5-1. 보석 미스매치 (cablecar/cafe/hotel thumbnails)

```
confusion × moonstone: 생성 없음.
  → 현재 대체: confusion × diamond
  → 팀 결정 필요: moonstone 변형을 새로 생성할지, diamond로 고정할지

curiosity × topaz: cablecar/cafe/hotel에 생성 없음.
  → 현재 대체: curiosity × citrine (가장 warm amber에 가까움)
  → hamel은 topaz 생성 완료 (SSOT 일치)
```

### 5-2. 팀 검수 보류 이미지

```
cablecar_curiosity_v1.png:
  "원형 glow — 오고 있는 중인가 vs 이미 저기 있는가" 경계선.
  팀 확인 전 별빛 항로 1순위 위치 유지, 이상 시 hamel_curiosity_v1.png로 교체.

hamel_pause_v1.png:
  석조 벽 warm amber 반사.
  "건축 조명인가 vs warm tone 위반인가" 팀 확인 필요.
  주중 항로 대체: cafe_pause_sapphire 사용 (현재 큐레이션도 cafe 우선).

hamel_fragile_hope_v1.png:
  아치 상단 4각형 별.
  "이미 도착한 느낌인가" 팀 확인 필요.
  등대 빔이 메인이므로 큐레이션에 포함 유지.
```

### 5-3. Hamel base01-05 선택 미결

```
hamel generated/full/ 이미지: base01-05 중 1장 선택 필요.
  현재: base01 기본 권장 (팀 시각 검수 후 최종 선택).
  대상: confusion/pause/calm/curiosity/fragile_hope × moonstone/sapphire/emerald/topaz/diamond
```

---

## 6. 항로별 용도 매핑

| 항로 | SNS 카드 | YouTube 배경 | 포스트카드 | Miracle 화면 |
|------|---------|-------------|-----------|-------------|
| 소망 항로 | confusion × diamond | — | ✅ 출발 | — |
| 주중 항로 | pause/calm × sapphire/emerald | ✅ 일상 영상 | ✅ 일상 | — |
| 별빛 항로 | curiosity/fragile_hope × topaz/diamond | ✅ 별 영상 | ✅ 희망 | ✅ miracle view |

---

## 7. 사용 불가 (현 단계)

```
hotel/generated/full/: 25장 전체 존재하나 cafe와 유사한 실내 구성.
  → 주중 항로 보조 이미지로만 사용 (주력 이미지는 cafe).
  → 이유: hotel vs cafe 시각 구분이 명확하지 않으면 시퀀스에서 혼동.
  → 팀이 hotel 이미지 질감 직접 확인 후 주중 항로 편입 여부 결정.

thumbnails/cablecar/: ruby 보석 변형 5장 (confusion/pause/calm/curiosity/fragile_hope × ruby)
  → ruby는 passion 감정 지정 보석 (ASSET-SSOT.md).
  → 현재 5감정 SSOT 어디에도 ruby 배정 없음.
  → 소원 여정 항로에서 사용 보류. 추후 "passion" 감정 항로 도입 시 검토.
```

---

## 8. 최종 요약

```
소망 항로 (3장 핵심):
  cablecar_confusion_v1 → hamel_confusion_v1 → cablecar_pause_v1

주중 항로 (4장 핵심):
  cafe_pause_sapphire → cafe_calm_emerald → hotel_calm_emerald → cafe_fragile_hope_diamond

별빛 항로 (5장 핵심):
  cablecar_curiosity_v1 → hamel_curiosity_v1 → cablecar_fragile_hope_v1
  → hamel_fragile_hope_v1 → cablecar_world_canvas_v1 (miracle)
```

이 큐레이션은 신규 생성 없이 기존 이미지만으로 완성된다.
팀 검수 후 이상 이미지 교체 시 위 보류 목록에서 대안 선택.

---

*Storybook Image Routing — Classification v1 as of 2026-05-25*
*큐레이션 전용 문서 — 이미지 생성 지시서 아님*
