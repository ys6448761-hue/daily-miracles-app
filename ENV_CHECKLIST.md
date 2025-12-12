# 환경 변수 체크리스트 - Render 배포용

> Render 배포 시 설정해야 할 환경 변수 완전 가이드

---

## ✅ 필수 환경 변수 (3개)

### 1. OPENAI_API_KEY

- **설명**: GPT-4 API 키 (문제 해결 분석에 필수)
- **발급**: https://platform.openai.com/api-keys
- **형식**: `sk-proj-...` (문자열)
- **예시**: `sk-proj-abc123xyz456...`
- **주의**:
  - 절대 GitHub에 커밋하지 말 것
  - 크레딧 잔액 확인: https://platform.openai.com/account/billing

```
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE
```

---

### 2. NODE_ENV

- **설명**: 실행 환경
- **값**: `production` (프로덕션 배포 시 반드시)
- **효과**:
  - 프로덕션 최적화 활성화
  - 상세 에러 메시지 숨김
  - 로깅 레벨 조정

```
NODE_ENV=production
```

---

### 3. ALLOWED_ORIGINS

- **설명**: CORS 허용 도메인 (Wix 도메인)
- **형식**: 쉼표로 구분된 URL 리스트
- **예시**:
  - Wix 기본 도메인: `https://yourusername.wixsite.com/daily-miracles`
  - 커스텀 도메인: `https://www.your-domain.com`
- **주의**:
  - 반드시 `https://` 포함
  - 끝에 `/` 없음
  - 실제 Wix 사이트 URL 확인 필수

```
ALLOWED_ORIGINS=https://yourusername.wixsite.com/daily-miracles,https://www.your-domain.com
```

**Wix 도메인 확인 방법:**
1. Wix 에디터 → **Settings** → **Domain**
2. "Site Address" 복사
3. 예: `https://username.wixsite.com/sitename`

---

## 🔧 선택 환경 변수 (권장)

### 4. REQUEST_LOG

- **설명**: API 요청 로깅 활성화 여부
- **값**: `0` (비활성화, 프로덕션 권장) 또는 `1` (활성화, 디버깅용)
- **효과**:
  - `0`: 최소 로깅, 성능 향상
  - `1`: 모든 요청/응답 로깅

```
REQUEST_LOG=0
```

---

## 📋 Render 환경 변수 설정 방법

### 단계별 가이드

1. Render 대시보드 → 배포한 서비스 선택
2. 왼쪽 메뉴 → **Environment** 클릭
3. **Add Environment Variable** 버튼 클릭
4. 변수 입력:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `sk-proj-...`
5. **Save Changes** 클릭
6. 자동 재배포 대기 (1-2분)

### 복사해서 사용할 템플릿

```bash
# 필수
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
NODE_ENV=production
ALLOWED_ORIGINS=https://yourusername.wixsite.com/sitename

# 선택
REQUEST_LOG=0
```

---

## ⚠️ 주의사항

### 1. OpenAI API 키 보안

- ❌ **절대 하지 말 것**:
  - GitHub에 커밋
  - 코드에 하드코딩
  - 클라이언트 사이드 노출

- ✅ **해야 할 것**:
  - Render 환경 변수로만 설정
  - 정기적으로 키 로테이션
  - 사용량 모니터링

### 2. CORS 도메인 확인

- ❌ **틀린 예시**:
  ```
  ALLOWED_ORIGINS=http://wixsite.com          # http (X)
  ALLOWED_ORIGINS=https://wixsite.com/        # 끝에 / (X)
  ALLOWED_ORIGINS=wixsite.com                 # https:// 누락 (X)
  ```

- ✅ **올바른 예시**:
  ```
  ALLOWED_ORIGINS=https://username.wixsite.com/sitename
  ```

### 3. 환경 변수 변경 후

- 저장하면 **자동 재배포** 시작
- 1-2분 후 변경 사항 반영
- **Logs** 탭에서 재배포 확인

---

## 🧪 테스트 방법

### 1. Health Check

```bash
curl https://YOUR_RENDER_URL.onrender.com/api/health
```

**성공 시**:
```json
{
  "success": true,
  "message": "여수 기적여행 API 서버가 정상 작동 중입니다"
}
```

### 2. CORS 테스트

브라우저 콘솔에서:
```javascript
fetch('https://YOUR_RENDER_URL.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log(d));
```

- **성공**: 응답 데이터 출력
- **CORS 에러**: `ALLOWED_ORIGINS` 확인

### 3. API 기능 테스트

```bash
curl -X POST https://YOUR_RENDER_URL.onrender.com/api/problem/online-wish \
  -H "Content-Type: application/json" \
  -d '{"nickname":"테스터","wishSummary":"테스트입니다"}'
```

- **성공**: `{"success":true, ...}`
- **500 에러**: `OPENAI_API_KEY` 확인

---

## 📞 문제 해결

### OpenAI API 키 에러

**증상**: 500 에러, "OpenAI API 호출 실패"

**해결**:
1. https://platform.openai.com/account/api-keys 에서 키 확인
2. 키 복사 (공백 없이)
3. Render 환경 변수 재설정
4. 크레딧 잔액 확인

### CORS 에러

**증상**: "CORS policy" 에러, Wix에서 호출 실패

**해결**:
1. Wix 사이트 URL 정확히 확인
2. `https://` 포함 여부 확인
3. Render 환경 변수 업데이트
4. 재배포 후 테스트

---

**작성일**: 2025-12-12
**용도**: Render 배포 시 참고
