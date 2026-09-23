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
        let errorMsg = '요청 처리에 실패했습니다.';
        try {
          const errorData = await response.json();
          if (response.status === 401) {
            localStorage.removeItem('lumi_session_id');
            setSessionId(null);
          }
          errorMsg = typeof errorData.error === 'string' ? errorData.error : errorMsg;
        } catch {
          // non-JSON error body (HTML 502/503 from proxy) — keep default message
        }
        throw new Error(errorMsg);
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
              저는 소여울이에요. 편하게 '소울'이라고 불러주세요. 지금 궁금한 걸 말하듯 물어보세요.
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

function QuoteSummary({ quote }) {
  if (!quote) return null;

  if (quote.status === 'PENDING_HUMAN_QUOTE') {
    return (
      <div className="lumi-quote-summary lumi-quote-pending">
        <p className="lumi-quote-pending-msg">
          견적 담당자가 직접 안내드릴게요. 잠시 후 연락 드리겠습니다.
        </p>
      </div>
    );
  }

  if (quote.status !== 'CALCULATED' || !quote.pricing) return null;

  const { totalSell, totalList, totalSavings } = quote.pricing;
  const fmt = n => n != null ? n.toLocaleString('ko-KR') + '원' : '-';

  return (
    <div className="lumi-quote-summary">
      <p className="lumi-quote-label">예상 비용 ({quote.guestCount}명 기준)</p>
      {Array.isArray(quote.breakdown) && quote.breakdown.map((item, i) => (
        <div key={i} className="lumi-quote-item">
          <span className="lumi-quote-item-name">{item.name}</span>
          <span className="lumi-quote-item-sell">{fmt(item.sell)}</span>
          {item.list > item.sell && (
            <span className="lumi-quote-item-list">{fmt(item.list)}</span>
          )}
        </div>
      ))}
      <div className="lumi-quote-total">
        <span>총 예상 금액</span>
        <span className="lumi-quote-total-sell">{fmt(totalSell)}</span>
      </div>
      {totalSavings > 0 && (
        <p className="lumi-quote-savings">정상가 대비 {fmt(totalSavings)} 절약</p>
      )}
      <p className="lumi-quote-valid">유효기간: {quote.validUntil}까지</p>
    </div>
  );
}

const TYPE_ICON = { hotel: '🏨', leisure: '🎡', attraction: '🗺️', meal: '🍽️', arrival: '📍', departure: '🏁' };
const TIME_SLOT_ORDER = ['arrival', 'morning', 'lunch', 'afternoon', 'evening', 'night', 'departure'];
const TIME_SLOT_LABEL = { morning: '오전', lunch: '점심', afternoon: '오후', evening: '저녁', night: '밤' };
// arrival / departure have no heading — structural markers shown inline

function MyRoute({ route }) {
  if (!route || !Array.isArray(route.days) || route.days.length === 0) return null;

  const formatDate = (iso) => {
    if (!iso) return '';
    const [, m, d] = iso.split('-');
    return `${parseInt(m, 10)}월 ${parseInt(d, 10)}일`;
  };

  const partyLabel = (party) => {
    if (!party) return '';
    const typeMap = { couple: '연인', family: '가족', friends: '친구', adults: '일행' };
    const label = typeMap[party.type] || '일행';
    return `${label} ${party.count}명`;
  };

  return (
    <div className="lumi-route">
      <div className="lumi-route-header">
        <span className="lumi-route-title">MY ROUTE</span>
        <span className="lumi-route-meta">
          {formatDate(route.start_date)}{route.end_date ? ` ~ ${formatDate(route.end_date)}` : ''}
          {route.party ? ` · ${partyLabel(route.party)}` : ''}
        </span>
      </div>
      {route.days.map((day) => (
        <RouteDay key={day.day} day={day} formatDate={formatDate} />
      ))}
    </div>
  );
}

