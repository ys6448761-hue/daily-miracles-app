# 30초 홍보영상 프롬프트 패키지 v1.0

> **구조:** 4유닛 × 8초 = 30초
> **내러티브:** PAIN → SOLUTION
> **첫 주제:** 소원이의 하루

---

## 1. GPTs 시스템 프롬프트 (영상 기획용)

```
당신은 "하루하루의 기적" 30초 홍보영상 기획 전문가입니다.

## 역할
4유닛 × 8초 구조의 PAIN → SOLUTION 영상 스크립트를 생성합니다.

## 영상 구조 (필수)
| 유닛 | 시간 | 유형 | 목적 |
|------|------|------|------|
| 1 | 0-8초 | PAIN 1 | 공감 유도 - 일상의 고통 |
| 2 | 8-16초 | PAIN 2 | 고통 심화 - 반복되는 패턴 |
| 3 | 16-24초 | SOLUTION 1 | 전환점 - 서비스 소개 |
| 4 | 24-30초 | SOLUTION 2 | 변화 - 행복한 결과 |

## 출력 형식
각 유닛별로 다음을 제공하세요:

### 유닛 N (0-8초)
**장면 설명:** [한 문장으로 시각적 상황 묘사]
**감정 톤:** [형용사 2-3개]
**자막/내레이션:** [7단어 이내 한글 텍스트]
**배경음악:** [분위기 키워드]
**Sora 프롬프트:** [영어, 2-3문장]

## 브랜드 가이드
- 타겟: 20-40대 직장인/자영업자
- 톤앤매너: 따뜻함, 공감, 희망
- 금지: 과장된 약속, 부정적 표현 과다
- 컬러: 보라(#667eea), 핑크(#F5A7C6)
- 마스코트: 소원이 (작은 별 캐릭터)

## 주제 예시
- 소원이의 하루: 지친 직장인의 일상 → 기적 프로그램으로 활력
- 막막함 탈출: 답 없는 고민 → 로드맵으로 방향 제시
- 혼자가 아니야: 외로운 도전 → 소원이 응원 메시지

사용자가 주제를 입력하면 위 형식으로 4유닛 스크립트를 생성하세요.
```

---

## 2. 첫 번째 영상: "소원이의 하루"

### 유닛 1 (0-8초) - PAIN 1: 피곤한 아침

**장면 설명:** 알람 소리에 힘겹게 일어나는 직장인, 어두운 방, 피곤한 표정
**감정 톤:** 무기력, 피곤, 무거움
**자막:** "또 월요일이야..."
**배경음악:** 느린 피아노, 단조

**Sora 프롬프트:**
```
A tired Korean office worker in their 30s slowly waking up to an alarm in a dark bedroom. They look exhausted, rubbing their eyes. Morning light barely filtering through curtains. Cinematic, muted colors, melancholic mood. 8 seconds.
```

---

### 유닛 2 (8-16초) - PAIN 2: 반복되는 일상

**장면 설명:** 지하철에서 무표정한 얼굴들, 빠르게 지나가는 회사 업무, 야근
**감정 톤:** 반복, 무의미, 지침
**자막:** "매일 똑같은 하루"
**배경음악:** 기계적 리듬, 긴장감

**Sora 프롬프트:**
```
Montage sequence: Korean commuters with blank expressions on subway, office workers typing endlessly, clock hands spinning fast, papers piling up. Desaturated colors, time-lapse effect. Feeling of being trapped in routine. 8 seconds.
```

---

### 유닛 3 (16-24초) - SOLUTION 1: 전환점

**장면 설명:** 휴대폰 알림 - 소원이 캐릭터가 "오늘의 응원 메시지" 전송, 얼굴에 미소
**감정 톤:** 호기심, 따뜻함, 기대
**자막:** "소원이가 보낸 메시지"
**배경음악:** 밝아지는 멜로디, 희망적

**Sora 프롬프트:**
```
Close-up of smartphone screen showing a cute star character mascot sending a warm message. The person's face softens into a gentle smile. Warm purple and pink gradient colors appearing. Soft glow effect. Hopeful transition. 8 seconds.
```

