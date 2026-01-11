# FAIL Tags Standard v1.0

> 실패 원인 분류 표준 - 자동화 및 분석의 핵심

---

## 태그 목록 (7종)

| 태그 | 설명 | 심각도 | 자동 수정 가능 |
|------|------|--------|---------------|
| `CAST_MISSING` | 6명 중 누락 (5명 이하) | CRITICAL | No |
| `NEW_CHARACTER` | 신규 인물/마스코트 생성 | CRITICAL | No |
| `IDENTITY_DRIFT` | 얼굴/종/의상/색/실루엣 변형 | HIGH | Partial |
| `SEAT_DRIFT` | 좌석/배치 붕괴 | HIGH | No |
| `MARKER_WEAK` | 코미/코드/루미 구분 마커 약화 | MEDIUM | Yes |
| `STYLE_DRIFT` | 수채화 톤/라인/질감 붕괴 | HIGH | No |
| `TEXT_LOGO` | 텍스트/워터마크 발생 | LOW | Partial |

---

## 태그별 상세

### `CAST_MISSING`
- **증상**: 화면에 5명 이하 등장, 1명 이상 누락
- **원인**: 프롬프트 미준수, 엔진 한계
- **판정**: FAILED
- **액션**: 재생성 필수

### `NEW_CHARACTER`
- **증상**: 정의되지 않은 새 캐릭터/마스코트 출현
- **원인**: "6명" 지시 무시, 창작 발생
- **판정**: FAILED
- **액션**: 재생성 필수

### `IDENTITY_DRIFT`
- **증상**: 기존 캐릭터의 얼굴/종족/의상/컬러 변형
- **예시**: 푸르미르가 여성으로, 코미가 녹색으로
- **판정**: FAILED (심각) / NEEDS_REVIEW (경미)
- **액션**: 경미 시 Repair Loop, 심각 시 재생성

### `SEAT_DRIFT`
- **증상**: 지정 좌석과 다른 위치에 캐릭터 배치
- **예시**: 푸르미르가 구석으로, 재미가 중앙으로
- **판정**: FAILED (완전 붕괴) / NEEDS_REVIEW (약간 이동)
- **액션**: 재생성 권장

### `MARKER_WEAK`
- **증상**: 블루/민트 계열 캐릭터 구분 어려움
- **대상**: 코미(오션블루), 루미(민트틸), 코드(시안+네이비)
- **판정**: NEEDS_REVIEW
- **액션**: Repair Loop로 마커 강화

### `STYLE_DRIFT`
- **증상**: 지브리+수채화 스타일 붕괴
- **예시**: 3D 렌더, 실사풍, 애니메이션 변형
- **판정**: FAILED
- **액션**: 재생성 필수

### `TEXT_LOGO`
- **증상**: 이미지 내 텍스트, 로고, 워터마크
- **판정**: NEEDS_REVIEW (작음) / FAILED (눈에 띔)
- **액션**: 편집으로 제거 시도 또는 재생성

---

## 복합 태그 처리

여러 태그가 동시에 발생할 경우:

| 조합 | 판정 |
|------|------|
| CRITICAL 태그 1개 이상 | FAILED |
| HIGH 태그 2개 이상 | FAILED |
| HIGH 태그 1개 | NEEDS_REVIEW |
| MEDIUM/LOW만 | NEEDS_REVIEW |

---

## 태그 기록 예시

```markdown
## FAIL Tags
- `MARKER_WEAK`: 코미/코드 블루 계열 구분 어려움
- `IDENTITY_DRIFT` (minor): 루미 크리스탈 장식 약화
```

---

## 태그별 통계 활용

월간/분기별 태그 빈도 분석으로:
- 가장 빈번한 실패 원인 파악
- 프롬프트 개선 방향 도출
- 엔진별 특성 파악

---

*Aurora5 Visual OS v1.0*
