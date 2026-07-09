---
code: SSOT-ENGINE-002
title: WishArt Adapter Plan — daily-miracles-mvp ↔ dreamtown-wishart
version: v0.1
status: Draft (설계안 — 실제 통합/코드 연결은 아직 수행하지 않음)
owner: Aurora5 / Claude Code
based_on: SSOT-ENGINE-001_DreamTown_Story_Engine_Draft.md, 실제 코드 조사(app.py, prompt_builder.py, image_generator.py)
updated: 2026-07-09
---

# SSOT-ENGINE-002 — WishArt Adapter Plan

> 이 문서는 **설계안**이다. `dreamtown-wishart`를 `daily-miracles-mvp`에 실제로 연결하지 않는다.
> 목적은 연결 방식을 먼저 확정하는 것이며, 구현은 별도 지시 이후 진행한다.

---

## 1. 목적

`dreamtown-wishart`의 `prompt_builder.py`(`build_wishart_package`)와 `image_generator.py`(`generate_wishart_from_photo`)를 DreamTown Core Story Engine의 실제 엔진으로 채택하되, `daily-miracles-mvp`(Node/Express)에서 이를 **어떻게 호출할지** 설계한다.

---

## 2. 현재 상태 (사실 확인)

### 2-1. `dreamtown-wishart`는 이미 독립 실행 가능한 FastAPI 서비스다
- `app.py:1-4` — `uvicorn app:app --reload --port 8000`로 로컬 구동. **배포 설정(Procfile/render.yaml/Dockerfile) 없음** — 현재는 로컬 전용으로 보인다.
- `app.py`는 `build_wishart_package`/`generate_wishart_from_photo`를 **직접 import해 인-프로세스로 호출**하지만, 노출된 라우트는 전부 세션 쿠키 기반 HTML 폼 페이지(`/wish`, `/partner-workshop/submit`, `/origin-checkin/submit` 등)이며, **서버-투-서버 호출에 적합한 JSON API는 없다.**

### 2-2. 실제 프로덕션 경로(`_run_generation`, app.py:242-303)는 4-Act 전체를 쓰지 않는다
- `build_wishart_package()`를 호출은 하지만, **`pkg["cut2"]`(2P) 하나만 꺼내서 `generate_wishart_from_photo()`에 넘긴다.** cut1/cut3/cut4는 만들지도, 저장하지도 않는다.
- 즉 **현재 실사용 중인 것은 "1장의 2P 이미지"이며, prompt_builder.py가 설계상 지원하는 1P~4P 전체 시퀀스는 실제로 발동되지 않고 있다.**
- 이는 SSOT-ENGINE-001이 전제한 "Master Asset = 1P~4P 4장"과 현재 운영 실태 사이의 **실질적 간극**이다 — 어댑터 설계 이전에 반드시 인지해야 할 사실.

### 2-3. 함수 시그니처 (실제 코드 기준)
```python
build_wishart_package(profile, identity_directives, wish, emotion, location=None,
                       include_ending=False, include_cta=False)
# 반환: { scene_lock, cut1, cut2, [cut3], [cut4], kling: {...}, pipeline_directive,
#         philosophy, evaluation_9q, evaluation_5q, photo_check }
# 또는 사전 게이트 실패 시: { action: "PHOTO_REJECT", photo_check, message }

generate_wishart_from_photo(photo_path, prompt, save_path,
                             scene_type="wish_moment", style_mode="wishart_wow")
# 사진을 gpt-image-2의 edit 레퍼런스로 사용, PNG를 save_path에 저장, save_path(str) 반환
```

### 2-4. 이미 존재하는 크로스 서비스 연결 (역방향)
- `dreamtown-wishart/daily_miracles_client.py`가 이미 `daily-miracles-mvp`의 `/api/dt/credentials/:code`를 HTTP로 호출하고 있다(이용권 검증). **HTTP 브리지 자체는 이미 검증된 패턴** — 단, 방향이 반대(wishart → mvp)다. 이번에 설계하는 것은 그 반대 방향(mvp → wishart).
- `daily-miracles-mvp`에는 Python을 `child_process`로 spawn하는 기존 패턴이 없다(npm script에서 CLI로 실행하는 것만 있고, 런타임 중 Node→Python 브리지는 없음).

### 2-5. 자격 증명
- 두 저장소 모두 `.env`의 `OPENAI_API_KEY`가 **동일한 값**(동일 OpenAI 계정)임을 확인했다. 별도 키 발급/공유 불필요.

---

## 3. 어댑터 방식 비교

