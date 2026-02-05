# 📋 Community Skills Registry

> **버전:** 1.0.0
> **생성일:** 2026-02-06
> **관리자:** 코미 (Chief Operating AI Manager)

---

## 🔐 설치 규칙

1. **최소 Star 2개 이상** 스킬만 설치
2. **코드 리뷰 필수** - 악성 스킬 유입 차단
3. **테스트 환경 우선** - 프로덕션 직접 설치 금지
4. **레지스트리 기록 필수** - 기록 없이 설치 금지

---

## 📦 설치된 스킬 목록

| 스킬명 | 출처 | 설치일 | 카테고리 | Star | 상태 | 설치자 |
|--------|------|--------|----------|------|------|--------|
| frontend-design | anthropics/skills | 2026-02-06 | 디자인/UI | 공식 | ✅ 활성 | Claude Code |

---

## 🔍 설치 명령어 참고

```bash
# 스킬 검색
npx skills search "키워드"

# 스킬 설치 (community 폴더로)
npx skills add owner/repo@skill-name --path .claude/skills/community

# 또는 수동 설치
# 1. 스킬 URL 확인: https://skills.sh/owner/repo/skill-name
# 2. SKILL.md 다운로드
# 3. community/ 폴더에 저장
# 4. 이 레지스트리 업데이트
```

---

## 📝 설치 로그

### 2026-02-06

- 레지스트리 생성
- `npx skills` CLI 동작 확인 완료
- SkillsMP API 연동 완료 (키워드 + AI 시맨틱 검색)
- Anthropic 공식 레포 클론 완료 (~/.claude/community-skills)
- **frontend-design** 스킬 설치 (Anthropic 공식, 프로덕션급 UI 디자인)

---

## ⚠️ 제거된 스킬

| 스킬명 | 제거일 | 사유 |
|--------|--------|------|
| *(없음)* | - | - |

---

**🤖 14만 5천+ 스킬 생태계에서 최적의 도구를 선별하여 설치합니다.**
