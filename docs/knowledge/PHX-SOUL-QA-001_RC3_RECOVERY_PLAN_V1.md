# PHX-SOUL-QA-001 — RC3 Route Skeleton 복구 가능성 조사 및 최소 복구 계획 (V1, 2026-11-19)

> 이번 단계: 조사·계획만. 서비스 코드 수정 없음, 실제 LLM 호출 없음, 운영 DB 연결 없음, push·PR·merge·배포·Hybrid 활성화 없음.
> 코드 수정은 이 계획 검토 후 Founder 별도 승인.

## Guardian Preflight Report

```
### Guardian Preflight Report

Requested Change:
  RC3 routeSkeletonService 누락 해결 가능성 조사 및 최소 복구 계획 작성 (H06·H10·H14·H19·H09 영향 분석,
  H04 모순·H10 허위 완결 발생 지점 확인). 구현 없음.

Existing Assets Found:
  services/routeSkeletonService.js — origin/staging/storybook-c7a 에만 존재 (최초 커밋 e2aab8f, 2026-09-22)
  tests/unit/routeSkeletonTests.test.js — staging 에만 존재 (보고 24/24 통과)
  정본 SOUL Evidence §19.1 "routeSkeletonService 선별 복구 계획" (daily-miracles-mvp, feat/phx-benefit-002-sowonpass-ui 체크아웃)
  Hybrid 호출부: services/soyeowoolService.js (require('./routeSkeletonService') 3곳, try/catch 감싸짐)

Repositories Inspected:
  C:\DEV\_worktrees\phx-soul-hybrid-v1 — feat/phx-soul-hybrid-v1, HEAD 5c36837
  C:\DEV\daily-miracles-mvp — 정본 Evidence (다른 브랜치 체크아웃, 읽기 전용)
  git refs: origin/staging/storybook-c7a (커밋 조회만)

Relevant Files:
  services/soyeowoolService.js (Hybrid 호출부), services/routeSkeletonService.js (staging 원본, 읽기만)
  tests/soul/*.test.js (main 계열 테스트 다수가 jest.mock으로 routeSkeletonService를 가림)

Relevant Databases:
  없음. 운영 DB·sowon DB 미접속.

Change Classification:
  조사 + 계획 (코드 변경 없음). 복구 자체는 CONNECT(기존 모듈 연결) 후보로 분류 예정 — NEW 아님.

Connection Opportunity:
  staging 원본 routeSkeletonService.js 단일 파일 복구 → 기존 Hybrid 호출부 3곳에 연결. 새 엔진 설계 없음.

Duplication Risk:
  높음 주의 — 새 Route Engine 설계 금지 (Founder 지시). 기존 staging 모듈 재사용만 허용.

Data Risk:
  낮음 — 조사 단계. 고객 개인정보 미사용. Privacy Guard 변경 없음 (금지).

Recommended Approach:
  (1) staging 원본과 Hybrid 호출부 계약(입력·출력·호출 조건) 대조
  (2) H06·H10·H14·H19·H09 질문별 경로 추적으로 routeSkeleton 호출 여부 확인
  (3) 복구 시 해결 가능 범위와 Clarify·지식 부족 범위 분리
  (4) H04 모순·H10 허위 완결의 생성 지점 코드 확인
  (5) 최소 수정 계획 작성 후 Founder 승인 대기

Questions Requiring Decision:
  Q1. 복구 후 route.days를 고객 응답에 노출할지 (정본 Product Contract상 보류 이력 있음 — Founder 결정 필요)
  Q2. 1박 2일 일정(H20)을 skeleton 범위에 포함할지 여부

Implementation Status: READY (조사·계획 문서 작성만. 코드 수정은 계획 승인 후 별도 Preflight)
```
