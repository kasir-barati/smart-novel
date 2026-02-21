import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { NovelCard } from '../../components/NovelCard';
import { useApi } from '../../hooks/useApi';
import { CategoryFilter } from './CategoryFilter';
import {
  $searchState,
  searchNovels,
  toggleExcludeCategory,
  toggleIncludeCategory,
} from './search.store';

// Hard-coded available categories - in a real app, you'd fetch these from the backend
const AVAILABLE_CATEGORIES = [
  'Fantasy',
  'Romance',
  'Action',
  'Adventure',
  'Mystery',
  'Sci-Fi',
  'Horror',
  'Comedy',
  'Drama',
  'Thriller',
];

export function SearchPage() {
  const { api } = useApi();
  const state = useStore($searchState);
  const [searchParams] = useSearchParams();

  // Handle category from URL params (when clicking category button in NovelCard)
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      toggleIncludeCategory(categoryParam);
    }
  }, [searchParams]);

  const handleSearch = () => {
    searchNovels(api);
  };

  const handleToggleInclude = (category: string) => {
    toggleIncludeCategory(category);
  };

  const handleToggleExclude = (category: string) => {
    toggleExcludeCategory(category);
  };

  const novels = state.novels?.edges.map((edge) => edge.node) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
        Search Novels
      </h1>

      {/* Filter Section */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <CategoryFilter
          availableCategories={AVAILABLE_CATEGORIES}
          includeCategories={state.includeCategories}
          excludeCategories={state.excludeCategories}
          onToggleInclude={handleToggleInclude}
          onToggleExclude={handleToggleExclude}
        />

        {/* Search Button */}
        <div className="mt-6">
          <button
            onClick={handleSearch}
            disabled={state.loading}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state.loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {state.loading && !state.novels ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Searching...
            </p>
          </div>
        </div>
      ) : state.error ? (
        <div className="text-center text-red-600 dark:text-red-400">
          <p>{state.error}</p>
        </div>
      ) : state.novels ? (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Results ({novels.length})
          </h2>
          {novels.length === 0 ? (
            <div className="text-center text-gray-600 dark:text-gray-400">
              <p>No novels found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1">
              {novels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>Select categories and click "Search" to find novels.</p>
        </div>
      )}
    </div>
  );
}
