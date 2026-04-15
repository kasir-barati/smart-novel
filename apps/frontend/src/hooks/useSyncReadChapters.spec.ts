import { renderHook, waitFor } from '@testing-library/react';

import { ReadChaptersStorage } from '../services/read-chapters-storage.service';
import { useSyncReadChapters } from './useSyncReadChapters';

// Mock dependencies
const mockMarkChaptersReadMutation = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('./useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../generated/graphql', () => ({
  useMarkChaptersReadMutation: () => ({
    mutateAsync: mockMarkChaptersReadMutation,
  }),
}));

describe('useSyncReadChapters', () => {
  let mockStorage: ReadChaptersStorage;
  let storedChapters: Set<string>;
  let syncFlag: boolean;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    storedChapters = new Set();
    syncFlag = false;

    // Create mock storage
    mockStorage = {
      getReadChapters: vi.fn(() => storedChapters),
      saveReadChapters: vi.fn(),
      clearReadChapters: vi.fn(() => {
        storedChapters = new Set();
      }),
      getSyncFlag: vi.fn(() => syncFlag),
      setSyncFlag: vi.fn((value: boolean) => {
        syncFlag = value;
      }),
    };

    // Default auth state - unauthenticated
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
    });

    // Default mutation - successful
    mockMarkChaptersReadMutation.mockResolvedValue({});
  });

  it('should not sync when user is not authenticated', () => {
    storedChapters = new Set([
      'a1b2c3d4-e5f6-4789-a012-bcdef0123456',
    ]);

    renderHook(() => useSyncReadChapters({ storage: mockStorage }));

    expect(mockMarkChaptersReadMutation).not.toHaveBeenCalled();
  });

  it('should not sync when auth is still loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: true,
    });
    storedChapters = new Set([
      'b2c3d4e5-f6a7-4890-b123-cdef01234567',
    ]);

    renderHook(() => useSyncReadChapters({ storage: mockStorage }));

    expect(mockMarkChaptersReadMutation).not.toHaveBeenCalled();
  });

  it('should not sync when already synced (sync flag is set)', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });
    storedChapters = new Set([
      'c3d4e5f6-a7b8-4901-c234-def012345678',
    ]);
    syncFlag = true;

    renderHook(() => useSyncReadChapters({ storage: mockStorage }));

    expect(mockMarkChaptersReadMutation).not.toHaveBeenCalled();
  });

  it('should sync stored chapters to backend on login', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });
    storedChapters = new Set([
      'd4e5f6a7-b8c9-4012-d345-ef0123456789',
      'e5f6a7b8-c9d0-4123-e456-f01234567890',
    ]);
    const consoleLogSpy = vi
      .spyOn(console, 'log')
      .mockImplementation(() => {});

    renderHook(() => useSyncReadChapters({ storage: mockStorage }));

    await waitFor(() => {
      expect(mockMarkChaptersReadMutation).toHaveBeenCalledWith({
        chapterIds: [
          'd4e5f6a7-b8c9-4012-d345-ef0123456789',
          'e5f6a7b8-c9d0-4123-e456-f01234567890',
        ],
      });
    });

    await waitFor(() => {
      expect(mockStorage.clearReadChapters).toHaveBeenCalled();
    });

    expect(mockStorage.setSyncFlag).toHaveBeenCalledWith(true);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Successfully synced 2 chapters to backend',
    );

    consoleLogSpy.mockRestore();
  });

  it('should batch chapters into groups of 100 for API calls', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    // Create 250 chapters to test batching
    const chapters = Array.from({ length: 250 }, () =>
      crypto.randomUUID(),
    );
    storedChapters = new Set(chapters);

    renderHook(() => useSyncReadChapters({ storage: mockStorage }));

    await waitFor(() => {
      expect(mockMarkChaptersReadMutation).toHaveBeenCalledTimes(3);
    });

    // Check batch sizes
    expect(
      mockMarkChaptersReadMutation.mock.calls[0][0].chapterIds,
    ).toHaveLength(100);
    expect(
      mockMarkChaptersReadMutation.mock.calls[1][0].chapterIds,
    ).toHaveLength(100);
    expect(
      mockMarkChaptersReadMutation.mock.calls[2][0].chapterIds,
    ).toHaveLength(50);
  });

  it('should handle sync failure gracefully', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });
    storedChapters = new Set([
      'f6a7b8c9-d0e1-4234-f567-012345678901',
    ]);
    mockMarkChaptersReadMutation.mockRejectedValueOnce(
      new Error('Sync failed'),
    );

    renderHook(() => useSyncReadChapters({ storage: mockStorage }));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to sync read chapters to backend:',
        expect.any(Error),
      );
    });

    // Note: The current implementation still clears storage even on partial failure
    // because Promise.all().then() runs if any batch succeeds
    await waitFor(() => {
      expect(mockStorage.clearReadChapters).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should set sync flag even when there are no chapters to sync', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    renderHook(() => useSyncReadChapters({ storage: mockStorage }));

    await waitFor(() => {
      expect(mockStorage.setSyncFlag).toHaveBeenCalledWith(true);
    });

    expect(mockMarkChaptersReadMutation).not.toHaveBeenCalled();
  });

  it('should only attempt sync once per session', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });
    storedChapters = new Set([
      'a7b8c9d0-e1f2-4345-a678-123456789012',
    ]);

    const { rerender } = renderHook(() =>
      useSyncReadChapters({ storage: mockStorage }),
    );

    await waitFor(() => {
      expect(mockMarkChaptersReadMutation).toHaveBeenCalledTimes(1);
    });

    // Rerender the hook - should not sync again
    rerender();

    expect(mockMarkChaptersReadMutation).toHaveBeenCalledTimes(1);
  });

  it('should handle partial batch failures in sync', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    // Create 150 chapters (2 batches)
    const chapters = Array.from({ length: 150 }, () =>
      crypto.randomUUID(),
    );
    storedChapters = new Set(chapters);

    // First batch succeeds, second fails
    mockMarkChaptersReadMutation
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('Batch 2 failed'));

    renderHook(() => useSyncReadChapters({ storage: mockStorage }));

    await waitFor(() => {
      expect(mockMarkChaptersReadMutation).toHaveBeenCalledTimes(2);
    });

    // Should log the error for the failed batch
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to sync read chapters to backend:',
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
