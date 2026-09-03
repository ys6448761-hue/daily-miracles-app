/**
 * Guardian Dispatch Filter Service
 *
 * 6가지 조건으로 발송 대상자 필터링
 * - Fail Closed 원칙: 의심스러우면 제외
 * - 각 조건별 제외 사유 추적
 *
 * @version 1.0 - 2026.08.16
 */

const config = require('../../config/dispatchConfig');

class DispatchFilter {
  constructor(db) {
    this.db = db;
    this.exclusionStats = {};
  }

  /**
   * 전체 필터링 실행
   * @returns { eligible: [...], stats: {...} }
   */
  async filterProfiles(profiles) {
    const eligible = [];
    const stats = {
      total: profiles.length,
      passed: 0,
      excluded: 0,
      byReason: {}
    };

    for (const profile of profiles) {
      const filterResult = await this._applyAllFilters(profile);

      if (filterResult.passed) {
        eligible.push(profile);
        stats.passed++;
      } else {
        stats.excluded++;
        const reason = filterResult.reason;
        stats.byReason[reason] = (stats.byReason[reason] || 0) + 1;

        config.log(config.LOG_LEVELS.DEBUG, `필터 제외: ${reason}`, {
          ...this._maskProfile(profile),
          reason
        });
      }
    }

    return { eligible, stats };
  }

  /**
   * 모든 필터 순차 적용
   * @private
   */
  async _applyAllFilters(profile) {
    const filters = Object.entries(config.FILTER_CONDITIONS);

    for (const [filterKey, filter] of filters) {
      let passed = false;

      try {
        if (typeof filter.check === 'function') {
          // 비동기 필터는 DB 전달
          if (filter.check.constructor.name === 'AsyncFunction') {
            passed = await filter.check(profile, this.db);
          } else {
            passed = filter.check(profile);
          }
        }
      } catch (error) {
        config.log(config.LOG_LEVELS.WARN, `필터 실행 오류 (Fail Closed)`, {
          filter: filterKey,
          profileId: profile.id,
          error: error.message
        });
        passed = false; // Fail Closed
      }

      if (!passed) {
        return {
          passed: false,
          reason: filter.exclude_reason,
          failedFilter: filterKey
        };
      }
    }

    // 모든 필터 통과
    return { passed: true };
  }

  /**
   * 이름 마스킹 (로그용)
   * @private
   */
  _maskName(name) {
    if (!name || name.length === 0) return '****';
    if (name.length === 1) return name + '***';
    return name[0] + '***' + name[name.length - 1];
  }

  /**
   * 프로필 정보 마스킹 (로그용)
   * @private
   */
  _maskProfile(profile) {
    return {
      profileId: profile.profile_id?.substring(0, 8) + '...' || '(none)',
      wishEntryId: profile.wish_entry_id?.substring(0, 8) + '...' || '(none)',
      name: this._maskName(profile.name)
    };
  }

  /**
   * 필터 통계 출력 (사람 읽기 좋은 형식)
   */
  static formatStats(stats) {
    let output = `
┌─────────────────────────────────────────────────┐
│  Guardian Dispatch Filter Report                │
├─────────────────────────────────────────────────┤
│  Total Profiles: ${stats.total.toString().padEnd(30)} │
│  Passed Filters: ${stats.passed.toString().padEnd(30)} │
│  Excluded: ${stats.excluded.toString().padEnd(37)} │
└─────────────────────────────────────────────────┘
`;

    if (stats.byReason && Object.keys(stats.byReason).length > 0) {
      output += `\nExclusion Breakdown:\n`;
      for (const [reason, count] of Object.entries(stats.byReason)) {
        output += `  ${reason.padEnd(30)} : ${count}\n`;
      }
    }

    return output;
  }
}

module.exports = DispatchFilter;
