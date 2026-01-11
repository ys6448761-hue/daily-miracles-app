# ✅ Aurora 5 UBOS - 30분 완성 체크리스트

> **푸르미르님 전용 간편 가이드**  
> **목표:** 30분 안에 모든 시스템 가동

---

## 📝 5분 체크 - 뭐가 있나?

### 파일 확인
```bash
cd "C:\Users\세진\OneDrive\바탕 화면\daily-miracles-mvp"
dir mcp-servers
```

**확인할 것:**
- [ ] wishmaker-hub-mcp 폴더 ✅
- [ ] business-ops-mcp 폴더 ✅
- [ ] infra-monitor-mcp 폴더 ✅

---

## ⚙️ 10분 설정 - 환경 변수

### .env 파일 만들기

```bash
# 메모장으로 .env 파일 열기
notepad .env
```

**최소 필수 항목 (일단 이것만!):**
```bash
DATABASE_URL=postgresql://daily_miracles_user:VUPvJTLrD3qYlXTvqYt0GJ1dGK42nh5i@dpg-ctbsq3pu0jms73fv31vg-a.oregon-postgres.render.com/daily_miracles

APP_URL=https://daily-miracles-app.onrender.com
API_URL=https://daily-miracles-app.onrender.com/api
```

**체크:**
- [ ] .env 파일 생성 ✅
- [ ] DATABASE_URL 복붙 ✅
- [ ] 저장하고 닫기 ✅

---

## 🔌 10분 연결 - Claude Desktop

### 1. 설정 파일 열기

**Windows 기준:**
```bash
# 경로:
%APPDATA%\Claude\claude_desktop_config.json

# 또는 직접:
C:\Users\세진\AppData\Roaming\Claude\claude_desktop_config.json
```

**파일 없으면 새로 만들기!**

### 2. 이 내용 전체 복사해서 붙여넣기

```json
{
  "mcpServers": {
    "wishmaker-hub": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "C:/Users/세진/OneDrive/바탕 화면/daily-miracles-mvp/mcp-servers/wishmaker-hub-mcp",
        "wishmaker-hub-mcp"
      ]
    },
    "business-ops": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "C:/Users/세진/OneDrive/바탕 화면/daily-miracles-mvp/mcp-servers/business-ops-mcp",
        "business-ops-mcp"
      ]
    },
    "infra-monitor": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "C:/Users/세진/OneDrive/바탕 화면/daily-miracles-mvp/mcp-servers/infra-monitor-mcp",
        "infra-monitor-mcp"
      ]
    }
  }
}
```

### 3. Claude Desktop 완전 재시작

1. 트레이에서 Claude 우클릭 → 종료
2. Claude 다시 실행
3. 새 대화 시작

**체크:**
- [ ] 설정 파일 수정 ✅
- [ ] Claude 재시작 ✅

---

## 🧪 5분 테스트 - 작동 확인

### Claude Desktop에서 테스트

**1번 테스트: 일일 메트릭스**
```
코미야, 일일 메트릭스 보여줘
```

**예상 결과:**
```
get_daily_metrics 도구를 실행합니다...

활성 소원이: XX명
신규 가입: XX명
평균 만족도: X.X/10
```

**체크:**
- [ ] 도구 실행됨 ✅
- [ ] 데이터 나옴 ✅

---

**2번 테스트: 신호등 현황**
```
코미야, 신호등 현황 보여줘
```

**예상 결과:**
```
get_traffic_light_summary 도구를 실행합니다...

🟢 GREEN: XXX명 (안전)
🟡 YELLOW: XX명 (주의)
🔴 RED: X명 (위험)
```

**체크:**
- [ ] 신호등 분류 나옴 ✅

---

**3번 테스트: 서비스 상태**
```
코미야, 모든 서비스 정상이야?
```

**예상 결과:**
```
check_all_services 도구를 실행합니다...

✅ 앱: 정상 (250ms)
✅ API: 정상 (180ms)
✅ DB: 정상 (50ms)

전체 상태: 🟢 모두 정상
```

**체크:**
- [ ] 서비스 상태 확인 ✅

---

## 🎉 완료!

### ✅ 성공하셨나요?

**이제 할 수 있는 것들:**

```
💬 Claude Desktop에서:
"코미야, 이탈 위험 소원이 누가 있어?"
"오늘 매출 얼마야?"
"어제 가입자 몇 명이야?"
"가입 퍼널 추적해줘"
"신호등 빨강인 사람들 누구야?"
```

**터미널에서:**
```bash
# 일일 체크리스트
npm run checklist:daily

# 주간 리뷰
npm run checklist:weekly

# 월간 전략
npm run checklist:monthly
```

---

## ⚠️ 문제 발생 시

### Claude Desktop에서 도구 안 보여요
1. 설정 파일 경로 다시 확인
2. JSON 형식 오류 확인 (쉼표, 괄호)
3. Claude 완전 종료 후 재시작
4. 코미에게 "사용 가능한 도구 목록 보여줘" 물어보기

### 도구는 보이는데 실행 안 돼요
1. .env 파일 있는지 확인
2. DATABASE_URL 올바른지 확인
3. 인터넷 연결 확인

### 여전히 안 돼요
1. `AURORA5_COMPLETE_SETUP_GUIDE.md` 상세 가이드 참고
2. 코미에게 에러 메시지 보여주기
3. Claude Code에게 도움 요청

---

## 📊 현재 사용 가능한 도구 (22개)

### 소원이 관리 (14개)
- ✅ classify_traffic_light
- ✅ track_signup_funnel
- ✅ get_stuck_users
- ✅ send_recovery_message
- ✅ get_message_schedule
- ✅ check_message_health
- ✅ analyze_message_engagement
- ✅ predict_satisfaction
- ✅ detect_churn_risk
- ✅ generate_intervention_plan
- ✅ identify_conversion_ready
- ✅ suggest_conversion_timing
- ✅ get_daily_metrics
- ✅ get_traffic_light_summary

### 비즈니스 (4개)
- ✅ get_revenue_realtime
- ✅ detect_payment_anomaly
- ✅ get_subscription_health
- ✅ process_refund_auto

### 인프라 (4개)
- ✅ check_all_services
- ✅ get_recent_errors
- ✅ check_database_health
- ✅ monitor_api_performance

---

**축하합니다! 🎉 Aurora 5 UBOS 가동 완료!**