# GATE 5 — Hotel Fragile Hope Star Reduction 완료 보고서

**실행일**: 2026-05-17  
**담당**: Code Master  
**상태**: COMPLETED

---

## 작업 개요

hotel fragile_hope 5장의 별 가시성을 "symbolic focus" → "almost_unnoticed continuity trace"로 감소.  
원본 파일 보존, 처리 결과를 `public/images/canonical/source/hotel/`에 저장.

---

## 처리 기술 상세

### 알고리즘

1. **별 위치 탐지**: cross-star 팔 패턴(N/S/E/W 방향 5/10/15px 평균 밝기) 기반 탐지
2. **배경 추정**: 별 중심에서 200-260px 거리 링 영역의 평균 RGB 샘플링
3. **배경 보존 감소 공식**: `pixel = bg + (original - bg) * keepRatio`
   - excess < 20 픽셀: 미처리 (배경과 동일 취급)
   - excess >= 20 픽셀에만 keepRatio 적용
4. **keepRatio 구간 (gradient)**:
   - core 0-20px: 0.05 (95% 감소)
   - mid 20-50px: 선형 0.05→0.25
   - outer 50-80px: 선형 0.25→0.70
   - edge 80-100px: 선형 0.70→1.00

---

## 처리 결과

```yaml
GATE_5_RESULT:
  modified_count: 5
  method: background_preserving_gradient_reduction
  output_path: public/images/canonical/source/hotel/

  files:
    - file: 05_fragile_hope_citrine_yeosu_hotel_stage4.png
      star_location: "(681, 209)"
      original_brightness: 244.6
      result: star_dim_point_in_sky
      dod_pass: true

    - file: 10_fragile_hope_sapphire_yeosu_hotel_stage4.png
      star_location: "(696, 231)"
      original_brightness: 239.6
      result: small_dark_cross_barely_visible
      dod_pass: true

    - file: 15_fragile_hope_emerald_yeosu_hotel_stage4.png
      star_location: "(620, 215)"
      original_brightness: 247.4
      result: near_invisible_point_in_sky
      dod_pass: true

    - file: 20_fragile_hope_ruby_yeosu_hotel_stage4.png
      star_location: "(595, 254)"  # 실제 탐지 — Pass1은 오탐 (396,169)
      original_brightness: ~236.7
      passes: 3  # Pass1 오탐 → Pass2 재처리 → FINAL 정확 좌표
      result: faint_cross_among_harbor_lights
      dod_pass: true
      notes: "Pass1에서 x=396 오탐. 실제 별은 x=595. FINAL pass에서 정확 처리 완료."

    - file: 25_fragile_hope_diamond_yeosu_hotel_stage4.png
      star_location: "(639, 227)"
      original_brightness: 250.2
      result: small_quiet_cross_in_sky
      dod_pass: true

  continuity_preserved: true
  symbolic_risk: low  # 별이 더 이상 포컬 포인트 아님
  room_lag_preserved: true  # 실내/외 시간 분리 감각 유지
  harbor_lights_dominant: true  # 도시/항구 불빛이 시선 주도

  upgraded_to_A: true
  remaining_issues: none
```

---

## DoD 체크리스트

| 항목 | 결과 |
|------|------|
| star_no_longer_primary_focus | ✓ (5/5) |
| continuity_pressure_preserved | ✓ |
| room_lag_preserved | ✓ |
| symbolic_reading_reduced | ✓ |
| classification_upgrade_possible | ✓ → A 승격 완료 |

---

## 원본 보존 확인

| 원본 위치 | 상태 |
|-----------|------|
| `public/images/thumbnails/hotel/generated/full/` | 미수정 (GATE 5 작업 대상 아님) |
| `public/images/canonical/source/hotel/` | 처리 결과 5장 저장 |

---

## 분류 변경

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| hotel fragile_hope 5장 | Category A- / pending_star_fix | **Category A / selected_v1** |
| hotel 전체 | 20장 A + 5장 A- | **25장 전체 A** |
| MANIFEST.md 총 등록 수 | 45장 | **50장** |

---

## 연결 문서 업데이트

- `public/images/canonical/source/MANIFEST.md` — fragile_hope 5장 추가, 총 50장
- `docs/ssot/air-engine/REGISTRY_v1_verified_2026-0516.md` — hotel fragile_hope A 승격
