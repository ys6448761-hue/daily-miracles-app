/**
 * ShopDetail.jsx — 상품 상세 + 수량 선택 + 연관 번들
 * 경로: /shop/:id
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const QTY_OPTIONS = [1, 2, 3, 4, 5];

const S = {
  page:    { minHeight: '100vh', background: '#0D1B2A', fontFamily: "'Noto Sans KR', sans-serif", color: '#E8E4F0', paddingBottom: 100 },
  imgBox:  { width: '100%', aspectRatio: '1', background: 'rgba(155,135,245,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: 280, overflow: 'hidden' },
  img:     { width: '100%', height: '100%', objectFit: 'cover' },
  imgFallback: { fontSize: 72 },
  body:    { padding: '20px 20px 0' },
  ptTag:   { fontSize: 12, color: '#9B87F5', fontWeight: 600, marginBottom: 8 },
  name:    { fontSize: 22, fontWeight: 800, color: '#E8E4F0', marginBottom: 8, lineHeight: 1.3 },
  price:   { fontSize: 24, fontWeight: 800, color: '#9B87F5', marginBottom: 16 },
  desc:    { fontSize: 14, color: '#C4BAE0', lineHeight: 1.8, marginBottom: 28 },
  divider: { height: 1, background: 'rgba(155,135,245,0.1)', margin: '0 0 20px' },
  qtyLabel:{ fontSize: 14, fontWeight: 700, color: '#E8E4F0', marginBottom: 14 },
  qtyRow:  { display: 'flex', gap: 8, marginBottom: 24 },
  qtyBtn:  (active) => ({
    flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700,
    background: active ? '#9B87F5' : 'rgba(155,135,245,0.1)',
    color: active ? '#0D1B2A' : '#9B87F5',
  }),
  totalBox:{ background: 'rgba(155,135,245,0.07)', border: '1px solid rgba(155,135,245,0.15)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:{ fontSize: 14, color: '#C4BAE0' },
  totalAmt:{ fontSize: 22, fontWeight: 800, color: '#FFD700' },
  giftBadge:{ display: 'inline-flex', gap: 8, marginBottom: 24 },
  badge:   { background: 'rgba(155,135,245,0.12)', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: '#9B87F5' },
  // 번들 섹션
  bundleSection: { margin: '0 0 28px' },
  bundleSectionTitle: { fontSize: 12, fontWeight: 700, color: '#7A6E9C', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  bundleCard: { background: 'rgba(155,135,245,0.07)', border: '1px solid rgba(155,135,245,0.2)', borderRadius: 14, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  bundleInfo: { flex: 1 },
  bundleName: { fontSize: 14, fontWeight: 700, color: '#E8E4F0', marginBottom: 4 },
  bundleDesc: { fontSize: 12, color: '#C4BAE0', marginBottom: 8, lineHeight: 1.5 },
  bundlePriceRow: { display: 'flex', alignItems: 'center', gap: 8 },
  bundleOrigPrice: { fontSize: 12, color: '#7A6E9C', textDecoration: 'line-through' },
  bundlePrice: { fontSize: 16, fontWeight: 800, color: '#FFD700' },
  bundleBtn: { flexShrink: 0, padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(155,135,245,0.4)', background: 'transparent', color: '#9B87F5', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  stickyBar: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 448, padding: '12px 20px', background: 'rgba(13,27,42,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(155,135,245,0.15)' },
  buyBtn:  { width: '100%', padding: '16px 0', borderRadius: 12, border: 'none', background: '#9B87F5', color: '#0D1B2A', fontSize: 16, fontWeight: 800, cursor: 'pointer' },
  backBtn: { background: 'none', border: 'none', color: '#9B87F5', fontSize: 14, cursor: 'pointer', padding: '16px 20px 0', display: 'block' },
};

function fmtPrice(n) { return Number(n).toLocaleString('ko-KR') + '원'; }

export default function ShopDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [product, setProduct] = useState(null);
  const [qty,     setQty]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [bundle,  setBundle]  = useState(null);

  useEffect(() => {
    fetch(`/api/shop/products/${id}`)
      .then(r => r.json())
      .then(d => {
        setProduct(d.product || null);
        return d.product;
      })
      .then(p => {
        if (!p) return;
        // 소원 유형 첫번째로 연관 번들 조회
        const wt = p.wish_types?.[0] || 'healing';
        return fetch(`/api/shop/bundles?wish_type=${wt}`)
          .then(r => r.json())
          .then(d => setBundle(d.bundles?.[0] || null))
          .catch(() => {});
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7A6E9C' }}>불러오는 중...</div>;
  if (!product) return <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>상품을 찾을 수 없어요</div>;

  const total = product.price * qty;

  function handleBuy() {
    nav('/shop/checkout', { state: { product, quantity: qty } });
  }

  return (
    <div style={S.page}>
      <button style={S.backBtn} onClick={() => nav('/shop')}>← 목록으로</button>

      {/* 이미지 */}
      <div style={S.imgBox}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={S.img} />
          : <span style={S.imgFallback}>{product.category === 'food' ? '🍱' : product.category === 'goods' ? '🎁' : '🏷️'}</span>
        }
      </div>

      <div style={S.body}>
        <div style={S.ptTag}>{product.partner_name || '여수 특산품'} · {product.partner_address || '여수'}</div>
        <div style={S.name}>{product.name}</div>
        <div style={S.price}>{fmtPrice(product.price)}</div>
        {product.description && <div style={S.desc}>{product.description}</div>}
        <div style={S.divider} />

        {/* 수량 선택 */}
        <div style={S.qtyLabel}>몇 분께 드릴 건가요?</div>
        <div style={S.qtyRow}>
          {QTY_OPTIONS.map(n => (
            <button key={n} style={S.qtyBtn(qty === n)} onClick={() => setQty(n)}>
              {n === 5 ? '5+' : `${n}명`}
            </button>
          ))}
        </div>

        {/* 합계 */}
        <div style={S.totalBox}>
          <span style={S.totalLabel}>{fmtPrice(product.price)} × {qty}명</span>
          <span style={S.totalAmt}>{fmtPrice(total)}</span>
        </div>

        {/* 혜택 배지 */}
        {product.is_gift_available && (
          <div style={S.giftBadge}>
            <span style={S.badge}>🎁 선물포장 무료</span>
            <span style={S.badge}>💌 메시지카드 무료</span>
          </div>
        )}

        {/* 연관 번들 */}
        {bundle && (
          <motion.div style={S.bundleSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div style={S.divider} />
            <div style={S.bundleSectionTitle}>이 상품과 함께하는 선물 세트</div>
            <div style={S.bundleCard}>
              <div style={S.bundleInfo}>
                <div style={S.bundleName}>{bundle.name}</div>
                <div style={S.bundleDesc}>{bundle.description}</div>
                <div style={S.bundlePriceRow}>
                  {bundle.original_price && (
                    <span style={S.bundleOrigPrice}>{fmtPrice(bundle.original_price)}</span>
                  )}
                  <span style={S.bundlePrice}>{fmtPrice(bundle.bundle_price)}</span>
                </div>
              </div>
              <button style={S.bundleBtn} onClick={() => nav('/shop')}>
                세트로 보기
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* 구매 버튼 */}
      <div style={S.stickyBar}>
        <motion.button style={S.buyBtn} whileTap={{ scale: 0.97 }} onClick={handleBuy}>
          {fmtPrice(total)}로 구매하기
        </motion.button>
      </div>
    </div>
  );
}
