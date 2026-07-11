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

## 구조 미정 (Architecture Freeze에서 이월)

- Booking 통합 레이어(채널→Booking→Entitlement→Journey→Identity) — 대응 스키마/코드 없음
- "Wish Platform" 계층의 정확한 역할
- "Wish" 축(Platform §2, QR §5)과 기존 `wish_entries`/`wish_tracking_requests`/`PRG_WISH_30`의 관계
- Service 4단계(Basic/Hotel/Premium/Option)의 정확한 가격·포함범위, 기존 가격 SSOT와의 정합
- QR 3종 체계(Wish/WishArt/DreamTown) 정식 재편
- WishArt 서비스 모드의 `HOTEL_LOBBY` 위치(별도 모드 vs Service §3의 `Hotel` 티어로 흡수)
- Data 모델에서 "Identity"와 "Resident"를 별도 테이블로 분리할지 여부
- "별들의 가족 되기" 단계의 정의 및 데이터 모델 대응

## 기능 미정 (스펙 없음, 추측 구현 금지)

- 별공방 실제 등록 로직(현재는 프롬프트 토큰 개념뿐)
- 재회(Reunion) 시스템 — 트리거/동작 전부 미정
- Promise 단계의 사용자 흐름(필드는 존재, UI/트리거 없음)
- Festival/Event 서비스 세부(행사코드, 브랜드 프레임 합성 방식)
- Hotel Lobby 서비스 세부

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
