import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initKakao } from './utils/kakaoShare.js';

// Kakao SDK 선제 초기화 — 공유 버튼 클릭 전에 준비
// Kakao.Share는 도메인 오류 시 'KakaoSDKError' 를 window.onerror 로 던짐
window.addEventListener('error', (e) => {
  if (e.message?.includes('KakaoSDK') || e.filename?.includes('kakao')) {
    console.error('[Kakao] ❌ SDK 오류 감지 — 개발자 콘솔 도메인 미등록일 가능성:',
      'https://developers.kakao.com > 내 앱 > 앱 설정 > 플랫폼 > Web에',
      window.location.origin, '추가 필요');
  }
});

// SDK가 이미 로드된 경우 즉시 초기화, 아직 로드 중이면 로드 완료 후 초기화
if (document.readyState === 'complete') {
  initKakao();
} else {
  window.addEventListener('load', initKakao, { once: true });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
