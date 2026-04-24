/**
 * CablecarPage.jsx — 케이블카 캐빈 QR 전용 진입 엔진
 * 경로: /cablecar          (무료)
 *       /cablecar?code=XXX (유료 — 결제 완료 리디렉트)
 *
 * ── 분기 ──────────────────────────────────────────────────────────
 *
 *  [유료 + 기존 별]  → 각성 연출 5초 → 공유 → 업셀 → /my-star/:id
 *  [유료 + 별 없음]  → 소원 입력 → 별 생성 → 각성 연출 5초 → 공유 → 업셀 → /my-star/:id
 *  [무료 + 기존 별]  → 방문 기록 안내 → /my-star/:id
 *  [무료 + 별 없음]  → 별 만들기 안내 → /wish (무료 생성)
 *
 * ── 원칙 ──────────────────────────────────────────────────────────
 *  "각성은 무료 기능이 아니라 상품이다"
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { getOrCreateUserId } from '../api/dreamtown.js';
import { readSavedStar, saveStarId, clearStarId } from '../lib/utils/starSession.js';
import { shareStarBirth } from '../utils/kakaoShare.js';
import StarAwakeningScene from '../components/StarAwakeningScene.jsx';

function dbg(step, data) {
  console.log(`[Cablecar] ${step}`, data ?? '');
}

// ── 공통 스타일 ──────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0D1B2A 0%, #0A2240 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 24px',
    fontFamily: "'Noto Sans KR', sans-serif",
    color: '#E8E4F0',
  },
  card: {
    background: 'rgba(155, 135, 245, 0.07)',
    border: '1px solid rgba(155, 135, 245, 0.2)',
    borderRadius: 24,
    padding: '36px 24px',
    width: '100%',
    maxWidth: 360,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    color: '#9B87F5',
    fontWeight: 700,
    letterSpacing: '0.08em',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 22,
    fontWeight: 800,
    color: '#E8E4F0',
    lineHeight: 1.4,
    marginBottom: 8,
  },
  subline: {
    fontSize: 14,
    color: '#7A6E9C',
    marginBottom: 28,
    lineHeight: 1.6,
  },
  btn: {
    display: 'block',
    width: '100%',
    padding: '15px 0',
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(135deg, #9B87F5, #7B67D5)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  btnOutline: {
    display: 'block',
    width: '100%',
    padding: '13px 0',
    borderRadius: 14,
    border: '1px solid rgba(155,135,245,0.3)',
    background: 'transparent',
    color: '#9B87F5',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  btnDisabled: {
    background: 'rgba(155,135,245,0.2)',
    color: '#7A6E9C',
    cursor: 'default',
  },
  textarea: {
    width: '100%',
    padding: '14px',
    borderRadius: 12,
    border: '1px solid rgba(155,135,245,0.3)',
    background: 'rgba(255,255,255,0.04)',
    color: '#E8E4F0',
    fontSize: 14,
    lineHeight: 1.65,
    resize: 'none',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Noto Sans KR', sans-serif",
    marginBottom: 4,
  },
  error: { fontSize: 13, color: '#f87171', marginTop: 12, lineHeight: 1.5 },
  dot: {
    width: 10, height: 10, borderRadius: '50%',
    background: '#9B87F5', display: 'inline-block', margin: '0 4px',
  },
};

// ── 로딩 ──────────────────────────────────────────────────────────
function ProcessingView() {
  return (
    <div style={S.page}>
      <motion.div style={S.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🚡</div>
        <div style={{ marginBottom: 20 }}>
          {[0, 1, 2].map(i => (
            <motion.span
              key={i} style={S.dot}
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
              transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
        <div style={{ fontSize: 15, color: '#C4BAE0', lineHeight: 1.7 }}>
          확인하는 중...
        </div>
      </motion.div>
    </div>
  );
}

// ── [유료] 소원 입력 ──────────────────────────────────────────────
function WishInputView({ onSubmit, loading, error }) {
  const [text, setText] = useState('');
  return (
    <div style={S.page}>
      <motion.div style={S.card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚡</div>
        <div style={S.label}>여수 케이블카 캐빈</div>
        <div style={S.headline}>이 순간,<br />소원을 담아 별을 탄생시키세요</div>
        <div style={S.subline}>
          케이블카 위에서 시작한 소원은<br />
          별이 되어 하늘에 남습니다
        </div>
        <form onSubmit={e => { e.preventDefault(); onSubmit(text); }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="마음속 소원을 적어주세요&#10;예: 더 용감하게 도전하고 싶어요"
            maxLength={200}
            rows={4}
            style={S.textarea}
            autoFocus
          />
          <div style={{ fontSize: 11, color: '#5a5370', textAlign: 'right', marginBottom: 12 }}>
            {text.length}/200
          </div>
          {error && <div style={S.error}>{error}</div>}
          <button
            type="submit"
            disabled={loading || !text.trim()}
            style={{ ...S.btn, ...(loading || !text.trim() ? S.btnDisabled : {}) }}
          >
            {loading ? '별 탄생 중...' : '별 탄생시키기 ✨'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ── [무료 + 기존별] 방문 기록 확인 ──────────────────────────────
function BasicLogView({ onNext }) {
  return (
    <div style={S.page}>
      <motion.div
        style={{ ...S.card, padding: '36px 20px' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {/* 별 글로우 */}
        <motion.div
          style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,190,255,0.6) 0%, rgba(155,135,245,0.3) 50%, transparent 80%)',
            boxShadow: '0 0 16px 6px rgba(155,135,245,0.3)',
            margin: '0 auto 20px',
            filter: 'blur(1px)',
          }}
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div style={{ fontSize: 11, fontWeight: 700, color: '#9B87F5', letterSpacing: '0.1em', marginBottom: 8 }}>
          여수 케이블카 캐빈
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#E8E4F0', lineHeight: 1.4, marginBottom: 8 }}>
          이 순간이<br />별에 기록됐어요
        </div>
        <div style={{ fontSize: 13, color: '#7A6E9C', lineHeight: 1.65, marginBottom: 32 }}>
          케이블카 위에서의 이 시간,<br />
          당신의 별이 조용히 기억합니다.
        </div>

        <button onClick={onNext} style={{ ...S.btn, marginTop: 0 }}>
          내 별 보기 →
        </button>
      </motion.div>
    </div>
  );
}

