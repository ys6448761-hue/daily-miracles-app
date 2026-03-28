export function safeString(str, maxLen) {
  const chars = Array.from(str ?? '');
  return maxLen ? chars.slice(0, maxLen).join('') : chars.join('');
}
