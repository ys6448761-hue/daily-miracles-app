# SOUL Option 2 Level B — Inter-Place Emotional Continuity Closure Evidence V1

**Status:** CLOSED — DEPLOYED_AND_VERIFIED (R20 PRE-EXISTING FAIL TRACKED)
**Date:** 2026-10-19
**Feature:** SOUL JOURNEY_ADD 분기 장소 간 감정 전환 문장 (Level B)
**Implementation PR:** #84 — MERGED (Squash)
**Merge Commit SHA:** `855f6eb118df36d7d90caadb6029da55db7c9ce6`
**Render Deploy ID:** `dep-dbakl2om7kps7397r0fg`
**Production LIVE:** 2026-10-19 07:41 KST

---

## 1. Purpose / Scope

SOUL `JOURNEY_ADD` 분기에서 이전 포함 장소와 신규 장소 사이의 감정적 연결 문장을 정적으로 삽입하는 Level B 기능의 Closure 기록.

### Level B 구현 범위 (Founder 승인)

- **트리거:** `JOURNEY_ADD` 분기 전용 (JOURNEY_MULTI_PLACE 등 제외)
- **조건:** 선행 포함 장소(prior included)와 신규 장소 모두 `emotional_role` 보유 시에만 전환 문장 삽입
- **표현 형식:** `"[priorKo]의 [priorShort]에서, [nextKo]의 [nextShort][으로/로] 이어지는 여정이에요."`
- **데이터 표현:** Option A — `_PLACE_KNOWLEDGE` inline `emotional_role` 필드
- **향일암 제외:** Founder 결정 — emotional_role 미추가, Level B 비적용
- **이순신광장 제외:** 코드 설계상 Journey 대상 제외 (line 1949 주석)

### 적용 장소 5곳 (공식 감정 역할)

| 장소 코드 | 한국어 | `emotional_role` | 출처 |
|---|---|---|---|
| `cablecar` | 케이블카 | `'상승 / 시야 확장'` | SSOT-LOC-001 + Founder 결정 |
| `odongdo` | 오동도 | `'재충전 / 자연 회복'` | SSOT-ROUTE-002 (EP01 Day 2) |
| `dolsan_nightscape` | 돌산공원 | `'여운·다짐·마무리'` | Dolsan Park Phase 1 Closure Evidence |
| `marine_park` | 종포해양공원 | `'쉼 / 정리·고요함'` | SSOT-LOC-001 (종포해양공원 역할) |
| `dolsan_daegyo` | 돌산대교 | `'흐름·전환'` | Dolsan Bridge Phase 1 Closure Evidence |

---

## 2. Founder Authorization

| 결정 항목 | 내용 | 날짜 |
|---|---|---|
| Discovery 승인 | 읽기 전용 5단계 Design Discovery | 2026-10-18/19 |
| SSOT-LOC-001 출처 확인 | 5개 장소 감정 역할 SSOT 근거 확인 | 2026-10-19 |
| 구현 승인 | 5-place scope, JOURNEY_ADD 전용, Option A | 2026-10-19 |
| 향일암 제외 | Level B 대상 아님 (emotional_role 미추가) | 2026-10-19 |
| 케이블카 역할 결정 | `'상승 / 시야 확장'` (SSOT-LOC-001 우선) | 2026-10-19 |
| PR #84 Squash Merge 승인 | G-1~G-5 조건부 | 2026-10-19 |
| Render Production 배포 승인 | Service `srv-d3kt93b3fgac73a3nt1g`, SHA `855f6eb` | 2026-10-19 |
| Closure Documentation 승인 | Docs-only PR | 2026-10-19 |

---

## 3. SSOT Alignment

