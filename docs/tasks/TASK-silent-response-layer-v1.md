# TASK: Silent Response Layer v1 구현 지시서

> **담당:** Code Master  
> **준비:** Antigravity (이 파일 + JSON config 생성 완료)  
> **우선순위:** P1  
> **접촉 파일 수:** 3개 (신규 1 + 수정 2)

---

## 배경 / 현재 구조 파악

```
safetyFilter.js → classifyWish(text) → { level: 'RED'|'YELLOW'|'GREEN', reason }

routes/dreamtownRoutes.js POST /api/dt/wishes:
  1. classifyWish(wish_text)
  2. RED  → notifyRedSignal() + care_message 반환 (wish 저장 안 함)
  3. YELLOW → wish 저장 (safety_level='YELLOW'), star isHidden=true — 사용자 UX 차이 없음
  4. GREEN  → wish 저장, 정상 흐름

WishGate.jsx:
  - postWish() → wishResult
  - wishResult.safety === 'RED' → setCareMessage() (별 생성 안 함)
  - 그 외 → postStarCreate() → nav('/star-birth')
```

**Silent Response Layer는 이 흐름 위에 레이어로 추가된다. 기존 코드는 건드리지 않는다.**

---

## 파일 1: `services/silentResponseService.js` (신규 생성)

```js
'use strict';

const crypto = require('crypto');
const MESSAGES = require('../config/silent-response-messages.json');

// ────────────────────────────────────────────────────────────
// VIP 패턴 — 간절함/오랜 버팀이 느껴지는 소원 (수기 답장 후보)
// ────────────────────────────────────────────────────────────
const VIP_PATTERNS = [
  '버티고', '버텼', '버텨', '포기하지 않', '포기 안',
  '마지막', '기적이', '살아있', '살아가', '살아보',
  '혼자서도', '아무도 몰', '아무도 모르', '말 못 했',
  '말 못했', '3년', '5년', '10년', '오래',
];

/**
 * wish_text에서 VIP 패턴 감지
 */
function detectVip(wishText) {
  const text = (wishText || '').toLowerCase();
  return VIP_PATTERNS.some(p => text.includes(p));
}

/**
 * 감정 강도 분석
 * safetyLevel: 기존 classifyWish 결과 ('RED'|'YELLOW'|'GREEN')
 * 반환: 'green' | 'yellow' | 'red' | 'vip'
 *
 * - RED safety → 항상 'red' (기존 신호등 연결)
 * - YELLOW safety + VIP 패턴 → 'vip' (수기 답장 후보 + YELLOW UX)
 * - YELLOW safety → 'yellow'
 * - GREEN safety + VIP 패턴 → 'vip'
 * - GREEN → 'green'
 */
function analyzeEmotionalIntensity(safetyLevel, wishText) {
  if (safetyLevel === 'RED') return 'red';

  const isVip = detectVip(wishText);

  if (safetyLevel === 'YELLOW') {
    return isVip ? 'vip' : 'yellow';
  }

  // GREEN safety
  return isVip ? 'vip' : 'green';
}

/**
 * 감정 레벨에 맞는 응답 설정 반환
 */
function getSilentConfig(level) {
  const pool = level === 'red' ? MESSAGES.red
             : level === 'yellow' || level === 'vip' ? MESSAGES.yellow
             : null;

  const message = pool
    ? pool[Math.floor(Math.random() * pool.length)]
    : null;

  const timing  = MESSAGES.timing;
  const ctaModes = MESSAGES.cta_modes;

  return {
    level,
    isVip:     level === 'vip',
    delayMs:   level === 'yellow' || level === 'vip' ? timing.yellow_delay_ms : 0,
    blockAutoAdvice: level === 'red',
    ctaMode:   level === 'red' ? 'hidden' : (level === 'yellow' || level === 'vip' ? 'soft' : 'normal'),
    cta:       ctaModes[level === 'red' ? 'hidden' : (level === 'yellow' || level === 'vip' ? 'soft' : 'normal')],
    message:   message?.main ?? null,
    subMessage: message?.sub ?? null,
    messageId: message?.id ?? null,
    fadeInMs:  timing.message_fade_in_ms,
  };
}

/**
 * requestId 생성 — 모든 로그에 포함
 * 형식: req_{timestamp}_{6자리hex}
 */
function generateRequestId() {
  return `req_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
}

