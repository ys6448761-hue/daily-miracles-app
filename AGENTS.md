# AGENTS.md — daily-miracles-mvp

> Codex와 Claude Code 협업 가이드.
> 이 파일을 먼저 읽고 작업을 시작하라.

---

## 1. 프로젝트 정체성

**서비스명:** 하루하루의 기적 (Daily Miracles)
**도메인:** `app.dailymiracles.kr`
**핵심 개념:** 소원을 "별"로 변환하는 감정 기반 소원 플랫폼

### 두 개의 레포
| 레포 | 경로 | 역할 |
|------|------|------|
| `daily-miracles-mvp` | `C:\DEV\daily-miracles-mvp` | **백엔드 + DreamTown 프론트엔드 (이 레포)** |
| `sowon-dreamtown` | `C:\DEV\sowon-dreamtown` | Next.js 분리 프론트 (별도 관리) |

---

## 2. 아키텍처

```
┌─────────────────────────────────────────────┐
│               Render.com (port 5000)         │
│                                              │
│  Express (server.js)                         │
│    ├── routes/          (~50개 라우트)        │
│    ├── services/        (~100개 서비스)       │
│    ├── middleware/      (auth, error 등)      │
│    └── dreamtown-frontend/dist/  (정적 빌드) │
│                                              │
│  DB: PostgreSQL (운영) / SQLite (로컬)        │
└─────────────────────────────────────────────┘
```

### 프레임워크
- **백엔드:** Node.js 20 + Express (CommonJS, `'use strict'`)
- **프론트엔드:** React 18 + Vite + React Router v6
- **⚠️ Next.js 아님** — `pages/`, `app/` 폴더 없음

---

## 3. 디렉토리 구조

```
daily-miracles-mvp/
├── server.js                  # 메인 앱 진입점
├── database/
│   ├── db.js                  # DB 연결 (SQLite/PostgreSQL 환경 분기)
│   └── migrations/            # SQL 마이그레이션 (순번 필수)
├── routes/                    # Express 라우터
│   ├── dreamtownRoutes.js     # /api/dt/* (DreamTown 핵심)
│   ├── adminLocationRoutes.js # /api/admin/dt/location/*
│   ├── starImageRoutes.js     # /api/star-image/*
│   └── ...
├── services/                  # 비즈니스 로직
│   ├── messageProvider.js     # 발송 허브 (SENS) — 반드시 경유
│   ├── miracleScoreEngine.js  # 기적지수 계산
│   ├── overlayService.js      # 이미지 한글 텍스트 합성
│   └── ...
├── middleware/
│   └── errorHandler.js        # 글로벌 에러 핸들러
├── config/
│   ├── locationRegistry.js    # 장소 SSOT (별공방 코드 관리)
│   └── thumbnail/             # 썸네일 파이프라인 SSOT
│       ├── emotions.json      # 5감정 정의
│       ├── cafe.json / cafe-copy.json
│       ├── cablecar.json / cablecar-copy.json
│       ├── hotel.json / hotel-copy.json
│       └── hamel.json / hamel-copy.json
├── scripts/
│   └── thumbnail/             # 썸네일 자동생성 파이프라인
│       ├── utils.js           # 공통 유틸 (EMOTION_ORDER 등)
│       ├── build-{loc}-prompts.js
│       └── generate-{loc}-images.js
├── outputs/
│   └── prompts/thumbnail/     # 생성된 프롬프트 .txt
│       ├── cafe/ cablecar/ hotel/ hamel/
├── public/
│   ├── images/
│   │   ├── thumbnails/        # 썸네일 도메인 (star-cache와 분리)
│   │   │   ├── cafe/ cablecar/ hotel/ hamel/
│   │   └── star-cache/        # 운영 별 이미지 (건드리지 말 것)
│   └── ...
├── dreamtown-frontend/        # React/Vite 프론트엔드
│   ├── src/
│   │   ├── pages/             # 화면 컴포넌트
│   │   │   ├── EntryPage.jsx  # QR 진입 + 장소 분기
│   │   │   ├── WishGate.jsx   # 소원 입력
│   │   │   ├── StarBirth.jsx  # 별 탄생 축하
│   │   │   ├── StarDetail.jsx # 별 상세
│   │   │   └── MyStar.jsx     # 내 별
│   │   ├── api/dreamtown.js   # 백엔드 API 호출
│   │   └── lib/               # 유틸리티
│   └── dist/                  # 빌드 결과 (Express가 정적 서빙)
└── assets/
    └── fonts/
        └── NotoSansKR-Regular.ttf  # 한글 렌더링용 번들 폰트
```

