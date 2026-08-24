/**
 * Travel Guide Service
 * Recommendation engine with priority-order filtering
 * Priority: Safety → Live → Total Time → Transport → Accessibility → Companion → Weather → Emotion
 */

const db = require('../database/db');
const fallbackService = require('./fallbackService');
const sessionService = require('./sessionService');

// Experience cluster configuration
// Prevents geographic monopoly in top-3 recommendations
const EXPERIENCE_CLUSTERS = {
  dolsan_area: ['dolsan_daegyo', 'dolsan_nightscape', 'cablecar']
};

class TravelGuideService {
  /**
   * Main recommendation endpoint
   * @param {TravelGuideContext} context with optional journey preferences
   * @returns {Promise<RecommendationResponse>}
   */
  async recommend(context) {
    // Touch session to update activity
    await sessionService.touchSession(context.session_id);

    // Journey preferences (session-level state)
    const excludePlaceIds = context.exclude_place_ids || [];
    const mustVisitPlaceIds = context.must_visit_place_ids || [];

    // Fetch all places
    let places = await this._getPlaces(context.country_code, context.city_code);

    // Apply user exclusions: filter out explicitly rejected places
    places = places.filter(p => !excludePlaceIds.includes(p.code));

    // P0 Ramada Field Test: Exclude jaisan_park from default rotation
    // Keep in DB for seasonal recommendations (autumn foliage), but not in default courses
    if (context.entry_point && context.entry_point.includes('RAMADA')) {
      places = places.filter(p => p.code !== 'jaisan_park');
    }

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

    // 9. Traveler Fit Scoring (Phase 1B: evidence-based traveler personalization)
    // Score based on suitable_for tags, not demographics assumptions
    candidates = candidates.sort((a, b) => {
      const scoreA = this._calculateTravelerFitScore(a, context);
      const scoreB = this._calculateTravelerFitScore(b, context);
      // Higher score first
      return scoreB - scoreA;
    });

    // 10. Experience Cluster Diversity (prevent geographic monopoly)
    candidates = this._applyClusterDiversity(candidates);

    // JOURNEY COMPOSITION V0: Variable stop count based on available time
    // Pass user preferences (must-visit) to composition
    const journeyComposition = await this._composeJourney(candidates, context, mustVisitPlaceIds);

    // BACKWARD COMPATIBILITY: Also generate Top-3 for legacy clients
    const topPlaces = journeyComposition.selectedPlaces.slice(0, 3).map((p) => ({
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
      // BACKWARD COMPATIBILITY: Old fields
      places: topPlaces,
      food: foodRec,
      cafes: cafes.length > 0 ? cafes : undefined,
      benefits: benefits.length > 0 ? benefits : undefined,
      total_required_time: topPlaces[0]?.total_required_time || 0,
      fallback_available: fallbackAvailable,
      fallback: fallbackRecommendation,
      message: "Recommendations based on your travel context",

      // NEW: Journey Composer V0 (integrated course with variable stops)
      course: journeyComposition.course,

      // User preferences applied to this course
      journey_preferences: {
        excluded_place_ids: excludePlaceIds,
        must_visit_place_ids: mustVisitPlaceIds,
        applied: excludePlaceIds.length > 0 || mustVisitPlaceIds.length > 0
      }
    };
  }

  /**
   * Journey Composer V0
   * Constructs variable-stop courses based on available time
   * - 반나절 (180 min): 2-3 stops + 1 meal + 1 cafe
   * - 하루 (480 min): 4-5 stops + 2 meals + 1-2 cafes
   * - 직접선택: Scaled by time_available_minutes
   *
   * Respects user preferences:
   * - Excludes explicitly rejected places
   * - Anchors must-visit places in composition
   *
   * Returns blocks WITHOUT exact times (no false precision)
   * Uses duration ranges + stay_minutes for planning
   * @private
   */
  async _composeJourney(candidates, context, mustVisitPlaceIds = []) {
    const timeMinutes = context.time_available_minutes;

    // Determine time slot and target stop count
    const timeSlot = this._detectTimeSlot(timeMinutes);
    const targetStops = this._getTargetStopCount(timeSlot, timeMinutes);

    // Select places that fit available time (greedy: fit as many as possible)
    // Must-visit places are anchored in composition
    const selectedPlaces = this._selectPlacesByTime(candidates, targetStops, timeMinutes, mustVisitPlaceIds);

    // Fetch meal recommendations for journey
    const mealOptions = await this._getFoodRecommendation(context);
    const cafeOptions = await this._getCafePartners(context.country_code, context.city_code);

    // Fetch benefits for cafe display
    const benefitsData = await this._getBenefitsForCafes(context.country_code, context.city_code);

    // Compose journey blocks (with cafe benefits)
    const blocks = this._buildJourneyBlocks(selectedPlaces, mealOptions, cafeOptions, benefitsData, context);

    // Calculate total time and fit assessment
    const totalStayMinutes = selectedPlaces.reduce((sum, p) => sum + p.avg_stay_minutes, 0);
    const mealTimeMinutes = selectedPlaces.length > 0 ? 60 : 0; // 1 meal if any places
    const cafeTimeMinutes = selectedPlaces.length > 2 ? 30 : 0; // 1 cafe if 3+ places

    // P0-2 FIX: Fit status must reflect unknown travel time
    // Cannot claim "fits_comfortably" when travel duration is unverified
    const travelTransitionCount = blocks.filter(b => b.type === 'travel_transition').length;
    const travelUnknown = travelTransitionCount > 0;
    const fitStatus = travelUnknown ? 'travel_time_unverified' : 'fits_comfortably';

    return {
      selectedPlaces,
      course: {
        type: 'course',
        version: 'v0',
        time_slot: timeSlot,
        available_minutes: timeMinutes,
        target_stop_count: targetStops,
        actual_stop_count: selectedPlaces.length,
        blocks: blocks,
        summary: {
          total_known_activity_minutes: totalStayMinutes + mealTimeMinutes + cafeTimeMinutes,  // P0-2: clarify what's known
          total_stay_minutes: totalStayMinutes,
          estimated_meal_time: selectedPlaces.length > 0 ? 60 : 0,
          estimated_cafe_time: selectedPlaces.length > 2 ? 30 : 0,
          unknown_travel_segments: travelTransitionCount,  // P0-2: explicit unknown count
          estimated_total_range: travelUnknown ? null : {  // P0-2: null when unknown
            min: totalStayMinutes + (selectedPlaces.length > 0 ? 60 : 0),
            max: totalStayMinutes + (selectedPlaces.length > 0 ? 60 : 0) + (selectedPlaces.length > 2 ? 30 : 0)
          },
          fit_status: fitStatus  // P0-2: 'travel_time_unverified' when unknown
        },
        message_ko: travelUnknown
          ? '관광·식사·휴식 기준으로 구성했어요. 장소 간 이동시간은 현재 확인 중입니다.'
          : '시간 범위 내에서 편안하게 둘러볼 수 있어요.'
      }
    };
  }

  /**
   * Detect time slot from available minutes
   * 반나절: 150-240 min → 180 min target
   * 하루: 360-540 min → 480 min target
   * 직접선택: other values
   * @private
   */
  _detectTimeSlot(timeMinutes) {
    if (timeMinutes >= 150 && timeMinutes <= 240) {
      return 'half_day';
    } else if (timeMinutes >= 360 && timeMinutes <= 540) {
      return 'full_day';
    } else {
      return 'custom';
    }
  }

  /**
   * Get target stop count based on time slot
   * 반나절 (180 min): 2-3 stops
   * 하루 (480 min): 4-5 stops
   * 직접선택: Scale by minutes (1 stop per ~120 minutes)
   * @private
   */
  _getTargetStopCount(timeSlot, timeMinutes) {
    if (timeSlot === 'half_day') {
      return 3; // 3 stops for 반나절 (was always 3 anyway)
    } else if (timeSlot === 'full_day') {
      return 5; // 5 stops for 하루 (more than current Top-3)
    } else {
      // 직접선택: Scale (60 min = 1 stop, 180 min = 2-3, 480 min = 4-5)
      return Math.max(2, Math.min(5, Math.ceil(timeMinutes / 120)));
    }
  }

  /**
   * Select places that fit available time (greedy selection)
   * Respects ranking but also respects time constraint
   *
   * TIME BUDGET CALCULATION:
   * - Reserve 60 min for 1 meal (if places exist)
   * - Reserve 30 min for 1 cafe (if 2+ places)
   * - Use remaining time for places (no exact travel time, just stay time)
   *
   * @private
   */
  _selectPlacesByTime(candidates, targetCount, timeMinutes, mustVisitPlaceIds = []) {
    const selected = [];

    // Calculate time reserves
    const mealReserveMinutes = 60;    // 1 meal for typical half/full day
    const cafeReserveMinutes = 30;    // 1 cafe for multi-place courses
    const availableForPlaces = timeMinutes - mealReserveMinutes - cafeReserveMinutes;

    let placesTimeUsed = 0;

    // Step 1: Include must-visit places first (they anchor the journey)
    for (const placeCode of mustVisitPlaceIds) {
      const mustVisitPlace = candidates.find(c => c.code === placeCode);
      if (!mustVisitPlace) continue; // Must-visit place not in candidates (excluded by safety/accessibility)

      const timeNeeded = mustVisitPlace.avg_stay_minutes;
      if (placesTimeUsed + timeNeeded <= availableForPlaces) {
        selected.push(mustVisitPlace);
        placesTimeUsed += timeNeeded;
      }
    }

    // Step 2: Fill remaining slots with top-ranked candidates (excluding must-visit already selected)
    const selectedCodes = new Set(selected.map(p => p.code));
    for (const place of candidates) {
      if (selected.length >= targetCount) break;
      if (selectedCodes.has(place.code)) continue; // Already selected

      const timeNeeded = place.avg_stay_minutes;

      // Check if this place fits in remaining time budget
      if (placesTimeUsed + timeNeeded <= availableForPlaces) {
        selected.push(place);
        selectedCodes.add(place.code);
        placesTimeUsed += timeNeeded;
      }
    }

    return selected;
  }

  /**
   * Build journey blocks integrating places, meals, cafes
   * Sequence: Place → [Travel time indicator] → Place → ... → Meal → [Cafe]
   * P0 FIX: No numeric estimates when travel_time_status='unknown'
   * P0: Cafe blocks include partner benefits (display_copy)
   * @private
   */
  _buildJourneyBlocks(places, mealOptions, cafeOptions, benefitsData, context) {
    const blocks = [];
    let sequence = 1;

    // Add place blocks with travel time indicators
    places.forEach((place, index) => {
      // Add the place
      blocks.push({
        sequence: sequence++,
        type: 'place',
        place_code: place.code,
        name_ko: place.name_ko,
        stay_minutes: place.avg_stay_minutes,
        warnings: place._warnings || [],
        reason: this._generateReason(place, context),
        accessibility: {
          wheelchair_status: place.accessibility_wheelchair_status || 'unknown',
          stroller_status: place.accessibility_stroller_status || 'unknown',
          bus_accessible_status: place.bus_accessible_status || 'unknown',
        }
      });

      // Add travel time indicator (if not last place)
      // P0-1 FIX: Only show duration_range when travel time is verified
      if (index < places.length - 1) {
        blocks.push({
          sequence: sequence++,
          type: 'travel_transition',
          estimated_duration_range: null,  // P0-1: null when status='unknown'
          status: 'unknown', // V0: No verified travel time data
          message_ko: '이동시간 확인 중', // P0-1: User-facing message
          note: 'Travel time will be calculated when route data becomes available'
        });
      }
    });

    // Add meal block if places exist and meal context provided
    if (places.length > 0 && context.meal_context && context.meal_context !== 'none') {
      const meals = mealOptions?.restaurants || [];
      if (meals.length > 0) {
        blocks.push({
          sequence: sequence++,
          type: 'meal',
          meal_context: context.meal_context,
          restaurants: meals.slice(0, 2).map(r => ({
            restaurant_code: r.restaurant_code,
            name: r.name,
            cuisine_type: r.cuisine_type,
            accessibility: r.accessibility
          })),
          estimated_duration_minutes: 60,
          note: 'Typical meal duration; adjust based on restaurant service'
        });
      }
    }

    // Add cafe block if multiple places (2+ stops)
    if (places.length >= 2 && cafeOptions.length > 0) {
      blocks.push({
        sequence: sequence++,
        type: 'cafe',
        cafes: cafeOptions.slice(0, 2).map(c => {
          // Look up benefit for this cafe
          const cafeBenefit = benefitsData ? benefitsData.find(b => b.partner_id === c.id && b.is_active) : null;
          return {
            cafe_id: c.id,
            name: c.name,
            category: c.category,
            address: c.address,
            // P0: Include benefit if available
            benefit: cafeBenefit ? {
              title: cafeBenefit.title,
              display_copy: cafeBenefit.display_copy
            } : null
          };
        }),
        estimated_duration_minutes: 30,
        note: 'Brief cafe break between places'
      });
    }

    return blocks;
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
   * Note: Wheelchair/stroller accessibility handled by _passesAccessibility()
   * Uses canonical suitable_for vocabulary (Phase 1B normalized)
   * @private
   */
  _passesCompanion(place, context) {
    const { people_type, companion_constraints } = context;

    const suitableFor = place.suitable_for || [];

    if (people_type === "family_with_kids" && companion_constraints?.has_kids) {
      return suitableFor.includes("kids_ok");
    }
    if (people_type === "family_elderly" && companion_constraints?.has_elderly) {
      // Note: DB uses "elderly" not "elderly_ok" (vocabulary alignment fix)
      return suitableFor.includes("elderly");
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
    return "현재 여행 조건에 맞는 장소예요";
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
   * Helper: Get cafe-specific benefits for CourseDisplay
   * P0: Returns benefits for cafe partners only with display_copy
   * @private
   */
  async _getBenefitsForCafes(countryCode, cityCode) {
    const query = `
      SELECT b.partner_id, b.title, b.display_copy, b.is_active
      FROM dt_benefits b
      JOIN dt_partners p ON b.partner_id = p.id
      WHERE LOWER(p.city_code) = LOWER($1)
      AND p.category IN ('cafe', 'beverage', 'coffee')
      AND b.is_active = true
      ORDER BY p.name, b.created_at DESC
    `;

    try {
      const result = await db.query(query, [cityCode]);
      return result.rows || [];
    } catch (error) {
      console.error("Failed to fetch cafe benefits:", error);
      return [];
    }
  }

  /**
   * Helper: Get benefits for city partners (optional field)
   * Day-1 MVP: Only expose contractually confirmed benefits
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

      // Filter out unconfirmed benefits (Day-1 MVP business rules)
      const confirmedBenefits = (result.rows || []).filter(benefit => {
        // Exclude: Moipin free Americano (not contracted for DreamTown)
        if (benefit.partner_name === '모이핀' && benefit.benefit_type === 'free') {
          return false;
        }
        return true;
      });

      return confirmedBenefits;
    } catch (error) {
      console.error("Failed to fetch benefits:", error);
      return [];
    }
  }

  /**
   * Helper: Get normalized tags for traveler type
   * Evidence-based only (no demographic assumptions)
   * @private
   */
  _getNormalizedTravelerTags(people_type) {
    const mapping = {
      family_with_kids: ['family', 'kids_ok'],
      couple: ['couples'],
      solo: [], // No explicit tags in current DB
      family_elderly: ['elderly']
      // Other types: no mapping (no score boost)
    };
    return mapping[people_type] || [];
  }

  /**
   * Helper: Calculate traveler fit score
   * Based on suitable_for tags, not demographic assumptions
   * Score = 10 points per tag match
   * @private
   */
  _calculateTravelerFitScore(place, context) {
    if (!context.people_type) return 0; // No personalization without people_type

    const suitableFor = place.suitable_for || [];
    const expectedTags = this._getNormalizedTravelerTags(context.people_type);

    // Count how many expected tags match
    const matchCount = expectedTags.filter(tag => suitableFor.includes(tag)).length;

    return matchCount > 0 ? matchCount * 10 : 0;
  }

  /**
   * Helper: Get cluster membership for a place code
   * Returns cluster name or null if no cluster
   * @private
   */
  _getCluster(placeCode) {
    for (const [clusterName, members] of Object.entries(EXPERIENCE_CLUSTERS)) {
      if (members.includes(placeCode)) {
        return clusterName;
      }
    }
    return null;
  }

  /**
   * Helper: Apply experience cluster diversity to recommendations
   * Prevents same geographic area from monopolizing multiple top-3 slots
   * Rule: Max 1 candidate per cluster in top-3 (unless unavoidable due to limited inventory)
   * @private
   */
  _applyClusterDiversity(candidates) {
    const selected = [];
    const seenClusters = new Set();

    // First pass: select best from each cluster
    for (const candidate of candidates) {
      const cluster = this._getCluster(candidate.code);

      if (cluster === null) {
        // No cluster, always eligible
        selected.push(candidate);
      } else if (!seenClusters.has(cluster)) {
        // Cluster not yet seen, add first occurrence
        selected.push(candidate);
        seenClusters.add(cluster);
      }
      // else: cluster already represented, skip

      if (selected.length === 3) {
        break;
      }
    }

    // Fallback: if diversity reduced results below 3, fill remaining slots
    if (selected.length < 3 && candidates.length > selected.length) {
      for (const candidate of candidates) {
        if (selected.includes(candidate)) continue;
        selected.push(candidate);
        if (selected.length === 3) break;
      }
      // Mark that diversity constraint was relaxed due to limited inventory
      selected._cluster_diversity_relaxed = true;
    }

    return selected;
  }
}

module.exports = new TravelGuideService();