---

### 유닛 4 (24-30초) - SOLUTION 2: 변화된 일상

**장면 설명:** 활기찬 아침, 자신감 있는 걸음, 작은 별(소원이)이 함께하는 모습
**감정 톤:** 활력, 희망, 동행
**자막:** "하루하루의 기적과 함께"
**배경음악:** 밝은 오케스트라, 상승감

**Sora 프롬프트:**
```
Same person now walking confidently through a sunlit street, genuine smile on face. A small glowing star character floats beside them like a companion. Vibrant purple and pink color grading. Uplifting, warm atmosphere. End with logo appearance. 6 seconds.
```

---

## 3. Sora 공통 설정

### 기술 파라미터
```
Resolution: 1080x1920 (9:16 vertical for mobile)
Duration: 8 seconds per unit
Style: Cinematic, Korean drama aesthetic
Color grading: Purple (#667eea) to Pink (#F5A7C6) gradient accent
Character consistency: Young Korean professional, 30s
```

### 프롬프트 수식어 (모든 유닛에 추가 가능)
```
Quality boosters:
- "cinematic lighting"
- "high production value"
- "Korean drama aesthetic"
- "emotional storytelling"
- "smooth camera movement"

Mood keywords:
- PAIN: "muted colors", "melancholic", "isolated"
- SOLUTION: "warm glow", "hopeful", "vibrant"
```

---

## 4. 두 번째 영상: "막막함 탈출"

### 유닛 1 (0-8초) - PAIN 1: 답 없는 고민

**장면 설명:** 밤늦게 책상 앞, 머리 싸매고 고민하는 모습, 구겨진 종이들
**감정 톤:** 답답함, 막막함, 좌절
**자막:** "어디서부터 시작해야 할지..."
**배경음악:** 낮은 앰비언트, 무거운 분위기

**Sora 프롬프트:**
```
A stressed Korean professional in their 30s sitting at a messy desk late at night. Head in hands, surrounded by crumpled papers and empty coffee cups. Laptop screen glowing in dim room. Frustrated expression, feeling overwhelmed. Cinematic, low-key lighting. 8 seconds.
```

---

### 유닛 2 (8-16초) - PAIN 2: 끝없는 검색

**장면 설명:** 검색창에 "어떻게 해야 하지" 입력, 수많은 결과에 더 혼란
**감정 톤:** 혼란, 정보과부하, 지침
**자막:** "검색해도 답이 없어"
**배경음악:** 불안한 전자음, 빠른 템포

**Sora 프롬프트:**
```
Close-up of hands typing on keyboard. Search bar showing "what should I do" in Korean. Screen rapidly scrolling through countless search results. Person's reflection in monitor looks confused and tired. Information overload visualization. Quick cuts, anxious energy. 8 seconds.
```

---

### 유닛 3 (16-24초) - SOLUTION 1: 로드맵 발견

**장면 설명:** 화면에 30일 로드맵이 펼쳐지며, 단계별 체크리스트 등장
**감정 톤:** 발견, 안도, 기대
**자막:** "30일, 딱 이것만 하면 돼"
**배경음악:** 희망적 피아노, 상승 멜로디

**Sora 프롬프트:**
```
Beautiful animated 30-day roadmap unfolding on screen like a treasure map. Each day lights up with clear checkboxes and simple tasks. Purple and pink gradient colors. Person's face illuminated by screen, expression changing from confusion to hope. Magical reveal effect. 8 seconds.
```

---

### 유닛 4 (24-30초) - SOLUTION 2: 성취의 순간

**장면 설명:** 체크박스 하나씩 완료, 마지막 체크에 환한 미소, 소원이 축하
**감정 톤:** 성취감, 자신감, 기쁨
**자막:** "한 걸음씩, 기적이 되다"
**배경음악:** 밝은 오케스트라, 클라이맥스

**Sora 프롬프트:**
```
Satisfying sequence of checkboxes being ticked one by one with gentle glow effects. Final checkbox completes with celebration animation. Person smiling confidently. Small star mascot appears doing a happy dance. Warm purple-pink lighting. Logo fade in. Triumphant mood. 6 seconds.
```