---

## 4. 핵심 시스템

### 4-1. DreamTown 별 시스템

소원 입력 → 별 생성 → 성장 흐름:

```
EntryPage (?loc=) → WishGate → postWish → postStarCreate → StarBirth → MyStar
```

**핵심 테이블:**
| 테이블 | 역할 |
|--------|------|
| `dt_wishes` | 소원 원문 저장 |
| `dt_stars` | 별 상태 (`star_stage`: day1→day7→day30→day90) |
| `dt_stars.origin_place` | 장소 코드 SSOT (canonical: `yeosu_cablecar_workshop` 등) |
| `star_image_cache` | gpt-image-1 생성 이미지 캐시 |

**장소 코드 SSOT:** `config/locationRegistry.js`
```js
// canonical 코드 (DB 저장값)
'global_default_workshop'    // 기본 별공방
'yeosu_cablecar_workshop'    // 여수 케이블카
'yeosu_lattoa_cafe'          // 라또아 카페

// alias → canonical 자동 변환 (getKpiCode 사용)
'cablecar' → 'yeosu_cablecar_workshop'
'global'   → 'global_default_workshop'
```

**집계 쿼리 패턴 (NULL 포함):**
```sql
WHERE COALESCE(origin_place, 'global_default_workshop') = $1
```

### 4-2. 신호등 시스템

소원 텍스트 안전 분류:
- `RED` — 자살/자해 → 관리자 SMS 즉시 발송, 별 생성 없음
- `YELLOW` — 주의 → 케어 메시지 표시
- `GREEN` — 정상 → 별 생성 진행

**절대 우회 금지.** RED 처리 로직은 `services/safetyService.js` 또는 `wishIntakeService.js`.

### 4-3. 썸네일 파이프라인

장소별 감정 썸네일 자동 생성 시스템.

**5감정 SSOT** (`config/thumbnail/emotions.json`):
```
confusion → pause → calm → curiosity → fragile_hope
```

**파일명 규칙:**
- 프롬프트: `{num}_{emotion}_{location}_prompt.txt`
- 이미지:   `{num}_{emotion}_{location}.png`

**실행:**
```bash
node scripts/thumbnail/build-{location}-prompts.js   # 프롬프트 생성
node scripts/thumbnail/generate-{location}-images.js  # 이미지 생성
node scripts/thumbnail/generate-{location}-images.js --dry-run  # 검증
```

**하멜 특이사항:** `build-hamel-prompts.js`에 `LIMIT = 5` 설정됨 (DoD 검수 전 제한). 검수 통과 후 LIMIT 제거.

### 4-4. 이미지 한글 텍스트 합성

`gpt-image-1`은 한글을 신뢰할 수 없게 렌더링함 → **반드시 후처리 합성** 사용.

```
gpt-image-1 생성 (Text 블록 없이) → PNG 저장 → overlayService.js 합성
```

`services/overlayService.js`:
- `opentype.js` + `NotoSansKR-Regular.ttf` → 한글 → SVG `<path>`
- `sharp.composite()` 로 PNG 위에 합성

---

## 5. DB 패턴

### 환경 분기

```js
// database/db.js
// NODE_ENV === 'production' → PostgreSQL (DATABASE_URL)
// 그 외 → SQLite (local)
```

**절대 원칙:**
- PK: UUID v4 (`uuid` 패키지 또는 `gen_random_uuid()`)
- 원장 테이블: append-only (UPDATE 최소화, 상태 변경은 새 row)
- 상태머신: `video_jobs` 등 stage 컬럼으로 상태 추적

### 마이그레이션

