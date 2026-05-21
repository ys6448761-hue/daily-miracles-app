# DreamTown Canonical Air Registry
## 공기 원천 소스 목록 + 분류

**문서 코드**: AIR-REG-004  
**버전**: v1.0  
**작성**: 2026-05-16  
**감사 기준일**: 2026-05-16  
**총 등록**: 75장 valid + 1 weak_survival(미완성) + 1 generation_error

---

## Metadata Schema

각 Air Seed의 메타데이터 구조:

```yaml
source_id: AS-{location_short}-{emotion}-{gemstone}
file: {NN}_{emotion}_{gemstone}_{location}_{stage}.png
path: public/images/star-cache/{location}/
location: yeosu_cablecar | yeosu_cafe | yeosu_hamel | yeosu_hotel
stage: 1 | 2 | 3 | 4
emotion: confusion | pause | calm | curiosity | fragile_hope
gemstone: citrine | sapphire | emerald | ruby | diamond
class: memory_anchor | echo_fragment | transitional_air | weak_survival
echo_potential: high | medium | low | pending
derivation_targets: [storybook, miracle_video, shorts, postcard]
status: valid | generation_error | incomplete

# Source Asset Master (원칙 6 — LOCKED)
source_ratio: 3:4_portrait          # 모든 신규 생성 기준
current_ratio: unknown              # 기존 자산 실측 전 unknown 유지
ratio_verified: false               # CEO/Code 실측 후 true로 변경
```

> **기존 자산 ratio 상태**: 현재 등록된 75장은 생성 당시 비율 명세 없이 만들어졌다.  
> `ratio_verified: false` 상태. 실측 후 업데이트 전까지 신규 생성만 3:4 강제 적용.

---

## LOCATION 1: yeosu_cablecar (Stage 1)
**세트 상태**: 완성 25/25 ✓  
**장소 특성**: 케이블카 내부, 바다 창밖, 별 1개, 소원이 뒷모습 착석  
**파생 친화도**: storybook ◎, postcard ◎, miracle_video ○

| # | source_id | emotion | gemstone | class | echo_potential | derivation_targets |
|---|-----------|---------|----------|-------|---------------|-------------------|
| 01 | AS-cablecar-confusion-citrine | confusion | citrine | transitional_air | medium | storybook, shorts |
| 02 | AS-cablecar-pause-citrine | pause | citrine | transitional_air | medium | storybook |
| 03 | AS-cablecar-calm-citrine | calm | citrine | memory_anchor | high | postcard, storybook |
| 04 | AS-cablecar-curiosity-citrine | curiosity | citrine | echo_fragment | high | storybook, shorts |
| 05 | AS-cablecar-fragile_hope-citrine | fragile_hope | citrine | echo_fragment | high | storybook, miracle_video, postcard |
| 06 | AS-cablecar-confusion-sapphire | confusion | sapphire | transitional_air | medium | storybook, shorts |
| 07 | AS-cablecar-pause-sapphire | pause | sapphire | transitional_air | medium | storybook |
| 08 | AS-cablecar-calm-sapphire | calm | sapphire | memory_anchor | high | postcard, storybook |
| 09 | AS-cablecar-curiosity-sapphire | curiosity | sapphire | echo_fragment | high | storybook, shorts |
| 10 | AS-cablecar-fragile_hope-sapphire | fragile_hope | sapphire | echo_fragment | high | storybook, miracle_video, postcard |
| 11 | AS-cablecar-confusion-emerald | confusion | emerald | transitional_air | medium | storybook |
| 12 | AS-cablecar-pause-emerald | pause | emerald | transitional_air | medium | storybook |
| 13 | AS-cablecar-calm-emerald | calm | emerald | memory_anchor | high | postcard, storybook |
| 14 | AS-cablecar-curiosity-emerald | curiosity | emerald | echo_fragment | high | storybook, shorts |
| 15 | AS-cablecar-fragile_hope-emerald | fragile_hope | emerald | echo_fragment | high | storybook, miracle_video, postcard |
| 16 | AS-cablecar-confusion-ruby | confusion | ruby | transitional_air | medium | storybook, shorts |
| 17 | AS-cablecar-pause-ruby | pause | ruby | transitional_air | medium | storybook |
| 18 | AS-cablecar-calm-ruby | calm | ruby | memory_anchor | high | postcard, storybook |
| 19 | AS-cablecar-curiosity-ruby | curiosity | ruby | echo_fragment | high | storybook, shorts |
| 20 | AS-cablecar-fragile_hope-ruby | fragile_hope | ruby | echo_fragment | high | storybook, miracle_video, postcard |
| 21 | AS-cablecar-confusion-diamond | confusion | diamond | transitional_air | medium | storybook |
| 22 | AS-cablecar-pause-diamond | pause | diamond | transitional_air | medium | storybook |
| 23 | AS-cablecar-calm-diamond | calm | diamond | memory_anchor | high | postcard, storybook |
| 24 | AS-cablecar-curiosity-diamond | curiosity | diamond | echo_fragment | high | storybook, shorts |
| 25 | AS-cablecar-fragile_hope-diamond | fragile_hope | diamond | echo_fragment | high | storybook, miracle_video, postcard |

