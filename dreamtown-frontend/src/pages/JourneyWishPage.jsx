/**
 * JourneyWishPage.jsx — 소원 입력
 * 경로: /journey
 *
 * 이벤트: submit_wish
 * 다음 화면: /journey/context?wish_id=...
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GEM_OPTIONS = [
  { value: 'emerald',   label: '에메랄드', color: '#10b981', desc: '성장과 풍요' },
  { value: 'sapphire',  label: '사파이어', color: '#3b82f6', desc: '지혜와 명확함' },
  { value: 'ruby',      label: '루비',     color: '#ef4444', desc: '열정과 용기' },
  { value: 'amethyst',  label: '자수정',   color: '#8b5cf6', desc: '평온과 치유' },
  { value: 'topaz',     label: '토파즈',   color: '#f59e0b', desc: '기쁨과 감사' },
];

export default function JourneyWishPage() {
  const navigate = useNavigate();
  const [wishText, setWishText] = useState('');
  const [gemType, setGemType]   = useState('emerald');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!wishText.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/wishes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ wish_text: wishText.trim(), gem_type: gemType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '소원 저장 실패');
      navigate(`/journey/context?wish_id=${data.wish_id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedGem = GEM_OPTIONS.find(g => g.value === gemType);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.subtitle}>소원 여정</div>
        <h1 style={styles.title}>지금 가장 원하는 게<br />무엇인가요?</h1>
        <p style={styles.desc}>솔직하게 적어주세요. 판단하지 않아요.</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* 소원 입력 */}
        <textarea
          value={wishText}
          onChange={e => setWishText(e.target.value)}
          placeholder="예) 조금 쉬고 싶어요 / 특별한 하루를 만들고 싶어요"
          maxLength={500}
          style={styles.textarea}
          rows={4}
        />
        <div style={{ textAlign: 'right', fontSize: 11, color: '#6b7280', marginTop: 4 }}>
          {wishText.length}/500
        </div>

        {/* 보석 선택 */}
        <div style={styles.sectionLabel}>이 소원을 담을 보석</div>
        <div style={styles.gemRow}>
          {GEM_OPTIONS.map(g => (
            <button
              key={g.value} type="button"
              onClick={() => setGemType(g.value)}
              style={{
                ...styles.gemBtn,
                borderColor: gemType === g.value ? g.color : '#1e2d3d',
                background:  gemType === g.value ? `${g.color}20` : '#0d1b2a',
              }}
            >
              <span style={{ fontSize: 18, display: 'block', marginBottom: 2, color: g.color }}>◆</span>
              <span style={{ fontSize: 10, color: gemType === g.value ? g.color : '#9ca3af' }}>{g.label}</span>
            </button>
          ))}
        </div>
        {selectedGem && (
          <div style={{ fontSize: 11, color: selectedGem.color, textAlign: 'center', marginBottom: 20 }}>
            {selectedGem.desc}
          </div>
        )}

        {error && (
          <div style={styles.error}>{error}</div>
        )}

        <button
          type="submit"
          disabled={!wishText.trim() || loading}
          style={{
            ...styles.submitBtn,
            opacity: (!wishText.trim() || loading) ? 0.4 : 1,
          }}
        >
          {loading ? '저장 중...' : '다음으로'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', background: '#060e1a', color: '#f0f4ff',
    padding: '40px 20px 60px', fontFamily: 'sans-serif',
    display: 'flex', flexDirection: 'column',
  },
  header: { marginBottom: 32 },
  subtitle: { fontSize: 12, color: '#60a5fa', letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 800, lineHeight: 1.4, margin: '0 0 12px' },
  desc: { fontSize: 13, color: '#6b7280', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: 0 },
  textarea: {
    background: '#0d1b2a', border: '1px solid #1e2d3d', borderRadius: 12,
    color: '#f0f4ff', fontSize: 15, lineHeight: 1.6, padding: '14px 16px',
    resize: 'none', outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  sectionLabel: { fontSize: 12, color: '#6b7280', marginTop: 24, marginBottom: 10 },
  gemRow: { display: 'flex', gap: 8, justifyContent: 'space-between', marginBottom: 8 },
  gemBtn: {
    flex: 1, border: '1.5px solid', borderRadius: 10, padding: '10px 4px',
    cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
  },
  error: {
    background: '#2d0707', border: '1px solid #dc2626', color: '#f87171',
    borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12,
  },
  submitBtn: {
    marginTop: 8, background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    color: '#fff', border: 'none', borderRadius: 14, padding: '16px',
    fontSize: 16, fontWeight: 700, cursor: 'pointer', width: '100%',
    transition: 'opacity 0.2s',
  },
};
