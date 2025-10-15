# 🚀 Aurora 5 Orchestrator - Quick Start Guide

> 5분 안에 시작하기

---

## ✅ 완성된 시스템

Aurora 5 Orchestrator가 완전히 구축되었습니다!

```
orchestrator/
├── 📚 README.md (14KB)               - 완전한 문서
├── 🚀 QUICK_START.md (이 파일)       - 빠른 시작 가이드
├── ⚙️  index.js (7.7KB)              - 메인 Orchestrator
├── router/
│   └── SmartRouter.js (8KB)         - 스마트 라우팅 엔진
├── context/
│   └── ContextManager.js (9.5KB)    - 컨텍스트 관리자
├── monitor/
│   └── HealthMonitor.js (9KB)       - 헬스 모니터
├── config/
│   └── orchestratorConfig.js        - 설정
└── workflows/
    ├── storyWorkflow.js             - 스토리 생성 워크플로우
    ├── problemWorkflow.js           - 문제 분석 워크플로우
    └── miracleWorkflow.js           - 기적지수 계산 워크플로우
```

---

## 🎯 핵심 기능

### 1. Smart Routing
- ✅ 워크플로우 지능적 분석 및 최적 경로 실행
- ✅ 병렬 처리 자동화 (최대 5개 동시 실행)
- ✅ 자동 재시도 (최대 3회)
- ✅ 조건부 실행 지원
- ✅ 타임아웃 관리 (5분)

### 2. Context Sharing
- ✅ 중앙화된 상태 관리
- ✅ 실시간 동기화
- ✅ 트랜잭션 지원
- ✅ 변경 이력 추적
- ✅ 자동 정리 (TTL 1시간)

### 3. Health Monitoring
- ✅ 실시간 서비스 모니터링
- ✅ OpenAI API 상태 체크
- ✅ 데이터베이스 연결 체크
- ✅ 시스템 리소스 모니터링
- ✅ 워크플로우 성공률 추적

---

## 📦 사용 방법

### Step 1: 서버에 통합

**server.js에 추가:**

```javascript
// Orchestrator 불러오기
const orchestrator = require('./orchestrator');

// 초기화
async function startServer() {
  // Orchestrator 초기화
  await orchestrator.initialize();

  // Express 앱에 연결
  app.use('/api', orchestrator.middleware());

  // 서버 시작
  server.listen(port, () => {
    console.log('🌟 Aurora 5 Orchestrator 활성화!');
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await orchestrator.shutdown();
  server.close();
});

startServer();
```

### Step 2: 라우터에서 사용

**routes/storyRoutes.js 수정:**

```javascript
const express = require('express');
const router = express.Router();
const orchestrator = require('../orchestrator');

router.post('/create-story', async (req, res, next) => {
  try {
    // Orchestrator를 통해 워크플로우 실행
    const result = await orchestrator.execute('create-story', {
      input: req.body,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: result.result,
      context: result.context
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

---

## 🧪 테스트

### 헬스체크 실행

```bash
curl http://localhost:5000/orchestrator/health
```

**응답 예시:**
```json
{
  "status": "healthy",
  "services": {
    "openai": { "status": "ok", "latency": 12 },
    "database": { "status": "ok", "latency": 8 }
  },
  "system": {
    "memory": { "used": "45MB", "status": "ok" },
    "uptime": "2h 15m 30s"
  },
  "workflows": {
    "create-story": {
      "total": 25,
      "success": 24,
      "successRate": "96%",
      "avgDuration": "45000ms"
    }
  }
}
```

### 워크플로우 실행 테스트

```javascript
// Node.js에서 직접 테스트
const orchestrator = require('./orchestrator');

async function test() {
  await orchestrator.initialize();

  const result = await orchestrator.execute('create-story', {
    input: {
      name: '테스트',
      age: 10,
      personality: '활발함',
      hobby: '그림 그리기',
      dreamJob: '화가',
      favoriteColor: '파란색',
      favoriteAnimal: '고양이',
      specialMemory: '가족 여행'
    }
  });

  console.log('결과:', result);
}

test();
```

---

## 📊 모니터링

### 메트릭 조회

```javascript
const metrics = await orchestrator.getMetrics();

console.log(metrics);
// {
//   system: {
//     requests: 150,
//     errors: 3,
//     startTime: 1697123456789
//   },
//   workflows: {
//     'create-story': {
//       success: 45,
//       error: 2,
//       durations: [42000, 45000, 43000, ...],
//       lastRun: '2025-10-13T14:30:00.000Z'
//     }
//   }
// }
```

### 실시간 헬스체크

```javascript
const health = await orchestrator.checkHealth();

console.log(health.status); // 'healthy' | 'degraded' | 'unhealthy'
```

---

## ⚙️ 설정

### 환경 변수 (.env)

```env
# Orchestrator 설정
ORCHESTRATOR_ENABLED=true
ORCHESTRATOR_MONITORING_INTERVAL=30000  # 30초
ORCHESTRATOR_MAX_RETRIES=3
ORCHESTRATOR_TIMEOUT=300000  # 5분

