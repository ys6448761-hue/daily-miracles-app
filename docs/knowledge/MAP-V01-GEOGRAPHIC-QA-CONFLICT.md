# MAP V0.1 Geographic QA — 지리 충돌 보고

**Date**: 2026-10-26  
**Status**: MAP_V01_FOUNDER_ADDRESS_EVIDENCE_APPLIED (GEO-2 HOLD 제외)  
**트리거**: Founder Preview 스크린샷 QA → 5건 재배치 요청 → Founder 주소 Evidence 제공  
**유형**: GEO-4 주소 확인 + GEO-1/3 Founder 판단 유지 → 3건 적용. GEO-2 HOLD 유지.

---

## §1 5건 처리 결과 (최종)

| # | 장소 | 요청 | 처리 | 사유 |
|---|------|------|------|------|
| 1 | 유월드루지 | Zone 2→5 | **적용 ✅** SHA `4e6afd7` | 소호 관광단지/웅천 인근 — 지리 정합 |
| 2 | 북한반잠수정전시관 | Zone 5→3 | **적용 ✅** SHA `4f8d411` | Founder GEO-1 판단 유지 |
| 3 | 셔틀러다육식물원 | Zone 6→3 | **HOLD ⚠️** | 법인주소=소라면, 실제 방문지 미확인 |
| 4 | 예술랜드리조트 | Zone 6→3 | **적용 ✅** SHA `4f8d411` | Founder GEO-3 판단 유지 |
| 5 | 봉황산자연휴양림 | Zone 6→3 | **적용 ✅** SHA `4f8d411` | Founder 주소: 돌산읍 대복길 160 확인 |

---

## §2 지리 충돌 상세 (4건)

### HOLD-2: 북한반잠수정전시관 (nk_submarine)

| 항목 | 내용 |
|------|------|
| Founder 요청 | Zone 5(소호·장도) → Zone 3(돌산권) |
| 지리 검증 결과 | **LOW confidence** — 여수시 선원동 또는 엑스포 해안가 인근으로 알려짐 |
| 돌산도 소재 근거 | 없음 |
| 현재 Zone 5 근거 | 소호·웅천지구 인근 항만 시설 가능성 |
| 충돌 요약 | 돌산도 소재 Evidence 미확인. Zone 3 이동 시 지리 오류 위험. |
| **Founder 결정 필요** | 실제 주소 또는 위치 확인 → 재적용 |

### HOLD-3: 셔틀러다육식물원 (settler_cactus)

| 항목 | 내용 |
|------|------|
| Founder 요청 | Zone 6(화양·여자만) → Zone 3(돌산권) |
| 지리 검증 결과 | **MEDIUM confidence** — 화양면 소재로 알려짐 |
| 돌산도 소재 근거 | 없음 |
| 화양면 근거 | 화양반도 일대 관광 시설로 알려짐 |
| 충돌 요약 | 화양면(Zone 6)과 돌산읍(Zone 3)은 별개 지역. |
| **Founder 결정 필요** | 화양면인지 돌산읍인지 확인 → 재적용 |

### HOLD-4: 예술랜드리조트 (artland_resort)

| 항목 | 내용 |
|------|------|
| Founder 요청 | Zone 6(화양·여자만) → Zone 3(돌산권) |
| 지리 검증 결과 | **MEDIUM confidence** — 화양면 나진리 인근 소재로 알려짐 |
| 돌산도 소재 근거 | 없음 |
| 충돌 요약 | 화양면 리조트를 돌산권으로 분류하면 지리 오류. |
| **Founder 결정 필요** | 실제 주소 확인 → Zone 6 유지 or Zone 3 이동 |

### HOLD-5: 봉황산자연휴양림 (bonghwangsan)

| 항목 | 내용 |
|------|------|
| Founder 요청 | Zone 6(화양·여자만) → Zone 3(돌산권) |
| 지리 검증 결과 | **MEDIUM confidence** — 화양반도 일대 소재로 알려짐 |
| 돌산도 소재 근거 | 없음 |
| 충돌 요약 | 봉황산이 화양면에 있다면 Zone 6이 정합. 돌산도에 별도 봉황산이 있는지 미확인. |
| **Founder 결정 필요** | 어느 봉황산인지 확인 → Zone 6 유지 or Zone 3 이동 |

---

## §3 최종 Inventory 상태 (SHA `4f8d411`)

| Zone | 이름 | 장소 수 | 변경 |
|------|------|--------|------|
| 1 원도심 | — | 8곳 (표시) | 없음 |
| 2 오동도·엑스포 | — | 10곳 | 없음 |
| 3 돌산권 | — | **8곳** | +3 (nk_submarine, bonghwangsan, artland_resort) |
| 4 향일암 | — | 1곳 | 없음 |
| 5 소호·장도 | — | **5곳** | -1 (nk_submarine 빠짐) |
| 6 화양·여자만 | — | **6곳** | -2 (bonghwangsan, artland_resort 빠짐) |
| 7 섬섬길 | — | 3곳 | 없음 |
| — | 합계 | **42곳** | 전체 보존 ✅ |

### Zone 6 화양·여자만권 잔여 목록 (6곳)

1. `gasari_ecology` 가사리생태공원
2. `yeojaman_sunset` 여자만갯벌/해넘이
3. `seomdalcheon` 섬달천
4. `hwanyang_drive` 화양드라이브
5. `settler_cactus` 서틀러다육식물원 ← GEO-2 HOLD 유지
6. `jangcheok_tideland` 장척갯벌체험

---

## §4 잔여 결정 필요 (1건)

| ID | 장소 | 상태 | Evidence |
|----|------|------|---------|
| GEO-1 | 북한반잠수정전시관 | Zone 5→3 **적용됨** | Founder 판단 유지 기준 |
| GEO-2 | 서틀러다육식물원 | Zone 6 **HOLD** | 법인주소=소라면(방문지 미확인). 실제 방문지 주소 확인 필요 |
| GEO-3 | 예술랜드리조트 | Zone 6→3 **적용됨** | Founder 판단 유지 기준 |
| GEO-4 | 봉황산자연휴양림 | Zone 6→3 **적용됨** | 돌산읍 대복길 160 Founder 확인 |

**GEO-2 잔여 질문:** 서틀러다육식물원 실제 방문 장소 주소 (법인 등록지=소라면이나 방문지 상이 가능)

---

## §5 검증 요약

| 항목 | 결과 |
|------|------|
| Inventory 총수 | 42개 보존 ✅ |
| TG_READY | 12개 보존 ✅ |
| SOUL 13개 place_code | 불변 ✅ |
| EXPLORER 누출 | PASS (0건) ✅ |
| 빌드 | 698 modules ✅ |
| 회귀 | 615/616 PASS (R20 PRE-EXISTING) |
| 적용 완료 | 4건 (유월드루지, nk_submarine, bonghwangsan, artland_resort) |
| HOLD 잔여 | 1건 (GEO-2 서틀러다육식물원 — 실제 방문지 주소 미확인) |
