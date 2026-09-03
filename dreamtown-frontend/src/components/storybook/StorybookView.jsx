/**
 * StorybookView.jsx
 *
 * Main customer view for completed storybook.
 * - Fetches journey from GET /api/storybook/my-journey
 * - Authorizes (session cookie required)
 * - Displays Golden 9-Cut
 * - Shows wish_text and chapter meanings
 * - Provides PlantStarButton CTA
 * - No public feed / no sharing in C5
 *
 * Usage:
 *   <StorybookView />
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GoldenNineCut from './GoldenNineCut';
import PlantStarButton from './PlantStarButton';
import './StorybookView.css';

function StorybookView() {
  const navigate = useNavigate();
  const { journey_id } = useParams();
  const [journey, setJourney] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Guard: If route collision occurred and journey_id = "restore", redirect to restore route
  useEffect(() => {
    if (journey_id === 'restore') {
      console.warn('[C7A_ROUTE_COLLISION_DETECTED] journey_id is "restore", redirecting to /storybook/restore');
      // Extract token from window location if available
      const token = new URLSearchParams(window.location.search).get('token');
      if (token) {
        navigate(`/storybook/restore?token=${encodeURIComponent(token)}`);
      } else {
        navigate('/storybook/restore');
      }
      return;
    }
  }, [journey_id, navigate]);

  useEffect(() => {
    fetchMyJourney();
  }, []);

  const fetchMyJourney = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/storybook/my-journey', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('스토리북 세션이 만료되었습니다. 다시 시작해주세요.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }
        throw new Error(`Failed to fetch journey (${response.status})`);
      }

      const data = await response.json();
      setJourney(data.journey);
      setAssets(data.journey?.assets || []);
    } catch (err) {
      setError(err.message || '스토리북을 불러올 수 없습니다');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStarSuccess = (starId) => {
    // Update local state to reflect star_planted status
    setJourney(prev => ({
      ...prev,
      status: 'star_planted',
      star_id: starId
    }));
  };

  if (loading) {
    return (
      <div className="storybook-view-container loading">
        <div className="storybook-spinner" />
        <p>스토리북을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="storybook-view-container error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>홈으로 돌아가기</button>
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="storybook-view-container error">
        <div className="error-content">
          <div className="error-icon">❌</div>
          <p>스토리북을 찾을 수 없습니다</p>
          <button onClick={() => navigate('/')}>홈으로 돌아가기</button>
        </div>
      </div>
    );
  }

  const isComplete = journey.status === 'storybook_complete' || journey.status === 'star_planted';
  const isIncomplete = journey.status === 'photos_in_progress' ||
                       journey.status === 'photos_complete' ||
                       journey.status === 'art_in_progress';

  return (
    <div className="storybook-view-container">
      {/* Hero Section */}
      <div className="storybook-hero">
        <div className="hero-content">
          <h1 className="hero-title">당신의 별 이야기</h1>
          <p className="hero-subtitle">
            {journey.source_hotel === 'yeosu' ? '여수 여행' : '여행'}에서 만난 당신의 소원
          </p>
        </div>
      </div>

      {/* Wish Section */}
      {journey.wish_text && (
        <section className="wish-section">
          <h2 className="section-title">💭 당신의 소원</h2>
          <div className="wish-text-box">
            <blockquote className="wish-text">{journey.wish_text}</blockquote>
            <p className="wish-date">
              {new Date(journey.created_at).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </section>
      )}

      {/* Status Indicator */}
      <section className="status-section">
        {isIncomplete && (
          <div className="status-incomplete">
            <div className="status-icon">⏳</div>
            <div className="status-message">
              <h3>스토리북 완성 중</h3>
              <p>
                {journey.status === 'photos_in_progress' && '사진을 업로드하는 중입니다'}
                {journey.status === 'photos_complete' && '사진 업로드가 완료되었습니다. 운영자가 스토리를 만드는 중입니다'}
                {journey.status === 'art_in_progress' && '운영자가 스토리 아트를 준비 중입니다'}
              </p>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="status-complete">
            <div className="status-icon">✨</div>
            <div className="status-message">
              <h3>스토리북 완성!</h3>
              <p>당신의 이야기가 완성되었습니다</p>
            </div>
          </div>
        )}
      </section>

      {/* Golden 9-Cut Grid */}
      {isComplete && (
        <>
          <section className="grid-section">
            <GoldenNineCut
              journeyId={journey.id}
              assets={assets}
              status={journey.status}
              loading={loading}
            />
          </section>

          {/* Chapter Guide */}
          <section className="chapter-guide">
            <h2 className="section-title">📖 당신의 이야기</h2>
            <div className="chapter-cards">
              <div className="chapter-card">
                <div className="chapter-emoji">❤️</div>
                <h3 className="chapter-name">진남관</h3>
                <p className="chapter-subtitle">소원을 품다</p>
                <p className="chapter-description">
                  여수 진남관에서 시작된 당신의 소원. 마음 속 깊은 곳에서 비롯된 간절한 소망입니다.
                </p>
              </div>

              <div className="chapter-card">
                <div className="chapter-emoji">🌬️</div>
                <h3 className="chapter-name">케이블카</h3>
                <p className="chapter-subtitle">소원을 보내다</p>
                <p className="chapter-description">
                  하늘 높이 올라가는 케이블카처럼, 당신의 소원을 하늘로 보냅니다. 우리는 함께 하늘을 향합니다.
                </p>
              </div>

              <div className="chapter-card">
                <div className="chapter-emoji">⭐</div>
                <h3 className="chapter-name">종포</h3>
                <p className="chapter-subtitle">별을 심다</p>
                <p className="chapter-description">
                  하늘에서 내려온 당신의 소원은 이제 종포 바다에서 별이 되어 영원히 반짝입니다.
                </p>
              </div>
            </div>
          </section>

          {/* Plant Star CTA */}
          <section className="plant-star-section">
            <PlantStarButton
              journeyId={journey.id}
              status={journey.status}
              onSuccess={handleStarSuccess}
            />
          </section>
        </>
      )}

      {/* Incomplete Status: Show progress message */}
      {isIncomplete && (
        <section className="incomplete-section">
          <div className="incomplete-message">
            <p>스토리북이 완성되면 여기서 당신의 이야기를 볼 수 있습니다.</p>
            <p className="retry-hint">새로고침하여 진행 상황을 확인해주세요.</p>
          </div>
          <button className="retry-button" onClick={() => window.location.reload()}>
            새로고침
          </button>
        </section>
      )}
    </div>
  );
}

export default StorybookView;
