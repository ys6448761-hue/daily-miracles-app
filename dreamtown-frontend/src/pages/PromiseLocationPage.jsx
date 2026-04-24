/**
 * PromiseLocationPage.jsx — 약속 기록 생성
 * 경로: /promise/create?loc=yeosu-cablecar
 *
 * GPS 조용히 캡처 → 사진(선택) + 다짐 + 미래 메시지(선택) → 90일 봉인
 */

import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getOrCreateUserId } from '../api/dreamtown.js';

const LOCATION_NAMES = {
  'yeosu-cablecar':  '여수 해상 케이블카',
  'yeosu-aqua':      '여수 아쿠아플라넷',
  'yeosu-yacht':     '여수 야경 요트',
  'yeosu-odongdo':   '여수 오동도',
  'yeosu-hyangiram': '향일암',
};

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #05040a 0%, #0c0a18 50%, #070b1a 100%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '0 20px 60px',
    fontFamily: "'Noto Sans KR', sans-serif", color: '#E8E4F0',
  },
  card: {
    width: '100%', maxWidth: 360,
    background: 'rgba(180,120,255,0.04)',
    border: '1px solid rgba(180,120,255,0.18)',
    borderRadius: 24, padding: '32px 22px',
  },
  label: {
    fontSize: 11, fontWeight: 700,
    color: '#9B7FE0', letterSpacing: '0.1em', marginBottom: 8,
  },
  headline: { fontSize: 21, fontWeight: 800, color: '#E8E4F0', lineHeight: 1.4, marginBottom: 8 },
  sub: { fontSize: 13, color: '#6A6090', lineHeight: 1.7, marginBottom: 24 },
  fieldLabel: {
    fontSize: 11, fontWeight: 700, color: '#9B7FE0',
    letterSpacing: '0.08em', marginBottom: 8,
  },
  textarea: {
    width: '100%', padding: '14px',
    borderRadius: 14,
    border: '1px solid rgba(180,120,255,0.2)',
    background: 'rgba(255,255,255,0.025)',
    color: '#E8E4F0', fontSize: 14, lineHeight: 1.75,
    resize: 'none', outline: 'none', boxSizing: 'border-box',
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  btn: {
    display: 'block', width: '100%',
    padding: '15px 0', borderRadius: 14, border: 'none',
    background: 'linear-gradient(135deg, #7B5CE5, #A78BFA)',
    color: '#fff', fontSize: 15, fontWeight: 800,
    cursor: 'pointer', marginTop: 12,
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  btnDisabled: { background: 'rgba(180,120,255,0.12)', color: '#4A3A70', cursor: 'default' },
};

// GPS 조용히 취득 (best-effort — 실패해도 계속 진행)
function tryGetGps() {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      ()           => resolve(null),
      { timeout: 8000, maximumAge: 60000 }
    );
  });
}

