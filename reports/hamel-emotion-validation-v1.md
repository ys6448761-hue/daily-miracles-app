# Hamel Lighthouse Emotion Validation — Phase 2

**생성일**: 2026-05-25
**모델**: gpt-image-1 / 1024x1536
**비용**: $0.24 (storybook 5장 $0.20 + miracle 1장 $0.04)
**SSOT**: docs/ssot/dreamtown/DreamTown_Emotion_Grammar_v1.md
**장소 특성**: 실내+실외 / 수면 / 물빛 / 방향 / 기다림 / 신호

---

## 생성 파일

| 종류 | 파일 |
|------|------|
| storybook 5장 | `public/images/world-canvas/validation/hamel/hamel_{emotion}_v1.png` |
| miracle world-canvas | `public/images/world-canvas/validation/hamel/hamel_world_canvas_v1.png` |
| Storybook prototype | `public/debug/hamel-storybook-v1.html` |
| Miracle prototype | `public/debug/hamel-miracle-v1.html` |

---

## 1. 감정별 소견

### confusion — 혼란

```
place:    hamel_lighthouse
distance: medium
file:     hamel_confusion_v1.png
```

```
✅ SSOT 부합
- 석조 아치 창, 철제 난간 — 등대 건축 공간 명확히 구성됨.
- 짙은 안개 — 바다와 하늘 경계 소멸, 방향 불분명.
- 등대 빔이 안개 너머 희미하게 흘러가는 빛으로만 처리 — 방향 없음 정확.
- 인물 중앙, 완전히 뒤 돌아선 채 안개 속 바다 바라봄.
- 별 없음 — SSOT 준수.
- 색: 딥 그레이-블루, 낮은 채도, 무거운 공기.

장소 감정 부합:
  "방향이 불분명한 공기" ✅
  cablecar confusion의 "안개 속 찾는 중"과 같은 문법,
  hamel의 "방향" 감정이 더해져 구분 명확.
```

---

### pause — 멈춤

```
place:    hamel_lighthouse
distance: medium
file:     hamel_pause_v1.png
```

```
✅ SSOT 부합
- 원형 철제 난간 + 석조 아치 — 공간 구성 정확.
- 등대 빔 1회 조용한 스윕 — 리듬은 있으나 드라마 없음.
- 인물 완전 정지 — "숨 고르기" 정확.
- 바다 잔잔, 파도 멈춤.
- 딥 블루 지배. 별 존재 미확인 (팀 확인).

주의:
  석조 벽에 등대 빔 반사로 warm amber 존재.
  건축 조명으로 판단 (관광 분위기 아님).
  팀 검수에서 "warm tone이 과한가" 확인 권장.

cablecar와 비교:
  같은 멈춤. 케이블카 손잡이 → 등대 난간. 공간만 달라짐. 감정은 동일.
```

---

### calm — 고요함

```
place:    hamel_lighthouse
distance: medium
file:     hamel_calm_v1.png
```

```
✅ SSOT 부합
- 아치 창이 등대를 프레임처럼 감싸는 구도 — 매우 안정적.
- 등대가 창 너머 바다 위 서 있음 — 인물과 등대 사이 공간감.
- 등대 빔이 수면에 부드럽게 반사 — "일정한 반복, 차분한 야청색" 정확.
- 별이 아치 상단에 아주 조금 보임 — "조용히 탄생 중" 정확.
- 인물 settled — 무게감 없이 이 순간에 머무는 느낌.

주목:
  아치 창이 등대를 "가두지 않고 열어줌" — 세계가 여전히 넓게 보임.
  confusion(난간) → pause(난간) → calm(아치 창)으로 구도 변화 자연스러움.
```

---

### curiosity — 호기심

```
place:    hamel_lighthouse
distance: wide
file:     hamel_curiosity_v1.png
```

```
✅ SSOT 부합 — cablecar보다 더 정확하게 표현됨
- 왼쪽 수평선에 희미한 빛 점 존재.
  "멀리서 보이는 희미한 빛" — SSOT 직접 실현.
  형태 없는 distant glow. 도착 아님. 다가오는 중.
- 등대 빔이 그 방향을 은근히 가리킴 — "저기는 어떤 곳일까" 느낌.
- wide 구도 — 하늘과 바다가 인물보다 훨씬 크게 열림.
- 딥 블루, lavender 방향 이동 없음 (cablecar와 다른 처리).
  → hamel은 "빛 방향"으로 호기심 표현 / cablecar는 "색 방향" — 장소 특성 반영됨.

cablecar와 비교:
  cablecar curiosity v2: 원형 glow, 상단 중앙.
  hamel curiosity:       수평선 distant light point. 훨씬 더 "탐색 중" 느낌.
  → hamel이 curiosity 표현에 더 적합할 수 있음.
```

---

### fragile_hope — 연약한 희망

```
place:    hamel_lighthouse
distance: detail
file:     hamel_fragile_hope_v1.png
```

```
✅ 대체로 SSOT 부합 (주의 1건)
- 아치 창 클로즈업 구도 — detail distance 의도 실현.
- 등대 빔이 수면에 부드럽게 이어짐 — "작은 빛이 꺼지지 않고 있다" 정확.
- 아치 상단에 4각형 별 소형 존재.

주의:
  별이 4각형 형태를 가짐.
  그러나 크기가 매우 작고 아치 프레임 안에 조용히 위치.
  cablecar fragile_hope v1과 유사한 수준 — "거의 완성됐지만 아직"으로 읽힘.
  팀 검수에서 "별이 도착한 느낌인가" 확인 필요.

장소 감정:
  "작은 빛의 지속" — 등대 빔이 이 감정의 핵심을 대신함.
  별보다 등대 빔이 fragile_hope를 더 잘 전달하는 독특한 구조.
```