**클래스 소계**: memory_anchor 5 / echo_fragment 10 / transitional_air 10

---

## LOCATION 2: yeosu_cafe (Stage 2)
**세트 상태**: 유효 25/25 ✓ (+ 1 generation_error 별도)  
**장소 특성**: 카페 창가, 밤 바다, 소원이 착석, 따뜻한 실내광  
**파생 친화도**: storybook ◎, postcard ◎, shorts ○

| # | source_id | emotion | gemstone | class | echo_potential | derivation_targets |
|---|-----------|---------|----------|-------|---------------|-------------------|
| 01 | AS-cafe-confusion-citrine | confusion | citrine | transitional_air | medium | storybook |
| 02 | AS-cafe-pause-citrine | pause | citrine | transitional_air | medium | storybook |
| 03 | AS-cafe-calm-citrine | calm | citrine | memory_anchor | high | postcard, storybook |
| 04 | AS-cafe-curiosity-citrine | curiosity | citrine | echo_fragment | high | storybook, shorts |
| 05 | AS-cafe-fragile_hope-citrine | fragile_hope | citrine | echo_fragment | high | storybook, postcard |
| 06 | AS-cafe-confusion-sapphire | confusion | sapphire | transitional_air | medium | storybook |
| 07 | AS-cafe-pause-sapphire | pause | sapphire | transitional_air | medium | storybook |
| 08 | AS-cafe-calm-sapphire | calm | sapphire | memory_anchor | high | postcard, storybook |
| 09 | AS-cafe-curiosity-sapphire | curiosity | sapphire | echo_fragment | high | storybook, shorts |
| 10 | AS-cafe-fragile_hope-sapphire | fragile_hope | sapphire | echo_fragment | high | storybook, postcard |
| 11 | AS-cafe-confusion-emerald | confusion | emerald | transitional_air | medium | storybook |
| 12 | AS-cafe-pause-emerald | pause | emerald | transitional_air | medium | storybook |
| 13 | AS-cafe-calm-emerald | calm | emerald | memory_anchor | high | postcard, storybook |
| 14 | AS-cafe-curiosity-emerald | curiosity | emerald | echo_fragment | high | storybook, shorts |
| 15 | AS-cafe-fragile_hope-emerald | fragile_hope | emerald | echo_fragment | high | storybook, postcard |
| 16 | AS-cafe-confusion-ruby | confusion | ruby | transitional_air | medium | storybook |
| 17 | AS-cafe-pause-ruby | pause | ruby | transitional_air | medium | storybook |
| 18 | AS-cafe-calm-ruby | calm | ruby | memory_anchor | high | postcard, storybook |
| 19 | AS-cafe-curiosity-ruby | curiosity | ruby | echo_fragment | high | storybook, shorts |
| 20 | AS-cafe-fragile_hope-ruby | fragile_hope | ruby | echo_fragment | high | storybook, postcard |
| 21 | AS-cafe-confusion-diamond | confusion | diamond | transitional_air | medium | storybook |
| 22 | AS-cafe-pause-diamond | pause | diamond | transitional_air | medium | storybook |
| 23 | AS-cafe-calm-diamond | calm | diamond | memory_anchor | high | postcard, storybook |
| 24 | AS-cafe-curiosity-diamond | curiosity | diamond | echo_fragment | high | storybook, shorts |
| 25 | AS-cafe-fragile_hope-diamond | fragile_hope | diamond | echo_fragment | high | storybook, postcard |

