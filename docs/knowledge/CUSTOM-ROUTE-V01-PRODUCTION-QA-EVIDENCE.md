# 맞춤 항로 V0.1 — Production QA Evidence

**Date**: 2026-10-25  
**Production SHA**: `98550fb`  
**Deploy ID**: `dep-dbeqvi1srm7s73d2i7ig`  
**QA 실행**: Founder (실제 브라우저 제출)

---

## Founder Production QA 결과

| 항목 | 결과 |
|------|------|
| 장소 선택 | 하멜등대 + 향일암 ✅ |
| 시간 입력 | 270분 직접 입력 ✅ |
| SOUL 제출 | 성공 ✅ |
| 장소 포함 여부 | 하멜등대·향일암 모두 코스에 포함 ✅ |
| 응답 문구 | "5시간 정도 시간이 있으시군요." ⚠️ BUG |
| 코스 구성 | 하멜등대 30분 → 이동 약 45분 → 향일암 120분 → 이동시간 확인 중 → 케이블카 45분 |
| 체류시간 합계 | 195분 (30+120+45) |
| 확인된 체류+이동 합계 | 240분 (195+45) |
| 전체 이동시간 | 미검증 (travel_time_unverified 정상 동작) |

**판정**: PRODUCTION_RUNTIME_PASS_WITH_FINDINGS

---

## Finding: 시간 표시 오류

### 증상

```
입력: 270분
표시: "5시간 정도 시간이 있으시군요."
예상: "4시간 30분 정도 시간이 있으시군요."
```

### 근본 원인

`services/soyeowoolService.js` line 1785 (수정 전):
```js
: `${Math.round(timeMinutes / 60)}시간`
```

- `Math.round(270 / 60)` = `Math.round(4.5)` = **5** → "5시간"
- JavaScript의 `Math.round`는 .5를 올림 처리
- 동일 파일 line 650에 이미 경고 주석 있음:  
  _"Exact hours+minutes display avoids Math.round() overstating non-round values (e.g. 90 min → 1h30m not 2h)"_

### 영향 범위

| 입력 | 수정 전 (잘못) | 수정 후 (정확) |
|------|--------------|--------------|
| 270분 | 5시간 ❌ | 4시간 30분 ✅ |
| 90분 | 2시간 ❌ | 1시간 30분 ✅ |
| 150분 → | 3시간 ❌ | 2시간 30분 ✅ |
| 120분 | 2시간 ✅ | 2시간 ✅ (무변화) |
| 300분 | 5시간 ✅ | 5시간 ✅ (무변화) |
| 480분 | 8시간 ✅ | 8시간 ✅ (무변화) |

Quick Time 칩 값(120, 300, 480)은 모두 60의 배수 → 영향 없음.  
**직접 입력(custom minutes) 경로만 영향**: 270분, 90분, 150분 등 비정수 시간.

### 수정 내용 (PR #133)

```js
// After — soyeowoolService.js:1783
const timeLabel = timeMinutes < 60
  ? `${timeMinutes}분`
  : timeMinutes % 60 === 0
    ? `${Math.floor(timeMinutes / 60)}시간`
    : `${Math.floor(timeMinutes / 60)}시간 ${timeMinutes % 60}분`;
```

### 테스트 결과

`soulTimeLabelDisplay` TL-1~TL-7: **7/7 PASS**  
전체 soul 테스트: 233/234 (R20 PRE-EXISTING)  
전체: 615/616 (R20 PRE-EXISTING)

---

## 정상 확인 항목

| 항목 | 결과 | 비고 |
|------|------|------|
| 하멜등대 + 향일암 코스 포함 | ✅ | PLACE_ALIAS_MAP 정상 |
| 하멜→향일암 이동 45분 | ✅ | P2 VERIFIED_TRAVEL_EDGE |
| 향일암→케이블카 "이동시간 확인 중" | ✅ | travel_time_unverified 정상 동작 |
| 케이블카 포함 (추가 장소) | ✅ | 270분 예산 내 정상 추가 |
| 전체 fitStatus | ⚠️ travel_time_unverified | 미검증 구간(향일암→케이블카) 포함 → fits_comfortably 확정 불가 |

---

## 코스 수학적 검증

```
하멜등대  30분 체류
이동      45분 (hamel→hyangiram, VERIFIED P2)
향일암   120분 체류
이동        ? (hyangiram→cablecar, UNVERIFIED — 이동시간 확인 중)
케이블카  45분 체류
─────────────────────────────────────────────────
확인된 체류+이동 합계: 240분 (195체류 + 45이동)
미검증 이동:          UNKNOWN (hyangiram→cablecar)
전체 합계:            240분 + ? (확정 불가)
예산:                 270분
전체 예산 적합성:     확정 불가 — fitStatus = travel_time_unverified
```

**주의**: 확인된 240분 < 270분이나, 미검증 이동시간이 0~30분 이상일 수 있어  
전체 코스가 270분 예산에 맞는지는 Founder NAVER 측정 전까지 확정 불가.

---

## PR #133 Production QA Closure

**Guardian 판정**: PR133_PRODUCTION_QA_PASS / TIME_LABEL_FINDING_RESOLVED

| 항목 | 결과 |
|------|------|
| Production SHA | `425a643` |
| Deploy ID | `dep-dberknvavr4c73btaoj0` |
| LIVE 시각 | 2026-10-25 17:17 KST |
| 응답 문구 | "4시간 30분 정도 시간이 있으시군요." ✅ |
| 기존 오류 "5시간" | **RESOLVED** ✅ |
| 하멜등대 포함 | ✅ |
| 향일암 포함 | ✅ |
| 하멜등대→향일암 이동 | 약 45분 표시 ✅ |
| 향일암→케이블카 이동 | "이동시간 확인 중" (travel_time_unverified 유지) |
| 체류시간 합계 | 195분 (30+120+45) |
| 전체 270분 적합성 | ⚠️ 미확정 (travel_time_unverified) |

## 후속 계획

| 항목 | 상태 |
|------|------|
| PR #133 Production QA | **CLOSED** ✅ (2026-10-25 17:17 KST) |
| hyangiram→cablecar 이동시간 | Founder NAVER 측정 후 VERIFIED_TRAVEL_EDGES 추가 (별도) |
| PR #134 State Sync | OPEN — Founder merge 승인 필요 |
