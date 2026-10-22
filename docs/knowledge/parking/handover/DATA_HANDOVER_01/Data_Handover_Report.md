# DreamTown Parking Hospitality V1 — Data Handover & Place Mapping

수신: Founder / Phoenix 운영 루미 / Claude Code 검토용  
작성: Work · 2026-10-20 · READ-ONLY / Data Packaging & Mapping Proposal

**상태: Data Handover Ready → Founder Review → Claude Code Integration Preflight.**

이는 구조화 자료 인계 완료다. 고객 공개·Option B 구현·배포 승인을 뜻하지 않는다.

## 1. Continuity 확인

요청된 순서로 상태 문서·Next Action·Architecture·기존 패키지를 확인했다.

| 대상 | 실제 확인 결과 | 적용 범위 |
|---|---|---|
| 최신 Project State | `DREAMTOWN_STATUS.md` 정본 NOT_ACCESSIBLE | 최신 HEAD·배포상태를 추정하지 않음 |
| Current Next Action | 이번 Founder 지시 확인 | 데이터 인계 → Founder Review → Code Integration Preflight |
| Architecture Decision | 「DreamTown Parking Hospitality V1 — Architecture Review」 인계 원문 전체 열람 | Code의 보고 내용 재사용. Work가 Repository를 직접 재검증한 것은 아님 |
| 기존 Work V1.1 | 저장된 JSON·보고서 및 동일 파일의 로컬 identity·바이트 수 확인 | 원본 실제 존재. 신규 전면조사나 임의 재구성 아님 |

Architecture Review 원문: `붙여넣은 텍스트(1)(20261020-061801).txt` / Library ID `libfile_bc9503175a588191b296f33f255368cc`.

리뷰는 기존 `_PLACE_KNOWLEDGE`, PSQ, C-3 주차 응답과 `parking_trust: UNKNOWN`의 활용을 보고한다. Option B는 구조화 JSON 연결안으로 제시됐지만, 기존 리뷰의 최종 Next Action은 Option A를 중심으로 작성되어 있다. **이번 요청은 Option B 최소 연결의 검토 준비만 승인한다. Option B 구현 승인으로 해석하지 않는다.**

Code 리뷰의 “V1.1 NOT PROVIDED”는 당시 저장소에 자료를 전달받지 못했다는 상태다. Work 결과물이 없다는 뜻이 아니다. 현재 인계 패키지는 실제 존재한다.

## 2. 실제 생성한 파일

| 파일 | 용도 |
|---|---|
| `Parking_Data_Package_V1_1.json` | 시설26개, 필드별 Claim/Evidence/신뢰·확인일·UNKNOWN·충돌, 고객문장 검토영역과 내부 이력 분리 |
| `Parking_Evidence_Register.json` | 출처19개, 전화 보고 정규화, 기존충돌12개, Code 인계와의 추가 미해결 차이 |
| `Parking_Place_Mapping_Draft.json` | 참고 장소코드6종에 대한 매핑18건; Repository 확인 전 초안 표시 |
| `Parking_Course_Hospitality_V1.json` | 대표코스2개, 주차 후보·복귀·동행자 차이·조건부 답변3개 |
| `Validation_Report.json` | JSON·ID·Evidence·보존·공개 게이트 등13개 점검 PASS |
| `Project_State_Update_Draft.md` | 기존 상태 문서를 수정하지 않은 갱신 문안 초안 |
| `Change_Log.md` | V1.1 대비 추가·변경·보존 범위 |
| `Data_Handover_Report.md` | 본 인계 요약 |

네 필수 JSON은 새 인계 디렉터리에 생성했다. 이전 V1.1 파일을 덮어쓰지 않았다. 동일 파일명이라도 이번 것은 `handover_revision: DATA_HANDOVER_01`인 검토용 표현이며, Code가 바로 require/import할 런타임 정본 파일은 아니다.

## 3. 26개 시설·Evidence 보존

- 기존 시설 **26개 ID 전부 보존**, 중복 ID 없음. 원본 레코드 각각을 `internal_review.source_v1_1_record`에 동일하게 보존했다.
- 기존 출처 **16건 + 신규 전화보고3건 =19건** 전부 유지했다. 기존16건에도 F01~03 전화 인계가 포함되어 있으므로 “공식자료16건”이라고 부르면 안 된다.
- F01~06의 전화 정보 출처 상태는 **FOUNDER_PHONE_REPORTED**로 통일했다. 실제 통화일은 모두 UNKNOWN이며 인계 수신일로 대체하지 않았다. 자동안내·운영기관·기존 원문은 original source에 남아 있다.
- 기존 **충돌12건** 삭제·완화·자동해결 없음. 시설명이 유사하거나 관리기관이 같아도 요금을 상속하지 않았다.
- 기존 **7개 관광지 조합·21개 검토안**, 기관별 규칙·이전 고객 예시도 이력으로 보존했다. 이번 활성 검토 코스는2개로 좁혔다.
- 추정8곳 매핑은 활성화하지 않았다. 확정8개 Registry 정본은 미열람 상태다.

