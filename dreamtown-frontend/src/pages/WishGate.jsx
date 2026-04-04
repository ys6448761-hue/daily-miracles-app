import { useState, useEffect } from 'react';
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

export default function WishGate() {
  const nav = useNavigate();
  const location = useLocation();
  const [wishText, setWishText] = useState('');
  const prevStarId = localStorage.getItem('dt_prev_star_id') || null;

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

  async function handleSubmit() {
    if (!wishText.trim()) { setError('소원을 입력해주세요.'); return; }
    setLoading(true);
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

      const star = await postStarCreate({ wishId: wishResult.wish_id, userId, phoneNumber: phoneNumber.trim() || null });
      saveStarId(star.star_id);
      localStorage.removeItem('dt_prev_star_id');
      nav('/star-birth', { state: { starId: star.star_id, starName: star.star_name, galaxy: star.galaxy, gemType } });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-white">소원을 말씀해주세요</h1>
          <p className="text-white/50 text-sm mt-1">당신의 소원은 혼자가 아닙니다.</p>
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
          placeholder="내 작은 카페를 열고 싶어요&#10;매일 조금씩 나를 사랑하고 싶어요"
          maxLength={200}
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/30 resize-none h-36 focus:outline-none focus:border-dream-purple transition-colors"
        />
        <p className="text-white/30 text-xs text-right mt-1">{wishText.length}/200</p>
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
        {loading ? '별을 만드는 중...' : '별 만들기 ✨'}
      </motion.button>
    </div>
  );
}
