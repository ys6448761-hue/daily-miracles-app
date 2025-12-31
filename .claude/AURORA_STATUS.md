# AURORA_STATUS.md
## 하루하루의 기적 - 프로젝트 현황판

**마지막 업데이트**: 2026-01-01 00:30 KST
**업데이트 담당**: Claude Code

---

## 서비스 개요

| 항목 | 내용 |
|------|------|
| **서비스명** | 하루하루의 기적 (Daily Miracles) |
| **CEO** | 푸르미르 (이세진) |
| **핵심 가치** | 소원이들의 기적 실현을 돕는 AI 기반 서비스 |
| **기술 스택** | Node.js, Express, OpenAI (DALL-E 3, GPT-4) |
| **저장소** | https://github.com/ys6448761-hue/daily-miracles-app |

---

## Aurora 5 팀 구성

| 역할 | 담당 | 주요 업무 |
|------|------|----------|
| **코미** | COO | 총괄 조율, 의사결정 문서화 |
| **재미** | CRO | 소원이 응대, 고객 관계 |
| **루미** | Data Analyst | 데이터 분석, 대시보드 |
| **여의보주** | 품질 검수 | 콘텐츠 품질 최종 검수 |
| **Claude Code** | 기술 구현 | 코드 작성, API 개발 |

---

## 현재 상태 요약

```
🟢 운영 중: MVP 서비스 (소원 등록, 문제 해결, 소원실현)
🟢 완료: P0 작업 (소원그림 광고 준비)
🟢 완료: P2 작업 (신호등 시스템 + Solapi 연동)
🟢 완료: Aurora 5 UBOS 시스템 정의
🟢 완료: WishMaker Hub MCP 서버 구축
🟡 진행 중: P1 작업 (Airtable 연동)
⚪ 대기: P3 작업 (Aurora 5 에이전트 고도화)
```

---

## 최근 완료 작업

### 2026-01-01: Aurora 5 UBOS & WishMaker Hub MCP

| 작업 | 상태 | 산출물 |
|------|------|--------|
| Aurora 5 UBOS 6대 시스템 정의 | ✅ | `AURORA5_UNIVERSE_BEST_SYSTEM.md` |
| WishMaker Hub MCP 서버 구축 | ✅ | `mcp-servers/wishmaker-hub-mcp/` |
| 시스템 상태 보고서 생성 | ✅ | `SYSTEM_STATUS_REPORT.md` |
| /api/wishes 404 오류 수정 | ✅ | `services/solapiService.js` 문법 오류 해결 |
| 3종 필수 로그 추가 | ✅ | correlationId 기반 발송 추적 |
| OutboundMessage 레코드 저장소 | ✅ | `services/outboundMessageStore.js` |

### WishMaker Hub MCP 도구 (14종)

```
1. classify_traffic_light     - 신호등 분류
2. track_signup_funnel        - 퍼널 추적
3. get_stuck_users            - 멈춘 소원이 조회
4. send_recovery_message      - 복구 메시지
5. get_message_schedule       - 7일 스케줄
6. check_message_health       - 발송 건강도
7. analyze_message_engagement - 참여도 분석
8. predict_satisfaction       - 만족도 예측
9. detect_churn_risk          - 이탈 위험 감지
10. generate_intervention_plan - 개입 계획
11. identify_conversion_ready  - 전환 준비 식별
12. suggest_conversion_timing  - 전환 타이밍
13. get_daily_metrics         - 일일 메트릭스
14. get_traffic_light_summary - 신호등 현황
```

---

### DEC-2025-1230-002: 소원그림 인스타 광고 (조건부 승인)

| 작업 | 상태 | 산출물 |
|------|------|--------|
| GitHub 문서 저장 (6개) | ✅ | `docs/decisions/`, `docs/execution/`, `docs/system/` |
| 샘플 소원그림 3종 생성 | ✅ | `public/images/wishes/wish_*_ruby/emerald/sapphire.png` |
| 워터마크 삽입 기능 | ✅ | `POST /api/wish-image/watermark` |

### 생성된 API 엔드포인트

```
POST /api/wish-image/generate           - DALL-E 3 소원그림 생성
POST /api/wish-image/watermark          - 기존 이미지에 워터마크
POST /api/wish-image/generate-with-watermark  - 생성+워터마크 (광고용)
GET  /api/wish-image/status             - OpenAI API 상태
GET  /api/wish-image/list               - 저장된 이미지 목록
```

---

## 진행 중 / 다음 할 일

### P1 (이번 주)

| 작업 | 담당 | 상태 |
|------|------|------|
| Airtable Wishes Inbox 테이블 생성 | 루미 | ⬜ |
| WishRouter 에이전트 기본 구현 | Code | ⬜ |
| 인입 채널 → Airtable 웹훅 연동 | Code | ⬜ |

