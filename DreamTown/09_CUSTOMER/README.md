# 09_CUSTOMER — 고객 경험 패키지 운영

---

**목적:** 고객에게 실제로 전달되는 패키지(Starter Kit 등)의 실행 문서를
관리한다.
**역할:** Operations (운영) — 제작(Production)은 여기서 하지 않는다.

## 절대 원칙 — 영상/이미지 원본 중복 저장 금지

**이 폴더에는 영상·이미지 원본을 저장하지 않는다.** 원본은 항상
`dreamtown-assets/05_FINAL`(영상), `dreamtown-assets/02_IMAGE`(이미지)를
참조한다. 이 폴더는 그 원본을 "어떤 순서로, 어떻게, 누구에게" 전달할지
정의하는 실행 문서만 담는다.

## 현재 포함된 패키지

- `STARTERKIT-v1.0_Hotel_Pilot_Package.md` — 1호 호텔 파일럿용 Starter
  Kit v1.0 (2026-07-17, `dreamtown-assets/09_STARTERKIT/`에서 이동됨,
  내용 변경 없음)

## AI Instructions

- 영상/이미지 원본을 이 폴더로 복사하지 않는다.
- 새 패키지 문서를 만들 때도 원본 자산은 항상 `dreamtown-assets`의
  경로를 참조로만 기록한다.
- Pilot Freeze 등 운영 제약이 걸린 패키지는 그 상태를 문서 상단에
  명시한다.
