/**
 * ShopCheckout.jsx — 다중 배송지 주문·결제
 * 경로: /shop/checkout
 * state: { product, quantity }
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const DEFAULT_MESSAGES = [
  '여수에서 당신을 생각했어요',
  '이 마음이 잘 전달되길 바라요',
  '소원을 담아 보내드려요',
];

const S = {
  page:    { minHeight: '100vh', background: '#0D1B2A', fontFamily: "'Noto Sans KR', sans-serif", color: '#E8E4F0', paddingBottom: 120 },
  header:  { background: 'rgba(155,135,245,0.08)', borderBottom: '1px solid rgba(155,135,245,0.15)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 16, fontWeight: 700, color: '#9B87F5' },
  section: { margin: '0 20px 16px', background: 'rgba(155,135,245,0.06)', border: '1px solid rgba(155,135,245,0.12)', borderRadius: 14, padding: '16px' },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: '#9B87F5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  row:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rowLabel:{ fontSize: 13, color: '#C4BAE0' },
  rowValue:{ fontSize: 14, fontWeight: 700, color: '#E8E4F0' },
  label:   { display: 'block', fontSize: 12, color: '#9B87F5', fontWeight: 600, marginBottom: 5 },
  input:   { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(155,135,245,0.25)', background: 'rgba(255,255,255,0.04)', color: '#E8E4F0', fontSize: 14, marginBottom: 10, boxSizing: 'border-box', outline: 'none' },
  textarea:{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(155,135,245,0.25)', background: 'rgba(255,255,255,0.04)', color: '#E8E4F0', fontSize: 13, marginBottom: 10, boxSizing: 'border-box', outline: 'none', resize: 'vertical', minHeight: 64, fontFamily: 'inherit' },
  msgPreset:{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  msgChip: (active) => ({ padding: '5px 10px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 11, background: active ? '#9B87F5' : 'rgba(155,135,245,0.1)', color: active ? '#0D1B2A' : '#9B87F5' }),
  deliveryCard: { background: 'rgba(13,27,42,0.6)', borderRadius: 10, padding: '12px', marginBottom: 10, border: '1px solid rgba(155,135,245,0.1)' },
  deliveryNum: { fontSize: 12, color: '#9B87F5', fontWeight: 700, marginBottom: 8 },
  addBtn:  { width: '100%', padding: '10px', borderRadius: 8, border: '1px dashed rgba(155,135,245,0.3)', background: 'transparent', color: '#9B87F5', fontSize: 13, cursor: 'pointer', marginTop: 4 },
  removeBtn:{ background: 'none', border: 'none', color: '#f87171', fontSize: 12, cursor: 'pointer', float: 'right' },
  badge:   { background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 13, color: '#34d399' },
  totalRow:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(155,135,245,0.1)', marginTop: 10 },
  totalLabel:{ fontSize: 14, color: '#C4BAE0' },
  totalAmt:{ fontSize: 22, fontWeight: 800, color: '#FFD700' },
  error:   { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', margin: '0 20px 12px' },
  stickyBar: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 448, padding: '12px 20px', background: 'rgba(13,27,42,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(155,135,245,0.15)' },
  payBtn:  { width: '100%', padding: '16px 0', borderRadius: 12, border: 'none', background: '#9B87F5', color: '#0D1B2A', fontSize: 16, fontWeight: 800, cursor: 'pointer' },
};

function emptyDelivery(msg = '') { return { recipient_name: '', recipient_phone: '', address: '', gift_message: msg }; }
function fmtPrice(n) { return Number(n).toLocaleString('ko-KR') + '원'; }

export default function ShopCheckout() {
  const nav = useNavigate();
  const { state } = useLocation();
  const product  = state?.product;
  const quantity = state?.quantity || 1;

  const [buyerPhone, setBuyerPhone] = useState('');
  const [giftMsg,    setGiftMsg]    = useState(DEFAULT_MESSAGES[0]);
  const [customMsg,  setCustomMsg]  = useState('');
  const [deliveries, setDeliveries] = useState([emptyDelivery(DEFAULT_MESSAGES[0])]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  if (!product) {
    return <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
      상품 정보가 없어요. <button style={{ color: '#9B87F5', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => nav('/shop')}>목록으로</button>
    </div>;
  }

  const userId   = localStorage.getItem('dt_active_star_id') || localStorage.getItem('dt_user_id') || undefined;
  const totalAmt = product.price * quantity;
  const finalMsg = customMsg.trim() || giftMsg;

  function updateDelivery(i, key, val) {
    setDeliveries(prev => prev.map((d, idx) => idx === i ? { ...d, [key]: val } : d));
  }

  function addDelivery() {
    setDeliveries(prev => [...prev, emptyDelivery(finalMsg)]);
  }

  function removeDelivery(i) {
    if (deliveries.length === 1) return;
    setDeliveries(prev => prev.filter((_, idx) => idx !== i));
  }

  function selectPresetMsg(m) {
    setGiftMsg(m);
    setCustomMsg('');
    setDeliveries(prev => prev.map(d => ({ ...d, gift_message: m })));
  }

  async function handlePay() {
    setError('');
    // 유효성
    for (const [i, d] of deliveries.entries()) {
      if (!d.recipient_name.trim()) { setError(`배송지 ${i + 1}: 받는 분 이름을 입력해주세요.`); return; }
      if (!d.recipient_phone.trim()) { setError(`배송지 ${i + 1}: 연락처를 입력해주세요.`); return; }
      if (!d.address.trim()) { setError(`배송지 ${i + 1}: 주소를 입력해주세요.`); return; }
    }

    setLoading(true);
    try {
      const body = {
        product_id:  product.id,
        quantity,
        buyer_phone: buyerPhone.trim() || undefined,
        user_id:     userId || undefined,
        payment_key: 'DEMO', // TODO: NicePay 실결제 연동
        deliveries:  deliveries.map(d => ({ ...d, gift_message: d.gift_message || finalMsg })),
      };

      const r = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || '주문 처리에 실패했어요.'); return; }

      nav('/shop/orders', { state: { newOrderId: d.order_id, productName: product.name } });
    } catch {
      setError('서버 연결에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={{ background: 'none', border: 'none', color: '#9B87F5', cursor: 'pointer', fontSize: 20 }} onClick={() => nav(-1)}>←</button>
        <span style={S.headerTitle}>주문서 작성</span>
      </div>

      <div style={{ height: 16 }} />

      {/* 상품 요약 */}
      <div style={S.section}>
        <div style={S.sectionTitle}>주문 상품</div>
        <div style={S.row}><span style={S.rowLabel}>{product.name}</span><span style={S.rowValue}>{fmtPrice(product.price)}</span></div>
        <div style={S.row}><span style={S.rowLabel}>수량</span><span style={S.rowValue}>{quantity}명분</span></div>
      </div>

      {/* 선물 메시지 */}
      <div style={S.section}>
        <div style={S.sectionTitle}>선물 메시지</div>
        <div style={S.msgPreset}>
          {DEFAULT_MESSAGES.map(m => (
            <button key={m} style={S.msgChip(!customMsg && giftMsg === m)} onClick={() => selectPresetMsg(m)}>{m}</button>
          ))}
        </div>
        <textarea
          style={S.textarea}
          placeholder="직접 입력..."
          value={customMsg}
          onChange={e => setCustomMsg(e.target.value)}
          rows={2}
        />
      </div>

      {/* 연락처 (주문자) */}
      <div style={S.section}>
        <div style={S.sectionTitle}>주문자 연락처 (알림 수신용)</div>
        <input style={S.input} type="tel" placeholder="010-0000-0000" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} />
      </div>

      {/* 배송지 */}
      <div style={S.section}>
        <div style={S.sectionTitle}>배송지 ({deliveries.length}곳)</div>
        {deliveries.map((d, i) => (
          <div key={i} style={S.deliveryCard}>
            <div style={S.deliveryNum}>
              배송지 {i + 1}
              {deliveries.length > 1 && <button style={S.removeBtn} onClick={() => removeDelivery(i)}>삭제</button>}
            </div>
            <label style={S.label}>받는 분</label>
            <input style={S.input} placeholder="이름" value={d.recipient_name} onChange={e => updateDelivery(i, 'recipient_name', e.target.value)} />
            <label style={S.label}>연락처</label>
            <input style={S.input} type="tel" placeholder="010-0000-0000" value={d.recipient_phone} onChange={e => updateDelivery(i, 'recipient_phone', e.target.value)} />
            <label style={S.label}>주소</label>
            <input style={S.input} placeholder="도로명 주소" value={d.address} onChange={e => updateDelivery(i, 'address', e.target.value)} />
          </div>
        ))}
        {deliveries.length < quantity && (
          <button style={S.addBtn} onClick={addDelivery}>+ 다른 배송지 추가</button>
        )}
      </div>

      {/* 혜택 */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={S.badge}>🎁 선물포장 무료 · 💌 메시지카드 무료</div>
      </div>

      {/* 합계 */}
      <div style={S.section}>
        <div style={S.row}><span style={S.rowLabel}>상품 금액</span><span style={S.rowValue}>{fmtPrice(product.price)} × {quantity}</span></div>
        <div style={S.row}><span style={S.rowLabel}>배송비</span><span style={S.rowValue}>무료</span></div>
        <div style={S.totalRow}>
          <span style={S.totalLabel}>총 {quantity}명 합계</span>
          <span style={S.totalAmt}>{fmtPrice(totalAmt)}</span>
        </div>
      </div>

      {error && <div style={S.error}>{error}</div>}

      <div style={S.stickyBar}>
        <motion.button style={S.payBtn} whileTap={{ scale: 0.97 }} onClick={handlePay} disabled={loading}>
          {loading ? '처리 중...' : `${fmtPrice(totalAmt)} 결제하기`}
        </motion.button>
      </div>
    </div>
  );
}
