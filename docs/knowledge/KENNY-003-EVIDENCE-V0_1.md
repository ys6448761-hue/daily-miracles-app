# PHX-KENNY-003 — 케니호텔 전용 무여정 영업 시연판 Evidence V0.1

**Task ID:** PHX-KENNY-003  
**Date:** 2026-11-07  
**Status:** IMPLEMENTED — 로컬 개발 환경. Production 배포 별도 Founder 승인 필요.  
**Author:** Claude Code (Sonnet 4.6)

---

## §0 — Founder 결정사항 (2026-11-07)

| 항목 | 결정 |
|------|------|
| Q1 범위 | (b) 단계별 개발 — 케니호텔 전용 UI + 한·영 전환 |
| Q2 언어 전환 UI | 헤더 토글 + URL `?lang=ko|en` 파라미터 |
| Q3 SoulCableCarPage 영문화 | 1차 범위 제외 |

---

## §1 — 구현 파일

| 파일 | 역할 | 상태 |
|------|------|------|
| `dreamtown-frontend/src/pages/KennyHotelPage.jsx` | 케니호텔 전용 페이지 | 신규 생성 |
| `dreamtown-frontend/src/App.jsx` | `/kenny` 라우트 추가 | 수정 |

---

## §2 — 메뉴 구현 상태

| 메뉴 ID | 한국어 | 영어 | 구현 상태 |
|---------|--------|------|---------|
| guide (여수 여행 가이드) | ✅ | ✅ | OPERATIONAL — /muyojeong 연결 |
| route (별빛항로 1박 2일) | ✅ | ✅ | DEMO_CARD — Day1/Day2 텍스트 + 소원그림 안내 |
| starlight (별빛항로·소원그림) | ✅ | ✅ | DEMO_CARD — 개요 텍스트 |
| rooftop (루프탑 전망) | ✅ | ✅ | DEMO_CARD — 사진 미확정으로 준비 중 |
| food (맛집·쿠폰) | ✅ | ✅ | DEMO_CARD — 쿠폰 발급 미구현 |
| benefit (별빛혜택) | ✅ | ✅ | DEMO_CARD — 혜택 데이터 미연결 |

---

## §3 — 언어 전환 설계

- 초기 언어 우선순위: URL `?lang=` → localStorage `kenny_lang` → 기본 `ko`
- 전환 시: URL 파라미터 갱신 (replace, 히스토리 오염 없음) + localStorage 저장
- 활성 메뉴 패널 유지: 언어 전환 후 현재 화면 유지 (setActiveMenu 미초기화)
- 케니호텔 컨텍스트: 언어 전환과 무관하게 `/kenny` 경로·브랜드 유지

---

## §4 — 재사용한 기존 자산

| 자산 | 위치 | 재사용 방법 |
|------|------|-----------|
| Hero 이미지 | `/images/muyojeong/muyojeong-mobile-home-hero-v1.png` | img src 직접 참조 |
| SOUL 채팅 API | `/api/dt/travel/input/text` | GuidePanel → /muyojeong 페이지 navigate |
| SoulThemeContext | `contexts/SoulThemeContext.jsx` | useSoulTheme() 훅 재사용 |
| soul-scope CSS | `index.css` | className="soul-scope" 재사용 |

---

## §5 — 격리 원칙 준수

- 케니호텔 전용 URL: `/kenny` (기존 `/muyojeong` 미변경)
- 케니 브랜드 데이터: `KennyHotelPage.jsx` 내 로컬 상수 (다른 호텔 데이터와 분리)
- 쿠폰 발급: 미구현, DEMO_CARD로 명시적 구분
- Production 배포: 미실행 — 로컬 개발 환경 한정

---

## §6 — 미구현 항목 (다음 단계)

| 항목 | 미구현 이유 | 다음 단계 조건 |
|------|-----------|------------|
| 루프탑 파노라마 사진 | 케니호텔 루프탑 사진 미확보 | Founder/케니 담당자 사진 제공 후 |
| 맛집 쿠폰 발급 | 쿠폰 발급·인증 시스템 미구현 | 별도 Founder 승인 |
| 별빛혜택 데이터 | 혜택 항목 미확정 | 케니호텔 담당자 혜택 목록 확정 후 |
| QR 진입 (케니 전용) | QR 발급 미진행 | Production 배포 후 별도 승인 |
| SoulCableCarPage 영문화 | 1차 범위 제외 | 2차 범위 Founder 결정 |
| NicePay 결제 연결 | 1차 범위 제외 | 별도 Founder 승인 |

---

## §7 — 완료 조건 체크리스트

| 조건 | 상태 |
|------|------|
| 케니호텔 전용 URL (/kenny)에서 화면 열림 | ✅ 라우트 등록 완료 |
| 한국어·영어 전환 | ✅ 헤더 토글 + URL param |
| 모바일 화면 (max-w-md, word-break:keep-all) | ✅ |
| 다른 호텔 데이터와 구분 | ✅ 로컬 상수 격리 |
| 구현/시연/미구현 목록 | ✅ §2 |
| Founder 검수용 미리보기 | ✅ 로컬 http://localhost:5100/kenny |
| Production 배포 | ⏸ 별도 Founder 승인 필요 |

---

## §8 — Founder 검수 결과 (2026-11-08)

스크린샷: `docs/knowledge/screenshots/kenny-ko-full.png`, `kenny-en-full.png`, `kenny-ko-above-fold.png`, `kenny-en-above-fold.png`  
뷰포트: 390×844 (iPhone 14 Pro 기준), deviceScaleFactor 2  
서버: Express port 5000, Vite 빌드 완료 (exit 0)

| # | 검수 항목 | 결과 | 비고 |
|---|----------|------|------|
| 1 | /kenny 한국어 화면 전체 캡처 | ✅ PASS | kenny-ko-full.png 확인 |
| 2 | /kenny?lang=en 영어 화면 전체 캡처 | ✅ PASS | kenny-en-full.png 확인 |
| 3 | 모바일 화면 크기에서의 레이아웃 확인 | ✅ PASS | 390px 뷰포트, 카드 세로 배치, 텍스트 overflow 없음 |
| 4 | 한국어/English 전환 후 케니호텔 컨텍스트 유지 | ✅ PASS | "케니호텔 전용"↔"KENNY HOTEL EXCLUSIVE" 태그, "✓ 투숙객 무료 제공"↔"✓ Free for hotel guests" 유지, 무여정 브랜드명 양쪽 유지 |
| 5 | 기존 SOUL 여행 가이드 연결 확인 | ✅ PASS | "여수 여행 가이드 — 실시간 AI 안내" / "Yeosu Travel Guide — Live AI Guide" 뱃지 표시. 탭 클릭 시 /muyojeong navigate |
| 6 | 무료 제공 뱃지 표현 범위 | ✅ PASS (ADVISORY 有) | "투숙객 무료 제공" 뱃지는 SOUL AI 가이드 접근을 가리키며, 나머지 5개 항목은 "시연용"/"준비 중"으로 뱃지 명시. 하단 "이 페이지는 케니호텔 전용 시연 버전입니다." 경고 배너 존재. **ADVISORY**: 뱃지 위치가 모든 메뉴 위에 있어 오해 소지 최소. 현재 시연 단계에서는 허용 범위. |
| 7 | DEMO_CARD 5개 준비 중 구분 | ✅ PASS | 별빛항로 1박2일(시연용), 별빛항로·소원그림(시연용), 루프탑(준비 중), 맛집·쿠폰(시연용), 별빛혜택(시연용) — 5개 모두 뱃지로 명확히 구분 |

**종합 판정: PASS — Founder 검수 통과 조건 충족**

추가 확인: JourneySceneEngine 오버레이 제거 완료 (isSoulPath() 가드 적용), DreamTown 여정 엔진 카드 미노출 확인.

---

## §9 — PHX-KENNY-004 흐름 수정 결과 (2026-11-08)

**변경 파일:**
- `dreamtown-frontend/src/pages/KennyHotelPage.jsx` — 뱃지 텍스트 수정, GuidePanel navigate 경로 추가
- `dreamtown-frontend/src/pages/MuyojeongHomePage.jsx` — useSearchParams 추가, 케니호텔 복귀 배너

**뱃지 수정:**
- 한국어 가이드 태그: `실시간 AI 안내` → `여수 여행 가이드`
- 한국어 무료 뱃지: `투숙객 무료 제공` → `여행 가이드 무료 제공`
- 영어 가이드 태그: `Live AI Guide` → `Yeosu Travel Guide`
- 영어 무료 뱃지: `Free for hotel guests` → `Travel Guide · Free`

**navigate 수정:**
- `/kenny` 여행 가이드 클릭 → `/muyojeong?from=kenny&lang={lang}` (from, lang 파라미터 전달)

**복귀 배너:**
- `/muyojeong?from=kenny&lang=ko` → 상단 고정 배너 "← 케니호텔로 돌아가기"
- `/muyojeong?from=kenny&lang=en` → 상단 고정 배너 "← Back to Hotel Kenny"
- `/muyojeong` 직접 접속 → 배너 미표시 (기존 한국어 무여정 기능 미변경)

**시나리오 검증 (스크린샷: `docs/knowledge/screenshots/kenny004-*.png`):**

| 시나리오 | 결과 | 스크린샷 |
|---------|------|---------|
| A — /kenny → 가이드 패널 뱃지 확인 | ✅ "여수 여행 가이드" / "여행 가이드 무료 제공" | kenny004-A1-kenny-ko.png |
| B — /kenny?lang=en → 가이드 패널 뱃지 확인 | ✅ "Yeosu Travel Guide" / "Travel Guide · Free" | kenny004-B1-kenny-en.png |
| A — /muyojeong?from=kenny&lang=ko → 복귀 배너 | ✅ "← 케니호텔로 돌아가기" 상단 고정 표시 | kenny004-A2-muyojeong-ko.png |
| B — /muyojeong?from=kenny&lang=en → 복귀 배너 | ✅ "← Back to Hotel Kenny" 상단 고정 표시 | kenny004-B2-muyojeong-en.png |
| C — /muyojeong 직접 접속 → 배너 없음 | ✅ 케니호텔 UI 미노출, 기존 UI 정상 | kenny004-C-muyojeong-direct.png |
| D — 모바일 390px | ✅ 전 시나리오 390px 뷰포트 적용됨 | — |

**Vite 빌드:** exit 0, 경고 없음 (700 modules transformed, 18.83s)

---

## §10 — 로컬 확인 URL

