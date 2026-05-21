# HAMEL_ASSET_INVENTORY.md

> 작성일: 2026-05-21  
> 목적: 하멜 관련 이미지 자산의 현재 위치 및 분류 전수 조사  
> 규칙: 파일 이동/삭제/생성 없음 — 조사 전용

---

## 요약

| 경로 그룹 | 파일 수 | 총 용량 | 상태 |
|---|---|---|---|
| `thumbnails/hamel/실험_archive/` | 1 | 2.1 MB | 실험 아카이브 |
| `thumbnails/hamel/base/` | 5 PNG | ~37.4 MB | base_master (초기 원천) |
| `thumbnails/hamel/base/스토리북 5PAGE/` | 5 PNG | ~16.8 MB | base_master (GATE 6 최종 원천) |
| `thumbnails/hamel/generated/full/` | 50 PNG + manifest | ~178 MB | page05_afterflow_candidate (GATE 6+6b) |
| `thumbnails/hamel/generated/sample/` | 3 PNG | ~28.6 MB | 샘플 1라운드 (구버전) |
| `thumbnails/hamel/generated/sample/test/` | 5 PNG | ~46.1 MB | 테스트 출력 (구버전) |
| `thumbnails/hamel/generated/sample_v2/` | 5 PNG + 3 DEBUG | ~67.2 MB | 샘플 2라운드 (구버전) |
| `canonical/source/hamel/` | 25 PNG | ~88.2 MB | ⚠️ generated/full 중복 사본 |
| `storybook/sources/page05/hamel/` | 4 PNG | ~11.2 MB | continuity_connector (page05 완성본) |
| `star-cache/yeosu_hamel/` | 1 PNG | 3.2 MB | 스타 캐시 (1장만 존재) |
| **합계** | **~107개** | **~478 MB** | |

---

## 섹션 1 — thumbnails/hamel/실험_archive/

> 초기 실험 중 생성된 파일. 아카이브 폴더로 분리됨.

| 파일명 | 크기 | 수정일 | 비고 |
|---|---|---|---|
| `hamel_base_04_curiosity_NEW.png` | 2.1 MB | 2026-05-04 | 실험용 base 재생성본. 아카이브. |

---

## 섹션 2 — thumbnails/hamel/base/

> 초기 원천 base 파일. 한 장당 7-8 MB (gpt-image-1 원본 크기).

| 파일명 | 크기 | 수정일 | 분류 |
|---|---|---|---|
| `hamel_pause_sapphire_01.png` | 7.5 MB | 2026-05-04 | base_master |
| `hamel_base_02_left.png` | 7.6 MB | 2026-05-04 | base_master |
| `hamel_base_03_right.png` | 7.2 MB | 2026-05-04 | base_master |
| `hamel_base_04_low.png` | 7.5 MB | 2026-05-04 | base_master |
| `hamel_base_05_wide.png` | 7.6 MB | 2026-05-04 | base_master |

> 참고: `.gitkeep` 제외. 파일명에 emotion/gem 정보 미반영 파일 3개 (base_02~05) — 분류 불명확.

---

## 섹션 3 — thumbnails/hamel/base/스토리북 5PAGE/

> GATE 6에서 재생성한 하멜 최상위 원천 base 5장. 감정별 1:1 대응.

| 파일명 | 크기 | 수정일 | emotion |
|---|---|---|---|
| `01_confusion_hamel_base.png` | 3.2 MB | 2026-05-17 | confusion |
| `02_pause_hamel_base.png` | 3.2 MB | 2026-05-17 | pause |
| `03_calm_hamel_base.png` | 3.4 MB | 2026-05-17 | calm |
| `04_curiosity_hamel_base.png` | 3.1 MB | 2026-05-17 | curiosity |
| `05_fragile_hope_hamel_base.png` | 3.1 MB | 2026-05-17 | fragile_hope |

---

## 섹션 4 — thumbnails/hamel/generated/full/

> GATE 6+6b 처리 완료 자산. 5감정 × 5베이스 = 25장 + _text overlay 25장.  
> Registry 분류: `page05_afterflow_candidate` (canonical 아님)

### 클린 이미지 25장

