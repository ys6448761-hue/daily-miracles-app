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
  const status = recommendations.status;
  const places = recommendations.places || [];
  const nextOptions = recommendations.next_options || [];
  const ctx = recommendations.understood_context || {};

  // GROUP_CONSULTATION_REQUIRED — special path, no place cards
  if (status === 'GROUP_CONSULTATION_REQUIRED') {
    return (
      <div className="lumi-result">
        <div className="lumi-soul-message">
          {recommendations.message_ko.split('\n').map((line, i) =>
            line ? <p key={i}>{line}</p> : <br key={i} />
          )}
        </div>
        {nextOptions.length > 0 && (
          <div className="lumi-next-options">
            {nextOptions.map((opt, i) => (
              <button key={i} className="lumi-next-option-btn" type="button" onClick={onNewQuestion}>
                {opt}
              </button>
            ))}
          </div>
        )}
        <button className="lumi-new-question-btn" onClick={onNewQuestion} type="button">
          처음으로
        </button>
      </div>
    );
  }

  return (
    <div className="lumi-result">
      {/* SOUL situation acknowledgement */}
      {recommendations.message_ko && (
        <div className="lumi-soul-message">
          {recommendations.message_ko.split('\n').map((line, i) =>
            line ? <p key={i}>{line}</p> : <br key={i} />
          )}
        </div>
      )}

      {/* Place cards */}
      <div className="lumi-choices-container">
        {places.length > 0 ? (
          places.map((place, idx) => (
            <PlaceCard key={idx} place={place} whyDetail={recommendations.why_details?.[idx]} ctx={ctx} />
          ))
        ) : (
          <div className="lumi-no-results">
            <p>지금 조건에 맞는 장소를 찾지 못했어요.</p>
            <p>질문을 조금 바꿔서 다시 물어봐 주세요.</p>
          </div>
        )}
      </div>

      {/* Next options */}
      {nextOptions.length > 0 && (
        <div className="lumi-next-options">
          {nextOptions.map((opt, i) => (
            <button key={i} className="lumi-next-option-btn" type="button" onClick={onNewQuestion}>
              {opt}
            </button>
          ))}
        </div>
      )}

      <button className="lumi-new-question-btn" onClick={onNewQuestion} type="button">
        다른 질문 하기
      </button>
    </div>
  );
}

function PlaceCard({ place, whyDetail, ctx }) {
  const [showWhy, setShowWhy] = useState(false);
  const suitableFor = place.suitable_for || [];
  const emotionTags = place.emotion_tags || [];

  // Practical facts — only show supported data
  const facts = [];
  if (place.avg_stay_minutes) {
    facts.push(`약 ${place.avg_stay_minutes}분 소요`);
  }
  if (place.indoor_outdoor === 'indoor') facts.push('실내');
  else if (place.indoor_outdoor === 'outdoor') facts.push('야외');
  else if (place.indoor_outdoor === 'mixed') facts.push('실내·야외');

  if (place.admission_fee_json === null && place.live_status_required) {
    // No fee data available — don't claim free
  }

  // Accessibility facts (only when verified)
  if (place.accessibility?.wheelchair_status === 'verified_yes') facts.push('휠체어 가능');
  if (place.accessibility?.stroller_status === 'verified_yes') facts.push('유모차 가능');

  // Live status handling
  const liveStatus = place.live_status;
  const liveRequired = place.live_status_required;

  return (
    <div className="lumi-choice-card">
      <h3 className="lumi-place-name">{place.name_ko}</h3>

      {/* Why it fits */}
      {place.reason && (
        <p className="lumi-place-reason">{place.reason}</p>
      )}

      {/* Practical facts strip */}
      {facts.length > 0 && (
        <div className="lumi-fact-strip">
          {facts.map((f, i) => <span key={i} className="lumi-fact-tag">{f}</span>)}
        </div>
      )}

      {/* Warnings — honest uncertainty notices */}
      <div className="lumi-notices">
        {liveStatus === 'open' ? (
          <span className="lumi-notice-ok">● 운영 확인됨</span>
        ) : liveRequired ? (
          <span className="lumi-notice-warn">방문 전 운영 여부를 확인하세요.</span>
        ) : null}
        {(place.warnings || []).includes('walking_burden_unknown') && (
          <span className="lumi-notice-warn">보행 난이도 정보 없음 — 현장 확인 권장</span>
        )}
      </div>

      {/* Why expand */}
      {whyDetail && (
        <div className="lumi-why-section">
          <button
            className="lumi-why-toggle"
            onClick={() => setShowWhy(!showWhy)}
            type="button"
          >
            {showWhy ? '접기' : '왜 이 곳인가요?'}
          </button>
          {showWhy && <WhyDetail place={place} whyDetails={whyDetail} />}
        </div>
      )}
    </div>
  );
}

function WhyDetail({ place, whyDetails }) {
  if (!whyDetails) return null;
  const conditions = (whyDetails.user_conditions || []).filter(Boolean);
  const features = (whyDetails.place_features || []).filter(Boolean);
  if (conditions.length === 0 && features.length === 0) return null;

  return (
    <div className="lumi-why-detail">
      {conditions.length > 0 && (
        <>
          <p className="lumi-why-label">당신의 상황</p>
          <ul className="lumi-why-list">
            {conditions.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </>
      )}
      {features.length > 0 && (
        <>
          <p className="lumi-why-label">이 장소 특징</p>
          <ul className="lumi-why-list">
            {features.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}