function RouteDay({ day, formatDate }) {
  // Group items by time_slot
  const groups = {};
  (day.items || []).forEach(item => {
    const slot = item.time_slot || 'morning';
    if (!groups[slot]) groups[slot] = [];
    groups[slot].push(item);
  });
  const orderedSlots = TIME_SLOT_ORDER.filter(s => groups[s]);

  return (
    <div className="lumi-route-day">
      <div className="lumi-route-day-header">
        {day.date ? `DAY ${day.day} · ${formatDate(day.date)}` : `${day.day}일차`}
      </div>
      {orderedSlots.map(slot => (
        <div key={slot} className="lumi-route-slot">
          {TIME_SLOT_LABEL[slot] && (
            <div className="lumi-route-slot-label">{TIME_SLOT_LABEL[slot]}</div>
          )}
          {groups[slot].map((item, i) => (
            <RouteItem key={i} item={item} day={day.day} />
          ))}
        </div>
      ))}
    </div>
  );
}

function RouteItem({ item, day }) {
  const icon = TYPE_ICON[item.type] || '📍';
  const isLocked = item.selection_status === 'LOCKED';
  const isSoulRec = item.source === 'SOUL_RECOMMENDED';
  const isDefault = item.source === 'ROUTE_DEFAULT';

  // Hotel sub-text: show 체크인/체크아웃 without time (time=null until verified)
  let subText = null;
  if (item.type === 'hotel' && item.time_slot === 'evening') {
    subText = item.time ? `체크인 · ${item.time}` : '체크인';
  }
  if (item.type === 'hotel' && item.time_slot === 'morning') {
    subText = item.time ? `체크아웃 · ${item.time}` : '체크아웃';
  }

  return (
    <div className={`lumi-route-item${isLocked ? ' lumi-route-item-locked' : ''}${isDefault ? ' lumi-route-item-default' : ''}`}>
      <span className="lumi-route-item-icon">{icon}</span>
      <div className="lumi-route-item-content">
        <span className="lumi-route-item-name">{item.name}</span>
        {subText && <span className="lumi-route-item-sub">{subText}</span>}
      </div>
      {isLocked && <span className="lumi-route-badge lumi-route-badge-locked">선택한 일정</span>}
      {isSoulRec && <span className="lumi-route-badge lumi-route-badge-soul">SOUL 추천</span>}
    </div>
  );
}

