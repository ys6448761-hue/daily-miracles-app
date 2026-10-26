# MAP V0.1 권역 정합성 확인 — Founder 15곳 ↔ Inventory 대조

**Date**: 2026-10-26  
**Status**: ZONE_FOUNDER_LIST_RECONCILED  
**기준 Inventory**: `yeosuMapData.js` (35개 장소)  
**기준 최종안**: `MAP-V01-ZONE-FINAL-PROPOSAL.md` SHA 3e8707b  
**유형**: 대조·검증 문서. 코드 변경 없음.

---

## §1 이전 최종안 수정 필요 사항 (선 보고)

**이전 최종안 오류: 돌산대교 Zone 1 이동 제안 — 철회**

| 항목 | 이전 최종안 | Founder 원도심 8곳 목록 | 판정 |
|------|-----------|----------------------|------|
| 돌산대교 | Zone 3→1 이동 제안 | **목록에 없음** | Zone 3 유지로 원상 복귀 |
| 종포해양공원 | Zone 2→1 이동 제안 | **목록에 있음** ✅ | 이동 확정 대기 |

**수정 사유:** Founder가 직접 지정한 원도심 8곳에 돌산대교 미포함. 빈자리는 진남관, 오포대 (신규 INVENTORY_MISSING).

---

## §2 Founder 원도심 8곳 ↔ Inventory 대조표

| # | Founder 지정 | Inventory code | 현재 Zone | 상태 | 판정 |
|---|------------|---------------|---------|------|------|
| 1 | 이순신광장 | `lee_soon_shin_plaza` | 1 | TG_READY | **EXISTING_MATCH** ✅ |
| 2 | 하멜등대 | `hamel_lighthouse` | 1 | TG_READY | **EXISTING_MATCH** ✅ |
| 3 | 낭만포차거리 | `romantic_pojangmacha` | 1 | TG_READY | **EXISTING_MATCH** ✅ |
| 4 | 고소동 천사벽화골목 | `gosodong_mural` | 1 | EXPLORER | **EXISTING_MATCH** ✅ |
| 5 | 여수 수산시장 | `yeosu_fish_market` | 1 | EXPLORER (UV-2) | **EXISTING_MATCH** ✅ |
| 6 | 종포해양공원 | `marine_park` | **2** | TG_READY | **ZONE_MISMATCH** ← Zone 1 이동 필요 |
| 7 | 진남관 | — | — | — | **INVENTORY_MISSING** |
| 8 | 오포대 | — | — | — | **INVENTORY_MISSING** |

**결과:**
- EXISTING_MATCH: 5곳 ✅
- ZONE_MISMATCH: 1곳 (종포해양공원)
- INVENTORY_MISSING: 2곳 (진남관, 오포대)

---

## §3 Founder 오동도·엑스포 7곳 ↔ Inventory 대조표

| # | Founder 지정 | Inventory code | 현재 Zone | 상태 | 판정 |
|---|------------|---------------|---------|------|------|
| 1 | 오동도 | `odongdo` | 2 | TG_READY | **EXISTING_MATCH** ✅ |
| 2 | 스카이타워 | `sky_tower` | 2 | TG_READY | **EXISTING_MATCH** ✅ |
| 3 | 해상케이블카 자산탑승장 | `cablecar` | 2 | TG_READY | **ALIAS_MATCH** ⚠️ |
| 4 | 여수엑스포역 | — | — | — | **INVENTORY_MISSING** |
| 5 | 엑스포 바닷길 | `yeosu_expo_park`? | 2 | TG_READY | **VERIFICATION_PENDING** |
| 6 | 만성리해수욕장 | — | — | — | **INVENTORY_MISSING** ⚠️ 지리 이슈 |
| 7 | 여수오션크루즈 | — | — | — | **INVENTORY_MISSING** |

**결과:**
- EXISTING_MATCH: 2곳
- ALIAS_MATCH: 1곳 (케이블카 — 코드 단위 vs Founder의 "자산탑승장" 단위)
- VERIFICATION_PENDING: 1곳 (엑스포 바닷길 = 엑스포공원 alias 여부 미확인)
- INVENTORY_MISSING: 3곳

---

## §4 ALIAS_MATCH 상세 — 케이블카

| 항목 | Founder 지정 | 현재 Inventory |
|------|------------|--------------|
| 명칭 | 해상케이블카 자산탑승장 | `cablecar` (케이블카) |
| 코드 | — | `cablecar` |
| Zone | 2 | 2 |
| SOUL | — | Phase 1 완료 (단일 entity) |
| 차이 | "자산탑승장" = 여수 본토 쪽 탑승장 | 케이블카 전체를 단일 entity로 표현 |

**해석 옵션:**
- A: `cablecar` = "해상케이블카 자산탑승장" alias → code 유지, SOUL 변경 없음
- B: 탑승장을 분리 (자산탑승장 code + 돌산탑승장 code) → 대규모 SOUL 변경 필요 → 현 단계 불가

**권고:** 옵션 A. `cablecar` ALIAS_MATCH로 처리. Founder 확인 필요.

