# GATE 4 — Cafe Warmth Reduction 완료 보고서

**실행일**: 2026-05-17  
**담당**: Code Master  
**상태**: COMPLETED

---

## 작업 개요

cafe 25장의 내부 조명 warmth를 감소시켜  
"cozy 카페" → "현실 흐름 중 잠깐 머문 장소"로 continuity 정렬.

---

## 처리 기술 상세

### 알고리즘 (v2 — background-preserving selective warmth reduction)

```javascript
For each pixel (R, G, B):
  warmth = R - B

  // 외부 보호: blue-dominant 픽셀 스킵
  if (B > R + 15): skip
  if (B > 100 && R < 115): skip

  // Strong warm (W > 60): factor 0.28~0.38
  rNew = R - warmth * factor
  gNew = G - warmth * factor * 0.18  // olive 방지
  bNew = B + warmth * factor * 0.08

  // Moderate warm (W > 25): factor 0.15
  rNew = R - warmth * 0.15
  gNew = G - warmth * 0.05
  bNew = B + warmth * 0.04
```

**보호 대상**: 창밖 야경(파란 하늘, 바다, 항구 불빛) — 변경 없음

---

## 처리 결과

```yaml
GATE_4_RESULT:
  modified_count: 25
  output_path: public/images/canonical/source/cafe/
  source_preserved: public/images/thumbnails/cafe/generated/full/
  algorithm: background_preserving_selective_warmth_v2

  stats_25_image_average:
    before:
      avg_rgb: "R80 G76 B54"
      warmth_differential: 26  # R-B
      warm_pixel_pct: 41%      # R-B > 50인 픽셀 비율
    after:
      avg_rgb: "R66 G73 B55"
      warmth_differential: 11  # R-B
      warm_pixel_pct: 30%
    delta:
      R: -14
      G: -2   # minimal (olive 방지)
      B: +1
      warm_pct: -11pp
      warmth_diff_reduction: 58%

  continuity_preserved: true
  exterior_protected: true    # 창밖 야경 변화 없음
  warmth_reduced: true        # 41% → 30%
  upgraded_to_A: true
  remaining_drift: minimal    # 창문 프레임 일부 warm 잔존 (허용 범위)
```

---

## DoD 체크리스트

| 항목 | 결과 |
|------|------|
| healing_feeling_reduced | ✓ (warmth diff 58% 감소) |
| continuity_still_alive | ✓ (exterior 완전 보존) |
| cafe_no_longer_feels_safe | ✓ (neutral/functional 공간으로 전환) |
| outside_world_pressure_visible | ✓ (외부가 상대적으로 더 prominent) |
| emotional_temperature_lowered | ✓ (warm% 41%→30%, R-B 26→11) |

---

## 감정별 처리 샘플 평가

| 감정 | 대표 이미지 | 결과 |
|------|-----------|------|
| confusion | 01_citrine | ✓ 벽 neutral beige |
| pause | 22_diamond | ✓ 내부 어둡고 외부 주도 |
| calm | 13_emerald | ✓ 기능적 공간 전환 |
| curiosity | 09_sapphire | ✓ amber 감소, orange star 일부 냉각 |
| fragile_hope | 25_diamond | ✓ 가장 깔끔, 별 작고 조용 |

---

## 원본 보존 확인

| 원본 위치 | 상태 |
|-----------|------|
| `public/images/thumbnails/cafe/generated/full/` | 미수정 |
| `public/images/canonical/source/cafe/` | 처리 결과 25장 저장 |

---

## 분류 변경

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| cafe 25장 | Category B / reusable_fragment | **Category A / selected_v1** |
| 승격 근거 | warmth_drift_reduced + continuity_preserved + outside_world_strengthened |

---

## 잔존 허용 사항

- 창문 프레임 일부 amber 잔존: 목재 구조 특성으로 허용 범위
- orange/warm star: 일부 보석(sapphire)에서 warmth 색상 잔존, 별 자체 크기는 대부분 작음
- 캐릭터 의상 색상 약간 냉각: 오렌지/붉은 계열 스웨터가 neutral로 이동 (continuity 영향 없음)

---

## 연결 문서 업데이트

- `public/images/canonical/source/MANIFEST.md` — cafe 25장 추가, 총 75장
- `docs/ssot/air-engine/REGISTRY_v1_verified_2026-0516.md` — cafe B→A 승격
