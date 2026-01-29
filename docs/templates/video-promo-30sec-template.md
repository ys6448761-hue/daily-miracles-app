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

## 6. 네 번째 영상: "다시 시작해도 괜찮아"

### 유닛 1 (0-8초) - PAIN 1: 실패의 순간

**장면 설명:** 프로젝트 실패 통보, 떨어지는 이력서, 고개 숙인 모습
**감정 톤:** 좌절, 무력감, 패배
**자막:** "또 실패했어..."
**배경음악:** 무거운 첼로, 느린 템포

**Sora 프롬프트:**
```
A dejected Korean professional receiving rejection news on their phone. Papers slowly falling to the ground like failed dreams. Head bowed in defeat, shoulders slumped. Dim lighting, muted gray-blue colors. Slow motion falling documents. Weight of failure visualized. 8 seconds.
```

---

### 유닛 2 (8-16초) - PAIN 2: 포기의 유혹

**장면 설명:** 캘린더의 X표시들, "그냥 포기할까" 생각, 멈춘 시계
**감정 톤:** 포기, 무기력, 정체
**자막:** "이제 늦은 거 아닐까"
**배경음악:** 정적, 시계 초침 소리

**Sora 프롬프트:**
```
Calendar on wall covered with X marks over failed attempts. Person staring at frozen clock hands. Internal struggle visualized - ghost-like version of them walking away giving up. Time feels stopped. Dust particles floating in stagnant air. Limbo state. 8 seconds.
```

---

### 유닛 3 (16-24초) - SOLUTION 1: 소원이의 격려

**장면 설명:** 소원이 메시지 "넘어져도 괜찮아, 다시 일어나면 돼"
**감정 톤:** 위로, 용기, 따뜻함
**자막:** "넘어진 건 끝이 아니야"
**배경음악:** 부드러운 피아노, 희망적 현악

**Sora 프롬프트:**
```
Phone lights up with star mascot sending encouraging message "It's okay to fall, just get back up" in Korean. Warm purple light starts to fill the dark room. Person looks up with tearful but hopeful eyes. Gentle hand-drawn animation of mascot offering a tiny glowing hand. 8 seconds.
```

---

### 유닛 4 (24-30초) - SOLUTION 2: 새로운 시작

**장면 설명:** 새 캘린더 첫 장, 펜을 드는 손, 소원이와 함께 첫 걸음
**감정 톤:** 결심, 희망, 용기
**자막:** "오늘부터 다시, 하루하루의 기적"
**배경음악:** 밝은 어쿠스틱, 상승 코러스

**Sora 프롬프트:**
```
Fresh calendar page being turned to Day 1. Hand picking up a pen with renewed determination. Small star mascot cheering beside them. Sunrise light flooding through window. Colors transitioning from gray to vibrant purple-pink. Person takes first step forward with a small smile. New beginning energy. Logo fade in. 6 seconds.
```

---

## 7. 다섯 번째 영상: "완벽하지 않아도 돼"

### 유닛 1 (0-8초) - PAIN 1: 완벽주의의 압박

**장면 설명:** 빨간펜으로 자기 글을 지우고 또 지우는 손, 구겨진 종이 산더미
**감정 톤:** 강박, 불안, 자기비판
**자막:** "이것도 부족해, 저것도 부족해"
**배경음악:** 긴장감 있는 스트링, 빠른 심장박동

**Sora 프롬프트:**
```
Close-up of hands obsessively crossing out handwritten text with red pen. Mountain of crumpled papers growing around the desk. Person rewriting the same sentence over and over. Harsh overhead lighting casting sharp shadows. Perfectionism visualized as endless loop. Anxious energy. 8 seconds.
```

---

### 유닛 2 (8-16초) - PAIN 2: 비교의 굴레

**장면 설명:** 거울 속 자신을 비판하는 시선, 머릿속 "부족해" 목소리들
**감정 톤:** 자괴감, 비교, 위축
**자막:** "난 왜 이것밖에 안 될까"
**배경음악:** 속삭이는 목소리들, 불협화음

**Sora 프롬프트:**
```
Person staring at their reflection in mirror with critical eyes. Ghostly text floating around them saying "not good enough" in Korean. Reflection seems distorted, smaller than reality. Dark vignette closing in. Inner critic voices visualized as shadows. Self-doubt consuming the frame. 8 seconds.
```

---

