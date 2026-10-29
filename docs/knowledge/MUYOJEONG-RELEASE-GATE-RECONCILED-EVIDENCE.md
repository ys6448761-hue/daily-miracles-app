# MUYOJEONG_RELEASE_GATE_RECONCILED Evidence

**Date**: 2026-10-30  
**Status**: MUYOJEONG_RELEASE_GATE_RECONCILED ✅  
**분류**: READ-ONLY — 기존 Founder 승인 기록 정합성 확인 및 보정

---

## §1 Founder 승인 발언 대조

| Zone | Founder 발언 | 이전 기록 | 판정 | 조치 |
|------|------------|---------|------|------|
| Zone 2 | "오케이 정상이야" (SHA 81b4cd0 이후) | FOUNDER_FINAL_VISUAL_QA_PENDING | **명시적 수용** | MAP_V01_ZONE2_FOUNDER_VISUAL_ACCEPTED ✅ 신규 기록 |
| Zone 6 | "완벽해" | FOUNDER_VISUAL_ACCEPTED ✅ (line 53) + FOUNDER_VISUAL_QA_PENDING 잔류 (line 61) | 이미 기록됨 / 잔류 텍스트 충돌 | line 61 잔류 텍스트 수정 |
| Zone 1 | "다른 권역 정상 반영을 언급" | 미기록 | 간접 언급 — per-marker 명시 수용 아님 | AMBIGUOUS_PENDING 유지 |

**Zone 1 AMBIGUOUS 판정 근거**:  
발언이 특정 Zone 1 마커 위치를 직접 확인했다는 의미가 아님.  
Zone 1·2는 동일 이미지(yeosu-oldtown-v01.png)를 공유하나, QA Preview에서 권역별로 분리 표시됨.  
Zone 2 확인 시 Zone 1 마커는 별도 화면에 있어 동시 확인 보장 안 됨.

---

## §2 PROVISIONAL 마커 노출 정책 재확인

```javascript
// YeosuMapSelector.jsx / yeosuMapData.js
getMarkersForImage(imageKey, { includeProvisional = false } = {})
// isQAPreview=false → includeProvisional=false → status:'PROVISIONAL' 마커 미노출
```

- Zone 1 전체 7곳: `status: 'PROVISIONAL'` → **일반 사용자에게 미노출**
- Zone 2 전체 11곳: `status: 'PROVISIONAL'` → **일반 사용자에게 미노출**
- **결론**: Zone 1 VISUAL_ACCEPTED 미완료여도 PR #134 merge 후 마커 오노출 위험 없음

---

## §3 실제 출시 차단 조건 (A)

| 항목 | 상태 |
|------|------|
| PR #134 Founder merge 승인 | ⏳ **남은 유일한 차단 조건** |

---

## §4 오픈 후 보완 조건 (B — merge 차단 아님)

| 항목 | 상태 | 비고 |
|------|------|------|
| Zone 1 FOUNDER_VISUAL_ACCEPTED | AMBIGUOUS_PENDING | 마커 VERIFIED 승격 전제조건. PROVISIONAL이므로 사용자 미노출 |
| Zone 5 FOUNDER_VISUAL_ACCEPTED | FOUNDER_VISUAL_QA_PENDING | 동일 |
| Zone 7 FOUNDER_VISUAL_ACCEPTED | FOUNDER_VISUAL_QA_PENDING | 동일 |
| Zone 3·4 FOUNDER_VISUAL_ACCEPTED | Founder 좌표 직접 전달 = 암묵적 수용 | 명시적 per-marker 화면 수용 미기록 |
| CAR GOVERNANCE_HOLD | 유지 | 이동시간 추정 미구현 — 기능 제한 안내로 대체 |
| 음식/카페 큐레이션 | 파이프라인 존재, 데이터 부족 | 오픈 후 데이터 추가 |

---

## §5 PR #134 병합 준비 여부 (C)

| 항목 | 상태 |
|------|------|
| 브랜치 | `docs/pr133-state-sync` |
| 코드 빌드 | ✅ 698 modules |
| Jest | ✅ 639/640 (R20 PRE-EXISTING) |
| Production SHA | `425a643` (맞춤 항로 V0.1) |
| PROVISIONAL 마커 안전 | ✅ 일반 사용자 미노출 확인 |
| **기술적 merge 준비** | **✅ READY** |
| **Founder merge 승인** | **⏳ 필요** |

---

## §6 Founder에게 필요한 승인 사항 (D)

1. **PR #134 merge 승인** (필수 — Production 배포)
2. Zone 1 화면 확인 → VISUAL_ACCEPTED (마커 VERIFIED 승격 전제조건 — merge 차단 아님)

---

## §7 Current Next Action (E)

**PR #134 Founder merge 승인 → Production 배포**

Founder가 PR #134를 merge하면:
- `/muyojeong` 서비스 Production 반영
- SOUL 4버튼 + 맞춤 항로 + Living Detail + 지도 UI 모두 Production
- 지도 마커: PROVISIONAL → 사용자 미노출 (VERIFIED 승격 후 순차 노출)
- CAR GOVERNANCE_HOLD: 유지

merge 후 개선 가능: Zone 1·5·7 VISUAL_ACCEPTED → VERIFIED 승격 → 마커 순차 노출

---

## §8 Zone별 최종 상태 요약

| Zone | NAME | SOURCE_SAVED | FOUNDER_VISUAL_ACCEPTED |
|------|------|-------------|------------------------|
| 1 | 원도심 해안권 | ✅ 7곳 | AMBIGUOUS_PENDING |
| 2 | 오동도·엑스포권 | ✅ 11곳 | ✅ "오케이 정상이야" (SHA 81b4cd0) |
| 3 | 돌산권 | ✅ 5곳 | 좌표 직접 전달 (암묵적) |
| 4 | 향일암권 | ✅ 4곳 | 좌표 직접 전달 (암묵적) |
| 5 | 소호·장도권 | ✅ 5곳 | FOUNDER_VISUAL_QA_PENDING |
| 6 | 화양·여자만권 | ✅ 4곳 | ✅ "완벽해" |
| 7 | 섬섬길 | ✅ 4곳 (+offMap 2) | FOUNDER_VISUAL_QA_PENDING |