| 파일명 | 크기 | emotion | gem |
|---|---|---|---|
| `hamel_confusion_moonstone_base01.png` | 3.4 MB | confusion | moonstone |
| `hamel_confusion_moonstone_base02.png` | 3.4 MB | confusion | moonstone |
| `hamel_confusion_moonstone_base03.png` | 3.5 MB | confusion | moonstone |
| `hamel_confusion_moonstone_base04.png` | 3.4 MB | confusion | moonstone |
| `hamel_confusion_moonstone_base05.png` | 3.4 MB | confusion | moonstone |
| `hamel_fragile_hope_diamond_base01.png` | 3.4 MB | fragile_hope | diamond |
| `hamel_fragile_hope_diamond_base02.png` | 3.4 MB | fragile_hope | diamond |
| `hamel_fragile_hope_diamond_base03.png` | 3.4 MB | fragile_hope | diamond |
| `hamel_fragile_hope_diamond_base04.png` | 3.4 MB | fragile_hope | diamond |
| `hamel_fragile_hope_diamond_base05.png` | 3.4 MB | fragile_hope | diamond |
| `hamel_calm_emerald_base01.png` | 3.3 MB | calm | emerald |
| `hamel_calm_emerald_base02.png` | 3.2 MB | calm | emerald |
| `hamel_calm_emerald_base03.png` | 3.4 MB | calm | emerald |
| `hamel_calm_emerald_base04.png` | 3.3 MB | calm | emerald |
| `hamel_calm_emerald_base05.png` | 3.3 MB | calm | emerald |
| `hamel_curiosity_topaz_base01.png` | 3.3 MB | curiosity | topaz |
| `hamel_curiosity_topaz_base02.png` | 3.2 MB | curiosity | topaz |
| `hamel_curiosity_topaz_base03.png` | 3.4 MB | curiosity | topaz |
| `hamel_curiosity_topaz_base04.png` | 3.3 MB | curiosity | topaz |
| `hamel_curiosity_topaz_base05.png` | 3.3 MB | curiosity | topaz |
| `hamel_pause_sapphire_base01.png` | 3.3 MB | pause | sapphire |
| `hamel_pause_sapphire_base02.png` | 3.2 MB | pause | sapphire |
| `hamel_pause_sapphire_base03.png` | 3.4 MB | pause | sapphire |
| `hamel_pause_sapphire_base04.png` | 3.3 MB | pause | sapphire |
| `hamel_pause_sapphire_base05.png` | 3.3 MB | pause | sapphire |

> 모두 수정일: 2026-05-17

### 텍스트 오버레이 이미지 25장 (_text.png)

위 25장 각각의 `_text.png` 버전 존재. 크기 ~1.0–1.1 MB (합성으로 크기 감소).  
Registry 분류: `text_overlay` / status: `text_overlay_only`

---

## 섹션 5 — thumbnails/hamel/generated/sample/ 및 sample_v2/

> 구버전 샘플 라운드. 현행 generated/full 파이프라인 이전 생성물. 현재 미사용.

### sample/ (1라운드, 2026-05-04)

| 파일명 | 크기 | 비고 |
|---|---|---|
| `hamel_calm_emerald_base03_v2.png` | 9.2 MB | 구버전 샘플 |
| `hamel_curiosity_topaz_base04_v2.png` | 2.9 MB | 구버전 샘플 |
| `hamel_fragile_hope_diamond_base05_v2.png` | 8.9 MB | 구버전 샘플 |

### sample/test/ (테스트 출력, 2026-05-04)

| 파일명 | 크기 |
|---|---|
| `hamel_calm_emerald_base03.png` | 9.2 MB |
| `hamel_confusion_moonstone_base01.png` | 8.8 MB |
| `hamel_curiosity_topaz_base04.png` | 8.6 MB |
| `hamel_fragile_hope_diamond_base05.png` | 8.9 MB |
| `hamel_pause_sapphire_base02.png` | 8.3 MB |

### sample_v2/ (2라운드, 2026-05-04)

| 파일명 | 크기 | 비고 |
|---|---|---|
| `DEBUG_direct_tint.png` | 7.9 MB | 디버그 산출물 |
| `DEBUG_final.png` | 8.7 MB | 디버그 산출물 |
| `DEBUG_masked_crop.png` | 0.8 MB | 디버그 산출물 |
| `hamel_calm_emerald_base03_v2.png` | 8.9 MB | 샘플 v2 |
| `hamel_confusion_moonstone_base01_v2.png` | 8.8 MB | 샘플 v2 |
| `hamel_curiosity_topaz_base04_v2.png` | 8.6 MB | 샘플 v2 |
| `hamel_fragile_hope_diamond_base05_v2.png` | 8.8 MB | 샘플 v2 |
| `hamel_pause_sapphire_base02_v2.png` | 8.3 MB | 샘플 v2 |

