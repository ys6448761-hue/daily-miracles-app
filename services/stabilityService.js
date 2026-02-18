// ═══════════════════════════════════════════════════════════
// Stability Score v1 — P2.3 Ops Hardening
// Rolling-window health scoring for /healthz endpoint
// + Proactive Alert monitor (ISSUE 3)
// ═══════════════════════════════════════════════════════════

const alertCooldown = require('../middleware/alertCooldown');

/**
 * RollingCounter — minute-bucket time-series counter (max 1440 buckets for 24h)
 */
class RollingCounter {
  constructor(windowMs = 24 * 60 * 60 * 1000, bucketMs = 60 * 1000) {
    this.windowMs = windowMs;
    this.bucketMs = bucketMs;
    this.buckets = new Map();
  }

  increment(amount = 1) {
    const key = Math.floor(Date.now() / this.bucketMs) * this.bucketMs;
    this.buckets.set(key, (this.buckets.get(key) || 0) + amount);
  }

  sum() {
    const cutoff = Date.now() - this.windowMs;
    let total = 0;
    for (const [ts, count] of this.buckets) {
      if (ts >= cutoff) total += count;
    }
    return total;
  }

  cleanup() {
    const cutoff = Date.now() - this.windowMs;
    for (const ts of this.buckets.keys()) {
      if (ts < cutoff) this.buckets.delete(ts);
    }
  }
}

// ── Score formula weights (from ISSUE spec) ──
const WEIGHTS = {
  restart: 5,        // per restart
  errorRate: 50,     // error_rate × 100 × 0.5
  memory: 0.3,       // per memory_usage_pct
  latency: 0.02,     // per p95_latency_ms
  fallback: 1,       // per fallback event
};

// ── Status thresholds ──
const THRESHOLDS = {
  healthy: 90,
  stable: 80,
  degraded: 70,
  // < 70 = critical
};

class StabilityService {
  constructor() {
    this.bootedAt = Date.now();

    // Rolling 24h counters (minute buckets)
    this._totalRequests = new RollingCounter();
    this._errorRequests = new RollingCounter();  // 5xx only
    this._fallbacks = new RollingCounter();

    // restart_count: in-memory only — resets to 0 each boot
    // TODO: P2.4 — persist via DB or Render API for cross-restart tracking
    this._restartCount = 0;

    // Cleanup stale buckets every 5 minutes
    this._cleanupTimer = setInterval(() => this._cleanup(), 5 * 60 * 1000);
    if (this._cleanupTimer.unref) this._cleanupTimer.unref();
  }

  // ── Express middleware (register early, before routes) ──
  middleware() {
    return (req, res, next) => {
      this._totalRequests.increment();

      // Monkey-patch res.end to capture status code
      const originalEnd = res.end;
      res.end = (...args) => {
        if (res.statusCode >= 500) {
          this._errorRequests.increment();
        }
        return originalEnd.apply(res, args);
      };
      next();
    };
  }

  /** Call from any service that falls back to a secondary path */
  recordFallback() {
    this._fallbacks.increment();
  }

  /** Manually record a restart (called if we detect it externally) */
  recordRestart() {
    this._restartCount++;
  }

  // ── Signal collection ──
  getSignals() {
    const mem = process.memoryUsage();
    const memoryPct = Math.round((mem.heapUsed / mem.heapTotal) * 100);

    const totalReqs = this._totalRequests.sum();
    const errorReqs = this._errorRequests.sum();
    const errorRate = totalReqs > 0
      ? Math.round((errorReqs / totalReqs) * 10000) / 10000
      : 0;

    return {
      restart_count: this._restartCount,
      error_rate: errorRate,
      memory_usage_pct: memoryPct,
      p95_latency_ms: null,  // TODO: v1.1 — add latency tracking
      fallback_count: this._fallbacks.sum(),
    };
  }

  // ── Score calculation (ISSUE spec formula) ──
  calculateScore(signals) {
    const s = signals || this.getSignals();

    let score = 100
      - (s.restart_count * WEIGHTS.restart)
      - (s.error_rate * 100 * (WEIGHTS.errorRate / 100))
      - (s.memory_usage_pct * WEIGHTS.memory)
      - ((s.p95_latency_ms || 0) * WEIGHTS.latency)
      - (s.fallback_count * WEIGHTS.fallback);

    return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
  }

  // ── Status mapping ──
  getStatusLabel(score) {
    if (score >= THRESHOLDS.healthy) return 'healthy';
    if (score >= THRESHOLDS.stable) return 'stable';
    if (score >= THRESHOLDS.degraded) return 'degraded';
    return 'critical';
  }

  // ── Full healthz response ──
  getHealthz() {
    const signals = this.getSignals();
    const score = this.calculateScore(signals);
    const status = this.getStatusLabel(score);

    return {
      status,
      score,
      window: '24h',
      uptime_seconds: Math.round((Date.now() - this.bootedAt) / 1000),
      signals,
    };
  }

