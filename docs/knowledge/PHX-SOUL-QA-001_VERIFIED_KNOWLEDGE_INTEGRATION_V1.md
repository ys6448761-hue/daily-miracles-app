# PHX-SOUL-QA-001 — 검증된 관광 Knowledge 최소 반영 (§64, V1, 2026-11-20)

> 선행: §62 (감사, `PHX-SOUL-QA-001_TOURISM_KNOWLEDGE_READINESS_V1.md`), §63 (근거 검증, `PHX-SOUL-QA-001_KNOWLEDGE_EVIDENCE_VERIFICATION_V1.md`). 두 문서는 변경하지 않고 보존한다.
> Founder 결정 (2026-11-20): Q63-1 · Q63-2 · Q63-3 · F2 확정. 기존 DB 값은 변경하지 않는다.
> 기준 HEAD `dc175c2` (원격 `9ad729f`). Production HOLD, 개인정보 법률 검토 BLOCKED 유지.

## Guardian Preflight Report (코드 수정 전 기록)

```
### Guardian Preflight Report

Requested Change:
  Founder 결정 반영 최소 구현.
  (1) 오동도 체류: 120 을 검증된 평균 체류로 안내하지 않음. 90 은 "DreamTown 일정 배정시간" 의미로만 안내.
  (2) 오동도 운영: 섬 개방 (상시 개방, 연중무휴) 과 동백열차 운행시간 (09:30~18:00, 동절기 11~2월 17:00 까지, 12~13시 미운행) 을 분리.
      기존 09:00~17:00 를 섬 전체 확정 운영시간으로 안내하지 않음.
  (3) 케이블카: 미확인 운영시간 (09:30~21:30) 과 평균 체류 (45) 를 응답에서 확정 표기하지 않음. 편도 약 13분은 "비공식 참고값" 으로만.
  (4) 하멜등대 30분, 향일암 120분 (승인값) 유지.
  (5) 오동도 산책·방파제 사실은 공식 출처가 확인된 항목만 사용 (방파제 768m, 동백열차 또는 도보 진입, 입구 주차장에서 방파제 길 약 15분, 숲 산책로 2.5km).
  (6) H04·H17 (시간 의미), H06·H14 (산책·아이 동반) 응답 개선.

Existing Assets Found:
  services/soyeowoolService.js:
    _PLACE_KNOWLEDGE (L331~430): odongdo (hours_ko, walking_ok, experience_ko 등), cablecar (hours_ko 09:30~21:30, ride_duration_ko), hyangiram, hamel_lighthouse
    STAY 분기 _buildPlaceInfoPayload (L574~), 운영시간 템플릿 (L587, L589), 평균 관람 시간 답변 (L1485), 장소 답변 운영 템플릿 (L1566~1621), 기능 설명 (L1343), 평균 체류 표기 (L852), 동반 칩 체류 (L3310, L3323), 답변 우선 빌더 (_buildPlaceAnswerFirstPayload)
    LIVE 빠른 경로 (Hybrid 플래그 ON 에서만 동작, L1706~1716)
  DB 값 (seed 001, migration 207): odongdo 120, cablecar 45, hyangiram 120 (승인), hamel 30 (승인). DB 는 변경하지 않음.
  공식 출처 (§64 조회, 2026-11-20 확인): 여수시 방파제 안내, 여수시 오동도 안내, 여수시 스마트관광 (상시개방), 여수시 시설 안내 (동백열차), 한국관광공사 열린관광 (2019 기록)

Repositories Inspected:
  C:\DEV\_worktrees\phx-soul-hybrid-v1 (HEAD dc175c2). 운영 DB 미연결.

Relevant Files:
  services/soyeowoolService.js (수정 대상), tests/unit/soulKnowledgeVerifiedIntegration.test.js (신규)

Relevant Databases:
  없음 (DB 변경 없음, Migration 없음).

Change Classification:
  REPAIR (사실 표기 정정). 신규 Architecture 아님. 장소 사실은 기존 _PLACE_KNOWLEDGE 객체의 필드를 재사용하고, 체류 정책 필드 1개 (stay_policy) 를 추가한다.

Connection Opportunity:
  기존 템플릿 (운영시간은 …예요, 평균 관람 시간은 …) 과 기존 답변 빌더 재사용.

Duplication Risk:
  낮음. 새 장소 목록 추가 없음.

Data Risk:
  낮음. 외부 호출 없음 (수동 조회 결과만 반영). 개인정보 없음.
  2019 기록 (열린관광) 은 날짜를 명시하고 "방문 전 확인" 과 함께만 사용.

Recommended Approach:
  1) _PLACE_KNOWLEDGE 에 sourced 필드 추가: odongdo.stay_policy, odongdo.facility_hours_ko, odongdo.official_facts(출처·확인일), cablecar.stay_policy, cablecar.hours_ko 를 미확인 처리
  2) 체류 표기 헬퍼 1개로 STAY·평균 관람·동반 칩 체류 표기 통일 (DB 값 대신 stay_policy 우선)
  3) 운영시간 템플릿에 facility_hours_ko 분리 표기
  4) 오동도 산책 답변은 공식 확인 문구 사용 (walking_ok 일반 문장 대체), 계단은 2019 기록으로 날짜 표기
  5) 테스트: H04·H17·H05·H06·H14·H18·H09 전후, 플래그 unset/0/1, Mock 전체 H01~H20 재생, Clarify·Privacy·Route Gate 회귀

Questions Requiring Decision:
  없음 (Founder 결정 반영). 공식 원문과 불일치하는 항목은 반영하지 않고 보류로 기록.

Implementation Status: READY
```

