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

## 4. 추가 영상 주제 템플릿

### 주제 2: "막막함 탈출"
- U1: 머리 싸매고 고민하는 모습 (PAIN)
- U2: 검색창에 "어떻게 해야 하지" 입력 (PAIN)
- U3: 30일 로드맵이 화면에 펼쳐짐 (SOLUTION)
- U4: 체크리스트 완료하며 성취감 (SOLUTION)

### 주제 3: "혼자가 아니야"
- U1: 혼자 앉아있는 카페, 빈 의자들 (PAIN)
- U2: SNS 속 행복한 타인, 비교하는 시선 (PAIN)
- U3: 소원이 알림 "오늘도 응원해요" (SOLUTION)
- U4: 친구처럼 대화하는 소원이와의 채팅 화면 (SOLUTION)

---

## 5. 워크플로우

```
1. GPTs에서 주제 입력 → 4유닛 스크립트 생성
2. 각 유닛별 Sora 프롬프트 실행
3. 8초 클립 4개 생성
4. 편집 (자막 + BGM + 로고)
5. 최종 30초 영상 완성
```

---

**Version:** 1.0.0
**Created:** 2025-01-29
**Author:** Claude Code + 푸르미르님