| 방식 | 설명 | 장점 | 단점 |
|---|---|---|---|
| **A. HTTP JSON API (신규 엔드포인트)** | `dreamtown-wishart`에 `POST /api/story-engine/generate` 같은 신규 JSON 엔드포인트를 추가하고, `daily-miracles-mvp`가 이를 HTTP로 호출 | 기존 FastAPI 서비스 구조와 자연스럽게 맞음. 이미 역방향 HTTP 연결 전례 있음(§2-4). 두 저장소의 배포/스케일을 독립적으로 유지 가능 | `dreamtown-wishart` 쪽에 신규 엔드포인트 구현 필요(현재 없음). 두 서비스가 동시에 떠 있어야 함(현재 wishart는 로컬 전용, 배포 설정 없음) |
| **B. child_process spawn (Python 스크립트 직접 실행)** | Node에서 `child_process.spawn('python', [...])`으로 `prompt_builder.py`/`image_generator.py`를 직접 호출 | 신규 서버 불필요, 별도 배포 불필요 | daily-miracles-mvp가 Python 런타임/의존성(openai SDK 등)을 함께 가져야 함. 기존 patterns 없음(신규 도입). 프로세스 관리·에러 전파가 HTTP보다 복잡 |
| **C. 공유 패키지/모노레포 통합** | 두 저장소를 하나로 합치거나 공용 패키지화 | 장기적으로 가장 깔끔 | 저장소 구조 전체를 바꾸는 매우 큰 작업, 현재 범위를 벗어남 |

### 권장안: **A. HTTP JSON API**

- `dreamtown-wishart`가 이미 FastAPI로 구동 중이고 역방향 HTTP 연결 전례가 있어 가장 자연스럽다.
- 단, **배포 설정이 없다는 점(§2-1)은 실제 통합 전에 반드시 해결해야 할 선행 과제**로 남겨둔다(이 문서는 설계만 하고 배포는 다루지 않음).
- child_process 방식(B)은 신규 패턴 도입 비용과 프로세스 관리 복잡도가 커서 비권장하나, wishart 배포가 지연될 경우의 임시 대안으로 남겨둔다.

---

## 4. 제안하는 Adapter 계약 (초안 — 미구현)

### Request (`daily-miracles-mvp` → `dreamtown-wishart`)
```json
POST /api/story-engine/generate
{
  "photo_ref": "string (사진 경로 또는 업로드 참조)",
  "wish": "string (원문)",
  "emotion": "치유|감사|지혜|새출발|용기 (선택, 생략 시 자동 분류)",
  "location": "ODONGDO|YISUNSIN|HAMEL|EXPO|CABLECAR|MINAM (선택)",
  "acts": ["1P","2P","3P","4P"],   // 생성할 Act 지정 (현재 운영은 2P만 사용 — §2-2)
  "profile": { "person_count": 0, "relationship": "", "expression_state": "" }
}
```

### Response
```json
{
  "status": "OK | PHOTO_REJECT | QC_FAILED",
  "story_data": { "...SSOT-ENGINE-001 §2 스키마..." },
  "assets": [
    { "act": "1P", "image_url": "...", "prompt_log": "..." },
    { "act": "2P", "image_url": "...", "prompt_log": "..." }
  ],
  "qc": { "reveal_rule_passed": true, "identity_passed": true, "no_future_prediction": true }
}
```

> 이 계약은 **초안**이며, 실제 구현 시 `build_wishart_package`/`generate_wishart_from_photo`의 반환 구조(§2-3)를 그대로 매핑하는 방향으로 확정한다.

---

## 5. 신규로 필요한 작업 (실행하지 않음, 목록만)

1. `dreamtown-wishart`에 위 §4 계약에 맞는 신규 API 엔드포인트 추가 (현재 없음).
2. `_run_generation()`을 cut2 단독 호출에서 `acts` 파라미터 기반 다중 Act 호출로 확장할지 결정 (현재는 §2-2에서 확인한 대로 2P만 생성).
3. `dreamtown-wishart`의 프로덕션 배포 설정(Procfile/render.yaml 등) 마련 — 현재 로컬 전용.
4. `daily-miracles-mvp`에서 이 신규 엔드포인트를 호출하는 클라이언트 모듈 작성(§2-4의 기존 역방향 클라이언트 `daily_miracles_client.py`를 참고 모델로 활용 가능).
5. 두 서비스 간 인증 방식 결정(API 키 헤더 등 — 현재 역방향 연결의 인증 방식을 참고).

---

## 6. 리스크 / 미해결 사항

- `dreamtown-wishart`가 현재 로컬 전용이라, 프로덕션에서 `daily-miracles-mvp`가 이를 호출하려면 배포부터 선행되어야 한다.
- 현재 실사용 경로가 2P 단일 이미지만 생성하므로, 4P 전체 사용으로 전환 시 OpenAI 비용이 최대 4배 증가할 수 있다 — 예산 정책 재검토 필요(SSOT-PRICE-001의 원가 구조에 반영 안 되어 있음).
- 동일 OpenAI 키를 양쪽이 공유하므로, 두 서비스의 동시 호출량이 늘어나면 레이트리밋/비용 추적을 어느 한쪽에서 통합 관리할지 결정 필요.
- 이 문서는 통합을 설계만 했을 뿐 실행하지 않았다. 실제 연결은 대표 승인 후 별도 지시로 진행한다.
