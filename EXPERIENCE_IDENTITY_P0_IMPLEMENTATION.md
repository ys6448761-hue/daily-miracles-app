# Experience Identity P0 — 구현 완료 보고서

**작성일:** 2026-08-25  
**상태:** IMPLEMENTATION COMPLETE (DB 마이그레이션 없음)  
**담당:** Claude Code P0 Infrastructure  

---

## 개요

Experience Identity P0는 소원그림 생성 시 고객의 DreamTown Experience 자격을 명시적으로 추적 가능하게 하는 인프라입니다.

### 핵심 설계 원칙

✅ **DB 변경 없음** — 현재 스키마 완전 유지  
✅ **API 레벨 구현** — 요청·응답·로그에서 완전 추적  
✅ **향후 DB 저장 전제** — Experience Identity 객체는 영속화 가능 구조  
✅ **Backward Compatible** — 기존 클라이언트 호환성 100%  

---

## 구현 파일 목록

### 1. Config & Models

**파일:** `config/experienceIdentity.js`  
**역할:** Experience Identity 상수 및 모델 정의

```javascript
// 5가지 Experience Type
ExperienceType = {
  STARLIGHT_ROUTE,           // 기본 여행 플래닝
  AQUA_ADDON,                // 아쿠아플라넷 추가
  CABLECAR_TICKET,           // 해상케이블카 탑승권
  CRUISE_TICKET,             // 크루즈 예약권
  CABLECAR_PHOTO_EXPERIENCE  // 향후: 포토존
}

// 자격 출처
ExperienceSource = {
  PURCHASE,           // 유료 구매
  GIFT,               // 선물/증정
  PARTNERSHIP,        // 파트너십
  SYSTEM_DEFAULT      // 시스템 기본값
}

// 우선순위 (Scene 결정)
ExperiencePriority = {
  CABLECAR_PHOTO_EXPERIENCE: 5,
  CABLECAR_TICKET: 4,
  AQUA_ADDON: 3,
  CRUISE_TICKET: 2,
  STARLIGHT_ROUTE: 1
}

// Experience → Scene 매핑
ExperienceToScene = {
  CABLECAR_PHOTO_EXPERIENCE: 'CABLECAR_PHOTO_SCENE',
  CABLECAR_TICKET: 'CABLECAR_SCENE',
  AQUA_ADDON: 'AQUA_SCENE',
  CRUISE_TICKET: 'CRUISE_SCENE',
  STARLIGHT_ROUTE: 'YEOSU_ORIGIN'
}
```

---

### 2. Core Logic Services

**파일:** `services/sceneResolver.js`  
**역할:** Experience 배열에서 최우선 Scene 결정

**함수:**
- `resolveScene(experiences[], rid)` → `{ scene, appliedExperience, reason }`
- `sceneToPromptBuilder(scene)` → builder function name

**로직:**
```
input: experiences[]
  ↓
[filter: null/undefined 제외]
  ↓
[sort: priority DESC]
  ↓
[top experience 선택]
  ↓
[Scene 매핑]
  ↓
output: scene (또는 기본값 YEOSU_ORIGIN)
```

---

**파일:** `services/experienceValidator.js`  
**역할:** Experience 검증 (스키마 + DB 확인)

**함수:**
- `validateExperienceSchema(exp)` → `{ valid, errors[] }`
  - Type, Source 값 검증
  - PURCHASE인 경우 order_id 필수 확인
  - acquired_at ISO8601 형식 검증

- `validateExperiences(experiences[], rid)` → `{ valid, errors[], validated[] }`
  - 배열 내 모든 exp 검증
  - PURCHASE인 경우 order_id ↔ dt_payments 교차 확인
  - DB 조회: `SELECT status FROM dt_payments WHERE order_id=?`
  - 상태가 'paid'인 것만 유효

- `getDefaultExperiences(sku, source)` → `experiences[]`
  - SKU → STARLIGHT_ROUTE로 기본값 생성
  - 예: 'YW_BASIC_7' → STARLIGHT_ROUTE (SYSTEM_DEFAULT)

