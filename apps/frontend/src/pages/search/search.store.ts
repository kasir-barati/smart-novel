import { AxiosInstance } from 'axios';
import { atom } from 'nanostores';

import {
  NovelConnection,
  NovelFiltersInput,
} from '../../types/graphql.types';

export interface SearchState {
  novels: NovelConnection | null;
  loading: boolean;
  error: string | null;
  includeCategories: string[];
  excludeCategories: string[];
}

const initialState: SearchState = {
  novels: null,
  loading: false,
  error: null,
  includeCategories: [],
  excludeCategories: [],
};

export const $searchState = atom<SearchState>(initialState);

export const setIncludeCategories = (categories: string[]) => {
  $searchState.set({
    ...$searchState.get(),
    includeCategories: categories,
  });
};

export const setExcludeCategories = (categories: string[]) => {
  $searchState.set({
    ...$searchState.get(),
    excludeCategories: categories,
  });
};

export const toggleIncludeCategory = (category: string) => {
  const state = $searchState.get();
  const includes = state.includeCategories.includes(category);

  const newCategories = includes
    ? state.includeCategories.filter((c) => c !== category)
    : [...state.includeCategories, category];

  $searchState.set({ ...state, includeCategories: newCategories });
};

export const toggleExcludeCategory = (category: string) => {
  const state = $searchState.get();
  const includes = state.excludeCategories.includes(category);

  const newCategories = includes
    ? state.excludeCategories.filter((c) => c !== category)
    : [...state.excludeCategories, category];

  $searchState.set({ ...state, excludeCategories: newCategories });
};

export const searchNovels = async (axios: AxiosInstance) => {
  const state = $searchState.get();
  $searchState.set({ ...state, loading: true, error: null });

  const filters: NovelFiltersInput = {
    category: {
      ...(state.includeCategories.length > 0 && {
        in: state.includeCategories,
      }),
      ...(state.excludeCategories.length > 0 && {
        nin: state.excludeCategories,
      }),
    },
  };

  try {
    const response = await axios.post('/graphql', {
      query: `#graphql
        query SearchNovels($filters: NovelFiltersInput) {
          novels(first: 50, filters: $filters) {
            edges {
              cursor
              node {
                id
                name
                author
                category
                state
                coverUrl
                description
                lastChapterPublishedAt
              }
            }
            pageInfo {
              endCursor
              hasNextPage
              hasPreviousPage
              startCursor
            }
          }
        }
      `,
      variables: { filters },
    });

    const novelsData = response.data.data.novels;
    $searchState.set({
      ...$searchState.get(),
      novels: novelsData,
      loading: false,
    });
  } catch {
    $searchState.set({
      ...$searchState.get(),
      loading: false,
      error: 'Failed to search novels',
    });
  }
};

export const resetSearchStore = () => {
  $searchState.set(initialState);
};
