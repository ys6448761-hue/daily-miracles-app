/**
 * AdCreativeValidator — 가이드 준수 자동 검증 (30항목)
 *
 * 프롬프트가 gpt-video-production.md 규격을 충족하는지
 * 코드로 자동 판별합니다.
 */

const {
  STYLE_LOCK, BASE_LINES, BASE_LINE1, BASE_LINE2, BASE_LINE3,
  SOWONI_LOCK, AURUM_LOCK, TEXT_ZERO, NEGATIVE_PROMPT,
  SORA_I2V_COMMON, STYLE_TOKENS, COSTUMES, AURUM_STATES,
  TIER1_BANNED
} = require('./constants');

class AdCreativeValidator {
  /**
   * 전체 크리에이티브 검증
   * @param {Object} creative - AdCreativeBuilder.build() 결과
   * @returns {Object} { pass, total, failed, details }
   */
  static validateAll(creative) {
    const results = [];

    // 1. Production Summary 검증
    results.push(...AdCreativeValidator.validateSummary(creative.productionSummary));

    // 2. Scene Plan 검증
    results.push(...AdCreativeValidator.validateScenePlan(creative.scenePlan));

    // 3. Keyframe Prompts 검증
    creative.keyframePrompts.forEach((kf, i) => {
      results.push(...AdCreativeValidator.validateKeyframePrompt(kf, i));
    });

    // 4. Sora Prompts 검증
    creative.soraPrompts.forEach((sp, i) => {
      results.push(...AdCreativeValidator.validateSoraPrompt(sp, i));
    });

    // 5. Subtitles 검증
    results.push(...AdCreativeValidator.validateSubtitles(creative.subtitles));

    // 6. Sound Brief 검증
    results.push(...AdCreativeValidator.validateSoundBrief(creative.logoSongBrief));

    // 7. 크로스체크
    results.push(...AdCreativeValidator.validateCrossChecks(creative));

    const passed = results.filter(r => r.pass);
    const failed = results.filter(r => !r.pass);

    return {
      pass: failed.length === 0,
      total: results.length,
      passed: passed.length,
      failed: failed.length,
      details: results,
      failedItems: failed
    };
  }

  // ─────────────────────────────────────────────────
  // Summary 검증
  // ─────────────────────────────────────────────────
  static validateSummary(summary) {
    return [
      {
        id: 'S01', category: 'SUMMARY',
        name: '9:16 비율 명시',
        pass: summary.format === '9:16 Vertical',
        detail: `format = "${summary.format}"`
      },
      {
        id: 'S02', category: 'SUMMARY',
        name: '1080×1920 해상도',
        pass: summary.resolution === '1080×1920',
        detail: `resolution = "${summary.resolution}"`
      },
      {
        id: 'S03', category: 'SUMMARY',
        name: 'TEXT ZERO 명시',
        pass: summary.textRule.includes('TEXT ZERO'),
        detail: `textRule = "${summary.textRule}"`
      },
      {
        id: 'S04', category: 'SUMMARY',
        name: '폰 UI 추상화 명시',
        pass: summary.phoneUI.includes('abstract soft color blocks'),
        detail: `phoneUI = "${summary.phoneUI}"`
      }
    ];
  }

  // ─────────────────────────────────────────────────
  // Scene Plan 검증
  // ─────────────────────────────────────────────────
  static validateScenePlan(scenePlan) {
    const results = [];

    results.push({
      id: 'SP01', category: 'SCENE_PLAN',
      name: '3유닛 분리',
      pass: scenePlan.length === 3,
      detail: `유닛 수: ${scenePlan.length}`
    });

    results.push({
      id: 'SP02', category: 'SCENE_PLAN',
      name: 'U1 = PAIN',
      pass: scenePlan[0]?.phase === 'PAIN',
      detail: `U1 phase = "${scenePlan[0]?.phase}"`
    });

    results.push({
      id: 'SP03', category: 'SCENE_PLAN',
      name: 'PAIN→SOLUTION 순서',
      pass: scenePlan[0]?.phase === 'PAIN' &&
            scenePlan[1]?.phase === 'SOLUTION' &&
            scenePlan[2]?.phase === 'SOLUTION',
      detail: `phases = [${scenePlan.map(s => s.phase).join(', ')}]`
    });

    return results;
  }

