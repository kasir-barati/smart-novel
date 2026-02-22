import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { ThemeToggle } from '../../components/ThemeToggle';
import { useApi } from '../../hooks/useApi';
import { useReadChapters } from '../../hooks/useReadChapters';
import { Breadcrumbs } from './Breadcrumbs';
import { $chapterState, fetchChapter } from './chapter.store';
import { ChapterContent } from './ChapterContent';
import { ChapterList } from './ChapterList';
import { $novelState, fetchNovel } from './novel.store';

export function NovelPage() {
  const { id } = useParams<{ id: string }>();
  const { api } = useApi();
  const novelState = useStore($novelState);
  const chapterState = useStore($chapterState);
  const { markAsRead } = useReadChapters();
  const [showChapterList, setShowChapterList] = useState(true);

  useEffect(() => {
    if (id) {
      fetchNovel(api, id);
    }
  }, [id, api]);

  useEffect(() => {
    if (chapterState.currentChapterId) {
      markAsRead(chapterState.currentChapterId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [chapterState.currentChapterId, markAsRead]);

  const handleChapterClick = (chapterId: string) => {
    setShowChapterList(false);
    if (id) {
      fetchChapter(api, id, chapterId);
    }
  };

  const handleReadFirstChapter = () => {
    if (novelState.novel?.firstChapter?.id) {
      handleChapterClick(novelState.novel.firstChapter.id);
    }
  };

  const handleReadLatestChapter = () => {
    if (novelState.novel?.lastPublishedChapter?.id) {
      handleChapterClick(novelState.novel.lastPublishedChapter.id);
    }
  };

  const handlePreviousChapter = () => {
    const currentChapter = chapterState.currentChapterId
      ? chapterState.chapters.get(chapterState.currentChapterId)
      : undefined;
    if (currentChapter?.previous?.id && id) {
      fetchChapter(api, id, currentChapter.previous.id);
    }
  };

  const handleNextChapter = () => {
    const currentChapter = chapterState.currentChapterId
      ? chapterState.chapters.get(chapterState.currentChapterId)
      : undefined;
    if (currentChapter?.next?.id && id) {
      fetchChapter(api, id, currentChapter.next.id);
    }
  };

  if (novelState.loading && !novelState.novel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading novel...
          </p>
        </div>
      </div>
    );
  }

  if (novelState.error || !novelState.novel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-red-600 dark:text-red-400">
          <p>{novelState.error || 'Novel not found'}</p>
        </div>
      </div>
    );
  }

  const novel = novelState.novel;
  const hasChapters = novel.chapters.length > 0;
  const currentChapter = chapterState.currentChapterId
    ? chapterState.chapters.get(chapterState.currentChapterId)
    : undefined;

  // Prepare chapter info for ChapterList
  const chaptersInfo = novel.chapters.map((chId) => ({
    id: chId,
    title: null, // We don't have titles in the list, only when fetched individually
    createdAt: new Date().toISOString(), // Placeholder
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Theme Toggle - Fixed top-right */}
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs
          novelName={novel.name}
          chapterTitle={currentChapter?.title}
        />

        {showChapterList ? (
          <>
            {/* Novel Header */}
            <div className="mb-8 flex flex-col gap-6 md:flex-row">
              {/* Cover Image */}
              {novel.coverUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={novel.coverUrl}
                    alt={novel.name}
                    className="h-64 w-48 rounded-lg object-cover shadow-lg"
                  />
                </div>
              )}

              {/* Novel Info */}
              <div className="flex-1">
                <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {novel.name}
                </h1>
                <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">
                  By {novel.author}
                </p>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  {novel.description}
                </p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {novel.category.map((cat) => (
                    <span
                      key={cat}
                      className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Read Buttons */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleReadFirstChapter}
                    disabled={!hasChapters}
                    className="cursor-pointer rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
                  >
                    Read First Chapter
                  </button>
                  <button
                    onClick={handleReadLatestChapter}
                    disabled={!hasChapters}
                    className="cursor-pointer rounded-lg border border-blue-600 px-6 py-3 font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:disabled:hover:bg-transparent"
                  >
                    Read Latest Chapter
                  </button>
                </div>
              </div>
            </div>

            {/* Chapters Tab */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                Chapters ({novel.chapters.length})
              </h2>
              <ChapterList
                chapters={chaptersInfo}
                onChapterClick={handleChapterClick}
                currentChapterId={chapterState.currentChapterId}
              />
            </div>
          </>
        ) : currentChapter ? (
          <>
            {/* Back Button */}
            <button
              onClick={() => setShowChapterList(true)}
              className="cursor-pointer mb-4 text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to Novel
            </button>

            {/* Chapter Content */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              {chapterState.loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Loading chapter...
                    </p>
                  </div>
                </div>
              ) : (
                <ChapterContent
                  chapter={currentChapter}
                  onPrevious={handlePreviousChapter}
                  onNext={handleNextChapter}
                  hasPrevious={!!currentChapter.previous}
                  hasNext={!!currentChapter.next}
                />
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
