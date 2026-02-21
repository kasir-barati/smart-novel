import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'smart-novel-read-chapters';

export function useReadChapters() {
  const [readChapters, setReadChapters] = useState<Set<string>>(
    new Set(),
  );

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[];
        setReadChapters(new Set(parsed));
      } catch (error) {
        console.error(
          'Failed to parse read chapters from localStorage',
          error,
        );
      }
    }
  }, []);

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
