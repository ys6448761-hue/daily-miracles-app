# Architecture Guard Option A+B Enforcement — Evidence V0.1

**Document ID:** ARCH-GUARD-AB-EVIDENCE-V0.1  
**Status:** CONFIGURATION_VERIFIED — RUNTIME UNVERIFIED  
**Date:** 2026-10-10  
**Session:** MEET-20261010-004 연계 (Architecture Guard Enforcement 실행)  
**Authority:** Founder 실행 승인 (2026-10-10)

---

## 1. 변경 분류

**EXTEND** — 기존 Branch Protection(AIL Gate)을 보존하면서 관리자 강제 + PR 필수 정책 추가

---

## 2. 적용된 변경 (2개)

### Option B — PR 필수 정책 활성화

```
PATCH /repos/ys6448761-hue/daily-miracles-app/branches/main/protection/required_pull_request_reviews

Payload:
{
  "required_approving_review_count": 0,
  "dismiss_stale_reviews": false,
  "require_code_owner_reviews": false,
  "require_last_push_approval": false
}
```

### Option A — 관리자 강제 적용

```
POST /repos/ys6448761-hue/daily-miracles-app/branches/main/protection/enforce_admins
(No body required)
```

> **API 정정:** 사전 감사 보고서에서 enforce_admins 변경에 PATCH를 사용한다고 기술했으나, 실제 GitHub API는 POST(활성화) / DELETE(비활성화) 메서드를 사용합니다. PATCH는 404를 반환합니다.

---

## 3. 적용 순서 및 단계별 결과

### Step 1 — 변경 전 Baseline 확인

```json
{
  "required_status_checks": { "strict": true, "contexts": ["AIL Gate"] },
  "enforce_admins": { "enabled": false },
  "required_pull_request_reviews": null,
  "allow_force_pushes": { "enabled": false },
  "allow_deletions": { "enabled": false }
}
```

Baseline 검증: **전체 PASS** (7/7 항목 기대값 일치)

### Step 2 — Option B 적용

```
API:    PATCH /protection/required_pull_request_reviews
Status: HTTP 200
Response: { "required_approving_review_count": 0, "dismiss_stale_reviews": false,
            "require_code_owner_reviews": false, "require_last_push_approval": false }
```

### Step 3 — Option B 즉시 검증

| 항목 | 기대값 | 실제값 | 판정 |
|------|--------|--------|------|
| PR 필수 활성화 | ON | 응답 포함 | ✅ PASS |
| `required_approving_review_count` | 0 | 0 | ✅ PASS |
| `required_status_checks.contexts` | `["AIL Gate"]` | `["AIL Gate"]` | ✅ PASS — AIL Gate 보존 |
| `required_status_checks.strict` | true | true | ✅ PASS |
| `enforce_admins.enabled` | false (A 미적용) | false | ✅ PASS |
| `allow_force_pushes.enabled` | false | false | ✅ PASS |
| `allow_deletions.enabled` | false | false | ✅ PASS |

**Option B 검증: 7/7 PASS → Option A 적용 진행**

### Step 4 — Option A 적용

```
API (1차 시도): PATCH /protection/enforce_admins → HTTP 404 (PATCH 미지원 확인)
API (2차):      GET  /protection/enforce_admins  → { "enabled": false } (상태 보존 확인)
API (3차):      POST /protection/enforce_admins  → HTTP 200 { "enabled": true }
```

### Step 5 — 최종 검증

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["AIL Gate"],
    "checks": [{ "context": "AIL Gate", "app_id": null }]
  },
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "require_last_push_approval": false
  },
  "enforce_admins": { "enabled": true },
  "allow_force_pushes": { "enabled": false },
  "allow_deletions": { "enabled": false }
}
```

| 필수 조건 | 기대값 | 실제값 | 판정 |
|---------|--------|--------|------|
| `required_pull_request_reviews` 활성 | ON | 응답 포함 | ✅ PASS |
| `required_approving_review_count` | 0 | 0 | ✅ PASS |
| `enforce_admins.enabled` | true | true | ✅ PASS |
| `required_status_checks.contexts` | `["AIL Gate"]` | `["AIL Gate"]` | ✅ PASS |
| `required_status_checks.strict` | true | true | ✅ PASS |
| `allow_force_pushes.enabled` | false | false | ✅ PASS |
| `allow_deletions.enabled` | false | false | ✅ PASS |

**최종 검증: 7/7 PASS**

---

## 4. 기존 위험 해소

| 위험 | 이전 상태 | 현재 상태 |
|------|---------|---------|
| `enforce_admins=false` — 관리자 AIL Gate 우회 | UNRESOLVED | **RESOLVED** |
| 관리자 직접 Push to main | 차단 없음 | **차단** (required_pull_request_reviews + enforce_admins=true) |
| 관리자 AIL Gate 실패 시 강제 Merge | 가능 | **불가** |

---

## 5. CONFIGURATION VERIFIED / RUNTIME UNVERIFIED 구분

### CONFIGURATION VERIFIED

- Option B (PR 필수, count=0): GitHub API 응답으로 설정 확인 ✓
- Option A (enforce_admins=true): GitHub API 응답으로 설정 확인 ✓
- AIL Gate 보존: `required_status_checks.contexts: ["AIL Gate"]` 변경 없음 ✓
- 기존 보호 규칙 보존: force push / branch deletion 차단 유지 ✓

### RUNTIME UNVERIFIED (OPEN)

| 항목 | 상태 |
|------|------|
| 관리자 직접 Push → 실제 차단 확인 | OPEN |
| AIL Gate FAIL 상태에서 Founder Merge 버튼 비활성 확인 | OPEN |
| Founder self-merge (count=0, AIL Gate PASS) 실제 동작 | OPEN |

Runtime 검증은 다음 실제 기능 PR에서 자연 확인됩니다.

---

## 6. API 메서드 정정 기록

| 엔드포인트 | 감사 보고서 기술 | 실제 메서드 |
|----------|------------|----------|
| `enforce_admins` 활성화 | PATCH | **POST** |
| `enforce_admins` 비활성화 | PATCH `{enabled:false}` | **DELETE** |
| `required_pull_request_reviews` 설정 | PATCH | PATCH ✓ (정확) |
| `required_pull_request_reviews` 제거 | DELETE | DELETE ✓ (정확) |

---

## 7. 롤백 절차 (필요 시)

```bash
# Option A 롤백 (enforce_admins=false 복원)
DELETE /repos/ys6448761-hue/daily-miracles-app/branches/main/protection/enforce_admins

# Option B 롤백 (PR 필수 비활성화)
DELETE /repos/ys6448761-hue/daily-miracles-app/branches/main/protection/required_pull_request_reviews

# 순서: A 롤백 → 검증 → B 롤백 → 검증
# 긴급: Founder → GitHub Settings → Branches → main 편집 (UI 직접 조작)
```

---

## 8. Architecture Guard 판정

```
ARCHITECTURE GUARD: CONFIGURATION_VERIFIED

변경 범위: GitHub Branch Protection 설정 2개 (코드·DB·서비스 변경 없음)
AIL Gate 보존: ✓
기존 보호 규칙 보존: ✓
enforce_admins UNRESOLVED 위험: RESOLVED ✓
롤백 발생: 없음

RUNTIME ENFORCEMENT: UNVERIFIED (다음 실제 PR에서 자연 확인)
```

---

*작성: 2026-10-10 / Code (Claude Code)*
