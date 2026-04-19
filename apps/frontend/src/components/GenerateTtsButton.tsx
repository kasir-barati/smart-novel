import { useNavigate } from 'react-router-dom';

interface GenerateTtsButtonProps {
  novelId: string;
  chapterId: string;
  /** Whether the chapter already has TTS-friendly content */
  hasTtsFriendlyContent?: boolean;
  /** URL to return to after save/cancel on the TTS review page */
  returnUrl?: string;
}

export function GenerateTtsButton({
  novelId,
  chapterId,
  hasTtsFriendlyContent,
  returnUrl,
}: GenerateTtsButtonProps) {
  const navigate = useNavigate();

  const ttsReviewPath = `/novel/${novelId}/chapter/${chapterId}/tts-review${
    returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''
  }`;

  return (
    <button
      onClick={() => navigate(ttsReviewPath)}
      className="cursor-pointer rounded bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:hover:bg-amber-800"
      title="Generate TTS-friendly content"
    >
      {hasTtsFriendlyContent ? 'Edit TTS Content' : 'Generate TTS'}
    </button>
  );
}
