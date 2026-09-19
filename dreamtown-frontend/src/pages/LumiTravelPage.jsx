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

  const exampleQuestions = [
    '🌊 지금 두 시간 붕 떴는데 뭐 하지?',
    '🌙 밤인데 숙소 들어가긴 아쉬워',
    '📸 사진 잘 나오는 곳 세 군데만',
    '👨‍👩‍👧 부모님과 많이 안 걷는 코스는?',
    '💸 돈 많이 안 쓰고 오늘 놀 수 있어?',
    '👥 친구 12명, 1박2일 비용은?',
  ];

  // Shared submit logic — used by both manual input and example question tap
  const submitQuestion = async (text) => {
    if (!text.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      let credential;
      try {
        credential = await getOrEnsureGuestCredential();
      } catch {
        setError('인증 준비 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      if (!credential || !credential.guest_token) {
        setError('인증 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      const params = new URLSearchParams(location.search);
      const hotelId = params.get('hotel_id');

      const response = await fetch('/api/dt/travel/input/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credential.guest_token}`,
        },
        body: JSON.stringify({ message: text, session_id: sessionId, hotel_id: hotelId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          localStorage.removeItem('lumi_session_id');
          setSessionId(null);
        }
        throw new Error(errorData.error || '요청 처리에 실패했습니다.');
      }

      const data = await response.json();
      if (data.session_id) setSessionId(data.session_id);
      setRecommendations(data);
      setTextInput('');
    } catch (err) {
      setError(err.message || '서버 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = (e) => {
    e.preventDefault();
    submitQuestion(textInput);
  };

  // Tap example → immediate submit (no double-submit if already loading)
  const handleExampleClick = (question) => {
    submitQuestion(question);
  };

  const handleNewQuestion = () => {
    setRecommendations(null);
    setError(null);
  };

  // ASK-FIRST Entry Screen
  if (!recommendations) {
    return (
      <div className="lumi-container">
        <div className="lumi-ask-first">

          {/* Hero */}
          <div className="lumi-hero">
            <div className="lumi-eyebrow">무료여행정보</div>
            <div className="lumi-brand">무여정</div>
            <h1 className="lumi-headline">여수가 궁금하면, 무여정.</h1>
            <p className="lumi-tagline">그냥 말하듯 물어보세요.</p>
          </div>

          {/* Service status */}
          <div className="lumi-intro-card">
            <span className="lumi-intro-name">여수 현지 친구, 무여정</span>
            <span className="lumi-intro-status">● 지금 물어볼 수 있어요</span>
          </div>

          {/* Interaction card */}
          <div className="lumi-interaction-card">
            <p className="lumi-q-heading">지금 뭐가 궁금하세요?</p>
            <p className="lumi-q-sub">
              정해진 질문은 없어요. 지금 상황을 그대로 말해 주세요.
            </p>

            <div className="lumi-chips">
              {exampleQuestions.map((q, i) => (
                <button
                  key={i}
                  className="lumi-chip"
                  onClick={() => handleExampleClick(q)}
                  disabled={loading}
                  type="button"
                >
                  {q}
                </button>
              ))}
            </div>

            {error && (
              <div className="lumi-error">
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleAsk} className="lumi-form">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="예: 지금 비 오는데 어디 가지?"
                autoFocus
                className="lumi-input"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !textInput.trim()}
                className="lumi-send-btn"
                aria-label="보내기"
              >
                {loading ? (
                  <span className="lumi-sending-dot" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    );
  }

  // Result Screen
  return (
    <div className="lumi-container lumi-container--result">
      <RecommendationResult
        recommendations={recommendations}
        onNewQuestion={handleNewQuestion}
      />
    </div>
  );
}

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
                  onClick={() => setExpandedWhy(expandedWhy === idx ? null : idx)}
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

      <button className="lumi-new-question-btn" onClick={onNewQuestion} type="button">
        다른 추천 받기
      </button>
    </div>
  );
}

function WhyDetail({ place, whyDetails }) {
  if (!whyDetails) return null;

  return (
    <div className="lumi-why-detail">
      <h4>왜 추천했어요?</h4>
      <div className="lumi-why-content">
        {whyDetails.user_conditions && whyDetails.user_conditions.length > 0 && (
          <>
            <p className="lumi-why-label"><strong>당신의 조건:</strong></p>
            <ul className="lumi-why-list">
              {whyDetails.user_conditions.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </>
        )}
        {whyDetails.place_features && whyDetails.place_features.length > 0 && (
          <>
            <p className="lumi-why-label"><strong>이 장소:</strong></p>
            <ul className="lumi-why-list">
              {whyDetails.place_features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </>
        )}
        {whyDetails.confidence && (
          <p className="lumi-confidence">신뢰도: {renderStars(whyDetails.confidence)}</p>
        )}
      </div>
    </div>
  );
}

function generateContextMessage(recommendations) {
  if (!recommendations.message_ko) return '지금 상황에 맞는 곳으로 골라볼게요.';
  return recommendations.message_ko;
}

function renderStars(confidence) {
  const stars = Math.round(confidence * 5);
  const filled = '⭐'.repeat(Math.max(0, Math.min(5, stars)));
  const empty = '☆'.repeat(Math.max(0, 5 - stars));
  return filled + empty;
}
