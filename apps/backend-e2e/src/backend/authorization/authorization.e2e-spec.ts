import axios from 'axios';

import { AuthorizationFixture } from './authorization.fixture';

describe('Authorization (e2e)', () => {
  let fixture: AuthorizationFixture;

  beforeAll(() => {
    fixture = new AuthorizationFixture();
  });

  it('should return auth URLs for OIDC sign-in flow', async () => {
    const { data, status } = await axios.post('/graphql', {
      query: `#graphql
        query {
          authUrls {
            signIn
            signOut
            session
            callback
          }
        }
      `,
    });

    expect(status).toBe(200);
    expect(data.data.authUrls).toStrictEqual({
      signIn: expect.stringContaining('/auth/signin'),
      signOut: expect.stringContaining('/auth/signout'),
      session: expect.stringContaining('/auth/session'),
      callback: expect.stringContaining('/auth/callback/zitadel'),
    });
  });

  it.todo(
    'should return user info when authenticated with PAT',
    async () => {
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
    },
  );
});
