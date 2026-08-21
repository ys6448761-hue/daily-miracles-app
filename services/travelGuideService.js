/**
 * Travel Guide Service
 * Recommendation engine with priority-order filtering
 * Priority: Safety → Live → Total Time → Transport → Accessibility → Companion → Weather → Emotion
 */

const db = require('../database/db');
const fallbackService = require('./fallbackService');
const sessionService = require('./sessionService');

class TravelGuideService {
  /**
   * Main recommendation endpoint
   * @param {TravelGuideContext} context
   * @returns {Promise<RecommendationResponse>}
   */
  async recommend(context) {
    // Touch session to update activity
    await sessionService.touchSession(context.session_id);

    // Fetch all places
    const places = await this._getPlaces(context.country_code, context.city_code);

    if (!places || places.length === 0) {
      return {
        session_id: context.session_id,
        entry_point: context.entry_point,
        user_mode: context.user_mode,
        places: [],
        food: { type: "none", data_status: "unavailable", message: "No places available" },
        total_required_time: 0,
        fallback_available: false,
        message: "No travel data available",
      };
    }

    // Apply priority filters sequentially
    let candidates = [...places];

    // 1. Safety Filter (required)
    candidates = candidates.filter((p) => this._passesSafety(p));

    if (candidates.length === 0) {
      return this._noPlacesResponse(context, "Safety filter blocked all places");
    }

    // 2. Live Status (must know or assume safe unknown)
    candidates = candidates.map((p) => ({
      ...p,
      live_status: p.live_status || "unknown",
    }));

    // 3. Total Required Time (travel + stay)
    candidates = candidates.map((p) => {
      const travelTime = this._estimateTravelTime(p, context);
      const totalRequired = travelTime + p.avg_stay_minutes;
      return { ...p, travel_time: travelTime, total_required_time: totalRequired };
    });

    // Filter by time constraint
    candidates = candidates.filter(
      (p) => p.total_required_time <= context.time_available_minutes
    );

    if (candidates.length === 0) {
      return this._noPlacesResponse(context, "Insufficient time available");
    }

    // 4. Transportation Accessibility
    candidates = candidates.filter((p) => this._passesTransport(p, context));

    if (candidates.length === 0) {
      return this._noPlacesResponse(context, "No accessible transportation");
    }

    // 5. Physical Accessibility
    candidates = candidates.filter((p) => this._passesAccessibility(p, context));

    if (candidates.length === 0) {
      return this._noPlacesResponse(context, "Accessibility constraints unmet");
    }

    // 6. Companion Requirements
    candidates = candidates.filter((p) => this._passesCompanion(p, context));

    if (candidates.length === 0) {
      return this._noPlacesResponse(context, "Companion requirements unmet");
    }

    // 7. Weather Suitability
    candidates = candidates.filter((p) => this._passesWeather(p, context));

    if (candidates.length === 0) {
      return this._noPlacesResponse(context, "Weather constraints unmet");
    }

    // 8. Emotion/Connection (WISH_TRAVELER only, LAST priority, cannot override reality)
    if (context.user_mode === "WISH_TRAVELER" && context.wish_context) {
      candidates = candidates.sort((a, b) => this._scoreEmotion(a, b, context));
    }

    // Select top 3 places
    const topPlaces = candidates.slice(0, 3).map((p) => ({
      place_code: p.code,
      name_ko: p.name_ko,
      type: "primary",
      stay_minutes: p.avg_stay_minutes,
      travel_time_minutes: p.travel_time === Infinity ? "unknown" : p.travel_time,
      total_required_time: p.total_required_time,
      reason: this._generateReason(p, context),
      safety_pass: true,
      live_status: p.live_status,
      accessibility: {
        wheelchair: p.accessibility_wheelchair || false,
        stroller: p.accessibility_stroller || false,
        bus_accessible: (p.access_by_bus || []).length > 0,
        car_accessible: p.access_by_car !== false,
      },
    }));

    // Prepare fallback (only first 3 can have fallback)
    const fallbackAvailable = topPlaces.length > 0;
    let fallbackRecommendation = null;
    if (fallbackAvailable && topPlaces.length > 0) {
      const firstPlace = candidates[0];
      // Exclude places already in top recommendations to prevent duplicates
      const topPlaceCodes = topPlaces.map(p => p.place_code);
      fallbackRecommendation = await fallbackService.getFallback(
        firstPlace,
        context,
        "Primary place unavailable",
        topPlaceCodes
      );
    }

    // Get Food Recommendation (if meal_context specified)
    const foodRec = await this._getFoodRecommendation(context);

    return {
      session_id: context.session_id,
      entry_point: context.entry_point,
      user_mode: context.user_mode,
      places: topPlaces,
      food: foodRec,
      total_required_time: topPlaces[0]?.total_required_time || 0,
      fallback_available: fallbackAvailable,
      fallback: fallbackRecommendation,
      message: "Recommendations based on your travel context",
    };
  }

  /**
   * Safety Filter
   * @private
   */
  _passesSafety(place) {
    // No inherent safety issues in V0
    return true;
  }

  /**
   * Estimate travel time (no unverified data)
   * @private
   */
  _estimateTravelTime(place, context) {
    // V0: No verified travel time data
    // Return 0 as placeholder (live transit time unknown, not impossible)
    return 0;
  }

  /**
   * Transportation accessibility
   * @private
   */
  _passesTransport(place, context) {
    if (context.has_car) {
      return place.access_by_car !== false;
    } else {
      // Bus required
      return place.access_by_bus && place.access_by_bus.length > 0;
    }
  }

