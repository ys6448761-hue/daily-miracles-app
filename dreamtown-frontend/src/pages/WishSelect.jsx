/**
 * WishSelect.jsx — /wish/select
 * 예시 선택 화면: 4개 감정 카드 → 입력 연결
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CHOICES = [
  { id: 'restart',  label: '다시 시작하고 싶어요' },
  { id: 'peace',    label: '마음이 좀 편해지고 싶어요' },
  { id: 'relation', label: '관계가 좋아졌으면 좋겠어요' },
  { id: 'courage',  label: '용기를 내고 싶어요' },
];

export default function WishSelect() {
  const navigate  = useNavigate();
  const [selected, setSelected] = useState(null);

  function handleStart() {
    if (!selected) return;
    const choice = CHOICES.find(c => c.id === selected);
    navigate(`/wish/input?preset=${encodeURIComponent(choice.label)}`);
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
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          textAlign: 'center',
          fontSize: 17,
          fontWeight: 600,
          lineHeight: 1.65,
          color: 'rgba(255,255,255,0.88)',
          marginBottom: 36,
        }}
      >
        지금 가장 가까운 마음을<br />골라보세요
      </motion.h1>

      {/* 선택 카드 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {CHOICES.map((c, i) => (
          <motion.button
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            onClick={() => setSelected(c.id)}
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

      {/* CTA 영역 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 32 }}>
        <button
          onClick={handleStart}
          disabled={!selected}
          style={{
            padding: '16px 0',
            borderRadius: 9999,
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
            background:  selected ? '#FFD76A' : 'rgba(255,215,106,0.18)',
            color:       selected ? '#0D1B2A' : 'rgba(255,215,106,0.38)',
            boxShadow:   selected ? '0 0 28px 6px rgba(255,215,106,0.22)' : 'none',
            transition:  'all 0.22s ease',
            cursor:      selected ? 'pointer' : 'default',
          }}
        >
          이 느낌으로 시작하기
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
