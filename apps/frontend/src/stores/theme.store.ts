import { atom } from 'nanostores';

export type Theme = 'light' | 'dark';

// Initialize from localStorage or default to light
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme') as Theme | null;
  return stored || 'light';
};

export const $theme = atom<Theme>(getInitialTheme());

export const toggleTheme = () => {
  const currentTheme = $theme.get();
  const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
  $theme.set(newTheme);
  localStorage.setItem('theme', newTheme);

  // Update document class for Tailwind dark mode
  if (typeof window !== 'undefined') {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

// Apply theme on initialization
if (typeof window !== 'undefined') {
  const theme = getInitialTheme();
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
