# DreamTown Growth Film SSOT

Version: v1.0
Owner: Aurora5
Status: Active
Purpose: Define the Growth Film system — the visual record of a 7-day wish journey.

Last Updated: 2026-03-09
Updated By: Code (Claude Code)

---

## 개념

성장필름은 소원이의 **7일 여정 완주 기념 시각 기록**이다.
1080×1920 PNG로 자동 생성되며, 소셜 공유를 통해 바이럴 루프를 만든다.

> "별이 된 소원이의 7일을 한 장에 담다."

---

## 1. 생성 조건

| 조건 | 내용 |
|------|------|
| **트리거** | Day 7 체크인 완료 → status = `COMPLETED` |
| **자동 생성** | `GET /film` 호출 시 7일 데이터 조합 |
| **수동 생성** | 소원이가 직접 생성 버튼 클릭 |

---

## 2. 성장필름 구조

```
Day 1 이미지 (Seed)
Day 3 이미지 (Sprout)
Day 5 이미지 (Growing)
Day 7 이미지 (Bloom)
```

### Canvas 렌더링 구성
| 요소 | 내용 |
|------|------|
| 배경 | 1080×1920 dark/purple gradient (`#9B87F5` → `#6E59A5`) |
| 레이아웃 | 2×2 그리드 (Day 1·3·5·7 이미지 배치) |
| 오버레이 | CSS color-wash + light-on + sparkle 효과 |
| 출력 | Canvas.toBlob() → PNG 다운로드 |

---

## 3. DB 구조 (3개 테이블)

### wish_challenges
```
wish_id        — 소원 ID (UNIQUE)
base_image_url — 소원그림 URL
overlay_pack_id — 'hope_v1'
status         — ONGOING / COMPLETED
start_date     — 챌린지 시작일
```

### wish_challenge_days
```
wish_id      — 소원 ID
day_number   — 1~7
action_type  — 체크인 유형
image_filename — 해당 날 이미지
created_at
```

### wish_challenge_cheers
```
wish_id    — 응원받은 소원 ID
session_id — 응원한 사람 (익명)
ON CONFLICT DO NOTHING — 중복 응원 방지
```

---

## 4. 이벤트 로그 (growth_film_events)

| 이벤트 | 의미 |
|--------|------|
| `growth_film_view` | 성장필름 조회 |
| `growth_film_generate_my` | 내 필름 생성 |
| `growth_film_save_click` | 저장 클릭 |
| `growth_film_generate_share` | 공유 버전 생성 |
| `growth_film_share_click` | 공유 버튼 클릭 |
| `growth_film_share_success` | 공유 성공 |
| `share_landing_visit` | 공유 링크 방문 (신규 유입) |
| `share_blocked_409` | 중복 공유 차단 |
| `checkin_from_409_click` | 409 차단 후 체크인 클릭 |

---

## 5. 바이럴 루프 — Referral 연동

성장필름 공유 시 referral 코드가 자동 주입된다.

```
공유 URL: https://dailymiracles.kr/questions.html?ref={refCode}
```

**구현 위치**:
- `public/daily-miracles-result.html` — refCode 조회 (`GET /api/referral/my-code`)
- `public/js/shareCardGenerator.js` — 공유 URL 동적 생성
- 카카오 SDK + 클립보드 복사 모두 refCode 포함

---

## 6. 공유 채널

| 채널 | 방식 |
|------|------|
| 카카오톡 | Kakao SDK `mobileWebUrl` / `webUrl` |
| 링크 복사 | Clipboard API |
| 인스타그램 스토리 | PNG 다운로드 후 직접 업로드 |

---

## 7. 성장필름 → 별 성장 연동

```
성장필름 생성 완료
        ↓
별 단계: Bright Star → Guide Star
        ↓
공유 완료
        ↓
별 단계: Guide Star → Somangi ✨ (커뮤니티에서 다른 별을 밝힘)
```

---

## 8. 기술 스펙

| 항목 | 값 |
|------|-----|
| 출력 포맷 | PNG |
| 해상도 | 1080×1920 |
| 렌더링 | Canvas API (브라우저) |
| Fallback | `.toBlob()` 실패 시 graceful degrade |
| 저장 | 로컬 다운로드 (서버 저장 없음) |
| 코드 위치 | `public/js/growthFilmCollage.js` |
| 백엔드 라우트 | `routes/challengeRoutes.js` |

---

## 9. API

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/film` | GET | 7일 데이터 조회 (Promise.all 병렬) |
| `/checkin` | POST | 일별 체크인 (Day 7 → COMPLETED 자동 전환) |
| `/cheer` | POST | 응원 기록 (ON CONFLICT DO NOTHING) |

---

## 참조

- 소원 시스템: `DreamTown_Wish_System_SSOT.md`
- 소원그림: `DreamTown_Wish_Image_SSOT.md`
- 기적 시스템: `DreamTown_Miracle_System_SSOT.md`
- 코드: `public/js/growthFilmCollage.js`, `routes/challengeRoutes.js`
- 아키텍처: `docs/03-tech/growth-film-architecture.md`
