import { EditorView } from '@codemirror/view';
import { useStore } from '@nanostores/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import CodeMirrorMerge from 'react-codemirror-merge';
import { useNavigate, useParams } from 'react-router-dom';

import { useApi } from '../../hooks/useApi';
import { $theme } from '../../stores/theme.store';
import { showApiError, showSuccess } from '../../utils/notification';
import {
  fetchChapterForTtsReview,
  generateTtsFriendlyText,
  updateChapterContent,
} from './tts.api';

interface TtsReviewState {
  loading: boolean;
  saving: boolean;
  error: string | null;
  originalContent: string;
  oldTtsContent: string;
  newTtsContent: string;
}

const initialState: TtsReviewState = {
  loading: true,
  saving: false,
  error: null,
  originalContent: '',
  oldTtsContent: '',
  newTtsContent: '',
};

const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 24;
const FONT_SIZE_STEP = 2;
const DEFAULT_FONT_SIZE = 14;

export function TtsReviewPage() {
  const { id: novelId, chapterId } = useParams<{
    id: string;
    chapterId: string;
  }>();
  const { api } = useApi();
  const navigate = useNavigate();
  const theme = useStore($theme);
  const [state, setState] = useState<TtsReviewState>(initialState);
  const editedContentRef = useRef<string>('');
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);

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

  useEffect(() => {
    if (!novelId || !chapterId) {
      return;
    }

    let cancelled = false;

    (async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const chapter = await fetchChapterForTtsReview(
          api,
          novelId,
          chapterId,
        );
        const generatedTts = await generateTtsFriendlyText(
          api,
          chapter.content,
        );

        if (cancelled) {
          return;
        }

        editedContentRef.current = generatedTts;
        setState((prev) => ({
          ...prev,
          loading: false,
          originalContent: chapter.content,
          oldTtsContent: chapter.ttsFriendlyContent ?? '',
          newTtsContent: generatedTts,
        }));
      } catch {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'Failed to generate TTS-friendly content',
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api, novelId, chapterId]);

  const handleModifiedChange = useCallback((value: string) => {
    editedContentRef.current = value;
  }, []);

  const handleConfirm = async () => {
    if (!chapterId) {
      return;
    }

    setState((prev) => ({ ...prev, saving: true }));

    try {
      await updateChapterContent(
        api,
        chapterId,
        state.originalContent,
        editedContentRef.current,
      );
      showSuccess('TTS-friendly content updated successfully');
      navigate(`/novel/${novelId}`);
    } catch {
      showApiError();
      setState((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleCancel = () => {
    navigate(`/novel/${novelId}`);
  };

  if (state.loading) {
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

  if (state.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="mb-4 text-red-600 dark:text-red-400">
            {state.error}
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
              disabled={state.saving}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={state.saving}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {state.saving ? 'Saving...' : 'Confirm & Save'}
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
              value={state.oldTtsContent}
              extensions={[
                EditorView.editable.of(false),
                EditorView.lineWrapping,
                fontSizeTheme,
              ]}
            />
            <CodeMirrorMerge.Modified
              value={state.newTtsContent}
              extensions={[EditorView.lineWrapping, fontSizeTheme]}
              onChange={handleModifiedChange}
            />
          </CodeMirrorMerge>
        </div>

        {/* Bottom actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={state.saving}
            className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={state.saving}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state.saving ? 'Saving...' : 'Confirm & Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
