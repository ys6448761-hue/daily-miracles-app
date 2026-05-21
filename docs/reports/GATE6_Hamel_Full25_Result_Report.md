# GATE 6 — Hamel Full25 Result Report

**작성일**: 2026-05-17  
**담당**: Code Master  
**상태**: COMPLETE — GATE 6b 완료, 전체 25장 Category A 등록 완료

---

## GATE_6_FULL25_RESULT

```yaml
generated_count: 25 (clean) + 25 (text overlay) = 50 files
output_path: public/images/thumbnails/hamel/generated/full/

continuity_preserved: YES
  harbor_reads_before_character: PASS (전 25장)
  no_lighthouse_center: PASS (전 25장)
  no_tourism_reading: PASS (전 25장)
  no_text_in_clean: PASS (전 25장)
  sowoni_back_view: PASS (전 25장)

drift_detected: PARTIAL — star_visibility_violation
  emerald (calm × 5):   FAIL — prominent green halo, reads as symbolic focus
  sapphire (pause × 5): FAIL — prominent blue halo, centered behind Sowoni → aura effect
  topaz (curiosity × 5): PARTIAL — warm amber glow, 2-3장 too prominent
  moonstone (confusion × 5): PASS — gray-blue blends into overcast sky
  diamond (fragile_hope × 5): PASS — white/pale blends into muted sky

category_distribution:
  Category A — canonical_register_ready:
    - confusion (moonstone × 5): 5장
    - fragile_hope (diamond × 5): 5장
    소계: 10장

  Category A- — star_reduction_pending:
    - calm (emerald × 5): 5장
    - pause (sapphire × 5): 5장
    - curiosity (topaz × 5): 5장 (일부 경계선)
    소계: 15장

canonical_register_ready: NOT YET (전체)
  immediate_register: 0장 (전체 DoD 통과 후 일괄 등록 권장)
  pending_fix: 15장 → GATE 6b star_suppression_pass 필요
```

---

## 시각 DoD 상세 검수

### confusion — moonstone (gray #D6E4F0)

| 항목 | 결과 | 비고 |
|------|------|------|
| harbor_reads_before_character | PASS | 항구가 먼저 읽힘 |
| star_almost_unnoticed | PASS | 문스톤 회청색 → 흐린 하늘에 자연스럽게 혼합 |
| sowoni_back_view | PASS | 뒷모습, 약간 돌아선 자세 (confusion 포즈) |
| no_lighthouse_center | PASS | |
| no_cinematic_reading | PASS | |

**결론**: Category A ✅

---

### pause — sapphire (blue #4A90D9)

| 항목 | 결과 | 비고 |
|------|------|------|
| harbor_reads_before_character | PASS | 항구 전경 충분 |
| star_almost_unnoticed | **FAIL** | 소원이 머리 뒤 → 선명한 파란 후광, 상징성 읽힘 |
| sowoni_back_view | PASS | |
| no_lighthouse_center | PASS | |

**결론**: Category A- — star_reduction 필요 ⚠️

---

### calm — emerald (green #3CB371)

| 항목 | 결과 | 비고 |
|------|------|------|
| harbor_reads_before_character | PASS | |
| star_almost_unnoticed | **FAIL** | base01: 수평선 녹색 미스트 (focal), base03: 상단 녹색 후광 |
| sowoni_back_view | PASS | |
| no_lighthouse_center | PASS | |

**결론**: Category A- — star_reduction 필요 ⚠️

---

### curiosity — topaz (amber #FFB347)

| 항목 | 결과 | 비고 |
|------|------|------|
| harbor_reads_before_character | PASS | |
| star_almost_unnoticed | PARTIAL | base03: 허용 가능 (연하게 항구 분위기에 섞임), base05: 후광 경계선 |
| sowoni_back_view | PASS | |

**결론**: Category A- — star_reduction 권장 (일관성 위해 ⚠️)

---

### fragile_hope — diamond (white #F0F8FF)

