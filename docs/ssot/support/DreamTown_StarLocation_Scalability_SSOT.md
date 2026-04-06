# DreamTown Star Location Scalability SSOT

Version: v1.0
Owner: Aurora5
Status: Active
Last Updated: 2026-04-06
Updated By: Code (Claude Code)

---

## 선언

Star Location 시스템은 초기 확장형으로 설계한다.
**1차 운영 기준: 12 zones × 1,000 slots = 12,000 stars**

단, 10만 이상 확장을 위해 아래 원칙을 항상 유지한다.

---

## 4대 원칙

### 원칙 1 — Zone은 확장 가능한 마스터 데이터다

Zone은 고정 상수가 아니다.
`star_zones` 테이블이 유일한 진실(SSOT)이며, 코드는 이 테이블을 읽어 동작해야 한다.

```
❌ 금지: const ZONES = ['S-1', 'S-2', ...] — 코드 내 하드코딩
✅ 허용: SELECT zone_code FROM star_zones WHERE is_active = true
```

### 원칙 2 — 별 배정은 활성 zone 수를 기준으로 결정한다

새 별 생성 시 zone 결정 공식:

```
hash % activeZoneCount
```

`activeZoneCount`는 실행 시점의 `star_zones` 활성 레코드 수다.
zone이 추가될수록 새 별들이 더 넓게 분산된다.

### 원칙 3 — 기존 별의 위치는 절대 재배치하지 않는다

이미 `star_locations`에 기록된 별은 zone 확장 후에도 이동하지 않는다.
`ON CONFLICT (star_id) DO NOTHING`이 이를 코드 수준에서 보장한다.

```
wish_id → hash → zone 결정 → DB INSERT (star_id 중복 시 무시)
```

기존 별은 생성 당시의 zone/slot/좌표를 영구적으로 유지한다.

### 원칙 4 — 확장 시 slot 증가보다 zone 세분화를 우선한다

| 접근 | 판단 |
|------|------|
| slot_number 범위 확대 (1000 → 5000) | ❌ 비추천 — zone당 밀도 증가, 위치 의미 훼손 |
| 새 zone 추가 (zone_code 신규 INSERT) | ✅ 권장 — 공간 해상도 유지, 무중단 확장 |

zone 추가 시 기존 별 영향 없음. 신규 별부터 새 zone 배정 가능.

---

## 용량 계획

| 단계 | zones | slots/zone | 최대 stars | 트리거 |
|------|-------|-----------|-----------|--------|
| 초기 | 12 | 1,000 | 12,000 | 지금 |
| 1차 확장 | 36 | 1,000 | 36,000 | 누적 8,000별 도달 시 |
| 2차 확장 | 100+ | 1,000 | 100,000+ | 누적 25,000별 도달 시 |

slot은 1,000으로 고정. zone만 세분화한다.

---

## DB 스키마 요구사항

향후 확장을 위해 `star_zones`에 `is_active` 컬럼 추가 예정.

```sql
-- 미래 마이그레이션 (확장 시점에 적용)
ALTER TABLE star_zones ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

현재는 전체 zone이 활성 상태이므로 `COUNT(*)`와 동일하다.

---

## 노출 정책 (불변)

| 항목 | 정책 |
|------|------|
| `constellation_name` | UI 노출 금지 |
| `place_name` | UI 노출 금지 |
| `lat`, `lng` | 외부 API 공개 금지 — 내부 서비스 전용 |

---

## 참조

- 구현: `services/starLocationService.js`
- 마이그레이션: `051_dt_star_zones.sql`, `052_dt_star_locations.sql`
- 네이밍 규칙: `DreamTown_Naming_System_SSOT.md` §9
