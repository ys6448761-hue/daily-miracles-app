/**
 * StorybookLanding.jsx
 * C7A E2E: Start a new Storybook journey
 *
 * Flow:
 * 1. Display "Start Journey" button
 * 2. On click: POST /api/storybook/start
 * 3. Server sets dt_storybook_session_id HttpOnly cookie
 * 4. Navigate to /storybook/:journey_id/upload
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StorybookLanding.css';

function StorybookLanding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStart = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/storybook/start', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to start journey (${response.status})`);
      }

      const data = await response.json();

      if (data.ok && data.journey_id) {
        // Server set dt_storybook_session_id cookie automatically
        // Navigate to upload phase
        navigate(`/storybook/${data.journey_id}/upload`);
      } else {
        throw new Error(data.message || 'Failed to create journey');
      }
    } catch (err) {
      setError(err.message || '여행을 시작할 수 없습니다');
      console.error('Start error:', err);
      setLoading(false);
    }
  };

  return (
    <div className="storybook-landing">
      <div className="landing-container">
        <div className="landing-hero">
          <h1 className="landing-title">당신의 별 이야기</h1>
          <p className="landing-subtitle">
            여행에서 만난 순간들을 별이 되어 영원히 반짝이게 하세요
          </p>
        </div>

        <div className="landing-content">
          <div className="story-preview">
            <div className="preview-card">
              <div className="preview-emoji">❤️</div>
              <h3>진남관에서</h3>
              <p>소원을 품다</p>
            </div>
            <div className="preview-card">
              <div className="preview-emoji">🌬️</div>
              <h3>케이블카에서</h3>
              <p>소원을 보내다</p>
            </div>
            <div className="preview-card">
              <div className="preview-emoji">⭐</div>
              <h3>종포 바다에서</h3>
              <p>별을 심다</p>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <button
            className="start-button"
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? '여행 시작하는 중...' : '여행 시작하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StorybookLanding;
