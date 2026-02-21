# ⚠️ CRITICAL: 작업 시작 전 필독

**🚨 Claude Code로 작업하기 전에 반드시 [CRITICAL_START_HERE.md](./CRITICAL_START_HERE.md) 파일을 읽으세요!**

잘못된 작업 방식으로 인한 시간 낭비를 방지합니다.

---

## 🌟 Aurora 5 현황판

### 빠른 시작

새 작업 세션 시작 시:
```bash
# 현황 확인
cat AURORA_STATUS.md

# 또는 Claude에게
"AURORA_STATUS.md 읽어봐"
```

### 작업 종료 시
```bash
"오늘 작업 반영해서 AURORA_STATUS.md 업데이트해"
```

### 효과
- ✅ 3초 만에 프로젝트 상황 파악
- ✅ 작업 연속성 100% 유지
- ✅ 팀원 교체 시에도 완벽 인수인계

---

# Daily Miracles MVP

하루하루의 기적을 기록하고 분석하는 서비스

## 🚀 빠른 시작

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# 서버 실행
npm start
```

## 📁 프로젝트 구조

```
daily-miracles-mvp/
├── CRITICAL_START_HERE.md  # ⚠️ 필독!
├── server.js               # 메인 서버
├── routes/                 # API 라우트
├── services/              # 비즈니스 로직
├── middleware/            # 미들웨어
├── config/                # 설정
├── public/                # 정적 파일
└── logs/                  # 로그 파일
```

## 🔧 주요 기능

- 소원 등록 및 관리
- 문제 해결 지원
- 기적 분석 및 예측
- 대화형 인터페이스

## 📝 개발 가이드

### Claude Code 작업자용
👉 **[CRITICAL_START_HERE.md](./CRITICAL_START_HERE.md) 먼저 읽기!**

### API 문서
- 작성 예정

### 배포
- 작성 예정

## 🛠 기술 스택

- Node.js
- Express
- (추가 기술 스택)

## 📄 라이선스

MIT

좋아요 👍
그럼 **기존 README 내용은 건드리지 않고**,
중복 없이 **아래에 “추가로 붙이면 되는 정리본”만** 깔끔하게 다시 만들어 드릴게요.

👉 아래 블록만 그대로 README 맨 아래에 복붙하세요.

---

````md
---

# 🔧 CI / AIL Gate / Ops Hardening 빠른 해결 가이드

PR이 머지되지 않거나 GitHub Actions가 실패하면 아래 순서대로 점검하세요.

---

## 1️⃣ AIL Gate 실패 시

### 증상
- `AIL 섹션 존재: ❌`
- `Source ID 존재: ❌`

### 해결
PR **본문(Description)** 맨 위에 아래를 평문으로 추가하세요:

```text
[AIL]
source_id: ISSUE-<번호>
owner: <담당자>
intent: <의도>
changes:
  - <변경 내용>
acceptance_criteria:
  - AIL 섹션 존재: ✅
  - Source ID 존재: ✅
````

⚠️ 주의:

* 코드펜스(````ail`)로 감싸지 마세요
* `Issue #: #13` 같은 표기만으로는 통과하지 않습니다
* 반드시 `source_id:` 키를 사용하세요

---

## 2️⃣ approve-dec.yml 오류 시

### 증상

* `Invalid workflow file ... line 1`
* github-script 단계에서 문자열/템플릿 에러

### 해결 1: UTF-8 No BOM으로 저장

PowerShell:

```powershell
$path = ".github\workflows\approve-dec.yml"
$yml = Get-Content $path -Raw
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($path, $yml, $utf8NoBom)
```

---

### 해결 2: github-script에서 `${{ }}` 직접 사용 금지

❌ 금지

```yaml
script: |
  const query = '${{ inputs.query }}';
```

✅ 권장

```yaml
- uses: actions/github-script@v7
  env:
    INPUT_QUERY: ${{ inputs.query }}
  with:
    script: |
      const query = process.env.INPUT_QUERY;
```

원칙:

* `${{ }}` → 반드시 `env:`로 전달
* `script:` 내부 → `process.env`만 사용

---

## 3️⃣ Ops Hardening(P2.3) 테스트 실패 시

### 흔한 원인 1: reset() 함수 가정

❌ 위험 코드

```js
require('../../middleware/alertCooldown').reset();
```

✅ 안전 코드

```js
const ac = require('../../middleware/alertCooldown');
if (typeof ac.reset === 'function') ac.reset();
```

---

### 흔한 원인 2: 상태값 혼용

`healthy` / `stable`을 섞어 쓰면 CI가 깨질 수 있습니다.

프로젝트 전반에 **하나로 통일**하세요:

* healthy/degraded/critical
  또는
* stable/degraded/critical

---

### 흔한 원인 3: 점수 비교 strictEqual

반올림 차이로 실패할 수 있습니다.

```js
assert.ok(Math.abs(actual - expected) < 0.2);
```

---

## ✅ 머지 전 빠른 체크리스트

* [ ] PR 본문에 `[AIL]` 있음
* [ ] `source_id:` 존재
* [ ] AIL 코드펜스 사용 안 함
* [ ] approve-dec.yml UTF-8 No BOM
* [ ] github-script에서 `${{ }}` 직접 사용 안 함
* [ ] Ops 테스트 통과

---

문제가 반복되면:

1. 실패 로그 마지막 10줄 확인
2. `docs/where-and-how-to-fix.md` 참고
3. 그래도 안 되면 로그 기준으로 원인 분리

---

```

---

✅ 이 버전은:

- 기존 README 내용과 중복 없음
- CRITICAL / Aurora 5 섹션 침범 안 함
- Daily Miracles 설명 유지
- 순수 “CI 트러블슈팅 추가 블록”만 포함

```

