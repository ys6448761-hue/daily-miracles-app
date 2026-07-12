---
code: SSOT-BG-001
title: DreamTown 별빛항로 배경 가이드 (Starlight Route Background Guide)
status: LOCKED
owner: Aurora5
created: 2026-07-09
updated: 2026-07-13 (EP01 Main Route 6개 확정, BG-05/BG-08 재분류 — 대표 승인)
layer: LAYER 2 — Operational SSOT
---

# SSOT-BG-001 — DreamTown 별빛항로 배경 가이드

## 목적

DreamTown의 별빛항로는 AI가 매번 새로운 배경을 생성하지 않는다.

실제 여수를 기반으로 제작한 공식 Background Asset을 사용한다.

앞으로 모든 영상, 스토리북, 기적쇼츠, 별빛항로 영상은 이 Background Asset을 기준으로 제작한다.

---

## 제작 철학

DreamTown에서 장소는 단순한 배경이 아니다.

장소는 감정을 담는 또 하나의 캐릭터다.

Character는 사람이다.
Location은 감정이다.
Background는 Story를 기억한다.

---

## Background Asset 원칙

배경은 DreamTown의 공식 Asset이다.

고객이 달라져도 배경은 변경하지 않는다.

변경되는 것은 캐릭터뿐이다.

---

## Background 생성 방식

```
최초 1회
실제 여수 장소
  ↓
GPT Image 2
  ↓
DreamTown 스타일 변환
  ↓
공식 Background Asset 저장
  ↓
LOCK
```

이후 재생성하지 않는다.

---

## 스타일

모든 Background는 다음 스타일을 따른다.

- 2D
- 한국만화
- 지브리 감성
- 수채화 질감

`SSOT-IMG-001_DreamTown_Image_Generation_Guide`을 따른다.

---

## EP01 Main Starlight Route (2026-07-13 확정, 대표 승인)

**Main Route는 6개 장소로 확정한다.** BG-05(미남크루즈)와 BG-08(호텔)은 Main Route에서 제외하고 아래처럼 재분류한다.

```
1. 여수엑스포역   (BG-01)
2. 엑스포 바닷길  (BG-02)
3. 이순신광장     (BG-03)
4. 케이블카       (BG-04)
5. 종포해양공원   (BG-06)
6. 하멜등대       (BG-07)
```

- **BG-05 미남크루즈 → Optional Experience로 재분류.** EP01 Main Route에는 포함하지 않는다. Background Asset 자체(정의·고정규칙)는 폐기하지 않고 그대로 유지한다 — Optional Experience 상품에서 재사용 가능.
- **BG-08 호텔 → Route Location이 아니라 Experience Stage로 재분류.** 역할: 체크인, First Promise, 안식, 재진입. 상세는 `SSOT-APP-002_DreamTown_First_Promise_Flow.md`(Draft) 참조.
- Part 3 모바일 별빛항로 안내 화면(`dreamtown-wishart` `STARLIGHT_ROUTE_EP01`)은 이미 이 6개 장소 기준으로 구현되어 있다(2026-07-13 승인으로 사후 확정됨).

## Background Asset 목록 (전체, BG-01~08)

> 8개 장소의 감정 역할·순서는 `SSOT-LOC-001_DreamTown_Yeosu_Locations`에서 이미 확정(Confirmed)된 것과 동일하다. 본 문서는 그 역할을 재정의하지 않고, 각 장소에 대응하는 **Background Asset(고정 이미지 자산)** 계층만 추가한다. 아래 목록은 8개 Background Asset 전체(Main Route 6개 + Optional 1개 + Experience Stage 1개)이며, Main Route 여부는 위 섹션을 기준으로 한다.
> **2026-07-09 최종 확정**: "DreamTown 별빛항로(Route) 및 상품 구조 최종 확정" 지시에 따라 BG-01~08의 감정 문구를 확정판으로 갱신하고, **BG-05의 명칭을 "상승의 항로"에서 "항해의 항로"로 변경**했다(이전 버전에서 BG-04와 BG-05가 동일하게 "상승의 항로"로 중복 표기되어 있었으며, 이번 확정으로 그 중복이 해소되었다).

### BG-01 — 도착의 항로

| 항목 | 내용 |
|---|---|
| 장소 | 여수엑스포역 |
| 감정 | 새로운 시작 |
| 시간 | 낮 |
| 역할 | 첫 만남 |

### BG-02 — 호흡의 항로

| 항목 | 내용 |
|---|---|
| 장소 | 엑스포 바닷길 |
| 감정 | 긴장을 내려놓는다 |
| 시간 | 낮 |
| 역할 | 숨을 고르다 |

