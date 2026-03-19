export default function GrowthSummary({ stage }) {
  const messages = [
    "아직 조용한 별입니다",
    "작은 빛이 머물렀어요",
    "별빛이 조금 더 선명해졌어요",
    "당신의 별에 결이 쌓이고 있어요",
    "별이 점점 또렷해지고 있어요",
  ];

  return (
    <div className="text-center opacity-70 mt-10">
      {messages[stage]}
    </div>
  );
}
