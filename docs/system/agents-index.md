# 에이전트 인덱스

> Aurora 5 에이전트 목록/역할/입력-출력 정리

---

## 1. 대화 처리 에이전트 (Conversation Agents)

| Agent | 위치 | 역할 | 입력 | 출력 |
|-------|------|------|------|------|
| summarizer | .claude/agents/summarizer.md | 요약 생성 | Raw 파일(들) | 정본 요약 섹션 (3~7줄) |
| decision-extractor | .claude/agents/decision-extractor.md | 결정/액션 추출 | Raw 파일(들) | 결정/액션 표 |
| knowledge-analyzer | .claude/agents/knowledge-analyzer.md | 반복 패턴/학습 | Raw + 정본 | learnings/insights |
| docs-searcher | .claude/agents/docs-searcher.md | 관련 문서 연결 | topic 키워드 | 링크 리스트 |
| feedback-analyzer | .claude/agents/feedback-analyzer.md | 사용자 피드백 분석 | 피드백 포함 Raw | 피드백 정리 |

---

## 2. 서비스 오케스트레이터

| ID | 이름 | 역할 | 상태 |
|----|------|------|------|
| FREE | free-orch | 무료 서비스 총괄 | 활성 |
| PREMIUM | premium-orch | 프리미엄 서비스 | 대기 |
| VIP | vip-orch | 소원착지 | 보류 |
| WISH | wish-voyage-orch | 소원항해 | 대기 |
| YEOSU | yeosu-orch | 여수항해 | 대기 |

---

## 3. 운영 오케스트레이터

| ID | 이름 | 역할 | 상태 |
|----|------|------|------|
| OPS | ops-orch | 운영 관리 | 활성 |
| MKT | marketing-orch | 마케팅 | 대기 |
| CS | cs-orch | 고객지원 | 대기 |

---

## 4. 서브 에이전트

| 소속 | ID | 이름 | 역할 | 입력 | 출력 |
|------|-----|------|------|------|------|
| FREE | WI | wish-intake | 소원 접수 | 소원 폼 데이터 | 소원 레코드 |
| FREE | AE | analysis-engine | 분석 엔진 | 소원 텍스트 | 기적지수/신호등 |
| FREE | IC | image-creator | 이미지 생성 | 소원 + gem_type | DALL-E 3 이미지 |
| FREE | MS | message-sender | 메시지 발송 | 수신자 + 템플릿 | Solapi 결과 |
| FREE | PG | pdf-generator | PDF 생성 | 분석 결과 | 로드맵 PDF |
| OPS | RG | risk-guardian | 리스크 파수꾼 | 메트릭스 | 이상 감지 알림 |

---

## 5. 스킬

| ID | 이름 | 역할 | 트리거 |
|----|------|------|--------|
| SC | self-checker | 자가 검증 | 작업 완료 후 |
| BP | batch-processor | 배치 처리 | 스케줄/수동 |
| PR | pipeline-runner | 파이프라인 실행 | 소원 인입 시 |
| FL | feedback-loop | 피드백 루프 | 피드백 수집 시 |
| WI | wish-image | 소원그림 생성 | 이미지 요청 시 |

---

## 6. 승격 파이프라인 실행 순서

Raw → 정본 승격 시 아래 순서로 에이전트 실행:

```
1. docs-searcher      → 관련 문서 검색
2. decision-extractor → 결정/액션 추출
3. summarizer         → 요약 생성
4. knowledge-analyzer → 인사이트 추출
5. (선택) feedback-analyzer → 피드백 처리
```

### 실행 예시

```bash
# 1. 관련 문서 검색
/docs-searcher topic="ACT자동화"

# 2. 결정/액션 추출
/decision-extractor input="raw/conversations/2025-12/파일.md"

# 3. 요약 생성
/summarizer input="raw/conversations/2025-12/파일.md"

# 4. 인사이트 추출
/knowledge-analyzer input="raw/conversations/2025-12/파일.md"
```

---

## 7. 에이전트 파일 위치

```
.claude/
├── agents/
│   ├── AGENT-INDEX.md        # 마스터 인덱스
│   ├── summarizer.md
│   ├── decision-extractor.md
│   ├── knowledge-analyzer.md
│   ├── docs-searcher.md
│   ├── feedback-analyzer.md
│   └── cs-handler.md
└── skills/
    ├── self-checker.md
    ├── wish-image.md
    └── ...
```

---

## 관련 문서

- [대화 워크플로우](./conversation-workflow.md)
- [Aurora 5 마스터 인덱스](../../.claude/agents/AGENT-INDEX.md)

---

*마지막 업데이트: 2025-12-30*
*작성: Code*
