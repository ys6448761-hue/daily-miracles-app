---
code: SSOT-ARCH-001
title: WishArt Platform Architecture — Core Engine & Service Separation
status: LOCKED
owner: Aurora5 / Claude Code
based_on: 실제 dreamtown-wishart 코드 조사 결과(app.py, prompt_builder.py, image_generator.py, db.py)
created: 2026-07-11
layer: LAYER 2 — Operational SSOT
---

# SSOT-ARCH-001 — WishArt Platform Architecture

> 핵심 원칙: **하나의 WishArt Engine을 여러 서비스가 사용한다.** 이번 문서는 설계이며, 이번 작업에서 실제 파일 분리(리팩토링)는 수행하지 않았다.

---

## 1. 최상위 구조

```
WishArt Platform
│
├─ Core Engine  (현재: dreamtown-wishart의 개별 모듈들, 아직 하나의 Engine으로 통합되어 있지 않음)
│  ├─ 사진 검증        — photo_interpreter.py: precheck_photo(), interpret_photo()
│  ├─ Identity Lock    — prompt_builder.py: build_identity_lock_directives(), IDENTITY_MANDATORY
│  ├─ 감정·별·장소 결정 — wish_engine.py: classify() / location_mapper.py: LOCATION_MAP
│  ├─ Prompt Builder   — prompt_builder.py: build_wishart_package()
│  ├─ GPT Image 2 생성 — image_generator.py: generate_wishart_from_photo(), generate_image()
│  ├─ QC               — prompt_builder.py: judge_release(), check_reveal_rule()
│  └─ 결과 저장         — 현재는 app.py의 _run_generation()이 db.update_star_done()을 직접 호출(서비스별 분리 안 됨 — §4 참조)
│
├─ DreamTown Route Service (신규, 미구현)
│  ├─ 스타터카드 / 정면사진 / 주민등록 / 소원그림 / 디지털 주민카드 / 별공방 / 재회
│
├─ PhotoZone Quick Service (기존 /partner-workshop, 유지)
│  ├─ 현장 결제 / 정면사진 / 즉시 생성 / 다운로드
│
└─ Event Service (미래, 미구현)
   ├─ 행사 코드 / 브랜드 프레임 / 정면사진 / 즉시 생성 / 공유
```

---

## 2. 현재 상태 vs 목표 상태

**현재**: Core Engine에 해당하는 기능(사진검증/Identity Lock/Prompt Builder/이미지생성/QC)은 이미 모듈화되어 있으나(`prompt_builder.py`, `image_generator.py`, `wish_engine.py`, `location_mapper.py`, `photo_interpreter.py`), **결과 저장(DB write)은 `_run_generation()`(`app.py:243-303`) 안에 `stars` 테이블 전용으로 하드코딩**되어 있다. 즉 "결과 저장"은 아직 Core Engine과 분리되지 않았고, PhotoZone Quick의 데이터 모델에 결합되어 있다.

**목표**: 결과 저장을 서비스별 책임으로 분리하고, Core Engine은 생성 결과(이미지 파일 경로 + Story Data)만 반환한다.

---

## 3. Core Engine 인터페이스 초안

```python
def generate_wishart(
    portrait_image,          # 정면사진 (파일 경로 또는 업로드 객체)
    service_mode,            # "PHOTOZONE_QUICK" | "DREAMTOWN_ROUTE" | "FESTIVAL_EVENT" | "HOTEL_LOBBY"
    story_data=None,         # 서비스가 이미 알고 있는 감정/장소/보석 등(없으면 Engine이 자동 결정)
    partner_context=None,    # partner_code 등 서비스별 맥락 정보(로깅/정책 분기용, Engine 로직에는 영향 없음)
):
    """
    반환값(초안):
    {
        "status": "OK" | "PHOTO_REJECT" | "QC_FAILED" | "ERROR",
        "image_path": str | None,
        "story_data": {...},   # emotion, location, gemstone, scene_lock 등
        "qc": {...},           # judge_release() 결과
        "error": str | None,
    }
    """
```

- **이 함수는 결과를 어떤 테이블에도 저장하지 않는다.** 저장은 호출한 서비스(PhotoZone Quick, DreamTown Route 등)의 책임이다.
- 내부적으로 기존 `interpret_photo()` → `precheck_photo()`(게이트) → `wish_engine.classify()`(story_data 없을 때만) → `build_identity_lock_directives()` → `build_wishart_package()` → `generate_wishart_from_photo()` → `judge_release()` 순서를 그대로 재사용한다(새 로직 추가 없음).
- `service_mode`는 현재 로직 분기에 영향을 주지 않는다(모든 서비스가 동일한 Identity Lock/Reveal Rule을 적용받는다) — 로깅·정책(예: 예산 한도, 저장 위치)에만 쓰인다.

**중요**: 이 인터페이스는 초안이며, 아직 코드로 구현되지 않았다. `_run_generation()`을 이 형태로 리팩토링하는 작업은 Phase B 승인 후 진행한다(`TODO-DreamTown_Route_Service.md` 참조).

---

## 4. 공통 모듈 (중복 구현 금지 대상)

