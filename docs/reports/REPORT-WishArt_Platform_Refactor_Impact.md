---
Document: REPORT-WishArt_Platform_Refactor_Impact
Purpose: WishArt Engine ↔ Service 결합도 보고 및 DreamTown Route 도입에 따른 영향 분석
Date: 2026-07-11
Based On: SSOT-ARCH-001, SSOT-WISHART-002, SSOT-IDENTITY-001, 실제 dreamtown-wishart 코드 조사
---

# REPORT — WishArt Platform Refactor Impact

## 1. 현재 결합도 (Engine ↔ Service)

`dreamtown-wishart/app.py`는 라우트(서비스 계층)와 생성 로직(엔진 계층)이 한 파일에 섞여 있다.

- **약하게 결합된 부분(재사용 용이)**: `prompt_builder.py`, `image_generator.py`, `wish_engine.py`, `location_mapper.py`, `photo_interpreter.py` — 이미 독립 모듈이며 `app.py`가 이들을 import해서 쓰는 구조. Core Engine으로 추출하기 쉽다.
- **강하게 결합된 부분(분리 필요)**: `_run_generation()`(`app.py:243-303`) 안에서 생성 로직 호출과 `db.update_star_done()`(PhotoZone Quick 전용 테이블 쓰기)이 한 함수 안에 섞여 있다. 이 때문에 지금 상태로는 DreamTown Route가 이 함수를 그대로 재사용할 수 없다 — 재사용하면 `stars` 테이블에 쓰게 되어 서비스 분리 원칙(지시서 §11)을 어기게 된다.
- **라우트 자체의 결합**: `POST /partner-workshop/submit`은 이용권 검증, 파트너 조회, `stars` row 생성, 사진 저장, 백그라운드 생성 예약까지 한 함수(112줄)에서 처리한다. DreamTown Route의 `/dreamtown/route/register`는 이 구조를 복사하지 않고 별도로 작성해야 한다(공유할 것은 §3의 Core Engine 함수 호출뿐).

---

## 2. 기존 코드 재사용 가능 부분

| 모듈/함수 | 재사용 방식 |
|---|---|
| `precheck_photo()`, `interpret_photo()` | 그대로 재사용 — 서비스 무관 |
| `build_identity_lock_directives()`, `IDENTITY_MANDATORY` | 그대로 재사용 |
| `build_wishart_package()` | 그대로 재사용 |
| `generate_wishart_from_photo()` | 그대로 재사용 |
| `judge_release()`, `check_reveal_rule()` | 그대로 재사용 |
| `wish_engine.classify()`, `LOCATION_MAP` | 그대로 재사용(단, DreamTown Route가 감정을 자동 분류할지, 별도 로직을 쓸지는 미정) |
| 파트너/세션 헬퍼(`_ensure_user`, `_get_partner_or_none` 등) | 부분 재사용 가능 — DreamTown Route도 파트너/호텔 코드가 필요하므로 개념은 같으나, 이번 QR 버그 수정처럼 place/partner 코드 체계가 서비스마다 다를 수 있어 그대로 복붙하지 않고 서비스별로 검증 필요 |

## 3. 분리할 부분

- `_run_generation()`의 DB 쓰기 로직(`db.update_star_done`) — Core Engine 함수(`generate_wishart()`, `SSOT-ARCH-001` §3)로 추출하며 DB 쓰기를 제거하고 결과만 반환하도록 리팩토링.
- 사진-없음 대체 생성 경로(`app.py:276-286`, Identity Lock 미적용) — PhotoZone Quick이 사진을 필수로 요구하게 된 이상(이전 커밋) 이 분기는 실질적으로 죽은 코드가 되었다. DreamTown Route에도 필요 없다(정면사진 필수). 제거 여부는 Phase B에서 결정.
- `precheck_photo()`가 `prompt_builder.py`와 `ssot_world.py`에 중복 정의된 것으로 보이는 부분 — Core Engine 추출 전에 어느 쪽이 실제로 쓰이는지 확인 필요.

## 4. 신규 개발 부분

- DreamTown Route 전용: 라우트(`/dreamtown/route*`), 폼, `residents`/`resident_assets`/`resident_journeys`/`atelier_records` 테이블(4개, 신규), 관리자 화면, 결과 화면.
- 디지털 주민카드 고정 템플�이트 합성 로직(AI 생성 얼굴 + 텍스트/QR 합성) — 완전 신규, 참고할 기존 코드 없음.
- 별공방 실제 DB 등록 로직 — 현재는 프롬프트 토큰 개념뿐(이전 오픈 준비 점검에서 확인), 이번 지시로도 구체 스펙 없음.
- 재회 시스템 — 트리거·동작 전부 미정(`SSOT-IDENTITY-001` §5).
- Core Engine 인터페이스(`generate_wishart()`) 자체의 실제 구현 — 현재는 설계(초안)만 있고 코드 없음.

## 5. 마이그레이션 위험

- **낮음**: `residents` 등 4개 테이블은 신규 생성이며 `stars`를 변경하지 않는다(`SSOT-ARCH-001` §6 결정: 분리). 기존 데이터 이동이 없으므로 마이그레이션 리스크 자체가 없다.
- **중간**: `_run_generation()`을 Core Engine 함수로 추출하는 리팩토링은 PhotoZone Quick의 현재 동작(백그라운드 생성, 실패 처리, RED 알림 등 유사 패턴)에 회귀가 생기지 않도록 리팩토링 후 PhotoZone Quick 경로를 재검증해야 한다. 이번 작업에서는 수행하지 않았다(지시서 §11 "기존 PhotoZone 흐름 삭제" 금지와 무관하게, 안전을 위해 Phase B에서 점진적으로 진행 권장).
- **낮음**: 이번 QR 버그 수정(`PLACE_TO_PARTNER` 추가)은 기존 동작을 확장(더 많은 place가 이제 연결됨)했을 뿐, 기존에 작동하던 MINAM 경로는 그대로 유지했다.

## 6. 기존 PhotoZone 영향

이번 작업에서 실제로 코드가 바뀐 곳은 다음 3건뿐이며, 모두 PhotoZone Quick(MODE A)에 대한 것이다.
1. 정면사진 필수화 (커밋 `b6fdad1`)
2. 결과 다운로드 추가 (커밋 `b6fdad1`)
3. 장소 QR 매칭 버그 수정 (커밋 `678ed76`)

DreamTown Route 관련 코드는 이번 작업에서 작성하지 않았다(설계 문서만 작성) — PhotoZone Quick에 대한 추가 영향 없음.

## 7. 예상 작업 순서 (Phase B, 승인 후)

1. `_run_generation()` → `generate_wishart()` Core Engine 함수 추출(PhotoZone Quick 회귀 검증 포함)
2. `residents`/`resident_assets`/`resident_journeys`/`atelier_records` 마이그레이션 작성
3. DreamTown Route 라우트/폼(스타터카드+정면사진 업로드, 동일 `resident_id` 연결)
4. 소원그림 생성 연결(Core Engine 재사용)
5. 주민 프로필 생성 + 주민카드 템플릿 합성
6. DreamTown Route 결과 화면
7. 별공방 MVP 저장(스펙 확정 후)
8. DreamTown Route 관리자 화면

상세 작업 항목·의존성·완료 조건은 `docs/tasks/TODO-DreamTown_Route_Service.md` 참조.
