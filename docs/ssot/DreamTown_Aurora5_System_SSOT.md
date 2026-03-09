# DreamTown Aurora5 System SSOT

Version: v1.0
Owner: Aurora5
Status: Active
Purpose: Define the Aurora5 AI companion system — the intelligence layer of DreamTown.

Last Updated: 2026-03-09
Updated By: Code (Claude Code)

---

## 개념

Aurora5는 DreamTown의 **AI 동행 시스템**이다.
소원이가 혼자가 아님을 느끼게 하는 지능형 동반자 레이어.

Aurora5는 **조언하지 않는다. 동행한다.**

---

## 1. Aurora5 팀 역할

| 역할 | 이름 | 담당 |
|------|------|------|
| CEO | 푸르미르 (이세진) | 총괄 의사결정 |
| COO | 코미 | 총괄 조율, 지시서 작성 |
| CRO | 재미 | 소원이 응대, RED 신호 대응 |
| Analyst | 루미 | 데이터 분석, 마케팅 전략 |
| QA | 여의보주 | 품질 검수, 브랜드 일관성 |
| Tech | Antigravity (Code) | 기술 구현, 배포, 문서화 |

---

## 2. AI 동행 시스템 구조

```
Moment Detection (순간 감지)
        ↓
Galaxy Guidance (은하 안내)
        ↓
Aurum Interaction (아우룸 인터랙션)
        ↓
Miracle Recording (기적 기록)
```

---

## 3. Moment Detection (순간 감지)

소원이의 의미 있는 순간을 감지한다.

### 감지 시점
| 시점 | 트리거 |
|------|--------|
| 소원 생성 | wish_entry INSERT |
| 일일 체크인 | wish_challenge_days INSERT |
| 기적 카드 기록 | miracle_card INSERT |
| 7일 완주 | status → COMPLETED |
| 30일 완주 | wish_tracking Day 30 응답 |
| 신호등 감지 | RED/YELLOW 키워드 |

### 감지 결과 분류
| 신호 | 반응 |
|------|------|
| 🔴 RED | 즉시 관리자 알림 + 위기 대응 |
| 🟡 YELLOW | 따뜻한 응원 메시지 + 모니터링 |
| 🟢 GREEN | 기적 기록 안내 + 동행 |

---

## 4. Galaxy Guidance (은하 안내)

소원이의 소원 유형·감정 상태에 맞는 은하 코스를 추천한다.

### 추천 로직
```
소원 유형 분석 (5가지 유형)
        ↓
기적지수 점수 (50~100점)
        ↓
적합 항로 매칭
        ↓
코스 추천
```

### 소원 유형 → 코스 매핑
| 소원 유형 | 추천 코스 |
|----------|----------|
| 건강 | 오동도 숨결 코스 |
| 성공·성장 | 케이블카 시야 코스 |
| 관계·사랑 | 오동도 숨결 코스 |
| 치유·회복 | 향일암 일출 코스 |
| 결단·변화 | 돌산 별빛 코스 |

---

## 5. Aurum Interaction (아우룸 인터랙션)

아우룸이 핵심 순간에 조용히 등장한다.

### 등장 원칙
- 경험을 지배하지 않는다
- 짧게 나타났다가 사라진다
- 평가하지 않는다
- 결과를 예측하지 않는다

### 메시지 원칙
- 짧고 (1~2문장)
- 따뜻하고
- 열린 결말

### 상황별 메시지 예시
| 상황 | 메시지 |
|------|--------|
| 소원 생성 직후 | "어쩌면 여기서 작은 시작이 기다리고 있을지도 모릅니다." |
| 기적 기록 후 | "오늘 당신의 별이 조금 자랐을지도 모릅니다." |
| 7일 완주 | "7일의 빛이 쌓였습니다." |
| YELLOW 감지 | "오늘은 조금 힘드셨군요. 그래도 여기 있습니다." |

---

## 6. 메시지 발송 시스템

> 출처: `services/messageProvider.js`

```
messageProvider.js
├── Primary:  SENS 알림톡 (카카오 @dailymiracles)
├── Fallback: SENS SMS
└── Tracking: SMS 전용 (Day 7/30/90)
```

### 발송 규칙
- 반드시 `messageProvider.js` 경유 (직접 SENS 호출 금지)
- 알림톡 실패 시 SMS 자동 Fallback
- 소원 추적 (Day 7/30/90)은 SMS 전용

---

## 7. 기적지수 엔진

> 출처: `services/miracleScoreEngine.js`

### 3가지 입력 경로
| 경로 | 설명 |
|------|------|
| 소원 텍스트 | wish_text 분석 |
| 문제 카테고리 | 선택한 카테고리 기반 |
| 12질문 인테이크 | 상세 설문 응답 |

### 5가지 지표 (각 20점, 총 100점)
`간절함` / `구체성` / `실행력` / `긍정성` / `자기인식`

### 점수 레벨
| 점수 | 레벨 |
|------|------|
| 90~100 | 기적항해 |
| 80~89 | 순항항해 |
| 70~79 | 성장항해 |
| 50~69 | 준비항해 |

---

## 8. AI 한계 고지

Aurora5는 다음을 하지 않는다:

| 금지 | 이유 |
|------|------|
| 미래 예측 | DreamTown은 점술이 아니다 |
| 의료·법률 조언 | 전문 영역 침범 금지 |
| 확신 제공 | 소원 실현을 보장하지 않는다 |
| 사주·운세 | 절대 배제 |

---

## 참조

- 안전 시스템: `DreamTown_Safety_Ethics_SSOT.md`
- 기적 시스템: `DreamTown_Miracle_System_SSOT.md`
- 캐릭터 (아우룸): `DreamTown_Character_SSOT.md`
- 메시지 발송: `services/messageProvider.js`
- 기적지수: `services/miracleScoreEngine.js`
