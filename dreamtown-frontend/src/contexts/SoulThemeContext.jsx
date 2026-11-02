/**
 * SoulThemeContext — 햇살 SOUL / 별빛 SOUL 테마 전환
 *
 * 적용 범위: /muyojeong + /soul/* 경로 (.soul-scope 클래스 범위만)
 * - 자동: 06:00-17:59 햇살, 18:00-05:59 별빛 (기기 현지시간 기준)
 * - 수동: localStorage 'soul_theme_pref' 저장
 * - visibilitychange + 1분 interval → 시간 경계 자동 갱신
 *
 * DB Schema 없음 / 서버 연동 없음 / 다른 페이지 영향 없음
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'soul_theme_pref';

function getAutoTheme() {
  const h = new Date().getHours();
  return (h >= 6 && h < 18) ? 'sunshine' : 'starlight';
}

const SoulThemeContext = createContext(null);

export function SoulThemeProvider({ children }) {
  const [pref, setPrefState] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'auto'; }
    catch { return 'auto'; }
  });
  const [tick, setTick] = useState(0);

  const resolvedTheme = pref === 'auto' ? getAutoTheme() : pref;

  const setPref = useCallback((val) => {
    setPrefState(val);
    try { localStorage.setItem(STORAGE_KEY, val); } catch {}
  }, []);

  // 자동 모드에서 시간 경계 감지: 1분 interval + visibilitychange
  useEffect(() => {
    if (pref !== 'auto') return;
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') setTick(t => t + 1);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pref, tick]);

  return (
    <SoulThemeContext.Provider value={{ pref, resolvedTheme, setPref }}>
      {children}
    </SoulThemeContext.Provider>
  );
}

export function useSoulTheme() {
  const ctx = useContext(SoulThemeContext);
  if (!ctx) throw new Error('useSoulTheme must be used within SoulThemeProvider');
  return ctx;
}
