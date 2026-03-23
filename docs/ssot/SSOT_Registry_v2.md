# DreamTown SSOT Registry v2

Version: v2.0
Owner: Aurora5 / Code
Status: Confirmed
Purpose: docs/ssot/ 3계층 구조 분류표 — Core / Support / Archive

Last Updated: 2026-03-13
Updated By: Code (Claude Code)
Supersedes: SSOT_Registry.md (v1.0)

---

## 계층 정의

| 계층 | 설명 | 개수 | 변경 권한 |
|------|------|------|---------|
| **Core** | DreamTown 절대 기준 — 세계관·브랜드·철학 | 13 | CEO 확정 필요 |
| **Support** | 구현·설계·UX·운영 참고 문서 | 25 | Aurora5 협의 |
| **Archive** | 중복·구버전·실험·흡수된 문서 | 47 | 보관 전용 |

---

## Core SSOT (13개)

위치: `docs/ssot/core/`

**모든 작업 전 반드시 읽는 문서.**

| 파일 | 대응 지시서 분류 | 필독 시점 |
|------|----------------|----------|
| `DreamTown_Core_Philosophy_SSOT.md` | Core Philosophy | 모든 작업 전 (0번) |
| `DreamTown_Universe_Bible.md` | Universe Structure | 모든 작업 전 |
| `DreamTown_Universe_Structure_v2_SSOT.md` | Universe Structure | 세계관 작업 전 |
| `DreamTown_Origin_Myth_SSOT.md` | Origin Myth | 세계관·캐릭터·콘텐츠 작업 전 |
| `DreamTown_Character_SSOT.md` | Character SSOT | 이미지·영상·UX 작업 전 |
| `DreamTown_Naming_System_SSOT.md` | Naming + Language | 콘텐츠·코드·커뮤니케이션 전 |
| `DreamTown_Visual_Style_SSOT.md` | Visual Style | 이미지·영상·UI 작업 전 |
| `DreamTown_Product_Core_Loop_SSOT.md` | Product Architecture | 제품 기획·UX 작업 전 |
| `DreamTown_Wish_System_SSOT.md` | UX Design | 소원·여정·기적 작업 전 |
| `DreamTown_World_Architecture_SSOT.md` | System Architecture | 기술·DB·API 작업 전 |
| `DreamTown_Safety_Ethics_SSOT.md` | Absolute Rules | 안전·윤리 관련 모든 작업 전 |
| `DreamTown_Aurora5_System_SSOT.md` | Community Canon | AI 동행 시스템 작업 전 |
| `DreamTown_Miracle_System_SSOT.md` | IP Canon | 기적·신호등·기적지수 작업 전 |

---

## Support Docs (25개)

위치: `docs/ssot/support/`

**구현 참고 문서. Core SSOT를 기반으로 한 설계·실행 가이드.**

### Product / Tech (9개)

| 파일 | 용도 |
|------|------|
| `DreamTown_Product_Architecture_Design.md` | 상품 구조 전체 설계 |
| `DreamTown_Product_Structure_SSOT.md` | 상품 구조, 가격, 번들 |
| `DreamTown_MVP_Scope_Design.md` | MVP 범위 정의 |
| `DreamTown_Tech_Architecture_SSOT.md` | 기술 스택, 서버 구조 |
| `DreamTown_DB_Schema_Design.md` | DB 스키마 설계 |
| `DreamTown_API_Spec_Design.md` | API 명세 (`routes/dreamtownRoutes.js` 연결) |
| `DreamTown_Pipeline_Design.md` | 서비스 파이프라인 |
| `DreamTown_Growth_Film_Architecture_SSOT.md` | 성장필름 기술 아키텍처 |
| `DreamTown_Video_Pipeline_Design.md` | 영상 파이프라인 |

### UX (6개)

| 파일 | 용도 |
|------|------|
| `DreamTown_First_User_Journey_SSOT.md` | 신규 소원이 온보딩 10단계 |
| `DreamTown_Frontend_Screen_Map_Design.md` | 프론트엔드 화면 맵 |
| `DreamTown_My_Star_UX_Master_Design.md` | My Star 화면 UX |
| `DreamTown_Galaxy_Map_UI_Design.md` | Galaxy Map UI |
| `DreamTown_Star_Birth_Policy_Design.md` | 별 탄생 정책 (makeStarName() 연결) |
| `DreamTown_Onboarding_Experience_v1.md` | 온보딩 경험 설계 |

### Galaxy / World (5개)

| 파일 | 용도 |
|------|------|
| `DreamTown_Galaxy_Map_SSOT.md` | Galaxy Map 전체 구조 |
| `DreamTown_Galaxy_Mode_SSOT.md` | Galaxy Mode 코스, 아우룸 인터랙션 |
| `DreamTown_Galaxy_Evolution_SSOT.md` | 은하 성장 구조 |
| `DreamTown_Yeosu_Galaxy_SSOT.md` | 여수 4개 코스, 기적 포인트 |
| `DreamTown_Travel_System_SSOT.md` | 항로 4종, 호텔, 견적 시스템 |

### Character / Visual / IP (5개)

| 파일 | 용도 |
|------|------|
| `DreamTown_Aurum_System_Design.md` | 아우룸 시스템 설계 |
| `DreamTown_Character_Style_Guide_SSOT.md` | 캐릭터+환경 스타일 가이드 (제작용) |
| `DreamTown_Image_Prompts_SSOT.md` | DALL-E/Sora 마스터 프롬프트 |
| `DreamTown_Key_Visuals_SSOT.md` | 핵심 비주얼 3장면 |
| `DreamTown_Golden_Turtle_Constellation_SSOT.md` | 황금 거북 별자리 구조 |

