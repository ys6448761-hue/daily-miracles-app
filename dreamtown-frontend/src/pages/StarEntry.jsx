/**
 * PHX-STAR-010 — 소원별 스마트 진입 경로
 *
 * Route: /star-entry
 * - localStorage dt_active_star_id 있음 → /my-star/:id (기존 별 복귀)
 * - 없음 → /wish/input (새 별 만들기)
 *
 * 케니호텔 사이트 03 '나의 소원별' 버튼 연결 대상:
 *   https://app.dailymiracles.kr/star-entry
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { readSavedStar } from '../lib/utils/starSession.js';

export default function StarEntry() {
  const nav = useNavigate();

  useEffect(() => {
    const starId = readSavedStar();
    if (starId) {
      nav(`/my-star/${starId}`, { replace: true });
    } else {
      nav('/wish/input', { replace: true });
    }
  }, [nav]);

  return <div style={{ background: '#060c17', height: '100vh' }} />;
}
