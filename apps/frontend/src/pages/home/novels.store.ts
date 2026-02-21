import { AxiosInstance } from 'axios';
import { atom } from 'nanostores';

import {
  NovelConnection,
  NovelFiltersInput,
} from '../../types/graphql.types';

export interface NovelsState {
  novels: NovelConnection | null;
  loading: boolean;
  error: string | null;
  // Store cursors for each page for navigation
  pageCursors: Map<number, string | null>;
  currentPage: number;
}

const initialState: NovelsState = {
  novels: null,
  loading: false,
  error: null,
  pageCursors: new Map([[1, null]]), // Page 1 starts with null cursor
  currentPage: 1,
};

export const $novelsState = atom<NovelsState>(initialState);

export const fetchNovels = async (
  axios: AxiosInstance,
  first = 20,
  after?: string | null,
  filters?: NovelFiltersInput,
) => {
  $novelsState.set({
    ...$novelsState.get(),
    loading: true,
    error: null,
  });

  try {
    const response = await axios.post('/graphql', {
      query: `#graphql
        query GetNovels($first: Int, $after: String, $filters: NovelFiltersInput) {
          novels(first: $first, after: $after, filters: $filters) {
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
      variables: { first, after, filters },
    });

    const novelsData = response.data.data.novels;
    $novelsState.set({
      ...$novelsState.get(),
      novels: novelsData,
      loading: false,
    });
  } catch (error) {
    $novelsState.set({
      ...$novelsState.get(),
      loading: false,
      error: 'Failed to fetch novels',
    });
  }
};

export const goToPage = async (
  axios: AxiosInstance,
  page: number,
) => {
  const state = $novelsState.get();
  const cursor = state.pageCursors.get(page) ?? null;

  await fetchNovels(axios, 20, cursor);

  $novelsState.set({
    ...$novelsState.get(),
    currentPage: page,
  });
};

export const goToNextPage = async (axios: AxiosInstance) => {
  const state = $novelsState.get();
  if (!state.novels?.pageInfo.hasNextPage) return;

  const nextPage = state.currentPage + 1;
  const newCursors = new Map(state.pageCursors);
  newCursors.set(nextPage, state.novels.pageInfo.endCursor);

  $novelsState.set({
    ...state,
    pageCursors: newCursors,
  });

  await goToPage(axios, nextPage);
};

export const goToPreviousPage = async (axios: AxiosInstance) => {
  const state = $novelsState.get();
  if (state.currentPage <= 1) return;

  const previousPage = state.currentPage - 1;
  await goToPage(axios, previousPage);
};

export const resetNovelsStore = () => {
  $novelsState.set(initialState);
};
