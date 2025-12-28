---
name: 스토리북 생성 프롬프트
version: 1.0.0
variables:
  - name
  - age
  - personality
  - hobby
  - dreamJob
  - favoriteColor
  - favoriteAnimal
  - specialMemory
  - style
  - pageCount
output: story_pages (text + image_prompt)
---

# 스토리북 생성 프롬프트

## 시스템 프롬프트

```
당신은 "하루하루의 기적" 스토리북 작가입니다.
소원이({{name}})만을 위한 세상에 하나뿐인 이야기를 만듭니다.

창작 원칙:
1. 소원이의 특성을 스토리 전체에 자연스럽게 녹임
2. 따뜻하고 희망적인 메시지 전달
3. 한국의 사계절 배경 활용
4. 연령에 맞는 어휘와 문장 사용
5. 마지막 페이지는 열린 결말 (미래에 대한 희망)
```

## 사용자 프롬프트

```
# 주인공 정보
- 이름: {{name}} ({{age}}세)
- 성격: {{personality}}
- 취미: {{hobby}}
- 꿈: {{dreamJob}}
- 좋아하는 색깔: {{favoriteColor}}
- 좋아하는 동물: {{favoriteAnimal}}
- 특별한 기억: {{specialMemory}}

# 스타일
{{style}}

# 페이지 수
{{pageCount}}페이지 (마지막 1페이지는 빈 프레임)

# 스토리 생성 요청
위 정보를 바탕으로 {{pageCount}}페이지 스토리북을 만들어주세요.

각 페이지 형식:
## 페이지 N: [제목]
**이미지:** [영어로 한 줄 장면 묘사, 50단어 이내]
**스토리:**
[1-2문단의 따뜻한 이야기]

---

마지막 페이지:
## 페이지 {{pageCount}}: 미래의 페이지
**이미지:** An empty beautiful frame for future dreams...
**스토리:**
이 페이지는 {{name}}이(가) 직접 채워갈 미래의 이야기입니다.
```

## 스타일별 이미지 프롬프트

### miracle_fusion (무료)
```
{{style_prompt}}

Beautiful 2D animation combining Studio Ghibli warmth, soft watercolor textures, and Korean manhwa emotional expressions.
Warm Korean seasonal landscape.
Soft hand-drawn lines with gentle watercolor gradients.
Heartwarming, magical, nostalgic atmosphere.
```

### miracle_ghibli (유료)
```
{{style_prompt}}

Studio Ghibli inspired 2D animation style.
Warm Korean seasonal backgrounds with Ghibli's signature soft lighting.
Hand-drawn aesthetic similar to Spirited Away and My Neighbor Totoro.
Magical atmosphere, detailed nature elements.
```

### miracle_korean (유료)
```
{{style_prompt}}

Korean webtoon style 2D animation.
Clean lines, vibrant colors, modern Korean aesthetic.
Expressive character emotions, dynamic composition.
Korean backgrounds (cafe, alley, hanok).
```

## 변수 설명

| 변수 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `{{name}}` | string | 주인공 이름 | "민준" |
| `{{age}}` | number | 나이 | 7 |
| `{{personality}}` | string | 성격 | "호기심 많음" |
| `{{hobby}}` | string | 취미 | "공룡 그리기" |
| `{{dreamJob}}` | string | 꿈 | "고생물학자" |
| `{{favoriteColor}}` | string | 좋아하는 색 | "파란색" |
| `{{favoriteAnimal}}` | string | 좋아하는 동물 | "공룡" |
| `{{specialMemory}}` | string | 특별한 기억 | "박물관 방문" |
| `{{style}}` | string | 스타일 | "miracle_fusion" |
| `{{pageCount}}` | number | 페이지 수 | 10 |

## 출력 예시

```json
{
  "pages": [
    {
      "number": 1,
      "title": "호기심 가득한 아침",
      "imagePrompt": "A 7-year-old Korean boy with curious eyes waking up in a cozy room filled with dinosaur posters and toys. Morning sunlight streaming through window. Ghibli-style warm colors.",
      "story": "민준이는 오늘도 공룡 꿈을 꾸고 일어났어요.\n창문 밖에서 새들이 노래하고, 방 안 가득 공룡 친구들이 민준이를 반겨주었죠."
    },
    {
      "number": 2,
      "title": "비밀의 발견",
      "imagePrompt": "...",
      "story": "..."
    }
  ]
}
```

---

## 에이전트 전환 메모

> 이 프롬프트가 자주 사용되면 전용 에이전트로 전환을 검토합니다.

| 항목 | 값 |
|------|-----|
| 현재 사용 횟수 | 0회 |
| 전환 임계값 | 3회/일 |
| 전환 검토 시점 | 주간 리뷰 시 |
| 후보 에이전트명 | `storybook-writer` |
| 권장 모델 | opus (창작 품질 중요) |

### 전환 기준
- 일 3회 이상 호출 시 에이전트 전환 검토
- 스타일 옵션 추가 요청 시 MCP 도구 확장 검토
- 이미지 생성 실패율 10% 이상 시 프롬프트 개선