  // ─────────────────────────────────────────────────
  // Keyframe Prompt 검증
  // ─────────────────────────────────────────────────
  static validateKeyframePrompt(kf, index) {
    const p = kf.prompt;
    const label = `KF-${kf.unitId}`;

    return [
      {
        id: `KF${index + 1}_01`, category: label,
        name: 'STYLE LOCK 원문 포함',
        pass: p.includes('Strict 2D hand-drawn animation style.') &&
              p.includes('Ink line art + warm watercolor wash + paper grain texture.') &&
              p.includes('NO 3D, NO photoreal, NO CGI look'),
        detail: 'STYLE LOCK 전문 일치 여부'
      },
      {
        id: `KF${index + 1}_02`, category: label,
        name: 'BASE Line1 포함',
        pass: p.includes('cel animation aesthetic'),
        detail: 'BASE Line1 키워드 확인'
      },
      {
        id: `KF${index + 1}_03`, category: label,
        name: 'BASE Line2 포함',
        pass: p.includes('NO gradients resembling 3D shading'),
        detail: 'BASE Line2 키워드 확인'
      },
      {
        id: `KF${index + 1}_04`, category: label,
        name: 'BASE Line3 포함',
        pass: p.includes('origami-style flat rendering') && p.includes('SAFE SPACE action'),
        detail: 'BASE Line3 키워드 확인'
      },
      {
        id: `KF${index + 1}_05`, category: label,
        name: 'SOWONI LOCK v2 포함',
        pass: p.includes('adult Korean college student, early 20s (20–22), NOT a minor'),
        detail: 'SOWONI LOCK 핵심 문구'
      },
      {
        id: `KF${index + 1}_06`, category: label,
        name: '의상 프리셋 명시',
        pass: COSTUMES.some(c => p.includes(`Costume: ${c}`)),
        detail: `의상 포함 여부`
      },
      {
        id: `KF${index + 1}_07`, category: label,
        name: 'AURUM LOCK v2 포함',
        pass: p.includes('Rounded shell-orb body with simple scute plates'),
        detail: 'AURUM LOCK 핵심 문구 (거북이)'
      },
      {
        id: `KF${index + 1}_08`, category: label,
        name: '아우룸 상태 명시',
        pass: AURUM_STATES.some(s => p.includes(`State: ${s}`)),
        detail: `상태 포함 여부`
      },
      {
        id: `KF${index + 1}_09`, category: label,
        name: 'TEXT ZERO 포함',
        pass: p.includes('NO readable text, NO subtitles, NO logos, NO watermark'),
        detail: 'TEXT ZERO 핵심 문구'
      },
      {
        id: `KF${index + 1}_10`, category: label,
        name: '텍스트 지시 없음',
        pass: !p.includes('On-screen subtitle') &&
              !p.includes('text fades in') &&
              !p.includes('on-screen text'),
        detail: '영상 내 텍스트 지시 부재 확인'
      },
      {
        id: `KF${index + 1}_11`, category: label,
        name: 'NEGATIVE 전량 포함 (40+ 단어)',
        pass: p.includes('photorealistic') && p.includes('tessellation') &&
              (p.match(/,/g) || []).length >= 35,
        detail: `NEGATIVE 쉼표 수: ${(p.match(/,/g) || []).length}`
      },
      {
        id: `KF${index + 1}_12`, category: label,
        name: '스타일 토큰 ≥3',
        pass: (() => {
          const count = STYLE_TOKENS.filter(t => p.includes(t)).length;
          return count >= 3;
        })(),
        detail: `사용된 토큰 수: ${STYLE_TOKENS.filter(t => p.includes(t)).length}`
      },
      {
        id: `KF${index + 1}_13`, category: label,
        name: 'Tier1 금지어 없음',
        pass: !TIER1_BANNED.some(word => {
          // NEGATIVE 블록 안의 금지어는 허용 (금지 목록으로 사용 중)
          const beforeNeg = p.split('[NEGATIVE]')[0] || '';
          const sceneSection = beforeNeg.split('[SCENE]')[1] || '';
          if (!sceneSection) return false;

          const lower = sceneSection.toLowerCase();
          const wLower = word.toLowerCase();

          // Word-boundary match (avoid "render" matching "rendering")
          const escaped = wLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const re = new RegExp(`\\b${escaped}\\b`, 'gi');
          let m;
          while ((m = re.exec(lower)) !== null) {
            // Skip negation context: preceded by "no " or "not "
            const pre = lower.substring(Math.max(0, m.index - 5), m.index).trimEnd();
            if (pre.endsWith('no') || pre.endsWith('not')) continue;
            return true; // positive usage found
          }
          return false;
        }),
        detail: 'SCENE 섹션 내 Tier1 금지어 부재'
      },
      {
        id: `KF${index + 1}_14`, category: label,
        name: '컬러 스크립트 준수',
        pass: (() => {
          if (kf.phase === 'PAIN') {
            return p.includes('Cool grey') || p.includes('desaturated') || p.includes('blue shadow');
          }
          return p.includes('Warm golden') || p.includes('bright pastel') || p.includes('warm');
        })(),
        detail: `${kf.phase} 컬러 적합성`
      }
    ];
  }

