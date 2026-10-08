# SOUL Dolsan Park Living Detail — Runtime QA V1 Evidence

**Commit:** `274ff41`  
**Date:** 2026-10-09  
**Author:** Lumi (Claude Code) + automated API tests  
**Scope:** `/soul/cable-car?place=dolsan_nightscape`  
**Production:** 변경 없음 (로컬 port 5000 검증만)

---

## QA 결과 요약

| 항목 | 결과 | 비고 |
|---|---|---|
| 1. SOUL PLACE_LOOKUP 라우팅 | **PASS** | `dolsan_nightscape` PLACE_KNOWLEDGE 정상 |
| 2. 이미지 4종 정적 서빙 | **PASS** | 200 OK / 2.6~3.6MB |
| 3. QA질문 — 주차 요금 | **PASS** | GUARDRAIL 위반 없음 (150대 미노출) |
| 4. QA질문 — 휠체어 준공기념탑 | **PASS** | `accessibility_wheelchair_status=unknown` → 미확인 응답 |
| 5. QA질문 — 차량 전망대 접근 | **PASS** | PSQ 미매칭 → 정적 콘텐츠 커버 |
| 6. 150대 무료 문구 노출 여부 | **PASS** | SOUL 응답에 미포함 (7개 쿼리 확인) |
| 7. 기존 케이블카 회귀 | **PASS** | PLACE_LOOKUP=cablecar 정상 |
| 8. 기존 오동도 회귀 | **PASS** | PLACE_LOOKUP=odongdo 정상 |
| 9. 기존 향일암 회귀 | **PASS** | PLACE_LOOKUP=hyangiram 정상 |
| 10. `_PLACE_KNOWLEDGE.admission_ko` | **FINDING** | 아래 상세 참조 |

---

## 검증 상세

### 1. SOUL PLACE_LOOKUP 라우팅

```
Query: "돌산공원 주차요금 알려줘"
→ STATUS: PLACE_LOOKUP
→ presentation_mode: PLACE_KNOWLEDGE
→ resolved_code: dolsan_nightscape
→ place_identity_ko: "돌산도에서 여수 도심과 바다를 바라보는 야경 포인트예요..."
```

**PASS**: `dolsan_nightscape`가 SOUL API에서 정상적으로 인식되고 PLACE_KNOWLEDGE 모드로 응답.

---

### 2. 이미지 4종 정적 서빙

| 경로 | HTTP | 크기 |
|---|---|---|
| `/images/soul/place-hero/dolsan-nightscape.png` | 200 | 2.8MB |
| `/images/soul/dolsan-nightscape/experience-v1.png` | 200 | 2.7MB |
| `/images/soul/dolsan-nightscape/context-v1.png` | 200 | 3.5MB |
| `/images/soul/dolsan-nightscape/journey-v2.png` | 200 | 2.5MB |

**PASS** (4/4)

기존 이미지도 정상:

| 경로 | HTTP |
|---|---|
| `/images/soul/place-hero/cablecar.png` | 200 |
| `/images/soul/place-hero/odongdo.png` | 200 |
| `/images/soul/place-hero/hyangiram.png` | 200 |

---

### 3-5. QA 질문 3종

**QA3: 공영주차장 요금**
```
"돌산공원 주차요금 알려줘" → PLACE_KNOWLEDGE (general summary)
150대/무료주차 문구: 미포함 → GUARDRAIL_OK
```

**QA4: 휠체어 준공기념탑**
```
"돌산공원 휠체어 알려줘" 등 → CLARIFICATION or PLACE_KNOWLEDGE
accessibility_wheelchair_status=unknown → "아직 정확하게 확인되지 않았어요."
계단/무단차 보장 문구: 미노출 → GUARDRAIL_OK
```

**QA5: 차량 전망대 접근**
```
"돌산공원 차량으로 전망대 인근까지 이동할 수 있나요?" → CLARIFICATION
PSQ 패턴 미매칭 (차량 접근 PSQ 미구현)
→ 정적 Living Detail 콘텐츠(Journey 두 경로)로 커버됨
```

---

### 6. GUARDRAIL: 150대 무료 문구 노출 여부

