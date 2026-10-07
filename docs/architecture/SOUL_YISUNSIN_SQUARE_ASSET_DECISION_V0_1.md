# SOUL YiSunSin Square — Asset Inventory Decision V0.1

**Date:** 2026-10-08  
**Author:** Lumi (Claude Code) + Founder  
**Status:** DECISION_RECORDED  
**Source folder:** `C:\DREAM TOWN\Assets\SOUL\YiSunSin_Square\`

---

## Inventory (6 files / 5 subfolders)

| 파일명 | 크기 | 생성일 | 상태 | 역할 설명 |
|---|---|---|---|---|
| `Place_Hero/YiSunSin_Square_Place_Hero_V1.png` | 2.8MB | Oct 8 07:01 | **APPROVED** | 장소 카드 Hero 이미지 — Founder 최종 승인 |
| `Experience/YiSunSin_Square_Experience_Turtle_Ship_V1.png` | 2.5MB | Oct 8 08:11 | KEEP / Candidate | 거북선 체험 경험 이미지 |
| `Context/YiSunSin_Square_Context_Day_V1.png` | 2.9MB | Oct 8 08:08 | KEEP / Candidate | 이순신 동상 + 분수 + 낮 장면 |
| `Context/YiSunSin_Square_Context_Night_V1.png` | 2.9MB | Oct 8 07:02 | KEEP / Candidate | 이순신장군 동상 + 별 + 진남관 야간 조명 야경 |
| `Journey/YiSunSin_Square_Journey_Plaza_V1.png` | 2.8MB | Oct 8 08:10 | KEEP / Journey 우선 후보 | 광장 전체 부감 + 나침반 문양 바닥 + 원경 |
| `Journey/YiSunSin_Square_Journey_Candidate_V1.png` | 2.7MB | Oct 8 07:01 | HOLD / 대체 후보 보관 | 거북선 + 이순신동상 + 노을 + 군중 + 케이블카 배경 |

**Wish_Scene 폴더:** 의도적으로 비워둠 (Founder 결정)

---

## 이미지 내용 검증 결과 (시각 확인)

### Context 중복 여부
- `Context_Day_V1.png` — 이순신 동상 정면 + 분수 + 버스 + 낮하늘 파란색 + 군중
- `Context_Night_V1.png` — 이순신장군 동상 + 별이 있는 밤하늘 + 진남관 야간 조명 + 야경 가로등
- **판정: 완전히 다른 장면. 중복 아님.**

### 파일명 이중 확장자 이슈
- 이전 Bash 출력에서 `Context_Night_V1.png.png`로 표시됨
- 실제 파일 확인 결과 단일 `.png` 확장자로 정상 존재
- **판정: 터미널 렌더링 아티팩트. 파일명 교정 불필요.**

### Journey 두 파일 차이
- `Journey_Plaza_V1.png` — 광장 부감 뷰, 나침반 문양 바닥, 원경의 이순신동상, 일몰 직전 낮 장면
- `Journey_Candidate_V1.png` — 거북선 + 노을 + 군중 + 케이블카 배경, 축제/이벤트 분위기
- **판정: 서로 다른 장면. Plaza는 광장 전경, Candidate는 행사/축제 맥락.**

---

## SOUL Runtime 연결 상태

| 항목 | 상태 |
|---|---|
| `_PLACE_KNOWLEDGE` 등록 | NOT_CONNECTED |
| `PLACE_ALIAS_MAP` 등록 | NOT_CONNECTED |
| `place-hero` 레포 배포 | NOT_DEPLOYED |
| BROAD 연결 (Track A) | CONNECTED (2026-10-07, commit 77c28a5) |

> **주의:** APPROVED된 `Place_Hero_V1.png`는 아직 레포(`dreamtown-frontend/public/images/soul/place-hero/yisunsin.png`)에 배포되지 않음. 서비스 반영은 Founder 별도 지시 후 진행.

---

## 미완료 항목

| # | 항목 | 조건 |
|---|---|---|
| 1 | Place_Hero 레포 배포 | Founder 지시 후 |
| 2 | Experience/Context/Journey 이미지 레포 배포 | 각 이미지 개별 승인 후 |
| 3 | `_PLACE_KNOWLEDGE` YiSunSin 블록 구조화 | BROAD 연결 이후 DEEP 단계에서 |
| 4 | Wish_Scene 이미지 | 생략 결정 (현재 기준) |
| 5 | Journey 우선 파일 최종 지정 | Plaza_V1 우선 후보, Candidate_V1 보관 중 |