```
http://localhost:5100/kenny                        ← 한국어 (기본)
http://localhost:5100/kenny?lang=en                ← 영어
http://localhost:5100/muyojeong?from=kenny&lang=ko ← 케니호텔 복귀 배너 (한국어)
http://localhost:5100/muyojeong?from=kenny&lang=en ← 케니호텔 복귀 배너 (영어)
http://localhost:5100/muyojeong                    ← 일반 무여정 (케니 UI 없음)
```

---

## §11 — PHX-KENNY-005 텍스트 정확성 수정 결과 (2026-11-08)

**변경 파일:** `dreamtown-frontend/src/pages/KennyHotelPage.jsx` (텍스트 사전 T, StarlightCard)

**수정 항목:**

| 항목 | 수정 전 | 수정 후 |
|------|--------|--------|
| ko day1 | Day 1 | Day 1 — 별빛을 따라서 |
| ko day1desc | 케이블카 16:00 → 크루즈 → 케니호텔 체크인 | 케이블카, 여수 크루즈, 케니호텔 숙박 — 도착 시간과 크루즈 운항 일정에 맞춰 이용하는 추천 여정이에요. |
| ko day2 | Day 2 | Day 2 — 나만의 속도로 |
| ko day2desc | 오동도 → 모이핀 카페 → 장도 갯벌 → 여수수산시장 | 오동도·모이핀 카페·장도·여수수산시장 등 — 원하는 장소를 자유롭게 선택하세요. |
| ko day2note | (없음) | 2일차 장소는 자유 선택이에요. 일부 장소는 추가 비용이 발생할 수 있어요. (신규) |
| ko wishArt | 소원그림 — QR 체험 | 소원그림 — 나만의 여정 기념 |
| ko wishArtDesc | 체크아웃 후 QR 스캔으로 나만의 소원 그림을 받아보세요. | 여수 여정을 담은 나만의 소원 그림 — QR 가이드로 체험해 보세요. |
| en day1 | Day 1 | Day 1 — Follow the Starlight |
| en day1desc | Cable Car 4PM → Evening Cruise → Kenny Hotel Check-in | Cable car, Yeosu cruise, and Hotel Kenny stay — arranged around your arrival time and confirmed cruise schedule. |
| en day2 | Day 2 | Day 2 — Explore at Your Own Pace |
| en day2desc | Odongdo → Moipin Café → Jangdo Mudflat → Yeosu Fish Market | Choose from Odongdo Island, Moifin Café, Jangdo Island, and Yeosu Fish Market, or discover other places that suit your interests. |
| en day2note | (없음) | Day 2 places are optional selections. Additional costs may apply. (신규) |
| en wishArt | Wish Art — QR Experience | Wish Art — A Memory to Keep |
| en wishArtDesc | After check-out, scan the QR code to receive your personal wish painting. | Use your provided QR guide to create a personalized wish painting inspired by your Yeosu journey. |

**스크린샷:** `docs/knowledge/screenshots/kenny005-route-ko.png`, `kenny005-route-en.png`

**검증:**
- ✅ 고정 시간('16:00', '4PM') 삭제
- ✅ 필수 순서 화살표(→) 표현 제거
- ✅ 'check-out' 및 'QR 스캔' 조건부 삭제, 가이드 형태로 대체
- ✅ Day 2 자유 선택 명시 + 추가 비용 안내 추가
- ✅ 한·영 동일 의미 반영
- ✅ Vite 빌드 exit 0 (16.48s)

---

## §12 — PHX-KENNY-004/005 State 정정 (2026-11-08)

**별빛항로 출시 선결 조건 갱신 (Founder 결정):**
- 제외: 디럭스·프리미어 입금가 확인 (슈페리어 더블 단일 출시 결정)
- 현재 선결 조건 3개:
  1. 슈페리어 더블 공급 조건 판매 적용 확인
  2. 미남크루즈 실제 운항 일정 확인
  3. 취소·환불 고객 약관 검토

**PHX-KENNY-004 미검증 항목 (Open):**
- /kenny?lang=en → 무여정 본문 전체 영어 제공 여부 (무여정은 한국어 전용)
- 호텔 주변 쿠폰 실사용 기능
- 루프탑 사진 기반 마커
- 실제 QR 배포

---

## §14 — PHX-KENNY-006 기존 사이트 중심 통합 방향 (2026-11-08)

**Founder 결정:**
- 케니호텔 고객용 메인 사이트: 기존 사이트 유지 (`hotel-kenny-yeosu-starlight-route.sejinlee.chatgpt.site`)
- `/kenny` 역할: 기존 사이트에서 연결하는 무여정 여행 안내 서비스 (대체 아님)
- 무여정 → 기존 사이트 복귀 경로 설계 필요 (한·영 설정 유지)
- 쿠폰 구분: 호텔 주변 쿠폰 / 여수 전체 쿠폰
- 루프탑 파노라마: Founder 사진 확보 후 연결
- 가공 인물 예시 표현: 정정 대상으로 기록 → PHX-KENNY-006-R에서 해소

**금지 (반드시 준수):**
- 기존 사이트 전면 재제작
- 사이트 수정 권한 확인 전 임의 변경
- Production 배포 또는 실제 고객 QR 발급
- 호텔별 서비스 복제 개발

**사전 확인 필요:**
- 기존 사이트 소스 접근 경로 및 수정 권한 (Founder 확인)
- 기존 사이트 → `/muyojeong?from=kenny&lang=` 연결 방식 (외부 링크 또는 iframe)
- 케이블카·크루즈 설명과 패키지 포함 사항 충돌 여부

**설계 방향 (사이트 수정 전 설계만):**
- 기존 사이트 CTA 버튼 → `https://[도메인]/muyojeong?from=kenny&lang=ko|en`
- 무여정 복귀: 기존 `/muyojeong?from=kenny` 배너 "← Back to Hotel Kenny" (PHX-KENNY-004 구현 완료)
- 단, 외부 사이트 복귀 시 배너 href를 기존 사이트 URL로 교체 필요 (별도 Founder 승인 후)

---

## §15 — PHX-KENNY-006-R Founder 결정 정정 (2026-11-08)

**소원그림 모델 이미지:**
- 망고보드 사용권 확보된 이미지 → 기존 그대로 사용
- '가공 인물 이미지' 설명 추가 불필요
- '소원그림 제작 예시' 표시 유지
- 실제 고객 후기·실사용 사례로 표현 금지
- 이미지 사용권을 반복적 검수 차단 조건으로 사용하지 않음

**스토리북 제외 (케니호텔 별빛항로 한정):**
- 상품 포함사항에서 삭제
- 스토리북 소개 섹션·메뉴·가격·혜택 설명 삭제 대상
- 다른 DreamTown 자산은 삭제하지 않음
- 향후 별도 상품으로 검토 가능 (이번 출시 제외)
- **현재 `/kenny` KennyHotelPage.jsx에는 스토리북 메뉴 없음 → 코드 변경 불필요**

---

## §16 — PHX-KENNY-007 스마트스토어 패키지 구성 명확화 (2026-11-08)

**핵심 패키지 구성 (Founder 결정):**

| 항목 | 포함 여부 |
|------|---------|
| 케니호텔 객실 1실, 1박, 성인 2인 | ✅ 포함 |
| 여수 해상케이블카 이용권 2인 | ✅ 포함 |
| 여수 유람선 크루즈 이용권 2인 | ✅ 포함 |
| DreamTown 별빛항로 경험 | ✅ 포함 |
| 스토리북 | ❌ 제외 |
| 별씨앗키트·소원그림 | 운영 준비 상태 확인 후 결정 |
| 무여정 여행 안내 | ✅ 포함 (무료) |
| 제휴 확정 지역 쿠폰 | 제휴 확정 여부에 따라 구분 |

**설계 원칙:**
1. 패키지 구매자 전용 혜택(케이블카+크루즈) vs 일반 투숙객 무료 여행 가이드 구분 필수
2. 일반 투숙객이 관광권을 무료 제공받는 것처럼 표현 금지
3. 무여정 Starlight Route 카드에 패키지 포함 사항 정확히 표현 필요 (PHX-KENNY-005 현재 미반영 — 별도 Founder 승인 후 수정)
4. 라마다 가격/공급 조건을 케니호텔에 복사 금지
5. 케니호텔 객실 공급가·크루즈 운항조건·예약·환불 기준: 호텔 제안서 확인 전 미확정

**미확정 항목 (호텔 제안서 확인 필요):**
- 케니호텔 객실 공급가
- 크루즈 운항조건 (미남크루즈 / 한려수도유람선 등)
- 케이블카 단체 예약 조건
- 예약·환불 기준

**스마트스토어 등록 선결 조건 (케니호텔 버전):**
1. 케니호텔 객실 공급 조건 확인
2. 케이블카 + 크루즈 이용권 공급 조건 확인
3. 취소·환불 고객 약관 확정
4. 기존 사이트 수정 권한 확인 (Founder)

---

## §18 — PHX-KENNY-008 한·영 공개 연결 준비 보고 (2026-11-08)

**배포 상태:**
- Production 도메인: `https://app.dailymiracles.kr`
- Production HEAD: `4ebddc4` — PHX-KENNY-003~005 **미포함** (로컬 미커밋)
- `app.dailymiracles.kr/kenny` → **404** (배포 전)

**영어 지원 범위:**
- `/kenny` 한·영 완전 지원 ✅
- `/muyojeong` (무여정 본문) 한국어 전용 ❌ — 채팅 응답 한국어 고정
- `/soul/cable-car` 한국어 전용 ❌ — 1차 범위 제외 (PHX-KENNY-003 Q3)
- 복귀 배너(`← Back to Hotel Kenny`) 영어 ✅

**케니호텔 사이트 연결 설계:**
- 연결 방향: 기존 사이트 CTA → `https://app.dailymiracles.kr/muyojeong?from=kenny&lang=ko|en` (배포 후)
- 복귀 방향(내부): `/kenny?lang=` (현재 구현) → 기존 사이트 URL로 교체 필요 (별도 Founder 승인)

**배포 전 필요 작업:**
1. 미커밋 변경파일 commit → PR → Founder 승인 → main merge
2. Render.com 빌드 완료 확인
3. `app.dailymiracles.kr/kenny` 외부 접근 테스트

---

## §19 — PHX-KENNY-009 무여정 영어 UI 완성 (2026-11-08)

**Founder 결정:** Production 배포 전 무여정 영어 지원 완성 먼저.

