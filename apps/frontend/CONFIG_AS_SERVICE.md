# Config as Service

Great question. In Vite, `import.meta.env` values are **inlined at build time**. If you want “**config as a service**” (something you can inject/use consistently across your React app, and optionally override at **runtime** without rebuilding), you can layer it like this:

- **Level 1 — Static config service** (typed, validated, and easy to import)
- **Level 2 — React Context provider/hook** (injects config via DI-like pattern)
- **Level 3 — Runtime config** (override with `window.__APP_CONFIG__` or `/config.json` so you **don't** need a rebuild for each environment)
- **Optional — Docker/K8s friendly** runtime injection script

Below are concise, production-ready patterns for each level. Pick the one that matches your needs (many teams use Levels 1+3 together).

---

## Level 1: A typed, validated “Config Service” module

**Goal:** Centralize reading `import.meta.env`, validate it once, and export a frozen config object or a service class.

> ⚠️ Remember: anything in the browser is public. Don't put secrets here.

**`src/config/schema.ts`** (using Zod for validation; replace with your favorite validator if you like):

```ts
// src/config/schema.ts
import { z } from 'zod';

export const ConfigSchema = z.object({
  OIDC_CLIENT_ID: z
    .string()
    .min(1, 'VITE_OIDC_CLIENT_ID is required'),
  OIDC_AUTHORITY: z.string().url('VITE_OIDC_AUTHORITY must be a URL'),
  OIDC_REDIRECT_URI: z.string().url(),
  OIDC_SCOPE: z.string().min(1),
  // Add your own app config below
  API_BASE_URL: z.string().url().default('http://localhost:3000'),
  LOG_LEVEL: z
    .enum(['silent', 'error', 'warn', 'info', 'debug'])
    .default('info'),
});

export type AppConfig = z.infer<typeof ConfigSchema>;
```

**`src/config/index.ts`** (map `import.meta.env` → normalized, validated config):

```ts
// src/config/index.ts
import { ConfigSchema, type AppConfig } from './schema';

// Map import.meta.env to your canonical keys
const raw = {
  OIDC_CLIENT_ID: import.meta.env.VITE_OIDC_CLIENT_ID,
  OIDC_AUTHORITY: import.meta.env.VITE_OIDC_AUTHORITY,
  OIDC_REDIRECT_URI:
    import.meta.env.VITE_OIDC_REDIRECT_URI ??
    `${window.location.origin}/auth/callback`,
  OIDC_SCOPE:
    import.meta.env.VITE_OIDC_SCOPE ?? 'openid profile email',
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  LOG_LEVEL: (import.meta.env.VITE_LOG_LEVEL ?? 'info') as string,
};

const parsed = ConfigSchema.safeParse(raw);
if (!parsed.success) {
  // Give a clear message early during startup
  // eslint-disable-next-line no-console
  console.error(
    '❌ Invalid app configuration:',
    parsed.error.format(),
  );
  throw new Error('Invalid app configuration');
}

export const config: Readonly<AppConfig> = Object.freeze(parsed.data);

// Optional: a tiny service wrapper (handy for future runtime overrides)
export class ConfigService {
  private readonly cfg: Readonly<AppConfig>;
  constructor(initial: Readonly<AppConfig>) {
    this.cfg = initial;
  }
  get(): Readonly<AppConfig> {
    return this.cfg;
  }
}

export const configService = new ConfigService(config);
```

**Usage anywhere:**

```ts
import { configService } from '@/config';

const cfg = configService.get();
console.log(cfg.API_BASE_URL, cfg.OIDC_CLIENT_ID);
```

---

## Level 2: Provide as a React Context (DI-like)

**`src/config/ConfigContext.tsx`**

```tsx
import { createContext, useContext } from 'react';
import type { AppConfig } from './schema';

const ConfigContext = createContext<AppConfig | null>(null);

export function ConfigProvider({
  value,
  children,
}: {
  value: AppConfig;
  children: React.ReactNode;
}) {
  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): AppConfig {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error('useConfig must be used within <ConfigProvider>');
  }
  return ctx;
}
```

**`src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import { config } from '@/config';
import { ConfigProvider } from '@/config/ConfigContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider value={config}>
      <App />
    </ConfigProvider>
  </StrictMode>,
);
```

**Usage:**

```tsx
import { useConfig } from '@/config/ConfigContext';

export function Example() {
  const { API_BASE_URL, LOG_LEVEL } = useConfig();
  // ...
  return null;
}
```

---

## Level 3: Add **runtime overrides** (no rebuild per environment)

If you want to deploy the **same build** to different environments (Docker, Kubernetes, etc.) and inject config **at container start**, you can merge `import.meta.env` with a **runtime object**:

### Option A — `window.__APP_CONFIG__` via a small JS file

1.  **Create** `public/app-config.js` (this file ships as-is):

```js
// public/app-config.js
window.__APP_CONFIG__ = {
  API_BASE_URL: 'http://localhost:3000',
  LOG_LEVEL: 'info',
  // You can also override OIDC_... here if needed (they're public anyway)
  // OIDC_AUTHORITY: 'http://localhost:8080',
};
```

2.  **Include it** in `index.html` **before** your app bundle:

3.  **Merge** runtime + build-time config:

```ts
// src/config/runtime.ts
import { ConfigSchema, type AppConfig } from './schema';

// Declare the global for TypeScript
declare global {
  interface Window {
    __APP_CONFIG__?: Partial<AppConfig>;
  }
}

export function createConfigFrom(
  buildEnv: Partial<AppConfig>,
  runtime: Partial<AppConfig> = window.__APP_CONFIG__ ?? {},
): Readonly<AppConfig> {
  const merged: Partial<AppConfig> = {
    ...buildEnv,
    ...runtime,
  };

  const parsed = ConfigSchema.safeParse(merged);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error(
      '❌ Invalid merged runtime configuration:',
      parsed.error.format(),
    );
    throw new Error('Invalid merged runtime configuration');
  }
  return Object.freeze(parsed.data);
}
```

**Use it in `main.tsx`:**

```tsx
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import { ConfigProvider } from '@/config/ConfigContext';
import { createConfigFrom } from '@/config/runtime';

// Map import.meta.env to AppConfig keys (same mapping as Level 1)
const buildEnv = {
  OIDC_CLIENT_ID: import.meta.env.VITE_OIDC_CLIENT_ID,
  OIDC_AUTHORITY: import.meta.env.VITE_OIDC_AUTHORITY,
  OIDC_REDIRECT_URI:
    import.meta.env.VITE_OIDC_REDIRECT_URI ??
    `${window.location.origin}/auth/callback`,
  OIDC_SCOPE:
    import.meta.env.VITE_OIDC_SCOPE ?? 'openid profile email',
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  LOG_LEVEL: (import.meta.env.VITE_LOG_LEVEL ?? 'info') as string,
} as const;

const config = createConfigFrom(buildEnv);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider value={config}>
      <App />
    </ConfigProvider>
  </StrictMode>,
);
```

### Option B — Fetch `/config.json` before rendering (TLA)

If you prefer JSON:

1.  Put a **mutable** `public/config.json`:

```json
{
  "API_BASE_URL": "http://localhost:3000",
  "LOG_LEVEL": "info"
}
```

2.  Load it **before** rendering (Vite supports top‑level await in ESM):

```tsx
// src/bootstrap.ts
import { ConfigSchema, type AppConfig } from '@/config/schema';

export async function loadRuntimeJson(): Promise<Partial<AppConfig>> {
  try {
    const res = await fetch('/config.json', { cache: 'no-store' });
    if (!res.ok) return {};
    return (await res.json()) as Partial<AppConfig>;
  } catch {
    return {};
  }
}
```

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import { ConfigProvider } from '@/config/ConfigContext';
import { createConfigFrom } from '@/config/runtime';
import { loadRuntimeJson } from '@/bootstrap';

// Build-time map as before
const buildEnv = {
  OIDC_CLIENT_ID: import.meta.env.VITE_OIDC_CLIENT_ID,
  OIDC_AUTHORITY: import.meta.env.VITE_OIDC_AUTHORITY,
  OIDC_REDIRECT_URI:
    import.meta.env.VITE_OIDC_REDIRECT_URI ??
    `${window.location.origin}/auth/callback`,
  OIDC_SCOPE:
    import.meta.env.VITE_OIDC_SCOPE ?? 'openid profile email',
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  LOG_LEVEL: (import.meta.env.VITE_LOG_LEVEL ?? 'info') as string,
} as const;

const runtimeJson = await loadRuntimeJson();
const config = createConfigFrom(buildEnv, runtimeJson);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider value={config}>
      <App />
    </ConfigProvider>
  </StrictMode>,
);
```

---

## Docker/Kubernetes friendly runtime injection

When serving static files (e.g., Nginx), you can **write `app-config.js` at container start** from environment variables:

**`docker/entrypoint.sh`**

```sh
#!/usr/bin/env sh
set -e