```bash
# 파일명: {순번}_{설명}.sql
database/migrations/157_workshop_loc_rename.sql

# 순번은 절대 건너뛰지 말 것 (최신: 157)
# 배포 후 실행: psql $DATABASE_URL -f database/migrations/{파일}
```

---

## 6. API 규칙

### 라우트 등록 위치

`server.js`에 `app.use('/api/...', require('./routes/...'))` 형태로 등록.
새 라우트 추가 시 반드시 `server.js`에도 등록.

### 응답 형식

```js
// 성공
res.json({ success: true, data: ... })

// 실패
res.status(4xx).json({ success: false, error: '메시지' })

// 에러 코드 패턴
if (err.code === '42P01') return res.status(503).json({ error: '테이블 초기화 중' })
```

### 관리자 인증

```js
// ?token=ADMIN_TOKEN 또는 x-admin-token 헤더
// PIN '1234' → ADMIN_TOKEN 으로 자동 변환 (adminGuard 미들웨어)
```

---

## 7. 프론트엔드 규칙

### 빌드 & 배포

```bash
cd dreamtown-frontend
npm run build          # dist/ 생성
# dist/ 를 git에 커밋해야 운영에 반영됨 (Render 정적 서빙)
```

**빌드 없이 push하면 화면 미반영.** 반드시 build → dist 확인 → push 순서.

### 라우팅

React Router v6. 모든 라우트는 `src/App.jsx`에 정의됨.

### 장소 → canonical 변환 (EntryPage.jsx)

```js
const LOC_NORMALIZE = {
  'yeosu_cablecar_workshop': 'cablecar',
  'cablecar': 'cablecar',
  'global_default_workshop': 'global',
  // ...
};
const LOC_TO_CANONICAL = {
  'cablecar': 'yeosu_cablecar_workshop',
  'global':   'global_default_workshop',
  'lattoa':   'yeosu_lattoa_cafe',
};
// CTA 클릭 시 navigate state에 originLocation 전달
navigate('/wish', { state: { originLocation: LOC_TO_CANONICAL[loc] } })
```

---

## 8. 메시지 발송 규칙

**반드시 `services/messageProvider.js` 경유.**
직접 Solapi/SENS SDK 호출 금지.

```js
const { sendSMS, sendAlimtalk } = require('./messageProvider');
```

- SMS: `sendSMS(phone, message)`
- 알림톡: `sendAlimtalk(phone, templateCode, params)`
- Day7/30/90 추적: SMS 전용 (알림톡 미등록 번호 대응)

---

## 9. 금지 사항

| 금지 | 이유 |
|------|------|
| 금지 단어: 사주, 점술, 관상, 운세, 대운, 궁합 | 서비스 정책 |
| RED 신호 우회 | 사용자 안전 직결 |
| `public/images/star-cache/` 직접 수정 | 운영 이미지 도메인 |
| `messageProvider.js` 우회 발송 | 발송 추적 누락 |
| migration 순번 건너뜀 | DB 스키마 충돌 |
| 빌드 없이 프론트엔드 push | 화면 미반영 |
| `stars.origin_location` 기준 집계 | 구 테이블 — 신규 별은 `dt_stars.origin_place` |

---

## 10. 코드 스타일

```js
'use strict';  // 모든 파일 첫 줄

// CommonJS (import/export 금지)
const fs = require('fs');
module.exports = { ... };

// 비동기: async/await (callback 금지)
// 에러: try/catch + console.error (winston 사용 시 logger.error)
// PK: UUID
```

---

## 11. 주요 환경 변수

```
DATABASE_URL          # PostgreSQL (운영)
OPENAI_API_KEY        # GPT-4, gpt-image-1, DALL-E 3
ADMIN_TOKEN           # 관리자 API 인증
SENS_ACCESS_KEY       # 네이버 SENS (SMS/알림톡)
NICEPAY_CLIENT_ID     # 결제
NODE_ENV              # production / development
```

---

## 12. 협업 원칙 (Claude Code ↔ Codex)

### 역할 분리

