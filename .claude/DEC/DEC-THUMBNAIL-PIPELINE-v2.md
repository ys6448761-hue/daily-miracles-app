# 📄 DEC-THUMBNAIL-PIPELINE-v2

> **Decision Record** — Thumbnail Pipeline v2 (SSOT Lock)
> 작성: 2026-05-05 | 상태: ACTIVE

---

## 1. 목적 (Purpose)

```
DreamTown 썸네일 생성 파이프라인을 표준화하여
개발자 변경, 기능 확장, 신규 장소 추가 시에도
일관된 결과를 유지한다.
```

---

## 2. 핵심 원칙 (Core Principles)

```
1. 썸네일은 "이미지"가 아니라 "감정 장면"이다
2. 별은 항상 1개이며, 절대 소유되지 않는다
3. Sowoni는 항상 장면의 감정 중심이다
4. 설명이 아니라 "흐름"으로 전달한다
5. 장소는 배경이 아니라 감정 역할이다
```

---

## 3. 시스템 구조 (Architecture)

```
[Config]
config/thumbnail/{location}.json          ← 장소 SSOT (씬/스타일/별/인물/구도)
config/thumbnail/{location}-copy.json     ← 감정별 카피라이팅 5개

↓

[Build]
scripts/thumbnail/build-thumbnail.js --location {location}
  → outputs/prompts/thumbnail/{location}/*.txt  (5개)

↓

[Generate]
scripts/thumbnail/generate-thumbnail.js --location {location}
  → gpt-image-1 API (5회)
  → public/images/thumbnails/{location}/base/   (5장)

↓

[Full 25]
scripts/thumbnail/build-thumbnail.js --location {location} --full25
  → lib/recolorStar.js (Sharp, API 없음)
  → public/images/thumbnails/{location}/generated/full/  (25장)
  → manifest.json 자동 생성
```

---

## 4. 실행 규칙 (Execution Rules)

```
1. 모든 썸네일 생성은 공통 스크립트만 사용
   ✅  node scripts/thumbnail/build-thumbnail.js --location {loc}
   ✅  node scripts/thumbnail/generate-thumbnail.js --location {loc}
   ✅  node scripts/thumbnail/build-thumbnail.js --location {loc} --full25

2. location별 전용 스크립트 사용 금지 (deprecated)
   ❌  build-hamel-prompts.js
   ❌  generate-hamel-images.js
   ❌  build-cablecar-prompts.js
   ❌  generate-cablecar-images.js

3. 새로운 장소 추가 시
   → config/{location}.json + {location}-copy.json 추가만으로 완료
   → 스크립트 수정 금지
```

---

## 5. SSOT 검증 규칙 (Mandatory Validation)

### ⭐ 별 규칙 (절대 고정)

```
- 별은 정확히 1개
- 별은 하늘에 존재 (창문 너머, 지평선 위)
- 별은 손에 들리지 않는다
- 별은 캐릭터와 접촉하지 않는다
```

config 필수 필드:
```json
"star": {
  "count": "exactly one star only",
  "rule": "star floats in sky. Never in hands, never on a surface, never touching the character."
}
```

---

### 👤 캐릭터 규칙

```
- Sowoni 반드시 등장
- 뒷모습 또는 측면 (감정 공간 확보)
- 감정 중심은 Sowoni
- 마스코트(아우룸) 전면 등장 금지
```

config 필수 필드:
```json
"character": {
  "description": "Sowoni stands quietly...",
  "rule": "Sowoni must be present. No star in hands. No mascot character."
}
```

---

### 🎬 장소별 감정 역할

```
케이블카 (cablecar):
→ 씬: 케이블카 내부, 창문 너머 바다와 별
→ 감정 역할: 상승 / 시작 / 바라봄
→ 시점: 반드시 내부 시점 (exterior-only 금지)

하멜 (hamel):
→ 씬: 하멜 등대 앞 야외 항구
→ 감정 역할: 정리 / 수용 / 기억
→ 시점: 인물이 바다를 바라보는 구도
```

---

### 🎨 스타일 규칙

```
필수:
- 2D illustration
- watercolor texture
- Ghibli-inspired
- Korean emotional tone

금지:
- photorealistic
- 3D render
- 관광 포스터 느낌 (tourism poster)
- 극도의 세밀묘사 (ultra detail)
```

---

## 6. 코드 강제 규칙 (Enforcement)

`buildPrompt()` 실행 시 자동 적용:

```
1. config key 누락 → undefined 출력 차단 (filter(v != null))
2. style.forbidden 전체 항목 → Do NOT 섹션에 자동 삽입
3. star.count / star.rule → Star 섹션에 자동 삽입
4. character.description + character.rule → Character 섹션에 자동 삽입
5. composition.flow → Composition 섹션에 자동 삽입 (있을 때만)
```

---

## 7. 폴더 규칙 (Directory Rules)

```
outputs/
  prompts/
    thumbnail/
      {location}/          ← build 결과 (.txt × 5)

public/
  images/
    thumbnails/
      {location}/
        base/              ← generate 결과 (5장)
        generated/
          full/            ← full25 결과 (25장 + manifest.json)
          sample/          ← sample5 결과 (5장, 검수용)
```

---

## 8. Deprecated 정책

```
기존 location별 스크립트는 삭제하지 않는다.
실행 시 경고 출력 후 실행은 계속된다.

⚠️  [deprecated] use: node scripts/thumbnail/build-thumbnail.js --location hamel
```

---

## 9. DoD (Definition of Done)

```
[기능]
✅ base 5장 생성 (generate-thumbnail.js)
✅ full 25장 생성 (build-thumbnail.js --full25)
✅ manifest.json 자동 생성

[SSOT]
✅ 별 1개 조건 100% 준수
✅ 손에 별 없음
✅ Sowoni 반드시 등장

[정합성]
✅ 장소별 감정 역할 유지
✅ DreamTown 톤 유지
✅ undefined 값 프롬프트 유입 없음
```

---

## 10. 확장 규칙 (Scalability)

새 장소 추가 절차:

```
1. config/thumbnail/{new_location}.json 생성
   → scene / style / color / star / character / composition / text 필드 작성

2. config/thumbnail/{new_location}-copy.json 생성
   → 5개 감정 카피 작성

3. build + generate + full25 실행
   → 스크립트 코드 수정 없음
```

---

## 🧠 루미 최종 문장

```
DreamTown은 결과를 만드는 시스템이 아니라
사람이 스스로 방향을 다시 느끼게 하는 구조다.
```

---

## 🔥 루미 최종 판정

```
이 DEC 하나로
개발자 바뀌어도 시스템 안 무너진다
```
