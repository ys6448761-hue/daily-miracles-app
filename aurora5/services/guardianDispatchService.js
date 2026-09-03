/**
 * Guardian Dispatch Service
 *
 * 메인 배치 로직
 * - 대상자 조회 → 필터링 → (Dry Run 또는 실제) 발송 → 로깅
 * - Phase 1: Dry Run (로깅만)
 * - Phase 2: 실제 SMS 발송 (수동 승인 후)
 *
 * @version 1.0 - 2026.08.16
 */

const messageProvider = require('../../services/messageProvider');
const DispatchFilter = require('./dispatchFilter');
const config = require('../../config/dispatchConfig');

class GuardianDispatchService {
  constructor(db) {
    this.db = db;
    this.filter = new DispatchFilter(db);
  }

  /**
   * 메인 배치 실행
   */
  async runGuardianDispatchBatch() {
    const batchStartTime = new Date();

    config.log(config.LOG_LEVELS.INFO, '배치 시작', {
      phase: config.GUARDIAN_DISPATCH_DRY_RUN ? 'DRY_RUN' : 'LIVE',
      cutoffAt: config.GUARDIAN_DISPATCH_CUTOFF_AT,
      timestamp: batchStartTime.toISOString()
    });

    try {
      // 1단계: 대상자 조회
      config.log(config.LOG_LEVELS.INFO, '대상자 조회 시작', {
        cutoffAt: config.GUARDIAN_DISPATCH_CUTOFF_AT
      });

      const profiles = await this._getEligibleProfiles();
      config.log(config.LOG_LEVELS.INFO, `조회 완료: ${profiles.length}명`, {
        count: profiles.length
      });

      // 2단계: 필터링
      config.log(config.LOG_LEVELS.INFO, '필터링 시작', {
        targetCount: profiles.length
      });

      const { eligible, stats } = await this.filter.filterProfiles(profiles);
      config.log(config.LOG_LEVELS.INFO, '필터링 완료', stats);
      console.log(DispatchFilter.formatStats(stats));

      // 3단계: 발송 또는 Dry Run
      const dispatchResults = {
        sent: 0,
        failed: 0,
        dryRun: 0,
        errors: []
      };

      if (config.GUARDIAN_DISPATCH_DRY_RUN) {
        config.log(config.LOG_LEVELS.INFO, 'DRY RUN 모드 — 실제 발송 금지', {
          eligibleCount: eligible.length
        });

        // Dry Run: 로깅만 수행
        for (const profile of eligible) {
          await this._logDryRunDispatch(profile, stats);
          dispatchResults.dryRun++;
        }

        config.log(config.LOG_LEVELS.INFO, `DRY RUN 로깅 완료: ${dispatchResults.dryRun}명`);
      } else {
        config.log(config.LOG_LEVELS.INFO, 'LIVE 모드 — SMS 발송 시작', {
          eligibleCount: eligible.length
        });

        // 실제 발송
        for (const profile of eligible) {
          try {
            const result = await this._sendToProfile(profile);

            if (result.success) {
              dispatchResults.sent++;
              config.log(config.LOG_LEVELS.DEBUG, `발송 성공`, {
                profileId: profile.id,
                channel: result.channel
              });
            } else {
              dispatchResults.failed++;
              config.log(config.LOG_LEVELS.WARN, `발송 실패`, {
                profileId: profile.id,
                reason: result.reason
              });
            }
          } catch (error) {
            dispatchResults.failed++;
            dispatchResults.errors.push({
              profileId: profile.id,
              error: error.message
            });

            config.log(config.LOG_LEVELS.ERROR, `발송 오류`, {
              profileId: profile.id,
              error: error.message
            });
          }
        }
      }

      // 최종 리포트
      const batchEndTime = new Date();
      const duration = Math.round((batchEndTime - batchStartTime) / 1000);

      const report = {
        phase: config.GUARDIAN_DISPATCH_DRY_RUN ? 'DRY_RUN' : 'LIVE',
        startTime: batchStartTime.toISOString(),
        endTime: batchEndTime.toISOString(),
        durationSeconds: duration,
        cutoffAt: config.GUARDIAN_DISPATCH_CUTOFF_AT,
        summary: {
          totalQueried: profiles.length,
          totalEligible: eligible.length,
          totalExcluded: stats.excluded,
          exclusionReasons: stats.byReason
        },
        dispatch: dispatchResults
      };

      config.log(config.LOG_LEVELS.INFO, '배치 완료', report);
      return report;
    } catch (error) {
      config.log(config.LOG_LEVELS.ERROR, '배치 실패', {
        error: error.message,
        stack: error.stack
      });

      return {
        phase: config.GUARDIAN_DISPATCH_DRY_RUN ? 'DRY_RUN' : 'LIVE',
        success: false,
        error: error.message,
        timestamp: batchStartTime.toISOString()
      };
    }
  }