  // ─────────────────────────────────────────────────
  // Sora I2V Prompt 검증
  // ─────────────────────────────────────────────────
  static validateSoraPrompt(sp, index) {
    const p = sp.prompt;
    const label = `SORA-${sp.unitId}`;

    return [
      {
        id: `SR${index + 1}_01`, category: label,
        name: 'SORA I2V COMMON 포함',
        pass: p.includes('Use the provided keyframe image as the only visual reference'),
        detail: 'I2V 공통 지침 포함 여부'
      },
      {
        id: `SR${index + 1}_02`, category: label,
        name: 'STYLE LOCK 포함',
        pass: p.includes('Strict 2D hand-drawn animation style.'),
        detail: 'Sora 프롬프트 내 STYLE LOCK'
      },
      {
        id: `SR${index + 1}_03`, category: label,
        name: 'TEXT ZERO 포함',
        pass: p.includes('NO readable text'),
        detail: 'Sora 프롬프트 내 TEXT ZERO'
      },
      {
        id: `SR${index + 1}_04`, category: label,
        name: '3-Beat 구조 (A/B/C)',
        pass: p.includes('Beat A') && p.includes('Beat B') && p.includes('Beat C'),
        detail: '3-Beat 레이블 존재'
      },
      {
        id: `SR${index + 1}_05`, category: label,
        name: 'Beat C 홀드 ≥ 0.8s',
        pass: /0\.[89]s hold|1\.0s hold/.test(p),
        detail: 'Beat C 홀드 시간'
      },
      {
        id: `SR${index + 1}_06`, category: label,
        name: '5초 + NO hard cuts',
        pass: p.includes('Duration: 5 seconds') && p.includes('NO hard cuts'),
        detail: '5초 단일 샷 명시'
      },
      {
        id: `SR${index + 1}_07`, category: label,
        name: 'NEGATIVE 포함',
        pass: p.includes('photorealistic') && p.includes('tessellation'),
        detail: 'Sora 프롬프트 내 NEGATIVE'
      }
    ];
  }