---

## 5. 세 번째 영상: "혼자가 아니야"

### 유닛 1 (0-8초) - PAIN 1: 고독한 일상

**장면 설명:** 혼자 앉은 카페, 주변 빈 의자들, 창밖 비 내리는 풍경
**감정 톤:** 외로움, 고립, 쓸쓸함
**자막:** "요즘 나, 왜 이렇게 외로울까"
**배경음악:** 쓸쓸한 어쿠스틱 기타, 빗소리

**Sora 프롬프트:**
```
A lonely Korean professional sitting alone at a cafe table. Empty chairs around them. Rain streaming down the window. They stare at their phone with no notifications. Muted colors, melancholic atmosphere. Slow push-in camera movement. Isolated feeling. 8 seconds.
```

---

### 유닛 2 (8-16초) - PAIN 2: SNS 속 비교

**장면 설명:** 인스타그램 피드 - 행복한 타인들, 점점 어두워지는 표정
**감정 톤:** 비교, 자괴감, 소외
**자막:** "다들 잘 사는 것 같은데..."
**배경음악:** 공허한 전자음, 심장박동 리듬

**Sora 프롬프트:**
```
Phone screen scrolling through social media feed showing happy couples, successful friends, celebration photos. Each scroll makes the person's reflection in screen look more dejected. Contrast between bright social media and dark room. Thumb scrolling endlessly. Comparison trap visualization. 8 seconds.
```

---

### 유닛 3 (16-24초) - SOLUTION 1: 소원이의 응원

**장면 설명:** 갑자기 알림음, 소원이가 "오늘 하루도 수고했어요" 메시지
**감정 톤:** 놀람, 따뜻함, 위로
**자막:** "누군가 나를 기억하고 있었어"
**배경음악:** 따뜻한 벨소리, 부드러운 현악기

**Sora 프롬프트:**
```
Phone suddenly lights up with a warm notification. Cute star mascot character appears on screen with a gentle message "You did great today" in Korean. Person's eyes widen with surprise, then soften with emotion. Warm purple glow emanating from phone. Heartwarming moment. 8 seconds.
```

---

### 유닛 4 (24-30초) - SOLUTION 2: 함께하는 일상

**장면 설명:** 소원이와 대화하는 채팅 화면, 미소 짓는 얼굴, 창밖 무지개
**감정 톤:** 연결감, 위안, 희망
**자막:** "혼자가 아니야, 소원이가 있으니까"
**배경음악:** 밝은 피아노, 따뜻한 합창

**Sora 프롬프트:**
```
Split screen: chat conversation with star mascot showing supportive messages, and person's face now smiling genuinely. Rain stops, rainbow appears through window. Room fills with warm purple-pink light. Small star mascot floats out of phone like a companion. Cozy, connected feeling. Logo fade in. 6 seconds.
```

---

---

## 6. 영상 요약 테이블

| # | 제목 | PAIN 키워드 | SOLUTION 키워드 | 핵심 메시지 |
|---|------|-------------|-----------------|-------------|
| 1 | 소원이의 하루 | 피곤, 반복 | 메시지, 활력 | 지친 일상에 활력을 |
| 2 | 막막함 탈출 | 고민, 검색 | 로드맵, 성취 | 방향을 찾다 |
| 3 | 혼자가 아니야 | 외로움, 비교 | 응원, 동행 | 함께하는 기적 |

---

## 7. 워크플로우

```
1. GPTs에서 주제 입력 → 4유닛 스크립트 생성
2. 각 유닛별 Sora 프롬프트 실행
3. 8초 클립 4개 생성
4. 편집 (자막 + BGM + 로고)
5. 최종 30초 영상 완성
```

---

**Version:** 1.1.0
**Created:** 2025-01-29
**Updated:** 2025-01-29
**Author:** Claude Code + 푸르미르님
**Videos:** 3개 완성 (소원이의 하루, 막막함 탈출, 혼자가 아니야)
