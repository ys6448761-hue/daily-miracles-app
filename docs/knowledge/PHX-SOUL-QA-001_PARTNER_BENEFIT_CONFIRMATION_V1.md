# PHX-SOUL-QA-001 — Founder 제휴 혜택 확인 기록 및 데이터 정리 계획 (§68, V1, 2026-11-20)

> §68. Founder 직접 확인 결과를 기록한다. 기록 및 계획 단계이며 실행하지 않는다.
> 서비스 코드 수정 없음. 운영 DB 연결·변경 없음. Migration 없음. 실제 LLM 호출 없음.
> GitHub push·PR·merge 없음. Render 배포 없음. Hybrid 운영 활성화 없음. 고객 노출 변경 없음.
> 기준: local / remote HEAD `10f52dc`. Production Release HOLD. 개인정보 법률 검토 BLOCKED.
> 선행 기록: §66 (`PHX-SOUL-QA-001_CAFE_PARTNER_KNOWLEDGE_VERIFICATION_V1.md`), §67 (`PHX-SOUL-QA-001_FOUNDER_CONFIRMATIONS_V1.md`). 두 문서 원문은 삭제·변경하지 않는다 (§66 의 제휴 "미확인" 판정은 본 문서에서 최신 Founder 결정으로 갱신됨).

## Guardian Preflight Report (기록 전)

```
### Guardian Preflight Report

Requested Change:
  Founder 직접 확인: 카페 7곳의 아메리카노 무료 혜택 매장 합의 완료 → 제휴 상태 Founder Confirmed 기록.
  공통 이용 조건 유지. 모이핀 무료 음료 혜택 비대상, 10% 할인 신규 추진 (Approved / Partner Pending / Exposure HOLD).
  이번 단계는 기록 및 데이터 정리 계획.

Existing Assets Found:
  - partner_master.csv (8행, status=active), partner_master_seed.sql (혜택·상품 연결)
  - migration 216 (info_status, affiliation_status = confirmed 가능 값 존재)
  - travelGuideService.js: CONFIRMED_BENEFIT_PARTNERS = [] (허용 목록 비어 있음), isConfirmedBenefitPartner(), 혜택 쿼리 is_active=true
  - §66 조사 (카페 검증표), §67 Founder 확정 (엘리스테이·포트앤포트 관계, 하루 한방카페 명칭, 모이핀 10%)

Repositories Inspected:
  daily-miracles-mvp (CSV, Seed, migration 216, travelGuideService.js 혜택 게이트) — 읽기 전용

Relevant Files:
  docs/ssot/ops/partner_master.csv, docs/ssot/ops/partner_master_seed.sql,
  database/migrations/216_dt_partners_sowonpass_fields.sql, services/travelGuideService.js (읽기만)

Relevant Databases:
  운영 DB (dt_partners, dt_benefits, dt_product_benefits): 연결·변경 금지. 적재 여부 미확인.

Change Classification:
  기록 (Founder Decision) + 데이터 정리 계획. 코드·데이터 변경 없음.

Connection Opportunity:
  기존 혜택 허용 목록 구조 (CONFIRMED_BENEFIT_PARTNERS) 와 affiliation_status 로 승인 상태 표현 가능. 신규 설계 없음.

Duplication Risk:
  낮음. 기존 조사·확정 기록 보존, 상태만 최신화.

Data Risk:
  높음. 허용 목록이 비어 있어 현재 혜택은 노출되지 않음. 활성화 시 혜택 노출 + 모이핀 신규 할인 노출 위험. 활성화는 별도 승인.

Recommended Approach:
  1) Founder 확인 7곳 제휴 상태 기록 (혜택 승인 ≠ 장소 정보 검증)
  2) CSV·Knowledge·코드 게이트와 대조
  3) 정리 후보 목록화 (실행 금지)
  4) 모이핀 무료 비활성화 + 10% HOLD 등록의 안전성 점검 (노출 차단 2중 확인)
  5) Place ID·데이터 연결 기록
  6) H07·H15 용 관광 정보와 승인 혜택 정보 분리

Questions Requiring Decision:
  Q68-1 "엠파스파레 프롬나드" 의 관리명 확정 (프롬나드 / 엠파스파레 프롬나드)
  Q68-2 CSV 혜택 문구 ("N인 이용 시 1인 무료") 를 공통 조건 (2~4인, 일행당 1잔) 으로 정정할지
  Q68-3 혜택 허용 목록 (CONFIRMED_BENEFIT_PARTNERS) 에 7곳을 추가하는 시점과 승인 절차
  Q68-4 카페 이름 노출 (dt_partners active, 혜택 없이도 여정 블록에 표시) 허용 여부
  Q68-5 모이핀 Seed 의 "별빛항로 첫 번째 쉼" 문구 유지 여부 (SSOT 상 쉼 장소 불일치 기록 있음)

Implementation Status: READY (기록 및 계획 전용. 코드·DB·데이터 변경은 Q68-3 등 승인 후 별도 Preflight)
```

