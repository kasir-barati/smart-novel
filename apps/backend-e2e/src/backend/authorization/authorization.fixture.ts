import axios from 'axios';

export class AuthorizationFixture {
  async login(email: string, password: string): Promise<string> {
    const { data } = await axios.post('/graphql', {
      query: `#graphql
        mutation($input: LoginInput!) {
          login(input: $input) {
            accessToken
            tokenType
          }
        }
      `,
      variables: {
        input: {
          email,
          password,
        },
      },
    });

    return `${data.data.login.tokenType} ${data.data.login.accessToken}`;
  }
}