---

### 3. API Routes 수정

#### 파일: `routes/wishImageRoutes.js`

**변경 사항:**

1. **Import 추가** (line 23-24)
   ```javascript
   const { validateExperiences, getDefaultExperiences } = require('../services/experienceValidator');
   const { resolveScene } = require('../services/sceneResolver');
   ```

2. **Handler 수정:** `POST /api/wish-image/generate` (line 162-213)
   - 파라미터 추가: `experiences` (선택사항)
   - Experience 검증 (존재 시)
   - Scene Resolver 호출
   - 로그: `[WishImage] [${rid}] Scene resolved: ${scene}`
   - 응답에 `experience_identity` 필드 추가

**응답 예시:**
```json
{
  "success": true,
  "image_url": "/images/wishes/wish_1724668200000_ruby.png",
  "gem_type": "ruby",
  "experience_identity": {
    "scene": "AQUA_SCENE",
    "applied_experience": {
      "type": "AQUA_ADDON",
      "source": "PURCHASE",
      "order_id": "PAY20260825ABC123"
    }
  }
}
```

**Backward Compatibility:**
- `experiences` 파라미터 없으면 자동으로 STARLIGHT_ROUTE 기본값 사용
- 기존 클라이언트: 동일한 응답 (+ experience_identity 추가)

---

#### 파일: `routes/yeosuWishRoutes.js`

**변경 사항:**

1. **Import 추가** (line 30-31)
   ```javascript
   const { validateExperiences, getDefaultExperiences } = require('../services/experienceValidator');
   const { resolveScene } = require('../services/sceneResolver');
   ```

2. **Handler 수정:** `POST /api/yeosu/wish` (line 238-340)
   - 파라미터 추가: `experiences` (선택사항)
   - Experience 검증 (존재 시, 없으면 SKU 기본값)
   - 검증된 experiences를 processWishImage에 전달
   - 로그: `[YeosuWish] [${rid}] wish_id=${id} validated ${count} experiences`

3. **Helper 함수 수정:** `processWishImage(wishId, experiences[], rid)` (line 352-398)
   - 파라미터 추가: `experiences`, `rid`
   - Scene Resolver 호출
   - 로그: `[YeosuWish] [${rid}] ${wishId} scene resolution: ${scene}`

---

### 4. 테스트

**파일:** `tests/experienceIdentity/experienceIdentity.test.js`

**Test Coverage:**
1. Experience Type 정의 (5개)
2. Experience Source 정의 (4개)
3. Scene Resolver — 빈 배열
4. Scene Resolver — 단일 experience
5. Scene Resolver — 우선순위 (CABLECAR > AQUA)
6. Scene Resolver — Null/Undefined 필터링
7. Scene → Prompt Builder 매핑
8. Schema Validation — 정상
9. Schema Validation — Missing order_id 감지
10. Default Experience 생성

**실행:**
```bash
node tests/experienceIdentity/experienceIdentity.test.js
```

**결과:** ✅ 21/21 PASS

---

## 데이터 흐름

### Scenario 1: 기본 소원그림 (experiences 없음)

```
POST /api/wish-image/generate {
  "wish_content": "좋은 일이 일어나길",
  "gem_type": "ruby"
  // experiences 생략
}
  ↓
[getDefaultExperiences('ruby') → STARLIGHT_ROUTE]
  ↓
[resolveScene([STARLIGHT_ROUTE]) → YEOSU_ORIGIN]
  ↓
[DALL-E 생성 (gem 기반 프롬프트)]
  ↓
Response: {
  image_url: "...",
  experience_identity: {
    scene: "YEOSU_ORIGIN",
    applied_experience: { type: "STARLIGHT_ROUTE", source: "SYSTEM_DEFAULT" }
  }
}
```

---

### Scenario 2: 구매 자격 포함 (experiences 있음)

