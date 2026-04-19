import { logger } from '../utils/logger';
import { BrowserReadChaptersStorage } from './read-chapters-storage.service';

vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('BrowserReadChaptersStorage', () => {
  let uut: BrowserReadChaptersStorage;
  let localStorageMock: Record<string, string>;
  let sessionStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    sessionStorageMock = {};

    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    });

    // Mock sessionStorage
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(
        (key: string) => sessionStorageMock[key] ?? null,
      ),
      setItem: vi.fn((key: string, value: string) => {
        sessionStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete sessionStorageMock[key];
      }),
      clear: vi.fn(() => {
        sessionStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    });

    uut = new BrowserReadChaptersStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getReadChapters', () => {
    it('should return empty Set when localStorage is empty', () => {
      const result = uut.getReadChapters();

      expect(result).toEqual(new Set());
    });

    it('should return chapters from valid localStorage data', () => {
      localStorageMock['smart-novel-read-chapters'] = JSON.stringify([
        'chapter-1',
        'chapter-2',
      ]);

      const result = uut.getReadChapters();

      expect(result).toEqual(new Set(['chapter-1', 'chapter-2']));
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock['smart-novel-read-chapters'] =
        'invalid-json-data';

      const result = uut.getReadChapters();

      expect(result).toEqual(new Set());
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to parse read chapters from localStorage',
        expect.any(Error),
      );
    });

    it('should handle non-array localStorage data', () => {
      localStorageMock['smart-novel-read-chapters'] = JSON.stringify({
        invalid: 'data',
      });

      const result = uut.getReadChapters();

      expect(result).toEqual(new Set());
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to parse read chapters from localStorage',
        expect.any(Error),
      );
    });
  });

  describe('saveReadChapters', () => {
    it('should save chapters to localStorage', () => {
      const chapters = new Set(['chapter-1', 'chapter-2']);

      uut.saveReadChapters(chapters);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'smart-novel-read-chapters',
        JSON.stringify(['chapter-1', 'chapter-2']),
      );
    });

    it('should save empty Set to localStorage', () => {
      const chapters = new Set<string>();

      uut.saveReadChapters(chapters);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'smart-novel-read-chapters',
        JSON.stringify([]),
      );
    });

    it('should handle large chapter sets', () => {
      const chapters = new Set(
        Array.from({ length: 1000 }, (_, i) => `chapter-${i}`),
      );

      uut.saveReadChapters(chapters);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'smart-novel-read-chapters',
        expect.any(String),
      );
    });
  });

  describe('clearReadChapters', () => {
    it('should remove chapters from localStorage', () => {
      localStorageMock['smart-novel-read-chapters'] = JSON.stringify([
        'chapter-1',
      ]);

      uut.clearReadChapters();

      expect(localStorage.removeItem).toHaveBeenCalledWith(
        'smart-novel-read-chapters',
      );
    });
  });

  describe('getSyncFlag', () => {
    it('should return false when sync flag is not set', () => {
      const result = uut.getSyncFlag();

      expect(result).toBe(false);
    });

    it('should return true when sync flag is set', () => {
      sessionStorageMock['smart-novel-chapters-synced'] = 'true';

      const result = uut.getSyncFlag();

      expect(result).toBe(true);
    });

    it('should return false when sync flag has non-true value', () => {
      sessionStorageMock['smart-novel-chapters-synced'] = 'false';

      const result = uut.getSyncFlag();

      expect(result).toBe(false);
    });
  });

  describe('setSyncFlag', () => {
    it('should set sync flag in sessionStorage when value is true', () => {
      uut.setSyncFlag(true);

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'smart-novel-chapters-synced',
        'true',
      );
    });

    it('should remove sync flag from sessionStorage when value is false', () => {
      sessionStorageMock['smart-novel-chapters-synced'] = 'true';

      uut.setSyncFlag(false);

      expect(sessionStorage.removeItem).toHaveBeenCalledWith(
        'smart-novel-chapters-synced',
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should save and retrieve chapters correctly', () => {
      const chapters = new Set([
        '93fec4bf-2f66-4e4a-9572-7aa4871f1458',
        'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      ]);

      uut.saveReadChapters(chapters);

      const retrieved = uut.getReadChapters();

      expect(retrieved).toEqual(chapters);
    });

    it('should handle sync flag lifecycle', () => {
      expect(uut.getSyncFlag()).toBe(false);

      uut.setSyncFlag(true);
      expect(uut.getSyncFlag()).toBe(true);

      uut.setSyncFlag(false);
      expect(uut.getSyncFlag()).toBe(false);
    });

    it('should handle clear after save', () => {
      const chapters = new Set(['chapter-1', 'chapter-2']);

      uut.saveReadChapters(chapters);
      uut.clearReadChapters();

      const retrieved = uut.getReadChapters();

      expect(retrieved).toEqual(new Set());
    });
  });
});