---

## §5 VERIFICATION_PENDING 상세 — 엑스포 바닷길

| 항목 | Founder 지정 | Inventory 후보 |
|------|------------|-------------|
| 명칭 | 엑스포 바닷길 | `yeosu_expo_park` (엑스포공원) |
| 설명 | 2012 여수엑스포 해안 산책로 | 엑스포 부지 전체 |
| 관계 | 엑스포 부지 내 해안 보행로 | 부지 전체를 하나의 entity로 표현 |

**가능성:**
- 동일: 엑스포공원 = 엑스포 바닷길 포함 → ALIAS_MATCH
- 별도: 바닷길 = 산책로 특화 경험 → 별도 code 신규 추가 필요

**판정:** Founder 확인 필요. 자동 결정 불가.

---

## §6 INVENTORY_MISSING 5곳 상세

### 6-1. 진남관 (鎭南館)

| 항목 | 내용 |
|------|------|
| 소재지 | 여수시 군자동 (고소동 인근, 이순신광장 북서쪽 약 500m) |
| 성격 | 국보 제304호. 조선시대 수군 통제영. 이순신 장군 역사 유적. |
| 지리 소속 | 원도심 ✅ (Founder 원도심 8곳에 포함) |
| Inventory | 없음 |
| TG 후보 | TG_READY 또는 EXPLORER — Founder 결정 필요 |
| SOUL 연결 | 없음. 추가 시 Phase N 별도 설계 필요 |

### 6-2. 오포대 (午砲臺)

| 항목 | 내용 |
|------|------|
| 소재지 | 여수시 고소동 (고소동 천사벽화골목 인근 언덕) |
| 성격 | 구한말 시간을 알리던 포대. 역사 유적. 전망 포인트. |
| 지리 소속 | 원도심 고소동 ✅ (Founder 원도심 8곳에 포함) |
| Inventory | 없음 |
| TG 후보 | EXPLORER (별도 검증 필요) — Founder 결정 필요 |
| SOUL 연결 | 없음 |

### 6-3. 여수엑스포역

| 항목 | 내용 |
|------|------|
| 소재지 | 여수시 덕충동 (KTX 여수엑스포역) |
| 성격 | 교통 거점. 여수 KTX 종착역. |
| 지리 소속 | 오동도·엑스포 북단 ⚠️ (Founder가 Zone 2 포함 지정) |
| Inventory | 없음 |
| 특이사항 | "장소"(명소) vs "교통 인프라" 구분 필요. 지도 표시 적합성 Founder 결정 필요. |

### 6-4. 만성리해수욕장

| 항목 | 내용 |
|------|------|
| 소재지 | 여수시 만흥동 만성리 (검은 모래 해변) |
| 지리 실제 | 오동도에서 북쪽 약 5km. 다른 방향. |
| Founder 배치 | 오동도·엑스포권 (Zone 2) |
| 지리 충돌 | Zone 2와 다른 방향 ⚠️ |
| Inventory | 없음 |
| TG 후보 | VERIFY 또는 EXPLORER — Founder 결정 필요 |
| 비고 | Founder가 Zone 2에 포함한다고 결정하면 그대로 따른다. 지리 충돌은 기록으로만 남긴다. |

### 6-5. 여수오션크루즈

| 항목 | 내용 |
|------|------|
| 소재지 | 여수항 일대 (선착장 위치 확인 필요) |
| 성격 | 여수 항구 유람선/크루즈 서비스 |
| 지리 소속 | 선착장 위치에 따라 원도심 or Zone 2 |
| Founder 배치 | 오동도·엑스포권 (Zone 2) |
| Inventory | 없음 |
| TG 후보 | TG_READY 또는 EXPLORER — Founder 결정 필요 |
| 비고 | "서비스/활동" vs "장소/선착장" 구분 필요 |

---

## §7 현재 Inventory에 있지만 Founder 15곳에 없는 장소

| code | 이름 | 현재 Zone | 상태 | 비고 |
|------|------|---------|------|------|
| `jaisan_park` | 자산공원 | 2 | TG_READY | Founder 원도심/오동도 어디에도 없음 |
| `yeosu_expo_park` | 엑스포공원 | 2 | TG_READY | "엑스포 바닷길" alias 가능성 있음 |
| `aquaplanet` | 아쿠아플라넷 | 2 | EXPLORER | Founder 목록 없음 |
| `yworld_luge` | 유월드루지 | 2 | EXPLORER | Founder 목록 없음 |
| `dolsan_daegyo` | 돌산대교 | 3 | TG_READY | 최종안에서 Zone 1 이동 제안했으나 Founder 목록 없음 → Zone 3 유지 |
| `dolsan_nightscape` | 돌산공원 | 3 | TG_READY | Founder 목록 없음 (돌산 관련 없음) |
| Zone 3·4·5·6·7 전체 | — | — | — | Founder 지정 15곳에 모두 없음 |

