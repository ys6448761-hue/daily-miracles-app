/**
 * StorybookRestore.jsx
 * C7A E2E: Restore journey from token (recovery flow)
 *
 * Flow:
 * 1. Parse ?token=... from URL
 * 2. Call GET /api/storybook/restore?token=...
 * 3. Server sets NEW dt_storybook_session_id cookie
 * 4. Navigate to /storybook/:journey_id (view completed storybook)
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './StorybookRestore.css';

function StorybookRestore() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('restoring');
  const [error, setError] = useState(null);

  useEffect(() => {
    const restore = async () => {
      try {
        const token = searchParams.get('token');

        if (!token) {
          setError('복구 토큰이 없습니다');
          setStatus('error');
          return;
        }

        const response = await fetch(`/api/storybook/restore?token=${encodeURIComponent(token)}`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('복구 토큰이 만료되었습니다');
          }
          throw new Error(`복구 실패 (${response.status})`);
        }

        const data = await response.json();

        if (data.ok && data.journey_id) {
          // Server set NEW dt_storybook_session_id cookie automatically
          // Navigate to view the restored journey
          setStatus('restored');
          navigate(`/storybook/${data.journey_id}`);
        } else {
          throw new Error(data.message || '복구에 실패했습니다');
        }
      } catch (err) {
        setError(err.message || '여행을 복구할 수 없습니다');
        setStatus('error');
        console.error('Restore error:', err);
      }
    };

    restore();
  }, [searchParams, navigate]);

  return (
    <div className="storybook-restore">
      <div className="restore-container">
        {status === 'restoring' && (
          <div className="restore-loading">
            <div className="restore-spinner" />
            <p>여행을 복구하는 중...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="restore-error">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button onClick={() => navigate('/')}>홈으로 돌아가기</button>
          </div>
        )}

        {status === 'restored' && (
          <div className="restore-success">
            <div className="success-icon">✨</div>
            <p>여행이 복구되었습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StorybookRestore;
