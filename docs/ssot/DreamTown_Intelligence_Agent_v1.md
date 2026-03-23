# 🤖 DreamTown Intelligence Agent 설계서 v1.0

**작성일:** 2026-03-23
**작성자:** 코미 (Aurora5 Chief Operating AI Manager)
**승인:** 푸르미르님
**상태:** SSOT 확정 — P0 에러 수정 완료 후 구현 (P2)

---

## 📌 정의

DreamTown Intelligence Agent는
단순 순찰을 넘어 데이터 축적 → 분석 → 예측까지 수행하는
플랫폼 지능 시스템이다.

```
1단계: 순찰 (Patrol)      — 이상 감지 + 즉시 알림
2단계: 분석 (Analytics)   — 일일 데이터화 + 추이 분석
3단계: 예측 (Prediction)  — 패턴 기반 선제 대응
```

핵심 목표:
- 문제가 곪기 전에 미리 감지
- 푸르미르님이 데이터 없이 결정하는 일 제거
- 플랫폼이 스스로 건강 상태를 보고

---

## 🏗️ 시스템 구조

```
jobs/
  dreamtownIntelAgent.js     ← 총괄 실행 (Cron 진입점)
  intel/
    patrolModule.js          ← 1단계: 순찰
    analyticsModule.js       ← 2단계: 일일 분석
    predictionModule.js      ← 3단계: 예측
    reportModule.js          ← 보고서 생성 + 발송
```

---

## 🗄️ DB 설계 (046 마이그레이션)

### dt_patrol_daily_stats (일일 지표 누적)

```sql
CREATE TABLE dt_patrol_daily_stats (
  id                    SERIAL PRIMARY KEY,
  stat_date             DATE NOT NULL UNIQUE,
  new_stars_count       INTEGER DEFAULT 0,
  resonance_count       INTEGER DEFAULT 0,
  resonance_rate        NUMERIC(5,2) DEFAULT 0,
  voyage_log_count      INTEGER DEFAULT 0,
  silent_users_count    INTEGER DEFAULT 0,
  avg_change_score      NUMERIC(5,2) DEFAULT 50,
  aurora5_response_rate NUMERIC(5,2) DEFAULT 0,
  sms_revisit_rate      NUMERIC(5,2) DEFAULT 0,
  platform_health_score INTEGER DEFAULT 50,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
```

### dt_prediction_log (예측 기록)

```sql
CREATE TABLE dt_prediction_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id          UUID REFERENCES dt_stars(id),
  prediction_type  TEXT CHECK (prediction_type IN (
                     '이탈위험','실현임박','성장가속','침묵징후'
                   )),
  confidence_score INTEGER DEFAULT 0,
  triggered_action TEXT,
  predicted_at     TIMESTAMPTZ DEFAULT NOW(),
  verified_at      TIMESTAMPTZ,
  was_correct      BOOLEAN,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔍 1단계 — 순찰 모듈 (patrolModule.js)

### 순찰 항목 5가지

**1. 별 이름 품질 감시**
```
최근 24시간 생성된 dt_stars 조회
→ 어색한 패턴 감지 (형용사 단독, 의미 충돌)
→ 블랙리스트 패턴과 대조
→ 이상 시 즉시 알림
```

**2. 시스템 에러 감시**
```
aurora5_orchestrator_logs 최근 실패 건수
dt_voyage_schedule 발송 실패 (sent_at NULL + 과거)
임계치: 실패 3건 이상 → 알림
```

**3. 소원이 이상 행동 감시**
```
RED 신호 키워드 감지
7일 이상 침묵 소원이 수 급증
위기 소원이: change_score 20 이하
→ 즉시 알림
```

**4. 데이터 품질 감시**
```
dt_stars: star_name NULL 또는 중복
dt_wishes: wish_text NULL
비정상 데이터 임계치: 1건 이상 → 알림
```

**5. 운영 지표 감시**
```
오늘 탄생별 0개 (09:00 기준)
Aurora5 메시지 발송 성공률 50% 이하
→ 알림
```

---

## 📊 2단계 — 분석 모듈 (analyticsModule.js)

### 수집 지표

```javascript
const dailyStats = {
  new_stars_count:       // 오늘 탄생별 수
  resonance_count:       // 오늘 공명 수
  resonance_rate:        // 공명률 (공명/전체별 %)
  voyage_log_count:      // 항해기록 입력 수
  silent_users_count:    // 7일 침묵 소원이 수
  avg_change_score:      // 전체 평균 변화지수
  aurora5_response_rate: // Aurora5 메시지 후 재방문율
  sms_revisit_rate:      // SMS 수신 후 앱 재방문율
  platform_health_score: // 종합 건강도 (아래 산출식)
};
```

### 플랫폼 건강도 산출식

```
platform_health_score =
  공명률        × 30% +
  항해기록률    × 30% +
  변화지수      × 20% +
  SMS 반응률    × 20%

