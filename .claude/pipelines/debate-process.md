---
name: debate-process
version: 1.0.0
description: Aurora 5 내부 원탁토론 자동화 파이프라인
trigger: /api/debate/run
owner: 코미
created: 2026-01-02
---

# Debate Process Pipeline

> Aurora 5 팀의 내부 토론을 자동화하여 DEC 문서와 Action Item을 생성합니다.

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      INPUT                                   │
│  { topic, context, urgency, data_requirements }             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Phase 0: 입력 파싱                           │
│              parse-debate-input.ts                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Phase 0.5: 데이터 조회 (선택)                  │
│                     data-agent                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Phase 1: 병렬 토론                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ creative-   │  │ cro-agent   │  │ safety-gate │         │
│  │ agent       │  │ (재미)       │  │ (여의보주)   │         │
│  │ (루미)       │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│        │                │                │                  │
│        └────────────────┴────────────────┘                  │
│                         │                                    │
│                         ▼                                    │
│              validate-json.ts                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Phase 2: 의견 병합                           │
│              merge-role-outputs.ts                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Phase 3: COO 종합                           │
│               coo-synthesizer (코미)                         │
│  - 의견 통합                                                 │
│  - DEC 초안 생성                                             │
│  - Action Item 도출                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Phase 4: 출력 포맷팅                         │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ format-dec-md   │  │ format-actions  │                   │
│  │     .ts         │  │     -md.ts      │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      OUTPUT                                  │
│  {                                                          │
│    debate_id: "DEB-2026-0102-001",                         │
│    dec_markdown: "...",                                     │
│    actions_markdown: "...",                                 │
│    raw_outputs: { creative, cro, safety, synthesizer }     │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

## 입력 스키마

```typescript
interface DebateInput {
  topic: string;              // 토론 주제 (필수)
  context?: string;           // 배경/맥락
  urgency: 'high' | 'medium' | 'low';  // 긴급도
  data_requirements?: string[]; // 필요한 데이터
  participants?: string[];    // 참여 에이전트 (기본: 전체)
  approval_required?: boolean; // 푸르미르 승인 필요 여부
}
```

## 출력 스키마

```typescript
interface DebateOutput {
  debate_id: string;          // DEB-YYYY-MMDD-NNN
  timestamp: string;          // ISO8601
  topic: string;

  // 마크다운 출력
  dec_markdown: string;       // DEC 문서
  actions_markdown: string;   // Action Item 목록

  // 원시 데이터
  raw_outputs: {
    creative: CreativeOutput;
    cro: CROOutput;
    safety: SafetyOutput;
    synthesizer: SynthesizerOutput;
  };

  // 메타데이터
  execution_time_ms: number;
  agent_performance: {
    [agent: string]: {
      status: 'success' | 'timeout' | 'error';
      duration_ms: number;
    };
  };
}
```

## 실행 흐름 상세

### Phase 0: 입력 파싱
```
parse-debate-input.ts
├── 입력 유효성 검사
├── topic 정규화
├── context 구조화
├── debate_id 생성
└── 출력: ParsedDebateInput
```

### Phase 0.5: 데이터 조회 (선택)
```
data-agent (data_requirements가 있을 경우)
├── 필요 데이터 조회
├── 메트릭 분석
├── 트렌드 파악
└── 출력: DataContext
```

### Phase 1: 병렬 토론
```
Promise.all([
  creative-agent(input),
  cro-agent(input),
  safety-gate(input)
])

타임아웃: 30초
폴백 처리:
- creative: 타임아웃 시 empty ideas
- cro: 타임아웃 시 neutral stance
- safety: 타임아웃 시 FAIL (안전 우선)
```

### Phase 2: 의견 병합
```
merge-role-outputs.ts
├── JSON 유효성 검증
├── 역할별 출력 정규화
├── 누락된 필드 기본값 처리
└── 출력: MergedOutputs
```

### Phase 3: COO 종합
```
coo-synthesizer
├── 공통점 추출
├── 이견점 분석 및 조율
├── 핵심 인사이트 도출
├── DEC 초안 생성
├── Action Item 할당
└── 출력: SynthesizerOutput
```

### Phase 4: 출력 포맷팅
```
format-dec-md.ts
├── DEC 마크다운 템플릿 적용
└── 출력: dec_markdown

format-actions-md.ts
├── Action Item 테이블 생성
└── 출력: actions_markdown
```

## 에러 처리

### 에이전트 타임아웃
```javascript
const TIMEOUTS = {
  'data-agent': 15000,      // 15초
  'creative-agent': 30000,  // 30초
  'cro-agent': 30000,       // 30초
  'safety-gate': 30000,     // 30초
  'coo-synthesizer': 60000  // 60초
};

// 폴백 처리
if (timeout) {
  if (agent === 'safety-gate') {
    return { status: 'FAIL', reason: 'timeout' };
  }
  return { status: 'no_response' };
}
```

### JSON 파싱 실패
```javascript
// validate-json.ts에서 처리
try {
  JSON.parse(output);
} catch (e) {
  // 재시도 1회
  // 실패 시 빈 객체 반환
}
```

### 전체 파이프라인 실패
```javascript
// 최대 재시도: 2회
// 재시도 간격: 5초
// 최종 실패 시: 수동 처리 요청 알림
```

## API 엔드포인트

### POST /api/debate/run

**요청:**
```json
{
  "topic": "인스타그램 광고 캠페인 시작 여부",
  "context": "예산 50만원, 목표: 신규 가입 100명",
  "urgency": "high",
  "data_requirements": ["DAU", "광고_전환율", "CAC"],
  "approval_required": true
}
```

**응답:**
```json
{
  "success": true,
  "debate_id": "DEB-2026-0102-001",
  "dec_markdown": "# DEC-2026-0102-001: 인스타그램 광고...",
  "actions_markdown": "| # | 업무 | 담당 | 기한 |...",
  "execution_time_ms": 45230,
  "status": "completed"
}
```

## 설정

```javascript
const DEBATE_CONFIG = {
  // ID 생성
  id_prefix: 'DEB',
  dec_prefix: 'DEC',
  action_prefix: 'ACT',

  // 타임아웃
  total_timeout: 120000,  // 전체 2분

  // 출력
  output_dir: 'docs/debates',
  dec_dir: 'docs/decisions',

  // 알림
  notify_on_complete: true,
  notify_channel: 'slack'  // 또는 'kakao'
};
```

## 실행 예시

### CLI
```bash
# 기본 실행
npx ts-node scripts/run-debate.ts --topic "인스타 광고"

# 옵션 포함
npx ts-node scripts/run-debate.ts \
  --topic "인스타 광고" \
  --context "예산 50만원" \
  --urgency high
```

### API
```bash
curl -X POST http://localhost:5100/api/debate/run \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "인스타그램 광고 캠페인",
    "urgency": "high"
  }'
```

## 모니터링

| 지표 | 목표 | 경고 |
|------|------|------|
| 평균 실행 시간 | < 60초 | > 90초 |
| 성공률 | > 95% | < 90% |
| 타임아웃 비율 | < 5% | > 10% |

---

*버전: 1.0.0 | 2026-01-02*
*관리자: 코미 (COO)*
