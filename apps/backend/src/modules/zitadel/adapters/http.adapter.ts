import type { ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';

import { Readable } from 'node:stream';

import type { AuthenticatedRequest } from '../interfaces';

export class HttpAdapter {
  /**
   * @description Extracts the native HTTP request object from the NestJS execution context.
   * The request is intersected with AuthenticatedRequest to ensure user
   * details are available.
   */
  getRequest(context: ExecutionContext): AuthenticatedRequest {
    return context
      .switchToHttp()
      .getRequest<Request>() as unknown as AuthenticatedRequest;
  }

  /**
   * @description Extracts the native HTTP response object from the NestJS execution context.
   */
  getResponse(context: ExecutionContext): Response {
    return context.switchToHttp().getResponse<Response>();
  }

  /**
   * @description Retrieves the request protocol ('http' or 'https').
   */
  getProtocol(request: Request): string {
    return request.protocol;
  }

  /**
   * @description Retrieves the host name from the request.
   */
  getHost(request: Request): string {
    return request.get('host') ?? 'localhost';
  }

  /**
   * @description Retrieves the URL from the request.
   */
  getUrl(request: Request): string {
    return request.originalUrl;
  }

  /**
   * @description Retrieves the HTTP method from the request (e.g., 'GET', 'POST').
   */
  getMethod(request: Request): string {
    return request.method;
  }

  /**
   * @description Retrieves all headers from the request.
   */
  getHeaders(
    request: Request,
  ): Record<string, string | string[] | undefined> {
    return request.headers;
  }

  /**
   * @description Retrieves the raw 'cookie' header string from the request.
   */
  getCookie(request: Request): string | undefined {
    return request.headers.cookie;
  }

  /**
   * @description Retrieves the body from the request.
   */
  getBody(request: Request): unknown {
    return request.body;
  }

  /**
   * @description Sets a header on the response.
   */
  setHeader(
    response: Response,
    name: string,
    value: string | string[],
  ): void {
    response.setHeader(name, value);
  }

  /**
   * @description Sets the HTTP status code on the response.
   */
  setStatus(response: Response, code: number): void {
    response.status(code);
  }

  /**
   * @description Sends the final response to the client.
   * Accepts text, binary buffers, or streaming bodies.
   */
  send(response: Response, body: string | Buffer | Readable): void {
    if (typeof body === 'string' || Buffer.isBuffer(body)) {
      response.send(body);
    } else {
      body.pipe(response);
    }
  }
}
