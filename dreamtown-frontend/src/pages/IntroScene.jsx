import { useEffect, useState } from "react";
import "./intro.css";

export default function IntroScene({ onFinish }) {
  const [state, setState] = useState("fade_in");
  const [lowEnd, setLowEnd] = useState(false);

  useEffect(() => {
    const isLow =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      navigator.hardwareConcurrency <= 4;

    setLowEnd(isLow);

    if (isLow) {
      // 🔻 저사양 모드 (1.2초 컷)
      setTimeout(() => onFinish(), 1200);
      return;
    }

    const timeline = async () => {
      await wait(600);
      setState("light");

      await wait(700);
      setState("expand");

      await wait(700);
      setState("merge");

      await wait(500);
      onFinish();
    };

    timeline();
  }, []);

  const handleSkip = () => {
    onFinish();
  };

  // import.meta.env.BASE_URL: dev='/', prod='/dreamtown/'
  const BASE = import.meta.env.BASE_URL;

  return (
    <div className={`intro ${state}`} onClick={handleSkip}>
      {/* 배경 */}
      <img
        src={`${BASE}images/aurum_intro.webp`}
        alt="intro"
        className="bg"
      />

      {/* 빛 */}
      <div className="glow" />

      {/* 나선 (저사양 제외) */}
      {!lowEnd && <div className="spiral" style={{ backgroundImage: `url('${BASE}images/spiral-overlay.webp')` }} />}

      {/* 텍스트 */}
      <div className="text">
        당신의 소원은<br />
        이미 움직이고 있어요
      </div>

      <div className="skip">건너뛰기</div>
    </div>
  );
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
