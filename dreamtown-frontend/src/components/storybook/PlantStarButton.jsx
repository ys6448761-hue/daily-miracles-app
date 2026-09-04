/**
 * PlantStarButton.jsx
 *
 * CTA to plant storybook as a star in 소원꿈터.
 * - Only enabled when status === 'storybook_complete'
 * - Calls POST /api/storybook/:journey_id/plant-star
 * - Handles idempotency (no duplicate stars on retry)
 * - Prevents multiple clicks
 * - Shows success state (status transitions to star_planted)
 * - Navigates to /star/:starId when planted (fresh or restored)
 *
 * Props:
 *   journeyId: UUID (required)
 *   status: storybook_complete | star_planted
 *   starId?: UUID (available in restored/already-planted state)
 *   onSuccess?: (starId) => void
 *   onError?: (error) => void
 *   disabled?: boolean
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PlantStarButton.css';

function PlantStarButton({
  journeyId,
  status = 'storybook_complete',
  starId = null,
  onSuccess = null,
  onError = null,
  disabled = false
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const isAlreadyPlanted = status === 'star_planted';
  const isDisabled = disabled || isLoading || isAlreadyPlanted;
  const isComplete = status === 'storybook_complete';

  const handlePlantStar = async () => {
    if (!isComplete) {
      setError('스토리북 완성 후 별을 심을 수 있습니다');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/storybook/${journeyId}/plant-star`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || `별 심기 실패 (${response.status})`
        );
      }

      const data = await response.json();
      setSuccess(true);

      if (onSuccess) {
        onSuccess(data.star_id);
      }
    } catch (err) {
      const msg = err.message || '별 심기 중 오류가 발생했습니다';
      setError(msg);

      if (onError) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="plant-star-button-container">
      {success || isAlreadyPlanted ? (
        <div className="plant-star-success">
          <div className="success-icon">⭐</div>
          <div className="success-text">
            {isAlreadyPlanted ? '이미 별이 심어졌습니다' : '별이 심어졌습니다!'}
          </div>
          <div className="success-subtitle">소원꿈터에서 당신의 별을 볼 수 있습니다</div>
          {starId && (
            <button
              onClick={() => navigate(`/star/${starId}`)}
              className="success-cta-button"
              aria-label="내 별 보기"
            >
              <span className="success-button-emoji">✦</span>
              <span>소원꿈터에서 내 별 보기</span>
            </button>
          )}
        </div>
      ) : (
        <>
          <button
            onClick={handlePlantStar}
            disabled={isDisabled}
            className="plant-star-button"
            aria-label="별 심기"
          >
            {isLoading ? (
              <>
                <span className="button-spinner" />
                <span>별을 심는 중...</span>
              </>
            ) : (
              <>
                <span className="button-emoji">⭐</span>
                <span>소원꿈터에 내 별 심기</span>
              </>
            )}
          </button>

          {!isComplete && (
            <div className="button-warning">
              스토리북이 완성된 후 별을 심을 수 있습니다
            </div>
          )}

          {error && (
            <div className="button-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PlantStarButton;