function RecommendationResult({ recommendations, onNewQuestion }) {
  const status = recommendations.status;
  const places = recommendations.places || [];
  const nextOptions = recommendations.next_options || [];
  const ctx = recommendations.understood_context || {};

  // GROUP_CONSULTATION_REQUIRED — special path, no mode, no place cards
  if (status === 'GROUP_CONSULTATION_REQUIRED') {
    return (
      <div className="lumi-result">
        <div className="lumi-soul-message">
          {recommendations.message_ko.split('\n').map((line, i) =>
            line ? <p key={i}>{line}</p> : <br key={i} />
          )}
        </div>
        {/* Direct phone consultation — tel: href opens dialer on mobile */}
        <a
          href="tel:1899-6117"
          className="lumi-tel-consultation-btn"
        >
          📞 1899-6117 단체여행 상담하기
        </a>
        {/* Server-provided options (e.g. 여수 관광지 먼저 둘러보기) */}
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

  // ── Presentation mode — controls which artifacts render as primary ─────────
  // Safe fallback: unknown future modes show SOUL message only (not all blocks).
  const mode = recommendations.presentation_mode || 'DISCOVERING';
  const showPlaceCards  = mode === 'DISCOVERING';
  const showRoute       = mode === 'ROUTE_READY' || mode === 'QUOTE_READY';
  const showQuote       = mode === 'QUOTE_READY';
  const showHospitality = mode === 'QUOTE_READY';
  // Known place lookup: structured card replaces soul message text blob
  const showPlaceKnowledge = mode === 'PLACE_KNOWLEDGE'
    && recommendations.status === 'PLACE_LOOKUP'
    && places.length > 0;
  // Show soul message text for all modes EXCEPT known PLACE_LOOKUP (which has its own card)
  const showSoulMessage = !showPlaceKnowledge;

  return (
    <div className="lumi-result">
      {/* SOUL message — all modes except known PLACE_LOOKUP */}
      {showSoulMessage && recommendations.message_ko && (
        <div className="lumi-soul-message">
          {recommendations.message_ko.split('\n').map((line, i) =>
            line ? <p key={i}>{line}</p> : <br key={i} />
          )}
        </div>
      )}

      {/* PLACE_KNOWLEDGE structured card — known place lookup */}
      {showPlaceKnowledge && (
        <PlaceKnowledgeCard
          place={places[0]}
          identityKo={recommendations.place_identity_ko}
        />
      )}

      {/* MY ROUTE — ROUTE_READY and QUOTE_READY (handles null route internally) */}
      {showRoute && <MyRoute route={recommendations.route} />}
      {showRoute && <DownloadRouteButton route={recommendations.route} quote={recommendations.quote} />}

      {/* MY QUOTE — QUOTE_READY only */}
      {showQuote && <QuoteSummary quote={recommendations.quote} />}
      {showQuote && <DownloadQuoteButton quote={recommendations.quote} routeContext={recommendations.route} />}

      {/* Hospitality PREVIEW — QUOTE_READY, eligible individual 1–4 (HospitalitySection gates internally) */}
      {showHospitality && <HospitalitySection quote={recommendations.quote} />}

      {/* Place cards — DISCOVERING only */}
      {showPlaceCards && (
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
      )}

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

function DownloadRouteButton({ route, quote }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!route || !quote) return null;

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dt/lumi/route-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route, quote })
      });
      if (!res.ok) throw new Error('PDF 생성 실패');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.download = `여수-여정-${today}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError('PDF 저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lumi-pdf-download">
      <button
        className="lumi-pdf-btn"
        onClick={handleDownload}
        disabled={loading}
        type="button"
      >
        {loading ? '생성 중...' : '내 일정 PDF 저장'}
      </button>
      {error && <p className="lumi-pdf-error">{error}</p>}
    </div>
  );
}

function DownloadQuoteButton({ quote, routeContext }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Only show for INDIVIDUAL CALCULATED quotes (1–4 persons, group handled separately)
  if (!quote || quote.status !== 'CALCULATED' || !quote.pricing) return null;

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dt/lumi/quote-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote, routeContext })
      });
      if (!res.ok) throw new Error('PDF 생성 실패');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = (routeContext?.start_date || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
      a.download = `여수-견적서-${dateStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError('견적서 저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lumi-pdf-download">
      <button
        className="lumi-pdf-btn lumi-pdf-btn--quote"
        onClick={handleDownload}
        disabled={loading}
        type="button"
      >
        {loading ? '생성 중...' : '내 견적서 PDF 저장'}
      </button>
      {error && <p className="lumi-pdf-error">{error}</p>}
    </div>
  );
}

// ── PlaceKnowledgeCard ──────────────────────────────────────────────────────
// Structured place presentation for PLACE_KNOWLEDGE + known place (PLACE_LOOKUP).
// Sections are conditional — only rendered when verified data is available.
// Data source: places[0] (raw travel_places row) + place_identity_ko (backend-resolved).

const SUITABLE_KO_MAP = {
  pilgrimage: '순례·기도', foodies: '미식 여행', couples: '커플',
  friends: '친구끼리', solo: '혼자', young_adults: '2030',
  family: '가족', kids_ok: '아이 동반', elderly: '어르신 동반', groups: '단체',
};
const SUITABLE_ORDER = ['pilgrimage', 'foodies', 'couples', 'friends', 'solo', 'young_adults', 'family', 'kids_ok', 'elderly', 'groups'];

