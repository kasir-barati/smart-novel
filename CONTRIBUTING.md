# Contributing to smart-novel

🚀 Quick Start

```bash
npm ci
cp .env.example .env
npm run start:dev
```

Then open:

- Frontend: http://localhost:8080
- GraphQL API: http://localhost:8080/graphql
- ZITADEL console: http://localhost:8080/ui/console/

BTW if you need DevTools such as Redis Insight, or PgAdmin you have to use the `compose.devtools.yml`:

```shell
docker compose -f compose.devtools.yml --profile dev up --build -d
```

- Open WebUI: http://localhost:8080/
- RedisInsight: http://localhost:5540/

## Prisma Migration Guide

### Development

To run migrations in development:

```bash
npx prisma migrate dev
```

#### Production

How migrations should be applied in a professional, production‑safe workflow? Since the Prisma CLI is a dev dependency and not available in the production container. Thus we need to apply migrations in our CI/CD Pipeline:

```bash
npx prisma migrate deploy --schema=./apps/backend/prisma/schema.prisma
```

## Design & Code Philosophy

All contributors (including AI-assisted tools) should follow the project's coding philosophy:

- Write code at a senior engineer level.
- Prefer early returns over nested conditionals.
- Optimize for readability and maintainability.
- Avoid unnecessary abstractions.
- Use descriptive variable, function, and class names.
- Follow linting, formatting, and test conventions.
- Use `retryAsync` instead of `try ... catch ...` block when it make sense:
  ```ts
  import { retryAsync } from 'nestjs-backend-common';
  const [error, someVar] = await retryAsync(() => someFunc(), {
    retry: 123,
  });
  ```
- Do **NOT** add a barrel `index.ts` in the "frontend" app, for a Vite-powered SPA you should **NOT** because:
  - Tree-shaking happens still for the production builds, but it **hurts dev server startup and HMR performance** because Vite eagerly transforms every module the barrel re-exports, even if you only need one.
  - When you do `import { getInitials } from '../../utils'`, Vite (and Rollup under the hood) has to parse the entire barrel to figure out what's exported.

## Test Conventions

To run tests:

```bash
# Run all e2e tests
nx e2e frontend-e2e

# Run all e2e tests
nx e2e backend-e2e
```

- If you change/add something make sure to write/update and then run the unit/e2e tests.
- Use vitest.
- Use `it` instead of `test`.
- Use `it.each` whenever it make sense.
- Use jest-extended APIs whenever appropriate.
- Use AAA (Arrange, Act, Assert) style of writing test.
  - Use new line as an indicator of each step!
- Add fixtures only when it makes my tests more readable (but in general prefer to write them inside the test body).
- Try to mock using vitest instead of `@nestjs/testing`.
- Use `uut` (unit under test) **only** when you instantiate an object whose **methods** you will exercise in the test. For example: `uut = MyService(...)` followed by `uut.do_something()`.
- When testing a **function** (or a constructor where you just assert on the returned value), name the variable after what it represents — e.g. `result`, `settings`, `payload`, etc. Do **not** call it `uut` in that case.
- Always ask what we should and what we should **NOT** mock.
- For e2e tests make sure to keep the GraphQL queries/mutations written in the same test file.
- Mocked values should resemble actual domain data (read the code to understand what would the actual domain data would look like):
  - Use realistic data (IDs, hashes, slugs, emails, URLs, etc.):
    ```ts
    const novelId = '93fec4bf-2f66-4e4a-9572-7aa4871f1458'; // ✅ DO (GOOD)
    const novelId = 'novel-id'; // ❌ DO NOT (BAD)
    ```
  - When data is excessively large, use a short meaningful stub:
    ```ts
    const html = '<html> ... trimmed ... </html>'; // ✅ DO (GOOD)
    const html = 'dummy'; // ❌ DO NOT (BAD)
    ```

### Unit Test Example

```ts
import { Model } from 'mongoose';

import { UserRepository } from './repositories';
import { UserDocument } from './schemas';

describe(UserRepository.name, () => {
  let uut: UserRepository;
  let userModel: Model<UserDocument>;

  beforeEach(() => {
    userModel = {
      findById: vi.fn(),
    } as any;
    uut = new UserRepository(userModel);
  });

  it('should return the user', async () => {
    vi.mocked(userModel).mockResolvedValue({
      _id: '69b13a073469bd6633c282b2',
    });

    await uut.getUser('69b13a073469bd6633c282b2');

    expect(userModel.findById).toHaveBeenCalledWith({
      _id: '69b13a073469bd6633c282b2',
    });
  });
});
```

### E2E Test Example

```ts
import axios from 'axios';

describe('Hi (e2e)', () => {
  it('should say hi', async () => {
    const res = await axios.post('/graphql', {
      query: `#graphql
        query { hi }
      `,
    });

    expect(res.status).toBe(200);
    expect(res.data.data.hi).toBeString();
  });
});
```

And this is when e.g. the expect part needs prep work:

```ts
import axios from 'axios';

describe('Greet (e2e)', () => {
  let fixture: ChapterNarrationFixture;

  beforeEach(() => {
    fixture = new ChapterNarrationFixture();
    fixture.beforeEach();
  });

  it('should start chapter audio generation and return PROCESSING status', async () => {
    const res = await axios.post('/graphql', {
      query: `#graphql
        mutation {
          greet
        }
      `,
    });

    await fixture.thenTtsCalledOnceWith(correlationId);
  });
});
```

#### Run E2E Tests Locally

```bash
docker compose --profile frontend-e2e up -d --build --wait
npx cypress open --project apps/frontend-e2e
```

## Upgrading 3rd Party Libraries

Use [`npm-check-updates`](https://www.npmjs.com/package/npm-check-updates).

```bash
# List all packages with their latest version
ncu

# You can selectively upgrade
ncu --interactive

# Changes the versions in package.json
ncu -u

npm i
```

> [!TIP]
>
> **Should we use `--force` flag if `npm audit fix` did not work?**
>
> tl;dr would be no, just run `npm audit --omit=dev` and it might return zero security vulnerability.
>
> This is especially helpful when running `npm audit fix` cannot fix the security vulnerability issues and `npm audit` shows a list of security vulnerabilities that would be only fixed if you force your way (**not recommended**).