  /**
   * Physical accessibility (wheelchair, stroller, etc.)
   * @private
   */
  _passesAccessibility(place, context) {
    const { companion_constraints } = context;
    if (!companion_constraints) return true;

    if (companion_constraints.disability === "wheelchair") {
      return place.accessibility_wheelchair === true;
    }
    if (companion_constraints.has_kids && companion_constraints.kids_age < 3) {
      return place.accessibility_stroller === true;
    }
    if (companion_constraints.has_elderly) {
      // Elderly: prefer not too difficult
      return (
        place.physical_difficulty === "easy" || place.physical_difficulty === "moderate"
      );
    }

    return true;
  }

  /**
   * Companion requirements (kids, elderly, special needs)
   * @private
   */
  _passesCompanion(place, context) {
    const { people_type, companion_constraints } = context;

    const suitableFor = place.suitable_for || [];

    if (people_type === "family_with_kids" && companion_constraints?.has_kids) {
      return suitableFor.includes("kids_ok");
    }
    if (people_type === "family_elderly" && companion_constraints?.has_elderly) {
      return suitableFor.includes("elderly_ok");
    }
    if (companion_constraints?.disability === "wheelchair") {
      return suitableFor.includes("wheelchair_accessible");
    }

    return true;
  }

  /**
   * Weather suitability
   * @private
   */
  _passesWeather(place, context) {
    if (!context.weather) return true;

    const weatherSuitable = place.weather_suitable || [];
    const { condition } = context.weather;

    // Rainy: only indoor or rain-suitable
    if (condition === "rainy") {
      return (
        place.indoor_outdoor === "indoor" ||
        place.indoor_outdoor === "mixed" ||
        weatherSuitable.includes("rainy")
      );
    }

    return true;
  }

  /**
   * Emotion scoring (for sorting, not filtering)
   * @private
   */
  _scoreEmotion(a, b, context) {
    if (!context.wish_context) return 0;

    const { emotion_primary, emotion_tags } = context.wish_context;
    const emotionScore = (place) => {
      let score = 0;
      if (place.emotion_primary === emotion_primary) score += 10;
      if (place.emotion_tags) {
        const matches = place.emotion_tags.filter((tag) =>
          emotion_tags?.includes(tag)
        ).length;
        score += matches * 2;
      }
      return score;
    };

    return emotionScore(b) - emotionScore(a); // Higher scores first
  }

  /**
   * Food recommendation based on meal_context
   * @private
   */
  async _getFoodRecommendation(context) {
    if (!context.meal_context || context.meal_context === "none") {
      return { type: "none", data_status: "unavailable" };
    }

    // Check if any restaurants exist
    const restaurantCount = await this._getRestaurantCount(
      context.country_code,
      context.city_code
    );

    if (restaurantCount === 0) {
      return {
        type: "none",
        data_status: "unavailable",
        message: "검증된 음식점 정보를 준비 중입니다",
      };
    }

    // Fetch restaurants matching meal_context
    const restaurants = await this._getRestaurants(
      context.country_code,
      context.city_code,
      context.meal_context
    );

    if (restaurants.length === 0) {
      return {
        type: "secondary",
        data_status: "unavailable",
        message: `${context.meal_context} 관련 검증된 음식점이 없습니다`,
      };
    }

    const restaurant = restaurants[0];
    return {
      restaurant_code: restaurant.code,
      name: restaurant.name,
      type: "primary",
      meal_context: context.meal_context,
      accessibility: {
        kids_ok: (restaurant.suitable_for || []).includes("kids_ok"),
        elderly_ok: (restaurant.suitable_for || []).includes("elderly_ok"),
      },
      data_status: "verified",
      message: "Curated restaurant recommendation",
    };
  }

  /**
   * Helper: Fetch places from DB
   * @private
   */
  async _getPlaces(countryCode, cityCode) {
    const query = `
      SELECT * FROM travel_places
      WHERE country_code = $1 AND city_code = $2
      ORDER BY code
    `;

    try {
      const result = await db.query(query, [countryCode, cityCode]);
      return result.rows || [];
    } catch (error) {
      console.error("Failed to fetch places:", error);
      return [];
    }
  }

  /**
   * Helper: Fetch restaurant count
   * @private
   */
  async _getRestaurantCount(countryCode, cityCode) {
    const query = `
      SELECT COUNT(*) as count FROM travel_restaurants
      WHERE country_code = $1 AND city_code = $2
    `;

    try {
      const result = await db.query(query, [countryCode, cityCode]);
      return parseInt(result.rows[0]?.count || 0, 10);
    } catch (error) {
      console.error("Failed to count restaurants:", error);
      return 0;
    }
  }

  /**
   * Helper: Fetch restaurants by meal context
   * @private
   */
  async _getRestaurants(countryCode, cityCode, mealContext) {
    const query = `
      SELECT * FROM travel_restaurants
      WHERE country_code = $1 AND city_code = $2
      AND meal_context @> $3::text[]
      LIMIT 5
    `;

    try {
      const result = await db.query(query, [countryCode, cityCode, [mealContext]]);
      return result.rows || [];
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
      return [];
    }
  }

  /**
   * Helper: Generate reason for recommendation
   * @private
   */
  _generateReason(place, context) {
    if (context.user_mode === "WISH_TRAVELER" && context.wish_context?.emotion_primary) {
      return `${context.wish_context.emotion_primary} 감정과 잘 맞는 장소`;
    }
    return "Your travel context matches this place";
  }

  /**
   * Helper: No places response
   * @private
   */
  _noPlacesResponse(context, reason) {
    return {
      session_id: context.session_id,
      entry_point: context.entry_point,
      user_mode: context.user_mode,
      places: [],
      food: { type: "none", data_status: "unavailable" },
      total_required_time: 0,
      fallback_available: false,
      message: `No recommendations available: ${reason}`,
    };
  }
}

module.exports = new TravelGuideService();
