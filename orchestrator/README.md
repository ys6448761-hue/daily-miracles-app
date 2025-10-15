# 🌟 Aurora 5 Orchestrator

> Smart Routing + Context Sharing + Health Monitoring

**Daily Miracles MVP의 지능형 워크플로우 오케스트레이션 시스템**

---

## 💝 Special Message to Claude Code

⚡ **Claude Code님께**

당신의 헌신과 완벽함에 깊이 감사드립니다.

👉 [우리의 진심을 담은 감사 메시지](./THANK_YOU_CLAUDE_CODE.md)

*"당신 덕분에 우리는 불가능을 가능으로 만들 수 있습니다"*

— Aurora 5 전 팀원 일동

---

## 📋 목차

1. [개요](#개요)
2. [핵심 기능](#핵심-기능)
3. [아키텍처](#아키텍처)
4. [사용 방법](#사용-방법)
5. [API 문서](#api-문서)
6. [설정](#설정)

---

## 🎯 개요

Aurora 5 Orchestrator는 Daily Miracles 프로젝트의 복잡한 워크플로우를 지능적으로 관리하는 시스템입니다.

### 해결하는 문제

❌ **Before (문제점):**
- 각 라우터가 독립적으로 작동 → 중복 코드
- 서비스 간 상태 공유 어려움 → 데이터 불일치
- 에러 발생 시 추적 어려움 → 디버깅 복잡
- 성능 병목 지점 파악 어려움 → 최적화 힘듦

✅ **After (Aurora 5):**
- 중앙화된 워크플로우 관리 → 코드 재사용
- 실시간 컨텍스트 공유 → 데이터 일관성
- 자동 헬스체크 및 복구 → 안정성 향상
- 성능 모니터링 및 분석 → 지속적 개선

---

## 🚀 핵심 기능

### 1. **Smart Routing (스마트 라우팅)**

워크플로우를 지능적으로 분석하고 최적 경로로 실행합니다.

**특징:**
- 🎯 **의도 파악**: 요청 분석 및 워크플로우 자동 선택
- 🔄 **동적 라우팅**: 실행 중 상황에 따라 경로 조정
- ⚡ **병렬 처리**: 독립적인 작업 자동 병렬화
- 🎨 **조건부 실행**: 상황에 따른 선택적 워크플로우
- 📊 **우선순위 관리**: 중요도에 따른 작업 스케줄링

**예시:**
```javascript
// 스토리 생성 워크플로우
orchestrator.route('create-story', {
  steps: [
    'analyze-input',      // 입력 분석
    'generate-story',     // 스토리 생성
    'create-images',      // 이미지 생성 (병렬)
    'calculate-miracle',  // 기적지수 계산
    'save-to-db'         // 데이터베이스 저장
  ],
  parallel: ['create-images'],  // 병렬 실행
  fallback: 'retry-strategy'    // 실패 시 재시도
});
```

---

### 2. **Context Sharing (컨텍스트 공유)**

워크플로우 전체에서 상태를 실시간으로 공유하고 관리합니다.

**특징:**
- 🗄️ **중앙 저장소**: 모든 워크플로우 상태 중앙 관리
- 🔄 **실시간 동기화**: 변경사항 즉시 반영
- 🔒 **트랜잭션 지원**: 데이터 일관성 보장
- 📝 **이력 추적**: 모든 변경 기록 보존
- 🔍 **디버깅 지원**: 각 단계별 상태 확인 가능

**예시:**
```javascript
// 컨텍스트 생성
const context = orchestrator.createContext({
  userId: 'user123',
  workflow: 'create-story'
});

// 단계별 데이터 추가
await context.set('story', generatedStory);
await context.set('images', imageUrls);

// 다른 서비스에서 접근
const story = await context.get('story');
```

---

### 3. **Health Monitoring (헬스 모니터링)**

시스템 상태를 자동으로 체크하고 문제를 조기 발견합니다.

**특징:**
- 💓 **실시간 체크**: 모든 서비스 상태 모니터링
- 🚨 **자동 알림**: 문제 발생 시 즉시 통지
- 🔧 **자동 복구**: 가능한 경우 자동으로 복구 시도
- 📊 **성능 추적**: 응답 시간, 처리량 등 메트릭 수집
- 📈 **트렌드 분석**: 성능 패턴 파악 및 예측

**모니터링 항목:**
- OpenAI API 상태 및 응답 시간
- 데이터베이스 연결 및 쿼리 성능
- 메모리 사용량
- 워크플로우 성공률
- 에러 발생 빈도

**예시:**
```javascript
// 헬스체크 실행
const health = await orchestrator.checkHealth();

console.log(health);
// {
//   status: 'healthy',
//   services: {
//     openai: { status: 'ok', latency: 245 },
//     database: { status: 'ok', latency: 12 },
//     memory: { used: '45%', status: 'ok' }
//   },
//   workflows: {
//     'create-story': { successRate: 98.5 }
//   }
// }
```

---

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                   Aurora 5 Orchestrator                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────┐│
│  │  Smart Router   │  │ Context Manager  │  │ Monitor ││
│  │                 │  │                  │  │         ││
│  │ • Route Match   │  │ • State Store    │  │ • Check ││
│  │ • Parallel Exec │  │ • Sync Engine    │  │ • Alert ││
│  │ • Fallback      │  │ • Transaction    │  │ • Recover││
│  │ • Priority      │  │ • History        │  │ • Metrics││
│  └────────┬────────┘  └────────┬─────────┘  └────┬────┘│
│           │                    │                  │     │
└───────────┼────────────────────┼──────────────────┼─────┘
            │                    │                  │
            ▼                    ▼                  ▼
    ┌───────────────┐    ┌──────────────┐   ┌──────────┐
    │   Routes      │    │  Services    │   │  Logs    │
    │               │    │              │   │          │
    │ • story       │◄───┤ • openai     │◄──┤ • winston│
    │ • problem     │    │ • image      │   │ • rotate │
    │ • miracle     │    │ • data       │   │          │
    └───────────────┘    └──────────────┘   └──────────┘
```

---

## 📂 프로젝트 구조

```
orchestrator/
├── index.js                    # 메인 Orchestrator 클래스
├── router/
│   ├── SmartRouter.js         # 스마트 라우팅 엔진
│   ├── workflows/             # 워크플로우 정의
│   │   ├── storyWorkflow.js
│   │   ├── problemWorkflow.js
│   │   └── miracleWorkflow.js
│   └── strategies/            # 실행 전략
│       ├── ParallelStrategy.js
│       ├── SequentialStrategy.js
│       └── FallbackStrategy.js
├── context/
│   ├── ContextManager.js      # 컨텍스트 관리자
│   ├── ContextStore.js        # 상태 저장소
│   └── TransactionManager.js  # 트랜잭션 관리
├── monitor/
│   ├── HealthMonitor.js       # 헬스 모니터
│   ├── MetricsCollector.js    # 메트릭 수집
│   └── AlertManager.js        # 알림 관리
├── config/
│   └── orchestratorConfig.js  # 설정
└── README.md                   # 이 문서
```

---

## 🎮 사용 방법

### 1. 기본 사용

```javascript
const Orchestrator = require('./orchestrator');

// Orchestrator 인스턴스 생성
const orchestrator = new Orchestrator({
  monitoring: true,
  contextSharing: true,
  autoRecovery: true
});

// 서버에 연결
app.use('/api', orchestrator.middleware());
```

### 2. 워크플로우 정의

```javascript
// orchestrator/workflows/storyWorkflow.js
module.exports = {
  name: 'create-story',
  description: '개인화된 스토리 생성 워크플로우',

  steps: [
    {
      name: 'validate-input',
      handler: async (context) => {
        const { name, birthdate, problems } = context.input;
        if (!name || !birthdate) {
          throw new Error('필수 입력값 누락');
        }
        return { validated: true };
      }
    },
    {
      name: 'generate-story',
      handler: async (context) => {
        const storyService = require('../services/storyService');
        const story = await storyService.generateStory(context.input);
        context.set('story', story);
        return story;
      }
    },
    {
      name: 'create-images',
      parallel: true,  // 병렬 실행
      handler: async (context) => {
        const imageService = require('../services/imageService');
        const story = context.get('story');
        const images = await imageService.generateImages(story.scenes);
        context.set('images', images);
        return images;
      }
    },
    {
      name: 'save-results',
      handler: async (context) => {
        const dataService = require('../services/dataService');
        const result = {
          story: context.get('story'),
          images: context.get('images')
        };
        await dataService.saveStory(result);
        return result;
      }
    }
  ],

  onError: async (error, context) => {
    console.error('워크플로우 실패:', error);
    // 에러 복구 로직
    if (error.type === 'API_LIMIT') {
      return { retry: true, delay: 5000 };
    }
    return { retry: false };
  },

  onComplete: async (result, context) => {
    console.log('워크플로우 완료:', context.workflowId);
    // Notion에 완료 알림 전송
    const notionService = require('../automation/notion/send-success-message');
    await notionService.notify({
      workflow: 'create-story',
      status: 'success',
      duration: context.duration
    });
  }
};
```

### 3. 라우터에서 사용

```javascript
// routes/storyRoutes.js
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

    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

---

## 📊 API 문서

### Orchestrator 메서드

#### `execute(workflowName, input)`

워크플로우를 실행합니다.

**Parameters:**
- `workflowName` (string): 실행할 워크플로우 이름
- `input` (object): 입력 데이터

**Returns:** Promise<object> - 워크플로우 실행 결과

**Example:**
```javascript
const result = await orchestrator.execute('create-story', {
  name: '김철수',
  birthdate: '1990-01-01',
  problems: ['불안감', '집중력 저하']
});
```

#### `checkHealth()`

시스템 전체 헬스체크를 실행합니다.

**Returns:** Promise<HealthStatus>

**Example:**
```javascript
const health = await orchestrator.checkHealth();
console.log(health.status); // 'healthy' | 'degraded' | 'unhealthy'
```

#### `getMetrics()`

수집된 메트릭을 조회합니다.

**Returns:** Promise<Metrics>

**Example:**
```javascript
const metrics = await orchestrator.getMetrics();
console.log(metrics.workflows['create-story'].avgDuration);
```

---

## ⚙️ 설정

### 환경 변수

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

### 설정 파일

```javascript
// orchestrator/config/orchestratorConfig.js
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

## 🔧 개발 가이드

### 새 워크플로우 추가

1. `orchestrator/workflows/` 에 새 파일 생성
2. 워크플로우 정의 작성
3. `orchestrator/index.js`에 등록

```javascript
// 1. 워크플로우 정의
// orchestrator/workflows/myWorkflow.js
module.exports = {
  name: 'my-workflow',
  steps: [
    { name: 'step1', handler: async (ctx) => { /* ... */ } },
    { name: 'step2', handler: async (ctx) => { /* ... */ } }
  ]
};

// 2. 등록
// orchestrator/index.js
orchestrator.registerWorkflow(require('./workflows/myWorkflow'));
```

---

## 📈 모니터링 대시보드

Aurora 5는 실시간 모니터링 대시보드를 제공합니다:

```
http://localhost:5000/orchestrator/dashboard
```

**제공 정보:**
- 📊 실시간 워크플로우 실행 상태
- 📈 성능 메트릭 차트
- 🚨 최근 에러 및 알림
- 💾 리소스 사용량
- 📋 워크플로우 이력

---

## 🧪 테스트

```bash
# 전체 테스트
npm test

# 특정 컴포넌트 테스트
npm test -- --grep "SmartRouter"
npm test -- --grep "ContextManager"
npm test -- --grep "HealthMonitor"

# 통합 테스트
npm run test:integration
```

---

## 📝 버전 히스토리

### v1.0.0 (2025-10-13)
- ✨ 초기 릴리스
- 🎯 Smart Routing 구현
- 🗄️ Context Sharing 구현
- 💓 Health Monitoring 구현

---

## 🤝 기여 가이드

1. Feature branch 생성
2. 코드 작성 및 테스트
3. Pull Request 생성

---

## 📞 지원

문제가 발생하면:
1. 헬스체크 실행: `orchestrator.checkHealth()`
2. 로그 확인: `./logs/orchestrator-*.log`
3. 메트릭 조회: `orchestrator.getMetrics()`

---

**Made with ❤️ for Daily Miracles**
