---
Document: TODO-StoryBook_Refactor
Based On: REPORT-StoryBook_Code_Analysis.md, SSOT-ENGINE-001_DreamTown_Story_Engine_Draft.md
Date: 2026-07-09
Status: Draft — 우선순위/일정은 대표 확인 후 확정
---

# TODO — StoryBook Refactor

## 즉시 수정할 것 (버그·데이터 무결성)

1. `services/emailService.js`에 `sendStorybookDelivery`, `sendRevisionComplete`가 실제로 export되지 않아 배송/리비전 완료 알림이 항상 mock으로 빠짐 — export 추가 또는 호출부 수정.
2. `storybook_shares` 테이블 마이그레이션이 존재하지 않음 — 마이그레이션 파일 추가하거나, 해당 기능(공유 링크 DB 영속화)을 명시적으로 폐기.
3. `database/storybook_schema.sql`과 `routes/storybookRoutes.js:1622-1732`의 인라인 스키마가 중복 정의됨 — 하나로 통합(마이그레이션 파일 기준으로).
4. `storybookQueue.js`의 `getOrder()`가 DB-less 메모리 모드에서 `storybookRoutes.js`의 별도 메모리 스토어에 접근 못 해 항상 `ORDER_NOT_FOUND`로 실패 — 스토어 공유 구조로 수정하거나 메모리 모드 지원 범위를 명시.

## 유지할 것 (그대로 재사용)

1. `dreamtown-wishart`의 4-Act 구조(`ssot_visual.py`) — 1P/2P/3P/4P 정의, V4와 부합.
2. `check_reveal_rule()` — 별/별씨앗/별공방 3P 이전 등장 금지 검증 로직.
3. `IDENTITY_MANDATORY`/`AGE_MANDATORY` 블록과 이미지-투-이미지 Identity Lock 파이프라인.
4. `judge_release()`의 Q1(동일인물)/Q9(미래예언 금지) QC 게이트.
5. 감정→장소→보석 매핑 테이블(`WISH_ENGINE`, `LOCATION_MAP`, `EMOTION_ALIASES`).
6. System B(포스트카드→스토리북)의 실제 동작하는 슬라이드 저장/조회/공유 API 자체(단, 슬라이드 조립 로직은 4P 구조로 교체 대상).
7. `assemble-miracle-video.js`의 `interpretGravity()`/`buildSequence()` 모듈 구조(export되어 재사용 가능하게 되어 있음) — 단, taxonomy 통합 필요.

## 삭제할 것

1. `services/storybookQueue.js`의 `mockGenerateAssets()`, `executeRegenImage/EditText/RewriteDoc()` — 전부 가짜 URL 반환. 실제 엔진 연결 후 제거.
2. `runEthicsGate()`의 "항상 PASS" 스텁 — 실제 콘텐츠 검증 로직으로 교체 전까지 존재 자체가 리스크이므로, 최소한 로그에 "STUB"임을 명시하거나 제거.
3. 중복 스키마 정의 중 하나(위 "즉시 수정" 3번 처리 후).

## 나중에 할 것

1. `dreamtown-wishart` 엔진을 `daily-miracles-mvp`에 실제로 연결(현재 완전히 분리된 두 저장소).
2. Story Data 스키마를 4P Act 구조 기준으로 재설계(현재 마이그레이션 162/166-170은 카드/슬라이드 기반).
3. 소원그림(1P)/기적영상(4P)/기적쇼츠(1P+별도소재+2P)/스토리북 각각의 "확장 출력 어댑터" 설계 및 구현.
4. "기적쇼츠"의 "배우 소원이 별빛항로 35초" 소재 제작 방식 별도 설계(현재 코드/에셋 없음).
5. `assemble-miracle-video.js`의 7-중력-유형 체계와 `dreamtown-wishart`의 5-Canon-감정 체계 통합 여부 결정.
6. Kling API 실제 호출 자동화(현재는 프롬프트를 수동으로 Kling UI에 입력하는 방식).
7. storybook-mcp의 `export_pdf`/`export_video`/`add_narration` 실제 구현(현재는 절차를 설명하는 프롬프트만 반환).

## 우선순위 제안 (확정 아님, 논의용)

1. **P0**: 즉시 수정 1~4 (결제 고객이 가짜 자산을 받는 문제 직결)
2. **P1**: `dreamtown-wishart` 연결 + Story Data 스키마 재설계 (Core Story Engine의 전제조건)
3. **P2**: 상품별 출력 어댑터 설계(소원그림/기적영상 우선, 기적쇼츠는 소재 미정이라 후순위)
4. **P3**: taxonomy 통합, Kling 자동화, PDF/영상/나레이션 실제 구현
