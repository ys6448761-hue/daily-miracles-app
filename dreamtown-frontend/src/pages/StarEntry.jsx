/**
 * PHX-STAR-010 / PHX-STAR-016 — 소원별 스마트 진입 경로
 *
 * Route: /star-entry
 * 1차) localStorage dt_active_star_id 있음 → /my-star/:id
 * 2차) 없음 + dt_user_id 있음 → GET /api/dt/stars?userId=xxx 로 최신 별 복원
 *      (KakaoTalk 인앱 브라우저 WebView 세션 초기화 대비)
 * 3차) 복원 불가 → /wish/input (새 별 만들기)
 *
 * 케니호텔 사이트 03 '나의 소원별' 버튼 연결 대상:
 *   https://app.dailymiracles.kr/star-entry
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { readSavedStar, saveStarId } from '../lib/utils/starSession.js';

export default function StarEntry() {
  const nav = useNavigate();

  useEffect(() => {
    async function resolve() {
      // 1차: localStorage 직접 조회
      const starId = readSavedStar();
      if (starId) {
        nav(`/my-star/${starId}`, { replace: true });
        return;
      }

      // 2차: userId로 서버 복원 (KakaoTalk WebView 세션 초기화 대비)
      const userId = localStorage.getItem('dt_user_id');
      if (userId) {
        try {
          const res = await fetch(`/api/dt/stars?userId=${encodeURIComponent(userId)}`);
          if (res.ok) {
            const data = await res.json();
            const first = data?.stars?.[0];
            if (first?.star_id) {
              saveStarId(first.star_id);
              nav(`/my-star/${first.star_id}`, { replace: true });
              return;
            }
          }
        } catch (_) {
          // 네트워크 오류 → 3차로 진행
        }
      }

      // 3차: 복원 불가 → 새 별 만들기
      nav('/wish/input', { replace: true });
    }
    resolve();
  }, [nav]);

  return <div style={{ background: '#060c17', height: '100vh' }} />;
}