## 1. Founder 직접 확인 기록

| 항목 | 확정 내용 | 상태 |
|---|---|---|
| 대상 | 카페 7곳 (아래 §2) | — |
| 확인 내용 | 아메리카노 무료 제공 혜택에 대해 매장과 **합의 완료** | **Founder Confirmed (제휴 상태)** |
| §66 갱신 | §66 의 "제휴 승인 근거 없음 (M)" 판정을 최신 Founder 결정으로 갱신 | 갱신 |
| 증거 보존 | §66 조사 Evidence 는 삭제하지 않음 | 보존 |

범위 주의: 제휴 승인 확인은 **바다 전망, 주소, 영업 시간, 접근성 검증을 의미하지 않는다.** 이 항목들은 §66 판정을 그대로 유지한다 (아래 §2 에서 구분 표기).

## 2. 카페 7곳 제휴 승인 상태

| # | Founder 확인 명칭 | CSV / Seed 명칭 (partner_code) | 제휴 상태 | 장소 정보 (§66 유지) | 비고 |
|---|---|---|---|---|---|
| 1 | 엠파스파레 프롬나드 | 프롬나드 (YS-CF-001) | Founder Confirmed | E (제3자 후기) | Q68-1: 관리명 확정 필요 |
| 2 | 더 포레스트랜드 | 더 포레스트랜드 (YS-CF-002) | Founder Confirmed | E | 영업 시간 C (§66) |
| 3 | 엘리스테이 · 포트앤포트 | 엘리스테이 카페 (YS-CF-003) | Founder Confirmed | 바다 전망 V (공식 자기 소개), 영업 V (공식 페이지, 기준일 미표기), 번지·전화 C | §67 관계 확정. CSV 명칭 정정 후보 |
| 4 | 라또아 | 라또아 카페 (YS-CF-004) | Founder Confirmed | 바다 전망 M (근거 없음), 영업·전화 C | 별공방 `yeosu_lattoa_cafe` 와 별개 |
| 5 | 카프아일랜드 | 카프아일랜드 (YS-CF-005) | Founder Confirmed | E, 전화 C | 공식 사이트 접근 불가 |
| 6 | 메리엘 | 메리엘 카페 (YS-CF-006) | Founder Confirmed | E (단일 출처 영업) | 상호 표기 혼용 (메리얼) |
| 7 | 하루 한방카페 | 카페하루 (YS-CF-007) | Founder Confirmed | M (주소·전화·영업·바다 전망 근거 없음) | §67: 명칭 통일, Alias 보존, Place ID 1480770989 |

모이핀 (YS-CF-008): 제휴 상태 **별도 처리** (§4). 이번 7곳 확정에 포함되지 않는다.

## 3. 공통 혜택 조건 (Founder 지정, 유지)

| 항목 | 조건 |
|---|---|
| 혜택 내용 | 아메리카노 1잔 무료 |
| 대상 | 실제 방문 일행 2인 이상 4인 이하 |
| 단위 | 개인당이 아닌 **일행당 1잔** |
| 업체별 | 업체별 주문 조건 적용 |
| 금지 | 미확인 추가 혜택 생성 금지 |
| 예외 | 개별 매장의 세부 조건이 다르면 별도 확인 (현재 기록된 예외 없음) |