  // ─────────────────────────────────────────────────
  // Subtitles 검증
  // ─────────────────────────────────────────────────
  static validateSubtitles(subtitles) {
    return [
      {
        id: 'SUB01', category: 'SUBTITLES',
        name: '자막 존재',
        pass: subtitles && subtitles.length > 0,
        detail: `자막 수: ${subtitles?.length || 0}`
      },
      {
        id: 'SUB02', category: 'SUBTITLES',
        name: '브랜드 컬러 사용',
        pass: subtitles?.some(s => s.color.includes('#9B87F5') || s.color.includes('#F5A7C6')),
        detail: '퍼플/핑크 브랜드 컬러 포함'
      }
    ];
  }

  // ─────────────────────────────────────────────────
  // Sound Brief 검증
  // ─────────────────────────────────────────────────
  static validateSoundBrief(brief) {
    return [
      {
        id: 'SND01', category: 'SOUND',
        name: '악기/BPM 명시',
        pass: !!brief.instrument && !!brief.bpm,
        detail: `instrument="${brief.instrument}", bpm="${brief.bpm}"`
      }
    ];
  }

  // ─────────────────────────────────────────────────
  // 크로스 체크
  // ─────────────────────────────────────────────────
  static validateCrossChecks(creative) {
    const results = [];

    // 의상 일관성 (15초 내 1종)
    const costumes = new Set();
    creative.keyframePrompts.forEach(kf => {
      const match = kf.prompt.match(/Costume: (\w+)/);
      if (match) costumes.add(match[1]);
    });
    results.push({
      id: 'X01', category: 'CROSS',
      name: '의상 1종 통일 (15초 내)',
      pass: costumes.size === 1,
      detail: `사용된 의상: ${[...costumes].join(', ')}`
    });

    // 6단계 포맷 완성
    results.push({
      id: 'X02', category: 'CROSS',
      name: '6단계 포맷 완성',
      pass: !!creative.productionSummary &&
            !!creative.scenePlan &&
            creative.keyframePrompts?.length === 3 &&
            creative.soraPrompts?.length === 3 &&
            creative.subtitles?.length > 0 &&
            !!creative.logoSongBrief,
      detail: '모든 단계 존재 여부'
    });

    // 감정 1개/유닛
    results.push({
      id: 'X03', category: 'CROSS',
      name: '유닛당 감정 1개 (One Shot One Emotion)',
      pass: creative.scenePlan.every(s => s.emotion && s.emotion.length > 0),
      detail: '각 유닛 감정 명시 확인'
    });

    return results;
  }

  /**
   * 검증 결과를 리포트 문자열로 변환
   */
  static formatReport(result, configId) {
    const lines = [];
    lines.push(`═══════════════════════════════════════════════════════`);
    lines.push(`  가이드 준수 자동 검증 리포트: ${configId}`);
    lines.push(`═══════════════════════════════════════════════════════`);
    lines.push(``);
    lines.push(`  결과: ${result.pass ? '✅ ALL PASS' : '❌ FAIL'}`);
    lines.push(`  통과: ${result.passed}/${result.total} (실패: ${result.failed})`);
    lines.push(``);

    // 카테고리별 그룹
    const categories = {};
    result.details.forEach(d => {
      if (!categories[d.category]) categories[d.category] = [];
      categories[d.category].push(d);
    });

    for (const [cat, items] of Object.entries(categories)) {
      const catPass = items.every(i => i.pass);
      lines.push(`  ── ${cat} ${catPass ? '✅' : '❌'} ──`);
      items.forEach(item => {
        const icon = item.pass ? '✅' : '❌';
        lines.push(`    ${icon} [${item.id}] ${item.name}`);
        if (!item.pass) {
          lines.push(`       → ${item.detail}`);
        }
      });
      lines.push(``);
    }

    if (result.failed > 0) {
      lines.push(`  ⚠️ 실패 항목 요약:`);
      result.failedItems.forEach(f => {
        lines.push(`    ❌ [${f.id}] ${f.name}: ${f.detail}`);
      });
    }

    lines.push(`═══════════════════════════════════════════════════════`);
    return lines.join('\n');
  }
}

module.exports = AdCreativeValidator;