// ── [무료 + 별 없음] 별 만들기 안내 ──────────────────────────────
function ProductCTAView({ onShop }) {
  return (
    <div style={S.page}>
      <motion.div
        style={S.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
        <div style={S.label}>여수 케이블카 캐빈</div>
        <div style={S.headline}>지금, 이 순간에<br />내 별을 만들어요</div>
        <div style={S.subline}>
          케이블카 위에서 소원을 담으면<br />
          별이 되어 하늘에 남습니다
        </div>

        {/* 경험 목록 */}
        <div style={{ marginBottom: 28 }}>
          {[
            { icon: '✨', text: '케이블카 위에서 소원 담기' },
            { icon: '⭐', text: '나만의 별 탄생 + 여수 기억 저장' },
            { icon: '🌌', text: '도전 은하에 별 등록' },
          ].map((f) => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(155,135,245,0.07)' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{f.icon}</span>
              <span style={{ fontSize: 13, color: '#C4BAE0' }}>{f.text}</span>
            </div>
          ))}
        </div>

        <button onClick={onShop} style={S.btn}>
          내 별 만들기 ✨
        </button>
      </motion.div>
    </div>
  );
}

// ── 공유 카드 파티클 (고정 좌표 — html2canvas 호환) ───────────────
const CARD_PARTICLES = [
  { top: '7%',  left: '13%', size: 2,   op: 0.70 },
  { top: '12%', left: '80%', size: 1.5, op: 0.80 },
  { top: '20%', left: '5%',  size: 1,   op: 0.50 },
  { top: '28%', left: '90%', size: 2.5, op: 0.60 },
  { top: '40%', left: '3%',  size: 1.5, op: 0.55 },
  { top: '60%', left: '92%', size: 1,   op: 0.50 },
  { top: '68%', left: '7%',  size: 2,   op: 0.65 },
  { top: '75%', left: '84%', size: 1.5, op: 0.55 },
  { top: '82%', left: '22%', size: 1,   op: 0.45 },
  { top: '88%', left: '68%', size: 2,   op: 0.60 },
  { top: '94%', left: '44%', size: 1.5, op: 0.50 },
  { top: '4%',  left: '52%', size: 1,   op: 0.55 },
];

