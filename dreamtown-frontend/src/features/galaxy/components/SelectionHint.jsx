/**
 * SelectionHint — 문장 등장 타이밍 SSOT
 *
 * UX 시퀀스 (절대 변경 금지):
 *   0ms    → 별 선택 (빛 시작)
 *   ~140ms → 문장 등장  ← 이 파일의 핵심
 *   800ms  → 화면 전환 완료
 *
 * 왜 140ms인가:
 *   0ms   = 너무 빠름 (UI처럼 보임)
 *   300ms = 너무 늦음 (끊김 느낌)
 *   120~180ms = 감정은 먼저, 언어는 뒤
 *
 * 애니메이션 의도:
 *   opacity 0→1 + translateY 6px→0px
 *   "등장"이 아니라 "조용히 올라온다" 느낌
 *
 * 금지:
 *   ❌ fade-in만 사용 (너무 UI스럽다)
 *   ❌ scale 애니메이션 (과함)
 *   ❌ delay 없이 즉시 텍스트 변경
 */
import { useEffect, useState } from 'react';
import { PRE_HINT, POST_SELECTION } from '../constants/galaxyCopy';

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function SelectionHint({ phase, selectedDirection }) {
  const [visibleText, setVisibleText] = useState('');
  const [show, setShow] = useState(false);

  // PRE_HINT (즉시)
  useEffect(() => {
    if (phase === 'idle') {
      setVisibleText(getRandom(PRE_HINT));
      setShow(true);
    }
  }, [phase]);

  // POST_SELECTION (딜레이 핵심)
  useEffect(() => {
    if (
      (phase === 'selecting' || phase === 'transitioning') &&
      selectedDirection
    ) {
      setShow(false);

      const timeout = setTimeout(() => {
        setVisibleText(getRandom(POST_SELECTION[selectedDirection]));
        setShow(true);
      }, 140); // 🔥 120~180ms 사이 — 감정은 먼저, 언어는 뒤

      return () => clearTimeout(timeout);
    }
  }, [phase, selectedDirection]);

  return (
    <div className="absolute bottom-10 w-full text-center text-white pointer-events-none">
      <div
        className="transition-all duration-500 ease-out"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0px)' : 'translateY(6px)',
        }}
      >
        {visibleText}
      </div>
    </div>
  );
}
