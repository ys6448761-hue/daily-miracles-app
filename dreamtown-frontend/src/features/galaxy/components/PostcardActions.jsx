import html2canvas from 'html2canvas';

const GALAXY_URL = 'https://app.dailymiracles.kr/galaxy';

export default function PostcardActions({ onBack, setCaptureMode, message }) {
  const handleSave = async () => {
    const target = document.getElementById('dreamtown-postcard');
    if (!target) return;

    // 캡처 모드 ON → blur 제거 + opacity 보정
    setCaptureMode(true);
    await new Promise((r) => setTimeout(r, 50));

    const canvas = await html2canvas(target, {
      backgroundColor: null,
      scale: 3,
      useCORS: true,
    });

    // 캡처 모드 OFF → 원래 스타일 복원
    setCaptureMode(false);

    const link = document.createElement('a');
    link.download = `dreamtown-postcard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShare = async () => {
    if (!navigator.share) {
      // Web Share API 미지원 환경 → 클립보드 복사 fallback
      await navigator.clipboard.writeText(`${message}\n\n👉 ${GALAXY_URL}`);
      return;
    }

    await navigator.share({
      text: `${message}\n\n👉 ${GALAXY_URL}`,
    });
  };

  return (
    <div className="mt-8 flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="px-4 py-2 rounded-full bg-white/5 text-white/70 hover:bg-white/10 transition"
      >
        돌아가기
      </button>

      <button
        type="button"
        onClick={handleShare}
        className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/15 transition"
      >
        공유하기
      </button>

      <button
        type="button"
        onClick={handleSave}
        className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/15 transition"
      >
        카드 저장
      </button>
    </div>
  );
}
