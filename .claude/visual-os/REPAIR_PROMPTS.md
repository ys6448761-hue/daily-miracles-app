# Repair Prompts v1.0

> NEEDS_REVIEW 판정 시 사용하는 표준 수정 프롬프트

---

## 수정 원칙 (모든 프롬프트 상단 고정)

```
REPAIR PRINCIPLES (MUST INCLUDE):
- Do not change any character identity
- Keep faces/species/outfits exactly the same
- Edit ONLY the specified character
- Keep everyone else and the background unchanged
- No new characters, No text, Keep miracle watercolor style
```

---

## 태그별 Repair 프롬프트

### `MARKER_WEAK` - 마커 강화

#### 코드(Code) 마커 강화
```
Enhance ONLY the back-right dark-blue character (Code).
Add clearer circuit patterns on chest/shoulders/arms and a subtle cyan glow, still watercolor.
Do NOT change face, body shape, pose, or outfit silhouette.
Keep all other characters unchanged.
```

#### 코미(Komi) 마커 강화
```
Enhance ONLY the left-second ocean-blue character (Komi).
Make the tablet show an operations/checklist style UI (iconic, no readable text), and add a small operations badge detail.
Do NOT change face/body/pose/outfit silhouette.
Keep all other characters unchanged.
```

#### 루미(Lumi) 마커 강화
```
Enhance ONLY the right-second mint-teal character (Lumi).
Add clearer crystal accessories and data visualization elements floating nearby.
Make the teal color more distinct from blue characters.
Do NOT change face/body/pose/outfit silhouette.
Keep all other characters unchanged.
```

---

### `IDENTITY_DRIFT` (경미) - 컬러 보정

#### 컬러 복원 (일반)
```
Restore the original color palette for [CHARACTER_NAME].
Target color: [ORIGINAL_COLOR]
Current issue: [DRIFTED_COLOR]
Keep all other aspects unchanged.
```

#### 푸르미르 컬러 복원
```
Restore the center human character (Purmilr) to royal purple + gold outfit.
Keep the miracle compass in hand.
Do not change pose or facial expression.
```

---

### `TEXT_LOGO` - 텍스트 제거

```
Remove any visible text, logos, or watermarks from the image.
Replace the text area with natural background continuation.
Keep all characters and composition unchanged.
```

---

### `STYLE_DRIFT` (경미) - 스타일 보정

```
Adjust the overall style to match Ghibli-inspired watercolor aesthetic.
Soften harsh edges and add subtle brush texture.
Warm up the color temperature slightly.
Keep all characters and composition unchanged.
```

---

## Repair Loop 규칙

### 1회 제한
- NEEDS_REVIEW → Repair 1회 실행 → 재QA
- 재QA에서 또 NEEDS_REVIEW면 → FAILED로 종료
- **무한 루프 금지**

### 수정 범위
- 전체 재생성 **금지**
- 문제 캐릭터/요소만 부분 수정
- 수정되지 않은 부분은 그대로 유지

### 기록 필수
```markdown
## Repair History
| 회차 | 태그 | 수정 내용 | 결과 |
|------|------|----------|------|
| 1 | MARKER_WEAK | 코드 회로 패턴 강화 | PASSED |
```

---

## 복합 태그 Repair 순서

여러 태그가 있을 경우 아래 순서로 처리:

1. `IDENTITY_DRIFT` (가장 먼저)
2. `MARKER_WEAK`
3. `TEXT_LOGO`
4. `STYLE_DRIFT`

**한 번에 1개 태그만 수정** → 재QA → 다음 태그

---

## Repair 불가 태그

아래 태그는 Repair로 해결 불가, **재생성 필수**:

- `CAST_MISSING` - 캐릭터 추가 불가
- `NEW_CHARACTER` - 캐릭터 삭제 어려움
- `SEAT_DRIFT` (심각) - 전체 구도 변경 필요

---

*Aurora5 Visual OS v1.0*
