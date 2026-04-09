import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DayLogScreen from '../features/galaxy/components/DayLogScreen';
import SilhouetteScene from '../features/day/components/SilhouetteScene';
import { saveLog } from '../features/galaxy/utils/logStorage';
import { useDreamtownStore } from '../store/dreamtownStore';
import { postVoyageLog, getOrCreateUserId, logFlowEvent } from '../api/dreamtown.js';
import { readSavedStar } from '../lib/utils/starSession.js';
import { POSTCARD_FALLBACK_MESSAGE } from '../constants/dreamtownFlow';

const LUMI_DAY3 = {
  trigger: 'day3_resume',
  message: '여기서 멈추는 사람들이 가장 많아요\n그래서 이 순간이 가장 중요해요',
  cta: '다시 이어가기',
};

const LUMI_DAY7 = {
  trigger: 'day7_push',
  message: '여기까지 온 사람들은\n거의 다 변화를 느꼈어요',
  cta: '마지막 한 걸음',
};

// 선택 은하 잔광 색상 — SelectionTransition 동일 계열
const GALAXY_OVERLAY = {
  north: 'rgba(96,165,250,0.12)',
  east:  'rgba(245,158,11,0.14)',
  west:  'rgba(244,114,182,0.12)',
  south: 'rgba(52,211,153,0.12)',
};

// 잔광 컴포넌트 — 시작은 "조금 보인다", 끝은 "완전히 사라진다"
function DayAfterglow({ galaxy }) {
  if (!galaxy || !GALAXY_OVERLAY[galaxy]) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 animate-afterglow"
      style={{ background: GALAXY_OVERLAY[galaxy] }}
    />
  );
}