**검증된 7개 쿼리에서 미노출 확인:**

| 쿼리 | 결과 |
|---|---|
| "돌산공원 주차요금 알려줘" | PLACE_KNOWLEDGE (general) — 150대 미포함 |
| "돌산공원 무료 주차 어디에 있어요" | CLARIFICATION — 미포함 |
| "돌산공원 입장료 있어요" | CLARIFICATION — 미포함 |
| "돌산공원 입장료 얼마예요" | CLARIFICATION — 미포함 |
| "돌산공원 주차" | CLARIFICATION — 미포함 |
| 세션 follow-up "입장료 얼마예요" | CLARIFICATION — 미포함 |
| place_code=dolsan_nightscape "입장료 얼마예요" | CLARIFICATION — 미포함 |

**결론:** 현재 SOUL 응답에서 "150대", "승용차", "대형차", "주차도 무료" 문구 미노출. GUARDRAIL_OK.

---

### 7-9. 기존 장소 회귀 검증

| 장소 | 쿼리 | 결과 |
|---|---|---|
| 케이블카 | "케이블카 요금 알려줘" | PLACE_LOOKUP/cablecar PASS |
| 오동도 | "오동도 알려줘" | PLACE_LOOKUP/odongdo PASS |
| 향일암 | "향일암 알려줘" | PLACE_LOOKUP/hyangiram PASS |

**회귀 없음.** 단, "오동도 어떻게 가요" / "향일암 일출 시간" 등 PSQ 패턴 미매칭 쿼리는 기존과 동일하게 CLARIFICATION 반환 (이는 내 변경 이전부터의 동작).

---

## FINDING: Latent Data Defect — soyeowoolService.js

**위치:** `services/soyeowoolService.js` line 117

```javascript
dolsan_nightscape: {
  admission_ko: '무료예요. 주차도 무료예요 (승용차 150대, 대형차 15대).',
  // ...
}
```

**문제:**
1. "주차도 무료예요" — 사실 아님 (최초 1시간 무료, 이후 10분당 200원). V1.1 결정과 불일치.
2. "승용차 150대, 대형차 15대" — 공식 집계 범위 미확인. V1.1 가드레일 위반.

**현재 노출 상태:** LATENT DEFECT (현재 SOUL API 응답 경로에서 미노출)
- `_isPlaceSpecificQuery` + PLACE_LOOKUP 복합 경로에서 현재 해당 필드가 response에 포함되지 않음 (테스트 7개 모두 미노출 확인)
- 하지만 PSQ 패턴이 미래에 확장되거나 `_buildPlaceSpecificQueryPayload`가 직접 호출되는 경우 노출 위험

**제안 수정 (Founder 승인 후 최소 범위):**

```javascript
// soyeowoolService.js line 117 수정안
dolsan_nightscape: {
  admission_ko: '무료예요.',
  parking_ko: '공영주차장이 있어요. 최초 1시간 무료, 이후 10분당 200원이에요. 방문 전 현장 확인을 권장해요.',
  // ...
}
```

**구현 상태:** PROPOSED_ONLY — Founder 승인 전 코드 수정 없음.

---

## 미검증 항목 (로컬 서버 특성상)

| 항목 | 이유 | 권장 |
|---|---|---|
| 브라우저 UI 렌더링 | Claude Code 환경 — 브라우저 직접 접근 불가 | Founder 로컬 브라우저에서 `/soul/cable-car?place=dolsan_nightscape` 직접 확인 |
| 모바일 레이아웃 | 동일 | 모바일 뷰포트에서 확인 |
| 데스크톱 레이아웃 | 동일 | 동일 |

---

## Project State 갱신안

```
SOUL Dolsan Park Living Detail V1.1 — RUNTIME_QA_COMPLETE
Commit: 274ff41
API: PASS (10/10 항목 중 9 PASS, 1 LATENT_FINDING)
Images: 4/4 PASS
Regression: 3/3 PASS
FINDING: admission_ko latent defect — Founder 결정 필요
Next: Founder 브라우저 검증 → LATENT DEFECT 수정 승인 → CLOSED
```

---

**STOP — Founder / Lumi Review. Production 배포 금지.**
