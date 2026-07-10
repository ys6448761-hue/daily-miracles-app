---
code: SSOT-WISHART-002
title: WishArt Service Modes
status: LOCKED
owner: Aurora5 / Claude Code
based_on: SSOT-ARCH-001_WishArt_Platform.md
created: 2026-07-11
layer: LAYER 2 — Operational SSOT
---

# SSOT-WISHART-002 — WishArt Service Modes

> 서비스 모드에 따라 입력과 출력은 달라도, 생성 엔진(`SSOT-ARCH-001`)은 동일해야 한다.

---

## PHOTOZONE_QUICK (기존, 유지)

**목적**: 관광지·행사장·포토존에서 결제 후 정면사진 업로드 → 즉시 소원그림.

**현재 코드 매핑**: `POST /partner-workshop/submit` (`app.py:391`), `stars` 테이블.

**흐름**:
```
현장 결제
  ↓
정면사진 업로드 (필수 — 2026-07-10 확정)
  ↓
얼굴 검증
  ↓
소원그림 생성
  ↓
결과 보기
  ↓
다운로드 (2026-07-10 추가)
  ↓
종료
```

**저장 최소값**: `transaction_id`, `partner_code`, `portrait_image`(또는 보존정책에 따른 임시 저장), `wishart_image`, `generation_status`, `created_at`.

> 현재 `stars` 테이블은 이 최소값보다 필드가 많다(`wish`, `emotion`, `gemstone`, `user_id`, `credential_code` 등 — 이용권/공명/기억 기능 때문). 이 초과 필드들은 PhotoZone Quick 고유 기능(이용권 연동, 공명, 기억 저장)에 쓰이는 것이며, 이번 지시의 "불필요" 목록(주민등록/스타터카드/가입일/호텔/별공방/재회)과는 겹치지 않는다 — **`stars` 테이블은 그대로 유지하며 변경하지 않는다.**

**불필요(받지 않음)**: 주민등록, 스타터카드, 가입일, 호텔, 별공방, 재회.

---

## DREAMTOWN_ROUTE (신규, 미구현)

**목적**: 호텔 스타터키트를 받은 고객이 별빛항로 체험 후 DreamTown 소원이로 등록.

**입력**: 이름, 가입일, 스타터카드 사진, 정면사진, `origin_hotel_id` 또는 `partner_code`, 개인정보·이미지 저장 동의.

**출력**: 소원그림(`wishart_image`) + 디지털 주민카드(`resident_profile_image` + `resident_card_image`).

상세 데이터 모델은 `SSOT-ARCH-001` 및 이번 지시서 원문의 `residents`/`resident_assets`/`resident_journeys`/`atelier_records` 구조를 따른다(§데이터 모델 결정 참조).

**받지 않음**: 하멜등대 배경사진, 여행사진, 관광지 인증사진 — 정면사진 1장만 원본으로 사용한다.

---

## FESTIVAL_EVENT (향후, 미구현)

**목적**: 축제·행사·기업 브랜드 행사에서 행사 코드 기반 즉석 소원그림.

**추정 흐름**(이번 지시서 최상위 구조 §2 기준, 세부 미정):
```
행사 코드 입력
  ↓
브랜드 프레임 적용
  ↓
정면사진
  ↓
즉시 생성
  ↓
공유
```

> ⚠️ PhotoZone Quick과 매우 유사하나 "브랜드 프레임"이라는 새 요소가 있다 — 이것이 이미지에 합성되는 오버레이인지, Background Asset의 변형인지는 이번 지시서에 정의되어 있지 않다. **자료 없음, 추측하지 않음.** 실제 설계는 이 서비스 착수 시점에 별도 확정한다.

---

## HOTEL_LOBBY (향후, 미구현)

이번 지시서의 최상위 구조 다이어그램에는 언급되지 않았으나 `generate_wishart()` 인터페이스 예시(`SSOT-ARCH-001` §3)의 `service_mode` 목록에 등장한다. **구체 스펙 없음 — 자료 없음.** DreamTown Route와 유사하게 호텔 체험 기반일 것으로 추정되나 확정하지 않는다.

---

## 서비스 모드 확장 원칙

- 새 서비스 모드를 추가할 때, Core Engine(`SSOT-ARCH-001`)은 수정하지 않는다.
- 서비스 모드별로 필요한 것은: 전용 라우트, 전용 폼, 전용 DB 테이블(또는 컬럼), 전용 결과 화면.
- 서비스 간 데이터는 섞지 않는다(`SSOT-UPLOAD-001`의 MODE A/B 분리 원칙을 모든 서비스로 확장).
