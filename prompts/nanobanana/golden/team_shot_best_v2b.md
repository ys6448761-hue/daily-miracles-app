# Aurora 5 단체샷 - Golden Best v2b

> **상태**: BEST (QA PASSED)
> **승격일**: 2026-01-11
> **QA 점수**: 95/100
> **방식**: 멀티턴 편집 (v2a → v2b)

---

## 승격 조건

- [x] 프롬프트 템플릿 완성
- [x] 결과 이미지 확보 (`team_shot_best_v2b.png`)
- [x] QA PASSED (95/100) 획득
- [ ] 10회 검증 중 9회+ 성공 (대기)

---

## 결과 이미지

| 항목 | 값 |
|------|-----|
| 파일 경로 | `assets/golden/team_shot_best_v2b.png` |
| 해상도 | 1024x1024 |
| 생성 도구 | Gemini (멀티턴 편집) |
| 편집 원본 | `assets/golden/team_shot_best_v2a.png` |

---

## 사용 프롬프트 (멀티턴 편집)

### Step 1: 편집 원칙 (Lock)
```
LOCK EVERYTHING. Do not change any face, species, outfit silhouette, pose, body ratio, or color palette.
Exactly 6 characters must remain clearly visible. No merging into aura/light/silhouette.
No new characters. No humans. No extra mascots. No text/logos/watermarks.
Keep the background, composition, lighting, and central table unchanged.
Edit only the specified character and only by adding marker textures (not changing shapes).
```

### Step 2: 코드 마커 강화
```
Enhance ONLY the back-right dark-blue character (Code).
Add clearer circuit patterns on the chest/shoulders/arms and a very subtle cyan glow, still watercolor.
Do NOT change the face, horns, pose, or outfit silhouette.
Keep all other characters and the entire background unchanged.
```

### Step 3: 코미 마커 강화
```
Enhance ONLY the second-from-left ocean-blue character (Komi).
Make the tablet show an operations/checklist-style icon UI (icons only, no readable text), and add a small operations badge detail.
Do NOT change face/body/pose/outfit silhouette.
Keep all other characters and the entire background unchanged.
```

---

## v2a → v2b 개선점

| 항목 | v2a | v2b |
|------|-----|-----|
| QA 점수 | 92.5 | 95 |
| 코미 마커 | 약함 | 체크리스트 UI 명확 |
| 코드 마커 | 약함 | 다크블루 + 회로 강화 |
| MARKER_WEAK | 있음 | 해결됨 |

---

## 관련 파일

| 파일 | 경로 |
|------|------|
| 이미지 | `assets/golden/team_shot_best_v2b.png` |
| 메타 | `assets/golden/team_shot_best_v2b_meta.md` |
| QA 리포트 | `reports/consistency/qa-team_shot_best_v2b-2026-01-11.md` |

---

## 사용 가이드 (멀티턴 편집 재현)

1. Gemini 접속 → 이미지 편집 모드
2. `team_shot_best_v2a.png` 1장만 업로드 (중복 금지)
3. Step 1 원칙 입력
4. Step 2 코드 마커 강화 입력 → 결과 확인
5. Step 3 코미 마커 강화 입력 → 결과 확인
6. 최종 결과 다운로드

---

## 검증 현황

| 항목 | 상태 |
|------|------|
| QA Gate | ✅ PASSED |
| 10회 검증 | 대기 중 |
| 최종 선언 | NOT_READY (검증 후 READY) |

---

*NanoBanana Golden Best - Aurora5 Visual OS v1.0*