// ── 사진 선택 영역 ─────────────────────────────────────────────────
function PhotoPicker({ photoPreview, onSelect, onRemove }) {
  const inputRef = useRef(null);
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={S.fieldLabel}>사진 <span style={{ color: '#4A3A70', fontWeight: 400 }}>(선택)</span></div>
      {photoPreview ? (
        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
          <img src={photoPreview} alt="preview"
            style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
          <button onClick={onRemove} style={{
            position: 'absolute', top: 8, right: 8,
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)', border: 'none',
            color: '#fff', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} style={{
          width: '100%', padding: '18px 0', borderRadius: 14,
          border: '1.5px dashed rgba(180,120,255,0.25)',
          background: 'rgba(180,120,255,0.04)',
          color: '#6A6090', fontSize: 13, cursor: 'pointer',
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          + 이 순간의 사진 추가하기
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }} onChange={onSelect} />
    </div>
  );
}

// ── 봉인 완료 화면 ─────────────────────────────────────────────────
function SealedView({ promiseId, openAt, locationName, auroraComment }) {
  const nav = useNavigate();
  const [copied, setCopied] = useState(false);
  const url      = `${window.location.origin}/promise/${promiseId}`;
  const openDate = new Date(openAt).toLocaleDateString('ko-KR',
    { year: 'numeric', month: 'long', day: 'numeric' });

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* ignore */ }
  };

  return (
    <div style={S.page}>
      <motion.div
        style={{ ...S.card, textAlign: 'center', marginTop: 64, paddingTop: 44 }}
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55 }}
      >
        <motion.div
          style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'radial-gradient(circle, #A78BFA 0%, rgba(167,139,250,0.25) 60%, transparent 100%)',
            margin: '0 auto 20px',
            pointerEvents: 'none', // 글로우 레이어가 하위 버튼 터치 차단 방지
          }}
          animate={{ boxShadow: [
            '0 0 20px 8px rgba(167,139,250,0.4)',
            '0 0 36px 14px rgba(167,139,250,0.6)',
            '0 0 20px 8px rgba(167,139,250,0.4)',
          ]}}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9B7FE0', letterSpacing: '0.1em', marginBottom: 12 }}>
          봉인 완료
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#E8E4F0', lineHeight: 1.4, marginBottom: 10 }}>
          이 기록은<br />봉인되었습니다
        </div>
        <div style={{ fontSize: 13, color: '#6A6090', lineHeight: 1.7, marginBottom: 6 }}>
          {locationName}에서 남긴 이 기록은<br />
          <strong style={{ color: '#A78BFA' }}>{openDate}</strong>에 열립니다.
        </div>
        <div style={{ fontSize: 12, color: 'rgba(167,139,250,0.38)', lineHeight: 1.7, marginBottom: 16 }}>
          이 마음은, 시간이 지나며 더 또렷해질 거예요.
        </div>
        {auroraComment && (
          <div style={{
            padding: '12px 14px', borderRadius: 14, marginBottom: 20,
            background: 'rgba(167,139,250,0.05)',
            border: '1px solid rgba(167,139,250,0.18)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(167,139,250,0.5)', marginBottom: 5, letterSpacing: '0.06em' }}>
              ✨ Aurora5
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
              {auroraComment}
            </div>
          </div>
        )}
        <div style={{
          padding: '10px 14px', borderRadius: 10,
          background: 'rgba(167,139,250,0.06)',
          border: '1px solid rgba(167,139,250,0.15)',
          fontSize: 11, color: '#9B7FE0',
          wordBreak: 'break-all', marginBottom: 14, textAlign: 'left',
        }}>{url}</div>
        <button onClick={copy} style={{ ...S.btn, fontSize: 14, padding: '13px 0', marginTop: 0 }}>
          {copied ? '링크 복사됨 ✓' : '기록 링크 복사하기'}
        </button>
        <button
          onClick={() => {
            // QR 직접 진입 시 history 없음 → nav(-1) 무시됨. 명시적 경로로 이동
            if (window.history.length > 1) nav(-1);
            else nav('/home');
          }}
          style={{
            position: 'relative', zIndex: 10,
            background: 'none', border: 'none', color: '#4A3A70',
            fontSize: 12, cursor: 'pointer', marginTop: 16,
            fontFamily: "'Noto Sans KR', sans-serif",
            display: 'block', width: '100%', textAlign: 'center',
            padding: '12px 0', // 터치 영역 확보
          }}
        >← 돌아가기</button>
      </motion.div>
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────────────────────
export default function PromiseLocationPage() {
  console.log('CREATE_PAGE_MOUNTED'); // TODO: remove after deploy verify
  const [searchParams] = useSearchParams();
  const nav = useNavigate();

  const locationId   = searchParams.get('loc') || 'yeosu-cablecar';
  const locationName = LOCATION_NAMES[locationId] || locationId || '이 장소';

  const [text,            setText]            = useState('');
  const [futureMsg,       setFutureMsg]       = useState('');
  const [photoFile,       setPhotoFile]       = useState(null);
  const [photoPreview,    setPhotoPreview]    = useState(null);
  const [uploading,       setUploading]       = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [created,         setCreated]         = useState(null);

  if (created) {
    return <SealedView promiseId={created.promiseId} openAt={created.openAt} locationName={locationName} auroraComment={created.auroraComment} />;
  }

  const canSubmit = !!text.trim() && !loading && !uploading;

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');

    try {
      const userId = getOrCreateUserId();

      // GPS 조용히 취득 (실패해도 진행)
      const gps = await tryGetGps();

      // 사진 업로드
      let photo_url = null;
      if (photoFile) {
        setUploading(true);
        const form = new FormData();
        form.append('photo', photoFile);
        const upRes  = await fetch('/api/promise/upload', { method: 'POST', body: form });
        const upData = await upRes.json();
        setUploading(false);
        if (!upRes.ok || !upData.success) throw new Error(upData.error || '사진 업로드 실패');
        photo_url = upData.photo_url;
      }

      // 기록 저장
      const payload = {
        user_id:           userId,
        location_id:       locationId,
        emotion_text:      text.trim(),
        message_to_future: futureMsg.trim() || null,
        photo_url,
        created_lat: gps?.lat ?? null,
        created_lng: gps?.lng ?? null,
      };
      console.log('[promise] POST payload:', JSON.stringify(payload));

      const r = await fetch('/api/promise', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      let data;
      try { data = await r.json(); }
      catch { data = { success: false, error: `HTTP ${r.status}` }; }
      console.log('[promise] POST response:', r.status, JSON.stringify(data));
      if (!r.ok || !data.success) throw new Error(data.error || `저장 실패 (${r.status})`);

      setCreated({ promiseId: data.promise_id, openAt: data.open_at, auroraComment: data.aurora_comment ?? null });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div style={S.page}>
      <motion.div
        style={{ width: '100%', maxWidth: 360, paddingTop: 52 }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {/* 장소 배지 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {locationId ? (
            <span style={{
              display: 'inline-block', padding: '5px 14px', borderRadius: 20,
              background: 'rgba(167,139,250,0.1)',
              border: '1px solid rgba(167,139,250,0.25)',
              fontSize: 12, color: '#A78BFA', fontWeight: 600,
            }}>📍 {locationName}</span>
          ) : (
            <span style={{ fontSize: 12, color: '#4A3A70' }}>장소 미지정</span>
          )}
        </div>

        <div style={S.card}>
          <div style={S.label}>약속 기록</div>
          <div style={S.headline}>이 순간을<br />봉인합니다</div>
          <div style={S.sub}>
            지금 이 자리에서의 다짐을 남겨주세요.<br />
            90일 후, 이곳에 돌아왔을 때 열립니다.
          </div>

          <form onSubmit={handleSubmit}>
            <PhotoPicker
              photoPreview={photoPreview}
              onSelect={handlePhotoSelect}
              onRemove={() => { setPhotoFile(null); setPhotoPreview(null); }}
            />

            <div style={S.fieldLabel}>지금 이 자리에서의 다짐 *</div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="90일 후의 나에게 남기고 싶은 말을 적어주세요"
              maxLength={400} rows={5}
              style={{ ...S.textarea, marginBottom: 4 }}
              autoFocus
            />
            <div style={{ fontSize: 11, color: '#3A2F60', textAlign: 'right', marginBottom: 20 }}>
              {text.length}/400
            </div>

            <div style={S.fieldLabel}>
              미래의 나에게 전하는 말 <span style={{ color: '#4A3A70', fontWeight: 400 }}>(선택)</span>
            </div>
            <textarea
              value={futureMsg}
              onChange={e => setFutureMsg(e.target.value)}
              placeholder="90일 뒤 이 기록을 여는 나에게..."
              maxLength={200} rows={3}
              style={{ ...S.textarea, marginBottom: 4 }}
            />
            <div style={{ fontSize: 11, color: '#3A2F60', textAlign: 'right', marginBottom: 12 }}>
              {futureMsg.length}/200
            </div>

            {error && (
              <div style={{ fontSize: 13, color: '#f87171', marginBottom: 10 }}>{error}</div>
            )}

            <button type="submit" disabled={!canSubmit}
              style={{ ...S.btn, ...(canSubmit ? {} : S.btnDisabled) }}>
              {uploading ? '사진 업로드 중...' : loading ? '봉인 중...' : '이 순간을 봉인하기 ✦'}
            </button>
          </form>
        </div>

        <button onClick={() => nav(-1)} style={{
          background: 'none', border: 'none', color: '#3A2F60',
          fontSize: 12, cursor: 'pointer', marginTop: 20,
          fontFamily: "'Noto Sans KR', sans-serif",
          display: 'block', width: '100%', textAlign: 'center',
        }}>← 뒤로</button>
      </motion.div>
    </div>
  );
}
