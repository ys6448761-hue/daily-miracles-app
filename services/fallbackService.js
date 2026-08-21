/**
 * Fallback Service
 * Dynamic re-filtering by failure reason + re-scoring
 * NOT hardcoded alternatives (A→B)
 */

const db = require('../database/db');

class FallbackService {
  /**
   * Get fallback recommendation when primary place is unavailable
   * @param {Place} primaryPlace
   * @param {TravelGuideContext} context
   * @param {string} failureReason - Why primary was unavailable
   * @returns {Promise<PlaceRecommendation | null>}
   */
  async getFallback(primaryPlace, context, failureReason) {
    // Fetch all eligible candidates (same as recommendation engine)
    const candidates = await this._getAllCandidates(context);

    if (!candidates || candidates.length === 0) {
      return null;
    }

    // Filter by failure reason
    let filtered = this._filterByFailureReason(candidates, failureReason, context);

    if (filtered.length === 0) {
      // No fallback matches this specific failure reason
      // Return null (no fallback available)
      return null;
    }

    // Re-score by reality conditions (not emotion)
    // Priority: Time → Transport → Accessibility → Companion → Weather
    filtered = this._rescore(filtered, context, primaryPlace);

    // Select top fallback
    const fallback = filtered[0];
    if (!fallback) return null;

    return {
      place_code: fallback.code,
      name_ko: fallback.name_ko,
      type: "fallback",
      stay_minutes: fallback.avg_stay_minutes,
      travel_time_minutes:
        fallback.travel_time === Infinity ? "unknown" : fallback.travel_time,
      total_required_time: fallback.total_required_time,
      reason: `Alternative due to: ${failureReason}`,
      safety_pass: true,
      live_status: fallback.live_status || "unknown",
      accessibility: {
        wheelchair: fallback.accessibility_wheelchair || false,
        stroller: fallback.accessibility_stroller || false,
        bus_accessible: (fallback.access_by_bus || []).length > 0,
        car_accessible: fallback.access_by_car !== false,
      },
    };
  }

  /**
   * Filter candidates by failure reason
   * @private
   */
  _filterByFailureReason(candidates, reason, context) {
    // Normalize reason
    const reasonLower = (reason || "").toLowerCase();

    // Determine which candidates are eligible based on failure type
    let filtered = candidates;

    if (reasonLower.includes("closed") || reasonLower.includes("unavailable")) {
      // Place is closed: only include places with live_status != "closed"
      filtered = filtered.filter(
        (p) => p.live_status !== "closed" && p.live_status !== "closed_permanently"
      );
    }

    if (reasonLower.includes("weather") || reasonLower.includes("rain")) {
      // Weather issue: prefer indoor places
      filtered = filtered.filter(
        (p) =>
          p.indoor_outdoor === "indoor" ||
          p.indoor_outdoor === "mixed" ||
          (p.weather_suitable || []).includes("rainy")
      );
    }

    if (reasonLower.includes("time") || reasonLower.includes("insufficient")) {
      // Time issue: only include places with shorter stay times
      const avgTime =
        candidates.reduce((sum, p) => sum + (p.avg_stay_minutes || 0), 0) /
        candidates.length;
      filtered = filtered.filter((p) => (p.avg_stay_minutes || 0) <= avgTime * 0.7);
    }

    if (reasonLower.includes("transport") || reasonLower.includes("accessibility")) {
      // Transport issue: re-verify transport matches
      filtered = filtered.filter((p) => {
        if (context.has_car) {
          return p.access_by_car !== false;
        } else {
          return p.access_by_bus && p.access_by_bus.length > 0;
        }
      });
    }

    if (reasonLower.includes("elderly") || reasonLower.includes("disability")) {
      // Accessibility issue: re-verify accessibility
      filtered = filtered.filter((p) => {
        if (context.companion_constraints?.disability === "wheelchair") {
          return p.accessibility_wheelchair === true;
        }
        if (context.companion_constraints?.has_elderly) {
          return (
            p.physical_difficulty === "easy" ||
            p.physical_difficulty === "moderate"
          );
        }
        return true;
      });
    }

    // If no specific match, return all remaining candidates
    return filtered.length > 0 ? filtered : candidates;
  }

  /**
   * Re-score fallback candidates (reality first, no emotion)
   * Priority: Time → Transport → Accessibility → Companion → Weather
   * @private
   */
  _rescore(candidates, context, primaryPlace) {
    // Score each candidate
    const scored = candidates.map((candidate) => {
      let score = 0;

      // 1. Time: Prefer similar or shorter stay
      const timeDiff = Math.abs(
        candidate.avg_stay_minutes - primaryPlace.avg_stay_minutes
      );
      score += Math.max(0, 100 - timeDiff);

      // 2. Transport: Prefer matching transport
      if (context.has_car && candidate.access_by_car !== false) {
        score += 50;
      } else if (
        !context.has_car &&
        candidate.access_by_bus &&
        candidate.access_by_bus.length > 0
      ) {
        score += 50;
      }

      // 3. Accessibility: Exact match
      if (context.companion_constraints?.disability === "wheelchair") {
        if (candidate.accessibility_wheelchair === true) score += 40;
      } else if (context.companion_constraints?.has_elderly) {
        if (
          candidate.physical_difficulty === "easy" ||
          candidate.physical_difficulty === "moderate"
        ) {
          score += 40;
        }
      } else {
        score += 20; // Default accessibility credit
      }

      // 4. Companion: Match people type
      const suitableFor = candidate.suitable_for || [];
      if (context.people_type === "family_with_kids") {
        if (suitableFor.includes("kids_ok")) score += 30;
      } else if (context.people_type === "family_elderly") {
        if (suitableFor.includes("elderly_ok")) score += 30;
      } else {
        score += 15; // Default companion credit
      }

      // 5. Weather: Not rainy preference
      if (context.weather?.condition === "rainy") {
        if (
          candidate.indoor_outdoor === "indoor" ||
          candidate.indoor_outdoor === "mixed"
        ) {
          score += 25;
        }
      } else {
        score += 10; // Default weather credit
      }

      // Penalize if identical to primary (no repetition)
      if (candidate.code === primaryPlace.code) {
        score = 0;
      }

      return { ...candidate, fallback_score: score };
    });

    // Sort by score, highest first
    return scored.sort((a, b) => b.fallback_score - a.fallback_score);
  }

  /**
   * Fetch all candidates (same as recommendation engine)
   * @private
   */
  async _getAllCandidates(context) {
    const query = `
      SELECT * FROM travel_places
      WHERE country_code = $1 AND city_code = $2
      ORDER BY code
    `;

    try {
      const result = await db.query(query, [
        context.country_code,
        context.city_code,
      ]);
      return result.rows || [];
    } catch (error) {
      console.error("Failed to fetch fallback candidates:", error);
      return [];
    }
  }
}

module.exports = new FallbackService();