| 역할 | Claude Code | Codex |
|------|-------------|-------|
| 코드 수정 | ✅ 주담당 | ✅ 위임 가능 |
| 파일 생성 | ✅ | ✅ |
| DB 마이그레이션 실행 | ❌ (운영 DB) | ❌ |
| 메시지 발송 테스트 | 신중하게 | 신중하게 |

### Codex에게 위임 적합한 작업

- 스크립트 작성 (scripts/thumbnail 등)
- 유틸 함수 작성 및 리팩토링
- 테스트 파일 작성
- 문서 생성
- 프롬프트 템플릿 수정

### Codex가 건드리면 안 되는 파일

- `server.js` (라우트 등록 전체 영향)
- `services/messageProvider.js` (발송 허브)
- `services/safetyService.js` 또는 RED 신호 처리 로직
- `database/db.js`
- `middleware/errorHandler.js`

### 작업 전 필수 확인

1. `DREAMTOWN_STATUS.md` — 현재 진행 중인 작업 확인
2. `config/locationRegistry.js` — 장소 코드 변경 전 확인
3. migration 최신 순번 확인 (`ls database/migrations/ | tail -5`)

---

## 13. 자주 쓰는 커맨드

```bash
# 로컬 서버
node server.js             # port 5100

# 프론트엔드 빌드
cd dreamtown-frontend && npm run build

# 썸네일 파이프라인
node scripts/thumbnail/build-hamel-prompts.js
node scripts/thumbnail/generate-hamel-images.js --dry-run
node scripts/thumbnail/generate-hamel-images.js

# migration (운영)
psql $DATABASE_URL -f database/migrations/{파일}.sql

# 마이그레이션 순번 확인
ls database/migrations/ | sort | tail -5
```

---

## 14. 현재 진행 상태 (2026-05-03)

### 완료
- P0 버그 수정: `dt_stars.origin_place` 기준 집계로 전환
- 장소 SSOT v2: canonical 코드 체계 (`yeosu_cablecar_workshop` 등)
- 공유 유입 루프: `/entry?from=share&star=:id`
- 썸네일 파이프라인: 4개 장소 (cafe/cablecar/hotel/hamel)

### 진행 중
- 하멜 썸네일 5장 DoD 검수 → 전체 생성 대기
- migration 157 운영 DB 실행 대기

### 경로 분리 완료
```
outputs/prompts/thumbnail/{location}/   ← 썸네일 프롬프트
public/images/thumbnails/{location}/    ← 썸네일 이미지
public/images/star-cache/               ← 운영 별 이미지 (분리됨)
```

---

## 15. 금지 단어 전체 목록 (17개)

**P0 정책 — 이 단어가 출력에 포함되면 자동 REVISE.**

| # | 금지어 | 영문 | 대체 표현 |
|---|--------|------|----------|
| 1 | 사주 | Four pillars of destiny | 소원, 마음의 빛 |
| 2 | 점술 | Divination | 기적의 흐름 |
| 3 | 관상 | Physiognomy / Face reading | — |
| 4 | 운세 | Fortune / Luck reading | 기적지수 |
| 5 | 대운 | Major fortune cycle | — |
| 6 | 궁합 | Compatibility (fortune-based) | — |
| 7 | 타로 | Tarot | — |
| 8 | 역술 | Traditional fortune-telling | — |
| 9 | 신점 | Psychic / Spirit reading | — |
| 10 | 무속 | Shamanism | — |
| 11 | 팔자 | Fate / Ba-zi | — |
| 12 | 명리 | Oriental destiny science | — |
| 13 | 예언 | Prophecy | — |
| 14 | 점괘 | Fortune result / Divination sign | — |
| 15 | 점쟁이 | Fortune teller | — |
| 16 | 운명감정 | Destiny reading | — |
| 17 | 신탁 | Oracle | 별의 공명 |

**허용 대체 언어:** 소원 / 기적 / 별 / 공명 / 감정 / 성장 / 마음

---

## 16. DreamTown 정체성 기준 (5가지)

"이 기능은 DreamTown인가?"를 판단하는 5가지 기준.

