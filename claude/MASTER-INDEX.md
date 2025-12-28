---
name: 하루하루의 기적 - 에이전틱 워크플로우 마스터 인덱스
version: 1.2.0
last_updated: 2025-12-29
owner: 푸르미르 (CEO)
operator: 코미 (Chief Operating AI Manager)
---

# 마스터 인덱스

> 하루하루의 기적 서비스의 전체 에이전틱 워크플로우를 관리하는 중앙 인덱스입니다.
> 모든 구성요소의 위치, 상태, 의존성을 한눈에 파악할 수 있습니다.

---

## 1. 에이전트 목록 (claude/agents/)

| 파일명 | 역할 | 모델 | 상태 | 의존성 |
|--------|------|------|------|--------|
| `summarizer.md` | 대화/문서 요약 | sonnet | active | - |
| `decision-extractor.md` | 결정 사항 추출 | haiku | active | - |
| `action-extractor.md` | Action Items 추출 | haiku | active | - |
| `skill-creator.md` | 에이전트/스킬 자동 생성 | opus | active | glob, grep |
| `cs-handler.md` | 고객 문의 분류/응답 | haiku | active | - |
| `feedback-analyzer.md` | 피드백 분석/개선점 도출 | sonnet | active | - |
| `docs-searcher.md` | 문서 검색 | haiku | active | glob, grep |
| `knowledge-analyzer.md` | 지식 분석/인사이트 도출 | sonnet | active | glob, grep |
| `context-builder.md` | 컨텍스트 빌드 | haiku | active | glob, grep |

**총 9개 에이전트**

---

## 2. 스킬 목록 (claude/skills/)

### 온라인 서비스 (5개)

| 파일명 | 서비스명 | 유형 | 가격 |
|--------|----------|------|------|
| `miracle-analysis.md` | 12질문 기적지수 분석 | 분석 | 무료 |
| `wish-exchange.md` | 소원교환소 | 체험 | 무료 |
| `wish-voyage.md` | 소원항해 (온라인) | 체험 | 무료 |
| `problem-solving.md` | 문제해결탁구 | 상담 | 문의 |
| `wish-realization.md` | 소원이루기 | 코칭 | 문의 |

### 여수 여행 상품 (5개)

| 파일명 | 서비스명 | 유형 | 가격 |
|--------|----------|------|------|
| `yeosu-voyage-personal.md` | 소원항해 개인 | 오프라인 | 39,000원 |
| `yeosu-voyage-group.md` | 소원항해 단체 | 오프라인 | 문의 |
| `yeosu-3combo-pass.md` | 여수 3콤보 | 패키지 | 49,000원 |
| `wish-voyage-team.md` | 소원항해 팀빌딩 | 기업 | 문의 |
| `yeosu-tour-pass.md` | 여수여행패스 | 패키지 | 59,000원 |

### 콘텐츠 생성 (2개)

| 파일명 | 서비스명 | 유형 | 가격 |
|--------|----------|------|------|
| `online-wish-continue.md` | 온라인 소원이어가기 | 콘텐츠 | 무료/유료 |
| `miracle-video.md` | 기적영상 | 영상 | 무료/유료 |

### 지식 관리 (2개)

| 파일명 | 서비스명 | 유형 | 상태 |
|--------|----------|------|------|
| `knowledge-retrieval.md` | 지식 검색 | knowledge | active |
| `weekly-insight.md` | 주간 인사이트 | knowledge | active |

**총 14개 스킬**

---

## 3. 파이프라인 목록 (claude/pipelines/)

| 파일명 | 역할 | 트리거 | 상태 |
|--------|------|--------|------|
| `wish-analysis-flow.md` | 소원 분석 전체 흐름 | user_inquiry | active |
| `daily-operation.md` | 일일 운영 자동화 | cron (06:00) | active |
| `weekly-summary.md` | 주간 요약 생성 | cron (월요일) | active |

**총 3개 파이프라인**

---

## 4. MCP 서버 목록 (mcp-servers/)

| 폴더명 | 역할 | 도구 수 | 상태 |
|--------|------|---------|------|
| `summarizer-mcp/` | 요약 도구 | 5개 | active |
| `miracle-mcp/` | 기적지수 분석 | 5개 | active |
| `storybook-mcp/` | 스토리북 생성 | 12개 | active |
| `wish-image-mcp/` | 소원그림 생성 | 5개 | planning |

**총 4개 MCP 서버, 27개 도구**

---

## 5. 프롬프트 템플릿 목록 (prompts/)

### 분석 (analysis/)

| 파일명 | 용도 | 주요 변수 |
|--------|------|----------|
| `miracle-index.md` | 기적지수 산출 | name, wish, answers |
| `problem-solving.md` | 문제 분석 | name, problem, context |

### 콘텐츠 (content/)

| 파일명 | 용도 | 주요 변수 |
|--------|------|----------|
| `storybook.md` | 스토리북 생성 | name, age, personality, style |
| `wish-image.md` | 소원그림 생성 | name, wish, style |
| `video-generation.md` | 영상 스크립트 | storybook_id, duration |
| `message-morning.md` | 아침 응원 메시지 | name, wish, day |
| `message-evening.md` | 저녁 응원 메시지 | name, wish, day |