# Default if not provided
: "${API_BASE_URL:=http://localhost:3000}"
: "${LOG_LEVEL:=info}"

cat > /usr/share/nginx/html/app-config.js <<EOF
window.__APP_CONFIG__ = {
  API_BASE_URL: "${API_BASE_URL}",
  LOG_LEVEL: "${LOG_LEVEL}"
};
EOF

exec "$@"
```

Then in your Dockerfile:

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
```

This lets you reuse the same build artifact across environments.

---

## Testing

For unit tests, you can easily **stub the config**:

```ts
// test/setupConfig.ts
import { vi } from 'vitest';

vi.mock('@/config', () => ({
  config: {
    OIDC_CLIENT_ID: 'test',
    OIDC_AUTHORITY: 'http://example.com',
    OIDC_REDIRECT_URI: 'http://localhost/cb',
    OIDC_SCOPE: 'openid',
    API_BASE_URL: 'http://api.test',
    LOG_LEVEL: 'silent',
  },
  configService: {
    get: () => ({
      OIDC_CLIENT_ID: 'test',
      OIDC_AUTHORITY: 'http://example.com',
      OIDC_REDIRECT_URI: 'http://localhost/cb',
      OIDC_SCOPE: 'openid',
      API_BASE_URL: 'http://api.test',
      LOG_LEVEL: 'silent',
    }),
  },
}));
```

