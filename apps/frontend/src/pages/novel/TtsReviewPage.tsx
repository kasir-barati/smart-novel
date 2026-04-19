import { EditorView } from '@codemirror/view';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import CodeMirrorMerge from 'react-codemirror-merge';
import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import {
  useGenerateTtsFriendlyTextMutation,
  useGetChapterForTtsReviewQuery,
  useGetChapterQuery,
  useUpdateContentMutation,
} from '../../generated/graphql';
import { useTheme } from '../../hooks/useTheme';
import { showApiError, showSuccess } from '../../utils/notification';

interface TtsReviewState {
  originalContent: string;
  oldTtsContent: string;
  newTtsContent: string;
}

const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 24;
const FONT_SIZE_STEP = 2;
const DEFAULT_FONT_SIZE = 14;

export function TtsReviewPage() {
  const { id: novelId, chapterId } = useParams<{
    id: string;
    chapterId: string;
  }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const editedContentRef = useRef<string>('');
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [contentState, setContentState] =
    useState<TtsReviewState | null>(null);
  const queryClient = useQueryClient();
  const returnUrl =
    searchParams.get('returnUrl') || `/novel/${novelId}`;

  // 1. Fetch chapter content
  const {
    data: chapterData,
    isLoading: chapterLoading,
    error: chapterError,
  } = useGetChapterForTtsReviewQuery(
    { novelId: novelId ?? '', chapterId: chapterId ?? '' },
    { enabled: !!novelId && !!chapterId },
  );

  // 2. Generate TTS-friendly text from chapter content
  const generateTtsMutation = useGenerateTtsFriendlyTextMutation();
  const generateTtsMutateRef = useRef(generateTtsMutation.mutate);

  useEffect(() => {
    generateTtsMutateRef.current = generateTtsMutation.mutate;
  }, [generateTtsMutation.mutate]);

  // 3. Update chapter content
  const updateContentMutation = useUpdateContentMutation();

  // Once chapter data loads, generate TTS text
  useEffect(() => {
    if (!chapterData?.novel?.chapter) {
      return;
    }

    const chapter = chapterData.novel.chapter;

    generateTtsMutateRef.current(
      { text: chapter.content },
      {
        onSuccess: (data) => {
          const generatedTts = data.generateTtsFriendlyText;
          editedContentRef.current = generatedTts;
          setContentState({
            originalContent: chapter.content,
            oldTtsContent: chapter.ttsFriendlyContent ?? '',
            newTtsContent: generatedTts,
          });
        },
      },
    );
  }, [chapterData]);

  const fontSizeTheme = useMemo(
    () =>
      EditorView.theme({
        '.cm-content': { fontSize: `${fontSize}px` },
        '.cm-gutters': { fontSize: `${fontSize}px` },
      }),
    [fontSize],
  );

  const increaseFontSize = () => {
    setFontSize((prev) =>
      Math.min(prev + FONT_SIZE_STEP, MAX_FONT_SIZE),
    );
  };

  const decreaseFontSize = () => {
    setFontSize((prev) =>
      Math.max(prev - FONT_SIZE_STEP, MIN_FONT_SIZE),
    );
  };

  const handleModifiedChange = useCallback((value: string) => {
    editedContentRef.current = value;
  }, []);

  const handleConfirm = () => {
    if (!chapterId || !contentState) return;

    updateContentMutation.mutate(
      {
        id: chapterId,
        content: contentState.originalContent,
        ttsFriendlyContent: editedContentRef.current,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: useGetChapterQuery.getKey({
              novelId: novelId ?? '',
              chapterId: chapterId ?? '',
            }),
          });
          showSuccess('TTS-friendly content updated successfully');
          navigate(returnUrl);
        },
        onError: () => {
          showApiError();
        },
      },
    );
  };

  const handleCancel = () => {
    navigate(returnUrl);
  };

  const isLoading = chapterLoading || generateTtsMutation.isPending;
  const hasError = chapterError || generateTtsMutation.isError;
  const isSaving = updateContentMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Generating TTS-friendly content...
          </p>
        </div>
      </div>
    );
  }

  if (hasError || !contentState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="mb-4 text-red-600 dark:text-red-400">
            Failed to generate TTS-friendly content
          </p>
          <button
            onClick={handleCancel}
            className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            ← Back to Novel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              TTS Content Review
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Review and edit the generated TTS-friendly content. The
              left pane shows the current version (read-only), and the
              right pane shows the new version (editable).
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSaving}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Confirm & Save'}
            </button>
          </div>
        </div>

        {/* Labels + Font Size Controls */}
        <div className="mb-2 flex items-center">
          <div className="flex-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Current TTS Content (read-only)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={decreaseFontSize}
              disabled={fontSize <= MIN_FONT_SIZE}
              title="Decrease font size"
              aria-label="Decrease font size"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-gray-300 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              −
            </button>
            <span className="min-w-[3ch] text-center text-sm text-gray-500 dark:text-gray-400">
              {fontSize}px
            </span>
            <button
              onClick={increaseFontSize}
              disabled={fontSize >= MAX_FONT_SIZE}
              title="Increase font size"
              aria-label="Increase font size"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-gray-300 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              +
            </button>
          </div>
          <div className="flex-1 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
            New TTS Content (editable)
          </div>
        </div>

        {/* Merge View */}
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <CodeMirrorMerge
            theme={theme}
            orientation="a-b"
            highlightChanges
            gutter
          >
            <CodeMirrorMerge.Original
              value={contentState.oldTtsContent}
              extensions={[
                EditorView.editable.of(false),
                EditorView.lineWrapping,
                fontSizeTheme,
              ]}
            />
            <CodeMirrorMerge.Modified
              value={contentState.newTtsContent}
              extensions={[EditorView.lineWrapping, fontSizeTheme]}
              onChange={handleModifiedChange}
            />
          </CodeMirrorMerge>
        </div>

        {/* Bottom actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSaving}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Confirm & Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