CSV 와의 대조 (Q68-2):
- CSV `benefit_description` 은 "2인 이용 시 1인 무료 / 3인 이용 시 1인 무료 / 4인 이용 시 1인 무료" 로 되어 있다. 일행당 1잔 의미와 대체로 같으나 문구가 다르고, **1인 (단독 방문) 과 5인 이상 조건은 CSV 에 명시되지 않았다.** 공통 조건 문구로 정정할지 Founder 확인 필요.
- V31 사이트의 일반 카페 규칙 ("2인 이상 4인 이하 실제 방문 일행당 아메리카노 1잔 무료", §66 R7) 은 위 공통 조건과 일치한다.

## 4. 모이핀 (YS-CF-008) — 혜택 처리

| 항목 | 상태 | 근거 |
|---|---|---|
| 기존 무료 음료 (아메리카노 1인 무료) | **승인 대상 아님**. 차단 정책 유지 | Founder §68 |
| 신규 할인 | **10% 할인 추진** | Founder §67 Approved |
| 파트너 확인 | **Pending** (매장 합의 미완료) | §67 |
| 고객 노출 | **HOLD** | §67, §68 |
| 장소 연결 (별빛항로) | **유지** | §68 |
| 제휴 상태 (7곳 확정 목록) | 포함되지 않음 | §68 §2 |

모이핀 "제휴 상태 Founder Confirmed" 로 기록하지 않는다. 확정 대상은 무료 음료 혜택 기준 7곳이며 모이핀은 제외되었다.

## 5. 데이터 정리 후보 (실행 금지, 승인 필요)

| # | 대상 | 현재 | 후보 변경 | 필요 승인 |
|---|---|---|---|---|
| C1 | CSV 7행 제휴 상태 | `status=active` (상태 의미 불명확), 승인 근거 필드 없음 | 제휴 상태 열 추가 또는 DB `affiliation_status='confirmed'` 매핑 (이 경우 `info_status` 는 `unverified` 유지) | 스키마 방식 선택 (Q68-3 과 함께) |
| C2 | CSV 7행 혜택 문구 | "N인 이용 시 1인 무료" | 공통 조건 문구로 정정 | Q68-2 |
| C3 | CSV 엘리스테이 행 명칭 | "엘리스테이 카페" | 관리명 "포트앤포트" 또는 Alias 병기 | §67 관계 확정에 따름 (명칭 정책 Q68-1 과 함께) |
| C4 | CSV 하루 한방카페 행 명칭 | "카페하루" | 관리명 "하루 한방카페", Alias "하루 한방", "카페하루" | §67 확정 (승인 후 반영) |
| C5 | CSV 모이핀 무료 행 | `benefit_type=free`, `status=active` | `status` 비활성, 무료 행 비노출 | 본 §68 Founder 결정 + 실행 승인 |
| C6 | CSV 모이핀 10% 할인 | 없음 | HOLD 행 추가 (`benefit_type=discount`, 10%, 비활성) | 실행 승인 (CSV 단일 행 구조와 충돌, 별도 행 설계 필요) |
| C7 | DB `dt_benefits` 모이핀 무료 | `is_active=true` (Seed) | `is_active=false` | 운영 DB 접근 승인 |
| C8 | DB `dt_benefits` 모이핀 10% 할인 | 없음 | `is_active=false` 로 등록 (HOLD) | 운영 DB 접근 승인 |
| C9 | DB `affiliation_status` 7곳 | 미확인 (기본 `none`) | `confirmed` | 운영 DB 접근 승인 + Q68-3 |
| C10 | 코드 허용 목록 `CONFIRMED_BENEFIT_PARTNERS` | `[]` | 7곳 추가 (모이핀 제외) | 서비스 코드 수정 승인 (본 단계 금지) |

## 6. 모이핀 안전성 점검

현재 혜택 노출 경로 (코드 확인, 읽기 전용):

| 경로 | 게이트 | 현재 결과 |
|---|---|---|
| `_getBenefits` (여정 혜택) | `is_active=true` + 모이핀 무료 이름 제외 + `isConfirmedBenefitPartner` | 허용 목록 비어 있음 → 노출 0 |
| `_getBenefitsForCafes` (여정 카페 블록) | `is_active=true` + `isConfirmedBenefitPartner` | 허용 목록 비어 있음 → 노출 0 |
| `_getCafePartners` (여정 카페 이름) | `is_active=true` 만. 허용 목록 없음 | dt_partners 에 활성 카페가 있으면 **이름 노출 (혜택 없이)** |

