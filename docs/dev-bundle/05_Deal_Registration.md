# 딜 등록 및 보호 정책 (개발 참조용)

> MICE 인센티브 딜 관리 - 분쟁 처리 원칙 및 구현 가이드
> 버전: 1.0 | 2026-02-05

---

## 1. 딜 상태 코드

### 1.1 ENUM 정의

```sql
CREATE TYPE deal_status AS ENUM (
  'INQUIRY',      -- 문의
  'PROPOSAL',     -- 제안
  'NEGOTIATION',  -- 협의
  'CONTRACTED',   -- 계약
  'IN_PROGRESS',  -- 진행
  'COMPLETED',    -- 완료
  'SETTLEMENT',   -- 정산
  'CLOSED',       -- 종결
  'CANCELLED'     -- 취소
);
```

### 1.2 상태 전이 규칙

```javascript
const dealStateTransitions = {
  'INQUIRY': ['PROPOSAL', 'CANCELLED'],
  'PROPOSAL': ['NEGOTIATION', 'CANCELLED'],
  'NEGOTIATION': ['CONTRACTED', 'CANCELLED'],
  'CONTRACTED': ['IN_PROGRESS', 'CANCELLED'],
  'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
  'COMPLETED': ['SETTLEMENT'],
  'SETTLEMENT': ['CLOSED'],
  'CLOSED': [],
  'CANCELLED': []
};

function canTransition(from, to) {
  return dealStateTransitions[from]?.includes(to) || false;
}
```

---

## 2. 증빙 등급 시스템

### 2.1 등급 정의

| 등급 | 코드 | 우선순위 | 정산 가능 |
|------|------|----------|----------|
| A급 | `GRADE_A` | 1 | Yes |
| B급 | `GRADE_B` | 2 | No (보조만) |
| C급 | `GRADE_C` | 3 | No (예비 딜만) |

### 2.2 증빙별 등급 매핑

```javascript
const evidenceGrades = {
  // A급 - 완전 증빙
  'CONTRACT': 'A',
  'TAX_INVOICE': 'A',
  'DEPOSIT_SLIP': 'A',
  'CARD_SLIP': 'A',
  'BIZ_REG': 'A',
  'BANKBOOK': 'A',

  // B급 - 유효 증빙
  'OFFICIAL_LETTER': 'B',
  'QUOTE': 'B',
  'EMAIL': 'B',

  // C급 - 보조 증빙
  'CHAT_LOG': 'C',
  'VERBAL': 'C'
};
```

### 2.3 딜 단계별 최소 요구 등급

```javascript
const minEvidenceGrade = {
  'INQUIRY': 'C',       // C급 이상
  'PROPOSAL': 'C',
  'NEGOTIATION': 'B',   // B급 이상
  'CONTRACTED': 'B',
  'IN_PROGRESS': 'A',   // A급 필수
  'COMPLETED': 'A',
  'SETTLEMENT': 'A'     // A급 100%
};

function validateEvidenceGrade(dealStatus, evidenceGrade) {
  const minGrade = minEvidenceGrade[dealStatus];
  const gradeOrder = { 'A': 1, 'B': 2, 'C': 3 };

  return gradeOrder[evidenceGrade] <= gradeOrder[minGrade];
}
```

---

## 3. 딜 보호 정책 구현

### 3.1 보호 기간 계산

```javascript
const protectionPeriodDays = {
  'INQUIRY': 30,
  'PROPOSAL': 30,
  'NEGOTIATION': 60,
  'CONTRACTED': 'until_event_end + 30',
  'IN_PROGRESS': 'until_event_end + 60'
};

function calculateProtectionEndDate(deal) {
  const { status, created_at, event_end_date } = deal;

  switch (status) {
    case 'INQUIRY':
    case 'PROPOSAL':
      return addDays(created_at, 30);
    case 'NEGOTIATION':
      return addDays(created_at, 60);
    case 'CONTRACTED':
      return addDays(event_end_date, 30);
    case 'IN_PROGRESS':
      return addDays(event_end_date, 60);
    default:
      return null; // 보호 종료
  }
}

function isUnderProtection(deal) {
  const endDate = calculateProtectionEndDate(deal);
  return endDate && new Date() < endDate;
}
```

### 3.2 보호 연장 조건

```javascript
function canExtendProtection(deal) {
  // 진행 상황 보고 시 30일 연장 가능
  const hasRecentReport = deal.last_report_at &&
    daysSince(deal.last_report_at) < 30;

  return deal.status === 'INQUIRY' && hasRecentReport;
}

function extendProtection(deal, newEndDate) {
  return {
    ...deal,
    protection_extended_at: new Date(),
    protection_end_date: newEndDate
  };
}
```

---

## 4. 분쟁 해결 로직

### 4.1 동시 등록 판단

```javascript
function resolveConcurrentRegistration(dealA, dealB) {
  // 1. 등록 시간 비교
  if (dealA.created_at < dealB.created_at) {
    return { winner: dealA, reason: 'EARLIER_REGISTRATION' };
  }
  if (dealB.created_at < dealA.created_at) {
    return { winner: dealB, reason: 'EARLIER_REGISTRATION' };
  }

  // 2. 동일 시간인 경우 증빙 등급 비교
  const gradeOrder = { 'A': 1, 'B': 2, 'C': 3 };
  const gradeA = getHighestEvidenceGrade(dealA);
  const gradeB = getHighestEvidenceGrade(dealB);

  if (gradeOrder[gradeA] < gradeOrder[gradeB]) {
    return { winner: dealA, reason: 'HIGHER_EVIDENCE_GRADE' };
  }
  if (gradeOrder[gradeB] < gradeOrder[gradeA]) {
    return { winner: dealB, reason: 'HIGHER_EVIDENCE_GRADE' };
  }

  // 3. 수동 조정 필요
  return { winner: null, reason: 'MANUAL_REVIEW_REQUIRED' };
}
```

