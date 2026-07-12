---
code: SSOT-APP-002
title: DreamTown First Promise Flow (Part 2)
status: Draft (다음 스프린트 설계 — 이번 턴에서 코드 구현하지 않음)
owner: 대표(푸르미르) / Aurora5 / Claude Code
created: 2026-07-13
sprint: Next Sprint
layer: LAYER 2 — Operational SSOT (Draft)
---

# SSOT-APP-002 — DreamTown First Promise Flow (Part 2)

> 본 문서는 **다음 스프린트** 구현을 위한 설계다. 이번 턴에서는 코드를 작성하지 않았다. 확정된 설계 결정을 문서화한 것이며, 세부 구현 시 이 문서를 기준으로 한다.

## 목적

Part 2는 단순 Registration 화면이 아니다. 사용자 경험 명칭은 **First Promise**다. 시스템 내부는 3개 레이어로 명확히 분리한다: **Activation → First Promise → System Registration Transaction**.

호텔은 Route Location이 아니라 **Experience Stage**로 관리한다(`SSOT-BG-001`/`SSOT-ROUTE-001` 2026-07-13 재분류). 역할: 체크인 / First Promise / 안식 / 재진입.

---

## 레이어 분리

### 1. Activation

- Booking, Product, Hotel, Token 권한 검증
- 입장 자격 확인
- **재진입 가능한 Check-in Session 생성**

### 2. First Promise (사용자 경험 명칭)

- 별들의 가족 선택
- 스타터카드 촬영
- 정면사진 촬영
- 필수 동의
- Resident 확정
- Hotel Atelier 등록

### 3. System Registration Transaction

- 중복 제출 방지
- 원본 Asset 저장
- Journey 연결
- WishArt Job QUEUED
- Route Ready
- Part 3 URL 반환

> 이 3개 레이어는 사용자에게 노출되는 화면 흐름(아래 §화면 순서)과 1:1로 대응하지 않는다. Activation은 화면 진입 전(백그라운드) 검증이고, First Promise는 사용자가 보는 화면 흐름이며, System Registration Transaction은 마지막 제출 시점의 백엔드 처리다.

---

## 화면 순서 (고정)

```
초대
  ↓
가족 선택
  ↓
스타터카드
  ↓
정면사진
  ↓
동의
  ↓
별공방 등록 완료
  ↓
Part 3 자동 이동
```

## UX 문구 (고정)

**가족 선택 화면 — 선택 전**
> 오늘부터 별들의 가족이 되어주시겠어요?

**버튼**
> 별들의 가족이 될게요

**가족 선택 화면 — 선택 후**
> 이제 당신도 별들의 가족입니다.
> 첫 번째 약속을 남겨볼까요?

> 원칙: 첫 화면에서 가입을 미리 확정하지 않는다. "가족 선택" 전에는 어떤 Resident 상태 변화도 일으키지 않는다(아래 §상태 규칙).

---

## 상태 규칙 (중요, 절대 원칙)

**Activation Token을 열었다는 이유만으로 Resident를 ACTIVE 상태로 만들지 않는다.**

사진(스타터카드+정면사진) 및 필수 동의 제출이 완료되기 전까지, **Resident와 Atelier 상태는 PENDING으로 유지한다.**

| 시점 | Resident 상태 | Atelier 상태 |
|---|---|---|
| Activation Token 열람(입장만) | 존재하지 않음 또는 PENDING | 존재하지 않음 |
| 가족 선택("될게요" 클릭) | PENDING | 존재하지 않음 |
| 스타터카드/정면사진 촬영 중 | PENDING | 존재하지 않음 |
| 동의 완료 + System Registration Transaction 성공 | **ACTIVE**(또는 기존 `resident_status` 값) | 등록 완료 |

> 이 규칙은 `residents.resident_status`(`SSOT-ARCH-001` §6 기존 스키마, 기본값 `ACTIVE`)의 **기본값 사용 시점을 제한**하는 운영 규칙이다. 실제 구현 시 `residents` row 자체를 사진·동의 제출 완료 시점에만 생성하거나(현재 `create_resident()`가 그렇게 동작함 — 이미 부합), 혹은 row는 먼저 만들되 `resident_status='PENDING'`으로 시작해 제출 완료 시 `ACTIVE`로 전이하는 두 가지 구현 방식이 있다 — **다음 스프린트에서 확정 필요**(자료 없음, 추측하지 않음).

---

## Part 3와의 연결

System Registration Transaction의 마지막 단계가 "Route Ready" + "Part 3 URL 반환"이다. `SSOT-APP-001`의 `GET /journey/{journey_id}/route`가 이 URL이다. 즉:

```
System Registration Transaction 완료
  → Journey 생성(redeem_booking, 기존 Phase 1 함수 재사용)
  → journey_id 확보
  → Part 3 URL(/journey/{journey_id}/route) 반환 → 자동 이동
```

기존 `db.redeem_booking(booking_id, resident_id, ...)`(Phase 1, 이미 구현됨)가 이 마지막 단계의 핵심 로직과 대부분 겹친다 — 재사용 가능.

---

## Experience Stage — 호텔

호텔의 역할은 4가지: **체크인 / First Promise / 안식 / 재진입**.

- 체크인: Activation Token 발급/확인 지점(호텔 프론트 또는 객실 QR)
- First Promise: 본 문서의 화면 흐름
- 안식: 기존 BG-08 "안식의 항로" 감정 콘텐츠(`SSOT-BG-001`)를 Route Location이 아닌 Experience Stage 맥락에서 재사용
- 재진입: Activation에서 생성된 "재진입 가능한 Check-in Session"을 통해, 여정 중 앱을 나갔다 다시 들어와도 동일 Journey로 복귀

> 재진입/Check-in Session의 구체 메커니즘(세션 만료 시간, 저장 방식 등)은 이번 지시서에 없어 **자료 없음으로 남긴다.**

---

## 이번 문서에서 확정하지 않은 것 (다음 스프린트에서 결정)

- Resident row 생성 시점과 PENDING→ACTIVE 전이의 정확한 구현 방식
- Check-in Session의 저장·만료 메커니즘
- "가족 선택" 이전 단계("초대" 화면)의 Activation Token 형식·발급 방식
- WishArt Job QUEUED 상태와 기존 Core Engine(`SSOT-ARCH-001` §3 `generate_wishart`, 아직 미구현) 간의 정확한 연결

---

## 관련 문서

- `CAND-EXP-001_DreamTown_Experience_Architecture.md` — Experience Pipeline의 "Welcome" 단계에 대응(본 문서가 그 단계를 상세화함)
- `SSOT-APP-001_DreamTown_Mobile_Journey_Guide.md` — Part 3(본 문서의 다음 단계)
- `SSOT-ARCH-001_WishArt_Platform.md` §6 — `residents`/`resident_assets`/`atelier_records` 스키마
- `SSOT-BG-001_Starlight_Route_Background_Guide.md`, `SSOT-ROUTE-001_EP01_Wish_Journey.md` — 호텔 Experience Stage 재분류
