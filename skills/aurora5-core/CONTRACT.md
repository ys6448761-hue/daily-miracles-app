# Aurora5 Core Contract (1장 요약)

> Code/LSP/Agent가 항상 참조하는 최신 규칙 - 마지막 업데이트: 2026-01-18

---

## 1. WISH 7문항 (DEC-2026-0117-002)

| ID | Key | Display |
|----|-----|---------|
| Q1 | WISH_1L | 지금 가장 이루고 싶은 소원을 한 문장으로 적어주세요. |
| Q2 | WHY_NOW | 그 소원이 지금 당신에게 중요한 이유는 뭐예요? |
| Q3 | CONTEXT_NOW | 현재 상황을 짧게 알려주세요. 주로 어떤 영역과 관련 있나요? |
| Q4 | BLOCKER | 지금 가장 큰 걸림돌/걱정은 무엇인가요? |
| Q5 | EMOTION_SCALE | 지금 마음 상태를 0~10점으로 매기면 몇 점이에요? 한 단어로 표현하면? |
| Q6 | RESOURCE | 지금 당신에게 도움이 되는 자원/사람/습관이 있나요? |
| Q7 | NEXT_24H | 24시간 안에 할 수 있는 "가장 작은 한 걸음"은 뭐예요? |

**변경 금지**: 문항 순서, Key, 개수는 CEO 승인 없이 변경 불가

---

## 2. 세션 상태 전이

```
CREATED → IN_PROGRESS → COMPLETED → SUMMARIZED
              ↓
          PAUSED (🔴 감지)
              ↓
        REVIEW_NEEDED (🟡 감지)
```

---

## 3. 신호등 시스템 (DEC-2026-0117-003)

| 신호 | 조건 | 행동 |
|------|------|------|
| 🔴 RED | 자해/폭력/불법 키워드 | 즉시 중단 + 코미/여의보주 동시 알림 + 발송 차단 |
| 🟡 YELLOW | 극단적 감정/모호한 위험 | 루미 검토 + 수동 승인 필요 |
| 🟢 GREEN | 안전 | 자동 진행 (95%) |

### 🔴 RED 패턴 (발송 차단)
- 자해: 죽고싶, 자살, 자해, 목숨, 끝내고싶, 생을마감
- 폭력: 죽이겠, 때리겠, 폭행, 학대, 협박
- 불법: 마약, 사기, 불법촬영

### 🟡 YELLOW 패턴 (검토 필요)
- 극단감정: 너무힘들, 포기하고싶, 살기싫, 견딜수없
- 모호위험: 사라지고싶, 도망가고싶, 무의미

---

## 4. SLA (Service Level Agreement)

| 구분 | 목표 | 에스컬레이션 |
|------|------|-------------|
| 🔴 RED 대응 | 10분 이내 | 즉시 코미+여의보주 |
| 🟡 YELLOW 검토 | 30분 이내 | 코미 에스컬레이션 |
| 일반 응답 | 24시간 이내 | 자동 리마인더 |

---

## 5. 알림 채널

| 채널 | 용도 |
|------|------|
| #소원이-리포트 | Daily/Launch 리포트, 일반 운영 알림 |
| #소원이-검수 | 🔴/🟡 에스컬레이션, 리스크 세션 검토 |
| #ops-upgrades | 코드 변경/배포 브리프 |

---

## 6. API 엔드포인트

### Wish Intake
- `POST /api/wish-intake/start` - 세션 시작
- `POST /api/wish-intake/:sessionId/answer` - 답변 제출
- `POST /api/wish-intake/:sessionId/summary` - 요약 생성

### Ops
- `POST /api/ops/report/daily` - Daily 리포트
- `POST /api/ops/report/launch` - Launch 리포트
- `POST /api/ops/chief/run` - ChiefOfStaff 감시

### RepoPulse
- `POST /api/repopulse/github` - GitHub Webhook
- `POST /api/repopulse/render` - Render Deploy Webhook

---

## 7. Airtable 테이블

| 테이블 | 용도 |
|--------|------|
| Wish Intake Sessions | 세션 관리 |
| Wish Intake Messages | Q&A 저장 |
| Ops Reports | 리포트 이력 |
| Ops Alerts | 알람 이력 |
| Upgrades | 업그레이드 이력 |

---

## 8. 금지 표현 (절대 사용 금지)

- "죽어", "죽음", "자살", "자해" (답변 인용 제외)
- 비하/혐오 표현
- 의료/법률 전문 조언
- 확정적 미래 예측 ("반드시 ~될 것입니다")

---

*이 문서는 RepoPulse에 의해 자동 추적됩니다. 변경 시 브리프가 발송됩니다.*
