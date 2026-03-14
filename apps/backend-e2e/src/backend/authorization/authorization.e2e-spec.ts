import axios from 'axios';

import { AuthorizationFixture } from './authorization.fixture';

describe('Authorization (e2e)', () => {
  let fixture: AuthorizationFixture;

  beforeAll(() => {
    fixture = new AuthorizationFixture();
  });

  it('should generate a token', async () => {
    const { data, status } = await axios.post('/graphql', {
      query: `#graphql
        mutation($input: LoginInput!) {
          login(input: $input) {
            accessToken
            expiresIn
            tokenType
          }
        }
      `,
      variables: {
        input: {
          email: 'admin@test.com',
          password: 'Admin123!',
        },
      },
    });

    expect(status).toBe(200);
    expect(data.data.login).toStrictEqual({
      accessToken: expect.any(String),
      expiresIn: 3600,
      tokenType: 'Bearer',
    });
  });

  it('should return user info', async () => {
    const token = await fixture.login('admin@test.com', 'Admin123!');

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
      email: 'admin@test.com',
      emailVerified: true,
      orgId: expect.any(String),
      roles: expect.any(Array),
    });
  });
});