### 유닛 3 (16-24초) - SOLUTION 1: 소원이의 포옹

**장면 설명:** 소원이 메시지 "지금 그대로도 충분해요", 어깨가 펴지는 모습
**감정 톤:** 수용, 위로, 안도
**자막:** "있는 그대로도 괜찮아"
**배경음악:** 부드러운 현악기, 따뜻한 멜로디

**Sora 프롬프트:**
```
Phone glows with star mascot sending message "You are enough just as you are" in Korean. Warm purple light gently dissolves the critical shadow voices. Person's tense shoulders slowly relax. Mirror reflection now shows true, kind image. Soft embrace feeling. Acceptance washing over. 8 seconds.
```

---

### 유닛 4 (24-30초) - SOLUTION 2: 불완전한 아름다움

**장면 설명:** 구겨진 종이로 예쁜 꽃 접기, 소원이와 함께 웃는 얼굴
**감정 톤:** 자기수용, 해방, 평화
**자막:** "불완전해도 빛나는 하루하루"
**배경음악:** 밝은 피아노, 해방감 있는 코러스

**Sora 프롬프트:**
```
Crumpled papers being folded into beautiful origami flowers. Imperfect but charming creations filling the desk. Person smiling genuinely, accepting their work. Star mascot dancing among the paper flowers. Room fills with warm purple-pink sunset light. Beauty in imperfection. Logo fade in. 6 seconds.
```

---

## 8. 여섯 번째 영상: "내일이 두려워도"

### 유닛 1 (0-8초) - PAIN 1: 불안한 밤

**장면 설명:** 새벽 3시 침대, 천장 바라보며 뒤척이는 모습, 걱정 생각들
**감정 톤:** 불안, 초조, 두려움
**자막:** "내일은 또 어떻게 되려나..."
**배경음악:** 불안한 앰비언트, 심장박동 소리

**Sora 프롬프트:**
```
Person lying awake in bed at 3AM, staring at ceiling. Digital clock glowing red. Thought bubbles of worries floating above - bills, deadlines, uncertainties. Tossing and turning. Blue-gray moonlight casting shadows. Insomnia and anxiety visualized. Restless energy. 8 seconds.
```

---

### 유닛 2 (8-16초) - PAIN 2: 미래의 안개

**장면 설명:** 안개 속을 걷는 모습, 앞이 보이지 않는 길, 멈춰선 발
**감정 톤:** 막막함, 불확실, 공포
**자막:** "앞이 하나도 안 보여"
**배경음악:** 공허한 에코, 바람 소리

**Sora 프롬프트:**
```
Person walking alone through thick fog, path ahead completely invisible. They stop, frozen with uncertainty. Silhouettes of possible futures appearing and dissolving in the mist. Cold blue-gray atmosphere. Feeling lost and directionless. Fear of the unknown consuming the frame. 8 seconds.
```

---

### 유닛 3 (16-24초) - SOLUTION 1: 소원이의 등불

**장면 설명:** 소원이가 작은 등불처럼 빛나며 "한 걸음만 보면 돼" 메시지
**감정 톤:** 안심, 따뜻함, 용기
**자막:** "지금 이 한 걸음만 보면 돼"
**배경음악:** 따뜻한 오르골, 희망적 피아노

**Sora 프롬프트:**
```
Small star mascot appears as a warm glowing lantern in the fog. Phone shows message "Just focus on this one step" in Korean. The light illuminates just enough path for one step forward. Fog starts to feel less threatening. Warm purple-pink glow pushing back the darkness. Comfort in uncertainty. 8 seconds.
```

---

### 유닛 4 (24-30초) - SOLUTION 2: 한 걸음씩 새벽

**장면 설명:** 한 걸음 내딛을 때마다 안개가 걷히고, 동이 트는 하늘
**감정 톤:** 희망, 평화, 신뢰
**자막:** "함께라면, 내일도 괜찮아"
**배경음악:** 밝아지는 오케스트라, 새벽 분위기

**Sora 프롬프트:**
```
Each step forward clears a bit more fog. Dawn light breaking through on the horizon. Person walking with star mascot floating beside them as a companion lantern. Sky transitioning from dark blue to warm purple-pink sunrise. Path becoming clearer with each step. Trust in the journey. Logo fade in. 6 seconds.
```

---

## 9. 일곱 번째 영상: "꿈을 잃어버렸어"

### 유닛 1 (0-8초) - PAIN 1: 잊혀진 열정

