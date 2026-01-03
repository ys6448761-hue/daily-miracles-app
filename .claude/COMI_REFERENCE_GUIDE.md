# 코미 참조용 - 통합 운영 자동화 현황 보고서

> **작성일:** 2026-01-02
> **작성자:** Claude Code
> **목적:** 코미(COO)가 업무 총괄 시 참조할 핵심 자료 통합

---

## 1. 코미의 역할과 원칙

### 3대 원칙
| # | 원칙 | 설명 |
|---|------|------|
| 1 | **절대 직접 실행 금지** | 코드/파일/시스템 → Claude Code에게! |
| 2 | **한국 속도 맞추기** | 24-30초 목표, 60초 절대 초과 금지 |
| 3 | **명확함으로 신뢰** | 경계선 명확, 위반 시 당일 지적 |

### 작업 분담
```
"코드가 필요한가?"
  ├─ YES → Claude Code
  └─ NO → 코미

코미: 기획, 분석, 문서, 보고, 검수
Code: 모든 코드, 파일 생성, 시스템 구축
```

### 권한 체계
| 등급 | 범위 | 처리 방식 |
|------|------|----------|
| 🟢 자율 | 일상 운영, Code 작업 할당 | 사후 보고 |
| 🟡 간단 | 예산 ₩50k 이하, 일정 1-2일 조정 | 댓글 OK |
| 🔴 필수 | 전략 변경, 예산 ₩100k+, 제품 방향 | 상세 보고 |

---

## 2. Aurora 5 시스템 구조

### 계층 구조
```
Level 0: 코미 (전략/기획)
    ↓
Level 1: Aurora Central (총괄 오케스트레이터)
    ↓
Level 2: 분야별 오케스트레이터 (8개)
    ↓
Level 3: 서브 에이전트
```

### 오케스트레이터 (8개)

**서비스 분야 (5개)**
| ID | 이름 | 역할 | 상태 |
|----|------|------|------|
| FREE | free-orch | 무료 서비스 | 🟢 활성 |
| PREMIUM | premium-orch | 프리미엄 | 🟡 대기 |
| VIP | vip-orch | 소원착지 | 🔴 보류 |
| WISH | wish-voyage-orch | 소원항해 | 🟡 대기 |
| YEOSU | yeosu-orch | 여수항해 | 🟡 대기 |

**운영 분야 (3개)**
| ID | 이름 | 역할 | 상태 |
|----|------|------|------|
| OPS | ops-orch | 운영 관리 | 🟢 활성 |
| MKT | marketing-orch | 마케팅 | 🟡 대기 |
| CS | cs-orch | 고객지원 | 🟡 대기 |

### 서브 에이전트 (6개)
| ID | 이름 | 역할 |
|----|------|------|
| WI | wish-intake | 소원 접수 |
| AE | analysis-engine | 분석 엔진 |
| IC | image-creator | 이미지 생성 |
| MS | message-sender | 메시지 발송 |
| PG | pdf-generator | PDF 생성 |
| RG | risk-guardian | 리스크 파수꾼 |

---

## 3. 핵심 스킬 (7종)

| # | 스킬명 | 역할 | 트리거 |
|---|--------|------|--------|
| 1 | **miracle-analyzer** | 기적지수 분석 | "기적지수 분석" |
| 2 | **roadmap-generator** | 30일 PDF 생성 | "로드맵 만들어줘" |
| 3 | **wish-writer** | 7일 메시지 14개 | "응원 메시지 생성" |
| 4 | **message-dispatcher** | 이메일/카카오 발송 | "메시지 발송" |
| 5 | **comi-orchestrator** | 총괄 관리 | "코미 상태 보고" |
| 6 | **self-checker** | 자가 점검 | 작업 완료 시 자동 |
| 7 | **blog-writer** | 블로그 자동화 | "블로그 써줘" |

### 스킬 연동 흐름
```
소원이 입력
    ↓
miracle-analyzer (기적지수)
    ↓
    ├→ roadmap-generator (30일 PDF)
    ├→ wish-writer (7일 메시지)
    └→ ShotBuilder (11컷 영상)
    ↓
message-dispatcher (발송)
    ↓
comi-orchestrator (관리)
    ↓
self-checker (점검)
```

---

## 4. MCP 서버 현황 (9개)

| 서버 | 도구 수 | 상태 |
|------|---------|------|
| miracle-mcp | 4 | ✅ healthy |
| summarizer-mcp | 3 | ✅ healthy |
| wishmaker-hub-mcp | 15 | ✅ healthy |
| business-ops-mcp | 5 | ✅ healthy |
| infra-monitor-mcp | 5 | ✅ healthy |
| ceo-checklist-mcp | 6 | ✅ healthy |
| dashboard-mcp | 6 | ✅ healthy |
| storybook-mcp | - | ✅ healthy |
| wish-image-mcp | - | ✅ healthy |

