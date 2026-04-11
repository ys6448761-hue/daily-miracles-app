# OG 이미지 500 오류 수정 지시서

**프로젝트:** `c:\DEV\daily-miracles-mvp`  
**긴급도:** 🔴 즉시  
**목적:** `GET /images/dreamtown-og-v2.jpg` → 200 정상화

---

## 배경 (읽고 시작)

`server.js` 795번 줄에 `/images` static 서빙 코드는 이미 존재하고 위치도 맞음.  
그러나 **64번 줄의 `gateMiddleware`가 static보다 먼저 실행**되어 `/images` 요청을  
API 에러 체인으로 넘길 가능성이 높음.

에러 메시지 근거:
```
"Client Error API 경로 with ID '/images/dreamtown-og-v2.jpg' not found" → 500
```

---

## Step 1 — 파일 존재 확인 (진단)

```bash
# 파일이 git에 추적 중인지
git ls-files | grep dreamtown-og

# 실제 파일 존재 확인
ls -la public/images/dreamtown-og-v2.jpg
```

**파일 없으면:** `public/images/` 폴더에 추가 후 git add 필요.

---

## Step 2 — gateMiddleware 확인 (핵심)

`middleware/gateMiddleware.js` 열어서 아래 확인:

- `/images` 또는 정적 확장자(`.jpg`, `.png` 등) 경로를 **통과(next)** 시키는가?
- `APP_DISABLED` 등의 조건으로 모든 경로를 막고 있는가?

**수정 필요 시:** `/images`로 시작하는 경로는 미들웨어를 건너뛰도록 추가:

```js
// middleware/gateMiddleware.js 내부 예시
module.exports = (req, res, next) => {
  // 정적 파일 경로는 게이트 통과
  if (req.path.startsWith('/images') || req.path.startsWith('/favicon')) {
    return next();
  }
  // 기존 게이트 로직...
};
```

---

## Step 3 — 파일이 없으면 추가

```bash
# public/images/ 폴더 없으면 생성
mkdir -p public/images

# OG 이미지 파일을 해당 경로에 복사/배치 후
git add public/images/dreamtown-og-v2.jpg
```

---

## Step 4 — 커밋 & 배포

```bash
git add server.js middleware/gateMiddleware.js public/images/dreamtown-og-v2.jpg
git commit -m "fix: /images static 서빙 gateMiddleware 통과 처리 및 OG 이미지 추가"
git push origin main
```

---

## Step 5 — 배포 후 검증 (DoD)

```bash
# 1. curl 200 확인
curl -I https://app.dailymiracles.kr/images/dreamtown-og-v2.jpg
# 기대값: HTTP/2 200

# 2. 브라우저 직접 접근
# https://app.dailymiracles.kr/images/dreamtown-og-v2.jpg

# 3. 카카오 공유 디버거
# https://developers.kakao.com/tool/debugger/sharing
# → https://app.dailymiracles.kr 입력 → 캐시 초기화 → 썸네일 확인
```

---

## 완료 기준

- [ ] `curl -I` 결과 `HTTP/2 200`
- [ ] 브라우저에서 이미지 정상 렌더
- [ ] 카카오 디버거 썸네일 정상 출력