| # | 기준 | 설명 |
|---|------|------|
| 1 | **감정 우선** | 사용자의 감정이 흐름의 시작점. 기능이 먼저가 아님. |
| 2 | **별 = 소원의 물리화** | 소원은 텍스트가 아니라 별(시각적 객체)로 변환됨. |
| 3 | **성장 서사** | 별은 day1→day7→day30→day90 단계로 성장. 정적 상태 아님. |
| 4 | **공명 연결** | 혼자의 소원이 타인과 연결(공명)될 수 있음. 고립 아님. |
| 5 | **안전 우선** | 신호등 RED 처리가 모든 것에 앞선다. 우회 불가. |

**판단 질문:** 이 기능을 추가하면 위 5가지 중 어느 것을 강화하는가?
기준에 해당 없으면 → REVISE 요청.

---

## 17. 시스템 3분할 SSOT

서비스는 세 개의 독립 도메인으로 나뉜다. 신규 기능은 반드시 아래 중 하나에 위치해야 한다.

| 도메인 | 라우트 경로 | 설명 |
|--------|------------|------|
| **Core** (소원/별) | `routes/dreamtown*.js` | DreamTown 핵심 플로우 |
| **Travel** (여행) | `routes/travel*.js`, `routes/yeosuMission*.js` | 여수 여행 미션 |
| **Yeosu Ops** (운영센터) | `routes/adminLocation*.js`, `routes/starMvp*.js` | 별공방 운영/집계 |

### 도메인 간 호출 원칙

1. **Core는 Travel/Ops에 의존하지 않는다.**
2. Travel/Ops는 Core(`dt_stars`, `dt_wishes`) 를 **읽을 수** 있다.
3. **크로스 도메인 쓰기 금지** — `dt_stars`에 쓰는 것은 Core만.

### 신규 기능 위치 결정

- 소원 / 별 / 감정 / 성장 관련 → **Core**
- 장소 / 미션 / 여행 콘텐츠 → **Travel**
- 관리자 / 집계 / 운영 대시보드 → **Yeosu Ops**

---

## 18. 케이블카 Core 허용/금지 규칙

케이블카 장소(`yeosu_cablecar_workshop`)는 **감정 진입 전용** 맥락이다.

### 허용

| 항목 | 비고 |
|------|------|
| 전환 버튼 | "별 보러 가기", "소원 남기기" CTA |
| 감정 진입 분기 | 케이블카 맥락으로 WishGate 진입 |
| 장소 텍스트 표시 | "여수 케이블카에서 남긴 별" |
| 별 생성 | `origin_place = 'yeosu_cablecar_workshop'` |

### 금지

| 항목 | 이유 |
|------|------|
| **판매 버튼** | 케이블카는 판매 장소가 아님 — 감정 진입 장소 |
| 결제 UI | 케이블카 페이지에 결제 CTA 불가 |
| 직접 공유 푸시 | 케이블카 맥락에서 바이럴 강요 금지 |
| `sourceEvent: 'purchase'` | 케이블카는 `sourceEvent: 'cablecar'` 고정 |

---

## 19. 소원 이미지 SSOT (20셀 매트릭스)

별 이미지 생성 시 준수해야 할 시각 규칙.

**4×5 매트릭스 (장소 4 × 감정 5):**

| | confusion | pause | calm | curiosity | fragile_hope |
|---|---|---|---|---|---|
| **global** | 어두운 방 창문 | 빈 책상 | 달빛 마루 | 불 켜진 창 | 새벽 창가 |
| **cablecar** | 안개 속 창문 | 케이블카 정차 | 공중 고요 | 빛나는 항구 | 저녁 케이블카 |
| **cafe** | 빗속 유리창 | 식은 커피잔 | 카페 구석 빛 | 두 번째 커피 | 이른 오전 카페 |
| **hotel** | 짐 풀린 방 | 침대 가장자리 | 호텔 야경 | 테라스 새벽 | 체크아웃 전 아침 |

### 시각 고정 규칙

| 규칙 | 설명 |
|------|------|
| **내부 시점 (interior viewpoint)** | 바깥이 아닌 **안에서 바라보는** 구도 |
| **후면 인물 (rear view)** | 인물이 등장할 경우 반드시 **뒷모습** |
| **빛 방향** | 항상 외부→내부 (창문, 문, 틈새를 통해) |
| **텍스트 금지** | 이미지 내 한글/영문 모두 금지 — overlayService.js 후처리 |