### SOUL API 언어 처리 조사 결과
- `soyeowoolService.js` (~3,200줄) 및 `travelGuideService.js`: GPT/OpenAI 호출 없음
- 모든 응답(`message_ko`)은 한국어 하드코딩된 deterministic 규칙 기반
- **SOUL 응답 본문 영어화: 현재 아키텍처에서 불가** — soyeowoolService.js 전체 개편 필요

### MuyojeongHomePage.jsx 영어화 완료 (kennyLang=en 시)

| UI 요소 | 한국어 | 영어 | 상태 |
|---------|--------|------|------|
| 상단 태그 | 무료 여수여행정보 | Free Yeosu Travel Info | ✅ |
| 헤드라인 | 여수가 궁금하면, 그냥 물어보세요. | Curious about Yeosu? Just ask. | ✅ |
| 서브텍스트 | 여수를 잘 아는 여행친구 SOUL이... | SOUL, your Yeosu travel guide... | ✅ |
| 입력 placeholder | 여수에서 궁금한 건 뭐든 물어보세요 | Ask anything about Yeosu | ✅ |
| 추천 칩 레이블 4개 | 부모님/아이/차량/여행코스 | With Parents/With Kids/By Car/Travel Route | ✅ |
| 장소 선택 헤더 | 가고 싶은 곳 골라보기 | Pick Places to Visit | ✅ |
| 지역별 보기 버튼 | 지역별 보기 / 목록으로 ↑ | By Area / List ↑ | ✅ |
| 시간 선택 레이블 | 얼마나 여행하실 건가요? | How long will you travel? | ✅ |
| 빠른 선택 레이블 | 2시간/반나절/하루 | 2 hrs/Half day/Full day | ✅ |
| 직접 입력 placeholder | 직접 입력 | Enter minutes | ✅ |
| 단위 | 분 | min | ✅ |
| CTA 버튼 | 소울이에게 코스 추천받기 → | Get Route from SOUL → | ✅ |
| 로딩 메시지 | SOUL이 여수 여행 정보를 찾고 있어요… | SOUL is finding travel info... | ✅ |
| 에러 메시지 | 한국어 | 영어 | ✅ |
| SOUL 답변 레이블 | SOUL의 답 | SOUL's Answer | ✅ |
| 다시 물어보기 | 다시 물어보기 | Ask Again | ✅ |
| 뱃지 텍스트 3종 | 추천 가능 등 | Recommendable 등 | ✅ |
| 장소 상세 버튼 | 케이블카 자세히 보기 → | View Details → | ✅ |
| 탐색 섹션 | SOUL과 먼저 둘러보기 | Explore with SOUL | ✅ |
| Footer | 한국어 | 영어 | ✅ |
| 복귀 배너 | 케니호텔로 돌아가기 | Back to Hotel Kenny | ✅ |

**한국어 유지 항목 (기술적 제약):**
- SOUL AI 응답 본문 (`message_ko`) — soyeowoolService.js 전체 개편 없이 불가
- 장소 칩 한국어 이름 — query 메시지에 한국어가 필요 (백엔드 한국어 정규식)
- SoulCableCarPage — 1차 범위 제외 (PHX-KENNY-003 Q3 Founder 결정)

**복귀 버튼 URL 변경:**
- 이전: `navigate('/kenny?lang=...')` (내부)
- 변경: `window.location.href = 'https://hotel-kenny-yeosu-starlight-route.sejinlee.chatgpt.site/'` (외부)

**SOUL 응답 lang 안내:** `lang=en` 시 SOUL 답변 레이블 옆 "(Response in Korean)" 표시

**빌드 검증:** `vite build --mode development` → exit code 0, 에러 없음

### 현재 미커밋 상태 (PHX-KENNY-003 ~ 009)
5개 파일 수정 + 2개 신규:
- `dreamtown-frontend/src/pages/KennyHotelPage.jsx` (신규)
- `dreamtown-frontend/src/pages/MuyojeongHomePage.jsx`
- `dreamtown-frontend/src/App.jsx`
- `dreamtown-frontend/src/components/JourneySceneEngine.jsx`
- `server.js`
- `docs/knowledge/KENNY-003-EVIDENCE-V0_1.md` (신규)

**배포 상태:** 로컬만. Production 배포 별도 Founder 승인 필요.

---

## §20 — PHX-KENNY-010 SOUL 여행 안내 본문 영어화 (2026-11-08)

### 아키텍처 결정
- 기존 `soyeowoolService.js` / `travelGuideService.js` 무변경 — `message_ko` 보존
- `services/soulI18n.js` (신규): structured data → `message_en` 생성 함수
- `travelInputRoutes.js`: `lang=en` 요청 시 `generateMessageEn(payload)` 호출 → `message_en` 추가 반환
- 프론트엔드: `kennyLang=en` 시 `message_en` 우선 표시 (없으면 `message_ko` fallback)

### 구현 파일
| 파일 | 변경 |
|------|------|
| `services/soulI18n.js` | 신규 — PLACE_NAME_EN 13개, `generateMessageEn()` |
| `routes/travelInputRoutes.js` | `lang` 수신 + `message_en` 추가 |
| `dreamtown-frontend/src/pages/MuyojeongHomePage.jsx` | API 요청에 `lang` 포함, `message_en` 우선 표시, `langNote` 조건 개선 |
| `dreamtown-frontend/src/components/TravelGuide/CourseDisplay.jsx` | `lang` prop 추가, 영어 블록 텍스트/place 이름 |

### message_en 생성 범위 (status별)
| status | 영어 메시지 |
|--------|------------|
| CITY_UNSUPPORTED | "I'm not yet able to guide you in that area..." |
| MULTI_CITY_PARTIAL | "I can help you plan the Yeosu portion..." |
| CITY_AMBIGUOUS | "Which city would you like to explore first?" |
| PLACE_CONTEXT_REQUIRED | "Could you let me know which place..." |
| NO_RESULT | Situation + "I couldn't find places matching..." |
| PLACE_LOOKUP | "Here's what I know about [place]." |
| JOURNEY_CONTINUITY | "Continuing your Yeosu journey." |
| CLARIFICATION | Situation + "Could you tell me a bit more?..." |
| DISCOVERING | Situation + 영어 place 이름 목록 |
| PARTIAL | Situation + 영어 place 이름 목록 |

### 영어 자유입력 지원 범위 (코드 분석 기반)
| 입력 종류 | 처리 | 영어 응답 |
|---------|------|----------|
| "hello" / "hi" | CLARIFICATION fallback | ✅ 영어 message_en 생성 |
| 추천 칩 (한국어 query 전달) | DISCOVERING/PARTIAL | ✅ 영어 place 이름 + situation |
| 커스텀 코스 (한국어 query 전달) | DISCOVERING + course | ✅ CourseDisplay 영문 렌더 |
| 영어 자유 입력 (일반) | CLARIFICATION (한국어 regex 미매칭) | ✅ 영어 message_en 생성 |
| 영어로 장소 추천 의도 | CLARIFICATION (regex 미매칭) | ⚠️ 추천 목록 없음 — 한국어 입력 필요 |

**영어 자유 입력 제한**: SOUL 엔진의 모든 의도 파악 로직은 한국어 정규식 기반. 영어로 직접 장소를 추천받으려면 한국어로 입력하거나 추천 칩을 사용해야 함.

### 외부 사이트 복귀 언어 유지
- `https://hotel-kenny-yeosu-starlight-route.sejinlee.chatgpt.site/` — ChatGPT Site
- 언어 유지 URL 파라미터 스키마 미확인 → URL 파라미터 임의 추가 금지
- **제한사항**: 무여정에서 외부 사이트로 복귀 시 사이트 언어 상태 보장 불가

### CourseDisplay 영어 렌더 항목
- Place 이름: `PLACE_NAME_EN` 매핑 (13개 place_code)
- Stay time: "X min stay" / 이동: "Transfer · about X min" / 식사: "Lunch/Meal" / 카페: "Café break"
- Summary: "Places / Time at places / Est. total time" + footer notice

### 빌드 검증
`vite build --mode development` → exit code 0, 에러 없음

---

## §17 — Evidence 연결

| 항목 | 위치 |
|------|------|
| Kenny E2E Checkpoint | `memory/project_kenny_e2e_checkpoint.md` |
| 별빛항로 SSOT | `docs/ssot/episodes/SSOT-ROUTE-002_EP01_Experience_Route.md` |
| 커머스 패키지 전략 | `memory/project_commerce_package_strategy.md` |

---

## §21 — PHX-KENNY-011 실제 실행 검증 (2026-11-08)

**검증 환경**: 로컬 Express 서버 port 5100 (PID 19240), 프론트엔드 Vite 빌드 완료

### 시나리오 실제 실행 결과

| 시나리오 | 판정 | 실제 결과 |
|---------|------|----------|
| A: KO 추천 (lang 없음) | **PASS** | Status=SUCCESS, message_ko 정상, message_en 없음 |
| B: lang=en 추천 | **PASS** | Status=SUCCESS, message_en 생성 (place 영문), message_ko 보존 |
| C: 커플 3h 코스 + lang=en | **PASS** | Status=SUCCESS, 4 course blocks, message_en "Traveling as a couple..." |
| D: KO 자유입력 (lang 없음) | **PASS** | Status=PARTIAL, 기존 한국어 동작 완전 보존 |
| E: EN 자유입력 + lang=en | **PASS (한계 명확)** | Status=CLARIFICATION → "Could you tell me a bit more?" 영어 반환 |
| G1: 빈 입력 | **PASS** | HTTP 400 {"error":"질문을 입력해주세요."} |
| G2: 잘못된 hotel_id | **PASS** | HTTP 400 {"error":"INVALID_HOTEL_ID"} |
| H: 모바일 390px KO | **PASS** | 케니호텔 KO UI 레이아웃 정상 |
| H: 모바일 390px EN | **PASS** | 케니호텔 EN UI 레이아웃 정상 |
| 무여정 KO 복귀 배너 | **PASS** | "← 케니호텔로 돌아가기" 표시, 외부 사이트 href 연결 |
| 무여정 EN 복귀 배너 | **PASS** | "← Back to Hotel Kenny" 표시, 외부 사이트 href 연결 |

### 실제 실행 message_en 예시 (Scenario B)
- Input: "케이블카 근처에서 2시간 보낼 곳 추천해줘", lang=en
- Status: SUCCESS, Places: 케이블카, 하멜등대
- message_en: "You have about 2 hours in Yeosu.\nRecommended in Yeosu: Yeosu Cable Car, Hamel Lighthouse."

