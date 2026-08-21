import React, { useState } from "react";
import "./impact.css";

export default function ImpactFlow({ journeyId }) {
  const [step, setStep] = useState(0);
  const [emotion, setEmotion] = useState(null);
  const [action, setAction] = useState(null);
  const [depth, setDepth] = useState(null);

  const handleEmotion = (value) => {
    setEmotion(value);
    setStep(1);
  };

  const handleAction = (value) => {
    setAction(value);
    setStep(2);
  };

  const handleDepth = async (value) => {
    setDepth(value);
    setStep(3);

    await fetch("/api/impact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        journey_id: journeyId,
        emotion_result: emotion,
        action_type: action,
        impact_level: value,
      }),
    });
  };

  return (
    <div className="impact-container">

      {/* STEP 0 */}
      {step === 0 && (
        <div className="fade">
          <p className="title">여기까지 잘 왔어요.</p>
          <p className="subtitle">지금 당신 마음은…</p>

          <div className="grid">
            {[
              { label: "조금 가벼워졌어요", value: "light" },
              { label: "조금 또렷해졌어요", value: "clear" },
              { label: "아직 잘 모르겠어요", value: "unknown" },
              { label: "다시 가보고 싶어요", value: "hope" },
            ].map((item) => (
              <button
                key={item.value}
                className="card"
                onClick={() => handleEmotion(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <div className="fade">
          <p className="title">그럼 오늘은…</p>

          <div className="grid">
            {[
              { label: "조금만 더 해볼게요", value: "continue" },
              { label: "미뤄둔 걸 하나 해볼게요", value: "action" },
              { label: "누군가에게 말을 건네볼게요", value: "connect" },
              { label: "오늘은 여기까지 둘게요", value: "rest" },
            ].map((item) => (
              <button
                key={item.value}
                className="card"
                onClick={() => handleAction(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="fade">
          <p className="title">그 선택은…</p>

          <div className="grid small">
            {[
              { label: "생각만 했어요", value: 1 },
              { label: "조금 시도해봤어요", value: 2 },
              { label: "실제로 움직였어요", value: 3 },
            ].map((item) => (
              <button
                key={item.value}
                className="card small"
                onClick={() => handleDepth(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="fade center">
          <p className="title">그걸로 충분해요.</p>
          <p className="subtitle">당신은 이미 한 걸음 움직였어요.</p>
        </div>
      )}

    </div>
  );
}