---

## 20. 별공방 9단계 플로우 + "3개월 질문"

### 별공방 9단계 (Workshop Flow)

| # | 단계 | 경로/서비스 |
|---|------|------------|
| 1 | QR 스캔 → EntryPage | `dreamtown-frontend/src/pages/EntryPage.jsx` |
| 2 | 장소 인식 → originLocation canonical 코드 설정 | `config/locationRegistry.js` |
| 3 | 감정 확인 → WishGate 로딩 | `WishGate.jsx` |
| 4 | 소원 입력 → `dt_wishes` 저장 | `routes/dreamtownRoutes.js` |
| 5 | 신호등 판정 → RED/YELLOW/GREEN | `services/safetyService.js` |
| 6 | 별 생성 → `dt_stars` day1 | `services/starCreateService.js` |
| 7 | 별 탄생 축하 → StarBirth | `StarBirth.jsx` |
| 8 | 별 케어 → 7/30/90일 SMS | `services/retentionService.js` |
| 9 | 공명 → `resonance_count` 누적 | `routes/dreamtownRoutes.js` |

### "3개월 질문" — 공식 문구

**허용 (canonical):**
- "3개월 뒤, 이 소원이 이루어진다면 당신은 어떤 모습인가요?"
- "3개월 후 달라진 하루를 상상해보세요."

**금지 (forbidden):**
- "3개월 안에 이루어집니다" — 약속/보장 어투
- "3개월이면 충분합니다" — 단정
- "3개월 플랜을 짜드릴게요" — 코칭 서비스 어투

**원칙:** 질문은 열어두고, 답은 사용자가 스스로 찾는다.

---

## 21. 디자인 SSOT

### 핵심 색상 (변경 금지)

| 역할 | 코드 | 용도 |
|------|------|------|
| 별 보라 | `#9B87F5` | 별, 강조, 주요 CTA |
| 별 금 | `#FFD76A` | 별빛, 감정 포인트 |
| 배경 심우주 | `#0D1B2A` | 전체 배경 기본값 |

### 스타일 규칙

| 규칙 | 내용 |
|------|------|
| 화풍 | **2D 수채화 일러스트** — 3D/사진 아님 |
| 분위기 | **지브리 감성** — 부드럽고 시적, 화려하지 않음 |
| 텍스트 | 이미지 내 한글/영문 모두 금지 (overlayService 후처리) |
| 인물 | 뒷모습 또는 없음 — 얼굴 금지 |
| 광원 | 단일 부드러운 광원 (복수 광원 금지) |

### 금지

- 형광색, 네온 (밝은 파티 느낌)
- 두꺼운 아웃라인의 만화체
- 스톡 포토 느낌의 사실적 사진
- 실사 인물 삽입

---

## 22. 콘텐츠 4단계 구조

모든 사용자 향 콘텐츠(문구, 화면, 메시지)는 이 순서를 따른다.

| 단계 | 이름 | 예시 문구 |
|------|------|----------|
| 1 | **감정 인식** | "지금 이 마음, 알고 있어요" |
| 2 | **공간 제공** | "여기에 잠깐 두어도 괜찮아요" |
| 3 | **전환 유도** | "이 마음을 별로 남겨볼까요?" |
| 4 | **연결 암시** | "이 별이 누군가와 공명할 수 있어요" |

### 위반 패턴 (금지)

- 1단계 없이 바로 CTA (감정 생략하고 버튼부터)
- 4단계를 "공유하세요"로 대체 (바이럴 강요)
- "지금 구매하세요" 어투 삽입

---

## 23. 한글 인코딩 P0 규칙

### 절대 규칙 (P0)

1. **이미지 내 한글 직접 렌더링 금지** — `gpt-image-1` / DALL-E 3 모두 한글 깨짐 발생
2. **모든 한글 텍스트 = `overlayService.js` 후처리**
3. **프롬프트에 한글 텍스트 블록 요청 금지**

