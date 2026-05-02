import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { postWish, postStarCreate, getOrCreateUserId } from '../api/dreamtown.js';
import { readSavedStar, saveStarId } from '../lib/utils/starSession.js';
import { logEvent } from '../lib/events.js';

const GEMS = [
  { type: 'ruby',     label: '루비',      emoji: '🔴', galaxy: '도전 은하',    detail: '용기를 내어 앞으로 나아가려는 마음이에요' },
  { type: 'sapphire', label: '사파이어',  emoji: '🔵', galaxy: '성장 은하',    detail: '더 나은 나를 향해 배우고 싶은 마음이에요' },
  { type: 'emerald',  label: '에메랄드',  emoji: '🟢', galaxy: '치유 은하',    detail: '마음의 상처를 보듬고 쉬어가고 싶은 마음이에요' },
  { type: 'diamond',  label: '다이아몬드',emoji: '💎', galaxy: '기적 은하 ✨',  detail: '하나의 은하에 담기지 않는\n가장 순수하고 간절한 소원이에요' },
  { type: 'citrine',  label: '시트린',    emoji: '🟡', galaxy: '관계 은하',    detail: '소중한 관계를 더 깊게 이어가고 싶은 마음이에요' },
];

const QR_PLACE_LABEL = {
  // canonical
  'yeosu_cablecar_workshop': '여수 해상 케이블카',
  'yeosu_lattoa_cafe':       '라또아 카페',
  'global_default_workshop': '기본 별공방',
  // aliases
  'cablecar':        '여수 해상 케이블카',
  'yeosu_cablecar':  '여수 해상 케이블카',
  'yeosu-cablecar':  '여수 해상 케이블카',
  'lattoa':          '라또아 카페',
  'lattoa_cafe':     '라또아 카페',
  'forestland':      '더 포레스트랜드',
  'paransi':         '파란시',
};