```
POST /api/wish-image/generate {
  "wish_content": "아쿠아플라넷 방문하고 싶어",
  "gem_type": "sapphire",
  "experiences": [
    {
      "type": "AQUA_ADDON",
      "source": "PURCHASE",
      "order_id": "PAY20260825ABC123"
    }
  ]
}
  ↓
[validateExperiences([...])]
  ├─ Schema check: ✓
  └─ DB check: dt_payments WHERE order_id='PAY20260825ABC123' AND status='paid' ✓
  ↓
[resolveScene([AQUA_ADDON]) → AQUA_SCENE]
  ↓
Log: [WishImage] [rid] Scene resolved: AQUA_SCENE (type=AQUA_ADDON, source=PURCHASE, order_id=PAY20260825ABC123)
  ↓
[NOTE: 현재는 여전히 gem 기반 프롬프트 사용]
[향후 AQUA_SCENE 프롬프트 구현 시 여기서 선택]
  ↓
Response: {
  image_url: "...",
  experience_identity: {
    scene: "AQUA_SCENE",
    applied_experience: { type: "AQUA_ADDON", source: "PURCHASE", order_id: "PAY20260825ABC123" }
  }
}
```

---

### Scenario 3: 여수 소원그림 + 구매 자격

```
POST /api/yeosu/wish {
  "customer_name": "김소원",
  "customer_phone": "01012345678",
  "wish_text": "여수 여행 가고 싶어",
  "sku": "YW_BASIC_7",
  "experiences": [
    {
      "type": "CABLECAR_TICKET",
      "source": "PURCHASE",
      "order_id": "PAY20260825XYZ789"
    },
    {
      "type": "AQUA_ADDON",
      "source": "PURCHASE",
      "order_id": "PAY20260825XYZ789"
    }
  ]
}
  ↓
[validateExperiences([CABLECAR_TICKET, AQUA_ADDON])]
  ├─ Both order_ids verified in dt_payments (status='paid')
  └─ validated = [CABLECAR_TICKET, AQUA_ADDON]
  ↓
[processWishImage(wishId, [CABLECAR_TICKET, AQUA_ADDON])]
  ├─ resolveScene([...]) → CABLECAR_SCENE (우선순위 4 > 3)
  └─ Log: [YeosuWish] [rid] ${wishId} scene resolution: CABLECAR_SCENE
  ↓
[DALL-E 생성 (현재: buildYeosuWishPrompt, 향후: buildCablecarWishPrompt)]
  ↓
DB Update: yeosu_wishes.status = 'COMPLETED', result_image_url = '...'
```

---

## 로깅 추적

모든 Experience Identity 결정은 로그에 기록되어 향후 분석/감사에 사용 가능:

```
[SceneResolver] [rid] Resolved scene: AQUA_SCENE (type=AQUA_ADDON, source=PURCHASE) order_id=PAY20260825ABC123
[ExperienceValidator] [rid] Verified order_id=PAY20260825ABC123, amount=64000
[WishImage] [rid] Scene resolved: AQUA_SCENE
[YeosuWish] [rid] wish_id=YW-20260825-A1B2 scene resolution: CABLECAR_SCENE
```

---

## 향후 확장 가능성

### Phase 2: AQUA_SCENE 프롬프트 구현

```javascript
// 추가 파일: services/promptTemplates.js (설계만 완료)

const prompts = {
  'YEOSU_ORIGIN': yeosuWishRoutes.buildYeosuWishPrompt,
  'AQUA_SCENE': buildAquaWishPrompt,  // TODO
  'CABLECAR_SCENE': buildCablecarWishPrompt,  // TODO
  'CRUISE_SCENE': buildCruiseWishPrompt,  // TODO
  'CABLECAR_PHOTO_SCENE': buildCablecarPhotoWishPrompt  // TODO
};

function selectPromptTemplate(scene, wishText, gemType) {
  const promptFn = prompts[scene] || prompts['YEOSU_ORIGIN'];
  return promptFn(wishText, gemType);
}
```