## 1. 공식 출처 확인 결과 (2026-11-20)

| # | 출처 | 확인 내용 | 날짜 | 판정 |
|---|---|---|---|---|
| S1 | 여수시 방파제 안내 `yeosu.go.kr/tour/travel/info_each_area?idx=626&mode=view` | 방파제 길이 768m, 폭 1~3m. 걸어서 또는 순환차량 (동백열차) 으로 진입 가능 | 날짜 표기 없음 | 사용 가능 (길이·진입 방식). 도보 시간 없음 |
| S2 | 여수시 오동도 안내 `yeosu.go.kr/tour/travel/10tour/odongdo` | 오동도 입구 주차장에서 방파제 길을 따라 약 15분 걸으면 도착. 섬 외곽 순환산책로. 숲 터널형 산책로 2.5km. 계단 구간은 이미지 캡션만 (세부 없음). 무장애·휠체어·유모차 정보 없음. 운영시간 없음 | 날짜 표기 없음 | 사용 가능 (15분 · 산책로 2.5km). 계단 세부·접근성 미확인 |
| S3 | 여수시 스마트관광 `yeosu.go.kr/smartyeosu/...` | 운영일 상시개방, 휴무 연중무휴. 일별 시간 없음 | 날짜 표기 없음 | 사용 가능 (상시 개방, 연중무휴) |
| S4 | 여수시 시설 안내 `yeosu.go.kr/tour/travel/10tour/odongdo_open/facilities` | 동백열차 운행 09:30~18:00 (점심 12~13시 미운행). 동절기 (11~2월) 09:30~17:00. 주차장·분수 등 시설별 시간 | 날짜 표기 없음 | 사용 가능 (동백열차 시간, 시설별 구분) |
| S5 | 한국관광공사 열린관광 `korean.visitkorea.or.kr/detail/rem_detail.do?cotid=2e99924c-...` | 오동도: 가파른 계단 구간으로 유모차 접근이 어려운 구간 있음. 무장애 관광코스 있음. 유모차 무료 대여 | 2019년 5월 갱신 (기사 기준) | 날짜 명시로만 사용. 현행 여부 미확인 |
| S6 | 케이블카 공식 사이트 | 찾지 못함 | — | 미확인. 제3자 안내 (편도 13분, 운영 09:30~21:30) 는 비공식 참고 |

- 불일치: S2 는 산책로 "2.5km", 검색 요약의 방파제 "768m" 는 서로 다른 구간 (S1 과 일치). 충돌하지 않는다.
- 불일치: 기존 코드 09:00~17:00 (동백열차) 와 S4 (09:30~18:00) 는 충돌. S4 를 채택 (공식 시설 안내).