| 항목 | 내용 |
|---|---|
| SSOT-LOC-001 | `docs/ssot/media/SSOT-LOC-001_DreamTown_Yeosu_Locations.md` — EP01 7개 장소 감정 역할 마스터 |
| SSOT-ROUTE-002 | `docs/ssot/episodes/SSOT-ROUTE-002_EP01_Experience_Route.md` — odon Day 2 역할 근거 |
| Dolsan Closure Docs | `SOUL_DOLSAN_PARK_PHASE1_CLOSURE_EVIDENCE_V1.md` / `SOUL_DOLSAN_BRIDGE_PHASE1_CLOSURE_EVIDENCE_V1.md` |
| Founding Principle | SOUL은 완벽한 지식 전에 관계를 시작한다 |

---

## 4. Implementation Evidence

### A. `_PLACE_KNOWLEDGE` — `emotional_role` 추가 (5곳)

`services/soyeowoolService.js`:

```js
// cablecar (~line 229)
emotional_role: '상승 / 시야 확장',

// odongdo (~line 236)
emotional_role: '재충전 / 자연 회복',

// dolsan_nightscape (~line 282)
emotional_role: '여운·다짐·마무리',

// marine_park (~line 293)
emotional_role: '쉼 / 정리·고요함',

// dolsan_daegyo (~line 302)
emotional_role: '흐름·전환',
```

### B. `_CONV_GOLDEN_KO` 확장 (3개 항목 추가)

```js
const _CONV_GOLDEN_KO = {
  odongdo: '오동도',
  cablecar: '케이블카',
  hyangiram: '향일암',
  marine_park: '종포해양공원',       // NEW
  dolsan_nightscape: '돌산공원',     // NEW
  dolsan_daegyo: '돌산대교',         // NEW
};
```

### C. `_extractGoldenPlaceCode` 확장 (3개 패턴 추가)

```js
if (/종포해양공원|해양공원/.test(message)) return 'marine_park';
if (/돌산공원/.test(message)) return 'dolsan_nightscape';
if (/돌산대교/.test(message)) return 'dolsan_daegyo';
```

### D. `_handleJourneyDecision` JOURNEY_ADD 분기 Level B 로직

```js
else if (decisionType === 'JOURNEY_ADD' && placeCode) {
  const ko = _CONV_GOLDEN_KO[placeCode];
  const priorIncluded = updatedConvJourney.places.filter(
    p => p.status === 'included' && p.code !== placeCode
  );
  updatedConvJourney.places = _convJourneyUpsertPlace(updatedConvJourney, placeCode, { status: 'included' });
  const includedKo = _convJourneyIncludedKo(updatedConvJourney);
  soulMsg = `${ko}도 함께 넣을게요.\n지금까지: ${includedKo}.`;
  const priorPlace = priorIncluded.length > 0 ? priorIncluded[priorIncluded.length - 1] : null;
  if (priorPlace) {
    const priorKnowledge = _PLACE_KNOWLEDGE[priorPlace.code];
    const nextKnowledge = _PLACE_KNOWLEDGE[placeCode];
    const priorRole = priorKnowledge && priorKnowledge.emotional_role;
    const nextRole = nextKnowledge && nextKnowledge.emotional_role;
    if (priorRole && nextRole) {
      const priorKo = _CONV_GOLDEN_KO[priorPlace.code] || priorPlace.code;
      const priorShort = priorRole.split(/[\/·]/)[0].trim();
      const nextShort = nextRole.split(/[\/·]/)[0].trim();
      const uro = _koreanParticle(nextShort, '으로', '로');
      soulMsg += `\n${priorKo}의 ${priorShort}에서, ${ko}의 ${nextShort}${uro} 이어지는 여정이에요.`;
    }
  }
  nextOptions = ['향일암까지 가능해?', '다른 곳은요?'];
}
```

---

## 5. Code PR / Merge Evidence

