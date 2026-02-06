---
source_id: "AIL-Implementation v1"
title: "소원놀이터 (Playground Engine) P0 구현"
owner: "@code"
date: "2026-02-06"
case_type: "CASE-A"
status: "in_progress"
summary: "Philosophy Score + Exposure/Reward Engine 연결, 철학 기반 피드 노출 시스템"
decision: |
  1. Philosophy Score (100점 만점) 기반 등급 시스템
  2. B등급 이상만 피드 노출
  3. 도움 중심 보상 (조회수 단독 보상 금지)
  4. 3층 구조 + Blessing Slot 필수
next_actions:
  - "DB 마이그레이션 실행 (014_playground_engine.sql)"
  - "server.js에 라우터 등록"
  - "프론트엔드 연동"
  - "악용 모니터링 설정"
links:
  ail: "AIL-JOB-401~407"
  events: "docs/events/playground-events.md"
tags:
  - "playground"
  - "ugc"
  - "philosophy-score"
  - "aurora5"
---

# 소원놀이터 (Playground Engine) P0 구현

## 개요

AIL-Implementation v1에 따른 UGC 시스템 구현.
"철학점수 → 노출 → 보상" 엔진 연결.

## 구현 항목

### AIL-JOB-401: DB 스키마
- `database/migrations/014_playground_engine.sql`
- 10개 테이블 + 1개 뷰 + 함수/트리거

### AIL-JOB-402: 이벤트 스키마
- `docs/events/playground-events.md`
- 8개 이벤트 정의

### AIL-JOB-403: Philosophy Score
- `services/playground/scoreService.js`
- 하드블록/변환/점수/등급 로직

### AIL-JOB-404: UGC 포맷 강제 구조
- `services/playground/artifactService.js`
- 3층 구조 + Blessing Slot 필수 검증

### AIL-JOB-405: 피드/추천
- `services/playground/feedService.js`
- rank = 0.55*score + 0.35*help + 0.10*fresh

### AIL-JOB-406: 배지/크레딧
- `services/playground/rewardService.js`
- 6개 배지 + 5개 크레딧 규칙

### AIL-JOB-407: 악용 대응
- 신고 테이블 (artifact_reports)
- 반복 C/D 등급 시 쿨다운 (TODO)

## 점수 체계

| 항목 | 배점 | 필수 |
|------|------|------|
| A 압박0 | 20 | - |
| B 존중/비낙인 | 15 | - |
| C 고통정화 | 10 | - |
| D 현실단서 | 15 | ✓ |
| E 한걸음 | 20 | ✓ |
| F 타인을 위한 한 줄 | 20 | ✓ |

## 등급별 권한

| 등급 | 공개 | 공유 | 피드 | 하이라이트 |
|------|------|------|------|-----------|
| S | ✓ | ✓ | ✓ | ✓ |
| A | ✓ | ✓ | ✓ | - |
| B | ✓ | ✓ | ✓ | - |
| C | - | 링크만 | - | - |
| D | - | - | - | - |

## 파일 구조

```
services/playground/
├── index.js
├── artifactService.js
├── scoreService.js
├── feedService.js
├── rewardService.js
└── shareService.js

routes/
└── playgroundRoutes.js

database/migrations/
└── 014_playground_engine.sql
```

## API 엔드포인트

- `POST /api/playground/artifacts` - 생성
- `GET /api/playground/artifacts/:id` - 조회
- `PATCH /api/playground/artifacts/:id` - 수정
- `GET /api/playground/feed` - 피드
- `GET /api/playground/highlights` - 하이라이트
- `POST /api/playground/shares` - 공유 생성
- `GET /api/playground/s/:slug` - 공유 조회
- `POST /api/playground/artifacts/:id/reactions` - 반응
- `GET /api/playground/users/:id/rewards` - 보상