function PlaceKnowledgeCard({ place, identityKo }) {
  // Suitable-for: up to 4 labels, priority order
  const suitableFor = place.suitable_for || [];
  const suitableLabels = SUITABLE_ORDER.filter(k => suitableFor.includes(k)).slice(0, 4).map(k => SUITABLE_KO_MAP[k]);

  // Stay duration label
  const t = place.avg_stay_minutes;
  const stayLabel = t ? (t < 60 ? `약 ${t}분` : t % 60 === 0 ? `약 ${t / 60}시간` : `약 ${Math.round(t / 60)}시간`) : null;

  // Opening hours — use first non-null weekday value
  const hours = place.opening_hours_json || {};
  const hourStr = hours.mon || hours.tue || hours.wed || hours.thu || hours.fri || hours.sat || hours.sun || null;
  const hasVerifiedHours = !!hourStr;

  // Admission fee
  const fee = place.admission_fee_json;
  const feeText = (() => {
    if (!fee || typeof fee.adult !== 'number') {
      return place.code === 'cablecar' ? '이용 요금이 있어요' : null;
    }
    if (fee.adult === 0) return '무료';
    const parts = [`성인 ${fee.adult.toLocaleString()}원`];
    if (typeof fee.youth === 'number')  parts.push(`청소년 ${fee.youth.toLocaleString()}원`);
    if (typeof fee.senior === 'number') parts.push(`경로 ${fee.senior.toLocaleString()}원`);
    if (typeof fee.child === 'number')  parts.push(`어린이 ${fee.child.toLocaleString()}원`);
    return parts.join(' · ');
  })();

  // Timing hint from weather_suitable
  const weather = place.weather_suitable || [];
  const timingHint = (() => {
    if (weather.includes('sunrise'))                              return '특히 일출 무렵이 아름다워요.';
    if (weather.includes('sunset'))                              return '석양이 질 무렵이 특히 아름다워요.';
    if (weather.includes('night') && weather.includes('evening')) return '저녁부터 밤까지 분위기가 좋아요.';
    if (weather.includes('night'))                               return '밤에도 분위기가 좋아요.';
    if (weather.includes('evening'))                             return '저녁 시간대가 특히 좋아요.';
    if (weather.includes('spring'))                              return '봄에 특히 아름다운 곳이에요.';
    return null;
  })();

  const isHighDifficulty = place.physical_difficulty === 'high';
  const showLiveWarning = place.live_status_required && !hasVerifiedHours;

  const hasFacts = stayLabel || feeText || hourStr;

  return (
    <div className="lumi-pk">
      {/* Header: place name + identity description */}
      <div className="lumi-pk-header">
        <h2 className="lumi-pk-name">{place.name_ko}</h2>
        {identityKo && <p className="lumi-pk-identity">{identityKo}</p>}
      </div>

      {/* Suitable-for tags */}
      {suitableLabels.length > 0 && (
        <div className="lumi-pk-section">
          <p className="lumi-pk-section-label">이런 여행에 잘 어울려요</p>
          <div className="lumi-pk-tags">
            {suitableLabels.map((label, i) => (
              <span key={i} className="lumi-pk-tag">{label}</span>
            ))}
          </div>
        </div>
      )}

      {/* Practical facts: stay / fee / hours */}
      {hasFacts && (
        <div className="lumi-pk-facts">
          {stayLabel && (
            <div className="lumi-pk-fact">
              <span className="lumi-pk-fact-label">머무는 시간</span>
              <span className="lumi-pk-fact-value">{stayLabel} 정도</span>
            </div>
          )}
          {feeText && (
            <div className="lumi-pk-fact">
              <span className="lumi-pk-fact-label">입장료</span>
              <span className="lumi-pk-fact-value">{feeText}</span>
            </div>
          )}
          {hourStr && (
            <div className="lumi-pk-fact">
              <span className="lumi-pk-fact-label">운영시간</span>
              <span className="lumi-pk-fact-value">{hourStr}</span>
            </div>
          )}
        </div>
      )}

      {/* Physical difficulty */}
      {isHighDifficulty && (
        <div className="lumi-pk-caution">경사와 계단이 많아요. 올라가는 데 체력이 필요해요.</div>
      )}

      {/* Timing hint */}
      {timingHint && <div className="lumi-pk-tip">{timingHint}</div>}

      {/* Live status warning — only when place could actually be closed */}
      {showLiveWarning && (
        <div className="lumi-pk-warning">방문 전 운영 여부를 꼭 확인해보세요.</div>
      )}

      <div className="lumi-pk-footer" />
    </div>
  );
}