## 2. Founder 결정 반영 목록

| 항목 | 결정 | 구현 방식 |
|---|---|---|
| Q63-1 오동도 체류 | 90 = 일정 배정 (승인), 120 = 근거 미확인 평균 → 평균으로 안내 금지. DB 변경 금지 | 체류 헬퍼: odongdo 는 stay_policy 사용 ("일정 배정 약 90분 (09:00~10:30). 평균 체류시간은 확인되지 않았어요.") |
| Q63-2 케이블카 | 편도 13분·왕복 25분 = 비공식 참고, DB 45 = 근거 미확인, 일정 60 = 계획값, DreamTown 90 = 항로 배정 | cablecar.stay_policy: 평균 체류 미확인 + "탑승은 편도 약 13분 (비공식 참고값)". 90·60 은 응답에 쓰지 않음 |
| Q63-2 케이블카 운영시간 | 미확인 시간 확정 금지 | cablecar.hours_ko → 미확인 처리 ("운영시간은 확인되지 않았어요") |
| Q63-3 오동도 운영 | 09:00~17:00 를 섬 전체 확정 운영으로 쓰지 않음. 개방시간과 시설시간 구분 | hours_ko = "상시 개방 (연중무휴)". facility_hours_ko = 동백열차 09:30~18:00 (동절기 17:00, 12~13시 미운행) |
| F2 | 일괄 승인 금지, 출처 확인된 사실만 선별 | odongdo.walking_ok 일반 문장 → 공식 확인 문장으로 교체. 계단은 S5 날짜 표기와 함께만 |
| 하멜 30 · 향일암 120 | 승인값 유지 | 변경 없음 |
| 카페 전망·파트너 혜택 | 보류 | 변경 없음 (H07·H15 현재 응답 유지) |

## 3. 응답 전후 기대 (구현 후 재생 결과로 확정)

- H04·H17: "오동도는 일정에서 약 90분 (09:00~10:30) 으로 배정되어 있어요. 평균 체류시간은 확인되지 않았어요." + 방파제 진입 약 15분 (입구 주차장에서) + 산책로 2.5km (전체 산책 시간 미확인).
- H05: "오동도는 상시 개방 (연중무휴)이에요. 동백열차는 09:30~18:00 운행이에요 (동절기 11~2월 17:00까지, 12~13시 미운행)."
- H06: 방파제 768m (동백열차 또는 도보 진입), 입구 주차장에서 약 15분, 숲 산책로 2.5km, 계단 구간은 2019 기록. 구간별 부담은 미확인.
- H14: 아이 동반 문구 + 위 산책 사실 + "유모차 접근은 2019 기록상 일부 계단 구간이 어려움. 현행 여부 미확인." 접근성 확정 금지.
- H18: 운영 여부 실시간 미확인 + 운영시간 미확인 (기존 09:30~21:30 확정 표기 제거). 현장 번호 유지.
- H09: 오동도 체류 "일정 배정 약 90분", 케이블카 "평균 체류 미확인, 탑승 편도 약 13분 (비공식 참고)". 반나절 일정 미구성 유지.

## 4. 기존 장소 문장 처리 (F2)

- 유지 (출처 확인 전까지 현 상태): odongdo.experience_ko (Founder 승인 기재, 설계 문서), 기타 장소 문장.
- 공식 확인으로 교체: odongdo.walking_ok → S1·S2 사실 문장.
- 미확인으로 제거 (응답에서 사용 안 함): cablecar 운영시간, cablecar 체류 평균, odongdo 운영시간 "09:00~17:00", odongdo 체류 평균 120.
- suitable_for: 응답 근거로 쓰지 않음 (§63 기준). 변경 없음.

## 5. 검증 계획