### 4.2 증빙 강도 비교

```javascript
function compareEvidenceStrength(evidenceListA, evidenceListB) {
  const weights = {
    'CONTRACT': 100,
    'TAX_INVOICE': 80,
    'DEPOSIT_SLIP': 70,
    'OFFICIAL_LETTER': 50,
    'EMAIL': 30,
    'CHAT_LOG': 10,
    'VERBAL': 5
  };

  const scoreA = evidenceListA.reduce((sum, e) => sum + (weights[e.type] || 0), 0);
  const scoreB = evidenceListB.reduce((sum, e) => sum + (weights[e.type] || 0), 0);

  return {
    scoreA,
    scoreB,
    winner: scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'TIE'
  };
}
```

---

## 5. 감사 로그

### 5.1 필수 기록 대상

```javascript
const auditableActions = [
  'DEAL_CREATED',
  'DEAL_STATUS_CHANGED',
  'EVIDENCE_UPLOADED',
  'EVIDENCE_DELETED',
  'AMOUNT_CHANGED',
  'ASSIGNEE_CHANGED',
  'PROTECTION_EXTENDED',
  'DISPUTE_RAISED',
  'DISPUTE_RESOLVED'
];
```

### 5.2 로그 스키마

```javascript
const auditLogSchema = {
  id: 'uuid',
  deal_id: 'uuid',
  timestamp: 'timestamp with time zone',
  actor_id: 'uuid',
  actor_name: 'string',
  action: 'enum(auditableActions)',
  before_value: 'jsonb',
  after_value: 'jsonb',
  evidence_file: 'string (nullable)',
  notes: 'text (nullable)',
  ip_address: 'inet'
};
```

### 5.3 로그 생성 함수

```javascript
async function createAuditLog(db, {
  dealId,
  actorId,
  actorName,
  action,
  beforeValue,
  afterValue,
  evidenceFile = null,
  notes = null,
  ipAddress = null
}) {
  const query = `
    INSERT INTO deal_audit_log (
      deal_id, actor_id, actor_name, action,
      before_value, after_value, evidence_file,
      notes, ip_address
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

  return db.query(query, [
    dealId,
    actorId,
    actorName,
    action,
    JSON.stringify(beforeValue),
    JSON.stringify(afterValue),
    evidenceFile,
    notes,
    ipAddress
  ]);
}
```

---

## 6. API 엔드포인트

### 6.1 딜 관리

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/deals` | 딜 등록 |
| GET | `/api/deals/:id` | 딜 조회 |
| PATCH | `/api/deals/:id/status` | 상태 변경 |
| POST | `/api/deals/:id/evidence` | 증빙 업로드 |
| GET | `/api/deals/:id/protection` | 보호 상태 조회 |
| POST | `/api/deals/:id/extend-protection` | 보호 연장 |

### 6.2 분쟁 관리

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/disputes` | 분쟁 제기 |
| GET | `/api/disputes/:id` | 분쟁 조회 |
| POST | `/api/disputes/:id/resolve` | 분쟁 해결 |

---

## 7. 데이터 모델

### 7.1 deals 테이블

```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES ops_events(id),

  -- 기본 정보
  event_name VARCHAR(200) NOT NULL,
  event_period_start DATE,
  event_period_end DATE,
  event_location VARCHAR(200),
  expected_participants INT,
  foreign_ratio DECIMAL(5,2),
  organizer_name VARCHAR(100),
  contact_name VARCHAR(50),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  expected_amount DECIMAL(15,2),

  -- 상태
  status deal_status DEFAULT 'INQUIRY',
  assignee_id UUID,

  -- 보호
  protection_end_date TIMESTAMP,
  protection_extended_at TIMESTAMP,

  -- 메타
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_event_id ON deals(event_id);
CREATE INDEX idx_deals_protection ON deals(protection_end_date);
```

### 7.2 deal_evidence 테이블

```sql
CREATE TABLE deal_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,

  evidence_type VARCHAR(50) NOT NULL,
  grade CHAR(1) NOT NULL CHECK (grade IN ('A', 'B', 'C')),
  file_path VARCHAR(500),
  file_name VARCHAR(200),
  file_size INT,
  notes TEXT,

  uploaded_at TIMESTAMP DEFAULT NOW(),
  uploaded_by UUID
);

CREATE INDEX idx_deal_evidence_deal ON deal_evidence(deal_id);
```

---

## 8. 테스트 케이스

### 8.1 상태 전이 테스트

```javascript
describe('Deal State Transitions', () => {
  it('should allow INQUIRY → PROPOSAL', () => {
    expect(canTransition('INQUIRY', 'PROPOSAL')).toBe(true);
  });

  it('should not allow INQUIRY → COMPLETED', () => {
    expect(canTransition('INQUIRY', 'COMPLETED')).toBe(false);
  });

  it('should not allow CLOSED → any state', () => {
    expect(canTransition('CLOSED', 'INQUIRY')).toBe(false);
  });
});
```

### 8.2 보호 기간 테스트

```javascript
describe('Protection Period', () => {
  it('should protect INQUIRY for 30 days', () => {
    const deal = { status: 'INQUIRY', created_at: new Date() };
    const endDate = calculateProtectionEndDate(deal);
    expect(daysBetween(new Date(), endDate)).toBe(30);
  });

  it('should extend protection after progress report', () => {
    const deal = {
      status: 'INQUIRY',
      created_at: daysAgo(25),
      last_report_at: new Date()
    };
    expect(canExtendProtection(deal)).toBe(true);
  });
});
```

---

*최종 수정: 2026-02-05*