// ── Hospitality Section ─────────────────────────────────────────────────────
// Individual journey (1–4인) only. GROUP (5+) receives nothing.
// State V0.1: PREVIEW only. AVAILABLE requires payment confirmation (not yet built).

function HospitalitySection({ quote }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const guestCount = quote?.guestCount;
  // Commerce group boundary: 1–4 = INDIVIDUAL, 5+ = GROUP
  // Relationship type (couple/friends) is NOT the authority — guestCount is.
  const isIndividual = Number.isFinite(guestCount) && guestCount >= 1 && guestCount <= 4;
  const isCalculated = quote?.status === 'CALCULATED' && quote?.pricing;

  // Extract product codes from quote breakdown — passed to server for eligibility filtering.
  // Codes are internal quote item identifiers (hotel/leisure codes from quoteEngine).
  // Server resolves these against dt_products.product_code via dt_product_benefits.
  const productCodesParam = React.useMemo(() => {
    const codes = Array.isArray(quote?.breakdown)
      ? quote.breakdown.map(item => item.code).filter(Boolean)
      : [];
    return codes.length > 0 ? `&product_codes=${encodeURIComponent(codes.join(','))}` : '';
  }, [quote?.breakdown]);

  React.useEffect(() => {
    if (!isIndividual || !isCalculated) return;
    let cancelled = false;
    fetch(`/api/dt/lumi/hospitality?guest_count=${guestCount}&city=yeosu${productCodesParam}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [guestCount, isIndividual, isCalculated, productCodesParam]);

  // Group → nothing
  if (!isIndividual || !isCalculated) return null;
  // Loading
  if (!data && !error) return null;
  // No eligible benefits (group excluded server-side or empty data)
  if (!data || !data.eligible || data.benefits.length === 0) return null;

  return (
    <div className="lumi-hospitality">
      <div className="lumi-hospitality-header">
        <span className="lumi-hospitality-icon">🌿</span>
        <div>
          <p className="lumi-hospitality-title">여수에서 준비한 환대</p>
          <p className="lumi-hospitality-subtitle">
            여수여행센터와 함께하는 여행이라면, 여행 중 만나는 파트너들이 작은 환대를 준비해드려요.
          </p>
        </div>
      </div>
      <div className="lumi-hospitality-cards">
        {data.benefits.map(b => (
          <HospitalityCard key={b.benefit_id} benefit={b} />
        ))}
      </div>
    </div>
  );
}

function HospitalityCard({ benefit }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="lumi-hospitality-card">
      <div className="lumi-hospitality-card-top">
        <div className="lumi-hospitality-card-info">
          <p className="lumi-hospitality-partner">{benefit.partner?.name || ''}</p>
          <p className="lumi-hospitality-benefit-title">{benefit.title}</p>
          {benefit.display_copy && (
            <p className="lumi-hospitality-display-copy">{benefit.display_copy}</p>
          )}
          <span className="lumi-hospitality-status-badge">결제 완료 후 이용할 수 있어요</span>
        </div>
      </div>
      <button
        className="lumi-hospitality-expand-btn"
        type="button"
        onClick={() => setExpanded(v => !v)}
      >
        {expanded ? '접기' : '환대 내용 보기'}
      </button>
      {expanded && (
        <div className="lumi-hospitality-detail">
          {benefit.description && (
            <p className="lumi-hospitality-detail-item">
              <span className="lumi-hospitality-detail-label">제공 내용</span>
              <span>{benefit.description}</span>
            </p>
          )}
          {benefit.partner?.address && (
            <p className="lumi-hospitality-detail-item">
              <span className="lumi-hospitality-detail-label">위치</span>
              <span>{benefit.partner.address}</span>
            </p>
          )}
          {benefit.location_hint && (
            <p className="lumi-hospitality-detail-item">
              <span className="lumi-hospitality-detail-label">위치 참고</span>
              <span>{benefit.location_hint}</span>
            </p>
          )}
          <p className="lumi-hospitality-detail-notice">
            ※ 결제 완료 후 이용 방법을 안내해 드립니다.
          </p>
        </div>
      )}
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