- 단위 테스트: H04·H05·H06·H09·H14·H17·H18 응답 문구, 오동도 120 평균 미노출, 케이블카 운영시간 미노출, 하멜 30·향일암 120 유지, 동백열차 시간 분리, 2019 날짜 표기.
- Mock 재생: §60 실제 응답 원본 (`real-run-2026-11-20-post-clarify.json`) 으로 H01~H20 전체 재생 (실제 LLM 호출 없음). 변경 행 확인.
- 회귀: Clarify 24/24, 전체 Jest (flag unset/0/1), Privacy·Hybrid 75/75, Route·Gate·Manifest 107/107.
- §60 실제 LLM 점수 8/12/0 은 변경하지 않음.

## 6. Evidence 및 연결

- §62, §63 원본 보존. §60 원본 보존. §61 (dc175c2) 유지.
- 정본 SOUL Evidence (`daily-miracles-mvp`, 다른 체크아웃): 읽기만.
- 이 문서는 워킹트리 기록 (커밋 여부는 검증 후 결정).

## 7. 구현 기록 (구현 후 채움)

### 7.1 변경 (로컬 커밋 `eb01d33`, 기준 `dc175c2`, push 없음)

| 파일 | 변경 |
|---|---|
| `services/soyeowoolService.js` | `_PLACE_KNOWLEDGE` 오동도·케이블카 항목 수정 (아래 7.2). `_STAY_POLICY` + `_stayPolicyFor` 추가. 체류 문장 6곳(STAY 안내, 복수 장소, 판단 문장, 특징, 소요시간 답변, 동반 카드)을 stay_policy 로 전환. 동백열차 시설시간 줄 2곳. 오동도+아이 동반 답변에 계단 2019 기록 1줄 |
| `tests/unit/soulKnowledgeVerifiedIntegration.test.js` | 신규 11개 (H04·H05·H06·H09·H14·H16·H17·H18, 하멜 30·향일암 120 유지) |
| `tests/unit/soulClarifyAnswerFirst.test.js` 외 4개 | 기존 고정 문구 assertion 을 승인된 문구로 갱신 (테스트 개수 불변). 120분 평균·09:30~21:30·"평균적으로" 오동도 |

DB, 마이그레이션, Privacy Guard, Route Gate, Hybrid 플래그 파일 변경 없음. 실제 LLM 호출 없음.

### 7.2 항목별 적용

- **오동도 체류 (Q63-1)**: DB 120 은 응답에서 쓰지 않음. 체류 문장은 "일정에서 약 90분 (09:00~10:30)으로 배정되어 있어요. 평균 체류시간은 확인되지 않았어요." `schedule_slot_ko` 를 검증 corpus 에 둬서 응답 가드(`UNVERIFIED_CLOCK_TIME`)가 통과하게 함.
- **케이블카 (Q63-2)**: DB 45 는 응답에서 쓰지 않음 → "평균 이용시간은 확인되지 않았어요." 운영시간 `hours_ko` 는 null (09:30~21:30 제거, `hours_trust: UNVERIFIED`). 편도 약 13분 (`NON_OFFICIAL` 유지, 12~13분·1.5km 표기 제거).
- **오동도 운영 (Q63-3)**: `hours_ko` = 상시 개방 (연중무휴). 동백열차 09:30~18:00 (동절기 17:00, 12~13시 미운행) 은 `facility_hours_ko` 로 별도 줄. 09:00~17:00 제거.
- **오동도 산책 (F2)**: `walking_ok` 를 공식 확인 사실로 교체 (입구 주차장에서 방파제 길 약 15분, 방파제 768m, 숲 산책로 2.5km, 구간별 부담 미확인). `stairs_ko` = 2019년 열린관광 기록, 현행 여부 미확인.
- **유지**: 하멜등대 DB 30분, 향일암 DB 120분 (승인 값). DB 값 변경 없음.

### 7.3 재생 검증 (§60 실제 응답 원본, 실제 호출 없음)

