# DreamTown Event SSOT v1

**버전**: v1.0  
**작성일**: 2026-04-04  
**상태**: Confirmed — Phase 2 구현 기준  
**적용 범위**: 프론트엔드 이벤트 로깅 / 백엔드 수집 / Aurora5 분석

---

## 개요

DreamTown 사용자 행동을 추적하는 표준 이벤트 정의서입니다.  
모든 이벤트는 이 SSOT를 기준으로 구현·로깅·분석합니다.

> **원칙**
> - 이벤트명은 `snake_case` 고정
> - params는 선택이 아닌 필수 (없으면 `null` 명시)
> - 수집 목적이 없는 이벤트는 추가하지 않는다

---

## 이벤트 정의

---

### 1. `wish_start`

> 소원 입력을 시작한 순간

| 항목 | 내용 |
|------|------|
| 발생 시점 | 소원 입력 화면 진입 |
| 수집 목적 | 진입 경로별 전환율 분석 |

**params**

| 키 | 타입 | 값 | 필수 |
|----|------|----|------|
| `user_id` | string | 사용자 식별자 | ✅ |
| `entry_point` | enum | `home` / `push` / `share` | ✅ |

**예시**
```json
{
  "event": "wish_start",
  "user_id": "u_abc123",
  "entry_point": "share"
}
```

---

### 2. `scene_view`

> 장면 카드가 화면에 노출된 순간

| 항목 | 내용 |
|------|------|
| 발생 시점 | 장면 카드 fade-in 완료 |
| 수집 목적 | 장면 유형별 노출 빈도 / 감정 맥락 분포 |

**params**

| 키 | 타입 | 값 | 필수 |
|----|------|----|------|
| `scene_id` | string | 장면 식별자 (`cablecar` / `observatory` / `cruise` 등) | ✅ |
| `scene_type` | enum | `여행` / `일상` / `쿠폰연결` | ✅ |
| `emotion_context` | string | 노출 당시 감정 맥락 (없으면 `null`) | ✅ |

**예시**
```json
{
  "event": "scene_view",
  "scene_id": "cablecar",
  "scene_type": "여행",
  "emotion_context": null
}
```

---

### 3. `emotion_select`

> 사용자가 감정을 선택한 순간

| 항목 | 내용 |
|------|------|
| 발생 시점 | 감정 버튼 탭 |
| 수집 목적 | 감정 유형별 분포 / intensity 패턴 |

**params**

| 키 | 타입 | 값 | 필수 |
|----|------|----|------|
| `emotion_type` | string | `숨이 놓였어요` / `용기났어요` 등 | ✅ |
| `intensity` | number | `1` (가볍게) / `2` (보통) / `3` (강하게) | ✅ |

**emotion_type 허용값 (v1)**

| 값 | 의미 |
|----|------|
| `숨이 놓였어요` | 안도 / 긴장 해소 |
| `용기났어요` | 결심 / 시작 |
| `설레어요` | 기대 / 흥분 |
| `조용해졌어요` | 평온 / 수용 |
| `생각이 많아요` | 복잡 / 혼란 |

> emotion_type은 이 목록에 없는 값도 허용 (자유 입력 시 as-is 저장)

**예시**
```json
{
  "event": "emotion_select",
  "emotion_type": "용기났어요",
  "intensity": 2
}
```

---

### 4. `coupon_open`

> 쿠폰 상세 화면에 진입한 순간

| 항목 | 내용 |
|------|------|
| 발생 시점 | 쿠폰 상세 카드 진입 |
| 수집 목적 | 쿠폰 → 감정 전환율 / 장면 연결 효과 분석 |

**params**

| 키 | 타입 | 값 | 필수 |
|----|------|----|------|
| `coupon_id` | string | 쿠폰 식별자 | ✅ |
| `trigger_emotion` | string | 진입 직전 감정 (없으면 `null`) | ✅ |
| `scene_id` | string | 연결된 장면 (없으면 `null`) | ✅ |

**예시**
```json
{
  "event": "coupon_open",
  "coupon_id": "cpn_cablecar_001",
  "trigger_emotion": "설레어요",
  "scene_id": "cablecar"
}
```

