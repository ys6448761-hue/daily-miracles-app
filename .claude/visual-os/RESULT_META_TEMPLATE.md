# Result Meta Template v1.0

> 모든 이미지 결과물은 반드시 이 메타 파일과 함께 저장

---

## 기본 정보

| 항목 | 값 |
|------|-----|
| **Image File** | `assets/golden/{filename}.png` |
| **Request ID** | `RR-YYYYMMDD-NNN` |
| **Generated** | YYYY-MM-DD HH:MM |
| **Engine** | gemini / sora |
| **Scene Type** | team_shot / storybook / webtoon_panel / video_frame |

---

## 입력 자산

### Style Anchor
```
assets/references/style/miracle_watercolor_anchor.png
```

### Reference Set Used
```
1. assets/references/characters/purmilr/01_front.png
2. assets/references/characters/yeouibozu/01_front.png
3. assets/references/characters/komi/01_front.png
4. assets/references/characters/lumi/01_front.png
5. assets/references/characters/jaemi/01_front.png
6. assets/references/characters/code/01_front.png
```

---

## 사용 프롬프트

```
(실제 사용한 전체 프롬프트 복사)
```

---

## QA 결과

| 항목 | 값 |
|------|-----|
| **QA Status** | `PASSED` / `NEEDS_REVIEW` / `FAILED` / `SKIPPED` |
| **Score** | NN/100 (참고용) |
| **QA Report** | `reports/qa/{filename}_qa.md` |
| **FAIL Tags** | (해당 시) `MARKER_WEAK`, `IDENTITY_DRIFT` 등 |

---

## Repair History (수정 이력)

| 회차 | 수정 내용 | 결과 |
|------|----------|------|
| 1 | (예: 코드 마커 강화) | PASSED / FAILED |

---

## Validation (10회 검증)

| 항목 | 값 |
|------|-----|
| **Validation Required** | Yes / No |
| **Validation Path** | `reports/validation/YYYY-MM-DD/{scene}_run01~10.md` |
| **Result** | N/10 PASSED |
| **Status** | `READY` / `NOT_READY` |

---

## 승격 기록

| 항목 | 값 |
|------|-----|
| **Promoted to Best** | Yes / No |
| **Best Path** | `assets/golden/{scene}_best_v{N}.png` |
| **Promoted Date** | YYYY-MM-DD |

---

## 비고

```
(추가 메모)
```

---

*Aurora5 Visual OS v1.0*
