---
code: SSOT-APP-001
title: DreamTown Mobile Journey Guide (Part 3)
status: Confirmed (구현 완료, 2026-07-13 대표 승인)
owner: 대표(푸르미르) / Aurora5 / Claude Code
created: 2026-07-13
implemented_at: dreamtown-wishart commit 0e48b19
related_adr: ADR-001_Journey_Guide_Started_State.md
layer: LAYER 2 — Operational SSOT
---

# SSOT-APP-001 — DreamTown Mobile Journey Guide (Part 3)

> 이미 구현·테스트·승인된 기능을 사후 문서화한다. 새로운 설계를 추가하지 않는다.

## 목적

호텔 체크인 후 사용자가 스마트폰으로 별빛항로를 확인할 수 있는 모바일 웹 안내 화면. 16:9 Hero 이미지는 대표 비주얼로만 쓰고, 실제 이동 순서와 감정 역할은 모바일 세로 스크롤 UI로 제공한다.

## 진입 흐름

```
Journey 생성(Booking REDEEMED, Phase 1)
  → GET /journey/{journey_id}/route  (Part 3, 본 문서)
```

Part 2(등록/First Promise, `SSOT-APP-002`)가 구현되면 등록 완료 시 이 경로로 리다이렉트한다. 별도 QR을 다시 요구하지 않는다.

## 화면 구성

1. **Hero 영역** — 16:9 이미지(`object-fit: cover`), 클릭 시 라이트박스 확대. 이미지 부재 시 그라디언트 폴백.
2. **항로 세로 카드** — EP01 Main Starlight Route 6개 장소(`SSOT-ROUTE-001`/`SSOT-BG-001` 2026-07-13 확정)를 한 장소당 한 카드로 세로 스크롤 표시. 필드: `place_name`, `emotion_role`, `short_message`, `image`(optional), `map_link`(optional).
3. **CTA** — "별빛항로 시작하기" 버튼 1개. 클릭 시 `route_status='IN_PROGRESS'`, `route_started_at=now` 저장(멱등, 중복 클릭 방지). 이후 "이제 천천히 걸어주세요. DreamTown은 여행을 방해하지 않습니다." 문구로 대체.

## 콘텐츠 상수

`dreamtown-wishart/db.py`의 `STARLIGHT_ROUTE_EP01` — 여수엑스포역/엑스포바닷길/이순신광장/케이블카/종포해양공원/하멜등대 6개. 관리자 편집 UI는 미구현(P1, 향후 과제).

## 권한 검증

`db.check_starlight_route_access(journey_id)` — Journey에 연결된 Booking이 `REDEEMED` 또는 `COMPLETED` 상태면 접근 허용. 별도 Entitlement 타입 레지스트리는 없다(간이 구현, 향후 정식 체계 필요 — `REPORT` 참조).

## 상품 보호 원칙

Part 3는 정적 항로 안내만 제공한다. 소원그림 1P/2P, 기적쇼츠, 영상은 노출하지 않는다(테스트로 검증됨).

## 데이터 모델

`resident_journeys.route_started_at`(신규, nullable), `route_status`에 `IN_PROGRESS` 추가 — `ADR-001_Journey_Guide_Started_State.md` 참조.

## 관련 문서

- `dreamtown-wishart/app.py`(`GET /journey/{id}/route`, `POST /journey/{id}/start`), `templates/journey_route.html`, `test_journey_route.py`
- `SSOT-ROUTE-001_EP01_Wish_Journey.md`, `SSOT-BG-001_Starlight_Route_Background_Guide.md`(EP01 Main Route 6개 확정)
- `CAND-EXP-001_DreamTown_Experience_Architecture.md`(Experience Pipeline의 "Journey" 단계에 대응)
- `ADR-001_Journey_Guide_Started_State.md`
