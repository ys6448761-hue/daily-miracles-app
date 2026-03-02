# DEPLOY PACKET — plaza.dailymiracles.kr (소원꿈터 광장) 배포
작성일: 2026-03-02  
작성자: Antigravity (Release Packet Manager)  
우선순위: P0  
관련 DEC: docs/decision/DEC-2026-0301-PLAZA-LAUNCH.md  
모드: Launch

---

## 1. 목표
- 소원꿈터 광장(Next.js)을 Render에 배포하고, `plaza.dailymiracles.kr` 서브도메인으로 공개 접근 가능하게 만든다.
- 상단 공통 네비(Home/Plaza/Apply)로 3도메인 이동 혼란을 최소화한다.

---

## 2. URL / DNS 정보
- 프로덕션 URL(목표): https://plaza.dailymiracles.kr
- DNS 관리처: **Gabia** ✅ 확정
- 레코드 타입: **[확인 필요]** (A / CNAME)
- 반영 예상 시간: **[확인 필요]**

✅ 확인 필요(체크박스):
- [x] DNS 관리처 확정 → **Gabia**
- [ ] 레코드 타입 확정(A/CNAME)
- [ ] SSL(HTTPS) 자동 발급 확인

---

## 3. Render 계정/서비스 정보
- Render 계정 접근 가능 여부: **OK** ✅ 확정
- 신규 서비스 생성 권한: **OK** ✅ 확정
- 서비스명(권장): `sowon-dream-plaza` 또는 `plaza-web`
- 배포 브랜치: `main`
- 리포지토리: **[GitHub repo URL/이름 기입]**

✅ 확인 필요:
- [x] Render 계정 접근 가능(초대 완료) → **OK**
- [x] 서비스 생성/배포 권한 확인 → **OK**

---

## 4. 환경 변수 목록 (값은 절대 적지 말 것)
> 값 전달 방식: Render Environment Variables에 직접 입력  
> (또는 별도 Secret Manager/Drive 보관 후 "전달 방법"만 명시)

> ⚠️ **검증 결과(2026-03-02)**: 이 프로젝트는 **NextAuth를 사용하지 않음**
> (package.json에 next-auth 없음, 코드 참조 없음 — `.env.example` 기준 확인)

### ~~NextAuth/웹~~ ← 해당 없음 (삭제)
- ~~NEXTAUTH_URL~~
- ~~NEXTAUTH_SECRET~~
- NEXT_PUBLIC_ADMIN_ALLOWLIST: (운영 관리자 닉네임 allowlist) ← **푸르미르 포함** (Plaza 자체 인증)

### 실제 필요 시크릿 키 (`.env.example` 기준)
- `ADMIN_TOKEN`: 32자 이상 랜덤 시크릿 ← **Code 생성 필요** (운영 API 보호용)
- `DATABASE_URL`: PostgreSQL 연결 문자열 ← **Render PostgreSQL 생성 필요**
- `OPENAI_API_KEY`: OpenAI 키 (기존 app에서 복사 가능)
- `SENS_SECRET_KEY` + `SENS_ACCESS_KEY` + `SENS_SERVICE_ID`: NCP SENS 키 (기존 app에서 복사 가능)
- `OPS_SLACK_WEBHOOK`: Slack 운영 알림 Webhook (미설정 시 배포 차단)

✅ 확인 필요:
- [ ] ADMIN_TOKEN 생성(32자 이상) ← Code 실행 필요
- [ ] NEXT_PUBLIC_ADMIN_ALLOWLIST 값 확정 (푸르미르 포함)
- [ ] 운영 DB(PostgreSQL) 전환 여부 확정 ← Code 실행 필요
- [ ] OPS_SLACK_WEBHOOK URL 확보

---

## 5. 관리자 계정(운영)
- 운영 관리자 닉네임: **푸르미르** ✅ 확정
- allowlist 포함 여부: **포함 (NEXT_PUBLIC_ADMIN_ALLOWLIST에 반영)**

✅ 확인 필요:
- [x] 관리자 닉네임 확정 → **푸르미르**
- [ ] allowlist 반영 확인 (Code 실행 필요)

---

## 6. 오픈 전 운영 준비(중요)
> plaza 오픈 당일부터 PENDING 글이 쌓이므로, 승인 플로우 준비가 되어 있어야 공개 피드가 비지 않는다.

- 글 심사(어드민) 준비 체크:
  - [ ] PENDING → APPROVED 승인 테스트 완료
  - [ ] REDIRECT(수정 요청) 템플릿 동작 확인(있다면)
  - [ ] 거절(REJECTED) 처리 확인(있다면)

- Slack 알림(있다면):
  - [ ] 알림 채널 연결 확인
  - [ ] 이상징후 알림 테스트

---

## 7. 검증 시나리오 (배포 후 필수)
1) https://plaza.dailymiracles.kr 접속 → 페이지 정상 로딩  
2) 공개 피드 로딩 확인(비로그인)  
3) 로그인 성공  
4) 글 작성 성공(로그인 후)  
5) 관리자 승인(PENDING→APPROVED) 후 피드 반영 확인  
6) 상단 네비 링크 정상:
   - Home → https://dailymiracles.kr
   - Plaza → https://plaza.dailymiracles.kr
   - Apply → https://app.dailymiracles.kr

---

## 8. Done 조건(완료 기준)
- [ ] plaza.dailymiracles.kr HTTPS 정상 접근 ← **Done 기준**
- [ ] 공개 피드가 비지 않음(시드/승인 흐름 준비)
- [ ] 로그인/글작성/승인 플로우 정상
- [ ] 상단 네비 통일 완료
- [ ] 배포 완료 후 상태판(AURORA_STATUS.md) 업데이트

---

## 9. 롤백/중단 기준
- 배포 후 5xx 오류 지속 또는 로그인 불가
- DB 연결 실패로 서비스 핵심 기능 불가
- 관리자 승인 불가로 피드가 비는 상태가 발생

→ 위 발생 시 즉시 P0 중단, 원인 분석 후 재배포

---

## 10. 필요한 정보 요청 (Code가 착수 전 확인해야 할 것)
- [x] Render 계정 접근/권한 → **OK**
- [x] DNS 관리처 → **Gabia**
- [x] ~~NEXTAUTH_SECRET~~ → **미사용 확인(NextAuth 없음)** ✅
- [ ] ADMIN_TOKEN 생성(32자 이상) ← Code 실행 필요
- [ ] Render PostgreSQL 생성 ← Code 실행 필요
- [ ] render.yaml 구성 ← Code 실행 필요
- [x] 운영 관리자 닉네임 → **푸르미르**
