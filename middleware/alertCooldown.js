// ═══════════════════════════════════════════════════════════
// Alert Cooldown Layer — P2.3 Ops Hardening (ISSUE 2)
// Prevents Slack alert fatigue during incident storms.
// ═══════════════════════════════════════════════════════════

// ── Cooldown intervals (ms) ──
const COOLDOWN_MS = {
  default: 5 * 60 * 1000,    // 5 min — same key
  critical: 2 * 60 * 1000,   // 2 min — score < 70
  degraded: 10 * 60 * 1000,  // 10 min — score 70-79
};

// ── 메모리 안전 상한 (인시던트 폭발 시 OOM 방지) ──
const MAX_COOLDOWN_ENTRIES = 10_000;

class AlertCooldown {
  constructor() {
    /** Map<string, { lastSentAt: number, suppressedCount: number }> */
    this._entries = new Map();

    /** 긴급 퍼지 마지막 실행 시각 (1s 버스트 가드) */
    this._lastEmergencyPurgeAt = 0;

    // Purge entries older than 1h every 10 minutes
    this._purgeTimer = setInterval(() => this._purge(), 10 * 60 * 1000);
    if (this._purgeTimer.unref) this._purgeTimer.unref();
  }

  /**
   * Build a cooldown key from alert context.
   * @param {{ errorClass?: string, route?: string, statusCode?: number }} ctx
   */
  static buildKey(ctx) {
    const parts = [
      ctx.errorClass || 'unknown',
      ctx.route || '*',
      ctx.statusCode || 500,
    ];
    return parts.join('|');
  }

  /**
   * Check if an alert should be sent or suppressed.
   * @param {string} key — from buildKey()
   * @param {'critical'|'degraded'|null} severity — maps to cooldown interval
   * @returns {{ allowed: boolean, cooldown_suppressed: boolean, suppressedCount: number }}
   */
  check(key, severity) {
    // 용량 초과 시 긴급 퍼지 (1s 버스트 가드 포함)
    if (this._entries.size >= MAX_COOLDOWN_ENTRIES) {
      this._emergencyPurge();
    }

    const now = Date.now();
    const entry = this._entries.get(key);

    // Pick cooldown interval
    let interval = COOLDOWN_MS.default;
    if (severity === 'critical') interval = COOLDOWN_MS.critical;
    else if (severity === 'degraded') interval = COOLDOWN_MS.degraded;

    if (!entry || (now - entry.lastSentAt) >= interval) {
      // Allow — reset or create entry
      this._entries.set(key, { lastSentAt: now, suppressedCount: 0 });
      return { allowed: true, cooldown_suppressed: false, suppressedCount: 0 };
    }

    // Suppress
    entry.suppressedCount++;
    return { allowed: false, cooldown_suppressed: true, suppressedCount: entry.suppressedCount };
  }

  /** Number of unique keys currently tracked */
  get size() {
    return this._entries.size;
  }

  /**
   * 긴급 퍼지: 가장 오래된 엔트리를 제거해 MAX의 75%로 축소.
   * 1s 버스트 가드: 동일 인시던트 폭발에서 반복 실행 방지.
   */
  _emergencyPurge() {
    const now = Date.now();
    if (now - this._lastEmergencyPurgeAt < 1000) return; // 1s 가드
    this._lastEmergencyPurgeAt = now;

    const target = Math.floor(MAX_COOLDOWN_ENTRIES * 0.75);
    if (this._entries.size <= target) return;

    const toRemove = this._entries.size - target;
    const sorted = [...this._entries.entries()].sort(
      ([, a], [, b]) => a.lastSentAt - b.lastSentAt
    );
    for (let i = 0; i < toRemove; i++) {
      this._entries.delete(sorted[i][0]);
    }
  }

  /** Purge entries older than 1 hour */
  _purge() {
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const [key, entry] of this._entries) {
      if (entry.lastSentAt < cutoff) this._entries.delete(key);
    }
  }

  /** Reset all entries (for testing) */
  reset() {
    this._entries.clear();
  }

  destroy() {
    if (this._purgeTimer) clearInterval(this._purgeTimer);
  }
}

// ── Singleton ──
const alertCooldown = new AlertCooldown();

module.exports = alertCooldown;
module.exports.AlertCooldown = AlertCooldown;
module.exports.COOLDOWN_MS = COOLDOWN_MS;
module.exports.MAX_COOLDOWN_ENTRIES = MAX_COOLDOWN_ENTRIES;
