# DEC-2026-0426-001: DreamTown 4대 Sub-Agent 시스템 도입

**결정일:** 2026-04-26
**결정자:** 푸르미르님 (CEO) + 코미 (COO)
**상태:** ✅ 파동 함수 붕괴 완료 (Locked)

---

## 결정 (Decision)

DreamTown 프로젝트에 Claude Code 네이티브 Sub-Agent 시스템을 도입한다.
4개 전문 에이전트를 운영하여 Code Master의 작업 흐름을 분산하고 검수 게이트를 강화한다.

### 도입 에이전트
1. **ssot-guardian** — Canon SSOT 위반 탐지
2. **deployment-verifier** — 배포 5단계 검증
3. **canon-checker** — 브랜드 카피 검수
4. **kpi-reporter** — KPI 모니터링

---

## 이유 (Rationale)

### 1) 엔진 규모 확대로 인한 한계 도달
- 33개 파트너 운영 중
- 라또아, 바다마루, 섬박람회 등 다중 도메인
- Code Master 1명 + 코미 1명 구조로는 검수 누락 발생

### 2) 알려진 실패 모드 차단
- "Code가 작업 완료 마킹했지만 실제 배포 안 된 상태" 사고 반복
- → deployment-verifier로 강제 게이트

### 3) Canon 일관성 위협
- 신규 파트너/기능 추가 시 일반 SNS 용어 혼입 위험
- → canon-checker + ssot-guardian 이중 방어

### 4) KPI 가시성 부족
- 라또아 대시보드 0 표시 사고 사례
- → kpi-reporter로 매일 자동 모니터링

---

## 영향 (Impact)

### 긍정 영향
- 검수 누락 차단 (예상 -80%)
- 배포 사고 차단 (예상 -90%)
- 푸르미르님 의사결정 부하 절감
- Code Master 컨텍스트 폭발 방지

### 위험 / 트레이드오프
- 4개 에이전트 동시 운영 시 토큰 비용 증가
- 자동 위임 트리거 정확도 운영 2주 후 평가 필요
- description 필드 정확도가 자동 위임 품질 좌우

### 회피책
- 토큰 효율 4대 규칙 그대로 적용
- 각 에이전트 system prompt 300줄 이내 유지
- 사용 가능 도구 최소화 (Read/Bash/WebFetch만)
- 2주 후 효율 측정, 30% 미만 개선 시 재검토

---

## 다음 액션 (Next Actions)

| 액션 | 담당 | 기한 |
|------|------|------|
| 4대 에이전트 파일 생성 (.md × 6) | Code Master | 2026-04-26 |
| 첫 자동 위임 테스트 (deployment-verifier) | Code Master | 2026-04-26 |
| 자동 위임 정확도 측정 시작 | 코미 | 2026-04-27부터 |
| 운영 2주 후 효율 평가 | 코미 → 푸르미르님 | 2026-05-10 |
| 5번째 에이전트 필요성 검토 | 코미 | 2026-05-26 |

---

## 운영 원칙 (Locked)

1. Sub-Agent는 Read/Bash/WebFetch만 사용 (수정 불가)
2. 모든 보고는 코미 경유 (푸르미르님과 직접 통신 금지)
3. Sub-Agent 간 직접 통신 금지 (Code Master 경유)
4. 자동 위임 + 명시 호출 모두 지원
5. 일일 리포트 + 이상 징후 즉시 ALERT

---

## 관련 문서

- `.claude/agents/README.md`
- `__코미_운영_지침_v2.1`
- `aurora5-master-knowledge.md`
- `Canon SSOT v2.0`
- `Universe Bible v4.0`

---

✅ 파동 함수 붕괴 완료
번복 조건: 운영 2주 후 효율 개선 30% 미만 시에만 재검토
