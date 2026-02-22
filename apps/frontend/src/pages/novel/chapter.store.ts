import { AxiosInstance } from 'axios';
import { atom } from 'nanostores';

import { Chapter } from '../../types/graphql.types';

export interface ChapterState {
  chapters: Map<string, Chapter>; // chapterId -> Chapter
  currentChapterId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ChapterState = {
  chapters: new Map(),
  currentChapterId: null,
  loading: false,
  error: null,
};

export const $chapterState = atom<ChapterState>(initialState);

export const fetchChapter = async (
  axios: AxiosInstance,
  novelId: string,
  chapterId: string,
) => {
  const state = $chapterState.get();

  // Check if chapter is already loaded
  if (state.chapters.has(chapterId)) {
    $chapterState.set({ ...state, currentChapterId: chapterId });
    return;
  }

  $chapterState.set({ ...state, loading: true, error: null });

  try {
    const response = await axios.post('/graphql', {
      query: `#graphql
        query GetChapter($novelId: ID!, $chapterId: ID!) {
          novel(id: $novelId) {
            chapter(id: $chapterId) {
              id
              novelId
              title
              content
              createdAt
              updatedAt
              next {
                id
              }
              previous {
                id
              }
            }
          }
        }
      `,
      variables: { novelId, chapterId },
    });

    const chapterData = response.data.data.novel.chapter;
    const newChapters = new Map(state.chapters);
    newChapters.set(chapterId, chapterData);

    $chapterState.set({
      ...$chapterState.get(),
      chapters: newChapters,
      currentChapterId: chapterId,
      loading: false,
    });
  } catch {
    $chapterState.set({
      ...$chapterState.get(),
      loading: false,
      error: 'Failed to fetch chapter',
    });
  }
};

export const setCurrentChapter = (chapterId: string | null) => {
  $chapterState.set({
    ...$chapterState.get(),
    currentChapterId: chapterId,
  });
};

export const resetChapterStore = () => {
  $chapterState.set(initialState);
};
