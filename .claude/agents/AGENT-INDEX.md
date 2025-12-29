---
title: Aurora 5 에이전트 마스터 인덱스
version: 1.0.0
updated: 2025-12-29
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

## MCP 목록

| ID | 이름 | 역할 | 상태 |
|----|------|------|------|
| AT | airtable-mcp | 데이터 CRUD | 계획 |
| KK | kakao-mcp | 메시지 발송 | 계획 |
| IM | image-mcp | 이미지 생성 | 계획 |
