# MAP V0.1 Final Marker Closeout — Evidence

**Date**: 2026-10-27  
**Status**: MAP_V01_FINAL_MARKER_CLOSEOUT_VERIFIED  
**Authorization**: MAP_V01_FINAL_MARKER_CLOSEOUT_AUTHORIZED (Founder)

---

## §1 조사 결과 — 종포해양공원 누락 원인

Founder 보고: "종포해양공원이 마커 위치 지정 카테고리에서 누락됨"

### 조사 결론

`marine_park`(종포해양공원)은 **이미 Task 2 (SHA `26afeac`, 2026-10-27)에서 수정 완료**.

| 파일 | 상태 |
|------|------|
| `PLACEMENT_TARGETS` (YeosuMapSelector.jsx line 53) | ✅ zone: 1 포함 |
| `YEOSU_PLACES` (yeosuMapData.js line 51) | ✅ zone: 1, tg_ready, markerPos.oldtown 있음 |
| `QA_OLDTOWN_POSITIONS` (yeosuMapData.js line 244) | ✅ confirmed: true, zone: 1 |

Founder 관측 시점은 Task 2 수정 이전(5개 목록) 기준으로 추정.

---

## §2 9개 장소 최종 목록

| # | place_id | name_ko | zone | markerPos 상태 |
|---|----------|---------|------|--------------|
| 1 | lee_soon_shin_plaza | 이순신광장 | 1 | PROVISIONAL (흰 원, Founder 지정 필요) |
| 2 | marine_park | 종포해양공원 | 1 | PROVISIONAL (0.387, 0.509) |
| 3 | romantic_pojangmacha | 낭만포차거리 | 1 | PROVISIONAL (0.593, 0.599) — "낭만포다" 라벨 ✅ |
| 4 | hamel_lighthouse | 하멜등대 | 1 | PROVISIONAL (0.519, 0.718) — "하멜등다" 라벨 ✅ |
| 5 | odongdo | 오동도 | 2 | PROVISIONAL (0.853, 0.340) |
| 6 | cablecar | 케이블카 | 2 | PROVISIONAL (0.69, 0.57) — AMBIGUOUS |
| 7 | yeosu_expo_park | 엑스포공원 | 2 | 없음 — Founder 지정 필요 |
| 8 | sky_tower | 스카이타워 | 2 | 없음 — Founder 지정 필요 |
| 9 | jaisan_park | 자산공원 | 2 | PROVISIONAL (0.582, 0.495) — 이미지 마커 없음 |

---

## §3 package.json 정리

`"daily-miracles-mvp": "file:.."` — 이전 세션에서 의도치 않게 추가된 항목 제거.  
`package-lock.json` 재생성.

---

## §4 Founder 직접 지정이 필요한 장소 (드래그 에디터 사용)

| 장소 | 이유 |
|------|------|
| 이순신광장 | 흰 원 표시 → 픽셀 추출 불가 |
| 엑스포공원 | 이미지에 마커 없음 |
| 스카이타워 | 이미지에 마커 없음 |
| 자산공원 | 이미지에 마커 없음, 기존값은 추정치 |
| 케이블카 | AMBIGUOUS — 정확한 위치 확인 필요 |

---

## §5 검증

| 항목 | 결과 |
|------|------|
| 빌드 | ✅ |
| 테스트 | ✅ 639/640 PASS (R20 PRE-EXISTING 유지) |
| 9개 장소 PLACEMENT_TARGETS 포함 | ✅ |
| 기존 좌표 보존 | ✅ |
| EXPLORER → TG_READY 승격 없음 | ✅ |
| package.json 정리 | ✅ |

---

## §6 Founder QA 절차

1. `node server.js` 재시작
2. `http://localhost:5000/muyojeong?qa_preview=boundary`
3. Zone 1 또는 Zone 2 진입
4. "📍 마커 위치 지정 모드 시작" 클릭
5. **Zone 1 섹션**: 이순신광장·종포해양공원·낭만포차거리·하멜등대 4개 확인 ← 종포해양공원 포함됨
6. **Zone 2 섹션**: 오동도·케이블카·엑스포공원·스카이타워·자산공원 5개 확인
7. 지도 마커를 드래그하여 위치 지정
8. "전체 좌표 복사" → 코드야에게 전달
