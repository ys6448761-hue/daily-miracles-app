---
code: SSOT-UPLOAD-001
title: WishArt 사진 업로드 운영 모드 분리 (MODE A / MODE B)
status: LOCKED
owner: Aurora5 / Claude Code
based_on: dreamtown-wishart app.py 실사(REPORT-Route_Product_Alignment.md 이전 오픈 준비 점검 결과)
created: 2026-07-11
layer: LAYER 2 — Operational SSOT
---

# SSOT-UPLOAD-001 — WishArt 사진 업로드 운영 모드 분리

> 기존 WishArt 현장 포토존 서비스(MODE A)와 신규 DreamTown 별빛항로 서비스(MODE B)는 하나의 업로드 흐름으로 통합하지 않는다. 동일 생성 엔진을 공유하되, 라우트·폼·DB 레코드·관리자 화면·결과 화면은 구분한다.

---

## MODE A — WishArt Quick (기존 유지)

**목적**: 관광지·행사장·포토존에서 고객이 결제 후 정면사진을 업로드하고 즉시 소원그림을 받는다.

**필수 입력**: 정면사진 1장

**불필요**: 스타터카드, 가입일, 호텔, resident_id, 별공방, 재회 기록

**결과**: 소원그림 즉시 생성, 웹 확인, 다운로드

### 기존 코드 매핑
- 라우트: `POST /partner-workshop/submit` (`dreamtown-wishart/app.py:391`) — 기존 흐름 유지
- DB: `stars` 테이블(SQLite, `db.py:66-90`) — `image_path`(생성 결과), `user_id`, `partner_code`
- 결과 화면: `GET /result/{star_id}` (`app.py:590`)

### ⚠️ MODE A 기준 충족을 위해 필요한 수정 (이번 지시로 확정됨, 미구현 상태)
1. **정면사진 필수화** — 현재 `templates/partner_workshop.html:30-36`은 "사진(선택)"이며 "사진이 없어도 별이 만들어집니다"로 안내되어 있다. 이번 지시("필수 입력: 정면사진 1장")에 따라 **필수 항목으로 변경**해야 한다. (이전 오픈 준비 점검 P0-3 항목)
2. **다운로드 기능 추가** — 현재 `/result/{star_id}` 결과 화면에는 "공유하기"(navigator.share)만 있고 다운로드 링크/라우트가 없다(이전 점검에서 확인). MODE A 완료 기준에 다운로드가 명시되어 있으므로 추가 필요.

---

## MODE B — WishArt Route (신규)

**목적**: 호텔 스타터키트를 받은 고객이 별빛항로 체험 후 DreamTown 소원이로 등록되고, 소원그림과 여행 기록을 별공방에 저장한다.

**필수 입력**: 이름, 가입일, 스타터카드 사진 1장, 정면사진 1장, `origin_hotel_id` 또는 `partner_code`

**저장 필드**: `resident_id`, `customer_name`, `join_date`, `starter_card_image`, `portrait_image`, `wishart_image`, `origin_hotel`, `route_status`, `atelier_record`

**결과**: 소원그림 생성, DreamTown 주민등록, 별공방 저장, 재회 시스템 연결

### 현재 상태 (전면 미구현 — 이전 오픈 준비 점검 결과)
- "스타터카드" 개념: 코드·DB·UI 어디에도 없음(0건)
- 두 장 사진(스타터카드+정면사진)을 한 회원에 연결하는 스키마: 없음(`stars` 테이블에는 사진 컬럼 1개뿐)
- 별공방 등록: DB 등록 로직 없음(현재는 이미지 생성 프롬프트 안의 시각적 요소 개념일 뿐 — Reveal Rule 검증 대상)
- `resident_id`, `route_status`, `atelier_record`에 대응하는 컬럼: 없음

### MODE B 구현에 필요한 신규 요소 (설계만, 미구현)
1. **신규 DB 스키마** — `residents`(가칭) 테이블: `resident_id, customer_name, join_date, starter_card_image, portrait_image, wishart_image, origin_hotel, route_status, atelier_record`. MODE A의 `stars` 테이블과는 별도 테이블로 분리(공유 안 함).
2. **신규 라우트** — 예: `GET/POST /route-registration`(가칭). MODE A의 `/partner-workshop`과 분리된 별도 엔드포인트.
3. **신규 폼** — 이름/가입일/스타터카드사진/정면사진/`origin_hotel_id` 또는 `partner_code` 입력 필드를 갖는 별도 템플릿.
4. **신규 관리자 화면** — MODE B 전용 목록(이름/가입일/스타터카드/정면사진/소원그림/route_status/atelier_record 조회). MODE A의 `/admin`과 분리.
5. **신규 결과 화면** — 소원그림 + 주민등록 확인 + 별공방 저장 확인 + 재회 시스템 연결 상태를 보여주는 MODE B 전용 결과 페이지. MODE A의 `/result/{star_id}`와 분리.
6. **별공방 실제 등록 로직** — 현재의 "프롬프트 토큰" 개념을 넘어, `atelier_record`를 실제로 쓰는 DB 등록 단계 신설.
7. **재회 시스템 연결** — 이번 지시에 "재회 시스템 연결"이 결과에 포함되나, 재회 시스템 자체의 스펙(어떤 트리거로 무엇을 하는지)은 이번 지시에 없음 — **자료 없음, 별도 확인 필요**.

### `origin_hotel_id` / `partner_code`와 기존 QR 버그의 연관성
이전 오픈 준비 점검에서 **장소 QR 8개 중 7개가 시드된 partner_code와 매칭되지 않아 소원생성 흐름이 끊기는 버그**를 발견했다(`app.py:572-573`, `db.py:14-22`). MODE B가 `origin_hotel_id` 또는 `partner_code`를 필수 입력으로 받는다면, **이 버그 수정이 MODE B 구현의 전제조건일 가능성이 높다** — 호텔/파트너 코드가 정확히 매칭되지 않으면 MODE B 등록 자체가 막힐 수 있다.

---

## 공유 요소

두 모드는 **동일 생성 엔진**을 사용할 수 있다 — `build_wishart_package()` + `generate_wishart_from_photo()` (`dreamtown-wishart/prompt_builder.py`, `image_generator.py`). Identity Lock, Reveal Rule 등 `SSOT-WISHART-001` 규칙은 두 모드에 공통 적용된다.

## 분리 요소

| 요소 | MODE A | MODE B |
|---|---|---|
| 라우트 | `/partner-workshop`(기존) | 신규(가칭 `/route-registration`) |
| 폼 | 기존(사진만) | 신규(이름/가입일/스타터카드/정면사진/호텔·파트너코드) |
| DB 레코드 | `stars`(기존) | `residents`(신규) |
| 관리자 화면 | `/admin`(기존) | 신규 |
| 결과 화면 | `/result/{star_id}`(기존, 다운로드 추가 필요) | 신규(주민등록·별공방·재회 상태 포함) |

---

## Original Source

본 문서는 대표가 제공한 "WishArt 사진 업로드 운영 모드 분리 지시" 및 이전 "DreamTown 오픈 준비 상태 점검" 조사 결과를 결합해 작성했다. 새로운 정책을 추가하지 않았으며, 지시에 없는 항목(재회 시스템 세부 스펙 등)은 "자료 없음"으로 남겼다.