// ── 공유 카드 (화면에 보이는 프리뷰 = html2canvas 캡처 대상) ─────
function AwakenShareCard({ starName, cardId = 'awaken-share-card' }) {
  const date = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div
      id={cardId}
      style={{
        position:   'relative',
        width:      '100%',
        maxWidth:   360,
        aspectRatio: '1 / 1',
        background: 'linear-gradient(155deg, #000008 0%, #0D1228 45%, #0A1A36 100%)',
        borderRadius: 20,
        overflow:   'hidden',
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      {/* 별 파티클 */}
      {CARD_PARTICLES.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: p.top, left: p.left,
          width: p.size, height: p.size,
          borderRadius: '50%',
          backgroundColor: `rgba(255,255,255,${p.op})`,
        }} />
      ))}

      {/* 배경 글로우 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 55% at 50% 48%, rgba(155,135,245,0.22) 0%, transparent 70%)',
      }} />

      {/* 상단 — DreamTown 브랜드 */}
      <div style={{
        position: 'absolute', top: '8%',
        left: 0, right: 0, textAlign: 'center',
        fontSize: 10, letterSpacing: '0.22em',
        color: 'rgba(155,135,245,0.55)',
      }}>
        DREAMTOWN
      </div>

      {/* 별 이름 */}
      <div style={{
        position: 'absolute', top: '18%',
        left: 0, right: 0, textAlign: 'center',
        fontSize: 15, fontWeight: 700,
        color: 'rgba(200,190,255,0.85)',
        letterSpacing: '0.06em',
      }}>
        {starName}
      </div>

      {/* 중앙 별 글로우 — outer */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        width: 100, height: 100,
        marginTop: -50, marginLeft: -50,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(155,135,245,0.45) 0%, rgba(100,80,200,0.12) 55%, transparent 100%)',
      }} />
      {/* 별 코어 */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        width: 18, height: 18,
        marginTop: -9, marginLeft: -9,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #ffffff 0%, #e8e0ff 45%, rgba(155,135,245,0.9) 100%)',
      }} />

      {/* 메인 카피 */}
      <div style={{
        position: 'absolute', bottom: '20%',
        left: 0, right: 0, textAlign: 'center',
        padding: '0 28px',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#E8E4F0', lineHeight: 1.7 }}>
          여수 케이블카에서<br />내 별이 깨어난 순간 ✨
        </div>
      </div>

      {/* 날짜 */}
      <div style={{
        position: 'absolute', bottom: '9%',
        left: 0, right: 0, textAlign: 'center',
        fontSize: 10, color: 'rgba(122,110,156,0.7)',
      }}>
        {date}
      </div>
    </div>
  );
}

// ── [유료] 각성 직후 공유 화면 ────────────────────────────────────
function AwakenShareView({ starId, starName, onNext }) {
  const [toast,   setToast]   = useState('');
  const [saving,  setSaving]  = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  // 이미지 저장
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const target = document.getElementById('awaken-share-card');
      if (!target) { showToast('저장 실패'); return; }
      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(target, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `dreamtown-${starName}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('이미지 저장됨 📸');
    } catch {
      showToast('저장 실패 — 다시 시도해주세요');
    } finally {
      setSaving(false);
    }
  };

  // 링크 복사
  const handleCopyLink = async () => {
    const url = `${window.location.origin}/star/${starId}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('링크 복사됨 🔗');
    } catch {
      showToast('링크 복사 실패');
    }
  };

  // 카카오 / 네이티브 공유
  const handleKakao = () => {
    shareStarBirth({
      starId,
      starName,
      wishText: '여수 케이블카에서 내 별이 깨어난 순간',
    });
  };

  return (
    <div style={S.page}>
      <div style={{ width: '100%', maxWidth: 360, padding: '0 0 32px' }}>

        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ textAlign: 'center', marginBottom: 20, paddingTop: 28 }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9B87F5', letterSpacing: '0.1em', marginBottom: 6 }}>
            이 순간을 기억하세요
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#E8E4F0' }}>
            별이 깨어났어요 ✨
          </div>
        </motion.div>

        {/* 카드 프리뷰 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{ marginBottom: 20 }}
        >
          <AwakenShareCard starName={starName} />
        </motion.div>

        {/* 공유 버튼 3종 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          style={{ display: 'flex', gap: 8, marginBottom: 12 }}
        >
          {[
            { label: saving ? '저장 중...' : '이미지 저장', icon: '📸', fn: handleSave },
            { label: '링크 복사',  icon: '🔗', fn: handleCopyLink },
            { label: '공유하기',   icon: '💬', fn: handleKakao },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.fn}
              style={{
                flex: 1,
                padding: '12px 4px',
                borderRadius: 14,
                border: '1px solid rgba(155,135,245,0.25)',
                background: 'rgba(155,135,245,0.07)',
                color: '#C4BAE0',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Noto Sans KR', sans-serif",
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span style={{ fontSize: 18 }}>{btn.icon}</span>
              {btn.label}
            </button>
          ))}
        </motion.div>

        {/* 계속하기 */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          onClick={onNext}
          style={{ ...S.btnOutline, width: '100%', fontSize: 13 }}
        >
          계속하기 →
        </motion.button>

        {/* 토스트 */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: 14,
              textAlign: 'center',
              fontSize: 13,
              color: '#9B87F5',
              fontWeight: 600,
            }}
          >
            {toast}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── [유료] 각성 직후 앱 상품 업셀 ────────────────────────────────