---

## Archive (47개)

위치: `docs/ssot/archive/`

**삭제하지 않고 보관. 참고 목적으로만 사용.**

### 운영/스프린트 (실행 완료 또는 시간 한정)

| 파일 | 보관 이유 |
|------|---------|
| `DreamTown_Current_Sprint_v1.md` | 스프린트 기록 |
| `DreamTown_Prototype_Kickoff.md` | 킥오프 기록 |
| `DreamTown_Alpha_Decision_Single_Star.md` | Alpha 결정 기록 |
| `DreamTown_Closed_Alpha_Questions_Design.md` | Alpha 테스트 설계 |
| `DreamTown_Closed_Alpha_Seed_Stars_Design.md` | Alpha seed 설계 |
| `DreamTown_Launch_Asset_Checklist_v1.md` | 런치 체크리스트 |

### 전략/로드맵 (Support보다 추상적)

| 파일 | 보관 이유 |
|------|---------|
| `DreamTown_MVP_Dev_Plan_v1.md` | 개발 계획 (실행 완료) |
| `DreamTown_Product_Roadmap_v1.md` | 로드맵 (지속 변경) |
| `DreamTown_Launch_Strategy_v1.md` | 런치 전략 |
| `DreamTown_First_100_Users_Strategy.md` | 초기 사용자 전략 |
| `DreamTown_Yeosu_Pilot_Design.md` | 여수 파일럿 설계 |
| `DreamTown_Expansion_Universe_Design.md` | 미래 확장 (MVP 이후) |
| `DreamTown_Festival_Commerce_Design.md` | 미래 기능 |
| `DreamTown_Partner_Support_Formula_Design.md` | 파트너 지원 공식 |

### 중복/흡수된 문서

| 파일 | 보관 이유 |
|------|---------|
| `DreamTown_Complete_SSOT.md` | Registry로 흡수 |
| `DreamTown_SSOT_Master_Index.md` | INDEX.md로 흡수 |
| `DreamTown_Integrated_Architecture_Design.md` | World_Architecture로 흡수 |
| `DreamTown_System_Architecture_Map_Design.md` | Tech_Architecture로 흡수 |
| `DreamTown_Master_Architecture_Map_v1.md` | 중복 |
| `DreamTown_Master_Map_Design.md` | 중복 |
| `DreamTown_System_Map_v1.md` | 중복 |
| `DreamTown_One_Page_Blueprint_Design.md` | Blueprint 역할 축소 |
| `DreamTown_Aurora5_Master_Map_Design.md` | Aurora5_System_SSOT로 흡수 |
| `DreamTown_ERD_Summary_Design.md` | DB_Schema로 흡수 |
| `DreamTown_DragonPalace_DB_Design.md` | DB_Schema로 흡수 |

### 설계 참고 (구현 완료 또는 v1 이전)

| 파일 | 보관 이유 |
|------|---------|
| `DreamTown_Aurum_UX_Design.md` | Aurum_System_Design으로 통합 |
| `DreamTown_Build_Order_Design.md` | 빌드 순서 (실행 완료) |
| `DreamTown_Constellation_System_Design.md` | P1 기능 (MVP 이후) |
| `DreamTown_Core_Action_SSOT.md` | Product_Core_Loop로 흡수 |
| `DreamTown_Core_Storyboard_SSOT.md` | IP/콘텐츠 참고용 |
| `DreamTown_Cosmic_Map_SSOT.md` | Galaxy_Map으로 흡수 |
| `DreamTown_First_Star_Canon_Design.md` | Founding_Stars로 통합 |
| `DreamTown_Founding_Stars_Canon_Design.md` | 세계관 참고용 |
| `DreamTown_Galaxy_Map_Wireframe_Copy_Design.md` | UI Design으로 흡수 |
| `DreamTown_Growth_Film_SSOT.md` | Architecture_SSOT로 흡수 |
| `DreamTown_IP_Strategy_SSOT.md` | 전략 참고용 |
| `DreamTown_Key_Moment_SSOT.md` | Product_Core_Loop로 흡수 |
| `DreamTown_Opening_Cinematic_Design.md` | 영상 참고용 |
| `DreamTown_Screen_Map_v1.md` | Frontend_Screen_Map으로 대체 |
| `DreamTown_Sky_Map_Design.md` | Galaxy_Map으로 흡수 |
| `DreamTown_Star_Navigation_System_SSOT.md` | Galaxy_Map으로 흡수 |
| `DreamTown_Star_Share_System_Design.md` | P1 기능 |
| `DreamTown_Vision_Stack_SSOT.md` | Core_Philosophy로 흡수 |
| `DreamTown_Wish_Image_SSOT.md` | Product 파이프라인 참고용 |
| `DreamTown_World_Map_SSOT.md` | World_Architecture로 흡수 |
| `DreamTown_Yeosu_Travel_Routes_SSOT.md` | Yeosu_Galaxy로 통합 |
| `DreamTown_Copyright_Registration_Doc.md` | 법무 문서 |

---

## 분류 요약

| 계층 | 수량 |
|------|------|
| Core | 13 |
| Support | 25 |
| Archive | 47 |
| Root (Meta) | 3 |
| **합계** | **88** |

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.0 | 2026-03-13 | 최초 Registry (87개, 단일 폴더) |
| v2.0 | 2026-03-13 | 3계층 구조 재편 — Core/Support/Archive 분리 |
