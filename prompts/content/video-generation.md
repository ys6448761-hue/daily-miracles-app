---
name: 기적영상 생성 프롬프트
version: 1.0.0
variables:
  - storybook_id
  - name
  - duration
  - style
  - narration
  - bgm
output: video_script, transitions, narration_text
---

# 기적영상 생성 프롬프트

## 시스템 프롬프트

```
당신은 "하루하루의 기적" 영상 연출가입니다.
소원이({{name}})의 스토리북을 감동적인 영상으로 변환합니다.

연출 원칙:
1. 스토리의 감정선에 맞는 전환 효과
2. 나레이션과 영상의 자연스러운 싱크
3. 배경음악과 분위기 조화
4. 시작과 끝에 임팩트
5. 적절한 호흡과 여백
```

## 사용자 프롬프트

```
# 영상 정보
- 스토리북 ID: {{storybook_id}}
- 소원이 이름: {{name}}
- 영상 길이: {{duration}}초
- 스타일: {{style}}
- 나레이션: {{narration}}
- 배경음악: {{bgm}}

# 스토리북 페이지
{{#each pages}}
페이지 {{number}}: {{title}}
이미지: {{imageUrl}}
스토리: {{story}}
{{/each}}

# 영상 스크립트 생성 요청
위 스토리북을 {{duration}}초 영상으로 변환해주세요.

## 구성 요소

### 1. 오프닝 (5초)
- 제목 카드: "{{name}}의 이야기"
- 페이드 인
- 배경음악 시작

### 2. 본편 ({{duration - 10}}초)
- 각 페이지 균등 배분
- 전환 효과 적용
- 나레이션 싱크

### 3. 엔딩 (5초)
- 마지막 페이지 여운
- 로고: "하루하루의 기적"
- 페이드 아웃

## 전환 효과 옵션
| 효과 | 설명 | 적합한 순간 |
|------|------|------------|
| fade | 부드러운 페이드 | 감정 변화 |
| slide | 좌우 슬라이드 | 장면 전환 |
| zoom | 확대/축소 | 중요 순간 |
| dissolve | 디졸브 | 시간 흐름 |

# 출력 형식
{
  "title": "{{name}}의 이야기",
  "duration": {{duration}},
  "scenes": [
    {
      "scene_number": 1,
      "type": "opening",
      "duration": 5,
      "content": "제목 카드",
      "transition_in": "fade",
      "transition_out": "fade"
    },
    {
      "scene_number": 2,
      "type": "page",
      "page_number": 1,
      "duration": 8,
      "narration": "나레이션 텍스트",
      "transition_in": "fade",
      "transition_out": "slide"
    }
  ],
  "bgm": {
    "type": "{{bgm}}",
    "start": 0,
    "fadeIn": 2,
    "fadeOut": 3
  }
}
```

## 영상 길이별 구성

| 길이 | 오프닝 | 본편 | 엔딩 | 페이지당 |
|------|--------|------|------|---------|
| 30초 | 3초 | 24초 | 3초 | 약 2.5초 |
| 60초 | 5초 | 50초 | 5초 | 약 5초 |
| 90초 | 5초 | 80초 | 5초 | 약 8초 |
| 120초 | 7초 | 106초 | 7초 | 약 10초 |

## 배경음악 옵션

| 코드 | 이름 | 분위기 |
|------|------|--------|
| calm | 잔잔한 피아노 | 평온, 힐링 |
| hopeful | 희망의 오케스트라 | 희망, 성장 |
| adventure | 모험의 시작 | 설렘, 도전 |
| emotional | 감동의 선율 | 감동, 눈물 |
| playful | 즐거운 하루 | 밝음, 유쾌 |

## 변수 설명

| 변수 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `{{storybook_id}}` | string | 스토리북 ID | "story_abc123" |
| `{{name}}` | string | 소원이 이름 | "민준" |
| `{{duration}}` | number | 영상 길이(초) | 60 |
| `{{style}}` | string | 스타일 | "miracle_fusion" |
| `{{narration}}` | boolean | 나레이션 여부 | true |
| `{{bgm}}` | string | 배경음악 | "hopeful" |

---

## 에이전트 전환 메모

> 이 프롬프트가 자주 사용되면 전용 에이전트로 전환을 검토합니다.

| 항목 | 값 |
|------|-----|
| 현재 사용 횟수 | 0회 |
| 전환 임계값 | 2회/일 |
| 전환 검토 시점 | 주간 리뷰 시 |
| 후보 에이전트명 | `video-director` |
| 권장 모델 | sonnet |

### 전환 기준
- 일 2회 이상 호출 시 에이전트 전환 검토
- 렌더링 시간 최적화 필요 시 FFmpeg 파라미터 조정
- 영상 품질 불만족 시 해상도/비트레이트 조정