### overlayService.js 호출 패턴

```js
const { overlayText } = require('./services/overlayService');

// 이미지 생성 후 한글 합성
const finalBuffer = await overlayText(imageBuffer, [
  { text: '저 별은 당신을 기억합니다', x: 'center', y: 'bottom', size: 18 }
]);
```

### 폰트

```
assets/fonts/NotoSansKR-Regular.ttf   ← 반드시 이 폰트 사용
```

파이프라인: `opentype.js` → 한글 → SVG `<path>` → `sharp.composite()`

### 금지

- `canvas` 또는 `node-canvas`로 직접 한글 렌더링 (폰트 누락 위험)
- 이미지 프롬프트에 `"텍스트: 저 별은..."` 포함
- 이미지 생성 API에 `text` 파라미터로 한글 전달

---

## 24. 코드 리뷰 우선순위 + VERDICT 형식

### 리뷰 우선순위

| 등급 | 항목 |
|------|------|
| **P0** | RED 신호 우회 / 금지 단어 포함 / messageProvider 우회 / 인코딩 규칙 위반 |
| **P1** | `dt_stars`/`stars` 테이블 혼용 / migration 순번 오류 / 빌드 없이 push / canonical 코드 오류 |
| **P2** | 코드 스타일 / 주석 과잉 / 불필요한 import |

### VERDICT 응답 형식

코드 리뷰 요청 시 반드시 아래 형식으로 마무리한다.

**승인 시:**
```
VERDICT: APPROVED
```

**수정 요청 시:**
```
VERDICT: REVISE
P{등급}: {구체적 이유}
수정 방향: {1-2줄 제안}
```

**예시:**
```
VERDICT: REVISE
P0: messageProvider.js 우회하여 직접 Solapi SDK 호출
수정 방향: sendSMS() / sendAlimtalk() 함수 경유로 변경
```

### 리뷰 대상 파일 우선순위

1. `services/safetyService.js` — RED 처리 로직 포함 시 최우선
2. `services/messageProvider.js` — 발송 경로
3. `routes/dreamtownRoutes.js` — 핵심 API
4. `database/migrations/*.sql` — 순번 및 SQL 안전성

---

## 25. Star Expression SSOT

별 표현의 원칙. 모든 썸네일 생성 전 반드시 준수.

| 원칙 | 내용 |
|------|------|
| **별 = 감정의 언어** | 별 색은 사용자의 감정 상태를 표현한다. 장식이 아니다. |
| **보석 = 감정의 성질** | 보석은 그 감정이 가진 물질적 성질을 정의한다. |
| **단일 별** | 썸네일당 합성 별 1개만 허용. 2개 이상 금지. |
| **등대 색 고정** | 구조물(등대, 건물, 벽)의 색은 절대 변경 금지. |
| **혼합/네온 금지** | 별 색 혼합, 무지개 효과, 네온 발광 전부 금지. |

**파이프라인 위치:**
```
base/ 원본 → drawStar (lib/drawStar.js) → generated/sample/ 또는 generated/full/
```

**관련 파일:**
- `scripts/thumbnail/lib/drawStar.js` — 별 합성 핵심 로직
- `config/thumbnail/star-color-map.json` — 감정별 색상
- `config/thumbnail/star-intensity-map.json` — 감정별 크기/밝기
- `config/thumbnail/emotion-gem-map.json` — 1:1 감정-보석 매핑 SSOT

---

## 26. Scene Flow SSOT

썸네일 씬의 구성 흐름 (변경 금지).

```
소원이(Sowoni) → 장소(harbor/cafe/hotel/cablecar) → 별(감정색)
```

| 요소 | 규칙 |
|------|------|
| 인물 | 소원이, 뒷모습 또는 없음. 얼굴 금지. |
| 장소 | 장소 SSOT(`config/thumbnail/{loc}.json`)의 scene 기준. |
| 별 | 씬 상단 하늘 영역에 위치. 등대 위에 배치하지 않음. |
| 시점 | 내부 시점 (interior viewpoint) — 안에서 밖을 바라봄. |
| 광원 | 외부→내부 방향 단일 광원. 복수 광원 금지. |

