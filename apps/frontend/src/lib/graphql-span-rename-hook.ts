import type { Span } from '@opentelemetry/api';

/**
 * @description extracts the operation type and name from a raw GraphQL query string. The trace root span is named after the operation instead of the generic `HTTP POST`.
 *
 * Heuristic-only — no full GraphQL parser. The codegen always emits documents that start with either `<type> <name>` or a top-level `{` (anonymous shorthand). For everything else we fall back to `null` and let the operation document itself carry the detail via attributes.
 */
function parseOperation(
  query: string,
): { type: string; name: string } | null {
  const stripped = query.replace(/#[^\n]*\n/g, '').trim();

  // Named operation: `query GetNovels(...)`, `mutation Foo { ... }`, `subscription Bar { ... }`.
  const named = stripped.match(
    /^(query|mutation|subscription)\s+([A-Za-z_][A-Za-z0-9_]*)/,
  );
  if (named) {
    return { type: named[1], name: named[2] };
  }

  // Anonymous operation: `query { foo }` or `{ foo }` (shorthand defaults to query).
  const anonymousTyped = stripped.match(
    /^(query|mutation|subscription)\s*\{\s*([A-Za-z_][A-Za-z0-9_]*)/,
  );
  if (anonymousTyped) {
    return { type: anonymousTyped[1], name: anonymousTyped[2] };
  }

  const anonymousShorthand = stripped.match(
    /^\{\s*([A-Za-z_][A-Za-z0-9_]*)/,
  );
  if (anonymousShorthand) {
    return { type: 'query', name: anonymousShorthand[1] };
  }

  return null;
}

function extractBody(request: Request | RequestInit): string | null {
  const body =
    request instanceof Request ? null : (request.body ?? null);

  return typeof body === 'string' ? body : null;
}

/**
 * @summary `FetchInstrumentation` request hook that renames every GraphQL request span from the generic `HTTP POST` to `query GetNovels`, `mutation CreateNovel`, etc.
 *
 * @description
 * Mirrors the backend's `graphqlSpanRenamePlugin`. Without this, every browser-originated GraphQL request shows up as `HTTP POST` in Jaeger and traces become indistinguishable.
 *
 * Runs inside the fetch instrumentation's `context.with(...)` callback, so the `span` argument is guaranteed to be the active fetch span — we don't depend on `trace.getActiveSpan()` (which the browser doesn't preserve across `await` without a `ZoneContextManager`).
 */
export function graphqlSpanRenameFetchHook(
  span: Span,
  request: Request | RequestInit,
): void {
  const body = extractBody(request);
  if (!body) {
    return;
  }

  let parsedBody: { query?: unknown };
  try {
    parsedBody = JSON.parse(body) as { query?: unknown };
  } catch {
    return;
  }

  if (typeof parsedBody.query !== 'string') {
    return;
  }

  const parsed = parseOperation(parsedBody.query);
  if (!parsed) {
    return;
  }

  span.updateName(`${parsed.type} ${parsed.name}`);
  span.setAttribute('graphql.operation.type', parsed.type);
  span.setAttribute('graphql.operation.name', parsed.name);
}
