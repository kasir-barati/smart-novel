import axios from 'axios';

import { AuthorizationFixture } from '../support';

describe('Auth (e2e)', () => {
  it('should return user info when authenticated with PAT', async () => {
    const token = AuthorizationFixture.getBotAuthHeader();

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
    expect(data.data.whoAmI.orgId).toBeNull();
    expect(data.data.whoAmI).toStrictEqual(
      expect.objectContaining({
        sub: expect.any(String),
        email: expect.any(String),
        emailVerified: expect.any(Boolean),
        roles: expect.any(Array),
      }),
    );
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
    expect(data.errors[0].message).toContain(
      'Missing Bearer token in Authorization header',
    );
  });
});
