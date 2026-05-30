---
code: SSOT-OPS-001
title: DreamTown 영상 제작 운영 파이프라인
status: Confirmed
owner: Aurora5
created: 2026-05-30
layer: LAYER 2 — Operational SSOT
---

# SSOT-OPS-001 — DreamTown 영상 제작 운영 파이프라인

## 목적

DreamTown 영상 제작은 담당자, AI 도구, 제작 파트너가 변경되어도
동일한 품질과 감정 흐름을 유지할 수 있어야 한다.

이 문서는 DreamTown 영상 제작의 공식 운영 SSOT다.

---

## 1. DreamTown 핵심 원칙

DreamTown은 관광 영상을 만드는 프로젝트가 아니다.

DreamTown은

> **소원 → 회복 → 성장 → 별**

의 감정 여정을 만드는 프로젝트다.

### 모든 제작물이 통과해야 하는 3가지 질문

1. DreamTown답나?
2. 감정이 먼저 오나?
3. 기존 SSOT와 충돌 없나?

---

## 2. 파이프라인 전체 흐름

```
세계관
  ↓
이미지 (ChatGPT)
  ↓
영상 (Kling / Sora)
  ↓
OST (Mureka / Suno)
  ↓
편집 (CapCut)
  ↓
배포 (YouTube Shorts / Instagram Reels / TikTok / 네이버 클립)
```

각 단계는 독립적으로 교체 가능하나, **감정 흐름 일관성**은 반드시 유지한다.

---

## 3. 이미지 제작 SSOT

| 항목 | 내용 |
|------|------|
| 도구 | ChatGPT 이미지 생성 |
| 목표 | 정지 이미지가 아니라 감정을 담은 장면 생성 |

**원칙:**
- 소원이 중심
- 여수 실존 장소 기반
- 수채화 스타일 유지

**우선 장소:**
1. 여수엑스포역
2. 엑스포 바닷길
3. 이순신광장
4. 케이블카
5. 종포해양공원
6. 하멜등대
7. 모이핀
8. 오동도
9. 장도

---

## 4. 영상 제작 SSOT

| 항목 | 내용 |
|------|------|
| 도구 | Kling / Sora |
| 장면 길이 | 한 장면 8초 |
| 최우선 원칙 | 캐릭터 일관성 |

**카메라 원칙:**
- 카메라 움직임은 느리게

**금지:**
- 과한 액션
- 뮤직비디오 스타일
- 빠른 컷
- 과한 카메라 흔들림

**목표:** 이미지가 살아있는 듯한 감정 전달

---

## 5. OST 제작 SSOT

| 항목 | 내용 |
|------|------|
| 도구 | Mureka / Suno |

**권장 악기:**
- 피아노
- 스트링
- 어쿠스틱 기타
- 바다 앰비언스

**금지:**
- EDM
- 강한 비트
- 과한 드럼

**DreamTown 감정 구조 (OST 진행):**

```
도착 → 정리 → 희망 → 소원 → 별
```

---

## 6. 편집 SSOT

| 항목 | 내용 |
|------|------|
| 도구 | CapCut |

**편집 순서:**
1. OST 삽입
2. 장면 길이 조정
3. 전환 추가
4. 자막 추가

**원칙:** 음악 먼저, 영상 나중

**허용 전환:**
- Fade
- Cross Dissolve

**금지:**
- 화려한 PPT 스타일 전환

---

## 7. 배포 SSOT

| 항목 | 내용 |
|------|------|
| 비율 | 9:16 |
| 영상 길이 | 30초 / 1분 / 3분 |

**우선 채널:**
1. YouTube Shorts
2. Instagram Reels
3. TikTok
4. 네이버 클립

**OST 재활용:** 동일 OST를 여러 에피소드에 재활용 가능

---

## 8. 에피소드 상태 관리

매 에피소드 종료 시 감정 진행도를 저장한다.
저장 위치: `docs/ssot/episodes/STATE-EP{번호}_{제목}.md`

다음 에피소드 제작자는 이전 에피소드의 감정 상태를 반드시 이어받는다.

**저장 항목:**
- 감정 수치 (예: 슬픔 60 / 희망 40)
- 주요 행동
- 관객 반응
- 획득 요소
- 다음 목표

---

## 9. 관련 SSOT

- [[SSOT-CHAR-001_Sowoni_Character_Bible]] — 소원이 캐릭터 기준
- `media/DreamTown_Media_Architecture_SSOT.md` — 미디어 아키텍처
- `media/DreamTown_Channel_Rendering_Rules_SSOT.md` — 채널별 렌더링 규칙
- `air-engine/05_DERIVATION_PIPELINE.md` — canonical → 파생 파이프라인
