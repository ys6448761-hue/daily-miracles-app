# Starter Kit v1.0 — 1호 호텔 파일럿 패키지

---

**Status:** Pilot Ready (신규 영상 제작 없음, 기존 `05_FINAL` 자산만 사용).
Pilot Freeze 적용 중 — §9 참조.
**Version:** v1.0
**Source Assets:** `dreamtown-assets/05_FINAL/` (DreamTown Season 1, 3편 —
Production 저장소, Source of Truth. 이 문서가 있는 `DreamTown/09_CUSTOMER/`는
Operations 저장소이며 영상 원본을 복제하지 않는다.)
**Related:** `daily-miracles-mvp/docs/constitution/candidate/CAND-BRAND-001_Haruharu_Miracle_Brand_Architecture.md`
**Date:** 2026-07-16 (최초 작성), 2026-07-16 (§5~9 보강: 호텔 운영 흐름/
패키지 운영안/문의 채널/Pilot Freeze), 2026-07-17 (Production/Operations
분리 원칙에 따라 `dreamtown-assets/09_STARTERKIT/`에서 이 위치로 이동 —
내용 변경 없음, 경로 참조만 갱신)

---

## 1. 영상 순서

Season 1의 Part 순서를 그대로 따른다 — 새로 편집하거나 순서를 바꾸지
않는다.

| 순서 | 파일 | 제목 | 길이 | 형식 |
|---|---|---|---|---|
| 1 | `DT_S01_P01_TheFirstStep_v1.0.mp4` | The First Step | 27초 | 1068×1920, h264, 30fps |
| 2 | `DT_S01_P02_TheFirstPromise_v1.0.mp4` | The First Promise | 39초 | 1068×1920, h264, 30fps |
| 3 | `DT_S01_P03_TheFirstLight_v1.0.mp4` | The First Light | 20초 | 1068×1920, h264, 30fps |

**총 재생 시간:** 약 86초 (1분 26초). 3편을 끊김 없이 연속 재생한다.

**영상 파일 위치:** `dreamtown-assets/05_FINAL/` (이 문서가 있는 곳에는
영상을 저장하지 않는다).

## 2. QR

**현재 상태:** 이 3편은 아직 온라인에 공개 호스팅되어 있지 않다(2026-07-16
기준, 외부 링크 확인되지 않음). 따라서 QR은 두 가지 방식 중 하나를
선택해 운영한다.

### 방식 A — 로컬 재생 (지금 바로 실행 가능, 권장)

호텔 객실/체크인 데스크의 태블릿 또는 TV에 3개 파일을 직접 저장해 두고,
QR 없이 순서대로 재생한다. 인터넷 연결이 필요 없어 가장 안정적이다.

### 방식 B — QR 재생 (호스팅 URL 확보 후)

3편을 재생목록 형태(예: 비공개 YouTube 재생목록, 또는 자체 호스팅
페이지)로 올린 뒤, 그 URL을 QR 코드로 변환해 안내문에 삽입한다. YouTube
업로드 시에는 `DreamTown/07_YOUTUBE/README.md`의 원칙(영상 파일 재업로드
금지, 참조만 기록)을 따른다.

**필요한 것 (아직 준비되지 않음):** 실제 호스팅 URL. 이 URL이 정해지면
아래 안내문의 `[QR_URL_PLACEHOLDER]`에 반영하고 QR 이미지를 생성한다.

```
QR 생성 방법 (URL 확보 후):
1. 3편을 재생목록으로 묶어 하나의 URL 확보
2. 아무 QR 생성기(예: qr-code-generator.com)에 그 URL 입력
3. 생성된 QR 이미지를 09_CUSTOMER/ 에 저장 (예: QR_v1.0.png)
4. 안내문 카드에 QR 이미지 삽입
```

## 3. 안내문 (게스트 안내 카드 텍스트)

객실 또는 체크인 시 전달하는 카드/안내문에 사용할 문구다. 그대로 사용
가능하다.

---

> **DreamTown Starter Kit**
>
> 이 여정은 관광이 아니라, 잠시 잊고 있던 마음을 다시 만나는
> 시간입니다.
>
> 아래 순서로 영상 세 편을 이어서 봐 주세요. 전체 약 1분 26초입니다.
>
> 1. The First Step — 첫걸음
> 2. The First Promise — 첫 번째 약속
> 3. The First Light — 첫 번째 빛
>
> [로컬 재생 시] 태블릿의 재생 버튼을 눌러 순서대로 시청해 주세요.
> [QR 준비 완료 시] 아래 QR을 스캔해 주세요. `[QR_URL_PLACEHOLDER]`
>
> 별은 소원이 이루어졌다는 증거가 아니라, 잊히지 않았다는 약속입니다.

