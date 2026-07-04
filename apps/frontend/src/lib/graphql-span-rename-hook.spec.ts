import type { Span } from '@opentelemetry/api';

import { graphqlSpanRenameFetchHook } from './graphql-span-rename-hook';

function createSpan(): Span {
  return {
    updateName: vi.fn(),
    setAttribute: vi.fn(),
  } as unknown as Span;
}

function asRequestInit(body: unknown): RequestInit {
  return {
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

describe(graphqlSpanRenameFetchHook.name, () => {
  it.each([
    {
      label: 'named query',
      query:
        'query GetNovels($first: Int) { novelsConnection(first: $first) { __typename } }',
      expectedName: 'query GetNovels',
      expectedType: 'query',
      expectedOperation: 'GetNovels',
    },
    {
      label: 'named mutation',
      query:
        'mutation CreateNovel($input: CreateNovelInput!) { createNovel(input: $input) { id } }',
      expectedName: 'mutation CreateNovel',
      expectedType: 'mutation',
      expectedOperation: 'CreateNovel',
    },
    {
      label: 'named subscription',
      query:
        'subscription ChapterNarrationUpdated($id: ID!) { chapterNarrationUpdated(id: $id) { status } }',
      expectedName: 'subscription ChapterNarrationUpdated',
      expectedType: 'subscription',
      expectedOperation: 'ChapterNarrationUpdated',
    },
    {
      label: 'anonymous typed query',
      query: 'query { hello }',
      expectedName: 'query hello',
      expectedType: 'query',
      expectedOperation: 'hello',
    },
    {
      label: 'anonymous shorthand query',
      query: '{ ping }',
      expectedName: 'query ping',
      expectedType: 'query',
      expectedOperation: 'ping',
    },
    {
      label: 'query with leading comment',
      query: '# fetch novels\nquery GetNovels { id }',
      expectedName: 'query GetNovels',
      expectedType: 'query',
      expectedOperation: 'GetNovels',
    },
  ])(
    'should rename the span for $label',
    ({ query, expectedName, expectedType, expectedOperation }) => {
      const span = createSpan();

      graphqlSpanRenameFetchHook(
        span,
        asRequestInit({ query, variables: {} }),
      );

      expect(span.updateName).toHaveBeenCalledWith(expectedName);
      expect(span.setAttribute).toHaveBeenCalledWith(
        'graphql.operation.type',
        expectedType,
      );
      expect(span.setAttribute).toHaveBeenCalledWith(
        'graphql.operation.name',
        expectedOperation,
      );
    },
  );

  it('should be a no-op when the body is not a JSON string', () => {
    const span = createSpan();

    graphqlSpanRenameFetchHook(span, { body: undefined });

    expect(span.updateName).not.toHaveBeenCalled();
    expect(span.setAttribute).not.toHaveBeenCalled();
  });

  it('should be a no-op when the body is malformed JSON', () => {
    const span = createSpan();

    graphqlSpanRenameFetchHook(span, { body: 'not json' });

    expect(span.updateName).not.toHaveBeenCalled();
  });

  it('should be a no-op when the body lacks a query field', () => {
    const span = createSpan();

    graphqlSpanRenameFetchHook(
      span,
      asRequestInit({ variables: {} }),
    );

    expect(span.updateName).not.toHaveBeenCalled();
  });

  it('should be a no-op when the query is unparseable', () => {
    const span = createSpan();

    graphqlSpanRenameFetchHook(
      span,
      asRequestInit({ query: 'totally not a graphql doc' }),
    );

    expect(span.updateName).not.toHaveBeenCalled();
  });

  it('should be a no-op when the request is a Request instance (body unreadable)', () => {
    const span = createSpan();

    graphqlSpanRenameFetchHook(
      span,
      new Request('http://localhost/graphql', { method: 'POST' }),
    );

    expect(span.updateName).not.toHaveBeenCalled();
  });
});