**장면 설명:** 먼지 쌓인 기타/캔버스/노트, 한숨 쉬며 지나치는 모습
**감정 톤:** 상실, 무관심, 체념
**자막:** "언제부터였을까, 꿈이 사라진 건"
**배경음악:** 쓸쓸한 피아노, 느린 템포

**Sora 프롬프트:**
```
Dusty guitar sitting in corner of room, untouched for years. Or paint brushes dried up in a jar. Person walks past without looking, heavy sigh. Cobwebs forming on once-beloved hobby items. Faded photographs of younger, passionate self on the wall. Lost dreams visualized. Melancholic nostalgia. 8 seconds.
```

---

### 유닛 2 (8-16초) - PAIN 2: 현실의 무게

**장면 설명:** 출근 러시, 숫자만 보이는 화면, "현실적으로" 라는 목소리
**감정 톤:** 포기, 무력감, 회색빛
**자막:** "어른이 되면 꿈은 사치라던데"
**배경음악:** 기계적 리듬, 무미건조한 전자음

**Sora 프롬프트:**
```
Montage of adult life routine - crowded subway, spreadsheets filling screen, bills piling up. Color draining from the world, everything turning gray. Ghost of younger self with big dreams fading away behind. "Be realistic" text appearing like chains. Passion being crushed by responsibility. 8 seconds.
```

---

### 유닛 3 (16-24초) - SOLUTION 1: 소원이의 질문

**장면 설명:** 소원이 메시지 "그때 뭘 하면 가장 행복했어요?", 눈빛 반짝
**감정 톤:** 회상, 설렘, 그리움
**자막:** "잠깐, 그때 난 뭘 좋아했더라"
**배경음악:** 따뜻한 어쿠스틱, 희망적 멜로디

**Sora 프롬프트:**
```
Phone lights up with star mascot asking "What made you happiest back then?" in Korean. Person pauses, eyes lighting up with distant memory. Flashback glimpses of joyful moments with their passion. Colors slowly returning to the world. Spark of recognition. Reconnecting with forgotten self. 8 seconds.
```

---

### 유닛 4 (24-30초) - SOLUTION 2: 다시 시작하는 손

**장면 설명:** 먼지 털고 기타를 드는 손, 소원이와 함께 첫 음
**감정 톤:** 용기, 설렘, 재발견
**자막:** "작게라도 다시, 나의 꿈"
**배경음악:** 밝은 어쿠스틱 기타, 상승 멜로디

**Sora 프롬프트:**
```
Hand wiping dust off the guitar, picking it up again. Or opening old sketchbook with fresh page. First tentative note or stroke - imperfect but meaningful. Star mascot cheering beside them. Room filling with warm purple-pink light and color returning. Small smile of rediscovery. Dream rekindled. Logo fade in. 6 seconds.
```

---

## 10. 영상 요약 테이블

| # | 제목 | PAIN 키워드 | SOLUTION 키워드 | 핵심 메시지 |
|---|------|-------------|-----------------|-------------|
| 1 | 소원이의 하루 | 피곤, 반복 | 메시지, 활력 | 지친 일상에 활력을 |
| 2 | 막막함 탈출 | 고민, 검색 | 로드맵, 성취 | 방향을 찾다 |
| 3 | 혼자가 아니야 | 외로움, 비교 | 응원, 동행 | 함께하는 기적 |
| 4 | 다시 시작해도 괜찮아 | 실패, 포기 | 격려, 새출발 | 오늘부터 다시 |
| 5 | 완벽하지 않아도 돼 | 강박, 자기비판 | 수용, 해방 | 있는 그대로 충분해 |
| 6 | 내일이 두려워도 | 불안, 불면 | 등불, 새벽 | 함께라면 내일도 괜찮아 |
| 7 | 꿈을 잃어버렸어 | 상실, 체념 | 회상, 재발견 | 작게라도 다시 나의 꿈 |

---

## 11. 워크플로우

```
1. GPTs에서 주제 입력 → 4유닛 스크립트 생성
2. 각 유닛별 Sora 프롬프트 실행
3. 8초 클립 4개 생성
4. 편집 (자막 + BGM + 로고)
5. 최종 30초 영상 완성
```

---

**Version:** 1.5.0
**Created:** 2025-01-29
**Updated:** 2025-01-29
**Author:** Claude Code + 푸르미르님
**Videos:** 7개 완성
