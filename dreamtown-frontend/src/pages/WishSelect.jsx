/**
 * WishSelect.jsx — /wish/select
 * 감정 카드 선택 → 즉시 Star 생성 → StarBirth
 *
 * SSOT: 소원 입력은 한 번만. 카드 선택이 곧 소원 입력이다.
 * "직접 써볼게요"는 WishInputScreen으로 유지 (자유 입력 경로).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { postWish, postStarCreate, getOrCreateUserId } from '../api/dreamtown.js';
import { saveStarId } from '../lib/utils/starSession.js';

const CHOICES = [
  { id: 'restart',  label: '다시 시작하고 싶어요',      gemType: 'sapphire' },
  { id: 'peace',    label: '마음이 좀 편해지고 싶어요',  gemType: 'emerald'  },
  { id: 'relation', label: '관계가 좋아졌으면 좋겠어요', gemType: 'citrine'  },
  { id: 'courage',  label: '용기를 내고 싶어요',         gemType: 'ruby'     },
];

export default function WishSelect() {
  const navigate        = useNavigate();
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const [careMessage, setCareMessage] = useState('');
  const [error, setError]           = useState('');

  async function handleStart() {
    if (!selected || loading) return;
    const choice = CHOICES.find(c => c.id === selected);

    setLoading(true);
    setError('');
    setCareMessage('');

    try {
      const userId = getOrCreateUserId();
      const wishResult = await postWish({
        userId,
        wishText:   choice.label,
        gemType:    choice.gemType,
        yeosuTheme: 'night_sea',
      });

      // RED 신호: 별 생성 없이 케어 메시지 표시
      if (wishResult.safety === 'RED') {
        setCareMessage(wishResult.care_message || '지금 이 소원을 담기 어려워요.');
        return;
      }

      const star = await postStarCreate({
        wishId:      wishResult.wish_id,
        userId,
        phoneNumber: null,
      });
      saveStarId(star.star_id);

      const starBirthState = {
        starId:   star.star_id,
        starName: star.star_name,
        galaxy:   star.galaxy,
        gemType:  choice.gemType,
        wishText: choice.label,
      };
      try { sessionStorage.setItem('dt_recent_star', JSON.stringify(starBirthState)); } catch (_) {}

      navigate('/star-birth', { state: starBirthState });
    } catch (e) {
      setError(e.message || '잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0D1B2A',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '56px 24px 40px',
        position: 'relative',
      }}
    >
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate('/intro')}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          fontSize: 13,
          color: 'rgba(255,255,255,0.30)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 8px',
        }}
      >
        ← 뒤로
      </button>

      {/* 타이틀 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: 36 }}
      >
        <p style={{
          fontSize: 12,
          color: 'rgba(255,215,106,0.6)',
          letterSpacing: '0.06em',
          marginBottom: 10,
        }}>
          ✦ 당신의 별이 시작됩니다
        </p>
        <h1 style={{
          fontSize: 17,
          fontWeight: 600,
          lineHeight: 1.65,
          color: 'rgba(255,255,255,0.88)',
        }}>
          이 마음이 당신의 별이 될 거예요<br />
          <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>
            가장 가까운 마음을 골라보세요
          </span>
        </h1>
      </motion.div>

      {/* 선택 카드 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {CHOICES.map((c, i) => (
          <motion.button
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            onClick={() => { setSelected(c.id); setError(''); setCareMessage(''); }}
            style={{
              padding: '20px 20px',
              borderRadius: 16,
              border: `1px solid ${
                selected === c.id
                  ? 'rgba(255,215,106,0.60)'
                  : 'rgba(255,255,255,0.11)'
              }`,
              background: selected === c.id
                ? 'rgba(255,215,106,0.08)'
                : 'rgba(255,255,255,0.03)',
              color: selected === c.id
                ? 'rgba(255,215,106,0.95)'
                : 'rgba(255,255,255,0.68)',
              fontSize: 15,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              fontWeight: selected === c.id ? 500 : 400,
            }}
          >
            {c.label}
          </motion.button>
        ))}
      </div>

      {/* RED 케어 메시지 */}
      {careMessage && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 16,
            padding: '14px 16px',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 10 }}>
            {careMessage}
          </p>
          <button
            onClick={() => { setCareMessage(''); setSelected(null); }}
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            다른 마음으로 다시 고르기
          </button>
        </motion.div>
      )}

      {/* 에러 */}
      {error && (
        <p style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,110,110,0.8)', textAlign: 'center' }}>
          {error}
        </p>
      )}

      {/* CTA 영역 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
        <button
          onClick={handleStart}
          disabled={!selected || loading}
          style={{
            padding: '16px 0',
            borderRadius: 9999,
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
            background:  (selected && !loading) ? '#FFD76A' : 'rgba(255,215,106,0.18)',
            color:       (selected && !loading) ? '#0D1B2A' : 'rgba(255,215,106,0.38)',
            boxShadow:   (selected && !loading) ? '0 0 28px 6px rgba(255,215,106,0.22)' : 'none',
            transition:  'all 0.22s ease',
            cursor:      (selected && !loading) ? 'pointer' : 'default',
          }}
        >
          {loading ? '별을 만드는 중...' : '이 마음으로 별을 만들어요 ✦'}
        </button>
        <button
          onClick={() => navigate('/wish/input')}
          style={{
            padding: '14px 0',
            borderRadius: 9999,
            fontSize: 14,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.13)',
            color: 'rgba(255,255,255,0.40)',
            cursor: 'pointer',
          }}
        >
          직접 써볼게요
        </button>
      </div>
    </div>
  );
}
