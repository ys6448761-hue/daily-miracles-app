# PHX-SOUL-QA-001 — Founder 확정 사항 기록 (§67, V1, 2026-11-20)

> §67. Founder 확정 사항을 Knowledge 및 Decision 기록으로 남긴다.
> 서비스 코드 수정 없음. 운영 DB 변경 없음. 실제 LLM 호출 없음. GitHub push 없음. 배포 없음.
> 기준: local / remote HEAD `10f52dc`. 최신 실제 LLM Benchmark 8/12/0 유지.
> 선행 조사: §66 (`PHX-SOUL-QA-001_CAFE_PARTNER_KNOWLEDGE_VERIFICATION_V1.md`). §66 원문은 변경하지 않는다.

## Guardian Preflight Report (기록 전)

```
### Guardian Preflight Report

Requested Change:
  Founder 확정 3건 (엘리스테이·포트앤포트 관계, 하루 한방카페 명칭, 모이핀 소원패스 10% 할인 방향)을
  Knowledge 및 Decision 기록에 반영. 이번 단계는 기록 한정.

Existing Assets Found:
  - §66 조사 문서 (카페 8곳 검증표, 미해결 Founder 질문 D1~D7)
  - partner_master.csv / partner_master_seed.sql (데이터 변경은 이번 범위 밖)
  - travelGuideService.js 모이핀 무료 혜택 제외 규칙 (유지)

Repositories Inspected:
  daily-miracles-mvp 문서 및 CSV/Seed 현황 (§66 기준). 재조사 없음 (Founder 확정 항목 반복 조사 금지).

Relevant Files:
  docs/knowledge/PHX-SOUL-QA-001_FOUNDER_CONFIRMATIONS_V1.md (본 문서), DREAMTOWN_STATUS.md (Project State)

Relevant Databases:
  없음. 운영 DB 연결·변경 금지. CSV/Seed 행 수정도 이번 범위 밖.

Change Classification:
  기록 (Decision record). 코드·데이터 변경 없음.

Connection Opportunity:
  해당 없음.

Duplication Risk:
  낮음. 기존 §66 판정을 덮어쓰지 않고 확정 상태를 별도 기록.

Data Risk:
  없음 (문서 기록). 단, CSV active 행과 Seed 의 모이핀 무료 혜택은 데이터 불일치로 남음 → §4 에 후속 조치로 기록.

Recommended Approach:
  1) 확정 3건을 상태 라벨과 함께 기록
  2) 확정으로 해소된 항목과 여전히 미해결인 항목을 분리
  3) 확정 범위 밖 (코드·DB·혜택 활성화) 명시
  4) Evidence 백업 및 Project State 갱신

Questions Requiring Decision:
  없음 (Founder 확정 범위 내). 모이핀 할인 활성화 조건은 후속 단계 (§4).

Implementation Status: READY (기록 전용. 코드·DB·LLM·push·배포 제외)
```

## 1. 엘리스테이 · 포트앤포트 (업체 관계 및 정보 구분)

| 항목 | 확정 내용 | 상태 |
|---|---|---|
| 업체 관계 | 엘리스테이와 포트앤포트는 같은 건물에서 함께 운영 | **Founder Confirmed** (기존 "업체 관계 미확인" 갱신) |
| 엘리스테이 | 숙박시설 (엘리스테이 여수, 건물) | 숙박 장소 정보로 관리 |
| 포트앤포트 | 카페·레스토랑 (건물 4층, 공식 사이트 기준) | 카페 장소 정보로 관리 |
| 관리 원칙 | 숙박시설과 카페의 장소별 정보 및 혜택은 **구분하여 관리** | Founder 결정 |

§66 과의 관계:
- §66 에서 "엘리스테이 카페 = 포트앤포트" 로 매핑한 것은 Founder 확정으로 **관계 부분이 해소**되었다.
- 번지 (공식 28-58 / 내비 28-52), 전화 (CSV 0507-1371-2956 vs 공식 카페 0507-1429-5241) 불일치는 이번 Founder 확정에 포함되지 않았다. **미해결 유지.**
- 혜택: CSV 의 "엘리스테이 카페 아메리카노 1인 무료" 는 승인 근거 없음 (§66). 이번 확정으로 혜택 승인되지 않음. **미승인 유지.**

## 2. 하루 한방카페 (명칭 통일)

| 항목 | 확정 내용 | 상태 |
|---|---|---|
| 관리 명칭 | **하루 한방카페** (통일) | **Founder Confirmed** |
| Alias 보존 | "하루 한방", "카페하루" (CSV YS-CF-007 명칭) | Founder Confirmed (기존 명칭 보존) |
| 네이버 Place ID | **1480770989** | Founder 제공 값 (외부 검증 아님, 기록) |