### 마케팅 (marketing/)

| 파일명 | 용도 | 주요 변수 |
|--------|------|----------|
| `sns-post.md` | SNS 게시물 | platform, content_type |
| `email-campaign.md` | 이메일 마케팅 | campaign_type, recipient_segment |

### 요약 (summary/)

| 파일명 | 용도 | 주요 변수 |
|--------|------|----------|
| `weekly.md` | 주간 요약 | week_start, week_end |

**총 10개 프롬프트 템플릿**

---

## 6. 스크립트 목록 (scripts/)

| 파일명 | 역할 | 실행 방법 |
|--------|------|----------|
| `extract-user-data.ts` | 소원이 데이터 추출 | `npx ts-node scripts/extract-user-data.ts` |
| `send-messages-batch.ts` | 메시지 일괄 발송 | `npx ts-node scripts/send-messages-batch.ts` |
| `backup-database.ts` | DB 백업 | `npx ts-node scripts/backup-database.ts` |
| `run-pipeline.ts` | 파이프라인 실행 | `npx ts-node scripts/run-pipeline.ts` |

**총 4개 스크립트**

---

## 7. 피드백 시스템 (claude/feedback/)

| 파일명 | 역할 |
|--------|------|
| `README.md` | 피드백 기록 가이드 |
| `agents-feedback.md` | 에이전트별 피드백 |
| `skills-feedback.md` | 스킬별 피드백 |
| `mcp-feedback.md` | MCP 도구별 피드백 |
| `improvement-log.md` | 개선 이력 타임라인 |

---

## 8. 참조 문서 (claude/references/)

| 파일명 | 역할 | 출처 |
|--------|------|------|
| `CONTEXT-MANAGEMENT.md` | 컨텍스트 관리 지침 | 최수민님 방식 |
| `SELF-VALIDATION.md` | 자가 검증 시스템 | 최수민님 방식 |
| `README.md` | 참조 문서 가이드 | - |

---

## 9. 문서 저장소 (docs/)

| 폴더 | 용도 | 예시 |
|------|------|------|
| `conversations/` | 대화 기록 | 일별 대화 요약, 중요 결정 |
| `learnings/` | 학습 내용 | 새로 배운 개념, 방법론 |
| `cheatsheets/` | 치트시트 | 빠른 참조용 요약 |
| `decisions/` | 의사결정 | 중요 결정과 근거 |
| `insights/` | 인사이트 | 주간/월간 인사이트 |

### 현재 저장된 문서

| 파일 | 유형 | 작성일 |
|------|------|--------|
| `conversations/2025-12/2025-12-29_최수민방식적용.md` | 대화 기록 | 2025-12-29 |
| `learnings/최수민방식_완전정리.md` | 학습 내용 | 2025-12-29 |
| `cheatsheets/최수민방식_치트시트.md` | 치트시트 | 2025-12-29 |

---

## 10. 전체 통계

| 구분 | 개수 |
|------|------|
| 에이전트 | 9개 |
| 스킬 | 14개 |
| 파이프라인 | 3개 |
| MCP 서버 | 4개 |
| MCP 도구 | 27개 |
| 프롬프트 | 10개 |
| 스크립트 | 4개 |
| 참조 문서 | 3개 |
| 저장된 문서 | 3개 |
| **총계** | **77개 구성요소** |

---

## 11. TODO

### 즉시 실행 (P0)
- [ ] 도그푸딩 - 푸르미르님 직접 사용 테스트
- [ ] 소원그림 MCP 실제 DALL-E 연동
- [ ] 카카오 알림톡 템플릿 등록

### 단기 (P1)
- [ ] 기적영상 FFmpeg 연동
- [ ] 일일 스케줄러 GitHub Actions 활성화
- [ ] 모니터링 대시보드 구축

### 중기 (P2)
- [ ] 모바일 앱 기획
- [ ] A/B 테스트 파이프라인
- [ ] 다국어 지원 (영어/일본어)

---

## 12. 버전 히스토리

| 버전 | 날짜 | 변경내용 | 작성자 |
|------|------|----------|--------|
| 1.0.0 | 2025-12-29 | 초기 구축 - 전체 에이전틱 워크플로우 완성 | 코미 |
| 1.1.0 | 2025-12-29 | 최수민님 방식 적용 - 자가검증, 컨텍스트관리, TODO 추가 | 코미 |
| 1.2.0 | 2025-12-29 | 지식 관리 시스템 추가 - docs/, 지식 에이전트 3개, 스킬 2개 | 코미 |

---

## 13. 빠른 참조

### 자주 사용하는 명령어

```bash
# 기적지수 분석 실행
@miracle-analyzer 분석해줘

# 스토리북 생성
@storybook-mcp create_storybook

# 일일 메시지 발송
npx ts-node scripts/send-messages-batch.ts --type=morning

# DB 백업
npx ts-node scripts/backup-database.ts --compress
```

### 스타일 시스템

| 스타일 | 설명 | 가격 |
|--------|------|------|
| `miracle_fusion` | 지브리+수채화+만화 | 무료 |
| `miracle_ghibli` | 지브리 스타일 | 유료 |
| `miracle_korean` | 한국 웹툰 스타일 | 유료 |

---

*마지막 업데이트: 2025-12-29*
