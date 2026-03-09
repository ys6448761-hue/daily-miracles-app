# DreamTown SSOT Index

Version: v1.8
Owner: Aurora5
Status: Active
Purpose: SSOT 파일 목록 및 작업 규칙

Last Updated: 2026-03-09

---

## 코드에게 — 작업 전 필독 규칙

**모든 DreamTown 관련 작업은 아래 SSOT 파일을 먼저 읽고 시작한다.**
SSOT와 충돌하는 코드는 작성하지 않는다.
SSOT에 없는 새로운 결정이 생기면 해당 SSOT 파일을 먼저 업데이트한다.

---

## SSOT 파일 목록

| 파일 | 용도 | 필독 시점 |
|------|------|----------|
| `DreamTown_Core_Philosophy_SSOT.md` | 철학적 선언, 소원의 의미, DreamTown의 본질 | **모든 작업 전 (0번 문서)** |
| `DreamTown_Naming_System_SSOT.md` | 공식 용어 정의 (Sowoni/Somangi/기적나눔 등) | 콘텐츠·코드·커뮤니케이션 전 |
| `DreamTown_First_User_Journey_SSOT.md` | 신규 소원이 첫 경험 10단계 흐름 | UX·온보딩·프론트엔드 작업 전 |
| `DreamTown_Universe_Bible.md` | 세계관, 핵심 개념, 여정 구조 | **모든 작업 전** |
| `DreamTown_Character_SSOT.md` | 소원이·아우룸 캐릭터 상세 정의 | 이미지·영상·웹툰 제작 전 |
| `DreamTown_Visual_Style_SSOT.md` | 스타일 잠금, 색상, 기술 스펙 | 이미지·영상·UI 작업 전 |
| `DreamTown_Character_Style_Guide_SSOT.md` | 캐릭터+환경+장면 통합 스타일 가이드 (여의보주 포함) | 이미지·영상 생성 직전 |
| `DreamTown_Key_Visuals_SSOT.md` | 핵심 비주얼 3장면 (KV-01/02/03) — 브랜딩·영상·앱·마케팅 기준 | 비주얼 제작·브랜딩 작업 전 |
| `DreamTown_Wish_System_SSOT.md` | 소원 시스템 전체 구조 (소원→별 성장) | 소원·여정·기적 카드 작업 전 |
| `DreamTown_Miracle_System_SSOT.md` | 기적 카드, 기적지수, 신호등, 별 성장 | 기적·신호등·기적지수 작업 전 |
| `DreamTown_Galaxy_Mode_SSOT.md` | 은하 구조, 코스 정의, 글로벌 확장 | 여행·은하 작업 전 |
| `DreamTown_Yeosu_Galaxy_SSOT.md` | 여수 4개 코스, 장소별 기적 포인트, 배경 코드 | 여수 여행·영상 제작 전 |
| `DreamTown_Yeosu_Travel_Routes_SSOT.md` | 여수 신화 레이어(Golden Nine) ↔ 운영 레이어 분리 구조 | 여수 여행 상품·세계관 작업 전 |
| `DreamTown_Travel_System_SSOT.md` | 항로 4종, 호텔, 견적 시스템 | 여행 상품·견적 작업 전 |
| `DreamTown_Product_Structure_SSOT.md` | 상품 구조, 가격, 번들 | 상품 관련 작업 전 |
| `DreamTown_Wish_Image_SSOT.md` | 소원그림 생성 파이프라인, 보석 시스템, 스타일 | 이미지 생성 작업 전 |
| `DreamTown_Growth_Film_SSOT.md` | 성장필름 (7일 완주 기념 영상), 바이럴 루프 | 성장필름·챌린지 작업 전 |
| `DreamTown_Aurora5_System_SSOT.md` | Aurora5 팀 역할, 메시지 시스템, 기적지수 엔진 | AI 동행 시스템 작업 전 |
| `DreamTown_Safety_Ethics_SSOT.md` | 신호등, 금지 조언, 개인정보, 위기 대응 | 안전·윤리 관련 모든 작업 전 |

---

## 작업(Task) 규칙

- 작업 파일 위치: `docs/tasks/`
- 작업 파일은 SSOT를 복사하지 않는다 → SSOT 파일을 참조(링크)한다
- 작업 완료 후 SSOT 업데이트가 필요하면 먼저 SSOT를 수정한다

### 작업 파일 헤더 템플릿
```markdown
# Task: {작업명}

SSOT 참조:
- Universe: docs/ssot/DreamTown_Universe_Bible.md
- (관련 SSOT 파일 링크)

Status: TODO / IN_PROGRESS / DONE
Created: YYYY-MM-DD
```

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.0 | 2026-03-09 | 최초 생성 (Code) |
| v1.1 | 2026-03-09 | DreamTown_Wish_System_SSOT.md 추가 |
| v1.2 | 2026-03-09 | DreamTown Foundation Set 완성 — 12개 SSOT 전체 등록 |
| v1.3 | 2026-03-09 | DreamTown_Core_Philosophy_SSOT.md 추가 (0번 문서) |
| v1.4 | 2026-03-09 | DreamTown_Naming_System_SSOT.md 추가 — 공식 용어 체계 확립 |
| v1.5 | 2026-03-09 | DreamTown_First_User_Journey_SSOT.md 추가 — 신규 소원이 온보딩 10단계 |
| v1.6 | 2026-03-09 | DreamTown_Character_Style_Guide_SSOT.md 추가 — 캐릭터+환경+장면 통합 가이드 |
| v1.7 | 2026-03-09 | DreamTown_Yeosu_Travel_Routes_SSOT.md 추가 — Golden Nine 신화 ↔ 운영 레이어 분리 |
| v1.8 | 2026-03-09 | DreamTown_Key_Visuals_SSOT.md 추가 — 핵심 비주얼 3장면 확정 |