**starPosition 매핑** (`scripts/thumbnail/lib/starPosition.js`):
| type | xRatio | yRatio | 설명 |
|------|--------|--------|------|
| anchor | 0.50 | 0.22 | 중앙 상단 |
| left   | 0.32 | 0.25 | 왼쪽 하늘 |
| right  | 0.68 | 0.25 | 오른쪽 하늘 |
| low    | 0.50 | 0.32 | 중앙 하단 |
| wide   | 0.50 | 0.18 | 최상단 중앙 |

---

## 27. Emotion Visual Rule

감정별 별의 시각 표현 규칙 (intensity 기준).

| 감정 | radius | blur | opacity | 시각 인상 |
|------|--------|------|---------|----------|
| confusion | 40 | 8 | 0.72 | 흐릿하고 불확실함 |
| pause | 48 | 10 | 0.80 | 고요하고 깊음 |
| calm | 52 | 9 | 0.82 | 안정되고 넓음 |
| curiosity | 50 | 10 | 0.85 | 밝고 앞으로 향함 |
| fragile_hope | 38 | 6 | 0.50 | 아주 연하고 조심스러움 |

**fragile_hope 안전망:** opacity 0.50 → 시각 검증 후 "별 안 보임" FAIL 시 0.60, blur 6→8 조정 허용 (그 이상 금지).

**passion/ruby RESERVED:** intensity map에 `"_reserved": true` 보존. MVP 샘플 제외. 코드에서 RESERVED 감지 시 예외 throw.

---

## 28. Thumbnail QA Check

썸네일 생성 후 검증 체크리스트.

### Tier 1 (코드 자동 검증)

- [ ] 5감정 파일 모두 생성 (`confusion/pause/calm/curiosity/fragile_hope`)
- [ ] passion/ruby 샘플 미생성 (RESERVED 보호)
- [ ] base MD5 무변경 (원본 손상 없음)
- [ ] 출력 경로: `generated/sample/` 또는 `generated/full/`
- [ ] 파일명: `{loc}_{emotion}_{gemstone}_{baseId}.png`

### Tier 2 (인간 시각 검증)

- [ ] 장소별로 감정이 다르게 느껴지는가?
- [ ] 별 1개만 보이는가? (2개 이상 보이면 FAIL)
- [ ] fragile_hope 별이 보이는가? (안 보이면 안전망 적용)
- [ ] 등대/건물 색이 변경되지 않았는가?
- [ ] 네온/무지개 효과 없는가?
- [ ] 수채화 지브리 톤이 유지되는가?

### 알려진 제약

- base 이미지가 AI 생성 시 자체 별을 포함하고 있으면 합성 별과 겹쳐 2개처럼 보일 수 있음. base 이미지 선정 시 별 없는 씬 사용 권장.

---

## 29. DreamTown MVP 5감정 SSOT (1:1 고정 매핑)

> **"보석은 선택지가 아니라, 감정의 언어다"**

| 감정 | 보석 | star hex | glow hex |
|------|------|----------|----------|
| confusion | moonstone | `#D6E4F0` | `#F2F7FB` |
| pause | sapphire | `#1B5299` | `#6FA8DC` |
| calm | emerald | `#2D8653` | `#7ED9A3` |
| curiosity | topaz | `#E6B85C` | `#F5DFA3` |
| fragile_hope | diamond | `#F5F7FA` | `#FFFFFF` |

**RESERVED (MVP 제외, 코드 보존):**
| 감정 | 보석 | 이유 |
|------|------|------|
| passion | ruby `#9B1B30` | 향후 확장 예정 — MVP 샘플 생성 금지 |

### 원칙

1. **1:1 고정** — 감정마다 보석 1개 고정. 다른 조합 불가.
2. **매트릭스 금지** — 장소×감정 교차 매핑 방식 사용 불가.
3. **SSOT 파일:** `config/thumbnail/emotion-gem-map.json`
4. **색상 SSOT:** `config/thumbnail/star-color-map.json`
5. **밝기 SSOT:** `config/thumbnail/star-intensity-map.json`