**자산공원 이슈:**
- 이전 최종안에서 Zone 2 유지 권고 (케이블카 자산탑승장 인접)
- Founder 15곳 어디에도 없음
- Zone 2에 남겨두면 Founder 7곳 + 자산공원 = 8곳으로 구성됨
- 별도 결정 필요

---

## §8 종합 판정표

| 장소 | Founder 배치 | Inventory | 판정 | 조치 |
|------|------------|---------|------|------|
| 이순신광장 | 원도심 | Zone 1 TG_READY | EXISTING_MATCH ✅ | 없음 |
| 하멜등대 | 원도심 | Zone 1 TG_READY | EXISTING_MATCH ✅ | 없음 |
| 낭만포차거리 | 원도심 | Zone 1 TG_READY | EXISTING_MATCH ✅ | 없음 |
| 고소동 천사벽화골목 | 원도심 | Zone 1 EXPLORER | EXISTING_MATCH ✅ | 없음 |
| 여수 수산시장 | 원도심 | Zone 1 EXPLORER UV-2 | EXISTING_MATCH ✅ | UV-2 좌표 확인 별도 |
| 종포해양공원 | 원도심 | Zone 2 TG_READY | ZONE_MISMATCH | Zone 2→1 이동 (승인 후) |
| 진남관 | 원도심 | **없음** | INVENTORY_MISSING | Founder TG 상태 결정 후 추가 |
| 오포대 | 원도심 | **없음** | INVENTORY_MISSING | Founder TG 상태 결정 후 추가 |
| 오동도 | 오동도·엑스포 | Zone 2 TG_READY | EXISTING_MATCH ✅ | 없음 |
| 스카이타워 | 오동도·엑스포 | Zone 2 TG_READY | EXISTING_MATCH ✅ | 없음 |
| 해상케이블카 자산탑승장 | 오동도·엑스포 | Zone 2 `cablecar` | ALIAS_MATCH ⚠️ | Founder alias 확인 필요 |
| 여수엑스포역 | 오동도·엑스포 | **없음** | INVENTORY_MISSING | 교통 거점 표시 여부 Founder 결정 필요 |
| 엑스포 바닷길 | 오동도·엑스포 | `yeosu_expo_park`? | VERIFICATION_PENDING | alias 또는 별도 code 결정 필요 |
| 만성리해수욕장 | 오동도·엑스포 | **없음** | INVENTORY_MISSING ⚠️ | Zone 2 지정 시 지리 충돌 기록. Founder 결정 따름. |
| 여수오션크루즈 | 오동도·엑스포 | **없음** | INVENTORY_MISSING | 선착장 위치 + TG 상태 Founder 결정 필요 |

---

## §9 최종 승인 가능한 변경 목록 (현재 Inventory 기준)

**즉시 승인 가능 (코드 최소 변경):**

| 변경 | 내용 | 근거 |
|------|------|------|
| `marine_park.zone` 2→1 | 종포해양공원 Zone 1 이동 | Founder 원도심 8곳 포함 ✅ |

**철회 (이전 최종안에서 수정):**

| 변경 | 사유 |
|------|------|
| `dolsan_daegyo.zone` 3→1 이동 | Founder 원도심 8곳에 없음 → Zone 3 유지 |

---

## §10 Founder 결정 최소화 (5개)

| ID | 결정 항목 | 옵션 |
|----|---------|------|
| **FC-1** | 진남관 추가 TG 상태 | TG_READY (SOUL 추후) / EXPLORER (탐색만) |
| **FC-2** | 오포대 추가 TG 상태 | EXPLORER (역사 유적, 소규모) / VERIFY |
| **FC-3** | 케이블카 alias 확인 | `cablecar` = "해상케이블카 자산탑승장"으로 통일 / 자산탑승장 별도 code 분리 (대규모 SOUL 변경 필요) |
| **FC-4** | 엑스포 바닷길 | `yeosu_expo_park` alias / 별도 `expo_boardwalk` code 신규 추가 |
| **FC-5** | 여수엑스포역·만성리·여수오션크루즈 | Zone 2 추가 (VERIFY 또는 EXPLORER) / 현재 보류 |

**자동 결정 불가 사항 (Founder 직접 결정):**
- FC-1~5 모두

---

## §11 판정

```
ZONE_FOUNDER_LIST_RECONCILED
```

| 항목 | 결과 |
|------|------|
| Founder 15곳 대조 | ✅ 완료 |
| EXISTING_MATCH | 7곳 (원도심 5 + 오동도·엑스포 2) |
| ALIAS_MATCH | 1곳 (케이블카) |
| ZONE_MISMATCH | 1곳 (종포해양공원 → Zone 1) |
| VERIFICATION_PENDING | 1곳 (엑스포 바닷길) |
| INVENTORY_MISSING | 5곳 (진남관, 오포대, 엑스포역, 만성리, 오션크루즈) |
| 이전 최종안 수정 | 돌산대교 Zone 3→1 이동 취소 |
| 즉시 승인 가능 변경 | 종포해양공원 Zone 2→1 (1개) |
| Founder 결정 필요 | FC-1~5 (5개) |
| 코드 변경 | 없음 |
