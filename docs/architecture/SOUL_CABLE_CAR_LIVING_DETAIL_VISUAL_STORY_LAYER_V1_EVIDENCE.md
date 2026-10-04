# SOUL_CABLE_CAR_LIVING_DETAIL_VISUAL_STORY_LAYER_V1_EVIDENCE

**Status:** FOUNDER_APPROVED / CLOSED  
**Date:** 2026-10-04  
**Checkpoint before start:** main @ `0b9539c`  
**Founder Final Review:** PASS  

---

## 1. ASSET INVENTORY / PROVENANCE

**Source directory:** `C:\DREAM TOWN\Assets\SOUL\Yeosu_Cable_Car\`  
**Destination:** `dreamtown-frontend/public/images/soul/cable-car/`

| 소스 파일 | 대상 파일 | 크기 | 상태 |
|---|---|---|---|
| `Context\SOUL_YEOSU_CABLECAR_CONTEXT_FAMILY_SUNSET_V01.png` | `context-family-sunset.png` | 2,636,601 bytes | EXACT ✓ |
| `Experience\SOUL_YEOSU_CABLECAR_EXPERIENCE_CABIN_VIEW_V01.png` | `experience-cabin-view.png` | 2,815,705 bytes | EXACT ✓ |
| `Experience\SOUL_YEOSU_CABLECAR_EXPERIENCE_CITY_VIEW_V01.png` | `experience-city-view.png` | 2,771,912 bytes | EXACT ✓ |
| `Wish_Scene\SOUL_YEOSU_CABLECAR_WISH_SCENE_SUNSET_V01.png` | `wish-scene.png` | 2,582,654 bytes | EXACT ✓ |

**모든 이미지:** 1672×941 px (16:9 landscape), DreamTown 수채화/일러스트 스타일.  
이미지 수정 없음 — 원본 바이트 보존. 이미지 생성 없음. 외부 자산 없음.

**Journey 폴더:** EMPTY — Journey 이미지 생성 없음 (spec 준수).

---

## 2. ROLE MAPPING

| 이미지 | 시각적 역할 | 실제 콘텐츠 |
|---|---|---|
| `experience-city-view.png` | Quick Basic Trust → Experience 전환 | 정류장/데크에서 여수 전경 조망, 낮/맑음, 1인(뒷모습), 케이블카 시스템 가시 |
| `context-family-sunset.png` | 맥락 개인화 — 가족/부모님 동행 시각 지지 | 캐빈 내부 3인 가족, 석양, 여수 항구 파노라마 |
| `experience-cabin-view.png` | SOUL Judgment → Journey 호흡 전환 | 캐빈 내부 1인(뒷모습), 돌산대교·섬·항구 파노라마, 황금시간대 |
| `wish-scene.png` | 감정 마무리 — 여행 상상의 절정 | 야외 전망 포인트 3인, 도시 석양+야경 시작, 케이블카 캐빈 가시 |

---

## 3. IMPLEMENTATION POSITIONS (SoulCableCarPage.jsx)

**페이지 최종 리듬:**

```
HEADER (sticky)
QUESTION COMPOSER + chips + Quick Context
SOUL MESSAGE (conditional)
PLACE HERO                              ← 장소 정체성 (기존)
ESSENTIAL INFO / Quick Basic            ← factual trust
EXPERIENCE: CITY VIEW                   ← NEW (isCableCarView)
FOR ME                                  ← context-dependent
CONTEXT: FAMILY SUNSET                  ← NEW (family/parents only)
SOUL JUDGMENT
EXPERIENCE: CABIN VIEW                  ← NEW (isCableCarView)
JOURNEY (SOUL이 보는 내 여행)
RICH BASIC × 4 (collapsed)
COST (conditional)
QUESTION DISCOVERY (더 알고 싶을 때)
WISH SCENE                              ← FIXED + enhanced (stateIndex >= 2)
BOTTOM CTA (fixed)
```

---

## 4. CONDITIONAL BEHAVIOR

| 이미지 | 조건 |
|---|---|
| CITY VIEW | `isCableCarView` — 케이블카 뷰에서 항상 |
| CONTEXT | `isCableCarView && (companion === 'family' \|\| companion === 'parents')` |
| CABIN VIEW | `isCableCarView` — 케이블카 뷰에서 항상 |
| WISH SCENE | `stateIndex >= 2 && (isCableCarView \|\| !isPlaceKnowledge)` |

**stateIndex 기준:**

| 컨텍스트 | stateIndex | CITY VIEW | CONTEXT | CABIN VIEW | WISH SCENE |
|---|---|---|---|---|---|
| DEFAULT | 0 | ✓ | ✗ | ✓ | ✗ |
| VEHICLE | 1 | ✓ | ✗ | ✓ | ✗ |
| ODONGDO | 2 | ✓ | ✗ | ✓ | ✓ |
| PARENTS | 3 | ✓ | ✓ | ✓ | ✓ |
| ALL | 3 | ✓ | ✓ | ✓ | ✓ |

**실제 렌더링 이미지 수 (Place Hero 포함):**

| 컨텍스트 | 이미지 수 |
|---|---|
| DEFAULT | 3장 (Hero + City View + Cabin View) |
| VEHICLE | 3장 |
| ODONGDO | 4장 (+ Wish Scene) |
| PARENTS | 5장 (+ Context + Wish Scene) |
| ALL | 5장 |

---

## 5. VISUAL STRENGTH HIERARCHY

| 이미지 | 오버레이 | 텍스트 |
|---|---|---|
| **HERO** | 강함 — `linear-gradient(to top, 0.90→0.45→0.15)` | 장소명 + 부제 |
| **CITY VIEW** | 중간 — `rgba(10,22,40,0.55) → transparent 55%` | 캡션 1줄: `"바다 위에서 만나는 여수"` (text-xs, opacity-60) |
| **CONTEXT** | 최소 — `rgba(10,22,40,0.20) → transparent 40%` | 없음 |
| **CABIN VIEW** | 최소 — `rgba(10,22,40,0.18) → transparent 40%` | 없음 |
| **WISH SCENE** | 최소 — `rgba(10,22,40,0.22) → transparent 45%` | 없음, `mt-2` 간격 추가 |

**구현된 텍스트 원칙:**
> "이미지 위의 텍스트는 이미지의 역할을 사용자가 놓칠 때만 넣는다."

---

## 6. WISH SCENE PATH FIX

기존 코드에 있던 레거시 깨진 경로:
```
src="/dreamtown/images/soul/cable-car/wish-scene.png"   ← 존재하지 않았음
```

수정 후:
```
src="/images/soul/cable-car/wish-scene.png"             ← 정상 서빙
```

---

## 7. BUILD / BROWSER VERIFICATION

| 항목 | 결과 |
|---|---|
| 빌드 모듈 수 | **690** |
| 빌드 오류 | **0** |
| 최종 bundle | `index-C0i3OUl3.js` (1,242.85 kB) |
| CITY VIEW 캡션 중복 | **0건** (`"케이블카에서 만나는 여수"` 완전 제거) |
| 레거시 `/dreamtown/images/soul/` 경로 | **0건** |

**Asset HTTP (dev server port 3002):**

| URL | Status | Bytes |
|---|---|---|
| `/images/soul/cable-car/experience-city-view.png` | **200** | 2,771,912 ✓ |
| `/images/soul/cable-car/context-family-sunset.png` | **200** | 2,636,601 ✓ |
| `/images/soul/cable-car/experience-cabin-view.png` | **200** | 2,815,705 ✓ |
| `/images/soul/cable-car/wish-scene.png` | **200** | 2,582,654 ✓ |
| `/images/soul/place-hero/cablecar.png` | **200** | 3,083,553 ✓ (Hero 유지) |

**Evidence Safety — 금지 표현 7종:** **0건** ✓  
**V1 content markers 전체:** 유지 ✓  
**Knowledge / Judgment / Journey / Question Discovery:** 변경 없음 ✓  
**Legacy Yeosu Origin 복원:** 없음 ✓  
**이미지 생성:** 없음 ✓  
**Migration / schema / DB:** 없음 ✓

---

## 8. FOUNDER REVIEW PASS — VALIDATED PRINCIPLES

Founder가 실제 모바일 페이지에서 확인한 동작:

- Place Hero → 장소 정체성 확립
- City View → 첫 번째 Experience 전환
- Context 이미지 → 여행자 맥락이 의미 있을 때만 나타남
- Cabin View → SOUL Judgment와 Journey 사이 시각 호흡
- Wish Scene → 감정 마무리 시각
- 고정 갤러리처럼 읽히지 않음
- 접힌 정보가 시각적으로 균형 유지
- 여행자 맥락 증가에 따라 시각 깊이 증가

**확립된 운영 원칙:**
> "이미지를 많이 보여주는 것이 아니라,  
> 여행자의 상황과 관심에 따라 필요한 이미지가  
> 필요한 순간에 나타난다."

---

## 9. CABLE CAR LIVING DETAIL V1 — COMPLETED LAYERS

| 레이어 | 상태 |
|---|---|
| Rich Basic Information V1 | CLOSED |
| Personalized Judgment V0.1 | CLOSED |
| Judgment → My Journey V0.1 | CLOSED |
| Living Detail Information Hierarchy V0.1 | CLOSED |
| More-To-Know Question Discovery V0.1 | CLOSED |
| Place Hero Visual Trust Layer V1 | CLOSED |
| **Living Detail Visual Story Layer V1** | **CLOSED** |

미완료 (향후 별도 작업):
- Human Experience Layer — VISION_EXISTS_NOT_IMPLEMENTED
- Travel Time Matrix — GOVERNANCE_HOLD

---

## 10. CURRENT NEXT ACTION

`HUMAN_EXPERIENCE_PILOT_V0_1_PREPARATION`

Scope: 경험 수집 시스템 준비만.  
경험 데이터 생성 없음. Experience Knowledge 구현 없음. 자동 연락 없음. 신규 schema/migration 없음.
