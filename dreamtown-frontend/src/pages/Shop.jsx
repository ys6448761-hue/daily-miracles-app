/**
 * Shop.jsx — 여수 소원 특산품 목록
 * 경로: /shop
 * Aurora5 톤 | 모바일 375px 최적화
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CATEGORIES = ['전체', 'food', 'goods', 'souvenir'];
const CAT_LABEL  = { 전체: '전체', food: '식품', goods: '굿즈', souvenir: '기념품' };

const S = {
  page:    { minHeight: '100vh', background: '#0D1B2A', fontFamily: "'Noto Sans KR', sans-serif", color: '#E8E4F0', paddingBottom: 40 },
  header:  { background: 'rgba(155,135,245,0.08)', borderBottom: '1px solid rgba(155,135,245,0.15)', padding: '20px 20px 16px' },
  title:   { fontSize: 22, fontWeight: 800, color: '#E8E4F0', marginBottom: 4 },
  subtitle:{ fontSize: 13, color: '#9B87F5' },
  tabs:    { display: 'flex', gap: 8, padding: '16px 20px 0', overflowX: 'auto' },
  tab:     (active) => ({
    padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
    background: active ? '#9B87F5' : 'rgba(155,135,245,0.1)',
    color: active ? '#0D1B2A' : '#9B87F5',
  }),
  grid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px 20px' },
  card:    { background: 'rgba(155,135,245,0.07)', border: '1px solid rgba(155,135,245,0.13)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer' },
  imgBox:  { width: '100%', aspectRatio: '1', background: 'rgba(155,135,245,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  img:     { width: '100%', height: '100%', objectFit: 'cover' },
  imgFallback: { fontSize: 36 },
  cardBody:{ padding: '10px 12px 14px' },
  cardName:{ fontSize: 14, fontWeight: 700, color: '#E8E4F0', marginBottom: 4, lineHeight: 1.3 },
  cardPt:  { fontSize: 11, color: '#7A6E9C', marginBottom: 6 },
  cardPrice:{ fontSize: 16, fontWeight: 800, color: '#9B87F5' },
  emptyBox:{ textAlign: 'center', padding: '60px 20px', color: '#7A6E9C', fontSize: 14 },
};

function fmtPrice(n) { return Number(n).toLocaleString('ko-KR') + '원'; }

export default function Shop() {
  const nav = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('전체');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = category !== '전체' ? `?category=${category}` : '';
    fetch(`/api/shop/products${q}`)
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div style={S.page}>
      {/* 헤더 */}
      <div style={S.header}>
        <div style={S.title}>🌟 여수 소원 특산품</div>
        <div style={S.subtitle}>여수의 마음을 선물하세요</div>
      </div>

      {/* 카테고리 탭 */}
      <div style={S.tabs}>
        {CATEGORIES.map(c => (
          <button key={c} style={S.tab(category === c)} onClick={() => setCategory(c)}>
            {CAT_LABEL[c]}
          </button>
        ))}
      </div>

      {/* 상품 그리드 */}
      {loading ? (
        <div style={S.emptyBox}>불러오는 중...</div>
      ) : products.length === 0 ? (
        <div style={S.emptyBox}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🛍️</div>
          아직 상품이 없어요
        </div>
      ) : (
        <div style={S.grid}>
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              style={S.card}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => nav(`/shop/${p.id}`)}
            >
              <div style={S.imgBox}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} style={S.img} />
                  : <span style={S.imgFallback}>{p.category === 'food' ? '🍱' : p.category === 'goods' ? '🎁' : '🏷️'}</span>
                }
              </div>
              <div style={S.cardBody}>
                <div style={S.cardName}>{p.name}</div>
                <div style={S.cardPt}>{p.partner_name || '여수 특산품'}</div>
                <div style={S.cardPrice}>{fmtPrice(p.price)}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
