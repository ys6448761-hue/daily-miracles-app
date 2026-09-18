/**
 * LUMI Travel Page
 * ASK-FIRST natural language input for travel recommendations
 * Unified entry point: text input → context extraction → recommendations
 */

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getOrEnsureGuestCredential } from '../api/dreamtown.js';
import '../styles/lumi-travel.css';

export default function LumiTravelPage() {
  const location = useLocation();

  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Example questions for ASK-FIRST screen
  const exampleQuestions = [
    '아이랑 2시간 어디 갈까?',
    '부모님 모시고 저녁 뭐 먹지?',
    '체크아웃 후 3시간 남았어'
  ];

  // No session restore from localStorage — stale session IDs cause 401.
  // Sessions are created fresh by the backend when session_id is absent.

  // Handle natural language input submission
  const handleAsk = async (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Obtain (or reuse) guest credential — must succeed before sending request
      let credential;
      try {
        credential = await getOrEnsureGuestCredential();
      } catch (credErr) {
        setError('인증 준비 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      if (!credential || !credential.guest_token) {
        setError('인증 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      const params = new URLSearchParams(location.search);
      const hotelId = params.get('hotel_id');

      const payload = {
        message: textInput,
        session_id: sessionId,
        hotel_id: hotelId
      };

      const response = await fetch('/api/dt/travel/input/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credential.guest_token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          // Stale session — clear it so next request starts fresh
          localStorage.removeItem('lumi_session_id');
          setSessionId(null);
        }
        throw new Error(errorData.error || '요청 처리에 실패했습니다.');
      }

      const data = await response.json();

      // Track session within this page visit only
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      setRecommendations(data);
      setTextInput('');
    } catch (err) {
      setError(err.message || '서버 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // Handle example question click
  const handleExampleClick = (question) => {
    setTextInput(question);
  };

  // Handle new question (back to input screen)
  const handleNewQuestion = () => {
    setRecommendations(null);
    setError(null);
  };

  // ASK-FIRST Screen
  if (!recommendations) {
    return (
      <div className="lumi-container">
        <div className="lumi-ask-first">
          <h1 className="lumi-title">🌟 LUMI 🌟</h1>
          <p className="lumi-tagline">여수여행, 그냥 물어보세요.</p>

          <div className="lumi-examples">
            <p className="examples-label">예시 질문:</p>
            {exampleQuestions.map((q, i) => (
              <button
                key={i}
                className="lumi-example-btn"
                onClick={() => handleExampleClick(q)}
                type="button"
              >
                • {q}
              </button>
            ))}
          </div>

          <form onSubmit={handleAsk} className="lumi-form">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="무엇이 궁금하세요?"
              autoFocus
              className="lumi-input"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !textInput.trim()}
              className="lumi-submit-btn"
            >
              {loading ? '생각 중...' : '→ 보내기'}
            </button>
          </form>

          {error && (
            <div className="lumi-error">
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Recommendation Result Screen
  return (
    <div className="lumi-container">
      <RecommendationResult
        recommendations={recommendations}
        onNewQuestion={handleNewQuestion}
      />
    </div>
  );
}

/**
 * Recommendation Result Component
 */
function RecommendationResult({ recommendations, onNewQuestion }) {
  const [expandedWhy, setExpandedWhy] = useState(null);

  return (
    <div className="lumi-result">
      <div className="lumi-understood-context">
        <p>{generateContextMessage(recommendations)}</p>
      </div>

      <div className="lumi-choices-container">
        {recommendations.places && recommendations.places.length > 0 ? (
          recommendations.places.map((place, idx) => (
            <div key={idx} className="lumi-choice-card">
              <h3 className="lumi-place-name">{place.name_ko}</h3>

              <div className="lumi-reasons">
                {place.reason && place.reason.split('\n').map((r, i) => (
                  <p key={i}>• {r}</p>
                ))}
              </div>

              <div className="lumi-live-status">
                {place.live_status === 'open' ? (
                  <p className="lumi-status-open">
                    ✓ 운영 중
                    <br />
                    <small>
                      {place.live_status_checked
                        ? `마지막 확인: ${place.live_status_checked}`
                        : ''}
                    </small>
                  </p>
                ) : (
                  <p className="lumi-status-unknown">
                    ⚠️ 운영 여부 확인이 필요해요.
                    <br />
                    <small>
                      {place.live_status_checked
                        ? `마지막 확인: ${place.live_status_checked}`
                        : '정보를 수집 중입니다.'}
                    </small>
                  </p>
                )}

                {place.operating_hours && (
                  <p className="lumi-hours">운영시간: {place.operating_hours}</p>
                )}
              </div>

              <div className="lumi-actions">
                <button className="lumi-map-btn">🗺️ 길찾기</button>
                <button className="lumi-detail-btn">📖 자세히</button>
                <button
                  className="lumi-why-btn"
                  onClick={() =>
                    setExpandedWhy(expandedWhy === idx ? null : idx)
                  }
                  type="button"
                >
                  ❓ 왜?
                </button>
              </div>

              {expandedWhy === idx && (
                <WhyDetail
                  place={place}
                  whyDetails={recommendations.why_details?.[idx]}
                />
              )}
            </div>
          ))
        ) : (
          <div className="lumi-no-results">
            <p>죄송합니다. 현재 추천할 수 있는 장소가 없습니다.</p>
            <p>다시 물어봐주세요.</p>
          </div>
        )}
      </div>

      <button
        className="lumi-new-question-btn"
        onClick={onNewQuestion}
        type="button"
      >
        다른 추천 받기
      </button>
    </div>
  );
}

/**
 * Why Detail Component
 */
function WhyDetail({ place, whyDetails }) {
  if (!whyDetails) return null;

  return (
    <div className="lumi-why-detail">
      <h4>왜 추천했어요?</h4>
      <div className="lumi-why-content">
        {whyDetails.user_conditions && whyDetails.user_conditions.length > 0 && (
          <>
            <p className="lumi-why-label">
              <strong>당신의 조건:</strong>
            </p>
            <ul className="lumi-why-list">
              {whyDetails.user_conditions.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </>
        )}

        {whyDetails.place_features && whyDetails.place_features.length > 0 && (
          <>
            <p className="lumi-why-label">
              <strong>이 장소:</strong>
            </p>
            <ul className="lumi-why-list">
              {whyDetails.place_features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </>
        )}

        {whyDetails.confidence && (
          <p className="lumi-confidence">
            신뢰도: {renderStars(whyDetails.confidence)}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Helper: Generate context message
 */
function generateContextMessage(recommendations) {
  if (!recommendations.message_ko) return '지금 상황에 맞는 곳으로 골라볼게요.';
  return recommendations.message_ko;
}

/**
 * Helper: Render star rating
 */
function renderStars(confidence) {
  const stars = Math.round(confidence * 5);
  const filled = '⭐'.repeat(Math.max(0, Math.min(5, stars)));
  const empty = '☆'.repeat(Math.max(0, 5 - stars));
  return filled + empty;
}