점검 결과:
1. **무료 음료 비활성화 (C5, C7)** — 안전. `is_active=false` 로 두 혜택 경로 모두에서 제외되고, 이름 기반 제외도 유지된다.
2. **10% 할인 HOLD 등록 (C6, C8)** — 현재 안전. `is_active=false` 이고 허용 목록에 모이핀이 없어 두 혜택 경로 모두 차단된다.
3. **향후 활성화 위험** — 이름 기반 제외는 "무료" 유형에만 적용된다. 10% 할인은 허용 목록과 `is_active` 두 가지로만 차단되므로, 활성화 시 **둘 다 확인**해야 한다. 모이핀을 허용 목록에 넣는 것은 Founder 의 파트너 확인 후에만 가능하다.
4. **`_getCafePartners` 이름 노출 위험** — 모이핀 (및 7곳 외 active 카페) 의 이름이 혜택 없이 여정 블록에 나올 수 있다. 운영 DB 적재 여부가 미확인이라 실제 노출은 판단 불가. Q68-4 결정 필요.
5. **Seed 의 장소 연결 (STEP 4)** — 모이핀은 별빛항로 상품 2종에 연결되어 있다. 무료 혜택 행을 비활성화해도 연결 자체는 남는다. 연결이 혜택 행의 활성 여부와 무관하게 노출되는지는 해당 상품 화면 코드 확인이 필요하다 (사전 점검 항목).
6. **Seed 혜택 문구 (display_copy)** — "DreamTown 별빛항로의 첫 번째 쉼. 모이핀에서..." 는 혜택 행에 붙어 있다. 무료 행 비활성화 시 함께 숨겨지나, 장소 소개 문구로 재사용하지 말 것 (Q68-5). SSOT 감정 흐름에서는 쉼 장소가 종포로 기록되어 있다 (§66 R4).

실행 전 사전 점검 목록 (승인 후 수행):
- P1 상품 화면이 연결된 혜택의 `is_active` 와 무관하게 혜택을 노출하는지 코드 확인
- P2 `dt_partners` 의 active 카페 행 수 확인 (운영 DB 읽기 승인 필요)
- P3 비활성화 후 `_getBenefits`·`_getBenefitsForCafes` 결과가 0 임을 테스트로 확인
- P4 10% HOLD 행이 노출되지 않음을 테스트로 확인 (is_active=false, 허용 목록 미포함)

## 7. 기존 Place ID 및 데이터 연결 상태

Place ID:

| 업체 | Naver Place ID | 출처 |
|---|---|---|
| 하루 한방카페 | **1480770989** | Founder 제공 (§67). 외부 검증 아님 |
| 나머지 6곳 + 모이핀 | 기록 없음 | repo 전체 검색 결과 Place ID 값 없음 (`naver_map_url` 컬럼은 있으나 값 없음) |

내부 키 및 연결:

| 업체 | CSV partner_code | Seed 파트너 명 (dt_partners.name) | 상품 연결 (Seed STEP 4) | SOUL 장소 (travel_places) | 별공방 locations |
|---|---|---|---|---|---|
| 프롬나드 | YS-CF-001 | 프롬나드 | 별빛항로 상품 2종 | 없음 | 없음 |
| 더 포레스트랜드 | YS-CF-002 | 더 포레스트랜드 | 별빛항로 상품 2종 | 없음 | `forestland` (resort, pending) — 별공방 장소, 파트너 아님 |
| 엘리스테이 · 포트앤포트 | YS-CF-003 | 엘리스테이 카페 | 별빛항로 상품 2종 | 없음 | 없음 |
| 라또아 | YS-CF-004 | 라또아 카페 | 별빛항로 상품 2종 | 없음 | `lattoa_cafe` (migration 148) / `yeosu_lattoa_cafe` (locationRegistry·AGENTS, cafe, testing) — 별공방 장소, 파트너 아님 |
| 카프아일랜드 | YS-CF-005 | 카프아일랜드 | 별빛항로 상품 2종 | 없음 | 없음 |
| 메리엘 | YS-CF-006 | 메리엘 카페 | 별빛항로 상품 2종 | 없음 | 없음 |
| 하루 한방카페 | YS-CF-007 | 카페하루 | 별빛항로 상품 2종 | 없음 | 없음 |
| 모이핀 | YS-CF-008 | 모이핀 | 별빛항로 상품 2종 (장소 연결 유지) | 없음 | 없음 |

