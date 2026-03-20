/**
 * dreamtownStore.js — DreamTown 세션 상태 SSOT (Zustand)
 *
 * 규칙:
 * ✅ 이 store만 세션 상태 소유
 * ✅ location.state 유실 시 이 store에서 복구
 * ❌ localStorage 혼용 금지 (로그 영속성은 logStorage.js 전담)
 * ❌ 페이지마다 독립 default 금지
 *
 * 상태 흐름:
 *   Intro → Galaxy (setDirection + setMessage)
 *   Galaxy → Day   (setFeeling + setHelpTag + setGrowthLine)
 *   Day    → Postcard (store에서 자동 읽기)
 *   resetFlow()    → /intro 또는 /galaxy 재진입 시 호출
 */

import { create } from 'zustand';
import { POSTCARD_FALLBACK_MESSAGE } from '../constants/dreamtownFlow';

export const useDreamtownStore = create((set) => ({
  // Galaxy 선택 결과
  direction: null,   // 'north' | 'east' | 'west' | 'south'
  message:   null,   // POST_SELECTION 랜덤 문장

  // Day 로그 선택 결과
  feeling:    null,  // 감정 텍스트
  helpTag:    null,  // 도움 태그
  growthLine: null,  // 성장 한 줄

  // Setters
  setDirection:  (direction) => set({ direction }),
  setMessage:    (message)   => set({ message }),
  setFeeling:    (feeling)   => set({ feeling }),
  setHelpTag:    (helpTag)   => set({ helpTag }),
  setGrowthLine: (growthLine) => set({ growthLine }),

  // 전체 흐름 초기화 (새 사이클 시작 시)
  resetFlow: () =>
    set({
      direction:  null,
      message:    POSTCARD_FALLBACK_MESSAGE,
      feeling:    null,
      helpTag:    null,
      growthLine: null,
    }),
}));
