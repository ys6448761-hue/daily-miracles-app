/**
 * WishSelect.jsx — /wish/select
 * 감정 카드 선택 → 즉시 Star 생성 → StarBirth
 *
 * SSOT: 소원 입력은 한 번만. 카드 선택이 곧 소원 입력이다.
 * "직접 써볼게요"는 WishInputScreen으로 유지 (자유 입력 경로).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { postWish, postStarCreate, getOrCreateUserId } from '../api/dreamtown.js';
import { saveStarId } from '../lib/utils/starSession.js';

// ── 자기 선택 기준 3개 ───────────────────────────────────────────────
const CHOICES = [
  {
    id:      'present',
    label:   '지금 나와 닮은 마음',
    sub:     '지금 이 순간, 내 안에 있는 감정',
    icon:    '🌙',
    gemType: 'emerald',
    accent:  '#5BC8C0',
    echo:    '이 마음이 당신 안에 있었군요.',
  },
  {
    id:      'direction',
    label:   '내가 가고 싶은 방향',
    sub:     '앞으로 나아가고 싶은 쪽을 향한 마음',
    icon:    '⭐',
    gemType: 'sapphire',
    accent:  '#9B87F5',
    echo:    '그 방향을 알고 있었군요.',
  },
  {
    id:      'movement',
    label:   '나를 움직이게 하는 마음',
    sub:     '행동하게 만드는, 그 어떤 마음',
    icon:    '✦',
    gemType: 'ruby',
    accent:  '#FFD76A',
    echo:    '그 마음이 당신을 여기까지 데려왔네요.',
  },
];

export default function WishSelect() {
  const navigate                        = useNavigate();
  const [selected, setSelected]         = useState(null);
  const [echoVisible, setEchoVisible]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [careMessage, setCareMessage]   = useState('');
  const [error, setError]               = useState('');

  // 카드 선택 — 공감 메시지 0.9초 표시
  function handleSelect(id) {
    if (loading) return;
    setSelected(id);
    setError('');
    setCareMessage('');
    setEchoVisible(true);
    setTimeout(() => setEchoVisible(false), 1400);
  }

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

  const activeChoice = CHOICES.find(c => c.id === selected);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #08070F 0%, #0D1228 60%, #0A1A30 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      padding: '56px 22px 40px',
      position: 'relative',
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>

      {/* 뒤로가기 */}
      <button
        onClick={() => navigate('/intro')}
        style={{
          position: 'absolute', top: 20, left: 20,
          fontSize: 13, color: 'rgba(255,255,255,0.28)',
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
        }}
      >
        ← 뒤로
      </button>

      {/* 헤더 — 감정 중심 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        style={{ textAlign: 'center', marginBottom: 36 }}
      >
        <p style={{
          fontSize: 11, fontWeight: 700,
          color: 'rgba(255,255,255,0.22)',
          letterSpacing: '0.14em',
          marginBottom: 14,
          textTransform: 'uppercase',
        }}>
          지금, 이 마음이 별이 됩니다
        </p>
        <h1 style={{
          fontSize: 21, fontWeight: 800,
          lineHeight: 1.55, color: 'rgba(255,255,255,0.90)',
          marginBottom: 8,
        }}>
          세 가지 중에서<br />하나를 고르세요
        </h1>
        <p style={{
          fontSize: 13, color: 'rgba(255,255,255,0.36)',
          lineHeight: 1.7,
        }}>
          정답이 없어요. 지금 가장 가까운 마음으로.
        </p>
      </motion.div>

      {/* 선택 카드 3종 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {CHOICES.map((c, i) => {
          const isSelected = selected === c.id;
          return (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.42 }}
              whileTap={{ scale: 0.975 }}
              onClick={() => handleSelect(c.id)}
              style={{
                padding: '22px 20px',
                borderRadius: 20,
                border: `1.5px solid ${isSelected ? c.accent + '80' : 'rgba(255,255,255,0.09)'}`,
                background: isSelected
                  ? `linear-gradient(135deg, ${c.accent}12 0%, ${c.accent}06 100%)`
                  : 'rgba(255,255,255,0.025)',
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isSelected
                  ? `0 0 20px 4px ${c.accent}20, inset 0 0 30px 0px ${c.accent}08`
                  : 'none',
                transition: 'all 0.22s ease',
              }}
            >
              {/* 선택 시 글로우 레이어 */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.35, 0.15] }}
                  transition={{ duration: 0.5 }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: `radial-gradient(ellipse at 20% 50%, ${c.accent}20 0%, transparent 65%)`,
                    pointerEvents: 'none',
                  }}
                />
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
                {/* 아이콘 */}
                <div style={{
                  width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                  background: isSelected ? `${c.accent}18` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isSelected ? c.accent + '35' : 'rgba(255,255,255,0.07)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 17,
                  transition: 'all 0.22s',
                }}>
                  {c.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 700,
                    color: isSelected ? c.accent : 'rgba(255,255,255,0.82)',
                    marginBottom: 4,
                    transition: 'color 0.22s',
                  }}>
                    {c.label}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: isSelected ? `${c.accent}90` : 'rgba(255,255,255,0.30)',
                    lineHeight: 1.6,
                    transition: 'color 0.22s',
                  }}>
                    {c.sub}
                  </div>
                </div>

                {/* 선택 체크 */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: c.accent,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 2,
                      fontSize: 11, color: '#0D1228', fontWeight: 800,
                    }}
                  >
                    ✓
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* 공감 메시지 — 선택 직후 1.4초 표시 */}
      <AnimatePresence>
        {echoVisible && activeChoice && (
          <motion.div
            key="echo"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.28 }}
            style={{
              marginTop: 16, textAlign: 'center',
              fontSize: 13,
              color: activeChoice.accent,
              letterSpacing: '0.02em',
              lineHeight: 1.7,
            }}
          >
            {activeChoice.echo}
          </motion.div>
        )}
      </AnimatePresence>

      {/* RED 케어 메시지 */}
      {careMessage && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 16, padding: '14px 16px', borderRadius: 14,
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

      {/* CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
        <motion.button
          onClick={handleStart}
          disabled={!selected || loading}
          animate={selected && !loading
            ? { boxShadow: ['0 0 12px 2px rgba(255,215,106,0.15)', '0 0 28px 6px rgba(255,215,106,0.28)', '0 0 12px 2px rgba(255,215,106,0.15)'] }
            : { boxShadow: 'none' }
          }
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            padding: '16px 0', borderRadius: 9999,
            fontSize: 16, fontWeight: 700, border: 'none',
            background:  (selected && !loading) ? '#FFD76A' : 'rgba(255,215,106,0.15)',
            color:       (selected && !loading) ? '#0D1B2A' : 'rgba(255,215,106,0.35)',
            transition:  'background 0.25s ease, color 0.25s ease',
            cursor:      (selected && !loading) ? 'pointer' : 'default',
            fontFamily:  "'Noto Sans KR', sans-serif",
          }}
        >
          {loading ? '별을 만드는 중...' : '이 마음으로 별을 만들어요 ✦'}
        </motion.button>
        <button
          onClick={() => navigate('/wish/input')}
          style={{
            padding: '14px 0', borderRadius: 9999, fontSize: 14,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.10)',
            color: 'rgba(255,255,255,0.32)', cursor: 'pointer',
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          직접 써볼게요
        </button>
      </div>

    </div>
  );
}