---

## Common gotchas

- **Env placement** in monorepos: either put `.env*` in the app root, or set `envDir` in `vite.config.ts`.
- **Prefixes**: Only variables with `VITE_` prefix are exposed to the client by default.
- **Restart dev server** when changing env files.
- **All client config is public**—no secrets.

---

### Which one should you pick?

- If you only need build-time values → **Level 1** is enough.
- If you want proper injection/testing ergonomics → add **Level 2**.
- If you deploy the same build to different envs without rebuilding → add **Level 3**.

---

If you tell me:

- whether you're deploying via Docker/K8s,
- if you need **runtime** overrides or only build-time,
- and whether you prefer JSON or a JS shim for runtime,

I'll tailor the exact folder structure and code for your project (and wire it into your current OIDC setup).

## Simpler Solution

If you just want something **simple that you can import/use in hooks and components**—no extra libraries, no runtime loader—use a **tiny config module + a tiny hook**. You'll get:

- **One import** anywhere: `import { useConfig } from '@/config'`.
- **Typed, frozen config** (so it doesn't change unexpectedly).
- **Early errors** if a required env var is missing.

> ⚠️ Reminder: anything in the browser is public—don't put secrets in client config.

---

## 1) Minimal “config service” + hook (no Context)

**`src/config.ts`**

```ts
// src/config.ts
export type AppConfig = {
  OIDC_CLIENT_ID: string;
  OIDC_AUTHORITY: string;
  OIDC_REDIRECT_URI: string;
  OIDC_SCOPE: string;
  API_BASE_URL: string;
  LOG_LEVEL: 'silent' | 'error' | 'warn' | 'info' | 'debug';
};

// Small helper to fail fast on missing required vars
function required(name: string, v: unknown): string {
  if (typeof v !== 'string' || v.trim() === '') {
    throw new Error(`Missing required env: ${name}`);
  }
  return v;
}

const _config: AppConfig = Object.freeze({
  OIDC_CLIENT_ID: required(
    'VITE_OIDC_CLIENT_ID',
    import.meta.env.VITE_OIDC_CLIENT_ID,
  ),
  OIDC_AUTHORITY: required(
    'VITE_OIDC_AUTHORITY',
    import.meta.env.VITE_OIDC_AUTHORITY,
  ),
  OIDC_REDIRECT_URI:
    import.meta.env.VITE_OIDC_REDIRECT_URI ??
    `${window.location.origin}/auth/callback`,
  OIDC_SCOPE:
    import.meta.env.VITE_OIDC_SCOPE ?? 'openid profile email',
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  LOG_LEVEL: (import.meta.env.VITE_LOG_LEVEL ??
    'info') as AppConfig['LOG_LEVEL'],
});

export const config = _config;

// Ultra-simple hook so usage looks idiomatic in components/hooks
export function useConfig(): Readonly<AppConfig> {
  return config;
}
```

### Use it anywhere

**Inside a component:**

```tsx
import { useConfig } from '@/config';

export function ProfileButton() {
  const { API_BASE_URL, LOG_LEVEL } = useConfig();
  // use them as needed
  return null;
}
```

**Wire into your OIDC setup (example):**

```ts
import { config } from '@/config';
import type { AuthProviderProps } from 'react-oidc-context';

export const oidcConfig: AuthProviderProps = {
  client_id: config.OIDC_CLIENT_ID,
  authority: config.OIDC_AUTHORITY,
  redirect_uri: config.OIDC_REDIRECT_URI,
  scope: config.OIDC_SCOPE,
  response_type: 'code',
  // ... your other props
};
```

That's it. No Context, no runtime merging. Super small.

---

## 2) (Optional) Minimal Context to support **easy testing/overrides**

If you want to **override config in tests** or at the very app root (without rebuilding), add a tiny Context—still simple:

**`src/config/context.tsx`**

```tsx
import { createContext, useContext } from 'react';
import type { AppConfig } from './config';

const Ctx = createContext<AppConfig | null>(null);

export function ConfigProvider({
  value,
  children,
}: {
  value: AppConfig;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConfig(): AppConfig {
  const v = useContext(Ctx);
  if (!v)
    throw new Error('useConfig must be used within <ConfigProvider>');
  return v;
}
```

**`src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import { config } from '@/config';
import { ConfigProvider } from '@/config/context';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider value={config}>
      <App />
    </ConfigProvider>
  </StrictMode>,
);
```

**Test override example (Vitest/Jest):**

```ts
import { render } from '@testing-library/react';
import { ConfigProvider } from '@/config/context';
import type { AppConfig } from '@/config';

const testConfig: AppConfig = {
  OIDC_CLIENT_ID: 'test',
  OIDC_AUTHORITY: 'http://auth.test',
  OIDC_REDIRECT_URI: 'http://app.test/cb',
  OIDC_SCOPE: 'openid',
  API_BASE_URL: 'http://api.test',
  LOG_LEVEL: 'silent',
};

render(
  <ConfigProvider value={testConfig}>
    <YourComponent />
  </ConfigProvider>
);
```

---

## 3) Hook for building your OIDC props (optional sugar)

If you want to reuse a ready-to-go object:

```ts
// src/oidc/useOidcConfig.ts
import type { AuthProviderProps } from 'react-oidc-context';
import { useConfig } from '@/config';

export function useOidcConfig(): AuthProviderProps {
  const cfg = useConfig();
  return {
    client_id: cfg.OIDC_CLIENT_ID,
    authority: cfg.OIDC_AUTHORITY,
    redirect_uri: cfg.OIDC_REDIRECT_URI,
    scope: cfg.OIDC_SCOPE,
    response_type: 'code',
    onSigninCallback: () => {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname,
      );
    },
  };
}
```

**Then in `main.tsx`:**

```tsx
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import { AuthProvider } from 'react-oidc-context';
import { useOidcConfig } from '@/oidc/useOidcConfig';

function Root() {
  const oidc = useOidcConfig();
  return (
    <AuthProvider {...oidc}>
      <App />
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
```

---

### Pick your minimal

- **Simplest possible:** just `config.ts` and `useConfig()` (no Context).
- **Slightly more flexible:** add the tiny `ConfigProvider` if you need test overrides.

If you tell me whether you want **test-time overrides** (or just a single static config), I'll trim it down even further and drop in code that matches your current file structure (and your OIDC snippet).
