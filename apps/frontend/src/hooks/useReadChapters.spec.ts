import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';

import { ReadChaptersStorage } from '../services/read-chapters-storage.service';
import { logger } from '../utils/logger';
import { useReadChapters } from './useReadChapters';

// Mock dependencies
const mockMarkChaptersReadMutation = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));
vi.mock('./useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));
vi.mock('../generated/graphql', () => ({
  useMarkChaptersReadMutation: () => ({
    mutateAsync: mockMarkChaptersReadMutation,
  }),
}));
vi.mock('./useSyncReadChapters', () => ({
  useSyncReadChapters: vi.fn(),
}));

describe('useReadChapters', () => {
  let mockStorage: ReadChaptersStorage;
  let storedChapters: Set<string>;
  let syncFlag: boolean;

  beforeEach(() => {
    vi.clearAllMocks();
    storedChapters = new Set();
    syncFlag = false;
    mockStorage = {
      getReadChapters: vi.fn(() => storedChapters),
      saveReadChapters: vi.fn((chapters: Set<string>) => {
        storedChapters = new Set(chapters);
      }),
      clearReadChapters: vi.fn(() => {
        storedChapters = new Set();
      }),
      getSyncFlag: vi.fn(() => syncFlag),
      setSyncFlag: vi.fn((value: boolean) => {
        syncFlag = value;
      }),
    };
    mockUseAuth.mockReturnValue({
      isAuthenticated: false, // <== unauthenticated
      loading: false,
    });
    mockMarkChaptersReadMutation.mockResolvedValue({});
  });

  describe('Initial State & Storage Parsing', () => {
    it('should initialize with empty set when storage is empty', () => {
      const { result } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      expect(
        result.current.isRead('8b300adc-f911-4f20-9989-c582d7fa8b7e'),
      ).toBeFalse();
      expect(mockStorage.getReadChapters).toHaveBeenCalled();
    });

    it('should load chapters from storage', () => {
      storedChapters = new Set([
        '80bfcc3b-447c-4f3d-b8d3-c440ff62a32a',
        '023212e1-554c-4e1d-9c69-31959f657b5e',
      ]);

      const { result } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      expect(
        result.current.isRead('80bfcc3b-447c-4f3d-b8d3-c440ff62a32a'),
      ).toBeTrue();
      expect(
        result.current.isRead('023212e1-554c-4e1d-9c69-31959f657b5e'),
      ).toBeTrue();
      expect(
        result.current.isRead('7a9e99ad-7395-4d23-abbf-9aabe28b0a85'),
      ).toBeFalse();
    });
  });

  describe('markAsRead - Unauthenticated User', () => {
    it('should store chapter in storage when user is not authenticated', () => {
      const { result } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      act(() => {
        result.current.markAsRead(
          '2e10f234-fedd-4383-9438-a581bda956b6',
        );
      });

      expect(
        result.current.isRead('2e10f234-fedd-4383-9438-a581bda956b6'),
      ).toBeTrue();
      expect(mockStorage.saveReadChapters).toHaveBeenCalledWith(
        new Set(['2e10f234-fedd-4383-9438-a581bda956b6']),
      );
      expect(mockMarkChaptersReadMutation).not.toHaveBeenCalled();
    });

    it('should store multiple chapters in storage', () => {
      const { result } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      act(() => {
        result.current.markAsRead(
          '2bd98371-09ac-435a-8133-94b915d7127b',
        );
      });

      act(() => {
        result.current.markAsRead(
          'abada273-bf34-4276-8ebd-ba59c7dccc88',
        );
      });

      expect(
        result.current.isRead('2bd98371-09ac-435a-8133-94b915d7127b'),
      ).toBeTrue();
      expect(
        result.current.isRead('abada273-bf34-4276-8ebd-ba59c7dccc88'),
      ).toBeTrue();
      expect(mockStorage.saveReadChapters).toHaveBeenLastCalledWith(
        new Set([
          '2bd98371-09ac-435a-8133-94b915d7127b',
          'abada273-bf34-4276-8ebd-ba59c7dccc88',
        ]),
      );
    });

    it('should not duplicate chapters when marking same chapter twice', () => {
      const { result } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      act(() => {
        result.current.markAsRead(
          '494b0d31-99e8-4ed6-adb2-9ea7602ebe0c',
        );
      });

      act(() => {
        result.current.markAsRead(
          '494b0d31-99e8-4ed6-adb2-9ea7602ebe0c',
        );
      });

      expect(
        result.current.isRead('494b0d31-99e8-4ed6-adb2-9ea7602ebe0c'),
      ).toBeTrue();
      expect(mockStorage.saveReadChapters).toHaveBeenLastCalledWith(
        new Set(['494b0d31-99e8-4ed6-adb2-9ea7602ebe0c']),
      );
    });

    it('should store when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: true,
      });

      const { result } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      act(() => {
        result.current.markAsRead(
          '4f9d528a-ae9d-4795-ac45-47ca057401ec',
        );
      });

      expect(
        result.current.isRead('4f9d528a-ae9d-4795-ac45-47ca057401ec'),
      ).toBeTrue();
      expect(mockStorage.saveReadChapters).toHaveBeenCalled();
    });
  });

  describe('markAsRead - Authenticated User', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
      });
      syncFlag = true;
    });

    it('should call backend mutation when user is authenticated', async () => {
      const { result } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      await act(async () => {
        result.current.markAsRead(
          'e04f583f-087c-46df-9c26-cbda1b8bf845',
        );
      });

      await waitFor(() => {
        expect(mockMarkChaptersReadMutation).toHaveBeenCalledWith({
          chapterIds: ['e04f583f-087c-46df-9c26-cbda1b8bf845'],
        });
      });

      expect(
        result.current.isRead('e04f583f-087c-46df-9c26-cbda1b8bf845'),
      ).toBeTrue();
    });

    it('should not store in storage on successful backend call', async () => {
      const { result } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      await act(async () => {
        result.current.markAsRead(
          '7400b515-e5a4-4312-af4d-7cd8d7384d0b',
        );
      });

      await waitFor(() => {
        expect(mockMarkChaptersReadMutation).toHaveBeenCalled();
      });

      // Storage should not be called for successful backend sync
      expect(mockStorage.saveReadChapters).not.toHaveBeenCalled();
    });

    it('should fallback to storage when backend mutation fails', async () => {
      mockMarkChaptersReadMutation.mockRejectedValueOnce(
        new Error('Network error'),
      );

      const { result } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      await act(async () => {
        result.current.markAsRead(
          '91545bea-e935-4c39-8491-ad9f2e1bf125',
        );
      });

      await waitFor(() => {
        expect(mockStorage.saveReadChapters).toHaveBeenCalledWith(
          new Set(['91545bea-e935-4c39-8491-ad9f2e1bf125']),
        );
      });

      expect(
        result.current.isRead('91545bea-e935-4c39-8491-ad9f2e1bf125'),
      ).toBeTrue();
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to mark chapter as read on backend:',
        expect.any(Error),
      );
    });

    it('should handle multiple chapters with authenticated user', async () => {
      const { result } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      await act(async () => {
        result.current.markAsRead(
          '42784417-a7c7-40bd-939e-a662328cf3b2',
        );
      });

      await act(async () => {
        result.current.markAsRead(
          '3f0fccdd-a156-4017-a29a-0b6d1b20b36c',
        );
      });

      await waitFor(() => {
        expect(mockMarkChaptersReadMutation).toHaveBeenCalledTimes(2);
      });

      expect(mockMarkChaptersReadMutation).toHaveBeenNthCalledWith(
        1,
        {
          chapterIds: ['42784417-a7c7-40bd-939e-a662328cf3b2'],
        },
      );
      expect(mockMarkChaptersReadMutation).toHaveBeenNthCalledWith(
        2,
        {
          chapterIds: ['3f0fccdd-a156-4017-a29a-0b6d1b20b36c'],
        },
      );
    });
  });

  describe('isRead Function', () => {
    it('should return false for unread chapters', () => {
      const { result } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      expect(
        result.current.isRead('fb342336-c5fc-43a1-a113-d1616ac1599a'),
      ).toBeFalse();
    });

    it('should return true for read chapters', () => {
      const { result } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      act(() => {
        result.current.markAsRead(
          '5220f411-ca38-412d-9644-e77e6e3ef62a',
        );
      });

      expect(
        result.current.isRead('5220f411-ca38-412d-9644-e77e6e3ef62a'),
      ).toBeTrue();
    });

    it('should update when new chapters are marked as read', () => {
      const { result } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      expect(
        result.current.isRead('eb953919-8524-493b-807c-c4ca64a76f57'),
      ).toBeFalse();

      act(() => {
        result.current.markAsRead(
          'eb953919-8524-493b-807c-c4ca64a76f57',
        );
      });

      expect(
        result.current.isRead('eb953919-8524-493b-807c-c4ca64a76f57'),
      ).toBeTrue();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive markAsRead calls', () => {
      const { result } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      act(() => {
        result.current.markAsRead(
          'a05bd877-bc0f-4571-b260-b5e0252d933a',
        );
        result.current.markAsRead(
          'dadfa22c-d69d-4006-85c5-88d621798fe7',
        );
        result.current.markAsRead(
          '74b98b99-0172-430e-a610-6c20c1745cb9',
        );
      });

      expect(
        result.current.isRead('a05bd877-bc0f-4571-b260-b5e0252d933a'),
      ).toBeTrue();
      expect(
        result.current.isRead('dadfa22c-d69d-4006-85c5-88d621798fe7'),
      ).toBeTrue();
      expect(
        result.current.isRead('74b98b99-0172-430e-a610-6c20c1745cb9'),
      ).toBeTrue();
    });

    it('should maintain state consistency across re-renders', () => {
      const { result, rerender } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      act(() => {
        result.current.markAsRead(
          '5ead48f9-587f-4b22-acec-e819ff117c01',
        );
      });

      expect(
        result.current.isRead('5ead48f9-587f-4b22-acec-e819ff117c01'),
      ).toBeTrue();

      rerender();

      expect(
        result.current.isRead('5ead48f9-587f-4b22-acec-e819ff117c01'),
      ).toBeTrue();
    });

    it('should handle transition from unauthenticated to authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false,
      });

      const { result, rerender } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      // Mark as read while unauthenticated
      act(() => {
        result.current.markAsRead(
          '99cbf498-8ea7-439e-813f-d92836f26f13',
        );
      });

      expect(mockStorage.saveReadChapters).toHaveBeenCalled();

      // User logs in
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
      });

      rerender();

      // Now marking should use backend
      await act(async () => {
        result.current.markAsRead(
          '7491bfa5-3e65-431d-ad00-b75663d532e0',
        );
      });

      await waitFor(() => {
        expect(mockMarkChaptersReadMutation).toHaveBeenCalled();
      });
    });

    it('should handle empty string chapter IDs', () => {
      const { result } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      act(() => {
        result.current.markAsRead('');
      });

      expect(result.current.isRead('')).toBeTrue();
    });

    it('should handle very long chapter IDs', () => {
      const longId = 'chapter-' + 'x'.repeat(1000);
      const { result } = renderHook(() =>
        useReadChapters({ storage: mockStorage }),
      );

      act(() => {
        result.current.markAsRead(longId);
      });

      expect(result.current.isRead(longId)).toBeTrue();
    });
  });

  describe('Dependency Injection', () => {
    it('should use provided storage implementation', () => {
      const customStorage: ReadChaptersStorage = {
        getReadChapters: vi.fn(() => new Set(['custom-chapter'])),
        saveReadChapters: vi.fn(),
        clearReadChapters: vi.fn(),
        getSyncFlag: vi.fn(() => false),
        setSyncFlag: vi.fn(),
      };

      const { result } = renderHook(() =>
        useReadChapters({ storage: customStorage }),
      );

      expect(result.current.isRead('custom-chapter')).toBeTrue();
      expect(customStorage.getReadChapters).toHaveBeenCalled();
    });
  });
});