---

## 섹션 6 — canonical/source/hamel/

> ⚠️ **중복 사본 확인됨**: `thumbnails/hamel/generated/full/` 클린 이미지 25장과 파일 크기가 1바이트 단위까지 일치.  
> 동일 파일을 두 경로에 보관 중.

| 파일명 | 크기 | 수정일 | canonical/source 크기 | generated/full 크기 | 동일? |
|---|---|---|---|---|---|
| `hamel_calm_emerald_base01.png` | 3.3 MB | 2026-05-17 | 3,461,545 | 3,461,545 | ✅ |
| `hamel_calm_emerald_base02.png` | 3.2 MB | 2026-05-17 | 3,399,732 | 3,399,732 | ✅ |
| `hamel_calm_emerald_base03.png` | 3.4 MB | 2026-05-17 | 3,525,387 | 3,525,387 | ✅ |
| `hamel_calm_emerald_base04.png` | 3.3 MB | 2026-05-17 | 3,464,836 | 3,464,836 | ✅ |
| `hamel_calm_emerald_base05.png` | 3.3 MB | 2026-05-17 | 3,423,001 | 3,423,001 | ✅ |
| `hamel_confusion_moonstone_base01.png` | 3.4 MB | 2026-05-17 | 3,579,327 | 3,579,327 | ✅ |
| `hamel_confusion_moonstone_base02.png` | 3.4 MB | 2026-05-17 | 3,530,885 | 3,530,885 | ✅ |
| `hamel_confusion_moonstone_base03.png` | 3.5 MB | 2026-05-17 | 3,620,511 | 3,620,511 | ✅ |
| `hamel_confusion_moonstone_base04.png` | 3.4 MB | 2026-05-17 | 3,615,929 | 3,615,929 | ✅ |
| `hamel_confusion_moonstone_base05.png` | 3.4 MB | 2026-05-17 | 3,552,295 | 3,552,295 | ✅ |
| `hamel_curiosity_topaz_base01.png` | 3.3 MB | 2026-05-17 | 3,461,420 | 3,461,420 | ✅ |
| `hamel_curiosity_topaz_base02.png` | 3.2 MB | 2026-05-17 | 3,398,865 | 3,398,865 | ✅ |
| `hamel_curiosity_topaz_base03.png` | 3.4 MB | 2026-05-17 | 3,520,038 | 3,520,038 | ✅ |
| `hamel_curiosity_topaz_base04.png` | 3.3 MB | 2026-05-17 | 3,465,506 | 3,465,506 | ✅ |
| `hamel_curiosity_topaz_base05.png` | 3.3 MB | 2026-05-17 | 3,421,166 | 3,421,166 | ✅ |
| `hamel_fragile_hope_diamond_base01.png` | 3.4 MB | 2026-05-17 | 3,571,043 | 3,571,043 | ✅ |
| `hamel_fragile_hope_diamond_base02.png` | 3.4 MB | 2026-05-17 | 3,518,371 | 3,518,371 | ✅ |
| `hamel_fragile_hope_diamond_base03.png` | 3.5 MB | 2026-05-17 | 3,610,475 | 3,610,475 | ✅ |
| `hamel_fragile_hope_diamond_base04.png` | 3.4 MB | 2026-05-17 | 3,609,284 | 3,609,284 | ✅ |
| `hamel_fragile_hope_diamond_base05.png` | 3.4 MB | 2026-05-17 | 3,535,688 | 3,535,688 | ✅ |
| `hamel_pause_sapphire_base01.png` | 3.3 MB | 2026-05-17 | 3,460,295 | 3,460,295 | ✅ |
| `hamel_pause_sapphire_base02.png` | 3.2 MB | 2026-05-17 | 3,397,179 | 3,397,179 | ✅ |
| `hamel_pause_sapphire_base03.png` | 3.4 MB | 2026-05-17 | 3,526,318 | 3,526,318 | ✅ |
| `hamel_pause_sapphire_base04.png` | 3.3 MB | 2026-05-17 | 3,462,221 | 3,462,221 | ✅ |
| `hamel_pause_sapphire_base05.png` | 3.3 MB | 2026-05-17 | 3,420,753 | 3,420,753 | ✅ |