§66 과의 관계:
- §66 의 D1 (하루 한방 = 카페하루 여부) 은 Founder 확정으로 **해소** (동일 업체, 명칭 통일).
- 주소 (돌산읍 강남해안로 61), 전화 (010-8878-2905, CSV), 영업 시간, 바다 전망 은 §66 에서 **근거 없음 (MISSING)** 이었다. 이번 확정은 명칭과 Place ID 만 다루며 이 항목들의 근거를 만들지 않는다. **미확인 유지.**
- 명칭 확정에 따라 이후 기록·데이터는 "하루 한방카페" 를 기준으로 하고, "하루 한방" 과 "카페하루" 는 검색·매핑용 Alias 로만 사용한다.

## 3. 모이핀 (소원패스 10% 할인 방향)

| 항목 | 확정 내용 | 상태 |
|---|---|---|
| 혜택 유형 (Benefit Type) | **Percentage Discount** (비율 할인) | Founder Decision |
| 할인율 | **10%** | Founder Decision |
| Founder 결정 | **Approved** (소원패스 10% 할인 혜택으로 추진) | Founder Approved |
| 파트너 확인 | **Pending** (매장 합의 미완료) | PARTNER_PENDING |
| 고객 노출 | **HOLD** (활성화 전 노출 금지) | HOLD |
| 기존 아메리카노 무료 혜택 | 별도 항목으로 구분. 무료 음료 혜택은 **차단 정책 유지** | 차단 유지 |

활성화 조건 (Founder 지시, 전부 충족 전 활성화 금지):
1. 매장 합의 (모이핀과 소원패스 10% 할인 합의 문서 또는 확인)
2. 할인 적용 대상 확인 (예: 인원, 메뉴 범위, 주류·음료 포함 여부 등)
3. 이용 조건 확인 (예: 기간, 중복 적용, 예약·현장 조건 등)
4. 위 확인 후 Founder 가 활성화 승인

차단 정책 유지:
- 기존 "모이핀 무료 음료 (아메리카노 1인 무료)" 혜택은 `travelGuideService.js` 의 제외 규칙으로 계속 차단한다. 이번 확정으로 해제하지 않는다.
- 10% 할인은 무료 혜택과 **별개 레코드** 로 관리한다 (혜택 유형, 할인율, 상태를 각각 보유).

## 4. 확정 이후 남은 불일치 (후속 조치, 이번 단계에서 수행하지 않음)

| 항목 | 현재 상태 | 필요한 후속 조치 (승인 필요) |
|---|---|---|
| CSV `partner_master.csv` 모이핀 행 | `benefit_type=free`, `status=active` (무료 음료) | 무료 행을 비활성화하고 10% 할인 행을 별도 등록 (Pending/HOLD 상태). 승인 후 수행 |
| `partner_master_seed.sql` 모이핀 연결 | 별빛항로 상품 2종에 무료 혜택 연결 SQL 포함 | 무료 연결 제외. 10% 할인 연결은 HOLD 상태로만 준비 |
| 엘리스테이 번지·전화 | 28-52 vs 28-58, 두 전화 번호 | 공식 확인 후 정정 |
| 하루 한방카페 주소·전화·영업 | §66 MISSING | 공식 출처 확인 필요 (Founder 확정은 명칭·Place ID 만) |
| 카페 6곳 제휴 상태 | 승인 근거 없음 (§66 D2 미답) | Founder 답변 필요 |

## 5. 이번 단계 범위

포함:
- 위 확정 3건의 Knowledge 및 Decision 기록 (본 문서)
- §66 의 미해결 질문 해소 표시: D1 (하루 한방 = 카페하루) 해소. 모이핀은 혜택 방향만 확정 (§3). D5 (Seed 연결 제외) 는 미결정, §4 에 후속 조치로 남김
- SOUL Project State 갱신 (`DREAMTOWN_STATUS.md`)
- 외부 SHA256 백업

제외 (Founder 승인 범위 밖):
- 서비스 코드 수정 (`services/`, `travelGuideService.js` 포함)
- 운영 DB 변경, 데이터 등록, CSV·Seed 행 수정
- 실제 LLM 호출
- 모이핀 10% 할인 활성화 및 고객 노출
- GitHub push, PR, merge
- Render 배포, Hybrid 활성화

## 6. Founder 확정 항목의 재조사 금지

- 엘리스테이·포트앤포트 업체 관계, 하루 한방카페 명칭 통일, 모이핀 10% 할인 방향은 **반복 조사하지 않는다.**
- 단, 새로운 충돌 근거가 발견되면 Founder 에게 보고하고 재확인한다.
- 확정되지 않은 항목 (§4 표) 은 기존 상태를 유지하며 이번 확정으로 추정 확정하지 않는다.

## 7. Evidence 및 연결

- 선행 조사: `PHX-SOUL-QA-001_CAFE_PARTNER_KNOWLEDGE_VERIFICATION_V1.md` (§66). 원문 보존.
- 확정 기록: 본 문서 (§67).
- 외부 백업: `C:\DEV\_phx_soul_evidence_backup\20261120-founder-confirmations\` (SHA256 검증 결과는 `DREAMTOWN_STATUS.md` §67 참조).
- 커밋 여부: 본 문서는 워킹트리 기록 (이전 §64~§66 과 동일 정책). push 없음.
