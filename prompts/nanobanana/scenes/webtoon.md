# 웹툰 씬 템플릿 (Webtoon)

> **용도**: Aurora5 웹툰/만화 컷 생성
> **권장 모델**: Nano Banana (단순 컷) / Pro (복잡한 구도)

---

## 프롬프트 템플릿

### 한글 설명
```
한국 웹툰 스타일의 만화 컷.
깔끔한 선화 + 수채화 채색, 감정 전달에 집중.
```

### 영문 프롬프트 (Gemini 입력용)

```
[STYLE LOCK]
Korean webtoon style illustration, clean ink linework.
Soft watercolor coloring over line art.
Expressive character poses, dynamic composition.
Ghibli-inspired warmth, hand-drawn texture.

[SCENE]
A webtoon panel showing {SCENE_DESCRIPTION}.
{CHARACTER} with {EXPRESSION} expression.
{ACTION_DESCRIPTION}.

[COMPOSITION]
- Panel type: {SINGLE/MULTI}
- Character focus: {CLOSE_UP/MEDIUM/FULL}
- Background: {DETAILED/SIMPLE/SPEED_LINES}
- Speech bubble space: {YES/NO}

[EXPRESSION GUIDE]
- 기쁨: Sparkly eyes, wide smile
- 걱정: Furrowed brow, downturned mouth
- 집중: Narrowed eyes, determined look
- 응원: Warm smile, encouraging gesture

[NEGATIVE]
3D, photorealistic, manga screentone (unless requested), detailed realistic face, text in image, watermark.
```

---

## 컷 타입별 템플릿

### 1. 클로즈업 (감정 강조)
```
Close-up of {CHARACTER}'s face showing {EMOTION}.
Soft background blur, focus on expression.
Minimal facial details but clear emotion.
```

### 2. 미디엄 샷 (대화/행동)
```
Medium shot of {CHARACTER} doing {ACTION}.
Upper body visible, hands in frame if relevant.
Simple background with key elements.
```

### 3. 풀 샷 (전신/상황)
```
Full body shot of {CHARACTER} in {LOCATION}.
Complete pose visible, environmental context.
Dynamic composition with depth.
```

### 4. 그룹 샷 (여러 캐릭터)
```
Group shot with {CHARACTERS} interacting.
Clear character hierarchy, varied poses.
Enough space between characters.
```

---

## 권장 비율

| 컷 타입 | 비율 | 용도 |
|---------|------|------|
| 세로 컷 | 9:16 | 모바일 웹툰 |
| 가로 컷 | 16:9 | 풀 페이지 |
| 정사각형 | 1:1 | SNS 공유 |

---

*마지막 업데이트: 2026-01-11*
