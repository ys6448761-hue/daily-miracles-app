# MUYOJEONG_PR134_RELEASE_APPROVAL_READY Evidence

**Date**: 2026-10-30  
**Status**: MUYOJEONG_PR134_RELEASE_APPROVAL_READY  
**분류**: 승인 기록 정정 + 최종 Release Gate 정리

---

## §1 Zone 1 FOUNDER_VISUAL_ACCEPTED 정정

| 항목 | 내용 |
|------|------|
| Founder 직접 발언 | "루미야 존1도 이상없어" |
| 발언 시점 | 2026-10-30 (MUYOJEONG_RELEASE_GATE_RECONCILED 보고 직후) |
| 이전 기록 | AMBIGUOUS_PENDING |
| 정정 | **MAP_V01_ZONE1_FOUNDER_VISUAL_ACCEPTED ✅** |
| 대상 | Zone 1 원도심 해안권 7곳 (이순신광장·낭만포차거리·하멜등대·고소동·진남관·오포대·종포해양공원) |
| 재검수 요청 | ❌ 없음 — Founder 직접 발언으로 확정 |

---

## §2 Zone별 최종 VISUAL_ACCEPTED 상태

| Zone | NAME | FOUNDER_VISUAL_ACCEPTED | 근거 |
|------|------|------------------------|------|
| 1 | 원도심 해안권 (7곳) | ✅ | "루미야 존1도 이상없어" (2026-10-30) |
| 2 | 오동도·엑스포권 (11곳) | ✅ | "오케이 정상이야" (SHA 81b4cd0, 2026-10-30) |
| 3 | 돌산권 (5곳) | 좌표 직접 전달 (암묵적) | Founder 초안 좌표 직접 전달 |
| 4 | 향일암권 (4곳) | 좌표 직접 전달 (암묵적) | Founder 좌표 16/16 일치 확인 |
| 5 | 소호·장도권 (5곳) | FOUNDER_VISUAL_QA_PENDING | 화면 확인 대기 (오픈 후 보완) |
| 6 | 화양·여자만권 (4곳) | ✅ | "완벽해" (2026-10-29) |
| 7 | 섬섬길 (4곳 + offMap 2) | FOUNDER_VISUAL_QA_PENDING | 화면 확인 대기 (오픈 후 보완) |

---

## §3 출시 차단 이슈 (최종)

| 항목 | 상태 |
|------|------|
| **PR #134 Founder merge 승인** | ⏳ **유일한 merge 차단** |
| **Production deploy 승인** | ⏳ merge 이후 별도 Founder 승인 필요 |

**PR merge ≠ Production deploy**: 두 가지는 별도 승인 행위.

---

## §4 거버넌스 조건 확인

| 항목 | 상태 | 해제 조건 |
|------|------|---------|
| CAR GOVERNANCE_HOLD | **유지** | 이동시간 검증 데이터 + 별도 Founder 승인 — 이번 작업 범위 아님 |
| PROVISIONAL 마커 미노출 | **유지** | `status:'PROVISIONAL'` → 일반 사용자 미표시. VERIFIED 승격 = Founder 명시 승인 필요 |
| Architecture Guard PILOT | 유효 | PR 필수 / AIL Gate 통과 후 merge |

---

## §5 실제 공개 범위 (PR #134 merge 후)

**Production 공개 기능**:
- `/muyojeong` 진입 → SOUL 4버튼 + 자유 입력
- 맞춤 항로 V0.1 (장소 선택 + 시간 입력)
- Living Detail: 케이블카·오동도·향일암
- 지역별 지도 UI (Zone 1~7 선택 가능)
- SOUL 답변 + CourseDisplay

**PROVISIONAL 마커 — 일반 사용자 미노출**:
- Zone 1·2·3·4·5·6·7 모든 마커: `status:'PROVISIONAL'`
- 지도 UI는 표시되나 장소 마커 없음 (QA Preview 전용)
- VERIFIED 승격 후 순차 노출 (Founder 명시 승인 필요)

---

## §6 출시 후 개선 과제 (merge 차단 아님)

| 항목 | 비고 |
|------|------|
| Zone 5·7 FOUNDER_VISUAL_ACCEPTED | PROVISIONAL 마커 VERIFIED 승격 전제조건 |
| Zone 1·2 여수 수산시장·엑스포 바닷길·만성리해수욕장 | PLACEMENT_PENDING — 좌표 미배치 |
| 음식/카페 큐레이션 | travel_restaurants 데이터 추가 |
| CAR GOVERNANCE_HOLD 해제 | 이동시간 검증 별도 작업 |
| Zone 4~7 SOUL Phase 2 | experience_ko 등록 |

---

## §7 Current Next Action

**PR #134 Founder merge 승인 → Production deploy 승인**

merge 후 SOUL + 맞춤 항로 + Living Detail + 지도 UI 전체 Production 반영.  
지도 마커: PROVISIONAL → 사용자 미노출. VERIFIED 승격 후 순차 노출.
