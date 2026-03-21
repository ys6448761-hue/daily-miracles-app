import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { postWish, postStarCreate, getOrCreateUserId } from '../api/dreamtown.js';

const GEMS = [
  { type: 'ruby',     label: '루비',     emoji: '🔴', desc: '열정과 도전' },
  { type: 'sapphire', label: '사파이어', emoji: '🔵', desc: '지혜와 성장' },
  { type: 'emerald',  label: '에메랄드', emoji: '🟢', desc: '치유와 회복' },
  { type: 'diamond',  label: '다이아몬드',emoji: '💎', desc: '결단과 변화' },
  { type: 'citrine',  label: '시트린',   emoji: '🟡', desc: '긍정과 관계' },
];

export default function WishGate() {
  const nav = useNavigate();
  const [wishText, setWishText] = useState('');
  const [gemType, setGemType] = useState('sapphire');
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

      const star = await postStarCreate({ wishId: wishResult.wish_id, userId });
      localStorage.setItem('dt_star_id', star.star_id);
      nav('/star-birth', { state: { starId: star.star_id, starName: star.star_name, galaxy: star.galaxy } });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <p className="text-white/50 text-xs mb-1">Wish Gate</p>
        <h1 className="text-2xl font-bold text-white">소원을 말씀해주세요</h1>
        <p className="text-white/50 text-sm mt-1">당신의 소원은 혼자가 아닙니다.</p>
      </motion.div>

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
          placeholder="예) 사람이 되고 싶어요&#10;부모님이 오래 건강하셨으면 좋겠어요"
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
        {gemType && (
          <p className="text-star-gold text-xs text-center mt-2">
            {GEMS.find(g => g.type === gemType)?.desc}
          </p>
        )}
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
        {loading ? '별을 만드는 중...' : 'Create My Star ✨'}
      </motion.button>
    </div>
  );
}