### P2 (완료! 🎉)

| 작업 | 담당 | 상태 |
|------|------|------|
| 신호등 시스템 (RED/YELLOW/GREEN 자동 분류) | Code | ✅ |
| Solapi 연동 (SMS + 카카오 알림톡) | Code | ✅ |
| 소원 ACK 메시지 자동 발송 | Code | ✅ |
| 기적지수 계산 (50-100점 동적 산출) | Code | ✅ |
| 소원그림 문구 시스템 구현 | Code | ⬜ |

### P3 (에이전틱 워크플로우 고도화)

| 작업 | 담당 | 상태 |
|------|------|------|
| Aurora 5 서브에이전트 자동화 | Code | ⬜ |
| wish-journey 파이프라인 신호등 연동 | Code | 🔄 |
| 배치 처리 시스템 구현 | Code | ⬜ |

---

## 핵심 결정 문서

| 문서번호 | 제목 | 상태 |
|----------|------|------|
| DEC-2025-1230-001 | 소원그림 문구 시스템 | 승인 |
| DEC-2025-1230-002 | 소원그림 인스타 광고 | 조건부 승인 |
| DEC-2025-1230-003 | 소원이 실시간 대응 시스템 | 승인 |

---

## 핵심 파일 위치

### 코드
```
routes/wishRoutes.js            - 소원실현 API (신호등 + 기적지수)
routes/wishImageRoutes.js       - 소원그림 API (DALL-E 3 + 워터마크)
services/solapiService.js       - Solapi 연동 (SMS + 카카오 알림톡)
services/outboundMessageStore.js - 발송 레코드 저장소
config/messageTemplates.js      - ACK/RED Alert 메시지 템플릿
server.js                       - 메인 서버
.claude/agents/                 - Aurora 5 에이전트 정의
.claude/skills/                 - 자동화 스킬
```

### MCP 서버 (5종)
```
mcp-servers/miracle-mcp/        - 기적 분석 서비스
mcp-servers/summarizer-mcp/     - 요약 서비스
mcp-servers/storybook-mcp/      - 스토리북 서비스
mcp-servers/wish-image-mcp/     - 소원그림 서비스
mcp-servers/wishmaker-hub-mcp/  - 소원이 통합 관리 (NEW!)
```

### 문서
```
docs/decisions/               - 의사결정 문서
docs/execution/               - 실행 패키지
docs/system/                  - 시스템 설계서
docs/LAUNCH-DECLARATION.md    - 출항 선언문
```

### 이미지
```
public/images/wishes/         - 소원그림 저장소
  - wish_*_ruby.png           - Ruby 테마 원본
  - wish_*_emerald.png        - Emerald 테마 원본
  - wish_*_sapphire.png       - Sapphire 테마 원본
  - wish_watermarked_*.png    - 워터마크 적용 (광고용)
```

---

## 빠른 시작 가이드

### 서버 실행
```bash
cd daily-miracles-mvp
npm install
npm start
# 또는 특정 포트로
PORT=5100 node server.js
```

### 소원그림 생성 테스트
```bash
curl -X POST http://localhost:5100/api/wish-image/generate \
  -H "Content-Type: application/json" \
  -d '{"wish_content": "새로운 도전을 향해", "gem_type": "ruby"}'
```

### 워터마크 추가
```bash
curl -X POST http://localhost:5100/api/wish-image/watermark \
  -H "Content-Type: application/json" \
  -d '{"image_path": "/images/wishes/wish_xxx.png"}'
```

---

## 블로커 / 주의사항

| 항목 | 상태 | 설명 |
|------|------|------|
| OpenAI API Key | ✅ | 환경변수 설정 필요 |
| DALL-E 3 Rate Limit | ⚠️ | 분당 5회 제한 주의 |
| 이미지 URL 만료 | ✅ 해결 | 로컬 저장으로 영구화 완료 |

---

## 연락처

- **기술 이슈**: Claude Code (이 창에서)
- **운영 이슈**: 코미 (COO)
- **의사결정**: 푸르미르 (CEO)

---

## 업데이트 이력

| 날짜 | 담당 | 내용 |
|------|------|------|
| 2026-01-01 00:30 | Code | Aurora 5 UBOS + WishMaker Hub MCP 서버 추가 |
| 2025-12-31 22:30 | Code | 시스템 상태 보고서, /api/wishes 404 수정 |
| 2025-12-30 07:15 | Code | 최초 생성 (P0 완료 반영) |

---

*이 문서는 새 작업 세션 시작 시 "AURORA_STATUS.md 읽어봐"로 즉시 상황 파악 가능*
