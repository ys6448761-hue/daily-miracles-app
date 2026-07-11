---
title: DreamTown V2 Backlog
status: Active (living document)
owner: 대표 / Aurora5 / Claude Code
created: 2026-07-11
purpose: DreamTown_V1_Architecture_Freeze.md 확정 이후의 모든 신규 아이디어·미정 항목을 여기서 관리한다. V1 개발 중에는 이 목록의 항목을 구현하지 않는다.
---

# DreamTown V2 Backlog

> `DreamTown_V1_Architecture_Freeze.md` 확정 이후 새로운 아이디어는 V1 설계에 즉시 반영하지 않고 여기에 기록한다.

---

> **2026-07-12 갱신**: `DreamTown_V1_Architecture_Freeze.md`가 APPROVED v1.0으로 확정되면서, 아래 항목 중 Booking 최소모델/Product Code/QR 2축/Identity 구조/"별들의 가족 되기"는 **해소되었다**(Freeze 문서 §3~§6 참조). 이 백로그에서 제거하고, 여전히 남은 미정 항목만 유지한다.

## 구조 미정 (Freeze v1.0 이후에도 남은 것)

- "Wish Platform" 계층의 정확한 역할 (Freeze §2에서 V2_BACKLOG로 명시 분류됨)
- "Wish" 축(Platform §2, QR Domain §5)과 기존 `wish_entries`/`wish_tracking_requests`/`PRG_WISH_30`의 관계
- `DT-PREMIUM` Product Code의 정확한 가격·구성(Freeze §3, V1_FOUNDATION_ONLY)
- Booking의 HOTEL/OTA 채널 실제 자동 연동(PMS/OTA API) — 스키마는 확정, 구현은 V2(Freeze §4)
- QR Purpose: Content, Domain: Wish (Freeze §5, V2_BACKLOG)

## 기능 미정 (스펙 없음, 추측 구현 금지)

- 별공방 실제 등록 UI/로직 전체(현재는 최소 `wishart_image_path` 기록만 V1_FOUNDATION_ONLY)
- 재회(Reunion) 시스템 — 트리거/동작 전부 미정(`reunion_status` 컬럼만 존재)
- Promise 단계의 사용자 흐름(필드는 존재, UI/트리거 없음)
- Festival/Event 서비스 세부(행사코드, 브랜드 프레임 합성 방식) — WishArt enum에는 존재(Freeze §7), 실제 서비스 미오픈

## 코드 정리 (리팩토링 백로그)

- `precheck_photo()`가 `prompt_builder.py`와 `ssot_world.py`에 중복 정의된 것으로 보이는 부분 확인·정리
- `_run_generation()`의 사진-없음 대체 생성 경로(Identity Lock 미적용) 제거 여부 결정
- Identity Lock 보존율 수치 불일치(V4 원문 80~90% vs 코드 85~95%) 통일
- 캔버스 비율 불일치(V4 원문 9:16 vs 코드 실제 출력 1024x1536) 통일
- `SSOT-ROUTE-001`의 기존 표기 불일치("영상 Route는 하멜등대에서 종료" vs 호텔이 마지막 장면인 다이어그램)

## 신규 상품/기능 아이디어

- 웹툰, 애니메이션, 엽서, 굿즈, 전시(`SSOT-BG-001` "향후 상품" — 전부 미착수)
- 기적쇼츠의 "배우 소원이" 소재 실체 및 항로당 시간 배분
- 카카오톡 결과 전송(기존 `messageProvider.js` 인프라 확장 필요, `OUTBOUND_ENABLED` 정책 결정 필요)

---

## 사용 규칙

- 새 아이디어가 나오면 이 문서에 항목만 추가한다(구현하지 않는다).
- V1 개발 중 이 목록의 항목이 "지금 꼭 필요하다"고 판단되면, 임의로 구현하지 않고 `DreamTown_V1_Architecture_Freeze.md`를 먼저 갱신할지 대표에게 확인한다.
