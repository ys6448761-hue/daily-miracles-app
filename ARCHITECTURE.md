# Architecture

> 시스템 아키텍처 빠른 참조

## 기술 스택

| 계층 | 기술 |
|------|------|
| Runtime | Node.js 20.x + Express |
| DB | PostgreSQL (Render) |
| AI | OpenAI GPT-4 / DALL-E 3 |
| Messaging | Naver Cloud SENS (알림톡 + SMS) |
| Hosting | Render.com |

## 핵심 구조

```
server.js (엔트리)
├── middleware/gateMiddleware.js   ← Open Gate
├── routes/ (50개)                ← API 라우트
├── services/ (100개+)            ← 비즈니스 로직
├── database/migrations/ (23개)   ← SQL 마이그레이션
├── prisma/schema.prisma          ← Read-only layer (Option C)
└── public/                       ← 정적 프론트엔드
```

## 발송 플로우

```
ACK    → 알림톡(betawelcome) → SMS fallback
Track  → SMS 전용
RED    → SMS 즉시 (관리자)
```

## 상세

→ [docs/03-tech/architecture.md](docs/03-tech/architecture.md)

---

*최종 업데이트: 2026-02-26*