function UpsellView({ starId, onNext }) {
  const nav = useNavigate();
  return (
    <div style={S.page}>
      <motion.div
        style={{ ...S.card, padding: '36px 20px' }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* 별 글로우 */}
        <motion.div
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'radial-gradient(circle, #fff 0%, #e8e0ff 25%, #9B87F5 55%, transparent 80%)',
            boxShadow: '0 0 20px 8px rgba(155,135,245,0.7)',
            margin: '0 auto 20px',
          }}
          animate={{ boxShadow: [
            '0 0 20px 8px rgba(155,135,245,0.7)',
            '0 0 32px 14px rgba(155,135,245,0.9)',
            '0 0 20px 8px rgba(155,135,245,0.7)',
          ]}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div style={{ fontSize: 11, fontWeight: 700, color: '#9B87F5', letterSpacing: '0.1em', marginBottom: 10 }}>
          별이 깨어났어요
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#E8E4F0', lineHeight: 1.4, marginBottom: 8 }}>
          여수에서 시작된<br />이 이야기를 이어가볼까요
        </div>
        <div style={{ fontSize: 13, color: '#7A6E9C', lineHeight: 1.65, marginBottom: 28 }}>
          별은 방금 깨어났어요.<br />
          여수에서 이 흐름을 여행으로 이어갈 수 있어요.
        </div>

        <button
          onClick={() => nav('/voyage-select')}
          style={{ ...S.btn, fontSize: 14, padding: '13px 0', marginTop: 0 }}
        >
          여수 여행 이어가기 →
        </button>
        <button
          onClick={onNext}
          style={{ ...S.btnOutline, marginTop: 8, fontSize: 13 }}
        >
          내 별 먼저 보기
        </button>
      </motion.div>
    </div>
  );
}