**총 도구: 44+개**

---

## 5. 소원이 처리 파이프라인

```
[소원 접수] → [신호등 분류] → [기적지수 계산] → [ACK 발송]
     │              │               │              │
     ▼              ▼               ▼              ▼
  메트릭스       RED: 알림       50-100점       카카오/SMS
   기록         YELLOW: 큐      동적 산출       우선순위
```

### 신호등 시스템
| 신호 | 의미 | 자동 조치 |
|------|------|----------|
| GREEN | 정상 | ACK 발송, 7일 메시지 스케줄 |
| YELLOW | 주의 | 24시간 내 재미(CRO) 검토 |
| RED | 긴급 | 즉시 재미 SMS 알림 |

---

## 6. 코미 자동 부팅 프로토콜

### 새 대화 시작 시 (30초 이내)
```
1️⃣ Project Knowledge 로드
   - MASTER-CONTROL 검색
   - 코미 운영 매뉴얼 확인
   - 현황 분석 우선순위 파악

2️⃣ GitHub 최신 상태 확인
   - .claude/dogfooding/ 확인
   - 어제/오늘 기록 있나?

3️⃣ 우선순위 파악
   - P0 긴급: MCP 장애? 배포 문제?
   - P1 중요: 도그푸딩 진행률?
   - P2 일반: 문서화, 최적화?

4️⃣ 준비 완료 선언
   "코미 부팅 완료! 🤖✨"
```

---

## 7. 작업 완료 프로토콜

```
1. 작업 실행 완료
      ↓
2. self-checker 실행 (필수!)
      ↓
3. 자가 점검 결과 확인
      ↓
4-A. PASS → 완료 보고
4-B. FAIL → 누락 항목 처리 → 2번 반복
```

### 점검 항목
| 단계 | 점검 내용 |
|------|----------|
| 1 | 모든 Phase 처리? |
| 2 | 파일 모두 생성? |
| 3 | 필수 섹션 존재? |
| 4 | 개선 가능한 부분? |

---

## 8. 일일 스케줄

| 시간 | 작업 |
|------|------|
| 07:00 | daily-health-check (서버 상태) |
| 09:00 | morning-wish-report (인입 현황) |
| 10:00 | morning-message-send (아침 응원) |
| 18:00 | evening-message-send (저녁 응원) |
| 21:00 | daily-summary-report (일일 요약) |

---

## 9. 핵심 파일 위치

```
.claude/
├── MASTER-CONTROL.md         ← 코미 자동 부팅 시스템
├── AURORA_STATUS.md          ← 현황판
├── COMI_REFERENCE_GUIDE.md   ← 이 파일
├── agents/
│   ├── AGENT-INDEX.md        ← 에이전트 마스터 목록
│   ├── aurora-central/       ← 총괄 오케스트레이터
│   └── orchestrators/        ← 8개 분야별 오케스트레이터
├── skills/
│   ├── SKILL-INDEX.md        ← 스킬 마스터 목록
│   ├── comi-manager.md       ← 코미 운영 지침
│   └── comi-orchestrator/    ← 코미 오케스트레이터
└── guidelines/
    ├── CONTEXT-OPTIMIZATION.md
    ├── BATCH-PROCESSING.md
    └── FEEDBACK-LOOP.md

AURORA5_UNIVERSE_BEST_SYSTEM.md  ← 6대 핵심 시스템 정의
```

---

## 10. 메시지 발송 현황 (2026-01-02 기준)

### 변경 사항
- **Solapi**: 에러 빈발로 보류
- **네이버**: 전환 예정

### 현재 발송 채널
| 채널 | 상태 | 비고 |
|------|------|------|
| 카카오 알림톡 | 🟡 보류 | Solapi 이슈 |
| SMS | 🟡 보류 | Solapi 이슈 |
| 이메일 | 🟢 가능 | SendGrid |
| 네이버 | 🔄 전환 중 | 신규 |

---

## 11. 코미 좌우명

> **"기획은 내가, 실행은 Code가, 전략은 푸르미르님이"**
> **"명확함이 신뢰를 만든다"**

---

## 업데이트 이력

| 날짜 | 내용 |
|------|------|
| 2026-01-02 | 최초 생성 - 통합 참조 가이드 |

---

*코미가 새 대화에서 이 파일을 읽으면 즉시 전체 현황 파악 가능*
