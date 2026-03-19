# DreamTown React Architecture (sowon-dreamtown)

Version: v1.0
Created: 2026-03-16
Purpose: DreamTown Code Architect GPT — Next.js 프론트엔드 구조 가이드

---

## 기술 스택

| 항목 | 버전 | 역할 |
|------|------|------|
| Next.js | 16.1.6 | App Router 프레임워크 |
| React | 19.2.3 | UI 라이브러리 |
| TypeScript | ^5 | 타입 안전성 |
| Tailwind CSS | ^4 | 스타일링 |
| Prisma | 6.19.2 | ORM (PostgreSQL) |
| NextAuth | 5.0.0-beta.30 | 인증 |
| Recharts | ^3.7.0 | 차트 |
| date-fns-tz | ^3.2.0 | 시간대 처리 (KST) |
| node-cron | ^4.2.1 | 크론 작업 |
| Resend | ^6.9.3 | 이메일 발송 |

**Node.js**: 20.11.1 (Prisma 7.x 미지원 → Prisma 6.x 사용)

---

## 디렉토리 구조

```
sowon-dreamtown/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   ├── page.tsx            # 홈 (/)
│   │   │
│   │   ├── plaza/
│   │   │   ├── page.tsx        # 광장 메인 (/plaza)
│   │   │   └── new/
│   │   │       └── page.tsx    # 글쓰기 (/plaza/new)
│   │   │
│   │   ├── my/
│   │   │   └── posts/
│   │   │       └── page.tsx    # 내 글 (/my/posts)
│   │   │
│   │   ├── events/
│   │   │   └── page.tsx        # 이벤트 (/events)
│   │   │
│   │   ├── admin/
│   │   │   ├── page.tsx        # 관리자 대시보드
│   │   │   ├── lumi-gate/
│   │   │   │   └── page.tsx    # Lumi 게이트
│   │   │   ├── metrics/
│   │   │   │   └── page.tsx    # 메트릭
│   │   │   └── posts/
│   │   │       └── page.tsx    # 게시글 관리
│   │   │
│   │   └── api/               # API 라우트
│   │       ├── auth/[...nextauth]/
│   │       ├── ai/
│   │       ├── event/
│   │       │   └── [id]/join/
│   │       ├── like/
│   │       ├── me/
│   │       │   ├── checkin/
│   │       │   └── temperature/
│   │       ├── plaza/
│   │       │   ├── curation/today/
│   │       │   ├── event/
│   │       │   ├── showcase/
│   │       │   └── wish/[wishId]/
│   │       ├── post/
│   │       ├── retention/
│   │       └── admin/
│   │           ├── posts/
│   │           │   └── [id]/logs/
│   │           ├── schedules/
│   │           │   └── [id]/
│   │           │       └── test-notification/
│   │           ├── events/
│   │           ├── kpi/
│   │           └── metrics/
│   │
│   ├── components/             # 공통 컴포넌트
│   │   ├── Header.tsx
│   │   ├── MiracleShareButton.tsx
│   │   └── Providers.tsx       # Context 래퍼
│   │
│   ├── lib/                    # 서버 사이드 유틸리티
│   │   ├── prisma.ts           # Prisma 싱글톤
│   │   ├── auth.ts             # NextAuth 설정
│   │   ├── kst.ts              # KST 시간대 변환
│   │   ├── sanitize.ts         # 입력 정제
│   │   ├── slack.ts            # Slack 알림
│   │   ├── email.ts            # 이메일 (Resend)
│   │   ├── activity.ts         # 활동 추적
│   │   ├── admin.ts            # 관리자 유틸
│   │   ├── summarize.ts        # AI 요약
│   │   ├── lazy-archive.ts     # 아카이브
│   │   ├── redirect-templates.ts # 리다이렉트 템플릿
│   │   └── worker/
│   │       ├── index.ts        # 워커 진입점
│   │       ├── notificationWorker.ts  # 알림 발송
│   │       ├── digestSetupWorker.ts   # 다이제스트 설정
│   │       └── reaperWorker.ts        # 만료 정리
│   │
│   └── generated/prisma/      # Prisma 클라이언트 (자동 생성)
│
├── prisma/
│   ├── schema.prisma           # DB 스키마
│   └── migrations/             # 마이그레이션 이력
│
└── public/                     # 정적 에셋
```

---

## 핵심 패턴

### 1. Server Component 우선
App Router의 기본 — 데이터 패칭은 Server Component에서.
클라이언트 상태(`useState`, `useEffect`)가 필요한 경우만 `"use client"` 선언.

### 2. Prisma 싱글톤
```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 3. KST 날짜 처리
모든 날짜 기반 기능은 `src/lib/kst.ts` 경유.
`DailyCuration.dateKst`는 `"YYYY-MM-DD"` 포맷 (KST 기준).

### 4. Outbox 패턴 (알림)
```
Schedule 생성
  → NotificationJob INSERT (status: PENDING)
  → notificationWorker.ts 폴링
  → 발송 성공 → status: SENT
  → 발송 실패 → retryCount++ → FAILED → DEAD
```

### 5. NextAuth 세션
```typescript
// API 라우트에서 세션 검증
import { auth } from '@/lib/auth'
const session = await auth()
if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
```

---

## 페이지별 주요 기능

| 페이지 | 경로 | 핵심 기능 |
|--------|------|----------|
| 홈 | `/` | 진입점, 광장/이벤트 링크 |
| 광장 | `/plaza` | 게시글 피드, 좋아요, 큐레이션 |
| 글쓰기 | `/plaza/new` | 텍스트/소원/필름 타입 게시글 작성 |
| 내 글 | `/my/posts` | 내가 쓴 글 목록 |
| 이벤트 | `/events` | 이벤트 목록 및 참가 |
| 관리자 | `/admin` | 게시글/이벤트/스케줄/메트릭 관리 |

---

## 스타일링 규칙

- **Tailwind CSS v4** 사용
- 브랜드 컬러는 CSS 변수 또는 inline 클래스로 적용
  - Primary: `#9B87F5`
  - Secondary: `#F5A7C6`
- 모바일 우선 (mobile-first) 반응형 설계

---

## 개발 명령어

```bash
npm run dev     # 개발 서버 (http://localhost:3000)
npm run build   # 프로덕션 빌드
npm run lint    # 린트 검사
npx prisma migrate dev --name desc  # DB 마이그레이션
npx prisma studio                    # DB GUI
```

---

## dreamtown-frontend (legacy)

`daily-miracles-mvp/dreamtown-frontend/` 폴더에 별도 React (Vite) 앱 존재.
이 앱은 DreamTown 초기 프로토타입으로, **sowon-dreamtown이 공식 프론트엔드**.
StarBirth.jsx에 자동 이동 useEffect 포함 (별 탄생 → 3초 후 /my-star/:id 이동).
