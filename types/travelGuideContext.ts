/**
 * Travel Guide Context Type Definitions
 * Privacy-first: wish_text removed, wish_id preserved
 * Session validation fields included
 */

export interface TravelGuideContext {
  // === Session Identity (Anonymous) ===
  session_id: string; // UUID v4
  created_at: string; // ISO 8601
  last_activity_at: string; // ISO 8601
  is_valid: boolean; // Computed: NOW() < expires_at

  // === Geography ===
  country_code: string; // "KR"
  city_code: string; // "YEOSU"
  entry_point: string; // "RAMADA_YEOSU"

  // === User Mode ===
  user_mode: "PUBLIC" | "WISH_TRAVELER"; // Entry differentiation
  wish_id?: string; // Preserved for WISH_TRAVELER (no wish_text)

  // === Companion Context ===
  people_type: "solo" | "couple" | "family_with_kids" | "family_elderly" | "group";
  companion_constraints?: {
    has_kids: boolean;
    kids_age?: number;
    has_elderly: boolean;
    disability?: string; // "wheelchair", "visual", "hearing", null
  };

  // === Time Context ===
  time_available_minutes: number; // Total time available
  meal_context?: "breakfast" | "lunch" | "dinner" | "snack" | "none";

  // === Mobility ===
  has_car: boolean;
  mobility_type: "walk" | "bus" | "car" | "mixed";

  // === Weather ===
  weather?: {
    condition: "clear" | "cloudy" | "rainy" | "snowy";
    temperature_celsius: number;
    updated_at: string;
  };

  // === Emotion (WISH_TRAVELER only) ===
  wish_context?: {
    // wish_text is NEVER stored, removed during ingestion
    emotion_primary?: string; // "healing", "joy", "inspiration", etc.
    emotion_tags?: string[]; // ["nature", "quiet", "social", ...]
    season_preferred?: string;
  };

  // === Origin (PHASE 1B) ===
  origin?: {
    type: "partner_entry" | "station_entry" | "previous_place" | "manual_location" | "unknown";
    place_code?: string; // If type=previous_place
    lat?: number; // If type=manual_location
    lng?: number; // If type=manual_location
    label: string; // Display label: "Ramada Plaza", "Previous location", etc.
    source?: string; // Evidence: "QR_verified", "GPS_confirmed", "previous_session", "inferred"
  };
}

export interface RecommendationRequest {
  context: TravelGuideContext;
}

export interface PlaceRecommendation {
  place_code: string;
  name_ko: string;
  type: "primary" | "secondary" | "fallback";
  stay_minutes: number;
  travel_time_minutes: number | null;
  travel_time_status: "verified" | "unknown"; // PHASE 1B
  total_required_time: number | null; // null if travel_time unknown (PHASE 1B)
  total_required_time_status: "verified" | "unknown"; // NEW: explicit status
  reason: string; // Why this place
  safety_pass: boolean;
  live_status: "unknown" | "open" | "closed" | "partial";
  accessibility: {
    // NEW (PHASE 1A): Status fields
    wheelchair_status: "unknown" | "verified_yes" | "verified_no";
    stroller_status: "unknown" | "verified_yes" | "verified_no";
    bus_accessible_status: "unknown" | "verified_yes" | "verified_no";
    // DEPRECATED (backward compat, Phase 2 removal)
    wheelchair: boolean;
    stroller: boolean;
    bus_accessible: boolean;
    car_accessible: boolean;
  };
  warnings: string[]; // PHASE 1A: ["wheelchair_accessibility_unverified", "total_required_time_unverified", ...]
}

export interface RestaurantRecommendation {
  restaurant_code?: string;
  name?: string;
  type: "primary" | "secondary" | "none";
  meal_context: string;
  accessibility: {
    kids_ok: boolean;
    elderly_ok: boolean;
  };
  data_status: "verified" | "unavailable"; // "unavailable" if no Curated seeds
  message?: string;
}

export interface RecommendationResponse {
  session_id: string;
  entry_point: string;
  user_mode: string;
  places: PlaceRecommendation[];
  food: RestaurantRecommendation;
  total_required_time: number;
  fallback_available: boolean;
  message: string;
}

export interface EventPayload {
  session_id: string;
  entry_point: string;
  user_mode: string;
  event_type: "RECOMMEND_REQUESTED" | "PLACE_CLICKED" | "FALLBACK_OFFERED" | "RESERVATION_STARTED";
  event_data: {
    // Stored safely
    place_code?: string;
    experience_type?: string;
    // NOT stored: wish_text, user_id, exact_location, room_number
  };
}
