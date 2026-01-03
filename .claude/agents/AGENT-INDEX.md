---
title: Aurora 5 에이전트 마스터 인덱스
version: 1.1.0
updated: 2026-01-02
owner: 코미
---

# Aurora 5 에이전트 시스템

## 계층 구조

```
Level 0: 코미 (전략/기획)
    ↓
Level 1: Aurora Central (총괄 오케스트레이터)
    ↓
Level 2: 분야별 오케스트레이터 (8개)
    ↓
Level 3: 서브 에이전트
```

## 오케스트레이터 목록

### 서비스 분야 (5개)
| ID | 이름 | 역할 | 상태 |
|----|------|------|------|
| FREE | free-orch | 무료 서비스 | 활성 |
| PREMIUM | premium-orch | 프리미엄 서비스 | 대기 |
| VIP | vip-orch | 소원착지 | 보류 |
| WISH | wish-voyage-orch | 소원항해 | 대기 |
| YEOSU | yeosu-orch | 여수항해 | 대기 |

### 운영 분야 (3개)
| ID | 이름 | 역할 | 상태 |
|----|------|------|------|
| OPS | ops-orch | 운영 관리 | 활성 |
| MKT | marketing-orch | 마케팅 | 대기 |
| CS | cs-orch | 고객지원 | 대기 |

## 서브 에이전트 목록

| 소속 | ID | 이름 | 역할 | 상태 |
|------|-----|------|------|------|
| FREE | WI | wish-intake | 소원 접수 | 활성 |
| FREE | AE | analysis-engine | 분석 엔진 | 활성 |
| FREE | IC | image-creator | 이미지 생성 | 활성 |
| FREE | MS | message-sender | 메시지 발송 | 활성 |
| FREE | PG | pdf-generator | PDF 생성 | 활성 |
| OPS | RG | risk-guardian | 리스크 파수꾼 | 활성 |

## 스킬 목록

| ID | 이름 | 역할 |
|----|------|------|
| SC | self-checker | 자가 검증 |
| BP | batch-processor | 배치 처리 |
| PR | pipeline-runner | 파이프라인 실행 |
| FL | feedback-loop | 피드백 루프 |
| WI | wish-image | 소원그림 생성 |

## 토론 시스템 에이전트 (NEW!)

> 내부 원탁토론 자동화 시스템 (2026-01-02 추가)

| 소속 | ID | 이름 | 역할 | 상태 |
|------|-----|------|------|------|
| OPS | CA | creative-agent | 창의적 아이디어 (루미) | 활성 |
| OPS | CR | cro-agent | 고객 관점 (재미) | 활성 |
| OPS | SG | safety-gate | 안전 검수 (여의보주) | 활성 |
| OPS | DA | data-agent | 데이터 분석 지원 | 활성 |
| OPS | CS | coo-synthesizer | 종합 및 의사결정 (코미) | 활성 |

### 토론 파이프라인

```
POST /api/debate/run
    ↓
Phase 1 (병렬): creative + cro + safety
    ↓
Phase 2: coo-synthesizer 종합
    ↓
Output: DEC 문서 + Action Items
```

### 관련 파일
- `.claude/agents/debate-system/` - 에이전트 정의
- `.claude/pipelines/debate-process.md` - 파이프라인 정의
- `scripts/debate/` - 유틸리티 스크립트
- `routes/debateRoutes.js` - API 엔드포인트

## MCP 목록

| ID | 이름 | 역할 | 상태 |
|----|------|------|------|
| AT | airtable-mcp | 데이터 CRUD | 계획 |
| KK | kakao-mcp | 메시지 발송 | 계획 |
| IM | image-mcp | 이미지 생성 | 계획 |
