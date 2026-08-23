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
    // RULE: unknown travel_time MUST NOT be treated as 0
    candidates = candidates.map((p) => {
      const travelTimeObj = this._estimateTravelTime(p, context);

      // Preserve null as null; do NOT convert to 0
      const travelMinutes = travelTimeObj.minutes;
      const totalRequired = travelMinutes === null
        ? null  // Unknown travel time → unknown total time
        : travelMinutes + p.avg_stay_minutes;

      return {
        ...p,
        travel_time_minutes: travelMinutes,
        travel_time_status: travelTimeObj.status || 'unknown',
        total_required_time: totalRequired,
        total_required_time_status: travelMinutes === null ? 'unknown' : 'verified',
        _travel_time_unknown: travelTimeObj.status === 'unknown'
      };
    });

    // Filter by time constraint with fail-safe for unknown times
    // RULE: unknown total_time MUST NOT be silently accepted
    candidates = candidates.filter((p) => {
      // If total_required_time is unknown, include with warning (fail-safe)
      if (p.total_required_time === null) {
        if (!p._warnings) p._warnings = [];
        p._warnings.push('total_required_time_unverified');
        return true; // Include but flag
      }
      // Verified time: filter by constraint
      return p.total_required_time <= context.time_available_minutes;
    });

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
      travel_time_minutes: p.travel_time_minutes,
      travel_time_status: p.travel_time_status,
      total_required_time: p.total_required_time,
      total_required_time_status: p.total_required_time_status || 'unknown',
      reason: this._generateReason(p, context),
      safety_pass: true,
      live_status: p.live_status,
      accessibility: {
        // NEW: Status fields (Phase 1)
        wheelchair_status: p.accessibility_wheelchair_status || 'unknown',
        stroller_status: p.accessibility_stroller_status || 'unknown',
        bus_accessible_status: p.bus_accessible_status || 'unknown',
        // DEPRECATED: Old fields (backward compat, Phase 2 removal)
        wheelchair: p.accessibility_wheelchair || false,
        stroller: p.accessibility_stroller || false,
        bus_accessible: (p.access_by_bus || []).length > 0,
        car_accessible: p.access_by_car !== false,
      },
      warnings: p._warnings && p._warnings.length > 0 ? p._warnings : [],
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

    // Optional: Get Cafe Partners (max 2 Yeosu cafes)
    const cafes = await this._getCafePartners(context.country_code, context.city_code);

    // Optional: Get Benefits (matched to Yeosu partners)
    const benefits = await this._getBenefits(context.country_code, context.city_code);

    return {
      session_id: context.session_id,
      entry_point: context.entry_point,
      user_mode: context.user_mode,
      places: topPlaces,
      food: foodRec,
      cafes: cafes.length > 0 ? cafes : undefined,
      benefits: benefits.length > 0 ? benefits : undefined,
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
   * Returns { minutes: number|null, status: 'verified'|'unknown' }
   * @private
   */
  _estimateTravelTime(place, context) {
    // V0: No verified travel time data
    // Return status='unknown', NOT 0 (which implies same location)
    return {
      minutes: null,
      status: 'unknown',
      source: 'not_available'
    };
  }

  /**
   * Transportation accessibility (fail-safe for unknown status)
   * RULE: unknown status does NOT filter out — surfaces warning instead
   * @private
   */
  _passesTransport(place, context) {
    if (context.has_car) {
      return place.access_by_car !== false;
    } else {
      // No-car traveler needs bus
      const busStatus = place.bus_accessible_status || 'unknown';

      if (busStatus === 'verified_yes') {
        return true; // Confirmed bus accessible
      }
      if (busStatus === 'verified_no') {
        return false; // Confirmed NOT bus accessible, exclude
      }
      if (busStatus === 'unknown') {
        // FAIL-SAFE: Include but flag warning
        if (!place._warnings) place._warnings = [];
        place._warnings.push('bus_accessibility_unverified');
        return true; // Do NOT reject
      }
    }
  }

  /**
   * Physical accessibility (fail-safe for unknown status)
   * RULE: unknown status does NOT filter out — surfaces warning instead
   * RULE: verified_yes > unknown (warning) > verified_no (exclude)
   * @private
   */
  _passesAccessibility(place, context) {
    const { companion_constraints } = context;
    if (!companion_constraints) return true;

    // Wheelchair accessibility
    if (companion_constraints.disability === "wheelchair") {
      const wheelchairStatus = place.accessibility_wheelchair_status || 'unknown';

      if (wheelchairStatus === 'verified_yes') {
        return true; // Confirmed accessible
      }
      if (wheelchairStatus === 'verified_no') {
        return false; // Confirmed inaccessible, exclude
      }
      if (wheelchairStatus === 'unknown') {
        // FAIL-SAFE: Include but flag warning
        if (!place._warnings) place._warnings = [];
        place._warnings.push('wheelchair_accessibility_unverified');
        return true; // Do NOT reject
      }
    }

    // Stroller accessibility (kids under 3)
    if (companion_constraints.has_kids && companion_constraints.kids_age < 3) {
      const strollerStatus = place.accessibility_stroller_status || 'unknown';

      if (strollerStatus === 'verified_yes') {
        return true;
      }
      if (strollerStatus === 'verified_no') {
        return false;
      }
      if (strollerStatus === 'unknown') {
        // FAIL-SAFE: Include but flag warning
        if (!place._warnings) place._warnings = [];
        place._warnings.push('stroller_accessibility_unverified');
        return true; // Do NOT reject
      }
    }

    // Elderly: check physical difficulty only if available
    if (companion_constraints.has_elderly) {
      // Only filter if physical_difficulty is explicitly set
      if (place.physical_difficulty) {
        return (
          place.physical_difficulty === "easy" || place.physical_difficulty === "moderate"
        );
      }
      // If unknown, allow (don't reject)
      return true;
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
   * Food recommendation V0 — Priority: traveler fit > cuisine > curated confidence
   * Max 3 results; benefits never boost food ranking
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

    // Score by traveler fit
    const scored = restaurants.map((rest) => {
      let score = 0;

      // Priority 1: Traveler fit (people_type match)
      const suitableFor = rest.suitable_for || [];
      if (context.people_type === "family_with_kids" && suitableFor.includes("family")) {
        score += 10;
      }
      if (context.people_type === "couple" && suitableFor.includes("couple")) {
        score += 10;
      }
      if (context.people_type === "solo" && suitableFor.includes("solo")) {
        score += 10;
      }
      if (suitableFor.includes("groups")) {
        score += 5;
      }

      // Priority 2: Companion constraints
      if (context.companion_constraints?.has_kids && suitableFor.includes("family")) {
        score += 5;
      }
      if (context.companion_constraints?.has_elderly && suitableFor.includes("elderly")) {
        score += 3;
      }

      // Priority 3: Curated confidence (source='local_curated' boost)
      if (rest.source === "local_curated") {
        score += 2;
      }

      return { ...rest, _score: score };
    });

    // Sort by score descending, cap at 3
    const topRestaurants = scored
      .sort((a, b) => b._score - a._score)
      .slice(0, 3)
      .map((rest) => ({
        restaurant_code: rest.code,
        name: rest.name,
        cuisine_type: rest.cuisine_type,
        meal_context: rest.meal_context,
        suitable_for: rest.suitable_for,
        accessibility: {
          kids_ok: (rest.suitable_for || []).includes("family"),
          elderly_ok: (rest.suitable_for || []).includes("elderly"),
        },
      }));

    return {
      restaurants: topRestaurants,
      data_status: "v0_curated",
      message: "Curated local recommendations based on traveler profile",
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
   * Helper: Fetch restaurants by meal context (all matching for ranking)
   * @private
   */
  async _getRestaurants(countryCode, cityCode, mealContext) {
    const query = `
      SELECT * FROM travel_restaurants
      WHERE country_code = $1 AND city_code = $2
      AND meal_context @> $3::text[]
      ORDER BY source DESC, code ASC
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

  /**
   * Helper: Get cafe partners (max 2, optional field)
   * @private
   */
  async _getCafePartners(countryCode, cityCode) {
    const query = `
      SELECT id, name, category, phone, address
      FROM dt_partners
      WHERE LOWER(city_code) = LOWER($1)
      AND category IN ('cafe', 'beverage', 'coffee')
      AND is_active = true
      ORDER BY name
      LIMIT 2
    `;

    try {
      const result = await db.query(query, [cityCode]);
      return result.rows || [];
    } catch (error) {
      console.error("Failed to fetch cafes:", error);
      return [];
    }
  }

  /**
   * Helper: Get benefits for city partners (optional field)
   * @private
   */
  async _getBenefits(countryCode, cityCode) {
    const query = `
      SELECT b.id, b.partner_id, b.benefit_type, b.title, b.description, p.name as partner_name
      FROM dt_benefits b
      JOIN dt_partners p ON b.partner_id = p.id
      WHERE LOWER(p.city_code) = LOWER($1) AND b.is_active = true
      ORDER BY p.name, b.benefit_type
      LIMIT 5
    `;

    try {
      const result = await db.query(query, [cityCode]);
      return result.rows || [];
    } catch (error) {
      console.error("Failed to fetch benefits:", error);
      return [];
    }
  }
}

module.exports = new TravelGuideService();
