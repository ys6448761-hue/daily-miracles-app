import html2canvas from 'html2canvas';

const GALAXY_URL = 'https://app.dailymiracles.kr/galaxy';

// 카드 캡처 → Blob/File 반환 (저장 + 공유 공통 사용)
async function captureCard(setCaptureMode) {
  const target = document.getElementById('dreamtown-postcard');
  if (!target) return null;

  setCaptureMode(true);
  await new Promise((r) => setTimeout(r, 50));

  const canvas = await html2canvas(target, {
    backgroundColor: null,
    scale: 3,          // 1080px 이상 품질
    useCORS: true,
    logging: false,
  });

  setCaptureMode(false);
  return canvas;
}

export default function PostcardActions({ onBack, setCaptureMode, message }) {

  // 저장하기 — PNG 다운로드
  const handleSave = async () => {
    const canvas = await captureCard(setCaptureMode);
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `dreamtown-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // 카톡으로 보내기 — 이미지 파일 공유 우선, 텍스트 fallback
  const handleShare = async () => {
    const canvas = await captureCard(setCaptureMode);
    if (!canvas) return;

    const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
    const file = new File([blob], 'dreamtown-postcard.png', { type: 'image/png' });

    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        // 이미지 파일 직접 공유 (카톡 포함)
        await navigator.share({ files: [file], text: message });
      } else if (navigator.share) {
        // 텍스트 + 링크 공유
        await navigator.share({ text: `${message}\n\n👉 ${GALAXY_URL}` });
      } else {
        // 클립보드 fallback
        await navigator.clipboard.writeText(`${message}\n\n👉 ${GALAXY_URL}`);
      }
    } catch {
      // 사용자 취소 등 무시
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-3 w-full max-w-sm">

      {/* 1순위 — 저장하기 */}
      <button
        type="button"
        onClick={handleSave}
        className="w-full py-3 rounded-2xl bg-white/12 text-white font-medium tracking-wide hover:bg-white/18 active:bg-white/20 transition"
      >
        저장하기
      </button>

      {/* 2순위 — 카톡으로 보내기 */}
      <button
        type="button"
        onClick={handleShare}
        className="w-full py-3 rounded-2xl bg-white/7 text-white/85 hover:bg-white/12 active:bg-white/15 transition"
      >
        카톡으로 보내기
      </button>

      {/* 3순위 — 다시 보기 */}
      <button
        type="button"
        onClick={onBack}
        className="w-full py-2 rounded-2xl text-white/45 hover:text-white/65 transition text-sm"
      >
        다시 보기
      </button>

    </div>
  );
}