---

### 5. `conversion_action`

> 사용자가 실제 행동을 취한 순간

| 항목 | 내용 |
|------|------|
| 발생 시점 | 예약 / 저장 / 공유 버튼 탭 |
| 수집 목적 | 전환 유형별 성과 / value 누적 |

**params**

| 키 | 타입 | 값 | 필수 |
|----|------|----|------|
| `action_type` | enum | `book` / `save` / `share` | ✅ |
| `value` | number | 거래 금액 (해당 없으면 `null`) | 선택 |

**action_type 정의**

| 값 | 의미 |
|----|------|
| `book` | 예약 / 결제 완료 |
| `save` | 쿠폰 / 장면 저장 |
| `share` | 공유 |

**예시**
```json
{
  "event": "conversion_action",
  "action_type": "book",
  "value": 35000
}
```

---

### 6. `scene_action_click`

> 장면 카드의 선택 버튼을 클릭한 순간 (감정 peak 후 행동 전환점)

| 항목 | 내용 |
|------|------|
| 발생 시점 | 장면 카드 선택 버튼 탭 |
| 수집 목적 | 장면 → 상품 전환율 측정 |

**params**

| 키 | 타입 | 값 | 필수 |
|----|------|----|------|
| `scene_id` | string | 장면 식별자 | ✅ |
| `scene_type` | enum | `여행` / `일상` / `쿠폰연결` | ✅ |
| `experiment_id` | string | A/B 실험 ID (없으면 생략) | 선택 |
| `variant` | string | `A` / `B` | 선택 |

**예시**
```json
{
  "event": "scene_action_click",
  "scene_id": "cablecar",
  "scene_type": "여행",
  "experiment_id": "coupon_test_1",
  "variant": "B"
}
```

---

### 7. `travel_offer_view`

> 감정 peak 이후 여행 상품 카드가 노출된 순간

| 항목 | 내용 |
|------|------|
| 발생 시점 | 쿠폰/상품 카드 표시 직후 |
| 수집 목적 | 상품 노출 → 전환율 분모 확보 |

> **원칙**: 처음부터 상품 노출 금지. 반드시 감정 peak 이후에만 등장.

**params**

| 키 | 타입 | 값 | 필수 |
|----|------|----|------|
| `offer_id` | string | 상품/쿠폰 식별자 | ✅ |
| `scene_id` | string | 연결된 장면 | ✅ |
| `experiment_id` | string | A/B 실험 ID (없으면 생략) | 선택 |
| `variant` | string | `A` / `B` | 선택 |

**예시**
```json
{
  "event": "travel_offer_view",
  "offer_id": "cpn_cablecar_001",
  "scene_id": "cablecar",
  "experiment_id": "coupon_test_1",
  "variant": "A"
}
```

---

## 이벤트 흐름 (정상 경로)

```
wish_start
  → scene_view
    → emotion_select
      → scene_action_click   ← 선택 클릭 (감정 peak 후)
        → travel_offer_view  ← 상품 노출
          → conversion_action
```

> 각 단계는 독립적으로 발생 가능.  
> `travel_offer_view`는 반드시 `scene_action_click` 이후에만 발생해야 함 (SSOT 원칙).  
> `coupon_open`은 레거시 — 신규 구현은 `scene_action_click` + `travel_offer_view` 사용.

---

## 구현 가이드

### 프론트엔드 로깅 패턴

```js
// 공통 로거 (console.info — MVP 단계)
function logEvent(event, params) {
  console.info(JSON.stringify({
    event,
    ...params,
    ts: new Date().toISOString(),
  }));
}

// 예시 호출
logEvent('scene_view', {
  scene_id: 'cablecar',
  scene_type: '여행',
  emotion_context: null,
});
```

### 백엔드 수집 (Phase 2 이후)

- 수집 엔드포인트: `POST /api/dt/events` (미구현)
- DB 테이블: `dt_events` (미구현)
- Aurora5 분석 대상: `scene_view` + `emotion_select` + `conversion_action`

---

## 버전 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2026-04-04 | 최초 작성 — 5개 이벤트 정의 |