| 기능 | 현재 위치 | 상태 |
|---|---|---|
| 파일 형식·용량 검증 | `photo_interpreter.py` (일부) | 존재, 재사용 가능 |
| 얼굴 존재·정면성·가림·역광 검증 | `precheck_photo()` (`prompt_builder.py:154`, `ssot_world.py:101` 중복 정의 — 확인 필요) | 존재, 재사용 가능. **단, 동일 함수가 두 파일에 중복 정의되어 있어 정리 필요(§리스크 참조)** |
| Identity Lock | `build_identity_lock_directives()`, `IDENTITY_MANDATORY` | 존재, 재사용 가능 |
| WishArt V4 Prompt Builder | `build_wishart_package()` | 존재, 재사용 가능 |
| 이미지 생성 | `generate_wishart_from_photo()`, `generate_image()` | 존재, 재사용 가능 |
| QC | `judge_release()`, `check_reveal_rule()` | 존재, 재사용 가능 |
| 결과 파일 저장 | 없음(서비스별로 분리 필요) | **미구현 — 서비스별 책임으로 신규 설계** |
| 생성 상태 관리·오류 처리·재시도 | `_run_generation()`의 try/except(단발성, 재시도 없음) | **부분적 — 재시도 로직 없음, Core Engine 추출 시 보강 필요** |

---

## 5. 확장 원칙

새 서비스(축제/행사, 호텔 로비 등)를 추가할 때:
1. Core Engine의 함수(§3)를 수정하지 않는다.
2. 새 서비스 전용 라우트·폼·DB 테이블만 추가한다.
3. `service_mode`에 새 값을 추가하고, 필요한 정책(저장 위치, 예산 한도 등)만 분기한다.
4. Identity Lock, Reveal Rule 등 WishArt V4 규칙(`SSOT-WISHART-001`)은 모든 서비스에 동일하게 적용된다 — 서비스별로 완화하지 않는다.

---

## 6. DreamTown Route 데이터 모델 (확정)

> ⚠️ **2026-07-12 갱신**: `DreamTown_V1_Architecture_Freeze.md`(APPROVED v1.0) §4/§8에서 `bookings` 테이블과 `resident_journeys.booking_id` 컬럼이 추가로 확정되었다. 아래 스키마는 그 최신 상태를 반영한다 — 최종 기준은 Freeze 문서다.

```sql
bookings
  booking_id, channel, channel_ref, product_code, option_codes,
  customer_name, contact, origin_hotel_id, partner_code,
  entitlement_code, booking_status, created_at, updated_at

residents
  resident_id, customer_name, join_date, origin_hotel_id, origin_hotel_name,
  partner_code, resident_status, created_at, updated_at, consent_version

resident_assets
  asset_id, resident_id, asset_type, file_path, created_at
  -- asset_type: STARTER_CARD | PORTRAIT_ORIGINAL | WISHART_IMAGE | RESIDENT_PROFILE | RESIDENT_CARD

resident_journeys
  journey_id, resident_id, booking_id(신규, nullable FK), route_code, route_name,
  route_status, started_at, completed_at

atelier_records
  atelier_id, resident_id, wishart_image_path, promise_text, reunion_status,
  origin_hotel_id, saved_at
```

### `stars`(PhotoZone Quick) 테이블과의 관계 — 결정: **분리(재사용하지 않음)**

- `stars`는 PhotoZone Quick 고유 기능(이용권 소비, 파트너 커미션, 공명, 기억 저장)에 강하게 결합되어 있다 — 이 필드들은 DreamTown Route에는 의미가 없다.
- `residents`/`resident_assets`는 `stars.id`를 외래키로 참조하지 않는다. 완전히 독립된 테이블로 신설한다.
- 두 서비스가 공유하는 것은 **Core Engine 함수 호출(§3)뿐**이며, 그 결과(이미지 파일)를 각자 자신의 테이블(`stars.image_path` vs `resident_assets.file_path`)에 저장한다.
- 이유: `stars` 테이블에 DreamTown 전용 nullable 컬럼(`resident_id`, `join_date` 등)을 추가하는 방식은 두 서비스의 의미를 한 테이블에 혼재시켜, 이번 지시의 "구현 금지 사항"(두 서비스 데이터를 동일 폼·동일 결과 화면에 혼합하지 않는다)의 데이터베이스 버전 위반이 된다. 또한 "기존 `stars` 데이터를 임의 마이그레이션하지 않는다"는 금지 사항과도 부합한다 — 분리하면 마이그레이션 자체가 필요 없다.

## 7. 알려진 리스크 (이번 조사에서 발견, 별도 확인 필요)

- `precheck_photo()`가 `prompt_builder.py`와 `ssot_world.py` 두 곳에 정의되어 있는 것으로 보인다 — 실제로 어느 쪽이 호출되는지, 두 정의가 동일한지 확인이 필요하다(Core Engine 추출 전 정리 대상).
- `_run_generation()`의 else 분기(사진 없을 때, `app.py:276-286`)는 Identity Lock이 적용되지 않는 완전히 다른 생성 경로다 — MODE A가 이제 사진을 필수로 요구하므로(이전 커밋) 이 분기는 PhotoZone Quick에서는 도달 불가능해졌으나, 코드에는 남아 있다. DreamTown Route는 사진이 항상 필수이므로 이 분기를 아예 사용하지 않는다.

## Original Source

본 문서는 신규 SSOT다. 기존 SSOT(`SSOT-WISHART-001`, `SSOT-UPLOAD-001`)를 변경하지 않고 그 위에 플랫폼 구조를 정의했다.