시설 종류도 근거가 있는 범위만 채웠다. 예: 타워, 지하, 노상, 차단기식. 종류 미확인 시설은 이름으로 추정하지 않고 UNKNOWN으로 남겼다. 패키지 ID는 연구용 식별자이며 Repository/DB의 정식 ID가 아니다.

## 4. 기존 SOUL 코드 연결 초안

아래 코드는 사용자 제공 예시 및 Code 보고의 참고값이다. **실제 Repository 정본은 Claude Code가 확인해야 한다.**

| place_code | 연결 초안 | 상태·범위 |
|---|---|---|
| `lee_soon_shin_plaza` | 광장 지하, 진남관·진남상가, 터미널 두 시설 후보 | 광장 지하의 기본 시설사실 매핑 READY_FOR_REVIEW. 대안·경로는 NEEDS_VERIFICATION/HOLD |
| `odongdo` | 오동도 타워, 입구 노상 | 타워의 시설사실 매핑 READY_FOR_REVIEW. 노상 정확 위치·보행 검증 필요 |
| `cablecar` | 오동도 타워(자산), 돌산공원 공영 | 타워와 자산정류장 명칭 관계 READY_FOR_REVIEW. 돌산 운영·개별 접근 충돌은 유지 |
| `marine_park` | 종포225면, 광장·터미널 거점 후보, 물양장 검토 제외 대상 | 종포 정확 시설·물양장 일반이용 미검증 HOLD. 광장거점도 보행 검증 필요 |
| `hamel_lighthouse` | 전시관 부설, 종포225면, 광장 출발 코스거점 | 직접 주차 가능·일반 개방·복귀 경로 확인 전 보류/조건부 후보 |
| `hyangiram` | 향일암 공영, 임포 미특정 대안 | 운영·무료시간 및 대체시설 식별 HOLD |

매핑18건 판정은 **READY_FOR_REVIEW3 / NEEDS_VERIFICATION8 / HOLD7**이다. 26개 시설을 억지로 모두 장소에 연결하지 않았으며, 미매핑 ID와 사유를 JSON에 별도로 남겼다.

각 매핑에는 parking ID·place code·연결 근거·Evidence·추천 조건·보행/차량복귀/접근성 상태·고객공개 초안이 있다. 보행거리·분단위 시간·경사·계단·승강기 연결 여부는 새로 생성하지 않았다.

## 5. 대표 코스 준비 수준

### Course 01 — 원도심 순환

이순신광장 → 진남관 → 종포해양공원 → 하멜등대

| 안 | 주차 후보 | 상태 | 확인 조건 |
|---|---|---|---|
| 1안 | 이순신광장 지하 | NEEDS_VERIFICATION | 차량입구·보행출구, 진남관 경유 경사/계단, 하멜에서 차량까지 복귀 |
| 2안 | 진남관 공영 | NEEDS_VERIFICATION | 주소·진입구 차이, 제시 방문순서에 따른 이동 부담 |
| 3안 | 터미널 차단기식 | NEEDS_VERIFICATION | 정확 시설·입구, 원도심 보행 접속, 추가 귀환 부담·출입조건 |

진남상가는 미순위 대안으로 유지했다. 순위는 검토 가설이며 1안이 항상 최단·최저가·가장 편하다고 확정한 것이 아니다.

**‘순환’은 요청된 코스명이다.** 방문순서는 하멜에서 끝나므로 주차장 복귀 경로가 확인되어야 물리적 순환이 완성된다. 현재 closed-loop 검증은 False다. 차량 회수 수단·경로·시간·합법 승하차 지점은 UNKNOWN이다.

일반 여행자는 보행과 원점복귀 수용성을 확인한다. 부모님·아이 동행은 계단·경사·엘리베이터 현행·승하차·휴식·복귀 부담을 먼저 본다. 3안이 저렴하다는 이유로 걷기 어려운 가족에게 권하지 않는다. 필요한 경우 방문 범위를 조정할 선택권을 남긴다.

### Course 02 — 오동도 + 케이블카

| 안 | 주차 후보 | 상태 | 확인 조건 |
|---|---|---|---|
| 1안 | 오동도 공영주차타워 | READY_FOR_REVIEW | 자산 출발, 현재 승강기·실제 보행, 편도/왕복과 차량회수 |
| 2안 | 오동도 입구 노상 | NEEDS_VERIFICATION | 정확 구획·위치, 타워와 다른 요금·정류장 접근 부담 |
| 3안 | 만들지 않음 | — | 박람회장 시설·접속이 미확인이므로 억지로 완성하지 않음 |