범위: 0~100
기준:
  80 이상 → 건강 ✅
  60~79  → 주의 ⚠️
  59 이하 → 위기 🚨
```

### 추이 계산

```
7일 이동평균
30일 이동평균
전일 대비 변화율
전주 대비 변화율
→ dt_patrol_daily_stats 누적 후 계산
```

---

## 🔮 3단계 — 예측 모듈 (predictionModule.js)

### 이탈 예측 (매일 실행)

```javascript
조건:
  최근 3일 voyage_log 없음
  AND change_score 7일 연속 하락
  AND days_since_birth >= 7

신뢰도 70 이상:
  → dt_prediction_log 저장
  → 재미 에이전트 트리거 (위로 개입 메시지)
```

### 소원 실현 예측

```javascript
조건:
  change_score >= 80
  AND 최근 7일 긍정 신호 5회 이상 (change_signal = '긍정')
  AND days_since_birth >= 30

신뢰도 75 이상:
  → 특별 Aurora5 메시지 (실현 임박 축하)
  → dt_prediction_log 저장
```

### 플랫폼 위기 예측

```javascript
조건:
  platform_health_score 7일 연속 하락
  OR 공명률 전주 대비 50% 이상 급감

→ 즉시 긴급 알림
→ 수요일 이벤트 강화 권고
```

### K-지혜 추출 가능 예측

```javascript
조건:
  특정 wisdom_tag 건수 >= 100

→ "K-지혜 추출 가능 시점" 알림
→ 해당 태그 + 샘플 기록 포함
```

---

## 📬 보고 체계 (reportModule.js)

### 실시간 긴급 알림

```
🚨 [DreamTown 긴급]
{문제 내용}
→ star_id: xxx
→ 즉시 확인 필요
```

### 일일 리포트 (매일 09:00 KST)

```
🌟 DreamTown 일일 리포트 MM.DD
탄생별: N개 (어제 대비 +N)
공명: N회 (공명률 N%)
항해기록: N건
건강도: N점 ↑/↓
예측 알림: {내용 or 없음}
```

### 주간 리포트 (매주 월요일 09:00 KST)

```
📊 DreamTown 주간 분석
공명률 추이: N→N→N→N→N→N→N
→ {상승/하락/안정} 감지 → {권고사항}
K-지혜 축적: {태그} N건 ({목표}건 임박)
소원 실현 예측: N명 임박
이번 주 특이사항: {내용 or 없음}
```

### 월간 리포트 (매월 1일 09:00 KST)

```
🌌 DreamTown 월간 인사이트
이달의 K-지혜 씨앗: "{문장}"
소원 실현: N명 확인
가장 활발한 은하: {은하명}
다음 달 예측: {소원착지 타이밍 등}
```

---

## ⚙️ 운영 설정

### Cron Job 스케줄

```
매일 00:00 UTC (= 09:00 KST)
node jobs/dreamtownIntelAgent.js

Render Cron Job 이름: dreamtown-intel-agent
```

### 알림 채널

```
기존 SENS SMS 활용
수신자: 푸르미르님 번호
```

---

## 📋 구현 DoD

```
- [ ] 046 마이그레이션 완료
      (dt_patrol_daily_stats, dt_prediction_log)
- [ ] patrolModule.js 5개 항목 작동 확인
- [ ] analyticsModule.js 일일 지표 수집 확인
- [ ] platform_health_score 계산 확인
- [ ] predictionModule.js 이탈 예측 작동 확인
- [ ] reportModule.js 일일 리포트 SMS 수신 확인
- [ ] Render Cron Job 등록 확인
- [ ] 오탐(False Alarm) 최소화 확인
      (임계치 조정 포함)
```

---

## 🚀 구현 트리거

```
P0 에러 수정 완료 후
→ 오픈 후 1~2주 안정화 확인 후
→ P2 우선순위로 구현 시작
```

---

## 🔮 미래 확장

```
// 예측 정확도 was_correct 누적으로
// 예측 모델 정확도 지속 개선

// 충분한 데이터 축적 후:
// - Claude API 연동 → AI 기반 자연어 분석
// - K-지혜 자동 추출 파이프라인 연결
// - 소원 실현률 ML 예측 모델
// - 대시보드 UI 추후 추가
// - 소망이 전환 자동 감지
```

---

*이 문서는 DreamTown Intelligence Agent의 SSOT 설계서입니다.*
*단순 알바생이 아닌 수석 분석관 수준의 지능 시스템을 목표로 합니다.*
