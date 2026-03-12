import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getGalaxies, getGalaxy } from '../api/dreamtown.js';

const GALAXY_META = {
  challenge:    { emoji: '🔥', color: 'border-purple-500/50 bg-purple-900/20',  badge: 'bg-purple-500/20 text-purple-300', desc: '다시 시작하는 용기와 첫 발걸음이 모이는 은하' },
  growth:       { emoji: '🌱', color: 'border-teal-500/50 bg-teal-900/20',     badge: 'bg-teal-500/20 text-teal-300',    desc: '작은 변화와 새로운 시작이 자라는 은하' },
  relationship: { emoji: '💙', color: 'border-pink-500/50 bg-pink-900/20',     badge: 'bg-pink-500/20 text-pink-300',    desc: '연결과 마음의 다리가 만들어지는 은하' },
  healing:      { emoji: '🌿', color: 'border-emerald-500/50 bg-emerald-900/20', badge: 'bg-emerald-500/20 text-emerald-300', desc: '조용한 회복과 쉼의 빛이 모이는 은하' },
};

const FOUNDING_STARS = {
  challenge:    'Courage Star',
  growth:       'Origin Star',
  healing:      'Healing Star',
  relationship: null,
};

export default function Galaxy() {
  const nav = useNavigate();
  const [galaxies, setGalaxies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    getGalaxies()
      .then(d => setGalaxies(d.galaxies || []))
      .catch(() => {});
  }, []);

  async function openDetail(code) {
    if (selected === code) { setSelected(null); setDetail(null); return; }
    setSelected(code);
    try {
      const d = await getGalaxy(code);
      setDetail(d);
    } catch {
      setDetail({ code, name_ko: '로딩 실패', constellations: [] });
    }
  }

  // Compass 순서: north(challenge), east(growth), west(relationship), south(healing)
  const ordered = ['challenge', 'growth', 'relationship', 'healing'];
  const dirLabel = { challenge: '북 · North', growth: '동 · East', relationship: '서 · West', healing: '남 · South' };

  return (
    <div className="min-h-screen flex flex-col px-4 py-8">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <p className="text-white/40 text-xs mb-1">DreamTown Galaxy Map</p>
        <h1 className="text-xl font-bold text-white">드림타운 은하지도</h1>
        <p className="text-white/50 text-sm mt-1">당신의 별이 머무는 은하를 탐험해보세요.</p>
      </motion.div>

      {/* 은하 카드 목록 */}
      <div className="flex flex-col gap-3 flex-1">
        {ordered.map((code, i) => {
          const g = galaxies.find(x => x.code === code);
          const meta = GALAXY_META[code];
          const foundingStar = FOUNDING_STARS[code];
          const isEmpty = code === 'relationship';

          return (
            <motion.div
              key={code}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {/* 카드 */}
              <button
                onClick={() => openDetail(code)}
                className={`w-full text-left border rounded-2xl p-4 transition-all ${meta.color} ${
                  selected === code ? 'ring-1 ring-star-gold' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{meta.emoji}</span>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {g ? g.name_ko : code}
                      </p>
                      <p className="text-white/40 text-xs">{dirLabel[code]}</p>
                    </div>
                  </div>
                  <span className="text-white/30 text-sm">{selected === code ? '▲' : '▼'}</span>
                </div>

                <p className="text-white/60 text-xs mb-3">{meta.desc}</p>

                {isEmpty ? (
                  <div className={`inline-block text-xs px-2 py-1 rounded-full ${meta.badge}`}>
                    이 은하는 첫 번째 별을 기다리고 있어요
                  </div>
                ) : (
                  <div className={`inline-block text-xs px-2 py-1 rounded-full ${meta.badge}`}>
                    대표 별: {foundingStar}
                  </div>
                )}
              </button>

              {/* 상세 패널 */}
              <AnimatePresence>
                {selected === code && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/5 border border-white/10 border-t-0 rounded-b-2xl p-4">
                      {isEmpty ? (
                        <div className="text-center py-4">
                          <p className="text-white/60 text-sm mb-1">No star has arrived here yet.</p>
                          <p className="text-white/40 text-xs">아직 이곳에 도착한 별은 없어요.</p>
                          <button
                            onClick={() => nav('/wish')}
                            className="mt-4 text-star-gold text-sm font-medium"
                          >
                            당신의 별이 이 은하의 첫 빛이 될 수 있어요 →
                          </button>
                        </div>
                      ) : (
                        <div>
                          {detail?.constellations?.length > 0 ? (
                            detail.constellations.map(c => (
                              <div key={c.code} className="mb-3">
                                <p className="text-white/60 text-xs mb-1">별자리</p>
                                <p className="text-white text-sm font-medium mb-2">{c.name_ko}</p>
                                {c.stories?.map(s => (
                                  <div key={s.id} className="bg-white/5 rounded-xl p-3 mb-2">
                                    <p className="text-white/80 text-xs font-medium">{s.title}</p>
                                    <p className="text-white/50 text-xs mt-1 line-clamp-2">{s.story_text}</p>
                                  </div>
                                ))}
                              </div>
                            ))
                          ) : (
                            <p className="text-white/40 text-xs text-center py-2">
                              곧 더 많은 별 이야기가 이곳에 채워질 거예요.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* 하단 감성 문구 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center text-white/30 text-xs mt-6"
      >
        당신의 소원은 혼자가 아닙니다.
      </motion.p>

      {/* 탭 바 */}
      <BottomTab active="galaxy" />
    </div>
  );
}

function BottomTab({ active }) {
  const nav = useNavigate();
  const tabs = [
    { key: 'home',   label: 'Home',   path: '/home',  emoji: '🏠' },
    { key: 'wish',   label: 'Wish',   path: '/wish',  emoji: '✨' },
    { key: 'galaxy', label: 'Galaxy', path: '/galaxy',emoji: '🌌' },
    { key: 'mystar', label: 'My Star',path: '/home',  emoji: '⭐' },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-night-sky/90 backdrop-blur border-t border-white/10 flex">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => nav(t.path)}
          className={`flex-1 flex flex-col items-center py-3 text-xs transition-colors ${
            active === t.key ? 'text-star-gold' : 'text-white/30 hover:text-white/60'
          }`}
        >
          <span className="text-lg">{t.emoji}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}