// Before → Transition → After  (0ms / 800ms / 1600ms)
// 감정 흐름이 끊기지 않도록 반드시 유지
export default function DayPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('before'); // before | transitioning | after
  const [textVisible, setTextVisible] = useState(false); // 실루엣보다 300ms 뒤에 텍스트 등장
  const [lumiVisible, setLumiVisible]     = useState(false);
  const [lumiDay7Visible, setLumiDay7Visible] = useState(false);

  // location.state 우선, 없으면 store fallback (새로고침/직접 진입 대응)
  const store = useDreamtownStore();
  const direction = state?.direction ?? store.direction;
  const message   = state?.message   ?? store.message ?? POSTCARD_FALLBACK_MESSAGE;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('transitioning'), 800);
    const t2 = setTimeout(() => setPhase('after'), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // 실루엣 등장(즉시) → 300ms 후 텍스트 등장 → "드러난다" 순서 확보
  useEffect(() => {
    const t = setTimeout(() => setTextVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Day3/Day7 이탈 위험 체크 — GET /api/dt/stars 응답의 retentionTrigger 활용
  useEffect(() => {
    if (state?.isDay3Resume) { setLumiVisible(true); return; }
    const userId = getOrCreateUserId();
    fetch(`/api/dt/stars?userId=${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then(data => {
        if (data.retentionTrigger === 'day3') setLumiVisible(true);
        if (data.retentionTrigger === 'day7') setLumiDay7Visible(true);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="relative w-full h-screen text-white overflow-hidden" style={{ backgroundColor: '#0D1B2A' }}>

      {/* LumiCard — Day3 이탈 방지 (retentionTrigger=day3 시 노출) */}
      {lumiVisible && (
        <div style={{
          position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, width: '90%', maxWidth: 360,
          background: 'linear-gradient(135deg, rgba(13,27,42,0.97) 0%, rgba(20,38,58,0.97) 100%)',
          border: '1px solid rgba(255,215,106,0.28)', borderRadius: 18, padding: '18px 20px',
          animation: 'fadeInDown 0.3s ease',
        }}>
          <p style={{ fontSize: 12, color: 'rgba(255,215,106,0.7)', marginBottom: 6 }}>✨ 루미의 발견</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: 14 }}>
            "{LUMI_DAY3.message}"
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                logFlowEvent({ userId: getOrCreateUserId(), stage: 'recommendation', action: 'click', value: { trigger: LUMI_DAY3.trigger } });
                logFlowEvent({ userId: getOrCreateUserId(), stage: 'growth', action: 'day3_resume', value: { source: 'day_page' } });
                setLumiVisible(false);
              }}
              style={{ flex: 1, padding: '11px 0', background: '#FFD76A', color: '#0D1B2A', fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer' }}
            >
              {LUMI_DAY3.cta}
            </button>
            <button
              onClick={() => setLumiVisible(false)}
              style={{ padding: '11px 14px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 13 }}
            >
              나중에
            </button>
          </div>
        </div>
      )}

      {/* LumiCard Day7 — 완주 유도 (retentionTrigger=day7 시 노출) */}
      {lumiDay7Visible && (
        <div style={{
          position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, width: '90%', maxWidth: 360,
          background: 'linear-gradient(135deg, rgba(13,27,42,0.97) 0%, rgba(20,38,58,0.97) 100%)',
          border: '1px solid rgba(255,215,106,0.45)', borderRadius: 18, padding: '18px 20px',
          animation: 'fadeInDown 0.3s ease',
        }}>
          <p style={{ fontSize: 12, color: 'rgba(255,215,106,0.7)', marginBottom: 6 }}>✨ 루미의 발견</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: 14 }}>
            "{LUMI_DAY7.message}"
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                const uid = getOrCreateUserId();
                const sid = readSavedStar();
                logFlowEvent({ userId: uid, stage: 'recommendation', action: 'click', value: { trigger: LUMI_DAY7.trigger } });
                setLumiDay7Visible(false);
                navigate('/day7-complete', { state: { starId: sid } });
              }}
              style={{ flex: 1, padding: '11px 0', background: '#FFD76A', color: '#0D1B2A', fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer' }}
            >
              {LUMI_DAY7.cta}
            </button>
            <button
              onClick={() => setLumiDay7Visible(false)}
              style={{ padding: '11px 14px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 13 }}
            >
              나중에
            </button>
          </div>
        </div>
      )}

      {/* z-0 — 진입 잔광 */}
      <DayAfterglow galaxy={direction} />

      {/* z-5 — 소원이 실루엣 + 선택 색 스며듦 */}
      <SilhouetteScene galaxy={direction} />

      {/* z-10 — 콘텐츠 */}
      <div className="relative z-10 w-full h-full">

        {/* Before / Transition — 메시지 전면 (실루엣 300ms 뒤 등장) */}
        <div
          className="absolute inset-0 flex items-center justify-center px-8 text-center pointer-events-none"
          style={{
            opacity: (!textVisible || phase === 'after') ? 0 : 1,
            transition: 'opacity 700ms ease-in-out',
            zIndex: 20,
          }}
        >
          <p className="text-xl leading-relaxed opacity-90">{message}</p>
        </div>

        {/* After — 로그 UI */}
        <div
          style={{
            opacity: phase === 'after' ? 1 : 0,
            transition: 'opacity 600ms ease-in-out',
          }}
        >
          {/* 상단 문장 잔류 */}
          <div className="absolute top-20 w-full text-center opacity-60 text-sm pointer-events-none">
            {message}
          </div>

          <DayLogScreen
            direction={direction}
            onComplete={(log) => {
              const saved = saveLog({
                direction,
                message,
                ...log,
              });

              // VoyageLog: emotion/tag/growth → problem/action/result 자동 추론 저장 (fire-and-forget)
              const starId = readSavedStar();
              if (starId && log.feeling && log.helpTag && log.growthLine) {
                postVoyageLog(starId, {
                  emotion: log.feeling,
                  tag:     log.helpTag,
                  growth:  log.growthLine,
                }).catch(() => {});
              }

              // firstVoyage 플래그 저장 (StarBirth 직후 1회만)
              const voyageStarId = state?.starId ?? starId;
              if (state?.isFirstVoyage && voyageStarId) {
                localStorage.setItem('dt_first_voyage_' + voyageStarId, 'true');
              }
              // today 항해 완료 플래그
              const today = new Date().toISOString().slice(0, 10);
              if (voyageStarId) {
                localStorage.setItem('dt_voyage_today_' + voyageStarId + '_' + today, 'true');
              }

              navigate(voyageStarId ? `/my-star/${voyageStarId}` : '/home', { replace: false });
            }}
          />
        </div>

      </div>
    </main>
  );
}