  // ══════════════════════════════════════════════════════════
  // Proactive Alert Monitor (ISSUE 3)
  // ══════════════════════════════════════════════════════════

  /**
   * Start proactive monitoring.
   * @param {Function} slackSendFn — (msg) => Promise (from slackHeartbeatService)
   * @param {number} intervalMs — check interval (default 5 min)
   */
  startProactiveMonitor(slackSendFn, intervalMs = 5 * 60 * 1000) {
    this._slackSender = slackSendFn;
    this._lastAlertedStatus = 'healthy'; // track for recovery detection

    this._proactiveTimer = setInterval(() => this._evaluateAndAlert(), intervalMs);
    if (this._proactiveTimer.unref) this._proactiveTimer.unref();
    console.log(`✅ Stability proactive monitor started (interval: ${intervalMs / 1000}s)`);
  }

  _evaluateAndAlert() {
    if (!this._slackSender) return;

    const healthz = this.getHealthz();
    const { status, score, signals } = healthz;

    // Determine alert severity
    let alertLevel = null;
    if (score < THRESHOLDS.degraded) alertLevel = 'critical';
    else if (score < THRESHOLDS.stable) alertLevel = 'degraded';

    // ── Recovery detection ──
    if (!alertLevel && (this._lastAlertedStatus === 'critical' || this._lastAlertedStatus === 'degraded')) {
      this._sendRecoveryAlert(score, status, signals);
      this._lastAlertedStatus = status;
      return;
    }

    if (!alertLevel) return; // healthy or stable — no alert needed

    // ── Cooldown check (reuse alert cooldown system) ──
    const cooldownKey = `proactive|stability|${alertLevel}`;
    const { allowed } = alertCooldown.check(cooldownKey, alertLevel);
    if (!allowed) return;

    this._lastAlertedStatus = status;

    const emoji = alertLevel === 'critical' ? '🔴' : '🟡';
    const signalLines = [
      `• error_rate: ${signals.error_rate}`,
      `• memory: ${signals.memory_usage_pct}%`,
      `• fallbacks: ${signals.fallback_count}`,
      `• restarts: ${signals.restart_count}`,
    ].join('\n');

    const msg = {
      text: `${emoji} Stability ${alertLevel.toUpperCase()}: score ${score}`,
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: `${emoji} Stability ${alertLevel.toUpperCase()}`, emoji: true } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Score:*\n${score} / 100` },
            { type: 'mrkdwn', text: `*Status:*\n${status}` },
          ],
        },
        { type: 'section', text: { type: 'mrkdwn', text: `*Signals:*\n\`\`\`${signalLines}\`\`\`` } },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: alertLevel === 'critical'
            ? '⚠️ *권고:* DRY_RUN 모드 전환 또는 외부 API 호출 축소를 검토하세요.'
            : '📊 *참고:* 추이를 주시하세요. 70점 이하 시 critical 경고로 전환됩니다.' },
        },
        { type: 'context', elements: [{ type: 'mrkdwn', text: `window: 24h | uptime: ${healthz.uptime_seconds}s | ${new Date().toISOString()}` }] },
      ],
    };

    this._slackSender(msg).catch(() => {});
  }

  _sendRecoveryAlert(score, status, signals) {
    const cooldownKey = 'proactive|stability|recovery';
    const { allowed } = alertCooldown.check(cooldownKey, null);
    if (!allowed) return;

    const msg = {
      text: `🟢 Stability RECOVERED: score ${score}`,
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: '🟢 Stability RECOVERED', emoji: true } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Score:*\n${score} / 100` },
            { type: 'mrkdwn', text: `*Status:*\n${status}` },
          ],
        },
        { type: 'context', elements: [{ type: 'mrkdwn', text: `error_rate: ${signals.error_rate} | memory: ${signals.memory_usage_pct}% | ${new Date().toISOString()}` }] },
      ],
    };

    this._slackSender(msg).catch(() => {});
  }

  // ── Cleanup stale buckets ──
  _cleanup() {
    this._totalRequests.cleanup();
    this._errorRequests.cleanup();
    this._fallbacks.cleanup();
  }

  // ── For testing: expose internals ──
  _getRawCounts() {
    return {
      totalRequests: this._totalRequests.sum(),
      errorRequests: this._errorRequests.sum(),
      fallbacks: this._fallbacks.sum(),
    };
  }

  destroy() {
    if (this._cleanupTimer) clearInterval(this._cleanupTimer);
    if (this._proactiveTimer) clearInterval(this._proactiveTimer);
  }
}

// ── Singleton export ──
const stabilityService = new StabilityService();

module.exports = stabilityService;
module.exports.StabilityService = StabilityService;
module.exports.RollingCounter = RollingCounter;
module.exports.WEIGHTS = WEIGHTS;
module.exports.THRESHOLDS = THRESHOLDS;
