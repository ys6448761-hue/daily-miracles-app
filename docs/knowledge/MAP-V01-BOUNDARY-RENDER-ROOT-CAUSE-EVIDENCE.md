# MAP V0.1 — Boundary Render Root Cause Evidence

**Date**: 2026-10-26  
**Status**: MAP_V01_BOUNDARY_RENDER_ROOT_CAUSE_RESOLVED

---

## §1 근본 원인

| 항목 | 내용 |
|------|------|
| **증상** | `?qa_preview=boundary` 접근 시 QA 배너·경계선 미표시 |
| **원인** | `isQAPreview = import.meta.env.DEV && ...` 조건 오류 |
| **메커니즘** | Express 서버는 `dreamtown-frontend/dist/`(빌드 파일) 서빙. Vite 빌드 시 `import.meta.env.DEV=false`로 치환 → `isQAPreview` 항상 `false` |
| **서버 구조** | `server.js:282` — `app.get('*', (req,res) => res.sendFile('dreamtown-frontend/dist/index.html'))` |
| **포트** | `localhost:5000` (DEFAULT_PORT) |

---

## §2 수정 내용

### `YeosuMapSelector.jsx`

**수정 전:**
```js
const isQAPreview = import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('qa_preview') === 'boundary';
```

**수정 후:**
```js
const isQAPreview =
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
  new URLSearchParams(window.location.search).get('qa_preview') === 'boundary';
```

**보안 유지**: Production URL `app.dailymiracles.kr` hostname ≠ `localhost` → QA 모드 절대 활성화 불가.

### 추가 수정

1. **테스트 사각형 SVG**: `isQAPreview` 시 이미지 전체를 감싸는 빨간 점선 사각형 표시 → SVG 레이어 렌더링 자체 검증용
   - `<rect x="0.05" y="0.05" width="0.90" height="0.90" stroke="rgba(255,80,80,0.7)" strokeDasharray="0.025 0.012"/>`
   - 실제 여수 경계가 아님. Founder 확인 후 제거 예정.

2. **ZoneOverview imageId 필터**: `boundary?.imageId === 'yeosu-overview-v01'` 조건 추가
   - Zone 1·2의 oldtown 좌표가 overview 이미지에 잘못 렌더되는 문제 방지

---

## §3 빌드 검증

```
$ grep -o 'hostname==="localhost".*"boundary"' dist/assets/index-*.js
→ hostname==="localhost"||window.location.hostname==="127.0.0.1")&&new URLSearchParams(window.location.search).get("qa_preview")==="boundary"
```

`import.meta.env.DEV` 흔적 없음 → 올바르게 hostname 체크로 대체됨.

---

## §4 검수 URL 및 접근 방법

```
http://localhost:5000/muyojeong?qa_preview=boundary
```

1. 브라우저에서 위 URL 접속
2. "지역별 탐색" 탭 클릭
3. "원도심 해안권" 또는 "오동도·엑스포권" 선택
4. 확인 항목:
   - ⚠ 주황 배너 "검수용 미확정 경계 — 로컬 개발환경 전용"
   - 빨간 점선 테두리 (전체 이미지 감쌈 — SVG 렌더 확인용)
   - Zone 색상 점선 경계 (청록/하늘)
   - 파란·주황·회색·금색 장소 마커

---

## §5 일반 사용자 화면 격리 확인

| 조건 | isQAPreview 값 | 화면 |
|------|--------------|------|
| `app.dailymiracles.kr` (Production) | `false` | VERIFIED 경계만 (현재 없음) |
| `localhost:5000` 파라미터 없음 | `false` | VERIFIED 경계만 |
| `localhost:5000?qa_preview=boundary` | `true` | QA Preview 활성 |
| `localhost:5000?qa_preview=other` | `false` | VERIFIED 경계만 |

---

## §6 검증 결과

| 항목 | 결과 |
|------|------|
| 빌드 | ✅ exit 0 |
| 회귀 테스트 | ✅ 615/616 PASS (R20 PRE-EXISTING) |
| 빌드 파일 내 hostname 조건 | ✅ 확인됨 |
| import.meta.env.DEV 제거 | ✅ 빌드 파일에 없음 |
| PROVISIONAL string | ✅ 6회 (Zone 1·2 boundary + source) |
| 일반 화면 VERIFIED 게이팅 | ✅ 유지 |
