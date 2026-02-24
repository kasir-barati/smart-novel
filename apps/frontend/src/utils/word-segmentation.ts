const unicodeWordRegex = /[\p{L}\p{M}\p{N}_'-]+/gu;

export interface WordSegmentResult {
  end: number;
  start: number;
  word: string;
}

export function findWordAtIndex(
  input: string,
  index: number,
  locale: string,
): WordSegmentResult | null {
  if (!input) {
    return null;
  }

  const safeIndex = Math.max(0, Math.min(index, input.length - 1));

  // Prefer Intl.Segmenter for locale-aware boundaries (e.g. CJK scripts).
  if ('Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(locale || 'en', {
      granularity: 'word',
    });

    for (const segment of segmenter.segment(input)) {
      const start = segment.index;
      const end = start + segment.segment.length;

      if (
        segment.isWordLike &&
        safeIndex >= start &&
        safeIndex < end
      ) {
        return { start, end, word: segment.segment };
      }
    }
  }

  // Unicode fallback for environments without Intl.Segmenter.
  for (const match of input.matchAll(unicodeWordRegex)) {
    const matchedWord = match[0];
    const start = match.index ?? 0;
    const end = start + matchedWord.length;

    if (safeIndex >= start && safeIndex < end) {
      return { start, end, word: matchedWord };
    }
  }

  return null;
}

export function normalizeWord(raw: string): string {
  return raw.trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

export function getWordFromText(
  input: string,
  locale: string,
): string | null {
  if (!input.trim()) {
    return null;
  }

  if ('Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(locale || 'en', {
      granularity: 'word',
    });

    for (const segment of segmenter.segment(input)) {
      if (segment.isWordLike) {
        const normalized = normalizeWord(segment.segment);
        if (normalized) {
          return normalized;
        }
      }
    }
  }

  const fallbackMatch = input.match(unicodeWordRegex);
  return fallbackMatch ? normalizeWord(fallbackMatch[0]) : null;
}
