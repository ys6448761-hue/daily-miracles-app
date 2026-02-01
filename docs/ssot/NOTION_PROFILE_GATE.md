# Notion DB Profile Gate 가이드

> **목적**: Notion DB에서 영상 제작 시 프로필 선택 강제 및 충돌 방지
> Last updated: 2026-02-01

---

## 1. Episodes DB 필수 필드 추가

### track (Select - 필수)

| 값 | 설명 |
|----|------|
| `sora_cinematic` | Sora 시네마틱 한국 드라마 스타일 |
| `2d_ghibli_webtoon` | 2D 지브리+한국 웹툰 융합 스타일 |

**설정:**
- Type: Select
- Required: ✅ (필수)
- Default: 없음 (선택 강제)

---

## 2. Scenes DB 자동 상속 규칙

### track_inherited (Formula)

```
prop("Episode").prop("track")
```

**목적:** Episode에서 track을 자동 상속하여 Scene 레벨에서 일관성 유지

---

## 3. Conflict Gate (자동화)

### conflict_check (Formula)

```
if(
  prop("track_inherited") == "sora_cinematic" and
  contains(prop("prompt"), "2D") or contains(prop("prompt"), "Ghibli") or contains(prop("prompt"), "webtoon"),
  "❌ CONFLICT: Sora에 2D 키워드 발견",
  if(
    prop("track_inherited") == "2d_ghibli_webtoon" and
    contains(prop("prompt"), "cinematic") or contains(prop("prompt"), "shallow depth of field") or contains(prop("prompt"), "filmic"),
    "❌ CONFLICT: 2D에 Sora 키워드 발견",
    "✅ PASS"
  )
)
```

---

## 4. Profile Injection 자동화

### 4.1 Sora Track Injection

Episode.track == `sora_cinematic` 일 때 자동 삽입:

```
[AUTO-INJECT: sora_cinematic]
1080x1920, 9:16 vertical, cinematic Korean drama aesthetic,
shallow depth of field, filmic lighting, 24fps.
Avoid readable on-screen text and watermarks; add captions in post.
```

### 4.2 2D Track Injection

Episode.track == `2d_ghibli_webtoon` 일 때 자동 삽입:

```
[AUTO-INJECT: 2d_ghibli_webtoon]
9:16 vertical, pure 2D animation, Ghibli+Korean webtoon fusion style,
NO 3D elements, cel animation aesthetic, hand-drawn line art with visible brush strokes.
```

---

## 5. 금지 키워드 자동 차단

### 5.1 Sora Track 금지

`sora_cinematic` 선택 시 프롬프트에서 차단:
- `2D`, `cel animation`, `hand-drawn`, `webtoon`, `Ghibli`
- `flat color`, `ink line art`, `watercolor wash`

### 5.2 2D Track 금지

`2d_ghibli_webtoon` 선택 시 프롬프트에서 차단:
- `photorealistic`, `3D render`, `CGI`, `Unreal Engine`
- `cinematic lighting`, `shallow depth of field`, `filmic`
- `lens flare`, `bokeh`, `ray tracing`

---

## 6. CTA DB 연동

### track_source (Relation)

CTA는 반드시 동일 track의 Scenes만 참조 가능:

```
CTA.track == Scene.track_inherited
```

**위반 시:**
- 자동화 스크립트에서 경고
- Export 차단

---

## 7. Notion Automation 설정

### 7.1 신규 Episode 생성 시

1. track 필드 선택 강제 (빈 값 저장 불가)
2. 선택 시 해당 profile의 `injection` 텍스트를 Description에 자동 삽입

### 7.2 Scene 프롬프트 저장 시

1. `conflict_check` Formula 자동 실행
2. `❌ CONFLICT` 발생 시:
   - Status를 `Blocked`로 변경
   - 담당자에게 알림 발송

### 7.3 Export 요청 시

1. 해당 Episode의 모든 Scene이 `✅ PASS` 인지 확인
2. 하나라도 `❌ CONFLICT`면 Export 차단
3. LINT_REPORT 자동 생성 후 첨부

---

## 8. 구현 체크리스트

| 단계 | 작업 | 상태 |
|------|------|------|
| 1 | Episodes DB에 `track` Select 필드 추가 | ⬜ |
| 2 | Scenes DB에 `track_inherited` Formula 추가 | ⬜ |
| 3 | Scenes DB에 `conflict_check` Formula 추가 | ⬜ |
| 4 | Notion Automation 설정 (Episode 생성) | ⬜ |
| 5 | Notion Automation 설정 (Scene 저장) | ⬜ |
| 6 | Export Gate 스크립트 연동 | ⬜ |

---

## 9. Profile 파일 참조

| Track | Profile 파일 | GitHub 경로 |
|-------|-------------|-------------|
| Sora | sora_cinematic.yaml | `profiles/sora_cinematic.yaml` |
| 2D | 2d_ghibli_webtoon.yaml | `profiles/2d_ghibli_webtoon.yaml` |

---

## 10. 트러블슈팅

### Q: "CONFLICT 오류가 계속 발생해요"

1. Episode의 `track` 값 확인
2. Scene 프롬프트에 상충 키워드가 있는지 확인
3. 해당 track의 `profiles/*.yaml` → `forbidden` 섹션 참고

### Q: "트랙을 변경하고 싶어요"

1. Episode 수준에서 `track` 변경
2. 해당 Episode의 모든 Scene 프롬프트 재검토 필요
3. LINT 재실행 필수

---

*참조: profiles/sora_cinematic.yaml, profiles/2d_ghibli_webtoon.yaml*
