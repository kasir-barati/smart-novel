import { useNavigate } from 'react-router-dom';

import { useReadChapters } from '../../hooks/useReadChapters';

interface ChapterInfo {
  id: string;
  title: string | null;
  createdAt: string;
}

interface ChapterListProps {
  chapters: ChapterInfo[];
  onChapterClick: (chapterId: string) => void;
  currentChapterId: string | null;
  canManageTts?: boolean;
  novelId?: string;
}

export function ChapterList({
  chapters,
  onChapterClick,
  currentChapterId,
  canManageTts,
  novelId,
}: ChapterListProps) {
  const navigate = useNavigate();
  const { isRead } = useReadChapters();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-2">
      {chapters.map((chapter, index) => {
        const read = isRead(chapter.id);
        const isActive = currentChapterId === chapter.id;

        return (
          <div
            key={chapter.id}
            className={`flex w-full items-stretch rounded-lg border transition-colors ${
              isActive
                ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/30'
                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
            }`}
          >
            <button
              onClick={() => onChapterClick(chapter.id)}
              className={`flex flex-1 cursor-pointer items-center rounded-l-lg py-3 pl-3 text-left transition-colors ${
                isActive
                  ? ''
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <h3
                className={`text-sm font-medium ${
                  read
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                Chapter {index + 1}
                {chapter.title && `: ${chapter.title}`}
              </h3>
            </button>
            <div className="ml-4 flex items-center gap-3 py-3 pr-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(chapter.createdAt)}
              </span>
              {canManageTts && novelId && (
                <button
                  onClick={() =>
                    navigate(
                      `/novel/${novelId}/chapter/${chapter.id}/tts-review`,
                    )
                  }
                  className="cursor-pointer rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:hover:bg-amber-800"
                  title="Generate TTS-friendly content"
                >
                  Generate TTS
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
