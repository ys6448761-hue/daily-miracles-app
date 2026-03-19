# DreamTown Galaxy UI Architecture SSOT

Version: v1.0
Created: 2026-03-19
Status: CONFIRMED
Owner: Aurora5 / 루미

---

## 선언

이 문서는 DreamTown Galaxy 선택 화면의 구현 아키텍처를 고정한다.
모든 구현자(Claude Code 포함)는 이 문서를 먼저 읽고 작업한다.

---

## 1. 구조 원칙

```
features/galaxy/
├── constants/          ← 배치 고정값 / 모션 프리셋 / 문구
├── hooks/              ← 상태머신 / 모션 스타일
└── components/         ← UI 조각 (상태는 GalaxySelectionScreen만 소유)

pages/Galaxy.jsx        ← 얇은 래퍼 (라우팅 + 탭바만)
```

**페이지 레벨은 얇은 래퍼만 허용한다.**
비즈니스 로직, 상태, 모션 계산은 모두 features/galaxy 아래에 있어야 한다.

---

## 2. 파일 책임 고정

| 파일 | 단일 책임 | 변경 허용 범위 |
|------|----------|--------------|
| `constants/galaxyLayout.js` | 나침반 배치 좌표 | 좌표값만 (방향 추가/삭제 금지) |
| `constants/galaxyMotion.js` | 모션 프리셋 수치 | 수치값만 (프리셋 키 변경 금지) |
| `constants/galaxyCopy.js` | 선택 전/후 문구 | 문구 텍스트만 |
| `hooks/useStarMotion.js` | 별 감각 차이 생성 | 이 파일 외부에서 별 차이 만들기 금지 |
| `hooks/useGalaxySelection.js` | 선택 상태머신 | 상태 전이 순서 변경 금지 |
| `components/Star.jsx` | 최소 별 단위 렌더링 | 텍스트/아이콘 추가 금지 |
| `components/StarField.jsx` | 4개 별 배치 | STAR_CONFIGS 기반 유지 |
| `components/SelectionTransition.jsx` | 선택 여운 오버레이 | 단독 파일 유지 필수 |
| `components/SelectionHint.jsx` | 선택 전/후 문장 | 문장 노출 타이밍만 |
| `components/GalaxySelectionScreen.jsx` | 상태 소유 + 조합 | 유일한 상태 소유자 |

---

## 3. 절대 규칙 (DEC-2026-0319-001 기반)

### 3-1. 라벨 비노출
```
❌ 금지: "도전", "성장", "관계", "치유" 텍스트를 UI에 노출
✅ 허용: 코드 내부 enum/key 값으로만 사용
```

### 3-2. 별 차이 생성 위치
```
❌ 금지: useStarMotion.js 외부에서 별의 감각 차이 생성
✅ 허용: useStarMotion.js 내 MOTION_PRESETS에서만 drift/glow 정의
```

모든 별은 색상·크기·형태가 동일하다.
차이는 움직임 방향과 빛 퍼짐 방향뿐이다.

### 3-3. 상태머신 기준
```
선택 전환 로직은 useGalaxySelection.js 상태머신을 기준으로 유지한다.

상태 전이:
idle → selecting → transitioning → complete

- 중복 클릭 방지: phase !== 'idle'이면 무시
- 타이밍: selecting(600ms) → transitioning(900ms) → complete
- 외부 타이머/직접 상태 변경 금지
```

### 3-4. 모션 수치 범위
```
호흡 주기:    4 ~ 6초
크기 변화:    98% ~ 102%
밝기 변화:    92% ~ 100%
선택 전환:    0.5 ~ 1초
배경 암전:    0.9초 ease-in-out
```

### 3-5. 금지 목록
```
❌ 카테고리 UI화
❌ 별 위 또는 근처 라벨
❌ 툴팁 / 설명 팝업
❌ 강한 애니메이션 (팝, 번쩍임)
❌ 색상 기반 의미 구분
❌ 빠른 인터랙션 (0.3초 미만 전환)
❌ GalaxySelectionScreen 외부에서 selectedDirection 상태 소유
```

---

## 4. 상태머신 다이어그램

```
[idle]
  ↓ 별 클릭
[selecting]       ← 배경 어두워지기 시작, 문장 등장
  ↓ 600ms
[transitioning]   ← 여운 구간
  ↓ 900ms
[complete]        ← onComplete(direction) 호출
```

---

## 5. 확장 시 규칙

| 상황 | 올바른 방법 |
|------|-----------|
| 별 위치 변경 | `galaxyLayout.js` STAR_CONFIGS만 수정 |
| 모션 수치 조정 | `galaxyMotion.js` MOTION_PRESETS만 수정 |
| 선택 후 문구 변경 | `galaxyCopy.js` POST_TEXT만 수정 |
| 전환 여운 조정 | `SelectionTransition.jsx`만 수정 |
| 상태 타이밍 조정 | `useGalaxySelection.js`만 수정 |
| Flutter 포팅 | constants/ → Dart 상수, hooks/ → Provider/Riverpod, components/ → Widget |

---

## 6. UX 목표 (불변)

> 이 화면의 목표는 "선택 UI"가 아니라 "스며드는 경험"이다.

사용자는 "선택했다"가 아니라 **"끌렸다", "들어갔다", "스며들었다"** 라고 느껴야 한다.

---

## 참조

- `DreamTown_Galaxy_UI_SSOT.md` — 철학 및 라벨 정책
- `DEC-2026-0319-001` — 라벨 비노출 결정 기록
- `features/galaxy/` — 구현 파일 전체
