/**
 * AiUpsellModal.jsx — AI Unlock A/B 실험 업셀 모달
 *
 * Props:
 *   upsell      — /api/dt/ai-unlock/status 응답의 upsell 객체
 *   experiment  — { group, button_position, price_exposed }
 *   products    — 상품 목록
 *   onClose     — 닫기 콜백
 *   onPurchase  — 구매 완료 콜백 (product_type)
 *   userId      — 유저 ID
 *   starId      — 별 ID (이벤트 추적용)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logAiUpsellEvent, purchaseAiProduct } from '../api/dreamtown.js';

// ── 상품 가격/설명 (API fallback) ────────────────────────────────────
const PRODUCT_META = {
  boost:   { emoji: '✨', label: 'AI Boost Pack',     price: '₩3,900',  sub: '+10회 추가 분석' },
  deep:    { emoji: '🔮', label: 'Deep Insight Pack', price: '₩5,900',  sub: '고품질 분석 1회 + 7일 개인화' },
  premium: { emoji: '⭐', label: 'Premium Journey',   price: '₩9,900',  sub: '모든 AI 분석 무제한' },
};

// ── 스테이지별 배경 색 ─────────────────────────────────────────────
const STAGE_STYLE = {
  day1:  { bg: 'from-indigo-900/95 to-purple-900/95',  accent: '#a78bfa' },
  day3:  { bg: 'from-blue-900/95 to-indigo-900/95',    accent: '#60a5fa' },
  limit: { bg: 'from-slate-900/95 to-gray-900/95',     accent: '#f59e0b' },
};

export default function AiUpsellModal({ upsell, experiment, products = [], onClose, onPurchase, userId, starId }) {
  const [selected, setSelected]   = useState(upsell?.product ?? 'boost');
  const [loading, setLoading]     = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [error, setError]         = useState(null);

  if (!upsell) return null;

  const stage     = upsell.stage ?? 'limit';
  const group     = experiment?.group ?? 'A';
  const style     = STAGE_STYLE[stage] ?? STAGE_STYLE.limit;
  const isCenter  = experiment?.button_position === 'center';
  const showPrice = experiment?.price_exposed ?? false;

  // 선택된 상품 정보
  const selectedProduct = products.find(p => p.product_type === selected)
    ?? { product_type: selected, price_krw: 3900 };
  const meta = PRODUCT_META[selected] ?? PRODUCT_META.boost;

  const handleClick = async () => {
    // upgrade_clicked 이벤트
    await logAiUpsellEvent({
      userId, starId, eventName: 'upgrade_clicked',
      stage, group, productType: selected,
      context: { title: upsell.title, stage, group },
    });

    setLoading(true);
    setError(null);
    try {
      const orderId = `dt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const result  = await purchaseAiProduct({
        userId, productType: selected, pgOrderId: orderId,
      });
      if (result.ok) {
        setPurchased(true);
        // purchase_completed 이벤트
        await logAiUpsellEvent({
          userId, starId, eventName: 'purchase_completed',
          stage, group, productType: selected,
          context: { calls_granted: result.calls_granted, pg_order_id: orderId },
        });
        setTimeout(() => {
          onPurchase?.(selected, result);
          onClose?.();
        }, 1800);
      } else {
        setError('구매 처리 중 오류가 발생했어요. 다시 시도해주세요.');
      }
    } catch {
      setError('네트워크 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    logAiUpsellEvent({
      userId, starId, eventName: 'upgrade_prompt_shown',
      stage, group, productType: selected,
      context: { action: 'dismissed' },
    }).catch(() => {});
    onClose?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.75)' }}
        onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className={`w-full max-w-md rounded-t-3xl bg-gradient-to-b ${style.bg} backdrop-blur-xl p-6 pb-10`}
          style={{ border: `1px solid ${style.accent}30` }}
        >
          {/* 핸들 바 */}
          <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-white/20" />

          {/* 헤더 */}
          <div className="mb-5 text-center">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest" style={{ color: style.accent }}>
              {stage === 'day1' ? 'Day 1 특별 제안' : stage === 'day3' ? 'Day 3 개인화 제안' : 'AI 분석 한도 도달'}
            </p>
            <h2 className="mb-2 text-xl font-bold text-white leading-snug">{upsell.title}</h2>
            <p className="text-sm text-white/70 leading-relaxed">{upsell.body}</p>
          </div>

          {/* 상품 선택 */}
          <div className="mb-5 space-y-2">
            {(products.length > 0 ? products : Object.values(PRODUCT_META).map((m, i) => ({
              product_type: Object.keys(PRODUCT_META)[i], ...m,
            }))).map((p) => {
              const m = PRODUCT_META[p.product_type] ?? {};
              const isSelected = selected === p.product_type;
              return (
                <button
                  key={p.product_type}
                  onClick={() => setSelected(p.product_type)}
                  className={`w-full rounded-xl p-3 text-left transition-all ${
                    isSelected
                      ? 'bg-white/15 ring-2'
                      : 'bg-white/5 ring-1 ring-white/10'
                  }`}
                  style={isSelected ? { ringColor: style.accent } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{m.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{m.label ?? p.name}</p>
                        <p className="text-xs text-white/50">{m.sub ?? p.description}</p>
                      </div>
                    </div>
                    {/* 가격: A그룹=클릭 후, B그룹=미리 노출 */}
                    {(showPrice || isSelected) && (
                      <span className="text-sm font-bold" style={{ color: style.accent }}>
                        {p.price_krw ? `₩${p.price_krw.toLocaleString()}` : m.price}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 에러 */}
          {error && (
            <p className="mb-3 rounded-lg bg-red-500/20 px-3 py-2 text-center text-xs text-red-300">{error}</p>
          )}

          {/* 구매 완료 상태 */}
          {purchased ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-2 py-3"
            >
              <span className="text-4xl">✨</span>
              <p className="text-base font-semibold text-white">AI 분석이 추가됐어요!</p>
              <p className="text-xs text-white/60">소원별이 더 또렷해졌어요</p>
            </motion.div>
          ) : (
            /* CTA 버튼 — 위치: A=하단 고정, B=중앙 강조 */
            <div className={isCenter ? 'flex flex-col items-center' : ''}>
              <button
                onClick={handleClick}
                disabled={loading}
                className={`rounded-2xl py-4 font-bold text-base text-white transition-all active:scale-95 disabled:opacity-60 ${
                  isCenter ? 'w-4/5' : 'w-full'
                }`}
                style={{ background: `linear-gradient(135deg, ${style.accent}, ${style.accent}99)` }}
              >
                {loading ? '처리 중...' : upsell.cta}
              </button>
              <button
                onClick={handleClose}
                className="mt-3 w-full py-2 text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                나중에
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
