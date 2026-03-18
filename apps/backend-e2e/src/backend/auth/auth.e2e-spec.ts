import axios from 'axios';

import { AuthorizationFixture } from './auth.fixture';

describe('Auth (e2e)', () => {
  let fixture: AuthorizationFixture;

  beforeAll(() => {
    fixture = new AuthorizationFixture();
  });

  it('should return user info when authenticated with PAT', async () => {
    const token = fixture.getAuthHeader();

    const { status, data } = await axios.post(
      '/graphql',
      {
        query: `#graphql
          query {
            whoAmI {
              sub
              email
              emailVerified
              orgId
              roles
            }
          }
        `,
      },
      {
        headers: {
          Authorization: token,
        },
      },
    );

    expect(status).toBe(200);
    expect(data.data.whoAmI).toStrictEqual({
      sub: expect.any(String),
      email: expect.any(String),
      emailVerified: expect.any(Boolean),
      orgId: expect.any(String),
      roles: expect.any(Array),
    });
  });

  it('should reject unauthenticated requests to protected queries', async () => {
    const { data } = await axios.post('/graphql', {
      query: `#graphql
        query {
          whoAmI {
            sub
            email
          }
        }
      `,
    });

    // GraphQL returns 200 with errors array
    expect(data.errors).toBeDefined();
    expect(data.errors[0].message).toContain('Unauthorized');
  });
});