| 항목 | 값 |
|---|---|
| PR URL | https://github.com/ys6448761-hue/daily-miracles-app/pull/84 |
| PR Title | feat(soul): option2 level-b inter-place emotional continuity (#84) |
| PR State | MERGED |
| Merge Method | Squash |
| PR HEAD SHA | `5792ef91cff596ecc9bcb45d56720324f8447fd1` |
| Merge Commit SHA | `855f6eb118df36d7d90caadb6029da55db7c9ce6` |
| Merge 시각 UTC / KST | `2026-10-18T22:21:41Z` / 2026-10-19 07:21 KST |
| 머지 실행자 | `ys6448761-hue` (Founder 직접 실행) |
| 변경 파일 | `services/soyeowoolService.js` (+36/-2) · `tests/soul/soulLevelBEmotionalContinuity.test.js` (+348, 신규) |

---

## 6. CI Gate Evidence

| Gate | 결과 | Run ID / SHA |
|---|---|---|
| AIL Gate | **PASS** | run `39171241546` / HEAD `5792ef9` |
| docker-smoke | **PASS** | run `39170761383` / HEAD `5792ef9` |
| Vercel | PRE-EXISTING FAIL (비필수) | — |
| Level B 신규 테스트 | **14/14 PASS** | `tests/soul/soulLevelBEmotionalContinuity.test.js` |
| 신규 회귀 | **0건** | — |

### AIL Gate 이력

- 1차 FAIL: run `39170761444` — PR body에 `[AIL]` 섹션 누락
- 2차 PASS: run `39171241546` — PR body에 `## [AIL] 지시서` + `` ```ail `` 블록 추가 후 재트리거

---

## 7. Render Production Evidence

| 항목 | 값 |
|---|---|
| Service ID | `srv-d3kt93b3fgac73a3nt1g` |
| Deploy ID | `dep-dbakl2om7kps7397r0fg` |
| Merge Commit SHA | `855f6eb118df36d7d90caadb6029da55db7c9ce6` |
| Live SHA (verified) | `855f6eb118df36d7d90caadb6029da55db7c9ce6` |
| Server started_at | `2026-10-18T22:41:50.804Z` |
| Deploy Time KST | 2026-10-19 07:41 KST |
| Production URL | https://app.dailymiracles.kr |
| Endpoint Health | HTTP 200 `/api/health` 정상 |

---

## 8. Production Runtime QA Evidence

**QA Script:** `tmp/qa_level_b_v2.js`
**Executed:** 2026-10-19 KST (이번 세션)

**QA 방법론 주석:**
- 최초 QA (`tmp/qa_level_b_emotional_continuity.js`)는 `sowon_id`를 전달 → 매 요청마다 새 `session_id` 생성 → Journey Context 미누적
- 수정 QA (`tmp/qa_level_b_v2.js`)는 첫 응답의 `session_id`를 후속 요청에 전달 → Journey Context 정상 누적 확인

### Positive (전환 문장 검증)

| 케이스 | 선행 장소 | 신규 장소 | 전환 문장 | 결과 |
|---|---|---|---|---|
| LB-P1 | (없음) | 케이블카 | 전환 문장 미생성 | **PASS** |
| LB-P2 | 케이블카(상승) | 오동도(재충전) | "케이블카의 상승에서, 오동도의 재충전으로 이어지는 여정이에요." | **PASS** |
| LB-P3 | 오동도(재충전) | 돌산공원(여운) | "오동도의 재충전에서, 돌산공원의 여운으로 이어지는 여정이에요." | **PASS** |
| LB-P4 | 돌산대교(흐름) | 돌산공원(여운) | "돌산대교의 흐름에서, 돌산공원의 여운으로 이어지는 여정이에요." | **PASS** |

### Negative (향일암 Fallback)

| 케이스 | 설명 | 결과 |
|---|---|---|
| LB-N1a | 오동도 첫 번째 추가 | **PASS** |
| LB-N1b | 향일암을 신규 장소로 추가 → 전환 문장 미생성 (emotional_role 없음) | **PASS** |
| LB-N2 | 향일암이 선행 장소 → 전환 문장 미생성 | **PASS** |

### Isolation

| 케이스 | 결과 |
|---|---|
| ISO-1 케이블카 PLACE_LOOKUP — Level B 미주입 | **PASS** |
| ISO-2 이순신광장 PLACE_LOOKUP — 기존 동작 유지 | **PASS** |
| ISO-3 PSQ (케이블카 입장료) — Level B 미주입 | **PASS** |
| R20 PRE-EXISTING — JOURNEY_CONTINUITY "일정에 넣어볼까요?" (신규 위험 응답 없음) | PASS (서버 정상) |

**Journey Context 누적 확인:**
- LB-P2 `conv_journey.places`: `[{cablecar, included}, {odongdo, included}]` — 2개 누적 ✓
- LB-N1b `conv_journey.places`: `[{odongdo, included}, {hyangiram, included}]` — 2개 누적 ✓

**"undefined" 포함 여부:** 0건 — `_CONV_GOLDEN_KO` null guard 정상 동작

**Total: 13/13 PASS**

---

## 9. Unit Test Evidence

**파일:** `tests/soul/soulLevelBEmotionalContinuity.test.js`
**Coverage:** 14 tests

| 분류 | 케이스 | 결과 |
|---|---|---|
| Positive | LB-P1~P4 (4개) | 14/14 PASS |
| Negative | LB-N1~N3 (3개) | |
| Isolation | LB-I1~I7 (7개) | |

---

## 10. Known Pre-existing Issues

### R20 — PRE-EXISTING FAIL / UNRESOLVED

- **입력:** "돌산대교 걸어서 건너갈 수 있어?"
- **실제 routing:** JOURNEY_CONTINUITY "일정에 넣어볼까요?" (예상: PLACE_SPECIFIC_QUERY)
- **원인:** `_extractGoldenPlaceCode` dolsan_daegyo 미인식 + `_isPlaceSpecificQuery` "건너" 미매칭
- **Level B 영향:** 없음 (PRE-EXISTING)
- **Phase 2 후보:** `_extractGoldenPlaceCode` dolsan_daegyo 인식 추가

---

## 11. Scope Preservation (변경 없음 확인)

| 항목 | 상태 |
|---|---|
| EP01 Route / SSOT | 변경 없음 |
| 향일암 기존 SOUL 기능 | 유지 (ISO 확인) |
| 이순신광장 기존 SOUL 기능 | 유지 (ISO 확인) |
| R20 미해결 상태 | 유지 (PRE-EXISTING FAIL) |
| P-2 / P-6 Advisory | 변경 없음 |
| DB · Schema · Environment | 변경 없음 |
| Render 서비스 설정 | 변경 없음 |
| JOURNEY_ADD 외 분기 | Level B 미적용 |

---

## 12. Governance Compliance

| 항목 | 상태 |
|---|---|
| Guardian Preflight | 발행 완료 (Implementation Status: READY) |
| Product Contract | TASK_ALIGNED |
| 변경 파일 수 | 2 (승인 범위 일치) |
| AIL Gate | PASS (run 39171241546) |
| Squash Merge | 완료 (Founder 직접 실행) |
| 신규 LDF 분기 | 없음 |
| DB / Schema / Environment | 변경 없음 |
| hyangiram emotional_role | 미추가 (Founder 결정) |
| JOURNEY_ADD 외 적용 | 없음 |

---

## 13. Closure Verdict

**`CLOSED — DEPLOYED_AND_VERIFIED (R20 PRE-EXISTING FAIL TRACKED)`**

- Level B 기능: Production 정상 동작 확인 (13/13 PASS)
- 전환 문장: 3가지 조합 Production 검증 완료
- 신규 회귀: 0건
- Journey Context 누적: Production 정상 확인

---

## 14. Handover

- **다음 단계:** Closure Evidence Docs-only PR Founder Squash Merge 승인
- **R20 Phase 2 후보:** `_extractGoldenPlaceCode` dolsan_daegyo 인식 + PSQ 분기 개선
- **marine_park Production 전환 문장 미검증:** LB-P4에서 dolsan_daegyo 사용 (marine_park 조합은 단위 테스트에서만 확인)
- **hyangiram Level B:** Deferred — 별도 Founder 승인 필요