export default function WishGate() {
  const nav = useNavigate();
  const location = useLocation();
  const prefillText    = location.state?.prefillText  ?? '';
  const emotionChoice  = location.state?.emotionChoice ?? null;
  const incomingSource = location.state?.sourceEvent   ?? null;
  const [wishText, setWishText] = useState(prefillText);
  const prevStarId = localStorage.getItem('dt_prev_star_id') || null;

  // QR 진입 분기: new=1 + loc=xxx 이고 기존 별이 있을 때 선택지 화면 노출
  const _qrParams   = new URLSearchParams(window.location.search);
  const _isQrEntry  = _qrParams.get('new') === '1' && !!_qrParams.get('loc');
  const _locParam   = _qrParams.get('loc') ?? '';
  const _existingId = readSavedStar();
  const [qrChoiceMode, setQrChoiceMode] = useState(() => _isQrEntry && !!_existingId);
  // 아우룸 인트로: QR 진입(신규·기존 모두) 시 0.5초 감각 트리거
  const [qrIntro, setQrIntro] = useState(() => _isQrEntry);
  useEffect(() => {
    if (!_isQrEntry) return;
    const t = setTimeout(() => setQrIntro(false), 500);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleCancel() {
    if (prevStarId) {
      saveStarId(prevStarId);
      localStorage.removeItem('dt_prev_star_id');
      window.location.href = window.location.origin + '/my-star/' + prevStarId;
    } else {
      nav('/home');
    }
  }

  // 기존 별 있으면 my-star로 리다이렉트
  // 예외: from=mystar (이어가기/새 소원) 또는 new=1 (새 소원 만들기)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const fromMystar = searchParams.get('from') === 'mystar';
    const isNew = searchParams.get('new') === '1';
    const existingStar = readSavedStar();
    if (existingStar && !fromMystar && !isNew) {
      nav('/my-star/' + existingStar, { replace: true });
      return;
    }
    // wish_start 이벤트
    const entryPoint = fromMystar ? 'mystar' : isNew ? 'new' : (searchParams.get('entry') === 'invite' ? 'share' : 'home');
    logEvent('wish_start', { user_id: getOrCreateUserId(), entry_point: entryPoint });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [gemType, setGemType] = useState('sapphire');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [careMessage, setCareMessage] = useState(''); // RED 신호 시 케어 메시지
  const loadingStartRef = useRef(null);
  const CABLECAR_MIN_MS = 3500; // 케이블카 연출 최소 보장 시간

  async function handleSubmit() {
    if (!wishText.trim()) { setError('소원을 입력해주세요.'); return; }
    setLoading(true);
    loadingStartRef.current = Date.now();
    setError('');
    setCareMessage('');
    try {
      const userId = getOrCreateUserId();
      const wishResult = await postWish({ userId, wishText, gemType, yeosuTheme: 'night_sea' });

      // RED 신호: 별 생성 없이 케어 메시지 표시
      if (wishResult.safety === 'RED') {
        setCareMessage(wishResult.care_message);
        return;
      }

      const incomingOrigin = location.state?.originLocation ?? null;
      const originPlace = incomingOrigin || new URLSearchParams(window.location.search).get('loc') || null;
      const star = await postStarCreate({ wishId: wishResult.wish_id, userId, phoneNumber: phoneNumber.trim() || null, originPlace });
      if (!star?.star_id) throw new Error('별 생성에 실패했어요. 다시 시도해주세요.');
      saveStarId(star.star_id);
      localStorage.removeItem('dt_prev_star_id');

      const starBirthState = { starId: star.star_id, starName: star.star_name, galaxy: star.galaxy, gemType, userId, day1: star.day1, wishText: wishText.trim(), starRarity: star.star_rarity ?? 'standard', sourceEvent: incomingSource ?? 'wish', emotionChoice, imageUrl: star.image_url ?? null, constellation: star.constellation ?? null };
      try { sessionStorage.setItem('dt_recent_star', JSON.stringify(starBirthState)); } catch (_) {}

      // QR 경유 시 고향 자동 확정 (fire-and-forget)
      const partnerCode = new URLSearchParams(window.location.search).get('partner');
      if (partnerCode) {
        fetch('/api/hometown/arrive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partner_code: partnerCode, user_id: userId }),
        }).catch(() => {});
      }

      // 케이블카 흐름(sourceEvent='cablecar')은 StarBirth가 Aurum+Cablecar 전체 연출 담당
      // → 최소 대기 없이 즉시 이동. 그 외는 로딩 영상 최소 3.5초 보장.
      if (incomingSource !== 'cablecar') {
        const elapsed   = Date.now() - (loadingStartRef.current ?? Date.now());
        const remaining = CABLECAR_MIN_MS - elapsed;
        if (remaining > 0) await new Promise(r => setTimeout(r, remaining));
      }

      nav(star.next ?? '/star-birth', { state: starBirthState });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── 아우룸 감각 트리거 (0.5초) ─────────────────────────────────────
  if (qrIntro) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#06060e', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* 낙하 불꽃 — 위에서 중앙으로 빠르게 떨어짐 */}
        <motion.div
          initial={{ y: -90, opacity: 0 }}
          animate={{ y: [-90, 0, 18], opacity: [0, 1, 0] }}
          transition={{ duration: 0.38, times: [0, 0.55, 1], ease: ['easeIn', 'easeOut'] }}
          style={{ position: 'absolute', width: 5, height: 5, borderRadius: '50%', background: '#FFD76A', boxShadow: '0 0 8px 3px rgba(255,215,106,0.8)', zIndex: 2 }}
        />
        {/* 충돌 후 방사 — 낙하 직후 짧은 글로우 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.1 }}
          animate={{ opacity: [0, 0.55, 0], scale: [0.1, 1.6, 0.8] }}
          transition={{ duration: 0.28, delay: 0.2, times: [0, 0.45, 1], ease: 'easeOut' }}
          style={{
            position: 'absolute', width: 90, height: 90, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,215,106,0.45) 0%, rgba(160,100,255,0.12) 60%, transparent 80%)',
            zIndex: 1,
          }}
        />
        {/* 파편 — 4개 작은 빛 조각 바깥으로 산란 */}
        {[[-22,-18],[20,-14],[-14,20],[18,16]].map(([dx, dy], i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{ x: dx * 1.8, y: dy * 1.8, opacity: [0, 0.7, 0], scale: [0, 1, 0] }}
            transition={{ duration: 0.25, delay: 0.22 + i * 0.02, ease: 'easeOut' }}
            style={{ position: 'absolute', width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,215,106,0.9)' }}
          />
        ))}
      </div>
    );
  }

  // ── QR 진입 선택지 화면 (기존 별 보유 사용자 전용) ─────────────────
  if (qrChoiceMode) {
    const placeLabel = QR_PLACE_LABEL[_locParam] ?? '이 공간';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}
        >
          <p style={{ fontSize: 13, color: 'rgba(255,215,106,0.7)', marginBottom: 10 }}>
            📍 {placeLabel}
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.5, marginBottom: 8 }}>
            이 공간에서<br />새 별을 만들어볼까요?
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 40 }}>
            이미 별이 있어요.<br />새로 만들거나, 내 별에 마음을 더할 수 있어요.
          </p>
          <button
            onClick={() => setQrChoiceMode(false)}
            style={{
              display: 'block', width: '100%', padding: '16px 0',
              borderRadius: 9999, marginBottom: 12,
              background: 'rgba(255,215,106,0.18)',
              border: '1px solid rgba(255,215,106,0.45)',
              color: '#FFD76A', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            }}
          >
            새 별 만들기 ✦
          </button>
          <button
            onClick={() => nav('/star/' + _existingId)}
            style={{
              display: 'block', width: '100%', padding: '16px 0',
              borderRadius: 9999,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: 500, cursor: 'pointer',
            }}
          >
            이 마음, 내 별에도 닿게 하기 →
          </button>
        </motion.div>
      </div>
    );
  }

  // ── 로딩 중 화면 ────────────────────────────────────────────────────
  // cablecar: StarBirth에서 Aurum→Cablecar 연출 전담 → 간단 텍스트만
  // 그 외: 공통 별 탄생 로딩 (cablecar 영상 금지)
  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#06040f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'radial-gradient(circle, #fff 0%, #e8e0ff 25%, #9B87F5 55%, transparent 80%)',
            boxShadow: '0 0 24px 10px rgba(155,135,245,0.5)',
          }}
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{ fontSize: 16, color: 'rgba(255,215,106,0.55)', letterSpacing: '0.04em' }}
        >
          별이 탄생하고 있어요...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={handleCancel} className="text-white/40 hover:text-white/70 text-sm">
          ← {prevStarId ? '내 별로' : '뒤로'}
        </button>
        <div className="text-center">
          <p className="text-white/50 text-xs mb-1">Wish Gate</p>
          <h1 className="text-2xl font-bold text-white">지금 떠오른 그 생각을,</h1>
          <p className="text-white/50 text-sm mt-1">한 줄로 남겨보세요</p>
        </div>
        <div className="w-12" />
      </div>

      {/* 소원 입력 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <textarea
          value={wishText}
          onChange={e => setWishText(e.target.value)}
          placeholder="예: 조금 더 괜찮아지고 싶어요"
          maxLength={200}
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/30 resize-none h-36 focus:outline-none focus:border-dream-purple transition-colors"
        />
        <div className="flex items-center justify-between mt-1">
          {prefillText ? (
            <p className="text-white/30 text-xs">추가 입력은 선택 사항이에요</p>
          ) : (
            <span />
          )}
          <p className="text-white/30 text-xs">{wishText.length}/200</p>
        </div>
      </motion.div>

      {/* 보석 선택 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <p className="text-white/60 text-sm mb-3">소원에 맞는 보석을 선택하세요</p>
        <div className="grid grid-cols-5 gap-2">
          {GEMS.map(g => (
            <button
              key={g.type}
              onClick={() => setGemType(g.type)}
              className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                gemType === g.type
                  ? 'border-star-gold bg-star-gold/10'
                  : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}
            >
              <span className="text-2xl mb-1">{g.emoji}</span>
              <span className="text-white/70 text-xs">{g.label}</span>
            </button>
          ))}
        </div>
        {gemType && (() => {
          const gem = GEMS.find(g => g.type === gemType);
          return (
            <div className="text-center mt-2">
              <p className="text-star-gold text-xs font-medium">{gem?.galaxy}</p>
              <p className="text-white/50 text-xs mt-1 whitespace-pre-line">{gem?.detail}</p>
            </div>
          );
        })()}
      </motion.div>

      {/* RED 신호 케어 메시지 */}
      {careMessage && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/15 rounded-2xl p-5 mb-4"
        >
          <p className="text-white/80 text-sm leading-relaxed mb-4">{careMessage}</p>
          <button
            onClick={() => { setCareMessage(''); setWishText(''); }}
            className="text-white/40 text-xs hover:text-white/60 transition"
          >
            다른 소원으로 시작하기
          </button>
        </motion.div>
      )}

      {error && (
        <div className="bg-white/5 border border-white/20 rounded-2xl p-4 mb-4 text-center">
          <p className="text-white/70 text-sm mb-2">별을 준비하는 데 문제가 생겼어요. ✨</p>
          <p className="text-white/40 text-xs mb-3">{error}</p>
          <button
            onClick={handleSubmit}
            className="text-star-gold text-sm font-medium"
          >
            다시 시도하기 →
          </button>
        </div>
      )}

      {/* 아우룸 문구 */}
      <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,215,106,0.7)', marginBottom: '16px' }}>
        ✦ 아우룸이 당신의 소원을 별로 만들어 드릴게요
      </p>

      {/* 전화번호 (선택) — 탄생 축하 SMS 수신용 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mb-6"
      >
        <p className="text-white/40 text-xs mb-2">탄생 축하 문자 받기 (선택)</p>
        <input
          type="tel"
          value={phoneNumber}
          onChange={e => setPhoneNumber(e.target.value)}
          placeholder="010-0000-0000"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder-white/25 text-sm focus:outline-none focus:border-dream-purple/50 transition-colors"
        />
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-dream-purple hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-lg transition-colors mt-auto"
      >
        {'별로 남기기 ✦'}
      </motion.button>
    </div>
  );
}
