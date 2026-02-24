import { fireEvent, render, screen } from '@testing-library/react';

import { MarkdownRenderer } from './MarkdownRenderer';

jest.mock('../hooks/useApi', () => ({
  useApi: () => ({
    api: {
      post: jest.fn(),
    },
  }),
}));

jest.mock('../hooks/useWordExplain', () => ({
  useWordExplain: () => ({
    explain: jest.fn(async () => ({
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

jest.mock('../utils/notification', () => ({
  showInfo: jest.fn(),
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width: 767px') ? false : false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  const docWithCaret = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };

  if (!docWithCaret.caretRangeFromPoint) {
    Object.defineProperty(document, 'caretRangeFromPoint', {
      value: jest.fn(() => null),
    });
  }
});

describe('MarkdownRenderer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
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
    jest.advanceTimersByTime(460);

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
    jest.advanceTimersByTime(460);

    expect(
      screen.queryByRole('button', { name: 'Explain' }),
    ).toBeNull();
  });
});
