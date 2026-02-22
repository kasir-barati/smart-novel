import { AxiosInstance } from 'axios';
import { atom } from 'nanostores';

import { Novel } from '../../types/graphql.types';

export interface NovelState {
  novel: Novel | null;
  loading: boolean;
  error: string | null;
}

const initialState: NovelState = {
  novel: null,
  loading: false,
  error: null,
};

export const $novelState = atom<NovelState>(initialState);

export const fetchNovel = async (
  axios: AxiosInstance,
  id: string,
) => {
  $novelState.set({
    ...$novelState.get(),
    loading: true,
    error: null,
  });

  try {
    const response = await axios.post('/graphql', {
      query: `#graphql
        query GetNovel($id: ID!) {
          novel(id: $id) {
            id
            name
            author
            category
            chapters
            state
            coverUrl
            description
            firstChapter {
              id
            }
            lastPublishedChapter {
              id
            }
          }
        }
      `,
      variables: { id },
    });
    const novelData = response.data.data.novel;

    $novelState.set({
      ...$novelState.get(),
      novel: novelData,
      loading: false,
    });
  } catch {
    $novelState.set({
      ...$novelState.get(),
      loading: false,
      error: 'Failed to fetch novel',
    });
  }
};

export const resetNovelStore = () => {
  $novelState.set(initialState);
};
