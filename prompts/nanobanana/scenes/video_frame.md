# 영상 프레임 씬 템플릿 (Video Frame)

> **용도**: 기적영상/Veo 생성을 위한 키프레임
> **권장 모델**: Nano Banana Pro → Veo 연계

---

## 프롬프트 템플릿

### 한글 설명
```
영상 생성(Veo)을 위한 키프레임 이미지.
일관된 캐릭터로 연속된 장면 생성 가능하도록 설계.
```

### 영문 프롬프트 (Gemini 입력용)

```
[STYLE LOCK]
2D animation keyframe, Ghibli-inspired warmth blended with Korean webtoon style.
Soft watercolor gradients, consistent character design.
Clean silhouettes suitable for animation.
Hand-painted texture, smooth color transitions.

[SCENE]
A keyframe for animation showing {SCENE_DESCRIPTION}.
{CHARACTER} in {POSE} with {EXPRESSION}.
Background: {BACKGROUND_DESCRIPTION}.

[ANIMATION READY]
- Clear character outline (no complex overlaps)
- Consistent lighting direction
- Simple background layers (foreground/midground/background)
- Neutral or animatable pose

[COMPOSITION]
- Aspect ratio: 16:9 (video standard)
- Character position: {RULE_OF_THIRDS_POSITION}
- Movement space: {DIRECTION} for anticipated motion
- Safe zone: Keep important elements away from edges

[NEGATIVE]
3D render, photorealistic, complex overlapping elements, detailed face, text, watermark, static composition.
```

---

## 키프레임 타입

### 1. 오프닝 프레임
```
Wide establishing shot of digital dragon palace.
Soft camera movement anticipated (zoom in).
Magical particles floating.
```

### 2. 캐릭터 등장
```
{CHARACTER} entering frame from {DIRECTION}.
Welcoming pose, warm expression.
Space for movement toward camera.
```

### 3. 인터랙션 프레임
```
{CHARACTER_A} and {CHARACTER_B} facing each other.
Conversational pose, eye contact implied.
Background simplified for focus.
```

### 4. 클로징 프레임
```
Aurora5 team together, facing camera.
Celebration pose, warm lighting.
Fade out ready composition.
```

---

## Veo 연계 가이드

### 이미지 → 영상 변환

```
1. Nano Banana Pro로 키프레임 3-5장 생성
2. 각 프레임의 캐릭터 일관성 확인 (QA)
3. Veo에 키프레임 + 모션 프롬프트 입력
4. 생성된 영상에서 캐릭터 일관성 재확인
```

### 모션 프롬프트 예시
```
"Gentle camera zoom in, character waves hello,
soft particles floating upward,
warm ambient lighting, 2D animation style"
```

---

## 권장 비율

| 용도 | 비율 | 해상도 |
|------|------|--------|
| 유튜브/일반 | 16:9 | 1920x1080 |
| 인스타 릴스 | 9:16 | 1080x1920 |
| 정사각형 | 1:1 | 1080x1080 |

---

*마지막 업데이트: 2026-01-11*