module.exports = { analyzeEmotionalIntensity, getSilentConfig, generateRequestId };
```

---

## 파일 2: `routes/dreamtownRoutes.js` 수정

**위치:** 파일 상단 require 블록에 추가

```js
// 기존 require 아래에 추가 (1줄)
const { analyzeEmotionalIntensity, getSilentConfig, generateRequestId } = require('../services/silentResponseService');
```

**위치:** `router.post('/wishes', ...)` 핸들러 내부

현재 코드 (line ~184~210):
```js
router.post('/wishes', async (req, res) => {
  console.log('[DT] POST /wishes 진입 | body:', JSON.stringify(req.body));
  try {
    const { user_id, wish_text, gem_type, yeosu_theme } = req.body;
    // ...validation...

    // ── 안전 필터 (신호등) ──────────────────────────────────────────
    const safety = classifyWish(wish_text);

    if (safety.level === 'RED') {
      notifyRedSignal('dreamtown', wish_text, safety.reason).catch(() => {});
      console.warn('[DT] RED signal — wish blocked:', safety.reason);
      return res.status(200).json({
        ok:           false,
        safety:       'RED',
        care_message: '지금 많이 힘드신가요? ...',
      });
    }

    // ...wish 저장...
    return res.status(200).json({
      ok:      true,
      wish_id: wish.id,
      safety:  safety.level,
    });
```

**변경 후:**
```js
router.post('/wishes', async (req, res) => {
  const requestId = generateRequestId();   // ← 추가
  console.log(`[DT] POST /wishes | requestId=${requestId} | body:`, JSON.stringify(req.body));
  try {
    const { user_id, wish_text, gem_type, yeosu_theme } = req.body;
    // ...validation (변경 없음)...

    // ── 안전 필터 (신호등) ── 변경 없음 ──────────────────────────────
    const safety = classifyWish(wish_text);

    if (safety.level === 'RED') {
      notifyRedSignal('dreamtown', wish_text, safety.reason).catch(() => {});
      console.warn(`[DT] requestId=${requestId} RED signal — wish blocked:`, safety.reason);

      // ── Silent Response Layer: RED 모드 설정 ──────────────────────
      const silentConfig = getSilentConfig('red');

      return res.status(200).json({
        ok:           false,
        safety:       'RED',
        care_message: '지금 많이 힘드신가요? 이 소원은 별로 만들어지지 않았어요. 혼자 감당하기 어려운 마음이라면 가까운 사람이나 전문 상담(☎️ 1393)에 연락해보세요.',
        silent:       silentConfig,   // ← 추가
        requestId,                    // ← 추가
      });
    }

    // ...wish 저장 (변경 없음)...
    const wish = result.rows[0];
    if (safety.level === 'YELLOW') {
      console.warn(`[DT] requestId=${requestId} YELLOW signal:`, safety.reason);
    }

    // ── Silent Response Layer: YELLOW/VIP/GREEN 모드 설정 ────────────
    const emotionLevel  = analyzeEmotionalIntensity(safety.level, wish_text);
    const silentConfig  = getSilentConfig(emotionLevel);

    if (silentConfig.isVip) {
      console.log(`[DT] requestId=${requestId} VIP wish — candidate for handwritten reply. wish_id=${wish.id}`);
      // TODO: VIP 마킹 — dt_wishes에 is_vip 컬럼 추가 후 UPDATE (migration 필요)
      // 현재는 로그만. 마이그레이션 준비되면 이 자리에 UPDATE 쿼리 추가.
    }

    console.log(`[DT] requestId=${requestId} emotionLevel=${emotionLevel}`);

    // ...flow 계측 (변경 없음)...

    return res.status(200).json({
      ok:      true,
      wish_id: wish.id,
      safety:  safety.level,
      silent:  silentConfig,   // ← 추가
      requestId,               // ← 추가
    });
```

**주의:** 파일 내 두 번째 `/wishes` 엔드포인트(line ~265)도 동일하게 적용할 것 (requestId + silentConfig 추가).

---

## 파일 3: `dreamtown-frontend/src/pages/WishGate.jsx` 수정

### 3-1. SilentLayer 인라인 컴포넌트 추가 (파일 상단부)

`import` 블록 바로 아래, `const GEMS = [...]` 이전에 추가:

```jsx
// ── Silent Response Layer 컴포넌트 ──────────────────────────────────
function SilentLayer({ config, onProceed }) {
  const [showMessage, setShowMessage] = useState(false);
  const [showCta, setShowCta]         = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowMessage(true), config.delayMs ?? 3500);
    const t2 = setTimeout(() => setShowCta(true),
      (config.delayMs ?? 3500) + (config.cta?.delay_after_message_ms ?? 1200)
    );
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 50% 55%, #0c0820 0%, #060410 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 20, padding: '0 32px',
    }}>
      {/* 별 호흡 애니메이션 */}
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,106,0.22) 0%, transparent 70%)',
          border: '1.5px solid rgba(255,215,106,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: 'rgba(255,215,106,0.7)',
          marginBottom: 28,
        }}
      >✦</motion.div>

      {/* 기본 대기 텍스트 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        style={{
          fontSize: 14, color: 'rgba(255,255,255,0.45)',
          textAlign: 'center', lineHeight: 1.7, letterSpacing: '0.03em',
          marginBottom: 32,
        }}
      >
        아우룸이 소원이의 마음을<br />조용히 듣고 있어요.
      </motion.p>

      {/* 아우룸 메시지 (delayMs 후 등장) */}
      {showMessage && config.message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: config.fadeInMs ? config.fadeInMs / 1000 : 0.6 }}
          style={{ textAlign: 'center' }}
        >
          <p style={{
            fontSize: 18, color: 'rgba(255,255,255,0.88)',
            fontWeight: 500, lineHeight: 1.6, marginBottom: 10,
          }}>
            {config.message}
          </p>
          {config.subMessage && (
            <p style={{
              fontSize: 14, color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.65,
            }}>
              {config.subMessage}
            </p>
          )}
        </motion.div>
      )}

      {/* Soft CTA */}
      {showCta && config.cta?.show && (
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          onClick={onProceed}
          style={{
            marginTop: 36,
            padding: '12px 32px',
            background: 'transparent',
            border: '1px solid rgba(255,215,106,0.35)',
            borderRadius: 24,
            color: 'rgba(255,215,106,0.75)',
            fontSize: 14, cursor: 'pointer', letterSpacing: '0.04em',
          }}
        >
          {config.cta.label ?? '계속하기'}
        </motion.button>
      )}
    </div>
  );
}
```

### 3-2. state 추가 (기존 state 선언 블록에)

```jsx
// 기존 state 선언 아래에 추가
const [silentMode, setSilentMode]   = useState(null);  // { config, starPromise }
```

### 3-3. handleSubmit 수정

현재:
```jsx
async function handleSubmit() {
  // ...
  const wishResult = await postWish({ userId, wishText, gemType, yeosuTheme: 'night_sea' });

  // RED 신호: 별 생성 없이 케어 메시지 표시
  if (wishResult.safety === 'RED') {
    setCareMessage(wishResult.care_message);
    return;
  }

  // ...star 생성 → nav...
}
```

변경 후:
```jsx
async function handleSubmit() {
  if (!wishText.trim()) { setError('소원을 입력해주세요.'); return; }
  setLoading(true);
  loadingStartRef.current = Date.now();
  setError('');
  setCareMessage('');
  try {
    const userId = getOrCreateUserId();
    const wishResult = await postWish({ userId, wishText, gemType, yeosuTheme: 'night_sea' });

    // RED 신호: 기존 흐름 유지 (별 생성 없음, 케어 메시지)
    if (wishResult.safety === 'RED') {
      setCareMessage(wishResult.care_message);
      return;
    }

    // ── Silent Response Layer: YELLOW/VIP ───────────────────────────
    const silentCfg = wishResult.silent;
    if (silentCfg && (silentCfg.level === 'yellow' || silentCfg.level === 'vip')) {
      // 별 생성을 백그라운드에서 미리 시작 (3.5초 침묵 동안 병렬 처리)
      const incomingOrigin = location.state?.originLocation ?? null;
      const originPlace    = incomingOrigin || new URLSearchParams(window.location.search).get('loc') || null;
      const starPromise    = postStarCreate({
        wishId: wishResult.wish_id, userId,
        phoneNumber: phoneNumber.trim() || null, originPlace
      });
      setSilentMode({ config: silentCfg, starPromise });
      return; // handleSubmit 종료 — 이후는 handleSilentProceed에서
    }
    // ────────────────────────────────────────────────────────────────

    const incomingOrigin = location.state?.originLocation ?? null;
    const originPlace    = incomingOrigin || new URLSearchParams(window.location.search).get('loc') || null;
    const star = await postStarCreate({ wishId: wishResult.wish_id, userId, phoneNumber: phoneNumber.trim() || null, originPlace });
    if (!star?.star_id) throw new Error('별 생성에 실패했어요. 다시 시도해주세요.');
    saveStarId(star.star_id);
    localStorage.removeItem('dt_prev_star_id');

    const starBirthState = { /* 기존 그대로 */ };
    try { sessionStorage.setItem('dt_recent_star', JSON.stringify(starBirthState)); } catch (_) {}

    // ...QR partner, 케이블카 delay (변경 없음)...
    nav(star.next ?? '/star-birth', { state: starBirthState });
  } catch (e) {
    setError(e.message);
  } finally {
    setLoading(false);
  }
}
```

### 3-4. handleSilentProceed 함수 추가 (handleSubmit 바로 아래)

```jsx
async function handleSilentProceed() {
  if (!silentMode) return;
  try {
    setLoading(true);
    const star = await silentMode.starPromise;
    if (!star?.star_id) throw new Error('별 생성에 실패했어요. 다시 시도해주세요.');
    saveStarId(star.star_id);
    localStorage.removeItem('dt_prev_star_id');

    const { wishText: wt, gemType: gt } = { wishText, gemType };
    const userId = getOrCreateUserId();
    const starBirthState = {
      starId: star.star_id, starName: star.star_name,
      galaxy: star.galaxy, gemType: gt, userId,
      day1: star.day1, wishText: wt.trim(),
      starRarity: star.star_rarity ?? 'standard',
      sourceEvent: incomingSource ?? 'wish',
      emotionChoice, imageUrl: star.image_url ?? null,
      constellation: star.constellation ?? null,
    };
    try { sessionStorage.setItem('dt_recent_star', JSON.stringify(starBirthState)); } catch (_) {}
    setSilentMode(null);
    nav(star.next ?? '/star-birth', { state: starBirthState });
  } catch (e) {
    setSilentMode(null);
    setError(e.message);
  } finally {
    setLoading(false);
  }
}
```

### 3-5. SilentLayer 렌더링 추가 (return 최상단)

```jsx
// qrIntro, showAurumWg 체크 바로 다음, 메인 return 직전에 추가
if (silentMode) {
  return (
    <SilentLayer
      config={silentMode.config}
      onProceed={handleSilentProceed}
    />
  );
}
```

---

## DoD 체크리스트

- [ ] `services/silentResponseService.js` 생성 완료
- [ ] `routes/dreamtownRoutes.js` — requestId 로그 포함, silentConfig 응답에 포함
- [ ] `routes/dreamtownRoutes.js` — 두 번째 `/wishes` 엔드포인트도 동일 적용 (line ~265)
- [ ] `WishGate.jsx` — YELLOW 시 3.5초 SilentLayer 노출
- [ ] `WishGate.jsx` — SilentLayer 동안 별 생성 백그라운드 병렬 처리
- [ ] `WishGate.jsx` — RED는 기존 careMessage 흐름 유지 (변경 없음)
- [ ] GREEN/VIP 흐름에서 즉시 해결형 CTA 숨겨짐 확인
- [ ] 아우룸 메시지 하드코딩 없음 — JSON 로드 확인
- [ ] 모든 console.log에 requestId 포함 확인
- [ ] `npm run build` → `dist/` 확인 → push

---

## 커밋 메시지 (완료 후)

```
feat: add Silent Response Layer v1 — emotional intensity-based response delay

- silentResponseService: analyzeEmotionalIntensity (GREEN/YELLOW/RED/VIP)
- requestId added to all wish creation logs
- WishGate: 3.5s breathing star UX for YELLOW/VIP, parallel star creation
- messages externalized to config/silent-response-messages.json
```

---

## 참고 파일

- `config/silent-response-messages.json` — 메시지 SSOT (Antigravity 생성 완료)
- `services/safetyFilter.js` — classifyWish (건드리지 않음)
- `dreamtown-brain/official/scene-system/SCENE_small_light.yaml` — 침묵 UX 비주얼 참고
