import { useStore } from '@nanostores/react';
import { useEffect } from 'react';

import { NovelCard } from '../../components/NovelCard';
import { Pagination } from '../../components/Pagination';
import { useApi } from '../../hooks/useApi';
import {
  $novelsState,
  fetchNovels,
  goToNextPage,
  goToPage,
  goToPreviousPage,
} from './novels.store';

export function HomePage() {
  const { api } = useApi();
  const state = useStore($novelsState);

  useEffect(() => {
    fetchNovels(api, 20);
  }, [api]);

  const handlePageChange = (page: number) => {
    goToPage(api, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    goToNextPage(api);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    goToPreviousPage(api);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (state.loading && !state.novels) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading novels...
          </p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center text-red-600 dark:text-red-400">
          <p>{state.error}</p>
        </div>
      </div>
    );
  }

  const novels = state.novels?.edges.map((edge) => edge.node) ?? [];
  const pageInfo = state.novels?.pageInfo;

  // Estimate total pages (since we don't have total count from backend)
  // This is a simple estimation - in production you might want a better approach
  const estimatedTotalPages = pageInfo?.hasNextPage
    ? state.currentPage + 5
    : state.currentPage;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
        Discover Novels
      </h1>

      {novels.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>No novels found.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1">
            {novels.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>

          {pageInfo && (
            <div className="mt-8">
              <Pagination
                currentPage={state.currentPage}
                totalPages={estimatedTotalPages}
                hasNextPage={pageInfo.hasNextPage}
                hasPreviousPage={pageInfo.hasPreviousPage}
                onPageChange={handlePageChange}
                onNext={handleNext}
                onPrevious={handlePrevious}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