타워237면의 Founder·운영기관 인계값과 공식210/246 면수 차이를 동시에 보존한다. 타워와 입구노상37면은 별도 시설이다. 타워 최초60분·200원/10분과 입구노상 전화30분·500원/30분은 출처를 나눠 담았다. 최초1시간과 점심2시간 결합 사례는 남겼지만 자동3시간 무료는 금지다.

왕복 케이블카는 자산 복귀 후 주차장까지 연결 구간 확인이 필요하다. 편도라면 반대편에서 자산 주차차량을 회수할 계획이 추가로 필요하며, 구체적 교통수단·시간은 미확인이다. 공원 전체 무장애 접근으로 확대하지 않는다.

## 6. 고객 안내 가능 사실과 HOLD

현재 전 파일의 고객공개 승인값은 **False**, 실제 공개용 payload는 빈 배열이다. 다음은 Founder가 승인할 수 있는 **사실·문장 후보**를 구분한 것이다.

**검토 가능한 범위**

- 시설별로 출처가 직접 뒷받침하는 시설명·주소·기본요금 항목.
- 타워/입구노상, 터미널 차단기식/앞노상을 별개로 설명하는 안내.
- 전화 확인은 “운영기관 전화 안내로 인계된 내용”이라고 출처를 붙이는 조건부 문장.
- 케이블카 편도 이용 시 차량회수를 함께 고려해야 한다는 계획 안내.

**HOLD**

- 현재 잔여면수, 만차·회전속도·대기시간.
- 모든 시설의 점심·야간 무료, 자동3시간 무료.
- 10분 초과 요금, 버스13000의 과금단위, 무료 재입차·시간외 출차.
- 보행시간·평지·무계단·엘리베이터 연속 연결 보장.
- 종포225면과 물양장 동일시, 전시관 부설의 등대 이용객 개방 보장.
- 향일암2시간무료/1시간무료 및 현재 운영을 충돌 확인 없이 확정.

Code 보고가 BATCH01의 ‘향일암2시간무료’를 인용하지만 원문 정본은 미확보다. 이 인계 차이는 `HD01`로 별도 기록했다. 기존12개 충돌을 임의로 수정하거나 이미 해결했다고 표시하지 않았다.

## 7. Code 연결 전 확인 및 최소 검토 범위

Code Architecture Review가 보고한 기존 PSQ·C-3·UNKNOWN 대체 경로를 재사용 가능한 후보로 참고한다. Work는 실제 함수·현재 HEAD를 직접 확인하지 않았으며 구현 명령을 내리지 않는다.

**최소 Preflight 후보:** 광장 기본 시설 매핑, 오동도 타워↔오동도·케이블카 자산의 시설별 사실 연결. 이것이 3건의 READY_FOR_REVIEW 매핑이다. 전체18개 매핑·26개 시설·모든 대안 코스를 한 번에 노출할 이유는 없다.

Code가 확인할 것:

1. 최신 Project State·Current Next Action·Repository 장소코드 정본.
2. 연구용 parking ID와 기존 식별자 대응, 중복 시설 처리.
3. Option B 구조와 기존 `parking_ko`·`parking_trust`의 실제 연결점 및 UNKNOWN 대체 동작.
4. 승인된 고객문장/필드만 읽고 내부 충돌·미확인값이 확정 사실로 흘러나오지 않는지.
5. 정류장 방향 변경·동행자 변경·편도/왕복 변경 시 안내가 적절히 달라지고 불필요하게 반복되지 않는지.
6. 기존 C-3/PSQ 회귀 검증 범위. “데이터만 연결하니 회귀 없음”을 보장하지 않는다.

이번 Data Validation은 JSON·참조·보존 점검이다. Runtime·Production·실제 경로의 테스트 결과가 아니다.

## 8. Founder 승인 필요 사항

- Option B 최소 연결의 실제 구현 범위와 권한.
- 공식 사실 후보 및 FOUNDER_PHONE_REPORTED 문장의 고객 공개 범위.
- READY_FOR_REVIEW 매핑의 승인 여부, 미검증 대안·코스 노출 여부.
- 선제 안내 시점과 반복 안내 기준.
- 추가 시설·보행 검증이 완료되기 전 HOLD 유지 범위.

## 9. Project State 갱신 초안 및 ONE NEXT ACTION

별도 `Project_State_Update_Draft.md`는 제안문이며 기존 Project State 파일은 수정하지 않았다.

**ONE NEXT ACTION:** Founder/운영 루미가 네 필수 JSON과 공개 후보 범위를 검토한 뒤, 승인된 범위로 Claude Code의 **READ-ONLY Integration Preflight**를 진행할지 결정한다.

**Data Handover Ready → Founder Review → Claude Code Integration Preflight.**

코드·Repository·Git·DB·API·Schema·기존 SSOT·Production 변경 없음. 신규 주차장 조사·정식 Registry 생성·SSOT 승격 없음.
