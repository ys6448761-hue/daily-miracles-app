/**
 * TravelGuidePage
 * Unified entry for PUBLIC and WISH_TRAVELER flows
 */

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TravelGuideHome from '../components/TravelGuide/TravelGuideHome';
import TravelRecommendCard from '../components/TravelGuide/TravelRecommendCard';
import TravelMapView from '../components/TravelGuide/TravelMapView';
import TravelFallbackUI from '../components/TravelGuide/TravelFallbackUI';

function TravelGuidePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [context, setContext] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);

  // Parse entry point from location or default
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const entryPoint = params.get('entry_point') || 'RAMADA_YEOSU';
    const userMode = params.get('mode') || 'PUBLIC';
    const wishId = params.get('wish_id');

    setContext({
      entry_point: entryPoint,
      user_mode: userMode,
      wish_id: wishId,
      country_code: 'KR',
      city_code: 'YEOSU',
    });
  }, [location]);

  // Handle recommendation request
  const handleGetRecommendations = async (userInput) => {
    setLoading(true);
    try {
      const payload = {
        context: {
          ...context,
          session_id: sessionId,
          ...userInput, // time_available_minutes, people_type, has_car, etc.
        },
      };

      const response = await fetch('/api/dt/travel/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSessionId(data.session_id);
        setRecommendations(data);
        // Log event
        logEvent('recommendation_received', { places_count: data.places.length });
      } else {
        console.error('Recommendation failed:', data);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const logEvent = async (eventType, data) => {
    if (!sessionId) return;

    try {
      await fetch('/api/dt/travel/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          entry_point: context?.entry_point,
          user_mode: context?.user_mode,
          event_type: eventType,
          event_data: data,
        }),
      });
    } catch (error) {
      console.error('Event logging failed:', error);
    }
  };

  if (!context) return <div>로딩 중...</div>;

  // Show map if requested
  if (showMap && recommendations?.places.length > 0) {
    return (
      <TravelMapView
        recommendations={recommendations}
        onBack={() => setShowMap(false)}
      />
    );
  }

  // Show recommendations if received
  if (recommendations && !showMap) {
    return (
      <div className="travel-guide-results">
        <h2>추천 여행지</h2>

        {/* Places */}
        <div className="recommendations-list">
          {recommendations.places.map((place, idx) => (
            <TravelRecommendCard
              key={idx}
              place={place}
              onViewMap={() => {
                logEvent('map_open', { place_code: place.place_code });
                setShowMap(true);
              }}
              onGetDirections={() => {
                logEvent('directions_click', { place_code: place.place_code });
                window.open(
                  `https://map.kakao.com/link/to/${place.place_code},${place.lat},${place.lng}`,
                  '_blank'
                );
              }}
            />
          ))}
        </div>

        {/* Food */}
        {recommendations.food && (
          <div className="food-section">
            <h3>🍽️ 식사</h3>
            {recommendations.food.data_status === 'verified' ? (
              <div className="food-card">
                <p>{recommendations.food.name}</p>
              </div>
            ) : (
              <p>{recommendations.food.message}</p>
            )}
          </div>
        )}

        {/* Fallback */}
        {recommendations.fallback && (
          <TravelFallbackUI fallback={recommendations.fallback} />
        )}

        <button onClick={() => {
          logEvent('new_recommendation');
          setRecommendations(null);
        }}>
          다시 추천 받기
        </button>

        {context.user_mode === 'WISH_TRAVELER' && (
          <button onClick={() => {
            logEvent('return_to_starlight');
            navigate(-1);
          }}>
            별빛항로로 돌아가기
          </button>
        )}
      </div>
    );
  }

  // Show home screen
  return (
    <TravelGuideHome
      context={context}
      onGetRecommendations={handleGetRecommendations}
      loading={loading}
    />
  );
}

export default TravelGuidePage;