# 알림 설정
ORCHESTRATOR_ALERT_NOTION=true
ORCHESTRATOR_ALERT_CONSOLE=true
```

### 설정 파일 수정

**orchestrator/config/orchestratorConfig.js:**

```javascript
module.exports = {
  monitoring: {
    enabled: true,
    interval: 30000,  // 30초마다 체크
    alerts: {
      notion: true,
      console: true
    }
  },

  routing: {
    maxConcurrent: 5,  // 최대 동시 실행 수
    timeout: 300000,   // 5분 타임아웃
    retries: 3         // 재시도 횟수
  },

  context: {
    ttl: 3600000,      // 1시간 후 컨텍스트 자동 삭제
    maxSize: 10485760  // 최대 10MB
  }
};
```

---

## 🎨 커스텀 워크플로우 추가

### 1. 워크플로우 파일 생성

**orchestrator/workflows/myWorkflow.js:**

```javascript
module.exports = {
  name: 'my-custom-workflow',
  description: '나만의 워크플로우',

  steps: [
    {
      name: 'step-1',
      description: '첫 번째 단계',
      handler: async (context) => {
        const input = await context.get('input');
        // 로직 작성
        return { result: 'step 1 완료' };
      }
    },
    {
      name: 'step-2',
      description: '두 번째 단계',
      parallel: true,  // 병렬 실행
      handler: async (context) => {
        const step1Result = await context.get('step-1');
        // 로직 작성
        return { result: 'step 2 완료' };
      }
    }
  ],

  onError: async (error, context) => {
    console.error('워크플로우 실패:', error);
    return { retry: false };
  },

  onComplete: async (result, context) => {
    console.log('워크플로우 완료!');
  }
};
```

### 2. 등록

**orchestrator/index.js에 추가:**

```javascript
async function registerDefaultWorkflows() {
  const workflows = [
    require('./workflows/storyWorkflow'),
    require('./workflows/problemWorkflow'),
    require('./workflows/miracleWorkflow'),
    require('./workflows/myWorkflow')  // 추가
  ];

  for (const workflow of workflows) {
    this.registerWorkflow(workflow);
  }
}
```

### 3. 사용

```javascript
const result = await orchestrator.execute('my-custom-workflow', {
  input: { /* 입력 데이터 */ }
});
```

---

## 🔧 디버깅

### 로그 확인

```bash
# Winston 로그 확인
tail -f logs/combined.log
tail -f logs/error.log
```

### 컨텍스트 디버깅

```javascript
// 컨텍스트 조회
const context = await orchestrator.contextManager.getContext(contextId);

// 전체 데이터 확인
console.log(await context.getAll());

// 변경 이력 확인
console.log(context.getHistory());

// 요약 정보
console.log(context.getSummary());
```

---

## 📈 성능 최적화 팁

### 1. 병렬 처리 활용

```javascript
{
  name: 'parallel-step',
  parallel: true,  // ✅ 이것만 추가하면 병렬 실행!
  handler: async (context) => {
    // 독립적인 작업 처리
  }
}
```

### 2. 조건부 실행

```javascript
{
  name: 'conditional-step',
  condition: async (context) => {
    // 조건 검사
    const data = await context.get('previous-step');
    return data.shouldExecute;
  },
  handler: async (context) => {
    // 조건이 참일 때만 실행
  }
}
```

### 3. 재시도 전략

```javascript
{
  name: 'retry-step',
  retry: true,  // 실패 시 자동 재시도
  handler: async (context) => {
    // API 호출 등 실패 가능한 작업
  }
}
```

---

## 🚨 문제 해결

### 문제 1: "워크플로우를 찾을 수 없습니다"

**원인**: 워크플로우가 등록되지 않음

**해결**:
```javascript
// index.js에서 워크플로우 등록 확인
orchestrator.registerWorkflow(require('./workflows/myWorkflow'));
```

### 문제 2: "타임아웃 에러"

**원인**: 워크플로우 실행 시간이 5분 초과

**해결**:
```javascript
// orchestratorConfig.js에서 타임아웃 증가
routing: {
  timeout: 600000  // 10분으로 증가
}
```

### 문제 3: "메모리 부족 경고"

**원인**: 컨텍스트가 너무 많이 쌓임

**해결**:
```javascript
// TTL 감소 또는 수동 정리
context: {
  ttl: 1800000  // 30분으로 감소
}

// 또는 수동 정리
await orchestrator.contextManager.cleanupExpired();
```

---

## 📚 추가 리소스

- **전체 문서**: [README.md](./README.md)
- **설정 가이드**: [config/orchestratorConfig.js](./config/orchestratorConfig.js)
- **예제 워크플로우**: [workflows/](./workflows/)

---

## 🎉 다음 단계

1. ✅ 서버에 Orchestrator 통합
2. ✅ 기존 라우터 Orchestrator로 마이그레이션
3. ✅ 헬스체크 대시보드 확인
4. ✅ 커스텀 워크플로우 추가
5. ✅ Notion 알림 연동 (선택)

---

**Aurora 5 Orchestrator가 준비되었습니다!** 🚀

문의사항이 있으면 `README.md`를 참고하세요.
