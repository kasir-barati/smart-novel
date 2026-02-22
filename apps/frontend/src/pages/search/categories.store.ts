import { AxiosInstance } from 'axios';
import { atom } from 'nanostores';

export interface CategoriesState {
  categories: string[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  categories: [],
  loading: false,
  error: null,
};

export const $categoriesState = atom<CategoriesState>(initialState);

export const fetchCategories = async (axios: AxiosInstance) => {
  const state = $categoriesState.get();

  // Don't fetch if already loaded or currently loading
  if (state.categories.length > 0 || state.loading) {
    return;
  }

  $categoriesState.set({ ...state, loading: true, error: null });

  try {
    const response = await axios.post('/graphql', {
      query: `#graphql
        query GetCategories {
          categories
        }
      `,
    });

    const categories = response.data.data.categories;
    $categoriesState.set({
      categories,
      loading: false,
      error: null,
    });
  } catch (error) {
    $categoriesState.set({
      categories: [],
      loading: false,
      error: 'Failed to fetch categories',
    });
  }
};

export const resetCategoriesStore = () => {
  $categoriesState.set(initialState);
};