### 실제 실행 message_en 예시 (Scenario C: couple 3h course)
- Input: "커플로 여수 케이블카 하멜등대 오동도 3시간 코스 짜줘", lang=en, explicit_context={people_type:couple}
- Status: SUCCESS, 4 blocks (hamel_lighthouse→travel→odongdo→cafe)
- message_en: "Traveling as a couple — you have about 3 hours in Yeosu.\nRecommended in Yeosu: Hamel Lighthouse, Odongdo Island."

### 미구현 항목 (별도 Founder 결정)
- 무여정 EN 화면 장소 칩 한국어 표시 — 칩 i18n 미구현 (PHX-KENNY-010 범위 외)

### 스크린샷
- docs/knowledge/screenshots/PHX011-H-mobile-ko.png — 케니호텔 KO
- docs/knowledge/screenshots/PHX011-H-mobile-en.png — 케니호텔 EN
- docs/knowledge/screenshots/PHX011-muyojeong-ko.png — 무여정 KO (복귀 배너)
- docs/knowledge/screenshots/PHX011-muyojeong-en.png — 무여정 EN (복귀 배너)

---

## §22 — PHX-KENNY-014 Production 배포 검증 (2026-11-08)

### PR 병합 확인
- **PR #146 MERGED** b5935c — 2026-11-08T03:02:47Z
- **main HEAD**: b5935c (feat/phx-kenny-003-012-muyojeong-bilingual)

### Render 배포 상태
- **started_at**: 2026-11-02T23:18:16Z — PR merge 이전 버전 실행 중
- **판정**: Render 자동 배포 미트리거 (Auto-Deploy 비활성화 추정)
- **대기 시간**: 10분 polling 후 미완료

### Production URL 실제 테스트

| URL | HTTP | 실제 화면 |
|-----|------|----------|
| pp.dailymiracles.kr/kenny | 200 | ❌ DreamTown 인트로 (구 버전) |
| pp.dailymiracles.kr/kenny?lang=en | 200 | ❌ DreamTown 인트로 (구 버전) |
| pp.dailymiracles.kr/muyojeong?from=kenny&lang=ko | 200 | ✅ 한국어 무여정 (복귀배너 없음 — 구 버전) |
| pp.dailymiracles.kr/muyojeong?from=kenny&lang=en | 200 | ✅ 무여정 로드 (영어 미적용 — 구 버전) |
| /api/health | 200 | ✅ DB 연결됨 |
| /api/dt/identity/bootstrap | 201 | ✅ 정상 |
| /api/dt/travel/input/text (KO) | 200 | ✅ SOUL 응답 정상 |
| /api/dt/travel/input/text (EN) | 200 | message_en 없음 (구 코드) |

### 복구/배포 방법
Render 대시보드 → 서비스 → "Manual Deploy" 또는 Auto-Deploy 활성화 (branch: main)

### 스크린샷
- docs/knowledge/screenshots/PHX014-kenny-ko.png — 구버전 DreamTown 인트로
- docs/knowledge/screenshots/PHX014-muyojeong-plain.png — 무여정 한국어 (기존 정상)

---

## §23 — PHX-KENNY-016 복귀 버튼 lang 파라미터 추가 (2026-11-08)

### 변경 내용

- **파일**: `dreamtown-frontend/src/pages/MuyojeongHomePage.jsx` 1줄 수정
- **Before**: `window.location.href = 'https://hotel-kenny-yeosu-starlight-route.sejinlee.chatgpt.site/'`
- **After**: `window.location.href = \`https://hotel-kenny-yeosu-starlight-route.sejinlee.chatgpt.site/?lang=${kennyLang}\``

### 근거

Founder 검증 완료: 케니호텔 외부 사이트가 `?lang=en`/`?lang=ko` 파라미터를 지원하며 URL 언어가 저장 언어보다 우선.

### 검증 결과

| 시나리오 | 복귀 URL | 결과 |
|---------|---------|------|
| `/muyojeong?from=kenny&lang=ko` → 복귀 | `.../?lang=ko` | PASS ✅ |
| `/muyojeong?from=kenny&lang=en` → 복귀 | `.../?lang=en` | PASS ✅ |
| 빌드 (`npm run build`) | exit 0 | PASS ✅ |
| KO 회귀 (기존 동작) | 무변경 | PASS ✅ |

### Git

- **Commit**: d88b997 (feat/phx-kenny-016-return-lang-param)
- **PR**: #147 — OPEN, Founder 승인 대기
- **main merge**: Founder 승인 후

### 미검증 (알려진 한계)
- Production 미배포 (Render Manual Deploy 필요 — PHX-KENNY-014 §22 참조)
- `from=kenny` 없는 경우 복귀 버튼 미표시 (기존 동작, 변경 없음)

---

## §24 — PHX-MUYOJEONG-020 Zone5 선택불가 안내 + CTA 힌트 (2026-11-08)

### 실제 원인

Zone 5 (소호·장도권 / Soho & Jangdo) 소속 장소 전부 `status: 'verify'`
→ `isSelectablePlace() = false` → 장소 선택 불가 → `routePlaces.length === 0` → `isValid = false` → CTA 버튼 비활성

**한국어·영어 동일 — EN 전용 버그 아님.** KO 테스트가 Zone 1(이순신광장·하멜등대 등 tg_ready) 사용으로 정상이었던 것.

### 수정 내용

| 파일 | 변경 |
|------|------|
| `YeosuMapSelector.jsx` | `MAP_TM.ko.noZonePlaces` + `en.noZonePlaces` 추가. ZoneDetail에 `places.filter(isSelectablePlace).length === 0` 안내 블록 추가. 선택 가능 칩 색상 CSS 변수화(`--soul-chip-text/bg/border`). |
| `MuyojeongHomePage.jsx` | `TM.ko.ctaHint` + `en.ctaHint` 추가. CTA 버튼 아래 `routePlaces.length === 0` 시 힌트 텍스트 표시. |

### 검증 결과 (Puppeteer)

| 시나리오 | 결과 |
|---------|------|
| A: KO Zone5 "이 권역은 아직 코스 추천 장소를 준비 중이에요" 안내 | PASS ✅ |
| B: EN Zone5 "No places are ready for route planning in this zone yet" 안내 | PASS ✅ |
| C: KO CTA 힌트 "장소를 하나 이상 선택해주세요" + disabled | PASS ✅ |
| D: EN CTA 힌트 "Please select at least one place" + disabled | PASS ✅ |
| 빌드 (`npm run build`) | exit 0 ✅ |

### Git