---

## 4. 실행 순서 (호텔 스태프용)

1. **사전 준비:** 태블릿/TV에 `dreamtown-assets/05_FINAL`의 3개 파일이
   모두 있는지 확인 (`DT_S01_P01_TheFirstStep_v1.0.mp4`,
   `..._P02_TheFirstPromise...`, `..._P03_TheFirstLight...`)
2. **재생 테스트:** 3편을 처음부터 끝까지 끊김 없이 재생되는지 미리
   확인한다(볼륨, 화면 방향 9:16 세로 여부 포함)
3. **안내문 배치:** 위 §3 안내문 카드를 객실 또는 체크인 데스크에 비치
4. **게스트 응대:** 체크인 시 Starter Kit을 간단히 소개하고, 위 순서대로
   영상을 재생하도록 안내
5. **재생 진행:** Part 1 → Part 2 → Part 3 순서로 중단 없이 재생 (총
   약 86초)
6. **완료 후:** 게스트 반응/질문/특이사항을 기록한다 — 이는 별도 개발
   없이 이미 준비된 `daily-miracles-mvp/docs/lumi/operations/highlight/`
   템플릿에 기록할 수 있다(선택 사항, 이번 패키지의 필수 항목은 아님)

## 5. 호텔 운영 흐름 (전체 타임라인)

Starter Kit 3편은 단독으로 재생되는 것이 아니라, 호텔 체크인 전후
일정과 연결되어 실행된다. 이 흐름은
`daily-miracles-mvp/docs/constitution/candidate/CAND-BRAND-001_Haruharu_Miracle_Brand_Architecture.md`
§8(브랜드/운영 원칙 층위)과 동일한 내용을 실행 절차 관점에서 반복
기록한 것이다 — 두 문서가 어긋나면 안 되므로 변경 시 함께 갱신한다.

```
호텔 판매
  ↓
카카오톡 채널 (하루하루의 기적)
  ↓
Part 1 (The First Step)
  ↓
호흡항로
  ↓
15시 체크인
  ↓
Part 2 (The First Promise)
  ↓
21시 오로라5 안내
  ↓
Part 3 (The First Light)
  ↓
후기
  ↓
별들의 약속
```

**참고:** "호흡항로", "21시 오로라5 안내", "후기", "별들의 약속" 단계의
구체적 운영 방법(대본, 안내 문구, 후기 수집 방식 등)은 아직 이
문서에서 상세화되지 않았다 — 이번 갱신은 전체 흐름에서 Starter Kit
Part1/2/3이 어디에 위치하는지만 명확히 한 것이다.

## 6. 호텔 패키지 운영안

호텔 기본 서비스와 연계 가능한 항목:

- 오전 10~11시 캐리어 보관 안내
- 체크인은 기존 15시 유지
- 체크인 전 시간을 여행 경험으로 활용 (Part 1 시청 등)
- 가능 시 바다 전망 객실 우선 배정 (객실 상황에 따라 제공)

> **명확화:** 이는 호텔의 운영 정책을 변경하는 것이 아니라, 호텔이
> 이미 제공하는 기존 서비스를 DreamTown 상품 경험으로 연결하는
> 방식이다.

## 7. 문의 채널

Starter Kit 및 고객 문의는 카카오톡 채널 '하루하루의 기적'을 공식
문의 채널로 사용한다 — §3 안내문의 QR/재생 안내와 별개로, 문의
자체는 항상 이 채널로 유도한다.

## 8. 이번 패키지에서 하지 않은 것

- 새 영상 제작 없음 — Season 1 기존 3편만 사용
- 실제 QR 이미지 생성 없음 — 호스팅 URL이 없어 방식 A(로컬 재생)를
  즉시 실행 가능한 기본값으로 제시
- `dreamtown-assets/05_FINAL/`, `INDEX.md`, `README.md` 원본 자산 수정
  없음
- "호흡항로", "21시 오로라5 안내", "후기 수집", "별들의 약속"의 상세
  실행 방법은 아직 설계하지 않음 (§5 참고)
- 이번 이동(2026-07-17)에서 패키지 내용 자체는 변경하지 않음 — 저장
  위치와 경로 참조만 갱신

## 9. Pilot Freeze (2026-07-16)

`CAND-BRAND-001` §12와 동일하게, 1호 호텔 운영 종료 전까지 다음을
보류한다:

- 새로운 기능 개발
- 새로운 Starter Kit 제작 (v1.1 이상)
- 브랜드 구조 변경
- Lumi OS 외부 노출

운영 결과를 Review한 후 v1.1 개선 여부를 결정한다.
