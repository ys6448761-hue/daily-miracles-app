# DreamTown Sub-Agents

Aurora5 운영 체계의 일부로, Claude Code Master가 자동 위임하는 4대 전문 에이전트.

## 🏗️ 운영 구조

```
푸르미르님 (CEO)
    ↓
코미 (COO, 오케스트레이션)
    ↓ 지시서
Claude Code Master
    ↓ 자동 위임 / 명시 호출
┌─────────────┬──────────────┬──────────────┬─────────────┐
SSOT          Deployment     Canon          KPI
Guardian      Verifier       Checker        Reporter
└─────────────┴──────────────┴──────────────┴─────────────┘
            ↓
        코미에게 표준 보고서 제출
```

## 🎯 4대 에이전트 역할

| 에이전트 | 역할 | 호출 시점 |
|---------|------|----------|
| **ssot-guardian** | Canon SSOT 위반/금지 키워드/4단계 구조/미라클 인덱스 검수 | UI 텍스트 변경, 메시지 작업 시 |
| **deployment-verifier** | git push → Render 빌드 → 라이브 URL → 모바일 안내 5단계 검증 | "완료 마킹" 직전 (강제) |
| **canon-checker** | 소원이/아우룸/소원꿈터 용어 정확도, 일반 SNS 용어(Plaza/Like/Comment) 차단 | UI 카피, 메시지 템플릿 작업 시 |
| **kpi-reporter** | dt_kpi_events 일일 스냅샷, 파트너별 별 추이, 이상 징후 탐지 | 매일 09:00 + 명시 요청 시 |

## 🚨 절대 원칙

1. **Sub-Agent는 코드 수정 권한 없음** (Read/Bash/WebFetch만)
2. **모든 수정은 Code Master만 수행**
3. **Sub-Agent의 보고는 항상 코미를 경유** (푸르미르님과 직접 통신 금지)
4. **Sub-Agent 간 직접 통신 금지** (Code Master 경유)

## 📞 호출 방법

### 자동 위임 (권장)
Code Master가 작업 성격 보고 알아서 호출.
description 필드에 명시된 트리거 조건에 매칭되면 자동 실행.

### 명시 호출
```
Use deployment-verifier to verify the latest push
Use ssot-guardian to check this UI copy
```

### 체인 호출 예시
```
1. Code Master: SQL 수정
2. → ssot-guardian: 변경 검수
3. → deployment-verifier: 5단계 배포 검증
4. → kpi-reporter: 결과 KPI 즉시 조회
5. 종합 결과 → 코미에게 보고
```

## 📤 표준 보고 형식 (모든 에이전트 공통)

```
✅ [에이전트명] 검수 통과
━━━━━━━━━━━━━━━
- 항목: [구체적]
- 결과: [구체적]
━━━━━━━━━━━━━━━

또는

❌ [에이전트명] 검수 실패
━━━━━━━━━━━━━━━
- 위반 항목: [구체적]
- 위치: [파일:라인]
- 권장 조치: [구체적]
━━━━━━━━━━━━━━━
```

## 📚 관련 문서

- `docs/decisions/DEC-2026-0426-001-subagents.md` (도입 결정문)
- `__코미_운영_지침_v2.1` (Aurora5 COO 매뉴얼)
- `aurora5-master-knowledge.md` (Aurora5 통합 지식)

---

**Version:** 1.0.0
**Created:** 2026-04-26
**Owner:** 코미 (Chief Operating AI Manager)
**Approved by:** 푸르미르님
