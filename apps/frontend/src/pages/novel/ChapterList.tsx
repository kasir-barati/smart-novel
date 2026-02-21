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
}

export function ChapterList({
  chapters,
  onChapterClick,
  currentChapterId,
}: ChapterListProps) {
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
          <button
            key={chapter.id}
            onClick={() => onChapterClick(chapter.id)}
            className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
              isActive
                ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/30'
                : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex-1">
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
            </div>
            <span className="ml-4 text-xs text-gray-500 dark:text-gray-400">
              {formatDate(chapter.createdAt)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
