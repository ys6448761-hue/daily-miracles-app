import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import IntroScene from './IntroScene.jsx';
import { readSavedStar } from '../lib/utils/starSession.js';

const INTRO_KEY = 'dt_intro_seen';
const today = () => new Date().toISOString().slice(0, 10);

// ── Scene 2: Aurum ────────────────────────────────────────
function AurumScene({ onFinish }) {
  const BASE = import.meta.env.BASE_URL;
  const [lineIdx, setLineIdx]   = useState(0);
  const [canSkip, setCanSkip]   = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLineIdx(1), 1400);
    const t2 = setTimeout(() => setLineIdx(2), 3000);
    const t3 = setTimeout(() => setCanSkip(true), 2000);
    const t4 = setTimeout(onFinish, 5000);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [onFinish]);

  const LINES = [
    '드림타운에 오신 걸 환영해요',
    '소원이 별이 되는 곳이에요',
  ];

  return (
    <div
      onClick={canSkip ? onFinish : undefined}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', cursor: canSkip ? 'pointer' : 'default', background: '#060c17' }}
    >
      <img
        src={`${BASE}images/aurum_intro.webp`}
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(6,12,23,0.25), rgba(6,12,23,0.72))' }} />

      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', padding: '0 36px', gap: 22,
      }}>
        {LINES.map((line, i) => (
          lineIdx > i ? (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.3 }}
              style={{
                color: 'rgba(255,215,106,0.92)',
                fontSize: 'clamp(18px, 5vw, 24px)',
                fontWeight: 300,
                textAlign: 'center',
                lineHeight: 1.75,
                textShadow: '0 2px 20px rgba(0,0,0,0.85)',
                margin: 0,
              }}
            >
              {line}
            </motion.p>
          ) : null
        ))}
      </div>

      {canSkip && (
        <p style={{ position: 'absolute', bottom: 32, right: 24, zIndex: 10, color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
          건너뛰기
        </p>
      )}
    </div>
  );
}

// ── Scene 3: Cablecar ─────────────────────────────────────
function CablecarScene({ onFinish }) {
  const [failed, setFailed]   = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setCanSkip(true), 2000);
    const t2 = setTimeout(onFinish, 5000);
    return () => [t1, t2].forEach(clearTimeout);
  }, [onFinish]);

  return (
    <div
      onClick={canSkip ? onFinish : undefined}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', cursor: canSkip ? 'pointer' : 'default', background: '#060c17' }}
    >
      {!failed ? (
        <motion.video
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.88 }}
          transition={{ duration: 2.5, ease: 'easeInOut' }}
          autoPlay
          muted
          playsInline
          src="/assets/brand/intro/cablecar-star-intro.mp4"
          onError={() => setFailed(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <img
          src="/assets/brand/core/cablecar-star-intro.png"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }}
        />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.32)' }} />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0, duration: 1.5 }}
        style={{
          position: 'absolute', bottom: '32%', left: 0, right: 0,
          textAlign: 'center',
          color: 'rgba(255,215,106,0.78)',
          fontSize: 'clamp(14px, 4vw, 17px)',
          fontWeight: 300,
          letterSpacing: '0.06em',
          textShadow: '0 2px 16px rgba(0,0,0,0.85)',
          margin: 0,
        }}
      >
        별들이 태어나는 곳으로
      </motion.p>

      {canSkip && (
        <p style={{ position: 'absolute', bottom: 32, right: 24, zIndex: 10, color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
          건너뛰기
        </p>
      )}
    </div>
  );
}

// ── Scene 4: Landing (CTA) ────────────────────────────────
function LandingScene({ starCount }) {
  const nav = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: '#060c17' }}
    >
      <img
        src="/assets/brand/core/cablecar-star-intro.png"
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.22 }}
      />
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />

      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-star-gold star-twinkle"
            style={{
              width:  Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top:    Math.random() * 100 + '%',
              left:   Math.random() * 100 + '%',
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center w-full">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1.2 }}
          style={{
            fontSize: 'clamp(22px, 6vw, 30px)',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.95)',
            textAlign: 'center',
            whiteSpace: 'pre-line',
            lineHeight: 1.75,
            letterSpacing: '-0.01em',
            textShadow: '0 2px 24px rgba(0,0,0,0.7)',
            marginBottom: 56,
          }}
        >
          {'지금,\n당신의 소원이\n별이 되는 순간'}
        </motion.p>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => nav('/wish')}
          style={{
            width: '100%',
            maxWidth: 320,
            padding: '18px 0',
            borderRadius: 9999,
            background: '#FFD76A',
            color: '#0D1B2A',
            fontSize: 17,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 32px 10px rgba(255,215,106,0.28)',
            letterSpacing: '0.02em',
          }}
        >
          내 소원 남기기 ✦
        </motion.button>

        {starCount != null && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0, duration: 0.8 }}
            style={{
              marginTop: 28,
              fontSize: 13,
              color: 'rgba(255,215,106,0.75)',
              textAlign: 'center',
              letterSpacing: '0.01em',
            }}
          >
            지금까지 <strong style={{ color: '#FFD76A' }}>{starCount.toLocaleString()}</strong>개의 별이 태어났어요 ✨
          </motion.p>
        )}
      </div>
    </div>
  );
}

// ── Orchestrator ──────────────────────────────────────────
export default function AppLaunch() {
  const nav = useNavigate();
  const [scene, setScene]     = useState(null);
  const [starCount, setStarCount] = useState(null);

  useEffect(() => {
    const pathname = window.location.pathname.replace(/\/+/g, '/');
    const isPublicEntry =
      pathname === '/dreamtown' ||
      new URLSearchParams(window.location.search).get('entry') === 'invite';

    if (isPublicEntry) {
      nav('/dreamtown', { replace: true });
      return;
    }

    const starId = readSavedStar();
    if (starId) {
      nav(`/my-star/${starId}`, { replace: true });
      return;
    }

    // 재방문: 오늘 이미 Intro 봤으면 Landing으로 바로
    if (localStorage.getItem(INTRO_KEY) === today()) {
      setScene('landing');
    } else {
      localStorage.setItem(INTRO_KEY, today());
      setScene('intro');
    }
  }, [nav]);

  useEffect(() => {
    fetch('/api/dt/stars/count')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.count != null) setStarCount(d.count); })
      .catch(() => {});
  }, []);

  if (!scene)               return <div style={{ background: '#060c17', height: '100vh' }} />;
  if (scene === 'intro')    return <IntroScene    onFinish={() => setScene('aurum')}    />;
  if (scene === 'aurum')    return <AurumScene    onFinish={() => setScene('cablecar')} />;
  if (scene === 'cablecar') return <CablecarScene onFinish={() => setScene('landing')}  />;

  return <LandingScene starCount={starCount} />;
}
