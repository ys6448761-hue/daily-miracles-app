/**
 * SubtitleConverter — SRT → ASS 변환
 * AIL-2026-0219-VID-003
 *
 * ASS 파일에 Noto Sans KR 폰트를 명시적으로 지정하여
 * 한글 렌더링 일관성을 보장합니다.
 */

const DEFAULT_FONT = 'Noto Sans KR';
const DEFAULT_FONT_SIZE = 40;
const DEFAULT_PRIMARY_COLOR = '&H00FFFFFF'; // White
const DEFAULT_OUTLINE_COLOR = '&H00000000'; // Black
const DEFAULT_BACK_COLOR = '&H80000000';    // Semi-transparent black

class SubtitleConverter {
  /**
   * SRT 문자열 → ASS 문자열 변환
   * @param {string} srtContent - SRT 형식 자막
   * @param {Object} styleConfig - 스타일 설정
   * @returns {string} ASS 형식 자막
   */
  static srtToAss(srtContent, styleConfig = {}) {
    const font = styleConfig.font || DEFAULT_FONT;
    const fontSize = styleConfig.fontSize || DEFAULT_FONT_SIZE;
    const primaryColor = styleConfig.primaryColor || DEFAULT_PRIMARY_COLOR;
    const outlineColor = styleConfig.outlineColor || DEFAULT_OUTLINE_COLOR;
    const backColor = styleConfig.backColor || DEFAULT_BACK_COLOR;
    const resX = styleConfig.resX || 1080;
    const resY = styleConfig.resY || 1920;

    const entries = SubtitleConverter.parseSrt(srtContent);

    const header = [
      '[Script Info]',
      'ScriptType: v4.00+',
      'PlayResX: ' + resX,
      'PlayResY: ' + resY,
      'WrapStyle: 0',
      'ScaledBorderAndShadow: yes',
      'YCbCr Matrix: TV.709',
      '',
      '[V4+ Styles]',
      'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
      `Style: Default,${font},${fontSize},${primaryColor},&H000000FF,${outlineColor},${backColor},0,0,0,0,100,100,0,0,1,2,1,2,30,30,60,1`,
      '',
      '[Events]',
      'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    ];

    const events = entries.map(entry => {
      const start = SubtitleConverter.formatTimeAss(entry.start);
      const end = SubtitleConverter.formatTimeAss(entry.end);
      const text = entry.text.replace(/\n/g, '\\N');
      return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
    });

    return header.join('\n') + '\n' + events.join('\n') + '\n';
  }

  /**
   * SRT 문자열 파싱
   * @param {string} srtContent
   * @returns {Array<{id: number, start: number, end: number, text: string}>}
   */
  static parseSrt(srtContent) {
    const entries = [];
    const blocks = srtContent.trim().split(/\n\s*\n/);

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue;

      const id = parseInt(lines[0], 10);
      const timeLine = lines[1];
      const timeMatch = timeLine.match(
        /(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/
      );
      if (!timeMatch) continue;

      const start = SubtitleConverter.parseTimeSrt(timeMatch[1]);
      const end = SubtitleConverter.parseTimeSrt(timeMatch[2]);
      const text = lines.slice(2).join('\n');

      entries.push({ id, start, end, text });
    }

    return entries;
  }

  /**
   * SRT 시간 문자열 → 초
   * "00:00:02,800" → 2.8
   */
  static parseTimeSrt(timeStr) {
    const normalized = timeStr.replace(',', '.');
    const parts = normalized.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * 초 → ASS 시간 문자열
   * 2.8 → "0:00:02.80"
   */
  static formatTimeAss(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.round((seconds % 1) * 100);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }

  /**
   * ASS 파일 유효성 검사
   */
  static validateAss(assContent) {
    const errors = [];
    if (!assContent.includes('[Script Info]')) errors.push('Missing [Script Info]');
    if (!assContent.includes('[V4+ Styles]')) errors.push('Missing [V4+ Styles]');
    if (!assContent.includes('[Events]')) errors.push('Missing [Events]');
    if (!assContent.includes('Dialogue:')) errors.push('No Dialogue entries');
    if (!assContent.includes(DEFAULT_FONT)) errors.push(`Font "${DEFAULT_FONT}" not specified in Style`);
    return { valid: errors.length === 0, errors };
  }
}

module.exports = SubtitleConverter;
