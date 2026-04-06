# DreamTown Star Experience Principle SSOT

Version: v1.0
Owner: Aurora5
Status: Active
Last Updated: 2026-04-06
Updated By: Code (Claude Code)

---

## 선언

별은 생성 순간 완전히 드러나지 않는다.
시간과 행동에 따라 점진적으로 의미가 열리는 구조를 따른다.

---

## 핵심 구조

```
생성 시점        →   감정만 공개
시간 + 행동 후   →   위치와 의미 공개
```

별은 탄생과 동시에 "존재"하지만, 온전한 "의미"는 여정을 통해 열린다.

---

## 공개 단계

| 단계 | 트리거 | 공개 정보 |
|------|--------|-----------|
| **0. 탄생** | 별 생성 즉시 | 별 이름, 은하, 소원 감정 |
| **1. 감정 열림** | 탄생 즉시 | `wish_text` 또는 `growth_log_text` |
| **2. 위치 활성** | `is_activated = true` | 지리적 zone 연결 (내부 처리) |
| **3. 의미 공개** | `is_visible = true` | 위치 기반 경험 진입 가능 |

---

## 구현 원칙

### 감정 우선 (Emotion First)
초기에는 감정 레이어만 노출한다.

```
constellation_name   →   UI 노출 금지 (의미 레이어)
place_name           →   UI 노출 금지 (위치 레이어)
lat / lng            →   외부 공개 금지 (내부 서비스 전용)
```

### 점진적 공개 (Progressive Reveal)
`star_locations` 테이블의 두 플래그가 단계를 제어한다.

```sql
is_activated = false   -- 위치 배정 완료, 아직 활성화 전
is_activated = true    -- 위치 활성화됨 (activated_at 기록)
is_visible   = true    -- 사용자에게 위치 경험 진입 허용
```

### 재배치 금지 (Immutable Position)
한번 열린 위치는 바뀌지 않는다.
별의 좌표는 `wish_id` 해시로 결정되며 이후 불변이다.

---

## 연결 시스템

이 원칙은 다음 시스템과 연동된다.

| 시스템 | 역할 |
|--------|------|
| `star_locations` | 위치 + 활성화 상태 저장 |
| `star_visits` | 실제 방문 기록 |
| `star_zones` | zone 마스터 (place_name / constellation_name) |
| `starLocationService.js` | wish_id 기반 결정론적 위치 할당 |

---

## 참조

- 위치 시스템: `DreamTown_StarLocation_Scalability_SSOT.md`
- 네이밍 규칙: `DreamTown_Naming_System_SSOT.md` §9
- 세계관: `DreamTown_Universe_Bible.md`