**클래스 소계**: memory_anchor 5 / echo_fragment 10 / transitional_air 10

**오류 항목**:
```
status: generation_error
file: failed_* (카페 세트 내 1장)
class: weak_survival
echo_potential: pending
조치: CEO 검수 후 재생성 또는 폐기 결정
```

---

## LOCATION 3: yeosu_hamel (Stage 3)
**세트 상태**: 미완성 1/25 ⚠️  
**장소 특성**: 하멜 등대, 항구, 소원이 서서 뒷모습  
**파생 친화도**: 세트 완성 후 storybook ◎, miracle_video ◎ 예상

| # | source_id | emotion | gemstone | class | echo_potential | derivation_targets |
|---|-----------|---------|----------|-------|---------------|-------------------|
| 01 | AS-hamel-confusion-sapphire | confusion | sapphire | weak_survival | pending | (세트 완성 후 재분류) |

**미완성 슬롯 (24개)**:

| # | source_id | 상태 |
|---|-----------|------|
| 02–25 | AS-hamel-{emotion}-{gemstone} | 미생성 (메타데이터 예약) |

예약 목록 (생성 순서 제안):
```
우선: pause-sapphire, calm-emerald, curiosity-topaz, fragile_hope-diamond
이후: 나머지 20장 (citrine/ruby 세트)
```

**하멜 완성 시 예상 분류**:
- confusion → weak_survival → transitional_air 승격
- pause → transitional_air
- calm → memory_anchor (등대 = 강력한 기억 앵커)
- curiosity → echo_fragment
- fragile_hope → echo_fragment (등대 + 희망 = 최강 derivation 잠재력)

---

## LOCATION 4: yeosu_hotel (Stage 4)
**세트 상태**: 완성 25/25 ✓  
**장소 특성**: 호텔 창가, 도시 야경, 별 150% 밝기, 소원이 내면적 포즈  
**파생 친화도**: miracle_video ◎, storybook ◎, postcard ◎  
**특이사항**: star intensity 최고 (150%) — 가장 강한 시각 임팩트

