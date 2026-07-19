/**
 * `gql.tada` tag factory bound to Beatrice's introspected schema.
 *
 * House rule: do NOT hand-write `ResultOf<typeof DOC>['field']` aliases. Let the document type flow through — either return the whole `data` payload from your client method and destructure at the call site, or derive slices with `Awaited<ReturnType<typeof clientMethod>>['field']`.
 *
 * @example
 * ```ts
 * const EXPLAIN_WORD = graphql(`
 *   mutation ExplainWord($word: NonEmptyTrimmedString!, $context: NonEmptyTrimmedString!) {
 *     explainWord(word: $word, context: $context) { meaning }
 *   }
 * `);
 *
 * const { explainWord } = await runOperation(EXPLAIN_WORD, vars, opts);
 * //      ^? { meaning: string }   ← inferred, no manual type
 * ```
 */
import { initGraphQLTada } from 'gql.tada';

import type { introspection } from './graphql-env';

export const graphql = initGraphQLTada<{
  introspection: introspection;
  scalars: {
    // Beatrice's `NonEmptyTrimmedString` is a runtime-validated string. From the caller's perspective it is just a string.
    NonEmptyTrimmedString: string;
  };
}>();

// Re-exports kept for fragment-heavy code paths that legitimately need them (e.g. readFragment). They are NOT intended for manually carving up response types — see the module docstring.
export type { FragmentOf, ResultOf, VariablesOf } from 'gql.tada';
export { readFragment } from 'gql.tada';