DB 상태: 운영 DB 적재 여부와 `dt_partners.id`, `dt_benefits` 실제 행은 확인하지 않았다 (연결 금지). 2026-11-16 문서 기준 `dt_partners` 0건 (§66 한계 참조) 이므로 현재 값은 다를 수 있다.

## 8. H07·H15 활용 정보 분리

| 구분 | 내용 | H07·H15 사용 가능 여부 |
|---|---|---|
| A. 관광 정보 (장소) | 포트앤포트 (V: 오션뷰 자기 소개, 영업 11:00~21:00 공식 페이지). 나머지 E 항목 (후기 기반 바다 전망·영업) | V 는 사용 가능. E 는 "후기 기준, 방문 전 확인" 조건부 (§66 D3, 미결정). C·M 항목 제외 |
| B. 승인 혜택 (7곳) | 아메리카노 1잔 무료 (공통 조건 §3) | **현재 노출 불가** (허용 목록 비어 있음). 허용 목록 추가 승인 후에만 사용 가능 |
| C. 미승인 혜택 | 모이핀 무료 음료 (차단), 모이핀 10% 할인 (HOLD) | **사용 금지** |
| D. 관광 정보 ↔ 혜택 연결 | 장소 정보와 혜택을 한 문장에 묶지 않는다 | 제휴 승인은 장소 검증이 아님 (Founder 명시) |

H07·H15 현재 응답 ("카페 추천 기능은 아직 준비 중이에요") 은 변경하지 않는다. 변경은 승인 후 별도 단계.

## 9. Founder 결정 요청 (Q68-1 ~ Q68-5)

- **Q68-1** "엠파스파레 프롬나드" 의 관리명. 공식 상호가 "프롬나드" 인지 "엠파스파레 프롬나드" 인지. (§66 에서 "엠파스파레" 는 자료에서 확인되지 않음)
- **Q68-2** CSV 혜택 문구를 공통 조건 (2~4인, 일행당 1잔) 으로 정정할지. 1인·5인 이상 처리.
- **Q68-3** 허용 목록 (`CONFIRMED_BENEFIT_PARTNERS`) 과 `affiliation_status` 에 7곳을 반영할 시점과 방식. 반영 전 P1~P4 점검 필요.
- **Q68-4** 혜택이 없는 카페 이름의 여정 블록 노출 허용 여부 (`_getCafePartners`).
- **Q68-5** 모이핀 Seed 의 "별빛항로 첫 번째 쉼" 문구 유지 여부.

## 10. 실행하지 않은 항목 (금지 사항 준수)

- 서비스 코드 수정 (허용 목록 포함): 없음
- 운영 DB 연결·변경·Migration: 없음
- CSV·Seed 파일 수정: 없음 (C1~C10 은 후보)
- 실제 LLM 호출: 없음
- 미확인 혜택 활성화, 모이핀 10% 고객 노출: 없음
- GitHub push, PR, merge, Render 배포, Hybrid 활성화: 없음

## 11. Evidence 연결

- 선행: §66 (`PHX-SOUL-QA-001_CAFE_PARTNER_KNOWLEDGE_VERIFICATION_V1.md`), §67 (`PHX-SOUL-QA-001_FOUNDER_CONFIRMATIONS_V1.md`). 원문 보존.
- 코드 확인 (읽기 전용): `services/travelGuideService.js` L12–17 (허용 목록·게이트), L1071–1082 (`_getCafePartners`), L1096–1110 (`_getBenefitsForCafes`), L1122–1131 (`_getBenefits`, 모이핀 무료 제외).
- 스키마 확인 (읽기 전용): `database/migrations/216_dt_partners_sowonpass_fields.sql` (`info_status`, `affiliation_status`).
- 외부 백업: `C:\DEV\_phx_soul_evidence_backup\20261120-partner-benefit-confirmation\` (SHA256 결과는 `DREAMTOWN_STATUS.md` §68 참조).
- 커밋 여부: 본 문서는 워킹트리 기록 (§64~§67 과 동일 정책). push 없음.
