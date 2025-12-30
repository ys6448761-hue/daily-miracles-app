# 하루하루의 기적 - 프로젝트 컨텍스트

> 이 파일은 Claude Code가 새 세션 시작 시 자동으로 읽습니다.

## 빠른 상황 파악

**최신 상태**: `.claude/AURORA_STATUS.md` 읽기
**일일 로그**: `.claude/logs/` 폴더 확인

## 핵심 정보

| 항목 | 내용 |
|------|------|
| 서비스명 | 하루하루의 기적 (Daily Miracles) |
| CEO | 푸르미르 (이세진) |
| 기술 스택 | Node.js, Express, OpenAI, Solapi |
| 카카오 채널 | @dailymiracles |

## Aurora 5 팀

- **코미** (COO): 총괄 조율
- **재미** (CRO): 소원이 응대, RED 신호 대응
- **루미** (Analyst): 데이터 분석
- **여의보주**: 품질 검수
- **Claude Code**: 기술 구현

## 현재 구현 완료

- [x] 신호등 시스템 (RED/YELLOW/GREEN)
- [x] Solapi 연동 (SMS + 카카오 알림톡)
- [x] 기적지수 계산 (50-100점)
- [x] 소원 ACK 자동 발송

## 핵심 파일

```
routes/wishRoutes.js       - 소원실현 API + 신호등
services/solapiService.js  - 메시지 발송
config/messageTemplates.js - 메시지 템플릿
.claude/AURORA_STATUS.md   - 상세 현황판
```

## 세션 시작 시

1. "AURORA_STATUS.md 읽어봐" 로 상세 현황 파악
2. 또는 "오늘 작업 로그 확인해줘" 로 최근 진행 상황 확인

---
*마지막 업데이트: 2025-12-30*
