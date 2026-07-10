---
Document: TODO-DreamTown_Route_Service
Based On: SSOT-ARCH-001, SSOT-WISHART-002, SSOT-IDENTITY-001, REPORT-WishArt_Platform_Refactor_Impact.md
Date: 2026-07-11
Status: Phase B — 설계 승인 전까지 구현 착수하지 않음
---

# TODO — DreamTown Route Service (Phase B)

> 이 문서의 모든 항목은 **설계 승인 후에만 착수한다.** 이번 작업(Phase A)에서는 실행하지 않았다.

---

## P0 — Core Engine 추출 (선행 조건, 다른 모든 작업의 전제)

1. `_run_generation()`을 `generate_wishart(portrait_image, service_mode, story_data=None, partner_context=None)` 형태로 리팩토링 — DB 쓰기를 함수 밖으로 분리.
   - **완료 조건**: 함수가 `stars`/`residents` 등 어떤 테이블도 직접 쓰지 않고, `{status, image_path, story_data, qc, error}`를 반환한다.
   - **테스트**: PhotoZone Quick 경로가 리팩토링 후에도 기존과 동일하게 동작하는지 회귀 테스트(사진 필수 검증, 생성 성공/실패, `stars.image_path` 저장까지 확인).
2. `precheck_photo()` 중복 정의(`prompt_builder.py` vs `ssot_world.py`) 확인 및 정리.
   - **의존성**: 없음. P0-1과 독립적으로 먼저 해도 됨.

## P1 — DreamTown Route 데이터 모델 구현

3. `residents`, `resident_assets`, `resident_journeys`, `atelier_records` 마이그레이션 작성(`SSOT-ARCH-001` §6 스키마).
   - **의존성**: 없음.
   - **완료 조건**: 4개 테이블이 생성되고, `stars` 테이블은 전혀 변경되지 않았음을 확인.
   - **테스트**: 마이그레이션 적용 후 기존 `stars`/`partners` 조회가 영향받지 않는지 확인.
4. `origin_hotel_id`/`partner_code` 검증 로직 — 이번 QR 버그 수정(`PLACE_TO_PARTNER`)과 동일한 문제(코드 체계 불일치)가 호텔 코드에서도 발생할 수 있으므로, 호텔 코드 시딩 전에 검증 체계를 먼저 설계한다.
   - **의존성**: P1-3.

## P2 — DreamTown Route 라우트/폼/생성 연결

5. `/dreamtown/route` (GET, 안내), `/dreamtown/route/register` (POST, 이름/가입일/스타터카드사진/정면사진/호텔·파트너코드/동의 입력) 라우트 작성.
   - **의존성**: P1-3.
   - **완료 조건**: 스타터카드 사진과 정면사진이 동일 `resident_id`로 `resident_assets`에 저장됨.
   - **테스트**: 두 사진이 실제로 같은 `resident_id`를 참조하는지 DB 조회로 확인.
6. 소원그림 생성 연결(`generate_wishart(service_mode="DREAMTOWN_ROUTE")` 호출, 결과를 `resident_assets.asset_type=WISHART_IMAGE`에 저장).
   - **의존성**: P0-1, P2-5.
   - **완료 조건**: 정면사진 1장으로 Identity Lock이 적용된 소원그림이 생성되고 `resident_id`에 연결됨.
7. 주민 프로필(2D 수채화 얼굴) 생성 + 주민카드 고정 템플릿 합성(이름/가입일/Resident ID/호텔/첫 항로/QR).
   - **의존성**: P2-6.
   - **완료 조건**: 주민카드의 텍스트/QR 영역이 AI 생성이 아니라 고정 템플릿 합성으로 만들어졌는지 확인(지시서 §11 금지사항 준수).
   - **테스트**: 동일 인물의 소원그림과 주민 프로필 얼굴이 Identity Lock 기준으로 일치하는지 확인.
8. `/dreamtown/route/result/{resident_id}` 결과 화면.
   - **의존성**: P2-6, P2-7.

## P3 — 별공방 / 관리자 / 재회 (스펙 확정 후)

9. 별공방 MVP 저장 — **별도 스펙 없이는 착수하지 않는다**(지시서 §11 금지사항). 스펙 확정 시 `atelier_records`에 실제 등록 로직 구현.
10. `/dreamtown/atelier/{resident_id}` 화면 — P3-9에 의존.
11. DreamTown Route 관리자 화면(이름/가입일/스타터카드/정면사진/소원그림/route_status/atelier_record 조회) — PhotoZone Quick 관리자 화면(`/admin`)과 분리된 별도 화면.
    - **의존성**: P2-5, P2-6, P2-7.
12. 재회 시스템 — **스펙 없음, 착수하지 않는다.** `atelier_records.reunion_status` 컬럼만 존재(P1-3에서 생성), 트리거/동작은 별도 지시 대기.

---

## 완료 기준 (지시서 §12, 전체 Phase B 완료 시 재검증)

- [ ] 기존 포토존 기능이 유지되는가?
- [ ] DreamTown Route가 별도 서비스로 분리되는가?
- [ ] 두 서비스가 동일 Core Engine을 공유하는가?
- [ ] 정면사진 한 장으로 소원그림과 주민카드를 만들 수 있는가?
- [ ] DreamTown 데이터가 포토존 데이터와 혼합되지 않는가?
- [ ] 향후 축제·행사 서비스를 추가할 때 엔진 수정 없이 서비스만 추가할 수 있는가?

## 하지 않는 것 (지시서 §11, 전체 Phase B 공통)

- 기존 PhotoZone 흐름 삭제
- `/partner-workshop`을 DreamTown 전용으로 변경
- 기존 `stars` 데이터 임의 마이그레이션
- 별공방·재회 기능을 추측으로 구현
- 주민카드 전체를 생성형 AI에 맡김
- 두 서비스 데이터를 동일 폼·동일 결과 화면에 혼합