> **25개 파일 전체가 generated/full과 바이트 단위 동일.** 88 MB 중복 보관.

---

## 섹션 7 — storybook/sources/page05/hamel/

> Page05 continuity_connector 완성본 4장. 2026-05-18 생성.

| 파일명 | 크기 | 수정일 | page05_type |
|---|---|---|---|
| `hamel_page05_emotional_afterflow_base.png` | 2.8 MB | 2026-05-18 | emotional_afterflow |
| `hamel_page05_reality_reconnection_base.png` | 3.0 MB | 2026-05-18 | reality_reconnection |
| `hamel_page05_wish_signal_continuation_base.png` | 2.6 MB | 2026-05-18 | wish_signal_continuation |
| `hamel_page05_widened_continuation_base.png` | 2.4 MB | 2026-05-18 | widened_continuation |

---

## 섹션 8 — star-cache/yeosu_hamel/

> 별 캐시 디렉토리. 하멜 자산이 1장만 존재.

| 파일명 | 크기 | 수정일 | 비고 |
|---|---|---|---|
| `01_confusion_sapphire_yeosu_hamel.png` | 3.2 MB | 2026-05-07 | confusion/sapphire 조합만 존재. 나머지 미생성. |

> 주의: `star-cache/_backup/kakao_lost_names/yeosu_hamel/` 에 카카오톡 원본 이름 백업 25장 별도 존재 (위 조사 범위에서는 참조만).

---

## 중복 분석 요약

| 중복 그룹 | 경로 A | 경로 B | 중복 수 | 크기 | 권장 조치 |
|---|---|---|---|---|---|
| **canonical ↔ generated/full** | `canonical/source/hamel/` | `thumbnails/hamel/generated/full/` | 25장 | 88 MB | 별도 결정 필요 (이동 금지 현재) |
| **sample_v2 ↔ sample** | `generated/sample_v2/` | `generated/sample/` | 5장 (유사) | — | 다른 크기 — 동일 파일 아님, 버전 차이 |
| **sample/test ↔ sample** | `generated/sample/test/` | `generated/sample/` | 5장 (유사) | — | 다른 크기 — 동일 파일 아님 |

---

## Registry 매핑 현황

| 경로 | Registry page_role | Registry status | 등록 여부 |
|---|---|---|---|
| `thumbnails/hamel/base/` | `base_master` | active | ✅ |
| `thumbnails/hamel/base/스토리북 5PAGE/` | `base_master` | active | ✅ |
| `thumbnails/hamel/generated/full/` (클린) | `page05_afterflow_candidate` | active | ✅ |
| `thumbnails/hamel/generated/full/` (_text) | `text_overlay` | text_overlay_only | ✅ |
| `thumbnails/hamel/generated/sample/` | — | — | ❌ 미등록 |
| `thumbnails/hamel/generated/sample_v2/` | — | — | ❌ 미등록 |
| `thumbnails/hamel/실험_archive/` | — | — | ❌ 미등록 |
| `canonical/source/hamel/` | — | — | ❌ 미등록 (generated/full 중복) |
| `storybook/sources/page05/hamel/` | `continuity_connector` | active | ✅ |
| `star-cache/yeosu_hamel/` | — | — | ❌ 미등록 |

---

## 현황 판단 메모

1. **canonical/source/hamel/** — generated/full과 완전 동일 사본. 해당 폴더의 목적(별도 canonical 원천 보관)이 맞는지 검토 필요.
2. **generated/sample/, sample_v2/, 실험_archive/** — 구버전 산출물. 아카이브 또는 삭제 후보. 현재 어떤 파이프라인도 참조하지 않음.
3. **star-cache/yeosu_hamel/** — hamel 스타 캐시가 1장(confusion/sapphire)만 존재. 나머지 감정/보석 조합 미생성 상태.
4. **base/스토리북 5PAGE/** — GATE 6 최상위 원천. `page_role=base_master`로 Registry 등록됨. 가장 신뢰도 높은 원천소스.
