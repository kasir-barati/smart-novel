/**
 * @fileoverview
 * Bootstraps OpenTelemetry in the browser. Must be imported as the very first statement in `main.tsx` so the SDK and `FetchInstrumentation` are wired before any module makes a `fetch()` call.
 *
 * Wiring:
 * - Processors: send the spans to the OpenTelemetry Collector.
 * - Propagators mirror the backend.
 * - `FetchInstrumentation` patches `window.fetch` so every request gets a span and propagated headers.
 */

import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

import { graphqlSpanRenameFetchHook } from './lib/graphql-span-rename-hook';

const VITE_OTLP_ENDPOINT = import.meta.env.VITE_OTLP_ENDPOINT;
const VITE_SERVICE_NAME = import.meta.env.VITE_SERVICE_NAME;
const VITE_SERVICE_VERSION = import.meta.env.VITE_SERVICE_VERSION;

if (!VITE_OTLP_ENDPOINT) {
  throw new Error(
    'VITE_OTLP_ENDPOINT environment variable is not defined',
  );
}

const exporter = new OTLPTraceExporter({
  url: `${VITE_OTLP_ENDPOINT}/v1/traces`,
});
const provider = new WebTracerProvider({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: VITE_SERVICE_NAME ?? 'smart-novel-frontend',
    [ATTR_SERVICE_VERSION]: VITE_SERVICE_VERSION ?? 'unknown',
  }),
  spanProcessors: [new BatchSpanProcessor(exporter)],
});

provider.register({
  propagator: new CompositePropagator({
    propagators: [
      new W3CTraceContextPropagator(),
      new W3CBaggagePropagator(),
    ],
  }),
});

registerInstrumentations({
  tracerProvider: provider,
  instrumentations: [
    new FetchInstrumentation({
      requestHook: graphqlSpanRenameFetchHook,
    }),
  ],
});