// ── 에러 ──────────────────────────────────────────────────────────
function ErrorView({ message, onRetry, savedStarId }) {
  const nav = useNavigate();
  return (
    <div style={S.page}>
      <motion.div style={S.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>문제가 생겼어요</div>
        <div style={{ fontSize: 13, color: '#f87171', marginBottom: 24, lineHeight: 1.5 }}>{message}</div>
        <button style={S.btn} onClick={onRetry}>다시 시도</button>
        {savedStarId && (
          <button
            style={S.btnOutline}
            onClick={() => nav(`/my-star/${savedStarId}`)}
          >
            내 별 바로 보기
          </button>
        )}
      </motion.div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
export default function CablecarPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  // 유료 여부: 결제 완료 후 /cablecar?code=XXXX 로 리디렉트됨
  const credentialCode = searchParams.get('code') ?? null;
  const isPaid         = !!credentialCode;

  const [phase,      setPhase]      = useState('init');
  // init | processing | input | awakening | share | upsell | logged_only | no_product | error
  const [result,     setResult]     = useState(null);
  const [inputError, setInputError] = useState('');
  const [loading,    setLoading]    = useState(false);

  // ── API 호출 ──────────────────────────────────────────────────
  const callEnter = async ({ starId, wishText }) => {
    const userId = getOrCreateUserId();
    dbg('A. userId', userId);
    dbg('B. isPaid', isPaid);
    dbg('C. starId', starId ?? '(없음)');

    const body = { user_id: userId, place: 'yeosu_cablecar_cabin' };
    if (starId)          body.star_id          = starId;
    if (wishText)        body.wish_text         = wishText;
    if (credentialCode)  body.credential_code   = credentialCode;

    const r    = await fetch('/api/cablecar/enter', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await r.json();
    dbg('D. API 응답', { status: r.status, mode: data.mode, has_product: data.has_product });

    if (!r.ok) {
      const err = new Error(data.error || data.message || '오류가 발생했습니다.');
      err.status = r.status;
      throw err;
    }
    return data;
  };

  // ── 마운트 ───────────────────────────────────────────────────
  useEffect(() => {
    const existingStarId = readSavedStar();
    dbg('0. 마운트', { existingStarId: existingStarId ?? '없음', isPaid });

    // [무료 + 별 없음] → 즉시 상품 안내 (API 불필요)
    if (!isPaid && !existingStarId) {
      dbg('0-A. 무료 + 별 없음 → no_product');
      setPhase('no_product');
      return;
    }

    // [유료 + 별 없음] → 소원 입력 (API 불필요)
    if (isPaid && !existingStarId) {
      dbg('0-B. 유료 + 별 없음 → input');
      setPhase('input');
      return;
    }

    // [별 있음] → API 호출 (유료면 각성, 무료면 logged_only)
    setPhase('processing');
    callEnter({ starId: existingStarId })
      .then(data => {
        if (data.has_product) {
          dbg('1. 유료 각성 → awakening', data.starName);
          saveStarId(data.starId);
          setResult(data);
          setPhase('awakening');
        } else {
          // logged_only: 방문 기록됨, 각성 없음
          dbg('1. 무료 방문 → logged_only', data.starId);
          saveStarId(data.starId);
          setResult(data);
          setPhase('logged_only');
        }
      })
      .catch(err => {
        dbg('2. 오류', { message: err.message, status: err.status });
        if (err.status === 404) {
          clearStarId();
          setPhase(isPaid ? 'input' : 'no_product');
        } else {
          setPhase('error');
          setResult({ message: err.message });
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── [유료] 소원 제출 ─────────────────────────────────────────
  const handleWishSubmit = async (wishText) => {
    if (!wishText.trim()) { setInputError('소원을 입력해주세요.'); return; }
    setLoading(true);
    setInputError('');
    try {
      const data = await callEnter({ wishText: wishText.trim() });
      dbg('3. 신규 별 생성', data.starId);
      saveStarId(data.starId);
      setResult(data);
      setPhase('awakening');
    } catch (err) {
      dbg('4. 소원 제출 실패', err.message);
      setInputError(err.message || '별 탄생에 실패했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // ── 내 별로 이동 ─────────────────────────────────────────────
  const goToStar = () => {
    if (result?.nextUrl) nav(result.nextUrl);
    else if (result?.starId) nav(`/my-star/${result.starId}`);
    else nav('/my-star');
  };

  // ── 렌더 ─────────────────────────────────────────────────────

  if (phase === 'init' || phase === 'processing') {
    return <ProcessingView />;
  }

  // [무료 + 별 없음] 상품 안내
  if (phase === 'no_product') {
    return <ProductCTAView onShop={() => nav('/wish')} />;
  }

  // [유료 + 별 없음] 소원 입력
  if (phase === 'input') {
    return (
      <WishInputView
        onSubmit={handleWishSubmit}
        loading={loading}
        error={inputError}
      />
    );
  }

  // [유료] 별 각성 시그니처 연출 (5초) → 완료 시 공유 화면으로
  if (phase === 'awakening' && result) {
    return (
      <StarAwakeningScene
        starName={result.starName}
        onComplete={() => setPhase('share')}
      />
    );
  }

  // [유료] 각성 직후 공유 화면
  if (phase === 'share' && result) {
    return (
      <AwakenShareView
        starId={result.starId}
        starName={result.starName}
        onNext={() => setPhase('upsell')}
      />
    );
  }

  // [유료] 공유 후 앱 상품 업셀
  if (phase === 'upsell' && result) {
    return <UpsellView starId={result.starId} onNext={goToStar} />;
  }

  // [무료 + 기존별] 방문 기록
  if (phase === 'logged_only') {
    return <BasicLogView onNext={goToStar} />;
  }

  // 에러
  return (
    <ErrorView
      message={result?.message || '알 수 없는 오류입니다'}
      onRetry={() => window.location.reload()}
      savedStarId={readSavedStar()}
    />
  );
}