- **Branch**: `feat/phx-muyojeong-020-v2` (main 기반 cherry-pick)
- **Commit**: `3a968e4` (PR #150에서 cherry-pick된 `c253ee0`)
- **PR**: #150 (base: main) — Founder 승인 대기
- **이전 PR #149** (base: feat/phx-muyojeong-018-019-zone-card-i18n) — 020 단독 diff가 아님. PR #150이 clean replacement.

### CI (PR #150)

| 항목 | 결과 |
|------|------|
| AIL Gate | SUCCESS ✅ |
| docker-smoke | SUCCESS ✅ |
| Vercel Preview Comments | SUCCESS ✅ |
| Vercel deploy | FAILURE (Render 프로젝트 기존 패턴, PHX-020 무관) |
| mergeable | MERGEABLE ✅ |

### 미검증 (알려진 한계)
- Production 미배포 (Founder 승인 후 Render Deploy 필요)
- Zone 5 장소 `tg_ready` 승격 미진행 — SSOT 별도 결정 필요

---

## §25 — PHX-COUPON-004 별빛쿠폰 MVP 로컬 구현 (2026-11-09)

### Founder 결정사항

| 항목 | 결정 |
|------|------|
| 공통 PIN | `1234` (env `COUPON_PIN`) |
| 가맹점 seed | 없음 (테스트용 클라이언트 상수만) |
| 고객 URL | `/starlight-coupon?from=kenny&venue={venueId}` |
| 관리자 URL | `/admin/starlight-coupons` |
| 진입점 | 케니호텔 사이트 「별빛혜택」 메뉴 → DreamTown 앱 |
| Production 적용 | Founder 명시 승인 후 migration 215 실행 |

### 구현 파일

| 파일 | 역할 |
|------|------|
| `database/migrations/215_starlight_coupons.sql` | starlight_coupons + starlight_coupon_uses 테이블 (Production 적용 보류) |
| `routes/starlightCouponRoutes.js` | 고객 API — issue/GET/redeem |
| `routes/adminStarlightCouponRoutes.js` | 관리자 API — stats/list |
| `dreamtown-frontend/src/pages/StarlightCouponPage.jsx` | 모바일 쿠폰 화면 |
| `dreamtown-frontend/src/pages/AdminStarlightCouponPage.jsx` | 관리자 대시보드 |
| `server.js` + `App.jsx` | 라우트 등록 |

### Git

- Branch: `feat/phx-coupon-004-starlight-coupon`
- Commit: `74751da`
- PR: #151 OPEN (Founder 검수 대기)

### 빌드

| 항목 | 결과 |
|------|------|
| `npm run build` | ✅ exit 0 (702 modules) |

### Production 활성화 체크리스트

- [ ] Founder 명시 승인
- [ ] Migration 215 실행
- [ ] Render env: `COUPON_PIN`, `COUPON_MAX_ATT`
- [ ] 실제 가맹점 venue_id 확정 및 케니호텔 사이트 연결

---

## §26 — PHX-COUPON-005 보안 검수 수정 (2026-11-09)

### 검수 결과표

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| 1 | PR #151 최소 변경 (main 기준) | ✅ PASS | 7파일 추가만, 삭제 없음 |
| 2 | PIN 서버 검증 | ✅ PASS | `pin !== PIN()` 서버 측 |
| 3 | 동시 중복 사용 방지 | ✅ PASS (수정됨) | UNIQUE 제약 추가 + 409 처리 |
| 4 | PIN 시도 횟수 제한 | ✅ PASS (수정됨) | failed_attempts 컬럼 재설계 |
| 5 | 관리자 키 로그 노출 | ✅ PASS (수정됨) | x-admin-key 헤더 전환 |
| 6 | 인증 없이 조회 불가 | ✅ PASS | adminGuard 양쪽 엔드포인트 |
| 7 | 운영 쿠폰 발급 차단 | ⚠️ ADVISORY | venue 허용목록 미구현 — Founder 결정 필요 |
| 8 | 테스트/운영 분리 | ✅ PASS | test_* prefix 관례 + 클라이언트 상수만 |
| 9 | Migration 215 기존 데이터 무영향 | ✅ PASS | CREATE IF NOT EXISTS, 기존 테이블 무변경 |
| 10 | 조회/사용 건수 구분 | ✅ PASS | viewed_at vs starlight_coupon_uses |

### 수정 내용

**항목 4 — failed_attempts 컬럼 추가 (Critical bug 수정)**
- 기존 로직: `SUM(attempt_count) FROM starlight_coupon_uses` → 실패 시 아무것도 기록 안 해 항상 0 반환
- 수정: `starlight_coupons.failed_attempts INT DEFAULT 0` 추가, 실패마다 atomic `UPDATE ... SET failed_attempts = failed_attempts + 1`

**항목 3 — UNIQUE(coupon_id) 제약 추가**
- `starlight_coupon_uses.coupon_id` UNIQUE 제약 추가 → DB 레벨에서 동시 중복 삽입 차단
- INSERT 실패 시 `code=23505` 또는 UNIQUE 메시지 → 409 반환

**항목 5 — x-admin-key 헤더 전환**
- `AdminStarlightCouponPage.jsx`: `?key=` 쿼리 파라미터 → `x-admin-key` 헤더
- Render access log 및 브라우저 URL에서 키 미노출

### Git

- Commit: `5fbc616`
- PR: #151 (body v2 갱신)
- Build: `npm run build` ✅ exit 0

### 미결 항목 (해소됨)

- **항목 7**: PHX-COUPON-006에서 `COUPON_VENUE_ALLOWLIST` 구현으로 해소

---

## §27 — PHX-COUPON-006+007 venue 허용목록 + 최종 확인 (2026-11-09)

### PHX-COUPON-006 — venue_id 허용목록

**정책:**
- `COUPON_VENUE_ALLOWLIST` env var (comma-separated, 미설정 = 빈 목록 = 전부 차단)
- `test_*` prefix는 `NODE_ENV !== 'production'`에서만 허용
- `kenny_001` 등 호텔 ID는 가맹점이 아니므로 허용목록에 추가하지 않음
- 최초 운영 시 `COUPON_VENUE_ALLOWLIST` 비워둠 (제휴 식당·카페 0곳)

**구현:** `routes/starlightCouponRoutes.js` `isVenueAllowed()` — POST /issue만 적용
**단위 검증:** 8/8 PASS
**Commit:** `23042ed`

### PHX-COUPON-007 — 배포 준비 최종 확인

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 1 | 허용목록 비어 있을 때 발급 전부 차단 | ✅ PASS | `[]`.includes → false. test_* production 차단 |
| 2 | Migration 215 미적용 시 기존 기능 정상 | ✅ PASS | try/catch 로드 + 조건부 등록. 쿠폰 API만 500 |
| 3 | PR 병합+배포 시 기존 Production 무영향 | ✅ PASS | 추가만, 기존 테이블 무변경 |
| 4 | 고객에게 ADMIN_API_KEY 미노출 | ✅ PASS | x-admin-key 헤더, 번들 미포함, sessionStorage |
| 5 | 기존 쿠폰 사용 무영향 | ✅ PASS | isVenueAllowed() POST /issue만 적용 |

**추가 버그 발견 및 수정:**
`adminStarlightCouponRoutes.js /list` 쿼리 — `u.attempt_count`(미존재) → `c.failed_attempts` 교체.
Migration 215 적용 후 관리자 목록 조회 SQL 오류 사전 차단.
**Commit:** `3d1ce0e`

**최종 상태: Founder 승인 대기. 코드 변경 완료.**

### Git (§27 범위)
- Commit `23042ed`: PHX-COUPON-006 venue 허용목록
- Commit `3d1ce0e`: PHX-COUPON-007 attempt_count 버그 수정
- PR #151: 최신 HEAD `3d1ce0e`

### Production 활성화 체크리스트 (최종)
- [ ] Founder 명시 승인
- [ ] Migration 215 실행
- [ ] Render env: `COUPON_PIN` (기본 1234), `COUPON_MAX_ATT` (기본 5), `COUPON_VENUE_ALLOWLIST` (최초 비워둠)
- [ ] 제휴 식당·카페 venue_id 확정 후 `COUPON_VENUE_ALLOWLIST` 추가
- [ ] 케니호텔 사이트 `별빛혜택` 메뉴 → `/starlight-coupon?from=kenny&venue={id}` 연결

---

## §28 — PHX-COUPON-008 GitHub CI 검사 실패 확인 (2026-11-09)

### 실패 체크 분류

| 체크 | 결과 | 분류 | 근거 |
|------|------|------|------|
| AIL Gate | ❌ FAIL → ✅ PASS | **신규 문제 → 수정 완료** | PR body Write 시 `[AIL]` 라인 제거됨. body 갱신으로 해소 |
| Vercel – daily-miracles-app | ❌ FAIL | **기존 pre-existing 문제** | PR #148(병합됨)에서도 동일 FAILURE 확인 |
| Vercel – daily-miracles-app-21z3 | ❌ FAIL | **기존 pre-existing 문제** | PR #148(병합됨)에서도 동일 FAILURE 확인 |
| Verify Manifest & Index | ✅ PASS | — | — |
| docker-smoke | ✅ PASS | — | — |
| Vercel Preview Comments | ✅ PASS | — | — |

### AIL Gate 실패 원인 (신규)

PR body `Write` 호출 시 `[AIL]` 라인이 제거됨. Gate 조건: `[AIL]` 섹션 또는 ` ```ail ` 코드블록 필수.
수정: `[AIL] PHX-COUPON-004~007 별빛쿠폰 MVP ... · Source: PHX-COUPON-004` 라인 추가 → body `gh pr edit`로 업데이트.
재실행 결과: ✅ PASS (run 42558373717)

### Vercel 실패 원인 (기존)

PR #148, #150 모두 Vercel FAIL 상태에서 병합됨. Required 체크 아님(병합 blocking 아님).
Render Production과 무관 (별도 배포 경로). 이번 PR에서 새로 발생한 문제 아님.

### 최종 CI 상태

| Required | 결과 |
|----------|------|
| AIL Gate | ✅ PASS |
| Vercel | ❌ FAIL (기존 문제, non-required) |

**병합 가능 조건 충족. Founder 승인만 대기.**

---

## §29 — PHX-COUPON-010 운영 기반 준비 (2026-11-09)

### 작업 결과

| 단계 | 결과 | 상세 |
|------|------|------|
| 1. Render Live SHA 확인 | ✅ | `started_at: 2026-11-08T08:08:52Z` — PR #151 미반영 (2026-11-08 버전) |
| 2. Migration 215 적용 전 상태 | ✅ | 테이블 없음 확인. 기존 public 테이블 254개 |
| 3. Migration 215 실행 | ✅ APPLIED | starlight_coupons + starlight_coupon_uses + 인덱스 4개 생성. 기존 →256개 (+2) |
| 4. Render env 설정 | ⏳ 대기 | RENDER_API_KEY 없음 → 대시보드 직접 필요 |
| 5. 관리자 API + 화면 인증 검증 | ✅ | 18/18 PASS (운영 DB) |
| 6. 발급 차단 검증 (venue 0곳) | ✅ | COUPON_VENUE_ALLOWLIST 미설정 → 모든 venue 차단 확인 |
| 7. 기존 운영 서비스 정상 | ✅ | /api/health 200, /api/dt/stars 400(정상), 쿠폰 404(라우트 미배포) |

### Migration 215 적용 결과

```
starlight_coupons: 생성 ✅
starlight_coupon_uses: 생성 ✅  (UNIQUE(coupon_id) 제약 포함)
failed_attempts: INT DEFAULT 0 ✅
attempt_count: 없음 ✅ (PHX-COUPON-005에서 설계 제거됨)
인덱스: idx_starlight_coupons_hotel_venue + idx_starlight_coupon_uses_coupon_id + idx_starlight_coupon_uses_venue_date ✅
```

### 검증 스크립트 결과 (verify_coupon_api.js, 운영 DB, ROLLBACK)

```
[A] 발급 차단: 3/3 PASS (kenny_001·test_jokbal·임의 venue 차단)
[B] 스키마: 7/7 PASS (컬럼·UNIQUE 제약)
[C] 흐름: 7/7 PASS (INSERT→조회→PIN실패→사용→UNIQUE차단, ROLLBACK)
[D] 기존: 1/1 PASS (wish_entries 무영향)
합계: 18/18 PASS
```

### 잔여 작업 (Render 대시보드 직접)

```
1. Environment Variables 추가:
   COUPON_PIN = 1234
   COUPON_MAX_ATT = 5
   (COUPON_VENUE_ALLOWLIST 추가하지 않음 → 발급 전부 차단)
2. Manual Deploy → main HEAD 348b9aa
```

---

## §30 — PHX-COUPON-012+013 getDb 버그 수정 + Production 최종 검증 (2026-11-09)

### 작업 요약

**PHX-COUPON-012**: `database/db.js`는 `{ query, pool }`만 export — `getDb` 함수 미존재.
두 쿠폰 라우트 파일에서 `const { getDb } = require('../database/db')` → `getDb = undefined`.
GET /:id, POST /:id/redeem 에서 `getDb()` 호출 → TypeError → catch → 500.
POST /issue는 `isVenueAllowed(403)` 선반환으로 미노출. Admin 엔드포인트는 `adminGuard(401)` 선반환으로 미노출.

**수정**: `const db = require('../database/db')` + `db.query()` 직접 사용. SQLite 분기 제거.
Build ✅. Commit `2f7ad6b`. PR #152 → main 병합.

**Founder 배포**: PR #152 병합 + Render Manual Deploy `decf6ac` — 2026-11-09 14:37 KST.

### PHX-COUPON-013 Production 검증 결과

Render 현황:
```
started_at: 2026-11-09T05:37:11.342Z  (= 14:37:11 KST ✅)
pid: 81 (신규 프로세스 — 이전 배포 pid:82와 상이)
database: 연결됨, db_response_ms: 2ms
```

| # | 항목 | 결과 | 상세 |
|---|------|------|------|
| 1 | /api/health | ✅ 200 | started_at 14:37 KST 확인, DB 연결됨 |
| 2 | 고객 화면 SPA | ✅ 200 HTML | `/starlight-coupon?from=kenny&venue=kenny_001` → index.html 1661B 반환 |
| 3 | GET /:id — 500→404 수정 확인 | ✅ **404** | `{"ok":false,"error":"쿠폰을 찾을 수 없습니다."}` — getDb TypeError 없음 |
| 4 | POST /:id/redeem — DB 연결 확인 | ✅ **404** | `00000000-0000-0000-0000-000000000000` → 404 (DB 조회 도달, 500 아님) |
| 5 | POST /issue 허용목록 차단 | ✅ **403** | `kenny_001` venue → `{"ok":false,"error":"승인되지 않은 가맹점입니다."}` |
| 6 | 관리자 API 인증 없는 접근 차단 | ✅ **401** | 헤더 없이 `/api/admin/starlight-coupons/stats` → 401 |
| 7 | ADMIN_API_KEY 설정 여부 | ✅ **401** | 잘못된 key → 401 (503이 아님 → env 설정됨 확인) |
| 8 | 기존 기능 회귀 없음 | ✅ | muyojeong/places 404 (파라미터 필요, 정상) / dt/stars 400 (파라미터 필요, 정상) |

**8/8 PASS**

### 비고

- 항목 7: 실제 관리자 대시보드 화면은 `ADMIN_API_KEY` 없이 검증 불가 → 인증 가드 동작으로 대체 확인
- 항목 4: 실제 쿠폰 ID 없이 PIN redeem 흐름 전체는 불가 → DB 연결 도달 확인으로 대체
- `muyojeong/places` 404 / `dt/stars` 400: PHX-COUPON-012 이전과 동일 — 회귀 아님

### 최종 상태: PHX-COUPON-004~013 COMPLETE

별빛쿠폰 MVP Production 활성화 완료.
초기 운영 조건: 가맹점 허용목록 0곳 → 고객 발급 차단 / 관리자 조회 가능 (key 보유자)

---

## §31 — PHX-STATE-001 / PHX-STAR-002 소원별 URL 충돌 정정 (2026-11-09)

### PHX-STAR-001 감사 결론 (기존)

> "케니호텔 권장 URL: `https://app.dailymiracles.kr/`"

근거: `App.jsx` Route `/` = `AppLaunch` → 소원별 시작 화면

### PHX-STAR-002 — Founder 모바일 검증 결과 (충돌)

> "Founder 실제 모바일 검증 결과 DreamTown 소원별 시작 화면이 아닌 초기 Daily Miracles 랜딩페이지로 확인됨"

### 충돌 원인 분석

**서버 동일성**: `app.dailymiracles.kr/api/health` → `pid:81, started_at:2026-11-09T05:37:11Z` = Render 동일 서버 ✅

**AppLaunch 분기 로직** (`AppLaunch.jsx` 240-284행):

```
방문 시 localStorage 상태에 따른 분기:
  ├─ readSavedStar() ≠ null  → navigate('/my-star/:id', replace)   ← 기존 별 보유자
  └─ readSavedStar() = null
       ├─ dt_intro_seen = today() → scene='landing'               ← 오늘 이미 본 경우
       └─ 최초 방문                → scene='intro' → 'aurum' → 'cablecar' → 'landing'
```

**LandingScene** (142-237행):
- 배경: 케이블카 이미지, 다크 스카이
- 텍스트: "지금, 당신의 소원이 별이 되는 순간"
- CTA: "내 소원 남기기 ✦" → `navigate('/wish')`
- HTML `<title>`: **"하루하루의 기적 - 당신의 소원을 현실로"** (Daily Miracles 원본 타이틀)

**결론**: `app.dailymiracles.kr/` 는 AppLaunch를 서빙하나, Founder가 본 화면은 아래 중 하나:
- 기존 별 보유 → `/my-star/:id` 자동이동 → 소원별이 아닌 MyStar 화면
- 또는 LandingScene 자체가 "Daily Miracles 랜딩페이지" 브랜딩처럼 보임 (타이틀 "하루하루의 기적")

### 확인된 실제 고객 흐름

```
app.dailymiracles.kr/ (신규 방문, 별 없음):
  → AppLaunch → 인트로 애니메이션 → LandingScene
  → "내 소원 남기기 ✦" 버튼 클릭 → /wish (WishGate)
  → /star-birth → /my-star/:id

app.dailymiracles.kr/wish (직접 진입):
  → WishGate (소원 입력 화면) — AppLaunch 상태 로직 우회
  → /star-birth → /my-star/:id
```

### 케니호텔 연결 URL 상태

| URL | 상태 | 비고 |
|-----|------|------|
| `https://app.dailymiracles.kr/` | ❌ UNCONFIRMED | Founder 모바일 검증에서 Daily Miracles 랜딩으로 판단 |
| `https://app.dailymiracles.kr/wish` | ⚠️ CANDIDATE | AppLaunch 상태 우회, WishGate 직접 진입 — Founder 검증 미실시 |

**케니호텔 연결 URL: Founder 결정 대기. 추가 개발·배포 없음.**

---

## §32 — PHX-STAR-004 소원꿈터 /checkin 조사 (2026-11-09)

### 1. GitHub Repository 및 배포 현황

| 항목 | 내용 |
|------|------|
| Repository | `github.com/ys6448761-hue/sowon-dreamtown` |
| Local path | `C:\DEV\sowon-dreamtown` |
| Production URL | `https://sowon-dream-plaza.onrender.com` |
| 기술 스택 | Next.js App Router + Prisma 6 + PostgreSQL (`sowon_plaza` on Render) |
| 배포 | Render.com (Node runtime, free plan, oregon region) |
| DB | Render PostgreSQL 별도 (`sowon-dream-plaza-db`, basic-256mb) |
| 스토리지 | Cloudflare R2 (private bucket — 고객 사진 + 소원그림) |
| /checkin 응답 | `HTTP 200 text/html` — Next.js SPA, 타이틀: "소원꿈터" |

최근 커밋 (2026-11-09 기준):
- `99dc385` docs: update project state after wishart routing repairs
- `d9bf2ba` fix(wishart): return revealed artwork to my star
- `6468089` fix(checkin): add camera capture and optimize photo uploads

### 2. /checkin 고객 경험 (7단계)

```
Step 1  → "DreamTown Check-in" 환영 — "우주민 등록 시작하기"
Step 2  → 이름 입력 + 연락처(선택)
Step 3  → 정면사진 선택 (카메라 직접 촬영 or 사진첩, canvas 최적화 포함)
Step 4  → 소원 작성 (최대 200자)
Step 5  → 소원 확인 → "내 소원을 별에 담기"
Step 6  → 완료 — "{이름}님의 별이 태어났습니다." + "소원그림 보러 가기" → /my-star
Step 7  → Resume 흐름 (소원그림 pending/generating/ready/failed/revealed 상태 분기)
```

**재방문 처리**: `dt_guest_token` 쿠키(httpOnly, 90일) + `/api/dt/me/star` 조회 → 기존 별 resume

### 3. 소원그림 생성·발급 연결

```
POST /api/checkin 완료
  → runWishartGeneration(starId, buffer, wish, mimeType)
     → interpretPhoto()      ← OpenAI Vision 사진 해석
     → buildWishartPrompt()  ← 프롬프트 구성
     → generateWishartFromPhoto()  ← DALL-E 생성
     → uploadToR2(r2Key, ...)      ← Cloudflare R2 (private)
     → DtStar.wishImageStatus: "generating" → "ready"
```

소원그림 엔진: `C:\DEV\sowon-dreamtown\src\lib\wishart\` (Node.js 자체 구현)
**dreamtown-wishart (Python FastAPI)와 별개 시스템.**

### 4. 소원별 자동 생성 여부

**자동**: 체크인 완료 순간 `DtStar` 자동 생성. 별도 소원별 만들기 불필요.
체크인 = 별 생성 = 소원 등록 = 소원그림 생성 의뢰가 하나의 흐름.

### 5. 소원꿈터 '내 별'과 daily-miracles-mvp /my-star/:id 비교

| 비교 항목 | 소원꿈터 (sowon-dreamtown) | daily-miracles-mvp |
|-----------|---------------------------|---------------------|
| DB | PostgreSQL `sowon_plaza` (Render, 별도) | PostgreSQL Supabase |
| 별 모델 | `DtStar` + `DtGuestIdentity` | `wish_entries`, `sowon_profiles` |
| 사진 | Cloudflare R2 (private) | 없음 (wish 텍스트 기반) |
| 소원그림 | 자체 wishart 엔진 (Node.js) | dreamtown-wishart (Python) |
| URL | `sowon-dream-plaza.onrender.com` | `app.dailymiracles.kr` |
| localStorage | `dt_active_star_id` (sowon-dreamtown 도메인) | `dt_active_star_id` (app.dailymiracles.kr 도메인) |
| 충돌 | **없음** — 도메인 분리로 localStorage 격리 |

**완전히 별개 시스템.** 소원꿈터의 별 ID는 daily-miracles-mvp에서 무효.

### 6. 동일 고객 식별 및 재방문 구조

- `dt_guest_token` 쿠키 (httpOnly, sameSite=lax, 90일)
- 쿠키 → `DtGuestIdentity.tokenHash` 조회 → 유효하면 기존 `DtStar` resume
- 재방문 URL: `/checkin?starId={id}` 또는 쿠키 자동 복구
- `/my-star` → localStorage `dt_active_star_id` 기반 복귀

### 7. 별씨앗 키트 QR 목적지

- 소원꿈터 `/checkin` = 호텔 현장 체크인(우주민 등록) QR 전용
- daily-miracles-mvp의 `/entry?loc=cablecar` (별씨앗 공유)와 별개 흐름
- **별씨앗 키트 QR 목적지와의 일치 여부**: sowon-dreamtown과 daily-miracles-mvp의 별씨앗 QR 체계가 별개임을 확인. 호텔 체크인 QR = `sowon-dream-plaza.onrender.com/checkin` 단독.

### 핵심 결론

1. **소원꿈터(`sowon-dream-plaza.onrender.com`)** = 호텔 현장 QR 체크인 전용 시스템 (별 자동 생성 + 소원그림)
2. **daily-miracles-mvp(`app.dailymiracles.kr`)** = 소원별 + SOUL 여행 안내 + 별빛쿠폰 등 메인 플랫폼
3. **두 시스템은 완전 독립**. 연결 없음.
4. 케니호텔 손님이 `/checkin` 체크인 완료 시 → 소원별 자동 생성 ✅ (별도 행동 불필요)
5. 케니호텔 손님이 `app.dailymiracles.kr/wish`로 진입 시 → 소원 입력 직접 필요, 소원그림 없음


---

## §33 — PHX-STAR-009 조사 결과 (2026-11-09)

### 1. '이 마음 나누기' 버튼이 카카오 로그인을 요구하는 이유

StarBirth.jsx:386-422 handleKakaoShare() 함수 조사 결과:
- **카카오 로그인 요구 아님** — Kakao SDK Share.sendDefault() 호출 (소셜 로그인 아님)
- Kakao SDK는 카카오 앱이 설치된 경우 공유 다이얼로그만 띄움
- **Founder가 본 로그인 화면** = 카카오 계정이 없거나 카카오 앱이 미로그인 상태일 때 SDK가 카카오 계정 로그인 요청 — 의도된 동작이 아닌 카카오 SDK 자체 동작
- 계정 없는 고객은 fallback 동작: 
avigator.share() (네이티브 공유) → 
avigator.clipboard.writeText() (링크 복사) 순서

**공유 링크 목적지**: https://app.dailymiracles.kr/entry?from=share&star={starId} → 초대장 UX (/dreamtown?entry=invite)

### 2. 로그인 후 원래 소원별로 복귀 여부

별 복귀는 **로그인이 아닌 localStorage 기반**:
- saveStarId(star.star_id) → localStorage.dt_active_star_id 에 저장 (StarBirth.jsx 흐름)
- 카카오 공유 성공/실패 후 별 복귀는 무관 — 조용히 간직하기 버튼 → 
av('/my-star/') 직접 이동
- 카카오 로그인 완료 후 /entry?from=share&star={starId}로 복귀하더라도 그것은 **공유받은 타인**의 접속 경로

### 3. 로그인 없이 별들의 광장 둘러보기 경로

DreamTown.jsx 조사 결과:
- **pp.dailymiracles.kr/dreamtown** = 로그인 없이 접근 가능한 공개 입구
- eadSavedStar() 호출하지만 null 반환 (PUBLIC_ROUTES 처리) → 자동 복귀 없음
- '직접 진입' 시: 용궁 비주얼 → "내 소원 남기기 ✦" → /wish (소원 입력 경로)
- ?entry=invite 파라미터 시: InviteIntro → WishInputScreen (소원 입력 경로)
- **별들의 광장 조회 기능**: AllStars.jsx (/stars) — 로그인 불필요
- **결론**: 별들의 광장은 로그인 없이 둘러볼 수 있음. 단, URL을 알아야 함.

### 4. 호텔 고객에게 로그인 필수/선택 구분

| 기능 | 로그인 필요 여부 | 비고 |
|---|---|---|
| 소원별 만들기 (/wish/input) | 불필요 | userId = localStorage.getItem('dt_user_id') 자동생성 |
| 내 별 보기 (/my-star/:id) | 불필요 | starId = localStorage, UUID |
| 카카오 공유 ('이 마음 나누기') | 카카오 계정 필요 | SDK 동작, 없으면 링크 복사 fallback |
| 별들의 광장 조회 (/dreamtown) | 불필요 | 공개 입구 |
| SOUL 여행 추천 (/muyojeong) | 불필요 | starId 필요 |
| 별빛쿠폰 조회 (/starlight-coupon) | 불필요 | 쿠폰 UUID로 직접 접근 |

**호텔 고객은 로그인 없이 핵심 기능 전부 사용 가능**.

### 5. 로그인 없이 간직한 고객의 재방문 시 별 찾기

재방문 메커니즘: AppLaunch.jsx → eadSavedStar() → localStorage.dt_active_star_id 조회
- **같은 기기·브라우저**: localStorage 유지 → pp.dailymiracles.kr/ 진입 시 /my-star/:id 자동 이동 ✅
- **다른 기기 또는 브라우저 초기화**: localStorage 없음 → 별을 찾을 방법 없음 ❌
  - 단, starId를 URL에 포함한 공유 링크(/entry?from=share&star={starId})를 본인이 저장했다면 직접 접근 가능
  - 카카오 공유 완료 후 카카오톡 대화방에 링크 남아있어 재접근 가능

**취약 시나리오**: 호텔 고객이 '조용히 간직하기'만 선택(공유 없음) + 다른 기기 사용 시 → 별 재접근 불가.
**현재 시스템에 SMS/이메일 별 복구 기능 없음** (전화번호 선택 입력이지만 별 복구 용도 아님 — SMS는 D7/D30/D90 추적 전용).

### 핵심 결론

1. '이 마음 나누기' = Kakao Share SDK 호출. 계정 로그인 요구는 카카오 측 동작 (설계 의도 아님).
2. 로그인 필수 기능 없음. 별 생성~조회 전 과정 비회원 가능.
3. 별들의 광장: pp.dailymiracles.kr/dreamtown 로그인 불필요.
4. 재방문 별 찾기: 같은 기기·브라우저 기준 localStorage 자동 복귀. 기기 변경 시 취약.

---

## §34 — PHX-WISHART-001 소원그림 접근 제어 조사 결과 (2026-11-09)

### 1. 현재 /checkin 접근 제어 현황

**결론: 누구나 접근 가능. 접근 제어 없음.**

- sowon-dreamtown/src/middleware.ts: 경로 정규화 + ?entry=invite 리다이렉트만 처리. /checkin 접근 제한 없음.
- CheckinPageContent.tsx: 이름+연락처+사진+소원 입력만 요구. 구매 증명, 토큰, PIN 없음.
- POST /api/checkin (route.ts): 입력값 유효성 검사(이름/사진/소원 존재 여부)만 수행. 이용 자격 검사 없음.
- /checkin?mode=new: URL 파라미터로 신규 별 생성 강제 가능.

### 2. 별빛항로 구매 고객 확인 코드·토큰·이용권 연결 여부

**결론: 연결 없음. 두 시스템은 완전히 별개.**

- daily-miracles-mvp/routes/benefitCredentialRoutes.js: 케이블카/유람선/요트 등 레저 이용권 시스템. wishart, wish_image, 소원그림 관련 코드 없음.
- sowon-dreamtown 전체: enefit_credential 패턴 grep 결과 0건.
- 두 시스템 간 공유 토큰, 공유 DB, API 호출 연결 없음.

### 3. 소원그림 생성 API 이용 자격 검사 여부

**결론: 없음. 단, 소유권 검사는 있음.**

- 생성: POST /api/checkin → unWishartGeneration() fire-and-forget. 자격 검사 없음, 체크인 완료 시 무조건 실행.
- 재시도: POST /api/dt/wishart/retry (route.ts): dt_guest_token 쿠키 → guestIdentityId 소유권 검사 ✅ (본인 별만 재시도 가능). 이용 자격 검사는 없음.
- daily-miracles-mvp의 wishImageRoutes.js: 별도 소원그림 API (별씨앗 QR 체험용, wish_entries 기반). 접근 제어 없음.

### 4. 기존 benefit_credentials와 소원그림 실제 연결 여부

**결론: 연결 없음.**

- enefit_credentials = DreamTown 레저 이용권(케이블카, 유람선 등). 소원그림(소원꿈터 체크인)과 별개 시스템.
- 코드 수준 연결: 양방향 grep 모두 0건.

### 5. 이용권당 생성 횟수 및 중복 방지 기능

**소유권 기반 중복 방지(1인 1별)는 있음. 이용권 기반은 없음.**

- 중복 방지: dt_guest_token 쿠키(httpOnly, 90일) → DtGuestIdentity.tokenHash UNIQUE. 동일 토큰으로 재진입 시 기존 별 복귀 (isResuming: true).
- 예외: AI 생성 완료(eady/evealed) 상태의 별은 동일 쿠키로 신규 별 생성 허용 (all through).
- ?mode=new URL 파라미터: 기존 별 resume을 건너뛰고 신규 체크인 강제. 접근 제한 없음.
- 이용권 기반 사용 횟수 제한: 없음.

### 6. 미리보기(일반) vs 제작(구매) 구분 가능성

**현재 구현: 없음. 모든 방문객이 완전한 소원그림 제작 가능.**

- 접근 계층화(preview/full) 코드 없음.
- 소원꿈터 미들웨어에 경로별 접근 제어 추가 시 최소 수정 가능하나, 현재는 미구현.

### 7. 기존 QR 재인쇄 없이 운영 가능 여부

**YES — URL 기반 접근 제어 추가로 재인쇄 불필요.**

- 기존 QR 목적지: sowon-dream-plaza.onrender.com/checkin
- 접근 제어 추가 방법 (코드 변경 없이): Render 환경변수 + middleware.ts에 URL-based guard 추가
  - 옵션 A: ?token=1회용_구매확인토큰 파라미터 → middleware에서 검증 (토큰 발급 시스템 필요)
  - 옵션 B: ?venue=kenny_hotel 파라미터 → middleware에서 허용목록 확인 (env var CHECKIN_VENUE_ALLOWLIST)
  - 옵션 C: 별빛쿠폰 ID ?coupon={id} 파라미터 → daily-miracles-mvp의 starlight_coupons 테이블 조회 (두 시스템 연결 필요)
- 기존 QR에 파라미터 없으면 별도 QR 인쇄 필요. ?venue=kenny_hotel 추가한 새 QR은 1회 인쇄.

### 무단 이용 위험 수준

**현재: HIGH**
- URL 직접 입력으로 누구나 소원그림 체험 가능
- OPENAI API 비용: 체크인 1건당 Vision(.01~0.05) + DALL-E 3(.04) ≈ .05~0.10
- 대량 무단 이용 시 API 비용 불통제

### 최소 수정안 (코드 변경 최소, 재인쇄 최소)

**venue_allowlist 방식 (추천):**
1. sowon-dreamtown/src/middleware.ts에 /checkin 경로 가드 추가 — ?venue= 파라미터 없으면 접근 차단
2. Render 환경변수 CHECKIN_VENUE_ALLOWLIST=kenny_hotel 설정
3. 케니호텔에 sowon-dream-plaza.onrender.com/checkin?venue=kenny_hotel QR 1회 인쇄
4. 기존 /checkin QR(파라미터 없음)은 차단됨 → 운영 중이던 고객에게 영향 없도록 grace period 필요

**단, 이번 작업은 조사만. Production 수정 금지.**

---

## §35 — PHX-WISHART-003 소원그림 구매자 전용 정책 — 최소 구현 설계 (2026-11-09)

### Founder 확정 정책 (2026-11-09)

- 소원그림 AI 제작: 별빛항로 패키지 구매자 전용
- 무여정·소원별 만들기: 무료 공개 유지
- 기존 생성 고객: 결과물 재방문 유지
- 별빛쿠폰(식당 혜택)과 소원그림 이용권: 분리 운영

### 현황 제약 조건 재확인

| 조건 | 현황 |
|---|---|
| 기존 QR URL | sowon-dream-plaza.onrender.com/checkin (파라미터 없음) |
| 기존 체크인 완료 고객 | dt_guest_token 쿠키 보유, shouldResume 경로로 접근 |
| 별빛쿠폰 venue allowlist | 0곳 (고객 발급 불가 상태) |
| 별빛쿠폰 PIN | 1234 (소원그림에 재사용 금지) |
| 스키마 migration | Prisma → 
px prisma migrate deploy (Render 배포 시 자동) |

### 선택: Option A — WISHART_ACCESS_PIN (공유 코드)

**이유**: QR 재인쇄 불필요, 코드 변경 최소, DB migration 없음, 파일럿(20인 규모) 적합.

#### 구현 범위

**변경 파일 2개 (sowon-dreamtown 한정):**

1. **src/app/api/checkin/route.ts** — POST 핸들러
   `
   기존 흐름: shouldResume 판단 → (신규) R2 업로드 → 별 생성 → wishart 실행
   변경 흐름: shouldResume 판단 → (신규) [★ PIN 검증] → R2 업로드 → 별 생성 → wishart 실행
   `
   - shouldResume = true 경로: PIN 검증 건너뜀 (기존 고객 보호)
   - 신규 별 생성 경로: orm.get('accessPin') vs process.env.WISHART_ACCESS_PIN 대조
   - WISHART_ACCESS_PIN 미설정 → 503 "generation disabled"
   - PIN 불일치 → 403 "access denied"
   - R2 업로드는 PIN 검증 통과 후 실행 (비용 절감)

2. **src/app/checkin/CheckinPageContent.tsx** — Step 1 UI
   - 기존 esumeStarId 있는 경우 (쿠키 보유): PIN 화면 없음 (Step 7로 자동 이동)
   - 신규 고객: Step 1(환영) 이후 → "패키지 확인 코드" 입력 화면 추가 (Step 1.5)
   - handleSubmit() FormData에 ccessPin 필드 추가
   - ?mode=new 경로: PIN 화면 표시 (기존 별 없는 신규와 동일)

**환경변수 (Render 대시보드):**
- WISHART_ACCESS_PIN=<Founder가 직접 설정> (1234와 다른 값)

**변경하지 않는 파일:**
- src/app/api/dt/wishart/retry/route.ts: dt_guest_token 쿠키 소유권 검사로 충분 (이미 별을 가진 고객만 재시도)
- Prisma schema: 변경 없음, migration 없음
- /checkin URL: 변경 없음, QR 재인쇄 불필요

#### 한계 및 업그레이드 경로

| 한계 | 대응 |
|---|---|
| 공유 PIN (모든 고객 동일) → 유출 시 전체 노출 | Founder가 PIN 주기적 변경. 파일럿 규모 수용. |
| 동일 PIN으로 다른 기기 무제한 재사용 가능 | ?mode=new 경로도 PIN 필요. 기기별 쿠키 중복 방지는 유지. |
| 1인 1사용 개별 감사 추적 없음 | Phase 2: 쿠폰 UUID 연동 (Option B)으로 업그레이드 |

#### Option B — 별빛쿠폰 UUID 연동 (Phase 2 업그레이드 경로)

별빛항로 패키지에 starlight_coupon UUID 카드 동봉 → 체크인 시 UUID 입력 → sowon-dreamtown → pp.dailymiracles.kr/api/starlight-coupon/{id} 조회 → isActive/not_used 확인 → 소원그림 완료 후 redeem.

**선결 조건**: 별빛쿠폰 venue allowlist 활성화 (kenny_hotel 가맹점 등록) → 현재 불가.

### 고객 경험 흐름 (변경 후)

`
신규 고객:
/checkin → Step 1(환영) → Step 1.5(패키지 코드 입력) → Step 2(이름) → Step 3(사진) → Step 4(소원) → Step 5(확인) → 소원그림 생성

기존 고객(쿠키 보유):
/checkin → 쿠키 감지 → shouldResume → 기존 별 화면 (PIN 없음)

?mode=new:
/checkin?mode=new → Step 1(환영) → Step 1.5(패키지 코드 입력) → ...
`

### 구현 준비 체크리스트 (Production 반영 전)

- [ ] Founder가 WISHART_ACCESS_PIN 값 결정 (1234 외 4~8자리)
- [ ] 케니호텔 프런트 직원 코드 전달 방법 결정 (구두? 카드? 패키지 동봉?)
- [ ] 기존 체크인 고객 없는 경우 확인 (쿠키 보유자 없으면 grace period 불필요)
- [ ] 로컬 테스트 → 별 생성 E2E 확인
- [ ] Render 환경변수 설정 → Manual Deploy

---

## §37 — PHX-WISHART-006 "내 소원별 만나기" 버튼 연결 수정 (2026-11-10)

### 버그 원인

`sowon-dreamtown/src/app/checkin/CheckinPageContent.tsx` Step 7 "revealed" 상태 (line 743):
```tsx
// Before (bug):
onClick={() => router.push("/my-star")}
// 텍스트: "내 소원별 만나기"
// 결과: sowon-dreamtown 내 /my-star → 소원그림 다시 보기 (소원꿈터 별)
```

`/my-star`는 sowon-dreamtown 자체 라우트로, 소원그림(wishImageUrl) 화면을 보여줌. DreamTown 소원별이 아님.

### 수정

```tsx
// After:
<a href="https://app.dailymiracles.kr/wish/input" ...>
  내 소원별 만나기
</a>
```

button→a 태그로 교체하여 외부 도메인 이동. 나머지 `/my-star` 버튼 3개는 소원꿈터 내 화면 이동으로 보존:
- Step 6 "소원그림 보러 가기" → `/my-star` 유지
- Step 7 "ready" → "하멜등대에서 만날게요" → `/my-star` 유지
- Step 7 "failed" → "내 소원별 보기" → `/my-star` 유지

### 검증
- Build: sowon-dreamtown `npm run build` / TypeScript `tsc --noEmit` 실행 중
- Production 반영: PR + Render Deploy 필요

---

## §38 — PHX-STAR-010 /star-entry 스마트 진입 경로 (2026-11-10)

### 구현

**신규 파일** `dreamtown-frontend/src/pages/StarEntry.jsx`:
```jsx
// readSavedStar() 재사용: localStorage.dt_active_star_id 체크
// starId 있음 → /my-star/:id (기존 별 복귀)
// 없음 → /wish/input (새 별 만들기)
```

**App.jsx 수정**: `/star-entry` 라우트 추가 (line ~128)

**케니호텔 사이트 연결 URL** (외부 사이트 `hotel-kenny-yeosu-starlight-route.sejinlee.chatgpt.site`):
- 이전: `https://app.dailymiracles.kr/wish/input` (항상 새 별 만들기)
- 이후: `https://app.dailymiracles.kr/star-entry` (스마트 분기)

**KennyHotelPage.jsx 변경 없음** — 03 카드는 외부 호텔 사이트에 있음.

### 분기 동작

| 상황 | 결과 |
|---|---|
| 최초 방문 | localStorage 없음 → `/wish/input` |
| 소원별 생성 후 재방문 (같은 기기) | localStorage dt_active_star_id → `/my-star/:id` |
| localStorage starId 있지만 별 삭제된 경우 | `/my-star/:id` → MyStar 자체 에러 처리 |
| 다른 기기·브라우저 | localStorage 없음 → `/wish/input` (한계 그대로) |

### 검증
- Build: `npm run build` ✅ exit 0 (703 modules)
- Production 반영: PR + Render Deploy 필요
- 케니호텔 사이트 URL 변경: Founder 지시 후 외부 사이트에서 직접 수정

---

## §36 — PHX-WISHART-002 소원그림 연령 보정 기준 점검 및 복구 (2026-11-09)

### 조사 결과

**파일:** `sowon-dreamtown/src/lib/wishart/build-prompt.ts`

#### 수정 전 상태 (문제)

`VITALITY_RULE`이 **표정/피로도 판단(Case A/B/C)에 종속**되어 있었음:

| Case | 조건 | 나이 보정 |
|---|---|---|
| A (밝은 미소/건강) | 호텔 체크인에서 가장 흔한 케이스 | ❌ minimal to none — 나이 보정 사실상 없음 |
| B (중립/약간 피곤) | | △ up to ~5 years fresher |
| C (피로/긴장 명확) | | ✅ 5–10 years fresher |

추가 문제: `NEGATIVE_RULE`의 `"Do NOT alter the subject's age significantly"` → DALL-E가 연령 보정 의도와 충돌 해석 가능.

**누락 경로:** 처음부터 Case A에 나이 보정이 미적용된 구조로 설계됨 (삭제가 아닌 미구현). 호텔 체크인 사진 대부분이 Case A에 해당 → 사실상 대다수 생성 결과에서 5~10살 보정 미적용.

#### 수정 내용

**1. `VITALITY_RULE` 재구조화** — 나이 보정을 Case A/B/C 외부로 분리, 모든 성인에게 무조건 적용:

- AGE SOFTENING (all adults): 5–10 years younger
- 구체 부위: 피부 탄력/눈가(눈가 crow's feet)/팔자(nasolabial folds)/턱선/볼 활력/눈 밝기
- 최대: 10년 초과 금지
- 어린이: 절대 미적용 (zero change, zero age shift)
- Case A: 표정 변경은 최소 → 나이 보정은 여전히 5–10년 적용 (분리)

**2. `NEGATIVE_RULE` 완화** — 충돌 조항 수정:

```
Before: "Do NOT alter the subject's race, gender, or age significantly."
After:  "Do NOT alter the subject's race or gender. Do NOT alter age by more than 10 years
         (intentional 5–10 year softening is allowed and desired for adults)."
```

#### 적용 범위

- 남녀 모두 동일 기준 (Case A/B/C 모두)
- 어린이: 변경 없음
- 다인 사진: 각자 독립 판정

#### 샘플 재생성 방법

실제 사진이 필요한 작업으로, Founder 또는 운영팀이 로컬 개발 환경(`sowon-dream-plaza` 로컬 실행)에서 체크인 플로우로 생성 비교 필요. 현재 Render Production에는 이 수정이 미반영 — PR + Deploy 필요.

#### 파일 변경

| 파일 | 변경 |
|---|---|
| `sowon-dreamtown/src/lib/wishart/build-prompt.ts` | VITALITY_RULE 재구조화 + NEGATIVE_RULE 완화 |
