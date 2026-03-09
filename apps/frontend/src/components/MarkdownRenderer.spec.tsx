import { fireEvent, render, screen } from '@testing-library/react';

import { MarkdownRenderer } from './MarkdownRenderer';

vi.mock('../hooks/useApi', () => ({
  useApi: () => ({
    api: {
      post: vi.fn(),
    },
  }),
}));

vi.mock('../hooks/useWordExplain', () => ({
  useWordExplain: () => ({
    explain: vi.fn(async () => ({
      data: {
        cacheKey: 'key',
        meaning: 'meaning',
        antonyms: [],
        synonyms: [],
        simplifiedExplanation: 'simple',
      },
    })),
  }),
}));

vi.mock('../utils/notification', () => ({
  showInfo: vi.fn(),
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width: 767px') ? false : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  const docWithCaret = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };

  if (!docWithCaret.caretRangeFromPoint) {
    Object.defineProperty(document, 'caretRangeFromPoint', {
      value: vi.fn(() => null),
    });
  }

  // Mock localStorage to prevent the tip from showing
  const localStorageMock = {
    getItem: vi.fn(() => '1'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // Mock Range.prototype.getBoundingClientRect to return a valid rect
  Range.prototype.getBoundingClientRect = vi.fn(() => ({
    x: 100,
    y: 100,
    width: 50,
    height: 20,
    top: 100,
    right: 150,
    bottom: 120,
    left: 100,
    toJSON: () => {},
  }));

  // Mock Range.prototype.getClientRects
  Range.prototype.getClientRects = vi.fn(() => {
    const rect = {
      x: 100,
      y: 100,
      width: 50,
      height: 20,
      top: 100,
      right: 150,
      bottom: 120,
      left: 100,
      toJSON: () => {},
    };
    return [rect] as any;
  });
});

describe('MarkdownRenderer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    try {
      vi.runOnlyPendingTimers();
    } catch {
      // Ignore if timers are not mocked
    }
    vi.useRealTimers();
  });

  it('does not render per-word spans', () => {
    const { container } = render(
      <MarkdownRenderer
        content={'Plain text with words to explain.'}
      />,
    );

    expect(container.querySelectorAll('span').length).toBe(0);
  });

  it('shows explain bubble after stable selection', async () => {
    // Use real timers for this test
    vi.useRealTimers();

    const { container } = render(
      <MarkdownRenderer content={'Hello world from chapter.'} />,
    );

    const paragraph = container.querySelector('p');
    expect(paragraph).toBeTruthy();

    const textNode = paragraph?.firstChild;
    expect(textNode).toBeTruthy();

    const range = document.createRange();
    range.setStart(textNode as Node, 0);
    range.setEnd(textNode as Node, 5);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    fireEvent(document, new Event('selectionchange'));

    expect(
      await screen.findByRole('button', { name: 'Explain' }),
    ).toBeTruthy();
  });

  it('ignores selections inside code blocks', () => {
    const { container } = render(
      <MarkdownRenderer content={'`const x = 10`'} />,
    );

    const codeNode = container.querySelector('code')?.firstChild;
    expect(codeNode).toBeTruthy();

    const range = document.createRange();
    range.setStart(codeNode as Node, 0);
    range.setEnd(codeNode as Node, 5);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    fireEvent(document, new Event('selectionchange'));
    vi.advanceTimersByTime(460);

    expect(
      screen.queryByRole('button', { name: 'Explain' }),
    ).toBeNull();
  });
});
