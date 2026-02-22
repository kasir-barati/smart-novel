import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { Chapter } from '../../types/graphql.types';

interface ChapterContentProps {
  chapter: Chapter;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function ChapterContent({
  chapter,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: ChapterContentProps) {
  return (
    <div className="space-y-6">
      {/* Navigation Buttons - Top */}
      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          ← Previous
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Next →
        </button>
      </div>

      {/* Chapter Title */}
      <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {chapter.title || `Chapter ${chapter.id}`}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Updated: {new Date(chapter.updatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Chapter Content */}
      <div className="prose-container">
        <MarkdownRenderer content={chapter.content} />
      </div>

      {/* Navigation Buttons - Bottom */}
      <div className="flex justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          ← Previous
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