### BG-03 — 연결의 항로

| 항목 | 내용 |
|---|---|
| 장소 | 이순신광장 |
| 감정 | 사람과 도시의 온기를 느낀다 |
| 시간 | 낮 |
| 역할 | 온기를 느끼다 |

### BG-04 — 상승의 항로

| 항목 | 내용 |
|---|---|
| 장소 | 여수해상케이블카 |
| 감정 | 시야가 넓어진다. 희망이 시작된다. |
| 시간 | 낮 |
| 역할 | 더 넓게 보다 |

### BG-05 — 항해의 항로 (2026-07-09 명칭 확정, 이전: 상승의 항로) — **Optional Experience (2026-07-13, EP01 Main Route 아님)**

| 항목 | 내용 |
|---|---|
| 장소 | 미남크루즈 |
| 감정 | 희망을 품고 앞으로 나아간다 |
| 시간 | 노을 |
| 역할 | 바다 위에서 마음이 열린다 |
| 분류 | Optional Experience (EP01 Main Route 제외) |

**미남크루즈 정의(확정)**: 미남크루즈는 관광 유람선이 아니라, DreamTown의 **"기억을 싣고 앞으로 나아가는 배"**이다.

### BG-06 — 쉼의 항로

| 항목 | 내용 |
|---|---|
| 장소 | 종포해양공원 |
| 감정 | 마음을 정리한다. 고요함을 회복한다. |
| 시간 | 밤 |
| 역할 | 잠시 쉬어간다 |

### BG-07 — 소원의 항로

| 항목 | 내용 |
|---|---|
| 장소 | 하멜등대 |
| 감정 | 소원을 마주한다. 희망을 다짐한다. |
| 시간 | 밤 |
| 역할 | 소원을 마주하다 |

**고정 규칙**
- 붉은 하멜등대
- 세로 방향 "하멜등대"
- 방파제와 육지 연결
- 따뜻한 주황빛
- 별빛
- 케이블카
- 도시 야경

### BG-08 — 안식의 항로 — **Experience Stage (2026-07-13, Route Location 아님)**

| 항목 | 내용 |
|---|---|
| 장소 | 여수 호텔 |
| 감정 | 오늘을 마무리한다. 회복한다. |
| 시간 | 밤 |
| 역할 | 오늘을 마무리하다 → **체크인 / First Promise / 안식 / 재진입**(2026-07-13 재정의) |
| 분류 | Experience Stage (EP01 Main Route의 "장소"가 아니라, 여정을 감싸는 별도 단계). 상세: `SSOT-APP-002_DreamTown_First_Promise_Flow.md` |

---

## 캐릭터 합성 원칙

Background는 절대 변경하지 않는다.

합성하는 것은 오직 캐릭터다.

```
캐릭터 생성
여행자 사진
  ↓
GPT Image 2
  ↓
2D 한국만화
  ↓
Background 위 합성
```

**유지 항목**
- 광원
- 원근
- 시선
- 그림자
- 색감
- 감정

---

## 상품 활용

동일한 Background Asset을 사용한다.

### 기적쇼츠
```
배우 소원이
  ↓
Background
```

### 별빛항로 영상
```
여행자
  ↓
Background
```

### 기적 스토리북
```
10P
  ↓
Background
  ↓
Story Text
```

### 향후 상품
웹툰 / 애니메이션 / 엽서 / 굿즈 / 전시 — 모두 동일한 Background Asset 사용.

---

## 기술 스택

| 용도 | 도구 |
|---|---|
| 이미지 생성 및 배경 변환 | GPT Image 2 |
| 음원 | Mureka |
| 영상 생성 | Kling |

도구 변경 시 본 SSOT를 수정한다.

---

## 최종 원칙

DreamTown의 핵심 자산은 영상이 아니다.

이미지가 아니다.

**Background Asset이다.**

그 위에 사람의 소원이 올라가고, 감정이 흐르고, Story가 만들어진다.

---

## 관련 SSOT

- [[SSOT-LOC-001_DreamTown_Yeosu_Locations]] — 8개 장소의 감정 역할·순서 원본 정의 (본 문서가 참조하며, 재정의하지 않음)
- [[SSOT-ROUTE-001_EP01_Wish_Journey]] — 항로 순서 적용 사례
- [[SSOT-IMG-001_DreamTown_Image_Generation_Guide]] — 이미지 생성 원칙 (본 문서의 스타일 기준)
- [[SSOT-VID-002_Kling_Animation_Guide]] — Kling 기반 영상 생성 가이드
- [[DreamTown_Character_SSOT]] — 캐릭터 기준 (본 문서의 캐릭터 합성 원칙과 연동)