| 항목 | 결과 | 비고 |
|------|------|------|
| harbor_reads_before_character | PASS | 항구 체인·계류줄 전경 강함 |
| star_almost_unnoticed | PASS | 다이아몬드 흰색 → 흐린 하늘과 자연스럽게 혼합 |
| sowoni_back_view | PASS | |
| no_lighthouse_center | PASS | |

**결론**: Category A ✅

---

## 근본 원인 분석

```yaml
root_cause: hamel base 이미지에 독립적인 별 픽셀 없음

  설명:
    - hamel 기본 정책: overcast sky (흐린 하늘), 별 brightness 60-70%
    - AI 생성 결과: 흐린 하늘 전체가 균일한 밝기 → 전용 별 픽셀 클러스터 없음
    - recolorStar 알고리즘: 상위 1% 밝기 픽셀 밀도 클러스터 탐지
    - 탐지 결과:
        - 하늘 중심 → 소원이 머리 뒤 → 후광 효과 (sapphire/emerald FAIL)
        - 항구 조명 → 수평선 near area (일부 base)
    
  왜 moonstone/diamond는 통과하는가:
    - 문스톤 (#D6E4F0): 회청색 → 흐린 하늘 색상과 동일 계열 → 자연스럽게 혼합
    - 다이아몬드 (#F0F8FF): 흰색/창백 → 흐린 구름 색상과 동일 계열 → 자연스럽게 혼합
    
  왜 emerald/sapphire는 실패하는가:
    - 에메랄드 (#3CB371): 선명한 녹색 → 회색 하늘에서 극도로 대비됨 → 후광 가시성 high
    - 사파이어 (#4A90D9): 선명한 파란색 → 흐린 하늘보다 채도 높음 → 후광 가시성 high
```

---

## GATE 6b 제안 — Star Suppression Pass

```yaml
GATE_6b_proposal:
  method: background-preserving_gradient_reduction (GATE 5와 동일 기법)
  target_images:
    - calm_emerald × 5: 녹색 후광 → 80-90% 감소 목표
    - pause_sapphire × 5: 파란 후광 → 80-90% 감소 목표
    - curiosity_topaz × 5: 호박색 후광 → 60-70% 감소 목표 (일관성 위해)
  total: 15장
  
  cost: $0 (API 없음 — 픽셀 후처리만)
  time: ~10분
  
  DoD 목표:
    star_after: almost_unnoticed (항구 일반 조명 수준으로 감소)
    symbolic_risk: low
    harbor_continuity: preserved
  
  output: 동일 경로 덮어쓰기 (원본은 thumbnails/hamel/generated/full/ 보존)
  
  CEO_승인_필요: YES — GATE 5와 동일한 사전 승인 절차
```

---

## 현재 상태 요약

| 감정 | 보석 | 생성 | DoD 통과 | 등록 가능 |
|------|------|------|---------|---------|
| confusion | moonstone | ✅ | ✅ PASS | 승인 후 |
| pause | sapphire | ✅ | ❌ star_fail | GATE 6b 후 |
| calm | emerald | ✅ | ❌ star_fail | GATE 6b 후 |
| curiosity | topaz | ✅ | ⚠️ partial | GATE 6b 후 (권장) |
| fragile_hope | diamond | ✅ | ✅ PASS | 승인 후 |

**전체 25장**: 생성 완료, 등록은 GATE 6b + CEO 검수 후

---

## GATE 6b 완료 결과

```yaml
GATE_6B_RESULT:
  modified_count: 15 (sapphire 5 + emerald 5 + topaz 5)
  halo_removed: YES — 전 15장 halo artifact 완전 제거
  continuity_preserved: YES — harbor 분위기 온전, artifact 없음
  upgraded_to_A: 25장 전체 (moonstone 5 + diamond 5 기존 PASS + 15장 6b 처리)
  remaining_issues: NONE

  method_final: background_preserving_base_blend (v3)
  formula: "result = base + (recolored - base) × keepRatio"
  keepInner: 0.05  # 95% base 복원
  suppress_r_hard: 245px
  suppress_r_outer: 330px
  
  canonical_registered: 2026-05-17
  canonical_path: public/images/canonical/source/hamel/ (25장)
  manifest_updated: 75장 → 100장
  registry_updated: hamel Category D → A
```
