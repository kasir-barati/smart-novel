import type { Request, Response } from 'express';

import { Readable } from 'node:stream';
import qs from 'qs';

import { HttpAdapter } from '../adapters';

// Narrow body type to what we actually use with fetch/Request in Node.
type RequestBody = string | Buffer;

/**
 * Converts an Express request into a standard Web API `Request` object
 * that can be passed to Auth.js core.
 */
export function toWebRequest(
  request: Request,
  adapter: HttpAdapter,
): globalThis.Request {
  const protocol = adapter.getProtocol(request);
  const host = adapter.getHost(request);
  const url = `${protocol}://${host}${adapter.getUrl(request)}`;

  const headers = new Headers();
  const rawHeaders = adapter.getHeaders(request) as Record<
    string,
    string | string[] | undefined
  >;

  Object.entries(rawHeaders).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => v && headers.append(key, v));
    } else if (value) {
      headers.append(key, value);
    }
  });

  const method = adapter.getMethod(request);
  const contentType = headers.get('content-type');

  let rawBody: RequestBody | undefined;

  if (!/GET|HEAD/.test(method.toUpperCase())) {
    const bodyData = adapter.getBody(request);

    if (bodyData !== undefined && bodyData !== null) {
      if (
        contentType?.includes('application/x-www-form-urlencoded')
      ) {
        rawBody = qs.stringify(bodyData as Record<string, unknown>, {
          arrayFormat: 'repeat',
        });
      } else if (contentType?.includes('application/json')) {
        rawBody = JSON.stringify(bodyData);
      } else if (Buffer.isBuffer(bodyData)) {
        rawBody = bodyData;
      } else if (typeof bodyData === 'string') {
        rawBody = bodyData;
      } else if (typeof bodyData === 'object') {
        // Fallback for object bodies without a proper content-type.
        rawBody = qs.stringify(bodyData as Record<string, unknown>, {
          arrayFormat: 'repeat',
        });
      }
    }
  }

  const body =
    rawBody && Buffer.isBuffer(rawBody)
      ? new Uint8Array(rawBody)
      : rawBody;

  return new Request(url, {
    method,
    headers,
    body,
  });
}

/**
 * Maps a standard Web API `Response` object to an Express response.
 */
export async function toHttpResponse(
  webResponse: globalThis.Response,
  res: Response,
  adapter: HttpAdapter,
): Promise<void> {
  // Build headers without using Headers.entries() to avoid dom.iterable dependency issues.
  const groupedHeaders: Record<string, string | string[]> = {};

  webResponse.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'set-cookie') {
      const existing = groupedHeaders[lowerKey];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else if (existing) {
        groupedHeaders[lowerKey] = [existing, value];
      } else {
        groupedHeaders[lowerKey] = [value];
      }
    } else {
      groupedHeaders[key] = value;
    }
  });

  Object.entries(groupedHeaders).forEach(([key, value]) => {
    adapter.setHeader(res, key, value);
  });

  adapter.setStatus(res, webResponse.status);

  const body = webResponse.body;
  if (body) {
    const reader = body.getReader();
    const nodeStream = Readable.from(
      (async function* () {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              yield Buffer.from(value);
            }
          }
        } finally {
          reader.releaseLock();
        }
      })(),
    );

    adapter.send(res, nodeStream);
  } else {
    const text = await webResponse.text();
    adapter.send(res, text);
  }
}