---

## 2. cablecar와 세계 일관성 비교

### 같은 것

```
감정 문법:
  confusion  → 안개, 방향 없음, 별 없음 ✅ 동일
  pause      → 정지, 한 번의 빛, 숨 고르기 ✅ 동일
  calm       → 수면 반사, 별 탄생 중, 야청색 ✅ 동일
  curiosity  → 멀리 있는 빛, 탐색 중 ✅ 동일
  fragile_hope → 아직 완성 안 된 별, 지속하는 빛 ✅ 동일

색 체계:
  딥 블루-블랙 수채화 기반 ✅ 동일
  별 여정: 없음 → 희미 → 탄생 → 접근 → 거의완성 ✅ 동일
  warm tone 절제 ✅ 동일

스타일:
  2D watercolor / Ghibli tone / 인물 뒤돌아선 ✅ 동일
```

### 다른 것 (장소 특성)

```
cablecar                  hamel_lighthouse
────────────────────      ──────────────────────────
케이블카 내부              등대 플랫폼 / 아치 창
창문 + 손잡이              철제 난간 + 석조 아치
도시+바다 뷰               바다+등대+수평선 뷰
별이 하늘에서 내려옴       빛이 수평선에서 다가옴
"어디로 갈지"              "어디를 향할지"
방향 찾는 공기             방향이 있는 공기 (등대 = 신호)
```

**판정: 같은 세계, 다른 감정 질감. DreamTown 일관성 유지. ✅**

---

## 3. Storybook ↔ Miracle 체감 분리

```
storybook (hamel-storybook-v1.html):
  이미지: 등대 가까이 — 아치 창, 난간, 인물 중심
  텍스트: 짧은 감정 문장 linger
  느낌: 등대 옆에 조용히 서 있는 나

miracle (hamel-miracle-v1.html):
  이미지: 등대 외부 — 등대 전체, 바다, 별, 인물 8% 실루엣
  레이어: sky breath / light sweep / star breath / water shimmer / air grain
  느낌: 등대가 살아있는 세계 속에 조용히 서 있다

분리 명확도:
  storybook: 나와 등대 사이의 공간
  miracle:   등대와 세계 사이의 공간
  → 같은 등대, 다른 거리. ✅
```

### Miracle Presence 레이어 — hamel 특화

```
light_sweep (신규):
  cablecar에 없는 hamel 고유 레이어.
  등대 빔 sweep을 10s 주기로 좌우 미세 회전 (±8도).
  진폭: opacity 0.20→0.80 — barely perceptible.
  등대 장소 감정 "신호" 를 presence로 번역.
```

---

## 4. 검수 질문 평가

```
1. DreamTown답나?
   → ✅ 2D 수채화, 여백, 감정 우선, 기술 최소.
      관광지 느낌 없음. DreamTown navigation symbol ✅.

2. 같은 감정 문법이 유지되는가?
   → ✅ 5감정 모두 Emotion Grammar v1 구조 유지.
      별 여정 (없음→탄생→완성 직전) 동일하게 작동.

3. 장소만 바뀌고 세계는 유지되는가?
   → ✅ 색계, 감정 구조, 인물 처리 방식 동일.
      hamel 특성(방향/기다림/신호)이 감정에 자연스럽게 섞임.

4. 설명보다 여운이 남는가?
   → ✅ "작은 빛이 꺼지지 않고 있었어요." — 해석 없음.
      사용자가 자기 상황을 투영할 공간 있음.

5. 사용자가 자기 감정을 넣을 공간이 남아있는가?
   → ✅ 이미지가 완결되지 않음. 별이 아직 도착하지 않음.
      등대 빔이 "이미 도착한 안내"가 아니라 "계속 찾고 있는 신호"로 읽힘.
```

---

## 5. 주의사항 (팀 검수 포인트)

```
pause:
  석조 벽 warm amber 반사 확인 필요.
  → "warm tone이 과한가, 아니면 건축 조명인가"

fragile_hope:
  아치 상단 4각형 별 형태 확인 필요.
  → "도착한 느낌인가, 아직 조심스러운가"
  → 등대 빔이 별보다 강하게 fragile_hope를 전달하고 있어
     별 자체보다 전체 느낌으로 판단 권장.

curiosity:
  수평선 distant light가 "접근 중" vs "이미 저기 있음"으로 보이는지 확인.
  → 현재 점 크기와 위치는 SSOT 기준 정확하다고 판단됨.
```

---

## 6. 다음 단계

> **cafe validation** 또는 **팀 감정 검수**

팀/CEO 검수 대상:
```
hamel-storybook-v1.html  → http://localhost:5100/debug/hamel-storybook-v1.html
hamel-miracle-v1.html    → http://localhost:5100/debug/hamel-miracle-v1.html
```

cablecar + hamel 통과 시:
```
1. cafe validation — Phase 3
   place: cafe (내부 시점, 창가, 항구 반사)
   감정 5종 동일 적용

2. star-cache 확장 생성
   cablecar + hamel storybook 이미지 → star-cache 소스로 전환
   (현재 validation 폴더 → star-cache 경로 이동)

3. miracle 전용 경로 확정
   world-canvas/miracle/{place}/ 로 이미지 이동 및 routing.json 연결
```
