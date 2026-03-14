# Test Conventions

- Use vitest.
- Use `it` instead of `test`.
- Use `it.each` whenever it make sense.
- Use jest-extended APIs whenever appropriate.
- Use AAA (Arrange, Act, Assert) style of writing test.
  - Use new line as an indicator of each step!
- Add fixtures only when it makes my tests more readable (but in general prefer to write them inside the test body).
- Try to mock using vitest instead of `@nestjs/testing`.
- Use `uut` as the name of main unit which we want to unit test.
- Always ask what we should and what we should **NOT** mock.
- For e2e tests make sure to keep the GraphQL queries/mutations written in the same test file.

## Unit Test Example

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

## E2E Test Example

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