### Phase 3: DB 영속화

```sql
-- 향후 추가 가능 (현재는 구현 금지)

ALTER TABLE yeosu_wishes
  ADD COLUMN experiences JSONB DEFAULT '[]';

CREATE TABLE experience_credentials (
  id UUID PRIMARY KEY,
  customer_phone VARCHAR(20),
  experience_type VARCHAR(50),
  order_id VARCHAR(100),
  acquired_at TIMESTAMP DEFAULT NOW()
);
```

### Phase 4: 통합 Experience 관리 API

```
GET /api/customer/:phone/experiences → 고객 보유 자격 목록
POST /api/admin/experience-grant → 관리자 자격 부여
```

---

## 테스트 방법

### 1. 단위 테스트 (DB 불필요)

```bash
node tests/experienceIdentity/experienceIdentity.test.js
```

### 2. 통합 테스트 (DB 필요) — TODO

```bash
# Development 환경에서 실행
NODE_ENV=development node tests/experienceIdentity/integration.test.js
```

### 3. 수동 테스트

#### Test A: 기본 wish-image API

```bash
curl -X POST http://localhost:5100/api/wish-image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "wish_content": "좋은 일 많이",
    "gem_type": "ruby"
  }'

# 응답: experience_identity.scene = "YEOSU_ORIGIN"
```

#### Test B: Experience 포함

```bash
curl -X POST http://localhost:5100/api/wish-image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "wish_content": "아쿠아 가고 싶어",
    "gem_type": "sapphire",
    "experiences": [
      {
        "type": "AQUA_ADDON",
        "source": "PURCHASE",
        "order_id": "PAY20260825ABC123"
      }
    ]
  }'

# 응답: experience_identity.scene = "AQUA_SCENE" (DB에 PAY... 존재 시)
```

---

## Backward Compatibility 검증

| 기존 클라이언트 | 동작 | 비고 |
|---|---|---|
| `POST /api/wish-image/generate` (experiences 없음) | ✅ 정상 작동 | 기본값 STARLIGHT_ROUTE 사용 |
| `POST /api/yeosu/wish` (experiences 없음) | ✅ 정상 작동 | SKU에서 기본값 결정 |
| 기존 응답 해석 | ✅ 호환 | experience_identity는 새로운 필드 (무시 가능) |

---

## 문제 해결

### Q1: "validateExperiences가 DB 없이 작동하는가?"

A: 스키마 검증만 수행. PURCHASE 자격의 경우 order_id ↔ dt_payments 교차 확인은 DB가 필요합니다. 로컬 SQLite 또는 운영 PostgreSQL 모두 지원.

### Q2: "향후 DB에 저장할 때 마이그레이션이 필요한가?"

A: 선택적입니다.
- **Option A (권장):** yeosu_wishes.experiences JSONB 추가 (간단)
- **Option B:** 별도 experience_credentials 테이블 (복잡하지만 확장성)

### Q3: "현재 AQUA_SCENE, CABLECAR_SCENE 프롬프트는?"

A: 아직 구현 안 됨 (P0 설계만 완료). Scene resolver는 준비됨. 향후 promptTemplates.js에서 구현.

---

## 배포 체크리스트

- ✅ 코드 변경 완료
- ✅ 로컬 테스트 통과 (21/21)
- ✅ Backward Compatibility 확인
- ⏳ DB 마이그레이션 (P0에서는 불필요)
- ⏳ Production 배포 (smoke test 필요)

---

## 다음 단계

1. **AQUA_SCENE 프롬프트** 구현 (선택사항, Phase 2)
2. **클라이언트 통합** — 실제로 experiences 파라미터 전달
3. **감사 로그** 수집 및 분석
4. **DB 영속화** (필요 시, Phase 3)

---

**상태:** P0 구현 완료 ✅  
**배포 준비:** 즉시 가능 (DB 변경 불필요)  
**위험도:** LOW (기존 기능에 영향 없음)  