- 입력: `real-run-2026-11-20-post-clarify.json` (17 호출 원본). 시나리오 A (stub 4행). 기준 `dc175c2` (git archive) vs 수정 후 작업 트리.
- 변경된 질문 (메시지·상태·payload 중 하나 이상): H03, H04, H05, H06, H09, H14, H16, H17, H18.
  - H04·H17: 120분 평균 → "일정에서 약 90분 … 평균 체류시간은 확인되지 않았어요." (상태 PLACE_LOOKUP 유지)
  - H05·H16: 운영시간 연중무휴(09:00~17:00) → 상시 개방 + 동백열차 09:30~18:00 분리
  - H06: 방파제·산책로 공식 사실, 운영시간 상시 개방
  - H09: 케이블카 평균 미확인, 오동도 일정 배정 90분 (반나절 일정 미구성 유지)
  - H14: 오동도 계단 2019 기록 줄 추가
  - H18: 케이블카 운영시간 미확인 (09:30~21:30 제거)
  - H03: "보통 약 2시간 정도 머물러요" 문장 제거 (120 평균 금지). 범위 밖 항목이지만 같은 근거에서 발생. 결정 필요 없음으로 보고
- 지연 시간만 변경: H01, H08, H10, H13. 변경 없음: H02, H07, H11, H12, H15, H19, H20.
- 재생 소진 0, 콘솔 오류 0. 수정 중 발견: 가드가 신규 시각 "09:00~10:30" 을 미검증으로 보고 대체 응답으로 바꿈 → 검증 corpus 항목 (`schedule_slot_ko`) 추가로 해결 (가드 자체 미변경).
- **§60 실제 LLM 점수 8/12/0 은 변경하지 않음.** 재생은 점수를 갱신하지 않는다.

### 7.4 회귀 테스트

| 구분 | 결과 | 기준 (§61) |
|---|---|---|
| Hybrid flag unset | 873 pass / 1 fail (R20) | 862 / 1 → +11 신규 |
| Hybrid flag 0 | 873 pass / 1 fail (R20) | 862 / 1 |
| Hybrid flag 1 | 871 pass / 3 fail (LB-I7, R4, R20) | 860 / 3 → +11 신규 |
| 신규 + Clarify | 35/35 | |
| Privacy·Route·Gate·Manifest·RC3·Hybrid 하위 집합 | 121/121 | |

실패 suite 집합은 §61 과 동일 (supertest 미설치, 테스트 0개 suite, privacyHotfix process.exit, R20, flag 1 의 LB-I7·R4).

### 7.5 공식 출처 (S1–S5) 사용 범위

- S1 여수시 방파제 안내: 방파제 768m, 입구 주차장에서 약 15분 (`walking_ok` 사용)
- S2 여수시 오동도 안내: 숲 산책로 2.5km (`walking_ok` 사용)
- S3 여수시 스마트관광: 상시 개방, 연중무휴 (`hours_ko` 사용)
- S4 여수시 시설 안내: 동백열차 09:30~18:00, 동절기 17:00, 12~13시 미운행 (`facility_hours_ko` 사용). 기존 09:00~17:00 과 충돌 → S4 채택
- S5 한국관광공사 열린관광 (2019 기록): 계단 구간, 유모차 접근 (`stairs_ko`, 날짜 표기)
- S6 케이블카 공식 사이트: 찾지 못함 → 운영시간 미확인 유지

### 7.6 미해결 (Knowledge, 이번 범위 밖)

- 케이블카 운영시간의 공식 출처 (S6 미발견). 현재 미확인으로 유지.
- 케이블카 편도 13분 (제3자), 케이블카 DB 45 의 산출 근거.
- 오동도 전체 산책 시간·구간별 부담, 계단 현행 여부, 유모차 접근 현행 여부.
- 카페 전망, 파트너 혜택 (partner_master.csv 활성 항목 vs PARTNER_MASTER_V1 Template 불일치 / 모이핀 혜택 미확인). 등록 금지 유지.
- 향일암 체류 120 (Founder 승인 값)은 유지. 하멜 30 유지.

### 7.7 Evidence 상태

- 커밋 `eb01d33` 로컬 only. 원격 push 없음 (`origin/feat/phx-soul-hybrid-v1` = `9ad729f` 유지).
- 외부 백업: `C:\DEV\_phx_soul_evidence_backup\20261120-verified-knowledge-integration\` (SHA256SUMS 검증 결과는 `DREAMTOWN_STATUS.md` §64 항목 참조).
- DREAMTOWN_STATUS.md 는 타 세션 변경이 포함되어 있어 커밋하지 않음.