| # | source_id | emotion | gemstone | class | echo_potential | derivation_targets |
|---|-----------|---------|----------|-------|---------------|-------------------|
| 01 | AS-hotel-confusion-citrine | confusion | citrine | transitional_air | medium | storybook |
| 02 | AS-hotel-pause-citrine | pause | citrine | echo_fragment | high | storybook, shorts |
| 03 | AS-hotel-calm-citrine | calm | citrine | memory_anchor | high | postcard, storybook |
| 04 | AS-hotel-curiosity-citrine | curiosity | citrine | echo_fragment | high | storybook, shorts |
| 05 | AS-hotel-fragile_hope-citrine | fragile_hope | citrine | echo_fragment | high | storybook, miracle_video, postcard |
| 06 | AS-hotel-confusion-sapphire | confusion | sapphire | transitional_air | medium | storybook |
| 07 | AS-hotel-pause-sapphire | pause | sapphire | echo_fragment | high | storybook, shorts |
| 08 | AS-hotel-calm-sapphire | calm | sapphire | memory_anchor | high | postcard, storybook |
| 09 | AS-hotel-curiosity-sapphire | curiosity | sapphire | echo_fragment | high | storybook, shorts |
| 10 | AS-hotel-fragile_hope-sapphire | fragile_hope | sapphire | echo_fragment | high | storybook, miracle_video, postcard |
| 11 | AS-hotel-confusion-emerald | confusion | emerald | transitional_air | medium | storybook |
| 12 | AS-hotel-pause-emerald | pause | emerald | echo_fragment | high | storybook |
| 13 | AS-hotel-calm-emerald | calm | emerald | memory_anchor | high | postcard, storybook |
| 14 | AS-hotel-curiosity-emerald | curiosity | emerald | echo_fragment | high | storybook, shorts |
| 15 | AS-hotel-fragile_hope-emerald | fragile_hope | emerald | echo_fragment | high | storybook, miracle_video, postcard |
| 16 | AS-hotel-confusion-ruby | confusion | ruby | transitional_air | medium | storybook, shorts |
| 17 | AS-hotel-pause-ruby | pause | ruby | echo_fragment | high | storybook, shorts |
| 18 | AS-hotel-calm-ruby | calm | ruby | memory_anchor | high | postcard, storybook |
| 19 | AS-hotel-curiosity-ruby | curiosity | ruby | echo_fragment | high | storybook, shorts |
| 20 | AS-hotel-fragile_hope-ruby | fragile_hope | ruby | echo_fragment | high | storybook, miracle_video, postcard |
| 21 | AS-hotel-confusion-diamond | confusion | diamond | transitional_air | medium | storybook |
| 22 | AS-hotel-pause-diamond | pause | diamond | echo_fragment | high | storybook |
| 23 | AS-hotel-calm-diamond | calm | diamond | memory_anchor | high | postcard, storybook |
| 24 | AS-hotel-curiosity-diamond | curiosity | diamond | echo_fragment | high | storybook, shorts |
| 25 | AS-hotel-fragile_hope-diamond | fragile_hope | diamond | echo_fragment | high | storybook, miracle_video, postcard |

**클래스 소계**: memory_anchor 5 / echo_fragment 15 / transitional_air 5  
※ hotel은 pause도 echo_fragment로 분류 (star 150% + 야경 + 정지 = 강한 파생 잠재력)

---

## 전체 인벤토리 요약

| Location | 총 장수 | memory_anchor | echo_fragment | transitional_air | weak_survival | 세트 완성 |
|----------|---------|--------------|--------------|-----------------|---------------|---------|
| cablecar | 25 | 5 | 10 | 10 | 0 | ✓ |
| cafe | 25+1err | 5 | 10 | 10 | 1(err) | ✓ |
| hamel | 1 | 0 | 0 | 0 | 1 | ✗ (1/25) |
| hotel | 25 | 5 | 15 | 5 | 0 | ✓ |
| **합계** | **76+1err** | **15** | **35** | **25** | **2** | 3/4 완성 |

---

## 즉시 파생 착수 가능 세트 (echo_potential: high)

```
1. storybook 착수 가능:
   - cablecar: curiosity + fragile_hope 각 5장 (10장)
   - cafe: curiosity + fragile_hope 각 5장 (10장)
   - hotel: pause + curiosity + fragile_hope 각 5장 (15장)
   총 35장이 즉시 storybook 소재

2. miracle_video 착수 가능:
   - cablecar fragile_hope 5장 (stage1 완성)
   - hotel fragile_hope 5장 (stage4 완성, 150% star)
   → cablecar→hotel 시퀀스 miracle_video 설계 가능

3. postcard 확장 가능:
   - memory_anchor 15장 전부 postcard 파생 가능
   - cablecar/cafe/hotel calm 세트 각 5장
```

---

## 분류 이의 제기 절차

Registry 분류에 이의가 있을 경우:
1. 해당 source_id 명시
2. 현재 class → 제안 class 명시  
3. 이유 기술
4. CEO 승인 후 Code Master가 Registry 업데이트

이의 제기 없이 임의 수정 금지.
