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

### 미결 항목 (Founder 결정 필요)

- **항목 7**: venue_id 허용목록 — Production 활성화 전 정책 결정 필요
- **PHX-STAR-001**: 케니호텔 연결 URL 최종 결정 (`https://app.dailymiracles.kr/` 권장)
