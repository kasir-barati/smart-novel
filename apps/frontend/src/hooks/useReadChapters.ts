import { useCallback, useState } from 'react';

const STORAGE_KEY = 'smart-novel-read-chapters';

function getInitialReadChapters(): Set<string> {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return new Set();
  }

  try {
    const parsed = JSON.parse(stored) as string[];

    return new Set(parsed);
  } catch (error) {
    console.error(
      'Failed to parse read chapters from localStorage',
      error,
    );

    return new Set();
  }
}

export function useReadChapters() {
  const [readChapters, setReadChapters] = useState<Set<string>>(() =>
    getInitialReadChapters(),
  );
  const markAsRead = useCallback((chapterId: string) => {
    setReadChapters((prev) => {
      const newSet = new Set(prev);
      newSet.add(chapterId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...newSet]));
      return newSet;
    });
  }, []);

  const isRead = useCallback(
    (chapterId: string) => {
      return readChapters.has(chapterId);
    },
    [readChapters],
  );

  return { markAsRead, isRead };
}
