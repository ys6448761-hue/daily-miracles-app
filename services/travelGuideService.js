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

// Verified CAR travel time edges (Founder NAVER_MEASURED)
// Source: YEOSU_FOUNDER_ROUTE_001_TIME_EVIDENCE.md §[UPDATE 2026-10-24] F-1~F-4
//         DREAMTOWN-TIME-BUDGET-V0_1-CANDIDATE.md §P1~P4 (2026-10-25)
// Buffer policy: CAR ≤10min → +5min / CAR ≥11min → +10min
// Key format: 'from_code→to_code' (단방향, 역방향 자동 생성 없음)
const VERIFIED_TRAVEL_EDGES = {
  // P1~P4: Production 8h Course (Founder NAVER_MEASURED 2026-10-25)
  'cablecar→hamel_lighthouse':            { car: 2,  buf: 5,  op: 7,  km: 1.6,   poi: '자산탑승장→하멜전시관주차장' },
  'hamel_lighthouse→hyangiram':           { car: 35, buf: 10, op: 45, km: 27,    poi: '하멜전시관주차장→향일암공영주차장' },
  'hyangiram→jaisan_park':                { car: 35, buf: 10, op: 45, km: 26,    poi: '향일암공영주차장→자산공원주차장' },
  'jaisan_park→lee_soon_shin_plaza':      { car: 4,  buf: 5,  op: 9,  km: 1.6,   poi: '자산공원주차장→이순신광장' },
  // F-1~F-4: Founder NAVER_MEASURED 2026-10-24
  'lee_soon_shin_plaza→hamel_lighthouse': { car: 5,  buf: 5,  op: 10, km: 1.5,   poi: '이순신광장→하멜전시관주차장' },
  'hamel_lighthouse→lee_soon_shin_plaza': { car: 4,  buf: 5,  op: 9,  km: 1.6,   poi: '하멜전시관주차장→이순신광장' },
  'lee_soon_shin_plaza→marine_park':      { car: 2,  buf: 5,  op: 7,  km: 0.658, poi: '이순신광장→해양공원' },
  'marine_park→hamel_lighthouse':         { car: 3,  buf: 5,  op: 8,  km: 0.866, poi: '해양공원→하멜전시관주차장' },
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

    // Founder decision 2026-10-15: 중앙시장 현장 콘텐츠 부족 — TG 추천 전면 제외 (DB 보존)
    places = places.filter(p => p.code !== 'jungang_market');

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

    // G2: Low-walking constraint
    // RULE 1: physical_difficulty='high' → exclude (verified unsuitable for low-walking requests)
    // RULE 2: physical_difficulty=null → UNKNOWN, warn but do not exclude (fail-safe)
    if (context.mobility_constraint === 'low_walking') {
      candidates = candidates.filter(p => p.physical_difficulty !== 'high');
      candidates = candidates.map(p => {
        if (!p.physical_difficulty) {
          if (!p._warnings) p._warnings = [];
          if (!p._warnings.includes('walking_burden_unknown')) {
            p._warnings.push('walking_burden_unknown');
          }
        }
        return p;
      });
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
    // Compute targetCount preview before diversity filter so full_day (8h→5 stops) is respected.
    const _previewTimeSlot = this._detectTimeSlot(context.time_available_minutes);
    const _previewIsFallback = context._domainFallbacks?.includes('time_available_minutes');
    const _previewRawTarget = this._getTargetStopCount(_previewTimeSlot, context.time_available_minutes);
    const _diversityMax = _previewIsFallback ? Math.max(_previewRawTarget, 3) : _previewRawTarget;
    candidates = this._applyClusterDiversity(candidates, _diversityMax);

    // Must-visit anchor recovery: the traveler is already at the must-visit place,
    // so transport filters are irrelevant for that specific place.
    // If a must-visit place was filtered out, re-inject it from the full places pool.
    if (mustVisitPlaceIds.length > 0) {
      const candidateCodes = new Set(candidates.map(c => c.code));
      for (const placeCode of mustVisitPlaceIds) {
        if (!candidateCodes.has(placeCode)) {
          const reinjected = places.find(p => p.code === placeCode);
          if (reinjected) {
            if (!reinjected._warnings) reinjected._warnings = [];
            reinjected._warnings.push('transport_override_already_there');
            candidates.unshift(reinjected);
            candidateCodes.add(placeCode);
          }
        }
      }
    }

    // JOURNEY COMPOSITION V0: Variable stop count based on available time
    // Pass user preferences (must-visit) to composition
    const journeyComposition = await this._composeJourney(candidates, context, mustVisitPlaceIds);

    // BACKWARD COMPATIBILITY: Also generate Top-3 for legacy clients
    const topPlaces = journeyComposition.selectedPlaces.slice(0, 3).map((p) => ({
      place_code: p.code,
      name_ko: p.name_ko,
      type: "primary",
      stay_minutes: p.avg_stay_minutes,
      avg_stay_minutes: p.avg_stay_minutes,
      travel_time_minutes: p.travel_time_minutes,
      travel_time_status: p.travel_time_status,
      total_required_time: p.total_required_time,
      total_required_time_status: p.total_required_time_status || 'unknown',
      reason: this._generateReason(p, context),
      safety_pass: true,
      live_status: p.live_status,
      live_status_required: p.live_status_required || false,
      suitable_for: p.suitable_for || [],
      emotion_tags: p.emotion_tags || [],
      indoor_outdoor: p.indoor_outdoor || null,
      physical_difficulty: p.physical_difficulty || null,
      admission_fee_json: p.admission_fee_json || null,
      operating_hours: p.opening_hours_json ? JSON.stringify(p.opening_hours_json) : null,
      parking_info: p.parking_info || null,
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
      mobility_constraint_applied: !!(p._warnings && p._warnings.includes('walking_burden_unknown')),
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
    // When time_available_minutes is a fallback (user didn't specify), use 3 stops as default
    // so category chip recommendations show a meaningful selection rather than 2 places
    const _timeIsFallback = context._domainFallbacks?.includes('time_available_minutes');
    // G1: respect explicit requested_count — capped at 5 and floored at 1
    const rawTarget = this._getTargetStopCount(timeSlot, timeMinutes);
    const defaultTarget = _timeIsFallback ? Math.max(rawTarget, 3) : rawTarget;
    const targetStops = context.requested_count
      ? Math.max(1, Math.min(5, context.requested_count))
      : defaultTarget;

    // Select places that fit available time (greedy: fit as many as possible)
    // Must-visit places are anchored in composition
    const selectedPlaces = this._selectPlacesByTime(candidates, targetStops, timeMinutes, mustVisitPlaceIds, context);

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
    // Cannot claim "fits_comfortably" when any transition is unverified
    const travelTransitionBlocks = blocks.filter(b => b.type === 'travel_transition');
    const travelUnknown = travelTransitionBlocks.some(b => b.status !== 'verified');
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
   * - Reserve 60 min for 1 meal only when meal_context is requested
   * - Reserve 30 min for 1 cafe only for half/full day (>= 180 min) with meal
   * - Use remaining time for places (no exact travel time, just stay time)
   *
   * @private
   */
  _selectPlacesByTime(candidates, targetCount, timeMinutes, mustVisitPlaceIds = [], context = {}) {
    const selected = [];

    // Only reserve meal time when meal is actually requested
    const hasMeal = context.meal_context && context.meal_context !== 'none';
    const mealReserveMinutes = hasMeal ? 60 : 0;
    // Cafe reserve only when there's a meal and enough time for a full-day outing
    const cafeReserveMinutes = (hasMeal && timeMinutes >= 180) ? 30 : 0;
    const availableForPlaces = timeMinutes - mealReserveMinutes - cafeReserveMinutes;

    let placesTimeUsed = 0;

    // Step 1: Include must-visit places first (they anchor the journey)
    // P-NEW-1: When time_available_minutes is a fallback (user didn't specify), bypass the
    // time budget check for must-visit places — user-requested places must not be silently dropped.
    const _tmFallback = context._domainFallbacks?.includes('time_available_minutes');
    for (const placeCode of mustVisitPlaceIds) {
      const mustVisitPlace = candidates.find(c => c.code === placeCode);
      if (!mustVisitPlace) continue; // Must-visit place not in candidates (excluded by safety/accessibility)

      const timeNeeded = mustVisitPlace.avg_stay_minutes;
      if (_tmFallback || placesTimeUsed + timeNeeded <= availableForPlaces) {
        selected.push(mustVisitPlace);
        placesTimeUsed += timeNeeded || 0;
      }
    }

    // Step 2: Fill remaining slots with top-ranked candidates (excluding must-visit already selected)
    const selectedCodes = new Set(selected.map(p => p.code));
    for (const place of candidates) {
      if (selected.length >= targetCount) break;
      if (selectedCodes.has(place.code)) continue; // Already selected

      const timeNeeded = place.avg_stay_minutes;

      // When time is fallback (user didn't specify), skip the budget check so category
      // chip recommendations aren't cut off by an arbitrary 120-minute default.
      if (_tmFallback || placesTimeUsed + timeNeeded <= availableForPlaces) {
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
      // Travel Time UI V0.1: look up VERIFIED_TRAVEL_EDGES; fall back to unknown
      if (index < places.length - 1) {
        const nextPlace = places[index + 1];
        const edgeKey = `${place.code}→${nextPlace.code}`;
        const edge = VERIFIED_TRAVEL_EDGES[edgeKey];
        if (edge) {
          blocks.push({
            sequence: sequence++,
            type: 'travel_transition',
            estimated_duration_range: { min: edge.op, max: edge.op },
            status: 'verified',
            message_ko: `이동 약 ${edge.op}분`,
            note: `Source: VERIFIED_TRAVEL_EDGES / CAR ${edge.car}min + buf ${edge.buf}min / ${edge.poi}`
          });
        } else {
          blocks.push({
            sequence: sequence++,
            type: 'travel_transition',
            estimated_duration_range: null,
            status: 'unknown',
            message_ko: '이동시간 확인 중',
            note: 'Travel time will be calculated when route data becomes available'
          });
        }
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
      // Explicit auto-recommendation policy: pojangmacha excluded (venue characteristic, not a safety inference)
      if (place.code === 'romantic_pojangmacha') return false;
      // suitable_for tag absence = data gap, not a finding of unsuitability
      // Physical safety is handled by _passesAccessibility + G2
      if (!suitableFor.includes('elderly')) {
        if (!place._warnings) place._warnings = [];
        if (!place._warnings.includes('elderly_fit_unverified')) {
          place._warnings.push('elderly_fit_unverified');
        }
        return true;
      }
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
   * Derives meaningful reason from actual place data + context — never a generic fallback.
   * @private
   */
  _generateReason(place, context) {
    const parts = [];
    const suitable = place.suitable_for || [];
    const emotions = place.emotion_tags || [];
    const pt = context.people_type;
    const timeMin = context.time_available_minutes;
    const pref = context.preference_type;
    const budget = context.budget_constraint;
    const timeOfDay = context.time_of_day;

    // Budget signal — only claim free when fee data is verified present and zero
    // admission_fee_json === null means NO DATA, NOT free
    if (budget === 'free' || budget === 'low') {
      if (place.admission_fee_json && place.admission_fee_json.adult === 0) {
        parts.push('무료 입장');
      }
      // Null fee data → honest note rather than silence
      else if (!place.admission_fee_json) {
        parts.push('입장료는 방문 전 확인해 보세요');
      }
    }

    // Companion fit — walking burden unknown: do NOT claim suitability, let stay-time speak
    const walkingUnknown = (place._warnings || []).includes('walking_burden_unknown');
    const elderlyFitUnverified = (place._warnings || []).includes('elderly_fit_unverified');
    if (pt === 'family_elderly' && suitable.includes('elderly')) {
      if (!walkingUnknown) {
        parts.push('어르신과 함께 방문하기 좋아요');
      }
      // walkingUnknown → no suitability claim; warning already in place._warnings
    } else if (pt === 'family_elderly' && elderlyFitUnverified) {
      // elderly_fit_unverified: tag not confirmed — suppress positive suitability claim
    } else if (pt === 'family_with_kids' && suitable.includes('kids_ok')) {
      parts.push('아이와 함께 즐기기 좋아요');
    } else if (pt === 'couple' && (suitable.includes('couples') || emotions.includes('date'))) {
      parts.push('둘이 함께 걷기 좋은 분위기예요');
    } else if (pt === 'group' && (suitable.includes('groups') || suitable.includes('friends'))) {
      parts.push('단체가 함께 즐기기 좋아요');
    }

    // Time fit — only emit when time is the user's primary query intent
    // Suppressed when intent is night/photo/budget (those have their own reason signals)
    // "부담 없이" removed: avg_stay_minutes is verified stay time, not walking burden.
    const timeIsMainIntent = !pref && !timeOfDay && !budget;
    if (timeIsMainIntent && timeMin && place.avg_stay_minutes) {
      parts.push(`${place.avg_stay_minutes}분 정도 둘러볼 수 있어요`);
    }

    // Photo preference — specific to photo intent only
    if (pref === 'photo') {
      if (emotions.includes('view') || emotions.includes('architecture')) {
        parts.push('사진 찍기 좋은 뷰가 있어요');
      } else if (emotions.includes('night_view')) {
        parts.push('야경 사진 명소예요');
      }
    }

    // Night — use night_view evidence, not young_adults (separate concern)
    if (timeOfDay === 'night' || timeOfDay === 'evening') {
      if (emotions.includes('night_view')) {
        parts.push('야경이 아름다운 곳이에요');
      } else if (emotions.includes('food') || emotions.includes('social')) {
        parts.push('저녁에 분위기가 살아나는 곳이에요');
      }
    }

    // Emotion tags as fallback
    if (parts.length === 0 && emotions.length > 0) {
      const TAG_KO = { view: '뷰가 좋아요', history: '역사적인 장소예요', nature: '자연 속에서 쉴 수 있어요', local_food: '현지 먹거리를 즐길 수 있어요', night_view: '야경이 아름다워요', social: '함께 즐기기 좋아요', culture: '문화 공간이에요', quiet: '조용하게 산책할 수 있어요', seasonal: '계절감을 느낄 수 있어요', adventure: '색다른 경험을 할 수 있어요' };
      const firstTag = TAG_KO[emotions[0]];
      if (firstTag) parts.push(firstTag);
    }

    return parts.length > 0 ? parts.join(' · ') : '지금 상황에 추천할 수 있는 곳이에요';
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
   * Intent dimensions: night/photo/budget/time-fit add evidence-based bonus
   * @private
   */
  _calculateTravelerFitScore(place, context) {
    if (!context.people_type) return 0;

    const suitableFor = place.suitable_for || [];
    const expectedTags = this._getNormalizedTravelerTags(context.people_type);
    const matchCount = expectedTags.filter(tag => suitableFor.includes(tag)).length;
    let score = matchCount > 0 ? matchCount * 10 : 0;

    const emotionTags    = place.emotion_tags    || [];
    const weatherSuitable = place.weather_suitable || [];

    // Night query → boost night-view/evening places with actual night evidence
    if (context.time_of_day === 'night') {
      if (emotionTags.includes('night_view'))                                score += 8;
      if (weatherSuitable.includes('night') || weatherSuitable.includes('evening')) score += 4;
    }

    // Photo preference → boost scenic/architectural places
    if (context.preference_type === 'photo') {
      if (emotionTags.includes('view'))         score += 8;
      if (emotionTags.includes('architecture')) score += 6;
      if (emotionTags.includes('night_view'))   score += 4;
    }

    // Budget constraint → boost confirmed zero-admission places (data-gated)
    if (context.budget_constraint === 'free' || context.budget_constraint === 'low') {
      const feeJson = place.admission_fee_json;
      if (feeJson && typeof feeJson.adult === 'number' && feeJson.adult === 0) score += 6;
    }

    // Time fitness — only when user explicitly stated available time
    const timeAvail     = context.time_available_minutes;
    const timeProvenance = context._provenance?.time_available_minutes;
    if (timeAvail && timeProvenance === 'USER_EXPLICIT') {
      const stayMin = place.avg_stay_minutes;
      if (stayMin && stayMin > timeAvail * 0.8)  score -= 4; // stay fills most of available time
      else if (stayMin && stayMin <= timeAvail * 0.5) score += 3; // comfortable fit with room to travel
    }

    return score;
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
   * Prevents same geographic area from monopolizing top candidate slots
   * Rule: Max 1 candidate per cluster (unless unavoidable due to limited inventory)
   * @param {Array} candidates - Score-sorted place array
   * @param {number} maxCount - Target candidate count (default 3; 5 for full_day/8h)
   * @private
   */
  _applyClusterDiversity(candidates, maxCount = 3) {
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

      if (selected.length >= maxCount) {
        break;
      }
    }

    // Fallback: if diversity reduced results below maxCount, fill remaining slots
    if (selected.length < maxCount && candidates.length > selected.length) {
      for (const candidate of candidates) {
        if (selected.includes(candidate)) continue;
        selected.push(candidate);
        if (selected.length >= maxCount) break;
      }
      // Mark that diversity constraint was relaxed due to limited inventory
      selected._cluster_diversity_relaxed = true;
    }

    return selected;
  }

  /**
   * Fetch a single place by code for PLACE_LOOKUP intent.
   * Returns null when code not found or DB unavailable.
   */
  async getPlaceByCode(code) {
    const query = 'SELECT * FROM travel_places WHERE code = $1 LIMIT 1';
    try {
      const result = await db.query(query, [code]);
      return result.rows[0] || null;
    } catch (err) {
      console.error('[TG_PLACE_LOOKUP_ERROR]', { code, message: err.message });
      return null;
    }
  }
}

module.exports = new TravelGuideService();
