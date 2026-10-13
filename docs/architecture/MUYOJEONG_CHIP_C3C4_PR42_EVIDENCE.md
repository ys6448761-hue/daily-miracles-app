# 무여정 메인 4개 카테고리 칩 (C-3/C-4) — PR #42 Evidence

**Created:** 2026-10-13  
**Status:** MERGED to main — Render Production 미배포 (미승인)

---

## Merge 사실

| 항목 | 값 |
|------|-----|
| PR | #42 |
| Branch | `feat/muyojeong-chip-c3c4` → `main` |
| Merge SHA | `eadcbde9a8bcdb6c67ebe43fc1afc53eca0266ec` |
| Feature Commit | `788962ba1721603a8c755e5e8a23846c535b24bc` |
| Merged At | 2026-10-13T03:51:14Z |
| Merged By | Founder (GitHub UI) |

## 변경 파일 (2개)

| 파일 | 추가 | 삭제 |
|------|------|------|
| `dreamtown-frontend/src/pages/MuyojeongHomePage.jsx` | +12 | -10 |
| `services/soyeowoolService.js` | +34 | -1 |

## 구현 내용

### C-1 [부모님과 함께]
- 칩 query: `'부모님과 여수에서 어디 가면 좋을까?'`
- 기존 companion 응답 경로 그대로 사용

### C-2 [아이와 함께]
- 칩 query: `'아이와 여수에서 어디 가면 좋을까?'`
- 기존 companion 응답 경로 그대로 사용

### C-3 [차량으로]
- 칩 query: `'여수에서 주차할 곳과 차로 이동하기 좋은 장소, 동선을 알려줘.'`
- `explicit_context: { has_car: true }` 전달
- `_PLACE_KNOWLEDGE` 검증 데이터 기반 `parking_ko` 보충
- 핵심 수정: `p.code` → `p.place_code` (travelGuideService 필드명 일치)

### C-4 [여행코스]
- 칩 query: `'여수 여행코스를 짜줘.'`
- 예약 맥락 없는 첫 턴: R032 낭만버스 2층버스 주간 코스 응답
- `_noBookingCtx = !quoteCtx?.hotel_code && !quoteCtx?.leisure` (extractQuoteContext 항상 객체 반환 대응)
- 6개 장소: 아쿠아플라넷 여수 → 오동도 → 하멜전시관 → 이순신광장 → 수산물특화시장 → 돌산공원 입구
- 출처: yeosu.go.kr 공식 (`YEOSU_ROUTE_CORPUS_V0_1.json` R032)

## 주요 버그 수정 (PR 포함)

| 버그 | 원인 | 수정 |
|------|------|------|
| BUG-1: C-4 분기 진입 불가 | `extractQuoteContext()`가 항상 객체 반환 → `!quoteCtx` 항상 false | `_noBookingCtx = !quoteCtx?.hotel_code && !quoteCtx?.leisure` |
| BUG-2: C-3 주차 보충 0건 | `tgResult.places[].code` 미존재 — 실제 필드명은 `place_code` | `p.code` → `p.place_code` (2곳) |
| ISSUE-3: R032 교통수단 불명확 | 응답에 "여수 반나절 코스" — 자가 이동 오인 가능 | "여수 낭만버스 2층버스 주간 코스를 소개해드릴게요." |

## CI / 검증 결과

| 체크 | 결과 | 비고 |
|------|------|------|
| AIL Gate | PASS ✓ | Required check |
| docker-smoke | PASS ✓ | |
| Vercel Preview | FAIL | 비필수 체크 — Merge 비차단 |
| 로컬 API C-1~C-4 | PASS (port 5003) | |
| PSQ 회귀 18/18 | PASS | |
| 프론트엔드 빌드 | PASS (691 modules) | |

## Architecture Guard Runtime 확인 결과

| 항목 | 상태 |
|------|------|
| `enforce_admins=true` 작동 | **CONFIRMED** — Founder가 PR UI 통해 Merge (직접 Push 아님) |
| AIL Gate 미통과 → Merge 차단 | **UNVERIFIED** — PR #42는 AIL Gate PASS. 다음 PR로 이월 |
| Founder self-merge 동작 | **UNVERIFIED** — `required_approving_review_count=0` 이므로 별도 실험 필요 |

## 열린 항목

- Render Production 미배포: 배포 전 Founder 별도 승인 필요
- 실제 운영 환경에서 C-1~C-4 검증 미완료
- Architecture Guard Runtime 부분 미확인 (위 표 참조)
