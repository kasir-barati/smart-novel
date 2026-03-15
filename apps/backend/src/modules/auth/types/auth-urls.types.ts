import { Field, ObjectType } from '@nestjs/graphql';

/**
 * @description New GraphQL type for the authUrls query response. Contains four URL fields: signIn (initiates OIDC login), signOut (ends the session), session (returns current session as JSON), and callback (the OIDC redirect URI handled by Auth.js after ZITADEL authentication). This replaces the old Login type which returned accessToken, expiresIn, tokenType, and refreshToken.
 */
@ObjectType({
  description:
    'URLs for Auth.js-powered authentication flows (OIDC Authorization Code + PKCE)',
})
export class AuthUrls {
  @Field(() => String, {
    description:
      'URL to redirect the browser to for initiating OIDC sign-in via Auth.js',
  })
  signIn: string;

  @Field(() => String, {
    description:
      'URL to redirect the browser to for signing out via Auth.js',
  })
  signOut: string;

  @Field(() => String, {
    description:
      'URL to fetch the current Auth.js session (returns JSON with user + tokens)',
  })
  session: string;

  @Field(() => String, {
    description:
      'OIDC callback URL handled by Auth.js after IdP redirect',
  })
  callback: string;
}
