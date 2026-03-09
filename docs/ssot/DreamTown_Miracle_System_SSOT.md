# DreamTown Miracle System SSOT

Version: v1.0
Owner: Aurora5
Status: Active
Purpose: Define the miracle detection, recording, and growth system — the emotional core of DreamTown.

Last Updated: 2026-03-09
Updated By: Code (Claude Code)

---

## 규칙

- 이 파일은 DreamTown의 감정 엔진이다
- 기적 관련 모든 기능(카드, 저널, AI 감지, 성장 연동)은 이 파일을 기준으로 한다
- "하루하루의 기적"이라는 서비스명은 이 시스템에서 비롯된다

---

## 1. 기적이란

> "기적은 멀리 있지 않다. 어제와 다른 오늘이 기적이다."

DreamTown에서 기적은 **거창한 사건이 아니라 작은 변화의 순간**이다.

소원이가 경험하는 의미 있는 전환(shift)을 기적이라 부른다.

---

## 2. 기적 유형 (4종)

| 유형 | 영문 | 정의 | 예시 |
|------|------|------|------|
| **행동** | Action | 실제로 한 행동 | "향일암에서 소원을 다시 썼다." |
| **깨달음** | Realization | 내면의 인식 변화 | "내가 원하는 게 처음으로 분명해졌다." |
| **연결** | Connection | 사람·장소·기억과의 연결 | "오동도에서 오래된 친구를 떠올렸다." |
| **변화** | Transformation | 관점 또는 태도의 전환 | "케이블카 위에서 두려움이 사라졌다." |

---

## 3. 기적 카드 (Miracle Card)

기적의 순간을 저장하는 단위 기록.

### 필드 구조
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `date` | date | O | 기적 발생 날짜 |
| `miracle_type` | enum | O | action / realization / connection / transformation |
| `description` | text | O | 짧은 성찰 메시지 (1~3문장) |
| `source` | enum | O | daily_life / galaxy_exploration |
| `location` | string | X | 장소 (은하 탐험 시) |
| `linked_wish_id` | id | X | 연결된 소원 ID |

### 기적 카드 원칙
- 짧고 진실하게 (1~3문장)
- 과거형으로 기록 (이미 일어난 일)
- 평가 없이 묘사만

---

## 4. 기적 저널 (Miracle Journal)

기적 카드의 모음. 소원이의 성장 역사.

```
Miracle Journal
      ├─ Day 1 카드
      ├─ Day 3 카드
      ├─ Day 7 카드 (Bloom)
      ├─ 은하 탐험 카드
      └─ 일상 기적 카드
```

### 저널 통계
| 항목 | 설명 |
|------|------|
| 총 기적 수 | 전체 카드 누적 수 |
| 유형 분포 | 행동/깨달음/연결/변화 비율 |
| 연속 기록일 | 오늘까지 연속으로 기록한 일수 |
| 최초 기적 | 첫 번째 카드 날짜 |

---

## 5. 기적지수 (Miracle Score)

소원 실현 가능성을 측정하는 5가지 지표.

> 출처: `services/miracleScoreEngine.js`

| 지표 | 설명 | 범위 |
|------|------|------|
| **간절함** | 소원에 대한 열망 강도 | 0~20 |
| **구체성** | 소원의 명확성 | 0~20 |
| **실행력** | 행동 가능성 | 0~20 |
| **긍정성** | 마음 상태 | 0~20 |
| **자기인식** | 자신에 대한 이해 | 0~20 |
| **총점** | 5가지 합산 | 50~100 |

### 점수 해석
| 점수 | 의미 |
|------|------|
| 90~100 | 기적항해 (기적 직전) |
| 80~89 | 순항항해 (순조롭게 진행 중) |
| 70~79 | 성장항해 (꾸준히 성장 중) |
| 50~69 | 준비항해 (준비가 필요한 상태) |

---

## 6. 신호등 시스템 (Traffic Light)

기적 여정 중 소원이의 심리 상태를 감지한다.

| 신호 | 조건 | 대응 |
|------|------|------|
| 🔴 RED | 자살·자해 키워드 감지 | 관리자 SMS 즉시 발송, ACK 미발송 |
| 🟡 YELLOW | 우울·힘듦 등 주의 키워드 | ACK 발송 + 모니터링 |
| 🟢 GREEN | 정상 | ACK 발송 |

**원칙**: 기적 시스템은 치료가 아니다. 위험 신호는 즉시 전문가 연결을 유도한다.

---

## 7. 기적 감지 — AI 동행

아우룸(Aurora5)이 기적의 순간을 감지하고 반응한다.

### 감지 시점
| 시점 | 트리거 |
|------|--------|
| 소원 생성 후 | wish_entry 생성 완료 |
| 일일 체크인 | wish_challenge_days 기록 |
| 기적 카드 저장 | miracle_card INSERT |
| 여정 완주 | status → COMPLETED |

### 반응 원칙
- 과장하지 않는다
- 짧고 따뜻하게
- 평가하지 않고 동행한다
- 아우룸은 결과를 예측하지 않는다

---

## 8. 소원 추적 (Wish Tracking)

소원 실현 여부를 장기 추적한다.

> 출처: `routes/wishTrackingRoutes.js`

| 시점 | 채널 | 내용 |
|------|------|------|
| Day 7 | SMS | 7일 체크인 링크 |
| Day 30 | SMS | 30일 회고 |
| Day 90 | SMS | 90일 성과 확인 |

추적 결과는 `wish_success_patterns`에 쌓여 기적 시스템 개선에 활용된다.

---

## 9. 별 성장 연동

기적 카드 → 별 성장에 직접 영향.

```
기적 카드 1개 → 별 에너지 +1
여정 완주     → 단계 전환
커뮤니티 응원 → 별 밝기 증가
```

### 성장 단계
| 단계 | 이름 | 기적 카드 기준 |
|------|------|--------------|
| 1 | Star Seed | 0개 |
| 2 | New Light | 1~3개 |
| 3 | Bright Star | 4~10개 + 여정 진행 |
| 4 | Guide Star | 여정 완주 |
| 5 | Somangi ✨ | 커뮤니티에서 다른 별을 밝힘 |

---

## 10. 장기 기억 메시지

기적 저널을 바탕으로 장기 회고 메시지를 생성한다.

| 시점 | 메시지 예시 |
|------|------------|
| 1주년 | "1년 전 오늘, 향일암에서 소원을 다시 썼습니다." |
| 기적 10개 | "10번째 기적을 기록했습니다. 별이 밝아지고 있어요." |
| 첫 연결 | "처음으로 별자리가 만들어졌습니다." |

---

## 참조

- 세계관: `DreamTown_Universe_Bible.md`
- 소원 시스템: `DreamTown_Wish_System_SSOT.md`
- 캐릭터: `DreamTown_Character_SSOT.md`
- Aurora5 AI: `DreamTown_Aurora5_System_SSOT.md`
- 안전: `DreamTown_Safety_Ethics_SSOT.md`
- 기적지수 엔진: `services/miracleScoreEngine.js`
