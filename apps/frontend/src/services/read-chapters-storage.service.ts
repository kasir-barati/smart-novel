/**
 * Service for managing read chapters storage operations.
 * Extracted for better testability and separation of concerns.
 */

import { logger } from '../utils/logger';

export interface ReadChaptersStorage {
  getReadChapters(): Set<string>;
  saveReadChapters(chapters: Set<string>): void;
  clearReadChapters(): void;
  getSyncFlag(): boolean;
  setSyncFlag(value: boolean): void;
}

const STORAGE_KEY = 'smart-novel-read-chapters';
const SYNC_FLAG_KEY = 'smart-novel-chapters-synced';

/**
 * Default implementation using browser localStorage and sessionStorage.
 */
export class BrowserReadChaptersStorage implements ReadChaptersStorage {
  getReadChapters(): Set<string> {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return new Set();
    }

    try {
      const parsed = JSON.parse(stored) as string[];

      return new Set(parsed);
    } catch (error) {
      logger.error(
        'Failed to parse read chapters from localStorage',
        error,
      );

      return new Set();
    }
  }

  saveReadChapters(chapters: Set<string>): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...chapters]));
  }

  clearReadChapters(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  getSyncFlag(): boolean {
    return sessionStorage.getItem(SYNC_FLAG_KEY) === 'true';
  }

  setSyncFlag(value: boolean): void {
    if (value) {
      sessionStorage.setItem(SYNC_FLAG_KEY, 'true');
    } else {
      sessionStorage.removeItem(SYNC_FLAG_KEY);
    }
  }
}

/**
 * Default instance for use in hooks.
 */
export const readChaptersStorage = new BrowserReadChaptersStorage();