  /**
   * 대상자 조회 (cutoff 이후 생성, 동의 완료)
   * @private
   */
  async _getEligibleProfiles() {
    try {
      const result = await this.db.query(
        config.QUERY_ELIGIBLE_PROFILES,
        [config.GUARDIAN_DISPATCH_CUTOFF_AT]
      );

      return result.rows || [];
    } catch (error) {
      config.log(config.LOG_LEVELS.ERROR, '대상자 조회 실패', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * wish_entry에 SMS 발송
   * @private
   */
  async _sendToProfile(profile) {
    const { profile_id, name, phone_hash, wish_entry_id } = profile;

    try {
      // SMS 메시지 생성 (profile_id 기준 링크)
      const starLink = `${messageProvider.APP_BASE_URL}/my-star/${profile_id}`;
      const smsText = config.SMS_TEMPLATE(name, starLink);

      // SMS 발송
      const sendResult = await messageProvider.sendSensSMS(phone_hash, smsText);

      if (sendResult.success) {
        // 성공 로그
        await this._logDispatchResult(profile, 'sent', sendResult);
        return { success: true, channel: sendResult.channel };
      } else {
        // 실패 로그
        await this._logDispatchResult(profile, 'failed', sendResult);
        return { success: false, reason: sendResult.reason };
      }
    } catch (error) {
      // 오류 로그
      await this._logDispatchResult(profile, 'failed', { error: error.message });
      throw error;
    }
  }

  /**
   * 발송 결과 로그 (실제 발송 + Dry Run)
   * @private
   */
  async _logDispatchResult(profile, status, details = {}) {
    try {
      await this.db.query(
        `INSERT INTO message_dispatch_logs
         (phone_hash, event_name, delivery_status, details, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [
          profile.phone_hash,
          'guardian_dispatch',
          status,
          JSON.stringify({
            profileId: profile.profile_id,
            profileName: profile.name,
            wishEntryId: profile.wish_entry_id,
            dispatchDate: new Date().toISOString().split('T')[0],
            ...details
          })
        ]
      );
    } catch (error) {
      config.log(config.LOG_LEVELS.ERROR, '로그 저장 실패', {
        profileId: profile.profile_id,
        wishEntryId: profile.wish_entry_id,
        error: error.message
      });
    }
  }

  /**
   * Dry Run 로깅 (실제 발송하지 않고 로그만 기록)
   * @private
   */
  async _logDryRunDispatch(profile, filterStats) {
    try {
      await this.db.query(
        `INSERT INTO message_dispatch_logs
         (phone_hash, event_name, delivery_status, details, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [
          profile.phone_hash,
          'guardian_dispatch',
          config.DISPATCH_STATUS.SKIPPED, // dry_run
          JSON.stringify({
            profileId: profile.profile_id,
            profileName: profile.name,
            wishEntryId: profile.wish_entry_id,
            dispatchDate: new Date().toISOString().split('T')[0],
            dryRun: true,
            mode: config.GUARDIAN_DISPATCH_DRY_RUN ? 'DRY_RUN' : 'LIVE'
          })
        ]
      );
    } catch (error) {
      config.log(config.LOG_LEVELS.ERROR, 'DRY RUN 로그 저장 실패', {
        profileId: profile.profile_id,
        wishEntryId: profile.wish_entry_id,
        error: error.message
      });
    }
  }

  /**
   * 배치 상태 조회 (운영 대시보드용)
   */
  async getDispatchStatus() {
    try {
      const result = await this.db.query(
        `SELECT
          delivery_status,
          COUNT(*) as count,
          MAX(created_at) as latest
         FROM message_dispatch_logs
         WHERE event_name = 'guardian_dispatch'
         GROUP BY delivery_status
         ORDER BY delivery_status`
      );

      return {
        phase: config.GUARDIAN_DISPATCH_DRY_RUN ? 'DRY_RUN' : 'LIVE',
        cutoffAt: config.GUARDIAN_DISPATCH_CUTOFF_AT,
        summary: result.rows.reduce((acc, row) => {
          acc[row.delivery_status] = row.count;
          return acc;
        }, {}),
        lastUpdate: result.rows[0]?.latest || null
      };
    } catch (error) {
      config.log(config.LOG_LEVELS.ERROR, '상태 조회 실패', {
        error: error.message
      });
      return null;
    }
  }
}

module.exports = GuardianDispatchService;
